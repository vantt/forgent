mod common;

use common::{key, t, Pair, A_NAME, B_NAME};
use fgos_mailbox_core::{
    Checkpoint, CounterReason, Generation, Kind, MessageState, NoticeState, RefusalReason,
};

const G1: Generation = Generation::FIRST;

fn notices_to(pair: &Pair, key_text: &str) -> Vec<(RefusalReason, String)> {
    pair.state
        .notices()
        .filter(|n| n.to == key(key_text))
        .map(|n| (n.reason, n.about.as_str().to_string()))
        .collect()
}

#[test]
fn an_in_flight_message_whose_deadline_passes_at_the_last_allowed_offer_is_refused_with_one_notice_to_its_sender(
) {
    let mut pair = Pair::new(t(0));
    let ttl = pair.limits.in_flight_ttl_sec;
    let id = pair.send("a", B_NAME, "hello", t(0));
    // Already offered maxOffers - 1 times, each claim lost before its finish.
    let mut now = t(0);
    for _ in 1..pair.limits.max_offers {
        pair.claim("b", G1, now);
        now = Pair::after(now, ttl);
    }

    let last = pair.claim("b", G1, now);
    assert_eq!(last.items[0].attempt, pair.limits.max_offers);
    pair.sweep(Pair::after(now, ttl));

    let header = pair.state.message(&id).unwrap();
    assert!(matches!(
        header.state,
        MessageState::Refused {
            reason: RefusalReason::OfferCap,
            ..
        }
    ));
    assert_eq!(
        notices_to(&pair, "a"),
        vec![(RefusalReason::OfferCap, id.as_str().to_string())]
    );
    let notice = pair.state.notices().next().unwrap();
    assert_eq!(notice.to_generation, G1);
    assert_eq!(pair.state.counters().total(CounterReason::OfferCap), 1);
}

#[test]
fn a_recorded_message_older_than_the_record_ttl_is_refused_with_a_notice() {
    let mut pair = Pair::new(t(0));
    let id = pair.send("a", B_NAME, "hello", t(10));

    pair.sweep(t(10).plus_secs(pair.limits.record.ttl_sec));
    assert_eq!(
        pair.state.message(&id).unwrap().state,
        MessageState::Recorded
    );

    pair.sweep(Pair::after(t(10), pair.limits.record.ttl_sec));
    let header = pair.state.message(&id).unwrap();
    assert!(matches!(
        header.state,
        MessageState::Refused {
            reason: RefusalReason::RecordTtl,
            ..
        }
    ));
    assert_eq!(
        notices_to(&pair, "a"),
        vec![(RefusalReason::RecordTtl, id.as_str().to_string())]
    );
    assert_eq!(pair.state.counters().total(CounterReason::RecordTtl), 1);
}

#[test]
fn a_refused_message_whose_sender_has_no_head_or_a_newer_generation_creates_no_notice_and_counts_it(
) {
    let mut pair = Pair::new(t(0));
    pair.send("the-fgos-cli", B_NAME, "from a sender with no head", t(0));
    pair.send("a", B_NAME, "from the first process of a", t(0));
    pair.take_over("a", "claude", t(5));

    pair.sweep(Pair::after(t(0), pair.limits.record.ttl_sec));

    assert_eq!(pair.state.notices().count(), 0);
    let counters = pair.state.counters();
    assert_eq!(counters.total(CounterReason::RecordTtl), 2);
    assert_eq!(counters.total(CounterReason::NoticeUndeliverable), 2);
    assert_eq!(
        counters
            .party(
                CounterReason::NoticeUndeliverable,
                fgos_mailbox_core::UNREGISTERED,
                "b"
            )
            .map(|p| p.count),
        Some(1)
    );
}

