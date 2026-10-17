import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-sheet px-6 font-display text-[1.0625rem] leading-tight font-semibold transition-[translate,box-shadow,background-color] duration-150 ease-out motion-reduce:transition-none";

const variants: Record<Variant, string> = {
  // L'ombre nette passe de 4 à 6 px au survol, au focus et à l'appui : effet CSS seul.
  primary:
    "bg-stamp-strong text-on-fill shadow-press hover:-translate-y-0.5 hover:shadow-press-hover focus-visible:-translate-y-0.5 focus-visible:shadow-press-hover active:translate-y-0.5 active:shadow-press-active",
  secondary: "border-[1.5px] border-ink text-ink hover:bg-sheet",
};

export function buttonClasses(variant: Variant = "primary", className?: string): string {
  return cn(base, variants[variant], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant };

/** Bouton : 48 px de haut ; principal en stamp-strong, secondaire au trait d'encre. */
export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(
        variant,
        cn("disabled:pointer-events-none disabled:opacity-60", className),
      )}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant };

export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
