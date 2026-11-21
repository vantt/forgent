// Linux only: its Git children run through a borrowed lock, which on Windows needs a helper executable that a library test harness is not; the Windows proof of this port runs from apps/fgos/tests/windows_git_custody.rs, and its fixture uses Unix permissions.
#![cfg(target_os = "linux")]
//! The landing use case against a real bare remote and a real clone. The Land port's own refusals
//! are owned by `packages/git/rust/tests/land.rs`; one pass-through proof lives here.
use fgos_git::{GitDriver, RemoteGrant, RepoHandle, ResolveRepo};
use fgos_supervision::land::{
    catch_up, land, Gate, LandCommand, LandConfig, LandPorts, Regenerate, ShellRunner,
};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};

static SERIAL: AtomicU64 = AtomicU64::new(0);

fn git(root: &Path, args: &[&str]) -> String {
    let o = Command::new("git")
        .arg("-C")
        .arg(root)
        .args(args)
        .output()
        .unwrap();
    assert!(
        o.status.success(),
        "{args:?}: {}",
        String::from_utf8_lossy(&o.stderr)
    );
    String::from_utf8(o.stdout).unwrap().trim().into()
}

fn git_ok(root: &Path, args: &[&str]) -> bool {
    Command::new("git")
        .arg("-C")
        .arg(root)
        .args(args)
        .output()
        .unwrap()
        .status
        .success()
}

struct Env {
    driver: GitDriver,
    repo: RepoHandle,
    grant: RemoteGrant,
    log_dir: PathBuf,
}

impl Env {
    fn open(temp: &Path) -> Self {
        let main = temp.join("repo");
        let driver = GitDriver::new(&temp.join("state")).unwrap();
        let repo = match driver.resolve_repo(&main, &main).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!("not a repository"),
        };
        let grant = RemoteGrant {
            name: "origin".into(),
            pinned_url: temp.join("remote.git").to_str().unwrap().into(),
        };
        Self {
            driver,
            repo,
            grant,
            log_dir: temp.join("land-logs"),
        }
    }
}

struct Fixture {
    temp: PathBuf,
    main: PathBuf,
    remote: PathBuf,
    other: PathBuf,
    env: Env,
    ids: AtomicU64,
}

impl Fixture {
    fn new() -> Self {
        use std::os::unix::fs::PermissionsExt;
        let temp = std::env::temp_dir().join(format!(
            "fgos-sup-land-{}-{}",
            std::process::id(),
            SERIAL.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&temp).unwrap();
        fs::set_permissions(&temp, fs::Permissions::from_mode(0o700)).unwrap();
        let remote = temp.join("remote.git");
        git(
            &temp,
            &[
                "init",
                "-q",
                "--bare",
                "--initial-branch=trunk",
                remote.to_str().unwrap(),
            ],
        );
        let main = temp.join("repo");
        git(
            &temp,
            &[
                "init",
                "-q",
                "--initial-branch=trunk",
                main.to_str().unwrap(),
            ],
        );
        git(&main, &["config", "user.name", "Fixture"]);
        git(&main, &["config", "user.email", "fixture@example.invalid"]);
        for name in ["a", "b", "c", "d", "src.txt", "census.txt"] {
            fs::write(main.join(name), "base\n").unwrap();
        }
        git(&main, &["add", "."]);
        git(&main, &["commit", "-qm", "base"]);
        git(
            &main,
            &["remote", "add", "origin", remote.to_str().unwrap()],
        );
        git(&main, &["push", "-q", "origin", "trunk"]);
        let fence = main.join(".fgos/locks/activation.lock");
        fs::create_dir_all(&fence).unwrap();
        fs::write(
            fence.join("TOMBSTONE"),
            r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
        )
        .unwrap();
        fs::create_dir(temp.join("state")).unwrap();
        fs::set_permissions(temp.join("state"), fs::Permissions::from_mode(0o700)).unwrap();
        let other = temp.join("other");
        git(
            &temp,
            &[
                "clone",
                "-q",
                remote.to_str().unwrap(),
                other.to_str().unwrap(),
            ],
        );
        git(&other, &["config", "user.name", "Other"]);
        git(&other, &["config", "user.email", "other@example.invalid"]);
        let env = Env::open(&temp);
        Self {
            temp,
            main,
            remote,
            other,
            env,
            ids: AtomicU64::new(0),
        }
    }

    /// A topic branch with the given file contents, committed in the main checkout, then back on trunk.
    fn topic(&self, name: &str, files: &[(&str, &str)]) {
        git(&self.main, &["checkout", "-qb", name]);
        for (path, text) in files {
            fs::write(self.main.join(path), text).unwrap();
        }
        git(&self.main, &["commit", "-qam", name]);
        git(&self.main, &["checkout", "-q", "trunk"]);
    }

    /// Advance the remote trunk from the other clone.
    fn move_remote(&self, file: &str, text: &str) {
        git(&self.other, &["pull", "-q", "--ff-only", "origin", "trunk"]);
        fs::write(self.other.join(file), text).unwrap();
        git(&self.other, &["add", "."]);
        git(&self.other, &["commit", "-qm", "moved"]);
        git(&self.other, &["push", "-q", "origin", "trunk"]);
    }

    fn remote_tip(&self) -> String {
        git(&self.remote, &["rev-parse", "refs/heads/trunk"])
    }

    fn local_tip(&self) -> String {
        git(&self.main, &["rev-parse", "refs/heads/trunk"])
    }

    fn catch_up(&self) -> Result<(), fgos_supervision::land::LandRefusal> {
        let next = || format!("up-{}", self.ids.fetch_add(1, Ordering::Relaxed));
        catch_up(&paths(&["a"]), &ports(&self.env, &next, 30_000))
    }

    fn land(
        &self,
        command: &LandCommand,
        config: &LandConfig,
    ) -> Result<fgos_supervision::land::LandOutcome, fgos_supervision::land::LandRefusal> {
        run_land(&self.env, "op", &self.ids, command, config, 30_000)
    }
}

fn ports<'a>(env: &'a Env, next: &'a dyn Fn() -> String, wait_ms: u64) -> LandPorts<'a> {
    LandPorts {
        git: &env.driver,
        repo: &env.repo,
        remote: &env.grant,
        writer: "fixture",
        operation_id: next,
        runner: &ShellRunner,
        log_dir: &env.log_dir,
        wait_ms,
    }
}

fn run_land(
    env: &Env,
    prefix: &str,
    ids: &AtomicU64,
    command: &LandCommand,
    config: &LandConfig,
    wait_ms: u64,
) -> Result<fgos_supervision::land::LandOutcome, fgos_supervision::land::LandRefusal> {
    let next = || format!("{prefix}-{}", ids.fetch_add(1, Ordering::Relaxed));
    land(command, config, &ports(env, &next, wait_ms))
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.temp);
    }
}

