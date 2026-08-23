# tsk-3o3: /fgOS:retro-loop — plan.md

## Mode

**standard** (revised — see "Revision" below; was `small`).

Flag count: 2 of the mode-gate flags apply.
- auth / authorization: no — no auth surface touched.
- data model: no — reuses the existing `delivered/retrospective/cleanup`
  status chain as-is; no schema/FSM change.
- audit/security: no.
- external systems: no.
- **public contracts: yes** — restoring `fgos compound <id> --doc-type
  --doc-path` (see Revision) puts a CLI verb back on the surface other
  docs/skills already reference as canonical (`docs/specs/work-state.md`
  RUL51-53, tutorials, how-tos — grep-confirmed live citations).
- cross-platform: no.
- **existing covered behavior: yes** — `bin/fgos.mjs` and
  `src/cli/command-registry.mjs` are existing, tested files; restoring
  removed code there risks interacting with the current `move`/
  `retrospective`/`cleanup` verb set, not just adding something net-new.
- weak proof around the area: no — impact-analysis posture is **full**
  (GitNexus present); see the impact-analysis note below for what that
  means concretely for the restored verb.
- multi-domain: no — single domain (`coding`, fgOS's own tooling).

2 flags at "standard" tier, not 4+/hard-gate, so this stays `standard`,
not `high-risk`.

## Revision (post-`fgos-coding-validating` reality-gate FAIL)

The original `small`-mode plan (below, kept for the record) assumed
`fgos-coding-compounding`'s step 3 (`fgos compound <id> --doc-type <quadrant>
--doc-path <path>`) already worked and only its *trigger-description
prose* was stale. `fgos-coding-validating`'s reality gate disproved this
concretely:

- `git log -S"case 'compound'" -- bin/fgos.mjs` → `fcfbae5
  feat(tsk-1zi): retire compound-learn stage and the compound verb`. That
  commit's own message: "`bin/fgos.mjs`: removes `case 'compound'`
  entirely... Rewrites every test... to use `addOutcome` directly for
  docType/docPath capture."
- `addOutcome` (`src/state/store.mjs:782`) is a JS function reachable
  from test code via direct import — **no CLI verb exposes it**. Grepping
  every `case '...'` in `bin/fgos.mjs` (45 verbs, full list read) confirms
  none calls `addOutcome` with a `docType`/`docPath` payload.
- So `fgos-coding-compounding/SKILL.md` step 3, as written today, calls a verb
  that does not exist — it would fail on the very first real item
  `retro-next` hands it, with `bin/fgos.mjs`'s own "unknown verb" error.

User's direction (2026-08-02): restore the removed verb rather than
invent a new mechanism — `git show fcfbae5 -- bin/fgos.mjs
src/cli/command-registry.mjs` recovers the exact removed code, which
already 90% fits: the old `case 'compound'` bundled two things — (a) a
stage move to the now-retired `compound-learn` stage, and (b) the
`docType`/`docPath` tag write via `addOutcome`. Only (b) is still needed;
(a) is dead weight now that the trigger is status `retrospective`, not a
stage. Restoration keeps the **same verb name and flags**
(`fgos compound <id> --doc-type <quadrant> --doc-path <path>`) — this is
what makes it a true restoration, not a new invention: every existing doc
that already cites this exact command (`docs/specs/work-state.md`
RUL51-53, `docs/specs/enduser-docs-authoring.md`,
`docs/tutorials/walking-a-heavy-item-through-a-3-child-split.md`, two
`docs/how-to/*.md` files, `docs/explanation/
pure-fgos-state-items-cannot-close-through-return.md`) stays correct with
**zero further doc changes**, instead of orphaning all of it under a
new name.

Adapted from the removed code (not copied verbatim):
- Precondition: `item.status === 'retrospective'` (was
  `'awaiting-approval'`) — the new trigger status, not the retired one.
- No stage move at all (the old `moveStage(dir, { to: 'compound-learn' })`
  branch is deleted outright — there is no such stage to move to).
- Validate `--doc-type` via the still-exported `assertValidDocType`
  (`src/state/store.mjs:759`, untouched by `fcfbae5`) before any write,
  same as before.
- On success: `addOutcome(dir, { id, docType, ...(docPath && {docPath}) })`
  directly — no stage-aware branching needed since there is only ever one
  path now (no more "already at compound-learn" special case, because
  that concept is gone).
- Command-registry manifest entry (`src/cli/command-registry.mjs`):
  restore with a corrected `description` (status `retrospective`, not
  "Move an awaiting-approval work item into the compound-learn stage").

## Approach

Mirror `tsk-dvc`'s (cleanup-loop) shape exactly, substituting the
retrospective half of the chain, per CONTEXT.md's locked scope and D1,
plus the verb restoration from the Revision above:

0. `bin/fgos.mjs` + `src/cli/command-registry.mjs` — restore
   `case 'compound'` (adapted, see Revision): gate on
   `item.status === 'retrospective'`, validate `--doc-type` via
   `assertValidDocType`, write via `addOutcome(dir, { id, docType,
   ...(docPath && {docPath}) })`, no stage move. Restore the manifest
   entry with a corrected `description`. Independent of steps 1-3 below
   (neither depends on the other existing first) but is itself a hard
   prerequisite for `retro-next` (step 2) to do real work — sequenced
   first in Order below for that reason.
1. `src/state/retro-pool.mjs` — pure picker (no fs, no direct `.fgos/`
   read), modeled 1:1 on `src/state/cleanup-pool.mjs`'s shape:
   `isCandidate(item)` → `item.status === 'retrospective'`, FIFO by the
   item's own `delivered -> retrospective` entry timestamp (mirrors
   `cleanup-pool.mjs`'s `latestCleanupEntry` helper, just matching
   `to: 'retrospective'` instead of `to: 'cleanup'`), returns `{id}` or
   `null`.
2. `plugins/fgOS/skills/retro-next/SKILL.md` — single item: **first**
   runs `fgos retrospective --dir "$root"` (the sweep — D1, cheap and
   idempotent, run every call so the pool is never stale), **then** picks
   via `pickNextRetrospectiveItem`, **then** invokes `fgos-coding-compounding`
   on the picked id (the actual synthesis: settlement/decision/
   enduser-docs), **then** on success runs `fgos move <id> --to cleanup
   --dir "$root"`. Classify/report the same way `cleanup-next`/
   `discover-next` already do (exit-code based: success / lock-timeout /
   per-item conflict-or-error).
3. `plugins/fgOS/skills/retro-loop/SKILL.md` — wraps the built-in `/loop`
   skill around `retro-next`, same recursion precedent
   (`docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md`).
   Stop rules **follow `discover-loop`'s shape, not `cleanup-loop`'s**:
   pool-empty, lock-timeout, **and an iteration cap** — because
   `retro-next`'s own per-item step (`fgos-coding-compounding`) is real LLM
   judgment, the same cost profile `discover-loop`'s cap-of-15 exists to
   bound, unlike `cleanup-next`'s purely mechanical TTL/content/merge
   check (no cap needed there). Default cap: **15**, same number
   `discover-loop` already uses, user-overridable from their own
   invocation wording — no new number to justify separately.
   Per-item-blocked-twice-in-a-row is *not* a separate stop condition
   here: `fgos-coding-compounding` either succeeds (tag stored, doc written) or
   the session running it gets stuck mid-flow, which is a real-session
   failure, not a clean "blocked" verdict the way `cleanup`'s harness
   produces one — so a failed `retro-next` iteration is reported the same
   way `cleanup-next`/`discover-next` report a per-item conflict/error:
   skipped, loop continues, never a stop condition on its own (only
   lock-timeout and the iteration cap stop the whole loop).
3. `.claude/skills/fgos-coding-compounding/SKILL.md` — fix the stale trigger
   description only. Currently (frontmatter + step 1) says the skill
   "Use[s] once a claimed item's stage reads `compound-learn`" and "this
   step only runs once the item is already at stage `compound-learn`" —
   but that stage is retired (D11, `src/state/workflow-stage-graphs.mjs:
   25-28,48-49,80-81`) and the real trigger, since `tsk-1zi`, is status
   `retrospective`, "driven by the retrospective loop" — i.e. by
   `retro-next`, the first real caller under the new trigger. Step 3's
   actual command (`fgos compound <id> --doc-type ... --doc-path ...`)
   stays byte-identical — only the trigger-condition prose changes, now
   that step 0 restores the verb it names.

### Impact-analysis note

`fgos tool query --capability impact-analysis --status present` →
GitNexus present, posture **full**. Step 0 above edits `runVerb`, the
existing dispatch function in `bin/fgos.mjs` that every verb's `case`
lives inside — an existing symbol, not a new file. Per `CLAUDE.md`'s MUST
rule, `impact({target: "runVerb", direction: "upstream"})` runs before
that edit, at `fgos-coding-implement` time, and its blast radius gets reported
before proceeding; a HIGH/CRITICAL verdict there is a stop, not a note.
`src/cli/command-registry.mjs`'s `COMMAND_REGISTRY` array (also edited by
step 0) is data, not a function — `impact()` on it, if the tool accepts a
non-function target, is a lower-value check; if it does not resolve, that
is not a blocker (the array's only real "impact" is other code reading
its manifest shape at runtime, unaffected by adding one more entry
matching the existing entry shape exactly). Every other file in this plan
is either brand new (`retro-pool.mjs`, both new `SKILL.md` files) or a
prose-only doc correction (`fgos-coding-compounding/SKILL.md`) — no `impact()`
needed for those.

### Risk map

| Component | Risk | Proof point (fgos-coding-validating) |
|---|---|---|
| restored `compound` verb (`bin/fgos.mjs` + `command-registry.mjs`) | medium — existing, tested dispatch code; wrong status-gate or a missed edge case (e.g. re-tagging an already-tagged item, an item not at `retrospective`) regresses a live CLI surface other docs already document as canonical | `impact({target:"runVerb"})` run and reported before editing (see note above); new/adapted test coverage in `test/cli/fgos.test.mjs` proving: rejects non-`retrospective` status, validates `--doc-type` before any write (bad value → zero events), writes `docType`/`docPath` via `addOutcome` on success, omitted `--doc-type` stays a no-op write (mirrors the removed tests' own coverage shape per `fcfbae5`'s diff, adapted for the status gate) |
| `retro-pool.mjs` | low — near-identical port of `cleanup-pool.mjs`'s already-proven shape | `test/state/retro-pool.test.mjs`: candidate filter (`status==='retrospective'` only), FIFO ordering by entry timestamp, `null` on empty pool |
| `retro-next` SKILL.md | medium — the actual wiring: sweep-then-pick-then-synthesize-then-move, and the first real caller of the restored `compound` verb | structural check: `test -f plugins/fgOS/skills/retro-next/SKILL.md && grep -q "fgos retrospective" ... && grep -q "fgos-coding-compounding" ... && grep -q "retro-pool" ...` (same shape `tsk-3go-3`'s verify already used for `discover-loop`) |
| `retro-loop` SKILL.md | low-medium — same recursion pattern as three already-shipped siblings | `test -f plugins/fgOS/skills/retro-loop/SKILL.md && grep -q retro-next ...` |
| `fgos-coding-compounding/SKILL.md` fix | low — prose correction only | grep confirms the trigger text now reads status `retrospective`, not stage `compound-learn` |

No medium/high item here needs more than a structural/grep proof —
`fgos-coding-planning`'s own precedent (`tsk-3go-3`, `tsk-dvc`) already treats
skill-file wiring as verified by presence + keyword grep, since the skill
files are prose orchestration read by a future session, not executable
code with a meaningful unit-test surface of their own.

## Files touched

- `bin/fgos.mjs` (edit — restore adapted `case 'compound'`)
- `src/cli/command-registry.mjs` (edit — restore adapted manifest entry)
- `test/cli/fgos.test.mjs` (edit — add back adapted `compound` verb tests)
- `src/state/retro-pool.mjs` (new)
- `test/state/retro-pool.test.mjs` (new)
- `plugins/fgOS/skills/retro-next/SKILL.md` (new)
- `plugins/fgOS/skills/retro-loop/SKILL.md` (new)
- `.claude/skills/fgos-coding-compounding/SKILL.md` (edit — trigger wording only)

## Order

1. Restore the `compound` verb (`bin/fgos.mjs` + `command-registry.mjs` +
   its tests) — hard prerequisite for step 3 to do real work, and
   independent of the picker, so it can go first or in parallel with 2.
2. `retro-pool.mjs` + its test (independent of 1; nothing in 3/4 can be
   built or proven against without it).
3. `retro-next` SKILL.md (depends on both 1 and 2 existing).
4. `retro-loop` SKILL.md (depends on `retro-next` existing to wrap).
5. `fgos-coding-compounding/SKILL.md` doc fix (depends on 1 existing — the
   corrected trigger prose should describe the real, now-restored
   command; sequenced last since it's the smallest, lowest-risk piece).

`fgos graph --json` was run for ordering context: `tsk-3o3` is not on the
repo's global critical path (`criticalPath.path` does not include it) and
appears in `topUnblock` with `unblocks: 1`. That ranking is about which
*item* to work on repo-wide, not internal step order — this item is one
honest piece of work (see Split, below), so internal ordering above is
governed by the files' own build dependency, not the graph tool.

## Split

None. One honest piece. The verb restoration (step 1) has no other real
caller today besides `retro-next` (step 3) — restoring it alone would be
dead code with nothing exercising it; building `retro-next`/`retro-loop`
without it would ship a loop whose core action fails on the first real
item. They only mean something shipped together. `retro-pool.mjs` is
small enough on its own that splitting it out as a separate item would be
pure process overhead for a same-session, same-PR piece of work. Standard
mode does not, by itself, require a split — this plan's own "Decide the
split" test (`fgos-coding-planning`'s step 5) is whether more than one candidate
piece could independently go first and unblock separate follow-on work;
none of these five pieces are independently useful without the others.

## Assumptions

- No other current caller of the removed `compound` verb exists to
  regress by narrowing its status-gate from `awaiting-approval` to
  `retrospective` — proven, not assumed: the verb has been fully absent
  from `bin/fgos.mjs` since `fcfbae5` (grep across
  `src/bin/test/docs/dogfood-fixture/.claude/plugins/scripts` found only
  doc citations and one dead code comment referencing it, no live
  caller), so there is no in-flight usage at the old gate to break.
- `assertValidDocType` (`src/state/store.mjs:759`) and `addOutcome`
  (`src/state/store.mjs:782`) are unchanged by `fcfbae5` (that commit's
  diff touched only `bin/fgos.mjs` and `command-registry.mjs`, confirmed
  by its `--stat` output above) — the restored verb can call both exactly
  as the removed code did, no `store.mjs` changes needed.
