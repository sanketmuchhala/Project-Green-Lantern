import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Plus, Globe, Brain } from 'lucide-react';
import { Message } from './Message';
import { ChatHeader } from './layout/ChatHeader';
import { Button } from './ui';
import useChat from '../state/chatStore';
import { PROVIDER_NAMES, getDefaultModelForProvider } from '../constants/models';
import type { Provider } from '../lib/db';
import { logTurn } from '../promptops/logger';
import { enrichWithLocalTelemetry } from '../promptops/local/telemetry';

interface ChatProps {
  onOpenSettings: () => void;
}

export const Chat: React.FC<ChatProps> = ({ onOpenSettings }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    activeConversation,
    addMessage,
    newConversation,
    getApiKey,
    getCurrentProvider,
    updateConversationSettings
  } = useChat();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation()?.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);


  const conversation = activeConversation();
  const conversationProvider = conversation?.provider || getCurrentProvider();
  const currentApiKey = getApiKey(conversationProvider);
  const hasValidKey = currentApiKey && currentApiKey.length > 10;

  // Get available providers (those with valid API keys)
  const availableProviders = Object.keys(PROVIDER_NAMES).filter(provider => {
    const key = getApiKey(provider as any);
    return key && key.length > 10;
  });

  // Get available models for current provider
  const handleModelChange = async (newModel: string) => {
    if (conversation && newModel !== conversation.model) {
      await updateConversationSettings(conversation.id, {
        model: newModel
      });
    }
  };

  const handleProviderChange = async (newProvider: Provider) => {
    if (conversation && newProvider !== conversation.provider) {
      const defaultModel = getDefaultModelForProvider(newProvider);
      await updateConversationSettings(conversation.id, {
        provider: newProvider,
        model: defaultModel
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !hasValidKey || !conversation) return;

    const currentInput = input.trim();
    const startTime = Date.now(); // For latency calculation
    setInput('');
    setIsLoading(true);

    try {
      // Add user message
      await addMessage('user', currentInput);

      // Send to API
      const response = await fetch('/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            // Send entire conversation history for full context awareness
            ...conversation.messages.map(msg => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.createdAt
            })),
            { role: 'user', content: currentInput, timestamp: Date.now() }
          ],
          provider: conversationProvider,
          model: conversation.model,
          api_key: currentApiKey,
          temperature: conversation.settings.temperature,
          max_tokens: conversation.settings.max_tokens,
          web_search: webSearchEnabled,
          show_reasoning: reasoningEnabled
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const latency_ms = Date.now() - startTime;
      
      // Add assistant message with web search metadata and reasoning
      await addMessage('assistant', data.message.content, {
        webSearchResults: data.webSearchResults,
        reasoning: data.reasoning
      });

      // PromptScope logging
      const eventBase = {
        corr_id: data.id || crypto.randomUUID(),
        session_id: conversation.id, // Assuming conversation.id can be session_id
        provider: conversationProvider,
        model: conversation.model,
        settings: {
          temperature: conversation.settings.temperature,
          max_tokens: conversation.settings.max_tokens,
        },
        prompt: {
          prompt_chars: currentInput.length, // Character count of the user's prompt
          // Assuming system_tokens, user_tokens, retrieved_tokens are not directly available from API response
        },
        usage: data.usage, // Assuming usage stats are in the response
        timing: {
          ...data.timing, // Assuming timing stats are in the response
          latency_ms,
        },
        result: { status: "ok", http: response.status },
        safety: {
          guard_triggered: data.safety?.guard_triggered,
          pii_blocked: data.safety?.pii_blocked,
        },
        quality: {
          user_rating: data.quality?.user_rating,
          judge_score: data.quality?.judge_score,
        },
        business: {
          // task: conversation.settings.task, // Assuming task can be derived from conversation settings
        },
        runtime: data.runtime, // Assuming runtime metrics are in the response
        sampling: data.sampling, // Assuming sampling metrics are in the response
        token_timestamps_ms: data.token_timestamps_ms, // Assuming token timestamps are in the response
        kv_cache: data.kv_cache, // Assuming kv_cache metrics are in the response
        hardware: data.hardware, // Assuming hardware metrics are in the response
        energy: data.energy, // Assuming energy metrics are in the response
      };
      enrichWithLocalTelemetry(eventBase).then(logTurn);
      
    } catch (error: any) {
      console.error('Chat error:', error);
      const latency_ms = Date.now() - startTime;
      
      let errorContent = `Error: ${error.message}`;
      
      // Provide more helpful error messages
      if (error.message.includes('401') || error.message.includes('Authentication failed')) {
        errorContent = `**Invalid API Key**: Your API key appears to be incorrect or expired for ${conversationProvider}. Please check your settings.`;
      } else if (error.message.includes('429') || error.message.includes('Rate limited')) {
        errorContent = `**Rate Limited**: The ${conversationProvider} API is rate limiting your requests. Please wait a moment and try again.`;
      } else if (error.message.includes('Network error') || error.message.includes('fetch')) {
        errorContent = `**Network Error**: Unable to connect to the server. Please check your connection.`;
      } else {
        errorContent += ` Please check your API key and settings.`;
      }
      
      await addMessage('assistant', errorContent);

      // PromptScope logging for errors
      const eventBase = {
        corr_id: crypto.randomUUID(),
        session_id: conversation.id,
        provider: conversationProvider,
        model: conversation.model,
        settings: {
          temperature: conversation.settings.temperature,
          max_tokens: conversation.settings.max_tokens,
        },
        timing: { latency_ms },
        result: { status: "error", http: error.response?.status },
        // Include any other relevant error details from the API response if available
        // e.g., safety: error.safety, quality: error.quality, etc.
      };
      enrichWithLocalTelemetry(eventBase).then(logTurn);

    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Empty state when no conversation is selected
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col bg-neutral-950">
        <ChatHeader
          conversation={null}
          onOpenSettings={onOpenSettings}
        />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md px-6">
            <div className="heading-lg text-neutral-300 mb-6">BYOK Copilot</div>
            <h2 className="heading-md text-neutral-100">Welcome to BYOK</h2>
            <p className="body text-neutral-400">
              Your local-only AI assistant. Bring your own API keys and chat with confidence.
            </p>
            
            <div className="space-y-4 pt-4">
              <Button
                onClick={() => newConversation()}
                variant="primary"
                size="lg"
                className="w-full"
              >
                <Plus size={18} />
                Start New Chat
              </Button>
              
              <Button
                onClick={onOpenSettings}
                variant="secondary"
                size="lg"
                className="w-full"
              >
                Configure API Keys
              </Button>
            </div>
            
            {!hasValidKey && (
              <div className="mt-6 panel bg-amber-900/20 border-amber-700">
                <div className="p-4">
                  <p className="body-sm text-amber-200">
                    <strong>Notice:</strong> No API key configured. Configure your API keys to start chatting.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-neutral-950">
      <ChatHeader
        conversation={conversation}
        onOpenSettings={onOpenSettings}
        onProviderChange={handleProviderChange}
        onModelChange={handleModelChange}
        availableProviders={availableProviders}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-4xl mx-auto">
          {conversation.messages.length === 0 ? (
            <div className="text-center py-18 px-6">
              <div className="heading-lg text-neutral-400 mb-4">Ready to Chat</div>
              <h3 className="heading-sm text-neutral-200 mb-3">Start your conversation</h3>
              <p className="body text-neutral-400">
                Ask me anything. I'll use {conversationProvider} to help you.
              </p>
            </div>
          ) : (
            <div>
              {conversation.messages.map((message) => (
                <Message key={message.id} message={{
                  role: message.role,
                  content: message.content,
                  timestamp: message.createdAt,
                  id: message.id,
                  metadata: message.metadata
                }} />
              ))}
              
              {isLoading && (
                <div className="flex items-center gap-3 px-6 py-4 text-neutral-400">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="body-sm">Thinking...</span>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-neutral-700 p-6">
        <div className="max-w-4xl mx-auto">
          {!hasValidKey ? (
            <div className="panel bg-amber-900/20 border-amber-700 text-center">
              <div className="p-6">
                <p className="body-sm text-amber-200 mb-4">
                  <strong>Notice:</strong> No API key configured for {conversationProvider}
                </p>
                <Button
                  onClick={onOpenSettings}
                  variant="primary"
                  size="md"
                >
                  Configure API Keys
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Advanced Features Toggles */}
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  type="button"
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  variant={webSearchEnabled ? 'primary' : 'secondary'}
                  size="sm"
                >
                  <Globe size={16} />
                  Web Search
                </Button>
                
                <Button
                  type="button"
                  onClick={() => setReasoningEnabled(!reasoningEnabled)}
                  variant={reasoningEnabled ? 'primary' : 'secondary'}
                  size="sm"
                  className={reasoningEnabled ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  <Brain size={16} />
                  Show Reasoning
                </Button>
                
                {(webSearchEnabled || reasoningEnabled) && (
                  <span className="muted">
                    {webSearchEnabled && reasoningEnabled 
                      ? 'Web search + reasoning enabled' 
                      : webSearchEnabled 
                        ? 'Will search the web for current information'
                        : 'Will show AI thought process'
                    }
                  </span>
                )}
              </div>
              
              {/* Message Input */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${conversationProvider}${webSearchEnabled || reasoningEnabled ? ' (' : ''}${webSearchEnabled ? 'web search' : ''}${webSearchEnabled && reasoningEnabled ? ' + ' : ''}${reasoningEnabled ? 'reasoning' : ''}${webSearchEnabled || reasoningEnabled ? ')' : ''}...`}
                    className="w-full p-4 pr-14 bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-2xl resize-none focus-ring text-lg placeholder-neutral-400"
                    rows={1}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
          
          <div className="mt-3 muted text-center">
            Press Enter to send, Shift+Enter for new line • Cmd+N for new chat • Cmd+K for settings
          </div>
        </div>
      </div>

      {/* Optimized Prompt Panel - if needed */}
      {/* <OptimizedPrompt /> */}
    </div>
  );
};