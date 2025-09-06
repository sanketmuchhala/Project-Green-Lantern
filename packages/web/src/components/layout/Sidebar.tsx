import React, { useState } from 'react';
import { Plus, Search, MessageSquare, Trash2, Edit3, Settings } from 'lucide-react';
import { Button, Input } from '../ui';
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
    <div className="w-80 panel border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-neutral-700">
        <Button
          onClick={onNewConversation}
          variant="primary"
          size="md"
          className="w-full"
        >
          <Plus size={18} />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 py-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 z-10" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 scrollbar-thin">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageSquare size={32} className="mx-auto mb-3 text-neutral-600" />
            <p className="body-sm text-neutral-400 mb-1">No conversations yet</p>
            <p className="muted">Start a new chat to get going</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group relative rounded-2xl transition-all duration-200 ${
                  conversation.id === activeConversationId
                    ? 'bg-neutral-800 text-neutral-100 ring-1 ring-neutral-600'
                    : 'hover:bg-neutral-850 text-neutral-300 hover:text-neutral-100'
                }`}
              >
                {editingId === conversation.id ? (
                  <div className="p-4">
                    <Input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename();
                        if (e.key === 'Escape') handleCancelRename();
                      }}
                      onBlur={handleSaveRename}
                      className="body-sm"
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectConversation(conversation.id)}
                    className="w-full text-left p-4 flex items-center justify-between group-hover:bg-transparent"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="body-sm font-medium truncate mb-1">
                        {sanitizeDisplayText(conversation.title)}
                      </div>
                      <div className="muted">
                        {new Date(conversation.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: new Date(conversation.updatedAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(conversation);
                        }}
                        className="p-2 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors focus-ring"
                        aria-label="Rename conversation"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                        className="p-2 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-red-400 transition-colors focus-ring"
                        aria-label="Delete conversation"
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
      <div className="p-6 border-t border-neutral-700">
        <Button
          onClick={onOpenSettings}
          variant="ghost"
          size="md"
          className="w-full justify-start"
        >
          <Settings size={18} />
          Settings
        </Button>
      </div>
    </div>
  );
};