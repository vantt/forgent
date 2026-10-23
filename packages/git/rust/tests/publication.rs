#![cfg(target_os = "linux")]
use fgos_git::wal::{self, FileSystem, Phase};
use fgos_git::*;
use fgos_holder_lock::{acquire, Acquire, Handle, Mode, Resource, Wait};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
static NEXT: AtomicU64 = AtomicU64::new(0);
struct Temp(PathBuf);
impl Temp {
    fn new() -> Self {
        let path = std::env::temp_dir().join(format!(
            "fgos-publication-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&path).unwrap();
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&path, fs::Permissions::from_mode(0o700)).unwrap();
        Self(path)
    }
}
impl Drop for Temp {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}
fn git(path: &Path, args: &[&str]) -> Vec<u8> {
    let out = Command::new("git")
        .arg("-C")
        .arg(path)
        .args(args)
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "{args:?}: {}",
        String::from_utf8_lossy(&out.stderr)
    );
    out.stdout
}
fn init(path: &Path, format: &str, backend: &str) {
    let out = Command::new("git")
        .args([
            "init",
            "-q",
            "--bare",
            &format!("--object-format={format}"),
            &format!("--ref-format={backend}"),
        ])
        .arg(path)
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "git init {format}/{backend}: {}",
        String::from_utf8_lossy(&out.stderr)
    );
}
fn resolve(driver: &GitDriver, path: &Path) -> RepoHandle {
    match driver.resolve_repo(path, path).unwrap() {
        ResolveRepo::Repository(r) => {
            let fence = r.trusted_main_root().join(".fgos/locks/activation.lock");
            fs::create_dir_all(&fence).unwrap();
            fs::write(
                fence.join("TOMBSTONE"),
                "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n",
            )
            .unwrap();
            r
        }
        _ => panic!(),
    }
}
fn handle(path: &Path) -> Handle {
    match acquire(
        &Resource::new("event-seal", path),
        Mode::Ex,
        // Sibling test threads fork children holding a copy of the descriptor until exec.
        Wait::Ms(30_000),
        2000,
    ) {
        Acquire::Acquired(h) => h,
        other => panic!("{other:?}"),
    }
}
fn reference() -> RefName {
    RefName::parse("refs/fgos/events/machine").unwrap()
}
fn authority<'a>(repo: &RepoHandle, h: &'a mut Handle) -> HolderAuthority<'a> {
    {
        let path = h.path().to_path_buf();
        HolderAuthority::new(repo, h, &path, reference(), "test-writer")
    }
    .unwrap()
}
fn commit<P: Publication>(p: &P, r: &RepoHandle, parents: Vec<Oid>, msg: &str) -> Oid {
    let blob = p.write_blob(r, msg.as_bytes()).unwrap();
    let tree = p
        .write_tree(
            r,
            &[TreeEntry {
                name: b"seal.json".to_vec(),
                mode: 0o100644,
                oid: blob,
            }],
        )
        .unwrap();
    p.write_commit(
        r,
        &CommitInput {
            tree,
            parents,
            author: Identity {
                name: "Event Store".into(),
                email: "store@fgos.invalid".into(),
            },
            committer: Identity {
                name: "Event Store".into(),
                email: "store@fgos.invalid".into(),
            },
            author_date: "1792300000 +0700".into(),
            committer_date: "1792300000 +0700".into(),
            message: msg.as_bytes().to_vec(),
        },
    )
    .unwrap()
}
#[test]
fn objects_walk_stop_set_cas_delete_and_gc_all_formats_and_backends() {
    for format in ["sha1", "sha256"] {
        for backend in ["files", "reftable"] {
            let t = Temp::new();
            let root = t.0.join("repo");
            init(&root, format, backend);
            let driver = GitDriver::new(&t.0).unwrap();
            let repo = resolve(&driver, &root);
            let mut h = handle(&t.0.join("seal.lock"));
            let port = PublicationPort::new(&driver, authority(&repo, &mut h));
            let a = commit(&port, &repo, vec![], "a");
            assert_eq!(a, commit(&port, &repo, vec![], "a"));
            let b = commit(&port, &repo, vec![a.clone()], "b");
            let c = commit(&port, &repo, vec![a.clone()], "c");
            let merge = commit(&port, &repo, vec![b.clone(), c.clone()], "merge");
            let page = port
                .walk_commits(
                    &repo,
                    std::slice::from_ref(&merge),
                    &[b.clone(), c.clone()],
                    None,
                    WalkBounds {
                        max_commits: 1,
                        max_bytes: 65536,
                    },
                )
                .unwrap();
            assert_eq!(page.commits[0].parents, vec![b.clone(), c.clone()]);
            assert!(!page.complete);
            let page = port
                .walk_commits(
                    &repo,
                    std::slice::from_ref(&merge),
                    &[b.clone(), c.clone()],
                    page.next_cursor,
                    WalkBounds {
                        max_commits: 10,
                        max_bytes: 65536,
                    },
                )
                .unwrap();
            assert!(page.complete);
            assert_eq!(page.commits.len(), 2);
            let all = port
                .walk_commits(
                    &repo,
                    std::slice::from_ref(&merge),
                    &[],
                    None,
                    WalkBounds {
                        max_commits: 20,
                        max_bytes: 65536,
                    },
                )
                .unwrap();
            assert_eq!(all.commits.len(), 4);
            let before = git(&root, &["symbolic-ref", "HEAD"]);
            let receipt = port
                .compare_and_swap(
                    &repo,
                    &reference(),
                    &ExpectedTip::Absent,
                    &ExpectedTip::Oid(merge.clone()),
                    "initial",
                )
                .unwrap();
            assert!(matches!(
                receipt.attribution,
                Attribution::ThisInvocationWonCas
            ));
            assert_eq!(before, git(&root, &["symbolic-ref", "HEAD"]));
            let stale = port
                .compare_and_swap(
                    &repo,
                    &reference(),
                    &ExpectedTip::Absent,
                    &ExpectedTip::Oid(merge.clone()),
                    "stale",
                )
                .unwrap_err();
            assert_eq!(stale.code, ResultCode::Stale);
            assert_eq!(
                stale.receipt.unwrap().local_effect.observed_tip,
                ExpectedTip::Oid(merge.clone())
            );
            assert!(port
                .compare_and_swap(
                    &repo,
                    &reference(),
                    &ExpectedTip::Absent,
                    &ExpectedTip::Oid(a.clone()),
                    "initial"
                )
                .is_err());
            assert!(matches!(
                port.recover(&repo, "initial").unwrap().attribution,
                Attribution::ThisInvocationWonCas
            ));
            git(&root, &["pack-refs", "--all"]);
            git(&root, &["gc", "--prune=now"]);
            assert!(matches!(
                port.read_object(&repo, &a, ObjectType::Commit).unwrap(),
                ReadObject::Present { .. }
            ));
            port.release_pin_and_compact(&repo, "initial").unwrap();
            assert!(matches!(
                port.compare_and_swap(
                    &repo,
                    &reference(),
                    &ExpectedTip::Absent,
                    &ExpectedTip::Oid(merge.clone()),
                    "initial"
                )
                .unwrap()
                .attribution,
                Attribution::ThisInvocationWonCas
            ));
            drop(port);
            let branch = RefName::parse("refs/fgos/branch-events/machine/branch").unwrap();
            let resource = h.path().to_path_buf();
            let authority =
                HolderAuthority::new(&repo, &mut h, &resource, branch.clone(), "test-writer")
                    .unwrap();
            let branch_port = PublicationPort::new(&driver, authority);
            branch_port
                .compare_and_swap(
                    &repo,
                    &branch,
                    &ExpectedTip::Absent,
                    &ExpectedTip::Oid(b.clone()),
                    "branch-create",
                )
                .unwrap();
            branch_port
                .compare_and_swap(
                    &repo,
                    &branch,
                    &ExpectedTip::Oid(b),
                    &ExpectedTip::Absent,
                    "branch-delete",
                )
                .unwrap();
            assert!(matches!(
                branch_port.read_ref(&repo, &branch).unwrap(),
                RefValue::Absent
            ));
        }
    }
}
#[test]
fn hooks_symbolic_refs_and_replaced_authority_are_refused() {
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let a = commit(&port, &repo, vec![], "a");
    let hook = root.join("hooks/reference-transaction");
    fs::write(&hook, b"#!/bin/sh\necho bad > hook-ran\nexit 1\n").unwrap();
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(&hook, fs::Permissions::from_mode(0o700)).unwrap();
    port.compare_and_swap(
        &repo,
        &reference(),
        &ExpectedTip::Absent,
        &ExpectedTip::Oid(a.clone()),
        "safe",
    )
    .unwrap();
    assert!(!root.join("hook-ran").exists());
    fs::remove_file(hook).unwrap();
    git(&root, &["update-ref", "refs/heads/victim", a.as_str()]);
    git(
        &root,
        &["symbolic-ref", reference().as_str(), "refs/heads/victim"],
    );
    assert_eq!(
        port.compare_and_swap(
            &repo,
            &reference(),
            &ExpectedTip::Oid(a.clone()),
            &ExpectedTip::Oid(a.clone()),
            "symbolic"
        )
        .unwrap_err()
        .cause,
        "symbolic-publication-ref"
    );
    fs::rename(t.0.join("seal.lock"), t.0.join("old.lock")).unwrap();
    let _successor = handle(&t.0.join("seal.lock"));
    assert!(port
        .write_blob(&repo, b"bad")
        .unwrap_err()
        .cause
        .contains("lock-resource-replaced"));
    assert!(!root.join("fgos/git/operations/symbolic").exists());
}
#[test]
fn remote_mirrors_and_non_fast_forward_are_typed() {
    for format in ["sha1", "sha256"] {
        for backend in ["files", "reftable"] {
            let t = Temp::new();
            let root = t.0.join("repo");
            let remote = t.0.join("remote");
            init(&root, format, backend);
            init(&remote, format, backend);
            git(
                &root,
                &["remote", "add", "origin", remote.to_str().unwrap()],
            );
            let marker = t.0.join("remote-hook-fired");
            for hook in [
                "pre-receive",
                "update",
                "post-receive",
                "reference-transaction",
            ] {
                use std::os::unix::fs::PermissionsExt;
                let path = remote.join("hooks").join(hook);
                fs::write(
                    &path,
                    format!("#!/bin/sh\necho ran >> '{}'\nexit 0\n", marker.display()),
                )
                .unwrap();
                fs::set_permissions(path, fs::Permissions::from_mode(0o755)).unwrap();
            }
            let driver = GitDriver::new(&t.0).unwrap();
            let repo = resolve(&driver, &root);
            let mut h = handle(&t.0.join("seal.lock"));
            let port =
                PublicationPort::new(&driver, authority(&repo, &mut h)).with_remote(RemoteGrant {
                    name: "origin".into(),
                    pinned_url: remote.to_str().unwrap().into(),
                });
            let a = commit(&port, &repo, vec![], "a");
            let b = commit(&port, &repo, vec![], "b");
            port.compare_and_swap(
                &repo,
                &reference(),
                &ExpectedTip::Absent,
                &ExpectedTip::Oid(a.clone()),
                "initial",
            )
            .unwrap();
            let pushed = port
                .push_refs(&repo, "origin", &[(reference(), reference())])
                .unwrap();
            assert!(
                matches!(pushed.refs[0].1, PushOutcome::Accepted),
                "{:?}",
                pushed.refs
            );
            port.compare_and_swap(
                &repo,
                &reference(),
                &ExpectedTip::Oid(a.clone()),
                &ExpectedTip::Oid(b),
                "diverge",
            )
            .unwrap();
            let pushed = port
                .push_refs(&repo, "origin", &[(reference(), reference())])
                .unwrap();
            assert!(
                matches!(pushed.refs[0].1, PushOutcome::RejectedNonFastForward { .. }),
                "{:?}",
                pushed.refs
            );
            assert!(!marker.exists(), "remote receive hooks must be suppressed");
            let mapping = "+refs/fgos/events/*:refs/fgos/remotes/origin/events/*".to_owned();
            port.fetch_refs(&repo, "origin", &[mapping]).unwrap();
            let discovered = port
                .list_refs(&repo, &[RefPrefix::parse("refs/fgos/").unwrap()], None, 100)
                .unwrap();
            assert!(discovered.complete);
            assert!(discovered
                .entries
                .iter()
                .any(|e| e.name.as_str() == "refs/fgos/events/machine"));
            assert!(discovered
                .entries
                .iter()
                .any(|e| e.name.as_str() == "refs/fgos/remotes/origin/events/machine"));
            assert!(!discovered
                .entries
                .iter()
                .any(|e| e.name.as_str().starts_with("refs/fgos/git-operations/")));

            assert!(
                matches!(port.read_ref(&repo,&RefName::parse("refs/fgos/remotes/origin/events/machine").unwrap()).unwrap(),RefValue::Direct(o) if o==a)
            );
            assert!(!marker.exists());
            assert!(
                fs::read_dir(root.join("fgos/git/operations"))
                    .unwrap()
                    .all(|e| !e
                        .unwrap()
                        .file_name()
                        .to_string_lossy()
                        .starts_with("remote-")),
                "terminal transfers must compact"
            );
            assert!(port
                .fetch_refs(&repo, "origin", &["+refs/*:refs/heads/*".into()])
                .is_err());
            assert!(port
                .push_refs(
                    &repo,
                    "origin",
                    &[(reference(), RefName::parse("refs/heads/main").unwrap())]
                )
                .is_err());
        }
    }
}
struct Fault(&'static str);
impl FileSystem for Fault {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        if step == self.0 {
            Err(std::io::Error::other("injected filesystem failure"))
        } else {
            Ok(())
        }
    }
}
#[test]
fn attempted_operation_is_never_replayed_after_fault_or_aba() {
    for step in [
        "before-pin-cas",
        "after-pin-cas",
        "pin-read-back",
        "before-target-cas",
        "after-target-cas",
        "target-read-back",
    ] {
        let t = Temp::new();
        let root = t.0.join("repo");
        init(&root, "sha1", "files");
        let driver = GitDriver::new(&t.0).unwrap();
        let repo = resolve(&driver, &root);
        let mut h = handle(&t.0.join("seal.lock"));
        let port = PublicationPort::new(&driver, authority(&repo, &mut h));
        let a = commit(&port, &repo, vec![], "a");
        drop(port);
        let faulty =
            PublicationPort::with_filesystem(&driver, authority(&repo, &mut h), Fault(step));
        assert!(faulty
            .compare_and_swap(
                &repo,
                &reference(),
                &ExpectedTip::Absent,
                &ExpectedTip::Oid(a.clone()),
                "fault"
            )
            .is_err());
        drop(faulty);
        let port = PublicationPort::new(&driver, authority(&repo, &mut h));
        let chain = wal::Wal::open(&repo).unwrap().inspect("fault").unwrap();
        if matches!(chain.last().phase, Phase::TargetAttempt { .. }) {
            // An ABA can erase an actual win. Recovery must retain the attempt.
            git(
                &root,
                &["update-ref", "--no-deref", "-d", reference().as_str()],
            );
            assert!(port.recover(&repo, "fault").is_err());
            assert!(matches!(
                port.read_ref(&repo, &reference()).unwrap(),
                RefValue::Absent
            ));
            port.compare_and_swap(
                &repo,
                &reference(),
                &ExpectedTip::Absent,
                &ExpectedTip::Oid(a),
                "successor",
            )
            .unwrap();
            let e = port.recover(&repo, "fault").unwrap_err();
            assert_eq!(e.code, ResultCode::Superseded);
            assert!(matches!(
                e.receipt.unwrap().attribution,
                Attribution::Uncertain
            ));
        }
    }
}

