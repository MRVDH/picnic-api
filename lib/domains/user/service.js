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
    // TODO: Test route and add types
    /**
     * Checks whether a newer version of the app is available.
     * The app also sends a 'picnic-country' header, which the HttpClient does not
     * currently support for custom headers — may need to be added.
     */
    checkForUpdates() {
        return this.http.sendRequest("POST", `/update_check`, {}, true);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=service.js.map