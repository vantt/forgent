// definitions/protocol-loader.mjs — deterministic YAML/JSON loading and
// project/domain/core discovery for `CoordinationProtocol`-profile
// FlowDefinition documents (Phase 02 R6), per
// docs/architect/agent-coordination/contracts/flow-definition.md and
// ADR-009. Reuses `validateFlowDefinition` (`./schema.mjs`, P02.1) for
// every document -- this module never reimplements or forks that
// validation logic, it only adds registry-level (multi-document) concerns
// validateFlowDefinition cannot see on its own: duplicate ids across a
// discovery scan, path escape, and "which of the 3 tiers wins."
//
// Layer: infra (same tag as sibling `./schema.mjs`). Reads only -- no
// writes, no execution, no CoordinationSession wiring (AC-I003's
// must-not-preclude: "protocols remain optional and cannot create a
// second execution core" -- this loader stops at a validated, frozen,
// in-memory document; nothing here dispatches or spawns anything).
//
// Discovery tiers, highest precedence first ("project overrides global",
// AGENTS.md's install/setup/doctor gate doctrine, applied here to
// definition FILES rather than the shared config-default JSON that
// doctrine usually governs):
//   1. project -- `<cwd>/.fgos/coordination-protocols/*.{yaml,yml,json}`,
//      the consuming project's own local protocol definitions. Same
//      `<dir>/.fgos/...` convention `shared-config-file.mjs`'s
//      `sharedConfigFilePath` already uses for the project-level config
//      file, deliberately NOT git-resolved (same reasoning: testable
//      without a real git checkout, and every sibling doctor check that
//      reads `.fgos/config.json` already uses this exact non-git
//      resolution).
//   2. domain -- `<packageRoot>/domains/<domain>/coordination-protocols/
//      *.{yaml,yml,json}`, for every `domains/*` subdirectory that
//      declares one. Enumerated directly off disk (not through
//      `workflow-stage-graphs.mjs`'s `DOMAINS`) so this module stays a
//      pure filesystem scan with no dependency on that module's synthetic/
//      throwaway fixture domains (`synthetic`, `triage`,
//      `fixture-marketing`) that have no real `domains/<name>/` directory
//      backing them at all.
//   3. core -- `<packageRoot>/core/coordination-protocols/*.{yaml,yml,json}`,
//      the foundation fixtures this cell's R7 ships (declared-consult,
//      independent-research fan-out/fan-in).
//
// A duplicate `metadata.id` WITHIN one scan directory is a hard,
// fail-closed configuration error (`registerTierEntries`'s own
// `seenThisTier` Set, reset per call -- two files in the SAME directory
// disagreeing about the same identity is never resolvable automatically).
// A `metadata.id` repeated ACROSS tiers (project/domain/core), or across
// two DIFFERENT domain directories (the domain tier makes one
// `registerTierEntries` call per `domains/<name>/coordination-protocols/`
// directory, so this is a distinct case from the intra-directory one
// above), silently keeps the first-registered entry and drops the rest --
// first call wins (project, then domains in sorted name order, then
// core), with NO trace field recorded on the surviving entry (no
// `shadowedBy`/`shadows` field exists anywhere in this module today; an
// earlier draft of this comment claimed one did -- it did not, this is
// the corrected description). Cross-TIER shadowing (project overrides
// domain/core) is an intentional, documented override mechanism.
// Cross-DOMAIN shadowing (two unrelated domains' fixtures colliding on
// the same id by accident) is a known, tracked gap, not a designed
// feature -- see this cell's own verification trace
// (docs/architect/agent-coordination/verification/step-08-standalone-coordination/P02.2.md's
// Gaps section) for the repro and follow-up fix direction (share one
// duplicate-id map across all domain-tier scans, or implement a real
// trace field).

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import { validateFlowDefinition, FlowDefinitionError } from './schema.mjs';

const require = createRequire(import.meta.url);

