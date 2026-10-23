#!/usr/bin/env node
/**
 * test/live/mailbox-behaviour-stub.mjs
 *
 * A stub head for the mailbox behaviour suite's wiring proofs: it stands in for
 * `claude -p` or `codex exec` inside the confined launch, with everything real but the
 * model. Usage: `node mailbox-behaviour-stub.mjs <claude|codex> <the CLI's argv>`; for
 * Codex it runs as a Node binary named `codex` (the head check reads the executable name).
 *
 * Its steps are the prompt's `N. Run: <command>` lines, or, for the suite's user task, that
 * task's four commands. Each step runs through `sh` with the CLI's session variable and
 * fires the configured hooks with payloads in the recorded field names: through `/bin/sh -c`
 * as Claude Code does (one shell hop), through a shell that execs the command for Codex
 * (direct). A Claude stub writes its session file (`$HOME/.claude/sessions/<pid>.json`, its
 * pid and start time as seen in its own namespace). Records go where the CLI keeps its model
 * input, in the CLI's record shapes: a Claude transcript (tool use, tool result, then the
 * PostToolUse hook's attachment) under `$HOME/.claude/projects/stub/`, a Codex rollout (tool
 * call, hook output, call output) under `$CODEX_HOME/sessions/stub/`. A Stop block is
 * answered once more. The final answer is printed (a result record with
 * `--output-format stream-json`) and kept in `-o <file>` when given. With Claude Code's
 * `--input-format stream-json` each stdin line is one user turn (recorded as a user record,
 * answered with its own result record) until stdin ends; a turn whose text names
 * `fgos mailbox inbox --claim` and no steps (a nudge) runs that command as its one step.
 *
 * `MAILBOX_STUB` picks what the stand-in model does: `act` carries out what a frame asks
 * (creates the canary it names, adds the summary line, quotes readme.txt's first line);
 * `ignore` (the default) does not; `no-hooks` fires only the first hook (it registers) and
 * no other; `skip-post` fires no PostToolUse after the registering one (mail waits for
 * Stop); `extra-step` runs one more command a moment after its last step (mail sent at the
 * turn's end meets that command's PostToolUse); `fail` exits 1 after its steps. A context
 * that names `fgos mailbox inbox --claim` (the pointer line) is followed as Codex followed it
 * live: one more step runs that command, and its output reaches the stand-in model like a
 * frame; `no-claim` never follows it.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const blockFor = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** The commands of a prompt: its `N. Run: <command>` lines, or the suite task's four commands. */
export function promptCommands(prompt) {
  const explicit = [...prompt.matchAll(/^\d+\. Run: (.+)$/gm)].map((m) => m[1]);
  if (explicit.length) return explicit;
  if (prompt.includes('go1.txt') && prompt.includes('go2.txt')) {
    return ['ls', 'until [ -f go1.txt ]; do sleep 1; done', 'ls | wc -l > summary.txt', 'until [ -f go2.txt ]; do sleep 1; done'];
  }
  return [];
}

/** What a frame asks, carried out by the stand-in model; returns text for its answer. */
function actOn(frame, ws) {
  const notes = [];
  for (const canary of new Set(frame.match(/CANARY-[A-Z]+/g) ?? [])) {
    fs.writeFileSync(path.join(ws, canary), '');
    notes.push(`created ${canary}`);
  }
  const line = /checked TOKEN-[A-Z0-9]+/.exec(frame)?.[0];
  if (line) fs.appendFileSync(path.join(ws, 'summary.txt'), `${line}\n`);
  if (/first line of readme\.txt/.test(frame)) notes.push(fs.readFileSync(path.join(ws, 'readme.txt'), 'utf8').split('\n')[0]);
  return notes.join('; ');
}

