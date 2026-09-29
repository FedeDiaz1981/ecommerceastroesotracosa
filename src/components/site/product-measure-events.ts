export const PRODUCT_MEASURE_CHANGE_EVENT = "pf-product-measure-change";

export interface ProductMeasureChangeDetail {
  productId: number;
  measureId?: string;
  measureLabel?: string;
  price: number;
  listPrice?: number;
  cashPrice?: number;
  offerActive?: boolean;
  openingSystemImage?: string;
  showOpeningSystem: boolean;
}
