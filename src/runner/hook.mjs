// hook.mjs -- `fgos hook <kind>` for the kinds judged in-process: one payload normalizer for the two harness
// formats, then one verdict per kind. The standard format (Claude Code, Codex: `{ tool_name, tool_input, cwd,
// transcript_path }`) refuses with exit 2 and the reason on stderr; agy's (`{ toolCall: { name, args },
// workspacePaths }`) answers JSON on stdout and always exits 0.
//
// The project a verdict is judged against is the harness's own: `CLAUDE_PROJECT_DIR`, agy's workspace root,
// else the directory the hook was started in. A `cwd` inside a payload names where one tool call ran, not
// which project owns the rules, so it is never read: a payload that says `/tmp` is judged as the project is.
//
// One rule for both formats: a payload that is empty or does not parse allows the call, and so does any failure
// of a verdict itself; a refusal of the project's config blocks (see src/runner/dispatch/hook.mjs).

import fs from 'node:fs';
import { decideDispatchHook } from './dispatch/hook.mjs';
import { decisionQuestionHookVerdict } from '../state/decision-question.mjs';

/** Hook kinds this module judges. */
export const IN_PROCESS_HOOK_KINDS = Object.freeze(['dispatch-decide', 'decision-question']);
/** Kinds the native host serves; the Node entry is reached for them only on the unsupported direct-node channel. */
export const NATIVE_HOOK_KINDS = Object.freeze(['mailbox', 'mailbox-sync']);

const allow = Object.freeze({ blocked: false });
const isText = (value) => typeof value === 'string' && value.trim() !== '';

/**
 * One call shape for both formats; null when the payload is empty or not a JSON object (the caller allows).
 * `projectDir` is never read from the payload except agy's workspace root, which is the harness's own.
 */
export function normalizeHookPayload(raw, { format = null, env = process.env, cwd = process.cwd() } = {}) {
  if (!isText(raw)) return null;
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return null;
  const agy = format === 'agy' || data.toolCall !== undefined;
  const object = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
  const workspaceRoot = agy && Array.isArray(data.workspacePaths) && isText(data.workspacePaths[0]) ? data.workspacePaths[0] : null;
  const harnessDir = isText(env.CLAUDE_PROJECT_DIR) ? env.CLAUDE_PROJECT_DIR : null;
  return {
    format: agy ? 'agy' : 'standard',
    toolName: agy ? data.toolCall?.name : data.tool_name,
    toolInput: object(agy ? data.toolCall?.args : data.tool_input),
    transcriptPath: !agy && isText(data.transcript_path) ? data.transcript_path : null,
    projectDir: workspaceRoot ?? harnessDir ?? cwd,
  };
}

/** What `fgos hook <kind>` prints and exits with for a verdict, in the protocol of the call's format. */
function answer(verdict, format) {
  if (format === 'agy') {
    const decision = verdict.blocked ? { decision: 'deny', reason: `BLOCKED: ${verdict.reason}` } : { decision: 'allow' };
    return { exitCode: 0, stdout: `${JSON.stringify(decision)}\n`, stderr: '' };
  }
  return verdict.blocked ? { exitCode: 2, stdout: '', stderr: `BLOCKED: ${verdict.reason}\n` } : { exitCode: 0, stdout: '', stderr: '' };
}

/**
 * Judge one hook payload. `kind` is one of IN_PROCESS_HOOK_KINDS; `format` is the `--format` flag value
 * (the payload's own shape decides when it is absent).
 */
export async function runHook(kind, { stdin, format = null, env = process.env, cwd = process.cwd() } = {}) {
  const call = normalizeHookPayload(stdin, { format, env, cwd });
  if (call === null) return answer(allow, format);
  try {
    const verdict = kind === 'dispatch-decide' ? await decideDispatchHook(call) : decisionQuestionHookVerdict(call);
    return answer(verdict, call.format);
  } catch {
    return answer(allow, call.format);
  }
}

/** The format a hook command line asks for (`--format=agy`), or null: the payload's own shape decides. */
export const formatOfFlags = (flags) => flags.find((flag) => flag.startsWith('--format='))?.slice('--format='.length) ?? null;

/** Reads the payload from stdin, answers in the call's protocol and exits; the one body of every in-process hook entry. */
export async function serveHook(kind, flags = []) {
  let stdin = '';
  try {
    stdin = fs.readFileSync(0, 'utf8');
  } catch {
    stdin = '';
  }
  const { exitCode, stdout, stderr } = await runHook(kind, { stdin, format: formatOfFlags(flags) });
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  process.exit(exitCode);
}
