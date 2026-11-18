//! One run of the verbs over a real Event Store in a temp repository, through a test-only adapter of the
//! `QuestionLog` port: the stream is registered by the shipped consumer registry, payloads pass the store's
//! validation, and a second writer's answer folds as a conflict behind the first.
#![cfg(target_os = "linux")]

mod store_support;
use fgos_event_store::{
    append::{append, AppendRequest, EventInput},
    identity::{machine_id, StoreIdentity},
    layout::{Layout, StreamId},
    read::{read, ReadRequest},
    registry::Registry,
};
use fgos_git::{GitDriver, Inspect, ResolveRepo};
use fgos_identity::text::iso_utc_now;
use fgos_questions::record::STREAM;
use fgos_questions::store::{LoggedEvent, QuestionLog};
use fgos_questions::usecase::Which;
use fgos_questions::Refusal;
use serde_json::Value;
use std::path::Path;
use store_support::*;

struct StoreLog {
    driver: GitDriver,
    repo: fgos_git::RepoHandle,
    layout: Layout,
    registry: Registry,
    stream: StreamId,
    machine: String,
    writer: String,
}

fn fault(what: &'static str, e: impl std::fmt::Debug) -> Refusal {
    Refusal::new(what, format!("{e:?}"))
}

/// Lays out what an initialised project has before its first append: the activation fence and the
/// store's 0700 lock directories.
fn prepare_store_dirs(dir: &Path, layout: &Layout) {
    use std::os::unix::fs::PermissionsExt;
    let fence = dir.join(".fgos/locks/activation.lock");
    std::fs::create_dir_all(&fence).unwrap();
    std::fs::write(
        fence.join("TOMBSTONE"),
        "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n",
    )
    .unwrap();
    std::fs::create_dir_all(layout.root.join("locks")).unwrap();
    for p in [layout.common_dir.join("fgos"), layout.root.join("locks")] {
        std::fs::set_permissions(p, std::fs::Permissions::from_mode(0o700)).unwrap();
    }
}

fn open(dir: &Path, writer: &str) -> StoreLog {
    let (state, _) = fgos_holder_lock::state_root();
    let driver = GitDriver::new(&state).unwrap();
    let ResolveRepo::Repository(repo) = driver.resolve_repo(dir, dir).unwrap() else {
        panic!("not a repository");
    };
    let layout = Layout::from_common_dir(Some(repo.common_dir())).unwrap();
    prepare_store_dirs(dir, &layout);
    let configured = driver.machine_id(&repo).unwrap();
    let configured = configured
        .as_ref()
        .map(|f| std::str::from_utf8(&f.value).unwrap());
    let machine = machine_id(configured, &state).unwrap();
    StoreLog {
        driver,
        repo,
        layout,
        registry: Registry::shipped().unwrap(),
        stream: StreamId::parse(STREAM).unwrap(),
        machine,
        writer: writer.into(),
    }
}

impl StoreLog {
    fn read_stream(&self) -> Result<(fgos_event_store::read::ReadResult, String), Refusal> {
        let origin = match std::fs::symlink_metadata(self.layout.store()) {
            Ok(_) => {
                StoreIdentity::open(&self.layout, &self.machine)
                    .map_err(|e| fault("event-store-io", e))?
                    .store_id
            }
            Err(_) => String::new(),
        };
        let result = read(
            &self.driver,
            &self.repo,
            ReadRequest {
                machine: &self.machine,
                layout: &self.layout,
                origin: &origin,
                streams: std::slice::from_ref(&self.stream),
                cursor: &Default::default(),
                folded: &[],
                project: true,
            },
        )
        .map_err(|e| fault("event-store-io", e))?;
        Ok((result, origin))
    }
}

impl QuestionLog for StoreLog {
    fn append(&self, event_type: &str, payload: Value) -> Result<(), Refusal> {
        let (read, origin) = self.read_stream()?;
        let mut cursor = read.cursor.cover;
        cursor.remove(&format!("{origin}:{}", self.stream.as_str()));
        append(
            &self.layout,
            &self.registry,
            AppendRequest {
                stream: &self.stream,
                events: &[EventInput {
                    event_type: event_type.to_owned(),
                    schema_version: 1,
                    payload,
                    ts: iso_utc_now(),
                }],
                cursor: &cursor,
                writer: &self.writer,
                machine: &self.machine,
                held_ranks: &[],
            },
        )
        .map(|_| ())
        .map_err(|e| fault("event-store-io", e))
    }

    fn read(&self) -> Result<Vec<LoggedEvent>, Refusal> {
        Ok(self
            .read_stream()?
            .0
            .sequence
            .into_iter()
            .filter(|e| e.stream == self.stream.as_str())
            .map(|e| LoggedEvent {
                event_type: e.event_type,
                payload: e.payload,
            })
            .collect())
    }
}

#[test]
fn a_question_runs_ask_answer_ack_over_a_real_event_store_and_a_second_writers_answer_is_a_conflict(
) {
    let checkout = checkout();
    let first = open(&checkout.root, "writer-one");
    let second = open(&checkout.root, "writer-two");

    let asker = Fixed(Ok(head("m-1/a", "head:coder-x")));
    let id = wired(&first, &asker, &checkout)
        .ask(&input("plan:p"))
        .unwrap()
        .value;

    // Both writers answer before either has read the other's answer: the second append is made as
    // the owner on the second writer, after the first one's is in the stream, so the fold reads the
    // store's order and shows the later answer as a conflict.
    let owner = Fixed(Ok(owner()));
    wired(&first, &owner, &checkout)
        .answer(&id, Some("A"), None, None)
        .unwrap();
    second
        .append(
            "questions.answered",
            serde_json::json!({ "id": id, "option": "B", "by": "owner", "answeredAt": "2026-11-18T00:00:00.000Z" }),
        )
        .unwrap();

    let view = wired(&second, &asker, &checkout);
    let shown = view.show(&id).unwrap().value;
    assert_eq!(shown.answer.as_ref().unwrap().option.as_deref(), Some("A"));
    assert_eq!(shown.conflicts.len(), 1);
    assert_eq!(shown.conflicts[0].option.as_deref(), Some("B"));
    assert_eq!(view.list(Which::Answered).unwrap().value.questions.len(), 1);

    wired(&first, &asker, &checkout).ack(&id).unwrap();
    assert_eq!(
        wired(&second, &asker, &checkout)
            .list(Which::Open)
            .unwrap()
            .value
            .needs_you,
        0
    );
    assert!(checkout.cache.join("questions.json").is_file());
}
