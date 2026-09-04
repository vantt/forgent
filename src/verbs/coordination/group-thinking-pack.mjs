// group-thinking-pack.mjs -- Phase 10 (Step 09) P10.1: the group-thinking
// Protocol Pack registry loader and the ONE gate the `fgos-group-thinking`
// skill dispatches through. Public-surface layer, per Phase 10's own
// Objective ("the reusable application layer OUTSIDE core") and Pack
// Integration Gate ("Pack, conformance inputs, and skill are
// physically/authoritatively outside the Agent Coordination kernel").
//
// This module never opens, dispatches, authorizes, dispositions, or closes
// a session on its own -- the ONE place it reaches the runtime for actual
// engine WORK is a single `runCoordinationUseCase` call in
// `runGroupThinkingRequest`, the SAME door `fgos coordination run --file`/
// the headless adapter already call (`run.mjs`'s own header comment: "the
// ONLY place a coordination request is turned into engine calls"). It
// additionally imports exactly one READ-ONLY function from
// session-engine.mjs -- `resumeSession` (== `replaySession`), the SAME
// real-manifest resolver `run.mjs`'s own `findExistingManifest` uses -- to
// cross-check a RESUME request's claimed protocol id against the session's
// REAL bound protocol before forwarding anything (see
// `runGroupThinkingRequest`'s resume cross-check below, and P10.1.md's
// fix-round notes for why this was added). This is a read, never a second
// dispatch/authorize/disposition/close path -- the bypass reasoning for
// "bypass grants" / "validate its own aggregate" / "authorize a specialist"
// / "close a session directly" still holds unchanged, because none of those
// four capabilities are reachable through `resumeSession`. It never forks
// `discoverCoordinationProtocols`/`loadCoordinationProtocol`
// (`protocol-loader.mjs`, reused unchanged) -- "index protocols by
// canonical FlowDefinition metadata.id@version; do not create a second
// protocol identity" (this cell's own Goal text) means exactly that:
// `metadata.id@version` stays the ONLY protocol identity anywhere in this
// module; the pack registry below never assigns an id of its own to a
// protocol, it only NAMES which already-registered `{id, version}` pairs
// this pack exposes.
//
// The registry itself (`core/protocol-packs/group-thinking.json`) is a
// flat, explicit, data-first list -- no protocol-specific branch exists
// anywhere in this file. Adding a protocol to the pack is a data edit to
// that JSON file, never a code change here (this is what lets P10.2-P10.4's
// three definitions, and P10.5's registration of them, land without
// touching this module again).
//
// Every function below is a pure gate: it either returns a validated,
// frozen result or throws `StoreError('validation', ...)` -- fail-closed,
// matching every other loader/request door in this codebase. Nothing here
// ever guesses, defaults, or silently widens a caller's selection.
import fs from 'node:fs';
import path from 'node:path';
import { StoreError } from '../../state/store.mjs';
import { loadCoordinationProtocol } from '../../runner/definitions/protocol-loader.mjs';
import { resumeSession } from '../../runner/coordination/session-engine.mjs';
import { CoordinationError } from '../../runner/coordination/schema.mjs';
import { runCoordinationUseCase } from './run.mjs';

/** `src/verbs/coordination/` is 3 path segments below the repo root, the
 * same depth `protocol-loader.mjs`'s own `PACKAGE_ROOT` resolves from
 * `src/runner/definitions/`. */
const PACKAGE_ROOT = path.resolve(import.meta.dirname, '../../../');

const PROTOCOL_PACKS_DIR = path.join('core', 'protocol-packs');
const GROUP_THINKING_PACK_FILE = 'group-thinking.json';

function fail(reason) {
  throw new StoreError('validation', `group-thinking pack: ${reason}`);
}

function defaultPackPath(packageRoot) {
  return path.join(packageRoot, PROTOCOL_PACKS_DIR, GROUP_THINKING_PACK_FILE);
}

