import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, AlertTriangle, Trash2, CheckCircle, XCircle } from 'lucide-react';
import useChat from '../state/chatStore';
import { Provider } from '../lib/db';
import { PROVIDER_NAMES, getModelsForProvider, getDefaultModelForProvider } from '../constants/models';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    settings, 
    saveSettings, 
    getApiKey, 
    setApiKey, 
    testApiKey,
    loadSettings
  } = useChat();
  
  const [selectedProvider, setSelectedProvider] = useState<Provider>('openai');
  const [selectedModel, setSelectedModel] = useState('');
  const [currentApiKey, setCurrentApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4000);
  const [webEnabled, setWebEnabled] = useState(false);
  const [mode, setMode] = useState<'direct' | 'research' | 'coach'>('direct');

  // Load current settings when modal opens
  useEffect(() => {
    if (isOpen && settings) {
      setSelectedProvider(settings.selectedProvider);
      setCurrentApiKey(getApiKey(settings.selectedProvider));
      setSelectedModel(getDefaultModelForProvider(settings.selectedProvider));
      setTemperature(settings.temperature);
      setMaxTokens(settings.max_tokens);
      setWebEnabled(settings.web_enabled);
      setMode(settings.mode);
    } else if (isOpen) {
      loadSettings();
    }
  }, [isOpen, settings, getApiKey, loadSettings]);

  // Update API key when provider changes
  useEffect(() => {
    if (settings) {
      setCurrentApiKey(getApiKey(selectedProvider));
      setSelectedModel(getDefaultModelForProvider(selectedProvider));
      setTestResult(null);
    }
  }, [selectedProvider, settings, getApiKey]);

  if (!isOpen) return null;

  const handleSave = async () => {
    // Save API key for current provider
    await setApiKey(selectedProvider, currentApiKey);
    
    // Save other settings
    await saveSettings({
      selectedProvider,
      temperature,
      max_tokens: maxTokens,
      web_enabled: webEnabled,
      mode
    });
    
    // Update active conversation to use the selected model and provider
    const { activeConversation, updateConversationSettings } = useChat.getState();
    const currentConv = activeConversation();
    if (currentConv) {
      await updateConversationSettings(currentConv.id, {
        provider: selectedProvider,
        model: selectedModel,
        temperature,
        max_tokens: maxTokens,
        web_enabled: webEnabled
      });
    }
    
    onClose();
  };

  const handleTestKey = async () => {
    if (!currentApiKey.trim()) {
      setTestResult({ ok: false, message: 'Please enter an API key first' });
      return;
    }
    
    setIsTestingKey(true);
    setTestResult(null);
    
    // Temporarily save the key for testing
    await setApiKey(selectedProvider, currentApiKey);
    
    try {
      const result = await testApiKey(selectedProvider, selectedModel);
      setTestResult(result);
    } catch (error) {
      setTestResult({ ok: false, message: 'Test failed: ' + (error as Error).message });
    } finally {
      setIsTestingKey(false);
    }
  };

  const maskKey = (key: string): string => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This will remove all API keys, settings, and chat history.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-60" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-neutral-900 text-neutral-100 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">Keys & Settings</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Security Warning */}
          <div className="p-4 rounded-lg bg-amber-950 border border-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-amber-200 mb-1">Security Notice</div>
                <div className="text-amber-300">
                  API keys are stored locally in your browser only. They are never sent anywhere except to AI providers directly. 
                  Git push is disabled to prevent accidental key exposure.
                </div>
              </div>
            </div>
          </div>
          
          {/* Provider Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base text-white">API Configuration</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-200">
                Provider
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value as Provider)}
                className="w-full p-3 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {Object.entries(PROVIDER_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-200">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-3 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {getModelsForProvider(selectedProvider).map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-200">
                API Key for {PROVIDER_NAMES[selectedProvider]}
                {currentApiKey && currentApiKey.length > 10 && 
                  <span className="ml-2 text-green-400 text-xs font-medium">SET</span>
                }
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={showKey ? currentApiKey : (currentApiKey ? maskKey(currentApiKey) : '')}
                    onChange={(e) => setCurrentApiKey(e.target.value)}
                    placeholder={`Enter your ${PROVIDER_NAMES[selectedProvider]} API key`}
                    className="w-full p-3 pr-10 bg-neutral-800 text-white border border-neutral-700 rounded-lg font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-700 rounded transition-colors text-neutral-400"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestKey}
                    disabled={isTestingKey || !currentApiKey.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded transition-colors text-sm"
                  >
                    {isTestingKey ? 'Testing...' : 'Test Key'}
                  </button>
                  
                  {testResult && (
                    <div className={`flex items-center gap-1 text-sm ${testResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                      {testResult.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* App Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base text-white">App Settings</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-200">Mode</label>
              <select 
                value={mode}
                onChange={(e) => setMode(e.target.value as typeof mode)}
                className="w-full p-3 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="direct">Direct Chat</option>
                <option value="research">Research Mode</option>
                <option value="coach">Prompt Coach</option>
              </select>
              <div className="text-xs mt-1 text-neutral-400">
                {mode === 'research' && 'Provides structured research with plans and citations'}
                {mode === 'coach' && 'Helps optimize prompts and asks clarifying questions'}
                {mode === 'direct' && 'Standard conversational chat interface'}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="web_enabled"
                checked={webEnabled}
                onChange={(e) => setWebEnabled(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="web_enabled" className="text-sm font-medium text-neutral-200">
                Web Search Enabled (Currently Stubbed)
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-200">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-200">Max Tokens</label>
                <input
                  type="number"
                  min="100"
                  max="8000"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full p-2 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
            <button
              onClick={clearAllData}
              className="flex items-center gap-2 px-3 py-2 hover:bg-red-900 hover:bg-opacity-20 rounded transition-colors text-red-400"
            >
              <Trash2 size={16} />
              Clear All Data
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={onClose}
                className="px-4 py-2 border border-neutral-700 hover:bg-neutral-800 rounded transition-colors text-neutral-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};