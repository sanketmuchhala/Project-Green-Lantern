import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Brain, ClipboardCheck } from 'lucide-react';
import { Button } from '../ui';

interface RightRailProps {
  isOpen: boolean;
  onToggle: () => void;
  optimizedPrompt?: string;
  contextUsed?: string[];
  reportCard?: Array<{
    category: string;
    status: 'pass' | 'warning' | 'fail';
    note?: string;
  }>;
}

export const RightRail: React.FC<RightRailProps> = ({
  isOpen,
  onToggle,
  optimizedPrompt,
  contextUsed = [],
  reportCard = []
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'context' | 'report'>('prompt');

  const tabs = [
    { id: 'prompt' as const, label: 'Optimized Prompt', icon: FileText, count: optimizedPrompt ? 1 : 0 },
    { id: 'context' as const, label: 'Context Used', icon: Brain, count: contextUsed.length },
    { id: 'report' as const, label: 'Report Card', icon: ClipboardCheck, count: reportCard.length }
  ];

  return (
    <>
      {/* Toggle Button - Always visible */}
      <Button
        onClick={onToggle}
        variant="ghost"
        size="sm"
        className={`fixed right-4 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ${
          isOpen ? 'opacity-50 hover:opacity-100' : ''
        }`}
        aria-label={isOpen ? 'Close right panel' : 'Open right panel'}
      >
        {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </Button>

      {/* Right Rail Panel */}
      <div
        className={`fixed right-0 top-0 h-full z-30 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="w-96 h-full panel border-l flex flex-col">
          {/* Header with Tabs */}
          <div className="border-b border-neutral-700 p-4">
            <div className="heading-sm text-neutral-100 mb-4">Analysis</div>
            
            <div className="flex space-x-1 bg-neutral-800 rounded-xl p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      activeTab === tab.id
                        ? 'bg-neutral-700 text-neutral-100'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            {activeTab === 'prompt' && (
              <div className="space-y-4">
                <div className="heading-sm text-neutral-200">Optimized Prompt</div>
                {optimizedPrompt ? (
                  <div className="card p-4">
                    <pre className="body-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                      {optimizedPrompt}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText size={32} className="mx-auto mb-3 text-neutral-600" />
                    <p className="body-sm text-neutral-400 mb-1">No optimized prompt</p>
                    <p className="muted">Prompt optimization will appear here</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'context' && (
              <div className="space-y-4">
                <div className="heading-sm text-neutral-200">Context Used</div>
                {contextUsed.length > 0 ? (
                  <div className="space-y-3">
                    {contextUsed.map((context, index) => (
                      <div key={index} className="card p-4">
                        <div className="body-sm text-neutral-300 leading-relaxed">
                          {context}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain size={32} className="mx-auto mb-3 text-neutral-600" />
                    <p className="body-sm text-neutral-400 mb-1">No context retrieved</p>
                    <p className="muted">Context information will appear here</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'report' && (
              <div className="space-y-4">
                <div className="heading-sm text-neutral-200">Quality Report</div>
                {reportCard.length > 0 ? (
                  <div className="space-y-3">
                    {reportCard.map((item, index) => (
                      <div key={index} className="card p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            item.status === 'pass' ? 'bg-green-500' :
                            item.status === 'warning' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} />
                          <div className="flex-1">
                            <div className="body-sm font-medium text-neutral-200 capitalize">
                              {item.category}
                            </div>
                            {item.note && (
                              <div className="muted mt-1">{item.note}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClipboardCheck size={32} className="mx-auto mb-3 text-neutral-600" />
                    <p className="body-sm text-neutral-400 mb-1">No quality report</p>
                    <p className="muted">Quality assessment will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};