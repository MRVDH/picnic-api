import type { PmlNutritionRow } from "../../pages/pml";
import { parseAmount } from "./comparison-price";
import type { NutritionPreference, NutritionRow } from "./types";

/**
 * Unsaturated fats: no better direction, and their labels contain the words for saturated fat
 * ("onverzadigd" has "verzadigd"), so they are checked before the other lists.
 */
const NEITHER = ["onverzadigd", "ungesättigt", "insaturé", "unsaturated"];
/**
 * Words in nutrient labels (Dutch, German, French and English) where more is the healthier choice. They are
 * checked first, so "Eiwitten" isn't read as anything else.
 */
const HIGHER_IS_BETTER = ["eiwit", "eiweiß", "eiweiss", "protéine", "protein", "vezel", "ballaststoff", "fibre", "fiber"];
/** Words in nutrient labels where less is the healthier choice. Carbohydrates are in no list. */
const LOWER_IS_BETTER = [
  "energie",
  "énergie",
  "énergétique",
  "brennwert",
  "energy",
  "kcal",
  "kj",
  "vet",
  "fett",
  "graisse",
  "matières grasses",
  "fat",
  "verzadigd",
  "gesättigt",
  "saturé",
  "saturated",
  "suiker",
  "zucker",
  "sucre",
  "sugar",
  "zout",
  "salz",
  "sel",
  "salt",
];

/** Whether less or more of a nutrient is the healthier choice, by its label, or `null` when neither is. */
export function nutritionPreference(label: string): NutritionPreference | null {
  const text = label.toLowerCase();
  if (NEITHER.some((word) => text.includes(word))) return null;
  if (HIGHER_IS_BETTER.some((word) => text.includes(word))) return "higher";
  if (LOWER_IS_BETTER.some((word) => text.includes(word))) return "lower";
  return null;
}

/** The first number in a nutrition value: "206 kJ /" is 206, "4,8g" is 4.8, "<0,5 g" is 0.5, "1.139 kJ" is 1139. */
export function nutritionAmount(value: string | null): number | null {
  const match = value ? /\d+(?:[.,]\d+)*/.exec(value) : null;
  return match ? parseAmount(match[0]) : null;
}

/** Adds the amount and the preference to the rows of a nutrition table. Heading rows ("Per 100 g") get neither. */
export function readNutritionRows(rows: PmlNutritionRow[]): NutritionRow[] {
  return rows.map((row) => ({
    ...row,
    amount: nutritionAmount(row.value),
    preference: row.value === null ? null : nutritionPreference(row.label),
  }));
}
