mod common;

use common::{key, plain, t, Pair, A_NAME, B_NAME};
use fgos_mailbox_core::{AliasRefusal, CounterReason, MessageId, Refusal};

fn code(result: &Result<fgos_mailbox_core::SendOutcome, Refusal>) -> &'static str {
    match result {
        Ok(_) => "recorded",
        Err(refusal) => refusal.code(),
    }
}

fn hinted(from: &str, to: &str, hint: &MessageId) -> fgos_mailbox_core::SendRequest<'static> {
    let mut req = plain(from, to, "re");
    req.reply_to = Some(hint.clone());
    req
}

#[test]
fn a_body_at_the_size_cap_is_recorded_and_one_byte_more_is_refused_recording_nothing() {
    let mut pair = Pair::new(t(0));
    let max = pair.limits.max_body_bytes as usize;

    let at_cap = pair.try_send(plain("a", B_NAME, &"x".repeat(max)), t(1));
    assert_eq!(code(&at_cap), "recorded");
    let over = pair.try_send(plain("a", B_NAME, &"x".repeat(max + 1)), t(2));
    assert!(matches!(over, Err(Refusal::TooLarge { .. })), "{over:?}");
    assert_eq!(over.unwrap_err().code(), "too-large");
    assert_eq!(pair.state.messages().count(), 1);
    assert_eq!(pair.state.counters().total(CounterReason::TooLarge), 1);
}

#[test]
fn a_reply_is_linked_to_the_recipients_last_offered_unanswered_message_even_when_the_caller_omits_reply_to(
) {
    let mut pair = Pair::new(t(0));
    let question = pair.send("a", B_NAME, "question", t(1));
    pair.deliver("b", t(2));

    let reply = pair.try_send(plain("b", A_NAME, "answer"), t(3)).unwrap();

    assert_eq!(reply.reply_to, Some(question.clone()));
    assert_eq!(reply.depth, 1);
    assert!(pair.state.message(&question).unwrap().answered);
    let fresh = pair
        .try_send(plain("b", A_NAME, "unrelated"), t(4))
        .unwrap();
    assert_eq!(fresh.reply_to, None);
    assert_eq!(fresh.depth, 0);
}

#[test]
fn a_reply_to_hint_is_refused_unless_it_names_a_message_the_recipient_offered_to_the_sender_and_a_valid_hint_never_lowers_the_derived_depth(
) {
    let mut pair = Pair::new(t(0));
    let ttl = pair.limits.record.ttl_sec;

    // Not offered yet.
    let pending = pair.send("b", A_NAME, "pending", t(1));
    let refused = pair.try_send(hinted("a", B_NAME, &pending), t(2));
    assert_eq!(code(&refused), "reply-to-not-offered");

    // Notices live in their own lane, so their ids are never searched; the
    // chain below starts once the pending message has expired.
    let due = Pair::after(t(3), ttl);
    pair.sweep(due);

    // x: B to A at depth 0, offered and answered.
    let mut now = due;
    let mut step = |pair: &mut Pair, from: &str, to: &str| {
        now = now.plus_secs(1);
        pair.deliver(from, now);
        now = now.plus_secs(1);
        pair.try_send(plain(from, to, "hop"), now).unwrap()
    };
    let x = step(&mut pair, "b", A_NAME);
    assert_eq!(x.depth, 0);
    step(&mut pair, "a", B_NAME); // answers x
    assert!(pair.state.message(&x.id).unwrap().answered);
    // A fresh chain from A, five hops: B's message at depth 5 is the parent.
    let fresh = step(&mut pair, "a", B_NAME);
    assert_eq!(fresh.depth, 0);
    let mut last = fresh;
    for (from, to) in [
        ("b", A_NAME),
        ("a", B_NAME),
        ("b", A_NAME),
        ("a", B_NAME),
        ("b", A_NAME),
    ] {
        last = step(&mut pair, from, to);
    }
    assert_eq!(last.depth, 5);
    pair.deliver("a", now.plus_secs(1));

    let hinted_reply = pair
        .try_send(hinted("a", B_NAME, &x.id), now.plus_secs(2))
        .unwrap();

    assert_eq!(hinted_reply.depth, 6);
    assert_eq!(hinted_reply.reply_to, Some(last.id.clone()));
    assert_eq!(
        pair.state.message(&hinted_reply.id).unwrap().reply_to_hint,
        Some(x.id)
    );
}

