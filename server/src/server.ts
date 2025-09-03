import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { ChatRequest } from './types.js';
import { openaiProvider } from './providers/openai.js';
import { anthropicProvider } from './providers/anthropic.js';
import { deepseekProvider } from './providers/deepseek.js';

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
  deepseek: deepseekProvider
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Chat endpoint
app.post('/v1/chat', async (req, res) => {
  try {
    const chatRequest: ChatRequest = req.body;
    
    // Validate request
    if (!chatRequest.messages || !Array.isArray(chatRequest.messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    if (!chatRequest.provider || !providers[chatRequest.provider]) {
      return res.status(400).json({ error: 'Valid provider is required (openai, anthropic, deepseek)' });
    }
    
    if (!chatRequest.api_key) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    // Log request (without sensitive data)
    console.log(`[${new Date().toISOString()}] Chat request: ${chatRequest.provider}/${chatRequest.model}, ${chatRequest.messages.length} messages`);
    
    // Get provider and make request
    const provider = providers[chatRequest.provider];
    const response = await provider.chat(chatRequest);
    
    res.json(response);
    
  } catch (error: any) {
    console.error('Chat error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 BYOK Research Copilot Server running on http://localhost:${PORT}`);
  console.log(`⚠️  SECURITY: Local-only mode. API keys are never logged or stored.`);
  console.log(`📡 Ready to proxy requests to OpenAI, Anthropic, and DeepSeek`);
});