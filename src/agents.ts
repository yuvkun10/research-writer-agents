import type {
  Claim,
  Critique,
  DraftReport,
  FinalReport,
  ModelClient,
  PipelineInput,
  PlanSection,
  ResearchNote,
  ResearchPlan,
  SourceCard
} from "./types.js";
import { firstSentence, sentence, titleCase } from "./text.js";

export function validatePipelineInput(input: PipelineInput): void {
  if (input.topic.trim().length === 0) {
    throw new Error("Pipeline topic is required.");
  }

  if (input.sourceCards.length === 0) {
    throw new Error("At least one source card is required.");
  }

  const seen = new Set<string>();

  for (const card of input.sourceCards) {
    if (card.id.trim().length === 0) {
      throw new Error("Source card id is required.");
    }

    if (seen.has(card.id)) {
      throw new Error(`Duplicate source card id: ${card.id}`);
    }

    seen.add(card.id);

    if (card.title.trim().length === 0) {
      throw new Error(`Source card ${card.id} is missing a title.`);
    }

    if (card.excerpt.trim().length === 0) {
      throw new Error(`Source card ${card.id} is missing an excerpt.`);
    }
  }
}

export function planResearch(input: PipelineInput): ResearchPlan {
  const sourceIds = input.sourceCards.map((card) => card.id);
  const sections: PlanSection[] = [
    {
      id: "section-1",
      heading: "Frame the research question",
      focus: `Define why ${input.topic.trim()} matters for ${input.audience ?? "the intended audience"}.`,
      sourceIds: selectSourceIds(sourceIds, 0)
    },
    {
      id: "section-2",
      heading: "Compare source-backed findings",
      focus: "Extract the highest-signal findings from the available source cards.",
      sourceIds
    },
    {
      id: "section-3",
      heading: "Turn evidence into recommendations",
      focus: `Write concrete next steps in a ${input.tone ?? "clear"} tone.`,
      sourceIds: selectSourceIds(sourceIds, sourceIds.length - 1)
    }
  ];

  return {
    topic: input.topic.trim(),
    sections
  };
}

export function researchSources(input: PipelineInput, plan: ResearchPlan): readonly ResearchNote[] {
  return plan.sections.map((section, index) => {
    const cards = cardsForSection(input.sourceCards, section.sourceIds);
    const summaries = cards.map((card) => `${card.title}: ${firstSentence(card.excerpt)}`);

    return {
      id: `note-${index + 1}`,
      sectionId: section.id,
      summary: summaries.join(" "),
      citationIds: cards.map((card) => card.id)
    };
  });
}

export function draftReport(input: PipelineInput, plan: ResearchPlan, notes: readonly ResearchNote[]): DraftReport {
  const title = titleCase(input.topic);
  const claims = buildClaims(input.sourceCards);
  const body = plan.sections.map((section) => {
    const note = notes.find((candidate) => candidate.sectionId === section.id);
    const cited = note?.citationIds.map((id) => `[${id}]`).join(", ") ?? "";

    return {
      heading: titleCase(section.heading),
      paragraphs: [
        sentence(section.focus),
        cited.length > 0 ? `${sentence(note?.summary ?? "")} Evidence: ${cited}.` : sentence(note?.summary ?? "")
      ]
    };
  });

  return {
    title,
    summary: `A ${input.tone ?? "clear"} research brief for ${input.audience ?? "readers"} on ${input.topic.trim()}.`,
    claims,
    body
  };
}

export function critiqueDraft(draft: DraftReport): Critique {
  const warnings: string[] = [];
  const requiredEdits: string[] = [];

  for (const claim of draft.claims) {
    if (claim.citationIds.length === 0) {
      requiredEdits.push(`Add source support for ${claim.id}.`);
    }
  }

  if (draft.summary.length > 240) {
    warnings.push("Summary is longer than the preferred brief format.");
  }

  if (requiredEdits.length === 0 && warnings.length === 0) {
    warnings.push("No blocking editorial issues found.");
  }

  return { warnings, requiredEdits };
}

