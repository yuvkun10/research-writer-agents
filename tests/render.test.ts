import { describe, expect, it } from "vitest";
import { renderJsonReport, renderMarkdownReport, runResearchWriterPipeline } from "../src/index.js";
import type { PipelineInput } from "../src/index.js";

const input: PipelineInput = {
  topic: "Citation-first research writing",
  sourceCards: [
    {
      id: "source-a",
      title: "Source Cards Manual",
      author: "Archive Team",
      publishedAt: "2026-03-10",
      excerpt: "Source cards make evidence visible across a writing pipeline."
    }
  ]
};

describe("report rendering", () => {
  it("renders Markdown with linked claims, audit status, and source cards", async () => {
    const report = await runResearchWriterPipeline(input, { provider: "deterministic" });

    const markdown = renderMarkdownReport(report);

    expect(markdown).toContain("# Citation-First Research Writing");
    expect(markdown).toContain("## Claims");
    expect(markdown).toContain("[source-a]");
    expect(markdown).toContain("## Citation Audit");
    expect(markdown).toContain("PASSED");
    expect(markdown).toContain("## Source Cards");
  });

  it("renders JSON that preserves report metadata and audit details", async () => {
    const report = await runResearchWriterPipeline(input, { provider: "deterministic" });

    const json = renderJsonReport(report);
    const parsed = JSON.parse(json) as typeof report;

    expect(parsed.metadata.provider).toBe("deterministic");
    expect(parsed.audit.passed).toBe(true);
    expect(parsed.sourceCards[0]?.id).toBe("source-a");
  });
});
