//! The fold over a read in the store's order (including two machines answering before they sync) and the
//! Observe record source over it.

use fgos_observe::contract::{RecordSource, Window};
use fgos_questions::record::{ACKED, ANSWERED, ASKED, CANCELLED, OBSERVE_KINDS};
use fgos_questions::source::{project, QuestionSource};
use fgos_questions::store::{fold, LogOpener, LoggedEvent, QuestionLog, State};
use fgos_questions::Refusal;
use serde_json::{json, Value};
use std::path::Path;

fn ev(event_type: &str, payload: Value) -> LoggedEvent {
    LoggedEvent {
        event_type: event_type.into(),
        payload,
    }
}

fn asked(id: &str) -> LoggedEvent {
    ev(
        ASKED,
        json!({
            "id": id, "askedAt": "2026-11-18T01:00:00.000Z",
            "asker": { "sessionId": "m-1/a", "handle": "a-handle", "roles": ["head:coder-x", "work:tsk-1"], "persona": "coder", "pane": "p1", "machine": "m-1" },
            "stage": "planning", "ref": { "value": "plan:p", "branch": "work", "commit": "abcdef1" },
            "headline": "h", "blocks": "b",
            "parts": { "what": "w", "cause": "c", "options": [], "recommendation": "", "scope": { "allows": "x", "forbids": "y" } },
            "migrated": false
        }),
    )
}

fn answered(id: &str, text: &str, at: &str) -> LoggedEvent {
    ev(
        ANSWERED,
        json!({ "id": id, "text": text, "by": "owner", "via": "secretary", "answeredAt": at }),
    )
}

#[test]
fn the_first_answer_in_the_stores_order_wins_and_the_other_is_a_conflict_whatever_the_clocks_say() {
    // Machine B's answer is first in the store's order though A's answeredAt is earlier.
    let events = vec![
        asked("q-a1"),
        answered("q-a1", "from B", "2026-11-18T03:00:00.000Z"),
        answered("q-a1", "from A", "2026-11-18T02:00:00.000Z"),
    ];
    let folded = fold(&events);
    let q = folded.get("q-a1").unwrap();
    assert_eq!(q.state, State::Answered);
    assert_eq!(q.answer.as_ref().unwrap().text.as_deref(), Some("from B"));
    assert_eq!(q.conflicts.len(), 1);
    assert_eq!(q.conflicts[0].text.as_deref(), Some("from A"));
}

#[test]
fn a_record_that_does_not_fit_the_state_is_ignored_by_the_fold() {
    let at = "2026-11-18T04:00:00.000Z";
    let events = vec![
        ev(ACKED, json!({ "id": "q-a1", "by": "x", "at": at })), // before the ask
        answered("q-a1", "early", at),                           // before the ask
        asked("q-a1"),
        ev(ACKED, json!({ "id": "q-a1", "by": "x", "at": at })), // not answered yet
        ev(
            CANCELLED,
            json!({ "id": "q-a1", "by": "x", "reason": "r", "at": at }),
        ),
        answered("q-a1", "late", at), // cancelled
        ev(ACKED, json!({ "id": "q-a1", "by": "x", "at": at })),
        ev("question.unknown", json!({})),
        ev(ASKED, json!({ "id": "q-bad" })),
    ];
    let folded = fold(&events);
    let q = folded.get("q-a1").unwrap();
    assert_eq!(q.state, State::Cancelled);
    assert!(q.answer.is_none() && q.acked.is_none() && q.conflicts.is_empty());
    assert!(folded.get("q-bad").is_none());
    assert_eq!(folded.questions().count(), 1);
}

#[test]
fn the_source_projects_one_record_per_event_with_the_declared_kinds_and_attrs() {
    let at = "2026-11-18T05:00:00.000Z";
    let events = vec![
        asked("q-a1"),
        answered("q-a1", "yes", at),
        ev(ACKED, json!({ "id": "q-a1", "by": "a-handle", "at": at })),
        asked("q-b2"),
        ev(
            CANCELLED,
            json!({ "id": "q-b2", "by": "a-handle", "reason": "superseded:q-c3", "at": at }),
        ),
    ];
    let records = project(&events);
    let ids: Vec<_> = records.iter().map(|r| r.id.as_str()).collect();
    assert_eq!(
        ids,
        [
            "q-a1:asked",
            "q-a1:answered",
            "q-a1:acked",
            "q-b2:asked",
            "q-b2:cancelled"
        ]
    );
    let declared: Value = serde_json::from_str(OBSERVE_KINDS).unwrap();
    for record in &records {
        assert_eq!(record.subject.kind, "question");
        let kind = &declared["kinds"][&record.kind];
        assert!(kind.is_object(), "{} is declared", record.kind);
        let allowed: Vec<&str> = kind["attrs"]
            .as_array()
            .unwrap()
            .iter()
            .filter_map(Value::as_str)
            .collect();
        for attr in record.attrs.keys() {
            assert!(
                allowed.contains(&attr.as_str()),
                "{} may carry {attr}",
                record.kind
            );
        }
    }
    let answered = &records[1];
    let text = |name: &str| match &answered.attrs[name] {
        fgos_observe::record::types::AttrValue::Str(s) => s.clone(),
        other => panic!("{other:?}"),
    };
    assert_eq!(text("fgos.question.asker.role"), "head:coder-x");
    assert_eq!(text("fgos.question.asker.machine"), "m-1");
    assert_eq!(text("fgos.question.origin_ref"), "plan:p");
    assert_eq!(text("fgos.question.via"), "secretary");
    assert_eq!(text("fgos.question.by"), "owner");
    assert_eq!(answered.ts, at);
}

struct Opener(Vec<LoggedEvent>);
struct Fixedlog(Vec<LoggedEvent>);

impl QuestionLog for Fixedlog {
    fn append(&self, _: &str, _: Value) -> Result<(), Refusal> {
        unreachable!("the source never writes")
    }
    fn read(&self) -> Result<Vec<LoggedEvent>, Refusal> {
        Ok(self.0.clone())
    }
}

impl LogOpener for Opener {
    fn open(&self, _: &Path) -> Result<Option<Box<dyn QuestionLog>>, Refusal> {
        Ok(Some(Box::new(Fixedlog(self.0.clone()))))
    }
}

#[test]
fn the_source_reads_the_store_through_its_opener_and_keeps_the_records_inside_the_window() {
    let source = QuestionSource::new(Box::new(Opener(vec![
        asked("q-a1"),
        answered("q-a1", "yes", "2026-11-18T09:00:00.000Z"),
    ])));
    let all = source.records(Path::new("."), &Window::default()).unwrap();
    assert_eq!(all.len(), 2);
    let window = Window {
        since: Some("2026-11-18T08:00:00.000Z".into()),
        until: None,
    };
    let late = source.records(Path::new("."), &window).unwrap();
    assert_eq!(
        late.iter().map(|r| r.id.as_str()).collect::<Vec<_>>(),
        ["q-a1:answered"]
    );
    for kind in source.kinds() {
        assert!(OBSERVE_KINDS.contains(kind));
    }
}
