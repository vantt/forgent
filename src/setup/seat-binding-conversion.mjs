// src/setup/seat-binding-conversion.mjs — the one function that moves a project's runner config from
// "rigor picks the tier" to "the config declares the tier".
//
// `convertRunnerConfig` is PURE: no fs, no clock, no env. The caller reads the project runner section and
// the global one, passes them in, and writes the returned `runner` back (the project file only; the global
// file takes no new keys). Deterministic and idempotent: converting a converted config returns
// `changes: []`. `convertProjectConfigFile` is the file step `fgos setup` runs: read, convert, back up,
// write.
//
// What it does to a project runner section:
//   - deletes `rigorToTier` and states the tier it implied: `defaults.tier` (the standard tier) and a
//     capability's own `tier` (and `maxTier` when that tier is above the global ceiling) where the
//     capability declares `rigor`. A unit's rigor no longer picks a tier, so those are the only
//     tiers the old table decided that survive;
//   - copies a bare verb's `confinement` into the `<prefix>:<verb>` capabilities that relied on the
//     bare-verb fallback, which goes away; every other key that fallback carried is only reported;
//   - adds the `mini` tier to `tierFallback`;
//   - writes the tier ladder as a `$comment` next to `modelPolicies`, `tierFallback` and `maxTier`;
//   - sets `patterns.seatBinding.schema`, the marker an older release refuses (its `patterns` map is strict).
//
// A key the project already declares is never overwritten, so converting again after something put
// `rigorToTier` back only deletes it. A converted config is touched only when its `$comment` differs from
// the ladder.

import fs from 'node:fs';
import { MODEL_POLICY_TIERS, SEAT_BINDING_SCHEMA_VERSION } from '../runner/dispatch/config.mjs';
import { readSharedConfig, sharedConfigFilePath, writeSharedConfig } from '../config/shared-config-file.mjs';
import { RIGOR_VALUES, resolveStrongerRigor } from '../runner/rigor.mjs';
import { hasUsablePrefer } from '../runner/execution/seat-resolver.mjs';

