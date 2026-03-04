import type HttpClient from "../../http-client";
import { PML, Component } from "../../types/fusion";

export class ContentService {
  constructor(private http: HttpClient) {}

  /**
   * Returns the FAQ content page in PML (Picnic Markup Language) format.
   * Used to populate the in-app FAQ / help section.
   */
  getFaqContent(): Promise<PML<Component>> {
    return this.http.sendRequest<null, PML<Component>>("GET", `/content/faq`, null, true);
  }

  /**
   * Returns the content shown on the search empty-state screen (no results).
   * Returned in PML (Picnic Markup Language) format.
   */
  getSearchEmptyState(): Promise<PML<Component>> {
    return this.http.sendRequest<null, PML<Component>>("GET", `/content/search_empty_state`, null, true);
  }
}
