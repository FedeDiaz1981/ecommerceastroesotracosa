"use client";

import type { ButtonHTMLAttributes } from "react";
import type { ProductItem, ProductMeasure } from "@/domain/site-content";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";

type CartAddButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  product: ProductItem;
  quantity?: number;
  measure?: ProductMeasure | null;
};

export function CartAddButton({ product, quantity = 1, measure, children, onClick, ...props }: CartAddButtonProps) {
  const { addItem } = useCart();

  return (
    <Button
      {...props}
      onClick={(event) => {
        addItem(product, quantity, measure);
        onClick?.(event);
      }}
    >
      {children ?? "Agregar al pedido"}
    </Button>
  );
}
