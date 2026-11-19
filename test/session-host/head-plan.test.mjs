// The owning proof of the plan a lead or planner head belongs to: the name rule (project handle prefix plus a unique
// prefix of a live plan directory), the footprint read from the trunk tip and never from the working file, and a plan
// that is done or withdrawn never makes a name ambiguous.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { HeadPlanError, isPlanHeadName, planOfHead } from '../../src/session-host/head-plan.mjs';

const planText = (status, footprint) => `---\ncontract: plan-v1\nstatus: ${status}\nfootprint:\n${footprint.map((f) => `  - ${f}`).join('\n')}\n---\n# plan\n`;

/** A real repository whose trunk tip holds the given plans (dir -> [status, footprint]); returns its root. */
function repoWith(t, plans) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-plan-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-C', root, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  for (const [dir, [status, footprint]] of Object.entries(plans)) {
    fs.mkdirSync(path.join(root, 'plans', dir), { recursive: true });
    fs.writeFileSync(path.join(root, 'plans', dir, 'plan.md'), planText(status, footprint));
  }
  git('add', '-A');
  git('commit', '-q', '-m', 'plans');
  return root;
}

test('a lead name resolves to its plan directory and the footprint of its plan.md at the trunk tip', async (t) => {
  const root = repoWith(t, { '261118-1045-project-supervisor': ['running', ['src/a/**', 'docs/x.md']], '261118-1100-other-thing': ['ready', ['src/b/**']] });
  const found = await planOfHead(root, 'lead', 'projectx-261118-1045-project-sup', { handle: 'projectx' });
  assert.deepEqual(found, { dir: '261118-1045-project-supervisor', footprint: ['src/a/**', 'docs/x.md'] });
  const planner = await planOfHead(root, 'planner', 'projectx-261118-1100', { handle: 'projectx' });
  assert.equal(planner.dir, '261118-1100-other-thing');
});

test('the footprint is the trunk tip one: an edited working plan.md changes nothing', async (t) => {
  const root = repoWith(t, { '261118-1045-p': ['running', ['src/a/**']] });
  fs.writeFileSync(path.join(root, 'plans', '261118-1045-p', 'plan.md'), planText('running', ['.', '.git/**']));
  const found = await planOfHead(root, 'lead', 'proj-261118-1045-p', { handle: 'proj' });
  assert.deepEqual(found.footprint, ['src/a/**']);
});

test('a done or withdrawn plan never makes a name ambiguous, two live ones do, and no live one is not found', async (t) => {
  const root = repoWith(t, { '261118-1000-a-old': ['done', ['x']], '261118-1000-a-new': ['draft', ['y']], '261118-2000-b-one': ['ready', ['p']], '261118-2000-b-two': ['running', ['q']], '261118-3000-c': ['withdrawn', ['z']] });
  const ports = { handle: 'proj' };
  assert.equal((await planOfHead(root, 'lead', 'proj-261118-1000', ports)).dir, '261118-1000-a-new');
  await assert.rejects(planOfHead(root, 'lead', 'proj-261118-2000', ports), (err) => err instanceof HeadPlanError && err.code === 'plan-ambiguous' && /b-one, .*b-two/.test(err.message));
  await assert.rejects(planOfHead(root, 'lead', 'proj-261118-3000', ports), (err) => err.code === 'plan-not-found');
  await assert.rejects(planOfHead(root, 'lead', 'proj-999999', ports), (err) => err.code === 'plan-not-found');
});

test('a persona that owns no plan, or a name of another project, is not found', async (t) => {
  const root = repoWith(t, { '261118-1045-p': ['running', ['a']] });
  await assert.rejects(planOfHead(root, 'secretary', 'proj-261118-1045', { handle: 'proj' }), (err) => err.code === 'plan-not-found');
  await assert.rejects(planOfHead(root, 'lead', 'zzz-261118-1045', { handle: 'proj' }), (err) => err.code === 'plan-not-found');
  assert.equal(isPlanHeadName(root, 'lead', 'proj-x', { handle: 'proj' }), true);
  assert.equal(isPlanHeadName(root, 'shaper', 'proj-x', { handle: 'proj' }), false);
  assert.equal(isPlanHeadName(root, 'lead', 'zzz-x', { handle: 'proj' }), false);
});

test('the project handle is cut to the name prefix limit like the portfolio writes it', async (t) => {
  const root = repoWith(t, { '261118-1045-p': ['running', ['a']] });
  assert.equal((await planOfHead(root, 'lead', 'forgentp-261118-1045', { handle: 'forgentproject' })).dir, '261118-1045-p');
});

test('without an injected handle the Identity project handle of project.json names the heads, not the folder name', async (t) => {
  const root = repoWith(t, { '261118-1045-p': ['running', ['a']] });
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'project.json'), JSON.stringify({ v: 1, projectId: '0123456789abcdef0123456789abcdef', handle: 'forgent', createdAt: '2026-10-24T00:00:00.000Z' }));
  assert.equal((await planOfHead(root, 'lead', 'forgent-261118-1045')).dir, '261118-1045-p');
  assert.equal(isPlanHeadName(root, 'lead', 'forgent-x'), true);
  assert.equal(isPlanHeadName(root, 'lead', `${path.basename(root)}-x`), false);
});

test('a project with no minted handle resolves no head name', async (t) => {
  const root = repoWith(t, { '261118-1045-p': ['running', ['a']] });
  await assert.rejects(planOfHead(root, 'lead', 'forgent-261118-1045'), (err) => err instanceof HeadPlanError && err.code === 'plan-not-found' && /no minted handle/.test(err.message));
});
