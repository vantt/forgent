#!/usr/bin/env node
/**
 * test/live/head-grant-probe.live.mjs
 *
 * Live grant probe script for confined head sessions (Phase 11 step 3,
 * plans/261122-0118-heads-stable-and-able/phase-11-integration-and-probe.md).
 *
 * Runs inside a confined head (supervisor, secretary, planner, shaper, lead):
 * for every verb of `packages/run-supervisor/contracts/head-request.v1.json` 'verbs'
 * it makes one fgos CLI call with arguments chosen so the call cannot change state,
 * and classifies the reply as:
 *   - served: the route ran and answered done, or a domain refusal that proves the grant
 *             and the route passed.
 *   - refused as expected: verb-not-granted for a verb the caller's grant does not hold.
 *   - failed: transport or route failure.
 *
 * The expected outcome comes from `grantOf` in `src/session-host/head-grants.mjs` for the
 * caller's role; the observed outcome never comes from it.
 * Verbs that act on the caller itself (`supervisor done`, `session rotate`, `session answered`,
 * `session restore role`, `session bind session`) are not called; their row says
 * 'not called: acts on the caller' and cites the head's own request-log line from its last
 * real use, or says "no use in the window".
 * 'supervisor wake' is unsafe (takes no args, always records a wake, may mark events handled
 * and may start a supervisor head); it is not called and listed with that reason.
 *
 * It also prints TMPDIR and proves it writable, and records the head's `stop-trace.jsonl`
 * last line (fraction present or null) for the rotation proof.
 *
 * Output is one JSON document on stdout.
 *
 * Options:
 *   --dry-run       print the planned calls and contract verbs without executing them
 *   --role <role>   override caller role (default: FGOS_HEAD_ROLE; refusing to guess when missing)
 *   --persona <p>   override caller persona (default: FGOS_HEAD_PERSONA)
 *   --name <n>      override caller name (default: FGOS_HEAD_NAME)
 *   --plan-dir <d>  plan directory for lead role (default: '261122-0118-heads-stable-and-able')
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { grantOf, HEAD_REQUEST_SOCKET_ENV } from '../../src/session-host/head-grants.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SCRIPT), '..', '..');
const CONTRACT_PATH = path.join(REPO_ROOT, 'packages', 'run-supervisor', 'contracts', 'head-request.v1.json');

const FGOS_BIN = process.env.FGOS_BIN || 'fgos';

/**
 * Verbs not called by the probe:
 * - Caller-acting verbs act on the caller itself; their row cites the head's request log.
 * - 'supervisor wake' is unsafe: it takes no args, always records a wake, may mark events handled and may start a supervisor head.
 */
export const NOT_CALLED_VERBS = new Map([
  ['supervisor done', 'acts on the caller'],
  ['session rotate', 'acts on the caller'],
  ['session answered', 'acts on the caller'],
  ['session restore role', 'acts on the caller'],
  ['session bind session', 'acts on the caller'],
  ['supervisor wake', 'unsafe: takes no args, always records a wake, may mark events handled and may start a supervisor head'],
]);

export const SELF_ACTING_VERBS = new Set([
  'supervisor done',
  'session rotate',
  'session answered',
  'session restore role',
  'session bind session',
  'supervisor wake',
]);

/**
 * Per-verb table of expected domain refusal codes that prove the route ran.
 */
export const EXPECTED_DOMAIN_CODES = {
  'session start': new Set(['persona-not-found', 'bad-persona']),
  'questions list': new Set(['done']),
  'questions ask': new Set(['parts-incomplete', 'ref-invalid', 'question-unclear']),
  'questions ack': new Set(['question-unknown', 'not-asker', 'question-not-open']),
  'questions cancel': new Set(['question-unknown', 'not-asker', 'question-not-open']),
  'questions answer': new Set(['question-unknown', 'answer-not-owner', 'question-already-answered', 'question-not-open']),
  'session write': new Set(['path-not-granted', 'path-outside-grant', 'path-invalid', 'path-symlink', 'not-a-file']),
  'land': new Set(['path-outside-grant', 'write-outside-footprint', 'footprint-change-refused', 'land-branch-lead-only']),
  'run': new Set(['write-outside-footprint', 'writes-need-linked-worktree', 'role-mismatch', 'run-one-unit', 'run-ceiling-exceeded']),
  'request result': new Set(['ticket-unknown']),
  'worktree create': new Set(['role-mismatch', 'worktree-create-failed']),
  'session stop': new Set(['stop-target-not-head', 'role-mismatch', 'bad-persona', 'bad-name', 'stop-not-ended']),
  'supervisor handled': new Set(['event-unknown', 'event-not-found', 'event-store-no-repository']),
  'supervisor queue': new Set(['done']),
  'supervisor plans': new Set(['done']),
  'slots': new Set(['done']),
  'supervisor raise': new Set(['bad-args', 'bad-event', 'kind-not-allowed']),
  'watcher tune': new Set(['bad-args', 'watcher-key-forbidden']),
  'session read': new Set(['session-not-found', 'target-not-found', 'session-unknown', 'target-unknown', 'ambiguous', 'session-has-no-pane', 'terminal-refused']),
  'session type': new Set(['session-not-found', 'target-not-found', 'session-unknown', 'target-unknown', 'ambiguous', 'target-not-stuck', 'session-has-no-pane', 'terminal-refused']),
  'metrics record': new Set(['kind-not-allowed']),
  'metrics prune': new Set(['done']),
  'friction record': new Set(['friction-invalid-input', 'friction-invalid-disposition', 'invalid-disposition', 'bad-disposition']),
  'config patch': new Set(['patch-project-only', 'config-comment-reason-required', 'config-unknown-key', 'bad-args', 'config-patch-failed', 'not-a-file', 'file-not-found']),
};

