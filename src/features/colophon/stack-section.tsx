import { getTranslations } from "next-intl/server";
import { DataTable } from "@/components/ui/data-table";
import packageJson from "../../../package.json";
import { ColophonSection } from "./colophon-section";

const { dependencies: deps, devDependencies: devDeps } = packageJson;

/** Versions lues dans package.json à la construction : la page ne peut pas mentir. */
const STACK = [
  { key: "next", name: "Next.js", version: deps.next },
  { key: "react", name: "React", version: deps.react },
  { key: "typescript", name: "TypeScript", version: devDeps.typescript },
  { key: "tailwind", name: "Tailwind CSS", version: devDeps.tailwindcss },
  { key: "intl", name: "next-intl", version: deps["next-intl"] },
  { key: "prisma", name: "Prisma", version: deps["@prisma/client"] },
  { key: "auth", name: "Better Auth", version: deps["better-auth"] },
  { key: "zod", name: "Zod", version: deps.zod },
  { key: "jspdf", name: "jsPDF", version: deps.jspdf },
  { key: "gsap", name: "GSAP", version: deps.gsap },
  { key: "three", name: "Three.js", version: deps.three },
  { key: "lucide", name: "Lucide", version: deps["lucide-react"] },
  { key: "fonts", name: "Fontsource", version: deps["@fontsource-variable/space-grotesk"] },
  { key: "vitest", name: "Vitest", version: devDeps.vitest },
  { key: "playwright", name: "Playwright", version: devDeps["@playwright/test"] },
  { key: "axe", name: "axe-core", version: devDeps["@axe-core/playwright"] },
  { key: "eslint", name: "ESLint", version: devDeps.eslint },
] as const;

export async function StackSection() {
  const t = await getTranslations("colophon.stack");

  return (
    <ColophonSection id="stack" number="06" title={t("title")} intro={<p>{t("intro")}</p>}>
      <DataTable
        caption={t("caption")}
        columns={[
          { key: "tool", header: t("columns.tool") },
          { key: "version", header: t("columns.version"), emphasis: true },
          { key: "role", header: t("columns.role") },
        ]}
        rows={STACK.map((item) => ({
          id: item.key,
          cells: {
            tool: item.name,
            version: <span className="font-mono text-[0.9375rem] font-medium">{item.version}</span>,
            role: t(`roles.${item.key}`),
          },
        }))}
      />
      <ul className="flex max-w-[68ch] flex-col gap-3 text-ink-soft">
        <li className="border-l-[3px] border-ink pl-4">{t("notes.runtime")}</li>
        <li className="border-l-[3px] border-ink pl-4">{t("notes.exact")}</li>
        <li className="border-l-[3px] border-ink pl-4">{t("notes.later")}</li>
      </ul>
    </ColophonSection>
  );
}
