// dispatch/trust-store.mjs — the ONE door onto an agent CLI's folder-trust store
// (Phase 01 group B of plans/260906-1831-dispatch-visibility-v0).
//
// WHY THIS EXISTS. An agent CLI records which directories a human has vouched
// for. claude keeps that in `~/.claude.json` under
// `projects[<absolute path>].hasTrustDialogAccepted`, keyed by EXACT path, not by
// prefix. Every fgOS dispatch runs in a fresh worktree, which is therefore a path
// the CLI has never seen: it opens a folder-trust dialog and the dispatch stops
// before doing anything at all. Measured 2026-09-06, with zero worktree paths
// present among the operator's own 145 entries — interactive dispatch into a
// worktree had never once worked. Evidence:
// docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-p6/.
//
// WHY IT IS A SEPARATE MODULE. Writing into a file another tool owns is exactly
// the kind of thing that should happen in one place, with one set of rules, so
// that "did fgOS vouch for a directory nobody vouched for?" has a single answer
// a reader can check. Nothing else in fgOS may open that file.
//
// THE RULE IT ENFORCES (B1). Trust is DERIVED, never invented: an entry is only
// written for a path whose repo root is ALREADY trusted by the human. fgOS
// vouching for a checkout of a repo the operator already vouched for is a
// derivation; fgOS vouching for an arbitrary directory would be fabrication.
//
// WHAT IT DELIBERATELY DOES NOT CLAIM TO ENFORCE. That the caller only passes
// paths fgOS itself created this dispatch. This module cannot verify that — a
// worktree may legitimately live anywhere, including outside the repo root
// (measured: the probes used /var/tmp). It is the caller's obligation, stated
// here rather than dressed up as a check that does nothing.

import fs from 'node:fs';
import path from 'node:path';

/** Raised for every refusal and every failure. Carries a `code` so a caller can
 * branch on the reason without matching message text. */
export class TrustStoreError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'TrustStoreError';
    this.code = code;
    Object.assign(this, details);
  }
}

/** Read and parse the store, refusing loudly rather than inventing an empty one.
 * A missing file and an unparseable file are DIFFERENT failures: the first means
 * the CLI was never set up here, the second means something is wrong that a
 * silent overwrite would destroy. */
function readStore(storePath) {
  let raw;
  try {
    raw = fs.readFileSync(storePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new TrustStoreError('missing-store', `trust store not found at "${storePath}".`, { storePath });
    }
    throw new TrustStoreError('unreadable-store', `trust store at "${storePath}" could not be read: ${err.message}.`, { storePath });
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Never fall back to `{}` here. That would turn a corrupt-or-mid-edit file
    // into an empty one on the next write, discarding every entry the operator
    // has.
    throw new TrustStoreError('unreadable-store', `trust store at "${storePath}" is not valid JSON: ${err.message}.`, { storePath });
  }
}

/** Write the store atomically: a temp file in the SAME directory (so the rename
 * cannot cross a filesystem boundary and degrade into a copy), then rename over
 * the target. A reader therefore sees either the whole old file or the whole new
 * one, never a half-written store. The temp file is removed on any failure so a
 * crash leaves no residue beside the operator's own config. */
function writeStoreAtomic(storePath, data) {
  const dir = path.dirname(storePath);
  const tmp = path.join(dir, `.${path.basename(storePath)}.fgos-${process.pid}-${Date.now()}.tmp`);
  try {
    fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
    fs.renameSync(tmp, storePath);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch {}
    throw new TrustStoreError('write-failed', `trust store at "${storePath}" could not be written: ${err.message}.`, { storePath });
  }
}

/** The `projects` map, or a typed schema-drift refusal. The shape is another
 * tool's, so it can change under us; when it does we want a named failure at the
 * door rather than a write that quietly lands somewhere meaningless. */
function projectsOf(store, storePath) {
  const projects = store.projects;
  if (!projects || typeof projects !== 'object' || Array.isArray(projects)) {
    throw new TrustStoreError(
      'schema-drift',
      `trust store at "${storePath}" has no usable "projects" object -- the store's shape changed and this module must not guess.`,
      { storePath },
    );
  }
  return projects;
}

