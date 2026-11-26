// Linux only: its Git children run through a borrowed lock, which on Windows needs a helper executable that a library test harness is not; the Windows proof of this port runs from apps/fgos/tests/windows_git_custody.rs, and its fixture uses Unix permissions.
#![cfg(target_os = "linux")]
//! The landing use case against a real bare remote and a real clone. The Land port's own refusals
//! are owned by `packages/git/rust/tests/land.rs`; one pass-through proof lives here.
use fgos_git::{GitDriver, RemoteGrant, RepoHandle, ResolveRepo};
use fgos_supervision::land::{
    catch_up, clean_landed_worktree, land, BacklogPort, BacklogRef, Gate, LandCommand, LandConfig,
    LandOutcome, LandPorts, Regenerate, ShellRunner,
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
            let full = self.main.join(path);
            if let Some(parent) = full.parent() {
                let _ = fs::create_dir_all(parent);
            }
            fs::write(&full, text).unwrap();
            git(&self.main, &["add", path]);
        }
        git(&self.main, &["commit", "-qm", name]);
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
        backlog_index: None,
        worktree_removal: None,
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
fn two_branches_that_change_a_file_under_a_declared_glob_land_one_after_the_other_the_second_regenerated(
) {
    let f = Fixture::new();
    f.topic(
        "one",
        &[("gen/data.txt", "one-gen\n"), ("src-one.txt", "one\n")],
    );
    f.topic(
        "two",
        &[
            ("gen/data.txt", "two-gen\n"),
            ("gen/obsolete.txt", "obsolete\n"),
            ("src-two.txt", "two\n"),
        ],
    );

    let cfg = LandConfig {
        gates: vec![gate("true")],
        regenerate: Some(Regenerate {
            run: "mkdir -p gen && rm -f gen/obsolete.txt && cat src-*.txt > gen/data.txt".into(),
            files: vec!["gen/**".into()],
            when: Vec::new(),
        }),
    };

    let out1 = f.land(&branch("one"), &cfg).unwrap();
    assert_eq!(out1.main_sha, f.remote_tip());
    assert_eq!(
        fs::read_to_string(f.main.join("gen/data.txt")).unwrap(),
        "one\n"
    );

    let out2 = f.land(&branch("two"), &cfg).unwrap();
    assert_eq!(out2.main_sha, f.remote_tip());
    assert_eq!(
        fs::read_to_string(f.main.join("gen/data.txt")).unwrap(),
        "one\ntwo\n"
    );
    assert_eq!(
        fs::read_to_string(f.main.join("src-two.txt")).unwrap(),
        "two\n"
    );
    assert!(
        !f.main.join("gen/obsolete.txt").exists(),
        "a tracked glob match the command deletes stays deleted in the landed commit"
    );
    let tree = git(&f.main, &["ls-tree", "-r", "--name-only", &out2.main_sha]);
    assert!(
        !tree.lines().any(|l| l == "gen/obsolete.txt"),
        "deleted file must not exist in landed commit tree"
    );
}

#[test]
fn regeneration_ignores_unrelated_non_utf8_tracked_filename() {
    use std::os::unix::ffi::OsStrExt;
    let f = Fixture::new();
    let non_utf8_name = std::ffi::OsStr::from_bytes(b"unrelated-\xff.txt");
    fs::write(f.other.join(non_utf8_name), "unrelated\n").unwrap();
    let o = Command::new("git")
        .arg("-C")
        .arg(&f.other)
        .arg("add")
        .arg(non_utf8_name)
        .output()
        .unwrap();
    assert!(o.status.success());
    git(&f.other, &["commit", "-qm", "add non-utf8 on trunk"]);
    git(&f.other, &["push", "-q", "origin", "trunk"]);
    git(&f.main, &["pull", "-q", "--ff-only", "origin", "trunk"]);

    f.topic(
        "topic",
        &[("census.txt", "topic-census\n"), ("src.txt", "topic-src\n")],
    );
    f.move_remote("census.txt", "trunk-census\n");

    let cfg = LandConfig {
        gates: vec![gate("true")],
        regenerate: Some(Regenerate {
            run: "cp src.txt census.txt".into(),
            files: vec!["census.txt".into(), "gen/**".into()],
            when: Vec::new(),
        }),
    };
    let out = f.land(&branch("topic"), &cfg).unwrap();
    assert_eq!(out.main_sha, f.remote_tip());
    assert_eq!(
        fs::read_to_string(f.main.join("census.txt")).unwrap(),
        "topic-src\n"
    );
}

#[test]
fn matching_symlink_on_disk_refuses_and_referent_is_untouched() {
    let f = Fixture::new();
    f.move_remote("outside.txt", "original-target\n");
    git(&f.main, &["pull", "-q", "--ff-only", "origin", "trunk"]);

    f.topic(
        "topic",
        &[("census.txt", "topic-census\n"), ("src.txt", "src\n")],
    );
    f.move_remote("census.txt", "trunk-census\n");

    let cfg = LandConfig {
        gates: vec![gate("true")],
        regenerate: Some(Regenerate {
            run: "mkdir -p gen && ln -sf ../outside.txt gen/symlink.txt".into(),
            files: vec!["census.txt".into(), "gen/**".into()],
            when: Vec::new(),
        }),
    };

    let refusal = f.land(&branch("topic"), &cfg).unwrap_err();
    assert_eq!(refusal.code, "land-regenerate-failed");
    assert!(
        refusal.detail.contains("gen/symlink.txt"),
        "must name the offending symlink path: {}",
        refusal.detail
    );
    assert_eq!(
        fs::read_to_string(f.other.join("outside.txt")).unwrap(),
        "original-target\n",
        "referent of the symlink must be untouched"
    );
}

