# Independent G0 content re-review: rebound bindings with changed content

Pin: `0763c2259ee3bf1801f4dc9621cbfa7955a156b6`. Per-row verdicts are in [w14-g0-content-rereview.json](w14-g0-content-rereview.json).

Scope:

- (a) All 124 claim ids in [rereview-claim-ids.json](../rebind/rereview-claim-ids.json). These come from rebind apply `8e7c6ee93`; details are in [rebindings.json](../rebind/rebindings.json) and [receipt.md](../rebind/receipt.md).
- (b) The 3 rows the Lead corrected in `6f5b9419d`. All three (`claim_26b3a49a…`, `claim_2e2bc926…`, `claim_5ba6768e…`) are among the 124, so the review has 124 distinct rows.

I did not sample.

## Verdict

**REWORK** overall: 121 APPROVE, 3 REWORK.

| Verdict | Rows |
|---|---:|
| APPROVE | 121 |
| REWORK | 3 (`claim_b5695d38…`, `claim_5ba6768e…`, `claim_2e2bc926…`) |

## Method

**Effective binding.** For each row I resolved the effective binding at HEAD with `ledgerfix/bindings.py`, read-only (`documents`, `supersessions`, `effective`).

- In all 124 rows, the direct row that `8e7c6ee93` edited is the effective row.
- 38 older overlays point at these rows (s14-resync-b, s15, s17, s12). Their `supersedesBinding` identity is the pre-rebind preimage, so none of them overrides the direct row any more.
- 35 of those overlays bind the same target as the direct row. Three bind a different digest: s12 `/unitCarries/364`, and s14 `/bindingRefresh/574` and `/577`. A reader that joins by pointer alone would pick up these stale bindings.

**Mechanical checks, all 124 rows pass:**

- `bindingSha256` equals sha256 of compact sorted-key JSON + LF over `{targetOwner, targetAnchor, targetUnitDigest, targetAncestry}`.
- The anchor resolves uniquely at HEAD.
- `targetUnitDigest` equals the unit's `textDigest` at HEAD.
- `targetAncestry` matches HEAD, including the heading itself for heading units.

I extracted units with `scripts/generate-doc-inventory.mjs` `extractMarkdownConservationUnits`, using the same `unitsOf` wrapper as the embedded step10 libs. `process.dlopen` was blocked, so no addon loaded.

**Source text.** For each row, the identity registry gives the source path and anchor. I found the unit whose digest equals the row's `sourceUnitDigest`: at HEAD, else at the registry commit, else in that file's git history. All 124 were found. I also compared each target with the whole legacy file at HEAD.

**Content.** Rows fall into these groups:

- **59 verbatim:** the target digest equals the source digest. All are heading rows (58 promote, 1 move), and the whole composite unit (title plus section) is carried.
- **21 resynced:** the target equals the current legacy unit byte for byte. These are 19 `confinement-authority.md` rows and 2 `work-state.md` rows. The legacy source was resynced, so nothing in the source to be retired is lost.
- **10 same-path:** source and target are the same live file (`architecture-manifest.json`, `component-boundary.md`, `docs/specs/distribution.md`, `docs/specs/runner.md`, and packaging spec block-85 to block-90). I checked table-row and rule-id coverage: no row or rule id was dropped.
- **34 other changed rows:** I read every one with a word-level diff of the full source unit against the full target unit.

For headings, the payload is the section text, because the heading digest is composite.

**How heading rows are judged.** A heading row is judged on its title and section scope. A changed clause in the payload is judged on the claim of the block it belongs to.

**Ownership.** Among the effective rows, the only target with two owner-type dispositions is `agent-confinement/spec.md#unheaded-block-45`: `claim_d572bb9d…` (move) and `claim_26b3a49a…` (merge). That pair is the intended result of `6f5b9419d`.

## REWORK rows

