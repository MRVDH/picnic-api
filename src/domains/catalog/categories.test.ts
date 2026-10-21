import { extractCategoryProducts, extractCategoryTree, extractSubcategories } from "./categories";
import type { RscPageContent } from "../app/types";

const node = (component: string, props: Record<string, unknown>, children: unknown[] = []) => ({ id: `${component}-0`, component, modulePath: `./${component}.tsx`, props, children });
const page = (pageId: string, nodes: unknown[]) => ({ pageId, tokens: {}, nodes }) as unknown as RscPageContent;
const row = (title: string, deeplink: string, extra: Record<string, unknown> = {}) => ({ type: "row-item", title, deeplink, image: `image-${title}`, ...extra });

describe("categories", () => {
  it("splits the category tree at its section titles and reads where each link goes", () => {
    const tree = page("category-tree-root", [
      node("vertical-list", {
        items: [
          row("Alle acties", "app.picnic://store/page;id=promo-page-root", { label: { title: "1200+ producten" } }),
          { type: "section-title", title: "Alle categorieën" },
          row("Fruit", "app.picnic://store/page;id=subcategory-page,category_id=21724"),
        ],
      }),
    ]);

    expect(extractCategoryTree(tree)).toEqual([
      { title: null, links: [{ name: "Alle acties", imageId: "image-Alle acties", label: "1200+ producten", deeplink: "app.picnic://store/page;id=promo-page-root", target: { type: "page" } }] },
      {
        title: "Alle categorieën",
        links: [{ name: "Fruit", imageId: "image-Fruit", label: null, deeplink: "app.picnic://store/page;id=subcategory-page,category_id=21724", target: { type: "subcategories", categoryId: "21724" } }],
      },
    ]);
  });

  it("reads the subcategories with the promotions link", () => {
    const subcategories = page("subcategory-page?category_id=21724", [
      node("category-list", {
        title: "Fruit",
        items: [
          row("Acties", "app.picnic://store/page;id=promotion-category-page,category_id=21724"),
          row("Sinaasappel & citrus", "app.picnic://store/page;id=category-product-overview,category_id=21746"),
        ],
      }),
    ]);

    expect(extractSubcategories("21724", subcategories)).toMatchObject({
      categoryId: "21724",
      title: "Fruit",
      links: [
        { name: "Acties", target: { type: "promotions", categoryId: "21724" } },
        { name: "Sinaasappel & citrus", target: { type: "products", categoryId: "21746" } },
      ],
    });
  });

  it("reads the product sections, filters and product ids per filter", () => {
    const tile = { id: "s1", name: "Mandarijnen", namePrefix: null, displayPrice: 224, imageId: "image-s1" };
    const overview = page("category-product-overview?category_id=21746", [
      node("page-header", { title: "Sinaasappel & citrus" }),
      node("context", { entityIdsByFacetId: { "category_level_3.21952": ["s1"] } }, [
        node("items", { sections: [{ id: "Mandarijn", type: "VISUAL", headerName: "Mandarijn", shouldShowHeader: true, items: [tile, { id: "promo-box" }] }] }, [
          node("filter-bar", { visualFilters: [{ facetId: "category_level_3.21952", name: "Mandarijn", image: "image-f" }], powerFilters: [], textualFilters: [] }),
        ]),
      ]),
    ]);

    expect(extractCategoryProducts("21746", overview)).toEqual({
      categoryId: "21746",
      title: "Sinaasappel & citrus",
      results: {
        sections: [{ id: "Mandarijn", type: "VISUAL", title: "Mandarijn", products: [tile] }],
        visualFilters: [{ facetId: "category_level_3.21952", name: "Mandarijn", imageId: "image-f" }],
        powerFilters: [],
        textualFilters: [],
        productIdsByFacetId: { "category_level_3.21952": ["s1"] },
        sortingOptions: [],
        selectedSorting: "RELEVANCE",
      },
    });
  });
});
