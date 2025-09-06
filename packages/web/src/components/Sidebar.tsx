import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, Settings, Edit2, Check, X } from 'lucide-react';
import { Conversation } from '../lib/db';
import { sanitizeDisplayText } from '../lib/stripEmojis';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onLoadChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onNewChat,
  onLoadChat,
  onDeleteChat,
  onRenameChat,
  onOpenSettings
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };
  
  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameChat(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };
  return (
    <div className="w-64 border-r flex flex-col h-screen bg-neutral-900 border-neutral-800">
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={20} className="text-blue-400" />
          <span className="font-semibold text-white">Lantern</span>
        </div>
        
        <button 
          onClick={() => {
            console.log('New Chat clicked!');
            onNewChat();
          }}
          className="w-full flex items-center justify-center gap-2 p-3 rounded font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors border-none outline-none cursor-pointer"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="text-center text-sm py-8 text-neutral-400">
            No chat history yet.
            <br />
            Start a new conversation!
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  activeConversationId === conv.id ? 'bg-neutral-800' : 'hover:bg-neutral-800 hover:bg-opacity-50'
                }`}
                onClick={() => editingId !== conv.id && onLoadChat(conv.id)}
              >
                <MessageSquare size={14} className="text-neutral-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {editingId === conv.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 text-sm bg-neutral-700 text-white px-2 py-1 rounded border-none outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit();
                        }}
                        className="p-1 text-green-400 hover:bg-neutral-700 rounded"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                        className="p-1 text-red-400 hover:bg-neutral-700 rounded"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium truncate text-white">{sanitizeDisplayText(conv.title)}</div>
                      <div className="text-xs text-neutral-400">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </div>
                    </>
                  )}
                </div>
                {editingId !== conv.id && (
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(conv);
                      }}
                      className="p-1 text-blue-400 hover:bg-neutral-700 rounded transition-all"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this conversation?')) {
                          onDeleteChat(conv.id);
                        }
                      }}
                      className="p-1 text-red-400 hover:bg-neutral-700 rounded transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-neutral-800">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 p-2 hover:bg-neutral-800 rounded transition-colors text-left"
        >
          <Settings size={16} className="text-neutral-400" />
          <span className="text-sm text-white">Keys & Settings</span>
        </button>
        
        <div className="mt-3 text-xs text-neutral-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Push disabled (local-only)</span>
          </div>
        </div>
      </div>
    </div>
  );
};