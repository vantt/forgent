#!/usr/bin/env node
// Records the golden vectors of the runner config loader and of the Unit-run judgements that the Rust crate
// `fgos-execution` (modules `runner_config`, `run_facts`) replays. Run it from the repository root:
//
//   node test/golden-recorders/core-runner-config.recorder.mjs
//
// The config vectors run the real `loadRunnerConfigForDir` (`src/runner/dispatch/config.mjs`) over documents the config
// door would hand it: only `src/config/facade.mjs` is replaced, by a module that answers from the recorded document, so
// the recorder needs no native addon. The run vectors run the real `unitRunFacts` and `judgeUnitRun` over a real
// directory built per vector; the controller, custody and unit-state reads are the only inputs the Rust side takes as
// facts, and each vector records what it read. Vectors are written, never edited by hand.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { register } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// The real modules, with the reads answered from the recorded document: every other export stays the real one. The
// facade's two door reads come from the config document; the Unit-run judges' three reads of the machine (the controller
// ledger, the custody holders, the derived unit state) come from `globalThis.__reads`, so a vector can state a held
// controller or a held custody without the recorder holding a real lock.
const real = (file) => fs.readFileSync(path.join(repo, file), 'utf8');
const swap = (file, replacements, extra) => {
  let source = real(file);
  for (const [from, to] of replacements) {
    if (!source.includes(from)) throw new Error(`${file} no longer declares ${from}`);
    source = source.replace(from, to);
  }
  return { url: pathToFileURL(path.join(repo, file)).href, source: `${source}\n${extra}\n` };
};
const swapped = [
  swap('src/config/facade.mjs', [['export function readConfig(', 'function realReadConfig('], ['export const checkConfig =', 'const realCheckConfig =']], `
export function readConfig() {
  const door = globalThis.__fgosDoor;
  if (door.refused) throw new ConfigDoorError({ id: door.refused.id, refusals: door.refused.refusals ?? [] });
  return { value: { runner: door.runner }, origins: door.origins };
}
export function checkConfig() { return { findings: globalThis.__fgosDoor.checkFindings ?? [] }; }`),
  swap('src/runner/execution/unit-control.mjs', [['export function unitControllerHeld(', 'function realUnitControllerHeld(']], 'export function unitControllerHeld() { return globalThis.__reads.controllerHeld; }'),
  swap('src/runner/execution/custody-door.mjs', [['export function custodyHeld(', 'function realCustodyHeld(']], 'export function custodyHeld() { return globalThis.__reads.custodyHeld; }'),
  swap('src/runner/execution/unit-state.mjs', [['export function deriveUnitState(', 'function realDeriveUnitState(']], 'export function deriveUnitState(unitDir) { return { unitRunId: unitDir.split("/").pop(), unitState: globalThis.__reads.unitState }; }'),
];
const hooks = `
const swapped = new Map(${JSON.stringify(swapped.map(({ url, source }) => [url, source]))});
export async function load(url, context, next) {
  if (swapped.has(url)) return { format: 'module', shortCircuit: true, source: swapped.get(url) };
  return next(url, context);
}`;
register(`data:text/javascript,${encodeURIComponent(hooks)}`);

const config = await import(path.join(repo, 'src/runner/dispatch/config.mjs'));
const { ConfigDoorError } = await import(path.join(repo, 'src/config/facade.mjs'));
const { fgosDirFromRoot } = await import(path.join(repo, 'src/util/fgos-file-registry.mjs'));
const { unitRunFacts, judgeUnitRun } = await import(path.join(repo, 'src/runner/execution/unit-run-record.mjs'));

const ROOT_TOKEN = '$ROOT';
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-runner-config-'));
const project = path.join(root, 'project');
const rooted = (value) => JSON.parse(JSON.stringify(value).split(root).join(ROOT_TOKEN));
const unrooted = (value) => JSON.parse(JSON.stringify(value).split(ROOT_TOKEN).join(root));
const plain = (value) => JSON.parse(JSON.stringify(value));

const executor = { command: 'claude', args: [] };
const at = (p, file, line, column, layer) => ({ path: p, layer, role: 'value', file, line, column, described: false });
const projectFile = (line, p, column = 3) => at(p, 'project:config.yaml', line, column, 'project');
const globalFile = (line, p, column = 3) => at(p, 'global:config.yaml', line, column, 'global');
const refusal = (id, p, file, line, column, keyword) => ({ id, path: p, file, line, column, keyword });

