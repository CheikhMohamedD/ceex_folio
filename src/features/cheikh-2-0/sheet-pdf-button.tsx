"use client";

import { FileDown } from "lucide-react";
import { useState, useTransition } from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import type { FramingPdfData } from "@/lib/pdf/framing";

type SheetPdfButtonProps = {
  data: FramingPdfData;
  fileName: string;
  label: string;
  pendingLabel: string;
  failedLabel: string;
};

/** Retélécharge le dossier d'une fiche de l'historique ; jsPDF n'arrive qu'au clic. */
export function SheetPdfButton({
  data,
  fileName,
  label,
  pendingLabel,
  failedLabel,
}: SheetPdfButtonProps) {
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            try {
              const { downloadFramingPdf } = await import("@/lib/pdf/framing");
              await downloadFramingPdf(data, fileName);
              setFailed(false);
            } catch {
              setFailed(true);
            }
          })
        }
        className={buttonClasses("secondary")}
      >
        <FileDown size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
        {pending ? pendingLabel : label}
      </button>
      <p aria-live="polite" className="text-sm font-medium text-error empty:hidden">
        {failed ? failedLabel : ""}
      </p>
    </div>
  );
}
