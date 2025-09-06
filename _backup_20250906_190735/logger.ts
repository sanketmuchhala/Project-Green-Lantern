import { logEvent } from "./db";
export async function logTurn(opts:{
  corr_id:string; session_id?:string;
  provider?:string; model?:string; settings?:any;
  prompt?:{ system_tokens?: number, user_tokens?: number, retrieved_tokens?: number, prompt_chars?: number };
  usage?:{ prompt_tokens?: number, completion_tokens?: number, total_tokens?: number };
  timing?:{ ttft_ms?: number, latency_ms?: number };
  result?:{ status: "ok"|"error"|"refusal", http?: number };
  safety?:{ guard_triggered?: boolean, pii_blocked?: number };
  quality?:{ user_rating?: number, judge_score?: number };
  business?:{ task?: string };
  runtime?:{ server?: string, queue_ms?: number, prefill_ms?: number, decode_ms?: number, tokens_per_s?: number };
  sampling?:any; token_timestamps_ms?:number[]; kv_cache?:any; hardware?:any; energy?:any;
}){ const ts=new Date().toISOString(); await logEvent({ ts, ...opts }); }
