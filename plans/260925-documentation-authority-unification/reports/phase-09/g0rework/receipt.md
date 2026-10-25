# G0 content rework receipt

**Current live-parity rework: scoped proofs pass; verification remains partial only for the two native-dependent `checks.mjs` recipes. No full-audit or cutover acceptance.**

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
