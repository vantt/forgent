# G0 content rework receipt

## Current authorized ownership-reader repair — scoped proofs passed

Input HEAD: `c7b413de2`. Implements [L13-27](../owner-answers.md) through the existing rebind door, without rewriting ledger history. Evidence: [ownership-reader-proof.json](ownership-reader-proof.json). The earlier blocked receipts below remain historical, not current verdicts; their old script hashes still describe their recorded HEADs.

Both live ownership/audit pairs now exit **0**. Each census preserves the same **23 raw binding diagnostics**, in the same order as `ownership-drift-proof.json`: **7 superseded origins + 16 identical-unit groups**, accounted **23**, unaccounted **0**. Native target duplicates remain **0**, introduced active pairs **0**. Historical replay uses the verifier's existing authoring pin `5a3f7580a012da011fc09ce88cff89bbea2b9008`; both pairs exit **0**, raw drift **0**. This is scoped proof success, not full audit/approval: native-dependent `checks.mjs` is still not run; verifier `status: partial`, `ok: false`, `fullAuditPassed: false`, `recordProofsPassed: true`.

### One owning judgment, unchanged raw diagnostics

Prior art reused: `594fe4194`'s existing group-aware `matches()` and exact supersession traversal, plus `98d71bef2`'s mandatory live audit execution and historical-input replay. The missing interface was authenticated group claim IDs in the check output, not a new matching mechanism.

`rebind.py --check` now exposes `authenticatedIdenticalUnitGroups` with file, pointer, claim ID and binding, only after its unchanged matcher validates **every** member. Superseded-origin entries add their claim ID and original binding alongside the already authenticated effective binding. The JavaScript reader calls that command and joins its authenticated entries by exact file/claim/old-binding identity; it does not implement group or successor matching. Check exit **1** retains usable diagnostics for other claims, but the offending claim is never accounted; command errors or malformed output fail closed.

The raw predicate and `targetDigestDrift` rows are unchanged. Added `accountedTargetDigestDrift` and `unaccountedTargetDigestDrift` are a complete partition of that list. The audit's only change is to require no **unaccounted** drift rather than no raw drift; both duplicate/pair checks remain intact. All other manifest fields and embedded recipes, especially `checks.mjs` and its exception list, are byte-identical. The verifier consumes this reader partition instead of independently re-judging its raw rows; it still requires both real live audit exits and `noNewDoubleOwnership: true`. Its separate exact-record predicate continues to own the 127 overlay assertions.

### Current embedded script hashes

SHA-256 over each embedded source's UTF-8 bytes; also emitted by `verify.py` and recorded in the new proof. Historical receipts are not repinned or rewritten.

| Manifest | Script | SHA-256 |
| --- | --- | --- |
| round5 | `ownership.mjs` | `22f475f8bfe371ec715eb7fbabc18963f409578a8caf318184a70e7647da045f` |
| round5 | `audit-ownership.mjs` | `384f81cdfb34c6ed214fd62438134118f30a51c1b90e102ee79ecac1ca213e33` |
| sync4d | `ownership.mjs` | `e0f7e53f5acb5176294e10456c5fa6955cf3d6f31a9946440699d952b2a7a345` |
| sync4d | `audit-ownership.mjs` | `c00a47df2e7fb9bd44734edac52b706df24552d120969468db7b866d35da72ac` |

Both extractor/library hashes are unchanged: round5 `083795c90eac1d5601fedc2261390f15668fceed68a3053777960fea9a927dc3`; sync4d `48e153938d145bd41986b47ba816d4506db1a90c664170ee08e17bc60341ba41`.

### Commands and actual exits

All commands run from the repo root. `R=plans/260925-documentation-authority-unification/reports/phase-09`, `T` is the verifier's disposable tempfile under `/tmp/fgos-work/`, `D=$T/<manifest-stem>`. All Python invocations use `python3 -B`. Node has `NODE_OPTIONS=--no-addons`, with `CLAUDE_CODE_SESSION_ID` unset; the verifier additionally installs its existing throwing addon guard. Exact argv/exits and output hashes are in the proof.

