//! The shipped `question-answered` definition run through the Observe definition runner over the question
//! record source: answered questions that were neither acknowledged nor cancelled, with the attrs the watcher reads.

use fgos_observe::metrics_cli::query::dispatch_query;
use fgos_observe::metrics_cli::RecordEnvironment;
use fgos_observe::record::registry::EmbeddedDeclaration;
use fgos_observe::{ObserveRequest, RecordSource};
use fgos_questions::source::{declaration, QuestionSource};
use fgos_questions::store::{LogOpener, LoggedEvent, QuestionLog};
use fgos_questions::Refusal;
use serde_json::Value;
use std::path::{Path, PathBuf};

fn repo_file(relative: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .join(relative)
}

struct Fixed(Vec<LoggedEvent>);
struct FixedLog(Vec<LoggedEvent>);

impl QuestionLog for FixedLog {
    fn append(&self, _: &str, _: Value) -> Result<(), Refusal> {
        unreachable!("the source never writes")
    }
    fn read(&self) -> Result<Vec<LoggedEvent>, Refusal> {
        Ok(self.0.clone())
    }
}

impl LogOpener for Fixed {
    fn open(&self, _: &Path) -> Result<Option<Box<dyn QuestionLog>>, Refusal> {
        Ok(Some(Box::new(FixedLog(self.0.clone()))))
    }
}

struct Env(Vec<LoggedEvent>);

impl RecordEnvironment for Env {
    fn embedded_declarations(&self) -> Vec<EmbeddedDeclaration> {
        vec![EmbeddedDeclaration {
            label: "fgos-questions",
            json: declaration(),
        }]
    }
    fn payload_root(&self) -> Option<PathBuf> {
        None
    }
    fn record_sources(&self) -> Vec<Box<dyn RecordSource>> {
        vec![Box::new(QuestionSource::new(Box::new(Fixed(
            self.0.clone(),
        ))))]
    }
    fn config_number(&self, _: &Path, _: &str) -> Result<Option<f64>, String> {
        Ok(None)
    }
}

fn run() -> (Value, Value) {
    let fixture: Value = serde_json::from_str(
        &std::fs::read_to_string(repo_file("test/fixtures/questions/answered-fold.json")).unwrap(),
    )
    .unwrap();
    let events = fixture["events"]
        .as_array()
        .unwrap()
        .iter()
        .map(|e| LoggedEvent {
            event_type: e["event_type"].as_str().unwrap().to_owned(),
            payload: e["payload"].clone(),
        })
        .collect();
    let root = std::env::temp_dir().join(format!(
        "fgos-question-def-{}-{:?}",
        std::process::id(),
        std::thread::current().id()
    ));
    std::fs::create_dir_all(&root).unwrap();
    let definition = repo_file("core/questions/definitions/question-answered.query.json");
    let request = ObserveRequest {
        operation: "observe.metrics".to_owned(),
        sub: "query".to_owned(),
        args: vec![
            "--def".into(),
            definition.to_str().unwrap().into(),
            "--now".into(),
            fixture["now"].as_str().unwrap().into(),
        ],
        root: root.clone(),
        stdin: None,
    };
    let all = dispatch_query(&request, &Env(events)).unwrap();
    let _ = std::fs::remove_dir_all(&root);
    (all, fixture["expectedAnswered"].clone())
}

#[test]
fn the_definition_returns_only_answered_questions_that_are_neither_acked_nor_cancelled() {
    let (all, expected) = run();
    let answer = &all["definitions"][0];
    assert_eq!(answer["name"], "question-answered");
    assert!(answer["unmeasured"].is_null(), "{answer}");
    assert!(answer["error"].is_null(), "{answer}");
    let rows = answer["rows"].as_array().unwrap();
    let ids: Vec<&str> = rows
        .iter()
        .map(|r| r["group"]["subject.id"].as_str().unwrap())
        .collect();
    let want: Vec<&str> = expected
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap())
        .collect();
    assert_eq!(
        ids, want,
        "acked, cancelled and merely open questions are excluded"
    );
}

#[test]
fn each_row_carries_the_attrs_the_watcher_needs() {
    let (all, _) = run();
    let row = &all["definitions"][0]["rows"][0];
    let group = &row["group"];
    assert_eq!(group["subject.id"], "q-pending-1");
    assert_eq!(group["fgos.question.asker.role"], "head:coder-x");
    assert_eq!(group["fgos.question.asker.session"], "m-1/s1");
    assert_eq!(group["fgos.question.asker.handle"], "h1");
    assert_eq!(group["fgos.question.asker.persona"], "coder");
    assert_eq!(group["fgos.question.origin_ref"], "plan:p1");
    assert_eq!(
        group["fgos.question.answered_at"],
        "2026-11-18T02:01:00.000Z"
    );
    assert_eq!(group["fgos.question.asker.pane"], "p1");
    assert_eq!(group["fgos.question.asker.machine"], "m-1");

    // An asker with no role, persona or pane still gets its row, with those attrs empty.
    let bare = &all["definitions"][0]["rows"][1]["group"];
    assert_eq!(bare["subject.id"], "q-pending-2");
    assert_eq!(bare["fgos.question.asker.role"], "");
    assert_eq!(bare["fgos.question.asker.persona"], "");
    assert_eq!(bare["fgos.question.asker.pane"], "");
    assert_eq!(bare["fgos.question.asker.session"], "m-1/s4");
}
