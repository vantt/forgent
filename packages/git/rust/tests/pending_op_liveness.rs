#![cfg(target_os = "linux")]
//! A pending Git operation's writer is told apart from a dead one by the
//! per-operation `git-operation` lock: admission answers `resource-busy`
//! while a live process holds it and `resource-recovery-required` once the
//! kernel has freed it.
include!("support/land.rs");
use std::io::{BufRead, BufReader, Read, Write};
use std::process::{Child, Stdio};

/// Parks the child inside the operation, after its intent is durable and
/// before the transfer, until the parent closes its stdin.
struct Park;
impl wal::FileSystem for Park {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        if step == "before-remote-transfer" {
            println!("PARKED");
            std::io::stdout().flush()?;
            let mut rest = Vec::new();
            std::io::stdin().read_to_end(&mut rest)?;
        }
        Ok(())
    }
}
fn name(text: &str) -> RefName {
    RefName::parse(text).unwrap()
}
/// A bare `origin` holding trunk, an `ahead` branch one commit past trunk, and
/// a remote-tracking trunk at that commit, as a completed fetch leaves it.
fn remote(f: &Fixture) -> RemoteGrant {
    let bare = f.temp.join("remote.git");
    git(&f.temp, &["init", "-q", "--bare", bare.to_str().unwrap()]);
    git(
        &f.main,
        &["remote", "add", "origin", bare.to_str().unwrap()],
    );
    git(&f.main, &["push", "-q", "origin", "trunk"]);
    git(&f.main, &["checkout", "-qb", "ahead"]);
    fs::write(f.main.join("a"), "ahead\n").unwrap();
    git(&f.main, &["commit", "-qam", "ahead"]);
    let ahead = git(&f.main, &["rev-parse", "HEAD"]);
    git(&f.main, &["checkout", "-q", "trunk"]);
    git(
        &f.main,
        &["update-ref", "refs/remotes/origin/trunk", &ahead],
    );
    RemoteGrant {
        name: "origin".into(),
        pinned_url: bare.to_str().unwrap().into(),
    }
}
#[test]
#[ignore = "invoked as a child by the liveness test"]
fn parked_child() {
    let f = Fixture::new();
    let grant = remote(&f);
    println!("FIXTURE {}", serde_json::json!({ "temp": f.temp }));
    std::io::stdout().flush().unwrap();
    let mapping = [RefMapping {
        source: name("refs/heads/ahead"),
        destination: name("refs/heads/trunk"),
    }];
    let _ = f.driver.transfer_refs(
        &f.repo,
        vec![],
        &grant,
        &mapping,
        "fixture",
        "pushing",
        true,
        &Park,
    );
    std::mem::forget(f);
}
#[allow(clippy::zombie_processes)] // the caller kills and waits for the child
fn spawn_parked() -> (Child, BufReader<std::process::ChildStdout>, PathBuf) {
    let mut c = Command::new(std::env::current_exe().unwrap())
        .args(["--exact", "parked_child", "--ignored", "--nocapture"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .unwrap();
    let mut out = BufReader::new(c.stdout.take().unwrap());
    let mut temp = None;
    loop {
        let mut line = String::new();
        assert!(out.read_line(&mut line).unwrap() > 0, "child exited early");
        if let Some(j) = line.strip_prefix("FIXTURE ") {
            let v: serde_json::Value = serde_json::from_str(j).unwrap();
            temp = Some(PathBuf::from(v["temp"].as_str().unwrap()));
        }
        if line.starts_with("PARKED") {
            return (c, out, temp.unwrap());
        }
    }
}
/// A catch-up of trunk from this process, beside the child's pending push.
fn second(temp: &Path) -> OperationError {
    let main = temp.join("repo");
    let driver = GitDriver::new(&temp.join("state")).unwrap();
    let repo = match driver.resolve_repo(&main, &main).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let old = Oid::parse(&git(&main, &["rev-parse", "trunk"]), repo.object_format()).unwrap();
    match driver.catch_up_main_checkout(
        &repo,
        vec![],
        &name("refs/heads/trunk"),
        &old,
        &name("refs/remotes/origin/trunk"),
        "other",
        "second",
        &wal::OsFileSystem,
    ) {
        Ok(_) => panic!("a catch-up must not be admitted beside a pending operation"),
        Err(e) => e,
    }
}
#[test]
fn a_live_writers_pending_operation_answers_busy_and_a_killed_one_recovery_required() {
    let (mut child, _out, temp) = spawn_parked();
    let live = second(&temp);
    assert_eq!(
        (live.code, live.cause.as_str(), live.retryable),
        (ResultCode::Busy, "resource-busy", true),
        "{live:?}"
    );
    assert_eq!(live.operation_id.as_deref(), Some("pushing"));
    child.kill().unwrap();
    child.wait().unwrap();
    let dead = second(&temp);
    assert_eq!(
        (dead.code, dead.cause.as_str()),
        (ResultCode::RecoveryRequired, "resource-recovery-required"),
        "{dead:?}"
    );
    assert_eq!(dead.operation_id.as_deref(), Some("pushing"));
    fs::remove_dir_all(&temp).unwrap();
}
#[test]
fn the_operation_lock_is_released_once_the_operation_has_finished() {
    let f = Fixture::new();
    let mut s = f
        .driver
        .prepare_land(
            &f.repo,
            vec![],
            &f.request,
            "fixture",
            "finished",
            &wal::OsFileSystem,
            0,
        )
        .unwrap();
    let e = evidence(&s);
    f.driver
        .publish_land(&f.repo, &mut s, &e, &wal::OsFileSystem, 0)
        .unwrap();
    drop(s);
    let common = fs::canonicalize(f.main.join(".git")).unwrap();
    let wal = wal::Wal::open_existing(&common, wal::OsFileSystem).unwrap();
    assert!(!wal.operation_live("finished"));
}
