import type { PriceRange } from "../../pages/fusion";
import type { CheaperAlternative, ComparisonPrice, ComparisonUnit, PackageSize, Product } from "./types";

/**
 * The unit words Picnic uses in package sizes (Dutch, German, French and English), with the base unit and
 * the factor to it. Longer words come first so "kilo" doesn't match as "k".
 */
const UNITS: [string, ComparisonUnit, number][] = [
  ["kilogramm", "kg", 1],
  ["kilogram", "kg", 1],
  ["kilo", "kg", 1],
  ["kg", "kg", 1],
  ["gramm", "kg", 0.001],
  ["gram", "kg", 0.001],
  ["gr", "kg", 0.001],
  ["g", "kg", 0.001],
  ["milliliter", "l", 0.001],
  ["millilitre", "l", 0.001],
  ["liter", "l", 1],
  ["litre", "l", 1],
  ["ml", "l", 0.001],
  ["cl", "l", 0.01],
  ["l", "l", 1],
  ["stuks", "piece", 1],
  ["stuk", "piece", 1],
  ["stück", "piece", 1],
  ["stk", "piece", 1],
  ["st", "piece", 1],
  ["unités", "piece", 1],
  ["unité", "piece", 1],
  ["pièces", "piece", 1],
  ["pièce", "piece", 1],
  ["pieces", "piece", 1],
  ["piece", "piece", 1],
  ["pcs", "piece", 1],
];
const NUMBER = String.raw`\d+(?:[.,]\d+)*`;
const UNIT = UNITS.map(([word]) => word).join("|");
/** An optional multipack count, the amount and the unit word: "6 x 330 ml", "1,5 liter", "10ml". */
const SIZE = new RegExp(String.raw`(?:(\d+)\s*[x×]\s*)?(${NUMBER})\s*(${UNIT})(?![\p{L}])`, "iu");
/** A range of amounts, "2-3 stuks" or "6 of 7 stuks": no single size to divide by. */
const RANGE = new RegExp(String.raw`${NUMBER}\s*(?:-|–|of|oder|bis|ou|à)\s*${NUMBER}\s*(?:${UNIT})(?![\p{L}])`, "iu");

/**
 * Reads a number as Picnic writes it in NL, DE and FR: a comma or a dot before the decimals ("1,5", "1.5"), and a
 * dot between thousands ("1.139 kJ", "1.000 g"). A dot followed by exactly three digits after a non-zero whole
 * part is a thousands separator; "0.330" stays a decimal.
 * @param {string} text The number, e.g. "1,5" or "1.000".
 */
export function parseAmount(text: string): number {
  if (/^[1-9]\d{0,2}(?:\.\d{3})+$/.test(text)) return Number(text.replace(/\./g, ""));
  return Number(text.replace(",", "."));
}

/**
 * Reads a package size as Picnic shows it ("400 gram", "1,5 kilo", "6 x 330 ml • 6.6%", "10 stuks M/L") into
 * an amount of kilograms, litres or pieces. Notes after the size ("In prijs verlaagd", "12+ mnd") are ignored;
 * a size before the first comma or "•" wins over one after it ("28 stuks, 2-5 kilo" is 28 pieces). Returns
 * `null` for sizes in other units ("24 wasbeurten", "9 rollen"), ranges ("2-3 stuks") and texts without a size.
 * @param {string} unitQuantity The package size text of a product.
 */
export function parsePackageSize(unitQuantity: string): PackageSize | null {
  for (const part of unitQuantity.split(/,\s|•/)) {
    if (RANGE.test(part)) continue;
    const match = SIZE.exec(part);
    if (!match) continue;
    const [, count, amount, word] = match;
    const [, unit, factor] = UNITS.find(([w]) => w === word.toLowerCase())!;
    const total = (count ? Number(count) : 1) * parseAmount(amount) * factor;
    if (total > 0) return { amount: Math.round(total * 1e6) / 1e6, unit };
  }
  return null;
}

/**
 * The price per kilogram, litre or piece of a product, to compare products of different package sizes, the
 * way a shelf label does. The app only shows Picnic's own unit price on the product page and in the cart.
 * @param {number} price The price of one package in cents.
 * @param {string} unitQuantity The package size text.
 * @param {PriceRange[] | null} [priceRanges] The price tiers, when the price depends on the quantity.
 * @returns The comparison price, or `null` when the package size has no weight, volume or piece count.
 */
export function getComparisonPrice(price: number, unitQuantity: string, priceRanges?: PriceRange[] | null): ComparisonPrice | null {
  const size = parsePackageSize(unitQuantity);
  if (!size || price <= 0) return null;
  const perUnit = (cents: number) => Math.round(cents / size.amount);
  const cheapestTier = (priceRanges ?? []).filter((tier) => tier.price > 0 && tier.price < price).sort((a, b) => a.price - b.price)[0];
  return {
    unit: size.unit,
    price: perUnit(price),
    lowestPrice: cheapestTier ? { price: perUnit(cheapestTier.price), fromQuantity: cheapestTier.from_quantity } : null,
  };
}

/**
 * The similar products on a product's page that cost less per kilogram, litre or piece than the product, cheapest
 * per unit first. Products in another unit (pieces against kilograms) or without a package size are left out.
 * @param {Product} product The product, with its similar products.
 */
export function findCheaperAlternatives(product: Product): CheaperAlternative[] {
  const own = product.comparisonPrice;
  if (!own) return [];
  return product.similarProducts
    .flatMap((similar): CheaperAlternative[] => {
      const price = similar.comparisonPrice;
      if (!price || price.unit !== own.unit || price.price >= own.price || similar.id === product.id) return [];
      return [{ ...similar, comparisonPrice: price, savingPerUnit: own.price - price.price }];
    })
    .sort((a, b) => a.comparisonPrice.price - b.comparisonPrice.price);
}
