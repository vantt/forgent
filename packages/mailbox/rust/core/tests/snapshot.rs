mod common;

use common::{key, plain, register_new, request, spec_limits, t, SeqIds};
use fgos_mailbox_core::{Checkpoint, Generation, MailboxState, MessageState};

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

    // One message per state: offered, in flight, recorded.
    let k2 = key("k2");
    let mut wake = plain("k1", &codex, "offered");
    wake.wake = true;
    state.send(wake, t(300), &limits, &mut ids).unwrap();
    let claim = state.claim(
        &k2,
        Generation::FIRST,
        Checkpoint::Step,
        t(310),
        &limits,
        &mut ids,
    );
    state.finish(&k2, Generation::FIRST, &claim.token.unwrap(), t(311));
    state
        .send(plain("k1", &codex, "in flight"), t(320), &limits, &mut ids)
        .unwrap();
    state.claim(
        &k2,
        Generation::FIRST,
        Checkpoint::Step,
        t(320),
        &limits,
        &mut ids,
    );
    state
        .send(
            plain("unregistered-cli", &codex, "recorded"),
            t(330),
            &limits,
            &mut ids,
        )
        .unwrap();

    let states: Vec<&MessageState> = state.messages().map(|h| &h.state).collect();
    assert!(matches!(
        states[..],
        [
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
