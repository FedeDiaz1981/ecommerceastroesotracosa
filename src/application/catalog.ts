import siteContent from "@/data/site-content.json";
import type {
  BannerItem,
  CatalogFilters,
  CategoryItem,
  HomePageViewModel,
  PackItem,
  PaymentMethodItem,
  ProductItem,
  ProductLotItem,
  SiteContentDocument,
} from "@/domain/site-content";
import { normalizeText } from "@/lib/catalog";

type CatalogViewer = { authenticated?: boolean } | null | undefined;

export interface DynamicMenuItem {
  label: string;
  href: string;
  initial: string;
}

export interface DynamicMenuGroup {
  label: string;
  initials: string[];
  itemsByInitial: {
    initial: string;
    items: DynamicMenuItem[];
  }[];
}

export interface DynamicHeaderMenu {
  key: "brands" | "categories";
  label: string;
  href: string;
  groups: DynamicMenuGroup[];
}

export interface CatalogFacetOption {
  label: string;
  value: string;
  count: number;
}

export interface GalleryPageViewModel {
  products: ProductItem[];
  brands: CatalogFacetOption[];
  categories: CatalogFacetOption[];
  activeBrand: string;
  activeCategory: string;
  query: string;
  totalProducts: number;
}

export interface PacksGalleryPageViewModel {
  packs: PackItem[];
  query: string;
  totalPacks: number;
}

const content = siteContent as unknown as SiteContentDocument;

export function getSiteContentSnapshot() {
  return content;
}

function getAlphabetPair(initial: string) {
  const normalized = initial.toUpperCase();
  if (normalized < "A" || normalized > "Z") {
    return "#";
  }

  const code = normalized.charCodeAt(0) - 65;
  const start = String.fromCharCode(65 + Math.floor(code / 2) * 2);
  const end = String.fromCharCode(Math.min(90, start.charCodeAt(0) + 1));
  return `${start}-${end}`;
}

function buildDynamicMenu<T extends { name: string }>(
  items: T[],
  options: {
    key: "brands" | "categories";
    label: string;
    href: string;
    linkFor: (item: T) => string;
  },
): DynamicHeaderMenu {
  const normalizedItems = [...items]
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }))
    .map((item) => {
      const initial = normalizeText(item.name).charAt(0).toUpperCase();
      return {
        label: item.name,
        href: options.linkFor(item),
        initial: initial.match(/[A-Z]/) ? initial : "#",
      };
    });

  const groupsMap = new Map<string, Map<string, DynamicMenuItem[]>>();

  for (const item of normalizedItems) {
    const pair = getAlphabetPair(item.initial);
    const pairGroups = groupsMap.get(pair) ?? new Map<string, DynamicMenuItem[]>();
    const itemsForInitial = pairGroups.get(item.initial) ?? [];
    itemsForInitial.push(item);
    pairGroups.set(item.initial, itemsForInitial);
    groupsMap.set(pair, pairGroups);
  }

  const groups = [...groupsMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "es"))
    .map(([label, initialsMap]) => ({
      label,
      initials: [...initialsMap.keys()].sort((a, b) => a.localeCompare(b, "es")),
      itemsByInitial: [...initialsMap.entries()]
        .sort(([left], [right]) => left.localeCompare(right, "es"))
        .map(([initial, groupedItems]) => ({
          initial,
          items: groupedItems,
        })),
    }));

  return {
    key: options.key,
    label: options.label,
    href: options.href,
    groups,
  };
}

function isVisibleToViewer(product: ProductItem, viewer?: CatalogViewer) {
  return !product.onlyMembers || Boolean(viewer?.authenticated);
}

function filterVisibleProducts(products: ProductItem[], viewer?: CatalogViewer) {
  return products.filter((product) => isVisibleToViewer(product, viewer));
}

function hasRenderableImage(product: ProductItem) {
  return Boolean(product.image && product.image.trim());
}

function getPopularityScore(product: ProductItem) {
  return (product.salesCount ?? 0) * 1000 + (product.viewsCount ?? 0);
}

function getFeaturedBoost(product: ProductItem) {
  return product.featured ? 250 : 0;
}

