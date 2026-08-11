# plan: split the overloaded `fgos discover` verb (tsk-2b0)

CONTEXT.md: `docs/history/discover-decompose-verb-split/CONTEXT.md` (D1-D3).

**Post-execution note:** `fgos-coding-implement` found one live caller this
plan's scout missed — `test/e2e/runner-loop.test.mjs` (a second `discover`
call assuming decompose-stage dynamic dispatch, same pattern as the
CLI-level test). Fixed in the same commit as the implementation, per D2.

## Mode gate

Flags counted against the standard checklist:

- **public contracts** — YES. `discover` is a documented CLI verb
  (`src/cli/command-registry.mjs`) and a slash-command surface
  (`plugins/fgOS/skills/discover/SKILL.md`) other sessions/skills call
  directly.
- **existing covered behavior** — YES. `test/cli/fgos.test.mjs:2738-2884`
  already exercises both branches of the current dynamic dispatch through
  the one verb name; those tests must keep passing (reshaped, not broken)
  through the split.
- auth / authorization / data model / audit-security / external systems /
  cross-platform / weak-proof-area / multi-domain — no.

2 flags, no hard-gate flag → **standard** mode. Not `small`: the change
touches a public CLI contract with existing test coverage across ~10
files, which a `small`-mode direct-edit pass would under-scope per D2
(every live caller updated in this same pass). Not `high-risk`: no
auth/data/audit/external-system surface is touched, and the underlying
judgment logic (`judgeDiscovery`/`judgeDecompose`) is untouched — only the
CLI-level routing around it changes.

## Approach

**Chosen path**: add an explicit, upfront stage guard at the CLI boundary
(`bin/fgos.mjs`), not inside `resolveDiscovery`/`resolveDecompose`
themselves. Today neither function checks `work.stage` before running —
they call `judgeDiscovery`/`judgeDecompose` (a real model call)
unconditionally, then rely on `moveStage`'s CAS (`expectedStage`) to fail
late if the stage turned out wrong. Checking the stage in the new CLI
cases *before* invoking either function fails fast (no wasted model call)
and matches D1's "errors if not at the stage it handles" wording exactly
at the layer that actually owns verb-name-to-judgment routing.

**Alternative rejected**: push the stage check into
`resolveDiscovery`/`resolveDecompose` themselves. Rejected because
`src/runner/loop.mjs` (the async RUL19 sweep) already calls both functions
directly by name, already filtering to the right stage before calling
(CONTEXT.md scout evidence) — adding a redundant internal check there
would be dead code on that path and risks diverging behavior between the
sweep's pre-filtered calls and the CLI's now-guarded calls for no benefit.

**Risk map**:

