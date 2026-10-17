# Private fresh-reader key — unsealed

Author session: `codex-session:fgos-run_unit-run-17922255a98df5@2026-10-17`.

Status: prepared for distinct A38 key review; **NO SEAL**, no reader started.
Answer as the candidate corpus will read after cutover; legacy may be cited as
provenance, never as owner. Readers start at `docs/platform/README.md`.
Cutover does not accept a draft, erase uncertainty or certify implementation.
Do not expose this key, gap map, proof, or request to readers.

## Common evidence and scoring

The six questions are the acceptance test at
`docs/platform/platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi`.
A correct answer identifies an owner/obligation, gives a real supporting candidate
anchor and applies it to the proposal. Merely naming a file is insufficient.
Use yes / partial / no; **partial scores zero**. Each reader needs at least 5/6
in EACH scenario, zero fabricated anchors, zero forbidden reads, zero legacy-owner
answers, at most eight files over the whole run, and all three authoring probes
correct. No averaging across readers or scenarios. A source/test named by an
allowed doc can be identified without opening it; claiming to have verified its
contents or executed it fails the proof distinction. Cross-answer evidence may
support another cell if explicitly cross-referenced, never by scorer inference.

Equivalent anchors within the same eight files are acceptable only when their
content supplies the same required distinctions. The listed anchors are sufficient,
not a demand for exact wording. A qualitative high risk rating with concrete
mechanisms is acceptable; the corpus has no universal numeric rubric. Missing
routes, unresolved claims and draft status are findings, never facts to invent.

Every A7/B7/C7 must include the baseline in
`docs/platform/governance.md#5-metadata`: Document type, Audience, Purpose, Design
status, Implementation, Provenance, Writer type, Canonical for, Use this when,
Do not use this for, Last reviewed, Related. A single complete shared metadata
answer explicitly applied to all three probes is accepted. Normative claims need
implementation alignment (claim/status/evidence/gap); mark pending, not implemented.
Higher-risk owner/approval/supersession/evidence fields are appropriate; the corpus
labels them optional, so do not score them as universally required.
Body links must accompany metadata paths, with owner, consumers, contracts,
affected specs/laws and proof as applicable; see
`docs/platform/governance.md#11-linking-discipline`.

## A — Intended answers

| Cell | Required distinction and evidence |
|---|---|
| A1 | Portal area registry → holder-lock ownership/port → Process judge/control. `docs/platform/README.md#2-area-registry`; `docs/platform/holder-lock/spec.md#2-ownership-boundary`; `docs/platform/process/spec.md#3-facts-the-judge-table`. |
| A2 | Proposed behavior/contract change across two existing components. Holder-lock owns cold exclusion; Process owns facts/control, not the decision to reclaim. No TTL-based live-holder takeover. `docs/platform/holder-lock/spec.md#1-purpose`; `docs/platform/holder-lock/spec.md#2-ownership-boundary`; `docs/platform/process/spec.md#2-ownership-boundary`. |
| A3 | `holder-lock.port.v1` and predecessor-domain/registry obligations on lock caller ↔ lock port; Process judge vectors and signal-by-identity on control side. `docs/platform/holder-lock/spec.md#3-the-port`; `docs/platform/holder-lock/spec.md#8-the-predecessor-domain-rule`; `docs/platform/holder-lock/spec.md#16-related-files`; `docs/platform/process/spec.md#3-facts-the-judge-table`; `docs/platform/process/spec.md#4-control`. External package contracts are named, not opened. |
| A4 | High: unknown is held, not dead; PID reuse/namespaces and a live holder make takeover unsafe; bare-PID signalling creates an identity race. Diagnose using facts, let kernel exclusion decide. Platform limits must stay explicit. `docs/platform/process/spec.md#3-facts-the-judge-table`; `docs/platform/process/spec.md#4-control`; `docs/platform/process/spec.md#7-known-limits`; `docs/platform/holder-lock/spec.md#4-drivers-and-guarantee-levels`. |
| A5 | Reject the proposed shortcuts; any approved replacement needs shared judge vectors in Rust and Node (unreadable start time, missing PID, zombie, reused PID, namespaces), identity-safe control and real kernel/borrow/predecessor vectors, setup/doctor checks and full suite. Required, not run here. `docs/platform/process/spec.md#3-facts-the-judge-table`; `docs/platform/process/spec.md#4-control`; `docs/platform/holder-lock/spec.md#13-setup-doctor-and-activation`; `docs/platform/holder-lock/spec.md#15-lịch-sử-quyết-định`; `docs/platform/architecture-map.md#9-luật-vận-hành-bản-đồ`. |
| A6 | Keep each rule at its owner; record changed decision and evidence in the relevant decision history, update boundary or explicit no-change note, do not rewrite past rationale. `docs/platform/process/spec.md#8-lịch-sử-quyết-định`; `docs/platform/holder-lock/spec.md#15-lịch-sử-quyết-định`; `docs/platform/governance.md#4-authority-matrix`; `docs/platform/governance.md#11-linking-discipline`. |
| A7 | The invented claim is false under the current specified obligations. A proposed judge rule belongs with Process spec §3; cold-lock freedom remains holder-lock spec §§1–3. Keep the alternative proposed until reviewed; no caller-local authority or new registry contract id invented. Apply common metadata and links to both owners, existing port/judge contracts and test evidence; update boundary or no-change note. `docs/platform/process/spec.md#3-facts-the-judge-table`; `docs/platform/holder-lock/spec.md#3-the-port`; `docs/platform/governance.md#3-document-types`; `docs/platform/governance.md#5-metadata`; `docs/platform/governance.md#11-linking-discipline`. |

