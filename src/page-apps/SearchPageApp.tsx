import Link from "next/link";
import { useViewer } from "@/components/auth/viewer-provider";
import { CatalogGrid } from "@/components/site/catalog-grid";
import { SectionHeading } from "@/components/site/section-heading";
import { searchCatalog } from "@/application/catalog";
import { buttonVariants } from "@/components/ui/button";

type SearchPageAppProps = {
  searchParams?: { q?: string; brand?: string; category?: string };
};

export default function SearchPageApp({ searchParams = {} }: SearchPageAppProps) {
  return <SearchPageContent searchParams={searchParams} />;
}

function SearchPageContent({
  searchParams,
}: {
  searchParams: { q?: string; brand?: string; category?: string };
}) {
  const params = searchParams;
  const viewer = useViewer();
  const products = searchCatalog({
    query: params.q,
    brand: params.brand,
    category: params.category,
  }, viewer);
  const currentSearch = new URLSearchParams();

  if (params.q?.trim()) {
    currentSearch.set("q", params.q.trim());
  }
  if (params.brand?.trim()) {
    currentSearch.set("brand", params.brand.trim());
  }
  if (params.category?.trim()) {
    currentSearch.set("category", params.category.trim());
  }

  const currentReturnTo = currentSearch.toString() ? `/busqueda?${currentSearch.toString()}` : "/busqueda";

  return (
    <main className="pf-shell flex w-full flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-12 lg:py-10">
      <SectionHeading
        eyebrow="Búsqueda"
        title="Resultados dinámicos"
        description="La búsqueda ya filtra por texto, marca y categoría desde la capa de aplicación."
        action={
          <Link href="/galeria" className={buttonVariants({ variant: "outline", size: "md" })}>
            Ver todo
          </Link>
        }
      />
      <CatalogGrid products={products} returnTo={currentReturnTo} />
    </main>
  );
}
