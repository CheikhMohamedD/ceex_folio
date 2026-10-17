import { Link, type LinkProps } from "@/i18n/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses, type ButtonVariant } from "./button-classes";

type Variant = ButtonVariant;

export { buttonClasses };

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

type ButtonLinkProps = LinkProps & { variant?: Variant };

export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
