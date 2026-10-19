# A50 mapping review request — step 02h

Status: **AUTHOR PACKET; full independent review pending; class 3 / Step 2 OPEN.**
L12-24 accepts the third pilot (3/360 rework, 0.8%) and directs these seven narrow fixes
before full A50 review. The complete **105-part step-02h packet supersedes step-02g's
99-part request**. Old scripts, tables, requests and independent reports remain unchanged
evidence. This Doer starts no reviewer and claims no acceptance.

Input source commit: `f5033e20ad6d6be137217f0a8c17c35b3dd7e8f1`. Rules: A49/A50 and L12-1–24.
Only plan files are authored. No fgOS CLI, Git write, state/secret read, consumer edit,
source/render update or Phase 9 cutover. The runner commits; Lead accounts the real
commit/path pairs separately under L12-11 in the two unchanged reproduction manifests.

## Volume and review method

- **5,434 edges / 1,036 files / 1,322 distinct mappings**;
  step-02g had 5,436 / 1,036 / 1,322. Two code-only hits are now explicit exclusions.
  All 59 external URLs remain preserved and unvalidated remotely.
- **105 logical parts / 5,628 review entries**,
  maximum **397,442 bytes**. Every part contains ≤60 entries
  and ≤400,000 UTF-8 bytes including its resolved rows and metadata. Parts are indexed,
  with no duplicated payload files. Unique output names: `review-a38-step-02h-map-part-NN.md`.
  Independent replay report: `review-a38-step-02h-map-replay.md`. Neither is authored here.
- Deep-read **every distinct mapping**, every action/rule/role variant, every exception
  set and **816 seeded edges (ceil(15%))**. A representative alone
  is insufficient. Seed: `A50-step02h-L12-24-2026-10-19-v1`. Read ≥10 per part or all if fewer;
  every mandatory entry still requires its full read. >3% rework expands the affected
  set; a sample breach expands the semantic read to the entire edge population.
- Lead starts one fresh-context A38 reviewer for the all-edge mechanical replay and
  dispatches deep-read parts **in waves of two parts per reviewer**, using the index's
  bounded parts. Independent started/accepted/elapsed: **0/0/0**; budgets remain Lead-owned.
  No further pilot gate is invented: L12-24 already authorizes this full review after fixes.

## Mandatory changed rows and pilot carry-forward

| Former packet / part | Source edges | Current edges | Explicit exclusions | Mandatory 02h parts |
|---|---:|---:|---:|---|
| 02e / 03 | 123 | 123 | 0 | 96, 97, 98 |
| 02e / 26 | 60 | 60 | 0 | 99 |
| 02f / 30 | 60 | 60 | 0 | 100 |
| 02f / 47 | 60 | 60 | 0 | 101 |
| 02f / 65 | 60 | 60 | 0 | 102 |

- `mandatory-rereview-action-changed-from-02g`: **74 rows**, parts **104, 105**; every entry mandatory.
- `mandatory-rereview-excluded-from-02g`: **2 rows**, parts **103**; every entry mandatory.

The crosswalk records each former source edge's physical join, current mapping parts,
and explicit exclusion controls if the source token is code. Changed-action membership
is rebuilt from source-span joins against immutable 02g rows; none disappear merely
because they move out of a previous exception set. Mapping target/anchor changes that
retain the same action still receive the required all-mapping deep review.

## Reproduction

From the plan worktree's committed HEAD, or any cwd with the absolute script path:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 plans/260925-documentation-authority-unification/reports/phase-08/step-02h-replay.py
PYTHONDONTWRITEBYTECODE=1 python3 plans/260925-documentation-authority-unification/reports/phase-08/step-02h-probes.py
```

Append `--input-commit <input-source-commit>` for a pinned replay. Default HEAD resolves
in the plan-worktree root derived from the script path. All source population, bytes,
existence/type checks and heading correspondence come from `git ls-tree` and
`git cat-file` at that commit. Plan baselines are immutable input artifacts. The unchanged
anchor API consumes committed text; no target path uses filesystem existence or caller cwd.
`inputHEAD` alone may advance after the runner/accounting commits; a change to any
consumer, target proof or downstream row still fails replay until regenerated.

`step-02h-parser.py` prints the read-only census; `step-02h-packet.py <census-json>`
prints deterministic derived tables. Canonical serialization is UTF-8
`json.dumps(value, ensure_ascii=False, sort_keys=True)` plus one LF. Scratch stays in
`/tmp/fgos-work/`. `step-02h-probes.py` extends all 69 earlier differential probes with
the seven L12-24 classes, JSON values, History boundaries and the surviving read-regex
mutation. Each differential witness rejects old behavior and passes the successor;
invariant guards are reported separately. Replay also runs nine syntax checks and
eight mutation checks, including stale overlay/corrected-row/sample/part joins.

[Per-defect diff](step-02h-defect-diff.md) gives every defect-class count against 02g;
`step-02h-review-data.json` retains full old IDs, examples, predicates and comparisons
against the earlier immutable baselines. `step-02h-verification.json` records actual
author commands/results and scope pins. Independent committed-byte proof is still required.

## Mandatory populations

| Set | Rows | Retiring-root consumer edges |
|---|---:|---:|
| behavioral-runtime-and-contract-triage | 1066 | 211 |
| mandatory-rereview-action-changed-from-02g | 74 | 33 |
| mandatory-rereview-excluded-from-02g | 2 | 0 |
| mandatory-rereview-former-pilot-03 | 123 | 32 |
| mandatory-rereview-former-pilot-26 | 60 | 60 |
| mandatory-rereview-second-pilot-30 | 60 | 0 |
| mandatory-rereview-second-pilot-47 | 60 | 0 |
| mandatory-rereview-second-pilot-65 | 60 | 0 |
| mechanical-target-failures | 19 | 10 |
| native-dynamic-patterns | 9 | 0 |
| overlay-precedence-controls | 197 | 0 |
| phase9-row-flip | 79 | 0 |
| pre-existing-broken-links | 163 | 1 |
| preserve-pending-behavioral-proof | 163 | 15 |
| preserve-pending-target | 454 | 294 |
| prior-anchor-check-failures | 21 | 0 |
| prior-target-failure-dispositions | 104 | 0 |
| seeded-semantic-edge-sample | 816 | 210 |
| semantic-roadmap | 2 | 2 |
| writers-and-writer-triage | 774 | 154 |

## Carried obligations and boundaries

All writer/check paths remain Step 5 behavioral work; destinations and checks move
in lockstep only after parity proof. Migration-state cells are whole-row flips.
Provenance, source locators, shipped templates, retired handoff checkpoints and
`docs/history` retain their preservation rules; Observe uses its exact `spec.md`.
**Phase 9's link check excludes verbatim carriage regions** (including the 21 already
broken links). Missing references from the committed input are pre-existing broken
links, not newly introduced cutover failures; the census pins those identities without
inventing a successor. Phase 9 must compare these baseline failures explicitly. The review-data lists all
163 missing literal link destinations (including carriage and external citations),
with consumer digests, spans, missing paths and individual Phase 9 dispositions;
this is also a mandatory deep-read set.

Class 4 is **NOT STARTED** in this packet; the author stops at the class-3 boundary.
Class-3 native/current-coordinate non-joins, dynamic/adoption traces, generator and IO
parity, exact-target semantic approval and installed-package reachability remain open.
All 104 prior target-failure dispositions, 21 earlier anchor failures and nine native
dynamic controls remain mandatory. No full-suite, manifest acceptance, authority flip,
cutover readiness or self-approval is claimed. MDView is unavailable in this tool
surface; no service is started. Use this request and its index directly from disk.
