import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className, type = 'text', ...props }) => {
  return (
    <input
      type={type}
      className={cn(
        'w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl',
        'text-neutral-100 placeholder-neutral-400',
        'focus:border-lantern-400 focus:ring-1 focus:ring-lantern-400 focus:outline-none lantern-border',
        'hover:border-lantern-600 hover:lantern-glow',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200',
        className
      )}
      {...props}
    />
  );
};