{
 "packet": "final-recommendation-eventstore-4.3-dependency",
 "status": "recommendation only; no council consensus and no owner approval is claimed. Process split is owner-decided. Architecture candidates A (two-tier SQLite) and B (seal-first) are unranked by this packet and go to the council as co-equal candidates; this revision answers the red-team findings RT-F1..RT-F5.",
 "verdict": {
  "process": {
   "decision": "Lane A: land the Git half of plan 4.3 under the old plan now (P03 main door + borrowed fd/hook with checkpoint as a detachable adapter, P05, P06, P07, P08, Git-only docs/proof in P09; three repo-lock primitives main-checkout, merge-target slot, worktree-admin). Lane B: run the EventStore council in parallel. Lane C: after the council verdict, rewrite the frozen state slices (P01/P02/P04 and state parts of P00/P09) exactly once. Do not let all of 4.3 pass and 'return to Git later'.",
   "authority": "Owner already decided this ('thả 4.3 làm theo plan cũ, bật hội đồng eventstore'); framing, all three panelists, synthesizer and critique agree. Treated as binding process, not as a proposal awaiting votes.",
   "confidence": "high"
  },
  "architecture": {
   "decision": "Two candidate shapes go to the council as co-equal, scored against one rubric (the owner's seven design tenets plus the measured falsifier results). Candidate A: two-tier store with a same-machine operational SQLite outside every code working tree, immutable per-closed-run/transaction JSON changesets as Git-tracked truth, one mutation door with transactional outbox and a defined ack/recovery point, Git as a publisher that never learns Work schema. Candidate B (panelist-2): keep the JSONL engine, move open shards under the git common-dir, seal closed shards into content-addressed immutable files, drop merge=union; panelist-2 recommends B as step one if both falsifier experiments pass, with SQLite only as a later step if measured need appears. Neither is approved. L3 keeps JSON-final; it is clarified or superseded by exact text, never vaguely edited.",
   "authority": "The synthesizer ranked A primary and panelist-1/panelist-3 favor A; panelist-2 favors B; producer/2 critique refused to approve either. This packet records those rankings as attributed positions and does not adopt the synthesizer's ranking as a default. The council, then the owner, decide.",
   "confidence": "low-moderate for choosing between A and B: no prototype or benchmark exists for either. Publication surface and ack point are open."
  },
  "council_scope": "Council must return decisions (see council_decision_objects), not an engine brand preference."
 },
 "missing expertise": [
  "Git internals (refs, plumbing, GC, clone/fetch refspec, bare/separate-git-dir/submodule topologies)",
  "SQLite/WAL concurrency and crash-recovery testing",
  "Distributed-systems/CRDT-style multi-machine conflict semantics",
  "Rust platform-component implementer (storage-location and session-identity ports)",
  "Product owner for claim/lease semantics and acceptable data-loss window (RPO)",
  "POSIX and cross-platform filesystem semantics (atomic rename, directory fsync, WSL/NTFS locking, cross-device links) for the seal and outbox materialize steps",
  "Event-log compaction and snapshot lifecycle engineering (replay growth in either candidate)"
 ],
 "evidence": [
  {
   "id": "E1",
   "claim": "Root coupling is hot, mutable event shards appended inside the tracked working tree, not Git itself. Worker worktrees must reach main's .fgos; checkpoint/strip/union/truncation/restore workarounds follow.",
   "source": "plans/reports/investigation-261017-1027-fgos-event-store-git-coupling.md; drift history plans/reports/research-261017-1102-fgos-event-store-drift-history.md; named G-ids G-029,G-166,G-088,G-089,G-090,G-121,G-120,G-118,G-093",
   "strength": "mechanism evidenced by commits and code paths"
  },
  {
   "id": "E2",
   "claim": "Upstream repository-harness keeps the DB gitignored and writable, durable unit is an immutable committed changeset, DB is materialized from snapshot plus changesets. fgOS kept JSONL-truth and content hash but drifted on placement (hot in main working tree) and immutability (open writer-session shards, merge=union).",
   "source": "docs/distillery/sources/repository-harness.md; drift report. Upstream source is not on this machine.",
   "strength": "secondary (distillery), limit stated"
  },
  {
   "id": "E3",
   "claim": "The figure '43 of 182 Git lessons (~24%)' is not reproducible. Catalogue v2 has 233-234 lessons; an independent keyword recount found 41 hits overall, 26 in the v1 id range. Use mechanism families to delete, not a percentage.",
   "source": "producer/2 section 1.1 (heuristic recount, stated limits); the original 43 id list was never recovered",
   "strength": "heuristic; corrects an earlier overclaim that framing, panel synthesis and the owner's context repeated"
  },
  {
   "id": "E4",
   "claim": "Data volume is small: baseline events.jsonl 11,282,071 B / 24,780 lines; 90 shards 4,115,978 B / 8,933 events; cache view 10,762,906 B. Cost is write placement and concurrency, not query scale.",
   "source": "producer/2 remeasure; panelist-2",
   "strength": "measured on this machine"
  },
  {
   "id": "E5",
   "claim": "Claims already live under gitignored .fgos/runtime/claims; claim acquisition currently serializes with events.lock to keep capacity+claim atomic (P04 invariant).",
   "source": "producer/2 section 3 C5; panelist-2",
   "strength": "code-path evidence"
  },
  {
   "id": "E6",
   "claim": "L3's review threshold (multi-agent write as main load) is hit; single-writer premise is already broken in production.",
   "source": "docs/platform-foundations.md L3; framing report",
   "strength": "spec text"
  },
  {
   "id": "E7",
   "claim": "compactColdWriterFiles exists with tests/doctor verify but has no production caller; compaction is not a delivered capability.",
   "source": "framing report; producer/2 F12",
   "strength": "code evidence"
  },
  {
   "id": "E8",
   "claim": "Only one worktree existed at probe time, common-dir .git; multi-worktree behavior, bare, separate-git-dir and submodule cases are unproven.",
   "source": "producer/2 section 1; reviewer/2",
   "strength": "evidence gap"
  }
 ],
 "alternatives": [
  {
   "id": "ALT-1",
   "name": "Candidate A. Two-tier: shared operational SQLite outside code worktrees + immutable JSON changesets + transactional outbox + Git publisher",
   "attributed_to": "framing producer, panelist-1, panelist-3 (differ on details)",
   "for": "One concurrency/CAS authority; can make P04 capacity+claim atomic in one transaction; removes events.lock/claims.lock; DB for work, JSON final as owner asked",
   "against": "Dual-write is not one ACID transaction, so outbox and recovery are mandatory; heavier than seal; log size does not justify SQL by itself; the process that drains the outbox is unspecified (in-process synchronous at CLI exit with startup self-heal per panelist-3, versus a single publisher per panelist-1) and a detached drainer would conflict with the repo's no-ghost-process rule",
   "status": "co-equal candidate A, scored with candidate B; the synthesizer's ranking of A as primary is recorded but not adopted here"
  },
  {
   "id": "ALT-2",
   "name": "Candidate B. Seal-first: keep JSONL engine, relocate open shards under git common-dir, seal closed shards into content-addressed immutable files, drop merge=union",
   "attributed_to": "panelist-2",
   "for": "Attacks measured root cause (placement + mutability) with the smallest change; fewer moving parts if the falsifier experiments kill most coupled lessons",
   "against": "Does not remove the cross-process critical section (relocates events.lock); open-shard RPO is policy; durability can again depend on someone committing; compaction absent; seal rename and directory fsync semantics unproven across platforms; if used as an interim beside a later SQLite cutover it needs a dated kill date to avoid a long dual path",
   "status": "co-equal candidate B, authored by panelist-2 as a self-sufficient option and its recommended first step if both experiments pass; the two experiments are shared evidence for scoring, not a handicap on B"
  },
  {
   "id": "ALT-3",
   "name": "Event-class narrowing (not every event is durable truth; roughly 30% doc.*/topic.* may be derivable)",
   "attributed_to": "panelist-2",
   "for": "Additive to any storage shape; cuts churn",
   "against": "doc.attest and doc.promote need hash proof before dropping",
   "status": "scored inside council as additive to A or B, not mandated here: panelist-2 itself marks doc.attest/doc.promote as possibly durable decisions and the derivable claim needs a hash-equality replay proof first"
  },
  {
   "id": "ALT-4",
   "name": "Orphan fgos/state worktree under common-dir",
   "attributed_to": "panelist-2 (as stress extreme)",
   "for": "Stress-tests D1",
   "against": "Hot Git tree remains; D1/nested-git history",
   "status": "not recommended by its own author"
  },
  {
   "id": "ALT-5",
   "name": "Dedicated state ref published by plumbing/ref CAS, never through the code working tree",
   "attributed_to": "panelist-1",
   "for": "Does not dirty code trees or ride feature-branch merges",
   "against": "Ack-after-local-ref can re-serialize writers on update-ref; clone/fetch/GC/refspec can silently drop the ref; accidental human merges",
   "status": "open fork versus tracked .fgos/changesets"
  },
  {
   "id": "ALT-6",
   "name": "Let all of 4.3 land (Node stateTx / dual file-lock generation), fix Git later",
   "attributed_to": "owner's own question",
   "for": "Fastest nominal close",
   "against": "Hardens the coupling that is being removed; plan would mint a lock generation to delete later",
   "status": "rejected by all roles and by the owner's decision"
  },
  {
   "id": "ALT-7",
   "name": "Per-worktree DB as upstream; DB under the main working tree; keep hot shards with better locks; Dolt/SQLite as canonical truth",
   "attributed_to": "framing, panelist-1 (rejections)",
   "for": "n/a",
   "against": "No live cross-agent freshness; renames the old coupling; keeps merge pain; flips JSON-final without an explicit L3 supersede",
   "status": "rejected unless owner explicitly supersedes JSON-final"
  }
 ],
 "attributed_findings": [
  {
   "id": "F1",
   "finding": "Land the Git half of 4.3 with checkpoint as swappable adapter; freeze the state half; council in parallel; rewrite state once.",
   "source": "owner plus framing, panelist-1/2/3, synthesizer, producer/2",
   "severity": "binding process"
  },
  {
   "id": "F2",
   "finding": "Placement of hot mutable event units is the root coupling class.",
   "source": "coupling investigation, framing",
   "severity": "binding diagnosis"
  },
  {
   "id": "F3",
   "finding": "Log volume is small; speed of queries is a weak reason for SQL. Concurrency/CAS/claim atomicity is the strong reason.",
   "source": "panelist-2, producer/2 F3-F4",
   "severity": "high"
  },
  {
   "id": "F4",
   "finding": "Dual-write crash window (DB commit vs JSON materialize) is design-central. Needs a durability enum, kill tests between every step pair, idempotent apply by content hash, doctor visibility of pending outbox.",
   "source": "panelist-1, panelist-3, framing",
   "severity": "high"
  },
  {
   "id": "F5",
   "finding": "Publication surface (dedicated state ref vs tracked .fgos/changesets) and ack point (after local Git ref vs after JSON materialize vs seal-now-commit-later) are real forks and stay unresolved.",
   "source": "synthesizer, panelist-1 vs panelist-3",
   "severity": "high"
  },
  {
   "id": "F6",
   "finding": "D1 must be restated (durable truth versioned in Git versus every live byte shares code-branch history) before any path policy.",
   "source": "panelist-2, producer/2",
   "severity": "high"
  },
  {
   "id": "F7",
   "finding": "Claims fork: runtime leases (panelist-1) versus same durable transaction as work (panelist-3). Moving claims into durable tables changes product semantics; moving them out must replace the atomicity that events.lock gives P04.",
   "source": "panelist-1, panelist-3, producer/2 C5",
   "severity": "high"
  },
  {
   "id": "F8",
   "finding": "Hard-pinning .git/fgos/operational.db violates bottom-up layering; common-dir is a default candidate behind a storage-location port, validated on bare/separate-git-dir/submodule/permissions/backup.",
   "source": "producer/2 critique of panelist-3; framing",
   "severity": "medium-high"
  },
  {
   "id": "F9",
   "finding": "'Merge conflict 0.000%' and '<1.2s replay' claims are unverified false precision; say structurally rare.",
   "source": "producer/2",
   "severity": "medium"
  },
  {
   "id": "F10",
   "finding": "Lane A can leak EventStore policy through P00 inventory (stateTx names), P03 checkpoint adapter (shard paths, truncation guard), P09/P10 whole-4.3 gates, downstream plan 6.2 P09 wanting P01+P02, and the old wave graph in the plan body. Required guard: the P03 checkpoint adapter is opt-in and detachable, Lane A tests must pass with a null/no-op adapter, and the P09 Git proof must run without events.jsonl or any hot-lock behavior.",
   "source": "producer/2 C6",
   "severity": "high process"
  },
  {
   "id": "F11",
   "finding": "The 43/182 statistic is unaudited and the denominator is stale; do not size the Git component G0 from it.",
   "source": "producer/2 section 1.1",
   "severity": "high metric hygiene"
  },
  {
   "id": "F12",
   "finding": "Panelist-3's divergence table misstates panelist-1 and panelist-2 positions; source reports are authoritative.",
   "source": "synthesizer",
   "severity": "low"
  },
  {
   "id": "F13",
   "finding": "Ack-after-local-Git-ref can reintroduce mutation waiting on Git, the slowness being escaped.",
   "source": "producer/2 critique of panelist-1",
   "severity": "medium"
  },
  {
   "id": "RT-F1",
   "finding": "The prior packet admitted it did not read the three panelist reports directly. Provenance now: this revision read panelist-1 and panelist-2 reports in full and panelist-3 lines 1-130 (executive summary, divergence table, constraints 3.1-3.5 start) plus targeted search of its outbox/drain passages; the remaining panelist-3 sections (about lines 130-280) were not re-read. Panelist positions in this packet are checked against those reads; the reviewer and red-team also report reading the panelist reports directly.",
   "source": "red-team RT-F1; reviewer/1 Observation 1",
   "severity": "high (provenance)"
  },
  {
   "id": "RT-F2",
   "finding": "The prior packet framed A as 'ranked primary' and B as 'time-boxed non-production falsifier', which under-represented panelist-2, whose report calls B an equal competitor that is no straw man and recommends it as step one if both experiments pass. Corrected to co-equal candidates with one rubric.",
   "source": "red-team RT-F2; checked against panelist-2 report sections on recommendation and section 5",
   "severity": "high"
  },
  {
   "id": "RT-F3",
   "finding": "Outbox process topology was unspecified for 15-20 parallel sessions. Panelist-3 gives in-process synchronous materialize-then-ack with startup self-heal and no daemon; panelist-1 gives a single publisher. Latency per CLI call and no-ghost-process rule make topology a mandatory council decision object.",
   "source": "red-team RT-F3; panelist-1, panelist-3 reports; AGENTS.md process rules",
   "severity": "high"
  },
  {
   "id": "RT-F4",
   "finding": "Missing expertise omitted filesystem semantics (rename, directory fsync, WSL/NTFS) and log compaction/snapshot lifecycle. Both added to the array.",
   "source": "red-team RT-F4; E7 (compactColdWriterFiles has no production caller)",
   "severity": "medium"
  },
  {
   "id": "RT-F5",
   "finding": "Lane A can fossilize EventStore coupling through a retained checkpoint adapter. Added as a named default: opt-in/detachable adapter, null-adapter test pass, P09 Git proof independent of events files and hot-lock.",
   "source": "red-team RT-F5; extends F10",
   "severity": "medium-high"
  }
 ],
 "dispositions": [
  {
   "item": "Lane A split of 4.3",
   "disposition": "accepted as owner decision; no dissent found"
  },
  {
   "item": "Freeze P01/P02/P04 and state parts of P00/P09",
   "disposition": "accepted as owner decision; unanimous"
  },
  {
   "item": "Two-tier store (candidate A)",
   "disposition": "carried forward as a co-equal candidate; not approved; scored against candidate B on one rubric (red-team RT-F2 accepted)"
  },
  {
   "item": "Seal-first candidate B and its two experiments (relocate open shards via registry, count which Git lessons die; dual-worktree seal/merge plus crash between seal and rename)",
   "disposition": "adopted as a co-equal candidate; the experiments are mandatory shared evidence for the council, time-boxed, non-production, and must not block Lane A (reframed per RT-F2)"
  },
  {
   "item": "Event-class narrowing",
   "disposition": "adopted as a council scoring item; red-team request to mandate it in every path is not adopted because derivability of doc.* and topic.* events is unproven (panelist-2 flags doc.attest/doc.promote)"
  },
  {
   "item": "Hard-pinned .git/fgos path",
   "disposition": "rejected as written; kept as default candidate behind a port"
  },
  {
   "item": "43/182 as exact statistic",
   "disposition": "rejected; mechanism-family deletion list used instead"
  },
  {
   "item": "Panelist-3 zero-conflict and replay performance numbers",
   "disposition": "rejected as unverified"
  },
  {
   "item": "Orphan state worktree",
   "disposition": "not carried forward; retained only as a D1 stress case"
  },
  {
   "item": "Granularity per closed run/transaction, not per micro-event",
   "disposition": "carried forward as default, council confirms"
  },
  {
   "item": "Cutover: offline hash-verify against current view, stop-the-world, archive legacy shards, fence old writers, reverse export, no dual active writers",
   "disposition": "carried forward as default requirement"
  },
  {
   "item": "RT-F1 provenance of panelist positions",
   "disposition": "accepted; read panelist reports directly (extent stated in RT-F1 finding) and replaced the residual-risk admission"
  },
  {
   "item": "RT-F3 outbox process topology",
   "disposition": "accepted; added as council decision object; both panelist designs recorded"
  },
  {
   "item": "RT-F4 missing expertise",
   "disposition": "accepted; two domains added"
  },
  {
   "item": "RT-F5 Lane A leak guard",
   "disposition": "accepted; added to Lane A named default"
  },
  {
   "item": "Red-team claim that named defaults 1-4 presume SQLite",
   "disposition": "partly rejected: defaults 1-4 are engine-neutral (immutable unit, JSON-final, outside-worktree store); the engine-specific wording in the verdict and ALT status was corrected instead"
  }
 ],
 "unresolved_dissent": [
  {
   "who": "panelist-2",
   "position": "Prefer seal-first (candidate B) as step one if two cheap experiments pass; SQLite only on measured query or multi-table need; the log is small and the cost is placement. Panelist-2 states B must be scored equally with A, not as a straw man.",
   "status": "not overruled; preserved as a co-equal candidate for the council; the synthesizer's ranking of A as primary is a recorded opinion, not a decision"
  },
  {
   "who": "panelist-1 vs panelist-3",
   "position": "State ref via plumbing with durable-after-local-ref, versus tracked .fgos/changesets with durable-after-JSON-materialize.",
   "status": "unresolved fork for council"
  },
  {
   "who": "panelist-1 vs panelist-3",
   "position": "Claims as runtime leases versus claims in the same durable transaction.",
   "status": "unresolved fork for council"
  },
  {
   "who": "panelist-1 vs framing/panelist-3",
   "position": "Formal L3 supersede versus clarify in place.",
   "status": "unresolved; both agree JSON-final stays unless the owner says otherwise"
  },
  {
   "who": "owner",
   "position": "Owner phrase 'DB is what is used when working' is ambiguous: multi-table operational SQLite versus a refreshed view cache.",
   "status": "needs owner words"
  }
 ],
 "named_defaults": [
  {
   "default": "Lane A scope is Git primitives only; tests must not need new hot-lock behavior; checkpoint is an opt-in detachable adapter, Lane A tests pass with a null/no-op adapter, and the P09 Git proof runs without events.jsonl or hot-lock.",
   "applies_unless": "owner changes the process decision"
  },
  {
   "default": "JSON stays final durable truth, Git-tracked; the DB (candidate A) or view cache (candidate B) is a rebuildable working view.",
   "applies_unless": "owner explicitly supersedes L3 / D-JSON-final"
  },
  {
   "default": "Operational store lives outside every code worktree; common-dir is the first candidate behind a storage-location port.",
   "applies_unless": "topology matrix shows bare/separate-git-dir/submodule failures"
  },
  {
   "default": "Durable unit is a new immutable file per closed run/transaction, content hash plus collision-safe name; same id with different content is a conflict; no merge=union.",
   "applies_unless": "council or falsifiers show a better unit"
  },
  {
   "default": "Cross-machine freshness comes only from publish + fetch/import; same-machine freshness comes from the shared DB. Real-time via Git is not promised.",
   "applies_unless": "product defines another transport"
  },
  {
   "default": "No long dual-write; old path deleted in the cutover slice; stop-the-world cutover prepared offline.",
   "applies_unless": "owner accepts a dated interim with a kill date"
  },
  {
   "default": "Report lesson blast radius as a mechanism-family deletion list, not as a percentage.",
   "applies_unless": "a rubric plus id list is published against catalogue freeze 234"
  }
 ],
 "council_decision_objects": [
  "Truth boundary text: exact L3 clarification or supersede ID, JSON-final affirmed",
  "D1 restatement",
  "Meaning of 'DB when working'",
  "Concurrency authority for CAS, claims and capacity after the freeze",
  "Durable unit schema, hash, granularity, naming",
  "Ack/RPO enum with kill-test matrix",
  "Publication surface and duty cycle, plus doctor visibility of pending state",
  "Topology port and path resolution rules",
  "Claims model, runtime versus durable, one door",
  "Event-class policy",
  "Cutover and rollback plan",
  "Deletion list of removed mechanisms (union driver, events.lock, claims.lock as file locks, strip-for-events, truncation-as-truth-guard, checkpoint-as-durability, getMainFgosDir hot path)",
  "Lane A non-goals written down",
  "Attached results of the two falsifier experiments",
  "Lesson-blast metric rubric if a percentage is wanted",
  "Common scoring rubric for candidates A and B (seven owner tenets plus falsifier results) agreed before scoring",
  "Outbox/materializer or seal-trigger process topology: in-process synchronous with startup self-heal versus a supervised detached drainer, with CLI latency budget and no-ghost-process compliance",
  "Filesystem atomicity matrix: rename, file and directory fsync on Linux, macOS, WSL/NTFS, network mounts",
  "Compaction and snapshot lifecycle for replay growth"
 ],
 "residual_risks": [
  "Lane A leaks EventStore policy and biases the council (F10).",
  "Acking a mutation while its JSON can still be lost makes the DB the real truth, contradicting the owner.",
  "SQLite and filesystem JSON cannot be one ACID transaction; the outbox protocol is unproven until kill tests run.",
  "Multi-worktree and multi-machine behavior is unmeasured; only one worktree existed at probe time.",
  "Upstream repository-harness source is unavailable; drift conclusions rest on distillery summaries and git history.",
  "Either candidate used as a staged interim beside a later cutover can persist as a long dual path; any interim needs a dated kill date.",
  "Compaction/snapshot is not production-ready, so replay grows unbounded in any shape.",
  "Downstream plan 6.2 P09 depends on P01+P02 and creates schedule pressure to unfreeze early.",
  "Majority agreement among panelists is a design cluster, not an empirical result; this packet's panel evidence contains no prototype or benchmark.",
  "Panelist-3 sections after about line 130 were not re-read directly in this revision; panelist-3 claims such as 0.000% conflicts and <1.2s replay stay rejected as unverified.",
  "Outbox drain topology unspecified: synchronous fsync on every CLI call may hurt Ship Faster latency, a detached drainer risks ghost processes.",
  "Atomic rename and directory fsync behave differently across POSIX, APFS and WSL/NTFS; both seal and outbox durability depend on them.",
  "Lane A could still fossilize the checkpoint adapter if tests assert its side effects."
 ],
 "reversal_triggers": [
  {
   "trigger": "Both falsifier experiments pass, the open-shard RPO is owner-acceptable, and claim+capacity atomicity needs no new lock",
   "reverse": "Adopt seal-first as the thinner intermediate or final shape instead of SQLite"
  },
  {
   "trigger": "Measured multi-table or multi-session load needs transactional atomicity that seal+lock cannot give",
   "reverse": "Move from seal-first to the two-tier SQLite design"
  },
  {
   "trigger": "Topology matrix shows common-dir placement fails (bare, separate-git-dir, submodule, permissions, backup)",
   "reverse": "Choose another storage-location default behind the port"
  },
  {
   "trigger": "Kill tests show the outbox cannot close the crash window",
   "reverse": "Revisit ack point or drop ALT-1"
  },
  {
   "trigger": "Owner states that DB must be canonical truth",
   "reverse": "Supersede L3 explicitly and reopen the truth boundary"
  },
  {
   "trigger": "Council verdict arrives or Lane A shows hidden EventStore coupling",
   "reverse": "Cut Lane C slices from the verdict, or pull the leaking piece out of Lane A"
  },
  {
   "trigger": "A rubric-based audit of the Git lessons yields a materially different count",
   "reverse": "Resize Git component G0 scope accordingly"
  },
  {
   "trigger": "Filesystem atomicity tests show rename or directory fsync guarantees fail on a supported platform or mount",
   "reverse": "Revisit the seal or outbox step that depends on them, or restrict supported storage locations"
  },
  {
   "trigger": "Outbox topology testing shows synchronous materialize exceeds the agreed latency budget under 20 concurrent sessions and a detached drainer breaches process rules",
   "reverse": "Reconsider candidate A against candidate B"
  }
 ],
 "review_instruction": "Reviewers and red-team should challenge this revised packet: confirm no consensus is invented, A and B are treated as co-equal, dissent is attributed, authority claims match the sources, red-team RT-F1..RT-F5 are dispositioned, and the 'missing expertise' array is present."
}