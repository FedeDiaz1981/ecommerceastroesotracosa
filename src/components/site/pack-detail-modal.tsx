"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { ProductDetailModal } from "@/components/site/product-detail-modal";
import type { PackItem } from "@/domain/site-content";
import { formatCurrency, publicAsset } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function getBaseTotal(pack: PackItem) {
  return pack.items.reduce((sum, item) => sum + item.quantity * item.product.publicPrice, 0);
}

export function PackDetailModal({
  pack,
  onClose,
}: {
  pack: PackItem | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const addTimerRef = useRef<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PackItem["items"][number]["product"] | null>(null);
  const { addPack } = useCart();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (pack) {
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [pack]);

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
    return () => {
      if (addTimerRef.current !== null) {
        window.clearTimeout(addTimerRef.current);
      }
    };
  }, []);

  const safeQuantity = Math.max(1, quantity);
  const totalPrice = pack ? pack.publicPrice * safeQuantity : 0;
  const baseTotal = pack ? getBaseTotal(pack) : 0;
  const savings = Math.max(0, baseTotal - (pack?.publicPrice ?? 0));

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
        <div className="modal-box w-full max-w-6xl max-h-[calc(100dvh-1.5rem)] overflow-hidden overscroll-contain rounded-[1.5rem] border border-[rgba(200,154,21,0.18)] bg-[linear-gradient(180deg,rgba(255,253,248,0.98)_0%,rgba(248,244,236,0.98)_100%)] p-0 text-[var(--pf-text)] shadow-[0_26px_72px_rgba(29,24,20,0.18)] sm:rounded-[1.9rem]">
          {pack ? (
            <div className="grid gap-0 lg:grid-cols-[1fr_1.05fr]">
              <div className="relative min-h-[320px] bg-[linear-gradient(180deg,rgba(244,236,223,0.9),rgba(253,250,244,0.98))] p-4 sm:min-h-[420px] sm:p-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full border border-[rgba(200,154,21,0.18)] bg-[rgba(255,255,255,0.72)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-[var(--pf-primary-darker)] shadow-[0_8px_16px_rgba(29,24,20,0.06)]">
                    Promoción
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--pf-muted)]">
                    Pack seleccionado
                  </span>
                </div>

                <div className="relative flex h-full min-h-[260px] items-center justify-center overflow-hidden rounded-[1.75rem] border border-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.82)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_18px_38px_rgba(29,24,20,0.08)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_58%)]" />
                  <Image
                    src={publicAsset(pack.image)}
                    alt={pack.title}
                    fill
                    className="object-contain p-6 sm:p-8"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
              </div>

              <div className="flex flex-col gap-5 bg-[rgba(255,255,255,0.55)] p-4 sm:p-8 lg:bg-transparent">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.42em] text-[var(--pf-secondary-dark)]">Promoción</p>
                    <h3 className="mt-2 text-[2rem] font-extrabold tracking-[-0.055em] text-[var(--pf-text)] sm:text-[3.4rem]">{pack.title}</h3>
                  </div>
                  <form method="dialog">
                    <Button type="submit" variant="secondary" size="icon" aria-label="Cerrar">
                      X
                    </Button>
                  </form>
                </div>

                <p className="max-w-2xl border-l-2 border-[rgba(200,154,21,0.22)] pl-4 text-base leading-7 text-[var(--pf-muted)]">
                  {pack.description}
                </p>

                <div className="rounded-[1.5rem] border border-[rgba(29,24,20,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(249,246,240,0.92))] p-4 shadow-[0_12px_28px_rgba(29,24,20,0.05)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[var(--pf-muted)]">Cantidad</p>
                      <p className="mt-1 text-sm text-[var(--pf-muted)]">Elegí cuántos packs querés agregar.</p>
                    </div>
                    <div className="flex items-center gap-2">
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
                        value={safeQuantity}
                        onChange={(event) => {
                          const nextValue = Number(event.target.value);

                          if (Number.isNaN(nextValue)) {
                            return;
                          }

                          setQuantity(Math.max(nextValue, 1));
                        }}
                        className="w-20 text-center text-lg font-semibold"
                        aria-label="Cantidad"
                      />
                      <Button type="button" variant="secondary" size="sm" onClick={() => setQuantity((current) => current + 1)}>
                        +
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[rgba(200,154,21,0.14)] bg-[linear-gradient(180deg,rgba(255,251,244,0.96),rgba(244,236,223,0.92))] p-5 shadow-[0_12px_28px_rgba(29,24,20,0.05)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.36em] text-[var(--pf-muted)]">Total</p>
                  <p className="mt-2 text-[2.3rem] font-extrabold tracking-[-0.06em] text-[var(--pf-text)]">{formatCurrency(totalPrice)}</p>
                  <p className="mt-1 text-sm text-[var(--pf-muted)]">
                    {safeQuantity} x {formatCurrency(pack.publicPrice)}
                  </p>
                  {savings > 0 ? (
                    <p className="mt-2 text-sm font-semibold text-[var(--pf-primary-darker)]">Ahorro por pack: {formatCurrency(savings)}</p>
                  ) : null}
                </div>

                <div className="rounded-[1.5rem] border border-[rgba(29,24,20,0.08)] bg-[rgba(255,255,255,0.88)] p-4 shadow-[0_12px_28px_rgba(29,24,20,0.05)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.36em] text-[var(--pf-muted)]">Incluye</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pack.items.map((item) => (
                      <button
                        key={item.productId}
                        type="button"
                        onClick={() => setSelectedProduct(item.product)}
                        className="inline-flex items-center gap-2 rounded-full border border-[rgba(200,154,21,0.14)] bg-[rgba(255,255,255,0.92)] px-3 py-2 text-left text-sm font-medium text-[var(--pf-text)] shadow-[0_8px_18px_rgba(29,24,20,0.04)] transition hover:border-[rgba(200,154,21,0.22)] hover:bg-[rgba(255,251,244,0.98)]"
                      >
                        <span className="max-w-[14rem] truncate">{item.product.name}</span>
                        <span className="rounded-full bg-[rgba(200,154,21,0.12)] px-2 py-0.5 text-[11px] font-bold text-[var(--pf-primary-darker)]">
                          x{item.quantity}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {pack.featured ? (
                    <Badge variant="outline" className="rounded-full border-success/30 bg-[rgba(255,255,255,0.9)] text-success">
                      Destacado
                    </Badge>
                  ) : null}
                  <Badge variant="outline" className="rounded-full border-[rgba(200,154,21,0.16)] bg-[rgba(255,255,255,0.9)]">
                    {pack.items.length} productos
                  </Badge>
                </div>

                <div className="mt-auto flex flex-wrap gap-3">
                  <Button
                    className={`rounded-full normal-case transition duration-300 ${isAdding ? "scale-[0.98] brightness-110" : ""}`}
                    onClick={() => {
                      setIsAdding(true);
                      addPack(pack, safeQuantity);

                      if (addTimerRef.current !== null) {
                        window.clearTimeout(addTimerRef.current);
                      }

                      addTimerRef.current = window.setTimeout(() => {
                        onClose();
                      }, 220);
                    }}
                  >
                    {isAdding ? "Agregado" : "Agregar al pedido"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <form method="dialog" className="modal-backdrop">
          <button aria-label="Cerrar" />
        </form>
      </dialog>

      <ProductDetailModal
        key={selectedProduct?.id ?? "empty"}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
}
