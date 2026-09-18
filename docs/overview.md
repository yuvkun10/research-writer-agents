# Overview

Background on why the project exists and who it is for. Moved from the README on 19 Sep 2026.

## Why this project

- **Traceable by design.** Every claim links to the source-card IDs that back
  it, and a citation auditor flags missing, unknown, or unused citations.
- **Reproducible by default.** The deterministic path never browses the web,
  calls a model, or sends source cards over the network, so the same input
  always produces the same report.
- **Optional model assist, safely bounded.** The OpenAI editor pass can polish
  prose but must preserve all claim and citation IDs, and it falls back to
  deterministic output if the key is missing or the call fails.
- **Small and inspectable.** A focused TypeScript codebase with one runtime
  dependency, full type coverage, and Vitest tests.

## Who it is for

- Analysts writing briefs from vetted notes, interviews, market scans, or
  internal research cards.
- Research operations teams that need claim-to-source mapping before a report
  reaches stakeholders.
- Content and editorial teams drafting citation-first explainers, white papers,
  or evidence-backed recommendations.
- Engineering and product teams converting decision logs, incident reviews, or
  customer evidence into concise research reports.
- Offline or privacy-sensitive drafting where source material stays local.

## Using with coding agents / Codex

This repository ships an [`AGENTS.md`](../AGENTS.md) at its root following the
open-source AGENTS.md convention. It gives coding agents (such as OpenAI Codex
or Claude Code) the project overview, the five-agent pipeline contract, the
build/test/lint/typecheck commands, the repo layout, coding conventions, the
deterministic-vs-OpenAI provider rules, and the invariants they must not break,
most importantly that the OpenAI editor pass must preserve every claim ID and
citation ID. If you are pointing an agent at this repo, start it there.
