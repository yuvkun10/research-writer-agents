import { describe, expect, it } from "vitest";
import { runResearchWriterPipeline } from "../src/index.js";
import type { PipelineInput, SourceCard } from "../src/index.js";

const sourceCards: SourceCard[] = [
  {
    id: "source-1",
    title: "Engineering Leadership Survey",
    author: "Dulcie Research Team",
    publishedAt: "2026-01-15",
    url: "https://example.com/engineering-leadership",
    excerpt:
      "Teams that write decision logs reduce repeated architectural debates by 42 percent."
  },
  {
    id: "source-2",
    title: "Incident Review Benchmarks",
    author: "Ops Guild",
    publishedAt: "2025-11-02",
    url: "https://example.com/incident-review",
    excerpt:
      "Post-incident reviews are more actionable when follow-up owners are assigned within 48 hours."
  }
];

const input: PipelineInput = {
  topic: "How engineering teams can improve operational learning",
  audience: "engineering managers",
  tone: "practical",
  sourceCards
};

describe("runResearchWriterPipeline", () => {
  it("runs planner, researcher, critic, editor, and citation auditor in order", async () => {
    const report = await runResearchWriterPipeline(input, {
      provider: "deterministic"
    });

    expect(report.metadata.provider).toBe("deterministic");
    expect(report.metadata.agentTrace.map((entry) => entry.agent)).toEqual([
      "planner",
      "researcher",
      "critic",
      "editor",
      "citation-auditor"
    ]);
    expect(report.plan.sections).toHaveLength(3);
    expect(report.draft.claims).toHaveLength(3);
    expect(report.final.title).toContain("Operational Learning");
    expect(report.audit.passed).toBe(true);
  });

  it("links every final claim to at least one known source card", async () => {
    const report = await runResearchWriterPipeline(input, {
      provider: "deterministic"
    });

    for (const claim of report.final.claims) {
      expect(claim.citationIds.length).toBeGreaterThan(0);
      expect(claim.citationIds.every((id) => sourceCards.some((card) => card.id === id))).toBe(
        true
      );
    }
  });
});
