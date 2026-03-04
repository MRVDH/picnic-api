import { JSONPath } from "jsonpath-plus";
import { BundleItem, ProductDetails, ProductPromotion, SimilarProduct } from "./types";
import { FusionPage } from "../../types/fusion";

/** Strip Picnic color markup like `#(#B40117)` from text. */
export const stripColorMarkup = (text: string): string => text.replace(/#\([A-Za-z0-9#_]+\)/g, "").trim();

/** Strip bold/italic markdown formatting (`**`, `__`) from text. */
export const stripMarkdownFormatting = (text: string): string => text.replace(/\*\*/g, "").replace(/__/g, "");

/** Recursively find a node by its `id` field anywhere in the tree. */
export const findById = (node: any, id: string): any => {
  if (!node) return null;
  if (node.id === id) return node;
  for (const key of ["child", "children"]) {
    if (Array.isArray(node[key])) {
      for (const child of node[key]) {
        const result = findById(child, id);
        if (result) return result;
      }
    } else if (node[key] && typeof node[key] === "object") {
      const result = findById(node[key], id);
      if (result) return result;
    }
  }
  return null;
};

/** Extract all string markdown values from a node. */
export const extractMarkdowns = (node: any): string[] => {
  if (!node) return [];
  return JSONPath({ path: "$..markdown", json: node }).filter((m: any) => typeof m === "string");
};

/**
 * Extracts structured product details from a Fusion product details page response.
 * @param {string} productId The product ID that was requested.
 * @param {FusionPage} page The raw Fusion page response.
 */
export function extractProductDetails(productId: string, page: FusionPage): ProductDetails {
  // ── Name, brand, unit quantity, unit price ──
  const mainContainer = findById(page.body, `product-details-page-root-main-container`);
  const mainTexts = extractMarkdowns(mainContainer).map(stripColorMarkup);
  const name = mainTexts[0] ?? "";
  const brand = mainTexts[1] ?? "";
  const unitQuantity = mainTexts[2] ?? "";
  const unitPrice = mainTexts[3] || null;

  // ── Price & max count ──
  const allSellingUnits: any[] = JSONPath({ path: "$..sellingUnit", json: page });
  const mainUnit = allSellingUnits.find((u: any) => u.id === productId && u.max_count !== undefined) ?? {};

  // For bundle products the selling unit carries `display_price`. For non-bundle
  // products the price is rendered as a PRICE component inside the main container.
  let displayPrice: number = mainUnit.display_price ?? 0;
  if (!displayPrice) {
    const bundleNode = findById(page.body, productId);
    if (bundleNode) {
      displayPrice = JSONPath({ path: "$..price", json: bundleNode })[0] ?? 0;
    }
  }
  if (!displayPrice && mainContainer) {
    const priceComponents: number[] = JSONPath({ path: "$..price", json: mainContainer })
      .filter((p: any) => typeof p === "number");
    displayPrice = priceComponents[0] ?? 0;
  }
  const maxCount: number = mainUnit.max_count ?? 0;

  // ── Gallery images ──
  const gallery = findById(page.body, "product-page-image-gallery-main-image-container");
  const imageIds: string[] = gallery
    ? [...new Set<string>(JSONPath({ path: "$..source.id", json: gallery }))]
    : mainUnit.image_id ? [mainUnit.image_id] : [];

  // ── Description ──
  const descBlock = findById(page.body, "description");
  const descMarkdowns = extractMarkdowns(descBlock);
  const description = descMarkdowns.length > 0 ? descMarkdowns.join("\n") : null;

  // ── Highlights ──
  const highlightsBlock = findById(page.body, "product-page-highlights");
  const highlights = extractMarkdowns(highlightsBlock).map((h) => stripMarkdownFormatting(stripColorMarkup(h)));

  // ── Allergens ──
  const allergiesBlock = findById(page.body, "product-page-allergies");
  const allergenTexts = extractMarkdowns(allergiesBlock).map(stripColorMarkup);
  // Allergen list starts with a heading like "Bevat" and may include a separator
  // like "Bevat mogelijk" partway through. Drop the heading(s) and keep individual allergens.
  const allergens = allergenTexts.filter(
    (t) => !/^bevat(\s+mogelijk)?$/i.test(t.trim()),
  );

  // ── Info sections (accordion) ──
  const accordionBlock = findById(page.body, "accordion-list");
  const infoSections: ProductDetails["infoSections"] = [];
  if (accordionBlock) {
    const items = JSONPath({ path: "$..items", json: accordionBlock })[0];
    if (Array.isArray(items)) {
      for (const item of items) {
        const headerTexts = extractMarkdowns(item.header).map(stripMarkdownFormatting).map(stripColorMarkup);
        const bodyTexts = extractMarkdowns(item.body).map(stripColorMarkup);
        infoSections.push({
          title: headerTexts[0] ?? "",
          content: bodyTexts.join("\n"),
        });
      }
    }
  }

  // ── Promotion ──
  let promotion: ProductPromotion | null = null;
  const promoData: any[] = JSONPath({ path: "$..promotion_id", json: page });
  const promoLabels: any[] = JSONPath({ path: "$..promotion_label", json: page });
  if (promoData.length > 0 && promoLabels.length > 0) {
    promotion = {
      id: promoData[0],
      label: promoLabels[0],
    };
  }

  // ── Bundles ──
  const bundles: BundleItem[] = [];
  const bundleContainer = findBundleContainer(page.body);

  if (bundleContainer) {
    // Each bundle item is wrapped in a STATE_BOUNDARY with id matching the selling unit id
    const bundleItemNodes: any[] = [];
    const walkBundleItems = (node: any) => {
      if (!node) return;
      if (typeof node === "object" && !Array.isArray(node)) {
        if (node.type === "STATE_BOUNDARY" && typeof node.id === "string" && node.id.startsWith("s")) {
          bundleItemNodes.push(node);
        }
        for (const v of Object.values(node)) walkBundleItems(v);
      } else if (Array.isArray(node)) {
        for (const item of node) walkBundleItems(item);
      }
    };
    walkBundleItems(bundleContainer);

    for (let i = 0; i < bundleItemNodes.length; i++) {
      const bNode = bundleItemNodes[i];
      const sellingUnits: any[] = JSONPath({ path: "$..sellingUnit", json: bNode });
      const prices: number[] = JSONPath({ path: "$..price", json: bNode }).filter((p: any) => typeof p === "number");
      const su = sellingUnits[0];
      if (su) {
        bundles.push({
          id: su.id,
          quantity: i + 1,
          pricePerUnit: prices[0] ?? 0,
          imageId: su.image_id ?? "",
          maxCount: su.max_count ?? 0,
        });
      }
    }
  }

  // ── Similar products ──
  const altContainer = findById(page.body, "alternatives-container");
  const altSellingUnits: any[] = altContainer ? JSONPath({ path: "$..sellingUnit", json: altContainer }) : [];
  const similarProducts: SimilarProduct[] = altSellingUnits
    .filter((u: any) => u.display_price !== undefined)
    .map((u: any) => ({
      id: u.id,
      name: u.name,
      imageId: u.image_id,
      displayPrice: u.display_price,
      unitQuantity: u.unit_quantity,
      maxCount: u.max_count,
      ...(u.deposit !== undefined ? { deposit: u.deposit } : {}),
    }));

  return {
    id: productId,
    name,
    brand,
    unitQuantity,
    unitPrice,
    displayPrice,
    maxCount,
    imageIds,
    description,
    highlights,
    allergens,
    infoSections,
    promotion,
    bundles,
    similarProducts,
  };
}

/** Walk the Fusion tree to find the `product-page-bundles-*` container node. */
function findBundleContainer(body: any): any {
  const walk = (n: any): any => {
    if (!n) return null;
    if (typeof n === "object" && !Array.isArray(n)) {
      if (typeof n.id === "string" && n.id.startsWith("product-page-bundles-")) return n;
      for (const v of Object.values(n)) {
        const result = walk(v);
        if (result) return result;
      }
    } else if (Array.isArray(n)) {
      for (const item of n) {
        const result = walk(item);
        if (result) return result;
      }
    }
    return null;
  };
  return walk(body);
}
