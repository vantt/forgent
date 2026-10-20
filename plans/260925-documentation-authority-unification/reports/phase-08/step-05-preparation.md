# Step 5 behavioral-consumer preparation

Preparation refreshed at `fd126f0c853f320e476b648fe50ac9b4e2256d6c` (L12-66); original proof receipts remain at `3d599d4498b22842399b0fe59b4e88d1ffcfd0df`. Steps 3/4 remain closed under L12-56/L12-64. No consumer edit, authority flip, generator execution, gateway process, cargo or full-suite acceptance. Read the phase file's shared boundaries, Steps 5–7 and review map first; A45, A51, L12-7/14/21–64 govern this packet. Author receipts require Lead-started independent review.

## Population and units

The frozen class 4/5/6 inputs have 3,334 / 1,379 / 494 literal edges, 225 / 712 / 490 file memberships and 3,542 / 25,339 / 10,980 dynamic sites. Union the files, not the class totals: classes overlap. The prepared union contains **1,447 file/carry records, 5,312 distinct literal references, 227 Step 4 exclusions and 39,861 dynamic sites**, plus **201 original dynamic carry rows** (29 Step 2, 172 Step 2b). Carry records include composite/external population locators: the 1,447 is a conservative queue, not a claim that all are concrete readable source files or behavioral dependencies.

| Seam | Primary files/locators | File memberships incl. cross-seam sites | References | Step 4 exclusion joins | Dynamic superset | Writer/default hints | Old dynamic carry rows |
|---|---:|---:|---:|---:|---:|---:|---:|
| gateway-contract | 2 | 2 | 40 | 18 | 129 | 62 | 1 |
| cli-help-messages | 2 | 3 | 31 | 35 | 70 | 24 | 0 |
| setup-doctor-roots | 26 | 26 | 69 | 0 | 1818 | 688 | 7 |
| generators-projections | 227 | 227 | 368 | 59 | 3622 | 1475 | 137 |
| real-file-tests-goldens | 704 | 704 | 1203 | 0 | 25007 | 0 | 3 |
| ui-spec-compiler | 25 | 25 | 33 | 0 | 381 | 114 | 21 |
| citation-ratchet-roots | 10 | 10 | 1280 | 2 | 468 | 55 | 7 |
| runtime-defaults-dynamic | 451 | 451 | 2288 | 113 | 8366 | 4033 | 25 |

`step-05-population-summary.json` pins each census and all 33 Step 4 record files by bytes/hash. `step-05-population-files.jsonl` enumerates every file, its census hashes, present hash and drift flag; `step-05-population-references.jsonl` enumerates every literal and original id/span, including excluded reasons; `step-05-population-dynamic.jsonl` retains every call-site tuple and its class origin. `step-05-dynamic-carries.jsonl` preserves all old unresolved ids/reasons without declaring that an old question supersedes a later settled Step 3/4 disposition. `step-05-prior-disposition-joins.jsonl` points to each canonical Step 3/4 record, its digest and disposition counts; the original record remains the per-edge authority.

Deduplication: literal = file + full physical spans + matched expression. Dynamic = file + first six call-site columns (coordinates/expression/construction kind), retaining every inventory/role origin. An excluded entry first joins file/inventory/edge id; unmatched entries are admitted with original spans. All 227 exclusion origins are retained, even when multiple origins join one reference. Primary file ownership is exclusive; `bin/fgos.mjs` has reference/call-site memberships in CLI and runtime seams. Totals for file memberships therefore exceed primary files. Routing is mechanical and advisory: broad generator and runtime buckets contain prose, examples, comments and untraced calls requiring author admission. No role hint is a semantic verdict, and no census action is an approved patch.

## Dynamic superset and blocking ownership

The 39,861 call sites intentionally include unrelated path operations and templates with no nearby doc cue. Preserve them as a superset. For each site the author records the caller, source pin/passage, inputs, concrete destination/scan-root set or a bounded construction rule, reader/writer/default role, state/export dependency and a reasoned unrelated/fixture/history rejection when applicable. A caller-supplied path is not resolved by string replacement. A changed current hash invalidates affected traces/receipts. No writer adopts an alias as its destination.

The per-seam dynamic and writer/default-hint counts above are queues, not proven writer counts. Fixture-labelled sites still require fixture-provenance evidence. Untraced writers block only the seam/file batch which changes that construction; unrelated seam work continues. The exact site list, rather than a sampled count, defines remaining trace work.

- Gateway: `gateway.rs::get_contract` and `mcp.rs::search_contract` share the contract file. Their unrelated temp/test/config constructions must be rejected with witnesses before shrinking the queue. File parity below discharges the known file comparison only.
- CLI/runtime: `cli-015..028` retain state/caller-derived `docPath`, `currentPath`, context/artifact/target/plan paths and quadrant enumeration. `cli-022` is a concrete write call site with an unresolved target population. These block the affected document/knowledge mutation and runtime-default batches, not a separately traced help-string change. Never bypass the current-path mutation refusal.
- Setup/doctor: `setup-032..036/038` depend on aliases, current document paths, recursive docs scanning, capture paths and live registry population. These block registry/default-root changes pending a separately authorized bounded export. No live state read occurs here.
- Generators/projections: `instructions-058` requires state-backed decision evidence; `instructions-067..081` cover effective-set, destination and ledger reads/writes (including external/nondefault outputs). Together with generated decision-index rows, registry `sourceCaptureIds` and `purposeTitle` data they require bounded source-state/export provenance before output parity is claimed. Regeneration alone does not correct legacy path text persisted in source records.
- UI compiler: `survey-ui-spec` and the UI-skill construction rows block any root rewrite until explicit `--root`, cwd discovery, schema/config and emitted outputs are traced. `docs/ui-spec` is retained under L12-21/26; no blanket migration to its candidate mirror.
- Checker roots: `survey-default-root` and citation-format line 96 join default flags and recursive/wide scan populations. Baselines/checkers remain frozen in this turn; a narrower root may not manufacture green.
- Tests: survey-test-readers, retired-corpus and dead-vocabulary carries require exact real-file versus synthetic/recorded-fixture classification. P7-DOC-GAP-05 remains a Phase 9 pre-landing blocker.
- `external-state` and `inventory-dynamic` are cross-seam parks: no secrets, ignored instruction files or live state is read. The old 2.61 GB/125-part inventory requires a bounded consumer-edge export through its existing loader, not whole-file loading here. Keep dependent registry/runtime receipts pending; do not block file-only gateway comparison.