fn gate(run: &str) -> Gate {
    Gate {
        run: run.into(),
        when: vec![],
    }
}

fn gate_when(run: &str, when: &[&str]) -> Gate {
    Gate {
        run: run.into(),
        when: when.iter().map(|s| s.to_string()).collect(),
    }
}

fn config(gates: Vec<Gate>) -> LandConfig {
    LandConfig {
        gates,
        regenerate: None,
    }
}

fn branch(name: &str) -> LandCommand {
    LandCommand {
        branch: Some(name.into()),
        target: Some("trunk".into()),
        message: format!("land {name}"),
        ..Default::default()
    }
}

fn paths(names: &[&str]) -> LandCommand {
    LandCommand {
        paths: Some(names.iter().map(|s| s.to_string()).collect()),
        target: Some("trunk".into()),
        message: "land paths".into(),
        ..Default::default()
    }
}

/// A gate script that moves the remote trunk from the other clone: every run, or only the first.
fn mover(f: &Fixture, once: bool) -> String {
    let script = f.temp.join("mover.sh");
    let marker = f.temp.join("moved-once");
    let guard = if once {
        format!("[ -e {m} ] && exit 0; touch {m}; ", m = marker.display())
    } else {
        String::new()
    };
    fs::write(
        &script,
        format!(
            "{guard}cd {o} && git pull -q --ff-only origin trunk && echo $$ > moved-$$ && git add . && git commit -qm moved && git push -q origin trunk\n",
            o = f.other.display()
        ),
    )
    .unwrap();
    format!("sh {}", script.display())
}

#[test]
fn a_clean_merge_lands_pushes_and_local_main_equals_the_remote_tip() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    let out = f
        .land(&branch("topic"), &config(vec![gate("true")]))
        .unwrap();
    assert_eq!(out.main_sha, f.remote_tip());
    assert_eq!(f.local_tip(), f.remote_tip());
    assert_eq!(out.landed_paths, vec!["a".to_string()]);
    assert_eq!(out.retries, 0);
    assert_eq!(fs::read_to_string(f.main.join("a")).unwrap(), "incoming\n");
}

#[test]
fn a_delivered_land_releases_its_candidate_checkout() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    let exclude = f.main.join(".git/info/exclude");
    fs::create_dir_all(exclude.parent().unwrap()).unwrap();
    fs::write(&exclude, "*.out\n").unwrap();
    f.land(
        &branch("topic"),
        &config(vec![gate("echo built > build.out")]),
    )
    .unwrap();
    let candidates = f.main.join(".fgos/runtime/git-candidates");
    let left = fs::read_dir(&candidates).map(|d| d.count()).unwrap_or(0);
    assert_eq!(left, 0, "a delivered land leaves no candidate checkout");
    assert_eq!(git(&f.main, &["worktree", "list"]).lines().count(), 1);
}

