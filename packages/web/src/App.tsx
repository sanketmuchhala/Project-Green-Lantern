import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Chat } from './components/Chat';
import { SettingsModal } from './components/SettingsModal';
import useChat from './state/chatStore';
import { initializeDatabase } from './lib/db';
import PromptScopeRoute from './routes/PromptScopeRoute';


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

  const MainLayout = ({ children }: { children: React.ReactNode }) => (
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
      {children}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );

  const showPromptScopeLink = (localStorage.getItem("PROMPTOPS_ENABLED")||"true") !== "false";

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <MainLayout>
            <Chat onOpenSettings={() => setIsSettingsOpen(true)} />
          </MainLayout>
        } />
        <Route path="/promptscope" element={<PromptScopeRoute />} />
        
      </Routes>
      {showPromptScopeLink && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 100 }}>
          <Link to="/promptscope" className="text-neutral-300 hover:text-neutral-100 px-3 bg-neutral-800 rounded-md py-1">PromptScope</Link>
        </div>
      )}
    </Router>
  );
}

export default App;
