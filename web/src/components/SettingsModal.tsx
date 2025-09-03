import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, AlertTriangle, Trash2 } from 'lucide-react';
import { ApiKeys, useLocalKeys } from '../hooks/useLocalKeys';
import { ThemeToggle } from './ThemeToggle';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { apiKeys, settings, updateApiKeys, updateSettings, maskKey, hasValidKey, clearAllData } = useLocalKeys();
  const [showKey, setShowKey] = useState(false);
  const [localKeys, setLocalKeys] = useState<ApiKeys>(apiKeys);

  // Sync localKeys with apiKeys when modal opens or apiKeys change
  useEffect(() => {
    setLocalKeys(apiKeys);
  }, [apiKeys, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateApiKeys(localKeys);
    onClose();
  };

  const handleKeyChange = (field: keyof ApiKeys, value: string) => {
    if (field === 'apiKey' && value !== localKeys.apiKey && value.length > 20 && (value.startsWith('sk-') || value.includes('api'))) {
      console.warn('⚠️ API key detected in input. Ensure this is correct and secure.');
    }
    setLocalKeys(prev => ({ ...prev, [field]: value }));
  };

  const toggleKeyVisibility = () => {
    setShowKey(!showKey);
  };

  const handleProviderChange = (provider: string) => {
    updateSettings({ selectedProvider: provider });
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all data? This will remove all API keys, settings, and chat history.')) {
      clearAllData();
      setLocalKeys({ modelName: '', apiKey: '' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
      backgroundColor: 'rgba(0, 0, 0, 0.9)'
    }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border shadow-2xl" style={{
        backgroundColor: '#0f0f0f',
        borderColor: '#262626',
        opacity: '1'
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{
          borderColor: 'hsl(var(--border))'
        }}>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold" style={{ color: '#ededed' }}>Keys & Settings</h2>
            <ThemeToggle />
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            style={{ color: '#ededed' }}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Security Warning */}
          <div className="p-4 rounded-lg border" style={{
            backgroundColor: 'rgb(254 252 232)',
            borderColor: 'rgb(253 230 138)'
          }}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-amber-800 mb-1">Security Notice</div>
                <div className="text-amber-700">
                  API keys are stored locally in your browser only. They are never sent to any server except the AI providers directly. 
                  Push to git is disabled to prevent accidental key exposure.
                </div>
              </div>
            </div>
          </div>
          
          {/* API Keys */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base" style={{ color: '#ededed' }}>API Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#ededed' }}>
                  Model Name
                </label>
                <input
                  type="text"
                  value={localKeys.modelName}
                  onChange={(e) => handleKeyChange('modelName', e.target.value)}
                  placeholder="e.g. gpt-4o-mini, claude-3-sonnet, deepseek-r1"
                  className="w-full p-3 border rounded-lg text-sm"
                  style={{
                    backgroundColor: '#262626',
                    color: '#ededed',
                    borderColor: '#404040'
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#ededed' }}>
                  API Key
                  {hasValidKey() && 
                    <span className="ml-2 text-green-400 text-xs">✓ Set</span>
                  }
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={showKey ? localKeys.apiKey : (localKeys.apiKey ? maskKey(localKeys.apiKey) : '')}
                    onChange={(e) => handleKeyChange('apiKey', e.target.value)}
                    placeholder="Enter your API key (sk-...)"
                    className="w-full p-3 pr-10 border rounded-lg font-mono text-sm"
                    style={{
                      backgroundColor: '#262626',
                      color: '#ededed',
                      borderColor: '#404040'
                    }}
                  />
                  <button
                    type="button"
                    onClick={toggleKeyVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          
          {/* App Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base" style={{ color: '#ededed' }}>App Settings</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#ededed' }}>Mode</label>
                <select 
                  value={settings.mode}
                  onChange={(e) => updateSettings({ mode: e.target.value as any })}
                  className="w-full p-2 border rounded-lg"
                  style={{
                    backgroundColor: '#262626',
                    color: '#ededed',
                    borderColor: '#404040'
                  }}
                >
                  <option value="direct">Direct Chat</option>
                  <option value="research">Research Mode</option>
                  <option value="coach">Prompt Coach</option>
                </select>
                <div className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {settings.mode === 'research' && 'Provides structured research with plans and citations'}
                  {settings.mode === 'coach' && 'Helps optimize prompts and asks clarifying questions'}
                  {settings.mode === 'direct' && 'Standard conversational chat interface'}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="web_enabled"
                  checked={settings.web_enabled}
                  onChange={(e) => updateSettings({ web_enabled: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="web_enabled" className="text-sm font-medium" style={{ color: '#ededed' }}>
                  Web Search Enabled (Currently Stubbed)
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#ededed' }}>
                    Temperature: {settings.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#ededed' }}>Max Tokens</label>
                  <input
                    type="number"
                    min="100"
                    max="8000"
                    value={settings.max_tokens}
                    onChange={(e) => updateSettings({ max_tokens: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                    style={{
                      backgroundColor: 'hsl(var(--input))',
                      color: 'hsl(var(--foreground))',
                      borderColor: 'hsl(var(--border))'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-3 py-2 hover:bg-red-900 hover:bg-opacity-20 rounded transition-colors"
              style={{ color: 'hsl(var(--destructive))' }}
            >
              <Trash2 size={16} />
              Clear All Data
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={onClose}
                className="px-4 py-2 border hover:bg-gray-800 rounded transition-colors"
                style={{
                  borderColor: '#404040',
                  color: '#ededed'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 hover:opacity-90 rounded transition-colors"
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white'
                }}
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