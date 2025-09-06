import os from "os";
import type { Request, Response } from "express";

export async function localMetrics(req: Request, res: Response) {
  const baseURL = String(req.query.baseURL || "http://localhost:11434").replace(/\/+$/, '');
  
  // Get system metrics
  const load = os.loadavg();
  const total = os.totalmem();
  const free = os.freemem();
  const rss = process.memoryUsage().rss;
  const cpus = os.cpus()?.length || 0;
  
  // Get Ollama metrics
  let ollama: any = {};
  try {
    // Check running processes
    const psResponse = await fetch(`${baseURL}/api/ps`);
    const ps = psResponse.ok ? await psResponse.json() : null;
    
    // Check installed models
    const tagsResponse = await fetch(`${baseURL}/api/tags`);
    const tags = tagsResponse.ok ? await tagsResponse.json() : null;
    
    ollama = { ps, tags, reachable: true };
  } catch (error) {
    ollama = { reachable: false, error: (error as Error).message };
  }
  
  res.json({
    host: {
      cpus,
      load1: load[0],
      load5: load[1], 
      load15: load[2],
      total,
      free,
      rss
    },
    ollama
  });
}