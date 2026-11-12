// trust-store.mjs — the ONE door onto an agent CLI's folder-trust store
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
// docs/platform/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-p6/.
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

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readAgentFileSync } from '../native/proof-helpers.mjs';
import { replaceDurably } from '../native/door.mjs';
import { createGitInspect, gitPortOptions } from '../git/inspect.mjs';
import { acquireSync, createLockScope, resolveLockRoot } from '../holder-lock/index.mjs';

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

/** Replace a store's bytes through the durable door (synced file, rename, synced directory), so a reader
 * sees the whole old store or the whole new one. A store reached through a link is written where the link
 * points, so the link stays a link. The store's own permission bits are kept (a 0600 store holding provider
 * credentials stays 0600); one that does not exist yet is created owner-only. */
function writeStore(storePath, body) {
  let target = storePath;
  let mode = 0o600;
  try {
    target = fs.realpathSync(storePath);
    mode = fs.statSync(target).mode & 0o777;
  } catch (err) {
    if (err.code !== 'ENOENT' || fs.lstatSync(storePath, { throwIfNoEntry: false })) {
      throw new TrustStoreError('write-failed', `trust store at "${storePath}" could not be resolved: ${err.message}.`, { storePath });
    }
  }
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    replaceDurably(path.dirname(target), path.basename(target), body, mode);
  } catch (err) {
    throw new TrustStoreError('write-failed', `trust store at "${storePath}" could not be written: ${err.message}.`, { storePath });
  }
}