| Required command | Exit / result |
| --- | --- |
| `python3 -B "$R/g0rework/verify.py"` | **0**; all 15 nested commands below exit 0, 127 authoring and live target/ancestry assertions pass |
| `python3 -B "$R/g0rework/refresh-carries.py" --check` | **0**; 346 parity rows, 91 live heading rows |
| `python3 -B "$R/rebind/rebind.py" --check` | **0**; unresolved 0, authenticated origins 7, authenticated groups 16 |
| `python3 -B "$R/g0join/join.py" --pin HEAD` | **0**; 1,929 effective rows approved by existing reviews; missing/stale/mismatched/unresolved 0; no verdict authored here |
| `python3 -B "$R/g0rework/test-accounting.py"` | **0**; existing 12 predicate controls plus the two copied-input boundary controls below |
| `python3 -B "$R/rebind/test_rebind.py"` | **0**; existing three owning matcher/supersession tests |
| `git diff --check` | **0** |

All 15 nested verifier commands, in order:

| Command | Exit |
| --- | --- |
| `python3 -B "$R/rebind/rebind.py" --check` | 0 |
| `python3 -B "$R/g0rework/refresh-carries.py" --check` | 0 |
| `node "$R/carries/verify-carries.mjs"` | 0 |
| `python3 -B "$T/misc-verify.py"` (existing output-only sink redirection, not an input override) | 0 |
| `python3 -B "$R/g0rework/test-accounting.py"` | 0 |
| round5 `node --require "$T/authoring-inputs.cjs" "$D/ownership.mjs" --output-dir "$D"` | 0 |
| round5 `node --require "$T/authoring-inputs.cjs" "$D/audit-ownership.mjs" --output-dir "$D"` | 0 |
| round5 `node "$D/ownership.mjs" --output-dir "$D"` (live, no input preload) | 0 |
| round5 `node "$D/audit-ownership.mjs" --output-dir "$D"` (live) | 0 |
| sync4d `node --require "$T/authoring-inputs.cjs" "$D/ownership.mjs" --output-dir "$D"` | 0 |
| sync4d `node --require "$T/authoring-inputs.cjs" "$D/audit-ownership.mjs" --output-dir "$D"` | 0 |
| sync4d `node "$D/ownership.mjs" --output-dir "$D"` (live, no input preload) | 0 |
| sync4d `node "$D/audit-ownership.mjs" --output-dir "$D"` (live) | 0 |
| `node scripts/check-legacy-docs-ratchet.mjs` | 0 |
| `git diff --check` | 0 |

### Negative controls: actual copied inputs, not mocked matching

Extended the existing `test-accounting.py` owning proof. Each case copies the decision shards, checker, shared binding traversal, adapter, registry and manifests into a `tempfile.TemporaryDirectory` under `/tmp/fgos-work/`; unchanged documents/modules are read-only references. Only copied JSON is mutated, with the actual Python check and both embedded JavaScript pairs run from that fixture root. The new boundary cases observe the reader/check integration; they do not duplicate the existing matcher's per-field cases.

- **Stale digest without successor:** `s4-packaging-distribution-successors.json#/registryGaps/22`, `claim_40aafcee52b22eda087c5f85eacb9392`. Replace only its digest with 64 zeros after confirming it has no effective successor and originally matches live bytes. Both readers retain 24 raw rows, account 23, and leave precisely this one unaccounted.
- **One non-matching group member:** `s9-runner-01.json#/registryGaps/2`, `claim_004b47fc284721eff96cfa890f85aac0`. Replace only the last member's digest with 64 zeros, keeping the common digest and other seven members unchanged. Both readers retain 23 raw rows, account 22, and leave precisely this group unaccounted. The checker does not publish its claim in either authenticated list.

Each case executes all five commands below (ten child command results total, including six expected failures). `C` is its copied fixture root, `D=$C/<manifest-stem>`:

