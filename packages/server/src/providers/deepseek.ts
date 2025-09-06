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
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${trimmedKey}`,
          'User-Agent': 'BYOK-Research-Copilot/1.0'
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
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
    } catch (networkError: any) {
      clearTimeout(timeoutId);
      
      if (networkError.name === 'AbortError') {
        console.log(`[DeepSeek] Request timeout after 30 seconds`);
        throw { code: 'HTTP', status: 408, provider: 'deepseek', message: 'Request timeout - DeepSeek API took too long to respond' };
      }
      
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

    let data: any;
    try {
      const responseText = await response.text();
      console.log(`[DeepSeek] Response body length: ${responseText.length}`);
      
      if (!responseText || responseText.trim() === '') {
        throw { code: 'HTTP', status: response.status, provider: 'deepseek', message: 'Empty response from DeepSeek API' };
      }
      
      // Log first 200 chars for debugging (without exposing sensitive data)
      const preview = responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText;
      console.log(`[DeepSeek] Response preview: ${preview}`);
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError: any) {
        console.log(`[DeepSeek] JSON parsing failed. Raw response: ${responseText}`);
        
        // Check if response looks like HTML (common error page response)
        if (responseText.trim().startsWith('<')) {
          throw { code: 'HTTP', status: response.status, provider: 'deepseek', message: 'DeepSeek API returned HTML instead of JSON - possible server error or maintenance' };
        }
        
        // Check if response looks like plain text error
        if (!responseText.includes('{') && !responseText.includes('[')) {
          throw { code: 'HTTP', status: response.status, provider: 'deepseek', message: `DeepSeek API error: ${responseText}` };
        }
        
        throw parseError;
      }
      
    } catch (jsonError: any) {
      console.log(`[DeepSeek] JSON parsing error: ${jsonError.message}`);
      throw { code: 'HTTP', status: response.status, provider: 'deepseek', message: `Invalid JSON response from DeepSeek API: ${jsonError.message}` };
    }
    
    // Validate response structure
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.log(`[DeepSeek] Invalid response structure:`, data);
      throw { code: 'HTTP', status: response.status, provider: 'deepseek', message: 'Invalid response structure from DeepSeek API' };
    }
    
    const choice = data.choices[0];
    if (!choice.message || !choice.message.content) {
      console.log(`[DeepSeek] Missing message content in response:`, choice);
      throw { code: 'HTTP', status: response.status, provider: 'deepseek', message: 'No message content in DeepSeek API response' };
    }
    
    return {
      message: {
        role: 'assistant',
        content: choice.message.content,
        timestamp: Date.now()
      },
      usage: data.usage
    };
  }
};