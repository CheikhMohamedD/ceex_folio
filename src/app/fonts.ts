import localFont from "next/font/local";

// Polices servies par le site (Fontsource, licence SIL OFL) : aucun appel à Google,
// ni à la construction ni chez le visiteur. Sous-ensemble latin, qui couvre le français.

export const spaceGrotesk = localFont({
  src: "../../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
  weight: "300 700",
  variable: "--font-space-grotesk",
  display: "swap",
});

export const plexSans = localFont({
  src: "../../node_modules/@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2",
  weight: "100 700",
  variable: "--font-plex-sans",
  display: "swap",
});

// Métadonnées : petites capitales mono, jamais l'élément principal de l'écran, donc
// sans préchargement pour laisser la bande passante aux titres et au texte.
export const plexMono = localFont({
  src: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2",
  weight: "500",
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
});

// Annotations manuscrites : jamais critiques, donc sans préchargement.
export const caveat = localFont({
  src: "../../node_modules/@fontsource/caveat/files/caveat-latin-600-normal.woff2",
  weight: "600",
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

export const fontVariables = [spaceGrotesk, plexSans, plexMono, caveat]
  .map((font) => font.variable)
  .join(" ");
