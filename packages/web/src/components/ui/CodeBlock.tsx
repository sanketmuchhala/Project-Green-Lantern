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
    <div className={cn('relative group', className)}>
      {/* Language label and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-800 border-b border-neutral-700 rounded-t-xl">
        <span className="text-xs font-medium text-neutral-400">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-neutral-700 rounded-lg transition-colors text-neutral-400 hover:text-neutral-200"
          title="Copy to clipboard"
          aria-label="Copy code to clipboard"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
      
      {/* Code content */}
      <pre className="bg-neutral-900 border border-neutral-700 border-t-0 rounded-b-xl overflow-x-auto">
        <code className="block p-4 text-sm font-mono text-neutral-100 leading-relaxed">
          {code}
        </code>
      </pre>
    </div>
  );
};