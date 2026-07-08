import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export const AVAILABLE_MODELS = [
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", tags: ["fast", "multimodal"] },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", tags: ["reasoning", "multimodal"] },
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", provider: "Google", tags: ["cheap", "fast"] },
  { id: "google/gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "Google", tags: ["latest", "agentic"] },
  { id: "openai/gpt-5", name: "GPT-5", provider: "OpenAI", tags: ["powerful"] },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", provider: "OpenAI", tags: ["balanced"] },
  { id: "openai/gpt-5-nano", name: "GPT-5 Nano", provider: "OpenAI", tags: ["fast", "cheap"] },
  { id: "openai/gpt-5.5", name: "GPT-5.5", provider: "OpenAI", tags: ["flagship", "reasoning"] },
] as const;

export const DEFAULT_MODEL = "google/gemini-2.5-flash";
