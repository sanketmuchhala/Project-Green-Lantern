import { ChatRequest, ChatResponse } from '../types.js';

export type OllamaMsg = { role: "system" | "user" | "assistant"; content: string };

export type OllamaConfig = {
  baseURL?: string;
  model: string;
  temperature?: number;
  max_tokens?: number; // -> num_predict
  num_ctx?: number;
  top_p?: number;
  top_k?: number;
  num_thread?: number;
  use_mmap?: boolean;
  use_mlock?: boolean;
  stream?: boolean;
  performanceMode?: boolean; // new flag
  quantization?: 'q4_K_M' | 'q8_0' | 'fp16' | 'default';
  num_gpu?: number;
  flash_attention?: boolean;
};

function normBaseURL(u?: string) {
  let v = (u || "http://localhost:11434").trim();
  if (v.endsWith("/")) v = v.slice(0, -1);
  if (!/^https?:\/\//i.test(v)) throw new Error(`Invalid baseURL: ${v}`);
  return v;
}

export async function pingOllama(baseURL?: string) {
  const url = `${normBaseURL(baseURL)}/api/tags`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 5000);
  try {
    const r = await fetch(url, { method: "GET", signal: ac.signal });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  } finally { 
    clearTimeout(t); 
  }
}

export async function chatWithOllama(opts: {
  config: OllamaConfig; 
  messages: OllamaMsg[]; 
  signal?: AbortSignal;
}) {
  const baseURL = normBaseURL(opts.config.baseURL);
  const pm = opts.config.performanceMode !== false; // default ON
  const stream = opts.config.stream ?? true; // DEFAULT STREAMING ON for local
  
  // Optimized settings for gemma2:2b (lightweight and efficient)
  const isGemma2b = opts.config.model.includes('gemma2:2b');

  const options: any = {
    temperature: opts.config.temperature ?? 0.7,
    // Reduced context window for better performance
    num_ctx: opts.config.num_ctx ?? (pm ? 1024 : 2048),
    // Conservative token generation for efficiency
    ...(typeof opts.config.max_tokens === "number"
        ? { num_predict: Math.min(opts.config.max_tokens, pm ? 128 : 256) }
        : { num_predict: pm ? 128 : 256 }),
    // Optimized sampling parameters
    top_p: opts.config.top_p ?? 0.9,
    top_k: opts.config.top_k ?? 40,
    // Reduced thread count to be gentle on system
    num_thread: opts.config.num_thread ?? (pm ? 4 : 6),
    // Memory optimizations
    use_mmap: opts.config.use_mmap ?? true,
    use_mlock: opts.config.use_mlock ?? false,
    // Smaller batch size for lower memory usage
    num_batch: pm ? 256 : 512,
    repeat_penalty: 1.1,
    // GPU settings - single GPU for efficiency
    num_gpu: opts.config.num_gpu ?? 1,
    // Enable low VRAM mode for system optimization
    low_vram: true,
    // Enable flash attention for gemma2:2b
    flash_attention: opts.config.flash_attention ?? isGemma2b
  };

  const body: any = {
    model: opts.config.model,
    messages: opts.messages,
    options,
    stream
  };

  let lastErr: any;
  for (let attempt = 0; attempt < 3; attempt++) {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 30_000);
    try {
      const res = await fetch(`${baseURL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: opts.signal || ac.signal
      });
      clearTimeout(timeout);
      
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Ollama HTTP ${res.status}: ${txt.slice(0, 240)}`);
      }
      
      if (stream) {
        // Handle streaming response by aggregating chunks
        let text = "";
        const reader = res.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            // Decode the chunk and parse streaming JSON responses
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const json = JSON.parse(line);
                if (json.message?.content) {
                  text += json.message.content;
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
          return { text, usage: null, raw: null };
        }
        // Fallback if no reader available
        const txt = await res.text();
        return { text: txt, usage: null, raw: null };
      }
      
      const json = await res.json() as { message?: { content?: string } };
      const text = json?.message?.content ?? "";
      return { text, usage: null, raw: json };
      
    } catch (e: any) {
      clearTimeout(timeout);
      lastErr = e;
      const msg = String(e?.message || e);
      if (msg.includes("ECONNREFUSED") || msg.includes("connect") || 
          msg.includes("Failed to fetch") || msg.includes("aborted")) {
        await new Promise(r => setTimeout(r, 300));
        continue;
      }
      throw e;
    }
  }
  throw new Error(`Cannot reach Ollama at ${baseURL}: ${String(lastErr?.message || lastErr)}`);
}

// Legacy adapter for existing ChatRequest interface
export const localOllamaProvider = {
  name: 'Local (Ollama)',
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { 
      messages, 
      model, 
      temperature = 0.2, 
      max_tokens,
      baseURL = 'http://localhost:11434',
      num_ctx,
      performanceMode = true
    } = request;

    const ollamaMessages: OllamaMsg[] = messages.map(m => ({ 
      role: m.role as "system" | "user" | "assistant", 
      content: m.content 
    }));

    const config: OllamaConfig = {
      baseURL,
      model,
      temperature,
      max_tokens,
      num_ctx,
      performanceMode,
      stream: false
    };

    try {
      const result = await chatWithOllama({
        config,
        messages: ollamaMessages
      });

      return {
        message: {
          role: 'assistant',
          content: result.text
        },
        usage: result.usage || undefined
      };
    } catch (error: any) {
      if (error.message.includes('Cannot reach Ollama')) {
        throw { 
          code: 'CONNECTION', 
          provider: 'local-ollama', 
          message: `Ollama not reachable at ${baseURL}. Make sure Ollama is running with 'ollama serve'.` 
        };
      }
      throw { 
        code: 'API_ERROR', 
        provider: 'local-ollama', 
        message: error.message
      };
    }
  }
};