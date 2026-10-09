# Fekk — vidéo motion design (20 s)

Ce dossier contient une vidéo verticale (1080×1920, 60 fps, avec son) pour **Fekk**, une app sénégalaise
de déclaration et de recherche d'objets perdus. *Fekk*, en wolof, veut dire « trouver ».

- Rendu final : [`out/fekk-final.mp4`](out/fekk-final.mp4). Affiche : [`out/fekk-poster.png`](out/fekk-poster.png).
- Brief, direction artistique, découpage et cue sheet : [`STORYBOARD.md`](STORYBOARD.md).

## Comment c'est fait

Il n'y a ni After Effects, ni assets externes. Tout est du code :

- **Image** : les illustrations sont en SVG et en HTML inline. Elles sont animées par une **timeline GSAP unique,
  en pause**, avec les plugins CustomEase, DrawSVG, MorphSVG, MotionPath et SplitText.
- **Rendu** : Playwright/Chromium seek la timeline image par image (`window.__seek(t)`). Chaque capture PNG est
  envoyée dans ffmpeg (H.264, CRF 16). Le rendu est 100 % déterministe : pas d'animation CSS, pas de
  `Math.random`, et un PRNG seedé pour les particules.
- **Son** : `audio/synth.mjs` est un synthétiseur écrit en JavaScript pur, sans dépendance. Il produit une
  afro-house à 120 BPM inspirée du sabar (kora en Karplus-Strong, toms sabar, basse sub), plus le sound
  design synchronisé sur l'image. La chaîne comprend biquads, sidechain, Freeverb, compresseur et limiteur
  true-peak, et sort à -14 LUFS.

| Scène | Fichier | Temps |
|---|---|---|
| L'instant : car rapide, chute du téléphone | `scenes/s1-moment.js` | 0 → 3.5 |
| Perdus : typo cinétique, carte de Dakar | `scenes/s2-perdus.js` | 3.5 → 7 |
| L'app : déclarer, la communauté cherche, Fekk trouve | `scenes/s3-app.js` | 7 → 15.5 |
| Retrouvailles, « Jërëjëf ! », carton final | `scenes/s5-retrouvailles.js` | 15.5 → 20 |

## Commandes

```bash
npm install
npm run audio                                   # → audio/fekk.wav
npm run render -- --fps 60 --out out/fekk-final.mp4
node tools/still.mjs --from 7 --to 9 --step 0.25 --sheet s3   # planche contact
node tools/still.mjs 12.5 --safe                # image + zones de sécurité TikTok/Reels
```

Pour une prévisualisation dans le navigateur, servir le dossier (`npx serve .`) puis ouvrir
`index.html?t=12.5` (ajouter `&scene=s3` pour isoler une scène).
