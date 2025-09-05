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
  web_search?: boolean;
  show_reasoning?: boolean;
}

export interface ChatResponse {
  message: ChatMessage;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  webSearchResults?: WebSearchResult[];
  reasoning?: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishDate?: string;
}

export interface EmbeddingRequest {
  text: string;
  provider: 'openai' | 'anthropic' | 'deepseek' | 'gemini';
  model?: string;
  api_key: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ProviderAdapter {
  name: string;
  chat(request: ChatRequest): Promise<ChatResponse>;
  embed?(request: EmbeddingRequest): Promise<EmbeddingResponse>;
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

export interface PromptOrchestration {
  mode: 'direct' | 'research' | 'coach';
  domain: string[];
  time_sensitivity: 'low' | 'medium' | 'high';
  answer_style: 'concise' | 'structured' | 'stepwise' | 'code-first';
  plan?: string[];
  context_used?: MemoryItem[];
  report_card?: ReportCardItem[];
}

export interface MemoryItem {
  id: string;
  convoId?: string;
  text: string;
  type: 'fact' | 'decision' | 'definition' | 'todo' | 'code';
  timestamp: number;
  vector?: number[];
  user_pin?: number;
}

export interface ReportCardItem {
  category: 'correctness' | 'completeness' | 'evidence' | 'safety' | 'clarity';
  status: 'pass' | 'warning';
  note?: string;
}