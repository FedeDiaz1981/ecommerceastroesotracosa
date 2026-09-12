"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "motion/react";
import type { ProductItem } from "@/domain/site-content";
import { formatCurrency, isNewArrival, isVideoAsset, publicAsset } from "@/lib/catalog";
import { appendReturnTo } from "@/lib/navigation";
import { resolveProductUnitPrice } from "@/lib/pricing";
import { ProductDetailModal } from "@/components/site/product-detail-modal";
import { Button } from "@/components/ui/button";

function getInventoryLabel(product: ProductItem) {
  if (product.stock == null) {
    return null;
  }

  if (product.stock <= 0) {
    return "Agotado";
  }

  return `${product.stock} unidades`;
}

function getNewLabel(product: ProductItem) {
  return isNewArrival({
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  })
    ? "Novedad"
    : null;
}

function getSpecialPrice(product: ProductItem) {
  if (product.memberPrice > 0 && product.memberPrice < product.publicPrice) {
    return product.memberPrice;
  }

  return null;
}

function getPhotoCount(product: ProductItem) {
  return product.images?.length ?? (product.image ? 1 : 0);
}

function getVariantCount(product: ProductItem) {
  return product.fabricVariants?.length ?? product.fabricIds?.length ?? 0;
}

function ProductSeal({ label }: { label: string }) {
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(200,154,21,0.22)] bg-[var(--pf-primary-darker)] text-[9px] font-black uppercase leading-none tracking-[0.12em] text-white shadow-[0_8px_16px_rgba(29,24,20,0.18)]">
      {label}
    </span>
  );
}

function FeaturedCard({
  product,
  returnTo,
  onOpen,
  compact = false,
}: {
  product: ProductItem;
  returnTo?: string;
  onOpen: (product: ProductItem) => void;
  compact?: boolean;
}) {
  const newLabel = getNewLabel(product);
  const inventoryLabel = getInventoryLabel(product);
  const isOutOfStock = product.stock != null ? product.stock <= 0 : product.status !== "published";
  const photoCount = getPhotoCount(product);
  const variantCount = getVariantCount(product);
  const specialPrice = getSpecialPrice(product);
  const unitPrice = resolveProductUnitPrice(product);
  const detailHref = appendReturnTo(`/producto/${product.sku}`, returnTo);

  return (
    <motion.article
      data-featured-card
      initial={{ opacity: 0.65, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(product)}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(product);
        }
      }}
      className={`group block h-full w-full text-left ${compact ? "min-w-0" : "shrink-0"} cursor-pointer`}
    >
      <article className={`flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-[rgba(29,24,20,0.14)] bg-white shadow-[0_10px_28px_rgba(29,24,20,0.08)] ${compact ? "min-h-[25rem]" : "min-h-[27rem]"}`}>
        <div className="relative flex-[1.12] overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,247,244,1))]">
          <div className="absolute left-3 top-3 z-10">
            {newLabel ? (
              <span
                className="inline-flex items-center justify-center rounded-full border border-[rgba(200,154,21,0.2)] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] shadow-[0_10px_20px_rgba(29,24,20,0.18)]"
                style={{ backgroundColor: "var(--pf-primary-darker)", color: "#ffffff" }}
              >
                Novedad
              </span>
            ) : null}
          </div>
          <div className="absolute right-3 top-3 z-10">
            {isOutOfStock ? (
              <span className="inline-flex min-h-12 items-center justify-center rounded-full border border-[rgba(227,48,38,0.18)] bg-[#e33026] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_20px_rgba(29,24,20,0.18)]">
                {inventoryLabel ?? "Agotado"}
              </span>
            ) : null}
          </div>

          <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-2">
            {photoCount > 1 ? (
              <span className="inline-flex items-center rounded-full border border-[rgba(29,24,20,0.12)] bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--pf-text)] shadow-[0_8px_18px_rgba(29,24,20,0.12)]">
                +{photoCount - 1} fotos
              </span>
            ) : null}
            {variantCount > 0 ? (
              <span className="inline-flex items-center rounded-full border border-[rgba(29,24,20,0.12)] bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--pf-text)] shadow-[0_8px_18px_rgba(29,24,20,0.12)]">
                {variantCount} variantes
              </span>
            ) : null}
          </div>

          <div className="absolute inset-0">
            {isVideoAsset(product.image) ? (
              <video src={publicAsset(product.image)} muted playsInline className="h-full w-full object-contain p-4" />
            ) : (
              <Image
                src={publicAsset(product.image)}
                alt={product.name}
                fill
                className="object-contain p-4 transition duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 82vw, 19rem"
              />
            )}
          </div>

          <div className="absolute bottom-16 left-3 flex flex-wrap gap-2">
            {product.vegano ? <ProductSeal label="Vegano" /> : null}
            {product.kosher ? <ProductSeal label="Kosher" /> : null}
            {product.testeadoEnAnimales === false ? <ProductSeal label="Cruelty free" /> : null}
          </div>
        </div>

        <div className={`flex flex-col justify-between border-t border-[rgba(29,24,20,0.08)] px-3 py-3 ${compact ? "min-h-[8.5rem]" : "min-h-[8.75rem]"}`}>
          <div className="text-center">
            <h3 className={`line-clamp-2 font-medium leading-6 text-[var(--pf-text)] ${compact ? "text-[0.92rem]" : "text-[0.98rem]"}`}>
              {product.name}
            </h3>
            <p className={`mt-2 font-black tracking-[-0.03em] text-[var(--pf-text)] ${compact ? "text-[1rem]" : "text-[1.02rem]"}`}>
              {formatCurrency(unitPrice)}
            </p>
            {specialPrice ? (
              <p className="mt-1 text-[11px] font-semibold text-[var(--pf-primary-darker)]">
                Transferencia / efectivo {formatCurrency(specialPrice)}
              </p>
            ) : (
              <p className="mt-1 text-[11px] font-semibold text-[var(--pf-muted)]">
                {product.installmentCount ? `${product.installmentCount} cuotas disponibles` : "Cuotas disponibles"}
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[rgba(212,168,26,0.18)] bg-[rgba(200,154,21,0.08)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--pf-text)]">
                Cuotas
              </span>
              {photoCount > 1 ? (
                <span className="inline-flex items-center rounded-full border border-[rgba(212,168,26,0.18)] bg-[rgba(255,255,255,0.9)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--pf-text)]">
                  +{photoCount - 1} fotos
                </span>
              ) : null}
              {variantCount > 0 ? (
                <span className="inline-flex items-center rounded-full border border-[rgba(212,168,26,0.18)] bg-[rgba(255,255,255,0.9)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--pf-text)]">
                  {variantCount} variantes
                </span>
              ) : null}
            </div>

            <Link
              href={detailHref}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center rounded-full border border-[rgba(29,24,20,0.12)] bg-[linear-gradient(180deg,var(--pf-primary-soft),var(--pf-primary))] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_20px_rgba(29,24,20,0.12)] transition hover:brightness-105"
            >
              Ver detalle
            </Link>
          </div>
        </div>
      </article>
    </motion.article>
  );
}

