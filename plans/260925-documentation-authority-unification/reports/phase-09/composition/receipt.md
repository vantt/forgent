# Composition receipt — reworked records, not live application

Record pin: `eb744281deba853f201cda15dcb4876300a1d638`; replayed checkout: `70e57b016452c455c28cae7e2d983c6e34bbf34c`. Authority: **L13-11.2**. This receipt supersedes the earlier overlay/gloss/action evidence; other `w8-*` proofs remain historical. No documentation authority is promoted, no gate is closed, and no prepared patch is applied outside scratch.

## Binding repair

- The resolver reproduces **171 affected originating assertions**, whose effective destinations are **162 `bindingRefresh` occurrences + 9 `unitCarries` occurrences** in `s14-resync-b.json`. These are **90 distinct terminal rows: 81 + 9**, not 171 distinct rows. The other 81 occurrences are earlier claims resolving to those same terminals.
- `ledger/decisions/w9-component-carriage-body-overlays.json` adds **90 operative overlays** and **171 explicit origin → terminal → overlay joins**. Adding two supersession edges for the same terminal would be ambiguous; those duplicate edges were not fabricated to meet an occurrence count.
- Every target is the moved history file's body anchor with the **same `textDigest` and body bytes**. Repeated identical text is disambiguated by the preserved ancestry suffix. All 171 joins resolve; **0 moved body bindings and 0 moved heading bindings remain unresolved**.
- The existing heading shard keeps **44 operative overlays**. Its **44 lookup-only records** now live under `alreadySupersededHistoricalBindings`, an existing `bindings.py` snapshot exclusion. `rows()` sees exactly 44 current rows, not 88; no resolver/code change was needed. All original 88 records remain preserved as JSON values.
- **134 current overlay hashes**, anchors and ancestry verify; no ambiguous supersession edges. Independent **G0 review remains pending**.

The complete post-chain scan resolves **13,752 originating assertions / 12,510 distinct effective bindings / 285 target files**. Residual drift is explicitly **556 assertions / 407 distinct bindings**, inventoried in [w9-unresolved-bindings.json](w9-unresolved-bindings.json). Component-boundary failures fall **177 → 6**; the remaining six are the previously reviewed table-edit drift (four distinct endpoints), not moved units. This is **not** a claim that all ledger bindings are green. Systemic post-apply rebind remains Lead-owned.

## Glosses and action

Seven witnesses (**zero-based indices 3, 9, 15, 33, 86, 87, 96**) are reworded in five existing `w8:gloss:*` specs. Forward/rollback diffs and after hashes were regenerated; all **104 witnesses** reproduce from replayed bytes. The Process Facts historical title and its later cross-reference use identical wording.

After the real skill generator, the citation checker reports **130 findings before F → “no findings” after F**, not merely zero new findings. Baseline bytes remain unchanged (`ac0a6e980278f4be3ea3b2f7dbcf0f9004cf5fe1a7a35dbe1451aa0328ab4fff`). The 14 F specs remain prepared-only, subject to the final-pin docs lease and exact preimage checks.

`actions.json#/actions/4.path` now equals `effectivePath`: `docs/platform/workflow/spec.md`. Its before/current-source/after hashes match that holder and its patch. The original action identity and explicitly labelled legacy-source provenance remain available.

## Commands and exits

[w9-commands.json](w9-commands.json) records every verifier subprocess's exact argv, cwd and exit, including failed/negative attempts: **2,211 commands, 2,207 exit 0, 4 exit 1**. Large stdout is content-hashed rather than duplicated. Outer authoring/inspection commands and two tool timeouts are listed separately there; a timeout has no invented process exit.

| Command / proof | Counts and exit |
|---|---|
| Final full-chain `patch --batch --fuzz=0 -p1` replay | **79 effective + 14 F + 13 predecessor applications; 74 files; 424 patch invocations, all 0**. Each step rolls back exactly; full reverse rollback restores original bytes and original absence. |
| Reused standalone independent replay | **221 patch invocations, all 0**, including generator-evidence roundtrips; 74 files exact. The first attempt timed out at 200 s; the retry exited 0. |
| `node scripts/build-skill-wrappers.mjs` | Final before-F and after-F runs each **0**. |
| `node scripts/check-decision-citation-drift.mjs` | Before F **1** (130 findings, expected); after F **0** (no findings). Three before-F runs across authoring attempts account for three recorded exit-1 commands. |
| Shared `bindings.py` + both immutable extractors | Final catalog/resolution/hash checks **0**. Initial catalog command **1** for a missing scratch registry fixture; copying the existing immutable registry corrected it. |
| `python3 -B …/overlays.py` | Initial **1** on repeated-digest ambiguity, before publication; corrected digest + ancestry join **0**. |
| `python3 -B …/verify.py` | Initial **1** because the assertion expected the weaker “no new findings” message; actual scan was already clean. Both corrected runs **0**. |
| `python3 -B …/publish.py` | **0**; publishes generated evidence and reproduction recipes. |
| Read-only Git history/status/diff inspections | **0** on completed commands; one combined history inspection timed out at 10 s. No Git write. |
| Final JSON/scope/value-preservation checks and `git diff --check` | **0**; see `w9-scope-verification.json`. |

Reproduction: [w9-replay-recipes.json](w9-replay-recipes.json) embeds the actual scripts. Extract into a clean `/tmp/fgos-work/w9-comp-rework/`, then run both verifier commands with **`python3 -B` from the repository root**. The shared extractor adapter changes only its scratch-output path; its extraction logic and both embedded extractors remain unchanged.

Only the two granted record subtrees were changed. No live `docs/`, product code/tests, baseline, state/secrets, pair accounting, Git write, fgOS CLI, full suite or preview service. `impact-analysis: degraded` under the explicit no-CLI, records-only grant; no production symbol changed. Historical focused-test, UI, index and switchboard proofs were not rerun or represented as new evidence. **`needsWrites=[]`**. Final-pin approval, independent G0/G7/G9 review, actual cutover generators/doctor, systemic rebind and full-suite parity remain separate Lead-owned gates.
