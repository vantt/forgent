//! The record write door: write and read back, idempotent ids, counted refusals, the lock bound against a real
//! holder process, health counted across processes, torn-tail healing, and fail-open on a broken registry. Fixtures
//! carry fixed timestamps.

use fgos_observe::contract::{RecordSource, Window};
use fgos_observe::record::registry::{EmbeddedDeclaration, Registry};
use fgos_observe::record::store::{
    HealthSource, RecordStoreSource, HEALTH_DECLARATION, HEALTH_KIND,
};
use fgos_observe::record::types::{AttrValue, Record, Redaction};
use fgos_observe::record::{RecordDoor, WriteOutcome};
use fgos_observe::shard::shard_path;
use fgos_observe::store_lock::acquire_store_lock_within;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

const ROLE: &str = "STORE_TEST_ROLE";
const ROOT: &str = "STORE_TEST_ROOT";
const READY: &str = "STORE_TEST_READY";
const WRITES: &str = "STORE_TEST_WRITES";

const EMBEDDED_RUN: EmbeddedDeclaration = EmbeddedDeclaration {
    label: "fixture-run",
    json: include_str!("../../../../test/fixtures/observe/record/declarations/embedded-run.json"),
};

fn fixture(name: &str) -> Record {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../test/fixtures/observe/record/records")
        .join(name);
    serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap()
}

fn run_attempt(id: &str) -> Record {
    let mut record = fixture("run-attempt.json");
    record.id = id.to_owned();
    record
}

fn temp_root(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!(
        "fgos-observe-store-{tag}-{}-{nanos}",
        std::process::id()
    ));
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn door(root: &Path) -> RecordDoor {
    RecordDoor::new(root.to_path_buf(), vec![EMBEDDED_RUN], None)
}

fn all() -> Window {
    Window::default()
}

fn health(root: &Path) -> Record {
    let mut records = HealthSource.records(root, &all()).unwrap();
    assert_eq!(records.len(), 1);
    let record = records.remove(0);
    assert_eq!(record.kind, HEALTH_KIND);
    Registry::from_embedded(&[HEALTH_DECLARATION])
        .unwrap()
        .validate(&record)
        .expect("a health record validates against its embedded declaration");
    record
}

fn counter(record: &Record, name: &str) -> i64 {
    let key = format!("fgos.observe.health.{name}");
    record
        .measures
        .get(&key)
        .and_then(serde_json::Number::as_i64)
        .unwrap_or_else(|| panic!("{key} is not a counter: {:?}", record.measures))
}

/// Role body for the child processes; does nothing in an ordinary run. `hold`: take the observe lock, report ready
/// and keep it until killed. `write`: write `WRITES` records with random ids.
#[test]
fn child_entry() {
    let Ok(role) = std::env::var(ROLE) else {
        return;
    };
    let root = PathBuf::from(std::env::var(ROOT).unwrap());
    match role.as_str() {
        "hold" => {
            let _guard = acquire_store_lock_within(&root, Duration::from_secs(20)).unwrap();
            fs::write(std::env::var(READY).unwrap(), "held\n").unwrap();
            loop {
                std::thread::sleep(Duration::from_secs(3600));
            }
        }
        "write" => {
            let writes: usize = std::env::var(WRITES).unwrap().parse().unwrap();
            let door = door(&root).with_lock_wait(Duration::from_secs(20));
            for _ in 0..writes {
                assert_eq!(door.write(run_attempt("")), WriteOutcome::Written);
            }
        }
        other => panic!("unknown role {other}"),
    }
}

fn child(role: &str, root: &Path) -> Command {
    let mut command = Command::new(std::env::current_exe().unwrap());
    command
        .args([
            "--exact",
            "child_entry",
            "--nocapture",
            "--test-threads",
            "1",
        ])
        .env(ROLE, role)
        .env(ROOT, root)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::inherit());
    command
}

struct Reaped(Child);