function buildFeaturedProducts(products: ProductItem[], limit = 12) {
  const eligibleProducts = products.filter((item) => item.status === "published" && item.featured && hasRenderableImage(item));
  const priorityFeatured = eligibleProducts
    .filter((item) => (item.featuredPriority ?? 0) > 0)
    .sort((left, right) => {
      const leftPriority = left.featuredPriority ?? 0;
      const rightPriority = right.featuredPriority ?? 0;
      return (
        leftPriority - rightPriority ||
        getFeaturedBoost(right) - getFeaturedBoost(left) ||
        left.name.localeCompare(right.name, "es", { sensitivity: "base" })
      );
    });

  const priorityIds = new Set(priorityFeatured.map((item) => item.id));
  const rankedPool = eligibleProducts
    .filter((item) => !priorityIds.has(item.id))
    .sort((left, right) => getPopularityScore(right) - getPopularityScore(left) || left.name.localeCompare(right.name, "es", { sensitivity: "base" }));

  const insertions = new Map<number, ProductItem[]>();
  for (const item of priorityFeatured) {
    const position = Math.max(1, item.featuredPriority ?? 1);
    const bucket = insertions.get(position) ?? [];
    bucket.push(item);
    insertions.set(position, bucket);
  }

  const result: ProductItem[] = [];
  let rankedIndex = 0;
  const maxPosition = Math.max(limit, ...priorityFeatured.map((item) => item.featuredPriority ?? 0), rankedPool.length + priorityFeatured.length);

  for (let position = 1; position <= maxPosition && result.length < limit; position += 1) {
    for (const item of insertions.get(position) ?? []) {
      if (result.length >= limit) break;
      result.push(item);
    }

    if (result.length >= limit) break;
    const nextRanked = rankedPool[rankedIndex];
    if (nextRanked) {
      result.push(nextRanked);
      rankedIndex += 1;
    }
  }

  while (result.length < limit && rankedIndex < rankedPool.length) {
    result.push(rankedPool[rankedIndex]);
    rankedIndex += 1;
  }

  return result;
}

function buildTrendingProducts(products: ProductItem[], limit = 12) {
  return products
    .filter((item) => item.status === "published" && hasRenderableImage(item))
    .sort((left, right) => getPopularityScore(right) - getPopularityScore(left) || left.name.localeCompare(right.name, "es", { sensitivity: "base" }))
    .slice(0, limit);
}

function buildCollectivePurchaseLots(products: ProductItem[], lots: ProductLotItem[] = [], limit = 8) {
  const visibleProductIds = new Set(products.map((product) => product.id));
  return lots
    .filter((lot) => Boolean(lot.productSku))
    .filter((lot) => visibleProductIds.has(lot.productId))
    .filter((lot) => lot.availableUnits > 0)
    .filter((lot) => ["open", "published", "active", "reservable"].includes(String(lot.status).toLowerCase()))
    .filter((lot) => Boolean(lot.fixedFabricId))
    .sort((left, right) => {
      const savingsLeft = Math.max(0, left.regularUnitPrice - left.lotUnitPrice);
      const savingsRight = Math.max(0, right.regularUnitPrice - right.lotUnitPrice);
      return savingsRight - savingsLeft || right.availableUnits - left.availableUnits || (right.updatedAt ?? "").localeCompare(left.updatedAt ?? "");
    })
    .slice(0, limit);
}

function filterCatalogProducts(products: ProductItem[], filters: CatalogFilters = {}) {
  const query = normalizeText(filters.query);
  const brand = normalizeText(filters.brand);
  const category = normalizeText(filters.category);

  return products.filter((item) => {
    if (item.status !== "published") {
      return false;
    }

    if (filters.featuredOnly && !item.featured) {
      return false;
    }

    if (filters.trendingOnly && !item.trending) {
      return false;
    }

    const matchesQuery =
      !query ||
      normalizeText(item.name).includes(query) ||
      normalizeText(item.detail).includes(query) ||
      normalizeText(item.brand).includes(query) ||
      normalizeText(item.categoryName).includes(query) ||
      (item.categoryNames ?? []).some((categoryName) => normalizeText(categoryName).includes(query)) ||
      normalizeText(item.sku).includes(query);
    const matchesBrand = !brand || normalizeText(item.brand).includes(brand);
    const matchesCategory =
      !category ||
      normalizeText(item.categoryName).includes(category) ||
      (item.categoryNames ?? []).some((categoryName) => normalizeText(categoryName).includes(category));

    return matchesQuery && matchesBrand && matchesCategory;
  });
}

function buildFacetOptions(products: ProductItem[], selector: (product: ProductItem) => string | string[]): CatalogFacetOption[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const selectedValues = selector(product);
    const values = Array.isArray(selectedValues) ? selectedValues : [selectedValues];
    for (const entry of values) {
      const value = entry.trim();
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "es", { sensitivity: "base" }))
    .map(([label, count]) => ({ label, value: label, count }));
}

export function getDynamicHeaderMenus(): DynamicHeaderMenu[] {
  const visibleCategories = (content.categories ?? []).filter((category) => category.visible);

  return [
    buildDynamicMenu<CategoryItem>(visibleCategories, {
      key: "categories",
      label: "Categorías",
      href: "/galeria?category=",
      linkFor: (category) => "/galeria?category=" + encodeURIComponent(category.name),
    }),
  ];
}

export function getActiveSiteBanners(): BannerItem[] {
  return [...(content.banners ?? [])].filter((item) => item.active && item.text.trim().length > 0).sort((left, right) => left.order - right.order);
}

