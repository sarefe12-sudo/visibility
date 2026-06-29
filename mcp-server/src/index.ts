#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

const API_KEY = process.env.VR_API_KEY
const BASE_URL = 'https://visibilityradar.ai'

if (!API_KEY) {
  console.error('[VisibilityRadar MCP] Error: VR_API_KEY environment variable is required.')
  console.error('Get your API key at: https://visibilityradar.ai/dashboard')
  process.exit(1)
}

const server = new Server(
  { name: 'visibilityradar', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'analyze_brand',
      description: 'Analyze how visible a brand is across AI models (Claude, GPT-4o, Gemini, Perplexity, Grok, DeepSeek). Returns an overall score, per-model scores, sentiment analysis, competitor comparison, and top recommendations. Results are also saved to the VisibilityRadar dashboard.',
      inputSchema: {
        type: 'object',
        properties: {
          brand: {
            type: 'string',
            description: 'The brand name to analyze (e.g. "Nike", "Apple", "Notion")',
          },
          market: {
            type: 'string',
            description: 'Target market or region (e.g. "global", "US", "TR", "UK"). Defaults to "global".',
            default: 'global',
          },
          competitors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of competitor brand names to compare against (max 3)',
            default: [],
          },
        },
        required: ['brand'],
      },
    },
    {
      name: 'get_brand_history',
      description: 'Get the analysis history for a specific brand from the VisibilityRadar dashboard. Shows score trends over time.',
      inputSchema: {
        type: 'object',
        properties: {
          brand: {
            type: 'string',
            description: 'The brand name to look up history for',
          },
        },
        required: ['brand'],
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'analyze_brand') {
    const { brand, market = 'global', competitors = [] } = args as {
      brand: string
      market?: string
      competitors?: string[]
    }

    const res = await fetch(`${BASE_URL}/api/mcp/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY!,
      },
      body: JSON.stringify({ brand, market, competitors }),
    })

    const data = await res.json()

    if (!res.ok) {
      return {
        content: [{ type: 'text', text: `Error: ${data.error ?? 'Analysis failed'}` }],
        isError: true,
      }
    }

    const modelLines = (data.model_scores ?? [])
      .map((m: { model: string; score: number }) => `  • ${m.model}: ${m.score}/100`)
      .join('\n')

    const competitorLines = (data.competitors ?? [])
      .map((c: { brand: string; score: number }) => `  • ${c.brand}: ${c.score}/100`)
      .join('\n')

    const recLines = (data.top_recommendations ?? [])
      .map((r: { action: string; priority: string }, i: number) => `  ${i + 1}. [${r.priority}] ${r.action}`)
      .join('\n')

    const sentiment = data.sentiment
      ? `\n📊 Sentiment: ${data.sentiment.positive}% positive · ${data.sentiment.neutral}% neutral · ${data.sentiment.negative}% negative`
      : ''

    const output = `
# AI Visibility Report: ${data.brand}

**Overall Score: ${data.overall_score}/100** (${data.label})
**Market:** ${data.market}${sentiment}

## Per-Model Scores
${modelLines || '  No model data available'}

${competitorLines ? `## Competitor Comparison\n${competitorLines}\n` : ''}
## Top Recommendations
${recLines || '  No recommendations available'}

---
📊 Full report, playbook & content strategy: ${data.dashboard_url}
`.trim()

    return { content: [{ type: 'text', text: output }] }
  }

  if (name === 'get_brand_history') {
    const { brand } = args as { brand: string }

    const res = await fetch(`${BASE_URL}/api/mcp/history?brand=${encodeURIComponent(brand)}`, {
      headers: { 'x-api-key': API_KEY! },
    })

    const data = await res.json()

    if (!res.ok) {
      return {
        content: [{ type: 'text', text: `Error: ${data.error ?? 'Failed to fetch history'}` }],
        isError: true,
      }
    }

    if (!data.analyses?.length) {
      return {
        content: [{ type: 'text', text: `No analysis history found for "${brand}". Run analyze_brand first.` }],
      }
    }

    const lines = data.analyses.map((a: { overall_score: number; market: string; created_at: string }) => {
      const date = new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      return `  • ${date} — Score: ${a.overall_score}/100 (${a.market})`
    }).join('\n')

    return {
      content: [{
        type: 'text',
        text: `# ${brand} — Analysis History\n\n${lines}\n\nFull dashboard: ${BASE_URL}/dashboard`,
      }],
    }
  }

  return {
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    isError: true,
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[VisibilityRadar MCP] Server running. Ready to analyze brands.')
}

main().catch(console.error)
