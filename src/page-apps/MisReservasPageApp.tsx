import Link from "next/link";

import { getSiteContentSnapshot } from "@/application/catalog";
import { useViewer } from "@/components/auth/viewer-provider";
import { ReservationsCarousel } from "@/components/site/reservations-carousel";
import { SectionHeading } from "@/components/site/section-heading";
import { appendReturnTo, normalizeReturnTo } from "@/lib/navigation";

export default function MisReservasPageApp({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const viewer = useViewer();

  if (!viewer?.authenticated) {
    return (
      <main className="bg-[#fbf8f2] text-[var(--pf-text)]">
        <div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-[1220px] flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[var(--pf-secondary-dark)]">
            Mis reservas
          </p>
          <h1 className="mt-4 font-serif text-[clamp(2.8rem,7vw,5.8rem)] leading-[0.95] tracking-[-0.06em] text-[var(--pf-text)]">
            Inicia sesión para ver tus reservas
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--pf-muted)]">
            Cuando reserves una unidad de una compra colectiva, acá vas a ver el estado del lote, la cantidad reservada y la última actualización.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--pf-border)] px-6 text-sm font-semibold text-[var(--pf-text)] transition hover:text-[var(--pf-primary-darker)]"
            >
              Volver al inicio
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("pf-auth-modal:open"))}
              className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--pf-primary)] px-6 text-sm font-semibold text-white transition hover:text-white hover:brightness-105"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </main>
    );
  }

  const content = getSiteContentSnapshot();
  const reservations = (content.productLotReservations ?? [])
    .filter((reservation) => reservation.userId === viewer.userId)
    .sort((left, right) => (right.updatedAt ?? right.createdAt ?? "").localeCompare(left.updatedAt ?? left.createdAt ?? ""));

  const totalUnits = reservations.reduce((sum, reservation) => sum + reservation.quantity, 0);
  const pendingReservations = reservations.filter((reservation) => reservation.status === "reserved").length;
  const returnTo = normalizeReturnTo(searchParams?.returnTo, "/mis-reservas");

  return (
    <main className="bg-[#fbf8f2] text-[var(--pf-text)]">
      <div className="mx-auto w-full max-w-[1220px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex items-center justify-between pb-4 text-[11px] font-black uppercase tracking-[0.35em] text-[var(--pf-muted)]">
          <Link href={appendReturnTo("/", returnTo)} className="transition hover:text-[var(--pf-primary-darker)]">
            Compra colectiva
          </Link>
          <span>{reservations.length} reservas</span>
        </div>

        <section className="space-y-8 px-2 py-8 sm:px-6 lg:py-12">
          <SectionHeading
            eyebrow="Reservas"
            title="Mis reservas"
            description="Acá ves el estado de tus compras colectivas, cuántas unidades reservaste y cuándo fue la última actualización."
          />

          <div className="rounded-[2rem] border border-[var(--pf-border-warm)] bg-[linear-gradient(180deg,var(--pf-surface-warm)_0%,var(--pf-sand-soft)_58%,var(--pf-surface-strong)_100%)] p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--pf-primary-darker)]">
                  Resultados
                </p>
                <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--pf-text)]">
                  {reservations.length} reserva{reservations.length === 1 ? "" : "s"} encontrada{reservations.length === 1 ? "" : "s"}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[rgba(200,154,21,0.18)] bg-[rgba(255,255,255,0.88)] px-4 py-2 text-sm font-semibold text-[var(--pf-text)]">
                  {totalUnits} unidades reservadas
                </span>
                <span className="rounded-full border border-[rgba(200,154,21,0.18)] bg-[rgba(255,255,255,0.88)] px-4 py-2 text-sm font-semibold text-[var(--pf-text)]">
                  {pendingReservations} pendientes
                </span>
              </div>
            </div>
          </div>

          {reservations.length === 0 ? (
            <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-[rgba(200,154,21,0.16)] bg-[rgba(255,255,255,0.82)] px-6 py-8 text-center shadow-[0_12px_28px_rgba(29,24,20,0.05)]">
              <p className="text-xl font-black text-[var(--pf-text)]">Todavía no tenés reservas</p>
              <p className="mt-3 text-sm leading-7 text-[var(--pf-muted)]">
                Cuando reserves una unidad, la vas a ver acá con su estado, la cantidad y el detalle del lote.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--pf-primary)] px-6 text-sm font-semibold text-white transition hover:text-white hover:brightness-105"
                >
                  Ver compra colectiva
                </Link>
              </div>
            </div>
          ) : (
            <ReservationsCarousel reservations={reservations} lots={content.productLots ?? []} />
          )}
        </section>
      </div>
    </main>
  );
}