// Explicit test-harness child, configured through stdin; no production switch.
#[test]
#[ignore]
fn crash_child() {
    use std::io::Read;
    let mut input = String::new();
    std::io::stdin().read_to_string(&mut input).unwrap();
    let (root, state, step): (PathBuf, PathBuf, String) = serde_json::from_str(&input).unwrap();
    struct Kill(String);
    impl FileSystem for Kill {
        fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
            if step == self.0 {
                unsafe {
                    libc::kill(libc::getpid(), libc::SIGKILL);
                }
            }
            Ok(())
        }
    }
    let driver = GitDriver::new(&state).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&state.join("seal.lock"));
    let plain = PublicationPort::new(&driver, authority(&repo, &mut h));
    let a = commit(&plain, &repo, vec![], "crash");
    drop(plain);
    let port = PublicationPort::with_filesystem(&driver, authority(&repo, &mut h), Kill(step));
    let _ = port.compare_and_swap(
        &repo,
        &reference(),
        &ExpectedTip::Absent,
        &ExpectedTip::Oid(a),
        "crashed",
    );
    panic!("crash checkpoint not reached");
}
#[test]
fn sigkill_on_both_sides_of_target_effect_has_conservative_recovery() {
    use std::io::Write;
    use std::os::unix::process::ExitStatusExt;
    for format in ["sha1", "sha256"] {
        for backend in ["files", "reftable"] {
            for step in ["before-target-cas", "after-target-cas"] {
                let t = Temp::new();
                let root = t.0.join("repo");
                init(&root, format, backend);
                let mut child = Command::new(std::env::current_exe().unwrap())
                    .args(["--exact", "crash_child", "--ignored", "--nocapture"])
                    .stdin(Stdio::piped())
                    .stdout(Stdio::null())
                    .stderr(Stdio::piped())
                    .spawn()
                    .unwrap();
                child
                    .stdin
                    .take()
                    .unwrap()
                    .write_all(&serde_json::to_vec(&(&root, &t.0, step)).unwrap())
                    .unwrap();
                let out = child.wait_with_output().unwrap();
                assert_eq!(
                    out.status.signal(),
                    Some(9),
                    "{}",
                    String::from_utf8_lossy(&out.stderr)
                );
                let driver = GitDriver::new(&t.0).unwrap();
                let repo = resolve(&driver, &root);
                let mut h = handle(&t.0.join("seal.lock"));
                let port = PublicationPort::new(&driver, authority(&repo, &mut h));
                if step == "before-target-cas" {
                    assert!(port.recover(&repo, "crashed").is_err());
                    assert!(matches!(
                        port.read_ref(&repo, &reference()).unwrap(),
                        RefValue::Absent
                    ));
                } else {
                    assert!(matches!(
                        port.recover(&repo, "crashed").unwrap().attribution,
                        Attribution::EffectObservedOnly
                    ));
                }
            }
        }
    }
}

struct CountFault {
    fail: u64,
    seen: AtomicU64,
}
impl FileSystem for CountFault {
    fn checkpoint(&self, _: &'static str) -> std::io::Result<()> {
        let n = self.seen.fetch_add(1, Ordering::SeqCst) + 1;
        if n == self.fail {
            Err(std::io::Error::other("injected boundary failure"))
        } else {
            Ok(())
        }
    }
}
#[test]
fn every_acknowledged_filesystem_boundary_preserves_attempt_evidence() {
    for format in ["sha1", "sha256"] {
        for backend in ["files", "reftable"] {
            let mut boundaries = 1;
            let mut fail = 0;
            while fail <= boundaries {
                let t = Temp::new();
                let root = t.0.join("repo");
                init(&root, format, backend);
                let driver = GitDriver::new(&t.0).unwrap();
                let repo = resolve(&driver, &root);
                let mut h = handle(&t.0.join("seal.lock"));
                let plain = PublicationPort::new(&driver, authority(&repo, &mut h));
                let a = commit(&plain, &repo, vec![], "boundary");
                drop(plain);
                let fault = CountFault {
                    fail,
                    seen: AtomicU64::new(0),
                };
                let port =
                    PublicationPort::with_filesystem(&driver, authority(&repo, &mut h), &fault);
                let result = port.compare_and_swap(
                    &repo,
                    &reference(),
                    &ExpectedTip::Absent,
                    &ExpectedTip::Oid(a.clone()),
                    "boundary",
                );
                if fail == 0 {
                    assert!(result.is_ok());
                    boundaries = fault.seen.load(Ordering::SeqCst);
                } else {
                    assert!(
                        result.is_err(),
                        "missed {fail}/{boundaries} {format} {backend}"
                    );
                }
                drop(port);
                let wal = wal::Wal::open(&repo).unwrap();
                let actual = git(
                    &root,
                    &[
                        "for-each-ref",
                        "--format=%(objectname)",
                        reference().as_str(),
                    ],
                );
                if !actual.is_empty() {
                    let chain = wal.inspect("boundary").unwrap();
                    assert!(chain
                        .records()
                        .iter()
                        .any(|r| matches!(r.phase, Phase::Prepared)));
                    assert!(chain
                        .records()
                        .iter()
                        .any(|r| matches!(r.phase, Phase::TargetAttempt { .. })));
                    assert_eq!(String::from_utf8(actual).unwrap().trim(), a.as_str());
                }
                if let Ok(c) = wal.inspect("boundary") {
                    if matches!(c.last().phase, Phase::TargetAttempt { .. }) {
                        git(
                            &root,
                            &["update-ref", "--no-deref", "-d", reference().as_str()],
                        );
                        let plain = PublicationPort::new(&driver, authority(&repo, &mut h));
                        assert!(plain.recover(&repo, "boundary").is_err());
                    }
                } else {
                    let backlog = wal.scan(100).unwrap();
                    assert!(
                        backlog.unresolved == 0
                            || !root.join("fgos/git/operations/boundary").exists()
                    );
                }
                fail += 1;
            }
        }
    }
}

