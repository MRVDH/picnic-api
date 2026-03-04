"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const http_client_1 = __importDefault(require("./http-client"));
const service_1 = require("./domains/app/service");
const service_2 = require("./domains/auth/service");
const service_3 = require("./domains/user/service");
const service_4 = require("./domains/catalog/service");
const service_5 = require("./domains/cart/service");
const service_6 = require("./domains/delivery/service");
const service_7 = require("./domains/payment/service");
const service_8 = require("./domains/consent/service");
const service_9 = require("./domains/customer-service/service");
const service_10 = require("./domains/content/service");
const service_11 = require("./domains/user-onboarding/service");
const service_12 = require("./domains/recipe/service");
module.exports = class PicnicClient extends http_client_1.default {
    /**
     * Creates a new Picnic API client.
     * @param {ApiConfig} [options] Configuration for the client.
     * @param {string} [options.countryCode="NL"] The country code for the API endpoint.
     * @param {string} [options.apiVersion="15"] The API version to use.
     * @param {string} [options.authKey] An existing auth key to skip the login step.
     * @param {string} [options.url] A custom API endpoint URL.
     */
    constructor(options) {
        super(options);
        this.app = new service_1.AppService(this);
        this.auth = new service_2.AuthService(this);
        this.user = new service_3.UserService(this);
        this.catalog = new service_4.CatalogService(this);
        this.cart = new service_5.CartService(this);
        this.delivery = new service_6.DeliveryService(this);
        this.payment = new service_7.PaymentService(this);
        this.consent = new service_8.ConsentService(this);
        this.customerService = new service_9.CustomerServiceService(this);
        this.content = new service_10.ContentService(this);
        this.userOnboarding = new service_11.UserOnboardingService(this);
        this.recipe = new service_12.RecipeService(this);
    }
};
//# sourceMappingURL=index.js.map