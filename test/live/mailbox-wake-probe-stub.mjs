#!/usr/bin/env node
/**
 * test/live/mailbox-wake-probe-stub.mjs
 *
 * The stand-in heads of the wake probes' dry runs (test/live/mailbox-wake-probe.live.mjs): an
 * interactive Claude Code session with its messaging socket, an interactive Codex REPL whose
 * daemon queue is a file, and `codex queue` writing that file. Everything around them is real:
 * the pane, the hook rows, the branch host, the mail. No model.
 *
 * Usage: `node mailbox-wake-probe-stub.mjs claude <argv>`; `codex <argv>` (run as a Node binary
 * named `codex`, the head check reads the executable name); `codex queue --thread <id> --message
 * <text>`. A busy step (`sleep N`) sleeps at most `MAILBOX_WAKE_STUB_SLEEP_CAP` seconds.
 *
 * Claude Code's inbound gate as the 2.1.309 strings show it: a scoped `crossSessionInbound`
 * decides; with none, a bypass-mode session holds a frame that names no mode (a dialog, status
 * `waiting`) and a prompting-mode session accepts it. An accepted frame waits while a tool runs
 * and becomes its own turn after it.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SLEEP_CAP = Number(process.env.MAILBOX_WAKE_STUB_SLEEP_CAP ?? 5);
const say = (text) => process.stdout.write(`${text}\n`);

/** A head's steps and hooks over its own record writer. */
function headOf({ hooks, ws, hookEnv, toolEnv, write, shellPrefix }) {
  const fire = (event, payload) => (hooks[event] ?? []).flatMap((g) => g.hooks ?? []).map((hook) => {
    const out = spawnSync('/bin/sh', ['-c', `${shellPrefix}${hook.command}`], { input: JSON.stringify(payload), env: hookEnv, cwd: ws, encoding: 'utf8', timeout: 30_000 });
    try {
      return out.stdout ? JSON.parse(out.stdout) : null;
    } catch {
      return null;
    }
  });
  const run = async (command) => {
    const capped = command.replace(/sleep (\d+)/, (_, n) => `sleep ${Math.min(Number(n), SLEEP_CAP)}`);
    const output = await new Promise((resolve) => {
      let text = '';
      const child = spawn('sh', ['-c', capped], { env: toolEnv, cwd: ws });
      child.stdout.on('data', (d) => { text += d; });
      child.stderr.on('data', (d) => { text += d; });
      child.on('exit', () => resolve(text));
    });
    return output;
  };
  return { fire, run, write };
}

/** The stand-in Claude Code session. */
async function claude(argv) {
  const settings = readJson(argv[argv.indexOf('--settings') + 1]);
  const bypass = argv.includes('--dangerously-skip-permissions');
  const prompt = argv.at(-1);
  const ws = process.cwd();
  const home = process.env.HOME;
  const session = crypto.randomUUID();
  const sessions = path.join(home, '.claude', 'sessions');
  fs.mkdirSync(sessions, { recursive: true });
  const socketDir = path.join(process.env.XDG_RUNTIME_DIR, 'cc-socks');
  fs.mkdirSync(socketDir, { recursive: true, mode: 0o700 });
  const socket = path.join(socketDir, `${process.pid}.sock`);
  const sessionFile = path.join(sessions, `${process.pid}.json`);
  const start = fs.readFileSync(`/proc/${process.pid}/stat`, 'utf8').split(') ')[1].split(' ')[19];
  const status = (s) => fs.writeFileSync(sessionFile, JSON.stringify({ pid: process.pid, sessionId: session, procStart: start, kind: 'interactive', name: 'stub-session-7a', nameSource: 'derived', version: 'stub', status: s, messagingSocketPath: socket }));
  const dir = path.join(home, '.claude', 'projects', 'stub');
  fs.mkdirSync(dir, { recursive: true });
  const transcript = path.join(dir, `${session}.jsonl`);
  const write = (line) => fs.appendFileSync(transcript, `${JSON.stringify({ ...line, timestamp: new Date().toISOString() })}\n`);
  const head = headOf({ hooks: settings.hooks ?? {}, ws, hookEnv: { ...process.env, CLAUDE_PROJECT_DIR: ws, CLAUDE_CODE_SESSION_ID: session }, toolEnv: { ...process.env, CLAUDE_CODE_SESSION_ID: session }, write, shellPrefix: '' });
  let n = 0;
  let busy = false;
  const queued = [];
  const step = async (command) => {
    n += 1;
    const id = `call_${n}`;
    write({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id, name: 'Bash', input: { command } }] } });
    const output = await head.run(command);
    write({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: output }] } });
    head.fire('PostToolUse', { session_id: session, cwd: ws, hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command } });
    return output;
  };
  const turn = async (content, commands) => {
    busy = true;
    status('busy');
    write({ type: 'user', message: { role: 'user', content } });
    const outputs = [];
    for (const command of commands) outputs.push(await step(command));
    const text = outputs.some((o) => o.includes('<mailbox-message')) ? 'It was a benign hello from another agent; nothing to do.' : 'READY';
    write({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } });
    say(text);
    head.fire('Stop', { session_id: session, cwd: ws, hook_event_name: 'Stop', stop_hook_active: false, last_assistant_message: text });
    busy = false;
    status('idle');
    while (queued.length) await turn(...queued.shift());
  };
  const gate = (frame) => {
    if (settings.crossSessionInbound) return settings.crossSessionInbound;
    if (frame.from_mode !== undefined) return frame.from_mode === (bypass ? 'bypass' : 'prompting') ? 'accept' : 'hold';
    return bypass ? 'hold' : 'accept';
  };
  const server = net.createServer((conn) => {
    let buffer = '';
    conn.on('data', (d) => {
      buffer += d;
      for (let i = buffer.indexOf('\n'); i >= 0; i = buffer.indexOf('\n')) {
        const frame = JSON.parse(buffer.slice(0, i));
        buffer = buffer.slice(i + 1);
        if (frame.type !== 'user') continue;
        if (gate(frame) !== 'accept') {
          status('waiting');
          say('Held message from another session  [Deny]  [Deliver]');
          continue;
        }
        const item = [`Another Claude session sent a message:\n${frame.message.content}`, frame.message.content.includes('inbox --claim') ? ['fgos mailbox inbox --claim'] : []];
        if (busy) queued.push(item);
        else turn(...item);
      }
    });
  });
  server.listen(socket, () => fs.chmodSync(socket, 0o600));
  status('idle');
  const commands = [...prompt.matchAll(/Run: (ls|sleep \d+)/g)].map((m) => m[1]);
  await turn(prompt, commands);
  process.on('SIGTERM', () => {
    fs.rmSync(sessionFile, { force: true });
    process.exit(0);
  });
}