#[test]
fn recovery_reconciles_only_the_recorded_pin_and_preserves_native_locks() {
    for backend in ["files", "reftable"] {
        let t = Temp::new();
        let root = t.0.join("repo");
        init(&root, "sha1", backend);
        let driver = GitDriver::new(&t.0).unwrap();
        let repo = resolve(&driver, &root);
        let mut h = handle(&t.0.join("seal.lock"));
        let port = PublicationPort::new(&driver, authority(&repo, &mut h));
        let a = commit(&port, &repo, vec![], "a");
        let b = commit(&port, &repo, vec![a.clone()], "b");
        port.compare_and_swap(
            &repo,
            &reference(),
            &ExpectedTip::Absent,
            &ExpectedTip::Oid(a.clone()),
            "initial",
        )
        .unwrap();
        drop(port);
        let faulty = PublicationPort::with_filesystem(
            &driver,
            authority(&repo, &mut h),
            Fault("after-target-cas"),
        );
        let error = faulty
            .compare_and_swap(
                &repo,
                &reference(),
                &ExpectedTip::Oid(a.clone()),
                &ExpectedTip::Oid(b.clone()),
                "pending",
            )
            .unwrap_err();
        assert_eq!(
            error.receipt.unwrap().local_effect.observed_tip,
            ExpectedTip::Oid(b.clone())
        );
        drop(faulty);
        let pin = "refs/fgos/git-operations/pending/candidate";
        git(
            &root,
            &["update-ref", "--no-deref", pin, a.as_str(), b.as_str()],
        );
        let native = root.join(if backend == "files" {
            "refs/fgos/events/machine.lock"
        } else {
            "reftable/tables.list.lock"
        });
        fs::write(&native, b"unknown owner evidence").unwrap();
        let port = PublicationPort::new(&driver, authority(&repo, &mut h));
        assert!(port.recover(&repo, "pending").is_err());
        assert_eq!(fs::read(&native).unwrap(), b"unknown owner evidence");
        fs::remove_file(&native).unwrap();
        assert!(matches!(
            port.recover(&repo, "pending").unwrap().attribution,
            Attribution::EffectObservedOnly
        ));
        assert_eq!(
            String::from_utf8(git(&root, &["rev-parse", pin]))
                .unwrap()
                .trim(),
            b.as_str()
        );
        assert_eq!(
            String::from_utf8(git(&root, &["rev-parse", reference().as_str()]))
                .unwrap()
                .trim(),
            b.as_str()
        );
    }
}
#[test]
fn an_interrupted_pin_release_is_resumed_only_while_the_pin_still_equals_its_candidate() {
    for backend in ["files", "reftable"] {
        let t = Temp::new();
        let root = t.0.join("repo");
        init(&root, "sha1", backend);
        let driver = GitDriver::new(&t.0).unwrap();
        let repo = resolve(&driver, &root);
        let mut h = handle(&t.0.join("seal.lock"));
        let port = PublicationPort::new(&driver, authority(&repo, &mut h));
        let a = commit(&port, &repo, vec![], "a");
        let b = commit(&port, &repo, vec![a.clone()], "b");
        for (id, from, to) in [("stuck", ExpectedTip::Absent, &a), ("moved", ExpectedTip::Oid(a.clone()), &b)] {
            port.compare_and_swap(&repo, &reference(), &from, &ExpectedTip::Oid(to.clone()), id)
                .unwrap();
        }
        let native = root.join(if backend == "files" {
            "packed-refs.lock"
        } else {
            "reftable/tables.list.lock"
        });
        let pin = |id: &str| format!("refs/fgos/git-operations/{id}/candidate");
        let wal = wal::Wal::open(&repo).unwrap();

        // Delete blocked by a native lock: the chain stays at the release
        // attempt, the lock bytes are preserved, the pin is still held.
        fs::write(&native, b"unknown owner evidence").unwrap();
        assert!(port.release_pin_and_compact(&repo, "stuck").is_err());
        assert_eq!(fs::read(&native).unwrap(), b"unknown owner evidence");
        assert!(matches!(
            wal.inspect("stuck").unwrap().last().phase,
            Phase::PinReleaseAttempt { .. }
        ));
        assert_eq!(
            String::from_utf8(git(&root, &["rev-parse", &pin("stuck")])).unwrap().trim(),
            a.as_str()
        );
        // Still blocked on a later call; nothing is removed on its behalf.
        assert!(port.release_pin_and_compact(&repo, "stuck").is_err());
        assert_eq!(fs::read(&native).unwrap(), b"unknown owner evidence");

        // Once the lock is gone the same release completes and compacts.
        fs::remove_file(&native).unwrap();
        port.release_pin_and_compact(&repo, "stuck").unwrap();
        assert!(wal.inspect("stuck").is_err());
        assert!(wal.compacted("stuck").unwrap().is_some());
        assert!(git(&root, &["for-each-ref", &pin("stuck")]).is_empty());

        // A pin holding any other value is evidence, not a delete target.
        fs::write(&native, b"unknown owner evidence").unwrap();
        assert!(port.release_pin_and_compact(&repo, "moved").is_err());
        fs::remove_file(&native).unwrap();
        git(&root, &["update-ref", "--no-deref", &pin("moved"), a.as_str(), b.as_str()]);
        assert!(port.release_pin_and_compact(&repo, "moved").is_err());
        assert!(matches!(
            wal.inspect("moved").unwrap().last().phase,
            Phase::PinReleaseAttempt { .. }
        ));
        assert_eq!(
            String::from_utf8(git(&root, &["rev-parse", &pin("moved")])).unwrap().trim(),
            a.as_str()
        );
    }
}
#[test]
fn recovery_reports_a_chain_whose_pin_release_is_stuck_and_still_settles_the_others() {
    for backend in ["files", "reftable"] {
        let t = Temp::new();
        let root = t.0.join("repo");
        init(&root, "sha1", backend);
        let driver = GitDriver::new(&t.0).unwrap();
        let repo = resolve(&driver, &root);
        let mut h = handle(&t.0.join("seal.lock"));
        let port = PublicationPort::new(&driver, authority(&repo, &mut h));
        let a = commit(&port, &repo, vec![], "a");
        let b = commit(&port, &repo, vec![a.clone()], "b");
        let c = commit(&port, &repo, vec![b.clone()], "c");
        for (id, from, to) in [
            ("first-stuck", ExpectedTip::Absent, &a),
            ("second-ok", ExpectedTip::Oid(a.clone()), &b),
            ("third-ok", ExpectedTip::Oid(b.clone()), &c),
        ] {
            port.compare_and_swap(&repo, &reference(), &from, &ExpectedTip::Oid(to.clone()), id)
                .unwrap();
        }
        let pin = |id: &str| format!("refs/fgos/git-operations/{id}/candidate");
        // The first chain's pin no longer holds its candidate, so its release
        // is refused; it sorts before the chains that can complete.
        git(&root, &["update-ref", "--no-deref", &pin("first-stuck"), b.as_str(), a.as_str()]);
        let wal = wal::Wal::open(&repo).unwrap();
        assert_eq!(port.recover_publications(&repo).unwrap(), vec!["first-stuck".to_string()]);
        assert!(wal.inspect("first-stuck").is_ok());
        for id in ["second-ok", "third-ok"] {
            assert!(wal.inspect(id).is_err(), "{id} was released and compacted");
            assert!(wal.compacted(id).unwrap().is_some());
            assert!(git(&root, &["for-each-ref", &pin(id)]).is_empty());
        }
    }
}
#[test]
fn shallow_crossing_is_an_error_but_a_stop_boundary_is_complete_and_facts_are_read_only() {
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    git(
        &root,
        &[
            "config",
            "remote.origin.url",
            "https://example.invalid/repo.git",
        ],
    );
    git(
        &root,
        &[
            "config",
            "remote.origin.fetch",
            "+refs/fgos/events/*:refs/fgos/remotes/origin/events/*",
        ],
    );
    git(&root, &["config", "fgos.machineId", "test-machine"]);
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let a = commit(&port, &repo, vec![], "a");
    let b = commit(&port, &repo, vec![a], "b");
    drop(port);
    fs::write(root.join("shallow"), format!("{}\n", b.as_str())).unwrap();
    let repo = resolve(&driver, &root);
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    assert_eq!(
        port.walk_commits(
            &repo,
            std::slice::from_ref(&b),
            &[],
            None,
            WalkBounds {
                max_commits: 10,
                max_bytes: 10000
            }
        )
        .unwrap_err()
        .cause,
        "shallow-history-incomplete"
    );
    let page = port
        .walk_commits(
            &repo,
            std::slice::from_ref(&b),
            std::slice::from_ref(&b),
            None,
            WalkBounds {
                max_commits: 10,
                max_bytes: 10000,
            },
        )
        .unwrap();
    assert!(page.complete);
    assert_eq!(page.commits[0].parents.len(), 1);
    assert_eq!(
        Inspect::configured_fetch_refspecs(&driver, &repo, "origin")
            .unwrap()
            .len(),
        1
    );
    assert!(Inspect::push_refspecs(&driver, &repo, "origin")
        .unwrap()
        .is_empty());
    assert_eq!(
        Inspect::machine_id(&driver, &repo).unwrap().unwrap().value,
        b"test-machine"
    );
    assert_eq!(
        Inspect::remote_url(&driver, &repo, "origin").unwrap(),
        "https://example.invalid/repo.git"
    );
    assert!(Inspect::fetch_mapping_provenance(&driver, &repo, "origin")
        .unwrap()
        .is_none());
}

