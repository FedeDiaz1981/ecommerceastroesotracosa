"use client";

import { motion } from "motion/react";
import { ShoppingCart } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/components/cart/cart-context";

const CART_SCROLL_ROOT_ID = "pf-scroll-root";
const HEADER_SENTINEL_ID = "pf-header-focus-sentinel";
const HEADER_OUT_OF_FOCUS_THRESHOLD = 120;

function useHeaderOutOfFocus() {
  const [isOutOfFocus, setIsOutOfFocus] = useState(false);

  useEffect(() => {
    const scrollRoot = document.getElementById(CART_SCROLL_ROOT_ID);
    const sentinel = document.getElementById(HEADER_SENTINEL_ID);

    if (!scrollRoot) {
      const updateFromWindow = () => {
        setIsOutOfFocus(window.scrollY > HEADER_OUT_OF_FOCUS_THRESHOLD);
      };

      updateFromWindow();
      window.addEventListener("scroll", updateFromWindow, { passive: true });
      window.addEventListener("resize", updateFromWindow);

      return () => {
        window.removeEventListener("scroll", updateFromWindow);
        window.removeEventListener("resize", updateFromWindow);
      };
    }

    const overflowY = window.getComputedStyle(scrollRoot).overflowY;
    const useInternalScroll = overflowY === "auto" || overflowY === "scroll";
    const scrollTarget: Window | HTMLElement = useInternalScroll ? scrollRoot : window;
    const observerRoot = useInternalScroll ? scrollRoot : null;

    const updateFromScroll = () => {
      const currentPosition = useInternalScroll ? scrollRoot.scrollTop : window.scrollY;
      setIsOutOfFocus(currentPosition > HEADER_OUT_OF_FOCUS_THRESHOLD);
    };

    updateFromScroll();

    scrollTarget.addEventListener("scroll", updateFromScroll, { passive: true });

    if (!sentinel) {
      return () => {
        scrollTarget.removeEventListener("scroll", updateFromScroll);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOutOfFocus(!entry.isIntersecting);
      },
      {
        root: observerRoot,
        threshold: 0.01,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      scrollTarget.removeEventListener("scroll", updateFromScroll);
    };
  }, []);

  return isOutOfFocus;
}

export function FloatingCartButton() {
  const { hydrated, isOpen, toggleCart, totalItems } = useCart();
  const isHeaderOutOfFocus = useHeaderOutOfFocus();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const buttonMode = useMemo(() => (isHeaderOutOfFocus ? "expanded" : "compact"), [isHeaderOutOfFocus]);

  if (!hydrated || !portalTarget) {
    return null;
  }

  return createPortal(
    <motion.button
      type="button"
      onClick={toggleCart}
      aria-label={isOpen ? "Cerrar carrito" : `Abrir carrito con ${totalItems} productos`}
      className={[
        "group hidden right-4 bottom-[220px] z-[2147483000] overflow-hidden rounded-full border border-[rgba(200,154,21,0.24)] md:block",
        "bg-[linear-gradient(135deg,var(--pf-surface),rgba(250,247,242,0.88),rgba(227,188,70,0.16))]",
        "px-4 py-3 text-left text-[var(--pf-text)] shadow-[0_18px_42px_rgba(29,24,20,0.16)]",
        "backdrop-blur-md transition duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(212,168,26,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pf-surface)]",
        "lg:right-8 lg:bottom-36",
        "pf-floating-cart-button",
        totalItems > 0 ? "opacity-100" : "opacity-90",
      ].join(" ")}
      initial={false}
      animate={{
        scale: buttonMode === "expanded" ? [1, 1.045, 1] : [1, 1.02, 1],
        borderColor: [
          "rgba(200,154,21,0.24)",
          "rgba(29,24,20,0.18)",
          "rgba(200,154,21,0.24)",
        ],
      }}
      transition={{
        duration: 2.8,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
      style={{
        position: "fixed",
      }}
      >
      <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(212,168,26,0.10),rgba(255,255,255,0.45),rgba(29,24,20,0.06))] opacity-80" />

      <span className="relative flex items-center gap-3">
        <span className="relative grid size-12 place-items-center rounded-full bg-[linear-gradient(180deg,var(--pf-primary-soft),var(--pf-primary-darker))] text-white shadow-[0_12px_24px_rgba(29,24,20,0.18)]">
          <ShoppingCart className="size-5" />
          <motion.span
            className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full border border-white bg-[var(--pf-secondary-dark)] px-1.5 py-0.5 text-[10px] font-black leading-none text-white shadow-[0_8px_18px_rgba(29,24,20,0.18)]"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            {totalItems}
          </motion.span>
        </span>

        <span className={`flex flex-col pr-1 transition-all duration-300 ${buttonMode === "expanded" ? "opacity-100" : "max-w-0 overflow-hidden opacity-0 lg:max-w-[0px]"}`}>
          <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--pf-muted)]">
            Tu pedido
          </span>
          <span className="text-sm font-black tracking-[-0.02em] text-[var(--pf-text)]">
            {isOpen ? "Cerrar carrito" : "Abrir carrito"}
          </span>
        </span>

      </span>

      <span className="pointer-events-none absolute -left-1 top-3 h-3 w-3 rounded-sm border border-[rgba(29,24,20,0.14)] bg-[var(--pf-primary-faint)] shadow-[0_8px_16px_rgba(29,24,20,0.12)] pf-floating-cart-particle pf-floating-cart-particle-in" />
      <span className="pointer-events-none absolute left-8 bottom-3 h-3 w-4 rounded-[0.38rem] border border-[rgba(29,24,20,0.14)] bg-[var(--pf-surface)] shadow-[0_8px_16px_rgba(29,24,20,0.12)] pf-floating-cart-particle pf-floating-cart-particle-out" />
    </motion.button>,
    portalTarget,
  );
}
