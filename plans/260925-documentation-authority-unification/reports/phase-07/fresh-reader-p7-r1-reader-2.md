# Fresh-reader answer: p7 round 1, reader-2

Identity: `reader-2:sonnet-session:ac28990dac4064164@2026-10-17`
Start timestamp: 2026-10-17T11:56:05Z (finished 2026-10-17T11:56:38Z by `date`)

Paths below are relative to the corpus root. `holder-lock/spec.md` is written HL, `process/spec.md` PR, `event-store/spec.md` ES, `component-boundary.md` CB, `platform-foundations.md` PF, `architecture-map.md` AM, `governance.md` GOV.

## Read log (ordered)

1. READ-BRIEF.md: the brief, not counted.
2. `docs/platform/README.md`: entrypoint. It gave the anchors, the area registry, the decision surface and the change route.
3. `docs/platform/holder-lock/spec.md` (whole): Scenario A lock ownership.
4. `docs/platform/process/spec.md` (whole): Scenario A process facts and signalling.
5. `docs/platform/event-store/spec.md`: first page (lines 1-467), then a second read of lines 468-797. Scenario B.
6. `docs/platform/component-boundary.md`: read lines 1-1039 of 1630. After that I ran one grep over the same file (dashboard, completion, "only Work verbs"). Lines 1040-1630 were not read; they are the carried advisory text.
7. `docs/platform/governance.md` (whole): document types, metadata, linking, migration rule. Used for the authoring probes.
8. `docs/platform/platform-foundations.md`: first 400 lines, which is the whole file. Laws L1-L10.
9. `docs/platform/architecture-map.md`: `wc` and heading grep, lines 1-80, lines 384-440 and 534-575, and a grep for dashboard and registration. Used for the registration ritual.

Distinct files opened: 8 of 8. Nothing outside the eight allowed files was read, listed or searched. I ran no tests and no git, and I modified nothing.

---

## A. Lock timeout becomes takeover

