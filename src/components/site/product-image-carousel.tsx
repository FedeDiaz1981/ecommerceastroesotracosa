"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { isVideoAsset, publicAsset } from "@/lib/catalog";

type ProductImageCarouselProps = {
  images: string[];
  alt: string;
  eyebrow?: string;
  title?: ReactNode;
};

export function ProductImageCarousel({ images, alt, eyebrow, title }: ProductImageCarouselProps) {
  const galleryImages = images.length > 0 ? images : [""];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex == null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current == null ? null : (current - 1 + galleryImages.length) % galleryImages.length));
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current == null ? null : (current + 1) % galleryImages.length));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeIndex, galleryImages.length]);

  const activeImage = activeIndex == null ? "" : galleryImages[activeIndex] ?? "";

  return (
    <section className="py-12">
      <div className="mx-auto max-w-[1220px] px-4 sm:px-6 lg:px-8">
        {eyebrow || title ? (
          <div className="mx-auto max-w-4xl text-center">
            {eyebrow ? (
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[var(--pf-secondary-dark)]">{eyebrow}</p>
            ) : null}
            {title ? (
              <h2 className="mt-4 font-serif text-[clamp(1.8rem,3vw,3rem)] leading-tight tracking-[-0.03em] text-[var(--pf-text)]">
                {title}
              </h2>
            ) : null}
          </div>
        ) : null}

        <div className="product-carousel-mask mt-10 overflow-hidden">
          <div className="product-carousel-track flex w-max">
            {[0, 1].map((groupIndex) => (
              <div key={groupIndex} className="product-carousel-group flex gap-2 pr-2">
                {galleryImages.map((image, index) => (
                  <div
                    key={`${groupIndex}-${image || "empty"}-${index}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveIndex(index);
                      }
                    }}
                    className="product-carousel-item relative h-[260px] w-[min(34vw,560px)] min-w-[320px] flex-none cursor-zoom-in bg-[#e7e7e7] sm:h-[320px] lg:h-[380px] lg:w-[min(30vw,560px)]"
                  >
                    {isVideoAsset(image) ? (
                      <video src={publicAsset(image)} muted playsInline className="pointer-events-none h-full w-full object-contain p-4" />
                    ) : (
                    <Image
                      src={publicAsset(image)}
                      alt={`${alt} ${index + 1}`}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 768px) 82vw, 33vw"
                    />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeIndex != null ? (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-[rgba(20,17,14,0.88)] p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Visor de imágenes del producto" onClick={() => setActiveIndex(null)}>
          <button type="button" onClick={() => setActiveIndex(null)} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--pf-text)] shadow-lg" aria-label="Cerrar visor">
            <X className="size-5" />
          </button>
          {galleryImages.length > 1 ? (
            <>
              <button type="button" onClick={(event) => { event.stopPropagation(); setActiveIndex((current) => (current == null ? null : (current - 1 + galleryImages.length) % galleryImages.length)); }} className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--pf-text)] shadow-lg sm:left-8" aria-label="Archivo anterior">
                <ChevronLeft className="size-6" />
              </button>
              <button type="button" onClick={(event) => { event.stopPropagation(); setActiveIndex((current) => (current == null ? null : (current + 1) % galleryImages.length)); }} className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--pf-text)] shadow-lg sm:right-8" aria-label="Archivo siguiente">
                <ChevronRight className="size-6" />
              </button>
            </>
          ) : null}
          <div className="relative flex h-full w-full max-w-6xl items-center justify-center" onClick={(event) => event.stopPropagation()}>
            {isVideoAsset(activeImage) ? (
              <video src={publicAsset(activeImage)} controls autoPlay playsInline className="max-h-full max-w-full rounded-xl object-contain" />
            ) : (
              <Image src={publicAsset(activeImage)} alt={`${alt} ${activeIndex + 1}`} width={1600} height={1200} className="max-h-full w-auto max-w-full rounded-xl object-contain" priority />
            )}
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .product-carousel-mask {
          mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent);
        }

        .product-carousel-track {
          animation: product-carousel-scroll 36s linear infinite;
          will-change: transform;
        }

        .product-carousel-item {
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
        }

        @keyframes product-carousel-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
