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
    <div className={`flex gap-6 px-6 py-8 ${isUser ? 'bg-neutral-900/30' : ''}`}>
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
        <div className="prose prose-invert max-w-none text-neutral-100 leading-relaxed">
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
            className="my-6"
          />
        );
      }
      i++; // Skip the closing ```
      continue;
    }
    
    // Blockquote detection
    if (line.trim().startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <blockquote key={`quote-${i}`} className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-neutral-800/50 rounded-r-lg">
          <div className="text-neutral-200 italic">
            {quoteLines.map((quoteLine, idx) => (
              <div key={idx} className="my-1">{formatTextLine(quoteLine)}</div>
            ))}
          </div>
        </blockquote>
      );
      continue;
    }
    
    // Table detection (simple markdown tables)
    if (line.includes('|') && line.split('|').length >= 3) {
      const tableRows: string[][] = [];
      let currentRow = i;
      
      // Collect table rows
      while (currentRow < lines.length && lines[currentRow].includes('|')) {
        const cells = lines[currentRow].split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length > 0) {
          tableRows.push(cells);
        }
        currentRow++;
      }
      
      if (tableRows.length > 0) {
        elements.push(
          <div key={`table-${i}`} className="my-6 overflow-x-auto">
            <table className="min-w-full border border-neutral-700 rounded-lg overflow-hidden">
              <thead className="bg-neutral-800">
                <tr>
                  {tableRows[0].map((header, idx) => (
                    <th key={idx} className="px-4 py-3 text-left text-neutral-100 font-semibold border-b border-neutral-700">
                      {formatTextLine(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).filter(row => !row.every(cell => cell.match(/^-+$/)) && row.length > 0).map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-neutral-700 hover:bg-neutral-800/30">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3 text-neutral-200">
                        {formatTextLine(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        i = currentRow;
        continue;
      }
    }
    
    // Inline code detection
    if (line.includes('`') && !line.includes('```')) {
      const parts = line.split('`');
      const formatted = parts.map((part, idx) => 
        idx % 2 === 1 ? (
          <code key={idx} className="px-2 py-1 bg-neutral-800 text-blue-300 rounded text-sm font-mono border border-neutral-700">
            {part}
          </code>
        ) : formatTextLine(part)
      );
      elements.push(<div key={i} className="my-2 leading-relaxed">{formatted}</div>);
      i++;
      continue;
    }
    
    // Regular line formatting
    elements.push(
      <div key={i} className="my-2 leading-relaxed">
        {formatTextLine(line)}
      </div>
    );
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
};

const formatTextLine = (line: string): React.ReactNode => {
  if (!line.trim()) return <br />;
  
  // Headers
  if (line.trim().startsWith('# ')) {
    return <h1 className="text-3xl font-bold text-white mt-8 mb-4 border-b border-neutral-700 pb-2">{line.trim().slice(2)}</h1>;
  }
  if (line.trim().startsWith('## ')) {
    return <h2 className="text-2xl font-semibold text-white mt-6 mb-3">{line.trim().slice(3)}</h2>;
  }
  if (line.trim().startsWith('### ')) {
    return <h3 className="text-xl font-medium text-white mt-5 mb-2">{line.trim().slice(4)}</h3>;
  }
  if (line.trim().startsWith('#### ')) {
    return <h4 className="text-lg font-medium text-neutral-100 mt-4 mb-2">{line.trim().slice(5)}</h4>;
  }
  
  // Numbered lists
  const numberedMatch = line.match(/^(\s*)(\d+)\.\s(.+)/);
  if (numberedMatch) {
    const [, indent, number, content] = numberedMatch;
    const level = Math.floor(indent.length / 2);
    return (
      <div className={`flex items-start gap-3 my-1`} style={{ marginLeft: `${level * 1.5}rem` }}>
        <span className="flex-shrink-0 text-blue-400 font-medium min-w-[1.5rem]">{number}.</span>
        <span className="text-neutral-100">{formatInlineText(content)}</span>
      </div>
    );
  }
  
  // Bullet points
  if (line.trim().startsWith('- ') || line.trim().startsWith('• ') || line.trim().startsWith('* ')) {
    const indent = line.match(/^(\s*)/)?.[1] || '';
    const level = Math.floor(indent.length / 2);
    const content = line.trim().slice(2);
    return (
      <div className={`flex items-start gap-3 my-1`} style={{ marginLeft: `${level * 1.5}rem` }}>
        <span className="flex-shrink-0 text-blue-400 mt-1">•</span>
        <span className="text-neutral-100">{formatInlineText(content)}</span>
      </div>
    );
  }
  
  // Task lists
  if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]') || line.trim().startsWith('- [X]')) {
    const checked = line.includes('[x]') || line.includes('[X]');
    const content = line.replace(/^(\s*)-\s*\[[xX\s]\]\s*/, '');
    return (
      <div className="flex items-start gap-3 my-1">
        <input 
          type="checkbox" 
          checked={checked} 
          readOnly
          className="mt-1 rounded border-neutral-600 bg-neutral-800 text-blue-500 focus:ring-blue-500" 
        />
        <span className={`${checked ? 'line-through text-neutral-400' : 'text-neutral-100'}`}>
          {formatInlineText(content)}
        </span>
      </div>
    );
  }
  
  return <span className="text-neutral-100">{formatInlineText(line)}</span>;
};

const formatInlineText = (text: string): React.ReactNode => {
  // Handle multiple formatting types in order
  let result: React.ReactNode = text;
  
  // Bold text (**text**)
  if (text.includes('**')) {
    const parts = text.split('**');
    result = parts.map((part, i) => 
      i % 2 === 1 ? <strong key={`bold-${i}`} className="font-bold text-white">{part}</strong> : part
    );
  }
  
  // Italic text (*text*)
  if (typeof result === 'string' && result.includes('*')) {
    const parts = result.split('*');
    result = parts.map((part, i) => 
      i % 2 === 1 ? <em key={`italic-${i}`} className="italic text-neutral-200">{part}</em> : part
    );
  }
  
  // Links [text](url)
  if (typeof result === 'string') {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = result.split(linkRegex);
    if (parts.length > 1) {
      const linkElements: React.ReactNode[] = [];
      for (let i = 0; i < parts.length; i += 3) {
        if (parts[i]) linkElements.push(parts[i]);
        if (parts[i + 1] && parts[i + 2]) {
          linkElements.push(
            <a 
              key={`link-${i}`}
              href={parts[i + 2]} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50 hover:decoration-blue-300 transition-colors"
            >
              {parts[i + 1]}
            </a>
          );
        }
      }
      result = linkElements;
    }
  }
  
  return result;
};