#[test]
fn a_linked_chain_is_refused_one_step_past_the_depth_cap() {
    let mut pair = Pair::new(t(0));
    let max_depth = pair.limits.chain.max_depth;
    let mut now = t(0);
    let (mut from, mut to, mut reader) = ("a", B_NAME, "a");
    for expected in 0..=max_depth {
        now = now.plus_secs(1);
        pair.deliver(reader, now);
        let sent = pair.try_send(plain(from, to, "hop"), now).unwrap();
        assert_eq!(sent.depth, expected);
        (from, to, reader) = if from == "a" {
            ("b", A_NAME, "b")
        } else {
            ("a", B_NAME, "a")
        };
    }
    now = now.plus_secs(1);
    pair.deliver(reader, now);

    let refused = pair.try_send(plain(from, to, "one too many"), now);

    assert!(
        matches!(refused, Err(Refusal::TooDeep { .. })),
        "{refused:?}"
    );
    assert_eq!(pair.state.messages().count(), max_depth as usize + 1);
}

#[test]
fn refused_attempts_count_toward_the_session_budget_and_the_window_frees_it_again() {
    let mut pair = Pair::new(t(0));
    let budget = pair.limits.session.budget;
    let window = pair.limits.human.fallback_window_sec;
    let too_large = "x".repeat(pair.limits.max_body_bytes as usize + 1);
    for _ in 0..budget {
        let refused = pair.try_send(plain("a", B_NAME, &too_large), t(10));
        assert_eq!(code(&refused), "too-large");
    }

    let over_budget = pair.try_send(plain("a", B_NAME, "small"), t(10));
    assert!(
        matches!(over_budget, Err(Refusal::SessionBudget { .. })),
        "{over_budget:?}"
    );

    let later = pair.try_send(plain("a", B_NAME, "small"), Pair::after(t(10), window));
    assert_eq!(code(&later), "recorded");
}

#[test]
fn the_lifetime_cap_counts_refused_attempts_is_never_reset_by_time_and_a_new_sender_generation_starts_a_new_count(
) {
    let mut pair = Pair::new(t(0));
    let cap = pair.limits.session.lifetime_cap;
    let window = pair.limits.human.fallback_window_sec;
    let too_large = "x".repeat(pair.limits.max_body_bytes as usize + 1);
    for _ in 0..cap {
        assert_eq!(
            code(&pair.try_send(plain("a", B_NAME, &too_large), t(10))),
            "too-large"
        );
    }

    let after_window = Pair::after(t(10), window);
    let capped = pair.try_send(plain("a", B_NAME, "small"), after_window);
    assert!(
        matches!(capped, Err(Refusal::LifetimeCap { .. })),
        "{capped:?}"
    );
    let much_later = after_window.plus_secs(pair.limits.record.body_retention_sec * 10);
    assert_eq!(
        code(&pair.try_send(plain("a", B_NAME, "small"), much_later)),
        "lifetime-cap"
    );

    pair.take_over("a", "claude", much_later);
    assert_eq!(
        code(&pair.try_send(plain("a", B_NAME, "small"), much_later)),
        "recorded"
    );
}

