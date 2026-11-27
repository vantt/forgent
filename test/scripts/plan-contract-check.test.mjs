import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AUTHORITY,
  AUTHORITY_MAP_REQUIRED_FROM,
  BACKLOG_SOURCE_REQUIRED_FROM,
  IDENTITY,
  QUESTIONS,
  STATUSES,
  UNATTENDED_RUN_REQUIRED_FROM,
  activeOverlaps,
  checkAll,
  checkPlanDir,
  main,
  resolveLegacyStatus,
} from '../../scripts/plan-contract-check.mjs';

const SCRIPT = fileURLToPath(new URL('../../scripts/plan-contract-check.mjs', import.meta.url));
const SHA = 'a'.repeat(40);

// The model comes from the host (`fgos authority model --json`); these cases answer for it. Unless a case says
// otherwise the project has no model, so the Authority-map rule is skipped and the cases below it test their own rules.
AUTHORITY.read = () => ({ authority: 'inactive' });

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

test('a marked plan created on or after the cutoff requires a backlog source id; an older one is exempt', () => {
  const olderPlan = planText({ fm: { created: '2026-11-21', source: '["DISCUSSION.md"]' } });
  const newPlanBad = planText({ fm: { created: BACKLOG_SOURCE_REQUIRED_FROM, source: '["DISCUSSION.md"]' } });
  const newPlanShort = planText({ fm: { created: BACKLOG_SOURCE_REQUIRED_FROM, source: '["DISCUSSION.md", "p-1"]' } });
  const newPlanGood = planText({ fm: { created: BACKLOG_SOURCE_REQUIRED_FROM, source: '["DISCUSSION.md", "p-abcdef2345"]' } });
  const r = root({ older: olderPlan, bad: newPlanBad, short: newPlanShort, good: newPlanGood });

  assert.deepEqual(checkPlanDir(path.join(r, 'older')).errors, []);

  const badErrors = checkPlanDir(path.join(r, 'bad')).errors;
  assert.ok(badErrors.some((e) => e.includes('source must cite at least one backlog id')));

  const shortErrors = checkPlanDir(path.join(r, 'short')).errors;
  assert.ok(shortErrors.some((e) => e.includes('source must cite at least one backlog id')));

  assert.deepEqual(checkPlanDir(path.join(r, 'good')).errors, []);
});

test('resolveLegacyStatus maps partial->draft and deferred->withdrawn and its first-word fallback', () => {
  assert.equal(resolveLegacyStatus('partial'), 'draft');
  assert.equal(resolveLegacyStatus('deferred'), 'withdrawn');
  assert.equal(resolveLegacyStatus('partial (phase 1)'), 'draft');
  assert.equal(resolveLegacyStatus('deferred until later'), 'withdrawn');
  assert.equal(resolveLegacyStatus('constructor'), undefined);
});

