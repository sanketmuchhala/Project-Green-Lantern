import React, { useMemo } from "react";
import { Scatter } from "react-chartjs-2";
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  Tooltip, 
  Legend, 
  TimeScale 
} from "chart.js";
import 'chartjs-adapter-date-fns';

Chart.register(CategoryScale, LinearScale, PointElement, Tooltip, Legend, TimeScale);

export default function EventLatency({ rows }: { rows: any[] }) {
  // Include all events, even with zero latency for better visibility
  const pts = useMemo(() => rows
    .filter(e => e.ts && (e?.timing?.latency_ms != null || e?.latency_ms != null))
    .map(e => ({
      x: new Date(e.ts).getTime(),
      y: Math.max(Number(e?.timing?.latency_ms || e?.latency_ms || 0), 1), // Minimum 1ms for visibility
      provider: e.provider || 'unknown',
      model: e.model || 'unknown'
    })), [rows]);

  const ttft = useMemo(() => rows
    .filter(e => e.ts && (e?.timing?.ttft_ms != null || e?.ttft_ms != null))
    .map(e => ({
      x: new Date(e.ts).getTime(),
      y: Math.max(Number(e?.timing?.ttft_ms || e?.ttft_ms || 0), 1), // Minimum 1ms for visibility
      provider: e.provider || 'unknown',
      model: e.model || 'unknown'
    })), [rows]);

  return (
    <div className="w-full h-full">
      <Scatter 
        data={{ 
          datasets: [
            { 
              label: "Latency (ms)", 
              data: pts,
              backgroundColor: "rgba(59, 130, 246, 0.7)",
              borderColor: "rgba(59, 130, 246, 1)",
              pointRadius: 3
            },
            { 
              label: "TTFT (ms)", 
              data: ttft,
              backgroundColor: "rgba(16, 185, 129, 0.7)",
              borderColor: "rgba(16, 185, 129, 1)",
              pointRadius: 2
            }
          ]
        }} 
        options={{ 
          responsive: true,
          maintainAspectRatio: false,
          scales: { 
            x: { 
              type: 'time',
              ticks: { color: "#d1d5db", font: { size: 10 } }, 
              grid: { color: "rgba(120,120,120,0.2)" }
            }, 
            y: { 
              ticks: { color: "#d1d5db", font: { size: 10 } }, 
              grid: { color: "rgba(120,120,120,0.2)" }
            } 
          }, 
          plugins: { 
            legend: { 
              labels: { color: "#d1d5db", font: { size: 11 } } 
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
                  return `${context.dataset.label}: ${context.parsed.y}ms${point?.provider ? ` (${point.provider}/${point.model})` : ''}`;
                }
              }
            }
          }
        }}
      />
    </div>
  );
}