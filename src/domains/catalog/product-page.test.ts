import { extractProductPage } from "./product-page";
import { fusionTile } from "./tiles.fixtures";

const header = (id: string, title: string) => ({ type: "PML", id, pml: { component: { type: "RICH_TEXT", markdown: `#(#333333)${title}#(#333333)` } } });
const row = (id: string, children: unknown[]) => ({ type: "BLOCK", id: `core-horizontal-selling-unit-section-localized-${id}`, children });

describe("extractProductPage", () => {
  it("reads the title and the rows, each product once", () => {
    const page = {
      id: "theme-page",
      layout: { header: { title: "Samen tegen verspilling" } },
      body: {
        type: "BLOCK",
        children: [
          row("1", [
            header("horizontal-selling-unit-tiles-sub-header-pml-1", "Nieuw"),
            fusionTile({ id: "s1", name: "Appels", unitQuantity: "1 kilo", price: 299 }),
            fusionTile({ id: "s2", name: "Peren" }),
          ]),
          row("2", [fusionTile({ id: "s2", name: "Peren" }), fusionTile({ id: "s3", name: "Kiwi" })]),
          row("3", [fusionTile({ id: "s1", name: "Appels" })]),
        ],
      },
    };

    const result = extractProductPage(page);
    expect(result.title).toBe("Samen tegen verspilling");
    expect(result.sections.map((s) => [s.title, s.products.map((p) => p.id)])).toEqual([
      ["Nieuw", ["s1", "s2"]],
      [null, ["s3"]],
    ]);
    expect(result.sections[0].products[0].comparisonPrice).toEqual({ unit: "kg", price: 299, lowestPrice: null });
  });

  it("puts all tiles in one section when the page has no rows", () => {
    const page = { header: { title: "Wijnwinkel" }, body: { type: "BLOCK", children: [fusionTile({ id: "s1", name: "Rode wijn" })] } };
    expect(extractProductPage(page)).toEqual({ title: "Wijnwinkel", sections: [{ title: null, products: [expect.objectContaining({ id: "s1" })] }] });
    expect(extractProductPage({})).toEqual({ title: null, sections: [] });
  });
});
