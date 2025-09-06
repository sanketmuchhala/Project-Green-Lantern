import React, { useState } from 'react';
import { User, Bot, ExternalLink, ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { Badge, CodeBlock } from './ui';
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
    <div className={`flex gap-4 p-6 ${isUser ? 'bg-neutral-900/30' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-neutral-800 text-neutral-300'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      
      <div className="flex-1 min-w-0 max-w-3xl">
        {/* Role badge */}
        <div className="mb-3">
          <Badge variant={isUser ? 'primary' : 'default'} size="sm">
            {isUser ? 'You' : 'Assistant'}
          </Badge>
        </div>
        
        {/* Message content */}
        <div className="body text-neutral-100 leading-relaxed">
          {formatContent(sanitizeDisplayText(message.content))}
        </div>
        
        {/* Web Search Results */}
        {hasWebSearchResults && (
          <div className="mt-6 panel">
            <button
              onClick={() => setShowSources(!showSources)}
              className="w-full flex items-center justify-between p-4 body-sm text-neutral-300 hover:bg-neutral-800 transition-colors rounded-t-2xl"
            >
              <span className="flex items-center gap-2">
                <ExternalLink size={16} />
                Sources ({message.metadata?.webSearchResults?.length || 0})
              </span>
              {showSources ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {showSources && (
              <div className="border-t border-neutral-700 p-4 space-y-4">
                {message.metadata?.webSearchResults?.map((result, index) => (
                  <div key={index} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="body-sm font-medium text-neutral-100 mb-2">
                          {result.title}
                        </h4>
                        <p className="muted mb-3 leading-relaxed">
                          {result.snippet}
                        </p>
                        <div className="flex items-center gap-2 muted">
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
                        className="flex-shrink-0 p-2 text-neutral-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-neutral-700"
                        title="Open in new tab"
                        aria-label="Open source in new tab"
                      >
                        <ExternalLink size={16} />
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
          <div className="mt-6 panel">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="w-full flex items-center justify-between p-4 body-sm text-neutral-300 hover:bg-neutral-800 transition-colors rounded-t-2xl"
            >
              <span className="flex items-center gap-2">
                <Brain size={16} />
                Thought Process
              </span>
              {showReasoning ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {showReasoning && (
              <div className="border-t border-neutral-700 p-4">
                <div className="card p-4">
                  <div className="body-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {message.metadata?.reasoning}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Timestamp */}
        <div className="muted mt-4">
          {new Date(message.timestamp).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
};

const formatContent = (content: string): React.ReactNode => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    
    // Code block detection
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3);
      const codeLines: string[] = [];
      i++; // Skip the opening ```
      
      // Collect code lines until closing ```
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      
      if (codeLines.length > 0) {
        elements.push(
          <CodeBlock 
            key={`code-${i}`}
            code={codeLines.join('\n')} 
            language={language || undefined}
            className="my-4"
          />
        );
      }
      i++; // Skip the closing ```
      continue;
    }
    
    // Inline code detection
    if (line.includes('`') && !line.includes('```')) {
      const parts = line.split('`');
      const formatted = parts.map((part, idx) => 
        idx % 2 === 1 ? (
          <code key={idx} className="px-1.5 py-0.5 bg-neutral-800 text-neutral-100 rounded text-sm font-mono">
            {part}
          </code>
        ) : formatTextLine(part)
      );
      elements.push(<div key={i} className="my-1">{formatted}</div>);
      i++;
      continue;
    }
    
    // Regular line formatting
    elements.push(
      <div key={i} className="my-1">
        {formatTextLine(line)}
      </div>
    );
    i++;
  }

  return <div>{elements}</div>;
};

const formatTextLine = (line: string): React.ReactNode => {
  // Bold text
  if (line.includes('**')) {
    const parts = line.split('**');
    return parts.map((part, i) => 
      i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
    );
  }
  
  // Bullet points
  if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
    return <div className="ml-4 flex"><span className="mr-2">•</span><span>{line.trim().slice(2)}</span></div>;
  }
  
  // Headers
  if (line.trim().startsWith('# ')) {
    return <h1 className="heading-lg mt-6 mb-4">{line.trim().slice(2)}</h1>;
  }
  if (line.trim().startsWith('## ')) {
    return <h2 className="heading-md mt-4 mb-3">{line.trim().slice(3)}</h2>;
  }
  if (line.trim().startsWith('### ')) {
    return <h3 className="heading-sm mt-4 mb-2">{line.trim().slice(4)}</h3>;
  }
  
  return line || <br />;
};