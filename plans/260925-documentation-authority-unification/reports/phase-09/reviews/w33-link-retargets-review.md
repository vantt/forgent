# W33 review: L13-26 link retargets (a319902ab)

Pin: `1513cf049`. The checks ran at `a91edadbe`; HEAD then advanced, but only by
the files `reviews/w33-ownership-audit-review.*`. Machine record:
[w33-link-retargets-review.json](w33-link-retargets-review.json). Authority:
L13-26 in [owner-answers.md](../owner-answers.md). Brief:
[w30-fchain-link-retargets-brief.md](../w30-fchain-link-retargets-brief.md).

## Verdicts

| Item | Verdict | Severity |
| --- | --- | --- |
| 1. `fchain/link-retargets.json` (162 rows, 41 patches) | **REWORK** (row 125 only) | medium |
| 2. `linkIntoMoveSet` and its negative control | APPROVE | low |
| 3. Work-state rebase | APPROVE | none |
| 4. w28 low notes | APPROVE | low |
| 5. Gateway `x-specs` repoint | APPROVE | low |
| Related-header paths into the move set | NOTE (Lead ruling) | high |
| Self-links and stale link labels | NOTE | low |
| Other unresolved links after F | NOTE | medium |

Counts: 4 APPROVE, 1 REWORK, 3 NOTE.

## 1. Link retarget record

I verified this independently with scratch scripts under `/tmp/fgos-work`, deleted afterwards. The scripts did four things:

- built the final states with `compose()`, then built them again with the record emptied to get the pre-retarget states;
- scanned the links with a separate scanner;
- joined each row to its alias;
- round-tripped each patch through `apply_diff`.

Results:

- The population matches exactly: 160 links in 40 files, plus 2 `x-specs` entries.
- Every `oldTarget` resolves to its `oldPath`, and that path is in the move set at `moveSetPointer`.
- Every `newPath` is one of that path's move-set destinations. All 159 retargets join to their alias: `fromPath` = `oldPath[#fragment]`, `toOwner` = `newPath`, and each alias is unique.
- Fragments are kept. All 49 destinations exist after F, and none of them moves.
- Code spans, backtick and tilde fences, and comments stay literal.
- All 41 forward and rollback diffs replay byte-exact against both the composed preimage and the final bytes.

**Row `L13-26:link:125`: REWORK.** The move set records `docs/specs/reading-map.md` as `to: null`. However, the phase-09 plan requires `docs/specs/reading-map.md` to be merged into the retained `docs/reading-map.md`. G5 (`g5/check-b57e79625.json`) also records `docs/reading-map.md` as the surviving file, with its spans restated. Every other `docs/platform` reader already links `../reading-map.md`. The line "Read Reading Map … first" is a live instruction, so it should remain a link.

Exact fix:

- Row: `action: "retarget"`, `start: 2184`, `end: 2210`, `before: "../../specs/reading-map.md"`, `after`/`newTarget: "../../reading-map.md"`, `newPath: "docs/reading-map.md"`, `aliasId: null`. Add a selector that names the plan's reading-map merge obligation and the G5 surviving-file record.
- Record header: update `selectionRule`, and set `counts.codeSpans` to 0.
- Patch `/patches/24` (`docs/platform/proposals/coordination-capability-envelope.md`): `beforeSha256` stays the same. The second hunk's `+` line becomes
  `Read [Reading Map](../../reading-map.md), [Runner spec](../runner/spec.md),`
  and `expectedAfterSha256` becomes
  `8ce81ee7f54c1f655e6e814b6f76e8448bb29efff04c83b64de3d75427c9b884`. Regenerate `rollbackDiff`.
- Refresh `fchain/check.json`, `link-validation.json` and the receipt counts. The keys in `manifest.resolutions` (`/patches/0`, `/38`, `/39`) do not change.

## 2. `linkIntoMoveSet`

The check reuses the `compose()` states, the pin bytes and the existing move-set file. With the record emptied, it reports exactly 160 findings. The injected-link control fails with exit 1.

