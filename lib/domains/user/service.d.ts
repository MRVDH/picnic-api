import type HttpClient from "../../http-client";
import { User, UserInfo, ProfileMenu } from "./types";
export declare class UserService {
    private http;
    constructor(http: HttpClient);
    /**
     * Gets the details of the current logged in user.
     */
    getUserDetails(): Promise<User>;
    /**
     * Gets information about the user such as toggled features.
     */
    getUserInfo(): Promise<UserInfo>;
    /**
     * Gets information to display on the profile section.
     * This also includes MGM (member-get-member) referral details via `user.mgm`.
     */
    getProfileMenu(): Promise<ProfileMenu>;
    /**
     * Submits a suggestion or feedback from the user.
     * @param {string} suggestion The suggestion text to submit.
     */
    submitSuggestion(suggestion: string): Promise<any>;
    /**
     * Registers a push notification device token for the current user.
     * @param {string} pushToken The device push notification token.
     * @param {string} platform The platform identifier (e.g. 'firebase').
     */
    registerPushToken(pushToken: string, platform: string): Promise<any>;
    /**
     * Checks whether a newer version of the app is available.
     * The app also sends a 'picnic-country' header, which the HttpClient does not
     * currently support for custom headers — may need to be added.
     */
    checkForUpdates(): Promise<any>;
}
//# sourceMappingURL=service.d.ts.map