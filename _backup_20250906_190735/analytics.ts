import { p50, p95 } from "./kpis";

export function byDay(events:any[], field:(e:any)=>number|undefined){
  const map = new Map<string, number[]>();
  for(const e of events){
    const d = (e.ts as string || "").slice(0,10);
    const v = field(e);
    if(v==null||isNaN(Number(v))) continue;
    if(!map.has(d)) map.set(d, []);
    map.get(d)!.push(Number(v));
  }
  return Array.from(map.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([day,vals])=>({ day, p50:p50(vals), p95:p95(vals), sum: vals.reduce((s,v)=>s+v,0), avg: vals.reduce((s,v)=>s+v,0)/vals.length }));
}

export function sumByDay(events:any[], val:(e:any)=>number|undefined){
  const map = new Map<string, number>();
  for(const e of events){
    const d = (e.ts as string || "").slice(0,10);
    const v = Number(val(e)||0);
    if(!map.has(d)) map.set(d, 0);
    map.set(d, map.get(d)! + v);
  }
  return Array.from(map.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([day,total])=>({ day, total }));
}

export function modelRollup(events:any[]){
  const map = new Map<string, any[]>();
  for(const e of events){
    const key = `${e.provider||"?"}:${e.model||"?"}`;
    if(!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).map(([model, rows])=>{
    const N = rows.length;
    const helpful = rows.filter(r => (r.quality?.user_rating>=4)||(r.quality?.judge_score>=0.75)).length;
    const refusals = rows.filter(r => r.result?.status==="refusal").length;
    const errors = rows.filter(r => r.result?.status==="error").length;
    const lat = rows.map(r => Number(r.timing?.latency_ms||0)).filter(Boolean);
    const totalTok = rows.map(r => Number(r.usage?.total_tokens||0)).filter(Boolean);
    const promptTok = rows.map(r => Number(r.usage?.prompt_tokens||0)).filter(Boolean);
    const cost = rows.map(r => Number(r._cost_est||0));
    const pq = rows.map(r => Number(r._pqs||0));
    return {
      model, N,
      helpful_rate: N? helpful/N:0,
      refusal_rate: N? refusals/N:0,
      error_rate: N? errors/N:0,
      p95_latency: p95(lat),
      avg_tokens: avg(totalTok),
      avg_bloat: avg(totalTok.map((t,i)=> t? (promptTok[i]/t):0)),
      avg_cost: avg(cost),
      avg_pqs: avg(pq)
    };
  }).sort((a,b)=> (b.avg_pqs - a.avg_pqs) || (a.avg_cost - b.avg_cost));
}
function avg(a:number[]){ if(!a.length) return 0; return a.reduce((s,v)=>s+v,0)/a.length; }
