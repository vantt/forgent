mod common;

use common::{key, other_head, register_new, request, same_head, spec_limits, t, SeqIds};
use fgos_mailbox_core::{Generation, Liveness, MailboxState, RegisterRefusal, Registered};

fn is_lower_hex(text: &str) -> bool {
    text.chars()
        .all(|c| c.is_ascii_digit() || ('a'..='f').contains(&c))
}

#[test]
fn no_binding_creates_generation_1_with_a_project_cli_2hex_name() {
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();

    let outcome = state
        .register(
            request("k-codex", "codex", None, "head-a"),
            None,
            t(100),
            &limits,
            &mut ids,
        )
        .unwrap();

    let Registered::Created { name, generation } = outcome else {
        panic!("expected a new binding, got {outcome:?}");
    };
    assert_eq!(generation, Generation::FIRST);
    let suffix = name.as_str().strip_prefix("forgent-codex-").unwrap();
    assert_eq!(suffix.len(), 2);
    assert!(is_lower_hex(suffix), "suffix {suffix} is not lowercase hex");
    let binding = state.binding(&key("k-codex")).unwrap();
    assert_eq!(binding.generation, Generation::FIRST);
    assert_eq!(binding.head, "head-a");
    assert_eq!(binding.registered_at, t(100));
    assert_eq!(binding.last_seen, t(100));
}

#[test]
fn registering_the_same_head_again_refreshes_last_seen_and_does_not_bump() {
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();
    let name = register_new(
        &mut state,
        request("k", "codex", None, "head-a"),
        t(100),
        &limits,
        &mut ids,
    );

    let outcome = state
        .register(
            request("k", "codex", None, "head-a"),
            same_head(),
            t(200),
            &limits,
            &mut ids,
        )
        .unwrap();

    assert!(
        matches!(outcome, Registered::Refreshed { generation, .. } if generation == Generation::FIRST)
    );
    let binding = state.binding(&key("k")).unwrap();
    assert_eq!(binding.generation, Generation::FIRST);
    assert_eq!(binding.name.as_str(), name);
    assert_eq!(binding.registered_at, t(100));
    assert_eq!(binding.last_seen, t(200));
}

#[test]
fn a_different_head_while_the_stored_head_is_alive_is_a_conflict_and_leaves_the_binding_untouched()
{
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();
    register_new(
        &mut state,
        request("k", "codex", None, "head-a"),
        t(100),
        &limits,
        &mut ids,
    );
    let before = state.binding(&key("k")).unwrap().clone();

    let refused = state.register(
        request("k", "codex", None, "head-b"),
        other_head(Liveness::Alive),
        t(200),
        &limits,
        &mut ids,
    );

    assert_eq!(refused, Err(RegisterRefusal::Conflict));
    assert_eq!(state.binding(&key("k")).unwrap(), &before);
}

#[test]
fn a_different_head_while_the_stored_head_is_unknown_is_deferred_and_leaves_the_binding_untouched()
{
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();
    register_new(
        &mut state,
        request("k", "codex", None, "head-a"),
        t(100),
        &limits,
        &mut ids,
    );
    let before = state.binding(&key("k")).unwrap().clone();

    let refused = state.register(
        request("k", "codex", None, "head-b"),
        other_head(Liveness::Unknown),
        t(200),
        &limits,
        &mut ids,
    );

    assert_eq!(refused, Err(RegisterRefusal::Deferred));
    assert_eq!(state.binding(&key("k")).unwrap(), &before);
}

#[test]
fn a_different_head_after_the_stored_head_is_dead_replaces_it_with_exactly_one_bump_and_keeps_the_name(
) {
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();
    let name = register_new(
        &mut state,
        request("k", "codex", None, "head-a"),
        t(100),
        &limits,
        &mut ids,
    );

    let mut replacement = request("k", "codex", None, "head-b");
    replacement.handle = Some("thread-b".to_string());
    let outcome = state
        .register(
            replacement,
            other_head(Liveness::Dead),
            t(200),
            &limits,
            &mut ids,
        )
        .unwrap();

    assert!(
        matches!(&outcome, Registered::Replaced { generation, name: n } if *generation == Generation::FIRST.next() && n.as_str() == name),
        "{outcome:?}"
    );
    let binding = state.binding(&key("k")).unwrap();
    assert_eq!(binding.generation, Generation::FIRST.next());
    assert_eq!(binding.name.as_str(), name);
    assert_eq!(binding.head, "head-b");
    assert_eq!(binding.handle.as_deref(), Some("thread-b"));
    assert_eq!(binding.registered_at, t(200));
    assert_eq!(binding.last_seen, t(200));
}

