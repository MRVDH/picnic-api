import { getComparisonPrice, parsePackageSize } from "./comparison-price";

describe("parsePackageSize", () => {
  it.each([
    ["400 gram", { amount: 0.4, unit: "kg" }],
    ["1,5 kilo", { amount: 1.5, unit: "kg" }],
    ["1.5 liter", { amount: 1.5, unit: "l" }],
    ["500 ml", { amount: 0.5, unit: "l" }],
    ["10ml", { amount: 0.01, unit: "l" }],
    ["75 cl", { amount: 0.75, unit: "l" }],
    ["8 Liter", { amount: 8, unit: "l" }],
    ["6 x 330 ml", { amount: 1.98, unit: "l" }],
    ["4 x 1,5 liter, In prijs verlaagd", { amount: 6, unit: "l" }],
    ["6 x 300 ml • 7.5%, In prijs verlaagd", { amount: 1.8, unit: "l" }],
    ["2 x 100 gram", { amount: 0.2, unit: "kg" }],
    ["8 x 70 g, 6+ mnd", { amount: 0.56, unit: "kg" }],
    ["250 gram, 15+ mnd", { amount: 0.25, unit: "kg" }],
    ["ca. 150 gram", { amount: 0.15, unit: "kg" }],
    ["Doos (3 liter)", { amount: 3, unit: "l" }],
    ["6 stuks", { amount: 6, unit: "piece" }],
    ["1 stuk, 13 cm", { amount: 1, unit: "piece" }],
    ["10 stuks M/L", { amount: 10, unit: "piece" }],
    ["5 x 2 stuks", { amount: 10, unit: "piece" }],
    ["28 stuks, 2-5 kilo", { amount: 28, unit: "piece" }],
    ["Value pack, 34 stuks", { amount: 34, unit: "piece" }],
    ["Jumbo pack 40 stuks • 11-17 kilo", { amount: 40, unit: "piece" }],
    ["500 g", { amount: 0.5, unit: "kg" }],
    ["1,5 l", { amount: 1.5, unit: "l" }],
    ["6 x 0,33 l", { amount: 1.98, unit: "l" }],
    ["4 Stück", { amount: 4, unit: "piece" }],
    ["200 Gramm", { amount: 0.2, unit: "kg" }],
    ["6 x 33 cl", { amount: 1.98, unit: "l" }],
    ["4 pièces", { amount: 4, unit: "piece" }],
    ["1 kg", { amount: 1, unit: "kg" }],
  ])("reads %j", (text, expected) => {
    expect(parsePackageSize(text)).toEqual(expected);
  });

  it.each(["2-3 stuks", "2 of 3 stuks", "24 wasbeurten", "9 rollen", "4 = 8 rollen", "Citrus, mineralig", "Voor 4 porties", "13+ kilo", ""])("returns null for %j", (text) => {
    expect(parsePackageSize(text)).toBeNull();
  });
});

describe("getComparisonPrice", () => {
  it("divides the price by the package size", () => {
    expect(getComparisonPrice(599, "400 gram")).toEqual({ unit: "kg", price: 1498, lowestPrice: null });
    expect(getComparisonPrice(189, "1.5 liter")).toEqual({ unit: "l", price: 126, lowestPrice: null });
  });

  it("adds the price per unit at the cheapest price tier", () => {
    const tiers = [
      { price: 129, from_quantity: 1 },
      { price: 127, from_quantity: 2 },
      { price: 123, from_quantity: 4 },
    ];
    expect(getComparisonPrice(129, "1 liter", tiers)).toEqual({ unit: "l", price: 129, lowestPrice: { price: 123, fromQuantity: 4 } });
  });

  it("returns null without a usable size or price", () => {
    expect(getComparisonPrice(259, "9 rollen")).toBeNull();
    expect(getComparisonPrice(0, "500 gram")).toBeNull();
  });
});