#[test]
fn remote_unknown_recovery_never_resends_and_corrupt_backlog_never_clears_admission() {
    let t = Temp::new();
    let root = t.0.join("repo");
    let remote = t.0.join("remote");
    init(&root, "sha1", "files");
    init(&remote, "sha1", "files");
    git(
        &root,
        &["remote", "add", "origin", remote.to_str().unwrap()],
    );
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let a = commit(&port, &repo, vec![], "a");
    port.compare_and_swap(
        &repo,
        &reference(),
        &ExpectedTip::Absent,
        &ExpectedTip::Oid(a.clone()),
        "initial",
    )
    .unwrap();
    drop(port);
    let faulty =
        PublicationPort::with_filesystem(&driver, authority(&repo, &mut h), Fault("after-push"))
            .with_remote(RemoteGrant {
                name: "origin".into(),
                pinned_url: remote.to_str().unwrap().into(),
            });
    assert!(faulty
        .push_refs(&repo, "origin", &[(reference(), reference())])
        .is_err());
    drop(faulty);
    let wal = wal::Wal::open(&repo).unwrap();
    let pending = wal
        .scan(100)
        .unwrap()
        .entries
        .into_iter()
        .find(|e| !e.terminal)
        .unwrap()
        .operation_id;
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let blocked = port
        .compare_and_swap(
            &repo,
            &reference(),
            &ExpectedTip::Oid(a.clone()),
            &ExpectedTip::Oid(a.clone()),
            "blocked-by-transfer",
        )
        .unwrap_err();
    assert_eq!(blocked.operation_id.as_deref(), Some(pending.as_str()));
    assert!(blocked.cause.contains(&pending));
    // Remove the remote completely: recovery must use only local observations.
    fs::remove_dir_all(&remote).unwrap();
    // Automatic admission preserves interrupted transfers under signed rule 4.
    assert_eq!(
        port.recover_publications(&repo).unwrap_err().code,
        ResultCode::RecoveryRequired
    );
    assert!(wal.inspect(&pending).unwrap().outcome().is_none());
    // Explicit recovery reports remote uncertainty from local observations.
    assert!(matches!(
        port.recover(&repo, &pending).unwrap().remote,
        Remote::Unknown
    ));
    port.compare_and_swap(
        &repo,
        &reference(),
        &ExpectedTip::Oid(a.clone()),
        &ExpectedTip::Oid(a.clone()),
        "local-after-interrupted-transfer",
    )
    .unwrap();
    assert!(matches!(
        wal.compacted(&pending).unwrap().unwrap().outcome().unwrap(),
        wal::Outcome::Transfer { unknown: true, .. }
    ));
    let bad = root.join("fgos/git/operations/corrupt");
    fs::create_dir(&bad).unwrap();
    fs::write(bad.join("0000.json"), b"bad evidence").unwrap();
    let result = port
        .compare_and_swap(
            &repo,
            &reference(),
            &ExpectedTip::Oid(a.clone()),
            &ExpectedTip::Oid(a.clone()),
            "blocked",
        )
        .unwrap_err();
    assert!(result.cause.starts_with("publication-backlog-unreadable"));
    assert!(!root.join("fgos/git/operations/blocked").exists());
    // The Refs port refuses the same corrupt directory by the same evidence, before any record.
    let refs = driver
        .ensure_branch(
            &repo,
            vec![],
            &RefName::parse("refs/heads/blocked").unwrap(),
            &a,
            "fixture",
            "refs-blocked",
        )
        .unwrap_err();
    assert_eq!(refs.cause, "git-wal-unreadable");
    assert!(!root.join("fgos/git/operations/refs-blocked").exists());
}

#[test]
fn publication_admission_waits_for_unrelated_pre_exec_copies() {
    use std::os::unix::process::CommandExt;
    use std::time::{Duration, Instant};
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let candidate = commit(&port, &repo, vec![], "pre-exec admission");
    let ready = t.0.join("ready");
    let marker = std::ffi::CString::new(ready.to_str().unwrap()).unwrap();
    std::thread::scope(|scope| {
        let unrelated = scope.spawn(|| {
            let mut cmd = Command::new("/bin/true");
            // SAFETY: only async-signal-safe syscalls between fork and exec.
            unsafe {
                cmd.pre_exec(move || {
                    let fd = libc::open(marker.as_ptr(), libc::O_WRONLY | libc::O_CREAT, 0o600);
                    if fd < 0 {
                        return Err(std::io::Error::last_os_error());
                    }
                    libc::close(fd);
                    libc::usleep(500_000);
                    Ok(())
                });
            }
            cmd.status().unwrap()
        });
        let deadline = Instant::now() + Duration::from_secs(5);
        while !ready.exists() {
            assert!(Instant::now() < deadline);
            std::thread::sleep(Duration::from_millis(1));
        }
        let receipt = port
            .compare_and_swap(
                &repo,
                &reference(),
                &ExpectedTip::Absent,
                &ExpectedTip::Oid(candidate),
                "pre-exec-admission",
            )
            .unwrap();
        assert!(matches!(
            receipt.attribution,
            Attribution::ThisInvocationWonCas
        ));
        assert!(unrelated.join().unwrap().success());
    });
}

#[test]
fn group_shared_common_dir_is_allowed_but_world_writable_is_refused() {
    use std::os::unix::fs::{MetadataExt, PermissionsExt};
    use std::os::unix::process::CommandExt;
    let t = Temp::new();
    let root = t.0.join("shared");
    let mut init = Command::new("git");
    init.args(["init", "--bare", "--shared=group", "-q"])
        .arg(&root);
    unsafe {
        init.pre_exec(|| {
            libc::umask(0o002);
            Ok(())
        });
    }
    assert!(init.status().unwrap().success());
    assert_ne!(fs::metadata(&root).unwrap().mode() & 0o020, 0);
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let a = commit(&port, &repo, vec![], "shared");
    port.compare_and_swap(
        &repo,
        &reference(),
        &ExpectedTip::Absent,
        &ExpectedTip::Oid(a),
        "shared",
    )
    .unwrap();
    fs::set_permissions(&root, fs::Permissions::from_mode(0o777)).unwrap();
    assert!(wal::Wal::open(&repo).is_err());
}

#[test]
fn historical_ledger_over_admission_bound_does_not_block_new_publication() {
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let a = commit(&port, &repo, vec![], "a");
    port.compare_and_swap(
        &repo,
        &reference(),
        &ExpectedTip::Absent,
        &ExpectedTip::Oid(a.clone()),
        "seed",
    )
    .unwrap();
    port.release_pin_and_compact(&repo, "seed").unwrap();
    let wal = wal::Wal::open(&repo).unwrap();
    let mut receipt = wal.compacted("seed").unwrap().unwrap();
    use std::os::unix::fs::PermissionsExt;
    for n in 0..100_001 {
        receipt.id = format!("history-{n}");
        receipt.digest = wal::canonical_digest(&(
            receipt.v,
            &receipt.id,
            &receipt.request,
            &receipt.binding,
            &receipt.receipt,
            &receipt.expected,
            &receipt.next,
        ))
        .unwrap();
        fs::write(
            root.join("fgos/git/compacted").join(&receipt.id),
            serde_json::to_vec(&receipt).unwrap(),
        )
        .unwrap();
        fs::set_permissions(
            root.join("fgos/git/compacted").join(&receipt.id),
            fs::Permissions::from_mode(0o600),
        )
        .unwrap();
    }
    assert!(wal.compacted("history-100000").unwrap().is_some());
    assert!(wal.active(100_000).unwrap().is_empty());
    port.compare_and_swap(
        &repo,
        &reference(),
        &ExpectedTip::Oid(a.clone()),
        &ExpectedTip::Oid(a.clone()),
        "after-history",
    )
    .unwrap();
    // The Refs port reads the same history once, through `active`, so the 100 000 ledger entries
    // that `scan` counts toward its bound do not refuse it either.
    drop(port);
    driver
        .ensure_branch(
            &repo,
            vec![],
            &RefName::parse("refs/heads/after-history").unwrap(),
            &a,
            "fixture",
            "refs-after-history",
        )
        .expect("a ref change under a 100 000-entry ledger");
}

#[test]
fn pre_attempt_crashes_close_without_blocking_a_new_id() {
    for step in ["before-pin-cas", "after-pin-cas", "pin-read-back"] {
        let t = Temp::new();
        let root = t.0.join("repo");
        init(&root, "sha1", "files");
        let driver = GitDriver::new(&t.0).unwrap();
        let repo = resolve(&driver, &root);
        let mut h = handle(&t.0.join("seal.lock"));
        let port = PublicationPort::new(&driver, authority(&repo, &mut h));
        let a = commit(&port, &repo, vec![], "a");
        drop(port);
        let faulty =
            PublicationPort::with_filesystem(&driver, authority(&repo, &mut h), Fault(step));
        assert!(faulty
            .compare_and_swap(
                &repo,
                &reference(),
                &ExpectedTip::Absent,
                &ExpectedTip::Oid(a.clone()),
                "old"
            )
            .is_err());
        drop(faulty);
        let port = PublicationPort::new(&driver, authority(&repo, &mut h));
        // A crash before record zero also cannot block admission.
        use std::os::unix::fs::DirBuilderExt;
        fs::DirBuilder::new()
            .mode(0o700)
            .create(root.join("fgos/git/operations/empty"))
            .unwrap();
        fs::write(
            root.join("fgos/git/operations/empty/.durable-file-orphan.tmp"),
            b"partial",
        )
        .unwrap();
        port.compare_and_swap(
            &repo,
            &reference(),
            &ExpectedTip::Absent,
            &ExpectedTip::Oid(a.clone()),
            "new",
        )
        .unwrap();
        let wal = wal::Wal::open(&repo).unwrap();
        assert!(wal.active(100).unwrap().is_empty());
        let terminal = wal
            .compacted("old")
            .unwrap()
            .map(|c| c.outcome().unwrap())
            .or_else(|| wal.inspect("old").unwrap().outcome().cloned())
            .unwrap();
        assert!(matches!(terminal, wal::Outcome::AbandonedBeforeAttempt));
        assert_eq!(wal.scan(100).unwrap().unresolved, 0);
    }
}

