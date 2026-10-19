# Step 3 wave 1 round 3 review, part p01

Pin `ae141550c`, worktree `471966e9e`. I did not run the checker or any probe. I read the whole source at the pin (184 lines, 35 359 bytes, all edge regions) and extracted the record `batch-002.jsonl:4` by python field (98 edges: 89 inventory, 9 added). I applied the 74-line diff to the source and compared it word by word. I extracted the pin's `docs` trees into scratch to read targets. I also ran my own scan of the source for legacy roots, retiring basenames, backticked directory forms and tree-relative forms.

## Verdict

| File | Set | Edges | Verdict |
|---|---|---:|---|
| `docs/reading-map.md` | batch-002 | 98 (28 patch, 34 preserve, 28 parked, 8 row-flip) | **ok** |

Per-set count: batch-002, 1 file reviewed, 0 rework. Outcome defects: 0.

## Prior defects (x-p02), all confirmed fixed

- **Missed `contracts/` (L163 C198).** It is now the added edge `author-wave1-r3-reading-map-L163C198`, parked as description-rewrite with the same disposition as `08018` and the three added siblings (README.md, coordination-session.md, flow-definition.md). It sits in `legacyScan.candidates` and `authorAddedEdgeIds`. The diff is unchanged because it is a park.
- **08020 unit split (L164).** `08020` now parks as description-rewrite with the whole L164 item (`08019` plus five added edges). The diff has no L164 hunk. Changed lines are exactly 141, 145, 148, 149, 150, 154, 155, 158, 159, 161, 162, 165-171, 175-178, 180 and 183, and each maps to a patch edge.
- **07977 stale label.** It parks as description-rewrite: the label `§Dev checkout shell helpers` beside heading "3.3 Dev Checkout Channel". There is no L142 hunk.
- **08030 anchor.** It is now `#triage-verb`. `work-state/spec.md` has `### Triage Verb` at line 958, and line 47 states the impact-ranking claim.
- **Status rows (L12-35(2)).** `coverage.statusRowFlips` binds both complete pathless status sentences: L23-24 "The legacy source remains retained for provenance until consumer cutover." and L128-129 "The retained legacy map remains a provenance pointer until consumer cutover; ...". Each has a Phase 9 replacement. The row flips at L36, L81-84 and L135 are intact, and retained paths stay literal.

## Checks that held

- **Source-computed units.** Mixed-disposition units are L131, L143, L144, L145, L157, L159 and L180. Each differing edge carries a `Distinct claim:` reason. The retained-root and retained-document preserves (`docs/platform-foundations.md`, `docs/architecture-manifest.json`, `docs/decisions/`, `docs/backlog.md`, the four user roots, the rubric and how-to) stay literal whatever happens to the sibling spec pointer. That is a real distinct claim. L164 and L163 each wait whole. L135 (`07969`/`07970`) flips as one row.
- **Directory and relative scan.** My scan found no uncovered legacy reference. The remaining hits are retained or candidate paths (`docs/platform/**` README and spec, `component-boundary.md`, `vision.md`, `platform-foundations.md`, `architecture-map.md` which is the retained root), skill and src paths, and `packages/.../contracts/`. The excluded contextual candidates (L61 `vision.md` and `platform-foundations.md`, L141 repository `README.md`) are true exclusions.
- **Related header.** L16 preserves (retained root). L19 `07953` parks as duplicate of the consumer. L124 `07963` preserves as lineage, and its successor note does not name the edge's own path.
- **Existence facts.** I confirmed every preserved retained path exists at the pin. `git rev-list` shows `docs/history/phase-3-compound-learning` (and its `reports/f4-benchmark.md`) and `docs/user/tutorials` have no history in the pin's ancestry, so "never existed" for `08037`/`08038` is true. `docs/tutorials/` exists with `.gitkeep`. `docs/knowledge/decisions-index/decision-record.md` (the `07982` note) exists.
- **Park facts (L163/L164).** `legacy-cli-transition.md`, `external-provider-protocol.md`, `node-to-rust-migration.md` and `provider-routing.md` exist under `docs/platform/host-invocation-routing/architecture/`. No file named `rust-cli-and-proof-components-plan.md` exists under `docs/platform`. `coordination-session.md` and `flow-definition.md` exist live only under `agent-coordination/history/retired-engine/files/contracts/`. Port 4170 appears in `herdr-web-dashboard/spec.md` lines 81 and 241, so the 8788 description parks correctly.
- **Patch targets and anchors.**
  - `cli-io-contract.md` exists in `work-state/contracts/`, so `07992`/`07993` resolve.
  - `work-state/spec.md` has RUL60 (line 1089) and RUL45 (line 1077) under §11, so `#11-business-rules` holds for `07994`/`08031`.
  - The runner subcomponent anchors `#business-rules` hold for `08008`, `08009`, `08016`, `08017`.
  - The whole-file area pointers exist: `runner`, `claude-plugin`, `agent-confinement`, `observe`, `decision-citation-drift`.
