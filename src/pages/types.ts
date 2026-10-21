import type { FusionPage } from "./fusion";

/** The formats Picnic can serve a page in: a Fusion (PML) page or a React Server Components payload. */
export type PageFormat = "fusion" | "rsc";

/**
 * A page as Picnic served it. Which format a page comes in depends on the page and the
 * `x-picnic-agent` version, and Picnic is moving more pages from Fusion to RSC, so check
 * `format` before reading it.
 */
export type Page =
  | {
      format: "fusion";
      /** The page id the page was fetched for, e.g. `home_page_root`. */
      pageId: string;
      /** The Fusion page. */
      page: FusionPage;
    }
  | {
      format: "rsc";
      /** The page id the page was fetched for, e.g. `profile-root`. */
      pageId: string;
      /** The page's components. */
      content: RscPageContent;
    };

/** The content of a page served as RSC, as a tree of the page's components. */
export type RscPageContent = {
  /** The page id the content was fetched for, e.g. `profile-root`. */
  pageId: string;
  /** Theme colors of the page: design tokens ("Action/primary") and palette names ("YELLOW2") to hex values. */
  tokens: Record<string, string>;
  /** The page's content components in render order. */
  nodes: RscNode[];
};

/**
 * One component of an RSC page. Wrapper components that only provide context (page data, icons)
 * are left out; their children take their place.
 */
export type RscNode = {
  /** An id unique within the page, e.g. `vertical-list-3`. */
  id: string;
  /**
   * The component's module name, e.g. `vertical-list` for
   * `./logical-components/sections/vertical-list/vertical-list.tsx`.
   */
  component: string;
  /**
   * The component's full module path, e.g. `./pages/search/sellable-overview/components/items.tsx`.
   * Use it to tell apart components whose module names are the same (`items`).
   */
  modulePath: string;
  /**
   * The component's props, with references resolved and nested components moved to `children`.
   * Product tiles (`type: "sellable"`) are parsed into `ProductTile` objects (see the catalog types).
   */
  props: Record<string, unknown>;
  /** The components nested in the props (e.g. `children`), in order. */
  children: RscNode[];
};
