//! The verbs over an in-memory log: every ask refusal, each shape rule, answer-once, the owner rule, the
//! authority to ack and cancel, supersede, the view after a write, and the events with their attrs.

mod store_support;
use fgos_questions::store::State;
use fgos_questions::usecase::Which;
use serde_json::{json, Value};
use store_support::*;

fn refused(
    result: Result<impl std::fmt::Debug, fgos_questions::Refusal>,
) -> fgos_questions::Refusal {
    result.expect_err("a refusal")
}

fn ask_refusal(mutate: impl FnOnce(&mut Value)) -> fgos_questions::Refusal {
    let (log, checkout) = (MemLog::default(), checkout());
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    let mut value = input("plan:p");
    mutate(&mut value);
    refused(wired(&log, &who, &checkout).ask(&value))
}

#[test]
fn an_ask_records_the_asker_the_ref_with_its_branch_and_commit_and_the_five_parts() {
    let (log, checkout) = (MemLog::default(), checkout());
    let mut who = head("m-1/a", "head:coder-x");
    who.persona = Some("coder".into());
    who.pane = Some("pane-3".into());
    let id = ask_as(&log, who, &checkout, &input("plan:p#phase-01"));
    assert!(id.starts_with("q-"));
    let events = log.events.borrow();
    assert_eq!(events.len(), 1);
    assert_eq!(events[0].event_type, "questions.asked");
    let p = &events[0].payload;
    assert_eq!(p["id"], id);
    assert_eq!(p["asker"]["sessionId"], "m-1/a");
    assert_eq!(p["asker"]["handle"], "m-1/a-handle");
    assert_eq!(p["asker"]["roles"], json!(["head:coder-x"]));
    assert_eq!(p["asker"]["persona"], "coder");
    assert_eq!(p["asker"]["pane"], "pane-3");
    assert_eq!(p["asker"]["machine"], "m-1");
    assert_eq!(p["ref"]["value"], "plan:p#phase-01");
    assert_eq!(p["ref"]["branch"], "work");
    assert_eq!(p["ref"]["commit"].as_str().unwrap().len(), 40);
    assert_eq!(p["stage"], "planning");
    assert_eq!(p["migrated"], false);
    assert_eq!(p["parts"]["options"].as_array().unwrap().len(), 2);
    assert!(p["askedAt"].as_str().unwrap().ends_with('Z'));
}

#[test]
fn an_ask_with_no_resolvable_caller_is_refused_asker_unresolved() {
    let (log, checkout) = (MemLog::default(), checkout());
    let who = Fixed(Err(fgos_questions::Refusal::new(
        "asker-unresolved",
        "no session",
    )));
    let refusal = refused(wired(&log, &who, &checkout).ask(&input("plan:p")));
    assert_eq!(refusal.code, "asker-unresolved");
    assert!(log.events.borrow().is_empty());
}

#[test]
fn a_ref_of_another_form_or_missing_from_the_checkout_is_refused_ref_invalid() {
    for bad in [
        "nonsense",
        "plan:",
        "plan:../x",
        "plan:p#phase-1",
        "plan:p#phase-09",
        "plan:absent",
        "discussion:d",
        "discussion:d#Qx",
        "discussion:absent#Q1",
        "case:nope",
        "case:r#a/b",
        "issue:7",
    ] {
        let refusal = ask_refusal(|v| v["ref"] = json!(bad));
        assert_eq!(refusal.code, "ref-invalid", "{bad}");
    }
}

#[test]
fn the_three_ref_forms_are_accepted_when_the_checkout_holds_them() {
    let (log, checkout) = (MemLog::default(), checkout());
    std::fs::create_dir_all(checkout.root.join(".fgos/workflow-runs/run-1")).unwrap();
    for reference in [
        "discussion:d#Q3",
        "plan:p",
        "plan:p#phase-01",
        "case:run-1",
        "case:run-1#gate",
    ] {
        let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
        wired(&log, &who, &checkout).ask(&input(reference)).unwrap();
    }
    assert_eq!(log.events.borrow().len(), 5);
}