export const TRANSPORT_CODES = new Set([
  'no-request-socket',
  'request-socket-unavailable',
  'request-socket-foreign',
  'reply-timeout',
  'bad-reply',
  'peer-uid',
  'busy',
  'bad-frame',
  'request-too-large',
  'reply-too-large',
  'verb-timeout',
  'spawn-failed',
]);

export const GENERIC_FAILURE_CODES = new Set([
  'role-not-held',
  'role-pending-rotation',
  'host-version-mismatch',
  'verb-failed',
]);

/** Returns CLI arguments and optional stdin for each callable verb, chosen so the call cannot change state. */
export function planForVerb(verb) {
  switch (verb) {
    case 'session start':
      return {
        args: ['session', 'start', 'no-such-persona', '--name', 'probe-dry', '--json'],
      };
    case 'questions list':
      return {
        args: ['questions', '--json'],
      };
    case 'questions ask':
      return {
        args: ['questions', 'ask', '--input', '-', '--json'],
        stdin: '{"topic":"probe"}\n',
      };
    case 'questions ack':
      return {
        args: ['questions', 'ack', 'no-such-question-id', '--json'],
      };
    case 'questions cancel':
      return {
        args: ['questions', 'cancel', 'no-such-question-id', '--reason', 'probe', '--json'],
      };
    case 'questions answer':
      return {
        args: ['questions', 'answer', 'no-such-question-id', '--text', 'probe', '--json'],
      };
    case 'session write':
      return {
        args: ['session', 'write', 'outside-grant/probe.txt', '--json'],
        stdin: 'probe content\n',
      };
    case 'land':
      return {
        args: ['land', '--paths', 'outside-grant/probe.txt', '--message', 'probe', '--json'],
      };
    case 'run':
      return {
        args: ['run', 'echo probe', '--writes', 'outside-grant/probe.txt', '--json'],
      };
    case 'request result':
      return {
        args: ['request', 'result', 'no-such-ticket', '--json'],
      };
    case 'worktree create':
      return {
        args: ['worktree', 'create', '/dev/null/probe', '--branch', 'probe-branch', '--json'],
      };
    case 'session stop':
      return {
        args: ['session', 'stop', 'no-such-persona', '--name', 'probe-dry', '--json'],
      };
    case 'supervisor handled':
      return {
        args: ['supervisor', 'handled', 'no-such-event-id', '--json'],
      };
    case 'supervisor queue':
      return {
        args: ['supervisor', 'queue', '--json'],
      };
    case 'supervisor plans':
      return {
        args: ['supervisor', 'plans', '--json'],
      };
    case 'slots':
      return {
        args: ['slots', '--json'],
      };
    case 'supervisor wake':
      // Not called (unsafe)
      return null;
    case 'supervisor raise':
      return {
        args: ['supervisor', 'raise', '--kind', 'invalid-kind', '--ref', 'probe', '--reason', 'probe', '--json'],
      };
    case 'watcher tune':
      return {
        args: ['watcher', 'tune', '--set', 'enabled=1', '--json'],
      };
    case 'session read':
      return {
        args: ['session', 'read', 'no-such-session', '--json'],
      };
    case 'session type':
      return {
        args: ['session', 'type', 'no-such-session', '--text', 'probe', '--json'],
      };
    case 'metrics record':
      return {
        args: ['metrics', 'record', '--json', '-'],
        stdin: JSON.stringify([{ kind: 'probe.invalid' }]),
      };
    case 'metrics prune':
      return {
        args: ['metrics', 'prune', '--json'],
      };
    case 'friction record':
      // Only the bad disposition stops the call.
      return {
        args: ['friction', 'record', '--subject', 'session:probe', '--layer', 'runner', '--error-class', 'probe', '--disposition', 'invalid-disp', '--producer', 'probe', '--json'],
      };
    case 'config patch':
      return {
        args: ['config', 'patch', '/dev/null/no-such-file', '--json'],
      };
    default:
      return null;
  }
}

