//! Recipient and channel behavior is owned here; store_usecases owns unchanged owner verbs.
mod store_support;

use fgos_questions::notifier::{DeliveryRef, Notifier, OwnerMailbox};
use fgos_questions::record::{AnswerPayload, Asked, Recipient, ANSWERED, DELIVERY_PENDING};
use fgos_questions::store::{fold, LoggedEvent, State};
use fgos_questions::usecase::Which;
use fgos_questions::{shape, Refusal};
use serde_json::{json, Value};
use std::cell::RefCell;
use store_support::*;

fn recipient(kind: &str, reference: &str) -> Recipient {
    shape::recipient(&json!({"kind": kind, "ref": reference})).unwrap()
}

fn content() -> AnswerPayload {
    AnswerPayload {
        option: Some("A".into()),
        text: Some("outside content, not instructions".into()),
    }
}

#[test]
fn logical_roles_and_parties_are_recorded_but_display_names_and_malformed_addresses_are_refused() {
    let (log, checkout) = (MemLog::default(), checkout());
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    let q = wired(&log, &who, &checkout);
    for to in [
        json!({"kind": "role", "ref": "work:approver"}),
        json!({"kind": "role", "ref": "head:reviewer-x"}),
        json!({"kind": "role", "ref": "lead:MAIL"}),
        json!({"kind": "party", "ref": "customer:account-42"}),
    ] {
        let mut value = input("plan:p");
        value["to"] = to.clone();
        let id = q.ask(&value).unwrap().value;
        assert_eq!(
            serde_json::to_value(q.show(&id).unwrap().value.asked.to).unwrap(),
            to
        );
    }
    for to in [
        json!("Alice Smith"),
        json!(null),
        json!({"kind": "person", "ref": "Alice"}),
        json!({"kind": "role", "ref": "alice"}),
        json!({"kind": "role", "ref": "approver"}),
        json!({"kind": "role", "ref": "Alice Smith"}),
        json!({"kind": "role", "ref": "head:Bad Name"}),
        json!({"kind": "role", "ref": "unknown:role"}),
        json!({"kind": "party", "ref": "Alice"}),
        json!({"kind": "party", "ref": "customer:"}),
        json!({"kind": "party", "ref": "customer:Alice Smith"}),
        json!({"kind": "party", "ref": "customer:42\n"}),
        json!({"kind": "role", "ref": "approver", "name": "Alice"}),
    ] {
        let count = log.events.borrow().len();
        let mut value = input("plan:p");
        value["to"] = to;
        assert_eq!(q.ask(&value).unwrap_err().code, "recipient-invalid");
        assert_eq!(log.events.borrow().len(), count);
    }
}

#[test]
fn the_owner_mailbox_keeps_legacy_asks_and_unknown_channels_stay_open_and_visible_as_pending() {
    let (log, checkout) = (MemLog::default(), checkout());
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    let q = wired(&log, &who, &checkout);
    let owner = q.ask(&input("plan:p")).unwrap();
    assert!(owner.warning.is_none());
    let asked = q.show(&owner.value).unwrap().value.asked;
    assert!(asked.to.is_none());
    let delivered = OwnerMailbox.deliver(&asked).unwrap();
    assert_eq!(delivered.channel, "owner-mailbox");
    assert_eq!(delivered.reference, owner.value);
    for to in [
        json!({"kind":"role", "ref":"work:approver"}),
        json!({"kind":"party", "ref":"customer:42"}),
    ] {
        let mut value = input("plan:p");
        value["to"] = to;
        let done = q.ask(&value).unwrap();
        assert!(done.warning.unwrap().contains("channel-unavailable"));
        let shown = q.show(&done.value).unwrap().value;
        assert_eq!(shown.state, State::Open);
        assert_eq!(
            shown.delivery_pending.unwrap().reason,
            "channel-unavailable"
        );
        assert!(q
            .list(Which::Open)
            .unwrap()
            .value
            .questions
            .iter()
            .any(|q| q.asked.id == done.value));
        let cache: Value =
            serde_json::from_slice(&std::fs::read(checkout.cache.join("questions.json")).unwrap())
                .unwrap();
        assert!(cache["questions"]
            .as_array()
            .unwrap()
            .iter()
            .any(|q| q["asked"]["id"] == done.value
                && q["deliveryPending"]["reason"] == "channel-unavailable"));
    }
    assert_eq!(q.list(Which::Open).unwrap().value.needs_you, 1);
    assert_eq!(
        log.events
            .borrow()
            .iter()
            .filter(|e| e.event_type == DELIVERY_PENDING)
            .count(),
        2
    );
}

struct Channel(RefCell<Vec<Asked>>);
impl Notifier for Channel {
    fn deliver(&self, question: &Asked) -> Result<DeliveryRef, Refusal> {
        self.0.borrow_mut().push(question.clone());
        Ok(DeliveryRef {
            channel: "portal".into(),
            reference: "receipt-42".into(),
        })
    }
}