My mutation probes on the final states give these counts:

| Probe | Findings |
| --- | --- |
| Inline link | 1 |
| Used reference definition | 1 |
| HTML `href` | 1 |
| Repo-absolute path | 1 |
| Link in a composed file | 1 |
| Link in a code span | 0 |
| Link in a fence | 0 |

Low notes:

- `[x](<…>)` is counted twice; there is no real occurrence today.
- YAML files are not scanned.
- Related values inside the `txt` header fence are not scanned.

## 3. Work-state rebase

A recursive field diff across `a319902ab^..a319902ab` shows:

- **Shard 3:** only the patch hashes, `chainEntryIds` and the two notes changed. Patch text and dispositions are unchanged.
- **`recomposed.json`:** only hashes and ids changed, plus one appended `rebaseHistory` entry.
- **`patch-specs.json`:** one spec was appended and one effective id swapped. Historical specs are unchanged.

The new spec's `diff` and `rollbackDiff` are byte-identical to its predecessor's. `rebased-patches.json` is untouched. No decision changed.

## 4. w28 low notes

1. **f07871 / f07667 notes:** fixed. Residual: f07667 still has `staleChainDependencies`, which contradicts its new note. No code reads that field.
2. **Zero-fuzz control:** it now goes through the real `patch --fuzz=0` path, which exits nonzero. Separately, a pure line offset is proven to apply.
3. **`composedBy` mismatch:** when the record and the manifest disagree, the entry now fails with a conflict. A real `compose()` control asserts it.
4. **gap05:** `g0rework/final-pin-duties.json` names `rebased:w8:gap05:relocation` at `/patches/138`, with before `53d407ed…` and after `6b457550…`. Its final-file hash `61cd146d…` matches `check.json`.

## 5. Gateway `x-specs`

`docs/specs/work-state.md` now points to `docs/platform/work-state/README.md`, and `docs/specs/runner.md` to `docs/platform/runner/README.md`. Both are the whole-file aliases, and the patch replays exactly.

Low notes, outside L13-26.3:

- The descriptions at lines 456, 607, 710 and 739 still name the retired paths.
- `x-docs` lists `docs/decisions/0011-*` and `0014-*`, which are already absent at pin.
- `work-state/spec.md` may be a better `x-specs` entry than the README.

## Notes for the Lead

- **Related headers (high).** After F, 67 Related-header entries in 59 `docs/platform` files still name move-set sources. The product checker reports these as `unresolved-related`, and L13-21.4 treated such entries as link rows, but L13-26 covers only clickable links. Decide one of two things: extend L13-26 and `linkIntoMoveSet` to header Related values, or rule that cutover guard 3 does not read Related values in history wrappers.
- **Self-links and labels (low).**
  - 24 rows now link a file to itself, for example "Source relationship: [original source](self)".
  - 11 link labels still show the old path, for example `[../platform-foundations.md](platform-foundations.md)`.
  - Under the L13-21.4 lineage rule these could become code spans instead.
- **Other unresolved links (medium).** Under the product checker's semantics, 435 relative links in 45 `docs/platform` files still fail after F:
  - 411 are already broken at pin, mostly `retired-engine` snapshots.
  - 24 are in files F creates.

  They do not point into the move set, so `linkIntoMoveSet` rightly ignores them. Guard 3 will still fail unless it or the snapshots handle them.

## Checks run

| Command | Result |
| --- | --- |
| `python3 -B P/fchain/check.py --pin HEAD` | 0. 572 files, 182 executed, 20 links, zero findings. `check.json` restored; only `sourceCommit` had changed. |
| `python3 -B P/fchain/controls.py` | 0. 19 controls; `controls.json` unchanged. |
| `python3 -B P/preserve-premise/park-judgments/check_shard.py --all` | 0. Unresolved 0. The transient `chain-check-a91edadbe.json` was deleted. |
| `python3 -B P/g9/check_phase9_decisions.py` | 0. 158 entries. |
