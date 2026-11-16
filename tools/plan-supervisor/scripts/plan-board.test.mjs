import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, utimesSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main, parseFrontmatter, overlaps } from './plan-board.mjs';

function vault(plans) {
  const root = mkdtempSync(join(tmpdir(), 'pb-'));
  const dir = join(root, 'proj', 'plans');
  mkdirSync(dir, { recursive: true });
  for (const [id, fm] of Object.entries(plans)) {
    mkdirSync(join(dir, id));
    writeFileSync(join(dir, id, 'plan.md'), `---\n${fm}\n---\n# ${id}\n`);
  }
  process.env.PLAN_SUPERVISOR_STATE = join(root, 'state');
  return dir;
}
const run = (args) => { const lines = []; const code = main(args, (l) => lines.push(l)); return { code, text: lines.join('\n') }; };

test('frontmatter reads scalars, quoted strings and inline lists', () => {
  const fm = parseFrontmatter('---\ntitle: "A: b"\nblockedBy: [x, y]\nfootprint: []\n---\nbody');
  assert.deepEqual(fm, { title: 'A: b', blockedBy: ['x', 'y'], footprint: [] });
});

test('footprints overlap by path prefix and unknown glob roots', () => {
  assert.ok(overlaps(['crates/pkm-core'], ['crates/pkm-core/src/a.rs']));
  assert.ok(!overlaps(['crates/pkm-cli'], ['crates/pkm-core/**']));
});

test('a todo plan whose blockers are done is eligible, a blocked one is held', () => {
  const dir = vault({
    a: 'status: completed\npriority: P1',
    b: 'status: todo\npriority: P1\nblockedBy: [a]\nfootprint: [docs]',
    c: 'status: todo\npriority: P1\nblockedBy: [b]\nfootprint: [docs]',
  });
  const r = JSON.parse(run(['eligible', '--json', '--root', dir]).text);
  assert.deepEqual(r.eligible, ['b']);
  assert.match(r.held[0].why, /waits for b/);
});

test('claim is idempotent and a running plan blocks others beyond the limit', () => {
  const dir = vault({
    a: 'status: todo\npriority: P1\nfootprint: [x]',
    b: 'status: todo\npriority: P2\nfootprint: [y]',
  });
  run(['claim', 'a', 'case-1', '--root', dir]);
  const again = run(['claim', 'a', 'case-2', '--root', dir]);
  assert.match(again.text, /already held by case-1/);
  const r1 = JSON.parse(run(['eligible', '--json', '--root', dir]).text);
  assert.deepEqual(r1.eligible, []);
  const r2 = JSON.parse(run(['eligible', '--json', '--max-running', '2', '--root', dir]).text);
  assert.deepEqual(r2.eligible, ['b']);
});

test('overlapping or unknown footprint is not started beside a running plan', () => {
  const dir = vault({
    a: 'status: todo\nfootprint: [crates/pkm-core]',
    b: 'status: todo\nfootprint: [crates/pkm-core/src]',
    c: 'status: todo',
  });
  run(['claim', 'a', 'case-1', '--root', dir]);
  const r = JSON.parse(run(['eligible', '--json', '--max-running', '3', '--root', dir]).text);
  assert.deepEqual(r.eligible, []);
  assert.equal(r.held.length, 2);
});

test('check fails on unknown blocker, cycle and completed plan with leader', () => {
  const dir = vault({
    a: 'status: todo\nblockedBy: [ghost]',
    b: 'status: todo\nblockedBy: [c]',
    c: 'status: todo\nblockedBy: [b]',
    d: 'status: completed',
  });
  run(['claim', 'd', 'case-9', '--root', dir]);
  const r = run(['check', '--root', dir]);
  assert.equal(r.code, 1);
  assert.match(r.text, /unknown plan ghost/);
  assert.match(r.text, /cycle/);
  assert.match(r.text, /completed but still has leader/);
});

