#!/usr/bin/env node
// Assignment-runner golden recorder: replays the Node assignment runner (src/runner/dispatch/assignment-runner.mjs
// and the run-supervisor transport it builds the envelope with) over fixed inputs and writes the results as vectors
// for the Rust `assignment_runner` engine module to replay (packages/execution/engine/tests/assignment_runner.rs).
// Run: node test/golden-recorders/assignment-runner.recorder.mjs [--out <dir>]
// Default out: packages/execution/contracts/assignment-runner.
//
// Everything recorded is the real Node module. Nothing machine-specific reaches a vector: scratch paths are
// written as `$ROOT`, and the process runs in UTC.

process.env.TZ = 'UTC';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const outDir = path.resolve(repo, args.includes('--out') ? args[args.indexOf('--out') + 1] : 'packages/execution/contracts/assignment-runner');
fs.mkdirSync(outDir, { recursive: true });
const write = (name, body) => fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(body, null, 2)}\n`);

// The native door first (loading it from inside the config import cycle fails on a missing export). A checkout does
// not ship the addon, so the recorder loads the one of the activated release, as the transport-round recorder does.
const door = await import('../../src/native/door.mjs');
{
  // A linked worktree's `.git` file names its git dir (`<main>/.git/worktrees/<name>`), so the main checkout is read
  // from the file system, never by asking Git.
  const gitFile = path.join(repo, '.git');
  const mainRoot = fs.statSync(gitFile).isFile()
    ? path.resolve(fs.readFileSync(gitFile, 'utf8').replace(/^gitdir:\s*/, '').trim(), '..', '..', '..')
    : repo;
  const activation = JSON.parse(fs.readFileSync(path.join(mainRoot, '.fgos', 'installation', 'activation.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(activation.releasePath, 'manifest.json'), 'utf8'));
  door.loadNativeAddon({ descriptor: { manifest, releaseRoot: activation.releasePath } });
  // The seat config digest is the host's own answer (the replay digest), so the recorder asks the activated host.
  process.env.FGOS_HOST_BIN ||= path.join(activation.releasePath, 'bin', 'fgos');
}

const runner = await import(path.join(repo, 'src', 'runner', 'dispatch', 'assignment-runner.mjs'));
const cli = await import(path.join(repo, 'src', 'runner', 'dispatch', 'cli.mjs'));
const direct = await import(path.join(repo, 'src', 'run-supervisor', 'direct-launch.mjs'));
const seatClient = await import(path.join(repo, 'src', 'seat-binding', 'client.mjs'));

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-assignment-runner-rec-'));
const plain = (v) => JSON.parse(JSON.stringify(v ?? null));
const scrub = (text) => (typeof text === 'string' ? text.split(fs.realpathSync(scratch)).join('$ROOT').split(scratch).join('$ROOT') : text);
const scrubAll = (v) => JSON.parse(scrub(JSON.stringify(v)));
const refusal = (error) => ({ name: error?.name, code: error?.code ?? null, phase: error?.phase ?? null, message: scrub(error?.message) });
const attempt = async (fn) => {
  try { return { ok: scrubAll(plain(await fn())) }; } catch (error) { return { error: refusal(error) }; }
};

// SECTION: legality. `executeAssignment` judges legality before it reads any config or writes any file, so a
// refusal here is the legality gate alone.
// The git half of the mutating gate (the checkout posture and the binding replay behind it) asks Git Inspect, whose
// addon a checkout does not ship, so the recorder cannot run it: the Rust tests cover those refusals through a fake
// checkout, with the messages read from the Node source.
const main = path.join(scratch, 'main');
fs.mkdirSync(main);
const linked = path.join(scratch, 'linked');
fs.mkdirSync(linked);
const unitRunId = 'unit-run-1';
const runsRoot = path.join(main, '.fgos', 'assignments', unitRunId);
fs.mkdirSync(runsRoot, { recursive: true });
const committedConfig = { executors: { a: { kind: 'agent', command: 'claude', args: ['{prompt}'] } } };
const configDigest = seatClient.digest({ runner: committedConfig });
const unitJson = (overrides = {}) => ({ worktree: linked, unit: { id: unitRunId }, bindings: { 'producer/1': [{ assignmentId: `${unitRunId}/producer/1`, binding: { bindingInput: { configDigest } } }] }, ...overrides });
const base = {
  assignmentId: `${unitRunId}/producer/1`, role: 'producer', round: 1, mutation: 'mutating',
  provenance: { kind: 'unit-run', seat: 'producer', unitRunId },
  binding: { executor: 'a', tier: 'standard', posture: 'workspace-write' },
};
const legalityCases = [];
async function legality(name, assignment, opts, files = {}) {
  fs.writeFileSync(path.join(runsRoot, 'unit.json'), JSON.stringify(files.unit ?? unitJson()));
  if (files.noUnit) fs.rmSync(path.join(runsRoot, 'unit.json'));
  const result = await attempt(() => runner.executeAssignment(assignment, { repoRoot: main, ...opts }));
  legalityCases.push({ name, assignment: scrubAll(assignment), options: scrubAll({ ...opts, cwd: opts.cwd }), unitJson: files.noUnit ? null : scrubAll(files.unit ?? unitJson()), result });
}
await legality('assignment must be an object', null, {});
await legality('human-only dispatch refused', { assignmentId: 'a', operation: 'op', role: 'producer', dispatch: 'human-only', provenance: { kind: 'inline' } }, {});
await legality('declared assignment without a legal-operation list', { assignmentId: 'a', stage: 's', operation: 'op', domain: 'd', role: 'producer', provenance: { kind: 'declared' } }, {});
await legality('declared operation not in the step', { assignmentId: 'a', stage: 's', operation: 'op', domain: 'd', role: 'producer', provenance: { kind: 'declared', declared: { legalOperations: ['other', { id: 'second' }] } } }, {});
await legality('human-only operation of the step', { assignmentId: 'a', stage: 's', operation: 'op', domain: 'd', role: 'producer', provenance: { kind: 'declared' } }, { operations: [{ id: 'op', dispatch: 'human-only' }] });
await legality('read-only mode refuses a mutating assignment', { assignmentId: 'a', operation: 'op', role: 'producer', mutation: 'mutating', provenance: { kind: 'declared' } }, { isReadOnlyMode: true });
await legality('mutating inline needs the explicit assertion', { assignmentId: 'a', operation: 'op', role: 'producer', mutation: 'mutating', provenance: { kind: 'inline' } }, {});
await legality('mutating inline claiming the retired stamp', { assignmentId: 'a', operation: 'op', role: 'producer', mutation: 'mutating', provenance: { kind: 'inline', inline: { contract: { constraints: ['protocol-operation:d@1#o'] } } } }, { isReadOnlyMode: false });
await legality('mutating inline with no unit-run gate', { assignmentId: 'a', operation: 'op', role: 'producer', mutation: 'mutating', provenance: { kind: 'inline' } }, { isReadOnlyMode: false });
await legality('unit-run with no unit.json refused', base, { isReadOnlyMode: false, cwd: linked }, { noUnit: true });
write('legality.v1.json', { contract: 'assignment-runner-legality.v1', cases: legalityCases });

// SECTION: replay digest. Unchanged in bytes: the digest a binding records of the config slice it was bound under.
const digestInputs = [
  {},
  { executors: { a: { kind: 'agent', command: 'claude', args: ['{prompt}'] } } },
  { capabilities: { 'code:implement': { tier: 'standard', maxTier: 'high', prefer: ['a'], ignored: 1 } }, roles: { producer: { tier: 'high', pool: 'main', note: 'x' } } },
  { capabilities: { 'code:implement': { tier: 'high' } }, roles: { producer: { tier: 'high', pool: 'main' } }, personas: { reviewer: { tier: 'low', prefer: ['b'] } } },
  { runner: { capabilities: { 'code:review': { tier: 'low' } } } },
];
write('replay-digest.v1.json', { contract: 'assignment-runner-replay-digest.v1', cases: digestInputs.map((runnerConfig) => ({ runnerConfig, digest: seatClient.digest({ runner: runnerConfig }) })) });

// SECTION: lanes. The envelope's `lanes` field: depth 0 only.
const laneCases = [];
for (const lanes of [undefined, null, { ceiling: 4, laneWaitSec: 30 }, { ceiling: null, laneWaitSec: 0 }, { laneWaitSec: 5 }]) {
  for (const depth of [0, 1, 2]) laneCases.push({ lanes: lanes ?? null, depth, lanesField: plain(direct.laneTransport(lanes, depth)) });
}
write('lanes.v1.json', { contract: 'assignment-runner-lanes.v1', cases: laneCases });

// SECTION: terminal args
const terminalCases = [];
const run = path.join(scratch, 'unit', 'runs', '01');
fs.mkdirSync(run, { recursive: true });
fs.mkdirSync(path.join(scratch, 'unit', 'inputs'));
const sibling = path.join(scratch, 'sibling', 'report.md');
fs.mkdirSync(path.dirname(sibling), { recursive: true });
fs.writeFileSync(sibling, 'r');
fs.writeFileSync(path.join(scratch, 'unit', 'assignment.json'), JSON.stringify({ contextRefs: [sibling, 'relative.md', path.join(scratch, 'missing.md')] }));
const commands = [
  { name: 'claude pane', resolvedCmd: { command: 'claude', args: ['-p', 'hello', '--model', 'm'], argsTemplate: ['-p', '{prompt}', '--model', '{model}'], interactiveMode: { kind: 'claude' } }, writerId: 'w1' },
  { name: 'claude pane keeps operator add-dir', resolvedCmd: { command: '/usr/bin/claude', args: ['--add-dir', '/op'], argsTemplate: ['--add-dir', '/op'], interactiveMode: { kind: 'claude' } }, writerId: 'w1' },
  { name: 'codex pane with a case', resolvedCmd: { command: 'codex', args: ['exec', 'hello'], argsTemplate: ['exec', '{prompt}'], interactiveMode: { kind: 'codex' }, promptDelivery: 'file-pointer' }, writerId: 'w2', caseContext: { caseId: 'c1', reservationId: 'r1' } },
  { name: 'codex pane without a case', resolvedCmd: { command: 'codex', args: ['exec', 'hello'], argsTemplate: ['exec', '{prompt}'], interactiveMode: { kind: 'codex' } }, writerId: 'w2' },
  { name: 'other agent without a template compares the prompt', resolvedCmd: { command: 'pi', args: ['hello', '--x'], interactiveMode: { kind: 'pi' } }, writerId: 'w3' },
];
for (const c of commands) {
  const input = { resolvedCmd: c.resolvedCmd, prompt: 'hello', model: 'm', runDir: run, writerId: c.writerId, caseContext: c.caseContext ?? null };
  terminalCases.push({ name: c.name, input: scrubAll(input), args: scrubAll(runner.terminalAgentArgs(input)), delivery: runner.terminalPromptDelivery(c.resolvedCmd) });
}
const accessCases = [
  { name: 'cli-spawn claude gets its outbox', input: { adapter: 'cli-spawn', command: 'claude', args: ['-p', 'x'], outboxDir: path.join(scratch, 'out') } },
  { name: 'cli-spawn other cli gets nothing', input: { adapter: 'cli-spawn', command: 'codex', args: ['x'], outboxDir: path.join(scratch, 'out') } },
  { name: 'cli-spawn without an outbox', input: { adapter: 'cli-spawn', command: 'claude', args: ['x'] } },
  { name: 'cli-spawn keeps an operator add-dir', input: { adapter: 'cli-spawn', command: 'claude', args: ['--add-dir', '/op', '-p'], outboxDir: path.join(scratch, 'out') } },
  { name: 'herdr claude', input: { adapter: 'herdr-spawn', interactiveMode: { kind: 'claude' }, args: ['a'], runDir: run } },
  { name: 'herdr non-claude', input: { adapter: 'herdr-spawn', interactiveMode: { kind: 'codex' }, args: ['a'], runDir: run } },
];
for (const c of accessCases) terminalCases.push({ name: c.name, accessInput: scrubAll(c.input), args: scrubAll(cli.withRunDirAccess(c.input)) });
const addDirsCases = [[], ['--add-dir', 'a', 'b', '--x', 'c'], ['--add-dir=d', 'e'], ['-p', 'x', '--add-dir', 'f']].map((argv) => ({ argv, dirs: cli.addDirsOf(argv) }));
write('terminal-args.v1.json', { contract: 'assignment-runner-terminal-args.v1', cases: terminalCases, addDirs: addDirsCases });

// SECTION: inputs. Pinned inputs and the dirty-before snapshot.
const inputs = path.join(main, 'plan.md');
fs.writeFileSync(inputs, 'plan body');
const outside = path.join(scratch, 'outside.md');
fs.writeFileSync(outside, 'outside');
const inLinked = path.join(linked, 'sub', 'doc.md');
fs.mkdirSync(path.dirname(inLinked), { recursive: true });
fs.writeFileSync(inLinked, 'linked doc');
fs.mkdirSync(path.join(main, 'adir'));
const pinCases = [
  { name: 'file in the main checkout', pins: [inputs] },
  { name: 'file in a linked worktree', pins: [inLinked] },
  { name: 'outside every allowed root', pins: [outside] },
  { name: 'missing', pins: [path.join(main, 'nope.md')] },
  { name: 'a directory', pins: [path.join(main, 'adir')] },
  { name: 'several', pins: [inputs, outside, inLinked] },
  { name: 'none', pins: [] },
];
const pinResults = pinCases.map((c) => ({ ...c, pins: scrubAll(c.pins), digests: scrubAll(runner.digestPinnedInputs(c.pins, main)) }));
fs.writeFileSync(path.join(linked, 'dirty.txt'), 'dirty');
const snapshot = runner.snapshotDirtyBeforeFiles(linked, ['dirty.txt', 'gone.txt']);
write('inputs.v1.json', {
  contract: 'assignment-runner-inputs.v1',
  // Node read the allowed roots through Git Inspect; with no addon only the main checkout is allowed.
  roots: ['$ROOT/main'],
  pins: pinResults,
  snapshots: { files: { 'dirty.txt': 'dirty' }, dirtyBefore: ['dirty.txt', 'gone.txt'], result: Object.fromEntries([...snapshot.entries()].map(([k, v]) => [k, { exists: v.exists, hash: v.hash }])), expectedDirtySha256: crypto.createHash('sha256').update('dirty').digest('hex') },
});

fs.rmSync(scratch, { recursive: true, force: true });
console.log(`assignment-runner vectors written to ${path.relative(repo, outDir)}`);
