# Privacy, security, and citations

- The deterministic path does not browse the web, call a model provider, or send
  source cards over the network.
- The OpenAI provider sends the pipeline context for an editor pass only. The
  provider instructions require using only supplied source cards and preserving
  citation IDs.
- Source citations are source-card IDs, not a guarantee that every source is
  factually correct. Review source quality before relying on a report.
- The citation auditor checks structural citation integrity: missing citations,
  unknown source IDs, and source cards that were never linked to any final claim.
- Keep private research, customer data, credentials, generated reports, and
  local environment files out of git.

See [SECURITY.md](../SECURITY.md) for the security policy and how to report
vulnerabilities.