/**
 * Trust state for one path: `true`, `false`, or `null` when the path is absent.
 *
 * The three-way answer is deliberate. "Absent" and "explicitly not trusted" look
 * the same to a boolean and mean different things: the first is a directory the
 * human has never been asked about, the second is one they declined.
 */
export function readTrust(storePath, projectPath) {
  const store = readStore(storePath);
  const projects = projectsOf(store, storePath);
  const entry = projects[projectPath];
  if (entry === undefined) return null;
  return entry?.hasTrustDialogAccepted === true;
}

/**
 * Record trust for `projectPath`, derived from an already-trusted `repoRoot`.
 *
 * Refuses, without writing anything, when:
 * - `projectPath` is not absolute (`invalid-path`) — a relative key would name a
 *   different directory depending on who reads it;
 * - `repoRoot` is absent from the store or not trusted (`untrusted-root`) — this
 *   is B1, the rule the whole module exists for;
 * - the store is missing, unparseable, or shaped unexpectedly.
 *
 * Idempotent: seeding an already-seeded path rewrites nothing.
 */
export function seedTrust(storePath, { projectPath, repoRoot } = {}) {
  if (typeof projectPath !== 'string' || !path.isAbsolute(projectPath)) {
    throw new TrustStoreError('invalid-path', `trust seed refused: projectPath must be an absolute path, got "${projectPath}".`, { projectPath });
  }
  if (typeof repoRoot !== 'string' || !path.isAbsolute(repoRoot)) {
    throw new TrustStoreError('invalid-path', `trust seed refused: repoRoot must be an absolute path, got "${repoRoot}".`, { repoRoot });
  }

  const store = readStore(storePath);
  const projects = projectsOf(store, storePath);

  if (projects[repoRoot]?.hasTrustDialogAccepted !== true) {
    throw new TrustStoreError(
      'untrusted-root',
      `trust seed refused for "${projectPath}": its repo root "${repoRoot}" is not itself trusted, so there is nothing to derive trust from.`,
      { projectPath, repoRoot },
    );
  }

  if (projects[projectPath]?.hasTrustDialogAccepted === true) return false; // already seeded

  projects[projectPath] = {
    allowedTools: [],
    hasTrustDialogAccepted: true,
    mcpServers: {},
    enabledMcpjsonServers: [],
    disabledMcpjsonServers: [],
    history: [],
  };
  writeStoreAtomic(storePath, store);
  return true;
}

/**
 * Remove one entry. Returns whether there was one to remove.
 *
 * This is the other half of B3, and it is not optional housekeeping: without it
 * the store grows one entry per dispatch forever. Removing an absent entry is a
 * `false` return, never an error, so a teardown path can run unconditionally.
 */
export function removeTrust(storePath, projectPath) {
  const store = readStore(storePath);
  const projects = projectsOf(store, storePath);
  if (projects[projectPath] === undefined) return false;
  delete projects[projectPath];
  writeStoreAtomic(storePath, store);
  return true;
}

// ---------------------------------------------------------------------------
// The same policy, a second format.
//
// codex asks the identical question at startup -- "do you trust the contents of
// this directory?" -- and blocks on it exactly the way claude does. herdr reports
// that as `agent_not_ready`: "blocked during startup and is not ready for
// prompts". Measured, and measured again after trying the cheaper ways out:
// neither `-c projects."<path>".trust_level=trusted` as an invocation override
// nor any of codex's `--dangerously-bypass-*` flags clears it. Only a persisted
// entry does.
//
// It lives here rather than in a module of its own because the POLICY is the
// same and must not drift: trust is only ever derived from a root that is
// already trusted, keyed by exact path, written atomically. Only the file format
// differs. Two files would be two chances for those rules to disagree.
//
// Where codex keeps that file is DECLARED by the executor, never guessed. A
// shell alias may point `CODEX_HOME` somewhere other than ~/.codex -- on this
// machine it does -- and a dispatch process cannot see a shell alias. Seeding
// the wrong file leaves the dialog exactly where it was, with nothing to show
// for it.

