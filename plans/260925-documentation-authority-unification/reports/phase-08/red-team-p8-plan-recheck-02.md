# Re-check 02: Phase 8 plan revision against re-check N1-N9, P8-4, P8-5

Reviewer: `reviewer:opus-session:a4954387@2026-10-19` (independent, fresh context, no authorship)
Content commit: `b89c8b02f` (detached, read-only worktree `/home/vantt/projects/forgentX-s8-review`); revision diff `7af1b1e6a..b89c8b02f`
Abbreviations: `P` = `plans/260925-documentation-authority-unification`, `F` = `P/phase-08-eliminate-switchboard-bypasses-and-prepare-consumers.md`, `OA` = `P/reports/phase-08/owner-answers.md`, `R6` = `P/reports/phase-06`.

I used read-only commands only: git log/show/diff-tree/merge-file (inputs written to scratch), jq, grep, sed. I extracted the embedded `checks.mjs` from both reproduction manifests to scratch and replayed only its check A path test in Python with the same git commands. I did not run npm test, fgos, cargo or any reproduction script, and did not read the secrets file.

## Verdict

**NEEDS-REVISION (small, text-only).** All nine N findings and both partly-fixed items are now addressed, and the Step 0 pair list is exact. L12-13 restores the owner's lease decision consistently across phase-08, phase-09 and plan.md. L12-12 is narrow. L12-11 can be executed under `fgos run`.

Two new High defects need a one-paragraph fix each before execution:

- **NEW-1.** L12-12 leaves a branch test permanently red inside `npm test`, and no rule says how close or landing treats that.
- **NEW-2.** L12-13 names `withMainCheckout`, the shared main-checkout mutex with callback scope, as the lease's reuse target. Taken literally, that contradicts owner lease decisions 3 and 5 and cannot span the cutover.

## Outcome table

| ID | Outcome | Evidence | Note |
|---|---|---|---|
| N1 | fixed | `OA:101-103` (L12-11); `F:86`, `F:104-105`, `F:109`; `P/reports/phase-08/step-00-unaccounted-pairs.json` | The rule now has two commits, and batch end is the committed-byte point after the accounting commit. The reproduction test is explicitly not a runner pre-commit verify. The manifests (`R6/step10-round5-reproduction.json`, `R6/step10-sync4d-reproduction.json`) sit under the allowlisted `reports/phase-06/`, so the accounting commit creates no pairs of its own. **Pair list verified** (see below): 21 at `7af1b1e6a` is exact, and HEAD now has 29. The 8 new pairs come from `b89c8b02f` itself, which the re-enumerate rule at `F:104` anticipates. |
| N2 | fixed (but see NEW-1) | `OA:105-107` (L12-12); `F:109`, `F:148`; `P/reports/phase-08/check-b-exception-lanes.json` | One path only. `beforeHash` `0f1cd7e1…` equals the frozen `R6/step10-start-checks.json` B pin and `HEAD:` blob, and `beforeSha256` `d796d762…` matches the file. After-hash, commit, tests-first, regeneration and review receipts are all null, and null fails closed. No baseline or checker edit. |
| N3 | fixed | `OA:109-111` (L12-13); `F:161-169`; `phase-09:55`, `phase-09:59-69`; `plan.md:370`, `plan.md:469` | The owner's 2026-10-06 decision (build in Phase 8, ten §6 items) is restored, and no stale "migration-specific lease" or Git 04 wait text remains (grep). A real conflict goes to the owner as a five-part packet (`F:167`), so the Lead does not reverse it. The wording problem is NEW-2. |
| N4 | fixed | `F:90-98`; `OA:115` | Two tiers: identity scope decides merge or defer; overlap with the exact files the batch writes decides what gets refreshed. Root `README.md` and touched `dogfood-fixture/` files are included. Whole-tree gating is removed. |
| N5 | fixed | `F:163` (no unavailable-branch input), `F:168` (Lead board obligation); `OA:116` | The main-branch board DOC row already reads **running** (`git show main:plans/261017-1313-fgos-platform-program-board/plan.md:51`). The branch copy still says "held", which is harmless. |
| N6 | fixed | `plan.md:278` (next step = Step 0 package), `plan.md:330` and `:361` forward pointers to L12-9/L12-12; `progress.md` 21-pair count | |
| N7 | fixed (routed limitation) | `F:107`; `OA:118` | `currentDigests` is declared diagnostic only. Resolution goes by native id/anchor plus passage content, and ambiguous rows park. |
| N8 | fixed | `F:117`; `OA:119` | Verified against the queue: the rows with a `docs/specs/` or `docs/architect/` consumer are exactly `[3,4,5,31..39]` (12 rows). |
| N9 | fixed | `F:106`; `merge-accounting.json .bothSidesMergeVerification` | I replayed `git merge-file -p` for `CHANGELOG.md`, `docs/platform/session-identity/spec.md` and `docs/specs/reading-map.md`: exit 0, with SHA-256 values equal to the merge and HEAD bytes (`554448ec…`, `f304413c…`, `252e6601…`). |
| P8-4 | fixed | as N4 | |
| P8-5 | fixed | as N3/N5 | No second guard. The lease is restored, and the board obligation is named. |