#[test]
fn an_absent_required_part_is_refused_parts_incomplete_naming_it() {
    for (name, mutate) in [
        (
            "parts.what",
            (|v: &mut Value| {
                v["parts"].as_object_mut().unwrap().remove("what");
            }) as fn(&mut Value),
        ),
        ("parts.cause", |v| {
            v["parts"].as_object_mut().unwrap().remove("cause");
        }),
        ("parts.scope", |v| {
            v["parts"].as_object_mut().unwrap().remove("scope");
        }),
        ("parts.scope.forbids", |v| {
            v["parts"]["scope"]
                .as_object_mut()
                .unwrap()
                .remove("forbids");
        }),
        ("parts.options", |v| {
            v["parts"].as_object_mut().unwrap().remove("options");
        }),
        ("parts.recommendation", |v| {
            v["parts"].as_object_mut().unwrap().remove("recommendation");
        }),
        ("headline", |v| {
            v.as_object_mut().unwrap().remove("headline");
        }),
    ] {
        let refusal = ask_refusal(mutate);
        assert_eq!(refusal.code, "parts-incomplete", "{name}");
        assert_eq!(refusal.missing, vec![name.to_string()], "{name}");
    }
    let refusal = ask_refusal(|v| v["extra"] = json!(1));
    assert_eq!(refusal.code, "parts-incomplete");
}

