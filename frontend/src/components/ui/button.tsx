import type { ComponentProps } from "react";

const VARIANTS = {
  primary: "bg-accent text-white font-semibold px-[22px] hover:brightness-110",
  secondary: "bg-surface text-accent font-semibold px-[22px] border border-line hover:bg-accent-soft",
  text: "text-accent px-1 hover:underline",
};

export type ButtonVariant = keyof typeof VARIANTS;

// Shared by <button> and <Link> so both look the same.
export function buttonClass(variant: ButtonVariant = "primary", className = "") {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-full motion-safe:transition ${VARIANTS[variant]} ${className}`;
}

export function Button({ variant, className, ...props }: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}
