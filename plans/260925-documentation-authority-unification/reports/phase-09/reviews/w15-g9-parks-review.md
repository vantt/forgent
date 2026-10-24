# W15 review: G9 park judgments (commit 63c884240)

Reviewer: independent, read-only. Branch `plan/260925-documentation-authority-unification`, HEAD `d9c65b9f6`. Doer pin `0763c2259` (the parent of the commit, as the receipt says).

## Verdict

**ACCEPT_WITH_FIXES.** The data is consistent and the replays are exact. The still-valid sample has no wrong verdicts. Two disposition problems still need a fix before G9 counts as closed:

- 3 of the 5 owned parks are not "undecidable from the repo".
- 1 of the 32 supersessions retires live references.

Neither problem changes a document byte. Both change who owns which claim.

## 1. Scope

`git diff --name-only 63c884240^ 63c884240` lists only `P/reports/phase-09/g9/**` (26 files). The merge `d9c65b9f6` brings in other lanes' files, not this Doer's. **Pass.**

## 2. The 5 owned parks

| Record | Result |
|---|---|
| `step-03-records/batch-126.jsonl:2`, `step-05-records/generators-skills-and-support.jsonl:66` (backlog) | **Park holds.** STR70a (`work-state.md:647-675`) and STR62 (`:864`) are still in current `docs/backlog.md` (lines 34/36/130). Rewriting them means choosing a new product claim, so the backlog owner has to decide. Small error: the next action says "regenerate docs/backlog.md through the owning backlog writer", but the backlog is no longer generated. The bound delta itself shows the `GENERATED FILE` header was removed, and the only src reader is `identity-checks.mjs`. |
| `runtime-judgment-part-27.jsonl:35` (`loop.mjs`), `:39` (`operation-choice.mjs`) | **Park does not hold.** Every changed passage is a REJECT non-document trace: `refs/heads/...`, `rev-list`→`compareCommits`, `settleClaim`→`addOutcome`, log text, `snapshotRunnerConfig`→`ensureRunnerConfigForDir`. All of the ADMIT docsRef traces (012848/012849, 013081/013113/013132...) are `moved`, so they are byte-equal. The drift question can therefore be answered from the repo: these rows are still valid, in the git-infrastructure group. The docsRef export is a record-level `parked` / `stateExportDependency` blocker from phase 08, not a G9 drift question. |
| `generators-skills-and-support.jsonl:200` (`knowledge-migration.mjs`) | **Same problem.** The only changed ADMIT passage (008175) swaps `git add` for `ScopedCommit` around the same oldPath→newPath move. The 22 registry-dependent operations were already parked in the record itself (`parked`, 22 entries). |

**Inconsistency, with evidence.** 15 records carry a record-level `parked` export dependency. G9 gives them four different dispositions:

| Disposition | Count | Records |
|---|---:|---|
| still-valid | 5 | e.g. `runtime-judgment-part-28.jsonl:6`, which has the same "Authorized persisted Work.docsRef" dependency as the two WORK parks |
| needs-recomposition | 5 | e.g. `runtime-judgment-part-22.jsonl:13` (44 parked) and `setup-doctor-roots.jsonl:21` (45 parked, the same registry export as knowledge-migration) |
| superseded | 1 | |
| owned-park | 4 | |

The rule "park only if the repo cannot decide" is applied to 3 of them and not to the other 11. The owners are real (WORK is a live lane), and the next actions can be carried out. The issue is classification: G9 parks are mixed with phase-08 export blockers.

## 3. The 32 superseded rows

Every successor checks out at the pin:

- 25 git-change rows: commit is an ancestor; before/after/diff hashes match; status is `D` for 24 and `M` for `approve.mjs`; the path is absent at the pin.
- 4 json-pointer rows: whole-file sha and `expected` are equal. `reading-map.md` is still `46c52e95…` at the pin, which equals the action's `currentSourceSha256`. `docs/reading-map.md` §5 exists.
- 3 jsonl rows: `batch-040.jsonl:4` line sha matches and `retiresWithTree` is true. The new npm-init refusal text is carried in `docs/platform/packaging-distribution/spec.md`.

**Wrong disposition: `step-04-records/step04-029.jsonl:1` (`src/verbs/merge/approve.mjs`).** Only edges `class6-l-000484`/`000485` were removed by `e71381aba`. Edges `000481` (`docs/history/tsk-3bn-…`, now lines 267-268), `000482` (`docs/history/leaf-merge-into-resolved-root/`, 308-309) and `000483` (`docs/decisions/0032`, 362) are still in the file, byte-equal (`moved`). Retiring the whole record leaves three live preserve edges with no owner. The fix: mark it still-valid, with the two removed edges retired by `e71381aba`.

