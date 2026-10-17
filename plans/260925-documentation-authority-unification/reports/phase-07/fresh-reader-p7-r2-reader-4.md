# Fresh-reader answer: reader-4

Identity: `reader-4:sonnet-session:a4fa6d88ae3dc9923@2026-10-17`
Start timestamp (`date -u +%FT%TZ`): 2026-10-17T12:02:01Z

Anchor note: anchors follow the stated rule (dashes and other punctuation dropped, words joined by single hyphens). For headings with unusual characters I also give the heading text. All paths are under `docs/platform/`.

## Read log (ordered; 8 distinct files, all in the allowed list)

1. `README.md` (full): entrypoint, area registry, how to change platform docs.
2. `process/spec.md` (full): process facts and control. Needed for scenarios A and C.
3. `governance.md` (full): document types, authority matrix, metadata, linking. Needed for the authoring probes.
4. `platform-foundations.md` (full): laws L1-L10. Needed for durability, done and completion.
5. `holder-lock/spec.md` (heading list, then sections 1-21 in chunks; a few very long lines were cut at 900-1500 characters by my own `cut`, so the tails of section 12 and section 14 and some history rows were not seen). Scenario A, lock ordering.
6. `event-store/spec.md` (heading list; header, sections 1-4, 9-10 partly, 13, 15, 20-26 and the "Changes" lists; sections 5-8, 11, 12, 14, 16-19 not read in detail). Scenario B.
7. `component-boundary.md` (heading list; sections 1-6, the component authority register, the Run Result Evaluator boundary and the "do not" list). Scenario C.
8. `architecture-map.md` (heading list; sections 1-5 of the candidate anchor, plus carried legacy sections 5, 6 and 9 on authority roles, the registry and the map operating rules).

I also ran `wc -c` on the eight allowed files, which gave sizes only. The brief's `READER-BRIEF.md` was read first and is not counted.

## Scenario A: lock timeout becomes takeover

**A1. Read first.** `README.md`, section 2 (area registry rows [holder-lock](holder-lock/spec.md) and [process](process/spec.md)). Then `holder-lock/spec.md#1-purpose` and `#2-ownership-boundary`, then `process/spec.md#3-facts-the-judge-table`. Finally `component-boundary.md#4-current-high-level-components`.

**A2. Kind of work, and where the claim belongs.** This is a platform-core design change to an Accepted component spec, not a local fix. It crosses two L0/L1 authorities: lock ownership belongs to holder-lock, and process liveness and signalling belong to process facts and control. The claim belongs in holder-lock (what happens to a lock) and in process (what an unreadable start time means). The docs do not define a path for taking a lock from a live holder. That is a boundary and ownership change, so the component-boundary rule applies: update the boundary doc or record "No component-boundary change" (`component-boundary.md#3-update-rule`, `#5-how-to-change`). Any design that supersedes a settled spec decision needs the owner (`governance.md#4-authority-matrix`: newer approved decisions supersede, a conflict is a documentation defect).

**A3. Contracts and owners.**
- Holder-lock owns the port (`acquire`, `release`, `run_borrowed`, `probe`, `holders`, `guarantee`), the registry and rank rules. The spec states that a lock decision is never derived from a pid, TTL, start time or mtime (`holder-lock/spec.md#1-purpose`, `#3-the-port` invariants, `#2-ownership-boundary`).
- Takeover: "Taking a lock away from a live holder (there is no such path...)" is listed under what holder-lock does not own (`#2-ownership-boundary`). `#17-fgos-lock-fence` is the one door, human-confirmed, and `#19-known-limits` repeats that a hung live holder is never taken over.
- Process owns `judge(tuple, observer)`, the table, and `signal_by_identity` (`process/spec.md#2-ownership-boundary`, `#3-facts-the-judge-table`, `#4-control`). Rule: start time that cannot be read gives `unknown`, which means hold. `#7-known-limits` says a hidden `/proc` entry is held, never cleaned.
- Signalling: "never by bare pid" (`process/spec.md#4-control`, `component-boundary.md#4-current-high-level-components`). The caller in the proposal signals a bare PID, which violates this.
- Predecessor-domain rule applies to the next holder after takeover (`holder-lock/spec.md#8-the-predecessor-domain-rule`). Named contracts I did not open: `process-facts.judge.v1.json`, `holder-lock.port.v1.json`, `predecessor.v1.json`, `lock-registry.v1.json`.

