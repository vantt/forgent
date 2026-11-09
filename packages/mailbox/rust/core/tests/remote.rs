mod common;

use common::{key, plain, t, Pair, B_NAME};
use fgos_mailbox_core::{
    CounterReason, Ingested, MailboxState, MessageId, MessageState, Refusal, RemoteMail,
    Settlement, WakeDrop,
};
use std::collections::BTreeSet;

const WIRE_CAP: u64 = 2048;
static NO_CLIS: BTreeSet<fgos_mailbox_core::Cli> = BTreeSet::new();

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
        wake: false,
        ack_within_sec: None,
        reply_to: None,
        stop_drains: &NO_CLIS,
        nudge_clis: &NO_CLIS,
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
    let Ingested::Recorded { id, .. } = taken else {
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
        Ok(Ingested::Recorded { .. })
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
    let Ingested::Recorded { id, .. } =
        ingest(&mut pair, &mail(&from, "m1", &to, "hi"), 1).unwrap()
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

fn waking<'a>(
    mail: RemoteMail<'a>,
    stop_drains: &'a BTreeSet<fgos_mailbox_core::Cli>,
    nudge_clis: &'a BTreeSet<fgos_mailbox_core::Cli>,
) -> RemoteMail<'a> {
    RemoteMail {
        wake: true,
        stop_drains,
        nudge_clis,
        ..mail
    }
}

fn recorded_wake(taken: Result<Ingested, Refusal>) -> fgos_mailbox_core::RemoteWake {
    match taken {
        Ok(Ingested::Recorded { wake, .. }) => wake,
        other => panic!("{other:?}"),
    }
}

#[test]
fn a_wake_from_a_remote_sender_takes_effect_only_for_a_recipient_with_a_channel_and_a_second_wake_is_marked_outstanding(
) {
    let mut pair = Pair::new(t(0));
    let from = key("session-1");
    let to = key("b");
    let channel: BTreeSet<_> = ["claude", "codex", "pi", "omp"]
        .map(common::cli)
        .into_iter()
        .collect();

    // No channel for the recipient's CLI: the mail lands, the wake is dropped, nothing is spent.
    let none = BTreeSet::new();
    let dropped = recorded_wake(ingest(
        &mut pair,
        &waking(mail(&from, "m0", &to, "hi"), &none, &none),
        1,
    ));
    assert!(!dropped.effective);
    assert_eq!(dropped.dropped, Some(WakeDrop::NoChannel));

    let first = recorded_wake(ingest(
        &mut pair,
        &waking(mail(&from, "m1", &to, "hi"), &none, &channel),
        2,
    ));
    assert!(first.effective && first.to_nudge);
    assert_eq!(first.to_key, to);
    assert!(!first.outstanding);

    let second = recorded_wake(ingest(
        &mut pair,
        &waking(mail(&from, "m2", &to, "again"), &none, &channel),
        3,
    ));
    assert!(second.outstanding, "the first wake is still unread");

    // A message that did not ask for a wake never takes one.
    let plain = recorded_wake(ingest(
        &mut pair,
        &RemoteMail {
            nudge_clis: &channel,
            ..mail(&from, "m3", &to, "x")
        },
        4,
    ));
    assert!(!plain.effective && plain.dropped.is_none());
}

#[test]
fn each_remote_sender_session_stops_waking_at_its_own_cap_while_its_mail_still_lands_and_other_senders_keep_theirs(
) {
    let mut pair = Pair::new(t(0));
    let noisy = key("noisy");
    let calm = key("calm");
    let to = key("b");
    let none = BTreeSet::new();
    let channel: BTreeSet<_> = ["claude", "codex", "pi", "omp"]
        .map(common::cli)
        .into_iter()
        .collect();
    let cap = pair.limits.wake.remote_lifetime_cap;
    assert!(
        cap < pair.limits.wake.lifetime_cap,
        "a remote sender's wake budget is smaller than a local one's"
    );
    let gap = pair.limits.wake.exchange_gap_sec + 1;

    let mut at = 1;
    for i in 0..cap {
        let id = format!("w{i}");
        let wake = recorded_wake(ingest(
            &mut pair,
            &waking(mail(&noisy, &id, &to, "hi"), &none, &channel),
            at,
        ));
        assert!(wake.effective, "wake {i} of {cap}");
        at += gap;
    }
    let spent = recorded_wake(ingest(
        &mut pair,
        &waking(mail(&noisy, "w-last", &to, "hi"), &none, &channel),
        at,
    ));
    assert!(!spent.effective);
    assert_eq!(spent.dropped, Some(WakeDrop::LifetimeCap));
    let header_count = pair.state.messages().filter(|m| m.from == noisy).count();
    assert_eq!(
        header_count as u32,
        cap + 1,
        "the capped sender's mail still landed"
    );

    let other = recorded_wake(ingest(
        &mut pair,
        &waking(mail(&calm, "c1", &to, "hi"), &none, &channel),
        at,
    ));
    assert!(
        other.effective,
        "another remote sender has its own wake budget"
    );
}

