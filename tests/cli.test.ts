import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("CLI", () => {
  it("writes Markdown and JSON reports from local source cards", async () => {
    const workdir = join(tmpdir(), `research-writer-agents-${Date.now()}`);
    await mkdir(workdir, { recursive: true });

    const sourcesPath = join(workdir, "sources.json");
    await writeFile(
      sourcesPath,
      JSON.stringify([
        {
          id: "cli-source",
          title: "CLI Source Card",
          author: "CLI Team",
          publishedAt: "2026-05-01",
          excerpt: "The CLI should export reproducible Markdown and JSON reports."
        }
      ])
    );

    const { stdout } = await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx",
        "src/cli.ts",
        "--topic",
        "CLI report export",
        "--sources",
        sourcesPath,
        "--out-dir",
        workdir,
        "--format",
        "both",
        "--provider",
        "deterministic"
      ],
      {
        cwd: process.cwd(),
        env: { ...process.env, OPENAI_API_KEY: "" }
      }
    );

    expect(stdout).toContain("report.md");
    expect(stdout).toContain("report.json");

    const markdown = await readFile(join(workdir, "report.md"), "utf8");
    const json = JSON.parse(await readFile(join(workdir, "report.json"), "utf8")) as {
      metadata: { provider: string };
    };

    expect(markdown).toContain("# CLI Report Export");
    expect(json.metadata.provider).toBe("deterministic");
  });
});
