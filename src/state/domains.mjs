// domains.mjs — domain registry (per base-workflow-model D1-D3): a domain
// declares (a) its ordered macro-stage list, (b) which base-workflow step
// (Init/Clarify/Divide/Execute/Compound-learn, work-item-lifecycle-vision.md
// §2) each of its stages satisfies, and (c) the legal {from,to} stage-move
// edges for that domain — the same shape stage.mjs's own (pre-retrofit,
// coding-only) STAGE_TRANSITIONS carried, one level up.
//
// LAYER: kernel, same as work.mjs. work.mjs's validateWork must look up this
// registry (D3, item 4), and work.mjs is already the kernel layer — putting
// this module any shallower (e.g. "domain") would make work.mjs's import of
// it an upward import, which test/architecture.test.mjs's one-way-down check
// forbids. Every other consumer (frontier.mjs, loop.mjs, stage.mjs — all
// "domain" layer, shallower than kernel) importing a kernel-layer module is
// the same direction they already use for work.mjs itself, so this is not a
// new import shape, only a new file.
//
// PURE: no fs import, no disk writes. The one side effect this module ever
// performs is a diagnostic `console.warn` when a genuinely unrecognized
// domain value is folded to the default (see resolveDomainName) — never a
// throw, so every hot-path consumer (frontier.mjs, loop.mjs) can call it
// unconditionally.
//
// 'coding' reproduces work.mjs's pre-retrofit STAGES and stage.mjs's
// pre-retrofit STAGE_TRANSITIONS byte-for-byte (D2, zero behavior change).
//
// 'synthetic' (Slice 2, D1/D4) is an illustrative, disposable second domain
// that exists only to prove a non-coding domain runs on the same base FSM —
// it declares exactly one stage, mapped only to 'Execute'. It deliberately
// maps no stage to 'Clarify'/'Divide': discovery.mjs/decompose.mjs are
// hardcoded to coding's literal stage names and were never retrofitted
// (approach.md's Boundary correction) — a domain reaching a Clarify/Divide-
// mapped stage would get its stage silently overwritten with a coding
// literal outside its own stages list. Keeping 'synthetic' single-stage/
// Execute-only sidesteps that gap entirely rather than papering over it.

/** The domain every item without an explicit `domain` field belongs to —
 * matches today's implicit, exclusively-coding behavior (D2). */
export const DEFAULT_DOMAIN = 'coding';

export const DOMAINS = Object.freeze({
  coding: Object.freeze({
    // Byte-for-byte the pre-retrofit work.mjs STAGES value.
    stages: Object.freeze(['clarify', 'decompose', 'executing']),
    // Maps each of coding's stages to the base-workflow step it satisfies.
    // Coding's stage list never carries an Init or Compound-learn value —
    // those two steps happen outside the `stage` dimension (intake, and
    // post-done learning capture) — so only the middle three steps appear.
    stepMap: Object.freeze({
      clarify: 'Clarify',
      decompose: 'Divide',
      executing: 'Execute',
    }),
    // Byte-for-byte the pre-retrofit stage.mjs STAGE_TRANSITIONS value.
    transitions: Object.freeze([
      Object.freeze({ from: 'clarify', to: 'executing' }),
      Object.freeze({ from: 'clarify', to: 'decompose' }),
      Object.freeze({ from: 'decompose', to: 'executing' }),
    ]),
  }),
  synthetic: Object.freeze({
    stages: Object.freeze(['assembling']),
    stepMap: Object.freeze({
      assembling: 'Execute',
    }),
    transitions: Object.freeze([]),
  }),
});

/**
 * Resolve a (possibly absent or unrecognized) domain name to a real key in
 * `DOMAINS`. Absent (`undefined`/`null`) reads as `DEFAULT_DOMAIN` silently —
 * the same lazy-default shape as `stage`'s D8 precedent, and NOT a warning
 * case: every existing item today has no `domain` field at all, and that is
 * expected, not an anomaly. A genuinely unrecognized non-empty value also
 * folds to `DEFAULT_DOMAIN`, but never silently: it reports itself via
 * `onUnrecognized` when supplied, otherwise a single `console.warn` line.
 * This function never throws, by design — callers in a hot dispatch loop
 * (frontier.mjs, loop.mjs) and a precondition check (stage.mjs) all rely on
 * that.
 */
export function resolveDomainName(name, { onUnrecognized } = {}) {
  if (name === undefined || name === null) return DEFAULT_DOMAIN;
  if (Object.hasOwn(DOMAINS, name)) return name;
  if (typeof onUnrecognized === 'function') {
    onUnrecognized(name);
  } else {
    console.warn(`fgos: unrecognized domain "${name}" — folding to "${DEFAULT_DOMAIN}".`);
  }
  return DEFAULT_DOMAIN;
}

/** Resolve straight to the domain's registry entry — never `undefined`, per
 * the same fail-safe as `resolveDomainName`. */
export function getDomain(name, opts) {
  return DOMAINS[resolveDomainName(name, opts)];
}

/** The stage name (if any) within `domain` whose `stepMap` entry equals
 * `step` — e.g. `stageForStep(DOMAINS.coding, 'Execute')` -> `'executing'`.
 * Returns `undefined` if the domain declares no stage for that step. */
export function stageForStep(domain, step) {
  return Object.keys(domain.stepMap).find((stage) => domain.stepMap[stage] === step);
}