#[test]
fn a_conflicting_census_lands_regenerated() {
    let f = Fixture::new();
    f.topic(
        "topic",
        &[("src.txt", "topic-src\n"), ("census.txt", "topic-census\n")],
    );
    f.move_remote("census.txt", "trunk-census\n");
    let cfg = LandConfig {
        gates: vec![gate("true")],
        regenerate: Some(Regenerate {
            run: "cp src.txt census.txt".into(),
            files: vec!["census.txt".into()],
            when: Vec::new(),
        }),
    };
    let out = f.land(&branch("topic"), &cfg).unwrap();
    assert_eq!(out.main_sha, f.remote_tip());
    assert_eq!(
        fs::read_to_string(f.main.join("census.txt")).unwrap(),
        "topic-src\n"
    );
    assert_eq!(
        fs::read_to_string(f.main.join("src.txt")).unwrap(),
        "topic-src\n"
    );
}

#[test]
fn a_conflict_outside_the_declared_files_refuses_before_any_candidate_is_prepared() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "topic\n")]);
    f.move_remote("a", "trunk\n");
    let before = f.remote_tip();
    let refusal = f
        .land(&branch("topic"), &config(vec![gate("true")]))
        .unwrap_err();
    assert_eq!(refusal.code, "land-conflict-aborted");
    assert!(refusal.detail.contains('a'));
    assert_eq!(git(&f.main, &["worktree", "list"]).lines().count(), 1);
    assert_eq!(f.remote_tip(), before);
}

#[test]
fn a_failing_gate_refuses_and_publishes_nothing() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    let remote_before = f.remote_tip();
    let local_before = f.local_tip();
    let refusal = f
        .land(
            &branch("topic"),
            &config(vec![gate("echo boom >&2; exit 1")]),
        )
        .unwrap_err();
    assert_eq!(refusal.code, "land-gate-failed");
    assert!(refusal.detail.contains("boom"));
    assert_eq!(f.remote_tip(), remote_before);
    assert_eq!(f.local_tip(), local_before);
}

#[test]
fn a_failing_gate_names_its_failing_test_keeps_the_full_log_and_settles_its_own_operation() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    let refs_before = git(&f.main, &["for-each-ref"]);
    let noisy = "i=0; while [ $i -lt 400 ]; do echo \"   Compiling crate$i v0.1.0\" >&2; i=$((i+1)); done; \
                 echo 'not ok 7 - the pin survives'; echo '    Finished dev profile' >&2; exit 1";
    let refusal = f
        .land(&branch("topic"), &config(vec![gate(noisy)]))
        .unwrap_err();
    assert_eq!(refusal.code, "land-gate-failed");
    assert!(refusal.detail.contains("not ok 7 - the pin survives"));
    assert!(!refusal.detail.contains("Compiling crate10 "));
    let log = refusal.gate_log.clone().expect("gate log named");
    assert!(refusal.detail.contains(log.to_str().unwrap()));
    let full = fs::read_to_string(&log).unwrap();
    assert!(full.contains("Compiling crate0 ") && full.contains("not ok 7"));
    assert_eq!(git(&f.main, &["for-each-ref"]), refs_before);
    // Nothing is left pending: a fixed branch lands at once, with no recover.
    let fixed = f
        .land(&branch("topic"), &config(vec![gate("true")]))
        .unwrap();
    assert_eq!(fixed.main_sha, f.remote_tip());
}

#[test]
fn a_failing_gate_that_leaves_ignored_bytes_names_the_gate_first_and_leaves_no_candidate() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    let exclude = f.main.join(".git/info/exclude");
    fs::create_dir_all(exclude.parent().unwrap()).unwrap();
    fs::write(&exclude, "*.out\n").unwrap();
    let refusal = f
        .land(
            &branch("topic"),
            &config(vec![gate("echo junk > build.out; echo boom >&2; exit 1")]),
        )
        .unwrap_err();
    assert_eq!(refusal.code, "land-gate-failed");
    assert!(refusal.detail.starts_with("echo junk"));
    assert!(refusal.detail.contains("boom"));
    assert_eq!(refusal.cleanup_note, None);
    let candidates = f.main.join(".fgos/runtime/git-candidates");
    let left = fs::read_dir(&candidates).map(|d| d.count()).unwrap_or(0);
    assert_eq!(
        left, 0,
        "the candidate checkout is removed with its ignored bytes"
    );
    assert_eq!(git(&f.main, &["worktree", "list"]).lines().count(), 1);
}

fn pins(f: &Fixture) -> String {
    git(&f.main, &["for-each-ref", "refs/fgos/git-operations"])
}

#[test]
fn a_push_that_cannot_reach_the_remote_is_not_settled_and_names_the_recovery_verb() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    let away = f.temp.join("remote-away.git");
    let hide = format!("mv {} {}", f.remote.display(), away.display());
    let refusal = f
        .land(&branch("topic"), &config(vec![gate(&hide)]))
        .unwrap_err();
    assert!(refusal.detail.contains("fgos git recover"), "{refusal:?}");
    assert!(!pins(&f).is_empty(), "the operation stays for recovery");
}

