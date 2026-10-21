import { CartService } from "./service";
import HttpClient from "../../http-client";
import { PageClient } from "../../pages/page-client";

const mockFetch = jest.fn();
global.fetch = mockFetch;

let cart: CartService;

beforeEach(() => {
  mockFetch.mockReset();
  const http = new HttpClient({ authKey: "initial-auth-key" });
  cart = new CartService(http, new PageClient(http));
});

describe("CartService - getDeliverySlots", () => {
  it("fetches the delivery slots and returns them parsed", async () => {
    const slot = (id: string, end: string) => ({
      slot_id: id,
      window_start: "2026-10-17T18:00:00.000+02:00",
      window_end: end,
      cut_off_time: "2026-10-16T22:00:00.000+02:00",
      is_available: true,
      selected: false,
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: {},
      json: () =>
        Promise.resolve({
          delivery_slots: [slot("regular", "2026-10-17T19:00:00.000+02:00"), slot("green", "2026-10-17T20:00:00.000+02:00")],
          selected_slot: { slot_id: "green", state: "EXPLICIT" },
        }),
    });

    const slots = await cart.getDeliverySlots();

    expect(mockFetch.mock.calls[0][0]).toMatch(/\/cart$/);
    expect(slots.slots.map((s) => [s.slotId, s.isGreenChoice])).toEqual([
      ["regular", false],
      ["green", true],
    ]);
    expect(slots.selectedSlot).toMatchObject({ slotId: "green", windowEnd: "2026-10-17T20:00:00.000+02:00", isExplicitSelection: true });
  });
});