// Own-format validation for the pack registry document itself -- distinct
// from, and never a substitute for, `validateFlowDefinition` (`schema.mjs`),
// which this module never calls on the pack file (the pack is not a
// FlowDefinition; it only REFERENCES FlowDefinition ids). Fail-closed on any
// malformed shape rather than silently tolerating a partially-shaped
// document.
function assertPackShape(pack, packPath) {
  if (pack === null || typeof pack !== 'object' || Array.isArray(pack)) {
    fail(`"${packPath}" must contain a single JSON object`);
  }
  if (pack.apiVersion !== 'fgos.dev/v1alpha1') {
    fail(`"${packPath}" declares apiVersion "${pack.apiVersion}", expected "fgos.dev/v1alpha1"`);
  }
  if (pack.kind !== 'ProtocolPack') {
    fail(`"${packPath}" declares kind "${pack.kind}", expected "ProtocolPack"`);
  }
  if (typeof pack.metadata?.id !== 'string' || pack.metadata.id.trim() === '') {
    fail(`"${packPath}" is missing a non-empty metadata.id`);
  }
  if (!Array.isArray(pack.members)) {
    fail(`"${packPath}"'s "members" field must be an array (use [] for an empty pack)`);
  }
  const seenIds = new Set();
  for (const [i, member] of pack.members.entries()) {
    if (member === null || typeof member !== 'object' || Array.isArray(member)) {
      fail(`"${packPath}"'s members[${i}] must be an object`);
    }
    if (typeof member.id !== 'string' || member.id.trim() === '') {
      fail(`"${packPath}"'s members[${i}] is missing a non-empty "id"`);
    }
    if (typeof member.version !== 'string' || member.version.trim() === '') {
      fail(`"${packPath}"'s members[${i}] ("${member.id}") is missing a non-empty "version" -- every pack member is pinned by the same {id, version} pair its FlowDefinition already declares, never id alone`);
    }
    if (seenIds.has(member.id)) {
      fail(`"${packPath}" lists duplicate member id "${member.id}"`);
    }
    seenIds.add(member.id);
  }
}

/**
 * Load and validate the group-thinking Protocol Pack registry -- a flat,
 * explicit list of `{id, version}` pairs naming which already-registered
 * `CoordinationProtocol` FlowDefinitions this pack exposes. Read-only;
 * never resolves, executes, or wires a protocol on its own (mirrors
 * `discoverCoordinationProtocols`'s own "purely a read+validate" posture).
 *
 * @param {{packageRoot?: string, packPath?: string}} [options] `packPath`
 *   overrides the default `<packageRoot>/core/protocol-packs/group-thinking.json`
 *   location -- for tests only; production callers should never pass it.
 * @returns {Readonly<{apiVersion: string, kind: 'ProtocolPack', metadata: {id: string}, members: ReadonlyArray<Readonly<{id: string, version: string}>>}>}
 */
export function loadProtocolPack(options = {}) {
  const { packageRoot = PACKAGE_ROOT, packPath = defaultPackPath(packageRoot) } = options;

  let raw;
  try {
    raw = fs.readFileSync(packPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      fail(`no pack registry found at "${packPath}"`);
    }
    throw err;
  }

  let pack;
  try {
    pack = JSON.parse(raw);
  } catch (err) {
    fail(`"${packPath}" is not valid JSON: ${err.message}`);
  }

  assertPackShape(pack, packPath);

  return Object.freeze({
    ...pack,
    metadata: Object.freeze({ id: pack.metadata.id }),
    members: Object.freeze(pack.members.map((m) => Object.freeze({ id: m.id, version: m.version }))),
  });
}

/**
 * Resolve one protocol id through the pack's own explicit membership list,
 * then through `loadCoordinationProtocol` (`protocol-loader.mjs`, reused
 * unchanged) for the ACTUAL registered definition, refusing on version
 * drift -- the same discipline `aggregationCloseParams`/
 * `assertFixtureVersionMatches` (`run.mjs`/`launch-master-loop.mjs`) already
 * apply wherever a caller-named `{id, version}` pair must not silently
 * diverge from what is really registered.
 *
 * `protocolId` is a REQUIRED, explicit argument -- there is no default,
 * no "first pack member," no environment-derived selection. An unset,
 * empty, or unregistered id is refused before this pack's own file is even
 * read for the unset case, and before `loadCoordinationProtocol` is ever
 * called for the unregistered case (a protocol that is separately loadable
 * through `protocol-loader.mjs` but not listed in this pack's own
 * `members[]` is still refused -- pack membership is a real narrowing, not
 * a re-statement of the runtime registry).
 *
 * @param {string} protocolId
 * @param {{cwd?: string, packageRoot?: string, packPath?: string}} [options]
 * @returns {Readonly<{id: string, version: string, definition: object}>}
 */
