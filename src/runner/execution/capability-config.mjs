// src/runner/execution/capability-config.mjs — the one door to the capability catalog (`runner.capabilities`).
// Architecture guard: pure. The only module that reads runner.capabilities; it answers per field and never
// returns an entry object.
//
// Two section rules, nothing else:
//   flat    `runner.capabilities`, own keys only. Every function below except the five named next.
//   lookup  `capabilityPersonaOf`, `capabilityRigorOf`, `minCheckersOf`, `isCapabilityDeclared` and
//           `hasPreferPool` read the entries that apply to a capability, most specific first: its exact key,
//           then its `<prefix>:*` entry (the text before the first colon; a name with no colon has no prefix
//           entry, and the bare verb of `code:review` is never a key). They also accept the config wrapped as
//           `{runner:{capabilities}}`, as the seat resolver always did.
// An "entry" is an own key whose value is a non-null object (an array counts, as the doctor rows treat it).

import { RIGOR_VALUES } from '../rigor.mjs';

const isEntry = (value) => value !== null && typeof value === 'object';
const isPlainObject = (value) => isEntry(value) && !Array.isArray(value);

/** The flat section when it is an object, else undefined. */
const sectionOf = (runner) => (isEntry(runner?.capabilities) ? runner.capabilities : undefined);

/** The exact entry of the flat section, or undefined. Private: entries never leave this module. */
const exactEntryOf = (runner, name) => {
  const section = sectionOf(runner);
  return section && typeof name === 'string' && Object.hasOwn(section, name) && isEntry(section[name]) ? section[name] : undefined;
};

/** The entries that apply to a capability, most specific first: exact key, then `<prefix>:*`. */
function entriesOf(cfg, capability) {
  if (typeof capability !== 'string' || !capability) return [];
  const section = cfg?.capabilities ?? cfg?.runner?.capabilities;
  if (!isEntry(section)) return [];
  const keys = capability.includes(':') ? [capability, `${capability.split(':')[0]}:*`] : [capability];
  return keys.filter((key) => Object.hasOwn(section, key) && isEntry(section[key])).map((key) => ({ key, entry: section[key] }));
}

const usablePrefer = (prefer) => (typeof prefer === 'string' ? prefer.trim() !== '' : Array.isArray(prefer) && prefer.length > 0);

// ---- the section ----------------------------------------------------------------------------------

/** The raw `capabilities` value of a runner section (undefined, or any value a config holds there). */
export const catalogOf = (runner) => runner?.capabilities;

/** The declared capability names (own keys); empty when the section is not an object. */
export const capabilityNamesOf = (runner) => {
  const section = sectionOf(runner);
  return section ? Object.keys(section) : [];
};

/** Whether `name` is an own key holding an entry. */
export const hasCapabilityEntry = (runner, name) => exactEntryOf(runner, name) !== undefined;

/** Whether a capability has an entry of its own or a `<prefix>:*` one. */
export const isCapabilityDeclared = (cfg, capability) => entriesOf(cfg, capability).length > 0;

/**
 * The registered name a capability goes by: its own key, else the first key (insertion order) that lists it
 * in `aliases`; undefined when nothing registers it.
 */
export function registeredCapabilityOf(runner, name) {
  if (hasCapabilityEntry(runner, name)) return name;
  return capabilityNamesOf(runner).find((key) => {
    const aliases = exactEntryOf(runner, key)?.aliases;
    return Array.isArray(aliases) && aliases.includes(name);
  });
}

// ---- fields read by exact-then-prefix lookup -------------------------------------------------------

/** The persona a capability defaults to, with the key that declares it; null when none. */
export function capabilityPersonaOf(cfg, capability) {
  const found = entriesOf(cfg, capability).find(({ entry }) => entry.persona);
  return found ? { persona: found.entry.persona, key: found.key } : null;
}