**A4. Risk.** High, because it reverses settled design.
- *Settled (spec status Accepted, Canonical: Yes):* kernel lock on an open file description with no TTL/pid/start-time decisions; unknown start time maps to `unknown`/held; a live holder is never taken over; signalling is by identity. Decision history is in `holder-lock/spec.md#20-lịch-sử-quyết-định` and `process/spec.md#8-lịch-sử-quyết-định`. These rows record the TTL locks being retired and the "unknown means hold" rule. They also cover the namespace case where an agent in a sandbox must not clean a host holder's record.
- *Implementation:* both specs say "In progress" (crate, routes, facade and fences land in parallel phases). Judge vectors have landed per process spec header. I have not verified any of it.
- *Draft/proposed:* the maintainer's takeover proposal is only a proposal. It is not approved.
- Concrete hazards visible in the docs: pid reuse, zombies, a process in another PID namespace, and borrowed git children that outlive a holder (`holder-lock/spec.md#8-the-predecessor-domain-rule`, `#5-description-rules`). A TTL takeover would let two writers into the main checkout.
- The hung-holder case is a documented limitation, not an unsolved gap: the answer is `fgos lock fence` (`#17-fgos-lock-fence`).

**A5. Proof.**
- *Required (as the docs state it):* the shared judge vectors run by both cargo and the Node leaf (`process/spec.md#3-facts-the-judge-table`); a cross-platform `cargo check` as crate acceptance (`#5-os-neutral-port`); the lock tests, leak tests and borrow vectors (`holder-lock/spec.md#5-description-rules`); doctor checks `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders`, `lock-fences` (`#13-setup-doctor-and-activation`); and `fgctl` activation refusing red vectors. The six-question test applies (`platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi`).
- For this proposal specifically, a vector would be needed for "start time unreadable gives held", plus a test that no takeover path exists. The docs do not list a vector for a TTL takeover, so I cannot cite one.
- *Observed:* none. I ran no tests and checked no contract file contents.

**A6. Learning to leave behind.** If rejected: a short entry in the owning spec's "Lịch sử quyết định" (holder-lock section 20, process section 8) saying why TTL or unreadable-start-time takeover is refused. If the owner wants it: a new decision that supersedes the named decisions, not an in-place edit (`platform-foundations.md#2-authority`, `governance.md#4-authority-matrix`). The change would also update the judge-vector contract and the boundary entry, or record "No component-boundary change".

**A7. Authoring probe: "An unreadable process start time is sufficient proof that a cold lock is free."**
- Classification: this is a design claim that contradicts a settled spec. It is not a fact to record. It may only exist as a Proposal (non-canonical candidate) or a discussion scratchpad (`governance.md#3-document-types`, `#7-discussion-scratchpad-workflow`), never in a spec or contract. The authority matrix says a scratchpad or proposal cannot establish binding rules or settled decisions.
- Owning location if it were ever accepted: the process judge table (`process/spec.md#3-facts-the-judge-table`) for "unreadable start time", and holder-lock (`holder-lock/spec.md#3-the-port`, `#8-the-predecessor-domain-rule`) for lock "free". Today it is wrong on both counts. The process table says `unknown`, and a free lock comes from the kernel's answer, never from a start time.
- Metadata for a proposal: baseline fields of `governance.md#5-metadata` (Document type, Audience, Purpose, Design status, Implementation, Provenance, Writer type, Canonical for, Use this when, Do not use this for, Last reviewed, Related), with `Canonical: No` and a proposed status. Writer type could be "Agent draft writer". If it touches a boundary, a body link or a "No component-boundary change" note (`governance.md#11-linking-discipline`).
- Body links: a `Related Files` section with markdown links and typed relationships such as `constrains` and `supersedes` (`governance.md#11-linking-discipline`); `Related:` in the code block alone is not enough. Registration: it would be collected in the cross-area proposal route that the README names (`proposals/README.md`, which I did not open). It must not be added to the area registry as authority.

