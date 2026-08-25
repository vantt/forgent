# plan.md — tsk-5x7-2 (piece 1: declared-egress governance, dependency-free)

Per-item risk map for this `risk: heavy` child of `tsk-5x7`. The full split,
locked decisions, and cross-piece footprint/deps rationale live at
`docs/history/dispatch-plan-protocol-redesign/plan.md` (the parent item's
shared plan) — this file is the item-specific record `assertPlanEvidence`
requires on `fgw/tsk-5x7-2` before `delivered` (`src/state/store.mjs:620`),
distilling the piece-1-specific rows already written there plus what was
actually verified during implementation.

## Scope

Per D2's governance intent (carried forward by D6) and D1: replace
`resolve.mjs`'s prior gate — which inspected only `executor.command` against
`CLAUDE_CLI_COMMANDS` and was blind to an env override — with a
declared-egress check carrying `providerFamily` plus
`egress {kind, target, content}`. Deliberately dependency-free: a live
policy hole, not a vocabulary refactor. Reuses the already-built
`EXECUTOR_CARRIES` enum (`config.mjs:364`) as the egress content vocabulary.
Live specimen fixed in the same change: executor `glm` keeps
`command: "claude"` while routing to OpenRouter via `env` — now requires
its own `allowCrossProvider: true` declaration to pass the gate, per the
person's gate decision (2026-08-25) to ship that specimen fix in the same
commit rather than land the tightened gate with a known breakage.

Full design narrative: `docs/history/dispatch-plan-protocol-redesign/
DISCUSSION.md#task-governance-egress`.

## Risk map (from parent plan.md's own table)

| Component | Risk | Why heavy |
|---|---|---|
| Declared-egress gate replacing `command!=claude` | **heavy** | live policy hole (governance was blind to an env-routed cross-provider egress); a wrong fix either fails open (governance gap stays) or fails closed on a legitimate specimen (`glm`) with no remediation path |

## Verification actually done

- `grep -q 'egress' src/runner/dispatch/resolve.mjs` — passes.
- `node --test test/runner/egress-governance.test.mjs` — 4/4 pass: `glm`
  fail-closed without `allowCrossProvider`, `glm` pass-through with
  `allowCrossProvider: true` carrying the governance descriptor, native
  `claude` same-provider resolution, non-Claude `agy` cross-provider
  resolution with the flag declared.
- `node --test test/runner/dispatch.test.mjs` — 322/322 pass.
- Iron Law evidence (`docs/history/tsk-5x7-2/iron-law-evidence.md`): real
  failing-before (all 4 egress-governance tests failing — gate not yet
  declared-egress-aware) / passing-after (4/4) transcript, classified
  `required: true`.
- **Driver-side recovery, not a re-dispatch.** The out-of-process worker's
  own "add Iron Law evidence" commit (`537fee14`) accidentally reverted
  `resolve.mjs` back to the pre-fix state while capturing its RED
  transcript (a `git checkout` for the RED capture that was never restored
  before the final commit) — the correct implementation was still sitting
  uncommitted in the working tree, byte-identical to the worker's own
  earlier commit `f987014f`. Confirmed via `git diff f987014f --
  src/runner/dispatch/resolve.mjs` (empty). Driver re-ran the item's full
  verify itself on the corrected tree (322/322 + 4/4 pass) before
  committing (`d05b865`), per `coding-worker-contract.md`'s "tree is not
  clean" driver-recovery rule.
- **Second recovery: repo-wide architecture-manifest gap.** The first
  `fgos return` attempt (bare, full re-verify) failed
  `test/architecture.test.mjs` — `src/runner/dispatch/plan.mjs`, added by
  the already-delivered sibling `tsk-5x7-1`, had no row in
  `docs/architecture-manifest.json`. This slipped through `tsk-5x7-1`'s own
  landing because that `approve` call used `--worker-verified-sha` and
  skipped re-verify. Fixed by adding the missing manifest row
  (`da613e8`); `node --test test/architecture.test.mjs` now 6/6 pass.

## Outcome

Delivered as piece 1 of the three dependency-free children `tsk-5x7`
decomposed into (D6), after two driver-side recoveries (worker git-state
slip, repo-wide manifest gap) — neither required redesigning scope or
re-dispatching, both were mechanical fixes to already-correct/already-cited
work. `tsk-5x7-3` (herdr-spawn adapter) remains the last open sibling at the
time this piece lands.
