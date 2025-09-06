import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ThinkingHUDProps {
  running: boolean;
  elapsedMs: number;
  tokensPerSec?: number;
  phase?: "Planning" | "Drafting" | "Refining";
  summary?: string;
}

export default function ThinkingHUD({ 
  running, 
  elapsedMs, 
  tokensPerSec, 
  phase = "Thinking", 
  summary 
}: ThinkingHUDProps) {
  const [expanded, setExpanded] = useState(false);

  if (!running) return null;

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="rounded-xl bg-neutral-900 border border-neutral-700 p-3 mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          {/* Pulsing indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-neutral-100 font-medium">{phase}</span>
          </div>
          
          <div className="text-neutral-400">•</div>
          <span className="text-neutral-300">{formatTime(elapsedMs)}</span>
          
          {tokensPerSec != null && tokensPerSec > 0 && (
            <>
              <div className="text-neutral-400">•</div>
              <span className="text-neutral-300">{tokensPerSec.toFixed(1)} tok/s</span>
            </>
          )}
        </div>

        {/* Summary toggle if available */}
        {summary && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-300 transition-colors"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Summary</span>
          </button>
        )}
      </div>

      {/* Expandable summary */}
      {summary && expanded && (
        <div className="mt-2 pt-2 border-t border-neutral-700">
          <div className="text-sm text-neutral-300 max-w-none">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
}