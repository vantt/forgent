# Re-acceptance: discussion measurement fixes

Date: 2026-10-06. Scope: `git diff b3346957a..HEAD`, mainly `b2c7b4588`. This checks the fixes for the
findings in [the first review](opus-acceptance-review-discussion-measurement-261006.md), as claimed in
[the fix ledger](observe-acceptance-fixes-261006.md).

Method:
- I read the source.
- I ran focused `node --test` on 4 files: unit-summary, reviewed, role-tasks and run. Result: 90/90 pass. The CLAUDE_CODE_SESSION_ID variable was unset for this run.
- I ran scratch probes under the session scratchpad. They used synthetic units, plus copies of the mdview and forgentX `.fgos/assignments` trees. Old code came from `git archive b3346957a`.
- The Rust probes used `target/debug/fgos`, built at 11:34, after `b2c7b4588`. Later commits do not touch the discussion code.
- Nothing in either repo was modified. I did not run cargo, `npm test`, workflows or panes.

## Verdict per original finding

| Finding | Status | Evidence / probe |
|---|---|---|
| H1 researcher seats unmeasured | **FIXED** | `unit-summary.mjs:75-77,105-108` takes kinds from `resolvePanelRoles` (`panel.mjs:25-35`), which is shared with `runPanel`. Rust votes only on `kind == "panelist"` (`discussions.rs:138`), and there is no name heuristic left (grep). Probe `probe1.mjs` + host: `research-fan-out` with researcher-1..3 = a/a/b gives `measured, agreement 0.667, stanceSeats 3`. Array roles `alpha/beta/gamma` measure the same way. The synthesizer's stance is excluded. `code-change` gives `unmeasured, stanceSeats 0`. See N1 for legacy records. |
| M1 inline producer settles unit | **FIXED** | `run.mjs:632-641`: only `solo` settles and publishes. Other patterns get `execution.status: pending` and no settlement. `run.mjs:534-537`: when `pending-inline.json` exists, the unit stays unsettled. Tests at `run.test.mjs:1165-1199` (record, request, resume through a refused checker gives `policy-refusal`) pass. |
| M2 genuineSplit on zero votes | **FIXED (residual N3)** | `discussions.rs:157-168`. Probe: 3 missing gives `unmeasured, agreement null, genuineSplit null, stancesMissing 3, stanceSeats 3`. 1-1-1 (a/b/other) gives `measured, 0.333, split true`. Counters are kept. |
| M3 reviewed throw loses sibling | **FIXED** | `reviewed.mjs:294-332`: `allSettled` over checkers and verify, wrapped in `Promise.resolve().then` so a synchronous throw is captured. The first rejection is rethrown after every peer settles. `probe3.mjs` logs, with the sibling always finishing before the rejection: async throw `[verify done, red-team done, rejected]`; sync throw same; verify throw `[verify, reviewer, red-team, rejected: verify boom]`. Nothing finishes after the rejection. |
| M4 crashed units have no detector | **PARTIAL** | A root-wide `summariesMissing` / `summariesUnusable` now appears only in `metrics discussions` output (`discussions.rs:43-51`). There is no doctor check or reconciler (grep of `src/setup`, `apps/fgos/src`: none). Active and crashed units are deliberately not told apart. Legacy units with an abandoned attempt are classed `active` forever (`unit-summary.mjs:36-53`); mdview `unit-run-1791170454429-72e118ad` is one. The count is honest, but it is not a detector. |
| L1 unusable summaries silently dropped | **FIXED** | `unit_summary.rs` scan. Probe: no summary, invalid JSON, null settledAt, `"yesterday"`, and a symlink give `miss 1, unusable 4 {invalid-json, missing-timestamp, invalid-timestamp, symlink}`. The partition holds: seen 12 = 7 + 1 + 4 + 0, and 0 + 1 + 4 + 7 outside the window. |
| L2 stance line in every prompt | **FIXED** | The generic line was removed from `agent-result-claim-contract.mjs`; the render no longer contains "stance". `probe2.mjs`: the instruction reaches only kind-panelist seats. The synthesizer, producer and checkers do not get it. Validator probe: `"x"`, `{choice:7}`, `confidence:"bad"`, `[1]`, `null` and `{choice:"zzz",confidence:5}` all give `{valid:true}`. |
| L3 backfill races in-flight units | **FIXED (regression N2)** | `writeUnitSummary` skips `unknown` outcomes and units without settledAt (`unit-summary.mjs:143-147`). Execution status and dangling `run.json` count as active. Dry-run on a copy of forgentX: `81 units, 0 changed, 63 unchanged, 4 active, 14 unsettled`, so it is idempotent. But see N2: a settled legacy summary was flipped. |
| L4 summary I/O fatal | **FIXED** (minor residual) | `publishUnitSummary` warns (`run.mjs:29-34`), and the tests pass. Residual: `settle()` in the catch still calls `writeJsonAtomic(unit.json)` (`run.mjs:265-268, 549`). If that write fails, its error replaces the original exception. |
| L5 roleTasks on panelists | **FIXED** | The pre-feature source (`git show 2639e0c85:…/panel.mjs`) passed the raw `unit` to members. `probe2.mjs`: with no options, member `unit === original` (identity), and `roleTasks.panelist` / `roleTasks['researcher-1']` are ignored. The synthesizer is unchanged. |
| L6 resume ignores stance options | **FIXED** | `run.mjs:133-135` is the first statement. Probe on a scratch repo: `node bin/fgos.mjs run --resume unit-run-does-not-exist --stance-options 'a\|b'` gives `cannot provide stanceOptions when resuming…` with exit 4. Nothing is created. The workflow runner never resumes, so it cannot trip this. |

