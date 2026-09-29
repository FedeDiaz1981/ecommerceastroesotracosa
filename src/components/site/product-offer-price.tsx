"use client";

import { useEffect, useState } from "react";
import { PRODUCT_MEASURE_CHANGE_EVENT, type ProductMeasureChangeDetail } from "@/components/site/product-measure-events";
import { formatCurrency } from "@/lib/catalog";

export function ProductOfferPrice({
  productId,
  initialListPrice,
  offerPrice,
  offerActive,
  className = "",
  listPriceClassName = "",
  offerPriceClassName = "",
}: {
  productId: number;
  initialListPrice: number;
  offerPrice?: number;
  offerActive: boolean;
  className?: string;
  listPriceClassName?: string;
  offerPriceClassName?: string;
}) {
  const [listPrice, setListPrice] = useState(initialListPrice);
  const [currentOfferPrice, setCurrentOfferPrice] = useState(offerPrice);
  const [currentOfferActive, setCurrentOfferActive] = useState(offerActive);

  useEffect(() => {
    const handleMeasureChange = (event: Event) => {
      const detail = (event as CustomEvent<ProductMeasureChangeDetail>).detail;
      if (detail.productId === productId && typeof detail.listPrice === "number") {
        setListPrice(detail.listPrice);
        setCurrentOfferPrice(detail.price);
        setCurrentOfferActive(Boolean(detail.offerActive));
      }
    };

    window.addEventListener(PRODUCT_MEASURE_CHANGE_EVENT, handleMeasureChange);
    return () => window.removeEventListener(PRODUCT_MEASURE_CHANGE_EVENT, handleMeasureChange);
  }, [productId]);

  if (!currentOfferActive || !currentOfferPrice) {
    return <span className={className}>{formatCurrency(listPrice)}</span>;
  }

  return (
    <span className={`inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 ${className}`}>
      <span
        className={`relative inline-flex text-[var(--pf-muted)] before:absolute before:left-0 before:top-1/2 before:h-px before:w-full before:-rotate-[12deg] before:bg-current after:absolute after:left-0 after:top-1/2 after:h-px after:w-full after:rotate-[12deg] after:bg-current ${listPriceClassName}`}
      >
        {formatCurrency(listPrice)}
      </span>
      <span className={offerPriceClassName}>{formatCurrency(currentOfferPrice)}</span>
      <span className="rounded-full bg-[var(--pf-accent)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
        Oferta
      </span>
    </span>
  );
}
