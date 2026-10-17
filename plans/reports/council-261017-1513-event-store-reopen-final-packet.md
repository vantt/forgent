# Event store reopen council: final packet (round 2)

Run `wf-run-1792222330384-ad2d44f3`, synthesis unit `unit-run-1792222330505-218f2eca` producer round 2, checked by reviewer (pass) and red-team (six findings, in the unit's red-team/2 report). Owner answered the close gate on 2026-10-17: no outside experts; model check and a local git ref experiment become agent tasks; M1-M4 to be amended; route N-API with no exec-guard exception; cross-machine provisional success accepted; unsealed loss cap as spec v2.

```json
{
  "packet": "event-store-spec-v2-revisit",
  "round": "producer 2 of unit-run-1792222330505-218f2eca: fixes the six red-team round-1 findings against final-packet-1.json; nothing else changed",
  "status": "recommendation-only; no council consensus and no owner approval is claimed",
  "target": "docs/platform/event-store/spec.md at commit 232d61eb8 (spec v2 by unit-run-1792220971707-80c6bff1) plus V-SPAWN-01 baseline (unit-run-1792220971867-6b11971a, plans/reports/experiment-261017-1431-event-store-v-spawn-01.md)",
  "verdict": {
    "blockingFindingsOfCouncil2": "All fixed in substance. The critic's six rejection reasons (C1 read-check-append gate, C2 wall-clock order, C3 reader versus seal, experiment 2 overclaim, rollback against replay order, O1-O7 labels) each have a concrete replacement in the spec, and red-team round 2 F1-F4 are resolved or made moot by the owner's Q1. Red-team round 2 F5 (SQLite expertise) is rejected with a stated reason, not silently dropped.",
    "implementationContract": "Not yet sufficient. Four text amendments are needed before it can serve as the implementation contract: M1 the latency budget measures something no route can meet, and its corrected form must say which route it excludes; M2 the cross-stream order is a non-transitive comparator, not a defined algorithm; M3 one agent-chosen default is listed as an owner decision; M4 the ref chain is a commit DAG (promote commits and shared-machine-id merge commits have two parents) but the merge commit's tree and the DAG walk are undefined. None needs a redesign. After those, the spec is sufficient to start implementation under the proofs of its section 23, which it already names as gates. This is not a claim that the design is proven or closed: the owner's choice of B is provisional ('tạm chọn B'), and the gates, not this packet, confirm or reopen it.",
    "authority": "Implementation that acknowledges at fsync still needs the owner's signature of the section 26 decision (supersedes L3 clauses 1 and 4 of ae461c8b and D-ADR0003). Agents do not supersede L1-L10. The program board's F10 barrier (no edit to .gitattributes, the .fgos strip rule or merge=union until D1 concludes) is respected: the spec removes the merge=union line only in the cutover after that signature. Advisory seats, this producer included, cannot close or reopen the owner's design; they can only recommend.",
    "designPrinciples": "One Door: holds, with one named temporary exception (the crate's publication driver is a second git caller beside the 4.3-R main door, on the disjoint refs/fgos/* namespace, until the Git component exists; the truncation guard's fallback git commit is deleted, so the count of git callers does not grow). Bottom-up layering: holds; publication takes no rank-50 lock and never calls the runner-layer main door. Hexagonal: holds through the publication port and the storage-location port. Rust first: holds; the core is one crate. Route: under the default of 0 spawns inside the Work gate, only the N-API addon qualifies; the per-call host facade of spec section 17 spawns inside the gate and qualifies only if the owner grants the named exec-guard exception and it then meets the in-gate budget on ext4 with its spawns counted. Correctness first: holds as a contract through the kill matrix, model check and stress test gates. KISS/DRY: holds; one log per stream, no overrides, fgos rebuild kept as the one rebuild door. One authority and transparent documentation: violated in one place (M3)."
  },
  "evidence": [
    {"claim": "Committed spec equals the producer's v2 text plus an integrated V-SPAWN-01 table in section 17", "source": "git show 232d61eb8:docs/platform/event-store/spec.md lines 330-360; producer report unit-run-1792220971707-80c6bff1 agent-report.md"},
    {"claim": "C1 fixed: Work's read-check-append section kept under withStateTx on state rank 60; 'per-writer lock, writers never contend' withdrawn", "source": "spec section 13; src/state/store.mjs:222-226 (refreshView, withEventsLockAndRefresh); packages/holder-lock/contracts/lock-registry.v1.json:164-170 (state hot-mutex rank 60, v1Path events.lock and claims.lock)"},
    {"claim": "C2 fixed: order by per-stream seq and a seen vector; ts only a last tie-break", "source": "spec sections 6, 9 step 5, 12"},
    {"claim": "C3 fixed in design: rotation instead of truncation, delete after verified receipt, reader reads active then closed then ref; model check and 10,000-interleaving stress test required before code acceptance", "source": "spec sections 10, 11, 23 item 2"},
    {"claim": "Rollback fixed: legacy import keeps file names so (ts, file, seq) order is preserved; rollback is a legacy-layout export with a legacy-fold parity report", "source": "spec section 18; src/state/replay.mjs:876-880 (sort by ts, file, seq)"},
    {"claim": "Red-team round 2 F2 (layer inversion through the 4.3-R main door) resolved: publication is plumbing on refs only, takes no rank-50 lock, never calls withMainCheckout or checkpointMainFgos", "source": "spec section 4; docs/platform/holder-lock/spec.md:114-126 (ranks 50, 55, 60)"},
    {"claim": "Lock ranks are consistent: event-seal 58 cannot run under state 60; event-append 70 may run under state; the sealer holds event-append only for a rename", "source": "spec section 4; docs/platform/holder-lock/spec.md:155 (ascending-rank rule, lock-order-violation)"},
    {"claim": "Red-team round 2 F4 resolved: read boundary stated (own-clone unsealed events visible to every worktree from ack; foreign after seal, push, fetch); crash recovery automatic on the next command, not doctor --fix", "source": "spec section 10 recovery table, section 11 read boundary"},
    {"claim": "Exec guard constraint is real: plan 4.3 P01 throws exec-under-hot-lock on any child_process call inside the hot critical section", "source": "plans/261016-1306-main-checkout-single-door-hot-lock/phase-01-hot-lock-core.md:19"},
    {"claim": "The spec's host facade route is a per-call process ('fgos internal event-store ... per call, like lock-fd'), two spawns per mutation, needing an owner-approved exception to the exec guard; the spec forbids a dedicated Event Store daemon, so no persistent-process facade is on the table; append runs inside withStateTx", "source": "docs/platform/event-store/spec.md:342 (no daemon), :348-349 (route table), :262 (section 13 step 2), :493 (route is the owner's question)"},
    {"claim": "The 570 ms convoy figure is an estimate, not a measurement", "source": "docs/platform/event-store/spec.md:349 ('red-team round 2 estimated a convoy near 570 ms'); V-SPAWN-01 measured the current CLI, not any Event Store route"},
    {"claim": "The ref chain already holds two-parent commits: a seal commit carrying a promote event has the branch tip as second parent; a diverged shared machine id gets a merge commit with both tips as parents and seal.json {kind: merge}; section 10 defines the tree only for kind seal (exactly events.jsonl and seal.json); section 10 step 2.1 reads 'the own stream's last sealed seq from the ref chain' and section 11 step 3 'walks the chain back', both written as if linear", "source": "docs/platform/event-store/spec.md:148 (promote second parent), :194-198 (seal tree), :285 and :293 (merge commit), :222 (walk the chain back)"},
    {"claim": "Work's cache view is .fgos/cache/state.json, not SQLite; a consumer may pick SQLite, and that engine's concurrency is then the consumer's concern", "source": "docs/platform/event-store/spec.md:299; :463 (section 25)"},
    {"claim": "The remote serving refs/fgos/* is already a named acceptance gate against the owner's real remote, and fetching the custom namespace is handled by a setup-written fetch refspec into a mirror namespace", "source": "docs/platform/event-store/spec.md:447 (section 23 item 5), :279 (fetch refspec); git remote -v shows origin on github.com"},
    {"claim": "After cutover the claim path no longer needs main-checkout (it took it only for checkpointMainFgos); that removal is the second half of 4.3-S P04", "source": "docs/platform/event-store/spec.md:391"},
    {"claim": "V-SPAWN-01 baseline p95 at 1/10/20 sessions: take 2,174/19,521/37,430 ms; move 125/290/480 ms; settle 776/873/1,556 ms; one traced take made 983 clones and 984 execve; measured end-to-end from CLI spawn to exit on tmpfs, not ext4", "source": "unit-run-1792220971867-6b11971a report-1.md; spec section 17"},
    {"claim": "Claim latency is dominated by waiting on main-checkout.lock and by process fan-out, both outside the event store", "source": "V-SPAWN-01 report 'Lock wait' paragraph (observed holder on .fgos/main-checkout.lock); spec section 20 notes claim takes main-checkout only for checkpointMainFgos"},
    {"claim": "Seal cadence default was chosen by the agent, not the owner", "source": "memory event-store-decisions.md: 'Seal cadence default chosen by the agent'; owner request text names B, cache view, claims runtime, Q1 (a), three machines, but no cadence; spec section 2 table row 9 and section 16 header 'Owner default'"},
    {"claim": "F10 barrier scope", "source": "plans/261017-1313-fgos-platform-program-board/plan.md:96 ('không ai sửa cho tới khi D1 có kết luận')"},
    {"claim": "Citations spot-checked and matching: .gitattributes:15 merge=union for .fgos/events/*.jsonl; src/cli/command-registry.mjs:1393 rebuild verb; 90 tracked shards under .fgos/events", "source": "repository read in this run"}
  ],
  "alternatives": [
    {"id": "A1", "option": "Accept v2 as the implementation contract now", "assessment": "Rejected: M1 makes proof item 8 unpassable by any route, M2 leaves cross-machine determinism (proof item 4) undefined, and M4 leaves the shared-machine-id merge of proof item 5 untestable, so the contract would fail its own acceptance gates."},
    {"id": "A2", "option": "Amend v2 with M1-M4 (text only), run the remote refs probe first, then present section 26 for owner signature", "assessment": "Recommended. Each amendment is local to sections 2, 10, 11, 12, 14, 16, 17 and 23."},
    {"id": "A3", "option": "Send v2 back for a third full rewrite", "assessment": "Rejected: no finding changes the architecture (refs, gate, locks, reader, migration); M4 defines a commit shape and a walk the spec already relies on. A rewrite would delay the critical path ES -> 4.3-S -> 6.2 P09 for no gain."},
    {"id": "A4", "option": "Pick the Node-to-Rust route now", "assessment": "Not adopted by this producer, because the facade's fate is the owner's exec-guard decision (spec section 26 question 3), not an agent's. Stated plainly: under the default of 0 spawns inside the gate, the per-call host facade is excluded and N-API is the only qualifying route. If the owner grants the exception, the facade qualifies only by measurement on ext4 with its two spawns counted inside the in-gate budget; the 570 ms convoy is an estimate until then."}
  ],
  "attributedFindings": [
    {"id": "M1", "by": "producer (this revisit), from V-SPAWN-01 data; route consequence made explicit after red-team round-1 F1", "severity": "blocking for the contract", "section": "17, 23 item 8", "finding": "The budget 'p95 at most 50 ms at 20 sessions' is stated for claim, move and settle end to end, and V-SPAWN-01 measures end to end from CLI spawn to exit. Move at one session already takes p95 125 ms (Node startup plus host resolution), so no Event Store route can meet the target on that metric; proof item 8 cannot pass. The 37 s claim tail and 983 spawns belong to main-checkout waiting and process fan-out outside the store.", "fix": "Split the budget: (a) Event Store increment inside the Work gate (read catch-up, append with fsync, fold) measured with an absolute p95 at 20 sessions on ext4 (50 ms remains a producer-proposed default), with 0 spawns inside the gate unless the owner grants the named exec-guard exception, in which case the spawns are counted inside that p95; (b) end-to-end CLI p95 not worse than the V-SPAWN-01 baseline. State in section 17 that under the default the per-call host facade is excluded. Name the claim fan-out and main-checkout wait as a separate item tied to 4.3-S P04, not an Event Store acceptance item. Remeasure on ext4, because tmpfs fsync costs nothing."},
    {"id": "M2", "by": "producer (this revisit)", "severity": "blocking for the contract", "section": "12, 23 item 4", "finding": "Section 12 defines causal precedence (seen and seq) and says concurrent events are 'ordered by (ts, origin, stream, seq)'. Mixing a partial order with a timestamp tie-break as a pairwise comparator is not transitive (a before b causally, b before c by ts, c before a by ts is possible), so a sort can return engine-dependent results. Three machines could then build different views from the same events, which section 23 item 4 forbids.", "fix": "Define the algorithm: a deterministic topological sort of the causal graph that, among ready events, always emits the smallest (ts, origin, stream, seq); promoted branch events and legacy events placed by rule before the sort. State that incremental fold equals this sort's output for own-stream appends under the gate."},
    {"id": "M3", "by": "producer (this revisit), from memory and owner request", "severity": "blocking for transparency (one authority)", "section": "2 row 9, 16 header", "finding": "The seal cadence default (lifecycle, else 300 s, else clean exit) is listed under 'Owner decisions of 2026-10-17' and section 16 calls it 'Owner default'; the recorded decision says the agent chose it.", "fix": "Move it to the spec's own decisions list, or record the owner's confirmation; ask it in the 'what still needs the owner' list with the loss-budget numbers."},
    {"id": "M4", "by": "producer (was m4, minor); severity raised after red-team round-1 F2", "severity": "blocking for the contract", "section": "10 step 2.1, 11 step 3, 14 step 3", "finding": "The ref is a commit DAG, not a linear chain: promote commits carry the branch tip as a second parent, and a diverged shared machine id gets a merge commit with both tips as parents. The spec defines the tree only for kind seal, so the merge commit's tree is undefined, and 'the own stream's last sealed seq read from the ref chain' and 'walk the chain back to the commit that covers the cursor' are written as if linear. Proof item 5 (divergence and merge of a shared machine id) cannot be specified against undefined text.", "fix": "Define (1) the merge commit's tree: seal.json only, {v: 1, kind: 'merge', machineId, parents}, no events.jsonl; (2) the walk: visit every parent with a visited set (the rev-list order is irrelevant because order comes from section 12), read segments only from kind seal commits, and select by the (origin, stream) in each seal.json; (3) coverage per (origin, stream): step 2.1 takes the highest lastSeq among seal commits of the own origin and stream, and step 3 stops a branch of the walk only when every requested (origin, stream) is covered. Add the shared-id merge and a promote commit to the model check of section 23 item 2.", "rejectedPart": "Red-team round-1 F2's claim that git cannot form a merge tree because both parents hold a file named events.jsonl is not correct: each commit's tree is its own snapshot and does not have to combine its parents' trees; here each tree is one segment, not cumulative history. The defect is that the spec leaves the tree undefined, not that git forbids it."},
    {"id": "m5", "by": "producer (this revisit); severity changed after red-team round-1 F6", "severity": "required outside Event Store scope (was minor)", "section": "17", "finding": "The 983 clones per take are unattributed (which code path spawns them); the spec reports them without an owner or item. Without that item, the cutover can pass every Event Store gate while the user-visible claim latency (37 s p95 at 20 sessions) stays where it is.", "fix": "Open a separate item for claim-path fan-out and main-checkout removal, and bind it on the program board to the Event Store rollout as the user-visible outcome (owner priority 1, Ship Faster); binding it is the owner's call."},
    {"id": "R2-F1", "by": "red-team round 2", "disposition": "moot", "note": "Option 0 is not in v2; the owner's Q1 moves open logs out of the work tree at cutover, so no interim relief lane is activated by the council."},
    {"id": "R2-F2", "by": "red-team round 2", "disposition": "fixed", "note": "Publication never takes main-checkout or the main door (spec section 4)."},
    {"id": "R2-F3", "by": "red-team round 2", "disposition": "fixed as a constraint, quantified by M1", "note": "Under the default of 0 spawns inside the gate the per-call host facade is excluded; it returns only with the owner's named exec-guard exception plus an ext4 measurement with its spawns counted. The 570 ms convoy figure is attributed to the red-team as an estimate (spec line 349)."},
    {"id": "R2-F4", "by": "red-team round 2", "disposition": "fixed", "note": "Read boundary and automatic recovery are specified; still a design argument until the model check passes."},
    {"id": "R2-F5", "by": "red-team round 2", "disposition": "rejected with reason by the spec author", "note": "The view is a consumer cache, so SQLite semantics belong to the consumer that picks it (spec section 25). Kept as dissent below."},
    {"id": "council2-reviewer", "by": "reviewer round 2", "disposition": "recorded", "note": "Its 'pass' of the round-2 packet is a finding about that packet, not approval of v2."},
    {"id": "RT1-F1", "by": "red-team revisit round 1", "disposition": "accepted", "note": "'0 spawns inside the gate' and an open host-facade route contradicted each other. Fixed in M1, A4, R2-F3, the route dissent axis and the latency default: the default excludes the per-call facade; only the owner's exec-guard exception can bring it back. Not accepted: the red-team's description of the 570 ms convoy as proven; spec line 349 records it as an estimate, and no Event Store route has been measured."},
    {"id": "RT1-F2", "by": "red-team revisit round 1", "disposition": "accepted in part", "note": "Severity raised: m4 becomes M4, blocking for the contract, with the merge tree, DAG walk and per-(origin, stream) coverage defined. Not accepted: the git tree argument (see M4 rejectedPart) and the description of this as a fundamental shift to a distributed DAG; promote commits already made the chain a DAG in v2 and order already comes from section 12, not from walk order. The disagreement on design impact is kept as dissent."},
    {"id": "RT1-F3", "by": "red-team revisit round 1", "disposition": "accepted", "note": "The disposition 'the design is not reopened' overstated an advisory seat's authority and ignored that the owner's B is provisional. Rewritten: this packet recommends no reopening on present evidence; the owner may reopen at any time; the reversal triggers name the evidence that should reopen it; 'sufficient' now means sufficient to start implementation under the section 23 gates, not proven."},
    {"id": "RT1-F4", "by": "red-team revisit round 1", "disposition": "rejected with reason, kept as dissent", "note": "The attack rests on 'Direction B establishes SQLite as the canonical cache view for Work' and 'fold into the SQLite cache view inside the Work gate'. Spec line 299 makes Work's view .fgos/cache/state.json, and section 13 folds into that file under withStateTx; no SQLite engine sits in the gate. SQLite multi-process expertise is therefore not added to the missing-expertise array for this review; a reversal trigger now names the moment it becomes required (a consumer folding into SQLite inside the Work gate)."},
    {"id": "RT1-F5", "by": "red-team revisit round 1", "disposition": "accepted in part", "note": "Accepted: the probe that the owner's remote accepts and serves refs/fgos/* should run first, before crate work, because it is cheap and the whole sharing design depends on it. It pushes to GitHub, so it needs the owner's authorization; this read-only run did not perform it. Not accepted: that the risk is left to be discovered during implementation (spec section 23 item 5 already gates it) and that custom namespaces are not fetched (setup writes a fetch refspec into a mirror namespace, spec line 279)."},
    {"id": "RT1-F6", "by": "red-team revisit round 1", "disposition": "accepted in part, kept as dissent", "note": "Accepted: the Event Store alone does not improve claim latency, and a passing cutover must not be reported as a user-visible speed-up. m5 is raised and the program-board binding is recommended. Not accepted: making claim fan-out an Event Store acceptance criterion; an implementation cannot be graded on code it does not own (the reason for M1). The red-team's appeal to L5 overstates it: L5 question 5 requires real-behavior tests for the changed behavior, not end-to-end outcome proof of a neighboring item."}
  ],
  "dispositions": [
    "No ack-at-fsync implementation starts before the owner signs section 26.",
    "Amend v2 with M1, M2, M3 and M4 before it is called the implementation contract; m5 may land with them.",
    "This packet recommends no reopening of the design (per-machine refs, plumbing-only publication, Work gate kept, seq plus seen order, rotation and receipt, common-dir open root, stop-everything cutover with legacy ref) on present evidence. The owner's choice of B is provisional and the owner may reopen it at any time; the reversal triggers below name the evidence that should.",
    "Run the remote probe first, with the owner's authorization: push a throwaway ref under refs/fgos/ to the owner's remote, fetch it from a second clone through the section 14 refspec, then delete it. A failure triggers the sharing reversal before any crate work.",
    "4.3-S re-cut (P01, P02, the capacity half of P04) can proceed independently of the store location, as the spec states in section 20; recording it on the program board is the owner's call.",
    "The publication driver inside the crate is the only writer of refs/fgos/*; V-DOOR-01 enforces it; it moves behind the Git component's port without protocol change when that component exists.",
    "No Event Store acceptance criterion may depend on removing the claim path's main-checkout wait or process fan-out; that is a separate item. The program board should bind that item to the Event Store rollout as its user-visible outcome, and no report may present the cutover as improving claim latency on its own."
  ],
  "unresolvedDissent": [
    {"axis": "Git component as a precondition", "positions": "Critic (council 2): publication should wait for the Git component. Spec v2 and this producer: a crate-internal driver behind a port, moved later. Not resolved by evidence; the owner's 10-17 Git component decision does not settle it."},
    {"axis": "Lock grain", "positions": "Panelist 3: entity-level mutex. Framing, P1, synthesizer, critic, spec v2: one project Work gate per clone. V-SPAWN-01 does not discriminate, because its tail is main-checkout waiting, not state."},
    {"axis": "Node-to-Rust route", "positions": "Panelist 3 and spec author: N-API preferred. Synthesizer, critic, P1, framing (council 2): host facade. Red-team round 2 and red-team revisit round 1: the facade cannot meet p95 and should be disqualified now. Producer: under the default (0 spawns in the gate) the per-call facade is excluded; whether to grant the exec-guard exception that would let it be measured is the owner's decision, not an agent's."},
    {"axis": "SQLite expertise", "positions": "Red-team round 2 and red-team revisit round 1: add multi-process SQLite WAL expertise to the core review. Spec author and producer: out of scope, because Work's view is state.json (spec line 299); it becomes required when a consumer folds into SQLite inside the Work gate. Unresolved."},
    {"axis": "Design impact of the commit DAG", "positions": "Red-team revisit round 1: a shift from a linear chunk log to a distributed DAG that hides major protocol complexity. Producer: a bounded definition (merge tree, visited-set walk, per-(origin, stream) coverage) on a chain that was already a DAG through promote commits, to be confirmed by the model check. Unresolved until the model check runs."},
    {"axis": "End-to-end latency as an Event Store criterion", "positions": "Red-team revisit round 1: bind claim fan-out reduction into Event Store acceptance. Producer: keep it a separate item, bound on the program board to the rollout. The owner decides the binding."},
    {"axis": "Unsealed loss cap", "positions": "Council-2 producer: 300 s or 100 events per writer, doctor fails at 3600 s or 100 events. Spec v2: drops the 100-event cap because lifecycle events seal at once; doctor warns at twice the interval, fails at 3600 s. Owner to decide."},
    {"axis": "Cross-machine provisional success", "positions": "Spec author recommends accepting recorded conflicts; no seat has argued for an online coordinator, but the owner has not accepted the semantics."}
  ],
  "namedDefaults": [
    {"name": "Section 26 unsigned", "default": "Spec stays non-canonical; only door-agnostic work (4.3-S re-cut, crate scaffolding without ack-at-fsync use, model check, the remote probe once authorized) proceeds."},
    {"name": "Latency budget", "default": "0 spawns inside the gate unless the owner grants the named exec-guard exception (then spawns count inside the p95); Event Store in-gate increment p95 at most 50 ms at 20 sessions on ext4; end-to-end not worse than V-SPAWN-01 baseline. Under this default the per-call host facade is excluded. Producer-proposed numbers, not measurements."},
    {"name": "Seal cadence", "default": "Lifecycle, else 300 s, else clean exit; agent-chosen, pending owner confirmation."},
    {"name": "Doctor unsealed thresholds", "default": "Warn above 2 x interval, fail above 3600 s; agent-proposed."},
    {"name": "Sync interval", "default": "eventStore.sync.intervalSec 300, opportunistic push; agent-proposed."}
  ],
  "residualRisks": [
    "The reader-versus-seal protocol is a design argument until the TLA+/Alloy model and the stress test pass, now including the merge and promote commits of M4.",
    "No measurement on ext4 exists; per-append fsync inside the gate may dominate the in-gate budget.",
    "Whether the owner's remote accepts and serves refs/fgos/* is unproven; spec section 23 item 5 gates it, and this packet recommends probing it first.",
    "N-API adds per-platform native builds to the npm and legacy-node payloads; no seat costed this. Under the default it is the only qualifying route, so this cost is now likely, not optional.",
    "Unsealed events are lost with the disk or clone, and the window is unbounded while no fgOS process runs.",
    "The stop-everything cutover requires all three machines quiesced at once; a missed machine's later push of tracked shards is caught only by event-store-legacy-layout.",
    "Claim latency (37 s p95 at 20 sessions) will not improve from the store alone."
  ],
  "reversalTriggers": [
    "The model check or the 10,000-interleaving stress test finds a lost or double-counted event: reopen sections 10-11.",
    "The model check shows that the M4 walk needs more than a visited set and per-(origin, stream) coverage to stay correct across merge and promote commits: reopen sections 10, 11 and 14.",
    "Ext4 measurement shows the in-gate increment above the budget for every qualifying route: reopen the open-log design (for example group commit) before choosing a route.",
    "The owner's remote rejects or hides refs/fgos/* from fetch: reopen sharing (section 14).",
    "A consumer folds into SQLite (or another multi-process engine) inside the Work gate: add multi-process SQLite expertise to that review and re-check the in-gate budget.",
    "A cross-machine conflict needs manual resolution more than once a month, or an acknowledged event is lost while fgOS runs: the section 26 review threshold.",
    "The owner declines the agent-chosen cadence or loss numbers: amend sections 16 and 21 only.",
    "The Git component lands before the Event Store cutover: move the publication driver behind its port first."
  ],
  "whatChangedAndWhy": [
    "The subject changed from the round-2 packet to spec v2, because the owner asked whether v2 fixes council 2's blockers and can serve as the contract.",
    "The round-2 packet's disposition 'publication through the 4.3-R main door' is superseded: the owner's Q1 puts sealed events on refs, so no work-tree commit is needed, and red-team round 2 F2's layer-inversion objection is resolved. The decision is attributed to Q1, not to this producer.",
    "Option 0 activation is withdrawn as moot under Q1, which also answers red-team round 2 F1.",
    "The latency budget is reframed (M1) because V-SPAWN-01 shows that the end-to-end metric cannot be met by any route.",
    "Producer round 2 (this packet), after red-team revisit round 1: M1 and the route positions now say plainly that the default excludes the per-call host facade (RT1-F1); m4 is raised to blocking M4 with a defined merge tree and DAG walk (RT1-F2); 'the design is not reopened' is rewritten as a recommendation under the owner's provisional choice (RT1-F3); the remote probe is moved first (RT1-F5); m5 is raised and a program-board binding recommended (RT1-F6); the SQLite objection is rejected with spec evidence and kept as dissent with a reversal trigger (RT1-F4). The verdict counts four amendments instead of three as a consequence.",
    "Unchanged and preserved: the L3 authority rule, the F10 barrier, M2, M3, every other dissent axis, the round-2 reviewer's pass recorded as a finding only, and the revisit round-1 reviewer's pass, which is a finding about final-packet-1.json and not approval of this packet."
  ],
  "missing expertise": [
    "filesystem crash consistency and fsync semantics across ext4, APFS, NTFS and WSL2",
    "git internals: ref transactions, packed refs, gc and prune of custom ref namespaces, commit-DAG traversal across merge and promote commits, forge handling of refs/fgos/*",
    "multi-clone reconciliation semantics for event reducers",
    "IPC profiling and lock-convoy dynamics for a Node caller of Rust under 15 to 20 sessions",
    "formal model checking (TLA+ or Alloy) of the reader-versus-seal protocol",
    "native addon distribution: N-API prebuilds across platforms and Node ABI versions inside the npm and legacy-node payloads"
  ],
  "limits": "Read-only revisit. No experiment was run, and the remote probe was not performed because it pushes to an external service; every number introduced here is a proposed default. Blind seats were not rerun or impersonated. Code citations were spot-checked, not exhaustively verified; spec line numbers refer to the working-tree copy of docs/platform/event-store/spec.md, assumed equal to 232d61eb8 (not re-diffed in this run)."
}

```

## Red-team round 2

# Red Team Report — Adversarial Attack on Revised Final Packet (Revisit Round 2)

- **Role**: Red Team (Adversarial Audit, Revisit Round 2)
- **Target**: Producer RAW JSON packet at `.fgos/assignments/unit-run-1792222330505-218f2eca/producer/2/runs/01/worker-output/outbox/final-packet-2.json`
- **Subject**: Revisit of Event Store Specification v2 (`docs/platform/event-store/spec.md`, commit `232d61eb8`) and baseline benchmark V-SPAWN-01 (`unit-run-1792220971867-6b11971a`, `plans/reports/experiment-261017-1431-event-store-v-spawn-01.md`).
- **Assessment Verdict**: `findings`
- **Scope**: Read-only adversarial audit of framing, authority, changed claims, residual risks, missing expertise, and dissent preservation in Producer Packet 2. Zero workspace modifications.

---

## 1. Executive Summary & Audit Posture

The Producer's revised packet (`final-packet-2.json`) incorporates several necessary adjustments following Red Team Round 1:
1. **Finding M4 Elevation**: Acknowledges that multi-clone and branch promotion creates a commit DAG rather than a linear chain, raising m4 from a minor prose tweak to a blocking contract finding (M4).
2. **Authority Retraction**: Rewrites "the design is not reopened" from an advisory decree into a recommendation under the Owner's provisional Choice B.
3. **Execution Guard Alignment**: Formally notes in M1 and the default route that under the zero-spawn hot-lock constraint, the per-call CLI host facade is excluded.

However, an adversarial examination reveals that `final-packet-2.json` replaces prior vulnerabilities with **critical algorithmic gaps**, **evasive route indecision**, **deliberate dissent laundering on the cache view architecture**, and **an anti-performance acceptance floor** that ratifies unusable response times.

The Red Team delivers a firm verdict of **`findings`**. Spec v2 plus Packet 2 is **NOT** sufficient to serve as an implementation contract.

---

## 2. Red Team Attack Findings

### Finding 1: The M4 DAG Walk Algorithm Suffers from an Undefined Stopping Condition & In-Gate Latency Explosion
- **Target**: `final-packet-2.json:44` (Finding M4 fix), `final-packet-2.json:73` (Dissent axis), `docs/platform/event-store/spec.md:216-228` (§11 step 3), `docs/platform/event-store/spec.md:259-266` (§13 step 2).
- **Evidence**:
  - `final-packet-2.json:44` defines the M4 fix: `"(2) the walk: visit every parent with a visited set... read segments only from kind seal commits, and select by the (origin, stream) in each seal.json; (3) coverage per (origin, stream): step 2.1 takes the highest lastSeq among seal commits of the own origin and stream, and step 3 stops a branch of the walk only when every requested (origin, stream) is covered."`
  - `docs/platform/event-store/spec.md:106, 121`: Each clone mints a random 128-bit `origin` (store ID) at creation.
  - `docs/platform/event-store/spec.md:301-305`: A consumer passes a `cursor` containing known stream tips.
  - `docs/platform/event-store/spec.md:262`: Read catch-up runs inside `withStateTx` under the hot mutex (state rank 60).
- **The Attack**:
  1. In a multi-machine, multi-clone environment, a reader calling `read(['project'], cursor)` has no prior knowledge of what random `origin` IDs exist across diverged or merged branches.
  2. If step 3 stops walking a branch when *"every requested (origin, stream) is covered"* based on the origins present in its local cursor, it will **silently stop early and fail to discover newly merged commits authored by unfamiliar origins**, resulting in silent event loss during reader catch-up!
  3. If, on the other hand, step 3 cannot assume the origin set is finite and known, it has **no termination condition** other than walking every path in the Git commit DAG all the way back to the root of the ref history ($O(N)$ commits).
  4. Because read catch-up executes *inside* `withStateTx` (the Work hot lock, rank 60), performing an unbounded Git commit-DAG traversal with Git object opens and JSON parsing inside the single mutex will destroy in-gate throughput as the repository ages.
  5. Classifying this algorithmic hole as a simple prose amendment fixable without a fully specified graph-traversal invariant is an architectural hazard.

---

### Finding 2: False Disqualification and Punted Route Indecision (A4 & M1)
- **Target**: `final-packet-2.json:38` (Alternative A4), `final-packet-2.json:41` (Finding M1), `final-packet-2.json:71` (Route dissent), `agent-report.md:34` (Owner Question 1).
- **Evidence**:
  - `final-packet-2.json:38` (A4): Declares that picking the Node-to-Rust route is *"Not adopted by this producer, because the facade's fate is the owner's exec-guard decision... Stated plainly: under the default of 0 spawns inside the gate, the per-call host facade is excluded and N-API is the only qualifying route. If the owner grants the exception, the facade qualifies only by measurement on ext4..."*
  - `final-packet-2.json:80`: Sets the default latency budget to exclude the per-call facade.
  - `final-packet-2.json:89` (Residual Risk): *"N-API adds per-platform native builds to the npm and legacy-node payloads; no seat costed this. Under the default it is the only qualifying route, so this cost is now likely, not optional."*
  - `agent-report.md:34`: Asks Owner Question 1: *"Will you grant the exec-guard exception that would let the per-call host facade be measured? If not, N-API is the only route."*
- **The Attack**:
  1. The Producer executes an evasive double-step: claiming to accept Red Team Finding 1 by stating that the default excludes the host facade, yet refusing to adopt N-API (A4) and continuing to punt the route to the Owner as an exec-guard exception request.
  2. The Producer admits that N-API adds cross-platform native compilation, binary distribution, and ABI matrix overhead across npm and legacy-node payloads that has **never been costed or designed**.
  3. The specification cannot be "sufficient to start implementation" (verdict line 8) when the core IPC mechanism bridging the Node CLI runtime and the Rust crate (the One Door) remains unselected, uncosted, and architecturally orphaned.

---

### Finding 3: Laundering SQLite Cache View Architecture via Spec Omission (RT1-F4)
- **Target**: `final-packet-2.json:7, 25, 50, 55, 72, 99`, Owner request verbatim.
- **Evidence**:
  - Owner request: *"[Owner decisions after council 2:] tạm chọn B, db là cache view, claims để runtime."*
  - `final-packet-2.json:55` (RT1-F4 rejection): *"The attack rests on 'Direction B establishes SQLite as the canonical cache view for Work'... Spec line 299 makes Work's view .fgos/cache/state.json... SQLite multi-process expertise is therefore not added to the missing-expertise array for this review..."*
  - `final-packet-2.json:72` (Dissent): Dismisses SQLite expertise as out of scope because Work's view is currently `state.json`.
- **The Attack**:
  1. The Owner explicitly mandated: **"tạm chọn B, db là cache view"**.
  2. In Council 2, Direction B won support precisely because replacing the monolithic `state.json` file with an indexed SQLite cache view was understood to be necessary for multi-process query scalability (`list`, `show`, `ready`).
  3. Spec v2 quietly undermined this mandate by retaining `.fgos/cache/state.json` as the Work view (§15 line 299) and relegating SQLite to an optional external consumer choice.
  4. The Producer now uses the spec's own failure to implement the Owner's directive ("db là cache view") as the excuse to reject SQLite WAL concurrency from the missing expertise array!
  5. If Work retains `state.json`, every mutation forces a full serialize/deserialize of the entire repository state inside `withStateTx`, causing immediate lock contention under 20 concurrent sessions regardless of how fast Rust appends events.
  6. If Work implements the Owner's directive and migrates to SQLite, multi-process SQLite WAL locking (`-shm`, `SQLITE_BUSY`, POSIX advisory locks) sits squarely inside the hot lock.
  7. Dismissing SQLite WAL expertise through this circular maneuver is textbook dissent laundering.

---

### Finding 4: Inverting Acceptance Criteria by Defining Failure as the Contract Baseline (m5 & RT1-F6)
- **Target**: `final-packet-2.json:45` (m5), `final-packet-2.json:57` (RT1-F6), `final-packet-2.json:66` (Disposition 66), `final-packet-2.json:80` (Latency default b).
- **Evidence**:
  - `final-packet-2.json:80` (Latency default): `"(b) end-to-end CLI p95 not worse than the V-SPAWN-01 baseline."`
  - `final-packet-2.json:66`: *"No Event Store acceptance criterion may depend on removing the claim path's main-checkout wait or process fan-out; that is a separate item."*
  - V-SPAWN-01 baseline measurements at 20 sessions:
    - `take`: **37,430 ms** (37.4 seconds)
    - `move`: **480 ms**
    - `settle`: **1,556 ms**
  - Traced `take` executed **983 clones** and **984 execve** calls.
  - `AGENTS.md`: *"Product priority order (D-ADR0030, docs/specs/runner.md) 1. Ship Faster — giao nhanh hơn, không đoán mò, giảm friction/better-dev-ux, ít chờ đợi."*
- **The Attack**:
  1. The Producer decouples the Event Store acceptance criteria from end-to-end CLI performance, defining the passing criterion as: **"not worse than the V-SPAWN-01 baseline"**.
  2. Because the baseline at 20 sessions is 37.4 seconds for `take`, the Producer's contract allows the Event Store to be declared an unqualified success even if `take` still takes 37.4 seconds!
  3. This completely subverts the core rationale of the Event Store project. fgOS agents and developers do not care if in-crate append takes 2 ms if `fgos take` locks their terminal for over half a minute.
  4. Platform Law L5 (Definition of Done) requires proof of real working behavior, not isolated micro-benchmarks that hide end-to-end dysfunction. Setting an acceptance ceiling that ratifies a 37.4-second response time violates the foundational doctrine of "Ship Faster".

---

### Finding 5: Paralyzing Verification by Punting Basic Git Probe to Owner Authorization (RT1-F5)
- **Target**: `final-packet-2.json:56` (RT1-F5), `final-packet-2.json:63` (Disposition 63), `agent-report.md:35` (Owner Question 2).
- **Evidence**:
  - `final-packet-2.json:63`: Recommends running the remote probe first before crate work, but states that because it pushes to GitHub, it requires Owner authorization.
  - `agent-report.md:35`: Leaves Owner Question 2: *"May the remote probe push and then delete a throwaway refs/fgos/ ref on GitHub?"*
  - `docs/platform/event-store/spec.md:279`: Relies on configured fetch refspecs `+refs/fgos/events/*:refs/fgos/mirror/<remote>/events/*`.
- **The Attack**:
  1. Probing custom Git ref mechanics does **not** require pushing to the Owner's live upstream GitHub repository.
  2. A local test script using a local bare repository (`git init --bare`) can verify in seconds:
     - Push and fetch behavior of `+refs/fgos/events/*`.
     - Behavior of `git clone` (confirming that fresh clones do NOT fetch custom refspecs without setup).
     - Server-side and client-side behavior of `git gc --prune=now` on metadata-only commits without working-tree files.
  3. Punting a trivial, safe local proof to the Owner as an external blocker while failing to test fresh-clone bootstrapping is an avoidance tactic that leaves the entire multi-machine distribution architecture unverified.

---

### Finding 6: The "Sufficient to Start Implementation" Illusion
- **Target**: `final-packet-2.json:8` (verdict.implementationContract), `final-packet-2.json:35-37` (Alternatives A1-A3).
- **Evidence**:
  - `final-packet-2.json:8`: *"After those, the spec is sufficient to start implementation under the proofs of its section 23, which it already names as gates."*
- **The Attack**:
  1. Reviewing the accumulated state of the design:
     - **IPC Door**: Undecided (Host Facade excluded by default; N-API unselected and uncosted).
     - **DAG Traversal**: Undefined stopping condition; risk of silent event loss or $O(N)$ commit walk inside the Work hot lock.
     - **Cache View**: In conflict with Owner mandate ("db là cache view" vs `state.json`).
     - **Concurrency Model**: Unproven until future TLA+/Alloy model checking and ext4 benchmarking.
     - **Remote Sharing**: Unverified on fresh clones; probe punted to Owner.
  2. Declaring that the specification is "sufficient to start implementation" under this mountain of structural unknowns encourages premature code authoring that will inevitably be discarded when the model check, IPC route, or cache view fails.

---

## 3. Audit of Packet Structure & Required Properties

- **JSON Object Integrity**: Verified. `final-packet-2.json` begins with `{` and contains valid, un-fenced JSON.
- **Exact Key `"missing expertise"`**: Present, lowercase with a single space.
- **Missing Expertise Content Check**:
  - The Producer included 6 domains, expanding Git internals to include commit-DAG traversal.
  - **Omission**: Still improperly excludes multi-process SQLite WAL concurrency and bounded metadata-only Git DAG traversal algorithms.
- **Dissent Preservation**: Preserved across 8 axes, but continues to launder SQLite WAL concurrency by redefining the scope of Work's view.

---

## 4. Conclusion & Recommended Action

The Producer's Round 2 revision improves on Round 1 by formally acknowledging M4 as a blocking finding and qualifying advisory authority. However, it introduces an incomplete DAG walk algorithm, avoids deciding the Node-Rust route, launders the SQLite cache view requirement, and establishes an anti-performance latency floor.

The Red Team verdict is **`findings`**.

### Recommendations for the Owner & Authors:
1. **Do not begin Rust crate implementation** until:
   - The M4 DAG traversal algorithm defines an unambiguous, bounded termination invariant that guarantees discovery of new foreign origins without $O(N)$ full-history walks inside `withStateTx`.
   - The IPC route between Node and Rust is explicitly chosen and costed (either formal N-API commitment or an alternative in-process architecture).
   - The cache view architecture is aligned with the Owner's mandate ("db là cache view" = SQLite) and SQLite WAL concurrency expertise is integrated into the review team.
2. **Reject the "not worse than V-SPAWN-01" latency baseline**: Bind the removal of the 983 spawns in `take` (4.3-S P04) directly to Event Store delivery so that multi-session performance improvements are user-visible.
3. **Execute local bare-repo Git ref probes immediately** without waiting for upstream GitHub pushes.
