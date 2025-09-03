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
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    
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