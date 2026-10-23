#!/usr/bin/env node
/**
 * test/live/mailbox-behaviour-stub.mjs
 *
 * A stub head for the mailbox behaviour suite's wiring proofs: it stands in for
 * `claude -p` or `codex exec` inside the confined launch, with everything real but the
 * model. Usage: `node mailbox-behaviour-stub.mjs <claude|codex> <the CLI's argv>`; for
 * Codex it runs as a Node binary named `codex` (the head check reads the executable name).
 *
 * It runs each `N. Run: <command>` line of the prompt (the last argument) through `sh`, with
 * the CLI's session variable, and fires the configured hooks with payloads in the recorded
 * field names: through `/bin/sh -c` as Claude Code does (one shell hop), through a shell
 * that execs the command for Codex (direct). A Claude stub writes its session file
 * (`$HOME/.claude/sessions/<pid>.json`, its pid and start time as seen in its own
 * namespace). What the hooks print goes where the CLI keeps its model input (a Claude
 * transcript under `$HOME/.claude/projects/stub/`, a Codex rollout under
 * `$CODEX_HOME/sessions/stub/`); a Stop block is answered once more; the final answer is
 * printed, and kept in `-o <file>` when given.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const blockFor = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** The commands of a prompt's `N. Run: <command>` lines, in order. */
export function promptCommands(prompt) {
  return [...prompt.matchAll(/^\d+\. Run: (.+)$/gm)].map((m) => m[1]);
}

export function runStub(cli, argv) {
  const codex = cli === 'codex';
  const prompt = argv[argv.length - 1];
  const session = crypto.randomUUID();
  const ws = process.cwd();
  const home = process.env.HOME;
  let hooks;
  let record;
  let sessionFile = null;
  if (codex) {
    hooks = readJson(path.join(process.env.CODEX_HOME, 'hooks.json')).hooks;
    const dir = path.join(process.env.CODEX_HOME, 'sessions', 'stub');
    fs.mkdirSync(dir, { recursive: true });
    const rollout = path.join(dir, `rollout-${session}.jsonl`);
    record = (role, text) => fs.appendFileSync(rollout, `${JSON.stringify({ type: 'response_item', payload: { type: 'message', role, content: [{ type: 'input_text', text }] } })}\n`);
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
    record = (kind, text) => {
      const line = kind === 'context' ? { type: 'attachment', attachment: { type: 'hook_additional_context', content: [text], hookEvent: 'PostToolUse' } }
        : kind === 'block' ? { type: 'attachment', attachment: { type: 'hook_blocking_error', hookEvent: 'Stop', blockingError: { blockingError: text } } }
          : kind === 'result' ? { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: text }] } }
            : { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } };
      fs.appendFileSync(transcript, `${JSON.stringify(line)}\n`);
    };
  }
  const idVar = codex ? 'CODEX_THREAD_ID' : 'CLAUDE_CODE_SESSION_ID';
  const toolEnv = { ...process.env, [idVar]: session };
  const hookEnv = codex ? { ...process.env } : { ...process.env, CLAUDE_PROJECT_DIR: ws, CLAUDE_CODE_SESSION_ID: session };
  const seen = [];
  const fire = (event, payload) => (hooks[event] ?? [])
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
  for (const command of promptCommands(prompt)) {
    const ran = spawnSync('sh', ['-c', command], { env: toolEnv, cwd: ws, encoding: 'utf8' });
    const output = `${ran.stdout}${ran.stderr}`;
    record(codex ? 'tool' : 'result', output);
    for (const out of fire('PostToolUse', { session_id: session, cwd: ws, hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command } })) {
      const text = out?.hookSpecificOutput?.additionalContext;
      if (text) {
        seen.push(text);
        record(codex ? 'developer' : 'context', text);
      }
    }
    seen.push(output);
  }
  blockFor(300);
  let text = `done; saw ${seen.filter((s) => s.includes('<mailbox-message')).length} message(s)`;
  record(codex ? 'assistant' : 'text', text);
  const block = fire('Stop', { session_id: session, cwd: ws, hook_event_name: 'Stop', stop_hook_active: false, last_assistant_message: text }).find((out) => out?.decision === 'block');
  if (block) {
    record(codex ? 'user' : 'block', block.reason);
    text = `${text}; stop gate delivered`;
    record(codex ? 'assistant' : 'text', text);
  }
  if (sessionFile) fs.rmSync(sessionFile, { force: true });
  const out = argv.indexOf('-o');
  if (out >= 0) fs.writeFileSync(argv[out + 1], `${text}\n`);
  // Claude Code's print mode with stream JSON ends with a result record; the suite reads the final answer there.
  const stream = !codex && argv.includes('stream-json');
  process.stdout.write(stream ? `${JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: text })}\n` : `${text}\n`);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(new URL(import.meta.url).pathname)) {
  runStub(process.argv[2], process.argv.slice(3));
}
