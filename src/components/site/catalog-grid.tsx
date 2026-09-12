"use client";

import { useState } from "react";
import { ProductDetailModal } from "@/components/site/product-detail-modal";
import { ProductCard } from "@/components/site/product-card";
import type { ProductItem } from "@/domain/site-content";

function getColumnClass(columns: number) {
  if (columns <= 2) {
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2";
  }

  if (columns >= 4) {
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  }

  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
}

export function CatalogGrid({
  products,
  columns = 3,
  returnTo,
}: {
  products: ProductItem[];
  columns?: number;
  returnTo?: string;
}) {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  return (
    <>
      <div className={`grid gap-4 ${getColumnClass(columns)}`}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelect={setSelectedProduct}
            href={`/producto/${product.sku}`}
            returnTo={returnTo}
          />
        ))}
      </div>

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        returnTo={returnTo}
        relatedProducts={products.filter((item) => selectedProduct?.relatedProductIds?.includes(item.id))}
      />
    </>
  );
}