#[test]
fn a_publish_that_fails_after_the_push_is_not_settled_and_names_the_recovery_verb() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    // A gate edits a file the land writes in the main checkout, after the push is the only step
    // left: publish refuses the dirty overlap with the remote already holding the candidate.
    let dirty = format!("echo local > {}", f.main.join("a").display());
    let refusal = f
        .land(&branch("topic"), &config(vec![gate(&dirty)]))
        .unwrap_err();
    assert!(refusal.detail.contains("fgos git recover"), "{refusal:?}");
    assert!(
        !refusal.retryable,
        "a refusal after the push is recovery, not busy"
    );
    assert!(!pins(&f).is_empty(), "the operation stays for recovery");
}

#[test]
fn a_rejected_push_settles_the_operation_and_a_second_land_works() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    let refusal = f
        .land(&branch("topic"), &config(vec![gate(&mover(&f, false))]))
        .unwrap_err();
    assert_eq!(refusal.code, "land-retries-exhausted");
    assert_eq!(pins(&f), "", "every rejected attempt was settled");
    let out = f
        .land(&branch("topic"), &config(vec![gate("true")]))
        .unwrap();
    assert_eq!(out.main_sha, f.remote_tip());
}

#[test]
fn the_remote_moving_once_between_prepare_and_push_lands_on_the_second_try() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    let out = f
        .land(&branch("topic"), &config(vec![gate(&mover(&f, true))]))
        .unwrap();
    assert_eq!(out.retries, 1);
    assert_eq!(out.main_sha, f.remote_tip());
    assert_eq!(f.local_tip(), f.remote_tip());
    assert_eq!(fs::read_to_string(f.main.join("a")).unwrap(), "incoming\n");
}

#[test]
fn the_remote_moving_every_time_ends_retries_exhausted_with_no_local_land() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    let local_before = f.local_tip();
    let refusal = f
        .land(&branch("topic"), &config(vec![gate(&mover(&f, false))]))
        .unwrap_err();
    assert_eq!(refusal.code, "land-retries-exhausted");
    assert_ne!(f.remote_tip(), local_before);
    assert!(git_ok(
        &f.main,
        &["merge-base", "--is-ancestor", "trunk", "origin/trunk"]
    ));
    assert!(!git_ok(
        &f.main,
        &["merge-base", "--is-ancestor", "topic", "trunk"]
    ));
}

#[test]
fn a_branch_path_outside_the_footprint_refuses_and_names_the_path() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    let mut cmd = branch("topic");
    cmd.footprint = Some(vec!["b".into()]);
    let refusal = f.land(&cmd, &config(vec![gate("true")])).unwrap_err();
    assert_eq!(refusal.code, "land-outside-footprint");
    assert!(refusal.detail.contains('a'));
}

#[test]
fn an_unrelated_dirty_main_checkout_file_does_not_block_a_branch_land_with_a_footprint() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    fs::write(f.main.join("d"), "keep local\n").unwrap();
    let mut cmd = branch("topic");
    cmd.footprint = Some(vec!["a".into()]);
    f.land(&cmd, &config(vec![gate("true")])).unwrap();
    assert_eq!(
        fs::read_to_string(f.main.join("d")).unwrap(),
        "keep local\n"
    );
}

#[test]
fn a_git_refusal_passes_through_with_its_own_code() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    fs::write(f.main.join("a"), "dirty\n").unwrap();
    let mut cmd = branch("topic");
    cmd.footprint = Some(vec!["a".into()]);
    let refusal = f.land(&cmd, &config(vec![gate("true")])).unwrap_err();
    assert_eq!(refusal.code, "main-checkout-dirty-overlap");
}

#[test]
fn empty_gates_refuse_before_anything_is_touched() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    let refusal = f.land(&branch("topic"), &config(vec![])).unwrap_err();
    assert_eq!(refusal.code, "land-gate-missing");
    assert_eq!(f.ids.load(Ordering::Relaxed), 0);
}

#[test]
fn a_tests_gate_receives_the_test_paths_and_an_unknown_test_is_refused() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    let out_file = f.temp.join("tests.out");
    let cfg = config(vec![gate(&format!(
        "printf '%s\\n' {{tests}} > {}",
        out_file.display()
    ))]);
    let mut cmd = branch("topic");
    cmd.tests = vec!["b".into(), "c".into()];
    f.land(&cmd, &cfg).unwrap();
    assert_eq!(fs::read_to_string(out_file).unwrap(), "b\nc\n");

    f.topic("topic2", &[("d", "incoming\n")]);
    let mut cmd = branch("topic2");
    cmd.tests = vec!["no-such-test".into()];
    assert_eq!(f.land(&cmd, &cfg).unwrap_err().code, "land-test-unknown");
}

