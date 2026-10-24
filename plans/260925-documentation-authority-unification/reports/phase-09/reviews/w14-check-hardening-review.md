# Check hardening review (w14)

Commit checked: `daa87810b` "harden live overlay checks and disposable replay workspaces" (parent `8b4d778d3`), against `w13-check-hardening-brief.md`. That brief answers A-M1, A-L1, B-L1, B-L2 and B-L3 of `reviews/w13-misc-pin-and-gloss-review.md`.

Verdict: **pass with findings**. All five findings are fixed, and each fix held up when I re-ran it myself. One low finding is left: the old scratch directory `/tmp/fgos-work/w11-misc-pin` still exists on this machine. The other three notes are info only. Nothing blocks the next step.

## Scope: pass

The commit touches 41 files. `git show --name-only` shows none outside `reports/phase-09/{misc-fix,g9,composition}/**`.

## A-M1, live misc-fix check: pass

`check_live` in `misc-fix/rebind.py` now does the following:

- It requires the same row-pointer set as the authoring shard.
- It requires the effective destination to be the row itself.
- It checks `bindingSha256 == digest(current)`.
- It requires `reviewStatus == 'pending'`. There is no approval record, and the code says so.
- It compares the whole live row with the expected row. The expected row is the authoring row, plus the 136/5 disposition prose regenerated against the authoring docs. It is then advanced only by exact committed full-row before/after transitions. Uncommitted records, ambiguous matches and snapshots that change nothing all fail.

I ran my own controls in memory on a deep copy of the docs, not on the real ledger. I used `check_live(shard, commit, docs)` and chose rows 5 and 18, which are different from the Doer's rows 2 and 14. Row 18 has a later rebind.

| Control | Result |
|---|---|
| Unchanged tree | PASS: 27 rows, 3 with a later rebind |
| `reviewStatus=approved` (rows 5 and 18) | FAIL: `misc-fix live review requires committed exact-claim/binding approval` |
| `bindingSha256` set to zero (rows 5 and 18) | FAIL: `misc-fix live binding hash` |
| `disposition` changed (rows 5 and 18) | FAIL: `live row differs ['disposition']` |
| Binding change with a recomputed hash, no record (row 5) | FAIL: `live row differs ['bindingSha256','targetUnitDigest']` |
| Extra field `approvedBy` (row 5) | FAIL: `live row differs ['approvedBy']` |

A full `python3 -B misc-fix/rebind.py --check` run exits 0: 283 bindings, 27 changed rows, 21 with changed content. The receipt now says which checks run at the authoring commit and which run live, and the wording is accurate.

## A-L1 and B-L2, scratch: pass for the code (see L1)

- `misc-fix/rebind.py`, `verify.py` and `pin-controls.py` each create one `tempfile.TemporaryDirectory` per run under `/tmp/fgos-work`.
- `g9/recompose.workspace()` now uses `mkdtemp` and removes only its own directory, so the race is gone.
- `w11-followup.py` and `w12-gloss-polish.py` have no fixed `TMP` left.

I listed `/tmp/fgos-work` before and after these runs, and the listing did not change (22 entries):

- `misc-fix/verify.py`: exit 0.
- `misc-fix/rebind.py --check`: exit 0.
- `g9/sweep.py --check --pin HEAD`: exit 0.

`verify.py` rewrote `checks.json` (8 changed lines). I restored it with `git show HEAD:<path>`, and `git status` was clean afterwards.

## B-L1, list-label rule: pass

`audit_glosses` now rebuilds the after-file bytes, asserts that each witness line equals them, and looks at the lines just before and after in that file. When a neighbour lost its label, it also looks at that neighbour's original witness text. The audit covers 104 witnesses: 102 pass, 2 pass after review, and `reviewRequired=[]`. 11 are now treated as vertical lists, 3 more than before (these were single-citation items before).

## B-L3, witness #2: pass

The new text says: "two forks recorded at the time (section 16): the Stop-drain decision, later settled so that only wake-enabled mail starts an idle turn, and the record layout". It no longer calls the decision open, and it matches witness #0 (answered 2026-10-20, only `wake:true`).

I replayed the chain myself in scratch with GNU patch 2.7.6 and `--batch --fuzz=0 --reject-file=- -p1`:

- `w8:gloss` patch 98 and its g9 successor, spec 364, carry the same diff.
- The preimage at `eb744281d`, `8b4d778d3` and HEAD equals `beforeSha256`.
- Forward: exit 0, result equals `expectedAfterSha256`, and line 692 carries the new wording.
- Rollback: `-R` exits 0 and gives back the exact before bytes, and so does `rollbackDiff`.

`w13-citation-verification.json` records 130 findings before and 0 after (exit 0, "no findings").

## Findings

- **L1 (low): stale scratch directory still on the host.** `/tmp/fgos-work/w11-misc-pin` (`misc/`, `verify/`, last written 02:15–02:29, before the commit at 02:58) still exists on this machine. The receipt says it "was already absent in this isolated environment" and that the base directory is empty after the proofs. That was true only inside the Doer's sandbox. No current check recreates it. Lead should remove it.
- **I1 (info): where the corrected disposition comes from.** The 136/5 disposition text is taken from HEAD's `rebind.py` `generate()` output, not from a committed record. If someone edits that prose and the live row together, the check still passes. The diff of the script would show the edit, so this is acceptable. It does mean the disposition prose has no separate record to check it against.
- **I2 (info): `reviewStatus` is fixed to `pending`.** Any future real approval will fail the check until the code names that approval record. This fails closed, which is correct, but the next approval also needs a code change.
- **I3 (info): fixed scratch paths remain outside this brief.** `rebind/rebind.py` (`w5-rebind-apply`), `import3/resync.py` (`w11-import3`) and older `composition/` scripts (`compose.py`, `w10-rework.py`, `complete-parks.py`, `verify-effective.py`) still use fixed paths. The owning rebind check was run through a wrapper that moves its scratch into a temporary directory, and the receipt says so.

Scratch from this review was deleted. Git tree clean.
