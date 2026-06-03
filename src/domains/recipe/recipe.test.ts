import { RecipeService } from "./service";
import HttpClient from "../../http-client";

const mockFetch = jest.fn();
global.fetch = mockFetch;

let recipe: RecipeService;

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true, body: {}, json: () => Promise.resolve({}) });
  recipe = new RecipeService(new HttpClient({ authKey: "initial-auth-key" }));
});

describe("RecipeService", () => {
  it("getRecipeDetailsPage uses the selling-group-details-page route (not the 404'ing recipe-details-page-root)", async () => {
    await recipe.getRecipeDetailsPage("0123456789abcdef01234567");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/pages/selling-group-details-page?selling_group_id=0123456789abcdef01234567",
      ),
      expect.objectContaining({ method: "GET" }),
    );
    const [url] = mockFetch.mock.calls[0];
    expect(url).not.toContain("recipe-details-page-root");
  });

  it("getCookbookPage requests the cookbook content page", async () => {
    await recipe.getCookbookPage();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/pages/cookbook-page-content"),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("getRecipesPage requests the meal-planner root", async () => {
    await recipe.getRecipesPage();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/pages/meals-page-root"),
      expect.objectContaining({ method: "GET" }),
    );
  });
});
