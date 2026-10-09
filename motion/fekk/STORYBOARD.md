# FEKK — « Ce qui se perd, se retrouve »

Une vidéo motion design de 20 secondes, au format vertical 1080×1920 (Reels, TikTok, Statuts WhatsApp).
Elle présente **Fekk**, une app sénégalaise pour déclarer et retrouver les objets perdus.
*Fekk*, en wolof, veut dire « trouver ».

Le message en une phrase : à Dakar, on perd son téléphone, sa carte d'identité ou ses clés en un instant ;
avec Fekk, la communauté les retrouve.

## Direction artistique

- **Style** : illustration flat « vector editorial » avec beaucoup de caractère. Aplats francs, ombres
  portées dures (pas de flou gris), formes géométriques arrondies, et typographie cinétique **massive**.
  Les références sont les vidéos de marque Headspace, Duolingo et Airbnb, la Stripe Sessions et
  l'affiche wax. Pas de dégradés « corporate » ternes : la lumière de Dakar à 18h, chaude et dorée.
- **Motifs sénégalais** (à doser, sans folklore cliché) : car rapide jaune et bleu avec ses ornements
  peints, chiffres et motifs wax géométriques, baobab en silhouette, lumière de fin d'après-midi,
  couleurs du drapeau (vert, jaune, rouge) en accents.
- **Palette** (dans `FEKK.C` et les variables CSS) :
  - Fonds : `ink #0B1210`, `night #10213A`, `dusk #2A2350`, `sand #F3E6CF`, `sand2 #E6CFA6`.
  - Chauds : `clay #C8643B`, `sunset #FF7A2F`.
  - Marque : `green #00853F` (primaire Fekk), `mint #2BD67B` (succès, états positifs).
  - Accents : `yellow #FDEF42`, `red #E31B23`, `blue #1F5FD1` (la coque du téléphone perdu).
- **Typographie** :
  - Display : `var(--display)`, Bricolage Grotesque Variable, graisse 700–800, interlettrage -0.03em,
    interlignage 0.92. Gros corps : 120 à 220px pour les mots-clés.
  - Interface et texte secondaire : `var(--ui)`, Inter Variable.
- **Zones de sécurité (réseaux sociaux)** : tout texte important reste dans x ∈ [90, 990] et
  y ∈ [220, 1540]. Vérifier avec `node tools/still.mjs <t> --safe`.
- **Mouvement** :
  - Courbes partagées (`lib/core.js`) : `fekk.snap` pour les entrées vives, `fekk.swift` pour les
    déplacements, `fekk.anticip` pour l'anticipation, `fekk.land` pour un atterrissage avec rebond.
  - Principes : overlap et follow-through, stagger systématique sur le texte (SplitText chars et words),
    squash & stretch sur les impacts, aucun élément parfaitement statique plus de 0,6 s (micro-dérive,
    respiration, parallaxe).
  - Le texte doit rester lisible au moins 0,8 s une fois posé.

## Contraintes techniques (OBLIGATOIRES)

- Tout est piloté par la timeline GSAP passée à `build(root, tl, ctx)`. **Interdit** : animations et
  transitions CSS, `setTimeout`, `requestAnimationFrame`, `Math.random()`, `Date`, vidéos et images
  externes. L'aléatoire passe par `FEKK.rng(seed)`.
- Chaque scène est un fichier `scenes/<id>.js` qui appelle `FEKK.scene({ id, start, end, build, onFrame? })`.
  - Le t=0 de `tl` correspond à `start`, et la couche n'est visible que pendant `[start, end)`.
  - Pour un canvas ou des particules, utiliser `onFrame(tLocal)`, qui doit être une fonction **pure
    du temps** : redessiner l'état complet à partir de tLocal, sans état accumulé.
  - Préfixer toutes les classes et tous les id avec l'id de la scène (`s1-…`) : les scènes partagent
    le même document. Les id de `<defs>` SVG (dégradés, filtres, clipPath) doivent aussi être préfixés.
  - Les styles vont dans un `<style>` injecté par la scène, avec des sélecteurs préfixés.
