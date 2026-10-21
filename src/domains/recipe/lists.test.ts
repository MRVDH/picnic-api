import { extractRecipeCategory, extractRecipeCategoryGroup, extractRecipeOverview, extractRecipeTiles, parseMinutes } from "./lists";
import type { FusionPage } from "../../pages/fusion";
import type { RscPageContent } from "../../pages/types";

const schema = (name: string) => `iglu:tech.picnic.snowplow.analytics/${name}/jsonschema/1-0-0`;
const text = (markdown: string, extra: Record<string, unknown> = {}) => ({ type: "RICH_TEXT", markdown, ...extra });

/** A recipe tile the way the cookbook home and the saved recipes page show it. */
const tile = (id: string, name: string, contexts: unknown[] = []) => ({
  type: "PML",
  id: `selling-group-tile-component-${id}`,
  analytics: { contexts: [{ schema: schema("recipe"), data: { recipe_id: id, recipe_name: name } }, ...contexts] },
  pml: {
    component: {
      type: "STACK",
      children: [
        { type: "REFERENCE_CONTAINER", child: { type: "IMAGE", source: { id: `recipes/${id}` } } },
        text("Vegetarisch"),
        { type: "CONTAINER", isHidden: { type: "EXPRESSION" }, child: text("Niet alles op voorraad") },
        { type: "RICH_TEXT", markdown: "", children: [text(`${name} `), text(">")] },
        text("met paratha", { textType: "SUBTITLE2" }),
        text("#(#787570)15 + 25 min#(#787570)"),
        text("#(#787570)Vegan#(#787570)"),
      ],
    },
  },
});

describe("recipe lists", () => {
  it.each([
    ["20 min", 20],
    ["15 + 25 min", 40],
    ["1 uur 10 min", 70],
    ["Vegan", null],
  ])("parses the time %s", (value, minutes) => {
    expect(parseMinutes(value)).toBe(minutes);
  });

  it("reads the name, subtitle, tags and image of a tile, each recipe once", () => {
    const page = { layout: { body: { children: [tile("a", "Snelle groentecurry"), tile("a", "Snelle groentecurry")] } } };
    expect(extractRecipeTiles(page)).toEqual([
      {
        id: "a",
        name: "Snelle groentecurry",
        imageType: null,
        imageId: "recipes/a",
        subtitle: "met paratha",
        tags: ["15 + 25 min", "Vegan"],
        cookingTimeMinutes: 40,
      },
    ]);
  });

  it("finds the name by its text type when the tile shows another name than its analytics", () => {
    const shown = JSON.parse(
      JSON.stringify(tile("c", "Curry"))
        .replace('"recipe_name":"Curry"', '"recipe_name":"Curry (analytics)"')
        .replace('"markdown":"Curry "', '"markdown":"Curry ","textType":"SUBTITLE1"')
    );
    expect(extractRecipeTiles({ children: [shown] })).toMatchObject([
      { name: "Curry (analytics)", subtitle: "met paratha", tags: ["15 + 25 min", "Vegan"] },
    ]);
  });

  it("groups the cookbook home into recipe rows and category sections", () => {
    const aisle = (rank: number, name: string, pill: string) => ({ schema: schema("aisle"), data: { aisle_ranking: rank, assortment_aisle: name, pill_display_name: pill } });
    const category = (heading: string, name: string, deeplink: string) => ({
      type: "PML",
      analytics: { contexts: [{ schema: schema("pml_component"), data: { deeplink } }, { schema: schema("page_section"), data: { name: heading } }] },
      pml: { component: { type: "TOUCHABLE", accessibilityLabel: name, child: { type: "IMAGE", source: { id: `image-${name}` } } } },
    });
    const page = {
      layout: {
        body: {
          children: [
            tile("b", "Pasta", [aisle(2, "Uitgelicht deze week", "Voor jou")]),
            tile("a", "Curry", [aisle(1, "Favorieten", "Opnieuw bestellen")]),
            category("Vaak gezocht", "Onder de 20 minuten", "app.picnic://store/page;id=meals-category-page,category_id=c1"),
            category("Vaak gezocht", "Kids", "app.picnic://store/page;id=meals-category-group-page,group_name=Gnocchi%20%26%20orzo"),
          ],
        },
      },
    } as unknown as FusionPage;

    const overview = extractRecipeOverview(page);
    expect(overview.sections.map((s) => [s.title, s.pill, s.recipes.map((r) => r.id)])).toEqual([
      ["Favorieten", "Opnieuw bestellen", ["a"]],
      ["Uitgelicht deze week", "Voor jou", ["b"]],
    ]);
    expect(overview.categorySections).toEqual([
      {
        title: "Vaak gezocht",
        categories: [
          { type: "category", id: "c1", name: "Onder de 20 minuten", imageId: "image-Onder de 20 minuten" },
          { type: "group", id: "Gnocchi & orzo", name: "Kids", imageId: "image-Kids" },
        ],
      },
    ]);
  });

  it("reads a category page and a category group page", () => {
    const node = (component: string, props: Record<string, unknown>) => ({ id: `${component}-0`, component, modulePath: `./${component}.tsx`, props, children: [] });
    const category = {
      pageId: "meals-category-page?category_id=c1",
      tokens: {},
      nodes: [
        node("page-header", { title: "Onder de 20 minuten" }),
        node("vertical-list", {
          items: [
            { id: "r1", sellableType: "SELLING_GROUP", image: { imageId: "recipes/r1" }, text: { title: { text: "Pokébowl" }, tags: [{ text: "20 min" }, { text: "Vegan" }] } },
            { id: "p1", sellableType: "SELLING_UNIT" },
          ],
        }),
      ],
    } as unknown as RscPageContent;
    expect(extractRecipeCategory("c1", category)).toEqual({
      id: "c1",
      title: "Onder de 20 minuten",
      recipes: [{ id: "r1", name: "Pokébowl", imageType: null, imageId: "recipes/r1", subtitle: null, tags: ["20 min", "Vegan"], cookingTimeMinutes: 20 }],
    });

    const group = {
      pageId: "meals-category-group-page?group_name=Kids",
      tokens: {},
      nodes: [node("category-list", { title: "Kids", items: [{ deeplink: "app.picnic://store/page;id=meals-category-page,category_id=c2", title: "Lunchbox", image: "image-2" }] })],
    } as unknown as RscPageContent;
    expect(extractRecipeCategoryGroup("Kids", group)).toEqual({
      name: "Kids",
      title: "Kids",
      categories: [{ type: "category", id: "c2", name: "Lunchbox", imageId: "image-2" }],
    });
  });
});
