---
phase: 01
title: "Consent and gate receipts: an answer comes only from the owner to an asked gate, two receipts on one milestone are both kept, and the gate runs only the capability's declared check"
status: pending
depends_on: ["harden/t6-answer-gate landed (answer half only)"]
parallel: "wave 0, with 02; the gate half (case-gate, propose, bin arm, registry, skills) may start now"
effort: ~1d
net_size: "Node +5 / Rust 0 / tests +35 (estimate)"
---

# Phase 01 — Consent and gate receipts (R-1 residue, `p-3ydqquajy2`, R-1b = Q1 a)

## Context

Arbitration §2.1 rows R-1 = B-1 (+ R-9 "pre-answer skips a final gate"), `p-3ydqquajy2`, R-1b; owner decision 71 (1a): "`workflow gate` runs only the `verify` declared for the capability; `--verify` and the slice `gate` field go". The core of R-1 is in flight on `harden/t6-answer-gate` (plan "Already landed or in flight"); this phase does what that branch leaves.

Code read on `595faa273` (+ the branch's working diff):
- Answer: `recordAnswer` `case-verbs.mjs:168-190` (branch adds `gate-unknown` at `:172` from `state.workflow.steps` only); `recordGateAnswerRound` `case-runtime.mjs:170-196` (branch: `gate-not-parked` when `parks.length === 0`); fold `case-projection.mjs:113-121` (branch skips `isDeliveryMilestone`), `achieve` `:81-84` replaces the whole milestone entry; decision-point `gate:` in the guide `guide-schema.mjs:231-240`; `confinedWriteRefusal` `case-admission-port.mjs:138-146` returns `null` at depth 0 and at depth > 0 refuses only when the case view is unwritable (so it is no depth refusal alone); `currentDispatchDepth` `src/runner/dispatch/adapters.mjs:94-98`; the drain folds any round file `case-runtime.mjs:198-214,216-256` with none of the verb's checks.
- Gate: `gateWorkflow` `case-verbs.mjs:376-389` passes `command: options.verify`; `runCaseGate` `case-gate.mjs:48-130`, command choice `:68-75`, `runCommand` `:100`, receipt `:108-115`; bin `workflow` arm `gate` branch (`bin/fgos.mjs:2323-2338`, `verify: flags.verify` at `:2333` and the usage text naming `--verify` at `:2326`; the `propose` branch's `verify` at `:2316` is the request-sizing flag and stays); propose: `MANIFEST_KEYS` `propose.mjs:34`, `:82`, `commandsFor` `:216-258` (`gateFlags` `:257`), `:460-462` (`gate-command-missing`); help `command-registry.mjs:2384+` (`workflow gate` subcommand). Doctrine: `core/skills/fgos-cook/**` names the slice list's `gate` and `workflow gate --verify` (lead greps `gate`; `--verify` on `fgos run` and on `propose --request` stays).

Not reproduced at arbitration, so **red first**: `p-3ydqquajy2` (two receipts on one milestone), the decision-point gate, the depth refusal (depth 1 with writable views), the re-ask rule, a planted round file folded by the drain.

## Requirements

1. **Owner only.** `recordAnswer` refuses whenever `currentDispatchDepth() > 0`, unconditionally, reusing the refusal text of `confinedWriteRefusal` (no new message, no new code name). The depth-0 case (an unconfined process of the owner's OS user that unsets the variable) is the plan's stated limit, not closed here.
2. **Gate of the guide.** An answer is accepted for a Playbook step with `gate` **or** for the activity of a guide decision point carrying `gate:` (`projection.guide`), refused otherwise (`gate-unknown`, the branch's code).
3. **Open gate only.** `gate-not-parked` also when the step's last `gate.park` is not later than its last settling `gate.answer` (a gate answered and not asked again), not only when it never parked.
4. **The drain checks what it folds (RT-10).** One predicate, used by `recordGateAnswerRound` and by `drainCaseInbox` under the hold: the step is a gate of the guide (requirement 2), the round's occurrence is the gate's open occurrence (requirement 3), the round's file name agrees with its `occurrence`/`round`, its `stepId` is its `<step>.rounds` directory, and its `subjectDigest` equals the one recomputed under the hold. A round that fails stays unfolded and is reported in the drain result. This takes the R-9 "step id from the directory" item from P04 (same lines).
5. **Receipts merge.** `achieve` keeps the receipts of every guard that reached a milestone (a `gate.answer` after a `settle`, and the reverse); a later receipt never drops an earlier one. Only `case-projection.mjs:81-84`.
6. **Gate runs the declared check (1a).** `runCaseGate` takes no `command`; it runs `verifyCommandOf({ capability }, cfg)` and refuses by name when none is declared (text names `capabilities.<cap>.verify`, not `--verify`). `gateWorkflow` stops passing `options.verify`; the bin arm stops reading `flags.verify` for `gate` and an explicit `--verify` on `workflow gate` is refused by the arg layer as an unknown flag (`subcommand-flag-drift` test stays green). The slice list loses `gate`: `MANIFEST_KEYS`, the `:82` check, `gateFlags` (always `--capability code:implement` or the slice capability), `gate-command-missing` text points to `capabilities.code:implement.verify` only.
7. **Doctrine.** `core/skills/fgos-cook/**` text for the gate and the slice `gate` key follows; `npm run build:skills` regenerates the render surfaces in the same commit.
8. With 1a the receipt binds to the approved command because the only writer can run only the declared command; no fold change and no `case.opened` field (A2 not taken).

## Files

**Create:** none.

**Modify:** `src/workflow/case-verbs.mjs` (`recordAnswer`, `gateWorkflow`), `src/workflow/case-runtime.mjs` (`recordGateAnswerRound`), `src/workflow/case-projection.mjs` (`achieve`), `src/workflow/case-gate.mjs`, `src/workflow/propose.mjs` (`:34`, `:82`, `:216-258`, `:460-462`), `bin/fgos.mjs` (workflow arm `gate` branch only), `src/cli/command-registry.mjs` (`workflow gate` and `propose` slice text), `core/skills/fgos-cook/**` and regenerated `.agents/skills`, `plugins/fgOS/skills`, `.claude/skills` wrappers, `CHANGELOG.md`, census.

Tests: `test/workflow/case-runtime.test.mjs`, `test/workflow/case-projection.test.mjs`, `test/workflow/case-verbs.test.mjs` (gate cases call without `verify`), `test/cli/fgos-case-doors.test.mjs:98-110` (`gateArgs` uses a declared capability verify, not `--verify`), `test/workflow/propose.test.mjs` (slice `gate` key refused as unknown).

**Delete:** the `command` parameter of `runCaseGate` and its precedence branch; `verify` plumbing of `gateWorkflow` and the bin `gate` branch; the slice `gate` key and `gateFlags`'s `--verify` arm.

**Cross-lane one-liners:** none.

**Tests to retire:** propose cases that accept a slice-list `gate` command (behaviour removed; the refusal of an unknown manifest key is owned by `propose.test.mjs` `checkManifest` cases). A gate case that passes an ad hoc command (behaviour removed; owner of "the gate runs the declared check" is the rewritten `fgos-case-doors.test.mjs` gate test plus the `case-verbs.test.mjs` gate cases).

## Net size

Node: depth +2, decision-point gate +3, open-gate +3, drain predicate +5, receipts merge +2, gate −10 → about +5. Tests: five red cases +50, slice-gate cases −15 → about +35.

## Steps

1. Board line: P01 takes `bin/fgos.mjs` (workflow arm) and `command-registry.mjs`; rebase on doctor P04 if it landed.
2. Gate half now (files no other writer holds): red test "a gate given `--verify` is refused; a gate with a declared verify that fails records findings" in `fgos-case-doors.test.mjs`; make it green; propose `gate` key; doctrine; `build:skills`.
3. After `harden/t6-answer-gate` lands: rebase; red tests for requirements 1-5 (case-verbs depth; case-runtime decision-point, re-ask and planted round; case-projection receipts merge); green.
4. `gateWorkflow` line (`case-verbs.mjs:384`) after step 3 (one writer).
5. CHANGELOG (gate flag gone, answer refusals, receipts kept); census.

## Validation (focused)

- FR `test/workflow/case-runtime.test.mjs test/workflow/case-projection.test.mjs test/workflow/case-verbs.test.mjs test/workflow/propose.test.mjs test/cli/fgos-case-doors.test.mjs test/cli/subcommand-flag-drift.test.mjs test/workflow/conductor-case.test.mjs test/workflow/stale-approval-reapproval.test.mjs`
- `rg -n "options\.verify|flags\.verify" src/workflow bin/fgos.mjs` → only the `propose` request-sizing flag; `rg -n "'gate'" src/workflow/propose.mjs` → none in `MANIFEST_KEYS`.
- Then the full suite (land gate).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A project without `capabilities.code:implement.verify` can no longer gate | M × M | `propose` already refuses such a proposal (`:460-462`); refusal text names the config key; CHANGELOG and guide line |
| Requirement 3 refuses a legitimate second answer round of the same occurrence (input gates take several rounds) | M × M | "settling answer" = approved consent or an input answer that settled the round (`settlesNow`, `case-runtime.mjs:178`); a non-settling round keeps the gate open; red test for both |
| Receipt merge changes the stored projection shape readers expect (`receipts` array vs one) | L × M | Lead greps readers of the milestone entry (`rg -n "\.receipt\b|receipts" src`) and keeps the shape they read |

## Rollback

Revert the merge; re-activate the previous release. No on-disk format change; after rollback `workflow gate --verify` works again.

## Done when

Red tests recorded then green; `--verify` gone from the gate path; fgos-cook text regenerated; landed with smoke: `fgos workflow propose` in a scratch project with a `package.json` and a declared `code:implement.verify`, then `fgos workflow gate` on a scratch case passes and fails by the declared command; guide section written.

## Lead brief essentials

Do not touch `recordAnswer`, `recordGateAnswerRound` or the fold before the answer-gate branch lands. Reuse `confinedWriteRefusal` and `isDeliveryMilestone`; no new code name except those the branch adds. All plan.md lead rules apply.
