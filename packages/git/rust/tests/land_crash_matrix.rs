#![cfg(target_os = "linux")]
include!("support/land.rs");
use std::io::{Read, Write};
use std::sync::Mutex;

struct Barrier {
    stop: usize,
    count: Mutex<usize>,
}
impl wal::FileSystem for Barrier {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        let mut count = self.count.lock().unwrap();
        *count += 1;
        println!("BOUNDARY {} {step}", *count);
        std::io::stdout().flush().unwrap();
        if *count == self.stop {
            unsafe {
                libc::kill(libc::getpid(), libc::SIGKILL);
            }
        }
        Ok(())
    }
}
#[test]
#[ignore = "invoked as a child with stdin configuration by the crash matrix"]
fn crash_child() {
    let mut input = String::new();
    std::io::stdin().read_to_string(&mut input).unwrap();
    let config: (usize, bool) = serde_json::from_str(&input).unwrap();
    let (stop, cleanup) = config;
    let f = Fixture::new();
    if !cleanup {
        fs::write(f.main.join("c"), "staged dirt\n").unwrap();
        fs::write(f.main.join("addition"), "staged addition\n").unwrap();
        git(&f.main, &["add", "c", "addition"]);
        fs::write(f.main.join("d"), "unstaged dirt\n").unwrap();
    }
    println!(
        "FIXTURE {}",
        serde_json::json!({"temp":f.temp,"request":f.request})
    );
    std::io::stdout().flush().unwrap();
    let barrier = Barrier {
        stop,
        count: Mutex::new(0),
    };
    if cleanup {
        let mut s = f
            .driver
            .prepare_land(&f.repo, vec![], &f.request, "fixture", "crash")
            .unwrap();
        let e = evidence(&s);
        f.driver.publish_land(&f.repo, &mut s, &e).unwrap();
        drop(s);
        let warnings = f
            .driver
            .acknowledge_land_with_filesystem(
                &f.repo,
                "fixture",
                "crash",
                "durable-consumer-entry",
                &barrier,
            )
            .unwrap();
        assert!(warnings.is_empty(), "{warnings:?}");
    } else {
        let mut s = f
            .driver
            .prepare_land_with_filesystem(&f.repo, vec![], &f.request, "fixture", "crash", &barrier)
            .unwrap();
        let e = evidence(&s);
        f.driver
            .publish_land_with_filesystem(&f.repo, &mut s, &e, &barrier)
            .unwrap();
    }
}
fn child(
    stop: usize,
    cleanup: bool,
) -> (PathBuf, LandRequest, Vec<String>, std::process::ExitStatus) {
    use std::process::Stdio;
    let mut c = Command::new(std::env::current_exe().unwrap())
        .args(["--exact", "crash_child", "--ignored", "--nocapture"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    write!(c.stdin.take().unwrap(), "[{stop},{cleanup}]").unwrap();
    let output = c.wait_with_output().unwrap();
    let stdout = String::from_utf8(output.stdout).unwrap();
    let fixture: serde_json::Value = serde_json::from_str(
        stdout
            .lines()
            .find_map(|l| l.strip_prefix("FIXTURE "))
            .unwrap_or_else(|| panic!("{stdout}\n{}", String::from_utf8_lossy(&output.stderr))),
    )
    .unwrap();
    let boundaries = stdout
        .lines()
        .filter_map(|l| l.strip_prefix("BOUNDARY "))
        .map(str::to_owned)
        .collect();
    (
        PathBuf::from(fixture["temp"].as_str().unwrap()),
        serde_json::from_value(fixture["request"].clone()).unwrap(),
        boundaries,
        output.status,
    )
}
#[test]
fn sigkill_at_every_acknowledged_wal_pin_cas_checkout_and_receipt_boundary() {
    let (_, _, boundaries, status) = child(usize::MAX, false);
    assert!(status.success());
    assert!(boundaries.iter().any(|s| s.ends_with("land-after-cas")));
    assert!(boundaries
        .iter()
        .any(|s| s.ends_with("land-after-read-tree")));
    println!(
        "Land crash matrix: {} deterministic SIGKILL points",
        boundaries.len()
    );
    for stop in 1..=boundaries.len() {
        let (temp, mut req, reached, status) = child(stop, false);
        use std::os::unix::process::ExitStatusExt;
        assert_eq!(
            status.signal(),
            Some(libc::SIGKILL),
            "stop={stop}: {reached:?}"
        );
        let main = temp.join("repo");
        let driver = GitDriver::new(&temp).unwrap();
        let repo = match driver.resolve_repo(&main, &main).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        let wal = wal::Wal::open(&repo).unwrap();
        let chain = wal.inspect("crash");
        let attempted = chain.as_ref().is_ok_and(|c| {
            c.records()
                .iter()
                .any(|r| matches!(r.phase, wal::Phase::TargetAttempt { .. }))
        });
        let staged = git(&main, &["ls-files", "--stage", "--", "c", "addition"]);
        let before = git(&main, &["rev-parse", "HEAD"]);
        if !attempted && chain.is_ok() {
            let refused = driver
                .prepare_land(&repo, vec![], &req, "successor", "successor-blocked")
                .err()
                .unwrap();
            assert_eq!(refused.cause, "land-abandoned-writer-mismatch");
        }
        let result = driver.recover_land(
            &repo,
            vec![],
            if attempted { "fixture" } else { "successor" },
            "crash",
        );
        if !attempted {
            if chain.is_ok() {
                assert!(result.is_ok(), "{}: {result:?}", boundaries[stop - 1]);
            }
            assert_eq!(git(&main, &["rev-parse", "HEAD"]), req.target);
        } else if before == req.target {
            let e = result.unwrap_err();
            assert_eq!(e.code, ResultCode::RecoveryRequired);
            assert_eq!(git(&main, &["rev-parse", "HEAD"]), before);
        } else {
            let receipt = result.unwrap_or_else(|e| panic!("{}: {e:?}", boundaries[stop - 1]));
            assert!(matches!(
                receipt.checkout,
                Checkout::Reconciled | Checkout::Pending
            ));
            let terminal_before = chain.as_ref().unwrap().outcome().is_some();
            assert_eq!(
                matches!(receipt.attribution, Attribution::ThisInvocationWonCas),
                terminal_before
            );
            assert_eq!(fs::read_to_string(main.join("a")).unwrap(), "incoming\n");
        }
        assert_eq!(fs::read(main.join("c")).unwrap(), b"staged dirt\n");
        assert_eq!(
            fs::read(main.join("addition")).unwrap(),
            b"staged addition\n"
        );
        assert_eq!(fs::read(main.join("d")).unwrap(), b"unstaged dirt\n");
        assert_eq!(git(&main, &["show", ":c"]), "staged dirt");
        assert_eq!(git(&main, &["show", ":addition"]), "staged addition");
        assert_eq!(
            git(&main, &["ls-files", "--stage", "--", "c", "addition"]),
            staged
        );
        // A crash cannot permanently poison either destination or checkout.
        // A new identity still passes the real gate and uses a fresh source.
        req.target = git(&main, &["rev-parse", "HEAD"]);
        git(&main, &["checkout", "-qb", "fresh-source"]);
        fs::write(main.join("b"), "fresh source\n").unwrap();
        git(&main, &["commit", "-qam", "fresh"]);
        req.source = git(&main, &["rev-parse", "HEAD"]);
        git(&main, &["checkout", "-q", "trunk"]);
        let mut s = driver
            .prepare_land(&repo, vec![], &req, "successor", "fresh")
            .unwrap_or_else(|e| panic!("{} fresh: {e:?}", boundaries[stop - 1]));
        let e = evidence(&s);
        driver.publish_land(&repo, &mut s, &e).unwrap();
        drop(s);
        fs::remove_dir_all(temp).unwrap();
    }
}
#[test]
fn interrupted_read_tree_preserves_index_lock_and_current_files_without_owned_index_evidence() {
    let f = Fixture::new();
    struct Stop;
    impl wal::FileSystem for Stop {
        fn checkpoint(&self, s: &'static str) -> std::io::Result<()> {
            if s == "land-before-read-tree" {
                Err(std::io::Error::other("interrupted"))
            } else {
                Ok(())
            }
        }
    }
    let mut s = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", "interrupted")
        .unwrap();
    let e = evidence(&s);
    assert!(f
        .driver
        .publish_land_with_filesystem(&f.repo, &mut s, &e, &Stop)
        .is_err());
    drop(s);
    fs::write(f.main.join("a"), "incoming\n").unwrap();
    let lock = f.main.join(".git/index.lock");
    fs::write(&lock, b"owned evidence unknown").unwrap();
    let index = fs::read(f.main.join(".git/index")).unwrap();
    let e = f
        .driver
        .recover_land(&f.repo, vec![], "fixture", "interrupted")
        .unwrap_err();
    assert_eq!(e.code, ResultCode::RecoveryRequired);
    assert_eq!(fs::read(lock).unwrap(), b"owned evidence unknown");
    assert_eq!(fs::read(f.main.join(".git/index")).unwrap(), index);
    assert_eq!(fs::read_to_string(f.main.join("a")).unwrap(), "incoming\n");
}

struct StopAt(&'static str);
impl wal::FileSystem for StopAt {
    fn checkpoint(&self, s: &'static str) -> std::io::Result<()> {
        if s == self.0 {
            Err(std::io::Error::other("interrupted at production boundary"))
        } else {
            Ok(())
        }
    }
}
fn attempted(f: &Fixture, id: &str) -> LandCandidate {
    let mut s = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", id)
        .unwrap();
    let c = s.candidate().unwrap().clone();
    let e = evidence(&s);
    assert!(f
        .driver
        .publish_land_with_filesystem(&f.repo, &mut s, &e, &StopAt("land-before-cas"))
        .is_err());
    c
}
#[test]
fn recovery_table_exact_old_checkout_finishes_and_never_attributes_the_cas() {
    let f = Fixture::new();
    let c = attempted(&f, "old-checkout");
    git(
        &f.main,
        &[
            "update-ref",
            &f.request.destination,
            &c.candidate,
            &c.target,
        ],
    );
    let r = f
        .driver
        .recover_land(&f.repo, vec![], "fixture", "old-checkout")
        .unwrap();
    assert!(matches!(r.checkout, Checkout::Reconciled));
    assert!(matches!(r.attribution, Attribution::EffectObservedOnly));
    assert!(r.local_effect.published_oid.is_none());
    assert_eq!(fs::read_to_string(f.main.join("a")).unwrap(), "incoming\n");
    for record in wal::Wal::open(&f.repo)
        .unwrap()
        .inspect("old-checkout")
        .unwrap()
        .records()
    {
        println!(
            "WAL_SCHEMA_RECORD {}",
            serde_json::to_string(record).unwrap()
        );
    }
}
#[test]
fn recovery_table_mixed_user_files_and_reflog_only_candidates_are_preserved() {
    let f = Fixture::new();
    let c = attempted(&f, "mixed");
    git(
        &f.main,
        &[
            "update-ref",
            &f.request.destination,
            &c.candidate,
            &c.target,
        ],
    );
    fs::write(f.main.join("a"), "valuable edit\n").unwrap();
    assert_eq!(
        f.driver
            .recover_land(&f.repo, vec![], "fixture", "mixed")
            .unwrap_err()
            .code,
        ResultCode::RecoveryRequired
    );
    assert_eq!(
        fs::read_to_string(f.main.join("a")).unwrap(),
        "valuable edit\n"
    );
    git(
        &f.main,
        &[
            "update-ref",
            &f.request.destination,
            &c.target,
            &c.candidate,
        ],
    );
    assert_eq!(
        f.driver
            .recover_land(&f.repo, vec![], "fixture", "mixed")
            .unwrap_err()
            .code,
        ResultCode::RecoveryRequired
    );
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), c.target);
    assert!(wal::Wal::open(&f.repo)
        .unwrap()
        .inspect("mixed")
        .unwrap()
        .outcome()
        .is_none());
}
#[test]
fn recovery_table_foreign_tip_and_foreign_writer_never_adopt_or_rollback() {
    let f = Fixture::new();
    let c = attempted(&f, "foreign");
    git(
        &f.main,
        &["update-ref", &f.request.destination, &c.source, &c.target],
    );
    assert_eq!(
        f.driver
            .recover_land(&f.repo, vec![], "fixture", "foreign")
            .unwrap_err()
            .code,
        ResultCode::RecoveryRequired
    );
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), c.source);
    assert_eq!(
        f.driver
            .recover_land(&f.repo, vec![], "different-writer", "foreign")
            .unwrap_err()
            .cause,
        "land-authority-mismatch"
    );
}
#[test]
fn recovery_table_pin_rewind_repairs_only_pin_and_native_ref_lock_is_preserved() {
    let f = Fixture::new();
    let c = attempted(&f, "rewind");
    let pin = "refs/fgos/git-operations/rewind/candidate";
    git(
        &f.main,
        &[
            "update-ref",
            &f.request.destination,
            &c.candidate,
            &c.target,
        ],
    );
    git(&f.main, &["update-ref", pin, &c.target, &c.candidate]);
    let lock = f.main.join(".git/refs/heads/trunk.lock");
    fs::write(&lock, "unknown owner").unwrap();
    assert_eq!(
        f.driver
            .recover_land(&f.repo, vec![], "fixture", "rewind")
            .unwrap_err()
            .code,
        ResultCode::RecoveryRequired
    );
    assert_eq!(fs::read_to_string(&lock).unwrap(), "unknown owner");
    fs::remove_file(lock).unwrap(); // fixture-owned artifact, explicit inspected repair
    let r = f
        .driver
        .recover_land(&f.repo, vec![], "fixture", "rewind")
        .unwrap();
    assert!(matches!(r.attribution, Attribution::EffectObservedOnly));
    assert_eq!(git(&f.main, &["rev-parse", pin]), c.candidate);
}
#[test]
fn recovery_table_corrupt_chain_and_missing_object_fail_closed() {
    let f = Fixture::new();
    let c = attempted(&f, "missing");
    git(
        &f.main,
        &[
            "update-ref",
            &f.request.destination,
            &c.candidate,
            &c.target,
        ],
    );
    let object = f
        .main
        .join(".git/objects")
        .join(&c.candidate[..2])
        .join(&c.candidate[2..]);
    let bytes = fs::read(&object).unwrap();
    fs::remove_file(&object).unwrap();
    assert!(f
        .driver
        .recover_land(&f.repo, vec![], "fixture", "missing")
        .is_err());
    fs::write(object, bytes).unwrap();
    let record = f
        .main
        .join(".git/fgos/git/operations/missing/00000001.json");
    fs::write(&record, b"corrupt").unwrap();
    assert!(f
        .driver
        .recover_land(&f.repo, vec![], "fixture", "missing")
        .is_err());
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), c.candidate);
}

