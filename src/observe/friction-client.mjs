// friction-client.mjs — thin Node client of the Observe friction writer.
// It builds `fgos friction record|resolve` from what the caller passed; the Rust
// host owns every value list, default and validation.
// A refusal of the caller's input (the host names it `friction-invalid-input:`)
// is rethrown as a StoreError so programming mistakes surface in tests. Any other
// failure is best-effort: it is logged to invocation-faults.jsonl and warned on
// stderr, never thrown into the workflow that recorded the friction.

import { invokeHost } from '../util/host-bin.mjs';
import { recordInvocationFault } from '../cli/invocation-fault-log.mjs';
import { fgosDirFromRoot } from '../runner/paths.mjs';

const INPUT_REFUSAL = /^fgos: error: invocation failed: provider failed: friction-invalid-input:\s*/;

function validationError(message) {
  const err = new Error(message);
  err.name = 'StoreError';
  err.category = 'validation';
  return err;
}

// `(dir, payload)` or `({ dir, ...payload })`.
function target(name, dirOrOptions, payload) {
  if (typeof dirOrOptions === 'string') return [dirOrOptions, payload || {}];
  if (dirOrOptions && typeof dirOrOptions === 'object') return [dirOrOptions.dir || process.cwd(), dirOrOptions];
  throw new TypeError(`${name}: invalid arguments`);
}

const requireId = (id, name) => {
  if (typeof id !== 'string' || !id.trim()) throw validationError(`${name} requires a non-empty "id".`);
  return `work:${id}`;
};

// `--flag value` for every pair whose value the caller supplied.
const flags = (pairs) => pairs.filter(([, value]) => value != null).flatMap(([flag, value]) => [flag, String(value)]);

function callHost(what, args, { dir, input }) {
  try {
    return invokeHost(args, { input, dir });
  } catch (err) {
    const firstLine = String(err.stderr ?? '').split('\n', 1)[0];
    if (INPUT_REFUSAL.test(firstLine)) throw validationError(firstLine.replace(INPUT_REFUSAL, ''));
    const code = err.code || 'host-exec-error';
    recordInvocationFault({
      fgosDir: dir ? (dir.endsWith('.fgos') ? dir : fgosDirFromRoot(dir)) : null,
      cwd: dir,
      verb: 'friction',
      faultClass: 'friction-write-failed',
      message: `${code}: ${err.message}`,
      argv: args,
    });
    console.error(`fgos: warning: friction ${what} failed [${code}]: ${err.message}`);
    return null;
  }
}

/** Record a friction event: `{ id, layer, errorClass, disposition, detail?, attempts?, docType?, producer? }`. */
export function recordFriction(dirOrOptions, maybePayload) {
  const [dir, p] = target('recordFriction', dirOrOptions, maybePayload);
  const subject = requireId(p.id, 'friction');
  const args = ['friction', 'record', ...flags([
    ['--subject', subject],
    ['--layer', p.layer],
    ['--error-class', p.errorClass],
    ['--disposition', p.disposition],
    ['--producer', p.producer ?? 'work'],
    ['--attempts', typeof p.attempts === 'number' ? p.attempts : null],
    ['--doc-type', p.docType || null],
  ]), '--detail-stdin'];
  return callHost('write', args, { dir, input: p.detail != null ? String(p.detail) : '' });
}

/** Resolve a work item's friction: `{ id, reason, by }`. */
export function resolveFriction(dirOrOptions, maybeOptions) {
  const [dir, o] = target('resolveFriction', dirOrOptions, maybeOptions);
  const subject = requireId(o.id, 'resolveFriction');
  const args = ['friction', 'resolve', ...flags([['--subject', subject], ['--reason', o.reason], ['--by', o.by]])];
  return callHost('resolve', args, { dir });
}