#[test]
fn each_measurable_shape_rule_is_refused_question_unclear_naming_field_and_rule() {
    let long = |n: usize| "é".repeat(n);
    type Case = (&'static str, fn(&mut Value, String), String);
    let cases: Vec<Case> = vec![
        ("headline", |v, s| v["headline"] = json!(s), long(121)),
        (
            "headline",
            |v, s| v["headline"] = json!(s),
            "one\ntwo".into(),
        ),
        (
            "parts.what",
            |v, s| v["parts"]["what"] = json!(s),
            long(601),
        ),
        (
            "parts.cause",
            |v, s| v["parts"]["cause"] = json!(s),
            long(601),
        ),
        (
            "parts.options[0].label",
            |v, s| v["parts"]["options"][0]["label"] = json!(s),
            long(61),
        ),
        (
            "blocks",
            |v, _| {
                v.as_object_mut().unwrap().remove("blocks");
            },
            String::new(),
        ),
        ("blocks", |v, s| v["blocks"] = json!(s), String::new()),
    ];
    for (field, mutate, value) in cases {
        let refusal = ask_refusal(|v| mutate(v, value));
        assert_eq!(
            (refusal.code.as_str(), refusal.field.as_deref()),
            ("question-unclear", Some(field))
        );
        assert!(refusal.rule.is_some(), "{field} names its rule");
    }
}

#[test]
fn what_and_cause_are_counted_in_characters_not_bytes() {
    let (log, checkout) = (MemLog::default(), checkout());
    let mut value = input("plan:p");
    value["parts"]["what"] = json!("é".repeat(600));
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    wired(&log, &who, &checkout).ask(&value).unwrap();
}

#[test]
fn the_option_count_and_the_single_recommendation_are_enforced_for_a_decision_question() {
    let one = ask_refusal(|v| v["parts"]["options"] = json!([option("A", true)]));
    assert_eq!(
        (one.code.as_str(), one.field.as_deref()),
        ("question-unclear", Some("parts.options"))
    );
    let five = ask_refusal(|v| {
        v["parts"]["options"] = json!([
            option("A", true),
            option("B", false),
            option("C", false),
            option("D", false),
            option("E", false)
        ]);
    });
    assert_eq!(five.field.as_deref(), Some("parts.options"));
    let none_recommended =
        ask_refusal(|v| v["parts"]["options"] = json!([option("A", false), option("B", false)]));
    assert_eq!(
        none_recommended.rule.as_deref(),
        Some("exactly one option recommended")
    );
    let two_recommended =
        ask_refusal(|v| v["parts"]["options"] = json!([option("A", true), option("B", true)]));
    assert_eq!(
        two_recommended.rule.as_deref(),
        Some("exactly one option recommended")
    );
}

#[test]
fn options_and_recommendation_may_be_empty_only_for_discovery_stages_shaping_discussions_and_migrated(
) {
    let relaxed = |mutate: fn(&mut Value)| {
        let (log, checkout) = (MemLog::default(), checkout());
        let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
        let mut value = input("plan:p");
        value["parts"].as_object_mut().unwrap().remove("options");
        value["parts"]
            .as_object_mut()
            .unwrap()
            .remove("recommendation");
        mutate(&mut value);
        wired(&log, &who, &checkout).ask(&value).map(|d| d.value)
    };
    assert!(relaxed(|v| v["stage"] = json!("discovery")).is_ok());
    assert!(relaxed(|v| v["stage"] = json!("exploring")).is_ok());
    assert!(relaxed(|v| {
        v["stage"] = json!("shaping");
        v["ref"] = json!("discussion:d#Q1");
    })
    .is_ok());
    assert!(relaxed(|v| v["migrated"] = json!(true)).is_ok());
    assert_eq!(
        relaxed(|v| v["stage"] = json!("shaping")).unwrap_err().code,
        "parts-incomplete"
    );
    assert_eq!(relaxed(|_| {}).unwrap_err().code, "parts-incomplete");
}

#[test]
fn an_answer_is_written_once_by_the_owner_and_a_second_is_refused() {
    let (log, checkout) = (MemLog::default(), checkout());
    let id = ask_as(
        &log,
        head("m-1/a", "head:coder-x"),
        &checkout,
        &input("plan:p"),
    );
    let who = Fixed(Ok(owner()));
    let q = wired(&log, &who, &checkout);
    q.answer(&id, Some("A"), Some("because"), None).unwrap();
    assert_eq!(
        refused(q.answer(&id, Some("B"), None, None)).code,
        "question-already-answered"
    );
    let events = log.events.borrow();
    assert_eq!(
        events
            .iter()
            .filter(|e| e.event_type == "questions.answered")
            .count(),
        1
    );
    let answered = &events[1].payload;
    assert_eq!(
        (
            answered["option"].as_str(),
            answered["text"].as_str(),
            answered["by"].as_str()
        ),
        (Some("A"), Some("because"), Some("owner"))
    );
}

#[test]
fn an_answer_needs_a_known_open_question_an_option_label_that_exists_and_some_content() {
    let (log, checkout) = (MemLog::default(), checkout());
    let id = ask_as(
        &log,
        head("m-1/a", "head:coder-x"),
        &checkout,
        &input("plan:p"),
    );
    let who = Fixed(Ok(owner()));
    let q = wired(&log, &who, &checkout);
    assert_eq!(
        refused(q.answer("q-nope", None, Some("x"), None)).code,
        "question-unknown"
    );
    assert_eq!(
        refused(q.answer(&id, None, None, None)).code,
        "parts-incomplete"
    );
    assert_eq!(
        refused(q.answer(&id, Some("Z"), None, None)).code,
        "question-unclear"
    );
    let canceller = Fixed(Ok(head("m-1/a", "head:coder-x")));
    wired(&log, &canceller, &checkout)
        .cancel(&id, "gone")
        .unwrap();
    assert_eq!(
        refused(q.answer(&id, Some("A"), None, None)).code,
        "question-not-open"
    );
}

#[test]
fn an_agent_ancestor_blocks_an_answer_except_the_secretary_head_through_its_route() {
    let (log, checkout) = (MemLog::default(), checkout());
    let id = ask_as(
        &log,
        head("m-1/a", "head:coder-x"),
        &checkout,
        &input("plan:p"),
    );
    let answer = |who: fgos_questions::caller::Caller, source: Option<&str>| {
        let who = Fixed(Ok(who));
        wired(&log, &who, &checkout)
            .answer(&id, Some("A"), None, source)
            .map(|d| d.value)
    };
    let agent = || head("m-1/b", "head:coder-y");
    assert_eq!(answer(agent(), None).unwrap_err().code, "answer-not-owner");
    assert_eq!(
        answer(agent(), Some("gateway:alice")).unwrap_err().code,
        "answer-not-owner"
    );
    assert_eq!(
        answer(agent(), Some("anything")).unwrap_err().code,
        "answer-not-owner"
    );
    assert_eq!(
        answer(agent(), Some("secretary")).unwrap_err().code,
        "answer-not-owner"
    );
    assert_eq!(
        answer(head("m-1/s", "head:secretary-miu"), None)
            .unwrap_err()
            .code,
        "answer-not-owner"
    );
    assert!(answer(head("m-1/s", "head:secretary-miu"), Some("secretary")).is_ok());
    let second = ask_as(
        &log,
        head("m-1/a", "head:coder-x"),
        &checkout,
        &input("plan:p"),
    );
    let gateway = Fixed(Ok(owner()));
    wired(&log, &gateway, &checkout)
        .answer(&second, Some("B"), None, Some("gateway:alice"))
        .unwrap();
    let via = log.events.borrow().last().unwrap().payload["via"].clone();
    assert_eq!(via, "gateway:alice");
}

fn closing(asker: fgos_questions::caller::Caller, migrated: bool) -> (MemLog, Checkout, String) {
    let (log, checkout) = (MemLog::default(), checkout());
    let mut value = input("plan:p");
    if migrated {
        value["migrated"] = json!(true);
    }
    let id = ask_as(&log, asker, &checkout, &value);
    let who = Fixed(Ok(owner()));
    wired(&log, &who, &checkout)
        .answer(&id, Some("A"), None, None)
        .unwrap();
    (log, checkout, id)
}

fn can_ack(
    log: &MemLog,
    checkout: &Checkout,
    id: &str,
    who: fgos_questions::caller::Caller,
) -> bool {
    let who = Fixed(Ok(who));
    match wired(log, &who, checkout).ack(id) {
        Ok(_) => true,
        Err(refusal) => {
            assert_eq!(refusal.code, "not-asker");
            false
        }
    }
}

#[test]
fn the_asker_the_same_head_role_and_for_unroled_or_migrated_questions_any_head_may_ack() {
    let (log, c, id) = closing(head("m-1/a", "head:coder-x"), false);
    assert!(
        !can_ack(&log, &c, &id, head("m-1/z", "head:coder-y")),
        "another head role"
    );
    assert!(
        !can_ack(&log, &c, &id, caller("m-1/q", "q", &[], true)),
        "a stranger"
    );
    assert!(
        can_ack(&log, &c, &id, head("m-1/successor", "head:coder-x")),
        "a successor of the role"
    );

    let (log, c, id) = closing(head("m-1/a", "head:coder-x"), false);
    assert!(
        can_ack(&log, &c, &id, caller("m-1/a", "a", &[], true)),
        "the asker session"
    );

    let (log, c, id) = closing(caller("m-1/w", "w", &["work:tsk-1"], true), false);
    assert!(
        can_ack(&log, &c, &id, head("m-1/any", "head:planner-z")),
        "any head for an asker with no head role"
    );

    let (log, c, id) = closing(head("m-1/a", "head:coder-x"), true);
    assert!(
        can_ack(&log, &c, &id, head("m-1/any", "head:planner-z")),
        "any head for a migrated question"
    );

    let (log, c, id) = closing(caller("m-1/w", "w", &["work:tsk-1"], true), false);
    assert!(
        !can_ack(&log, &c, &id, caller("m-1/q", "q", &["lead:MAIL"], true)),
        "a non-head stranger"
    );
}

#[test]
fn ack_needs_an_answer_and_cancel_needs_open_or_answered() {
    let (log, checkout) = (MemLog::default(), checkout());
    let id = ask_as(
        &log,
        head("m-1/a", "head:coder-x"),
        &checkout,
        &input("plan:p"),
    );
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    let q = wired(&log, &who, &checkout);
    assert_eq!(refused(q.ack(&id)).code, "question-not-open");
    assert_eq!(refused(q.ack("q-nope")).code, "question-unknown");
    assert_eq!(refused(q.cancel(&id, "  ")).code, "parts-incomplete");
    q.cancel(&id, "no longer needed").unwrap();
    assert_eq!(refused(q.cancel(&id, "again")).code, "question-not-open");
    assert_eq!(refused(q.ack(&id)).code, "question-not-open");
    let last = log.events.borrow().last().unwrap().payload.clone();
    assert_eq!(
        (last["by"].as_str(), last["reason"].as_str()),
        (Some("m-1/a-handle"), Some("no longer needed"))
    );

    let (log, c, id) = closing(head("m-1/a", "head:coder-x"), false);
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    let q = wired(&log, &who, &c);
    q.ack(&id).unwrap();
    assert_eq!(refused(q.ack(&id)).code, "question-not-open");
    assert_eq!(refused(q.cancel(&id, "late")).code, "question-not-open");
    let stranger = Fixed(Ok(caller("m-1/q", "q", &[], true)));
    let (log, c, id) = closing(head("m-1/a", "head:coder-x"), false);
    assert_eq!(
        refused(wired(&log, &stranger, &c).cancel(&id, "x")).code,
        "not-asker"
    );
}

#[test]
fn supersede_cancels_the_old_question_naming_the_new_one_and_checks_the_authority_first() {
    let (log, checkout) = (MemLog::default(), checkout());
    let old = ask_as(
        &log,
        head("m-1/a", "head:coder-x"),
        &checkout,
        &input("plan:p"),
    );
    let stranger = Fixed(Ok(caller("m-1/q", "q", &[], true)));
    let mut again = input("plan:p");
    again["supersedes"] = json!(old);
    assert_eq!(
        refused(wired(&log, &stranger, &checkout).ask(&again)).code,
        "not-asker"
    );
    assert_eq!(log.events.borrow().len(), 1, "nothing was written");
    let mut unknown = input("plan:p");
    unknown["supersedes"] = json!("q-zzz");
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    let q = wired(&log, &who, &checkout);
    assert_eq!(refused(q.ask(&unknown)).code, "question-unknown");
    let new = q.ask(&again).unwrap().value;
    let events = log.events.borrow();
    assert_eq!(events.len(), 3);
    assert_eq!(events[1].payload["supersedes"], old);
    assert_eq!(events[2].event_type, "questions.cancelled");
    assert_eq!(events[2].payload["id"], old);
    assert_eq!(events[2].payload["reason"], format!("superseded:{new}"));
}

#[test]
fn list_counts_what_waits_for_the_owner_and_filters_by_state() {
    let (log, checkout) = (MemLog::default(), checkout());
    let a = ask_as(
        &log,
        head("m-1/a", "head:coder-x"),
        &checkout,
        &input("plan:p"),
    );
    let b = ask_as(
        &log,
        head("m-1/a", "head:coder-x"),
        &checkout,
        &input("plan:p"),
    );
    let c = ask_as(
        &log,
        head("m-1/a", "head:coder-x"),
        &checkout,
        &input("plan:p"),
    );
    let owner = Fixed(Ok(owner()));
    wired(&log, &owner, &checkout)
        .answer(&b, Some("A"), None, None)
        .unwrap();
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    wired(&log, &who, &checkout).cancel(&c, "x").unwrap();
    let q = wired(&log, &who, &checkout);
    let ids = |which| {
        q.list(which)
            .unwrap()
            .value
            .questions
            .iter()
            .map(|x| x.asked.id.clone())
            .collect::<Vec<_>>()
    };
    assert_eq!(q.list(Which::Open).unwrap().value.needs_you, 1);
    assert_eq!(ids(Which::Open), vec![a.clone()]);
    assert_eq!(ids(Which::Answered), vec![b.clone()]);
    assert_eq!(ids(Which::All), vec![a, b.clone(), c]);
    assert_eq!(q.show(&b).unwrap().value.state, State::Answered);
    assert_eq!(refused(q.show("q-nope")).code, "question-unknown");
}

#[test]
fn the_view_is_rewritten_after_every_write_and_every_read() {
    let (log, checkout) = (MemLog::default(), checkout());
    let view = checkout.cache.join("questions.json");
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    let q = wired(&log, &who, &checkout);
    let read = || serde_json::from_slice::<Value>(&std::fs::read(&view).unwrap()).unwrap();
    let id = q.ask(&input("plan:p")).unwrap().value;
    assert_eq!(read()["questions"][0]["state"], "open");
    assert_eq!(read()["questions"][0]["asked"]["id"], id);
    let owner = Fixed(Ok(owner()));
    wired(&log, &owner, &checkout)
        .answer(&id, Some("A"), None, None)
        .unwrap();
    assert_eq!(read()["questions"][0]["state"], "answered");
    // A read refreshes it too: an event another machine wrote reaches the view.
    log.events
        .borrow_mut()
        .push(fgos_questions::store::LoggedEvent {
            event_type: "questions.acked".into(),
            payload: json!({ "id": id, "by": "x", "at": "2026-11-18T00:00:00.000Z" }),
        });
    q.list(Which::Open).unwrap();
    assert_eq!(read()["questions"][0]["state"], "acked");
    // The cache directory that cannot be written is a warning, not a failed verb.
    std::fs::remove_dir_all(&checkout.cache).unwrap();
    std::fs::write(&checkout.cache, "a file").unwrap();
    let done = q.list(Which::All).unwrap();
    assert!(done.warning.is_some());
}

#[test]
fn the_events_carry_the_ids_and_authors_the_contract_names() {
    let (log, checkout) = (MemLog::default(), checkout());
    let id = ask_as(
        &log,
        head("m-1/a", "head:coder-x"),
        &checkout,
        &input("plan:p"),
    );
    let owner = Fixed(Ok(owner()));
    wired(&log, &owner, &checkout)
        .answer(&id, Some("A"), None, None)
        .unwrap();
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    wired(&log, &who, &checkout).ack(&id).unwrap();
    let events = log.events.borrow();
    let types: Vec<_> = events.iter().map(|e| e.event_type.as_str()).collect();
    assert_eq!(
        types,
        ["questions.asked", "questions.answered", "questions.acked"]
    );
    assert!(events.iter().all(|e| e.payload["id"] == id));
    assert_eq!(events[2].payload["by"], "m-1/a-handle");
}

#[cfg(not(target_os = "linux"))]
#[test]
fn every_verb_refuses_on_a_platform_the_event_store_does_not_run_on() {
    let (log, checkout) = (MemLog::default(), checkout());
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));
    let q = wired(&log, &who, &checkout);
    for code in [
        refused(q.ask(&input("plan:p"))).code,
        refused(q.list(Which::Open)).code,
        refused(q.show("q-x")).code,
        refused(q.ack("q-x")).code,
    ] {
        assert_eq!(code, "event-store-unsupported-platform");
    }
    assert!(log.events.borrow().is_empty());
}

