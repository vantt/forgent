# HARDEN T6 P01 lead report: consent and gate receipts

Branch `harden/t6-p01-consent-gate-receipts`, two commits on origin/main (answer-gate fix already landed).

## What changed
- Gate runs only the declared check: `runCaseGate` takes no `command`, runs `verifyCommandOf({ capability })`, refuses `gate-command-missing` naming `capabilities.<capability>.verify`. `workflow gate` loses `--verify` (unknown flag at the arg layer), `--capability` is now required in the registry. Slice list loses `gate` (`MANIFEST_KEYS`, check, `gateFlags`, `gate-command-missing` text). Printed gate line is always `--capability code:implement`. fgos-cook doctrine, rendered skills, spec line RUL-WF-32 follow.
- Owner only: `recordAnswer` refuses at `currentDispatchDepth() > 0` with the admission port's own refusal sentence and code (`nested-write-from-confined-worker`); the sentence and code are now exported from `case-admission-port.mjs` (one-line refactor, no new message).
- Gate of the guide: `gateOfStep(events, stepId)` in `case-projection.mjs`: a step with `gate`, or an activity listed (`should`/`mayInstead`) by a decision point carrying `gate:`. Used by the verb (`gate-unknown`) and the drain.
- Drain checks what it folds: `roundProblem` in `case-runtime.mjs` (gate of guide, open occurrence = park count, gate mode, directory and file name agree with the record, not already settled since last park). A failing round stays unfolded and is listed in `drainCaseInbox(...).refused`; `recordGateAnswerRound` ignores such rounds when deciding `gate-already-answered`, so a planted file neither settles nor blocks the owner.
- Receipts merge: `achieve` keeps receipts and consent of every guard for the same subject digest; the gate answer receipt is now one entry of `receipts` (nothing read the old single `receipt` key; readers of `receipts`: case-inherit, fold).
- CHANGELOG two bullets; census and suite baseline regenerated.

## Red to green
- Gate half: `fgos-case-doors` gate test, `case-verbs` gate refusal test, `propose` refusal test red on the old tree (3 failed), green after.
- Answer half: `case-projection` receipts merge, two `case-runtime` planted-round tests, two `case-verbs` tests (depth 1 with writable views, decision-point gate) red on the old files (stash check), green after.

## Tests retired and owners
- propose.test: slice-list `gate` command cases and `fgos-workflow-propose.test.mjs` `gate` keys (behaviour removed; unknown key refusal is owned by propose.test `manifest-invalid` case). Ad hoc `verify:` gate cases in case-verbs/case-doors: owned by the declared-verify cases in the same files.

## Deviations from the phase file
1. Subject digest NOT compared in the drain (requirement 4's last item). Reason: `stale-approval-reapproval.test.mjs` proves an approval given while a holder runs, then the approved report edited, is folded and the admission guard finds it stale and asks the gate again. Refusing the round at the drain would drop that approval silently and the gate would not re-ask. A forged digest gains nothing: the human-consent guard compares the milestone digest with the current one at admission. Verified by that test (it failed with the digest check, passes without).
2. Requirement 3 ("gate-not-parked when answered and not asked again"): kept the existing `gate-already-answered` code, which already refuses that case (owned by case-runtime tests); `gate-not-parked` stays for a gate that never parked. One code per cause, no rename of an existing public code.
3. `case-admission-port.mjs`, `test/cli/fgos-workflow-propose.test.mjs` touched though not in the file list (an export; a caller test of the removed `gate` key).
4. The drain result `refused` is returned but `tryAcquireAdvanceLock` (which drains on acquire) ignores it, so a refused round is visible to callers that drain themselves (the runner's `drained`) and to tests; surfacing it in `workflow status` is not done (would add a field; item for P11 if wanted).
5. `npm run build:skills` regenerates the skills, then fails in the instruction-registry step (`git-addon-not-shipped`) on this tree; unrelated to P01, render files were written before it.

## Net size (src+bin / tests)
src+bin +113 / -42 (net +71, plan estimate +5: the drain predicate and receipts merge are larger than estimated; the gate half is net -20). Tests +161 / -18.

## Gate
Focused: case-runtime, case-projection, case-verbs, propose, fgos-case-doors, fgos-workflow-propose, flag-drift, conductor-case, stale-approval-reapproval, architecture, doc-health, citation-drift, one-door scan (0 undeclared). Full `npm test` on the rebased tree: 8562 pass, 1 fail (known V7n addendum), no `run-tests: ERROR` lines. The propose-then-gate smoke is the two CLI tests above (real `bin/fgos.mjs`, scratch repo with a declared `code:implement.verify`: gate passes and fails by the declared command, `--verify` refused).

## Items for other phases
- Owner-machine guide section (Vietnamese): `workflow gate --verify` gone, declare `capabilities.code:implement.verify`; P15.
