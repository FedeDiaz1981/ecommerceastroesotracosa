import type { HTMLAttributes, ReactNode } from "react";

type BadgeVariant = "solid" | "outline" | "surface";

const variantClasses: Record<BadgeVariant, string> = {
  solid:
    "border border-[rgba(200,154,21,0.24)] bg-[linear-gradient(180deg,var(--pf-primary),var(--pf-primary-dark))] text-white shadow-[0_10px_22px_rgba(29,24,20,0.14)]",
  outline: "border border-[var(--pf-border)] bg-transparent text-[var(--pf-text)]",
  surface:
    "border border-[rgba(224,208,180,0.62)] bg-[rgba(255,255,255,0.88)] text-[var(--pf-text)] shadow-[0_8px_16px_rgba(29,24,20,0.06)]",
};

export function badgeVariants({ variant = "surface" }: { variant?: BadgeVariant } = {}) {
  return [
    "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
    variantClasses[variant],
  ].join(" ");
}

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

export function Badge({ className = "", variant = "surface", children, ...props }: BadgeProps) {
  return (
    <span className={`${badgeVariants({ variant })} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
