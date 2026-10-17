/**
 * Brief client en PDF, généré dans le navigateur avec jsPDF. jsPDF n'est chargé
 * qu'au clic sur « Télécharger » : il ne pèse rien sur le parcours lui-même.
 * Même moteur, plus tard, pour la fiche de cadrage des Coulisses.
 */
export type BriefSection = { label: string; value: string };

export type Brief = {
  title: string;
  subtitle: string;
  date: string;
  sections: BriefSection[];
  footer: string;
};

// Couleurs du design system « Dossier » : encre et rouge du tampon (stamp-strong).
const INK: [number, number, number] = [26, 26, 26];
const SOFT: [number, number, number] = [90, 84, 74];
const STAMP: [number, number, number] = [168, 64, 31];

const PAGE = { width: 210, height: 297, margin: 20 } as const;
const BOTTOM = PAGE.height - 24;

/**
 * Les polices standard du PDF ne connaissent que l'encodage WinAnsi : les espaces fines
 * de la typographie française deviennent des espaces, les flèches des tirets, et tout
 * autre caractère hors de cet encodage disparaît plutôt que de s'afficher en charabia.
 */
export function toWinAnsi(text: string): string {
  return text
    .replace(/[   ]/g, " ")
    .replace(/[→⇒]/g, "->")
    .replace(/[←⇐]/g, "<-")
    .replace(/[^\n\x20-\x7e -ÿŒœŠšŸŽžƒˆ˜–—‘-‚“-„†-•…‰‹›€™]/g, "");
}

export async function downloadBrief(brief: Brief, fileName: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const width = PAGE.width - PAGE.margin * 2;
  let y = PAGE.margin;

  doc.setTextColor(...STAMP);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CEEXFOLIO", PAGE.margin, y);
  y += 9;

  doc.setTextColor(...INK);
  doc.setFontSize(22);
  doc.text(toWinAnsi(brief.title), PAGE.margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...SOFT);
  doc.text(toWinAnsi(`${brief.subtitle} · ${brief.date}`), PAGE.margin, y);
  y += 5;

  doc.setDrawColor(...INK);
  doc.setLineWidth(0.4);
  doc.line(PAGE.margin, y, PAGE.margin + width, y);
  y += 9;

  for (const section of brief.sections) {
    const lines = doc.splitTextToSize(toWinAnsi(section.value), width) as string[];
    const height = 6 + lines.length * 5.2 + 5;
    if (y + Math.min(height, 30) > BOTTOM) {
      doc.addPage();
      y = PAGE.margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...SOFT);
    doc.text(toWinAnsi(section.label.toUpperCase()), PAGE.margin, y);
    y += 5.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    for (const line of lines) {
      if (y > BOTTOM) {
        doc.addPage();
        y = PAGE.margin;
      }
      doc.text(line, PAGE.margin, y);
      y += 5.2;
    }
    y += 5;
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...SOFT);
    doc.text(toWinAnsi(`${brief.footer} · ${page}/${pages}`), PAGE.margin, PAGE.height - 12);
  }

  doc.save(fileName);
}
