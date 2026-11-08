// src/workflow/propose-validate.mjs — a proposed set of slices, checked against the repository before anyone is asked
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// A proposal is judgment on paper; this module compares it with what is really there and refuses by name, never
// repairs it quietly. The checks are pure functions over three injected reads (`stat`, `listFiles`, `findTests`),
// so a test needs no repository; `createRepoPorts` is the real set over a checkout. The one thing it adds to a
// proposal is the tests that exercise the code a slice changes: they are listed in `expansions`, visibly, so the
// owner sees what the slice will also write, and they take part in the overlap check like any other path.
//
// A slice that names a directory or a glob must have been classified with the files below it (a scope still left
// in `unresolvedScopes` is refused): the rigor of a slice is only as honest as the paths it was judged on.

import fs from 'node:fs';
import path from 'node:path';

import { registeredCapabilityOf } from '../runner/dispatch/config.mjs';
import { globsMeet } from '../runner/dispatch/write-scope.mjs';
import { RIGOR_ORDER } from './guide-schema.mjs';
import { normalizeWrite } from './propose-classify.mjs';

/**
 * Trees no slice may write: the repository's own bookkeeping, installed dependencies and, for a slice that
 * dispatches, the run-state store (no declared scope ever covers it, so nothing there could be committed).
 */
const FORBIDDEN_WRITE_ROOTS = Object.freeze(['.git', 'node_modules']);
const STORE_ROOT = '.fgos';

/**
 * How far the search for tests may grow before the slice is called too wide to size honestly: the distinct
 * search terms one slice yields, and all the tests found for them (whoever ends up writing them).
 */
export const TEST_SCAN_LIMITS = Object.freeze({ terms: 40, tests: 30 });

const CODE_FILE = /\.(mjs|cjs|js|ts|tsx|rs)$/;
const TEXT_FILE = /\.(mjs|cjs|js|ts|tsx|json|yaml|yml|md|rs|toml|txt)$/;
const MAX_TEXT_BYTES = 512 * 1024;
const SKIPPED_DIRECTORIES = new Set(['.git', 'node_modules', 'target', '.fgos']);

export class ProposeValidateError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ProposeValidateError';
    this.code = code;
  }
}

const isTestPath = (file) => file.startsWith('test/') || /\.test\.(mjs|cjs|js|ts|tsx)$/.test(file) || /(^|\/)(rust\/)?tests\//.test(file);
const rank = (rigor) => RIGOR_ORDER.indexOf(rigor);
const segmentsOf = (file) => file.split('/').filter((segment) => segment !== '' && segment !== '.');

/**
 * The search terms that find the tests of a changed code file: its repository path (a test names a module by
 * path or imports it relatively, which the port resolves to that path), or, for Rust, the crate's directory and
 * package name in both spellings. A file that is not code, or a Rust file outside any crate, gives none.
 */
function termsOfFile(file, ports) {
  if (!CODE_FILE.test(file) || isTestPath(file)) return [];
  if (!file.endsWith('.rs')) return [file];
  const crate = ports.crateOf(file);
  if (!crate) return [];
  return [...new Set([crate.dir, crate.name, crate.name.replace(/-/g, '_')])];
}

/**
 * How one write path reads against the repository: a glob, a directory, a file that exists, a file that does not
 * exist yet (its parent directory does), or a path with nothing to stand on. `cover` is the path as a glob
 * (a directory covers everything below it), which is what the overlap check compares.
 */
