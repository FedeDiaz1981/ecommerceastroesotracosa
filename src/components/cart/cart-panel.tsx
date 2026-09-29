"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, CheckCircle2, CreditCard, Landmark, Mail, Minus, Phone, Plus, ShieldCheck, Smartphone, UserRound, Wallet, X } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";

import { useCart, resolveCartLineUnitPrice, type CartLine } from "@/components/cart/cart-context";
import { MercadoPagoCheckoutModal as MercadoPagoPaymentModal } from "@/components/cart/mercado-pago-checkout-modal";
import { formatCurrency, publicAsset } from "@/lib/catalog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CART_TOGGLE_ID = "pf-cart-toggle";
const MERCADO_PAGO_API_BASE_URL = String(
  import.meta.env.PUBLIC_MERCADO_PAGO_API_BASE_URL ?? (import.meta.env.DEV ? "http://127.0.0.1:3000" : ""),
).replace(/\/$/, "");
const MERCADO_PAGO_PREFERENCE_ENDPOINT = `${MERCADO_PAGO_API_BASE_URL}/api/mercado-pago/preference`;

type PaymentOption = {
  id: string;
  title: string;
  description: string;
  badge: string;
  icon: typeof CreditCard;
  plans: number[];
};

type CustomerContact = {
  name: string;
  email: string;
  phone: string;
};

const paymentOptions: PaymentOption[] = [
  {
    id: "account_money",
    title: "Dinero en Mercado Pago",
    description: "Aprobacion inmediata con saldo disponible.",
    badge: "Sin tarjeta",
    icon: Wallet,
    plans: [1],
  },
  {
    id: "credit_card",
    title: "Tarjeta de credito",
    description: "Cuotas visibles antes de confirmar.",
    badge: "Financiacion",
    icon: CreditCard,
    plans: [1, 3, 6, 12],
  },
  {
    id: "debit_card",
    title: "Debito o prepaga",
    description: "Pago en un movimiento, sujeto a aprobacion.",
    badge: "Acreditacion rapida",
    icon: Smartphone,
    plans: [1],
  },
  {
    id: "bank_transfer",
    title: "Transferencia",
    description: "Alias o CVU informado por Mercado Pago.",
    badge: "Billetera",
    icon: Landmark,
    plans: [1],
  },
];

function resolveInstallmentLabel(total: number, installments: number) {
  if (installments <= 1) {
    return `1 pago de ${formatCurrency(total)}`;
  }

  return `${installments} cuotas de ${formatCurrency(total / installments)}`;
}

function cleanPdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function makeRemitoNumber() {
  const now = new Date();
  const dayKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const timeKey = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return `R-${dayKey}-${timeKey}`;
}

