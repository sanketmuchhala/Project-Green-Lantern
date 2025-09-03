import React from 'react';
import { MessageSquare, Plus, Trash2, Settings } from 'lucide-react';
import { ChatHistory } from '../hooks/useChat';

interface SidebarProps {
  chatHistory: ChatHistory[];
  activeChat: string | null;
  onNewChat: () => void;
  onLoadChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chatHistory,
  activeChat,
  onNewChat,
  onLoadChat,
  onDeleteChat,
  onOpenSettings
}) => {
  return (
    <div className="w-64 border-r flex flex-col h-screen" style={{ 
      backgroundColor: 'hsl(var(--muted) / 0.3)', 
      borderColor: 'hsl(var(--border))' 
    }}>
      <div className="p-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={20} style={{ color: 'hsl(var(--primary))' }} />
          <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>BYOK Copilot</span>
        </div>
        
        <button 
          onClick={() => {
            console.log('New Chat clicked!');
            onNewChat();
          }}
          className="w-full flex items-center justify-center gap-2 p-3 rounded font-medium"
          style={{ 
            backgroundColor: '#3b82f6',
            color: 'white',
            cursor: 'pointer',
            border: 'none',
            outline: 'none'
          }}
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {chatHistory.length === 0 ? (
          <div className="text-center text-sm py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
            No chat history yet.
            <br />
            Start a new conversation!
          </div>
        ) : (
          <div className="space-y-1">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  activeChat === chat.id ? 'bg-muted' : ''
                }`}
                style={{
                  backgroundColor: activeChat === chat.id ? 'hsl(var(--muted))' : 'transparent'
                }}
                onClick={() => onLoadChat(chat.id)}
              >
                <MessageSquare size={14} style={{ color: 'hsl(var(--muted-foreground))' }} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{chat.title}</div>
                  <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {new Date(chat.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                  style={{ color: 'hsl(var(--destructive))' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 p-2 hover:bg-gray-800 rounded transition-colors text-left"
        >
          <Settings size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
          <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>Keys & Settings</span>
        </button>
        
        <div className="mt-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Push disabled (local-only)</span>
          </div>
        </div>
      </div>
    </div>
  );
};