#[test]
fn a_second_notice_of_the_same_reason_to_the_same_sender_inside_the_window_is_suppressed_even_after_the_first_was_offered_and_finished(
) {
    let mut pair = Pair::new(t(0));
    let ttl = pair.limits.record.ttl_sec;
    pair.send("a", B_NAME, "first", t(0));
    pair.send("a", B_NAME, "second", t(5));

    let first_due = Pair::after(t(0), ttl);
    pair.sweep(first_due);
    assert_eq!(pair.state.notices().count(), 1);
    let claim = pair.claim("a", G1, first_due);
    assert_eq!(claim.items.len(), 1);
    assert_eq!(claim.items[0].kind(), Kind::Notice);
    let finished = pair
        .state
        .finish(&key("a"), G1, &claim.token.unwrap(), first_due);
    assert_eq!(finished.offered.len(), 1);
    assert_eq!(pair.state.notices().count(), 0);

    pair.sweep(Pair::after(t(5), ttl));

    assert_eq!(pair.state.notices().count(), 0);
    assert_eq!(
        pair.state.counters().total(CounterReason::NoticeSuppressed),
        1
    );
}

#[test]
fn the_notices_lane_drops_its_oldest_notice_when_it_overflows() {
    let mut pair = Pair::new(t(0));
    let cap = pair.limits.notices.cap as u64;
    let spacing = pair.limits.notices.window_sec + 1;
    let ttl = pair.limits.record.ttl_sec;
    // Sent one notice window apart, so each refusal makes its own notice,
    // and spread over two recipients so no queue share fills first.
    let c_name = pair.add_head("c", t(0));
    let ids: Vec<_> = (0..=cap)
        .map(|i| {
            let to = if i % 2 == 0 { B_NAME } else { c_name.as_str() };
            pair.send("a", to, "never claimed", t(i * spacing))
        })
        .collect();
    for i in 0..=cap {
        pair.sweep(Pair::after(t(i * spacing), ttl));
    }

    let held: Vec<String> = notices_to(&pair, "a")
        .into_iter()
        .map(|(_, about)| about)
        .collect();
    let expected: Vec<String> = ids[1..].iter().map(|id| id.as_str().to_string()).collect();
    assert_eq!(held, expected);
    assert_eq!(pair.state.counters().total(CounterReason::NoticeDropped), 1);
}

#[test]
fn an_unfinished_notice_is_never_offered_again_and_an_undelivered_notice_expires_after_the_record_ttl(
) {
    let mut pair = Pair::new(t(0));
    let ttl = pair.limits.record.ttl_sec;
    pair.send("a", B_NAME, "hello", t(0));
    let due = Pair::after(t(0), ttl);
    pair.sweep(due);
    let claim = pair.claim("a", G1, due);
    assert!(matches!(
        pair.state.notices().next().unwrap().state,
        NoticeState::InFlight { .. }
    ));
    assert_eq!(claim.items.len(), 1);

    let later = Pair::after(due, pair.limits.in_flight_ttl_sec);
    let again = pair.claim("a", G1, later);
    assert!(again.items.is_empty());
    assert_eq!(pair.state.notices().count(), 0);
    assert_eq!(
        pair.state
            .counters()
            .total(CounterReason::NoticeUndelivered),
        1
    );

    let mut idle = Pair::new(t(0));
    idle.send("a", B_NAME, "hello", t(0));
    let created = Pair::after(t(0), ttl);
    idle.sweep(created);
    idle.sweep(created.plus_secs(ttl));
    assert_eq!(idle.state.notices().count(), 1);
    idle.sweep(Pair::after(created, ttl));
    assert_eq!(idle.state.notices().count(), 0);
    assert_eq!(idle.state.counters().total(CounterReason::NoticeExpired), 1);
}

