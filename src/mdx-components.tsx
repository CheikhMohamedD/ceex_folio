import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * Habillage des études de cas et des articles : les balises du markdown prennent la
 * typographie « Dossier ». Les paragraphes gardent 68 caractères de large au plus.
 */
const components: MDXComponents = {
  h2: ({ className, children, ...props }: ComponentProps<"h2">) => (
    <h2
      className={cn("mt-12 font-display text-card font-semibold first:mt-0", className)}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }: ComponentProps<"h3">) => (
    <h3
      className={cn("mt-8 font-display text-[1.25rem] font-semibold first:mt-0", className)}
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ className, ...props }: ComponentProps<"p">) => (
    <p className={cn("mt-4 max-w-[68ch] text-body first:mt-0", className)} {...props} />
  ),
  ul: ({ className, ...props }: ComponentProps<"ul">) => (
    <ul
      className={cn(
        "mt-4 flex max-w-[68ch] list-disc flex-col gap-2 pl-5 marker:text-(--cat)",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: ComponentProps<"ol">) => (
    <ol
      className={cn(
        "mt-4 flex max-w-[68ch] list-decimal flex-col gap-2 pl-5 marker:font-mono marker:text-(--cat)",
        className,
      )}
      {...props}
    />
  ),
  a: ({ className, children, ...props }: ComponentProps<"a">) => (
    <a className={cn("ink-link", className)} {...props}>
      {children}
    </a>
  ),
  strong: ({ className, ...props }: ComponentProps<"strong">) => (
    <strong className={cn("font-semibold", className)} {...props} />
  ),
  blockquote: ({ className, ...props }: ComponentProps<"blockquote">) => (
    <blockquote
      className={cn(
        "mt-6 max-w-[68ch] border-l-[3px] border-(--cat) pl-4 text-ink-soft",
        className,
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }: ComponentProps<"code">) => (
    <code className={cn("font-mono text-[0.9em]", className)} {...props} />
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
