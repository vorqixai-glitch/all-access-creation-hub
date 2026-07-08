// Client-safe model catalog (no server-only imports)
export const AVAILABLE_MODELS = [
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google" },
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", provider: "Google" },
  { id: "google/gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "Google" },
  { id: "openai/gpt-5", name: "GPT-5", provider: "OpenAI" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", provider: "OpenAI" },
  { id: "openai/gpt-5-nano", name: "GPT-5 Nano", provider: "OpenAI" },
  { id: "openai/gpt-5.5", name: "GPT-5.5", provider: "OpenAI" },
] as const;

export const DEFAULT_MODEL = "google/gemini-2.5-flash";