/** The stand-in Codex REPL: its daemon queue is `<CODEX_HOME>/stub-queue/<thread>.jsonl`. */
async function codex(argv) {
  const home = process.env.CODEX_HOME;
  if (argv[0] === 'queue') {
    const thread = argv[argv.indexOf('--thread') + 1];
    const text = argv[argv.indexOf('--message') + 1];
    fs.mkdirSync(path.join(home, 'stub-queue'), { recursive: true });
    fs.appendFileSync(path.join(home, 'stub-queue', `${thread}.jsonl`), `${JSON.stringify({ text })}\n`);
    say(`Queued message for thread ${thread}`);
    return;
  }
  const prompt = argv.at(-1);
  const ws = process.cwd();
  const thread = crypto.randomUUID();
  const dir = path.join(home, 'sessions', 'stub');
  fs.mkdirSync(dir, { recursive: true });
  const rollout = path.join(dir, `rollout-${thread}.jsonl`);
  const write = (payload, type = 'response_item') => fs.appendFileSync(rollout, `${JSON.stringify({ timestamp: new Date().toISOString(), type, payload })}\n`);
  const head = headOf({ hooks: readJson(path.join(home, 'hooks.json')).hooks, ws, hookEnv: { ...process.env }, toolEnv: { ...process.env, CODEX_THREAD_ID: thread }, write, shellPrefix: 'exec ' });
  let n = 0;
  const turn = async (text, commands) => {
    write({ type: 'task_started' }, 'event_msg');
    write({ type: 'message', role: 'user', content: [{ type: 'input_text', text }] });
    const outputs = [];
    for (const command of commands) {
      n += 1;
      write({ type: 'function_call', call_id: `c${n}`, name: 'exec_command', arguments: JSON.stringify({ cmd: command }) });
      const output = await head.run(command);
      head.fire('PostToolUse', { session_id: thread, cwd: ws, hook_event_name: 'PostToolUse', tool_name: 'exec_command', tool_input: { command } });
      write({ type: 'function_call_output', call_id: `c${n}`, output });
      outputs.push(output);
    }
    const answer = outputs.some((o) => o.includes('<mailbox-message')) ? 'It was a benign hello from another agent; nothing to do.' : 'READY';
    write({ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: answer }] });
    say(answer);
    head.fire('Stop', { session_id: thread, cwd: ws, hook_event_name: 'Stop', stop_hook_active: false, last_assistant_message: answer });
    write({ type: 'task_complete' }, 'event_msg');
  };
  await turn(prompt, [...prompt.matchAll(/Run: (ls|sleep \d+)/g)].map((m) => m[1]));
  const queue = path.join(home, 'stub-queue', `${thread}.jsonl`);
  let taken = 0;
  for (;;) {
    await sleep(500);
    const lines = fs.existsSync(queue) ? fs.readFileSync(queue, 'utf8').split('\n').filter(Boolean) : [];
    for (const line of lines.slice(taken)) {
      taken += 1;
      const { text } = JSON.parse(line);
      await turn(text, text.includes('inbox --claim') ? ['fgos mailbox inbox --claim'] : []);
    }
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(new URL(import.meta.url).pathname)) {
  const [cli, ...argv] = process.argv.slice(2);
  await (cli === 'claude' ? claude(argv) : codex(argv));
}
