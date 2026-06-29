import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300 // 5 minutes — requires Vercel Pro plan

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TOPICS = [
  { title: "What Is GEO Optimization and Why Every Brand Needs It in 2025", angle: "explainer", keywords: ["GEO optimization", "generative engine optimization", "AI search", "brand visibility"], devtoTags: ["seo", "ai", "marketing", "webdev"], hashnodeTags: ["seo", "ai", "marketing"] },
  { title: "How AI Models Decide Which Brands to Mention", angle: "how-it-works", keywords: ["AI brand mentions", "LLM brand visibility", "ChatGPT brand", "brand discovery"], devtoTags: ["ai", "marketing", "seo", "llm"], hashnodeTags: ["ai", "seo", "marketing"] },
  { title: "Share of Voice in the Age of AI: A New Metric for Marketers", angle: "data-driven", keywords: ["share of voice AI", "AI brand awareness", "LLM share of voice", "brand analytics"], devtoTags: ["ai", "marketing", "analytics", "seo"], hashnodeTags: ["ai", "marketing", "analytics"] },
  { title: "Why Your Brand Might Be Invisible to ChatGPT, Gemini, and Claude", angle: "problem-solution", keywords: ["brand invisible AI", "AI visibility", "LLM brand recognition", "AI search"], devtoTags: ["ai", "seo", "marketing", "chatgpt"], hashnodeTags: ["ai", "seo", "marketing"] },
  { title: "LLM SEO: How to Rank in AI Answers Instead of Search Results", angle: "guide", keywords: ["LLM SEO", "AI search optimization", "rank in AI answers", "generative search"], devtoTags: ["seo", "ai", "webdev", "tutorial"], hashnodeTags: ["seo", "ai", "tutorial"] },
  { title: "How to Measure Your Brand's AI Visibility: A Practical Framework", angle: "framework", keywords: ["measure AI visibility", "AI brand score", "brand AI benchmark", "AI analytics"], devtoTags: ["ai", "analytics", "marketing", "seo"], hashnodeTags: ["ai", "analytics", "marketing"] },
  { title: "Generative Engine Optimization (GEO): The New Frontier of Digital Marketing", angle: "trend", keywords: ["generative engine optimization", "GEO", "AI era SEO", "future of SEO"], devtoTags: ["seo", "ai", "marketing", "webdev"], hashnodeTags: ["seo", "ai", "marketing"] },
  { title: "How to Get Your Content Cited in AI-Generated Answers", angle: "actionable", keywords: ["content cited AI", "appear in AI answers", "LLM content strategy", "AI citations"], devtoTags: ["seo", "ai", "content", "tutorial"], hashnodeTags: ["seo", "ai", "content"] },
  { title: "AI Brand Sentiment: Why Being Mentioned Isn't Enough", angle: "analysis", keywords: ["AI brand sentiment", "LLM brand perception", "brand reputation AI", "AI brand analysis"], devtoTags: ["ai", "marketing", "analytics", "branding"], hashnodeTags: ["ai", "marketing", "branding"] },
  { title: "Tracking Competitor Mentions Across AI Models: A Marketer's Guide", angle: "competitive", keywords: ["AI competitive intelligence", "competitor AI mentions", "LLM competitor analysis", "brand monitoring"], devtoTags: ["ai", "marketing", "analytics", "seo"], hashnodeTags: ["ai", "marketing", "analytics"] },
  { title: "The Training Data Effect: Why Some Brands Dominate AI Responses", angle: "deep-dive", keywords: ["AI training data brands", "LLM brand bias", "AI brand recognition", "brand authority"], devtoTags: ["ai", "machinelearning", "marketing", "seo"], hashnodeTags: ["ai", "machinelearning", "marketing"] },
  { title: "Perplexity AI and Brand Discovery: What Marketers Need to Know", angle: "platform-specific", keywords: ["Perplexity AI brand", "Perplexity brand mentions", "AI search discovery"], devtoTags: ["ai", "seo", "marketing", "search"], hashnodeTags: ["ai", "seo", "marketing"] },
  { title: "From Zero to AI Visibility: A 90-Day Brand Strategy", angle: "roadmap", keywords: ["AI visibility strategy", "brand AI optimization", "AI SEO plan"], devtoTags: ["seo", "ai", "marketing", "strategy"], hashnodeTags: ["seo", "ai", "strategy"] },
  { title: "How Prompt Engineering Affects Which Brands AI Recommends", angle: "technical", keywords: ["prompt engineering brands", "AI recommendations", "LLM brand mentions", "AI marketing"], devtoTags: ["ai", "machinelearning", "webdev", "seo"], hashnodeTags: ["ai", "machinelearning", "seo"] },
  { title: "AI Search vs Google Search: How Brand Discovery Is Changing", angle: "comparison", keywords: ["AI search vs Google", "brand discovery shift", "LLM search", "future of search"], devtoTags: ["ai", "seo", "search", "marketing"], hashnodeTags: ["ai", "seo", "marketing"] },
]

const DEVTO_PROMPT = (topic: typeof TOPICS[0]) => `You are writing a technical/marketing article for Dev.to — a community for software developers and technical marketers. The audience values practical insight, real examples, and actionable advice. They distrust fluff and obvious self-promotion.

ARTICLE TITLE: ${topic.title}
ANGLE: ${topic.angle}
KEYWORDS TO USE NATURALLY: ${topic.keywords.join(', ')}

STRICT REQUIREMENTS (Dev.to community guidelines):
- 900-1200 words. Concise and dense with value — Dev.to readers skim long intros
- Start with a compelling 2-3 sentence hook that states the problem clearly
- Use H2 headings (##), code blocks for any technical examples, and bullet lists
- Provide at least 3 concrete, actionable takeaways readers can apply today
- Tone: direct, peer-to-peer, slightly informal — like a smart colleague sharing something they learned
- Include exactly ONE natural mention of VisibilityRadar (https://visibilityradar.ai) — only where it genuinely fits as a tool that solves a specific problem you described. Do not lead with it or end with it. Embed it mid-article.
- Do NOT write a promotional article. The article must stand alone as valuable content even without the tool mention.
- No "In conclusion" — end with a forward-looking insight or open question
- Do NOT add any author bio, tags, or front matter — just the markdown body

Return ONLY the markdown article body.`