#[test]
fn a_verified_cross_machine_reply_naming_a_watched_id_marks_it_acknowledged_once_only_from_the_machine_it_went_to(
) {
    let mut pair = Pair::new(t(0));
    let from = key("session-1");
    let b = key("b");

    // The flag a remote sender signed is carried onto the header it becomes.
    let flagged = RemoteMail {
        ack_within_sec: Some(600),
        ..mail(&from, "m1", &b, "please read")
    };
    let Ingested::Recorded { id, .. } = ingest(&mut pair, &flagged, 1).unwrap() else {
        panic!("recorded")
    };
    assert_eq!(pair.state.message(&id).unwrap().ack_within_sec, Some(600));

    // A reply across machines names the original's id on its own machine, and only a message
    // the head was offered, from that machine, counts.
    let generation = pair.state.binding(&b).map(|binding| binding.generation);
    let reply_parent = |pair: &Pair, hint: &MessageId, machine: &str| {
        pair.state
            .remote_reply_parent(&b, generation, hint, machine)
    };
    assert_eq!(
        reply_parent(&pair, &id, "peer-machine"),
        None,
        "not offered yet"
    );
    pair.deliver("b", t(2));
    assert_eq!(reply_parent(&pair, &id, "other-machine"), None);
    assert_eq!(
        reply_parent(&pair, &MessageId::from_text("nope"), "peer-machine"),
        None
    );
    assert!(!pair.state.message(&id).unwrap().answered);
    assert_eq!(
        reply_parent(&pair, &id, "peer-machine").as_deref(),
        Some("m1")
    );
    // The lookup marks nothing, so a send whose append then fails leaves the original unanswered.
    assert!(!pair.state.message(&id).unwrap().answered);
    assert!(pair.state.mark_answered(&id));
    assert!(pair.state.message(&id).unwrap().answered);

    // A flagged send of this record's head to a head on `peer-machine` is watched under that machine.
    let mut req = plain("a", B_NAME, "need an answer");
    req.need_ack = Some(600);
    let watched = pair.try_send(req, t(3)).unwrap().id;
    let mut json = serde_json::to_value(&pair.state).unwrap();
    json["ack_watch"][0]["to_machine"] = serde_json::json!("peer-machine");
    pair.state = serde_json::from_value::<MailboxState>(json).unwrap();
    let acked = |pair: &Pair| {
        pair.state
            .ack_watches()
            .find(|w| w.id == watched)
            .unwrap()
            .acked
    };

    let wrong_machine = RemoteMail {
        machine: "other-machine",
        reply_to: Some(watched.as_str()),
        ..mail(&from, "r0", &b, "read")
    };
    assert!(ingest(&mut pair, &wrong_machine, 4).is_ok());
    assert!(!acked(&pair), "another machine cannot acknowledge it");

    let named = watched.to_string();
    let reply = |name: &'static str| RemoteMail {
        reply_to: Some(named.as_str()),
        ..mail(&from, name, &b, "read, nothing to add")
    };
    assert!(ingest(&mut pair, &reply("r1"), 5).is_ok());
    assert!(acked(&pair));
    let changed = pair
        .state
        .ack_watches()
        .find(|w| w.id == watched)
        .unwrap()
        .changed_at;
    assert!(ingest(&mut pair, &reply("r2"), 6).is_ok());
    assert_eq!(
        pair.state
            .ack_watches()
            .find(|w| w.id == watched)
            .unwrap()
            .changed_at,
        changed,
        "a second reply changes nothing"
    );
    assert_eq!(
        ingest(&mut pair, &reply("r1"), 7).unwrap(),
        Ingested::Duplicate
    );
}
