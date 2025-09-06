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
  const pts = useMemo(() => rows.map(e => ({
    x: new Date(e.ts).getTime(),
    y: Number(e?.timing?.latency_ms || 0)
  })).filter(p => p.y > 0), [rows]);

  const ttft = useMemo(() => rows.map(e => ({
    x: new Date(e.ts).getTime(),
    y: Number(e?.timing?.ttft_ms || 0)
  })).filter(p => p.y > 0), [rows]);

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-700 p-4">
      <div className="text-neutral-100 font-semibold mb-2">Event Latency Timeline</div>
      <div className="text-neutral-300 text-sm mb-4">Each prompt plotted by latency - {pts.length} events</div>
      <div style={{ height: '300px' }}>
        <Scatter 
          data={{ 
            datasets: [
              { 
                label: "Latency (ms)", 
                data: pts,
                backgroundColor: "rgba(59, 130, 246, 0.7)",
                borderColor: "rgba(59, 130, 246, 1)",
                pointRadius: 4
              },
              { 
                label: "TTFT (ms)", 
                data: ttft,
                backgroundColor: "rgba(16, 185, 129, 0.7)",
                borderColor: "rgba(16, 185, 129, 1)",
                pointRadius: 3
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
                ticks: { color: "#d1d5db" }, 
                grid: { color: "rgba(120,120,120,0.2)" },
                title: {
                  display: true,
                  text: 'Milliseconds',
                  color: "#d1d5db"
                }
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
                bodyColor: '#fff'
              }
            }
          }}
        />
      </div>
    </div>
  );
}