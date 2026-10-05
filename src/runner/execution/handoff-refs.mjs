// The one hand-off: an earlier role's work reaches a later role as the absolute, read-only path
// of its report, listed in the later role's context refs.
//
// Inside a Unit run the pattern passes the earlier role's record (`reportRefOf`). Across Units a
// Unit names `unit-run:<unitRunId>/<role>` in its `inputs`; `resolveUnitInputs` turns that into
// the path once, when the Unit run is created, and the result is kept in unit.json so a resume or
// a fallback hands out the same list. The owner's answer to a human gate of a Workflow run travels
// the same way as `gate-answer:<workflowRunId>/<stepId>`.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import { RunnerConfigError } from '../dispatch/config.mjs';
import { resolveBlindHiddenRoots, isInsideRoot } from '../dispatch/confinement/resources.mjs';
import { readUnitRunHistory } from './unit-run-history.mjs';

const UNIT_RUN_PREFIX = 'unit-run:';
const GATE_ANSWER_PREFIX = 'gate-answer:';

/** A hand-off that cannot be turned into a path; `reason` names why. */
export class HandoffRefError extends RunnerConfigError {
  constructor(subject, reason) {
    super(`handoff-ref-unresolved: ${subject}: ${reason}`);
    this.reason = reason;
  }
}

const sha256OfFile = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

/**
 * The path of the account one role record left behind, absolute.
 *
 * Settlement lists a report only when it was substantive, with the sha256 of its bytes; that file
 * is handed over after checking it still has those bytes. Without a report the role's claim is the
 * only artifact settlement kept. An inline producer has no settlement: its evidence refs are
 * relative to the Unit run's worktree.
 *
 * @param {{role: string, round: number, runResult?: object}} record role result as returned by runRole / history
 * @param {{mainRoot: string, worktree?: string}} where repo-relative artifact paths are relative to `mainRoot`
 * @returns {string}
 */
export function reportRefOf(record, { mainRoot, worktree = mainRoot }) {
  const subject = `role "${record?.role}" round ${record?.round}`;
  const runResult = record?.runResult ?? {};

  const settled = Array.isArray(runResult.settleReports) ? runResult.settleReports[0] : null;
  if (settled?.path) {
    const file = path.resolve(mainRoot, settled.path);
    let actual = null;
    try {
      actual = sha256OfFile(file);
    } catch {
      actual = null;
    }
    if (actual !== settled.sha256) throw new HandoffRefError(subject, 'report-changed-after-settle');
    return file;
  }

  const artifact = (runResult.evidence?.artifacts ?? []).find((a) => typeof a === 'string' && a !== '');
  if (artifact) return path.resolve(mainRoot, artifact);

  const inline = (Array.isArray(runResult.evidenceRefs) ? runResult.evidenceRefs : []).find((a) => typeof a === 'string' && a !== '');
  if (inline) return path.resolve(worktree, inline);

  throw new HandoffRefError(subject, 'no-report');
}

/**
 * The paths of the reports of in-run role results, in input order, each listed once.
 */
export function reportRefsOf(records, where) {
  const refs = [];
  for (const record of Array.isArray(records) ? records : []) {
    const ref = reportRefOf(record, where);
    if (!refs.includes(ref)) refs.push(ref);
  }
  return refs;
}

const isPathSegment = (s) => typeof s === 'string' && s !== '' && s !== '.' && s !== '..' && !/[/\\\0\s]/.test(s);

/**
 * Where the owner's answer to one human gate of a Workflow run is kept, absolute; null when
 * either id could not name a file inside the run's `gate-answers` directory. The Workflow runner
 * writes the file when the answer is recorded; `gate-answer:` inputs resolve to it.
 */
export function gateAnswerFile(mainRoot, workflowRunId, stepId) {
  if (!isPathSegment(workflowRunId) || !isPathSegment(stepId)) return null;
  return path.join(mainRoot, '.fgos', 'workflow-runs', workflowRunId, 'gate-answers', `${stepId}.md`);
}

function resolveGateAnswerRef(input, mainRoot) {
  const [workflowRunId, stepId, ...rest] = input.slice(GATE_ANSWER_PREFIX.length).split('/');
  const file = rest.length === 0 ? gateAnswerFile(mainRoot, workflowRunId, stepId) : null;
  if (!file || !fs.existsSync(file)) throw new HandoffRefError(input, 'no-such-answer');
  return file;
}

