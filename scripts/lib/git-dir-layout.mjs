// git-dir-layout.mjs -- which repository a directory belongs to, and the identity keys its config
// files hold, read from the files Git lays out (a `.git` directory, or a `.git` file naming a linked
// checkout's gitdir and its `commondir`); which files it holds, read through a caller's Inspect port.
// The test launcher and its config guard only need these facts about the checkout running the suite,
// so they start no `git` child (Git spec §12: every Git child outside the fgos-git driver is a writer
// to the one-door gate).

import fs from 'node:fs';
import path from 'node:path';

const real = (p) => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };

/** `{ gitDir, commonDir }` of the repository `start` sits in, or null outside one. */
export function repositoryDirs(start) {
  for (let dir = path.resolve(start); ; dir = path.dirname(dir)) {
    const dotGit = path.join(dir, '.git');
    let stat = null;
    try { stat = fs.statSync(dotGit); } catch { /* keep walking up */ }
    if (stat?.isDirectory()) return { gitDir: real(dotGit), commonDir: real(dotGit) };
    if (stat?.isFile()) {
      const named = /^gitdir:\s*(.+?)\s*$/m.exec(fs.readFileSync(dotGit, 'utf8'))?.[1];
      if (!named) return null;
      const gitDir = real(path.resolve(dir, named));
      let common = gitDir;
      try { common = real(path.resolve(gitDir, fs.readFileSync(path.join(gitDir, 'commondir'), 'utf8').trim())); } catch { /* a main gitdir */ }
      return { gitDir, commonDir: common };
    }
    if (path.dirname(dir) === dir) return null;
  }
}

/** `section.key value` lines of one config file whose full key matches `pattern`, in file order. */
export function configEntries(file, pattern) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return []; }
  const out = [];
  let section = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    const head = /^\[\s*([\w.-]+)(?:\s+"((?:\\.|[^"\\])*)")?\s*\]/.exec(line);
    if (head) { section = head[2] === undefined ? head[1].toLowerCase() : `${head[1].toLowerCase()}.${head[2]}`; continue; }
    const kv = /^([A-Za-z][\w-]*)\s*(?:=\s*(.*))?$/.exec(line);
    if (!section || !kv) continue;
    let value = kv[2] === undefined ? 'true' : kv[2].replace(/\s+[#;].*$/, '');
    value = value.replace(/^"(.*)"$/, '$1').replace(/\\(["\\])/g, '$1');
    const key = `${section}.${kv[1].toLowerCase()}`;
    if (pattern.test(key)) out.push(`${key} ${value}`);
  }
  return out;
}

/** Tracked and untracked non-ignored paths under `repoRoot`, relative to it, read through the Inspect
 * port `inspect` (src/git/inspect.mjs); null outside a repository. A failed read throws: the source
 * set is never guessed. */
export function repositoryFiles(repoRoot, inspect) {
  const facts = inspect.resolveRepo();
  if (facts.notARepository) return null;
  const top = fs.realpathSync(facts.worktreeRoot);
  const prefix = path.relative(top, fs.realpathSync(repoRoot)).replaceAll('\\', '/');
  const under = (rel) => (prefix === '' ? rel : rel.startsWith(`${prefix}/`) ? rel.slice(prefix.length + 1) : null);
  const files = new Set();
  const add = (bytes) => { const rel = under(Buffer.from(bytes).toString('utf8')); if (rel) files.add(rel); };
  let cursor;
  do {
    const page = inspect.trackedPaths({ maxEntries: 4096, cursor });
    page.entries.forEach(add);
    cursor = page.nextCursor;
  } while (cursor);
  do {
    const page = inspect.status({ untracked: 'all', maxEntries: 4096, cursor });
    for (const entry of page.entries) if (entry.untracked) add(entry.path);
    cursor = page.nextCursor;
  } while (cursor);
  return files;
}
