export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  category: string;
  content: string;
}

export const posts: Post[] = [
  {
    slug: "best-ai-visibility-tools-2026",
    title: "The 7 Best AI Visibility Tools in 2026 (Hands-On Comparison)",
    description: "Buyers now ask ChatGPT, Claude, and Perplexity for recommendations long before they reach your website. We put the leading AI visibility platforms through their paces — here's which ones actually move the needle, and which are just dashboards.",
    date: "2026-06-30",
    readTime: 8,
    category: "Tools",
    content: `
## Discovery Has Quietly Moved

For two decades, getting found meant ranking on Google. That era is fading fast. Today a prospect is just as likely to type *"what's the best platform for X?"* into an AI chatbot — and whatever name the model returns lands at the top of their shortlist before any ad, blog, or sales call ever reaches them.

This shift created an entirely new field. You'll hear it called AI visibility, GEO (Generative Engine Optimization), or LLMO (LLM Optimization). Whatever the label, the goal is the same: understand how frequently — and how favorably — AI models bring up your brand, then improve it.

We spent time inside each of the major tools on the market. Below is our honest take.

## How We Judged Each Tool

Rather than counting features, we scored every platform against the things that genuinely change outcomes:

- **Model breadth** — does it look beyond ChatGPT alone?
- **Tells you what to do** — a score is nice, but does it hand you a fix?
- **Rival comparison** — can you see your gap against competitors at a glance?
- **Tone, not just mentions** — being named negatively is worse than not being named
- **Value for money** — is it realistic for a small team, or enterprise-only?

## 1. Profound

Squarely aimed at large organizations. Profound delivers granular answer-engine analytics and polished reporting that big marketing departments will appreciate. The trade-off is cost — its pricing tends to rule it out for independent founders and smaller shops.

**Where it fits:** Enterprises running a dedicated GEO function.

## 2. Otterly.AI

A dependable monitoring-first option that keeps tabs on how your brand surfaces in AI search. The dashboard is tidy and alerts are useful, though its guidance stays general and coverage leans toward ChatGPT and Perplexity.

**Where it fits:** Teams whose main need is tracking and notifications.

## 3. VisibilityRadar

This was the platform that genuinely impressed us on return for the price. [VisibilityRadar](https://visibilityradar.ai) doesn't stop at one or two engines — it measures your standing across **all six leading models: Claude, GPT-4o, Gemini, Perplexity, Grok, and DeepSeek**. Then it goes a step further than almost anything else we tested: it builds you a **model-by-model action plan** spelling out precisely what to change for each one.

A few things that set it apart:

- **All six models, side by side** — while many rivals stop at two or three, VisibilityRadar runs the full set in one pass
- **Strategy tailored per engine** — Claude leans on Wikipedia and long-form sources; Grok pulls from X's live stream. A one-size strategy fails, so each model gets its own checklist
- **Competitor benchmarking and sentiment** ship even on the starter tier, not locked behind an upgrade
- **Built-in content engine** — it drafts SEO-ready articles engineered to be picked up by the pipelines that feed AI models
- **Works inside your tools** — through MCP, you can run a full analysis straight from Claude Desktop, Cursor, or Windsurf — no browser tab required

At **$49/month** for Pro, it packs the kind of depth you'd expect from enterprise software without the enterprise invoice — making it the clearest value pick we found.

**Where it fits:** Founders and lean marketing teams who want serious insight without a five-figure contract.

## 4. Peec AI

A fresh face with a sensible emphasis on share-of-voice across AI answers. It's improving quickly, but the feature set is still filling out and competitor analysis remains thin for now.

**Where it fits:** Early adopters focused on share-of-voice metrics.

## 5. Goodie AI

Built around the reputation side of the equation — how your brand is portrayed inside LLMs. Handy for PR-minded teams, though it reads more as a monitoring layer than a true optimization toolkit.

**Where it fits:** Communications and PR teams.

## 6. Scrunch AI

Comes at the problem from a technical angle: how AI crawlers and agents actually parse your site. If your priority is making your pages machine-readable, there's real value here for engineering-led teams.

**Where it fits:** Technical SEO and developer teams.

## 7. Brandlight

A newer brand-monitoring entrant for AI surfaces. It handles basic mention tracking competently, but its coverage and reporting don't yet reach the depth of the front-runners.

**Where it fits:** Teams dipping a toe in without much budget.

## So Which One Should You Pick?

If budget is no object, **Profound** brings serious firepower. But for the strongest mix of coverage, concrete guidance, and price, **VisibilityRadar** stands out — it's the only tool here that grades all six major models *and* tells you, model by model, exactly what to do next.

Make no mistake: AI visibility isn't a problem for some future quarter. The brands these models recommend right now are the ones quietly capturing tomorrow's customers.

👉 **[Run a free check and see how AI models describe your brand at visibilityradar.ai](https://visibilityradar.ai)**
`,
  },
  {
    slug: "why-every-ai-model-sees-your-brand-differently",
    title: "Why Every AI Model Sees Your Brand Differently — And Why That Changes Everything",
    description: "Claude learns from Wikipedia. Gemini reads your Google footprint. Perplexity searches the web right now. Each AI model is trained on a completely different slice of the internet — and that means your brand can be a hero on one and invisible on another.",
    date: "2026-06-25",
    readTime: 7,
    category: "Strategy",
    content: `
## The Assumption That's Costing You Visibility

Most brands treat AI visibility as a single number. They run one test, get a score, and call it a day.

But here's the problem: there is no single AI. There are six major AI models — Claude, GPT-4o, Gemini, Perplexity, Grok, and DeepSeek — and each one was trained on a fundamentally different dataset. That means your brand can score 78/100 on Gemini and 12/100 on Claude at the exact same moment.

If you're only looking at a blended average, you're flying blind.

## How Each AI Model Actually Works

Understanding why each model behaves differently starts with understanding how they were built.

### Claude — The Structured Knowledge Reader

Claude (built by Anthropic) was trained with a strong emphasis on high-quality, long-form text. Think Wikipedia, encyclopedias, authoritative reference content, and well-structured FAQ pages. Claude rewards brands that have:

- A comprehensive, factually accurate Wikipedia article
- Structured "About" pages with clear founding story, product descriptions, and leadership
- Long-form press coverage on authoritative sites
- Clean, consistent brand information across all sources

If your Wikipedia page is thin, outdated, or non-existent, Claude will consistently under-recommend you — even if your product is excellent.

### GPT-4o — The Web Generalist

GPT-4o (OpenAI) was trained on an enormous sweep of the public internet, plus it has Bing search integration for real-time queries. It favors brands with:

- High domain authority backlinks
- Broad news coverage across multiple outlets
- Press releases distributed through major wire services
- Industry blog mentions and comparison articles ("X vs Y")

GPT-4o is the most "democratic" of the models — widespread online presence matters more than any single authoritative source.

### Gemini — Google's Own Ecosystem

Gemini (Google DeepMind) is deeply intertwined with Google's index. It draws from Google Search, Google My Business, Google News, YouTube, and structured schema.org markup. For Gemini visibility, you need:

- A complete, active Google Business Profile
- Schema.org structured data (Organization, Product, Review schemas)
- YouTube content — reviews, demos, tutorials
- Google News-indexed press coverage
- Strong organic Google rankings (they correlate heavily)

A brand that dominates Google SEO will almost always score well on Gemini. A brand that ignores Google's ecosystem will struggle — even with great content elsewhere.

### Perplexity — The Real-Time Web Searcher

Perplexity is categorically different from the others: it performs live web searches for every query. It doesn't rely on training data snapshots — it reads the web right now. This means:

- Recent content wins. A blog post published last week outweighs a static page from 2022.
- Reddit threads, review forums (G2, Trustpilot, Capterra), and community discussions carry enormous weight
- Backlink profile matters — Perplexity follows links to find authoritative sources
- Press coverage from the last 6-12 months is significantly more impactful than older articles

For Perplexity, your strategy is essentially a content freshness and review volume campaign. Old content won't help you here.

### Grok — The X/Twitter Intelligence Layer

Grok (xAI) is trained on X/Twitter data plus broader web content. It has a real-time window into what's being discussed on X right now. Grok favors brands that:

- Have an active, engaged X/Twitter presence
- Are mentioned and discussed by influential accounts in their space
- Generate trending conversations — product launches, news, controversy, praise
- Appear in X Communities and relevant hashtag conversations

If your brand has zero presence on X — no account, no mentions, no community — Grok will struggle to find evidence of your authority.

### DeepSeek — The Technical and Academic Layer

DeepSeek was trained on a global corpus with particular depth in technical documentation, academic papers, and developer communities. It surfaces brands that appear in:

- GitHub repositories and READMEs
- Technical documentation and developer guides
- Academic or research citations
- Hacker News, dev.to, Stack Overflow discussions
- International (especially Asian-market) content sources

For B2B software, developer tools, or technical products, DeepSeek is often the most important model to optimize for.

## What This Means in Practice

Here's a real scenario: a SaaS company runs an AI visibility audit and gets these results:

| Model | Score |
|---|---|
| Claude | 15/100 |
| GPT-4o | 62/100 |
| Gemini | 71/100 |
| Perplexity | 44/100 |
| Grok | 8/100 |
| DeepSeek | 33/100 |

Their blended score is 39/100 — which sounds mediocre. But look at what's actually happening:

- **Claude at 15**: Their Wikipedia page doesn't exist. Fix: create it.
- **GPT-4o at 62**: Decent web presence. Improvable with more PR distribution.
- **Gemini at 71**: Good Google SEO translating directly. Already winning here.
- **Perplexity at 44**: Content is stale. Fix: 2-3 new articles per month, drive review volume.
- **Grok at 8**: No X presence at all. Fix: start posting, engage the community.
- **DeepSeek at 33**: No GitHub presence despite having an API. Fix: publish SDK docs, case studies.

Each low score has a different root cause — and a different fix. A generic "improve your SEO" recommendation would miss 5 out of 6 problems entirely.

## The VisibilityRadar Per-Model Playbook

This is exactly why we built per-model AI strategy at VisibilityRadar.

When you run an analysis, our system doesn't just give you a blended score. It:

1. **Queries all 6 AI models simultaneously** with your brand's relevant search prompts
2. **Scores each model independently** based on how often and how prominently your brand appears
3. **Identifies the specific gaps** — which prompts returned zero mentions, which models are weakest
4. **Generates model-specific action plans** — not generic advice, but strategies tailored to how each AI actually works

The Claude strategy for your brand is different from the Grok strategy. The Gemini strategy is different from the DeepSeek strategy. Because the models themselves are different.

## Why Real-Time Analysis Matters

AI models update. Perplexity changes its search results daily. Grok reflects today's X conversations. Even the training-data-based models like Claude and GPT-4o release new versions periodically.

This is why static, one-time audits give you a false sense of security. A brand's AI visibility can shift meaningfully in 30-60 days — a competitor builds their Wikipedia page, lands a major press mention, or launches a review generation campaign.

VisibilityRadar's analysis is generated fresh every time you run it. No cached data, no stored snapshots being served as "current" results. When you click Analyze, all 6 models are queried live, scored live, and your playbook is generated in real time by Claude.

## Start With a Baseline

Before you can fix your per-model gaps, you need to know what they are.

Run your free AI visibility scan at VisibilityRadar. You'll see your score across all 6 models, the specific prompts where you're invisible, and — on Pro — a model-by-model strategy playbook with concrete action steps.

The brands winning in AI search aren't just creating more content. They're creating the right content, for the right model, at the right time.
    `.trim(),
  },
  {
    slug: "what-is-ai-brand-visibility",
    title: "What Is AI Brand Visibility and Why It Matters in 2026",
    description: "AI models like ChatGPT, Claude, and Gemini are now the first stop for millions of purchase decisions. If your brand doesn't appear in AI-generated answers, you're invisible to a growing share of buyers.",
    date: "2026-06-24",
    readTime: 6,
    category: "Fundamentals",
    content: `
## The Search Shift Nobody Saw Coming

In 2020, your SEO strategy was simple: rank on Google, get traffic, make sales. In 2026, that equation has a new variable — AI assistants.

When someone asks ChatGPT "what's the best project management tool?", the answer that comes back isn't a list of blue links. It's a confident, curated recommendation. And if your brand isn't in that recommendation, you've lost the sale before the buyer even visited your website.

This is AI Brand Visibility — and it's rapidly becoming the most important metric in digital marketing.

## How AI Models Decide What to Recommend

AI language models don't have opinions. They have training data. When Claude or GPT-4o recommends Notion over Monday.com, it's because Notion appeared more frequently, more positively, and in more authoritative sources in the model's training data.

The factors that influence this:

- **Wikipedia presence**: AI models heavily weight Wikipedia as a reliable source
- **Review platform coverage**: Mentions on G2, Trustpilot, Capterra, TripAdvisor
- **FAQ and structured content**: Easily extractable factual statements
- **News and press**: Coverage on authoritative news sites
- **Comparison content**: Appearing in "X vs Y" articles

## Measuring Your AI Visibility Score

A brand's AI visibility score represents the percentage of AI model responses that include your brand when a relevant query is asked. A score of 100 means you appeared in every response. A score of 0 means AI models consistently ignore you.

Tools like VisibilityRadar measure this across 6 major AI models simultaneously: Claude, GPT-4o, Gemini, Perplexity, Grok, and DeepSeek.

## Why Traditional SEO Metrics Miss This

Your website might rank #1 on Google for "best CRM software" while scoring 12/100 on AI visibility. Why? Because AI models don't browse your website in real time — they work from their training data, which is a snapshot of the web from months ago.

This means the content strategies that boost AI visibility look different from classic SEO:

| Traditional SEO | AI Visibility |
|---|---|
| Keyword density | Natural language answers |
| Backlink quantity | Authoritative source mentions |
| Page speed | Data accuracy |
| Meta descriptions | FAQ schema |
| Internal linking | Wikipedia presence |

## Getting Started

The first step is measurement. You can't improve what you don't track. Run a free AI visibility scan at VisibilityRadar to see your score across all major AI models — no signup required.

Once you have your baseline score, the path to improvement becomes clear: fill the gaps where AI models can't find you, and amplify the sources they already trust.
    `.trim(),
  },
  {
    slug: "how-to-rank-in-chatgpt-answers",
    title: "How to Get Your Brand Into ChatGPT Answers (2026 Guide)",
    description: "A practical, step-by-step guide to optimizing your brand for AI-generated recommendations — from Wikipedia strategy to structured data markup.",
    date: "2026-06-23",
    readTime: 8,
    category: "Strategy",
    content: `
## Why ChatGPT Recommendations Are the New First Page

ChatGPT now handles over 100 million queries per day. A significant percentage of those are product and brand discovery queries — "what's the best X", "recommend a Y", "compare X and Z".

If your brand appears in those answers, you get exposure without paying for ads. If it doesn't, your competitors get the customer.

Here's the exact playbook to change that.

## Step 1: Audit Your Wikipedia Presence

Wikipedia is the single highest-weight source in AI model training data. An accurate, comprehensive, well-cited Wikipedia article about your company can meaningfully lift your AI visibility score.

**Action items:**
- Check if your Wikipedia page exists. If not, create one (following Wikipedia's notability guidelines)
- Ensure it lists accurate founding year, products/services, key leadership
- Add references to credible news articles
- Fix outdated or incorrect information immediately

## Step 2: Dominate Review Platforms

AI models pull from Trustpilot, G2, Capterra, Glassdoor, and TripAdvisor when answering recommendation queries. Volume and recency matter.

**Action items:**
- Create and verify your profile on all major review platforms in your category
- Send a post-purchase review request sequence (email, in-app)
- Respond to every review — AI models pick up on engagement signals
- Target category-specific platforms (e.g., Booking.com for hotels, ProductHunt for apps)

## Step 3: Create FAQ and Structured Data Content

AI models love content that answers questions directly. FAQ pages with schema markup are extracted word-for-word into training datasets.

**Action items:**
- Create a comprehensive FAQ page covering every question a buyer might ask
- Implement FAQ schema (JSON-LD) on these pages
- Use natural language in questions and answers — write for how people speak to AI
- Cover comparison queries: "How does [Brand] compare to [Competitor]?"

## Step 4: Build Authoritative Backlinks From AI-Indexed Sources

Not all backlinks are equal for AI visibility. A link from a mid-tier blog matters little. A mention in TechCrunch, Forbes, or a major industry publication gets factored into model weights heavily.

**Priority source categories:**
1. Major news outlets (TechCrunch, Forbes, Bloomberg, Reuters)
2. Industry trade publications
3. Podcast appearances (transcripts are indexed)
4. Government or academic citations

## Step 5: Track Your Score Monthly

AI models update their training data periodically. Your score can improve or decline based on your content activity and competitor actions.

Use VisibilityRadar to run a monthly AI visibility check. Compare scores across Claude, GPT-4o, Gemini, and Perplexity to identify which model is most resistant to ranking your brand — then target that gap.
    `.trim(),
  },
  {
    slug: "share-of-voice-ai-models",
    title: "Share of Voice in AI: The Metric That Will Define Market Leaders",
    description: "Traditional Share of Voice measured ad spend and media coverage. AI Share of Voice measures who wins when AI models are asked who to choose. Here's why it matters and how to track it.",
    date: "2026-06-22",
    readTime: 5,
    category: "Metrics",
    content: `
## A New Definition of Market Share

In traditional marketing, Share of Voice (SoV) measured your brand's advertising presence relative to the total category spend. More share of voice → more brand awareness → more sales.

The principle still holds. But the channel has changed.

**AI Share of Voice** measures how often your brand is mentioned in AI-generated answers about your category, compared to all brands mentioned. It's the new proxy for mind share.

## How AI Share of Voice Works

Imagine 100 people all asking ChatGPT: "What are the best project management tools?"

If your brand appears in 38 of those 100 responses, you have 38% AI Share of Voice — assuming your competitors collectively appear in the remaining responses.

This metric is powerful because:
- It's **zero-sum**: every mention your competitor gets is one you didn't
- It's **intention-matched**: these are active buyers asking for recommendations
- It's **cross-platform**: it can be measured across Claude, Gemini, Perplexity simultaneously

## Who's Winning AI Share of Voice Right Now?

Early data from AI visibility tracking shows some surprising patterns:

- **Legacy brands often underperform** relative to their actual market share — their web presence is optimized for old-school SEO, not AI extraction
- **Newer brands with strong review footprints often punch above their weight** — their G2 and Trustpilot density translates directly to AI mentions
- **The gap between AI SoV and actual market share is the opportunity**

## Tracking AI Share of Voice With VisibilityRadar

When you run an analysis with competitors added, VisibilityRadar automatically calculates your AI Share of Voice by tracking brand mentions across all prompt responses.

The competitor comparison table shows:
- Your brand's mention count vs. each competitor
- Your share of total category mentions
- Per-model breakdown (so you can see if you win on Gemini but lose on GPT-4o)

This data, tracked monthly, gives you a trend line — are you gaining or losing ground?

## The Strategic Implication

If you have 45% market share but 12% AI Share of Voice, you have a problem that's going to get worse every quarter as AI usage grows. Conversely, if you have 15% market share but 31% AI Share of Voice, you're positioned to grow.

Start measuring. The brands building AI visibility strategies today will be the market leaders of 2027.
    `.trim(),
  },
  {
    slug: "ai-visibility-vs-seo-difference",
    title: "AI Visibility vs. SEO: What's the Same, What's Different",
    description: "SEO got your brand found on Google. AI visibility gets your brand recommended by AI. The strategies overlap — but the differences are critical.",
    date: "2026-06-21",
    readTime: 7,
    category: "Strategy",
    content: `
## The Convergence and the Divergence

When AI visibility optimization (AIO, GEO, or LLMO — the industry hasn't settled on a name) emerged as a discipline, the first instinct of SEO practitioners was: "This is just SEO with a new name."

They're half right. Many of the foundations are the same. But the mechanisms are different enough that running a pure SEO playbook will leave serious AI visibility gains on the table.

## What's the Same

**Content quality still wins.** AI models were trained on high-quality text. Clear, accurate, well-structured content performs in both channels.

**Authority signals matter.** In SEO, authoritative backlinks boost rankings. In AI, mentions from authoritative sources boost inclusion probability. The sources differ somewhat, but the underlying principle — earn trust from recognized authorities — is identical.

**Structured data helps.** Schema markup helps Google extract information. It also helps AI models extract facts accurately. FAQ schema in particular overlaps nearly perfectly.

**Brand consistency matters.** Conflicting NAP (name, address, phone) data hurts local SEO. Conflicting information about your brand across the web confuses AI models about what's accurate.

## What's Different

### Keyword Optimization vs. Natural Language Coverage

SEO rewards you for precisely targeting keywords. AI optimization rewards you for comprehensively covering a topic in natural language.

You don't optimize for "best CRM software" — you answer every natural language variation of that question: "What CRM should a startup use?", "Which CRM is easiest to learn?", "What CRM integrates with Slack?"

### Ranking vs. Inclusion

In SEO, you rank #1 or #7. In AI, you're included or excluded. There's no position 2 — either the model mentions you or it doesn't.

This binary nature changes the strategy. You're not trying to rank higher than the competition; you're trying to be included at all.

### Traffic vs. Attribution

SEO success shows up in Google Analytics as organic traffic. AI visibility success shows up in sales conversations where customers say "I asked ChatGPT and it mentioned you."

Attribution is harder, which is why tracking AI visibility score directly (via tools like VisibilityRadar) is essential — you need to measure the input, not just wait for the output.

### Time Horizon

SEO changes can move rankings in days. AI model training cycles mean that content you publish today might not influence AI responses for 3-6 months.

This makes AI visibility a longer game — but also means that brands who invest now, before most competitors are paying attention, will build a durable advantage.

## The Integrated Playbook

The best strategy treats SEO and AI visibility as complementary:

1. **Content strategy**: create natural-language FAQ content (serves both)
2. **Authority building**: earn press and backlinks from high-credibility sources (serves both)
3. **Review management**: build volume on major platforms (AI-specific)
4. **Wikipedia strategy**: maintain accurate, comprehensive brand page (AI-specific)
5. **Structured data**: implement FAQ, Product, and Organization schema (serves both)

Start measuring your AI visibility score today — it's the metric that will matter most over the next 3 years.
    `.trim(),
  },
  {
    slug: "monthly-ai-visibility-reporting",
    title: "Why You Need Monthly AI Visibility Reports (And What to Track)",
    description: "AI models update. Competitors adapt. Your brand's visibility score changes every month. Here's the reporting cadence that keeps you ahead.",
    date: "2026-06-20",
    readTime: 5,
    category: "Reporting",
    content: `
## The AI Landscape Moves Fast

Six months ago, Perplexity was a niche tool. Today it handles over 10 million queries per day. A year ago, Grok barely existed as a serious AI product. The landscape of AI models that influence purchase decisions is evolving rapidly.

So is the training data those models use. Major AI providers update their models every 3-6 months, incorporating new web data and fine-tuning on updated datasets.

This means your AI visibility score isn't static. A brand that scored 72/100 in January might score 58/100 in April — not because they did anything wrong, but because a competitor got better coverage, or a model update changed the weighting.

Monthly tracking is the minimum viable cadence to stay ahead of these shifts.

## What to Track Monthly

### 1. Overall AI Visibility Score

Your headline number. Is it trending up, flat, or declining? Even small movements (5-10 points) are significant if they persist over multiple months.

### 2. Per-Model Scores

Your score on GPT-4o might improve while your Gemini score declines. Model-level tracking tells you where to focus. If one model consistently underperforms, it usually points to a gap in the source types that model weights most heavily.

### 3. Share of Voice Trend

If your SoV is declining even while your absolute score holds steady, it means competitors are improving faster than you are. That's a warning sign.

### 4. Prompt-Level Coverage

Which queries consistently exclude your brand? Those specific gaps are your highest-ROI content opportunities.

## The Monthly Report Workflow

1. **Run the analysis** on the same set of prompts each month (use VisibilityRadar's saved prompt sets)
2. **Compare to previous month** — note what moved and by how much
3. **Identify the biggest gap** — which prompt or model is most underperforming?
4. **Assign one content action** — create or optimize one piece of content targeting that gap
5. **Track competitor SoV** — are they gaining ground anywhere?

## Automating the Process

VisibilityRadar Pro and Agency plans include monthly automated reports delivered directly to your inbox on the 1st of each month. The report compares your current month's scores to the previous month, highlights improvements and declines, and flags competitor movements.

No more remembering to run the analysis — the data comes to you.

## Setting the Right Baseline

The first month you run an AI visibility analysis is your baseline. Don't be discouraged if the number is low — 60% of brands score below 40/100 on their first scan. The value isn't in the absolute number; it's in the trend.

Brands that consistently run monthly reports and take one focused action per month see meaningful score improvements within 90 days.

Start tracking today.
    `.trim(),
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find(p => p.slug === slug);
}