/** Reads the last line of `stop-trace.jsonl` for rotation proof. */
function readStopTraceLastLine(repoRoot, persona, name) {
  if (!persona || !name) return null;
  const traceFile = path.join(repoRoot, '.fgos', 'runtime', 'session-rotation', `${persona}-${name}`, 'stop-trace.jsonl');
  try {
    if (!fs.existsSync(traceFile)) return null;
    const content = fs.readFileSync(traceFile, 'utf8');
    const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    const last = lines[lines.length - 1];
    try {
      return JSON.parse(last);
    } catch {
      return { raw: last, fraction: null };
    }
  } catch {
    return null;
  }
}

/** Reads the last request-log line from `supervisor.log` for a verb. */
function readSupervisorLogLine(repoRoot, persona, name, verb) {
  if (!persona || !name) return 'no use in the window';
  const lineageDir = path.join(repoRoot, '.fgos', 'runtime', 'session-rotation', `${persona}-${name}`);
  const placementPath = path.join(lineageDir, 'placement.json');
  let runDir = null;
  try {
    if (fs.existsSync(placementPath)) {
      const placement = JSON.parse(fs.readFileSync(placementPath, 'utf8'));
      if (placement.runDir && fs.existsSync(placement.runDir)) {
        runDir = placement.runDir;
      } else if (placement.key) {
        runDir = path.join(repoRoot, '.fgos', 'assignments', placement.key, 'runs', '01');
      }
    }
  } catch {}

  if (!runDir || !fs.existsSync(runDir)) {
    const assignmentsDir = path.join(repoRoot, '.fgos', 'assignments');
    try {
      if (fs.existsSync(assignmentsDir)) {
        const matching = fs.readdirSync(assignmentsDir).filter((d) => d.includes(`head-${persona}-${name}`));
        if (matching.length > 0) {
          // Sort run generations numerically, not as text
          matching.sort((a, b) => {
            const genA = parseInt((/-(\d+)$/.exec(a) || [])[1] ?? '0', 10);
            const genB = parseInt((/-(\d+)$/.exec(b) || [])[1] ?? '0', 10);
            return genA - genB;
          });
          runDir = path.join(assignmentsDir, matching[matching.length - 1], 'runs', '01');
        }
      }
    } catch {}
  }

  if (!runDir || !fs.existsSync(runDir)) return 'no use in the window';
  const logFile = path.join(runDir, 'supervisor.log');
  try {
    if (!fs.existsSync(logFile)) return 'no use in the window';
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n').filter((l) => l.includes('head-request ') && l.includes(` ${verb} `));
    if (lines.length === 0) return 'no use in the window';
    return lines[lines.length - 1];
  } catch {
    return 'no use in the window';
  }
}