#[test]
fn sigkill_at_every_cleanup_pin_and_compaction_boundary_preserves_replay() {
    let (_, _, boundaries, status) = child(usize::MAX, true);
    assert!(status.success());
    println!(
        "Land cleanup crash matrix: {} deterministic SIGKILL points",
        boundaries.len()
    );
    assert!(boundaries
        .iter()
        .any(|s| s.ends_with("land-cleanup-candidate")));
    assert!(boundaries.iter().any(|s| s.ends_with("remove-operation")));
    for stop in 1..=boundaries.len() {
        let (temp, mut request, _, status) = child(stop, true);
        use std::os::unix::process::ExitStatusExt;
        assert_eq!(status.signal(), Some(libc::SIGKILL));
        let main = temp.join("repo");
        let driver = GitDriver::new(&temp).unwrap();
        let repo = match driver.resolve_repo(&main, &main).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        let before = git(&main, &["rev-parse", "HEAD"]);
        let receipt = driver
            .recover_land(&repo, vec![], "fixture", "crash")
            .unwrap();
        assert_eq!(receipt.local_effect.published_oid.unwrap().as_str(), before);
        let warnings = driver
            .acknowledge_land(&repo, "fixture", "crash", "durable-consumer-entry")
            .unwrap();
        let wal = wal::Wal::open(&repo).unwrap();
        if warnings.is_empty() {
            assert!(wal.compacted("crash").unwrap().is_some());
        } else {
            assert!(
                warnings
                    .iter()
                    .all(|w| w.starts_with("land-compaction-deferred:")),
                "{}: {warnings:?}",
                boundaries[stop - 1]
            );
            assert!(wal.inspect("crash").unwrap().outcome().is_some());
        }
        assert!(driver
            .recover_land(&repo, vec![], "fixture", "crash")
            .is_ok());
        assert_eq!(git(&main, &["rev-parse", "HEAD"]), before);
        request.target = git(&main, &["rev-parse", "HEAD"]);
        git(&main, &["checkout", "-qb", "fresh-cleanup-source"]);
        fs::write(main.join("b"), "fresh cleanup recovery\n").unwrap();
        git(&main, &["commit", "-qam", "fresh"]);
        request.source = git(&main, &["rev-parse", "HEAD"]);
        git(&main, &["checkout", "-q", "trunk"]);
        let mut session = driver
            .prepare_land(&repo, vec![], &request, "fixture", "fresh-cleanup")
            .unwrap();
        let verification = evidence(&session);
        driver
            .publish_land(&repo, &mut session, &verification)
            .unwrap();
        drop(session);
        fs::remove_dir_all(temp).unwrap();
    }
}