let parseYaml;
try {
  parseYaml = require('yaml').parse;
} catch {
  // Same isolated/`node_modules`-less fallback `workflow-stage-graphs.mjs`
  // already documents and exercises (test/setup/checks-setup-rc-line.test.mjs)
  // -- `.yaml`/`.yml` fixture files are silently skipped (not a fail-closed
  // validation error; this is an environment-capability gap, the same
  // class `checkDependenciesInstalled` in registrations.mjs already reports
  // on separately), `.json` fixture files still load via `JSON.parse` below
  // regardless.
}

/** `src/runner/definitions/` is 3 path segments below the repo root
 * (`src/runner/definitions -> src/runner -> src -> root`) -- same
 * `import.meta.dirname`-relative resolution `workflow-stage-graphs.mjs`'s
 * `loadDomainsFromDisk` already uses one level shallower for its own
 * `domains/` root. */
const PACKAGE_ROOT = path.resolve(import.meta.dirname, '../../../');

const CORE_PROTOCOLS_DIR = path.join('core', 'coordination-protocols');
const DOMAIN_PROTOCOLS_SEGMENT = 'coordination-protocols';
const PROJECT_PROTOCOLS_DIR = path.join('.fgos', 'coordination-protocols');

const DEFINITION_FILE_RE = /\.(ya?ml|json)$/i;

function isDefinitionFileName(name) {
  return DEFINITION_FILE_RE.test(name);
}

/**
 * Path-escape guard (R6): `filePath` must resolve to a real location
 * strictly inside `rootDir`. `fs.readdirSync` entries can never literally
 * contain a `..`/absolute segment on their own, so this is defense in
 * depth against a symlink planted inside a scanned directory pointing
 * outside it -- the concrete, testable shape a "path escape" negative
 * fixture in this cell's test suite exercises. Throws
 * `FlowDefinitionError('path-escape', ...)`, never returns false --
 * fail-closed per R6, matching every other loader-level violation in this
 * module.
 */
function assertContained(rootDir, filePath) {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = fs.existsSync(filePath) ? fs.realpathSync(filePath) : path.resolve(filePath);
  const rel = path.relative(resolvedRoot, resolvedTarget);
  if (rel === '' || rel.startsWith(`..${path.sep}`) || rel === '..' || path.isAbsolute(rel)) {
    throw new FlowDefinitionError(
      'path-escape',
      `flow-definition: "${filePath}" resolves outside its own scan root "${resolvedRoot}" -- rejected`,
    );
  }
}

function readDefinitionFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  if (filePath.toLowerCase().endsWith('.json')) {
    return JSON.parse(text);
  }
  if (typeof parseYaml !== 'function') return undefined; // see module-load fallback comment above
  return parseYaml(text);
}

function relativeToPackageRoot(filePath) {
  return path.relative(PACKAGE_ROOT, filePath) || filePath;
}

/**
 * Scan one directory (non-recursive) for definition files, validate each
 * through `validateFlowDefinition`, and require `spec.profile.kind ===
 * 'CoordinationProtocol'` (this registry's own scope -- a `Workflow`-
 * profile document placed here is a real configuration mistake, reported
 * with the same fail-closed discipline as every other rejection here).
 * Returns `[]` when `dir` does not exist -- an absent tier is a clean skip
 * (project/domain tiers are legitimately absent almost always today), not
 * an error.
 */
function scanTier(tier, dir, source) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir).filter(isDefinitionFileName).sort((a, b) => a.localeCompare(b));

  return entries.map((fileName) => {
    const filePath = path.join(dir, fileName);
    assertContained(dir, filePath);

    let raw;
    try {
      raw = readDefinitionFile(filePath);
    } catch (err) {
      throw new FlowDefinitionError(
        'parse',
        `flow-definition: cannot parse "${relativeToPackageRoot(filePath)}": ${err.message}`,
      );
    }
    if (raw === undefined) return undefined; // yaml unavailable, .yaml/.yml file -- graceful skip (see module header)

    let definition;
    try {
      definition = validateFlowDefinition(raw);
    } catch (err) {
      if (err instanceof FlowDefinitionError) {
        throw new FlowDefinitionError(
          err.category,
          `${err.message} (source: ${relativeToPackageRoot(filePath)})`,
        );
      }
      throw err;
    }

    if (definition.spec.profile.kind !== 'CoordinationProtocol') {
      throw new FlowDefinitionError(
        'validation',
        `flow-definition: "${relativeToPackageRoot(filePath)}" declares spec.profile.kind "${definition.spec.profile.kind}", but the coordination-protocol registry only accepts "CoordinationProtocol" (source: ${relativeToPackageRoot(filePath)})`,
      );
    }

    return Object.freeze({ tier, source, filePath, definition });
  }).filter(Boolean);
}

