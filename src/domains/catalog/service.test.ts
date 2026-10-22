import HttpClient from "../../http-client";
import { CatalogService } from "./service";
import type { PageClient } from "../../pages/page-client";
import { parseRscPayload } from "../../pages/rsc";

/** A PageClient stand-in that serves a search page and an empty action result. */
function fakeRsc() {
  const searchPage = parseRscPayload(
    [
      '1:I["./pages/search/search-page-params/search-page-params-provider.tsx",["c"],"P"]',
      '0:["$","$L1",null,{"params":{"searchId":"id-1","searchSessionId":"session-1","searchTerm":"pasta"}}]',
    ].join("\n"),
  );
  return {
    getRscPayload: jest.fn().mockResolvedValue({ ...searchPage, version: "v1" }),
    findServerActionId: jest.fn().mockResolvedValue("act_fetchSearchResults_1"),
    runServerAction: jest.fn().mockResolvedValue(parseRscPayload('0:["$","$L2",null,{"searchQuery":"pasta","storeResults":{}}]')),
  };
}

describe("CatalogService.getSearchResults", () => {
  it("opens the search page and runs the action with the page's search parameters", async () => {
    const rsc = fakeRsc();
    const catalog = new CatalogService(new HttpClient(), rsc as unknown as PageClient);

    const results = await catalog.getSearchResults("pasta");

    expect(rsc.getRscPayload).toHaveBeenCalledWith("search-page-results?search_term=pasta");
    expect(rsc.runServerAction).toHaveBeenCalledWith(
      "act_fetchSearchResults_1",
      [expect.objectContaining({ searchId: "id-1", searchSessionId: "session-1", searchQuery: "pasta", requestedSorting: "RELEVANCE" })],
      "v1",
    );
    expect(results.query).toBe("pasta");
  });

  it("sends the cookbook's page parameters for the MEALS context", async () => {
    const rsc = fakeRsc();
    const catalog = new CatalogService(new HttpClient(), rsc as unknown as PageClient);

    await catalog.getSearchResults("pasta", { context: "MEALS", sorting: "PRICE" });

    expect(rsc.getRscPayload).toHaveBeenCalledWith("search-page-results?search_term=pasta&page_context=MEALS&is_recipe=true");
    expect(rsc.runServerAction.mock.calls[0][1][0].requestedSorting).toBe("PRICE");
  });
});

describe("CatalogService.getImageUrl", () => {
  it("builds the static image URL of the country, medium by default", () => {
    const catalog = new CatalogService(new HttpClient({ countryCode: "DE" }), {} as PageClient);

    expect(catalog.getImageUrl("abc123")).toBe("https://storefront-prod.de.picnicinternational.com/static/images/abc123/medium.png");
    expect(catalog.getImageUrl("abc123", "small")).toBe("https://storefront-prod.de.picnicinternational.com/static/images/abc123/small.png");
  });
});
