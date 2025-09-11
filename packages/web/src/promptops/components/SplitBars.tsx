import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function SplitBars({ rows }: { rows: any[] }) {
  const days = useMemo(() => {
    const map = new Map<string, { plan: number, fetch: number, gen: number, count: number }>();
    
    for (const e of rows) {
      const d = (e.ts || "").slice(0, 10);
      if (!d) continue;
      
      const plan = Number(e.retrieval?.q_plan_ms || 0);
      const fetch = Number(e.retrieval?.fetch_ms || 0);
      const totalLatency = Number(e.timing?.latency_ms || 0);
      const gen = Math.max(totalLatency - (plan + fetch), 0);
      
      const cur = map.get(d) || { plan: 0, fetch: 0, gen: 0, count: 0 };
      map.set(d, { 
        plan: cur.plan + plan, 
        fetch: cur.fetch + fetch, 
        gen: cur.gen + gen,
        count: cur.count + 1
      });
    }
    
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({
        day,
        plan: v.count > 0 ? Math.round(v.plan / v.count) : 0,
        fetch: v.count > 0 ? Math.round(v.fetch / v.count) : 0,  
        gen: v.count > 0 ? Math.round(v.gen / v.count) : 0
      }));
  }, [rows]);

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-700 p-4 h-full">
      <div className="text-neutral-300 text-sm mb-2">Avg Time Split (Plan / Fetch / Generate)</div>
      <div style={{ height: 'calc(100% - 2rem)' }}>
        <Bar 
          data={{ 
            labels: days.map(x => x.day), 
            datasets: [
              { 
                label: "Plan", 
                data: days.map(x => x.plan), 
                stack: "s",
                backgroundColor: "rgba(168, 85, 247, 0.8)",
                borderColor: "rgba(168, 85, 247, 1)",
                borderWidth: 1
              },
              { 
                label: "Fetch", 
                data: days.map(x => x.fetch), 
                stack: "s",
                backgroundColor: "rgba(59, 130, 246, 0.8)",
                borderColor: "rgba(59, 130, 246, 1)", 
                borderWidth: 1
              },
              { 
                label: "Generate", 
                data: days.map(x => x.gen), 
                stack: "s",
                backgroundColor: "rgba(34, 197, 94, 0.8)",
                borderColor: "rgba(34, 197, 94, 1)",
                borderWidth: 1
              }
            ]
          }}
          options={{ 
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { 
                labels: { color: "#d1d5db", font: { size: 10 } }
              },
              tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                callbacks: {
                  label: function(context: any) {
                    return `${context.dataset.label}: ${context.parsed.y}ms`;
                  }
                }
              }
            },
            scales: { 
              x: { 
                stacked: true, 
                ticks: { color: "#d1d5db", font: { size: 10 } }, 
                grid: { color: "rgba(120,120,120,0.2)" }
              },
              y: { 
                stacked: true, 
                ticks: { color: "#d1d5db", font: { size: 10 } }, 
                grid: { color: "rgba(120,120,120,0.2)" },
                title: {
                  display: true,
                  text: 'Milliseconds',
                  color: '#d1d5db',
                  font: { size: 10 }
                }
              } 
            } 
          }}
        />
      </div>
    </div>
  );
}