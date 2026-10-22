import type { RscNode, RscPageContent } from "../../pages/types";
import { readSellableTile } from "../catalog/search";
import type { CartReplacements } from "./types";

/** The page component that holds the unavailable product and its alternatives. */
const CONTENT_COMPONENT = "unavailability-replacements-content";

/**
 * Extracts the replacements from the `unavailability-replacements-page-root` page content. The
 * content component holds the reason and the alternatives as sellable tiles without a `type`.
 * @param {RscPageContent} content The content of the replacements page.
 * @param {string} productId The product that can't be delivered.
 */
export function extractCartReplacements(content: RscPageContent, productId: string): CartReplacements {
  const props = findNode(content.nodes, CONTENT_COMPONENT)?.props ?? {};
  const alternatives = Array.isArray(props.alternativeViewModels) ? props.alternativeViewModels : [];
  return {
    productId,
    reason: typeof props.reason === "string" && props.reason !== "" ? props.reason : null,
    replacements: alternatives.flatMap((tile) => {
      const product = typeof tile === "object" && tile !== null ? readSellableTile(tile as Record<string, unknown>) : null;
      return product ? [product] : [];
    }),
  };
}

function findNode(nodes: RscNode[], component: string): RscNode | null {
  for (const node of nodes) {
    if (node.component === component) return node;
    const found = findNode(node.children, component);
    if (found) return found;
  }
  return null;
}
