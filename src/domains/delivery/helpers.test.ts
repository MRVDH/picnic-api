import { extractDeliverySummaries } from "./helpers";

describe("extractDeliverySummaries", () => {
  it("sums totals over the orders and reads the window from the slot", () => {
    const [summary] = extractDeliverySummaries([
      {
        delivery_id: "delivery-1",
        status: "COMPLETED",
        creation_time: "2026-10-10T10:00:00.000+02:00",
        slot: { window_start: "2026-10-11T18:00:00.000+02:00", window_end: "2026-10-11T20:00:00.000+02:00" },
        orders: [
          { type: "ORDER", id: "order-1", total_price: 1000, total_count: 3 },
          { type: "ORDER", id: "order-2", checkout_total_price: 500, sellable_item_count: 2 },
        ],
      },
    ]);

    expect(summary).toEqual({
      id: "delivery-1",
      status: "COMPLETED",
      creationTime: "2026-10-10T10:00:00.000+02:00",
      windowStart: "2026-10-11T18:00:00.000+02:00",
      windowEnd: "2026-10-11T20:00:00.000+02:00",
      orderCount: 2,
      totalPrice: 1500,
      itemCount: 5,
    });
  });

  it("falls back to delivery_time, then eta2, for the window", () => {
    const [fromDeliveryTime] = extractDeliverySummaries([
      { id: "a", delivery_time: { start: "2026-10-12T08:00:00Z", end: "2026-10-12T10:00:00Z" } },
    ]);
    const [fromEta2] = extractDeliverySummaries([
      { id: "b", eta2: { start: "2026-10-13T08:00:00Z", end: "2026-10-13T10:00:00Z" } },
    ]);

    expect(fromDeliveryTime).toMatchObject({ windowStart: "2026-10-12T08:00:00Z", windowEnd: "2026-10-12T10:00:00Z" });
    expect(fromEta2).toMatchObject({ windowStart: "2026-10-13T08:00:00Z", windowEnd: "2026-10-13T10:00:00Z" });
  });

  it("defaults the status to COMPLETED and the id to the id field", () => {
    const [summary] = extractDeliverySummaries([{ id: "delivery-2", orders: [] }]);

    expect(summary).toMatchObject({ id: "delivery-2", status: "COMPLETED", orderCount: 0, totalPrice: 0, itemCount: 0 });
  });

  it("drops entries without an id and non-object entries", () => {
    const summaries = extractDeliverySummaries([{ status: "CURRENT" }, null, "delivery-3", { delivery_id: "delivery-3" }]);

    expect(summaries.map((summary) => summary.id)).toEqual(["delivery-3"]);
  });

  it("sorts newest first by window start, then creation time", () => {
    const summaries = extractDeliverySummaries([
      { id: "past", slot: { window_start: "2026-10-01T10:00:00Z" } },
      { id: "upcoming", slot: { window_start: "2026-10-20T10:00:00Z" } },
      { id: "no-window", creation_time: "2026-10-05T09:00:00Z" },
    ]);

    expect(summaries.map((summary) => summary.id)).toEqual(["upcoming", "no-window", "past"]);
  });

  it("returns an empty list when the body is not an array", () => {
    expect(extractDeliverySummaries({ unexpected: true })).toEqual([]);
    expect(extractDeliverySummaries(null)).toEqual([]);
  });
});