function describeWrite(raw, ports, { dispatches }) {
  let normalized;
  try {
    normalized = normalizeWrite(raw);
  } catch (err) {
    return { raw, problem: { code: 'write-path-invalid', detail: err.message } };
  }
  const { path: writePath, segments, glob } = normalized;
  const forbidden = dispatches ? [...FORBIDDEN_WRITE_ROOTS, STORE_ROOT] : FORBIDDEN_WRITE_ROOTS;
  const inside = segments.find((segment) => forbidden.includes(segment));
  if (inside) {
    return { raw, problem: { code: 'write-path-forbidden', detail: `"${writePath}" is under ${inside}, which no slice may write` } };
  }
  if (glob) {
    const reached = forbidden.find((root) => globsMeet(segments, [root, '**']));
    if (reached) return { raw, problem: { code: 'write-path-forbidden', detail: `"${writePath}" reaches ${reached}, which no slice may write; name the directories it is meant for` } };
    return { raw, kind: 'glob', path: writePath, scope: writePath === '**' ? '.' : writePath, cover: segments };
  }
  const found = ports.stat(writePath);
  if (found === 'link') {
    return { raw, problem: { code: 'write-path-forbidden', detail: `"${writePath}" goes through a symbolic link, so it may lead outside the repository or to a path another slice names` } };
  }
  if (found === 'dir') return { raw, kind: 'dir', path: writePath, scope: writePath, cover: [...segments, '**'] };
  if (found === 'file') return { raw, kind: 'file', path: writePath, cover: segments };
  const parent = segments.length === 1 ? '.' : segments.slice(0, -1).join('/');
  const parentFound = ports.stat(parent);
  if (parentFound === 'link') {
    return { raw, problem: { code: 'write-path-forbidden', detail: `"${writePath}" is in a directory reached through a symbolic link` } };
  }
  if (!/\/\s*$/.test(raw) && parentFound === 'dir') return { raw, kind: 'new-file', path: writePath, cover: segments };
  return { raw, problem: { code: 'write-path-missing', detail: `"${writePath}" does not exist and neither does the directory a new file would go in` } };
}

/** Existing code files a slice changes: the files it names plus every file below its directories and globs. */
function changedCodeFiles(described, ports) {
  const files = new Set();
  for (const write of described) {
    if (write.kind === 'file') files.add(write.path);
    else if (write.kind === 'dir' || write.kind === 'glob') ports.listFiles(write.scope).forEach((file) => files.add(file));
  }
  return [...files].filter((file) => CODE_FILE.test(file) && !isTestPath(file)).sort();
}

/**
 * Check a proposal against the repository and say what is wrong with it, all at once. Slices arrive
 * well-formed: the slice list's one shape check is `checkManifest` in `propose.mjs`.
 *
 * Each slice is the classifier's answer for its write paths plus its id and paths:
 * `{ id, writes, rigor, capability, followUp, askOwnerFirst, unresolvedScopes }`. A refusal is
 * `{ code, slice, detail, ... }`; a proposal with any refusal is not to be offered to the owner.
 *
 * Codes: `unresolved-scope`, `write-path-invalid` (also whatever the write-scope reader refuses),
 * `write-path-forbidden` (a forbidden tree, a glob that reaches one, a path through a symbolic link), `write-path-missing`,
 * `write-scope-empty`, `capability-unregistered`, `rigor-below-floor`, `test-scan-too-wide`, `write-overlap`.
 *
 * @param {object} params
 * @param {Array<object>} params.slices
 * @param {object} params.runnerConfig the config whose `capabilities` register what a slice may ask for
 * @param {string} [params.rigorFloor] the lowest rigor the frame accepts for any slice
 * @param {{ stat: (p: string) => 'file'|'dir'|'link'|null, listFiles: (scope: string) => string[], findTests: (terms: string[]) => string[], crateOf: (file: string) => ({ dir: string, name: string }|null) }} params.ports
 * @returns {{ ok: boolean, refusals: object[], expansions: Array<{ slice: string, add: string[], coveredElsewhere: Array<{ path: string, slice: string }>, terms: string[] }>, ownerFirst: string[] }}
 */
