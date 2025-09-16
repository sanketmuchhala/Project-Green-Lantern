import { Provider } from '../lib/db';

export const MODELS = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
  gemini: ["gemini-2.5-pro", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
  deepseek: ["deepseek-chat", "deepseek-coder"],
  "local-ollama": ["gemma2:2b"]
} as const;

export const DEFAULT_MODELS: Record<Provider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
  gemini: "gemini-2.5-pro",
  deepseek: "deepseek-chat",
  "local-ollama": "gemma2:2b"
};

export const PROVIDER_NAMES: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  gemini: "Google Gemini",
  deepseek: "DeepSeek",
  "local-ollama": "Local (Ollama)"
};

export const getModelsForProvider = (provider: Provider): readonly string[] => {
  return MODELS[provider] || [];
};

export const getDefaultModelForProvider = (provider: Provider): string => {
  return DEFAULT_MODELS[provider] || MODELS[provider][0];
};