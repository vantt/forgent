import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { resolveInvocationRoot, resolveMainCheckoutRoot } from '../../src/runner/paths.mjs';

// The Node door's side of the root table shared with the Rust host walk and the identity crate's
// main root: the same tree, the same expected answers, one reader per language. A row where the
// readers disagree fails in the reader that is wrong, never in the table.
const table = JSON.parse(fs.readFileSync(new URL('./fixtures/invocation-root-table.json', import.meta.url), 'utf8'));

function build() {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-root-table-')));
  for (const step of table.steps) {
    if (step.mkdir) fs.mkdirSync(path.join(base, step.mkdir), { recursive: true });
    else if (step.write) fs.writeFileSync(path.join(base, step.write), 'x\n');
    else {
      const [cwd, ...args] = step.git;
      execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.test', '-c', 'commit.gpgsign=false', ...args], { cwd: path.join(base, cwd), stdio: 'pipe' });
    }
  }
  return base;
}

const base = build();
const at = (relative) => (relative === null ? null : path.join(base, relative));
const home = at(table.home);

after(() => fs.rmSync(base, { recursive: true, force: true }));

test('the Node door answers the shared root table the way the host walk and the identity crate do', { concurrency: false }, () => {
  for (const row of table.rows) {
    const cwd = at(row.cwd);
    const walked = resolveInvocationRoot({ cwd, policy: 'caller-tree', home });
    assert.equal(walked.found ? walked.root : null, at(row.project), `project of "${row.name}"`);
    assert.equal(resolveMainCheckoutRoot(cwd), at(row.main), `main checkout of "${row.name}"`);
    if (row.main !== null) {
      assert.equal(resolveInvocationRoot({ cwd, policy: 'main-checkout' }).root, at(row.main), `main-checkout policy of "${row.name}"`);
    }
  }
});

test('the Node door carries every policy row of the shared table to the door and maps its refusals', { concurrency: false }, () => {
  for (const row of table.policyRows) {
    const dir = row.dir === undefined ? undefined : row.dirIsRelativeToBase ? at(row.dir) : row.dir;
    const ask = () => resolveInvocationRoot({ cwd: at(row.cwd), dir, policy: row.policy, home });
    if (row.refusal !== undefined) {
      const expected = row.refusal.replaceAll('{base}', base);
      assert.throws(ask, (err) => err.category === 'validation' && err.message.includes(expected), row.name);
    } else {
      const got = ask();
      assert.deepEqual({ root: got.root, found: got.found, fgosDir: got.fgosDir }, { root: at(row.root), found: row.found, fgosDir: path.join(at(row.root), '.fgos') }, row.name);
    }
  }
});