/** Classifies the CLI response according to phase 11 step 3 and review findings. */
export function classifyOutcome(verb, isGranted, res) {
  if (res.error) {
    return {
      observed: 'failed',
      code: res.error.code || 'spawn-failed',
      detail: res.error.message,
    };
  }

  let reply = null;
  const rawOut = (res.stdout || '').trim();
  const rawErr = (res.stderr || '').trim();
  if (rawOut) {
    try { reply = JSON.parse(rawOut); } catch {}
  }
  if (!reply && rawErr) {
    try { reply = JSON.parse(rawErr); } catch {}
  }

  let code = reply?.code || reply?.error?.code || null;
  let detail = reply?.detail || reply?.message || reply?.error?.message || null;

  // Wrapped use-case code from supervisor REPLY (code: "verb-failed", detail: "<domain-code>")
  if (code === 'verb-failed' && typeof reply?.detail === 'string' && /^[a-z][a-z0-9-]*$/.test(reply.detail)) {
    code = reply.detail;
  }

  // Parse code from plain stderr (Node-door verbs: session start, session write print plain stderr)
  if (!code || code === 'head-refused' || code === 'precondition' || code === 'validation') {
    const lines = rawErr.split('\n').concat(rawOut.split('\n'));
    for (const line of lines) {
      const trimmed = line.trim();
      const stripped = trimmed.startsWith('fgos: ') ? trimmed.slice(6).trim() : trimmed;
      if (stripped.startsWith('invocation fault recorded')) continue;
      const bracketed = /\[([a-z][a-z0-9-]*)\]$/.exec(stripped);
      const prefixed = /^([a-z][a-z0-9-]*):(?:\s*(.*))?$/.exec(stripped);
      if (bracketed) {
        code = bracketed[1];
        detail = detail || bracketed[0];
        break;
      } else if (prefixed) {
        code = prefixed[1];
        detail = detail || (prefixed[2] ? prefixed[2].trim() : stripped);
        break;
      }
    }
  }

  // 1. Refused as expected: verb-not-granted when the grant lacks the verb
  const isVerbNotGranted = code === 'verb-not-granted' ||
    rawOut.includes('verb-not-granted') ||
    rawErr.includes('verb-not-granted');

  if (isVerbNotGranted) {
    if (!isGranted) {
      return {
        observed: 'refused as expected',
        code: 'verb-not-granted',
        detail: detail || 'verb not in envelope.session.verbs',
        reply,
      };
    }
    return {
      observed: 'failed',
      code: 'verb-not-granted',
      detail: 'verb was expected to be granted but supervisor refused verb-not-granted',
      reply,
    };
  }

  // 2. Transport failures: always failed (including no-request-socket)
  if (code && TRANSPORT_CODES.has(code)) {
    return {
      observed: 'failed',
      code,
      detail: detail || `transport failure: ${code}`,
      reply,
    };
  }

  // 3. Generic failure codes: role-not-held, role-pending-rotation, host-version-mismatch, verb-failed
  if (code && GENERIC_FAILURE_CODES.has(code)) {
    return {
      observed: 'failed',
      code,
      detail: detail || `supervisory failure: ${code}`,
      reply,
    };
  }

  // 4. Successful route reply (done)
  const expectedCodes = EXPECTED_DOMAIN_CODES[verb] || new Set();
  const isDoneReply = res.status === 0 && (reply?.result === 'done' || code === 'done' || expectedCodes.has('done'));
  if (isDoneReply) {
    return {
      observed: 'served',
      code: 'done',
      detail: detail || 'route completed successfully',
      reply,
    };
  }

  // 5. Domain refusal that proves the route ran
  if (code && expectedCodes.has(code)) {
    if (verb === 'friction record') {
      const mentionsDisp = (detail || '').toLowerCase().includes('disposition') ||
        rawErr.toLowerCase().includes('disposition') ||
        rawOut.toLowerCase().includes('disposition');
      if (!mentionsDisp && code !== 'friction-invalid-disposition' && code !== 'invalid-disposition' && code !== 'bad-disposition') {
        return {
          observed: 'failed',
          code,
          detail: detail || `friction refusal was not disposition-related: ${code}`,
          reply,
        };
      }
    }
    return {
      observed: 'served',
      code,
      detail: detail || `domain refusal: ${code}`,
      reply,
    };
  }

  // 6. Everything else is failed (local client bad-args, unexpected status/code, etc.)
  return {
    observed: 'failed',
    code: code || `exit-${res.status}`,
    detail: detail || rawErr || rawOut || `unexpected outcome (exit ${res.status})`,
    reply,
  };
}

