"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/catalog";
import { PRODUCT_MEASURE_CHANGE_EVENT, type ProductMeasureChangeDetail } from "@/components/site/product-measure-events";

export function ProductDynamicPrice({ productId, initialPrice, priceKey = "price" }: { productId: number; initialPrice: number; priceKey?: "price" | "cashPrice" }) {
  const [price, setPrice] = useState(initialPrice);

  useEffect(() => {
    setPrice(initialPrice);
  }, [initialPrice]);

  useEffect(() => {
    const handleMeasureChange = (event: Event) => {
      const detail = (event as CustomEvent<ProductMeasureChangeDetail>).detail;
      const nextPrice = detail[priceKey];
      if (detail.productId === productId && typeof nextPrice === "number") {
        setPrice(nextPrice);
      }
    };

    window.addEventListener(PRODUCT_MEASURE_CHANGE_EVENT, handleMeasureChange);
    return () => window.removeEventListener(PRODUCT_MEASURE_CHANGE_EVENT, handleMeasureChange);
  }, [productId, priceKey]);

  return <>{formatCurrency(price)}</>;
}
