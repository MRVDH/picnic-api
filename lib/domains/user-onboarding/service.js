"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserOnboardingService = void 0;
class UserOnboardingService {
    constructor(http) {
        this.http = http;
    }
    // TODO: Test route and add types
    /**
     * Submits household details during user onboarding.
     * Used to personalize the shopping experience based on household composition.
     * @param {Record<string, any>} details Household details object (exact shape unknown).
     */
    setHouseholdDetails(details) {
        return this.http.sendRequest("POST", `/user-onboarding/household-details`, details);
    }
    // TODO: Test route and add types
    /**
     * Submits business details during user onboarding (for business accounts).
     * @param {Record<string, any>} details Business details object (exact shape unknown).
     */
    setBusinessDetails(details) {
        return this.http.sendRequest("POST", `/user-onboarding/business-details`, details);
    }
    // TODO: Test route and add types
    /**
     * Subscribes the user to push notifications during the onboarding flow.
     * @param {string[]} topics The list of push notification topics to subscribe to.
     */
    subscribePush(topics) {
        return this.http.sendRequest("POST", `/user-onboarding/subscribe-push`, { topics });
    }
}
exports.UserOnboardingService = UserOnboardingService;
//# sourceMappingURL=service.js.map