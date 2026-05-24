import { editDraft, critiqueDraft, draftReport, planResearch, researchSources, validatePipelineInput } from "./agents.js";
import { auditCitations } from "./citations.js";
import { resolveProvider } from "./providers.js";
import type {
  AgentTraceEntry,
  ModelClient,
  PipelineInput,
  PipelineMetadata,
  PipelineOptions,
  PipelineReport
} from "./types.js";

export async function runResearchWriterPipeline(
  input: PipelineInput,
  options: PipelineOptions = {}
): Promise<PipelineReport> {
  validatePipelineInput(input);

  const provider = resolveProvider(options);

  if (provider.provider === "deterministic") {
    return runDeterministicPipeline(input, provider.fallbackReason);
  }

  try {
    return await runPipeline(input, {
      provider: "openai",
      ...(provider.model ? { model: provider.model } : {}),
      ...(provider.modelClient ? { modelClient: provider.modelClient } : {})
    });
  } catch (error) {
    return runDeterministicPipeline(input, `OpenAI provider failed: ${errorMessage(error)}`);
  }
}

async function runDeterministicPipeline(
  input: PipelineInput,
  fallbackReason?: string
): Promise<PipelineReport> {
  return runPipeline(input, {
    provider: "deterministic",
    ...(fallbackReason ? { fallbackReason } : {})
  });
}

async function runPipeline(
  input: PipelineInput,
  options: {
    provider: "deterministic" | "openai";
    model?: string;
    modelClient?: ModelClient;
    fallbackReason?: string;
  }
): Promise<PipelineReport> {
  const trace: AgentTraceEntry[] = [];

  const plan = planResearch(input);
  trace.push({
    agent: "planner",
    mode: "deterministic",
    status: "completed",
    summary: `Created ${plan.sections.length} report sections.`
  });

  const researchNotes = researchSources(input, plan);
  trace.push({
    agent: "researcher",
    mode: "deterministic",
    status: "completed",
    summary: `Collected ${researchNotes.length} local source-backed notes.`
  });

  const draft = draftReport(input, plan, researchNotes);
  const critique = critiqueDraft(draft);
  trace.push({
    agent: "critic",
    mode: "deterministic",
    status: "completed",
    summary: `Found ${critique.requiredEdits.length} required edits and ${critique.warnings.length} warnings.`
  });

  const final = await editDraft(input, draft, critique, options.modelClient);
  trace.push({
    agent: "editor",
    mode: options.modelClient ? "openai" : "deterministic",
    status: "completed",
    summary: options.modelClient
      ? "Applied model-assisted editorial pass while preserving citations."
      : "Applied deterministic editorial pass."
  });

  const audit = auditCitations(final.claims, input.sourceCards);
  trace.push({
    agent: "citation-auditor",
    mode: "deterministic",
    status: "completed",
    summary: audit.passed
      ? "All final claims cite known source cards."
      : `Found ${audit.issues.length} citation issue(s).`
  });

  return {
    topic: input.topic.trim(),
    sourceCards: input.sourceCards,
    plan,
    researchNotes,
    critique,
    draft,
    final,
    audit,
    metadata: buildMetadata(options, trace)
  };
}

function buildMetadata(
  options: {
    provider: "deterministic" | "openai";
    model?: string;
    fallbackReason?: string;
  },
  agentTrace: readonly AgentTraceEntry[]
): PipelineMetadata {
  return {
    provider: options.provider,
    agentTrace,
    ...(options.model ? { model: options.model } : {}),
    ...(options.fallbackReason ? { fallbackReason: options.fallbackReason } : {})
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
