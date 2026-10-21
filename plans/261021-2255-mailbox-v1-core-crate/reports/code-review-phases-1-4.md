# Code review: mailbox V1 core crate, phases 1-4

Date 2026-10-21 (Asia/Saigon). Reviewer: code-reviewer (read-only).
Scope: `git diff 27e5412bc 9dfb3db25 -- packages/mailbox Cargo.toml` on `mailbox/v1-v3`
(worktree `/home/vantt/projects/forgent-mailbox`). 24 files, +3188 lines: `limits.v1.json`,
crate `fgos-mailbox-core` (src 11 files, tests 8 files).
Read against: spec `docs/platform/agent-mailbox/spec.md` §5, §6.1, §6.4, §10, §11, §12, §17;
plan.md decisions 1-16 and Q1-Q3; phase-01..04 implementation notes; `reports/validation-and-red-team.md`.

## Method and gates

- The crate at `9dfb3db25` was exported with `git archive` into a scratch workspace (the live
  worktree carries another agent's uncommitted phase-5 work), with the same pinned serde versions.
- `cargo test -p fgos-mailbox-core`: 36 tests, all green (registry 9, names 6, delivery 11,
  sweep 7, counters 1, snapshot 1, limits contract 1). Counts match the phase acceptance criteria.
- `cargo clippy --all-targets -- -D warnings`: clean. `cargo fmt --check`: clean.
- Every suspected defect below marked CONFIRMED was reproduced with a throwaway test in the
  scratch copy (deleted afterwards; nothing written to the repo).

## Overall assessment

The state machine is correct on every path the spec names: generation checks happen before any
mutation on `claim`, `finish` is per-message and never all-or-nothing, the four-row registration
table is exact, the clock high-water mark is applied consistently, notices go only to the sending
generation, and the sweep order is readable in one place. No Critical or High defect was found.
The findings are one spec field the crate and the plan both miss, one snapshot-evolution gap that
V2 inherits, and a handful of confirmed edge cases at the bounds.

## Critical

None.

## High

None.

## Medium

### M1. `last_drain_at` is in the spec's snapshot but in neither the crate nor the plan (PLAUSIBLE: spec-to-code gap, verified by grep)

- Where: `src/state.rs:16-30` (`MailboxState` fields); `src/delivery.rs:257-272` (`claim` returns
  early and unchanged when nothing is eligible).
- Spec: §6.4 line 353 lists `last_drain_at` per address among the snapshot's contents; §9 signal 9
  ("time since `last_drain_at` while mail is pending") and §12 ("`last_drain_at` is the interim
  detector of a skipped hook") depend on it. `git grep -i last_drain` finds nothing in
  `packages/mailbox` or the plan directory.
- Failure: V2 persists `MailboxState` as is (state.rs:2), so V3 or V7 must change the core's type and
  the `claim` contract to add it, against the goal "API shape V2 and V3 can use without changes".
  The current "empty claim changes nothing" rule (delivery.rs:270-272) also conflicts with stamping a
  drain time on the no-mail path, and stamping it there forces a snapshot write on every hook, which
  bears on the owner's 50 ms p95 no-mail target.
- Fix: add `last_drain_at: Option<Timestamp>` to `Binding` (per address), set by `claim` for the
  current generation, and decide explicitly whether an empty drain stamps it (one write per hook) or
  only a drain that took something (cheaper, but signal 9 then needs "pending and not drained since
  recorded"). This is a decision question for the plan owner, not a silent choice; record it in
  phase 6 or 8.

### M2. The snapshot type has no schema version and silently drops unknown fields (CONFIRMED)

- Where: `src/state.rs:16-30` and every nested snapshot struct (`Header`, `Binding`, `Notice`,
  `BoundedCounters`): no `deny_unknown_fields`, no version, every field required.
- Repro: serialize a state, add a field `"lifetime": {...}`, deserialize and serialize again: the
  field is gone, no error.
- Failure: spec §6.4 names "a window in which an old and a new version run together" as the real risk.
  Phases 5-6 add the session-budget, lifetime-cap and exchange records. An old binary that reads a
  newer snapshot drops them and installs the result, silently resetting caps that are "never reset"
  (spec §5.3). The other direction, a newer binary reading an older snapshot that lacks a required
  field, is a hard deserialize error, so every hook fails until the snapshot is deleted.
- Fix: carry a snapshot schema version and refuse a snapshot from a newer version. This can live in
  the core (`MailboxState { version, .. }` plus `deny_unknown_fields`) or in the V2 store envelope.
  Name the owner now, so phases 5-6 do not add fields before the rule exists. Decide whether an older
  snapshot is migrated or reset (the data is short-lived runtime state, L1/L7, so "reset with a
  counter" is defensible).

### M3. Header retention of 7 days makes snapshot size a function of a week's throughput (PLAUSIBLE: sizing risk, not a logic bug)

- Where: `src/sweep.rs:109-130` (`header_keep = max(loop.windowSec, record.ttlSec,
  record.bodyRetentionSec)`), plan decision 5.
- Decision 5 is sound against the spec. Bodies of offered and refused messages are kept 7 days, and
  §6.4 makes an unreferenced body garbage, so the header must outlive the body. It does not reverse
  any owner decision. But the shared `unregistered` sender alone may record up to
  `session.budget` per `human.fallbackWindowSec` (20 per 600 s, about 2,900 a day), and each live
  generation adds up to `session.lifetimeCap` (200). Over 7 days that is tens of thousands of
  headers, several MB of JSON, read and rewritten by every hook under the mutex. `message(id)`
  (state.rs:52) and `finish` (delivery.rs:390) also scan linearly.
- Fix: no V1 code change required. Make V2's size measurement include a 7-day steady-state snapshot
  at the §12 limits against the 50 ms p95 target. If it fails, the bounded alternative is to keep
  bodies' retention on a small separate list of `(id, changed_at)` instead of whole headers. Changing
  the 7-day value itself is not proposed (it is a §12 starting value).

### M4. Branches that matter have no owning proof (CONFIRMED by reading the tests; behaviour itself verified correct by probe)

- `src/sweep.rs:73`: a notice whose addressee's generation ended is removed with `notice-expired`.
  `tests/sweep.rs` test 6 proves only the TTL half. A regression that drops
  `|| current != Some(n.to_generation)` would let a notice reach a successor process (spec §5.1
  "never replayed into a stranger") and no test fails.
- `src/delivery.rs:418-425`: a notice finished by a stale generation is listed as ignored and kept.
  Untested.
- `src/delivery.rs:160` (`checkpoint == Checkpoint::Step` for notices): "a notice is never offered at
  Stop" is exercised only inside the snapshot fixture (`tests/snapshot.rs:89-99`), which asserts
  states, not the rule. A behaviour proof belongs in `tests/sweep.rs`.
- `src/delivery.rs:399` (`&header.to != key`, recorded as a phase-3 deviation "a token cannot finish
  mail addressed to another head"): untested.
- Fix: extend `tests/sweep.rs` test 6 (or a new titled test) with the generation-ended case and the
  Stop exclusion; extend `tests/delivery.rs` test 7 with a notice claimed by generation 1. Each
  extension names its behaviour; none duplicates an existing proof.

## Low

### L1. An unregistered sender can be labelled exactly like a real head (CONFIRMED)

- Where: `src/delivery.rs:182-195` (`sender_label`); the claim in the doc comment at
  delivery.rs:89-90 and the test title `a_sender_with_no_head_is_labelled_unregistered_and_can_never_pass_for_a_head`.
- Repro: project folder `unregistered`, a Codex head gets `unregistered-codex-01`. An unregistered
  sender whose writer id starts with `codex-01` (legal in session identity's alphabet
  `[A-Za-z0-9._-]`) is labelled `unregistered-codex-01`, the same string.
- Impact: low. It needs a project folder named `unregistered`, and `sender_has_head` still differs.
  But the "never" claim is false, and phase 7's frame will print `from_label`.
- Fix: use a separator that no short name can hold at that position. For example, make the
  unregistered label contain a character outside the short-name shape, or prefix it with a word
  that `compose` refuses as a project part. Then extend the existing test with this case.

### L2. A full key that prefixes another key cannot be addressed by key (CONFIRMED)

- Where: `src/names.rs:113-128`. The key step matches prefixes only, with no exact-key step.
- Repro: agy heads keyed by terminal-root pid (spec §5.1.1) `1234` and `12345`: `resolve("1234")` is
  `Ambiguous`.
- Spec §5.1.1 calls "the full key, or a unique prefix of it" the unambiguous fallback. The short name
  still works, so impact is small.
- Fix: test an exact key match before the key-prefix step; extend `tests/names.rs` test 4.

### L3. Generation saturates at `u32::MAX`, after which a takeover keeps the old generation (CONFIRMED via a crafted snapshot)

- Where: `src/ids.rs:197-200` (`saturating_add`), `src/registry.rs:140`.
- Repro: a binding at `u32::MAX` is replaced (`Dead`) and returns `Replaced` with the same
  generation; generation 1's token then finishes successfully after the takeover.
- Unreachable by restarts in practice; reachable only through a corrupt or hand-edited snapshot.
  It is still the one way the core accepts a stale token.
- Fix: `checked_add` and refuse the registration (for example `RegisterRefusal::GenerationExhausted`)
  instead of returning a generation that did not change.

### L4. The core accepts any non-empty `WriterKey`, so the header bound relies on the caller (CONFIRMED)

- Where: `src/ids.rs:93-100`. Repro: a 1 MB `from` is stored verbatim in the header and in the snapshot.
- Session identity already bounds env ids to 200 characters of `[A-Za-z0-9._-]`
  (`packages/session-identity/rust/src/resolve.rs:15,69-75`), so the live path is safe. But the core
  owns the snapshot-size guarantee and already has `frame.maxHeaderChars`. `head` and `handle`
  (registry.rs:39-41) are likewise unbounded opaque text from the store.
- Fix: validate `WriterKey` length (and optionally alphabet) against the header bound at the
  boundary, or document that the store must bound it and test that in V2.

### L5. Notice-lane overflow can evict a notice that is in flight (CONFIRMED)

- Where: `src/notices.rs:117-129` removes the oldest notice of the address regardless of its state.
- Repro: `notices.cap = 1`. A notice is claimed (emitted), a second notice is created before the
  finish, and the in-flight one is evicted. The finish then reports it in neither `offered` nor
  `ignored`, and `notice-dropped` is counted for a notice that was in fact emitted.
- Fix: prefer evicting the oldest `Recorded` notice, and fall back to the oldest overall only when
  every notice is in flight.

### L6. `inbox` omits notices that `inbox --claim` would consume; `MessageView.kind` is always `Message`

- Where: `src/delivery.rs:439-461`. The read-only view lists messages only, while a `Step` claim
  also takes notices (§6.1: `inbox --claim` "by the same protocol as drain"). The `kind` field
  therefore never varies. Either list notices in the view or drop the field.

### L7. `send` takes the body by value only to measure it, while minting the id internally

- Where: `src/delivery.rs:224` (`body_bytes: req.body.len()`). The store needs the id to name the
  immutable body file, and the id exists only after `send`. So V2 must clone the body (up to
  `maxBodyBytes`) before the call. Taking `body: &str` (phase 5 needs it for the size check) avoids
  the copy and makes ownership explicit. This is an API shape point for V2, cheap to change now.

### L8. Small contract and documentation inaccuracies

- `src/state.rs:5-6` says "every map key is a `String` newtype", but `BoundedCounters.totals` is keyed
  by the enum `CounterReason` (counters.rs:79). It round-trips (serde_json writes unit variants as
  string keys, and the snapshot test covers it), so only the comment is wrong.
- `src/delivery.rs:16` `UNREGISTERED_LABEL_CHARS = 8` is a numeric literal that is not in the limits
  contract. It is a display width fixed by phase 3's design, not a policy value, so keeping it is
  acceptable. Say so in the comment, or derive it from `frame.maxHeaderChars`.

## Recorded deviations (phases 2-4): verdict

All sound; none contradicts the spec or a §17 owner decision.

- `NameDoesNotFit`, names carried on `Registered`, `is_past` in milliseconds, the judgement check
  placed before sweep: sound. Verified that a mismatch leaves the whole state equal.
- `MessageState` naming, `Claim.token: Option`, stale claim placed before the sweep, recording order
  as claim order, `inbox` limited to the current generation, the recipient check in `finish`: sound.
  §5.1 "never replayed into a stranger" supports the inbox restriction.
- `sweep` taking `IdSource`, `RefusalReason` reused for notices, `NoticeFacts`, the `mailbox` label
  that no name can take (verified: every short name has two `-` separated tails), notices only at
  `Step`, sweep refusals counted, bump-sequence eviction: sound.
- Offers counted at claim rather than at deadline (spec §5.2 says "returns to recorded with its offer
  count raised"): equivalent count, and the offer-cap test proves exactly `maxOffers` offers.
- A refused registration (`Conflict`, `Deferred`, `NameDoesNotFit`) still runs the sweep, so it
  changes state (CONFIRMED). This is consistent with plan decision 10 and red-team R8 ("install
  after `Err` too"), and the binding itself is untouched as the table requires. It is not a defect.
- Bindings never removed: plan decision 11, owner question Q2 pending. It is not raised as a defect.
  One consequence is missing from Q2's harm list: dead bindings stay resolvable. `forgent-codex`
  becomes ambiguous after the second Codex session ever. If the only Codex binding is dead, the
  name resolves to it and the message waits 24 h for a TTL refusal, instead of the §5.1 "unknown
  address" refusal. Add this to Q2's framing so the owner answers it before V2.

## Edge cases checked and found correct

Clock step-back on every entry point (`finish` uses `max(last_now, now)` without sweeping;
consistent with §5.2, where a late finish before any sweep is legitimately accepted). Mail of an old
generation: never claimed, hidden from inbox, refused at TTL with a notice routed only if the sender's
generation is current. An in-flight message whose recipient was replaced returns to `recorded` at the
deadline and then leaves by TTL. `notices.cap = 0` and `counters.maxKeys = 0` terminate.
Suffix allocation terminates (the tail grows until `compose` returns `None`). Name truncation is
byte-safe because the project part is ASCII after mapping. The snapshot round-trips, including enum
map keys.

## Positive observations (for risk calibration only)

The purity lint (`clippy.toml`) and the missing-key negative test for the limits contract hold plan
decision 1 mechanically. The test titles name behaviours, and each phase extends one owning test
instead of copying cases.

## Recommended actions (priority order)

1. M1: decide where `last_drain_at` lives and whether an empty drain stamps it; add it before V2
   freezes the snapshot shape.
2. M2: name the owner of snapshot versioning (core or V2 envelope) before phases 5-6 add budget
   and lifetime fields.
3. M4: add the four missing proofs (generation-ended notice, Stop excludes notices, stale-generation
   notice finish, recipient check in finish).
4. L1, L2, L3, L5: small local fixes, each with an extension of its owning test.
5. M3: put a 7-day steady-state snapshot size into V2's measurement.
6. L4, L6, L7, L8 and the Q2 note: tidy before phase 8.

## Plan status (report only; no plan file edited)

Phases 1-4 appear complete against their acceptance criteria. Test counts match (16 for phase 2, 11
for phase 3 including the added label proof, 8 for phase 4), and the gates are green. Mutation-census
regeneration was not checked (outside the reviewed diff).

## Unresolved questions

- M1: does an empty drain write the snapshot to stamp `last_drain_at`? This trades signal 9's
  accuracy against the 50 ms no-mail hook target.
- M2: does snapshot versioning belong to the core type or to the V2 store envelope?

Status: DONE_WITH_CONCERNS
Summary: Phases 1-4 are correct on every spec-named transition, with 36 tests, clippy and fmt green. No Critical or High finding. Two Medium gaps should be settled before V2 freezes the snapshot: `last_drain_at` is missing, and the snapshot has no version or unknown-field rule. There are also four untested branches and six confirmed low-severity edge cases.
Concerns/Blockers: M1 and M2 need a plan-owner decision (where the field and the version rule live); neither blocks phases 5-7, but both should land before V2.