#[test]
fn publication_config_cache_invalidates_and_transport_budget_is_caller_owned() {
    let t = Temp::new();
    let root = t.0.join("repo");
    let remote = t.0.join("remote");
    init(&root, "sha1", "files");
    init(&remote, "sha1", "files");
    git(
        &root,
        &["remote", "add", "origin", remote.to_str().unwrap()],
    );
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h)).with_remote(RemoteGrant {
        name: "origin".into(),
        pinned_url: remote.to_str().unwrap().into(),
    });
    port.read_ref(&repo, &reference()).unwrap();
    git(&root, &["config", "core.sshCommand", "forbidden"]);
    assert!(port
        .read_ref(&repo, &reference())
        .unwrap_err()
        .cause
        .contains("repository-config-untrusted: core.sshcommand"));
    git(&root, &["config", "--unset", "core.sshCommand"]);
    port.read_ref(&repo, &reference()).unwrap();
    let port = port.with_transport_timeout(std::time::Duration::ZERO);
    // The override affects actual transport, while local plumbing still works.
    port.write_blob(&repo, b"local").unwrap();
    let mapping = "+refs/fgos/events/*:refs/fgos/remotes/origin/events/*".to_owned();
    // A borrowed child that runs out of time reads like a contained one, told apart by `detail.path`.
    let timed_out = port
        .fetch_refs(&repo, "origin", std::slice::from_ref(&mapping))
        .unwrap_err();
    assert_eq!(timed_out.cause, "git-timeout");
    assert_eq!(timed_out.detail.unwrap()["path"], "borrowed");
    let port = port.with_transport_timeout(std::time::Duration::from_secs(5));
    port.fetch_refs(&repo, "origin", &[mapping]).unwrap();
}

#[test]
fn post_attempt_read_failure_is_pending_with_operation_id() {
    struct Tamper(PathBuf);
    impl FileSystem for Tamper {
        fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
            if step == "after-target-cas" {
                git(
                    &self.0,
                    &["symbolic-ref", reference().as_str(), "refs/heads/dangling"],
                );
            }
            Ok(())
        }
    }
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let a = commit(&port, &repo, vec![], "a");
    drop(port);
    let port = PublicationPort::with_filesystem(&driver, authority(&repo, &mut h), Tamper(root));
    let error = port
        .compare_and_swap(
            &repo,
            &reference(),
            &ExpectedTip::Absent,
            &ExpectedTip::Oid(a),
            "read-failure",
        )
        .unwrap_err();
    assert_eq!(error.code, ResultCode::RecoveryRequired);
    assert_eq!(error.operation_id.as_deref(), Some("read-failure"));
    assert!(matches!(
        wal::Wal::open(&repo)
            .unwrap()
            .inspect("read-failure")
            .unwrap()
            .last()
            .phase,
        Phase::TargetAttempt { .. }
    ));
}

#[test]
fn linear_history_walk_batches_commit_reads() {
    use std::io::Write;
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    let mut stream = Vec::new();
    for n in 0..1024 {
        stream.extend_from_slice(
            format!(
                "commit refs/heads/history\ncommitter Test <t@e> {} +0000\ndata 1\nx\n\n",
                n + 1
            )
            .as_bytes(),
        );
    }
    let mut child = Command::new("git")
        .arg("-C")
        .arg(&root)
        .args(["fast-import", "--quiet"])
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    child.stdin.take().unwrap().write_all(&stream).unwrap();
    let output = child.wait_with_output().unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let head = String::from_utf8(git(&root, &["rev-parse", "refs/heads/history"])).unwrap();
    let oid = Oid::parse(head.trim(), ObjectFormat::Sha1).unwrap();
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    port.read_ref(&repo, &reference()).unwrap(); // warm the config preflight
    eprintln!("WALK-BEGIN");
    let page = port
        .walk_commits(
            &repo,
            &[oid],
            &[],
            None,
            WalkBounds {
                max_commits: 2048,
                max_bytes: 1024 * 1024,
            },
        )
        .unwrap();
    eprintln!("WALK-END");
    assert!(page.complete);
    assert_eq!(page.commits.len(), 1024);
}

fn write_historical_chain(repo: &RepoHandle, chain: &wal::Chain) {
    let mut previous = serde_json::Value::Null;
    for (n, record) in chain.records().iter().enumerate() {
        let mut value = serde_json::to_value(record).unwrap();
        if n == 0 {
            for kind in ["RemoteFetch", "RemotePush"] {
                if let Some(fields) = value["phase"]["data"]["kind"]
                    .get_mut(kind)
                    .and_then(serde_json::Value::as_object_mut)
                {
                    fields.remove("targets");
                }
            }
        }
        value["previousDigest"] = previous;
        value.as_object_mut().unwrap().remove("digest");
        let digest = wal::canonical_digest(&value).unwrap();
        value["digest"] = digest.clone().into();
        previous = digest.into();
        let file = repo
            .common_dir()
            .join("fgos/git/operations")
            .join(&record.operation_id)
            .join(format!("{n:08}.json"));
        fs::write(file, serde_json::to_vec(&value).unwrap()).unwrap();
    }
}

#[test]
fn historical_transfer_wal_digests_and_pre_attempt_recovery_remain_compatible() {
    struct RecordFixture;
    impl wal::PublicationAuthority for RecordFixture {
        fn validate_publication_borrow(&self, _: &wal::Intent) -> wal::WalResult<()> {
            Ok(())
        }
    }
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let a = commit(&port, &repo, vec![], "a");
    port.compare_and_swap(
        &repo,
        &reference(),
        &ExpectedTip::Absent,
        &ExpectedTip::Oid(a.clone()),
        "seed",
    )
    .unwrap();
    let wal = wal::Wal::open(&repo).unwrap();
    let seed = wal.inspect("seed").unwrap().intent().clone();
    for (n, kind) in [
        wal::OperationKind::PublicationCas,
        wal::OperationKind::RemoteFetch {
            url: "/unused".into(),
            refspecs: vec!["refs/fgos/events/*".into()],
            targets: vec![],
        },
        wal::OperationKind::RemotePush {
            url: "/unused".into(),
            refspecs: vec![reference().as_str().into()],
            targets: vec![],
        },
    ]
    .into_iter()
    .enumerate()
    {
        for prepared in [false, true] {
            let id = format!("pre-attempt-{n}-{prepared}");
            let mut intent = seed.clone();
            intent.kind = kind.clone();
            intent.expected = seed.next.clone();
            intent.request_digest = wal::canonical_digest(&id).unwrap();
            let chain = match wal.begin(&id, intent, &RecordFixture).unwrap() {
                wal::Begin::Created(c) => c,
                _ => panic!(),
            };
            let chain = if prepared {
                wal.append(&chain, Phase::Prepared).unwrap()
            } else {
                chain
            };
            // Write historical bytes, hashing the old JSON shape directly rather
            // than reserializing a new Record. Also rebind the second record.
            write_historical_chain(&repo, &chain);
            assert_eq!(
                wal.inspect(&id).unwrap().records().len(),
                if prepared { 2 } else { 1 }
            );
            let scan = wal.scan(100).unwrap();
            assert!(scan.complete && scan.entries.iter().all(|e| e.error.is_none()));
        }
    }
    // Rule 4: an attempted historical transfer is observed, never resent.
    // Rules 4a/4b/4c must not turn it into a superseded CAS, abandoned CAS,
    // or configuration approval. The unreachable URL makes replay observable.
    for (n, kind) in [
        wal::OperationKind::RemoteFetch {
            url: "/never-contact".into(),
            refspecs: vec!["refs/fgos/events/*".into()],
            targets: vec![],
        },
        wal::OperationKind::RemotePush {
            url: "/never-contact".into(),
            refspecs: vec![reference().as_str().into()],
            targets: vec![],
        },
    ]
    .into_iter()
    .enumerate()
    {
        let id = format!("historical-attempt-{n}");
        let mut intent = seed.clone();
        intent.kind = kind;
        intent.request_digest = wal::canonical_digest(&id).unwrap();
        let chain = match wal.begin(&id, intent, &RecordFixture).unwrap() {
            wal::Begin::Created(c) => c,
            _ => panic!(),
        };
        let chain = wal.append(&chain, Phase::Prepared).unwrap();
        let chain = wal
            .append(
                &chain,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: chain.intent().expected.clone(),
                    next: chain.intent().next.clone(),
                },
            )
            .unwrap();
        write_historical_chain(&repo, &chain);
        assert_eq!(wal.inspect(&id).unwrap().records().len(), 3);
        assert!(wal
            .scan(100)
            .unwrap()
            .entries
            .iter()
            .all(|e| e.error.is_none()));
        assert!(matches!(
            port.recover(&repo, &id).unwrap().remote,
            Remote::Unknown
        ));
        assert!(matches!(
            port.recover(&repo, &id).unwrap().remote,
            Remote::Unknown
        ));
    }
    port.compare_and_swap(
        &repo,
        &reference(),
        &ExpectedTip::Oid(a.clone()),
        &ExpectedTip::Oid(a),
        "after-pre-attempts",
    )
    .unwrap();
    assert!(wal.active(100).unwrap().is_empty());
    let scan = wal.scan(100).unwrap();
    assert!(scan.complete && scan.entries.iter().all(|e| e.error.is_none()));
    assert_eq!(scan.unresolved, 0);
    for n in 0..3 {
        for prepared in [false, true] {
            let id = format!("pre-attempt-{n}-{prepared}");
            let error = port.recover(&repo, &id).unwrap_err();
            assert!(error.cause.contains("abandoned-before-attempt"), "{error:?}");
        }
    }
}

