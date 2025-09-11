import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from './ui';

interface DiagnosticResult {
  name: string;
  status: 'pending' | 'pass' | 'fail' | 'warning';
  message?: string;
  latency?: number;
}

export const LocalDiagnostics: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([
    { name: 'Ollama Server Connection', status: 'pending' },
    { name: 'Model List Fetch', status: 'pending' },
    { name: 'Tiny Chat Test', status: 'pending' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [baseURL, setBaseURL] = useState('http://localhost:11434');

  const updateResult = (index: number, update: Partial<DiagnosticResult>) => {
    setResults(prev => prev.map((result, i) => 
      i === index ? { ...result, ...update } : result
    ));
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    
    // Reset all to pending
    setResults(prev => prev.map(r => ({ ...r, status: 'pending' as const, message: undefined, latency: undefined })));

    // Test 1: Ollama Server Connection
    try {
      const start = Date.now();
      const response = await fetch(`/v1/ping?provider=local-ollama&baseURL=${encodeURIComponent(baseURL)}`);
      const result = await response.json();
      const latency = Date.now() - start;
      
      if (result.ok) {
        updateResult(0, { status: 'pass', message: 'Connected successfully', latency });
      } else {
        updateResult(0, { status: 'fail', message: result.error || 'Connection failed', latency });
        setIsRunning(false);
        return;
      }
    } catch (error) {
      updateResult(0, { status: 'fail', message: (error as Error).message });
      setIsRunning(false);
      return;
    }

    // Test 2: Model List Fetch
    try {
      const start = Date.now();
      const response = await fetch(`${baseURL}/api/tags`);
      const latency = Date.now() - start;
      
      if (response.ok) {
        const data = await response.json();
        const modelCount = data.models?.length || 0;
        updateResult(1, { 
          status: modelCount > 0 ? 'pass' : 'warning', 
          message: modelCount > 0 ? `Found ${modelCount} models` : 'No models found',
          latency 
        });
      } else {
        updateResult(1, { status: 'fail', message: `HTTP ${response.status}`, latency });
      }
    } catch (error) {
      updateResult(1, { status: 'fail', message: (error as Error).message });
    }

    // Test 3: Tiny Chat Test
    try {
      const start = Date.now();
      const response = await fetch(`${baseURL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma2:2b', // Ultra-light model to test
          messages: [{ role: 'user', content: 'hi' }],
          options: { 
            num_predict: 10,
            num_ctx: 512,
            num_thread: 2,
            temperature: 0.1
          },
          stream: false
        })
      });
      const latency = Date.now() - start;
      
      if (response.ok) {
        const data = await response.json();
        const hasResponse = data.message?.content?.length > 0;
        updateResult(2, { 
          status: hasResponse ? 'pass' : 'warning',
          message: hasResponse ? `Response received (${data.message.content.length} chars)` : 'Empty response',
          latency 
        });
      } else {
        const errorText = await response.text().catch(() => '');
        updateResult(2, { 
          status: 'fail', 
          message: `HTTP ${response.status}: ${errorText.slice(0, 100)}`,
          latency 
        });
      }
    } catch (error) {
      updateResult(2, { status: 'fail', message: (error as Error).message });
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="animate-spin text-neutral-400" size={16} />;
      case 'pass':
        return <CheckCircle className="text-green-400" size={16} />;
      case 'fail':
        return <XCircle className="text-red-400" size={16} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-400" size={16} />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-neutral-400';
      case 'pass':
        return 'text-green-400';
      case 'fail':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
    }
  };

  useEffect(() => {
    // Auto-run diagnostics on mount
    runDiagnostics();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-neutral-900 rounded-xl border border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-neutral-100">Local Ollama Diagnostics</h1>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="primary"
            size="sm"
          >
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-neutral-200">
            Ollama Base URL
          </label>
          <input
            type="text"
            value={baseURL}
            onChange={(e) => setBaseURL(e.target.value)}
            className="w-full p-3 bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="http://localhost:11434"
          />
        </div>

        <div className="space-y-4">
          {results.map((result) => (
            <div key={result.name} className="flex items-center gap-3 p-4 bg-neutral-800 rounded-lg">
              {getStatusIcon(result.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-100">{result.name}</span>
                  {result.latency && (
                    <span className="text-xs text-neutral-400">
                      {result.latency}ms
                    </span>
                  )}
                </div>
                {result.message && (
                  <div className={`text-sm mt-1 ${getStatusColor(result.status)}`}>
                    {result.message}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
          <h3 className="font-medium text-neutral-100 mb-2">Troubleshooting Tips</h3>
          <ul className="text-sm text-neutral-300 space-y-1">
            <li>• Start Ollama: <code className="bg-neutral-700 px-1 rounded">ollama serve</code></li>
            <li>• Pull ultra-light model: <code className="bg-neutral-700 px-1 rounded">ollama pull gemma2:2b</code></li>
            <li>• For M2 performance: Enable Performance Mode in Settings</li>
            <li>• Check if port 11434 is open and not blocked by firewall</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LocalDiagnostics;