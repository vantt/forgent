mod common;

use common::{spec_limits, t};
use fgos_mailbox_core::{
    delivery_report, inbox_text, record_error_text, record_unavailable_text, refusal_text,
    Generation, Kind, MessageId, MessageView, Refusal, SendOutcome, ShortName, VersionClause,
    WakeDrop,
};
use serde_json::json;

/// A name as the snapshot stores it: any text a foreign writer put there.
fn name(text: &str) -> ShortName {
    serde_json::from_value(json!(text)).unwrap()
}

fn outcome(effective_wake: bool, wake_dropped: Option<WakeDrop>) -> SendOutcome {
    SendOutcome {
        id: MessageId::from_text("a1b2"),
        to: name("forgent-claude-7f"),
        to_generation: Generation::FIRST,
        to_cli: fgos_mailbox_core::Cli::new("claude").unwrap(),
        to_head: "{}".to_string(),
        depth: 0,
        reply_to: None,
        effective_wake,
        wake_dropped,
        to_stop_drains: true,
    }
}

#[test]
fn a_send_without_an_effective_wake_reports_recorded_and_its_next_tool_call() {
    assert_eq!(
        delivery_report(
            &outcome(false, None),
            &VersionClause::Tested,
            &spec_limits()
        ),
        "recorded a1b2 for forgent-claude-7f\nqueued: it sees it at its next tool call."
    );
}

#[test]
fn a_send_with_an_effective_wake_reports_its_next_tool_call_or_the_end_of_its_turn() {
    assert_eq!(
        delivery_report(&outcome(true, None), &VersionClause::Tested, &spec_limits()),
        "recorded a1b2 for forgent-claude-7f\nqueued: it sees it at its next tool call or when its turn ends."
    );
}

#[test]
fn the_report_for_a_recipient_with_no_stop_drain_never_says_when_its_turn_ends_and_names_the_unused_wake(
) {
    let limits = spec_limits();
    let mut asked = outcome(false, Some(WakeDrop::NoChannel));
    asked.to_stop_drains = false;
    assert_eq!(
        delivery_report(&asked, &VersionClause::Tested, &limits),
        "recorded a1b2 for forgent-claude-7f\n\
         queued: it sees it at its next tool call. This CLI takes no mail when its turn ends, so an idle session sees it only when it next runs a tool.\n\
         Its CLI has no channel that can wake it; the wake was not used."
    );
    let mut plain = outcome(false, None);
    plain.to_stop_drains = false;
    let text = delivery_report(&plain, &VersionClause::Tested, &limits);
    assert_eq!(text.lines().count(), 2, "{text}");
    assert!(!text.contains("when its turn ends."), "{text}");
    assert!(!text.contains("wake"), "{text}");
}

#[test]
fn a_send_whose_wake_the_exchange_quota_dropped_says_so_and_still_reports_recorded() {
    let text = delivery_report(
        &outcome(false, Some(WakeDrop::ExchangeQuota)),
        &VersionClause::Tested,
        &spec_limits(),
    );
    let lines: Vec<&str> = text.lines().collect();
    assert_eq!(lines[0], "recorded a1b2 for forgent-claude-7f");
    assert_eq!(lines[1], "queued: it sees it at its next tool call.");
    assert_eq!(
        lines[2],
        "The wake quota of this exchange is used up; it will see this at its next checkpoint."
    );
    assert_eq!(lines.len(), 3);
}

#[test]
fn a_send_whose_wake_the_lifetime_cap_dropped_says_so() {
    let text = delivery_report(
        &outcome(false, Some(WakeDrop::LifetimeCap)),
        &VersionClause::Tested,
        &spec_limits(),
    );
    assert_eq!(
        text.lines().last(),
        Some("The wake lifetime cap toward this recipient is reached; it will see this at its next checkpoint.")
    );
}

#[test]
fn each_refusal_code_renders_from_its_section_and_policy_refusals_say_do_not_retry() {
    const NO_RETRY: &str = "Do not retry; ask your user.";
    let cases: Vec<(Refusal, &str, bool)> = vec![
        (
            Refusal::SessionBudget {
                budget: 20,
                window_sec: 600,
            },
            "Refused: session-budget (budget=20 window_sec=600). Do not retry; ask your user.",
            true,
        ),
        (
            Refusal::LifetimeCap { cap: 200 },
            "Refused: lifetime-cap (cap=200). Do not retry; ask your user.",
            true,
        ),
        (
            Refusal::TooDeep { max_depth: 4 },
            "Refused: too-deep (max_depth=4). Do not retry; ask your user.",
            true,
        ),
        (
            Refusal::QueueFull { cap: 8 },
            "Refused: queue-full (cap=8). Do not retry; ask your user.",
            true,
        ),
        (
            Refusal::SenderShareFull { per_sender: 4 },
            "Refused: sender-share-full (per_sender=4). Do not retry; ask your user.",
            true,
        ),
        (
            Refusal::Loop {
                max_per_window: 6,
                window_sec: 300,
            },
            "Refused: loop (max_per_window=6 window_sec=300). This looks like a loop, check with your user. Do not retry.",
            false,
        ),
        (
            Refusal::TooLarge { max_bytes: 65536 },
            "Refused: too-large (max_bytes=65536). Send a path or link instead.",
            false,
        ),
        (
            Refusal::UnknownName { candidates: vec![] },
            "Refused: unknown-name. Candidates: none.",
            false,
        ),
        (
            Refusal::AmbiguousName {
                candidates: vec![name("forgent-claude-7f"), name("forgent-claude-7a")],
            },
            "Refused: ambiguous-name. Candidates: forgent-claude-7f, forgent-claude-7a.",
            false,
        ),
        (Refusal::Group, "Refused: group.", false),
        (Refusal::SelfSend, "Refused: self.", false),
        (
            Refusal::ReplyToNotOffered,
            "Refused: reply-to-not-offered.",
            false,
        ),
        (
            Refusal::SenderKeyTooLong { max_chars: 200 },
            "Refused: sender-key-too-long.",
            false,
        ),
    ];
    for (refusal, expected, policy) in cases {
        let text = refusal_text(&refusal, &spec_limits());
        assert_eq!(text, expected, "{}", refusal.code());
        assert_eq!(text.contains(NO_RETRY), policy, "{}", refusal.code());
        let loop_like = matches!(refusal, Refusal::Loop { .. });
        assert_eq!(
            text.contains("Do not retry"),
            policy || loop_like,
            "{}",
            refusal.code()
        );
    }
}

