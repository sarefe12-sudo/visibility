# VisibilityRadar — Roadmap & Known Issues

## 🐛 Known Bugs

| # | Bug | Priority | Status |
|---|-----|----------|--------|
| 1 | **Gemini score intermittently 0** — Gemini 2.5 Flash returns generic answers instead of brand-specific scores due to Google safety filters avoiding direct brand comparisons. Workaround: system prompt + retry logic in place, but rate limit (10 RPM free tier) still causes occasional 0s. Possible fix: upgrade to paid Gemini API tier or add smarter fallback scoring. | High | Partial fix deployed |

---

## 🚧 In Progress

| # | Feature | Notes |
|---|---------|-------|
| 1 | LemonSqueezy live mode | Awaiting platform review |
| 2 | Gelen mailleri admin panele çek (info@ / privacy@) | Gmail forward done, admin panel approach TBD |

---

## 📋 Planned Features

| # | Feature | Target |
|---|---------|--------|
| 1 | Pro/Agency kullanıcılar için otomatik blog post üretimi (monthly) | Q3 2026 |
| 2 | API access (read analyses, scores) | Q3 2026 |
| 3 | Gemini scoring reliability — upgrade to paid API tier | Q3 2026 |
| 4 | LinkedIn outreach automation — Google Workspace kurulumu (efe@visibilityradar.ai), Phantombuster + Lemlist entegrasyonu | Q3 2026 |
| 5 | Content Studio API — generated content exportable via API | Q3 2026 |
| 6 | Slack / webhook alerts for score drops | Q4 2026 |
| 7 | Custom prompt sets per industry | Q4 2026 |

---

## ✅ Recently Shipped

- GA4 + Google Search Console admin dashboard
- AI Content Studio (5 Claude-powered blog posts per analysis)
- Per-model strategy playbook (PDF export)
- Free demo: Claude + GPT-4o preview with 1 action step each
- Agency tier: unlimited content generations
- Perplexity fixed: sonar-pro → sonar
- Gemini fixed: gemini-2.5-flash + system prompt + retry backoff