## Gateway file facts and current response behavior

Both `docs/contracts/fgos-gateway-api-v1.yaml` and `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml` are **34,956 bytes**, SHA-256 **`9f200578ea39b4b465fcdccdc76d842ab31ac85079bfba6eca90b97ff077c09f`**. YAML parsing confirms identical complete parsed objects, operation method/path/id sets (**21**) and schema names/bodies (**7**). Sorted sets and canonical parsed/schema hashes are in `step-05-gateway-file-parity.json`. YAML comments are excluded by parsing; raw hashes independently cover them. This comparison is green; it is not HTTP execution proof.

Static source: `gateway.rs:1186–1200` reads the current file fresh on each request, returns 200 with `application/yaml` and verbatim UTF-8 contents. Failure calls `GatewayError::unexpected`; the existing category table/IntoResponse produce 500 and JSON `{category,message,exitCode}`. The message contains the actual path and OS error, so changing the path changes the missing-file message: the receipt must compare the exact old/new message and list the intentional path substitution, not claim byte-identical error strings. Confirm the response content type and body at runtime in later proof. `/v1/contract` remains exempt from token authentication. No fallback or embed path is added.

`mcp.rs:126–132` reads the same path and parses YAML before operation filtering; co-cut it with HTTP so search and GET do not disagree. Its read/parse errors also embed the path. A45 keeps Gateway CTR010 and confinement CTR011 in candidate registry ownership; legacy `docs/architecture-map.md` lines 328/338/372 and its associated registry patch stay in the Phase 9 cutover packet. No shipped contract renumbering occurs here. The current `docs/contracts` root is retained: if the final owner packet retains this read, disposition it preserve with evidence rather than forcing a migration.

## Proof executed and limits

- `node scripts/check-legacy-docs-ratchet.mjs`: exit 0; 996 legacy files, 28 accounted edits, two accounted new files.
- `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/check-legacy-docs-ratchet.test.mjs`: exit 0, 28/28.
- `env -u CLAUDE_CODE_SESSION_ID node --test test/docs/rul11-anchor-phrase.test.mjs test/docs/decisions-corpus-retired.test.mjs test/setup/instruction-registry.test.mjs test/scripts/check-decision-citation-drift.test.mjs`: exit 0, **84/84**, no failures/skips. See `step-05-proof-tests.log`. These prove current roots, not candidate cutover readiness.
- Unchanged Step 4 checker: refreshed `step-04-l12-62-check-result.json` reports **890 slots: 609 preserve, 59 patch, 177 render-join, 45 parked**, no open Lead-ruling slots; exit **1**, **18 preserved-tree-history failures**. Diagnostic `step-00-l12-65-step4-witness-diagnostic.json` compares each failed witness: all pinned tree/state fields agree; differing fields come from unpinned `git log --all` history. Keep the real red receipt; no checker or record refresh is silently authorized. Step 7 final assembly/Lead owns witness reconciliation. This does not undo the historical L12-64 acceptance or establish a new green checkpoint.

Templates, actual existing test targets, patch shape and review sizing follow in `step-05-authoring-request.md` and `step-05-parity-receipt-template.json`. Missing proof remains missing. All full-suite, cargo, generator determinism, installed parity, evidence verifier and lease proof are later authorized work. Step 6 manifest/verifier and Step 6b lease remain separate dependencies; Step 7 cannot claim atomic readiness from this packet.


## L12-66 merge population delta

Main merge `fd126f0c8` changes no production behavioral source. One existing generated output in the queue changes: `docs/decisions/index.md` gains the D-ADR0072 row and its `docs/specs/seat-binding.md` reference. The supplemental occurrence is pinned to the merge, not added to a frozen census. Queue now: **1,447 file/carry records, 5,312 references (+1), 227 exclusion origins, 39,861 dynamic sites, 201 original dynamic carries, 29 admission parts**. Existing census spans keep their original source pins; generated-index source-state and generator parity still need deep read, including the new row. Seat Binding is approved but not implemented, so it introduces no executable consumer to this merge. Preserve the Phase 9 candidate carry before deleting legacy roots.

`step-05-l12-66-population-delta.json` records all 24 merge paths, the generated-index hash/bytes before and after, the new occurrence and before/after counts. Summary and admission hashes reflect this input; 145 Step 4 prior-record join digests are refreshed for witness-only changes with dispositions unchanged. Gateway current/candidate proof and original suite receipts are historical and are not rerun or upgraded by this data refresh.