// ---- config vectors ------------------------------------------------------------------------------------------------
const doors = [
  ['an empty runner section loads as an empty config', { runner: {}, origins: [] }],
  ['a runner section with a default executor loads unchanged and carries its origins', { runner: { executor }, origins: [projectFile(2, 'runner.executor.command')] }],
  ['legacy confinement flags on the default executor become a policy and keep the backend', { runner: { executor: { ...executor, confinement: { privateHome: true, ownWorktree: true, backend: 'bwrap' } } }, origins: [] }],
  ['legacy short-form flags on a named executor become a policy', { runner: { executors: { claude: { invocations: [{ via: 'cli', command: 'claude' }], confinement: { home: 'private', session: 'isolated', workspace: 'own' } } } }, origins: [] }],
  ['a controls-only confinement is filled with the policy defaults, grants from a private home', { runner: { executors: { claude: { invocations: [{ via: 'cli', command: 'claude' }], confinement: { controls: { home: 'private', hostWrite: 'deny' }, networkFilter: null } } } }, origins: [] }],
  ['a controls-only confinement keeps its own grants and backend', { runner: { executors: { claude: { invocations: [{ via: 'cli', command: 'claude' }], confinement: { controls: { session: 'isolated' }, grants: [{ resource: 'x', access: 'read', scope: 'dispatch' }], backend: 'bwrap' } } } }, origins: [] }],
  ['a policy already in the v1 shape stays as it is', { runner: { executors: { claude: { invocations: [{ via: 'cli', command: 'claude' }], confinement: { contract: 'confinement-policy.v1', controls: { hostWrite: 'deny' }, grants: [], backend: 'bwrap' } } } }, origins: [] }],
  ['a confinement with no flags and no controls is left alone', { runner: { executors: { claude: { invocations: [{ via: 'cli', command: 'claude' }], confinement: { backend: 'bwrap' } } } }, origins: [] }],
  ['a global runner.rigorToTier names the global file with line and column', { runner: { executor }, origins: [globalFile(7, 'runner.rigorToTier.medium', 5)] }],
  ['a global runner.rigorToTier with no position names only the file', { runner: { executor }, origins: [{ path: 'runner.rigorToTier', layer: 'global', file: 'global:config.json', role: 'value' }] }],
  ['a global runner.rigorToTier with no file names config.json', { runner: { executor }, origins: [{ path: 'runner.rigorToTier', layer: 'global', role: 'value' }] }],
  ['a project runner.rigorToTier is the shape check\'s refusal, with no position', { runner: { executor, rigorToTier: { medium: 'a' } }, origins: [projectFile(4, 'runner.rigorToTier')] }],
  ['a retired runner key is refused unattributed', { runner: { readOnlyExecutorRedirects: {} }, origins: [] }],
  ['a retired pattern key is attributed to the project file and line', { runner: { patterns: { reviewed: { maxRounds: 3 } } }, origins: [projectFile(12, 'runner.patterns.reviewed.maxRounds')] }],
  ['a retired pattern key from the global file is attributed to the home directory', { runner: { patterns: { defaultRule: 'x' } }, origins: [globalFile(3, 'runner.patterns.defaultRule')] }],
  ['a retired pattern key with an origin only on its parent falls to the nearest ancestor', { runner: { patterns: { reviewed: { checkersByRigor: { low: 1 } } } }, origins: [projectFile(9, 'runner.patterns.reviewed')] }],
  ['a retired pattern key with no origin keeps the plain message', { runner: { patterns: { reviewed: { maxRounds: 3 } } }, origins: [] }],
  ['two retired pattern keys from two files list each location, the common parent in the subpath', { runner: { patterns: { reviewed: { maxRounds: 3, checkersByRigor: { low: 1 } } } }, origins: [projectFile(12, 'runner.patterns.reviewed.maxRounds'), projectFile(14, 'runner.patterns.reviewed.checkersByRigor', 5), globalFile(3, 'runner.patterns.reviewed.maxRounds')] }],
  ['two refusal paths that share one origin location list it once', { runner: { patterns: { reviewed: { maxRounds: 3, checkersByRigor: { low: 1 } } } }, origins: [projectFile(12, 'runner.patterns.reviewed'), projectFile(12, 'runner.patterns.reviewed.maxRounds')] }],
  ['a shipped-layer origin shows as the standard', { runner: { patterns: { reviewed: { maxRounds: 3 } } }, origins: [at('runner.patterns.reviewed.maxRounds', 'standard:runner.yaml', 5, 3, 'standard')] }],
  ['an origin of another layer shows its own file', { runner: { patterns: { reviewed: { maxRounds: 3 } } }, origins: [at('runner.patterns.reviewed.maxRounds', 'machine.yaml', 5, 3, 'accounts')] }],
  ['an origin with no line shows the bare file', { runner: { patterns: { reviewed: { maxRounds: 3 } } }, origins: [{ path: 'runner.patterns.reviewed.maxRounds', layer: 'project', file: 'project:config.yaml', role: 'value' }] }],
  ['a project origin with no file names config.yaml under the project .fgos', { runner: { patterns: { reviewed: { maxRounds: 3 } } }, origins: [{ path: 'runner.patterns.reviewed.maxRounds', layer: 'project', role: 'value', line: 7, column: 3 }] }],
  ['an origin with no layer is told by its file prefix', { runner: { patterns: { reviewed: { maxRounds: 3 } } }, origins: [{ path: 'runner.patterns.reviewed.maxRounds', file: 'global:other.yaml', line: 2, column: 1 }, { path: 'runner.patterns.reviewed.maxRounds', file: 'project:sub/c.yaml', line: 8, column: 1 }] }],
  ['a descendant origin under the failing container is used when the key itself has none', { runner: { patterns: { reviewed: { maxRounds: 3 } } }, origins: [projectFile(40, 'runner.patterns.reviewed.maxRounds.x'), projectFile(41, 'runner.patterns.reviewed.maxRounds[0]')] }],
  ['a loop bound the loop does not read is attributed to the missing key\'s parent', { runner: { loops: { reviewed: { bounds: { bogus: 1 } } } }, origins: [projectFile(30, 'runner.loops.reviewed.bounds', 5)] }],
  ['a loop bound with a deep missing key climbs to the nearest existing parent entry', { runner: { loops: { reviewed: { bounds: { bogus: 1 } } } }, origins: [projectFile(31, 'runner.loops.reviewed.other', 7), projectFile(33, 'runner.loops.reviewed.zzz', 7)] }],
  ['a provider that still lists accounts is refused unattributed with the retired code', { runner: { providers: { anthropic: { accounts: { a: {} } } } }, origins: [] }],
];

