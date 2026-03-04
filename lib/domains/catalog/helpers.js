"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMarkdowns = exports.findById = exports.stripMarkdownFormatting = exports.stripColorMarkup = void 0;
exports.extractProductDetails = extractProductDetails;
const jsonpath_plus_1 = require("jsonpath-plus");
/** Strip Picnic color markup like `#(#B40117)` from text. */
const stripColorMarkup = (text) => text.replace(/#\([A-Za-z0-9#_]+\)/g, "").trim();
exports.stripColorMarkup = stripColorMarkup;
/** Strip bold/italic markdown formatting (`**`, `__`) from text. */
const stripMarkdownFormatting = (text) => text.replace(/\*\*/g, "").replace(/__/g, "");
exports.stripMarkdownFormatting = stripMarkdownFormatting;
/** Recursively find a node by its `id` field anywhere in the tree. */
const findById = (node, id) => {
    if (!node)
        return null;
    if (node.id === id)
        return node;
    for (const key of ["child", "children"]) {
        if (Array.isArray(node[key])) {
            for (const child of node[key]) {
                const result = (0, exports.findById)(child, id);
                if (result)
                    return result;
            }
        }
        else if (node[key] && typeof node[key] === "object") {
            const result = (0, exports.findById)(node[key], id);
            if (result)
                return result;
        }
    }
    return null;
};
exports.findById = findById;
/** Extract all string markdown values from a node. */
const extractMarkdowns = (node) => {
    if (!node)
        return [];
    return (0, jsonpath_plus_1.JSONPath)({ path: "$..markdown", json: node }).filter((m) => typeof m === "string");
};
exports.extractMarkdowns = extractMarkdowns;
/**
 * Extracts structured product details from a Fusion product details page response.
 * @param {string} productId The product ID that was requested.
 * @param {FusionPage} page The raw Fusion page response.
 */
function extractProductDetails(productId, page) {
    // ── Name, brand, unit quantity, unit price ──
    const mainContainer = (0, exports.findById)(page.body, `product-details-page-root-main-container`);
    const mainTexts = (0, exports.extractMarkdowns)(mainContainer).map(exports.stripColorMarkup);
    const name = mainTexts[0] ?? "";
    const brand = mainTexts[1] ?? "";
    const unitQuantity = mainTexts[2] ?? "";
    const unitPrice = mainTexts[3] || null;
    // ── Price & max count ──
    const allSellingUnits = (0, jsonpath_plus_1.JSONPath)({ path: "$..sellingUnit", json: page });
    const mainUnit = allSellingUnits.find((u) => u.id === productId && u.max_count !== undefined) ?? {};
    // For bundle products the selling unit carries `display_price`. For non-bundle
    // products the price is rendered as a PRICE component inside the main container.
    let displayPrice = mainUnit.display_price ?? 0;
    if (!displayPrice) {
        const bundleNode = (0, exports.findById)(page.body, productId);
        if (bundleNode) {
            displayPrice = (0, jsonpath_plus_1.JSONPath)({ path: "$..price", json: bundleNode })[0] ?? 0;
        }
    }
    if (!displayPrice && mainContainer) {
        const priceComponents = (0, jsonpath_plus_1.JSONPath)({ path: "$..price", json: mainContainer })
            .filter((p) => typeof p === "number");
        displayPrice = priceComponents[0] ?? 0;
    }
    const maxCount = mainUnit.max_count ?? 0;
    // ── Gallery images ──
    const gallery = (0, exports.findById)(page.body, "product-page-image-gallery-main-image-container");
    const imageIds = gallery
        ? [...new Set((0, jsonpath_plus_1.JSONPath)({ path: "$..source.id", json: gallery }))]
        : mainUnit.image_id ? [mainUnit.image_id] : [];
    // ── Description ──
    const descBlock = (0, exports.findById)(page.body, "description");
    const descMarkdowns = (0, exports.extractMarkdowns)(descBlock);
    const description = descMarkdowns.length > 0 ? descMarkdowns.join("\n") : null;
    // ── Highlights ──
    const highlightsBlock = (0, exports.findById)(page.body, "product-page-highlights");
    const highlights = (0, exports.extractMarkdowns)(highlightsBlock).map((h) => (0, exports.stripMarkdownFormatting)((0, exports.stripColorMarkup)(h)));
    // ── Allergens ──
    const allergiesBlock = (0, exports.findById)(page.body, "product-page-allergies");
    const allergenTexts = (0, exports.extractMarkdowns)(allergiesBlock).map(exports.stripColorMarkup);
    // Allergen list starts with a heading like "Bevat" and may include a separator
    // like "Bevat mogelijk" partway through. Drop the heading(s) and keep individual allergens.
    const allergens = allergenTexts.filter((t) => !/^bevat(\s+mogelijk)?$/i.test(t.trim()));
    // ── Info sections (accordion) ──
    const accordionBlock = (0, exports.findById)(page.body, "accordion-list");
    const infoSections = [];
    if (accordionBlock) {
        const items = (0, jsonpath_plus_1.JSONPath)({ path: "$..items", json: accordionBlock })[0];
        if (Array.isArray(items)) {
            for (const item of items) {
                const headerTexts = (0, exports.extractMarkdowns)(item.header).map(exports.stripMarkdownFormatting).map(exports.stripColorMarkup);
                const bodyTexts = (0, exports.extractMarkdowns)(item.body).map(exports.stripColorMarkup);
                infoSections.push({
                    title: headerTexts[0] ?? "",
                    content: bodyTexts.join("\n"),
                });
            }
        }
    }
    // ── Promotion ──
    let promotion = null;
    const promoData = (0, jsonpath_plus_1.JSONPath)({ path: "$..promotion_id", json: page });
    const promoLabels = (0, jsonpath_plus_1.JSONPath)({ path: "$..promotion_label", json: page });
    if (promoData.length > 0 && promoLabels.length > 0) {
        promotion = {
            id: promoData[0],
            label: promoLabels[0],
        };
    }
    // ── Bundles ──
    const bundles = [];
    const bundleContainer = findBundleContainer(page.body);
    if (bundleContainer) {
        // Each bundle item is wrapped in a STATE_BOUNDARY with id matching the selling unit id
        const bundleItemNodes = [];
        const walkBundleItems = (node) => {
            if (!node)
                return;
            if (typeof node === "object" && !Array.isArray(node)) {
                if (node.type === "STATE_BOUNDARY" && typeof node.id === "string" && node.id.startsWith("s")) {
                    bundleItemNodes.push(node);
                }
                for (const v of Object.values(node))
                    walkBundleItems(v);
            }
            else if (Array.isArray(node)) {
                for (const item of node)
                    walkBundleItems(item);
            }
        };
        walkBundleItems(bundleContainer);
        for (let i = 0; i < bundleItemNodes.length; i++) {
            const bNode = bundleItemNodes[i];
            const sellingUnits = (0, jsonpath_plus_1.JSONPath)({ path: "$..sellingUnit", json: bNode });
            const prices = (0, jsonpath_plus_1.JSONPath)({ path: "$..price", json: bNode }).filter((p) => typeof p === "number");
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
    const altContainer = (0, exports.findById)(page.body, "alternatives-container");
    const altSellingUnits = altContainer ? (0, jsonpath_plus_1.JSONPath)({ path: "$..sellingUnit", json: altContainer }) : [];
    const similarProducts = altSellingUnits
        .filter((u) => u.display_price !== undefined)
        .map((u) => ({
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
function findBundleContainer(body) {
    const walk = (n) => {
        if (!n)
            return null;
        if (typeof n === "object" && !Array.isArray(n)) {
            if (typeof n.id === "string" && n.id.startsWith("product-page-bundles-"))
                return n;
            for (const v of Object.values(n)) {
                const result = walk(v);
                if (result)
                    return result;
            }
        }
        else if (Array.isArray(n)) {
            for (const item of n) {
                const result = walk(item);
                if (result)
                    return result;
            }
        }
        return null;
    };
    return walk(body);
}
//# sourceMappingURL=helpers.js.map