export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface ChatRequest {
  messages: ChatMessage[];
  provider: 'openai' | 'anthropic' | 'deepseek' | 'gemini' | 'auto';
  model: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  api_key: string;
}

export interface ChatResponse {
  message: ChatMessage;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ProviderAdapter {
  name: string;
  chat(request: ChatRequest): Promise<ChatResponse>;
}

export interface OptimizedPrompt {
  task: string;
  context: string;
  mustInclude: string[];
  constraints: string[];
  inputs: string[];
  qualityBar: string;
}

export interface ResearchPlan {
  steps: string[];
  rationale: string;
}

export interface Citation {
  title: string;
  url: string;
  snippet: string;
}