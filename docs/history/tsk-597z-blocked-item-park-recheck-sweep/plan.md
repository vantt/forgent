# plan.md — tsk-597z: diagnostic-only sweep for status:blocked items whose park-causing check may now resolve

Mode: **small** — a few files (one new read-only `fgos` verb + its pure
helper + a test), no gray areas: RESEARCH.md round 1 already found the
exact mechanism to reuse and confirmed it is safe to call read-only
outside its original module. Flag count against `fgos-routing`'s Mode
gate: 1 (public contracts — this adds one new `fgos <verb>` CLI surface,
same class as `fgos stale`/`fgos conflicts`; every other flag — auth,
data model, audit/security, external systems, cross-platform, existing
covered behavior, weak proof, multi-domain — does not apply). 0–1 flags →
tiny/small; picked small over tiny because it is a genuinely new small
capability (new verb + helper + test), not a one-line change to an
existing one.

No `CONTEXT.md` exists for this item — `fgos-coding-discovering`'s own
verdict came back `clear`, which skips `exploring` (and therefore skips
ever writing a `CONTEXT.md`) by design, landing straight here per
`fgos-routing`'s own routing table. This plan's evidence base is
`RESEARCH.md` (round 1, this same folder) plus the item's own
`description`, which already names its own scope and named risks in
detail.

## Approach

**Chosen path:** add one new read-only `fgos` verb — `fgos recheck-blocked`
— that, for every item currently `status: blocked`, re-runs
`checkMergeStillResolves(repoRoot, item, { view, id })`
(`src/state/cleanup-harness.mjs`, exported, already read-only —
`git merge-base --is-ancestor`, no mutation, per its own file header) and
reports which ones now come back `{ ok: true }`. Never calls `moveWork`,
never transitions anything — report-only, per the item's own scope note.

**Why this is the smallest honest piece (RESEARCH.md round 1, finding 1/2):**
`checkMergeStillResolves` is already called exactly this way — against a
live `status: blocked` item, outside `cleanup-harness.mjs` itself — by the
`catchup` verb's own eligibility gate (`bin/fgos.mjs:4432`). That call
site already proves two things this plan leans on directly:
- the function's signature is not restricted to items literally sitting in
  `status: cleanup`;
- re-running it live, rather than string-matching the stored `reason`
  text, is the correct and already-precedented way to answer "would this
  item's park-causing check now pass" — sidestepping named risk #1 in the
  item's own description (fragile trigger key) entirely for this
  specific check, because the live boolean is trusted instead of the
  stored text (`bin/fgos.mjs:4415-4432`'s own comment says so explicitly).

**Alternatives rejected:**
- *Wiring a live re-check into `runWatch`'s poll cycle* — rejected per the
  item's own named risk #2 (flap loop against a transiently-resolvable git
  ref) and risk #4 (no persistent watch daemon runs in this repo's normal
  usage today, so it would not reliably fire). A one-shot, human/session-
  invoked report verb has neither problem.
- *Auto-transitioning a matching item straight to unblocked* — rejected
  per the item's own scope note and named risk #3 (check-then-transition
  TOCTOU against concurrent rebases/prunes in the shared main checkout).
  Report-only removes the "then-transition" half of that race entirely —
  a person (or `fgos catchup <id>`, which already re-checks live at the
  moment it actually acts) does the acting.
- *String-matching the stored `reason`/`detail` text to scope candidates*
  — rejected; RESEARCH.md round 1 finding 2 shows the `cleanup ->
  blocked` path's `reason` is full free text specifically to avoid this,
  and the existing `catchup` precedent already proves re-running the
  check live is both simpler and correct.

**Risk map:**

