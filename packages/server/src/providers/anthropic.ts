import { ChatRequest, ChatResponse, ProviderAdapter } from '../types.js';

export const anthropicProvider: ProviderAdapter = {
  name: 'Anthropic',
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { messages, model, temperature = 0.7, max_tokens = 4000, api_key } = request;
    
    // Separate system message from other messages
    const systemMessage = messages.find(msg => msg.role === 'system');
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    
    const requestBody: any = {
      model,
      max_tokens,
      temperature,
      messages: conversationMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    };
    
    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': api_key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 401 || response.status === 403) {
        throw { code: 'AUTH', provider: 'anthropic', message: 'Invalid or missing API key for Anthropic' };
      }
      
      if (response.status === 429) {
        throw { code: 'RATE_LIMIT', provider: 'anthropic', message: 'Rate limited by Anthropic API' };
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
      
      throw { code: 'HTTP', status: response.status, provider: 'anthropic', message: errorMessage };
    }

    let data: any;
    try {
      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        throw { code: 'HTTP', status: response.status, provider: 'anthropic', message: 'Empty response from Anthropic API' };
      }
      
      data = JSON.parse(responseText);
      
      if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
        throw { code: 'HTTP', status: response.status, provider: 'anthropic', message: 'Invalid response structure from Anthropic API' };
      }
      
    } catch (jsonError: any) {
      console.log(`[Anthropic] JSON parsing error: ${jsonError.message}`);
      throw { code: 'HTTP', status: response.status, provider: 'anthropic', message: `Invalid JSON response from Anthropic API: ${jsonError.message}` };
    }
    
    return {
      message: {
        role: 'assistant',
        content: data.content[0]?.text || 'No response generated',
        timestamp: Date.now()
      },
      usage: data.usage
    };
  }
};