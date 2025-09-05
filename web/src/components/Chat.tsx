import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Settings, Plus, ChevronDown } from 'lucide-react';
import { Message } from './Message';
import useChat from '../state/chatStore';
import { sanitizeDisplayText } from '../lib/stripEmojis';
import { PROVIDER_NAMES, getModelsForProvider } from '../constants/models';

interface ChatProps {
  onOpenSettings: () => void;
}

export const Chat: React.FC<ChatProps> = ({ onOpenSettings }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    activeConversation,
    addMessage,
    newConversation,
    getApiKey,
    getCurrentProvider,
    updateConversationSettings,
    settings
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    if (showModelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelDropdown]);

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
  const availableModels = conversation ? getModelsForProvider(conversation.provider) : [];

  const handleModelChange = async (newModel: string) => {
    if (conversation && newModel !== conversation.model) {
      await updateConversationSettings(conversation.id, {
        model: newModel
      });
    }
    setShowModelDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !hasValidKey || !conversation) return;

    const currentInput = input.trim();
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
            ...conversation.messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: currentInput }
          ],
          provider: conversationProvider,
          model: conversation.model,
          api_key: currentApiKey,
          temperature: conversation.settings.temperature,
          max_tokens: conversation.settings.max_tokens
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Add assistant message
      await addMessage('assistant', data.message.content);
      
    } catch (error: any) {
      console.error('Chat error:', error);
      
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
      <div className="flex-1 flex items-center justify-center bg-neutral-950">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-4xl mb-4 font-semibold text-neutral-300">BYOK</div>
          <h2 className="text-2xl font-semibold text-white">Welcome to BYOK Copilot</h2>
          <p className="text-neutral-400">
            Your local-only AI assistant. Bring your own API keys and chat with confidence.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => newConversation()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Start New Chat
            </button>
            
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-neutral-700 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <Settings size={18} />
              Open Settings
            </button>
          </div>
          
          {!hasValidKey && (
            <div className="mt-6 p-4 bg-amber-950 border border-amber-800 rounded-lg">
              <p className="text-amber-200 text-sm">
                <strong>Warning:</strong> No API key configured. Click "Open Settings" to add your API keys.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-white">{sanitizeDisplayText(conversation.title)}</h1>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <span>{PROVIDER_NAMES[conversation.provider as keyof typeof PROVIDER_NAMES]}</span>
              <span>•</span>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-1 hover:text-neutral-200 transition-colors"
                  disabled={availableModels.length <= 1}
                >
                  <span>{conversation.model}</span>
                  {availableModels.length > 1 && <ChevronDown size={14} />}
                </button>
                
                {showModelDropdown && availableModels.length > 1 && (
                  <div className="absolute top-full left-0 mt-1 bg-neutral-800 rounded-lg border border-neutral-700 shadow-xl z-50 min-w-48">
                    {availableModels.map((model) => (
                      <button
                        key={model}
                        onClick={() => handleModelChange(model)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          model === conversation.model ? 'text-blue-400 bg-neutral-700' : 'text-neutral-200'
                        }`}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"
              title="Settings (Cmd+K)"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {conversation.messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 font-semibold text-neutral-400">Ready</div>
              <h3 className="text-lg font-medium text-white mb-2">Start your conversation</h3>
              <p className="text-neutral-400">
                Ask me anything. I'll use {conversationProvider} to help you.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {conversation.messages.map((message) => (
                <Message key={message.id} message={{
                  role: message.role,
                  content: message.content,
                  timestamp: message.createdAt,
                  id: message.id
                }} />
              ))}
              
              {isLoading && (
                <div className="flex items-center gap-2 text-neutral-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-neutral-800 p-4">
        <div className="max-w-4xl mx-auto">
          {!hasValidKey ? (
            <div className="p-4 bg-amber-950 border border-amber-800 rounded-lg text-center">
              <p className="text-amber-200 mb-3">
                <strong>Warning:</strong> No API key configured for {conversationProvider}
              </p>
              <button
                onClick={onOpenSettings}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded transition-colors"
              >
                Configure API Keys
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${conversationProvider}...`}
                  className="w-full p-3 pr-12 bg-neutral-800 text-white border border-neutral-700 rounded-lg resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-white disabled:text-neutral-600 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </form>
          )}
          
          <div className="mt-2 text-xs text-neutral-500 text-center">
            Press Enter to send, Shift+Enter for new line • Cmd+N for new chat • Cmd+K for settings
          </div>
        </div>
      </div>

      {/* Optimized Prompt Panel - if needed */}
      {/* <OptimizedPrompt /> */}
    </div>
  );
};