| Fixture command (each case) | Expected and actual exit |
| --- | --- |
| `python3 -B "$C/$R/rebind/rebind.py" --check` (fixture cwd; relative path in exact argv) | **1** |
| round5 `node "$D/ownership.mjs" --output-dir "$D"` | **0** |
| round5 `node "$D/audit-ownership.mjs" --output-dir "$D"` | **1**; `assert(current.noNewDoubleOwnership)` |
| sync4d `node "$D/ownership.mjs" --output-dir "$D"` | **0** |
| sync4d `node "$D/audit-ownership.mjs" --output-dir "$D"` | **1**; same assertion |

Both cases preserve zero native duplicates and zero introduced active pairs. The harness exits **0** only after observing the required failures. No assertion or exception list is waived to achieve green.

Safety: **17,707 protected tracked files** outside the exact writable scope fingerprint identically before/after proofs; `.fgos/` is excluded without reading it. Only the authorized two manifest reader pairs, rebind check output, verifier, its owning proof and `g0rework` evidence/receipt change. No docs, ledger, registry, review, pair accounting, Git write, fgOS CLI, native addon, forbidden audit driver or product/full-suite test ran. `impact-analysis: degraded` because no MCP is available and fgOS CLI is prohibited; direct callers and history were checked. Markdown preview is not started because extra service/state writes are forbidden. Final `python3 -B` stdin validation exits **0** (Python ASTs, evidence JSON, exact script hashes, all required/nested exits and expected negative failures); final `git diff --check` exits **0**. All owned scratch was removed and `/tmp/fgos-work/` is empty, recorded as `scratchRemoved: true` and `scratchRemaining: []` in the proof.

Operational attempts are not passing proofs: initial tempfile preparation exited **1** because the permitted scratch parent did not exist; it was created and preparation retried. The first verifier capture hit its **300-second tool deadline** before returning a verifier exit; its orphaned scratch was removed. The complete serial retry ran in **330.7 seconds**, exited **0**, and supplied the evidence above. No failed or timed-out attempt is counted as a successful replay.

## Historical ownership-drift accounting — blocked by the frozen reader contract

Input HEAD: `95432dbd807991c76a8cef383c50674da9f0e2e7`. **All 23 diagnostics are explained; the requested all-green proof set is impossible within the exact writable scope.** Both live ownership censuses exit **0** and emit the same 23 rows; both unchanged live audit scripts exit **1** at `assert(current.noNewDoubleOwnership)`. The verifier now propagates those failures instead of treating a passing authoring-pin replay as live audit success.

Evidence owners:
- [ownership-drift-proof.json](ownership-drift-proof.json): all 23 claim IDs, exact shard/pointer, cause commit, complete old/new target digests, current member matches, successor coordinates, existing rebind references, script hashes and baseline/live command exits.
- [ownership-drift-verification.json](ownership-drift-verification.json): every required and nested command/argv/exit, both live failure traces, other owning assertions, protection census and scratch cleanup.

### What the frozen scripts actually read

The `ownership.mjs` in each manifest reads only `claims` and `registryGaps` from pilot/ledger decision shards and tests current `unitsOf(targetOwner)` with:

```js
u.anchor === r.targetAnchor && u.textDigest.startsWith(r.targetUnitDigest)
```

Neither recipe reads `reports/phase-08/step-00-*-rebindings.json`, `rebind/g0-rework-rebindings.json`, `successorGroup`, or supersession edges. The companion audit reads that raw census, the prior collision census and the identity registry. There is **no rebinding filename named by either ownership recipe**. Therefore adding a Phase 8 record cannot change these results; no unused record was invented as a purported fix. Existing rebind records below remain the single witness/edge owners, referenced rather than copied or edited.

Historical confirmation: the exact same three embedded sources (library, ownership, audit) at `6bb1c7d61` and HEAD are byte-identical. Replaying with input JSON/Markdown reads pinned to `6bb1c7d61` gives **0 drift**, and both pairs exit **0**. This is explicitly a historical diagnostic, not the live proof. Live runs have no input preload, filtering, synthetic units, census rewrite or assertion waiver.

### The 16 runner rows: changed records, unchanged document

