// ADD-ONLY: robust turn instrumentation for both streamed and non-streamed flows
import { logTurn } from "./logger";

export type TurnCtx = {
  corr_id: string;
  session_id?: string;
  provider: string;
  model: string;
  settings?: any;
  business?: any;
};

export function startTurn(ctx: TurnCtx) {
  const t0 = performance.now();
  let tFirst: number | undefined;

  function markFirstToken() { 
    if (tFirst == null) tFirst = performance.now(); 
  }

  async function endOk(extra: {
    usage?: any;
    safety?: any;
    quality?: any;
    prompt?: any;
  } = {}) {
    const t1 = performance.now();
    await logTurn({
      ts: new Date().toISOString(),
      corr_id: ctx.corr_id,
      session_id: ctx.session_id,
      provider: ctx.provider,
      model: ctx.model,
      settings: ctx.settings,
      business: ctx.business,
      prompt: extra.prompt,
      usage: extra.usage,
      safety: extra.safety,
      quality: extra.quality,
      timing: {
        latency_ms: Math.round(t1 - t0),
        ...(tFirst ? { ttft_ms: Math.round(tFirst - t0) } : {})
      },
      result: { status: "ok" }
    });
  }

  async function endError(err: any, extra: { prompt?: any } = {}) {
    const t1 = performance.now();
    await logTurn({
      ts: new Date().toISOString(),
      corr_id: ctx.corr_id,
      session_id: ctx.session_id,
      provider: ctx.provider,
      model: ctx.model,
      settings: ctx.settings,
      business: ctx.business,
      prompt: extra.prompt,
      timing: { latency_ms: Math.round(t1 - t0) },
      result: { status: "error" }
    });
  }

  return { markFirstToken, endOk, endError };
}