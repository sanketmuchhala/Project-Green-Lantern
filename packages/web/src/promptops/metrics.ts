export function pct(n: number, d: number): number {
  return d ? (n / d) : 0;
}

export function p50(a: number[]): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(0.50 * (s.length - 1))];
}

export function p95(a: number[]): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(0.95 * (s.length - 1))];
}

export function p99(a: number[]): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(0.99 * (s.length - 1))];
}

export function bandsLatency(ms: number): string {
  if (ms <= 1000) return "≤1s";
  if (ms <= 3000) return "1–3s";
  if (ms <= 5000) return "3–5s";
  return ">5s";
}

export function groundedness(events: any[]): number {
  let g = 0, n = 0;
  for (const e of events) {
    const web = !!e.retrieval?.web_enabled;
    const cites = (e.answer?.citations?.length || 0) >= 1 || /\[\d+\]/.test(e?.answer?.text || "");
    const multi = (e.answer?.citations?.length || 0) >= 2;
    const helpful = (e.quality?.user_rating >= 4) || (e.quality?.judge_score >= 0.75);
    let s = 0;
    if (web && multi) s = 1;
    else if (web && cites) s = 0.8;
    else if (helpful && (e.usage?.prompt_tokens || 0) < (e.usage?.total_tokens || 1) * 0.5) s = 0.5;
    g += s; 
    n++;
  }
  return n ? g / n : 0;
}

export function contextBloat(events: any[]): number {
  let totalBloat = 0, n = 0;
  for (const e of events) {
    const pt = Number(e.usage?.prompt_tokens || 0);
    const tt = Number(e.usage?.total_tokens || 0);
    if (tt > 0) {
      totalBloat += pt / tt;
      n++;
    }
  }
  return n ? totalBloat / n : 0;
}

export function errorRate(events: any[]): number {
  const errors = events.filter(e => e.result?.status === "error").length;
  return pct(errors, events.length);
}

export function refusalRate(events: any[]): number {
  const refusals = events.filter(e => e.result?.status === "refusal").length;
  return pct(refusals, events.length);
}

export function helpfulRate(events: any[]): number {
  const helpful = events.filter(e => 
    ((e.quality?.user_rating ?? 0) >= 4) || 
    ((e.quality?.judge_score ?? 0) >= 0.75)
  ).length;
  return pct(helpful, events.length);
}

export function slaBreaches(events: any[], thresholdMs: number = 5000): number {
  return events.filter(e => Number(e.timing?.latency_ms || 0) > thresholdMs).length;
}

export function avgCostPer100(events: any[]): number {
  const totalCost = events.reduce((sum, e) => sum + (e._cost_est || 0), 0);
  return events.length > 0 ? (totalCost / events.length) * 100 : 0;
}

export function avgTTFT(events: any[]): number {
  const ttfts = events.map(e => Number(e.timing?.ttft_ms || 0)).filter(t => t > 0);
  return ttfts.length > 0 ? ttfts.reduce((a, b) => a + b, 0) / ttfts.length : 0;
}

export function avgTotalTokens(events: any[]): number {
  const tokens = events.map(e => Number(e.usage?.total_tokens || 0)).filter(t => t > 0);
  return tokens.length > 0 ? tokens.reduce((a, b) => a + b, 0) / tokens.length : 0;
}