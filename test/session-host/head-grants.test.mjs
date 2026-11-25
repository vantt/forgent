// The wiring proof of the cage-size port: `grantOf` answers a persona's writes, mailbox and peers from the addon's
// `sessionHost` door. The table itself (rows, inheritance, parity of the cage sizes) is proven in
// packages/session-host/rust/tests/permissions.rs; this only proves the port reaches it.
import '../helpers/process-tmp-root.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';

import { ensureGitAddon } from '../helpers/git-addon.mjs';
import { grantOf, headPersonas, holdsHeadTable } from '../../src/session-host/head-grants.mjs';

ensureGitAddon();

test('the port answers a persona its cage size from the permission table, and a persona the table does not name holds nothing', () => {
  assert.deepEqual(grantOf('head:secretary-x', 'secretary'), { writes: ['plans', 'plans/backlog.md', 'plans/backlog/*'], mailbox: true, peers: true });
  assert.deepEqual(grantOf('head:planner-x', 'planner'), { writes: ['plans'], mailbox: false, peers: false });
  assert.deepEqual(grantOf('head:lead-x', 'lead', { planDir: '261122-0118-test' }), { writes: ['plans/261122-0118-test'], mailbox: false, peers: false });
  assert.deepEqual(grantOf('head:nobody-x', 'nobody'), { writes: [], mailbox: false, peers: false });
  assert.deepEqual([...headPersonas()].sort(), ['lead', 'planner', 'secretary', 'shaper', 'supervisor']);
  assert.equal(holdsHeadTable('planner'), true);
  assert.equal(holdsHeadTable('head'), false, 'the shared base of the table is not a persona');
});
