import { RawRecord, asRecord, asString } from "../../raw";
import type { RscPageContent } from "../../pages/types";
import { findRscNode } from "../../pages/rsc";
import type { Profile, ProfileAddress, ProfileMenuEntry } from "./types";

/**
 * Extracts the profile from the `profile-root` page content: the `user-info` component holds the
 * user and preferred address, the `menu-list` component the menu entries as `{ id, deeplink }`.
 * @param {RscPageContent} content The content of the `profile-root` page.
 */
export function extractProfile(content: RscPageContent): Profile {
  const user = asRecord(findRscNode(content.nodes, "user-info")?.props.user) ?? {};
  const items = findRscNode(content.nodes, "menu-list")?.props.items;
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

function extractAddress(address: RawRecord): ProfileAddress {
  return {
    street: asString(address.street) ?? "",
    houseNumber: typeof address.houseNumber === "number" ? address.houseNumber : null,
    houseNumberExtension: asString(address.houseNumberExtension),
    postcode: asString(address.postcode) ?? "",
    city: asString(address.city) ?? "",
  };
}
