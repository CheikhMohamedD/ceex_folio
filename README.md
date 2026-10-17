# CEEXFolio

Le portfolio de Cheikh Diack, ingénieur full-stack et designer à Dakar.

Le site se construit en cinq phases. Les quatre premières sont dans le code : le design
system « Dossier » et sa page `/colophon` (phase 1), le site public en français et en
anglais avec ses études de cas, ses services, son blog et son SEO (phase 2), le contact
à deux portes (phase 3), et le mouvement : GSAP et la scène Three.js du hero (phase 4). Le jalon de la phase 3, une vraie demande reçue de bout
en bout, attend l'hébergement, la base et les clés décrites dans « Contact » plus bas.

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
| `npm run db:migrate`        | Applique les migrations Prisma à la base de `DATABASE_URL`             |

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
  app/                  routes : site public (FR et EN), contact, /colophon, Coulisses, API d'authentification
  components/ui/        les dix-sept composants « Dossier »
  components/layout/    en-tête, pied de page, barre d'onglets mobile, bouton de thème
  features/colophon/    les sections de /colophon
  features/contact/     les deux portes du contact
  features/coulisses/   l'enveloppe des Coulisses, connexion et formulaires
  features/inbox/       la boîte des demandes
  features/cheikh-2-0/  générateur, sas, historique, feuille de route
  features/compass/     la Boussole : Rêves et Boîte à projets
  server/               le seul accès à la base, à Better Auth, Resend et Turnstile
  i18n/                 next-intl : français et anglais, messages typés
  lib/                  fonctions pures et testées : design, contact, motion, PDF, Cheikh 2.0, Boussole, auth
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

## Contact

Deux portes mènent à une même demande, enregistrée par une Server Action :

- **Porte 1**, dans Reach out : nom, email ou WhatsApp, message.
- **Porte 2**, `/contact/parcours` : neuf questions, une par écran, un récapitulatif à
  corriger, puis le brief PDF (jsPDF, généré dans le navigateur). Chaque demande reçoit un
  score de qualification de 0 à 4 (`src/lib/contact/qualification.ts`).

Le code suit l'architecture habituelle : schémas Zod partagés par le navigateur et la
Server Action (`src/features/contact/schema.ts`), service testé avec des dépendances
injectées (`service.ts`), et seul `src/server/` touche la base, Resend et Turnstile.

Protection : champ piège, Cloudflare Turnstile (si ses clés sont définies), et
5 envois par adresse IP et par heure (`CONTACT_RATE_LIMIT`), l'adresse n'étant gardée que
sous forme d'empreinte HMAC. Une mention de confidentialité suit chaque formulaire
(loi sénégalaise n° 2008-12, conservation de 12 mois).

Aucune variable n'est nécessaire pour construire le site. Pour recevoir de vraies
demandes, copie `.env.example` et renseigne :

