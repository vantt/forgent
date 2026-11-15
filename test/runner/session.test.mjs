import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { createSession, endSession } from '../cli/helpers/fgos-cli-harness.mjs';
import { listSessions } from '../../src/runner/session.mjs';

// The session registry, its worktrees and the four verbs belong to the Rust host: their behaviour is proved by
// `apps/fgos/src/wiring/session.rs` (temp repos, real Git) and the shared registry rows of the identity writer
// contract. What stays here is the one Node reader's door, `listSessions`, asked of the real host.

test('listSessions asks the host for the registry of the project it is given, whatever the cwd', () => {
  const repoRoot = initFixtureRepo(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-session-client-')));
  const ids = [];
  try {
    assert.deepEqual(listSessions(repoRoot), []);
    ids.push(createSession(repoRoot).sessionId, createSession(repoRoot, { itemId: 'tsk-1' }).sessionId);
    const rows = listSessions(repoRoot);
    assert.deepEqual(rows.map((row) => row.sessionId).sort(), [...ids].sort());
    // The raw registry rows, not a projection: the recorded process identity comes through.
    assert.ok(rows.every((row) => typeof row.record?.host === 'string'));
    assert.equal(rows.find((row) => row.itemId === 'tsk-1')?.sessionId, ids[1]);
    for (const id of ids.splice(0)) endSession(repoRoot, id, { force: true });
    assert.deepEqual(listSessions(repoRoot), [], 'an ended session leaves the registry');
  } finally {
    for (const id of ids) endSession(repoRoot, id, { force: true });
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});
