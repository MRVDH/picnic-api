import PicnicClient from "../..";

let client: PicnicClient;

beforeAll(() => {
  client = new PicnicClient({ authKey: process.env.PICNIC_AUTH_KEY });
});

describe("Recipe - lists", () => {
  it("reads the cookbook home, a category, a category group and the saved recipes", async () => {
    const overview = await client.recipe.getRecipeOverview();
    expect(overview.sections.some((section) => section.recipes.length > 0)).toBe(true);
    const links = overview.categorySections.flatMap((section) => section.categories);
    expect(links.length).toBeGreaterThan(0);

    const categoryLink = links.find((link) => link.type === "category")!;
    const category = await client.recipe.getRecipeCategory(categoryLink.id);
    expect(category.title).toBe(categoryLink.name);
    expect(category.recipes.length).toBeGreaterThan(0);
    expect(category.recipes[0].name).toBeTruthy();

    const groupLink = links.find((link) => link.type === "group");
    if (groupLink) {
      const group = await client.recipe.getRecipeCategoryGroup(groupLink.id);
      expect(group.categories.length).toBeGreaterThan(0);
    }

    expect(Array.isArray(await client.recipe.getSavedRecipes())).toBe(true);
  });
});

describe("Recipe - getRecipe", () => {
  it("extracts the steps, nutrition and ingredients with prices of a catalog recipe", async () => {
    // Catalog recipes change over time, so take one from the search results.
    const { recipes } = await client.catalog.getSearchResults("pasta");
    const details = await client.recipe.getRecipe(recipes[0].id, { portions: 2 });

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