1. **`claim_b5695d38282e111f8ed06656b2efa433`**
   - Row: `s4-packaging-distribution-distribution.json /claims/27`, move, target `packaging-distribution/spec.md#unheaded-block-109`.
   - Problem: the target replaced a substantive clause. The legacy line `docs/specs/distribution.md:439`, unchanged at HEAD, says the checkout root resolves "via `git rev-parse --path-format=absolute --git-common-dir` (never `--show-toplevel`…)". The target says it reads the `.git`/gitdir/commondir layout on disk without a Git child.
   - That is not a minimal structural rewrite, so the disposition `move` is wrong. The rationale also still says "complete unit digest equal", which is false.
   - Fix: re-decide as `supersede` with the corrected clause named, or resync the legacy line first.
2. **`claim_5ba6768e5c4f7d93e77ccceda19d0103`** (Lead-corrected)
   - Row: `pilot/b-data-dictionary.json`, promote, target `work-state/spec.md#unheaded-block-4`.
   - Problem: `6f5b9419d` withdrew the false "digests equal" statement but did not make a decision. Two clauses are still replaced without a label, and the legacy still holds both old versions:
     - Id: "fixed `tsk-` prefix + short suffix" became "`tsk-<10 base32>` from the Identity mint door".
     - Rigor: "leads to model via `runner.rigorToTier`" became "decides checker count and seat independence, not tier".
   - Fix: re-decide as `supersede` or as a labelled correction naming both clauses, or resync the legacy first.
3. **`claim_2e2bc9264b289319dfae5c6487978f99`** (Lead-corrected)
   - Row: `pilot/b-entry-actors-rules-pointers.json`, promote, target `implementation-pointers.md#unheaded-block-3`.
   - Problem: the same situation, still undecided.
     - Removed or replaced: `withEventsLock`/`appendEventLocked`, `.fgos/events.lock`, the `acquireSessionsLock` mirror, 2s/10ms, `EventLogError('lock-timeout')`, and hash-suffix `generateId`.
     - Replacements: `withStateTx`/`tx.append`, a 5s hot-lock wait, `hot-lock-timeout`, and the mint-door id.
     - The legacy unit still holds the old clauses.
   - Fix: as for row 2.

## Lead-corrected rows (`6f5b9419d`)

- **`claim_26b3a49a…` (now merge): APPROVE.** The old reaper/herdr-session paragraph and the 2026-10-15 binding paragraph collapsed into one legacy paragraph, `confinement-authority.md#unheaded-block-112`. That paragraph equals the target block-45. The target retires both: no `herdrSession` field, no herdr-launch-command file. `merge` fits, with `claim_d572bb9d…` as the move owner.
- **`claim_2e2bc926…` and `claim_5ba6768e…`: REWORK**, as above. The correction made the rationale honest but left the disposition decision open.

## Notes (non-blocking)

- **Stale rationales.** Every content row keeps rationale prose written for an older target. Only the last `L12-137` line, and `L13-9` where present, is current. Examples:
  - `claim_d572bb9d…`: "byte for byte, limitations retained".
  - `claim_4d5b7f73…`: "All 26 historical lines remain in order". In fact 5 of the 26 lines were reworded in place; supersede still holds.
  - `claim_aa28053a`/`b5695d38`: "complete unit digest equal".
- **Old source digests on resynced rows.** On the 21 resynced rows, `sourceUnitDigest` still names the historical text. `source-parity.json` has no entry for any of them, so freshness is not recorded anywhere machine-readable.
- **Stale digest in a remainder.** `claim_d5ba1eda…` (partial-carry): its remainder cites primary-target digest `fb0b0100`, but the current digest is `797c7185`. The residual (`partial-carry-residuals.json#/rows/11`) still covers all 5 source lines that are missing at HEAD.

## Proof boundary

Read-only. Scratch was `/tmp/fgos-work/w14-g0-review/` and has been removed. I used `python3 -B` and node only for the unit extractor, with dlopen blocked.

I ran no Git write, no fgOS CLI, no suites and no cargo, and did not touch the `forgentX-p9-w1-d4` worktree. A/B and audit-ownership were not run.