#[test]
fn matching_tracked_symlink_refuses_and_referent_is_untouched() {
    use std::os::unix::fs::symlink;
    let f = Fixture::new();
    f.move_remote("outside.txt", "original-target\n");
    git(&f.main, &["pull", "-q", "--ff-only", "origin", "trunk"]);

    git(&f.main, &["checkout", "-qb", "topic"]);
    fs::create_dir_all(f.main.join("gen")).unwrap();
    symlink("../outside.txt", f.main.join("gen/symlink.txt")).unwrap();
    git(&f.main, &["add", "gen/symlink.txt"]);
    git(&f.main, &["commit", "-qm", "topic with symlink"]);
    git(&f.main, &["checkout", "-q", "trunk"]);

    f.move_remote("src.txt", "trunk-src\n");

    let cfg = LandConfig {
        gates: vec![gate("true")],
        regenerate: Some(Regenerate {
            run: "true".into(),
            files: vec!["gen/**".into()],
            when: Vec::new(),
        }),
    };

    let refusal = f.land(&branch("topic"), &cfg).unwrap_err();
    assert_eq!(refusal.code, "land-regenerate-failed");
    assert!(
        refusal.detail.contains("gen/symlink.txt"),
        "must name the offending symlink path: {}",
        refusal.detail
    );
    assert_eq!(
        fs::read_to_string(f.other.join("outside.txt")).unwrap(),
        "original-target\n",
        "referent must remain untouched"
    );
}

#[test]
fn a_conflict_outside_the_declared_files_refuses_before_any_candidate_is_prepared() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "topic\n")]);
    f.move_remote("a", "trunk\n");
    let before = f.remote_tip();
    let cfg = LandConfig {
        gates: vec![gate("true")],
        regenerate: Some(Regenerate {
            run: "echo gen > gen/out.txt".into(),
            files: vec!["gen/**".into()],
            when: Vec::new(),
        }),
    };
    let refusal = f.land(&branch("topic"), &cfg).unwrap_err();
    assert_eq!(refusal.code, "land-conflict-aborted");
    assert!(refusal.detail.contains('a'));
    assert_eq!(git(&f.main, &["worktree", "list"]).lines().count(), 1);
    assert_eq!(f.remote_tip(), before);
}

