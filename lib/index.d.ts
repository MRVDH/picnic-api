import { ApiConfig } from "./types/common";
import { AppService } from "./domains/app/service";
import { AuthService } from "./domains/auth/service";
import { UserService } from "./domains/user/service";
import { CatalogService } from "./domains/catalog/service";
import { CartService } from "./domains/cart/service";
import { DeliveryService } from "./domains/delivery/service";
import { PaymentService } from "./domains/payment/service";
import { ConsentService } from "./domains/consent/service";
import { CustomerServiceService } from "./domains/customer-service/service";
import { ContentService } from "./domains/content/service";
import { UserOnboardingService } from "./domains/user-onboarding/service";
import { RecipeService } from "./domains/recipe/service";
declare const _default: {
    new (options?: ApiConfig): {
        readonly app: AppService;
        readonly auth: AuthService;
        readonly user: UserService;
        readonly catalog: CatalogService;
        readonly cart: CartService;
        readonly delivery: DeliveryService;
        readonly payment: PaymentService;
        readonly consent: ConsentService;
        readonly customerService: CustomerServiceService;
        readonly content: ContentService;
        readonly userOnboarding: UserOnboardingService;
        readonly recipe: RecipeService;
        countryCode: import("./types/common").CountryCode;
        apiVersion: string;
        authKey: string | null;
        url: string;
        get baseHeaders(): Record<string, string>;
        get picnicHeaders(): Record<string, string>;
        sendRequest<TRequestData, TResponseData>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, data?: TRequestData | null, includePicnicHeaders?: boolean, isImageRequest?: boolean): Promise<TResponseData>;
    };
};
export = _default;
//# sourceMappingURL=index.d.ts.map