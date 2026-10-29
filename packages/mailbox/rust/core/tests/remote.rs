mod common;

use common::{key, t, Pair, B_NAME};
use fgos_mailbox_core::{CounterReason, Ingested, MessageState, Refusal, RemoteMail, Settlement};
use std::collections::BTreeSet;

const WIRE_CAP: u64 = 2048;

fn mail<'a>(
    from: &'a fgos_mailbox_core::WriterKey,
    id: &'a str,
    to: &'a fgos_mailbox_core::WriterKey,
    body: &'a str,
) -> RemoteMail<'a> {
    RemoteMail {
        machine: "peer-machine",
        id,
        from,
        handle: Some("claude-ab12@peer"),
        to,
        body,
        max_body_bytes: WIRE_CAP,
    }
}

fn ingest(pair: &mut Pair, mail: &RemoteMail<'_>, at: u64) -> Result<Ingested, Refusal> {
    pair.state
        .ingest_remote(mail, &BTreeSet::new(), t(at), &pair.limits, &mut pair.ids)
}

#[test]
fn a_verified_remote_message_is_recorded_once_for_the_current_generation_with_its_origin_and_never_wakes(
) {
    let mut pair = Pair::new(t(0));
    let from = key("session-1");
    let to = key("b");
    let taken = ingest(&mut pair, &mail(&from, "m1", &to, "hello"), 1).unwrap();
    let Ingested::Recorded(id) = taken else {
        panic!("{taken:?}")
    };

    let header = pair.state.message(&id).unwrap();
    assert_eq!(header.state, MessageState::Recorded);
    assert_eq!(header.to, to);
    assert!(!header.wake && !header.effective_wake && header.reply_to.is_none());
    let origin = header.origin.as_ref().unwrap();
    assert_eq!(
        (origin.machine.as_str(), origin.id.as_str()),
        ("peer-machine", "m1")
    );
    assert_eq!(origin.handle.as_deref(), Some("claude-ab12@peer"));
    let waiting = pair.state.inbox(&to);
    assert_eq!(waiting.len(), 1);
    assert!(
        waiting[0].from_label.starts_with("remote_"),
        "{}",
        waiting[0].from_label
    );

    // The same (machine, id) is never taken again, even with another body.
    assert_eq!(
        ingest(&mut pair, &mail(&from, "m1", &to, "other"), 2).unwrap(),
        Ingested::Duplicate
    );
    assert_eq!(pair.state.messages().count(), 1);
}

#[test]
fn a_refused_remote_message_is_counted_and_never_judged_twice() {
    let mut pair = Pair::new(t(0));
    let from = key("session-1");
    let to = key("b");
    let big = "x".repeat(WIRE_CAP as usize + 1);
    let over = ingest(&mut pair, &mail(&from, "big", &to, &big), 1);
    assert!(
        matches!(over, Err(Refusal::TooLarge { max_bytes: 2048 })),
        "{over:?}"
    );
    let nobody = key("not-a-head");
    let unknown = ingest(&mut pair, &mail(&from, "lost", &nobody, "hi"), 2);
    assert!(
        matches!(unknown, Err(Refusal::UnknownName { .. })),
        "{unknown:?}"
    );
    assert_eq!(pair.state.counters().total(CounterReason::TooLarge), 1);
    assert_eq!(pair.state.counters().total(CounterReason::UnknownName), 1);
    assert_eq!(pair.state.messages().count(), 0);

    assert_eq!(
        ingest(&mut pair, &mail(&from, "big", &to, "small now"), 3).unwrap(),
        Ingested::Duplicate
    );
}

#[test]
fn each_verified_remote_sender_has_its_own_lifetime_cap_apart_from_local_senders_and_from_other_remote_ones(
) {
    let mut pair = Pair::new(t(0));
    let noisy = key("noisy");
    let calm = key("calm");
    let to = key("b");
    let cap = pair.limits.session.lifetime_cap;
    let big = "x".repeat(WIRE_CAP as usize + 1);
    for i in 0..cap {
        let id = format!("n{i}");
        let _ = ingest(&mut pair, &mail(&noisy, &id, &to, &big), 10);
    }
    let after = pair.limits.human.fallback_window_sec + 20;
    let capped = ingest(&mut pair, &mail(&noisy, "n-last", &to, "ok"), after);
    assert!(
        matches!(capped, Err(Refusal::LifetimeCap { .. })),
        "{capped:?}"
    );

    assert!(matches!(
        ingest(&mut pair, &mail(&calm, "c1", &to, "ok"), after),
        Ok(Ingested::Recorded(_))
    ));
    assert!(
        pair.try_send(common::plain("a", B_NAME, "local"), t(after))
            .is_ok(),
        "a local sender is not braked by a remote one"
    );
}

#[test]
fn the_ingest_cursor_only_moves_forward_and_the_first_move_takes_the_baseline() {
    let mut pair = Pair::new(t(0));
    assert!(!pair.state.remote_baselined());
    let mut cursor = std::collections::BTreeMap::new();
    cursor.insert("origin-a".to_string(), 5u64);
    assert!(pair.state.advance_remote_cursor(&cursor));
    assert!(pair.state.remote_baselined());
    cursor.insert("origin-a".to_string(), 3);
    assert!(
        !pair.state.advance_remote_cursor(&cursor),
        "a lower position changes nothing"
    );
    assert_eq!(pair.state.remote_cursor().get("origin-a"), Some(&5));
}

#[test]
fn a_remote_message_is_unsettled_once_offered_or_refused_and_settled_marks_only_the_ones_given() {
    let mut pair = Pair::new(t(0));
    let from = key("session-1");
    let to = key("b");
    let Ingested::Recorded(id) = ingest(&mut pair, &mail(&from, "m1", &to, "hi"), 1).unwrap()
    else {
        panic!("recorded")
    };
    assert!(
        pair.state.unsettled_remote().is_empty(),
        "a message nobody offered yet has no settlement"
    );

    pair.deliver("b", t(2));
    let waiting = pair.state.unsettled_remote();
    assert_eq!(waiting.len(), 1);
    assert_eq!(
        (waiting[0].id.clone(), waiting[0].settlement.clone()),
        (id.clone(), Settlement::Offered)
    );
    assert_eq!(waiting[0].origin.id, "m1");

    assert!(pair.state.mark_remote_settled(std::slice::from_ref(&id)));
    assert!(pair.state.unsettled_remote().is_empty());
    assert!(
        !pair.state.mark_remote_settled(&[id]),
        "a second mark changes nothing"
    );
}
