"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { HeroSlide } from "@/domain/site-content";
import { publicAsset } from "@/lib/catalog";
import { Button, buttonVariants } from "@/components/ui/button";

function resolveHref(href: string) {
  return href.replace("galeria.html", "/galeria").replace("busqueda.html", "/busqueda");
}

function MobileHeroCarousel({ slides, visibleIndex }: { slides: HeroSlide[]; visibleIndex: number }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: slides.length > 1, align: "start" });

  useEffect(() => {
    if (!emblaApi || slides.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      emblaApi.scrollNext();
    }, 5200);

    return () => window.clearInterval(timer);
  }, [emblaApi, slides.length]);

  return (
      <section className="w-full overflow-hidden bg-[var(--pf-surface)] md:hidden">
      <div className="relative h-[min(25svh,260px)] w-full overflow-hidden">
        <div ref={emblaRef} className="h-full overflow-hidden">
          <div className="flex h-full touch-pan-y">
            {slides.map((slide, index) => {
              const active = index === visibleIndex;

              return (
                <div key={slide.id} className="flex h-full min-w-0 flex-[0_0_100%] px-3 py-3">
                  <article
                    className={`relative flex h-full w-full overflow-hidden rounded-[1.9rem] border border-[rgba(200,154,21,0.18)] bg-[var(--pf-surface)] shadow-[0_18px_40px_rgba(29,24,20,0.16)] transition-opacity duration-350 ease-out ${active ? "opacity-100" : "opacity-82"}`}
                  >
                    <picture className="absolute inset-0 block h-full w-full">
                      {slide.imageMobile ? <source media="(max-width: 767px)" srcSet={publicAsset(slide.imageMobile)} /> : null}
                      <img
                        src={publicAsset(slide.image)}
                        alt={slide.title}
                        className="h-full w-full object-cover object-center"
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                      />
                    </picture>

                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,24,20,0.06)_0%,rgba(29,24,20,0.14)_26%,rgba(29,24,20,0.56)_74%,rgba(29,24,20,0.84)_100%)]" />
                    <div className="absolute inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,rgba(29,24,20,0.42),transparent)]" />

                    <div className="relative z-10 flex h-full w-full items-start">
                      <div className="w-full px-4 pb-4 pt-8 text-white">
                        <span className="inline-flex rounded-full bg-[rgba(200,154,21,0.18)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-[0_8px_18px_rgba(29,24,20,0.16)]">
                          {slide.badge}
                        </span>
                        <div className="mt-4">
                          <Link
                            href={resolveHref(slide.link)}
                            className={`${buttonVariants({ variant: "primary", size: "lg" })} !text-white`}
                          >
                            Ir a la galería
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        {slides.length > 1 ? (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Ir al banner ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${index === visibleIndex ? "w-8 bg-[var(--pf-primary-darker)]" : "w-2.5 bg-[rgba(29,24,20,0.28)]"}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const orderedSlides = useMemo(() => [...slides].sort((left, right) => left.order - right.order), [slides]);
  const [activeIndex, setActiveIndex] = useState(0);
  const desktopHeroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (orderedSlides.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % orderedSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [orderedSlides.length]);

  useEffect(() => {
    if (orderedSlides.length <= 1) {
      return undefined;
    }

    const root = desktopHeroRef.current;

    if (!root) {
      return undefined;
    }

    const previousButton = root.querySelector<HTMLButtonElement>('button[aria-label="Banner anterior"]');
    const nextButton = root.querySelector<HTMLButtonElement>('button[aria-label="Banner siguiente"]');
    const dotButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-hero-slide-index]'));

    const handlePrevious = () => {
      setActiveIndex((current) => (current - 1 + orderedSlides.length) % orderedSlides.length);
    };

    const handleNext = () => {
      setActiveIndex((current) => (current + 1) % orderedSlides.length);
    };

    const handleDot = (event: Event) => {
      const target = event.currentTarget as HTMLButtonElement | null;
      const nextIndex = Number(target?.dataset.heroSlideIndex);

      if (Number.isNaN(nextIndex)) {
        return;
      }

      setActiveIndex(nextIndex);
    };

    previousButton?.addEventListener("click", handlePrevious);
    nextButton?.addEventListener("click", handleNext);
    dotButtons.forEach((button) => button.addEventListener("click", handleDot));

    return () => {
      previousButton?.removeEventListener("click", handlePrevious);
      nextButton?.removeEventListener("click", handleNext);
      dotButtons.forEach((button) => button.removeEventListener("click", handleDot));
    };
  }, [orderedSlides.length]);

  if (orderedSlides.length === 0) {
    return null;
  }

  const visibleIndex = activeIndex % orderedSlides.length;

  const goToSlide = (nextIndex: number) => {
    setActiveIndex((nextIndex + orderedSlides.length) % orderedSlides.length);
  };

  return (
    <>
      <MobileHeroCarousel slides={orderedSlides} visibleIndex={visibleIndex} />

      <section ref={desktopHeroRef} className="relative hidden w-full overflow-hidden bg-[var(--pf-surface)] md:block">
        <div className="relative h-[clamp(306px,49vw,544px)] w-full overflow-hidden">
          {orderedSlides.map((slide, index) => {
            const active = index === visibleIndex;

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
                aria-hidden={!active}
              >
                <picture className="absolute inset-0 block h-full w-full">
                  {slide.imageMobile ? <source media="(max-width: 767px)" srcSet={publicAsset(slide.imageMobile)} /> : null}
                  <img
                    src={publicAsset(slide.image)}
                    alt={slide.title}
                    className="h-full w-full object-cover object-center"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                  />
                </picture>

                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(29,24,20,0.78)_0%,rgba(29,24,20,0.50)_28%,rgba(29,24,20,0.16)_52%,rgba(29,24,20,0.02)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_right_center,rgba(200,154,21,0.18),transparent_40%)]" />

                <div className="relative z-10 flex h-full items-center">
                  <div className="pf-shell px-4 sm:px-6 lg:px-12">
                    <div className="max-w-2xl py-10 sm:py-14 lg:py-16">
                      <span className="inline-flex rounded-full bg-[rgba(200,154,21,0.16)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white">
                        {slide.badge}
                      </span>
                      <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">{slide.title}</h1>
                      <p className="mt-4 max-w-xl text-lg leading-8 text-white/82">{slide.subtitle}</p>
                      <div className="mt-8 flex flex-wrap gap-3">
                        <Link href={resolveHref(slide.link)} className={`${buttonVariants({ variant: "primary", size: "lg" })} !text-white`}>
                          Ir a la galería
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {orderedSlides.length > 1 ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 z-20 -translate-y-1/2 shadow-[0_12px_24px_rgba(29,24,20,0.16)]"
                aria-label="Banner anterior"
              >
                <ChevronLeft className="size-6" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 z-20 -translate-y-1/2 shadow-[0_12px_24px_rgba(29,24,20,0.16)]"
                aria-label="Banner siguiente"
              >
                <ChevronRight className="size-6" />
              </Button>
            </>
          ) : null}

          {orderedSlides.length > 1 ? (
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {orderedSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  data-hero-slide-index={index}
                  aria-label={`Ir al banner ${index + 1}`}
                  className={`h-2.5 rounded-full transition-all ${index === visibleIndex ? "w-8 bg-[var(--pf-primary-darker)]" : "w-2.5 bg-[rgba(29,24,20,0.28)]"}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
