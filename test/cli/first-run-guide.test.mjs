// The three first-run steps are printed by `fgos` (no arguments), by `fgctl`
// (no arguments) and by the README. They are written in three languages'
// worth of places, so this pins the commands they share: a step changed in one
// place and not the others fails here.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const SHARED_COMMANDS = [
  'curl -fsSL https://github.com/vantt/forgent/releases/latest/download/install.sh | sh',
  'fgctl init',
  'fgos run \\"<prompt>\\"', // escaped inside the Rust string literals
];

for (const rel of ['apps/fgos/src/main.rs', 'apps/fgctl/src/help.rs']) {
  test(`${rel} prints the same three first-run commands`, () => {
    const text = read(rel);
    for (const command of SHARED_COMMANDS) assert.ok(text.includes(command), `${rel} lacks: ${command}`);
  });
}

// The README does not yet carry the `fgos run` step; the phase that rewrites its first-contact text adds it here.
test('README.md shows the same install command and `fgctl init`', () => {
  const text = read('README.md');
  for (const command of SHARED_COMMANDS.slice(0, 2)) {
    assert.ok(text.includes(command), `README.md lacks: ${command}`);
  }
});
