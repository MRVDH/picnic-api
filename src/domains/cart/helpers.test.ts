import { extractDeliverySlots } from "./helpers";
import { RawDeliverySlot } from "./types";

const slot = (id: string, start: string, end: string, extra: Partial<RawDeliverySlot> = {}): RawDeliverySlot => ({
  slot_id: id,
  hub_id: "hub",
  fc_id: "fc",
  window_start: start,
  window_end: end,
  cut_off_time: "2026-10-16T22:00:00.000+02:00",
  is_available: true,
  selected: false,
  reserved: false,
  slot_characteristics: [],
  ...extra,
});

describe("extractDeliverySlots", () => {
  it("maps slots to camelCase fields", () => {
    const { slots } = extractDeliverySlots({
      delivery_slots: [slot("a", "2026-10-17T18:00:00.000+02:00", "2026-10-17T19:00:00.000+02:00", { minimum_order_value: 3500, selected: true })],
      selected_slot: { slot_id: "a", state: "EXPLICIT" },
    });

    expect(slots).toEqual([
      {
        slotId: "a",
        windowStart: "2026-10-17T18:00:00.000+02:00",
        windowEnd: "2026-10-17T19:00:00.000+02:00",
        cutOffTime: "2026-10-16T22:00:00.000+02:00",
        isAvailable: true,
        isSelected: true,
        isGreenChoice: false,
        minimumOrderValue: 3500,
      },
    ]);
  });

  it("marks the longer of two slots with the same start as the green choice", () => {
    const { slots } = extractDeliverySlots({
      delivery_slots: [
        slot("regular", "2026-10-17T18:00:00.000+02:00", "2026-10-17T19:00:00.000+02:00"),
        slot("green", "2026-10-17T18:00:00.000+02:00", "2026-10-17T20:00:00.000+02:00"),
        slot("single", "2026-10-17T20:00:00.000+02:00", "2026-10-17T21:00:00.000+02:00"),
        slot("equal-1", "2026-10-17T21:00:00.000+02:00", "2026-10-17T22:00:00.000+02:00"),
        slot("equal-2", "2026-10-17T21:00:00.000+02:00", "2026-10-17T22:00:00.000+02:00"),
      ],
      selected_slot: { slot_id: "regular", state: "IMPLICIT" },
    });

    expect(slots.filter((s) => s.isGreenChoice).map((s) => s.slotId)).toEqual(["green"]);
  });

  it("adds the window to the selected slot and tells an implicit selection apart", () => {
    const delivery_slots = [slot("a", "2026-10-17T18:00:00.000+02:00", "2026-10-17T19:00:00.000+02:00")];

    expect(extractDeliverySlots({ delivery_slots, selected_slot: { slot_id: "a", state: "EXPLICIT" } }).selectedSlot).toEqual({
      slotId: "a",
      state: "EXPLICIT",
      windowStart: "2026-10-17T18:00:00.000+02:00",
      windowEnd: "2026-10-17T19:00:00.000+02:00",
      isExplicitSelection: true,
    });
    expect(extractDeliverySlots({ delivery_slots, selected_slot: { slot_id: "a", state: "IMPLICIT" } }).selectedSlot?.isExplicitSelection).toBe(false);
    expect(extractDeliverySlots({ delivery_slots, selected_slot: { slot_id: "unknown", state: "ACTIVE" } }).selectedSlot).toMatchObject({
      windowStart: null,
      windowEnd: null,
    });
  });

  it("sets the minimum order value to null when the API sends none", () => {
    const { slots } = extractDeliverySlots({
      delivery_slots: [slot("a", "2026-10-17T18:00:00.000+02:00", "2026-10-17T19:00:00.000+02:00")],
      selected_slot: { slot_id: "a", state: "IMPLICIT" },
    });

    expect(slots[0].minimumOrderValue).toBeNull();
  });
});
