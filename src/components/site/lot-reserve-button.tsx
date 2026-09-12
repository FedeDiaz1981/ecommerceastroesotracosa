"use client";

import type { ReactNode } from "react";
import type { ProductLotItem } from "@/domain/site-content";
import { useViewer } from "@/components/auth/viewer-provider";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";

export function LotReserveButton({
  lot,
  quantity = 1,
  children,
  className,
}: {
  lot: ProductLotItem;
  quantity?: number;
  children?: ReactNode;
  className?: string;
}) {
  const viewer = useViewer();
  const { addLot, openCart } = useCart();

  return (
    <Button
      type="button"
      className={className}
      disabled={lot.availableUnits <= 0}
      onClick={() => {
        if (!viewer?.authenticated) {
          window.dispatchEvent(new Event("pf-auth-modal:open"));
          return;
        }

        if (lot.availableUnits <= 0) {
          window.alert("El lote ya no tiene unidades disponibles.");
          return;
        }

        addLot(lot, quantity);
        openCart();
      }}
    >
      {children ?? "Reservar unidades"}
    </Button>
  );
}
