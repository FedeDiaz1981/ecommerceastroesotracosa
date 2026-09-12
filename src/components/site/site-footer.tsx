"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgePercent, CreditCard, RefreshCcw, Truck, X } from "lucide-react";
import { useState } from "react";

import type { PaymentMethodItem } from "@/domain/site-content";
import { publicAsset } from "@/lib/catalog";
import { buildWhatsAppHref } from "@/lib/whatsapp";

function accentWord(word: string, index: number) {
  const clean = word.trim();

  if (!clean) {
    return null;
  }

  const first = clean[0] ?? "";
  const rest = clean.slice(1);

  return (
    <span key={`${clean}-${index}`} className="inline-flex text-[#fbf8f2]">
      <span className="text-[#fbf8f2]">{first.toUpperCase()}</span>
      <span className="text-[#fbf8f2]">{rest}</span>
    </span>
  );
}

function accentSentence(text: string) {
  const words = text.split(/\s+/).filter(Boolean);

  return words.map((word, index) => (
    <span key={`${word}-${index}`} className="inline-flex items-baseline text-[#fbf8f2]">
      {accentWord(word, index)}
      {index < words.length - 1 ? <span className="w-[0.3em]" /> : null}
    </span>
  ));
}

export function SiteFooter({ paymentMethods }: { paymentMethods: PaymentMethodItem[] }) {
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [returnsModalOpen, setReturnsModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [installmentsModalOpen, setInstallmentsModalOpen] = useState(false);
  const commercialLinks = [
    {
      icon: Truck,
      title: "Envios",
      text: "Coordinamos entrega segun zona, volumen y tipo de producto.",
      href: "/galeria",
    },
    {
      icon: CreditCard,
      title: "Medios de pago",
      text: "Tarjeta, transferencia y combinaciones de pago segun la compra.",
      href: "/galeria",
    },
    {
      icon: BadgePercent,
      title: "Cuotas",
      text: "Consultá los planes de financiación disponibles para el producto que querés llevar.",
      href: "/galeria",
    },
    {
      icon: RefreshCcw,
      title: "Cambios y devoluciones",
      text: "Una politica clara para comprar con tranquilidad y mejor experiencia postventa.",
      href: "/galeria",
    },
  ];

  return (
    <footer className="hidden border-t-2 border-[#e7c56a] bg-[#050505] text-[#fbf8f2] lg:block">
      <div className="bg-white">
        <div className="pf-shell grid gap-px bg-[rgba(212,168,26,0.12)] md:grid-cols-2 xl:grid-cols-4">
          {commercialLinks.map(({ icon: Icon, title, text, href }) => (
            <Link
              key={title}
              href={title === "Medios de pago" ? "#medios-de-pago" : title === "Cuotas" ? "#cuotas" : href}
              onClick={title === "Envios" || title.toLowerCase().includes("medio") || title === "Cuotas" || title === "Cambios y devoluciones" ? (event) => {
                event.preventDefault();
                if (title === "Envios") {
                  setShippingModalOpen(true);
                } else if (title.toLowerCase().includes("medio")) {
                  setPaymentModalOpen(true);
                } else if (title === "Cuotas") {
                  setInstallmentsModalOpen(true);
                } else {
                  setReturnsModalOpen(true);
                }
              } : undefined}
              className="group flex min-h-[108px] items-start gap-4 bg-white px-5 py-5 text-[var(--pf-text)] transition hover:bg-[rgba(250,246,238,0.9)]"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[rgba(200,154,21,0.12)] text-[var(--pf-text)] transition group-hover:scale-[1.03] group-hover:bg-[rgba(200,154,21,0.18)]">
                <Icon className="size-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-[13px] font-black uppercase tracking-[0.06em] text-[var(--pf-text)]">{title}</h2>
                  <ArrowRight className="size-3.5 text-[var(--pf-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--pf-primary-darker)]" />
                </div>
                <p className="mt-1 text-sm leading-6 text-[var(--pf-muted)]">{text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {shippingModalOpen ? (
        <div
          className="fixed inset-0 z-[12000] flex items-center justify-center bg-[rgba(20,17,14,0.62)] p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shipping-modal-title"
          onClick={() => setShippingModalOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[var(--pf-border)] bg-[var(--pf-surface)] p-6 text-[var(--pf-text)] shadow-[0_24px_70px_rgba(29,24,20,0.28)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShippingModalOpen(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pf-border)] bg-white text-[var(--pf-text)] transition hover:bg-[rgba(245,243,239,0.8)]"
              aria-label="Cerrar información de envíos"
            >
              <X className="size-5" />
            </button>

            <p className="pr-12 text-[11px] font-black uppercase tracking-[0.32em] text-[var(--pf-muted)]">Información de entrega</p>
            <h2 id="shipping-modal-title" className="mt-3 pr-12 text-3xl font-black tracking-[-0.03em]">
              Envíos
            </h2>
            <p className="mt-5 text-base leading-7 text-[var(--pf-muted)]">
              Realizamos entregas a distintos puntos del país. La alternativa más conveniente se define según el destino, el tamaño y las características del producto.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <h3 className="text-lg font-bold">Pedidos pequeños</h3>
                <p className="mt-2 leading-7 text-[var(--pf-muted)]">
                  Podemos enviarlos por Correo Argentino o mediante una mensajería de confianza, según la zona de entrega.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold">Muebles y pedidos grandes</h3>
                <p className="mt-2 leading-7 text-[var(--pf-muted)]">
                  Para sillones, mesas y otros productos voluminosos coordinamos flete o transporte especializado. El embalaje se prepara especialmente para proteger la mercadería durante el traslado.
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-dashed border-[rgba(200,154,21,0.28)] bg-[rgba(200,154,21,0.08)] px-4 py-4 text-sm leading-6 text-[var(--pf-primary-darker)]">
              La modalidad y el valor del envío se arreglan directamente con el vendedor antes de confirmar la compra.
            </div>
          </div>
        </div>
      ) : null}

      {installmentsModalOpen ? (
        <div
          className="fixed inset-0 z-[12000] flex items-center justify-center bg-[rgba(20,17,14,0.62)] p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="installments-modal-title"
          onClick={() => setInstallmentsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-xl rounded-[2rem] border border-[var(--pf-border)] bg-[var(--pf-surface)] p-6 text-[var(--pf-text)] shadow-[0_24px_70px_rgba(29,24,20,0.28)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setInstallmentsModalOpen(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pf-border)] bg-white text-[var(--pf-text)] transition hover:bg-[rgba(245,243,239,0.8)]"
              aria-label="Cerrar planes de financiación"
            >
              <X className="size-5" />
            </button>

            <p className="pr-12 text-[11px] font-black uppercase tracking-[0.32em] text-[var(--pf-muted)]">Financiación</p>
            <h2 id="installments-modal-title" className="mt-3 pr-12 text-3xl font-black tracking-[-0.03em]">
              Cuotas
            </h2>
            <p className="mt-5 text-base leading-7 text-[var(--pf-muted)]">
              Consultá los planes de financiación disponibles para el producto que querés llevar. Las alternativas pueden variar según el artículo y el medio de pago elegido.
            </p>
            <div className="mt-6 rounded-2xl border border-dashed border-[rgba(200,154,21,0.28)] bg-[rgba(200,154,21,0.08)] px-4 py-4 text-sm leading-6 text-[var(--pf-primary-darker)]">
              Escribinos con el producto que te interesa y te confirmamos las opciones vigentes.
            </div>
            {(() => {
              const representativeHref = buildWhatsAppHref();
              return (
                <Link
                  href={representativeHref}
                  target={representativeHref.startsWith("http") ? "_blank" : undefined}
                  rel={representativeHref.startsWith("http") ? "noreferrer" : undefined}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[var(--pf-primary)] px-5 py-3 text-sm font-bold text-white transition hover:text-white hover:brightness-105 focus-visible:text-white"
                >
                  Hablar con un representante
                </Link>
              );
            })()}
          </div>
        </div>
      ) : null}

      {paymentModalOpen ? (
        <div
          className="fixed inset-0 z-[12000] flex items-center justify-center bg-[rgba(20,17,14,0.62)] p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
          onClick={() => setPaymentModalOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-[var(--pf-border)] bg-[var(--pf-surface)] p-6 text-[var(--pf-text)] shadow-[0_24px_70px_rgba(29,24,20,0.28)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pf-border)] bg-white text-[var(--pf-text)] transition hover:bg-[rgba(245,243,239,0.8)]"
              aria-label="Cerrar medios de pago"
            >
              <X className="size-5" />
            </button>

            <p className="pr-12 text-[11px] font-black uppercase tracking-[0.32em] text-[var(--pf-muted)]">Opciones disponibles</p>
            <h2 id="payment-modal-title" className="mt-3 pr-12 text-3xl font-black tracking-[-0.03em]">
              Medios de pago
            </h2>
            <p className="mt-5 text-base leading-7 text-[var(--pf-muted)]">
              Elegí la alternativa que te resulte más cómoda. Los medios electrónicos disponibles son:
            </p>

            <div className="mt-6 space-y-3">
              {paymentMethods.length > 0 ? paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center gap-4 rounded-2xl border border-[var(--pf-border-soft)] bg-white px-4 py-3">
                  {method.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={publicAsset(method.logo)} alt="" className="h-10 w-16 object-contain" />
                  ) : null}
                  <span className="font-semibold">{method.name}</span>
                </div>
              )) : (
                <p className="rounded-2xl border border-[var(--pf-border-soft)] bg-white px-4 py-3 text-[var(--pf-muted)]">
                  Consultanos por las opciones electrónicas disponibles.
                </p>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--pf-border-soft)] bg-white px-4 py-4">
              <h3 className="font-bold">Efectivo</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--pf-muted)]">La forma de pago en efectivo se coordina directamente con el vendedor.</p>
            </div>

            <p className="mt-6 text-sm leading-6 text-[var(--pf-muted)]">
              Ante cualquier consulta, escribinos y te ayudamos a elegir la mejor opción para tu compra.
            </p>
            {(() => {
              const representativeHref = buildWhatsAppHref();
              return (
                <Link
                  href={representativeHref}
                  target={representativeHref.startsWith("http") ? "_blank" : undefined}
                  rel={representativeHref.startsWith("http") ? "noreferrer" : undefined}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[var(--pf-primary)] px-5 py-3 text-sm font-bold text-white transition hover:text-white hover:brightness-105 focus-visible:text-white"
                >
                  Hablar con un representante
                </Link>
              );
            })()}
          </div>
        </div>
      ) : null}

      {returnsModalOpen ? (
        <div
          className="fixed inset-0 z-[12000] flex items-center justify-center bg-[rgba(20,17,14,0.62)] p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="returns-modal-title"
          onClick={() => setReturnsModalOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[var(--pf-border)] bg-[var(--pf-surface)] p-6 text-[var(--pf-text)] shadow-[0_24px_70px_rgba(29,24,20,0.28)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setReturnsModalOpen(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pf-border)] bg-white text-[var(--pf-text)] transition hover:bg-[rgba(245,243,239,0.8)]"
              aria-label="Cerrar cambios y devoluciones"
            >
              <X className="size-5" />
            </button>

            <p className="pr-12 text-[11px] font-black uppercase tracking-[0.32em] text-[var(--pf-muted)]">Compra con tranquilidad</p>
            <h2 id="returns-modal-title" className="mt-3 pr-12 text-3xl font-black tracking-[-0.03em]">
              Cambios y devoluciones
            </h2>
            <p className="mt-5 text-base leading-7 text-[var(--pf-muted)]">
              Si algo no salió como esperabas, escribinos para encontrar juntos la mejor solución para tu pedido.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <h3 className="text-lg font-bold">Devoluciones</h3>
                <p className="mt-2 leading-7 text-[var(--pf-muted)]">
                  Podés solicitar una devolución dentro de los 10 días de recibir la compra. Los productos hechos especialmente para vos, por color o medida, no admiten devolución, aunque podemos revisar alternativas de cambio por artículos disponibles.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold">Cambios</h3>
                <p className="mt-2 leading-7 text-[var(--pf-muted)]">
                  Los cambios se gestionan hasta 30 días después de la entrega y aplican a productos sin uso, manchas ni daños. El artículo elegido para reemplazo debe encontrarse en stock y se toma el valor vigente al momento de facturar el cambio.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold">Productos personalizados</h3>
                <p className="mt-2 leading-7 text-[var(--pf-muted)]">
                  Una vez confirmada la fabricación, no es posible cancelar el pedido ni solicitar un reintegro por ese motivo. Si necesitás cambiarlo, evaluamos otro producto disponible en stock.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold">Fallas o pedidos incorrectos</h3>
                <p className="mt-2 leading-7 text-[var(--pf-muted)]">
                  Revisamos cada pedido antes de despacharlo. Si recibís un producto con una falla funcional o uno diferente al solicitado, contactanos para coordinar el reemplazo correspondiente.
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-dashed border-[rgba(200,154,21,0.28)] bg-[rgba(200,154,21,0.08)] px-4 py-4 text-sm leading-6 text-[var(--pf-primary-darker)]">
              Para iniciar una gestión, escribinos con tu número de pedido y fotos del producto si corresponde. Te vamos a acompañar durante todo el proceso.
            </div>
          </div>
        </div>
      ) : null}

      <div className="h-[2px] bg-[#e7c56a]" />

      <div className="pf-shell grid gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_.9fr_.9fr] lg:px-12">
        <div className="max-w-[22rem]">
          <Image
            src={publicAsset("/assets/images/logo/logo_v2.png")}
            alt="Pintofruta"
            width={83}
            height={21}
            className="h-auto w-[58px] sm:w-[71px]"
          />

          <p className="mt-5 text-sm leading-6 text-[#fbf8f2]">
            {accentSentence("Diseño, fabricación y presencia editorial para espacios que piden carácter.")}
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-[11px] font-black uppercase tracking-[0.34em] text-[#fbf8f2]">
            {accentSentence("Navegación")}
          </h3>

          <ul className="space-y-3 text-sm text-[#fbf8f2]">
            <li>
              <Link href="/" className="text-[#fbf8f2] transition hover:text-[#e7c56a]">
                {accentSentence("Inicio")}
              </Link>
            </li>
            <li>
              <Link href="/galeria" className="text-[#fbf8f2] transition hover:text-[#e7c56a]">
                {accentSentence("Galería")}
              </Link>
            </li>
            <li>
              <Link href="/busqueda" className="text-[#fbf8f2] transition hover:text-[#e7c56a]">
                {accentSentence("Búsqueda")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-[11px] font-black uppercase tracking-[0.34em] text-[#fbf8f2]">
            {accentSentence("Contacto")}
          </h3>

          <ul className="space-y-3 text-sm text-[#fbf8f2]">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#e7c56a]" />
              <span>{accentSentence("Showroom con atención personalizada")}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#e33226]" />
              <span>{accentSentence("Instagram y WhatsApp")}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#e7c56a]" />
              <span>{accentSentence("Consultas y asesoramiento")}</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
