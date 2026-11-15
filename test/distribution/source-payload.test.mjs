import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listLegacyNodeSourceFiles, REPO_ROOT } from '../../scripts/build-rust-distribution.mjs';
import { OWN_CLI } from '../../src/util/spawn-detached-fgos.mjs';
import path from 'node:path';

// The selection rule has one owner, `packages/distribution/rust/src/source_payload.rs`, with its own cases; this
// file proves the builder's side of the wiring: the list the host answers holds the entry a detached child runs.
test('the entry a detached child runs sits in the payload at the same layout as the module that spawns it', () => {
  const entry = path.relative(REPO_ROOT, OWN_CLI).split(path.sep).join('/');
  assert.equal(entry, 'bin/fgos.mjs', 'spawn-detached-fgos.mjs finds the CLI entry two levels above src/util');
  assert.ok(listLegacyNodeSourceFiles(REPO_ROOT).includes(entry), 'the entry is part of the staged source payload');
});