export function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');

  // Refuse to run unless FGOS_HEAD_REQUEST_SOCKET is set, except with --dry-run
  if (!dryRun) {
    const socket = process.env[HEAD_REQUEST_SOCKET_ENV] || process.env.FGOS_HEAD_REQUEST_SOCKET;
    if (typeof socket !== 'string' || socket.trim() === '') {
      process.stderr.write(`head-grant-probe: ${HEAD_REQUEST_SOCKET_ENV} is not set; refusing to run live probe outside a head session (use --dry-run to inspect planned calls)\n`);
      process.exit(1);
    }
  }

  const roleArg = (() => {
    const at = argv.indexOf('--role');
    return at >= 0 && argv[at + 1] ? argv[at + 1] : null;
  })();
  const personaArg = (() => {
    const at = argv.indexOf('--persona');
    return at >= 0 && argv[at + 1] ? argv[at + 1] : null;
  })();
  const nameArg = (() => {
    const at = argv.indexOf('--name');
    return at >= 0 && argv[at + 1] ? argv[at + 1] : null;
  })();
  const planDirArg = (() => {
    const at = argv.indexOf('--plan-dir');
    return at >= 0 && argv[at + 1] ? argv[at + 1] : '261122-0118-heads-stable-and-able';
  })();

  const role = roleArg || process.env.FGOS_HEAD_ROLE || null;
  if (!role && !dryRun) {
    process.stderr.write('head-grant-probe: FGOS_HEAD_ROLE environment variable is missing and no --role was passed; refusing to guess caller role\n');
    process.exit(1);
  }

  const persona = personaArg || process.env.FGOS_HEAD_PERSONA || (role ? (() => {
    const match = /^head:([a-z][a-z0-9-]*)$/.exec(role);
    if (!match) return null;
    const hyphen = match[1].indexOf('-');
    return hyphen > 0 ? match[1].slice(0, hyphen) : null;
  })() : null);

  const name = nameArg || process.env.FGOS_HEAD_NAME || (role ? (() => {
    const match = /^head:([a-z][a-z0-9-]*)$/.exec(role);
    if (!match) return 'probe';
    const hyphen = match[1].indexOf('-');
    return hyphen > 0 ? match[1].slice(hyphen + 1) : 'probe';
  })() : null);

  let grant = null;
  if (role) {
    try {
      grant = grantOf(role, persona, { planDir: planDirArg });
    } catch (err) {
      process.stderr.write(`head-grant-probe: grantOf failed for role ${JSON.stringify(role)}: ${err.message} [${err.code || 'grant-error'}]\n`);
      process.exit(1);
    }
  }

  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
  const contractVerbs = Object.keys(contract.verbs);

  // Probe TMPDIR and verify writability
  const tmpdir = process.env.TMPDIR || os.tmpdir() || '/tmp';
  let tmpdirWritable = false;
  let tmpdirError = null;
  try {
    const probeFile = path.join(tmpdir, `head-grant-probe-${process.pid}-${Date.now()}.tmp`);
    fs.writeFileSync(probeFile, 'head-grant-probe', 'utf8');
    const read = fs.readFileSync(probeFile, 'utf8');
    fs.unlinkSync(probeFile);
    tmpdirWritable = (read === 'head-grant-probe');
  } catch (err) {
    tmpdirWritable = false;
    tmpdirError = err.message;
  }

  const stopTraceLastLine = readStopTraceLastLine(REPO_ROOT, persona, name);

  const results = [];

  for (const verb of contractVerbs) {
    const isGranted = Array.isArray(grant?.verbs) && grant.verbs.includes(verb);
    const expected = isGranted ? 'served' : 'refused as expected';

    if (NOT_CALLED_VERBS.has(verb)) {
      const reason = NOT_CALLED_VERBS.get(verb);
      const logLine = readSupervisorLogLine(REPO_ROOT, persona, name, verb);
      results.push({
        verb,
        expected,
        observed: `not called: ${reason}`,
        action: `not called: ${reason}`,
        reason,
        evidence: logLine,
        logLine,
      });
      continue;
    }

    const plan = planForVerb(verb);
    if (!plan) {
      results.push({
        verb,
        expected,
        observed: 'failed',
        action: 'unplanned',
        error: `no planned call for verb: ${verb}`,
      });
      continue;
    }

    const plannedCommand = [FGOS_BIN, ...plan.args];

    if (dryRun) {
      results.push({
        verb,
        expected,
        observed: 'dry-run',
        action: 'call',
        command: plannedCommand,
        stdin: plan.stdin ? plan.stdin.trim() : null,
      });
      continue;
    }

    const res = spawnSync(FGOS_BIN, plan.args, {
      input: plan.stdin || undefined,
      encoding: 'utf8',
      env: process.env,
    });

    const outcome = classifyOutcome(verb, isGranted, res);
    results.push({
      verb,
      expected,
      observed: outcome.observed,
      action: 'call',
      command: plannedCommand,
      exitStatus: res.status,
      code: outcome.code,
      detail: outcome.detail,
      reply: outcome.reply,
      evidence: outcome.detail || outcome.code,
    });
  }

  const outputDoc = {
    contract: contract.contract?.id || 'run-supervisor-head-request',
    contractVersion: contract.contract?.version || 1,
    dryRun,
    verbCount: contractVerbs.length,
    caller: {
      role,
      persona,
      name,
      grantedVerbs: grant?.verbs || [],
    },
    tmpdir: {
      path: tmpdir,
      writable: tmpdirWritable,
      error: tmpdirError,
    },
    stopTraceLastLine,
    verbs: results,
  };

  process.stderr.write(`[head-grant-probe] ${dryRun ? 'Planned' : 'Evaluated'} ${contractVerbs.length} contract verbs (${dryRun ? 'dry-run' : 'live'})\n`);
  process.stdout.write(`${JSON.stringify(outputDoc, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
