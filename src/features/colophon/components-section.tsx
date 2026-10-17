import {
  ArrowRight,
  BriefcaseBusiness,
  FolderOpen,
  Globe,
  Handshake,
  Heart,
  KeyRound,
  Layers,
  MapPin,
  Monitor,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Tablet,
  UserRound,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Annotation } from "@/components/ui/annotation";
import { ButtonLink } from "@/components/ui/button";
import { Callout, Note } from "@/components/ui/callout";
import { DataTable } from "@/components/ui/data-table";
import { Field } from "@/components/ui/field";
import { FolderTabs } from "@/components/ui/folder-tabs";
import { KeyFacts } from "@/components/ui/key-facts";
import { Masthead, Signature } from "@/components/ui/masthead";
import { MobileTabBar } from "@/components/ui/mobile-tab-bar";
import { OpenFolder } from "@/components/ui/open-folder";
import { Progress } from "@/components/ui/progress";
import { ProjectCard } from "@/components/ui/project-card";
import { Quote } from "@/components/ui/quote";
import { Sheet } from "@/components/ui/sheet";
import { Stamp } from "@/components/ui/stamp";
import { Steps } from "@/components/ui/steps";
import { Timeline } from "@/components/ui/timeline";
import { cn } from "@/lib/cn";
import { formatRatio } from "@/lib/design/contrast";
import type { Category } from "@/lib/design/categories";
import { ratio } from "@/lib/design/tokens";
import { ColophonSection } from "./colophon-section";

/** Ordre de la galerie : les blocs larges occupent toute la ligne dès 1 024 px. */
const GALLERY = [
  { key: "tabs", id: "onglets", wide: true },
  { key: "tabBar", id: "barre-mobile", wide: false },
  { key: "stamp", id: "tampon", wide: false },
  { key: "card", id: "fiche", wide: true },
  { key: "annotation", id: "annotation", wide: false },
  { key: "button", id: "bouton", wide: false },
  { key: "field", id: "champ", wide: false },
  { key: "progress", id: "progression", wide: false },
  { key: "sheet", id: "feuille", wide: false },
  { key: "folder", id: "dossier-ouvert", wide: false },
  { key: "masthead", id: "bandeau", wide: false },
  { key: "quote", id: "citation", wide: false },
  { key: "steps", id: "etapes", wide: true },
  { key: "callout", id: "encadre", wide: true },
  { key: "facts", id: "faits-cles", wide: false },
  { key: "timeline", id: "frise", wide: false },
  { key: "table", id: "tableau", wide: true },
] as const;

type GalleryKey = (typeof GALLERY)[number]["key"];

/** Les six projets des maquettes, rangés par catégorie. */
const PROJECTS: Array<{
  key: "seetalma" | "ttc" | "jambar" | "safar" | "fintech" | "atelier";
  category: Category;
}> = [
  { key: "seetalma", category: "web" },
  { key: "ttc", category: "web" },
  { key: "jambar", category: "mobile" },
  { key: "safar", category: "design" },
  { key: "fintech", category: "mobile" },
  { key: "atelier", category: "web" },
];

function Specimen({
  id,
  number,
  name,
  role,
  wide,
  children,
}: {
  id: string;
  number: string;
  name: string;
  role: string;
  wide: boolean;
  children: ReactNode;
}) {
  return (
    <li
      id={id}
      className={cn(
        "flex min-w-0 flex-col gap-5 border-t border-dotted border-ink-soft pt-6",
        wide && "lg:col-span-2",
      )}
    >
      <div className="flex flex-col gap-1.5">
        <p className="meta text-ink-soft">{number}</p>
        <h3 className="font-display text-card font-semibold">{name}</h3>
        <p className="max-w-[60ch] text-[0.9375rem] leading-normal text-ink-soft">{role}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </li>
  );
}