const configVectors = [];
for (const [name, door] of doors) {
  globalThis.__fgosDoor = unrooted(door);
  let expect;
  try {
    const cfg = config.loadRunnerConfigForDir(project);
    expect = { ok: { config: plain(cfg), origins: plain(config.runnerOriginsOf(cfg) ?? []) } };
  } catch (err) {
    expect = { error: plain({ name: err.name, category: err.category, code: err.code, phase: err.phase, message: err.message, path: err.path, paths: err.paths, detail: err.detail }) };
  }
  configVectors.push({ name, root: `${ROOT_TOKEN}/project`, door: rooted(door), expect: rooted(expect) });
}

// The door's refusals: its message, code and every refusal with file and position.
const refusals = [
  ['a refusal that names no retired key keeps the door message and code', { id: 'config-schema', refusals: [refusal('config-schema', 'runner.executor', 'project:config.yaml', 2, 3, 'type')] }, []],
  ['a refused retired pattern key is told what replaced it, with the position', { id: 'config-schema', refusals: [refusal('config-schema', 'runner.patterns.reviewed.maxRounds', '/proj/.fgos/config.yaml', 5, 7, 'unknown')] }, []],
  ['a refused retired key of the global file names the home directory', { id: 'config-schema', refusals: [refusal('config-schema', 'runner.patterns.defaultRule', 'global:config.yaml', 1, 1, 'unknown')] }, []],
  ['a refusal with no line has no position', { id: 'config-schema', refusals: [refusal('config-schema', 'runner.patterns.research-fan-out-gated.x', 'global:config.yaml', undefined, undefined, 'unknown')] }, []],
  ['a refusal with no file names the placeholder', { id: 'config-schema', refusals: [{ id: 'config-schema', path: 'runner.patterns.defaultRule', keyword: 'unknown' }] }, []],
  ['the same retired key in the same file is told once, in another file again', { id: 'config-schema', refusals: [refusal('c', 'runner.patterns.defaultRule', 'global:config.yaml', 1, 1), refusal('c', 'runner.patterns.defaultRule.x', 'global:config.yaml', 2, 1), refusal('c', 'runner.patterns.defaultRule', '/p/.fgos/config.yaml', 3, 1)] }, []],
  ['a retired key found only by the config check is told, check findings before refusals', { id: 'config-schema', refusals: [refusal('c', 'runner.patterns.defaultRule', 'global:config.yaml', 9, 2)] }, [{ row: 'config', file: 'project:config.yaml', line: 4, column: 3, path: 'runner.patterns.reviewed.maxRounds' }]],
  ['a refusal with no path and a non-retired path is skipped', { id: 'config-io', refusals: [{ id: 'config-io', keyword: 'io' }, refusal('c', 'runner.executor', 'project:config.yaml', 1, 1)] }, []],
];
const refusalVectors = [];
for (const [name, refused, checkFindings] of refusals) {
  globalThis.__fgosDoor = { refused: { id: refused.id, refusals: refused.refusals }, checkFindings };
  const thrown = new ConfigDoorError({ id: refused.id, refusals: refused.refusals });
  let expect;
  try {
    config.loadRunnerConfigForDir(project);
    throw new Error('a refusal vector must refuse');
  } catch (err) {
    expect = { error: plain({ name: err.name, category: err.category, code: err.code, phase: err.phase, message: err.message, path: err.path, paths: err.paths, detail: err.detail }) };
  }
  refusalVectors.push({ name, root: `${ROOT_TOKEN}/project`, door: { refused: { code: thrown.code, message: thrown.message, refusals: thrown.refusals }, checkFindings }, expect });
}

