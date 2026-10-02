import Link from "next/link";
import type { ReactNode } from "react";
import { CartAddButton } from "@/components/cart/cart-add-button";
import { useViewer } from "@/components/auth/viewer-provider";
import { CatalogGrid } from "@/components/site/catalog-grid";
import { getProductBySku } from "@/application/catalog";
import { ProductFabricGallery } from "@/components/site/product-fabric-gallery";
import { ProductImageCarousel } from "@/components/site/product-image-carousel";
import { ProductMeasurePicker } from "@/components/site/product-measure-picker";
import { ProductDynamicPrice } from "@/components/site/product-dynamic-price";
import { ProductOfferPrice } from "@/components/site/product-offer-price";
import { ProductMercadoPagoFinancing } from "@/components/site/product-mercado-pago-financing";
import { ProductOpeningSystem } from "@/components/site/product-opening-system";
import { getSiteContent } from "@/infrastructure/site-content.repository";
import { formatCurrency } from "@/lib/catalog";
import { normalizeReturnTo } from "@/lib/navigation";
import { getDefaultProductMeasure, isProductOfferActive, resolveProductCashPrice, resolveProductUnitPrice } from "@/lib/pricing";

const MERCADO_PAGO_API_BASE_URL = String(
  import.meta.env.PUBLIC_MERCADO_PAGO_API_BASE_URL ?? (import.meta.env.DEV ? "http://127.0.0.1:3000" : ""),
).replace(/\/$/, "");
const MERCADO_PAGO_PAYMENT_METHODS_ENDPOINT = `${MERCADO_PAGO_API_BASE_URL}/api/mercado-pago/payment-methods.php`;

function isVisibleProduct(
  product: {
    status: string;
    onlyMembers?: boolean;
  },
  authenticated: boolean,
) {
  return product.status === "published" && (!product.onlyMembers || authenticated);
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      {eyebrow ? (
        <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[var(--pf-secondary-dark)]">{eyebrow}</p>
      ) : null}
      <h2 className="mt-4 font-serif text-[clamp(1.8rem,3vw,3rem)] leading-tight tracking-[-0.03em] text-[var(--pf-text)]">
        {title}
      </h2>
      {description ? <p className="mt-4 text-sm leading-7 text-[var(--pf-muted)]">{description}</p> : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[170px_1fr] gap-4 border-b border-[rgba(0,0,0,0.08)] py-4 text-sm last:border-b-0">
      <div className="text-[10px] font-black uppercase tracking-[0.34em] text-[var(--pf-muted)]">{label}</div>
      <div className="text-[0.98rem] text-[var(--pf-text)]">{value}</div>
    </div>
  );
}

