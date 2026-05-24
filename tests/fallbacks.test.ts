import { afterEach, describe, expect, it, vi } from "vitest";
import { runResearchWriterPipeline } from "../src/index.js";

describe("provider fallbacks", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses deterministic execution when OpenAI is requested without an API key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");

    const report = await runResearchWriterPipeline(
      {
        topic: "Fallback behavior",
        sourceCards: [
          {
            id: "fallback-source",
            title: "Fallback Guide",
            author: "Runtime Team",
            publishedAt: "2026-04-01",
            excerpt: "Local deterministic execution keeps tests stable without network access."
          }
        ]
      },
      { provider: "openai" }
    );

    expect(report.metadata.provider).toBe("deterministic");
    expect(report.metadata.fallbackReason).toContain("OPENAI_API_KEY");
    expect(report.audit.passed).toBe(true);
  });

  it("falls back to deterministic execution if an injected provider fails", async () => {
    const report = await runResearchWriterPipeline(
      {
        topic: "Injected provider failures",
        sourceCards: [
          {
            id: "source-1",
            title: "Fallback Reliability",
            author: "Runtime Team",
            publishedAt: "2026-04-02",
            excerpt: "Provider fallbacks should preserve a completed report."
          }
        ]
      },
      {
        provider: "openai",
        providerClient: async () => {
          throw new Error("network unavailable");
        }
      }
    );

    expect(report.metadata.provider).toBe("deterministic");
    expect(report.metadata.fallbackReason).toContain("network unavailable");
    expect(report.final.claims.length).toBeGreaterThan(0);
  });
});
