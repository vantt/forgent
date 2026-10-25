# G0 content rework receipt

## Current missing-edge accounting — blocked on committed-record replay

Input HEAD: `dfef557a8dfd0d4654cf8c9583e4915ac9175753`. **Records complete; required proof set is not green.** `verify.py` exits **1** because its nested misc verifier requires the edited rebind record to have been committed. This assignment forbids all Git writes; the runner owns that commit. No assertion, script, ledger or candidate document was changed, and no committed-record check was bypassed.

### Edges and reused witnesses

`rebind/g0-rework-rebindings.json#/records/149`–`152` account for every changed unit in docs commit `e88d4e283c8161f9bf649447e8f9c5876931107b`. Comparing both dual-extractor catalogs across the immediate parent and commit yields **151 units, four changed digests, no anchor changes**. That commit edits only `docs/platform/work-state/spec.md` under `docs/`:

| Unit | Old digest prefix → new digest prefix | Cause |
| --- | --- | --- |
| `3-work-item-data-dictionary` | `c55decfd` → `38928382` | Heading payload includes the table edits at lines 74 and 83 |
| `unheaded-block-4` | `fa35b5b9` → `697a5d20` | Data Dictionary links retarget to `#add-verb` and `#submit-verb` |
| `6-domain-model` | `4b12f710` → `6409f862` | Heading payload includes the paragraph edit at line 516 |
| `unheaded-block-54` | `fcc3b5bc` → `c7cd4adc` | Domain Model links retarget to `#add-verb`/`#submit-verb` |

Each record contains both complete SHA-256 digests, commit, reason, compact unit witnesses and all affected ledger/pilot binding pointers. Full text witnesses are reused by explicit `witnessSource` references to the existing `last-rows-rebindings.json` entries 0, 1, 11 and 12; all referenced selected units were checked against the immutable commit bytes and current targets. No additional unit changed in that docs commit.

The first required replay then exposed **two earlier missing edges** in `docs/platform/component-boundary.md`, from `5a849befcbdb74ec974546af42b925cab614e841`: `9-hexagonal-architecture-view` (`c1190693` → `19a6fe08`) and `unheaded-block-70` (`913b0ef1` → `5700ffb4`). The edit retargets the Component Authority Boundary Map link from `../architect/proposals/` to `../proposals/`. Records 153–154 reuse `followup-rebindings.json` entries 0–1 so the required verifier can account for these existing transitions too. Comparing the immediate-parent/commit catalogs confirms exactly those two changed units. No new judgment or pair accounting was introduced.

All **149 original records** and all other existing top-level record fields remain unchanged. `sourceHead` remains the historical authoring pin, not a new approval. The shared `bindings.rows` traversal owns the affected-binding census, excluding historical snapshots.

### Commands and actual exits

Run from the repository root with `NODE_OPTIONS=--no-addons`; `R=plans/260925-documentation-authority-unification/reports/phase-09`. Every Python invocation uses `python3 -B`.

| Command | Exit / qualification |
| --- | --- |
| `python3 -B "$R/g0rework/verify.py"` | **1**; all six added edges accepted, 127 authoring/live target assertions pass; 12 of 13 nested commands exit 0. The sole failure is the nested misc verifier's committed-record guard. |
| `python3 -B "$R/g0rework/refresh-carries.py" --check` | **0**; deterministic output comparison passes, 346 parity rows and 91 live heading rows |
| `python3 -B "$R/rebind/rebind.py" --check` | **0**; unresolved drift 0, seven authenticated superseded origins |
| `git diff --check` | **0** |

Exact blocker: `misc-fix/rebind.py:147` asserts that the entire current `g0-rework-rebindings.json` equals its last committed version before accepting its pre-existing full-row misc transitions. Appending valid edges necessarily changes that file. **Runner action: commit the scoped records through the authorized runner, then rerun all three required commands.** No passing post-commit result is claimed. The final verifier output remains `recordProofsPassed: false`, `status: failed`, `ok: false`; native-dependent full-audit recipes remain not run.

Evidence: [rebind-edge-final-proof.json](rebind-edge-final-proof.json) records both commit/unit censuses, all six full-digest transitions and affected bindings, command exits, all nested command exits/errors, assertions, and all six accepted edge references. [rebind-edge-proof.json](rebind-edge-proof.json) preserves the earlier replay that stopped at the previously unaccounted Component Boundary heading. Two read-only diagnostic harness attempts also failed before any repository output: one omitted an imported frozen recipe library; another incorrectly included historical snapshots in the binding census. The completed census uses the existing owning traversal, without changing any production assertion.