## Scenario B: faster Event Store publication

**B1. Read first.** `README.md` row for [event-store](event-store/spec.md): "Signed durability design (D-ADR0055, 2026-10-17); implementation not started, acceptance under the proof gates; navigation does not implement it". Then `event-store/spec.md#2-decisions-this-spec-implements`, `#9-append-the-ack-point`, `#10-seal`, `#4-layering-and-locks`, `#13-work-gate-the-read-check-append-serialization-c1`, `#23-proof-gates`, `#26-decision-record`. Then `platform-foundations.md` L3 note, and `holder-lock/spec.md#7-registry` for ranks.

**B2. Kind of work, and where the claim belongs.** A change to a signed, accepted design owned by the Event Store component, whose Source is planned (`packages/event-store/rust`), so it is implementation work against a contract rather than a design with no home. The claim "ref-based design is approved and implemented" belongs to the spec header and the README row, and both say otherwise (see B4). Changing durability or the truth model needs the owner, because the spec was signed (D-ADR0055). Dropping replayable history would also touch L3, which is a locked law (`platform-foundations.md#2-authority`: changing a law supersedes its decision record).

**B3. Contracts and owners.**
- Event Store owns the envelope, open logs, append/ack, seal, reader, order and sharing (`event-store/spec.md#3-ownership-boundary`). Consumers (Work, etc.) own reducers, views and the Work gate (`#13-work-gate-the-read-check-append-serialization-c1`).
- Holder-lock owns lock mechanism and ranks. Event Store only declares two rows: `event-seal` rank 58, `event-append` rank 70 (`event-store/spec.md#4-layering-and-locks`). The `state` hot-mutex is rank 60. Holder-lock marks the state locks as pending the event store decision (`holder-lock/spec.md#15-hot-state-mutex-and-porting-events-pending`).
- Session Identity owns the writer id. Git component: publication port. Planned contracts directory `packages/event-store/contracts/` (planned; not opened).
- The L3 supersession note: clauses 1 and 4 superseded, clauses 2 and 3 kept (`platform-foundations.md`, heading "L3 — Luật store: truth ở JSONL, db là view", anchor `l3-luật-store-truth-ở-jsonl-db-là-view`).

**B4. Risk.**
- *Settled:* D-ADR0055 signed 2026-10-17 (decision log seq 65): sealed changesets on `refs/fgos/events/<machine-id>`, ack after `fsync`, every view a rebuildable cache (`#26-decision-record`, `#2-decisions-this-spec-implements`).
- *Draft/provisional:* the header says it is "the contract for starting implementation under the gates of section 23; it does not claim the design is proven", and direction B is provisional (section 2 "Readiness"). Several defaults are agent choices, listed separately from owner decisions.
- *Implemented:* "Implementation status: Not started" in the header; the README row says the same. So "approved and implemented" is half wrong. It is signed but not implemented, and the proof gates are not green.
- Proposal hazards, each contradicted by the spec:
  - Ack before `fsync`: the ack point is the end of append step 6, after write plus `fsync` (`#9-append-the-ack-point`). Acking earlier loses acked events on a crash.
  - Seal while holding the Work gate: `event-seal` (58) under `state` (60) throws `lock-order-violation`, and the facade refuses with `event-store-seal-under-state`. No git call or spawn is allowed inside the gate (`#4-layering-and-locks`, `#13-work-gate-the-read-check-append-serialization-c1`).
  - SQLite view only: views are rebuildable caches, and truth is the event history (`#15-views-cursors-and-verbs`, L3 clauses 2 and 3, still in force).
- Evidence limits: the model check and git experiment cover only a finite Python model and a local bare repo, and are not proof of the Rust crate or of forge behavior (`#23-proof-gates`, section 23.1 "Not proven").

