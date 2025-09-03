# BYOK Research Copilot

A **local-only** AI research assistant where you bring your own API keys. Secure, private, and never pushes to remote repositories.

## 🔐 Security Features

- **Local-only**: Git push is completely disabled via pre-push hook
- **No remote storage**: API keys stored only in your browser's localStorage
- **Key masking**: API keys are never logged or displayed in plain text
- **Runtime protection**: Server strips sensitive data from all logs

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install dependencies for both server and web
cd server && npm install
cd ../web && npm install
```

### 2. Start Development Servers
```bash
# Option 1: Run both servers from root (requires concurrently)
npm install -g concurrently
npm run dev

# Option 2: Use the dev script
chmod +x scripts/dev.sh
./scripts/dev.sh

# Option 3: Manual (run in separate terminals)
cd server && npm run dev    # Terminal 1 (Port 5174)
cd web && npm run dev       # Terminal 2 (Port 5173)
```

### 3. Configure Your API Keys
1. Open http://localhost:5173
2. Click "Configure API Key" or "Keys & Settings"
3. Paste your API keys:
   - **OpenAI**: `sk-...` from https://platform.openai.com/api-keys
   - **Anthropic**: `sk-ant-...` from https://console.anthropic.com/
   - **DeepSeek**: `sk-...` from https://platform.deepseek.com/

### 4. Choose Your Mode
- **Direct**: Standard chat interface
- **Research**: Generates research plans and citations (stubbed)
- **Coach**: Optimizes prompts and asks clarifying questions

## 🎯 Features

### Chat Interface
- **Shift+Enter**: New line in message
- **Enter**: Send message
- **Auto-save**: Chat history preserved locally
- **Model selection**: Switch between providers and models

### Prompting Modes

#### Research Mode
Provides structured research with:
- **Plan** section outlining research approach
- Comprehensive synthesis from multiple perspectives
- **Citations** section (currently stubbed with example sources)

#### Prompt Coach Mode
Helps optimize vague requests by generating:
- **Optimized Prompt** blocks with Task, Context, Constraints, etc.
- Focused clarifying questions when needed
- Prompt engineering guidance

#### Direct Mode
Standard conversational chat without special formatting.

### Settings & Security
- **API Key Management**: Masked display (••••), never logged
- **Model Router**: Support for OpenAI, Anthropic, and DeepSeek
- **Temperature Control**: 0.0 - 2.0 range
- **Token Limits**: Configurable max tokens per request
- **Web Search Toggle**: (Currently stubbed for future implementation)

## 📁 Project Structure

```
BYok/
├── server/          # Express API proxy (Port 5174)
│   ├── src/
│   │   ├── server.ts        # Main server with /v1/chat endpoint
│   │   ├── types.ts         # TypeScript interfaces
│   │   └── providers/       # AI provider adapters
│   │       ├── openai.ts
│   │       ├── anthropic.ts
│   │       └── deepseek.ts
│   └── env.sample   # Environment template
│
├── web/            # React frontend (Port 5173)
│   └── src/
│       ├── components/      # UI components
│       ├── hooks/          # React hooks for state
│       └── copilotSpec.ts  # System prompts & behavior
│
├── scripts/dev.sh  # Development startup script
└── .git/hooks/pre-push     # Blocks all git push operations
```

## 🛡️ Security Guarantees

### What's Protected
- ✅ API keys never leave your machine except to AI providers
- ✅ No server-side storage of keys or conversations  
- ✅ Git push completely disabled (try it - it will fail!)
- ✅ Keys masked in UI and redacted from logs
- ✅ Local-only operation with no telemetry

### Warning Signs to Rotate Keys
- If you see your key in plain text anywhere
- If you accidentally paste a key in chat (the app will warn you)
- If you commit this repo anywhere (shouldn't happen due to push blocking)

## 💻 Development

### Available Commands

```bash
# Development (auto-reload)
npm run dev          # Both server and web
cd server && npm run dev    # Server only  
cd web && npm run dev       # Web only

# Production build
npm run build        # Both packages
cd server && npm run build  # Server only
cd web && npm run build     # Web only

# Production start (after build)
npm start           # Server only (serve built web from server)

# Clean all builds
npm run clean
```

### Adding New Providers

1. Create adapter in `server/src/providers/newprovider.ts`:
```typescript
export const newProviderAdapter: ProviderAdapter = {
  name: 'NewProvider',
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Implementation
  }
};
```

2. Register in `server/src/server.ts`:
```typescript
const providers = {
  // existing providers...
  newprovider: newProviderAdapter
};
```

3. Update `web/src/copilotSpec.ts`:
```typescript
export const MODELS = {
  // existing models...
  newprovider: [
    { id: 'model-id', name: 'Model Name', maxTokens: 4000 }
  ]
};
```

## 🤝 Contributing

This is a local-only tool - no remote contributions by design! However, you can:

1. Fork the original repo (before push-blocking)
2. Make changes locally  
3. Share your modifications via other means (files, patches, etc.)

## ⚠️ Important Reminders

- **NEVER** add this repo to a remote after configuration
- **NEVER** commit API keys (they're in .gitignore, but be careful)
- **ALWAYS** rotate keys if they're accidentally exposed
- **REMEMBER** this is local-only by design - push is permanently disabled

---

**🚫 PUSH DISABLED**: This repository has git push permanently disabled for security. This is intentional and protects your API keys.