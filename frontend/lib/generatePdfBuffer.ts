// Server-side PDF generation — returns Buffer for email attachment
// Same visual logic as exportPdf.ts but outputs arraybuffer instead of saving

function sanitize(str: string): string {
  return str
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ü/g, "u").replace(/Ü/g, "U")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ç/g, "c").replace(/Ç/g, "C")
    .replace(/[^\x00-\x7E]/g, "?");
}


export interface RecommendationItem {
  title: string;
  priority: string;
  category: string;
  description: string;
  actions: string[];
}

export async function generateRecommendationsPdfBuffer(
  brand: string,
  overall_score: number,
  market: string,
  model_scores: Record<string, number>,
  recommendations: RecommendationItem[]
): Promise<Buffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  let y = 32;
  let page = 1;

  function drawHeader() {
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pw, 24, "F");
    // Logo: "Visibility" dark slate + "Radar" indigo
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Visibility", 12, 15);
    doc.setTextColor(99, 102, 241);
    doc.text("Radar", 12 + doc.getTextWidth("Visibility"), 15);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(130, 130, 130);
    doc.text(`${sanitize(brand)} — AI Visibility Playbook`, pw - 12, 15, { align: "right" });
    doc.setDrawColor(220, 220, 220);
    doc.line(0, 24, pw, 24);
  }

  function drawFooter() {
    doc.setDrawColor(220, 220, 220);
    doc.line(12, ph - 14, pw - 12, ph - 14);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(170, 170, 170);
    doc.text(`Page ${page}`, pw / 2, ph - 6, { align: "center" });
    doc.text("VisibilityRadar", 12, ph - 6);
    doc.text(new Date().toLocaleDateString("en-GB"), pw - 12, ph - 6, { align: "right" });
  }

  function addPage() {
    doc.addPage();
    page++;
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pw, ph, "F");
    drawHeader();
    drawFooter();
    y = 32;
  }

  function checkY(needed = 20) {
    if (y + needed > ph - 20) addPage();
  }

  // Init first page
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pw, ph, "F");
  drawHeader();
  drawFooter();

  // ── Cover section ──────────────────────────────────────────────────────
  // Dark hero banner
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(12, y, pw - 24, 52, 4, 4, "F");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Your AI Visibility Playbook", 22, y + 14);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(`${sanitize(brand)}  ·  ${market.toUpperCase()} market  ·  ${recommendations.length} recommendations`, 22, y + 23);

  // Score in banner
  const sc = overall_score;
  const scoreColor: [number,number,number] = sc >= 60 ? [52,211,153] : sc >= 30 ? [251,191,36] : [239,68,68];
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...scoreColor);
  doc.text(`${sc.toFixed(0)}`, pw - 44, y + 28);
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text("/100", pw - 44 + doc.getTextWidth(`${sc.toFixed(0)}`) + 2, y + 28);
  doc.setFontSize(8);
  doc.text("AI SCORE", pw - 44, y + 35);

  y += 60;

  // ── Model scores ────────────────────────────────────────────────────────
  checkY(10 + Object.keys(model_scores).length * 11);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("Per-Model Scores", 12, y);
  y += 7;

  Object.entries(model_scores).forEach(([model, score]) => {
    checkY(11);
    const mc: [number,number,number] = score >= 60 ? [52,211,153] : score >= 30 ? [251,191,36] : [239,68,68];
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(12, y, pw - 55, 4, 1.5, 1.5, "F");
    const fw = Math.max(3, (score / 100) * (pw - 55));
    doc.setFillColor(...mc);
    doc.roundedRect(12, y, fw, 4, 1.5, 1.5, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(70, 70, 70);
    doc.text(model.toUpperCase(), 12, y - 1.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...mc);
    doc.text(`${score.toFixed(0)}`, pw - 38, y + 3);
    y += 11;
  });

  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.line(12, y, pw - 12, y);
  y += 10;

  // ── Recommendations ─────────────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(`Action Plan — ${recommendations.length} Recommendations`, 12, y);
  y += 10;

  const PRIORITY_COLOR: Record<string, [number,number,number]> = {
    high: [239,68,68], medium: [251,191,36], low: [52,211,153],
  };
  const PRIORITY_LABEL: Record<string, string> = {
    high: "High Impact", medium: "Medium", low: "Quick Win",
  };
  const CATEGORY_LABEL: Record<string, string> = {
    content: "Content", platform: "Platform", seo: "SEO", pr: "PR & Brand",
  };

  recommendations.forEach((rec, i) => {
    const pColor = PRIORITY_COLOR[rec.priority] ?? [148,163,184];
    const pLabel = PRIORITY_LABEL[rec.priority] ?? rec.priority;
    const catLabel = CATEGORY_LABEL[rec.category] ?? rec.category;
    const descLines = doc.splitTextToSize(sanitize(rec.description), pw - 38);
    const actionLines = rec.actions.reduce((acc, a) => acc + doc.splitTextToSize(sanitize(a), pw - 42).length, 0);
    const blockH = 10 + descLines.length * 5 + 8 + actionLines * 5 + 10;

    checkY(blockH + 4);

    // Card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(12, y - 3, pw - 24, blockH, 3, 3, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(12, y - 3, pw - 24, blockH, 3, 3, "S");

    // Left color bar
    doc.setFillColor(...pColor);
    doc.roundedRect(12, y - 3, 4, blockH, 2, 2, "F");

    // Number circle
    doc.setFillColor(15, 23, 42);
    doc.circle(26, y + 3, 4, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${i + 1}`, 26, y + 4.5, { align: "center" });

    // Title
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(sanitize(rec.title), 34, y + 4.5);

    // Badges
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...pColor);
    doc.text(pLabel, pw - 52, y + 4.5);
    doc.setTextColor(148, 163, 184);
    doc.text(catLabel, pw - 24, y + 4.5);
    y += 10;

    // Description
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(descLines, 20, y);
    y += descLines.length * 5 + 5;

    // Actions header
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(99, 102, 241);
    doc.text("ACTION STEPS:", 20, y);
    y += 5;

    // Actions
    rec.actions.forEach((action, j) => {
      const aLines = doc.splitTextToSize(`${j + 1}.  ${sanitize(action)}`, pw - 42);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(aLines, 24, y);
      y += aLines.length * 5;
    });

    y += 10;
  });

  // ── Final footer note ────────────────────────────────────────────────────
  checkY(16);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Generated by VisibilityRadar · visibilityradar.ai", pw / 2, y, { align: "center" });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