#[test]
fn the_loop_guard_refuses_the_next_message_between_one_ordered_pair_inside_the_window_for_every_sender(
) {
    let mut pair = Pair::new(t(0));
    let max = pair.limits.loop_guard.max_per_window;
    for i in 0..max {
        let now = t(u64::from(i));
        assert_eq!(
            code(&pair.try_send(plain("a", B_NAME, "ping"), now)),
            "recorded"
        );
        pair.deliver("b", now);
    }
    let looped = pair.try_send(plain("a", B_NAME, "ping"), t(u64::from(max)));
    assert!(matches!(looped, Err(Refusal::Loop { .. })), "{looped:?}");
    // The other direction is another ordered pair.
    assert_eq!(
        code(&pair.try_send(plain("b", A_NAME, "pong"), t(u64::from(max)))),
        "recorded"
    );

    // Senders with no head that rotate their from share one guard.
    let mut cli = Pair::new(t(0));
    for i in 0..max {
        let now = t(u64::from(i));
        let from = format!("cli-run-{i}");
        assert_eq!(
            code(&cli.try_send(plain(&from, B_NAME, "ping"), now)),
            "recorded"
        );
        cli.deliver("b", now);
    }
    let looped = cli.try_send(plain("cli-run-new", B_NAME, "ping"), t(u64::from(max)));
    assert_eq!(code(&looped), "loop");
}

#[test]
fn a_full_queue_refuses_the_newest_message_and_keeps_the_old_ones_one_sender_cannot_take_more_than_its_share_and_leftover_mail_for_a_replaced_generation_does_not_count(
) {
    let mut pair = Pair::new(t(0));
    let cap = pair.limits.queue.cap;
    let share = pair.limits.queue.per_sender;

    // One sender fills its share.
    for _ in 0..share {
        assert_eq!(
            code(&pair.try_send(plain("a", B_NAME, "m"), t(1))),
            "recorded"
        );
    }
    assert_eq!(
        code(&pair.try_send(plain("a", B_NAME, "m"), t(1))),
        "sender-share-full"
    );

    // Other senders fill the queue.
    let mut sender = 0;
    while pair.state.inbox(&key("b")).len() < cap as usize {
        let name = format!("s{sender}");
        pair.add_head(&name, t(1));
        for _ in 0..share {
            if pair.state.inbox(&key("b")).len() == cap as usize {
                break;
            }
            assert_eq!(
                code(&pair.try_send(plain(&name, B_NAME, "m"), t(1))),
                "recorded"
            );
        }
        sender += 1;
    }
    let oldest: Vec<_> = pair
        .state
        .inbox(&key("b"))
        .iter()
        .map(|v| v.id.clone())
        .collect();
    pair.add_head("late", t(1));
    let newest = pair.try_send(plain("late", B_NAME, "m"), t(1));
    assert!(
        matches!(newest, Err(Refusal::QueueFull { .. })),
        "{newest:?}"
    );
    let kept: Vec<_> = pair
        .state
        .inbox(&key("b"))
        .iter()
        .map(|v| v.id.clone())
        .collect();
    assert_eq!(kept, oldest);

    // A new process at b does not inherit the old queue.
    pair.take_over("b", "codex", t(2));
    assert_eq!(
        code(&pair.try_send(plain("late", B_NAME, "m"), t(2))),
        "recorded"
    );
}

#[test]
fn a_flood_of_refused_sends_from_rotating_identities_leaves_the_snapshot_size_bounded() {
    let mut pair = Pair::new(t(0));
    let flood: u64 = 10_000;
    let probe: u64 = 100;
    let too_large = "x".repeat(pair.limits.max_body_bytes as usize + 1);
    let not_offered = pair.send("b", A_NAME, "pending", t(0));
    let mut size_after_probe = 0;
    for i in 0..flood {
        let from = format!("rotating-{i}");
        let mut req = match i % 4 {
            0 => plain(&from, "a,b", "group"),
            1 => plain(&from, &format!("nobody-{i}"), "unknown"),
            2 => plain(&from, B_NAME, &too_large),
            _ => plain(&from, A_NAME, "hint"),
        };
        if i % 4 == 3 {
            req.reply_to = Some(not_offered.clone());
        }
        assert!(pair.try_send(req, t(i)).is_err());
        if i + 1 == probe {
            size_after_probe = serde_json::to_vec(&pair.state).unwrap().len();
        }
    }

    // Only decimal digits may grow: the counters' totals and the times
    // kept in the budget window and the counters, a few digits each.
    let margin = 128;
    let size = serde_json::to_vec(&pair.state).unwrap().len();
    assert!(
        size <= size_after_probe + margin,
        "{size} > {size_after_probe} + {margin}"
    );
    assert_eq!(pair.state.messages().count(), 1);
    let counters = pair.state.counters();
    let total: u64 = [
        CounterReason::Group,
        CounterReason::UnknownName,
        CounterReason::TooLarge,
        CounterReason::ReplyToNotOffered,
    ]
    .into_iter()
    .map(|reason| counters.total(reason))
    .sum();
    assert_eq!(total, flood);
}

