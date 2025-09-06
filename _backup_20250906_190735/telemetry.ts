export async function enrichWithLocalTelemetry(event:any){
  try{
    const on = (localStorage.getItem("DS_LOCAL_TELEMETRY")||"").toLowerCase()==="on";
    if(!on) return event;
    const jsonUrl = localStorage.getItem("DS_METRICS_JSON")||"";
    const promUrl = localStorage.getItem("DS_METRICS_URL")||"";
    let extra:any = {};
    // Prefer JSON if provided
    if(jsonUrl){
      const r = await fetch(jsonUrl, {cache:"no-store"});
      if(r.ok){
        const j = await r.json();
        extra = {...extra, ...j}; // assume it already matches runtime/hardware/energy fields or close to it
      }
    } else if(promUrl){
      const r = await fetch(promUrl, {cache:"no-store"});
      if(r.ok){
        const text = await r.text();
        // naive Prometheus parsing examples (extend as needed)
        const get = (name:string)=> {
          const m = text.match(new RegExp("^"+name+"s+(d+(?:.d+)?)","m"));
          return m? Number(m[1]) : undefined;
        };
        extra.runtime = {
          server: "vllm",
          queue_ms: get("vllm_queue_time_ms"),
          tokens_per_s: get("vllm_decode_tokens_per_s")
        };
        extra.hardware = {
          gpu_util_pct: get("gpu_utilization_percent"),
          vram_mb_peak: get("gpu_vram_used_mb")
        };
      }
    }
    return {...event, ...extra};
  }catch{ return event; }
}
