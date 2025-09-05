import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chat } from './components/Chat';
import { SettingsModal } from './components/SettingsModal';
import useChat from './state/chatStore';
import { initializeDatabase } from './lib/db';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const {
    conversations,
    activeConversationId,
    newConversation,
    selectConversation,
    deleteConversation,
    updateConversationTitle,
    loadConversations,
    loadSettings
  } = useChat();

  // Initialize database and load data on app start
  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      await loadSettings();
      await loadConversations();
      setIsInitialized(true);
    };
    init();
  }, [loadSettings, loadConversations]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        newConversation();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
      if (e.key === 'Escape' && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newConversation, isSettingsOpen]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-950 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Initializing BYOK Copilot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-white">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={() => {
          console.log('App.tsx: onNewChat triggered');
          newConversation();
        }}
        onLoadChat={selectConversation}
        onDeleteChat={deleteConversation}
        onRenameChat={updateConversationTitle}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <Chat onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;