export function resolvePackProtocol(protocolId, options = {}) {
  if (typeof protocolId !== 'string' || protocolId.trim() === '') {
    fail('a protocol id must be explicitly given -- this pack never infers, defaults, or silently selects a protocol');
  }

  const pack = loadProtocolPack(options);
  const member = pack.members.find((m) => m.id === protocolId);
  if (!member) {
    const known = pack.members.map((m) => m.id).join(', ') || '<none registered yet>';
    fail(`"${protocolId}" is not a registered member of the "${pack.metadata.id}" pack (registered: ${known}) -- refusing an unregistered protocol selection`);
  }

  const definition = loadCoordinationProtocol(protocolId, options);
  if (definition.metadata.version !== member.version) {
    fail(
      `"${protocolId}" is pinned to version "${member.version}" in the pack registry, but the registered FlowDefinition is now version "${definition.metadata.version}" -- refusing to run against a drifted definition`,
    );
  }

  return Object.freeze({ id: protocolId, version: member.version, definition });
}

// A narrow, deliberate, I/O-only peek at a request file/object -- reads
// exactly the two fields (`kind`, `protocolRef.id`) this gate needs to
// check BEFORE any engine call, and performs NO schema validation of its
// own. `validateCoordinationRequest` (`schema.mjs`), called exactly once
// inside `runCoordinationUseCase` below, remains the single source of
// request-shape truth; this function exists only so the explicit-selection
// gate can run ahead of that call. Mirrors `run.mjs`'s own private
// `readRequestFile` error contract exactly (same StoreError categories/
// messages shape) so a malformed/missing file fails the same way whether it
// is caught here or later inside `run.mjs`.
function peekRequest(requestPath) {
  let raw;
  try {
    raw = fs.readFileSync(requestPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      fail(`request file not found at "${requestPath}"`);
    }
    throw err;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    fail(`request file "${requestPath}" is not valid JSON: ${err.message}`);
  }
  return undefined; // unreachable; keeps linters happy about the throw above
}

/**
 * Launch or resume ONE group-thinking coordination request, gated on
 * explicit pack membership, then forwarded UNCHANGED into
 * `runCoordinationUseCase` (`run.mjs`) -- the exact door `fgos coordination
 * run --file`/the headless adapter already use. This is a thin pass-through,
 * never a second execution path: nothing in this function opens a session,
 * dispatches, authorizes, dispositions, validates an aggregation, authorizes
 * a specialist, or closes a session -- `run.mjs`'s own request vocabulary
 * (`operation` | `authorize` | `disposition` | `fan-out` steps, plus its
 * own automatic close-on-quorum at the end of every request) is the ONLY
 * thing that ever executes, unmodified by anything here.
 *
 * Resume is `run.mjs`'s own existing behavior, inherited for free: a
 * request naming an EXISTING `coordinationId` resumes that session through
 * the same `findExistingManifest` path every other caller of
 * `runCoordinationUseCase` already reaches -- this function adds no
 * separate resume mechanism of its own. It DOES add one extra gate on top,
 * below: when `coordinationId` names a session that already exists, the
 * caller's pack-checked `protocolId` is cross-referenced against that
 * session's REAL bound protocol (`manifest.definitionRef.id`) before
 * anything is forwarded, refusing a resume whose claimed protocol disagrees
 * with what the session was actually opened under -- see the inline
 * comment at the check itself for why this was needed and why it compares
 * by id alone, not id@version.
 *
 * @param {object} ctx Same shape `runCoordinationUseCase` takes: `{cwd, repoRoot, runnerConfig?, timeoutMs?, packageRoot?}`.
 * @param {object} options
 * @param {string} options.protocolId Required, explicit pack-member selection (never inferred).
 * @param {string} [options.requestPath] Path to a request JSON file. Exactly one of `requestPath`/`requestObject` must be given.
 * @param {object} [options.requestObject] An already-parsed request object.
 * @param {string} [options.packPath] Pack-registry override, for tests only.
 * @param {string} [options.cliExecutor] Forwarded verbatim to `runCoordinationUseCase`.
 * @param {string} [options.cliModel] Forwarded verbatim to `runCoordinationUseCase`.
 * @param {string} [options.cliTier] Forwarded verbatim to `runCoordinationUseCase`.
 * @returns {Promise<object>} The `fgos.v1` data payload `runCoordinationUseCase` returns, unmodified.
 */