export function getActivePaymentMethods(): PaymentMethodItem[] {
  return (content.paymentMethods ?? []).filter((method) => method.active !== false);
}

export function getHomePageViewModel(viewer?: CatalogViewer): HomePageViewModel {
  const visibleProducts = filterVisibleProducts(content.products, viewer);
  const banners = [...content.banners].filter((item) => item.active).sort((a, b) => a.order - b.order);
  const heroSlides = [...content.heroSlides].filter((item) => item.active).sort((a, b) => a.order - b.order);
  const spotlightSlide = heroSlides.find((item) => item.homeSpotlight) ?? heroSlides[0] ?? null;
  const featuredProducts = buildFeaturedProducts(visibleProducts, 12);
  const trendingProducts = buildTrendingProducts(visibleProducts, 8);
  const collectivePurchaseLots = buildCollectivePurchaseLots(visibleProducts, content.productLots ?? [], 8);
  const activePromotions = [...(content.packs ?? [])]
    .filter((item) => item.active && item.items.length > 0)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0) || left.title.localeCompare(right.title, "es", { sensitivity: "base" }));
  const brands = content.brands.filter((brand) => brand.active !== false);
  const visibleCategories = (content.categories ?? []).filter((category) => category.visible);
  const highlightedCategories = visibleCategories.filter((category) => category.homeMenu !== false);
  const homeMenuCategories = (highlightedCategories.length > 0 ? highlightedCategories : visibleCategories)
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name, "es", { sensitivity: "base" }));
  const featuredBrands = brands.filter((item) => item.featured).slice(0, 6);

  return {
    banners,
    heroSlides,
    spotlightSlide,
    featuredBanner: banners[0] ?? null,
    secondaryBanner: banners[1] ?? null,
    brands,
    homeMenuCategories,
    featuredProducts,
    trendingProducts,
    collectivePurchaseLots,
    activePromotions,
    featuredBrands,
    stats: [
      { label: "marcas", value: String(brands.length) },
      { label: "productos", value: String(visibleProducts.filter((product) => product.status === "published").length) },
      { label: "destacados", value: String(featuredProducts.length) },
    ],
  };
}

export function searchCatalog(filters: CatalogFilters = {}, viewer?: CatalogViewer) {
  return filterCatalogProducts(filterVisibleProducts(content.products, viewer), filters);
}

export function getGalleryPageViewModel(filters: CatalogFilters = {}, viewer?: CatalogViewer): GalleryPageViewModel {
  const baseProducts = filterVisibleProducts(content.products, viewer).filter((product) => product.status === "published");
  const filteredProducts = filterCatalogProducts(baseProducts, filters);
  const publishedProducts = filters.trendingOnly ? buildTrendingProducts(filteredProducts, filteredProducts.length) : filteredProducts;
  const activeBrandNames = new Set(content.brands.filter((brand) => brand.active !== false).map((brand) => normalizeText(brand.name)));
  const visibleCategoryNames = new Set((content.categories ?? []).filter((category) => category.visible).map((category) => normalizeText(category.name)));
  const brandFacetOptions = buildFacetOptions(publishedProducts, (product) => product.brand).filter((item) => activeBrandNames.has(normalizeText(item.value)));
  const categoryFacetOptions = buildFacetOptions(publishedProducts, (product) => [product.categoryName, ...(product.categoryNames ?? [])]).filter((item) =>
    visibleCategoryNames.has(normalizeText(item.value)),
  );

  return {
    products: filters.trendingOnly ? publishedProducts : filteredProducts,
    brands: brandFacetOptions,
    categories: categoryFacetOptions,
    activeBrand: filters.brand ? normalizeText(filters.brand) : "",
    activeCategory: filters.category ? normalizeText(filters.category) : "",
    query: filters.query ? filters.query.trim() : "",
    totalProducts: publishedProducts.length,
  };
}

export function getPacksGalleryPageViewModel(query = ""): PacksGalleryPageViewModel {
  const normalizedQuery = normalizeText(query);
  const packs = (content.packs ?? []).filter((item) => {
    if (!item.active || item.items.length === 0) return false;
    if (!normalizedQuery) return true;
    return (
      normalizeText(item.title).includes(normalizedQuery) ||
      normalizeText(item.description).includes(normalizedQuery) ||
      normalizeText(item.category).includes(normalizedQuery) ||
      normalizeText(item.apodo).includes(normalizedQuery) ||
      item.items.some((selected) => normalizeText(selected.product.name).includes(normalizedQuery))
    );
  });

  return { packs, query: query.trim(), totalPacks: packs.length };
}

export function getProductBySku(sku: string, viewer?: CatalogViewer) {
  const normalizedSku = normalizeText(sku);
  const product = content.products.find((item) => normalizeText(item.sku) === normalizedSku);
  if (!product || product.status !== "published" || !isVisibleToViewer(product, viewer)) {
    return null;
  }

  return product;
}
