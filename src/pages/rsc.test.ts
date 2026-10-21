import { decodeRscValue, findRscElementProps, findRscModuleChunks, parseRscPageContent, parseRscPayload } from "./rsc";

describe("parseRscPayload", () => {
  it("splits JSON rows and module rows by row id", () => {
    const payload = [
      '0:{"_value":"$L1"}',
      '2:I["./components/page/page-hydrator.tsx",["chunk-a"],"PageHydrator"]',
      '1:["$","$L2",null,{"children":"$L7"}]',
      '7:["$","$L8",null,{"items":[{"title":"Alle acties"}],"name":"category-tree"}]',
    ].join("\n");

    const page = parseRscPayload(payload);

    expect(page.rows["0"]).toEqual({ _value: "$L1" });
    expect(page.rows["7"]).toEqual(["$", "$L8", null, { items: [{ title: "Alle acties" }], name: "category-tree" }]);
    expect(page.modules["2"]).toEqual(["./components/page/page-hydrator.tsx", ["chunk-a"], "PageHydrator"]);
    expect(page.rows["2"]).toBeUndefined();
  });

  it("skips rows that aren't JSON and lines that aren't rows", () => {
    const payload = ['a:HL["/style.css","style"]', "3:T5,hello", "not a row", "", '1f:{"ok":true}'].join("\n");

    const page = parseRscPayload(payload);

    expect(page.rows).toEqual({ "1f": { ok: true } });
    expect(page.modules).toEqual({});
  });
});

describe("decodeRscValue", () => {
  const page = parseRscPayload(
    [
      '0:["$","$L1",null,{"items":[{"id":"a","price":"$undefined"},"$0:props:items:0"],"text":"$$5 off","shared":"$2"}]',
      '1:I["./results.tsx",["chunk-a"],"Results"]',
      '2:{"name":"shared row"}',
    ].join("\n"),
  );

  it("resolves row and path references, $undefined and escaped dollars", () => {
    expect(decodeRscValue(page, page.rows["0"])).toEqual([
      "$",
      "$L1",
      null,
      { items: [{ id: "a" }, { id: "a" }], text: "$5 off", shared: { name: "shared row" } },
    ]);
  });

  it("finds element props and chunks by module path", () => {
    expect(findRscElementProps(page, "results.tsx")[0].shared).toEqual({ name: "shared row" });
    expect(findRscModuleChunks(page, "results.tsx")).toEqual(["chunk-a"]);
    expect(findRscModuleChunks(page, "other.tsx")).toEqual([]);
  });
});

describe("parseRscPageContent", () => {
  const page = parseRscPayload(
    [
      '0:{"_value":"$L1"}',
      '2:I["./presentational-components/page/page-hydrator.tsx",["c"],"PageHydrator"]',
      '3:I["./logical-components/sections/vertical-list/vertical-list.tsx",["c"],"VerticalList"]',
      '4:I["./pages/promotions/shared/promo-deep-dive-content.tsx",["c"],"PromoDeepDiveContent"]',
      '1:["$","$L2",null,{"theme":{"tokenRegistry":{"Action/primary":"#E1171E"},"legacyColors":{"YELLOW2":"#FBD92B"}},"children":"$L5"}]',
      '5:[["$","$L3",null,{"title":"Acties","items":[{"id":"row-1"}]}],["$","$L4",null,{"sellableTiles":[{"type":"sellable","id":"s1","title":{"title":"Salade"},"price":{"priceValue":2.5}}]}]]',
    ].join("\n"),
  );

  it("builds the component tree without wrappers and collects the theme tokens", () => {
    const content = parseRscPageContent("promo-group-deep-dive", page);

    expect(content.pageId).toBe("promo-group-deep-dive");
    expect(content.tokens).toEqual({ "Action/primary": "#E1171E", YELLOW2: "#FBD92B" });
    expect(content.nodes.map((node) => node.component)).toEqual(["vertical-list", "promo-deep-dive-content"]);
    expect(content.nodes[0]).toEqual({
      id: "vertical-list-0",
      component: "vertical-list",
      modulePath: "./logical-components/sections/vertical-list/vertical-list.tsx",
      props: { title: "Acties", items: [{ id: "row-1" }] },
      children: [],
    });
  });

  it("parses product tiles in props", () => {
    const tiles = parseRscPageContent("p", page).nodes[1].props.sellableTiles as Record<string, unknown>[];

    expect(tiles[0]).toMatchObject({ id: "s1", name: "Salade", displayPrice: 250 });
  });
});

describe("decodeRscValue references", () => {
  it("decodes a referenced row once and shares it", () => {
    const page = parseRscPayload(['0:{"a":"$1","b":"$1"}', '1:{"name":"shared"}'].join("\n"));

    const decoded = decodeRscValue(page, page.rows["0"]) as Record<string, unknown>;

    expect(decoded.a).toEqual({ name: "shared" });
    expect(decoded.a).toBe(decoded.b);
  });

  it("throws on a reference cycle", () => {
    const page = parseRscPayload(['0:{"next":"$1"}', '1:{"next":"$0"}'].join("\n"));

    expect(() => decodeRscValue(page, page.rows["0"])).toThrow("RSC reference cycle");
  });
});

describe("parseRscPageContent module paths", () => {
  it("returns the full module path of each node", () => {
    const page = parseRscPayload(['1:I["./pages/search/sellable-overview/components/items.tsx",["c"],"Items"]', '0:["$","$L1",null,{"sections":[]}]'].join("\n"));

    expect(parseRscPageContent("p", page).nodes[0]).toMatchObject({ component: "items", modulePath: "./pages/search/sellable-overview/components/items.tsx" });
  });
});
