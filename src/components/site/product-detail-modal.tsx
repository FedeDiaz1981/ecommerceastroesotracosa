"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { recordProductView } from "@/app/catalog-actions";
import { useViewer } from "@/components/auth/viewer-provider";
import { CartAddButton } from "@/components/cart/cart-add-button";
import { ProductLotOffer } from "@/components/site/product-lot-offer";
import type { ProductItem } from "@/domain/site-content";
import { formatCurrency, isVideoAsset, publicAsset } from "@/lib/catalog";
import { appendReturnTo } from "@/lib/navigation";
import { resolveProductUnitPrice } from "@/lib/pricing";
import { buildProductWhatsAppHref } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function getStockLabel(product: ProductItem) {
  if (product.stock == null) {
    return "A pedido";
  }

  if (product.stock <= 0) {
    return "Agotado";
  }

  return `${product.stock} unidades`;
}

export function ProductDetailModal({
  product,
  onClose,
  returnTo,
  relatedProducts = [],
}: {
  product: ProductItem | null;
  onClose: () => void;
  returnTo?: string;
  relatedProducts?: ProductItem[];
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const detailsDialogRef = useRef<HTMLDialogElement | null>(null);
  const addTimerRef = useRef<number | null>(null);
  const trackedProductIdRef = useRef<number | null>(null);
  const viewer = useViewer();
  const canSeeCollectivePurchase = Boolean(viewer?.authenticated);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [selectedFabricId, setSelectedFabricId] = useState<number | null>(null);
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (product) {
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [product]);

  useEffect(() => {
    if (!product) {
      setQuantity(1);
      setIsAdding(false);
      setShowFullDetails(false);
      setSelectedFabricId(null);
      setSelectedMeasureId(null);
      return;
    }

    setQuantity(1);
    setIsAdding(false);
    setShowFullDetails(false);
    setSelectedFabricId(product.fabricVariants?.[0]?.fabricId ?? null);
    setSelectedMeasureId(product.measures?.[0]?.id ?? null);
  }, [product?.id]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);

    return () => {
      dialog.removeEventListener("close", handleClose);
    };
  }, [onClose]);

  useEffect(() => {
    if (!product) {
      return;
    }

    if (trackedProductIdRef.current === product.id) {
      return;
    }

    trackedProductIdRef.current = product.id;
    void recordProductView(product.id).catch(() => undefined);
  }, [product]);

  useEffect(() => {
    const dialog = detailsDialogRef.current;

    if (!dialog) {
      return;
    }

    if (!product || !showFullDetails) {
      if (dialog.open) {
        dialog.close();
      }
      return;
    }

    if (!dialog.open) {
      dialog.showModal();
    }
  }, [product, showFullDetails]);

  useEffect(() => {
    const dialog = detailsDialogRef.current;

    if (!dialog) {
      return;
    }

    const handleClose = () => setShowFullDetails(false);
    dialog.addEventListener("close", handleClose);

    return () => {
      dialog.removeEventListener("close", handleClose);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (addTimerRef.current !== null) {
        window.clearTimeout(addTimerRef.current);
      }
    };
  }, []);

  const maxQuantity = useMemo(() => {
    if (!product?.stock || product.stock <= 0) {
      return 99;
    }

    return product.stock;
  }, [product]);

  const safeQuantity = Math.min(Math.max(quantity, 1), maxQuantity);
  const selectedMeasure = product?.measures?.find((measure) => measure.id === selectedMeasureId) ?? product?.measures?.[0] ?? null;
  const unitPrice = product ? resolveProductUnitPrice(product, selectedMeasure) : 0;
  const totalPrice = product ? unitPrice * safeQuantity : 0;
  const fullDescription = (product?.description || product?.detail || "").trim();
  const truncatedDescriptionLimit = 180;
  const shouldTruncateDescription = fullDescription.length > truncatedDescriptionLimit;
  const shortDescription = shouldTruncateDescription
    ? `${fullDescription.slice(0, truncatedDescriptionLimit).trimEnd()}...`
    : fullDescription;
  const activeLot =
    product?.activeLot ??
    product?.lotOffers?.find((item) => item.availableUnits > 0 && ["open", "published", "active", "reservable"].includes(item.status)) ??
    null;
  const fabricVariants = product?.fabricVariants ?? [];
  const selectedFabricVariant =
    fabricVariants.find((variant) => variant.fabricId === selectedFabricId) ?? fabricVariants[0] ?? null;
  const selectedImage = selectedFabricVariant?.image ?? product?.images?.[0] ?? product?.image ?? "";
  const detailHref = product ? appendReturnTo(`/producto/${product.sku}`, returnTo) : "";
  const whatsappHref = product ? buildProductWhatsAppHref(product, safeQuantity) : "#asesor";

  return (
    <>
      <dialog
        ref={dialogRef}
        className="modal !z-[12050] p-3 sm:p-6 [&::backdrop]:bg-[rgba(17,17,17,0.52)] [&::backdrop]:backdrop-blur-[10px]"
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
      >
        <div className="modal-box w-full max-w-6xl max-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-[1.5rem] border border-[rgba(200,154,21,0.18)] bg-[linear-gradient(180deg,rgba(255,253,248,0.98)_0%,rgba(248,244,236,0.98)_100%)] p-0 text-[var(--pf-text)] shadow-[0_26px_72px_rgba(29,24,20,0.18)] sm:rounded-[1.9rem]">
          <div className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain">
          {product ? (
            <div className="grid gap-0 lg:grid-cols-[1fr_0.95fr]">
              <div className="border-b border-[rgba(200,154,21,0.12)] bg-[linear-gradient(180deg,rgba(244,236,223,0.9),rgba(253,250,244,0.98))] p-4 sm:p-6 lg:border-b-0 lg:border-r lg:p-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full border border-[rgba(200,154,21,0.18)] bg-[rgba(255,255,255,0.72)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-[var(--pf-primary-darker)] shadow-[0_8px_16px_rgba(29,24,20,0.06)]">
                    Vista rápida
                  </span>
                  {fabricVariants.length > 0 ? (
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--pf-muted)]">
                      {fabricVariants.length} variantes
                    </span>
                  ) : null}
                </div>

                <div className="relative min-h-[300px] overflow-hidden rounded-[1.75rem] border border-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.82)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_18px_38px_rgba(29,24,20,0.08)] sm:min-h-[420px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_58%)]" />
                  {isVideoAsset(selectedImage) ? (
                    <video
                      key={selectedImage || product.id}
                      src={publicAsset(selectedImage)}
                      controls
                      muted
                      playsInline
                      className="h-full w-full object-contain p-6 sm:p-8"
                    />
                  ) : (
                  <Image
                    key={selectedImage || product.id}
                    src={publicAsset(selectedImage)}
                    alt={selectedFabricVariant?.fabricName ? `${product.name} - ${selectedFabricVariant.fabricName}` : product.name}
                    fill
                    className="object-contain p-6 transition duration-500 sm:p-8"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  )}
                </div>

                {fabricVariants.length > 0 ? (
                  <div className="mt-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[var(--pf-muted)]">
                      Elegir color / tela
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      {fabricVariants.map((variant, index) => {
                        const selected = variant.fabricId === selectedFabricVariant?.fabricId;

                        return (
                          <button
                            key={`${variant.fabricId}-${index}`}
                            type="button"
                            onClick={() => setSelectedFabricId(variant.fabricId)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition shadow-[0_8px_18px_rgba(29,24,20,0.04)] ${
                              selected
                                ? "border-[rgba(200,154,21,0.34)] bg-[linear-gradient(180deg,rgba(255,246,218,0.96),rgba(246,226,167,0.82))] text-[var(--pf-primary-darker)]"
                                : "border-[rgba(29,24,20,0.1)] bg-[rgba(255,255,255,0.88)] text-[var(--pf-text)] hover:border-[rgba(200,154,21,0.2)] hover:bg-[rgba(255,252,246,0.96)]"
                            }`}
                          >
                            <span
                              className="size-3 rounded-full border border-white shadow-sm"
                              style={{ backgroundImage: `url(${publicAsset(variant.image)})`, backgroundSize: "cover" }}
                            />
                            <span>{variant.fabricName ?? `Variante ${index + 1}`}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex min-h-0 flex-col gap-4 bg-[rgba(255,255,255,0.55)] p-4 sm:gap-5 sm:p-8 lg:bg-transparent">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.42em] text-[var(--pf-secondary-dark)]">Producto</p>
                    <h3 className="mt-2 text-[2rem] font-extrabold tracking-[-0.055em] text-[var(--pf-text)] sm:text-[3.4rem]">
                      {product.name}
                    </h3>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--pf-muted)]">
                      {product.brand} · {product.categoryName}
                    </p>
                  </div>
                  <form method="dialog">
                    <Button type="submit" variant="secondary" size="icon" aria-label="Cerrar">
                      X
                    </Button>
                  </form>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Badge
                    variant="outline"
                    className="rounded-full border-[rgba(200,154,21,0.18)] bg-[rgba(255,255,255,0.92)] px-3 py-1 text-[11px] font-semibold text-[var(--pf-text)] shadow-[0_8px_18px_rgba(29,24,20,0.05)]"
                  >
                    {formatCurrency(unitPrice)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-[rgba(200,154,21,0.18)] bg-[rgba(255,255,255,0.92)] px-3 py-1 text-[11px] font-semibold text-[var(--pf-text)] shadow-[0_8px_18px_rgba(29,24,20,0.05)]"
                  >
                    {getStockLabel(product)}
                  </Badge>
                  {selectedFabricVariant ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-[rgba(200,154,21,0.18)] bg-[rgba(255,255,255,0.92)] px-3 py-1 text-[11px] font-semibold text-[var(--pf-text)] shadow-[0_8px_18px_rgba(29,24,20,0.05)]"
                    >
                      {selectedFabricVariant.fabricName ?? "Variante seleccionada"}
                    </Badge>
                  ) : null}
                {selectedMeasure ? (
                    <Badge variant="outline" className="rounded-full border-[rgba(200,154,21,0.18)] bg-[rgba(255,255,255,0.92)] px-3 py-1 text-[11px] font-semibold text-[var(--pf-text)] shadow-[0_8px_18px_rgba(29,24,20,0.05)]">
                      {selectedMeasure.label}
                    </Badge>
                  ) : null}
                </div>

                {fullDescription ? (
                  <div className="max-w-2xl border-l-2 border-[rgba(200,154,21,0.22)] pl-4 text-sm leading-6 text-[var(--pf-muted)] sm:text-base sm:leading-7">
                    <p>{shortDescription}</p>
                    {shouldTruncateDescription ? (
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center text-sm font-semibold text-[var(--pf-primary-darker)] underline decoration-[rgba(200,154,21,0.4)] underline-offset-4 transition hover:opacity-80"
                        onClick={() => setShowFullDetails(true)}
                      >
                        Ver más
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {product?.installmentCount ? (
                  <div className="order-1 rounded-[1.25rem] border border-[rgba(200,154,21,0.14)] bg-[rgba(255,255,255,0.78)] px-4 py-3 text-sm text-[var(--pf-muted)]">
                    <span className="font-semibold text-[var(--pf-text)]">Financiación:</span>{" "}
                    {product.installmentCount} cuotas disponibles
                    {product.interestFreeInstallments?.length ? (
                      <span> · {product.interestFreeInstallments.join(", ")} sin interés</span>
                    ) : null}
                  </div>
                ) : null}

                <div className="rounded-[1.5rem] border border-[rgba(200,154,21,0.14)] bg-[linear-gradient(180deg,rgba(255,251,244,0.96),rgba(244,236,223,0.92))] p-5 shadow-[0_12px_28px_rgba(29,24,20,0.05)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.36em] text-[var(--pf-muted)]">Total</p>
                  <p className="mt-2 text-[2.3rem] font-extrabold tracking-[-0.06em] text-[var(--pf-text)]">{formatCurrency(totalPrice)}</p>
                  <p className="mt-1 text-sm text-[var(--pf-muted)]">
                    {safeQuantity} x {formatCurrency(unitPrice)}
                  </p>
                </div>

                <div className="order-3 flex flex-wrap gap-3 pb-1">
                  <CartAddButton
                    product={product}
                    quantity={safeQuantity}
                    measure={selectedMeasure}
                    className={`rounded-full normal-case transition duration-300 ${isAdding ? "scale-[0.98] brightness-110" : ""}`}
                    onClick={() => {
                      setIsAdding(true);

                      if (addTimerRef.current !== null) {
                        window.clearTimeout(addTimerRef.current);
                      }

                      addTimerRef.current = window.setTimeout(() => {
                        onClose();
                      }, 220);
                    }}
                  >
                    {isAdding ? "Agregado" : "Agregar al carrito"}
                  </CartAddButton>

                  {detailHref ? (
                    <Link
                      href={detailHref}
                      className="inline-flex h-11 items-center justify-center rounded-full border border-[rgba(29,24,20,0.1)] bg-[rgba(255,255,255,0.9)] px-5 text-sm font-semibold text-[var(--pf-text)] shadow-[0_10px_24px_rgba(29,24,20,0.06)] transition hover:bg-[rgba(255,255,255,0.98)]"
                    >
                      Ver detalle
                    </Link>
                  ) : null}

                  <Link
                    href={whatsappHref}
                    target={whatsappHref.startsWith("http") ? "_blank" : undefined}
                    rel={whatsappHref.startsWith("http") ? "noreferrer" : undefined}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[rgba(37,211,102,0.18)] bg-[linear-gradient(180deg,#2fd66e,#1ea953)] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(37,211,102,0.18)] transition hover:brightness-105"
                  >
                    Consultar por WhatsApp
                  </Link>
                </div>

                <div className="order-2 rounded-[1.25rem] border border-[rgba(200,154,21,0.12)] bg-[rgba(255,255,255,0.82)] p-4 text-sm leading-6 text-[var(--pf-muted)] shadow-[0_10px_24px_rgba(29,24,20,0.04)]">
                  <p className="font-medium text-[var(--pf-text)]">
                    Si querés hacer algún cambio personalizado, consultá con el vendedor antes de finalizar la compra.
                  </p>
                </div>

                <div className="order-1 rounded-[1.5rem] border border-[rgba(29,24,20,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(249,246,240,0.92))] p-4 shadow-[0_12px_28px_rgba(29,24,20,0.05)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[var(--pf-muted)]">Cantidad</p>
                      <p className="mt-1 text-sm text-[var(--pf-muted)]">Elegí cuántas unidades querés agregar.</p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                        disabled={safeQuantity <= 1}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        max={maxQuantity}
                        value={safeQuantity}
                        onChange={(event) => {
                          const nextValue = Number(event.target.value);

                          if (Number.isNaN(nextValue)) {
                            return;
                          }

                          setQuantity(Math.min(Math.max(nextValue, 1), maxQuantity));
                        }}
                        className="w-20 text-center text-lg font-semibold"
                        aria-label="Cantidad"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                        disabled={safeQuantity >= maxQuantity}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>

                {product?.measures?.length ? (
                  <div className="order-1 rounded-[1.5rem] border border-[rgba(200,154,21,0.16)] bg-[rgba(255,255,255,0.78)] p-4 shadow-[0_10px_24px_rgba(29,24,20,0.04)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[var(--pf-muted)]">Elegí la medida</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {product.measures.map((measure) => {
                        const selected = measure.id === selectedMeasure?.id;
                        const dimensions = [measure.width, measure.depth, measure.height].every((value) => value != null)
                          ? `${measure.width} x ${measure.depth} x ${measure.height} ${measure.unit ?? "cm"}`
                          : "Medida disponible";
                        return (
                          <button key={measure.id} type="button" onClick={() => setSelectedMeasureId(measure.id)} className={`rounded-2xl border px-4 py-3 text-left transition ${selected ? "border-[rgba(200,154,21,0.42)] bg-[rgba(246,226,167,0.42)]" : "border-[rgba(29,24,20,0.1)] bg-white hover:border-[rgba(200,154,21,0.28)]"}`}>
                            <span className="block text-sm font-bold text-[var(--pf-text)]">{measure.label}</span>
                            <span className="mt-1 block text-xs text-[var(--pf-muted)]">{dimensions}</span>
                            <span className="mt-2 block text-sm font-semibold text-[var(--pf-primary-darker)]">{formatCurrency(measure.publicPrice)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="order-4 rounded-[1.5rem] border border-[rgba(29,24,20,0.08)] bg-[rgba(255,255,255,0.88)] p-4 shadow-[0_12px_28px_rgba(29,24,20,0.05)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.36em] text-[var(--pf-muted)]">Información técnica</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ["SKU", product.sku],
                      ["Marca", product.brand],
                      ["Categoría", product.categoryName],
                      ["Presentación", product.presentation || "Consultar"],
                      ["Variantes", `${fabricVariants.length} opciones`],
                      ["Stock", getStockLabel(product)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-[rgba(29,24,20,0.06)] bg-[rgba(255,255,255,0.9)] px-3 py-2 shadow-[0_8px_18px_rgba(29,24,20,0.03)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--pf-muted)]">{label}</p>
                        <p className="mt-1 text-sm font-medium text-[var(--pf-text)]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {relatedProducts.length > 0 ? (
                  <div className="order-5 rounded-[1.5rem] border border-[rgba(200,154,21,0.16)] bg-[rgba(255,255,255,0.78)] p-4 shadow-[0_10px_24px_rgba(29,24,20,0.04)]">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[var(--pf-secondary-dark)]">También puede interesarte</p>
                        <h4 className="mt-2 text-xl font-extrabold tracking-[-0.04em] text-[var(--pf-text)]">Productos relacionados</h4>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {relatedProducts.slice(0, 4).map((relatedProduct) => (
                        <Link
                          key={relatedProduct.id}
                          href={appendReturnTo(`/producto/${relatedProduct.sku}`, returnTo)}
                          onClick={onClose}
                          className="group flex items-center gap-3 rounded-2xl border border-[rgba(29,24,20,0.08)] bg-white p-2.5 transition hover:-translate-y-0.5 hover:border-[rgba(200,154,21,0.3)]"
                        >
                          <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#f7f3eb]">
                            <Image src={publicAsset(relatedProduct.image)} alt={relatedProduct.name} fill className="object-contain p-1 transition group-hover:scale-105" sizes="4rem" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-[var(--pf-text)]">{relatedProduct.name}</span>
                            <span className="mt-1 block text-sm font-semibold text-[var(--pf-primary-darker)]">{formatCurrency(resolveProductUnitPrice(relatedProduct))}</span>
                            <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--pf-muted)]">Ver producto</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

              </div>
            </div>
          ) : null}
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button aria-label="Cerrar" />
        </form>
      </dialog>

      <dialog
        ref={detailsDialogRef}
        className="modal !z-[12050] p-3 sm:p-6 [&::backdrop]:bg-[rgba(17,17,17,0.56)] [&::backdrop]:backdrop-blur-[10px]"
        onClick={(event) => {
          if (event.target === detailsDialogRef.current) {
            detailsDialogRef.current?.close();
          }
        }}
      >
        <div className="modal-box w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain rounded-[1.5rem] border border-[rgba(200,154,21,0.18)] bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(248,244,236,0.98))] p-0 text-[var(--pf-text)] shadow-[0_26px_72px_rgba(29,24,20,0.18)] sm:rounded-[1.9rem]">
          <div className="flex items-start justify-between gap-4 border-b border-[rgba(200,154,21,0.1)] p-4 sm:p-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.36em] text-[var(--pf-muted)]">Detalle completo</p>
              <h3 className="mt-2 text-[1.35rem] font-extrabold tracking-[-0.05em] sm:text-[2.5rem]">{product?.name}</h3>
            </div>
            <form method="dialog">
              <Button type="submit" variant="secondary" size="icon" aria-label="Cerrar detalle completo">
                X
              </Button>
            </form>
          </div>

          <div className="p-4 text-sm leading-6 text-[var(--pf-muted)] sm:max-h-[70vh] sm:overflow-y-auto sm:p-8 sm:text-base sm:leading-7">
            <p className="whitespace-pre-line">{fullDescription}</p>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button aria-label="Cerrar detalle completo" />
        </form>
      </dialog>
    </>
  );
}
