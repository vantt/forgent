// docs-index-state-fixture.mjs -- P03 pilot (test-suite-feedback-cost):
// gives `fgos docs-index` a small, fast Work-state store to fold instead of
// this repo's own large real `.fgos/state.json`, while STILL scanning the
// real `docs/<quadrant>/` tree (never a copy or a temp mirror) -- `dir`
// (the `.fgos` root) always resolves to exactly `dirname(--dir or cwd)`,
// so `repoRoot` and the Work-state root are the SAME directory in
// production; this fixture keeps that coupling (`repoRoot ===
// dirname(fgosDir)`) but makes `repoRoot/docs` a symlink to the real repo's
// own `docs/` instead of a copy, so every real on-disk `.md` file, alias
// dir, and quadrant is still the genuine file the production generator
// reads (R2). Only the WORK-STATE input shrinks.
//
// The one compound-learn capture a real checkout's history carries
// (`doc-fgos-rollup-howto` -> docs/how-to/check-rollup-progress.md) is
// seeded through the REAL store writer (`addOutcome`, the same door the
// deprecated `fgos compound` verb and its `fgos doc register/promote`
// successor both write through) -- never a hand-rolled JSON write bypassing
// the real reader (Adversarial: "a fabricated object bypassing the real
// store reader"). `work.outcome`'s own fold (replay.mjs) merges purely by
// `id` with no dependency on a `work.add` for that id ever existing, so
// this is a genuinely minimal, genuinely real seed -- not a shortcut
// through the reader, just a shortcut around the OTHER, unrelated
// thousands of real events this repo's own history also carries.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initStore, addOutcome } from '../../../src/state/store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../../..');

export const REAL_DEMO_OUTCOME_ID = 'doc-fgos-rollup-howto';
export const REAL_DEMO_DOC_PATH = 'docs/how-to/check-rollup-progress.md';

/**
 * Builds a fresh fixture root: `docs/` symlinked to this repo's own real
 * docs tree, `.fgos/` a small freshly-initialized store carrying exactly
 * one real `work.outcome` event for the demo capture. Returns the fixture
 * root (the `cwd` a CLI spawn against it should use, matching this file's
 * own `runDocsIndexAt(cwd)` convention for an unreachable-store fixture).
 */
export function makeDocsIndexStateFixture() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-docs-index-state-fixture-'));
  fs.symlinkSync(path.join(REPO_ROOT, 'docs'), path.join(cwd, 'docs'), 'dir');

  const fgosDir = path.join(cwd, '.fgos');
  initStore(fgosDir);
  addOutcome(fgosDir, { id: REAL_DEMO_OUTCOME_ID, docPath: REAL_DEMO_DOC_PATH, docType: 'how-to' });

  return cwd;
}
