import Dexie, { Table } from "dexie";
export interface PromptEvent {
  id?: number;
  ts: string | undefined;
  corr_id: string;
  session_id?: string;
  provider?: string;
  model?: string;
  settings?: any;
  prompt?: { system_tokens?: number, user_tokens?: number, retrieved_tokens?: number, prompt_chars?: number };
  usage?: { prompt_tokens?: number, completion_tokens?: number, total_tokens?: number };
  timing?: { ttft_ms?: number, latency_ms?: number };
  result?: { status: "ok"|"error"|"refusal", http?: number };
  safety?: { guard_triggered?: boolean, pii_blocked?: number };
  quality?: { user_rating?: number, judge_score?: number };
  business?: { task?: string };
  runtime?: { server?: string, queue_ms?: number, prefill_ms?: number, decode_ms?: number, tokens_per_s?: number };
  sampling?: any;
  token_timestamps_ms?: number[];
  kv_cache?: any;
  hardware?: any;
  energy?: any;
  _riskScore?: number;
  _riskBand?: string;
  _pqs?: number;
  _cost_est?: number;
}
export class PromptOpsDB extends Dexie {
  events!: Table<PromptEvent, number>;
  constructor() {
    super("promptops_db_v1");
    this.version(1).stores({
      events: "++id, ts, corr_id, provider, model"
    });
  }
}
export const promptOpsDB = new PromptOpsDB();
export async function logEvent(e: PromptEvent) {
  try { await promptOpsDB.events.add(e); } catch {}
}
export async function getRecent(limit=500) {
  return promptOpsDB.events.orderBy("id").reverse().limit(limit).toArray();
}
