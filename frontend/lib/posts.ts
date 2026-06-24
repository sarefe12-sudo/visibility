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
