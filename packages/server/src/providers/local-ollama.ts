import { ChatRequest, ChatResponse, ProviderAdapter } from '../types.js';

export const localOllamaProvider: ProviderAdapter = {
  name: 'Local (Ollama)',
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { 
      messages, 
      model, 
      temperature = 0.2, 
      max_tokens,
      baseURL = 'http://localhost:11434',
      num_ctx
    } = request;

    // Build Ollama request options with performance optimizations
    const options: any = {
      temperature,
      // Reduce context window for better performance
      num_ctx: typeof num_ctx === 'number' ? Math.min(num_ctx, 4096) : 2048,
      // Lower thread count for smoother performance
      num_thread: 4,
      // Reduce batch size
      num_batch: 512
    };
    
    if (typeof max_tokens === 'number') {
      // Cap max tokens to prevent excessive memory usage
      options.num_predict = Math.min(max_tokens, 1024);
    } else {
      options.num_predict = 512; // Default to smaller output
    }

    const body = {
      model,
      messages: messages.map(m => ({ 
        role: m.role, 
        content: m.content 
      })),
      options,
      stream: false
    };

    const response = await fetch(`${baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      if (response.status === 404) {
        throw { 
          code: 'CONNECTION', 
          provider: 'local-ollama', 
          message: `Ollama not reachable at ${baseURL}. Make sure Ollama is running.` 
        };
      }
      throw { 
        code: 'API_ERROR', 
        provider: 'local-ollama', 
        message: `Ollama HTTP ${response.status}: ${text.slice(0, 500)}` 
      };
    }

    const json = await response.json();
    const text = json?.message?.content ?? '';

    return {
      message: {
        role: 'assistant',
        content: text
      },
      usage: undefined // Ollama often doesn't return usage stats
    };
  }
};

export async function pingOllama(baseURL = 'http://localhost:11434'): Promise<boolean> {
  try {
    const response = await fetch(`${baseURL}/api/tags`, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Ping failed with ${response.status}`);
    }
    
    return true;
  } catch (error) {
    throw new Error(`Cannot connect to Ollama at ${baseURL}. Make sure Ollama is running.`);
  }
}