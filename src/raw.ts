/** Readers for untyped JSON from Picnic: each returns the value when it has the expected type. */

export type RawRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is RawRecord => typeof value === "object" && value !== null && !Array.isArray(value);

/** The value when it is an object, else `null`. */
export const asRecord = (value: unknown): RawRecord | null => (isRecord(value) ? value : null);

/** The value when it is an object, else an empty object, so its fields can be read without a check. */
export const recordOf = (value: unknown): RawRecord => (isRecord(value) ? value : {});

export const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** The objects in a list; other items are left out. */
export const asRecords = (value: unknown): RawRecord[] => asArray(value).filter(isRecord);

/** The value when it is a non-empty string, else `null`. */
export const asString = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);
