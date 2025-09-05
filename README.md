# BYOK Copilot

<img width="1680" height="1050" alt="Screenshot 2025-09-05 at 5 47 26 PM" src="https://github.com/user-attachments/assets/969f5b45-5e53-4fe5-b668-ddecf8ee1bc9" />
<img width="1680" height="1050" alt="Screenshot 2025-09-05 at 6 11 48 PM" src="https://github.com/user-attachments/assets/3e129e85-48fc-46f2-ab30-e06c8e67faaf" />


A world-class, local-only, bring-your-own-key AI chat application that supports multiple providers with a beautiful dark interface.

## ✨ Features

- **🔒 Local-Only & Secure**: API keys never leave your browser. Zero telemetry, zero tracking.
- **🌐 Multi-Provider Support**: OpenAI, Anthropic (Claude), Google Gemini, and DeepSeek
- **💾 Persistent Conversations**: Chat history stored locally with IndexedDB
- **🎨 Beautiful Dark Theme**: Full-bleed, opaque surfaces designed for extended use
- **⌨️ Keyboard Shortcuts**: Cmd+N (new chat), Cmd+K (settings), Escape (close modals)
- **🔧 Dynamic Configuration**: Per-provider API keys and model selection
- **✅ Key Validation**: Test your API keys before using them
- **📝 Conversation Management**: Rename, delete, and organize your chats
- **🚫 Git-Safe**: Push protection to prevent accidental key exposure

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   - Web app: http://localhost:5173
   - Server: http://localhost:5174

4. **Configure API keys**
   - Press `Cmd+K` or click Settings
   - Select your provider and add your API key
   - Test the key to verify it works

5. **Start chatting!**
   - Press `Cmd+N` for a new conversation
   - Your chats are automatically saved

## 🔑 Supported Providers

| Provider | Models | API Key Format | Get Key |
|----------|--------|----------------|---------|
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo | `sk-...` | [Platform](https://platform.openai.com/api-keys) |
| **Anthropic** | claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus | `sk-ant-...` | [Console](https://console.anthropic.com/) |
| **Google Gemini** | gemini-1.5-pro, gemini-1.5-flash, gemini-1.0-pro | API key | [AI Studio](https://aistudio.google.com/) |
| **DeepSeek** | deepseek-chat, deepseek-coder, deepseek-reasoner | `sk-...` | [Platform](https://platform.deepseek.com/) |

## ⌨️ Keyboard Shortcuts

- **`Cmd+N`** / **`Ctrl+N`**: New chat
- **`Cmd+K`** / **`Ctrl+K`**: Open settings  
- **`Escape`**: Close modal
- **`Enter`**: Send message
- **`Shift+Enter`**: New line in message

## 🏗️ Architecture

### Frontend (`/web`)
- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** for styling
- **Zustand** for state management  
- **Dexie** for IndexedDB persistence
- **Dark theme by default** with opaque surfaces

### Backend (`/server`)
- **Express.js** API proxy server
- **Provider adapters** for each AI service
- **Security middleware** (helmet, CORS)
- **Error handling** with sanitized logging

### Data Layer
- **IndexedDB** with schema versioning
- **Migration** from localStorage (if detected)
- **Conversation** and **Settings** tables
- **Per-provider API key storage**

## 🛡️ Security

- **Local storage only**: All data stays in your browser
- **API key masking**: Keys are hidden in the UI
- **No server persistence**: Keys never touch the filesystem
- **Sanitized logging**: Keys are stripped from error logs
- **Git protection**: Push disabled to prevent key leaks
- **HTTPS enforcement**: All provider API calls use HTTPS

## 🧪 Development

```bash
# Install dependencies
npm install

# Run development (web + server concurrently)
npm run dev

# Build production bundles  
npm run build

# Start production server
npm start

# Clean build artifacts
npm run clean
```

### Project Structure
```
├── web/                 # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── state/       # Zustand store
│   │   ├── lib/         # Database & utilities
│   │   └── constants/   # Models & providers
├── server/              # Express backend
│   ├── src/
│   │   ├── providers/   # AI service adapters
│   │   └── types.ts     # TypeScript definitions
└── package.json         # Workspace root
```

## 🔧 Configuration

### Environment Variables (Optional)
Create `server/.env.local`:
```bash
# Custom API endpoints (optional)
OPENAI_BASE_URL=https://api.openai.com/v1
ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
GEMINI_BASE_URL=https://generativelanguage.googleapis.com
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Anthropic version
ANTHROPIC_VERSION=2023-06-01

# Server port
PORT=5174
```

### Settings Storage
All settings are stored locally in IndexedDB:
- Per-provider API keys
- Selected provider and model
- Temperature and max tokens
- Conversation history

## 🐛 Troubleshooting

### API Key Issues
- ❌ **401/403 errors**: Invalid API key for the selected provider
- ⏱️ **429 errors**: Rate limited - wait and retry
- 🔧 **Test failed**: Use "Test Key" button to diagnose

### Connection Issues  
- 🌐 Check that both web (5173) and server (5174) are running
- 🔒 Verify CORS allows localhost connections
- 📶 Test your network connection

### Storage Issues
- 🗑️ Use "Clear All Data" in settings to reset
- 🔍 Check browser IndexedDB in DevTools
- 🔄 Try refreshing the page

## 📋 Manual QA Checklist

- [ ] Dark theme loads by default
- [ ] API key modal is completely opaque (not transparent)  
- [ ] New Chat creates unique conversations with proper IDs
- [ ] Chat history persists across browser reloads
- [ ] Conversation rename and delete work correctly
- [ ] Provider switching updates model list and key field
- [ ] Invalid API keys show provider-specific error messages
- [ ] No API keys appear in browser console logs
- [ ] All keyboard shortcuts work as expected
- [ ] Test Key validates correctly for each provider

## 📄 License

MIT License - Use at your own risk.

---

**🔐 Security Reminder**: Keep your API keys secure and never commit them to version control!
