import { ChatRequest, ChatResponse, ProviderAdapter } from '../types.js';

export const deepseekProvider: ProviderAdapter = {
  name: 'DeepSeek',
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { messages, model, temperature = 0.7, max_tokens = 4000, api_key } = request;
    
    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature,
        max_tokens,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 401 || response.status === 403) {
        throw { code: 'AUTH', provider: 'deepseek', message: 'Invalid or missing API key for DeepSeek' };
      }
      
      if (response.status === 429) {
        throw { code: 'RATE_LIMIT', provider: 'deepseek', message: 'Rate limited by DeepSeek API' };
      }
      
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage += ` - ${errorData.error.message}`;
        }
      } catch (e) {
        errorMessage += ` - ${errorText}`;
      }
      
      throw { code: 'HTTP', status: response.status, provider: 'deepseek', message: errorMessage };
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