/** Read codex's config.toml far enough to answer one question: is this exact
 * path trusted? Deliberately not a TOML parser -- it looks for the one section
 * shape codex writes, and says `null` when it cannot tell. */
export function readCodexTrust(configPath, projectPath) {
  if (typeof projectPath !== 'string' || !path.isAbsolute(projectPath)) {
    throw new TrustStoreError('invalid-path', `readCodexTrust: projectPath must be absolute, got "${projectPath}".`);
  }
  let body;
  try {
    body = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw new TrustStoreError('unreadable-store', `could not read codex config at ${configPath}: ${err.message}`, { configPath });
  }
  const section = codexSectionPattern(projectPath);
  const match = body.match(section);
  if (!match) return null;
  return /trust_level\s*=\s*"trusted"/.test(match[0]);
}

/** The `[projects."<path>"]` block for one path, up to the next section header
 * or end of file. The path is embedded literally, so it is escaped for regex
 * rather than interpolated raw. */
function codexSectionPattern(projectPath) {
  const escaped = projectPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\[projects\\."${escaped}"\\][^\\[]*`, 'm');
}

/**
 * Trust one workspace for codex, deriving that trust from a root codex already
 * trusts -- the same B1 rule the JSON store enforces, for the same reason:
 * fgOS may propagate a trust decision a person already made, never invent one.
 *
 * Append-only and idempotent. An existing entry for the same path is left
 * exactly as it is rather than rewritten, so this can never downgrade a
 * decision or reformat a file somebody else maintains.
 */
export function seedCodexTrust(configPath, { projectPath, repoRoot } = {}) {
  if (typeof projectPath !== 'string' || !path.isAbsolute(projectPath)) {
    throw new TrustStoreError('invalid-path', `seedCodexTrust: projectPath must be absolute, got "${projectPath}".`);
  }
  if (typeof repoRoot !== 'string' || !path.isAbsolute(repoRoot)) {
    throw new TrustStoreError('invalid-path', `seedCodexTrust: repoRoot must be absolute, got "${repoRoot}".`);
  }
  if (readCodexTrust(configPath, projectPath) === true) return false;
  if (readCodexTrust(configPath, repoRoot) !== true) {
    throw new TrustStoreError(
      'untrusted-root',
      `codex trust seed refused for "${projectPath}": its repo root "${repoRoot}" is not itself trusted in ${configPath}, so there is nothing to derive trust from.`,
      { projectPath, repoRoot, configPath },
    );
  }
  let body;
  try {
    body = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    throw new TrustStoreError('unreadable-store', `could not read codex config at ${configPath}: ${err.message}`, { configPath });
  }
  const entry = `\n[projects."${projectPath}"]\ntrust_level = "trusted"\n`;
  const tmp = `${configPath}.tmp-${process.pid}-${Date.now().toString(36)}`;
  try {
    fs.writeFileSync(tmp, `${body.replace(/\n*$/, '\n')}${entry}`);
    fs.renameSync(tmp, configPath);
  } catch (err) {
    try { fs.rmSync(tmp, { force: true }); } catch { /* the temp file is not worth a second failure */ }
    throw new TrustStoreError('write-failed', `could not write codex config at ${configPath}: ${err.message}`, { configPath });
  }
  return true;
}

/** Drop one workspace's codex trust entry. Returns whether anything was there. */
export function removeCodexTrust(configPath, projectPath) {
  if (readCodexTrust(configPath, projectPath) === null) return false;
  let body;
  try {
    body = fs.readFileSync(configPath, 'utf8');
  } catch {
    return false;
  }
  const next = body.replace(codexSectionPattern(projectPath), '');
  const tmp = `${configPath}.tmp-${process.pid}-${Date.now().toString(36)}`;
  try {
    fs.writeFileSync(tmp, next);
    fs.renameSync(tmp, configPath);
  } catch (err) {
    try { fs.rmSync(tmp, { force: true }); } catch { /* nothing further to do */ }
    throw new TrustStoreError('write-failed', `could not write codex config at ${configPath}: ${err.message}`, { configPath });
  }
  return true;
}
