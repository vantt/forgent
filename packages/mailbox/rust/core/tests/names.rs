mod common;

use common::{register_new, request, spec_limits, t, SeqIds};
use fgos_mailbox_core::{MailboxState, ResolveRefusal};

fn names(list: &[&str]) -> Vec<String> {
    list.iter().map(|n| n.to_string()).collect()
}

fn candidate_names(refusal: &ResolveRefusal) -> Vec<String> {
    match refusal {
        ResolveRefusal::Ambiguous { candidates } | ResolveRefusal::Unknown { candidates } => {
            candidates.iter().map(|n| n.as_str().to_string()).collect()
        }
        ResolveRefusal::Group => Vec::new(),
    }
}

#[test]
fn exact_short_name_wins_over_a_longer_name_it_prefixes() {
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();
    register_new(
        &mut state,
        request("k1", "codex", Some("9c"), "h1"),
        t(1),
        &limits,
        &mut ids,
    );
    // A second head that wants the same two characters gets three.
    let longer = register_new(
        &mut state,
        request("k2", "codex", Some("9c"), "h2"),
        t(1),
        &limits,
        &mut ids,
    );
    assert_eq!(longer.len(), "forgent-codex-9c".len() + 1);

    let found = state.resolve("forgent-codex-9c").unwrap();
    assert_eq!(found.key.as_str(), "k1");
}

#[test]
fn a_unique_prefix_resolves() {
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();
    register_new(
        &mut state,
        request("k1", "codex", None, "h1"),
        t(1),
        &limits,
        &mut ids,
    );
    register_new(
        &mut state,
        request("k2", "claude", Some("2b"), "h2"),
        t(1),
        &limits,
        &mut ids,
    );

    assert_eq!(state.resolve("forgent-codex").unwrap().key.as_str(), "k1");
}

#[test]
fn an_ambiguous_prefix_is_refused_and_lists_both_candidates() {
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();
    let a = register_new(
        &mut state,
        request("k1", "codex", None, "h1"),
        t(1),
        &limits,
        &mut ids,
    );
    let b = register_new(
        &mut state,
        request("k2", "codex", None, "h2"),
        t(1),
        &limits,
        &mut ids,
    );
    register_new(
        &mut state,
        request("k3", "claude", Some("2b"), "h3"),
        t(1),
        &limits,
        &mut ids,
    );

    let refusal = state.resolve("forgent-codex").unwrap_err();
    assert!(
        matches!(refusal, ResolveRefusal::Ambiguous { .. }),
        "{refusal:?}"
    );
    let mut expected = vec![a, b];
    expected.sort();
    assert_eq!(candidate_names(&refusal), expected);
}

#[test]
fn a_unique_key_prefix_resolves_when_no_short_name_matches() {
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();
    register_new(
        &mut state,
        request("0f3a-uuid", "codex", None, "h1"),
        t(1),
        &limits,
        &mut ids,
    );
    register_new(
        &mut state,
        request("77aa-uuid", "codex", None, "h2"),
        t(1),
        &limits,
        &mut ids,
    );

    assert_eq!(state.resolve("0f3").unwrap().key.as_str(), "0f3a-uuid");
}

#[test]
fn an_unknown_name_is_refused_and_lists_the_current_names() {
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();
    register_new(
        &mut state,
        request("k1", "claude", Some("2b"), "h1"),
        t(1),
        &limits,
        &mut ids,
    );
    register_new(
        &mut state,
        request("k2", "agy", Some("4e"), "h2"),
        t(1),
        &limits,
        &mut ids,
    );

    let refusal = state.resolve("mdview-claude-1a").unwrap_err();
    assert!(
        matches!(refusal, ResolveRefusal::Unknown { .. }),
        "{refusal:?}"
    );
    assert_eq!(
        candidate_names(&refusal),
        names(&["forgent-agy-4e", "forgent-claude-2b"])
    );
}

#[test]
fn a_comma_space_or_star_in_the_query_is_refused_as_a_group() {
    let limits = spec_limits();
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();
    register_new(
        &mut state,
        request("k1", "claude", Some("2b"), "h1"),
        t(1),
        &limits,
        &mut ids,
    );

    for query in [
        "forgent-claude-2b,forgent-agy-4e",
        "forgent claude",
        "forgent-*",
        "a\tb",
    ] {
        assert_eq!(
            state.resolve(query).unwrap_err(),
            ResolveRefusal::Group,
            "{query}"
        );
    }
}
