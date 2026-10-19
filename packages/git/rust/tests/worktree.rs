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