impl Drop for Reaped {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

#[test]
fn a_written_record_reads_back_in_the_same_window_and_not_outside_it() {
    let root = temp_root("roundtrip");
    assert_eq!(door(&root).write(run_attempt("a-1")), WriteOutcome::Written);

    let inside = Window {
        since: Some("2026-11-18T00:00:00Z".into()),
        until: Some("2026-11-19T00:00:00Z".into()),
    };
    let read = RecordStoreSource.records(&root, &inside).unwrap();
    assert_eq!(read.len(), 1);
    assert_eq!(read[0], run_attempt("a-1"));

    let outside = Window {
        since: Some("2026-11-19T00:00:00Z".into()),
        until: None,
    };
    assert!(RecordStoreSource
        .records(&root, &outside)
        .unwrap()
        .is_empty());
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn a_duplicate_id_is_accepted_and_ignored_and_a_missing_id_gets_a_random_one() {
    let root = temp_root("ids");
    let door = door(&root);
    assert_eq!(door.write(run_attempt("same")), WriteOutcome::Written);
    assert_eq!(door.write(run_attempt("same")), WriteOutcome::Duplicate);
    assert_eq!(door.write(run_attempt("")), WriteOutcome::Written);
    assert_eq!(door.write(run_attempt("")), WriteOutcome::Written);

    let read = RecordStoreSource.records(&root, &all()).unwrap();
    assert_eq!(read.len(), 3);
    let random: Vec<_> = read.iter().filter(|r| r.id != "same").collect();
    assert!(random.iter().all(|r| !r.id.is_empty()));
    assert_ne!(random[0].id, random[1].id);

    let h = health(&root);
    assert_eq!(
        (
            counter(&h, "accepted"),
            counter(&h, "written"),
            counter(&h, "duplicates"),
            counter(&h, "rejected"),
            counter(&h, "errors")
        ),
        (4, 3, 1, 0, 0)
    );
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn a_batch_under_a_lock_the_caller_holds_gets_the_same_checks_and_counts_without_waiting_on_itself()
{
    let root = temp_root("batch");
    let door = door(&root).with_lock_wait(Duration::from_millis(50));
    assert_eq!(door.write(run_attempt("stored")), WriteOutcome::Written);
    let mut refused = run_attempt("refused");
    refused.redaction = None;
    let held = acquire_store_lock_within(&root, Duration::from_secs(5)).unwrap();
    let outcomes = door.write_all_held(
        &held,
        vec![
            run_attempt("a"),
            run_attempt("stored"),
            run_attempt("a"),
            refused,
            run_attempt(""),
        ],
    );
    drop(held);
    assert_eq!(
        outcomes[..3],
        [
            WriteOutcome::Written,
            WriteOutcome::Duplicate,
            WriteOutcome::Duplicate
        ]
    );
    assert!(
        matches!(outcomes[3], WriteOutcome::Rejected(_)),
        "{outcomes:?}"
    );
    assert_eq!(outcomes[4], WriteOutcome::Written);
    assert_eq!(RecordStoreSource.records(&root, &all()).unwrap().len(), 3);
    let h = health(&root);
    assert_eq!(
        (
            counter(&h, "accepted"),
            counter(&h, "written"),
            counter(&h, "duplicates"),
            counter(&h, "rejected"),
            counter(&h, "errors")
        ),
        (6, 3, 2, 1, 0)
    );
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn a_refused_record_raises_rejected_and_never_errors_and_is_not_stored() {
    let root = temp_root("refused");
    let door = door(&root);
    let mut unknown = run_attempt("u");
    unknown.kind = "no.such.kind".into();
    assert!(matches!(door.write(unknown), WriteOutcome::Rejected(_)));

    let mut unstamped = run_attempt("d");
    unstamped.redaction = None;
    match door.write(unstamped) {
        WriteOutcome::Rejected(why) => assert!(why.contains("redaction"), "{why}"),
        other => panic!("{other:?}"),
    }
    let mut stamped = run_attempt("d2");
    stamped.redaction = Some(Redaction { rev: "r1".into() });
    assert_eq!(door.write(stamped), WriteOutcome::Written);

    let h = health(&root);
    assert_eq!((counter(&h, "rejected"), counter(&h, "written")), (2, 1));
    assert!(matches!(
        h.attrs.get("fgos.observe.health.last_error"),
        Some(AttrValue::Str(_))
    ));
    assert_eq!(RecordStoreSource.records(&root, &all()).unwrap().len(), 1);
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn a_write_while_another_process_holds_the_lock_returns_within_the_bound_with_errors_raised() {
    let root = temp_root("lock");
    let ready = root.join("ready");
    let mut holder = Reaped(child("hold", &root).env(READY, &ready).spawn().unwrap());
    let deadline = Instant::now() + Duration::from_secs(30);
    while !ready.exists() {
        assert!(holder.0.try_wait().unwrap().is_none(), "holder died");
        assert!(Instant::now() < deadline, "holder never ready");
        std::thread::sleep(Duration::from_millis(5));
    }

    let bound = Duration::from_millis(300);
    let started = Instant::now();
    let door = door(&root).with_lock_wait(bound);
    let outcome = door.write(run_attempt("held"));
    let took = started.elapsed();
    assert!(matches!(outcome, WriteOutcome::Failed(_)), "{outcome:?}");
    assert!(took < bound + Duration::from_secs(2), "{took:?}");

    assert!(HealthSource.records(&root, &all()).unwrap().is_empty());
    assert!(RecordStoreSource.records(&root, &all()).unwrap().is_empty());

    // The count of the dropped write waits for the lock and lands with the next write that holds it.
    drop(holder);
    assert_eq!(door.write(run_attempt("after")), WriteOutcome::Written);
    let h = health(&root);
    assert_eq!(
        (
            counter(&h, "accepted"),
            counter(&h, "errors"),
            counter(&h, "written")
        ),
        (2, 1, 1)
    );
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn a_torn_tail_is_healed_and_the_next_record_lands_on_its_own_line() {
    let root = temp_root("torn");
    let shard = shard_path(&root, "records").unwrap();
    fs::write(&shard, "{\"id\":\"torn\",\"kin").unwrap();

    assert_eq!(
        door(&root).write(run_attempt("after")),
        WriteOutcome::Written
    );
    let read = RecordStoreSource.records(&root, &all()).unwrap();
    assert_eq!(read.len(), 1);
    assert_eq!(read[0].id, "after");
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn a_broken_project_declaration_is_counted_and_dropped_without_an_error() {
    let root = temp_root("registry");
    let kinds = root.join(".fgos/observe/kinds");
    fs::create_dir_all(&kinds).unwrap();
    fs::write(kinds.join("bad.json"), "{ not json").unwrap();

    match door(&root).write(run_attempt("x")) {
        WriteOutcome::Failed(why) => assert!(why.contains("registry"), "{why}"),
        other => panic!("{other:?}"),
    }
    let h = health(&root);
    assert_eq!((counter(&h, "errors"), counter(&h, "written")), (1, 0));
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn a_duplicate_is_seen_across_two_doors_on_one_shard_in_either_direction() {
    let root = temp_root("two-doors");
    let (first, second) = (door(&root), door(&root));
    assert_eq!(first.write(run_attempt("d")), WriteOutcome::Written);
    assert_eq!(second.write(run_attempt("d")), WriteOutcome::Duplicate);
    // `first` has read past its own line; it still sees what `second` appended after it.
    assert_eq!(second.write(run_attempt("e")), WriteOutcome::Written);
    assert_eq!(first.write(run_attempt("e")), WriteOutcome::Duplicate);
    assert_eq!(RecordStoreSource.records(&root, &all()).unwrap().len(), 2);
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn a_later_write_reads_only_bytes_appended_since_the_last_one() {
    let root = temp_root("offset");
    let door = door(&root);
    assert_eq!(door.write(run_attempt("aa-1")), WriteOutcome::Written);

    // Rewrite the stored id in place, same length. A door that re-read earlier bytes would now see "bb-1".
    let shard = shard_path(&root, "records").unwrap();
    let text = fs::read_to_string(&shard).unwrap();
    assert!(text.contains("\"id\":\"aa-1\""));
    fs::write(&shard, text.replace("\"id\":\"aa-1\"", "\"id\":\"bb-1\"")).unwrap();

    assert_eq!(door.write(run_attempt("bb-1")), WriteOutcome::Written);
    // A fresh door reads the shard from its start and does see it.
    let fresh = self::door(&root);
    assert_eq!(fresh.write(run_attempt("bb-1")), WriteOutcome::Duplicate);
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn writer_processes_sharing_one_health_file_lose_no_count() {
    let root = temp_root("health-procs");
    const PROCESSES: usize = 4;
    const EACH: usize = 15;
    let mut children: Vec<Reaped> = (0..PROCESSES)
        .map(|_| {
            Reaped(
                child("write", &root)
                    .env("FGOS_SESSION_ID", "store-test-shared-writer")
                    .env(WRITES, EACH.to_string())
                    .spawn()
                    .unwrap(),
            )
        })
        .collect();
    for child in &mut children {
        assert!(child.0.wait().unwrap().success(), "writer child failed");
    }

    let h = health(&root);
    let total = i64::try_from(PROCESSES * EACH).unwrap();
    assert_eq!(h.subject.id, "store-test-shared-writer");
    assert_eq!(
        (counter(&h, "accepted"), counter(&h, "written")),
        (total, total)
    );
    assert_eq!(
        RecordStoreSource.records(&root, &all()).unwrap().len(),
        PROCESSES * EACH
    );
    let _ = fs::remove_dir_all(&root);
}
