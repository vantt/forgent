#!/usr/bin/env node
// PreToolUse hook for shell tool calls: refuses a command that would mass-delete inside the main
// checkout of a fgOS project. The judgement is src/git/main-checkout-delete-guard.mjs; this file
// only reads the payload of each CLI and answers in its protocol.
//
// Payloads: Claude Code and Codex send `{ tool_name, tool_input: { command }, cwd }` (Codex may
// send the command as an argv array); the OMP and Pi extensions send the same shape; agy sends
// `{ toolCall: { name: 'run_command', args: { CommandLine, Cwd } }, workspacePaths }` and reads a
// JSON decision on stdout. A refusal exits 2 with the reason on stderr (stdout JSON for agy).
//
// Fails open on an unreadable payload or an internal error, like the other fgOS hooks: the guard
// must never become the reason no shell command runs.

import fs from 'node:fs';
import { judgeDeleteCommand, deleteGuardRefusal } from '../src/git/main-checkout-delete-guard.mjs';

const SHELL_TOOLS = new Set(['Bash', 'bash', 'shell', 'exec_command', 'local_shell', 'run_command']);

/** The script a shell tool runs: a string, or an argv whose `sh -c <script>` form is unwrapped. */
function scriptOf(command) {
  if (typeof command === 'string') return command;
  if (!Array.isArray(command) || !command.every((part) => typeof part === 'string')) return null;
  const at = command.findIndex((part) => /^-[a-zA-Z]*c[a-zA-Z]*$/.test(part));
  if (at === 1 && command.length === 3) return command[2];
  return command.join(' ');
}

function readCall(data, agyFormat) {
  if (agyFormat || data?.toolCall !== undefined) {
    const args = data?.toolCall?.args ?? {};
    const cwd = typeof args.Cwd === 'string' && args.Cwd ? args.Cwd : Array.isArray(data?.workspacePaths) ? data.workspacePaths[0] : undefined;
    return { agy: true, tool: data?.toolCall?.name, script: scriptOf(args.CommandLine), cwd };
  }
  return { agy: false, tool: data?.tool_name, script: scriptOf(data?.tool_input?.command), cwd: data?.cwd };
}

const agyFormat = process.argv.includes('--format=agy');
let call = { agy: agyFormat, script: null };
let verdict = { blocked: false, reasons: [] };
try {
  call = readCall(JSON.parse(fs.readFileSync(0, 'utf8')), agyFormat);
  if (SHELL_TOOLS.has(call.tool) && typeof call.script === 'string') {
    verdict = judgeDeleteCommand(call.script, { cwd: typeof call.cwd === 'string' && call.cwd ? call.cwd : process.cwd() });
  }
} catch {
  verdict = { blocked: false, reasons: [] };
}

if (call.agy) {
  process.stdout.write(`${JSON.stringify(verdict.blocked ? { decision: 'deny', reason: deleteGuardRefusal(verdict.reasons) } : { decision: 'allow' })}\n`);
  process.exit(0);
}
if (verdict.blocked) {
  process.stderr.write(`${deleteGuardRefusal(verdict.reasons)}\n`);
  process.exit(2);
}
process.exit(0);
