# Configuration

Copy `.env.example` to a local, git-ignored `.env` file when you want
environment configuration:

```bash
cp .env.example .env
```

`.env.example` contains only placeholders and safe defaults:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
RESEARCH_WRITER_PROVIDER=deterministic
```

Provider modes:

- `deterministic`: always run locally with no model call.
- `auto`: use OpenAI only when `OPENAI_API_KEY` is present; otherwise fall back
  to deterministic execution.
- `openai`: request the OpenAI editor pass and fall back to deterministic
  output if the key is missing or the provider call fails.

Do not commit `.env`, API keys, source-card files with private data, or
generated reports that contain confidential research.