## B — Intended answers

| Cell | Required distinction and evidence |
|---|---|
| B1 | Portal → Event Store spec, foundations L3, holder-lock ordering. `docs/platform/README.md#2-area-registry`; `docs/platform/event-store/spec.md#3-ownership-boundary`; `docs/platform/platform-foundations.md#l3-luật-store-truth-ở-jsonl-db-là-view`; `docs/platform/holder-lock/spec.md#9-node-facade-and-lockscope`. |
| B2 | A durability/contract and locked-law proposal, not an implemented optimization. Event Store is draft v2 with owner signature pending and implementation not started; its proposed supersession leaves DB-as-view intact. `docs/platform/event-store/spec.md#event-store-component-specification` (header); `docs/platform/event-store/spec.md#26-decision-record`; `docs/platform/platform-foundations.md#2-authority`. |
| B3 | Store owns durability/envelope/registry/read boundary; consumer owns business gate and reducer; holder-lock owns lock primitive. Ack requires fsync. `event-seal` 58 cannot be acquired under `state` 60; append 70 can. `docs/platform/event-store/spec.md#3-ownership-boundary`; `docs/platform/event-store/spec.md#4-layering-and-locks`; `docs/platform/event-store/spec.md#6-envelope`; `docs/platform/event-store/spec.md#7-streams-scopes-and-refs`; `docs/platform/event-store/spec.md#17-node-to-rust-route-and-latency-budget`. No planned package contract file need be opened or treated as shipped. |
| B4 | High: acknowledged loss, deadlock/order violation, unrebuildable view; draft status is not law supersession or implementation. L3 requires threshold + superseding decision, never in-place rewrite. `docs/platform/event-store/spec.md#4-layering-and-locks`; `docs/platform/event-store/spec.md#23-proof-required-before-acceptance-of-the-implementation`; `docs/platform/event-store/spec.md#24-evidence-and-its-limits`; `docs/platform/platform-foundations.md#l3-luật-store-truth-ở-jsonl-db-là-view`. |
| B5 | Section 23 is the acceptance owner: real kill matrix, reader/seal model and stress, Work gate races, ordering/rebuild parity, real three-machine ref sharing, legacy/rollback parity, setup/doctor vectors, npm and cargo tests. Section 24 prototype evidence cannot substitute. Cite `docs/platform/event-store/spec.md#23-proof-required-before-acceptance-of-the-implementation` and `docs/platform/event-store/spec.md#24-evidence-and-its-limits`; naming at least crash, concurrency, replay and full-suite categories suffices, no claim of execution. |
| B6 | Preserve law and signed supersession history separately from draft spec and verification; reconcile affected owner documents and boundary after acceptance. No placeholder D-ID is a signed decision. `docs/platform/event-store/spec.md#26-decision-record`; `docs/platform/platform-foundations.md#2-authority`; `docs/platform/governance.md#4-authority-matrix`; `docs/platform/governance.md#11-linking-discipline`. |
| B7 | Invented DB-truth claim conflicts with L3 and the draft's retained DB-view clause. Route as a proposed law/architecture change at foundations plus Event Store spec, never as a new current fact in a cache guide. Common metadata; link law, pending decision, store/consumer boundaries and proof; register stream types once in consumer-owned versioned contracts with type/domain/schemaVersion/scope/sealOnWrite where relevant. No actual registration is authorized by the exercise. `docs/platform/platform-foundations.md#l3-luật-store-truth-ở-jsonl-db-là-view`; `docs/platform/event-store/spec.md#7-streams-scopes-and-refs`; `docs/platform/event-store/spec.md#26-decision-record`; `docs/platform/governance.md#5-metadata`; `docs/platform/governance.md#11-linking-discipline`. |

## C — Intended answers