#[test]
fn the_body_reference_goes_after_body_retention_and_the_header_after_the_longest_window() {
    let mut pair = Pair::new(t(0));
    // Body retention shorter than the record TTL, so the two rules part.
    pair.limits.record.body_retention_sec = pair.limits.loop_guard.window_sec;
    let retention = pair.limits.record.body_retention_sec;
    let longest = pair.limits.record.ttl_sec;
    let id = pair.send("a", B_NAME, "hello", t(0));
    let token = pair.claim("b", G1, t(0)).token.unwrap();
    pair.state.finish(&key("b"), G1, &token, t(1));

    pair.sweep(t(1).plus_secs(retention));
    assert!(pair.state.message(&id).unwrap().body_kept);
    pair.sweep(Pair::after(t(1), retention));
    assert!(!pair.state.message(&id).unwrap().body_kept);
    pair.sweep(t(1).plus_secs(longest));
    assert!(pair.state.message(&id).is_some());
    pair.sweep(Pair::after(t(1), longest));
    assert!(pair.state.message(&id).is_none());

    // With the contract values both rules fall on the same instant.
    let mut spec = Pair::new(t(0));
    let ret = spec.limits.record.body_retention_sec;
    let id = spec.send("a", B_NAME, "hello", t(0));
    let changed = Pair::after(t(0), spec.limits.record.ttl_sec);
    spec.sweep(changed);
    spec.sweep(changed.plus_secs(ret));
    assert!(spec.state.message(&id).unwrap().body_kept);
    spec.sweep(Pair::after(changed, ret));
    assert!(spec.state.message(&id).is_none());
}

/// A's message to B expires unread, so A holds one notice about it.
fn pair_with_notice_for_a() -> (Pair, fgos_mailbox_core::Timestamp) {
    let mut pair = Pair::new(t(0));
    pair.send("a", B_NAME, "never read", t(0));
    let due = Pair::after(t(0), pair.limits.record.ttl_sec);
    pair.sweep(due);
    assert_eq!(pair.state.notices().count(), 1);
    (pair, due)
}

#[test]
fn a_notice_whose_addressee_generation_ended_is_removed_before_it_reaches_the_successor() {
    let (mut pair, due) = pair_with_notice_for_a();

    let g2 = pair.take_over("a", "claude", due);
    let claim = pair.claim("a", g2, due);
    assert!(claim.items.is_empty());
    assert!(pair.state.inbox(&key("a")).is_empty());

    // Well inside the record TTL: only the ended generation removes it.
    pair.sweep(due.plus_secs(1));

    assert_eq!(pair.state.notices().count(), 0);
    assert_eq!(pair.state.counters().total(CounterReason::NoticeExpired), 1);
}

#[test]
fn a_notice_is_never_taken_at_stop() {
    let (mut pair, due) = pair_with_notice_for_a();

    let stop = pair.state.claim(
        &key("a"),
        G1,
        Checkpoint::Stop,
        due,
        &pair.limits,
        &mut pair.ids,
    );

    assert!(stop.items.is_empty());
    assert_eq!(
        pair.state.notices().next().unwrap().state,
        NoticeState::Recorded
    );
}

#[test]
fn a_notice_finished_by_a_generation_that_is_not_current_is_ignored_and_stays_in_flight() {
    let (mut pair, due) = pair_with_notice_for_a();
    let claim = pair.claim("a", G1, due);
    let token = claim.token.unwrap();

    let finished = pair
        .state
        .finish(&key("a"), G1.next().unwrap(), &token, due);

    assert!(finished.offered.is_empty());
    assert_eq!(finished.ignored, vec![claim.items[0].id.clone()]);
    assert!(matches!(
        pair.state.notices().next().unwrap().state,
        NoticeState::InFlight { .. }
    ));
}

