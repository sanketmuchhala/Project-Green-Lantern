import { ChatRequest, ChatResponse, ProviderAdapter } from '../types.js';

export const deepseekProvider: ProviderAdapter = {
  name: 'DeepSeek',
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { messages, model, temperature = 0.7, max_tokens = 4000, api_key } = request;
    
    if (!api_key || api_key.trim().length === 0) {
      throw { code: 'AUTH', provider: 'deepseek', message: 'Invalid or missing DeepSeek API key' };
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key.trim()}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ 
          role: m.role, 
          content: m.content 
        })),
        temperature,
        max_tokens
      })
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw { code: 'AUTH', provider: 'deepseek', message: 'Invalid or missing DeepSeek API key' };
      }
      
      if (response.status === 429) {
        // Add retry logic with backoff
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const retryResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api_key.trim()}`
          },
          body: JSON.stringify({
            model,
            messages: messages.map(m => ({ 
              role: m.role, 
              content: m.content 
            })),
            temperature,
            max_tokens
          })
        });
        
        if (!retryResponse.ok) {
          throw { code: 'RATE_LIMIT', provider: 'deepseek', message: 'Rate limited by DeepSeek' };
        }
        
        const retryData = await retryResponse.json();
        return {
          message: {
            role: 'assistant',
            content: retryData.choices[0]?.message?.content || 'No response generated',
            timestamp: Date.now()
          },
          usage: retryData.usage
        };
      }
      
      throw { code: 'HTTP', status: response.status, message: `DeepSeek API error: ${response.status} ${response.statusText}` };
    }

    const data = await response.json();
    
    return {
      message: {
        role: 'assistant',
        content: data.choices[0]?.message?.content || 'No response generated',
        timestamp: Date.now()
      },
      usage: data.usage
    };
  }
};