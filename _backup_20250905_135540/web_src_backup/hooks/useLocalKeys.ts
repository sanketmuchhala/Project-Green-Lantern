import { useEffect } from 'react';
import useChat from '../state/chatStore';
import { Provider } from '../lib/db';

// For backward compatibility with existing components
export interface ApiKeys {
  apiKey: string;
  modelName: string;
}

export interface AppSettings {
  web_enabled: boolean;
  mode: 'direct' | 'research' | 'coach';
  temperature: number;
  max_tokens: number;
  selectedProvider: Provider;
}

export const useLocalKeys = () => {
  const { settings, saveSettings, getApiKey, setApiKey, getCurrentProvider, loadSettings } = useChat();
  
  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // For backward compatibility - convert new format to old format
  const apiKeys: ApiKeys = {
    apiKey: settings ? getApiKey(getCurrentProvider()) : '',
    modelName: '' // Will be populated by model selection in settings
  };
  
  const updateApiKeys = (newKeys: ApiKeys) => {
    if (settings) {
      setApiKey(getCurrentProvider(), newKeys.apiKey);
    }
  };
  
  const updateSettings = (partial: Partial<AppSettings>) => {
    if (settings) {
      saveSettings(partial);
    }
  };
  
  const maskKey = (key: string): string => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };
  
  const hasValidKey = (): boolean => {
    const key = getApiKey(getCurrentProvider());
    return key && key.length > 10;
  };
  
  const clearAllData = async () => {
    // This will be handled by clearing the IndexedDB and localStorage
    localStorage.clear();
    window.location.reload();
  };
  
  return {
    apiKeys,
    settings: settings ? {
      mode: settings.mode,
      temperature: settings.temperature,
      max_tokens: settings.max_tokens,
      web_enabled: settings.web_enabled,
      selectedProvider: settings.selectedProvider
    } : {
      mode: 'direct' as const,
      temperature: 0.7,
      max_tokens: 4000,
      web_enabled: false,
      selectedProvider: 'openai' as Provider
    },
    updateApiKeys,
    updateSettings,
    maskKey,
    hasValidKey,
    clearAllData
  };
};