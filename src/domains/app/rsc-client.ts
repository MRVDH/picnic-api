import type HttpClient from "../../http-client";
import { UnexpectedPageFormatError } from "../../errors/page-format-error";
import type { BootstrapData, FusionPage } from "../../types/fusion";
import type { RscPage } from "../../types/rsc";
import { findRscModuleChunks, parseRscPayload } from "./rsc";

/**
 * Fetches raw RSC pages and runs their server actions, the way the app's RSC runtime does.
 * Internal: services use it to build parsed models (e.g. `app.getRscPageContent`,
 * `catalog.getSearchResults`); it isn't part of the client's public API.
 */
export class RscPageClient {
  /** The CDN base URL of RSC client chunks, from the bootstrap data; fetched once. */
  private clientChunkBaseUrl?: Promise<string>;
  /** Server action ids found per chunk and action name (`<chunk>#<action>`), `null` when absent. */
  private serverActionIds = new Map<string, string | null>();

  constructor(private http: HttpClient) {}

  /**
   * Returns a page served as an RSC payload, split into its rows and module references, with
   * the page's `X-Page-Version` header as `version`. Throws an `UnexpectedPageFormatError` when
   * the page is served as a Fusion page.
   * @param {string} pageId The page ID, optionally with query params, e.g. `category-tree-root`.
   */
  async getPage(pageId: string): Promise<RscPage> {
    const { data, headers } = await this.http.sendRequestWithHeaders<null, FusionPage | string>("GET", `/pages/${pageId}`, null, { includePicnicHeaders: true });
    if (typeof data !== "string") throw new UnexpectedPageFormatError(pageId, "fusion");
    const version = headers.get("x-page-version");
    return { ...parseRscPayload(data), ...(version && { version }) };
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
    this.clientChunkBaseUrl ??= this.http.sendRequest<null, BootstrapData>("GET", `/bootstrap`).then((bootstrap) => {
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
