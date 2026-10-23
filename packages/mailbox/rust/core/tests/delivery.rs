mod common;

use common::{key, plain, t, Pair, A_NAME, B_NAME};
use fgos_mailbox_core::{AttemptToken, Checkpoint, Generation, MessageState, Refusal};

const G1: Generation = Generation::FIRST;

#[test]
fn a_sent_message_is_recorded_for_the_recipients_current_generation() {
    let mut pair = Pair::new(t(100));
    let g2 = pair.take_over("b", "codex", t(100));

    let outcome = pair
        .state
        .send(
            plain("a", B_NAME, "hello"),
            t(200),
            &pair.limits,
            &mut pair.ids,
        )
        .unwrap();

    assert_eq!(outcome.to.as_str(), B_NAME);
    assert_eq!(outcome.to_generation, g2);
    assert_eq!(
        outcome.to_cli.as_str(),
        "codex",
        "the recipient's current binding"
    );
    assert_eq!(outcome.to_head, "a-new-head");
    assert_eq!(outcome.depth, 0);
    let header = pair.state.message(&outcome.id).unwrap();
    assert_eq!(header.state, MessageState::Recorded);
    assert_eq!(header.to, key("b"));
    assert_eq!(header.to_generation, g2);
    assert_eq!(header.from, key("a"));
    assert_eq!(header.from_generation, Some(G1));
    assert_eq!(header.body_bytes, "hello".len() as u64);
    assert_eq!(header.recorded_at, t(200));
    assert_eq!(header.offers, 0);
}

#[test]
fn claim_then_finish_with_the_same_token_and_generation_offers_the_message() {
    let mut pair = Pair::new(t(100));
    let id = pair.send("a", B_NAME, "hello", t(100));

    let claim = pair.claim("b", G1, t(110));
    assert_eq!(claim.items.len(), 1);
    let item = &claim.items[0];
    assert_eq!(item.id, id);
    assert_eq!(common::mail_from(item).label, A_NAME);
    assert!(common::mail_from(item).has_head);
    assert_eq!(item.attempt, 1);
    assert!(matches!(
        pair.state.message(&id).unwrap().state,
        MessageState::InFlight { .. }
    ));

    let token = claim.token.unwrap();
    let finished = pair.state.finish(&key("b"), G1, &token, t(111));

    assert_eq!(finished.offered, vec![id.clone()]);
    assert!(finished.ignored.is_empty());
    assert!(finished.changed, "the store must write an offer");
    assert_eq!(
        pair.state.message(&id).unwrap().state,
        MessageState::Offered { at: t(111) }
    );
}

#[test]
fn a_finish_with_a_wrong_token_is_ignored_and_changes_nothing() {
    let mut pair = Pair::new(t(100));
    pair.send("a", B_NAME, "hello", t(100));
    pair.claim("b", G1, t(110));
    let before = pair.state.clone();

    let finished = pair.state.finish(
        &key("b"),
        G1,
        &AttemptToken::from_text("not-a-token"),
        t(110),
    );

    assert!(finished.offered.is_empty());
    assert!(finished.ignored.is_empty());
    assert_eq!(pair.state, before);
    assert!(!finished.changed, "nothing for the store to write");
}

#[test]
fn a_finish_after_the_deadline_sweep_and_a_second_claim_is_ignored() {
    let mut pair = Pair::new(t(100));
    let id = pair.send("a", B_NAME, "hello", t(100));
    let first = pair.claim("b", G1, t(100)).token.unwrap();

    let past_deadline = t(100 + pair.limits.in_flight_ttl_sec + 1);
    let second = pair.claim("b", G1, past_deadline).token.unwrap();

    let late = pair.state.finish(&key("b"), G1, &first, past_deadline);
    assert!(late.offered.is_empty());
    assert!(matches!(
        pair.state.message(&id).unwrap().state,
        MessageState::InFlight { .. }
    ));

    let live = pair.state.finish(&key("b"), G1, &second, past_deadline);
    assert_eq!(live.offered, vec![id]);
}

