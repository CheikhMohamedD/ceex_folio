import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { Category } from "@/lib/design/categories";

export const SHARE_SIZE = { width: 1200, height: 630 };

/** Couleurs du thème clair (Satori ne lit pas les variables CSS du site). */
const COLORS = {
  paper: "#f2eee6",
  sheet: "#fbf9f5",
  ink: "#1a1a1a",
  inkSoft: "#5a544a",
  stamp: "#a8401f",
  web: "#24456e",
  mobile: "#1e5546",
  design: "#6a3d63",
  motion: "#7a4f12",
} as const;

const FONTS_DIR = path.join(process.cwd(), "src/app/fonts/og");

async function fonts() {
  const [display, mono] = await Promise.all([
    readFile(path.join(FONTS_DIR, "space-grotesk-700.ttf")),
    readFile(path.join(FONTS_DIR, "ibm-plex-mono-500.ttf")),
  ]);
  return [
    { name: "Space Grotesk", data: display, weight: 700 as const, style: "normal" as const },
    { name: "IBM Plex Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

type ShareImageProps = {
  /** Ligne mono du haut : « CEEXFOLIO · DOSSIER N° 01 · WEB ». */
  masthead: string;
  title: string;
  summary: string;
  footer: string;
  category?: Category;
};

/** Image de partage aux couleurs « Dossier » : feuille, languette, titre, signature. */
export async function shareImage({ masthead, title, summary, footer, category }: ShareImageProps) {
  const accent = category ? COLORS[category] : COLORS.stamp;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: COLORS.paper,
        padding: 48,
        fontFamily: "Space Grotesk",
        color: COLORS.ink,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: COLORS.sheet,
          border: `3px solid ${COLORS.ink}`,
          borderTop: `14px solid ${accent}`,
          padding: "40px 56px",
          boxShadow: "0 10px 0 rgba(26, 26, 26, 0.14)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "IBM Plex Mono",
            fontSize: 24,
            letterSpacing: 2,
            color: COLORS.inkSoft,
            borderBottom: `3px solid ${COLORS.ink}`,
            paddingBottom: 14,
          }}
        >
          {masthead.toUpperCase()}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: title.length > 24 ? 72 : 96, lineHeight: 1, display: "flex" }}>
            {title}
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.3, color: COLORS.inkSoft, display: "flex" }}>
            {summary}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontFamily: "IBM Plex Mono",
            fontSize: 24,
            color: COLORS.inkSoft,
          }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 9, background: accent }} />
          {footer}
        </div>
      </div>
    </div>,
    { ...SHARE_SIZE, fonts: await fonts() },
  );
}
