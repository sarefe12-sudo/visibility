import type { AnalyzeResponse } from "@/types";

export type Recommendation = {
  title: string;
  priority: string;
  category: string;
  description: string;
  actions: string[];
};

export type ModelPlaybook = {
  model: string;
  score: number;
  status: string;
  headline: string;
  why: string;
  actions: string[];
};

// ── Turkish & extended char normalization ──────────────────────────────────
function san(str: string): string {
  if (!str) return "";
  return str
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ü/g, "u").replace(/Ü/g, "U")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ç/g, "c").replace(/Ç/g, "C")
    .replace(/â/g, "a").replace(/î/g, "i").replace(/û/g, "u")
    .replace(/'/g, "'").replace(/'/g, "'")
    .replace(/"/g, '"').replace(/"/g, '"')
    .replace(/–/g, "-").replace(/—/g, "--")
    .replace(/…/g, "...")
    .replace(/[^\x00-\x7E]/g, "");
}

type Doc = import("jspdf").jsPDF;

// ── Constants ─────────────────────────────────────────────────────────────
const M = 14;    // page margin
const LH = 5.0;  // line height

// Model display names and brand colors
const MODEL_LABELS: Record<string, string> = {
  claude: "Claude", gpt4o: "GPT-4o", gemini: "Gemini",
  perplexity: "Perplexity", grok: "Grok", deepseek: "DeepSeek",
};
const MODEL_RGB: Record<string, [number,number,number]> = {
  claude:     [217, 119, 87],
  gpt4o:      [16,  163, 127],
  gemini:     [66,  133, 244],
  perplexity: [32,  178, 170],
  grok:       [167, 139, 250],
  deepseek:   [77,  107, 254],
};
const COMP_RGB: [number,number,number][] = [
  [16,163,127],[148,163,184],[245,158,11],[244,63,94],[139,92,246],[14,165,233],
];
const INDIGO: [number,number,number]  = [67,  56, 202];
const INDIGO_DARK: [number,number,number] = [49, 46, 129];
const INDIGO_MID: [number,number,number]  = [99, 102, 241];
const INDIGO_LIGHT: [number,number,number] = [199, 210, 254];
const WHITE: [number,number,number]   = [255, 255, 255];
const SLATE9: [number,number,number]  = [15,  23,  42];
const SLATE7: [number,number,number]  = [51,  65,  85];
const SLATE5: [number,number,number]  = [100, 116, 139];
const SLATE2: [number,number,number]  = [226, 232, 240];
const SLATE1: [number,number,number]  = [248, 250, 252];
const EMERALD: [number,number,number] = [16,  185, 129];
const AMBER:   [number,number,number] = [245, 158,  11];
const ROSE:    [number,number,number] = [239,  68,  68];

function scoreColor(s: number): [number,number,number] {
  return s >= 60 ? EMERALD : s >= 30 ? AMBER : ROSE;
}
function scoreLabel(s: number): string {
  return s >= 60 ? "Strong" : s >= 30 ? "Moderate" : "Low";
}

// ── Helpers ───────────────────────────────────────────────────────────────

function setFill(doc: Doc, rgb: [number,number,number]) { doc.setFillColor(...rgb); }
function setDraw(doc: Doc, rgb: [number,number,number]) { doc.setDrawColor(...rgb); }
function setTxt(doc: Doc, rgb: [number,number,number])  { doc.setTextColor(...rgb); }
function setFont(doc: Doc, style: "normal"|"bold"|"italic", size: number) {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
}

/** Horizontal score bar — label left, bar in middle, number right */
function hBar(
  doc: Doc, x: number, y: number, barW: number,
  score: number, label: string, color: [number,number,number],
  labelW = 38
) {
  setFont(doc, "normal", 8.5); setTxt(doc, SLATE7);
  doc.text(san(label), x, y + 3.5);

  const bx = x + labelW;
  const bw = barW - labelW - 10;
  setFill(doc, SLATE2); doc.roundedRect(bx, y + 1, bw, 4, 1.5, 1.5, "F");
  setFill(doc, color);  doc.roundedRect(bx, y + 1, Math.max(2, (score / 100) * bw), 4, 1.5, 1.5, "F");

  setFont(doc, "bold", 9); setTxt(doc, color);
  doc.text(`${score.toFixed(0)}`, x + barW + 1, y + 4.5, { align: "right" });
}

/** Section header: indigo left accent + uppercase label */
function secHead(doc: Doc, label: string, y: number, W: number) {
  setFill(doc, INDIGO_MID); doc.roundedRect(M, y, 3, 5, 1, 1, "F");
  setFont(doc, "bold", 7.5); setTxt(doc, INDIGO_MID);
  doc.text(label.toUpperCase(), M + 6, y + 3.8);
  setDraw(doc, SLATE2); doc.line(M + 6 + doc.getTextWidth(label.toUpperCase()) + 3, y + 2, W - M, y + 2);
}

/** Small chip / badge */
function chip(
  doc: Doc, x: number, y: number, text: string,
  fg: [number,number,number], bg: [number,number,number]
) {
  setFont(doc, "bold", 7); setTxt(doc, fg);
  const tw = doc.getTextWidth(text);
  setFill(doc, bg); doc.roundedRect(x - 2, y - 3.5, tw + 4, 5, 1.5, 1.5, "F");
  doc.text(text, x, y);
  return tw + 6;
}

/** Full-width divider */
function divider(doc: Doc, y: number, W: number) {
  setDraw(doc, SLATE2); doc.line(M, y, W - M, y);
}

// ── Page header / footer ──────────────────────────────────────────────────

function pageHeader(doc: Doc, W: number, subtitle: string) {
  setFill(doc, SLATE1); doc.rect(0, 0, W, 20, "F");
  setDraw(doc, SLATE2); doc.line(0, 20, W, 20);

  setFont(doc, "bold", 10.5); setTxt(doc, SLATE9);
  doc.text("Visibility", M, 13);
  const vw = doc.getTextWidth("Visibility");
  setTxt(doc, INDIGO_MID); doc.text("Radar", M + vw, 13);

  setFont(doc, "normal", 7.5); setTxt(doc, SLATE5);
  doc.text(san(subtitle), W - M, 13, { align: "right" });
}

function pageFooter(doc: Doc, W: number, H: number, pg: number, total?: number) {
  setDraw(doc, SLATE2); doc.line(M, H - 12, W - M, H - 12);
  setFont(doc, "normal", 7); setTxt(doc, SLATE5);
  doc.text("visibilityradar.com", M, H - 5);
  const pgLabel = total ? `${pg} / ${total}` : `${pg}`;
  doc.text(pgLabel, W / 2, H - 5, { align: "center" });
  doc.text(new Date().toLocaleDateString("en-GB", { year:"numeric", month:"short", day:"numeric" }), W - M, H - 5, { align: "right" });
}

// ── Main export ───────────────────────────────────────────────────────────

export async function exportFullReport(
  data: AnalyzeResponse,
  market: string,
  recs: Recommendation[],
  perModelPlaybook?: ModelPlaybook[]
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const CW = W - M * 2;
  const SUBTITLE = `${san(data.brand)} — AI Visibility Report`;

  let y = 0;
  let page = 1;

  function addPage() {
    pageFooter(doc, W, H, page);
    doc.addPage(); page++;
    pageHeader(doc, W, SUBTITLE);
    y = 28;
  }
  function need(h: number) { if (y + h > H - 16) addPage(); }

  const sc = data.overall_score;
  const scCol = scoreColor(sc);
  const modelEntries = Object.entries(data.model_scores);
  const compEntries  = Object.entries(data.competitor_scores);
  const hasSentiment = !!data.sentiment_summary;
  const hasComps = compEntries.length > 0;
  const MARKET_LABELS: Record<string, string> = {
    global:"Global", TR:"Turkey", US:"USA", GB:"UK", DE:"Germany",
    FR:"France", ES:"Spain", IT:"Italy", JP:"Japan", CN:"China",
  };
  const mktLabel = MARKET_LABELS[market] ?? market.toUpperCase();

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════════════════════════════════════

  // Indigo hero block (top 90mm)
  const COVER_H = 90;
  setFill(doc, INDIGO_DARK); doc.rect(0, 0, W, COVER_H, "F");
  // Subtle decorative circles
  setFill(doc, INDIGO); doc.circle(W - 30, 20, 40, "F");
  setFill(doc, INDIGO_DARK); doc.circle(W - 10, 10, 22, "F");
  setFill(doc, [55, 48, 163] as [number,number,number]); doc.circle(20, COVER_H + 10, 30, "F");

  // VisibilityRadar brand top-left
  setFont(doc, "bold", 11); setTxt(doc, WHITE);
  doc.text("Visibility", M, 15);
  const vbw = doc.getTextWidth("Visibility");
  setTxt(doc, INDIGO_LIGHT); doc.text("Radar", M + vbw, 15);

  // Report type label
  setFont(doc, "bold", 7.5); setTxt(doc, INDIGO_LIGHT);
  doc.text("AI VISIBILITY REPORT", M, 27);

  // Brand name
  setFont(doc, "bold", 28); setTxt(doc, WHITE);
  const brandText = san(data.brand).toUpperCase();
  doc.text(brandText, M, 44);

  // Market + date row
  setFont(doc, "normal", 8.5); setTxt(doc, INDIGO_LIGHT);
  const coverMeta = `${mktLabel} Market  ·  ${data.active_models.length} AI Models  ·  ${data.raw_results.length} Prompts  ·  ${new Date().toLocaleDateString("en-GB", { year:"numeric", month:"long", day:"numeric" })}`;
  doc.text(san(coverMeta), M, 52);

  // Score block (right side of cover)
  const scoreX = W - M - 45;
  setFont(doc, "bold", 7.5); setTxt(doc, INDIGO_LIGHT);
  doc.text("OVERALL SCORE", scoreX, 27);
  setFont(doc, "bold", 38); setTxt(doc, WHITE);
  doc.text(sc.toFixed(0), scoreX, 48);
  const scnw = doc.getTextWidth(sc.toFixed(0));
  setFont(doc, "normal", 14); setTxt(doc, INDIGO_LIGHT);
  doc.text("/ 100", scoreX + scnw + 2, 48);
  setFont(doc, "bold", 9.5);
  setTxt(doc, (sc >= 60 ? [110,231,183] : sc >= 30 ? [253,230,138] : [252,165,165]) as [number,number,number]);
  doc.text(scoreLabel(sc), scoreX, 56);

  // Score bar at bottom of cover
  const barY = COVER_H - 14;
  setFill(doc, [79, 70, 229]); doc.roundedRect(M, barY, CW, 5, 2, 2, "F");
  setFill(doc, WHITE); doc.roundedRect(M, barY, Math.max(4, (sc / 100) * CW), 5, 2, 2, "F");

  // Model pills in cover
  setFont(doc, "normal", 7.5); setTxt(doc, INDIGO_LIGHT);
  doc.text("Models tested:", M, COVER_H - 5);
  let pillX = M + doc.getTextWidth("Models tested: ") + 2;
  data.active_models.forEach((m) => {
    const lbl = MODEL_LABELS[m] ?? m;
    const rgb = MODEL_RGB[m] ?? [148,163,184];
    setFont(doc, "bold", 7); setTxt(doc, rgb);
    const tw = doc.getTextWidth(lbl) + 5;
    doc.text(lbl, pillX, COVER_H - 5);
    pillX += tw;
  });

  // ── Summary strip below cover ──
  const stripY = COVER_H;
  setFill(doc, SLATE1); doc.rect(0, stripY, W, 22, "F");
  setDraw(doc, SLATE2); doc.line(0, stripY + 22, W, stripY + 22);

  const stats = [
    { label: "Overall Score", value: `${sc.toFixed(0)}/100`, color: scCol },
    { label: "Models Tested",  value: `${data.active_models.length}`,           color: INDIGO_MID },
    { label: "Prompts Run",    value: `${data.raw_results.length}`,             color: INDIGO_MID },
    { label: "Competitors",    value: `${compEntries.length}`,                  color: INDIGO_MID },
    { label: "Visibility",     value: scoreLabel(sc),                           color: scCol },
  ];
  const colW = CW / stats.length;
  stats.forEach((s, i) => {
    const cx = M + colW * i + colW / 2;
    setFont(doc, "bold", 11); setTxt(doc, s.color);
    doc.text(s.value, cx, stripY + 10, { align: "center" });
    setFont(doc, "normal", 7); setTxt(doc, SLATE5);
    doc.text(s.label.toUpperCase(), cx, stripY + 16, { align: "center" });
    if (i > 0) { setDraw(doc, SLATE2); doc.line(M + colW * i, stripY + 4, M + colW * i, stripY + 18); }
  });

  // ── Start body on page 1 ──
  y = COVER_H + 30;

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 1 — PER-MODEL SCORES
  // ════════════════════════════════════════════════════════════════════════
  need(14 + modelEntries.length * 11);
  secHead(doc, "Per-Model Scores", y, W); y += 10;

  modelEntries.forEach(([key, score], i) => {
    need(11);
    const rgb = MODEL_RGB[key] ?? SLATE5;
    const lbl = MODEL_LABELS[key] ?? key;
    hBar(doc, M, y, CW, score, lbl, rgb, 36);
    // best/worst badge
    if (modelEntries.length > 1) {
      const scores = modelEntries.map(([,v]) => v);
      const isBest  = score === Math.max(...scores) && i === modelEntries.findIndex(([,v]) => v === Math.max(...scores));
      const isWorst = score === Math.min(...scores) && i === modelEntries.findIndex(([,v]) => v === Math.min(...scores));
      if (isBest)  chip(doc, M + CW - 14, y + 4, "Best",  EMERALD,        [209,250,229]);
      if (isWorst) chip(doc, M + CW - 10, y + 4, "Low",   SLATE5,         [241,245,249]);
    }
    y += 10;
  });
  y += 4;

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 2 — COMPETITOR COMPARISON
  // ════════════════════════════════════════════════════════════════════════
  if (hasComps) {
    need(14 + (compEntries.length + 1) * 11 + 4);
    divider(doc, y, W); y += 5;
    secHead(doc, "Brand Comparison", y, W); y += 10;

    // User's brand first
    hBar(doc, M, y, CW, sc, `${san(data.brand)} (YOU)`, INDIGO_MID, 48);
    // YOU badge
    chip(doc, W - M - 16, y + 4, "YOU", WHITE, INDIGO_MID);
    y += 10;

    compEntries.forEach(([name, cdata], i) => {
      need(11);
      hBar(doc, M, y, CW, cdata.overall, san(name), COMP_RGB[i] ?? SLATE5, 48);
      y += 10;
    });

    // Per-model competitor table
    const allModels = data.active_models;
    if (allModels.length > 0 && compEntries.length > 0) {
      y += 3;
      need(8 + (compEntries.length + 2) * 8 + 4);
      divider(doc, y, W); y += 5;
      secHead(doc, "Per-Model Breakdown", y, W); y += 10;

      // Table header
      const colNames = ["Brand", ...allModels.map(m => MODEL_LABELS[m] ?? m), "Overall"];
      const firstColW = 38;
      const restColW = (CW - firstColW) / (colNames.length - 1);

      setFill(doc, SLATE9); doc.roundedRect(M, y - 1, CW, 7, 2, 2, "F");
      setFont(doc, "bold", 7.5); setTxt(doc, WHITE);
      doc.text(colNames[0], M + 3, y + 4);
      colNames.slice(1).forEach((col, ci) => {
        const cx = M + firstColW + restColW * ci + restColW / 2;
        doc.text(col, cx, y + 4, { align: "center" });
      });
      y += 9;

      // Rows: user brand + competitors
      const allRows = [
        { name: san(data.brand), isYou: true, perModel: data.model_scores, overall: sc },
        ...compEntries.map(([name, cd]) => ({
          name: san(name), isYou: false, perModel: cd.per_model, overall: cd.overall,
        })),
      ];

      allRows.forEach((row, ri) => {
        need(8);
        if (ri % 2 === 0) { setFill(doc, [245, 247, 252]); doc.rect(M, y - 1, CW, 7, "F"); }
        setFont(doc, row.isYou ? "bold" : "normal", 7.5);
        setTxt(doc, row.isYou ? INDIGO_MID : SLATE7);
        doc.text(row.isYou ? `${row.name} (YOU)` : row.name, M + 3, y + 4);

        allModels.forEach((m, mi) => {
          const ms = row.perModel[m];
          const cx = M + firstColW + restColW * mi + restColW / 2;
          if (ms !== undefined) {
            const mCol = scoreColor(ms);
            setFont(doc, "bold", 8); setTxt(doc, mCol);
            doc.text(ms.toFixed(0), cx, y + 4, { align: "center" });
          } else {
            setFont(doc, "normal", 8); setTxt(doc, SLATE2);
            doc.text("-", cx, y + 4, { align: "center" });
          }
        });

        // Overall col
        const ocx = M + firstColW + restColW * allModels.length + restColW / 2;
        setFont(doc, "bold", 8.5); setTxt(doc, scoreColor(row.overall));
        doc.text(row.overall.toFixed(0), ocx, y + 4, { align: "center" });
        y += 7;
      });
      y += 4;
    } else {
      y += 4;
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 3 — BRAND SENTIMENT
  // ════════════════════════════════════════════════════════════════════════
  if (hasSentiment && data.sentiment_summary) {
    const s = data.sentiment_summary;
    const total = s.positive + s.neutral + s.negative;
    if (total > 0) {
      need(10 + 3 * 10 + 12);
      divider(doc, y, W); y += 5;
      secHead(doc, "Brand Sentiment", y, W); y += 10;

      const pct = (n: number) => Math.round((n / total) * 100);
      const sentRows = [
        { label: "Positive", count: s.positive, pct: pct(s.positive), color: EMERALD },
        { label: "Neutral",  count: s.neutral,  pct: pct(s.neutral),  color: SLATE5  },
        { label: "Negative", count: s.negative, pct: pct(s.negative), color: ROSE    },
      ];
      const dominant = s.positive >= s.neutral && s.positive >= s.negative ? "Positive"
        : s.negative > s.positive ? "Negative" : "Neutral";

      // Dominant badge
      const domCol = dominant === "Positive" ? EMERALD : dominant === "Negative" ? ROSE : SLATE5;
      chip(doc, W - M - 30, y - 8, `Overall: ${dominant}`, domCol, SLATE1);

      sentRows.forEach(({ label, count, pct: p, color }) => {
        need(10);
        hBar(doc, M, y, CW - 20, p, `${label}  (${count})`, color, 36);
        setFont(doc, "normal", 7.5); setTxt(doc, SLATE5);
        doc.text(`${p}%`, M + CW - 17, y + 4);
        y += 9;
      });

      // Sentiment summary callout
      y += 2;
      need(10);
      setFill(doc, SLATE1); doc.roundedRect(M, y, CW, 9, 2, 2, "F");
      setDraw(doc, SLATE2); doc.roundedRect(M, y, CW, 9, 2, 2, "S");
      setFont(doc, "normal", 8); setTxt(doc, SLATE7);
      const sentMsg = `AI models describe ${san(data.brand)} ${dominant.toLowerCase()}ly in ${pct(dominant === "Positive" ? s.positive : dominant === "Negative" ? s.negative : s.neutral)}% of responses where the brand is mentioned.`;
      doc.text(san(sentMsg), M + 5, y + 5.5);
      y += 14;
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 4 — KEY FINDINGS
  // ════════════════════════════════════════════════════════════════════════
  if (data.insights.length > 0) {
    need(14);
    divider(doc, y, W); y += 5;
    secHead(doc, "Key Findings", y, W); y += 10;

    data.insights.forEach((insight, i) => {
      const lines = doc.splitTextToSize(san(insight), CW - 12);
      need(lines.length * LH + 5);

      // Numbered circle
      setFill(doc, INDIGO_MID); doc.circle(M + 3, y + 2.5, 3, "F");
      setFont(doc, "bold", 7); setTxt(doc, WHITE);
      doc.text(`${i + 1}`, M + 3, y + 3.5, { align: "center" });

      setFont(doc, "normal", 9); setTxt(doc, SLATE7);
      doc.text(lines, M + 9, y + 3);
      y += lines.length * LH + 4;
    });
    y += 4;
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 5 — PER-MODEL AI STRATEGY
  // ════════════════════════════════════════════════════════════════════════
  if (perModelPlaybook && perModelPlaybook.length > 0) {
    need(18);
    divider(doc, y, W); y += 5;
    secHead(doc, "Per-Model AI Strategy Playbook", y, W); y += 10;

    const STATUS_COLOR: Record<string, [number,number,number]> = {
      critical: ROSE, weak: AMBER, good: EMERALD, strong: [22, 163, 74],
    };
    const STATUS_LABEL: Record<string, string> = {
      critical: "CRITICAL", weak: "WEAK", good: "GOOD", strong: "STRONG",
    };

    perModelPlaybook.forEach((mp) => {
      const rgb = MODEL_RGB[mp.model] ?? (SLATE5 as [number,number,number]);
      const lbl = MODEL_LABELS[mp.model] ?? mp.model;
      const statusCol = STATUS_COLOR[mp.status] ?? AMBER;
      const statusLbl = STATUS_LABEL[mp.status] ?? mp.status.toUpperCase();

      const whyLines = doc.splitTextToSize(san(mp.why), CW - 14);
      const actionLines = mp.actions.map(a => doc.splitTextToSize(san(a), CW - 20));
      const blockH = 10 + 5 + whyLines.length * LH + 4 + 5 + actionLines.reduce((s, l) => s + l.length * LH + 2, 0) + 4;

      need(blockH + 8);

      // Card
      setFill(doc, SLATE1); doc.roundedRect(M, y - 2, CW, blockH + 2, 2.5, 2.5, "F");
      // Model color left stripe
      setFill(doc, rgb); doc.roundedRect(M, y - 2, 5, blockH + 2, 2, 2, "F");
      setFill(doc, rgb); doc.rect(M + 3, y - 2, 2, blockH + 2, "F");

      // Model name + score header
      setFont(doc, "bold", 11); setTxt(doc, rgb);
      doc.text(lbl, M + 10, y + 4.5);
      const lblW = doc.getTextWidth(lbl);

      // Status badge
      chip(doc, M + 12 + lblW, y + 4.5, statusLbl, statusCol, SLATE1);

      // Score right
      setFont(doc, "bold", 13); setTxt(doc, rgb);
      doc.text(`${mp.score.toFixed(0)}`, W - M - 5, y + 5, { align: "right" });
      setFont(doc, "normal", 7); setTxt(doc, SLATE5);
      doc.text("/100", W - M + 1, y + 5, { align: "right" });

      y += 9;

      // Score bar
      const bx = M + 10; const bw = CW - 14;
      setFill(doc, SLATE2); doc.roundedRect(bx, y, bw, 3, 1, 1, "F");
      setFill(doc, rgb); doc.roundedRect(bx, y, Math.max(3, (mp.score / 100) * bw), 3, 1, 1, "F");
      y += 7;

      // Headline
      setFont(doc, "bold", 8.5); setTxt(doc, SLATE7);
      doc.text(san(mp.headline), M + 10, y); y += 5;

      // Why
      setFont(doc, "bold", 7); setTxt(doc, SLATE5);
      doc.text("WHY THIS MODEL BEHAVES THIS WAY:", M + 10, y); y += 4;
      setFont(doc, "normal", 8); setTxt(doc, SLATE7);
      doc.text(whyLines, M + 10, y);
      y += whyLines.length * LH + 3;

      // Actions
      setFont(doc, "bold", 7); setTxt(doc, rgb);
      doc.text(`ACTION STEPS FOR ${lbl.toUpperCase()}:`, M + 10, y); y += 4;

      actionLines.forEach((lines, j) => {
        need(lines.length * LH + 2);
        setFill(doc, rgb); doc.circle(M + 14, y + 1.5, 2, "F");
        setFont(doc, "bold", 7); setTxt(doc, WHITE);
        doc.text(`${j + 1}`, M + 14, y + 2.5, { align: "center" });
        setFont(doc, "normal", 8); setTxt(doc, SLATE7);
        doc.text(lines, M + 19, y + 2.5);
        y += Math.max(lines.length * LH, 5) + 2;
      });

      y += 8;
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 6 — PRIORITY ACTIONS
  // ════════════════════════════════════════════════════════════════════════
  if (recs.length > 0) {
    need(18);
    divider(doc, y, W); y += 5;
    secHead(doc, `Priority Actions — ${recs.length} Cross-Model Recommendations`, y, W); y += 12;

    const PCOL: Record<string, [number,number,number]> = { high: ROSE, medium: AMBER, low: EMERALD };
    const PLBL: Record<string, string> = { high: "HIGH IMPACT", medium: "MEDIUM", low: "QUICK WIN" };
    const CLBL: Record<string, string> = { content: "Content", platform: "Platform", seo: "SEO", pr: "PR & Brand" };

    recs.forEach((rec, i) => {
      const pColor = PCOL[rec.priority] ?? SLATE5;
      const pLabel = PLBL[rec.priority] ?? rec.priority.toUpperCase();
      const catLabel = CLBL[rec.category] ?? san(rec.category);
      const descLines  = doc.splitTextToSize(san(rec.description), CW - 12);
      const actionLines = rec.actions.map(a => doc.splitTextToSize(`${san(a)}`, CW - 18));
      const blockH = 9 + descLines.length * LH + 5 + 4 + actionLines.reduce((a, l) => a + l.length * LH, 0) + 4;

      need(blockH + 6);

      // Card background
      setFill(doc, SLATE1); doc.roundedRect(M, y - 2, CW, blockH + 4, 2.5, 2.5, "F");
      // Priority left stripe
      setFill(doc, pColor); doc.roundedRect(M, y - 2, 4, blockH + 4, 2, 2, "F");
      setFill(doc, pColor); doc.rect(M + 2, y - 2, 2, blockH + 4, "F");

      // Number circle
      setFill(doc, SLATE9); doc.circle(M + 12, y + 3, 4, "F");
      setFont(doc, "bold", 8.5); setTxt(doc, WHITE);
      doc.text(`${i + 1}`, M + 12, y + 4.5, { align: "center" });

      // Title
      setFont(doc, "bold", 11); setTxt(doc, SLATE9);
      const maxTW = CW - 55;
      const titleLines = doc.splitTextToSize(san(rec.title), maxTW);
      doc.text(titleLines[0], M + 19, y + 4.5);

      // Priority chip (right aligned)
      const chipX = W - M - doc.getTextWidth(pLabel) - 6;
      setFont(doc, "bold", 7); setTxt(doc, pColor);
      const tw = doc.getTextWidth(pLabel) + 4;
      setFill(doc, [...pColor.map(v => Math.min(255, v + 180))] as [number,number,number]);
      doc.roundedRect(chipX - 2, y - 0.5, tw, 5, 1.5, 1.5, "F");
      setTxt(doc, pColor);
      doc.text(pLabel, chipX, y + 3.5);

      // Category label
      setFont(doc, "normal", 7); setTxt(doc, SLATE5);
      doc.text(catLabel, chipX - doc.getTextWidth(catLabel) - 6, y + 3.5);

      y += 9;

      // Description
      setFont(doc, "normal", 8.5); setTxt(doc, SLATE7);
      doc.text(descLines, M + 8, y);
      y += descLines.length * LH + 4;

      // Action steps
      setFont(doc, "bold", 7.5); setTxt(doc, SLATE5);
      doc.text("ACTION STEPS:", M + 8, y); y += 4.5;

      actionLines.forEach((lines, j) => {
        need(lines.length * LH + 1);
        // Step number dot
        setFill(doc, INDIGO_MID); doc.circle(M + 11, y + 1.5, 2, "F");
        setFont(doc, "bold", 7); setTxt(doc, WHITE);
        doc.text(`${j + 1}`, M + 11, y + 2.5, { align: "center" });
        setFont(doc, "normal", 8.5); setTxt(doc, SLATE7);
        doc.text(lines, M + 16, y + 2.5);
        y += Math.max(lines.length * LH, 5) + 1.5;
      });

      y += 8;
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 6 — PROMPT RESULTS TABLE (Appendix)
  // ════════════════════════════════════════════════════════════════════════
  if (data.raw_results.length > 0) {
    need(18);
    divider(doc, y, W); y += 5;
    secHead(doc, "Prompt Results — Mention & Sentiment", y, W); y += 10;

    const models = data.active_models;
    // Column widths
    const promptColW = 65;
    const modelColW  = Math.min(20, (CW - promptColW) / models.length);

    // Header row
    setFill(doc, SLATE9); doc.roundedRect(M, y - 1, CW, 7, 2, 2, "F");
    setFont(doc, "bold", 7.5); setTxt(doc, WHITE);
    doc.text("Prompt", M + 3, y + 4);
    models.forEach((m, mi) => {
      const cx = M + promptColW + modelColW * mi + modelColW / 2;
      doc.text((MODEL_LABELS[m] ?? m).slice(0, 7), cx, y + 4, { align: "center" });
    });
    y += 8;

    data.raw_results.forEach((r, ri) => {
      // Truncate prompt
      const promptText = san(r.prompt).length > 55 ? san(r.prompt).slice(0, 52) + "..." : san(r.prompt);
      need(8);
      if (ri % 2 === 0) { setFill(doc, [245, 247, 252]); doc.rect(M, y - 1, CW, 7, "F"); }

      setFont(doc, "normal", 7.5); setTxt(doc, SLATE7);
      doc.text(promptText, M + 3, y + 4);

      models.forEach((m, mi) => {
        const mr = r.model_responses[m];
        const cx = M + promptColW + modelColW * mi + modelColW / 2;
        if (!mr) { setFont(doc, "normal", 7); setTxt(doc, SLATE2); doc.text("-", cx, y + 4, { align: "center" }); return; }
        const mentioned = (mr.mentions[data.brand] ?? 0) > 0;
        if (!mentioned) { setFont(doc, "normal", 7); setTxt(doc, SLATE5); doc.text("x", cx, y + 4, { align: "center" }); return; }
        const sentCol = mr.sentiment === "positive" ? EMERALD : mr.sentiment === "negative" ? ROSE : SLATE5;
        setFont(doc, "bold", 7); setTxt(doc, sentCol);
        const sentMark = mr.sentiment === "positive" ? "(+)" : mr.sentiment === "negative" ? "(-)" : "(~)";
        doc.text(sentMark, cx, y + 4, { align: "center" });
      });

      y += 7;
    });

    // Legend
    y += 4;
    need(8);
    setFont(doc, "normal", 7); setTxt(doc, SLATE5);
    doc.text("Legend:  x = not mentioned  (~) = mentioned (neutral)  (+) = positive  (-) = negative", M, y);
    y += 6;
  }

  // ════════════════════════════════════════════════════════════════════════
  // FINAL FOOTER
  // ════════════════════════════════════════════════════════════════════════
  pageFooter(doc, W, H, page);

  doc.save(`VisibilityRadar_${san(data.brand)}_${Date.now()}.pdf`);
}

// ── Legacy aliases ─────────────────────────────────────────────────────────
export async function exportDashboardPdf(data: AnalyzeResponse, market = "global") {
  return exportFullReport(data, market, []);
}
export async function exportRecommendationsPdf(
  brand: string, recommendations: Recommendation[], market = "global"
) {
  const stub: AnalyzeResponse = {
    brand, overall_score: 0, model_scores: {}, competitor_scores: {},
    insights: [], active_models: [], raw_results: [],
    sentiment_summary: { positive: 0, neutral: 0, negative: 0 },
  };
  return exportFullReport(stub, market, recommendations);
}
export async function generateRecommendationsPdf(
  brand: string, _score: number, market: string,
  _model_scores: Record<string, number>, recommendations: Recommendation[]
) {
  return exportRecommendationsPdf(brand, recommendations, market);
}
