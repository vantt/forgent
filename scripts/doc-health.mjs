#!/usr/bin/env node
// doc-health.mjs -- the one documentation check: Convention placement plus the body rules of the
// platform documents under docs/platform.
//
// Usage: node scripts/doc-health.mjs [--json] [--repo-root <dir>] [--] [<path>...]
//   Without paths it checks the whole platform corpus of the working tree. With repository-relative
//   paths it runs `fgos convention check` on those paths (one host call) and every body rule on the
//   platform documents among them; a path that does not exist is a deletion, never read.
//   Each finding prints as `<file>:<line>: <rule>: <message>`; any finding exits 1.
//
// The pre-commit hook does not run this file: it imports `checkDocuments` and passes an index source
// it builds itself (the Git index read is a read verb of the hook, Git spec section 13), so the
// commit is judged on staged content, never the working tree. An outer script never spawns Git.
//
// Rules, all strict (any finding is a non-zero exit), none gated by a migration status:
//   - links-resolve: every local link and anchor, including Related and clickable
//     historical-source references, resolves to a real file and heading. The
//     link/anchor reader is shared; code spans and fences remain literal.
//   - metadata: every Markdown document whose `fgos convention classify` result is
//     not `metadataExempt` carries the governance baseline header (a fenced txt
//     block directly under the H1) with every baseline field. The field list is
//     read from docs/platform/governance.md, never copied here.
//   - dead references: in a document that holds current claims (below), every
//     backticked repo-root path exists, unless the same line pins a commit sha.
//     Fenced blocks, patterns and <placeholders> are not references.
//   - verb reference: in a document that holds current claims, every backticked
//     `fgos <verb>` names a verb of the command listing (`fgos --help --json` of the
//     host, plus the hidden `internal`), unless the same line pins a commit sha. No
//     prose context word exempts a mention.
//   - rule-claim owner: the same rule id with the same title, written as a bold
//     `**RULn (title)**` (also D-ADR numbers and the laws L1-L10), is defined in at
//     most one document; a second holder cites the owner instead.
// A document holds current claims when classify reports it canonical, its kind does
// not record past state (history, decision, verification), and its header does not
// say `Canonical: No`.
//
// Path kind and the metadata exemption come from the native Convention host
// (one door); this script owns only the body.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { isMainModule } from './lib/is-main-module.mjs';
import { listAnchors } from './list-doc-anchors.mjs';
import { inspectRepo } from './lib/git-ports.mjs';
import { clickable, relatedLinks, localDestination, headerBlock } from './lib/doc-links.mjs';
import { invokeHost, resolveHostBin } from '../src/util/host-bin.mjs';
import { conventionCheck } from '../src/convention/convention-client.mjs';

const GOVERNANCE = 'docs/platform/governance.md';
// The one verb the listing hides on purpose: the host-to-payload protocol entry.
const HIDDEN_VERBS = ['internal'];
const HOST_HELP_TIMEOUT_MS = 10_000;

const isPlatformDoc = (file) => file.startsWith('docs/platform/') && file.endsWith('.md');

/** The baseline field names of docs/platform/governance.md section 5, from its text. */
export function governanceBaselineFields(text) {
  const start = text.indexOf('Required baseline:');
  const block = start >= 0 ? text.slice(start).match(/```txt\n([\s\S]*?)\n```/) : null;
  return block ? block[1].split('\n').map((l) => l.replace(/:\s*$/, '').trim()).filter(Boolean) : [];
}

export function headerFields(text) {
  const block = headerBlock(text);
  return block !== null ? new Set([...block.matchAll(/^([A-Za-z][A-Za-z ]*):/gm)].map((m) => m[1])) : null;
}

/** Strict doc-health guard: all platform Markdown, independent of status/kind.
 * readFile and exists are ports so the same check can read a materialized F tree.
 * Code is literal, not a link exemption. There are no history/status allowlists.
 */