/// Spec §11 counterexample: a cycle of fresh messages is not a linked chain,
/// so depth never rises; only a lifetime cap stops it at this pace.
#[test]
fn the_a_b_c_a_cycle_keeps_depth_0_never_trips_the_loop_guard_and_is_stopped_by_a_lifetime_cap() {
    let mut pair = Pair::new(t(0));
    let c_name = pair.add_head("c", t(0));
    let cap = u64::from(pair.limits.session.lifetime_cap);
    let hops = [
        ("a", B_NAME, "b"),
        ("b", c_name.as_str(), "c"),
        ("c", A_NAME, "a"),
    ];
    let mut message = 0u64;
    let refusal = loop {
        // A broken cap fails here instead of looping for ever.
        assert!(message <= 3 * cap, "no refusal after {message} messages");
        let (from, to, reader) = hops[(message % 3) as usize];
        message += 1;
        let now = t(60 * message);
        match pair.try_send(plain(from, to, "next"), now) {
            Ok(sent) => assert_eq!(sent.depth, 0, "message {message}"),
            Err(refusal) => break (from, refusal),
        }
        pair.deliver(reader, now);
    };

    assert_eq!(message, 3 * cap + 1);
    assert_eq!(refusal.0, "a");
    assert_eq!(refusal.1.code(), "lifetime-cap");
    let counters = pair.state.counters();
    assert_eq!(counters.total(CounterReason::Loop), 0);
    assert_eq!(counters.total(CounterReason::SessionBudget), 0);
}

#[test]
fn a_sender_key_longer_than_the_header_bound_is_refused_before_any_other_check_and_records_nothing()
{
    let mut pair = Pair::new(t(0));
    let bound = pair.limits.frame.max_header_chars as usize;

    let refused = pair.try_send(plain(&"s".repeat(bound + 1), "a,b", "hi"), t(1));

    assert!(
        matches!(refused, Err(Refusal::SenderKeyTooLong { .. })),
        "{refused:?}"
    );
    assert_eq!(pair.state.messages().count(), 0);
    assert_eq!(
        pair.state.counters().total(CounterReason::SenderKeyTooLong),
        1
    );
    let at_bound = pair.try_send(plain(&"s".repeat(bound), B_NAME, "hi"), t(2));
    assert_eq!(code(&at_bound), "recorded");
}

#[test]
fn a_new_sender_generation_inherits_no_reply_link_and_cannot_hint_at_mail_offered_to_the_old_one() {
    let mut pair = Pair::new(t(0));
    let question = pair.send("b", A_NAME, "question for the first process", t(1));
    pair.deliver("a", t(2));
    pair.take_over("a", "claude", t(3));

    let mut hinted_req = plain("a", B_NAME, "re");
    hinted_req.reply_to = Some(question.clone());
    assert_eq!(
        code(&pair.try_send(hinted_req, t(4))),
        "reply-to-not-offered"
    );
    let fresh = pair
        .try_send(plain("a", B_NAME, "hello from a new process"), t(5))
        .unwrap();

    assert_eq!(fresh.reply_to, None);
    assert_eq!(fresh.depth, 0);
    assert!(!pair.state.message(&question).unwrap().answered);
}

