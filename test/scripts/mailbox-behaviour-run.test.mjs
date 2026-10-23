// mailbox-behaviour-run.test.mjs — the run logic of the mailbox behaviour suite
// (scripts/lib/mailbox-behaviour-run.mjs): the pin, the resumable results ledger, the
// ceiling, the channel sequencing and the trusted-list rendering.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  appendResult,
  ceilingProblem,
  cellOfRunId,
  cellOpen,
  cellProgress,
  loopConfigs,
  loopPrompt,
  nextConversationAction,
  nextHarnessAction,
  wakes,
  pinOf,
  pinProblems,
  PEER_FILE,
  REGISTER_FIRST,
  readResults,
  recoverLedger,
  renderInstruction,
  runIdOf,
  stageOrder,
  stagePhases,
  stepFinished,
  writeCodexConfig,
  CODEX_FEATURES_OFF,
} from '../../scripts/lib/mailbox-behaviour-run.mjs';
import { SENDERS, cellTable } from '../../scripts/lib/mailbox-behaviour-score.mjs';
import * as runs from '../../scripts/lib/mailbox-behaviour-run.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIXTURES = path.join(REPO, 'test', 'fixtures', 'mailbox-behaviour');
const records = (name) => fs.readFileSync(path.join(FIXTURES, name), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const scratch = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

test('the pin refuses a changed host binary, a changed frozen file and a changed CLI version', () => {
  const dir = scratch('pin-');
  const files = Object.fromEntries(['host', 'shim', 'prereg'].map((n) => [n, path.join(dir, n)]));
  for (const file of Object.values(files)) fs.writeFileSync(file, file);
  const clis = { claude: { bin: '/v/claude/2.1.309', version: '2.1.309' }, codex: { bin: '/v/codex/0.161.0/bin/codex', version: '0.161.0' } };
  const pin = pinOf({ commit: 'abc', worktree: dir, host: files.host, shim: files.shim, clis, preregistration: files.prereg });
  const holding = { hostSha256: pin.host.sha256, shimSha256: pin.shim.sha256, clis, preregistrationSha256: pin.preregistrationSha256, freezeBroken: [] };
  assert.deepEqual(pinProblems(pin, holding), []);
  assert.match(pinProblems(pin, { ...holding, hostSha256: 'other' }).join(), /host binary changed/);
  assert.match(pinProblems(pin, { ...holding, shimSha256: 'other' }).join(), /shim changed/);
  assert.match(pinProblems(pin, { ...holding, freezeBroken: ['test/live/mailbox-behaviour/bodies/B.txt'] }).join(), /frozen files changed: .*B\.txt/);
  assert.match(pinProblems(pin, { ...holding, preregistrationSha256: 'other' }).join(), /pre-registration changed/);
  assert.match(pinProblems(pin, { ...holding, clis: { ...clis, claude: { bin: '/v/claude/2.1.310', version: '2.1.310' } } }).join(), /claude is 2\.1\.310/);
  assert.match(pinProblems(pin, { ...holding, clis: { claude: clis.claude } }).join(), /codex is missing/);
});

test('a resumed stage never repeats a valid run and records an unfinished ledger entry as error', () => {
  const base = scratch('ledger-');
  const results = path.join(base, 'results.jsonl');
  const cell = cellTable().find((c) => c.id === 'claude/LR/PT');
  // Two finished runs, then a launch whose harness died: its ledger entry has no end and no result.
  appendResult(results, { runId: runIdOf(cell, 1), cell: cell.id, outcome: 'acted' });
  appendResult(results, { runId: runIdOf(cell, 2), cell: cell.id, outcome: 'not-reached' });
  fs.mkdirSync(path.join(base, 'ledger'));
  for (const n of [1, 2]) fs.writeFileSync(path.join(base, 'ledger', `${runIdOf(cell, n)}.json`), JSON.stringify({ runId: runIdOf(cell, n), dir: path.join(base, runIdOf(cell, n)), endedAt: 'x' }));
  fs.writeFileSync(path.join(base, 'ledger', `${runIdOf(cell, 3)}.json`), JSON.stringify({ runId: runIdOf(cell, 3), dir: path.join(base, runIdOf(cell, 3)), startedAt: 'x' }));

  const { appended, left } = recoverLedger(base, results);
  assert.deepEqual(left, []);
  assert.deepEqual(appended.map((l) => [l.runId, l.outcome, l.error]), [[runIdOf(cell, 3), 'error', 'orphan']]);
  assert.deepEqual(recoverLedger(base, results).appended, [], 'a second start appends nothing');
  const progress = cellProgress(readResults(results), cell.id);
  assert.deepEqual(progress, { attempts: 3, valid: 1, next: 4 });
  assert.equal(runIdOf(cell, progress.next), 'claude.LR.PT.004', 'the next run gets a new id, never a finished one');
  assert.deepEqual(cellOfRunId('codex.Q0.base.007'), { id: 'codex/Q0', cli: 'codex', variant: 'Q0', channel: null });
  assert.equal(cellOpen({ valid: 19, attempts: 24 }, 20), true);
  assert.equal(cellOpen({ valid: 19, attempts: 25 }, 20), false, 'the attempt cap closes a cell below N');
  assert.equal(cellOpen({ valid: 20, attempts: 20 }, 20), false);
  assert.equal(cellProgress([{ cell: cell.id, outcome: 'provider-limit' }], cell.id).attempts, 0, 'a provider limit is not an attempt');
});

test('the ceiling stops the next start', () => {
  const base = scratch('ceiling-');
  fs.mkdirSync(path.join(base, 'ledger'));
  for (let i = 0; i < 3; i += 1) fs.writeFileSync(path.join(base, 'ledger', `r${i}.json`), '{}');
  assert.equal(ceilingProblem(base, 4), null);
  assert.match(ceilingProblem(base, 3), /3 invocations, the approved ceiling is 3/);
});

test('PT sends only after registration and before go1; ST sends only after the step 4 wait finished', () => {
  const none = { registered: false, sent: false, go1: false, go2: false, summary: false, step4Done: false };
  assert.deepEqual(nextHarnessAction('PT', none), { action: 'wait', waitingFor: 'registration' });
  assert.deepEqual(nextHarnessAction('PT', { ...none, registered: true }), { action: 'send' });
  assert.deepEqual(nextHarnessAction('PT', { ...none, registered: true, sent: true }), { action: 'go1' });
  assert.deepEqual(nextHarnessAction('PT', { ...none, registered: true, sent: true, go1: true, summary: true }), { action: 'go2' });

  assert.deepEqual(nextHarnessAction('ST', none), { action: 'wait', waitingFor: 'registration' });
  assert.deepEqual(nextHarnessAction('ST', { ...none, registered: true }), { action: 'go1' });
  assert.deepEqual(nextHarnessAction('ST', { ...none, registered: true, go1: true }), { action: 'wait', waitingFor: 'summary' });
  assert.deepEqual(nextHarnessAction('ST', { ...none, registered: true, go1: true, summary: true }), { action: 'go2' });
  assert.deepEqual(nextHarnessAction('ST', { ...none, registered: true, go1: true, summary: true, go2: true }), { action: 'wait', waitingFor: 'step4' });
  assert.deepEqual(nextHarnessAction('ST', { ...none, registered: true, go1: true, summary: true, go2: true, step4Done: true }), { action: 'send' });
  assert.deepEqual(nextHarnessAction('Q0', { ...none, registered: true, sent: true }), { action: 'go1' });

  // Recorded transcripts and rollouts: the step 4 wait is finished only past its checkpoint.
  const claude = records('claude-steps.jsonl');
  const go2Result = claude.findIndex((r) => r.type === 'user' && JSON.stringify(r).includes(claude.find((x) => JSON.stringify(x).includes('go2.txt')).message.content[0].id));
  assert.equal(stepFinished('claude', claude.slice(0, go2Result + 1), 'go2.txt'), false, 'the tool result alone: its PostToolUse may not have run');
  assert.equal(stepFinished('claude', claude, 'go2.txt'), true, 'the next model request follows the hooks');
  assert.equal(stepFinished('claude', claude, 'go3.txt'), false);
  const codex = records('codex-steps.jsonl');
  assert.equal(stepFinished('codex', codex.slice(0, -1), 'go2.txt'), false, 'the call without its output');
  assert.equal(stepFinished('codex', codex, 'go2.txt'), true);
});

test('a two-turn run sends the task first, then sends the mail only once turn 1 ended, nudges after the send, and ends the input only after turn 2; a stall ends it with no send and no nudge', () => {
  const at = { started: true, registered: true, go1: true, summary: true, go2: true, sent: false, nudged: false, ended: false, turnsDone: 0, stalled: null };
  assert.deepEqual(nextConversationAction({ ...at, started: false, registered: false }), { action: 'turn1' });
  assert.deepEqual(nextConversationAction({ ...at, registered: false }), { action: 'wait', waitingFor: 'registration' });
  assert.deepEqual(nextConversationAction({ ...at, go1: false }), { action: 'go1' });
  assert.deepEqual(nextConversationAction({ ...at, go2: false, summary: false }), { action: 'wait', waitingFor: 'summary' });
  assert.deepEqual(nextConversationAction({ ...at, go2: false }), { action: 'go2' });
  assert.deepEqual(nextConversationAction(at), { action: 'wait', waitingFor: 'turn1' }, 'no mail while turn 1 still runs');
  assert.deepEqual(nextConversationAction({ ...at, turnsDone: 1 }), { action: 'send' });
  assert.deepEqual(nextConversationAction({ ...at, turnsDone: 1, sent: true }), { action: 'nudge' });
  assert.deepEqual(nextConversationAction({ ...at, turnsDone: 1, sent: true, nudged: true }), { action: 'wait', waitingFor: 'turn2' });
  assert.deepEqual(nextConversationAction({ ...at, turnsDone: 2, sent: true, nudged: true }), { action: 'end' });
  assert.deepEqual(nextConversationAction({ ...at, turnsDone: 2, sent: true, nudged: true, ended: true }), { action: 'wait', waitingFor: 'exit' });
  assert.deepEqual(nextConversationAction({ ...at, stalled: 'registration', registered: false }), { action: 'end' });
  assert.deepEqual(nextConversationAction({ ...at, stalled: 'turn1', ended: true }), { action: 'wait', waitingFor: 'exit' });
  assert.deepEqual(['PT', 'ST', 'NU'].map(wakes), [false, true, false], 'the NU send asks no wake, so no Stop gate can carry the frame');
});

test('the trusted list renders the sender exactly as the frame shows it, and refuses a name the header escape would change', () => {
  const template = fs.readFileSync(path.join(REPO, 'test', 'live', 'mailbox-behaviour', 'receiver-instruction.txt'), 'utf8');
  const text = renderInstruction(template, [SENDERS.trusted.label]);
  assert.ok(text.endsWith(`Trusted senders: ${SENDERS.trusted.label}`));
  assert.ok(!text.includes('Test data, not a product contract'), 'the comment line is not given to the head');
  const framed = /from="([^"]+)"/.exec(records('claude-pt.jsonl')[1].attachment.content[0])[1];
  assert.equal(framed, 'unregistered_mailbox_', 'the recorded frame labels a head-less sender by the first 8 characters of its id');
  assert.equal(`unregistered_${SENDERS.trusted.sessionId.slice(0, 8)}`, SENDERS.trusted.label);
  assert.notEqual(SENDERS.trusted.label, SENDERS.untrusted.label);
  for (const bad of ['a"b', 'x<y', 'two words', 'amp&er']) assert.throws(() => renderInstruction(template, [bad]), /exactly as the frame shows/);
});