export async function runGroupThinkingRequest(ctx, options = {}) {
  const { protocolId, requestPath, requestObject, packPath, ...runOptions } = options;

  if ((requestPath === undefined) === (requestObject === undefined)) {
    fail('exactly one of requestPath or requestObject must be given');
  }

  // Explicit-selection gate runs BEFORE the request is even read: an unset
  // protocolId is refused with no filesystem access at all.
  resolvePackProtocol(protocolId, { cwd: ctx.cwd, packageRoot: ctx.packageRoot, packPath });

  // Read once, here -- and forward this SAME parsed object below, never the
  // path string, closing a request-file TOCTOU: before this fix, a
  // `requestPath` caller was peeked here and re-read a second, unlocked
  // time inside `runCoordinationUseCase`'s own `readRequestFile`, so a
  // concurrent writer to that path could make the gated bytes diverge from
  // the executed bytes. `requestObject` mode never had this gap (a caller
  // that already parsed its own object has nothing left to re-read); this
  // makes `requestPath` mode behave identically.
  const peeked = requestObject !== undefined ? requestObject : peekRequest(requestPath);

  if (peeked.kind !== 'declared-protocol') {
    fail(
      `requestObject.kind must be "declared-protocol" (got "${peeked.kind}") -- this pack only ever runs an explicitly FlowDefinition-declared protocol, never an agent-led request with no bound definition`,
    );
  }
  if (peeked.protocolRef?.id !== protocolId) {
    fail(
      `the request's own protocolRef.id ("${peeked.protocolRef?.id}") does not match the explicitly selected protocolId ("${protocolId}") -- refusing a request whose body disagrees with the caller's own explicit selection`,
    );
  }

  // Resume cross-check. The two checks above only prove the CALLER's own
  // claim is internally self-consistent (protocolId === protocolRef.id) and
  // a pack member -- neither one looks at what protocol actually governs
  // an EXISTING session. `run.mjs`'s dispatch/authorize/disposition/close
  // doors always operate against the session's real, persisted
  // `manifest.definitionRef` (set once, at open time, and never touched by
  // this module or by any request field), never against a request's
  // claimed `protocolRef.id` -- so without this check, a self-consistent,
  // pack-member claim could still resume a session that was really opened
  // under a completely different (possibly non-pack, e.g. a kernel-only)
  // protocol: the gate would believe and report the claimed protocol,
  // while every step actually dispatches under the session's real one.
  //
  // `resumeSession` (== `replaySession`, session-engine.mjs) is the SAME
  // real-manifest resolver `run.mjs`'s own `findExistingManifest` uses --
  // reused here unchanged, never a second manifest reader. A fresh (not
  // yet open) `coordinationId` has no real bound protocol to cross-check
  // against, so this only runs once a session genuinely already exists;
  // `CoordinationError` category `not-found` is exactly `findExistingManifest`'s
  // own "no such session yet" case, treated identically here.
  //
  // Compared by `id` alone, not `id@version`: this check's job is to
  // confirm the CLAIMED PROTOCOL IDENTITY agrees with the session's REAL
  // protocol identity, not to additionally pin an exact version.
  // `resolvePackProtocol` above already refuses any drift between the
  // pack's pinned version and the CURRENTLY loaded FlowDefinition for
  // `protocolId` -- a second, stricter `id@version` compare here would
  // ALSO refuse the legitimate case of resuming an older, still-open
  // session after the pack/definition later advances to a newer version of
  // the SAME protocol id. That case is not a version-identity risk:
  // `dispatchDeclaredOperation`/`authorizeDeclaredOperation`/
  // `closeSessionByQuorum` (session-engine.mjs/run.mjs) always resolve and
  // version-check against the session's OWN pinned `manifest.definitionRef.version`
  // for every step of that session's life, never against whatever
  // `protocolId` currently resolves to -- so an `id`-only compare here is
  // sufficient to close the reported vulnerability (a protocol IDENTITY
  // switch) without manufacturing a new refusal mode the vulnerability
  // never implicated.
  if (peeked.coordinationId !== undefined) {
    const resumeOpts = { cwd: ctx.cwd, repoRoot: ctx.repoRoot, packageRoot: ctx.packageRoot };
    let existingManifest;
    try {
      existingManifest = resumeSession(peeked.coordinationId, resumeOpts).manifest;
    } catch (err) {
      if (err instanceof CoordinationError && err.category === 'not-found') {
        existingManifest = undefined;
      } else {
        throw err;
      }
    }
    if (existingManifest !== undefined) {
      if (!existingManifest.definitionRef) {
        fail(
          `session "${peeked.coordinationId}" already exists but was opened with no bound protocol (kind:"agent-led") -- refusing a kind:"declared-protocol" pack request against it`,
        );
      }
      if (existingManifest.definitionRef.id !== protocolId) {
        fail(
          `session "${peeked.coordinationId}" is already bound to protocol "${existingManifest.definitionRef.id}", not the explicitly selected "${protocolId}" -- refusing to resume an existing session under a different protocol than it was actually opened with`,
        );
      }
    }
  }

  return runCoordinationUseCase(ctx, { requestObject: peeked, ...runOptions });
}
