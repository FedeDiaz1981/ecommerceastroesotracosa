import Link from "next/link";

import { getHomePageViewModel } from "@/application/catalog";
import { useViewer } from "@/components/auth/viewer-provider";
import { CollectivePurchaseCarousel } from "@/components/site/collective-purchase-carousel";
import { CategoryMenuStrip } from "@/components/site/category-menu-strip";
import { FeaturedProductsCarousel } from "@/components/site/featured-products-carousel";
import { HeroCarousel } from "@/components/site/hero-carousel";
import { SectionHeading } from "@/components/site/section-heading";
import { SpotlightBanner } from "@/components/site/spotlight-banner";
import { buttonVariants } from "@/components/ui/button";

export default function HomePageApp() {
  const viewer = useViewer();
  const content = getHomePageViewModel(viewer);

  return (
    <main className="flex w-full flex-1 flex-col gap-0 px-0 py-0">
      <HeroCarousel slides={content.heroSlides} />

      <CategoryMenuStrip categories={content.homeMenuCategories} />

      <div className="pf-shell flex flex-col gap-10 px-4 pb-6 pt-8 sm:px-6 sm:pt-10 lg:px-12 lg:pb-10 lg:pt-12">
        <section id="featured-products" className="space-y-5">
          <SectionHeading
            eyebrow="Coleccion / destacados"
            title="Productos destacados"
            action={
              <Link href="/galeria?featured=1" className={buttonVariants({ variant: "outline", size: "md" })}>
                Ver todos
              </Link>
            }
          />
          <FeaturedProductsCarousel products={content.featuredProducts} returnTo="/" />
        </section>
      </div>

      <div className="mt-6 sm:mt-8 lg:mt-10">
        <SpotlightBanner slide={content.spotlightSlide} />
      </div>

      <div className="pf-shell flex flex-col gap-10 px-4 py-6 sm:px-6 lg:px-12 lg:py-10">
        <section id="trending-products" className="space-y-5">
          <SectionHeading
            eyebrow="Coleccion / tendencias"
            title="Tendencias"
            action={
              <Link href="/galeria?trending=1" className={buttonVariants({ variant: "outline", size: "md" })}>
                Ver todos
              </Link>
            }
          />
          <FeaturedProductsCarousel products={content.trendingProducts} returnTo="/" />
        </section>
      </div>

      {viewer?.authenticated && content.collectivePurchaseLots.length > 0 ? (
        <div className="pf-shell flex flex-col gap-10 px-4 py-6 sm:px-6 lg:px-12 lg:py-10">
          <section id="collective-purchase" className="space-y-5">
            <SectionHeading
              eyebrow="Solo miembros"
              title="Compra colectiva"
            />
            <CollectivePurchaseCarousel lots={content.collectivePurchaseLots} returnTo="/" />
          </section>
        </div>
      ) : null}

      <section id="Resenias" className="w-full bg-transparent py-10 sm:py-12 lg:py-14">
        <div className="pf-shell px-4 sm:px-6 lg:px-12">
          <div className="grid gap-4 lg:grid-cols-4">
            {[
              ["Excelente terminacion y muy buen tapizado.", "Silvia F."],
              ["La foto de la tela ayuda muchisimo para elegir.", "Victoria G."],
              ["La compra fue simple y la atencion fue muy clara.", "Lucia M."],
              ["Nos asesoraron bien con medidas y entrega.", "Matias L."],
            ].map(([quote, name]) => (
              <article
                key={name}
                className="group relative overflow-hidden rounded-[1.75rem] border border-[rgba(200,154,21,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(248,244,236,0.98)_100%)] p-5 shadow-[0_12px_30px_rgba(29,24,20,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(29,24,20,0.1)]"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(200,154,21,0.55),transparent)]" />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[var(--pf-primary-darker)]">★★★★★</p>
                  <span className="rounded-full border border-[rgba(200,154,21,0.16)] bg-[rgba(200,154,21,0.08)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--pf-primary-darker)]">
                    Verificado
                  </span>
                </div>
                <p className="mt-5 text-sm leading-7 text-[var(--pf-text)]">{quote}</p>
                <div className="mt-5 flex items-center gap-3 border-t border-[rgba(0,0,0,0.06)] pt-4">
                  <div className="grid size-10 place-items-center rounded-full bg-[linear-gradient(180deg,var(--pf-primary-soft),var(--pf-primary))] text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-[0_8px_18px_rgba(200,154,21,0.18)]">
                    {String(name)
                      .split(" ")
                      .map((part) => part[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.34em] text-[var(--pf-text)]">{name}</p>
                    <p className="mt-1 text-[11px] text-[var(--pf-muted)]">Cliente satisfecho</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
