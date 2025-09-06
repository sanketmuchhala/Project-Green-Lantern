import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertTriangle, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Modal, Button, Input, Badge } from './ui';
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
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Keys & Settings"
      size="xl"
    >
      <div className="space-y-6">
          {/* Security Warning */}
          <div className="panel bg-amber-900/20 border-amber-700">
            <div className="p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="heading-sm text-amber-200 mb-2">Security Notice</div>
                <div className="body-sm text-amber-300 leading-relaxed">
                  API keys are stored locally in your browser only. They are never sent anywhere except to AI providers directly. 
                  Git push is disabled to prevent accidental key exposure.
                </div>
              </div>
            </div>
          </div>
          
          {/* Provider Selection */}
          <div className="space-y-4">
            <h3 className="heading-sm text-neutral-100">API Configuration</h3>
            
            <div>
              <label className="block body-sm font-medium mb-3 text-neutral-200">
                Provider
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value as Provider)}
                className="w-full p-3 bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-xl focus-ring text-lg"
              >
                {Object.entries(PROVIDER_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block body-sm font-medium mb-3 text-neutral-200">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-3 bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-xl focus-ring text-lg"
              >
                {getModelsForProvider(selectedProvider).map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block body-sm font-medium mb-3 text-neutral-200 flex items-center gap-2">
                API Key for {PROVIDER_NAMES[selectedProvider]}
                {currentApiKey && currentApiKey.length > 10 && 
                  <Badge variant="success" size="sm">CONFIGURED</Badge>
                }
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={showKey ? currentApiKey : (currentApiKey ? maskKey(currentApiKey) : '')}
                    onChange={(e) => setCurrentApiKey(e.target.value)}
                    placeholder={`Enter your ${PROVIDER_NAMES[selectedProvider]} API key`}
                    className="pr-12 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-700 rounded-lg transition-colors text-neutral-400 hover:text-neutral-200"
                    aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleTestKey}
                    disabled={isTestingKey || !currentApiKey.trim()}
                    variant="primary"
                    size="sm"
                  >
                    {isTestingKey ? 'Testing...' : 'Test Key'}
                  </Button>
                  
                  {testResult && (
                    <div className={`flex items-center gap-2 body-sm ${testResult.ok ? 'text-green-400' : 'text-red-400'}`}>
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
            <h3 className="heading-sm text-neutral-100">App Settings</h3>
            
            <div>
              <label className="block body-sm font-medium mb-3 text-neutral-200">Mode</label>
              <select 
                value={mode}
                onChange={(e) => setMode(e.target.value as typeof mode)}
                className="w-full p-3 bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-xl focus-ring text-lg"
              >
                <option value="direct">Direct Chat</option>
                <option value="research">Research Mode</option>
                <option value="coach">Prompt Coach</option>
              </select>
              <div className="muted mt-2">
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
                className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="web_enabled" className="body-sm font-medium text-neutral-200">
                Web Search Enabled (Beta)
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block body-sm font-medium mb-3 text-neutral-200">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              
              <div>
                <label className="block body-sm font-medium mb-3 text-neutral-200">Max Tokens</label>
                <Input
                  type="number"
                  min="100"
                  max="8000"
                  value={maxTokens.toString()}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1000)}
                />
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-neutral-700">
            <Button
              onClick={clearAllData}
              variant="ghost"
              size="md"
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <Trash2 size={16} />
              Clear All Data
            </Button>
            
            <div className="flex gap-3">
              <Button 
                onClick={onClose}
                variant="secondary"
                size="md"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                variant="primary"
                size="md"
              >
                Save Settings
              </Button>
            </div>
          </div>
      </div>
    </Modal>
  );
};