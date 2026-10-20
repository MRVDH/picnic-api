import type { RscNode, RscPageContent } from "../app/types";
import type { Profile, ProfileAddress, ProfileMenuEntry } from "./types";

type RscRecord = Record<string, unknown>;

const asRecord = (value: unknown): RscRecord | null => (typeof value === "object" && value !== null && !Array.isArray(value) ? (value as RscRecord) : null);
const asString = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);

/**
 * Extracts the profile from the `profile-root` page content: the `user-info` component holds the
 * user and preferred address, the `menu-list` component the menu entries as `{ id, deeplink }`.
 * @param {RscPageContent} content The page content from `app.getRscPageContent("profile-root")`.
 */
export function extractProfile(content: RscPageContent): Profile {
  const user = asRecord(findNode(content.nodes, "user-info")?.props.user) ?? {};
  const items = findNode(content.nodes, "menu-list")?.props.items;
  const address = asRecord(user.preferredAddress);

  return {
    firstName: asString(user.firstName) ?? "",
    lastName: asString(user.lastName) ?? "",
    avatarUrl: asString(user.avatarUrl),
    hasMembership: user.hasMembership === true,
    address: address ? extractAddress(address) : null,
    menu: (Array.isArray(items) ? items : []).flatMap((item): ProfileMenuEntry[] => {
      const entry = asRecord(item);
      const id = asString(entry?.id);
      return id ? [{ id, deeplink: asString(entry?.deeplink) }] : [];
    }),
  };
}

function extractAddress(address: RscRecord): ProfileAddress {
  return {
    street: asString(address.street) ?? "",
    houseNumber: typeof address.houseNumber === "number" ? address.houseNumber : null,
    houseNumberExtension: asString(address.houseNumberExtension),
    postcode: asString(address.postcode) ?? "",
    city: asString(address.city) ?? "",
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
