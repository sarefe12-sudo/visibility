# visibilityradar-mcp

> Analyze how AI models see your brand — directly from Claude Desktop, Cursor, Windsurf, or any MCP-compatible AI assistant.

[![npm version](https://img.shields.io/npm/v/visibilityradar-mcp.svg)](https://www.npmjs.com/package/visibilityradar-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is this?

**VisibilityRadar** measures how often and how positively AI models (Claude, GPT-4o, Gemini, Perplexity, Grok, DeepSeek) mention your brand. This MCP server brings that analysis directly into your AI assistant — no browser needed.

Ask Claude: *"How visible is my brand on AI models compared to my competitors?"* and get an instant, structured report.

## Tools

| Tool | Description |
|---|---|
| `analyze_brand` | Run a full AI visibility analysis: overall score, per-model scores, sentiment, competitors, top recommendations |
| `get_brand_history` | Fetch past analysis results and score trends for a brand |

## Requirements

- **Pro or Agency plan** on [VisibilityRadar](https://visibilityradar.ai/pricing)
- An API key from [Account Settings → MCP API Keys](https://visibilityradar.ai/profile)

## Setup

### 1. Get your API key

Go to [visibilityradar.ai/profile](https://visibilityradar.ai/profile) → scroll to **MCP API Keys** → click **Generate Key**.

### 2. Configure your AI assistant

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "visibilityradar": {
      "command": "npx",
      "args": ["visibilityradar-mcp"],
      "env": {
        "VR_API_KEY": "vr_your_api_key_here"
      }
    }
  }
}
```

#### Cursor

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "visibilityradar": {
      "command": "npx",
      "args": ["visibilityradar-mcp"],
      "env": {
        "VR_API_KEY": "vr_your_api_key_here"
      }
    }
  }
}
```

#### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "visibilityradar": {
      "command": "npx",
      "args": ["visibilityradar-mcp"],
      "env": {
        "VR_API_KEY": "vr_your_api_key_here"
      }
    }
  }
}
```

### 3. Restart your AI assistant

After saving the config, restart Claude Desktop / Cursor / Windsurf. You should see VisibilityRadar listed as a connected tool.

## Example Usage

Once connected, just ask your AI assistant:

```
Analyze the AI visibility of "Notion" in the US market, compare against Obsidian and Roam Research
```

```
What is the brand history for "Linear"?
```

```
How does "Shopify" score across AI models compared to WooCommerce?
```

### Example Output

```
# AI Visibility Report: Notion

**Overall Score: 74/100** (Strong)
**Market:** US
📊 Sentiment: 68% positive · 24% neutral · 8% negative

## Per-Model Scores
  • Claude: 82/100
  • GPT-4o: 78/100
  • Gemini: 71/100
  • Perplexity: 69/100
  • Grok: 74/100
  • DeepSeek: 66/100

## Competitor Comparison
  • Obsidian: 58/100
  • Roam Research: 41/100

## Top Recommendations
  1. [HIGH] Build a stronger Wikipedia presence with product comparisons
  2. [HIGH] Earn more coverage on tech publications indexed by Perplexity
  3. [MEDIUM] Increase presence on X/Twitter for Grok visibility

---
📊 Full report, playbook & content strategy: https://visibilityradar.ai/dashboard
```

## Rate Limits

| Plan | Daily MCP analyses | Monthly analyses |
|---|---|---|
| Pro | 5/day | 10/month |
| Agency | 20/day | Unlimited |

Every `analyze_brand` call via MCP counts as one analysis and is saved to your dashboard automatically.

## API Endpoints

The MCP server calls the following VisibilityRadar API endpoints:

- `POST https://visibilityradar.ai/api/mcp/analyze` — Run analysis
- `GET https://visibilityradar.ai/api/mcp/history` — Fetch history

Authentication uses the `x-api-key` header with your API key.

## Links

- [VisibilityRadar](https://visibilityradar.ai)
- [Pricing](https://visibilityradar.ai/pricing)
- [FAQ](https://visibilityradar.ai/faq)
- [npm package](https://www.npmjs.com/package/visibilityradar-mcp)

## License

MIT
