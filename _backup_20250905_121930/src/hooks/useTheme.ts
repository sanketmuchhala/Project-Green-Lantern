import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('byok-theme') as Theme;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // Save to localStorage
    try {
      localStorage.setItem('byok-theme', theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setDark = () => setTheme('dark');
  const setLight = () => setTheme('light');

  return {
    theme,
    toggleTheme,
    setDark,
    setLight,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };
};