export function validateProposal({ slices, runnerConfig, rigorFloor, ports }) {
  if (!Array.isArray(slices) || slices.length === 0) throw new ProposeValidateError('a proposal needs at least one slice', 'no-slices');
  if (rigorFloor !== undefined && !RIGOR_ORDER.includes(rigorFloor)) throw new ProposeValidateError(`rigorFloor must be one of ${RIGOR_ORDER.join(', ')}`, 'floor-invalid');
  const refusals = [];
  const refuse = (code, slice, detail, extra = {}) => refusals.push({ code, slice: slice.id, detail, ...extra });
  const described = new Map();

  for (const slice of slices) {
    if (Array.isArray(slice.unresolvedScopes) && slice.unresolvedScopes.length > 0) {
      refuse('unresolved-scope', slice, `the scopes ${slice.unresolvedScopes.map((s) => `"${s}"`).join(', ')} were judged without the files below them; classify the slice again with the files listed`, { scopes: [...slice.unresolvedScopes] });
    }

    const writes = slice.writes.map((raw) => describeWrite(raw, ports, { dispatches: slice.askOwnerFirst !== true }));
    let writesSound = true;
    for (const write of writes) {
      if (write.problem) {
        writesSound = false;
        refuse(write.problem.code, slice, write.problem.detail, { path: write.raw });
      } else if ((write.kind === 'dir' || write.kind === 'glob') && ports.listFiles(write.scope).length === 0) {
        writesSound = false;
        refuse('write-scope-empty', slice, `"${write.path}" names no file`, { path: write.path });
      }
    }
    described.set(slice.id, { writes, writesSound });

    const wanted = [slice.askOwnerFirst === true ? null : slice.capability, slice.followUp?.capability];
    for (const capability of wanted) {
      if (typeof capability === 'string' && capability !== '' && registeredCapabilityOf(runnerConfig, capability) === undefined) {
        refuse('capability-unregistered', slice, `"${capability}" is not a registered capability (runner.capabilities)`, { capability });
      }
    }

    if (rigorFloor !== undefined && rank(slice.rigor) < rank(rigorFloor)) {
      refuse('rigor-below-floor', slice, `the slice is ${slice.rigor}, below the frame's floor of ${rigorFloor}`, { rigor: slice.rigor, rigorFloor });
    }
  }

  const coverOf = (slice) => described.get(slice.id).writes.filter((write) => !write.problem).map((write) => write.cover);
  const covers = new Map(slices.map((slice) => [slice.id, coverOf(slice)]));
  const meetsAny = (fileSegments, list) => list.some((cover) => globsMeet(cover, fileSegments));

  const expansions = [];
  const added = new Map(slices.map((slice) => [slice.id, []]));
  for (const slice of slices) {
    const { writes, writesSound } = described.get(slice.id);
    if (!writesSound) continue;
    const terms = [...new Set(changedCodeFiles(writes, ports).flatMap((file) => termsOfFile(file, ports)))].sort();
    if (terms.length === 0) continue;
    if (terms.length > TEST_SCAN_LIMITS.terms) {
      refuse('test-scan-too-wide', slice, `the slice changes code worth ${terms.length} search terms (limit ${TEST_SCAN_LIMITS.terms}); cut it into smaller slices`, { terms: terms.length });
      continue;
    }
    const found = [...new Set(ports.findTests(terms))].sort();
    if (found.length > TEST_SCAN_LIMITS.tests) {
      refuse('test-scan-too-wide', slice, `${found.length} tests exercise the code this slice changes (limit ${TEST_SCAN_LIMITS.tests}); cut it into smaller slices`, { tests: found.length });
      continue;
    }
    const own = covers.get(slice.id);
    const add = [];
    const coveredElsewhere = [];
    for (const test of found) {
      const segments = segmentsOf(test);
      if (meetsAny(segments, own)) continue;
      const other = slices.find((candidate) => candidate.id !== slice.id && meetsAny(segments, covers.get(candidate.id)));
      if (other) coveredElsewhere.push({ path: test, slice: other.id });
      else add.push(test);
    }
    if (add.length > 0 || coveredElsewhere.length > 0) {
      expansions.push({ slice: slice.id, add, coveredElsewhere, terms });
      added.set(slice.id, add);
    }
  }

  const reach = (slice) => [
    ...described.get(slice.id).writes.filter((write) => !write.problem).map((write) => ({ path: write.path, cover: write.cover, viaExpansion: false })),
    ...added.get(slice.id).map((test) => ({ path: test, cover: segmentsOf(test), viaExpansion: true })),
  ];
  for (let i = 0; i < slices.length; i += 1) {
    for (let j = i + 1; j < slices.length; j += 1) {
      const mine = reach(slices[i]);
      const theirs = reach(slices[j]);
      let clash = null;
      for (const a of mine) {
        clash = theirs.find((b) => globsMeet(a.cover, b.cover));
        if (clash) {
          refuse('write-overlap', slices[i], `slices "${slices[i].id}" and "${slices[j].id}" both write "${a.path}" and "${clash.path}"; one path, one slice`, { other: slices[j].id, paths: [a.path, clash.path], viaExpansion: a.viaExpansion || clash.viaExpansion });
          break;
        }
      }
    }
  }

  return { ok: refusals.length === 0, refusals, expansions, ownerFirst: slices.filter((slice) => slice.askOwnerFirst === true).map((slice) => slice.id) };
}

