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
// plan.mjs (renamed from decompose.mjs, tsk-403 D15) now resolve the
// stage name for any domain via
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

// tsk-2t9c D7/D7a: `codingDomain` starts as a plain (not yet frozen) object
// so `workflows.feature` below can hold the EXACT SAME array/object
// references as the top-level `stages`/`stepMap`/`transitions` fields —
// reference identity, not merely deep-equality, is the strongest possible
// proof that registering the workflow hierarchy changed zero behavior for
// zero items (D7a: mechanism-first, `feature` carries today's graph
// byte-for-byte, no new workflow shape exists yet to be wrong about).
// Frozen at the bottom of this block, before it's placed into `DOMAINS`.
// planningEdges (tsk-2t9c D16): declared once, assigned to both
// `roleGraph.edges.planning` and `roleGraph.edges.decompose` below by
// reference -- see that assignment's own comment for why the legacy
// `decompose` stage name needs the identical edge set.
const planningEdges = Object.freeze([
  Object.freeze({ from: 'implementer', to: 'researcher', reason: 'consult', mode: 'sync' }),
  Object.freeze({ from: 'implementer', to: 'human-advisor', reason: 'advise', mode: 'async' }),
]);
const codingDomain = {
    // tsk-1w7 D10 (docs/history/fanout-and-delegation-rubric/CONTEXT.md):
    // two new stages sit between `clarify` and `decompose` — `discovery`
    // (machine-alone research; owned by `fgos-coding-discovering` since
    // tsk-tku, D7 — see the `skillMap` comment below) and `exploring` (the
    // machine+human Socratic decision-lock D3 calls the "pha máy+người"
    // half — the deep-dive work `clarify` itself used to do before this
    // item). `clarify` is KEPT (D10 — never renamed), but its own SKILL
    // changes below: it now runs the lighter self-judging pass D13
    // describes, not the old Socratic lock.
    // tsk-403 D11/D18: `decompose` is renamed to `planning` — the verb
    // (`fgos decompose`->`fgos plan`) and launcher (`/fgOS:decompose`->
    // `/fgOS:plan`) follow the same rename, but the verdict values
    // `decompose`/`pass-through` stay byte-for-byte (they name an outcome,
    // not a stage). `decompose` itself STAYS in `stages` as a LEGACY,
    // DRAIN-ONLY alias (D18): 3 items were open on this exact stage name at
    // rename time (`tsk-42i` blocked, `tsk-3at` awaiting-human, `tsk-3m6`
    // doing) and no verb can relabel a live item's `stage` field
    // (`EDITABLE_FIELDS`, store.mjs, has no `stage` entry) — dropping the
    // name outright would strand them (`skillForStage` -> null -> driver
    // reads "no skill, stop" forever). No NEW item may ever land on
    // `decompose` again (enforced below: it carries no `stepMap` entry).
    // Follow-up: delete this alias once zero items remain at stage
    // `decompose` (out of `tsk-403`'s own footprint).
    //
    // tsk-qod D1/D2: `clarify` retires as a stage ENTIRELY — moved to a
    // pre-item-creation Init helper (`fgos-clarifying`, called by
    // `/fgOS:submit` before an item exists, D2), never a stage-skill
    // again. UNLIKE `decompose` (tsk-403 D18), `clarify` does NOT keep a
    // legacy drain-only alias here: the 90 items that were open on it at
    // rename time were migrated off first, for real
    // (`scripts/migrate-clarify-split.mjs`, tsk-qod D1 — "resolve it
    // definitively via migration, not leave another alias to clean up
    // later"), so there is nothing left to strand. `stages[0]` is now
    // `discovery` — the domain's own new entry point for an existing item
    // (`src/runner/loop.mjs`'s runner-discovered-item creation falls back
    // to `stages[0]` for exactly this reason).
    stages: Object.freeze(['discovery', 'exploring', 'decompose', 'planning', 'executing']),
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
    // directly, tsk-1w7 impact-analysis posture: degraded). Legacy
    // `decompose` (tsk-403 D18) joins that same "no entry here" set now —
    // it is drain-only, so it must never satisfy `Divide` for a NEW item;
    // `planning` (the renamed stage) takes over that key instead. `clarify`
    // (tsk-qod D1/D2) carries no entry here anymore either — it is no
    // longer a stage at all, not merely drain-only.
    stepMap: Object.freeze({
      planning: 'Divide',
      executing: 'Execute',
    }),
    // Pre-retrofit stage-fsm.mjs STAGE_TRANSITIONS value — the
    // executing -> compound-learn edge is retired along with the stage
    // itself (D11). Historically this array's edges all originated from
    // `clarify` (tsk-1w7/tsk-puz's own "sequential chain a NEW item
    // walks": `clarify -> discovery -> exploring -> decompose`, tsk-403
    // D11/D18's later `-> planning` update). tsk-qod D1/D2 retires
    // `clarify` as a stage ENTIRELY (not merely drain-only, unlike
    // `decompose`) — `discovery` is now the domain's own entry point
    // (`stages[0]`). tsk-30v (D2/D3/D6): a NEW item's path branches on its
    // own discovery verdict instead of walking one fixed chain — `clear`
    // skips `exploring` entirely (`discovery -> planning` directly),
    // `unclear` goes through `exploring` first (`discovery -> exploring ->
    // planning`). `decompose`-named edges stay exactly as they were
    // (tsk-403 D18, still drain-only legacy, unaffected by this item).
    transitions: Object.freeze([
      // `clarify -> discovery` / `clarify -> exploring` (tsk-qod D1) —
      // NOT a routing alias like `decompose`'s (D18): `clarify` carries no
      // entry anywhere else here (`stages`/`skillMap`/`stepMap` all lost
      // it), so `validateWorkShape` refuses `stage: 'clarify'` on any item
      // creation and no live item can ever legitimately reach this edge
      // through ordinary flow again. Kept ONLY so `moveStage`'s FSM check
      // (`stage-fsm.mjs`'s `transitionStage`, which always requires a
      // registered edge, no bypass) stays legally able to advance a
      // historical `clarify`-stage item forward — the exact shape
      // `scripts/migrate-clarify-split.mjs` (and its own test suite,
      // which re-creates that historical shape via a raw `work.add` event
      // to verify the script for real) still needs, even though the real
      // 90-item production migration this item ran already completed.
      Object.freeze({ from: 'clarify', to: 'discovery' }),
      Object.freeze({ from: 'clarify', to: 'exploring' }),
      // Legacy `decompose` edges (tsk-403 D18) — kept exactly as they were
      // so the items still open on that stage name can keep draining out
      // through them; never used by a new item since `decompose` carries
      // no `stepMap` entry above.
      Object.freeze({ from: 'decompose', to: 'executing' }),
      Object.freeze({ from: 'exploring', to: 'decompose' }),
      Object.freeze({ from: 'discovery', to: 'exploring' }),
      // tsk-30v (D2/D6, D-local-1): new edge — a `clear` discovery verdict
      // skips `exploring` and lands directly on `planning`. This tuple did
      // not exist before this item; `nextDiscoveryEdge` could not legally
      // pick it without this registration (`stage-fsm.mjs`'s CAS check has
      // no bypass).
      Object.freeze({ from: 'discovery', to: 'planning' }),
      // `planning` edges (tsk-403 D11) — the active chain a NEW item walks.
      Object.freeze({ from: 'exploring', to: 'planning' }),
      Object.freeze({ from: 'planning', to: 'executing' }),
    ]),
    // Which fgOS skill a session should load for each stage (str89-fgos-
    // domain-skills D3/D4) — `null` means "no skill, mechanical" (today's
    // exact default for every stage). `planning` maps to `fgos-coding-planning`
    // as the entry-point default only: fgos-routing's own early/late
    // judgment (unaffected by this field) still decides to load
    // `fgos-coding-validating` instead once shape/children already exist —
    // that judgment is session-side prose, not data, so it has no entry
    // here.
    // `executing` now resolves to `fgos-coding-implement` (str89-fgos-domain-skills
    // D4/D6, renamed again per tsk-403 D15) — hand-authored via `distill`
    // from bee-executing's implement->verify->cap discipline, translated
    // into fgOS's own item/verify/`fgos return` vocabulary. `fgos-coding-
    // compounding` no longer has a stage entry (D11) — it now triggers on
    // status `retrospective` instead, driven by the retrospective loop,
    // not this stage->skill map.
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
    // just be the same lookup duplicated. `fgos-coding-compounding`
    // (renamed from `fgos-compounding` per tsk-403 D15) here is the
    // current, correct, zero-regression default (coding's synthesis skill
    // does not change): `fgOS:retro-next` used to call it
    // unconditionally; per D5 it now resolves this key
    // (`getDomain(item.domain).skillMap.retrospective`) instead, falling
    // back to `fgos-coding-compounding` when a domain declares none,
    // mirroring `skillForStage`'s own null-safe shape. `cleanup` gets no
    // entry here
    // at all (D5, confirmed by reading `fgos cleanup`'s real implementation
    // in `bin/fgos.mjs`/`cleanup-harness.mjs`): it is pure harness, no skill
    // ever loads for it, and its own per-domain difference is already fully
    // carried by the existing `worktreeBacked` field below.
    // tsk-1w7 D10/D13: the old deep Socratic lock lives on under the
    // `exploring` stage name, still served by the SAME `fgos-coding-exploring`
    // skill file (renamed from `fgos-exploring` per tsk-403 D15, content
    // unchanged). `discovery` is owned by `fgos-coding-discovering`
    // (tsk-tku, D7/D8) — a real skill chủ that calls the stage-agnostic
    // helper `fgos-researching` (tsk-2t9/P1, unchanged, D4/D9) as many
    // times as it needs, then self-judges `clear`/`unclear` and calls the
    // engine verb itself, same as every other stage owner. `clarify`
    // (tsk-1w7 D10/D13's own
    // lightweight self-judging skill, `fgos-clarifying`) carries no entry
    // here anymore (tsk-qod D1/D2) — it moved to a pre-item-creation Init
    // helper (`/fgOS:submit`'s own launcher calls it directly, D2), never a
    // stage-skill loaded through this map again.
    // tsk-403 D15: 5 stage skills gain a `coding-` prefix
    // (`fgos-exploring`->`fgos-coding-exploring`,
    // `fgos-planning`->`fgos-coding-planning`,
    // `fgos-code-implement`->`fgos-coding-implement`,
    // `fgos-compounding`->`fgos-coding-compounding`; `fgos-validating`
    // never had a `skillMap` entry of its own — it runs as
    // `fgos-coding-planning`'s own second phase, D16). `fgos-clarifying`/
    // `fgos-researching` are unchanged (D9 — helpers, not stage skills).
    // Legacy `decompose` (D18, above) is repointed to the SAME renamed
    // skill `planning` now resolves to — the alias must still resolve to a
    // skill that actually exists on disk after the rename, not the old,
    // now-deleted `fgos-planning` directory name.
    skillMap: Object.freeze({
      discovery: 'fgos-coding-discovering',
      exploring: 'fgos-coding-exploring',
      decompose: 'fgos-coding-planning',
      planning: 'fgos-coding-planning',
      executing: 'fgos-coding-implement',
      retrospective: 'fgos-coding-knowledge',
    }),
    // taskSpecMap (tsk-2t9c D6/D9): stage -> task-spec id, the "skillMap
    // points stage -> (task-spec, skill)" half of A-lite. Purely additive
    // alongside skillMap (same field-independence style `classification`/
    // `statusLabels` already use one field over) -- a stage absent here
    // simply has no task-spec yet, never a validation error. The file each
    // id resolves to lives at docs/task-specs/coding/<id>.md; doctor's
    // task-specs-resolve check (src/setup/registrations.mjs) is what keeps
    // this map and the files on disk from drifting apart silently.
    taskSpecMap: Object.freeze({
      discovery: 'judge-ambiguity',
      exploring: 'lock-decisions',
      planning: 'shape-plan',
      executing: 'implement-item',
      retrospective: 'compound-learn',
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
      // work-item-backlog-status D3: `backlog` maps to its OWN category,
      // never folded into `todo`'s — that separation is the whole mechanism
      // keeping a not-yet-committed idea out of frontier's positive-match
      // `ready` filter (isTodoStatus, frontier.mjs) with no frontier-side
      // code change.
      backlog: 'backlog',
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
    // roleGraph (tsk-2t9c D1/D3/D4/D5/D8/D9): the multi-role team harness's
    // legality table for coding. THIRD orthogonal axis on a work item
    // (status x stage x role/holder), opt-in per-domain — a domain that
    // declares no roleGraph never sees a `holder` field or a `handoff`
    // verb (src/state/handoff.mjs reads this exact shape). `defaultRole`
    // is what a coding item's `holder` lazily resolves to when unset,
    // mirroring `stage`'s own D8 lazy-default precedent one field over.
    //
    // `edges` names every LEGAL call for a given stage: `{ from, to,
    // reason, mode }`. This is not new behavior -- it names four
    // interactions coding already runs today in implicit form, so this
    // registration changes nothing about how coding is actually worked,
    // only makes the pattern checkable and loggable:
    //   consult (sync)  == fgos-researching, called from discovery/exploring/planning/executing
    //   assist  (sync)  == subagent fanout (Agent tool, fgos-fanout)
    //   review  (async) == fgos return -> awaiting-approval, the approve/reject loop
    //   advise  (async) == fgos ask/answer -> awaiting-human
    // `discovery` carries ONLY `consult` (tsk-2t9c D14 correction, found
    // wiring fgos-coding-discovering: it genuinely calls fgos-researching
    // from this stage -- the "machine-only" framing above described the
    // ABSENCE of human interaction at this stage, never the absence of a
    // role interaction altogether; `advise`/`ask` never fires here by the
    // skill's own hard rule, but `consult` was a real gap, not a design
    // choice). `edges.discovery` staying its own key (never falling back
    // to `exploring`'s) is what lets it declare exactly this one edge and
    // no others.
    roleGraph: Object.freeze({
      roles: Object.freeze(['implementer', 'researcher', 'reviewer', 'helper', 'human-advisor']),
      defaultRole: 'implementer',
      callstackCap: 3,
      edges: Object.freeze({
        discovery: Object.freeze([
          Object.freeze({ from: 'implementer', to: 'researcher', reason: 'consult', mode: 'sync' }),
        ]),
        exploring: Object.freeze([
          Object.freeze({ from: 'implementer', to: 'human-advisor', reason: 'advise', mode: 'async' }),
          Object.freeze({ from: 'implementer', to: 'researcher', reason: 'consult', mode: 'sync' }),
        ]),
        planning: planningEdges,
        executing: Object.freeze([
          Object.freeze({ from: 'implementer', to: 'researcher', reason: 'consult', mode: 'sync' }),
          Object.freeze({ from: 'implementer', to: 'helper', reason: 'assist', mode: 'sync' }),
          Object.freeze({ from: 'implementer', to: 'reviewer', reason: 'review', mode: 'async' }),
          Object.freeze({ from: 'implementer', to: 'human-advisor', reason: 'advise', mode: 'async' }),
          Object.freeze({ from: 'reviewer', to: 'researcher', reason: 'consult', mode: 'sync' }),
          Object.freeze({ from: 'reviewer', to: 'human-advisor', reason: 'advise', mode: 'async' }),
        ]),
        // tsk-2t9c D16 (independent review of D14/D15): `decompose` is the
        // legacy pre-tsk-403-rename name for `planning`, served by the
        // exact same skill (`skillMap.decompose === skillMap.planning ===
        // 'fgos-coding-planning'`, below) and drain-only -- no new item is
        // ever born there. `fgos-coding-planning`'s own consult wiring
        // (D15) makes no distinction between the two stage names, so a
        // legacy item still draining at `decompose` needs the identical
        // edge set or its first consult attempt is refused with "no legal
        // call edges ... at stage 'decompose'" purely because of which of
        // the two names the item happens to carry. `planningEdges` below
        // is the SAME array reference assigned twice, not a copy -- same
        // discipline `workflows.feature.stages === codingDomain.stages`
        // already uses further down, so the two can never drift apart.
        decompose: planningEdges,
      }),
    }),
};

// workflows/defaultWorkflow/workflowFor (tsk-2t9c D7/D7a): the hierarchy
// domain -> N workflow -> item, mechanism-first. `feature` is not a copy
// of the fields above -- it IS them, same references, so there is no
// second place these three arrays could ever drift out of sync. Only
// `feature` is registered today (D7a): `workflowFor` starts empty, so
// EVERY kind resolves to `defaultWorkflow` via `resolveWorkflow` below --
// the selector runs for real on every lookup, it simply has one
// destination until a second workflow (e.g. `bugfix`/`lightweight`, D7a's
// own deferred follow-on) is registered by a later item.
codingDomain.workflows = Object.freeze({
  feature: Object.freeze({
    stages: codingDomain.stages,
    stepMap: codingDomain.stepMap,
    transitions: codingDomain.transitions,
  }),
});
codingDomain.defaultWorkflow = 'feature';
codingDomain.workflowFor = Object.freeze({});
Object.freeze(codingDomain);

export const DOMAINS = Object.freeze({
  coding: codingDomain,
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
    // to be a value that is NOT 'fgos-coding-compounding', proving
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
    // and work.mjs's STATUSES directly — both are closed to the same 11
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

/** Resolve `kind` to `domain`'s own workflow entry (tsk-2t9c D7/D7a) —
 * `domain.workflows[domain.workflowFor[kind] ?? domain.defaultWorkflow]`,
 * folding an absent/unrecognized kind to the default, never throwing —
 * same never-throw fold every sibling resolver in this module keeps.
 * `undefined` when `domain` declares no `workflows` at all (every domain
 * but `coding` today), the same "this axis does not apply here" shape
 * `roleGraphFor`/`classificationVocabulary` already use one field over.
 *
 * `domain.stages`/`stepMap`/`transitions` stay valid to read directly
 * even once a domain registers a SECOND, genuinely different workflow —
 * not because they happen to be reference-identical to
 * `resolveWorkflow(domain, domain.defaultWorkflow)` today (D16 retracts
 * that framing; it was only ever true by coincidence of nothing else
 * being registered yet), but because `kind` — the only thing that could
 * make an item's own resolved workflow diverge from the domain's default
 * — is locked the moment `status` leaves `todo` (`editWork`'s own guard,
 * `src/state/store.mjs`). An item only ever walks a stage graph once
 * claimed (`status: 'doing'` onward), and by then `kind` can no longer
 * change under it — so a caller resolving an item's stage graph through
 * `resolveWorkflow(domain, work.kind)` and a caller reading
 * `domain.stages` directly agree for that item's ENTIRE walk, without
 * needing a separate frozen `work.workflow` field or a second write
 * door. This still means: a caller that genuinely needs the correct
 * per-item graph should resolve through `resolveWorkflow`, not assume
 * `domain.stages` is always right — the guarantee above is why direct
 * reads happen to be SAFE today, not a license to keep skipping the
 * resolver once a real second workflow exists to differ. */
export function resolveWorkflow(domain, kind) {
  if (!domain?.workflows) return undefined;
  const name = (kind !== undefined && domain.workflowFor?.[kind]) || domain.defaultWorkflow;
  return domain.workflows[name] ?? domain.workflows[domain.defaultWorkflow];
}

/** The stages within `domain` that `fgos discover` can legally act on — the
 * domain's own Clarify-mapped stage (if it still declares one) plus
 * `discovery`/`exploring` when the domain registers both.
 *
 * tsk-qod D1/D2: `stageForStep(domain, 'Clarify')` resolves to `undefined`
 * for a domain that retired `clarify` entirely (today: only `coding`) —
 * `.filter(Boolean)` drops that phantom entry instead of letting
 * `undefined` leak out as if it were a real, valid stage name. A domain
 * that still has a real Clarify-mapped stage (e.g. `triage`) is unaffected.
 *
 * tsk-64h: lives here, in the registry module, rather than in
 * `src/intake/discovery.mjs` where it started. It is a pure question about
 * a domain's own `stages`/`stepMap` — and `src/state/discover-pool.mjs`
 * (layer `domain`) needs the same answer, which it could not get from a
 * `use-case`-layer module without the upward import
 * `test/architecture.test.mjs` forbids. One definition, three callers
 * (`discover-pool.mjs`, `discovery.mjs`'s own `nextDiscoveryEdge`, and
 * `bin/fgos.mjs`'s `discover` precondition), no literal copy anywhere. */
export function discoverableStages(domain) {
  const clarifyStage = stageForStep(domain, 'Clarify');
  const hasDiscoveryExploring = domain.stages?.includes('discovery') && domain.stages?.includes('exploring');
  return (hasDiscoveryExploring ? [clarifyStage, 'discovery', 'exploring'] : [clarifyStage]).filter(Boolean);
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

/** `domain`'s own `roleGraph`, or `undefined` when the domain declares
 * none (tsk-2t9c D1) -- every domain but `coding` today. `undefined`,
 * deliberately not `null`, matching `classificationVocabulary`'s own
 * absent-key shape one field over: callers treat "this domain has no
 * role axis at all" and "this domain declared roleGraph but left a field
 * empty" as different questions. */
export function roleGraphFor(domain) {
  return domain?.roleGraph;
}

/** The legal call edges for `fromRole` at `stage` within `domain`'s
 * `roleGraph` -- always an array, `[]` when the domain has no roleGraph,
 * the stage has no edges declared, or `fromRole` has none at that stage.
 * Never throws (same never-throw contract every sibling helper in this
 * module keeps, for the same hot-dispatch-path reason). */
export function legalCallEdges(domain, stage, fromRole) {
  const edgesForStage = domain?.roleGraph?.edges?.[stage];
  if (!Array.isArray(edgesForStage)) return [];
  return edgesForStage.filter((edge) => edge.from === fromRole);
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