Safety: **5,818 protected tracked files** were fingerprinted before/after the final replay, including all three touched-area scripts; their bytes stayed unchanged. Scratch snapshots are `[]` before and after, and disposable `tempfile` directories were removed. No Git write, fgOS CLI, lifecycle verb, native addon load, product/full-suite test, forbidden audit driver, pair accounting, review approval or authority promotion ran. `impact-analysis: degraded` (no MCP capability; fgOS CLI prohibited); this is record data only, with no symbol edits. Markdown preview was not started because the task forbids extra state/service writes.

## Previous verifier accounting and heading deduplication (historical)

Input HEAD: `39528fa211f9a7e558b1e95467eeae1f66b68a3d`. **All four required scoped proofs exit 0; the full audit remains partial, `ok: false`.** Evidence: [accounting-proof.json](accounting-proof.json).

### Changes and reused proof owners

- `verify.py` replays the existing frozen ownership recipes and the original 127-row authoring assertions at `5a3f7580a012da011fc09ce88cff89bbea2b9008`, the commit that wrote `receipt.json`. Updating this script or this Markdown receipt does not move that pin. Immutable inputs use the existing misc-fix `source` / `preimages` helpers and a scratch-only Node read adapter; no checkout or historical file is rewritten.
- Live checking remains separate: the shared `rebind/rebind.py --check` runs unchanged, and all 127 overlay targets still verify their live binding hashes, pending review status, source identity, complete target digests and ancestry. A drifted target is accepted only by an exact recorded old/new path, anchor and full-digest transition from `g0-direct-rebindings.json` or the full witnesses in `g0-rework-rebindings.json`. Rationale-only records cannot waive drift. The original legacy rewrite conservation still checks live legacy bytes.
- Each frozen live ownership census emits 17 raw diagnostics. Sixteen are identical-unit groups already authenticated by the existing `rebind.matches` group contract, not actual drift. The remaining target is `docs/platform/work-state/spec.md#11-business-rules`: `6780225c…` → `0c7dbff4…`, recorded at `g0-direct-rebindings.json#/rebindings/13`. The same edge accounts for overlay `/bindingRefresh/117`. Raw diagnostics and exact rebind provenance remain in verifier output; none is silently discarded.
- `refresh-carries.py` deduplicates resolved heading targets by `(path, anchor)`, preserving the first occurrence and order. It refuses conflicting duplicate payloads. Row 55 now emits one live Release Tree Canonicalization target; its complete historical two-target row stays in `accounting.previousParityRow`. No generated carries data was hand-edited or regenerated onto disk.
- `test-accounting.py` owns the new acceptance predicate's proof. It exercises both real record formats and rejects missing records, wrong old/new paths, anchors or digests, truncated digests, and an unrecorded new live digest. The verifier runs these controls through the same production predicate, not a second implementation.

Prior art: `a8ea05c50` introduced the unqualified live `targetDigestDrift == []` assertion; `5a3f7580a` introduced live heading refresh and exposed the duplicate after both historical locators resolved to one target. `594fe4194` intentionally restored three candidate docs and recorded their rebinds; it did not authorize rewriting historical proof inputs. This change reuses those records, the shared matcher/dual extractors and frozen recipes; the missing pieces were pin separation, exact live transition accounting and stable post-resolution deduplication.

### Required commands and exits

Run from the repository root with `NODE_OPTIONS=--no-addons`; `R=plans/260925-documentation-authority-unification/reports/phase-09`. Every Python command uses `python3 -B`. The verifier also installs a throwing `process.dlopen` guard for its command tree.

| Command | Exit / result |
| --- | --- |
| `python3 -B "$R/g0rework/verify.py"` | **0**; `recordProofsPassed: true`, `status: partial`, `ok: false`, `fullAuditPassed: false`; 127 authoring and 127 live targets/ancestries verified |
| `python3 -B "$R/g0rework/refresh-carries.py" --check` | **0**; all four generated outputs byte-identical to committed files; 346 parity rows, 91 heading rows |
| `node "$R/carries/verify-carries.mjs"` | **0**; 346 current rows, 91 live headings, 321 live section blocks, 1,208 current bindings; existing two final-pin patch duties remain disclosed |
| `python3 -B "$R/rebind/rebind.py" --check` | **0**; unresolved drift 0, one authenticated superseded origin |
| `python3 -B "$R/g0rework/test-accounting.py"` | **0**, also nested in verifier; both record formats accepted, ten negative controls correctly refused |
| `git diff --check` | **0** |

