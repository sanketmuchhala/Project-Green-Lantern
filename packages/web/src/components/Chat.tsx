import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Plus, Globe, Brain } from 'lucide-react';
import { Message } from './Message';
import { ChatHeader } from './layout/ChatHeader';
import { Button } from './ui';
import useChat from '../state/chatStore';
import { PROVIDER_NAMES, getDefaultModelForProvider } from '../constants/models';
import type { Provider } from '../lib/db';
import { startTurn } from '../promptops/instrument';
import { useStickyAutoScroll } from '../hooks/useStickyAutoScroll';
import ThinkingHUD from './ThinkingHUD';

interface ChatProps {
  onOpenSettings: () => void;
}

export const Chat: React.FC<ChatProps> = ({ onOpenSettings }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  
  // ThinkingHUD state
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(null);
  const [thinkingPhase, setThinkingPhase] = useState<"Planning" | "Drafting" | "Refining">("Planning");
  const [tokensReceived, setTokensReceived] = useState(0);
  const [reasoningSummary, setReasonningSummary] = useState<string | undefined>();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const { 
    activeConversation,
    addMessage,
    newConversation,
    getApiKey,
    getCurrentProvider,
    updateConversationSettings,
    settings
  } = useChat();

  // Initialize sticky auto-scroll hook
  const { scrollToBottomIfStuck, markMessageAnchor } = useStickyAutoScroll(messagesContainerRef);

  // Auto-scroll when messages change (non-jittery)
  useEffect(() => {
    scrollToBottomIfStuck();
  }, [activeConversation()?.messages, scrollToBottomIfStuck]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);


  const conversation = activeConversation();
  const conversationProvider = conversation?.provider || getCurrentProvider();
  const currentApiKey = getApiKey(conversationProvider);
  const hasValidKey = conversationProvider === 'local-ollama' || (currentApiKey && currentApiKey.length > 10);

  // Get available providers (those with valid API keys or local-ollama)
  const availableProviders = Object.keys(PROVIDER_NAMES).filter(provider => {
    if (provider === 'local-ollama') return true; // Local Ollama doesn't need API key
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

  // Helper function to validate local model exists
  const ensureLocalModelExists = async (baseURL: string, model: string) => {
    try {
      const response = await fetch(`${baseURL.replace(/\/+$/, '')}/api/tags`);
      const data = await response.json();
      const models = data.models || [];
      return models.some((m: any) => m.model === model || m.name === model);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !hasValidKey || !conversation) return;

    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);
    
    // Initialize ThinkingHUD
    setThinkingStartTime(Date.now());
    setThinkingPhase("Planning");
    setTokensReceived(0);
    setReasonningSummary(undefined);

    // Start turn instrumentation
    const turn = startTurn({
      corr_id: crypto.randomUUID(),
      session_id: conversation.id,
      provider: conversationProvider,
      model: conversation.model,
      settings: {
        temperature: conversation.settings.temperature,
        max_tokens: conversation.settings.max_tokens,
        web_search: webSearchEnabled,
        reasoning: reasoningEnabled
      },
      business: { task: 'chat' }
    });

    try {
      // Validate local model exists before sending
      if (conversationProvider === 'local-ollama') {
        const baseURL = settings?.baseURL || 'http://localhost:11434';
        const model = conversation.model;
        const modelExists = await ensureLocalModelExists(baseURL, model);
        if (!modelExists) {
          throw new Error(`Model not installed: ${model}. Install with: ollama pull ${model}`);
        }
      }

      // Add user message
      await addMessage('user', currentInput);

      // Prepare messages with performance trimming for local-ollama
      let messagesToSend = conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt
      }));

      // Add current user message
      messagesToSend.push({ role: 'user', content: currentInput, timestamp: Date.now() });

      // Apply performance trimming for local-ollama when performance mode is enabled
      if (conversationProvider === 'local-ollama' && settings?.performanceMode !== false) {
        // Keep only the last 6 turns (12 messages: 6 user + 6 assistant)
        const maxMessages = 12;
        if (messagesToSend.length > maxMessages) {
          // Create a conversation summary from the older messages
          const olderMessages = messagesToSend.slice(0, -maxMessages);
          const recentMessages = messagesToSend.slice(-maxMessages);
          
          // Simple summarization of older context
          const userMessages = olderMessages.filter(m => m.role === 'user');
          const assistantMessages = olderMessages.filter(m => m.role === 'assistant');
          
          const summaryContent = `Previous conversation context (${olderMessages.length} messages):
Topics discussed: ${userMessages.slice(0, 3).map(m => m.content.substring(0, 60) + '...').join('; ')}
Key responses provided: ${assistantMessages.slice(0, 2).map(m => m.content.substring(0, 80) + '...').join('; ')}`;

          // Keep system messages and add summary, then recent messages
          const systemMessages = messagesToSend.filter(m => m.role === 'system');
          messagesToSend = [
            ...systemMessages,
            { role: 'system', content: summaryContent, timestamp: Date.now() },
            ...recentMessages
          ];
        }
      }

      // Send to API
      const response = await fetch('/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSend,
          provider: conversationProvider,
          model: conversation.model,
          api_key: currentApiKey,
          temperature: conversation.settings.temperature,
          max_tokens: conversation.settings.max_tokens,
          web_search: webSearchEnabled,
          show_reasoning: reasoningEnabled,
          // Local Ollama specific fields
          ...(conversationProvider === 'local-ollama' && settings && {
            baseURL: settings.baseURL || 'http://localhost:11434',
            num_ctx: settings.num_ctx || 4096,
            performanceMode: settings.performanceMode,
            top_p: settings.topP,
            top_k: settings.topK,
            num_thread: settings.numThread
          })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Mark first token received (for TTFT)
      turn.markFirstToken();
      setThinkingPhase("Drafting");
      
      // Estimate tokens received for progress tracking
      const contentLength = data.message?.content?.length || 0;
      const estimatedTokens = Math.max(1, Math.floor(contentLength / 4)); // Rough chars to tokens
      setTokensReceived(estimatedTokens);
      setThinkingPhase("Refining");
      
      // Check for reasoning summary
      if (data.reasoning) {
        setReasonningSummary(data.reasoning.substring(0, 100) + (data.reasoning.length > 100 ? '...' : ''));
      }
      
      // Add assistant message with web search metadata and reasoning
      await addMessage('assistant', data.message.content, {
        webSearchResults: data.webSearchResults,
        reasoning: data.reasoning
      });

      // Complete turn logging
      await turn.endOk({
        usage: data.usage,
        safety: data.safety,
        quality: data.quality,
        prompt: {
          prompt_chars: currentInput.length
        }
      });
      
    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorContent = `Error: ${error.message}`;
      
      // Provide more helpful error messages
      if (conversationProvider === 'local-ollama') {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch') || error.message.includes('Connection failed')) {
          errorContent = `**Ollama Not Running**: Cannot connect to Ollama at ${settings?.baseURL || 'http://localhost:11434'}. Start Ollama with: \`ollama serve\``;
        } else if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
          errorContent = `**Connection Timeout**: Connection to Ollama at ${settings?.baseURL || 'http://localhost:11434'} timed out. Check if Ollama is running.`;
        } else if (error.message.includes('404')) {
          errorContent = `**Model Not Found**: The model "${conversation?.model}" is not available. Pull it with: \`ollama pull ${conversation?.model}\``;
        } else if (error.message.includes('HTTP 400') || error.message.includes('HTTP 500')) {
          errorContent = `**Ollama Error**: ${error.message.slice(0, 200)}. Try restarting Ollama or check the model.`;
        } else {
          errorContent = `**Ollama Error**: ${error.message}. Make sure Ollama is running and the model is available.`;
        }
      } else if (error.message.includes('401') || error.message.includes('Authentication failed')) {
        errorContent = `**Invalid API Key**: Your API key appears to be incorrect or expired for ${conversationProvider}. Please check your settings.`;
      } else if (error.message.includes('429') || error.message.includes('Rate limited')) {
        errorContent = `**Rate Limited**: The ${conversationProvider} API is rate limiting your requests. Please wait a moment and try again.`;
      } else if (error.message.includes('Network error') || error.message.includes('fetch')) {
        errorContent = `**Network Error**: Unable to connect to the server. Please check your connection.`;
      } else {
        errorContent += ` Please check your API key and settings.`;
      }
      
      await addMessage('assistant', errorContent);

      // Log error turn
      await turn.endError(error, {
        prompt: {
          prompt_chars: currentInput.length
        }
      });

    } finally {
      setIsLoading(false);
      setThinkingStartTime(null);
      setTokensReceived(0);
      setReasonningSummary(undefined);
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
            <div className="heading-lg text-neutral-300 mb-6">Lantern</div>
            <h2 className="heading-md text-neutral-100">Welcome to Lantern</h2>
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
            <div ref={messagesContainerRef}>
              {conversation.messages.map((message, index) => {
                const isLast = index === conversation.messages.length - 1;
                return (
                  <div 
                    key={message.id}
                    ref={isLast ? markMessageAnchor : undefined}
                    data-last-message={isLast ? "true" : undefined}
                  >
                    <Message message={{
                      role: message.role,
                      content: message.content,
                      timestamp: message.createdAt,
                      id: message.id,
                      metadata: message.metadata
                    }} />
                  </div>
                );
              })}
              
              {isLoading && thinkingStartTime && (
                <div className="px-6">
                  <ThinkingHUD
                    running={isLoading}
                    elapsedMs={Date.now() - thinkingStartTime}
                    tokensPerSec={tokensReceived > 0 ? tokensReceived / Math.max(1, (Date.now() - thinkingStartTime) / 1000) : undefined}
                    phase={thinkingPhase}
                    summary={reasoningSummary}
                  />
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