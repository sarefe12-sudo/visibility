# LinkedIn Outreach Automation

## Akış

```
Apollo CSV → enrich_leads.py → Lemlist CSV
```

Her lead için:
1. Şirket adıyla `/analyze-lite` çağırır → AI visibility skoru alır
2. Claude ile kişisel LinkedIn mesajı (280 karakter) yazar
3. Email subject + body üretir
4. Lemlist'e hazır CSV çıkarır

## Kurulum

```bash
cd outreach
pip install anthropic httpx python-dotenv
```

`.env` dosyasına ekle:
```
ANTHROPIC_API_KEY=sk-ant-...
BACKEND_URL=https://zealous-perception-production-2d31.up.railway.app
```

## Kullanım

```bash
# Apollo'dan CSV export et, sonra:
python enrich_leads.py --input apollo_export.csv --output lemlist_ready.csv
```

## Apollo Filtre Ayarları

- **Job Title:** VP Marketing, CMO, Head of Brand, Marketing Director, Head of Digital
- **Employee Count:** 50–2000
- **Industry:** Software, SaaS, E-Commerce, Consumer Goods, Marketing & Advertising
- **Location:** United States, United Kingdom, Germany, Australia, Netherlands
- **Export:** 50 leads (free plan) → CSV

## Lemlist Kurulum

1. lemlist.com → New Campaign → Import CSV → `lemlist_ready.csv`
2. Sıralama: LinkedIn connection request → 2 gün bekle → Email → 3 gün bekle → Follow-up
3. Variable mapping:
   - `{{first_name}}` → first_name
   - `{{company}}` → company
   - `{{ai_score}}` → ai_score
   - `{{linkedin_message}}` → LinkedIn connection mesajı olarak kullan

## Örnek Çıktı Mesajı

> "Hi Sarah, ran an AI visibility check on Acme Corp — you're scoring 23/100 on ChatGPT and Claude. Your competitor HubSpot is at 71. Happy to share the full breakdown if useful."
