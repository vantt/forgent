# Rationale follow-up receipt

Base HEAD: `429b987e1d2dc9244421cded74fdb2aef9fe4c41`.
Brief: `../w28-g0-rationale-brief.md`; independent findings: `../reviews/w27-g0-stale-verdicts-b7.{md,json}` and `../reviews/w27-g0-stale-verdicts-b8.{md,json}`.

## Outcome and proof boundary

Corrected 27 current rows in 10 decision shards. Only `rationale` changed, plus the two expressly authorized `placement.selected.textDigest` snapshots. All 27 rows already had `reviewStatus: pending` and retain it. Bindings, dispositions, source identities, supersession chains, historical review snapshots, residual references and residual records are unchanged. No product file, review, register or existing script was edited; no pair accounting was performed.

- `rebind/rebind.py --check`: **exit 0**, unresolved drift **0**, both before and after the edits. Full final output: [rebind-check.json](rebind-check.json).
- `g0join/join.py --pin HEAD`: **exit 1**, 1,927 effective rows, 1,920 approved, exactly **7 stale/open-REWORK** rows, all seven corrected in this turn; missing/mismatched/invalid/unresolved = **0**. Full unmodified stdout: [join-429b987e1.json](join-429b987e1.json).
- Working-tree scope/fingerprint check: **exit 0**, **27** changed rows, **1,900** unchanged approved effective rows, **0 unrelated open rows**. Every changed decision has a new fingerprint without a matching independent verdict. See [followup-working-tree.json](followup-working-tree.json).
- Current target extraction and coordinate checks: **exit 0**, all 27 changed rows resolve by exact anchor plus complete digest. Non-blocking placement observations are recorded in [followup-placement-evidence.json](followup-placement-evidence.json). Both residuals have source lines **1, 2, 5, 9, 10**, and both `residualSha256` values recompute.

**Outstanding committed proof:** `join.py` explicitly reads committed blobs only, including decision history and reviews. It cannot observe this worker's edits at unchanged HEAD. The worker may not make any git write; therefore the seven old REWORK verdicts remain open in the honest HEAD output. After the runner commits, rerun the exact join command at the new HEAD: the expected remaining review obligations are the 27 rows below as stale/missing, with no open REWORK on the old fingerprints and nothing unrelated open. The working-tree check is not presented as that committed proof or as an independent approval. No script, pin, git object or review was fabricated to hide this boundary.

## Every changed row

Paths in this table are relative to `plans/260925-documentation-authority-unification/ledger/decisions/`. `R` means rationale only; `R+P` additionally refreshes the selected placement digest. Each row remains pending independent review.

| Shard | JSON pointer | Fields | Correction |
| --- | --- | --- | --- |
| `g0-content-redecisions.json` | `/bindingRefresh/45` | R | Explicitly names `(9 file)` → `trong nhiều file (ví dụ …)`. |
| `g0-content-redecisions.json` | `/bindingRefresh/125` | R | Names both Authoring/Index `Spec` → `Contract` link-label changes; preserves /20 lineage. |
| `g0-content-redecisions.json` | `/bindingRefresh/126` | R | Names both link-label changes; preserves /21 lineage. |
| `s2-agent-coordination-truth-judgment.json` | `/claims/404` | R | Current target line 354, not 322; prior reviewed digest is explicitly historical. |
| `s3-host-invocation-boundary-gaps.json` | `/registryGaps/16` | R | Current target lines 71–85; removes contradictory unchanged-since-review assertion. |
| `s4-packaging-distribution-architecture.json` | `/claims/214` | R | Current block-23, line 258, Canonical Release Tree Rules; actual Legacy CLI link and changed destination; historical block shifts distinguished from current placement. |
| `s4-packaging-distribution-successors.json` | `/registryGaps/22` | R+P | Lists residual lines 1/2/5/9/10, cites `import2/`, selected digest `299c5b49…` → `e8167a0a…`. |
| `s5-root-authorities-boundary-gaps.json` | `/registryGaps/3` | R+P | Same residual enumeration/reference/digest refresh; corrects obsolete assertion that item 4 is verbatim in the current successor. |
| `s5-root-boundary-sync.json` | `/registryGaps/35` | R | Current block-101, lines 1244–1294, including L12-44 note and target-side disposition prose; historical source block-102 retained as historical. |
| `s5-root-boundary-sync.json` | `/registryGaps/36` | R | Current target lines 71–85; prior reviewed digest explicitly historical. |
| `s8-agent-confinement-01.json` | `/claims/145` | R | Candidate lines 381–382. |
| `s8-agent-confinement-01.json` | `/claims/147` | R | Candidate lines 386–396. |
| `s8-agent-confinement-01.json` | `/claims/149` | R | Candidate line 400. |
| `s8-agent-confinement-01.json` | `/claims/150` | R | Candidate lines 402–421. |
| `s8-agent-confinement-01.json` | `/claims/151` | R | Candidate lines 423–426. |
| `s8-agent-confinement-01.json` | `/claims/152` | R | Candidate lines 428–429. |
| `s8-agent-confinement-01.json` | `/claims/154` | R | Candidate lines 433–445. |
| `s8-agent-confinement-01.json` | `/claims/155` | R | Candidate lines 447–448. |
| `s8-agent-confinement-01.json` | `/claims/158` | R | Candidate lines 459–468. |
| `s8-agent-confinement-01.json` | `/claims/159` | R | Candidate lines 470–485. |
| `s8-agent-confinement-01.json` | `/claims/160` | R | Candidate lines 487–494. |
| `s8-observe-01.json` | `/claims/4` | R | Replaces contradictory unchanged-since-review assertion with historical-review statement. |
| `s8-observe-01.json` | `/registryGaps/2` | R | Same historical-review clarification. |
| `s9-runner-01.json` | `/claims/9` | R | Same historical-review clarification. |
| `s9-runner-01.json` | `/claims/12` | R | Cites block-11 ruling `s13-resync-a.json#/sourceBindings/343`, not block-10. |
| `s9-runner-01.json` | `/registryGaps/0` | R | Current block-101, lines 1244–1294, including L12-44 note and target-side disposition prose; removes unchanged-since-review contradiction. |
| `s9-runner-01.json` | `/registryGaps/33` | R | Prior reviewed digest explicitly historical. |

