type Price = { inputPerMTok?: number; outputPerMTok?: number; bothPerMTok?: number };
export const PRICES: Record<string, Price> = {
  "openai:gpt-4o-mini": { bothPerMTok: 0.15 },
  "openai:gpt-4.1-mini": { bothPerMTok: 0.3 },
  "anthropic:claude-3-7-sonnet": { inputPerMTok: 3, outputPerMTok: 15 },
  "anthropic:claude-3-5-sonnet": { inputPerMTok: 3, outputPerMTok: 15 },
  "anthropic:claude-3-haiku": { inputPerMTok: 0.25, outputPerMTok: 1.25 },
  "gemini:gemini-1.5-pro": { bothPerMTok: 3 },
  "gemini:gemini-1.5-flash": { bothPerMTok: 0.35 },
  "deepseek:deepseek-chat": { bothPerMTok: 0.27 },
  "deepseek:deepseek-reasoner": { bothPerMTok: 0.55 }
};
export function estimateCost(provider:string, model:string, prompt_tokens?:number, completion_tokens?:number, total_tokens?:number) {
  const k = `${provider}:${model}`;
  const p = PRICES[k]; if (!p) return 0;
  const inTok = prompt_tokens ?? (total_tokens ? Math.round(total_tokens*0.6):0);
  const outTok = completion_tokens ?? (total_tokens ? Math.max(total_tokens - inTok, 0):0);
  if (p.bothPerMTok != null) return (inTok + outTok) * (p.bothPerMTok/1_000_000);
  const inCost = (p.inputPerMTok??0) / 1_000_000 * inTok;
  const outCost = (p.outputPerMTok??0) / 1_000_000 * outTok;
  return inCost + outCost;
}
