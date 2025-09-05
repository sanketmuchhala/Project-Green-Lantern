import { ChatRequest, ChatResponse, ProviderAdapter } from '../types.js';

export const deepseekProvider: ProviderAdapter = {
  name: 'DeepSeek',
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { messages, model, temperature = 0.7, max_tokens = 4000, api_key } = request;
    
    // Validate API key format
    if (!api_key || api_key.length < 10) {
      throw { code: 'AUTH', provider: 'deepseek', message: 'DeepSeek API key is required and must be at least 10 characters' };
    }
    
    // Check for common API key issues
    if (api_key.includes('...') || api_key.includes('*')) {
      throw { code: 'AUTH', provider: 'deepseek', message: 'DeepSeek API key appears to be truncated or masked. Please provide the full key.' };
    }
    
    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    console.log(`🔍 DeepSeek: Making request to ${baseUrl}/v1/chat/completions with model ${model}`);
    
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/v1/chat/completions`, {
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
    } catch (networkError: any) {
      console.log(`❌ DeepSeek: Network error - ${networkError.message}`);
      throw { code: 'HTTP', status: 0, provider: 'deepseek', message: `Network error: ${networkError.message}` };
    }
    
    console.log(`🔍 DeepSeek: Response status ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any = null;
      
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // JSON parsing failed, use raw text
      }
      
      // DeepSeek specific error handling
      if (errorData?.error?.type === 'authentication_error' || 
          errorData?.error?.message?.includes('api key') ||
          response.status === 401 || response.status === 403) {
        const keyHint = errorData?.error?.message || 'Invalid or missing API key';
        throw { code: 'AUTH', provider: 'deepseek', message: `DeepSeek API Error: ${keyHint}` };
      }
      
      if (response.status === 429) {
        throw { code: 'RATE_LIMIT', provider: 'deepseek', message: 'Rate limited by DeepSeek API' };
      }
      
      // More detailed error message
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      if (errorData?.error?.message) {
        errorMessage = `DeepSeek API Error: ${errorData.error.message}`;
      } else if (errorText) {
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