/**
 * The real reads over a checkout at `root`: what is there, which files lie under a directory or glob, and which
 * test files mention any of some terms. Tests live under `test/` and under each crate's `tests/`.
 *
 * @param {{ root: string }} params
 */
export function createRepoPorts({ root }) {
  const stat = (rel) => {
    const parts = segmentsOf(rel);
    let current = root;
    for (let i = 0; i < parts.length; i += 1) {
      current = path.join(current, parts[i]);
      let info;
      try {
        info = fs.lstatSync(current);
      } catch {
        return null;
      }
      if (info.isSymbolicLink()) return 'link';
      if (i === parts.length - 1) return info.isDirectory() ? 'dir' : info.isFile() ? 'file' : null;
      if (!info.isDirectory()) return null;
    }
    return 'dir';
  };

  const walk = (relDir, visit, { includeHidden = false } = {}) => {
    let entries;
    try {
      entries = fs.readdirSync(path.join(root, relDir), { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIPPED_DIRECTORIES.has(entry.name) && !includeHidden) continue;
      const rel = relDir === '.' ? entry.name : `${relDir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel, visit, { includeHidden });
      else if (entry.isFile()) visit(rel);
    }
  };

  const listFiles = (scope) => {
    const segments = segmentsOf(scope);
    const literal = [];
    for (const segment of segments) {
      if (segment.includes('*')) break;
      literal.push(segment);
    }
    const base = literal.length === 0 ? '.' : literal.join('/');
    const hasStar = literal.length < segments.length;
    const found = stat(base);
    if (!hasStar && found === 'file') return [base];
    if (found !== 'dir') return [];
    const files = [];
    walk(base, (file) => {
      if (!hasStar || globsMeet(segmentsOf(file), segments)) files.push(file);
    }, { includeHidden: base === STORE_ROOT || base.startsWith(`${STORE_ROOT}/`) });
    return files.sort();
  };

  // Every test file of the checkout, wherever it lives (`test/`, a crate's `tests/`, next to the code), with
  // the repository paths its relative imports resolve to.
  let tests = null;
  const loadTests = () => {
    if (tests) return tests;
    tests = [];
    walk('.', (file) => {
      if (!isTestPath(file) || !TEXT_FILE.test(file)) return;
      try {
        const absolute = path.join(root, file);
        if (fs.statSync(absolute).size > MAX_TEXT_BYTES) return;
        const text = fs.readFileSync(absolute, 'utf8');
        const imported = new Set();
        for (const match of text.matchAll(/(?:from|import|require)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
          imported.add(path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1])));
        }
        tests.push({ file, text, imported });
      } catch { /* a file that vanished mid-scan has no test to offer */ }
    });
    return tests;
  };
  const findTests = (terms) => loadTests()
    .filter(({ text, imported }) => terms.some((term) => imported.has(term) || text.includes(term)))
    .map(({ file }) => file)
    .sort();

  // The crate a Rust file belongs to: the nearest directory above it with a Cargo.toml that names a package.
  const crateOf = (file) => {
    const parts = segmentsOf(file).slice(0, -1);
    for (let depth = parts.length; depth > 0; depth -= 1) {
      const dir = parts.slice(0, depth).join('/');
      try {
        const manifest = fs.readFileSync(path.join(root, dir, 'Cargo.toml'), 'utf8');
        const name = /^\s*name\s*=\s*"([^"]+)"/m.exec(manifest.slice(Math.max(0, manifest.indexOf('[package]'))))?.[1];
        if (name) return { dir, name };
      } catch { /* no manifest at this level */ }
    }
    return null;
  };

  return { stat, listFiles, findTests, crateOf };
}
