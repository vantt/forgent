# F binding, carry and ratchet refresh

Status: **blocked on three delta decisions; no delta decision authored**. The other records are authored, pending independent review. This is not an all-green receipt or cutover approval.

## Inputs and boundaries

- Working tree: `/home/vantt/projects/forgentX-p9-w1-d4`, input HEAD `30ae959eac6a4e4b255c0dd78c94042e1f4d60f9`.
- F: `eb161da46ee95c7082e6f7a80959c758da21c2f3`, importing main `947dc310396071a4d530216d5c06d05993d63bf5`.
- Authority: `owner-answers.md` L13-27 and L13-34; `w48-f-binding-refresh-brief.md`.
- All paths below are relative to `plans/260925-documentation-authority-unification/` unless shown otherwise. Let `R=plans/260925-documentation-authority-unification/reports/phase-09` for the commands below.
- No docs, fchain, preserve-premise, G9 records, pair-accounting lists, baseline, production code or Git state were edited. No lifecycle verbs, fgos CLI, full audit driver, native addons, npm test or test runner were invoked. Scratch was confined to exit-cleaned `TemporaryDirectory` instances under `/tmp/fgos-work/`.

## Reproduced population

The real `rebind/rebind.py --check` initially reported **27 unresolved rows**. Both embedded ownership recipes independently reproduced **50 raw / 23 accounted / 27 unaccounted** drift rows, zero native duplicates and zero new active pairs. Their libraries and ownership/audit scripts were materialized verbatim in temporary directories; `checks.mjs` and `phase-08/audit-report.py` were not run.

Evidence:
- `rebind/f-refresh-initial-proofs.json`: original five proof exits and diagnostics.
- `rebind/f-refresh-ownership-before.json`: both frozen script hashes, raw binding identities, partition and audit failures. This is a compact diagnostic projection, not the full ownership census; command stdout hashes are retained.

## Target edges and claim judgments

Appended **19 aggregate target edges**, records **155–173**, to `rebind/g0-rework-rebindings.json`. They cover all 27 rows; repeated references to the same target share an edge, not a native identity. Each edge has complete `affectedBindings`, per-row `bindingJudgments`, old/F witnesses and main provenance. Every new edge remains `authored-pending-independent-review`.

The `commit` column names a relevant main change, not an assertion that one commit made every byte of an aggregate edge. Each record also lists the complete imported non-merge path history in `mainPathChanges`, distinguishes the old binding witness from F, and states that attribution limit explicitly.

| Record | Target passage | Origin rows | Main change | Outcome |
| --- | --- | ---: | --- | --- |
| 155 | architecture-manifest file-block | 3 | `db00088c0` | rebind |
| 156 | component-boundary block 11 | 1 | `5820e1a43` | rebind |
| 157 | distribution block 14 | 1 | `8f366ccc3` | rebind |
| 158 | distribution block 5 | 3 | `ccc6b32e6` plus Config changes | rebind |
| 159 | confinement-authority block 147 → 150 | 2 | `ea7dc0509` plus earlier mask additions | unchanged complete paragraph |
| 160 | install how-to block 37 | 1 | `5820e1a43` | rebind |
| 161 | dispatch-module-boundaries block 3 | 1 | `5820e1a43` | rebind |
| 162 | runner block 101 | 3 | `5820e1a43` | 2 rebinds; `/registryGaps/29` needs delta |
| 163 | runner block 134 | 1 | `2f2a66503` | rebind; residual coverage unchanged |
| 164 | runner block 317 | 1 | `2f2a66503` | needs delta |
| 165 | runner block 322 | 1 | `5820e1a43` | needs delta |
| 166 | runner block 93 | 2 | `9fa4277c5`, `f2f8c3f59`, `2f2a66503` | rebind; existing partial residual unchanged |
| 167 | work-state footer 117 → 124 | 1 | `8c4d3280e`, `26c4e166f` | exact content/context rebind |
| 168 | work-state footer 121 → 128 | 1 | same | exact content/context rebind |
| 169 | work-state footer 126 → 133 | 1 | same | exact content/context rebind |
| 170 | work-state footer 138 → 145 | 1 | same | exact content/context rebind |
| 171 | work-state footer 144 → 151 | 1 | same | exact content/context rebind |
| 172 | work-state footer 150 → 157 | 1 | same | exact content/context rebind |
| 173 | work-state footer 174 → 181 | 1 | same | exact content/context rebind |

