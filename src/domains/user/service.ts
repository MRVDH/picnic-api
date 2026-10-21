import type HttpClient from "../../http-client";
import type { PageClient } from "../../pages/page-client";
import { extractProfile } from "./profile";
import { RawUser, RawUserInfo, Profile, RawProfileMenu, UpdateCheckInput, RawUpdateCheckResult } from "./types";

export class UserService {
  constructor(
    private http: HttpClient,
    private pages: PageClient,
  ) {}

  /**
   * Gets the details of the current logged in user.
   */
  getUser(): Promise<RawUser> {
    return this.http.sendRequest<null, RawUser>("GET", `/user`);
  }

  /**
   * Gets information about the user such as toggled features.
   */
  getUserInfo(): Promise<RawUserInfo> {
    return this.http.sendRequest<null, RawUserInfo>("GET", `/user-info`);
  }

  /**
   * Gets information to display on the profile section.
   * This also includes MGM (member-get-member) referral details via `user.mgm`.
   */
  getProfileMenu(): Promise<RawProfileMenu> {
    return this.http.sendRequest<null, RawProfileMenu>("GET", `/profile-menu?fetch_mgm=true`, null, { includePicnicHeaders: true });
  }

  /**
   * Returns the profile tab the way the app shows it: the user, the preferred address and the
   * account menu, from the `profile-root` RSC page.
   */
  async getProfile(): Promise<Profile> {
    return extractProfile(await this.pages.getRscContent("profile-root"));
  }

  /**
   * Sends a product suggestion to Picnic, like the app's "suggest a product" form.
   * @param {string} suggestion The suggestion text.
   */
  submitSuggestion(suggestion: string): Promise<void> {
    return this.http.sendRequest<{ suggestion: string }, void>("POST", `/user/suggestion`, { suggestion });
  }

  /**
   * Registers a device's push notification token (a Firebase Cloud Messaging token), the way the
   * app does after it gets one, so Picnic can send notifications to that device.
   * @param {string} pushToken The Firebase Cloud Messaging token of the device.
   */
  registerPushToken(pushToken: string): Promise<void> {
    return this.http.sendRequest<{ push_destination: string; push_version: number }, void>("POST", `/user/device/register_push`, {
      push_destination: pushToken,
      push_version: 1,
    });
  }

  /**
   * Checks whether a newer version of the app is available. The endpoint requires
   * a body describing the client; the device and version fields are derived from
   * the client's configured `deviceId` and `agent` string.
   */
  checkForUpdates(): Promise<RawUpdateCheckResult> {
    const [clientId, versionBuild = ""] = this.http.agent.split(";");
    const [version = "", buildNumber = ""] = versionBuild.split("-");
    const body: UpdateCheckInput = {
      device_id: this.http.deviceId,
      device_name: "notAvailable",
      client_id: clientId,
      version,
      device_os: this.http.agent,
      build_number: buildNumber,
    };
    return this.http.sendRequest<UpdateCheckInput, RawUpdateCheckResult>("POST", `/update_check`, body, { includePicnicHeaders: true });
  }
}