// ---- run vectors -----------------------------------------------------------------------------------------------------
// Each vector builds the directory a Unit run lives in, then records what the Node judges answer and the facts the Rust
// judgements take: the record bytes (as text), whether the controller ledger says held, whether the worktree exists.
const fgosDir = fgosDirFromRoot(path.join(root, 'main'));
const assignments = path.join(fgosDir, 'assignments');
fs.mkdirSync(assignments, { recursive: true });
const worktreeDir = path.join(root, 'worktree');
fs.mkdirSync(worktreeDir);

function build(id, { record, rawRecord, summary }) {
  const dir = path.join(assignments, id);
  fs.mkdirSync(dir, { recursive: true });
  if (rawRecord !== undefined) fs.writeFileSync(path.join(dir, 'unit.json'), rawRecord);
  else if (record !== undefined) fs.writeFileSync(path.join(dir, 'unit.json'), JSON.stringify(record));
  if (summary) fs.writeFileSync(path.join(dir, 'unit-summary.json'), JSON.stringify(summary));
  return dir;
}

const runCases = [
  ['a settled record with a worktree and a case reads as settled and resumable', 'run-a', { record: { execution: { status: 'settled' }, worktree: worktreeDir, writeScope: ['src/a.mjs'], workflow: { caseId: 'case-1' } } }],
  ['a record whose worktree is gone is not resumable', 'run-b', { record: { execution: { status: 'running' }, worktree: path.join(root, 'gone'), unit: { writes: ['docs/'] } } }],
  ['writeScope wins over the unit writes, an empty list stays', 'run-c', { record: { writeScope: [], unit: { writes: ['x'] } } }],
  ['a record with no scope reads null; a non-string worktree reads null', 'run-d', { record: { worktree: 5, workflow: { caseId: null } } }],
  ['an unreadable record reads as not settled and not resumable but existing', 'run-e', { rawRecord: '{not json' }],
  ['a record that is JSON but not an object reads as no facts', 'run-f', { rawRecord: '[1,2]' }],
  ['a record with a byte order mark does not parse', 'run-g', { rawRecord: '﻿{"execution":{"status":"settled"}}' }],
  ['a record with a non-string case id passes it through', 'run-h', { record: { workflow: { caseId: 7 } } }],
];

const runFactVectors = [];
for (const [name, id, spec] of runCases) {
  build(id, spec);
  for (const held of [false, true]) {
    globalThis.__reads = { controllerHeld: held };
    const facts = plain(unitRunFacts(fgosDir, id));
    runFactVectors.push({
      name: held ? `${name} (controller held)` : name,
      recordText: fs.existsSync(path.join(assignments, id, 'unit.json')) ? fs.readFileSync(path.join(assignments, id, 'unit.json'), 'utf8') : null,
      controlHeld: held,
      worktreeExists: typeof facts.worktree === 'string' && fs.existsSync(facts.worktree),
      expect: facts,
    });
  }
}
// A run id that names no directory, or is not a plain id, reads as not existing.
globalThis.__reads = { controllerHeld: true };
runFactVectors.push({ name: 'a run id that names no directory exists nowhere', recordText: null, controlHeld: false, worktreeExists: false, expect: plain(unitRunFacts(fgosDir, 'no-such-run')) });
runFactVectors.push({ name: 'an unsafe run id exists nowhere', recordText: null, controlHeld: true, worktreeExists: false, unsafeId: true, expect: plain(unitRunFacts(fgosDir, '../x')) });