| Component | Risk | Proof point (for fgos-coding-validating) |
|---|---|---|
| `bin/fgos.mjs` new `discover`/`decompose` cases | Low — mechanical split of one existing case into two, each with a one-line stage guard | `test/cli/fgos.test.mjs` reshaped cases pass; a manual `fgos plan <id>` on a `clarify`-stage item errors instead of silently running the wrong judge |
| `src/cli/command-registry.mjs` | Low — one entry becomes two, same parameter shape reused | `fgos --help`/registry consumers show both verbs distinctly (no automated test currently asserts on this file's shape beyond existence — confirm via `rg "name: 'discover'" src/cli/command-registry.mjs` returns exactly one match, and a new `name: 'decompose'` match exists) |
| `plugins/fgOS/skills/discover/SKILL.md` + new `plugins/fgOS/skills/plan/SKILL.md` | Medium — the existing skill's whole step 2/3 contract (one call, branch on `data.outcome` shape) is built on dynamic dispatch; splitting it wrong could leave a stage with no slash-command path | Manually walk both skills' steps against a real `clarify`-stage and a real `decompose`-stage item id; confirm each skill's own step 2 command succeeds and step 3's outcome-branch table still matches what the CLI actually returns |
| `.claude/skills/fgos-coding-exploring/SKILL.md`, `.claude/skills/fgos-coding-validating/SKILL.md` (+ `.agents/skills/` mirrors) | Low — prose-only hand-off references, no executable contract | Grep confirms no remaining bare `fgos discover` reference where a `decompose`-stage hand-off is meant (`fgos-coding-validating`'s hand-off should now say `fgos plan`) |
| `test/cli/fgos.test.mjs` | Medium — 9 existing call sites assume one verb name; some test the decompose branch by calling `discover` a second time after the item already advanced to `decompose` | Full `npm test` green; specifically the reshaped `discover`/`decompose` test block covers: clear verdict, unclear verdict (parks `awaiting-human`), missing id, wrong-stage call to each verb (new case), invalid judge response, pass-through, already-decomposed |
(`docs/reference/work-item-pipeline-stages-verbs-and-handoffs.md`, cited in
`tsk-4y5`'s CONTEXT.md as a follow-up target, was checked at
`fgos-coding-validating` time and found untracked/uncommitted — not reachable from
any commit on this or any branch, only a WIP file in another session's
working directory. Dropped from this item's scope below; a genuinely
committed version is a later item's concern, not this one's.)

Impact-analysis capability gate (per `CLAUDE.md`): checked below before
leaning on GitNexus for blast-radius evidence on the `bin/fgos.mjs` case
split.

## Files touched

1. `bin/fgos.mjs` — split `case 'discover':` into `case 'discover':`
   (stage guard: must be `clarify`) and `case 'decompose':` (stage guard:
   must be `decompose`); each calls exactly one of
   `resolveDiscovery`/`resolveDecompose`.
2. `src/cli/command-registry.mjs` — split the single `discover` entry
   (lines ~127-143) into two entries, `discover` and `decompose`, same
   parameter shape (`id`, `config`), each with its own description and
   example.
3. `plugins/fgOS/skills/discover/SKILL.md` — narrow to clarify-stage only
   (drop the decompose/split-work branch from step 3's outcome table).
4. `plugins/fgOS/skills/plan/SKILL.md` — new file, mirrors
   `discover/SKILL.md`'s shape for the decompose-stage outcomes
   (`noop`, `already-decomposed`, `invalid`, `need-human`, `pass-through`,
   `decompose`) that step 3 of the old skill documented.
5. `plugins/fgOS/skills/cook/SKILL.md:90` — update the "same engine
   command" reference to name whichever of `discover`/`decompose` applies
   at that call site.
6. `.claude/skills/fgos-coding-exploring/SKILL.md`, `.claude/skills/
   fgos-coding-validating/SKILL.md`, and their `.agents/skills/` mirrors —
   update hand-off prose: `fgos-coding-exploring`'s note stays `fgos discover`
   (it hands off at `clarify`); `fgos-coding-validating`'s note becomes `fgos
   decompose` (it hands off at `decompose`).
7. `test/cli/fgos.test.mjs:2738-2884` — reshape the 9 call sites per the
   risk-map proof point above.

`docs/reference/work-item-pipeline-stages-verbs-and-handoffs.md` is
**out of scope** (see risk-map note above) — untracked/uncommitted, not
reachable on this branch as of `fgos-coding-validating`'s check. D2's "every live
caller in scope" only covers files this item can actually see and commit
against; a file that doesn't exist yet in git history isn't a live caller
this item can update.

## Order

`fgos graph tsk-2b0 --json` shows `tsk-ozl` in `topUnblock`
(`newlyUnblocks: 2`, includes this item) and not on the global
`criticalPath` at meaningful depth for `tsk-2b0` itself — confirms the
existing `deps: [tsk-ozl]` relationship (tsk-ozl finishing is what moves
this item onto the frontier) without indicating any further internal
ordering signal, since this item is not being split (see below). Internal
file order, chosen by dependency shape rather than the graph tool (no
further split to compare candidates for):

1. `bin/fgos.mjs` + `src/cli/command-registry.mjs` first — the actual
   verb-level contract change; nothing else can be verified against real
   behavior until this lands.
2. `test/cli/fgos.test.mjs` reshaped alongside step 1 (same commit) —
   proves step 1 immediately, per this repo's real-test-first discipline.
3. `plugins/fgOS/skills/discover/SKILL.md` +
   `plugins/fgOS/skills/plan/SKILL.md` — depend on step 1's final
   verb names/output shapes.
4. `plugins/fgOS/skills/cook/SKILL.md`, `.claude/skills/fgos-coding-exploring/
   SKILL.md`, `.claude/skills/fgos-coding-validating/SKILL.md` (+ `.agents/
   skills/` mirrors) — prose-only updates, last since nothing else depends
   on them.

## Impact-analysis capability gate

```
fgos tool query --capability impact-analysis --status present
```

To be run at `fgos-coding-validating` time (this skill does not run the reality
check itself). If `present`: run `impact` on `bin/fgos.mjs`'s discover
case and `resolveDiscovery`/`resolveDecompose` before editing, per
`CLAUDE.md`'s MUST-run rule, and attach the blast-radius result to the
`bin/fgos.mjs`/`command-registry.mjs` proof points above. If not
`present` (0 providers or registered-not-present): note
`impact-analysis: inactive` or `degraded` next to those proof points and
rely on the `test/cli/fgos.test.mjs` full-suite proof instead — not a
gap, per the capability gate's own inactive/degraded posture.

**Run at `fgos-coding-validating` time (2026-07-31):** `present` (GitNexus
registered). `impact(resolveDiscovery, upstream)` and
`impact(resolveDecompose, upstream)` both returned `impactedCount: 0,
risk: LOW` — but GitNexus's index is 205 commits behind HEAD
(`gitnexus list_repos`), and this directly contradicts the direct-read
evidence already in the risk map (`bin/fgos.mjs:881-882`,
`loop.mjs:957,977` both call these functions). Treated as stale/unreliable
rather than a clean LOW-risk confirmation; the `test/cli/fgos.test.mjs`
full-suite proof point remains the real evidence for this row, not the
GitNexus result.

## Split decision

No split. This is one honest piece of work: D1's "hard split, no
fallback" means the CLI change and every live-caller update in D2's list
must land together — a partial split (e.g. `bin/fgos.mjs` alone, callers
in a follow-up item) would leave the repo in a broken intermediate state
between items, which the frontier/verify contract does not tolerate
(an item is only "done" when its own verify passes with real, working
behavior). `tsk-ozl` stays a separate item (already true via `deps`,
narrower and unrelated bug per CONTEXT.md's feature-boundary section).

## Verify

`npm test` (full suite — state + cli + runner + e2e), with particular
attention to the reshaped `test/cli/fgos.test.mjs` `discover`/`decompose`
block from the risk map above. This item's own `verify` field (currently
unset, `"chưa xác định — P15 bổ sung"`) should be set to `npm test` via
`fgos edit tsk-2b0 --verify "npm test"` before execution — no narrower
mechanical check honestly covers "does the CLI still work end to end"
better than the suite that already exercises this exact verb.
