import PicnicClient from "../..";

let client: PicnicClient;

beforeAll(() => {
  client = new PicnicClient({ authKey: process.env.PICNIC_AUTH_KEY });
});

describe("Recipe - getRecipe", () => {
  it("extracts the steps, nutrition and ingredients with prices of a catalog recipe", async () => {
    // Catalog recipes change over time, so take one from the search results.
    const { recipes } = await client.catalog.getSearchResults("pasta");
    const details = await client.recipe.getRecipe(recipes[0].id, 2);

    expect(details.portions).toBe(2);
    expect(details.steps.length).toBeGreaterThan(0);
    expect(details.cookingTimeMinutes).toBeGreaterThan(0);
    expect(details.nutritionRows.some((row) => row.isCategory)).toBe(true);
    const core = details.ingredients.filter((ingredient) => ingredient.type === "CORE");
    expect(core.length).toBeGreaterThan(0);
    for (const ingredient of core) {
      expect(ingredient.name).toBeTruthy();
      expect(ingredient.price).toBeGreaterThan(0);
    }
  });
});
