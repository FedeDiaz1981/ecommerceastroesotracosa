"use client";

import QRCode from "qrcode";
import { ArrowLeft, Check, Copy, ExternalLink, LoaderCircle, QrCode, Send, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CartLine } from "@/components/cart/cart-context";
import { formatCurrency } from "@/lib/catalog";

type MercadoPagoContact = {
  name?: string;
  email?: string;
  phone?: string;
};

type MercadoPagoCheckoutModalProps = {
  endpoint?: string;
  items: CartLine[];
  total: number;
  totalItems: number;
  contact?: MercadoPagoContact | null;
  onBack?: () => void;
  onClose: () => void;
};

type PreferenceResponse = {
  preferenceId?: string;
  checkoutUrl?: string;
  error?: string;
};

export function MercadoPagoCheckoutModal({
  endpoint = "/api/mercado-pago/preference",
  items,
  total,
  totalItems,
  contact,
  onBack,
  onClose,
}: MercadoPagoCheckoutModalProps) {
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const requestBody = useMemo(
    () => ({
      items: items.map((item) => ({
        kind: item.kind,
        id: item.id,
        quantity: item.quantity,
        measureId: item.measureId,
        lotId: item.lotId,
        reservationId: item.reservationId,
      })),
      payer: contact
        ? {
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
          }
        : undefined,
    }),
    [contact, items],
  );

  useEffect(() => {
    const controller = new AbortController();
    setCheckoutUrl("");
    setQrDataUrl("");
    setError("");
    setShareMessage("");

    void (async () => {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => ({}))) as PreferenceResponse;

        if (!response.ok || !payload.checkoutUrl) {
          throw new Error(payload.error || "No se pudo preparar el pago con Mercado Pago.");
        }

        setCheckoutUrl(payload.checkoutUrl);
        const dataUrl = await QRCode.toDataURL(payload.checkoutUrl, {
          width: 320,
          margin: 2,
          color: {
            dark: "#111111",
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        });

        setQrDataUrl(dataUrl);
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "No se pudo preparar el pago.");
      }
    })();

    return () => controller.abort();
  }, [attempt, endpoint, requestBody]);

  const sharePaymentLink = async () => {
    if (!checkoutUrl) {
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Pago con Mercado Pago",
          text: "Pedido por " + formatCurrency(total),
          url: checkoutUrl,
        });
        setShareMessage("Enlace enviado.");
        return;
      }

      await navigator.clipboard.writeText(checkoutUrl);
      setShareMessage("Enlace copiado.");
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(checkoutUrl);
        setShareMessage("Enlace copiado.");
      } catch {
        setShareMessage("No se pudo compartir el enlace.");
      }
    }
  };

  const copyPaymentLink = async () => {
    if (!checkoutUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(checkoutUrl);
      setShareMessage("Enlace copiado.");
    } catch {
      setShareMessage("No se pudo copiar el enlace.");
    }
  };

  const actionButton =
    "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-[13000] flex items-center justify-center bg-[rgba(35,28,20,0.52)] px-3 py-4 backdrop-blur-[3px]">
      <section className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[rgba(0,118,182,0.2)] bg-white text-[var(--pf-text)] shadow-[0_30px_90px_rgba(29,24,20,0.3)]">
        <header className="flex items-center justify-between gap-3 border-b border-[rgba(29,24,20,0.08)] bg-[#f5fbff] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            {onBack ? (
              <button type="button" onClick={onBack} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[rgba(29,24,20,0.12)] bg-white" aria-label="Volver al pedido" title="Volver">
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : null}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0076b6]">Mercado Pago</p>
              <h3 className="mt-1 text-xl font-black sm:text-2xl">Finalizar pago</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[rgba(29,24,20,0.12)] bg-white" aria-label="Cerrar pago" title="Cerrar">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="grid md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="p-5 sm:p-6">
            {!checkoutUrl && !error ? (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <LoaderCircle className="h-9 w-9 animate-spin text-[#009ee3]" aria-hidden="true" />
                <p className="mt-4 font-bold">Preparando el pago...</p>
              </div>
            ) : null}

            {error ? (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <p className="max-w-md text-sm leading-6 text-red-700">{error}</p>
                <button type="button" onClick={() => setAttempt((value) => value + 1)} className={[actionButton, "mt-5 bg-[#009ee3] text-white"].join(" ")}>
                  Reintentar
                </button>
              </div>
            ) : null}

            {checkoutUrl ? (
              <>
                <div className="hidden items-center gap-6 md:grid md:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="flex aspect-square w-[220px] items-center justify-center rounded-md border border-[rgba(29,24,20,0.12)] bg-white p-3">
                    {qrDataUrl ? <img src={qrDataUrl} alt="QR para pagar con Mercado Pago" className="h-full w-full object-contain" /> : <LoaderCircle className="h-8 w-8 animate-spin text-[#009ee3]" aria-hidden="true" />}
                  </div>
                  <div>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-[#fff159] text-[#064766]">
                      <QrCode className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h4 className="mt-4 text-xl font-black">Escaneá con tu celular</h4>
                    <p className="mt-2 text-sm leading-6 text-[var(--pf-muted)]">Abrí la cámara o Mercado Pago y completá allí el medio de pago y las cuotas.</p>
                    <div className="mt-5 grid gap-2">
                      <button type="button" onClick={() => void sharePaymentLink()} className={[actionButton, "bg-[#009ee3] text-white"].join(" ")}>
                        <Send className="h-4 w-4" aria-hidden="true" />
                        Enviar enlace
                      </button>
                      <button type="button" onClick={() => void copyPaymentLink()} className={[actionButton, "border border-[rgba(29,24,20,0.14)] bg-white text-[var(--pf-text)]"].join(" ")}>
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        Copiar enlace
                      </button>
                    </div>
                  </div>
                </div>

                <div className="md:hidden">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-[#fff159] text-[#064766]">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h4 className="mt-4 text-xl font-black">Pagá desde este celular</h4>
                  <p className="mt-2 text-sm leading-6 text-[var(--pf-muted)]">Mercado Pago te mostrará los medios y cuotas disponibles antes de confirmar.</p>
                  <div className="mt-6 grid gap-3">
                    <a href={checkoutUrl} className={[actionButton, "bg-[#00a650] text-white"].join(" ")}>
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      Abrir Mercado Pago
                    </a>
                    <button type="button" onClick={() => void sharePaymentLink()} className={[actionButton, "border border-[rgba(29,24,20,0.14)] bg-white text-[var(--pf-text)]"].join(" ")}>
                      <Send className="h-4 w-4" aria-hidden="true" />
                      Enviar enlace
                    </button>
                  </div>
                </div>

                {shareMessage ? (
                  <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-[#007a42]">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {shareMessage}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>

          <aside className="border-t border-[rgba(29,24,20,0.08)] bg-[#f7f3eb] p-5 md:border-l md:border-t-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--pf-muted)]">Resumen</p>
            <p className="mt-3 text-3xl font-black">{formatCurrency(total)}</p>
            <p className="mt-2 text-sm text-[var(--pf-muted)]">{totalItems} artículo{totalItems === 1 ? "" : "s"}</p>
            <div className="mt-5 border-t border-[rgba(29,24,20,0.1)] pt-4">
              <p className="text-sm font-bold">Pago protegido por Mercado Pago</p>
              <p className="mt-2 text-xs leading-5 text-[var(--pf-muted)]">La elección y aprobación del medio de pago se realiza en Mercado Pago.</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