/** Write the claude store as JSON. */
function writeStoreAtomic(storePath, data) {
  writeStore(storePath, `${JSON.stringify(data, null, 2)}\n`);
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

/** The shape of one `projects[<path>]` entry claude.json's own schema
 * expects -- exported so a caller that must write this file's shape from
 * outside `seedTrust` (worker-home.mjs's private, freshly-created
 * `.claude.json`, which has no existing repoRoot entry to derive B1 trust
 * from) uses the SAME shape rather than a second, independently-drifting
 * copy of it. Returns a fresh object every call: entries are never shared
 * references a caller could mutate into each other. */
export function trustedProjectEntry() {
  return {
    allowedTools: [],
    hasTrustDialogAccepted: true,
    mcpServers: {},
    enabledMcpjsonServers: [],
    disabledMcpjsonServers: [],
    history: [],
  };
}

/**
 * Roots a workspace's trust may be derived from: the repository root the run
 * was started for and, for a linked worktree, the main checkout that owns it
 * (the same repository, and the root codex itself asks about). Never invents
 * a root: each is only a candidate for the "already trusted" check.
 */
export function trustRoots(projectPath, repoRoot) {
  const roots = [repoRoot];
  try {
    const facts = createGitInspect(gitPortOptions(projectPath)).resolveRepo();
    // The checkout that owns the common `.git`; a bare repository has none.
    if (!facts.notARepository && path.basename(facts.commonDir) === '.git') roots.push(path.dirname(facts.commonDir));
  } catch { /* not a checkout: only the declared root is a candidate */ }
  return [...new Set(roots)];
}

// A project file the agent can write (`.mcp.json`, `.codex/hooks.json`) is read through the agent-file door: no link
// followed, no blocking on a pipe, a bounded regular file.
const MAX_PROJECT_FILE_BYTES = 1024 * 1024;

/**
 * Per-process approval of the MCP servers a project declares in its own `.mcp.json`, as extra
 * claude arguments. claude asks a person to approve each such server before it starts, which
 * stops an unattended worker at a dialog. The approval is derived, never invented: only where the
 * repo root is already trusted in the account store, only for the servers the file names, and
 * only for this one process (`--settings`), so no shared file is written. Returns `[]` when there
 * is nothing to approve or the root is not trusted.
 */
export function claudeMcpApprovalArgs({ cwd, repoRoot, storePath }) {
  let names;
  try {
    const declared = JSON.parse(readAgentFileSync(path.join(cwd, '.mcp.json'), MAX_PROJECT_FILE_BYTES).toString('utf8'))?.mcpServers;
    names = declared && typeof declared === 'object' ? Object.keys(declared) : [];
    // A linked worktree is trusted through the main checkout that owns it, as for folder trust.
    if (names.length === 0 || !trustRoots(path.resolve(cwd), repoRoot).some((root) => readTrust(storePath, root) === true)) return [];
  } catch {
    return [];
  }
  return ['--settings', JSON.stringify({ enabledMcpjsonServers: names })];
}

// How often a seed writes its entry before it gives up on it staying: claude rewrites its own store while
// it runs, so an entry can be lost between the write and the read-back.
const SEED_TRIES = 3;
const SEED_LOCK_WAIT_MS = 30_000;

/**
 * Record trust for `projectPath`, derived from an already-trusted `repoRoot`, and read it back before
 * returning: an entry lost in between (another writer of the store saved what it had read earlier) is
 * added again, at most SEED_TRIES times, then `trust-not-kept`. Add-only: fgOS never removes an entry
 * from this store, which claude itself rewrites while it runs, so a removal could drop what it saved.
 * fgOS's own seeds of the store take the machine's `agent-trust-store` lock, one at a time.
 *
 * Refuses, without writing anything, when:
 * - `projectPath` is not absolute (`invalid-path`) — a relative key would name a
 *   different directory depending on who reads it;
 * - `repoRoot` is absent from the store or not trusted (`untrusted-root`) — this
 *   is B1, the rule the whole module exists for;
 * - the store is missing, unparseable, or shaped unexpectedly.
 *
 * Returns whether this call wrote the entry; seeding an already-seeded path rewrites nothing.
 */
export function seedTrust(storePath, { projectPath, repoRoot } = {}) {
  if (typeof projectPath !== 'string' || !path.isAbsolute(projectPath)) {
    throw new TrustStoreError('invalid-path', `trust seed refused: projectPath must be an absolute path, got "${projectPath}".`, { projectPath });
  }
  if (typeof repoRoot !== 'string' || !path.isAbsolute(repoRoot)) {
    throw new TrustStoreError('invalid-path', `trust seed refused: repoRoot must be an absolute path, got "${repoRoot}".`, { repoRoot });
  }
  let lock;
  try {
    lock = acquireSync(createLockScope('agent-trust-store'), 'agent-trust-store', { lockRoot: resolveLockRoot() }, { waitMs: SEED_LOCK_WAIT_MS });
  } catch (err) {
    throw new TrustStoreError('store-busy', `trust seed for "${projectPath}" could not take the trust-store lock: ${err.message}.`, { projectPath });
  }
  if (lock.result !== 'acquired') {
    throw new TrustStoreError('store-busy', `trust seed for "${projectPath}" waited ${SEED_LOCK_WAIT_MS}ms for the trust-store lock (${lock.result}).`, { projectPath });
  }
  try {
    let wrote = false;
    for (let attempt = 0; attempt <= SEED_TRIES; attempt += 1) {
      const store = readStore(storePath);
      const projects = projectsOf(store, storePath);
      if (projects[repoRoot]?.hasTrustDialogAccepted !== true) {
        throw new TrustStoreError(
          'untrusted-root',
          `trust seed refused for "${projectPath}": its repo root "${repoRoot}" is not itself trusted, so there is nothing to derive trust from.`,
          { projectPath, repoRoot },
        );
      }
      if (projects[projectPath]?.hasTrustDialogAccepted === true) return wrote;
      if (attempt === SEED_TRIES) break;
      projects[projectPath] = trustedProjectEntry();
      writeStoreAtomic(storePath, store);
      wrote = true;
    }
    throw new TrustStoreError('trust-not-kept', `trust entry for "${projectPath}" was lost from "${storePath}" after ${SEED_TRIES} writes.`, { projectPath, storePath });
  } finally {
    lock.handle.release();
  }
}

/**
 * The config of a confined claude pane, in its private config directory (`$CLAUDE_CONFIG_DIR/.claude.json`).
 * claude reads its first-run state and folder trust from there and not from the operator's `~/.claude.json`,
 * and the directory starts with only the login, so without these entries the pane stops at its onboarding
 * wizard. Trust is derived as in `seedTrust`: only for a `repoRoot` the person already trusts in
 * `rootStorePath` (the operator's own store, never edited). The file is created owner-only when absent, and an
 * existing one keeps every key it has. It is private to one attempt, so no lock is taken.
 *
 * Returns whether this call wrote anything.
 */
export function seedClaudeConfigTrust(configPath, { projectPath, repoRoot, rootStorePath } = {}) {
  if (typeof projectPath !== 'string' || !path.isAbsolute(projectPath)) {
    throw new TrustStoreError('invalid-path', `trust seed refused: projectPath must be an absolute path, got "${projectPath}".`, { projectPath });
  }
  if (readTrust(rootStorePath, repoRoot) !== true) {
    throw new TrustStoreError(
      'untrusted-root',
      `trust seed refused for "${projectPath}": its repo root "${repoRoot}" is not trusted in "${rootStorePath}", so there is nothing to derive trust from.`,
      { projectPath, repoRoot },
    );
  }
  const config = fs.existsSync(configPath) ? readStore(configPath) : {};
  const projects = config.projects === undefined ? {} : projectsOf(config, configPath);
  if (config.hasCompletedOnboarding === true && projects[projectPath]?.hasTrustDialogAccepted === true) return false;
  writeStoreAtomic(configPath, {
    ...config,
    hasCompletedOnboarding: true,
    theme: typeof config.theme === 'string' ? config.theme : 'dark',
    projects: { ...projects, [projectPath]: projects[projectPath]?.hasTrustDialogAccepted === true ? projects[projectPath] : trustedProjectEntry() },
  });
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
  const section = codexSectionRange(body, projectPath);
  if (!section) return null;
  return /trust_level\s*=\s*"trusted"/.test(body.slice(section.start, section.end));
}

/** A TOML basic string: JSON string escapes (quote, backslash, control characters) are valid TOML
 * escapes; DEL is the one extra character TOML requires escaped. */
function tomlBasicString(value) {
  return JSON.stringify(value).replace(/\x7f/g, '\\u007f');
}

const codexProjectHeader = (projectPath) => `[projects.${tomlBasicString(projectPath)}]`;

/** Where the `[projects."<path>"]` table of one path sits in `body`: from its header line up to the next
 * line that starts a table header, or the end of the file. A `[` inside a value (an array) does not end
 * it. `null` when the path has no table. */
function codexSectionRange(body, projectPath) {
  const header = codexProjectHeader(projectPath);
  let start = -1;
  let offset = 0;
  for (const line of body.split(/(?<=\n)/)) {
    const opensTable = /^[ \t]*\[/.test(line);
    if (start >= 0 && opensTable) return { start, end: offset };
    if (start < 0 && opensTable && line.trim().startsWith(header)) start = offset;
    offset += line.length;
  }
  return start >= 0 ? { start, end: offset } : null;
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
export function seedCodexTrust(configPath, { projectPath, repoRoot, rootConfigPath } = {}) {
  if (typeof projectPath !== 'string' || !path.isAbsolute(projectPath)) {
    throw new TrustStoreError('invalid-path', `seedCodexTrust: projectPath must be absolute, got "${projectPath}".`);
  }
  if (typeof repoRoot !== 'string' || !path.isAbsolute(repoRoot)) {
    throw new TrustStoreError('invalid-path', `seedCodexTrust: repoRoot must be absolute, got "${repoRoot}".`);
  }
  // `rootConfigPath` is the account's own config, where a person made the trust
  // decision this derives from. `configPath` is where the entry is written; it
  // differs only for a confined worker, whose private CODEX_HOME starts without
  // any config.toml, so the entry is written (and the file created) there while
  // the root is still vouched for by the real account config.
  const rootStore = rootConfigPath ?? configPath;
  if (readCodexTrust(configPath, projectPath) === true) return false;
  if (readCodexTrust(rootStore, repoRoot) !== true) {
    throw new TrustStoreError(
      'untrusted-root',
      `codex trust seed refused for "${projectPath}": its repo root "${repoRoot}" is not itself trusted in ${rootStore}, so there is nothing to derive trust from.`,
      { projectPath, repoRoot, configPath: rootStore },
    );
  }
  let body;
  try {
    body = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT' || rootStore === configPath) {
      throw new TrustStoreError('unreadable-store', `could not read codex config at ${configPath}: ${err.message}`, { configPath });
    }
    body = '';
  }
  const entry = `\n${codexProjectHeader(projectPath)}\ntrust_level = "trusted"\n`;
  writeStore(configPath, `${body.replace(/\n*$/, '\n')}${entry}`);
  return true;
}

/** Drop one workspace's codex trust entry. Returns whether anything was there; throws a TrustStoreError
 * when the config cannot be read or written, so a failed removal is never mistaken for an absent entry. */
export function removeCodexTrust(configPath, projectPath) {
  if (readCodexTrust(configPath, projectPath) === null) return false;
  let body;
  try {
    body = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    throw new TrustStoreError('unreadable-store', `could not read codex config at ${configPath}: ${err.message}`, { configPath });
  }
  const section = codexSectionRange(body, projectPath);
  writeStore(configPath, `${body.slice(0, section.start)}${body.slice(section.end)}`);
  return true;
}

// ---------------------------------------------------------------------------
// codex hook trust: the same policy, one level down.
//
// Folder trust does not cover hooks. codex records trust for each hook of a
// project's `.codex/hooks.json` as `[hooks.state."<abs hooks.json>:<event>:<group>:<handler>"]
// trusted_hash = "sha256:..."` and asks for review at startup while the stored hash differs from
// the hook's current one. A confined worker's private CODEX_HOME starts empty, so every round
// would stop at that review. The hash is sha256 of the key-sorted JSON of
// `{event_name, matcher?, hooks:[{type, command, timeout, async, statusMessage?}]}` (openai/codex
// codex-rs/hooks/src/engine/discovery.rs + config/src/fingerprint.rs). A wrong hash only brings
// the review back; codex never trusts on a mismatch.
//
// Same B1 rule as folder trust: seeded only where the project's root is already trusted by a
// person, and only for the hooks currently in the file -- the decision the person would make by
// pressing "trust".

const DEFAULT_HOOK_TIMEOUT_SEC = 600;

// Codex's own key order, not RFC 8785: the trust hash must match what codex computes, so this is not the door's canonicalJson.
function sortedJson(value) {
  if (Array.isArray(value)) return value.map(sortedJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortedJson(value[key])]));
  }
  return value;
}

