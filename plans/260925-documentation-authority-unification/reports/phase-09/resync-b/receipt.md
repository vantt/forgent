# Remaining documentation drift resynchronization

Status: authoring complete; independent review pending. **No authority cutover, gate acceptance, source retirement, pair accounting or approval carry.**

D7b follow-up: [current delta receipt](review-fixes/receipt.md), [current proof](review-fixes/verification.json) and `ledger/decisions/s15-navigation-review-fixes.json` supersede this receipt's old target-byte claims for component-boundary/reading-map. Existing scan, verification and one-shot authoring artifacts remain dated evidence, not current acceptance; use `review-fixes/verify-d7b.py` for the corrected bytes.

Read first: `docs/specs/reading-map.md`, the affected legacy area specs, then `w2-d7-brief.md`, `preflip-execution-plan.md`, owner/review notes and the D1b/D6 receipts. This is documentation conservation and disposition, not a new product mechanism.

## Result and evidence

| Check | Result | Owning evidence |
|---|---|---|
| Owning drift scanner, current bytes | All 33 files: zero missing current units and zero missing changed units; all four D1b sources remain zero | `legacy-drift.json`, `scan-provenance.json` |
| Original 594 missing-unit identities | All resolved: 33 exact-digest results, 561 explicit adapted/disposition results | `baseline-resolution.json` |
| New source bindings | 577 across 28 sources; includes 15 placements invalidated by this turn, not in the original missing list | `ledger/decisions/s14-resync-b.json` |
| Current target refresh | 1,069 additive overlays; 71 older stale records resolved through D6 overlays or the now-materialized conditional credential-store target | Same shard; `verification.json` |
| Independent hash encoding | 1,646 bindings recomputed in Python | `independent-hash-check.json` |
| Literal retired-engine files used as witnesses | All 13 are byte-identical to the starting HEAD | `verification.json` |
| Newly introduced Markdown destinations/fragments | All six resolve | `verification.json` |
| Candidate metadata/link delta | No new findings; one pre-existing reading-map switchboard route conflict remains | `verification.json` |
| Candidate-status owning test | 11/11 pass | `test-results.json`, `candidate-status-test.log` |
| Anchor owning test | 3/3 pass | `test-results.json`, `anchors-test.log` |
| Whitespace | `git diff --check` passes | `receipt.json` |

Paths in the table are relative to this directory except `ledger/decisions/s14-resync-b.json`, relative to the plan root. The scanner's `allCurrentUnitsCarried` means **accounted under its matching rules**: explicit dispositions are not proof of literal carriage or normative acceptance.

## Physical changes and single holders

- **Confinement:** current `credentialStore` setup/login/trust and full §13.1 invocation/history are held in the live spec; the previous duplicate history recipe now links there. Contract, decision history and home-lifetime prose follow attempt-owned private homes and adopt-only cleanup, not the removed pane-binding/reaper mechanism. Existing actual adapter loci and completed live-migration corrections remain intact.
- **Platform foundations:** restore source metadata, introduction, triggers, data dictionary, operations and access into the candidate projection. Keep the existing Business Rules and decision-history holders; locked RUL lines are unchanged.
- **Reading map:** merge current hot-lock/session/identity, Workflow/admission, Seat Binding, mailbox, terminal, Git, YAML/config, process/supervisor and test-governance entries into section 5. Preserve the transition prefix and both compounding-to-knowledge entries. No second product map or invented authority.
- **System overview/component boundary:** carry the Workflow area entry; route end-user authoring/index to complete knowledge-registry sections with real fragments. Replace remaining old Workflow-spec links with the component spec. Existing root README routing needs no additional edit.
- **Seat Binding/Workflow:** candidate H1/header now precede the complete fenced legacy YAML. Original metadata is provenance, not active `coverage: full-target` authority.
- **Knowledge registry:** remove only the duplicate `Document type: Contract`; keep both complete end-user contract sections.
- **Coordination decision index:** include V-013 alongside V-001–V-012; the Agent Mailbox exception is explicitly narrow and not a revived coordination engine.

Dashboard, Observe, proposal, domainization, system-architecture and other coordination units already present in normalized/current or literal-history holders receive explicit conservation witnesses; no redundant second holder is added.

## Historical and adapted-unit adjudication

The new shard retains every source passage and source ancestry, current target anchor/digest/self-inclusive ancestry, placement and four-key binding hash. Prior shards are unchanged. New rows are `reviewStatus: pending`.

