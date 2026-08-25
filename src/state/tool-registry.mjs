// tool-registry.mjs — pure validation/classification logic for the tool
// registry (tsk-1dj, ported from repository-harness's tool-registry-
// capability per docs/distillery/deep-dives/tool-registry.md).
//
// tsk-in1-1 D1: the event-sourced write door (`tool.register`/`tool.remove`,
// once store.mjs's `registerTool`/`removeTool`) is retired — a tool provider
// is now declared directly in `runner.executors.<id>` (`.fgos/config.json`),
// the same config-edited precedent `executors` already was for `agy`. This
// module keeps only the PURE read-side logic: `normalizeCapability` (never
// touches fs) and `toolsFromExecutors` (below) turn a raw `cfg.executors`
// map into the tool-shaped objects `probeTool`/`classifyRegistryPosture`
// already expected — no shape change was needed for either of those two.
//
// The local status overlay (`readLocalStatus`/`writeLocalStatus`/
// `probeTool`) is a SEPARATE, deliberately non-event-sourced concern (per
// docs/history/tool-registry-capability-port/CONTEXT.md's pinned
// "registered vs present" term): `tool check`'s result is a fact about
// *this machine*, not a team decision, so it never goes through
// `.fgos/events.jsonl` — it lives in one local, gitignored file beside it,
// the same "separate local facade outside the single write door" shape
// store.mjs's own header comment describes for `worker-log.mjs`.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { resolveFgosFile, FGOS_FILE } from './fgos-file-registry.mjs';

/** The full kind domain (repository-harness's own set, minus 'http' — 0 real
 * usage confirmed at tsk-in1-1 time (DISCUSSION.md §3 #14): no executor ever
 * declared kind:"http" here, so `probeHttp` (the TCP-connect presence probe
 * for it) was dead weight and was removed alongside it. */
export const KINDS = Object.freeze(['cli', 'binary', 'mcp', 'skill']);

// mcp/skill tools are never on PATH (deep-dive §Cơ chế) — presence for
// those two kinds is checked by scanning a path on disk instead, so a scan
// target is the one piece of information those two kinds cannot do without.
const SCAN_REQUIRED_KINDS = new Set(['mcp', 'skill']);

/**
 * Normalize a free-text capability label to kebab-case (repository-harness's
 * `normalize_capability` — "Impact Analysis"/"impact_analysis"/
 * "impact-analysis" all fold to the same string). Returns `''` for anything
 * that normalizes to nothing (non-string input, or a string with no
 * alphanumeric content) — callers treat an empty result as invalid.
 */