#[test]
fn batched_walk_returns_a_page_before_an_oversized_future_commit() {
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let parent = commit(&port, &repo, vec![], &"large".repeat(32_000));
    let child = commit(&port, &repo, vec![parent.clone()], "small");
    let first = port
        .walk_commits(
            &repo,
            std::slice::from_ref(&child),
            &[],
            None,
            WalkBounds {
                max_commits: 10,
                max_bytes: 1024,
            },
        )
        .unwrap();
    assert_eq!(first.commits.len(), 1);
    assert!(!first.complete);
    let second = port
        .walk_commits(
            &repo,
            &[child],
            &[],
            first.next_cursor,
            WalkBounds {
                max_commits: 10,
                max_bytes: 256 * 1024,
            },
        )
        .unwrap();
    assert_eq!(second.commits[0].oid, parent);
    assert!(second.complete);
}

#[test]
fn literal_ref_pages_and_batched_tree_paths() {
    for format in ["sha1", "sha256"] {
        for backend in ["files", "reftable"] {
            let t = Temp::new();
            let root = t.0.join("repo");
            init(&root, format, backend);
            let driver = GitDriver::new(&t.0).unwrap();
            let repo = resolve(&driver, &root);
            let mut h = handle(&t.0.join("seal.lock"));
            let port = PublicationPort::new(&driver, authority(&repo, &mut h));
            let blob = port.write_blob(&repo, b"{seal}\0\n").unwrap();
            let child = port.write_tree(&repo, &[]).unwrap();
            let tree = port
                .write_tree(
                    &repo,
                    &[
                        TreeEntry {
                            name: b"seal.json".to_vec(),
                            mode: 0o100644,
                            oid: blob.clone(),
                        },
                        TreeEntry {
                            name: b"events.jsonl".to_vec(),
                            mode: 0o100644,
                            oid: blob.clone(),
                        },
                        TreeEntry {
                            name: b"odd\nname".to_vec(),
                            mode: 0o100644,
                            oid: blob.clone(),
                        },
                        TreeEntry {
                            name: b"dir".to_vec(),
                            mode: 0o040000,
                            oid: child,
                        },
                    ],
                )
                .unwrap();
            let commit = port
                .write_commit(
                    &repo,
                    &CommitInput {
                        tree: tree.clone(),
                        parents: vec![],
                        author: Identity {
                            name: "a".into(),
                            email: "a@b".into(),
                        },
                        committer: Identity {
                            name: "a".into(),
                            email: "a@b".into(),
                        },
                        author_date: "1700000000 +0000".into(),
                        committer_date: "1700000000 +0000".into(),
                        message: b"test".to_vec(),
                    },
                )
                .unwrap();
            git(
                &root,
                &["update-ref", "refs/fgos/events/one", commit.as_str()],
            );
            git(
                &root,
                &[
                    "update-ref",
                    "refs/fgos/git-operations/test/candidate",
                    commit.as_str(),
                ],
            );
            git(
                &root,
                &[
                    "symbolic-ref",
                    "refs/fgos/events/two",
                    "refs/fgos/events/one",
                ],
            );
            let prefixes = [RefPrefix::parse("refs/fgos/").unwrap()];
            let first = Inspect::list_refs(&driver, &repo, &prefixes, None, 1).unwrap();
            assert!(!first.complete);
            assert_eq!(first.entries.len(), 1);
            let second = port
                .list_refs(&repo, &prefixes, first.next_cursor, 1)
                .unwrap();
            assert!(second.complete);
            assert!(
                matches!(&second.entries[0].value, RefValue::Symbolic(r) if r.as_str() == "refs/fgos/events/one")
            );
            assert_eq!(
                port.list_refs(
                    &repo,
                    &[RefPrefix::parse("refs/fgos/git-operations/").unwrap()],
                    None,
                    10
                )
                .unwrap()
                .entries
                .len(),
                1
            );
            for revision in [&tree, &commit] {
                let paths = [
                    b"seal.json".to_vec(),
                    b"events.jsonl".to_vec(),
                    b"missing".to_vec(),
                    b"dir".to_vec(),
                    b"odd\nname".to_vec(),
                ];
                let result = port.read_paths_at(&repo, revision, &paths, 1024).unwrap();
                assert!(matches!(&result[0].value, PathValue::Blob(b) if b == b"{seal}\0\n"));
                assert!(matches!(&result[1].value, PathValue::Blob(_)));
                assert!(matches!(&result[2].value, PathValue::Absent));
                assert!(matches!(
                    &result[3].value,
                    PathValue::NotABlob(ObjectType::Tree)
                ));
                assert!(matches!(&result[4].value, PathValue::Blob(_)));
                assert!(
                    matches!(&Inspect::read_paths_at(&driver, &repo, revision, &paths[..1], 1).unwrap()[0].value, PathValue::Error(e) if e.cause == "blob-too-large")
                );
            }
            assert!(port
                .read_paths_at(&repo, &blob, &[b"x".to_vec()], 10)
                .is_err());
        }
    }
}

#[test]
fn bound_recovery_compacts_observed_attempt_and_nonidentical_successor_supersedes() {
    for point in ["before-pin-cas", "before-target-cas", "after-target-cas"] {
        let t = Temp::new();
        let root = t.0.join("repo");
        init(&root, "sha1", "files");
        let driver = GitDriver::new(&t.0).unwrap();
        let repo = resolve(&driver, &root);
        let mut h = handle(&t.0.join("seal.lock"));
        let plain = PublicationPort::new(&driver, authority(&repo, &mut h));
        let a = commit(&plain, &repo, vec![], "a");
        let b = commit(&plain, &repo, vec![], "different retry");
        drop(plain);
        let faulty =
            PublicationPort::with_filesystem(&driver, authority(&repo, &mut h), Fault(point));
        assert!(faulty
            .compare_and_swap(
                &repo,
                &reference(),
                &ExpectedTip::Absent,
                &ExpectedTip::Oid(a.clone()),
                "old-seal"
            )
            .is_err());
        drop(faulty);
        let port = PublicationPort::new(&driver, authority(&repo, &mut h));
        let pending = port.recover_publications(&repo).unwrap();
        if point == "before-pin-cas" {
            assert!(pending.is_empty());
            assert!(matches!(
                wal::Wal::open(&repo)
                    .unwrap()
                    .compacted("old-seal")
                    .unwrap()
                    .unwrap()
                    .outcome()
                    .unwrap(),
                wal::Outcome::AbandonedBeforeAttempt
            ));
        } else if point == "after-target-cas" {
            assert!(pending.is_empty());
            let old = wal::Wal::open(&repo)
                .unwrap()
                .compacted("old-seal")
                .unwrap()
                .unwrap()
                .outcome()
                .unwrap();
            assert!(matches!(
                old,
                wal::Outcome::Success {
                    attribution: wal::Attribution::EffectObservedOnly,
                    ..
                }
            ));
        } else {
            assert_eq!(pending, vec!["old-seal"]);
            port.compare_and_swap(
                &repo,
                &reference(),
                &ExpectedTip::Absent,
                &ExpectedTip::Oid(b),
                "new-seal",
            )
            .unwrap();
            let old = port.recover(&repo, "old-seal").unwrap_err();
            assert_eq!(old.code, ResultCode::Superseded);
            // Both terminal chains, including the successor, are reclaimed.
            assert!(port.recover_publications(&repo).unwrap().is_empty());
            assert!(wal::Wal::open(&repo)
                .unwrap()
                .compacted("old-seal")
                .unwrap()
                .is_some());
            assert!(wal::Wal::open(&repo)
                .unwrap()
                .compacted("new-seal")
                .unwrap()
                .is_some());
        }
        assert_eq!(
            std::fs::read_dir(root.join("fgos/git/operations"))
                .unwrap()
                .count(),
            0
        );
    }
}

