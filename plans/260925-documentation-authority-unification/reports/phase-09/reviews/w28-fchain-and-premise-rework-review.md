Verdicts: 104 APPROVE / 2 REWORK

# W28 review: the F composition door and the premise shard rework

## Scope

This review covers rulings L13-21 and L13-24. The commits are:

- **Premise shard rework:** `1ff225412` (shard 1), `8cb66d85a` (shard 2), `8f68bcbdf` (shard 3) and `463077c3b` (unified chain basis).
- **Composition door:** `05b0022c7` (the fchain door) and `24600e44c` (the rebase).

I reviewed at HEAD `429b987e1`. HEAD moved to `b7ffa3be7` during the review. That move changed only `ledger/decisions/**` and `g0join/**`, so I reran the four proofs there. Per-item verdicts are in [w28-fchain-and-premise-rework-review.json](w28-fchain-and-premise-rework-review.json). It has 85 previously-REWORK rows, 6 commits and 15 checks.

## Results

- **All 85 REWORK rows from the w23 shard reviews are fixed as those reviews asked.** That is 34 rows in shard 1, 7 in shard 2 and 44 in shard 3.
  - Duplicates of the chain carry `alreadyComposed` and have no patch. f08634 and f08665 point at the rebased `recomposed-predecessor:` entries.
  - f00477 is a repoint that the chain already composes.
  - f03404 is regrouped as a live retained operand.
  - f06461 is preserved lineage with a code span.
  - f06790 and f06791 now make a coherent `docs/` tree.
  - f06920 and f06933 repoint only the right-hand advisory link.
  - f07667, f07886, f07889 and f08668 are preserved.
  - f07871 retargets the contracts directory.
  - I checked every row against the fully composed F state.
- **The rulings are applied:**
  - L13-21.2: 18 banners now cite `docs/platform/runner/decisions/h-36d872fbb0e5.md`.
  - L13-21.3: the 36 `docs/history` rows are keep-unchanged.
  - L13-21.4: the 36 lineage rows are code spans.
  - L13-21.5: the live pointers named in the ruling are patched, and the `packages/yaml-doc` exclusions carry reasons.
- **Previously approved rows are unchanged.** None of the 702 APPROVE rows changed disposition or group. That includes the 40-row random sample (seed 28).
- **The composition door holds.**
  - One engine: `check.py` uses `check_shard.replay_chain` and `compose.apply_diff`, and nothing else applies patches.
  - The manifest covers every phase-09 diff-bearing record.
  - Each w25 overlap now has a single owner. The G9 copies are tombstones with `composedBy`, and `/5` stays the owner for config/spec.md. When I replayed every dropped G9 diff, its change was present after F, apart from the lines that are deliberately preserved.
  - No G9 decision field changed. The carries changes are `composedBy` only.
- **The 24600e44c rebase changed no decisions.** It appended 6 specs and left the 137 historical specs untouched. The gap05 relocation change set is identical.
- **The negative controls really fail.** That holds for the shipped controls and for my own end-to-end probes on `compose()`: a restored unlinked duplicate, a removed link, a bogus target, a fake owner, absent evidence, and a manifest missing a reader.

## REWORK (Lead-owned; outside the Doer briefs)

1. **Dead platform links after F (medium).** The scan takes every `docs/platform/**` file, composed by F where F changes it and at HEAD otherwise. After the full chain, 160 clickable links in 40 of those files still point at paths in the phase-08 cutover move set:
   - 41 are in files F changes. Examples: `component-boundary.md:44-46,68` → `docs/architect/**`; `run-supervisor/spec.md:342,351,363` → `docs/specs/runner.md`; `work-state/README.md:32` → `docs/io-contract.md`.
   - 119 are in files F does not touch. For example, `host-invocation-routing/intent-preservation-ledger.md` has 50.

   L13-21.4 keeps guard 3 strict, but it covered only the 36 proof rows. Before F, the Lead needs to name an owner: either a link-retarget step at cutover, or more prepared patches.
2. **The gateway yaml x-specs list is half-repointed (medium).** In `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml`, lines 54-55 still list `docs/specs/work-state.md` and `docs/specs/runner.md` after F. The w23 shard-2 note on f06808 said F must cover them, and nothing does.

## Low notes

- The commit subjects of `8cb66d85a` and `8f68bcbdf` name the wrong shard ("first" and "second").
- The `reworkNotes` of f07871 and f07667 still describe the pre-`463077c3b` model ("row.patch is non-executable", "depends on stale chain entry").
- The 18 banner repoints cite the bare file. The chain's citations of the same decision add the `#0062-…` anchor.
- `identity/spec.md:117` still cites `docs/io-contract.md` in a code span after F. No row owns it.
- The controls could be stronger:
  - The "zero-fuzz conflict" control is actually rejected by the exactBase hash guard. The non-exact path is never exercised, though I confirmed that it rejects drift and accepts a pure offset.
  - Seven executed patches (shard-1 AGENTS.md/backlog.md, 4 carries, 1 census) run with neither pre- nor post-hash equal to their declared hashes. Only the hashes in the `check.json` trace bind them.
- `composedBy` is stored both in the record and in `manifest.resolutions`. The record silently wins on a mismatch; the two agree today.
- `rebased:w8:gap05:relocation` changes the `component-boundary.md` after-hash (`9b90e37c` → `6b457550`). The 134 conditional G0 approvals under L13-23.4 still hold, because the change set is identical. Record the new id and hash in the G0 F duties.
- The manifest does not name the phase-08 predecessors of step-07 as superseded inputs: `step-07-final-prepared-specs.json`, `step-05-*-cutover-specs.json` and `step-05-seam8-inherited-patches.json`.
- My independent census at the G9 pin finds 138 occurrences of the two moved root docs; the census records 136. The two misses are history-only `repo/docs/architecture-map.md` table cells in id-systems-audit.

## Commands

| Command | Exit |
|---|---|
| `python3 -B P/fchain/check.py --pin HEAD` (at 429b987e1 and b7ffa3be7) | 0, 0 |
| `python3 -B P/preserve-premise/park-judgments/check_shard.py --all` (both) | 0, 0 |
| `python3 -B P/g9/check_phase9_decisions.py` (both) | 0, 0 |
| `NODE_OPTIONS=--no-addons node P/carries/verify-carries.mjs` (both) | 0, 0 |
| `python3 -B P/fchain/controls.py` (13 controls) | 0 |
| `python3 -B P/preserve-premise/park-judgments/check_shard_controls.py` (82 controls) | 0 |
| Scratch probes (`compose()` states, negative mutations, field diffs, link scan, census), all `python3 -B` | 0 |

The reruns changed only the `sourceCommit` in `fchain/check.json` and `chain-contract-controls.json`; I restored both. I deleted the generated `chain-check-429b987e1.json` and `chain-check-b7ffa3be7.json`. Scratch work went under `/tmp/fgos-work/` and was deleted. I made no git writes, used no fgos CLI, ran no product tests, did not run `audit-report.py`, and loaded no addons.
