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

describe("Catalog - getProduct", () => {
  it("extracts details for a product without brand", async () => {
    const details = await client.catalog.getProduct("s1001504");

    expect(details).toMatchObject({
      id: "s1001504",
      name: "Rode paprika",
      brand: null,
      unitQuantity: "1 stuk",
    });
  });

  it("extracts details for a product with brand", async () => {
    const details = await client.catalog.getProduct("s1139960");

    expect(details).toMatchObject({
      id: "s1139960",
      name: "Witte vrije uitloop eieren",
      brand: "Picnic",
      unitQuantity: "6 stuks",
    });
  });

  it("extracts details for a product with a label before texts", async () => {
    const details = await client.catalog.getProduct("s1009498");

    expect(details).toMatchObject({
      id: "s1009498",
      name: "Spinazie gewassen",
      brand: "Picnic",
      unitQuantity: "200 gram",
    });
  });

  it("extracts price tiers, a size badge and a computed unit price", async () => {
    const details = await client.catalog.getProduct("s1004201");

    expect(details).toMatchObject({ name: "Halfvolle melk", unitQuantity: "1.5 liter", quantityBadges: [{ text: "XL" }] });
    expect(details.unitPrice).toMatch(/^€\d+\.\d{2}\/l$/);
    expect(details.priceRanges?.length).toBeGreaterThan(1);
    expect(details.displayPrice).toBe(details.priceRanges?.[0].price);
  });

  it("throws a ProductNotFoundError for an unknown product", async () => {
    await expect(client.catalog.getProduct("s0000001")).rejects.toThrow(PicnicClient.ProductNotFoundError);
  });
});

describe("Catalog - categories", () => {
  it("follows the category tree down to the products of a subcategory", async () => {
    const tree = await client.catalog.getCategories();
    const category = tree.flatMap((section) => section.links).find((link) => link.target.type === "subcategories");
    expect(category).toBeDefined();
    if (category?.target.type !== "subcategories") return;

    const subcategories = await client.catalog.getSubcategories(category.target.categoryId);
    expect(subcategories.title).toBe(category.name);
    const subcategory = subcategories.links.find((link) => link.target.type === "products");
    if (subcategory?.target.type !== "products") throw new Error("No subcategory with products");

    const products = await client.catalog.getCategoryProducts(subcategory.target.categoryId);
    expect(products.title).toBe(subcategory.name);
    expect(products.results.sections.some((section) => section.products.length > 0)).toBe(true);
  });
});

describe("Catalog - promotions", () => {
  it("reads the promotions page and the products of a promotion group", async () => {
    const promotions = await client.catalog.getPromotions();
    expect(promotions.sections.length).toBeGreaterThan(0);
    expect(promotions.sections.every((section) => section.title !== "")).toBe(true);
    expect(promotions.sections.flatMap((section) => section.products).some((product) => product.labels.length > 0)).toBe(true);

    const group = promotions.sections.flatMap((section) => section.groups)[0];
    if (!group) throw new Error("No promotion groups");
    const products = await client.catalog.getPromotionGroup(group.id);
    expect(products.name).not.toBe("");
    expect(products.products.length).toBeGreaterThan(0);
  });
});

describe("Catalog - favorites", () => {
  it("reads the favorites per aisle and the full list of an aisle", async () => {
    const favorites = await client.catalog.getFavorites();
    expect(favorites.aisles.length).toBeGreaterThan(0);

    const aisle = favorites.aisles.find((candidate) => candidate.products.length > 0);
    if (!aisle) throw new Error("No aisle with products");
    const products = await client.catalog.getFavoritesInAisle(aisle.id);
    expect(products.length).toBeGreaterThanOrEqual(aisle.products.length);
  });
});
