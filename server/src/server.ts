import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { ChatRequest, WebSearchResult } from './types.js';
import { openaiProvider } from './providers/openai.js';
import { anthropicProvider } from './providers/anthropic.js';
import { deepseekProvider } from './providers/deepseek.js';
import { geminiProvider } from './providers/gemini.js';
import { performWebSearch, extractSearchQuery, enhancePromptWithWebResults } from './services/webSearch.js';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 5174;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Provider registry
const providers = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  deepseek: deepseekProvider,
  gemini: geminiProvider
};

// Auto-detect provider from model name
function detectProvider(model: string): keyof typeof providers {
  const modelLower = model.toLowerCase();
  
  if (modelLower.includes('claude') || modelLower.includes('anthropic')) {
    return 'anthropic';
  }
  
  if (modelLower.includes('deepseek') || modelLower.includes('deekseek') || modelLower.includes('r1')) {
    return 'deepseek';
  }
  
  if (modelLower.includes('gemini') || modelLower.includes('google')) {
    return 'gemini';
  }
  
  // Default to OpenAI for GPT models and others
  return 'openai';
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Key validation endpoint
app.post('/v1/ping', async (req, res) => {
  try {
    let { provider, model, api_key } = req.body;
    
    if (!provider || !api_key) {
      return res.status(400).json({ error: 'Provider and API key are required' });
    }
    
    // Auto-detect provider if set to 'auto'
    if (provider === 'auto') {
      provider = detectProvider(model || '');
    }
    
    if (!providers[provider as keyof typeof providers]) {
      return res.status(400).json({ error: 'Invalid provider' });
    }
    
    console.log(`[${new Date().toISOString()}] API key test for ${provider}`);
    
    // Create a minimal test request
    const testRequest: ChatRequest = {
      provider: provider as keyof typeof providers,
      model: model || 'test',
      messages: [{ role: 'user', content: 'Hello' }],
      api_key,
      temperature: 0.1,
      max_tokens: 10
    };
    
    try {
      await providers[provider as keyof typeof providers].chat(testRequest);
      console.log(`[SUCCESS] API key test successful for ${provider}`);
      res.json({ ok: true, message: `API key valid for ${provider}` });
    } catch (error: any) {
      console.log(`[FAILED] API key test failed for ${provider}:`, error.message || error);
      
      if (error.code === 'AUTH') {
        return res.status(401).json({ ok: false, message: error.message });
      }
      
      if (error.code === 'RATE_LIMIT') {
        return res.json({ ok: true, message: 'API key valid (rate limited but functional)' });
      }
      
      // Log more details for debugging
      console.log(`[DEBUG] Error details - Code: ${error.code}, Status: ${error.status}, Provider: ${error.provider}`);
      
      // If it's any other error, the key might be valid but there's another issue
      res.json({ ok: false, message: error.message || `Test failed for ${provider}` });
    }
    
  } catch (error: any) {
    const sanitizedError = error.message ? error.message.replace(/sk-[a-zA-Z0-9]{48}/g, 'sk-***') : 'Unknown error';
    console.error('Ping error:', sanitizedError);
    res.status(500).json({ 
      ok: false, 
      message: 'Unable to test API key'
    });
  }
});

// Chat endpoint
app.post('/v1/chat', async (req, res) => {
  try {
    const chatRequest: ChatRequest = req.body;
    
    // Validate request
    if (!chatRequest.messages || !Array.isArray(chatRequest.messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    // Auto-detect provider if set to 'auto'
    let providerName: keyof typeof providers = chatRequest.provider as keyof typeof providers;
    if (chatRequest.provider === 'auto') {
      providerName = detectProvider(chatRequest.model || '');
    }
    
    if (!providerName || !providers[providerName]) {
      return res.status(400).json({ error: 'Valid provider is required (openai, anthropic, deepseek, gemini, or auto)' });
    }
    
    if (!chatRequest.api_key) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    // Log request (without sensitive data)
    console.log(`[${new Date().toISOString()}] Chat request: ${providerName}/${chatRequest.model}, ${chatRequest.messages.length} messages`);
    
    // Perform web search if requested
    let webSearchResults: WebSearchResult[] = [];
    let enhancedMessages = chatRequest.messages;
    
    if (chatRequest.web_search && chatRequest.messages.length > 0) {
      const lastMessage = chatRequest.messages[chatRequest.messages.length - 1];
      if (lastMessage.role === 'user') {
        const searchQuery = extractSearchQuery(lastMessage.content);
        console.log(`[${new Date().toISOString()}] Performing web search for: ${searchQuery}`);
        
        try {
          webSearchResults = await performWebSearch(searchQuery);
          
          if (webSearchResults.length > 0) {
            // Enhance the user's message with web search context
            const enhancedContent = enhancePromptWithWebResults(lastMessage.content, webSearchResults);
            enhancedMessages = [
              ...chatRequest.messages.slice(0, -1),
              { ...lastMessage, content: enhancedContent }
            ];
          }
        } catch (searchError) {
          console.error('Web search failed:', searchError);
        }
      }
    }
    
    // Add context awareness system message if this is a multi-turn conversation
    if (enhancedMessages.length > 1) {
      const contextMessage = {
        role: 'system' as const,
        content: `You are having an ongoing conversation with the user. Please maintain full context awareness of all previous messages, topics discussed, decisions made, and any relevant information shared throughout this conversation. Reference previous parts of our conversation when relevant and helpful.`
      };
      
      // Insert at the beginning, after any existing system messages
      const systemMessageIndex = enhancedMessages.findIndex(msg => msg.role !== 'system');
      if (systemMessageIndex > 0) {
        enhancedMessages = [
          ...enhancedMessages.slice(0, systemMessageIndex),
          contextMessage,
          ...enhancedMessages.slice(systemMessageIndex)
        ];
      } else {
        enhancedMessages = [contextMessage, ...enhancedMessages];
      }
    }
    
    // Add reasoning prompt if requested
    if (chatRequest.show_reasoning && enhancedMessages.length > 0) {
      const lastMessage = enhancedMessages[enhancedMessages.length - 1];
      if (lastMessage.role === 'user') {
        const reasoningPrompt = `${lastMessage.content}

IMPORTANT: Please show your thinking process step by step before providing your answer. Structure your response as follows:

<thinking>
[Your detailed thought process, reasoning, analysis, considerations, etc.]
</thinking>

[Your final answer/response]

Show your work and explain your reasoning clearly.`;

        enhancedMessages = [
          ...enhancedMessages.slice(0, -1),
          { ...lastMessage, content: reasoningPrompt }
        ];
      }
    }
    
    // Get provider and make request with enhanced messages
    const provider = providers[providerName];
    const enhancedRequest = { ...chatRequest, messages: enhancedMessages };
    const response = await provider.chat(enhancedRequest);
    
    // Extract reasoning if present
    let reasoning = '';
    let cleanedContent = response.message.content;
    
    if (chatRequest.show_reasoning && response.message.content.includes('<thinking>')) {
      const thinkingMatch = response.message.content.match(/<thinking>([\s\S]*?)<\/thinking>/);
      if (thinkingMatch) {
        reasoning = thinkingMatch[1].trim();
        // Remove the thinking section from the main content
        cleanedContent = response.message.content.replace(/<thinking>[\s\S]*?<\/thinking>\s*/g, '').trim();
      }
    }
    
    // Add web search results and reasoning to response
    const enhancedResponse = {
      ...response,
      message: {
        ...response.message,
        content: cleanedContent
      },
      ...(webSearchResults.length > 0 && { webSearchResults }),
      ...(reasoning && { reasoning })
    };
    
    res.json(enhancedResponse);
    
  } catch (error: any) {
    // Strip sensitive information from logs
    const sanitizedError = error.message ? error.message.replace(/sk-[a-zA-Z0-9]{48}/g, 'sk-***') : 'Unknown error';
    console.error(`Chat error for provider ${req.body.provider || 'unknown'}:`, sanitizedError);
    
    // Handle specific error types
    if (error.code === 'AUTH') {
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: error.message,
        provider: error.provider
      });
    }
    
    if (error.code === 'RATE_LIMIT') {
      return res.status(429).json({ 
        error: 'Rate limited',
        details: error.message,
        provider: error.provider
      });
    }
    
    if (error.code === 'HTTP') {
      return res.status(error.status || 500).json({ 
        error: 'HTTP error',
        details: error.message,
        provider: error.provider
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: sanitizedError
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[SERVER] BYOK Research Copilot Server running on http://localhost:${PORT}`);
  console.log(`[SECURITY] Local-only mode. API keys are never logged or stored.`);
  console.log(`[READY] Proxy ready for OpenAI, Anthropic, DeepSeek, and Gemini`);
});