mod common;

use common::{key, t, Pair, B_NAME};
use fgos_mailbox_core::{
    CounterReason, Generation, Kind, MessageState, NoticeState, RefusalReason,
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
            .party(CounterReason::NoticeUndeliverable, "unregistered", "b")
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
    assert_eq!(claim.items[0].kind, Kind::Notice);
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
    // Sent one notice window apart, so each refusal makes its own notice.
    let ids: Vec<_> = (0..=cap)
        .map(|i| pair.send("a", B_NAME, "never claimed", t(i * spacing)))
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
