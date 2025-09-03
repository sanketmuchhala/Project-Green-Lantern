import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ExternalLink } from 'lucide-react';
import { Message } from './Message';
import { OptimizedPrompt } from './OptimizedPrompt';
import { ThemeToggle } from './ThemeToggle';
import { useChat } from '../hooks/useChat';
import { useLocalKeys } from '../hooks/useLocalKeys';
import { getSystemPrompt, PROVIDER_NAMES } from '../copilotSpec';

interface ChatProps {
  onOpenSettings: () => void;
}

export const Chat: React.FC<ChatProps> = ({ onOpenSettings }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    currentMessages, 
    isLoading, 
    optimizedPrompt, 
    researchPlan,
    citations,
    sendMessage,
    saveCurrentChat,
    setOptimizedPrompt
  } = useChat();
  
  const { apiKeys, settings, getApiKey, hasValidKey } = useLocalKeys();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input.trim();
    setInput('');

    const apiKey = getApiKey();
    if (!apiKey) {
      alert('Please configure your API key in Settings first.');
      return;
    }

    const systemPrompt = getSystemPrompt(settings);
    
    await sendMessage(
      currentInput, 
      'auto', // Provider will be auto-detected from model name
      apiKeys.modelName || 'gpt-4o-mini', 
      apiKey,
      settings,
      systemPrompt
    );
    
    // Auto-save chat after sending message
    setTimeout(saveCurrentChat, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleUseOptimizedPrompt = (promptContent: string) => {
    setInput(promptContent);
    setOptimizedPrompt(null);
    textareaRef.current?.focus();
  };

  const needsApiKey = !hasValidKey();

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="border-b p-4" style={{ 
        backgroundColor: 'hsl(var(--background))', 
        borderColor: 'hsl(var(--border))'
      }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>BYOK Research Copilot</h1>
            <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {apiKeys.modelName || 'No model configured'} • {settings.mode} mode
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {needsApiKey && (
              <button
                onClick={onOpenSettings}
                className="px-3 py-1 text-sm rounded border transition-colors"
                style={{ 
                  backgroundColor: 'rgb(251 146 60)',
                  borderColor: 'rgb(251 146 60)',
                  color: 'white'
                }}
              >
                Configure API Key
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'hsl(var(--background))' }}>
        {currentMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div className="max-w-md space-y-4">
              <h2 className="text-2xl font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>Welcome to BYOK Copilot</h2>
              <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                Your secure, local-only AI research assistant. Configure your API keys and start chatting.
              </p>
              <div className="space-y-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <div>Current mode: <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{settings.mode}</span></div>
                <div>Web search: <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{settings.web_enabled ? 'Enabled' : 'Disabled'}</span></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {currentMessages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            
            {isLoading && (
              <div className="flex gap-3 p-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Assistant</div>
                  <div className="text-muted-foreground">Thinking...</div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Side Panels */}
      <div className="border-t bg-muted/30">
        {/* Research Plan */}
        {researchPlan && (
          <div className="p-4 border-b">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-blue-800">Research Plan</span>
              </div>
              <div className="space-y-2">
                {researchPlan.steps.map((step, i) => (
                  <div key={i} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="font-mono text-xs bg-blue-200 px-1 rounded mt-0.5">{i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Citations */}
        {citations.length > 0 && (
          <div className="p-4 border-b">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <ExternalLink size={16} className="text-green-600" />
                <span className="font-medium text-green-800">Citations</span>
                <span className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded">Stubbed</span>
              </div>
              <div className="space-y-3">
                {citations.map((citation, i) => (
                  <div key={i} className="space-y-1">
                    <div className="font-medium text-sm text-green-800">{citation.title}</div>
                    <div className="text-xs text-green-600 font-mono">{citation.url}</div>
                    <div className="text-sm text-green-700">{citation.snippet}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Optimized Prompt */}
        {optimizedPrompt && (
          <div className="p-4 border-b">
            <OptimizedPrompt 
              prompt={optimizedPrompt} 
              onUsePrompt={handleUseOptimizedPrompt}
            />
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="border-t p-4" style={{ 
        backgroundColor: 'hsl(var(--background))', 
        borderColor: 'hsl(var(--border))' 
      }}>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={needsApiKey ? 'Configure API key first...' : 'Type your message... (Shift+Enter for new line)'}
              disabled={isLoading || needsApiKey}
              className="w-full p-3 pr-12 border rounded-lg resize-none focus:outline-none focus:ring-2 disabled:opacity-50"
              style={{ 
                backgroundColor: 'hsl(var(--input))', 
                color: 'hsl(var(--foreground))',
                borderColor: 'hsl(var(--border))',
                '--tw-ring-color': 'hsl(var(--ring))'
              }}
              rows={1}
            />
            <div className="absolute bottom-2 right-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {input.length > 0 && `${input.length} chars`}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!input.trim() || isLoading || needsApiKey}
            className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            style={{ 
              backgroundColor: 'hsl(var(--primary))', 
              color: 'hsl(var(--primary-foreground))'
            }}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};