// workflow-stage-graphs.mjs — domain registry (per base-workflow-model D1-D3): a domain
// declares (a) its ordered macro-stage list, (b) which base-workflow step
// (Init/Clarify/Divide/Execute/Compound-learn, work-item-lifecycle-vision.md
// §2) each of its stages satisfies, and (c) the legal {from,to} stage-move
// edges for that domain — the same shape stage-fsm.mjs's own (pre-retrofit,
// coding-only) STAGE_TRANSITIONS carried, one level up.
//
// LAYER: kernel, same as work.mjs. work.mjs's validateWork must look up this
// registry (D3, item 4), and work.mjs is already the kernel layer — putting
// this module any shallower (e.g. "domain") would make work.mjs's import of
// it an upward import, which test/architecture.test.mjs's one-way-down check
// forbids. Every other consumer (frontier.mjs, loop.mjs, stage-fsm.mjs — all
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
// 'coding' reproduces work.mjs's pre-retrofit STAGES and stage-fsm.mjs's
// pre-retrofit STAGE_TRANSITIONS byte-for-byte (base-workflow-model D2, zero
// behavior change). The 'compound-learn' stage (compound-learn-enduser-docs
// D2) that used to close this list is RETIRED (work-item-status-delivered-
// retrospective-cleanup D11, supersedes RUL49/RUL50/RUL51) — the synthesis
// layer this stage used to gate is now the status `retrospective`'s job
// (see status-fsm.mjs), not a stage. Init is the only base-workflow step left
// outside the `stage` dimension.
//
// 'synthetic' (Slice 2, D1/D4) is an illustrative, disposable second domain
// that exists only to prove a non-coding domain runs on the same base FSM —
// it declares exactly one stage, mapped only to 'Execute'. It deliberately
// maps no stage to 'Clarify'/'Divide': synthetic has no test coverage for
// that path and staying single-stage/Execute-only keeps it that way on
// purpose, rather than being forced to exercise it. discovery.mjs/
// decompose.mjs now resolve the stage name for any domain via
// stageForStep(getDomain(work.domain), step) (tsk-3xo) — a domain reaching
// a Clarify/Divide-mapped stage is handled correctly, not silently
// overwritten; before tsk-3xo, the hardcoded coding literals underneath
// would throw a loud FsmError on a stage-name mismatch (stage.mjs's
// transitionStage), never a silent overwrite. Keeping 'synthetic'
// single-stage/Execute-only sidesteps that gap entirely rather than
// papering over it.

/** The domain every item without an explicit `domain` field belongs to —
 * matches today's implicit, exclusively-coding behavior (D2). */
export const DEFAULT_DOMAIN = 'coding';