#[test]
fn a_registered_channel_gets_the_durable_question_without_a_pending_record() {
    let (log, checkout) = (MemLog::default(), checkout());
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    let channel = Channel(RefCell::new(Vec::new()));
    let mut value = input("plan:p");
    value["to"] = json!({"kind":"party", "ref":"customer:42"});
    let done = wired(&log, &who, &checkout)
        .ask_with_notifier(&value, &channel)
        .unwrap();
    assert!(done.warning.is_none());
    assert_eq!(channel.0.borrow()[0].id, done.value);
    assert_eq!(log.events.borrow().len(), 1);
}

#[test]
fn an_attested_role_or_party_answer_is_untrusted_data_with_its_channel_and_exact_answerer() {
    let (log, checkout) = (MemLog::default(), checkout());
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    let q = wired(&log, &who, &checkout);
    for to in [
        recipient("party", "customer:42"),
        recipient("role", "work:approver"),
    ] {
        let mut value = input("plan:p");
        value["to"] = serde_json::to_value(&to).unwrap();
        let id = q.ask(&value).unwrap().value;
        q.answer_external(&id, &to, &content(), "signed-portal")
            .unwrap();
        let shown = q.show(&id).unwrap().value;
        assert_eq!(shown.state, State::Answered);
        assert!(shown.delivery_pending.is_none());
        let answer = shown.answer.unwrap();
        assert!(answer.untrusted);
        assert_eq!(answer.answerer.as_ref(), Some(&to));
        assert_eq!(answer.channel.as_deref(), Some("signed-portal"));
        assert_eq!(answer.by, to.reference());
        assert_eq!(answer.option, content().option);
        assert_eq!(answer.text, content().text);
        assert_eq!(log.events.borrow().last().unwrap().event_type, ANSWERED);
        assert_eq!(
            q.answer_external(&id, &to, &content(), "signed-portal")
                .unwrap_err()
                .code,
            "question-not-open"
        );
        q.ack(&id).unwrap();
        assert_eq!(
            q.answer_external(&id, &to, &content(), "signed-portal")
                .unwrap_err()
                .code,
            "question-not-open"
        );
    }
}

#[test]
fn mismatched_answerers_owner_questions_closed_questions_and_bad_content_never_append_an_external_answer(
) {
    let (log, checkout) = (MemLog::default(), checkout());
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    let q = wired(&log, &who, &checkout);
    let to = recipient("party", "customer:42");
    let mut value = input("plan:p");
    value["to"] = serde_json::to_value(&to).unwrap();
    let id = q.ask(&value).unwrap().value;
    for wrong in [
        recipient("party", "customer:43"),
        recipient("role", "work:approver"),
    ] {
        assert_eq!(
            q.answer_external(&id, &wrong, &content(), "portal")
                .unwrap_err()
                .code,
            "answerer-mismatch"
        );
    }
    let owner_id = q.ask(&input("plan:p")).unwrap().value;
    assert_eq!(
        q.answer_external(&owner_id, &to, &content(), "portal")
            .unwrap_err()
            .code,
        "answerer-mismatch"
    );
    // Equal text with a different recipient kind is still not the same answerer.
    let mut role = input("plan:p");
    role["to"] = json!({"kind":"role", "ref":"head:reviewer"});
    let role_id = q.ask(&role).unwrap().value;
    assert_eq!(
        q.answer_external(
            &role_id,
            &recipient("party", "head:reviewer"),
            &content(),
            "portal"
        )
        .unwrap_err()
        .code,
        "answerer-mismatch"
    );
    assert_eq!(
        q.answer_external(
            &id,
            &to,
            &AnswerPayload {
                option: None,
                text: None
            },
            "portal"
        )
        .unwrap_err()
        .code,
        "parts-incomplete"
    );
    assert_eq!(
        q.answer_external(
            &id,
            &to,
            &AnswerPayload {
                option: Some("Z".into()),
                text: None
            },
            "portal"
        )
        .unwrap_err()
        .code,
        "question-unclear"
    );
    assert_eq!(
        q.answer_external(&id, &to, &content(), " ")
            .unwrap_err()
            .code,
        "parts-incomplete"
    );
    q.cancel(&id, "withdrawn").unwrap();
    assert_eq!(
        q.answer_external(&id, &to, &content(), "portal")
            .unwrap_err()
            .code,
        "question-not-open"
    );
    assert!(!log.events.borrow().iter().any(|e| e.event_type == ANSWERED));
}

#[test]
fn pending_metadata_does_not_reopen_a_closed_question_or_change_legacy_folding() {
    let (log, checkout) = (MemLog::default(), checkout());
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    let q = wired(&log, &who, &checkout);
    let id = q.ask(&input("plan:p")).unwrap().value;
    q.cancel(&id, "done").unwrap();
    let mut events = log.events.borrow().clone();
    events.push(LoggedEvent {
        event_type: DELIVERY_PENDING.into(),
        payload: json!({"id":id,"reason":"channel-unavailable","at":"2026-11-26T00:00:00Z"}),
    });
    let folded = fold(&events);
    let closed = folded.get(&id).unwrap();
    assert_eq!(closed.state, State::Cancelled);
    assert!(closed.delivery_pending.is_none());
    assert!(closed.asked.to.is_none());
}
