# CEEXFolio

Le portfolio de Cheikh Diack, ingénieur full-stack et designer à Dakar.

Le site se construit en cinq phases. La **phase 1** est en cours : le design system
« Dossier », ses dix-sept composants et la page `/colophon`, qui les montre avec leurs
contrastes calculés et les mesures de la CI. L'accueil est provisoire, et le site
demande aux moteurs de ne pas l'indexer jusqu'à la phase 2.

## Démarrer

Prérequis : Node.js 24 LTS, version 24.15 ou plus récente (voir `.nvmrc`), et npm.

```bash
nvm install    # dernière version de Node 24
npm ci         # versions exactes du package-lock.json
npm run dev    # http://localhost:3000
```

Installe toujours les dépendances avec `npm ci` sur la machine qui lance le site :
Next.js, Tailwind CSS et Lightning CSS embarquent des binaires propres à chaque
système, donc un dossier `node_modules` copié depuis Linux ne marche pas sur macOS.

## Scripts

| Commande                    | Rôle                                                                   |
| --------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`               | Serveur de développement (Turbopack)                                   |
| `npm run build`             | Construction de production : pages générées à l'avance                 |
| `npm start`                 | Sert la construction                                                   |
| `npm run lint`              | ESLint avec jsx-a11y, aucun avertissement toléré                       |
| `npm run typecheck`         | Types des routes et des messages, puis TypeScript strict               |
| `npm test`                  | Vitest : contrastes, miroir des tokens, en-têtes, messages, composants |
| `npm run e2e`               | Playwright et axe-core sur la construction                             |
| `npm run format`            | Prettier, classes Tailwind triées                                      |
| `npm run budget`            | Compare le JavaScript de l'accueil à la mesure de référence            |
| `npm run budget:record`     | Enregistre une nouvelle mesure de référence                            |
| `npm run lighthouse`        | Lighthouse CI sur l'accueil et `/colophon`, cinq passages              |
| `npm run lighthouse:record` | Enregistre les scores de la dernière exécution                         |
| `npm run check`             | Lint, types et tests unitaires d'un coup                               |

Les tests de bout en bout tournent sur le site construit. La première fois,
installe le navigateur de Playwright :

```bash
npx playwright install chromium
npm run build && npm run e2e
```

Si un Chromium est déjà installé ailleurs, `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/chemin/vers/chrome`
évite le téléchargement.

## Le jalon de la phase 1

Le jalon se vérifie à chaque pull request :

- **Contrastes AA** : `src/lib/design/tokens.ts` décrit chaque paire de couleurs utilisée
  par le système. Les tests vérifient chacune en clair et en sombre, et contrôlent que ce
  miroir dit la même chose que `src/app/globals.css`.
- **Lisible à 360 px** : Playwright ouvre chaque page à 360 et 1 440 px, en clair et en
  sombre. Il refuse tout défilement horizontal, tout texte sous 12 px et toute cible
  tactile sous 44 px, et axe-core doit passer WCAG 2.2 AA sans violation.
- **Budget JavaScript** : `quality/js-budget.json` garde la mesure de référence du
  JavaScript initial de l'accueil, compressé. Une pull request peut l'augmenter de 10 % au
  plus (`npm run budget`). GSAP et Three.js, prévus en phase 4, restent hors budget.

`/colophon` affiche ces mesures. Les fichiers de `quality/` sont lus à la construction :
après `npm run budget:record` ou `npm run lighthouse:record`, reconstruis le site.

## Structure

```
src/
  app/                  routes : accueil provisoire, /colophon, page 404, icône
  components/ui/        les dix-sept composants « Dossier »
  components/layout/    en-tête, pied de page, barre d'onglets mobile, bouton de thème
  features/colophon/    les sections de /colophon
  i18n/                 next-intl : français seulement pour l'instant, messages typés
  lib/design/           tokens, calcul des contrastes, catégories de dossier
  lib/security/         en-têtes HTTP, CSP comprise
