export type ProviderName = "openai" | "anthropic" | "gemini" | "deepseek";

export interface ProviderPayload {
  model: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  temperature?: number;
  max_tokens?: number;
}

export interface ProviderAdapter {
  chat: (apiKey: string, body: ProviderPayload) => Promise<{ text: string; usage?: any }>;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface NormalizedResponse {
  message: {
    role: "assistant";
    content: string;
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}