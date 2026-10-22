# Final code review: `fgos-mailbox-core` (V1 rung)

Date: 2026-10-22 (Asia/Saigon). Reviewer: code-reviewer, read-only.

Scope: the whole crate at `9560082d9` on `mailbox/v1-v3`. `git diff --stat 9560082d9 HEAD -- packages/mailbox` is empty, so the later commits are docs-only, as stated. That is 14 source files (2,003 lines), 12 test files (2,654 lines), `limits.v1.json` and `frame.v1.txt`.

Read against: spec §5, §6, §8, §11 (Core suite), §12, §14 (the V1 row) and §17; plan.md decisions 1-16; the review `code-review-phases-1-4.md`; and the V3 plan `261022-0007-mailbox-v3-hook-payload-contract/plan.md`, with phase 3 for the core changes it already plans.

## Method

- I exported the crate with `git archive 9560082d9` into `/tmp/fgos-work/mbx-review`. It builds there as a one-member workspace with the pinned serde versions and the branch `Cargo.lock`, offline. I ran no cargo command in the shared worktree.
- Gates, all green:
  - `cargo test -p fgos-mailbox-core`: 78 tests;
  - `cargo clippy --all-targets -D warnings`, with the crate's `clippy.toml`;
  - `cargo fmt --check`.
- Adversarial probes: 12 throwaway tests in `/tmp/fgos-work/mbx-review/packages/mailbox/rust/core/tests/zz_review.rs`. Every probe cited as CONFIRMED below passes, which means it reproduces the suspicion.
- Mutation census: `/tmp/fgos-work/mbx-review-scripts/mutate.py` made 32 single-point mutations of the policy, wake, drain, sweep, notice and escape branches, ran the existing suite against each one, and restored the sources after each.
  - 24 mutations were killed.
  - 1 made the suite hang instead of fail.
  - 7 survived.

  The survivors are listed in M5, L4, L5 and L6.

## Overall assessment

The crate implements the V1 rung faithfully.

- The check order 0-10 matches spec §5.3 and plan decision 4 exactly.
- Attempts are counted before any check.
- The shared `unregistered` account closes every rotation path for senders with no head:
  - budget, loop guard, share and exchange (probed);
  - the snapshot stays bounded under a refused flood from 10,000 rotating identities (existing test).
- The effective wake is computed once at `send`, and the Stop drain reads only that field.
- The scripted pair reproduces the measured 6 / 8 / 101.
- The frame escape holds the structural guarantee. There is one opening tag and one closing tag, every body line sits behind the gutter, and only contract lines follow.
- All fixes from the phase 1-4 review landed correctly, with no regression found (see the table below).

No Critical or High defect was found. The Medium findings fall into three groups:

- two policy edges where stale state reaches across a generation or across days (M1, M2);
- maps scoped to a generation or a key that nothing ever removes, which V2's pruning will make worse (M3);
- a fixed check order that is mostly unproven by tests (M5). This was the main test-quality gap.

## Critical

None.

## High

None.

## Medium

### M1. The derived parent and the reply hint ignore the sender's generation, so a new process inherits a chain it never saw (CONFIRMED)

- Where: `src/policy.rs:163-176` (`derived_parent`) and `src/policy.rs:107-123` (`check_reply_hint`). Both match `h.to == from` with no check of `h.to_generation`.
- Repro, probe `r12`:
  1. A and B ping-pong to depth 6.
  2. B's head dies, and B is taken over at generation 2.
  3. B's first send from the new process (`"hello from a new process"`) is refused `too-deep`. Its derived parent is the last message offered to generation 1.
- Probes `r4` and `r10` show the milder forms:
  - the first fresh send of generation 2 gets `reply_to` = a generation-1 message and depth 1, and marks that message `answered`;
  - generation 2 may pass a `--reply-to` hint naming mail that only generation 1 was offered.
- Why it is wrong: spec §5.1 says the next session "receives only messages written for that generation, so a stale instruction is never replayed into a stranger". Spec §5.4 derives the link from "an offered message from Y to X". Generation 2 was never offered that message. This is exactly "a stale generation acts", seen from the policy side.
- Fix: in both functions, also require `h.to_generation == sender's current generation`. Pass `from_generation` from `admit`, which already has it; a sender with no head has no parent. Extend `a_reply_is_linked_to_...` or the depth-cap test with a takeover case. This does not reverse a §17 decision.

### M2. After the depth cap fires, the refused side cannot reach its peer on any topic until the peer writes first or 7 days pass (CONFIRMED behaviour; impact PLAUSIBLE; owner question)