function resolveUnitRunRef(input, mainRoot) {
  const [unitRunId, role] = input.slice(UNIT_RUN_PREFIX.length).split('/');
  const fail = (reason) => new HandoffRefError(input, reason);

  const assignmentsDir = path.join(mainRoot, '.fgos', 'assignments');
  const unitDir = path.resolve(assignmentsDir, unitRunId);
  if (path.dirname(unitDir) !== assignmentsDir || !fs.existsSync(unitDir)) throw fail('no-such-run');

  // The latest round of the role is the one that counts; the history already keeps only the
  // latest fallback attempt of each round.
  const rounds = readUnitRunHistory(unitDir).filter((r) => r.role === role);
  if (rounds.length === 0) throw fail('no-such-role');
  const latest = rounds.reduce((a, b) => (b.round > a.round ? b : a));

  let worktree = mainRoot;
  try {
    worktree = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8')).worktree ?? mainRoot;
  } catch {
    // an inline record's refs fall back to the main checkout
  }
  try {
    return reportRefOf(latest, { mainRoot, worktree });
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
  try {
    real = fs.realpathSync(abs);
  } catch {
    // a ref that does not exist yet is judged by its spelling
  }
  return roots.some((root) => isInsideRoot(real, root));
}

/**
 * Whether a blind worker would be unable to read `ref` where it lies: it is inside a root
 * `hostRead: blind` hides. Such a ref reaches the worker only as a copy in its own directory.
 */
export function refIsHiddenFromBlind(ref, mainRoot) {
  return liesInsideAny(ref, mainRoot, resolveBlindHiddenRoots({ fgosDir: path.join(mainRoot, '.fgos') }));
}

/**
 * Turn a Unit's `inputs` into the context refs its roles are given: a repo-relative path stays as
 * it is, a `unit-run:<unitRunId>/<role>` becomes the absolute path of that role's report, a
 * `gate-answer:<workflowRunId>/<stepId>` the absolute path of the owner's recorded gate answer.
 * Throws before anything is dispatched when a ref cannot be resolved.
 *
 * With `anonymizeInto` (a directory inside the receiving Unit run), every `unit-run:` report is
 * instead copied there, byte for byte, as `seat-A`, `seat-B`, ... in input order, and only the
 * copies are listed, after the other refs. `inputMap` says which input each name stands for; it is
 * kept in unit.json and never shown to a role. Repo paths and gate answers are not anonymized.
 * The directory is created only once every source has resolved.
 *
 * With `blind` (a unit whose roles cannot read other runs' state) nothing is copied here, because
 * each role needs the copy in its own directory (`copyHandoffsInto`, at dispatch). `refs` then
 * lists only what a blind worker can read where it lies; `inputMap` lists every `unit-run:` and
 * `gate-answer:` input and every other ref inside a hidden root, with the name its copy gets
 * (`seat-A`, ... for `unit-run:` inputs when `anonymize`, a plain name otherwise) and the sha256
 * of the bytes resolved now, which the copy must still have.
 *
 * @param {readonly string[]} inputs
 * @param {string} mainRoot main checkout root
 * @param {{anonymizeInto?: string, blind?: boolean, anonymize?: boolean}} [options]
 * @returns {{refs: string[], inputMap: Array<{name: string, input: string, source: string, sha256?: string}>}}
 */
export function resolveUnitInputs(inputs, mainRoot, { anonymizeInto, blind = false, anonymize = false } = {}) {
  const refs = [];
  const sources = [];
  const copies = [];
  const hiddenRoots = blind ? resolveBlindHiddenRoots({ fgosDir: path.join(mainRoot, '.fgos') }) : [];
  for (const input of inputs ?? []) {
    let ref = input;
    const isUnitRun = input.startsWith(UNIT_RUN_PREFIX);
    if (isUnitRun) {
      ref = resolveUnitRunRef(input, mainRoot);
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
  let seat = 0;
  copies.forEach(({ input, source, isUnitRun }, index) => {
    let sha256;
    try {
      sha256 = sha256OfFile(source);
    } catch (err) {
      throw new HandoffRefError(input, `copy-failed: ${err.message}`);
    }
    const base = anonymize && isUnitRun ? anonymousInputName(seat++) : plainInputName(index, source, mainRoot);
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
 * The stable plain name (without extension) of the nth copied hand-off: its position, then what it
 * is when that can be told from where it lies (`<role>-r<round>` for an assignment's report,
 * `gate-<step>` for a gate answer), else the file's own name.
 */
export function plainInputName(index, source, mainRoot) {
  const rel = path.relative(path.join(mainRoot, '.fgos'), source).split(path.sep);
  let what = path.basename(source, path.extname(source));
  if (rel[0] === 'assignments' && rel.length > 4) what = `${rel[2]}-r${rel[3]}`;
  else if (rel[0] === 'workflow-runs' && rel[2] === 'gate-answers') what = `gate-${what}`;
  return `${index + 1}-${what}`;
}

/**
 * The copies of hand-off files a blind role reads, made in the role's own directory (`dir`, the
 * one it can read back) as `<dir>/inputs/<name>`; returns their paths in entry order. An entry
 * with a `sha256` is refused when its source no longer has those bytes; a copy already in place
 * with those bytes is kept, so a resume reads the same files. Entries are `{name, source, sha256?}`.
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