/** The table the retired `rigorToTier` key held when a config did not declare one: what the converter reads. */
const LEGACY_RIGOR_TO_TIER = Object.freeze({ low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' });

const tierRank = (tier) => MODEL_POLICY_TIERS.indexOf(tier);
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Keys of a bare-verb entry that are catalog text, not behaviour: never copied, never reported. */
const CATALOG_KEYS = new Set(['description', 'aliases', 'serves']);

/**
 * @param {object} projectRunner the `runner` section of the project's `.fgos/config.json`, as written
 * @param {object} context
 * @param {object} [context.globalRunner] the `runner` section of `~/.fgos/config.json` (read, never changed)
 * @param {string[]} [context.registeredCapabilities] every capability name the registered workflows use
 * @param {string|string[]} context.ladder the tier ladder text written as `$comment`
 * @param {object[]} [context.workflows] loaded workflow definitions (`discoverWorkflows`), to list the unit rigor and guide floors that change meaning
 * @returns {{runner: object, changes: object[], reports: object[]}} `runner` is a new object;
 *   `changes` are the edits made, `reports` what the owner should read but nothing was done about
 */
export function convertRunnerConfig(projectRunner, { globalRunner = {}, registeredCapabilities = [], ladder, workflows = [] } = {}) {
  assertLadder(ladder);
  const runner = structuredClone(projectRunner ?? {});
  const markerPresent = runner.patterns?.seatBinding?.schema !== undefined;
  // The marker alone never says "converted": something can put `rigorToTier` back into a converted file
  // (a fill-missing writer does), and that file has to be converted again.
  if (runner.rigorToTier === undefined && markerPresent) {
    // Converted: the ladder text is the one thing that can still be stale. A missing `$comment` is not drift.
    if (runner.$comment === undefined || sameJson(runner.$comment, ladder)) return { runner, changes: [], reports: [] };
    runner.$comment = ladder;
    return { runner, changes: [{ op: 'set', path: 'runner.$comment', to: ladder, why: 'the tier ladder, from its one source' }], reports: [] };
  }

  const changes = [];
  const reports = [];
  const global = globalRunner ?? {};
  const rigorTier = effectiveRigorToTier(runner, global);
  const globalMaxTier = runner.maxTier ?? global.maxTier;

  // 1. defaults.tier: the tier the old table gave `standard`.
  const defaultTier = runner.defaults?.tier ?? rigorTier.standard;
  if (runner.defaults?.tier === undefined) {
    runner.defaults = { ...(isPlainObject(runner.defaults) ? runner.defaults : {}), tier: defaultTier };
    changes.push({ op: 'set', path: 'runner.defaults.tier', to: defaultTier, why: 'the tier rigorToTier gave "standard"' });
  }

  // 2. The bare-verb fallback goes away: keep the one thing in it that is a safety policy. This reads the
  // bare entries as the project wrote them, so it runs before any tier is stated on them.
  convertBareVerbs(runner, global, [...new Set(registeredCapabilities)].sort(), changes, reports);

  // 3. A capability's own rigor stated as the tier it implied (and the ceiling it was allowed above maxTier).
  const capabilities = isPlainObject(runner.capabilities) ? runner.capabilities : {};
  for (const [name, entry] of Object.entries(capabilities)) {
    if (!isPlainObject(entry) || entry.rigor === undefined || rigorTier[entry.rigor] === undefined) continue;
    const impliedTier = rigorTier[entry.rigor];
    if (entry.tier === undefined && impliedTier !== defaultTier) {
      entry.tier = impliedTier;
      changes.push({ op: 'set', path: `runner.capabilities.${name}.tier`, to: impliedTier, why: `rigor ${entry.rigor} mapped to ${impliedTier}` });
    }
    const target = entry.tier ?? impliedTier;
    if (entry.maxTier === undefined && globalMaxTier !== undefined && tierRank(target) > tierRank(globalMaxTier)) {
      entry.maxTier = target;
      changes.push({ op: 'set', path: `runner.capabilities.${name}.maxTier`, to: target, why: `rigor ${entry.rigor} was allowed above runner.maxTier ${globalMaxTier}` });
    }
  }

  // 4. rigorToTier itself.
  if (runner.rigorToTier !== undefined) {
    changes.push({ op: 'delete', path: 'runner.rigorToTier', from: runner.rigorToTier, why: 'tier is declared, not derived from rigor' });
    delete runner.rigorToTier;
  }

  // 5. `mini` joins the fallback order of a project that declares one.
  if (isPlainObject(runner.tierFallback) && runner.tierFallback.mini === undefined) {
    const source = ['nano', 'standard'].find((tier) => runner.tierFallback[tier] !== undefined);
    if (source) {
      runner.tierFallback.mini = [...runner.tierFallback[source]];
      changes.push({ op: 'set', path: 'runner.tierFallback.mini', to: runner.tierFallback.mini, why: `copy of ${source}` });
    } else {
      reports.push({ kind: 'tier-fallback-mini-unset', detail: 'tierFallback names neither nano nor standard, so there was nothing to copy for mini' });
    }
  }

  // 6. What stops meaning anything: reported so the printed diff shows it.
  reportRigorEffects(runner, global, rigorTier, defaultTier, [...new Set([...Object.keys(capabilities), ...registeredCapabilities])].sort(), workflows, reports);

  // 7. The ladder, then the marker.
  const withComment = setComment(runner, ladder);
  if (withComment.changed) changes.push({ op: 'set', path: 'runner.$comment', to: ladder, why: 'the tier ladder, from its one source' });
  const out = withComment.runner;
  if (!markerPresent) {
    out.patterns = { ...(isPlainObject(out.patterns) ? out.patterns : {}), seatBinding: { schema: SEAT_BINDING_SCHEMA_VERSION } };
    changes.push({ op: 'set', path: 'runner.patterns.seatBinding.schema', to: SEAT_BINDING_SCHEMA_VERSION, why: 'the schema marker an older release refuses' });
  }
  return { runner: out, changes, reports };
}

function assertLadder(ladder) {
  const ok = (typeof ladder === 'string' && ladder.trim() !== '')
    || (Array.isArray(ladder) && ladder.length > 0 && ladder.every((line) => typeof line === 'string'));
  if (!ok) throw new TypeError('convertRunnerConfig needs `ladder`: the tier ladder text, a non-empty string or a non-empty array of lines');
}

/** The tier each rigor meant: the project's own table, else the global one, else the built-in one, per rigor. */
function effectiveRigorToTier(runner, global) {
  const table = {};
  for (const rigor of RIGOR_VALUES) {
    const tier = runner.rigorToTier?.[rigor] ?? global.rigorToTier?.[rigor] ?? LEGACY_RIGOR_TO_TIER[rigor];
    if (!MODEL_POLICY_TIERS.includes(tier)) throw new RangeError(`rigorToTier.${rigor} is "${tier}", not one of ${MODEL_POLICY_TIERS.join('/')}; fix it before converting`);
    table[rigor] = tier;
  }
  return table;
}

/** Places `$comment` just before `modelPolicies` when it is new; replaces it in place when it differs. */
function setComment(runner, ladder) {
  if (sameJson(runner.$comment, ladder)) return { runner, changed: false };
  if (runner.$comment !== undefined) return { runner: { ...runner, $comment: ladder }, changed: true };
  const out = {};
  let placed = false;
  for (const [key, value] of Object.entries(runner)) {
    if (key === 'modelPolicies' && !placed) {
      out.$comment = ladder;
      placed = true;
    }
    out[key] = value;
  }
  if (!placed) out.$comment = ladder;
  return { runner: out, changed: true };
}

/** The entry a capability name resolves to after the project and global layers merge, project keys winning. */
function mergedEntry(runner, global, name) {
  const project = runner.capabilities?.[name];
  const inherited = global.capabilities?.[name];
  if (!isPlainObject(project) && !isPlainObject(inherited)) return null;
  return { ...(isPlainObject(inherited) ? inherited : {}), ...(isPlainObject(project) ? project : {}) };
}

function convertBareVerbs(runner, global, registered, changes, reports) {
  for (const capability of registered) {
    const colon = capability.indexOf(':');
    if (colon < 0) continue;
    const verb = capability.slice(colon + 1);
    const bare = mergedEntry(runner, global, verb);
    if (!bare) continue;
    const own = mergedEntry(runner, global, capability);
    if (own) {
      // An entry with no usable `prefer` of its own used to hand the whole lookup to the bare verb's.
      if (!hasUsablePrefer(own) && hasUsablePrefer(bare)) reports.push({ kind: 'bare-verb-prefer-no-longer-inherited', capability, bareVerb: verb });
      continue;
    }
    if (bare.confinement !== undefined) {
      runner.capabilities = isPlainObject(runner.capabilities) ? runner.capabilities : {};
      runner.capabilities[capability] = { confinement: structuredClone(bare.confinement) };
      changes.push({ op: 'set', path: `runner.capabilities.${capability}.confinement`, to: bare.confinement, why: `copied from the bare verb "${verb}", whose fallback goes away` });
    }
    const notCopied = Object.keys(bare).filter((key) => key !== 'confinement' && !CATALOG_KEYS.has(key));
    if (notCopied.length > 0) reports.push({ kind: 'bare-verb-keys-not-copied', capability, bareVerb: verb, keys: notCopied });
  }
}

/** The tier a seat ran at under the old rule: the stronger of the unit's and the capability's rigor, through the table, under the ceiling. */
function tierBefore({ unitRigor, capabilityRigor, rigorTier, globalMaxTier }) {
  const rigor = unitRigor && capabilityRigor
    ? resolveStrongerRigor(unitRigor, capabilityRigor)
    : (unitRigor ?? capabilityRigor ?? 'standard');
  const tier = rigorTier[rigor] ?? 'standard';
  if (globalMaxTier === undefined) return tier;
  const capabilityTier = capabilityRigor ? rigorTier[capabilityRigor] : undefined;
  const ceiling = capabilityTier && tierRank(capabilityTier) > tierRank(globalMaxTier) ? capabilityTier : globalMaxTier;
  return tierRank(tier) > tierRank(ceiling) ? ceiling : tier;
}

/** The tier a seat runs at after conversion when nothing names one for the seat: the capability's, else the default, under its ceiling. */
function tierAfter({ entry, runner, global, defaultTier }) {
  const tier = entry?.tier ?? defaultTier;
  const ceiling = entry?.maxTier ?? runner.maxTier ?? global.maxTier;
  return ceiling !== undefined && tierRank(tier) > tierRank(ceiling) ? ceiling : tier;
}

function reportRigorEffects(runner, global, rigorTier, defaultTier, capabilityNames, workflows, reports) {
  const globalMaxTier = runner.maxTier ?? global.maxTier;
  const before = (capability, unitRigor) => tierBefore({ unitRigor, capabilityRigor: mergedEntry(runner, global, capability)?.rigor, rigorTier, globalMaxTier });
  const after = (capability) => tierAfter({ entry: runner.capabilities?.[capability], runner, global, defaultTier });

  // `fgos run --rigor`, `--rigor` on submit and add: a run rigor used to raise or lower the seat tier.
  // Capabilities that change the same way share one report row.
  const groups = new Map();
  for (const capability of capabilityNames) {
    const byRigor = {};
    for (const rigor of RIGOR_VALUES) {
      const was = before(capability, rigor);
      const now = after(capability);
      if (was !== now) byRigor[rigor] = { was, now };
    }
    if (Object.keys(byRigor).length === 0) continue;
    const key = JSON.stringify(byRigor);
    if (!groups.has(key)) groups.set(key, { byRigor, capabilities: [] });
    groups.get(key).capabilities.push(capability);
  }
  for (const { byRigor, capabilities } of groups.values()) reports.push({ kind: 'run-rigor-no-longer-sets-tier', capabilities, byRigor });

  for (const workflow of workflows ?? []) {
    const rigorFloor = workflow?.guide?.frameDefaults?.rigorFloor;
    if (rigorFloor !== undefined) {
      reports.push({ kind: 'guide-rigor-floor', workflow: workflow.id, rigorFloor, detail: 'a floor on what a case may propose; it never set a tier' });
    }
    for (const step of workflow?.steps ?? []) {
      for (const unit of step?.units ?? []) {
        const template = unit?.template ?? unit;
        if (template?.rigor === undefined) continue;
        reports.push({
          kind: 'unit-rigor-no-longer-sets-tier',
          workflow: workflow.id,
          unit: unit.id,
          capability: template.capability,
          rigor: template.rigor,
          was: before(template.capability, template.rigor),
          now: after(template.capability),
        });
      }
    }
  }
}

/** The `$comment` lines of the tier ladder the crate answers: one line per tier, weakest first. */
export function ladderCommentLines(definitions) {
  return definitions.map((d) => `${d.name}: ${d.work}; self-check: ${d.selfCheck}; e.g. ${d.examples}`);
}

/** Every capability name the loaded workflows' units use. */
export function registeredCapabilitiesOf(workflows) {
  const names = (workflows ?? []).flatMap((workflow) => workflow.steps.flatMap((step) => step.units.map((unit) => (unit.template ?? unit).capability)));
  return [...new Set(names.filter(Boolean))];
}

/** Where the project config is copied before a conversion writes it. */
export function seatBindingBackupPath(projectDir, now) {
  return `${sharedConfigFilePath(projectDir)}.pre-seat-binding-${now.toISOString().replace(/[-:.]/g, '')}`;
}

/**
 * The file step of `fgos setup`, run before any default is filled in: convert the project's runner
 * section, copy the file aside first, write it back with every other section untouched.
 *
 * @param {string} projectDir
 * @param {object} context
 * @param {string} [context.globalDir] where `~/.fgos/config.json` lives (read, never written)
 * @param {() => string[]} context.ladder the tier ladder text; read only when there is a runner section
 * @param {() => object[]} [context.workflows] loaded workflow definitions; read only when there is a runner section
 * @param {Date} [context.now]
 * @returns {{status: 'absent'|'unchanged'|'converted', backupPath?: string, changes: object[], reports: object[]}}
 */
export function convertProjectConfigFile(projectDir, { globalDir, ladder, workflows = () => [], now = new Date() }) {
  const shared = readSharedConfig(projectDir);
  if (!isPlainObject(shared.runner) || Object.keys(shared.runner).length === 0) return { status: 'absent', changes: [], reports: [] };
  const globalRunner = globalDir ? readSharedConfig(globalDir).runner ?? {} : {};
  const loaded = workflows();
  const result = convertRunnerConfig(shared.runner, { globalRunner, registeredCapabilities: registeredCapabilitiesOf(loaded), ladder: ladder(), workflows: loaded });
  if (result.changes.length === 0) return { status: 'unchanged', changes: [], reports: [] };
  const backupPath = seatBindingBackupPath(projectDir, now);
  fs.copyFileSync(sharedConfigFilePath(projectDir), backupPath, fs.constants.COPYFILE_EXCL);
  writeSharedConfig(projectDir, { ...shared, runner: result.runner });
  return { status: 'converted', backupPath, changes: result.changes, reports: result.reports };
}