export function normalizeCapability(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Turn `cfg.executors` (`.fgos/config.json`'s `runner.executors`, D1) into
 * the tool-shaped objects `probeTool`/`classifyRegistryPosture` already
 * expect — pure, never touches fs. A executor entry is a TOOL (as opposed to
 * an agent/dispatch executor like `agy`) precisely when it declares
 * `kind: "tool"` — `for` alone is NOT a safe signal (tsk-34n D2/D3 gave
 * `agy`, a `kind:"agent"` executor, its own real `for` too, so a
 * dispatch-only executor can legitimately declare `for` now without
 * becoming tool-registry-probeable).
 *
 * tsk-45f D11 (superseded by tsk-34n): `executor.for` (the array `decide
 * --for`/`resolveExecutorIdForPurpose` already read) replaced the older
 * `executor.capability` single-value field entirely — a real executor
 * (`gitnexus`) once declared only `capability`, so `decide --for
 * impact-analysis` always answered `unavailable` despite `fgos tool query
 * --capability impact-analysis` finding it. `for[0]` is the correct
 * single-value projection of this function's own always-one-capability-
 * per-entry shape (a executor serving several capabilities is still one
 * tool-registry row). The `capability` fallback tsk-45f kept for
 * not-yet-migrated executors is retired (tsk-34n): every executor in this
 * repo's own config has carried `for` since tsk-45f itself landed, and
 * `capability` is no longer read as input anywhere.
 *
 * tsk-in1-4 D5: `executor.kind` stopped meaning "presence-probe mechanism"
 * the moment `dispatch.mjs`'s own `kind` became the `agent`/`tool` BAN CHAT
 * axis (`gitnexus`/`herdr` both read `kind: "tool"` now, which tells
 * `probeTool` nothing about HOW to probe them). The probe mechanism and
 * probe command now live on the entry's own `invocations[0]` instead
 * (`via`/`command` — D8's `INVOCATION_VIA` vocabulary, `cli`/`mcp`, maps
 * onto `probeTool`'s own `kind` naming directly) — this module never reads
 * `executor.kind` for probing purposes anymore. Task 1's flat
 * `probeCommand` field is retired along with it (superseded, migrated to
 * `invocations[0].command` in the same change that introduced `kind:
 * "tool"`); a executor naming no `invocations` at all is simply not
 * probeable and is skipped, same as one naming neither `for` nor
 * `capability`.
 */
export function toolsFromExecutors(executors) {
  const tools = {};
  for (const [id, executor] of Object.entries(executors ?? {})) {
    // tsk-34n regression found live: `agy` (kind:"agent") started
    // declaring its own "for" (D3's migration, so `capabilities.<name>.
    // prefer` can resolve it) -- without this gate, ANY executor naming
    // "for" got treated as a tool-registry-probeable "tool", conflating
    // the dispatch registry (kind:"agent", a live persona) with the
    // presence-probe registry (kind:"tool", mechanical, e.g. gitnexus/
    // herdr) this function's own docstring already says are different.
    // "for" alone was never a safe signal on its own now that both kinds
    // legitimately declare it.
    if (executor?.kind !== 'tool') continue;
    const rawCapability = Array.isArray(executor?.for) && executor.for.length > 0 ? executor.for[0] : undefined;
    const capability = normalizeCapability(rawCapability);
    if (!capability) continue;
    const invocation = Array.isArray(executor.invocations) ? executor.invocations[0] : undefined;
    tools[id] = {
      name: id,
      kind: invocation?.via,
      capability,
      command: invocation?.command,
      scanTarget: executor.scanTarget,
      responsibility: executor.responsibility,
      description: executor.description,
    };
  }
  return tools;
}

// PATH resolution done by hand (fs.accessSync per PATH entry) rather than
// shelling out to `command -v`/`where` — avoids building a shell string out
// of a registered tool's own `command` field entirely, never a shell
// injection surface.
//
// Shared with `dispatch.mjs`'s `detectAssistantCli` (D5, tsk-62v): both
// modules scanned PATH for an executable independently before this cell —
// `findExecutableOnPath` is the one implementation both now call.
// `pathEnv`/`candidateNames` are both injectable so callers (and tests)
// never have to mutate the real environment to control the result. Checks
// every directory for `candidateNames[0]` before moving to
// `candidateNames[1]` — an earlier name wins over a later one found
// elsewhere on PATH.
export function findExecutableOnPath(candidateNames, pathEnv = process.env.PATH) {
  const dirs = typeof pathEnv === 'string' && pathEnv ? pathEnv.split(path.delimiter).filter(Boolean) : [];
  const exts = process.platform === 'win32' ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';') : [''];
  for (const name of candidateNames) {
    for (const dir of dirs) {
      for (const ext of exts) {
        try {
          fs.accessSync(path.join(dir, name + ext), fs.constants.X_OK);
          return name;
        } catch {
          // not found in this PATH entry — keep scanning
        }
      }
    }
  }
  return null;
}

function commandExistsOnPath(name) {
  return findExecutableOnPath([name]) !== null;
}

// tsk-j7y D2: `scanTarget` existing on disk only ever proved the tool was
// installed, never that its index reflects the current repo — the exact
// gap that let GitNexus's impact() give false blast-radius evidence during
// tsk-480 while `fgos tool query` still reported "present". GitNexus's own
// `meta.json` (written inside its scanTarget) already records the commit
// it last indexed, so comparing that against the repo's real HEAD costs
// nothing new to read. Missing/malformed meta.json, no `lastCommit`, or a
// failing `git rev-parse` (repoRoot not a git repo, or no commits yet) all
// degrade to "not stale" — same never-throws, never-a-false-positive
// contract `probeTool` already carries for the rest of this function.
function isIndexStale(scanPath, repoRoot) {
  let lastCommit;
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(scanPath, 'meta.json'), 'utf8'));
    lastCommit = typeof meta.lastCommit === 'string' ? meta.lastCommit : undefined;
  } catch {
    return false;
  }
  if (!lastCommit) return false;
  let head;
  try {
    head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return false;
  }
  return head !== lastCommit;
}

