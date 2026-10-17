import type { FramingPdfData } from "@/lib/pdf/framing";

/** Les textes de la page que le dossier PDF reprend : champs, questions, verdicts, semaines. */
export type PdfCopy = FramingPdfData["copy"];

/** Date d'export écrite en toutes lettres, comme dans l'outil d'origine. */
export function pdfDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Dakar",
  });
}
