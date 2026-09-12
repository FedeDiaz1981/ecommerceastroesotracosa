"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import type { ProductItem } from "@/domain/site-content";
import { formatCurrency } from "@/lib/catalog";
import { isNewArrival, isVideoAsset, publicAsset } from "@/lib/catalog";
import { appendReturnTo } from "@/lib/navigation";
import { resolveProductUnitPrice } from "@/lib/pricing";

function getInventoryLabel(product: ProductItem) {
  if (product.stock == null) {
    return null;
  }

  if (product.stock <= 0) {
    return "Agotado";
  }

  return `${product.stock} unidades`;
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

export function ProductCard({
  product,
  onSelect,
  href,
  returnTo,
}: {
  product: ProductItem;
  onSelect?: (product: ProductItem) => void;
  href?: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const isNew = isNewArrival({
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  });
  const inventoryLabel = getInventoryLabel(product);
  const isOutOfStock = product.stock != null ? product.stock <= 0 : product.status !== "published";
  const photoCount = getPhotoCount(product);
  const variantCount = getVariantCount(product);
  const specialPrice = getSpecialPrice(product);
  const unitPrice = resolveProductUnitPrice(product);
  const detailHref = href ? appendReturnTo(href, returnTo) : "";
  const hasModalAction = Boolean(onSelect);
  const isClickable = hasModalAction || Boolean(detailHref);

  const handleCardAction = () => {
    if (onSelect) {
      onSelect(product);
      return;
    }

    if (detailHref) {
      router.push(detailHref);
    }
  };

  return (
    <article
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleCardAction}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (!isClickable) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardAction();
        }
      }}
      className={`group flex h-full min-h-[24.5rem] flex-col overflow-hidden rounded-[1.5rem] border border-[rgba(212,168,26,0.26)] bg-white text-left shadow-[0_10px_28px_rgba(29,24,20,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(29,24,20,0.14)] ${
        isClickable ? "cursor-pointer" : ""
      }`}
    >
      <div className="relative flex-[1.08] overflow-hidden bg-[linear-gradient(180deg,rgba(255,250,241,1),rgba(246,241,231,1))]">
        <div className="absolute left-3 top-3 z-10">
          {isNew ? (
            <span className="inline-flex items-center justify-center rounded-full border border-[rgba(212,168,26,0.34)] bg-[linear-gradient(135deg,var(--pf-primary),var(--pf-primary-dark))] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_20px_rgba(29,24,20,0.18)]">
              Novedad
            </span>
          ) : null}
        </div>

        <div className="absolute right-3 top-3 z-10">
          {isOutOfStock ? (
            <span className="inline-flex items-center justify-center rounded-full border border-[rgba(227,48,38,0.18)] bg-[var(--pf-accent)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_20px_rgba(29,24,20,0.18)]">
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

        <div className="absolute inset-0 p-4">
          <div className="relative h-full w-full overflow-hidden rounded-[1.15rem] bg-[rgba(255,255,255,0.98)] shadow-[0_18px_36px_rgba(29,24,20,0.10)]">
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
        </div>
      </div>

      <div className="flex min-h-[9.25rem] flex-col justify-between border-t border-[rgba(212,168,26,0.16)] px-4 py-3">
        <div className="text-center">
          <h3 className="line-clamp-2 text-[0.98rem] font-medium leading-6 text-[var(--pf-text)]">{product.name}</h3>
          <p className="mt-2 text-[1.02rem] font-black tracking-[-0.03em] text-[var(--pf-text)]">{formatCurrency(unitPrice)}</p>
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
          <div className="flex flex-wrap gap-2">
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

          {detailHref ? (
            <Link
              href={detailHref}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center rounded-full border border-[rgba(29,24,20,0.12)] bg-[linear-gradient(180deg,var(--pf-primary-soft),var(--pf-primary))] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_20px_rgba(29,24,20,0.12)] transition hover:brightness-105"
            >
              Ver detalle
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
