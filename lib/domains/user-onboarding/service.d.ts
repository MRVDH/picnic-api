import type HttpClient from "../../http-client";
export declare class UserOnboardingService {
    private http;
    constructor(http: HttpClient);
    /**
     * Submits household details during user onboarding.
     * Used to personalize the shopping experience based on household composition.
     * @param {Record<string, any>} details Household details object (exact shape unknown).
     */
    setHouseholdDetails(details: Record<string, any>): Promise<any>;
    /**
     * Submits business details during user onboarding (for business accounts).
     * @param {Record<string, any>} details Business details object (exact shape unknown).
     */
    setBusinessDetails(details: Record<string, any>): Promise<any>;
    /**
     * Subscribes the user to push notifications during the onboarding flow.
     * @param {string[]} topics The list of push notification topics to subscribe to.
     */
    subscribePush(topics: string[]): Promise<any>;
}
//# sourceMappingURL=service.d.ts.map