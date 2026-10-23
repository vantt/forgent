# Late Area And End-user Contract Carriage — Doer Receipt

Status: **Authored and locally verified; independent review pending. No gate acceptance, promotion or cutover.**

Author: `fgos-run_unit-run-17927628380ac6`  
Source/author pin: `282afe45e67a3d8719614e338c55cab86ec41347`  
Authority: [D6 brief](../w2-d6-brief.md), [L13-4](../owner-answers.md#l13-4-late-legacy-areas-and-the-four-holder-blockers-lead-under-a42-2026-10-23-2045).

## Read First

- [Machine receipt](receipt.json): paths, hashes, counts, checks and limitations.
- [Carriage inventory and all link-destination edits](carriage.json).
- [Additive conservation shard](../../../ledger/decisions/s12-late-areas.json).
- [Legacy drift scan](legacy-drift.json): both historical windows, every source unit and unproven carriage.
- [Binding refresh](binding-refresh.json): 70 exact old/current placement overlays.

## Delivered

| Source | Candidate holder | Native source units |
| --- | --- | ---: |
| `docs/specs/seat-binding.md` | `docs/platform/seat-binding/spec.md` | 99 |
| `docs/specs/workflow.md` | `docs/platform/workflow/spec.md` | 147 |
| `docs/specs/enduser-docs-authoring.md` | `docs/platform/work-state/contracts/knowledge-registry.md` (new authoring section) | 20 |
| `docs/specs/enduser-docs-index.md` | Same registry contract (new index section) | 29 |
| **Total** | | **295** |

The two area specs retain source front matter, titles, full prose, rules, decisions, errata, examples and dated implementation pointers. A `txt` candidate metadata header follows each H1. Only enumerated markdown-link destinations change: relative rebases and explicit candidate successors replace links into the retiring specs tree. Every new relative link resolves.

The end-user contracts retain every source paragraph and their original metadata. Their headings are deepened one level; original YAML is fenced below each source title. The registry contract's existing prose is unchanged, including alias-write refusal and attestation constraints. A labelled boundary note prevents the preserved older producer vocabulary from overriding those constraints. The generator `src/report/enduser-index-generate.mjs` and doctor check/fix `enduser-docs-index-stale` in `src/setup/registrations.mjs` are explicitly named as code truth. No generator, registry or runtime behavior changes.

Only links in the **Seat Binding** and **Workflow** rows change in `component-boundary.md`; the Work and Execution Core rows remain untouched. The switchboard adds the two candidate areas and four explicit legacy-to-candidate successor mappings. Existing source statuses, unrelated routes and authority remain unchanged; `candidateSuccessor` records a future destination, not a current-authority flip. The existing Work-state candidate route already covers the registry holder.

## Conservation And Binding Refresh

The native extractor is reused from `scripts/generate-doc-inventory.mjs`; its heading digest includes the complete direct-section payload and following-block digest. This is not a title-only comparison.

- **295** current source bindings: **250** equal full native digests, **45** explicitly adapted digests (metadata, link destinations or heading depth).
- **286** native identity references retained only on matching source path, digest and unambiguous identity; no duplicate references.
- **9** explicit current-identity gaps, all newly changed Seat Binding units. They remain fully source/target bound; no identity was invented or written into an out-of-scope registry.
- All source bindings use the existing D1 `unitCarries` record convention, with `nativeClaimRef` where authenticated. `claims` and `registryGaps` stay empty: these are additive conservation records, not duplicate native disposition decisions or fabricated registry-gap decisions. `sourceFiles` records document carriage without overriding older file/corpus dispositions.
- **70** additive rebindings for existing target placements affected by the new registry header/synthetic anchor shift or the authorized component table links. `supersedesBinding` names the old shard, collection, index, anchor and digest. Old shards are unchanged and historical; Lead must join these overlays when assembling effective bindings. No prior approval carries.
- **0** pre-existing stale bindings found among the inspected existing placements in these two edited holders.

The recipe is taken from `step-08-preflip-gates.json#/changedBindings/11/bindingHashEncoding` (also repeated in four other register rows), **not** a nonexistent top-level field: SHA256 of sorted-key compact UTF-8 JSON plus exactly one LF, with only `targetOwner`, `targetAnchor`, `targetUnitDigest`, `targetAncestry`; missing ancestry is null. Independent Python serialization recomputed **365/365** hashes, covering the 295 source bindings and 70 rebindings.

Existing source text, D1's native extraction/placement witnesses and shipped-addon scratch-proof recipe were reused. No product mechanism or production symbol was introduced.

## Legacy Drift: Two Pins, No Silent Substitution

The brief names the L12-124/final-determinism pin as the inventory pin. That record actually pins the final source context:

- Final source pin **`5e03159334df726e43ffe9505ad4ed43f72ba94d`**: **3** legacy files changed through author HEAD (`distribution.md`, `reading-map.md`, `seat-binding.md`).
- Original Phase 2 registry inventory pin **`f0c76c5e590339d9c815038539ff1f4a072c64e4`**: **33** files changed, including late-added Workflow and Seat Binding.

The scanner's default mode rescans current HEAD; `--check` replays the saved source HEAD against current hashed candidates so an artifact-only runner commit does not invalidate reproduction. Both windows use history enumeration, not only net diff, across all three requested roots (`docs/specs`, `docs/architect`, `docs/decisions`). No `docs/decisions` file changed in the final-pin window; the original-inventory window includes its generated index. Source content is `HEAD:path`; candidate content is separately hashed working-tree bytes.

The scan reports candidate successors, exact native digest matches, separately labelled fresh adapted bindings, missing source passages and removed/replaced inventory units with remaining exact candidate occurrences. It finds **184 changed units in 26 files whose carriage is not proven** by this strict comparison. That is a conservative triage list, **not** a finding that 184 clauses were lost: older candidates can fence or adapt source metadata, headings and links without a fresh explicit binding. No semantic approval is inferred from equality either. Same-path generated-index retention is explicitly labelled, not a platform successor promotion.

The two late-area specs are fully accounted at their current bytes. Packaging and runner re-sync remain **D1b's**; other scan entries belong to Lead/the owning area. This batch repairs none of those other areas.

## Executed Proof

[Check commands and full outputs](check-results.json), [single-file test commands and logs](test-results.json), [author verification](verification.json).

| Check | Result |
| --- | --- |
| `node scripts/check-legacy-docs-ratchet.mjs` | exit 0; 997 files, 28 accounted edits, 3 accounted additions |
| Unchanged `test/scripts/check-doc-candidate-status.test.mjs` in scratch | **11/11**, exit 0 |
| Unchanged `test/scripts/list-doc-anchors.test.mjs` in scratch | **3/3**, exit 0 |
| Pure candidate metadata/status checker on all three changed/new spec/contract holders | **3 candidate, 0 findings** |
| `node scripts/list-doc-anchors.mjs --check` | all four source successor entry anchors resolve |
| `verify-late-areas.mjs` | exit 0; 295 source units, 70 rebindings, four successor routes and 30 relative links; complete prose reconstruction and unchanged registry prefix verified |
| `scan-legacy-drift.mjs --check` | exit 0; regeneration byte-identical |
| Independent Python binding serialization | 365/365 hashes equal |
| `git diff --check` | exit 0 |

Reproduce record verification without mutations:

```sh
node plans/260925-documentation-authority-unification/reports/phase-09/late-areas/verify-late-areas.mjs
node plans/260925-documentation-authority-unification/reports/phase-09/late-areas/scan-legacy-drift.mjs --check
```

For the two owning test files, read the authorized activation's `releasePath`, then choose a **new** scratch path:

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/late-areas/replay-checks.py \
  --release-path '<releasePath>' --scratch /tmp/fgos-work/w2-d6-checks-fresh
```

The script copies current source/tests, uses the existing shipped `native-addon.json` package descriptor and the actual digest-verified release addon/helper, and invokes each test individually with `env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=<releasePath>/bin/fgos node --test <file>`. HOME, TMPDIR and the existing production state-root convention are isolated under scratch with mode 0700. No production checks are disabled. Temporary fixture repositories use their existing git init/add calls; no git write occurs in the real checkout. This proves current Node behavior against the installed addon ABI, **not Rust working-tree freshness**.

### Disclosed Direct-Checker Attempt

An initial optional direct `node scripts/check-doc-candidate-status.mjs --json` attempt did **not** produce a verdict: it timed out after 60 seconds. Its existing `ensureScriptAddon` fallback unexpectedly built `fgos-node-addon` (Cargo reported success after 45.14 seconds) and enters checkout-local staging rather than using only `FGOS_HOST_BIN`. This was not anticipated; it can create ignored `target/` and `.fgos/runtime/git-addon/<checkout-hash>/` artifacts outside the intended writable surface. No forbidden runtime directory was subsequently inspected, modified or cleaned; their incidental artifact state is **not certified** by this receipt. No build/compiler result is counted as proof. All later checks avoided that door: the real new documents were checked through the pure checker, and the full owning tests ran in isolated scratch through the existing shipped descriptor.

## Boundaries And Handback

No deliberate fgOS CLI/lifecycle operation against this repository, git mutation/commit in this checkout, source deletion, baseline/checker weakening, main landing, activation, lease hold, secret read, owner-answer/progress/gate-status edit or pair accounting was performed. The automatic staging attempt above is explicitly disclosed, not hidden as a clean no-runtime-write claim.

`impact-analysis: degraded/unqueried` under the no-CLI boundary; no production symbol changed. Full `npm test`, `scripts/run-tests.mjs` and Cargo workspace tests were not run under the brief. Markdown preview is left to Lead: no extra service or out-of-scope preview artifacts were started. No new config, environment contract or infrastructure dependency was introduced into the product. These are candidate-document changes, not a user-visible runtime change requiring an out-of-scope changelog edit.

`needsWrites: []` for this scoped delivery. Lead owns independent review, native identity integration for the nine explicit current-identity gaps, effective-binding overlay assembly, final-pin drift replay and broader pre-flip acceptance.