Cause for **each row in the following table**: commit `594fe4194693d1a6026ed7801168002f89e6c85e` filled the previously **absent** `targetUnitDigest` with the common complete member digest:

`95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104`.

The owner remains `docs/specs/runner.md`, the anchor remains `null`, and the disposition is `supersede`. Previously, the audit's truthy-digest guard skipped these rows. Now it visits them, but no extracted unit has a null anchor. This is a group-contract mismatch, **not document drift or a stale digest**. Each row's eight explicit members independently authenticates against current units through the existing `rebind.matches` contract (128 member checks total). Deleting the digest or inventing a single occurrence would conceal the mismatch and weaken the real group contract; neither was done.

`docs/specs/runner.md` has SHA-256 `88d0e89522a29eed0d222da57c26c1dfd3912cd3e463e36887e211bbf74e5279` at `6bb1c7d61`, `594fe4194` and HEAD. `git diff 6bb1c7d61 HEAD -- docs/specs/runner.md` is empty.

All pointers below are in `ledger/decisions/s9-runner-01.json`. `Record` is an existing `/records/N` reference in `../rebind/g0-rework-rebindings.json`; it records that same missing-group-digest repair, not a newly invented document transition.

| Claim ID | Pointer | Record | Cause / digest transition |
| --- | --- | --- | --- |
| `claim_004b47fc284721eff96cfa890f85aac0` | `/registryGaps/2` | 61 | `594fe4194`; absent → common digest above |
| `claim_69311391fbb9b1cf924197e6063e5cad` | `/registryGaps/4` | 62 | `594fe4194`; absent → common digest above |
| `claim_c1d4ad0697013185af2572dd0a944024` | `/registryGaps/5` | 63 | `594fe4194`; absent → common digest above |
| `claim_79fd838ebf7eb7bbaa72efa619535671` | `/registryGaps/6` | 64 | `594fe4194`; absent → common digest above |
| `claim_99f595d515a3a60d4796192d78e67eae` | `/registryGaps/7` | 65 | `594fe4194`; absent → common digest above |
| `claim_0f9aa9f49945a45860e3e3c2d1e880bd` | `/registryGaps/8` | 66 | `594fe4194`; absent → common digest above |
| `claim_b3960a6316827da8f49bc10a9221b4c5` | `/registryGaps/9` | 67 | `594fe4194`; absent → common digest above |
| `claim_2afd573c3c2205adb49a698535fbf864` | `/registryGaps/10` | 52 | `594fe4194`; absent → common digest above |
| `claim_298fc2ef185e234bd4b65f047f70ecec` | `/registryGaps/11` | 53 | `594fe4194`; absent → common digest above |
| `claim_09dd63bd1aaf9b4b6078de434144efb0` | `/registryGaps/12` | 54 | `594fe4194`; absent → common digest above |
| `claim_3c1dfb5d442b11bec14ecd32e309c1dd` | `/registryGaps/13` | 55 | `594fe4194`; absent → common digest above |
| `claim_cad110bd532badff055f69c0a236644a` | `/registryGaps/14` | 56 | `594fe4194`; absent → common digest above |
| `claim_d3cb0eccd8b39c08a3ec7af9b4b14d18` | `/registryGaps/15` | 57 | `594fe4194`; absent → common digest above |
| `claim_b2afbadf035b6374ed73289b388f5d20` | `/registryGaps/16` | 58 | `594fe4194`; absent → common digest above |
| `claim_33c41de79cf4a52288035a9656c09735` | `/registryGaps/17` | 59 | `594fe4194`; absent → common digest above |
| `claim_fa95d7f496a850ef197d25f18ad6f760` | `/registryGaps/18` | 60 | `594fe4194`; absent → common digest above |

### The seven stale direct-origin rows

These original rows retain their old digests, while their explicit effective successors already match the live document. Both immutable parent/commit snapshots were re-extracted with the existing dual-extractor adapter; all seven complete old/new digests match their existing witness owners and live successors. The prefixes below are display-only; the evidence JSON and referenced records contain full SHA-256 values.

