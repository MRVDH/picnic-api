import type HttpClient from "../http-client";
import { UnexpectedPageFormatError } from "../errors/page-format-error";
import type { FusionPage } from "./fusion";
import type { RscPage } from "./rsc-payload";
import { findRscModuleChunks, parseRscPageContent, parseRscPayload } from "./rsc";
import type { Page, RscPageContent } from "./types";

/** A page as Picnic served it, with an RSC page still in its raw form (needed to run its server actions). */
export type LoadedPage = { format: "fusion"; pageId: string; page: unknown } | { format: "rsc"; pageId: string; payload: RscPage };

/**
 * Fetches pages the way the app does: one request to `/pages/<id>`, which Picnic answers with a
 * Fusion page or an RSC payload depending on the page and the `x-picnic-agent` version. Also runs
 * the server actions of RSC pages.
 *
 * Internal: every service reads pages through it, so a page that switches format raises an
 * `UnexpectedPageFormatError` naming the page instead of reaching the wrong parser. It isn't part
 * of the client's public API; `app.getPage` returns pages in either format.
 */
export class PageClient {
  /** The CDN base URL of RSC client chunks, from the bootstrap data; fetched once. */
  private clientChunkBaseUrl?: Promise<string>;
  /** Server action ids found per chunk and action name (`<chunk>#<action>`), `null` when absent. */
  private serverActionIds = new Map<string, string | null>();

  constructor(private http: HttpClient) {}

  /**
   * Fetches a page in whichever format Picnic serves it. An RSC page comes with the page's
   * `X-Page-Version` header as `version`.
   * @param {string} pageId The page id, optionally with query params, e.g. `category-tree-root`.
   */
  async load(pageId: string): Promise<LoadedPage> {
    const { data, headers } = await this.http.sendRequestWithHeaders<null, unknown>("GET", `/pages/${pageId}`, null, { includePicnicHeaders: true });
    if (typeof data !== "string") return { format: "fusion", pageId, page: data };
    const version = headers.get("x-page-version");
    return { format: "rsc", pageId, payload: { ...parseRscPayload(data), ...(version && { version }) } };
  }

  /** Fetches a page and parses an RSC page into its component tree. */
  async getPage(pageId: string): Promise<Page> {
    const loaded = await this.load(pageId);
    return loaded.format === "fusion"
      ? { format: "fusion", pageId, page: loaded.page as FusionPage }
      : { format: "rsc", pageId, content: parseRscPageContent(pageId, loaded.payload) };
  }

  /**
   * Fetches a page that is expected to be a Fusion page. Most pages come as a {@link FusionPage};
   * a few return the bare layout, so the caller names the type.
   * @throws {UnexpectedPageFormatError} When Picnic serves the page as RSC.
   */
  async getFusionPage<TPage = FusionPage>(pageId: string): Promise<TPage> {
    const loaded = await this.load(pageId);
    if (loaded.format !== "fusion") throw new UnexpectedPageFormatError(pageId, "rsc");
    return loaded.page as TPage;
  }

  /**
   * Fetches a page that is expected to be RSC, split into its rows and module references.
   * @throws {UnexpectedPageFormatError} When Picnic serves the page as a Fusion page.
   */
  async getRscPayload(pageId: string): Promise<RscPage> {
    const loaded = await this.load(pageId);
    if (loaded.format !== "rsc") throw new UnexpectedPageFormatError(pageId, "fusion");
    return loaded.payload;
  }

  /**
   * Fetches a page that is expected to be RSC and parses it into its component tree.
   * @throws {UnexpectedPageFormatError} When Picnic serves the page as a Fusion page.
   */
  async getRscContent(pageId: string): Promise<RscPageContent> {
    return parseRscPageContent(pageId, await this.getRscPayload(pageId));
  }