**B5. Proof.**
- *Required (`#232-before-acceptance-of-the-implementation`, "23.2 Before acceptance of the implementation"):* kill matrix with real holder-lock locks (no acked event lost or doubled, no `seq` reused); reader-versus-seal stress of at least 10,000 interleavings; Work authority race tests (V-AUTH-01); sequence/multi-clone reconciliation; three-machine test; legacy parity; rollback; latency and IPC with 0 spawns inside the gate; native addon distribution; power-loss simulation on ext4; `rg` check that no git use of `refs/fgos/*` sits outside the publication driver; topologies; setup and doctor vectors with full `npm test` and cargo tests.
- *Observed by me:* none. The spec reports an agent model check and a git ref experiment (section 23.1) and I only read those summaries. I did not open the reports and did not run anything.
- Doctor checks listed in `#21-setup-doctor-and-configuration` (for example `event-store-unsealed`, `event-store-integrity`) are part of required proof.

**B6. Learning to leave behind.** If the faster publication is wanted: an owner decision that supersedes D-ADR0055 (not an edit), recorded in `event-store/spec.md#26-decision-record`, plus an update to the L3 note in `platform-foundations.md`. Durable-latency numbers would go in the proof results of section 23.2. If rejected: record the reasons in the spec's decision section so the proposal is not re-derived. Also state the component-boundary outcome (`component-boundary.md#3-update-rule`).

**B7. Authoring probe: "A SQLite cache is the canonical event truth and needs no replay source."**
- Classification: a normative design claim that contradicts a locked law and a signed decision. It cannot be written as current truth in any spec. At most it is a proposal that asks the owner to supersede.
- Owning candidate location if accepted: Event Store spec (decision record, section 26, plus sections 15 and 25 on views and out-of-scope SQLite) and the L3 entry in platform foundations. Today L3 clauses 2 and 3 say the db is a materialized view, rebuildable from zero by replay.
- Required metadata and registration: for a proposal, the `governance.md#5-metadata` baseline with `Canonical: No` and Design status Proposed. For acceptance, the optional higher-risk fields (Owner, Approvers, Approved at, Supersedes, Superseded by, Evidence) and an implementation-alignment table with `planned` status (`governance.md#5-metadata`). Body links: `Related Files` with typed `supersedes` to D-ADR0055 and L3, and a link to the event-store spec. Decision registration is by superseding the decision id, not by editing in place (`platform-foundations.md#2-authority`).

## Scenario C: dashboard creates another completion writer

**C1. Read first.** `README.md` section 2 row for herdr-web-dashboard (candidate area portal, not opened), then `component-boundary.md#4-current-high-level-components` and the register in `component-boundary.md` section 5 "High-Level Component Authority Register" (anchor `5-high-level-component-authority-register`). Then `platform-foundations.md` L9 and L10, and `architecture-map.md#9-luật-vận-hành-bản-đồ`... (see note in contradictions about the level of that heading).

**C2. Kind of work, and where the claim belongs.** A new slice in the Host And Surface layer that wants to take over a lifecycle decision (Work done) and add a second execution path. Under the register it is a surface adapter: it "translates ... dashboard ... interactions into calls against the engines, without becoming lifecycle or evidence truth" (register row "Host And Surface Layer"). The claim "a successful worker run makes Work done" belongs to the Work Lifecycle Engine (completion/claim/return) and, for the result's confidence, the Run Result Evaluator. It does not belong to the dashboard. The dashboard slice is a slice row (cross-tier feature pointing at components), not a low-level process primitive (see C3 and C7).