All 13 nested verifier commands exit 0. Both native-dependent `checks.mjs` recipes remain **not run**, so no full-audit success is claimed. No extra pair accounting, authority promotion, content approval, final-pin acceptance, fgOS CLI, Git write, forbidden audit driver or product/full-suite test ran. The previous receipts below remain historical, not new claims.

Safety: 4,753 tracked protected inputs under `docs/`, the plan ledger, carries, rebind and misc-fix were fingerprinted before/after and stayed unchanged. Scratch was confined to exit-cleaned `tempfile` directories under `/tmp/fgos-work/`; snapshots were `[]` before and after. Only this `g0rework/**` slice changed. `impact-analysis: degraded` (no MCP tool available; fgOS CLI forbidden). Markdown preview was not started because this scoped records task forbids extra state/service writes.

Diagnostics, not final proofs: before edits, both requested checks exited 1 at the reported drift/heading assertions. During implementation, verifier attempts exited 1 on an overbroad extraction of an archived non-direct target, a scratch output-directory/library mismatch, and a local name shadowing the pinned source helper; these plumbing errors were corrected before the final four-command replay. An initial diagnostic harness also exited 1 because `/tmp/fgos-work` did not yet exist; it created no temporary directory.

## Previous live-parity rework (historical)

**Previous live-parity rework: scoped proofs pass; verification remains partial only for the two native-dependent `checks.mjs` recipes. No full-audit or cutover acceptance.**

## Live heading, section-block and pointer-patch parity

Input HEAD: `93dfed0ae`. The original witness-pin checks at `f534aeaea` are unchanged. The permanent carries checker now additionally reads the working tree for the complete heading census, ordered direct-section membership, full source-block parity coverage and unapplied pointer-patch preimage drift.

| Count | Before | After |
| --- | ---: | ---: |
| Source parity rows | 345 | 346 |
| Existing source parity rows retained byte-for-byte | 345 | 345 |
| Heading census rows (none dropped) | 91 | 91 |
| Stale source-heading digests | 4 | 0 |
| Stale direct-block membership lists | 5 | 0 |
| Stale target-heading locators/digests | 8 | 0 |
| Current direct section blocks without parity rows | 1 of 321 | 0 of 321 |
| Unapplied pointer patches / live drift | 24 / 2 | 24 / 2 |
| Explicitly listed final-pin patch duties | 0 | 2 |
| Current ledger successor assertions | 1,208 | 1,208 |

The four source digest repairs are `distribution.md#data-dictionary`, `#setup`, `#business-rules` and `#lịch-sử-quyết-định`. The terminal paragraph insertion also moves four later sections' block ordinals; the history section's membership grows by one. Live target checking exposes eight target-heading refreshes (one duplicate heading ordinal disappeared). These overlap: **12 heading rows changed**, each retaining its complete old row in `accounting.previousParityRow`, its old anchor/digest and authoring pin; all remain pending. The other 79 heading rows are unchanged.

The sole appended source parity row is `docs/specs/distribution.md#unheaded-block-17`, “Terminal setup loses a row and a fix” (`45ccc798`), conserved exactly at `docs/platform/packaging-distribution/spec.md#unheaded-block-98`. Its addition commit is recorded, not invented as a rewrite claim. The original 345 rows and original 21 rewrite proofs remain intact. `refresh-carries.py --check` deterministically regenerates both current parity files through the existing dual extractors. No ledger, source document or patch packet changed.

### Explicit final-pin duties

Machine-readable owner: [`../carries/final-pin-duties.json`](../carries/final-pin-duties.json). The checker emits every drifted unapplied patch with both hashes and its duty, then fails if any drift lacks a listed duty. A duty neither rebases nor applies a patch.

| Path | Reason (literal) |
| --- | --- |
| `bin/fgos.mjs` | main changed after authoring; recompose at the final main import |
| `docs/backlog.md` | main changed after authoring; recompose at the final main import |

### Commands and outcomes

All commands run from the repo root; `R=plans/260925-documentation-authority-unification/reports/phase-09`. Every Node process inherits `NODE_OPTIONS=--no-addons`; the existing verifier and negative probes additionally install throwing `process.dlopen` guards. Python always uses `python3 -B`.