#[test]
fn a_name_refusal_lists_the_candidates_through_the_header_escape() {
    let refusal = Refusal::UnknownName {
        candidates: vec![name("evil<tag \"x\"\nnext")],
    };
    assert_eq!(
        refusal_text(&refusal, &spec_limits()),
        "Refused: unknown-name. Candidates: evil_tag__x__next."
    );
}

#[test]
fn an_inbox_listing_has_one_line_per_pending_item_with_its_state_and_says_no_pending_mail_when_empty(
) {
    let limits = spec_limits();
    let items = vec![
        MessageView {
            id: MessageId::from_text("a1"),
            kind: Kind::Message,
            from_label: "forgent-codex-2c".to_string(),
            recorded_at: t(10),
            offers: 0,
            in_flight: false,
        },
        MessageView {
            id: MessageId::from_text("b2"),
            kind: Kind::Notice,
            from_label: "mailbox".to_string(),
            recorded_at: t(11),
            offers: 1,
            in_flight: true,
        },
    ];
    assert_eq!(
        inbox_text(Some(&items), &limits),
        "a1 message from=forgent-codex-2c state=recorded offers=0\nb2 notice from=mailbox state=in-flight offers=1"
    );
    assert_eq!(inbox_text(Some(&[]), &limits), "No pending mail.");
    assert_eq!(
        inbox_text(None, &limits),
        "This session has no mailbox address yet; it gets one at its first hook."
    );
}

#[test]
fn a_record_error_reads_as_contract_text_that_names_the_code_and_says_not_to_loop() {
    assert_eq!(
        record_error_text("lock-busy"),
        "Not done: the mailbox record failed (lock-busy) and nothing was changed. Try once more later; do not loop."
    );
}

#[test]
fn a_place_with_no_record_reads_as_a_permanent_condition_never_as_a_retry() {
    let text = record_unavailable_text("unsupported-checkout");
    assert_eq!(
        text,
        "Not done: there is no mailbox record here (unsupported-checkout), and trying again will not change that. Run it from inside the project's repository, or tell your user."
    );
    assert!(!text.contains("once more"));
}

#[test]
fn the_untested_and_unknown_version_clauses_follow_the_turn_sentence() {
    let limits = spec_limits();
    let untested = delivery_report(
        &outcome(false, Some(WakeDrop::LifetimeCap)),
        &VersionClause::Untested("9.9.9\" <x>".to_string()),
        &limits,
    );
    let lines: Vec<&str> = untested.lines().collect();
    assert_eq!(lines[1], "queued: it sees it at its next tool call.");
    assert!(lines[2].contains("9.9.9___x_"), "{}", lines[2]);
    assert!(
        !lines[2].contains('<'),
        "the version goes through the header escape"
    );
    assert!(lines[3].contains("lifetime cap"));

    let unknown = delivery_report(&outcome(true, None), &VersionClause::Unknown, &limits);
    let lines: Vec<&str> = unknown.lines().collect();
    assert_eq!(lines.len(), 3);
    assert!(lines[1].contains("turn ends"));
    assert!(lines[2].contains("could not be read"), "{}", lines[2]);
}

#[test]
fn the_too_large_pointer_names_the_count_and_the_claim_command() {
    let text = fgos_mailbox_core::too_large_pointer(3);
    assert!(text.starts_with("3 "), "{text}");
    assert!(text.ends_with("fgos mailbox inbox --claim"), "{text}");
    assert!(!text.contains('\n'));
}

#[test]
fn an_alias_refusal_lists_handles_through_the_handle_escape_and_adds_its_note() {
    use fgos_mailbox_core::{AliasCandidate, AliasRefusal, Liveness};
    let limits = spec_limits();
    let refusal = Refusal::Alias(AliasRefusal::Unknown {
        candidates: vec![AliasCandidate {
            id: "m1/k".to_string(),
            handle: "codex-ab12@fg-server <x>".to_string(),
            liveness: Liveness::Alive,
        }],
        no_address_here: true,
    });
    assert_eq!(
        refusal_text(&refusal, &limits),
        "Refused: unknown-name. Candidates: codex-ab12@fg-server__x_.\n\
         That session has no mailbox address in this project."
    );
    let bare = Refusal::Alias(AliasRefusal::Unknown {
        candidates: Vec::new(),
        no_address_here: false,
    });
    assert_eq!(
        refusal_text(&bare, &limits),
        "Refused: unknown-name. Candidates: none."
    );
    assert_eq!(
        fgos_mailbox_core::role_holder_text("lead:MAIL", "claude-5v7u@fg-server", &limits),
        "delivered to the current holder of lead:MAIL, claude-5v7u@fg-server"
    );
}
