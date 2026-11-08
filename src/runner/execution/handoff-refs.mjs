// The one hand-off: an earlier seat's work reaches a later seat as the absolute, read-only path of its
// report, listed in the later seat's context refs. Inside a Unit run the pattern passes the earlier record
// (`reportRefOf`); across Units an input `unit-run:<unitRunId>/<seat>` (or a gate answer,
// `gate-answer:<workflowRunId>/<stepId>`) is resolved once when the run is created and kept in unit.json,
// so a resume or a fallback hands out the same list. A blind role gets the same refs as copies in its own
// directory. `unit-run:<unitRunId>/{seat}` stands for the report the receiving role's own seat left in that
// run, resolved per role at dispatch and copied in as the role's own earlier result.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import { RunnerConfigError } from '../dispatch/config.mjs';
import { gateAnswerFile } from './case-run-paths.mjs';
import { resolveBlindHiddenRoots, isInsideRoot } from '../dispatch/confinement/resources.mjs';
import { readSeatHistory } from './unit-run-history.mjs';
import { seatKeyOf } from './legacy-seat-read.mjs';
import { seatIdProblem } from '../../convention/seat-id.mjs';

const UNIT_RUN_PREFIX = 'unit-run:';
const GATE_ANSWER_PREFIX = 'gate-answer:';
export const SEAT_PLACEHOLDER = '{seat}';
export const OWN_PREVIOUS_NAME = 'own-previous';

/** Whether an input names the earlier result of the receiving role's own seat. */
export const isSeatInput = (input) => typeof input === 'string' && input.startsWith(UNIT_RUN_PREFIX) && input.endsWith(`/${SEAT_PLACEHOLDER}`);

/** A hand-off that cannot be turned into a path; `reason` names why. */
export class HandoffRefError extends RunnerConfigError {
  constructor(subject, reason) {
    super(`handoff-ref-unresolved: ${subject}: ${reason}`);
    this.reason = reason;
  }
}

const sha256OfFile = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

/** The digest of a hand-off source about to be copied; a source that cannot be read is `copy-failed`. */
function copyDigestOf(subject, source) {
  try {
    return sha256OfFile(source);
  } catch (err) {
    throw new HandoffRefError(subject, `copy-failed: ${err.message}`);
  }
}

/**
 * Whether a settled report whose bytes changed (`actual`) may still be handed over: only on the caller's
 * authority, `'any'` or the sha256 hex of the revisions it stands behind.
 */
function acceptsBytes(accept, actual) {
  if (accept === 'any') return true;
  return accept !== undefined && accept !== null && typeof accept[Symbol.iterator] === 'function' && new Set(accept).has(actual);
}

/**
 * The absolute path of the account one seat result left: its settled report once it still has the bytes
 * settlement recorded, else the claim artifact settlement kept (paths relative to `mainRoot`).
 */
export function reportRefOf(record, { mainRoot, accept }) {
  const subject = `seat "${seatKeyOf(record)}" round ${record?.round}`;
  const runResult = record?.runResult ?? {};
  const settled = Array.isArray(runResult.settleReports) ? runResult.settleReports[0] : null;
  if (settled?.path) {
    const file = path.resolve(mainRoot, settled.path);
    let actual = null;
    try { actual = sha256OfFile(file); } catch { /* a missing report has no bytes */ }
    if (actual !== settled.sha256 && !(actual !== null && acceptsBytes(accept, actual))) throw new HandoffRefError(subject, 'report-changed-after-settle');
    return file;
  }

  const artifact = (runResult.evidence?.artifacts ?? []).find((a) => typeof a === 'string' && a !== '');
  if (artifact) return path.resolve(mainRoot, artifact);
  throw new HandoffRefError(subject, 'no-report');
}

/** The paths of the reports of in-run role results, in input order, each listed once. */
export function reportRefsOf(records, where) {
  const refs = [];
  for (const record of Array.isArray(records) ? records : []) {
    const ref = reportRefOf(record, where);
    if (!refs.includes(ref)) refs.push(ref);
  }
  return refs;
}

function resolveGateAnswerRef(input, mainRoot) {
  const [workflowRunId, stepId, ...rest] = input.slice(GATE_ANSWER_PREFIX.length).split('/');
  const file = rest.length === 0 ? gateAnswerFile(mainRoot, workflowRunId, stepId) : null;
  if (!file || !fs.existsSync(file)) throw new HandoffRefError(input, 'no-such-answer');
  return file;
}

