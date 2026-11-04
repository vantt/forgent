#!/usr/bin/env node
// doc-health.mjs -- body health of the platform documents under docs/platform.
//
// Three rules, all strict (any finding is a non-zero exit), none gated by a
// migration status:
//   - links-resolve: every local link and anchor, including Related and clickable
//     historical-source references, resolves to a real file and heading. The
//     link/anchor reader is shared; code spans and fences remain literal.
//   - metadata: every Markdown document whose `fgos convention classify` result is
//     not `metadataExempt` carries the governance baseline header (a fenced txt
//     block directly under the H1) with every baseline field. The field list is
//     read from docs/platform/governance.md, never copied here.
//   - dead references: in a canonical document that is not past-state (kinds
//     history, decision, verification), every backticked repo-root path exists,
//     unless the same line pins a commit sha. Fenced blocks, patterns and
//     <placeholders> are not references.
//
// Path kind and the metadata exemption come from the native Convention host
// (one door); this script owns only the body.

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { isMainModule } from './lib/is-main-module.mjs';
import { listAnchors } from './list-doc-anchors.mjs';
import { clickable, relatedLinks, localDestination, headerBlock } from './lib/doc-links.mjs';
import { invokeHost } from '../src/util/host-bin.mjs';

/** The baseline field names of docs/platform/governance.md section 5. */
export function governanceBaselineFields(repoRoot) {
  const file = path.resolve(repoRoot, 'docs/platform/governance.md');
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8');
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
    if (!file.startsWith('docs/platform/') || !file.endsWith('.md')) continue;
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
  return { population, findings, counts: { files: files.filter((f) => f.startsWith('docs/platform/') && f.endsWith('.md')).length,
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
  if (baseline.length === 0) throw new Error('the governance required baseline could not be read from docs/platform/governance.md');
  const findings = [];
  let exempt = 0;
  const docs = [...files].filter((f) => f.startsWith('docs/platform/') && f.endsWith('.md')).sort();
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

/**
 * Dead-reference rule. In a document that classify reports as canonical and not
 * past-state, every backticked repo-root path must exist, unless the same line
 * pins a commit that resolves (a provenance coordinate). `classify(file)` is
 * called only for documents that have at least one dead candidate; `isCommit(token)`
 * says whether a hex token names a real commit.
 */
export function checkDeadReferences({ files, readFile, exists, classify, isCommit }) {
  const findings = [];
  const pins = (line) => (line.match(COMMIT_CANDIDATE) || []).some(isCommit);
  for (const file of [...files].filter((f) => f.startsWith('docs/platform/') && f.endsWith('.md')).sort()) {
    const lines = proseOf(readFile(file)).split('\n');
    const dead = [];
    lines.forEach((line, index) => {
      if (pins(line)) return;
      for (const match of line.matchAll(REPO_PATH)) {
        const target = referencedPath(match[1]);
        if (target && !exists(target)) dead.push({ line: index + 1, target });
      }
    });
    if (dead.length === 0) continue;
    const { canonical, kind } = classify(file);
    if (typeof canonical !== 'boolean') throw new Error(`classify returned no canonical flag for ${file}; the Convention host predates the reserved document flags`);
    if (!canonical || PAST_STATE_KINDS.has(kind)) continue;
    for (const { line, target } of dead) {
      findings.push({ type: 'dead-reference', path: file, line, target, message: `backticked path does not exist: ${target}` });
    }
  }
  return { findings, counts: { findings: findings.length } };
}

/** Whether a hex token names a commit of the repository; one git call per distinct token. */
export function gitCommitResolver(repoRoot) {
  const cache = new Map();
  return (token) => {
    if (!cache.has(token)) {
      try { execFileSync('git', ['cat-file', '-e', `${token}^{commit}`], { cwd: repoRoot, stdio: 'ignore' }); cache.set(token, true); }
      catch { cache.set(token, false); }
    }
    return cache.get(token);
  };
}

export function runCli(argv, cwd = process.cwd(), { classify } = {}) {
  const idx = argv.indexOf('--repo-root');
  const repoRoot = path.resolve(cwd, idx >= 0 ? argv[idx + 1] : '.');
  const asJson = argv.includes('--json');
  try {
    const files = platformDocs(repoRoot);
    const readFile = (file) => fs.statSync(path.resolve(repoRoot, file)).isDirectory() ? '' : fs.readFileSync(path.resolve(repoRoot, file), 'utf8');
    const links = checkPlatformLinks({ files, readFile, exists: (file) => fs.existsSync(path.resolve(repoRoot, file)) });
    const classifyDoc = classify || ((file) => invokeHost(['convention', 'classify', '--json', '--', file], { dir: repoRoot, dirScope: 'caller' }));
    const metadata = checkPlatformMetadata({
      files, readFile, baseline: governanceBaselineFields(repoRoot),
      classify: classifyDoc,
    });
    const exists = (file) => fs.existsSync(path.resolve(repoRoot, file));
    const dead = checkDeadReferences({ files, readFile, exists, classify: classifyDoc, isCommit: gitCommitResolver(repoRoot) });
    const findings = [...links.findings, ...metadata.findings, ...dead.findings];
    const counts = { files: files.length, links: links.counts.links, metadataExempt: metadata.counts.exempt, findings: findings.length };
    if (asJson) console.log(JSON.stringify({ counts, findings }));
    else {
      console.log(`doc-health: ${counts.files} platform documents, ${counts.links} local links, ${counts.metadataExempt} metadata-exempt, ${counts.findings} finding(s)`);
      for (const f of findings) console.log(`${f.path}:${f.line}: ${f.message}`);
    }
    return findings.length ? 1 : 0;
  } catch (error) {
    console.error(`doc-health: ${error.message}`);
    return 1;
  }
}

if (isMainModule(import.meta.url)) process.exitCode = runCli(process.argv.slice(2));
