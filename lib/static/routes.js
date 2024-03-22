module.exports = `
        USER:

        @POST("/api/{api_version}/user/household_details")
        /* renamed from: a */
        C10099b mo29753a(@Body Map<String, HouseholdDetails> map);
    
        @POST("/api/{api_version}/user/logout")
        /* renamed from: b */
        C10099b mo29754b();
    
        @POST("/api/{api_version}/user/business_details")
        /* renamed from: c */
        C10099b mo29755c(@Body Map<String, BusinessDetails> map);
    
        @POST("/api/{api_version}/user/forgot_password/update")
        /* renamed from: d */
        C10099b mo29756d(@Header("picnic-country") String str, @Body Map<String, String> map);
    
        @POST("/api/{api_version}/user/subscribe")
        /* renamed from: e */
        C10099b mo29757e(@Body Map<String, List<String>> map);
    
        @POST("/api/{api_version}/user/login")
        /* renamed from: f */
        C10127x<LoginResponse> mo29758f(@Header("picnic-email") String str, @Body Map<String, Object> map);
    
        @POST("/api/{api_version}/user/suggestion")
        /* renamed from: g */
        C10099b mo29759g(@Body Map<String, String> map);
    
        @POST("/api/{api_version}/user/register/direct")
        /* renamed from: h */
        C10127x<Object> mo29760h(@Header("picnic-country") String str, @Body Map<String, Object> map);
    
        @POST("/api/{api_version}/user/phone_verification/verify")
        /* renamed from: i */
        C10099b mo29761i(@Body Map<String, String> map);
    
        @GET("/api/{api_version}/user")
        /* renamed from: j */
        C10127x<UserInfo> mo29762j();
    
        @POST("/api/{api_version}/user/device/register_push")
        /* renamed from: k */
        C10099b mo29763k(@Body Map<String, Object> map);
    
        @POST("/api/{api_version}/user/forgot_password")
        /* renamed from: l */
        C10099b mo29764l(@Header("picnic-email") String str, @Query("email") String str2);
    
        @POST("/api/{api_version}/update_check")
        /* renamed from: m */
        C10127x<UpdateInformation> mo29765m(@Header("picnic-country") String str, @Body Map<String, Object> map);
    
        @POST("/api/{api_version}/user/phone_verification/generate")
        /* renamed from: n */
        C10099b mo29766n(@Body Map<String, String> map);


        CS CONTACT INFO:
        
        @GET("/api/{api_version}/cs-contact-info")
        /* renamed from: a */
        C10127x<CSContactInformation> mo29767a();
    
        @GET("/public-api/{api_version}/cs-contact-info")
        /* renamed from: b */
        C10127x<CSContactInformation> mo29768b(@Header("picnic-country") String str);


        CART:

        @POST("/api/{api_version}/recipes/cart/recipe-article")
        /* renamed from: a */
        C10127x<Cart> mo29769a(@Body Map<String, Object> map);
    
        @GET("/api/{api_version}/cart")
        @Headers({"Cache-Control: no-cache"})
        /* renamed from: b */
        C10127x<Cart> mo29770b();
    
        @POST("/api/{api_version}/cart/clear")
        /* renamed from: c */
        C10127x<Cart> mo29771c();
    
        @GET("/api/{api_version}/cart/delivery_slots")
        /* renamed from: d */
        C10127x<DeliverySlotsWrapper> mo29772d();
    
        @POST("/api/{api_version}/recipes/cart/recipe-section")
        /* renamed from: e */
        C10127x<Cart> mo29773e(@Body Map<String, Object> map);
    
        @POST("/api/{api_version}/cart/add_orders")
        /* renamed from: f */
        C10127x<Cart> mo29774f(@Body List<String> list);
    
        @POST("/api/{api_version}/cart/set_delivery_slot")
        /* renamed from: g */
        C10127x<Cart> mo29775g(@Body Map<String, Object> map);
    
        @POST("/api/{api_version}/cart/remove_product")
        /* renamed from: h */
        C10127x<Cart> mo29776h(@Body Map<String, Object> map);
    
        @POST("/api/{api_version}/cart/products/add")
        /* renamed from: i */
        C10127x<Cart> mo29777i(@Body Map<String, Integer> map);
    
        @POST("/api/{api_version}/cart/remove_group")
        /* renamed from: j */
        C10127x<Cart> mo29778j(@Body Map<String, Object> map);
    
        @POST("/api/{api_version}/cart/add_product")
        /* renamed from: k */
        C10127x<Cart> mo29779k(@Body Map<String, Object> map);


        CONSENTS:
        
        @GET("/api/{api_version}/consents/general")
        /* renamed from: a */
        C10113o<ConsentRequest> mo29780a();
    
        @PUT("/api/{api_version}/consents")
        /* renamed from: b */
        C10099b mo29781b(@Body ConsentDeclarations consentDeclarations);
    
        @GET("/api/{api_version}/consents")
        /* renamed from: c */
        C10127x<List<ConsentRequest>> mo29782c(@Query("consent_topics") List<String> list, @Query("strategy") ConsentTopicsStrategy consentTopicsStrategy);
    
        @GET("/api/{api_version}/consents/general/settings-page")
        /* renamed from: d */
        C10113o<List<Consent>> mo29783d();
    
        @GET("/api/{api_version}/consents/settings-page")
        /* renamed from: e */
        C10113o<List<Consent>> mo29784e();


        DELIVERY:

        @PUT("/api/{api_version}/deliveries/{delivery_id}/feedback/{report_id}/images")
        /* renamed from: a */
        C10099b mo29785a(@Path("delivery_id") String str, @Path("report_id") String str2, @Body RequestBody requestBody);
    
        @GET("/api/{api_version}/deliveries/{delivery_id}/position")
        /* renamed from: b */
        C10113o<DeliveryPosition> mo29786b(@Path("delivery_id") String str);
    
        @POST("/api/{api_version}/deliveries/{delivery_id}/issue-resolution-options")
        /* renamed from: c */
        C10127x<List<IssueResolutionOption>> mo29787c(@Path("delivery_id") String str, @Body RatingFeedback ratingFeedback);
    
        @GET("/api/{api_version}/deliveries/rateable")
        /* renamed from: d */
        C10127x<List<Delivery>> mo29788d();
    
        @GET("/api/{api_version}/deliveries/{delivery_id}/scenario")
        /* renamed from: e */
        C10127x<DeliveryScenario> mo29789e(@Path("delivery_id") String str);
    
        @POST("/api/{api_version}/order/delivery/{delivery_id}/cancel")
        /* renamed from: f */
        C10099b mo29790f(@Path("delivery_id") String str);
    
        @GET("/api/{api_version}/deliveries/{delivery_id}")
        /* renamed from: g */
        C10127x<Delivery> mo29791g(@Path("delivery_id") String str);
    
        @POST("/api/{api_version}/deliveries/{delivery_id}/resend_invoice_email")
        /* renamed from: h */
        C10099b mo29792h(@Path("delivery_id") String str);
    
        @POST("/api/{api_version}/deliveries/{delivery_id}/feedback")
        /* renamed from: i */
        C10127x<DeliveryFeedbackReport> mo29793i(@Path("delivery_id") String str, @Body RatingFeedback ratingFeedback);
    
        @POST("/api/{api_version}/deliveries/{delivery_id}/rating")
        /* renamed from: j */
        C10099b mo29794j(@Path("delivery_id") String str, @Body Rating rating);
    
        @POST("/api/{api_version}/deliveries/summary")
        /* renamed from: k */
        C10127x<List<Delivery>> mo29795k(@Body List<String> list);


        FAQ:
        
        @GET("/api/{api_version}/content/faq")
        /* renamed from: a */
        C10127x<PMLRoot> mo29796a();


        IMAGES:

        @POST("/api/{api_version}/images/{context}")
        /* renamed from: a */
        C10127x<ImageUploadResponse> mo29798a(@Path("context") String str, @Body RequestBody requestBody);


        MGM:

        @POST("/api/{api_version}/mgm/{mgmCode}/message")
        /* renamed from: a */
        C10113o<MgmMessage> mo29799a(@Path("mgmCode") String str, @Body Map<String, String> map);
    
        @GET("/api/{api_version}/mgm")
        /* renamed from: b */
        C10113o<MGM> mo29800b();


        MESSAGES:
        
        @GET("/api/{api_version}/messages")
        /* renamed from: a */
        C10127x<MessagesWrapper> mo29801a(@Query("display_position") List<String> list);


        MY STORE:

        @GET("/api/{api_version}/my_store")
        /* renamed from: a */
        C10127x<MyStore> mo29802a(@Query("depth") int i);
    
        @GET("/api/{api_version}/promotion/{promotionId}/category")
        /* renamed from: b */
        C10127x<ListItem> mo29803b(@Path("promotionId") String str);
    
        @GET("/api/{api_version}/search/")
        /* renamed from: c */
        C10127x<List<CategoryItem>> mo29804c(@Query("search_term") String str);
    
        @GET
        /* renamed from: d */
        C10127x<List<ListItem>> mo29805d(@Url String str);
    
        @GET("/api/{api_version}/suggest")
        /* renamed from: e */
        C10127x<List<SearchSuggestion>> mo29806e(@Query("search_term") String str);


        BLACKLIST:

        @HTTP(hasBody = true, method = "DELETE", path = "/api/{api_version}/user-products-blacklist")
        /* renamed from: a */
        C10099b mo29807a(@Body Map<String, String> map);
    
        @POST("/api/{api_version}/user-products-blacklist")
        /* renamed from: b */
        C10099b mo29808b(@Body Map<String, String> map);


        RECIPES:

        @GET("/api/{api_version}/recipes/{recipe_id}")
        /* renamed from: a */
        C10127x<Recipe> mo29809a(@Path("recipe_id") String str);


        REMINDERS:

        @PUT("/api/{api_version}/reminders")
        /* renamed from: a */
        C10099b mo29810a(@Body List<Reminder> list);
    
        @GET("/api/{api_version}/reminders")
        /* renamed from: b */
        C10127x<Reminders> mo29811b();

        
        TARGETED CONTENT:

        @GET("/api/{api_version}/content/search_empty_state")
        /* renamed from: a */
        C10127x<PMLRoot> mo29812a();


        USER DEFINED BUNDLES:

        @GET("/api/{api_version}/user-defined-bundles/{bundle_id}")
        /* renamed from: a */
        C10127x<UserDefinedBundle> mo29813a(@Path("bundle_id") String str);
    
        @DELETE("/api/{api_version}/user-defined-bundles/{bundle_id}")
        /* renamed from: b */
        C10099b mo29814b(@Path("bundle_id") String str);
    
        @POST("/api/{api_version}/user-defined-bundles")
        /* renamed from: c */
        C10099b mo29815c(@Body UpdatedUserDefinedBundle updatedUserDefinedBundle);
    
        @PUT("/api/{api_version}/user-defined-bundles/{bundle_id}/image")
        /* renamed from: d */
        C10099b mo29816d(@Path("bundle_id") String str, @Body Map<String, String> map);
    
        @PUT("/api/{api_version}/user-defined-bundles/{bundle_id}")
        /* renamed from: e */
        C10099b mo29817e(@Path("bundle_id") String str, @Body UpdatedUserDefinedBundle updatedUserDefinedBundle);


        CHECKOUT:

        @GET("/api/{api_version}/cart/checkout/order/{order_id}/status")
        /* renamed from: a */
        C10127x<C8217f> mo38705a(@Path("order_id") String str);
    
        @POST("/api/{api_version}/cart/checkout/order/{order_id}/confirm")
        /* renamed from: b */
        C10127x<C8211a> mo38706b(@Path("order_id") String str);


        PRODUCTS:
        
        @GET("/api/{api_version}/articles/{product_id}")
        w<ProductDetailsWrapper> a(@Path("product_id") String paramString);
        
        @GET("/api/{api_version}/promotion/{promotionId}/category")
        w<ListItem> e(@Path("promotionId") String paramString);
        
        @GET("api/{api_version}/templates/{template_id}/render")
        n<TemplatedPayload> f(@Path("template_id") String paramString);
        `;