function resolveUnitRunRef(input, mainRoot, seat, accept) {
  const [unitRunId, named] = input.slice(UNIT_RUN_PREFIX.length).split('/');
  const wanted = seat ?? named;
  // A seat id becomes a path segment of the run's directory, so only Convention's seat ids reach it.
  const fail = (reason) => new HandoffRefError(input, seat && reason === 'no-such-role' ? 'no-such-seat' : reason);
  if (seatIdProblem(wanted) === 'invalid-identifier') throw fail('no-such-role');
  const assignmentsDir = path.join(mainRoot, '.fgos', 'assignments');
  const unitDir = path.resolve(assignmentsDir, unitRunId);
  if (path.dirname(unitDir) !== assignmentsDir || !fs.existsSync(unitDir)) throw fail('no-such-run');
  // The latest round counts (the history keeps only the latest fallback attempt of each round).
  let rounds;
  try { rounds = readSeatHistory(unitDir, wanted); } catch (err) { if (err?.code !== 'ENOENT' && err?.code !== 'ENOTDIR') throw err; rounds = []; }
  if (rounds.length === 0) throw fail('no-such-role');
  const latest = rounds.reduce((a, b) => (b.round > a.round ? b : a));
  try {
    return reportRefOf(latest, { mainRoot, accept });
  } catch (err) {
    if (err instanceof HandoffRefError) throw fail(err.reason);
    throw err;
  }
}

/** The neutral name (without extension) of the nth anonymized input: seat-A ... seat-Z, seat-AA, ... */
export function anonymousInputName(index) {
  let n = index;
  let letters = '';
  do {
    letters = String.fromCharCode(65 + (n % 26)) + letters;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return `seat-${letters}`;
}

/** Whether `ref` (resolved against `base`) lies inside one of the given roots. */
function liesInsideAny(ref, base, roots) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(ref)) return false;
  const abs = path.resolve(base, ref);
  let real = abs;
  try { real = fs.realpathSync(abs); } catch { /* a ref that does not exist yet is judged by its spelling */ }
  return roots.some((root) => isInsideRoot(real, root));
}

/** Whether `ref` lies inside a root `hostRead: blind` hides, so it reaches a blind worker only as a copy. */
export function refIsHiddenFromBlind(ref, mainRoot) {
  return liesInsideAny(ref, mainRoot, resolveBlindHiddenRoots({ fgosDir: path.join(mainRoot, '.fgos') }));
}

/**
 * The own-seat inputs of one role: each `unit-run:<id>/{seat}` resolved to the report `seat` left there, as
 * entries for `copyHandoffsInto` (`own-previous.md`, `own-previous-2.md`, ...); a missing seat is `no-such-seat`.
 */
function resolveSeatInputs(inputs, mainRoot, seat, accept) {
  const inputMap = [];
  for (const input of inputs.filter(isSeatInput)) {
    if (inputMap.some((e) => e.input === input)) continue;
    const source = resolveUnitRunRef(input, mainRoot, seat, accept);
    const sha256 = copyDigestOf(input, source);
    const base = inputMap.length === 0 ? OWN_PREVIOUS_NAME : `${OWN_PREVIOUS_NAME}-${inputMap.length + 1}`;
    inputMap.push({ name: `${base}${path.extname(source)}`, input, source, sha256 });
  }
  return { refs: [], inputMap };
}

/**
 * A Unit's `inputs` as the context refs its roles get: a repo path as it is, `unit-run:<id>/<seat>` the
 * absolute path of that seat's report, `gate-answer:<runId>/<stepId>` the recorded answer; an unresolvable
 * ref throws before dispatch. `{seat}` inputs are left out, and with `seat` only they are resolved.
 * - `anonymizeInto`: every `unit-run:` report is copied there as `seat-A`, `seat-B`, ... (input order) and
 *   only the copies are listed, last; `inputMap` (kept in unit.json, never shown to a role) maps the names.
 * - `blind`: nothing is copied here (each role copies at dispatch); `refs` lists only what a blind worker
 *   can read in place, `inputMap` every other input with its copy's name (`seat-A`, ... under `anonymize`)
 *   and the sha256 the copy must still have.
 * - `accept`: settled reports that may be handed over though their bytes changed (see `acceptsBytes`).
 * @returns {{refs: string[], inputMap: Array<{name: string, input: string, source: string, sha256?: string}>}}
 */
