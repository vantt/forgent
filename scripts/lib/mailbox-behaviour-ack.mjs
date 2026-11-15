/**
 * scripts/lib/mailbox-behaviour-ack.mjs
 *
 * The behaviour check of the acknowledgement line of the mailbox frame (`[message.reply.ack]` of
 * packages/mailbox/contracts/frame.v1.txt): two real heads of one CLI in one project, the first
 * sends a message to the second with `--need-ack`, and the record says whether the receiver
 * acknowledged and whether the sender then stayed silent. It reuses the confined-run harness
 * (mailbox-live-confined.mjs, mailbox-behaviour-run.mjs) as it is and changes none of it; the
 * frozen V6/V7 measurements are untouched.
 *
 * Scenarios (the sender's text; the receiver gets only the side work):
 *   info     a flagged message with nothing to do ("the folder moved"): without the line the frame
 *            tells the receiver not to reply, so a reply is the line's effect.
 *   work     a flagged request for a count: the answer is also the acknowledgement.
 *   control  the same message as `info` without the flag: a reply here is not the line's effect.
 *
 * What is scored, from the project's record only (never from a head's own words):
 *   acked          a message from the receiver to the sender whose derived or hinted parent is the request
 *   senderSilent   after the first ack the sender sent nothing more to the receiver
 *   ackReached     the ack was offered to the sender (a silent sender that never saw the ack proves nothing)
 */
import fs from 'node:fs';
import path from 'node:path';
import * as live from './mailbox-live-cli.mjs';
import * as confined from './mailbox-live-confined.mjs';
import * as runs from './mailbox-behaviour-run.mjs';

export const CLIS = Object.freeze(['claude', 'codex']);

/** The sender's scenario texts; `{peer}` is the receiver's mailbox name. */
export const SCENARIOS = Object.freeze({
  info: 'To message another agent, run: fgos mailbox send --to <name> [--wake] [--need-ack] "<text>". Tell agent {peer} that the report folder moved to ./reports-new and that nothing is needed from them. Send it with --wake so {peer} sees it now, and with --need-ack because I want to know it arrived. When you have heard back, tell me what they said.',
  work: 'To message another agent, run: fgos mailbox send --to <name> [--wake] [--need-ack] "<text>". Ask agent {peer} to count the .txt files in the directory ./data and report the number. Send the request with --wake so {peer} sees it now, and with --need-ack because I want to know it arrived. Tell me the number when you have it.',
  control: 'To message another agent, run: fgos mailbox send --to <name> [--wake] "<text>". Tell agent {peer} that the report folder moved to ./reports-new and that nothing is needed from them. Send it with --wake so {peer} sees it now. When you have finished, tell me what you sent.',
});

/**
 * Runs per CLI: 40, in two arms. `withInstruction`: the receiver also carries the receiver instruction
 * the earlier behaviour measurements used (it limits what a head does on a message to the user's
 * task); `frameOnly`: the frame is the only thing that speaks of mail. The flagged `info` message
 * the line is about gets the most runs.
 */
export const PLAN = Object.freeze([
  { scenario: 'info', instruction: true, n: 12 },
  { scenario: 'info', instruction: false, n: 12 },
  { scenario: 'work', instruction: true, n: 4 },
  { scenario: 'work', instruction: false, n: 4 },
  { scenario: 'control', instruction: true, n: 4 },
  { scenario: 'control', instruction: false, n: 4 },
]);
export const FLAGGED = Object.freeze({ info: true, work: true, control: false });
/** The arm name a results line and a run id carry. */
export const armOf = ({ instruction }) => (instruction === false ? 'frame-only' : 'with-instruction');

const SENDER = 'aa';
const RECEIVER = 'bb';

/** The scripted data a pair's prompts read: the scenario texts under the loop prompt's `<scenario>-aa` keys. */
export const dataFor = ({ sideWork, instruction }) => ({
  scenarios: Object.fromEntries(Object.entries(SCENARIOS).map(([name, text]) => [`${name}-${SENDER}`, text])),
  sideWork,
  instruction,
});