/** The trust hash codex computes for one command hook. */
export function codexHookTrustHash(eventName, matcher, handler) {
  const hook = { type: 'command', command: handler.command, timeout: handler.timeout ?? DEFAULT_HOOK_TIMEOUT_SEC, async: handler.async === true };
  if (typeof handler.statusMessage === 'string') hook.statusMessage = handler.statusMessage;
  const identity = { event_name: eventName, hooks: [hook] };
  if (typeof matcher === 'string') identity.matcher = matcher;
  return `sha256:${createHash('sha256').update(JSON.stringify(sortedJson(identity))).digest('hex')}`;
}

/** Hook entries of a hooks.json as `{ key, hash }`, plus how many handlers could not be hashed
 * faithfully (other handler types, fields whose normalisation is not reproduced here). */
export function codexHookTrustEntries(hooksJsonPath) {
  let parsed;
  try {
    parsed = JSON.parse(readAgentFileSync(hooksJsonPath, MAX_PROJECT_FILE_BYTES).toString('utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return { entries: [], skipped: 0 };
    throw new TrustStoreError('unreadable-store', `could not read codex hooks at ${hooksJsonPath}: ${err.message}`, { hooksJsonPath });
  }
  const entries = [];
  let skipped = 0;
  for (const [event, groups] of Object.entries(parsed?.hooks ?? {})) {
    const eventName = event.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
    (Array.isArray(groups) ? groups : []).forEach((group, groupIndex) => {
      (Array.isArray(group?.hooks) ? group.hooks : []).forEach((handler, handlerIndex) => {
        const hashable = eventName !== 'session_end' && handler?.type === 'command' && typeof handler.command === 'string'
          && handler.additionalContextLimit === undefined && handler.commandWindows === undefined && handler.command_windows === undefined;
        if (!hashable) { skipped += 1; return; }
        entries.push({
          key: `${hooksJsonPath}:${eventName}:${groupIndex}:${handlerIndex}`,
          hash: codexHookTrustHash(eventName, group.matcher, handler),
        });
      });
    });
  }
  return { entries, skipped };
}

function codexHookHeader(key) {
  return `[hooks.state.${tomlBasicString(key)}]`;
}

/**
 * Trust the project's codex hooks in `configPath`, which must be a worker's PRIVATE config: it is
 * created by fgOS and deleted with the home, so nothing here is ever removed again and the
 * operator's own config is never edited. Idempotent: a key already present (at any indentation)
 * is left as it is. Returns `{ keys, skipped }`.
 */
export function seedCodexHookTrust(configPath, { projectPath, repoRoot, rootConfigPath } = {}) {
  if (typeof projectPath !== 'string' || !path.isAbsolute(projectPath)) {
    throw new TrustStoreError('invalid-path', `seedCodexHookTrust: projectPath must be absolute, got "${projectPath}".`);
  }
  const { entries, skipped } = codexHookTrustEntries(path.join(projectPath, '.codex', 'hooks.json'));
  if (entries.length === 0) return { keys: [], skipped };
  const rootStore = rootConfigPath ?? configPath;
  if (readCodexTrust(rootStore, repoRoot) !== true) {
    throw new TrustStoreError(
      'untrusted-root',
      `codex hook trust seed refused for "${projectPath}": its repo root "${repoRoot}" is not itself trusted in ${rootStore}.`,
      { projectPath, repoRoot, configPath: rootStore },
    );
  }
  let body = '';
  try {
    body = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw new TrustStoreError('unreadable-store', `could not read codex config at ${configPath}: ${err.message}`, { configPath });
  }
  // A key already present in any TOML form (standard table, dotted, single-quoted) is left alone:
  // appending a second table would make codex refuse the whole config.
  const fresh = entries.filter(({ key }) => !body.includes(codexHookHeader(key)) && !body.includes(key));
  if (fresh.length === 0) return { keys: [], skipped };
  const sections = fresh.map(({ key, hash }) => `\n${codexHookHeader(key)}\ntrusted_hash = "${hash}"\n`).join('');
  writeStore(configPath, `${body.replace(/\n*$/, '\n')}${sections}`);
  return { keys: fresh.map(({ key }) => key), skipped };
}

// ---------------------------------------------------------------------------
// The same policy, a third format: agy (Antigravity CLI).
//
// agy records trusted workspaces in `~/.gemini/antigravity-cli/settings.json`
// (or under the directory pointed to by $HOME) in a `trustedWorkspaces` string
// array of absolute paths. When agy launches in an untrusted directory (e.g. a
// fresh worktree), it shows a blocking folder-trust dialog that causes herdr
// to report `agent_not_ready`.
//
// Same B1 rule as the other two formats: trust is derived from a repoRoot
// already trusted, never invented, and a store this module cannot make sense
// of is refused rather than quietly treated as empty -- the same "unreadable
// beats fabricated" choice `readStore` makes for the JSON store above.

/** Where agy keeps its trust store under a given HOME. `homeDir` must be the
 * HOME the agy PROCESS itself will run under, never the operator's own --
 * an agy executor is declared with its own private HOME (typically
 * `~/.agy-homes/<name>`, resolved from the executor's own env), and seeding
 * `~/.gemini/...` under the wrong HOME leaves agy's own dialog exactly where
 * it was. */
export function defaultAgySettingsPath(homeDir = os.homedir()) {
  return path.join(homeDir, '.gemini', 'antigravity-cli', 'settings.json');
}

function matchesPath(entry, target) {
  if (typeof entry !== 'string' || typeof target !== 'string') return false;
  if (entry === target) return true;
  const entryNorm = path.normalize(entry);
  const targetNorm = path.normalize(target);
  if (entryNorm === targetNorm) return true;
  const entryResolved = path.resolve(entry);
  const targetResolved = path.resolve(target);
  if (entryResolved === targetResolved) return true;
  if (process.platform === 'win32') {
    if (entryNorm.toLowerCase() === targetNorm.toLowerCase()) return true;
    if (entryResolved.toLowerCase() === targetResolved.toLowerCase()) return true;
  }
  return false;
}

/** Read agy's settings.json to check whether a path is trusted. */
export function readAgyTrust(settingsPath, projectPath) {
  try {
    if (typeof settingsPath !== 'string' || typeof projectPath !== 'string') return null;
    if (!fs.existsSync(settingsPath)) return null;
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const store = JSON.parse(raw);
    if (!Array.isArray(store?.trustedWorkspaces)) return null;
    return store.trustedWorkspaces.some((entry) => matchesPath(entry, projectPath));
  } catch {
    return null;
  }
}

/** Read agy's settings.json, refusing (never inventing `{}`) when the file
 * exists but cannot be understood. A missing file is a different case: agy
 * was simply never seeded here, so an empty `trustedWorkspaces` is correct,
 * not a fabrication. */
export function readAgyStore(settingsPath) {
  if (!fs.existsSync(settingsPath)) return {};
  let raw;
  try {
    raw = fs.readFileSync(settingsPath, 'utf8');
  } catch (err) {
    throw new TrustStoreError('unreadable-store', `agy trust store at "${settingsPath}" could not be read: ${err.message}.`, { settingsPath });
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new TrustStoreError('unreadable-store', `agy trust store at "${settingsPath}" is not valid JSON: ${err.message}.`, { settingsPath });
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new TrustStoreError('schema-drift', `agy trust store at "${settingsPath}" is not a JSON object -- its shape changed and this module must not guess.`, { settingsPath });
  }
  return parsed;
}

/**
 * Trust one workspace for agy, deriving that trust from a root agy already
 * trusts -- the same B1 rule the other two formats enforce, for the same
 * reason: fgOS may propagate a trust decision a person already made, never
 * invent one for a root nobody vouched for.
 *
 * Refuses, without writing anything, when:
 * - `projectPath`/`repoRoot` is not absolute (`invalid-path`);
 * - `repoRoot` is not itself in `trustedWorkspaces` (`untrusted-root`) --
 *   this includes a settings.json that does not exist yet, since nothing is
 *   trusted there at all;
 * - the store exists but is unreadable or shaped unexpectedly.
 *
 * Idempotent: seeding an already-seeded path rewrites nothing.
 */
export function seedAgyTrust(settingsPath, { projectPath, repoRoot, rootSettingsPath } = {}) {
  if (typeof settingsPath !== 'string' || !settingsPath.trim()) {
    throw new TrustStoreError('invalid-path', `agy trust seed refused: settingsPath must be a non-empty string, got "${settingsPath}".`);
  }
  if (typeof projectPath !== 'string' || !path.isAbsolute(projectPath)) {
    throw new TrustStoreError('invalid-path', `agy trust seed refused: projectPath must be an absolute path, got "${projectPath}".`, { projectPath });
  }
  if (typeof repoRoot !== 'string' || !path.isAbsolute(repoRoot)) {
    throw new TrustStoreError('invalid-path', `agy trust seed refused: repoRoot must be an absolute path, got "${repoRoot}".`, { repoRoot });
  }

  const store = readAgyStore(settingsPath);
  const trustedList = Array.isArray(store.trustedWorkspaces) ? store.trustedWorkspaces : [];

  // `rootSettingsPath`: the account's own settings, where a person trusted the
  // root. It differs from `settingsPath` only for a confined worker's private HOME.
  const rootStore = rootSettingsPath ?? settingsPath;
  const rootData = rootStore === settingsPath ? store : readAgyStore(rootStore);
  const rootList = Array.isArray(rootData.trustedWorkspaces) ? rootData.trustedWorkspaces : [];
  if (!rootList.some((entry) => matchesPath(entry, repoRoot))) {
    throw new TrustStoreError(
      'untrusted-root',
      `agy trust seed refused for "${projectPath}": its repo root "${repoRoot}" is not itself trusted in ${rootStore}, so there is nothing to derive trust from.`,
      { projectPath, repoRoot, settingsPath: rootStore },
    );
  }

  if (trustedList.some((entry) => matchesPath(entry, projectPath))) return false; // already seeded

  store.trustedWorkspaces = [...trustedList, projectPath];
  writeStore(settingsPath, `${JSON.stringify(store, null, 2)}\n`);
  return true;
}

/** Drop one workspace's agy trust entry. Returns whether anything was there; throws a TrustStoreError when
 * the settings cannot be read or written, so a failed removal is never mistaken for an absent entry. */
export function removeAgyTrust(settingsPath, projectPath) {
  if (typeof settingsPath !== 'string' || typeof projectPath !== 'string') return false;
  const store = readAgyStore(settingsPath);
  if (!Array.isArray(store.trustedWorkspaces)) return false;
  const idx = store.trustedWorkspaces.findIndex((entry) => matchesPath(entry, projectPath));
  if (idx === -1) return false;
  store.trustedWorkspaces.splice(idx, 1);
  writeStore(settingsPath, `${JSON.stringify(store, null, 2)}\n`);
  return true;
}
