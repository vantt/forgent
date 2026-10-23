# Packaging, runner and work-state review fixes and re-sync

Status: completed within the brief's writable scope; candidate-only. No gate accepted, legacy source retired, authority flipped, lifecycle verb run, or repository git write performed.

Original source HEAD: `ae9b9a6ef59ccfc3ce199e1492a5ebc8aaf7a5f5`.

Follow-up at HEAD `7bd1293af0704f66c0a5a158024577eac94bdd21`: [ledger-fix receipt](../ledgerfix/receipt.md) supersedes the original registration-count, shell-discovery and fenced-carrier claims below. Current verification reads HEAD's working tree, not that original authoring pin; the historical binding-refresh `before` inputs remain unchanged.

## Read first / proof

- [Brief](../w2-d1b-brief.md), [execution plan](../preflip-execution-plan.md), [owner answers](../owner-answers.md), [review notes](../w2-review-notes.md), G1/G3 reviews and prior carries/late-areas receipts were the inputs.
- [Machine receipt](receipt.json), [verification](verification.json), [four-source drift result](legacy-drift-four-sources.json).
- [Per-unit adjudications](adjudications.json), [binding refresh](binding-refresh.json), and `ledger/decisions/s13-resync-a.json` preserve full source/target content, ancestry and neighboring placement witnesses. Review status stays pending.

## Review fixes

| Review duty | Resolution |
|---|---|
| Release-manifest duplicate §5 and dead link | One retained §5 under Canonical Release Tree Rules; removed the second 135-line copy. Follow-up fixes the retained Legacy CLI Transition link to `host-invocation-routing/architecture/legacy-cli-transition.md`. |
| Activation-binding duplicate pipeline / walking skeleton | One holder in runtime-identity architecture §11/§14; activation contract links there. Static-preflight qualification is preserved, as are the install-lock/native-first corrections. |
| Distribution Legacy Setup Scenario duplicate | Spec now points to the complete scenario in setup-doctor-registry. The scenario is not lost. The side-effect enumeration also includes `<stateRoot>/terminal`. |
| Data Dictionary 7/7b | Complete registration sets: **143 checks / 32 fixes** from `src/setup/registrations.mjs` (135 literal check IDs plus eight loop-registered Git IDs). The original 135-check claim missed the loop and was incorrect. Removed retired `model-policy-tier-coverage`; retained relevant explanatory prose. Also caught omitted `identity-machine-id` fix beyond the review's listed omissions. |
| Six incoming retired-history fragments | Explicit compatibility anchors for ADR0011/0012/0013 fix all four architecture-map and both CLI-contract links without editing architecture-map. Repaired the internal 0012 link; restored clickable Related Files. |
| Activation implementation fact | Shell integration reads `.git`/gitdir/commondir layout from disk without a Git child; only its test uses `git rev-parse` as an oracle. Rust workspace resolution uses `fgos_git::GitDriver::open_at` and typed topology. |
| Two bad citations | Replaced nonexistent return-worktree test citation with the real research origin; Seat Binding links to the now-existing platform specification. |
| Receipt encoding sentence | Corrected below, without rewriting a historical receipt outside this brief's writable list. |

## Binding recipe correction (supersedes the old receipt sentence)

The sentence in `carries/receipt.md:65` saying the frozen register has **no `bindingHashEncoding` field** was overbroad. At `f534aeaea` and review pin `cffe725b9`, there was **no top-level field**, but there were **10 row-level occurrences**, including the L12-130 declarations. At this task's source HEAD, the register has a top-level declaration and five row-level declarations (six occurrences total). These are different snapshots, not contradictory counts.

This receipt supplies the correction; the original historical receipt and phase-08 register were not edited. No other owner's binding encoding was silently converted.

Individual bindings use SHA-256 of UTF-8 compact JSON, keys sorted by the serializer, plus **exactly one LF**, with these keys (the final recipe adds a sorted member-digest list for group rows, as declared in [the gate register](../../phase-08/step-08-preflip-gates.json)):

1. `targetAncestry`
2. `targetAnchor`
3. `targetOwner`
4. `targetUnitDigest`

