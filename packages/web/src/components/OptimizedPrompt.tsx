import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Lightbulb, Copy } from 'lucide-react';
import { OptimizedPrompt as OptimizedPromptType } from '../hooks/useChat';

interface OptimizedPromptProps {
  prompt: OptimizedPromptType | null;
  onUsePrompt?: (content: string) => void;
}

export const OptimizedPrompt: React.FC<OptimizedPromptProps> = ({ prompt, onUsePrompt }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!prompt) return null;

  const formatPrompt = () => {
    return `Task: ${prompt.task}

Context: ${prompt.context}

Must Include:
${prompt.mustInclude.map(item => `- ${item}`).join('\n')}

Constraints:
${prompt.constraints.map(item => `- ${item}`).join('\n')}

Inputs:
${prompt.inputs.map(item => `- ${item}`).join('\n')}

Quality Bar: ${prompt.qualityBar}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formatPrompt());
  };

  const handleUse = () => {
    onUsePrompt?.(formatPrompt());
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
      <div 
        className="flex items-center gap-2 p-3 bg-amber-100 cursor-pointer hover:bg-amber-150 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Lightbulb size={16} className="text-amber-600" />
        <span className="font-medium text-amber-800">Optimized Prompt</span>
        {isExpanded ? <ChevronDown size={16} className="ml-auto text-amber-600" /> : <ChevronRight size={16} className="ml-auto text-amber-600" />}
      </div>
      
      {isExpanded && (
        <div className="p-4 space-y-3">
          <div>
            <h4 className="font-semibold text-sm text-amber-800 mb-1">Task</h4>
            <p className="text-sm text-amber-700">{prompt.task}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm text-amber-800 mb-1">Context</h4>
            <p className="text-sm text-amber-700">{prompt.context}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm text-amber-800 mb-1">Must Include</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              {prompt.mustInclude.map((item, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-amber-500 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm text-amber-800 mb-1">Constraints</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              {prompt.constraints.map((item, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-amber-500 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm text-amber-800 mb-1">Quality Bar</h4>
            <p className="text-sm text-amber-700">{prompt.qualityBar}</p>
          </div>
          
          <div className="flex gap-2 pt-2 border-t border-amber-200">
            <button 
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-800 text-sm rounded transition-colors"
            >
              <Copy size={14} />
              Copy
            </button>
            <button 
              onClick={handleUse}
              className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded transition-colors"
            >
              Use This Prompt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};