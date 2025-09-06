# BYOK Copilot

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
</p>

<p align="center">
  <strong>A world-class, local-only, bring-your-own-key AI chat application</strong><br>
  Supporting multiple providers with a beautiful dark interface and zero telemetry
</p>

<img width="1680" height="1050" alt="BYOK Copilot Interface" src="https://github.com/user-attachments/assets/969f5b45-5e53-4fe5-b668-ddecf8ee1bc9" />

---

## Architecture Overview

```mermaid
graph TB
    subgraph "User Interface"
        UI[React Web App<br/>Port 5173]
        UI --> |User Input| CHAT[Chat Interface]
        UI --> |Configuration| SETTINGS[Settings Modal]
        UI --> |Storage| IDB[(IndexedDB<br/>Local Storage)]
    end
    
    subgraph "Backend Services"
        SERVER[Express Server<br/>Port 5174]
        SERVER --> |Proxy Requests| PROVIDERS{Provider Router}
    end
    
    subgraph "AI Providers"
        PROVIDERS --> OPENAI[OpenAI API<br/>GPT Models]
        PROVIDERS --> ANTHROPIC[Anthropic API<br/>Claude Models]
        PROVIDERS --> GEMINI[Google Gemini API<br/>Gemini Models]
        PROVIDERS --> DEEPSEEK[DeepSeek API<br/>DeepSeek Models]
    end
    
    subgraph "Security Layer"
        KEYS[API Key Validation]
        SANITIZE[Request Sanitization]
        CORS[CORS Protection]
    end
    
    UI -.->|HTTPS Only| SERVER
    SERVER --> KEYS
    SERVER --> SANITIZE
    SERVER --> CORS
    IDB -.->|Never Synced| UI
    
    classDef frontend fill:#61DAFB,stroke:#20232A,stroke-width:2px,color:#20232A
    classDef backend fill:#43853D,stroke:#2d5a27,stroke-width:2px,color:white
    classDef provider fill:#FF6B6B,stroke:#E74C3C,stroke-width:2px,color:white
    classDef security fill:#F39C12,stroke:#E67E22,stroke-width:2px,color:white
    classDef storage fill:#9B59B6,stroke:#8E44AD,stroke-width:2px,color:white
    
    class UI,CHAT,SETTINGS frontend
    class SERVER,PROVIDERS backend
    class OPENAI,ANTHROPIC,GEMINI,DEEPSEEK provider
    class KEYS,SANITIZE,CORS security
    class IDB storage
```

## Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant S as Server
    participant P as AI Provider
    participant D as IndexedDB
    
    U->>W: Type message & send
    W->>D: Store message locally
    W->>S: POST /v1/chat
    Note over W,S: API key included in request
    
    S->>S: Validate API key format
    S->>S: Sanitize request
    S->>P: Forward to provider API
    
    alt Success Response
        P-->>S: AI response
        S-->>W: Formatted response
        W->>D: Store response locally
        W-->>U: Display message
    else Error Response
        P-->>S: Error details
        S->>S: Sanitize error logs
        S-->>W: User-friendly error
        W-->>U: Show error message
    end
    
    Note over D: All data stays local<br/>Never synced to cloud
```

## Features

- **Local-Only & Secure**: API keys never leave your browser. Zero telemetry, zero tracking.
- **Multi-Provider Support**: OpenAI, Anthropic (Claude), Google Gemini, and DeepSeek
- **Persistent Conversations**: Chat history stored locally with IndexedDB
- **Beautiful Dark Theme**: Full-bleed, opaque surfaces designed for extended use
- **Keyboard Shortcuts**: Cmd+N (new chat), Cmd+K (settings), Escape (close modals)
- **Dynamic Configuration**: Per-provider API keys and model selection
- **Key Validation**: Test your API keys before using them
- **Conversation Management**: Rename, delete, and organize your chats
- **Git-Safe**: Push protection to prevent accidental key exposure

## Quick Start

```mermaid
flowchart TD
    START([Start]) --> INSTALL[Install Dependencies<br/>`npm install`]
    INSTALL --> DEV[Start Development<br/>`npm run dev`]
    DEV --> BROWSER[Open Browser<br/>localhost:5173]
    BROWSER --> SETTINGS[Configure API Keys<br/>Cmd+K]
    SETTINGS --> TEST{Test API Key}
    TEST -->|Success| CHAT[Start Chatting<br/>Cmd+N]
    TEST -->|Failed| SETTINGS
    CHAT --> END([Ready to Use])
    
    classDef startend fill:#2ECC71,stroke:#27AE60,stroke-width:2px,color:white
    classDef process fill:#3498DB,stroke:#2980B9,stroke-width:2px,color:white
    classDef decision fill:#F39C12,stroke:#E67E22,stroke-width:2px,color:white
    
    class START,END startend
    class INSTALL,DEV,BROWSER,SETTINGS,CHAT process
    class TEST decision