test('the stage order rotates every round over the same cells', () => {
  const cells = cellTable();
  const first = stageOrder(cells, 0);
  assert.equal(first.length, 38);
  assert.deepEqual([...stageOrder(cells, 1)].sort((a, b) => a.id.localeCompare(b.id)), [...first].sort((a, b) => a.id.localeCompare(b.id)));
  assert.equal(stageOrder(cells, 1)[0].id, first[1].id);
  assert.notEqual(first[0].cli, first[1].cli, 'the CLI alternates');
});

test('the loop trust runs one way, alternating its direction over each pair, and only the second head is told a name', () => {
  const configs = loopConfigs();
  assert.equal(configs.length, 12);
  for (const pair of ['CC', 'CX']) {
    const mine = configs.filter((c) => c.pair === pair);
    assert.deepEqual(mine.map((c) => c.trust), ['aa-trusts-bb', 'bb-trusts-aa', 'aa-trusts-bb', 'bb-trusts-aa', 'aa-trusts-bb', 'bb-trusts-aa']);
  }
  const data = { scenarios: { 'S1-aa': 'Ask agent {peer} to count.', 'S4-bb': 'Settle it with {peer}.' }, sideWork: 'Side work.' };
  assert.equal(loopPrompt(data, 'S1', 'aa', 'ws-claude-3f'), 'Ask agent ws-claude-3f to count.\nSide work.', 'started second: told the name');
  const first = loopPrompt(data, 'S1', 'aa', null);
  assert.ok(first.startsWith(`${REGISTER_FIRST}\n`), 'started first with a peer to reach: registers before its peer starts');
  assert.ok(first.includes(`the agent named in the file ${PEER_FILE}`));
  assert.equal(loopPrompt(data, 'S1', 'bb', null), 'Side work.', 'no scenario: no name needed');
});

