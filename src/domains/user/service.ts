import type HttpClient from "../../http-client";
import { User, UserInfo, ProfileMenu, UpdateCheckInput, UpdateCheckResult } from "./types";

export class UserService {
  constructor(private http: HttpClient) {}

  /**
   * Gets the details of the current logged in user.
   */
  getUserDetails(): Promise<User> {
    return this.http.sendRequest<any, User>("GET", `/user`);
  }

  /**
   * Gets information about the user such as toggled features.
   */
  getUserInfo(): Promise<UserInfo> {
    return this.http.sendRequest<any, UserInfo>("GET", `/user-info`);
  }

  /**
   * Gets information to display on the profile section.
   * This also includes MGM (member-get-member) referral details via `user.mgm`.
   */
  getProfileMenu(): Promise<ProfileMenu> {
    return this.http.sendRequest<any, ProfileMenu>("GET", `/profile-menu?fetch_mgm=true`, null, true);
  }

  // TODO: Test route and add types
  /**
   * Submits a suggestion or feedback from the user.
   * @param {string} suggestion The suggestion text to submit.
   */
  submitSuggestion(suggestion: string) {
    return this.http.sendRequest<any, any>("POST", `/user/suggestion`, { suggestion });
  }

  // TODO: Test route and add types
  /**
   * Registers a push notification device token for the current user.
   * @param {string} pushToken The device push notification token.
   * @param {string} platform The platform identifier (e.g. 'firebase').
   */
  registerPushToken(pushToken: string, platform: string) {
    return this.http.sendRequest<any, any>("POST", `/user/device/register_push`, { push_token: pushToken, platform });
  }

  /**
   * Checks whether a newer version of the app is available. The endpoint requires
   * a body describing the client; the device and version fields are derived from
   * the client's configured `deviceId` and `agent` string.
   */
  checkForUpdates(): Promise<UpdateCheckResult> {
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
    return this.http.sendRequest<UpdateCheckInput, UpdateCheckResult>("POST", `/update_check`, body, true);
  }
}