export async function editDraft(
  input: PipelineInput,
  draft: DraftReport,
  critique: Critique,
  modelClient?: ModelClient
): Promise<FinalReport> {
  const deterministicFinal = applyDeterministicEdit(input, draft, critique);

  if (!modelClient) {
    return deterministicFinal;
  }

  const response = await modelClient({
    agent: "editor",
    prompt:
      "Improve this report while preserving every claim id and citation id. Return JSON with optional title, summary, and body sections.",
    context: {
      input,
      draft,
      critique
    }
  });

  return mergeModelSuggestion(deterministicFinal, response.text);
}

function buildClaims(sourceCards: readonly SourceCard[]): readonly Claim[] {
  const claims: Claim[] = sourceCards.map((card, index) => ({
    id: `claim-${index + 1}`,
    text: `${card.title} supports that ${firstSentence(card.excerpt).replace(/[.!?]$/, "")}.`,
    citationIds: [card.id]
  }));

  if (sourceCards.length > 1) {
    claims.push({
      id: `claim-${sourceCards.length + 1}`,
      text: "The available source cards point to a repeatable operating practice rather than a one-off writing task.",
      citationIds: sourceCards.map((card) => card.id)
    });
  }

  return claims;
}

function applyDeterministicEdit(input: PipelineInput, draft: DraftReport, critique: Critique): FinalReport {
  const requiredEdits =
    critique.requiredEdits.length > 0
      ? ` Editorial blockers remain: ${critique.requiredEdits.join(" ")}`
      : "";

  return {
    title: draft.title,
    summary: `${draft.summary} It prioritizes claims that are explicitly linked to source cards.${requiredEdits}`,
    claims: draft.claims,
    body: draft.body.map((section) => ({
      heading: section.heading,
      paragraphs: section.paragraphs.map((paragraph, index) =>
        index === 0
          ? `${paragraph} The recommendation is scoped to ${input.audience ?? "the target audience"}.`
          : paragraph
      )
    }))
  };
}

function mergeModelSuggestion(finalReport: FinalReport, text: string): FinalReport {
  const suggestion = parseModelSuggestion(text);

  if (!suggestion) {
    return {
      ...finalReport,
      summary: sentence(text).slice(0, 1200)
    };
  }

  return {
    title: suggestion.title ?? finalReport.title,
    summary: suggestion.summary ?? finalReport.summary,
    claims: finalReport.claims,
    body: suggestion.body ?? finalReport.body
  };
}

function parseModelSuggestion(text: string): Partial<FinalReport> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  const parsed: unknown = JSON.parse(text.slice(start, end + 1));

  if (!isRecord(parsed)) {
    return null;
  }

  const result: Partial<FinalReport> = {};

  if (typeof parsed.title === "string" && parsed.title.trim().length > 0) {
    result.title = parsed.title.trim();
  }

  if (typeof parsed.summary === "string" && parsed.summary.trim().length > 0) {
    result.summary = parsed.summary.trim();
  }

  if (Array.isArray(parsed.body)) {
    const sections = parsed.body.filter(isReportSectionSuggestion);

    if (sections.length > 0) {
      result.body = sections;
    }
  }

  return result;
}

function isReportSectionSuggestion(value: unknown): value is { heading: string; paragraphs: readonly string[] } {
  return (
    isRecord(value) &&
    typeof value.heading === "string" &&
    Array.isArray(value.paragraphs) &&
    value.paragraphs.every((paragraph) => typeof paragraph === "string")
  );
}

function cardsForSection(sourceCards: readonly SourceCard[], sourceIds: readonly string[]): readonly SourceCard[] {
  const selected = sourceCards.filter((card) => sourceIds.includes(card.id));

  return selected.length > 0 ? selected : sourceCards;
}

function selectSourceIds(sourceIds: readonly string[], preferredIndex: number): readonly string[] {
  const sourceId = sourceIds[preferredIndex];

  return sourceId ? [sourceId] : [...sourceIds];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
