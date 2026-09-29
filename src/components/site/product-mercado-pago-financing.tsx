"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { CartLine } from "@/components/cart/cart-context";
import { MercadoPagoCheckoutModal } from "@/components/cart/mercado-pago-checkout-modal";
import { PRODUCT_MEASURE_CHANGE_EVENT, type ProductMeasureChangeDetail } from "@/components/site/product-measure-events";
import type { ProductItem } from "@/domain/site-content";
import { resolveProductUnitPrice } from "@/lib/pricing";

type ProductMercadoPagoFinancingProps = {
  product: ProductItem;
  preferenceEndpoint?: string;
};

export function ProductMercadoPagoFinancing({
  product,
  preferenceEndpoint = "/api/mercado-pago/preference",
}: ProductMercadoPagoFinancingProps) {
  const initialMeasure = product.measures?.[0] ?? null;
  const [selection, setSelection] = useState({
    measureId: initialMeasure?.id,
    measureLabel: initialMeasure?.label,
    price: resolveProductUnitPrice(product, initialMeasure),
  });
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    const handleMeasureChange = (event: Event) => {
      const detail = (event as CustomEvent<ProductMeasureChangeDetail>).detail;
      if (detail.productId !== product.id) {
        return;
      }

      setSelection({
        measureId: detail.measureId,
        measureLabel: detail.measureLabel,
        price: detail.price,
      });
    };

    window.addEventListener(PRODUCT_MEASURE_CHANGE_EVENT, handleMeasureChange);
    return () => window.removeEventListener(PRODUCT_MEASURE_CHANGE_EVENT, handleMeasureChange);
  }, [product.id]);

  const checkoutItem = useMemo<CartLine>(
    () => ({
      kind: "product",
      id: product.id,
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      presentation: selection.measureLabel || product.presentation,
      image: product.image,
      publicPrice: selection.price,
      memberPrice: selection.price,
      measureId: selection.measureId,
      measureLabel: selection.measureLabel,
      quantity: 1,
    }),
    [product, selection],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setCheckoutOpen(true)}
        className="inline-flex h-12 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#009ee3] px-3 text-xs font-black text-white transition hover:bg-[#007eb5] sm:px-5 sm:text-sm"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Ver medios y cuotas
      </button>

      {checkoutOpen ? (
        <MercadoPagoCheckoutModal
          endpoint={preferenceEndpoint}
          items={[checkoutItem]}
          total={selection.price}
          totalItems={1}
          onClose={() => setCheckoutOpen(false)}
        />
      ) : null}
    </>
  );
}
