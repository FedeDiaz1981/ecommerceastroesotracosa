"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";

const CART_TOGGLE_ID = "pf-cart-toggle";

export function CartButton() {
  const { totalItems } = useCart();

  return (
    <label
      htmlFor={CART_TOGGLE_ID}
      role="button"
      aria-label="Carrito"
      className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[rgba(200,154,21,0.15)] bg-[rgba(255,255,255,0.94)] text-[var(--pf-text)] shadow-[0_10px_24px_rgba(29,24,20,0.08)] transition hover:bg-[rgba(245,243,239,0.9)]"
    >
      <ShoppingCart className="size-4" />
      {totalItems > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--pf-primary-darker)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {totalItems}
        </span>
      ) : null}
    </label>
  );
}