| Variable                                                 | Rôle                                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`                                           | PostgreSQL (Neon, Supabase…), puis `npm run db:migrate`              |
| `RESEND_API_KEY`, `RESEND_FROM`                          | Notification à chaque demande, accusé de réception au client         |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Turnstile ; la CSP n'ouvre `challenges.cloudflare.com` qu'avec elles |
| `IP_HASH_SECRET`                                         | Clé de l'empreinte des adresses IP                                   |

Sans base, les demandes restent en mémoire en développement (et en test, avec
`CONTACT_STORE=memory`) ; en production, le formulaire annonce qu'il n'est pas encore
branché et renvoie vers l'email et WhatsApp, toujours affichés.

## Mouvement

Les animations suivent la « Carte des animations » du canvas, sans jamais retarder le
premier affichage ni cacher du contenu :

- Les composants serveur posent des attributs `data-motion` ; `src/features/motion`
  charge GSAP (ScrollTrigger, Flip, DrawSVG) une fois la page au repos et joue les moments
  de chaque page. Chaque animation part de l'état final, déjà dans le HTML.
- Les moments visibles dès le chargement (tampon « Disponible », mots sous GOTF, tampon
  « Reçu ») et l'entrée des questions du parcours sont en CSS (`globals.css`).
- L'ouverture d'un projet passe par les View Transitions de React : la vignette
  s'agrandit jusqu'à l'en-tête de l'étude de cas.
- La scène Three.js du hero (`src/features/hero-scene`) ne se charge que sur desktop :
  1 024 px et plus, WebGL2, 4 cœurs, sans économiseur de données
  (`src/lib/motion/conditions.ts`). Elle ne dessine que quand quelque chose bouge.
- Avec « réduire les animations », rien ne se charge et rien ne bouge.

GSAP (54 Ko compressés) et Three.js (133 Ko) restent hors du JavaScript initial mesuré
par le budget.

## Coulisses

L'espace privé, en français seulement, jamais indexé (noindex, `robots.txt`, absent du
plan du site) et sans aucun lien public : `/connexion`, puis quatre pages.

- **`/coulisses`** : le rituel du vendredi sur un écran (feuille de route, demandes
  nouvelles, projet actif).
- **`/coulisses/demandes`** : les demandes des deux portes, filtrées par statut ; le
  statut suit le cycle Nouvelle, Qualifiée, En discussion, Gagnée, Perdue.
- **`/coulisses/cheikh-2-0`** : l'outil d'origine, passé du navigateur à la base. Bugs,
  boucle du bâtisseur, générateur de prompt (six champs, score de clarté), sas des projets
  (quatre questions, verdict), dossier PDF de sept pages (`src/lib/pdf/framing.ts`, même
  moteur que le brief client), historique des fiches et feuille de route sur 30 jours.
  Une idée au parking part dans la Boussole en un clic.
- **`/coulisses/boussole`** : les Rêves et la Boîte à projets (faisabilité × impact, un
  seul projet actif, parcours de création en neuf étapes, chaîne de valeur ITIL 4).

Seul ton identifiant GitHub **numérique** entre, vérifié à trois niveaux :

1. **Proxy** (`src/proxy.ts`) : sans cookie, redirection vers `/connexion` sans requête en
   base ; avec un cookie, la session est relue et l'identifiant comparé.
2. **Better Auth** (`src/server/auth.ts`) : `validateUserInfo` refuse tout profil GitHub
   dont l'identifiant n'est pas `ALLOWED_GITHUB_ID`, avant toute création de compte ; un
   crochet refuse toute session qui ne serait pas reliée à ce compte ; aucune liaison de
   compte par email.
3. **`requireOwner()`** (`src/server/owner.ts`) au début de chaque page et de chaque
   Server Action.

Tout refus, et toute erreur de connexion, mène à `/connexion/refus`, une page neutre.
Seule `/connexion` laisse un formulaire partir vers `github.com` (`form-action` de la
CSP). Les Coulisses n'ont aucune animation.

| Variable                                   | Rôle                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`                       | Signature des cookies de session (`openssl rand -base64 32`)           |
| `BETTER_AUTH_URL`                          | Adresse publique ; par défaut `NEXT_PUBLIC_SITE_URL`                   |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Application OAuth GitHub, retour sur `<site>/api/auth/callback/github` |
| `ALLOWED_GITHUB_ID`                        | Ton identifiant numérique : `https://api.github.com/users/<pseudo>`    |

Sans l'une d'elles (ou sans `DATABASE_URL`), personne n'entre et `/api/auth` répond 404.
La CI vérifie tout ce qui se voit de l'extérieur (`tests/e2e/coulisses.spec.ts`) ; le
parcours du propriétaire se vérifie avec une base de test : `npm run db:migrate`, puis une
session semée en base pour un compte GitHub dont l'identifiant est `ALLOWED_GITHUB_ID`.

## Sécurité

- Les en-têtes HTTP sont définis dans `src/lib/security/headers.ts` et appliqués par
  `next.config.ts`. Les pages sont générées à la construction, donc sans nonce par
  requête : la CSP garde `'unsafe-inline'` pour les scripts que Next.js insère, et ferme
  tout le reste (aucune origine externe, pas d'`eval` en production, pas d'iframe). Seule
  exception : Turnstile, quand ses clés sont configurées.
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

| Phase | Contenu                                                      | Jalon                                                      |
| ----- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| 1     | Design system « Dossier », 17 composants, `/colophon`        | Contrastes AA vérifiés, tout lisible à 360 px              |
| 2     | Site public et SEO : accueil, six études de cas, FR et EN    | Pages indexées, Lighthouse dans le budget                  |
| 3     | Contact : deux portes, email, brief PDF                      | Une vraie demande reçue de bout en bout                    |
| 4     | Mouvement et 3D : GSAP, puis le hero Three.js                | LCP de 2,5 s et INP de 200 ms au plus, tenus sur mobile    |
| 5     | Coulisses : connexion GitHub, demandes, Cheikh 2.0, Boussole | Tout autre compte refusé, Boussole utilisable au téléphone |

## Licence

MIT, voir [LICENSE](LICENSE).
