# A50 replacement mapping review request — step 02g

Status: **AUTHOR PACKET; third independent pilot pending; Step 2 / class 3 OPEN.** This is the ONE replacement request under L12-23. The entire 98-part 02f packet is **SUPERSEDED**, including undispatched parts. Its census, scripts, request and all pilot reports remain unchanged evidence. Earlier 02c/02e packets stay superseded.

Input source commit: `bcbef05c15c0cedd6612cc178808b5b2efedc06f`. Rules: A49/A50 and L12-1–23, especially L12-21/22/23. No consumer edit, git write, fgOS CLI or state/secret access. Runner commits these plan-only artifacts; Lead later accounts the real commit/path pairs in the two unchanged reproduction manifests under L12-11. This is not independent acceptance.

## Review volume and pilot

- **5,436 edges / 1,036 files / 1,322 mappings** (02f: 5,436 / 1,036 / 1,325). All original 02c row dispositions, 59 external URLs and 197 overlay controls remain. No remote URL validation.
- **99 logical parts / 5,385 entries**, intentional set overlaps. Every part has ≤60 entries and ≤400,000 UTF-8 bytes including resolved rows and metadata; maximum **397,442 bytes**. One index, no per-part payload copies. Unique independent report names: `review-a38-step-02g-map-part-NN.md`. Author has created zero reviewer reports.
- Review every mapping, every exception/control, every rule/action/role variant and **816 seeded semantic edges** (ceil(15%)); seed `A50-step02g-L12-23-2026-10-19-v1`. ≥10 deep reads per part or all when fewer; every listed mandatory entry still requires a read. A mapping representative alone is insufficient. >3% rework expands the affected set; a sample breach expands semantic reading to the entire census. Existing failure sets stay open and cannot pass by sampling.
- Lead starts pilot 3 under A38: all parts containing former 02f **30/47/65** content, plus fresh parts selected by Lead. Their complete source-edge sets are mandatory below, even when rows now preserve or change class. Full review waits until the pilot is below 3% rework. Former 02e **03/26** content also stays mandatory. The verification-evidence population remains a full read after the earlier 03 breach.
- One fresh-context independent reviewer runs the full mechanical replay at committed HEAD in the plan worktree. Independent deep readers review the parts. **Started 0 / accepted 0 / elapsed 0 / budget unassigned**; Lead sizes actual volume and records budgets. No Doer-started reviewer or self-approval.

| Former packet / part | Source edges | Mandatory 02g parts |
|---|---:|---|
| 02e / 03 | 123 | 93, 94, 95 |
| 02e / 26 | 60 | 96 |
| 02f / 30 | 60 | 97 |
| 02f / 47 | 60 | 98 |
| 02f / 65 | 60 | 99 |

`step-02g-pilot-crosswalk.json` records every old/new source-span join and normal mapping part, and asserts complete membership of each mandatory set. The replay rebuilds it along with the other downstream tables.

## Reproduction and artifacts

Run from the plan worktree's committed HEAD (the root is derived from the script path, never the caller cwd):

```sh
PYTHONDONTWRITEBYTECODE=1 python3 plans/260925-documentation-authority-unification/reports/phase-08/step-02g-replay.py
PYTHONDONTWRITEBYTECODE=1 python3 plans/260925-documentation-authority-unification/reports/phase-08/step-02g-probes.py
```

For a pinned replay, append `--input-commit <input-source-commit-above>` to replay. The default independently reparses the current committed HEAD, so a later source/target change fails until the packet is regenerated. `inputHEAD` itself may differ after runner/accounting commits; all consumer bytes, target checks and downstream content must still agree. Do not run a raw 02f reparse and treat its filesystem results as proof.

- `step-02g-parser.py` reads the input tree with `git ls-tree -r -t -z` and blobs with `git cat-file --batch`; all existence/type/population checks use that tree. The unchanged anchor API receives committed content. Parser stdout is read-only. `--input-commit` is optional; default is HEAD resolved in the explicit plan-worktree root. Plan baselines/overlays are immutable inputs; no state is opened.
- `step-02g-packet.py` deterministically compiles the mappings, full exception sets, 15% sample, logical parts and pilot crosswalk. Canonical JSON is UTF-8 `json.dumps(value, ensure_ascii=False, sort_keys=True)` plus one LF. Capture temporary output only in `/tmp/fgos-work/`.
- `step-02g-probes.py` contains **69 differential probes**, each failing its immutable old behavior and passing the successor parser, plus separate invariant guards. Nine syntax probes and eight rejected replay mutation probes remain, including stale overlay, corrected-row hash, mapping/exception/sample/part joins. These are author checks, not independent reviews.
- [Per-defect diff](step-02g-defect-diff.md) and `step-02g-review-data.json` retain before/after counts, every ID, examples and measurement definitions against 02f and older baselines. Contextual classifications need independent deep review.
- `step-02g-verification.json` records actual author replay/test commands, results, script/artifact pins and scope checks. Acceptance still requires the committed runner result, separate manifest accounting and independent checks.

## Mandatory populations

| Set | Entries | Retiring-root consumer edges |
|---|---:|---:|
| behavioral-runtime-and-contract-triage | 1066 | 211 |
| mandatory-rereview-former-pilot-03 | 123 | 32 |
| mandatory-rereview-former-pilot-26 | 60 | 60 |
| mandatory-rereview-second-pilot-30 | 60 | 0 |
| mandatory-rereview-second-pilot-47 | 60 | 0 |
| mandatory-rereview-second-pilot-65 | 60 | 0 |
| mechanical-target-failures | 6 | 3 |
| native-dynamic-patterns | 9 | 0 |
| overlay-precedence-controls | 197 | 0 |
| phase9-row-flip | 79 | 0 |
| preserve-pending-behavioral-proof | 163 | 15 |
| preserve-pending-target | 463 | 299 |
| prior-anchor-check-failures | 21 | 0 |
| prior-target-failure-dispositions | 104 | 0 |
| seeded-semantic-edge-sample | 816 | 200 |
| semantic-roadmap | 2 | 2 |
| writers-and-writer-triage | 774 | 154 |

## Boundaries and later proof

All patches are Phase 9 specifications only. Parked/preserved rows carry no executable `new`; live writers/checks stay at Step 5 for destination/check parity. Migration cells flip by whole-row semantics. Source columns, retired handoff checkpoints, shipped project conventions and docs/history stay preserved. Explicit carriage preserves without aliases; **Phase 9's post-cutover link check excludes verbatim carriage regions**, including the 21 pre-existing broken links. No alias/checker/vocabulary was changed.

Class 4 is **NOT STARTED**: this turn stops at the class-3 boundary, whose independent pilot/full review, native/current-coordinate non-joins, adoption traces and IO parity remain open. Existing mechanical target failures, 104 prior target-failure dispositions, 21 earlier anchor failures and nine native dynamic controls remain mandatory. Exact-target/semantic approval, Step 5 generator behavior and installed-package reachability still gate later work. No claim of end-to-end closure, authority flip, manifest acceptance, gate waiver or full-suite pass. MDView is unavailable in this assignment's tool surface; open this request directly from disk.