`B = pilot/decisions/b-data-dictionary.json`; `E = pilot/decisions/b-entry-actors-rules-pointers.json`; `C = ledger/decisions/s6-whole-system-component-component-boundary-advisory.json`.

| Claim ID / origin | Target unit | Digest before → live | Cause commit and exact change | Existing record |
| --- | --- | --- | --- | --- |
| `claim_4333c7a8ff0e32c7b69dc10ed113f25b`; B `/claims/0` | work-state `3-work-item-data-dictionary` | `c55decfd` → `38928382` | `e88d4e283`; section payload includes lines 74/83 retargeting Khai việc/Nộp vấn đề tự do to `#add-verb`/`#submit-verb` | 149 |
| `claim_5ba6768e5c4f7d93e77ccceda19d0103`; B `/claims/1` | work-state `unheaded-block-4` | `fa35b5b9` → `697a5d20` | `e88d4e283`; same two link changes in the dictionary table | 150 |
| `claim_79b8aa6e1e59ca0593c2e3f1a409a459`; B `/claims/55` | work-state `6-domain-model` | `4b12f710` → `6409f862` | `e88d4e283`; section payload includes line 516's Add/Submit link retarget | 151 |
| `claim_5430b3f4676f8ecc0c94b8f0680f45c6`; B `/claims/65` | work-state `unheaded-block-54` | `fcc3b5bc` → `c7cd4adc` | `e88d4e283`; same line 516 link retarget in the body | 152 |
| `claim_477a30f4902261e390c34ab888145dcd`; E `/claims/7` | work-state `11-business-rules` | `6780225c` → `0c7dbff4` | `594fe4194`; RUL59 line 1087 adds explicit priority `try/catch`, stderr and intentional swallow policy; heading payload changes | 0 |
| `claim_96e947d6daf7dd7612cc711be8e3e22e`; C `/claims/57` | component-boundary `9-hexagonal-architecture-view` | `c1190693` → `19a6fe08` | `5a849befc`; section payload includes line 549's `../architect/proposals/` → `../proposals/` link retarget | 153 |
| `claim_4e86e8414c4e3b780e81f77255853447`; C `/claims/64` | component-boundary `unheaded-block-70` | `913b0ef1` → `5700ffb4` | `5a849befc`; same line 549 link retarget in the body | 154 |

Full remaining cause commits: `5a849befcbdb74ec974546af42b925cab614e841` and `e88d4e283c8161f9bf649447e8f9c5876931107b`. The four e88 edges reuse the existing `last-rows-rebindings.json` witnesses; the two component edges reuse `followup-rebindings.json`. No witness, edge or ledger was copied or rewritten.

Effective bindings for B are `g0-content-redecisions.json#/bindingRefresh/{49,50,127,128}` in table order; E resolves to its `/bindingRefresh/117`. C resolves to `s14-resync-b.json#/bindingRefresh/{604,611}`. `rebind/rebind.py --check` authenticates all seven superseded origins and reports unresolved drift **0**. The frozen ownership audit instead checks the stale origins directly.

### Durable check change and scope blocker

`verify.py` now extracts only the required library and two scripts from each frozen manifest into its existing exit-cleaned tempfile directory, then runs **both** live pairs with explicit `--output-dir`. It clears `CLAUDE_CODE_SESSION_ID`, uses `NODE_OPTIONS=--no-addons` plus its existing throwing `process.dlopen` guard, preserves every raw diagnostic and exit, and includes live exits/zero-drift in `ownershipPassed`. The historical pin replay, exact rebind accounting, collision checks, all 127 live target assertions and every existing proof remain intact. Neither `checks.mjs` nor `phase-08/audit-report.py` is executed or materialized by this extraction.

Prior art reused: `594fe4194`'s group-digest repair and target witnesses; `d104c32ab`'s historical/live separation and `account_target` predicate; the unchanged group-aware `rebind.matches`, dual extractors and supersession traversal. The missing behavior was mandatory **live audit-ownership execution and failure propagation**, not another rebinding mechanism. `impact-analysis: degraded`: no MCP capability is available and this assignment expressly forbids the fgOS capability-query CLI; direct symbol/caller and git-history inspection were used instead. Only this verifier's `main` changes; no frozen symbol is edited.

