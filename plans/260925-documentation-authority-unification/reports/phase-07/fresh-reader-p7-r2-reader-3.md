# Fresh reader answer: reader-3

Identity: `reader-3:sonnet-session:aab9a52ae255b47e3@2026-10-17`
Start timestamp: 2026-10-17T12:01:56Z

All paths are under `docs/platform/`. I cite only headings I saw. Where an anchor is doubtful (a heading inside a carried legacy section, or one with special symbols) I give the file plus the heading text instead.

## Ordered read log (8 of 8 files, nothing else)

1. `README.md` (after READER-BRIEF.md): entrypoint, area registry, decision surface, how to change docs.
2. `holder-lock/spec.md`: lock ownership, port, ranks, predecessor rule, `fgos lock fence`, known limits. Read in several slices.
3. `process/spec.md`: judge table, control, ownership boundary, known limits.
4. `event-store/spec.md`: decisions, layering and locks, append and ack point, seal, Work gate, proof gates, decision record. Read via a heading listing plus slices. I did not read sections 5-8, 11, 12, 14, 17, 18, 20-22 in full.
5. `governance.md`: document types, authority matrix, metadata, linking, migration rule.
6. `platform-foundations.md`: law summary and the carried legacy law text (L1-L10, L3 supersession note).
7. `component-boundary.md`: section 4 component table, update rule, how-to-change, the advisory "High-Level Component Authority Register".
8. `architecture-map.md`: change rule, the carried section 6 component/slice registry, "Luật vận hành bản đồ" (section 9).

No out-of-scope read. Some long tool outputs were saved by the harness to a result file; I read only slices of the same allowed files. I followed no link outside the list. I did not open `session-identity/spec.md`, `herdr-web-dashboard/README.md`, `work-state/*`, `proposals/README.md`, `migration-authoring-rules.md`, or any contract JSON. I ran no tests and checked no contract contents.

## Scenario A: lock timeout becomes takeover