#[test]
fn sigkill_before_target_allows_a_new_nonidentical_operation_and_terminal_supersession() {
    use std::io::Write;
    use std::os::unix::process::ExitStatusExt;
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    let mut child = Command::new(std::env::current_exe().unwrap())
        .args(["--exact", "crash_child", "--ignored", "--nocapture"])
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(&serde_json::to_vec(&(&root, &t.0, "before-target-cas")).unwrap())
        .unwrap();
    let output = child.wait_with_output().unwrap();
    assert_eq!(
        output.status.signal(),
        Some(9),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let old = wal::Wal::open(&repo)
        .unwrap()
        .inspect("crashed")
        .unwrap()
        .intent()
        .next
        .clone();
    let next = commit(&port, &repo, vec![], "nonidentical after real kill");
    assert_ne!(old, wal::Tip::Oid(next.as_str().into()));
    port.compare_and_swap(
        &repo,
        &reference(),
        &ExpectedTip::Absent,
        &ExpectedTip::Oid(next),
        "fresh-operation-id",
    )
    .unwrap();
    assert_eq!(
        port.recover(&repo, "crashed").unwrap_err().code,
        ResultCode::Superseded
    );
    assert!(port.recover_publications(&repo).unwrap().is_empty());
    assert!(wal::Wal::open(&repo)
        .unwrap()
        .active(100)
        .unwrap()
        .is_empty());
    assert_eq!(
        fs::read_dir(root.join("fgos/git/operations"))
            .unwrap()
            .count(),
        0
    );
}

#[test]
fn fetch_mapping_is_additive_idempotent_and_records_remote_url() {
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    git(
        &root,
        &[
            "remote",
            "add",
            "origin",
            "https://example.invalid/project.git",
        ],
    );
    git(&root, &["config", "unrelated.keep", "value"]);
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let maps = publication_fetch_mappings("origin").unwrap();
    driver
        .ensure_fetch_mapping(&repo, "origin", &maps, "mapping-first")
        .unwrap();
    let config = fs::read(root.join("config")).unwrap();
    driver
        .ensure_fetch_mapping(&repo, "origin", &maps, "mapping-first")
        .unwrap();
    driver
        .ensure_fetch_mapping(&repo, "origin", &maps, "mapping-second")
        .unwrap();
    driver
        .ensure_fetch_mapping(&repo, "origin", &maps, "mapping-second")
        .unwrap();
    assert_eq!(fs::read(root.join("config")).unwrap(), config);
    assert_eq!(git(&root, &["config", "unrelated.keep"]), b"value\n");
    assert_eq!(
        driver
            .configured_fetch_refspecs(&repo, "origin")
            .unwrap()
            .len(),
        3
    );
    assert!(driver.push_refspecs(&repo, "origin").unwrap().is_empty());
    let provenance = driver
        .fetch_mapping_provenance(&repo, "origin")
        .unwrap()
        .unwrap();
    assert_eq!(provenance.operation_id, "mapping-second");
    assert_eq!(provenance.remote_url, "https://example.invalid/project.git");
    assert_eq!(provenance.refspecs, maps);
    git(
        &root,
        &[
            "remote",
            "set-url",
            "origin",
            "https://example.invalid/moved.git",
        ],
    );
    driver
        .ensure_fetch_mapping(&repo, "origin", &maps, "mapping-reapprove")
        .unwrap();
    let approved = driver
        .fetch_mapping_provenance(&repo, "origin")
        .unwrap()
        .unwrap();
    assert_eq!(approved.operation_id, "mapping-reapprove");
    assert_eq!(approved.remote_url, "https://example.invalid/moved.git");
    let approval = wal::Wal::open(&repo)
        .unwrap()
        .inspect("mapping-reapprove")
        .unwrap();
    assert!(matches!(
        approval.outcome(),
        Some(wal::Outcome::ConfigApproved)
    ));
    assert_eq!(approval.records().len(), 2);
    assert!(!approval
        .records()
        .iter()
        .any(|r| matches!(r.phase, wal::Phase::TargetAttempt { .. })));

    assert_eq!(
        wal::Wal::open(&repo).unwrap().scan(100).unwrap().unresolved,
        0
    );
    assert!(driver
        .ensure_fetch_mapping(
            &repo,
            "origin",
            &["+refs/heads/*:refs/heads/*".into()],
            "bad-mapping"
        )
        .is_err());
    assert!(driver
        .ensure_fetch_mapping(&repo, "origin", &[maps[0].clone()], "mapping-first")
        .is_err());
}

#[test]
fn config_busy_staging_failure_and_raw_edit_resolve_without_removing_foreign_locks() {
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    git(
        &root,
        &["remote", "add", "origin", "https://example.invalid/r.git"],
    );
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let maps = vec!["+refs/fgos/events/*:refs/fgos/remotes/origin/events/*".into()];
    let native = root.join("config.lock");
    fs::write(&native, "foreign").unwrap();
    let busy = driver
        .ensure_fetch_mapping(&repo, "origin", &maps, "busy")
        .unwrap_err();
    assert_eq!(busy.code, ResultCode::Busy);
    assert!(busy.retryable);
    assert_eq!(fs::read(&native).unwrap(), b"foreign");
    assert!(wal::Wal::open(&repo).unwrap().inspect("busy").is_err());
    fs::remove_file(&native).unwrap();
    struct Fault<'a> {
        root: &'a Path,
        mode: &'a str,
    }
    impl FileSystem for Fault<'_> {
        fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
            if step == "config-staged" {
                match self.mode {
                    "staging" => return Err(std::io::Error::other("staging I/O failure")),
                    "stale" => {
                        fs::write(self.root.join("config"), b"[unrelated]\nkeep = edited\n")?
                    }
                    "replaced" => {
                        fs::rename(
                            self.root.join("config.lock"),
                            self.root.join("our-old-lock"),
                        )?;
                        fs::write(self.root.join("config.lock"), "foreign replacement")?;
                        return Err(std::io::Error::other("substitution"));
                    }
                    _ => (),
                }
            }
            if step == "config-replaced" && self.mode == "readback" {
                return Err(std::io::Error::other("post-rename I/O failure"));
            }
            Ok(())
        }
    }
    let original = fs::read(root.join("config")).unwrap();
    for mode in ["staging", "stale", "replaced", "readback"] {
        fs::write(root.join("config"), &original).unwrap();
        assert!(driver
            .ensure_fetch_mapping_with_filesystem(
                &repo,
                "origin",
                &maps,
                mode,
                &Fault { root: &root, mode }
            )
            .is_err());
        assert_eq!(
            wal::Wal::open(&repo).unwrap().scan(100).unwrap().unresolved,
            0
        );
        if mode == "replaced" {
            assert_eq!(fs::read(&native).unwrap(), b"foreign replacement");
            fs::remove_file(&native).unwrap();
        } else {
            assert!(!native.exists(), "{mode}");
        }
        if mode == "stale" {
            assert_eq!(
                fs::read(root.join("config")).unwrap(),
                b"[unrelated]\nkeep = edited\n"
            );
        }
    }
}

#[test]
fn wal_open_refuses_unfenced_workspace_without_creating_records() {
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    fs::remove_dir_all(repo.trusted_main_root().join(".fgos/locks/activation.lock")).unwrap();
    assert_eq!(
        wal::Wal::open(&repo).err().unwrap().to_string(),
        "git-fence-missing"
    );
    assert!(!repo.common_dir().join("fgos/git").exists());
}

#[test]
fn config_recovery_observes_attempted_changes_and_never_replays_old_ids() {
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    git(
        &root,
        &["remote", "add", "origin", "https://example.invalid/r.git"],
    );
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let maps = vec!["+refs/fgos/events/*:refs/fgos/remotes/origin/events/*".into()];
    driver
        .ensure_fetch_mapping(&repo, "origin", &maps, "seed")
        .unwrap();
    let journal = wal::Wal::open(&repo).unwrap();
    let intent = journal.inspect("seed").unwrap().intent().clone();
    struct Seed;
    impl wal::PublicationAuthority for Seed {
        fn validate_publication_borrow(&self, _: &wal::Intent) -> wal::WalResult<()> {
            Ok(())
        }
    }
    for (id, installed) in [("observed", true), ("uncertain", false)] {
        if !installed {
            git(&root, &["config", "--unset-all", "remote.origin.fetch"]);
        }
        let chain = match journal.begin(id, intent.clone(), &Seed).unwrap() {
            wal::Begin::Created(c) => c,
            _ => panic!(),
        };
        let chain = journal.append(&chain, Phase::Prepared).unwrap();
        journal
            .append(
                &chain,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: wal::Tip::Absent,
                    next: wal::Tip::Absent,
                },
            )
            .unwrap();
        driver
            .ensure_fetch_mapping(&repo, "origin", &maps, &format!("later-{id}"))
            .unwrap();
        assert!(
            matches!(journal.inspect(id).unwrap().outcome(), Some(wal::Outcome::Transfer { acknowledged, unknown, .. }) if *acknowledged == installed && *unknown != installed)
        );
        assert_eq!(journal.scan(100).unwrap().unresolved, 0);
        if !installed {
            assert!(driver
                .ensure_fetch_mapping(&repo, "origin", &maps, id)
                .is_err());
        }
    }
}

/// Each publication compacts the ref's older terminal chains: their pins
/// are released and their id bindings and receipts move to the ledger, so
/// retained operation directories stay bounded however long the stream
/// runs. A recent id keeps its whole chain for `recover`; a compacted id
/// replayed with the same request still returns its receipt, and with a
/// different request is refused.
#[test]
fn publication_keeps_retained_chains_bounded_and_compacted_ids_bound() {
    for (format, backend) in [("sha1", "files"), ("sha256", "files"), ("sha1", "reftable"), ("sha256", "reftable")] {
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, format, backend);
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let mut tip = ExpectedTip::Absent;
    let mut done = Vec::new();
    for n in 0..12 {
        let parents = match &tip {
            ExpectedTip::Oid(o) => vec![o.clone()],
            ExpectedTip::Absent => vec![],
        };
        let next = commit(&port, &repo, parents, &format!("seal {n}"));
        let id = format!("seal-{n:02}");
        let receipt = port
            .compare_and_swap(&repo, &reference(), &tip, &ExpectedTip::Oid(next.clone()), &id)
            .unwrap();
        assert!(matches!(receipt.attribution, Attribution::ThisInvocationWonCas));
        done.push((id, tip.clone(), next.clone()));
        tip = ExpectedTip::Oid(next);
        // Keep the change times of successive chains apart.
        std::thread::sleep(std::time::Duration::from_millis(5));
    }
    let operations = repo.common_dir().join("fgos/git/operations");
    let retained = fs::read_dir(&operations).unwrap().count();
    assert!(retained <= 5, "retained operation directories: {retained}");
    let pins = fs::read_dir(repo.common_dir().join("refs/fgos/git-operations"))
        .map(|d| d.count())
        .unwrap_or(0);
    assert!(pins <= 5, "retained pins: {pins}");
    let ledger = fs::read_dir(repo.common_dir().join("fgos/git/compacted")).unwrap().count();
    assert!(ledger >= 7, "compacted ids: {ledger}");
    // The first id is compacted: same request returns its receipt.
    let (id, old, next) = &done[1];
    assert!(!operations.join(id).exists());
    // Compaction preserves the full durable terminal receipt for recovery.
    assert_eq!(&port.release_pin_and_compact(&repo, id).unwrap().id, id);
    let compacted = port.recover(&repo, id).unwrap();
    assert_eq!(&compacted.local_effect.expected, old);
    assert_eq!(compacted.local_effect.published_oid.as_ref(), Some(next));
    assert!(matches!(compacted.attribution, Attribution::ThisInvocationWonCas));
    let receipt = port
        .compare_and_swap(&repo, &reference(), old, &ExpectedTip::Oid(next.clone()), id)
        .unwrap();
    assert_eq!(receipt.local_effect.published_oid.as_ref(), Some(next));
    assert!(matches!(receipt.attribution, Attribution::ThisInvocationWonCas));
    // A different request under the same id is refused.
    assert!(port
        .compare_and_swap(&repo, &reference(), &ExpectedTip::Absent, &ExpectedTip::Oid(done[1].2.clone()), id)
        .is_err());
    // The latest id keeps its whole chain for recover.
    let (last, _, last_next) = done.last().unwrap();
    let recovered = port.recover(&repo, last).unwrap();
    assert_eq!(recovered.local_effect.published_oid.as_ref(), Some(last_next));
    }
}