- **367** units are already fully contained in literal retired-engine snapshots; verifier checks complete normalized content containment and unchanged file bytes.
- **169** are equivalent current content; **4** are complete source content inside candidate envelopes; **10** have candidate/source metadata adaptations (including the following three corrected by D7b).
- **3 pre-retirement migration banners, not carried:** the contracts README, coordination-session and flow-definition banners were introduced by `9818f25a8` (2026-09-19), before retirement `2180b4e72` (2026-10-02). Like rows 36/66/89/319, these are `candidate-metadata-adaptation`, not post-retirement edits. They point at the retired contract family and establish no still-live normative claim. Their retirement statements remain **disposition witnesses**, not claimed literal copies.
- **1 historical link adaptation:** coordination-session's schema paragraph predates retirement (`f9c98501c`, 2026-09-04, versus retirement `2180b4e72`, 2026-10-02). The snapshot already preserves the entire paragraph with the missing historical module displayed as a path and explicitly qualified. Do not classify it as new engine functionality, recreate the module, or edit the literal fence.
- **1 live-successor post-retirement edit:** raw `dispatch execute` removal (`15c7e720c`, 2026-10-14) is already recorded in the live advisory companion's *Upstream Execution Door Transition*. Preserve its `fgos run` replacement there; do not reactivate or rewrite the historical manual prompt.
- Remaining **25** units have explicit, individually authored decisions in `adjudications.json`: dated audit framing, existing code-backed truth/relocation corrections, V-013, complete successor contract links and reading-map/system-overview unions. They are **not** accepted merely because a similarity score found a target.

Examples of preserved truth corrections: actual executor resolver names, current Workflow/Unit doors rather than removed coordination verbs, actual adapter locus values, dashboard default port 4170 and PATCH work-edit route, Observe ping/migrate commands and moved archive/knowledge references. No stale legacy claim overrides these existing independently evidenced corrections.

Prior art: `056dac663` removes the confinement pane/reaper ownership; `dcb0e9d7c`/`38bd4b6f6` carry credentialStore; `6b8d84f9e` records prior candidate corrections; `9134ff4e5`/`eefe3c4e7`/`96a13ab21` establish coordination retirement/liveness/advisory boundaries; `8997f7709` establishes V-013. Reused the owning D6 scanner, D1b binding recipe, existing inventory extractor/anchor checker and D6 disposable-test harness; did not introduce production tooling or a second authority mechanism.

## Reproduce without writing repository state

From the worktree root:

```sh
node plans/260925-documentation-authority-unification/reports/phase-09/resync-b/replay-scan.mjs --check
node plans/260925-documentation-authority-unification/reports/phase-09/resync-b/verify-resync.mjs --scan
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/resync-b/independent-hash-check.py
git diff --check
```

The scanner replay changes only import/root/output plumbing in a scratch copy of the **unchanged owning scanner**; `--check` compares the regenerated JSON with the checked-in receipt without rewriting it. Authoring helpers (`map-units.mjs`, `prepare-bindings.mjs`, `publish-bindings.mjs`) are one-shot proposal/publication provenance, not verification commands; proposals live under `/tmp/fgos-work/w2-d7/` and must not be regenerated from the settled scan and mistaken for the original input.

The two unchanged owning tests ran separately through `late-areas/replay-checks.py`, in `/tmp/fgos-work/w2-d7-focused/checkout`, with the shipped addon descriptor and digest-verified activated addon. Exact commands, release path, output hashes and limitations are recorded in `test-results.json`; repository copies of complete output are alongside it. Fixture-only Git writes occurred in scratch, never in this checkout. No test/source bypass, native rebuild or Rust-freshness claim.

## Scope, qualifications and handoff

- Starting HEAD: `6d275ad81897089d5cac63f4ffc0311447a1c0a7`. Original D6 scan HEAD: `7be0cbc52b872b2eae12f3bbba4a1a346754838f`. All 33 legacy source byte digests are identical across those inputs and the replay.
- No edits to legacy sources, retired-engine files, existing ledger shards, owner answers, progress, gate status, switchboard, D1b product areas or production code. Seat Binding/Workflow and knowledge-registry edits use the run's explicit supplemental scope.
- No repository Git write, fgOS/lifecycle command, broad test, secret/config inspection or activation change. The release-pointer read and atomic outbox writes are the explicit run exceptions. No additional config, dependency or installation contract is introduced.
- `needsWrites: []`. The existing `docs/reading-map.md` duplicate switchboard route is reported, not silently repaired; that lead-owned routing issue predates this work and remains outside this assignment. This receipt makes no claim that all cutover gates are clear.
- `impact-analysis: not queried` because this run forbids fgOS CLI and exposes no impact-analysis tool; no production function/class/method was edited. Static evidence, owning tests and explicit doc/binding checks are provided instead.
- Broad Node/Rust suites were not run, as forbidden. Independent review must examine the semantic dispositions and overlays before any acceptance or cutover.
