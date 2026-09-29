# Unit I29 — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I29`,
worktree `.claude/worktrees/coordination-skill-harness-i29-deprecated-stubs`,
base `main@9258ebabd` (post-I28), integrated `main@4fc1756e8`.

Phase 6 stub half: converts `core/skills/fgos-plan-loop/SKILL.md` and
`domains/coding/skills/fgos-code-panel/SKILL.md` into thin deprecated
redirects to the merged `fgos-code-change` facade (I28), retargeting every
real inbound reference. Closes Phase 6.

## Implementer (sonnet, fullstack-developer)

Read I28's merged facade in full before classifying old content. Applied the
locked 3-bucket disposition:

- **Carried forward** (verified present in I28, not assumed): caveat-blocks-
  close, Facade Hook Values, Step 0-4 lifecycle, proof tiers/Test-Selection
  Block, reviewer/red-team inspect-by-default, tested/integrated identity +
  tree-identity exception, two-request DAG pattern (renamed
  `inspect--<coordinationId>`), unattended track mode.
- **Deliberately deleted, no escalation**: JSON open/fix/close templates,
  default actor roster (superseded by I21's per-node binding), private-
  worktree recipe prose (superseded by coding-cell-policy §1), the "no
  second orchestration implementation" Non-Goal (obsolete — one skill now),
  `fgos-plan-loop`'s "session IDs use safe characters" note (confirmed
  redundant — the engine enforces `assertSafeId` regardless of doc text).
- **Escalated (genuine orphan)**: `fgos-code-panel`'s "Known limits (not
  enforced by the engine)" caveat (no schema field for proof tier/
  `FULL_TRIGGERS`/environment fingerprint; `disposition`/`rationale` accepts
  any non-empty string) had no landing spot in I28's carried-forward
  content. Lead independently confirmed via grep before approving. Resolved
  by adding a "Known Engine Limit" subsection to `coding-cell-policy.md` §2,
  mirrored the normal way — narrow, non-invasive, correct shared landing
  spot since both facades already point there for proof-tier doctrine.

Both stubs reduced to 73 (`fgos-plan-loop`) and 90 (`fgos-code-panel`) words
(from 1347/7993), frontmatter rewritten to drop all `DemandFacts`/trigger
phrasing so no host auto-selects them as live, kept loadable only for the
Phase 7 compatibility window.

Retargeted every real inbound reference: `fgos-panel/SKILL.md` (description,
"known Phase 5 gap" paragraph, Route step 4 — step 3/`coding-design-panel`
and Surface Taxonomy row 74 left untouched, confirmed via diff); both
`group-thinking-trigger-surface.md` copies; both `master-coordinator.md` and
`runtime-recovery-design.md` copies; `intent-preservation-ledger.md`;
`docs/specs/reading-map.md`; `docs/how-to/author-a-plan-loop-track.md`;
`private-cell-worktree.md`/`planning-capability-awareness.md` (generic
shared fragments with illustrative mentions); `scripts/measure-coordination-
baseline.mjs`'s `CANONICAL_SKILL_PATHS`; `CHANGELOG.md`. Left untouched with
evidence: `docs/specs/runner.md`'s 3 mentions (each inside a dated decision-
log entry citing the skill active at that historical event, not live
routing text); both `docs/architect/proposals/*.md` and portal READMEs
(explicit non-canonical/discussion-status disclaimers); the packaging-
distribution rollout plan (a completed historical record naming the skill
actually moved at the time); `skill-package-distribution.md` (out of this
unit's file list; a live `/fgos:code-change` slash-command mapping is a
command-registry change, named as a follow-up candidate, not done here).

Caught and self-corrected one process incident mid-flight: accidentally
edited 3 files (`fgos-panel`/`fgos-plan-loop`/`fgos-code-panel` SKILL.md) in
the main checkout instead of the worktree; caught via `git status`, reverted
with a scoped `git checkout HEAD -- <3 files>`, confirmed no other
main-checkout state touched, redid the work correctly in the worktree.

Also fixed a real regression found while retargeting: `test/setup/skill-
wrappers.test.mjs`'s `validateCodePanelNoPlanLoopDuplication` hardcoded
reading `fgos-plan-loop`'s real Section 5 as its "known-bad" duplication
reference — once stubbed, this check would have silently stopped firing.
Retargeted to read `fgos-code-change/references/plan-mode.md`'s "Unattended
track mode" section, the real current content anyone could still
accidentally duplicate. Retired 3 tests whose premise no longer exists (the
old two-skill delegation boundary — replaced by one skill's own Mode
Selection, nothing left to test a boundary between).

## Lead verification (no separate test+review round dispatched)

Given this unit's scope is almost entirely deletion/retargeting rather than
new logic, and the one substantive judgment call (the bucket-c escalation)
was independently verified and approved by Lead in real time during
implementation rather than left for a separate review pass, Lead's own
direct post-hoc verification substituted for a dedicated test+review
dispatch:

- Confirmed both stub word counts directly (73/90 words) and read both
  files in full — clean redirects, no leftover `DemandFacts`/trigger
  phrasing, kept loadable.
- Confirmed `fgos-panel/SKILL.md`'s diff touches exactly 3 lines
  (description, fragment-table note, routing-map entry) and that Route
  step 3 / `coding-design-panel` / Surface Taxonomy row 74 are untouched
  (grepped directly).
- Confirmed the "Known Engine Limit" subsection landed in
  `coding-cell-policy.md` §2 as approved.
- Confirmed via `git diff --stat` that no `**/verification/**` path or
  `.log` file was touched (the historical-record exemption).
- Ran the 4 targeted test files myself: 156/156 pass.
- Ran the full suite myself: 7964 tests, 7840 pass, 51 fail — all 51
  confirmed (via failure-message grep) to be the same pre-existing
  `test/rust-host/*` binary-missing gap I28 already hit (no compiled
  `target/release/{fgos,fgctl}` in this fresh worktree). No new
  regressions.
- Confirmed the main checkout was left clean after the implementer's
  self-reported accidental-edit-and-revert incident (only pre-existing,
  unrelated modifications present).

## Merge

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I29` from the main
checkout onto post-I28 main, `ort` strategy, clean auto-merge, no conflicts.
`integratedSha = 4fc1756e88d56c8a6b87d41b6c96d273d69306c0`. Reran the 4 key
suites on the merged tree: 156/156 pass.

## Phase 6 status

Both units (I28, I29) are now merged. Phase 6 is closed.

## Unresolved / follow-up

- `docs/platform/packaging-distribution/contracts/skill-package-distribution.md`
  doesn't yet have a `/fgos:code-change` row in its intent-mapping table —
  a command-registry-level change, out of this unit's scope, named as a
  follow-up candidate for a later unit or Phase 7.