/**
 * Probe one registered tool's presence on this machine, per its `kind`
 * (deep-dive §Cơ chế): `cli`/`binary` resolve on `PATH`; `mcp`/`skill` check
 * `scanTarget` exists on disk (resolved against `repoRoot`), and — tsk-j7y
 * D2 — resolve `'stale'` instead of `'present'` when the tool's own
 * `meta.json` records a `lastCommit` behind the repo's current `HEAD`. Never
 * throws for an absent tool — absence is a fact to report (`'missing'`),
 * never a CLI error (the core "absent capability = clean skip, never a
 * failure" contract this whole item ports).
 */
export async function probeTool(tool, repoRoot) {
  if (tool.kind === 'cli' || tool.kind === 'binary') {
    return commandExistsOnPath(tool.command) ? 'present' : 'missing';
  }
  if (tool.kind === 'mcp' || tool.kind === 'skill') {
    if (!tool.scanTarget) return 'unknown';
    const scanPath = path.resolve(repoRoot, tool.scanTarget);
    if (!fs.existsSync(scanPath)) return 'missing';
    return isIndexStale(scanPath, repoRoot) ? 'stale' : 'present';
  }
  return 'unknown';
}

export function toolStatusPath(dir) {
  return resolveFgosFile(dir, FGOS_FILE.TOOL_STATUS);
}

/**
 * Read the local, per-machine `check` status overlay — never the truth
 * about what is registered (that is `runner.executors` in
 * `.fgos/config.json`, D1), only what THIS machine last observed. Missing file reads as
 * `{}` (never checked yet); a corrupt file also reads as `{}` — this is a
 * disposable local cache, regenerated by the next `tool check`, so a
 * parse failure is never fatal here the way a corrupt `events.jsonl` is.
 */
export function readLocalStatus(dir) {
  let raw;
  try {
    raw = fs.readFileSync(toolStatusPath(dir), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function writeLocalStatus(dir, statusMap) {
  const statusPath = toolStatusPath(dir);
  fs.mkdirSync(path.dirname(statusPath), { recursive: true });
  fs.writeFileSync(statusPath, `${JSON.stringify(statusMap, null, 2)}\n`, 'utf8');
}

/**
 * The resolved status for a registered tool name: whatever this machine's
 * local overlay says, or `'unknown'` when it has never been checked here
 * (registered-but-no-local-entry — the deep-dive's own US-027 distinction:
 * this must NEVER read as `'missing'`, which means "checked, and it's not
 * there").
 */
export function resolvedStatus(name, localStatus) {
  const entry = localStatus[name];
  return entry && typeof entry.status === 'string' ? entry.status : 'unknown';
}

/**
 * Classify the whole registry's posture (deep-dive's degrade ladder,
 * applied across every registered tool rather than per-capability — YAGNI,
 * per plan.md: the doctor entry reports overall registry health, not a
 * capability-specific check, so it never hardcodes a capability name):
 * zero tools registered -> `'inactive'` (mechanism unused, harmless, never
 * a failure); at least one registered but not every one resolves
 * `'present'` -> `'degraded'`; every registered tool resolves `'present'`
 * -> `'full'`.
 */
export function classifyRegistryPosture(tools, localStatus) {
  const names = Object.keys(tools ?? {});
  if (names.length === 0) {
    return { posture: 'inactive', registeredCount: 0, presentCount: 0, missingCount: 0, unknownCount: 0 };
  }
  let presentCount = 0;
  let missingCount = 0;
  let unknownCount = 0;
  for (const name of names) {
    const status = resolvedStatus(name, localStatus);
    if (status === 'present') presentCount += 1;
    else if (status === 'missing') missingCount += 1;
    else unknownCount += 1;
  }
  const posture = presentCount === names.length ? 'full' : 'degraded';
  return { posture, registeredCount: names.length, presentCount, missingCount, unknownCount };
}
