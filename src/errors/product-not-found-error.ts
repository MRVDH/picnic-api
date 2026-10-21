/**
 * Thrown by `catalog.getProduct` when Picnic serves its "product not found" page instead of
 * the product: the product doesn't exist or isn't available at the user's location.
 */
export class ProductNotFoundError extends Error {
  readonly productId: string;

  constructor(productId: string) {
    super(`Product "${productId}" was not found or is not available at this location.`);
    this.name = "ProductNotFoundError";
    this.productId = productId;
  }
}

export function isProductNotFoundError(error: unknown): error is ProductNotFoundError {
  return error instanceof ProductNotFoundError;
}
