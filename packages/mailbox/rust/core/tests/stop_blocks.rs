mod common;

use common::{key, other_head, register_new, request, spec_limits, t, SeqIds};
use fgos_mailbox_core::{Generation, Liveness, MailboxState, Registered};

fn registered() -> (MailboxState, SeqIds) {
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();
    register_new(
        &mut state,
        request("k", "claude", Some("2b"), "head-a"),
        t(100),
        &spec_limits(),
        &mut ids,
    );
    (state, ids)
}

fn blocks(state: &MailboxState) -> u32 {
    state.binding(&key("k")).unwrap().stop_blocks
}

fn take_over(state: &mut MailboxState, ids: &mut SeqIds) -> Generation {
    match state
        .register(
            request("k", "claude", Some("2b"), "head-b"),
            other_head(Liveness::Dead),
            t(200),
            &spec_limits(),
            ids,
        )
        .unwrap()
    {
        Registered::Replaced { generation, .. } => generation,
        other => panic!("expected a takeover, got {other:?}"),
    }
}

#[test]
fn a_blocked_stop_adds_one_and_a_passing_stop_returns_the_count_to_zero() {
    let (mut state, _) = registered();
    assert_eq!(blocks(&state), 0);

    assert!(state.note_stop(&key("k"), Generation::FIRST, true));
    assert_eq!(blocks(&state), 1);
    assert!(state.note_stop(&key("k"), Generation::FIRST, true));
    assert_eq!(blocks(&state), 2);
    assert!(state.note_stop(&key("k"), Generation::FIRST, false));
    assert_eq!(blocks(&state), 0);

    let before = state.clone();
    assert!(!state.note_stop(&key("k"), Generation::FIRST, false));
    assert_eq!(state, before, "a pass at zero changes nothing");
}

#[test]
fn a_stop_noted_by_an_older_generation_changes_nothing() {
    let (mut state, mut ids) = registered();
    take_over(&mut state, &mut ids);
    let before = state.clone();

    assert!(!state.note_stop(&key("k"), Generation::FIRST, true));
    assert!(!state.note_stop(&key("nobody"), Generation::FIRST, true));
    assert_eq!(state, before);
}

#[test]
fn a_takeover_starts_the_new_generation_with_no_blocks() {
    let (mut state, mut ids) = registered();
    state.note_stop(&key("k"), Generation::FIRST, true);
    state.note_stop(&key("k"), Generation::FIRST, true);
    assert_eq!(blocks(&state), 2);

    let generation = take_over(&mut state, &mut ids);

    assert_ne!(generation, Generation::FIRST);
    assert_eq!(blocks(&state), 0);
}
