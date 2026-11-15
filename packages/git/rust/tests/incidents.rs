#![cfg(all(target_os = "linux", target_arch = "x86_64"))]
// The open-incident model of one repository, over real repositories and a real interrupted Land: what `status` says
// of each part, that reading changes nothing, that `recover` settles an operation once, and that a part which cannot
// be read answers in place without hiding the others. The wiring over this model (the host verb, the addon, the
// init adapter) proves only that it carries these answers.
#![allow(dead_code)] // the shared fixture serves other test files too
include!("support/land.rs");
use fgos_git::incidents::{read_git_status, recover_git_operations};
use serde_json::{json, Value};

const WRITER: &str = "fixture";

fn writer(_fgos_dir: &Path) -> String {
    WRITER.to_owned()
}

fn status(f: &Fixture) -> Value {
    serde_json::to_value(read_git_status(&f.temp.join("state"), &f.main)).unwrap()
}

fn recover(f: &Fixture) -> Value {
    serde_json::to_value(recover_git_operations(&f.temp.join("state"), &f.main, &writer).unwrap())
        .unwrap()
}

fn interrupt_land(f: &Fixture, id: &str) {
    let session = f
        .driver
        .prepare_land(
            &f.repo,
            vec![],
            &f.request,
            WRITER,
            id,
            &wal::OsFileSystem,
            0,
        )
        .unwrap();
    drop(session);
}

#[test]
fn a_clean_repository_reads_empty_in_every_part() {
    let f = Fixture::new();
    let status = status(&f);
    assert_eq!(status["repository"]["notARepository"], json!(false));
    assert_eq!(status["journal"]["initialized"], json!(false));
    assert_eq!(status["journal"]["pendingCount"], json!(0));
    assert_eq!(status["pendingOperations"], json!([]));
    assert_eq!(
        status["retainedLand"],
        json!({"candidates": [], "complete": true})
    );
    assert_eq!(status["worktrees"]["issues"], json!([]));
    assert_eq!(status["worktrees"]["pendingOperations"], json!([]));
    assert_eq!(status["nativeLocks"], json!([]));
    assert_eq!(status["mergeInProgress"], Value::Null);
}

#[test]
fn a_status_keeps_the_order_of_its_parts() {
    let f = Fixture::new();
    let text = serde_json::to_string(&read_git_status(&f.temp.join("state"), &f.main)).unwrap();
    let positions: Vec<usize> = [
        "\"repository\"",
        "\"journal\"",
        "\"pendingOperations\"",
        "\"retainedLand\"",
        "\"worktrees\"",
        "\"nativeLocks\"",
        "\"mergeInProgress\"",
    ]
    .iter()
    .map(|key| text.find(key).unwrap())
    .collect();
    assert!(positions.windows(2).all(|pair| pair[0] < pair[1]), "{text}");
}

#[test]
fn a_native_lock_and_a_merge_in_progress_are_read_from_the_repository() {
    let f = Fixture::new();
    fs::write(f.main.join(".git/index.lock"), "").unwrap();
    fs::write(
        f.main.join(".git/MERGE_HEAD"),
        format!("{}\n", f.request.target),
    )
    .unwrap();
    let status = status(&f);
    assert_eq!(status["nativeLocks"], json!(["index.lock"]));
    assert_eq!(status["mergeInProgress"], json!(f.request.target));
    // Recovery names the command that ends the merge and never runs it.
    let recovered = recover(&f);
    assert_eq!(recovered["mergeInProgress"], json!(f.request.target));
    assert_eq!(
        recovered["next"],
        json!(format!(
            "fgos main-checkout-reset --sha {} --confirm",
            f.request.target
        ))
    );
}

#[test]
fn outside_a_repository_status_says_so_and_recovery_finds_nothing_and_points_nowhere() {
    let outside =
        std::env::temp_dir().join(format!("fgos-incidents-outside-{}", std::process::id()));
    fs::create_dir_all(&outside).unwrap();
    let state = outside.join("state");
    let status = serde_json::to_value(read_git_status(&state, &outside)).unwrap();
    let recovered =
        serde_json::to_value(recover_git_operations(&state, &outside, &writer).unwrap()).unwrap();
    fs::remove_dir_all(&outside).unwrap();
    assert_eq!(status, json!({"repository": {"notARepository": true}}));
    assert_eq!(
        recovered,
        json!({
            "recovered": [],
            "kept": [],
            "message": "no interrupted Land, ScopedCommit or remote transfer operation"
        })
    );
}