test('render --write is stable: a second render changes no byte', () => {
  const dir = vault({ a: 'status: todo\ntitle: "One | two"\nfootprint: [x]' });
  run(['render', '--write', '--root', dir]);
  const first = readFileSync(join(dir, 'board.md'), 'utf8');
  run(['render', '--write', '--root', dir]);
  assert.equal(readFileSync(join(dir, 'board.md'), 'utf8'), first);
  assert.match(first, /One \/ two/);
});

test('`blocks` is read as the reverse edge and `done` as completed', () => {
  const dir = vault({
    a: 'status: done\nblocks: [c]\nfootprint: [x]',
    b: 'status: todo\nblocks: [c]\nfootprint: [y]',
    c: 'status: todo\nfootprint: [z]',
  });
  const r = JSON.parse(run(['eligible', '--json', '--max-running', '3', '--root', dir]).text);
  assert.deepEqual(r.eligible, ['b']);
  assert.match(r.held[0].why, /waits for b/);
  assert.equal(run(['check', '--root', dir]).code, 0);
});

test('lock: a second tick is refused while the first holds it, and an expired lock is taken over', () => {
  const dir = vault({ a: 'status: todo' });
  assert.equal(run(['lock', 'acquire', '--root', dir]).code, 0);
  const second = run(['lock', 'acquire', '--root', dir]);
  assert.equal(second.code, 3);
  assert.match(second.text, /lock held since/);
  run(['lock', 'release', '--root', dir]);
  assert.equal(run(['lock', 'acquire', '--root', dir, '--ttl-min', '0']).code, 0);
  const takeover = run(['lock', 'acquire', '--root', dir]);
  assert.equal(takeover.code, 0);
  assert.match(takeover.text, /taken over/);
});

test('changed: unchanged index skips the tick (exit 10), an edit or a claim makes it run', () => {
  const dir = vault({ a: 'status: todo\nfootprint: [x]' });
  assert.equal(run(['changed', '--root', dir]).code, 0);
  run(['changed', '--mark', '--root', dir]);
  assert.equal(run(['changed', '--root', dir]).code, 10);
  run(['claim', 'a', 'case-1', '--root', dir]);
  assert.equal(run(['changed', '--root', dir]).code, 0);
  run(['changed', '--mark', '--root', dir]);
  run(['queue', 'add', 'a', 'frame', 'needs', 'approval', '--root', dir]);
  assert.equal(run(['changed', '--root', dir]).code, 0);
});

test('queue: add, list and close keep only open items visible', () => {
  const dir = vault({ a: 'status: todo' });
  run(['queue', 'add', 'a', 'approve', 'frame', '--root', dir]);
  run(['queue', 'add', 'a', 'pick', 'payment', '--root', dir]);
  assert.match(run(['queue', 'list', '--root', dir]).text, /1\ta\tapprove frame\n2\ta\tpick payment/);
  run(['queue', 'done', '1', '--root', dir]);
  assert.equal(run(['queue', 'list', '--root', dir]).text, '2\ta\tpick payment');
  assert.equal(run(['queue', 'done', '9', '--root', dir]).code, 2);
});

test('health flags a failed unit run of the case and ignores other cases', () => {
  const root = mkdtempSync(join(tmpdir(), 'pbh-'));
  const mk = (run, caseId, activity, outcome, reason) => {
    const d = join(root, '.fgos', 'assignments', run);
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'unit.json'), '{}');
    if (outcome) writeFileSync(join(d, 'unit-summary.json'), JSON.stringify({ workflow: { caseId, activity }, outcome, infrastructureReason: reason }));
  };
  mk('u1', 'c1', 'judge-ambiguity', 'pass', null);
  mk('u2', 'c1', 'validate-plan', 'execution-failure', 'infra-exec-failed');
  mk('u3', 'other', 'validate-plan', 'execution-failure', 'infra-exec-failed');
  const r = run(['health', '--case', 'c1', '--fgos', join(root, '.fgos'), '--root', vault({ a: 'status: todo' })]);
  assert.equal(r.code, 4);
  assert.match(r.text, /FAILED: validate-plan \(infra-exec-failed\)/);
  assert.doesNotMatch(r.text, /u3/);
  const ok = run(['health', '--case', 'other2', '--fgos', join(root, '.fgos'), '--root', vault({ a: 'status: todo' })]);
  assert.equal(ok.code, 0);
});

