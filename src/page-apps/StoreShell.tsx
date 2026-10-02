import { getActivePaymentMethods, getActiveSiteBanners, getDynamicHeaderMenus, replaceCatalogProducts } from "@/application/catalog";
import type { ProductItem } from "@/domain/site-content";
import { useEffect, useState } from "react";
import { AuthModal } from "@/components/auth/auth-modal";
import { ViewerProvider } from "@/components/auth/viewer-provider";
import { CartProvider } from "@/components/cart/cart-context";
import { CartPanel } from "@/components/cart/cart-panel";
import { FloatingCartButton } from "@/components/cart/floating-cart-button";
import { FloatingWhatsAppButton } from "@/components/site/floating-whatsapp-button";
import { MetaPixel } from "@/components/site/meta-pixel";
import { MobileSiteChrome } from "@/components/site/mobile-site-chrome";
import { SiteBannerStrip } from "@/components/site/site-banner-strip";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import AdminPageApp from "@/page-apps/AdminPageApp";
import CartPageApp from "@/page-apps/CartPageApp";
import CompraColectivaPageApp from "@/page-apps/CompraColectivaPageApp";
import GalleryPageApp from "@/page-apps/GalleryPageApp";
import HomePageApp from "@/page-apps/HomePageApp";
import MisReservasPageApp from "@/page-apps/MisReservasPageApp";
import ProductPageApp from "@/page-apps/ProductPageApp";
import SearchPageApp from "@/page-apps/SearchPageApp";

type StoreShellProps =
  | { page: "home" }
  | { page: "gallery"; searchParams?: Record<string, string> }
  | { page: "search"; searchParams?: Record<string, string> }
  | { page: "cart" }
  | { page: "admin" }
  | { page: "mis-reservas"; searchParams?: Record<string, string> }
  | { page: "compra-colectiva"; lotId: string; searchParams?: Record<string, string> }
  | { page: "product"; sku: string; searchParams?: Record<string, string> };

const META_PIXEL_ID = String(import.meta.env.PUBLIC_META_PIXEL_ID ?? "").trim();

function readBrowserSearchParams() {
  if (typeof window === "undefined") {
    return null;
  }

  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

function renderPage(props: StoreShellProps, searchParams?: Record<string, string>) {
  if (props.page === "gallery") {
    return <GalleryPageApp searchParams={searchParams} />;
  }

  if (props.page === "search") {
    return <SearchPageApp searchParams={searchParams} />;
  }

  if (props.page === "cart") {
    return <CartPageApp />;
  }

  if (props.page === "admin") {
    return <AdminPageApp />;
  }

  if (props.page === "mis-reservas") {
    return <MisReservasPageApp searchParams={searchParams} />;
  }

  if (props.page === "compra-colectiva") {
    return <CompraColectivaPageApp lotId={props.lotId} searchParams={searchParams} />;
  }

  if (props.page === "product") {
    return <ProductPageApp params={{ sku: props.sku }} searchParams={searchParams} />;
  }

  return <HomePageApp />;
}

export function StoreShell(props: StoreShellProps) {
  const banners = getActiveSiteBanners();
  const menus = getDynamicHeaderMenus();
  const paymentMethods = getActivePaymentMethods();
  const [browserSearchParams, setBrowserSearchParams] = useState<Record<string, string> | null>(null);
  const [, setCatalogVersion] = useState(0);
  const searchParams = browserSearchParams ?? ("searchParams" in props ? props.searchParams : undefined);

  useEffect(() => {
    const updateSearchParams = () => setBrowserSearchParams(readBrowserSearchParams() ?? {});

    updateSearchParams();
    window.addEventListener("popstate", updateSearchParams);

    return () => {
      window.removeEventListener("popstate", updateSearchParams);
    };
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/catalog.php", { headers: { Accept: "application/json" }, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo actualizar el catalogo.");
        return response.json() as Promise<{ products?: ProductItem[] }>;
      })
      .then((data) => {
        if (!active || !Array.isArray(data.products)) return;
        replaceCatalogProducts(data.products);
        setCatalogVersion((version) => version + 1);
      })
      .catch(() => {
        // La vista previa local usa el catalogo estatico mientras PHP no esta disponible.
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ViewerProvider initialViewer={null}>
      <MetaPixel fallbackPixelId={META_PIXEL_ID} />
      <CartProvider>
        <div className="relative flex h-dvh flex-col overflow-hidden lg:h-auto lg:min-h-screen lg:overflow-visible">
          <div className="hidden lg:block">
            <SiteBannerStrip banners={banners} />
          </div>
          <SiteHeader menus={menus} />
          <MobileSiteChrome menus={menus} />
          <main
            id="pf-scroll-root"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-[88px] pb-[72px] lg:overflow-visible lg:pt-0 lg:pb-0"
          >
            <div id="pf-header-focus-sentinel" aria-hidden className="h-px w-px" />
            {renderPage(props, searchParams)}
          </main>
          <SiteFooter paymentMethods={paymentMethods} />
          <CartPanel />
          <AuthModal toggleId="global-login-toggle" />
          <FloatingCartButton />
          <FloatingWhatsAppButton />
        </div>
      </CartProvider>
    </ViewerProvider>
  );
}