#[test]
fn a_lost_finish_yields_a_duplicate_offer_with_attempt_2() {
    let mut pair = Pair::new(t(100));
    let id = pair.send("a", B_NAME, "hello", t(100));
    pair.claim("b", G1, t(100));

    let again = pair.claim("b", G1, t(100 + pair.limits.in_flight_ttl_sec + 1));

    assert_eq!(again.items.len(), 1);
    assert_eq!(again.items[0].id, id);
    assert_eq!(again.items[0].attempt, 2);
}

#[test]
fn mail_for_generation_1_is_never_claimed_by_generation_2() {
    let mut pair = Pair::new(t(100));
    let id = pair.send("a", B_NAME, "for the first process", t(100));
    let g2 = pair.take_over("b", "codex", t(110));

    let claim = pair.claim("b", g2, t(120));

    assert!(claim.items.is_empty());
    assert!(claim.token.is_none());
    assert_eq!(
        pair.state.message(&id).unwrap().state,
        MessageState::Recorded
    );
}

#[test]
fn a_finish_from_generation_1_after_a_takeover_is_ignored() {
    let mut pair = Pair::new(t(100));
    let id = pair.send("a", B_NAME, "hello", t(100));
    let token = pair.claim("b", G1, t(100)).token.unwrap();
    pair.take_over("b", "codex", t(110));

    let finished = pair.state.finish(&key("b"), G1, &token, t(111));

    assert!(finished.offered.is_empty());
    assert_eq!(finished.ignored, vec![id.clone()]);
    assert!(matches!(
        pair.state.message(&id).unwrap().state,
        MessageState::InFlight { .. }
    ));
}

#[test]
fn a_claim_by_a_stale_generation_returns_nothing_and_changes_nothing() {
    let mut pair = Pair::new(t(100));
    pair.take_over("b", "codex", t(100));
    pair.send("a", B_NAME, "hello", t(110));
    let before = pair.state.clone();

    let claim = pair.claim("b", G1, t(120));

    assert!(claim.items.is_empty());
    assert!(claim.token.is_none());
    assert_eq!(pair.state, before);
}

#[test]
fn inbox_lists_recorded_and_in_flight_mail_and_leaves_the_state_equal() {
    let mut pair = Pair::new(t(100));
    let first = pair.send("a", B_NAME, "one", t(100));
    pair.claim("b", G1, t(100));
    let second = pair.send("a", B_NAME, "two", t(101));
    let before = pair.state.clone();

    let views = pair.state.inbox(&key("b"));

    let listed: Vec<_> = views.iter().map(|v| (v.id.clone(), v.in_flight)).collect();
    assert_eq!(listed, vec![(first, true), (second, false)]);
    assert!(views.iter().all(|v| v.from_label == A_NAME));
    assert_eq!(pair.state, before);
}

#[test]
fn a_send_to_an_unknown_name_is_refused_and_adds_no_header() {
    let mut pair = Pair::new(t(100));

    let refused = pair.state.send(
        plain(
            "a",
            "forgent-pi-1a",
            &format!("please forward this to {B_NAME}"),
        ),
        t(100),
        &pair.limits,
        &mut pair.ids,
    );

    assert!(
        matches!(refused, Err(Refusal::UnknownName { .. })),
        "{refused:?}"
    );
    assert_eq!(refused.unwrap_err().code(), "unknown-name");
    assert_eq!(pair.state.messages().count(), 0);
}