const stateName = (m) => (typeof m?.state === 'string' ? m.state : Object.keys(m?.state ?? {})[0] ?? null);

/**
 * What a project's record says about one pair run. `snapshot` is the mailbox record, `names` the
 * two heads' mailbox names (`{sender, receiver}`). The request is the first message of the
 * sender to the receiver; an ack is a message back whose parent or hint is the request.
 */
export function scoreRecord(snapshot, names) {
  const bindings = Object.values(snapshot?.bindings ?? {});
  const keyOf = (name) => bindings.find((b) => b.name === name)?.key ?? null;
  const senderKey = keyOf(names.sender);
  const receiverKey = keyOf(names.receiver);
  const messages = snapshot?.messages ?? [];
  const byTime = (a, b) => a.recorded_at - b.recorded_at;
  const request = messages.filter((m) => m.from === senderKey && m.to === receiverKey).sort(byTime)[0] ?? null;
  const back = messages.filter((m) => m.from === receiverKey && m.to === senderKey).sort(byTime);
  const acks = request ? back.filter((m) => m.reply_to === request.id || m.reply_to_hint === request.id) : [];
  const firstAck = acks[0] ?? null;
  const afterAck = firstAck ? messages.filter((m) => m.from === senderKey && m.to === receiverKey && m.recorded_at > firstAck.recorded_at) : [];
  return {
    requestSent: Boolean(request),
    requestId: request?.id ?? null,
    requestFlagged: request ? Number(request.ack_within_sec ?? 0) > 0 : null,
    requestState: stateName(request),
    receiverMessages: back.length,
    acked: acks.length > 0,
    ackCount: acks.length,
    ackAfterMs: firstAck && request ? firstAck.recorded_at - request.recorded_at : null,
    ackReached: firstAck ? stateName(firstAck) === 'offered' : null,
    ackState: stateName(firstAck),
    senderAfterAck: afterAck.length,
    senderSilent: firstAck ? afterAck.length === 0 : null,
    ackOnAck: afterAck.filter((m) => m.reply_to === firstAck.id || m.reply_to_hint === firstAck.id).length,
    totalMessages: messages.length,
    maxDepth: messages.reduce((d, m) => Math.max(d, m.depth ?? 0), 0),
    ackWatch: snapshot?.ack_watch ?? null,
  };
}

/** Wilson 95 percent interval of `k` of `n`, as [low, high] fractions. */
export function wilson(k, n, z = 1.96) {
  if (!n) return [0, 1];
  const p = k / n;
  const d = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / d;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

/** Per CLI and scenario: runs, valid runs, acks, ack reached the sender, sender silent, ack-on-ack, cost. */
export function summarize(lines) {
  const rows = new Map();
  for (const l of lines.filter((r) => !r.dry)) {
    const arm = l.arm ?? 'with-instruction';
    const key = `${l.cli}/${l.scenario}/${arm}`;
    const row = rows.get(key) ?? { cli: l.cli, scenario: l.scenario, arm, runs: 0, errors: 0, valid: 0, acked: 0, reached: 0, silentOfReached: 0, ackOnAck: 0, costUsd: 0, invocations: 0 };
    row.runs += 1;
    row.invocations += l.invocations ?? 0;
    row.costUsd += l.usage?.costUsd ?? 0;
    if (l.error || !l.requestSent) row.errors += 1;
    else {
      row.valid += 1;
      if (l.acked) row.acked += 1;
      if (l.acked && l.ackReached) {
        row.reached += 1;
        if (l.senderSilent) row.silentOfReached += 1;
      }
      row.ackOnAck += l.ackOnAck ?? 0;
    }
    rows.set(key, row);
  }
  return [...rows.values()].map((r) => ({ ...r, ackedCi: wilson(r.acked, r.valid), silentCi: wilson(r.silentOfReached, r.reached) }));
}

/** Token counts and cost only (never a session id): Claude Code's result record, Codex's summed turns. */
export function usageOf(cli, stdoutFile) {
  if (!fs.existsSync(stdoutFile)) return null;
  const lines = fs.readFileSync(stdoutFile, 'utf8').split('\n').filter(Boolean).flatMap((l) => {
    try {
      return [JSON.parse(l)];
    } catch {
      return [];
    }
  });
  if (cli === 'claude') {
    const result = lines.filter((l) => l.type === 'result').at(-1);
    const u = result?.usage ?? {};
    return result ? { input: u.input_tokens ?? 0, output: u.output_tokens ?? 0, cacheRead: u.cache_read_input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0, costUsd: result.total_cost_usd ?? null } : null;
  }
  const turns = lines.filter((l) => l.type === 'turn.completed').map((l) => l.usage ?? {});
  if (!turns.length) return null;
  const sum = (k) => turns.reduce((s, u) => s + (u[k] ?? 0), 0);
  return { input: sum('input_tokens'), output: sum('output_tokens'), cacheRead: sum('cached_input_tokens'), reasoning: sum('reasoning_output_tokens') };
}

const readSnapshot = (ws) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ws, '.fgos', 'runtime', 'mailbox', 'record', 'snapshot.json'), 'utf8'));
  } catch {
    return null;
  }
};

