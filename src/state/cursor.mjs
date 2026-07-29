// cursor.mjs — opaque pagination cursor for the fgOS CLI's self-describing
// verb surface (str46-io-contract D5/D35). PURE: no fs/git imports, same
// purity discipline as frontier.mjs/impact.mjs/candidates.mjs — this module
// only ever operates on the array it is handed.
//
// Why opaque (per plan.md's Approach, "con trỏ đục"): `ready`/`triage`/
// `evolve`/`list`'s `view.work` each have their OWN internal ordering
// (declaration order, `blocks` descending, `score` descending, insertion
// order respectively) and none of them are keyed by the log's monotonic
// `seq`. A cursor that encoded a serial key would force the contract to
// expose — and freeze — each verb's internal sort order. Instead the cursor
// is a base64-wrapped JSON blob carrying only an `order` tag (which ordering
// scheme produced it — for the caller to treat as opaque, never parsed) and
// `lastId` (the id of the last item the caller was already given). The
// server re-derives the real order fresh on every call and relocates
// `lastId` in it — the caller never computes or interprets a position
// itself.

import { StoreError } from './store.mjs';

const DEFAULT_LIMIT = 50;

const CURSOR_MALFORMED_MESSAGE =
  'cursor is malformed — re-issue the call without --cursor to restart from the beginning.';

function staleCursorMessage(lastId) {
  return `cursor points past item "${lastId}", which is no longer in the current result set — re-issue the call without --cursor to restart from the beginning.`;
}

/**
 * Encode `{ order, lastId }` into an opaque cursor token. The caller never
 * constructs or reads this string directly — it only ever passes it back
 * verbatim on the next call.
 */
export function encodeCursor({ order, lastId }) {
  return Buffer.from(JSON.stringify({ order, lastId }), 'utf8').toString('base64');
}

/**
 * Decode a cursor token back into `{ order, lastId }`.
 *
 * Throws `StoreError('validation', ...)` — never silently defaults — on any
 * non-string/empty input, on base64 that does not decode to valid JSON, and
 * on a well-formed `{order, lastId}` shape whose `lastId` is missing. When
 * `orderedItems` (the freshly recomputed, current-call order) is passed, a
 * `lastId` no longer present in it is a STALE cursor — classified
 * 'validation' (never 'conflict', which store.mjs reserves for write-side
 * CAS expected-status mismatches, an unrelated write-time concept) — and the
 * message states its own remedy (restart without --cursor) rather than
 * reading like a caller mistake, since the caller did nothing wrong: the
 * item it was paging through simply left the result set between calls.
 */
export function decodeCursor(token, orderedItems) {
  if (typeof token !== 'string' || token.length === 0) {
    throw new StoreError('validation', CURSOR_MALFORMED_MESSAGE);
  }
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
  } catch {
    throw new StoreError('validation', CURSOR_MALFORMED_MESSAGE);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || typeof parsed.order !== 'string' || typeof parsed.lastId !== 'string' || !parsed.lastId) {
    throw new StoreError('validation', CURSOR_MALFORMED_MESSAGE);
  }
  if (Array.isArray(orderedItems) && !orderedItems.some((item) => item?.id === parsed.lastId)) {
    throw new StoreError('validation', staleCursorMessage(parsed.lastId));
  }
  return { order: parsed.order, lastId: parsed.lastId };
}

/**
 * Page through `orderedItems` (an array of objects each carrying an `id`,
 * already sorted in the caller's own order — this function never sorts).
 *
 * Neither `cursor` nor `limit` given: `items` is `orderedItems` unchanged and
 * `nextCursor` is `null` — byte-identical to no-pagination behavior (D35).
 *
 * `cursor` given: decoded (and validated against `orderedItems` — a stale
 * `lastId` throws, per `decodeCursor` above) to find where the prior page
 * left off; the new page starts immediately after that item.
 *
 * `limit` bounds the page size (default 50 when cursor/limit was given but
 * limit was omitted). `nextCursor` is `null` once the page reaches the end
 * of `orderedItems`, else an opaque cursor naming `order` (the tag the
 * caller passed in — each verb's own literal, e.g. `'ready-v1'`) and the id
 * of the last item in this page.
 */
export function paginate(orderedItems, { cursor, limit, order } = {}) {
  if (cursor === undefined && limit === undefined) {
    return { items: orderedItems, nextCursor: null };
  }
  const effectiveLimit = limit ?? DEFAULT_LIMIT;
  let startIndex = 0;
  if (cursor !== undefined) {
    const decoded = decodeCursor(cursor, orderedItems);
    // decodeCursor above already threw if decoded.lastId isn't present, so
    // this findIndex always succeeds — it exists only to locate the page
    // boundary, not to re-validate presence.
    startIndex = orderedItems.findIndex((item) => item?.id === decoded.lastId) + 1;
  }
  const page = orderedItems.slice(startIndex, startIndex + effectiveLimit);
  const reachedEnd = startIndex + page.length >= orderedItems.length;
  const nextCursor = reachedEnd || page.length === 0 ? null : encodeCursor({ order, lastId: page[page.length - 1].id });
  return { items: page, nextCursor };
}