test('watch: a failed unit run alerts once, a stalled live run alerts once, a healthy one never', () => {
  const root = mkdtempSync(join(tmpdir(), 'pbw-'));
  const unit = (run, summary, ageMin) => {
    const d = join(root, '.fgos', 'assignments', run);
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'unit.json'), '{}');
    if (summary) writeFileSync(join(d, 'unit-summary.json'), JSON.stringify(summary));
    const t = new Date(Date.now() - ageMin * 60_000);
    for (const f of ['unit.json', ...(summary ? ['unit-summary.json'] : [])]) utimesSync(join(d, f), t, t);
    utimesSync(d, t, t);
  };
  unit('ok', { workflow: { activity: 'judge-ambiguity' }, outcome: 'pass' }, 1);
  unit('bad', { workflow: { activity: 'validate-plan' }, outcome: 'execution-failure', infrastructureReason: 'infra-exec-failed' }, 1);
  unit('hung', null, 45);
  unit('busy', null, 2);
  const args = ['watch', '--fgos', join(root, '.fgos'), '--root', vault({ a: 'status: todo' })];
  const first = run(args);
  assert.equal(first.code, 4);
  assert.match(first.text, /ALERT failed bad validate-plan execution-failure infra-exec-failed/);
  assert.match(first.text, /ALERT stalled hung/);
  assert.doesNotMatch(first.text, /ok|busy/);
  assert.equal(run(args).code, 0);
});

test('watch --baseline marks the present alerts as seen without reporting them', () => {
  const root = mkdtempSync(join(tmpdir(), 'pbb-'));
  const d = join(root, '.fgos', 'assignments', 'old');
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'unit.json'), '{}');
  writeFileSync(join(d, 'unit-summary.json'), JSON.stringify({ outcome: 'execution-failure' }));
  const args = ['watch', '--fgos', join(root, '.fgos'), '--root', vault({ a: 'status: todo' })];
  const b = run([...args, '--baseline']);
  assert.equal(b.code, 0);
  assert.match(b.text, /1 existing alert/);
  assert.equal(run(args).code, 0);
});

test('report: seven measures come out of unit summaries, recorded checks, queue and detections', () => {
  const root = mkdtempSync(join(tmpdir(), 'pbr-'));
  const mk = (run, caseId, activity, outcome, start, end) => {
    const d = join(root, '.fgos', 'assignments', run);
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'unit.json'), '{}');
    writeFileSync(join(d, 'unit-summary.json'), JSON.stringify({ workflow: { caseId, activity }, outcome, startedAt: start, settledAt: end }));
  };
  mk('a', 'c1', 'judge-ambiguity', 'pass', '2026-01-01T00:00:00Z', '2026-01-01T00:01:00Z');
  mk('b', 'c1', 'validate-plan', 'policy-refusal', '2026-01-01T00:01:00Z', '2026-01-01T00:02:00Z');
  mk('c', 'c1', 'validate-plan', 'pass', '2026-01-01T00:03:00Z', '2026-01-01T00:05:00Z');
  mk('d', 'c1', 'implement-item', 'pass', '2026-01-01T00:04:00Z', '2026-01-01T00:10:00Z');
  const base = ['--fgos', join(root, '.fgos'), '--root', vault({ a: 'status: todo' })];
  const b2 = base.slice(2);
  run(['event', 'c1', 'assigned', '--at', '2025-12-31T23:58:00Z', ...b2]);
  run(['verify', 'c1', 'doctor', 'pass', 'rerun ok', 'gates=fmt+clippy+test', 'widened=2', '--at', '2026-01-01T00:14:00Z', ...b2]);
  run(['verify', 'c1', 'plan', 'fail', 'premise false', 'kind=premise', '--at', '2026-01-01T00:06:00Z', ...b2]);
  run(['verify', 'c1', 'help', 'fail', 'mismatch', 'mismatch=1', 'gates=fmt', '--at', '2026-01-01T00:15:00Z', ...b2]);
  run(['queue', 'add', 'p', 'approve', 'frame', '--kind', 'gate', '--at', '2026-01-01T00:02:00Z', ...b2]);
  run(['queue', 'done', '1', '--at', '2026-01-01T00:03:00Z', ...b2]);
  const r = JSON.parse(run(['report', '--json', ...base]).text);
  const c = r.cases[0];
  assert.equal(c.runs, 4);
  assert.equal(c.fgos_runs.pass, '3/4');
  assert.equal(c.fgos_runs.reruns_of_same_step, 1);
  assert.equal(c.fgos_runs.independent_checks_passed, '1/2');
  assert.deepEqual(c.plan_defects, { total: 1, by_kind: { premise: 1 } });
  assert.equal(c.scope_fidelity.widened_paths, 2);
  assert.equal(c.scope_fidelity.worker_claims_contradicted, 1);
  assert.equal(c.gates_at_first_independent_check.all_gates, 1);
  assert.equal(c.lead_time.total_min, 16);          // 23:58 -> 00:14
  assert.equal(c.lead_time.failed_runs_min, 1);
  assert.equal(c.lead_time.owner_wait_min, 1);
  assert.equal(c.lead_time.verification_min, 4);    // implement-item ended 00:10, checked 00:14
  assert.deepEqual(r.interventions.by_kind, { gate: 1 });
  assert.equal(r.interventions.median_wait_min, 1);
});