**C3. Contracts and owners.**
- Work Lifecycle Engine owns item identity, status, claim/return, human gates and fail-safe claim settlement (`component-boundary.md#4-current-high-level-components`, register row). Work verbs and state belong to the work-state area ([work-state/README.md](work-state/README.md), not opened).
- Execution Core owns the single run door `fgos run`, `bind()` and execution authority, and "strictly forbids L3 Work lifecycle dependencies" (`#4-current-high-level-components`). A "separate execution path" from the dashboard would bypass this.
- Run Result Evaluator owns the confidence decision for one Assignment Run (`component-boundary.md`, section "15. Run Result Evaluator Boundary"). Process execution adapters can prove start/end only, and a worker's claim is not proof.
- L9: run-complete (`proposed`, runner) is not merge-complete (`done`, review/merge gate CTR005) and not durable (`platform-foundations.md`, heading "L9 — Thang hoàn tất của MỘT việc: run ≠ merge ≠ durable"). A successful worker result is only run-complete.
- L10 add-through-not-alongside: new behavior extends the existing write door (`moveWork`) and never adds a parallel writer (`platform-foundations.md`, heading "L10 — Add-through-not-alongside: mở rộng QUA cửa, không đắp CẠNH cửa"). A dashboard that writes lifecycle state from an adapter is a second write path.
- Process facts and control owns spawning and signalling by identity and knows nothing about "a run, an envelope, a lock or a pane" (`process/spec.md#1-purpose`, `#2-ownership-boundary`). So a dashboard cannot be a process primitive. Starting a process is not what that layer is for.
- Contracts named but not opened: CTR005, CTR002 (single write door), CTR010 (gateway REST).

**C4. Risk.** High for authority and low for "just a UI".
- *Settled (per the candidate documents, with their own status markers):* Host/Surface does not own lifecycle or evidence truth. `component-boundary.md` is Design status Draft, "Canonical: Yes, after review", so I treat this register as the best current statement and not as final. Run-complete versus merge-complete is L9 (candidate foundations file, "Canonical: No" in this header). The carried legacy text still states the laws.
- *Implemented:* not verifiable from these eight files. The architecture map says a manifest and test exist (`architecture-map.md`, section 9 item 3), and I did not check them.
- *Draft:* the proposed slice. Also the herdr-web-dashboard area is a candidate area portal, so its own spec is outside my reading.
- Failure modes visible in the docs: a second completion writer silently bypasses CAS, cycle checks, envelope and write-queue guarantees (L10 consequence), and "worker success equals done" collapses L9.

**C5. Proof.**
- *Required:* the six questions (`platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi`); a test or architecture check that there is exactly one write path for completion (L10 says review/tests should catch "a second write path"); the architecture manifest row plus the `test/architecture.test.mjs` import-direction and completeness check (`architecture-map.md`, carried section 9 item 3); evidence that a successful run lands as `proposed` and `done` only through the approve/merge gate. The doc says "Run Result Evaluator" for confidence evidence and `fgos run` as the one run door.
- *Observed by me:* none. I did not open the manifest, test, CTR005 or the work-state spec.

**C6. Learning to leave behind.** Record the boundary outcome: `No component-boundary change` in the PR or verification note if the slice stays a surface (`component-boundary.md#3-update-rule`), or update the boundary map if ownership really moves (which would also need the owner). Register the slice in the map's slice registry (section 6 of the carried legacy map) with contracts and maturity (`planned`). A settled rejection of "dashboard owns completion" goes in the owning spec's decision history (work-state or herdr-web-dashboard; I did not read either, so I do not know their exact section).

**C7. Authoring probe: "The dashboard owns the decision that a successful worker run makes a Work item done."**
- Classification: an authority claim that contradicts the register. It is not a Host/Surface fact. It cannot be a canonical spec claim for the dashboard area; any text must state that the dashboard only displays and requests through the engines. Registering it as a "low-level process primitive" is a wrong classification, because that layer (process facts and control, L0) owns no run or lifecycle knowledge, and the dashboard belongs under Host And Surface and the herdr-web-dashboard area.
- Owning candidate location: lifecycle completion rules in the work-state area spec and L9, with the dashboard area spec holding only its surface behaviour. The herdr-web-dashboard area portal is `herdr-web-dashboard/README.md` (candidate portal, not opened).
- Required metadata: baseline fields of `governance.md#5-metadata`, with the higher-risk optional fields if normative. An implementation-alignment table (design claim, `planned`/`partial`, evidence, gap). Body links via `Related Files` with typed relationships, and component-boundary link per `governance.md#11-linking-discipline`. Registrations: a slice row (component or slice, tag, contracts, maturity, PBI) before code per `architecture-map.md#9-luật-vận-hành-bản-đồ` (3-step ritual), a manifest row in `docs/architecture-manifest.json` (named, not opened), and a contract (named in the registry or a new versioned one). The map operating-rule note says this ritual takes effect only through a decision record touching L5, so its binding force is itself pending.