#[test]
fn a_paths_land_commits_exactly_the_named_paths_and_runs_only_matching_gates() {
    let f = Fixture::new();
    fs::write(f.main.join("a"), "landed\n").unwrap();
    fs::write(f.main.join("b"), "still dirty\n").unwrap();
    let cfg = config(vec![
        gate_when("true", &["a"]),
        gate_when("touch ran-for-b", &["b"]),
    ]);
    let out = f.land(&paths(&["a"]), &cfg).unwrap();
    assert_eq!(out.gates_run, vec!["true".to_string()]);
    assert_eq!(out.landed_paths, vec!["a".to_string()]);
    assert_eq!(out.main_sha, f.remote_tip());
    assert_eq!(
        git(&f.main, &["show", "--name-only", "--format=", "HEAD"]),
        "a"
    );
    assert_eq!(
        fs::read_to_string(f.main.join("b")).unwrap(),
        "still dirty\n"
    );
    assert!(!f.main.join("ran-for-b").exists());

    // A path no gate's `when` matches lands with no gate run, though the gate list is not empty.
    fs::write(f.main.join("c"), "no gate\n").unwrap();
    let out = f.land(&paths(&["c"]), &cfg).unwrap();
    assert!(out.gates_run.is_empty(), "{:?}", out.gates_run);
    assert_eq!(out.main_sha, f.remote_tip());
    assert!(!f.main.join("ran-for-b").exists());
}

#[test]
fn catch_up_alone_fast_forwards_and_refuses_a_local_branch_with_commits_the_remote_lacks() {
    let f = Fixture::new();
    f.move_remote("moved.txt", "from elsewhere\n");
    f.catch_up().unwrap();
    assert_eq!(f.local_tip(), f.remote_tip());
    assert!(f.main.join("moved.txt").exists());

    fs::write(f.main.join("a"), "unpushed\n").unwrap();
    git(&f.main, &["commit", "-qam", "unpushed"]);
    f.move_remote("moved-again.txt", "again\n");
    let (local, remote) = (f.local_tip(), f.remote_tip());
    let refusal = f.catch_up().unwrap_err();
    assert_eq!(refusal.code, "land-target-ahead", "{refusal}");
    assert_eq!(f.local_tip(), local);
    assert_eq!(f.remote_tip(), remote);
}

#[test]
fn a_paths_land_fast_forwards_to_a_remote_that_moved_first() {
    let f = Fixture::new();
    f.move_remote("moved.txt", "from elsewhere\n");
    let moved = f.remote_tip();
    fs::write(f.main.join("a"), "landed\n").unwrap();
    let out = f.land(&paths(&["a"]), &config(vec![gate("true")])).unwrap();
    assert_eq!(out.main_sha, f.remote_tip());
    assert_eq!(git(&f.main, &["rev-parse", "HEAD^"]), moved);
    assert!(f.main.join("moved.txt").exists());
}

#[test]
fn an_empty_paths_set_is_refused() {
    let f = Fixture::new();
    let refusal = f
        .land(&paths(&[]), &config(vec![gate("true")]))
        .unwrap_err();
    assert_eq!(refusal.code, "land-paths-empty");
}

#[test]
fn a_land_after_an_interrupted_one_completes_or_names_the_recovery_verb() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    // A land that stopped after prepare: its session is gone, its WAL intent and candidate remain.
    let main = git(&f.main, &["rev-parse", "refs/heads/trunk"]);
    let source = git(&f.main, &["rev-parse", "refs/heads/topic"]);
    let request = fgos_git::LandRequest {
        source,
        target: main,
        destination: "refs/heads/trunk".into(),
        message: "interrupted".into(),
        squash: false,
        footprint: None,
        subtree: None,
        files: vec![],
    };
    let session = f
        .env
        .driver
        .prepare_land(
            &f.env.repo,
            vec![],
            &request,
            "fixture",
            "interrupted",
            &fgos_git::wal::OsFileSystem,
            0,
        )
        .unwrap();
    drop(session);
    match f.land(&branch("topic"), &config(vec![gate("true")])) {
        Ok(out) => assert_eq!(out.main_sha, f.remote_tip()),
        Err(refusal) => {
            assert_eq!(refusal.code, "land-recovery-required");
            assert!(refusal.detail.contains("fgos git recover"));
        }
    }
}

#[test]
fn two_concurrent_lands_into_one_target_serialize() {
    let f = Fixture::new();
    f.topic("one", &[("a", "one\n")]);
    f.topic("two", &[("b", "two\n")]);
    let ids = AtomicU64::new(0);
    let second = Env::open(&f.temp);
    let cfg = config(vec![gate("true")]);
    let (first_result, second_result) = std::thread::scope(|s| {
        let h1 = s.spawn(|| run_land(&f.env, "one", &ids, &branch("one"), &cfg, 30_000));
        let h2 = s.spawn(|| run_land(&second, "two", &ids, &branch("two"), &cfg, 30_000));
        (h1.join().unwrap(), h2.join().unwrap())
    });
    for result in [&first_result, &second_result] {
        if let Err(refusal) = result {
            assert_eq!(refusal.code, "land-slot-already-held", "{refusal}");
        }
    }
    assert!(first_result.is_ok() || second_result.is_ok());
}