- Where: `src/policy.rs:163-176`. The derived parent has no age bound, and `src/sweep.rs:109-130` retires an offered header only after `max(loop.windowSec, record.ttlSec, record.bodyRetentionSec)`, which is 7 days with the §12 values.
- Repro, probe `r11`: after the chain reaches `too-deep`, a send from the same side 48 hours later on a new topic is still refused `too-deep`. A refused send never marks the parent answered, so the block lasts until the peer sends something fresh or the header retires. Combined with M1, even a restart does not clear it.
- Spec §5.4 has no age bound, so the code is faithful. But the refusal tells the agent to ask its user, and the user cannot clear it either. Real agents stopped at 4 messages (§5.3 evidence), so this is rare, but it is a dead end when it happens.
- Fix: this is a decision for the owner, because it changes §5.4 semantics. Option A: a message offered more than `loop.windowSec` (or `record.ttlSec`) ago is no longer a parent, which reuses an existing key and adds none. Option B: keep the rule, and say in the refusal text that the peer must write first. Ask using the decision-question template; do not change it silently.

### M3. Lifetime, wake-lifetime, exchange and budget entries are never removed, so the snapshot grows with every process restart; Q2's pruning will reuse `key@1` (CONFIRMED growth; PLAUSIBLE V2 hazard)

- Where:
  - `src/state.rs:99-105` (the `budget`, `lifetime`, `exchanges` and `wake_lifetime` maps);
  - `src/policy.rs:66-72` and `src/wake.rs:118` insert into them;
  - `src/registry.rs:153-167`: the `Dead` takeover drops nothing.
- Repro, probe `r1`: 50 takeovers of one head, each followed by one wake send, leave 100 entries in `lifetime` + `wake_lifetime`. An entry for an old generation can never be read again, because `send` always uses the current generation (`delivery.rs:282`).
- V2 hazard: §17 Q2 prunes a dead binding, and "a later registration of the same key starts at generation 1". The `lifetime` entry `key@1` and the `wake_lifetime` entries `key@1|*` survive the prune. A brand-new process with that key then inherits the old process's count. If that count was at the cap, the new head is refused `lifetime-cap` on its first send, which breaks the per-generation rule of §5.3. The fields are `pub(crate)`, so V2 cannot clean them up without a core change.
- Fix:
  - In the `Dead` branch of `register`, remove the old generation's `lifetime` and `wake_lifetime` entries.
  - In `sweep`, drop `exchanges` entries whose `last_at + exchangeGapSec` has passed (an absent entry is equivalent) and `budget` entries whose deque has emptied.
  - Make V2's prune one core operation that removes the binding together with every key-scoped entry: `lifetime`, `wake_lifetime`, `exchanges`, `budget` and `notice_last`.

  Each change is one extension of an existing owning test, for example the lifetime-cap test with a takeover.

### M4. One process can register any number of keys, and each key gets its own budget, loop guard and queue share; live bindings are never pruned (CONFIRMED in the core; PLAUSIBLE end to end)

- Where: `src/registry.rs:171-203` (`create`). It does not look at whether another binding already holds the same `head` text.
- Repro, probe `r7`: three keys registered with the same `head` (`"same-process"`) sent 36 accepted messages to one recipient in one window, where one identity is capped at 12 (loop guard) and 20 (budget).
- Harm:
  - Rate limits multiply by the number of keys. The per-recipient `queue.cap` and the TTL still bound pending mail.
  - Every registration adds a binding that V2's Q2 pruning never removes while the process is `Alive`. Bindings, exchanges and `resolve` cost then grow without bound.
- The V3 plan (decision 13) already makes "the caller is the head CLI" a shell duty for V4/V5. That narrows the risk, but does not remove it: a forged environment id on a real head still registers a fresh key.
- Fix: this is a decision question for V3. A Claude `/clear` may legitimately change the session id within one process, which is unmeasured. The two options are:
  - refuse `create` when a live binding has the same `head`;
  - retire that binding into the new key.

  The core can compare the opaque `head` text for equality without interpreting it.

### M5. The fixed check order is mostly unproven: 4 of 5 adjacent-pair swaps survive (CONFIRMED by mutation)

- Where: `src/policy.rs:84-95` (`admit`). These swaps all leave the suite green:
  - reply-hint ↔ size;
  - budget ↔ lifetime;
  - depth ↔ loop;
  - queue ↔ share.