test('sessions lists transcript size and assistant messages and records a labelled mark', () => {
  const root = mkdtempSync(join(tmpdir(), 'pbs-'));
  const proj = join(root, 'my.proj');
  const tdir = join(root, 'tr', proj.replace(/[\\/_.]/g, '-'));
  mkdirSync(tdir, { recursive: true });
  writeFileSync(join(tdir, 's1.jsonl'), [{ type: 'user', timestamp: '2026-01-01T00:00:00Z' }, { type: 'assistant', timestamp: '2026-01-01T00:01:00Z' }].map((x) => JSON.stringify(x)).join('\n') + '\n');
  const rows = JSON.parse(run(['sessions', '--json', '--project', proj, '--transcripts', join(root, 'tr'), '--root', vault({ a: 'status: todo' })]).text);
  assert.equal(rows[0].session, 's1');
  assert.equal(rows[0].assistant, 1);
  assert.equal(rows[0].lines, 2);
  const m = run(['sessions', '--label', 'after phase 1', '--project', proj, '--transcripts', join(root, 'tr'), '--root', vault({ a: 'status: todo' })]);
  assert.match(m.text, /mark after phase 1: s1/);
});

test('verify --commit reads unit, e2e and guide from git, not from anyone\'s word', async () => {
  const { spawnSync } = await import('node:child_process');
  const repo = mkdtempSync(join(tmpdir(), 'pbg-'));
  const g = (...a) => spawnSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { encoding: 'utf8' });
  g('init', '-q');
  mkdirSync(join(repo, 'crates/x/src'), { recursive: true });
  mkdirSync(join(repo, 'apps/pkm/tests'), { recursive: true });
  writeFileSync(join(repo, 'crates/x/src/lib.rs'), 'pub fn a() {}\n#[cfg(test)]\nmod t { #[test] fn ok() {} }\n');
  writeFileSync(join(repo, 'apps/pkm/tests/e2e.rs'), 'fn main() {}\n');
  writeFileSync(join(repo, 'README.md'), 'doc\n');
  g('add', '-A'); g('commit', '-q', '-m', 'one');
  const sha = g('rev-parse', 'HEAD').stdout.trim();
  const r = run(['verify', 'c9', 's', 'pass', 'n', '--commit', sha, '--repo', repo, '--root', vault({ a: 'status: todo' })]);
  assert.match(r.text, /"unit":true,"e2e":true,"doc":true/);
  writeFileSync(join(repo, 'crates/x/src/lib.rs'), 'pub fn b() {}\n');
  g('commit', '-qam', 'two');
  const sha2 = g('rev-parse', 'HEAD').stdout.trim();
  assert.match(run(['verify', 'c9', 's2', 'pass', 'n', '--commit', sha2, '--repo', repo, '--root', vault({ a: 'status: todo' })]).text, /"unit":false,"e2e":false,"doc":false/);
});

