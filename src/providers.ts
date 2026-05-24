import OpenAI from "openai";
import type { ModelClient, PipelineOptions } from "./types.js";

export const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

export interface ResolvedProvider {
  provider: "deterministic" | "openai";
  model?: string;
  modelClient?: ModelClient;
  fallbackReason?: string;
}

export function resolveProvider(options: PipelineOptions = {}): ResolvedProvider {
  const requested = options.provider ?? process.env.RESEARCH_WRITER_PROVIDER ?? "auto";

  if (!isProviderMode(requested)) {
    throw new Error(`Unsupported provider: ${requested}`);
  }

  if (requested === "deterministic") {
    return { provider: "deterministic" };
  }

  if (options.providerClient) {
    return {
      provider: "openai",
      model: options.model ?? DEFAULT_OPENAI_MODEL,
      modelClient: options.providerClient
    };
  }

  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return requested === "openai"
      ? {
          provider: "deterministic",
          fallbackReason: "OPENAI_API_KEY is not set; using deterministic provider."
        }
      : { provider: "deterministic" };
  }

  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL;
  const client = new OpenAI({ apiKey });

  return {
    provider: "openai",
    model,
    modelClient: async (request) => {
      const response = await client.responses.create({
        model,
        instructions:
          "You are one agent in a local research writing pipeline. Do not browse the web. Use only the supplied source cards and preserve citation ids exactly.",
        input: JSON.stringify(request),
        max_output_tokens: 1200,
        temperature: 0.2
      });

      return {
        text: response.output_text.trim(),
        raw: response
      };
    }
  };
}

function isProviderMode(value: string): value is "auto" | "deterministic" | "openai" {
  return value === "auto" || value === "deterministic" || value === "openai";
}
