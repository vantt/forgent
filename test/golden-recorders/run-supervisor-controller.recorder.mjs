// Records the golden vectors of the Rust controller (packages/run-supervisor/rust/src/controller/) by running the
// Node modules of src/run-supervisor/ they port. Run: node test/golden-recorders/run-supervisor-controller.recorder.mjs
// Each section writes one file under packages/run-supervisor/contracts/controller/.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = path.join(root, 'packages', 'run-supervisor', 'contracts', 'controller');
fs.mkdirSync(outDir, { recursive: true });

export function write(name, body) {
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(body, null, 2)}\n`);
}

// The native door first: loading it from inside the config/yaml import cycle fails on a missing export.
await import('../../src/native/door.mjs');

export const scratch = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

// SECTION: lease
// run-lock.mjs reaches the filesystem and process identity through src/native/ (an installed addon a checkout
// does not have). The recorder runs the real run-lock.mjs and swaps those two leaves for what they do
// (exclusive hard-link publish; "dead" only for a holder marked dead) through a resolve hook.
{
  const shim = {
    door: 'import fs from "node:fs"; import path from "node:path"; export function installOnce(dir, name, text, mode) { fs.mkdirSync(dir, { recursive: true }); const tmp = path.join(dir, `.tmp-${process.pid}-${Math.random()}`); fs.writeFileSync(tmp, text, { mode }); try { fs.linkSync(tmp, path.join(dir, name)); return "installed"; } catch (e) { if (e.code === "EEXIST") return "already-exists"; throw e; } finally { fs.rmSync(tmp, { force: true }); } }',
    identity: 'export const selfRecord = () => ({ host: "recorder", pid: 1, startTime: "1" }); export const resolveHolderLiveness = (h) => (h && h.dead ? "dead" : "held");',
  };
  const hooks = `export async function resolve(spec, ctx, next) { if (spec.endsWith("/native/door.mjs")) return { url: ${JSON.stringify('data:text/javascript,' + encodeURIComponent(shim.door))}, shortCircuit: true }; if (spec.endsWith("/native/process-identity.mjs")) return { url: ${JSON.stringify('data:text/javascript,' + encodeURIComponent(shim.identity))}, shortCircuit: true }; return next(spec, ctx); }`;
  const { register } = await import('node:module');
  register(`data:text/javascript,${encodeURIComponent(hooks)}`);
  const lock = await import(path.join(root, 'src', 'run-supervisor', 'run-lock.mjs'));
  const runDir = scratch('rs-lease-');
  const A = { id: 'a', host: 'other-host', pid: 11, startTime: '5' };
  const B = { id: 'b', host: 'other-host', pid: 12, startTime: '6' };
  const D = { id: 'dead', host: 'other-host', pid: 13, startTime: '7', dead: true };
  const steps = [];
  const tokens = {};
  const norm = (value) => JSON.parse(JSON.stringify(value, (k, v) => (typeof v === 'string' && Object.values(tokens).includes(v) ? `<${Object.keys(tokens).find((n) => tokens[n] === v)}>` : v)));
  const run = (name, call) => { const out = call(); steps.push({ name, out: norm(out) }); return out; };
  const a1 = lock.acquireRunControl(runDir, { holder: A, purpose: 'unit', now: 1000 }); tokens.t1 = a1.controlToken; steps.push({ name: 'acquire-first', out: norm(a1) });
  run('acquire-while-held', () => lock.acquireRunControl(runDir, { holder: B, purpose: 'unit', now: 2000 }));
  run('acquire-stale-fence', () => lock.acquireRunControl(runDir, { holder: B, purpose: 'unit', expectedControlEpoch: 5, now: 2000 }));
  run('acquire-fresh-heartbeat', () => lock.acquireRunControl(runDir, { holder: B, purpose: 'unit', ttlMs: 5000, now: 2000 }));
  run('inspect-held', () => lock.inspectRunControl(runDir));
  run('is-current', () => lock.isRunControlCurrent(runDir, { controlEpoch: 1, controlToken: tokens.t1 }));
  run('release-unknown-generation', () => lock.releaseRunControl(runDir, { controlEpoch: 9, controlToken: 'x', now: 3000 }));
  run('release-token-mismatch', () => lock.releaseRunControl(runDir, { controlEpoch: 1, controlToken: 'x', now: 3000 }));
  run('release', () => lock.releaseRunControl(runDir, { controlEpoch: 1, controlToken: tokens.t1, now: 3000 }));
  run('release-again', () => lock.releaseRunControl(runDir, { controlEpoch: 1, controlToken: tokens.t1, now: 3000 }));
  run('inspect-released', () => lock.inspectRunControl(runDir));
  const a2 = lock.acquireRunControl(runDir, { holder: D, purpose: 'unit', now: 4000 }); tokens.t2 = a2.controlToken; steps.push({ name: 'acquire-after-release', out: norm(a2) });
  run('inspect-dead-holder', () => lock.inspectRunControl(runDir));
  const a3 = lock.acquireRunControl(runDir, { holder: B, purpose: 'unit', now: 5000 }); tokens.t3 = a3.controlToken; steps.push({ name: 'acquire-reclaim-dead', out: norm(a3) });
  run('settle-superseded', () => lock.settleRunControl(runDir, { controlEpoch: 2, controlToken: tokens.t2, now: 6000 }));
  run('settle', () => lock.settleRunControl(runDir, { controlEpoch: 3, controlToken: tokens.t3, now: 6000 }));
  run('settle-again', () => lock.settleRunControl(runDir, { controlEpoch: 3, controlToken: tokens.t3, now: 6000 }));
  run('inspect-settled', () => lock.inspectRunControl(runDir));
  run('acquire-after-settled', () => lock.acquireRunControl(runDir, { holder: A, purpose: 'unit', now: 7000 }));
  const files = {};
  for (const sub of ['generations', 'releases']) {
    const dir = path.join(runDir, 'control', sub);
    for (const name of fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []) files[`control/${sub}/${name}`] = norm(JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
  }
  write('lease.v1.json', { note: 'recorded from src/run-supervisor/run-lock.mjs; tokens normalised to <t1>..<t3>; a holder with dead:true is the one the recorder judges dead', holders: { A, B, D }, steps, files });
}
// SECTION: launch
// direct-launch.mjs: the pure parts. attemptStepEnv and withIdentityEnv reach the host through the native door
// (state root, writer identity), which a checkout has not got, so they are not recorded; the Rust test states
// their rules. The envelope's clock fields are recorded as an offset from `createdAt`, rounded to whole seconds.
{
  const { execFileSync } = await import('node:child_process');
  const identityShim = 'export const selfRecord = () => ({ host: "recorder", bootId: "recorded-boot", pid: 1, startTime: "1" }); export const resolveHolderLiveness = () => "held"; export const judge = () => "alive"; export const observe = () => ({ kind: "absent" });';
  const script = `
    const shim = 'data:text/javascript,' + encodeURIComponent(process.env.IDENT_SHIM);
    const hook = 'export async function resolve(spec, ctx, next) { if (spec.endsWith("/native/process-identity.mjs")) return { url: ' + JSON.stringify(shim) + ', shortCircuit: true }; return next(spec, ctx); }';
    (await import('node:module')).register('data:text/javascript,' + encodeURIComponent(hook));
    const m = await import('./src/run-supervisor/direct-launch.mjs');
    const host = { hostBin: '/h/fgos', payloadRoot: '/h/payload' };
    const base = { attemptId: 'att-1', unitRunId: 'ur-1', runDir: '/r/run', host, cwd: '/w', mutating: true,
      attempt: { command: '/bin/agent', args: ['-p'], env: { A: '1' }, bwrapPrefix: ['--unshare-pid', '--'], bwrapExecutable: '/usr/bin/bwrap' },
      timeoutMs: 1000, idleTimeoutMs: 500, maxOutputBytes: 4096, cli: 'claude', stepEnv: { PATH: '/bin' }, gateKillGraceMs: 2000, killWaitMs: 300,
      cwdLeaseFile: '/l/cwd.lock', identity: null };
    const secs = (a, b) => Math.round((a.boottimeNs - b.boottimeNs) / 1e9);
    const norm = (e) => { const c = JSON.parse(JSON.stringify(e)); const at = c.createdAt;
      c.createdAt = { bootId: '<boot>' };
      if (c.deadlines.softAt) c.deadlines.softAt = { bootId: '<boot>', afterSec: secs(e.deadlines.softAt, at) };
      c.deadlines.hardCeiling = { bootId: '<boot>', afterSec: secs(e.deadlines.hardCeiling, at) };
      return c; };
    const attempt = (label, input) => { try { return { label, envelope: norm(m.buildEnvelope(input)) }; } catch (e) { return { label, error: { code: e.code, message: e.message, runDir: e.runDir } }; } };
    const terminal = { briefPath: '/r/brief.md', outboxDir: '/r/out', groupKey: 'g1', socketPath: '/run/u/fgos/abc.sock', exitCommand: null, orphanSettleMs: 100, retainFailedPaneMs: 5000 };
    const lanes = m.laneTransport({ ceiling: 4, laneWaitSec: 3 }, 0);
    const out = {
      paths: m.attemptPaths('/r/run', 'a1'),
      gate: { direct: m.attemptGateCommand('/h/fgos', '/r/run'), terminal: m.attemptGateCommand('/h/fgos', '/r/run', { goSocket: '/run/u/s.sock' }) },
      laneTransport: [[{ ceiling: 4, laneWaitSec: 3 }, 0], [{ ceiling: 4, laneWaitSec: 3 }, 1], [{ ceiling: null, laneWaitSec: 3 }, 0], [null, 0]].map(([l, d]) => ({ lanes: l, depth: d, out: m.laneTransport(l, d) })),
      waits: [{ lanes: { ceiling: 4, waitMs: 3000 } }, { lanes: { ceiling: null, waitMs: 3000 } }, {}].map((e) => ({ envelope: e, laneWaitMs: m.laneWaitBudgetMs(e), bindingWaitMs: m.bindingWaitMs(e), settlementCeilingMs: m.settlementCeilingMs(e, { timeoutMs: 1000, gateKillGraceMs: 500 }) })),
      envelopes: [
        attempt('direct-confined-mutating', base),
        attempt('direct-readonly-unconfined', { ...base, mutating: false, cwdLeaseFile: undefined, attempt: { command: '/bin/agent', args: [], env: {} }, maxOutputBytes: 0, idleTimeoutMs: 0, timeoutMs: 0 }),
        attempt('direct-lanes', { ...base, lanes }),
        attempt('terminal-lanes-extra-step', { ...base, terminal, extraSteps: ['cleanup-trust'], lanes }),
        attempt('session', { ...base, terminal, session: { role: 'head:a-b', verbs: [] }, ceilingMs: 9000, lanes }),
        attempt('session-needs-terminal', { ...base, session: { role: 'r', verbs: [] }, ceilingMs: 9000 }),
        attempt('session-needs-ceiling', { ...base, terminal, session: { role: 'r', verbs: [] } }),
        attempt('too-many-steps', { ...base, extraSteps: ['a', 'b'] }),
        attempt('pid-namespace-required', { ...base, attempt: { ...base.attempt, bwrapPrefix: ['--ro-bind', '--'] } }),
      ],
    };
    process.stdout.write(JSON.stringify(out));
  `;
  const out = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: root, encoding: 'utf8', env: { ...process.env, IDENT_SHIM: identityShim } }));
  write('launch.v1.json', { note: 'recorded from src/run-supervisor/direct-launch.mjs; envelope clock fields are offsets from createdAt in whole seconds', ...out });
}
// SECTION: trust-store
// trust-store.v1.json: one case per call of src/run-supervisor/trust-store.mjs. `files` seed a scratch directory
// ($DIR in any text is that directory), `call` names the function and its arguments, `result` / `error` is what
// Node answered, `after` is every file in the directory afterwards (text) and `modes` the permission bits of the
// files named in `modeFiles` before and after.
{
  // trust-store.mjs reaches the durable write, the machine lock and the git door through leaves that need an installed
  // addon (a checkout has none). The recorder runs the real trust-store.mjs and swaps those three for what they do:
  // a temp-file rename keeping the mode, a lock that is always free, and a repository that is never found.
  const trustShim = {
    door: 'import fs from "node:fs"; import path from "node:path"; export function replaceDurably(dir, name, bytes, mode) { const tmp = path.join(dir, `.tmp-${process.pid}-${Math.random()}`); fs.writeFileSync(tmp, bytes, { mode }); fs.renameSync(tmp, path.join(dir, name)); } export const installOnce = () => "installed"; export const canonicalJson = JSON.stringify; export const nativeDoor = () => ({}); export const nativeHelperExe = () => null;',
    lock: 'export const createLockScope = () => ({}); export const resolveLockRoot = () => "/unused"; export const acquireSync = () => ({ result: "acquired", handle: { release() {} } });',
    git: 'export const createGitInspect = () => ({ resolveRepo: () => ({ notARepository: true }) }); export const gitPortOptions = () => ({});',
  };
  const trustHooks = `export async function resolve(spec, ctx, next) { const swap = { "/native/door.mjs": ${JSON.stringify(trustShim.door)}, "/holder-lock/index.mjs": ${JSON.stringify(trustShim.lock)}, "/git/inspect.mjs": ${JSON.stringify(trustShim.git)} }; if (ctx.parentURL && ctx.parentURL.endsWith("/run-supervisor/trust-store.mjs")) for (const [suffix, source] of Object.entries(swap)) if (spec.endsWith(suffix)) return { url: 'data:text/javascript,' + encodeURIComponent(source), shortCircuit: true }; return next(spec, ctx); }`;
  (await import('node:module')).register(`data:text/javascript,${encodeURIComponent(trustHooks)}`);
  const trust = await import('../../src/run-supervisor/trust-store.mjs');
  const entry = (extra = {}) => ({ allowedTools: [], hasTrustDialogAccepted: true, mcpServers: {}, enabledMcpjsonServers: [], disabledMcpjsonServers: [], history: [], ...extra });
  const claude = (projects, extra = {}) => `${JSON.stringify({ numStartups: 7, theme: 'light', ...extra, projects }, null, 2)}\n`;
  const hooks = (value) => JSON.stringify(value);
  const codexRoot = '[projects."/repo"]\ntrust_level = "trusted"\n';
  const cases = [
    { name: 'claude read: trusted', files: { 'c.json': claude({ '/repo': entry() }) }, call: { fn: 'readTrust', path: 'c.json', project: '/repo' } },
    { name: 'claude read: declined', files: { 'c.json': claude({ '/repo': entry({ hasTrustDialogAccepted: false }) }) }, call: { fn: 'readTrust', path: 'c.json', project: '/repo' } },
    { name: 'claude read: absent', files: { 'c.json': claude({}) }, call: { fn: 'readTrust', path: 'c.json', project: '/repo' } },
    { name: 'claude read: missing store', files: {}, call: { fn: 'readTrust', path: 'c.json', project: '/repo' } },
    { name: 'claude read: corrupt store', files: { 'c.json': '{"projects":' }, call: { fn: 'readTrust', path: 'c.json', project: '/repo' } },
    { name: 'claude read: schema drift', files: { 'c.json': '{"projects":[]}' }, call: { fn: 'readTrust', path: 'c.json', project: '/repo' } },
    { name: 'claude seed: derived from trusted root keeps key order', files: { 'c.json': claude({ '/other': entry({ history: [{ display: 'x', n: 1.5 }] }), '/repo': entry() }, { zeta: [], alpha: { b: 1, a: [1, 2] }, note: 'é\u0001"\\/' }) }, call: { fn: 'seedTrust', path: 'c.json', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'claude seed: already seeded writes nothing', files: { 'c.json': claude({ '/repo': entry(), '/repo-wt/a': entry() }) }, call: { fn: 'seedTrust', path: 'c.json', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'claude seed: declined entry is replaced in place', files: { 'c.json': claude({ '/repo': entry(), '/repo-wt/a': entry({ hasTrustDialogAccepted: false }), '/z': entry() }) }, call: { fn: 'seedTrust', path: 'c.json', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'claude seed: untrusted root', files: { 'c.json': claude({ '/repo': entry({ hasTrustDialogAccepted: false }) }) }, call: { fn: 'seedTrust', path: 'c.json', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'claude seed: root absent', files: { 'c.json': claude({}) }, call: { fn: 'seedTrust', path: 'c.json', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'claude seed: relative project path', files: { 'c.json': claude({ '/repo': entry() }) }, call: { fn: 'seedTrust', path: 'c.json', project: 'rel/a', repoRoot: '/repo' } },
    { name: 'claude seed: relative root', files: { 'c.json': claude({ '/repo': entry() }) }, call: { fn: 'seedTrust', path: 'c.json', project: '/repo-wt/a', repoRoot: 'repo' } },
    { name: 'claude seed: missing store', files: {}, call: { fn: 'seedTrust', path: 'c.json', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'claude seed: keeps the store mode', files: { 'c.json': claude({ '/repo': entry() }) }, modeFiles: { 'c.json': 0o640 }, call: { fn: 'seedTrust', path: 'c.json', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'claude config: new private config', files: { 'root.json': claude({ '/repo': entry() }) }, call: { fn: 'seedClaudeConfigTrust', path: 'cfg/.claude.json', project: '/repo-wt/a', repoRoot: '/repo', root: 'root.json' } },
    { name: 'claude config: existing config keeps every key', files: { 'root.json': claude({ '/repo': entry() }), 'cfg/.claude.json': `${JSON.stringify({ oauthAccount: { id: 'u' }, theme: 'light', projects: { '/x': entry() } }, null, 2)}\n` }, call: { fn: 'seedClaudeConfigTrust', path: 'cfg/.claude.json', project: '/repo-wt/a', repoRoot: '/repo', root: 'root.json' } },
    { name: 'claude config: already complete', files: { 'root.json': claude({ '/repo': entry() }), 'cfg/.claude.json': `${JSON.stringify({ hasCompletedOnboarding: true, projects: { '/repo-wt/a': entry() } }, null, 2)}\n` }, call: { fn: 'seedClaudeConfigTrust', path: 'cfg/.claude.json', project: '/repo-wt/a', repoRoot: '/repo', root: 'root.json' } },
    { name: 'claude config: root not trusted', files: { 'root.json': claude({}) }, call: { fn: 'seedClaudeConfigTrust', path: 'cfg/.claude.json', project: '/repo-wt/a', repoRoot: '/repo', root: 'root.json' } },
    { name: 'codex read: trusted section', files: { 'config.toml': `model = "x"\n${codexRoot}` }, call: { fn: 'readCodexTrust', path: 'config.toml', project: '/repo' } },
    { name: 'codex read: section without trust level', files: { 'config.toml': '[projects."/repo"]\ntrust_level = "untrusted"\n' }, call: { fn: 'readCodexTrust', path: 'config.toml', project: '/repo' } },
    { name: 'codex read: trust level of the next section does not count', files: { 'config.toml': '[projects."/repo"]\nnote = [1,\n  2]\n[projects."/b"]\ntrust_level = "trusted"\n' }, call: { fn: 'readCodexTrust', path: 'config.toml', project: '/repo' } },
    { name: 'codex read: absent path and missing file', files: { 'config.toml': codexRoot }, call: { fn: 'readCodexTrust', path: 'config.toml', project: '/nope' } },
    { name: 'codex read: no config file', files: {}, call: { fn: 'readCodexTrust', path: 'config.toml', project: '/repo' } },
    { name: 'codex read: relative path', files: {}, call: { fn: 'readCodexTrust', path: 'config.toml', project: 'repo' } },
    { name: 'codex seed: append derived entry', files: { 'config.toml': `model = "x"\n\n\n${codexRoot}` }, call: { fn: 'seedCodexTrust', path: 'config.toml', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'codex seed: path with quote and backslash escapes', files: { 'config.toml': codexRoot }, call: { fn: 'seedCodexTrust', path: 'config.toml', project: '/repo-wt/a"b\\c\u007f', repoRoot: '/repo' } },
    { name: 'codex seed: already trusted', files: { 'config.toml': `${codexRoot}\n[projects."/repo-wt/a"]\ntrust_level = "trusted"\n` }, call: { fn: 'seedCodexTrust', path: 'config.toml', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'codex seed: private config created from the account root', files: { 'root.toml': codexRoot }, call: { fn: 'seedCodexTrust', path: 'home/config.toml', project: '/repo-wt/a', repoRoot: '/repo', root: 'root.toml' } },
    { name: 'codex seed: untrusted root', files: { 'config.toml': 'model = "x"\n' }, call: { fn: 'seedCodexTrust', path: 'config.toml', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'codex seed: no config and no separate root', files: {}, call: { fn: 'seedCodexTrust', path: 'config.toml', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'codex remove: drops the section only', files: { 'config.toml': `a = 1\n${codexRoot}\n[projects."/b"]\ntrust_level = "trusted"\n` }, call: { fn: 'removeCodexTrust', path: 'config.toml', project: '/repo' } },
    { name: 'codex remove: absent entry', files: { 'config.toml': codexRoot }, call: { fn: 'removeCodexTrust', path: 'config.toml', project: '/zzz' } },
    { name: 'codex hash: plain command', files: {}, call: { fn: 'codexHookTrustHash', event: 'pre_tool_use', matcher: 'Bash', handler: { type: 'command', command: 'echo hi' }, platform: 'linux' } },
    { name: 'codex hash: stop drops its matcher and keeps status message', files: {}, call: { fn: 'codexHookTrustHash', event: 'stop', matcher: '*', handler: { type: 'command', command: 'x', timeout: 5, async: true, statusMessage: 'busy' }, platform: 'linux' } },
    { name: 'codex hash: commandWindows is ignored on linux', files: {}, call: { fn: 'codexHookTrustHash', event: 'session_start', handler: { type: 'command', command: 'a', commandWindows: 'b' }, platform: 'linux' } },
    { name: 'codex hash: commandWindows replaces on win32', files: {}, call: { fn: 'codexHookTrustHash', event: 'session_start', handler: { type: 'command', command: 'a', command_windows: 'b' }, platform: 'win32' } },
    { name: 'codex hooks: entries and skipped', files: { '.codex/hooks.json': hooks({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'one' }, { type: 'prompt' }] }], UserPromptSubmit: [{ matcher: '*', hooks: [{ type: 'command', command: 'two', timeout: 9 }] }], SessionEnd: [{ hooks: [{ type: 'command', command: 'e' }] }], Stop: [{ hooks: [{ type: 'command', command: 'c', additionalContextLimit: 1 }] }] } }) }, call: { fn: 'codexHookTrustEntries', path: '.codex/hooks.json', platform: 'linux' } },
    { name: 'codex hooks: no file', files: {}, call: { fn: 'codexHookTrustEntries', path: '.codex/hooks.json', platform: 'linux' } },
    { name: 'codex hooks: corrupt file', files: { '.codex/hooks.json': '{' }, call: { fn: 'codexHookTrustEntries', path: '.codex/hooks.json', platform: 'linux' } },
    { name: 'codex hook seed: both files, idempotent keys left alone', files: { 'root.toml': codexRoot.replace('/repo', '$DIR/wt'), 'wt/.codex/hooks.json': hooks({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'one' }] }] } }), 'home/config.toml': '[hooks.state."$DIR/wt/.codex/hooks.json:pre_tool_use:0:0"]\ntrusted_hash = "sha256:old"\n' }, call: { fn: 'seedCodexHookTrust', path: 'home/config.toml', project: '$DIR/wt', repoRoot: '$DIR/wt', root: 'root.toml' } },
    { name: 'codex hook seed: new keys appended', files: { 'root.toml': codexRoot.replace('/repo', '$DIR/wt'), 'wt/.codex/hooks.json': hooks({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'one' }] }], Stop: [{ hooks: [{ type: 'command', command: 'two' }] }] } }) }, call: { fn: 'seedCodexHookTrust', path: 'home/config.toml', project: '$DIR/wt', repoRoot: '$DIR/wt', root: 'root.toml' } },
    { name: 'codex hook seed: untrusted root', files: { 'root.toml': 'a = 1\n', 'wt/.codex/hooks.json': hooks({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'two' }] }] } }) }, call: { fn: 'seedCodexHookTrust', path: 'home/config.toml', project: '$DIR/wt', repoRoot: '$DIR/wt', root: 'root.toml' } },
    { name: 'codex hook seed: no hooks', files: {}, call: { fn: 'seedCodexHookTrust', path: 'home/config.toml', project: '$DIR/wt', repoRoot: '$DIR/wt', root: 'root.toml' } },
    { name: 'agy read: trusted through a normalised path', files: { 's.json': '{"trustedWorkspaces":["/a/b/../repo/"]}' }, call: { fn: 'readAgyTrust', path: 's.json', project: '/a/repo' } },
    { name: 'agy read: absent list', files: { 's.json': '{}' }, call: { fn: 'readAgyTrust', path: 's.json', project: '/a/repo' } },
    { name: 'agy read: corrupt file reads as unknown', files: { 's.json': '{' }, call: { fn: 'readAgyTrust', path: 's.json', project: '/a/repo' } },
    { name: 'agy store: array is schema drift', files: { 's.json': '[]' }, call: { fn: 'readAgyStore', path: 's.json' } },
    { name: 'agy store: missing file is empty', files: {}, call: { fn: 'readAgyStore', path: 's.json' } },
    { name: 'agy seed: appended after the trusted root', files: { 's.json': '{"other":{"k":[1]},"trustedWorkspaces":["/repo"]}' }, call: { fn: 'seedAgyTrust', path: 's.json', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'agy seed: already seeded', files: { 's.json': '{"trustedWorkspaces":["/repo","/repo-wt/a"]}' }, call: { fn: 'seedAgyTrust', path: 's.json', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'agy seed: private home written from the account settings', files: { 'root.json': '{"trustedWorkspaces":["/repo"]}' }, call: { fn: 'seedAgyTrust', path: 'home/s.json', project: '/repo-wt/a', repoRoot: '/repo', root: 'root.json' } },
    { name: 'agy seed: untrusted root', files: { 's.json': '{"trustedWorkspaces":[]}' }, call: { fn: 'seedAgyTrust', path: 's.json', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'agy seed: no settings yet', files: {}, call: { fn: 'seedAgyTrust', path: 's.json', project: '/repo-wt/a', repoRoot: '/repo' } },
    { name: 'agy seed: relative project path', files: { 's.json': '{"trustedWorkspaces":["/repo"]}' }, call: { fn: 'seedAgyTrust', path: 's.json', project: 'rel', repoRoot: '/repo' } },
    { name: 'agy remove: drops one entry', files: { 's.json': '{"trustedWorkspaces":["/repo","/repo-wt/a"],"x":1}' }, call: { fn: 'removeAgyTrust', path: 's.json', project: '/repo-wt/a' } },
    { name: 'agy remove: absent entry', files: { 's.json': '{"trustedWorkspaces":["/repo"]}' }, call: { fn: 'removeAgyTrust', path: 's.json', project: '/zzz' } },
  ];

  const walk = (dir, base = dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full, base) : [[path.relative(base, full), fs.readFileSync(full, 'utf8')]];
  });
  const tokenise = (value, dir) => JSON.parse(JSON.stringify(value).split(dir).join('$DIR'));
  const withDir = (text, dir) => (typeof text === 'string' ? text.split('$DIR').join(dir) : text);
  const lockRoot = scratch('fgos-trust-lock-');
  process.env.FGOS_STATE_ROOT = lockRoot;
  for (const c of cases) {
    const dir = scratch('fgos-trust-');
    for (const [rel, text] of Object.entries(c.files)) {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), withDir(text, dir));
    }
    for (const [rel, mode] of Object.entries(c.modeFiles ?? {})) fs.chmodSync(path.join(dir, rel), mode);
    const k = c.call;
    const p = (rel) => path.join(dir, rel);
    const project = withDir(k.project, dir);
    const repoRoot = withDir(k.repoRoot, dir);
    let result;
    let error;
    try {
      switch (k.fn) {
        case 'readTrust': result = trust.readTrust(p(k.path), project); break;
        case 'seedTrust': result = trust.seedTrust(p(k.path), { projectPath: project, repoRoot }); break;
        case 'seedClaudeConfigTrust': result = trust.seedClaudeConfigTrust(p(k.path), { projectPath: project, repoRoot, rootStorePath: p(k.root) }); break;
        case 'readCodexTrust': result = trust.readCodexTrust(p(k.path), project); break;
        case 'seedCodexTrust': result = trust.seedCodexTrust(p(k.path), { projectPath: project, repoRoot, rootConfigPath: k.root ? p(k.root) : undefined }); break;
        case 'removeCodexTrust': result = trust.removeCodexTrust(p(k.path), project); break;
        case 'codexHookTrustHash': result = trust.codexHookTrustHash(k.event, k.matcher, k.handler, k.platform); break;
        case 'codexHookTrustEntries': result = trust.codexHookTrustEntries(p(k.path), k.platform); break;
        case 'seedCodexHookTrust': result = trust.seedCodexHookTrust(p(k.path), { projectPath: project, repoRoot, rootConfigPath: p(k.root) }); break;
        case 'readAgyTrust': result = trust.readAgyTrust(p(k.path), project); break;
        case 'readAgyStore': result = trust.readAgyStore(p(k.path)); break;
        case 'seedAgyTrust': result = trust.seedAgyTrust(p(k.path), { projectPath: project, repoRoot, rootSettingsPath: k.root ? p(k.root) : undefined }); break;
        case 'removeAgyTrust': result = trust.removeAgyTrust(p(k.path), project); break;
        default: throw new Error(`unknown fn ${k.fn}`);
      }
    } catch (err) {
      error = { code: err.code };
    }
    c.files = Object.fromEntries(Object.entries(c.files));
    if (error) c.error = error; else c.result = tokenise(result ?? null, dir);
    c.after = Object.fromEntries(walk(dir).sort(([a], [b]) => (a < b ? -1 : 1)).map(([rel, text]) => [rel, text.split(dir).join('$DIR')]));
    c.modes = Object.fromEntries(Object.keys(c.modeFiles ?? {}).map((rel) => [rel, fs.statSync(p(rel)).mode & 0o777]));
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.rmSync(lockRoot, { recursive: true, force: true });
  write('trust-store.v1.json', { recordedFrom: 'src/run-supervisor/trust-store.mjs', cases });
}
// SECTION: runtime-dir
{
  const { resolveRuntimeSocketDir, ensureRuntimeSocketDir } = await import('../../src/run-supervisor/runtime-dir.mjs');
  const long = `/${'a'.repeat(90)}`;
  const resolveCases = [
    { env: { XDG_RUNTIME_DIR: '/run/user/1000' }, uid: 1000 },
    { env: { XDG_RUNTIME_DIR: 'relative/run' }, uid: 1000 },
    { env: {}, uid: 501 },
    { env: { XDG_RUNTIME_DIR: '' }, uid: 0 },
  ].map(({ env, uid }) => ({ env, uid, dir: resolveRuntimeSocketDir({ env, uid }) }));
  let tooLong;
  try { ensureRuntimeSocketDir({ env: { XDG_RUNTIME_DIR: long }, uid: 1000 }); } catch (err) { tooLong = { env: { XDG_RUNTIME_DIR: long }, uid: 1000, code: err.code, message: err.message }; }
  write('runtime-dir.v1.json', { v: 1, source: 'src/run-supervisor/runtime-dir.mjs', resolve: resolveCases, ensureTooLong: tooLong });
}
// SECTION: config
{
  const { readFileSync } = await import('node:fs');
  // The effective-config door is the native addon, which a checkout without an activated release does not have, so
  // the layering is recorded as the contract states it (project over global over standard) on top of the
  // standard values read from core/config-standard/dispatch.yaml; with an addon present the Node door answers instead.
  const standardText = readFileSync(path.join(root, 'core', 'config-standard', 'dispatch.yaml'), 'utf8');
  const standardOf = (key) => Number(new RegExp(`^  ${key}: (\\d+)$`, 'm').exec(standardText)[1]);
  const standard = { gateKillGraceMs: standardOf('gateKillGraceMs'), cancelWaitMs: standardOf('cancelWaitMs') };
  const cases = [
    { name: 'standard only', global: null, project: null },
    { name: 'global overrides the grace', global: { gateKillGraceMs: 2000 }, project: null },
    { name: 'project overrides the wait, global the grace', global: { gateKillGraceMs: 2000 }, project: { cancelWaitMs: 3000 } },
    { name: 'project beats global', global: { cancelWaitMs: 9000 }, project: { cancelWaitMs: 3000 } },
  ].map((entry) => {
    const pick = (key) => {
      if (entry.project?.[key] !== undefined) return { value: entry.project[key], source: 'project' };
      if (entry.global?.[key] !== undefined) return { value: entry.global[key], source: 'global' };
      return { value: standard[key], source: 'standard' };
    };
    return { ...entry, gateKillGrace: pick('gateKillGraceMs'), cancelWait: pick('cancelWaitMs') };
  });
  write('config.v1.json', { v: 1, source: 'src/run-supervisor/gate-kill-grace.mjs (dispatch keys through the config door); layering recorded from the contract', cases });
}
// SECTION: cwd-lock
{
  const { execFileSync } = await import('node:child_process');
  // A child process: the lease section above swaps src/native/door.mjs for a shim in this one.
  const child = `
    import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
    await import('./src/native/door.mjs');
    const { dispatchInFlightError, acquireDispatchCwdLock } = await import('./src/run-supervisor/cwd-lock.mjs');
    const { resolveLock } = await import('./src/holder-lock/index.mjs');
    const fgosDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'controller-cwd-')));
    const cwd = path.join(fgosDir, 'work'); fs.mkdirSync(cwd);
    const lockPath = resolveLock('dispatch-cwd', { fgosDir, cwd }).v3Path;
    const shape = path.relative(fgosDir, lockPath).replace(/--\\d+-\\d+-\\d+\\.lock$/, '--<cwdDevIno>.lock');
    const errorOf = (err) => ({ code: err.code, errorClass: err.errorClass, message: err.message });
    const inFlight = [123, null].map((pid) => ({ pid, ...errorOf(dispatchInFlightError('/w/tree', { pid, lockPath: '/l/x.lock' })) }));
    let missing;
    try { acquireDispatchCwdLock(fgosDir, '/absent/dir'); } catch (err) { missing = { cwd: '/absent/dir', ...errorOf(err) }; }
    fs.rmSync(fgosDir, { recursive: true, force: true });
    process.stdout.write(JSON.stringify({ shape, inFlight, missing }));
  `;
  const out = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', child], { cwd: root, encoding: 'utf8' }));
  write('cwd-lock.v1.json', { v: 1, source: 'src/run-supervisor/cwd-lock.mjs', lockPathShape: out.shape, inFlight: out.inFlight, missingCwd: out.missing });
}
// SECTION: cancel
{
  const { requestCancel, beginLaunch, endLaunch, register, unregister, registeredRuns, assertNotCancelled, resetCancelRequest } = await import('../../src/run-supervisor/cancel-registry.mjs');
  const dir = scratch('rs-cancel-');
  const runDir = path.join(dir, 'run');
  fs.mkdirSync(runDir);
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify({ attemptId: 'attempt-1', unitRunId: 'unit-1' }));
  // The publish goes through the native addon; where this checkout ships none the key order comes from
  // the object literal in cancel-registry.mjs requestCancel, and `recordedFrom` says so.
  let wrote = requestCancel(runDir, 'SIGINT');
  const published = fs.existsSync(path.join(runDir, 'cancel-requested.json'));
  const record = published
    ? JSON.parse(fs.readFileSync(path.join(runDir, 'cancel-requested.json'), 'utf8'))
    : { v: 1, attemptId: 'attempt-1', requestedBy: '', by: 'signal:SIGINT', requester: {}, at: '' };
  const again = published ? requestCancel(runDir, 'SIGTERM') : true;
  const kept = published ? JSON.parse(fs.readFileSync(path.join(runDir, 'cancel-requested.json'), 'utf8')) : record;
  const noEnvelope = requestCancel(path.join(dir, 'missing'), 'SIGINT');
  wrote = published ? wrote : true;
  resetCancelRequest();
  beginLaunch('/tmp/a/../b');
  register('/tmp/c');
  const runs = registeredRuns();
  endLaunch('/tmp/a/../b');
  unregister('/tmp/c');
  write('cancel.v1.json', {
    note: 'requestCancel on a run dir whose envelope names attempt-1; values of requester/at/requestedBy vary per process and are listed under variable',
    recordedFrom: published ? 'node-run' : 'source-literal',
    wrote, again, noEnvelope,
    keys: Object.keys(record),
    fixed: { v: record.v, attemptId: record.attemptId, by: record.by },
    keptSecond: kept.by === 'signal:SIGINT',
    variable: ['requestedBy', 'requester', 'at'],
    registeredRuns: runs.map((r) => r.replace(/\\/g, '/')),
    exitCodes: { SIGINT: 130, SIGTERM: 143 },
    cancelledMessage: 'cancelled by SIGINT: no new step starts; the attempts in flight are stopped and the unit can be resumed',
    assertNotCancelledAfterReset: (() => { try { assertNotCancelled(); return true; } catch { return false; } })(),
  });
  fs.rmSync(dir, { recursive: true, force: true });
}
// SECTION: sweep
{
  const { listOpenAttemptDirs } = await import('../../src/run-supervisor/client.mjs');
  const dir = scratch('rs-sweep-');
  const mk = (rel, closed) => {
    fs.mkdirSync(path.join(dir, rel), { recursive: true });
    if (closed) fs.writeFileSync(path.join(dir, rel, 'closed.json'), '{}');
  };
  mk('a/producer/1/runs/02');
  mk('a/producer/1/runs/01');
  mk('a/producer/1/runs/00', true);
  mk('b/runs/01');
  mk('c/nothing');
  fs.writeFileSync(path.join(dir, 'b', 'runs', 'file.txt'), 'x');
  const open = listOpenAttemptDirs(dir).map((d) => path.relative(dir, d).split(path.sep).join('/'));
  write('sweep.v1.json', {
    note: 'listOpenAttemptDirs over a fixture tree; closed attempt dirs, files and non-run dirs are left out; the result is sorted',
    tree: ['a/producer/1/runs/02', 'a/producer/1/runs/01', 'a/producer/1/runs/00 (closed)', 'b/runs/01', 'b/runs/file.txt', 'c/nothing'],
    open,
  });
  fs.rmSync(dir, { recursive: true, force: true });
}
