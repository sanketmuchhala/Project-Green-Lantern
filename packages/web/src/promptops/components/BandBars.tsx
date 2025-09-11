import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { bandsLatency } from "../metrics";

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function BandBars({ rows }: { rows: any[] }) {
  const bandCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of rows) {
      const ms = Number(e?.timing?.latency_ms || 0);
      if (!ms) continue;
      const b = bandsLatency(ms);
      map.set(b, (map.get(b) || 0) + 1);
    }
    return ["≤1s", "1–3s", "3–5s", ">5s"].map(k => ({ band: k, v: map.get(k) || 0 }));
  }, [rows]);

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-700 p-4 h-full">
      <div className="text-neutral-300 text-sm mb-2">Latency Bands</div>
      <div style={{ height: 'calc(100% - 2rem)' }}>
        <Bar 
          data={{ 
            labels: bandCounts.map(x => x.band), 
            datasets: [{ 
              label: "Count", 
              data: bandCounts.map(x => x.v),
              backgroundColor: [
                "rgba(34, 197, 94, 0.8)",   // ≤1s - green
                "rgba(59, 130, 246, 0.8)",  // 1-3s - blue 
                "rgba(245, 158, 11, 0.8)",  // 3-5s - amber
                "rgba(239, 68, 68, 0.8)"    // >5s - red
              ],
              borderColor: [
                "rgba(34, 197, 94, 1)",
                "rgba(59, 130, 246, 1)", 
                "rgba(245, 158, 11, 1)",
                "rgba(239, 68, 68, 1)"
              ],
              borderWidth: 1
            }] 
          }}
          options={{ 
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { 
                display: false 
              },
              tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#fff'
              }
            }, 
            scales: { 
              x: { 
                ticks: { color: "#d1d5db", font: { size: 11 } }, 
                grid: { color: "rgba(120,120,120,0.2)" }
              }, 
              y: { 
                ticks: { color: "#d1d5db", font: { size: 11 } }, 
                grid: { color: "rgba(120,120,120,0.2)" }
              } 
            } 
          }}
        />
      </div>
    </div>
  );
}