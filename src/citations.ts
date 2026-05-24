import type { CitationAudit, CitationIssue, Claim, SourceCard } from "./types.js";

export function auditCitations(
  claims: readonly Claim[],
  sourceCards: readonly SourceCard[]
): CitationAudit {
  const knownSourceIds = new Set(sourceCards.map((card) => card.id));
  const usedSourceIds = new Set<string>();
  const issues: CitationIssue[] = [];
  const claimSourceMap: Record<string, readonly string[]> = {};

  for (const claim of claims) {
    const validSourceIds: string[] = [];

    if (claim.citationIds.length === 0) {
      issues.push({
        code: "missing-citation",
        claimId: claim.id,
        message: `Claim ${claim.id} has no citation links.`
      });
    }

    for (const sourceId of claim.citationIds) {
      if (knownSourceIds.has(sourceId)) {
        usedSourceIds.add(sourceId);
        validSourceIds.push(sourceId);
      } else {
        issues.push({
          code: "unknown-source",
          claimId: claim.id,
          sourceId,
          message: `Claim ${claim.id} cites unknown source card ${sourceId}.`
        });
      }
    }

    claimSourceMap[claim.id] = validSourceIds;
  }

  for (const sourceCard of sourceCards) {
    if (!usedSourceIds.has(sourceCard.id)) {
      issues.push({
        code: "unused-source",
        sourceId: sourceCard.id,
        message: `Source card ${sourceCard.id} is not linked to any claim.`
      });
    }
  }

  return {
    passed: issues.length === 0,
    issues,
    claimSourceMap
  };
}
