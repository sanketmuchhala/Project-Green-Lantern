import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg glass-strong transition-all duration-300 hover:scale-105 group"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {/* Sun icon */}
        <Sun 
          size={20} 
          className={`absolute inset-0 transition-all duration-300 ${
            theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-75'
          }`}
          style={{ color: 'var(--accent)' }}
        />
        
        {/* Moon icon */}
        <Moon 
          size={20} 
          className={`absolute inset-0 transition-all duration-300 ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-75'
          }`}
          style={{ color: 'var(--accent)' }}
        />
      </div>
      
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${
        theme === 'dark' ? 'bg-blue-400' : 'bg-orange-400'
      }`} />
    </button>
  );
};