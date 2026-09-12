"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/catalog";
import { PRODUCT_MEASURE_CHANGE_EVENT } from "@/components/site/product-measure-events";

export function ProductDynamicPrice({ productId, initialPrice }: { productId: number; initialPrice: number }) {
  const [price, setPrice] = useState(initialPrice);

  useEffect(() => {
    const handleMeasureChange = (event: Event) => {
      const detail = (event as CustomEvent<{ productId?: number; price?: number }>).detail;
      if (detail.productId === productId && typeof detail.price === "number") {
        setPrice(detail.price);
      }
    };

    window.addEventListener(PRODUCT_MEASURE_CHANGE_EVENT, handleMeasureChange);
    return () => window.removeEventListener(PRODUCT_MEASURE_CHANGE_EVENT, handleMeasureChange);
  }, [productId]);

  return <>{formatCurrency(price)}</>;
}
