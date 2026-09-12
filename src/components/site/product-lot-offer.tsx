import type { ProductItem, ProductLotItem } from "@/domain/site-content";

export function ProductLotOffer({
  lot,
}: {
  product: ProductItem;
  lot: ProductLotItem;
}) {
  return (
    <section className="space-y-8">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[var(--pf-secondary-dark)]">
          Compra colectiva
        </p>
        <h3 className="mt-4 font-serif text-[clamp(2.2rem,5vw,4.6rem)] leading-[0.95] tracking-[-0.05em] text-[var(--pf-text)]">
          {lot.title}
        </h3>
      </div>

      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
        <article className="rounded-[1.5rem] border border-[rgba(200,154,21,0.16)] bg-[rgba(255,255,255,0.7)] px-6 py-5 text-center shadow-[0_12px_28px_rgba(29,24,20,0.05)]">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[var(--pf-muted)]">
            Cantidad colectiva
          </p>
          <p className="mt-3 text-[clamp(2rem,4vw,3rem)] font-black leading-none text-[var(--pf-text)]">
            {lot.totalUnits}
          </p>
          <p className="mt-2 text-sm text-[var(--pf-muted)]">Unidades del lote</p>
        </article>
      </div>
    </section>
  );
}