| Command | Exit / qualification |
| --- | --- |
| `node "$R/carries/verify-carries.mjs"` | 0; historical witnesses plus 346 current rows, 91 live headings, 321 live section blocks; two disclosed drift paths |
| `python3 -B "$R/g0rework/verify.py"` | 0; `status: partial`, `ok: false`, `fullAuditPassed: false`; only both `checks.mjs` recipes not run |
| `python3 -B "$R/rebind/rebind.py" --check` | 0; drift 0 |
| `python3 -B "$R/g9/sweep.py" --check --pin HEAD` | 0; 574 records, 546 bodies, no judgment, chain, drift or body-replay errors |
| `python3 -B "$R/misc-fix/verify.py"` via output-only wrapper | 0; unchanged owning assertions; only `checks.json` sink redirected to disposable scratch because its directory is not writable; original file hash unchanged |
| `python3 -B "$R/g0rework/refresh-carries.py" --check` | 0; exact deterministic replay, including historical ledger output unchanged |
| `python3 -B "$R/g0rework/test-live-parity.py"` | 0; five real-checker falsification probes each correctly exit 1 |
| `git diff --check` | 0 |

The five probes cover stale live source headings, an uncovered section block, a newly added heading outside the census, a third unlisted patch drift (all three drift paths must be emitted), and known drift with the duty list removed. They overlay only reads through a disposable preload; no checkout bytes or historical Git witnesses are altered.

Earlier proof/authoring attempts in this turn: the newly live carries checker first exited **1** on the stale ReleaseManifest target heading (expected red); after regeneration it exited **0**. The scoped `refresh-carries.py` author wrapper first exited **1** because its write guard initially omitted permitted tempfile scratch; it wrote no repository output. After admitting disposable scratch, it exited **0**, writing only the two changed carries JSON files; identical ledger output was not rewritten. These are setup/diagnostic attempts, not hidden passing proofs.

Evidence: [`live-parity-proof.json`](live-parity-proof.json) records every final proof command/argv/exit, complete nested verifier commands, negative probe exits, output hashes, both live drift hashes and before/after scratch snapshots (`[]` / `[]`). The misc report retains its original bytes; no restoration or out-of-scope write was needed. Scratch was confined to exit-cleaned `tempfile` directories; nothing new remains under `/tmp/fgos-work`. No fgOS CLI, Git write, native addon load, forbidden audit driver, full suite, pair accounting or preview service ran. `impact-analysis: degraded` under the no-CLI/no-MCP boundary. No component-boundary change. No review approval, authority promotion or final-main-import acceptance is claimed; the historical cache exception below is neither erased nor adjudicated.

## Previous source-parity rework (historical)

At `9c8d2ce063813bcf9df2d5cbe552da2655da17bc`:

- All 345 parity rows are retained. The 21 added rows and 14 older distribution rows now expose current source anchors/digests; original identities stay in accounting/history. RUL107/RUL108 are a complete checked split; registry, shell-helper and pipeline wording differences have exact reversible diffs, not false equality.
- Full checker replay additionally exposed 62 target-only ordinal repairs and 25 stale candidate-only bindings. Complete preimages are retained in `carries/current-binding-refresh.json`; the 25 current bindings use the existing `supersedesBinding` door in `ledger/decisions/carries-current-rebindings.json`. No IDs minted, docs changed, or review approval inherited.
- Original placement, heading-census and unapplied-patch witnesses replay at their authoring commit `f534aeaea`; 1,208 current ledger successor assertions run separately. This does not certify final-pin coverage or patch recomposition.
- The 127 original re-decision bindings remain pending and unchanged. `claim_5ba6768e` now has clause-specific sources; `claim_320ba622` also names the `(9 file)` → `trong nhiều file (ví dụ …)` correction.
- The parity base is exactly `receipt.json.sourceHead` (`568a11f21`), not HEAD or the last parity-writing commit. Unchanged prefix rows compare exactly; refreshed rows retain exact pinned preimages and are also regenerated byte-for-byte by `refresh-carries.py --check`.
- Rebind and import3 use disposable tempfile workspaces. `/tmp/fgos-work` was empty before and after their real checks; four older composition scripts now use exit-cleaned tempfile roots (syntax-checked only; no native/authoring recipes executed).

Commands run from repository root (the common prefix below is `plans/260925-documentation-authority-unification/reports/phase-09/`):

| Command | Exit / qualification |
| --- | --- |
| `python3 -B …/rebind/rebind.py --check` | 0; drift 0; no scratch entries left |
| `python3 -B …/g0rework/verify.py` | 0 for scoped record proofs; `status: partial`, `ok: false`, `fullAuditPassed: false` |
| `node …/carries/verify-carries.mjs` (native loading blocked via disposable `NODE_OPTIONS --require` guard) | 0; 345 current source rows, 1,208 current binding assertions |
| `python3 -B …/misc-fix/verify.py` (only its `checks.json` sink redirected to tempfile) | 0; original checks.json unchanged, four artifacts byte-identical |
| `python3 -B …/g9/sweep.py --check --pin HEAD` | 0; 574 records, 546 bodies, zero judgment/drift/chain/replay errors |
| `python3 -B …/g0rework/refresh-carries.py --check` | 0; deterministic record regeneration |
| `python3 -B …/import3/resync.py --check` | 0; no scratch entries left |
| `git diff --check` | 0 |

