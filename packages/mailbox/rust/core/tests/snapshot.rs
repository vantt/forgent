mod common;

use common::{key, plain, register_new, request, spec_limits, t, SeqIds};
use fgos_mailbox_core::{
    Checkpoint, CounterReason, Generation, MailboxState, MessageState, NoticeState,
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
    state
        .send(
            plain("k1", &codex, "in flight"),
            e.plus_secs(20),
            &limits,
            &mut ids,
        )
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