| Cell | Required distinction and evidence |
|---|---|
| C1 | Portal → map plus component-boundary current table; then authority/registration ritual, not retired cognition proposal as current owner. `docs/platform/README.md#1-platform-wide-anchors`; `docs/platform/architecture-map.md#2-reading-model`; `docs/platform/component-boundary.md#4-current-high-level-components`. |
| C2 | Cross-area slice and authority-boundary design change. Surface adapter is a surface, not L0 Process; Work owns lifecycle, Workflow sequencing, Execution Core binding/run, evaluator evidence. `docs/platform/component-boundary.md#4-current-high-level-components`; `docs/platform/process/spec.md#1-purpose`; `docs/platform/architecture-map.md#9-luật-vận-hành-bản-đồ`. |
| C3 | CTR001/CTR002 state interfaces, CTR003 orchestrator/worker, CTR005 approval/merge; CTR010 is Gateway REST and CTR011 confinement, never two CTR010 owners. Evidence evaluator does not mutate Work; current Work/Workflow/Execution separation prevails over labelled historical cognition advisory. `docs/platform/architecture-map.md#7-sổ-đăng-ký-contract`; `docs/platform/component-boundary.md#4-current-high-level-components`; `docs/platform/component-boundary.md#15-run-result-evaluator-boundary`. At least state, execution/evidence and completion obligations required; exact API schemas beyond these files are unverified. |
| C4 | High: second run/write door and lower layer importing lifecycle policy; successful worker run is not merged or durable completion. `docs/platform/platform-foundations.md#l10-add-through-not-alongside-mở-rộng-qua-cửa-không-đắp-cạnh-cửa`; `docs/platform/platform-foundations.md#l9-thang-hoàn-tất-của-một-việc-run-merge-durable`; `docs/platform/component-boundary.md#4-current-high-level-components`. |
| C5 | Reuse run/state doors; show caller/consumer contract agreement and no unauthorized lifecycle mutation. New module needs map component/slice row and manifest entry; one-way-layering/completeness architecture test inside npm test, plus real behavior/regression proof for the boundary. Map ritual's L5 decision caveat must not be silently converted into a new law. `docs/platform/architecture-map.md#9-luật-vận-hành-bản-đồ`; `docs/platform/component-boundary.md#5-how-to-change`; `docs/platform/governance.md#5-metadata`. No test run or implementation certificate inferred. |
| C6 | Decision record plus map version update, owning spec/contract updates, boundary update or reasoned no-change note and evidence links. `docs/platform/architecture-map.md#9-luật-vận-hành-bản-đồ`; `docs/platform/component-boundary.md#5-how-to-change`; `docs/platform/governance.md#11-linking-discipline`. |
| C7 | Claim is a proposed reassignment contradicting the current boundary, not dashboard implementation fact. Boundary architecture is the ownership home; Work owns lifecycle behavior, surface documentation links to it. Common metadata; affected owner/contracts/proof links, map slice/component registration and manifest entry if a module is added. No new second writer is approved. `docs/platform/component-boundary.md#4-current-high-level-components`; `docs/platform/governance.md#4-authority-matrix`; `docs/platform/governance.md#5-metadata`; `docs/platform/governance.md#11-linking-discipline`; `docs/platform/architecture-map.md#9-luật-vận-hành-bản-đồ`. |

## Whole-run budget witness

Use one shared read log, not three separate allowances:

| Open | File | Serves |
|---:|---|---|
| 1 | `docs/platform/README.md` | entrypoint and every route |
| 2 | `docs/platform/governance.md` | types, metadata, links, all authoring probes |
| 3 | `docs/platform/platform-foundations.md` | L3/L5/L9/L10, all risk/learning distinctions |
| 4 | `docs/platform/architecture-map.md` | shared registry and cross-area proof/registration |
| 5 | `docs/platform/component-boundary.md` | current owners and change obligation |
| 6 | `docs/platform/holder-lock/spec.md` | A and B lock obligations |
| 7 | `docs/platform/process/spec.md` | A facts/control and C layer boundary |
| 8 | `docs/platform/event-store/spec.md` | B durability, pending decision and acceptance |

All 21 intended answers cite only this union of eight. After the navigation edit,
every file is directly linked from the entrypoint. Scenario A uses 6 of the union,
B uses 5, C uses 6 (including portal); full union remains 8. These are witnesses,
not a prediction of reader behavior. A route/anchor defect, missing gap disposition,
legacy required as owner, or ninth needed file is a stop, not a scoring exception.
`step-07-proof.json` checks all cited anchors, all eight routes, per-scenario unions,
whole-run union and hashes; independent reviewer must recompute it on committed bytes.

## Seal boundary

Gap coverage is in `step-07-reader-gap-map.md`. Known law/import gaps
P7-DOC-GAP-02/03 remain Step 9 work. This key does not depend on the missing
new-law projection or distribution rows; it must be invalidated if later edits
change any answer, route or cited anchor. Future candidate edits after a seal
invalidate it and return to Step 7; no reader may start against stale evidence.
Only the distinct A38 reviewer may record timestamp + full SHA-256 of this key,
pinned candidate hashes and a verdict. The author records no seal.