/** The rigor a capability declares: its exact entry, else the `<prefix>:*` entry's. */
export function capabilityRigorOf(cfg, capability) {
  const rigor = entriesOf(cfg, capability).map(({ entry }) => entry.rigor).find((r) => r !== undefined);
  if (rigor !== undefined && !RIGOR_VALUES.includes(rigor)) {
    throw new RangeError(`invalid capability rigor "${rigor}" for "${capability}". Valid rigors: [${RIGOR_VALUES.join(', ')}]`);
  }
  return rigor;
}

/** The first defined `minCheckers` (an empty list is defined: it clears the default) with its key; null when none. */
export function minCheckersOf(cfg, capability) {
  const found = entriesOf(cfg, capability).find(({ entry }) => entry.minCheckers !== undefined);
  return found ? { key: found.key, minCheckers: found.entry.minCheckers } : null;
}

/** Whether the exact entry or its prefix entry names at least one executor in `prefer`. */
export const hasPreferPool = (cfg, capability) => entriesOf(cfg, capability).some(({ entry }) => usablePrefer(entry.prefer));

// ---- fields read from the exact entry --------------------------------------------------------------

/** The exact entry's `minCheckers`, raw; undefined when absent. */
export const ownMinCheckersOf = (runner, name) => exactEntryOf(runner, name)?.minCheckers;

/** The exact entry's `verify`, raw. */
export const capabilityVerifyOf = (runner, capability) => exactEntryOf(runner, capability)?.verify;

/** The exact entry's `confinement`, raw. */
export const capabilityConfinementOf = (runner, capability) => exactEntryOf(runner, capability)?.confinement;

/** The exact entry's `serves`, raw. */
export const capabilityServesOf = (runner, name) => exactEntryOf(runner, name)?.serves;

/** The exact entry's `prefer`, raw (a string, a list or undefined). */
export const preferOf = (runner, capability) => exactEntryOf(runner, capability)?.prefer;

/** Whether the exact entry names at least one executor in `prefer`. */
export const hasOwnPreferPool = (runner, name) => usablePrefer(exactEntryOf(runner, name)?.prefer);

/** The description of the exact entry, else of its `<prefix>:*` entry; null when neither has one. */
export function capabilityDescriptionOf(runner, capability) {
  if (typeof capability !== 'string') return null;
  const own = exactEntryOf(runner, capability)?.description;
  if (own !== undefined && own !== null) return own;
  const prefixed = capability.includes(':') ? exactEntryOf(runner, `${capability.split(':')[0]}:*`)?.description : undefined;
  return prefixed ?? null;
}

// ---- the slice the seat-binding crate reads --------------------------------------------------------

const SCOPE_GROUPS = Object.freeze(['roles', 'personas', 'seats']);

/** `prefer` in the shape the crate reads: a list of executor ids and `{executor, invocation}` pins. */
const preferList = (prefer) => (typeof prefer === 'string' ? [prefer] : prefer);

function scopeOf(entry) {
  const out = {};
  if (entry.tier !== undefined) out.tier = entry.tier;
  if (entry.prefer !== undefined) out.prefer = preferList(entry.prefer);
  return out;
}

function bindingFieldsOf(entry) {
  const out = {};
  for (const key of ['tier', 'maxTier']) if (entry[key] !== undefined) out[key] = entry[key];
  if (entry.prefer !== undefined) out.prefer = preferList(entry.prefer);
  for (const group of SCOPE_GROUPS) {
    if (!isPlainObject(entry[group])) continue;
    out[group] = Object.fromEntries(Object.entries(entry[group]).filter(([, scope]) => isPlainObject(scope)).map(([name, scope]) => [name, scopeOf(scope)]));
  }
  return out;
}

/** Per capability, the binding fields the crate reads: tier, maxTier, prefer, roles, personas, seats. */
export const bindingTasteOf = (runner) => Object.fromEntries(
  Object.entries(runner?.capabilities ?? {}).filter(([, entry]) => isPlainObject(entry)).map(([name, entry]) => [name, bindingFieldsOf(entry)]),
);