export function checkPlatformLinks({ files, readFile, exists }) {
  const population = [], findings = [], anchors = new Map();
  for (const file of [...files].sort()) {
    if (!isPlatformDoc(file)) continue;
    const text = readFile(file);
    for (const link of [...clickable(text), ...relatedLinks(text)]) {
      let resolved;
      try { resolved = localDestination(file, link.target); }
      catch { resolved = { path: '', fragment: '', invalid: true }; }
      if (!resolved) continue;
      // Related has always accepted repo-relative paths as well as file-relative.
      const bare = link.target.split('#')[0];
      if (link.related && exists(bare)) resolved.path = bare;
      const edge = { file, line: text.slice(0, link.targetStart).split('\n').length,
        targetStart: [...text.slice(0, link.targetStart)].length, target: link.target,
        oldPath: resolved.path, fragment: resolved.fragment, related: !!link.related };
      if (resolved.invalid || resolved.path === '..' || resolved.path.startsWith('../') || !exists(resolved.path)) edge.reason = 'missing-file';
      else if (resolved.fragment) {
        if (!anchors.has(resolved.path)) {
          anchors.set(resolved.path, new Set(listAnchors(readFile(resolved.path))
            .flatMap((a) => [a.anchor, a.githubSlug]).filter(Boolean)));
        }
        if (!anchors.get(resolved.path).has(resolved.fragment)) edge.reason = 'missing-anchor';
      }
      population.push(edge);
      if (edge.reason) findings.push({ type: edge.reason === 'missing-anchor' ? 'unresolved-anchor' : link.related ? 'unresolved-related' : 'unresolved-link',
        path: file, line: edge.line, target: link.target, reason: edge.reason,
        message: `link target does not resolve: ${link.target} (${edge.reason})` });
    }
  }
  return { population, findings, counts: { files: files.filter(isPlatformDoc).length,
    links: population.length, findings: findings.length } };
}

