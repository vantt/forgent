#!/usr/bin/env node
// The dry runs' CLI of scripts/record-mailbox-hook-fixtures.mjs, kept outside
// the shipped scripts because it runs the configured hook commands and the
// prompt's tool commands through a shell.
//
// Usage: node test/live/mailbox-recorder-stub.mjs <claude|codex> [--interactive] [cli args…] <prompt>

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * The dry runs' CLI: everything real except the model. It runs the prompt's
 * numbered shell commands in zsh (Claude Code keeps a `cd`; Codex starts each
 * in the session directory), fires the configured hooks through `sh -c` with
 * payloads in the recorded field names, and writes what they print where
 * the CLI keeps its model input: a Claude transcript under $HOME/.claude or
 * a Codex rollout under $CODEX_HOME.
 */
function stub(cli, rawArgv) {
  const interactive = rawArgv.includes('--interactive');
  const argv = rawArgv.filter((a) => a !== '--interactive');
  const prompt = argv[argv.length - 1];
  const session = crypto.randomUUID();
  const ws = process.cwd();
  let settings;
  let transcript;
  let record;
  if (cli === 'claude') {
    settings = readJson(argv[argv.indexOf('--settings') + 1]).hooks;
    const dir = path.join(process.env.HOME, '.claude', 'projects', 'stub');
    fs.mkdirSync(dir, { recursive: true });
    transcript = path.join(dir, `${session}.jsonl`);
    record = (text) => fs.appendFileSync(transcript, `${JSON.stringify({ type: 'attachment', attachment: { type: 'hook_additional_context', content: [text], hookEvent: 'PostToolUse' } })}\n`);
  } else {
    settings = readJson(path.join(process.env.CODEX_HOME, 'hooks.json')).hooks;
    const dir = path.join(process.env.CODEX_HOME, 'sessions', 'stub');
    fs.mkdirSync(dir, { recursive: true });
    transcript = path.join(dir, `rollout-${session}.jsonl`);
    record = (text) => fs.appendFileSync(transcript, `${JSON.stringify({ type: 'response_item', payload: { type: 'message', role: 'developer', content: [{ type: 'input_text', text }] } })}\n`);
  }
  const hookEnv = { ...process.env, ...(cli === 'claude' ? { CLAUDE_PROJECT_DIR: ws } : {}) };
  const toolEnv = { ...process.env, [cli === 'claude' ? 'CLAUDE_CODE_SESSION_ID' : 'CODEX_THREAD_ID']: session };
  const fire = (event, payload) => (settings[event] ?? [])
    .filter((group) => !group.matcher || group.matcher === '*' || new RegExp(group.matcher).test(payload.tool_name))
    .flatMap((group) => group.hooks)
    .map((hook) => spawnSync('sh', ['-c', hook.command], { input: JSON.stringify(payload), env: hookEnv, cwd: ws, encoding: 'utf8', timeout: 30_000 }).stdout);
  let cwd = ws;
  const commands = [...prompt.matchAll(/Run the shell command: `([^`]+)`/g)].map((m) => m[1]);
  commands.forEach((command, i) => {
    const cd = /^cd '(.+)'$/.exec(command);
    if (cd && cli === 'claude') cwd = cd[1];
    else if (!cd) spawnSync('zsh', ['-c', command], { cwd, env: toolEnv, stdio: 'ignore' });
    const payload = { session_id: session, transcript_path: transcript, cwd: ws, hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command }, tool_use_id: `stub-${i}` };
    for (const out of fire('PostToolUse', payload)) {
      try {
        const text = JSON.parse(out).hookSpecificOutput?.additionalContext;
        if (text) record(text);
      } catch {
        // a hook that printed nothing
      }
    }
  });
  fire('Stop', { session_id: session, transcript_path: transcript, cwd: ws, hook_event_name: 'Stop', stop_hook_active: false });
  process.stdout.write('done\n');
  if (interactive) {
    setInterval(() => {}, 1 << 30);
    for (const signal of ['SIGTERM', 'SIGHUP']) process.on(signal, () => process.exit(0));
  }
}

stub(process.argv[2], process.argv.slice(3));
