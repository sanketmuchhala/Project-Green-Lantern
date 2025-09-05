import { Provider } from '../lib/db';

export const MODELS = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
  gemini: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
  deepseek: ["deepseek-chat", "deepseek-reasoner", "deepseek-coder", "deepseek-r1-distill-llama-70b", "deepseek-r1-distill-qwen-32b"]
} as const;

export const DEFAULT_MODELS: Record<Provider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
  gemini: "gemini-1.5-flash",
  deepseek: "deepseek-chat"
};

export const PROVIDER_NAMES: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  gemini: "Google Gemini",
  deepseek: "DeepSeek"
};

export const getModelsForProvider = (provider: Provider): readonly string[] => {
  return MODELS[provider] || [];
};

export const getDefaultModelForProvider = (provider: Provider): string => {
  return DEFAULT_MODELS[provider] || MODELS[provider][0];
};