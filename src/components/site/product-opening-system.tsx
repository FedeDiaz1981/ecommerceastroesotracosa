"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ProductMeasure } from "@/domain/site-content";
import { publicAsset } from "@/lib/catalog";
import { PRODUCT_MEASURE_CHANGE_EVENT, type ProductMeasureChangeDetail } from "@/components/site/product-measure-events";

type OpeningSystemState = {
  image: string;
  visible: boolean;
};

function getOpeningSystemState(measure: ProductMeasure | null): OpeningSystemState {
  return {
    image: measure?.openingSystemImage?.trim() ?? "",
    visible: measure?.showOpeningSystem !== false && Boolean(measure?.openingSystemImage?.trim()),
  };
}

export function ProductOpeningSystem({ productId, initialMeasure }: { productId: number; initialMeasure: ProductMeasure | null }) {
  const [openingSystem, setOpeningSystem] = useState(() => getOpeningSystemState(initialMeasure));

  useEffect(() => {
    const handleMeasureChange = (event: Event) => {
      const detail = (event as CustomEvent<ProductMeasureChangeDetail>).detail;

      if (detail.productId !== productId) {
        return;
      }

      const image = detail.openingSystemImage?.trim() ?? "";
      setOpeningSystem({ image, visible: detail.showOpeningSystem && Boolean(image) });
    };

    window.addEventListener(PRODUCT_MEASURE_CHANGE_EVENT, handleMeasureChange);
    return () => window.removeEventListener(PRODUCT_MEASURE_CHANGE_EVENT, handleMeasureChange);
  }, [productId]);

  if (!openingSystem.visible) {
    return null;
  }

  return (
    <section className="border-b border-[rgba(0,0,0,0.08)] py-12">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="font-serif text-[clamp(1.8rem,3vw,3rem)] leading-tight tracking-[-0.03em] text-[var(--pf-text)]">
          Sistema de apertura
        </h2>
        <p className="mt-4 text-sm leading-7 text-[var(--pf-muted)]">Dibujo de ejemplo meramente ilustrativo.</p>
      </div>

      <div className="mt-10 flex justify-center">
        <div className="relative w-full max-w-5xl overflow-hidden bg-transparent px-6 py-8 sm:px-10 sm:py-12">
          <Image
            key={openingSystem.image}
            src={publicAsset(openingSystem.image)}
            alt="Sistema de apertura"
            width={1200}
            height={900}
            className="h-auto w-full object-contain"
            priority={false}
          />
        </div>
      </div>
    </section>
  );
}
