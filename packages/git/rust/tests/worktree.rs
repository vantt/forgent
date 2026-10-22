#![cfg(all(target_os = "linux", target_arch = "x86_64"))]
use fgos_git::{
    wal::{self, Begin, Intent, OperationKind, Phase, Tip, Wal},
    *,
};
use fgos_holder_lock::{LockScope, Wait};
use std::{
    collections::BTreeMap,
    fs,
    os::unix::{
        fs::{symlink, MetadataExt, PermissionsExt},
        process::CommandExt,
    },
    path::{Path, PathBuf},
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};
static NEXT: AtomicU64 = AtomicU64::new(0);
struct Fixture {
    root: PathBuf,
    path: PathBuf,
    driver: GitDriver,
    repo: RepoHandle,
    tip: Oid,
}
fn git(path: &Path, args: &[&str]) -> String {
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
    String::from_utf8(out.stdout).unwrap().trim().into()
}
impl Fixture {
    fn new() -> Self {
        let root = std::env::temp_dir().join(format!(
            "fgos-worktree-crash-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&root).unwrap();
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        git(&root, &["init", "-q", "--initial-branch=trunk", "repo"]);
        let path = root.join("repo");
        git(&path, &["config", "user.name", "Fixture"]);
        git(&path, &["config", "user.email", "fixture@example.invalid"]);
        fs::write(path.join("binary"), [0, 255, 12, 1]).unwrap();
        fs::write(path.join("executable"), "script").unwrap();
        fs::set_permissions(path.join("executable"), fs::Permissions::from_mode(0o755)).unwrap();
        symlink("binary", path.join("link")).unwrap();
        git(&path, &["add", "."]);
        git(&path, &["commit", "-qm", "fixture"]);
        let driver = GitDriver::new(&root).unwrap();
        let repo = match driver.resolve_repo(&path, &path).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        let tip = Oid::parse(&git(&path, &["rev-parse", "HEAD"]), repo.object_format()).unwrap();
        fs::create_dir_all(path.join(".fgos/locks/activation.lock")).unwrap();
        fs::write(
            path.join(".fgos/locks/activation.lock/TOMBSTONE"),
            r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
        )
        .unwrap();
        Self {
            root,
            path,
            driver,
            repo,
            tip,
        }
    }
    fn scope(&self) -> LockScope<'static> {
        let mut scope = LockScope::seeded(vec![]).unwrap();
        scope
            .acquire(
                "worktree-admin",
                &BTreeMap::from([(
                    "fgosDir".into(),
                    self.path.join(".fgos").to_str().unwrap().into(),
                )]),
                Wait::Ms(1000),
            )
            .unwrap();
        scope
    }
    fn create(&self, path: &Path) {
        self.driver
            .create_worktree(
                &self.repo,
                vec![],
                &WorktreeCreate {
                    path: path.into(),
                    branch: None,
                    base: self.tip.clone(),
                    session_id: None,
                },
                "fixture",
                "create",
            )
            .unwrap();
    }
    fn attempt(&self, scope: &LockScope<'_>, id: &str, kind: OperationKind) {
        struct Authority<'a>(&'a LockScope<'a>);
        impl wal::PublicationAuthority for Authority<'_> {
            fn validate_publication_borrow(&self, _: &Intent) -> wal::WalResult<()> {
                self.0
                    .validate()
                    .map_err(|_| wal::WalError::PublicationBorrowUnavailable)
            }
        }
        let mut resources = match &kind {
            OperationKind::WorktreeCreate { path, .. }
            | OperationKind::WorktreeRemove { path, .. } => vec![format!("worktree:{path}")],
            OperationKind::WorktreeMove {
                source,
                destination,
                ..
            } => vec![
                format!("worktree:{source}"),
                format!("worktree:{destination}"),
            ],
            _ => panic!(),
        };
        resources.sort();
        let old = if matches!(kind, OperationKind::WorktreeCreate { .. }) {
            Tip::Absent
        } else {
            Tip::Oid(self.tip.as_str().into())
        };
        let next = if matches!(kind, OperationKind::WorktreeRemove { .. }) {
            Tip::Absent
        } else {
            Tip::Oid(self.tip.as_str().into())
        };
        let wal = Wal::open(&self.repo).unwrap();
        let intent = Intent {
            request_digest: wal::canonical_digest(&kind).unwrap(),
            kind,
            repo_identity: wal.repository_identity().into(),
            resource_set: resources,
            authority_binding: "fixture".into(),
            writer_identity: "fixture".into(),
            object_format: self.repo.object_format(),
            expected: old.clone(),
            next: next.clone(),
        };
        let chain = match wal.begin(id, intent, &Authority(scope)).unwrap() {
            Begin::Created(c) => c,
            _ => panic!(),
        };
        let chain = wal.append(&chain, Phase::Prepared).unwrap();
        wal.append(
            &chain,
            Phase::TargetAttempt {
                prior_target_attempt: None,
                expected: old,
                next,
            },
        )
        .unwrap();
        // Reachability-only pin, as the production prepare installs it.
        git(
            &self.path,
            &[
                "update-ref",
                &format!("refs/fgos/git-operations/{id}/candidate"),
                self.tip.as_str(),
            ],
        );
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}
fn identity(path: &Path) -> String {
    let m = fs::metadata(path).unwrap();
    format!("{}:{}", m.dev(), m.ino())
}
fn cstring(pid: libc::pid_t, address: u64) -> String {
    let mut bytes = vec![];
    for offset in (0..8192).step_by(8) {
        let word = unsafe {
            libc::ptrace(
                libc::PTRACE_PEEKDATA,
                pid,
                (address + offset) as *mut libc::c_void,
                std::ptr::null_mut::<libc::c_void>(),
            )
        };
        for byte in word.to_ne_bytes() {
            if byte == 0 {
                return String::from_utf8_lossy(&bytes).into_owned();
            }
            bytes.push(byte);
        }
    }
    panic!("unbounded syscall path")
}
/// Stop actual Git at a syscall entry/exit. No production fault flag, wrapper,
/// environment switch or synthesized residue; SIGKILL leaves its real bytes.
fn kill_git(
    path: &Path,
    args: &[&str],
    mut barrier: impl FnMut(i64, &str, &str, bool, i64) -> bool,
) {
    let mut command = Command::new("git");
    command.arg("-C").arg(path).args(args);
    unsafe {
        command.pre_exec(|| {
            if libc::ptrace(libc::PTRACE_TRACEME, 0, 0, 0) == -1 {
                return Err(std::io::Error::last_os_error());
            }
            Ok(())
        });
    }
    let mut child = command.spawn().unwrap();
    let pid = child.id() as libc::pid_t;
    let mut status = 0;
    assert_eq!(unsafe { libc::waitpid(pid, &mut status, 0) }, pid);
    assert!(libc::WIFSTOPPED(status));
    assert_ne!(
        unsafe { libc::ptrace(libc::PTRACE_SETOPTIONS, pid, 0, libc::PTRACE_O_TRACESYSGOOD) },
        -1
    );
    let mut exiting = false;
    let mut paths = (String::new(), String::new());
    loop {
        assert_ne!(unsafe { libc::ptrace(libc::PTRACE_SYSCALL, pid, 0, 0) }, -1);
        assert_eq!(unsafe { libc::waitpid(pid, &mut status, 0) }, pid);
        assert!(
            !libc::WIFEXITED(status),
            "Git completed without reaching barrier: {args:?}"
        );
        assert!(!libc::WIFSIGNALED(status));
        if libc::WSTOPSIG(status) != (libc::SIGTRAP | 0x80) {
            continue;
        }
        let mut regs = unsafe { std::mem::zeroed::<libc::user_regs_struct>() };
        assert_ne!(
            unsafe { libc::ptrace(libc::PTRACE_GETREGS, pid, 0, &mut regs as *mut _) },
            -1
        );
        let syscall = regs.orig_rax as i64;
        if !exiting {
            paths = match syscall {
                libc::SYS_rename => (cstring(pid, regs.rdi), cstring(pid, regs.rsi)),
                libc::SYS_unlink | libc::SYS_rmdir => (cstring(pid, regs.rdi), String::new()),
                libc::SYS_unlinkat => (cstring(pid, regs.rsi), String::new()),
                _ => (String::new(), String::new()),
            };
        }
        let absolute = |value: &str| {
            if value.is_empty() || Path::new(value).is_absolute() {
                value.to_owned()
            } else {
                path.join(value).to_string_lossy().into_owned()
            }
        };
        if barrier(
            syscall,
            &absolute(&paths.0),
            &absolute(&paths.1),
            exiting,
            regs.rax as i64,
        ) {
            unsafe {
                libc::kill(pid, libc::SIGKILL);
                libc::waitpid(pid, &mut status, 0);
            }
            break;
        }
        exiting = !exiting;
    }
    let _ = child.wait();
}

fn assert_payload(path: &Path) {
    assert_eq!(fs::read(path.join("binary")).unwrap(), [0, 255, 12, 1]);
    assert_eq!(
        fs::read_link(path.join("link")).unwrap(),
        Path::new("binary")
    );
    assert_eq!(
        fs::metadata(path.join("executable")).unwrap().mode() & 0o111,
        0o111
    );
}
#[test]
fn killed_move_repairs_only_the_recorded_destination_and_preserves_bytes() {
    let f = Fixture::new();
    let source = f.root.join("worker");
    let destination = f.root.join("moved");
    f.create(&source);
    fs::write(source.join("untracked"), [0, 255, 16]).unwrap();
    let admin = f.path.join(".git/worktrees/worker");
    let scope = f.scope();
    f.attempt(
        &scope,
        "move",
        OperationKind::WorktreeMove {
            source: source.to_str().unwrap().into(),
            destination: destination.to_str().unwrap().into(),
            registration: "worker".into(),
            registration_identity: identity(&admin).into(),
        },
    );
    kill_git(
        &f.path,
        &[
            "worktree",
            "move",
            source.to_str().unwrap(),
            destination.to_str().unwrap(),
        ],
        |n, a, b, exit, ret| {
            n == libc::SYS_rename
                && a == source.to_str().unwrap()
                && b == destination.to_str().unwrap()
                && exit
                && ret == 0
        },
    );
    drop(scope);
    assert!(!source.exists());
    assert_payload(&destination);
    fs::write(f.path.join("unrelated"), "main edits").unwrap();
    f.driver
        .repair_worktree_registration(&f.repo, vec![], "move")
        .unwrap();
    assert_payload(&destination);
    assert_eq!(
        fs::read(destination.join("untracked")).unwrap(),
        [0, 255, 16]
    );
    assert_eq!(
        fs::read_to_string(f.path.join("unrelated")).unwrap(),
        "main edits"
    );
    f.driver
        .repair_worktree_registration(&f.repo, vec![], "move")
        .unwrap();
}
#[test]
fn killed_create_retains_initializing_lock_until_owned_repair() {
    let f = Fixture::new();
    let worker = f.root.join("worker");
    let scope = f.scope();
    f.attempt(
        &scope,
        "interrupted-create",
        OperationKind::WorktreeCreate {
            path: worker.to_str().unwrap().into(),
            registration: "worker".into(),
            branch: None,
            session_id: None,
        },
    );
    let lock = f.path.join(".git/worktrees/worker/locked");
    kill_git(
        &f.path,
        &[
            "worktree",
            "add",
            "--detach",
            worker.to_str().unwrap(),
            f.tip.as_str(),
        ],
        |n, a, _, exit, _| n == libc::SYS_unlink && !exit && a == lock.to_str().unwrap(),
    );
    drop(scope);
    assert_eq!(fs::read_to_string(&lock).unwrap().trim(), "initializing");
    assert_payload(&worker);
    f.driver
        .repair_worktree_registration(&f.repo, vec![], "interrupted-create")
        .unwrap();
    assert!(!lock.exists());
    assert_payload(&worker);
}
#[test]
fn killed_remove_and_partial_prune_are_owned_and_never_repeat_destroy() {
    for partial in [false, true] {
        let f = Fixture::new();
        let worker = f.root.join("worker");
        f.create(&worker);
        let admin = f.path.join(".git/worktrees/worker");
        let scope = f.scope();
        f.attempt(
            &scope,
            "remove",
            OperationKind::WorktreeRemove {
                path: worker.to_str().unwrap().into(),
                registration: "worker".into(),
                registration_identity: identity(&admin).into(),
                delivery: Box::new(wal::WorktreeDeliveryBinding {
                    delivered_to: f.tip.as_str().into(),
                    evidence_digest: "a".repeat(64),
                }),
            },
        );
        kill_git(
            &f.path,
            &["worktree", "remove", worker.to_str().unwrap()],
            |n, a, _, exit, _| {
                n == libc::SYS_unlink
                    && !exit
                    && a.starts_with(admin.to_str().unwrap())
                    && !worker.exists()
            },
        );
        assert!(!worker.exists());
        assert!(admin.exists());
        if partial {
            kill_git(
                &f.path,
                &["worktree", "prune", "--expire", "now"],
                |n, a, _, exit, ret| {
                    n == libc::SYS_unlink
                        && a.starts_with(admin.to_str().unwrap())
                        && exit
                        && ret == 0
                },
            );
        }
        drop(scope);
        fs::write(f.path.join("unrelated"), "keep").unwrap();
        f.driver.prune_worktree(&f.repo, vec![], "remove").unwrap();
        assert!(!admin.exists());
        assert_eq!(
            fs::read_to_string(f.path.join("unrelated")).unwrap(),
            "keep"
        );
        f.driver.prune_worktree(&f.repo, vec![], "remove").unwrap();
    }
}

#[test]
fn clean_git_refusals_settle_attempts_without_replaying_effects() {
    for action in ["create", "remove", "move"] {
        let f = Fixture::new();
        let path = f.root.join("worker");
        let destination = f.root.join("moved");
        if action != "create" {
            f.create(&path);
        }
        let admin = f.path.join(".git/worktrees/worker");
        let scope = f.scope();
        let kind = match action {
            "create" => OperationKind::WorktreeCreate {
                path: path.to_str().unwrap().into(),
                registration: "worker".into(),
                branch: None,
                session_id: None,
            },
            "remove" => OperationKind::WorktreeRemove {
                path: path.to_str().unwrap().into(),
                registration: "worker".into(),
                registration_identity: identity(&admin).into(),
                delivery: Box::new(wal::WorktreeDeliveryBinding {
                    delivered_to: f.tip.as_str().into(),
                    evidence_digest: "a".repeat(64),
                }),
            },
            _ => OperationKind::WorktreeMove {
                source: path.to_str().unwrap().into(),
                destination: destination.to_str().unwrap().into(),
                registration: "worker".into(),
                registration_identity: identity(&admin).into(),
            },
        };
        f.attempt(&scope, action, kind);
        let mut command = Command::new("git");
        command.arg("-C").arg(&f.path).arg("worktree");
        match action {
            "create" => {
                // Git validates the base before any destination effect.
                command
                    .args(["add", "--detach"])
                    .arg(&path)
                    .arg("missing-base");
            }
            "remove" => {
                git(&f.path, &["worktree", "lock", path.to_str().unwrap()]);
                command.arg("remove").arg(&path);
            }
            _ => {
                git(&f.path, &["worktree", "lock", path.to_str().unwrap()]);
                command.arg("move").arg(&path).arg(&destination);
            }
        }
        assert!(!command.output().unwrap().status.success());
        drop(scope);
        f.driver
            .repair_worktree_registration(&f.repo, vec![], action)
            .unwrap();
        let wal = Wal::open(&f.repo).unwrap();
        assert!(matches!(
            wal.inspect(action).unwrap().outcome(),
            Some(wal::Outcome::Worktree {
                completed: false,
                ..
            })
        ));
        assert_eq!(
            git(
                &f.path,
                &[
                    "for-each-ref",
                    "--format=%(refname)",
                    &format!("refs/fgos/git-operations/{action}")
                ]
            ),
            ""
        );
        f.driver
            .repair_worktree_registration(&f.repo, vec![], action)
            .unwrap();
        if action != "create" {
            assert_payload(&path);
        }
        assert!(!destination.exists());
    }
}

#[test]
fn successful_registered_create_rollback_settles_as_not_completed() {
    let f = Fixture::new();
    let path = f.root.join("rolled-back");
    let scope = f.scope();
    f.attempt(
        &scope,
        "rollback",
        OperationKind::WorktreeCreate {
            path: path.to_str().unwrap().into(),
            registration: "rolled-back".into(),
            branch: None,
            session_id: None,
        },
    );
    git(
        &f.path,
        &[
            "worktree",
            "add",
            "--detach",
            path.to_str().unwrap(),
            f.tip.as_str(),
        ],
    );
    git(&f.path, &["worktree", "remove", path.to_str().unwrap()]);
    drop(scope);
    f.driver
        .repair_worktree_registration(&f.repo, vec![], "rollback")
        .unwrap();
    assert!(matches!(
        Wal::open(&f.repo)
            .unwrap()
            .inspect("rollback")
            .unwrap()
            .outcome(),
        Some(wal::Outcome::Worktree {
            completed: false,
            ..
        })
    ));
    assert!(!path.exists());
    assert_eq!(
        git(
            &f.path,
            &[
                "for-each-ref",
                "--format=%(refname)",
                "refs/fgos/git-operations/rollback"
            ]
        ),
        ""
    );
}

fn lock_issue(f: &Fixture, reason: &str, age: Option<std::time::Duration>) -> String {
    let worker = f.root.join("worker");
    git(
        &f.path,
        &["worktree", "add", "--detach", worker.to_str().unwrap()],
    );
    git(
        &f.path,
        &["worktree", "lock", "--reason", reason, worker.to_str().unwrap()],
    );
    if let Some(age) = age {
        let lock = f.path.join(".git/worktrees/worker/locked");
        fs::File::options()
            .write(true)
            .open(lock)
            .unwrap()
            .set_modified(std::time::SystemTime::now() - age)
            .unwrap();
    }
    let issues = f.driver.inspect_worktree_orphans(&f.repo).unwrap();
    assert_eq!(issues.len(), 1, "{issues:?}");
    issues[0].reason.clone()
}
#[test]
fn lock_naming_a_live_process_is_not_a_recovery_finding() {
    let f = Fixture::new();
    let mut holder = Command::new("sleep").arg("60").spawn().unwrap();
    let reason = format!("locked claude agent x (pid {})", holder.id());
    let got = lock_issue(&f, &reason, None);
    holder.kill().unwrap();
    holder.wait().unwrap();
    assert_eq!(got, "locked-by-live-process");
}
#[test]
fn lock_naming_a_dead_or_unparseable_or_reused_owner_stays_a_finding() {
    let mut gone = Command::new("true").spawn().unwrap();
    gone.wait().unwrap();
    let dead = format!("locked agent (pid {})", gone.id());
    assert_eq!(lock_issue(&Fixture::new(), &dead, None), "locked-registration");
    assert_eq!(
        lock_issue(&Fixture::new(), "held by the user", None),
        "locked-registration"
    );
    // Lock written long before this process existed: the live pid is a reuse.
    let mut late = Command::new("sleep").arg("60").spawn().unwrap();
    let reused = format!("locked agent (pid {})", late.id());
    let got = lock_issue(
        &Fixture::new(),
        &reused,
        Some(std::time::Duration::from_secs(3600)),
    );
    late.kill().unwrap();
    late.wait().unwrap();
    assert_eq!(got, "locked-registration");
}

#[test]
fn missing_checkout_prune_requires_owned_create_and_preserves_unknown_residue() {
    let f = Fixture::new();
    let owned = f.root.join("owned");
    f.create(&owned);
    let admin = f.repo.common_dir().join("worktrees/owned");
    fs::remove_dir_all(&owned).unwrap();
    // Enough finished operations of other worktrees to cross the compaction threshold: the
    // create chain that proves ownership must survive them while its registration exists.
    f.finished_chains("filler", wal::RECENT_TERMINAL + wal::COMPACT_PER_PASS + 2, 0);
    f.create_numbered(0);
    f.create_numbered(1);
    assert!(Wal::open(&f.repo).unwrap().inspect("create").is_ok());
    fs::write(admin.join("unknown"), "keep").unwrap();
    assert!(f.driver.prune_missing_worktree(&f.repo, vec![], &owned, "fixture", "prune")
        .unwrap_err().cause.contains("residue-uncertain"));
    assert!(admin.join("HEAD").exists());
    fs::remove_file(admin.join("unknown")).unwrap();
    f.driver.prune_missing_worktree(&f.repo, vec![], &owned, "fixture", "prune").unwrap();
    assert!(!admin.exists());
    let unowned = f.root.join("unowned");
    git(&f.path, &["worktree", "add", "--detach", unowned.to_str().unwrap()]);
    fs::remove_dir_all(&unowned).unwrap();
    assert!(f.driver.prune_missing_worktree(&f.repo, vec![], &unowned, "fixture", "unowned-prune")
        .unwrap_err().cause.contains("ownership-unproven"));
    assert!(f.repo.common_dir().join("worktrees/unowned/HEAD").exists());
}

#[test]
fn missing_owned_detached_history_keeps_its_registration_when_no_delivery_ref_exists() {
    let f = Fixture::new();
    let owned = f.root.join("owned");
    f.create(&owned);
    fs::write(owned.join("valuable"), "keep unique history").unwrap();
    git(&owned, &["add", "valuable"]);
    git(&owned, &["commit", "-qm", "unique detached history"]);
    let tip = git(&owned, &["rev-parse", "HEAD"]);
    fs::remove_dir_all(&owned).unwrap();
    let error = f.driver.prune_missing_worktree(&f.repo, vec![], &owned, "fixture", "unreachable-prune").unwrap_err();
    assert!(error.cause.contains("tip-unreachable"));
    assert_eq!(fs::read_to_string(f.repo.common_dir().join("worktrees/owned/HEAD")).unwrap().trim(), tip);
    assert_eq!(git(&f.path, &["show", &format!("{tip}:valuable")]), "keep unique history");
}

impl Fixture {
    fn create_numbered(&self, n: usize) {
        self.driver
            .create_worktree(
                &self.repo,
                vec![],
                &WorktreeCreate {
                    path: self.root.join(format!("many-{n}")),
                    branch: None,
                    base: self.tip.clone(),
                    session_id: None,
                },
                "fixture",
                &format!("many-{n}"),
            )
            .unwrap();
    }

