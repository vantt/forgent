Verdicts: 196 APPROVE / 8 REWORK

# W20 review: census settlement, citation binding and archive receipt

The JSON has 204 items: 191 census rows (the 187 originals plus the 4 additional drifts) and 13 commit-level checks. 7 census rows are REWORK, plus 1 commit-level REWORK (A-settlement-correctness) that rolls them up. G2 must stay `partial`.

- Reviewed: 4e49c3008 (A), 408078b9a (B), f67e0f676 (C). The worktree is at a8acd5d27, and source bytes do not change between a808bc676 and HEAD.
- Read-only. No git write, fgos CLI, suite or native addon was used. Node ran with `--no-addons`. Scratch was a tempfile dir under `/tmp/fgos-work/`, removed at the end.

## Proofs run

| Command (scratch `git clone --shared`) | Exit | Result |
|---|---:|---|
| `join.py --pin a808bc676…` at 4e49c3008, twice | 0 / 0 | stdout and all 3 outputs byte-identical to each other and to the committed files |
| `join.py --pin 98d9201f1…` at 408078b9a, twice (runs `citations.py --check`) | 0 / 0 | same |
| `node P/carries/verify-carries.mjs` | 0 | |
| `node P/carries/controls.mjs` | 0 | 5 rejecting controls, including stale-duty |
| `python3 -B P/gate-reconcile/verify.py` | 0 | it changed only `checkedAtHead`, and only in the clone |
| `python3 -B P/gate-reconcile/controls.py` | 0 | 9 rejecting controls |
| `patch --fuzz=0 --batch -p1`: forward, rollback, and `-R` of forward, for each of the 4 patches | 0 | every expected sha256 reached |

## How the rows were checked

- **Every row:** all 445 evidence lines were re-read with `git show <pin>:<file>`. Line text and full-file sha256 match in every case.
- **JS joins (122):** an independent acorn parse of each pinned blob locates the test callback that encloses each evidence line. 55 template-title rows and 2 shared-fixture rows have the site directly inside the named test.
- **Indirect joins (65):** I traced each by hand. The question was whether the named test actually reaches the helper or closure body that holds the expression, not just whether it imports the module.
- **Rust joins (12):** I traced each helper chain, including branch arguments. For example, `legacy(&f, true)` reaches the porting branch, and the `sync` loop covers the `else` arm.
- **REJECTs:** the 27 retired rows' files are absent at the pin. All five were deleted by 5a33989fa, which is an ancestor of the pin. For the 25 drifted rows, each original graded span was compared with current bytes.

## Findings

### F1: Medium, REWORK. Seven owning-test joins name a test that never runs the expression

All seven are helper or closure bodies joined to a sibling test that never calls the helper:

| Row | Site | Named test | Why wrong | Real caller |
|---|---|---|---|---|
| pc-d-0446 | failover-fixture.mjs:157, the `llmAccounts && …` branch | run-provider-failover:19 | passes only `recentlyUsed`, so `llmAccounts` is null | :491 |
| pc-d-0448 | :182, `summaryOf` | :491 | never calls `summaryOf` | :19 (line 51) |
| pc-d-0450 | :188, `panel()` seats | :19 | runs `solo` only | :179 |
| pc-d-0453, pc-d-0454 | :202, `unitRuns()` | :179 | never calls `unitRuns` | :331 and :360 |
| pc-d-0479, pc-d-0480 | documentation-cutover-lease:37, `worktree()` closure | :52 | never calls `f.worktree()` | :67 |

The failover rows look like detail text and owners shifted onto the wrong lines:

- pc-d-0447 and pc-d-0449 carry the "llmAccounts branch" text but sit on `attemptsOf` and `runFile`. Their owner, :491, does reach both, so they are approved with a Low note.
- The receipt says "failover's llmAccounts branch joins a test that actually supplies pool accounts". That is not true for pc-d-0446.

**Fix:** re-point these seven rows to their real callers in `settlement-decisions.json`. Rewrite the detail text and evidence of pc-d-0447/0449 to bind the actual calls (:501, :508). Re-run `join.py` twice. Correct the receipt sentence.

### F2: Low, NOTE. Detail text that does not match the graded line

- **pc-d-0924:** the detail describes line 3867, the acquire options. The graded span is the JSON return at 3868. REJECT still holds.
- **pc-d-1101:** join.json rebinds the expression to current line 30, a new `fgosDir: path.join(cwd, '.fgos')`, while the detail says the expression was removed. Line 30 is also non-document runtime state, so REJECT holds, but the row should say so.

### F3: Info

- **Successor joins:** four joins (pc-d-0396, -0444, -0618, -0678) have no exact expression at the pin. They join to a successor config writer that the same test still exercises. These are defensible, but this treatment differs from the drifted-grade rule ("do not rebind gone expressions").
- **pc-d-0214** is a `use std::path::PathBuf;` import. The join is valid, but REJECT would describe it better.
- **Template-title joins:** most of the 55 rows join a template test title to its own test. That is valid custody, though nearly tautological.

## Commit B (408078b9a): APPROVE

- **Citation holders:** each holder section owns the cited text after cutover.
  - Seat-binding §5.4 and §6.3 and distribution "Entry Points & Triggers" are byte-identical to the source sections at 244a04354.
  - The distribution binding correctly uses that section, not "2. Entry Points".
  - The RUL-WF-27 block is byte-identical and contains the "binding is a rebuildable view" clause cited by registrations.mjs:6354.
  - Ledger pointers, holder sha256s and anchors all resolve.
- **Pointer patches:** all four replay with zero fuzz forward and back, are `applied: false`, and HEAD files equal `beforeSha256`.
- **Stale-duty control:** the new control genuinely rejects a duty whose path has an unapplied but non-drifting patch.
- **Heading row 55:** the removed target was an exact duplicate.
- **Misc-fix receipt relabel:** correct. It also adds one cleanup-proof sentence, so it is not strictly label-only (Info). That sentence is supported by `misc-replay.json`.
- **Register:**
  - G0, G1 and G6 cleared items cite W19 sections B and C accurately.
  - G1 discloses that the stale-duty and duplicate-target cleanup are not yet reviewed.
  - G2 stays `partial`.
  - Counts reconcile: 780 + 289 + 53 + 4 = 1,126.

Given F1, G2 must stay `partial` after this review.

## Commit A register corrections: APPROVE

All brief items are present:

- G2 is back to `partial` with a `remaining` entry.
- The G9 note gives the exact W15 coverage (50 rows in full, 60/288 sampled).
- G6 cites L13-17.3 (note) and L13-17.2 (F item).
- The G0 F duty includes /bindingRefresh/124..126.
- The G3 note no longer cites W3.

## Commit C (f67e0f676): APPROVE

- Records-only: all four paths are under `plans/`.
- `proofs`, `coldRunImplementation`, `blocker` and `deferred` moved verbatim under `historicalSandboxAttempt`, and no other key changed, so no information was lost.
- Current values match archive data:
  - `verification.json`: exit 0, status verified.
  - `rehearsal.json`: 6 runs; cold run 1 at 2.93 s for after-final-pin-without-gates and 41.70 s for before-final-pin-with-gates.
- design.md line 3 states the verified Lead run.
- Info: `postMeasurementEdits` lists only this commit's edits. 25e8842d3 had already changed receipt.json after measurement, and only `postMeasurementNote` covers that, generically.
