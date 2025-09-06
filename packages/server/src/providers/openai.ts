import { ChatRequest, ChatResponse, EmbeddingRequest, EmbeddingResponse, ProviderAdapter } from '../types.js';

export const openaiProvider: ProviderAdapter = {
  name: 'OpenAI',
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { messages, model, temperature = 0.7, max_tokens = 4000, api_key } = request;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
        throw { code: 'AUTH', provider: 'openai', message: 'Invalid or missing API key for OpenAI' };
      }
      
      if (response.status === 429) {
        throw { code: 'RATE_LIMIT', provider: 'openai', message: 'Rate limited by OpenAI API' };
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
      
      throw { code: 'HTTP', status: response.status, provider: 'openai', message: errorMessage };
    }

    let data: any;
    try {
      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        throw { code: 'HTTP', status: response.status, provider: 'openai', message: 'Empty response from OpenAI API' };
      }
      
      data = JSON.parse(responseText);
      
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        throw { code: 'HTTP', status: response.status, provider: 'openai', message: 'Invalid response structure from OpenAI API' };
      }
      
    } catch (jsonError: any) {
      console.log(`[OpenAI] JSON parsing error: ${jsonError.message}`);
      throw { code: 'HTTP', status: response.status, provider: 'openai', message: `Invalid JSON response from OpenAI API: ${jsonError.message}` };
    }
    
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