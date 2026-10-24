# Main import accounting and legacy re-sync

Status: **authored and verified; independent review pending**. No authority promotion, gate acceptance, cutover or repository commit.

Input HEAD: `92260972cb2dc2ab3740859dc1c005bb9be42857`. This continuation supersedes the earlier blocked receipt preserved at that commit: `docs/reading-map.md` is now explicitly writable. `needsWrites: []`.

Read first: [brief](../w3-import2-brief.md), execution plan §§1–2, owner answers L12-137/L13-6, W1 notes, carries/resync/ledgerfix receipts. [Receipt](receipt.json), [merge accounting](merge-accounting.json), [full check outputs](checks.json).

## Accounting

- Accounted merge `bc5589ed7`, both parents/base, **233 imported commits / 348 changed paths**, per-document digests and path-specific provenance. CHANGELOG parent-new Unreleased bullet union is conserved.
- Verified merge-time setup registry against `src/setup/registrations.mjs`: **141 checks / 32 fixes**, including `git-repository-config`. At the merge, the branch's **Retained Distribution Source Detail** is byte-identical to the first parent; this continuation changes only its superseded terminal setup side effect. Current contract and Data Dictionary lists also agree with the registrations.
- Added all seven incoming `docs/platform/**` paths to the existing incoming-obligation list. Each has a complete dual-extractor unit census; zero-bound documents remain explicit obligations, not fabricated ledger rows.
- Identity §7a remains the bounded local session/writer subsection. Imported signing changes are recorded, not expanded by this task.
- Replayed unchanged production census exports over the complete declared-product inventory: **25 undeclared**, the same site identities as the first parent; generated and committed census bytes match. No census file was rewritten.
- [Deferred overlaps](deferred-rebinds.json): **17 Step 3 / 16 Step 4 / 117 Step 5** source-context rows. Step 3 includes physical revisions; Step 4/5 use frozen canonical consumer batches. These are owner follow-up obligations, not pair accounting or accepted refreshed verdicts.

## Current source carriage

| Source | Missing units carried |
|---|---:|
| component-boundary advisory | 2 |
| distribution | 9 |
| Observe | 2 |
| detailed navigation source | 2 |
| runner | 2 |
| **Total** | **17** |

Existing holders were reused; no second detailed reading map was created. The advisory source did not change in this merge: its existing carriage became stale when the candidate changed. The source-carriage shard is `ledger/decisions/s16-import2-resync.json`.

- Packaging retains the complete RUL108 rule and both imported dated decisions. RUL101's complete history stays in the existing spec, explicitly superseded; the old duplicate maintenance page is a historical pointer, not live vendored-parser instructions. The old direct binding moves to that complete history unit, not to the shortened pointer.
- Setup no longer creates the terminal directory; the allocation store owns creation. Runner keeps failed panes until human closure; positive retention only produces a doctor report. Terminal config diagnosis is folded into `terminal-control`.
- Observe carries `PI_SESSION_ID` while preserving the prior code-backed friction inventory and rebased Identity link.
- `docs/reading-map.md` section 5 carries the complete Terminal/Git/YAML entry updates. Its transition banner, both knowledge routes, earlier corrections and single-holder status remain intact.

## Step 0 / binding proof

[Binding refresh](binding-refresh.json) authenticates **769 preimage effective bindings** against exact input or merge-first-parent bytes. **242 rows across 14 existing shards** were refreshed, including content-preserving placement shifts; **791 current effective direct bindings** pass replay after the 17 new source rows and five supplemental rule/history member bindings. **277 historical overlay predecessors** are not rewritten.

Resolution uses complete content, self-inclusive ancestry and both neighbours, never an ordinal alone. Four-key binding hashes use the declared compact sorted UTF-8 JSON + LF recipe. Full before/after content and neighbour witnesses remain available; repetitive long strings are losslessly interned in `textCatalog` by SHA256, and `verify.py` authenticates and expands every reference. All changed rows are `pending`, not independently accepted. Three touched partial carries have freshly computed complete source-line residuals in [partial-carry-residuals.json](partial-carry-residuals.json).

Negative probes reject stale digests, wrong neighbours, parents-only ancestry and wrong serialization. Historical frozen review/gate/recipe projections remain historical; their owners must rejoin the effective rows and recompose from the final pin.

## Verification

Reproduce all focused checks: `python3 -B plans/260925-documentation-authority-unification/reports/phase-09/import2/run-checks.py`.

| Owning proof | Result |
|---|---|
| Dual frozen extractors + current binding/conservation replay | PASS; 791 current bindings; four negative probes rejected |
| Legacy drift scanner and `--check` | PASS; 33 files, 0 missing changed units |
| Legacy ratchet | PASS; 997 legacy files |
| Ratchet owning single test | **28 passed, 0 failed, 0 skipped** |
| Evidence relocation `--before`, original checkout | PASS; **867 entries, 0 violations** |
| Unchanged census exports | PASS; 25 undeclared; exact committed bytes |
| Read-only diff/scope/index checks | PASS; no repository Git write |

Only four existing ratchet exception digests were refreshed, using the existing `mainMergeAccounting` provenance format. Original rationale/kind/approval fields and the baseline are unchanged; the preceding accounting remains authenticated at the input commit. Digest accounting is not content approval.

### Environment limits and earlier attempts

The initial native Inspect floor probe failed because the live machine-state root is read-only to this worker. A complete byte-matched `/tmp` fixture reproduced that refusal; its copied consumer inventory is recorded in [evidence-fixture.json](evidence-fixture.json). Setting the supported `FGOS_STATE_ROOT` to a private mode-0700 scratch directory allowed the **unchanged checker on the original checkout** to pass. This is state isolation, not a disabled floor check or a weakened evidence fixture. The record-only census uses the owning production script-addon staging door; its first unstaged attempt failed with `git-addon-not-shipped` before that normal door was used. No YAML-focused test was patched, skipped or made to use an alternate parser.

No broad suites (`npm test`, `scripts/run-tests.mjs`, workspace Cargo tests), fgOS CLI/lifecycle verbs, live configuration changes, secrets, repository Git mutation, pair accounting or protected owner/gate/progress edits. Git writes occurred only in the explicitly permitted disposable `/tmp` test fixture. `impact-analysis: degraded/unqueried` under the no-CLI brief; no production symbol changed. No markdown preview service was started within this confined worker scope. Independent content review, deferred source-context refresh and final-pin recomposition remain with their existing owners.
