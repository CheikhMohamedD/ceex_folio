// Études de cas et articles : chaque MDX exporte son contenu et un en-tête `metadata`,
// vérifié par Zod au chargement (voir src/content).
declare module "*.mdx" {
  import type { MDXContent } from "mdx/types";

  export const metadata: unknown;
  const Content: MDXContent;
  export default Content;
}