function MobileFeaturedRail({
  products,
  returnTo,
  onOpen,
}: {
  products: ProductItem[];
  returnTo?: string;
  onOpen: (product: ProductItem) => void;
}) {
  const [emblaRef] = useEmblaCarousel({ loop: products.length > 1, align: "start" });

  return (
    <div className="relative md:hidden">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {products.map((product) => (
            <div key={product.id} className="min-w-0 flex-[0_0_66vw] px-2 pb-3">
              <FeaturedCard product={product} returnTo={returnTo} onOpen={onOpen} compact />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeaturedProductsCarousel({ products, returnTo }: { products: ProductItem[]; returnTo?: string }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  const scrollByCards = (direction: number) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const card = track.querySelector<HTMLElement>("[data-featured-card]");
    const cardWidth = card?.offsetWidth ?? 300;
    const gap = 16;

    track.scrollBy({
      left: direction * (cardWidth + gap),
      behavior: "smooth",
    });
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <>
      <MobileFeaturedRail products={products} returnTo={returnTo} onOpen={setSelectedProduct} />

      <div className="relative hidden md:block">
        <Button
          type="button"
          onClick={() => scrollByCards(-1)}
          variant="secondary"
          size="icon"
          className="absolute left-0 top-1/2 z-20 -translate-x-2 -translate-y-1/2 transition hover:scale-105"
          aria-label="Ver productos anteriores"
        >
          <ChevronLeft className="size-6" />
        </Button>

        <Button
          type="button"
          onClick={() => scrollByCards(1)}
          variant="secondary"
          size="icon"
          className="absolute right-0 top-1/2 z-20 translate-x-2 -translate-y-1/2 transition hover:scale-105"
          aria-label="Ver productos siguientes"
        >
          <ChevronRight className="size-6" />
        </Button>

        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => (
            <div key={product.id} className="w-[min(78vw,16.75rem)] shrink-0 snap-start sm:w-[17rem] lg:w-[17.5rem]">
              <FeaturedCard product={product} returnTo={returnTo} onOpen={setSelectedProduct} />
            </div>
          ))}
        </div>
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
