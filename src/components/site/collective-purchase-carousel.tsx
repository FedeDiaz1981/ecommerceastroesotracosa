"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { ProductLotItem } from "@/domain/site-content";
import { Button } from "@/components/ui/button";
import { appendReturnTo } from "@/lib/navigation";
import { formatCurrency, publicAsset } from "@/lib/catalog";

function getSavings(lot: ProductLotItem) {
  return Math.max(0, lot.regularUnitPrice - lot.lotUnitPrice);
}

function CollectiveLotCard({
  lot,
  returnTo,
}: {
  lot: ProductLotItem;
  returnTo?: string;
}) {
  const href = appendReturnTo(
    `/compra-colectiva/${lot.id}`,
    returnTo ?? "/",
  );
  const savings = getSavings(lot);

  return (
    <Link href={href} className="group block h-full w-full">
      <article className="flex h-full min-h-[24.5rem] flex-col overflow-hidden rounded-[1.5rem] border border-[rgba(29,24,20,0.16)] bg-white shadow-[0_10px_28px_rgba(29,24,20,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(29,24,20,0.14)]">
        <div className="relative flex-[1.08] overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,247,244,1))]">
          <div className="absolute left-3 top-3 z-10">
            <span className="inline-flex items-center justify-center rounded-full border border-[rgba(217,43,34,0.22)] bg-[var(--pf-accent)] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_20px_rgba(29,24,20,0.18)]">
              Compra colectiva
            </span>
          </div>

          <div className="absolute right-3 top-3 z-10 rounded-full border border-[rgba(212,168,26,0.2)] bg-[rgba(255,255,255,0.94)] px-3 py-1 text-[11px] font-semibold text-[var(--pf-primary-darker)] shadow-[0_8px_18px_rgba(29,24,20,0.08)]">
            {lot.availableUnits} disponibles
          </div>

          <div className="absolute inset-0">
            <Image
              src={publicAsset(lot.image ?? "")}
              alt={lot.title}
              fill
              className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 82vw, 19rem"
            />
          </div>
        </div>

        <div className="flex h-[7.4rem] flex-col justify-center gap-1 border-t border-[rgba(29,24,20,0.08)] px-4 py-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--pf-muted)]">
            {lot.productName || lot.productSku || `Producto ${lot.productId}`}
          </p>
          <h3 className="line-clamp-2 text-[0.98rem] font-medium leading-6 text-[var(--pf-text)]">{lot.title}</h3>
          <p className="mt-1 text-sm font-semibold text-[var(--pf-primary-darker)]">
            {formatCurrency(lot.lotUnitPrice)}
            {savings > 0 ? ` · Ahorrás ${formatCurrency(savings)}` : ""}
          </p>
          <p className="text-[11px] text-[var(--pf-muted)]">
            {lot.fixedFabricName ? `Tela fija: ${lot.fixedFabricName}` : "Tela fija asignada"}
          </p>
        </div>
      </article>
    </Link>
  );
}

function MobileCollectiveRail({
  lots,
  returnTo,
}: {
  lots: ProductLotItem[];
  returnTo?: string;
}) {
  const [emblaRef] = useEmblaCarousel({ loop: lots.length > 1, align: "start" });

  return (
    <div className="relative md:hidden">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {lots.map((lot) => (
            <div key={lot.id} className="min-w-0 flex-[0_0_66vw] px-2 pb-3">
              <CollectiveLotCard lot={lot} returnTo={returnTo} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CollectivePurchaseCarousel({
  lots,
  returnTo,
}: {
  lots: ProductLotItem[];
  returnTo?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const scrollByCards = (direction: number) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const card = track.querySelector<HTMLElement>("[data-collective-card]");
    const cardWidth = card?.offsetWidth ?? 300;
    const gap = 16;

    track.scrollBy({
      left: direction * (cardWidth + gap),
      behavior: "smooth",
    });
  };

  if (lots.length === 0) {
    return null;
  }

  return (
    <>
      <MobileCollectiveRail lots={lots} returnTo={returnTo} />

      <div className="relative hidden md:block">
        <Button
          type="button"
          onClick={() => scrollByCards(-1)}
          variant="secondary"
          size="icon"
          className="absolute left-0 top-1/2 z-20 -translate-x-2 -translate-y-1/2 transition hover:scale-105"
          aria-label="Ver lotes anteriores"
        >
          <ChevronLeft className="size-6" />
        </Button>

        <Button
          type="button"
          onClick={() => scrollByCards(1)}
          variant="secondary"
          size="icon"
          className="absolute right-0 top-1/2 z-20 translate-x-2 -translate-y-1/2 transition hover:scale-105"
          aria-label="Ver lotes siguientes"
        >
          <ChevronRight className="size-6" />
        </Button>

        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {lots.map((lot) => (
            <div key={lot.id} data-collective-card className="w-[min(78vw,16.75rem)] shrink-0 snap-start sm:w-[17rem] lg:w-[17.5rem]">
              <CollectiveLotCard lot={lot} returnTo={returnTo} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