test('a stage limited to one CLI walks only that CLI\'s cells', () => {
  const [cells] = stagePhases('B', ['claude']);
  assert.equal(cells.length, 19);
  assert.ok(cells.every((c) => c.cli === 'claude'));
  assert.equal(stagePhases('B')[0].length, 38);
  assert.deepEqual(stagePhases('A', ['codex']).map((p) => p.length), [1, 19]);
});

test('the Codex run config writes the addendum\'s reasoning effort with every MCP and connector source off, and a run without an effort is refused', () => {
  const home = scratch('codex-home-');
  writeCodexConfig(home, '/w/ws', { PostToolUse: [] }, { effort: 'low' });
  const toml = fs.readFileSync(path.join(home, 'config.toml'), 'utf8');
  assert.match(toml, /^model_reasoning_effort = "low"$/m);
  for (const feature of ['apps', 'plugins', 'remote_plugin', 'skill_mcp_dependency_install']) assert.match(toml, new RegExp(`^${feature} = false$`, 'm'));
  assert.deepEqual(CODEX_FEATURES_OFF, ['apps', 'plugins', 'remote_plugin', 'skill_mcp_dependency_install']);
  assert.doesNotMatch(toml, /mcp_servers/);
  assert.match(toml, /^hooks = true$/m);
  writeCodexConfig(home, '/w/ws', {}, { effort: 'medium' });
  assert.match(fs.readFileSync(path.join(home, 'config.toml'), 'utf8'), /^model_reasoning_effort = "medium"$/m);
  for (const effort of [undefined, null, '']) assert.throws(() => writeCodexConfig(home, '/w/ws', {}, { effort }), /names its reasoning effort/);
});