Ancestry is self-inclusive, including a heading's own title. Array order is retained except the group digest list, which is sorted with duplicates retained; no BOM; no placement/review fields enter the hash. `verify-binding-hashes.py` independently recomputes this using Python's `sort_keys=True`, `ensure_ascii=False`, and compact separators. This catches serialization-order mistakes independently of the Node writer/verifier.

## Re-sync and conservation

| Retained source | Baseline missing | Final missing | Current units accounted |
|---|---:|---:|---:|
| `docs/specs/work-state.md` | 232 | **0** | 327 |
| `docs/specs/runner.md` | 81 | **0** | 517 |
| `docs/specs/distribution.md` | 16 | **0** | 43 |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | 27 | **0** | 170 |

All **1,057** current units are accounted for: 968 normalized whole-content matches, two complete source blocks inside candidate envelopes, 40 translated/reorganized headings, and 47 explicitly adjudicated adapted/retired legacy clauses. This is **not** a claim of 1,057 byte-identical transfers. The scanner's `explicit-adapted-binding` result is mechanical carriage evidence, not independent implementation-truth acceptance.

Reused the existing native extractor, holders and four-key binding door; no replacement identity system or product mechanism was added. Work-state's apparently missing history/pointers mostly already existed in split holders. Real updates include:

- Current rigor/tier/effort separation and Seat Binding authority, pool inventory/account order and fallback rules.
- Workflow admission authority, 0048/0049 supersession notes, case linkage and the newly settled runner history, plus the Git custody section.
- `withStateTx` / `tx.append`, hot resource naming and the complete RUL10 hot-lock supplement; Identity mint pointers replace removed title-derived `generateId` advice.
- Preserved earlier code-backed corrections instead of resurrecting removed stage nodes, durable-doing claim restoration, the live Work-log chunk tee, retired evolve/coordination doors, pending-profile-migration assertions or candidate-execution preflight.

**1,271** existing binding rows in **16** shards were refreshed: 775 four-key/hash changes and 496 existing placement-witness changes. Unchanged bindings were not invalidated just for being in a changed file. New source bindings live in the distinct `s13-resync-a.json` shard. Old review acceptance is not carried over.

## Verification and limits

Reproduce from the repository root:

```sh
node plans/260925-documentation-authority-unification/reports/phase-09/resync-a/verify-resync.mjs --scan
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/resync-a/verify-binding-hashes.py
```

- Both pass: **2,328** binding hashes/current units/full placement witnesses checked; six incoming links repaired; registration sets equal code; protected knowledge-registry bytes equal HEAD.
- The original `late-areas/scan-legacy-drift.mjs` was executed in scratch with only its import, repository-root and output plumbing redirected. Scanner source hash and transformations are recorded. No baseline scanner output was overwritten. All four sources have zero missing current units and zero missing changed units. Other areas' scan gaps are not claimed fixed.
- Focused `test/docs/decisions-corpus-retired.test.mjs`: **7/7 pass**, using the activated release host and `CLAUDE_CODE_SESSION_ID` unset. This tests the retained corpus, not a cutover.
- Focused `test/scripts/generate-doc-inventory.test.mjs`: **timed out after 120 seconds** during native fixture/toolchain preparation; build output was produced but no completed test verdict. Not counted as green. See [log](inventory-test.log).
- `git diff --check`: pass. No broad suite, Cargo workspace suite, setup/doctor/lifecycle action, or fgOS CLI against this repository was run. Fixture git writes were confined to the permitted `/tmp` test roots. The attempted inventory test also populated ignored native build caches through its existing helper; no tracked out-of-scope file changed.
- Impact-analysis was not queried: the brief prohibits fgOS CLI calls against this repository, and no GitNexus tool is exposed in this worker. This is documentation/artifact work, not product-symbol editing; no blast-radius proof is claimed.

`contracts/knowledge-registry.md` is untouched relative to this follow-up's HEAD (SHA-256 `bd3c632640e5f26b23bdc84af29d44a6d564b6e6cbc84d4f7f140250e9379238`; its older author-pin hash was `5131101af68485a6775a11f437e878612675541fddecba082e48afbc740ee630`). No additional writable paths are requested. Independent review, cross-owner frozen-register projections and any gate/cutover acceptance remain with their owners.

The render/rebind scripts are authoring provenance, not the verification entry point. The carrier renderer is deliberately one-shot; use the two read-only replay commands above. No preview service was started under this restricted write scope.