Minor: `runtime-judgment-part-25.jsonl:9` is a rename (`packages/identity/rust/src/provider.rs`), not a deletion. Its operands are all REJECT non-document, so calling it superseded does no harm.

## 4. The 13 needs-recomposition rows

These cover 11 distinct specs; `mcp.rs` and `Cargo.toml` appear twice. In a `tempfile` dir under `/tmp/fgos-work`, I replayed each one at the pin `0763c2259` and again at `d9c65b9f6`. All 22 runs matched the before hash, ran forward with `patch --batch --fuzz=0 --reject-file=- -p1` (exit 0), matched `expectedAfterSha256`, rolled back (exit 0) and came back byte-exact. Compared with the pin's `recomposed.json`, the original 545 bodies are unchanged and one was added (`workspace.rs`).

The new `workspace.rs` body changes only a comment. It replaces `docs/specs/distribution.md:297` with the Git Common Directory Discovery contract, which is real at `activation-binding.md:484` and names `GitDriver::open_at`. The diffs I read (gateway Cargo, indexing SKILL, `bin/fgos.mjs`, dead-vocabulary guard) fit their drift. **Pass.**

## 5. Still-valid sample (60 of 288)

The sample is stratified with seed 15:

| Family | Rows |
|---|---:|
| step-03 | 4 |
| step-04 | 5 |
| runtime-r19/20/21 | 7 |
| runtime-judgment | 10 |
| generators | 6 |
| setup-doctor | 3 |
| tests-cutover | 6 |
| tests-judgment | 13 |
| tests-mechanical | 3 |
| tests-root | 3 |

For each row I read the changed/absent deltas, the trace admission/role of each changed passage, and the reason. Where a reason claims a reference survives, I grepped the current file to check (`resolve.mjs:9`, `rename.sh:4/24`, `runner-loop.test.mjs`).

**Wrong verdicts: 0.** The threshold for REWORK was more than 3, so the sample passes. Almost every changed passage is a REJECT non-document operand, or a whole-file overlap whose referenced role is unchanged.

Weaknesses (not wrong verdicts):

- **Borderline verdict:** `runtime-judgment-part-26.jsonl:2` (`classify.mjs`). All 4 bound passages are absent, yet it is still-valid. Whole-file deletions are treated as superseded instead. Population-wide, the same pattern also appears at `runtime-r20.jsonl:147`.
- **Reason is wrong on a fact:** `tests-judgment-batch5.jsonl:25` says the RESEARCH.md/doc-history comparisons "remain". They were removed (absent); the current file has one unrelated `docs/history` reference at line 269.
- **Changed bytes not explained:** protected co-cut deltas (`AGENTS.md`, `transitional-switchboard.json`) are not mentioned in the reasons of generator/setup-doctor rows such as `:195`, `:109`, `:221` and `setup-doctor-roots:13/15/22`. `judgment_errors` requires `reviewedDependencies` only for explicit/canonical dependencies, not for co-cuts.
- **Group labels do not fit the reason:** `batch-040.jsonl:4` is in process-lock-identity, and `tests-judgment-batch7.jsonl:150` is in git-infrastructure although its reason is about Seat Binding.

## 6. Sweep and counts

| Check | Exit | `/tmp/fgos-work` before / after |
|---|---:|---|
| `python3 -B …/g9/sweep.py --check --pin HEAD` | 0 | `w14-g0-review` only / same |
| `python3 -B …/g9/sweep.py --check --pin 63c884240` | 0 | same / same |

Sweep result: 546 files, drifted 0, chain mismatches 0, body mismatches 0, judgmentErrors 0.

Counts:

- `judgments.json` = 517 / 20 / 32 / 5 and the former parks = 288 / 13 / 32 / 5. The "before" numbers (229 / 7 / 338) match the pin's `judgments.json` and `inputCounts`. No non-park row changed its disposition.
- 4,112 deltas, 14,922 `passagesRead` and 546 bodies match the receipt.
- Drift reopens a row: `judgment_errors` recomputes `evidenceSha256` from the live passages.
- `verify.py` was not run, as the brief forbids it.

## Required fixes

1. Reclassify `runtime-judgment-part-27.jsonl:35`/`:39` and `generators-skills-and-support.jsonl:200` as still-valid, carrying their existing record-level parks. Alternatively, if record-level export blockers are meant to become G9 parks, apply that to all 15 records that have them, with named owners.
2. Change `step04-029.jsonl:1` from superseded to still-valid, retiring only edges 000484 and 000485 via `e71381aba`.
3. Fix the backlog parks' next action: hand edit plus the `identity-ids-unique` doctor row, with no "regenerate" step.
4. Optional: correct the reason for `tests-judgment-batch5.jsonl:25`, decide on one rule for all-absent records, and mention the co-cut deltas in the group explanations.
