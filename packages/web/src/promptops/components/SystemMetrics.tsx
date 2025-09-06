import React, { useState, useEffect } from "react";

interface SystemMetrics {
  host: {
    cpus: number;
    load1: number;
    load5: number;
    load15: number;
    total: number;
    free: number;
    rss: number;
  };
  ollama: {
    reachable: boolean;
    ps?: { models: any[] };
    tags?: { models: any[] };
    error?: string;
  };
}

export default function SystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/v1/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(1) + ' GB';
  };

  const formatLoad = (load: number) => load.toFixed(2);

  if (loading) {
    return (
      <div className="rounded-2xl bg-neutral-900 border border-neutral-700 p-4">
        <div className="text-neutral-100 font-semibold mb-2">System Metrics</div>
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-neutral-900 border border-neutral-700 p-4">
        <div className="text-neutral-100 font-semibold mb-2">System Metrics</div>
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!metrics) return null;

  const memoryUsage = ((metrics.host.total - metrics.host.free) / metrics.host.total) * 100;
  
  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-700 p-4">
      <div className="text-neutral-100 font-semibold mb-2">System Metrics</div>
      <div className="text-neutral-300 text-sm mb-4">Real-time system and Ollama status</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* System Resources */}
        <div className="space-y-3">
          <div className="text-neutral-200 font-medium text-sm">System Resources</div>
          
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 text-sm">CPUs</span>
            <span className="text-neutral-200 text-sm">{metrics.host.cpus} cores</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 text-sm">Memory</span>
            <span className="text-neutral-200 text-sm">
              {formatBytes(metrics.host.total - metrics.host.free)} / {formatBytes(metrics.host.total)} 
              <span className="ml-1 text-xs text-neutral-500">({memoryUsage.toFixed(1)}%)</span>
            </span>
          </div>
          
          <div className="w-full bg-neutral-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                memoryUsage > 80 ? 'bg-red-500' : 
                memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${memoryUsage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 text-sm">Process RSS</span>
            <span className="text-neutral-200 text-sm">{formatBytes(metrics.host.rss)}</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 text-sm">Load Avg (1m)</span>
              <span className="text-neutral-200 text-sm">{formatLoad(metrics.host.load1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 text-sm">Load Avg (5m)</span>
              <span className="text-neutral-200 text-sm">{formatLoad(metrics.host.load5)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 text-sm">Load Avg (15m)</span>
              <span className="text-neutral-200 text-sm">{formatLoad(metrics.host.load15)}</span>
            </div>
          </div>
        </div>

        {/* Ollama Status */}
        <div className="space-y-3">
          <div className="text-neutral-200 font-medium text-sm">Ollama Status</div>
          
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 text-sm">Connection</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                metrics.ollama.reachable ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-neutral-200 text-sm">
                {metrics.ollama.reachable ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          {metrics.ollama.reachable ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Running Models</span>
                <span className="text-neutral-200 text-sm">
                  {metrics.ollama.ps?.models?.length || 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Installed Models</span>
                <span className="text-neutral-200 text-sm">
                  {metrics.ollama.tags?.models?.length || 0}
                </span>
              </div>
              
              {metrics.ollama.ps?.models && metrics.ollama.ps.models.length > 0 && (
                <div className="mt-2">
                  <div className="text-neutral-400 text-xs mb-1">Currently Running:</div>
                  {metrics.ollama.ps.models.map((model: any, i: number) => (
                    <div key={i} className="text-neutral-300 text-xs ml-2">
                      • {model.name || model.model || 'Unknown'}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-red-400 text-sm">
              {metrics.ollama.error || 'Unable to connect to Ollama server'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}