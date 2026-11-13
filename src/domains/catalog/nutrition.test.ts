import { nutritionAmount, nutritionPreference, readNutritionRows } from "./nutrition";

describe("nutritionAmount", () => {
  it.each([
    ["206 kJ /", 206],
    ["4,8g", 4.8],
    ["<0,5 g", 0.5],
    ["1.5 g", 1.5],
    ["sporen", null],
    [null, null],
  ])("reads %j", (value, expected) => {
    expect(nutritionAmount(value)).toBe(expected);
  });
});

describe("nutritionPreference", () => {
  it.each([
    ["Energie", "lower"],
    ["waarvan suikers", "lower"],
    ["waarvan verzadigd", "lower"],
    ["Matières grasses", "lower"],
    ["Salz", "lower"],
    ["Eiwitten", "higher"],
    ["Ballaststoffe", "higher"],
    ["Fibres alimentaires", "higher"],
    ["Koolhydraten", null],
    ["waarvan enkelvoudig onverzadigd", null],
    ["davon mehrfach ungesättigte Fettsäuren", null],
    ["dont acides gras insaturés", null],
  ])("knows %j", (label, expected) => {
    expect(nutritionPreference(label)).toBe(expected);
  });
});

describe("readNutritionRows", () => {
  it("adds the amount and preference, and neither to headings", () => {
    expect(
      readNutritionRows([
        { label: "Per 100 g", value: null, isCategory: true, backgroundColor: null },
        { label: "Vet", value: "1,5g", isCategory: true, backgroundColor: "#eee" },
      ]),
    ).toEqual([
      { label: "Per 100 g", value: null, isCategory: true, backgroundColor: null, amount: null, preference: null },
      { label: "Vet", value: "1,5g", isCategory: true, backgroundColor: "#eee", amount: 1.5, preference: "lower" },
    ]);
  });
});
