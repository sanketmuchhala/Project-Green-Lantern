import { ChatRequest, ChatResponse, ProviderAdapter } from '../types.js';

export const deepseekProvider: ProviderAdapter = {
  name: 'DeepSeek',
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { messages, model, temperature = 0.7, max_tokens = 4000, api_key } = request;
    
    // Enhanced API key validation
    if (!api_key || api_key.trim().length === 0) {
      throw { code: 'AUTH', provider: 'deepseek', message: 'DeepSeek API key is required' };
    }
    
    const trimmedKey = api_key.trim();
    
    // Check for truncated keys (like the "****ngs." issue)
    if (trimmedKey.length < 20 || trimmedKey.includes('*') || trimmedKey.includes('...') || trimmedKey.endsWith('.')) {
      throw { code: 'AUTH', provider: 'deepseek', message: 'DeepSeek API key appears to be truncated, masked, or incomplete. Please provide the complete key from platform.deepseek.com/api_keys' };
    }
    
    // DeepSeek keys should not contain spaces or special characters (except underscores and hyphens)
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedKey)) {
      throw { code: 'AUTH', provider: 'deepseek', message: 'DeepSeek API key contains invalid characters. Please verify you copied the complete key correctly.' };
    }
    
    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    console.log(`[DeepSeek] Making request to ${baseUrl}/v1/chat/completions with model ${model}`);
    
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${trimmedKey}`
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
      console.log(`[DeepSeek] Network error - ${networkError.message}`);
      throw { code: 'HTTP', status: 0, provider: 'deepseek', message: `Network error: ${networkError.message}` };
    }
    
    console.log(`[DeepSeek] Response status ${response.status} ${response.statusText}`);

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