- Ne jamais placer un tween à une position **négative** dans `tl` (ex. `h - 0.02` avec h = 0) : GSAP décale alors tous les enfants et casse le calage. Les états initiaux visibles au tout premier frame doivent être posés dans le markup ou via `fromTo` (un `tl.set` à t=0 peut ne pas s'appliquer si le premier seek tombe pile sur `start`).
- Plugins GSAP disponibles : CustomEase, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, SplitText.
- Assets partagés (`lib/assets.js`), à utiliser tels quels pour la continuité :
  - `FEKK.ASSETS.phoneFront` et `phoneBack` : **le** téléphone perdu (coque bleue, écran 18:47).
  - `FEKK.ASSETS.logoMark` : le logo Fekk, une épingle verte avec une loupe. Ses sous-éléments
    `.logo-pin`, `.logo-ring`, `.logo-handle` et `.logo-dot` sont animables.
- Vérification :
  - `node tools/still.mjs --from A --to B --step 0.25 --sheet nom` produit une planche contact
    `out/stills/nom-sheet.png`, à regarder avec Read.
  - `node tools/still.mjs 1.5` produit une image pleine taille.
  - `--scene s1` isole une scène.

## Découpage (temps absolus du film)

### S1 — « L'instant » · `scenes/s1-moment.js` · 0.00 → 3.50

| t | Action |
|---|---|
| 0.00–0.40 | Fond ciel de fin d'après-midi : dégradé `dusk` vers `sunset`, grand soleil bas, silhouettes de la ville en 2–3 plans de parallaxe (immeubles du Plateau, un minaret, un baobab). La caméra dérive lentement. Petit texte en haut « Dakar · 18h47 » qui s'écrit lettre par lettre (Inter 600, 34px, interlettrage large). |
| 0.30–1.40 | Un **car rapide** (jaune et bleu, ornements peints, inscription « Alhamdoulilah » sur le flanc, galerie de toit chargée de bagages) entre par la droite avec un squash à l'arrêt, roues qui tournent et petite poussière. Il est vu de profil sur la route en bas du cadre (y≈1250–1500). |
| 1.10–2.40 | Le **téléphone** (`ASSETS.phoneBack`) s'échappe de la porte arrière ouverte. Chute en arc (MotionPath) avec rotations, ralenti dramatique au sommet (time-remap : ease lent au milieu), et traînées de mouvement. Le car repart vers la gauche et sort du cadre. |
| 2.20–2.70 | Impact au sol avec squash, rebond, nuage de poussière (particules seedées) et une fissure stylisée qui apparaît sur un coin. Le téléphone finit à plat, à peu près au centre bas. |
| 2.40–3.50 | Texte cinétique massif : « Un instant… » puis « **et c'est perdu.** », mot par mot (Bricolage 800, ~150px, blanc avec ombre portée dure `ink`). |
| 3.10–3.50 | **Transition sortante** : zoom caméra brutal sur le téléphone au sol jusqu'à ce que l'écran remplisse tout le cadre en couleur unie `ink #0B1210` à 3.50. La scène doit finir sur un plein cadre `ink`. |

### S2 — « Perdus » · `scenes/s2-perdus.js` · 3.50 → 7.00

| t | Action |
|---|---|
| 3.50 | **Commence sur un plein cadre `ink`** (continuité avec S1). |
| 3.50–5.40 | Rafale typographique avec des icônes d'objets perdus illustrés (style flat, couleurs de la palette) : **Téléphone.** (le téléphone bleu) · **Carte d'identité.** (une carte CNI stylisée verte, jaune et rouge, sans vraies données) · **Clés.** · **Portefeuille.** · **Sac.** Chaque mot claque (scale 1.3→1, motion blur simulé) et son icône rebondit. Le rythme accélère (~0,45 s, puis 0,35 s, puis 0,3 s) en suivant la musique. Les mots précédents glissent ou s'empilent pour former un mur typographique en mouvement. |
| 5.40–6.20 | Les objets s'éparpillent en petites épingles grises sur une carte stylisée de Dakar (contour de la presqu'île du Cap-Vert) avec des points qui clignotent. Sous-titre : « Chaque jour à Dakar. » |
| 6.10–6.80 | Question : « Et si on pouvait **les retrouver** ? », avec « les retrouver » surligné par un marqueur `yellow` dessiné (DrawSVG). |
| 6.60–7.00 | **Transition sortante** : une épingle `logoMark` tombe au centre (atterrissage `fekk.land`), puis un cercle `green` s'étend depuis la pointe de l'épingle jusqu'à remplir l'écran. La scène doit finir sur un plein cadre `green #00853F` à 7.00. |

### S3 — « L'app » + S4 « Le match » · `scenes/s3-app.js` · 7.00 → 15.50

Une seule scène, car c'est le même téléphone-maquette en continuité.