const HASHNODE_PROMPT = (topic: typeof TOPICS[0]) => `You are writing a thought-leadership article for Hashnode — a blogging platform for developers and tech marketers who want deep, insightful content. The audience values frameworks, mental models, and strategic thinking.

ARTICLE TITLE: ${topic.title}
ANGLE: ${topic.angle} (approach this from a strategic/business perspective, not just tactical)
KEYWORDS TO USE NATURALLY: ${topic.keywords.join(', ')}

STRICT REQUIREMENTS (Hashnode community guidelines):
- 1100-1400 words
- Structure: Problem framing → Why it matters now → Framework or mental model → Real-world application → Key insight
- Use H2 (##) and H3 (###) headings, numbered lists for steps/frameworks
- Include at least one concrete data point, case study analogy, or specific example
- Tone: confident, thoughtful, slightly more formal than Dev.to — like a senior practitioner sharing a framework
- Include exactly ONE natural mention of VisibilityRadar (https://visibilityradar.ai) — position it as a specific solution to a specific problem you've already established. Don't name it in the intro or conclusion.
- The article must teach something genuinely useful independent of any tool
- End with 3-4 "Key Takeaways" bullet points
- Do NOT add any front matter, tags, or meta — just the markdown body

Return ONLY the markdown article body.`

async function getLastPublishedTopics(): Promise<string[]> {
  const { data } = await supabase
    .from('backlink_publications')
    .select('topic_title')
    .order('created_at', { ascending: false })
    .limit(7)
  return (data ?? []).map((d: { topic_title: string }) => d.topic_title)
}

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

async function publishToDevTo(topic: typeof TOPICS[0], content: string): Promise<string | null> {
  const apiKey = process.env.DEVTO_API_KEY
  if (!apiKey) return null

  const res = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      article: {
        title: topic.title,
        body_markdown: content,
        published: true,
        tags: topic.devtoTags.slice(0, 4),
        description: `A practical guide to ${topic.keywords[0]} — what it means, why it matters, and how to act on it.`,
      },
    }),
  })

  if (!res.ok) {
    console.error('[backlink] Dev.to error:', res.status, await res.text().catch(() => ''))
    return null
  }
  const data = await res.json()
  return data.url ?? null
}

async function publishToGist(topic: typeof TOPICS[0], content: string): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return null

  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: topic.title,
      public: true,
      files: {
        [`${topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}.md`]: {
          content,
        },
      },
    }),
  })

  if (!res.ok) {
    console.error('[backlink] GitHub Gist error:', res.status, await res.text().catch(() => ''))
    return null
  }
  const data = await res.json()
  return data.html_url ?? null
}

async function publishToHashnode(topic: typeof TOPICS[0], content: string): Promise<string | null> {
  const token = process.env.HASHNODE_ACCESS_TOKEN
  const publicationId = process.env.HASHNODE_PUBLICATION_ID
  if (!token || !publicationId) return null

  const slug = topic.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 75)

  const query = `
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post { url }
      }
    }
  `

  const res = await fetch('https://gql.hashnode.com', {
    method: 'POST',
    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: {
        input: {
          title: topic.title,
          contentMarkdown: content,
          publicationId,
          slug: `${slug}-${Date.now().toString(36)}`,
          tags: [],
        },
      },
    }),
  })

  if (!res.ok) {
    console.error('[backlink] Hashnode error:', res.status)
    return null
  }
  const data = await res.json()
  if (data.errors) {
    console.error('[backlink] Hashnode GraphQL errors:', JSON.stringify(data.errors))
    return null
  }
  return data?.data?.publishPost?.post?.url ?? null
}

// POST /api/backlink-publisher — Vercel Cron triggers this daily at 09:00 UTC
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Pick a fresh topic
    const recentTitles = await getLastPublishedTopics()
    const available = TOPICS.filter(t => !recentTitles.includes(t.title))
    const pool = available.length > 0 ? available : TOPICS
    const topic = pool[Math.floor(Math.random() * pool.length)]

    // Generate two different articles — same topic, different angle/format
    // so they're original content on each platform (avoids duplicate content flags)
    const [devtoContent, hashnodeContent] = await Promise.all([
      callClaude(DEVTO_PROMPT(topic)),
      callClaude(HASHNODE_PROMPT(topic)),
    ])

    // Publish in parallel — Gist uses the Hashnode (strategic) version
    const [devtoUrl, hashnodeUrl, gistUrl] = await Promise.all([
      publishToDevTo(topic, devtoContent),
      publishToHashnode(topic, hashnodeContent),
      publishToGist(topic, hashnodeContent),
    ])

    // Log
    await supabase.from('backlink_publications').insert({
      topic_title: topic.title,
      devto_url: devtoUrl,
      hashnode_url: hashnodeUrl,
      gist_url: gistUrl,
    })

    return NextResponse.json({ ok: true, topic: topic.title, devto_url: devtoUrl, hashnode_url: hashnodeUrl, gist_url: gistUrl })
  } catch (e) {
    console.error('[backlink-publisher]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// GET — show recent publications (admin use)
export async function GET() {
  const { data } = await supabase
    .from('backlink_publications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)
  return NextResponse.json({ publications: data ?? [] })
}
