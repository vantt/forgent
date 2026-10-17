# A38 review request: Step 1 rework and Step 2 semantic records

- Author: `codex-session:fgos-run_unit-run-179220cd962900@2026-10-17`
- Reviewer: a distinct A38-eligible session that authored none of these rows
- Mode: ordinary independent review
- Output (unique):
  `plans/260925-documentation-authority-unification/reports/phase-07/review-a38-step-01-rework-and-step-02-01.md`
- Input base: `135230fb3cffe7dd0d8b55d14610761b459c8848`
- Request size: one part, 39 verdict entries, about 31 KB of Step 2/check payload;
  below 60 entries and 400 KB.

Do not run a full inventory, native synchronization, global D/E, comparator or test
suite. This review needs only the named files, small JSON queries, file hashing and a
full read of the three X-SEM-13 members. Do not edit producer artifacts.

## Pinned inputs

| Path | SHA-256 |
|---|---|
| `phase-07-cross-area-integrity-and-fresh-reader-review.md` | `fc25da5a326793d5c2db096a8fb8713dfd49034c186ecc7d42c0d061cbaba387` |
| `reports/phase-07/owner-answers.md` | `be77561051c2e567d0f7cb74924c2e9aea96a6594e9abc1b5c19abebd843c676` |
| `reports/phase-07/cross-area-inventory.json` | `660568882f8903157556b85ac90f48f0e1c1c3880aae6f07a73bb2200056e2fe` |
| `reports/phase-07/cross-area-inventory.md` | `a2600f2cfb28c4c4daf4921145cfc1ff42732ff3a8f59817e688adf26fdce0a5` |
| `reports/phase-07/step-02-semantic-group-resolutions.json` | `7affde35c419d4df39a46f28f89b69324c6701aa0f4d649a256f25f9fa478b14` |
| `reports/phase-07/step-02-semantic-group-resolutions.md` | `ab666c741f13e548579f52a3bace801f3d58cebec312790e09cbb13ac85dcd74` |
| `reports/phase-07/step-02-checks.json` | `36cb3baccd03d02238657b72f7d9b0ff0d709863f4837a14d5b5e5623fb10b50` |

All paths are relative to
`plans/260925-documentation-authority-unification/` except the three historical
members and decision evidence explicitly named by the group records.

Portable digest check from the repository root:

```sh
node -e 'const fs=require("node:fs"),c=require("node:crypto"); for(const p of process.argv.slice(1)){console.log(c.createHash("sha256").update(fs.readFileSync(p)).digest("hex"),p)}' \
  plans/260925-documentation-authority-unification/phase-07-cross-area-integrity-and-fresh-reader-review.md \
  plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md \
  plans/260925-documentation-authority-unification/reports/phase-07/cross-area-inventory.json \
  plans/260925-documentation-authority-unification/reports/phase-07/cross-area-inventory.md \
  plans/260925-documentation-authority-unification/reports/phase-07/step-02-semantic-group-resolutions.json \
  plans/260925-documentation-authority-unification/reports/phase-07/step-02-semantic-group-resolutions.md \
  plans/260925-documentation-authority-unification/reports/phase-07/step-02-checks.json
```

## Part A — 11 entries

Give one `ok | rework` verdict for each entry:

1. X-DUP-01 uses the same CTR010 park marker as X-CTR010-01.
2. X-DUP-03 is keyed by the two manifest paths, records current blob `2ff043edb`,
   and never uses stale queue blob `e6d9582dd` as current identity.
3. X-SEM-29 routes only to Step 6 and cross-references X-DUP-04.
4. X-SEM-31 routes only to Step 6 and cross-references X-DUP-02.
5. L11-8 records the path-key/current-blob decision without editing the Phase 6 queue.
6. L11-9 applies the settled-target reading to already-promoted X-SEM-12.
7. L11-10 names `docs/platform/README.md` as the Step 7 host for all four links,
   without performing that future edit now.
8. L11-11 requires real unit digests for all 31 DEFECT/NAV/QF rows in Step 9.
9. The Step 9 proof list contains that same 31-row real-binding obligation.
10. QF route notation distinguishes `Step 9` from `Phase 8/9`; no ambiguous bare
    `8` or `9` remains in QF dispositions/targetStep fields.
11. QF-01 carries the Phase 9 re-home obligation for X-A34-01 and X-A34-17..28.

Useful bounded queries:

```sh
jq '.rows[] | select(.rowId=="X-DUP-01" or .rowId=="X-DUP-03" or .rowId=="X-SEM-29" or .rowId=="X-SEM-31" or (.rowId|startswith("QF-")))' \
  plans/260925-documentation-authority-unification/reports/phase-07/cross-area-inventory.json
rg -n 'L11-(8|9|10|11)|Inventory digest bindings' \
  plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md \
  plans/260925-documentation-authority-unification/phase-07-cross-area-integrity-and-fresh-reader-review.md
```

## Part B — 28 entries

Give one `ok | rework` verdict for every X-SEM-05..32 record in
`step-02-semantic-group-resolutions.json`.

For each of the 27 pair records independently check:

- source and target file SHA-256 equal the recorded digests;
- the named decision file maps the source file to the target owner and contains the
  stated number of reviewed target-owner claims;
- present authority, exact divergence, settled meaning and existing disposition fields
  agree with that evidence;
- the report-level reading does not imply early promotion or retirement;
- X-SEM-29/31 are Step 6 routes, while all other pairs have exactly one settled target.

For X-SEM-13, read all three members in full. Confirm the common heading is only the
historical-relocation wrapper, the literal snapshots/provenance have three different
meanings, every member is non-authority history, and `docs/specs/runner.md` is the
single current target owner for execution meaning.

Small structural checks:

```sh
jq '{counts, rows:(.groups|length), unique:([.groups[].rowId]|unique|length), stops:.stopConditions}' \
  plans/260925-documentation-authority-unification/reports/phase-07/step-02-semantic-group-resolutions.json
git diff --name-only 135230fb3cffe7dd0d8b55d14610761b459c8848..HEAD -- docs/platform
```

The second command must be empty: the producer reports zero local candidate edits.

## Output contract

Write the unique output path above with:

- reviewer id, author id and reviewed commit;
- a 39-row table (`Entry | Verdict | Note`), preserving Part A/Part B separation;
- counts for `ok` and `rework` per part;
- explicit confirmation that all three X-SEM-13 files were fully read;
- `Status: DONE` only if all 39 entries are `ok`; otherwise
  `Status: DONE_WITH_CONCERNS` and list exact rework rows;
- any concern that is outside these 39 entries as non-blocking, without widening the
  request or running a heavy job.
