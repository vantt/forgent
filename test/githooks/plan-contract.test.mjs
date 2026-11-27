import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

// The real hook against a scratch repository: a staged plan file is judged by the plan contract check the land door
// runs as a gate, so a plan that breaks the contract is refused at commit, not on a land.
const HOOK = path.resolve('.githooks/pre-commit');

function fixture(t) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-hook-'));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
  const write = (name, text) => {
    fs.mkdirSync(path.dirname(path.join(repo, name)), { recursive: true });
    fs.writeFileSync(path.join(repo, name), text);
  };
  git('init', '-q', '-b', 'main'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.test');
  write('README.md', 'fixture\n');
  git('add', '.'); git('commit', '-q', '-m', 'baseline');
  const hook = () => spawnSync(process.execPath, [HOOK], { cwd: repo, encoding: 'utf8' });
  return { git, write, hook };
}

test('a staged plan the plan contract check refuses is refused at commit, naming the error', (t) => {
  const { git, write, hook } = fixture(t);
  write('plans/261127-0000-broken/plan.md', '---\ncontract: plan-v1\ntitle: "Broken"\nstatus: draft\n---\n\n# Broken\n');
  git('add', 'plans/261127-0000-broken/plan.md');
  const refused = hook();
  assert.equal(refused.status, 1, refused.stderr);
  assert.match(refused.stderr, /commit refused: the plan contract check fails \(plans\/261127-0000-broken\):\nERROR /);
});

test('a commit that stages no plan file is not judged by the plan contract check', (t) => {
  const { git, write, hook } = fixture(t);
  write('plans/261127-0000-broken/notes.md', 'not a plan file\n');
  git('add', 'plans/261127-0000-broken/notes.md');
  const result = hook();
  assert.equal(result.status, 0, result.stderr);
});
