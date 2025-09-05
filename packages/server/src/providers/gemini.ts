import { ChatRequest } from '../types.js';

export interface GeminiMessage {
  role: string;
  parts: { text: string }[];
}

export interface GeminiRequestBody {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

function convertMessagesToGeminiFormat(messages: Array<{ role: string; content: string }>): GeminiMessage[] {
  return messages
    .filter(msg => msg.role !== 'system')
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
}

export const geminiProvider = {
  async chat(request: ChatRequest) {
    const baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';
    const model = request.model || 'gemini-1.5-flash';
    
    const systemMessage = request.messages.find(msg => msg.role === 'system');
    const conversationMessages = request.messages.filter(msg => msg.role !== 'system');
    
    let geminiMessages = convertMessagesToGeminiFormat(conversationMessages);
    
    if (systemMessage && geminiMessages.length > 0) {
      geminiMessages[0].parts[0].text = `${systemMessage.content}\n\n${geminiMessages[0].parts[0].text}`;
    }
    
    const requestBody: GeminiRequestBody = {
      contents: geminiMessages,
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.max_tokens || 4000
      }
    };

    const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${request.api_key}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      if (response.status === 401 || response.status === 403) {
        throw { code: 'AUTH', provider: 'gemini', message: 'Invalid or missing API key for Gemini' };
      }
      
      if (response.status === 429) {
        throw { code: 'RATE_LIMIT', provider: 'gemini', message: 'Rate limited by Gemini API' };
      }
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage += ` - ${errorData.error.message}`;
        }
      } catch (e) {
        errorMessage += ` - ${errorText}`;
      }
      
      throw { code: 'HTTP', status: response.status, provider: 'gemini', message: errorMessage };
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini');
    }

    const content = data.candidates[0].content.parts.map(part => part.text).join('');
    
    return {
      message: {
        role: 'assistant',
        content: content
      },
      usage: data.usageMetadata ? {
        prompt_tokens: data.usageMetadata.promptTokenCount,
        completion_tokens: data.usageMetadata.candidatesTokenCount,
        total_tokens: data.usageMetadata.totalTokenCount
      } : undefined
    };
  }
};