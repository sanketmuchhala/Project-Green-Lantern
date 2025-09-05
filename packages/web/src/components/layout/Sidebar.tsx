import React, { useState } from 'react';
import { Plus, Search, MessageSquare, Trash2, Edit3, Settings } from 'lucide-react';
import { sanitizeDisplayText } from '../../lib/stripEmojis';
import { Conversation } from '../../lib/db';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onOpenSettings
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRename = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleSaveRename = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <div className="w-80 bg-neutral-900 border-r border-neutral-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-neutral-700">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center gap-3 px-4 py-3 bg-neutral-950 hover:bg-neutral-800 text-neutral-100 rounded-2xl transition-colors font-medium"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm mt-1">Start a new chat to get going</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group relative rounded-xl transition-colors ${
                  conversation.id === activeConversationId
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'hover:bg-neutral-850 text-neutral-300 hover:text-neutral-100'
                }`}
              >
                {editingId === conversation.id ? (
                  <div className="p-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename();
                        if (e.key === 'Escape') handleCancelRename();
                      }}
                      onBlur={handleSaveRename}
                      className="w-full bg-neutral-700 border border-neutral-600 rounded px-2 py-1 text-sm text-neutral-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectConversation(conversation.id)}
                    className="w-full text-left p-3 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {sanitizeDisplayText(conversation.title)}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(conversation);
                        }}
                        className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-neutral-200 transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                        className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-700">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-4 py-3 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded-xl transition-colors"
        >
          <Settings size={18} />
          Settings
        </button>
      </div>
    </div>
  );
};