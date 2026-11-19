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
    recover_proving(f, &|_| false)
}

/// Recovery where `dead` is the proof that a writer session is gone.
fn recover_proving(f: &Fixture, dead: &dyn Fn(&str) -> bool) -> Value {
    serde_json::to_value(
        recover_git_operations(&f.temp.join("state"), &f.main, &writer, dead).unwrap(),
    )
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
    let recovered = serde_json::to_value(
        recover_git_operations(&state, &outside, &writer, &|_| false).unwrap(),
    )
    .unwrap();
    fs::remove_dir_all(&outside).unwrap();
    assert_eq!(status, json!({"repository": {"notARepository": true}}));
    assert_eq!(
        recovered,
        json!({
            "recovered": [],
            "freed": [],
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
        first["retainedLand"]["candidates"],
        json!([]),
        "a pending chain is not a retained one"
    );
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
        json!(
            "recovered interrupted Git operations: wired-land; released retained Land candidates: wired-land"
        )
    );
    assert_eq!(
        recover(&f)["recovered"],
        json!([]),
        "a second recovery has nothing left"
    );

    let settled = status(&f);
    assert_eq!(settled["journal"]["pendingCount"], json!(0));
    // The finished Land's candidate was the caller's own, so the same pass released it.
    assert_eq!(recovered["freed"], json!(["wired-land"]), "{recovered}");
    assert_eq!(
        settled["retainedLand"]["candidates"],
        json!([]),
        "{settled}"
    );
}

/// A Land `writer` started under `id` and dropped before publishing: pending, candidate held.
fn interrupt_land_as(f: &Fixture, id: &str, writer: &str) -> PathBuf {
    let session = f
        .driver
        .prepare_land(
            &f.repo,
            vec![],
            &f.request,
            writer,
            id,
            &wal::OsFileSystem,
            0,
        )
        .unwrap();
    session.candidate().unwrap().worktree.clone()
}

fn retained_ids(f: &Fixture) -> Vec<String> {
    status(f)["retainedLand"]["candidates"]
        .as_array()
        .unwrap()
        .iter()
        .map(|c| c["operationId"].as_str().unwrap().to_owned())
        .collect()
}

#[test]
fn recovery_releases_the_callers_retained_land_and_only_names_another_writers() {
    let f = Fixture::new();
    let own = interrupt_land_as(&f, "own-retained", WRITER);
    f.driver
        .recover_land(&f.repo, vec![], WRITER, "own-retained")
        .unwrap();
    let other = interrupt_land_as(&f, "other-retained", "someone-else");
    f.driver
        .recover_land(&f.repo, vec![], "someone-else", "other-retained")
        .unwrap();
    assert_eq!(
        retained_ids(&f).len(),
        2,
        "two finished chains hold a candidate"
    );

    let recovered = recover(&f);
    assert_eq!(recovered["freed"], json!(["own-retained"]), "{recovered}");
    assert!(!own.exists(), "own candidate worktree is removed");
    assert!(other.exists(), "another writer's candidate is untouched");
    let kept: Vec<(&str, &str)> = recovered["kept"]
        .as_array()
        .unwrap()
        .iter()
        .map(|k| {
            (
                k["operationId"].as_str().unwrap(),
                k["writer"].as_str().unwrap(),
            )
        })
        .collect();
    assert!(
        kept.contains(&("other-retained", "someone-else")),
        "{recovered}"
    );
    assert_eq!(retained_ids(&f), ["other-retained"]);
}

/// A finished Land of `writer` under `id`, its candidate worktree still held.
fn finished_land_as(f: &Fixture, id: &str, writer: &str) -> PathBuf {
    let worktree = interrupt_land_as(f, id, writer);
    f.driver.recover_land(&f.repo, vec![], writer, id).unwrap();
    worktree
}

fn pin_present(f: &Fixture, id: &str) -> bool {
    !git(
        &f.main,
        &["for-each-ref", &format!("refs/fgos/git-operations/{id}/")],
    )
    .is_empty()
}

#[test]
fn recovery_frees_only_the_worktree_of_a_finished_land_whose_writer_is_proven_dead() {
    let f = Fixture::new();
    let worktree = finished_land_as(&f, "dead-writer", "gone-session");
    let recovered = recover_proving(&f, &|w| w == "gone-session");
    assert_eq!(recovered["freed"], json!(["dead-writer"]), "{recovered}");
    assert!(!worktree.exists(), "the dead writer's worktree is removed");
    assert!(pin_present(&f, "dead-writer"), "pins and journal stay");
    let again = recover_proving(&f, &|w| w == "gone-session");
    assert_eq!(again["freed"], json!([]), "{again}");
    assert_eq!(again["kept"], json!([]), "{again}");
}

#[test]
fn recovery_keeps_the_finished_land_of_a_writer_not_proven_dead() {
    let f = Fixture::new();
    let worktree = finished_land_as(&f, "live-writer", "live-session");
    let recovered = recover_proving(&f, &|_| false);
    assert_eq!(recovered["freed"], json!([]), "{recovered}");
    assert_eq!(
        recovered["kept"],
        json!([{"operationId": "live-writer", "cause": "land-authority-mismatch", "writer": "live-session"}])
    );
    assert!(worktree.exists());
}

#[test]
fn recovery_never_touches_the_candidate_of_an_attempted_land_even_when_its_writer_is_dead() {
    let f = Fixture::new();
    let mut x = f
        .driver
        .prepare_land(
            &f.repo,
            vec![],
            &f.request,
            "gone-session",
            "attempted",
            &wal::OsFileSystem,
            0,
        )
        .unwrap();
    let worktree = x.candidate().unwrap().worktree.clone();
    let e = evidence(&x);
    assert!(f
        .driver
        .publish_land(&f.repo, &mut x, &e, &StopAt("land-before-read-tree"), 0)
        .is_err());
    drop(x);
    let recovered = recover_proving(&f, &|_| true);
    assert_eq!(recovered["freed"], json!([]), "{recovered}");
    assert_eq!(recovered["recovered"], json!([]), "{recovered}");
    assert!(worktree.exists());
    assert!(pin_present(&f, "attempted"));
}

struct StopAt(&'static str);
impl wal::FileSystem for StopAt {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        if step == self.0 {
            Err(std::io::Error::other("interrupted at production boundary"))
        } else {
            Ok(())
        }
    }
}

#[test]
fn a_finished_land_whose_checkout_still_reconciles_loses_its_worktree_and_keeps_its_pins() {
    let f = Fixture::new();
    let mut x = f
        .driver
        .prepare_land(
            &f.repo,
            vec![],
            &f.request,
            WRITER,
            "lagging",
            &wal::OsFileSystem,
            0,
        )
        .unwrap();
    let worktree = x.candidate().unwrap().worktree.clone();
    let e = evidence(&x);
    assert!(f
        .driver
        .publish_land(&f.repo, &mut x, &e, &StopAt("land-before-read-tree"), 0)
        .is_err());
    drop(x);
    git(&f.main, &["commit", "--allow-empty", "-qm", "user work"]);
    let receipt = f
        .driver
        .recover_land(&f.repo, vec![], WRITER, "lagging")
        .unwrap();
    assert!(matches!(receipt.checkout, Checkout::Pending));

    let recovered = recover(&f);
    assert!(!worktree.exists(), "{recovered}");
    assert!(pin_present(&f, "lagging"), "pins wait for the checkout");
    let cause = recovered["kept"][0]["cause"].as_str().unwrap();
    assert!(
        cause.contains("checkout reconciliation pending"),
        "{recovered}"
    );
    // A replay finds the worktree already gone and its removal chain complete.
    let again = recover(&f);
    assert!(
        again["kept"][0]["cause"]
            .as_str()
            .unwrap()
            .contains("checkout reconciliation pending"),
        "{again}"
    );
    assert!(f
        .driver
        .recover_land(&f.repo, vec![], WRITER, "lagging")
        .is_ok());
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
