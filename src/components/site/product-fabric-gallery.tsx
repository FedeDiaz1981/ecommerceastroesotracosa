"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ProductItem } from "@/domain/site-content";
import { publicAsset } from "@/lib/catalog";

type FabricGalleryProps = {
  product: ProductItem;
  fixedFabricId?: number | null;
};

export function ProductFabricGallery({ product, fixedFabricId }: FabricGalleryProps) {
  const imageList = product.images?.length ? product.images : product.image ? [product.image] : [];
  const fabricVariants = product.fabricVariants ?? [];
  const initialFabricId = fixedFabricId ?? fabricVariants[0]?.fabricId ?? null;
  const [selectedFabricId, setSelectedFabricId] = useState<number | null>(initialFabricId);

  useEffect(() => {
    if (fixedFabricId != null) {
      setSelectedFabricId(fixedFabricId);
      return;
    }

    if (selectedFabricId == null && fabricVariants[0]?.fabricId != null) {
      setSelectedFabricId(fabricVariants[0].fabricId);
    }
  }, [fabricVariants, fixedFabricId, selectedFabricId]);

  const selectedVariant = useMemo(
    () => fabricVariants.find((variant) => variant.fabricId === selectedFabricId) ?? null,
    [fabricVariants, selectedFabricId],
  );

  const heroImage = selectedVariant?.image || imageList[0] || "";
  const isLocked = fixedFabricId != null;
  const visibleVariants = isLocked && selectedVariant ? [selectedVariant] : fabricVariants;
  const title = isLocked ? selectedVariant?.fabricName || "Tela fija" : "SELECCIONÁ TU TELA";

  const goToVariant = (direction: -1 | 1) => {
    if (visibleVariants.length === 0 || isLocked) {
      return;
    }

    const currentIndex = Math.max(0, visibleVariants.findIndex((variant) => variant.fabricId === selectedFabricId));
    const nextIndex = (currentIndex + direction + visibleVariants.length) % visibleVariants.length;
    setSelectedFabricId(visibleVariants[nextIndex]?.fabricId ?? null);
  };

  return (
    <div className="bg-transparent px-0 py-4 sm:py-6">
      <div className="grid gap-10 xl:grid-cols-[1.04fr_.96fr] xl:items-center">
        <div className="relative min-h-[460px] bg-transparent">
          <Image
            src={publicAsset(heroImage)}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 1280px) 100vw, 52vw"
            priority
          />
        </div>

        <div className="flex flex-col justify-center">
          <h3 className="text-right font-serif text-[clamp(1.65rem,2.6vw,2.75rem)] leading-none tracking-[-0.03em] text-[var(--pf-text)]">
            {title}
          </h3>
          <div className="mt-5 h-px w-full bg-[rgba(0,0,0,0.14)]" />

          {visibleVariants.length > 0 ? (
            <div className="mt-8">
              {isLocked ? null : (
                <div className="flex items-start gap-1.5">
                  <button
                    type="button"
                    onClick={() => goToVariant(-1)}
                    className="mt-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[18px] text-[var(--pf-text)] transition hover:opacity-75 disabled:cursor-default disabled:opacity-30"
                    aria-label="Tela anterior"
                  >
                    <X className="size-4" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                      {visibleVariants.map((variant) => {
                        const active = variant.fabricId === selectedFabricId;

                        return (
                          <button
                            key={variant.fabricId}
                            type="button"
                            onClick={() => setSelectedFabricId(variant.fabricId)}
                            className="group flex flex-col items-center text-center"
                          >
                            <div
                              className={`relative aspect-square w-full overflow-hidden transition ${
                                active ? "border-[4px] border-[rgba(0,0,0,0.72)]" : "border border-[rgba(0,0,0,0.08)]"
                              } bg-white`}
                            >
                              <Image
                                src={publicAsset(variant.image)}
                                alt={variant.fabricName || `Tela ${variant.fabricId}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 42vw, 16vw"
                              />
                            </div>
                            <p className="mt-3 text-[0.95rem] font-normal leading-5 text-[var(--pf-text)]">
                              {variant.fabricName || `Tela ${variant.fabricId}`}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => goToVariant(-1)}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:scale-105"
                        aria-label="Anterior"
                      >
                        <ChevronLeft className="size-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => goToVariant(1)}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:scale-105"
                        aria-label="Siguiente"
                      >
                        <ChevronRight className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-8 text-center text-sm text-[var(--pf-muted)]">No hay telas cargadas para este producto.</p>
          )}
        </div>
      </div>
    </div>
  );
}
