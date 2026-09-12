"use client";

import { useState } from "react";
import { CartAddButton } from "@/components/cart/cart-add-button";
import type { ProductItem, ProductMeasure } from "@/domain/site-content";
import { formatCurrency } from "@/lib/catalog";
import { PRODUCT_MEASURE_CHANGE_EVENT } from "@/components/site/product-measure-events";

function getDimensions(measure: ProductMeasure) {
  const values = [measure.width, measure.depth, measure.height];
  return values.every((value) => value != null)
    ? `${measure.width} x ${measure.depth} x ${measure.height} ${measure.unit ?? "cm"}`
    : "Medida disponible";
}

export function ProductMeasurePicker({ product }: { product: ProductItem }) {
  const measures = product.measures ?? [];
  const [selectedMeasureId, setSelectedMeasureId] = useState(measures[0]?.id ?? "");
  const selectedMeasure = measures.find((measure) => measure.id === selectedMeasureId) ?? measures[0] ?? null;

  const selectMeasure = (measure: ProductMeasure) => {
    setSelectedMeasureId(measure.id);
    window.dispatchEvent(
      new CustomEvent(PRODUCT_MEASURE_CHANGE_EVENT, {
        detail: { productId: product.id, price: measure.publicPrice },
      }),
    );
  };

  if (measures.length === 0) {
    return (
      <CartAddButton product={product} className="h-12 px-6 text-sm uppercase tracking-[0.22em]">
        Agregar al carrito
      </CartAddButton>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {measures.map((measure) => {
          const selected = measure.id === selectedMeasure?.id;
          return (
            <button
              key={measure.id}
              type="button"
              onClick={() => selectMeasure(measure)}
              className={`rounded-[1.35rem] border px-5 py-4 text-left transition hover:-translate-y-0.5 ${
                selected
                  ? "border-[rgba(200,154,21,0.48)] bg-[linear-gradient(180deg,rgba(246,226,167,0.54),rgba(255,250,240,0.94))] shadow-[0_14px_28px_rgba(200,154,21,0.13)]"
                  : "border-[rgba(29,24,20,0.1)] bg-white hover:border-[rgba(200,154,21,0.3)]"
              }`}
            >
              <span className="block text-base font-bold text-[var(--pf-text)]">{measure.label}</span>
              <span className="mt-2 block text-sm text-[var(--pf-muted)]">{getDimensions(measure)}</span>
              <span className="mt-3 block text-lg font-black text-[var(--pf-primary-darker)]">{formatCurrency(measure.publicPrice)}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center">
        <CartAddButton product={product} measure={selectedMeasure} className="h-12 px-6 text-sm uppercase tracking-[0.22em]">
          Agregar al carrito
        </CartAddButton>
      </div>
    </div>
  );
}
