export interface PromptTemplate {
  id: string;
  name: string;
  category: 'analysis' | 'creative' | 'technical' | 'research' | 'reasoning';
  description: string;
  template: string;
  variables?: string[];
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'deep-analysis',
    name: 'Deep Analysis',
    category: 'analysis',
    description: 'Comprehensive analysis with step-by-step reasoning',
    template: `You are an expert analyst. Please analyze the following topic with deep reasoning:

Topic: {input}

Please structure your response as follows:

## Initial Assessment
- Key observations and immediate insights

## Deep Analysis
Think through this step by step:
1. **Context & Background**: What context is important to understand?
2. **Core Components**: Break down the main elements
3. **Relationships**: How do these elements interact?
4. **Implications**: What are the broader implications?

## Reasoning Chain
Show your thought process:
- First, I consider...
- Then, I analyze...
- This leads me to conclude...

## Conclusion
- Summary of key findings
- Actionable insights
- Potential next steps

Be thorough and show your reasoning at each step.`
  },
  {
    id: 'creative-ideation',
    name: 'Creative Ideation',
    category: 'creative',
    description: 'Generate innovative and creative solutions',
    template: `You are a creative innovation expert. Generate innovative ideas for:

Challenge: {input}

## Brainstorming Process
Let me think creatively about this:

### Divergent Thinking
- What if we approached this completely differently?
- What unconventional angles haven't been explored?
- How might other industries solve this?

### Idea Generation
1. **Traditional Approach**: Standard solutions
2. **Innovative Twists**: Creative variations
3. **Radical Concepts**: Bold, disruptive ideas
4. **Hybrid Solutions**: Combining different approaches

### Evaluation Criteria
For each idea, consider:
- Feasibility (1-10)
- Impact potential (1-10)
- Novelty (1-10)
- Implementation ease (1-10)

## Top Recommendations
Present 3-5 most promising ideas with:
- Clear description
- Why it's innovative
- How to implement
- Potential challenges

Think outside the box!`
  },
  {
    id: 'technical-debug',
    name: 'Technical Debugging',
    category: 'technical',
    description: 'Systematic technical problem solving',
    template: `You are a senior technical expert. Debug this technical issue:

Problem: {input}

## Debugging Methodology

### Problem Analysis
1. **Symptom Description**: What exactly is happening?
2. **Expected vs Actual**: What should happen vs what is happening?
3. **Environment**: What's the technical context?

### Hypothesis Formation
Let me consider potential causes:
- Most likely causes (80/20 rule)
- Edge cases and rare scenarios
- Environmental factors
- Recent changes

### Systematic Investigation
Step-by-step debugging approach:
1. **Reproduce**: Can we consistently reproduce this?
2. **Isolate**: What's the minimal case that triggers this?
3. **Trace**: Follow the execution path
4. **Verify**: Test each hypothesis

### Root Cause Analysis
- What's the fundamental cause?
- Why did this happen?
- How did it go undetected?

### Solution & Prevention
- Immediate fix
- Long-term solution
- Prevention strategies
- Testing approach

Show your technical reasoning clearly.`
  },
  {
    id: 'research-synthesis',
    name: 'Research Synthesis',
    category: 'research',
    description: 'Comprehensive research with source analysis',
    template: `You are a research specialist. Conduct comprehensive research on:

Research Topic: {input}

## Research Strategy
My approach to this research:

### Information Gathering
1. **Primary Sources**: Direct, authoritative information
2. **Academic Sources**: Peer-reviewed research
3. **Expert Opinions**: Industry leaders and specialists
4. **Recent Developments**: Latest news and trends

### Source Evaluation
For each source, I'll assess:
- Credibility and authority
- Recency and relevance
- Bias and limitations
- Supporting evidence

### Synthesis Framework
- **Current State**: What do we know now?
- **Knowledge Gaps**: What's missing or unclear?
- **Conflicting Views**: Where do sources disagree?
- **Emerging Patterns**: What trends are visible?

## Research Findings
[I will present findings with clear source attribution]

## Critical Analysis
- Strength of evidence
- Reliability of conclusions
- Areas needing more research

## Actionable Insights
- Key takeaways
- Practical applications
- Future considerations

Note: I'll clearly indicate when I need web search to provide current information.`
  },
  {
    id: 'socratic-reasoning',
    name: 'Socratic Reasoning',
    category: 'reasoning',
    description: 'Question-driven deep exploration',
    template: `I'll explore this topic using Socratic questioning method:

Topic: {input}

## Foundational Questions
Let me start with the basics:
- What exactly are we discussing?
- How do we define the key terms?
- What assumptions are we making?

## Exploratory Questions
Now let's dig deeper:
- Why is this important?
- What evidence supports this?
- What might contradict this view?
- How does this connect to other concepts?

## Analytical Questions
Examining the logic:
- What are the implications?
- What would happen if...?
- How does this compare to...?
- What patterns do we see?

## Synthesizing Questions
Bringing it together:
- What's the core insight?
- How does this change our understanding?
- What questions remain unanswered?
- Where do we go from here?

## Thought Process
I'll show my reasoning chain at each step, questioning assumptions and building understanding progressively.

Let me work through this systematically...`
  }
];

export function applyPromptTemplate(templateId: string, input: string, variables?: Record<string, string>): string {
  const template = PROMPT_TEMPLATES.find(t => t.id === templateId);
  if (!template) return input;

  let prompt = template.template.replace('{input}', input);
  
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
  }

  return prompt;
}

export function getTemplatesByCategory(category: string): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter(t => t.category === category);
}

export function getAvailableCategories(): string[] {
  return Array.from(new Set(PROMPT_TEMPLATES.map(t => t.category)));
}