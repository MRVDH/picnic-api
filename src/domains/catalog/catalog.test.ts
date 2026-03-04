import PicnicClient from "../..";

let client: PicnicClient;

beforeAll(() => {
  client = new PicnicClient({ authKey: process.env.PICNIC_AUTH_KEY });
});

describe("Catalog - search", () => {
  it("should return results for a search query", async () => {
    const results = await client.catalog.search("Affligem blond");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toContain("s1");
    expect(results[0].name).toContain("Affligem blond");
  });
});

describe("Catalog - product details page", () => {
  it("should retrieve the product details page", async () => {
    const result = await client.catalog.getProductDetailsPage("s1001524");

    expect(result).not.toBeNull();
    expect(result.id).toBe("product-details-page-root");
  });
});