#[test]
fn invalid_regenerate_glob_refuses_naming_entry() {
    let f = Fixture::new();
    f.topic("topic", &[("a", "topic\n")]);
    let cfg = LandConfig {
        gates: vec![gate("true")],
        regenerate: Some(Regenerate {
            run: "true".into(),
            files: vec!["/abs/path".into()],
            when: Vec::new(),
        }),
    };
    let refusal = f.land(&branch("topic"), &cfg).unwrap_err();
    assert_eq!(refusal.code, "land-regenerate-failed");
    assert!(refusal.detail.contains("/abs/path"));
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
fn a_paths_land_whose_gate_gets_plans_fails_when_handed_the_plan() {
    let f = Fixture::new();
    let plan_dir = f.main.join("plans").join("my-plan");
    fs::create_dir_all(&plan_dir).unwrap();
    fs::write(plan_dir.join("plan.md"), "content\n").unwrap();
    let remote_before = f.remote_tip();
    let local_before = f.local_tip();
    let script = f.temp.join("gate.sh");
    fs::write(
        &script,
        "#!/bin/sh\nfor arg in \"$@\"; do if [ \"$arg\" = \"plans/my-plan\" ]; then echo \"plan rejected\" >&2; exit 1; fi; done\nexit 0\n",
    )
    .unwrap();
    let cfg = config(vec![gate_when(
        &format!("sh {} {{plans}}", script.display()),
        &["plans/*/plan.md"],
    )]);
    let refusal = f
        .land(&paths(&["plans/my-plan/plan.md"]), &cfg)
        .unwrap_err();
    assert_eq!(refusal.code, "land-gate-failed");
    assert!(refusal.detail.contains("plan rejected"));
    assert_eq!(f.remote_tip(), remote_before);
    assert_eq!(f.local_tip(), local_before);
}

#[test]
fn a_paths_land_whose_gate_gets_plans_expands_plan_directories() {
    let f = Fixture::new();
    let plan_dir1 = f.main.join("plans").join("plan-a");
    let plan_dir2 = f.main.join("plans").join("plan-b");
    fs::create_dir_all(&plan_dir1).unwrap();
    fs::create_dir_all(&plan_dir2).unwrap();
    fs::write(plan_dir1.join("plan.md"), "content a\n").unwrap();
    fs::write(plan_dir2.join("plan.md"), "content b\n").unwrap();
    let out_file = f.temp.join("plans.out");
    let cfg = config(vec![gate_when(
        &format!("printf '%s\\n' {{plans}} > {}", out_file.display()),
        &["plans/*/plan.md"],
    )]);
    let out = f
        .land(
            &paths(&["plans/plan-a/plan.md", "plans/plan-b/plan.md"]),
            &cfg,
        )
        .unwrap();
    assert_eq!(
        out.landed_paths,
        vec![
            "plans/plan-a/plan.md".to_string(),
            "plans/plan-b/plan.md".to_string()
        ]
    );
    assert_eq!(
        fs::read_to_string(out_file).unwrap(),
        "--plan\nplans/plan-a\n--plan\nplans/plan-b\n"
    );
}

#[test]
fn a_paths_land_plans_placeholder_ignores_excluded_and_missing_plan_dirs() {
    let f = Fixture::new();
    let backlog_dir = f.main.join("plans").join("backlog");
    fs::create_dir_all(&backlog_dir).unwrap();
    fs::write(backlog_dir.join("p-1.md"), "content\n").unwrap();
    let no_plan_dir = f.main.join("plans").join("no-plan-md");
    fs::create_dir_all(&no_plan_dir).unwrap();
    fs::write(no_plan_dir.join("other.md"), "content\n").unwrap();
    let out_file = f.temp.join("plans.out");
    let cfg = config(vec![gate(&format!(
        "printf 'P:%s\\n' \"{{plans}}\" > {}",
        out_file.display()
    ))]);
    let out = f
        .land(
            &paths(&["plans/backlog/p-1.md", "plans/no-plan-md/other.md"]),
            &cfg,
        )
        .unwrap();
    assert!(out.gates_run.is_empty(), "{:?}", out.gates_run);
    assert!(!out_file.exists());
    assert_eq!(out.main_sha, f.remote_tip());
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
fn a_paths_land_finishes_an_unpublished_land_door_commit_without_a_hand_push() {
    let f = Fixture::new();
    // Simulate a paths land stopping after scoped_commit:
    let slot = f
        .env
        .driver
        .acquire_merge_slot(
            &f.env.repo,
            &fgos_git::RefName::parse("refs/heads/trunk").unwrap(),
            30_000,
        )
        .unwrap();
    let baseline = f
        .env
        .driver
        .preflight_commit(&f.env.repo, slot.lend().unwrap(), None)
        .unwrap();
    fs::write(f.main.join("a"), "first unpushed commit\n").unwrap();
    // Simulate an interrupted land door where compaction was not completed, leaving the chain retained:
    let fgos_dir = f.main.join(".git/fgos");
    use std::os::unix::fs::PermissionsExt;
    fs::create_dir_all(&fgos_dir).unwrap();
    fs::set_permissions(&fgos_dir, fs::Permissions::from_mode(0o700)).unwrap();
    let comp_dir = fgos_dir.join("git/compacted");
    fs::create_dir_all(&comp_dir).unwrap();
    fs::set_permissions(fgos_dir.join("git"), fs::Permissions::from_mode(0o700)).unwrap();
    fs::set_permissions(&comp_dir, fs::Permissions::from_mode(0o500)).unwrap();
    let commit_res = f
        .env
        .driver
        .scoped_commit(
            &f.env.repo,
            slot.lend().unwrap(),
            &baseline,
            &fgos_git::CommitRequest {
                writes: vec!["a".into()],
                message: "first unpushed commit".into(),
            },
            "writer-1",
            "land-orphan-1",
            &fgos_git::wal::OsFileSystem,
        )
        .unwrap();
    let first_commit = commit_res.oid.unwrap();
    fs::set_permissions(&comp_dir, fs::Permissions::from_mode(0o700)).unwrap();
    drop(slot);

    assert_eq!(f.local_tip(), first_commit.as_str());
    assert_ne!(f.remote_tip(), first_commit.as_str());

    // A second writer's paths land succeeds with no hand push:
    fs::write(f.main.join("b"), "second landed commit\n").unwrap();
    let cmd = LandCommand {
        message: "second landed commit".into(),
        ..paths(&["b"])
    };
    let out = f.land(&cmd, &config(vec![gate("true")])).unwrap();

    assert_eq!(out.main_sha, f.remote_tip());
    let log = git(&f.remote, &["log", "--oneline", "refs/heads/trunk"]);
    assert!(log.contains("first unpushed commit"), "remote log: {log}");
    assert!(log.contains("second landed commit"), "remote log: {log}");
}

#[test]
fn a_by_hand_commit_on_local_main_still_refuses_land_target_ahead_and_is_never_pushed() {
    let f = Fixture::new();
    let remote_before = f.remote_tip();

    fs::write(f.main.join("a"), "by-hand commit\n").unwrap();
    git(&f.main, &["commit", "-qam", "by-hand commit"]);
    let local = f.local_tip();
    assert_ne!(local, remote_before);

    fs::write(f.main.join("b"), "second\n").unwrap();
    let refusal = f
        .land(&paths(&["b"]), &config(vec![gate("true")]))
        .unwrap_err();

    assert_eq!(refusal.code, "land-target-ahead", "{refusal}");
    assert!(
        refusal.detail.contains(&local),
        "detail must name foreign commit {local}: {refusal}"
    );
    assert_eq!(f.remote_tip(), remote_before);
}

#[test]
fn a_linked_worktree_commit_fast_forwarded_to_main_still_refuses_land_target_ahead() {
    use std::os::unix::fs::MetadataExt;
    let f = Fixture::new();
    let remote_before = f.remote_tip();

    let wt = f.temp.join("linked-wt");
    git(
        &f.main,
        &["worktree", "add", "-qb", "feature", wt.to_str().unwrap()],
    );

    let m = fs::metadata(&wt).unwrap();
    let birth = m
        .created()
        .unwrap_or(std::time::SystemTime::now())
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let key = format!("dispatch-cwd--{}-{}-{}.lock", m.dev(), m.ino(), birth);
    let lease = match fgos_holder_lock::acquire(
        &fgos_holder_lock::Resource::new("dispatch-cwd", f.main.join(".fgos/locks").join(key)),
        fgos_holder_lock::Mode::Ex,
        fgos_holder_lock::Wait::Ms(100),
        5000,
    ) {
        fgos_holder_lock::Acquire::Acquired(h) => h,
        other => panic!("{other:?}"),
    };
    let wt_repo = match f.env.driver.resolve_repo(&wt, &f.main).unwrap() {
        fgos_git::ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let baseline = f
        .env
        .driver
        .preflight_commit(
            &wt_repo,
            vec![fgos_holder_lock::BorrowedHandle::new(&lease).unwrap()],
            None,
        )
        .unwrap();
    fs::write(wt.join("c"), "worktree commit\n").unwrap();
    let commit_res = f
        .env
        .driver
        .scoped_commit(
            &wt_repo,
            vec![fgos_holder_lock::BorrowedHandle::new(&lease).unwrap()],
            &baseline,
            &fgos_git::CommitRequest {
                writes: vec!["c".into()],
                message: "worktree commit".into(),
            },
            "writer-wt",
            "scoped-wt-1",
            &fgos_git::wal::OsFileSystem,
        )
        .unwrap();
    let wt_commit = commit_res.oid.unwrap();
    drop(lease);

    git(&f.main, &["merge", "--ff-only", wt_commit.as_str()]);
    assert_eq!(f.local_tip(), wt_commit.as_str());
    assert_ne!(f.remote_tip(), wt_commit.as_str());

    fs::write(f.main.join("b"), "second\n").unwrap();
    let refusal = f
        .land(&paths(&["b"]), &config(vec![gate("true")]))
        .unwrap_err();

    assert_eq!(refusal.code, "land-target-ahead", "{refusal}");
    assert!(
        refusal.detail.contains(wt_commit.as_str()),
        "detail must name foreign commit {}: {refusal}",
        wt_commit.as_str()
    );
    assert_eq!(f.remote_tip(), remote_before);
}

#[test]
fn a_branch_land_does_not_push_unpushed_commits_without_holding_a_slot() {
    let f = Fixture::new();
    let slot = f
        .env
        .driver
        .acquire_merge_slot(
            &f.env.repo,
            &fgos_git::RefName::parse("refs/heads/trunk").unwrap(),
            30_000,
        )
        .unwrap();
    let baseline = f
        .env
        .driver
        .preflight_commit(&f.env.repo, slot.lend().unwrap(), None)
        .unwrap();
    fs::write(f.main.join("a"), "unpushed\n").unwrap();
    let commit_res = f
        .env
        .driver
        .scoped_commit(
            &f.env.repo,
            slot.lend().unwrap(),
            &baseline,
            &fgos_git::CommitRequest {
                writes: vec!["a".into()],
                message: "unpushed".into(),
            },
            "writer-1",
            "land-orphan-1",
            &fgos_git::wal::OsFileSystem,
        )
        .unwrap();
    let unpushed_commit = commit_res.oid.unwrap();
    drop(slot);

    f.topic("topic", &[("b", "branch change\n")]);
    let refusal = f
        .land(&branch("topic"), &config(vec![gate("true")]))
        .unwrap_err();
    assert_eq!(refusal.code, "land-target-ahead", "{refusal}");
    assert_ne!(f.remote_tip(), unpushed_commit.as_str());
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

const ITEM_A: &str = "plans/backlog/p-aaaaaaaaaa-first.md";
const ITEM_B: &str = "plans/backlog/p-bbbbbbbbbb-second.md";
const INDEX: &str = "plans/backlog.md";

const ID_A: &str = "p-aaaaaaaaaa";
const ID_B: &str = "p-bbbbbbbbbb";
const ID_C: &str = "p-cccccccccc";

fn item_text(id: &str, status: &str) -> String {
    format!("---\ncontract: backlog-item-v1\nid: {id}\ntitle: t\nstatus: {status}\npriority: P2\n---\n\n## Why\n\nBecause.\n")
}

fn plan_with_sources(status: &str, sources: &[&str]) -> String {
    let lines: String = sources.iter().map(|s| format!("  - {s}\n")).collect();
    format!("---\ncontract: plan-v1\ntitle: demo\nstatus: {status}\nsource:\n{lines}created: 2026-01-01\n---\n\n# Demo\n")
}

const CITED: [&str; 3] = [
    "p-aaaaaaaaaa",
    "plans/discussions/ds-aaaaaaaaaa-x/DISCUSSION.md",
    "p-bbbbbbbbbb",
];

thread_local! {
    /// The `committing` list of the last index request on this thread: the port boundary's one wiring proof.
    static LAST_COMMITTING: std::cell::RefCell<Vec<String>> = const { std::cell::RefCell::new(Vec::new()) };
}

/// The files the last index request said the land commits, sorted.
fn last_committing() -> Vec<String> {
    let mut seen = LAST_COMMITTING.with(|c| c.borrow().clone());
    seen.sort();
    seen
}

/// Stands in for the classifier the composition root owns: minted `p-<10 base32>`, legacy `p-<8 hex>`,
/// any other `p-` entry invalid, everything else not a backlog reference.
fn classify(src: &str) -> BacklogRef {
    // A legacy id may carry dashes of its own.
    if src.starts_with("wf-") {
        return BacklogRef::Legacy;
    }
    let Some(rest) = src.strip_prefix("p-") else {
        return BacklogRef::NotBacklog;
    };
    if rest.len() == 10 && rest.bytes().all(|b| matches!(b, b'a'..=b'z' | b'2'..=b'7')) {
        BacklogRef::Minted
    } else if rest.len() == 8 && rest.bytes().all(|b| b.is_ascii_hexdigit()) {
        BacklogRef::Legacy
    } else {
        BacklogRef::Invalid
    }
}

/// Stands in for the generator: one `<file> <status>` line per item file in the checkout. It records
/// `committing` and refuses a list that holds a glob or a repeat.
fn fixture_index(root: &Path, committing: &[String]) -> Result<String, String> {
    let mut unique = committing.to_vec();
    unique.sort();
    unique.dedup();
    if unique.len() != committing.len() || committing.iter().any(|c| c.contains(['*', '?'])) {
        return Err(format!("committing must be concrete files: {committing:?}"));
    }
    LAST_COMMITTING.with(|c| *c.borrow_mut() = committing.to_vec());
    let mut names: Vec<_> = fs::read_dir(root.join("plans/backlog"))
        .map_err(|e| e.to_string())?
        .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
        .collect();
    names.sort();
    let mut out = String::new();
    for name in names {
        let text = fs::read_to_string(root.join("plans/backlog").join(&name)).unwrap();
        let status = text
            .lines()
            .find_map(|l| l.strip_prefix("status: "))
            .unwrap_or("?");
        out.push_str(&format!("{name} {status}\n"));
    }
    Ok(out)
}

fn changes_outside_runtime(f: &Fixture) -> Vec<String> {
    git(&f.main, &["status", "--porcelain"])
        .lines()
        .filter(|line| !line.contains(".fgos/"))
        .map(|line| line.trim().to_owned())
        .collect()
}

/// A trunk holding a running plan that cites two items (and a discussion path), with an index.
fn running_plan_with_items(f: &Fixture) {
    fs::create_dir_all(f.main.join("plans/backlog")).unwrap();
    fs::create_dir_all(f.main.join("plans/260101-0000-demo")).unwrap();
    fs::write(f.main.join(ITEM_A), item_text(ID_A, "in-flight")).unwrap();
    fs::write(f.main.join(ITEM_B), item_text(ID_B, "proposed")).unwrap();
    fs::write(f.main.join(INDEX), fixture_index(&f.main, &[]).unwrap()).unwrap();
    fs::write(f.main.join(PLAN_PATH), plan_with_sources("running", &CITED)).unwrap();
    git(&f.main, &["add", "."]);
    git(&f.main, &["commit", "-qm", "plan and items"]);
    git(&f.main, &["push", "-q", "origin", "trunk"]);
}

fn land_with_index(
    f: &Fixture,
    command: &LandCommand,
) -> Result<fgos_supervision::land::LandOutcome, fgos_supervision::land::LandRefusal> {
    let next = || format!("idx-{}", f.ids.fetch_add(1, Ordering::Relaxed));
    land_with_index_config(f, command, &config(vec![gate("true")]), &next)
}

fn land_with_index_config(
    f: &Fixture,
    command: &LandCommand,
    config: &LandConfig,
    next: &dyn Fn() -> String,
) -> Result<fgos_supervision::land::LandOutcome, fgos_supervision::land::LandRefusal> {
    let mut with_port = ports(&f.env, next, 30_000);
    with_port.backlog_index = Some(BacklogPort {
        classify: &classify,
        index: &fixture_index,
    });
    land(command, config, &with_port)
}

#[test]
fn landing_a_plan_that_turns_done_commits_its_cited_items_as_done_and_the_regenerated_index() {
    let f = Fixture::new();
    running_plan_with_items(&f);
    fs::write(f.main.join(PLAN_PATH), plan_with_sources("done", &CITED)).unwrap();
    // A lead whose footprint covers only its plan directory still lands: the item and index paths are
    // the door's own writes, and the footprint check reads plan files only.
    let out = land_with_index(&f, &lead_paths(&[PLAN_PATH])).unwrap();
    let mut changed: Vec<_> = git(&f.main, &["show", "--name-only", "--format=", "HEAD"])
        .lines()
        .map(str::to_owned)
        .collect();
    changed.sort();
    let mut expected = vec![INDEX, ITEM_A, ITEM_B, PLAN_PATH];
    expected.sort();
    assert_eq!(changed, expected);
    // The index generator is told the plan and the closed items, and nothing else.
    assert_eq!(last_committing(), vec![PLAN_PATH, ITEM_A, ITEM_B]);
    assert_eq!(out.main_sha, f.remote_tip());
    assert_eq!(
        fs::read_to_string(f.main.join(ITEM_A)).unwrap(),
        item_text(ID_A, "done")
    );
    assert_eq!(
        fs::read_to_string(f.main.join(ITEM_B)).unwrap(),
        item_text(ID_B, "done")
    );
    assert_eq!(
        fs::read_to_string(f.main.join(INDEX)).unwrap(),
        "p-aaaaaaaaaa-first.md done\np-bbbbbbbbbb-second.md done\n"
    );
    // Runtime state under .fgos/ (the lock directories) is not a change of the checkout.
    assert_eq!(changes_outside_runtime(&f), Vec::<String>::new());
}

#[test]
fn a_plan_citing_an_item_that_has_no_file_is_refused_with_nothing_committed_or_changed() {
    let f = Fixture::new();
    running_plan_with_items(&f);
    let done = plan_with_sources("done", &["p-aaaaaaaaaa", "p-cccccccccc"]);
    fs::write(f.main.join(PLAN_PATH), &done).unwrap();
    let tip = f.remote_tip();
    let refusal = land_with_index(&f, &paths(&[PLAN_PATH])).unwrap_err();
    assert_eq!(refusal.code, "land-backlog-item-missing", "{refusal}");
    assert!(refusal.detail.contains("p-cccccccccc"), "{refusal}");
    assert_eq!(f.remote_tip(), tip);
    assert_eq!(f.local_tip(), tip);
    assert_eq!(
        fs::read_to_string(f.main.join(ITEM_A)).unwrap(),
        item_text(ID_A, "in-flight")
    );
    assert_eq!(fs::read_to_string(f.main.join(PLAN_PATH)).unwrap(), done);
    // Runtime state under .fgos/ (the merge-slot lock) is not a caller change.
    let status = git(&f.main, &["status", "--porcelain"]);
    let changes: Vec<_> = status
        .lines()
        .filter(|line| !line.contains(".fgos/"))
        .map(str::trim)
        .collect();
    assert_eq!(changes, vec![format!("M {PLAN_PATH}")]);
}

#[test]
fn a_legacy_id_does_not_match_the_file_of_a_longer_id_that_it_prefixes() {
    let f = Fixture::new();
    running_plan_with_items(&f);
    let longer = "plans/backlog/wf-foo-bar-x.md";
    fs::write(f.main.join(longer), item_text("wf-foo-bar", "proposed")).unwrap();
    git(&f.main, &["add", "."]);
    git(&f.main, &["commit", "-qm", "longer legacy item"]);
    git(&f.main, &["push", "-q", "origin", "trunk"]);
    let done = plan_with_sources("done", &["wf-foo"]);
    fs::write(f.main.join(PLAN_PATH), &done).unwrap();
    // A legacy id that names no item is not an item the door closes: the plan lands alone and the
    // longer id's item is left as it was.
    land_with_index(&f, &paths(&[PLAN_PATH])).unwrap();
    assert_eq!(changed_in_head(&f), vec![PLAN_PATH]);
    assert_eq!(
        fs::read_to_string(f.main.join(longer)).unwrap(),
        item_text("wf-foo-bar", "proposed")
    );
}

#[test]
fn a_plan_land_that_is_not_a_turn_to_done_touches_no_item() {
    let f = Fixture::new();
    running_plan_with_items(&f);
    let head = |f: &Fixture| git(&f.main, &["show", "--name-only", "--format=", "HEAD"]);
    // Still running: an edit that is not a transition.
    let running = plan_with_sources("running", &CITED) + "\nNote.\n";
    fs::write(f.main.join(PLAN_PATH), running).unwrap();
    land_with_index(&f, &paths(&[PLAN_PATH])).unwrap();
    assert_eq!(head(&f), PLAN_PATH);
    // Already done at the tip: a later edit of the done plan changes no item.
    fs::write(f.main.join(PLAN_PATH), plan_with_sources("done", &CITED)).unwrap();
    land_with_index(&f, &paths(&[PLAN_PATH])).unwrap();
    fs::write(f.main.join(ITEM_A), item_text(ID_A, "in-flight")).unwrap();
    git(&f.main, &["commit", "-qam", "reopen"]);
    git(&f.main, &["push", "-q", "origin", "trunk"]);
    let more = plan_with_sources("done", &CITED) + "\nMore.\n";
    fs::write(f.main.join(PLAN_PATH), more).unwrap();
    land_with_index(&f, &paths(&[PLAN_PATH])).unwrap();
    assert_eq!(head(&f), PLAN_PATH);
    assert_eq!(
        fs::read_to_string(f.main.join(ITEM_A)).unwrap(),
        item_text(ID_A, "in-flight")
    );
}

fn counter(f: &Fixture) -> impl Fn() -> String + '_ {
    move || format!("idx-{}", f.ids.fetch_add(1, Ordering::Relaxed))
}

#[test]
fn a_local_commit_that_stays_after_a_failed_push_keeps_the_items_it_holds_done_in_the_tree() {
    let f = Fixture::new();
    running_plan_with_items(&f);
    fs::write(f.main.join(PLAN_PATH), plan_with_sources("done", &CITED)).unwrap();
    // The remote disappears after the gates: the push has no answer and the commit stays.
    let vanish = format!("mv {r} {r}.gone", r = f.remote.display());
    let next = counter(&f);
    let refusal = land_with_index_config(
        &f,
        &lead_paths(&[PLAN_PATH]),
        &config(vec![gate(&vanish)]),
        &next,
    )
    .unwrap_err();
    for item in [ITEM_A, ITEM_B] {
        let committed = git(&f.main, &["show", &format!("HEAD:{item}")]);
        let working = fs::read_to_string(f.main.join(item)).unwrap();
        assert_eq!(
            working.trim(),
            committed.trim(),
            "{item} after {refusal}: HEAD and the tree agree"
        );
    }
}

#[test]
fn a_cited_item_with_uncommitted_edits_is_refused_and_keeps_them() {
    let f = Fixture::new();
    running_plan_with_items(&f);
    let edited = item_text(ID_A, "in-flight") + "\nMy own notes.\n";
    fs::write(f.main.join(ITEM_A), &edited).unwrap();
    fs::write(f.main.join(PLAN_PATH), plan_with_sources("done", &CITED)).unwrap();
    let tip = f.local_tip();
    let refusal = land_with_index(&f, &lead_paths(&[PLAN_PATH])).unwrap_err();
    assert_eq!(refusal.code, "land-backlog-item-dirty", "{refusal}");
    assert_eq!(f.local_tip(), tip);
    assert_eq!(fs::read_to_string(f.main.join(ITEM_A)).unwrap(), edited);
    assert_eq!(
        fs::read_to_string(f.main.join(ITEM_B)).unwrap(),
        item_text(ID_B, "proposed")
    );
}

#[test]
fn a_repeat_land_after_an_interrupted_one_commits_items_already_marked_done_in_the_tree() {
    let f = Fixture::new();
    running_plan_with_items(&f);
    // What a crash between the door's writes and the commit leaves: items done in the tree only.
    fs::write(f.main.join(ITEM_A), item_text(ID_A, "done")).unwrap();
    fs::write(f.main.join(INDEX), "stale\n").unwrap();
    fs::write(f.main.join(PLAN_PATH), plan_with_sources("done", &CITED)).unwrap();
    land_with_index(&f, &lead_paths(&[PLAN_PATH])).unwrap();
    for item in [ITEM_A, ITEM_B] {
        assert_eq!(
            git(&f.main, &["show", &format!("HEAD:{item}")]),
            item_text(if item == ITEM_A { ID_A } else { ID_B }, "done").trim(),
            "{item}"
        );
    }
    assert_eq!(
        git(&f.main, &["show", &format!("HEAD:{INDEX}")]),
        "p-aaaaaaaaaa-first.md done\np-bbbbbbbbbb-second.md done"
    );
    assert_eq!(changes_outside_runtime(&f), Vec::<String>::new());
}

#[test]
fn a_source_that_looks_like_a_backlog_id_but_is_not_minted_is_refused_while_other_shapes_pass() {
    let f = Fixture::new();
    running_plan_with_items(&f);
    let bad = plan_with_sources("done", &["p-aaaaaaaaaa", "p-short"]);
    fs::write(f.main.join(PLAN_PATH), &bad).unwrap();
    let refusal = land_with_index(&f, &paths(&[PLAN_PATH])).unwrap_err();
    assert_eq!(refusal.code, "land-plan-source-invalid", "{refusal}");
    assert!(refusal.detail.contains("p-short"), "{refusal}");
    assert_eq!(
        fs::read_to_string(f.main.join(ITEM_A)).unwrap(),
        item_text(ID_A, "in-flight")
    );
    // A legacy-shaped id is not an item the door closes.
    let legacy = plan_with_sources("done", &["p-aaaaaaaaaa", "pbi-12", "legacy-7"]);
    fs::write(f.main.join(PLAN_PATH), legacy).unwrap();
    land_with_index(&f, &paths(&[PLAN_PATH])).unwrap();
    assert_eq!(
        git(&f.main, &["show", &format!("HEAD:{ITEM_A}")]),
        item_text(ID_A, "done").trim()
    );
}

#[test]
fn a_dropped_cited_item_is_left_as_it_is() {
    let f = Fixture::new();
    running_plan_with_items(&f);
    let dropped = "plans/backlog/p-cccccccccc-third.md";
    fs::write(f.main.join(dropped), item_text(ID_C, "dropped")).unwrap();
    git(&f.main, &["add", "."]);
    git(&f.main, &["commit", "-qm", "dropped item"]);
    git(&f.main, &["push", "-q", "origin", "trunk"]);
    let sources = ["p-aaaaaaaaaa", "p-cccccccccc"];
    fs::write(f.main.join(PLAN_PATH), plan_with_sources("done", &sources)).unwrap();
    land_with_index(&f, &paths(&[PLAN_PATH])).unwrap();
    assert_eq!(
        fs::read_to_string(f.main.join(dropped)).unwrap(),
        item_text(ID_C, "dropped")
    );
    assert_eq!(
        fs::read_to_string(f.main.join(ITEM_A)).unwrap(),
        item_text(ID_A, "done")
    );
}

fn changed_in_head(f: &Fixture) -> Vec<String> {
    let mut changed: Vec<_> = git(&f.main, &["show", "--name-only", "--format=", "HEAD"])
        .lines()
        .map(str::to_owned)
        .collect();
    changed.sort();
    changed
}

#[test]
fn a_plan_turning_done_whose_cited_items_are_all_done_still_commits_the_regenerated_index() {
    let f = Fixture::new();
    fs::create_dir_all(f.main.join("plans/backlog")).unwrap();
    fs::create_dir_all(f.main.join("plans/260101-0000-demo")).unwrap();
    fs::write(f.main.join(ITEM_A), item_text(ID_A, "done")).unwrap();
    fs::write(f.main.join(ITEM_B), item_text(ID_B, "dropped")).unwrap();
    fs::write(f.main.join(INDEX), "stale\n").unwrap();
    fs::write(f.main.join(PLAN_PATH), plan_with_sources("running", &CITED)).unwrap();
    git(&f.main, &["add", "."]);
    git(&f.main, &["commit", "-qm", "plan and settled items"]);
    git(&f.main, &["push", "-q", "origin", "trunk"]);
    fs::write(f.main.join(PLAN_PATH), plan_with_sources("done", &CITED)).unwrap();
    land_with_index(&f, &lead_paths(&[PLAN_PATH])).unwrap();
    assert_eq!(changed_in_head(&f), vec![PLAN_PATH, INDEX]);
    assert_eq!(
        git(&f.main, &["show", &format!("HEAD:{INDEX}")]),
        "p-aaaaaaaaaa-first.md done\np-bbbbbbbbbb-second.md dropped"
    );
}

#[test]
fn a_legacy_id_that_names_an_item_file_is_closed_and_a_malformed_p_entry_is_refused() {
    let f = Fixture::new();
    running_plan_with_items(&f);
    let legacy = "plans/backlog/p-0123abcd-legacy.md";
    fs::write(f.main.join(legacy), item_text("p-0123abcd", "proposed")).unwrap();
    git(&f.main, &["add", "."]);
    git(&f.main, &["commit", "-qm", "legacy item"]);
    git(&f.main, &["push", "-q", "origin", "trunk"]);
    let bad = plan_with_sources("done", &["p-0123abcd", "p-XYZ"]);
    fs::write(f.main.join(PLAN_PATH), &bad).unwrap();
    let refusal = land_with_index(&f, &paths(&[PLAN_PATH])).unwrap_err();
    assert_eq!(refusal.code, "land-plan-source-invalid", "{refusal}");
    assert!(refusal.detail.contains("p-XYZ"), "{refusal}");
    let good = plan_with_sources("done", &["p-0123abcd"]);
    fs::write(f.main.join(PLAN_PATH), good).unwrap();
    land_with_index(&f, &paths(&[PLAN_PATH])).unwrap();
    assert_eq!(
        git(&f.main, &["show", &format!("HEAD:{legacy}")]),
        item_text("p-0123abcd", "done").trim()
    );
}

#[test]
fn an_item_the_caller_names_lands_with_the_caller_bytes_set_to_done() {
    let f = Fixture::new();
    running_plan_with_items(&f);
    let edited = item_text(ID_A, "in-flight") + "\nMy own notes.\n";
    fs::write(f.main.join(ITEM_A), &edited).unwrap();
    let plan = plan_with_sources("done", &["p-aaaaaaaaaa"]);
    fs::write(f.main.join(PLAN_PATH), plan).unwrap();
    land_with_index(&f, &paths(&[PLAN_PATH, ITEM_A])).unwrap();
    assert_eq!(
        git(&f.main, &["show", &format!("HEAD:{ITEM_A}")]),
        (item_text(ID_A, "done") + "\nMy own notes.\n").trim()
    );
    assert_eq!(last_committing(), vec![PLAN_PATH, ITEM_A]);
}

#[test]
fn a_new_item_landed_together_with_the_plan_that_cites_it_is_closed_in_the_same_commit() {
    let f = Fixture::new();
    running_plan_with_items(&f);
    let new_item = "plans/backlog/p-cccccccccc-third.md";
    fs::write(f.main.join(new_item), item_text(ID_C, "proposed")).unwrap();
    let plan = plan_with_sources("done", &["p-cccccccccc"]);
    fs::write(f.main.join(PLAN_PATH), plan).unwrap();
    land_with_index(&f, &paths(&[PLAN_PATH, new_item])).unwrap();
    assert_eq!(
        git(&f.main, &["show", &format!("HEAD:{new_item}")]),
        item_text(ID_C, "done").trim()
    );
}

#[test]
fn a_glob_in_the_paths_reaches_the_index_as_the_files_it_matches() {
    let f = Fixture::new();
    running_plan_with_items(&f);
    let new_item = "plans/backlog/p-cccccccccc-third.md";
    fs::write(f.main.join(new_item), item_text(ID_C, "proposed")).unwrap();
    let plan = plan_with_sources("done", &["p-aaaaaaaaaa"]);
    fs::write(f.main.join(PLAN_PATH), plan).unwrap();
    land_with_index(&f, &paths(&[PLAN_PATH, "plans/backlog/p-c*.md"])).unwrap();
    assert_eq!(last_committing(), vec![PLAN_PATH, ITEM_A, new_item]);
}

#[test]
fn branch_land_removes_clean_worktree() {
    let f = Fixture::new();

    let clean_wt = f.temp.join("clean-worktree");
    git(
        &f.main,
        &[
            "worktree",
            "add",
            clean_wt.to_str().unwrap(),
            "-b",
            "topic-clean",
        ],
    );
    fs::write(clean_wt.join("file-clean.txt"), "clean-content\n").unwrap();
    git(&clean_wt, &["add", "."]);
    git(&clean_wt, &["commit", "-qm", "clean branch commit"]);

    let clean_path_lossy = clean_wt.to_string_lossy().to_string();
    let passed_targets = std::cell::RefCell::new(Vec::new());

    let fake_remove = |path: &Path, target: &str| -> Result<(), String> {
        passed_targets
            .borrow_mut()
            .push((path.to_string_lossy().to_string(), target.to_string()));
        if path == clean_wt {
            Ok(())
        } else {
            Err("unknown-worktree".to_string())
        }
    };

    let next = || format!("rm-{}", f.ids.fetch_add(1, Ordering::Relaxed));
    let mut ports_clean = ports(&f.env, &next, 30_000);
    ports_clean.worktree_removal = Some(&fake_remove);

    let clean_outcome = land(
        &branch("topic-clean"),
        &config(vec![gate("true")]),
        &ports_clean,
    )
    .unwrap();
    assert_eq!(
        clean_outcome.worktrees_removed,
        vec![clean_path_lossy.clone()]
    );
    assert!(clean_outcome.worktrees_kept.is_empty());
    assert!(clean_outcome.worktree_list_error.is_none());

    let targets = passed_targets.into_inner();
    assert_eq!(targets.len(), 1);
    assert_eq!(
        targets[0],
        (clean_path_lossy, "refs/heads/trunk".to_string())
    );
}

#[test]
fn branch_land_keeps_dirty_worktree() {
    let f = Fixture::new();

    let dirty_wt = f.temp.join("dirty-worktree");
    git(
        &f.main,
        &[
            "worktree",
            "add",
            dirty_wt.to_str().unwrap(),
            "-b",
            "topic-dirty",
        ],
    );
    fs::write(dirty_wt.join("file-dirty.txt"), "dirty-content\n").unwrap();
    git(&dirty_wt, &["add", "."]);
    git(&dirty_wt, &["commit", "-qm", "dirty branch commit"]);
    fs::write(dirty_wt.join("uncommitted.txt"), "dirty changes\n").unwrap();

    let dirty_path_lossy = dirty_wt.to_string_lossy().to_string();
    let passed_targets = std::cell::RefCell::new(Vec::new());

    let fake_remove = |path: &Path, target: &str| -> Result<(), String> {
        passed_targets
            .borrow_mut()
            .push((path.to_string_lossy().to_string(), target.to_string()));
        if path == dirty_wt {
            Err("worktree-dirty-preserved".to_string())
        } else {
            Err("unknown-worktree".to_string())
        }
    };

    let next_dirty = || format!("rm-{}", f.ids.fetch_add(1, Ordering::Relaxed));
    let mut ports_dirty = ports(&f.env, &next_dirty, 30_000);
    ports_dirty.worktree_removal = Some(&fake_remove);

    let dirty_outcome = land(
        &branch("topic-dirty"),
        &config(vec![gate("true")]),
        &ports_dirty,
    )
    .unwrap();
    assert!(dirty_outcome.worktrees_removed.is_empty());
    assert_eq!(dirty_outcome.worktrees_kept.len(), 1);
    assert_eq!(dirty_outcome.worktrees_kept[0].path, dirty_path_lossy);
    assert_eq!(
        dirty_outcome.worktrees_kept[0].code,
        "worktree-dirty-preserved"
    );
    assert!(dirty_outcome.worktree_list_error.is_none());

    let targets = passed_targets.into_inner();
    assert_eq!(targets.len(), 1);
    assert_eq!(
        targets[0],
        (dirty_path_lossy, "refs/heads/trunk".to_string())
    );
}

#[test]
fn paths_land_removes_nothing() {
    let f = Fixture::new();

    let passed_targets = std::cell::RefCell::new(Vec::new());
    let fake_remove = |path: &Path, target: &str| -> Result<(), String> {
        passed_targets
            .borrow_mut()
            .push((path.to_string_lossy().to_string(), target.to_string()));
        Ok(())
    };

    let next_paths = || format!("rm-{}", f.ids.fetch_add(1, Ordering::Relaxed));
    let mut ports_paths = ports(&f.env, &next_paths, 30_000);
    ports_paths.worktree_removal = Some(&fake_remove);

    fs::write(f.main.join("a"), "paths-landed-content\n").unwrap();
    let paths_outcome = land(&paths(&["a"]), &config(vec![gate("true")]), &ports_paths).unwrap();
    assert!(paths_outcome.worktrees_removed.is_empty());
    assert!(paths_outcome.worktrees_kept.is_empty());
    assert!(paths_outcome.worktree_list_error.is_none());
    assert!(passed_targets.into_inner().is_empty());
}

#[test]
fn branch_land_worktree_listing_failure_is_reported_without_failing_land() {
    let f = Fixture::new();

    let clean_wt = f.temp.join("clean-worktree");
    git(
        &f.main,
        &[
            "worktree",
            "add",
            clean_wt.to_str().unwrap(),
            "-b",
            "topic-fail-list",
        ],
    );
    fs::write(clean_wt.join("file-fail.txt"), "fail-content\n").unwrap();
    git(&clean_wt, &["add", "."]);
    git(&clean_wt, &["commit", "-qm", "fail branch commit"]);

    let removed_called = std::cell::Cell::new(false);
    let fake_remove = |_path: &Path, _target: &str| -> Result<(), String> {
        removed_called.set(true);
        Ok(())
    };

    let next = || format!("rm-{}", f.ids.fetch_add(1, Ordering::Relaxed));
    let mut ports = ports(&f.env, &next, 30_000);
    ports.worktree_removal = Some(&fake_remove);

    // Temporarily rename .git in main checkout so list_worktrees fails
    let git_dir = f.main.join(".git");
    let git_dir_bak = f.main.join(".git.bak");
    fs::rename(&git_dir, &git_dir_bak).unwrap();

    let mut outcome = LandOutcome {
        main_sha: "test-sha".to_string(),
        landed_paths: vec!["file-fail.txt".to_string()],
        retries: 0,
        gates_run: vec!["true".to_string()],
        worktrees_removed: Vec::new(),
        worktrees_kept: Vec::new(),
        worktree_list_error: None,
    };

    clean_landed_worktree(&ports, "topic-fail-list", "trunk", &mut outcome);

    // Restore .git so fixture cleanup succeeds
    fs::rename(&git_dir_bak, &git_dir).unwrap();

    assert!(outcome.worktrees_removed.is_empty());
    assert!(outcome.worktrees_kept.is_empty());
    assert_eq!(
        outcome.worktree_list_error.as_deref(),
        Some("git-command-failed")
    );
    assert!(!removed_called.get());
}

#[test]
fn a_literal_declared_directory_is_compared_beneath_it_next_to_a_glob_entry() {
    let f = Fixture::new();
    f.topic(
        "topic",
        &[("gen/a/b.txt", "topic-b\n"), ("src.txt", "src\n")],
    );
    f.move_remote("trunk-only.txt", "trunk\n");

    let cfg = LandConfig {
        gates: vec![gate("true")],
        regenerate: Some(Regenerate {
            run: "mkdir -p gen/a && echo regenerated > gen/a/b.txt && echo fresh > gen/a/new.txt"
                .into(),
            files: vec!["gen".into(), "x/**".into()],
            when: Vec::new(),
        }),
    };
    let out = f.land(&branch("topic"), &cfg).unwrap();
    assert_eq!(out.main_sha, f.remote_tip());
    assert_eq!(
        fs::read_to_string(f.main.join("gen/a/b.txt")).unwrap(),
        "regenerated\n"
    );
    assert_eq!(
        fs::read_to_string(f.main.join("gen/a/new.txt")).unwrap(),
        "fresh\n"
    );
}

#[test]
fn a_symlinked_directory_under_a_walk_origin_refuses_naming_the_path() {
    let f = Fixture::new();
    f.topic("topic", &[("src.txt", "src\n")]);
    f.move_remote("trunk-only.txt", "trunk\n");

    let cfg = LandConfig {
        gates: vec![gate("true")],
        regenerate: Some(Regenerate {
            run: "mkdir -p ../real-gen && echo x > ../real-gen/a.txt && ln -s ../real-gen gen"
                .into(),
            files: vec!["gen/*.txt".into()],
            when: Vec::new(),
        }),
    };
    let refusal = f.land(&branch("topic"), &cfg).unwrap_err();
    assert_eq!(refusal.code, "land-regenerate-failed");
    assert!(
        refusal.detail.contains("gen"),
        "must name the symlinked path: {}",
        refusal.detail
    );
}
