export interface HeroSlide {
  id: number;
  order: number;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  imageMobile?: string;
  link: string;
  active: boolean;
  homeSpotlight?: boolean;
}

export interface BannerItem {
  id: number;
  text: string;
  order: number;
  active: boolean;
}

export interface NavGroupItem {
  id: string | number;
  label: string;
  href: string;
}

export interface NavGroup {
  id: string;
  label: string;
  href: string;
  items: NavGroupItem[];
}

export interface NavSection {
  id: string;
  label: string;
  icon: string;
  href: string;
  groups: NavGroup[];
}

export interface HeaderNavigation {
  searchScopes: {
    id: string;
    label: string;
    href: string;
  }[];
  sections: NavSection[];
}

export interface ProductItem {
  id: number;
  sku: string;
  name: string;
  detail: string;
  presentation: string;
  categoryId: number;
  categoryName: string;
  categoryIds?: number[];
  categoryNames?: string[];
  brand: string;
  vegano: boolean;
  kosher: boolean;
  testeadoEnAnimales?: boolean;
  publicPrice: number;
  memberPrice: number;
  installmentCount?: number;
  interestFreeInstallments?: number[];
  measures?: ProductMeasure[];
  image?: string;
  images?: string[];
  fabricIds?: number[];
  relatedProductIds?: number[];
  fabricVariants?: ProductFabricVariant[];
  onlyMembers?: boolean;
  status: string;
  featured: boolean;
  featuredPriority?: number;
  trending?: boolean;
  stock?: number;
  viewsCount?: number;
  salesCount?: number;
  description?: string;
  sourceSection?: string;
  templateRowMap?: Record<string, number>;
  lotOffers?: ProductLotItem[];
  activeLot?: ProductLotItem | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductMeasure {
  id: string;
  label: string;
  width?: number;
  depth?: number;
  height?: number;
  unit?: string;
  publicPrice: number;
}

export interface PackIncludedProduct {
  productId: number;
  quantity: number;
  product: ProductItem;
}

export interface PackItem {
  id: number;
  apodo: string;
  title: string;
  description: string;
  category: string;
  publicPrice: number;
  image?: string;
  active: boolean;
  featured?: boolean;
  order?: number;
  items: PackIncludedProduct[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  visible: boolean;
  homeMenu?: boolean;
  icon?: string;
}

export interface BrandItem {
  id: string;
  code: string;
  name: string;
  image?: string;
  featured: boolean;
  active?: boolean;
}

export interface PaymentMethodItem {
  id: number;
  name: string;
  logo?: string;
  order?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FabricItem {
  id: number;
  name: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFabricVariant {
  fabricId: number;
  fabricName?: string;
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductLotItem {
  id: number;
  productId: number;
  productSku?: string;
  productName?: string;
  fixedFabricId?: number | null;
  fixedFabricName?: string;
  fixedMeasureId?: string | null;
  fixedMeasureLabel?: string;
  useFabricImage?: boolean;
  title: string;
  description: string;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number;
  regularUnitPrice: number;
  lotUnitPrice: number;
  status: string;
  onlyMembers: boolean;
  image?: string;
  completedAt?: string;
  completionEmailSentAt?: string;
  adminNotifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductRelatedItem {
  productId: number;
  relatedProductIds: number[];
}

export interface ProductLotReservationItem {
  id: number;
  lotId: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  lotTitle?: string;
  productId?: number;
  productSku?: string;
  productName?: string;
  fixedFabricId?: number | null;
  fixedFabricName?: string;
  lotImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  notes?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  adminNote?: string;
  confirmedByUserId?: number | null;
  cancelledByUserId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  canSeePrices: boolean;
  active: boolean;
  authUserId?: string | null;
}

export interface SiteContentDocument {
  sessionRole?: string;
  viewMode?: string;
  activeAdminPanel?: string;
  panelSearchQuery?: string;
  activeModalAction?: string;
  headerNavigation?: HeaderNavigation;
  heroSlides: HeroSlide[];
  banners: BannerItem[];
  products: ProductItem[];
  productRelations?: ProductRelatedItem[];
  productLots?: ProductLotItem[];
  productLotReservations?: ProductLotReservationItem[];
  packs?: PackItem[];
  brands: BrandItem[];
  paymentMethods?: PaymentMethodItem[];
  fabrics?: FabricItem[];
  categories?: CategoryItem[];
  users?: UserItem[];
  ping?: boolean;
  nextIds?: {
    product?: number;
    category?: number;
    user?: number;
    heroSlide?: number;
    banner?: number;
    pack?: number;
    fabric?: number;
  };
}

export interface HomePageViewModel {
  banners: BannerItem[];
  heroSlides: HeroSlide[];
  spotlightSlide: HeroSlide | null;
  featuredBanner: BannerItem | null;
  secondaryBanner: BannerItem | null;
  brands: BrandItem[];
  homeMenuCategories: CategoryItem[];
  featuredProducts: ProductItem[];
  trendingProducts: ProductItem[];
  collectivePurchaseLots: ProductLotItem[];
  activePromotions: PackItem[];
  featuredBrands: BrandItem[];
  stats: {
    label: string;
    value: string;
  }[];
}

export interface CatalogFilters {
  query?: string;
  brand?: string;
  category?: string;
  featuredOnly?: boolean;
  trendingOnly?: boolean;
}