```

### Installation Commands

```bash
# 1. Install dependencies
npm install

# 2. Start development servers
npm run dev

# 3. Open in browser
# Web: http://localhost:5173
# API: http://localhost:5174
```

## Supported AI Providers

```mermaid
graph LR
    subgraph "OpenAI"
        O1[GPT-4o]
        O2[GPT-4o-mini]
        O3[GPT-4-turbo]
        O4[GPT-3.5-turbo]
    end
    
    subgraph "Anthropic"
        A1[Claude-3.5-Sonnet]
        A2[Claude-3.5-Haiku]
        A3[Claude-3-Opus]
    end
    
    subgraph "Google"
        G1[Gemini-1.5-Pro]
        G2[Gemini-1.5-Flash]
        G3[Gemini-1.0-Pro]
    end
    
    subgraph "DeepSeek"
        D1[DeepSeek-Chat]
        D2[DeepSeek-Coder]
        D3[DeepSeek-Reasoner]
    end
    
    USER[User Input] --> ROUTER{Provider Router}
    ROUTER --> OpenAI
    ROUTER --> Anthropic
    ROUTER --> Google
    ROUTER --> DeepSeek
    
    classDef openai fill:#10A37F,stroke:#0F9C75,stroke-width:2px,color:white
    classDef anthropic fill:#D97757,stroke:#C5684A,stroke-width:2px,color:white
    classDef google fill:#4285F4,stroke:#357ABD,stroke-width:2px,color:white
    classDef deepseek fill:#6C5CE7,stroke:#5A4FCF,stroke-width:2px,color:white
    classDef router fill:#2D3436,stroke:#636E72,stroke-width:2px,color:white
    
    class O1,O2,O3,O4 openai
    class A1,A2,A3 anthropic  
    class G1,G2,G3 google
    class D1,D2,D3 deepseek
    class ROUTER,USER router
```

| Provider | Models | API Key Format | Get Key |
|----------|--------|----------------|---------|
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo | `sk-...` | [Platform](https://platform.openai.com/api-keys) |
| **Anthropic** | claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus | `sk-ant-...` | [Console](https://console.anthropic.com/) |
| **Google Gemini** | gemini-1.5-pro, gemini-1.5-flash, gemini-1.0-pro | API key | [AI Studio](https://aistudio.google.com/) |
| **DeepSeek** | deepseek-chat, deepseek-coder, deepseek-reasoner | `sk-...` | [Platform](https://platform.deepseek.com/) |

## Security Model

```mermaid
graph TB
    subgraph "Browser Environment"
        UI[User Interface]
        IDB[(IndexedDB<br/>Local Storage)]
        KEYS[Encrypted API Keys]
    end
    
    subgraph "Server Environment" 
        SERVER[Express Server]
        MIDDLEWARE[Security Middleware]
        SANITIZE[Log Sanitization]
    end
    
    subgraph "External APIs"
        PROVIDERS[AI Providers]
    end
    
    UI <-->|Encrypted| IDB
    IDB <-->|Never Transmitted| KEYS
    UI -->|HTTPS Only| SERVER
    SERVER --> MIDDLEWARE
    MIDDLEWARE --> SANITIZE
    SERVER -->|Proxied Requests| PROVIDERS
    
    subgraph "Security Features"
        MASK[Key Masking in UI]
        STRIP[Key Stripping in Logs]
        CORS[CORS Protection]
        HELMET[Security Headers]
        NOPERSIST[No Server Persistence]
    end
    
    SERVER --> MASK
    SERVER --> STRIP  
    SERVER --> CORS
    SERVER --> HELMET
    SERVER --> NOPERSIST
    
    classDef browser fill:#61DAFB,stroke:#20232A,stroke-width:2px,color:#20232A
    classDef server fill:#43853D,stroke:#2d5a27,stroke-width:2px,color:white
    classDef external fill:#E74C3C,stroke:#C0392B,stroke-width:2px,color:white
    classDef security fill:#F39C12,stroke:#E67E22,stroke-width:2px,color:white
    
    class UI,IDB,KEYS browser
    class SERVER,MIDDLEWARE,SANITIZE server
    class PROVIDERS external
    class MASK,STRIP,CORS,HELMET,NOPERSIST security