export async function ComponentsSection() {
  const t = await getTranslations("colophon.components");
  const tc = await getTranslations("categories");
  const tn = await getTranslations("nav");
  const tp = await getTranslations("phases");

  const projectNames = (category?: Category) => (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      {PROJECTS.filter((project) => !category || project.category === category).map((project) => (
        <li key={project.key} className={cn(`cat-${project.category}`, "flex items-center gap-2")}>
          <span aria-hidden className="size-2 rounded-full bg-(--cat)" />
          {t(`demo.projects.${project.key}.title`)}
        </li>
      ))}
    </ul>
  );

  const tabCounts = { all: 6, web: 3, mobile: 2, design: 1 } as const;

  const specimens: Record<GalleryKey, ReactNode> = {
    tabs: (
      <FolderTabs
        label={t("demo.tabs.label")}
        tabs={[
          { id: "all", label: t("demo.tabs.all"), count: tabCounts.all },
          { id: "web", label: tc("web"), count: tabCounts.web, category: "web" },
          { id: "mobile", label: tc("mobile"), count: tabCounts.mobile, category: "mobile" },
          { id: "design", label: tc("design"), count: tabCounts.design, category: "design" },
        ]}
        panels={{
          all: projectNames(),
          web: projectNames("web"),
          mobile: projectNames("mobile"),
          design: projectNames("design"),
        }}
      />
    ),

    tabBar: (
      // Aperçu visuel : la vraie barre est en bas d'écran sous 640 px.
      <div inert className="max-w-sm">
        <MobileTabBar
          variant="inline"
          label={t("demo.tabBar.label")}
          items={[
            { href: "/#prez", label: tn("prez"), icon: UserRound, current: true },
            { href: "/#pro-life", label: tn("proLife"), icon: BriefcaseBusiness },
            { href: "/#hobbies", label: tn("hobbies"), icon: Heart },
            { href: "/#reach-out", label: tn("reachOut"), icon: Send },
          ]}
          className="rounded-sheet border-x-[1.5px] border-b-[1.5px]"
        />
      </div>
    ),

    stamp: (
      <div className="flex flex-wrap items-center gap-x-6 gap-y-5 py-2">
        <Stamp>{t("demo.stamps.featured")}</Stamp>
        <Stamp tone="ink" tilt={3}>
          {t("demo.stamps.caseStudy")}
        </Stamp>
        <Stamp tone="success" double tilt={-2}>
          {t("demo.stamps.available")}
        </Stamp>
        <Stamp tone="error" tilt={2}>
          {t("demo.stamps.failed")}
        </Stamp>
        <span className="cat-web">
          <Stamp tone="category" tilt={-3}>
            {tc("web")}
          </Stamp>
        </span>
      </div>
    ),

    card: (
      <div className="flex flex-col gap-4">
        <ProjectCard
          featured
          number="01"
          category="web"
          categoryLabel={tc("web")}
          type={t("demo.projects.seetalma.type")}
          stack={["Next.js", "Prisma"]}
          title={t("demo.projects.seetalma.title")}
          summary={t("demo.projects.seetalma.summary")}
          href="/#pro-life"
          ctaLabel={t("demo.projects.readCase")}
          badge={
            <Stamp onImage tilt={-6}>
              {t("demo.stamps.featured")}
            </Stamp>
          }
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {(
            [
              { key: "ttc", number: "02", category: "web" },
              { key: "jambar", number: "03", category: "mobile" },
              { key: "safar", number: "04", category: "design" },
              { key: "fintech", number: "05", category: "mobile" },
            ] as const
          ).map((project) => (
            <ProjectCard
              key={project.key}
              number={project.number}
              category={project.category}
              categoryLabel={tc(project.category)}
              type={t(`demo.projects.${project.key}.type`)}
              title={t(`demo.projects.${project.key}.title`)}
              summary={t(`demo.projects.${project.key}.summary`)}
              figure={t(`demo.projects.${project.key}.figure`)}
              href="/#pro-life"
              ctaLabel={t("demo.projects.read")}
            />
          ))}
        </div>
      </div>
    ),

    annotation: (
      <div className="py-2">
        <Annotation arrow="down-right">{t("demo.annotation")}</Annotation>
      </div>
    ),

    button: (
      <div className="flex flex-wrap items-center gap-4 pb-2">
        <ButtonLink href="/#reach-out">
          {t("demo.buttons.primary")}
          <ArrowRight size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
        </ButtonLink>
        <ButtonLink href="/#pro-life" variant="secondary">
          {t("demo.buttons.secondary")}
        </ButtonLink>
      </div>
    ),

    field: (
      <div className="flex flex-col gap-5">
        <Field
          label={t("demo.fields.contact")}
          hint={t("demo.fields.contactHint")}
          name="contact"
          type="text"
          autoComplete="email"
        />
        <Field
          multiline
          label={t("demo.fields.message")}
          error={t("demo.fields.messageError")}
          name="message"
          rows={3}
        />
      </div>
    ),

    progress: (
      <div className="flex flex-col gap-3">
        <Progress current={3} label={t("demo.progress.label")} />
        <p className="font-display text-card font-semibold">{t("demo.progress.question")}</p>
      </div>
    ),

    sheet: (
      <Sheet raised className="flex flex-col gap-2 p-5 sm:p-6">
        <p className="meta text-ink-soft">{t("demo.sheet.label")}</p>
        <p>{t("demo.sheet.text")}</p>
      </Sheet>
    ),

    folder: (
      <OpenFolder label={tc("web")} icon={Globe} category="web" className="sm:p-6 lg:p-6">
        <p className="meta text-ink-soft">{t("demo.folder.meta")}</p>
        <p className="mt-2 font-display text-card font-semibold">{t("demo.folder.title")}</p>
        <p className="mt-2 text-[0.9375rem] leading-normal text-ink-soft">
          {t("demo.projects.seetalma.summary")}
        </p>
      </OpenFolder>
    ),

    masthead: (
      <Sheet className="flex flex-col gap-6 p-5 sm:p-6">
        <Masthead start={t("demo.masthead.start")} end={t("demo.masthead.end")} />
        <p className="font-display text-card font-semibold">{t("demo.projects.seetalma.title")}</p>
        <Signature
          icon={FolderOpen}
          category="web"
          title={t("demo.masthead.signature")}
          detail={t("demo.masthead.detail")}
        />
      </Sheet>
    ),

    quote: (
      <Quote category="web" source={t("demo.quote.source")}>
        {t("demo.quote.text")}
      </Quote>
    ),

    steps: (
      <Steps
        label={t("demo.steps.label")}
        current={1}
        orientation="responsive"
        steps={[
          { label: t("demo.steps.send"), description: t("demo.steps.sendText") },
          { label: t("demo.steps.answer"), description: t("demo.steps.answerText") },
          { label: t("demo.steps.talk"), description: t("demo.steps.talkText") },
        ]}
      />
    ),

    callout: (
      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
        <Callout
          label={t("demo.callout.why")}
          category="web"
          className="md:col-span-2"
          items={[
            { icon: ShieldCheck, text: t("demo.callout.trust") },
            { icon: Search, text: t("demo.callout.short") },
            { icon: Handshake, text: t("demo.callout.handover") },
          ]}
        />
        <Callout label={t("demo.callout.outline")}>{t("demo.callout.outlineText")}</Callout>
        <Callout label={t("demo.callout.wash")} variant="wash" category="web">
          {t("demo.callout.washText", {
            ratio: formatRatio(
              Math.min(ratio("ink", "wash-web", "light"), ratio("ink", "wash-web", "dark")),
            ),
          })}
        </Callout>
        <Callout label={t("demo.callout.solid")} variant="solid" category="web">
          {t("demo.callout.solidText")}
        </Callout>
        <Note
          label={t("demo.callout.noteLabel")}
          href="/colophon#mesures"
          linkLabel={t("demo.callout.noteLink")}
          className="mt-7"
        >
          {t("demo.callout.noteText")}
        </Note>
      </div>
    ),

    facts: (
      <KeyFacts
        category="web"
        facts={[
          { icon: MapPin, value: t("demo.facts.place"), label: t("demo.facts.placeLabel") },
          { icon: KeyRound, value: t("demo.facts.secret"), label: t("demo.facts.secretLabel") },
          { icon: Layers, value: t("demo.facts.stack"), label: t("demo.facts.stackLabel") },
        ]}
      />
    ),

    timeline: (
      <Timeline
        label={t("demo.timeline.label")}
        entries={[
          {
            date: t("demo.timeline.started"),
            dateTime: "2026-10-16",
            title: tp("p1.title"),
            text: tp("p1.scope"),
          },
          { date: t("demo.timeline.next"), title: tp("p2.title"), text: tp("p2.scope") },
          { date: t("demo.timeline.then"), title: tp("p3.title"), text: tp("p3.scope") },
        ]}
      />
    ),

    table: (
      <DataTable
        caption={t("demo.table.caption")}
        columns={[
          { key: "width", header: t("demo.table.width") },
          { key: "columns", header: t("demo.table.columns"), emphasis: true },
          { key: "gutter", header: t("demo.table.gutter") },
          { key: "margin", header: t("demo.table.margin") },
        ]}
        rows={[
          {
            id: "phone",
            icon: Smartphone,
            cells: { width: t("demo.table.phone"), columns: "4", gutter: "16 px", margin: "16 px" },
          },
          {
            id: "tablet",
            icon: Tablet,
            cells: {
              width: t("demo.table.tablet"),
              columns: "8",
              gutter: "24 px",
              margin: "24 px",
            },
          },
          {
            id: "desktop",
            icon: Monitor,
            cells: {
              width: t("demo.table.desktop"),
              columns: "12",
              gutter: "24 px",
              margin: "80 px",
            },
          },
        ]}
      />
    ),
  };

  return (
    <ColophonSection id="composants" number="05" title={t("title")} intro={<p>{t("intro")}</p>}>
      <nav aria-label={t("index")}>
        <ol className="grid grid-cols-1 gap-x-6 min-[400px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {GALLERY.map((item, index) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="inline-flex min-h-11 items-center gap-2.5 decoration-[1.5px] underline-offset-4 hover:underline"
              >
                <span className="font-mono text-xs font-medium text-stamp-strong">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {t(`items.${item.key}.name`)}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <ol className="grid gap-x-10 gap-y-12 lg:grid-cols-2">
        {GALLERY.map((item, index) => (
          <Specimen
            key={item.id}
            id={item.id}
            number={`05.${String(index + 1).padStart(2, "0")}`}
            name={t(`items.${item.key}.name`)}
            role={t(`items.${item.key}.role`)}
            wide={item.wide}
          >
            {specimens[item.key]}
          </Specimen>
        ))}
      </ol>
    </ColophonSection>
  );
}
