import localFont from "next/font/local";

// Polices servies par le site (Fontsource, licence SIL OFL) : aucun appel à Google,
// ni à la construction ni chez le visiteur. Sous-ensemble latin, qui couvre le français,
// allégé par scripts/subset-fonts.py : sans hinting, graisses 400 à 700 seulement.

export const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk.woff2",
  weight: "400 700",
  variable: "--font-space-grotesk",
  display: "swap",
});

export const plexSans = localFont({
  src: "./fonts/ibm-plex-sans.woff2",
  weight: "400 700",
  variable: "--font-plex-sans",
  display: "swap",
});

// Métadonnées : petites capitales mono, jamais l'élément principal de l'écran, donc
// sans préchargement pour laisser la bande passante aux titres et au texte.
export const plexMono = localFont({
  src: "./fonts/ibm-plex-mono.woff2",
  weight: "500",
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
});

// Annotations manuscrites : jamais critiques, donc sans préchargement.
export const caveat = localFont({
  src: "./fonts/caveat.woff2",
  weight: "600",
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

export const fontVariables = [spaceGrotesk, plexSans, plexMono, caveat]
  .map((font) => font.variable)
  .join(" ");
