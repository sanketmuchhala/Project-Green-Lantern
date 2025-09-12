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
  
  // Quantization-aware optimizations (gemma2:2b is already Q4_0 quantized)
  const isQuantized = opts.config.model.includes('gemma2:2b') || opts.config.model.includes('q4') || opts.config.model.includes('q8');
  
  const options: any = {
    temperature: opts.config.temperature ?? (isQuantized ? 0.7 : 0.1),
    num_ctx: opts.config.num_ctx ?? (pm && isQuantized ? 2048 : pm ? 512 : 2048),
    ...(typeof opts.config.max_tokens === "number"
        ? { num_predict: Math.min(opts.config.max_tokens, pm && isQuantized ? 256 : pm ? 64 : 256) }
        : (pm && isQuantized ? { num_predict: 256 } : pm ? { num_predict: 64 } : {})),
    top_p: opts.config.top_p ?? (isQuantized ? 0.9 : pm ? 0.7 : undefined),
    top_k: opts.config.top_k ?? (isQuantized ? 40 : pm ? 10 : undefined),
    num_thread: opts.config.num_thread ?? (isQuantized ? 8 : pm ? 2 : undefined),
    use_mmap: opts.config.use_mmap ?? true,
    use_mlock: opts.config.use_mlock ?? false,
    num_batch: isQuantized ? 512 : pm ? 128 : undefined,
    repeat_penalty: isQuantized ? 1.1 : 1.05,
    num_gpu: opts.config.num_gpu ?? (isQuantized ? 1 : 0),
    low_vram: !isQuantized,
    flash_attention: opts.config.flash_attention ?? isQuantized
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