// Trace only this test's descendants. These are real native Git syscall
// boundaries, not an environment-controlled branch in the production driver.
#[cfg(target_arch = "x86_64")]
#[test]
#[ignore = "isolated ptrace controller, invoked by native_read_tree_syscall_crashes"]
fn native_trace_controller() {
    use std::{collections::BTreeSet, os::unix::process::CommandExt, process::Stdio};
    let mut boundary = String::new();
    std::io::stdin().read_to_string(&mut boundary).unwrap();
    let mut command = Command::new(std::env::current_exe().unwrap());
    command
        .args(["--exact", "crash_child", "--ignored", "--nocapture"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    unsafe {
        command.pre_exec(|| {
            if libc::ptrace(libc::PTRACE_TRACEME, 0, 0, 0) < 0 {
                return Err(std::io::Error::last_os_error());
            }
            Ok(())
        });
    }
    let mut child = command.spawn().unwrap();
    write!(child.stdin.take().unwrap(), "[{},false]", usize::MAX).unwrap();
    let mut status = 0;
    let root = child.id() as libc::pid_t;
    assert_eq!(
        unsafe { libc::waitpid(root, &mut status, libc::__WALL) },
        root
    );
    let options = libc::PTRACE_O_TRACESYSGOOD
        | libc::PTRACE_O_TRACEFORK
        | libc::PTRACE_O_TRACEVFORK
        | libc::PTRACE_O_TRACECLONE
        | libc::PTRACE_O_TRACEEXEC
        | libc::PTRACE_O_EXITKILL;
    assert_eq!(
        unsafe { libc::ptrace(libc::PTRACE_SETOPTIONS, root, 0, options) },
        0
    );
    assert_eq!(unsafe { libc::ptrace(libc::PTRACE_SYSCALL, root, 0, 0) }, 0);
    let mut owned = BTreeSet::from([root]);
    let mut reached = false;
    loop {
        let pid = unsafe { libc::waitpid(-1, &mut status, libc::__WALL) };
        if pid < 0 {
            assert_eq!(
                std::io::Error::last_os_error().raw_os_error(),
                Some(libc::ECHILD)
            );
            break;
        }
        if libc::WIFEXITED(status) || libc::WIFSIGNALED(status) {
            owned.remove(&pid);
            continue;
        }
        if !libc::WIFSTOPPED(status) {
            continue;
        }
        owned.insert(pid);
        let event = status >> 16;
        if [
            libc::PTRACE_EVENT_FORK,
            libc::PTRACE_EVENT_VFORK,
            libc::PTRACE_EVENT_CLONE,
        ]
        .contains(&event)
        {
            let mut new_pid: libc::c_ulong = 0;
            assert_eq!(
                unsafe { libc::ptrace(libc::PTRACE_GETEVENTMSG, pid, 0, &mut new_pid) },
                0
            );
            owned.insert(new_pid as libc::pid_t);
        }
        if reached {
            unsafe {
                libc::kill(pid, libc::SIGKILL);
                libc::ptrace(libc::PTRACE_CONT, pid, 0, libc::SIGKILL);
            }
            continue;
        }
        if libc::WSTOPSIG(status) == (libc::SIGTRAP | 0x80) {
            let mut regs = std::mem::MaybeUninit::<libc::user_regs_struct>::uninit();
            assert_eq!(
                unsafe { libc::ptrace(libc::PTRACE_GETREGS, pid, 0, regs.as_mut_ptr()) },
                0
            );
            let regs = unsafe { regs.assume_init() };
            // On x86_64 syscall entry has -ENOSYS in rax; only inspect
            // successful syscall exits, so a file/lock really exists already.
            if (regs.rax as i64) >= 0 {
                let syscall = regs.orig_rax as libc::c_long;
                let cmd = fs::read(format!("/proc/{pid}/cmdline")).unwrap_or_default();
                let args: Vec<_> = cmd.split(|b| *b == 0).collect();
                let read_tree = args.contains(&b"read-tree".as_slice())
                    && args.contains(&b"-m".as_slice())
                    && args.contains(&b"-u".as_slice());
                if read_tree {
                    let fd_path = if syscall == libc::SYS_openat || syscall == libc::SYS_open {
                        Some(regs.rax)
                    } else if syscall == libc::SYS_write || syscall == libc::SYS_writev {
                        Some(regs.rdi)
                    } else {
                        None
                    };
                    let file =
                        fd_path.and_then(|fd| fs::read_link(format!("/proc/{pid}/fd/{fd}")).ok());
                    let is_index_lock = file
                        .as_ref()
                        .is_some_and(|p| p.ends_with(".git/index.lock"));
                    let is_main_a = file.as_ref().is_some_and(|p| p.ends_with("repo/a"));
                    let is_write = syscall == libc::SYS_write || syscall == libc::SYS_writev;
                    let is_open = syscall == libc::SYS_openat || syscall == libc::SYS_open;
                    let installed = if [libc::SYS_rename, libc::SYS_renameat, libc::SYS_renameat2]
                        .contains(&syscall)
                    {
                        let pointer = if syscall == libc::SYS_rename {
                            regs.rdi
                        } else {
                            regs.rsi
                        };
                        trace_string(pid, pointer).ends_with(b"/.git/index.lock")
                    } else {
                        false
                    };
                    reached = match boundary.as_str() {
                        "index-lock-created" => is_open && is_index_lock,
                        "tree-written" => is_write && is_main_a && regs.rax > 0,
                        "index-written" => is_write && is_index_lock && regs.rax > 0,
                        "index-installed" => installed,
                        _ => panic!("unknown native boundary"),
                    };
                    if reached {
                        for task in &owned {
                            unsafe {
                                libc::kill(*task, libc::SIGKILL);
                            }
                        }
                        unsafe {
                            libc::ptrace(libc::PTRACE_CONT, pid, 0, libc::SIGKILL);
                        }
                        continue;
                    }
                }
            }
        }
        let signal = libc::WSTOPSIG(status);
        let deliver = if signal == libc::SIGTRAP
            || signal == (libc::SIGTRAP | 0x80)
            || signal == libc::SIGSTOP
        {
            0
        } else {
            signal
        };
        unsafe {
            libc::ptrace(libc::PTRACE_SYSCALL, pid, 0, deliver);
        }
    }
    // waitpid above reaped the tracee and every owned descendant. Keep the
    // Child API in agreement: ECHILD is the expected already-reaped result.
    assert_eq!(child.wait().unwrap_err().raw_os_error(), Some(libc::ECHILD));
    let mut stdout = String::new();
    child
        .stdout
        .take()
        .unwrap()
        .read_to_string(&mut stdout)
        .unwrap();
    let mut stderr = String::new();
    child
        .stderr
        .take()
        .unwrap()
        .read_to_string(&mut stderr)
        .unwrap();
    assert!(
        reached,
        "native boundary {boundary} not reached: {stdout}\n{stderr}"
    );
    let fixture: serde_json::Value = serde_json::from_str(
        stdout
            .lines()
            .find_map(|l| l.strip_prefix("FIXTURE "))
            .unwrap(),
    )
    .unwrap();
    let temp = PathBuf::from(fixture["temp"].as_str().unwrap());
    let main = temp.join("repo");
    let driver = GitDriver::new(&temp).unwrap();
    let repo = match driver.resolve_repo(&main, &main).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let index = fs::read(main.join(".git/index")).unwrap();
    let a = fs::read(main.join("a")).unwrap();
    let lock = fs::read(main.join(".git/index.lock")).ok();
    if boundary == "tree-written" || boundary == "index-written" {
        assert_eq!(a, b"incoming\n");
        assert_eq!(git(&main, &["show", ":a"]), "base");
        assert!(lock.is_some());
    }
    let recovered = driver.recover_land(&repo, vec![], "fixture", "crash");
    if boundary == "index-installed" {
        assert!(matches!(
            recovered.unwrap().checkout,
            Checkout::Reconciled | Checkout::Pending
        ));
        let mut request: LandRequest = serde_json::from_value(fixture["request"].clone()).unwrap();
        request.target = git(&main, &["rev-parse", "HEAD"]);
        git(&main, &["checkout", "-qb", "after-native-kill"]);
        fs::write(main.join("b"), "fresh native recovery\n").unwrap();
        git(&main, &["commit", "-qam", "fresh"]);
        request.source = git(&main, &["rev-parse", "HEAD"]);
        git(&main, &["checkout", "-q", "trunk"]);
        let mut session = driver
            .prepare_land(&repo, vec![], &request, "fixture", "fresh-native")
            .unwrap();
        let verification = evidence(&session);
        driver
            .publish_land(&repo, &mut session, &verification)
            .unwrap();
        drop(session);
    } else {
        assert_eq!(recovered.unwrap_err().code, ResultCode::RecoveryRequired);
        assert_eq!(fs::read(main.join(".git/index")).unwrap(), index);
        assert_eq!(fs::read(main.join("a")).unwrap(), a);
        assert_eq!(fs::read(main.join(".git/index.lock")).ok(), lock);
        assert!(lock.is_some());
    }
    println!("native read-tree SIGKILL: {boundary}");
    fs::remove_dir_all(temp).unwrap();
}
#[cfg(target_arch = "x86_64")]
fn trace_string(pid: libc::pid_t, address: u64) -> Vec<u8> {
    let mut bytes = vec![];
    for offset in (0..4096).step_by(std::mem::size_of::<libc::c_long>()) {
        let word = unsafe {
            libc::ptrace(
                libc::PTRACE_PEEKDATA,
                pid,
                (address + offset as u64) as *const libc::c_void,
                0,
            )
        };
        for byte in word.to_ne_bytes() {
            if byte == 0 {
                return bytes;
            }
            bytes.push(byte);
        }
    }
    bytes
}
#[cfg(target_arch = "x86_64")]
#[test]
fn native_read_tree_syscall_crashes() {
    for boundary in [
        "index-lock-created",
        "tree-written",
        "index-written",
        "index-installed",
    ] {
        use std::process::Stdio;
        let mut child = Command::new(std::env::current_exe().unwrap())
            .args([
                "--exact",
                "native_trace_controller",
                "--ignored",
                "--nocapture",
            ])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        write!(child.stdin.take().unwrap(), "{boundary}").unwrap();
        let output = child.wait_with_output().unwrap();
        assert!(
            output.status.success(),
            "{boundary}: {}\n{}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
        println!("verified native read-tree SIGKILL: {boundary}");
    }
}

#[test]
fn fresh_land_waits_for_observed_predecessor_and_stat_refresh_is_safe() {
    let f = Fixture::new();
    // Create Y's source before X leaves its checkout unreconciled.
    git(&f.main, &["checkout", "-qb", "second", "source"]);
    fs::write(f.main.join("b"), "second\n").unwrap();
    git(&f.main, &["commit", "-qam", "second"]);
    let source = git(&f.main, &["rev-parse", "HEAD"]);
    git(&f.main, &["checkout", "-q", "trunk"]);
    let mut x = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", "x")
        .unwrap();
    let e = evidence(&x);
    assert!(f
        .driver
        .publish_land_with_filesystem(&f.repo, &mut x, &e, &StopAt("land-before-read-tree"))
        .is_err());
    drop(x);
    let mut y = f.request.clone();
    y.target = git(&f.main, &["rev-parse", "HEAD"]);
    y.source = source;
    let err = f
        .driver
        .prepare_land(&f.repo, vec![], &y, "fixture", "y")
        .err()
        .unwrap();
    assert_eq!(err.cause, "resource-recovery-required");
    assert_eq!(err.operation_id.as_deref(), Some("x"));
    let tree = git(&f.main, &["rev-parse", "HEAD^{tree}"]);
    let descendant = git(
        &f.main,
        &[
            "commit-tree",
            &tree,
            "-p",
            &y.target,
            "-m",
            "external descendant",
        ],
    );
    git(&f.main, &["update-ref", "refs/heads/trunk", &descendant]);
    let mut descendant_request = y.clone();
    descendant_request.target = descendant;
    let err = f
        .driver
        .prepare_land(
            &f.repo,
            vec![],
            &descendant_request,
            "fixture",
            "descendant",
        )
        .err()
        .unwrap();
    assert_eq!(err.cause, "resource-recovery-required");
    assert_eq!(err.operation_id.as_deref(), Some("x"));
    git(&f.main, &["update-ref", "refs/heads/trunk", &y.target]);
    let before_refresh = fs::read(f.main.join(".git/index")).unwrap();
    fs::write(f.main.join("b"), "base\n").unwrap();
    git(&f.main, &["status", "--porcelain"]);
    assert_ne!(fs::read(f.main.join(".git/index")).unwrap(), before_refresh);
    f.driver
        .recover_land(&f.repo, vec![], "fixture", "x")
        .unwrap();
    let mut session = f
        .driver
        .prepare_land(&f.repo, vec![], &y, "fixture", "y")
        .unwrap();
    let e = evidence(&session);
    f.driver.publish_land(&f.repo, &mut session, &e).unwrap();
    assert_eq!(fs::read(f.main.join("a")).unwrap(), b"incoming\n");
    assert_eq!(fs::read(f.main.join("b")).unwrap(), b"second\n");
}

#[test]
fn another_writer_abandons_pre_attempt_but_only_owner_cleans_candidate() {
    let f = Fixture::new();
    let session = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "a", "abandoned")
        .unwrap();
    let candidate = session.candidate().unwrap().worktree.clone();
    drop(session);
    assert!(f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "b", "new")
        .is_err());
    f.driver
        .recover_land(&f.repo, vec![], "b", "abandoned")
        .unwrap();
    assert!(f
        .driver
        .acknowledge_land(&f.repo, "b", "abandoned", "ack")
        .is_err());
    fs::write(candidate.join("a"), "retained user edit\n").unwrap();
    let warnings = f
        .driver
        .acknowledge_land(&f.repo, "a", "abandoned", "ack")
        .unwrap();
    assert!(!warnings.is_empty());
    assert_eq!(
        fs::read(candidate.join("a")).unwrap(),
        b"retained user edit\n"
    );
    fs::write(candidate.join("a"), "incoming\n").unwrap();
    let warnings = f
        .driver
        .acknowledge_land(&f.repo, "a", "abandoned", "ack")
        .unwrap();
    assert!(warnings.is_empty(), "{warnings:?}");
    assert!(!candidate.exists());
    let removal_id = format!(
        "lr-{}",
        wal::canonical_digest(&("land-cleanup", "abandoned")).unwrap()
    );
    let store = wal::Wal::open(&f.repo).unwrap();
    let cleanup = store.inspect(&removal_id).unwrap();
    assert_eq!(cleanup.intent().writer_identity, "a");
    match &cleanup.intent().kind {
        wal::OperationKind::WorktreeRemove { delivery, .. } => assert_eq!(
            delivery.evidence_digest,
            wal::canonical_digest(&(
                store.repository_identity(),
                "abandoned",
                "consumer-acknowledged",
                "ack",
                "a"
            ))
            .unwrap()
        ),
        _ => panic!("cleanup authorization must be journaled"),
    }
    let mut session = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "b", "new")
        .unwrap();
    let e = evidence(&session);
    f.driver.publish_land(&f.repo, &mut session, &e).unwrap();
}