#[test]
fn a_branch_edit_of_a_regenerated_file_outside_the_footprint_refuses() {
    let f = Fixture::new();
    f.topic(
        "topic",
        &[("a", "incoming\n"), ("census.txt", "hand-edited\n")],
    );
    let cfg = LandConfig {
        gates: vec![gate("true")],
        regenerate: Some(Regenerate {
            run: "cp src.txt census.txt".into(),
            files: vec!["census.txt".into()],
            when: Vec::new(),
        }),
    };
    let mut cmd = branch("topic");
    cmd.footprint = Some(vec!["a".into()]);
    let before = f.remote_tip();
    let refusal = f.land(&cmd, &cfg).unwrap_err();
    assert_eq!(refusal.code, "land-outside-footprint");
    assert_eq!(refusal.detail, "census.txt");
    assert_eq!(f.remote_tip(), before);
}

#[test]
fn a_gate_that_edits_a_tracked_candidate_file_refuses_with_nothing_pushed() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    let remote_before = f.remote_tip();
    let local_before = f.local_tip();
    let refusal = f
        .land(&branch("topic"), &config(vec![gate("echo gated > b")]))
        .unwrap_err();
    assert_eq!(refusal.code, "land-candidate-dirty");
    assert!(refusal.detail.contains('b'), "{refusal}");
    assert_eq!(f.remote_tip(), remote_before);
    assert_eq!(f.local_tip(), local_before);
}

#[test]
fn a_paths_land_whose_hook_changes_the_commit_refuses_with_nothing_pushed() {
    use std::os::unix::fs::PermissionsExt;
    let f = Fixture::new();
    let hooks = f.temp.join("hooks");
    fs::create_dir(&hooks).unwrap();
    let hook = hooks.join("pre-commit");
    fs::write(&hook, "#!/bin/sh\nprintf hook > c\ngit add c\n").unwrap();
    fs::set_permissions(&hook, fs::Permissions::from_mode(0o755)).unwrap();
    git(
        &f.main,
        &["config", "core.hooksPath", hooks.to_str().unwrap()],
    );
    let before = f.remote_tip();
    fs::write(f.main.join("a"), "landed\n").unwrap();
    let refusal = f
        .land(&paths(&["a"]), &config(vec![gate("true")]))
        .unwrap_err();
    assert_eq!(refusal.code, "land-commit-contract-violation");
    assert_eq!(f.remote_tip(), before);
    assert_eq!(f.local_tip(), before, "the unpublished commit was undone");
    assert_eq!(fs::read_to_string(f.main.join("a")).unwrap(), "landed\n");
}

#[test]
fn a_paths_land_whose_push_is_rejected_undoes_its_commit_and_lands_on_the_retry() {
    let f = Fixture::new();
    fs::write(f.main.join("a"), "landed\n").unwrap();
    let out = f
        .land(&paths(&["a"]), &config(vec![gate(&mover(&f, true))]))
        .unwrap();
    assert_eq!(out.retries, 1);
    assert_eq!(out.main_sha, f.remote_tip());
    assert_eq!(f.local_tip(), f.remote_tip());
    assert_eq!(fs::read_to_string(f.main.join("a")).unwrap(), "landed\n");
}

#[test]
fn a_paths_land_whose_push_is_rejected_every_time_leaves_local_main_not_ahead_and_the_bytes_in_place(
) {
    let f = Fixture::new();
    fs::write(f.main.join("a"), "landed\n").unwrap();
    let refusal = f
        .land(&paths(&["a"]), &config(vec![gate(&mover(&f, false))]))
        .unwrap_err();
    assert_eq!(refusal.code, "land-retries-exhausted");
    assert!(
        git_ok(
            &f.main,
            &["merge-base", "--is-ancestor", "trunk", "origin/trunk"]
        ),
        "local main holds no commit the remote lacks"
    );
    assert_eq!(fs::read_to_string(f.main.join("a")).unwrap(), "landed\n");
    assert_eq!(git(&f.main, &["status", "--porcelain", "--", "a"]), "M a");
    f.catch_up().unwrap();
}

#[test]
fn a_paths_land_into_a_target_the_main_checkout_is_not_on_refuses() {
    let f = Fixture::new();
    git(&f.main, &["branch", "other"]);
    git(&f.main, &["push", "-q", "origin", "other"]);
    let other_before = git(&f.remote, &["rev-parse", "refs/heads/other"]);
    let trunk_before = f.local_tip();
    fs::write(f.main.join("a"), "landed\n").unwrap();
    let mut cmd = paths(&["a"]);
    cmd.target = Some("other".into());
    let refusal = f.land(&cmd, &config(vec![gate("true")])).unwrap_err();
    assert_eq!(refusal.code, "land-target-not-checked-out");
    assert_eq!(
        git(&f.remote, &["rev-parse", "refs/heads/other"]),
        other_before
    );
    assert_eq!(f.local_tip(), trunk_before);
}