/** Filesystem enumeration of platform Markdown, including new files; no Git index needed. */
export function platformDocs(repoRoot) {
  const files = [];
  const walk = (relative) => {
    let entries;
    try { entries = fs.readdirSync(path.join(repoRoot, relative), { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of entries) {
      const file = relative + '/' + entry.name;
      if (entry.isDirectory()) walk(file);
      else if (file.endsWith('.md')) files.push(file);
    }
  };
  walk('docs/platform');
  return files.sort();
}

/**
 * Metadata rule. `classify(file)` is a port returning the Convention classify
 * result; it is called only for documents without a complete header, since a
 * complete header satisfies the rule whatever the exemption.
 */
export function checkPlatformMetadata({ files, readFile, baseline, classify }) {
  const docs = [...files].filter(isPlatformDoc).sort();
  if (docs.length > 0 && baseline.length === 0) throw new Error('the governance required baseline could not be read from docs/platform/governance.md');
  const findings = [];
  let exempt = 0;
  for (const file of docs) {
    const text = readFile(file);
    const fields = headerFields(text);
    const missing = baseline.filter((f) => !fields?.has(f));
    if (missing.length === 0) continue;
    if (classify(file).metadataExempt) { exempt += 1; continue; }
    const misplaced = !fields && /^```txt\n(?:[^\n]*\n)*?Document type:/m.test(text);
    findings.push({ type: 'missing-metadata', path: file, line: 1,
      message: misplaced ? `the header block is not directly under the H1; missing: ${missing.join(', ')}`
        : fields ? `missing header fields: ${missing.join(', ')}` : `no header block; missing: ${missing.join(', ')}` });
  }
  return { findings, counts: { files: docs.length, exempt, findings: findings.length } };
}

const REPO_PATH = /`((?:src|scripts|bin|apps|packages|core|test|docs|plans)\/[^`\s]+)`/g;
const COMMIT_CANDIDATE = /\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b/g;
// Kinds that record past state or dated evidence, not current claims.
const PAST_STATE_KINDS = new Set(['history', 'decision', 'verification']);

function proseOf(text) {
  return text.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (block) => block.replace(/[^\n]/g, ''));
}

/** A backticked repo-root path as a literal file reference, or null when it is a pattern, an elision or a URL. */
function referencedPath(raw) {
  const target = raw.replace(/[#?].*$/, '').replace(/::.*$/, '').replace(/:\d.*$/, '').replace(/\(.*$/, '').replace(/[.,;:)]+$/, '');
  if (/[*<>{}$|]|\.\.\.|\s/.test(target) || target.includes('://')) return null;
  return target;
}

/** Whether a line pins a commit that resolves: a provenance coordinate exempts the line's references. */
const pinsCommit = (line, isCommit) => (line.match(COMMIT_CANDIDATE) || []).some(isCommit);

/**
 * Whether `file` holds current claims: classify reports it canonical, its kind does not record past
 * state, and its own header does not say `Canonical: No` (an unsigned draft). Shared by every rule
 * that holds a document to what exists now.
 */
function holdsCurrentClaims(file, text, classify) {
  const { canonical, kind } = classify(file);
  if (typeof canonical !== 'boolean') throw new Error(`classify returned no canonical flag for ${file}; the Convention host predates the reserved document flags`);
  if (!canonical || PAST_STATE_KINDS.has(kind)) return false;
  return !/^Canonical:\s*No\b/m.test(headerBlock(text) ?? '');
}

/**
 * Candidates of one per-line rule over the prose of each document, then the exemptions shared by
 * the dead-reference and verb rules: a line that pins a real commit, and a document that does not
 * hold current claims. `candidates(line)` returns the offending targets of a line; classify and
 * isCommit are called only when a candidate exists.
 */
function currentClaimFindings({ files, readFile, classify, isCommit, candidates, finding }) {
  const findings = [];
  for (const file of [...files].filter(isPlatformDoc).sort()) {
    const text = readFile(file);
    const hits = [];
    proseOf(text).split('\n').forEach((line, index) => {
      const targets = candidates(line);
      if (targets.length > 0 && !pinsCommit(line, isCommit)) for (const target of targets) hits.push({ line: index + 1, target });
    });
    if (hits.length === 0 || !holdsCurrentClaims(file, text, classify)) continue;
    for (const { line, target } of hits) findings.push({ path: file, line, target, ...finding(target) });
  }
  return { findings, counts: { findings: findings.length } };
}

/**
 * Dead-reference rule. In a document that holds current claims, every backticked repo-root path
 * must exist, unless the same line pins a commit that resolves (a provenance coordinate).
 * `isCommit(token)` says whether a hex token names a real commit.
 */
export function checkDeadReferences({ files, readFile, exists, classify, isCommit }) {
  return currentClaimFindings({
    files, readFile, classify, isCommit,
    candidates: (line) => [...line.matchAll(REPO_PATH)].map((m) => referencedPath(m[1])).filter((target) => target && !exists(target)),
    finding: (target) => ({ type: 'dead-reference', message: `backticked path does not exist: ${target}` }),
  });
}

/** The `fgos` verbs of a command listing (the `fgos --help --json` answer), plus the hidden ones. */
export function commandVerbs(listingText) {
  const commands = JSON.parse(listingText)?.commands;
  if (!Array.isArray(commands) || commands.length === 0) throw new Error('the command listing (fgos --help --json) lists no commands');
  return new Set([...commands.map((command) => command.name), ...HIDDEN_VERBS]);
}

/**
 * Verb reference rule. In a document that holds current claims, each code span that starts with
 * `fgos <verb>` names a verb of `verbs()` (a lazy port: the listing is read only when a mention
 * exists), unless the same line pins a commit that resolves.
 */
export function checkVerbReferences({ files, readFile, verbs, classify, isCommit }) {
  let known = null;
  return currentClaimFindings({
    files, readFile, classify, isCommit,
    candidates: (line) => {
      const named = [...line.matchAll(/`([^`\n]+)`/g)].map((m) => /^fgos ([a-z][a-z0-9-]*)/.exec(m[1])?.[1]).filter(Boolean);
      if (named.length === 0) return [];
      known ??= verbs();
      return named.filter((verb) => !known.has(verb));
    },
    finding: (verb) => ({ type: 'unknown-verb', message: `\`fgos ${verb}\` is not a verb of the command listing (pin the removing commit on the line, or reword)` }),
  });
}

const CLAIM_START = /\*\*(RUL\d+|D-ADR\d+|L(?:10|[1-9]))\s+\(/g;

/** Every bold rule claim of a text: `{ id, title, line }`, the title read to its balanced closing parenthesis. */
export function ruleClaims(text) {
  const claims = [];
  const prose = proseOf(text);
  for (const match of prose.matchAll(CLAIM_START)) {
    let depth = 1, end = match.index + match[0].length;
    for (; end < prose.length && depth > 0 && prose[end] !== '\n'; end++) {
      if (prose[end] === '(') depth += 1;
      else if (prose[end] === ')') depth -= 1;
    }
    if (depth !== 0) continue;
    const title = prose.slice(match.index + match[0].length, end - 1).replace(/\s+/g, ' ').trim();
    claims.push({ id: match[1], title, line: prose.slice(0, match.index).split('\n').length });
  }
  return claims;
}

/**
 * Rule-claim owner rule. A rule id is unique only inside its holder, the document that defines it,
 * so the same id under a different title elsewhere is allowed; the same id with the same title in
 * two holders is a repeated definition. `files` is the whole population (a repeat in a document
 * that is not under check still counts); findings are reported only for `report` paths.
 */
export function checkRuleClaims({ files, readFile, report = null }) {
  const holders = new Map();
  for (const file of [...files].filter(isPlatformDoc).sort()) {
    for (const claim of ruleClaims(readFile(file))) {
      const key = `${claim.id}\u0000${claim.title}`;
      if (!holders.has(key)) holders.set(key, new Map());
      if (!holders.get(key).has(file)) holders.get(key).set(file, claim);
    }
  }
  const findings = [];
  for (const byFile of holders.values()) {
    if (byFile.size < 2) continue;
    for (const [file, claim] of byFile) {
      if (report && !report.has(file)) continue;
      const others = [...byFile.keys()].filter((other) => other !== file);
      findings.push({ type: 'duplicate-rule-claim', path: file, line: claim.line, target: claim.id,
        message: `${claim.id} (${claim.title}) is also defined in ${others.join(', ')}; keep one owner and cite it from the other holder` });
    }
  }
  return { findings: findings.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line), counts: { findings: findings.length } };
}

/** Whether a hex token names a commit of the repository (through the Git door); resolved once per distinct token. */
export function gitCommitResolver(repoRoot) {
  const git = inspectRepo(repoRoot);
  const cache = new Map();
  return (token) => {
    if (!cache.has(token)) {
      // The door answers null for a token that is not a commit; any other
      // failure is a driver fault and propagates.
      const sha = git.resolveCommit({ name: token });
      cache.set(token, typeof sha === 'string' && sha.length > 0);
    }
    return cache.get(token);
  };
}

/** The working tree of `repoRoot` as a document source: the platform population, file reads and existence. */
export function worktreeSource(repoRoot) {
  const at = (file) => path.resolve(repoRoot, file);
  return {
    files: platformDocs(repoRoot),
    readFile: (file) => fs.statSync(at(file)).isDirectory() ? '' : fs.readFileSync(at(file), 'utf8'),
    exists: (file) => fs.existsSync(at(file)),
  };
}

/** A repository-relative path, or an error naming the argument: no absolute path, no `..`. */
function repoRelative(raw) {
  const normalized = path.posix.normalize(raw.replace(/\\/g, '/')).replace(/^\.\//, '').replace(/\/$/, '');
  if (!normalized || normalized === '.' || path.posix.isAbsolute(normalized) || normalized === '..' || normalized.startsWith('../')) {
    throw new Error(`not a repository-relative path: ${raw}`);
  }
  return normalized;
}

/**
 * Every rule over one source. `paths` null checks the whole platform population; a path list runs
 * the placement port on the paths that exist (deleted ones are not read) and the body rules on the
 * platform documents among them. `classify`, `isCommit`, `placement` and `verbs` (the command listing,
 * asked only when a document names a verb) are ports; a classification is asked at most once per document.
 * Returns `{ counts, findings, warnings }`: findings are refusals, warnings are placement verdicts
 * without block posture.
 */
export function checkDocuments({ source, paths = null, classify, isCommit, placement, verbs }) {
  const answers = new Map();
  const classifyOnce = (file) => {
    if (!answers.has(file)) answers.set(file, classify(file));
    return answers.get(file);
  };
  const { readFile, exists } = source;
  const present = paths === null ? null : [...new Set(paths.map(repoRelative))].filter(exists).sort();
  const checked = present === null ? source.files.filter(isPlatformDoc) : present.filter(isPlatformDoc);
  const findings = [], warnings = [];
  if (present !== null && present.length > 0) {
    for (const violation of placement(present).violations ?? []) {
      const row = { type: `convention-${violation.code}`, path: violation.path, line: 1, message: violation.message };
      (violation.posture === 'block' ? findings : warnings).push(row);
    }
  }
  const baseline = checked.length > 0 && exists(GOVERNANCE) ? governanceBaselineFields(readFile(GOVERNANCE)) : [];
  const links = checkPlatformLinks({ files: checked, readFile, exists });
  const metadata = checkPlatformMetadata({ files: checked, readFile, baseline, classify: classifyOnce });
  const dead = checkDeadReferences({ files: checked, readFile, exists, classify: classifyOnce, isCommit });
  let listing = null;
  const verbRefs = checkVerbReferences({ files: checked, readFile, classify: classifyOnce, isCommit, verbs: () => (listing ??= verbs()) });
  const claims = checkRuleClaims({ files: source.files, readFile, report: present === null ? null : new Set(checked) });
  findings.push(...links.findings, ...metadata.findings, ...dead.findings, ...verbRefs.findings, ...claims.findings);
  return {
    counts: { files: checked.length, links: links.counts.links, metadataExempt: metadata.counts.exempt, findings: findings.length },
    findings, warnings,
  };
}

/** The classify port over the native Convention host of `repoRoot`. */
export function hostClassify(repoRoot) {
  return (file) => invokeHost(['convention', 'classify', '--json', '--', file], { dir: repoRoot });
}

/**
 * The command listing port: the verbs of `fgos --help --json` from the host of `repoRoot` (the host renders
 * it from its embedded manifest; no other file reads that manifest). A host that cannot answer throws with
 * code `host-unavailable` or `host-exec-error`.
 */
export function hostVerbs(repoRoot) {
  return () => {
    const hostBin = resolveHostBin(repoRoot);
    if (!hostBin) throw Object.assign(new Error('Rust host binary unavailable (FGOS_HOST_BIN unset and no active installation manifest)'), { code: 'host-unavailable' });
    let stdout;
    try {
      stdout = execFileSync(hostBin, ['--help', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: HOST_HELP_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024 });
    } catch (err) {
      const timedOut = err.code === 'ETIMEDOUT';
      throw Object.assign(new Error(timedOut ? `fgos --help --json timed out after ${HOST_HELP_TIMEOUT_MS}ms` : String(err.stderr || err.message).trim()), { code: 'host-exec-error', timedOut });
    }
    return commandVerbs(stdout);
  };
}

/** The placement port over the native Convention host of `repoRoot`: one call for every path. */
export function hostPlacement(repoRoot) {
  return (paths) => conventionCheck(paths, { dir: repoRoot });
}

export function runCli(argv, cwd = process.cwd(), { classify, placement, verbs } = {}) {
  const asJson = argv.includes('--json');
  try {
    let repoArg = '.';
    const paths = [];
    for (let i = 0, rest = false; i < argv.length; i++) {
      const arg = argv[i];
      if (rest) paths.push(arg);
      else if (arg === '--') rest = true;
      else if (arg === '--json') continue;
      else if (arg === '--repo-root') {
        if (argv[i + 1] === undefined) throw new Error('--repo-root needs a directory');
        repoArg = argv[++i];
      } else if (arg.startsWith('-')) throw new Error(`unknown option: ${arg}`);
      else paths.push(arg);
    }
    const repoRoot = path.resolve(cwd, repoArg);
    const result = checkDocuments({
      source: worktreeSource(repoRoot),
      paths: paths.length > 0 ? paths : null,
      classify: classify || hostClassify(repoRoot),
      isCommit: gitCommitResolver(repoRoot),
      placement: placement || hostPlacement(repoRoot),
      verbs: verbs || hostVerbs(repoRoot),
    });
    const { counts, findings, warnings } = result;
    if (asJson) console.log(JSON.stringify({ counts, findings, warnings }));
    else {
      console.log(`doc-health: ${counts.files} platform documents, ${counts.links} local links, ${counts.metadataExempt} metadata-exempt, ${counts.findings} finding(s)`);
      for (const w of warnings) console.log(`warning: ${w.path}:${w.line}: ${w.type}: ${w.message}`);
      for (const f of findings) console.log(`${f.path}:${f.line}: ${f.type}: ${f.message}`);
    }
    return findings.length ? 1 : 0;
  } catch (error) {
    console.error(`doc-health: ${error.message}`);
    return 1;
  }
}

if (isMainModule(import.meta.url)) process.exitCode = runCli(process.argv.slice(2));
