// Typed immutable reads for documentation gates and verifiers. The reproduction
// generators are byte-pinned: their historical readers must not be edited or used
// as the implementation of these migrated callers.
import path from 'node:path';
import { inspectRepo } from './git-ports.mjs';
import { inspectEntries, inspectPath } from '../../src/util/git-paths.mjs';

/** Explicit commit resolution: absent, unborn and non-commit inputs fail closed. */
export function resolveCommitSha(commit, repoRoot = process.cwd()) {
  if (!commit || typeof commit !== 'string' || commit.trim() === '') {
    throw new Error('Explicit commit/treeish is required (fail closed; cannot default to HEAD or working tree)');
  }
  try {
    const sha = inspectRepo(repoRoot).resolveCommit({ name: commit.trim() });
    if (typeof sha !== 'string') throw new Error('commit not found');
    return sha;
  } catch (err) {
    throw new Error(`Explicit commit/treeish "${commit}" must resolve to a valid git commit: ${err.message}`);
  }
}

export function loadCommitTree(commitSha, repoRoot = process.cwd()) {
  const port = inspectRepo(repoRoot);
  const revision = resolveCommitSha(commitSha, repoRoot);
  const entries = inspectEntries((page) => port.listTree({ revision, prefix: '', ...page })).filter((entry) => entry.kind !== 'tree');
  const treeFiles = new Set(entries.map((entry) => inspectPath(entry.path)));
  const treeDirs = new Set();
  for (const file of treeFiles) {
    const parts = file.split('/');
    for (let i = 1; i < parts.length; i++) treeDirs.add(parts.slice(0, i).join('/'));
  }
  return { commitSha, treeFiles, treeDirs };
}

/** Existing 20 MiB text-read contract, independent of checkout bytes. */
export function readBlobAtCommit(commitSha, fileRel, repoRoot = process.cwd()) {
  const port = inspectRepo(repoRoot);
  const revision = resolveCommitSha(commitSha, repoRoot);
  const [result] = port.pathsAtRevision({ revision, paths: [[...Buffer.from(fileRel)]], maxBlobBytes: 20 * 1024 * 1024 });
  if (result?.value.kind !== 'present') throw new Error(`${fileRel}: ${result?.value.cause || result?.value.kind || 'unreadable'} at ${revision}`);
  return Buffer.from(result.value.bytes).toString('utf8');
}

/** Exact blob identity, not a pathspec match or filesystem hash. */
export function blobOidAtCommit(commitSha, fileRel, repoRoot = process.cwd()) {
  const port = inspectRepo(repoRoot);
  const entries = inspectEntries((page) => port.listTree({ revision: commitSha, prefix: fileRel, ...page }));
  const entry = entries.find((entry) => inspectPath(entry.path) === fileRel && entry.kind === 'blob');
  if (!entry) throw new Error(`${fileRel}: blob not found at ${commitSha}`);
  return entry.oid;
}

/** The caller owns the scope; this is the extracted registry-binding diff read. */
export function commitsMatchPaths(before, after, paths, repoRoot = process.cwd()) {
  if (!before || typeof before !== 'string') return false;
  if (before === after) return true;
  try {
    const port = inspectRepo(repoRoot);
    const entries = inspectEntries((page) => port.diff({ before, after, ...page }));
    return !entries.some((entry) => paths.some((root) => {
      const name = inspectPath(entry.path);
      return name === root || name.startsWith(`${root}/`);
    }));
  } catch { return false; }
}

/** Existing blob-map contract, split to Inspect's object-count and byte bounds. */
export function readCommitBlobMap(repoRoot, entries, options = {}) {
  const maxSize = options.maxSize ?? 20 * 1024 * 1024;
  const readable = entries.filter((entry) => entry?.blobSha && Number(entry.size) <= maxSize);
  if (readable.length === 0) return new Map();
  const port = inspectRepo(repoRoot);
  const byPath = new Map();
  for (let start = 0; start < readable.length;) {
    let end = start;
    let bytes = 0;
    // Reserve framing room within the driver's 32 MiB output ceiling.
    while (end < readable.length && end - start < 4096 && bytes + Number(readable[end].size) <= 31 * 1024 * 1024) {
      bytes += Number(readable[end++].size);
    }
    if (end === start) throw new Error(`${readable[start].path}: object exceeds Inspect read bound`);
    const batch = readable.slice(start, end);
    const objects = port.readObjects({ oids: batch.map((entry) => entry.blobSha), maxBytes: 32 * 1024 * 1024 });
    for (const [index, entry] of batch.entries()) {
      const object = objects[index];
      if (object?.kind !== 'present' || object.objectType !== 'blob' || object.bytes.length !== Number(entry.size)) {
        throw new Error(`${entry.path}: missing or mismatched commit blob ${entry.blobSha}`);
      }
      byPath.set(entry.path.split(path.sep).join('/'), Buffer.from(object.bytes));
    }
    start = end;
  }
  return byPath;
}