**A1. Read first.** `README.md`, then the holder-lock and process area rows in its registry (`README.md` section 2). Then [HL#1-purpose](holder-lock/spec.md#1-purpose) and [HL#2-ownership-boundary](holder-lock/spec.md#2-ownership-boundary). Then [PR#3-facts-the-judge-table](process/spec.md#3-facts-the-judge-table) and [PR#4-control](process/spec.md#4-control).

**A2. Kind of work and where the claim belongs.** This is a change to the lock decision path and to process control, so it touches two L0/L1 authority components.
- Whether a lock is held belongs to Holder-lock ([HL#2-ownership-boundary](holder-lock/spec.md#2-ownership-boundary), [CB#4](component-boundary.md#4-current-high-level-components) row "Holder-lock (L1)").
- Whether a process tuple is alive, dead or unknown, and how it is signalled, belongs to Process Facts and Control ([PR#2-ownership-boundary](process/spec.md#2-ownership-boundary)).
- The proposal asks to change settled rules, so it is a decision change, not an implementation fix. Per [PF#2](platform-foundations.md) and [GOV#4](governance.md#4-authority-matrix), a decision is superseded, not silently edited. The settled history is in [HL#20](holder-lock/spec.md#20-lịch-sử-quyết-định) and [PR#8](process/spec.md#8-lịch-sử-quyết-định).

**A3. Contracts and owners.**
- Judge table and shared vectors: owned by Process, contract `packages/process/contracts/process-facts.judge.v1.json` ([PR#9](process/spec.md#9-related-files)). I have not opened it.
- Lock port, registry, predecessor rule and `fgos lock fence`: owned by Holder-lock ([HL#3](holder-lock/spec.md#3-the-port), [HL#7](holder-lock/spec.md#7-registry), [HL#8](holder-lock/spec.md#8-the-predecessor-domain-rule), [HL#17](holder-lock/spec.md#17-fgos-lock-fence)). The port contract is `holder-lock.port.v1.json`, also unopened.
- Holder-lock consumes Process facts and control. Holder-lock "does not own" liveness judgment of a process tuple ([HL#2](holder-lock/spec.md#2-ownership-boundary)). Process "does not own" which lock anyone holds ([PR#2](process/spec.md#2-ownership-boundary)).
- Session Identity grants no lock authority ([CB#4](component-boundary.md#4-current-high-level-components)). Its spec is outside my list and unread.

**A4. Risk.**
- The proposal contradicts settled, accepted design on three points.
  - A start time that cannot be read is `unknown`, which holds. It is never `dead` ([PR#3](process/spec.md#3-facts-the-judge-table), last row; [PR#7](process/spec.md#7-known-limits)). The Node adapter maps `alive | unknown` to `held`.
  - A TTL takeover contradicts "no decision anywhere in the component is derived from a pid, a TTL, a start time or an mtime" ([HL#1](holder-lock/spec.md#1-purpose)). The TTL locks were retired ([HL#4](holder-lock/spec.md#4-drivers-and-guarantee-levels), last sentence of the intro).
  - "There is no path that takes a lock from a live holder" ([HL#17](holder-lock/spec.md#17-fgos-lock-fence), [HL#19](holder-lock/spec.md#19-known-limits)). The only door is `fgos lock fence`, which asks a person to confirm.
- Signalling a bare PID contradicts "never by bare pid" and the `pidfd` identity check ([PR#4](process/spec.md#4-control), [CB#4](component-boundary.md#4-current-high-level-components) row "Process Facts & Control (L0)").
- Status: Design is Accepted for both specs. Implementation is "In progress" for both, with the crate, routes and some cutovers landing in parallel phases ([HL header](holder-lock/spec.md), [PR header](process/spec.md)). The kernel-lock design is settled and partly implemented. I cannot tell from these files which parts are implemented. Windows has no driver ([HL#4](holder-lock/spec.md#4-drivers-and-guarantee-levels)).
- Risk is high: this would reverse a locked, reasoned decision and create a takeover path that can break a live holder. A wedged holder is a known limit with a stated remedy, not a gap ([HL#19](holder-lock/spec.md#19-known-limits)).

**A5. Proof for done.**
- Required, as the specs name it, though I opened none of it:
  - shared judge vectors run by both cargo and the Node leaf ([PR#3](process/spec.md#3-facts-the-judge-table));
  - the description-rule leak tests and borrow vectors ([HL#5](holder-lock/spec.md#5-description-rules));
  - the doctor checks `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders` and `lock-fences` ([HL#13](holder-lock/spec.md#13-setup-doctor-and-activation));
  - the `fgctl` activation gate ([HL#13](holder-lock/spec.md#13-setup-doctor-and-activation));
  - `cargo check` for the Windows and macOS targets ([PR#5](process/spec.md#5-os-neutral-port)).
- For this proposal specifically, a proof of "takeover is safe" would have to be a new vector plus a superseding decision. None exists.
- Observed by me: nothing. I ran no tests. The only evidence I saw is the specs' own reports of measurements (for example the Windows predecessor timings in [HL#8](holder-lock/spec.md#8-the-predecessor-domain-rule)). I did not check them.

**A6. Learning and settled decision to leave behind.**
- Rejection of the proposal: a one-line note in the `Lịch sử quyết định` sections of [HL#20](holder-lock/spec.md#20-lịch-sử-quyết-định) and [PR#8](process/spec.md#8-lịch-sử-quyết-định). The decision itself stays in those two history sections.
- The Platform L5 "what learning remains" question applies ([PF#3 L5 row](platform-foundations.md#3-law-summary)).
- If the owner did want takeover, the route is a new decision that supersedes the ID, with an updated judge vector file and `component-boundary.md` checked or marked "No component-boundary change" ([CB#3](component-boundary.md#3-update-rule)).

**A7. Authoring probe: "An unreadable process start time is sufficient proof that a cold lock is free."**
- Classification: not a documentable claim. It is false against the corpus. It contradicts the judge table (`unknown`, hold) and the kernel-lock rule (a free lock is decided by the kernel, never by facts). So it is a rejected proposal. If someone insisted, it would be a Decision (superseding) and not a spec fact ([GOV#3](governance.md#3-document-types)).
- Owning location: the fact claim would belong in the `process/spec.md` judge table ([PR#3](process/spec.md#3-facts-the-judge-table)) and the lock claim in `holder-lock/spec.md` section 1 or 17. The decision record belongs in each spec's history section.
- Required metadata ([GOV#5](governance.md#5-metadata)): `Document type`, `Audience`, `Purpose`, `Design status`, `Implementation`, `Provenance`, `Writer type`, `Canonical for`, `Use this when`, `Do not use this for`, `Last reviewed`, `Related`. A decision also needs `Supersedes`, `Superseded by` and `Evidence`. It needs an implementation-alignment row for the claim, with status one of `implemented`, `partial`, `planned`, `superseded` or `unknown`.
- Body links and registration ([GOV#11](governance.md#11-linking-discipline)): renderable typed links to the judge vector contract, [HL](holder-lock/spec.md) and [PR](process/spec.md), and a link to [CB](component-boundary.md#4-current-high-level-components). `Related:` in metadata is plain text only. If the boundary does not change, record `No component-boundary change`. I did not write the claim anywhere.

---

## B. Faster Event Store publication

**B1. Read first.** `README.md` row "event-store" ([README#2](README.md)), then [ES header and section 1](event-store/spec.md#1-purpose), [ES#2](event-store/spec.md#2-decisions-this-spec-implements), [ES#26](event-store/spec.md#26-decision-record) and [ES#23](event-store/spec.md#23-proof-gates). Then [PF L3 note](platform-foundations.md) and [HL#15](holder-lock/spec.md#15-hot-state-mutex-and-porting-events-pending).

**B2. Kind of work and where the claim belongs.** This is an implementation and design deviation inside the Event Store component. The claim belongs to `event-store/spec.md`, an area spec, owner "Event Store component" ([ES#3](event-store/spec.md#3-ownership-boundary)). Reversing the design needs a decision that supersedes D-ADR0055 ([ES#26](event-store/spec.md#26-decision-record)), not an edit in place.

**B3. Contracts and owners.**
- Event Store owns the envelope, open logs, seal, reader, order and sharing ([ES#3](event-store/spec.md#3-ownership-boundary)).
- Consumers (Work) own gates and reducers. The Work gate is the `state` hot-mutex at rank 60 ([ES#13](event-store/spec.md#13-work-gate-the-read-check-append-serialization-c1)).
- Holder-lock owns locks as a mechanism. Event Store only declares two registry rows, `event-seal` at rank 58 and `event-append` at rank 70 ([ES#4](event-store/spec.md#4-layering-and-locks), [HL#7](holder-lock/spec.md#7-registry)). Holder-lock explicitly leaves the `state` lock to the event store decision ([HL#15](holder-lock/spec.md#15-hot-state-mutex-and-porting-events-pending)).
- Plan files and contracts under `packages/event-store/contracts/` are "planned" ([ES header](event-store/spec.md)). Platform law L3 clauses 1 and 4 are superseded ([PF#3 L3 row](platform-foundations.md#3-law-summary)).

**B4. Risk, with status separated.**
- Settled (owner signed): D-ADR0055, 2026-10-17 ([ES#26](event-store/spec.md#26-decision-record), [README#2](README.md)). Event truth is sealed changesets as git objects on per-machine refs.
- Draft or unproven: "Design status ... does not claim the design is proven". The gates in [ES#23](event-store/spec.md#23-proof-gates) confirm or reopen it. Direction B was chosen provisionally ([ES#2](event-store/spec.md#2-decisions-this-spec-implements)).
- Implemented: no. "Implementation status: Not started" ([ES header](event-store/spec.md), [README#2](README.md)). The author's claim "approved and implemented because it appears in the corpus" confuses navigation with approval and with implementation. Approved: yes (signed). Implemented: no. Proven: no. The README says "navigation does not implement it".
- The three proposal choices each conflict with the spec.
  - Acknowledge before fsync: the ack point is the end of the `write` plus `fsync` ([ES#9](event-store/spec.md#9-append-the-ack-point)). The proposal drops the durability level the spec defines.
  - Seal while the Work state gate is held: `event-seal` (58) under `state` (60) throws `lock-order-violation`. The facade also refuses with `event-store-seal-under-state` ([ES#4](event-store/spec.md#4-layering-and-locks)). The spec forbids any DAG walk, git call or spawn inside the gate ([ES#13](event-store/spec.md#13-work-gate-the-read-check-append-serialization-c1), [ES#17](event-store/spec.md#17-node-to-rust-route-and-latency-budget)).
  - Keep only a SQLite view with no replayable events: L3 clause 2 says the database is a rebuildable view from the event record, and clause 2 stands ([PF#3](platform-foundations.md#3-law-summary)). In [ES#15](event-store/spec.md#15-views-cursors-and-verbs) a consumer may choose SQLite as a cache, but events stay the truth. Removing replay also removes the migration and rollback path ([ES#18](event-store/spec.md#18-migration-and-rollback)).
- Risk is high: an acked-but-unfsynced event can be lost, the lock order is violated, and rebuildability is dropped.

**B5. Proof for done.**
- Required: the 13 acceptance items of [ES#23.2](event-store/spec.md#23-proof-gates). They include the kill matrix, the reader-versus-seal stress test with at least 10,000 interleavings, the Work gate authority test (V-AUTH-01), the multi-clone and ordering tests, three machines against a real remote, legacy parity, rollback, latency on ext4 with 0 spawns inside the gate, native addon distribution, power-loss simulation, V-DOOR-01, topologies and setup/doctor vectors. Section 17 gives the latency budget.
- Observed by me: nothing. The spec reports pre-signature agent proofs (model check and V-REF-01, [ES#23.1](event-store/spec.md#23-proof-gates)). Those are evidence about a finite Python model of earlier text and about git on a local bare repository. They are not proof of the Rust crate or of the proposal. I read the reports' summaries only and did not open the reports.

**B6. Learning and settled decision to leave behind.**
- The decision: the D-ADR0055 record in [ES#26](event-store/spec.md#26-decision-record). Any reversal needs its review threshold: a cross-machine conflict that a person had to resolve by hand more than once a month, or any acknowledged event lost while fgOS was running.
- Corrections to implementation status and doctrine go to [README#2](README.md) and the L3 note in [PF](platform-foundations.md).
- The measured-limits facts go to [ES#22](event-store/spec.md#22-support-matrix-and-known-limits) and [ES#24](event-store/spec.md#24-evidence-and-its-limits).

**B7. Authoring probe: "A SQLite cache is the canonical event truth and needs no replay source."**
- Classification: contradicts the corpus. It would be a spec/decision change, not a fact. It contradicts L3 clause 2, D-ADR0055 and [ES#15](event-store/spec.md#15-views-cursors-and-verbs).
- Owning location: [ES#26](event-store/spec.md#26-decision-record) as a superseding decision, with the L3 note in [PF](platform-foundations.md) updated. A proposal before acceptance would sit under `docs/platform/proposals/` ([README#4](README.md)), non-canonical.
- Metadata ([GOV#5](governance.md#5-metadata)): the baseline fields plus `Supersedes: D-ADR0055`, `Evidence`, and the implementation-alignment table. Event Store's own header already uses `Owner`, `Source (planned)` and `Contracts (planned)`.
- Body links ([GOV#11](governance.md#11-linking-discipline)): typed links `supersedes` to [ES](event-store/spec.md#26-decision-record), `constrains` to [PF](platform-foundations.md), and a boundary check against [CB](component-boundary.md#5-how-to-change). I did not write it.

---

## C. Dashboard creates another completion writer

**C1. Read first.** `README.md` (its area registry has `herdr-web-dashboard` as a "Candidate area portal"), then [CB#3](component-boundary.md#3-update-rule), [CB#4](component-boundary.md#4-current-high-level-components) (rows for Work Lifecycle Engine, Execution Core, Herdr, fgos Gateway, Host And Surface Layer), the contract matrix in the carried advisory (row "Work Integration Boundaries", [CB line 412](component-boundary.md)), [PF L10](platform-foundations.md) and [AM#9](architecture-map.md). I did not open the dashboard area portal.

**C2. Kind of work and where the claim belongs.** This is a Host and Surface slice. Surfaces translate calls into engine calls "without becoming lifecycle or evidence truth" ([CB advisory row "Host And Surface Layer"](component-boundary.md)). The completion decision belongs to the Work Lifecycle Engine. It owns "claim/return, human gates" and fail-safe claim settlement ([CB#4](component-boundary.md#4-current-high-level-components) row 1). The execution decision belongs to the Execution Core (`bind()` and the `fgos run` door, [CB#4](component-boundary.md#4-current-high-level-components) row "Execution Core"). Worker-result confidence belongs to the Run Result Evaluator.

**C3. Contracts and owners.**
- Work verbs: only Work verbs move lifecycle state. Owner: Work Lifecycle Engine. Consumers include the Run Result Evaluator and domain components ([CB advisory matrix row "Work Integration Boundaries"](component-boundary.md)).
- Run result and confidence: owner Run Result Evaluator. "It should not authorize lifecycle mutation."
- Execution: owner Execution Core. It "strictly forbids L3 Work lifecycle dependencies". `fgos run` is the single run door ([CB#4](component-boundary.md#4-current-high-level-components)).
- Gateway REST (CTR010) and the Herdr dashboard are the surface side. They share a CLI adapter layer. Their contract ids are in the architecture map (`CTR010`, [AM line 455](architecture-map.md)).
- Process Facts and Control (L0) is only facts and control for process tuples. It "knows no run, lock or pane" ([CB#4](component-boundary.md#4-current-high-level-components), [PR#1](process/spec.md#1-purpose)). A dashboard is not that primitive, so the proposed registration is the wrong layer.
- A new write path beside the door breaks L10, "add through, not alongside" ([PF L10](platform-foundations.md)).

**C4. Risk.**
- The proposal is a second completion writer with surface-level authority. A worker "success" is a claim, not proof: "Workers can claim success, but a claim is not proof" (advisory, [CB](component-boundary.md)). The L9 completion ladder also separates run-complete, merge-complete and durable ([PF L9](platform-foundations.md)). Treating run success as final Work completion collapses that ladder.
- Status: `component-boundary.md` is Design status "Draft" with "Canonical: Yes, after review" ([CB header](component-boundary.md)). So the boundary map is a draft authority, but the L9 and L10 laws and the platform boundary rules are described in the corpus as settled. Settled: L9, L10 and the single-door rule. Draft: the component map as a whole. Implemented: not assessed. Implementation is "Partial" for the map and the README.
- Risk is high: it bypasses CAS, FSM and envelope guarantees "in silence" ([PF L10](platform-foundations.md)). It also changes ownership of a state write, which triggers the boundary update rule ([CB#3](component-boundary.md#3-update-rule)).

**C5. Proof for done.**
- Required: the six-question stranger test ([PF L5](platform-foundations.md)). `component-boundary.md` update or a recorded "No component-boundary change" ([CB#3](component-boundary.md#3-update-rule)); that note would be false here. Registering a new slice also needs the registry steps in [AM#9](architecture-map.md): a row in the component registry before code, a named contract, and the architecture manifest plus `test/architecture.test.mjs` (import direction and registry completeness). Both are named, not opened.
- A test that a surface cannot write lifecycle state directly would be the specific proof. I could not find one named in these eight files.
- Observed by me: nothing.

**C6. Learning and settled decision to leave behind.** The decision that the surface may only call Work verbs belongs in the Work Lifecycle Engine area docs (`work-state`) and as a boundary row in [CB](component-boundary.md#4-current-high-level-components). A rejection is recorded in a decision record per [GOV#3](governance.md#3-document-types). Per [AM#9](architecture-map.md), changing the map goes through a decision record and a version bump.

**C7. Authoring probe: "The dashboard owns the decision that a successful worker run makes a Work item done."**
- Classification: contradicts the corpus (Work verbs decide, the Evaluator computes confidence, a run result is not a lifecycle mutation). It would be a boundary-changing decision, not a spec fact.
- Owning location if ever accepted: [CB#4](component-boundary.md#4-current-high-level-components) with the `work-state` spec, not a dashboard doc. Before acceptance it would be a non-canonical proposal ([README#4](README.md) names the proposals collection).
- Metadata ([GOV#5](governance.md#5-metadata)): baseline fields, `Supersedes`, `Evidence` and the alignment table. Required body links: typed links to the Work Lifecycle Engine row, to the dashboard area portal (`herdr-web-dashboard/README.md`, not opened), and the boundary change note ([CB#5](component-boundary.md#5-how-to-change)). Registration: the README area registry row ([README#2](README.md)), the architecture-map component row, and `component-boundary.md`. I did not write it.

---

## Missing routes

- Event Store has no row in the component table I read ([CB#4](component-boundary.md#4-current-high-level-components), lines 62-84), and the platform README does not list session-identity (but HL and PR link to it). I did not read CB lines 1040-1630, so a row could exist there. A fresh reader cannot confirm where Event Store sits in the boundary map from the first 84 lines.
- No named proof for "a surface cannot write lifecycle state". No Work Lifecycle Engine area spec is in my eight, only `work-state/README.md` by link.
- The herdr-web-dashboard portal and the Work Lifecycle Engine docs were outside the allowed list. I can only name them.
- `docs/platform/session-identity/spec.md` is linked from HL, PR and ES as a dependency but is outside my allowed list.

## Contradictions and doc defects seen

1. [README#4](README.md) links `architecture-map.md#9-luật-vận-hành-bản-đồ` and `platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi`. In the files the headings are `#### 9 · Luật vận hành bản đồ` and `### L5 — Definition of done: sáu câu hỏi`. Those slugs differ from the linked anchors, and the AM heading is level 4 inside a carried block. I cited by heading text for these.
2. `platform-foundations.md` has "Canonical: No" and "Design status: Candidate", while [README#1](README.md) lists it as the platform law anchor. [GOV header](governance.md) is also "Canonical: No / Candidate", though README says it governs docs. Authority is claimed by the README and denied by the file headers.
3. HL and PR headers use `Implementation status:` while [GOV#5](governance.md#5-metadata) requires `Implementation:`. ES has `Design status` and `Implementation status` and no `Writer type` field.
4. HL header says it is "Canonical: Yes" with in-progress implementation, and README says event-store "implementation not started", so the "Canonical" flag means design authority and not delivered behavior. A reader has to infer that.
5. [HL#4](holder-lock/spec.md#4-drivers-and-guarantee-levels) says the `event-seal`/`event-append` ranks are not in the registry table ([HL#7](holder-lock/spec.md#7-registry) lists ranks 10-80 with none at 58 or 70). [ES#4](event-store/spec.md#4-layering-and-locks) says they are "two new registry rows". This is consistent (planned) but only if the reader notices.
6. [PF L3](platform-foundations.md) retains the original clause text 1 and 4 and a note that they are superseded. A reader scanning the text without the note would take them as live.

## Budget notes

- Used exactly 8 distinct files. The entrypoint, the two specs, Event Store (read twice, counted once), `component-boundary.md` (read, then grepped), governance, foundations and the architecture map (headings, ranges, grep).
- Pressure points: `event-store/spec.md` (797 lines) and `component-boundary.md` (1630 lines) both truncated. I had to read ES in two pages and I did not read the rest of CB. For Scenario C that is the main uncertainty.
- Out-of-scope reads: none.

Status: DONE
