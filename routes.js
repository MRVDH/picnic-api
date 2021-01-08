export default `
        USER:

        @POST("/api/{api_version}/user")
        b a(@Body UserInfo paramUserInfo);
        
        @POST("/api/{api_version}/user/forgot_password")
        b a(@Header("picnic-email") String paramString1, @Query("email") String paramString2);
        
        @GET("/api/{api_version}/user")
        w<UserInfo> a();
        
        @POST("/api/{api_version}/user/login")
        w<LoginResponse> a(@Header("picnic-email") String paramString, @Body Map<String, Object> paramMap);
        
        @POST("/api/{api_version}/user/verify_address")
        w<AddressWrapper> a(@Body Map<String, Address> paramMap);
        
        @PUT("/api/{api_version}/user/email")
        b b(@Body Map<String, String> paramMap);
        
        @POST("/api/{api_version}/user/register/direct")
        w<Object> b(@Header("picnic-country") String paramString, @Body Map<String, Object> paramMap);
        
        @POST("/api/{api_version}/user/logout")
        Call<String> b();
        
        @POST("/api/{api_version}/user/forgot_password/update")
        b c(@Header("picnic-country") String paramString, @Body Map<String, String> paramMap);
        
        @POST("/api/{api_version}/update_check")
        w<UpdateInformation> c(@Body Map<String, Object> paramMap);
        
        @POST("/api/{api_version}/user/suggestion")
        b d(@Body Map<String, String> paramMap);
        
        @POST("/api/{api_version}/user/device/register_push")
        b e(@Body Map<String, Object> paramMap);
        
        @POST("/api/{api_version}/user/subscribe")
        b f(@Body Map<String, List<String>> paramMap);
        
        @POST("/api/{api_version}/user/household_details")
        b g(@Body Map<String, HouseholdDetails> paramMap);
        
        @POST("/api/{api_version}/user/business_details")
        b h(@Body Map<String, BusinessDetails> paramMap);
        
        @POST("/api/{api_version}/user/phone_verification/generate")
        b i(@Body Map<String, String> paramMap);
        
        @POST("/api/{api_version}/user/phone_verification/verify")
        b j(@Body Map<String, String> paramMap);


        CART:

        @GET("/api/{api_version}/cart")
        @Headers({"Cache-Control: no-cache"})
        w<Cart> a();
        
        @POST("/api/{api_version}/cart/add_orders")
        w<Cart> a(@Body List<String> paramList);
        
        @POST("/api/{api_version}/cart/set_delivery_slot")
        w<Cart> a(@Body Map<String, Object> paramMap);
        
        @GET("/api/{api_version}/cart/delivery_slots")
        w<DeliverySlotsWrapper> b();
        
        @POST("/api/{api_version}/cart/add_product")
        w<Cart> b(@Body Map<String, Object> paramMap);
        
        @POST("/api/{api_version}/cart/clear")
        w<Cart> c();
        
        @POST("/api/{api_version}/cart/remove_product")
        w<Cart> c(@Body Map<String, Object> paramMap);
        
        @POST("/api/{api_version}/cart/remove_group")
        w<Cart> d(@Body Map<String, Object> paramMap);
        
        @POST("/api/{api_version}/cart/products/swap")
        w<Cart> e(@Body Map<String, Object> paramMap);
        
        @POST("/api/{api_version}/cart/products/add")
        w<Cart> f(@Body Map<String, Integer> paramMap);


        CHECKOUT:

        @POST("/api/{api_version}/cart/checkout/order/{order_id}/confirm")
        w<CheckoutConfirmation> a(@Path("order_id") String paramString);
        
        @POST("/api/{api_version}/cart/checkout/payment-options/{payment_option_id}")
        w<CheckoutInfo> a(@Path("payment_option_id") String paramString, @Body Map<String, Object> paramMap);
        
        @POST("/api/{api_version}/cart/checkout/start")
        w<CheckoutInfo> a(@Body Map<String, Object> paramMap);
        
        @GET("/api/{api_version}/cart/checkout/order/{order_id}/status")
        w<CheckoutStatusResponse> b(@Path("order_id") String paramString);
        
        @POST("/api/{api_version}/cart/checkout/set_coupon_code")
        w<CheckoutInfo> b(@Body Map<String, Object> paramMap);
        
        @POST("/api/{api_version}/cart/checkout/cancel")
        b c(@Body Map<String, Object> paramMap);
        
        @POST("/api/{api_version}/cart/checkout/set_payment_method")
        w<CheckoutInfo> d(@Body Map<String, Object> paramMap);
        
        @POST("/api/{api_version}/cart/checkout/current")
        w<CheckoutInfo> e(@Body Map<String, Object> paramMap);
        
        @POST("/api/{api_version}/cart/checkout/initiate_payment")
        w<PaymentTransactionInfo> f(@Body Map<String, Object> paramMap);


        PRIVACY:
        
        @PUT("/api/{api_version}/consents")
        b a(@Body ConsentDeclarations paramConsentDeclarations);
        
        @GET("/api/{api_version}/consents/settings-page")
        n<List<Consent>> a();
        
        @GET("/api/{api_version}/consents")
        w<List<ConsentRequest>> a(@Query("consent_topics") List<String> paramList, @Query("strategy") ConsentTopicsStrategy paramConsentTopicsStrategy);
        
        @GET("/api/{api_version}/consents/general")
        n<ConsentRequest> b();
        
        @GET("/api/{api_version}/consents/general/settings-page")
        n<List<Consent>> c();


        DELIVERY:

        @POST("/api/{api_version}/deliveries/{delivery_id}/rating")
        b a(@Path("delivery_id") String paramString, @Body Rating paramRating);
        
        @PUT("/api/{api_version}/deliveries/{delivery_id}/feedback/{report_id}/images")
        b a(@Path("delivery_id") String paramString1, @Path("report_id") String paramString2, @Body RequestBody paramRequestBody);
        
        @GET("/api/{api_version}/deliveries/rateable")
        w<List<Delivery>> a();
        
        @GET("/api/{api_version}/deliveries/{delivery_id}/scenario")
        w<DeliveryScenario> a(@Path("delivery_id") String paramString);
        
        @POST("/api/{api_version}/deliveries/{delivery_id}/issue-resolution-options")
        w<List<IssueResolutionOption>> a(@Path("delivery_id") String paramString, @Body RatingFeedback paramRatingFeedback);
        
        @POST("/api/{api_version}/deliveries")
        w<List<Delivery>> a(@Body List<String> paramList);
        
        @GET("/api/{api_version}/deliveries/{delivery_id}/position")
        n<DeliveryPosition> b(@Path("delivery_id") String paramString);
        
        @POST("/api/{api_version}/deliveries/{delivery_id}/feedback")
        w<DeliveryFeedbackReport> b(@Path("delivery_id") String paramString, @Body RatingFeedback paramRatingFeedback);
        
        @POST("/api/{api_version}/deliveries/summary")
        w<List<Delivery>> b(@Body List<String> paramList);
        
        @GET("/api/{api_version}/deliveries/{delivery_id}")
        w<Delivery> c(@Path("delivery_id") String paramString);
        
        @POST("/api/{api_version}/order/delivery/{delivery_id}/cancel")
        b d(@Path("delivery_id") String paramString);
        
        @POST("/api/{api_version}/deliveries/{delivery_id}/resend_invoice_email")
        b e(@Path("delivery_id") String paramString);


        FAQ:

        @GET("/api/{api_version}/content/faq")
        w<PMLRoot> a();


        IMAGES:

        @POST("/api/{api_version}/images/{context}")
        w<ImageUploadResponse> a(@Path("context") String paramString, @Body RequestBody paramRequestBody);


        MGM:

        @GET("/api/{api_version}/mgm")
        n<MGM> a();
        
        @POST("/api/{api_version}/mgm/{mgmCode}/message")
        n<MgmMessage> a(@Path("mgmCode") String paramString, @Body Map<String, String> paramMap);


        MESSAGES:
        
        @GET("/api/{api_version}/messages")
        w<MessagesWrapper> a(@Query("display_position") List<String> paramList);


        PRODUCTS:

        @GET("/api/{api_version}/my_store")
        w<MyStore> a(@Query("depth") int paramInt);
        
        @GET("/api/{api_version}/product/{product_id}")
        w<ProductDetailsWrapper> a(@Path("product_id") String paramString);
        
        @GET("/api/{api_version}/suggest")
        w<List<SearchSuggestion>> b(@Query("search_term") String paramString);
        
        @GET("/api/{api_version}/search/")
        w<List<CategoryItem>> c(@Query("search_term") String paramString);
        
        @GET("/api/{api_version}/promotion/{promotionId}/category")
        w<ListItem> e(@Path("promotionId") String paramString);
        
        @GET("api/{api_version}/templates/{template_id}/render")
        n<TemplatedPayload> f(@Path("template_id") String paramString);

        @POST("/api/{api_version}/user-products-blacklist")
        b a(@Body Map<String, String> paramMap);
        
        @HTTP(hasBody = true, method = "DELETE", path = "/api/{api_version}/user-products-blacklist")
        b b(@Body Map<String, String> paramMap);


        RECIPES:

        @GET("/api/{api_version}/recipes/{recipe_id}")
        w<RecipeDetailsWrapper> a(@Path("recipe_id") String paramString);


        REMINDERS:

        @PUT("/api/{api_version}/reminders")
        b a(@Body List<Reminder> paramList);
        
        @GET("/api/{api_version}/reminders")
        w<Reminders> a();


        CONTENT:

        @GET("/api/{api_version}/content/{display_position}")
        n<List<Content>> a(@Path("display_position") DisplayPosition paramDisplayPosition);
        
        @GET("/api/{api_version}/content/search_empty_state")
        w<PMLRoot> a();


        USER DEFINED BUNDLES:

        @POST("/api/{api_version}/user-defined-bundles")
        b a(@Body UpdatedUserDefinedBundle paramUpdatedUserDefinedBundle);
        
        @PUT("/api/{api_version}/user-defined-bundles/{bundle_id}")
        b a(@Path("bundle_id") String paramString, @Body UpdatedUserDefinedBundle paramUpdatedUserDefinedBundle);
        
        @PUT("/api/{api_version}/user-defined-bundles/{bundle_id}/image")
        b a(@Path("bundle_id") String paramString, @Body Map<String, String> paramMap);
        
        @GET("/api/{api_version}/user-defined-bundles/{bundle_id}")
        w<UserDefinedBundle> a(@Path("bundle_id") String paramString);
        
        @DELETE("/api/{api_version}/user-defined-bundles/{bundle_id}")
        b b(@Path("bundle_id") String paramString);
        `;