// ---- several projects on one machine ------------------------------------------------------------------------------

const here = (p) => new URL(p, import.meta.url).pathname;
const installSh = here('../install.sh');
const watchdogSh = here('./watchdog.sh');
const board = here('./plan-board.mjs');

function project(root, name, { failing = false, plans = true } = {}) {
  const dir = join(root, name);
  mkdirSync(join(dir, '.fgos', 'assignments'), { recursive: true });
  if (plans) { mkdirSync(join(dir, 'plans', 'a'), { recursive: true }); writeFileSync(join(dir, 'plans', 'a', 'plan.md'), '---\nstatus: todo\n---\n'); }
  if (failing) {
    mkdirSync(join(dir, '.fgos', 'assignments', 'bad'), { recursive: true });
    writeFileSync(join(dir, '.fgos', 'assignments', 'bad', 'unit.json'), '{}');
    writeFileSync(join(dir, '.fgos', 'assignments', 'bad', 'unit-summary.json'), JSON.stringify({ workflow: { activity: 'validate-plan' }, outcome: 'execution-failure' }));
  }
  return dir;
}
const sandbox = () => {
  const home = mkdtempSync(join(tmpdir(), 'pbi-'));
  return { home, env: { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, 'cfg'), XDG_STATE_HOME: join(home, 'state'), CLAUDE_HOME: join(home, 'claude'), PLAN_SUPERVISOR_NO_SYSTEMD: '1', PLAN_SUPERVISOR_STATE: '' } };
};
const sh = (file, args, env, cwd) => spawnSync('sh', [file, ...args], { env, cwd, encoding: 'utf8' });
const node = (args, env, cwd) => spawnSync(process.execPath, [board, ...args], { env, cwd, encoding: 'utf8' });

test('watch still alerts in a project that has no plans directory', () => {
  const { home, env } = sandbox();
  const p = project(home, 'noplans', { failing: true, plans: false });
  const r = node(['watch'], env, p);
  assert.equal(r.status, 4);
  assert.match(r.stdout, /ALERT failed bad validate-plan execution-failure/);
});

test('two projects with the same folder name get separate state dirs', () => {
  const { home, env } = sandbox();
  const a = project(join(home, 'one'), 'app');
  const b = project(join(home, 'two'), 'app');
  node(['queue', 'add', '-', 'from first'], env, a);
  node(['queue', 'add', '-', 'from second'], env, b);
  assert.match(node(['queue', 'list'], env, a).stdout, /from first/);
  assert.doesNotMatch(node(['queue', 'list'], env, a).stdout, /from second/);
  assert.match(node(['queue', 'list'], env, b).stdout, /from second/);
  assert.equal(readdirSync(join(home, 'state', 'plan-supervisor')).length, 2);
});

test('config sets per-project limits and eligible uses them; bad values are refused', () => {
  const { home, env } = sandbox();
  const p = project(home, 'cfg');
  mkdirSync(join(p, 'plans', 'b'), { recursive: true });
  writeFileSync(join(p, 'plans', 'a', 'plan.md'), '---\nstatus: todo\nfootprint: [x]\n---\n');
  writeFileSync(join(p, 'plans', 'b', 'plan.md'), '---\nstatus: todo\nfootprint: [y]\n---\n');
  node(['claim', 'a', 'leader-1'], env, p);
  assert.doesNotMatch(node(['eligible'], env, p).stdout, /^b\t/m);          // default limit 1
  assert.equal(node(['config', 'set', 'maxRunning', '2'], env, p).status, 0);
  assert.match(node(['eligible'], env, p).stdout, /^b\t/m);
  assert.equal(node(['config', 'set', 'maxRunning', '0'], env, p).status, 2);
  assert.equal(node(['config', 'set', 'nope', '3'], env, p).status, 2);
});