`needsWrites` (listed only; no outside-scope writes):

- `plans/260925-documentation-authority-unification/pilot/decisions/b-data-dictionary.json` — four stale direct-origin digests.
- `plans/260925-documentation-authority-unification/pilot/decisions/b-entry-actors-rules-pointers.json` — one stale direct-origin digest.
- `plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-component-component-boundary-advisory.json` — two stale direct-origin digests.
- `plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-reproduction.json`.
- `plans/260925-documentation-authority-unification/reports/phase-06/step10-sync4d-reproduction.json`.

The last two paths require explicit authorization for an owning-reader contract repair: authenticate identical-unit groups and follow existing successor/rebind records without dropping raw diagnostics. **Recommended next step: authorize that repair rather than rewrite superseded ledger history.** Listing the first three stale-origin paths does not recommend deleting their history; refreshing them alone still cannot fix the 16 null-anchor groups. The brief forbids both ledger edits and frozen-script changes, so this round cannot honestly claim completion or all-green proofs. No assertion was weakened, no input projection was installed for a live audit, and no records-only fix is falsely claimed.

### Commands and actual exits

All commands run from the repository root. `R=plans/260925-documentation-authority-unification/reports/phase-09`, `T` is the disposable tempfile root under `/tmp/fgos-work/`, and `D` is its applicable manifest subdirectory. Every Python invocation uses `python3 -B`; live Node commands have `NODE_OPTIONS=--no-addons` and `CLAUDE_CODE_SESSION_ID` unset. The verifier additionally requires its throwing no-addons guard. Exact argv and stderr are in the linked evidence, including temporary paths that have since been removed.

| Required command | Exit / result |
| --- | --- |
| Round5 `node "$D/ownership.mjs" --output-dir "$D"` | **0**; 23 raw drift rows |
| Round5 `node "$D/audit-ownership.mjs" --output-dir "$D"` | **1**; `assert(current.noNewDoubleOwnership)`; native duplicates 0, introduced active pairs 0 |
| Sync4d `node "$D/ownership.mjs" --output-dir "$D"` | **0**; identical 23 raw drift rows |
| Sync4d `node "$D/audit-ownership.mjs" --output-dir "$D"` | **1**; same assertion and no new duplicate/pair |
| `python3 -B "$R/g0rework/verify.py"` | **1**; both live audit failures are now mandatory; 127 live targets/ancestries and all other owning assertions pass |
| `python3 -B "$R/g0rework/refresh-carries.py" --check` | **0**; 346 parity rows, 91 live heading rows |
| `python3 -B "$R/rebind/rebind.py" --check` | **0**; unresolved drift 0, seven authenticated superseded origins |
| `python3 -B "$R/g0join/join.py" --pin HEAD` | **0**; existing join status reported unchanged; no approval manufactured |
| `git diff --check` | **0** |

All **15** nested verifier commands, in execution order:

| Nested command | Exit |
| --- | --- |
| `python3 -B "$R/rebind/rebind.py" --check` | 0 |
| `python3 -B "$R/g0rework/refresh-carries.py" --check` | 0 |
| `node "$R/carries/verify-carries.mjs"` | 0 |
| `python3 -B "$T/misc-verify.py"` (existing output-only wrapper around misc verifier; `checks.json` sink redirected before writing) | 0 |
| `python3 -B "$R/g0rework/test-accounting.py"` | 0 |
| Round5 `node --require "$T/authoring-inputs.cjs" "$D/ownership.mjs" --output-dir "$D"` | 0 |
| Round5 `node --require "$T/authoring-inputs.cjs" "$D/audit-ownership.mjs" --output-dir "$D"` | 0 |
| Round5 `node "$D/ownership.mjs" --output-dir "$D"` (live) | 0 |
| Round5 `node "$D/audit-ownership.mjs" --output-dir "$D"` (live) | **1** |
| Sync4d `node --require "$T/authoring-inputs.cjs" "$D/ownership.mjs" --output-dir "$D"` | 0 |
| Sync4d `node --require "$T/authoring-inputs.cjs" "$D/audit-ownership.mjs" --output-dir "$D"` | 0 |
| Sync4d `node "$D/ownership.mjs" --output-dir "$D"` (live) | 0 |
| Sync4d `node "$D/audit-ownership.mjs" --output-dir "$D"` (live) | **1** |
| `node scripts/check-legacy-docs-ratchet.mjs` | 0 |
| `git diff --check` | 0 |

