"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PackItem, ProductItem, ProductLotItem, ProductMeasure } from "@/domain/site-content";

export type CartLine = {
  kind: "product" | "pack" | "lot";
  id: number;
  sku: string;
  name: string;
  brand: string;
  presentation: string;
  image?: string;
  publicPrice: number;
  memberPrice: number;
  measureId?: string;
  measureLabel?: string;
  quantity: number;
  lotId?: number;
  reservationId?: number;
  lotStatus?: string;
  lotAvailableUnits?: number;
  lotRegularUnitPrice?: number;
};

type CartContextValue = {
  items: CartLine[];
  hydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: ProductItem, quantity?: number, measure?: ProductMeasure | null) => void;
  addPack: (pack: PackItem, quantity?: number) => void;
  addLot: (lot: ProductLotItem, quantity?: number, reservationId?: number) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  removeItem: (sku: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CART_STORAGE_KEY = "pintofruta_cart_v1";

const CartContext = createContext<CartContextValue | null>(null);

function clampQuantity(quantity: number, maximum?: number) {
  const normalized = Math.max(1, Math.floor(Number(quantity)) || 1);
  if (maximum == null || !Number.isFinite(maximum)) {
    return normalized;
  }

  return Math.min(normalized, Math.max(0, Math.floor(maximum)));
}

function safeParseCart(value: string | null): CartLine[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as CartLine[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item): CartLine => ({
        kind: item.kind === "pack" ? "pack" : item.kind === "lot" ? "lot" : "product",
        id: Number(item.id),
        sku: String(item.sku),
        name: String(item.name),
        brand: String(item.brand),
        presentation: String(item.presentation),
        image: item.image ? String(item.image) : undefined,
        publicPrice: Number(item.publicPrice),
        memberPrice: Number(item.memberPrice ?? item.publicPrice),
        measureId: item.measureId ? String(item.measureId) : undefined,
        measureLabel: item.measureLabel ? String(item.measureLabel) : undefined,
        quantity: clampQuantity(
          item.quantity,
          item.kind === "lot" && item.lotAvailableUnits != null ? item.lotAvailableUnits : undefined,
        ),
        lotId: item.lotId == null ? undefined : Number(item.lotId),
        reservationId: item.reservationId == null ? undefined : Number(item.reservationId),
        lotStatus: item.lotStatus ? String(item.lotStatus) : undefined,
        lotAvailableUnits: item.lotAvailableUnits == null ? undefined : Number(item.lotAvailableUnits),
        lotRegularUnitPrice: item.lotRegularUnitPrice == null ? undefined : Number(item.lotRegularUnitPrice),
      }))
      .filter((item) => item.sku && Number.isFinite(item.publicPrice) && Number.isFinite(item.memberPrice));
  } catch {
    return [];
  }
}

export function resolveCartLineUnitPrice(item: CartLine) {
  return item.publicPrice;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(safeParseCart(window.localStorage.getItem(CART_STORAGE_KEY)));
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.quantity * resolveCartLineUnitPrice(item), 0);

    return {
      items,
      hydrated,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((current) => !current),
      addItem: (product, quantity = 1, measure) => {
        setItems((current) => {
          const nextQuantity = Math.max(1, quantity);
          const measureId = measure?.id;
          const existing = current.find((item) => item.sku === product.sku && item.measureId === measureId);

          if (existing) {
            return current.map((item) =>
              item.sku === product.sku && item.measureId === measureId ? { ...item, quantity: item.quantity + nextQuantity } : item,
            );
          }

          return [
            ...current,
            {
              kind: "product",
              id: product.id,
              sku: product.sku,
              name: product.name,
              brand: product.brand,
              presentation: product.presentation,
              image: product.image,
              publicPrice: measure?.publicPrice ?? product.publicPrice,
              memberPrice: product.memberPrice,
              measureId: measure?.id,
              measureLabel: measure?.label,
              quantity: nextQuantity,
            },
          ];
        });
      },
      addPack: (pack, quantity = 1) => {
        setItems((current) => {
          const nextQuantity = Math.max(1, quantity);
          const sku = `PACK-${pack.id}`;
          const existing = current.find((item) => item.sku === sku);

          if (existing) {
            return current.map((item) => (item.sku === sku ? { ...item, quantity: item.quantity + nextQuantity } : item));
          }

          return [
            ...current,
            {
              kind: "pack",
              id: pack.id,
              sku,
              name: pack.title,
              brand: pack.category || "Promoción",
              presentation: `${pack.items.length} productos incluidos`,
              image: pack.image,
              publicPrice: pack.publicPrice,
              memberPrice: pack.publicPrice,
              quantity: nextQuantity,
            },
          ];
        });
      },
      addLot: (lot, quantity = 1, reservationId) => {
        setItems((current) => {
          const nextQuantity = clampQuantity(quantity, lot.availableUnits);
          const reservationKey = reservationId == null ? undefined : Number(reservationId);
          const sku = reservationKey ? `LOT-${lot.id}-${reservationKey}` : `LOT-${lot.id}`;
          const existing = current.find((item) => item.sku === sku);

          if (nextQuantity <= 0) {
            return current;
          }

          if (existing) {
            return current.map((item) => {
              if (item.sku !== sku) {
                return item;
              }

              return {
                ...item,
                quantity: clampQuantity(item.quantity + nextQuantity, lot.availableUnits),
                reservationId: reservationKey ?? item.reservationId,
                lotAvailableUnits: lot.availableUnits,
              };
            });
          }

          return [
            ...current,
            {
              kind: "lot",
              id: lot.id,
              sku,
              name: lot.title,
              brand: lot.productName || lot.productSku || "Lote",
              presentation: lot.description || `${lot.totalUnits} unidades`,
              image: lot.image,
              publicPrice: lot.lotUnitPrice,
              memberPrice: lot.lotUnitPrice,
              quantity: nextQuantity,
              lotId: lot.id,
              reservationId: reservationKey,
              lotStatus: lot.status,
              lotAvailableUnits: lot.availableUnits,
              lotRegularUnitPrice: lot.regularUnitPrice,
            },
          ];
        });
      },
      updateQuantity: (sku, quantity) => {
        setItems((current) =>
          current
            .map((item) =>
              item.sku === sku
                ? {
                    ...item,
                    quantity: clampQuantity(quantity, item.kind === "lot" ? item.lotAvailableUnits : undefined),
                  }
                : item,
            )
            .filter((item) => item.quantity > 0),
        );
      },
      removeItem: (sku) => {
        setItems((current) => current.filter((item) => item.sku !== sku));
      },
      clearCart: () => setItems([]),
      totalItems,
      totalPrice,
    };
  }, [hydrated, isOpen, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