**24 effective successors** were added through the existing `supersedesBinding` door in `ledger/decisions/f-target-rebindings.json`. No predecessor, pilot record or old review was overwritten. Source identities and dispositions are unchanged. Current rationales distinguish old locators/reviews from current assertions; the two still-valid partial-carry rows retain the same residual bytes and qualify their historical target witness. No approval is inherited.

`rebind/f-refresh-analysis.json` contains all 27 exact old/F selected passages, neighbouring identity witnesses, before-row hashes, bindings and judgments. Repeated footers were matched by full content and distinct decision context, not by adding seven to an ordinal.

### Three unresolved rows — no digest-only shortcut

All are in `ledger/decisions/s9-runner-01.json`:

| Pointer | Existing premise | Evidence on F |
| --- | --- | --- |
| `/registryGaps/19` | Partial residual covers every replaced source line | Exact-line comparison now replaces lines 6 and 9; residual row 5 contains only line 9. Line 6's old wording **still survives as a prefix**, but now has a removal annotation. Changing that exact-line proof basis is not silently approved here. |
| `/registryGaps/22` | All 18 historical lines recur verbatim, additions only | Source line 16 changes inventory from `~/.fgos/config.json` to `~/.fgos/private/accounts.yaml`. The additive-only premise is false. |
| `/registryGaps/29` | Six absent historical lines are retained in residual row 13 | Config's rewritten source line 10 is additionally absent; the residual still covers only lines 2, 13, 18, 30, 47 and 49. |

`rebind/f-refresh-delta-needed.json` records the immutable source witnesses, exact missing-line sets before/F, complete newly replaced lines and substring qualification. These rows remain at their original bindings. The Lead must route the delta decisions/reviews; this turn did not change their disposition, residual or rationale.

## Carries

Refreshed through the existing generator and supersession recipe:

- **13 candidate carry bindings**: `s11-preflip-carries.json /unitCarries/{248,249,252,253,254,255,256,258,264,266,277,279,280}`. Their successors are appended at `carries-current-rebindings.json /bindingRefresh/25..37`. Original placement witnesses and the first 25 overlays are unchanged.
- **13 current source-parity rows**: indexes `301,304,305,308,309,310,323,337,338,340,342,343,344`.
- **6 live source-heading rows**: indexes `19,77,81,82,85,90`.
- Full before/after records and imported path commits: `carries/f-binding-refresh.json`. Historical rows remain in `previousParityRow`; changed wording is represented by exact reversible adaptations, not asserted equal.
- The historical generator now replays its original accounting against explicit last-verified witness `5a3f7580a`, then extends to live bytes using the existing dual extractor, locator, binding hash, placement and adaptation functions. This prevents a historical recipe's brittle source assumptions from being mistaken for F evidence. Both historical and live domains are checked; live mismatches are not waived by that pin.
- The Event Store registry paragraph's large rewrite is authenticated by its unique named subject, matching ancestry and unchanged bounding units; it is not selected by a new ordinal or a lowered similarity threshold.

The carries checker then exposed **six more unapplied pointer-patch drifts**, beyond the existing `bin/fgos.mjs` and `docs/backlog.md` duties. Added exact-path disclosures for `AGENTS.md`, the canonical/shared rendered executor-dispatch fallback files, gateway `gateway.rs`, and distribution `workspace.rs`, with main provenance. The F composition owner still owes recomposition and review. No patch preimage was replaced and no permission to apply was added. The owning falsification test now compares the complete actual drift set with the explicit duty set plus its fixture, rather than assuming there are forever two known duties.

Live carries proof: **1208 current ledger successors, 346 source units, 91 live headings, 321 direct section blocks**. These figures do not certify implementation truth or authority/cutover acceptance.

## Ratchet

Updated eight stale exact-digest exceptions and added one exact-path `allowed-edit` exception for distillery. Existing kinds, lifecycle controls and all unrelated exceptions are unchanged. The previous accounting projection remains addressable at the immutable input commit using the existing history-field format.