function buildPedidoPdf({
  customer,
  paymentMethod,
  installmentsLabel,
  items,
  totalItems,
  total,
}: {
  customer: CustomerContact;
  paymentMethod: string;
  installmentsLabel: string;
  items: CartLine[];
  totalItems: number;
  total: number;
}) {
  const now = new Date();
  const remitoNumber = makeRemitoNumber();
  const issuedAt = now.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const subtotal = items.reduce((sum, item) => sum + resolveCartLineUnitPrice(item) * item.quantity, 0);
  const normalizedTotal = total || subtotal;
  const text = (x: number, y: number, value: string, size = 10, font = "F1") =>
    `BT /${font} ${size} Tf ${x} ${y} Td (${cleanPdfText(value)}) Tj ET\n`;
  const rightText = (x: number, y: number, value: string, size = 10, font = "F1") => {
    const clean = cleanPdfText(value);
    const estimatedWidth = clean.length * size * 0.48;
    return text(Math.max(40, x - estimatedWidth), y, value, size, font);
  };
  const line = (x1: number, y1: number, x2: number, y2: number) => `${x1} ${y1} m ${x2} ${y2} l S\n`;
  const rect = (x: number, y: number, width: number, height: number) => `${x} ${y} ${width} ${height} re S\n`;
  const fillRect = (x: number, y: number, width: number, height: number, color: string) => `${color} rg ${x} ${y} ${width} ${height} re f 0 0 0 rg\n`;

  let content = "";
  content += "0.11 0.09 0.07 RG 0.7 w\n";
  content += rect(36, 34, 523, 774);
  content += fillRect(36, 736, 523, 72, "0.98 0.96 0.91");
  content += line(36, 736, 559, 736);
  content += text(56, 776, "ES OTRA COSA", 18, "F2");
  content += text(56, 758, "Muebles y deco", 9);
  content += text(408, 779, "REMITO", 22, "F2");
  content += text(408, 758, `Nro. ${remitoNumber}`, 10, "F2");
  content += text(408, 743, `Fecha: ${issuedAt}`, 9);

  content += rect(56, 638, 483, 72);
  content += fillRect(56, 690, 483, 20, "0.95 0.94 0.91");
  content += text(68, 696, "DATOS DEL CLIENTE", 9, "F2");
  content += text(68, 671, `Nombre: ${customer.name}`, 10);
  content += text(68, 654, `Mail: ${customer.email}`, 10);
  content += text(318, 654, `Celular: ${customer.phone}`, 10);

  content += rect(56, 566, 483, 50);
  content += fillRect(56, 596, 483, 20, "0.95 0.94 0.91");
  content += text(68, 602, "CONDICION DE PAGO Y ENTREGA", 9, "F2");
  content += text(68, 580, `Forma de pago: ${paymentMethod}`, 10);
  content += text(318, 580, `Plan: ${installmentsLabel}`, 10);

  content += rect(56, 210, 483, 328);
  content += fillRect(56, 518, 483, 20, "0.13 0.11 0.09");
  content += "1 1 1 rg\n";
  content += text(68, 524, "CANT.", 8, "F2");
  content += text(112, 524, "CODIGO", 8, "F2");
  content += text(190, 524, "DESCRIPCION", 8, "F2");
  content += text(404, 524, "UNITARIO", 8, "F2");
  content += text(486, 524, "IMPORTE", 8, "F2");
  content += "0 0 0 rg\n";
  content += line(100, 210, 100, 538);
  content += line(178, 210, 178, 538);
  content += line(394, 210, 394, 538);
  content += line(468, 210, 468, 538);

  let rowY = 498;
  items.slice(0, 16).forEach((item) => {
    const unitPrice = resolveCartLineUnitPrice(item);
    const description = `${item.name}${item.measureLabel ? ` - ${item.measureLabel}` : ""}`.slice(0, 42);
    content += text(70, rowY, String(item.quantity), 9);
    content += text(112, rowY, item.sku.slice(0, 14), 9);
    content += text(190, rowY, description, 9);
    content += rightText(456, rowY, formatCurrency(unitPrice), 9);
    content += rightText(528, rowY, formatCurrency(unitPrice * item.quantity), 9, "F2");
    content += line(56, rowY - 9, 539, rowY - 9);
    rowY -= 22;
  });

  content += rect(331, 126, 208, 60);
  content += text(348, 165, "Articulos", 9);
  content += rightText(522, 165, String(totalItems), 9, "F2");
  content += line(331, 150, 539, 150);
  content += text(348, 132, "TOTAL", 13, "F2");
  content += rightText(522, 132, formatCurrency(normalizedTotal), 14, "F2");

  content += text(56, 165, "Observaciones", 9, "F2");
  content += text(56, 148, "Entrega a coordinar con el cliente.", 9);
  content += text(56, 132, "Documento emitido por compra online.", 9);
  content += line(56, 92, 240, 92);
  content += line(355, 92, 539, 92);
  content += text(102, 76, "Firma cliente", 9);
  content += text(402, 76, "Aclaracion", 9);

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function downloadPedidoPdf(blob: Blob) {
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = "pedido-es-otra-cosa.pdf";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
}

function CustomerContactModal({
  total,
  totalItems,
  defaultValue,
  onClose,
  onSubmit,
}: {
  total: number;
  totalItems: number;
  defaultValue: CustomerContact | null;
  onClose: () => void;
  onSubmit: (contact: CustomerContact) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const contact: CustomerContact = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
    };

    if (!contact.name || !contact.email || !contact.phone) {
      setError("Completá tus datos para continuar.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      setError("Ingresá un mail válido.");
      return;
    }

    setError(null);
    onSubmit(contact);
  };

  return (
    <div className="fixed inset-0 z-[13000] flex items-center justify-center bg-[rgba(35,28,20,0.48)] px-3 py-4 backdrop-blur-[3px]">
      <section className="max-h-[94vh] w-full max-w-[760px] overflow-hidden rounded-[1.45rem] border border-[rgba(212,168,26,0.22)] bg-[#fffdfb] text-[var(--pf-text)] shadow-[0_30px_90px_rgba(29,24,20,0.3)]">
        <div className="flex items-center justify-between gap-3 border-b border-[rgba(29,24,20,0.08)] bg-[linear-gradient(180deg,#fffdfb_0%,var(--pf-surface-warm)_100%)] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[var(--pf-secondary-dark)]">Datos de contacto</p>
            <h3 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">Finalizar pedido</h3>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(29,24,20,0.1)] bg-white text-[var(--pf-text)] shadow-[0_8px_18px_rgba(29,24,20,0.06)] transition hover:bg-[rgba(245,243,239,0.85)]"
            onClick={onClose}
            aria-label="Cerrar datos de contacto"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid max-h-[calc(94vh-78px)] overflow-y-auto md:grid-cols-[minmax(0,1fr)_240px]">
          <form className="space-y-5 p-5 sm:p-6" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--pf-muted)]">
                <UserRound className="size-4" />
                Nombre
              </span>
              <Input
                name="name"
                autoComplete="name"
                defaultValue={defaultValue?.name ?? ""}
                placeholder="Nombre y apellido"
                className="h-12 rounded-[1rem] shadow-none"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--pf-muted)]">
                <Mail className="size-4" />
                Mail
              </span>
              <Input
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={defaultValue?.email ?? ""}
                placeholder="tu@email.com"
                className="h-12 rounded-[1rem] shadow-none"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--pf-muted)]">
                <Phone className="size-4" />
                Celular
              </span>
              <Input
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={defaultValue?.phone ?? ""}
                placeholder="11 1234 5678"
                className="h-12 rounded-[1rem] shadow-none"
                required
              />
            </label>

            {error ? <p className="rounded-[1rem] bg-[#fff4f2] px-4 py-3 text-sm font-semibold text-[var(--pf-accent)]">{error}</p> : null}

            <Button type="submit" variant="primary" size="lg" className="mt-1 h-12 w-full !rounded-[1rem] text-base shadow-[0_14px_28px_rgba(212,168,26,0.22)]">
              Continuar al pago
            </Button>
          </form>

          <aside className="border-t border-[rgba(29,24,20,0.08)] bg-[linear-gradient(180deg,var(--pf-surface-warm)_0%,#f8f4ec_100%)] p-5 sm:p-6 md:border-l md:border-t-0">
            <div className="flex h-full flex-col justify-between gap-4">
              <div className="rounded-[1.1rem] border border-[rgba(29,24,20,0.1)] bg-white p-4 shadow-[0_12px_28px_rgba(29,24,20,0.07)]">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--pf-muted)]">Pedido</p>
                <p className="mt-3 text-3xl font-black leading-none">{formatCurrency(total)}</p>
                <div className="mt-4 space-y-2 border-t border-[rgba(29,24,20,0.08)] pt-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[var(--pf-muted)]">Artículos</span>
                    <span className="font-bold">{totalItems}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[var(--pf-muted)]">Entrega</span>
                    <span className="font-bold">A coordinar</span>
                  </div>
                </div>
              </div>
              <p className="rounded-[1rem] bg-[rgba(255,255,255,0.62)] px-4 py-3 text-sm leading-6 text-[var(--pf-muted)]">
                Usaremos estos datos para confirmar el pedido y coordinar la entrega.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function MercadoPagoCheckoutModal({
  total,
  totalItems,
  hasLotItems,
  isProcessing,
  onBack,
  onClose,
  onApprove,
}: {
  total: number;
  totalItems: number;
  hasLotItems: boolean;
  isProcessing: boolean;
  onBack: () => void;
  onClose: () => void;
  onApprove: (paymentMethod: string, installments: number) => void;
}) {
  const [selectedMethodId, setSelectedMethodId] = useState(paymentOptions[1]?.id ?? paymentOptions[0].id);
  const selectedMethod = paymentOptions.find((option) => option.id === selectedMethodId) ?? paymentOptions[0];
  const [selectedInstallments, setSelectedInstallments] = useState(selectedMethod.plans[0] ?? 1);
  const SelectedIcon = selectedMethod.icon;

  const selectMethod = (option: PaymentOption) => {
    setSelectedMethodId(option.id);
    setSelectedInstallments(option.plans[0] ?? 1);
  };

  return (
    <div className="fixed inset-0 z-[13000] flex items-center justify-center bg-[rgba(35,28,20,0.48)] px-3 py-4 backdrop-blur-[3px]">
      <section className="max-h-[94vh] w-full max-w-4xl overflow-hidden rounded-[1.6rem] border border-[rgba(0,118,182,0.18)] bg-[#fffdfb] text-[var(--pf-text)] shadow-[0_30px_90px_rgba(29,24,20,0.3)]">
        <div className="flex items-center justify-between gap-3 border-b border-[rgba(29,24,20,0.08)] bg-[#f8fbff] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(29,24,20,0.1)] bg-white text-[var(--pf-text)] transition hover:bg-[rgba(245,243,239,0.85)]"
              onClick={onBack}
              aria-label="Volver al pedido"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#0076b6]">Mercado Pago</p>
              <h3 className="truncate text-xl font-black sm:text-2xl">Checkout</h3>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(29,24,20,0.1)] bg-white text-[var(--pf-text)] transition hover:bg-[rgba(245,243,239,0.85)]"
            onClick={onClose}
            aria-label="Cerrar pago"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid max-h-[calc(94vh-68px)] overflow-y-auto lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4 p-4 sm:p-5">
            <div className="rounded-[1.2rem] border border-[#c9e7f7] bg-[#eef8ff] p-4">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a8e0] text-white">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#064766]">Compra protegida</p>
                  <p className="mt-1 text-sm leading-6 text-[#315d70]">
                    Elegí cómo querés pagar. Vas a poder revisar el total antes de confirmar.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[var(--pf-muted)]">Medio de pago</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {paymentOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = option.id === selectedMethod.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={[
                        "min-h-[128px] rounded-[1.1rem] border bg-white p-4 text-left shadow-[0_10px_24px_rgba(29,24,20,0.07)] transition",
                        selected
                          ? "border-[#00a8e0] ring-2 ring-[#d8f1fb]"
                          : "border-[rgba(29,24,20,0.1)] hover:border-[#8cd4ef]",
                      ].join(" ")}
                      onClick={() => selectMethod(option)}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fff159] text-[#064766]">
                          <Icon className="size-5" />
                        </span>
                        {selected ? <CheckCircle2 className="size-5 text-[#00a650]" /> : null}
                      </span>
                      <span className="mt-4 block text-base font-black">{option.title}</span>
                      <span className="mt-1 block text-sm leading-5 text-[var(--pf-muted)]">{option.description}</span>
                      <span className="mt-3 inline-flex rounded-full bg-[#f3f7f9] px-3 py-1 text-xs font-bold text-[#315d70]">{option.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[var(--pf-muted)]">Cuotas</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {selectedMethod.plans.map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    className={[
                      "rounded-[1rem] border px-4 py-3 text-left transition",
                      selectedInstallments === plan
                        ? "border-[#00a8e0] bg-[#eef8ff]"
                        : "border-[rgba(29,24,20,0.1)] bg-white hover:border-[#8cd4ef]",
                    ].join(" ")}
                    onClick={() => setSelectedInstallments(plan)}
                  >
                    <span className="block text-sm font-black">{resolveInstallmentLabel(total, plan)}</span>
                    <span className="mt-1 block text-xs text-[var(--pf-muted)]">
                      {plan === 1 ? "Pago único" : "Financiación disponible para este pedido"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="border-t border-[rgba(29,24,20,0.08)] bg-[var(--pf-surface-warm)] p-4 sm:p-5 lg:border-l lg:border-t-0">
            <div className="rounded-[1.2rem] border border-[rgba(29,24,20,0.1)] bg-white p-4 shadow-[0_12px_28px_rgba(29,24,20,0.07)]">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#fff159] text-[#064766]">
                  <SelectedIcon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-black">{selectedMethod.title}</p>
                  <p className="text-xs text-[var(--pf-muted)]">{totalItems} articulo{totalItems === 1 ? "" : "s"}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t border-[rgba(29,24,20,0.08)] pt-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[var(--pf-muted)]">Pedido</span>
                  <span className="font-bold">{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[var(--pf-muted)]">Operacion</span>
                  <span className="font-bold text-[#00a650]">En curso</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[var(--pf-muted)]">Entrega</span>
                  <span className="text-right font-bold">{hasLotItems ? "Reserva colectiva" : "Coordinar"}</span>
                </div>
              </div>

              <div className="mt-5 rounded-[1rem] bg-[#f8fbff] p-3">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0076b6]">Total</p>
                <p className="mt-1 text-3xl font-black">{formatCurrency(total)}</p>
                <p className="mt-1 text-sm text-[var(--pf-muted)]">{resolveInstallmentLabel(total, selectedInstallments)}</p>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                className="mt-5 w-full !bg-[#00a650] !text-white hover:!brightness-105"
                onClick={() => onApprove(selectedMethod.title, selectedInstallments)}
                disabled={isProcessing}
              >
                <BadgeCheck className="size-5" />
                {isProcessing ? "Procesando..." : "Pagar"}
              </Button>

              <p className="mt-3 text-center text-xs leading-5 text-[var(--pf-muted)]">
                Pagás de forma segura con Mercado Pago.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

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
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [cancelingLotSku, setCancelingLotSku] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [customerContact, setCustomerContact] = useState<CustomerContact | null>(null);

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

  const handleStartPayment = useCallback(() => {
    if (!hydrated || items.length === 0) {
      return;
    }

    setContactModalOpen(true);
  }, [hydrated, items.length]);

  const handleApprovePayment = useCallback(
    async (paymentMethod: string, installments: number) => {
      if (!hydrated || items.length === 0 || isConfirming) {
        return;
      }

      if (!customerContact) {
        setPaymentModalOpen(false);
        setContactModalOpen(true);
        return;
      }

      try {
        setIsConfirming(true);
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        const installmentsLabel = resolveInstallmentLabel(totalPrice, installments);
        const pdf = buildPedidoPdf({
          customer: customerContact,
          paymentMethod,
          installmentsLabel,
          items,
          totalItems,
          total: totalPrice,
        });

        clearCart();
        closeCart();
        setPaymentModalOpen(false);
        setSuccessMessage("Gracias por tu compra");
        window.setTimeout(() => downloadPedidoPdf(pdf), 250);
      } catch (error) {
        console.error(error);
        window.alert(error instanceof Error ? error.message : "No pudimos procesar el pago.");
      } finally {
        setIsConfirming(false);
      }
    },
    [clearCart, closeCart, customerContact, hydrated, isConfirming, items, totalItems, totalPrice],
  );

  const hasLotItems = items.some((item) => item.kind === "lot");

  const successModal = successMessage ? (
    <div className="fixed inset-0 z-[13000] flex items-center justify-center bg-[rgba(35,28,20,0.42)] px-4 py-6 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-[2rem] border border-[var(--pf-border-warm)] bg-[var(--pf-surface)] p-6 text-[var(--pf-text)] shadow-[0_30px_80px_rgba(29,24,20,0.28)]">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--pf-secondary-dark)]">Confirmación</p>
        <h3 className="mt-3 text-2xl font-black tracking-tight">{successMessage}</h3>
        <p className="mt-3 text-sm leading-7 text-[var(--pf-muted)]">
          En breve estaremos comunicándonos para coordinar la entrega.
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

  const contactModal = contactModalOpen ? (
    <CustomerContactModal
      total={totalPrice}
      totalItems={totalItems}
      defaultValue={customerContact}
      onClose={() => setContactModalOpen(false)}
      onSubmit={(contact) => {
        setCustomerContact(contact);
        setContactModalOpen(false);
        setPaymentModalOpen(true);
      }}
    />
  ) : null;

  const paymentModal = paymentModalOpen ? (
    <MercadoPagoPaymentModal
      endpoint={MERCADO_PAGO_PREFERENCE_ENDPOINT}
      items={items}
      total={totalPrice}
      totalItems={totalItems}
      contact={customerContact}
      onBack={() => {
        setPaymentModalOpen(false);
        setContactModalOpen(true);
      }}
      onClose={() => setPaymentModalOpen(false)}
    />
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
            onClick={handleStartPayment}
            disabled={items.length === 0 || isConfirming}
          >
            {isConfirming ? "Procesando..." : "Continuar al pago"}
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
        {contactModal}
        {paymentModal}
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
      {contactModal}
      {paymentModal}
      {successModal}
    </>
  );
}