#[test]
fn the_notices_lane_never_evicts_an_in_flight_notice_and_refuses_the_new_one_when_only_in_flight_notices_are_older(
) {
    let mut pair = Pair::new(t(0));
    // One notice per address: ordinary configuration through the production path.
    pair.limits.notices.cap = 1;
    let ttl = pair.limits.record.ttl_sec;
    let lapse = pair.limits.in_flight_ttl_sec + 1;
    let c_name = pair.add_head("c", t(0));
    let at = |base: fgos_mailbox_core::Timestamp, back_secs: u64| {
        fgos_mailbox_core::Timestamp::from_millis(base.as_millis() - back_secs * 1000)
    };
    // m1 (to b) expires unread at `due`: a record-ttl notice for a.
    pair.send("a", B_NAME, "never read", t(0));
    let due = Pair::after(t(0), ttl);
    // m2 (to c) is claimed maxOffers times and never finished; its last
    // claim lapses while a's first notice is still in flight.
    let last_claim = at(due, lapse / 2);
    let first_claim = at(last_claim, lapse * u64::from(pair.limits.max_offers - 1));
    pair.send("a", &c_name, "claimed, never finished", first_claim);
    for offer in 0..pair.limits.max_offers {
        pair.claim("c", G1, first_claim.plus_secs(lapse * u64::from(offer)));
    }
    pair.sweep(due);
    let claim = pair.claim("a", G1, due);
    let emitted = claim.items[0].id.clone();

    let offer_cap_due = last_claim.plus_secs(lapse);
    pair.sweep(offer_cap_due);

    let held: Vec<_> = pair.state.notices().map(|n| n.id.clone()).collect();
    assert_eq!(held, vec![emitted.clone()]);
    assert_eq!(pair.state.counters().total(CounterReason::OfferCap), 1);
    assert_eq!(pair.state.counters().total(CounterReason::NoticeDropped), 1);
    let finished = pair
        .state
        .finish(&key("a"), G1, &claim.token.unwrap(), offer_cap_due);
    assert_eq!(finished.offered, vec![emitted]);
}

#[test]
fn inbox_lists_pending_notices_as_notices_like_the_claim_that_would_take_them() {
    let (pair, _) = pair_with_notice_for_a();

    let views = pair.state.inbox(&key("a"));

    assert_eq!(views.len(), 1);
    assert_eq!(views[0].kind, Kind::Notice);
    assert_eq!(views[0].id, pair.state.notices().next().unwrap().id);
    assert!(!views[0].in_flight);
}

/// The shared sender with no head, the one identity no lifetime cap brakes
/// (owner decision Q3), at its session budget for a whole header horizon,
/// reaches `Limits::sender_header_ceiling`, derived from the limits
/// contract alone, and stops growing there. That refused sends never grow the snapshot is
/// owned by the bounded-counter test.
#[test]
fn one_saturated_sender_stops_growing_at_the_derived_header_ceiling() {
    let mut pair = Pair::new(t(0));
    let limits = pair.limits.clone();
    let budget = limits.session.budget;
    // Two recipients alternately, so neither the loop guard nor the
    // sender's share of one queue refuses within a window.
    assert!(budget.div_ceil(2) < limits.loop_guard.max_per_window);
    assert!(budget.div_ceil(2) <= limits.queue.per_sender);
    // A window starts once the last one is fully past: the budget and the
    // loop guard count an attempt until more than their window passed.
    assert_eq!(
        limits.loop_guard.window_sec,
        limits.human.fallback_window_sec
    );
    let step = limits.human.fallback_window_sec + 1;
    let windows = limits
        .header_horizon_sec()
        .div_ceil(limits.human.fallback_window_sec)
        + 2;
    let ceiling = limits.sender_header_ceiling() as usize;

    let mut counts = Vec::new();
    for window in 0..windows {
        let now = t(window * step);
        for i in 0..budget as usize {
            let to = [common::A_NAME, B_NAME][i % 2];
            pair.try_send(common::plain("cli-sender", to, "m"), now)
                .unwrap();
        }
        pair.deliver("a", now);
        pair.deliver("b", now);
        counts.push(pair.state.messages().count());
    }

    let most = *counts.iter().max().unwrap();
    assert_eq!(most, ceiling, "the ceiling is reached and never passed");
    let last = &counts[counts.len() - 2..];
    assert_eq!(last[0], last[1], "not steady at the end: {last:?}");
}

