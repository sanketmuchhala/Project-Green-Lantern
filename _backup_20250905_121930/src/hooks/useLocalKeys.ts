import { useState, useEffect } from 'react';

export interface ApiKeys {
  modelName: string;
  apiKey: string;
}

export interface AppSettings {
  web_enabled: boolean;
  mode: 'direct' | 'research' | 'coach';
  temperature: number;
  max_tokens: number;
  selectedProvider: string;
  selectedModel: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  web_enabled: false,
  mode: 'direct',
  temperature: 0.7,
  max_tokens: 4000,
  selectedProvider: 'openai',
  selectedModel: 'gpt-4o-mini'
};

const STORAGE_KEYS = {
  API_KEYS: 'byok-api-keys',
  SETTINGS: 'byok-settings'
};

export const useLocalKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    modelName: '',
    apiKey: ''
  });

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem(STORAGE_KEYS.API_KEYS);
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      
      if (savedKeys) {
        const parsedKeys = JSON.parse(savedKeys);
        setApiKeys(parsedKeys);
      }
      
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  const updateApiKeys = (newKeys: ApiKeys) => {
    setApiKeys(newKeys);
    
    try {
      localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(newKeys));
    } catch (error) {
      console.error('Error saving API keys:', error);
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const getApiKey = (): string => {
    return apiKeys.apiKey;
  };

  const maskKey = (key: string): string => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  const hasValidKey = (): boolean => {
    return apiKeys.apiKey.length > 0;
  };

  const clearAllData = () => {
    setApiKeys({
      modelName: '',
      apiKey: ''
    });
    setSettings(DEFAULT_SETTINGS);
    
    try {
      localStorage.removeItem(STORAGE_KEYS.API_KEYS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  return {
    apiKeys,
    settings,
    updateApiKeys,
    updateSettings,
    getApiKey,
    maskKey,
    hasValidKey,
    clearAllData
  };
};