- Only check 0 coming first (`a_sender_key_longer_than...`) and size before budget are pinned.
- Removing the lifetime check entirely makes the suite hang instead of fail (L6).
- §5.3 states the order as a rule ("the first failing check wins, one reason per refusal"), and the order decides the reason the sender sees and the counter that `status` reads.
- Fix: one owning proof in `tests/policies.rs`, a table-driven test. For each adjacent pair (k, k+1), build a state where both fail and assert the code of k. No other test proves this behaviour, so it adds no second copy.

### M6. The frame API lets V3 panic the hook: `render_notice` `expect`s a notice, and `ClaimedItem` encodes "message or notice" twice (CONFIRMED)

- Where:
  - `src/frame.rs:182-187` (`expect("render_notice takes a claimed notice")`);
  - `src/delivery.rs:147-160` (`kind: Kind` plus `notice: Option<NoticeFacts>`, which the comment says must agree).
- Repro, probe `r6`: `render_notice` on a message item panics.
- The V3 drain is fail-quiet with exit 0 (spec §8.7). A panic in the hook process breaks that.
- V3 phase 3 already adds a third entry point, `render_message_body_missing`.
- Fix:
  - Make the item one enum, `ClaimedItem { id, attempt, what: Mail { from_label, from_cli, sender_has_head } | Notice(NoticeFacts) }`.
  - Expose one `render(item, body: Option<&str>, limits)`, where `None` renders the body-missing line.

  This makes the invalid state unrepresentable, and V3 gets one door instead of three.

## Low

### L1. `Header.kind` is always `Message`; three filters are dead and the "a notice id never qualifies" proof is phantom (CONFIRMED)

- Where: `src/envelope.rs:51`; `src/policy.rs:113,168,191`. `send` is the only header constructor, and it always writes `Kind::Message` (`delivery.rs:316`). Notices live in their own `Notice` type.
- The mutation "remove `h.kind == Kind::Message`" survives. The hint test's notice case (`tests/policies.rs:63-75`) passes no matter what the hint check does with notices, because notices are never searched.
- Fix: drop `Header.kind` and the three filters. Keep `Kind` only on the view types. Retitle the notice part of the hint test to what it proves ("an id from the notices lane names no offered message"), or drop it. This changes the snapshot shape, so fold it into V3's schema bump to version 2.

### L2. Code-point escape gaps: the Cf list is incomplete, and default-ignorable characters and variation selectors pass (CONFIRMED)

- Where: `src/frame.rs:94-113` (`is_format`). The doc comment says "category Cf".
- Probe `r5`. These pass the escape:
  - Cf code points U+0890-0891, U+08E2, U+110CD, U+13430-1343F, U+1BCA0-1BCA3 and U+1D173-1D17A;
  - invisible default-ignorables U+034F, U+115F, U+3164, U+FFA0 and U+2800;
  - variation selectors U+FE00-FE0F and U+E0100-E01EF, which can encode hidden bytes;
  - full-width and small-form angle brackets (`＜/mailbox-message＞`).
- None of these breaks the structural guarantee: the gutter still prefixes every line. This is the "lowers the risk" layer only.
- Fix:
  - Remove Unicode's Default_Ignorable_Code_Point set, which covers Cf, the fillers, U+034F and the variation selectors. Variation selectors U+FE00-FE0F could be kept for emoji if the owner prefers.
  - Correct the comment.
  - Leave the look-alike brackets to the V6 measurement, and say so in the spec.

### L3. Composite map keys are built by string joining, and the core does not restrict the key alphabet (CONFIRMED in the core; the live path is safe)

- Where: `src/counters.rs:14,184-190` (`Account` with `"unregistered"`); `src/wake.rs:28-36` (`ExchangeKey` `a|b`); `WakeLifetimeKey` `from@gen|to`; `src/ids.rs:94-100` (`WriterKey::new` accepts any non-empty text).
- Probe `r9`: the pairs `("x|y","z")` and `("x","y|z")` share one exchange, so they share one wake quota.
- Probe `r3`: a head whose key is `unregistered` shares its account with every sender that has no head. Its sends are refused `sender-share-full` after a runner fills the share.
- Session identity's alphabet `[A-Za-z0-9._-]` excludes `|` and `@`, so only the `unregistered` collision is reachable live, through `FGOS_SESSION_ID=unregistered`.
- Fix:
  - Validate `WriterKey` against session identity's alphabet and the header bound in its constructor. Check 0 and `KeyTooLong` then become type invariants.
  - Give `Account` a form that no key can take, for example a leading character outside the alphabet.

### L4. A test proves less than its title claims: no case covers a `-` in an unregistered key (CONFIRMED by mutation)