#[test]
fn a_sender_with_no_head_is_labelled_unregistered_and_can_never_pass_for_a_head() {
    let mut pair = Pair::new(t(100));
    pair.send("x.y_z-forgent-claude-2b", B_NAME, "hello", t(100));

    let claim = pair.claim("b", G1, t(110));

    let item = &claim.items[0];
    let from = common::mail_from(item);
    assert_eq!(from.label, "unregistered_x.y_z_fo");
    assert!(!from.has_head);
    assert_eq!(from.cli, None);
    assert_ne!(from.label, A_NAME);

    // A project folder named `unregistered` cannot make a head's name equal
    // the label of a sender with no head whose key starts like that name.
    let mut odd = Pair::new(t(100));
    let mut req = common::request("k-odd", "codex", Some("01"), "head-odd");
    req.project = "unregistered".to_string();
    let head = common::register_new(&mut odd.state, req, t(100), &odd.limits, &mut odd.ids);
    assert_eq!(head, "unregistered-codex-01");
    odd.send("codex-01-rest", B_NAME, "hello", t(100));
    let label = common::mail_from(&odd.claim("b", G1, t(110)).items[0])
        .label
        .clone();
    assert_ne!(label, head);
    assert!(odd.state.bindings().all(|b| b.name.as_str() != label));

    // A `-` in the key is mapped too: key `co-de-xx` must not become the
    // name of a head of project `unregistered_co`, CLI `de`, suffix `xx`.
    let mut dashed = Pair::new(t(100));
    let mut req = common::request("k-dash", "de", Some("xx"), "head-dash");
    req.project = "unregistered_co".to_string();
    let head = common::register_new(
        &mut dashed.state,
        req,
        t(100),
        &dashed.limits,
        &mut dashed.ids,
    );
    assert_eq!(head, "unregistered_co-de-xx");
    dashed.send("co-de-xx", B_NAME, "hello", t(100));
    let label = common::mail_from(&dashed.claim("b", G1, t(110)).items[0])
        .label
        .clone();
    assert_eq!(label, "unregistered_co_de_xx");
    assert_ne!(label, head);
}

#[test]
fn a_token_cannot_finish_mail_addressed_to_another_head() {
    let mut pair = Pair::new(t(100));
    let id = pair.send("a", B_NAME, "for b", t(100));
    let token = pair.claim("b", G1, t(110)).token.unwrap();

    let finished = pair.state.finish(&key("a"), G1, &token, t(111));

    assert!(finished.offered.is_empty());
    assert!(finished.ignored.is_empty());
    assert!(matches!(
        pair.state.message(&id).unwrap().state,
        MessageState::InFlight { .. }
    ));
}

#[test]
fn a_drain_stamps_last_drain_at_when_mail_is_pending_even_if_it_takes_none_and_an_empty_drain_changes_nothing(
) {
    let mut pair = Pair::new(t(100));
    let before = pair.state.clone();
    let empty = pair.state.claim(
        &key("b"),
        G1,
        Checkpoint::Stop,
        t(105),
        &pair.limits,
        &mut pair.ids,
    );
    assert!(empty.items.is_empty());
    assert!(!empty.changed, "an empty drain reports no change");
    assert_eq!(pair.state, before);

    // Pending but not eligible at Stop: it carries no effective wake.
    pair.send("a", B_NAME, "fyi", t(110));
    let stop = pair.state.claim(
        &key("b"),
        G1,
        Checkpoint::Stop,
        t(120),
        &pair.limits,
        &mut pair.ids,
    );

    assert!(stop.items.is_empty());
    assert!(stop.changed, "the stamp is a change the store must write");
    assert_eq!(
        pair.state.binding(&key("b")).unwrap().last_drain_at,
        Some(t(120))
    );
    assert_eq!(pair.state.binding(&key("a")).unwrap().last_drain_at, None);
}

/// The worst-case frame size of each item a plain step claim would take
/// now, in claim order, measured on a copy of the state.
fn worst_cases(pair: &Pair, key_text: &str, now: fgos_mailbox_core::Timestamp) -> Vec<usize> {
    let mut copy = pair.state.clone();
    let mut ids = pair.ids.clone();
    let claim = copy.claim(
        &key(key_text),
        G1,
        Checkpoint::Step,
        now,
        &pair.limits,
        &mut ids,
    );
    claim
        .items
        .iter()
        .map(|item| {
            let bytes = pair.state.message(&item.id).map_or(0, |h| h.body_bytes);
            fgos_mailbox_core::worst_case_len(item, bytes, &pair.limits)
        })
        .collect()
}

/// The smallest bound whose step budget is exactly `budget`.
fn bound_for(budget: usize) -> u64 {
    (budget + fgos_mailbox_core::pointer_reserve()) as u64
}

