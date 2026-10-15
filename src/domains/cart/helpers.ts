import { DeliverySlot, DeliverySlotOverview, DeliverySlotSummary, GetDeliverySlotsResult, SelectedSlot, SelectedSlotSummary } from "./types";

const windowDuration = (slot: DeliverySlotSummary): number => new Date(slot.windowEnd).getTime() - new Date(slot.windowStart).getTime();

function toSlotSummary(slot: DeliverySlot): DeliverySlotSummary {
  return {
    slotId: slot.slot_id,
    windowStart: slot.window_start,
    windowEnd: slot.window_end,
    cutOffTime: slot.cut_off_time,
    isAvailable: slot.is_available,
    isSelected: slot.selected,
    isGreenChoice: false,
    minimumOrderValue: slot.minimum_order_value ?? null,
  };
}

/**
 * Returns the ids of the green-choice slots. Picnic offers some start times twice, as a regular and a longer window;
 * the longer one is the green choice. Start times with one slot, or two slots of equal length, have no green choice.
 */
function findGreenChoiceSlotIds(slots: DeliverySlotSummary[]): Set<string> {
  const byWindowStart = new Map<string, DeliverySlotSummary[]>();
  for (const slot of slots) {
    byWindowStart.set(slot.windowStart, [...(byWindowStart.get(slot.windowStart) ?? []), slot]);
  }

  const greenSlotIds = new Set<string>();
  for (const group of byWindowStart.values()) {
    if (group.length !== 2) continue;
    const [a, b] = group;
    if (windowDuration(a) > windowDuration(b)) greenSlotIds.add(a.slotId);
    else if (windowDuration(b) > windowDuration(a)) greenSlotIds.add(b.slotId);
  }
  return greenSlotIds;
}

function toSelectedSlotSummary(selected: SelectedSlot | null, slots: DeliverySlotSummary[]): SelectedSlotSummary | null {
  if (!selected) return null;

  const slot = slots.find((s) => s.slotId === selected.slot_id);
  return {
    slotId: selected.slot_id,
    state: selected.state,
    windowStart: slot?.windowStart ?? null,
    windowEnd: slot?.windowEnd ?? null,
    isExplicitSelection: selected.state !== "IMPLICIT",
  };
}

/**
 * Turns a delivery slots response into a {@link DeliverySlotOverview}: camelCase slots with the green-choice flag, and
 * the selected slot with its window.
 */
export function extractDeliverySlots(result: Pick<GetDeliverySlotsResult, "delivery_slots" | "selected_slot">): DeliverySlotOverview {
  const slots = result.delivery_slots.map(toSlotSummary);

  const greenSlotIds = findGreenChoiceSlotIds(slots);
  for (const slot of slots) slot.isGreenChoice = greenSlotIds.has(slot.slotId);

  return { slots, selectedSlot: toSelectedSlotSummary(result.selected_slot, slots) };
}