#[test]
fn status_lists_an_interrupted_land_and_changes_nothing_and_recovery_settles_it_once() {
    let f = Fixture::new();
    interrupt_land(&f, "wired-land");
    let first = status(&f);
    assert_eq!(
        first["pendingOperations"],
        json!([{"operationId": "wired-land", "kind": "Land", "writer": WRITER}])
    );
    assert_eq!(first["journal"]["pendingCount"], json!(1));
    assert_eq!(
        status(&f)["journal"]["pendingCount"],
        json!(1),
        "status changes nothing"
    );

    let recovered = recover(&f);
    assert_eq!(recovered["recovered"], json!(["wired-land"]), "{recovered}");
    assert_eq!(recovered["kept"], json!([]));
    assert_eq!(
        recovered["message"],
        json!("recovered interrupted Git operations: wired-land")
    );
    assert_eq!(
        recover(&f)["recovered"],
        json!([]),
        "a second recovery has nothing left"
    );

    let settled = status(&f);
    assert_eq!(settled["journal"]["pendingCount"], json!(0));
    // The Land chain and its candidate worktree's own chain are both finished and retained.
    assert_eq!(settled["journal"]["retention"]["retainedChains"], json!(2));
    assert!(settled["journal"]["retention"]["oldestRetainedAtMs"].is_u64());
    // The finished Land still holds its candidate: it is listed with the pins it keeps, and fails nothing.
    let candidates = settled["retainedLand"]["candidates"].as_array().unwrap();
    assert_eq!(candidates.len(), 1, "{settled}");
    assert_eq!(candidates[0]["operationId"], json!("wired-land"));
    let mut pins: Vec<&str> = candidates[0]["pins"]
        .as_array()
        .unwrap()
        .iter()
        .map(|pin| pin.as_str().unwrap())
        .collect();
    pins.sort_unstable();
    assert_eq!(
        pins,
        [
            "refs/fgos/git-operations/wired-land/candidate",
            "refs/fgos/git-operations/wired-land/source/candidate",
            "refs/fgos/git-operations/wired-land/target/candidate"
        ]
    );
}

#[test]
fn a_part_that_cannot_be_read_answers_an_error_in_place_and_hides_no_other_part() {
    let f = Fixture::new();
    interrupt_land(&f, "damaged-land");
    // One record of the interrupted operation no longer parses: the journal still says so, the listings that
    // must read every record refuse, and the parts that read something else are unaffected.
    let operation = f.main.join(".git/fgos/git/operations/damaged-land");
    let record = fs::read_dir(&operation)
        .unwrap()
        .map(|entry| entry.unwrap().path())
        .find(|path| path.is_file())
        .expect("the operation directory holds its records");
    fs::write(&record, b"{ torn").unwrap();
    let status = status(&f);
    assert_eq!(status["journal"]["initialized"], json!(true));
    assert!(
        status["journal"]["errors"]
            .as_array()
            .is_some_and(|errors| !errors.is_empty()),
        "{status}"
    );
    assert!(status["pendingOperations"]["error"].is_string(), "{status}");
    assert!(status["retainedLand"]["error"].is_string(), "{status}");
    assert_eq!(status["nativeLocks"], json!([]));
    assert_eq!(status["repository"]["notARepository"], json!(false));
}

#[test]
fn a_status_that_cannot_open_the_repository_answers_every_part_in_place_with_no_merge_pointer() {
    let f = Fixture::new();
    // A state root that is a file, not a directory: the driver cannot be built.
    let blocked = f.temp.join("blocked");
    fs::write(&blocked, b"x").unwrap();
    let status = serde_json::to_value(read_git_status(&blocked, &f.main)).unwrap();
    for part in [
        "repository",
        "journal",
        "pendingOperations",
        "retainedLand",
        "worktrees",
        "nativeLocks",
    ] {
        assert!(status[part]["error"].is_string(), "{part}: {status}");
    }
    assert_eq!(status["mergeInProgress"], Value::Null);
}
