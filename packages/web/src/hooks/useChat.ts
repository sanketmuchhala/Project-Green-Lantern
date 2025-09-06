import { useState, useCallback } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  id: string;
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export interface OptimizedPrompt {
  task: string;
  context: string;
  mustInclude: string[];
  constraints: string[];
  inputs: string[];
  qualityBar: string;
}

export interface ResearchPlan {
  steps: string[];
  rationale: string;
}

export interface Citation {
  title: string;
  url: string;
  snippet: string;
}

export const useChat = () => {
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = useState<OptimizedPrompt | null>(null);
  const [researchPlan, setResearchPlan] = useState<ResearchPlan | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const startNewChat = useCallback(() => {
    console.log('startNewChat called - clearing messages and state');
    setCurrentMessages([]);
    setOptimizedPrompt(null);
    setResearchPlan(null);
    setCitations([]);
    setActiveChat(null);
  }, []);

  const loadChat = useCallback((chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setCurrentMessages(chat.messages);
      setActiveChat(chatId);
      setOptimizedPrompt(null);
      setResearchPlan(null);
      setCitations([]);
    }
  }, [chatHistory]);

  const saveCurrentChat = useCallback(() => {
    if (currentMessages.length === 0) return;

    const chatId = activeChat || generateId();
    const title = currentMessages.find(m => m.role === 'user')?.content.slice(0, 50) + '...' || 'New Chat';
    
    const chatData: ChatHistory = {
      id: chatId,
      title,
      messages: currentMessages,
      timestamp: Date.now()
    };

    setChatHistory(prev => {
      const existing = prev.findIndex(c => c.id === chatId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = chatData;
        return updated;
      } else {
        return [chatData, ...prev];
      }
    });

    setActiveChat(chatId);
  }, [currentMessages, activeChat]);

  const sendMessage = useCallback(async (
    content: string, 
    provider: string, 
    model: string, 
    apiKey: string,
    settings: any,
    systemPrompt?: string
  ) => {
    if (isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: Date.now(),
      id: generateId()
    };

    setCurrentMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const messages = [...currentMessages, userMessage];
      
      if (systemPrompt) {
        messages.unshift({
          role: 'system',
          content: systemPrompt,
          timestamp: Date.now(),
          id: generateId()
        });
      }

      const response = await fetch('/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          provider,
          model,
          api_key: apiKey,
          temperature: settings.temperature,
          max_tokens: settings.max_tokens
        })
      });

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.error) {
                errorMessage = errorData.error;
              } else if (errorData.details) {
                errorMessage = errorData.details;
              }
            } catch {
              // If JSON parsing fails, use the raw text
              errorMessage = errorText;
            }
          }
        } catch {
          // If reading response body fails, use the original error
        }
        
        throw new Error(errorMessage);
      }

      // Handle successful response with robust JSON parsing
      let data;
      try {
        const responseText = await response.text();
        
        if (!responseText || responseText.trim() === '') {
          throw new Error('Empty response from server');
        }
        
        data = JSON.parse(responseText);
        
        if (!data.message || !data.message.content) {
          throw new Error('Invalid response format: missing message content');
        }
        
      } catch (jsonError: any) {
        console.error('JSON parsing error:', jsonError);
        throw new Error(`Server response parsing failed: ${jsonError.message}`);
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message.content,
        timestamp: Date.now(),
        id: generateId()
      };

      setCurrentMessages(prev => [...prev, assistantMessage]);
      
      // Parse special blocks from response
      parseResponseBlocks(data.message.content);

    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorContent = `Error: ${error.message}`;
      
      // Provide more helpful error messages
      if (error.message.includes('401') || error.message.includes('invalid_api_key')) {
        errorContent = `**Invalid API Key**: Your API key appears to be incorrect or expired. Please check your settings and ensure you're using the right key for your model.`;
      } else if (error.message.includes('provider') && error.message.includes('auto')) {
        errorContent = `**Provider Detection Issue**: Could not detect the correct API provider for your model "${model}". Please check your model name in settings.`;
      } else {
        errorContent += ` Please check your API key and connection.`;
      }
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: errorContent,
        timestamp: Date.now(),
        id: generateId()
      };
      
      setCurrentMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentMessages, isLoading]);

  const parseResponseBlocks = (content: string) => {
    // Parse **Plan** blocks
    const planMatch = content.match(/\*\*Plan\*\*\n(.*?)(?=\n\*\*|$)/s);
    if (planMatch) {
      const steps = planMatch[1].split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•]\s*/, ''));
      setResearchPlan({
        steps,
        rationale: 'Research approach for your query'
      });
    }

    // Parse **Citations** blocks (stub data for now)
    if (content.includes('**Citations**')) {
      setCitations([
        { title: 'Example Source 1', url: 'https://example.com/1', snippet: 'Relevant information snippet...' },
        { title: 'Example Source 2', url: 'https://example.com/2', snippet: 'Another relevant snippet...' }
      ]);
    }

    // Parse **Optimized Prompt** blocks
    const promptMatch = content.match(/\*\*Optimized Prompt\*\*\n(.*?)(?=\n\*\*|$)/s);
    if (promptMatch) {
      setOptimizedPrompt({
        task: 'Refined task description',
        context: 'Relevant context and background',
        mustInclude: ['Key requirement 1', 'Key requirement 2'],
        constraints: ['Constraint 1', 'Constraint 2'],
        inputs: ['Input 1', 'Input 2'],
        qualityBar: 'Expected output quality and format'
      });
    }
  };

  const deleteChat = useCallback((chatId: string) => {
    setChatHistory(prev => prev.filter(c => c.id !== chatId));
    if (activeChat === chatId) {
      startNewChat();
    }
  }, [activeChat, startNewChat]);

  return {
    currentMessages,
    chatHistory,
    isLoading,
    optimizedPrompt,
    researchPlan,
    citations,
    activeChat,
    sendMessage,
    startNewChat,
    loadChat,
    saveCurrentChat,
    deleteChat,
    setOptimizedPrompt,
    setResearchPlan,
    setCitations
  };
};