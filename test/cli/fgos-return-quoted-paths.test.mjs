// `return` reads the item's own diff byte for byte: a name git would quote is matched against the
// declared footprint as written, and stays the item's own path in the clean-tree gate.
import { test } from 'node:test';
import {
  assert,
  commitFile,
  envelopeData,
  fs,
  initGitCwdFast,
  path,
  run,
} from './helpers/fgos-cli-harness.mjs';

const NAME = 'ghi chú.md';

test('return: a committed Vietnamese name inside the footprint raises no footprint hit', () => {
  const cwd = initGitCwdFast();
  assert.equal(run(cwd, ['add', 'return-viet', '--title', 'X', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', NAME, '--description', 'quoted path fixture.']).status, 0);
  assert.equal(run(cwd, ['take', '--id', 'return-viet']).status, 0);
  commitFile(cwd, NAME);

  const result = run(cwd, ['return', 'return-viet']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  const files = envelopeData(result.stdout).footprintDiffHits.map((hit) => hit.file);
  assert.ok(!files.some((file) => file.includes('ch')), `no hit for the footprint file, got ${JSON.stringify(files)}`);
});

test('return: the item\'s own Vietnamese-named file left dirty after its commit blocks the return', () => {
  const cwd = initGitCwdFast();
  assert.equal(run(cwd, ['add', 'return-viet-dirty', '--title', 'X', '--kind', 'task', '--risk', 'light', '--verify', 'true', '--footprint', NAME, '--description', 'quoted path fixture.']).status, 0);
  assert.equal(run(cwd, ['take', '--id', 'return-viet-dirty']).status, 0);
  commitFile(cwd, NAME);
  fs.writeFileSync(path.join(cwd, NAME), 'not committed\n');

  const result = run(cwd, ['return', 'return-viet-dirty']);
  assert.notEqual(result.status, 0, 'own uncommitted work must block return');
});