- Where: `tests/delivery.rs:204-227`; `src/delivery.rs:258` (the `c != '-'` mapping).
- Removing the `-` mapping survives, yet the mapping is load-bearing. Key `co-de-xx` would be labelled `unregistered_co-de-xx`. A head of project `unregistered_co` with CLI `de` and suffix `xx` is named exactly that.
- Fix: add this collision to the existing test.

### L5. The `&` entity has no proof (CONFIRMED by mutation)

- Where: `src/frame.rs:140`. Removing `&` → `&amp;` survives.
- Without it, a body `&lt;/mailbox-message&gt;` reaches the model verbatim, one entity-decode away from a closing tag.
- Fix: add that body to the hostile-body table in `tests/frame.rs:82`.

### L6. Unbounded loops in tests hang instead of failing

- Where: `tests/policies.rs:359-368` (A→B→C→A `loop {}`) and `tests/scripted_pair.rs:194` (`for i in 1u64..`).
- With the lifetime check removed, the suite spins forever. I killed it after 30 minutes.
- Fix: bound each loop by a value derived from the limits, for example `3 * lifetime_cap + 1` iterations, and assert on overrun.

### L7. `schema_version` is only enforced if the store remembers to call `SnapshotVersion::check` (CONFIRMED)

- Where: `src/state.rs:82-84`.
- Probe `r2`: a snapshot with `schema_version: 99` deserializes into a `MailboxState` without error.
- `deny_unknown_fields` catches a bump that adds fields, but not one that changes meaning without adding any.
- Fix: validate the version inside `Deserialize` (`#[serde(try_from = …)]`). The store then cannot skip the check, and `SnapshotVersion` remains the cheap pre-read.

### L8. Small cost and KISS items

- `frame::section` (`src/frame.rs:44-50`) re-parses the whole contract on every call, three times per frame. Parse once with `OnceLock`.
- `check_loop` and `check_share` (`src/policy.rs:193,236`) allocate an `Account` `String` per retained header per send. With 7-day header retention (M3 of the earlier review), that is two allocations per header on every send.
- `ResolveRefusal::Unknown` (`src/names.rs:133`) lists every binding, including dead ones. That list is unbounded until V2 prunes.
- Spec wording: `limits.v1.json` says the exchange gap is "a silence longer than this", while the code and §5.3 ("below the gap value") start a new exchange at exactly the gap. Align the contract text.

## Verification of the phase 1-4 review fixes

| Earlier finding | Fix at `9560082d9` | Verdict |
|---|---|---|
| M1 `last_drain_at` | `Binding.last_drain_at`, stamped only when mail is pending (`delivery.rs:359-366`) | correct; both mutations (no stamp, stamp on empty) killed |
| M2 schema version | `schema_version`, `deny_unknown_fields`, `SnapshotVersion::check` | correct as a contract; enforcement is opt-in (L7) |
| M4 four missing proofs | tests in `sweep.rs` and `delivery.rs` | correct; the mutations "notice at Stop", "expire ignores generation", "finish ignores current" and "token for another head" are all killed |
| L1 label | `unregistered_` plus `-` mapped to `_` | correct; the proof misses the `-` case (L4) |
| L2 exact key | exact key before the key prefix | correct, tested |
| L3 generation | `checked_add`, `GenerationExhausted` | correct, tested |
| L4 key length | check 0 and `KeyTooLong` | correct; order proven against group; alphabet still open (L3) |
| L5 in-flight notice eviction | evicts only the oldest `Recorded` notice | correct; mutation killed |
| L6 inbox notices | notices listed with `Kind::Notice` | correct |
| L7 borrowed body | `body: &str` | correct |
| L8 comments | fixed | correct |

No regression was introduced. Moving the `has_pending` early return before the sweep keeps the no-mail path free of writes.

## Adversarial attempts: summary

| Attempt | Result |
|---|---|
| Grow the snapshot without bound | Refused floods and rotation by senders with no head are bounded (existing test). The maps scoped to a generation grow with restarts (M3). Bindings grow with self-registered keys (M4) and with dead heads until V2. |
| Bypass a per-sender limit by rotating identities | Blocked for senders with no head (probed: loop guard, exchange, share). Possible with registered keys (M4). |
| Reset depth or a lifetime cap | Depth: not reset. It over-binds instead, across generations and for 7 days (M1, M2). Lifetime: reset only by a new generation, as designed. The V2 prune will inherit an old count (M3). |
| Smuggle text out of the frame | The structure holds (tags, forged frames, forged trailing lines, line separators, bidi and tag characters). The residual is invisible code points (L2). |
| Make a stale generation or token act | Claim, finish and notices are safe, with mutations killed. A stale generation still acts through the derived parent and the hint (M1). |
| Make an unregistered sender pass as a head | Label: safe, with the proof gap in L4. `sender_has_head` comes from the binding. Impersonation through a forged `from` equal to a head's key is outside the core (spec §5.1 "attribution only"). The `unregistered` key collision is L3. |

