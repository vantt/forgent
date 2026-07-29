import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeCursor, decodeCursor, paginate } from '../../src/state/cursor.mjs';

// cursor.mjs is pure over a plain array of {id, ...} objects, same fixture
// shape as impact.mjs/candidates.mjs's own tests (a hand-built `id`-bearing
// item, no dependency on a real view or store).
function item(id, extra = {}) {
  return { id, ...extra };
}

test('paginate() with neither cursor nor limit returns the full array unchanged, nextCursor null', () => {
  const items = [item('a'), item('b'), item('c')];
  const result = paginate(items, {});
  assert.deepEqual(result.items, items);
  assert.equal(result.nextCursor, null);
});

test('paginate() with no options object at all (same as {}) is the same passthrough', () => {
  const items = [item('a'), item('b')];
  const result = paginate(items);
  assert.deepEqual(result.items, items);
  assert.equal(result.nextCursor, null);
});

test('paginate() with only limit returns exactly that many items from the start, non-null nextCursor', () => {
  const items = [item('a'), item('b'), item('c'), item('d')];
  const result = paginate(items, { limit: 2, order: 'test-v1' });
  assert.deepEqual(result.items.map((i) => i.id), ['a', 'b']);
  assert.ok(typeof result.nextCursor === 'string' && result.nextCursor.length > 0);
});

test('paginate() with a limit reaching the end of the array returns nextCursor null', () => {
  const items = [item('a'), item('b')];
  const result = paginate(items, { limit: 50, order: 'test-v1' });
  assert.deepEqual(result.items.map((i) => i.id), ['a', 'b']);
  assert.equal(result.nextCursor, null);
});

test('paginate() omitting limit but giving a cursor defaults the page size to 50', () => {
  const items = Array.from({ length: 60 }, (_, i) => item(`id-${i}`));
  const first = paginate(items, { limit: 1, order: 'test-v1' });
  const second = paginate(items, { cursor: first.nextCursor, order: 'test-v1' });
  assert.equal(second.items.length, 50);
  assert.equal(second.items[0].id, 'id-1');
});

test('paginate() round-trip: the next page continues exactly where the first left off, no overlap, no gap', () => {
  const items = [item('a'), item('b'), item('c'), item('d'), item('e')];
  const firstPage = paginate(items, { limit: 2, order: 'test-v1' });
  assert.deepEqual(firstPage.items.map((i) => i.id), ['a', 'b']);
  assert.ok(firstPage.nextCursor);

  const secondPage = paginate(items, { cursor: firstPage.nextCursor, limit: 2, order: 'test-v1' });
  assert.deepEqual(secondPage.items.map((i) => i.id), ['c', 'd']);
  assert.ok(secondPage.nextCursor);

  const thirdPage = paginate(items, { cursor: secondPage.nextCursor, limit: 2, order: 'test-v1' });
  assert.deepEqual(thirdPage.items.map((i) => i.id), ['e']);
  assert.equal(thirdPage.nextCursor, null);
});

test('encodeCursor/decodeCursor round-trip preserves order and lastId', () => {
  const token = encodeCursor({ order: 'ready-v1', lastId: 'work-42' });
  const decoded = decodeCursor(token, [item('work-42')]);
  assert.deepEqual(decoded, { order: 'ready-v1', lastId: 'work-42' });
});

test('decodeCursor throws StoreError(validation) on a garbage (non-base64-JSON) string', () => {
  assert.throws(
    () => decodeCursor('not-a-real-cursor!!'),
    (err) => err.name === 'StoreError' && err.category === 'validation',
  );
});

test('decodeCursor throws StoreError(validation) on valid base64 that is not valid JSON', () => {
  const notJson = Buffer.from('this is not json', 'utf8').toString('base64');
  assert.throws(
    () => decodeCursor(notJson),
    (err) => err.name === 'StoreError' && err.category === 'validation',
  );
});

test('decodeCursor throws StoreError(validation) on a well-formed cursor whose lastId is no longer in the current items, and the message states the remedy', () => {
  const token = encodeCursor({ order: 'ready-v1', lastId: 'gone-item' });
  assert.throws(
    () => decodeCursor(token, [item('still-here')]),
    (err) => err.name === 'StoreError' && err.category === 'validation' && /re-issue the call without --cursor/.test(err.message),
  );
});

test('paginate() surfaces the same stale-cursor validation error when a page has moved on', () => {
  const token = encodeCursor({ order: 'test-v1', lastId: 'no-longer-present' });
  assert.throws(
    () => paginate([item('a'), item('b')], { cursor: token }),
    (err) => err.name === 'StoreError' && err.category === 'validation' && /re-issue the call without --cursor/.test(err.message),
  );
});
