import { estimateCost } from "./pricing";
export function p50(values:number[]) { if (!values.length) return 0; const s=[...values].sort((a,b)=>a-b); const i=Math.floor(0.5*(s.length-1)); return s[i]; }
export function p95(values:number[]) { if (!values.length) return 0; const s=[...values].sort((a,b)=>a-b); const i=Math.floor(0.95*(s.length-1)); return s[i]; }
export function summarize(events:any[]) {
  const N = events.length;
  const helpful = events.filter(e => (e.quality?.user_rating>=4)||(e.quality?.judge_score>=0.75)).length;
  const refusals = events.filter(e => e.result?.status==="refusal").length;
  const errors = events.filter(e => e.result?.status==="error").length;
  const lat = events.map((e:any) => Number(e.timing?.latency_ms||0)).filter(Boolean);
  const ttft = events.map((e:any) => Number(e.timing?.ttft_ms||0)).filter(Boolean);
  const promptT = events.map((e:any) => Number(e.usage?.prompt_tokens||0));
  const outT = events.map((e:any) => Number(e.usage?.completion_tokens||0));
  const totalT = events.map((e:any) => Number(e.usage?.total_tokens||((e.usage?.prompt_tokens||0)+(e.usage?.completion_tokens||0))));
  const costs = events.map((e:any) => estimateCost(e.provider,e.model,e.usage?.prompt_tokens,e.usage?.completion_tokens,e.usage?.total_tokens));
  const bloat = totalT.map((t:number,i:number)=> t? (promptT[i]/t):0).filter((x:number)=>!isNaN(x));
  return {
    calls: N,
    helpful_rate: N? helpful/N : 0,
    refusal_rate: N? refusals/N : 0,
    error_rate: N? errors/N : 0,
    p50_latency: p50(lat), p95_latency: p95(lat),
    p50_ttft: p50(ttft), p95_ttft: p95(ttft),
    avg_prompt_tokens: avg(promptT), avg_output_tokens: avg(outT), avg_total_tokens: avg(totalT),
    avg_bloat_ratio: avg(bloat),
    cost_per_100: 100*avg(costs)
  };
}
function avg(a:number[]){ if(!a.length) return 0; return a.reduce((s,v)=>s+v,0)/a.length; }
