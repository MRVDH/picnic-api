"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
class UserService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Gets the details of the current logged in user.
     */
    getUserDetails() {
        return this.http.sendRequest("GET", `/user`);
    }
    /**
     * Gets information about the user such as toggled features.
     */
    getUserInfo() {
        return this.http.sendRequest("GET", `/user-info`);
    }
    /**
     * Gets information to display on the profile section.
     * This also includes MGM (member-get-member) referral details via `user.mgm`.
     */
    getProfileMenu() {
        return this.http.sendRequest("GET", `/profile-menu?fetch_mgm=true`, null, true);
    }
    // TODO: Test route and add types
    /**
     * Submits a suggestion or feedback from the user.
     * @param {string} suggestion The suggestion text to submit.
     */
    submitSuggestion(suggestion) {
        return this.http.sendRequest("POST", `/user/suggestion`, { suggestion });
    }
    // TODO: Test route and add types
    /**
     * Registers a push notification device token for the current user.
     * @param {string} pushToken The device push notification token.
     * @param {string} platform The platform identifier (e.g. 'firebase').
     */
    registerPushToken(pushToken, platform) {
        return this.http.sendRequest("POST", `/user/device/register_push`, { push_token: pushToken, platform });
    }
    /**
     * Checks whether a newer version of the app is available. The endpoint requires
     * a body describing the client; the device and version fields are derived from
     * the client's configured `deviceId` and `agent` string.
     */
    checkForUpdates() {
        const [clientId, versionBuild = ""] = this.http.agent.split(";");
        const [version = "", buildNumber = ""] = versionBuild.split("-");
        const body = {
            device_id: this.http.deviceId,
            device_name: "notAvailable",
            client_id: clientId,
            version,
            device_os: this.http.agent,
            build_number: buildNumber,
        };
        return this.http.sendRequest("POST", `/update_check`, body, true);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=service.js.map