#[test]
fn a_judgement_that_does_not_match_the_stored_state_is_refused_and_changes_nothing() {
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();

    let before = state.clone();
    let refused = state.register(
        request("k", "codex", None, "head-a"),
        other_head(Liveness::Dead),
        t(100),
        &limits,
        &mut ids,
    );
    assert_eq!(refused, Err(RegisterRefusal::JudgementMismatch));
    assert_eq!(state, before);

    register_new(
        &mut state,
        request("k", "codex", None, "head-a"),
        t(100),
        &limits,
        &mut ids,
    );
    let before = state.clone();
    let refused = state.register(
        request("k", "codex", None, "head-b"),
        None,
        t(200),
        &limits,
        &mut ids,
    );
    assert_eq!(refused, Err(RegisterRefusal::JudgementMismatch));
    assert_eq!(state, before);
}

#[test]
fn a_claude_head_keeps_its_own_two_characters_a_colliding_head_gets_three_hex_characters_and_an_invalid_own_suffix_is_replaced(
) {
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();

    let first = register_new(
        &mut state,
        request("k1", "claude", Some("2b"), "h1"),
        t(100),
        &limits,
        &mut ids,
    );
    assert_eq!(first, "forgent-claude-2b");

    let second = register_new(
        &mut state,
        request("k2", "claude", Some("2b"), "h2"),
        t(100),
        &limits,
        &mut ids,
    );
    let suffix = second.strip_prefix("forgent-claude-").unwrap();
    assert_eq!(suffix.len(), 3, "{second}");
    assert!(is_lower_hex(suffix), "{second}");

    for invalid in ["2B", "x", "abc", "é1", "2-"] {
        let key_text = format!("k-{invalid}");
        let name = register_new(
            &mut state,
            request(&key_text, "claude", Some(invalid), "h"),
            t(100),
            &limits,
            &mut ids,
        );
        let suffix = name.strip_prefix("forgent-claude-").unwrap();
        assert_eq!(suffix.len(), 2, "{name}");
        assert!(is_lower_hex(suffix), "{name}");
    }

    let names: Vec<String> = state
        .bindings()
        .map(|b| b.name.as_str().to_string())
        .collect();
    let mut unique = names.clone();
    unique.sort();
    unique.dedup();
    assert_eq!(unique.len(), names.len(), "names must be unique: {names:?}");
}

#[test]
fn a_folder_name_with_spaces_or_non_ascii_is_reduced_to_the_name_alphabet_and_a_long_one_is_cut_to_fit_the_header_bound(
) {
    let limits = spec_limits();
    let bound = limits.frame.max_header_chars as usize;
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();

    let mut spaced = request("k1", "codex", None, "h1");
    spaced.project = "my proj/ẞeta_v1.2".to_string();
    let name = register_new(&mut state, spaced, t(100), &limits, &mut ids);
    assert!(name.starts_with("my-proj--eta_v1.2-codex-"), "{name}");

    let mut long = request("k2", "codex", None, "h2");
    long.project = "p".repeat(bound * 2);
    let name = register_new(&mut state, long, t(100), &limits, &mut ids);
    assert_eq!(name.chars().count(), bound, "{name}");
    assert!(name.ends_with(&format!("-codex-{}", &name[name.len() - 2..])));
    assert!(name.starts_with("ppp"));
}

#[test]
fn a_clock_that_steps_back_is_treated_as_the_last_time_seen() {
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();
    register_new(
        &mut state,
        request("k", "codex", None, "head-a"),
        t(1000),
        &limits,
        &mut ids,
    );

    state
        .register(
            request("k", "codex", None, "head-a"),
            same_head(),
            t(10),
            &limits,
            &mut ids,
        )
        .unwrap();

    assert_eq!(state.binding(&key("k")).unwrap().last_seen, t(1000));
    assert_eq!(state.last_now(), t(1000));
}
