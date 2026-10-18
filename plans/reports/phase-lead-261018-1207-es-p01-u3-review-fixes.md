# Event Store phase 01, unit 3 review fixes

| Finding | Fix | Proof |
|---|---|---|
| H1 | Two serializer moves tracked in phase 01 with blockers, owners, delivery phases and tests; consumer code unchanged | Distribution incompatibility audit still passes; run-supervisor belongs to running 6.3 |
| M1 | Parse accepts only canonical stored bytes including exactly one LF | Reordered keys, whitespace, `seq:1.0`, duplicate payload keys and missing LF refused with integrity code |
| M2 | Shared lowercase-hex/store/object-id validators; existing machine-id validator reused; schemas match | Envelope/seen/marker/merge/legacy negative identifier tests; valid shared vectors unchanged |
| M3 | Verify historical 16-hex h from raw trailing suffix before ordering/dedupe | Shared tampered-h and tampered-payload vectors refuse integrity; real Node reader parity stays green |
| M4 | One documented `branch_key` mapping | Slash, underscore, uppercase, non-ASCII, 200-byte input, boundary truncation and punctuation-only tests |
| M5 | Reserve store namespace, pin decision to decisions, retain immutable registrations across loads; add historical-scope reconciliation | Non-work scope change and reconstructed-registry tests. Phase 03 must wire reconciliation to persisted events on open |
| M6 | Missing/malformed machine id → event-store-machine-id; filesystem errors → event-store-io (kind retained in detail) | Exact-code tests distinguish setup state, unreadable/missing contracts and corruption |
| M7 | File fsync → atomic hard-link install without overwrite → remove temp → directory fsync; losers reopen winner; separate locked stale-temp sweep | 16 real concurrent initializers return one durable identity; recovery removes only correctly named identity temps |
| M8 | Refuse checkout fixtures/results except .fgos/runtime, resolving symlink ancestors; corrected reproduce command | Existing-root, forbidden-source paths and tmpfs refusal tests; full ext4 run |
| M9 | Convention-path experiment report holds table, method and both raw JSON datasets; remove scripts/baseline-ext4.json | Report is discoverable under plans/reports/experiment-*; raw observations preserved |
| M10 | Default entry host spawns standard PATH fgos shim; optional node-payload; both identify entry | New host baseline: 360 measured calls + 120 preparations successful, no cutover; activated payload's 2 bin and 285 src files byte-identical to checkout |

Cheap lows fixed: L1 validated private timestamp avoids order panic; L2 deliberate strict parsing pinned (non-object, non-string ts, string seq and lone surrogate refused; real corpus had none); L3 adds empty h, null/float seq and CRLF behavior tests; L5 canonicalWithoutHash plus raw negative-zero input; L6 shared marker/three-seal byte/digest vectors in Rust and Node; L7 U+2028/U+2029/U+007F vector; L8 shared error/hex helpers; L10 Git tests scrub inherited GIT_*; L12 package-scoped fmt; L13 Linux-only identity drivers; L14 colon-named directories documented in the phase handoff. New refusal tests assert result codes.

Proof: with private `CARGO_TARGET_DIR=$PWD/.fgos/runtime/phase-target`, required locked Rust tests passed **25 tests**, required all-targets clippy with `-D warnings` passed, `node --test test/event-store/` passed **8 tests**. Package fmt and `git diff --check` passed. Impact-analysis: inactive (zero registered providers). No mocks, test-only switches, lifecycle calls or git add/commit. Full npm suite was not run for this dormant scoped fix.

Prior art: history identified foundation commits 0ce27efc3/25074b911; reuse the existing canonical line, timestamp, machine-id and stream validators. Hard-link install follows the existing OS primitive used by run-supervisor publish_once and terminal-control store; importing either consumer would invert the foundation dependency. The existing identity temp/write/fsync path was extended rather than adding a publication subsystem.

No substantive disagreement with the review. Life-long scope validation needs historical records: the crate now provides reconciliation and tests it across reconstructed registries; phase 03 must call it on every stored type/scope before appending (including sealed-only history). Phase 02 must wire the actual append lock and run stale-temp recovery only while excluding initializers. Serializer deferrals follow the brief's explicit ownership/Q1 constraints. Backlog/program-board updates and correction of the earlier unit-2 report are outside scope; this phase plan and experiment supersede its old fixture/raw-evidence paths.

Remaining low-priority review details: L3 full shared Node provenance/edge-case fixture coverage; L4 older tests still use some is_err assertions; L8 stream-regex/schema and domain-charset deduplication; L9 distribution audit relocation needs packages/distribution write ownership; L11 claims/history accumulate, peak includes prep, HOME/global configuration is inherited, and findmnt remains Linux-specific. These benchmark limits are recorded in the experiment. The phase handoff records layout facts pending the owning spec update. Preview via mdview was attempted but its SQLite database is read-only; files are directly readable.

Status: DONE_WITH_CONCERNS
Summary: All ten medium findings are fixed or have the review-prescribed integration boundary explicitly tracked; required checks pass. The standard-door ext4 baseline replaces the payload-only baseline of record.
Concerns/Blockers: Phase 02 lock wiring, phase 03 durable-history reconciliation, and the two tracked serializer moves remain with their owning phases.
Context refs:
- Phase 01 plan; Event Store spec §§5–8, 17, 21; review report; both earlier phase-lead reports; baseline experiment.
