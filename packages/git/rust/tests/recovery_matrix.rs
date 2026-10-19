#![cfg(all(target_os = "linux", target_arch = "x86_64"))]
// Reuse Land/SafeRestore's real repository fixture. The syscall crash harness
// follows land_crash_matrix/worktree: no production fault flag or synthetic WAL.
include!("support/land.rs");
use fgos_holder_lock::{Acquire, BorrowedHandle, Handle, Mode, Resource, Wait, acquire};
use serde_json::{Value, json};
use std::{
    io::{Read, Write},
    os::unix::{fs::MetadataExt, process::CommandExt},
    process::Stdio,
};
const ID: &str = "recovery-matrix";
const WRITER: &str = "fixture";
const KINDS: [&str; 12] = [
    "RefUpdate",
    "RefDelete",
    "Land",
    "ScopedCommit",
    "Sync",
    "WorktreeCreate",
    "WorktreeMove",
    "WorktreeRemove",
    "Restore",
    "ConfigChange",
    "RemoteTransfer",
    "PublicationCas",
];
fn locked(name: &str, path: PathBuf) -> Handle {
    match acquire(&Resource::new(name, path), Mode::Ex, Wait::Try, 2000) {
        Acquire::Acquired(h) => h,
        e => panic!("{e:?}"),
    }
}
fn custody(main: &Path, tree: &Path) -> Handle {
    let m = fs::metadata(tree).unwrap();
    let born = m
        .created()
        .unwrap()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    locked(
        "dispatch-cwd",
        main.join(format!(
            ".fgos/locks/dispatch-cwd--{}-{}-{born}.lock",
            m.dev(),
            m.ino()
        )),
    )
}
fn held(h: &Option<Handle>) -> Vec<BorrowedHandle<'_>> {
    h.iter().map(|h| BorrowedHandle::new(h).unwrap()).collect()
}
fn publication<'a>(
    driver: &'a GitDriver,
    repo: &RepoHandle,
    h: &'a mut Handle,
) -> PublicationPort<'a> {
    let path = h.path().to_owned();
    PublicationPort::new(
        driver,
        HolderAuthority::new(
            repo,
            h,
            &path,
            RefName::parse("refs/fgos/events/machine").unwrap(),
            WRITER,
        )
        .unwrap(),
    )
}
#[test]
#[ignore = "subprocess of recovery_matrix_all_payload_kinds"]
fn recovery_matrix_child() {
    let mut input = String::new();
    std::io::stdin().read_to_string(&mut input).unwrap();
    let v: Value = serde_json::from_str(&input).unwrap();
    let main = Path::new(v["main"].as_str().unwrap());
    let temp = Path::new(v["temp"].as_str().unwrap());
    let kind = v["kind"].as_str().unwrap();
    let driver = GitDriver::new(&temp.join("state")).unwrap();
    let tree = if matches!(kind, "ScopedCommit" | "Sync" | "RefCheckout") {
        temp.join("producer")
    } else {
        main.to_owned()
    };
    let repo = match driver.resolve_repo(&tree, main).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let lease = (tree != main).then(|| custody(main, &tree));
    let target = Oid::parse(v["target"].as_str().unwrap(), repo.object_format()).unwrap();
    let source = Oid::parse(v["source"].as_str().unwrap(), repo.object_format()).unwrap();
    let baseline = if kind == "ScopedCommit" {
        let b = driver.preflight_commit(&repo, held(&lease)).unwrap();
        fs::write(tree.join("b"), "producer\n").unwrap();
        Some(b)
    } else {
        None
    };
    let mut seal = locked("event-seal", temp.join("seal.lock"));
    match kind {
        "RefUpdate" | "RefDelete" | "RefCheckout" => {
            driver
                .change_ref(
                    &repo,
                    held(&lease),
                    &RefName::parse("refs/heads/topic").unwrap(),
                    &ExpectedTip::Oid(target.clone()),
                    &if kind == "RefDelete" {
                        ExpectedTip::Absent
                    } else {
                        ExpectedTip::Oid(source)
                    },
                    kind == "RefCheckout",
                    WRITER,
                    ID,
                    &wal::OsFileSystem,
                )
                .unwrap();
        }
        "Land" => {
            driver
                .prepare_land(
                    &repo,
                    vec![],
                    &serde_json::from_value(v["request"].clone()).unwrap(),
                    WRITER,
                    ID,
                )
                .unwrap();
        }
        "ScopedCommit" => {
            driver
                .scoped_commit(
                    &repo,
                    held(&lease),
                    baseline.as_ref().unwrap(),
                    &CommitRequest {
                        writes: vec!["b".into()],
                        message: "matrix".into(),
                        cutover_grant: None,
                    },
                    WRITER,
                    ID,
                )
                .unwrap();
        }
        "Sync" => {
            driver
                .start_sync(&repo, held(&lease), &source, "matrix sync", WRITER, ID)
                .unwrap();
        }
        "WorktreeCreate" => {
            driver
                .create_worktree(
                    &repo,
                    vec![],
                    &WorktreeCreate {
                        path: temp.join("allocated"),
                        branch: None,
                        base: target,
                        session_id: None,
                    },
                    WRITER,
                    ID,
                )
                .unwrap();
        }
        "WorktreeMove" => {
            driver
                .relocate_worktree(
                    &repo,
                    vec![],
                    &temp.join("worker"),
                    &temp.join("moved"),
                    &target,
                    WRITER,
                    ID,
                )
                .unwrap();
        }
        "WorktreeRemove" => {
            driver
                .remove_worktree(
                    &repo,
                    vec![],
                    &temp.join("worker"),
                    &WorktreeDelivery {
                        expected_tip: target.clone(),
                        delivered_to: target.clone(),
                        evidence_digest: wal::canonical_digest(&(
                            "matrix delivery",
                            target.as_str(),
                        ))
                        .unwrap(),
                    },
                    WRITER,
                    ID,
                )
                .unwrap();
        }
        "Restore" => {
            driver
                .apply_restore(
                    &repo,
                    vec![],
                    &RestoreRequest {
                        expected_head: target.as_str().into(),
                        target: source.as_str().into(),
                        reason: "matrix".into(),
                        reapply_local_delta: true,
                        allowed_replacements: vec![],
                    },
                    WRITER,
                    ID,
                )
                .unwrap();
        }
        "ConfigChange" => {
            driver
                .ensure_hooks(&repo, &main.join(".githooks"), ID)
                .unwrap();
        }
        "RemoteTransfer" => {
            driver
                .push_refs(
                    &repo,
                    vec![],
                    &RemoteGrant {
                        name: "origin".into(),
                        pinned_url: temp.join("remote.git").to_str().unwrap().into(),
                    },
                    &[RefMapping {
                        source: RefName::parse("refs/heads/trunk").unwrap(),
                        destination: RefName::parse("refs/heads/shared").unwrap(),
                    }],
                    WRITER,
                    ID,
                )
                .unwrap();
        }
        "PublicationCas" => {
            publication(&driver, &repo, &mut seal)
                .compare_and_swap(
                    &repo,
                    &RefName::parse("refs/fgos/events/machine").unwrap(),
                    &ExpectedTip::Absent,
                    &ExpectedTip::Oid(target),
                    ID,
                )
                .unwrap();
        }
        _ => panic!("unknown kind"),
    }
    panic!("controller did not interrupt {kind}");
}
// Stop the operating controller immediately after the first directory fsync
// following Intent installation. It has no running Git child at this boundary.
// Unlike polling, ptrace cannot miss a fast operation or race the next effect.
fn interrupt(f: &Fixture, kind: &str) { interrupt_at(f, kind, "intent"); }
fn interrupt_at(f: &Fixture, kind: &str, boundary: &str) {
    let mut command = Command::new(std::env::current_exe().unwrap());
    command
        .args([
            "--exact",
            "recovery_matrix_child",
            "--ignored",
            "--nocapture",
        ])
        .stdin(Stdio::piped())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit());
    unsafe {
        command.pre_exec(|| {
            if libc::ptrace(libc::PTRACE_TRACEME, 0, 0, 0) < 0 {
                return Err(std::io::Error::last_os_error());
            }
            Ok(())
        });
    }
    let mut child = command.spawn().unwrap();
    child.stdin.take().unwrap().write_all(json!({"main": f.main, "temp": f.temp, "kind": kind, "target": f.request.target, "source": f.request.source, "request": f.request}).to_string().as_bytes()).unwrap();
    let pid = child.id() as libc::pid_t;
    let mut status = 0;
    assert_eq!(unsafe { libc::waitpid(pid, &mut status, 0) }, pid);
    assert!(
        libc::WIFSTOPPED(status),
        "{kind}: child ended before trace stop: {status}"
    );
    let options = libc::PTRACE_O_TRACESYSGOOD
        | libc::PTRACE_O_TRACEFORK
        | libc::PTRACE_O_TRACEVFORK
        | libc::PTRACE_O_TRACECLONE
        | libc::PTRACE_O_TRACEEXEC
        | libc::PTRACE_O_EXITKILL;
    assert_eq!(
        unsafe { libc::ptrace(libc::PTRACE_SETOPTIONS, pid, 0, options) },
        0
    );
    let record = f
        .main
        .join(format!(".git/fgos/git/operations/{ID}/00000000.json"));
    let mut owned = std::collections::BTreeSet::from([pid]);
    let mut reached = false;
    let mut killed = false;
    assert_eq!(unsafe { libc::ptrace(libc::PTRACE_SYSCALL, pid, 0, 0) }, 0);
    loop {
        let tid = unsafe { libc::waitpid(-1, &mut status, libc::__WALL) };
        if tid < 0 {
            assert_eq!(
                std::io::Error::last_os_error().raw_os_error(),
                Some(libc::ECHILD)
            );
            break;
        }
        if libc::WIFEXITED(status) || libc::WIFSIGNALED(status) {
            if tid == pid {
                killed = libc::WIFSIGNALED(status) && libc::WTERMSIG(status) == libc::SIGKILL;
            }
            owned.remove(&tid);
            continue;
        }
        if !libc::WIFSTOPPED(status) {
            continue;
        }
        owned.insert(tid);
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
                unsafe { libc::ptrace(libc::PTRACE_GETEVENTMSG, tid, 0, &mut new_pid) },
                0
            );
            owned.insert(new_pid as libc::pid_t);
        }
        if !reached && libc::WSTOPSIG(status) == (libc::SIGTRAP | 0x80) {
            let mut regs: libc::user_regs_struct = unsafe { std::mem::zeroed() };
            assert_eq!(
                unsafe { libc::ptrace(libc::PTRACE_GETREGS, tid, 0, &mut regs) },
                0
            );
            let durable = regs.orig_rax == libc::SYS_fsync as u64 && regs.rax == 0;
            let renamed = [libc::SYS_rename, libc::SYS_renameat, libc::SYS_renameat2].contains(&(regs.orig_rax as i64)) && regs.rax == 0;
            reached = if boundary == "intent" { durable && record.is_file() }
            else if (durable || renamed) && record.is_file() {
                let wal = wal::Wal::open_existing(f.repo.common_dir(), wal::OsFileSystem).unwrap();
                let chain = wal.inspect(ID).unwrap();
                match boundary {
                    "pin" => f.main.join(format!(".git/refs/fgos/git-operations/{ID}/candidate")).is_file(),
                    "attempt" => durable && matches!(chain.last_state(), wal::Phase::TargetAttempt {..}),
                    "transfer-effect" => renamed && fs::read_to_string(f.temp.join("remote.git/refs/heads/shared")).is_ok_and(|v| v.trim() == f.request.target),
                    "cas" => renamed && fs::read_to_string(f.main.join(".git/refs/heads/topic")).is_ok_and(|v| v.trim() == f.request.source),
                    _ => panic!("unknown boundary"),
                }
            } else { false };
            if reached {
                for task in &owned {
                    unsafe {
                        libc::kill(*task, libc::SIGKILL);
                    }
                }
            }
        }
        let signal = libc::WSTOPSIG(status);
        let deliver = if reached {
            libc::SIGKILL
        } else if [libc::SIGTRAP, libc::SIGTRAP | 0x80, libc::SIGSTOP].contains(&signal) {
            0
        } else {
            signal
        };
        unsafe {
            libc::ptrace(libc::PTRACE_SYSCALL, tid, 0, deliver);
        }
    }
    assert!(
        reached && killed,
        "{kind}: did not SIGKILL at durable Intent"
    );
    assert_eq!(child.wait().unwrap_err().raw_os_error(), Some(libc::ECHILD));
}
fn observed(result: fgos_git::Result<Value>) -> Value {
    match result {
        Ok(v) => v,
        Err(e) => {
            assert_eq!(e.cause, "abandoned-before-attempt");
            assert_eq!(e.operation_id.as_deref(), Some(ID));
            json!({"cause":e.cause,"receipt":e.receipt.expect("terminal refusal includes receipt")})
        }
    }
}
fn own_recovery(
    driver: &GitDriver,
    repo: &RepoHandle,
    kind: &str,
    lease: &Option<Handle>,
    seal: &mut Handle,
) -> Value {
    match kind {
        "RefUpdate" | "RefDelete" => serde_json::to_value(
            driver
                .recover_ref_operation(repo, vec![], WRITER, ID)
                .unwrap(),
        )
        .unwrap(),
        "Land" => {
            serde_json::to_value(driver.recover_land(repo, vec![], WRITER, ID).unwrap()).unwrap()
        }
        "ScopedCommit" => serde_json::to_value(
            driver
                .recover_scoped_commit(repo, held(lease), WRITER, ID)
                .unwrap(),
        )
        .unwrap(),
        "Sync" => serde_json::to_value(driver.inspect_sync(repo, held(lease), WRITER, ID).unwrap())
            .unwrap(),
        "Restore" => {
            serde_json::to_value(driver.recover_restore(repo, vec![], WRITER, ID).unwrap()).unwrap()
        }
        "WorktreeCreate" | "WorktreeMove" | "WorktreeRemove" => {
            driver
                .repair_worktree_registration(repo, vec![], ID)
                .unwrap();
            driver.inspect_operation(repo, ID).unwrap()
        }
        "ConfigChange" => {
            driver.recover_hooks_config(repo, ID).unwrap();
            driver.inspect_operation(repo, ID).unwrap()
        }
        "RemoteTransfer" => {
            serde_json::to_value(driver.recover_transfer(repo, vec![], WRITER, ID).unwrap())
                .unwrap()
        }
        "PublicationCas" => observed(
            publication(driver, repo, seal)
                .recover(repo, ID)
                .map(|v| serde_json::to_value(v).unwrap()),
        ),
        _ => panic!(),
    }
}
struct CompactAuthority(Handle);
impl wal::PublicationAuthority for CompactAuthority {
    fn validate_publication_borrow(&self, _: &wal::Intent) -> wal::WalResult<()> {
        fgos_holder_lock::validate(&self.0).map_err(|_| wal::WalError::PublicationBorrowUnavailable)
    }
}
struct Reader<'a>(&'a Path);
impl wal::RecoveryReader for Reader<'_> {
    fn read_ref(&self, name: &str) -> wal::WalResult<wal::ObservedRef> {
        let o = Command::new("git")
            .arg("-C")
            .arg(self.0)
            .args(["show-ref", "--verify", "--hash", name])
            .output()?;
        Ok(wal::ObservedRef::Direct(if o.status.success() {
            wal::Tip::Oid(String::from_utf8(o.stdout).unwrap().trim().into())
        } else {
            assert_eq!(o.status.code(), Some(128));
            wal::Tip::Absent
        }))
    }
    fn candidate_intact(&self, intent: &wal::Intent) -> wal::WalResult<bool> {
        match intent.candidate() {
            wal::Tip::Absent => Ok(true),
            wal::Tip::Oid(oid) => Ok(Command::new("git")
                .arg("-C")
                .arg(self.0)
                .args(["cat-file", "-e", oid])
                .status()?
                .success()),
        }
    }
}
#[test]
fn recovery_matrix_all_payload_kinds() {
    for recovery_first in [true, false] {
        for kind in KINDS {
            let f = Fixture::new();
            assert_eq!(f.repo.trusted_main_root(), f.main);
            let _ = evidence as fn(&LandSession) -> LandEvidence;
            git(
                &f.main,
                &["update-ref", "refs/heads/topic", &f.request.target],
            );
            if matches!(kind, "ScopedCommit" | "Sync") {
                git(
                    &f.main,
                    &[
                        "worktree",
                        "add",
                        "-qb",
                        "producer",
                        f.temp.join("producer").to_str().unwrap(),
                        &f.request.target,
                    ],
                );
            }
            if matches!(kind, "WorktreeMove" | "WorktreeRemove") {
                git(
                    &f.main,
                    &[
                        "worktree",
                        "add",
                        "-q",
                        "--detach",
                        f.temp.join("worker").to_str().unwrap(),
                        &f.request.target,
                    ],
                );
            }
            if kind == "RemoteTransfer" {
                git(
                    &f.main,
                    &[
                        "init",
                        "-q",
                        "--bare",
                        f.temp.join("remote.git").to_str().unwrap(),
                    ],
                );
                git(
                    &f.main,
                    &[
                        "remote",
                        "add",
                        "origin",
                        f.temp.join("remote.git").to_str().unwrap(),
                    ],
                );
            }
            interrupt(&f, kind);
            let tree = if matches!(kind, "ScopedCommit" | "Sync") {
                f.temp.join("producer")
            } else {
                f.main.clone()
            };
            let repo = match f.driver.resolve_repo(&tree, &f.main).unwrap() {
                ResolveRepo::Repository(r) => r,
                _ => panic!(),
            };
            let lease = (tree != f.main).then(|| custody(&f.main, &tree));
            let mut seal = locked("event-seal", f.temp.join("seal.lock"));
            let pending = f.driver.list_pending(&repo, 100).unwrap();
            assert_eq!(pending["complete"], true, "{kind}");
            assert!(
                pending["operations"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .any(|o| o["operationId"] == ID && o["kind"] == kind),
                "{kind}: {pending}"
            );
            let before = f.driver.inspect_operation(&repo, ID).unwrap();
            assert_eq!(before["terminal"], false);
            if kind == "ConfigChange" {
                let error = f.driver.reconcile_operation(&repo, vec![BorrowedHandle::new(&seal).unwrap()], WRITER, ID, None).unwrap_err();
                assert_eq!(error.cause, "config-recovery-caller-loans-refused");
            }
            let own_first = if recovery_first {
                None
            } else {
                Some(own_recovery(&f.driver, &repo, kind, &lease, &mut seal))
            };
            let reconciled = if kind == "PublicationCas" {
                let port = publication(&f.driver, &repo, &mut seal);
                observed(
                    f.driver
                        .reconcile_operation(&repo, held(&lease), WRITER, ID, Some(&port)),
                )
            } else {
                f.driver
                    .reconcile_operation(&repo, held(&lease), WRITER, ID, None)
                    .unwrap()
            };
            let terminal = f.driver.inspect_operation(&repo, ID).unwrap();
            assert_eq!(terminal["terminal"], true, "{kind}: {terminal}");
            assert_eq!(
                terminal["outcome"],
                serde_json::to_value(wal::Outcome::AbandonedBeforeAttempt).unwrap(),
                "{kind}"
            );
            let own = own_first
                .unwrap_or_else(|| own_recovery(&f.driver, &repo, kind, &lease, &mut seal));
            // Compacted Recovery intentionally returns the retained Outcome,
            // whereas the owning Sync port reconstructs its typed status.
            if reconciled != terminal["outcome"] {
                assert_eq!(own, reconciled, "{kind}: owning port differs from Recovery");
            }
            assert_eq!(
                f.driver.inspect_operation(&repo, ID).unwrap()["outcome"],
                terminal["outcome"],
                "{kind}: owning recovery changed terminal state"
            );
            let wal = wal::Wal::open(&repo).unwrap();
            if wal.compacted(ID).unwrap().is_some() {
                // Checkout recovery may compact its abandoned operation itself.
            } else if kind == "Restore" {
                f.driver
                    .acknowledge_restore(&repo, vec![], WRITER, ID)
                    .unwrap();
            } else if kind == "PublicationCas" {
                publication(&f.driver, &repo, &mut seal)
                    .release_pin_and_compact(&repo, ID)
                    .unwrap();
            } else if kind == "Land" {
                f.driver
                    .acknowledge_land(&repo, WRITER, ID, "durable matrix consumer")
                    .unwrap();
            } else {
                // The owning resource remains held while exercising WAL's existing
                // compaction primitive; no forged absent-pin reader or authority.
                let resource = if matches!(kind, "ScopedCommit" | "Sync") {
                    None
                } else {
                    Some(CompactAuthority(locked(
                        if kind == "ConfigChange" {
                            "repo-config"
                        } else {
                            "worktree-admin"
                        },
                        f.main.join(format!(
                            ".fgos/locks/{}.lock",
                            if kind == "ConfigChange" {
                                "repo-config"
                            } else {
                                "worktree-admin"
                            }
                        )),
                    )))
                };
                struct LeaseAuthority<'a>(&'a Handle);
                impl wal::PublicationAuthority for LeaseAuthority<'_> {
                    fn validate_publication_borrow(&self, _: &wal::Intent) -> wal::WalResult<()> {
                        fgos_holder_lock::validate(self.0)
                            .map_err(|_| wal::WalError::PublicationBorrowUnavailable)
                    }
                }
                let authority: &dyn wal::PublicationAuthority = match &resource {
                    Some(a) => a,
                    None => &LeaseAuthority(lease.as_ref().unwrap()),
                };
                wal.compact(&wal.inspect(ID).unwrap(), &Reader(&f.main), authority)
                    .unwrap();
            }
            let compacted = f.driver.inspect_operation(&repo, ID).unwrap();
            assert_eq!(compacted["compacted"], true, "{kind}: {compacted}");
            assert_eq!(
                compacted["requestDigest"], before["requestDigest"],
                "{kind}"
            );
            assert_eq!(compacted["outcome"], terminal["outcome"], "{kind}");
            assert_eq!(
                f.driver
                    .reconcile_operation(&repo, held(&lease), WRITER, ID, None)
                    .unwrap(),
                terminal["outcome"],
                "{kind}"
            );
            assert!(
                !f.driver.list_pending(&repo, 100).unwrap()["operations"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .any(|o| o["operationId"] == ID)
            );
            println!(
                "{kind} (Recovery first={recovery_first}): SIGKILL -> pending/inspect -> reconcile/own-port -> compact/digest/receipt"
            );
        }
    }
}