/// A log that refuses reads after `reads_ok` reads and refuses appends of `refuse_type`.
struct Faulty {
    inner: MemLog,
    reads_ok: std::cell::Cell<usize>,
    refuse_type: &'static str,
}

impl fgos_questions::store::QuestionLog for Faulty {
    fn append(&self, event_type: &str, payload: Value) -> Result<(), fgos_questions::Refusal> {
        if event_type == self.refuse_type {
            return Err(fgos_questions::Refusal::new(
                "event-store-io",
                "append refused",
            ));
        }
        self.inner.append(event_type, payload)
    }

    fn read(&self) -> Result<Vec<fgos_questions::store::LoggedEvent>, fgos_questions::Refusal> {
        match self.reads_ok.get() {
            0 => Err(fgos_questions::Refusal::new(
                "event-store-io",
                "read refused",
            )),
            n => {
                self.reads_ok.set(n - 1);
                self.inner.read()
            }
        }
    }
}

#[test]
fn a_step_failing_after_the_write_is_a_warning_so_a_retry_never_asks_twice() {
    let checkout = checkout();
    let who = Fixed(Ok(head("m-1/a", "head:coder-x")));

    // The re-read after the append fails: the id still comes back, with a warning.
    let log = Faulty {
        inner: MemLog::default(),
        reads_ok: std::cell::Cell::new(1),
        refuse_type: "",
    };
    let done = wired(&log, &who, &checkout).ask(&input("plan:p")).unwrap();
    assert!(done.value.starts_with("q-"));
    assert!(done.warning.unwrap().contains("read refused"));
    assert_eq!(log.inner.events.borrow().len(), 1);

    // The cancel of the superseded question is refused: the new id comes back, the warning names the
    // old question, which stays open.
    let log = Faulty {
        inner: MemLog::default(),
        reads_ok: std::cell::Cell::new(usize::MAX),
        refuse_type: "questions.cancelled",
    };
    let old = wired(&log, &who, &checkout)
        .ask(&input("plan:p"))
        .unwrap()
        .value;
    let mut again = input("plan:p");
    again["supersedes"] = json!(old);
    let done = wired(&log, &who, &checkout).ask(&again).unwrap();
    assert_ne!(done.value, old);
    assert!(done
        .warning
        .unwrap()
        .contains(&format!("{old} is still open")));
    let q = wired(&log, &who, &checkout);
    assert_eq!(q.show(&old).unwrap().value.state, State::Open);
}
