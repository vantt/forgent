import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
import { closeSessionByQuorum } from '../../src/runner/coordination/session-engine.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { recordDriverDisposition } from '../../src/runner/coordination/store.mjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

test('Legacy (Schema 1) Coordination Session Compatibility', async (t) => {
  const fixtureDir = path.join(__dirname, '../fixtures/coordination-legacy-schema-1-session');

  const fakeFgosDir = path.join(__dirname, '../fixtures/fake-fgos-dir-' + Date.now());
  const sessionsDir = path.join(fakeFgosDir, '.fgos/coordination/sessions');
  const sessionDir = path.join(sessionsDir, 'legacy-session-123');

  fs.mkdirSync(sessionDir, { recursive: true });
  fs.copyFileSync(path.join(fixtureDir, 'session.json'), path.join(sessionDir, 'session.json'));
  fs.copyFileSync(path.join(fixtureDir, 'events.jsonl'), path.join(sessionDir, 'events.jsonl'));

  const assignmentsDir = path.join(fakeFgosDir, '.fgos/assignments/asg-123');
  fs.mkdirSync(assignmentsDir, { recursive: true });
  fs.writeFileSync(path.join(assignmentsDir, 'assignment.json'), JSON.stringify({
    assignmentId: "asg-123",
    status: "active"
  }));

  const engineOpts = {
    cwd: fakeFgosDir,
    repoRoot: fakeFgosDir,
  };

  t.after(() => {
    fs.rmSync(fakeFgosDir, { recursive: true, force: true });
  });

  await t.test('replaySession on legacy schema (Schema 1) does not mandate snapshotRef', () => {
    const { manifest, events, quorum } = replaySession('legacy-session-123', engineOpts);

    assert.strictEqual(manifest.schemaVersion, '1');
    assert.strictEqual(manifest.snapshotRef, undefined);
    assert.strictEqual(events.length, 4);

    const asg123 = events.find(e => e.type === 'driver-disposition-recorded');
    assert.ok(asg123);
    assert.strictEqual(asg123.payload.disposition, 'accepted');
  });

  await t.test('recordDriverDisposition on legacy schema deduplicates by full payload canonicalization', () => {
    const duplicatePayload = {
      targetRef: 'asg-123',
      disposition: 'accepted',
      rationale: 'I agree',
      evidenceRefs: [],
      authorizedBy: { type: 'driver', id: 'tester-1' }
    };

    const resDuplicate = recordDriverDisposition('legacy-session-123', duplicatePayload, engineOpts);
    assert.strictEqual(resDuplicate.appended, false);

    const differentPayload = {
      ...duplicatePayload,
      rationale: 'I changed my mind'
    };

    const resDifferent = recordDriverDisposition('legacy-session-123', differentPayload, engineOpts);
    assert.strictEqual(resDifferent.appended, true);
  });

  await t.test('closeSessionByQuorum on legacy schema works (does not crash on snapshot read)', () => {
    let errCatched = null;
    try {
      closeSessionByQuorum('legacy-session-123', { type: 'driver', id: 'tester-1' }, engineOpts);
    } catch (err) {
      errCatched = err;
    }

    assert.ok(errCatched);
    assert.notStrictEqual(errCatched.category, 'schema-version-mismatch');
  });
});
