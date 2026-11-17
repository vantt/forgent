// How a controller gives a pane back through the Session Host (the port's own cases are owned by the
// session-host crate and its client test).
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retirePane, closeLivePane } from '../../src/runner/dispatch/herdr-round.mjs';

// A fake of the Session Host client: what it was asked, answering as the port would.
function fakeHost({ alive = 'live', retire = 'retired' } = {}) {
  const calls = [];
  return {
    calls,
    alive: (placement) => { calls.push(['alive', placement]); return { result: alive }; },
    retire: (placement, disposition) => { calls.push(['retire', placement, disposition]); return { result: retire }; },
  };
}

test('a controller gives a pane back through the host by its key, and only a live pane is closed by a probe', () => {
  const host = fakeHost();
  assert.equal(retirePane(host, 'att-1'), true);
  assert.deepEqual(host.calls, [['retire', { host: 'terminal', key: 'att-1' }, 'close']]);

  const live = fakeHost();
  assert.equal(closeLivePane(live, 'att-2'), true);
  assert.deepEqual(live.calls.map((c) => c[0]), ['alive', 'retire']);

  const gone = fakeHost({ alive: 'gone' });
  assert.equal(closeLivePane(gone, 'att-3'), false, 'a pane a settled round already closed is not closed by the probe');
  assert.deepEqual(gone.calls.map((c) => c[0]), ['alive']);

  assert.equal(retirePane(fakeHost({ retire: 'unknown' }), 'att-4'), false, 'a refusal is not a retirement');
});