#[test]
fn a_depth_capped_chain_does_not_block_a_new_process_of_its_sender() {
    let mut pair = Pair::new(t(0));
    let max_depth = pair.limits.chain.max_depth;
    let mut now = t(0);
    let (mut from, mut to) = ("a", B_NAME);
    for _ in 0..=max_depth {
        now = now.plus_secs(1);
        pair.deliver(from, now);
        pair.try_send(plain(from, to, "hop"), now).unwrap();
        (from, to) = if from == "a" {
            ("b", A_NAME)
        } else {
            ("a", B_NAME)
        };
    }
    now = now.plus_secs(1);
    pair.deliver(from, now);
    assert_eq!(
        code(&pair.try_send(plain(from, to, "one too many"), now)),
        "too-deep"
    );

    pair.take_over(from, if from == "a" { "claude" } else { "codex" }, now);
    let fresh = pair.try_send(
        plain(from, to, "hello from a new process"),
        now.plus_secs(1),
    );

    assert_eq!(code(&fresh), "recorded");
}

/// Owner decision M2 (2026-10-22, option A): a message offered longer
/// ago than the loop window is no longer a parent, so the side the depth
/// cap stopped can open a new topic; a parent offered within the window
/// still counts.
#[test]
fn a_depth_capped_side_can_write_again_once_its_parent_was_offered_longer_ago_than_the_loop_window()
{
    let mut pair = Pair::new(t(0));
    let max_depth = pair.limits.chain.max_depth;
    let window = pair.limits.loop_guard.window_sec;
    let mut now = t(0);
    let (mut from, mut to) = ("a", B_NAME);
    for _ in 0..=max_depth {
        now = now.plus_secs(1);
        pair.deliver(from, now);
        pair.try_send(plain(from, to, "hop"), now).unwrap();
        (from, to) = if from == "a" {
            ("b", A_NAME)
        } else {
            ("a", B_NAME)
        };
    }
    now = now.plus_secs(1);
    pair.deliver(from, now);
    let offered_at = now;

    let at_window = pair.try_send(plain(from, to, "same topic"), offered_at.plus_secs(window));
    assert_eq!(code(&at_window), "too-deep");
    let fresh = pair
        .try_send(
            plain(from, to, "a new topic"),
            offered_at.plus_secs(window + 1),
        )
        .unwrap();

    assert_eq!(fresh.depth, 0);
    assert_eq!(fresh.reply_to, None);
}

/// Owner decision on a head sending to itself (2026-10-22, option B): it is
/// refused as `self`. As for every refusal, the attempt still counts toward
/// the budget and the lifetime cap (spec §5.3); nothing else changes.
#[test]
fn a_head_sending_to_its_own_name_is_refused_as_self_and_changes_only_the_counts() {
    let mut pair = Pair::new(t(0));
    let before = serde_json::to_value(&pair.state).unwrap();

    let refused = pair.try_send(plain("a", A_NAME, "a note to myself"), t(0));

    assert!(matches!(refused, Err(Refusal::SelfSend)), "{refused:?}");
    assert_eq!(code(&refused), "self");
    assert_eq!(pair.state.counters().total(CounterReason::SelfSend), 1);
    let mut after = serde_json::to_value(&pair.state).unwrap();
    for counted in ["counters", "budget", "lifetime"] {
        assert_ne!(
            after[counted], before[counted],
            "{counted} records the attempt"
        );
        after[counted] = before[counted].clone();
    }
    assert_eq!(after, before);
}

#[test]
fn a_head_keyed_unregistered_keeps_its_own_account_apart_from_senders_with_no_head() {
    let mut pair = Pair::new(t(0));
    pair.add_head("unregistered", t(0));
    let share = pair.limits.queue.per_sender;
    for i in 0..share {
        assert_eq!(
            code(&pair.try_send(plain(&format!("cli-{i}"), B_NAME, "m"), t(1))),
            "recorded"
        );
    }

    let own = pair.try_send(plain("unregistered", B_NAME, "m"), t(1));

    assert_eq!(code(&own), "recorded");
}

