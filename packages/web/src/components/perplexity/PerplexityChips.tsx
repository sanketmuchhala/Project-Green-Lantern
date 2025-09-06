import React from 'react';
import { AlertTriangle, CheckCircle, Brain, ArrowRight } from 'lucide-react';
import { Button, Badge } from '../ui';
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
          <h4 className="body-sm font-medium text-neutral-300 mb-3">Assumptions Made:</h4>
          <div className="flex flex-wrap gap-2">
            {assumptions.map((assumption, index) => (
              <Badge
                key={index}
                variant="warning"
                size="md"
                className="gap-2"
              >
                <AlertTriangle size={14} />
                {assumption}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Level */}
      {confidence && (
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={
                confidence === 'high' ? 'success' :
                confidence === 'medium' ? 'warning' :
                confidence === 'low' ? 'danger' : 'default'
              }
              size="md"
              className="gap-2 font-medium"
            >
              {getConfidenceIcon(confidence)}
              Confidence: {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
            </Badge>
          </div>
        </div>
      )}

      {/* Follow-up Questions */}
      {followUps && followUps.length > 0 && (
        <div>
          <h4 className="body-sm font-medium text-neutral-300 mb-3">Follow-up Questions:</h4>
          <div className="flex flex-wrap gap-2">
            {followUps.map((followUp, index) => (
              <Button
                key={index}
                onClick={() => onFollowUpClick?.(followUp)}
                variant="primary"
                size="sm"
                className="gap-2 rounded-full"
              >
                <ArrowRight size={14} />
                {followUp}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Report Card */}
      {reportCard && reportCard.length > 0 && (
        <div>
          <h4 className="body-sm font-medium text-neutral-300 mb-3">Quality Assessment:</h4>
          <div className="grid grid-cols-3 gap-2">
            {reportCard.map((item, index) => (
              <Badge
                key={index}
                variant={item.status === 'pass' ? 'success' : 'warning'}
                size="md"
                className="justify-center gap-2"
                title={item.note}
              >
                {item.status === 'pass' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                <span className="capitalize">{item.category}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};