Tally: 11/11 fixed (N7 by a routed limitation). 0 partly, 0 not fixed.

### Step 0 pair-list verification (check A replay)

Method: `checks.mjs` is byte-identical across the two manifests apart from its output filename (`diff` shows only line 29). I replayed its logic read-only:

- `git log --first-parent --no-merges B0..HEAD` with B0 = `dbe5c4328…`;
- `git diff-tree` per commit;
- the `allowed-paths.json` prefix test;
- the embedded `exceptions` literal (20 entries), matched by commit prefix plus path.

Results:

- **At `b89c8b02f`:** 49 offender pairs, 20 accounted, **29 unaccounted**. Of those 29: `fc2076ece` ×11, `bd779d548` ×1, `df6eab953` ×8, `7af1b1e6a` ×1, and `b89c8b02f` ×8. `plan.md` is allowlisted, which is why `b89c8b02f`'s nine changed files give eight pairs.
- **The first 21 match `step-00-unaccounted-pairs.json` exactly.** The Doer's "21 pairs at input `7af1b1e6a`" is correct.
- **The 8 `b89c8b02f` pairs must join the Step 0 accounting:** `phase-08…md`, `phase-09…md`, and under `reports/phase-08/`: `check-b-exception-lanes.json`, `merge-accounting.json`, `owner-answers.md`, `progress.md`, `recheck-revision-verification.json`, `step-00-unaccounted-pairs.json`. The pair from committing this report will join them too.
- **Review sizing:** `F:108` and `F:193` say 122 entries, 3 parts. With 8 more pairs that becomes 130, still 3 parts.

## L12 consistency checks

- **L12-13 does not reverse an owner decision.** It restores `plan.md:370` (owner, 2026-10-06) and §6 of `cutover-write-lease-design.md`. Phase 9 step 1 (`phase-09:59-69`), the risk row (`plan.md:469`), the scorecard row (`F:201`), the estimate (`F:195`: 1.25–2.5 for 6b; serial sum 7.75–14, plus 1 = 8.75–15, matching the frontmatter `F:6`) and the DAG (`F:187`) all agree.
- **L12-9's Decision F revisit** keeps the owner's own deferral, so it is not a reversal.
- **L12-12 is narrow:** one file, before hash pinned and correct, a tests-first fail receipt required (`F:148`), independent review receipt required, and a null after hash grants nothing. It rests on owner context: `plan.md:330` leaves the `core/workflows` classifier "for Phase 8". Its side effect on `npm test` is not addressed (NEW-1).
- **L12-11 is executable under `fgos run`:**
  - The author Unit's runner commits the declared writes; its verify must be the common light proof (`F:77-84`), which excludes the reproduction test.
  - The Lead then dispatches a second Unit with `--writes` limited to the two Phase 6 manifests and passes it the real author commit id. That Unit's runner makes the accounting commit.
  - Because `checks.mjs` reads `exceptions` from the working-tree manifest and both manifests are allowlisted, the accounting Unit can even run the checks green before it commits (except raw B after Step 5).
  - Gap: `F:105` says only "the Lead supplies an accounting-only slice" and does not name this mechanism (Low, L-1).

## New findings

### High

**NEW-1. L12-12 makes `test/scripts/doc-rationale-reproduction.test.mjs` permanently red inside `npm test`, with no close or landing rule.**

Evidence:

- The test extracts both manifests and asserts `r.status === 0` for `checks.mjs` (`test/scripts/doc-rationale-reproduction.test.mjs`, "documented ownership commands…" loop).
- `checks.mjs` sets `result.ok` to require `B.ok` (`B.rows.every(expected===actual)`) and exits 1 otherwise.
- `scripts/run-tests.mjs` discovers `test/scripts/**` recursively, so this test runs in `npm test`. The file exists only on the plan branch (`git ls-tree main` shows no such file).
- After Step 5 changes `scripts/generate-shipped-path-inventory.mjs`, B is red forever by design (`F:109`: "do not call a raw red check or reproduction test green").
- Step 8 has the Lead run `npm test` and "never hide a new failure" (`F:184`). L5 (AGENTS.md DoD #5) requires `npm test` green.
- Nothing states whether this known red blocks the Phase 8 close, how it is attributed, or what happens when the plan directory and test reach main. If they land unchanged, main's suite goes red for every project contributor.

Fix: extend L12-12 with an explicit end-state.

1. Name the one expected-red assertion: test name, failing script `checks.mjs`, field `B.rows[path=generate-shipped-path-inventory]`.
2. Require the Step 8 scorecard to list it as the only allowed suite red, and have the close fail on any other red.
3. Put it in the owner close packet as an L5 exception, because accepting a permanently red suite test goes beyond a Lead A42 choice. `plan.md:394` says to stop and report when a gate cannot pass as authorized.
4. State which later phase retires or re-baselines that reproduction test before any main landing.

A smaller alternative is to schedule the classifier change last in Phase 8, so the red window is as short as possible.

**NEW-2. L12-13 names the wrong primitive: `withMainCheckout` is the shared main-checkout mutex with callback scope.**

Evidence:

- `src/runner/repo-locks.mjs:1-5`, `:22-49` and `:54-60` define `withMainCheckout(scope, purpose, fn)`. It holds the **rank-50 main-checkout mutex** that every merge and approve takes, holds it only while `fn` runs in one process, and releases in `finally`.
- The lock is "a kernel lock on an open file description … no TTL, no heartbeat … A holder that dies releases by dying."
- The plan names it as the reuse target in `OA:111`, `F:163`, `phase-09:55`, `phase-09:60` and `progress.md`. Taken literally, three owner decisions in `cutover-write-lease-design.md` §6 break:
  - Decision 5 asks for the main-checkout lock **primitive "with its own file"**, not the main-checkout lock itself.
  - Decision 3 asks to **allow code-only merges**. Holding the main-checkout mutex for the whole cutover blocks every merge.
  - Decision 1 asks to fail closed with explicit abandon. A callback-scoped, die-to-release kernel lock cannot persist across the multi-Unit, multi-process cutover. Holder death silently ends exclusivity unless the decision-10 committed "held" sidecar carries the freeze.
- The design's dispatch seams are also stale. §6/§7 (`cutover-write-lease-design.md:65`, `:170`, `:173`) cite `fgos dispatch execute`, which no longer exists: `fgos dispatch` keeps only `decide`, `inspect`, `reconcile` and `probe-account`, and execution goes through `fgos run` and `fgos workflow start` via `bind()`.

The Step 6b read-only reuse check would probably catch this. The problem is that the binding decision record itself points the Doer at the wrong door, which risks an unneeded "conflict" packet to the owner or a build that breaks merges.

Fix: reword L12-13, `F:163`, `F:165`, `phase-09:55` and `:60`:

1. Make the reuse target the holder-lock facade (`src/holder-lock/index.mjs` `acquire`) under a lease-owned lock name, beside the repo-locks door and not through `withMainCheckout`. Persistence and fail-closed come from the decision-10 sidecar plus the decision-9 token.
2. Map decision 2 (dispatch refusal) to the current doors: `fgos run`, `fgos workflow start`, `bind()`.
3. Keep `withMainCheckout` only for the brief ref-movement and commit step the cutover itself performs.

### Medium

**NEW-3. Step 6b-build has no collision gate against in-flight lock/Git lanes.**

L12-13 correctly drops the Git 04 dependency. But the build is lock/Git work while Git 04 (custody lease extension, which touches `src/runner/execution/run.mjs`) and COOK P2 are running; see board log `2026-10-19 01:05` and `2026-10-18 23:10`. AGENTS.md requires reading the board's shared-file collision list before lock/Git work. `F:165` and `F:168` require only a board status update.

Fix: before the 6b-build slice:

1. Re-pin the doors against current main.
2. Declare the exact file set.
3. Intersect it with the board's in-flight lanes.
4. If they overlap, sequence the slice through the board rather than building in parallel.

### Low

- **L-1.** Name the accounting-commit mechanism in `F:105`: a Lead-dispatched `fgos run` Unit with `--writes` limited to the two manifests, given the real author commit id, with the runner committing. State that hand commits are not used.
- **L-2.** Step 4 render batches (`.agents`, `plugins`, `core/skills`) can add hundreds of pairs per batch to two embedded literals. The review budget at `F:193`-`F:195` does not size that accounting review. Add `ceil(pairs/60)` parts per Step 4 batch to the budget.
- **L-3.** "Effective B" (`F:109`) has no mechanical evaluator. Record the comparison as a committed one-line jq/python receipt (raw B rows minus the lane path, all equal; lane `afterHash` equals the actual blob) so it does not rest on prose judgment.
- **L-4.** `step-00-unaccounted-pairs.json` is already 8 pairs behind HEAD (29 vs 21). This is expected under `F:104`, but the Step 0 slice brief should cite 29 plus the report commit, not 21.

## Checks that passed

- Both manifests' `checks.mjs` are logically identical, and the A replay reproduces the Doer's 21 exactly.
- The check B pins at HEAD all equal their expected values.
- The three auto-merge replays are byte-exact.
- The legacy-root queue rows are exactly 12.
- The estimate arithmetic adds up (7.75–14, plus 1 = 8.75–15).
- No Git 04 or migration-specific lease text remains anywhere in the plan.
- The Requirements and Success Criteria text is unchanged (`F:207-211`).

Status: DONE
Summary: The prior findings N1-N9, P8-4 and P8-5 are 11/11 fixed (N7 by a routed limitation). The 21-pair Step 0 list is exact at `7af1b1e6a`, and HEAD now has 29 (8 from `b89c8b02f`). L12-13 is consistent and restores the owner's decision, L12-12 is narrow and L12-11 is executable. New findings: 2 High (NEW-1: L12-12 leaves the reproduction test permanently red in `npm test` with no close or landing rule; NEW-2: L12-13 names the shared callback-scoped `withMainCheckout` mutex, which contradicts lease decisions 1, 3 and 5), 1 Medium, 4 Low. Verdict NEEDS-REVISION (text-only fixes).