| Path under `docs/specs/` | Action | Main provenance examples |
| --- | --- | --- |
| confinement-authority.md | refresh digest | `ea7dc0509`, `b87a931aa`, socket/mailbox masks |
| distillery.md | add exact edit exception | `8c4d3280e` |
| distribution.md | refresh digest | `ccc6b32e6`, `5820e1a43`, `8f366ccc3` |
| observe.md | refresh new-file exception digest | `2f2a66503`, `87a7aa449`, `ad64cea01` |
| reading-map.md | refresh digest | `5820e1a43`, mailbox/Event Store documentation |
| runner.md | refresh digest | `9fa4277c5`, `f2f8c3f59`, `5820e1a43`, `2f2a66503` |
| seat-binding.md | refresh new-file exception digest | `67524cfe1`, `5820e1a43`, `2f2a66503` |
| work-state.md | refresh digest | `8c4d3280e`, `26c4e166f` |
| workflow.md | refresh new-file exception digest | `24d8816ba`, `2d33290ff` |

Exact old/F digests and every imported non-merge path commit are in `rebind/f-refresh-ratchet.json` and the existing-format `mainMergeAccounting.rows` in `scripts/check-legacy-docs-ratchet.exceptions.json`. Authorization is digest accounting under L13-34, explicitly not independent content approval. No rule/root/classification/baseline/deletion allowance was widened.

## Commands and exits

All Node proofs ran with `NODE_OPTIONS=--no-addons`; all Python invocations used `python3 -B`. Expanded argv, diagnostics and outputs are in `rebind/f-refresh-final-proofs.json`.

| Command | Initial exit | Final exit / meaning |
| --- | ---: | --- |
| `python3 -B "$R/rebind/rebind.py" --check` | 1 | **1** — exactly the three delta rows above remain |
| `node "$R/carries/verify-carries.mjs"` | 1 | **0** |
| `node scripts/check-legacy-docs-ratchet.mjs --json` | 1 | diagnostic enumeration of the nine original violations |
| `node scripts/check-legacy-docs-ratchet.mjs` | — | **0**, 997 files; 29 accounted edits, 3 accounted new files |
| `python3 -B "$R/g0rework/refresh-carries.py" --check` | 1 (source row 305) | **0**, deterministic historical/live replay |
| `python3 -B "$R/g0join/join.py" --pin HEAD` | 0 | **0**, committed input HEAD only: 1929/1929 approved effective rows |
| `python3 -B "$R/g0rework/refresh-carries.py"` | authoring attempts: 1 | **0**, 32 F changes; earlier correspondence/file-creation errors were fixed, not skipped |
| `python3 -B "$R/g0rework/test-live-parity.py"` | — | **0**, five real-checker refusals; each injected fault exits 1 as expected |
| `node <temp>/step10-round5/ownership.mjs --output-dir <temp>/step10-round5` | 0 | **0**, exact embedded script |
| `node <temp>/step10-round5/audit-ownership.mjs --output-dir <temp>/step10-round5` | 1 | **1**, three delta rows remain |
| `node <temp>/step10-sync4d/ownership.mjs --output-dir <temp>/step10-sync4d` | 0 | **0**, exact embedded script |
| `node <temp>/step10-sync4d/audit-ownership.mjs --output-dir <temp>/step10-sync4d` | 1 | **1**, three delta rows remain |
| `git diff --check` | 0 | **0** |
| Python stdlib safety assertions described in `rebind/f-refresh-safety.json` | — | **0**: 155 prior edges intact, complete affected sets, 24 pending successors, three untouched delta rows, 25 prior carry overlays intact, exact write scope |

The historical recipe was also replayed with read-only extractor input at `5a3f7580a` before extending it: exit **0**. Exploratory author runs that stopped on a missing historical target digest or a not-yet-created report were not counted as passing evidence.

Both live ownership recipes now report **50 raw / 47 accounted / 3 unaccounted**, still **zero native duplicates and zero new active pairs**. Their audit failures are retained, not pair-accounted away.

**Important:** `g0join --pin HEAD` reads committed ledger bytes. Its success does not approve the newly authored working-tree successors. Independent review is still owed for those rows and the 19 new edges; rerun the join at the subsequent committed/reviewed pin.

Impact-analysis is **degraded**: this session exposes no impact-analysis tool, and the assignment forbids querying fgos. Static caller inspection found the existing generator caller in `g0rework/verify.py`; the owning live-parity falsification proof was extended and run. No production symbol or public contract changed. No new config default, environment variable, infrastructure dependency or end-user feature was added.

## Handoff

The requested all-exit-0 proof set is **not met**: rebind and both embedded ownership audits correctly refuse the three unresolved claims. Continue with independent delta decisions for those exact rows, then review the pending refresh edges/successors and rerun the checks at the resulting committed pin. The eight pointer-patch duties separately remain with the F composition owner. No out-of-scope write is requested by this turn.
