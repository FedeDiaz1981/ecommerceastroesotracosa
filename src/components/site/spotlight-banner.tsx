import Link from "next/link";

import type { HeroSlide } from "@/domain/site-content";

import { buttonVariants } from "@/components/ui/button";
import { publicAsset } from "@/lib/catalog";

export function SpotlightBanner({ slide }: { slide: HeroSlide | null }) {
  if (!slide) {
    return null;
  }

  return (
    <section className="relative w-full overflow-hidden bg-[var(--pf-surface)]">
      <div className="relative h-[clamp(330px,56vw,620px)] w-full overflow-hidden">
        <picture className="absolute inset-0 block h-full w-full">
          {slide.imageMobile ? <source media="(max-width: 767px)" srcSet={publicAsset(slide.imageMobile)} /> : null}
          <img
            src={publicAsset(slide.image)}
            alt={slide.title}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
        </picture>

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(29,24,20,0.76)_0%,rgba(29,24,20,0.54)_24%,rgba(29,24,20,0.18)_46%,rgba(29,24,20,0.04)_64%,rgba(29,24,20,0)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right_center,rgba(200,154,21,0.16),transparent_38%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(29,24,20,0.72)_80%,rgba(29,24,20,0.92))]" />

        <div className="absolute inset-0 z-10 flex items-end sm:items-center sm:justify-start">
          <div className="pf-shell w-full px-4 pb-8 pt-12 sm:px-6 lg:px-12 lg:py-16">
            <div className="max-w-[16rem] rounded-[1.5rem] bg-transparent px-4 py-4 shadow-none sm:max-w-xl md:max-w-2xl md:rounded-none md:px-0 md:py-0">
              <span className="inline-flex rounded-full bg-[rgba(200,154,21,0.16)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-none">
                {slide.badge}
              </span>

              <h2 className="mt-4 max-w-[11ch] text-[2rem] font-extrabold leading-[0.95] tracking-[-0.05em] text-white sm:mt-5 sm:max-w-xl sm:text-4xl sm:leading-none sm:tracking-tight md:text-6xl">
                {slide.title}
              </h2>

              <p className="mt-3 max-w-[18ch] text-[0.95rem] leading-6 text-white/84 sm:mt-4 sm:max-w-xl sm:text-lg sm:leading-8">
                {slide.subtitle}
              </p>

              <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
                <Link href={slide.link} className={`${buttonVariants({ variant: "primary", size: "lg" })} !text-white`}>
                  Ir a la galería
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
