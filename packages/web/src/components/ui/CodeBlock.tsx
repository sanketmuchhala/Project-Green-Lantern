import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language, 
  className 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className={cn('relative group shadow-lg', className)}>
      {/* Language label and copy button */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-neutral-800 to-neutral-750 border border-neutral-600 rounded-t-xl">
        <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">
          {language || 'plain text'}
        </span>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-neutral-700/50 rounded-lg transition-all duration-200 text-neutral-400 hover:text-neutral-100 hover:scale-105"
          title="Copy to clipboard"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <div className="flex items-center gap-1.5 text-green-400">
              <Check size={14} />
              <span className="text-xs font-medium">Copied!</span>
            </div>
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>
      
      {/* Code content */}
      <pre className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-600 border-t-0 rounded-b-xl overflow-x-auto max-h-96 overflow-y-auto">
        <code className="block p-4 text-sm font-mono text-neutral-100 leading-relaxed whitespace-pre-wrap break-all sm:break-normal">
          {code}
        </code>
      </pre>
    </div>
  );
};