The review's additional note on `s9-runner-01.json#/claims/484` needs no edit: current rationale already says “No prior reviewed target digest available; no unchanged-since-review claim”, and the bound target is correctly line 25. It was extracted and checked, not changed. The two `import2/partial-carry-residuals.json` records already bind current digest `e8167a0a…`; no rewrite or residualRef hash refresh was necessary.

## Commands and exit codes

All task commands ran in `/home/vantt/projects/forgentX-p9-w1-d4`. `B` below abbreviates `plans/260925-documentation-authority-unification/reports/phase-09`. Every Python task invocation used `python3 -B`; all Node extraction was under `NODE_OPTIONS=--no-addons`. Read tools loaded the brief, four reviews completely, reading map, routing skill, join/rebind/bindings implementations, placement evidence and actual target/ruling excerpts. This was a preassigned records-only worker, not a Work lifecycle driver.

| Command / invocation | Exit | Observation |
| --- | --- | --- |
| `pwd` | 0 | Confirms assigned worktree. |
| `git status --short` (initial and subsequent inspections) | 0 | Initially clean; later only scoped ledger/evidence artifacts. |
| `git rev-parse HEAD` (initial and proof wrappers) | 0 | Base pin above; no git write. |
| `git log -4 --oneline -- plans/260925-documentation-authority-unification/ledger/decisions/g0-content-redecisions.json` | 0 | Prior rationale/rebinding history inspected; no mechanism designed. |
| `python3 -B -` — review-selected full-row inspection | 0 | Initial broad inspection also printed historical snapshots; no writes. |
| `python3 -B -` — review-selected current-rationale inspection | 0 | Restricted inspection to current rationale/selected placement. |
| `python3 -B -` — focused seven-row, sibling and non-blocking rationale inspection | 0 | Located exact text and existing pending statuses. |
| `python3 -B "$B/g0join/join.py" --pin HEAD` (captured by Python wrapper) | **1** | Exact committed output in `join-429b987e1.json`; wrapper exits 0 after recording nonzero join result. |
| `NODE_OPTIONS=--no-addons python3 -B "$B/rebind/rebind.py" --check` (initial capture) | **0** | No unresolved drift. |
| `NODE_OPTIONS=--no-addons python3 -B -` — existing `rebind.extract` placement/residual inspection | 0 | Wrote placement evidence; extractor's tempfile directories removed on exit. |
| `python3 -B -` — exact-occurrence and indentation inspection | 0 | Disambiguated live rationale/placement edits from immutable snapshots. |
| `python3 -B -` — ruling, residual enumeration and JSON-field-context inspection | 0 | Confirmed s13 /343, residual source lines and unique live-row context. |
| `python3 -B -` — s9 rationale uniqueness/status inspection | 0 | Full /12 rationale is unique; pending status already set. |
| `git diff --check` | **0** | No whitespace errors. |
| `python3 -B -` — complete old/new JSON and fingerprint check | **0** | Wrote `followup-working-tree.json`; 27 allowed row changes, unchanged bindings and all historical snapshots, no unrelated open effective rows. |
| `NODE_OPTIONS=--no-addons python3 -B -` — final target-coordinate/residual-hash verification | **0** | Authenticated all 27 targets and current coordinate assertions; both residual hashes recompute. |
| `NODE_OPTIONS=--no-addons python3 -B "$B/rebind/rebind.py" --check` (final capture inside previous invocation) | **0** | Final `rebind-check.json`: drift 0. |
| `git diff --stat` | 0 | Ten ledger files, 29 removed/29 added physical JSON lines. |
| `python3 -B -` — artifact-size inspection | 0 | Deterministic HEAD join retained whole, approximately 3.97 MB. |
| `python3 -B -` — final HEAD join replay, diff/scope/index audit | **0** | Child join exit **1**, stdout byte-identical to saved output; `git diff --check`, `git diff --name-only`, `git ls-files --others --exclude-standard` and `git diff --cached --name-only` all exit **0**; 15 scoped files, index untouched. |

Edits used exact-replacement tooling, not git writes. Three rejected replacement attempts (one g0, two s9) matched multiple occurrences and changed no bytes; they were retried with unique live-row context. One read requested an offset beyond EOF and returned no content; subsequent JSON inspection resolved the context. No product tests, audit-report script, fgOS CLI, native addon or secret were used. No task-owned scratch remains; extraction uses the existing `tempfile.TemporaryDirectory` cleanup under `/tmp/fgos-work/`.

## Reproduce the two owning proofs

```sh
B=plans/260925-documentation-authority-unification/reports/phase-09
NODE_OPTIONS=--no-addons python3 -B "$B/rebind/rebind.py" --check
# Recorded exit: 0.
python3 -B "$B/g0join/join.py" --pin HEAD
# Recorded exit at 429b987e1: 1, exactly seven stale/open-REWORK rows.
# After runner commit: rerun at new HEAD and retain join-<shortpin>.json.
```

The supplemental check reuses `bindings.rows/at/payload/digest` and `join.row_fingerprint/records`; it does not grant author approval, alter the join implementation or create a pretend commit. The next owner should read the outstanding proof boundary above before treating this receipt as completion.