export default function ProductPageApp({
  params,
  searchParams,
}: {
  params: { sku: string };
  searchParams?: Record<string, string>;
}) {
  const { sku } = params;
  const { returnTo: returnToParam } = searchParams ?? {};
  const viewer = useViewer();
  const authenticated = Boolean(viewer?.authenticated);
  const product = getProductBySku(sku, viewer);

  if (!product) {
    return null;
  }

  const content = getSiteContent();
  const returnTo = normalizeReturnTo(returnToParam, "/galeria");
  const currentProductReturnTo = `/producto/${sku}`;
  const relatedProducts = content.products
    .filter((item) => item.id !== product.id && isVisibleProduct(item, authenticated))
    .filter((item) => (product.relatedProductIds ?? []).includes(item.id))
    .sort((left, right) => {
      const leftScore = (product.relatedProductIds ?? []).includes(left.id) ? 2 : 0;
      const rightScore = (product.relatedProductIds ?? []).includes(right.id) ? 2 : 0;
      return rightScore - leftScore || left.name.localeCompare(right.name, "es", { sensitivity: "base" });
    })
    .slice(0, 6);

  const imageList = product.images?.length ? product.images : product.image ? [product.image] : [];
  const heroImages = imageList.length > 0 ? imageList : [product.image ?? ""];
  const initialMeasure = getDefaultProductMeasure(product);
  const heroPrice = resolveProductUnitPrice(product, initialMeasure);
  const initialListPrice = initialMeasure?.publicPrice ?? product.publicPrice;
  const initialCashPrice = resolveProductCashPrice(product, initialMeasure);
  const offerActive = isProductOfferActive(product, initialMeasure);
  const fabricCount = product.fabricVariants?.length ?? product.fabricIds?.length ?? 0;

  return (
    <main className="bg-[#fbf8f2] text-[var(--pf-text)]">
      <div className="mx-auto flex w-full max-w-[1220px] flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex items-center justify-between pb-4 text-[11px] font-black uppercase tracking-[0.35em] text-[var(--pf-muted)]">
          <Link href={returnTo} className="transition hover:text-[var(--pf-primary-darker)]">
            Volver
          </Link>
        </div>

        <section className="border-b border-[rgba(0,0,0,0.08)] px-2 py-12 text-center sm:px-6 lg:py-14">
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[var(--pf-secondary-dark)]">{product.brand}</p>
          <p className="mt-4 text-[0.8rem] font-medium uppercase tracking-[0.38em] text-[var(--pf-muted)]">
            {product.categoryName}
          </p>
          <h1 className="mt-6 font-serif text-[clamp(3rem,8vw,7rem)] leading-[0.9] tracking-[-0.06em] text-[var(--pf-text)]">
            {product.name}
          </h1>
          <div className="mx-auto mt-8 grid max-w-[44rem] text-white sm:grid-cols-2">
            <div className="bg-[#245f40] px-6 py-5 sm:px-8">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70">Precio en efectivo</p>
              <p className="mt-2 font-serif text-[clamp(2rem,4vw,3.25rem)] leading-none">
                <ProductDynamicPrice productId={product.id} initialPrice={initialCashPrice} priceKey="cashPrice" />
              </p>
            </div>
            <div className="border-t border-white/15 bg-[#111111] px-6 py-5 sm:border-l sm:border-t-0 sm:px-8">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Precio de lista</p>
              <ProductOfferPrice
                productId={product.id}
                initialListPrice={initialListPrice}
                offerPrice={heroPrice}
                offerActive={offerActive}
                className="mt-2 font-serif text-[clamp(2rem,4vw,3.25rem)] leading-none text-white"
                listPriceClassName="text-[1.15rem] text-white/55"
                offerPriceClassName="text-white"
              />
            </div>
          </div>
          <div className="mx-auto mt-6 grid w-full max-w-[29rem] grid-cols-2 gap-3">
            <CartAddButton product={product} className="h-12 min-w-0 px-3 text-[11px] uppercase tracking-[0.12em] sm:px-6 sm:text-sm sm:tracking-[0.22em]">
              Agregar al carrito
            </CartAddButton>
            <ProductMercadoPagoFinancing
              product={product}
              paymentMethodsEndpoint={MERCADO_PAGO_PAYMENT_METHODS_ENDPOINT}
            />
          </div>
        </section>

        <section className="border-y border-[rgba(0,0,0,0.08)] py-12">
          <ProductFabricGallery product={product} />
          <div className="mt-8 flex justify-center">
            <CartAddButton product={product} className="h-12 px-6 text-sm uppercase tracking-[0.22em]">
              Agregar al carrito
            </CartAddButton>
          </div>
        </section>

        <ProductImageCarousel
          images={heroImages}
          alt={product.name}
        />
        <div className="mt-4 flex justify-center">
          <CartAddButton product={product} className="h-12 px-6 text-sm uppercase tracking-[0.22em]">
            Agregar al carrito
          </CartAddButton>
        </div>

        <section className="border-b border-[rgba(0,0,0,0.08)] py-12">
          <SectionTitle
            title="Elegí tu medida"
          />
          <div className="mt-10 flex justify-center">
            <ProductMeasurePicker product={product} />
          </div>
        </section>

        <ProductOpeningSystem productId={product.id} initialMeasure={initialMeasure} />

        <section className="border-y border-[rgba(0,0,0,0.08)] py-12">
          <SectionTitle
            title="Información general"
          />

          <div className="mx-auto mt-10 max-w-4xl border-t border-[rgba(0,0,0,0.08)]">
            <DetailRow label="Garantia" value="Consultanos la cobertura segun la linea y el tapizado." />
            <DetailRow label="Financiacion" value="Tenemos opciones para compras de monto alto." />
            <DetailRow label="Envios" value="Coordinamos entrega y retiro segun la zona." />
            <DetailRow label="Fabricante" value={product.brand} />
          </div>
          <div className="mt-6 flex justify-center">
            <CartAddButton product={product} className="h-12 px-6 text-sm uppercase tracking-[0.22em]">
              Agregar al carrito
            </CartAddButton>
          </div>
        </section>

        <section className="py-12">
          <SectionTitle
            title="Características generales"
          />

          <div className="mt-10 max-w-4xl border-t border-[rgba(0,0,0,0.08)]">
            {[
              { label: "Marca", value: product.brand },
              { label: "Categoria", value: product.categoryName },
              { label: "Precio en efectivo", value: <ProductDynamicPrice productId={product.id} initialPrice={initialCashPrice} priceKey="cashPrice" /> },
              {
                label: offerActive ? "Oferta" : "Precio de lista",
                value: (
                  <ProductOfferPrice
                    productId={product.id}
                    initialListPrice={initialListPrice}
                    offerPrice={heroPrice}
                    offerActive={offerActive}
                    offerPriceClassName="font-bold text-[var(--pf-accent)]"
                  />
                ),
              },
              { label: "Telas", value: `${fabricCount} variantes` },
              { label: "Solo miembros", value: product.onlyMembers ? "Si" : "No" },
              {
                label: "Stock",
                value: product.stock == null ? "A pedido" : product.stock <= 0 ? "Agotado" : `${product.stock} unidades`,
              },
            ].map(({ label, value }) => (
              <DetailRow key={label} label={label} value={value} />
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <CartAddButton product={product} className="h-12 px-6 text-sm uppercase tracking-[0.22em]">
              Agregar al carrito
            </CartAddButton>
          </div>
        </section>

        {relatedProducts.length > 0 ? (
          <section className="border-t border-[rgba(0,0,0,0.08)] py-12">
          <SectionTitle
            title="Productos relacionados"
          />

          <div className="mt-10">
            <CatalogGrid products={relatedProducts} columns={3} returnTo={currentProductReturnTo} />
          </div>
          </section>
        ) : null}

        <section className="border-t border-[rgba(0,0,0,0.08)] py-12">
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
          <div className="mt-8 flex justify-center">
            <CartAddButton product={product} className="h-12 px-6 text-sm uppercase tracking-[0.22em]">
              Agregar al carrito
            </CartAddButton>
          </div>
        </section>
      </div>
    </main>
  );
}