**A1. Read first.**
- `README.md` (area registry rows for `holder-lock` and `process`).
- Then [holder-lock/spec.md#1-purpose](holder-lock/spec.md#1-purpose) and [holder-lock/spec.md#2-ownership-boundary](holder-lock/spec.md#2-ownership-boundary).
- Then [process/spec.md#3-facts-the-judge-table](process/spec.md#3-facts-the-judge-table).
- Then [holder-lock/spec.md#17-fgos-lock-fence](holder-lock/spec.md#17-fgos-lock-fence) and [holder-lock/spec.md#19-known-limits](holder-lock/spec.md#19-known-limits).
- Finally the [component-boundary.md#4-current-high-level-components](component-boundary.md#4-current-high-level-components) rows "Process Facts & Control (L0)" and "Holder-lock (L1)".

**A2. Kind of work and where the claim belongs.**
- This is a change to the behavior of two accepted, in-progress low-level components, not a local fix. It is a design change to a Spec-level claim ([governance.md#3-document-types](governance.md#3-document-types)).
- The lock claim belongs to holder-lock (L1). The process-fact and process-control claim belongs to process (L0).
- The proposal contradicts settled text in both specs, so it cannot be a spec edit. It starts as a Proposal, which is non-canonical ([governance.md#4-authority-matrix](governance.md#4-authority-matrix)). If the owner accepts it, it needs a Decision that supersedes the old text (history section 20 of holder-lock, section 8 of process), plus a component-boundary check ([component-boundary.md#3-update-rule](component-boundary.md#3-update-rule)).

**A3. Contracts touched and their owners.**
- Lock ownership: holder-lock owns `acquire`, `release`, `probe`, `holders`, and the registry `packages/holder-lock/contracts/lock-registry.v1.json` ([holder-lock/spec.md#7-registry](holder-lock/spec.md#7-registry)).
- Process facts: process owns `judge` and its shared vectors `packages/process/contracts/process-facts.judge.v1.json` ([process/spec.md#2-ownership-boundary](process/spec.md#2-ownership-boundary)).
- Process control: process owns `signal_by_identity` ([process/spec.md#4-control](process/spec.md#4-control)). Holder-lock explicitly does not own the liveness judgment ([holder-lock/spec.md#2-ownership-boundary](holder-lock/spec.md#2-ownership-boundary)).
- Takeover of a hung holder is owned by no automatic path. The one door is a person running `fgos lock fence` ([holder-lock/spec.md#17-fgos-lock-fence](holder-lock/spec.md#17-fgos-lock-fence)).
- Predecessor-domain rule: [holder-lock/spec.md#8-the-predecessor-domain-rule](holder-lock/spec.md#8-the-predecessor-domain-rule).
- I did not open the contract JSON files and have not checked their contents.

**A4. Risk.**
- High. The proposal reverses a core invariant: no decision from a pid, TTL, start time or mtime ([holder-lock/spec.md#1-purpose](holder-lock/spec.md#1-purpose)).
- Three parts of the proposal conflict with the text:
  - An unreadable start time is `unknown`, so the holder is held and never judged dead ([process/spec.md#3-facts-the-judge-table](process/spec.md#3-facts-the-judge-table), [process/spec.md#7-known-limits](process/spec.md#7-known-limits)).
  - Signalling a bare pid contradicts "signal by identity, never by bare pid" ([process/spec.md#4-control](process/spec.md#4-control)). Linux uses `pidfd` plus a start-time check.
  - "There is no path that takes a lock from a live holder" ([holder-lock/spec.md#17-fgos-lock-fence](holder-lock/spec.md#17-fgos-lock-fence), [holder-lock/spec.md#19-known-limits](holder-lock/spec.md#19-known-limits)). The old TTL locks were retired on purpose, and the retirement is recorded in the holder-lock decision history.
- Pid reuse and a different PID namespace make a mis-kill of an unrelated live process plausible.
- Status:
  - Settled and accepted design: kernel lock, judge table, fence door.
  - Implemented: only judge vectors and the contracts and registry (header: "In progress"). The crate, routes, facade, fences and the ten-lock cutover land in parallel phases. I did not verify which have landed.
  - Draft: the proposal itself.

**A5. Proof of done.**
- Required, per the specs:
  - The same judge vectors pass in cargo and in the Node leaf ([process/spec.md#3-facts-the-judge-table](process/spec.md#3-facts-the-judge-table)).
  - The two-process kernel-semantics probe and the borrow vectors are green. Doctor checks `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders`; `fgctl` refuses activation on red ([holder-lock/spec.md#13-setup-doctor-and-activation](holder-lock/spec.md#13-setup-doctor-and-activation)).
  - Any new vector must show that an unreadable start time still yields `unknown` and `held`, and that no TTL path exists.
  - The L5 six-question test ([platform-foundations.md](platform-foundations.md), heading "L5 — Definition of done: sáu câu hỏi").
- Observed by me: none. I read the specs only and ran nothing.

**A6. Learning and decision to leave behind.**
- If the owner accepts any change, add a dated, signed entry in the owning spec's history. For holder-lock that is section 20, "Lịch sử quyết định". For process it is [process/spec.md#8-lịch-sử-quyết-định](process/spec.md#8-lịch-sử-quyết-định).
- Update the judge vector contract if the table changes.
- Check the boundary map or record `No component-boundary change` ([component-boundary.md#5-how-to-change](component-boundary.md#5-how-to-change)).
- If the proposal is rejected, keep the rejection reason as a known limit or history line. The current spec already says a hung live holder is stopped by a person.

**A7. Authoring probe: "An unreadable process start time is sufficient proof that a cold lock is free."**
- Classification: a false design claim. It contradicts the spec and is not a fact. It is not a Contract or Spec statement. At most it is a non-canonical Proposal, with Canonical: No, to be kept apart from the specs ([governance.md#4-authority-matrix](governance.md#4-authority-matrix)).
- Owning location, if ever accepted:
  - The fact portion would change the judge table in [process/spec.md#3-facts-the-judge-table](process/spec.md#3-facts-the-judge-table).
  - The lock portion would change [holder-lock/spec.md#3-the-port](holder-lock/spec.md#3-the-port).
- Metadata required ([governance.md#5-metadata](governance.md#5-metadata)):
  - Baseline: Document type, Audience, Purpose, Design status, Implementation, Provenance, Writer type, Canonical for, Use this when, Do not use this for, Last reviewed, Related.
  - For this risk level also: Owner, Approvers, Approved at, Supersedes, Superseded by, Evidence.
  - Plus an implementation-alignment table row with status `planned`.
- Body links and registrations required ([governance.md#11-linking-discipline](governance.md#11-linking-discipline)):
  - Markdown links to the holder-lock and process specs.
  - The contract and its vectors.
  - The component-boundary entry.
  - Supersession links to the decision it would replace.
  - A `Related Files` section, because `Related:` in metadata does not render as links.
- Registration location: a proposals area. `README.md` mentions `proposals/README.md` for cross-area proposals; I have not opened it.

## Scenario B: faster Event Store publication

**B1. Read first.**
- `README.md` (the `event-store` registry row: signed durability design, implementation not started, acceptance under proof gates).
- Then [event-store/spec.md#2-decisions-this-spec-implements](event-store/spec.md#2-decisions-this-spec-implements).
- Then [event-store/spec.md#9-append-the-ack-point](event-store/spec.md#9-append-the-ack-point).
- Then [event-store/spec.md#4-layering-and-locks](event-store/spec.md#4-layering-and-locks).
- Then [event-store/spec.md#13-work-gate-the-read-check-append-serialization-c1](event-store/spec.md#13-work-gate-the-read-check-append-serialization-c1).
- Then [event-store/spec.md#232-before-acceptance-of-the-implementation](event-store/spec.md#232-before-acceptance-of-the-implementation).
- Then the L3 text in `platform-foundations.md`.

**B2. Kind of work and where the claim belongs.**
- A change to the contract of an accepted-by-owner but not implemented area: Event Store (durability, ordering, publication).
- Owner of the claim: the Event Store component, [event-store/spec.md#3-ownership-boundary](event-store/spec.md#3-ownership-boundary). The decision of record is [event-store/spec.md#26-decision-record](event-store/spec.md#26-decision-record) (D-ADR0055).
- The platform law touched is L3, whose clauses 1 and 4 are superseded by D-ADR0055. The L3 supersession note is in the carried text of `platform-foundations.md` and in its law summary row.
- Dropping replayable history or acking early is not an edit. It reverses the signed decision, so it needs a new owner decision.

**B3. Contracts and owners.**
- Event Store owns the envelope, open logs, `fsync`, seal, reader, order, and sharing ([event-store/spec.md#3-ownership-boundary](event-store/spec.md#3-ownership-boundary)).
- The Work gate (a `state` hot-mutex, rank 60) belongs to the consumer (Work), not to the store ([event-store/spec.md#13-work-gate-the-read-check-append-serialization-c1](event-store/spec.md#13-work-gate-the-read-check-append-serialization-c1)).
- Locks as a mechanism belong to holder-lock. Event Store only declares two rows, `event-seal` (rank 58) and `event-append` (rank 70) ([event-store/spec.md#4-layering-and-locks](event-store/spec.md#4-layering-and-locks)).
- Views and caches belong to their consumers.
- The reference to lock ranks is in [holder-lock/spec.md#7-registry](holder-lock/spec.md#7-registry). That table has no 58 or 70 row (see contradictions).

**B4. Risk.**
- Durability:
  - The ack point is after `fsync` of the committed batch ([event-store/spec.md#9-append-the-ack-point](event-store/spec.md#9-append-the-ack-point)).
  - Acking before `fsync` would make an acked event survive neither a process crash nor an OS crash, and would violate the stated guarantee.
  - Until sealed, events are L7 level D5 (this machine only).
  - The loss budget is in [event-store/spec.md#16-seal-cadence-and-loss-budget](event-store/spec.md#16-seal-cadence-and-loss-budget). I saw only its title and the default (300 s interval) in section 2.
- Publication and lock ordering:
  - Seal inside the Work gate is forbidden. `event-seal` (58) under `state` (60) throws `lock-order-violation`, and the facade refuses with `event-store-seal-under-state` ([event-store/spec.md#4-layering-and-locks](event-store/spec.md#4-layering-and-locks)).
  - Also no commit-DAG walk, no git call and no process spawn is allowed inside the gate (section 13).
  - Append inside the gate is allowed: `state` (60) then `event-append` (70).
- SQLite-only view without replayable history: contradicts "every view is a rebuildable cache" and L3 clause 2, which is kept ([event-store/spec.md#26-decision-record](event-store/spec.md#26-decision-record), [event-store/spec.md#2-decisions-this-spec-implements](event-store/spec.md#2-decisions-this-spec-implements)).
- "Already approved and implemented" is half wrong:
  - Settled: the owner signed D-ADR0055 on 2026-10-17. The spec is "the contract for starting implementation".
  - Not settled: it explicitly "does not claim the design is proven" and the owner chose direction B provisionally.
  - Implementation status: "Not started". `README.md` says "navigation does not implement it".
  - Two pre-signature agent proofs are done (a model check and a local git experiment). They are about a Python model and a local bare repository, not the Rust crate ([event-store/spec.md#24-evidence-and-its-limits](event-store/spec.md#24-evidence-and-its-limits)).

**B5. Proof of done.**
- Required: all of [event-store/spec.md#232-before-acceptance-of-the-implementation](event-store/spec.md#232-before-acceptance-of-the-implementation). Highlights:
  - Kill matrix with SIGKILL at each step.
  - At least 10,000 reader-versus-seal interleavings.
  - V-AUTH-01 (two worktrees racing `moveWork`).
  - V-SEQ-01 (multi-clone reconciliation).
  - Three-machine test.
  - Legacy parity, rollback, latency (strace shows 0 spawns inside the gate), N-API addon distribution, and power-loss on ext4.
  - V-DOOR-01 (no git writes of `refs/fgos/*` outside the publication driver).
  - Setup and doctor vectors, full `npm test` and cargo.
- Observed by me: none. I cite the done pre-signature proofs only as the spec's own statement.

**B6. Learning and decision to leave behind.**
- Any reversal needs a new decision that supersedes D-ADR0055, recorded in the Event Store spec's decision record and in the L3 note ([platform-foundations.md](platform-foundations.md), heading "L3 — Luật store: truth ở JSONL, db là view").
- An implementation that passes the gates updates the implementation status and removes the "Not started" line.
- Section 19 lists what the cutover removes ([event-store/spec.md#19-what-this-removes](event-store/spec.md#19-what-this-removes)).
- A boundary note for any change in who writes events (see [component-boundary.md#5-how-to-change](component-boundary.md#5-how-to-change)).

**B7. Authoring probe: "A SQLite cache is the canonical event truth and needs no replay source."**
- Classification: false claim. It contradicts D-ADR0055 and L3 clause 2. At most a Proposal that seeks to supersede.
- The owning document would be [event-store/spec.md#26-decision-record](event-store/spec.md#26-decision-record), with a new Decision record. A Decision is "Canonical decision provenance" per [governance.md#3-document-types](governance.md#3-document-types).
- Metadata: as in A7, plus Supersedes naming D-ADR0055.
- Body links and registrations: link to the Event Store spec, to `platform-foundations.md` (L3), to `component-boundary.md`, and to the holder-lock rank rows. Update the L3 supersession note, and keep the old text as history.
- The "SQLite is out of scope" statement is in [event-store/spec.md#25-out-of-scope](event-store/spec.md#25-out-of-scope). It says the view engine is the consumer's concern, not that the view may be truth.

## Scenario C: dashboard creates another completion writer

**C1. Read first.**
- `README.md` (registry row `herdr-web-dashboard`, a candidate area portal I did not open).
- Then [component-boundary.md#4-current-high-level-components](component-boundary.md#4-current-high-level-components) (Execution Core, Herdr, Gateway, Host And Surface, Work Lifecycle Engine rows).
- Then the "High-Level Component Authority Register" inside `component-boundary.md` (the Host And Surface Layer and Run Result Evaluator rows).
- Then `platform-foundations.md` L9 and L10.
- Then [process/spec.md#2-ownership-boundary](process/spec.md#2-ownership-boundary) and [architecture-map.md#4-change-rule](architecture-map.md#4-change-rule).

**C2. Kind of work and where the claim belongs.**
- A new cross-cutting slice at the Host and Surface layer, with a proposed second write path for lifecycle state.
- Its claim belongs under the `herdr-web-dashboard` area as a slice, with state authority staying in the Work Lifecycle Engine (work-state area). I did not open either doc.
- It is not a process primitive. The process component owns only facts and control, and "knows nothing about a run, an envelope, a lock or a pane" ([process/spec.md#1-purpose](process/spec.md#1-purpose), [process/spec.md#2-ownership-boundary](process/spec.md#2-ownership-boundary)). Starting a process does not make something a process primitive.

**C3. Contracts and owners.**
- The Work Lifecycle Engine owns lifecycle, claim/return, and human gates. "Returns evidence/recommendations only; Work verbs decide lifecycle" (Work Lifecycle Engine row in section 4; the authority-register collaboration sketch).
- The Execution Core owns `bind()`, the single run door `fgos run`, and the mutating gate, and forbids dependencies on `src/state/**` (the Execution Core row, [component-boundary.md#4-current-high-level-components](component-boundary.md#4-current-high-level-components)).
- The Run Result Evaluator owns the confidence decision for one Run.
- The Host and Surface Layer translates interactions into engine calls "without becoming lifecycle or evidence truth" (authority register row).
- Done-ness: merge-complete `done` is declared by the approve/merge gate (CTR005). A worker success is only run-complete `proposed` ([platform-foundations.md](platform-foundations.md), heading "L9 — Thang hoàn tất của MỘT việc: run ≠ merge ≠ durable").
- One door: [platform-foundations.md](platform-foundations.md), heading "L10 — Add-through-not-alongside: mở rộng QUA cửa, không đắp CẠNH cửa" (extend `moveWork`, never add a parallel write path).
- CTR002 (single-write-door) and CTR005 appear by name in carried text. I did not open the contracts.

**C4. Risk.**
- High. Three separate violations:
  - A second execution path beside `fgos run` (Execution Core, single run door).
  - Treating a successful worker result as final completion, which merges run-complete and merge-complete (L9).
  - A surface adapter writing lifecycle state directly, which is a second write path and silently bypasses CAS, cycle checks, the envelope and the write queue (L10).
- Settled: the L9 and L10 laws and the component authority split.
- Draft: the new slice. Nothing implemented.
- Registration as a "low-level process primitive" is a category error (see C2).

**C5. Proof of done.**
- Required for any accepted version:
  - The registration ritual: first the slice row (planned, with a PBI), then a contract, then code. Checks run in `test/architecture.test.mjs` through `docs/architecture-manifest.json` ([architecture-map.md](architecture-map.md), heading "9 · Luật vận hành bản đồ").
  - A recorded boundary check, or `No component-boundary change` ([component-boundary.md#3-update-rule](component-boundary.md#3-update-rule)).
  - A test that a successful worker result leaves the item `proposed`, and only the merge gate moves it to `done`.
  - A test or check that no surface adapter writes lifecycle state outside the `moveWork` door.
  - The L5 six questions.
  - `npm test` green (named in `README.md`'s links but not in the allowed files, so I did not read its wording).
- Observed by me: none.

**C6. Learning and decision to leave behind.**
- If the slice is built through the correct door: a slice row in `architecture-map.md` section 6 (the "Slice - sắp cắm" table), and a note in the herdr-web-dashboard spec.
- If the owner insists on moving completion authority: a Decision that supersedes the L9/L10 reading, with an update to `component-boundary.md`. Do not edit the laws in place ([platform-foundations.md](platform-foundations.md) section 2: "Changing a law requires superseding its decision record").
- Record the rejected shapes in the area history so the next author does not re-propose them.

**C7. Authoring probe: "The dashboard owns the decision that a successful worker run makes a Work item done."**
- Classification: an authority-violating claim. A surface may not establish lifecycle truth ([governance.md#4-authority-matrix](governance.md#4-authority-matrix), "Generated doc/Guide must not establish..."; component-boundary Host And Surface row). It cannot be a Spec or a Decision. At most a Proposal.
- Owning location: not the dashboard area. The Work Lifecycle Engine owns this decision (work-state area, which I did not open).
- Metadata: the baseline fields plus Canonical: No, Supersedes (L9/L10 reading), and an implementation-alignment table with status `planned` ([governance.md#5-metadata](governance.md#5-metadata)).
- Body links and registrations:
  - Links to the work-state spec, the herdr-web-dashboard area, `component-boundary.md` and `platform-foundations.md`.
  - A `Related Files` section ([governance.md#11-linking-discipline](governance.md#11-linking-discipline)).
  - A component-boundary note, because it would move state-write authority.
  - A section 6 slice row in the architecture map before any code.

## Missing routes

- `component-boundary.md` section 4 has no Event Store row. A grep shows "event store" only in the Holder-lock row and in a legacy-advisory list, so a reader of the boundary map cannot find the Event Store owner there. The route exists only through the `README.md` registry row.
- `README.md` registers `session-identity` nowhere, yet holder-lock, process and event-store all depend on it. Its spec sits outside my allowed set.
- No allowed file states how to register a new low-level primitive (for example "what makes something an L0 or L1 component"). I inferred it from the process and holder-lock ownership tables and the `README.md` map-registration ritual link.
- The dashboard's authoritative scope (`herdr-web-dashboard/README.md`) and the Work state machine (`work-state/*`) are outside the allowed set. For C I could cite only boundary rows, not the owner spec.
- The path from a decision to its record is described in several places (spec history sections, `docs/decisions/`, D-ADR ids). Which one is the official place for a new Decision is not stated in the allowed files.

## Contradictions and stale spots

- `event-store/spec.md` section 4 gives rank 58 (`event-seal`) and 70 (`event-append`) and cites `holder-lock/spec.md:114-126` for the rank table. The rank table in [holder-lock/spec.md#7-registry](holder-lock/spec.md#7-registry) has no 58 or 70 row, and its section 15 says the state locks are "pending" the event store decision. The decision is now signed, so holder-lock's text is stale or the registry rows live only in the contract JSON, which I did not open.
- `component-boundary.md` Holder-lock row repeats "until the event store decision", which is now made.
- `platform-foundations.md` header says Canonical: No and calls itself a candidate carrying the legacy source, yet `event-store/spec.md` (Canonical: Yes) supersedes clauses of the law via that same law. The L3 supersession note is present in both the summary row and the carried text, so the content agrees but authority is split.
- `README.md` says the cutover has not happened ("legacy sources remain in place"), while the brief asks me to read the corpus as it will be after cutover. `governance.md` is "Candidate / Canonical: No" yet `README.md` points authors at it. I treated governance rules as operative, as the brief directs.
- Metadata field names differ: the three specs use `Implementation status:` and have no Provenance, Writer type, Canonical for, Use this when or Do not use this for, which [governance.md#5-metadata](governance.md#5-metadata) lists as the required baseline.
- `README.md` says process is "judge vectors landed", consistent with the process header, but its section 3 table points at plan files, not the spec, for the implementation state. Minor.

## Budget notes

- Used 8 of 8 files. I ran out of budget slack, so I could not open the area portals for the dashboard or work-state, `session-identity`, or any contract file. Scenario C is the weakest answer because of that.
- The event-store spec is about 99 KB, the component-boundary about 92 KB, and the architecture-map about 59 KB. I read them selectively, so I may have missed relevant text in event-store sections 5-8, 11, 12, 14, 17, 18 and 20-22, and in the long carried legacy sections of the other two files.
- No accidental out-of-scope read.

Status: DONE
Summary: 8 files read.
- A: reject. TTL takeover and bare-pid kill contradict the judge table (unknown, held), "signal by identity", and "no path takes a lock from a live holder". The only door is `fgos lock fence`.
- B: reject as proposed. Ack is after `fsync`, seal under the Work gate is a lock-order violation, and the view is a rebuildable cache. The design is signed (D-ADR0055) but its implementation is not started and its gates are unmet.
- C: reject. A surface adapter writing lifecycle state and treating a worker success as done violates L9 and L10 and the authority split. It is not a process primitive, and the correct door is a planned slice row, a contract and a boundary check.