```

## Project Structure

```mermaid
graph TD
    ROOT[BYOK Copilot]
    
    ROOT --> PACKAGES[packages/]
    ROOT --> SCRIPTS[scripts/]
    ROOT --> CONFIG[Configuration Files]
    
    PACKAGES --> WEB[web/ - React Frontend]
    PACKAGES --> SERVER[server/ - Express Backend]
    PACKAGES --> TYPES[types/ - Shared Types]
    
    WEB --> WEBSRC[src/]
    WEBSRC --> COMPONENTS[components/ - UI Components]
    WEBSRC --> STATE[state/ - Zustand Store]
    WEBSRC --> LIB[lib/ - Database & Utils]
    WEBSRC --> CONSTANTS[constants/ - Models & Providers]
    
    SERVER --> SERVERSRC[src/]
    SERVERSRC --> PROVIDERS[providers/ - AI Adapters]
    SERVERSRC --> SERVERFILE[server.ts - Main Server]
    SERVERSRC --> SERVERTYPES[types.ts - Type Definitions]
    
    SCRIPTS --> EMOJI[no-emoji-check.mjs]
    SCRIPTS --> DEADCODE[deadcode-analyzer.mjs]
    SCRIPTS --> DEV[dev.sh]
    
    CONFIG --> PKG[package.json - Workspace]
    CONFIG --> TS[tsconfig.json - TypeScript]
    CONFIG --> TAILWIND[tailwind.config.js]
    
    classDef folder fill:#3498DB,stroke:#2980B9,stroke-width:2px,color:white
    classDef file fill:#95A5A6,stroke:#7F8C8D,stroke-width:1px,color:white
    classDef important fill:#E74C3C,stroke:#C0392B,stroke-width:2px,color:white
    
    class ROOT,PACKAGES,WEB,SERVER,TYPES,WEBSRC,SERVERSRC,SCRIPTS folder
    class COMPONENTS,STATE,LIB,CONSTANTS,PROVIDERS file
    class SERVERFILE,PKG,TS important
```

## Data Flow & State Management

```mermaid
graph LR
    subgraph "Frontend State"
        ZUSTAND[Zustand Store]
        REACT[React Components]
        IDB[(IndexedDB)]
    end
    
    subgraph "User Actions"
        SEND[Send Message]
        SWITCH[Switch Provider]
        CONFIG[Configure Settings]
    end
    
    subgraph "Backend Processing"
        VALIDATE[Validate Request]
        PROXY[Proxy to Provider]
        RESPONSE[Process Response]
    end
    
    SEND --> ZUSTAND
    SWITCH --> ZUSTAND  
    CONFIG --> ZUSTAND
    
    ZUSTAND <--> REACT
    ZUSTAND <--> IDB
    
    REACT --> VALIDATE
    VALIDATE --> PROXY
    PROXY --> RESPONSE
    RESPONSE --> REACT
    
    classDef action fill:#E74C3C,stroke:#C0392B,stroke-width:2px,color:white
    classDef state fill:#9B59B6,stroke:#8E44AD,stroke-width:2px,color:white
    classDef process fill:#2ECC71,stroke:#27AE60,stroke-width:2px,color:white
    classDef storage fill:#F39C12,stroke:#E67E22,stroke-width:2px,color:white
    
    class SEND,SWITCH,CONFIG action
    class ZUSTAND,REACT state
    class VALIDATE,PROXY,RESPONSE process
    class IDB storage