// The judge: every row of the keep-reason table, in its order, then the removable run. `standing` is the lstat read
// the caller makes of `assignments/<id>`; `unitState` is `deriveUnitState`'s answer the caller reads.
const judgeVectors = [];
const judge = (name, id, input, owner, spec) => {
  if (spec) build(id, spec);
  const reads = input.standing;
  globalThis.__reads = { controllerHeld: reads.controllerHeld, custodyHeld: reads.custodyHeld, unitState: reads.unitState };
  const verdict = plain(judgeUnitRun(fgosDir, id, owner));
  judgeVectors.push({ name, unitRunId: id, caseId: owner.caseId, unless: [...(owner.unless ?? [])], ...input, expect: rooted(verdict) });
};
// A plain id that is a link out of the assignments directory, and a link that stays inside it.
fs.symlinkSync(worktreeDir, path.join(assignments, 'a-link'));
fs.mkdirSync(path.join(assignments, 'link-target'));
fs.symlinkSync(path.join(assignments, 'link-target'), path.join(assignments, 'run-link'));
const mine = { workflow: { caseId: 'case-1' } };
judge('an id that is not a plain path is unsafe', '../x', { standing: { kind: 'unsafe' } }, { caseId: 'case-1' });
judge('a plain id that is a link is a link', 'a-link', { standing: { kind: 'unsafe-link' } }, { caseId: 'case-1' });
judge('a run with no directory is gone', 'run-none', { standing: { kind: 'missing' } }, { caseId: 'case-1' });
judge('a run directory that is a link is kept as a link', 'run-link', { standing: { kind: 'link' } }, { caseId: 'case-1' });
judge('a directory without a unit record keeps the run and blocks', 'j-norecord', { standing: { kind: 'directory', expected: path.join(assignments, 'j-norecord'), unitJsonIsFile: false, recordText: null, controllerHeld: false, custodyHeld: false, unitState: 'completed' } }, { caseId: 'case-1' }, {});
judge('a run another case names stays alone', 'j-other', { standing: { kind: 'directory', expected: path.join(assignments, 'j-other'), unitJsonIsFile: true, recordText: JSON.stringify({ workflow: { caseId: 'case-2' } }), controllerHeld: true, custodyHeld: true, unitState: 'running' } }, { caseId: 'case-1' }, { record: { workflow: { caseId: 'case-2' } } });
judge('an unreadable record names no case, so it stays alone', 'j-bad', { standing: { kind: 'directory', expected: path.join(assignments, 'j-bad'), unitJsonIsFile: true, recordText: '{bad', controllerHeld: false, custodyHeld: false, unitState: 'completed' } }, { caseId: 'case-1' }, { rawRecord: '{bad' });
judge('a run another case names in unless stays alone', 'j-unless', { standing: { kind: 'directory', expected: path.join(assignments, 'j-unless'), unitJsonIsFile: true, recordText: JSON.stringify(mine), controllerHeld: true, custodyHeld: false, unitState: 'running' } }, { caseId: 'case-1', unless: new Set(['j-unless']) }, { record: mine });
judge('a held controller keeps the run and blocks', 'j-held', { standing: { kind: 'directory', expected: path.join(assignments, 'j-held'), unitJsonIsFile: true, recordText: JSON.stringify(mine), controllerHeld: true, custodyHeld: true, unitState: 'running' } }, { caseId: 'case-1' }, { record: mine });
const withTree = { ...mine, worktree: worktreeDir };
judge('a held custody keeps the run and blocks', 'j-custody', { standing: { kind: 'directory', expected: path.join(assignments, 'j-custody'), unitJsonIsFile: true, recordText: JSON.stringify(withTree), controllerHeld: false, custodyHeld: true, unitState: 'completed' } }, { caseId: 'case-1' }, { record: withTree });
judge('a custody read of a record with no worktree string does not count', 'j-nocustody', { standing: { kind: 'directory', expected: path.join(assignments, 'j-nocustody'), unitJsonIsFile: true, recordText: JSON.stringify(mine), controllerHeld: false, custodyHeld: true, unitState: 'completed' } }, { caseId: 'case-1' }, { record: mine });
judge('an unsettled run keeps and blocks', 'j-unsettled', { standing: { kind: 'directory', expected: path.join(assignments, 'j-unsettled'), unitJsonIsFile: true, recordText: JSON.stringify(mine), controllerHeld: false, custodyHeld: false, unitState: 'awaiting-resume' } }, { caseId: 'case-1' }, { record: mine });
judge('a run that is still running keeps and blocks', 'j-running', { standing: { kind: 'directory', expected: path.join(assignments, 'j-running'), unitJsonIsFile: true, recordText: JSON.stringify(mine), controllerHeld: false, custodyHeld: false, unitState: 'running' } }, { caseId: 'case-1' }, { record: mine });
judge('a completed run of this case is removable', 'j-done', { standing: { kind: 'directory', expected: path.join(assignments, 'j-done'), unitJsonIsFile: true, recordText: JSON.stringify(mine), controllerHeld: false, custodyHeld: false, unitState: 'completed' } }, { caseId: 'case-1' }, { record: mine, summary: { outcome: 'pass' } });
judge('a failed run of this case is removable', 'j-failed', { standing: { kind: 'directory', expected: path.join(assignments, 'j-failed'), unitJsonIsFile: true, recordText: JSON.stringify(mine), controllerHeld: false, custodyHeld: false, unitState: 'failed' } }, { caseId: 'case-1' }, { record: mine, summary: { outcome: 'fail' } });

