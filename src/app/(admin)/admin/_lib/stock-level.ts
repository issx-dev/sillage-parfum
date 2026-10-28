/** From this level (inclusive) a variant counts as low on stock. */
export const LOW_STOCK_THRESHOLD = 5;

export type StockLevel = "all" | "out" | "low";

export function isStockLevel(value: unknown): value is StockLevel {
  return value === "all" || value === "out" || value === "low";
}

export type ProductFilter = "all" | "out" | "hidden" | "sale";

export function isProductFilter(value: unknown): value is ProductFilter {
  return value === "all" || value === "out" || value === "hidden" || value === "sale";
}