#[test]
fn ref_and_transfer_post_attempt_recovery() {
    for (kind, boundary) in [("RefUpdate", "pin"), ("RefUpdate", "attempt"), ("RefUpdate", "cas"), ("RemoteTransfer", "attempt"), ("RemoteTransfer", "transfer-effect")] {
        let f = Fixture::new();
        git(&f.main, &["update-ref", "refs/heads/topic", &f.request.target]);
        if kind == "RemoteTransfer" {
            git(&f.main, &["init", "-q", "--bare", f.temp.join("remote.git").to_str().unwrap()]);
            git(&f.main, &["remote", "add", "origin", f.temp.join("remote.git").to_str().unwrap()]);
        }
        interrupt_at(&f, kind, boundary);
        let result = f.driver.reconcile_operation(&f.repo, vec![], WRITER, ID, None);
        if boundary == "attempt" && kind == "RefUpdate" {
            assert!(result.unwrap_err().cause.contains("ref-effect-unknown"));
        } else {
            let outcome = result.unwrap();
            if kind == "RemoteTransfer" {
                assert_eq!(outcome["unknown"], true);
                assert_eq!(outcome["acknowledged"], false);
                assert_eq!(f.temp.join("remote.git/refs/heads/shared").exists(), boundary == "transfer-effect");
                assert_eq!(f.driver.reconcile_operation(&f.repo, vec![], WRITER, ID, None).unwrap(), outcome);
            } else {
                assert_eq!(outcome["kind"], if boundary == "pin" { "abandonedBeforeAttempt" } else { "success" });
                if boundary == "cas" { assert_eq!(outcome["attribution"], "effectObservedOnly"); }
                let replay = f.driver.recover_ref_operation(&f.repo, vec![], WRITER, ID).unwrap();
                assert_eq!(serde_json::to_value(replay).unwrap(), outcome);
                assert!(!f.main.join(format!(".git/refs/fgos/git-operations/{ID}/candidate")).exists());
                let wal = wal::Wal::open(&f.repo).unwrap();
                let admin = CompactAuthority(locked("worktree-admin", f.main.join(".fgos/locks/worktree-admin.lock")));
                wal.compact(&wal.inspect(ID).unwrap(), &Reader(&f.main), &admin).unwrap();
            }
        }
    }
}