/// The state without the clock a sweep always advances: what a write would
/// persist beyond `last_now`.
fn persisted(state: &fgos_mailbox_core::MailboxState) -> serde_json::Value {
    let mut value = serde_json::to_value(state).unwrap();
    value.as_object_mut().unwrap().remove("last_now");
    value
}

#[test]
fn a_time_rule_is_due_exactly_when_a_sweep_would_change_the_state() {
    let mut pair = Pair::new(t(100));
    let l = pair.limits.clone();
    // Every rule gets an item: a claim left in flight, a message never read
    // (refused at the record TTL, which leaves a notice and its mark), and a
    // message offered and settled (its body and then its header retire).
    let lost = pair.send("a", B_NAME, "claimed, never finished", t(100));
    let claim = pair.state.claim(
        &key("b"),
        fgos_mailbox_core::Generation::FIRST,
        fgos_mailbox_core::Checkpoint::Step,
        t(110),
        &l,
        &mut pair.ids,
    );
    assert_eq!(claim.items.len(), 1);
    let _ = lost;
    let read = pair.send("b", A_NAME, "read at once", t(120));
    let claim = pair.state.claim(
        &key("a"),
        fgos_mailbox_core::Generation::FIRST,
        fgos_mailbox_core::Checkpoint::Step,
        t(121),
        &l,
        &mut pair.ids,
    );
    pair.state.finish(
        &key("a"),
        fgos_mailbox_core::Generation::FIRST,
        claim.token.as_ref().unwrap(),
        t(122),
    );
    assert!(matches!(
        pair.state.message(&read).unwrap().state,
        fgos_mailbox_core::MessageState::Offered { .. }
    ));
    pair.send("b", A_NAME, "never read", t(130));

    // The contract makes the body retention and the header horizon equal to
    // the record TTL; the timeline relies on that, so it is checked.
    assert_eq!(l.record.body_retention_sec, l.record.ttl_sec);
    assert_eq!(l.header_horizon_sec(), l.record.ttl_sec);
    let ttl = l.record.ttl_sec;
    let window = l.notices.window_sec;
    // Each step names the one rule that falls due at it, in time order.
    let steps: [(u64, Option<&str>, &str); 9] = [
        (131, None, "nothing"),
        (110 + l.in_flight_ttl_sec + 1, None, "the claim expires"),
        (
            100 + ttl + 2,
            None,
            "the claimed-then-expired message passes its record TTL",
        ),
        (122 + ttl + 1, None, "the offered message retires"),
        (
            130 + ttl + 1,
            None,
            "the unread message passes its record TTL",
        ),
        (
            100 + ttl + 2 + window + 1,
            None,
            "the first notice mark is forgotten",
        ),
        (
            100 + ttl + 2 + window + 3,
            Some("a"),
            "a's generation changed: its notice drops",
        ),
        (
            130 + ttl + 1 + window + 1,
            None,
            "the second notice mark is forgotten",
        ),
        (130 + ttl + 1 + window + 2, None, "nothing"),
    ];
    let mut due_seen = 0;
    for (secs, takes_over, rule) in steps {
        if let Some(who) = takes_over {
            pair.take_over(who, "claude", t(secs - 1));
        }
        let now = t(secs);
        let due = pair.state.time_rule_due(now, &l);
        let mut swept = pair.state.clone();
        swept.sweep(now, &l, &mut pair.ids.clone());
        assert_eq!(
            due,
            persisted(&swept) != persisted(&pair.state),
            "at {secs}s ({rule})"
        );
        assert_eq!(due, rule != "nothing", "at {secs}s ({rule})");
        due_seen += usize::from(due);
        // Move on as the next operation would: apply what was due.
        pair.state = swept;
        assert!(
            !pair.state.time_rule_due(now, &l),
            "nothing is due right after a sweep at {secs}s"
        );
    }
    assert_eq!(due_seen, 7);
}
