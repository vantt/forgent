import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAll, checkPlanDir, main } from '../../scripts/plan-contract-check.mjs';

const SCRIPT = fileURLToPath(new URL('../../scripts/plan-contract-check.mjs', import.meta.url));
const SHA = 'a'.repeat(40);

const SECTIONS = '## Outcome\nx\n## Acceptance criteria\nx\n## Non-goals\nx\n## Owner questions\nnone\n## Risks and rollback\nx\n';
const table = (rows) => `## Phases\n\n| id | title | depends-on | footprint | wave | status |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n\n`;

function planText({ fm = {}, rows = ['| 1 | a | - | `src/a/` | 1 | ready |', '| 2 | b | - | `src/b/` | 1 | ready |'], tail = SECTIONS } = {}) {
  const meta = {
    contract: 'plan-v1', title: 'T', status: 'ready', priority: 'P2', blockedBy: '[]', footprint: '[src/a/, src/b/]',
    base: SHA, source: '[DISCUSSION.md]', created: '2026-11-17', ...fm,
  };
  const lines = Object.entries(meta).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join('\n')}\n---\n\n# T\n\n${tail}${table(rows)}`;
}

function root(plans) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-contract-'));
  for (const [name, text] of Object.entries(plans)) {
    fs.mkdirSync(path.join(dir, name), { recursive: true });
    fs.writeFileSync(path.join(dir, name, 'plan.md'), text);
  }
  return dir;
}

test('a plan with every key, section and a disjoint phase table passes', () => {
  const r = root({ good: planText() });
  const res = checkPlanDir(path.join(r, 'good'));
  assert.deepEqual(res.errors, []);
  assert.equal(res.legacy, false);
});

test('a missing key and a missing section are each named', () => {
  const r = root({ bad: planText({ fm: { source: undefined }, tail: '## Outcome\nx\n' }) });
  const { errors } = checkPlanDir(path.join(r, 'bad'));
  assert.ok(errors.some((e) => e.startsWith('source must be')));
  assert.ok(errors.some((e) => e === 'missing section: acceptance criteria'));
});

test('a legacy status is refused with the contract value to write', () => {
  const r = root({ bad: planText({ fm: { status: 'in-progress' } }) });
  const { errors } = checkPlanDir(path.join(r, 'bad'));
  assert.ok(errors.some((e) => e.includes('"in-progress"') && e.includes('write "running"')));
});

test('footprint and base are required once a plan is ready', () => {
  const r = root({ bad: planText({ fm: { footprint: undefined, base: undefined } }) });
  const { errors } = checkPlanDir(path.join(r, 'bad'));
  assert.ok(errors.includes('footprint is required when status is ready'));
  assert.ok(errors.includes('base is required when status is ready'));
  const draft = root({ ok: planText({ fm: { status: 'draft', footprint: undefined, base: undefined } }) });
  assert.deepEqual(checkPlanDir(path.join(draft, 'ok')).errors, []);
});

test('blockedBy must name a plan directory that exists', () => {
  const r = root({ a: planText({ fm: { blockedBy: '[missing-plan]' } }) });
  assert.ok(checkPlanDir(path.join(r, 'a')).errors.includes('blockedBy names unknown plan missing-plan'));
});

test('two ready plans with overlapping footprints are flagged by --all', () => {
  const r = root({ one: planText({ fm: { footprint: '[src/a/]' } }), two: planText({ fm: { footprint: '[src/a/x.mjs]' } }) });
  const { overlaps } = checkAll(r);
  assert.deepEqual(overlaps, [['one', 'two']]);
  const out = [];
  assert.equal(main(['--all', '--root', r], (l) => out.push(l)), 1);
  assert.ok(out.some((l) => l.includes('overlapping footprints')));
});

test('phases of one wave with overlapping footprints are an error', () => {
  const rows = ['| 1 | a | - | `src/a/` | 1 | ready |', '| 2 | b | - | `src/a/file.mjs` | 1 | ready |'];
  const r = root({ p: planText({ rows }) });
  assert.ok(checkPlanDir(path.join(r, 'p')).errors.some((e) => e.includes('share wave 1')));
});

test('a phase must sit in a later wave than its dependency, and the table needs its columns', () => {
  const rows = ['| 1 | a | - | `src/a/` | 1 | ready |', '| 2 | b | 1 | `src/b/` | 1 | ready |'];
  const r = root({ p: planText({ rows }) });
  assert.ok(checkPlanDir(path.join(r, 'p')).errors.some((e) => e.includes('later wave')));
  const noWave = planText().replace('| wave ', '');
  const r2 = root({ q: noWave });
  assert.ok(checkPlanDir(path.join(r2, 'q')).errors.some((e) => e.startsWith('phase table lacks columns: wave')));
});

test('--all reports a plan without the marker as legacy and still exits 0', () => {
  const legacy = '---\ntitle: Old\nstatus: pending\n---\n# Old\n';
  const r = root({ old: legacy, good: planText() });
  const out = [];
  assert.equal(main(['--all', '--root', r], (l) => out.push(l)), 0);
  assert.ok(out.some((l) => l.includes('legacy 1') && l.includes('draft 1')));
});

test('--plan fails hard on a legacy plan and exits 2 on bad usage', () => {
  const r = root({ old: '---\ntitle: Old\nstatus: pending\n---\n' });
  const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', env: process.env });
  assert.equal(run('--plan', path.join(r, 'old')).status, 1);
  assert.equal(run('--plan', path.join(r, 'old'), '--all').status, 2);
});

test('a plan whose frontmatter is not valid YAML is legacy unless it claims the contract', () => {
  const broken = '---\ntitle: a: b: c\nstatus: [oops\n---\n';
  const r = root({ old: broken, mine: `---\ncontract: plan-v1\ntitle: a: b: c\nstatus: [oops\n---\n` });
  const { results } = checkAll(r);
  const [mine, old] = [results.find((x) => x.dir.endsWith('mine')), results.find((x) => x.dir.endsWith('old'))];
  assert.equal(old.legacy, true);
  assert.equal(mine.legacy, false);
  assert.ok(mine.errors[0].startsWith('frontmatter is not valid YAML'));
});
