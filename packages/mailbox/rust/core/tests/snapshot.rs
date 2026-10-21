mod common;

use common::{key, plain, register_new, request, spec_limits, t, SeqIds};
use fgos_mailbox_core::{
    Checkpoint, CounterReason, Generation, MailboxState, MessageState, NoticeState,
    SnapshotVersion, SnapshotVersionError, SNAPSHOT_SCHEMA_VERSION,
};

/// Builds a state in which every field of the snapshot holds a value.
fn populated_state() -> MailboxState {
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();
    register_new(
        &mut state,
        request("k1", "claude", Some("2b"), "head-1"),
        t(100),
        &limits,
        &mut ids,
    );
    let mut with_handle = request("k2", "codex", None, "head-2");
    with_handle.handle = Some("thread-2".to_string());
    let codex = register_new(&mut state, with_handle, t(200), &limits, &mut ids);

    // Two messages that the record TTL refuses, one from each head, so the
    // notices lane, the notice marks and both counter tiers hold values.
    state
        .send(plain("k1", &codex, "refused"), t(250), &limits, &mut ids)
        .unwrap();
    state
        .send(
            plain("k2", "forgent-claude-2b", "refused too"),
            t(250),
            &limits,
            &mut ids,
        )
        .unwrap();
    let e = t(250).plus_secs(limits.record.ttl_sec).plus_secs(1);
    let (k1, k2) = (key("k1"), key("k2"));

    // Then one message per remaining state: offered, in flight, recorded.
    // k2 claims at Stop, which never takes notices, so its notice stays
    // recorded; k1's notice is claimed and left in flight.
    let mut wake = plain("k1", &codex, "offered");
    wake.wake = true;
    state.send(wake, e, &limits, &mut ids).unwrap();
    let claim = state.claim(
        &k2,
        Generation::FIRST,
        Checkpoint::Stop,
        e.plus_secs(10),
        &limits,
        &mut ids,
    );
    state.finish(
        &k2,
        Generation::FIRST,
        &claim.token.unwrap(),
        e.plus_secs(11),
    );
    // A Stop claim takes only effective wakes, so this one wakes too.
    let mut in_flight = plain("k1", &codex, "in flight");
    in_flight.wake = true;
    state
        .send(in_flight, e.plus_secs(20), &limits, &mut ids)
        .unwrap();
    state.claim(
        &k2,
        Generation::FIRST,
        Checkpoint::Stop,
        e.plus_secs(20),
        &limits,
        &mut ids,
    );
    state
        .send(
            plain("unregistered-cli", &codex, "recorded"),
            e.plus_secs(30),
            &limits,
            &mut ids,
        )
        .unwrap();
    state.claim(
        &k1,
        Generation::FIRST,
        Checkpoint::Step,
        e.plus_secs(40),
        &limits,
        &mut ids,
    );

    // k2 answers the offered message with a hint: the parent becomes
    // answered and the hint is kept. Every send above filled the budget
    // window and the lifetime counts.
    let offered = state.messages().nth(2).unwrap().id.clone();
    let mut reply = plain("k2", "forgent-claude-2b", "thanks");
    reply.reply_to = Some(offered.clone());
    let reply = state
        .send(reply, e.plus_secs(50), &limits, &mut ids)
        .unwrap();
    assert_eq!(reply.reply_to, Some(offered.clone()));
    assert!(state.message(&offered).unwrap().answered);
    assert_eq!(
        state.message(&reply.id).unwrap().reply_to_hint,
        Some(offered)
    );

    // Exchanges and wake lifetime counts are filled by the sends above.
    let snapshot = serde_json::to_value(&state).unwrap();
    assert!(!snapshot["exchanges"].as_object().unwrap().is_empty());
    assert!(!snapshot["wake_lifetime"].as_object().unwrap().is_empty());

    let notice_states: Vec<&NoticeState> = state.notices().map(|n| &n.state).collect();
    assert!(matches!(
        notice_states[..],
        [NoticeState::InFlight { .. }, NoticeState::Recorded]
            | [NoticeState::Recorded, NoticeState::InFlight { .. }]
    ));
    assert!(state.counters().party_count() > 0);
    assert_eq!(state.counters().total(CounterReason::RecordTtl), 2);

    let states: Vec<&MessageState> = state.messages().map(|h| &h.state).collect();
    assert!(matches!(
        states[..],
        [
            MessageState::Refused { .. },
            MessageState::Refused { .. },
            MessageState::Offered { .. },
            MessageState::InFlight { .. },
            MessageState::Recorded,
            MessageState::Recorded
        ]
    ));
    state
}

#[test]
fn a_state_with_every_field_populated_survives_a_json_round_trip_from_an_owned_string_unchanged() {
    let state = populated_state();

    let text: String = serde_json::to_string(&state).unwrap();
    let restored: MailboxState = serde_json::from_str(&text).unwrap();
    drop(text);

    assert_eq!(restored, state);
}

#[test]
fn a_snapshot_with_an_unknown_field_is_rejected_instead_of_silently_dropping_it() {
    let mut snapshot = serde_json::to_value(populated_state()).unwrap();
    snapshot["a_field_from_a_newer_core"] = serde_json::json!({});
    assert!(serde_json::from_value::<MailboxState>(snapshot).is_err());

    let mut nested = serde_json::to_value(populated_state()).unwrap();
    nested["messages"][0]["a_newer_header_field"] = serde_json::json!(1);
    assert!(serde_json::from_value::<MailboxState>(nested).is_err());
}

#[test]
fn the_snapshot_version_check_refuses_a_newer_version_refuses_an_older_one_as_unsupported_and_accepts_the_current_one(
) {
    let current = serde_json::to_string(&populated_state()).unwrap();
    let version: SnapshotVersion = serde_json::from_str(&current).unwrap();
    assert_eq!(version.schema_version, SNAPSHOT_SCHEMA_VERSION);
    assert_eq!(version.check(), Ok(()));

    let mut newer = serde_json::to_value(populated_state()).unwrap();
    newer["schema_version"] = serde_json::json!(SNAPSHOT_SCHEMA_VERSION + 1);
    newer["a_field_from_a_newer_core"] = serde_json::json!(1);
    let version: SnapshotVersion = serde_json::from_value(newer).unwrap();
    assert_eq!(
        version.check(),
        Err(SnapshotVersionError::Newer {
            found: SNAPSHOT_SCHEMA_VERSION + 1,
            supported: SNAPSHOT_SCHEMA_VERSION
        })
    );

    let older = SnapshotVersion {
        schema_version: SNAPSHOT_SCHEMA_VERSION - 1,
    };
    assert_eq!(
        older.check(),
        Err(SnapshotVersionError::UnsupportedOlder {
            found: SNAPSHOT_SCHEMA_VERSION - 1,
            supported: SNAPSHOT_SCHEMA_VERSION
        })
    );
}
