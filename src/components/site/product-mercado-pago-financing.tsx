"use client";

import { CreditCard, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { PRODUCT_MEASURE_CHANGE_EVENT, type ProductMeasureChangeDetail } from "@/components/site/product-measure-events";
import type { ProductItem } from "@/domain/site-content";
import { formatCurrency } from "@/lib/catalog";
import { getDefaultProductMeasure, resolveProductUnitPrice } from "@/lib/pricing";

type PaymentMethod = { id: string; name: string; paymentTypeId: string };
type InstallmentPlan = { paymentMethodId: string; paymentMethodName: string; installments: number; installmentAmount: number; totalAmount: number; installmentRate: number; message: string };
type PaymentMethodsResponse = { paymentMethods?: PaymentMethod[]; installmentPlans?: InstallmentPlan[]; error?: string };
const planKey = (plan: InstallmentPlan) => `${plan.paymentMethodId}-${plan.installments}-${plan.installmentAmount}-${plan.totalAmount}`;

export function ProductMercadoPagoFinancing({ product, paymentMethodsEndpoint }: { product: ProductItem; paymentMethodsEndpoint: string }) {
  const initialMeasure = getDefaultProductMeasure(product);
  const [price, setPrice] = useState(resolveProductUnitPrice(product, initialMeasure));
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [methodId, setMethodId] = useState("");
  const [selectedPlanKey, setSelectedPlanKey] = useState("");

  useEffect(() => {
    setPrice(resolveProductUnitPrice(product, getDefaultProductMeasure(product)));
  }, [product]);

  useEffect(() => {
    const onMeasureChange = (event: Event) => {
      const detail = (event as CustomEvent<ProductMeasureChangeDetail>).detail;
      if (detail.productId === product.id) setPrice(detail.price);
    };
    window.addEventListener(PRODUCT_MEASURE_CHANGE_EVENT, onMeasureChange);
    return () => window.removeEventListener(PRODUCT_MEASURE_CHANGE_EVENT, onMeasureChange);
  }, [product.id]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true); setError("");
    void fetch(`${paymentMethodsEndpoint}?amount=${encodeURIComponent(String(price))}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as PaymentMethodsResponse;
        if (!response.ok) throw new Error(payload.error || "No se pudieron consultar los medios de pago.");
        const nextMethods = payload.paymentMethods ?? [];
        const nextPlans = payload.installmentPlans ?? [];
        const firstMethodId = nextPlans[0]?.paymentMethodId || nextMethods[0]?.id || "";
        const firstPlan = nextPlans.find((plan) => plan.paymentMethodId === firstMethodId);
        setMethods(nextMethods); setPlans(nextPlans); setMethodId(firstMethodId); setSelectedPlanKey(firstPlan ? planKey(firstPlan) : "");
      })
      .catch((requestError) => { if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : "No se pudieron consultar los medios de pago."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, price, paymentMethodsEndpoint]);

  const plansForMethod = plans.filter((plan) => plan.paymentMethodId === methodId);
  const selectedPlan = plansForMethod.find((plan) => planKey(plan) === selectedPlanKey) ?? null;
  const selectMethod = (nextMethodId: string) => {
    const firstPlan = plans.find((plan) => plan.paymentMethodId === nextMethodId);
    setMethodId(nextMethodId); setSelectedPlanKey(firstPlan ? planKey(firstPlan) : "");
  };

  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex h-12 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[rgba(200,154,21,0.35)] bg-[linear-gradient(180deg,var(--pf-secondary-light),var(--pf-secondary))] px-3 text-xs font-black text-white shadow-[0_12px_25px_rgba(29,24,20,0.15)] transition hover:brightness-110 sm:px-5 sm:text-sm"><CreditCard className="h-4 w-4" /> Ver medios y cuotas</button>
    {open ? <div className="fixed inset-0 z-[13000] flex items-center justify-center bg-[rgba(35,28,20,0.52)] p-4 backdrop-blur-[3px]" role="dialog" aria-modal="true"><section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] border border-[var(--pf-border-warm)] bg-[linear-gradient(180deg,rgba(255,253,248,0.99),rgba(248,244,236,0.99))] shadow-[0_30px_90px_rgba(29,24,20,0.3)]"><header className="flex items-center justify-between gap-3 border-b border-[var(--pf-border-warm)] bg-[linear-gradient(180deg,rgba(244,236,223,0.9),rgba(253,250,244,0.98))] px-5 py-5 sm:px-6"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--pf-primary-dark)]">Mercado Pago</p><h3 className="mt-2 text-xl font-black sm:text-2xl">Medios de pago y cuotas</h3></div><button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pf-border-warm)] bg-[var(--pf-surface)]" aria-label="Cerrar"><X className="h-5 w-5" /></button></header><div className="p-5 sm:p-6"><p className="text-sm font-semibold text-[var(--pf-muted)]">Precio de lista: <span className="font-black text-[var(--pf-text)]">{formatCurrency(price)}</span></p>{loading ? <div className="flex min-h-52 flex-col items-center justify-center"><LoaderCircle className="h-9 w-9 animate-spin text-[var(--pf-primary-dark)]" /><p className="mt-4 text-sm font-bold">Consultando opciones...</p></div> : null}{error ? <div className="flex min-h-52 items-center justify-center text-center"><p className="text-sm text-red-700">{error}</p></div> : null}{!loading && !error ? <div className="mt-5 space-y-6"><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-black uppercase tracking-[0.16em] text-[var(--pf-muted)]">Medio de pago<select value={methodId} onChange={(event) => selectMethod(event.target.value)} className="mt-2 h-12 w-full rounded-full border border-[var(--pf-border-strong)] bg-[var(--pf-surface)] px-4 text-base font-semibold normal-case tracking-normal outline-none focus:border-[var(--pf-primary-dark)]">{methods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select></label><label className="block text-sm font-black uppercase tracking-[0.16em] text-[var(--pf-muted)]">Financiación<select value={selectedPlanKey} onChange={(event) => setSelectedPlanKey(event.target.value)} disabled={!plansForMethod.length} className="mt-2 h-12 w-full rounded-full border border-[var(--pf-border-strong)] bg-[var(--pf-surface)] px-4 text-base font-semibold normal-case tracking-normal outline-none disabled:bg-[var(--pf-surface-strong)]">{!plansForMethod.length ? <option value="">Sin cuotas informadas</option> : null}{plansForMethod.map((plan) => <option key={planKey(plan)} value={planKey(plan)}>{plan.message || `${plan.installments} cuotas de ${formatCurrency(plan.installmentAmount)}`}</option>)}</select></label></div><div className="rounded-[1rem] border border-[var(--pf-border-warm)] bg-[linear-gradient(180deg,rgba(255,251,244,0.96),rgba(244,236,223,0.92))] p-5">{selectedPlan ? <><p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--pf-muted)]">Detalle seleccionado</p><p className="mt-3 text-xl font-black text-[var(--pf-primary-darker)]">{selectedPlan.message || `${selectedPlan.installments} cuotas de ${formatCurrency(selectedPlan.installmentAmount)}`}</p><p className="mt-2 text-sm text-[var(--pf-muted)]">Total: {formatCurrency(selectedPlan.totalAmount)}{selectedPlan.installmentRate > 0 ? ` · TNA ${selectedPlan.installmentRate}%` : ""}</p></> : <p className="text-sm text-[var(--pf-muted)]">Mercado Pago no informa opciones de financiación para este medio y este importe.</p>}</div><div className="flex items-center gap-2 border-t border-[var(--pf-border-soft)] pt-5 text-sm text-[var(--pf-muted)]"><ShieldCheck className="h-5 w-5 shrink-0 text-[var(--pf-primary-dark)]" />La selección y confirmación del pago se realiza desde el carrito.</div></div> : null}</div></section></div> : null}
  </>;
}