Live (item 9), mdview `metrics discussions --since=2026-10-05`:
- The four Delphi groups are unchanged: `1f688991` (1 unit, 0 seats), `842d7c56` (8 seats / 9 attempts / 1 fallback), `6466fc15` (10/11/1) and `28f05967` (10/10/0).
- Their attempts total 30. `metrics runs` over 10:25:29Z to 11:20Z by role gives 6+6+8+5+5 = 30.
- The totals now cover 43 units, not the 28 in the ledger, because new runs came after 11:28. That is not a false claim.

## New findings

### High

**N0. A test deletion beyond what the roleTasks revert needed removed the only proof that the stance question reaches workers.**
- `test/runner/execution/patterns/role-tasks.test.mjs`: the whole test "question options augment panelist tasks … never synthesize a stance instruction for other roles" was deleted.
- I replayed the deleted test verbatim against HEAD (scratch `deleted-roletask.test.mjs`) and it **passes**, so nothing required removing it.
- `test/workflow/workflow-runner.test.mjs:1201-1255` lost these assertions:
  - "Declared choices" in the real CLI launch envelopes of panelist-1, panelist-2 and the direct unit;
  - the synthesizer prompt has no stance instruction;
  - `state.stanceOptions`;
  - `unitRecord.workflow` / `summary.workflow` equal the workflow link;
  - `summary.stanceOptions`.
- The echo worker now hard-codes `stance: {choice:'full'}` without reading the prompt. It is now a phantom test.
- Only the "Use your own lens" roleTasks assertion actually needed to go.
- The ledger presents this only as "an old workflow test pinned newly reverted panelist roleTasks prose".
- The same commit removed the generic claim-contract stance line. That leaves `roleUnit`'s `hasStance` branch as the only delivery path, and no test now covers it.
- grep: `Declared choices` / `Passive stance measurement` appear nowhere under `test/`. No test proves the workflow-to-unit link end to end either.
- Failure scenario: a refactor drops `kind` from the `runPanel` → `roleUnit` call (kind defaults to `role`, e.g. `panelist-1`). The stance instruction then silently disappears from every panel. CI stays green, and every future panel reads `unmeasured`.
- Fix: restore the role-tasks test unchanged. In the workflow test, restore every assertion except the roleTasks prose. Make the worker answer from the parsed "Declared choices".

