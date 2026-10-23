/** Made-up Fusion components in the structure of the promotions and favorites pages, for tests. */

const text = (markdown: string, extra: Record<string, unknown> = {}) => ({ type: "RICH_TEXT", markdown, ...extra });
const row = (...texts: unknown[]) => ({ type: "STACK", axis: "HORIZONTAL", children: texts });

export type TileOptions = {
  id: string;
  name: string;
  shownName?: string;
  qualityCue?: string;
  brand?: string;
  unitQuantity?: string;
  price?: number;
  promotion?: { label: string; originalPrice?: number };
  priceRanges?: { price: number; from_quantity: number }[];
};

/** A product tile: the selling unit, the image with labels, and the info column. */
export function fusionTile(options: TileOptions) {
  const unitQuantity = options.unitQuantity ?? "1 stuk";
  const price = options.price ?? 199;
  const contexts: unknown[] = [{ schema: "iglu:tech.picnic.snowplow.analytics/product/jsonschema/1-0-0", data: { product_id: options.id } }];
  if (options.promotion) {
    contexts.push({
      schema: "iglu:tech.picnic.snowplow.analytics/promotion/jsonschema/1-1-0",
      data: {
        promotion_label: options.promotion.label,
        price,
        strikethrough_price: options.promotion.originalPrice ?? price,
        show_strikethrough_price: options.promotion.originalPrice !== undefined,
      },
    });
  }
  const column = [
    ...(options.qualityCue ? [row(text(`#(#5b534e)${options.qualityCue}#(#5b534e)`))] : []),
    { type: "RICH_TEXT", children: [text(`#(#333333)${options.shownName ?? options.name}#(#333333) `), text(">")] },
    { type: "CONTAINER", child: row(text((price / 100).toFixed(2))) },
    ...(options.brand ? [row(text(`#(#787570)${options.brand}#(#787570)`))] : []),
    row(text("Klein"), text(unitQuantity)),
  ];
  const labels = options.promotion
    ? [{ type: "CONTAINER", absolutePosition: { bottom: 8, left: 8 }, child: { type: "CONTAINER", backgroundColor: "#fbd92b", child: text(options.promotion.label) } }]
    : [];

  return {
    type: "PML",
    id: `selling-unit-${options.id}-tile`,
    analytics: { contexts },
    content: {
      type: "SELLING_UNIT_TILE",
      sellingUnit: {
        id: options.id,
        name: options.name,
        image_id: `image-${options.id}`,
        display_price: price,
        unit_quantity: unitQuantity,
        max_count: 50,
        decorators: [],
        price_ranges: options.priceRanges ?? [{ price, from_quantity: 1 }],
      },
    },
    pml: {
      component: {
        type: "STACK",
        children: [
          {
            type: "CONTAINER",
            child: {
              type: "TOUCHABLE",
              onPress: { actionType: "EVENT", action: { type: "SELLING_UNIT_MUTATION", mutation: "ADD", quantity: 1, sellingUnitId: options.id } },
              child: { type: "CONTAINER", child: { id: "selling-unit-label-container", type: "ANIMATION_CONTAINER", child: { type: "STACK", children: labels } } },
            },
          },
          {
            type: "CONTAINER",
            child: {
              type: "TOUCHABLE",
              onPress: { actionType: "OPEN", target: `app.picnic://store/page;id=product-details-page-root,id=${options.id}` },
              child: { type: "STACK", padding: { top: 8 }, children: column },
            },
          },
        ],
      },
    },
  };
}

/** A promotion group card, linking to its `promo-group-deep-dive` page. */
export function fusionGroupCard(id: string, name: string, example: string, label: string) {
  return {
    type: "PML",
    id: `campaign-promo-group-list-element-${id}`,
    analytics: {
      contexts: [
        {
          schema: "iglu:tech.picnic.snowplow.analytics/pml_component/jsonschema/1-1-0",
          data: { type: "promo_list_element", deeplink: `app.picnic://store/page;id=promo-group-deep-dive,promo_group_id=${id}` },
        },
      ],
    },
    pml: {
      component: {
        type: "CONTAINER",
        backgroundColor: "#e7ecd7",
        borderRadius: 8,
        child: {
          type: "STACK",
          children: [text(name), text(example), { type: "CONTAINER", backgroundColor: "#fbd92b", borderRadius: 4, child: text(label) }, text("per stuk")],
        },
      },
    },
  };
}

/** A section header of the promotions and favorites pages. */
export const fusionHeader = (id: string, title: string) => ({ type: "PML", id, pml: { component: text(`#(#333333)${title}#(#333333)`, { textType: "HEADER4" }) } });

/** A marker component between the sections of the promotions page. */
export const fusionMarker = (id: string) => ({ type: "PML", id, pml: { component: { type: "CONTAINER" } } });
