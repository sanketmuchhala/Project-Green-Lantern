export type RiskBand = "Low"|"Medium"|"High";
export function hallucinationRisk(e:any): {score:number, band:RiskBand}{
  let s = 0.2;
  const judge = Number(e.quality?.judge_score);
  const rating = Number(e.quality?.user_rating);
  if (!isNaN(judge) && judge < 0.6) s += 0.3;
  if (!isNaN(rating) && rating <= 2) s += 0.3;
  const pt = Number(e.usage?.prompt_tokens||0);
  const tt = Number(e.usage?.total_tokens||0);
  const bloat = tt ? pt/tt : 0;
  if (bloat > 0.7) s += 0.2;
  const outT = Number(e.usage?.completion_tokens||0);
  if (tt && outT > pt*2.0) s += 0.1;  // over-generation
  // naive re-ask heuristic: consecutive events with same session and similar prompt size handled in dashboard aggregation
  s = Math.max(0, Math.min(1, s));
  const band:RiskBand = s >= 0.7 ? "High" : s >= 0.4 ? "Medium" : "Low";
  return {score:s, band};
}
