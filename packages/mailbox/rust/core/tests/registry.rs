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
        matches!(&outcome, Registered::Replaced { generation, name: n } if *generation == Generation::FIRST.next().unwrap() && n.as_str() == name),
        "{outcome:?}"
    );
    let binding = state.binding(&key("k")).unwrap();
    assert_eq!(binding.generation, Generation::FIRST.next().unwrap());
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

    for (i, invalid) in ["2B", "x", "abc", "é1", "2-"].into_iter().enumerate() {
        let key_text = format!("k-invalid-{i}");
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

#[test]
fn a_takeover_at_the_last_generation_is_refused_and_leaves_the_binding_untouched() {
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
    // Only a corrupt or hand-edited snapshot reaches the last generation.
    let mut snapshot = serde_json::to_value(&state).unwrap();
    snapshot["bindings"]["k"]["generation"] = serde_json::json!(u32::MAX);
    let mut state: MailboxState = serde_json::from_value(snapshot).unwrap();
    let before = state.binding(&key("k")).unwrap().clone();

    let refused = state.register(
        request("k", "codex", None, "head-b"),
        other_head(Liveness::Dead),
        t(200),
        &limits,
        &mut ids,
    );

    assert_eq!(refused, Err(RegisterRefusal::GenerationExhausted));
    assert_eq!(state.binding(&key("k")).unwrap(), &before);
}

#[test]
fn a_writer_key_longer_than_the_header_bound_is_refused_at_registration() {
    let limits = spec_limits();
    let bound = limits.frame.max_header_chars as usize;
    let mut ids = SeqIds::default();
    let mut state = MailboxState::new();

    let at_bound = request(&"k".repeat(bound), "codex", None, "h1");
    assert!(state
        .register(at_bound, None, t(1), &limits, &mut ids)
        .is_ok());
    let before = state.clone();
    let over = request(&"k".repeat(bound + 1), "codex", None, "h2");

    assert_eq!(
        state.register(over, None, t(2), &limits, &mut ids),
        Err(RegisterRefusal::KeyTooLong)
    );
    assert_eq!(state, before);
}

#[test]
fn a_writer_key_outside_the_session_identity_alphabet_is_refused_by_its_constructor() {
    for bad in ["x|y", "a@1", "with space", "tab\tkey", "~unregistered", "é"] {
        assert!(
            fgos_mailbox_core::WriterKey::new(bad).is_err(),
            "{bad} was accepted"
        );
    }
    for good in ["0f3a-uuid", "att-1.2_3", "1234", "unregistered"] {
        assert!(
            fgos_mailbox_core::WriterKey::new(good).is_ok(),
            "{good} was refused"
        );
    }
    let snapshot = r#""x|y""#;
    assert!(serde_json::from_str::<fgos_mailbox_core::WriterKey>(snapshot).is_err());
}

/// The keyed records of the snapshot, by map name, as JSON key lists.
fn keyed_records(state: &MailboxState) -> Vec<(String, usize)> {
    let snapshot = serde_json::to_value(state).unwrap();
    [
        "lifetime",
        "wake_lifetime",
        "exchanges",
        "budget",
        "notice_last",
    ]
    .into_iter()
    .map(|map| (map.to_string(), snapshot[map].as_object().unwrap().len()))
    .collect()
}

#[test]
fn takeovers_drop_the_dead_generations_records_so_fifty_restarts_leave_no_growth() {
    let mut pair = common::Pair::new(t(0));
    let mut now = t(1);
    pair.send_wake("a", common::B_NAME, now);
    pair.deliver("b", now);
    let after_one = keyed_records(&pair.state);

    for _ in 0..50 {
        pair.take_over("a", "claude", now);
        now = now.plus_secs(pair.limits.wake.exchange_gap_sec + 1);
        assert!(pair.send_wake("a", common::B_NAME, now).effective_wake);
        pair.deliver("b", now);
    }

    assert_eq!(keyed_records(&pair.state), after_one);
}

#[test]
fn forgetting_a_key_removes_every_record_of_it_and_a_later_registration_starts_clean_at_generation_1(
) {
    let mut pair = common::Pair::new(t(0));
    let send = |pair: &mut common::Pair, body: &str, now| {
        let req = common::plain("a", common::B_NAME, body);
        pair.state
            .send(req, now, &pair.limits, &mut pair.ids)
            .map(|_| ())
            .map_err(|r| r.code())
    };
    // a: one woken message read by b, one left unread, then its lifetime
    // cap; the unread one expires into a notice and a notice mark for a.
    pair.send_wake("a", common::B_NAME, t(1));
    pair.deliver("b", t(1));
    send(&mut pair, "unread", t(2)).unwrap();
    pair.limits.session.lifetime_cap = 2;
    assert_eq!(send(&mut pair, "capped", t(3)), Err("lifetime-cap"));
    pair.sweep(common::Pair::after(t(2), pair.limits.record.ttl_sec));
    let now = common::Pair::after(t(2), pair.limits.record.ttl_sec);
    assert!(
        keyed_records(&pair.state).iter().all(|(_, n)| *n > 0),
        "{:?}",
        keyed_records(&pair.state)
    );
    assert_eq!(pair.state.notices().count(), 1);

    assert!(pair.state.forget_key(&key("a")));

    assert!(pair.state.binding(&key("a")).is_none());
    assert!(
        keyed_records(&pair.state).iter().all(|(_, n)| *n == 0),
        "{:?}",
        keyed_records(&pair.state)
    );
    assert_eq!(pair.state.notices().count(), 0);
    assert!(pair
        .state
        .messages()
        .all(|h| h.from != key("a") && h.to != key("a")));
    assert!(pair.state.counters().party_count() == 0);
    assert!(!pair.state.forget_key(&key("a")));
    let outcome = pair
        .state
        .register(
            request("a", "claude", Some("2b"), "head-a2"),
            None,
            now,
            &pair.limits,
            &mut pair.ids,
        )
        .unwrap();
    assert!(
        matches!(outcome, Registered::Created { generation, .. } if generation == Generation::FIRST)
    );
    assert_eq!(send(&mut pair, "from a fresh process", now), Ok(()));
}
