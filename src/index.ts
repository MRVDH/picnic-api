import HttpClient from "./http-client";
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

export = class PicnicClient extends HttpClient {
  public readonly app: AppService;
  public readonly auth: AuthService;
  public readonly user: UserService;
  public readonly catalog: CatalogService;
  public readonly cart: CartService;
  public readonly delivery: DeliveryService;
  public readonly payment: PaymentService;
  public readonly consent: ConsentService;
  public readonly customerService: CustomerServiceService;
  public readonly content: ContentService;
  public readonly userOnboarding: UserOnboardingService;
  public readonly recipe: RecipeService;

  /**
   * Creates a new Picnic API client.
   * @param {ApiConfig} [options] Configuration for the client.
   * @param {string} [options.countryCode="NL"] The country code for the API endpoint.
   * @param {string} [options.apiVersion="15"] The API version to use.
   * @param {string} [options.authKey] An existing auth key to skip the login step.
   * @param {string} [options.url] A custom API endpoint URL.
   */
  constructor(options?: ApiConfig) {
    super(options);

    this.app = new AppService(this);
    this.auth = new AuthService(this);
    this.user = new UserService(this);
    this.catalog = new CatalogService(this);
    this.cart = new CartService(this);
    this.delivery = new DeliveryService(this);
    this.payment = new PaymentService(this);
    this.consent = new ConsentService(this);
    this.customerService = new CustomerServiceService(this);
    this.content = new ContentService(this);
    this.userOnboarding = new UserOnboardingService(this);
    this.recipe = new RecipeService(this);
  }
};
