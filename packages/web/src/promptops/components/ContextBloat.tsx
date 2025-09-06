import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  Tooltip, 
  Legend, 
  TimeScale 
} from "chart.js";
import 'chartjs-adapter-date-fns';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale);

export default function ContextBloat({ rows }: { rows: any[] }) {
  const data = useMemo(() => {
    // Calculate context bloat (prompt_tokens / total_tokens) over time
    const points = rows
      .filter(e => e.ts && e.usage?.prompt_tokens && e.usage?.total_tokens)
      .map(e => {
        const promptTokens = Number(e.usage.prompt_tokens);
        const totalTokens = Number(e.usage.total_tokens);
        const bloatRatio = totalTokens > 0 ? (promptTokens / totalTokens) * 100 : 0;
        
        return {
          x: new Date(e.ts).getTime(),
          y: bloatRatio,
          provider: e.provider || 'unknown',
          model: e.model || 'unknown',
          promptTokens,
          totalTokens
        };
      })
      .sort((a, b) => a.x - b.x);

    return points;
  }, [rows]);

  const avgBloat = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, point) => acc + point.y, 0);
    return (sum / data.length).toFixed(1);
  }, [data]);

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-700 p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="text-neutral-100 font-semibold">Context Bloat Trend</div>
        <div className="text-neutral-400 text-sm">Avg: {avgBloat}%</div>
      </div>
      <div className="text-neutral-300 text-sm mb-4">
        Prompt tokens as % of total tokens - lower is more efficient
      </div>
      <div style={{ height: '250px' }}>
        <Line 
          data={{ 
            datasets: [
              { 
                label: "Context Bloat %", 
                data: data,
                borderColor: "rgba(239, 68, 68, 1)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                pointBackgroundColor: "rgba(239, 68, 68, 0.8)",
                pointRadius: 3,
                tension: 0.2,
                fill: true
              }
            ]
          }} 
          options={{ 
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
              x: { 
                type: 'time',
                ticks: { color: "#d1d5db" }, 
                grid: { color: "rgba(120,120,120,0.2)" },
                title: {
                  display: true,
                  text: 'Time',
                  color: "#d1d5db"
                }
              }, 
              y: { 
                ticks: { 
                  color: "#d1d5db",
                  callback: function(value) {
                    return value + '%';
                  }
                }, 
                grid: { color: "rgba(120,120,120,0.2)" },
                title: {
                  display: true,
                  text: 'Context Bloat %',
                  color: "#d1d5db"
                },
                min: 0,
                max: 100
              } 
            }, 
            plugins: { 
              legend: { 
                labels: { color: "#d1d5db" } 
              },
              tooltip: {
                mode: 'point',
                intersect: false,
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                callbacks: {
                  title: function(context: any) {
                    return new Date(context[0].parsed.x).toLocaleString();
                  },
                  label: function(context: any) {
                    const point = context.dataset.data[context.dataIndex];
                    return [
                      `Context Bloat: ${context.parsed.y.toFixed(1)}%`,
                      `Prompt: ${point.promptTokens} tokens`,
                      `Total: ${point.totalTokens} tokens`,
                      `Provider: ${point.provider}/${point.model}`
                    ];
                  }
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
}