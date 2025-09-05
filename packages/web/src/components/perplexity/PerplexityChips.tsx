import React from 'react';
import { AlertTriangle, CheckCircle, Brain, ArrowRight } from 'lucide-react';
import { ConfidenceLevel, ReportCardItem } from '@app/types';

interface PerplexityChipsProps {
  assumptions?: string[];
  confidence?: ConfidenceLevel;
  followUps?: string[];
  reportCard?: ReportCardItem[];
  onFollowUpClick?: (followUp: string) => void;
}

export const PerplexityChips: React.FC<PerplexityChipsProps> = ({
  assumptions,
  confidence,
  followUps,
  reportCard,
  onFollowUpClick
}) => {
  const getConfidenceColor = (level: ConfidenceLevel) => {
    switch (level) {
      case 'high': return 'bg-green-900 text-green-200 border-green-700';
      case 'medium': return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      case 'low': return 'bg-red-900 text-red-200 border-red-700';
      default: return 'bg-neutral-800 text-neutral-200 border-neutral-600';
    }
  };

  const getConfidenceIcon = (level: ConfidenceLevel) => {
    switch (level) {
      case 'high': return <CheckCircle size={14} />;
      case 'medium': return <Brain size={14} />;
      case 'low': return <AlertTriangle size={14} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Assumptions */}
      {assumptions && assumptions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-300 mb-2">Assumptions Made:</h4>
          <div className="flex flex-wrap gap-2">
            {assumptions.map((assumption, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-900 text-amber-200 border border-amber-700 rounded-full text-sm"
              >
                <AlertTriangle size={14} />
                {assumption}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Level */}
      {confidence && (
        <div>
          <div className="flex flex-wrap gap-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-full text-sm font-medium ${getConfidenceColor(confidence)}`}>
              {getConfidenceIcon(confidence)}
              Confidence: {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Questions */}
      {followUps && followUps.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-300 mb-2">Follow-up Questions:</h4>
          <div className="flex flex-wrap gap-2">
            {followUps.map((followUp, index) => (
              <button
                key={index}
                onClick={() => onFollowUpClick?.(followUp)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-blue-200 border border-blue-700 rounded-full text-sm transition-colors cursor-pointer"
              >
                <ArrowRight size={14} />
                {followUp}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report Card */}
      {reportCard && reportCard.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-300 mb-2">Quality Assessment:</h4>
          <div className="grid grid-cols-3 gap-2">
            {reportCard.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                  item.status === 'pass' 
                    ? 'bg-green-900 text-green-200 border-green-700' 
                    : 'bg-yellow-900 text-yellow-200 border-yellow-700'
                }`}
                title={item.note}
              >
                {item.status === 'pass' ? '✅' : '⚠️'}
                <span className="capitalize">{item.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};