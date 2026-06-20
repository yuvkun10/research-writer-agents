# Security Policy

## Supported versions

This project is pre-1.0 and under active development. Security fixes are applied
to the latest `main` branch.

## Reporting a vulnerability

Please do not open a public GitHub issue for security vulnerabilities.

Instead, report them privately using GitHub's
[private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
("Report a vulnerability" under the repository's **Security** tab). Include:

- A description of the issue and its impact.
- Steps to reproduce or a proof of concept.
- Any suggested remediation, if you have one.

You can expect an initial acknowledgement within a reasonable time frame, and
we will keep you informed as the issue is investigated and resolved.

## Handling secrets and sensitive data

This project is designed to keep sensitive material out of the repository:

- Never commit `.env` files, API keys, or other credentials. `.env` is
  git-ignored; only `.env.example`, which contains placeholders, is tracked.
- Never commit private or confidential source-card data, or generated reports
  derived from it. Keep these files local.
- The deterministic provider runs fully offline: it does not browse the web,
  call a model provider, or send source cards over the network.
- The optional OpenAI provider sends pipeline context to the OpenAI Responses
  API for a single editor pass. Only enable it for data you are comfortable
  sending to that API, and supply the key via the `OPENAI_API_KEY` environment
  variable rather than hard-coding it.

## Dependencies

Dependency updates are automated with Dependabot, and CI runs
`npm audit --audit-level=moderate` on every push and pull request to surface
known vulnerabilities.
