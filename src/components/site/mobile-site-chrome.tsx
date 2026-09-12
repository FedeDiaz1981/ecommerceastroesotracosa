"use client";

import Image from "next/image";
import Link from "next/link";
import { ClipboardList, House, Menu, Search, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { DynamicHeaderMenu } from "@/application/catalog";
import { useViewer } from "@/components/auth/viewer-provider";
import { MobileCartButton } from "@/components/cart/mobile-cart-button";
import { buttonVariants } from "@/components/ui/button";
import { publicAsset } from "@/lib/catalog";

type MobileSiteChromeProps = {
  menus: DynamicHeaderMenu[];
};

function MobileSearchModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  if (!open) {
    return null;
  }

  const submitSearch = () => {
    const normalized = query.trim();
    onOpenChange(false);
    router.push(normalized ? `/galeria?q=${encodeURIComponent(normalized)}` : "/galeria");
  };

  return (
    <div className="modal modal-open !z-[12050] items-start pt-[96px] lg:pt-[136px] lg:hidden">
      <div className="modal-box w-[min(92vw,26rem)] max-w-none overflow-hidden rounded-[2rem] border border-[var(--pf-border-warm)] bg-[var(--pf-surface)] p-0 text-[var(--pf-text)] shadow-[0_30px_80px_rgba(29,24,20,0.26)]">
        <div className="flex items-center justify-between border-b border-[rgba(200,154,21,0.12)] px-5 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[var(--pf-muted)]">Búsqueda</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--pf-text)]">Buscar productos</h2>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`${buttonVariants({ variant: "secondary", size: "icon" })} h-10 w-10 rounded-full`}
            aria-label="Cerrar búsqueda"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <label className="block text-xs font-bold uppercase tracking-[0.24em] text-[var(--pf-muted)]" htmlFor="mobile-search-query">
            Qué estás buscando
          </label>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <input
              id="mobile-search-query"
              name="query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitSearch();
                }
              }}
              placeholder="Ej: aloe vera, cosmética, natier"
              className="w-full rounded-[1rem] border border-[var(--pf-border)] bg-[rgba(255,255,255,0.92)] px-4 py-3 text-sm outline-none transition focus:border-[var(--pf-primary)]"
            />

            <div className="grid gap-3 pt-2">
              <button type="submit" className={buttonVariants({ variant: "primary", size: "md" })}>
                Buscar
              </button>
              <Link
                href="/galeria"
                onClick={() => onOpenChange(false)}
                className={buttonVariants({ variant: "secondary", size: "md" })}
              >
                Ver galería
              </Link>
            </div>
          </form>
        </div>
      </div>

      <button type="button" className="modal-backdrop" aria-label="Cerrar búsqueda" onClick={() => onOpenChange(false)} />
    </div>
  );
}

export function MobileSiteChrome({ menus }: MobileSiteChromeProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const viewer = useViewer();
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  void menus;

  const navColumns = viewer?.isAdmin ? "repeat(5, minmax(0, 1fr))" : viewer?.authenticated ? "repeat(4, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))";

  useEffect(() => {
    const searchButton = searchButtonRef.current;
    if (!searchButton) {
      return undefined;
    }

    const handleClick = () => setSearchOpen(true);
    searchButton.addEventListener("click", handleClick);

    return () => {
      searchButton.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[10020] border-b border-[var(--pf-border)] bg-[rgba(245,243,239,0.96)] shadow-[0_14px_32px_rgba(29,24,20,0.08)] backdrop-blur lg:hidden">
        <div className="pf-shell flex h-[78px] items-center justify-between gap-3 px-4">
          <Link
            href="/"
            className="flex items-center justify-center"
          >
            <Image
              src={publicAsset("/assets/images/logo/logo_v2.png")}
              alt="Pintofruta"
              width={83}
              height={22}
              className="h-auto w-[56px] max-w-full"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            <MobileCartButton />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[10020] border-t border-[var(--pf-border)] bg-[rgba(245,243,239,0.98)] shadow-[0_-14px_32px_rgba(29,24,20,0.08)] backdrop-blur lg:hidden">
        <div className="pf-shell grid h-[72px] items-center px-3" style={{ gridTemplateColumns: navColumns }}>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("pf-auth-modal:open"))}
            className="flex h-12 flex-col items-center justify-center rounded-xl text-[var(--pf-primary-darker)] transition hover:bg-[rgba(200,154,21,0.08)]"
            aria-label="Login"
          >
            <UserRound className="size-5" />
          </button>

          <Link
            href="/"
            className="flex h-12 flex-col items-center justify-center rounded-xl text-[var(--pf-primary-darker)] transition hover:bg-[rgba(200,154,21,0.08)]"
            aria-label="Home"
          >
            <House className="size-5" />
          </Link>

          <button
            ref={searchButtonRef}
            type="button"
            className="flex h-12 flex-col items-center justify-center rounded-xl text-[var(--pf-primary-darker)] transition hover:bg-[rgba(200,154,21,0.08)]"
            aria-label="Buscar"
          >
            <Search className="size-5" />
          </button>

          {viewer?.authenticated ? (
            <Link
              href="/mis-reservas"
              className="flex h-12 flex-col items-center justify-center rounded-xl text-[var(--pf-primary-darker)] transition hover:bg-[rgba(200,154,21,0.08)]"
              aria-label="Mis reservas"
            >
              <ClipboardList className="size-5" />
            </Link>
          ) : null}

          {viewer?.isAdmin ? (
            <Link
              href="/admin"
              className="flex h-12 flex-col items-center justify-center rounded-xl text-[var(--pf-primary-darker)] transition hover:bg-[rgba(200,154,21,0.08)]"
              aria-label="Administración"
            >
              <Menu className="size-5" />
            </Link>
          ) : null}
        </div>
      </div>
      <MobileSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