#[test]
fn a_step_claim_takes_messages_in_order_only_while_their_worst_case_frames_fit_the_bound() {
    let mut pair = Pair::new(t(100));
    let first = pair.send("a", B_NAME, "one", t(100));
    let second = pair.send("a", B_NAME, "two, a little longer", t(101));
    let third = pair.send("a", B_NAME, "six", t(102));
    let sizes = worst_cases(&pair, "b", t(110));
    // The second fits alone but not beside the first; the third would fit
    // beside the first, and is still not taken: the claim keeps the order.
    let budget = sizes[0] + 2 + sizes[2];
    assert!(sizes[1] <= budget && sizes[0] + 2 + sizes[1] > budget);

    let claim = pair.state.claim(
        &key("b"),
        G1,
        Checkpoint::BoundedStep(bound_for(budget)),
        t(110),
        &pair.limits,
        &mut pair.ids,
    );

    let taken: Vec<_> = claim.items.iter().map(|i| i.id.clone()).collect();
    assert_eq!(taken, vec![first]);
    assert_eq!(claim.too_large, 0);
    for id in [second, third] {
        let header = pair.state.message(&id).unwrap();
        assert_eq!(header.state, MessageState::Recorded);
        assert_eq!(header.offers, 0);
    }
}

#[test]
fn a_message_whose_worst_case_frame_alone_exceeds_the_bound_stays_recorded_and_is_counted_as_too_large(
) {
    let mut pair = Pair::new(t(100));
    let big_body = "x".repeat(4000);
    let big = pair.send("a", B_NAME, &big_body, t(100));
    let small = pair.send("a", B_NAME, "small", t(101));
    let sizes = worst_cases(&pair, "b", t(110));
    let bound = bound_for(sizes[1]);
    assert!(sizes[0] > sizes[1]);

    let claim = pair.state.claim(
        &key("b"),
        G1,
        Checkpoint::BoundedStep(bound),
        t(110),
        &pair.limits,
        &mut pair.ids,
    );

    // The oldest message is too large alone; the later, smaller one is still taken.
    assert_eq!(
        claim.items.iter().map(|i| i.id.clone()).collect::<Vec<_>>(),
        vec![small]
    );
    assert_eq!(claim.too_large, 1);
    let header = pair.state.message(&big).unwrap();
    assert_eq!(header.state, MessageState::Recorded);
    assert_eq!(header.offers, 0);
}

#[test]
fn a_bounded_step_whose_every_item_is_too_large_takes_nothing_and_still_counts_them() {
    let mut pair = Pair::new(t(100));
    let big = pair.send("a", B_NAME, &"x".repeat(4000), t(100));

    let claim = pair.state.claim(
        &key("b"),
        G1,
        Checkpoint::BoundedStep(bound_for(10)),
        t(110),
        &pair.limits,
        &mut pair.ids,
    );

    assert!(claim.items.is_empty());
    assert_eq!(claim.token, None);
    assert_eq!(claim.too_large, 1);
    assert!(
        claim.changed,
        "a drain that found mail pending stamps last_drain_at"
    );
    assert_eq!(
        pair.state.message(&big).unwrap().state,
        MessageState::Recorded
    );
}

#[test]
fn a_stop_claim_and_a_plain_step_claim_are_not_limited_by_a_bound() {
    let mut pair = Pair::new(t(100));
    let body = "x".repeat(pair.limits.max_body_bytes as usize);
    let mut req = common::plain("a", B_NAME, &body);
    req.wake = true;
    let woke = pair.try_send(req, t(100)).unwrap().id;
    let stop = pair.state.claim(
        &key("b"),
        G1,
        Checkpoint::Stop,
        t(110),
        &pair.limits,
        &mut pair.ids,
    );
    assert_eq!(stop.items.len(), 1);
    assert_eq!(stop.items[0].id, woke);
    assert_eq!(stop.too_large, 0);

    let mut pair = Pair::new(t(100));
    let plain = pair.send("a", B_NAME, &body, t(100));
    let step = pair.claim("b", G1, t(110));
    assert_eq!(
        step.items.iter().map(|i| i.id.clone()).collect::<Vec<_>>(),
        vec![plain]
    );
    assert_eq!(step.too_large, 0);
}

