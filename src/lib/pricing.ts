import type { PackItem, ProductItem, ProductMeasure } from "@/domain/site-content";
export function resolveProductUnitPrice(product: Pick<ProductItem, "publicPrice" | "memberPrice" | "measures">, measure?: Pick<ProductMeasure, "id"> | null) {
  if (measure) {
    const selected = product.measures?.find((item) => item.id === measure.id);
    if (selected) return selected.publicPrice;
  }
  return product.publicPrice;
}

export function resolvePackUnitPrice(pack: Pick<PackItem, "publicPrice">) {
  return pack.publicPrice;
}

