# plan.md — domain-workflow-skillmap-coverage-check (tsk-ogx)

Mode: **small**

Lane decided by `fgos-routing`'s Orient step (mechanical flag count, per its
own Mode-gate subsection): 0 flags apply among auth, authorization, data
model, audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain. This is
a single new `registerCheck({...})` entry in an existing, live-mutated
registry array (`src/setup/registrations.mjs`), following a pattern with
20+ already-registered siblings, touching one source file plus its own test
file.

No `CONTEXT.md` exists for this item — `discovery`'s own verdict came back
`clear` (see `RESEARCH.md`, Round 1), so `exploring` was skipped per the
domain's own `discovery -> planning` edge (tsk-30v). Everything this plan
assumes is therefore sourced directly from `RESEARCH.md`'s Round-1 findings
(cited by file:line below), not a locked `CONTEXT.md` decision.

## Approach

**Chosen path.** Add a pure, side-effect-free `check` function to
`src/setup/registrations.mjs` that walks every domain in `DOMAINS`
(`../state/workflow-stage-graphs.mjs`), collects every stage name reachable
through that domain's registered workflow(s), and confirms each one has an
own-property entry in that domain's `skillMap` — `Object.hasOwn`, not a
value read, so an explicit `null` (a deliberate "no skill for this stage"
answer) reads as covered while a genuinely absent key reads as a gap. This
mirrors `skillForStage`'s own doc comment (`workflow-stage-graphs.mjs:562-
568`, RESEARCH.md Round 1) almost exactly, except `skillForStage` folds
both cases to `null` on purpose for its hot-path caller — this check exists
specifically to keep that fold from hiding a real gap at doctor time.

Extract the gap-finding logic as its own exported, unit-testable function
(`findDomainWorkflowSkillMapGaps(domains = DOMAINS)`) rather than inlining
it straight into the `check` closure. Reason: `DOMAINS` is `Object.freeze`d
top to bottom (workflow-stage-graphs.mjs:52, 464), so there is no way to
construct a real "a domain's skillMap is missing a stage" fixture against
the production registry the way `checkWorkClassificationVocabulary`'s own
tests construct a bad *work item* via a raw `work.add` event
(`test/setup/checks.test.mjs:283-289`). An optional `domains` parameter,
defaulting to the real `DOMAINS`, is the smallest change that makes the
fail branch genuinely testable without touching production wiring at all
(`registerCheck`'s own `check` stays the same zero-arg call either way).

**Alternatives rejected.**
- *Inline the whole thing in the `check` closure, test only the pass path
  against real `DOMAINS`.* Rejected: a check whose fail-path message/format
  is never actually exercised is not a real test of the thing that matters
  most (a wrong or malformed failure message is exactly the outcome nobody
  would notice from a green suite). `findDomainWorkflowSkillMapGaps`'s
  parameter is the cheapest way to close that gap.
- *Require `domain.workflows` to exist and skip domains without it
  entirely.* Rejected: `domain.workflows` does not exist on `main` today
  for any domain — grep confirmed zero hits, `git merge-base --is-ancestor
  fgw/tsk-2t9c main` confirmed it is unmerged (RESEARCH.md Round 1). A
  check that only fires once `domain.workflows` lands would be dead code
  on `main` right now, contradicting "small, well-scoped feature" and
  leaving the actual, present-day risk (an item description's own framing:
  "a stage name with no skill owner at all") unchecked until some future
  merge.
- *Read `domain.stages` unconditionally, ignore `domain.workflows` even
  when present.* Rejected: once tsk-2t9c lands and a domain registers a
  SECOND workflow with stages `domain.stages` does not list, this check
  would silently stop covering it — exactly the gap the item exists to
  close, per its own description ("skillMap/roleGraph stay domain-level by
  design... so the real risk when a second workflow registers is a stage
  name with no skill owner at all").

**Files touched:**
- `src/setup/registrations.mjs` — add `DOMAINS` to the existing import from
  `../state/workflow-stage-graphs.mjs` (line 41); add
  `findDomainWorkflowSkillMapGaps`, `checkDomainWorkflowSkillMapCoverage`,
  and the `registerCheck({...})` call, placed directly after the existing
  `work-stage-vocabulary` registration (after line 643) — same
  "domain-registry drift" family as `checkWorkClassificationVocabulary`/
  `checkWorkStageVocabulary` immediately above it (lines 565-643).
- `test/setup/checks.test.mjs` — add `findDomainWorkflowSkillMapGaps` to
  the direct import from `../../src/setup/registrations.mjs` (line 45,
  same precedent `DEFAULT_IRON_LAW_LEVEL` already uses); add the new id to
  the exhaustive `DOCTOR_CHECKS has exactly the ... checks` list (line
  50-83) — that assertion enumerates every registered id by name and would
  otherwise fail as a false regression signal, not a real one; add a new
  `─── domain-workflow-skillmap-coverage (tsk-ogx) ───` test section.

**Order:** single-piece item, no split (see Decide-the-split below) — no
candidate-ordering comparison applies. `fgos graph --id tsk-ogx --json`
returned the whole-repo dependency graph (782 nodes, `topUnblock` skipped
server-side); nothing in it changes this item's own internal ordering
since it has no dependents and no dependencies (`deps: []`).

**Risk map:**

| Component | How risky | What would prove it |
|---|---|---|
| New `registerCheck` call | Low — 26 existing siblings register the same way; `registerCheck` throws loudly on a duplicate `id`, so a naming collision fails fast at module load, not silently | `node --test test/setup/checks.test.mjs` green, including the exhaustive id-list test |
| Reading `DOMAINS`/`domain.workflows` before tsk-2t9c merges | Low — read-only, defensive (`domain.workflows ?? domain.stages` fallback), verified by hand that today's 4 real domains all pass (RESEARCH.md Round 1) | The new check itself reports `passed: true` against the real, current `DOMAINS` |
| Forward-compat once tsk-2t9c's `domain.workflows` lands | Low, deferred — this item does not depend on that merge landing, and does not need to be revisited when it does (the `domain.workflows`-present branch already walks every named workflow's `stages`) | Covered by the synthetic-fixture test exercising the `workflows`-present branch now, ahead of the real merge |

**Impact-analysis capability gate** (CLAUDE.md): ran `fgos tool query
--capability impact-analysis --status present` — GitNexus registered and
`present` → posture **full**. Ran `impact({target: "DOMAINS", direction:
"upstream", file_path: "src/state/workflow-stage-graphs.mjs"})`: returned
`impactedCount: 0`, `risk: LOW`. Cross-checked per the gate's own standing
instruction ("a suspicious zero-result... is worth a quick grep/rg
cross-check before being trusted") — `grep -rl "\bDOMAINS\b" src test
--include="*.mjs"` found 13 files, so the tool's zero-result is a false
negative for this top-level `const` export, not a real "nothing depends on
this" finding. Treating the impact-analysis result as informational only,
not a blocker: this item only ADDS a new read-only consumer of `DOMAINS`
and modifies no existing function's body, so even the true 13-consumer
blast radius carries no proof obligation here — nothing about how any
existing consumer reads `DOMAINS` changes.

## Shape

One honest piece — see "Decide the split" below. Depth matches `small`: no
phased breakdown, a short before/after description of the one change plus
the concrete cases below.

**Concrete cases to prove:**
- **Every domain on `main` today already passes** (empty/no-gap case) —
  `coding`, `synthetic`, `triage`, `fixture-marketing` all have 100%
  `stages`-to-`skillMap` coverage (RESEARCH.md Round 1, verified by hand).
  This is the check's own pass-path test against the real registry.
- **A stage present in `skillMap` with an explicit `null` value must NOT be
  flagged** — the item's own explicit acceptance criterion
  ("an explicit `null` value is an acceptable... answer; only a MISSING key
  should fail"). Proven via a synthetic domain fixture distinguishing the
  two.
- **A stage genuinely absent from `skillMap` (no key at all) must be
  flagged**, distinct from the explicit-`null` case above — the actual
  regression class this check exists to catch.
- **A domain with no `workflows` field at all (every domain on `main`
  today) still gets checked via its own `stages` array** — the
  forward-compatible fallback that makes this check real today, not
  contingent on tsk-2t9c merging first.
- **A domain WITH `workflows` (the shape tsk-2t9c's own unmerged branch
  already implements) gets checked across every named workflow's own
  `stages`, not just the domain-level `stages` array** — proves the
  "ALL of a domain's registered workflows" half of the item's own
  description, ahead of that branch merging.
- **A domain that declares no `skillMap` at all is skipped, not flagged** —
  matches the existing precedent in `checkWorkClassificationVocabulary`
  (`if (!classification) continue`, registrations.mjs:575) for an axis a
  domain never opted into.

## Decide the split

One honest piece — no split. A single new check function plus its
registration plus its own tests is not separable into independently
workable pieces without the parts becoming meaningless on their own (the
check function has no caller until it is registered; the registration has
no test coverage until the tests exist). `fgos-coding-validating` should
read this as its `pass-through` verdict.

## Leave execution alone

**Verify command:** `node --test test/setup/checks.test.mjs` — already the
item's own `verify` field (set at discovery, `RESEARCH.md` Round 1; this is
a pass-through item, so per fgos-coding-planning step 5's sync rule: the
item's current `verify` is already this exact real command, not a
discovery-stage placeholder, so no `fgos edit --verify` sync is needed).

Neither touched file is a skill-prose path
(`.claude/skills/**/SKILL.md`/`.agents/skills/**/SKILL.md`/
`plugins/fgOS/skills/**/SKILL.md`), so `docs/how-to/write-verify-for-a-
skill-prose-change.md` does not apply. Neither touched file's verify
command needs a backslash-escaped backtick, so `docs/how-to/preserve-
shell-escapes-when-transcribing-a-verify-command.md` does not apply either.

## Outstanding questions

None
