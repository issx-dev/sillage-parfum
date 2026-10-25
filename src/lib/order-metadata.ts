/**
 * Stripe limits each metadata value to 500 characters, so the order items
 * JSON is split across `items`, `items_1`, `items_2`, ... and rejoined here.
 */
const CHUNK = 500;

export function encodeItemsMetadata(items: unknown[]): Record<string, string> {
  const json = JSON.stringify(items);
  const out: Record<string, string> = {};
  for (let i = 0, n = 0; i < json.length; i += CHUNK, n++) {
    out[n === 0 ? "items" : `items_${n}`] = json.slice(i, i + CHUNK);
  }
  return out;
}

export function decodeItemsMetadata(
  metadata: Record<string, string> | null | undefined
): string | undefined {
  if (!metadata?.items) return undefined;
  let json = metadata.items;
  for (let n = 1; metadata[`items_${n}`] !== undefined; n++) json += metadata[`items_${n}`];
  return json;
}