/// One state per adjacent pair of checks (k, k + 1) of spec §5.3 in which
/// both fail; the first must win. Each failing condition is ordinary input
/// or a limit set through configuration.
#[test]
fn every_adjacent_pair_in_the_send_check_order_reports_the_earlier_check() {
    let long_key = |pair: &Pair| "k".repeat(pair.limits.frame.max_header_chars as usize + 1);
    // From a to b, with b's question offered to a, so a's send has a parent.
    let base = || {
        let mut pair = Pair::new(t(0));
        pair.send("b", A_NAME, "question", t(1));
        pair.deliver("a", t(2));
        pair
    };
    let too_large = |pair: &mut Pair| pair.limits.max_body_bytes = 0;
    let no_budget = |pair: &mut Pair| pair.limits.session.budget = 0;
    let no_lifetime = |pair: &mut Pair| pair.limits.session.lifetime_cap = 0;
    let no_depth = |pair: &mut Pair| pair.limits.chain.max_depth = 0;
    let no_loop = |pair: &mut Pair| pair.limits.loop_guard.max_per_window = 0;
    let no_queue = |pair: &mut Pair| pair.limits.queue.cap = 0;
    let no_share = |pair: &mut Pair| pair.limits.queue.per_sender = 0;
    let not_offered = MessageId::from_text("never-offered");

    let mut checked = Vec::new();
    let unknown_alias = || AliasRefusal::Unknown {
        candidates: Vec::new(),
    };
    let ambiguous_alias = || AliasRefusal::Ambiguous {
        candidates: Vec::new(),
    };
    for (expected, later) in [
        ("sender-key-too-long", "alias:unknown-name"),
        // An alias refusal takes check 2's place: it is never resolved, so
        // it comes before everything resolution would reach.
        ("alias:unknown-name", "reply-to-not-offered"),
        ("alias:ambiguous-name", "too-large"),
        ("sender-key-too-long", "group"),
        ("group", "unknown-name"),
        // `self` is judged on the resolved name, so it can never fail
        // together with `unknown-name`; this pair spans it.
        ("unknown-name", "reply-to-not-offered"),
        ("self", "reply-to-not-offered"),
        ("reply-to-not-offered", "too-large"),
        ("too-large", "session-budget"),
        ("session-budget", "lifetime-cap"),
        ("lifetime-cap", "too-deep"),
        ("too-deep", "loop"),
        ("loop", "queue-full"),
        ("queue-full", "sender-share-full"),
    ] {
        let mut pair = base();
        let mut from = "a".to_string();
        let mut to = B_NAME.to_string();
        let mut hint = None;
        let mut alias = None;
        for failing in [expected, later] {
            match failing {
                "alias:unknown-name" => alias = Some(unknown_alias()),
                "alias:ambiguous-name" => alias = Some(ambiguous_alias()),
                "sender-key-too-long" => from = long_key(&pair),
                "group" => to = "x,y".to_string(),
                // "x,y" also names nobody, so a group stays unknown too.
                "unknown-name" if to.contains(',') => {}
                "unknown-name" => to = "nobody".to_string(),
                "self" => to = A_NAME.to_string(),
                "reply-to-not-offered" => hint = Some(not_offered.clone()),
                "too-large" => too_large(&mut pair),
                "session-budget" => no_budget(&mut pair),
                "lifetime-cap" => no_lifetime(&mut pair),
                "too-deep" => no_depth(&mut pair),
                "loop" => no_loop(&mut pair),
                "queue-full" => no_queue(&mut pair),
                "sender-share-full" => no_share(&mut pair),
                other => panic!("no condition for {other}"),
            }
        }
        let mut req = plain(&from, &to, "body");
        req.reply_to = hint;
        if let Some(refusal) = alias {
            req.to = fgos_mailbox_core::Recipient::Refused(refusal);
        }

        let result = pair.try_send(req, t(3));

        assert_eq!(
            code(&result),
            expected.trim_start_matches("alias:"),
            "{expected} before {later}"
        );
        checked.push(expected);
    }
    assert_eq!(checked.len(), 14);
}
