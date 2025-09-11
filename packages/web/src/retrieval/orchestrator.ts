export type Plan = { queries: string[] };

export type FetchHit = { 
  url: string; 
  title?: string; 
  snippet?: string; 
  host?: string; 
  ts?: number 
};

export type Ranked = FetchHit[];

export async function planQueries(userQ: string, max = 3): Promise<Plan> {
  const qs = [userQ];
  const cleaned = userQ.trim().toLowerCase();
  
  // Add variations for better retrieval coverage
  if (cleaned.length > 40) {
    const firstSentence = cleaned.split(/[,.!?]/)[0].slice(0, 80);
    if (firstSentence.length > 10) {
      qs.push(firstSentence);
    }
  }
  
  // Add current year for recency if no year mentioned
  if (!/\d{4}/.test(cleaned)) {
    qs.push(cleaned + " 2025");
  }
  
  // Add specific domain searches for technical queries
  if (/\b(api|library|framework|tutorial|how to)\b/i.test(cleaned)) {
    qs.push(cleaned + " documentation");
  }
  
  return { queries: Array.from(new Set(qs)).slice(0, max) };
}

export async function fetchParallel(qs: string[], k = 4, timeoutMs = 3000): Promise<FetchHit[]> {
  // For now, return placeholder results. In a real implementation, this would:
  // 1. Use a search API (DuckDuckGo, Bing, Google Custom Search, etc.)
  // 2. Make parallel requests with AbortController for timeout
  // 3. Parse results into FetchHit format
  // 4. Return up to k deduplicated hits
  
  const hits: FetchHit[] = [];
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, Math.min(timeoutMs / 4, 200)));
  
  // Return placeholder hits for development
  for (let i = 0; i < Math.min(k, qs.length * 2); i++) {
    const query = qs[i % qs.length];
    hits.push({
      url: `https://example.com/result-${i}`,
      title: `Result ${i + 1} for "${query}"`,
      snippet: `This is a placeholder snippet for query "${query}". In a real implementation, this would contain actual search result content with relevant information about the query topic.`,
      host: `example${i % 3 + 1}.com`,
      ts: Date.now() - (i * 86400000) // Simulate different timestamps
    });
  }
  
  return hits;
}

export function rankHits(hits: FetchHit[], q: string, k = 4): Ranked {
  const uniq = new Map<string, FetchHit>();
  
  // Deduplicate by URL (excluding fragment)
  for (const h of hits) { 
    const key = h.url.split("#")[0]; 
    if (!uniq.has(key)) uniq.set(key, h); 
  }
  
  const arr = [...uniq.values()].map(h => {
    const host = (h.url.match(/^https?:\/\/([^/]+)/)?.[1] || "").toLowerCase();
    let score = 0;
    
    // Title relevance
    if (h.title?.toLowerCase().includes(q.toLowerCase())) score += 1;
    
    // Domain authority heuristics
    if (host.includes("wikipedia")) score += 0.4;
    if (host.includes("gov")) score += 0.5;
    if (host.includes("edu")) score += 0.3;
    if (host.includes("stackoverflow")) score += 0.6;
    if (host.includes("github")) score += 0.4;
    if (host.includes("medium")) score += 0.2;
    
    // Recency bonus (newer is better)
    if (h.ts) {
      const ageMs = Date.now() - h.ts;
      const ageDays = ageMs / 86400000;
      if (ageDays < 30) score += 0.3;
      else if (ageDays < 365) score += 0.1;
    }
    
    // Snippet relevance
    if (h.snippet?.toLowerCase().includes(q.toLowerCase())) score += 0.5;
    
    return { ...h, host, _score: score };
  });
  
  return arr
    .sort((a, b) => (b._score || 0) - (a._score || 0))
    .slice(0, k);
}

export function buildRAGContext(hits: Ranked, maxChars = 1200) {
  const used: any[] = [];
  let total = 0;
  let idx = 1;
  
  for (const h of hits) {
    const s = (h.snippet || "").slice(0, 400);
    const host = h.host || (h.url.match(/^https?:\/\/([^/]+)/)?.[1] || "");
    const chunk = `[${idx}] ${host} — ${s}`;
    
    if (total + chunk.length > maxChars) break;
    
    used.push({ 
      idx, 
      host, 
      url: h.url, 
      title: h.title, 
      snippet: s 
    });
    
    total += chunk.length; 
    idx++;
  }
  
  return used;
}

export function formatRAGSnippets(context: any[]): string {
  return context
    .map(c => `[${c.idx}] ${c.host} — ${c.snippet}`)
    .join('\n\n');
}

export function formatSourcesList(context: any[]): string {
  return context
    .map(c => `[${c.idx}] ${c.host} - ${c.title || c.url}`)
    .join('\n');
}