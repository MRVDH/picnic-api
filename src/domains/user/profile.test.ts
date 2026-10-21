import { extractProfile } from "./profile";

describe("extractProfile", () => {
  it("reads the user, address and menu from the profile page content", () => {
    const profile = extractProfile({
      pageId: "profile-root",
      tokens: {},
      nodes: [
        {
          id: "page-0",
          component: "page",
          modulePath: "./pages/profile/page.tsx",
          props: {},
          children: [
            {
              id: "user-info-1",
              component: "user-info",
              modulePath: "./pages/profile/user-info.tsx",
              props: {
                user: {
                  firstName: "Jan",
                  lastName: "Jansen",
                  avatarUrl: "https://example.com/avatar.png",
                  hasMembership: true,
                  preferredAddress: { street: "Dorpsstraat", houseNumber: 1, houseNumberExtension: null, postcode: "1234 AB", city: "Amsterdam" },
                },
              },
              children: [],
            },
            { id: "menu-list-2", component: "menu-list", modulePath: "./pages/profile/menu-list.tsx", props: { items: [{ id: "orders", deeplink: "app.picnic://orders" }, { id: "" }] }, children: [] },
          ],
        },
      ],
    });

    expect(profile).toEqual({
      firstName: "Jan",
      lastName: "Jansen",
      avatarUrl: "https://example.com/avatar.png",
      hasMembership: true,
      address: { street: "Dorpsstraat", houseNumber: 1, houseNumberExtension: null, postcode: "1234 AB", city: "Amsterdam" },
      menu: [{ id: "orders", deeplink: "app.picnic://orders" }],
    });
  });
});