## Missing routes

- The README links area portals (work-state, runner, herdr-web-dashboard, observe, session-identity, agent-confinement, etc.) that are outside my eight-file list, so I could not find the completion/CTR005 rules or the dashboard area's current contract. I name them without opening them.
- No allowed file lists an explicit rule for "a new slice registers where" in the candidate corpus other than the carried legacy map section 9 and README section 4; the candidate `architecture-map.md` section 4 gives only a short change rule.
- The named lock contracts and vectors (judge vectors, predecessor, registry) and the Event Store contracts directory are not in the allowed list, so contract wording is unchecked.
- The "proposals" route (`proposals/README.md`) and `migration-authoring-rules.md` are named by README but outside the budget. I cannot state their exact registration steps.
- `holder-lock/spec.md#7-registry` does not show the `event-seal` (58) and `event-append` (70) ranks, though the Event Store spec says they are new registry rows. The rank table in holder-lock lists only ranks 10 through 80 and shows `state` at 60 and a gap at 55. I treat the Event Store text as the owner of those two rows.

## Contradictions and tensions seen

- `README.md` marks itself "Design status: Accepted" while `governance.md`, `platform-foundations.md`, `component-boundary.md` and `architecture-map.md` say Candidate/Draft and (for foundations and governance) "Canonical: No". `holder-lock`, `process` and `event-store` say "Canonical: Yes". Foundations is the law surface that the specs cite, yet it says it is not canonical until atomic cutover. This is a mixed-authority situation the reader must surface and cannot resolve.
- `platform-foundations.md` law summary row for L3 states "JSONL/event changesets are truth; databases are rebuildable views", then notes clauses 1 and 4 are superseded by D-ADR0055. The carried L3 body still reads as the old law with a short "bị thay một phần" paragraph. L10 still cites "L3 rule 4 (mọi ghi qua MỘT cửa)", which D-ADR0055 superseded. Only the note, not L10, records this.
- `event-store/spec.md#26-decision-record` supersedes L3 clause 4 (single CLI door, single writer) while foundations L10 and the event-store spec itself keep "one write door" for Work (the Work gate). I read this as compatible (door per consumer), but the docs do not say so explicitly.
- Event Store and holder-lock cross-cite line numbers (`docs/platform/holder-lock/spec.md:114-126`, `:155`; `docs/platform-foundations.md:184-190`) that will drift. I did not verify them.
- Heading levels: in `component-boundary.md` and `architecture-map.md`, carried legacy sections are `####`, below an H2 "Added in candidate" block. Anchor behaviour for these headings (for example the duplicate heading numbers "5" and "9") is uncertain, so I cite file plus heading text for them.
- `README.md` lists `holder-lock` and `process` as canonical area routes. Process spec lists `session-identity` as a sibling authority, while `README.md` registry does not list a session-identity row (only the boundary table does). I did not open that spec.

## Budget notes

- Exactly eight files, all from the allowed list, no rereads of other files. Some reads were partial (greps for headings, `sed` ranges, and my own `cut` truncation of long lines), so large sections of `event-store/spec.md`, `component-boundary.md` and `architecture-map.md` were not read and my claims about them are limited to what I quote.
- Budget pressure: the three large files (about 100 KB, 92 KB, 59 KB) could not be read in full within a reasonable window, so I used heading lists and targeted ranges. Event Store sections 5-8, 11, 12, 14, 16-19 and component-boundary sections 6-17 beyond the ones cited were not read.
- Two tool messages named overflow files (`/home/vantt/.claude/projects/.../tool-results/...` and `~/.local/share/rtk/tee/...`) holding the remainder of truncated output. I did not open any of them.

## Out-of-scope reads

None. I opened no path outside the reader corpus directory, ran no git command, no web access, and modified only this answer file.