| t | Action |
|---|---|
| 7.00 | **Commence sur un plein cadre `green`.** |
| 7.00–7.80 | Une maquette de smartphone (cadre noir, coins très arrondis, ~640×1300px, légère inclinaison 3D) monte depuis le bas avec overshoot, avec une ombre portée dure `ink` à 30 %. Autour, des formes géométriques wax (cercles, demi-lunes, zigzags) en `yellow`, `mint` et `sand` dérivent en parallaxe. L'écran affiche le **splash Fekk** (logo, puis wordmark « fekk » en minuscules). |
| 7.80–9.80 | Écran **« Déclarer une perte »**. Les champs se remplissent tout seuls avec un curseur qui tape : Catégorie « Téléphone » (puce sélectionnée), Description « Samsung noir, coque bleue », Lieu « Colobane, près du marché », Date « Aujourd'hui, 18h47 ». Un doigt (main stylisée) tape **« Publier »** avec un ripple, et le bouton se transforme en ✓ `mint`. Un titre au-dessus de la maquette, hors écran : « **1. Déclare** » (Bricolage 800). |
| 9.80–12.00 | Transition d'écran (slide et scale) vers une **carte de Dakar** dans l'app, avec les quartiers Plateau, Médina, Colobane, Fann, Parcelles Assainies, Yoff, Ouakam et Sandaga (positions géographiques plausibles). Des ondes radar pulsent depuis Colobane, et des épingles « objet trouvé » apparaissent en stagger. Titre externe : « **2. La communauté cherche** ». |
| 12.00–13.40 | **Notification push** qui tombe en haut de l'écran avec un rebond : « 🎉 Correspondance trouvée ! Un téléphone bleu a été déposé au point relais de Sandaga. » La maquette fait un léger shake de vibration. Une carte de match montre deux vignettes (la photo déclarée et l'objet trouvé, à partir de `ASSETS.phoneBack` en mini) et une jauge circulaire qui monte à **94 %** de correspondance (compteur animé). Titre externe : « **3. Fekk trouve** ». |
| 13.40–15.00 | Sur la carte, une ligne en pointillés animée (DrawSVG) relie le propriétaire (Colobane) au point relais (Sandaga). Un bouton « Récupérer mon objet » pulse. Un petit badge « Remis en main propre · code 4821 ». |
| 15.00–15.50 | **Transition sortante** : la maquette tourne et part en zoom vers le bas pendant que le fond passe de `green` à `sand`. La scène doit finir sur un plein cadre `sand #F3E6CF` à 15.50. |

### S5 — « Retrouvailles » + carton final · `scenes/s5-retrouvailles.js` · 15.50 → 20.00

| t | Action |
|---|---|
| 15.50 | **Commence sur un plein cadre `sand`.** |
| 15.50–17.20 | Deux mains illustrées (peaux de tons différents, manches en tissu wax) entrent par la gauche et la droite. L'une tend le téléphone bleu (`phoneFront`, qui s'allume) à l'autre, et les mains se touchent. Une bulle explose : « **Jërëjëf !** » (Bricolage 800, ~200px, `green` avec ombre portée `ink`), avec des confettis aux couleurs du drapeau (particules seedées) et un petit cœur. |
| 17.10–17.50 | Wipe de transition : un cercle `green` part du centre (ou des bandes vert, jaune, rouge en diagonale) et révèle le carton final. |
| 17.40–20.00 | **Carton final** sur `green` : le `logoMark` se dessine (DrawSVG sur `.logo-ring`, scale-in du pin avec `fekk.land`, le `.logo-dot` pop), puis le wordmark « **fekk** » (Bricolage 800, ~260px, blanc, minuscules) en stagger de lettres. Une ligne de définition dictionnaire « fekk *(wolof)* · trouver », en Inter italique, puis la tagline « **Ce qui se perd, se retrouve.** » Enfin un CTA en pilule « Bientôt sur Android & iOS ». De 19.0 à 20.0, une respiration douce (scale 1→1.02) : pas de fondu au noir, l'image finale est propre et tient. |

## Cue sheet audio (`audio/synth.mjs` → `audio/fekk.wav`)

Tempo **120 BPM** (un temps = 0,5 s, une mesure = 2 s). Afro-house minimal inspiré du sabar, avec kick,
shaker, claves et basse sub.

| t | Événement sonore |
|---|---|
| 0.0 | Ambiance de rue (bruit filtré doux), pad chaud, groove à moitié. |
| 0.6 | Moteur ou klaxon stylisé du car rapide (deux bips). |
| 1.2–2.2 | Whoosh de la chute du téléphone, avec un ralenti (pitch qui descend). |
| 2.3 | Impact : thump grave et petit crack. |
| 3.0–3.5 | Riser, puis coupure nette à 3.5. |
| 3.5–5.4 | Drop : groove complet, un « hit » à chaque mot (≈3.5, 3.95, 4.4, 4.75, 5.1). |
| 6.6 | Pop de l'épingle, puis un swell. |
| 7.0 | Transition, puis le groove reprend, plus lumineux. |
| 7.8–9.6 | Petits ticks de frappe clavier, « tap » sur Publier vers 9.3. |
| 9.8–12.0 | Pings radar (3–4 pulses). |
| 12.0 | Son de notification (deux notes ascendantes) et buzz de vibration. |
| 12.56–12.95 | Arpège ascendant calé sur la jauge 0 → 94 % (le match). |
| 15.0 | Whoosh de sortie. |
| 16.6 | « Jërëjëf » : accent chaleureux, petit carillon. |
| 17.4 | Swell, puis logo à 17.8 (accord final majeur). |
| 19.0–20.0 | Queue de réverb, fin propre. |

Le mixage reste à environ -14 LUFS, sans clipping (pic < -1 dBFS), en 48 kHz stéréo 16 bits.