    /// `count` finished worktree-create chains with no registration and no checkout, the way a
    /// repository holds them after their worktrees are gone. The oldest `broken` of them carry a
    /// leftover write temporary, which keeps compaction from finishing them.
    fn finished_chains(&self, prefix: &str, count: usize, broken: usize) {
        let wal = Wal::open(&self.repo).unwrap();
        let scope = self.scope();
        for n in 0..count {
            let id = format!("{prefix}-{n}");
            self.attempt(
                &scope,
                &id,
                OperationKind::WorktreeCreate {
                    path: self.root.join(&id).to_str().unwrap().into(),
                    registration: id.clone().into(),
                    branch: None,
                    session_id: None,
                },
            );
            let chain = wal.inspect(&id).unwrap();
            wal.append(
                &chain,
                Phase::Outcome(wal::Outcome::Worktree {
                    completed: false,
                    details: vec![],
                }),
            )
            .unwrap();
            if n < broken {
                let dir = self.repo.common_dir().join("fgos/git/operations").join(&id);
                fs::write(dir.join(".durable-file-leftover.tmp"), b"x").unwrap();
            }
        }
    }

    fn is_compacted(&self, id: &str) -> bool {
        Wal::open(&self.repo).unwrap().compacted(id).unwrap().is_some()
    }
}

#[test]
fn a_create_chain_is_kept_while_its_checkout_exists_and_older_finished_chains_drain_in_bounded_passes() {
    // No other case runs the Worktree port's compaction. A create chain is the proof guarded
    // prune needs, so it stays; finished chains of other worktrees go oldest first, at most
    // COMPACT_PER_PASS per pass; and chains that cannot finish (a leftover temporary) neither
    // block nor starve the healthy ones behind them.
    let f = Fixture::new();
    for n in 0..wal::RECENT_TERMINAL + 3 {
        f.create_numbered(n);
    }
    let wal = Wal::open(&f.repo).unwrap();
    for n in 0..wal::RECENT_TERMINAL + 3 {
        assert!(wal.inspect(&format!("many-{n}")).is_ok(), "many-{n} was compacted with its checkout present");
    }

    let healthy = wal::COMPACT_PER_PASS + wal::RECENT_TERMINAL + 2;
    f.finished_chains("late", wal::COMPACT_PER_PASS + healthy, wal::COMPACT_PER_PASS);
    // The broken cohort is the oldest: it takes eight attempts and finishes nothing.
    f.create_numbered(100);
    let compacted: Vec<usize> = (wal::COMPACT_PER_PASS..wal::COMPACT_PER_PASS + healthy)
        .filter(|n| f.is_compacted(&format!("late-{n}")))
        .collect();
    assert_eq!(compacted.len(), wal::COMPACT_PER_PASS, "one pass compacts exactly the cap: {compacted:?}");
    assert_eq!(compacted[0], wal::COMPACT_PER_PASS, "oldest healthy chain first");
    assert!(wal.inspect("late-0").is_ok(), "a chain that cannot finish stays readable");
    assert!(wal.inspect(&format!("late-{}", healthy + wal::COMPACT_PER_PASS - 1)).is_ok());

    // Later passes keep reaching the healthy chains behind the broken cohort.
    f.create_numbered(101);
    f.create_numbered(102);
    for n in wal::COMPACT_PER_PASS..wal::COMPACT_PER_PASS + healthy - wal::RECENT_TERMINAL {
        assert!(f.is_compacted(&format!("late-{n}")), "late-{n} starved behind the broken cohort");
    }
}

#[test]
fn a_chain_stopped_between_its_outcome_and_its_pin_release_is_released_and_compacted_by_the_next_operation() {
    // No other case leaves a terminal chain whose pin is still installed: such a chain used to be
    // skipped by every later pass and kept its pin and record directory forever.
    let f = Fixture::new();
    f.finished_chains("stuck", 1, 0);
    let pin = "refs/fgos/git-operations/stuck-0/candidate";
    assert_eq!(git(&f.path, &["rev-parse", pin]), f.tip.as_str());
    f.finished_chains("filler", wal::RECENT_TERMINAL, 0);
    f.create_numbered(0);
    assert!(f.is_compacted("stuck-0"));
    assert_eq!(git(&f.path, &["for-each-ref", "--format=%(refname)", pin]), "");
}

#[test]
fn a_deletion_cut_short_after_the_ledger_was_written_is_finished_by_a_later_pass() {
    // No other case resumes an interrupted deletion from the automatic pass: the ledger is the
    // authority, so a directory left behind must be removed, never read as a live chain.
    let f = Fixture::new();
    f.finished_chains("cut", 1, 0);
    f.finished_chains("filler", wal::RECENT_TERMINAL, 0);
    let wal = Wal::open(&f.repo).unwrap();
    let chain = wal.inspect("cut-0").unwrap();
    git(&f.path, &["update-ref", "-d", "refs/fgos/git-operations/cut-0/candidate"]);
    struct Held;
    impl wal::PublicationAuthority for Held {
        fn validate_publication_borrow(&self, _: &Intent) -> wal::WalResult<()> {
            Ok(())
        }
    }
    struct Absent;
    impl wal::RecoveryReader for Absent {
        fn read_ref(&self, _: &str) -> wal::WalResult<wal::ObservedRef> {
            Ok(wal::ObservedRef::Direct(Tip::Absent))
        }
        fn candidate_intact(&self, _: &Intent) -> wal::WalResult<bool> {
            Ok(true)
        }
    }
    // The crash window between the ledger install and the first unlink: compact, then put the
    // untouched records back next to the ledger entry.
    let operations = f.repo.common_dir().join("fgos/git/operations");
    let saved = f.root.join("saved-cut");
    assert!(Command::new("cp").arg("-a").arg(operations.join("cut-0")).arg(&saved).status().unwrap().success());
    wal.compact(&chain, &Absent, &Held).unwrap();
    assert!(!operations.join("cut-0").exists());
    assert!(Command::new("cp").arg("-a").arg(&saved).arg(operations.join("cut-0")).status().unwrap().success());
    assert!(f.is_compacted("cut-0") && operations.join("cut-0").exists());
    f.create_numbered(0);
    assert!(!operations.join("cut-0").exists(), "the residue was removed");
}

#[test]
fn a_compacted_worktree_id_replays_its_recorded_outcome_without_reading_the_disk() {
    // No other case replays a Worktree id after compaction: create, remove, enough later
    // operations to compact both, then the same ids again. The ledger keeps no path or
    // registration, so a create answers the recorded outcome and never a live handle.
    let f = Fixture::new();
    let path = f.root.join("replayed");
    let input = WorktreeCreate {
        path: path.clone(),
        branch: None,
        base: f.tip.clone(),
        session_id: None,
    };
    f.driver
        .create_worktree(&f.repo, vec![], &input, "fixture", "replay-create")
        .unwrap();
    let delivery = WorktreeDelivery {
        expected_tip: f.tip.clone(),
        delivered_to: f.tip.clone(),
        evidence_digest: "a".repeat(64),
    };
    f.driver
        .remove_worktree(&f.repo, vec![], &path, &delivery, "fixture", "replay-remove")
        .unwrap();
    // A finished create is eligible only once its registration is gone, which the remove did.
    f.finished_chains("filler", wal::RECENT_TERMINAL, 0);
    f.create_numbered(0);
    f.create_numbered(1);
    assert!(f.is_compacted("replay-create") && f.is_compacted("replay-remove"));

    assert_eq!(
        f.driver
            .create_worktree(&f.repo, vec![], &input, "fixture", "replay-create")
            .unwrap_err()
            .cause,
        "worktree-operation-already-completed"
    );
    f.driver
        .remove_worktree(&f.repo, vec![], &path, &delivery, "fixture", "replay-remove")
        .expect("a compacted remove replays as done");
    // A different request under the same id is a conflict, not a replay.
    let other = WorktreeCreate {
        base: f.tip.clone(),
        branch: Some(RefName::parse("refs/heads/other").unwrap()),
        ..input
    };
    assert_eq!(
        f.driver
            .create_worktree(&f.repo, vec![], &other, "fixture", "replay-create")
            .unwrap_err()
            .cause,
        "operation-id-conflict"
    );
}
