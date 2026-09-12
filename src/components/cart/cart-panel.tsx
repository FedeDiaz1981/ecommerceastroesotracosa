"use client";

import { useRouter } from "next/navigation";
import { Minus, Plus, X } from "lucide-react";
import { useCallback, useState } from "react";

import { useCart, resolveCartLineUnitPrice } from "@/components/cart/cart-context";
import { useViewer } from "@/components/auth/viewer-provider";
import { formatCurrency, publicAsset } from "@/lib/catalog";
import { Button, buttonVariants } from "@/components/ui/button";
import type { OrderPdfLine } from "@/lib/order-pdf";

const CART_TOGGLE_ID = "pf-cart-toggle";

export function CartPanel({
  mode = "drawer",
}: {
  mode?: "drawer" | "page";
}) {
  const {
    items,
    hydrated,
    isOpen,
    openCart,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();
  const viewer = useViewer();
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [cancelingLotSku, setCancelingLotSku] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const cancelLotReservation = useCallback(
    async (sku: string, reservationId?: number) => {
      if (!reservationId || cancelingLotSku === sku) {
        return false;
      }

      setCancelingLotSku(sku);

      try {
        const response = await fetch("/api/lotes/cancelar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reservationId }),
        });

        const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "No se pudo cancelar la reserva.");
        }

        removeItem(sku);
        return true;
      } catch (error) {
        console.error(error);
        window.alert(error instanceof Error ? error.message : "No se pudo cancelar la reserva.");
        return false;
      } finally {
        setCancelingLotSku(null);
      }
    },
    [cancelingLotSku, removeItem],
  );

  const clearEntireCart = useCallback(async () => {
    const lotItems = items.filter((item) => item.kind === "lot" && item.reservationId);

    for (const item of lotItems) {
      const cancelled = await cancelLotReservation(item.sku, item.reservationId);
      if (!cancelled) {
        return;
      }
    }

    clearCart();
  }, [cancelLotReservation, clearCart, items]);

  const downloadPedidoPdf = useCallback(async () => {
    const payloadItems: OrderPdfLine[] = items
      .map((item) => {
        const kind: OrderPdfLine["kind"] =
          item.kind === "pack" ? "pack" : item.kind === "lot" ? "lot" : "product";

        return {
          kind,
          id: item.id,
          sku: item.sku,
          name: item.name,
          brand: item.brand,
          presentation: item.presentation,
          image: item.image,
          publicPrice: resolveCartLineUnitPrice(item),
          unitPrice: resolveCartLineUnitPrice(item),
          quantity: item.quantity,
        };
      })
      .filter((item) => item.sku && item.name);

    const response = await fetch("/api/pedido/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items: payloadItems }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || "No se pudo generar el PDF del pedido.");
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "pedido-es-otra-cosa.pdf";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
  }, [items]);

  const handleConfirmPedido = useCallback(async () => {
    if (!hydrated || items.length === 0 || isConfirming) {
      return;
    }

    try {
      setIsConfirming(true);

      const pendingLotItems = items.filter((item) => item.kind === "lot" && !item.reservationId);

      if (pendingLotItems.length > 0) {
        if (!viewer?.authenticated) {
          window.dispatchEvent(new Event("pf-auth-modal:open"));
          return;
        }

        for (const item of pendingLotItems) {
          const response = await fetch("/api/lotes/reservar", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ lotId: item.lotId ?? item.id, quantity: item.quantity }),
          });

          const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
          if (!response.ok || !payload.ok) {
            throw new Error(payload.error || "No se pudo reservar el lote.");
          }
        }
      }

      await downloadPedidoPdf();
      clearCart();
      closeCart();
      setSuccessMessage(pendingLotItems.length > 0 ? "La reserva se realizó exitosamente." : "El pedido se realizó exitosamente.");
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "No pudimos confirmar el pedido.");
    } finally {
      setIsConfirming(false);
    }
  }, [clearCart, closeCart, downloadPedidoPdf, hydrated, isConfirming, items, viewer?.authenticated]);

  const hasLotItems = items.some((item) => item.kind === "lot");

  const successModal = successMessage ? (
    <div className="fixed inset-0 z-[13000] flex items-center justify-center bg-[rgba(35,28,20,0.42)] px-4 py-6 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-[2rem] border border-[var(--pf-border-warm)] bg-[var(--pf-surface)] p-6 text-[var(--pf-text)] shadow-[0_30px_80px_rgba(29,24,20,0.28)]">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--pf-secondary-dark)]">Confirmación</p>
        <h3 className="mt-3 text-2xl font-black tracking-tight">{successMessage}</h3>
        <p className="mt-3 text-sm leading-7 text-[var(--pf-muted)]">
          Ya podés seguir navegando. Si se trató de una reserva colectiva, la vas a ver en “Mis reservas”.
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className={buttonVariants({ variant: "primary", size: "md" })}
            onClick={() => setSuccessMessage(null)}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const panel = (
    <aside className="flex h-full w-full max-w-[460px] flex-col border-l border-[var(--pf-border-warm)] bg-[linear-gradient(180deg,var(--pf-surface-warm)_0%,var(--pf-sand-soft)_44%,var(--pf-cream-soft)_100%)] shadow-[0_24px_80px_rgba(29,24,20,0.26)]">
      <div className="flex items-center justify-between border-b border-[rgba(200,154,21,0.16)] px-5 py-4">
        <div>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--pf-text)]">Mi pedido</h2>
        </div>
        {mode === "drawer" ? (
          <label
            htmlFor={CART_TOGGLE_ID}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--pf-border)] bg-[rgba(255,255,255,0.94)] text-[var(--pf-text)] transition hover:bg-[rgba(245,243,239,0.92)]"
            aria-label="Cerrar carrito"
          >
            <X className="size-5" />
          </label>
        ) : (
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pf-border)] bg-[rgba(255,255,255,0.94)] text-[var(--pf-text)] transition hover:bg-[rgba(245,243,239,0.92)] lg:hidden"
            aria-label="Cerrar carrito"
            onClick={() => router.back()}
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <div className="grid gap-3 px-5 pt-5 sm:grid-cols-2">
        <div className="rounded-[1.35rem] border border-[var(--pf-border)] bg-[rgba(255,255,255,0.94)] p-4 shadow-[0_10px_22px_rgba(29,24,20,0.06)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--pf-muted)]">Artículos</p>
          <p className="mt-1 text-3xl font-black text-[var(--pf-text)]">{totalItems}</p>
        </div>
        <div className="rounded-[1.35rem] border border-[var(--pf-border)] bg-[rgba(255,255,255,0.94)] p-4 shadow-[0_10px_22px_rgba(29,24,20,0.06)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--pf-muted)]">Total</p>
          <p className="mt-1 text-3xl font-black text-[var(--pf-text)]">{formatCurrency(totalPrice)}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-5">
        {!hydrated ? (
          <div className="rounded-[1.35rem] border border-[var(--pf-border)] bg-[rgba(255,255,255,0.88)] p-5 text-sm text-[var(--pf-muted)]">
            Cargando pedido...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[1.35rem] border border-[var(--pf-border)] bg-[rgba(255,255,255,0.88)] p-5">
            <p className="text-lg font-bold text-[var(--pf-text)]">Tu pedido está vacío</p>
            <div className="mt-4">
              {mode === "drawer" ? (
                <label
                  htmlFor={CART_TOGGLE_ID}
                  className={`${buttonVariants({ variant: "primary", size: "md" })} !text-white`}
                >
                  Cerrar carrito
                </label>
              ) : (
                <button type="button" className={`${buttonVariants({ variant: "primary", size: "md" })} !text-white`} onClick={() => router.back()}>
                  Cerrar carrito
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.sku}
                className="rounded-[1.4rem] border border-[rgba(200,154,21,0.12)] bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_10px_22px_rgba(29,24,20,0.06)]"
              >
                <div className="flex gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1rem] border border-[rgba(200,154,21,0.12)] bg-[rgba(255,255,255,0.92)]">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={publicAsset(item.image)} alt={item.name} className="h-full w-full object-contain p-2" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--pf-muted)]">{item.brand}</p>
                        <h3 className="line-clamp-2 text-base font-black leading-5 text-[var(--pf-text)]">{item.name}</h3>
                        <p className="mt-1 text-sm text-[var(--pf-muted)]">
                          {item.kind === "lot"
                            ? item.lotAvailableUnits == null
                              ? item.presentation
                              : `${Math.max(0, item.lotAvailableUnits - item.quantity)} unidades disponibles`
                            : `${item.measureLabel ? `${item.measureLabel} · ` : ""}${item.presentation}`}
                        </p>
                        {item.kind === "lot" ? (
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--pf-secondary-dark)]">
                            {item.reservationId ? "Reserva de lote" : "Reserva pendiente"}
                          </p>
                        ) : null}
                      </div>
                      {item.kind === "lot" ? (
                        item.reservationId ? (
                          <button
                            type="button"
                            className="rounded-full border border-[var(--pf-border)] px-3 py-1 text-xs font-semibold text-[var(--pf-text)] transition hover:bg-[rgba(245,243,239,0.8)]"
                            onClick={() => cancelLotReservation(item.sku, item.reservationId)}
                            disabled={cancelingLotSku === item.sku}
                          >
                            {cancelingLotSku === item.sku ? "Cancelando..." : "Cancelar"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded-full border border-[var(--pf-border)] px-3 py-1 text-xs font-semibold text-[var(--pf-text)] transition hover:bg-[rgba(245,243,239,0.8)]"
                            onClick={() => removeItem(item.sku)}
                          >
                            Quitar
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          className="rounded-full border border-[var(--pf-border)] px-3 py-1 text-xs font-semibold text-[var(--pf-text)] transition hover:bg-[rgba(245,243,239,0.8)]"
                          onClick={() => removeItem(item.sku)}
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    {item.kind === "lot" ? (
                      <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.1rem] bg-[rgba(245,243,239,0.82)] px-3 py-2">
                        {item.reservationId ? (
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--pf-muted)]">Unidades reservadas</p>
                            <p className="text-sm font-bold text-[var(--pf-text)]">{item.quantity}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pf-border)] bg-white text-[var(--pf-text)]"
                              onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                              aria-label={`Disminuir cantidad de ${item.name}`}
                            >
                              <Minus className="size-4" />
                            </button>
                            <span className="min-w-12 text-center text-sm font-bold text-[var(--pf-text)]">{item.quantity}</span>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pf-border)] bg-white text-[var(--pf-text)]"
                              onClick={() =>
                                updateQuantity(
                                  item.sku,
                                  item.lotAvailableUnits != null ? Math.min(item.lotAvailableUnits, item.quantity + 1) : item.quantity + 1,
                                )
                              }
                              aria-label={`Aumentar cantidad de ${item.name}`}
                              disabled={item.lotAvailableUnits != null ? item.quantity >= item.lotAvailableUnits : false}
                            >
                              <Plus className="size-4" />
                            </button>
                          </div>
                        )}

                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--pf-muted)]">Total</p>
                          <p className="text-base font-black text-[var(--pf-text)]">
                            {formatCurrency(resolveCartLineUnitPrice(item) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.1rem] bg-[rgba(245,243,239,0.82)] px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pf-border)] bg-white text-[var(--pf-text)]"
                            onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                            aria-label={`Disminuir cantidad de ${item.name}`}
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="min-w-12 text-center text-sm font-bold text-[var(--pf-text)]">{item.quantity}</span>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pf-border)] bg-white text-[var(--pf-text)]"
                            onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                            aria-label={`Aumentar cantidad de ${item.name}`}
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--pf-muted)]">Subtotal</p>
                          <p className="text-base font-black text-[var(--pf-text)]">
                            {formatCurrency(resolveCartLineUnitPrice(item) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[rgba(200,154,21,0.16)] px-5 py-4">
        <div className="rounded-[1.35rem] border border-[var(--pf-border)] bg-[rgba(255,255,255,0.85)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-2xl font-black text-[var(--pf-text)]">{formatCurrency(totalPrice)}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <button
            type="button"
            className={buttonVariants({ variant: "primary", size: "md" })}
            onClick={() => {
              void clearEntireCart();
            }}
            disabled={items.length === 0}
          >
            Vaciar pedido
          </button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleConfirmPedido}
            disabled={items.length === 0 || isConfirming}
          >
            {isConfirming ? "Confirmando..." : hasLotItems ? "Confirmar reserva" : "Confirmar pedido"}
          </Button>
        </div>
      </div>
    </aside>
  );

  if (mode === "page") {
    return (
      <>
        <main className="pf-shell flex w-full flex-1 flex-col px-4 py-6 sm:px-6 lg:px-12 lg:py-10">
          <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_460px]">
            <section className="rounded-[2rem] border border-[var(--pf-border-warm)] bg-[linear-gradient(180deg,var(--pf-surface-warm)_0%,var(--pf-sand-soft)_58%,var(--pf-surface-strong)_100%)] p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <h1 className="text-3xl font-black tracking-tight text-[var(--pf-text)] sm:text-4xl">Mi pedido</h1>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pf-border)] bg-[rgba(255,255,255,0.94)] text-[var(--pf-text)] transition hover:bg-[rgba(245,243,239,0.92)] lg:hidden"
                  aria-label="Cerrar carrito"
                  onClick={() => router.back()}
                >
                  <X className="size-5" />
                </button>
              </div>
            </section>
            {panel}
          </div>
        </main>
        {successModal}
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[11020] pointer-events-none">
        <input
          id={CART_TOGGLE_ID}
          type="checkbox"
          checked={isOpen}
          onChange={(event) => {
            if (event.target.checked) {
              openCart();
            } else {
              closeCart();
            }
          }}
          className="peer/cart-toggle sr-only"
        />

        <label
          htmlFor={CART_TOGGLE_ID}
          aria-label="Cerrar carrito"
          className={[
            "absolute inset-0 bg-[rgba(35,28,20,0.38)] backdrop-blur-[2px] transition-opacity duration-300",
            isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        />

        <div
          aria-hidden={!isOpen}
          className={[
            "pointer-events-auto absolute inset-y-0 right-0 w-full max-w-[460px] transition-transform duration-300 ease-out",
            isOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          {panel}
        </div>
      </div>
      {successModal}
    </>
  );
}
