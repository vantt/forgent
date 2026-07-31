// tool-registry.mjs — pure validation/classification logic for the tool
// registry (tsk-1dj, ported from repository-harness's tool-registry-
// capability per docs/distillery/deep-dives/tool-registry.md).
//
// PURE where it matters for the write path: `validateToolRegistration`/
// `normalizeCapability` never touch fs, mirroring how work.mjs's
// `validateWork` is a pure sibling to store.mjs's write door — store.mjs's
// `registerTool`/`removeTool` are the actual event-log write door for
// `tool.register`/`tool.remove`, never this module.
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
import net from 'node:net';
import path from 'node:path';

/** Error raised by this module. `category` is the CLI exit-code contract (R4). */
export class ToolRegistryError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'ToolRegistryError';
    this.category = category;
  }
}

/** The full kind domain (repository-harness's own set, ported unchanged — D2). */
export const KINDS = Object.freeze(['cli', 'binary', 'mcp', 'skill', 'http']);

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
 * Validate a candidate tool registration and return the normalized record
 * ready for the store to append — this function never writes anything
 * itself, mirroring porting.mjs's `transitionPorting` (decide, never write).
 *
 * `existingNames` is the caller's current `Object.keys(view.tools)`, read
 * fresh — a duplicate `name` is rejected here, before anything reaches the
 * log, the same existence-check-before-append discipline `addWork` applies.
 */
export function validateToolRegistration(fields, existingNames) {
  const name = fields?.name;
  if (typeof name !== 'string' || !name.trim()) {
    throw new ToolRegistryError('validation', 'tool register requires a non-empty --name.');
  }
  if (existingNames.includes(name)) {
    throw new ToolRegistryError(
      'validation',
      `tool "${name}" already exists — remove it first (fgos tool remove --name ${name}) or pick a different --name.`,
    );
  }
  if (typeof fields.kind !== 'string' || !KINDS.includes(fields.kind)) {
    throw new ToolRegistryError(
      'validation',
      `tool register requires --kind to be one of ${KINDS.join('/')}, got: ${JSON.stringify(fields.kind)}`,
    );
  }
  const capability = normalizeCapability(fields.capability);
  if (!capability) {
    throw new ToolRegistryError('validation', 'tool register requires a non-empty --capability.');
  }
  if (typeof fields.command !== 'string' || !fields.command.trim()) {
    throw new ToolRegistryError('validation', 'tool register requires a non-empty --command.');
  }
  if (SCAN_REQUIRED_KINDS.has(fields.kind) && (typeof fields.scanTarget !== 'string' || !fields.scanTarget.trim())) {
    throw new ToolRegistryError(
      'validation',
      `tool register requires --scan for kind "${fields.kind}" (mcp/skill tools are not on PATH — presence is checked by scanning this path on disk).`,
    );
  }

  return {
    name: name.trim(),
    kind: fields.kind,
    capability,
    command: fields.command.trim(),
    scanTarget: typeof fields.scanTarget === 'string' && fields.scanTarget.trim() ? fields.scanTarget.trim() : undefined,
    responsibility: typeof fields.responsibility === 'string' && fields.responsibility.trim() ? fields.responsibility.trim() : undefined,
    description: typeof fields.description === 'string' && fields.description.trim() ? fields.description.trim() : undefined,
  };
}

// PATH resolution done by hand (fs.accessSync per PATH entry) rather than
// shelling out to `command -v`/`where` — avoids building a shell string out
// of a registered tool's own `command` field entirely, never a shell
// injection surface.
function commandExistsOnPath(name) {
  const pathEnv = process.env.PATH || '';
  const exts = process.platform === 'win32' ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';') : [''];
  for (const dir of pathEnv.split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      try {
        fs.accessSync(path.join(dir, name + ext), fs.constants.X_OK);
        return true;
      } catch {
        // not found in this PATH entry — keep scanning
      }
    }
  }
  return false;
}

const HTTP_PROBE_TIMEOUT_MS = 2000;

// Short TCP connect probe — "present" means something is listening, never a
// real HTTP handshake (a full request is out of scope; the registry only
// answers "is a provider even here").
function probeHttp(command, timeoutMs = HTTP_PROBE_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let host;
    let port;
    try {
      const url = new URL(command.includes('://') ? command : `http://${command}`);
      host = url.hostname;
      port = Number(url.port) || (url.protocol === 'https:' ? 443 : 80);
    } catch {
      resolve('missing');
      return;
    }
    const socket = net.createConnection({ host, port, timeout: timeoutMs });
    socket.once('connect', () => {
      socket.destroy();
      resolve('present');
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve('missing');
    });
    socket.once('error', () => {
      resolve('missing');
    });
  });
}

/**
 * Probe one registered tool's presence on this machine, per its `kind`
 * (deep-dive §Cơ chế): `cli`/`binary` resolve on `PATH`; `mcp`/`skill` check
 * `scanTarget` exists on disk (resolved against `repoRoot`); `http` does a
 * short TCP connect probe. Never throws for an absent tool — absence is a
 * fact to report (`'missing'`), never a CLI error (the core "absent
 * capability = clean skip, never a failure" contract this whole item ports).
 */
export async function probeTool(tool, repoRoot) {
  if (tool.kind === 'cli' || tool.kind === 'binary') {
    return commandExistsOnPath(tool.command) ? 'present' : 'missing';
  }
  if (tool.kind === 'mcp' || tool.kind === 'skill') {
    if (!tool.scanTarget) return 'unknown';
    return fs.existsSync(path.resolve(repoRoot, tool.scanTarget)) ? 'present' : 'missing';
  }
  if (tool.kind === 'http') {
    return probeHttp(tool.command);
  }
  return 'unknown';
}

export const TOOL_STATUS_FILENAME = 'tool-status.local.json';

export function toolStatusPath(dir) {
  return path.join(dir, TOOL_STATUS_FILENAME);
}

/**
 * Read the local, per-machine `check` status overlay — never the truth
 * about what is registered (that is `view.tools`, folded from the shared
 * event log), only what THIS machine last observed. Missing file reads as
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
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(toolStatusPath(dir), `${JSON.stringify(statusMap, null, 2)}\n`, 'utf8');
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
