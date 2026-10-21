mod common;

use common::{key, plain, t, Pair, A_NAME, B_NAME};
use fgos_mailbox_core::{Checkpoint, Kind, WakeDrop};

fn stop_claim(
    pair: &mut Pair,
    key_text: &str,
    now: fgos_mailbox_core::Timestamp,
) -> fgos_mailbox_core::Claim {
    let generation = pair.state.binding(&key(key_text)).unwrap().generation;
    pair.state.claim(
        &key(key_text),
        generation,
        Checkpoint::Stop,
        now,
        &pair.limits,
        &mut pair.ids,
    )
}

#[test]
fn within_one_exchange_the_first_max_per_exchange_wake_sends_take_effect_and_the_next_is_recorded_with_its_wake_dropped(
) {
    let mut pair = Pair::new(t(0));
    let quota = pair.limits.wake.max_per_exchange;
    for i in 0..quota {
        let sent = pair.send_wake("a", B_NAME, t(u64::from(i)));
        assert!(sent.effective_wake, "wake {i}");
        assert_eq!(sent.wake_dropped, None);
    }

    let next = pair.send_wake("a", B_NAME, t(u64::from(quota)));

    assert!(!next.effective_wake);
    assert_eq!(next.wake_dropped, Some(WakeDrop::ExchangeQuota));
    let header = pair.state.message(&next.id).unwrap();
    assert!(header.wake);
    assert!(!header.effective_wake);
}

#[test]
fn a_reply_to_a_woken_message_wakes_its_requester_within_the_quota() {
    let mut pair = Pair::new(t(0));
    let quota = u64::from(pair.limits.wake.max_per_exchange);
    let mut sent = Vec::new();
    for i in 0..=quota {
        let now = t(i);
        let (from, to) = if i % 2 == 0 {
            ("a", B_NAME)
        } else {
            ("b", A_NAME)
        };
        pair.deliver(from, now);
        sent.push(pair.send_wake(from, to, now));
    }

    assert!(sent[..quota as usize].iter().all(|s| s.effective_wake));
    assert_eq!(sent[1].depth, 1, "the reply is linked");
    assert_eq!(
        sent[quota as usize].wake_dropped,
        Some(WakeDrop::ExchangeQuota)
    );
}

#[test]
fn a_gap_just_under_the_exchange_gap_stays_one_exchange_and_a_gap_at_the_value_starts_a_fresh_allowance(
) {
    let mut pair = Pair::new(t(0));
    let quota = u64::from(pair.limits.wake.max_per_exchange);
    let gap = pair.limits.wake.exchange_gap_sec;
    let mut now = t(0);
    for _ in 0..quota {
        assert!(pair.send_wake("a", B_NAME, now).effective_wake);
        pair.deliver("b", now);
        now = now.plus_secs(gap - 1);
    }
    let held = pair.send_wake("a", B_NAME, now);
    assert_eq!(held.wake_dropped, Some(WakeDrop::ExchangeQuota));
    pair.deliver("b", now);

    let fresh = pair.send_wake("a", B_NAME, now.plus_secs(gap));

    assert!(fresh.effective_wake);
}

#[test]
fn a_one_way_sender_slower_than_the_exchange_gap_is_stopped_by_the_wake_lifetime_cap_and_a_new_sender_generation_starts_a_new_count(
) {
    let mut pair = Pair::new(t(0));
    let cap = pair.limits.wake.lifetime_cap;
    let spacing = pair.limits.wake.exchange_gap_sec + 1;
    let mut now = t(0);
    for i in 0..cap {
        let sent = pair.send_wake("a", B_NAME, now);
        assert!(sent.effective_wake, "wake {i}");
        assert_eq!(sent.depth, 0);
        pair.deliver("b", now);
        now = now.plus_secs(spacing);
    }

    let capped = pair.send_wake("a", B_NAME, now);
    assert_eq!(capped.wake_dropped, Some(WakeDrop::LifetimeCap));

    pair.deliver("b", now);
    pair.take_over("a", "claude", now);
    let renewed = pair.send_wake("a", B_NAME, now.plus_secs(spacing));
    assert!(renewed.effective_wake);
}

#[test]
fn a_wake_false_send_never_takes_effect() {
    let mut pair = Pair::new(t(0));

    let sent = pair.try_send(plain("a", B_NAME, "fyi"), t(1)).unwrap();

    assert!(!sent.effective_wake);
    assert_eq!(sent.wake_dropped, None);
    assert!(!pair.state.message(&sent.id).unwrap().effective_wake);
}

#[test]
fn a_stop_claim_takes_only_effective_wake_messages_a_dropped_wake_message_waits_for_the_next_step_claim_and_notices_wait_too(
) {
    let mut pair = Pair::new(t(0));
    let quota = pair.limits.wake.max_per_exchange as usize;
    // A notice for b: its message to a expired unread.
    pair.send("b", A_NAME, "never read", t(0));
    let now = Pair::after(t(0), pair.limits.record.ttl_sec);
    pair.sweep(now);
    assert_eq!(pair.state.notices().count(), 1);
    let sent: Vec<_> = (0..=quota)
        .map(|_| pair.send_wake("a", B_NAME, now))
        .collect();
    let fyi = pair.try_send(plain("a", B_NAME, "fyi"), now).unwrap();

    let stop = stop_claim(&mut pair, "b", now);
    let taken: Vec<_> = stop.items.iter().map(|i| i.id.clone()).collect();
    let woken: Vec<_> = sent[..quota].iter().map(|s| s.id.clone()).collect();
    assert_eq!(taken, woken);

    let step = pair.deliver("b", now);
    let kinds: Vec<_> = step.items.iter().map(|i| (i.id.clone(), i.kind)).collect();
    assert_eq!(kinds.len(), 3);
    assert!(kinds.contains(&(sent[quota].id.clone(), Kind::Message)));
    assert!(kinds.contains(&(fyi.id, Kind::Message)));
    assert!(kinds.iter().any(|(_, kind)| *kind == Kind::Notice));
}

#[test]
fn a_sender_with_no_head_that_rotates_its_from_cannot_open_fresh_exchanges() {
    let mut pair = Pair::new(t(0));
    let quota = pair.limits.wake.max_per_exchange;
    for i in 0..quota {
        let sent = pair.send_wake(&format!("cli-run-{i}"), B_NAME, t(u64::from(i)));
        assert!(sent.effective_wake);
    }

    let rotated = pair.send_wake("cli-run-new", B_NAME, t(u64::from(quota)));

    assert_eq!(rotated.wake_dropped, Some(WakeDrop::ExchangeQuota));
}