function registerTierEntries(byId, tierEntries, tierLabel) {
  const seenThisTier = new Set();
  for (const entry of tierEntries) {
    const id = entry.definition.metadata.id;
    if (seenThisTier.has(id)) {
      throw new FlowDefinitionError(
        'duplicate-id',
        `flow-definition: duplicate CoordinationProtocol id "${id}" within the ${tierLabel} tier (source: ${relativeToPackageRoot(entry.filePath)}) -- rejected`,
      );
    }
    seenThisTier.add(id);
    if (!byId.has(id)) {
      byId.set(id, entry);
    }
    // Already present from a higher-precedence tier: the existing entry
    // wins (project overrides global/domain/core) -- intentional shadow,
    // not an error. See module header for the reasoning behind this
    // cross-tier interpretation.
  }
}

/**
 * Discover every `CoordinationProtocol`-profile FlowDefinition document
 * across the project/domain/core tiers, deterministically (sorted
 * filename order within each directory; fixed tier precedence), returning
 * a frozen array of `{tier, source, filePath, definition}` entries -- one
 * per distinct `metadata.id`, project-tier shadowing domain/core, domain
 * shadowing core. Throws `FlowDefinitionError` (fail-closed) on the first
 * malformed document, duplicate id within a tier, path escape, or
 * non-CoordinationProtocol document found -- never returns a partial
 * result on failure.
 *
 * Never wires, selects, or executes a protocol on its own (AC-I003
 * must-not-preclude) -- purely a read+validate+resolve-precedence
 * function.
 *
 * @param {{cwd?: string, packageRoot?: string}} [options]
 * @returns {ReadonlyArray<{tier: string, source: string, filePath: string, definition: object}>}
 */
export function discoverCoordinationProtocols({ cwd = process.cwd(), packageRoot = PACKAGE_ROOT } = {}) {
  const byId = new Map();

  const projectDir = path.join(cwd, PROJECT_PROTOCOLS_DIR);
  registerTierEntries(byId, scanTier('project', projectDir, 'project'), 'project');

  const domainsRoot = path.join(packageRoot, 'domains');
  if (fs.existsSync(domainsRoot)) {
    const domainNames = fs
      .readdirSync(domainsRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));
    for (const domainName of domainNames) {
      const domainDir = path.join(domainsRoot, domainName, DOMAIN_PROTOCOLS_SEGMENT);
      registerTierEntries(byId, scanTier('domain', domainDir, domainName), `domain:${domainName}`);
    }
  }

  const coreDir = path.join(packageRoot, CORE_PROTOCOLS_DIR);
  registerTierEntries(byId, scanTier('core', coreDir, 'core'), 'core');

  return Object.freeze([...byId.values()]);
}

/**
 * Resolve one CoordinationProtocol definition by `metadata.id` through the
 * same project/domain/core precedence `discoverCoordinationProtocols`
 * applies. Throws `FlowDefinitionError('not-found', ...)` when no tier
 * declares `id` -- never returns `undefined` silently (fail-closed, same
 * discipline as every other lookup in this module). Deliberately NOT an
 * execution entry point -- returns the validated, frozen document only;
 * selecting/dispatching a protocol stays a separate, explicit, later
 * concern (AC-I003 must-not-preclude).
 *
 * @param {string} id
 * @param {{cwd?: string, packageRoot?: string}} [options]
 * @returns {Readonly<object>} the validated FlowDefinition document.
 */
export function loadCoordinationProtocol(id, options = {}) {
  const found = discoverCoordinationProtocols(options).find((entry) => entry.definition.metadata.id === id);
  if (!found) {
    throw new FlowDefinitionError('not-found', `flow-definition: no CoordinationProtocol definition found for id "${id}"`);
  }
  return found.definition;
}
