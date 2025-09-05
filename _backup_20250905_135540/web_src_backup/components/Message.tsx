import React from 'react';
import { User, Bot } from 'lucide-react';
import { ChatMessage } from '../hooks/useChat';

interface MessageProps {
  message: ChatMessage;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  if (isSystem) return null; // Don't render system messages in UI

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
          {message.content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {formatLine(line)}
              {i < message.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        
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