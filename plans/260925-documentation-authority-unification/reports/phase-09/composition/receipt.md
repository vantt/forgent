# Composition receipt — replayed records, not live application

Current replay pin: **`d14d89865b44018db48d12fa8b3f5279a2dbc905`**. The packet's original author pin `eb744281deba853f201cda15dcb4876300a1d638` remains provenance, not a claim that these proofs ran there. Authority: L13-11.2 and the bounded rework brief. **Composition verification passes.** No documentation authority is promoted, no gate is closed, and no patch is applied outside scratch. This supersedes earlier receipt replay/gloss evidence; historical `w8-*`/`w9-*` artifacts remain dated evidence.

## Gloss repair

Read all **104 witness after-lines** again for doubled words, dangling articles and broken prose caused by removing an id. **One fix**, zero-based **witness #16**:

- File: `docs/platform/event-store/spec.md:1138`.
- Before: `consumer streams (plan porting uses …)`.
- After: `consumer streams (in the plan, porting uses …)`.

The existing `w8:gloss:docs/platform/event-store/spec.md` forward diff, rollback diff and expected-after hash were regenerated from the actual replayed preimage; the witness was regenerated too. All 104 witness before/after lines match their exact replayed locators. No other removal-induced doubled-word/dangling-article fault was found. The earlier seven fixes (#3, #9, #15, #33, #86, #87, #96) remain; optional grammatical redundancy was not expanded into polish. [w10-gloss-audit.json](w10-gloss-audit.json) lists the complete review set and the exact fix.

Full-chain replay: **79 effective + 14 conditional F specs + 13 external predecessor applications = 106 steps on 74 files**, with **424 GNU patch invocations, all exit 0**. Every step is hash-guarded, rolled back byte-exact and reapplied; full reverse rollback restores every original byte and original absence. Independent replay separately passes **221 patch invocations**, including generator evidence, with the same 74-file restoration. See [w10-chain-verification.json](w10-chain-verification.json) and [w10-independent-verification.json](w10-independent-verification.json).

After the **real skill generator**, citation drift is **130 findings without F (exit 1, negative control) → no findings with F (exit 0)**. This is zero findings, not merely zero new findings. The baseline remains byte-identical, SHA-256 `ac0a6e980278f4be3ea3b2f7dbcf0f9004cf5fe1a7a35dbe1451aa0328ab4fff`. Evidence: [w10-citation-before-f.json](w10-citation-before-f.json), [w10-citation-verification.json](w10-citation-verification.json). The 14 F specs are still prepared-only and require final-pin lease/preimage acceptance.

G9 was recomposed against this chain. Exactly five current bodies changed (`agent-protocol`, `event-store`, `git`, `process`, `terminal-control` specs); the other 540 body diffs/hashes did not. The new G9 chain-identity check fails before recomposition and passes afterwards. See [G9 receipt](../g9/receipt.md) for counts, controls and its separate pre-existing ratchet blocker.

## Binding and action verification retained

The existing shared resolver and both immutable extractors were rerun, not replaced:

- **171 originating assertions** resolve through **162 binding-refresh occurrences + 9 unit-carry occurrences** to **90 distinct terminal rows (81 + 9)**. The other 81 occurrences are earlier claims superseding into those terminals; they are not a reason to invent duplicate supersession edges.
- All 171 joins resolve to the 90 operative body overlays. Target body bytes and text digests equal the original component-boundary blocks, with repeated text disambiguated by preserved ancestry. **Zero moved-body and zero moved-heading bindings are unresolved**.
- Heading shard: **44 operative overlays + 44 excluded lookup snapshots**; the existing `rows()` snapshot policy excludes the latter. **134 overlay hashes/anchors/ancestries verify**, with no ambiguous supersession edge. No ledger/resolver edit was required in this turn.
- Full scan: **13,752 assertions / 12,510 distinct effective bindings / 285 target files**, zero missing files. Residual drift remains **556 assertions / 407 distinct bindings**, explicitly **not all green**. Component-boundary unresolved assertions fall **177 → 6 (4 distinct endpoints)**, all reviewed table-edit drift rather than moved bodies. Systemic post-apply rebind remains Lead-owned. The W10 review's historical split (361 chain-induced + 46 pre-existing distinct bindings) is not recomputed or newly asserted here.
- `actions.json#/actions/4.path` and `effectivePath` still equal `docs/platform/workflow/spec.md`, with source/preimage/postimage hashes matching the composed holder. Historical identity and labelled legacy-source provenance remain unchanged.

Evidence: [w10-gap05-verification.json](w10-gap05-verification.json), [w10-unresolved-bindings.json](w10-unresolved-bindings.json), [w10-action-verification.json](w10-action-verification.json). Independent G0 acceptance remains pending. No component-boundary change.

## Commands and exits

The complete reproduction door is `python3 -B plans/260925-documentation-authority-unification/reports/phase-09/composition/w10-rework.py --verify`, from the repository root with a fresh `/tmp/fgos-work/w10-g9-rework/`. [w10-replay-recipes.json](w10-replay-recipes.json) embeds the adapted actual scripts; only scratch/output locations and correction metadata differ from the W9 recipe. Shared resolver/extraction logic is unchanged. The existing Step 7 authored-hunk/parser and published chain replay are reused, not replaced by fuzzy matching.

| Command / proof | Exit / evidence |
|---|---|
| `python3 -B …/composition/w10-rework.py --prepare` | **0**; initial full-chain byte replay, #16 regeneration. `w10-prepare-commands.json`: **425 commands, all 0**, including 424 patch calls. |
| `python3 -B …/composition/w10-rework.py --verify` | Final **0**. `w10-verify-command.json` records the reused verifier's exact argv/stdout/stderr. |
| Reused scratch `python3 -B …/verify.py` | **0**; patch, witness, citation, bindings, overlays and action checks pass. `w10-commands.json`: **522 commands, 521 exit 0 / 1 exit 1** (the intended before-F citation negative), including 513 patch invocations (89 before F + 424 full-chain). |
| `node scripts/build-skill-wrappers.mjs` in before-F/full-chain scratch trees | **0 / 0**. |
| `node scripts/check-decision-citation-drift.mjs` in those trees | **1 / 0**, 130 findings / no findings. |
| Shared Node extractor adapter / read-only Git pin inspection | **0**. |
| Reused scratch `python3 -B …/independent-replay.py` | **0**; 221 patch invocations all 0. Exact commands are in `w10-independent-verification.json`; outer exit/stderr in `w10-independent-command.json`. |
| `git diff --check`, scope/value audit | **0**; see G9 `w10-final-audit.json`. |

One development attempt of `--verify` exited **1**: an over-broad output-name substitution also renamed the ledger input to a nonexistent `w10-component-carriage-body-overlays.json`. No ledger was edited. The adaptation was restricted to the six output filenames, the two disposable scratch verification trees were removed, and the full verifier reran green. `w10-first-verify-command.json` retains that actual error; `w10-first-commands.json` retains **520 subprocess commands (519 exit 0, one expected citation-negative exit 1)** before the Python assertion. The scratch cleanup command exited 0. No failed attempt is presented as evidence of completion.

Only composition records and G9 records plus the separately authorized exceptions **pin field** changed. No live docs, product code/tests, baseline, pair accounting, Git write, fgOS CLI, state/secrets, full suite or preview service. `impact-analysis: degraded` under the explicit records-only/no-CLI brief. Scratch is deleted at handoff. `needsWrites=[]`. The default legacy ratchet remains **exit 1 on three pre-existing digest mismatches**, independently proven unchanged by the pin repair; therefore the overall assignment is blocked, not done. Final-pin approval, independent review, actual cutover generators/doctor, systemic rebind and full-suite parity remain separate Lead-owned gates.
