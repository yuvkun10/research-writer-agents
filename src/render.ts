import type { CitationIssue, PipelineReport, SourceCard } from "./types.js";

export function renderMarkdownReport(report: PipelineReport): string {
  const lines: string[] = [
    `# ${report.final.title}`,
    "",
    report.final.summary,
    "",
    "## Plan",
    ""
  ];

  for (const section of report.plan.sections) {
    lines.push(`- **${section.heading}**: ${section.focus}`);
  }

  lines.push("", "## Claims", "");

  for (const claim of report.final.claims) {
    lines.push(`- **${claim.id}**: ${claim.text} ${renderCitationList(claim.citationIds)}`);
  }

  lines.push("", "## Report", "");

  for (const section of report.final.body) {
    lines.push(`### ${section.heading}`, "");

    for (const paragraph of section.paragraphs) {
      lines.push(paragraph, "");
    }
  }

  lines.push("## Citation Audit", "", `Status: ${report.audit.passed ? "PASSED" : "FAILED"}`, "");

  if (report.audit.issues.length > 0) {
    for (const issue of report.audit.issues) {
      lines.push(`- ${renderIssue(issue)}`);
    }
    lines.push("");
  }

  lines.push("## Source Cards", "");

  for (const card of report.sourceCards) {
    lines.push(renderSourceCard(card), "");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderJsonReport(report: PipelineReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function renderCitationList(citationIds: readonly string[]): string {
  return citationIds.map((id) => `[${id}]`).join(" ");
}

function renderIssue(issue: CitationIssue): string {
  const target = [issue.claimId, issue.sourceId].filter(Boolean).join(" / ");

  return target.length > 0 ? `${issue.code} (${target}): ${issue.message}` : `${issue.code}: ${issue.message}`;
}

function renderSourceCard(card: SourceCard): string {
  const lines = [`### [${card.id}] ${card.title}`];
  const metadata = [card.author, card.publishedAt, card.url].filter(Boolean).join(" | ");

  if (metadata.length > 0) {
    lines.push(metadata);
  }

  lines.push("", card.excerpt);

  if (card.notes && card.notes.length > 0) {
    lines.push("", ...card.notes.map((note) => `- ${note}`));
  }

  return lines.join("\n");
}
