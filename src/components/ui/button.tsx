import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "surface";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-[rgba(200,154,21,0.28)] bg-[linear-gradient(180deg,var(--pf-primary-soft),var(--pf-primary))] text-white shadow-[0_14px_28px_rgba(29,24,20,0.16)] hover:text-white hover:brightness-105 focus-visible:text-white",
  secondary:
    "border border-[rgba(29,24,20,0.12)] bg-[rgba(255,255,255,0.92)] text-[var(--pf-text)] shadow-[0_10px_24px_rgba(29,24,20,0.08)] hover:bg-[rgba(245,243,239,0.96)]",
  outline:
    "border border-[var(--pf-border)] bg-transparent text-[var(--pf-text)] hover:bg-[rgba(245,243,239,0.7)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--pf-text)] hover:bg-[rgba(245,243,239,0.7)]",
  surface:
    "border border-[rgba(224,208,180,0.7)] bg-[rgba(255,255,255,0.94)] text-[var(--pf-text)] shadow-[0_10px_24px_rgba(29,24,20,0.08)] hover:bg-[rgba(255,255,255,0.98)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
} = {}) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(200,154,21,0.38)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pf-surface)] disabled:pointer-events-none disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
  ].join(" ");
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "primary", size = "md", children, type = "button", ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={`${buttonVariants({ variant, size })} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
});