## Readiness for V2 and V3: changes they force on the core

V2 (store, snapshot with `schema_version`):

1. A prune operation (§17 Q2) that also removes the key's `lifetime`, `wake_lifetime`, `exchanges`, `budget` and `notice_last` entries (M3). It is required, because the fields are `pub(crate)`.
2. A body garbage-collection query, deferred by plan decision 16. The store can derive it today from `messages().filter(|h| h.body_kept)` plus a directory listing, so the core may need nothing more. Decide this explicitly.
3. Recommended: enforce the version in `Deserialize` (L7).
4. The `IdSource` must be random or otherwise unique across processes. The test `SeqIds` restarts at 1, and the core never checks a minted id for collision. Keep this a V2 duty and state it in the V2 plan.

V3 (hook drain):

1. Already planned (phase 3): `Binding.stop_blocks` with `note_stop`; `register` that makes no mutation on the same-head and refused rows; `render_message_body_missing`; schema version 2.
2. Forced by this review: a single, total render entry over an item enum (M6). Otherwise `render_reply` must keep the kind and the option in sync by hand, and a slip panics the hook.
3. Decision needed before registration lands: one binding per head (M4).
4. Fold L1 (drop `Header.kind`) into the same schema bump.

The rest of the API fits V3's plan as verified against the code: `claim(key, generation, Checkpoint, now, limits, ids)`, `finish(key, generation, token, now)`, the borrowed body, `Claim.token: Option`, `MessageState`/`Header` being `Clone + PartialEq`, and `Limits` accepting unknown top-level keys.

## Quality

- One owning proof per behaviour: mostly respected. Test titles name behaviours, and each phase extended its owning file. The gaps are M5 (order), L4 and L5 (one missing case each) and L1 (a phantom case).
- Tests that would fail if their branch broke: 24 of 32 mutations were killed, 1 hung (L6) and 7 survived (M5 ×4, L1, L4, L5).
- Numeric literals: none in policy code. `MILLIS_PER_SEC`, `SUFFIX_LEN` (spec shape) and `UNREGISTERED_LABEL_CHARS` (a display width the spec names) are definitional. In tests, `TURN_SECS = 20` comes from the measurement and `u32::MAX` is a sentinel meaning "disabled"; both are acceptable.
- Types: clean newtypes, `deny_unknown_fields` throughout, `forbid(unsafe_code)`. The weak spots are the stringly composite keys (L3), the kind duplicated with the option (M6) and `WriterKey` with no alphabet (L3).
- KISS: good. The only redundancy found is L1 and the repeated contract parse (L8).

## Verdict

**V1 meets its rung: YES.** The policy logic is proven. Every §11 Core-suite item that V1 owns has an owning test, the scripted replays reproduce 6 / 8 / 101, the hostile-body suite holds the structural guarantee, and all gates are green. Nothing blocks V1.

These should land before V2 freezes the snapshot. They are not blockers of the V1 rung:

- M1: scope the parent and the hint to the sender's generation.
- M3: drop entries of old generations, and design the prune as one core operation.
- M5: one table-driven proof of the check order.

These need an owner or planning decision:

- M2: an age bound on the derived parent.
- M4: one binding per head.

M6 should be taken into V3 phase 3.

## Unresolved questions

1. M2: should a parent offered longer ago than `loop.windowSec` (or `record.ttlSec`) stop counting as a parent? This needs the owner, because it changes §5.4.
2. M4: does a Claude `/clear` change the session id within one process? If so, should a new key from the same head replace the old binding, or be refused?
3. A send to oneself (`to` resolves to the sender's own key) is allowed and bounded only by the ordinary policies. Is it intended? The spec is silent.

Status: DONE_WITH_CONCERNS
Summary: V1 meets its rung. The policy logic is proven by 78 green tests, including the 6/8/101 replays and the hostile-body suite, and every fix from the earlier review is correct with no regression. I found 6 Medium and 8 Low issues, none Critical or High, each confirmed by a throwaway probe or a mutation.
Concerns/Blockers: Nothing blocks V1. Before V2: M1 (stale generation steers the reply link), M3 (old-generation and pruned-key entries never removed) and M5 (check order mostly unproven). Owner or planning questions: M2 (7-day depth lockout) and M4 (one binding per head). M6 (a render API that can panic) should be folded into V3 phase 3.
