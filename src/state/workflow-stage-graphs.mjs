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
    // tsk-1w7 D10 (docs/history/fanout-and-delegation-rubric/CONTEXT.md):
    // two new stages sit between `clarify` and `decompose` — `discovery`
    // (machine-alone research, fgos-researching) and `exploring` (the
    // machine+human Socratic decision-lock D3 calls the "pha máy+người"
    // half — the deep-dive work `clarify` itself used to do before this
    // item). `clarify` is KEPT (D10 — never renamed), but its own SKILL
    // changes below: it now runs the lighter self-judging pass D13
    // describes, not the old Socratic lock.
    stages: Object.freeze(['clarify', 'discovery', 'exploring', 'decompose', 'executing']),
    // Maps each of coding's stages to the base-workflow step it satisfies.
    // Init and Compound-learn are the two base-workflow steps that now
    // happen outside `stage` entirely (intake before any stage exists;
    // synthesis on the status axis, per D11). `discovery`/`exploring` are
    // NEW coding-specific intermediate stages with no base-workflow step of
    // their own (tsk-1w7 D10) — same "outside the 5-step vocabulary"
    // treatment Init/Compound-learn already get, so they carry no entry
    // here at all rather than colliding with `clarify`'s own 'Clarify' key
    // (`stageForStep`'s `Object.keys(stepMap).find(...)` only ever needs
    // ONE stage per step to stay unambiguous — verified by reading its body
    // directly, tsk-1w7 impact-analysis posture: degraded).
    stepMap: Object.freeze({
      clarify: 'Clarify',
      decompose: 'Divide',
      executing: 'Execute',
    }),
    // Pre-retrofit stage-fsm.mjs STAGE_TRANSITIONS value — the
    // executing -> compound-learn edge is retired along with the stage
    // itself (D11) — PLUS four new edges for the D10 chain (tsk-1w7/
    // tsk-puz): `clarify -> discovery -> exploring -> decompose`, the
    // sequential chain a NEW item walks, and one direct `clarify ->
    // exploring` jump (tsk-puz D12) for a PRE-EXISTING item being migrated
    // straight into `exploring` because it is already parked mid-Socratic-
    // question (`status: 'awaiting-human'`) — such an item is already at
    // the machine+human decision-lock stage; routing it through `discovery`
    // first would misrepresent it as needing a machine-alone research pass
    // it never asked for. The three pre-existing edges stay exactly as they
    // were: `clarify -> executing` is still dormant-but-legal (stage-fsm.mjs's
    // own header comment), and `clarify -> decompose` / `decompose ->
    // executing` are still the literal edges discovery.mjs/decompose.mjs
    // fire today — neither file is in tsk-1w7's or tsk-puz's own declared
    // footprint, so both edges must stay legal exactly as-is.
    transitions: Object.freeze([
      Object.freeze({ from: 'clarify', to: 'executing' }),
      Object.freeze({ from: 'clarify', to: 'decompose' }),
      Object.freeze({ from: 'decompose', to: 'executing' }),
      Object.freeze({ from: 'clarify', to: 'discovery' }),
      Object.freeze({ from: 'discovery', to: 'exploring' }),
      Object.freeze({ from: 'exploring', to: 'decompose' }),
      Object.freeze({ from: 'clarify', to: 'exploring' }),
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
    // tsk-1w7 D10/D13: `clarify` now runs the NEW lightweight self-judging
    // skill (`fgos-clarifying`, tsk-v4b/P2 — "chỉ hỏi khi không hiểu", D13)
    // instead of the old deep Socratic lock; that old behavior lives on
    // under the NEW `exploring` stage name instead, still served by the
    // SAME unchanged `fgos-exploring` skill file. `discovery` runs the new
    // stage-agnostic research skill (`fgos-researching`, tsk-2t9/P1). Both
    // skill files already exist on disk (P1/P2 merged before this item —
    // exactly the dependency plan.md's own P4 row records: "Chờ: P1, P2").
    skillMap: Object.freeze({
      clarify: 'fgos-clarifying',
      discovery: 'fgos-researching',
      exploring: 'fgos-exploring',
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
    // parkReason (tsk-3w3 follow-up, logged decision): a SECOND, narrower
    // per-domain map alongside `statusLabels` — not a replacement for it.
    // `statusLabels`/`statusCategoryFor` answer "how far along is this item"
    // for frontier/rollup/compound-learn (5-value lifecycle axis); this
    // answers a different question a domain-agnostic DRIVING LOOP needs —
    // "why did the loop stop, and what should it tell its caller" — for
    // exactly the three statuses `fgos-coding-driving`'s own stop-condition
    // checks distinguish. `blocked` and `awaiting-human` collapse to the
    // SAME `statusLabels` category (`in-progress`) but need OPPOSITE
    // handling (a system-detected failure vs. a person-posed question,
    // reported differently to the caller) — reading `statusCategory` here
    // would erase exactly the distinction the loop needs, which is why this
    // is its own map, not a reuse of `statusLabels`. Coding keeps its own
    // literal status names unchanged (zero behavior change, same shape as
    // `stageForStep`'s tsk-3xo substitution) — this only gives
    // `fgos-coding-driving` a resolved lookup to call instead of a
    // hardcoded `status === 'blocked'` comparison, so a future domain could
    // in principle relabel these three without silently breaking the loop's
    // own stop-condition semantics. Only `coding` gets a real entry today:
    // no other domain in this registry has ever been driven through
    // `fgos-coding-driving` for real (D9/D10 — never generalized ahead of
    // evidence), so declaring values for `synthetic`/`triage`/
    // `fixture-marketing` here would be exactly the "declared but never
    // exercised" gap this file's own header already warns against for
    // `synthetic`'s Clarify/Divide mapping.
    parkReason: Object.freeze({
      blocked: 'system-error',
      'awaiting-human': 'human-question',
      'awaiting-approval': 'natural-finish',
    }),
    // classification: the per-domain vocabulary `work.kind`/`work.risk` are
    // allowed to say. THIRD per-domain map in this entry, same absent-key-
    // means-not-declared shape `skillMap`/`statusLabels`/`parkReason` already
    // use — a domain that declares none keeps work.mjs's pre-existing
    // "any non-empty string" rule, so `synthetic`/`triage`/`fixture-marketing`
    // are unaffected. Classification is domain-OWNED (the rubric that decides
    // these values is coding-specific: "typo/rename/doc fix" vs "auth,
    // payments, data-integrity"), which is why it lives here rather than as a
    // second global frozen list next to work.mjs's own TIERS.
    //
    // `risk` is `light`/`standard`/`heavy` — deliberately the SAME vocabulary
    // as TIERS, not a leak of it. Two live consumers already read exactly
    // these three values and would silently mis-handle any other set:
    //   - decompose.mjs's HEAVY_RISK gate (`work.risk === 'heavy'`, D3(b))
    //     forces a root through human confirmation before it is allowed to
    //     split — 74 live items depend on it firing;
    //   - priority-formula.mjs's RISK_DISCOUNTS (`{light:1, standard:0.85,
    //     heavy:0.6}`) feeds the ranking formula, falling back to `standard`
    //     for anything it does not recognize.
    // classify.mjs's own D5 (`const risk = tier`) is the third: it documents
    // "risk is derived from the same keyword signal as tier (mirrors the tier
    // name)". A `low`/`medium`/`high` vocabulary here would leave all three
    // silently degraded rather than loudly broken — the exact failure mode
    // this enum exists to make impossible. Items already stored carrying
    // `low`/`medium`/`high` stay grandfathered (validateWorkShape's
    // `touchedFields`, tsk-1ne D1/D2): only a write that actually touches the
    // field is held to this list.
    classification: Object.freeze({
      kind: Object.freeze(['bug', 'chore', 'design', 'docs', 'feature', 'task']),
      risk: Object.freeze(['light', 'standard', 'heavy']),
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
  // 'fixture-marketing' (tsk-38t-7, the capstone proof for decision record
  // 0027/tsk-38t's whole Phase 2 multi-domain schema — docs/history/phase-2-
  // status-category-schema/DISCUSSION.md §"Test domain giả lập thứ 2 chứng
  // minh thiết kế") is a clearly-fixture SECOND production-shaped domain,
  // disposable like 'synthetic'/'triage' but built to cover the one gap
  // those two never close: neither ever declares a `statusLabels` or
  // `skillMap.retrospective` entry, so nothing before this item ever
  // exercised 0027's D2/D3/D5 machinery end to end for a domain other than
  // 'coding'. Reuses coding's exact stages/stepMap/transitions shape
  // verbatim (this domain's own job is to prove status/category/skill/field
  // generalize, not to add new stage-machinery coverage — that's already
  // 'synthetic'/'triage''s job) — this also keeps `transitions` non-empty,
  // unlike 'synthetic''s deliberately-empty array (see that entry's own
  // block comment above), which the item's own recorded verify command
  // depends on.
  'fixture-marketing': Object.freeze({
    stages: Object.freeze(['clarify', 'decompose', 'executing']),
    stepMap: Object.freeze({
      clarify: 'Clarify',
      decompose: 'Divide',
      executing: 'Execute',
    }),
    transitions: Object.freeze([
      Object.freeze({ from: 'clarify', to: 'executing' }),
      Object.freeze({ from: 'clarify', to: 'decompose' }),
      Object.freeze({ from: 'decompose', to: 'executing' }),
    ]),
    // No stage skill ever loads for this fixture domain (same reasoning as
    // 'synthetic'/'triage' above) — only `retrospective` (a STATUS key
    // reusing this same field, 0027 D5) gets a real, distinct value below.
    // 'fgos-fixture-retro' is deliberately NOT a real skill file anywhere
    // in `.claude/skills/` (per this item's own constraint: no CLI flags,
    // skill files, or production docs for this fixture) — its only job is
    // to be a value that is NOT 'fgos-compounding', proving
    // `getDomain('fixture-marketing').skillMap.retrospective` reads THIS
    // domain's own table rather than silently falling back to coding's.
    skillMap: Object.freeze({
      clarify: null,
      decompose: null,
      executing: null,
      retrospective: 'fgos-fixture-retro',
    }),
    // No real worktree/merge for this domain — same reasoning as
    // 'synthetic'/'triage' above; keeps this item's own `fgos cleanup`
    // e2e proof from needing a real branch/merge to verify.
    worktreeBacked: false,
    // statusLabels (0027 D2/D3, mirrors DOMAINS.coding.statusLabels's own
    // doc comment above): the field this whole item exists to exercise for
    // a domain other than coding. Judgment call, documented per this item's
    // own instructions — the canceled-equivalent slot is deliberately NOT
    // `wontfix` here, unlike coding: `wontfix` is kept (still a legal FSM
    // edge, still mapped to `canceled`, so it stays inert-but-correct), but
    // `blocked` ALSO maps to `canceled` in this domain — this fixture's own
    // business framing is that a `blocked` item here represents a
    // stakeholder's outright decline (closed, not a temporary park), unlike
    // coding's `blocked` (active, retryable, maps to `in-progress`). This
    // is the strongest real proof available within today's constraints:
    // status-fsm.mjs's TRANSITIONS is ONE shared flat table for every domain
    // (0027's own "Quyết định" section, reconfirmed by reading status-fsm.mjs
    // and work.mjs's STATUSES directly — both are closed to the same 10
    // literal names, so no domain can introduce a genuinely new status
    // literal like a hypothetical "declined"; only D1-D3's original
    // "domain sở hữu TOÀN BỘ bảng transition" framing, explicitly REJECTED
    // in DISCUSSION.md §1/§6, would have allowed that). Mapping a DIFFERENT
    // literal (`blocked`, not `wontfix`) into `canceled` is the real,
    // store-backed way to prove `isResolvedStatus` (frontier.mjs) reads
    // `item.statusCategory` generically rather than a hardcoded `'wontfix'`
    // string comparison — a regression that hardcoded the literal instead
    // would make this domain's `blocked` items wrongly stay "unresolved"
    // forever, exactly the bug this table exists to catch. `doing`/
    // `awaiting-human` keep coding's own `in-progress` grouping (same
    // structural-effect-on-frontier reasoning DISCUSSION.md §6 gives for
    // coding); `awaiting-approval`/`todo` are unchanged too — only the
    // canceled slot needed to differ to prove the point D2 exists for.
    statusLabels: Object.freeze({
      todo: 'todo',
      doing: 'in-progress',
      blocked: 'canceled',
      'awaiting-human': 'in-progress',
      'awaiting-approval': 'review',
      wontfix: 'canceled',
    }),
    // fieldSchema (0027 D6): small, deliberately toy schema so this item's
    // e2e test can prove BOTH an accepted and a rejected `domainFields`
    // shape through the real store (validateDomainFields, work.mjs) for a
    // domain other than the throwaway test-only object
    // test/state/domain-fields.test.mjs already used for the same purpose.
    fieldSchema: Object.freeze({ campaign: 'string', budget: 'number' }),
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

/** The stage `item` should be treated as being at, whether or not `stage`
 * was ever explicitly written (D8 lazy-default) — `item.stage ??
 * stageForStep(domain, 'Execute')`, the same expression `frontier.mjs`/
 * `stage-fsm.mjs`/`impact.mjs` already apply independently. Read-surface
 * verbs (`bin/fgos.mjs`) call this so a reader can tell "explicitly at
 * this stage" from "defaulted here because `stage` was never set" instead
 * of seeing an absent field with no explanation either way. */
export function effectiveStage(item, domain) {
  return item.stage ?? stageForStep(domain, 'Execute');
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

/** Which stop-reason (if any) `status` represents within `domain`'s own
 * `parkReason` table (tsk-3w3 follow-up) — `'system-error'`,
 * `'human-question'`, `'natural-finish'`, or `undefined` when `status`
 * isn't a park state for this domain (no entry declared at all, same as
 * `statusCategoryFor`'s shape one field over). A domain-agnostic driving
 * loop reads this instead of comparing `status` against a coding literal,
 * so it can tell "stopped because a person needs to answer" apart from
 * "stopped because something broke" even though both currently share the
 * same `statusCategory` (`in-progress`) — `parkReason` and `statusLabels`
 * answer different questions and are never meant to collapse into one
 * table. Never throws, safe to call unconditionally. */
export function parkReasonForStatus(domain, status) {
  return domain?.parkReason?.[status];
}

/** The vocabulary `field` (`'kind'` or `'risk'`) is allowed to take within
 * `domain`'s own `classification` table — a frozen array, or `undefined` when
 * this domain declares no vocabulary for that field (every domain but
 * `coding` today). `undefined` is the caller's (`work.mjs`) signal to fall
 * back to the pre-existing "any non-empty string" rule rather than to reject,
 * mirroring `statusCategoryFor`/`parkReasonForStatus`'s own absent-key shape
 * one field over. Never throws, safe to call unconditionally. */
export function classificationVocabulary(domain, field) {
  return domain?.classification?.[field];
}