#[test]
fn a_paths_land_refuses_busy_while_a_land_of_its_target_holds_the_merge_slot() {
    let f = Fixture::new();
    f.topic("topic", &[("b", "incoming\n")]);
    let request = fgos_git::LandRequest {
        source: git(&f.main, &["rev-parse", "refs/heads/topic"]),
        target: f.local_tip(),
        destination: "refs/heads/trunk".into(),
        message: "branch land".into(),
        squash: false,
        footprint: None,
        subtree: None,
        files: vec![],
    };
    let session = f
        .env
        .driver
        .prepare_land(
            &f.env.repo,
            vec![],
            &request,
            "fixture",
            "branch-land",
            &fgos_git::wal::OsFileSystem,
            0,
        )
        .unwrap();
    let (remote_before, local_before) = (f.remote_tip(), f.local_tip());
    fs::write(f.main.join("a"), "landed\n").unwrap();
    let refusal = run_land(
        &f.env,
        "paths",
        &f.ids,
        &paths(&["a"]),
        &config(vec![gate("true")]),
        0,
    )
    .unwrap_err();
    assert_eq!(refusal.code, "merge-slot-busy", "{refusal}");
    assert_eq!(f.local_tip(), local_before);
    assert_eq!(f.remote_tip(), remote_before);
    assert_eq!(fs::read_to_string(f.main.join("a")).unwrap(), "landed\n");
    drop(session);
}

#[test]
fn with_no_target_and_no_remote_head_a_main_checkout_on_a_side_branch_refuses_target_unknown() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "incoming\n")]);
    git(&f.main, &["checkout", "-qb", "side"]);
    let (remote_before, side_before) = (
        f.remote_tip(),
        git(&f.main, &["rev-parse", "refs/heads/side"]),
    );
    let mut cmd = branch("topic");
    cmd.target = None;
    let refusal = f.land(&cmd, &config(vec![gate("true")])).unwrap_err();
    assert_eq!(refusal.code, "land-target-unknown", "{refusal}");
    assert_eq!(f.remote_tip(), remote_before);
    assert_eq!(git(&f.main, &["rev-parse", "refs/heads/side"]), side_before);
}

const PLAN_PATH: &str = "plans/260101-0000-demo/plan.md";

fn plan_text(footprint: &[&str]) -> String {
    let lines: String = footprint.iter().map(|f| format!("  - {f}\n")).collect();
    format!("---\ncontract: plan-v1\ntitle: demo\nstatus: running\npriority: P2\nfootprint:\n{lines}created: 2026-01-01\n---\n\n# Demo\n\n## Phases\n\n| Phase | Title | Depends on | Footprint | Wave | Status |\n|---|---|---|---|---|---|\n| 01 | one | - | src/** | 1 | pending |\n")
}

/// Commit a plan file on trunk and push it, so the trunk tip holds the plan as a lead found it.
fn commit_plan(f: &Fixture, footprint: &[&str]) {
    fs::create_dir_all(f.main.join("plans/260101-0000-demo")).unwrap();
    fs::write(f.main.join(PLAN_PATH), plan_text(footprint)).unwrap();
    git(&f.main, &["add", "."]);
    git(&f.main, &["commit", "-qm", "plan"]);
    git(&f.main, &["push", "-q", "origin", "trunk"]);
}

fn lead_paths(names: &[&str]) -> LandCommand {
    LandCommand {
        footprint: Some(vec!["plans/260101-0000-demo/**".into()]),
        ..paths(names)
    }
}

#[test]
fn a_lead_paths_land_that_changes_the_footprint_of_its_plan_file_refuses_and_commits_nothing() {
    let f = Fixture::new();
    commit_plan(&f, &["src/**"]);
    let tip = f.remote_tip();
    // The bytes in the commit differ from the trunk tip's: the check reads the committed tree.
    fs::write(f.main.join(PLAN_PATH), plan_text(&["src/**", "docs/**"])).unwrap();
    let refusal = f
        .land(&lead_paths(&[PLAN_PATH]), &config(vec![gate("true")]))
        .unwrap_err();
    assert_eq!(refusal.code, "footprint-change-refused", "{refusal}");
    assert!(
        refusal
            .detail
            .contains("changes the footprint of its own plan"),
        "{refusal}"
    );
    assert_eq!(f.remote_tip(), tip);
    // The commit was made to be judged and is undone: local main is where it was, the bytes stay.
    assert_eq!(f.local_tip(), tip);
    assert!(refusal.detail.contains("was undone"), "{refusal}");
    assert_eq!(
        fs::read_to_string(f.main.join(PLAN_PATH)).unwrap(),
        plan_text(&["src/**", "docs/**"])
    );
}

