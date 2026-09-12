"use client";

import type { ProductLotItem } from "@/domain/site-content";
import { LotReserveButton } from "@/components/site/lot-reserve-button";

export function LotReservationPanel({ lot }: { lot: ProductLotItem }) {
  return (
    <div className="mx-auto mt-8 flex max-w-[34rem] justify-center px-2">
      <LotReserveButton lot={lot} quantity={1} className="h-12 px-6 text-sm uppercase tracking-[0.22em]">
        Reservar unidades
      </LotReserveButton>
    </div>
  );
}
