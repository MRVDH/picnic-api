import PicnicClient from "../..";

let client: PicnicClient;

beforeAll(() => {
  client = new PicnicClient({ authKey: process.env.PICNIC_AUTH_KEY });
});

describe("Catalog - search", () => {
  it("should return sections, sorting options and recipes from getSearchResults", async () => {
    const results = await client.catalog.getSearchResults("melk");

    expect(results.query).toBe("melk");
    expect(results.products?.sections.some((section) => section.products.length > 0)).toBe(true);
    expect(results.products?.sortingOptions.map((option) => option.name)).toContain("RELEVANCE");
    expect(results.recipes.length).toBeGreaterThan(0);
  });
});

describe("Catalog - product details page", () => {
  it("should retrieve the product details page", async () => {
    const result = await client.catalog.getProductDetailsPage("s1001524");

    expect(result).not.toBeNull();
    expect(result.layout.id).toBe("product-details-page-root");
  });
});

describe("Catalog - getProductDetails", () => {
  it("extracts details for a product without brand", async () => {
    const details = await client.catalog.getProductDetails("s1001504");

    expect(details).toMatchObject({
      id: "s1001504",
      name: "Rode paprika",
      brand: null,
      unitQuantity: "1 stuk",
    });
  });

  it("extracts details for a product with brand", async () => {
    const details = await client.catalog.getProductDetails("s1139960");

    expect(details).toMatchObject({
      id: "s1139960",
      name: "Witte vrije uitloop eieren",
      brand: "Picnic",
      unitQuantity: "6 stuks",
    });
  });

  it("extracts details for a product with a label before texts", async () => {
    const details = await client.catalog.getProductDetails("s1009498");

    expect(details).toMatchObject({
      id: "s1009498",
      name: "Spinazie gewassen",
      brand: "Picnic",
      unitQuantity: "200 gram",
    });
  });

  it("extracts price tiers, a size badge and a computed unit price", async () => {
    const details = await client.catalog.getProductDetails("s1004201");

    expect(details).toMatchObject({ name: "Halfvolle melk", unitQuantity: "1.5 liter", quantityBadges: [{ text: "XL" }] });
    expect(details.unitPrice).toMatch(/^€\d+\.\d{2}\/l$/);
    expect(details.priceRanges?.length).toBeGreaterThan(1);
    expect(details.displayPrice).toBe(details.priceRanges?.[0].price);
  });

  it("throws a ProductNotFoundError for an unknown product", async () => {
    await expect(client.catalog.getProductDetails("s0000001")).rejects.toThrow(PicnicClient.ProductNotFoundError);
  });
});