#[test]
fn a_notice_is_claimed_under_a_bounded_step() {
    let mut pair = Pair::new(t(0));
    let id = pair.send("a", B_NAME, "hello", t(10));
    pair.sweep(t(10).plus_secs(pair.limits.record.ttl_sec + 1));
    assert_eq!(
        pair.state.notices().count(),
        1,
        "the refusal made a notice to a"
    );

    let claim = pair.state.claim(
        &key("a"),
        G1,
        Checkpoint::BoundedStep(bound_for(10_000)),
        t(10).plus_secs(pair.limits.record.ttl_sec + 2),
        &pair.limits,
        &mut pair.ids,
    );

    assert_eq!(claim.items.len(), 1);
    assert_eq!(claim.items[0].kind(), fgos_mailbox_core::Kind::Notice);
    match &claim.items[0].what {
        fgos_mailbox_core::ClaimedWhat::Notice(facts) => assert_eq!(facts.about, id),
        other => panic!("expected a notice, got {other:?}"),
    }
}

#[test]
fn the_pointer_line_fits_inside_the_bound() {
    let mut pair = Pair::new(t(100));
    pair.send("a", B_NAME, &"<&>\n".repeat(900), t(100));
    pair.send("a", B_NAME, "one", t(101));
    pair.send("a", B_NAME, "two", t(102));
    let sizes = worst_cases(&pair, "b", t(110));
    let bound = bound_for(sizes[1] + 2 + sizes[2]);

    let claim = pair.state.claim(
        &key("b"),
        G1,
        Checkpoint::BoundedStep(bound),
        t(110),
        &pair.limits,
        &mut pair.ids,
    );

    assert_eq!(claim.items.len(), 2);
    assert_eq!(claim.too_large, 1);
    let frames: Vec<String> = claim
        .items
        .iter()
        .map(|item| {
            let body = if item.id == claim.items[0].id {
                "one"
            } else {
                "two"
            };
            fgos_mailbox_core::render(item, Some(body), &pair.limits)
        })
        .collect();
    let reply = format!(
        "{}\n\n{}",
        frames.join("\n\n"),
        fgos_mailbox_core::too_large_pointer(claim.too_large)
    );
    assert!(reply.len() as u64 <= bound, "{} > {bound}", reply.len());
}

#[test]
fn the_blank_line_between_two_frames_counts_against_the_bound() {
    let mut pair = Pair::new(t(100));
    let first = pair.send("a", B_NAME, "one", t(100));
    pair.send("a", B_NAME, "two", t(101));
    let sizes = worst_cases(&pair, "b", t(110));

    let claim = pair.state.claim(
        &key("b"),
        G1,
        Checkpoint::BoundedStep(bound_for(sizes[0] + 1 + sizes[1])),
        t(110),
        &pair.limits,
        &mut pair.ids,
    );

    assert_eq!(
        claim.items.iter().map(|i| i.id.clone()).collect::<Vec<_>>(),
        vec![first]
    );
}

/// The snapshot's wake allowances as plain JSON: the exchanges and the wake
/// lifetime counts.
fn wake_allowances(pair: &Pair) -> (serde_json::Value, serde_json::Value) {
    let snapshot = serde_json::to_value(&pair.state).unwrap();
    (
        snapshot["exchanges"].clone(),
        snapshot["wake_lifetime"].clone(),
    )
}

