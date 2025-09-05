import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { WebSearchResult } from '@app/types';

interface CitationsCardProps {
  results: WebSearchResult[];
}

export const CitationsCard: React.FC<CitationsCardProps> = ({ results }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (results.length === 0) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-neutral-200 hover:bg-neutral-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ExternalLink size={18} className="text-blue-400" />
          <span className="font-medium">Sources ({results.length})</span>
        </div>
        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Citations List */}
      {isExpanded && (
        <div className="border-t border-neutral-700">
          <div className="p-4 space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-neutral-800 border border-neutral-600 rounded-xl p-4 hover:border-neutral-500 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Citation Number */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-medium rounded-full">
                        {index + 1}
                      </span>
                      <span className="text-sm text-neutral-400">{result.source}</span>
                      {result.publishDate && (
                        <>
                          <span className="text-neutral-600">•</span>
                          <span className="text-sm text-neutral-400">{result.publishDate}</span>
                        </>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="font-medium text-neutral-100 text-sm mb-2 leading-snug">
                      {result.title}
                    </h4>

                    {/* Snippet */}
                    <p className="text-neutral-300 text-sm leading-relaxed line-clamp-3">
                      {result.snippet}
                    </p>
                  </div>

                  {/* External Link */}
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 text-neutral-400 hover:text-blue-400 hover:bg-neutral-700 rounded-lg transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};