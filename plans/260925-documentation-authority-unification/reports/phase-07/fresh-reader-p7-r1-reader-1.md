# Fresh-reader answer, reader-1

Identity: `reader-1:sonnet-session:a970e221f1a542328@2026-10-17`
Start timestamp: 2026-10-17T11:56:00Z (from `date -u +%FT%TZ` before opening anything)

All paths are under `docs/platform/`. "ES" = event-store/spec.md, "HL" = holder-lock/spec.md, "PS" = process/spec.md.

## Read log (ordered, eight distinct files)

0. READER-BRIEF.md (exempt from the budget): the contract.
1. README.md, whole file. Entry portal, area registry, authoring routes.
2. process/spec.md, whole file. Process facts and control, judge table.
3. holder-lock/spec.md, sections 1-10 and 14-21 (headers, purpose, ownership, port, drivers, description rules, registry and ranks, predecessor rule, main door, fence, known limits, decision history). Sections 11-13 were not read.
4. event-store/spec.md, headings, header, sections 1-4, 9, start of 10, 13, 15, 19-26 (partial reads). Sections 5-8, 10 (rest), 11, 12, 14, 16-18 were not read. I relied on cross-references for those.
5. platform-foundations.md, whole file up to L10 (L1-L5, L7 and L10 read in full; L6, L8 and L9 only in the summary table).
6. component-boundary.md, header, sections 1-5, section 4 table, targeted grep hits for "completion/settle/Herdr". The three "Added in candidate" carriage sections (about line 105 onward) were only grepped, not read in full.
7. governance.md, sections 3-5 and 11 (types, authority matrix, metadata, linking).
8. architecture-map.md, header, sections 1-5, and the carried section 5 "AUTHORITY", section 9 "Luật vận hành bản đồ".

That is 8 distinct files. Grep and head reads counted as opening. No out-of-scope read happened. I never opened any file outside the eight-file list. One note: an rtk tee-log hint in tool output pointed to `~/.local/share/rtk/tee/...`. I did not open it. One tool result was auto-saved to a tool-results file and I did not open it separately either.

Caveat on all answers: no implementation test, contract JSON or plan was opened. Every "implemented / not implemented" claim below is the corpus's own statement, not something I observed.

---

## Scenario A: lock timeout becomes takeover