// custody: dispatchCwdHolder's answer, by what the caller read.
const custodyVectors = [
  { name: 'a worktree that does not exist is held by nobody', holders: { kind: 'none' }, expect: false },
  { name: 'a lock file never created is held by nobody', holders: { kind: 'none' }, expect: false },
  { name: 'a listed holder holds custody', holders: { kind: 'listed', pids: [4242] }, expect: true },
  { name: 'an empty holder list is no custody', holders: { kind: 'listed', pids: [] }, expect: false },
  { name: 'a platform that cannot list reads free as no custody', holders: { kind: 'unlisted', free: true }, expect: false },
  { name: 'a platform that cannot list reads anything but free as held', holders: { kind: 'unlisted', free: false }, expect: true },
];

const contracts = path.join(repo, 'packages/execution/contracts');
const write = (dir, name, doc) => {
  fs.mkdirSync(path.join(contracts, dir), { recursive: true });
  fs.writeFileSync(path.join(contracts, dir, name), `${JSON.stringify(doc, null, 1)}\n`);
};
write('core-runner-config', 'core-runner-config.v1.json', {
  version: 'core-runner-config.v1',
  about: 'Golden vectors of loadRunnerConfigForDir over the documents the config door reads. A load vector is { name, root, door: { runner, origins }, expect } and a refusal vector is { name, root, door: { refused: { code, message, refusals }, checkFindings }, expect }; expect is { ok: { config, origins } } or { error: { name, category, code?, phase?, message, path?, paths?, detail? } }. $ROOT is the directory the project lives under; the attributed file path is the project root joined onto .fgos. Recorded by test/golden-recorders/core-runner-config.recorder.mjs; the Rust loader is the owner now.',
  vectors: configVectors,
  refusals: refusalVectors,
});
write('core-run-facts', 'core-run-facts.v1.json', {
  version: 'core-run-facts.v1',
  about: 'Golden vectors of the Unit-run judgements over facts the caller reads. unitRunFacts: { recordText (unit.json text, null when the file is absent), controlHeld, worktreeExists, unsafeId?, expect } where expect is the facts object. judgeUnitRun: { unitRunId, caseId, unless, standing, expect }, standing being what the caller read of assignments/<id>: unsafe, unsafe-link, missing, link, or a directory with its record text, controller, custody and derived unit state. custody: { holders, expect }. Recorded by test/golden-recorders/core-runner-config.recorder.mjs.',
  unitRunFacts: rooted(runFactVectors),
  judgeUnitRun: rooted(judgeVectors),
  custodyHeld: custodyVectors,
});
fs.rmSync(root, { recursive: true, force: true });
console.log(`recorded ${configVectors.length} load, ${refusalVectors.length} refusal, ${runFactVectors.length} facts, ${judgeVectors.length} judge, ${custodyVectors.length} custody vectors`);