- **Description truth on patches.**
  - `08011`: `agent-confinement/spec.md` line 34 says "8 falsification probes"; `confinement-attestation.v1` is at line 564.
  - `07996`: the plugin row claims no counts in the target.
  - `07985`: the target states the scan scope `docs/backlog.md` + `docs/specs/*.md`.
  - `07976`: the packaging spec states the `fgos`/`fgos-runner` GitHub install as a legacy channel, so the claim is still true.

## Record-text notes (not rework)

- `08034` (L180) `unitDispositionReason` is copy-pasted from `08011` ("§13.1 recipe lacks a live holder"). It is irrelevant to `docs/specs/observe.md`. The real distinct claim is retained-root preserves vs the spec patch.
- `08019` (and the five added L164 edges) `blockedReason`/`dependency` say `host-invocation-provider-routing.md` "became" `architecture/provider-routing.md`, while the `reason` says "was split ... and other holders" (provider-routing.md is 4.7 KB against 22.9 KB). The categories agree, so this is wording only.
- `07953` `blockedReason` still hedges "is the consumer itself or already listed". It is the consumer itself.
- `08018` and added siblings: "README ... exist only in the retired-engine source payload" is ambiguous. `docs/platform/agent-coordination/README.md` exists live as the area portal. The architect README itself is carried in the retired-engine payload.
- `07958` reason carries a sentence about the "stale absence description in the whole migration status unit" (copied from the L81 unit). It applies to the `docs/tutorials/` row text only.
- `07985` `Distinct claim:` text ("the sibling runtime default/allowlist has a separate Step 5 parity obligation") is accurate in outcome (the patched target still states the same scan scope) but is the weakest of the distinct claims.

## Lead-judgment questions

1. **Pathless transition sentences.** L78 ("During migration, the existing roots remain active") is not listed as a `statusRowFlips` span. Its flip is carried only through the replacement wording of `07958`-`07961`, whose spans are the four code-fence lines. L89-94 ("The target structure is being introduced incrementally ... A target document marked partial or candidate does not outrank a declared legacy/current source ...") and L29-31 are migration-subject sentences with no path token. L12-35(2) covers "rows/sentences" where the migration itself is the subject; the request names two pathless flips for this file. Decide whether L78 and L89-94 need their own `statusRowFlips` entries or stay with the Phase 9 cutover packet.
2. **Replacement text names a retiring path.** Both `statusRowFlips` replacements say "the former docs/specs/reading-map.md source is retired at cutover and remains dated provenance in Git history". This puts a retiring literal path into live prose. It reads as dated provenance, so I judged it acceptable. Confirm.
3. **07985 vs 07984 (L145).** The citation patches while the scan-scope sentence parks on Step 5 parity. The patched target still states `docs/specs/*.md`, so the description is true against it. I kept the split as a real distinct claim, in contrast to `08020`, where the description was false against the target.

Status: DONE_WITH_CONCERNS
Summary: docs/reading-map.md (98 edges) is ok with no outcome defects: the missed `contracts/` reference, the 08020 unit split, the 07977 stale label and the 08030 anchor are all fixed and verified against the pin. Three Lead questions remain, mainly whether the pathless L78 and L89-94 transition sentences need their own statusRowFlips entries.
