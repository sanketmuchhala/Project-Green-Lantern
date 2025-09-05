import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chat } from './components/Chat';
import { SettingsModal } from './components/SettingsModal';
import { useChat } from './hooks/useChat';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const {
    currentMessages,
    chatHistory,
    activeChat,
    startNewChat,
    loadChat,
    deleteChat,
    saveCurrentChat
  } = useChat();

  // Auto-save current chat when messages change
  React.useEffect(() => {
    if (currentMessages.length > 0) {
      const timer = setTimeout(saveCurrentChat, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentMessages, saveCurrentChat]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        chatHistory={chatHistory}
        activeChat={activeChat}
        onNewChat={() => {
          console.log('App.tsx: onNewChat triggered');
          startNewChat();
        }}
        onLoadChat={loadChat}
        onDeleteChat={deleteChat}
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