#[test]
fn ignored_store_collision_is_terminal_after_post_cas_crash() {
    let mut f = Fixture::new();
    git(&f.main, &["checkout", "-q", "source"]);
    fs::create_dir_all(f.main.join(".fgos/store")).unwrap();
    fs::write(f.main.join(".fgos/store/x"), "incoming store\n").unwrap();
    git(&f.main, &["add", "-f", ".fgos/store/x"]);
    git(&f.main, &["commit", "-qm", "store"]);
    f.request.source = git(&f.main, &["rev-parse", "HEAD"]);
    git(&f.main, &["checkout", "-q", "trunk"]);
    fs::write(f.main.join(".git/info/exclude"), ".fgos/\n").unwrap();
    fs::create_dir_all(f.main.join(".fgos/store")).unwrap();
    fs::write(f.main.join(".fgos/store/x"), "local store\n").unwrap();
    let mut s = f
        .driver
        .prepare_land(&f.repo, vec![], &f.request, "fixture", "collision")
        .unwrap();
    let e = evidence(&s);
    assert!(f
        .driver
        .publish_land_with_filesystem(&f.repo, &mut s, &e, &StopAt("land-after-cas"))
        .is_err());
    drop(s);
    let index = fs::read(f.main.join(".git/index")).unwrap();
    let r = f
        .driver
        .recover_land(&f.repo, vec![], "fixture", "collision")
        .unwrap();
    assert!(matches!(r.checkout, Checkout::Pending));
    assert!(matches!(r.attribution, Attribution::EffectObservedOnly));
    assert_eq!(fs::read(f.main.join(".git/index")).unwrap(), index);
    assert_eq!(
        fs::read(f.main.join(".fgos/store/x")).unwrap(),
        b"local store\n"
    );
    assert!(
        matches!(wal::Wal::open(&f.repo).unwrap().inspect("collision").unwrap().outcome(), Some(wal::Outcome::Land { checkout, observed_only: true }) if checkout == "pendingStoreCollision")
    );
}

#[test]
fn recovery_checks_native_state_even_before_attempt_and_off_destination() {
    for marker in ["index.lock", "MERGE_HEAD"] {
        let f = Fixture::new();
        let s = f
            .driver
            .prepare_land(&f.repo, vec![], &f.request, "fixture", "native")
            .unwrap();
        drop(s);
        git(&f.main, &["checkout", "-q", "source"]);
        let path = f.main.join(".git").join(marker);
        fs::write(&path, "foreign evidence").unwrap();
        assert!(f
            .driver
            .recover_land(&f.repo, vec![], "other", "native")
            .is_err());
        assert_eq!(fs::read(&path).unwrap(), b"foreign evidence");
        assert!(wal::Wal::open(&f.repo)
            .unwrap()
            .inspect("native")
            .unwrap()
            .outcome()
            .is_none());
    }
}