#[test]
fn a_lead_paths_land_that_changes_the_footprint_through_a_directory_path_refuses() {
    let f = Fixture::new();
    commit_plan(&f, &["src/**"]);
    fs::write(f.main.join(PLAN_PATH), plan_text(&[])).unwrap();
    let refusal = f
        .land(
            &lead_paths(&["plans/260101-0000-demo"]),
            &config(vec![gate("true")]),
        )
        .unwrap_err();
    assert_eq!(refusal.code, "footprint-change-refused", "{refusal}");
    assert!(
        refusal
            .detail
            .contains("changes the footprint of its own plan"),
        "{refusal}"
    );
}

#[test]
fn a_lead_paths_land_that_changes_the_footprint_through_a_glob_path_refuses_and_pushes_nothing() {
    let f = Fixture::new();
    commit_plan(&f, &["src/**"]);
    let tip = f.remote_tip();
    fs::write(f.main.join(PLAN_PATH), plan_text(&["src/**", "docs/**"])).unwrap();
    let refusal = f
        .land(
            &lead_paths(&["plans/260101-0000-demo/**"]),
            &config(vec![gate("true")]),
        )
        .unwrap_err();
    assert_eq!(refusal.code, "footprint-change-refused", "{refusal}");
    assert!(
        refusal
            .detail
            .contains("changes the footprint of its own plan"),
        "{refusal}"
    );
    assert_eq!(f.remote_tip(), tip);
}

#[test]
fn a_lead_paths_land_that_deletes_its_plan_file_refuses_and_pushes_nothing() {
    let f = Fixture::new();
    commit_plan(&f, &["src/**"]);
    let tip = f.remote_tip();
    fs::remove_file(f.main.join(PLAN_PATH)).unwrap();
    let refusal = f
        .land(&lead_paths(&[PLAN_PATH]), &config(vec![gate("true")]))
        .unwrap_err();
    assert_eq!(refusal.code, "footprint-change-refused", "{refusal}");
    assert!(refusal.detail.contains("is deleted"), "{refusal}");
    assert_eq!(f.remote_tip(), tip);
}

#[test]
fn a_lead_paths_land_whose_committed_plan_file_cannot_be_read_refuses_and_pushes_nothing() {
    let f = Fixture::new();
    commit_plan(&f, &["src/**"]);
    let tip = f.remote_tip();
    fs::write(f.main.join(PLAN_PATH), "not a plan\n").unwrap();
    let refusal = f
        .land(&lead_paths(&[PLAN_PATH]), &config(vec![gate("true")]))
        .unwrap_err();
    assert_eq!(refusal.code, "footprint-change-refused", "{refusal}");
    assert!(
        refusal
            .detail
            .contains("committed footprint cannot be read"),
        "{refusal}"
    );
    assert_eq!(f.remote_tip(), tip);
}

#[test]
fn a_lead_paths_land_of_its_plan_file_with_the_footprint_kept_lands() {
    let f = Fixture::new();
    commit_plan(&f, &["src/**", "docs/**"]);
    // The list is reordered and the body edited; the footprint is the same set.
    let mut text = plan_text(&["docs/**", "src/**"]);
    text.push_str("\nA note.\n");
    fs::write(f.main.join(PLAN_PATH), text).unwrap();
    let out = f
        .land(&lead_paths(&[PLAN_PATH]), &config(vec![gate("true")]))
        .unwrap();
    assert_eq!(out.landed_paths, vec![PLAN_PATH.to_string()]);
    assert_eq!(out.main_sha, f.remote_tip());
}

#[test]
fn a_paths_land_without_a_footprint_does_not_look_at_plan_files() {
    let f = Fixture::new();
    commit_plan(&f, &["src/**"]);
    fs::write(f.main.join(PLAN_PATH), plan_text(&["docs/**"])).unwrap();
    let out = f
        .land(&paths(&[PLAN_PATH]), &config(vec![gate("true")]))
        .unwrap();
    assert_eq!(out.main_sha, f.remote_tip());
}

#[test]
fn a_regeneration_with_when_runs_only_when_a_landed_path_matches() {
    for (glob, ran) in [("*.rs", false), ("*.txt", true)] {
        let f = Fixture::new();
        let file = "src.txt";
        f.topic("topic", &[(file, "x\n")]);
        let marker = std::env::temp_dir().join(format!(
            "fgos-regen-when-{}-{}",
            std::process::id(),
            if ran { "ran" } else { "skipped" }
        ));
        let _ = fs::remove_file(&marker);
        let cfg = LandConfig {
            gates: vec![gate("true")],
            regenerate: Some(Regenerate {
                run: format!("touch {}", marker.display()),
                files: vec!["census.txt".into()],
                when: vec![glob.into()],
            }),
        };
        f.land(&branch("topic"), &cfg).unwrap();
        assert_eq!(marker.exists(), ran, "{glob}");
        let _ = fs::remove_file(&marker);
    }
}