Evidence: [verification.json](verification.json), [scratch-proof.json](scratch-proof.json), [g9-proof.json](g9-proof.json), and [required-proofs.json](required-proofs.json). The verifier runs the two embedded `ownership.mjs` / `audit-ownership.mjs` pairs unchanged, **never** `phase-08/audit-report.py`. Both native-dependent `checks.mjs` recipes are explicitly **not run** because they can stage/load the native addon; the audit therefore remains **partial**. No fgOS CLI, Git write, full suite, native load, docs edit, pair accounting, or extra service ran. `impact-analysis: degraded` under the no-CLI/no-MCP capability boundary.

F2 (`claim_2e2bc926`, Work Event Store cutover) is deliberately untouched: re-decision remains a final-main-import duty. The earlier cache-safety exception below remains historical and unadjudicated; this scoped rework does not accept or erase it. No authority/cutover gate is accepted.

## Original receipt (historical)

**Original status: blocked — records complete, execution-scope safety exception.**

Pin: `568a11f21f442190ef86e25cf5d2303df7fc0f3d`. The [JSON receipt](receipt.json) contains every changed row's old/new binding and row hashes, 21 legacy rewrite hashes, exact commands/exits, supersession chains, and the safety exception.

## Records delivered

- `ledger/decisions/g0-content-redecisions.json`: three explicit **supersede** re-decisions with literal old/new changed lines and main/spec sources; all reviews **pending**. No legacy edits.
- All 124 reviewed rows receive truthful current rationales through the existing `supersedesBinding` mechanism. This also handles the read-only pilot shards; predecessor prose remains historical.
- `carries/source-parity.json`: 21 entries added (19 confinement, 2 work-state), original 324 entries unchanged. Integration commit `49ad04648`, immediate-parent old/new legacy hashes, historical source digests retained; four later ordinal shifts named separately.
- Three stale overlay pointers resolve through their existing s14/s15 chains to new current-binding retirement rows; no conflicting supersession edges.
- `claim_d5ba1eda` current remainder and primary target now cite `797c7185`; the residual file/hash and its historical `fb0b0100` witness remain untouched. Cutover stays blocked.

Historical wording is not current legacy wording: rigor and the implementation-pointer successors already exist in legacy at the review pin/HEAD. The re-decisions identify exact historical source-digest witnesses instead. The lock successor is **hot state / withStateTx**, not a completed Work-to-Event-Store cutover.

## Final replay

Command: `python3 -B plans/260925-documentation-authority-unification/reports/phase-09/g0rework/verify.py` → **0 for the required record proofs, not execution-contract compliance**.

| Owning proof | Exit / result |
|---|---|
| `rebind/rebind.py --check` | 0; drift 0 |
| `misc-fix/verify.py` | 0; four artifacts byte-identical; original checks.json never rewritten |
| Both `ownership.mjs` and `audit-ownership.mjs` | 0 each; failing rows `[]`; no new native double ownership |
| `node scripts/check-legacy-docs-ratchet.mjs` | 0 |
| Touched bindings / current targets / actual ancestry | 127/127 recompute and resolve |
| Legacy rewrite hashes / complete changed-line diffs | 21/21 and 3/3 |
| `git diff --check` | 0 |
| Full `audit-report.py` / native-dependent `checks.mjs` | 1 / **not run (126)** in final replay; not claimed green |

Proof plumbing only: fixed scratch locations are relocated under a `TemporaryDirectory`; the misc report sink is redirected to scratch before writing. The owning assertions and dual extractors are unchanged. Final audit replay refuses `checks.mjs` before execution because it requires native Git. Scratch is removed.

## Safety exception — owner action needed

Earlier full-audit attempts let `checks.mjs` reach automatic addon staging before the `process.dlopen` guard blocked the native load. That staging writes ignored cache files under `.fgos/runtime/git-addon/df2c8ce8230fecdf` and may update `target/`, **outside the exact write scope**. No addon was loaded; no fgOS CLI, git write, lifecycle verb or test suite was run. The cache was not inspected or blindly deleted afterwards: there is no captured preimage and no permission to restore it safely.

Final replay prevents that path before it runs, but cannot undo the earlier scope breach. Owner/supervisor must accept the cache side effects or authorize baseline-aware restoration. Therefore the assignment result is **blocked**, despite passing record proofs. No independent content approval or authority/cutover acceptance is claimed. Markdown preview and pair accounting were not run.