#[test]
fn ref_checkout_recovery_requires_quiescent_clean_custody_and_no_native_lock() {
    let f = Fixture::new();
    let tree = f.temp.join("producer");
    git(&f.main, &["worktree", "add", "-qb", "topic", tree.to_str().unwrap(), &f.request.target]);
    interrupt_at(&f, "RefCheckout", "attempt");
    let no_custody = f.driver.recover_ref_operation(&f.repo, vec![], WRITER, ID).unwrap_err();
    assert_eq!(no_custody.cause, "checkout-custody-required");
    let wrong = Some(custody(&f.main, &f.main));
    assert_eq!(f.driver.recover_ref_operation(&f.repo, held(&wrong), WRITER, ID).unwrap_err().cause, "checkout-custody-mismatch");
    drop(wrong);
    let lease = Some(custody(&f.main, &tree));
    fs::write(tree.join("b"), "dirty").unwrap();
    assert_eq!(f.driver.recover_ref_operation(&f.repo, held(&lease), WRITER, ID).unwrap_err().cause, "ref-checkout-recovery-required");
    fs::write(tree.join("b"), "base\n").unwrap();
    let native = f.main.join(".git/refs/heads/topic.lock");
    fs::write(&native, "foreign").unwrap();
    assert_eq!(f.driver.recover_ref_operation(&f.repo, held(&lease), WRITER, ID).unwrap_err().cause, "ref-checkout-or-native-state-recovery-required");
    fs::remove_file(&native).unwrap();
    assert_eq!(f.driver.recover_ref_operation(&f.repo, held(&lease), WRITER, ID).unwrap_err().cause, "ref-effect-unknown");
    assert!(!f.driver.inspect_operation(&f.repo, ID).unwrap()["terminal"].as_bool().unwrap());
}
