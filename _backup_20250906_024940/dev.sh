#!/bin/bash
# BYOK Research Copilot Development Script

echo "🚀 Starting BYOK Research Copilot..."
echo "📡 Server will run on http://localhost:5174"
echo "🌐 Web app will run on http://localhost:5173"
echo ""
echo "⚠️  SECURITY: This app is LOCAL-ONLY. Git push is disabled."
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Start both server and web in parallel
pnpm dev