**A1. Read first.** README.md (portal, row `holder-lock` and `process` in README.md#2-area-registry), then holder-lock/spec.md#1-purpose and #2-ownership-boundary, then process/spec.md#3-facts-the-judge-table. For authoring: README.md#4-how-to-change-platform-docs, governance.md#3-document-types.

**A2. Kind of work and where the claim belongs.** It is a change to two accepted area specs (a behavior/guarantee change), not a local fix. The "unreadable start time = dead" part belongs to the process area (PS#3, the judge table and its shared vectors, owner = Process component, L0). The "TTL takeover of a hung holder" part belongs to holder-lock (HL#2, HL#17, HL#19). The "signal a bare PID" part belongs to process control (PS#4). Because it moves who owns a decision (taking a lock from a live holder, signal authority), component-boundary.md#3-update-rule and #5-how-to-change apply: update the boundary entries or record `No component-boundary change`. It is not a new area.

**A3. Contracts touched and owners.**
- Process facts: judge vectors file `packages/process/contracts/process-facts.judge.v1.json` (PS#2). Owner: Process component. Rule: "Start time cannot be read ... -> unknown" (PS#3). Not opened by me.
- Holder-lock port and registry: `holder-lock.port.v1.json`, `lock-registry.v1.json`, `predecessor.v1.json` (HL#3, #7, #8, #21). Owner: Holder-lock component. HL#2 states it does not own "Taking a lock away from a live holder" and does not own liveness judgment.
- Signal by identity: PS#4 (`pidfd` on Linux, tuple checked before kill elsewhere, "never by bare pid"), consumed by `fgos lock fence` (HL#17).
- Component entries: component-boundary.md#4-current-high-level-components rows "Process Facts & Control (L0)" and "Holder-lock (L1)". Session Identity grants no lock authority (same table).
- Cross-reference not checked: `docs/platform/session-identity/spec.md`, `docs/specs/runner.md`.

**A4. Risk.** High. The proposal contradicts settled, accepted rules:
- HL#1: "no decision anywhere in the component is derived from a pid, a TTL, a start time or an mtime".
- HL#17 / HL#19: "A hung live holder is never taken over"; "There is no path that takes a lock from a live holder"; a person fences it. HL#20 records that the legacy 4-hour TTL lock was removed.
- PS#3 / PS#7: unreadable start time is `unknown`, which means hold, "never cleaned".
- PS#4 and PS#1: no signalling by bare pid (pid reuse window).
- HL#20 (2026-10-16 Lead decision A2/A3): no fallback to the retired TTL locks.
Status split: design Accepted for both specs. Implementation "In progress" for both (PS header; HL header). Landed per HL header: contracts and registry; crate, routes, facade, fences and the cutover of ten locks "land in parallel phases"; `fgos lock fence` is specified (HL#17) and "lands with the main-door track". So I cannot tell from these files that `fgos lock fence` exists today. The proposal itself is a draft/proposal with no standing. It also matters that a TTL takeover on a possibly alive holder could let two writers into the main checkout, merge slot, etc. (HL#14).

**A5. Proof for done.** Required (as the corpus states it, none run by me):
- A change to the judge table requires the shared vectors to pass in both cargo and the Node leaf (PS#3: "The same vectors are run by cargo and by the Node leaf, so there is no second judge table"). A vector would have to prove an unreadable start time maps to a result and that the zombie / pid-reuse cases still hold.
- Description-rule leak tests and borrow vectors (HL#5 rules 3, 8) with real git; doctor checks `lock-borrow-vectors`, `lock-holders`, `lock-kernel-semantics` (HL#4, #5).
- Kill/identity tests for `signal_by_identity` (PS#4) and the `fgos lock fence` flow (HL#17).
- Platform acceptance: `cargo check` for windows-msvc and aarch64-darwin (PS#5).
- Repo-level L5 proof: `npm test` green and a matching test per changed behavior (README.md#4 item 7 points at L5; I could not verify the full text of the "AGENTS" proof rule because root instructions are out of scope).
Observed by me: none. I read text only.

**A6. Learning to leave behind.** A dated decision entry in the "Lịch sử quyết định" of both specs (PS#8, HL#20 are the existing places) naming who decided, plus a supersession of any rule changed (platform-foundations.md#2-authority: change a law by superseding the decision record). If the proposal is rejected, record the rejection and the verification source briefly in the same history section. Settled facts: update PS#3 / HL#19 only if they change.

**A7. Authoring probe.** Claim: "An unreadable process start time is sufficient proof that a cold lock is free."
- Classification: a normative behavior claim about process facts and lock ownership. It is false against the corpus, not a settled fact. If someone wanted to author it, it is a Proposal (governance.md#3-document-types: "Proposal = Non-canonical candidate") plus, only after acceptance, a Decision record and a spec amendment. A Spec may establish current behavior, not propose it (governance.md#4-authority-matrix). It must not be written into PS#3 as current fact.
- Owning candidate location: process/spec.md#3-facts-the-judge-table (fact) with holder-lock/spec.md#2-ownership-boundary (consumer); proposals go to the cross-area collection `proposals/README.md` (named in README.md#4; I did not open it, so I cannot say whether that file exists in the corpus).
- Required metadata (governance.md#5-metadata): Document type, Audience, Purpose, Design status, Implementation, Provenance, Writer type, Canonical for, Use this when, Do not use this for, Last reviewed, Related; plus an implementation-alignment table row (design claim / implementation status `planned` / evidence / gap) because design may move ahead of implementation.
- Body links and registrations (governance.md#11-linking-discipline): a Spec links area README, owned and consumed contracts, architecture, verification, platform laws; a Contract links owner, consumers, source, tests; `Related:` metadata paths must also appear as markdown links in a Related Files section with typed labels (`defines`, `constrains`, `consumes`, `supersedes`). Registration: the area row stays in README.md#2-area-registry; the judge-vector contract JSON must change in step; component-boundary.md#3-update-rule (update or record `No component-boundary change`).

---

## Scenario B: faster Event Store publication

**B1. Read first.** README.md row `event-store` (README.md#2-area-registry), then event-store/spec.md header and #26-decision-record, #2-decisions-this-spec-implements, #23-proof-gates; platform-foundations.md#l3--luật-store-truth--jsonl-db-là-view and its "Đã bị thay một phần" note; holder-lock/spec.md#15-hot-state-mutex-and-porting-events-pending.

**B2. Kind of work and where the claim belongs.** An implementation proposal against an accepted-but-unimplemented component, and it reopens decisions. The write path, seal and reader belong to the Event Store component (ES#3 owns: open logs, append, `fsync`, seal, reader). Lock ordering is a shared obligation with holder-lock (ES#4 declares two registry rows; HL#7 ranks). The Work gate belongs to the consumer (Work; ES#13: "The gate is Work's, not the store's"). It is not a "faster implementation" tweak because it contradicts decisions the owner signed.

**B3. Contracts and owners.**
- Event Store contracts (planned): `packages/event-store/contracts/` (ES header "Contracts (planned)"). Owner: Event Store. Does not exist yet by the corpus's own statement ("Implementation status: Not started").
- Lock rows `event-seal` rank 58 and `event-append` rank 70, kind mutex (ES#4). Owner of the registry: holder-lock (HL#7); Event Store "only declares its two lock rows" (ES#3). Note: HL#7's rank table does not list ranks 58 or 70 (contradiction/gap, see below).
- Work gate `state` hot-mutex rank 60 (`withStateTx`), owner Work/plan 4.3-S (ES#13, HL#15).
- L3 / L7 laws: platform-foundations.md L3, L7 durability levels D2/D4/D5.
- Consumers: Work, porting, observe, work-state read through the crate (ES#20).
- Not opened by me: `plans/261016-1306-main-checkout-single-door-hot-lock/plan.md`, `docs/platform/session-identity/spec.md`.

**B4. Risk.** High, and the "already approved and implemented" claim is wrong on both counts.
- Settled (owner decision): D-ADR0055 signed 2026-10-17 (ES#26): ack after `fsync`, seal into commits on `refs/fgos/events/<machine-id>`, views are rebuildable caches. README.md#2-area-registry says the same ("Signed durability design").
- Draft/provisional: the ES header says the signature is "the contract for starting implementation under the gates of section 23; it does not claim the design is proven" and ES#2 says the owner chose direction B "provisionally"; the gates confirm or reopen it.
- Implemented: no. ES header: "Implementation status: Not started"; README row says "implementation not started ... navigation does not implement it". Appearance in the corpus is not approval of the proposed variant or implementation.
- Concrete conflicts with the signed text:
  - "Ack before fsync": ES#9 step 6 defines the ack point as the end of step 6, after `fsync` (and dir `fsync` on create). Acking earlier loses the stated crash guarantee and the D5 vs D2 durability claim.
  - "Seal while the Work gate is held": ES#4 says `event-seal` (58) under `state` (60) throws `lock-order-violation`; the facade refuses with `event-store-seal-under-state`; ES#13 "No commit-DAG walk, no git call and no process spawn runs inside the gate".
  - "Only a SQLite view, no replayable history": contradicts D-ADR0055 and L3 clause 2 (view must be rebuildable by replay, platform-foundations.md L3, kept by the note). ES#15 says a view is "never truth, rebuildable from zero". ES#25 says SQLite engine choice is the consumer's concern only for the view.
  - Direction B vs "second operational database": ES#2 first table row rejected the second operational database.
- Also open risk the corpus itself lists: unsealed events are lost with the disk (ES#22), cross-machine success is provisional (ES#22).

**B5. Proof for done.** Required, from ES#23.2 (none observed by me; implementation not started): kill matrix on the real crate with real holder-lock locks (SIGKILL during append write, after `fsync`, during rotation, between rotation rename and `hwm.json`, after object write, after `update-ref`, after receipt, after delete); reader-versus-seal stress of at least 10,000 interleavings including the C1/C2/C4 regression vectors; V-AUTH-01 (two processes race `moveWork` and the last worker slot); V-SEQ-01 multi-clone reconciliation; three-machine test and owner-authorized push to the real remote; legacy parity byte for byte; rollback export; latency via the N-API route (0 spawns inside the gate by `strace`); native addon distribution; ext4 power-loss simulation; V-DOOR-01 (`rg` finds no git invocation for `refs/fgos/*` outside the publication driver); topologies; setup/doctor vectors; full `npm test` and cargo tests. Observed by me: only the pre-signature results as written in ES#23.1 (a Python model check and a local-bare-repo git experiment); I did not open those reports and ES#23.1 itself says they do not prove the amended text or the Rust crate.

**B6. Learning to leave behind.** A superseding decision record, not an in-place edit (platform-foundations.md#2-authority; L3 note shows the pattern: D-ADR0055 superseded L3 clauses 1 and 4, text kept "as history"). Settled facts go in event-store/spec.md (sections 2, 26 and the "Changes from the draft" list); lock-order consequences go in holder-lock/spec.md#7-registry and #15; boundary effects in component-boundary.md (`No component-boundary change` or update). A faster-publication finding that is rejected belongs in ES#24-25 style evidence/out-of-scope notes.

**B7. Authoring probe.** Claim: "A SQLite cache is the canonical event truth and needs no replay source."
- Classification: contradicted claim, not a settled fact or a spec statement. It reverses L3 clause 2 (which the D-ADR0055 note says was kept) and ES#1, ES#15, ES#26. At most it is a Proposal (non-canonical) that would need to supersede D-ADR0055 and L3 by decision, with the owner (user decisions are not silently undone).
- Owning location: event-store/spec.md (#15-views-cursors-and-verbs for views; #26-decision-record for a supersession) and platform-foundations.md (L3 note).
- Required metadata: governance.md#5-metadata baseline plus optional `Supersedes:` / `Superseded by:` / `Approvers` fields for a higher-risk doc, and an implementation-alignment row with status `planned`.
- Body links and registrations: typed `supersedes` link to ES#26 and platform-foundations.md#l3--luật-store-truth--jsonl-db-là-view; link to holder-lock (rank rows) and component-boundary (state-write ownership); README.md#2-area-registry row text for `event-store` must change if status changes; changelog entry as ES#21 states for the verbs and keys (the root `CHANGELOG.md` was not opened).

---

## Scenario C: dashboard creates another completion writer

**C1. Read first.** README.md row `herdr-web-dashboard` (Candidate area portal, not in my read list) and `agent-coordination` / `runner`; then component-boundary.md#4-current-high-level-components (rows: Work Lifecycle Engine, Execution Core, Herdr, fgos Gateway, Host And Surface Layer), platform-foundations.md L10, architecture-map.md section 5 authority invariants and section 9.

**C2. Kind of work and where the claim belongs.** A new slice in the Host and Surface layer (a dashboard adapter), not a low-level process primitive. Registering it as a process primitive would put it under Process Facts and Control (L0), which owns only judging and signalling processes, "knows no run, lock or pane" (component-boundary.md#4 row; PS#1). The claim "who decides Work is done" belongs to the Work Lifecycle Engine (verbs `fgos return` and others; "only Work verbs mutate domain-agnostic Work lifecycle", component-boundary.md line near 1144, section "Work-attached session plus Work lifecycle") and the Run Result Evaluator for run results ("Run/RunResult settle truth"). The dashboard area portal `docs/platform/herdr-web-dashboard/README.md` is the likely home for slice documentation, but I did not open it.

**C3. Contracts and owners.**
- Work lifecycle write door: `moveWork` single write door, CTR002 single-write-door (platform-foundations.md L10 evidence; contract file not opened). Owner: Work Lifecycle Engine.
- Execution: `fgos run` via `bind()` is the "single run door for new work", owner Execution Core (component-boundary.md#4 row "Execution Core"). A "separate execution path" bypasses it.
- Run results: Run Result Evaluator is the confidence/evidence boundary (component-boundary.md#4 row; the advisory section: "Do not treat Run settlement or worker output as semantic truth").
- Gateway REST contract CTR010 and the Herdr/Gateway rows for the surface layer (component-boundary.md#4). Herdr is "in Host And Surface Layer only".
- Architecture invariants: architecture-map.md section 5, "control quyết - execution làm, không trộn"; Entry/surface layer must stay thin ("tag control không đặt trên cửa").
- Registration: architecture-map.md#9 rule 1, "module or slice mới phải có row §6 ... trước khi có code" plus `docs/architecture-manifest.json` and `test/architecture.test.mjs` (named, not opened).

**C4. Risk.** High for authority, low-to-medium for the dashboard UI itself.
- Settled: L10 (platform-foundations.md) forbids a parallel write path next to the door; a second path silently loses CAS, cycle-check, envelope and write-queue guarantees. Component-boundary says Herdr shows processes while Run/RunResult settle truth, and a worker's success is not semantic truth.
- Draft: component-boundary.md and architecture-map.md are both "Design status: Draft / Canonical: Yes, after review" (headers), so the authority is accepted-pending-review, and the carried advisory text is carriage. platform-foundations.md header is "Candidate / Canonical: No" yet it carries L10 text. This weakens but does not reverse the rule.
- Implemented: I cannot establish. The dashboard slice's own area portal was not read; the component table says the plugin and gateway exist, but "Implementation: Partial" at README level.
- A successful worker result becoming Work completion also conflicts with L9's separate run/merge/durable completion levels (summary row only in my read; full text not read) and L7 ("run complete is not merged is not durable").

**C5. Proof for done.** Required, never observed by me: the new slice must show (a) no state write from the adapter outside Work verbs (a test in the style of the single-write-door tests; not opened), (b) it routes execution through `fgos run`/`bind()`, (c) architecture test `test/architecture.test.mjs` passes with a manifest row and a section 6 row (architecture-map.md#9 rule 3), (d) L5 six-question answer, (e) `npm test` green with a new or changed behavior test. The brief's own L5 route: platform-foundations.md#4-design-gate (log/state, owner, contract, proof, learning).

**C6. Learning to leave behind.** A map registration (architecture-map.md section 6 row and manifest row, as the "ritual" in #9) and a component-boundary note (`No component-boundary change` if the dashboard only reads and calls verbs; otherwise update the row, component-boundary.md#5-how-to-change). If the slice is accepted as an adapter, record that completion stays with Work verbs in the slice's area spec history. A rejected "dashboard completes Work" should be recorded as a settled non-goal in the herdr-web-dashboard area spec (location not verified).

**C7. Authoring probe.** Claim: "The dashboard owns the decision that a successful worker run makes a Work item done."
- Classification: an authority claim that contradicts the boundary map. It is not a fact, not a spec statement. At most a Proposal that would require a boundary change decision, since it moves ownership of a state write and a decision (component-boundary.md#3-update-rule).
- Owning location for the true rule: component-boundary.md#4-current-high-level-components, row "Work Lifecycle Engine / Work Driver" (claim/return, human gates) and the Run Result Evaluator row. A slice doc would sit under the dashboard area (`herdr-web-dashboard/README.md`, name taken from README.md#2-area-registry).
- Required metadata: governance.md#5-metadata baseline plus an implementation-alignment table (status `planned`); if registered as a slice, the section 6 identity row first (architecture-map.md#9 rule 1, "thẻ căn cước trước code").
- Body links and registrations: area README links to spec/contracts/verification and subcomponent map (governance.md#11-linking-discipline); typed `consumes` links to Work lifecycle and `fgos run` contracts; `Related:` also as markdown links; component-boundary entry link because the area "owns or consumes a cross-area boundary"; architecture manifest row; contract version if a new contract is named (architecture-map.md#9 ritual step 2).
- Registering it as "low-level process primitive" would be a mis-classification: Process L0 owns only facts and control (PS#1, PS#2).

---

## Missing routes (things a stranger could not follow inside the eight files)

- No way inside the allowed set to see the herdr-web-dashboard, Work-state or runner area specs (README.md#2-area-registry links exist; none opened). Scenario C's completion owner comes from a carried advisory inside component-boundary.md, not from a Work spec.
- `holder-lock/spec.md` ranks table (HL#7) omits ranks 58 (`event-seal`) and 70 (`event-append`) that ES#4 says it adds; the registry JSON would be the real place, not opened.
- HL#11-13 (state root, cutover, setup) and ES#5-8, 10-12, 14, 16-18 were not read; section 12 (order) is the key to concurrency claims in Scenario B and I relied on cross-references.
- ES#9 mention of `fgos` verbs (`fgos events sync|status|export`) appears with no proof of existence; implementation status says not started.
- Anchor routes that look broken in README.md: `platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi` and `architecture-map.md#9-luật-vận-hành-bản-đồ`. The actual headings are "### L5 — Definition of done: sáu câu hỏi" and "#### 9 · Luật vận hành bản đồ"; standard slugging yields a double hyphen after the dash or the middle dot (`l5--definition-...`, `9--luật-...`). I could not render, so I treat these as likely broken.
- platform-foundations.md L5 is a candidate-file wrapper; the six questions are in its carried legacy section, which is "Candidate / Canonical: No".

## Contradictions and weak-authority points

1. platform-foundations.md header: "Design status: Candidate", "Canonical: No", "Canonical for: None until independent review" while README.md#1 lists it as the "Platform laws and durable constraints" anchor and event-store and others cite it as binding (L3, L7, L10).
2. README.md#3 says Phases 06-09 unauthorized and the documentation migration is "Proposed", yet README.md lists the area registry as settled routes. Authority location is still "transitional" (component-boundary.md header: "authority follows transitional switchboard"); the switchboard itself was out of scope.
3. component-boundary.md and architecture-map.md say "Canonical: Yes, after review" with `Design status: Draft`; README.md calls component-boundary an anchor. A stranger cannot tell if the Process/Holder-lock rows (added 2026-10-16) are reviewed.
4. HL header says the hot state mutex "is pending the event store decision" and HL#7 keeps rank 60 "reserved", while ES (signed) says it uses `state` rank 60 and declares new ranks 58 and 70 not yet in HL#7's table.
5. HL#1 "no decision is derived from a pid, a start time" vs PS#1 "facts ... serve ... the temporary hot path": consistent only if "cold lock decision" is read narrowly; HL#8 and PS#3-4 still use `judge` for `linux-gate` domain emptiness, which is a start-time-derived decision. The corpus says this is deliberate (domain primitives), but the headline sentence overstates.
6. ES cites `docs/platform/holder-lock/spec.md:114-126` and `:155` line numbers; in the corpus the rank table is within HL#7 and the rank rule is in HL#9 (not read), so those line citations are likely stale.
7. event-store/spec.md metadata contains both `Design status: Signed by the owner ...` and `Canonical: Yes`, with `Implementation status: Not started`; consistent with the brief but a skim reader may read "Canonical: Yes" as "implemented".

## Budget notes

- The eight-file budget was tight: event-store/spec.md (~100 KB), component-boundary.md (~92 KB) and architecture-map.md (~59 KB) cannot be read fully. I used targeted section reads and greps, so several sections stayed unread (listed above). Heading/grep reads were counted as opening the file.
- I read README, process, holder-lock, event-store, foundations, component-boundary, governance, architecture-map and nothing else. No search crossed into other files. No out-of-scope read occurred.
- Nothing was written to the corpus.

Status: DONE