#[test]
fn changing_cas_uses_the_intact_candidate_fast_path() {
    struct FastPath(std::sync::atomic::AtomicUsize);
    impl FileSystem for FastPath {
        fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
            if step == "candidate-fast-path" { self.0.fetch_add(1, Ordering::SeqCst); }
            Ok(())
        }
    }
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha256", "files");
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let fast = FastPath(Default::default());
    let port = PublicationPort::with_filesystem(&driver, authority(&repo, &mut h), &fast);
    let a = commit(&port, &repo, vec![], "a");
    port.compare_and_swap(&repo, &reference(), &ExpectedTip::Absent, &ExpectedTip::Oid(a.clone()), "fast-a").unwrap();
    fast.0.store(0, Ordering::SeqCst);
    let b = commit(&port, &repo, vec![a.clone()], "b");
    port.compare_and_swap(&repo, &reference(), &ExpectedTip::Oid(a), &ExpectedTip::Oid(b), "fast-b").unwrap();
    assert_eq!(fast.0.load(Ordering::SeqCst), 1, "the changing CAS was decided by one successful rev-list");
}

#[test]
fn recreated_loose_object_gets_directory_durability_again() {
    struct Syncs(AtomicU64);
    impl FileSystem for Syncs {
        fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
            if step == "publication-directory-fsync" { self.0.fetch_add(1, Ordering::SeqCst); }
            Ok(())
        }
    }
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let syncs = Syncs(AtomicU64::new(0));
    let port = PublicationPort::with_filesystem(&driver, authority(&repo, &mut h), &syncs);
    let oid = port.write_blob(&repo, b"recreated").unwrap();
    syncs.0.store(0, Ordering::SeqCst);
    assert_eq!(port.write_blob(&repo, b"recreated").unwrap(), oid);
    assert_eq!(syncs.0.load(Ordering::SeqCst), 0);
    let hex = oid.as_str();
    fs::remove_file(repo.common_dir().join("objects").join(&hex[..2]).join(&hex[2..])).unwrap();
    assert_eq!(port.write_blob(&repo, b"recreated").unwrap(), oid);
    assert!(syncs.0.load(Ordering::SeqCst) >= 2);
}

#[test]
fn ordinary_fetch_and_pull_survive_absent_legacy_and_repair_exact_mapping() {
    let t = Temp::new();
    let remote = t.0.join("remote.git");
    init(&remote, "sha1", "files");
    let root = t.0.join("checkout");
    git(
        &t.0,
        &["clone", remote.to_str().unwrap(), root.to_str().unwrap()],
    );
    git(
        &root,
        &[
            "-c",
            "user.name=Fixture",
            "-c",
            "user.email=fixture@example.invalid",
            "commit",
            "--allow-empty",
            "-m",
            "initial",
        ],
    );
    git(&root, &["push", "-u", "origin", "HEAD"]);
    git(&root, &["remote", "rename", "origin", "upstream"]);
    git(&root, &["config", "unrelated.keep", "preserved"]);
    let old = "+refs/fgos/legacy:refs/fgos/remotes/upstream/legacy";
    git(&root, &["config", "--add", "remote.upstream.fetch", old]);
    let failed = Command::new("git")
        .arg("-C")
        .arg(&root)
        .arg("fetch")
        .output()
        .unwrap();
    assert!(!failed.status.success());
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let maps = publication_fetch_mappings("upstream").unwrap();
    driver
        .ensure_fetch_mapping(&repo, "upstream", &maps, "repair-exact")
        .unwrap();
    let config = git(&root, &["config", "--get-all", "remote.upstream.fetch"]);
    assert!(!String::from_utf8_lossy(&config).lines().any(|r| r == old));
    assert_eq!(git(&root, &["config", "unrelated.keep"]), b"preserved\n");
    git(&root, &["fetch"]);
    git(&root, &["pull", "--ff-only"]);
    let head = String::from_utf8(git(&root, &["rev-parse", "HEAD"])).unwrap();
    git(&remote, &["update-ref", "refs/fgos/legacy", head.trim()]);
    git(&root, &["fetch"]);
    git(&root, &["pull", "--ff-only"]);
    assert_eq!(
        git(&root, &["rev-parse", "refs/fgos/remotes/upstream/legacy"]),
        head.as_bytes()
    );
    assert_eq!(
        driver
            .fetch_mapping_provenance(&repo, "upstream")
            .unwrap()
            .unwrap()
            .refspecs,
        maps
    );
    // Both forms installed is still a broken configuration: remove the exact
    // form even when the desired wildcard was already present.
    git(&root, &["config", "--add", "remote.upstream.fetch", old]);
    driver
        .ensure_fetch_mapping(&repo, "upstream", &maps, "repair-both")
        .unwrap();
    assert!(!String::from_utf8_lossy(&git(
        &root,
        &["config", "--get-all", "remote.upstream.fetch"]
    ))
    .lines()
    .any(|r| r == old));
    let bytes = fs::read(repo.common_dir().join("config")).unwrap();
    driver
        .ensure_fetch_mapping(&repo, "upstream", &maps, "repair-idempotent")
        .unwrap();
    assert_eq!(fs::read(repo.common_dir().join("config")).unwrap(), bytes);
}

#[test]
fn event_publication_recovery_ignores_unrelated_recovery_leaf() {
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let _wal = wal::Wal::open(&repo).unwrap();
    fs::create_dir_all(root.join("fgos/git/locks")).unwrap();
    let leaf = match acquire(&Resource::new("recovery", root.join("fgos/git/locks/recovery.lock")), Mode::Ex, Wait::Try, 2000) {
        Acquire::Acquired(h) => h, e => panic!("{e:?}"),
    };
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let a = commit(&port, &repo, vec![], "event");
    port.compare_and_swap(&repo, &reference(), &ExpectedTip::Absent, &ExpectedTip::Oid(a.clone()), "live-recovery").unwrap();
    port.recover(&repo, "live-recovery").unwrap();
    // Same-id publication invokes recover on the live Event Store path too.
    port.compare_and_swap(&repo, &reference(), &ExpectedTip::Absent, &ExpectedTip::Oid(a), "live-recovery").unwrap();
    assert!(port.recover_publications(&repo).unwrap().is_empty());
    drop(leaf);
}

/// Appends a record to the chain of `id` the first time `step` is reached, the way a second
/// writer racing for the same operation would.
struct Race {
    repo: RepoHandle,
    id: &'static str,
    step: &'static str,
    fired: std::sync::Arc<std::sync::atomic::AtomicBool>,
}
impl FileSystem for Race {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        if step == self.step && !self.fired.swap(true, Ordering::SeqCst) {
            let wal = wal::Wal::open(&self.repo).map_err(std::io::Error::other)?;
            let chain = wal.inspect(self.id).map_err(std::io::Error::other)?;
            wal.append(&chain, Phase::Prepared)
                .map_err(std::io::Error::other)?;
        }
        Ok(())
    }
}

#[test]
fn publication_names_a_busy_wal_like_every_other_port() {
    // `attempted_operation_is_never_replayed_after_fault_or_aba` injects faults but never a second
    // writer. A writer that wins the next record of this operation's chain makes the loser's append
    // fail as busy; the caller must see a refusal named `busy`, like Refs gives, not
    // recovery-required carrying a debug dump of the internal error.
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let a = commit(&port, &repo, vec![], "a");
    drop(port);
    let fired = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));
    let racing = PublicationPort::with_filesystem(
        &driver,
        authority(&repo, &mut h),
        Race {
            repo: resolve(&driver, &root),
            id: "busy",
            step: "pin-read-back",
            fired: fired.clone(),
        },
    );
    let e = racing
        .compare_and_swap(
            &repo,
            &reference(),
            &ExpectedTip::Absent,
            &ExpectedTip::Oid(a),
            "busy",
        )
        .unwrap_err();
    assert!(
        fired.load(Ordering::SeqCst),
        "the competing record was never appended: {e:?}"
    );
    assert_eq!((e.code, e.cause.as_str()), (ResultCode::Refused, "busy"));
}

#[test]
fn a_borrow_that_is_unavailable_has_one_cause_name_whichever_check_finds_it() {
    // The borrow is checked when the authority is built and again, through the WAL, when an
    // operation of another writer is found on the same ref. One failure must read the same through
    // both routes. No existing case compares the two.
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha1", "files");
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let path = h.path().to_path_buf();
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let a = commit(&port, &repo, vec![], "a");
    drop(port);
    // An operation of the default writer is left unresolved on the ref.
    let faulty = PublicationPort::with_filesystem(
        &driver,
        authority(&repo, &mut h),
        Fault("before-target-cas"),
    );
    faulty
        .compare_and_swap(
            &repo,
            &reference(),
            &ExpectedTip::Absent,
            &ExpectedTip::Oid(a.clone()),
            "left-behind",
        )
        .unwrap_err();
    drop(faulty);

    // Route one: the authority itself refuses a resource path that is not the borrowed lock.
    let wrong_path = t.0.join("not-the-seal.lock");
    fs::write(&wrong_path, b"").unwrap();
    let built = HolderAuthority::new(&repo, &mut h, &wrong_path, reference(), "test-writer")
        .err()
        .expect("a borrow bound to another path");

    // Route two: another writer meets the unresolved operation during admission.
    let other = HolderAuthority::new(&repo, &mut h, &path, reference(), "other-writer").unwrap();
    let port = PublicationPort::new(&driver, other);
    let admitted = port
        .compare_and_swap(
            &repo,
            &reference(),
            &ExpectedTip::Absent,
            &ExpectedTip::Oid(a),
            "second-writer",
        )
        .unwrap_err();
    // Admission may name the blocking operation in front of the cause; the cause itself is one name.
    assert!(
        admitted.cause.ends_with(&built.cause),
        "the same unavailable borrow reads differently through two routes: {:?} and {:?}",
        built.cause,
        admitted.cause
    );
}