#[test]
fn a_send_with_wake_to_a_recipient_whose_cli_has_no_stop_drain_records_no_effective_wake_and_spends_no_allowance(
) {
    let mut pair = Pair::new(t(100));
    let quota = pair.limits.wake.max_per_exchange;
    for i in 0..=quota {
        let mut req = plain("a", B_NAME, "wake up");
        req.wake = true;
        req.stop_drains.remove(&common::cli("codex"));
        let sent = pair.try_send(req, t(100 + u64::from(i))).unwrap();
        assert!(!sent.effective_wake, "send {i}");
        assert!(!sent.to_stop_drains);
        assert_eq!(
            sent.wake_dropped,
            Some(fgos_mailbox_core::WakeDrop::NoChannel)
        );
        let header = pair.state.message(&sent.id).unwrap();
        assert!(header.wake, "the sender's permission is kept");
        assert!(!header.effective_wake);
    }
    let (exchanges, lifetime) = wake_allowances(&pair);
    assert!(
        exchanges
            .as_object()
            .unwrap()
            .values()
            .all(|e| e["wakes_spent"] == 0),
        "{exchanges}"
    );
    assert_eq!(lifetime, serde_json::json!({}));

    // The other direction, toward a CLI whose Stop drains, still has its
    // whole allowance.
    let back = pair.send_wake("b", A_NAME, t(200));
    assert!(back.effective_wake);
    assert!(back.to_stop_drains);
}

#[test]
fn mail_recorded_with_an_effective_wake_before_the_stop_channel_was_turned_off_is_claimed_at_the_next_bounded_step(
) {
    let mut pair = Pair::new(t(100));
    // Recorded while the recipient's Stop still drained.
    let old = pair.send_wake("a", B_NAME, t(100));
    assert!(old.effective_wake);

    let step = pair.state.claim(
        &key("b"),
        G1,
        Checkpoint::BoundedStep(8192),
        t(110),
        &pair.limits,
        &mut pair.ids,
    );

    assert_eq!(
        step.items.iter().map(|i| i.id.clone()).collect::<Vec<_>>(),
        vec![old.id]
    );
}

fn alias_candidate(handle: &str) -> fgos_mailbox_core::AliasCandidate {
    fgos_mailbox_core::AliasCandidate {
        id: format!("m1/{handle}"),
        handle: handle.to_string(),
        liveness: fgos_mailbox_core::Liveness::Alive,
    }
}

#[test]
fn an_alias_refusal_is_counted_toward_the_budget_and_the_lifetime_cap_and_refused_with_its_own_reason_and_candidates(
) {
    let mut pair = Pair::new(t(100));
    pair.limits.session.lifetime_cap = 1;
    let refusal = fgos_mailbox_core::AliasRefusal::Unknown {
        candidates: vec![alias_candidate("codex-ab12@fg-server")],
        no_address_here: true,
    };
    let mut req = plain("a", "codex-ab12@fg-server", "hi");
    req.alias_refusal = Some(refusal.clone());

    let refused = pair.try_send(req, t(100)).unwrap_err();

    assert_eq!(refused, Refusal::Alias(refusal));
    assert_eq!(refused.code(), "unknown-name");
    assert!(pair.state.messages().next().is_none());
    // The refused attempt spent the sender's one lifetime attempt.
    assert_eq!(
        pair.try_send(plain("a", B_NAME, "next"), t(101))
            .unwrap_err()
            .code(),
        "lifetime-cap"
    );
    let counted = serde_json::to_value(&pair.state).unwrap()["counters"].to_string();
    assert!(counted.contains("unknown-name"), "{counted}");
}

#[test]
fn an_ambiguous_alias_is_refused_ambiguous_name_with_every_candidate() {
    let mut pair = Pair::new(t(100));
    let candidates = vec![
        alias_candidate("claude-aaaa@m"),
        alias_candidate("claude-bbbb@m"),
    ];
    let mut req = plain("a", "lead:MAIL", "hi");
    req.alias_refusal = Some(fgos_mailbox_core::AliasRefusal::Ambiguous {
        candidates: candidates.clone(),
    });

    let refused = pair.try_send(req, t(100)).unwrap_err();

    assert_eq!(refused.code(), "ambiguous-name");
    assert_eq!(
        refused,
        Refusal::Alias(fgos_mailbox_core::AliasRefusal::Ambiguous { candidates })
    );
}

#[test]
fn an_alias_resolving_to_the_sender_itself_is_refused_as_self() {
    let mut pair = Pair::new(t(100));
    // The caller resolved the alias to a's own key and passes the key.
    let refused = pair.try_send(plain("a", "a", "hi"), t(100)).unwrap_err();
    assert_eq!(refused, Refusal::SelfSend);
}