test('a legacy status is refused with the contract value to write', () => {
  const r = root({ bad: planText({ fm: { status: 'in-progress' } }), ctor: planText({ fm: { status: 'constructor' } }) });
  const { errors } = checkPlanDir(path.join(r, 'bad'));
  assert.ok(errors.some((e) => e.includes('"in-progress"') && e.includes('write "running"')));
  const { errors: ctorErrors } = checkPlanDir(path.join(r, 'ctor'));
  assert.ok(ctorErrors.some((e) => e.includes('"constructor"') && !e.includes('write')));
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

test('phases of one wave with overlapping footprints are an error', () => {
  const rows = ['| 1 | a | - | `src/a/` | 1 | ready |', '| 2 | b | - | `src/a/file.mjs` | 1 | ready |'];
  const r = root({ p: planText({ rows }) });
  assert.ok(checkPlanDir(path.join(r, 'p')).errors.some((e) => e.includes('share wave 1')));
  // A done wave is history: a done phase, or any phase of a done plan, is not checked; an active pair still is.
  const doneRows = ['| 1 | a | - | `src/a/` | 1 | done |', '| 2 | b | - | `src/a/file.mjs` | 1 | ready |', '| 3 | c | - | `src/a/other.mjs` | 1 | ready |'];
  const shared = checkPlanDir(path.join(root({ p: planText({ rows: doneRows }) }), 'p')).errors.filter((e) => e.includes('share wave'));
  assert.deepEqual(shared, []);
  const activeRows = ['| 1 | a | - | `src/a/` | 1 | done |', '| 2 | b | - | `src/a/file.mjs` | 1 | ready |', '| 3 | c | - | `src/a/` | 1 | running |'];
  assert.ok(checkPlanDir(path.join(root({ p: planText({ rows: activeRows }) }), 'p')).errors.some((e) => e.includes('phases 2 and 3 share wave 1')));
  const donePlan = root({ p: planText({ fm: { status: 'done' }, rows }) });
  assert.equal(checkPlanDir(path.join(donePlan, 'p')).errors.filter((e) => e.includes('share wave')).length, 0);
});

test('a phase must sit in a later wave than its dependency, and the table needs its columns', () => {
  const rows = ['| 1 | a | - | `src/a/` | 1 | ready |', '| 2 | b | 1 | `src/b/` | 1 | ready |'];
  const r = root({ p: planText({ rows }) });
  assert.ok(checkPlanDir(path.join(r, 'p')).errors.some((e) => e.includes('later wave')));
  const noWave = planText().replace('| wave ', '');
  const r2 = root({ q: noWave });
  assert.ok(checkPlanDir(path.join(r2, 'q')).errors.some((e) => e.startsWith('phase table lacks columns: wave')));
});

// The phase-table reader mirrors the supervisor's (packages/supervision/rust/src/portfolio.rs); the overlap rule itself
// is owned by the write-scope package's tests (packages/write-scope/src/lib.rs). These cases own the script's wiring.
const errorsOf = (text) => checkPlanDir(path.join(root({ p: text }), 'p')).errors;
const phaseRows = (...footprints) => footprints.map((f, n) => `| ${n + 1} | t | - | ${f} | 1 | ready |`);

test('two globs in one directory, and a glob and a file there, are a same-wave overlap (the old rule cut at the first star and called them disjoint)', () => {
  assert.ok(errorsOf(planText({ rows: phaseRows('`apps/t/tests/q_*.rs`', '`apps/t/tests/s_*.rs`') })).some((e) => e.includes('share wave 1')));
  assert.ok(errorsOf(planText({ rows: phaseRows('`apps/t/tests/q_*.rs`', '`apps/t/tests/q_a.rs`') })).some((e) => e.includes('share wave 1')));
  assert.deepEqual(errorsOf(planText({ rows: phaseRows('`apps/t/a/*.rs`', '`apps/t/b/q.rs`') })), []);
});

test('a claim the write-scope package drops as too long or too large fails the overlap check by name, same-wave and cross-plan', () => {
  const long = `src/${'x'.repeat(1030)}`;
  assert.ok(errorsOf(planText({ rows: phaseRows(`\`${long}\``, `\`${long}\``) })).some((e) => e.includes('entry-too-long')));
  const many = Array.from({ length: 513 }, (_, n) => `d${n}/`);
  assert.ok(errorsOf(planText({ rows: phaseRows(`\`${many.join('`, `')}\``, '`d0/x`') })).some((e) => e.includes('scope-too-large')));
  const active = (footprint) => ({ dir: 'plans/p', legacy: false, meta: { status: 'ready', footprint } });
  assert.throws(() => activeOverlaps([active([...many.slice(0, 512), 'hot/']), active(['hot/x'])]), /scope-too-large/);
  assert.throws(() => activeOverlaps([active([long]), active([long])]), /entry-too-long/);
});

test('a footprint cell keeps every star and unwraps only whole-entry backticks or links', () => {
  assert.deepEqual(errorsOf(planText({ rows: phaseRows('`src/**`, [docs/](d)') })), []);
  // `**src/a/*.mjs**` is not a whole-entry wrapper: its stars stay, so it is an entry that is not a repo path.
  assert.ok(errorsOf(planText({ rows: phaseRows('**src/a/*.mjs**') })).some((e) => e.includes('"**src/a/*.mjs**"')));
});

test('a footprint entry that does not canonicalize is refused at ready and not before', () => {
  for (const bad of ['`../x`', '`/abs`', '`a\\b`', '`ab**`', '`.`']) {
    assert.ok(errorsOf(planText({ rows: phaseRows(bad) })).some((e) => e.includes('is not a repo-relative path or glob')), bad);
  }
  assert.ok(errorsOf(planText({ fm: { footprint: '[../x]' } })).some((e) => e.startsWith('footprint entry "../x"')));
  const draft = planText({ fm: { status: 'draft' }, rows: ['| 1 | t | - | `../x` | 1 | draft |'] });
  assert.deepEqual(errorsOf(draft), []);
});

test('a malformed phase table is refused for every status; a missing table only for ready or running', () => {
  const draft = (extra) => planText({ fm: { status: 'draft' }, ...extra });
  assert.ok(errorsOf(draft({ rows: ['| 1 | t | - | `a/` | 1 | draft |', '| 1 | u | - | `b/` | 2 | draft |'] })).includes('phase id 1 appears twice'));
  for (const wave of ['0', '1.5', 'x', '-1', '']) {
    assert.ok(errorsOf(draft({ rows: [`| 1 | t | - | \`a/\` | ${wave} | draft |`] })).includes('phase 1: wave must be an integer from 1'), JSON.stringify(wave));
  }
  assert.ok(errorsOf(draft({ rows: [] })).includes('phase table has no rows'));
  const second = '\n| id | footprint |\n|---|---|\n| 1 | a/ |\n';
  assert.ok(errorsOf(draft({ tail: SECTIONS + second })).some((e) => e.startsWith('2 tables have a footprint column')));
  const noTable = (status) => planText({ fm: { status }, rows: [] }).replace(/## Phases[\s\S]*$/, '');
  assert.ok(!errorsOf(noTable('draft')).includes('no phase table with a footprint column'));
  assert.ok(errorsOf(noTable('ready')).includes('no phase table with a footprint column'));
  assert.ok(errorsOf(noTable('running')).includes('no phase table with a footprint column'));
});

test('a list key that is not a list is refused by name', () => {
  assert.ok(errorsOf(planText({ fm: { blockedBy: 'some-plan' } })).includes('blockedBy must be a list of plan directory names'));
  assert.ok(errorsOf(planText({ fm: { footprint: 'src/a/' } })).includes('footprint must be a list of repo-relative paths or globs'));
});

test('a lead role must be an Identity role string, and a running plan without one is an error', () => {
  assert.ok(errorsOf(planText({ fm: { lead: 'not a role' } })).some((e) => e.startsWith('lead must be an Identity role')));
  const r = root({ named: planText({ fm: { status: 'running', lead: 'lead:S6A' } }), bare: planText({ fm: { status: 'running' } }) });
  const named = checkPlanDir(path.join(r, 'named'));
  const bare = checkPlanDir(path.join(r, 'bare'), { plansRoot: r });
  assert.deepEqual([named.errors, named.warnings], [[], []]);
  assert.ok(bare.errors.some((e) => e.includes('a running plan names its lead')));
  assert.deepEqual(bare.warnings, []);
});

test('host is an optional machine id: malformed is an error, an id Identity does not know is only a warning', () => {
  const read = IDENTITY.read;
  try {
    IDENTITY.reset();
    IDENTITY.read = () => new Set(['fg-known-abc123']);
    const r = root({
      none: planText(),
      known: planText({ fm: { host: 'fg-known-abc123' } }),
      unknown: planText({ fm: { host: 'fg-other-xyz789' } }),
      bad: planText({ fm: { host: 'Not_A_Machine' } }),
      draft: planText({ fm: { status: 'draft', host: 'fg-other-xyz789' } }),
    });
    const of = (name) => checkPlanDir(path.join(r, name), { plansRoot: r });
    assert.deepEqual([of('none').errors, of('none').warnings], [[], []]);
    assert.deepEqual([of('known').errors, of('known').warnings], [[], []]);
    assert.deepEqual(of('unknown').errors, []);
    assert.ok(of('unknown').warnings.some((w) => w.includes('fg-other-xyz789') && w.includes('Identity knows')));
    assert.ok(of('bad').errors.some((e) => e.startsWith('host must be an Identity machine id')));
    assert.deepEqual(of('draft').warnings, []);
    IDENTITY.reset();
    let reads = 0;
    IDENTITY.read = () => {
      reads += 1;
      throw new Error('identity unreadable');
    };
    const first = of('unknown').warnings;
    assert.equal(first.length + of('unknown').warnings.length, 1, 'an unreadable Identity warns once and goes on');
    assert.equal(reads, 1, 'an unreadable Identity is not asked again for each plan');
  } finally {
    IDENTITY.read = read;
    IDENTITY.reset();
  }
});

test('--plan accepts several plan directories and checks each', () => {
  const r = root({
    good1: planText({ fm: { footprint: '[src/a/]' }, rows: ['| 1 | a | - | `src/a/` | 1 | ready |'] }),
    good2: planText({ fm: { footprint: '[src/b/]' }, rows: ['| 1 | b | - | `src/b/` | 1 | ready |'] }),
    bad: planText({ fm: { footprint: '[src/c/]', source: undefined }, rows: ['| 1 | c | - | `src/c/` | 1 | ready |'] }),
  });
  const outGood = [];
  assert.equal(main(['--plan', path.join(r, 'good1'), '--plan', path.join(r, 'good2')], (l) => outGood.push(l)), 0);
  assert.ok(outGood.includes('ok good1'));
  assert.ok(outGood.includes('ok good2'));

  const outMixed = [];
  assert.equal(main(['--plan', path.join(r, 'good1'), '--plan', path.join(r, 'bad')], (l) => outMixed.push(l)), 1);
  assert.ok(outMixed.includes('ok good1'));
  assert.ok(outMixed.some((l) => l.startsWith('ERROR bad:')));
});

// Owns cross-plan reporting and exit codes; write-scope owns matching, and the same-wave test owns phase refusal.
test('cross-plan overlap is a warning naming the other plan and the shared paths, for ready and running plans alike', () => {
  for (const statuses of [['ready', 'ready'], ['ready', 'running'], ['running', 'running']]) {
    const r = root({
      one: planText({ fm: { status: statuses[0], lead: 'lead:S6A', footprint: '[src/a/, docs/shared.md, src/only-one/]' } }),
      two: planText({ fm: { status: statuses[1], lead: 'lead:S6B', footprint: '[src/a/file.mjs, docs/shared.md, src/only-two/]' } }),
    });
    assert.deepEqual(checkAll(r).overlaps, [{ a: 'one', b: 'two', shared: ['src/a/', 'docs/shared.md'] }]);
    for (const [checked, other, shared] of [
      ['one', 'two', 'src/a/, docs/shared.md'],
      ['two', 'one', 'src/a/file.mjs, docs/shared.md'],
    ]) {
      const out = [];
      assert.equal(main(['--plan', path.join(r, checked)], (l) => out.push(l)), 0);
      assert.deepEqual(out, [
        `WARN ${checked}: footprint overlaps another active plan ${other} on ${shared}`,
        `ok ${checked}`,
      ]);
    }
    const out = [];
    assert.equal(main(['--all', '--root', r], (l) => out.push(l)), 0);
    assert.deepEqual(out.filter((l) => l.startsWith('WARN')), ['WARN active plans one and two share src/a/, docs/shared.md']);
    assert.ok(!out.some((l) => l.startsWith('ERROR')));
  }
});

test('a pair scan that stops at its cap is an error, never a clean verdict', () => {
  const rows = Array.from({ length: 460 }, (_, n) => `| ${n + 1} | t | - | \`src/a/\` | 1 | ready |`);
  assert.ok(errorsOf(planText({ rows })).some((e) => e.startsWith('footprint overlap scan stopped at its')));
});

test('--all fails on a legacy plan with a legacy or missing status and passes once it holds a plan-v1 status', () => {
  const legacyPending = '---\ntitle: Old\nstatus: pending\n---\n# Old\n';
  const rPending = root({ old: legacyPending, good: planText() });
  const outPending = [];
  assert.equal(main(['--all', '--root', rPending], (l) => outPending.push(l)), 1);
  assert.ok(outPending.some((l) => l.includes('ERROR old:') && l.includes('"pending"') && l.includes('write "draft"')));

  const legacyNoStatus = '---\ntitle: Old\n---\n# Old\n';
  const rMissing = root({ old: legacyNoStatus, good: planText() });
  const outMissing = [];
  assert.equal(main(['--all', '--root', rMissing], (l) => outMissing.push(l)), 1);
  assert.ok(outMissing.some((l) => l.includes('ERROR old:') && l.includes('status is missing') && l.includes('write "draft"')));

  const legacyDraft = '---\ntitle: Old\nstatus: draft\n---\n# Old\n';
  const rDraft = root({ old: legacyDraft, good: planText() });
  const outDraft = [];
  assert.equal(main(['--all', '--root', rDraft], (l) => outDraft.push(l)), 0);
  assert.ok(outDraft.some((l) => l.includes('legacy 1') && l.includes('draft 1')));
  assert.ok(!outDraft.some((l) => l.startsWith('WARN')));
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

// The Authority-map rule (plan-contract.md §3). The ranking of rows and the model's own validity are owned by the
// Rust crate; these cases own the script's reading of a plan's map against the model the host answers.
const MODEL = {
  components: [{ id: 'durable-file' }],
  decisionKinds: [{ id: 'component-authority' }],
  contracts: [{ id: 'CTR001' }],
  doors: [{ slug: 'yaml-parser-loads' }],
};
const mapSection = (...rows) => `## Authority map\n\n| New thing | Model row | Note |\n|---|---|---|\n${rows.join('\n')}\n\n`;
const withModel = (answer, fn) => {
  const before = AUTHORITY.read;
  AUTHORITY.read = typeof answer === 'function' ? answer : () => answer;
  try { return fn(); } finally { AUTHORITY.read = before; }
};
const mapErrors = (answer, text) => withModel(answer, () => errorsOf(text));
// A plan created on or after the rule's date, with the backlog source such a plan needs.
const NEW = { created: AUTHORITY_MAP_REQUIRED_FROM, source: '["DISCUSSION.md", "p-abcdef2345"]' };
const withMap = (status, ...rows) => planText({ fm: { status, ...NEW }, tail: SECTIONS + mapSection(...rows) });

test('a draft or ready plan without an Authority map section is an error where the project has a model', () => {
  for (const status of ['draft', 'ready']) {
    assert.ok(mapErrors(MODEL, planText({ fm: { status, ...NEW } })).includes('missing section: authority map'), status);
  }
  assert.deepEqual(mapErrors(MODEL, withMap('ready', '| a new lock | `durable-file` | reuse |')), []);
});

test('an Authority-map row must name a row of the model or a declare line', () => {
  const errors = mapErrors(MODEL, withMap('ready', '| x | `durable-file` | ok |', '| y | `no-such-row` | |', '| z | `declare: component billing` | |', '| w | `declare: widget billing` | |'));
  assert.ok(errors.some((e) => e.includes('"no-such-row"') && e.includes('not a row of the model')));
  assert.ok(errors.some((e) => e.includes('"declare: widget billing"')));
  assert.equal(errors.filter((e) => e.startsWith('authority map')).length, 2, 'the model row and the good declare pass');
  // Every kind of row is a model row: component, decision kind, contract, door slug.
  assert.deepEqual(mapErrors(MODEL, withMap('draft', '| a | `component-authority` | |', '| b | `CTR001` | |', '| c | `yaml-parser-loads` | |')), []);
});

test('an overlap line in the Authority map must carry a survivor', () => {
  const bad = withMap('ready', '| hash | `durable-file` | overlaps the old writer |');
  assert.ok(mapErrors(MODEL, bad).some((e) => e.includes('an overlap names no survivor')));
  const good = withMap('ready', '| hash | `durable-file` | overlaps the old writer; survivor: durable-file; retired: src/a.mjs |');
  assert.deepEqual(mapErrors(MODEL, good), []);
  // Prose under the table, and the word "overlap" alone, do not ask for a survivor.
  const prose = planText({ fm: { status: 'ready', ...NEW }, tail: SECTIONS + mapSection('| hash | `durable-file` | no overlap with existing rows |') + 'This overlaps nothing.\n' });
  assert.deepEqual(mapErrors(MODEL, prose), []);
});

test('running, done and withdrawn plans are not checked for an Authority map', () => {
  for (const status of ['running', 'done', 'withdrawn']) {
    const fm = status === 'running' ? { status, lead: 'lead:S6A' } : { status };
    assert.deepEqual(mapErrors(MODEL, planText({ fm: { ...fm, ...NEW } })), [], status);
  }
});

test('where the project has no model the Authority-map rule is skipped', () => {
  assert.deepEqual(mapErrors({ authority: 'inactive' }, planText({ fm: { status: 'ready', ...NEW } })), []);
});

test('a model the host cannot answer is an error for a plan that needs a map, never a silent pass', () => {
  const errors = mapErrors(() => { throw new Error('Rust host binary unavailable'); }, planText({ fm: NEW }));
  assert.ok(errors.some((e) => e.startsWith('cannot read the authority model: Rust host binary unavailable')));
  assert.deepEqual(mapErrors(() => { throw new Error('x'); }, planText({ fm: { status: 'running', lead: 'lead:S6A', ...NEW } })), []);
});

test('a plan created before the Authority-map rule is not checked for a map', () => {
  assert.deepEqual(mapErrors(MODEL, planText({ fm: { ...NEW, status: 'ready', created: '2026-11-23' } })), []);
  assert.ok(mapErrors(MODEL, planText({ fm: { status: 'ready', ...NEW } })).includes('missing section: authority map'));
});

test('the script gets the model from the host verb and opens no model file', () => {
  const source = fs.readFileSync(SCRIPT, 'utf8');
  assert.ok(source.includes("invokeHost(['authority', 'model', '--json'])"));
  assert.ok(!/component-authority\/model/.test(source));
});

// The Unattended-run rule (core/instructions/ready-plan-runs-unattended.md). The question store is answered by a stub
// at the QUESTIONS seam, as the authority model is at AUTHORITY.
const GATED = { created: UNATTENDED_RUN_REQUIRED_FROM, source: '["DISCUSSION.md", "p-abcdef2345"]' };
const ACCEPTANCE = '## Acceptance criteria\n1. [core] a thing\n   continuation line\n2. [debt-ok] another\n';
const HOST_TABLE = '| step | argv | executor |\n|---|---|---|\n| full gate | fgos release check --worktree <path> | lead |\n';
const BEYOND_ROW = '| item | question |\n|---|---|\n| a grant | q-abc123 |\n';
const unattended = ({ host = HOST_TABLE, beyond = 'None.' } = {}) =>
  `## Unattended run\n\n### Host steps\n${host}\n### Cleanup\nStanding rule.\n\n### Beyond the rule\n${beyond}\n\n### Split\nOne.\n`;
const readyPlan = ({ acceptance = ACCEPTANCE, section = unattended(), fm = GATED } = {}) => planText({
  fm: { status: 'ready', ...fm },
  tail: SECTIONS.replace(/## Acceptance criteria\nx\n/, acceptance) + section,
});
const unattendedErrors = (text, states = new Map()) => {
  const before = QUESTIONS.read;
  QUESTIONS.read = typeof states === 'function' ? states : () => states;
  try { return errorsOf(text); } finally { QUESTIONS.read = before; }
};

test('a complete ready plan with the Unattended run section passes', () => {
  assert.deepEqual(unattendedErrors(readyPlan()), []);
  const answered = readyPlan({ section: unattended({ beyond: BEYOND_ROW }) });
  assert.deepEqual(unattendedErrors(answered, new Map([['q-abc123', 'answered']])), []);
});

test('a ready plan created before the gate date passes without the section', () => {
  const old = planText({ fm: { status: 'ready', created: '2026-11-27', source: '["DISCUSSION.md", "p-abcdef2345"]' } });
  assert.deepEqual(unattendedErrors(old), []);
});

test('a ready plan on or after the gate date without the Unattended run section is refused', () => {
  const text = planText({ fm: { status: 'ready', ...GATED } });
  assert.ok(unattendedErrors(text).includes('missing section: unattended run'));
});

test('the Unattended run section is the heading of exactly that name, not a template heading or a fenced example before it', () => {
  const template = '### The Unattended run section (fixed here)\n\n```markdown\n## Unattended run\n\n### Host steps\nnot a real one\n```\n\n';
  const text = readyPlan({ section: template + unattended() });
  assert.deepEqual(unattendedErrors(text), []);
});

test('a plan whose only Unattended run section sits inside a code fence is refused as missing it', () => {
  const fenced = '```markdown\n' + unattended() + '```\n';
  assert.ok(unattendedErrors(readyPlan({ section: fenced })).includes('missing section: unattended run'));
});

test('a draft plan is not asked for the Unattended run section', () => {
  assert.ok(!unattendedErrors(planText({ fm: { status: 'draft', ...GATED } })).includes('missing section: unattended run'));
});

test('a host step without an argv starting with fgos is refused', () => {
  const host = '| step | argv | executor |\n|---|---|---|\n| gate | npm test | lead |\n';
  const errors = unattendedErrors(readyPlan({ section: unattended({ host }) }));
  assert.ok(errors.some((e) => e.includes('host step "gate" has no argv starting with "fgos "')), errors.join('\n'));
});

test('a host step without an executor is refused', () => {
  const host = '| step | argv | executor |\n|---|---|---|\n| gate | fgos release check | |\n';
  const errors = unattendedErrors(readyPlan({ section: unattended({ host }) }));
  assert.ok(errors.some((e) => e.includes('host step "gate" has no executor')), errors.join('\n'));
});

test('an acceptance criterion marked neither core nor debt-ok is refused', () => {
  const errors = unattendedErrors(readyPlan({ acceptance: '## Acceptance criteria\n1. [core] fine\n2. unmarked one\n' }));
  assert.equal(errors.filter((e) => e.includes('not marked [core] or [debt-ok]')).length, 1, errors.join('\n'));
  assert.ok(errors.some((e) => e.includes('unmarked one')));
});

test('a beyond-the-rule row without a q- id is refused', () => {
  const beyond = '| item | question |\n|---|---|\n| a grant | none yet |\n';
  const errors = unattendedErrors(readyPlan({ section: unattended({ beyond }) }));
  assert.ok(errors.some((e) => e.includes('beyond-the-rule item "a grant" names no q- question id')), errors.join('\n'));
});

test('a beyond-the-rule row whose question is not answered is refused', () => {
  const text = readyPlan({ section: unattended({ beyond: BEYOND_ROW }) });
  assert.ok(unattendedErrors(text, new Map([['q-abc123', 'open']])).some((e) => e.includes('q-abc123') && e.includes('is not answered (open)')));
  assert.ok(unattendedErrors(text, new Map()).some((e) => e.includes('unknown to the question store')));
});

test('a beyond-the-rule row fails closed when the question store cannot be read', () => {
  const text = readyPlan({ section: unattended({ beyond: BEYOND_ROW }) });
  const errors = unattendedErrors(text, () => { throw new Error('host down'); });
  assert.ok(errors.some((e) => e.includes('q-abc123') && e.includes('cannot read the question store: host down')), errors.join('\n'));
});

test('the script statuses equal the plan vocabulary contract', () => {
  const vocabulary = JSON.parse(fs.readFileSync(new URL('../../packages/supervision/contracts/plan-vocabulary.v1.json', import.meta.url), 'utf8'));
  assert.deepEqual(STATUSES, vocabulary.statuses);
});
