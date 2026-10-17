"""Allège les polices Fontsource servies par le site.

Pour chaque police : sous-ensemble latin de Fontsource (plus les flèches du texte),
sans les instructions de hinting, et axe de graisse ramené aux graisses utilisées.
Les fichiers produits vont dans src/app/fonts/, avec la licence SIL OFL de chaque police.

Usage, après une mise à jour des paquets @fontsource :
    python3 -m pip install fonttools brotli
    python3 scripts/subset-fonts.py
"""

import json
import shutil
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "app" / "fonts"

# (fichier produit, paquet, fichier source, plage de graisse à garder ou None si statique)
FONTS = [
    ("space-grotesk.woff2", "@fontsource-variable/space-grotesk",
     "space-grotesk-latin-wght-normal.woff2", (400, 700)),
    ("ibm-plex-sans.woff2", "@fontsource-variable/ibm-plex-sans",
     "ibm-plex-sans-latin-wght-normal.woff2", (400, 700)),
    ("ibm-plex-mono.woff2", "@fontsource/ibm-plex-mono",
     "ibm-plex-mono-latin-500-normal.woff2", None),
    ("caveat.woff2", "@fontsource/caveat", "caveat-latin-600-normal.woff2", None),
]

# Flèches ← ↑ → ↓ : le texte du site en contient, le sous-ensemble latin seulement deux.
EXTRA_UNICODES = "U+2190-2193"

# Espace fine insécable (U+202F) de la typographie française, avant « : ; ? ! » et dans
# les guillemets : aucune de ces polices ne la dessine. Sans elle, chaque occurrence
# part chercher une police système, ce qui alourdit la mise en page. Elle reprend le
# glyphe de l'espace fine (U+2009), ou à défaut de l'espace.
NARROW_NBSP = 0x202F
NARROW_NBSP_SOURCES = (0x2009, 0x0020)


def add_narrow_nbsp(font: TTFont) -> None:
    cmap = font.getBestCmap()
    if NARROW_NBSP in cmap:
        return
    glyph = next(cmap[code] for code in NARROW_NBSP_SOURCES if code in cmap)
    for table in font["cmap"].tables:
        if table.isUnicode():
            table.cmap[NARROW_NBSP] = glyph

# Images de partage (next/og) : Satori ne lit ni le WOFF2 ni les polices variables,
# d'où des TTF statiques, une graisse chacun.
OG_FONTS = [
    ("space-grotesk-700.ttf", "@fontsource-variable/space-grotesk",
     "space-grotesk-latin-wght-normal.woff2", 700),
    ("ibm-plex-mono-500.ttf", "@fontsource/ibm-plex-mono",
     "ibm-plex-mono-latin-500-normal.woff2", None),
]


def unicodes(package_dir: Path) -> list[int]:
    ranges = json.loads((package_dir / "unicode.json").read_text())["latin"]
    return subset.parse_unicodes(f"{ranges},{EXTRA_UNICODES}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for output, package, source, weights in FONTS:
        package_dir = ROOT / "node_modules" / package
        font = TTFont(package_dir / "files" / source, recalcTimestamp=False)

        options = subset.Options()
        options.layout_features = ["*"]  # garde les alternates de Caveat, le crénage, les ligatures
        options.hinting = False
        options.desubroutinize = True
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=unicodes(package_dir))
        subsetter.subset(font)
        if weights is not None:
            font = instancer.instantiateVariableFont(font, {"wght": weights})
        add_narrow_nbsp(font)

        font.flavor = "woff2"
        font.save(OUT / output)

        license_name = output.replace(".woff2", "-OFL.txt")
        shutil.copyfile(package_dir / "LICENSE", OUT / license_name)
        before = (package_dir / "files" / source).stat().st_size
        after = (OUT / output).stat().st_size
        print(f"{output}: {before / 1024:.1f} Ko -> {after / 1024:.1f} Ko")


def og_fonts() -> None:
    out = OUT / "og"
    out.mkdir(parents=True, exist_ok=True)
    for output, package, source, weight in OG_FONTS:
        package_dir = ROOT / "node_modules" / package
        font = TTFont(package_dir / "files" / source, recalcTimestamp=False)
        if weight is not None:
            font = instancer.instantiateVariableFont(font, {"wght": weight})
        add_narrow_nbsp(font)
        font.flavor = None
        font.save(out / output)
        print(f"og/{output}: {(out / output).stat().st_size / 1024:.1f} Ko")


if __name__ == "__main__":
    main()
    og_fonts()
