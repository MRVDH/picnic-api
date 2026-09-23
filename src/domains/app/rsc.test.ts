import { parseRscPayload } from "./rsc";

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