  /**
   * Runs a server action of an RSC page and returns the RSC payload it responds with. Client
   * components call these to load data after the page is shown; product search results, for
   * example, come from the `fetchSearchResults` action of the search page.
   *
   * Find the action id with {@link findServerActionId}; it contains a build hash and changes
   * when Picnic deploys a new version of the page.
   * @param {string} actionId The action id, e.g. `act_fetchSearchResults_169995c7443462f7`.
   * @param {unknown[]} args The arguments the client component passes to the action.
   * @param {string} [pageVersion] The `version` of the page the action belongs to, sent as `X-Page-Version`.
   */
  async runServerAction(actionId: string, args: unknown[], pageVersion?: string): Promise<RscPage> {
    const payload = await this.http.sendRequestWithHeaders<{ params: string }, string>(
      "POST",
      `/pages/action/${encodeURIComponent(actionId)}`,
      { params: JSON.stringify(args) },
      { includePicnicHeaders: true, headers: pageVersion ? { "X-Page-Version": pageVersion } : {} },
    );
    return parseRscPayload(payload.data);
  }

  /**
   * Returns the source of a client component chunk of an RSC page. The app downloads these from
   * the `client_component_cdn_base_url` in the bootstrap data; chunk ids come from the module
   * references of a page (see `findRscModuleChunks`).
   * @param {string} chunkId The chunk id, e.g. `shared-pages_search_search-page-content_results_index_tsx.b717044a`.
   */
  async getClientChunk(chunkId: string): Promise<string> {
    this.clientChunkBaseUrl ??= this.http
      .sendRequest<null, { in_app_feature_config?: { client_component_cdn_base_url?: string } }>("GET", `/bootstrap`)
      .then((bootstrap) => {
        const baseUrl = bootstrap.in_app_feature_config?.client_component_cdn_base_url?.trim();
        if (!baseUrl) throw new Error("The bootstrap data has no client_component_cdn_base_url");
        return baseUrl.replace(/\/+$/, "");
      });
    let baseUrl: string;
    try {
      baseUrl = await this.clientChunkBaseUrl;
    } catch (error) {
      this.clientChunkBaseUrl = undefined;
      throw error;
    }
    // Chunks are public static files: send no auth key. They're served as application/octet-stream,
    // so read the bytes and decode them.
    const { data } = await this.http.sendRequestWithHeaders<null, ArrayBuffer>("GET", `${baseUrl}/${chunkId}.script.bundle`, null, {
      authenticated: false,
      binary: true,
    });
    return new TextDecoder().decode(data);
  }

  /**
   * Finds the id of a server action, e.g. `fetchSearchResults`, the way the app does: in the
   * client chunks of the component that calls it. The chunks are downloaded in parallel; the first
   * one (in module order) that contains the action wins. Chunks are immutable (their ids contain a
   * hash), so the result per chunk is cached for the lifetime of the client.
   * @param {RscPage} page The page that renders the component.
   * @param {string} modulePath The end of the component's path, e.g. `search-page-content/results/index.tsx`.
   * @param {string} actionName The action's function name, e.g. `fetchSearchResults`.
   * @returns The action id, or `null` when the component's chunks don't contain the action.
   */
  async findServerActionId(page: RscPage, modulePath: string, actionName: string): Promise<string | null> {
    const pattern = new RegExp(`act_${actionName}_[0-9a-f]+`);
    // The shared container and node_modules chunks hold framework and design system code, not page actions.
    const chunks = findRscModuleChunks(page, modulePath).filter((chunk) => !chunk.startsWith("client-components.") && !chunk.startsWith("shared-node_modules_"));
    const actionIds = await Promise.all(
      chunks.map(async (chunk) => {
        const cacheKey = `${chunk}#${actionName}`;
        if (!this.serverActionIds.has(cacheKey)) {
          this.serverActionIds.set(cacheKey, pattern.exec(await this.getClientChunk(chunk))?.[0] ?? null);
        }
        return this.serverActionIds.get(cacheKey) ?? null;
      }),
    );
    return actionIds.find((actionId) => actionId !== null) ?? null;
  }
}
