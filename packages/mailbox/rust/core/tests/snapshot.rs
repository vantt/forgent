mod common;

use common::{register_new, request, spec_limits, t, SeqIds};
use fgos_mailbox_core::MailboxState;

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
    register_new(&mut state, with_handle, t(200), &limits, &mut ids);
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