```

## Development Workflow

```mermaid
flowchart TD
    CLONE[Clone Repository] --> INSTALL[npm install]
    INSTALL --> DEV[npm run dev]
    
    subgraph "Development Mode"
        DEV --> WATCH[File Watching Active]
        WATCH --> FRONTEND[Frontend: localhost:5173]
        WATCH --> BACKEND[Backend: localhost:5174]
    end
    
    subgraph "Quality Checks"
        QA[Quality Assurance]
        QA --> LINT[npm run lint]
        QA --> TYPE[npm run typecheck]  
        QA --> BUILD[npm run build]
        QA --> TEST[npm run test]
    end
    
    subgraph "Production"
        PROD[Production Build]
        PROD --> BUNDLE[Generate Bundles]
        BUNDLE --> DEPLOY[Deploy Artifacts]
    end
    
    FRONTEND --> QA
    BACKEND --> QA
    QA --> PROD
    
    classDef start fill:#2ECC71,stroke:#27AE60,stroke-width:2px,color:white
    classDef dev fill:#3498DB,stroke:#2980B9,stroke-width:2px,color:white
    classDef qa fill:#F39C12,stroke:#E67E22,stroke-width:2px,color:white
    classDef prod fill:#E74C3C,stroke:#C0392B,stroke-width:2px,color:white
    
    class CLONE,INSTALL start
    class DEV,WATCH,FRONTEND,BACKEND dev
    class QA,LINT,TYPE,BUILD,TEST qa
    class PROD,BUNDLE,DEPLOY prod
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+N` / `Ctrl+N` | New chat |
| `Cmd+K` / `Ctrl+K` | Open settings |
| `Escape` | Close modal |
| `Enter` | Send message |
| `Shift+Enter` | New line in message |

## Configuration

### Environment Variables (Optional)

Create `packages/server/.env.local`:

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

### Available Scripts

```bash
# Development
npm run dev          # Start both frontend and backend
npm run build        # Build production bundles
npm run start        # Start production server
npm run clean        # Clean build artifacts

# Quality Assurance
npm run lint         # Run ESLint + emoji check
npm run typecheck    # Run TypeScript compiler
npm run test         # Run test suite
npm run ci:no-emoji  # Check for emoji violations

# Utilities
npm run deadcode     # Analyze unused code
```

## Troubleshooting

### Common Issues & Solutions

```mermaid
flowchart TD
    ISSUE{Issue Type}
    
    ISSUE -->|API Errors| API[API Key Issues]
    ISSUE -->|Network| NETWORK[Connection Issues]
    ISSUE -->|Data| STORAGE[Storage Issues]
    
    API --> API401[401/403: Invalid API Key]
    API --> API429[429: Rate Limited]
    API --> APITEST[Test Key Failed]
    
    API401 --> APIFIX1[Check key format & validity]
    API429 --> APIFIX2[Wait and retry request]
    APITEST --> APIFIX3[Use Test Key button]
    
    NETWORK --> NET5173[Web app not loading]
    NETWORK --> NET5174[Server not responding]
    NETWORK --> NETCORS[CORS errors]
    
    NET5173 --> NETFIX1[Check port 5173 is available]
    NET5174 --> NETFIX2[Check port 5174 is available] 
    NETCORS --> NETFIX3[Verify localhost permissions]
    
    STORAGE --> DATA1[Chat history lost]
    STORAGE --> DATA2[Settings not saving]
    STORAGE --> DATA3[Database corruption]
    
    DATA1 --> DATAFIX1[Check IndexedDB in DevTools]
    DATA2 --> DATAFIX2[Clear browser data]
    DATA3 --> DATAFIX3[Use Clear All Data in settings]
    
    classDef issue fill:#E74C3C,stroke:#C0392B,stroke-width:2px,color:white
    classDef category fill:#F39C12,stroke:#E67E22,stroke-width:2px,color:white
    classDef problem fill:#95A5A6,stroke:#7F8C8D,stroke-width:1px,color:white
    classDef solution fill:#2ECC71,stroke:#27AE60,stroke-width:2px,color:white
    
    class ISSUE issue
    class API,NETWORK,STORAGE category
    class API401,API429,APITEST,NET5173,NET5174,NETCORS,DATA1,DATA2,DATA3 problem
    class APIFIX1,APIFIX2,APIFIX3,NETFIX1,NETFIX2,NETFIX3,DATAFIX1,DATAFIX2,DATAFIX3 solution
```

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run quality checks: `npm run lint && npm run typecheck`
5. Submit a pull request

### Code Quality Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Consistent formatting
- **No Emojis**: Enforced by pre-commit hooks
- **Security**: API key sanitization required

## License

MIT License - Use at your own risk.

---

<p align="center">
  <strong>Security Reminder</strong><br>
  Keep your API keys secure and never commit them to version control!
</p>

<p align="center">
  Made with care for developers who value privacy and local-first software
</p>