| Component | Risk | What would prove it |
|---|---|---|
| Reusing `checkMergeStillResolves` outside `cleanup-harness.mjs` a second time | Low — GitNexus impact analysis (below) confirms LOW risk, 2 direct upstream callers, one named execution flow (`assessCleanupReadiness`); the function is already read-only and already called from a second site (`catchup`) with no prior incident | `npm test` on `cleanup-harness.test.mjs` and `bin/fgos.mjs`'s existing catchup tests stay green after adding a third call site |
| Candidate-set scoping (which `blocked` items are even worth checking) | Standard — RESEARCH.md round 1's one open item: nothing on the item's live record says whether its most recent transition was `cleanup -> blocked` | New verb calls `checkMergeStillResolves` against every `status: blocked` item unconditionally (it degrades to `{ok:true, ...}`="nothing to verify" for an item with no recorded merge commit, per the function's own doc comment) rather than trying to pre-filter by transition history — proof: the verb's own test asserts a non-merge-parked blocked item (e.g. reason `awaiting-human`-adjacent) is reported as `ok:true`/not-actionable rather than crashing or being silently dropped |
| New CLI surface shape | Low — follows the exact `case 'stale'`/`case 'conflicts'` pattern already in `bin/fgos.mjs` (pure read, `return {...}`, no new event kind) | verb's own test calls it via the same harness `stale`/`conflicts` tests use |

**Impact-analysis posture:** `full` — `fgos tool query --capability
impact-analysis --status present` returned `gitnexus` as `present`. Ran
`mcp__gitnexus__impact({target: "checkMergeStillResolves", direction:
"upstream", summaryOnly: true, repo: "/home/vantt/projects/forgentX"})`:
`risk: "LOW"`, `impactedCount: 2`, one named affected process
(`assessCleanupReadiness`). This is the proof point for the first risk-map
row above.

**Files likely touched:**
- `src/state/cleanup-harness.mjs` — no change needed to
  `checkMergeStillResolves` itself; import it from the new verb's module.
- `bin/fgos.mjs` — add `case 'recheck-blocked':` (or fold into an existing
  advisory verb if `fgos-coding-validating`'s reality check finds a
  better-fitting existing surface — left as an implementation choice, not
  a locked one here, since `plan.mjs` conventions favor reusing an
  existing verb shape over multiplying new ones when one already fits).
- A new or existing `*-harness.mjs`-style pure helper (e.g.
  `src/state/blocked-recheck-harness.mjs`) holding the actual sweep logic,
  mirroring `cleanup-harness.mjs`'s own module shape (pure functions,
  `execFileSync`-based git reads, no fs writes).
- A matching test file for the new helper/verb.

**Order:** single piece, no ordering dependency between files beyond
"helper before verb wiring." `fgos graph --json`'s `criticalPath`/
`topUnblock` were not consulted for ordering multiple candidate pieces,
since step 4 below finds no split is needed — there is only one piece.

## Shape

One honest piece of work, not split. The whole scope is: read every
`status: blocked` item, call the existing read-only
`checkMergeStillResolves` against each, and print/report which ones
return `ok: true` — an advisory the same shape as `fgos stale`/`fgos
conflicts` already ship.

Concrete cases the implementation and its test should cover, at a depth
matching `small`:
- **Empty case** — no items are currently `status: blocked`: verb returns
  an empty report, not an error.
- **A genuinely still-blocked item** (`checkMergeStillResolves` still
  fails) — must NOT be reported as resolved.
- **An item with no recorded merge commit at all** (never claiming a
  git-verifiable merge) — `checkMergeStillResolves` treats this as
  "nothing to verify," `ok: true` by the function's own documented
  behavior; the report must not mislabel this as "would now unblock" in a
  way that invites a wrong manual action — it should be distinguishable
  from a real "ancestry check now passes" case (e.g. a separate reason
  code, or excluded from the report entirely — `fgos-coding-implement`'s own
  judgment call, sketched here as a case worth a test either way).
- **Existing behavior that must not regress** — `catchup`'s own use of
  `checkMergeStillResolves` (`bin/fgos.mjs:4432`) and
  `assessCleanupReadiness`'s own use (`cleanup-harness.mjs`) must keep
  passing unchanged; this item only adds a third call site, never edits
  the function's own behavior.
- **No mutation, ever** — the new verb's own test should assert it makes
  no `moveWork`/`addFriction`/`addDecision` call (a plain read producing a
  report only), directly enforcing the item's own "report-only, never
  auto-transitioning" scope.

## Split decision

No split. One honest piece: a new read-only verb plus its pure helper and
test. `fgos-coding-validating` reads this as the pass-through verdict.

## Verify sync

Pass-through item — checked the item's own current `verify`
(`node bin/fgos.mjs list --id tsk-597z --json --dir ...`): it currently
reads the discovery-stage default `"chưa xác định -- bổ sung ở planning"`
(not one of `FALLBACK_VERIFY`/`RETIRED_P14_PLACEHOLDER` literally, but
plainly a still-unset placeholder awaiting this step, per the item's own
`verify` field text). Syncing it now to a real, runnable command:

```
node bin/fgos.mjs recheck-blocked --json --dir "$root"
```

(the exact verb name is an implementation choice `fgos-coding-implement`
may adjust; whichever name it lands on, this is the command this plan's
verify should end up naming — `fgos-coding-implement` should update
`work.verify` to match if it picks a different final name).

## Outstanding questions

None
