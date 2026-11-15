// The shared run-directory fixture (test/rust-host/fixtures/run-dirs-vectors.json): each vector is a tree under a
// project's `.fgos` and what the three run-directory listers yield for it. The Node listers' tests and the host's
// Rust listers (apps/fgos/src/wiring/run_dirs.rs) read the same file.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const RUN_DIRS_VECTORS = JSON.parse(fs.readFileSync(new URL('../rust-host/fixtures/run-dirs-vectors.json', import.meta.url), 'utf8')).vectors;

/** Builds a vector's tree under a fresh `.fgos` and returns it with a cleanup. */
export function buildRunDirsTree(vector) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-run-dirs-'));
  const fgosDir = path.join(root, '.fgos');
  fs.mkdirSync(fgosDir);
  for (const entry of vector.tree) {
    const place = path.join(fgosDir, entry.path);
    fs.mkdirSync(path.dirname(place), { recursive: true });
    if (entry.kind === 'dir') fs.mkdirSync(place, { recursive: true });
    else if (entry.kind === 'file') fs.writeFileSync(place, '');
    else fs.symlinkSync(entry.points, place);
  }
  return { fgosDir, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

/** `paths` relative to `fgosDir`, as the vectors write them. */
export const relativeTo = (fgosDir, paths) => paths.map((p) => path.relative(fgosDir, p));
