#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { renderJsonReport, renderMarkdownReport, runResearchWriterPipeline } from "./index.js";
import type { PipelineInput, ProviderMode, SourceCard } from "./index.js";

interface CliArgs {
  topic?: string;
  sources?: string;
  outDir: string;
  format: "markdown" | "json" | "both";
  provider: ProviderMode;
  model?: string;
  help: boolean;
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);

  if (args.help) {
    console.log(helpText());
    return;
  }

  if (!args.topic) {
    throw new Error("Missing required --topic value.");
  }

  if (!args.sources) {
    throw new Error("Missing required --sources path to a local source-card JSON file.");
  }

  const sourceCards = await readSourceCards(args.sources);
  const input: PipelineInput = {
    topic: args.topic,
    sourceCards
  };
  const report = await runResearchWriterPipeline(input, {
    provider: args.provider,
    ...(args.model ? { model: args.model } : {})
  });

  await mkdir(args.outDir, { recursive: true });

  const written: string[] = [];

  if (args.format === "markdown" || args.format === "both") {
    const path = resolve(args.outDir, "report.md");
    await writeFile(path, renderMarkdownReport(report), "utf8");
    written.push(path);
  }

  if (args.format === "json" || args.format === "both") {
    const path = resolve(args.outDir, "report.json");
    await writeFile(path, renderJsonReport(report), "utf8");
    written.push(path);
  }

  console.log(`Wrote ${written.join(", ")}`);
}

export function parseArgs(argv: readonly string[]): CliArgs {
  const args: CliArgs = {
    outDir: process.cwd(),
    format: "markdown",
    provider: "auto",
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];

    switch (flag) {
      case "--help":
      case "-h":
        args.help = true;
        break;
      case "--topic":
        args.topic = requireValue(argv, index, flag);
        index += 1;
        break;
      case "--sources":
        args.sources = requireValue(argv, index, flag);
        index += 1;
        break;
      case "--out-dir":
        args.outDir = resolve(requireValue(argv, index, flag));
        index += 1;
        break;
      case "--format":
        args.format = parseFormat(requireValue(argv, index, flag));
        index += 1;
        break;
      case "--provider":
        args.provider = parseProvider(requireValue(argv, index, flag));
        index += 1;
        break;
      case "--model":
        args.model = requireValue(argv, index, flag);
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${flag}`);
    }
  }

  return args;
}

async function readSourceCards(path: string): Promise<readonly SourceCard[]> {
  const raw = await readFile(resolve(path), "utf8");
  const parsed: unknown = JSON.parse(raw);
  const cards = Array.isArray(parsed) ? parsed : isRecord(parsed) ? parsed.sourceCards : undefined;

  if (!Array.isArray(cards) || !cards.every(isSourceCard)) {
    throw new Error("Source card file must be an array of source cards or an object with sourceCards.");
  }

  return cards;
}

function parseFormat(value: string): "markdown" | "json" | "both" {
  if (value === "markdown" || value === "json" || value === "both") {
    return value;
  }

  throw new Error("--format must be markdown, json, or both.");
}

function parseProvider(value: string): ProviderMode {
  if (value === "auto" || value === "deterministic" || value === "openai") {
    return value;
  }

  throw new Error("--provider must be auto, deterministic, or openai.");
}

function requireValue(argv: readonly string[], index: number, flag: string): string {
  const value = argv[index + 1];

  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return value;
}

function isSourceCard(value: unknown): value is SourceCard {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.excerpt === "string" &&
    optionalString(value.author) &&
    optionalString(value.publishedAt) &&
    optionalString(value.url) &&
    (value.notes === undefined ||
      (Array.isArray(value.notes) && value.notes.every((note) => typeof note === "string")))
  );
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function helpText(): string {
  return [
    "research-writer-agents",
    "",
    "Usage:",
    "  research-writer-agents --topic <topic> --sources <source-cards.json> [--out-dir <dir>] [--format markdown|json|both] [--provider auto|deterministic|openai]",
    "",
    "Notes:",
    "  Source cards are local JSON records with id, title, excerpt, and optional author, publishedAt, url, notes.",
    "  The OpenAI provider uses OPENAI_API_KEY when available and never performs live web scraping."
  ].join("\n");
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";

if (import.meta.url === invokedPath) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