### Medium

**N2. A legacy unit with no recorded pattern now derives its outcome as `solo`. A blocked reviewed unit was republished as `pass` in mdview, and its checkers were stamped `kind: producer`.**
- `unit-summary.mjs:71-72` defaults a missing `record.pattern` to `solo`.
- `patternHistoryOutcome` (`:58`) then returns only the `producer` seat's outcome.
- The kind rule (`:105-106`) labels every seat `producer`.
- The old rule ("first non-pass seat") gave `blocked`.
- Probe `probe4.mjs` (legacy unit.json without pattern; producer ok, red-team ok, reviewer blocked):
  - old: `blocked`;
  - new: `pass`, with all kinds `producer`.
- Old-vs-new dry-run over a copy of mdview: exactly one flip, `unit-run-1791130137844-2f787902 old=blocked new=pass`.
- That artifact is live now. `mdview/.fgos/assignments/unit-run-1791130137844-2f787902/unit-summary.json` was written 2026-10-06 11:28 by the fix agent's backfill against mdview. It has `outcome: pass` while `reviewer` is `blocked`, and `red-team`/`reviewer` are `kind: producer`.
- This breaks "never clobbers a settled summary" and the claim that seat kind is execution-owned. Kind is re-derived post hoc from a field that legacy records lack.
- Fix:
  - If `record.pattern` is absent and a seat role is not the solo role, derive `null` (unsettled) and kind `unknown`.
  - Re-run the backfill on mdview to restore that unit (it will then be skipped or set back to `blocked`).

### Low

**N3. One valid vote out of three seats is still reported as a genuine split.**
- Probe: a valid, missing and invalid give `measured, agreement 0.333, genuineSplit true, stancesValid 1`.
- No disagreement was expressed, which is the same class of signal as M2. The spec calls it "incomplete-evidence", but the field is still `genuineSplit: true`.
- Suggest a minimum valid quorum (for example `valid*3 >= seats*2`) before computing the split.

**N4. Making `seat.kind` required is a breaking change, but the contract keeps `unit-summary` v1. Pre-change summaries become permanently unusable.**
- forgentX `metrics discussions` now shows `unusable 18 {invalid-contract 12, missing-timestamp 6}`. The 12 are settled 2026-10-04 legacy panels with no recorded pattern. The old reader counted them.
- The backfill cannot migrate them: dry-run gives `skip:unsettled` for all 12, `changed 0`. They will stay on disk as stale v1 artifacts indefinitely. mdview has one more (`72e118ad`, skipped as active).
- `invalid-contract` cannot tell "old version" from "corrupt". The ledger reports the mdview cutover but not that forgentX lost 12 units from totals.
- The project's no-backward-compatibility policy makes this acceptable, but bump the contract version or document the loss.

**N5. Resume behaviour changed for a reviewed round with an errored checker and a missing sibling.**
- `isRoundSettledInHistory` no longer treats a failed checker as round-settled (`reviewed.mjs:106` removed). Resume now re-dispatches the errored and missing checkers instead of returning the error.
- This is defensible and consistent with draining. It is a HIGH-radius symbol (the ledger disclosed this), but no test pins the new resume semantics.

Repo-rule scan: no plan IDs, phase numbers, audit labels or finding codes in added code or test lines (grep over `src scripts test packages apps bin`). The Rust tests were refactored rather than weakened: the window, invalid-flag and symlink cases were kept in `rust/tests/unit_summary.rs`. The Node test weakening is N0.

## Verdict

**ACCEPT WITH FIXES.** H1, M1, M2, M3, L1, L2, L5 and L6 are genuinely fixed and probe-verified. Before any agreement number is trusted:
- restore the deleted stance-delivery and workflow-link tests (N0);
- stop the legacy `solo` default from flipping outcomes, and repair the mdview artifact (N2).