export function resolveUnitInputs(inputs, mainRoot, { anonymizeInto, blind = false, anonymize = false, seat, accept } = {}) {
  if (seat !== undefined) return resolveSeatInputs(inputs ?? [], mainRoot, seat, accept);
  inputs = (inputs ?? []).filter((input) => !isSeatInput(input));
  const refs = [];
  const sources = [];
  const copies = [];
  const hiddenRoots = blind ? resolveBlindHiddenRoots({ fgosDir: path.join(mainRoot, '.fgos') }) : [];
  for (const input of inputs) {
    let ref = input;
    const isUnitRun = input.startsWith(UNIT_RUN_PREFIX);
    if (isUnitRun) {
      ref = resolveUnitRunRef(input, mainRoot, undefined, accept);
      if (anonymizeInto && !blind) {
        if (!sources.some((s) => s.input === input)) sources.push({ input, source: ref });
        continue;
      }
    } else if (input.startsWith(GATE_ANSWER_PREFIX)) ref = resolveGateAnswerRef(input, mainRoot);
    if (blind && (ref !== input || liesInsideAny(ref, mainRoot, hiddenRoots))) {
      if (!copies.some((c) => c.input === input)) copies.push({ input, source: path.resolve(mainRoot, ref), isUnitRun });
      continue;
    }
    if (!refs.includes(ref)) refs.push(ref);
  }

  const inputMap = [];
  let anonymized = 0;
  copies.forEach(({ input, source, isUnitRun }, index) => {
    const sha256 = copyDigestOf(input, source);
    const base = anonymize && isUnitRun ? anonymousInputName(anonymized++) : plainInputName(index, source, mainRoot);
    inputMap.push({ name: `${base}${path.extname(source)}`, input, source, sha256 });
  });
  if (sources.length > 0) {
    try {
      fs.mkdirSync(anonymizeInto, { recursive: true });
      sources.forEach(({ input, source }, index) => {
        const name = `${anonymousInputName(index)}${path.extname(source)}`;
        fs.copyFileSync(source, path.join(anonymizeInto, name));
        inputMap.push({ name, input, source });
        refs.push(path.join(anonymizeInto, name));
      });
    } catch (err) {
      throw new HandoffRefError('anonymized inputs', `copy-failed: ${err.message}`);
    }
  }
  return { refs, inputMap };
}

/**
 * The stable plain name (no extension) of the nth copied hand-off: its position, then `<seat>-r<round>` for
 * an assignment's report, `gate-<step>` for a gate answer, else the file's own name.
 */
export function plainInputName(index, source, mainRoot) {
  const rel = path.relative(path.join(mainRoot, '.fgos'), source).split(path.sep);
  let what = path.basename(source, path.extname(source));
  if (rel[0] === 'assignments' && rel.length > 4) what = `${rel[2]}-r${rel[3]}`;
  else if (rel[0] === 'workflow-runs' && rel[2] === 'gate-answers') what = `gate-${what}`;
  return `${index + 1}-${what}`;
}

/**
 * Copies of hand-off files (`{name, source, sha256?}`) in a role's own directory as `<dir>/inputs/<name>`,
 * paths in entry order. A source whose bytes changed from `sha256` is refused; a copy already in place
 * with those bytes is kept, so a resume reads the same files.
 */
export function copyHandoffsInto(dir, entries) {
  const target = path.join(dir, 'inputs');
  const copies = [];
  for (const { name, source, sha256 } of entries) {
    const dest = path.join(target, name);
    try {
      fs.mkdirSync(target, { recursive: true });
      if (sha256 && fs.existsSync(dest) && sha256OfFile(dest) === sha256) {
        copies.push(dest);
        continue;
      }
      const bytes = fs.readFileSync(source);
      if (sha256 && crypto.createHash('sha256').update(bytes).digest('hex') !== sha256) {
        throw new HandoffRefError(name, 'report-changed-after-settle');
      }
      fs.writeFileSync(dest, bytes);
    } catch (err) {
      if (err instanceof HandoffRefError) throw err;
      throw new HandoffRefError(name, `copy-failed: ${err.message}`);
    }
    copies.push(dest);
  }
  return copies;
}