Earlier diagnostic harness (`python3 -B` via stdin) exits **0**: each of the four baseline commands `node --require "$T/baseline.cjs" "$D/{ownership,audit-ownership}.mjs" --output-dir "$D"` (both manifests) exits **0**, with zero drift at `6bb1c7d61`; the four separate live commands exit **0,1,0,1** as above. The commit-witness/record-reference harness exits **0**, checking all seven dual-extractor old/new edges and all 128 group members. The final required-command capture harness exits **0** as a recorder, **not** as a passing verdict over its child commands; it records the two failing live audits and verifier exit 1 explicitly.

Final record/syntax/scope harness (`python3 -B` via stdin) exits **0**: verifier AST parses, both new JSON files parse, all 23 references resolve, seven complete digest edges match, 16 groups authenticate 128 members, expected command exits are preserved, only four `g0rework/**` files changed, and scratch is empty. Final `git diff --check` exits **0**.

Final state: `recordProofsPassed: false`, `liveOwnershipPassed: false`, `ownershipPassed: false`, `status: failed`, `ok: false`, `fullAuditPassed: false`. All 23 rows have existing exact accounting references; that fact does not turn raw audit failure into success. Both native-dependent `checks.mjs` remain not run.

Safety: **17,814 protected tracked files** fingerprint identically before/after the final proof replay; scratch snapshots are `[]` before and after. Tempfiles were removed. Only `g0rework/**` changed. No docs, ledger, register, review, reproduction manifest or rebind record was edited; no pair accounting, fgOS CLI, Git write, native-addon load, product/full-suite test or forbidden audit driver ran. Markdown preview was not started because this task forbids extra state/service writes. Earlier receipt sections below are historical and do not override this blocked result.

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


Lead rerun after the runner committed the edited record (`73e89962e`): `g0rework/verify.py` **0**, `refresh-carries.py --check` **0**, `rebind/rebind.py --check` **0**. The committed-record blocker above is cleared.

## Current F-duty supplement: selected relocation and final link retargets

[L13-23.4](../owner-answers.md) makes 44 heading + 90 body overlay approvals
conditional on applying the component-boundary predecessor, relocation and history
steps together with those overlays. The writable evidence supplement is
[final-pin-duties.json](final-pin-duties.json), linked from this existing G0 receipt;
the gate register and ledger remain untouched.

Use **`rebased:w8:gap05:relocation`**, `composition/patch-specs.json#/patches/138`,
in place of historical `w8:gap05:relocation`. Its input hash is
`53d407ed2e7b626329e334a06b083a964e3bfcc059dfd971d3801beb2ed83904` and its
step after-hash is
`6b457550660701bf10f5f25f2f466df5e601dafa8df441410d7060ae1cd370db`.
The paired `w8:gap05:history` is unchanged. The relocation change set remains
identical; these are not new semantic approvals.

After the later L13-26 link patch (`fchain/link-retargets.json#/patches/4`),
`docs/platform/component-boundary.md` has composed hash
`61cd146dae1dc6c2c30a1fd64280a6608adebc19e8a5a8a4e8bf4c5e39803bbd` at
`2c5093b57954790cda1639b36821f71bd2a00c08`. Do not confuse this final-file
hash with the relocation step hash. Recompute/rebind affected units and obtain
matching delta verdicts at the actual F pin; otherwise reopen the conditional
approvals. No gate, lease or cutover is accepted by this supplement.

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
