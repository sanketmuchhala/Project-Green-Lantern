import React, { useState } from 'react';
import { User, Bot, ExternalLink, ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { ChatMessage } from '../hooks/useChat';
import { sanitizeDisplayText } from '../lib/stripEmojis';
import { WebSearchResult } from '../lib/db';

interface MessageProps {
  message: ChatMessage & {
    metadata?: {
      webSearchResults?: WebSearchResult[];
      reasoning?: string;
    };
  };
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const [showSources, setShowSources] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  
  if (isSystem) return null; // Don't render system messages in UI
  
  const hasWebSearchResults = message.metadata?.webSearchResults && message.metadata.webSearchResults.length > 0;
  const hasReasoning = message.metadata?.reasoning && message.metadata.reasoning.length > 0;

  return (
    <div className={`flex gap-3 p-4`} style={{
      backgroundColor: isUser ? 'hsl(var(--muted) / 0.3)' : 'hsl(var(--background))'
    }}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center`} style={{
        backgroundColor: isUser ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
        color: isUser ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))'
      }}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {isUser ? 'You' : 'Assistant'}
        </div>
        
        <div className="prose prose-sm max-w-none" style={{ color: 'hsl(var(--foreground))' }}>
          {sanitizeDisplayText(message.content).split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {formatLine(line)}
              {i < message.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        
        {/* Web Search Results */}
        {hasWebSearchResults && (
          <div className="mt-3 border border-neutral-700 rounded-lg bg-neutral-800">
            <button
              onClick={() => setShowSources(!showSources)}
              className="w-full flex items-center justify-between p-3 text-sm text-neutral-300 hover:bg-neutral-750 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink size={16} />
                Sources ({message.metadata?.webSearchResults?.length || 0})
              </span>
              {showSources ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {showSources && (
              <div className="border-t border-neutral-700 p-3 space-y-3">
                {message.metadata?.webSearchResults?.map((result, index) => (
                  <div key={index} className="p-3 bg-neutral-750 rounded border border-neutral-600">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-white text-sm mb-1">
                          {result.title}
                        </h4>
                        <p className="text-neutral-300 text-xs mb-2 leading-relaxed">
                          {result.snippet}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                          <span>{result.source}</span>
                          {result.publishDate && (
                            <>
                              <span>•</span>
                              <span>{result.publishDate}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-1 text-neutral-400 hover:text-blue-400 transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Reasoning */}
        {hasReasoning && !isUser && (
          <div className="mt-3 border border-neutral-700 rounded-lg bg-neutral-800">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="w-full flex items-center justify-between p-3 text-sm text-neutral-300 hover:bg-neutral-750 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Brain size={16} />
                Thought Process
              </span>
              {showReasoning ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {showReasoning && (
              <div className="border-t border-neutral-700 p-3">
                <div className="p-3 bg-neutral-750 rounded border border-neutral-600">
                  <div className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {message.metadata?.reasoning}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

const formatLine = (line: string): React.ReactNode => {
  // Bold text
  if (line.includes('**')) {
    const parts = line.split('**');
    return parts.map((part, i) => 
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  }
  
  // Bullet points
  if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
    return <span className="block ml-4">{line}</span>;
  }
  
  // Code blocks (simple detection)
  if (line.trim().startsWith('```')) {
    return <code className="block p-2 rounded text-sm font-mono" style={{
      backgroundColor: 'hsl(var(--muted))'
    }}>{line}</code>;
  }
  
  return line;
};