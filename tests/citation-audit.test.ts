import { describe, expect, it } from "vitest";
import { auditCitations } from "../src/index.js";
import type { Claim, SourceCard } from "../src/index.js";

const cards: SourceCard[] = [
  {
    id: "card-a",
    title: "Knowledge Work Study",
    author: "Research Lab",
    publishedAt: "2026-02-01",
    excerpt: "Structured research notes improve review speed."
  },
  {
    id: "card-b",
    title: "Editorial Quality Notes",
    author: "Editors Guild",
    publishedAt: "2025-08-18",
    excerpt: "Citation audits catch unsupported claims before publication."
  }
];

describe("auditCitations", () => {
  it("passes when all claims cite known source cards", () => {
    const claims: Claim[] = [
      {
        id: "claim-1",
        text: "Structured research notes improve review speed.",
        citationIds: ["card-a"]
      },
      {
        id: "claim-2",
        text: "Citation audits catch unsupported claims before publication.",
        citationIds: ["card-b"]
      }
    ];

    const audit = auditCitations(claims, cards);

    expect(audit.passed).toBe(true);
    expect(audit.issues).toEqual([]);
    expect(audit.claimSourceMap).toEqual({ "claim-1": ["card-a"], "claim-2": ["card-b"] });
  });

  it("flags missing, unknown, and unused citation links", () => {
    const claims: Claim[] = [
      {
        id: "claim-1",
        text: "Unsupported claim has no citations.",
        citationIds: []
      },
      {
        id: "claim-2",
        text: "Unknown source should be reported.",
        citationIds: ["missing-card"]
      }
    ];

    const audit = auditCitations(claims, cards);

    expect(audit.passed).toBe(false);
    expect(audit.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-citation", claimId: "claim-1" }),
        expect.objectContaining({ code: "unknown-source", claimId: "claim-2", sourceId: "missing-card" }),
        expect.objectContaining({ code: "unused-source", sourceId: "card-a" }),
        expect.objectContaining({ code: "unused-source", sourceId: "card-b" })
      ])
    );
  });
});