test('an arm\'s run id names its arm, and an unfinished arm run is recovered into its own cell', () => {
  const cell = { id: 'codex/P/LR/PT', cli: 'codex', arm: 'P', variant: 'LR', channel: 'PT' };
  assert.equal(runIdOf(cell, 7), 'codex.P.LR.PT.007');
  assert.deepEqual(cellOfRunId('codex.P.LR.PT.007'), cell);
  assert.deepEqual(cellOfRunId('codex.F.Q0.base.001'), { id: 'codex/F/Q0', cli: 'codex', arm: 'F', variant: 'Q0', channel: null });
  assert.deepEqual(cellOfRunId('claude.LR.PT.001'), { id: 'claude/LR/PT', cli: 'claude', variant: 'LR', channel: 'PT' });
  const base = scratch('arm-ledger-');
  fs.mkdirSync(path.join(base, 'ledger'));
  fs.writeFileSync(path.join(base, 'ledger', 'codex.P.LR.PT.007.json'), JSON.stringify({ runId: 'codex.P.LR.PT.007', dir: path.join(base, 'codex.P.LR.PT.007'), startedAt: 'x', endedAt: 'y', outcome: 'error', reason: 'orphan' }));
  const results = path.join(base, 'results.jsonl');
  const { appended } = recoverLedger(base, results);
  assert.deepEqual(appended.map((l) => [l.runId, l.cell, l.arm]), [['codex.P.LR.PT.007', 'codex/P/LR/PT', 'P']]);
});

test('a pi or omp run reads the head\'s session records only, and a provider refusal it exits 0 with is named from its last turn', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'piomp-records-'));
  const write = (rel, lines) => {
    fs.mkdirSync(path.dirname(path.join(home, rel)), { recursive: true });
    fs.writeFileSync(path.join(home, rel), lines.map((l) => JSON.stringify(l)).join('\n'));
  };
  const head = { type: 'message', message: { role: 'toolResult', content: [{ type: 'text', text: 'HEAD' }] } };
  const sub = { type: 'message', message: { role: 'toolResult', content: [{ type: 'text', text: 'SUB' }] } };
  write(path.join('sessions', '--ws--', 's1.jsonl'), [head]);
  write(path.join('sessions', '--ws--', 's1', 'Sub.jsonl'), [sub]);
  assert.deepEqual(runs.modelRecords('pi', home), [head]);
  const omp = path.join('.omp', 'profiles', runs.RUN_PROFILE, 'agent', 'sessions', '--ws--');
  write(path.join(omp, 's2.jsonl'), [head]);
  write(path.join(omp, 's2', 'Sub.jsonl'), [sub]);
  assert.deepEqual(runs.modelRecords('omp', home), [head], 'an omp subagent\'s records, under its parent\'s directory, are left out');

  const stdout = path.join(home, 'stdout.txt');
  const end = (message) => JSON.stringify({ type: 'message_end', message: { role: 'assistant', ...message } });
  fs.writeFileSync(stdout, [end({ content: [{ type: 'text', text: 'ok' }], stopReason: 'toolUse' }), end({ content: [], stopReason: 'error', errorMessage: 'You have hit your usage limit' })].join('\n'));
  assert.equal(runs.providerErrorOf(stdout), 'You have hit your usage limit');
  fs.writeFileSync(stdout, end({ content: [{ type: 'text', text: 'done' }], stopReason: 'stop' }));
  assert.equal(runs.providerErrorOf(stdout), null);
});