test('doctor reports what a project still needs and exits 1 when a required check fails', () => {
  const { home, env } = sandbox();
  const p = project(home, 'raw');
  const r = node(['doctor'], env, p);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /TODO fgOS initialised in the project -> run `fgctl init`/);
  assert.match(r.stdout, /warn todo plans declare footprint and base/);
});

test('install --add is additive, per project, and --remove disables the timer when none is left', () => {
  const { home, env } = sandbox();
  const a = project(home, 'alpha');
  const b = project(home, 'beta');
  assert.equal(sh(installSh, ['--add', a, '--max-running', '2'], env).status, 0);
  assert.equal(sh(installSh, ['--add', b, '--stall-min', '5'], env).status, 0);
  const list = readFileSync(join(home, 'cfg', 'plan-supervisor', 'projects'), 'utf8').trim().split('\n');
  assert.deepEqual(list, [a, b]);                                             // second add kept the first
  const unit = readFileSync(join(home, 'cfg', 'systemd', 'user', 'plan-supervisor-watchdog.service'), 'utf8');
  assert.doesNotMatch(unit, /alpha|beta/);                                    // the unit names no project
  assert.match(sh(installSh, ['--list'], env).stdout, /"maxRunning":2/);
  assert.match(sh(installSh, ['--list'], env).stdout, /"stallMin":5/);
  mkdirSync(join(a, '.fgos', 'assignments', 'late'), { recursive: true });    // a failure that appears after registration
  writeFileSync(join(a, '.fgos', 'assignments', 'late', 'unit.json'), '{}');
  writeFileSync(join(a, '.fgos', 'assignments', 'late', 'unit-summary.json'), JSON.stringify({ outcome: 'execution-failure' }));
  assert.equal(sh(installSh, ['--add', a], env).status, 0);                   // idempotent, and keeps the baseline
  assert.equal(node(['watch'], env, a).status, 4);                            // so the late failure is still reported
  assert.equal(readFileSync(join(home, 'cfg', 'plan-supervisor', 'projects'), 'utf8').trim().split('\n').length, 2);
  sh(installSh, ['--remove', a], env);
  assert.deepEqual(readFileSync(join(home, 'cfg', 'plan-supervisor', 'projects'), 'utf8').trim().split('\n'), [b]);
  assert.match(sh(installSh, ['--remove', b], env).stdout, /timer disabled/);
  assert.notEqual(sh(installSh, ['--add', join(home, 'missing')], env).status, 0);
  const noFgos = join(home, 'nofgos'); mkdirSync(noFgos);
  assert.match(sh(installSh, ['--add', noFgos], env).stderr, /fgctl init/);
});

test('watchdog reads the registered list and alerts only for the project that failed', () => {
  const { home, env } = sandbox();
  const good = project(home, 'good');
  const bad = project(home, 'bad', { failing: true });
  sh(installSh, ['--add', good], env);
  mkdirSync(join(bad, '.fgos', 'assignments', 'bad'), { recursive: true });
  const listFile = join(home, 'cfg', 'plan-supervisor', 'projects');
  writeFileSync(listFile, readFileSync(listFile, 'utf8') + bad + '\n');       // registered after its baseline: alerts are new
  assert.equal(sh(watchdogSh, [], env).status, 0);
  const alerts = (name) => join(home, 'state', 'plan-supervisor', name, 'alerts.log');
  assert.ok(existsSync(alerts('bad')));
  assert.match(readFileSync(alerts('bad'), 'utf8'), /ALERT failed bad validate-plan/);
  assert.ok(!existsSync(alerts('good')));
  sh(watchdogSh, [], env);
  assert.equal(readFileSync(alerts('bad'), 'utf8').match(/ALERT/g).length, 1); // not repeated
});
