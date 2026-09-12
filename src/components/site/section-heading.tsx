import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[rgba(212,168,26,0.24)] pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-5">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="h-[1px] w-8 bg-[linear-gradient(90deg,var(--pf-accent),var(--pf-primary))]" />
          <span className="h-2 w-2 rounded-full bg-[var(--pf-accent)] shadow-[0_0_10px_rgba(217,43,34,0.5)]" />
          <p className="text-[10px] font-black uppercase tracking-[0.42em] text-[var(--pf-primary-dark)]">{eyebrow}</p>
        </div>
        <h2 className="mt-3 text-[2rem] font-extrabold tracking-[-0.06em] text-[var(--pf-text)] sm:text-[2.75rem] lg:text-[3.1rem]">
          {title}
        </h2>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--pf-muted)] sm:text-[0.98rem]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