tests/e2e/              Playwright et axe-core
scripts/                budget JavaScript, scores Lighthouse
quality/                mesures de référence affichées par /colophon
motion/                 le motion Fekk, projet voisin hors du site
```

Les maquettes (`Portfolio wireframe directions/`, exports HTML à la racine) et `motion/`
restent dans le dépôt, mais hors du lint, de TypeScript, de Prettier et de Tailwind.

## Design system « Dossier »

- Les couleurs vivent dans `src/app/globals.css`, chacune en `light-dark(clair, sombre)`.
  Le thème suit le réglage de l'appareil ; le bouton de l'en-tête le force et garde le
  choix dans le navigateur (`ceex-theme`). Un script inline l'applique avant le premier
  affichage, sans flash.
- Pour changer une couleur, modifie `globals.css` **et** `src/lib/design/tokens.ts` : les
  tests refusent un miroir faux ou un contraste sous le seuil.
- Les polices sont servies par le site (Fontsource) : aucun appel à Google. Elles sont allégées
  dans `src/app/fonts/` (sans hinting, graisses 400 à 700) : après une mise à jour d'un paquet
  `@fontsource`, relance `python3 scripts/subset-fonts.py` (il demande `fonttools` et `brotli`).
- Tous les textes sont dans `src/i18n/messages/fr.json`. Les composants client n'en
  reçoivent que ce dont ils ont besoin, déjà traduit par le serveur.

## Sécurité

- Les en-têtes HTTP sont définis dans `src/lib/security/headers.ts` et appliqués par
  `next.config.ts`. Les pages sont générées à la construction, donc sans nonce par
  requête : la CSP garde `'unsafe-inline'` pour les scripts que Next.js insère, et ferme
  tout le reste (aucune origine externe, pas d'`eval` en production, pas d'iframe).
- La CI lance CodeQL, Trivy (dépendances et secrets), `npm audit` sur les dépendances de
  production, et produit une SBOM CycloneDX à chaque tag `v*`. Dependabot propose les
  mises à jour chaque lundi.
- Les actions GitHub sont épinglées par SHA de commit. trivy-action l'est sur la v0.36.0,
  publiée après le détournement de ses tags en mars 2026
  ([GHSA-69fq-xp46-6x23](https://github.com/aquasecurity/trivy/security/advisories/GHSA-69fq-xp46-6x23)).

### Exceptions connues

- `npm audit` signale cinq alertes élevées dans l'outillage de lint : `braces`
  ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)), via
  `eslint-config-next`. Aucune version corrigée n'existe, et rien n'en part en production.
  La CI audite donc les dépendances du site avec `--omit=dev`.
- ESLint 10 : `eslint-plugin-react`, `eslint-plugin-import` et `eslint-plugin-jsx-a11y`
  déclarent encore ESLint 9 comme pair, mais fonctionnent. Les règles jsx-a11y sont
  relevées en erreur dans `eslint.config.mjs`, à partir du plugin déjà chargé par
  `eslint-config-next`.

## Les cinq phases

| Phase | Contenu                                                   | Jalon                                                      |
| ----- | --------------------------------------------------------- | ---------------------------------------------------------- |
| 1     | Design system « Dossier », 17 composants, `/colophon`     | Contrastes AA vérifiés, tout lisible à 360 px              |
| 2     | Site public et SEO : accueil, six études de cas, FR et EN | Pages indexées, Lighthouse dans le budget                  |
| 3     | Contact : deux portes, email, brief PDF                   | Une vraie demande reçue de bout en bout                    |
| 4     | Mouvement et 3D : GSAP, puis le hero Three.js             | LCP de 2,5 s et INP de 200 ms au plus, tenus sur mobile    |
| 5     | Coulisses et Boussole                                     | Tout autre compte refusé, Boussole utilisable au téléphone |

## Licence

MIT, voir [LICENSE](LICENSE).
