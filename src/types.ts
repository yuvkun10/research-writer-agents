export type AgentName = "planner" | "researcher" | "critic" | "editor" | "citation-auditor";

export type ProviderMode = "auto" | "deterministic" | "openai";

export interface SourceCard {
  id: string;
  title: string;
  excerpt: string;
  author?: string;
  publishedAt?: string;
  url?: string;
  notes?: readonly string[];
}

export interface PipelineInput {
  topic: string;
  sourceCards: readonly SourceCard[];
  audience?: string;
  tone?: string;
}

export interface PlanSection {
  id: string;
  heading: string;
  focus: string;
  sourceIds: readonly string[];
}

export interface ResearchPlan {
  topic: string;
  sections: readonly PlanSection[];
}

export interface ResearchNote {
  id: string;
  sectionId: string;
  summary: string;
  citationIds: readonly string[];
}

export interface Claim {
  id: string;
  text: string;
  citationIds: readonly string[];
}

export interface ReportSection {
  heading: string;
  paragraphs: readonly string[];
}

export interface DraftReport {
  title: string;
  summary: string;
  claims: readonly Claim[];
  body: readonly ReportSection[];
}

export interface Critique {
  warnings: readonly string[];
  requiredEdits: readonly string[];
}

export interface FinalReport {
  title: string;
  summary: string;
  claims: readonly Claim[];
  body: readonly ReportSection[];
}

export type CitationIssueCode = "missing-citation" | "unknown-source" | "unused-source";

export interface CitationIssue {
  code: CitationIssueCode;
  message: string;
  claimId?: string;
  sourceId?: string;
}

export interface CitationAudit {
  passed: boolean;
  issues: readonly CitationIssue[];
  claimSourceMap: Record<string, readonly string[]>;
}

export interface AgentTraceEntry {
  agent: AgentName;
  mode: "deterministic" | "openai";
  status: "completed";
  summary: string;
}

export interface PipelineMetadata {
  provider: "deterministic" | "openai";
  agentTrace: readonly AgentTraceEntry[];
  model?: string;
  fallbackReason?: string;
}

export interface PipelineReport {
  topic: string;
  sourceCards: readonly SourceCard[];
  plan: ResearchPlan;
  researchNotes: readonly ResearchNote[];
  critique: Critique;
  draft: DraftReport;
  final: FinalReport;
  audit: CitationAudit;
  metadata: PipelineMetadata;
}

export interface ModelClientRequest {
  agent: AgentName;
  prompt: string;
  context: Record<string, unknown>;
}

export interface ModelClientResponse {
  text: string;
  raw?: unknown;
}

export type ModelClient = (request: ModelClientRequest) => Promise<ModelClientResponse>;

export interface PipelineOptions {
  provider?: ProviderMode;
  model?: string;
  apiKey?: string;
  providerClient?: ModelClient;
}
