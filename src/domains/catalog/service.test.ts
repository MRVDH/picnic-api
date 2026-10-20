import HttpClient from "../../http-client";
import { CatalogService } from "./service";
import type { RscPageClient } from "../app/rsc-client";
import { parseRscPayload } from "../app/rsc";

/** An RscPageClient stand-in that serves a search page and an empty action result. */
function fakeRsc() {
  const searchPage = parseRscPayload(
    [
      '1:I["./pages/search/search-page-params/search-page-params-provider.tsx",["c"],"P"]',
      '0:["$","$L1",null,{"params":{"searchId":"id-1","searchSessionId":"session-1","searchTerm":"pasta"}}]',
    ].join("\n"),
  );
  return {
    getPage: jest.fn().mockResolvedValue({ ...searchPage, version: "v1" }),
    findServerActionId: jest.fn().mockResolvedValue("act_fetchSearchResults_1"),
    runServerAction: jest.fn().mockResolvedValue(parseRscPayload('0:["$","$L2",null,{"searchQuery":"pasta","storeResults":{}}]')),
  };
}

describe("CatalogService.getSearchResults", () => {
  it("opens the search page and runs the action with the page's search parameters", async () => {
    const rsc = fakeRsc();
    const catalog = new CatalogService(new HttpClient(), rsc as unknown as RscPageClient);

    const results = await catalog.getSearchResults("pasta");

    expect(rsc.getPage).toHaveBeenCalledWith("search-page-results?search_term=pasta");
    expect(rsc.runServerAction).toHaveBeenCalledWith(
      "act_fetchSearchResults_1",
      [expect.objectContaining({ searchId: "id-1", searchSessionId: "session-1", searchQuery: "pasta", requestedSorting: "RELEVANCE" })],
      "v1",
    );
    expect(results.query).toBe("pasta");
  });

  it("sends the cookbook's page parameters for the MEALS context", async () => {
    const rsc = fakeRsc();
    const catalog = new CatalogService(new HttpClient(), rsc as unknown as RscPageClient);

    await catalog.getSearchResults("pasta", { context: "MEALS", sorting: "PRICE" });

    expect(rsc.getPage).toHaveBeenCalledWith("search-page-results?search_term=pasta&page_context=MEALS&is_recipe=true");
    expect(rsc.runServerAction.mock.calls[0][1][0].requestedSorting).toBe("PRICE");
  });
});
