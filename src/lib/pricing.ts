import type { PackItem, ProductItem, ProductMeasure } from "@/domain/site-content";

const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};
const argentinaDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: ARGENTINA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});

type ProductPricingFields = Pick<
  ProductItem,
  "publicPrice" | "measures" | "offerPrice" | "offerMode" | "offerWeekdays" | "offerStartDate" | "offerEndDate"
>;
type OfferPricingFields = Pick<
  ProductMeasure,
  "publicPrice" | "cashPrice" | "offerPrice" | "offerMode" | "offerWeekdays" | "offerStartDate" | "offerEndDate"
>;

function getArgentinaDateParts(now: Date) {
  const parts = Object.fromEntries(
    argentinaDateFormatter.formatToParts(now).map((part) => [part.type, part.value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: WEEKDAY_INDEX[parts.weekday] ?? now.getDay(),
  };
}

function isOfferActive(pricing: OfferPricingFields, now = new Date()) {
  const offerPrice = Number(pricing.offerPrice);
  if (!Number.isFinite(offerPrice) || offerPrice <= 0) {
    return false;
  }

  const mode = pricing.offerMode ?? "off";
  if (mode === "manual") {
    return true;
  }

  const argentinaDate = getArgentinaDateParts(now);
  if (mode === "weekly") {
    return (pricing.offerWeekdays ?? []).map(Number).includes(argentinaDate.weekday);
  }

  if (mode === "period") {
    const startDate = String(pricing.offerStartDate ?? "").slice(0, 10);
    const endDate = String(pricing.offerEndDate ?? "").slice(0, 10);
    return Boolean(startDate && endDate && argentinaDate.date >= startDate && argentinaDate.date <= endDate);
  }

  return false;
}

function resolveMeasure(product: ProductPricingFields, measure?: Pick<ProductMeasure, "id"> | null) {
  return measure ? product.measures?.find((item) => item.id === measure.id) : product.measures?.[0];
}

function getMeasurePricing(product: ProductPricingFields, measure?: Pick<ProductMeasure, "id"> | null): OfferPricingFields {
  const selectedMeasure = resolveMeasure(product, measure);
  return {
    publicPrice: selectedMeasure?.publicPrice ?? product.publicPrice,
    cashPrice: selectedMeasure?.cashPrice ?? (product as ProductItem).cashPrice,
    offerPrice: selectedMeasure?.offerPrice ?? product.offerPrice,
    offerMode: selectedMeasure?.offerMode ?? product.offerMode,
    offerWeekdays: selectedMeasure?.offerWeekdays ?? product.offerWeekdays,
    offerStartDate: selectedMeasure?.offerStartDate ?? product.offerStartDate,
    offerEndDate: selectedMeasure?.offerEndDate ?? product.offerEndDate,
  };
}

export function isProductOfferActive(product: ProductPricingFields, measure?: Pick<ProductMeasure, "id"> | null, now = new Date()) {
  return isOfferActive(getMeasurePricing(product, measure), now);
}

export function resolveProductUnitPrice(
  product: ProductPricingFields,
  measure?: Pick<ProductMeasure, "id"> | null,
  now = new Date(),
) {
  const pricing = getMeasurePricing(product, measure);
  return isOfferActive(pricing, now) ? Number(pricing.offerPrice) : pricing.publicPrice;
}

export function resolveProductCashPrice(product: ProductPricingFields, measure?: Pick<ProductMeasure, "id"> | null) {
  const pricing = getMeasurePricing(product, measure);
  return Number(pricing.cashPrice) > 0 ? Number(pricing.cashPrice) : pricing.publicPrice;
}

export function getProductListPriceLabel(product: ProductPricingFields, measure?: Pick<ProductMeasure, "id"> | null, now = new Date()) {
  return isProductOfferActive(product, measure, now) ? "Precio de oferta" : "Precio de lista";
}

export function resolvePackUnitPrice(pack: Pick<PackItem, "publicPrice">) {
  return pack.publicPrice;
}