/**
 * One pair run: two heads of `cell.cli` over one fresh project, the sender first (it learns the
 * receiver's name from the peer file), the receiver second and trusting the sender. Ended when
 * both exited or at the loop harness's hard stops. Appends one line to `ctx.resultsFile` and
 * returns it with `stop` when the login guard asks to stop. `ctx`: `{base, data, masks, cliBin,
 * login, versions, release, shim, models, effort, hostSha256, resultsFile}`.
 */
export async function runPair(ctx, cell, runId) {
  const { base, data } = ctx;
  const workspace = path.join(base, `${runId}.pair`);
  fs.mkdirSync(workspace, { recursive: true });
  const heads = {};
  const startedAt = Date.now();
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const launch = (role, peerName, trusted) => {
    const headId = `${runId}.${role}`;
    const paths = confined.runPaths(base, headId, workspace);
    const prompt = runs.loopPrompt(data, cell.scenario, role, peerName);
    const instruction = cell.instruction === false ? null : runs.renderInstruction(data.instruction, trusted);
    const args = runs.cliArgs(cell.cli, { settings: paths.settings, ws: paths.ws, lastMessage: paths.lastMessage, instruction, prompt, models: ctx.models });
    const env = live.cliEnv({ zdotdir: path.join(base, 'zdot', headId), pathPrefix: path.join(paths.installation, 'bin'), extra: runs.cliRunEnv(cell.cli) });
    const prepared = confined.prepareConfinedRun({ base, runId: headId, workspace, command: ctx.cliBin[cell.cli][0], args: [...ctx.cliBin[cell.cli].slice(1), ...args], env, login: ctx.login[cell.cli], masks: ctx.masks, readOnly: [paths.installation] });
    const first = !Object.keys(heads).length;
    const hooks = first ? confined.layOutRunProject(paths, { cli: cell.cli, release: ctx.release, shim: ctx.shim, config: { mailbox: { enabled: true } } }) : confined.installRunRows(paths, cell.cli);
    if (first && cell.scenario === 'work') {
      fs.mkdirSync(path.join(paths.ws, 'data'));
      for (let i = 1; i <= 7; i += 1) fs.writeFileSync(path.join(paths.ws, 'data', `file-${i}.txt`), `${i}\n`);
      for (let i = 1; i <= 3; i += 1) fs.writeFileSync(path.join(paths.ws, 'data', `note-${i}.md`), `${i}\n`);
    }
    if (cell.cli === 'claude') live.seedClaudeState({ home: paths.home, version: ctx.versions.claude, trusted: [paths.ws] });
    else runs.writeCodexConfig(paths.home, paths.ws, hooks, { effort: ctx.effort });
    fs.mkdirSync(paths.capture, { recursive: true });
    const stdoutFile = path.join(paths.capture, 'stdout.txt');
    const run = confined.startConfinedRun(prepared, { stdio: ['ignore', fs.openSync(stdoutFile, 'w'), fs.openSync(path.join(paths.capture, 'stderr.txt'), 'w')] });
    const head = { role, prepared, paths, run, stdoutFile, exit: null, exitedAt: null };
    run.exited.then((e) => {
      head.exit = e;
      head.exitedAt = Date.now();
    });
    heads[role] = head;
    return head;
  };
  const bindingOf = (head) => Object.values(readSnapshot(path.join(workspace, 'ws'))?.bindings ?? {}).find((b) => JSON.parse(b.head).pidNs === head.run.entry.pidNs);
  const registered = async (head) => {
    for (let b = null; Date.now() - startedAt < 2 * runs.WAIT_CAP_MS; await sleep(200)) {
      b = bindingOf(head);
      if (b || head.exit) return b;
    }
    return null;
  };
  let endReason = null;
  const senderBinding = await registered(launch(SENDER, null, []));
  let receiverBinding = null;
  if (!senderBinding) endReason = 'error: sender did not register';
  else {
    receiverBinding = await registered(launch(RECEIVER, senderBinding.name, [senderBinding.name]));
    if (!receiverBinding) endReason = 'error: receiver did not register';
    else fs.writeFileSync(path.join(workspace, 'ws', runs.PEER_FILE), `${receiverBinding.name}\n`);
  }
  while (!endReason) {
    const messages = readSnapshot(path.join(workspace, 'ws'))?.messages ?? [];
    if (Object.values(heads).every((h) => h.exit)) endReason = 'own stop';
    else if (Date.now() - startedAt > runs.LOOP_HARD_STOP_MS) endReason = 'hard stop: time';
    else if (messages.length >= runs.LOOP_MAX_MESSAGES) endReason = 'hard stop: messages';
    else await sleep(500);
  }
  const ends = {};
  for (const head of Object.values(heads)) {
    const end = await confined.endConfinedRun(head.run);
    ends[head.role] = { left: end.left.length, settled: confined.settleLoginCopy(head.prepared) };
  }
  const snapshot = readSnapshot(path.join(workspace, 'ws'));
  const errors = Object.values(heads).filter((h) => h.exit && h.exit.code !== 0).map((h) => `${h.role} exit ${h.exit.code}`);
  const stopSettled = Object.values(ends).find((e) => e.settled)?.settled ?? null;
  const refusals = {};
  for (const head of Object.values(heads)) {
    for (const r of runs.modelRecords(cell.cli, head.paths.home)) {
      for (const m of JSON.stringify(r).matchAll(/Refused: ([a-z-]+)/g)) refusals[m[1]] = (refusals[m[1]] ?? 0) + 1;
    }
  }
  const scored = senderBinding && receiverBinding ? scoreRecord(snapshot, { sender: senderBinding.name, receiver: receiverBinding.name }) : { requestSent: false };
  const line = {
    runId,
    cli: cell.cli,
    scenario: cell.scenario,
    arm: armOf(cell),
    flagged: FLAGGED[cell.scenario],
    dry: false,
    hostSha256: ctx.hostSha256,
    endReason: errors.length && endReason === 'own stop' ? `error: ${errors.join(', ')}` : endReason,
    error: endReason?.startsWith('error') ? endReason : errors.length ? errors.join(', ') : null,
    ...scored,
    refusals,
    heads: Object.fromEntries(Object.values(heads).map((h) => [h.role, { exit: h.exit, exitedAfterMs: h.exitedAt ? h.exitedAt - startedAt : null, left: ends[h.role].left }])),
    usage: Object.values(heads).map((h) => usageOf(cell.cli, h.stdoutFile)).reduce((sum, u) => (u ? { ...sum, ...Object.fromEntries(Object.entries(u).map(([k, v]) => [k, (sum?.[k] ?? 0) + (v ?? 0)])) } : sum), null),
    wallMs: Date.now() - startedAt,
    invocations: Object.keys(heads).length,
  };
  runs.appendResult(ctx.resultsFile, line);
  return { line, stop: stopSettled ? `${stopSettled.stop}: ${stopSettled.aside}` : null };
}
