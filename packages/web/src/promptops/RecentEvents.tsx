import { useEffect, useState } from "react";
import { getRecent } from "./db";
import { Table } from "./components/Cards";

export default function RecentEventsPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const r = await getRecent(5000); // Fetch more events for this dedicated page
      setRows(r);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-screen-2xl p-4 sm:p-6 bg-neutral-950 text-neutral-200 font-sans">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Recent Prompt Events</h1>
        <p className="text-neutral-400">Detailed log of your LLM interactions.</p>
      </header>

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
              { key: "user_rating", label: "User Rating", fmt: (_, r) => r.quality?.user_rating || '' },
              { key: "judge_score", label: "Judge Score", fmt: (_, r) => r.quality?.judge_score ? r.quality.judge_score.toFixed(2) : '' },
              { key: "guard_triggered", label: "Guard Triggered", fmt: (_, r) => r.safety?.guard_triggered ? 'Yes' : 'No' },
              { key: "pii_blocked", label: "PII Blocked", fmt: (_, r) => r.safety?.pii_blocked || '' },
              { key: "task", label: "Task", fmt: (_, r) => r.business?.task || '' },
              { key: "ttft_ms", label: "TTFT (ms)", fmt: (_, r) => r.timing?.ttft_ms || '' },
              { key: "tokens_per_s", label: "Tokens/s", fmt: (_, r) => r.runtime?.tokens_per_s ? r.runtime.tokens_per_s.toFixed(2) : '' },
              { key: "vram_mb_peak", label: "VRAM (MB)", fmt: (_, r) => r.hardware?.vram_mb_peak || '' },
              { key: "gpu_util_pct", label: "GPU Util (%)", fmt: (_, r) => r.hardware?.gpu_util_pct || '' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
