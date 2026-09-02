// coordination-headless-adapter-identity.test.mjs -- Step 08 Phase 07 R4:
// proves the headless adapter (src/runner/coordination/headless-adapter.mjs)
// calls the EXACT SAME engine entry point the interactive CLI calls
// (src/verbs/coordination/run.mjs's `runCoordinationUseCase`), never a
// forked or re-derived copy. Two independent proofs, mirroring this
// track's own established "single execution core" static-test precedent
// (test/runner/coordination-static.test.mjs):
// - a runtime reference-identity check (`===`) -- the strongest possible
//   proof, since two functions can behave identically while still being
//   two distinct objects; reference equality can only hold if the module
//   graph resolves to the literal same function;
// - a static import-specifier check -- the headless adapter's own source
//   text must import `runCoordinationUseCase` from the real
//   `src/verbs/coordination/run.mjs` file, never a copy/sibling path.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import { runCoordinationHeadless, __runCoordinationEngineEntryPoint } from '../../src/runner/coordination/headless-adapter.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('headless-adapter.mjs re-exports the literal SAME runCoordinationUseCase function object the CLI verb module exports (reference identity)', () => {
  assert.strictEqual(
    __runCoordinationEngineEntryPoint,
    runCoordinationUseCase,
    'the headless adapter must call through the exact same function reference as the interactive CLI path, never a lookalike or a forked copy',
  );
});

test('runCoordinationHeadless is a thin wrapper: it forwards to runCoordinationUseCase with only invocation-lifecycle differences, never a second copy of dispatch logic', () => {
  // Function.length/name/toString-based static shape checks: a genuine
  // "thin door" wrapper is short and contains no engine-shaped keywords
  // (dispatch/schema/quorum/budget/evidence) of its own -- those all live
  // exclusively in runCoordinationUseCase (run.mjs), never duplicated here.
  const source = runCoordinationHeadless.toString();
  assert.ok(source.includes('runCoordinationUseCase'), 'runCoordinationHeadless must call runCoordinationUseCase directly');
  for (const forbidden of ['dispatchPrimaryTask', 'dispatchDeclaredOperation', 'dispatchResearchFanOut', 'evaluateSessionQuorum', 'closeSessionByQuorum', 'openStandaloneSession', 'openDeclaredProtocolSession']) {
    assert.ok(!source.includes(forbidden), `runCoordinationHeadless's own source must never call ${forbidden} directly -- that would be a forked dispatch path, not a thin door onto runCoordinationUseCase`);
  }
});

test('headless-adapter.mjs\'s own import specifier for runCoordinationUseCase resolves to the real src/verbs/coordination/run.mjs (static check, mirrors coordination-static.test.mjs\'s own import-substring precedent)', () => {
  const adapterPath = path.join(repoRoot, 'src/runner/coordination/headless-adapter.mjs');
  const source = fs.readFileSync(adapterPath, 'utf8');
  const importMatch = source.match(/import\s*\{\s*runCoordinationUseCase\s*\}\s*from\s*['"]([^'"]+)['"]/);
  assert.ok(importMatch, 'expected a named import of runCoordinationUseCase in headless-adapter.mjs');
  const resolved = path.normalize(path.join(path.dirname(adapterPath), importMatch[1]));
  assert.equal(resolved, path.join(repoRoot, 'src/verbs/coordination/run.mjs'));
});

test('runCoordinationHeadless accepts an in-memory request object directly (no file round-trip) -- the invocation-lifecycle difference R4 permits', async () => {
  await assert.rejects(
    () => runCoordinationHeadless({ kind: 'agent-led' }, { ctx: {} }),
    // Rejected by validateCoordinationRequest (missing required fields) --
    // proves the object flowed all the way into the SAME schema-boundary
    // validation the CLI's file-based `--file` path also runs, not a
    // separate/looser headless-only path.
    (err) => /objective/.test(err.message) || /writerId/.test(err.message) || /primaryRole/.test(err.message),
  );
});

test('runCoordinationHeadless accepts a file path too (same door the CLI itself uses)', async () => {
  await assert.rejects(
    () => runCoordinationHeadless('/nonexistent/path/to/request.json', { ctx: {} }),
    /request file not found/,
  );
});
