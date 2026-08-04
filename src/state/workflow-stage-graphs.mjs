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
    //
    // `retrospective` (decision record 0027, D5 — `docs/history/phase-2-
    // status-category-schema/DISCUSSION.md`'s §"skillMap['retrospective']
    // per-domain" task and its D5 log entry, vòng 11): the same `skillMap`
    // field reused for a fourth key, this one a `status` name rather than a
    // `stage` name — the two vocabularies never collide (`retrospective` is
    // not, and will never be, one of coding's three stage names), and
    // `skillForStage`/`statusCategoryFor`'s own precedent already treats
    // "which lookup table a key belongs to" as the caller's concern, not
    // this object's. D5 rejected adding a second field (e.g. a standalone
    // `retrospectiveSkill`) specifically because `skillMap` already exists
    // for exactly this "stage/status -> skill" shape — a second field would
    // just be the same lookup duplicated. `fgos-compounding` here is the
    // current, correct, zero-regression default (coding's synthesis skill
    // does not change): `fgOS:retro-next` used to call `fgos-compounding`
    // unconditionally; per D5 it now resolves this key
    // (`getDomain(item.domain).skillMap.retrospective`) instead, falling
    // back to `fgos-compounding` when a domain declares none, mirroring
    // `skillForStage`'s own null-safe shape. `cleanup` gets no entry here
    // at all (D5, confirmed by reading `fgos cleanup`'s real implementation
    // in `bin/fgos.mjs`/`cleanup-harness.mjs`): it is pure harness, no skill
    // ever loads for it, and its own per-domain difference is already fully
    // carried by the existing `worktreeBacked` field below.
    skillMap: Object.freeze({
      clarify: 'fgos-exploring',
      decompose: 'fgos-planning',
      executing: 'fgos-code-implement',
      retrospective: 'fgos-compounding',
    }),
    // work-item-status-delivered-retrospective-cleanup D5/D8 (deferred
    // item from CONTEXT.md): does this domain's items go through a real
    // git worktree/merge, such that cleanup-harness.mjs's
    // checkMergeStillResolves has a real commit to verify? coding items
    // always carry a genuine headAtTake/headAtReturn/branchHeadAt* pair
    // from a real merge or return.
    worktreeBacked: true,
    // statusLabels (decision record 0027, D2/D3 — supersedes base-workflow-
    // model D1-D3's "domain never touches the status/transition table", but
    // ONLY for the six statuses below; status-fsm.mjs's TRANSITIONS is the
    // one FSM every domain still shares, unchanged by this map). Maps each
    // of coding's six front-segment statuses (the ones BEFORE `delivered`
    // — see status-fsm.mjs's own header comment for the full chain) to a
    // `statusCategory` (work.mjs's STATUS_CATEGORIES) — a lossy compression
    // domain-agnostic readers (frontier's `ready` filter, rollup, outcome/
    // friction, discovery-judge — not migrated yet, tsk-38t-4) can read
    // without learning coding's own status vocabulary. Coding is not
    // RENAMING any status here (0027 D1: domain gets the RIGHT to relabel,
    // never the obligation — coding keeps all six literal names byte for
    // byte, zero migration); this table exists purely to declare the
    // category each keeps mapping to. `doing`/`blocked`/`awaiting-human`
    // collapse to one shared `in-progress` category rather than three
    // separate ones — precedent: `docs/history/status-proposed-rename/
    // CONTEXT.md` D3 ("a new top-level status only when it has a distinct
    // structural effect on the frontier/dependency graph; otherwise merge,
    // and let `reason`/`ask`/`answer` carry the finer distinction") — none
    // of the three appears in frontier.mjs's `ready` filter or
    // `RESOLVED_STATUSES` today, so none earns a category of its own.
    // `wontfix` keeps its own literal name (coding's synonym for
    // cancel/decline/out-of-scope) but always maps to `canceled` — the
    // category a domain that chose a different word (`declined`,
    // `out-of-scope`) would map to as well (D2). The FOUR tail-segment
    // statuses (`delivered`/`retrospective`/`cleanup`/`done`) deliberately
    // have NO entry here at all — not even a `null` placeholder — mirroring
    // `skillMap`'s own precedent for "this key legitimately does not apply"
    // (`skillForStage` already treats an absent key and an explicit `null`
    // identically): D1 fixes those four as a shared, unrelabelable chain
    // every domain uses verbatim, so they need no per-domain category —
    // literal status stays sufficient for them forever. Frozen onto the
    // event payload at write time by store.mjs's addWork/moveWork, never
    // derived on read (see STATUS_CATEGORIES's own doc comment, work.mjs,
    // for the L3 replay-from-zero reasoning) — this table is read exactly
    // once per write, through `statusCategoryFor` below, never at replay.
    statusLabels: Object.freeze({
      todo: 'todo',
      doing: 'in-progress',
      blocked: 'in-progress',
      'awaiting-human': 'in-progress',
      'awaiting-approval': 'review',
      wontfix: 'canceled',
    }),
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

/** The `statusCategory` (work.mjs's STATUS_CATEGORIES) `status` maps to
 * within `domain`'s own `statusLabels` table (decision record 0027, D2/D3)
 * — `undefined`, deliberately NOT `null`, both when the domain declares no
 * `statusLabels` at all (every domain but `coding` today — `synthetic`/
 * `triage` never move status through a domain-owned table) and when
 * `status` is absent from a declared `statusLabels` entirely (coding's own
 * four tail-segment statuses, which carry no entry there by design — see
 * `DOMAINS.coding.statusLabels`'s own comment). `undefined` here is the
 * caller's (`store.mjs`) signal to stamp nothing onto the event payload,
 * mirroring `skillForStage`'s `null`-for-absent shape one level down: never
 * throws, safe to call unconditionally. */
export function statusCategoryFor(domain, status) {
  return domain?.statusLabels?.[status];
}