export const DOMAINS = Object.freeze({
  coding: Object.freeze({
    // Pre-retrofit work.mjs STAGES value — 'compound-learn' retired (D11):
    // the synthesis layer it used to gate is now the status `retrospective`
    // (status-fsm.mjs), not a stage entry here.
    stages: Object.freeze(['clarify', 'decompose', 'executing']),
    // Maps each of coding's stages to the base-workflow step it satisfies.
    // Init and Compound-learn are the two base-workflow steps that now
    // happen outside `stage` entirely (intake before any stage exists;
    // synthesis on the status axis, per D11).
    stepMap: Object.freeze({
      clarify: 'Clarify',
      decompose: 'Divide',
      executing: 'Execute',
    }),
    // Pre-retrofit stage-fsm.mjs STAGE_TRANSITIONS value — the
    // executing -> compound-learn edge is retired along with the stage
    // itself (D11).
    transitions: Object.freeze([
      Object.freeze({ from: 'clarify', to: 'executing' }),
      Object.freeze({ from: 'clarify', to: 'decompose' }),
      Object.freeze({ from: 'decompose', to: 'executing' }),
    ]),
    // Which fgOS skill a session should load for each stage (str89-fgos-
    // domain-skills D3/D4) — `null` means "no skill, mechanical" (today's
    // exact default for every stage). `decompose` maps to `fgos-planning`
    // as the entry-point default only: fgos-routing's own early/late
    // judgment (unaffected by this field) still decides to load
    // `fgos-validating` instead once shape/children already exist — that
    // judgment is session-side prose, not data, so it has no entry here.
    // `executing` now resolves to `fgos-code-implement` (str89-fgos-domain-skills
    // D4/D6) — hand-authored via `distill` from bee-executing's
    // implement->verify->cap discipline, translated into fgOS's own
    // item/verify/`fgos return` vocabulary. `fgos-compounding` no longer
    // has a stage entry (D11) — it now triggers on status `retrospective`
    // instead, driven by the retrospective loop, not this stage->skill map.
    skillMap: Object.freeze({
      clarify: 'fgos-exploring',
      decompose: 'fgos-planning',
      executing: 'fgos-code-implement',
    }),
    // work-item-status-delivered-retrospective-cleanup D5/D8 (deferred
    // item from CONTEXT.md): does this domain's items go through a real
    // git worktree/merge, such that cleanup-harness.mjs's
    // checkMergeStillResolves has a real commit to verify? coding items
    // always carry a genuine headAtTake/headAtReturn/branchHeadAt* pair
    // from a real merge or return.
    worktreeBacked: true,
  }),
  synthetic: Object.freeze({
    stages: Object.freeze(['assembling']),
    stepMap: Object.freeze({
      assembling: 'Execute',
    }),
    transitions: Object.freeze([]),
    // Synthetic is illustrative/throwaway (see file header) and has never
    // loaded a skill — preserve that with an explicit null, not an absent
    // key, so skillForStage's behavior is identical either way.
    skillMap: Object.freeze({
      assembling: null,
    }),
    // No real worktree or merge ever happens for this domain (file header:
    // "illustrative, disposable... exists only to prove... runs on the
    // same base FSM") — the cleanup harness must not hold it to a
    // merge-still-resolves check it was never claiming in the first
    // place.
    worktreeBacked: false,
  }),
  // 'triage' (tsk-3xo) is a second illustrative, disposable domain, same
  // spirit as 'synthetic' above — it exists only as a regression fixture
  // proving a non-coding domain can cross Clarify/Divide-mapped stages
  // under non-coding-literal stage names (the exact gap tsk-3xo fixed:
  // discovery.mjs/decompose.mjs's moveStage calls and bin/fgos.mjs's CLI
  // gates used to hardcode 'clarify'/'decompose'/'executing' literally).
  // Mirrors coding's 3-step shape (Clarify -> Divide -> Execute) with
  // different literal names so a regression back to a hardcoded coding
  // literal fails loudly instead of silently passing.
  triage: Object.freeze({
    stages: Object.freeze(['triage', 'shaping', 'assembling']),
    stepMap: Object.freeze({
      triage: 'Clarify',
      shaping: 'Divide',
      assembling: 'Execute',
    }),
    transitions: Object.freeze([
      Object.freeze({ from: 'triage', to: 'assembling' }),
      Object.freeze({ from: 'triage', to: 'shaping' }),
      Object.freeze({ from: 'shaping', to: 'assembling' }),
    ]),
    // No skill ever loads for this fixture domain, same reasoning as
    // 'synthetic' above.
    skillMap: Object.freeze({
      triage: null,
      shaping: null,
      assembling: null,
    }),
    // Disposable, no real worktree/merge — same reasoning as 'synthetic'.
    worktreeBacked: false,
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
 * (frontier.mjs, loop.mjs) and a precondition check (stage-fsm.mjs) all rely on
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

/** Which fgOS skill (if any) a session should load for `stage` within
 * `domain` (str89-fgos-domain-skills D3/D4) — `null` both when the domain
 * declares no skill for that stage (today's exact default) and when the
 * stage is absent from the domain's `skillMap` entirely. Never throws. */
export function skillForStage(domain, stage) {
  return (domain.skillMap && domain.skillMap[stage]) ?? null;
}
