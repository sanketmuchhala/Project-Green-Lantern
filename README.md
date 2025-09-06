# Lantern — Minimalist chat UI for cloud & local LLMs with built-in Prompt Analytics

Build better prompts, faster responses, and clearer insights. Lantern pairs a distraction-free dark UI with first-class support for **BYOK cloud models** and **local Ollama models**—plus an on-device **Prompt Analytics** dashboard that helps you see how prompt choices affect **latency, cost, and helpfulness**.

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
</p>

<img width="1680" height="1050" alt="Screenshot 2025-09-06 at 7 57 06 PM" src="https://github.com/user-attachments/assets/c5c41e7d-b5d5-41fd-a4a9-4e755c257ee5" />
<img width="1680" height="1050" alt="Screenshot 2025-09-05 at 5 47 26 PM" src="https://github.com/user-attachments/assets/a05a05a0-a90a-4221-aa70-3035f98d9b1d" />


## Why Lantern?

- **Minimal, fast UI** — thoughtfully spaced, opaque panels, no visual noise
- **Cloud + Local** — plug your keys or run Mistral/Qwen/Llama via Ollama on Apple Silicon
- **Prompt Analytics** — latency per turn, TTFT, context bloat, outcome mix, model comparisons
- **Thinking HUD** — abstract progress (elapsed, tok/s, phases) during generation; no raw chain-of-thought
- **Smooth scroll** — no jarring jumps when streaming responses
- **100% local-first** — integrates without altering your existing API shapes

## Quick Start

### Cloud (BYOK)
1. Open Settings → add your provider key (OpenAI/Anthropic/Gemini/DeepSeek)
2. Pick a model and chat

### Local with Ollama
```bash
# Install Ollama
brew install ollama
ollama serve &

# Get a lightweight model
ollama pull gemma2:2b

# Configure Lantern
# Settings → Provider: Local (Ollama) → Model: gemma2:2b
# Optional: Performance Mode ON for ultra-fast responses
```

### Prompt Analytics
- Visit `/promptscope` (displays as **Prompt Analytics** in the UI)
- Charts include:
  - **Event Latency Timeline** (each prompt as individual points)
  - **Context Bloat trend** (prompt tokens % of total)
  - **Outcome Mix** (OK/Refusal/Error rates)  
  - **Quality vs Cost** scatter by model
  - **Real-time system metrics** (CPU, memory, Ollama status)

## Architecture

```mermaid
%%{init: {'theme':'dark', 'themeVariables': { 'primaryColor': '#0b0b0b', 'primaryTextColor': '#e5e5e5', 'lineColor': '#666' }}}%%
flowchart LR
  A[User] --> B[Lantern UI]
  B -->|/v1/chat| C[Router]
  C -->|Cloud keys| D[(Cloud Providers)]
  C -->|Local HTTP| E[(Ollama)]
  B -->|client logging| F[(IndexedDB)]
  F --> G[Prompt Analytics]
  
  subgraph Cloud Providers
    D1[OpenAI]
    D2[Anthropic]
    D3[Gemini]
    D4[DeepSeek]
  end
  
  subgraph Local Stack
    E1[Mistral]
    E2[Llama]
    E3[Qwen]
    E4[Gemma2]
  end
  
  D --> D1
  D --> D2
  D --> D3
  D --> D4
  
  E --> E1
  E --> E2
  E --> E3
  E --> E4
```

## Data Flow - Prompt Analytics

```mermaid
%%{init: {'theme':'dark', 'themeVariables': { 'primaryColor': '#0b0b0b', 'primaryTextColor': '#e5e5e5', 'lineColor': '#666' }}}%%
flowchart TB
  subgraph Client
    A[Chat Turn] --> B[Turn Instrumentation]
    B --> C[IndexedDB Storage]
    C --> D[Analytics Dashboard]
  end
  
  subgraph Metrics
    D --> E[Latency Timeline]
    D --> F[Context Bloat]
    D --> G[Quality Metrics]
    D --> H[System Monitor]
  end
  
  subgraph Real-time
    H --> I[CPU/Memory]
    H --> J[Ollama Status]
    H --> K[Model Loading]
  end
  
  B --> L[TTFT Tracking]
  B --> M[Token Counting] 
  B --> N[Error Logging]
  
  L --> E
  M --> F
  N --> G
```

## Features in Detail

### Thinking HUD
- **Abstract progress** during model generation
- **Phases**: Planning → Drafting → Refining
- **Metrics**: Elapsed time, tokens/second estimate
- **Safe**: No raw chain-of-thought exposure
- **Collapsible**: Optional reasoning summaries (when available)

### Smooth Scroll
- **No jumps** when pressing Enter to send messages
- **Sticky bottom** behavior during streaming
- **Smooth reveals** of assistant responses
- **Focus-safe** scroll management

### Prompt Analytics Dashboard
- **Event timeline**: Every prompt plotted with latency/TTFT
- **Context efficiency**: Track prompt bloat over time
- **Model comparison**: Quality vs cost scatter plots
- **System monitoring**: Real-time CPU/memory/Ollama status
- **Privacy-first**: All data stays in browser IndexedDB

### Performance Mode (Local)
- **Ultra-fast** responses on Apple Silicon
- **Reduced context** (512 tokens) for speed
- **Short outputs** (64 tokens) for rapid iteration
- **Conversation trimming** to maintain context
- **2-thread limit** to prevent system overload

## Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm run dev

# Build production
pnpm run build

# Run tests
pnpm run test
```

## File Structure

```
├── packages/
│   ├── web/           # React frontend
│   │   ├── src/
│   │   │   ├── components/   # UI components
│   │   │   ├── promptops/    # Analytics system
│   │   │   └── hooks/        # Smooth scroll, etc.
│   └── server/        # Node.js backend
│       ├── src/
│       │   ├── providers/    # Cloud/local adapters
│       │   └── routes/       # API endpoints
└── README.md          # You are here
```

## Privacy & Security

- **Local-first**: Analytics data stays in your browser
- **No telemetry**: Zero data leaves your machine
- **Key security**: API keys never logged or exposed
- **BYOK principle**: You control your data and keys
- **Local Ollama**: Runs entirely on your hardware

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a PR

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*Lantern: Light up your AI conversations with clarity and insight.*
