import Image from "next/image";
import Link from "next/link";

import type { ProductLotItem, ProductLotReservationItem } from "@/domain/site-content";
import { formatCurrency, publicAsset } from "@/lib/catalog";

function formatDateTime(value?: string) {
  if (!value) {
    return "Sin actualizar";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Sin actualizar";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status: string) {
  switch (String(status).toLowerCase()) {
    case "confirmed":
      return "Confirmada";
    case "cancelled":
      return "Anulada";
    default:
      return "Reservada";
  }
}

function getStatusStyle(status: string) {
  switch (String(status).toLowerCase()) {
    case "confirmed":
      return "border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.08)] text-[rgb(21,128,61)]";
    case "cancelled":
      return "border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] text-[rgb(185,28,28)]";
    default:
      return "border-[rgba(200,154,21,0.2)] bg-[rgba(200,154,21,0.08)] text-[var(--pf-primary-darker)]";
  }
}

function ReservationCard({
  reservation,
  lot,
}: {
  reservation: ProductLotReservationItem;
  lot?: ProductLotItem;
}) {
  const image = reservation.lotImage ?? lot?.image ?? "";
  const savings = Math.max(0, reservation.unitPrice ? (lot?.regularUnitPrice ?? reservation.unitPrice) - reservation.unitPrice : 0);

  return (
    <Link href={`/compra-colectiva/${reservation.lotId}?returnTo=/mis-reservas`} className="group block h-full w-full">
      <article className="flex h-full min-h-[24.5rem] flex-col overflow-hidden rounded-[1.5rem] border border-[rgba(212,168,26,0.26)] bg-white shadow-[0_10px_28px_rgba(29,24,20,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(29,24,20,0.14)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,247,244,1))]">
          <div className="absolute left-3 top-3 z-10">
            <span
              className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] shadow-[0_10px_20px_rgba(29,24,20,0.12)] ${getStatusStyle(
                reservation.status,
              )}`}
            >
              {getStatusLabel(reservation.status)}
            </span>
          </div>

          <div className="absolute right-3 top-3 z-10 rounded-full border border-[rgba(212,168,26,0.2)] bg-[rgba(255,255,255,0.94)] px-3 py-1 text-[11px] font-semibold text-[var(--pf-primary-darker)] shadow-[0_8px_18px_rgba(29,24,20,0.08)]">
            {reservation.quantity} unidades
          </div>

          <div className="absolute inset-0 p-4">
            <div className="relative h-full w-full overflow-hidden rounded-[1.15rem] bg-[rgba(255,255,255,0.98)] shadow-[0_18px_36px_rgba(29,24,20,0.10)]">
              <Image
                src={publicAsset(image)}
                alt={reservation.lotTitle ?? lot?.title ?? "Reserva"}
                fill
                className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 82vw, 19rem"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--pf-muted)]">
            {reservation.productName ?? lot?.productName ?? reservation.productSku ?? "Producto"}
          </p>
          <h3 className="line-clamp-2 text-[0.98rem] font-medium leading-6 text-[var(--pf-text)]">
            {reservation.lotTitle ?? lot?.title ?? "Compra colectiva"}
          </h3>
          <p className="text-sm font-semibold text-[var(--pf-primary-darker)]">
            {formatCurrency(reservation.unitPrice)}
            {savings > 0 ? ` · Ahorrás ${formatCurrency(savings)}` : ""}
          </p>
          <p className="text-[11px] text-[var(--pf-muted)]">
            {reservation.fixedFabricName ? `Tela fija: ${reservation.fixedFabricName}` : "Tela fija definida por lote"}
          </p>

          <div className="mt-auto grid gap-2 border-t border-[rgba(29,24,20,0.08)] pt-3 text-sm text-[var(--pf-text)]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--pf-muted)]">Cantidad reservada</span>
              <span className="font-semibold">{reservation.quantity}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--pf-muted)]">Última actualización</span>
              <span className="text-right text-sm">{formatDateTime(reservation.updatedAt ?? reservation.createdAt)}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function ReservationsCarousel({
  reservations,
  lots,
}: {
  reservations: ProductLotReservationItem[];
  lots: ProductLotItem[];
}) {
  const lotsById = new Map(lots.map((lot) => [lot.id, lot] as const));

  if (reservations.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {reservations.map((reservation) => (
        <div key={reservation.id} className="min-w-0">
          <ReservationCard reservation={reservation} lot={lotsById.get(reservation.lotId)} />
        </div>
      ))}
    </div>
  );
}
