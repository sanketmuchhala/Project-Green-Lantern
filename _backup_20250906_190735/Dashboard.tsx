import { useEffect, useMemo, useState } from "react";
import { getRecent } from "./db";
import { summarize } from "./kpis";
import { KPI, Table } from "./components/Cards";
import { LineChart, BarStack, DoughnutChart, ScatterChart, Gauge } from "./components/Charts";
import { byDay, sumByDay, modelRollup } from "./analytics";
import { hallucinationRisk } from "./hallucination";
import { estimateCost } from "./pricing";

export default function PromptScopeDashboard() {
  const [rows, setRows] = useState<any[]>([]);
  const [sum, setSum] = useState<any | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'events'>('dashboard');

  useEffect(() => {
    (async () => {
      const r = await getRecent(2000);
      for (const e of r) {
        const h = hallucinationRisk(e);
        e._riskScore = h.score;
        e._riskBand = h.band;
        e._cost_est = estimateCost(e.provider || '', e.model || '', e.usage?.prompt_tokens, e.usage?.completion_tokens, e.usage?.total_tokens);
        const helpful = ((e.quality?.user_rating ?? 0) >= 4) || ((e.quality?.judge_score ?? 0) >= 0.75) ? 1 : 0;
        const refusal = e.result?.status === "refusal" ? 1 : 0;
        const p95Target = 5000;
        const lat = Number(e.timing?.latency_ms || 0);
        const latency_norm = 1 - Math.min(lat / p95Target, 1);
        const pt = Number(e.usage?.prompt_tokens || 0);
        const tt = Number(e.usage?.total_tokens || 0);
        const cost_eff = tt ? 1 - Math.min(pt / tt, 1) : 0.5;
        e._pqs = 0.35 * helpful + 0.15 * (1 - refusal) + 0.15 * latency_norm + 0.15 * cost_eff + 0.20 * (e.quality?.judge_score || 0);
      }
      setRows(r);
      setSum(summarize(r));
    })();
  }, []);

  const mainKpis = useMemo(() => {
    if (!sum) return [];
    return [
      { label: "Total Calls", value: sum.calls, unit: '' },
      { label: "Helpful Rate", value: sum.helpful_rate * 100, unit: '%' },
      { label: "p95 Latency", value: sum.p95_latency, unit: 'ms' },
      { label: "Avg Cost/100", value: sum.cost_per_100, unit: '$' },
    ];
  }, [sum]);

  const latSeries = useMemo(() => {
    const d = byDay(rows, (e: any) => Number((e.timing?.latency_ms as string) || 0));
    return { labels: d.map(x => x.day as string), p50: d.map(x => x.p50), p95: d.map(x => x.p95) };
  }, [rows]);

  const tokenSeries = useMemo(() => {
    const dPrompt = sumByDay(rows, (e) => Number(e.usage?.prompt_tokens || 0));
    const dOut = sumByDay(rows, (e) => Number(e.usage?.completion_tokens || 0));
    const idx = Array.from(new Set([...dPrompt.map(x => x.day), ...dOut.map(x => x.day)])).sort();
    const mapP = Object.fromEntries(dPrompt.map(x => [x.day, x.total]));
    const mapO = Object.fromEntries(dOut.map(x => [x.day, x.total]));
    return { labels: idx, prompt: idx.map(day => mapP[day] || 0), output: idx.map(day => mapO[day] || 0) };
  }, [rows]);

  const outcomes = useMemo(() => {
    const ok = rows.filter(e => e.result?.status !== "error" && e.result?.status !== "refusal").length;
    const ref = rows.filter(e => e.result?.status === "refusal").length;
    const err = rows.filter(e => e.result?.status === "error").length;
    return { labels: ["OK", "Refusal", "Error"], values: [ok, ref, err] };
  }, [rows]);

  const riskBands = useMemo(() => {
      const low = rows.filter(e => e._riskBand === "Low").length;
      const med = rows.filter(e => e._riskBand === "Medium").length;
      const high = rows.filter(e => e._riskBand === "High").length;
      return { low, med, high, total: rows.length };
  }, [rows]);

  const modelCompareData = useMemo(() => modelRollup(rows), [rows]);

  return (
    <div className="mx-auto max-w-screen-2xl p-4 sm:p-6 bg-neutral-950 text-neutral-200 font-sans">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-bold text-white">PromptScope Dashboard</h1>
          <p className="text-neutral-400">Analytics for your LLM interactions.</p>
        </div>
        <div className="flex gap-2 sm:gap-4 flex-shrink-0">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
              activeView === 'dashboard' 
                ? 'bg-blue-600 text-white' 
                : 'text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveView('events')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
              activeView === 'events' 
                ? 'bg-blue-600 text-white' 
                : 'text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800'
            }`}
          >
            All Events
          </button>
        </div>
      </header>

      {activeView === 'dashboard' ? (
        <>
          {/* Main KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {mainKpis.map(kpi => <KPI key={kpi.label} label={kpi.label} value={kpi.value} suffix={kpi.unit} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-neutral-900 rounded-xl"><h3 className="text-lg font-semibold mb-2">Latency Trend (ms)</h3><LineChart labels={latSeries.labels} series={[{ label: "p50", data: latSeries.p50 }, { label: "p95", data: latSeries.p95 }]} /></div>
                <div className="p-4 bg-neutral-900 rounded-xl"><h3 className="text-lg font-semibold mb-2">Tokens by Day</h3><BarStack labels={tokenSeries.labels} stacks={[{ label: "Prompt", data: tokenSeries.prompt }, { label: "Output", data: tokenSeries.output }]} /></div>
              </div>
              <div className="p-4 bg-neutral-900 rounded-xl">
                <h3 className="text-lg font-semibold mb-2">Model Performance (Quality vs. Cost)</h3>
                <ScatterChart points={modelCompareData.map(r => ({ x: r.avg_cost, y: r.avg_pqs, r: Math.log(r.N + 1) * 4, label: r.model, series: r.model }))} seriesKey="series" />
              </div>
            </div>

            {/* Right Column (Sidebar) */}
            <div className="space-y-6">
              <div className="p-4 bg-neutral-900 rounded-xl">
                <h3 className="text-lg font-semibold mb-2">Hallucination Risk</h3>
                <div className="grid grid-cols-3 gap-2">
                    <Gauge value={riskBands.low} max={riskBands.total} label="Low" unit=" events" />
                    <Gauge value={riskBands.med} max={riskBands.total} label="Medium" unit=" events" />
                    <Gauge value={riskBands.high} max={riskBands.total} label="High" unit=" events" />
                </div>
              </div>
              <div className="p-4 bg-neutral-900 rounded-xl">
                <h3 className="text-lg font-semibold mb-2">Outcome Mix</h3>
                <DoughnutChart labels={outcomes.labels} values={outcomes.values} />
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Events View */
        <div className="p-4 bg-neutral-900 rounded-xl">
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            <Table
              rows={rows}
              cols={[
                { key: "ts", label: "Time" },
                { key: "provider", label: "Provider" },
                { key: "model", label: "Model" },
                { key: "status", label: "Status", fmt: (_, r) => String(r?.result?.status || "ok") },
                { key: "latency", label: "Latency (ms)", fmt: (_, r) => String(r?.timing?.latency_ms || "") },
                { key: "tokens", label: "Tokens", fmt: (_, r) => String(r?.usage?.total_tokens || "") },
                { key: "risk", label: "Risk", fmt: (_, r) => String(r?._riskBand || "") },
                { key: "pqs", label: "PQS", fmt: (_, r) => r._pqs.toFixed(2) },
                { key: "cost", label: "Cost ($)", fmt: (_, r) => r._cost_est ? r._cost_est.toFixed(4) : '' },
                { key: "prompt_chars", label: "Prompt Chars", fmt: (_, r) => r.prompt?.prompt_chars || '' },
                { key: "user_rating", label: "User Rating", fmt: (_, r) => r.quality?.user_rating ? `${r.quality.user_rating}/5` : '-' },
                { key: "judge_score", label: "Judge Score", fmt: (_, r) => r.quality?.judge_score ? r.quality.judge_score.toFixed(2) : '-' },
                { key: "guard_triggered", label: "Guard Triggered", fmt: (_, r) => r.safety?.guard_triggered !== undefined ? (r.safety.guard_triggered ? 'Yes' : 'No') : '-' },
                { key: "pii_blocked", label: "PII Blocked", fmt: (_, r) => r.safety?.pii_blocked ? 'Yes' : '-' },
                { key: "task", label: "Task", fmt: (_, r) => r.business?.task || '-' },
                { key: "ttft_ms", label: "TTFT (ms)", fmt: (_, r) => r.timing?.ttft_ms ? String(r.timing.ttft_ms) : '-' },
                { key: "tokens_per_s", label: "Tokens/s", fmt: (_, r) => r.runtime?.tokens_per_s ? r.runtime.tokens_per_s.toFixed(1) : '-' },
                { key: "vram_mb_peak", label: "VRAM (MB)", fmt: (_, r) => r.hardware?.vram_mb_peak ? String(r.hardware.vram_mb_peak) : '-' },
                { key: "gpu_util_pct", label: "GPU Util (%)", fmt: (_, r) => r.hardware?.gpu_util_pct ? `${r.hardware.gpu_util_pct}%` : '-' },
              ]}
            />
          </div>
        </div>
      )}

      
    </div>
  );
}
