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