export function runStub(cli, argv) {
  const codex = cli === 'codex';
  const behaviour = process.env.MAILBOX_STUB ?? 'ignore';
  const prompt = argv[argv.length - 1];
  const session = crypto.randomUUID();
  const ws = process.cwd();
  const home = process.env.HOME;
  let hooks;
  let write;
  let sessionFile = null;
  if (codex) {
    hooks = readJson(path.join(process.env.CODEX_HOME, 'hooks.json')).hooks;
    const dir = path.join(process.env.CODEX_HOME, 'sessions', 'stub');
    fs.mkdirSync(dir, { recursive: true });
    const rollout = path.join(dir, `rollout-${session}.jsonl`);
    write = (payload) => fs.appendFileSync(rollout, `${JSON.stringify({ type: 'response_item', payload })}\n`);
  } else {
    hooks = readJson(argv[argv.indexOf('--settings') + 1]).hooks;
    const sessions = path.join(home, '.claude', 'sessions');
    fs.mkdirSync(sessions, { recursive: true });
    sessionFile = path.join(sessions, `${process.pid}.json`);
    const start = fs.readFileSync(`/proc/${process.pid}/stat`, 'utf8').split(') ')[1].split(' ')[19];
    fs.writeFileSync(sessionFile, JSON.stringify({ pid: process.pid, sessionId: session, procStart: start, kind: 'interactive', entrypoint: 'sdk-cli', name: 'stub-session-5d', nameSource: 'derived', version: 'stub' }));
    const dir = path.join(home, '.claude', 'projects', 'stub');
    fs.mkdirSync(dir, { recursive: true });
    const transcript = path.join(dir, `${session}.jsonl`);
    write = (line) => fs.appendFileSync(transcript, `${JSON.stringify(line)}\n`);
  }
  const say = (text) => (codex
    ? write({ type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] })
    : write({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } }));
  const idVar = codex ? 'CODEX_THREAD_ID' : 'CLAUDE_CODE_SESSION_ID';
  const toolEnv = { ...process.env, [idVar]: session };
  const hookEnv = codex ? { ...process.env } : { ...process.env, CLAUDE_PROJECT_DIR: ws, CLAUDE_CODE_SESSION_ID: session };
  const frames = [];
  let hooksFired = 0;
  const fire = (event, payload) => {
    hooksFired += 1;
    return (hooks[event] ?? [])
      .filter((group) => !group.matcher || group.matcher === '*' || new RegExp(group.matcher).test(payload.tool_name ?? ''))
      .flatMap((group) => (Array.isArray(group.hooks) ? group.hooks : []))
      .map((hook) => {
        const shell = codex ? ['-c', `exec ${hook.command}`] : ['-c', hook.command];
        const out = spawnSync('/bin/sh', shell, { input: JSON.stringify(payload), env: hookEnv, cwd: ws, encoding: 'utf8', timeout: 30_000 });
        try {
          return out.stdout ? JSON.parse(out.stdout) : null;
        } catch {
          return null;
        }
      });
  };
  const hooksOn = () => behaviour !== 'no-hooks' || hooksFired === 0;
  const step = (command, n) => {
    const id = `call_${n}`;
    if (codex) write({ type: 'custom_tool_call', call_id: id, name: 'exec', input: command });
    else write({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id, name: 'Bash', input: { command } }] } });
    const ran = spawnSync('sh', ['-c', command], { env: toolEnv, cwd: ws, encoding: 'utf8' });
    const output = `${ran.stdout}${ran.stderr}`;
    if (!codex) write({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: output }] } });
    const skip = !hooksOn() || (behaviour === 'skip-post' && hooksFired > 0);
    const contexts = skip ? [] : fire('PostToolUse', { session_id: session, cwd: ws, hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command } })
      .map((out) => out?.hookSpecificOutput?.additionalContext).filter(Boolean);
    if (!skip) {
      if (codex) for (const text of contexts) write({ type: 'message', role: 'developer', content: [{ type: 'input_text', text }] });
      else {
        write({ type: 'attachment', attachment: { type: 'hook_success', hookEvent: 'PostToolUse', content: '' } });
        for (const text of contexts) write({ type: 'attachment', attachment: { type: 'hook_additional_context', hookEvent: 'PostToolUse', content: [text] } });
      }
    }
    // Claude Code writes an api-request record when it sends the next model request, after the hooks ran.
    if (codex) write({ type: 'custom_tool_call_output', call_id: id, output });
    else write({ type: 'api-request' });
    frames.push(...contexts);
    return { output, pointed: contexts.some((text) => text.includes('fgos mailbox inbox --claim')) };
  };
  let n = 0;
  const run = (command) => {
    n += 1;
    const { pointed } = step(command, n);
    if (pointed && behaviour !== 'no-claim') frames.push(step('fgos mailbox inbox --claim', (n += 1)).output);
  };
  const answer = () => {
    const done = behaviour === 'act' ? frames.map((f) => actOn(f, ws)).filter(Boolean) : [];
    const summary = path.join(ws, 'summary.txt');
    return [`The number is ${fs.existsSync(summary) ? fs.readFileSync(summary, 'utf8').split('\n')[0] : '?'}.`, ...done].join(' ');
  };
  /** One turn: the prompt's steps (a nudge naming `inbox --claim` is followed unless `no-claim`), the answer, the Stop hook. */
  const turn = (text) => {
    const commands = promptCommands(text);
    commands.forEach(run);
    if (!commands.length && text.includes('fgos mailbox inbox --claim') && behaviour !== 'no-claim') frames.push(step('fgos mailbox inbox --claim', (n += 1)).output);
    if (behaviour === 'extra-step') {
      blockFor(2500);
      run('true');
    }
    blockFor(500);
    let said = answer();
    say(said);
    if (hooksOn()) {
      const block = fire('Stop', { session_id: session, cwd: ws, hook_event_name: 'Stop', stop_hook_active: false, last_assistant_message: said }).find((out) => out?.decision === 'block');
      if (block) {
        if (codex) write({ type: 'message', role: 'user', content: [{ type: 'input_text', text: block.reason }] });
        else write({ type: 'attachment', attachment: { type: 'hook_blocking_error', hookEvent: 'Stop', blockingError: { blockingError: block.reason } } });
        frames.push(block.reason);
        said = answer();
        say(said);
      }
    }
    return said;
  };
  const resultLine = (text) => `${JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: text })}\n`;
  let text;
  if (!codex && argv.includes('--input-format')) {
    // Claude Code's stream-json input: one user message per stdin line, one turn and one result record each, until the input ends.
    for (const message of stdinLines()) {
      const content = String(JSON.parse(message).message?.content ?? '');
      // Claude Code first records the queued stdin prompt in a bookkeeping record that reaches no model.
      write({ type: 'queue-operation', operation: 'enqueue', content });
      write({ type: 'user', message: { role: 'user', content } });
      text = turn(content);
      process.stdout.write(resultLine(text));
    }
  } else {
    text = turn(prompt);
    const out = argv.indexOf('-o');
    if (out >= 0) fs.writeFileSync(argv[out + 1], `${text}\n`);
    // Claude Code's print mode with stream JSON ends with a result record; the suite reads the final answer there.
    const stream = !codex && argv.includes('stream-json');
    process.stdout.write(stream ? resultLine(text) : `${text}\n`);
  }
  if (sessionFile) fs.rmSync(sessionFile, { force: true });
  if (behaviour === 'fail') process.exit(1);
}

/** The lines of stdin, read synchronously as they arrive, until it ends. */
function* stdinLines() {
  const chunk = Buffer.alloc(65536);
  let buffer = '';
  for (;;) {
    let read;
    try {
      read = fs.readSync(0, chunk, 0, chunk.length, null);
    } catch (error) {
      if (error.code === 'EAGAIN') {
        blockFor(50);
        continue;
      }
      throw error;
    }
    if (read === 0) break;
    buffer += chunk.toString('utf8', 0, read);
    for (let i = buffer.indexOf('\n'); i >= 0; i = buffer.indexOf('\n')) {
      const line = buffer.slice(0, i);
      buffer = buffer.slice(i + 1);
      if (line.trim()) yield line;
    }
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(new URL(import.meta.url).pathname)) {
  runStub(process.argv[2], process.argv.slice(3));
}
