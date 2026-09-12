import Link from "next/link";
import type { CategoryItem } from "@/domain/site-content";
import { categoryIconComponents, resolveCategoryIconKey, type CategoryIconKey } from "@/lib/category-icons";

function CategoryCard({ category }: { category: CategoryItem }) {
  const iconKey: CategoryIconKey = resolveCategoryIconKey(category.name, category.icon as CategoryIconKey | undefined);
  const Icon = categoryIconComponents[iconKey] ?? categoryIconComponents.package;

  return (
    <Link
      href={`/galeria?category=${encodeURIComponent(category.name)}`}
      className="group flex aspect-square min-h-[170px] flex-col items-center justify-center gap-5 rounded-[1.65rem] border border-[rgba(200,154,21,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,245,240,0.98)_100%)] px-5 py-6 text-center shadow-[0_10px_24px_rgba(29,24,20,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[rgba(200,154,21,0.26)] hover:shadow-[0_16px_34px_rgba(29,24,20,0.12)]"
    >
      <span className="grid size-20 place-items-center rounded-[1.3rem] border border-[rgba(29,24,20,0.08)] bg-[rgba(255,255,255,0.98)] text-[var(--pf-primary-darker)] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
        <Icon className="size-9 stroke-[1.8]" />
      </span>

      <span className="text-[0.92rem] font-semibold leading-5 tracking-[0.01em] text-[var(--pf-text)] sm:text-[0.98rem]">
        {category.name}
      </span>
    </Link>
  );
}

export function CategoryMenuStrip({ categories }: { categories: CategoryItem[] }) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.05))]">
      <div className="pf-shell px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {categories.map((category) => (
            <div key={category.id} className="min-w-0">
              <CategoryCard category={category} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
