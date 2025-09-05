import { WebSearchResult } from '../types.js';

export async function performWebSearch(query: string): Promise<WebSearchResult[]> {
  try {
    // Use DuckDuckGo for web search (no API key required)
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'BYOK-Research-Copilot/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Format results
    const results: WebSearchResult[] = [];
    
    // Add abstract if available
    if (data.Abstract && data.AbstractURL) {
      results.push({
        title: data.AbstractText || 'Overview',
        url: data.AbstractURL,
        snippet: data.Abstract,
        source: data.AbstractSource || 'DuckDuckGo',
      });
    }

    // Add related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || 'Related Topic',
            url: topic.FirstURL,
            snippet: topic.Text,
            source: 'DuckDuckGo',
          });
        }
      });
    }

    // Add instant answers
    if (data.Answer && data.AnswerType) {
      results.push({
        title: `Answer: ${data.AnswerType}`,
        url: data.AbstractURL || '#',
        snippet: data.Answer,
        source: 'DuckDuckGo Instant Answer',
      });
    }

    return results.length > 0 ? results : await fallbackSearch(query);
  } catch (error) {
    console.error('Web search error:', error);
    return await fallbackSearch(query);
  }
}

async function fallbackSearch(query: string): Promise<WebSearchResult[]> {
  // Fallback to a simulated search with common sources
  return [
    {
      title: `Search results for: ${query}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      snippet: `Web search functionality is currently limited. For comprehensive results, please search manually for: "${query}"`,
      source: 'Search Suggestion',
    },
    {
      title: 'Wikipedia Search',
      url: `https://en.wikipedia.org/wiki/Special:Search/${encodeURIComponent(query)}`,
      snippet: 'Search Wikipedia for authoritative information on this topic.',
      source: 'Wikipedia',
    },
    {
      title: 'Academic Search',
      url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
      snippet: 'Find academic papers and scholarly articles related to this topic.',
      source: 'Google Scholar',
    }
  ];
}

export function extractSearchQuery(message: string): string {
  // Extract meaningful search terms from user message
  const cleanMessage = message
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Take first 50 characters for search
  return cleanMessage.substring(0, 50);
}

export function enhancePromptWithWebResults(originalPrompt: string, searchResults: WebSearchResult[]): string {
  if (searchResults.length === 0) {
    return originalPrompt;
  }

  const webContext = searchResults.map((result, index) => 
    `[${index + 1}] ${result.title}\n${result.snippet}\nSource: ${result.source} (${result.url})\n`
  ).join('\n');

  return `${originalPrompt}

CURRENT WEB SEARCH CONTEXT:
${webContext}

Please use this current information in your response and cite sources appropriately. When referencing information from these sources, include the source name and indicate it's from recent web search.`;
}