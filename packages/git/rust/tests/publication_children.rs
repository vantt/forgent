#![cfg(target_os = "linux")]
//! The publication ceremony spends only the Git children whose answers are not already known.
use fgos_git::*;
use fgos_holder_lock::{acquire, Acquire, Handle, Mode, Resource, Wait};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
static NEXT: AtomicU64 = AtomicU64::new(0);
static LOGGING_GIT: std::sync::OnceLock<PathBuf> = std::sync::OnceLock::new();
/// Puts a `git` that records `<argv>` ahead of the real one on PATH, once, before any driver
/// exists: the driver picks its git from PATH the first time one is created, for the process.
fn logging_git_log() -> &'static Path {
    LOGGING_GIT.get_or_init(|| {
        use std::os::unix::fs::PermissionsExt;
        let dir = std::env::temp_dir().join(format!("fgos-publication-git-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir(&dir).unwrap();
        let real = Command::new("sh").args(["-c", "command -v git"]).output().unwrap().stdout;
        let real = String::from_utf8(real).unwrap().trim().to_owned();
        let script = dir.join("git");
        let log = dir.join("argv.log");
        fs::write(
            &script,
            format!("#!/bin/sh\nprintf '%s\\n' \"$*\" >> '{}'\nexec '{real}' \"$@\"\n", log.display()),
        )
        .unwrap();
        fs::set_permissions(&script, fs::Permissions::from_mode(0o755)).unwrap();
        let mut paths = vec![dir.clone()];
        paths.extend(std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default()));
        std::env::set_var("PATH", std::env::join_paths(paths).unwrap());
        log
    })
}
/// The Git children run against `repo` after the first `from` logged lines, each named by its
/// subcommand, suffixed `:pin` when it touches an operation pin.
fn git_children(repo: &Path, from: usize) -> (Vec<String>, usize) {
    let log = fs::read_to_string(logging_git_log()).unwrap_or_default();
    let all: Vec<&str> = log.lines().collect();
    let tag = format!("--git-dir={}", fs::canonicalize(repo).unwrap().display());
    let ours = all[from.min(all.len())..]
        .iter()
        .filter_map(|l| {
            let mut words = l.split(' ').skip_while(|w| *w != tag).skip(1);
            let verb = loop {
                match words.next()? {
                    "-c" => {
                        words.next()?;
                    }
                    word => break word,
                }
            };
            Some(if l.contains("/candidate") { format!("{verb}:pin") } else { verb.to_owned() })
        })
        .collect();
    (ours, all.len())
}
struct Temp(PathBuf);
impl Temp {
    fn new() -> Self {
        logging_git_log();
        let path = std::env::temp_dir().join(format!(
            "fgos-publication-children-{}-{}",
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
fn a_publication_and_its_release_run_only_the_git_children_whose_answers_are_not_known() {
    let t = Temp::new();
    let root = t.0.join("repo");
    init(&root, "sha256", "files");
    let driver = GitDriver::new(&t.0).unwrap();
    let repo = resolve(&driver, &root);
    let mut h = handle(&t.0.join("seal.lock"));
    let port = PublicationPort::new(&driver, authority(&repo, &mut h));
    let names = |v: &[&str]| v.iter().map(|s| s.to_string()).collect::<Vec<_>>();
    let a = commit(&port, &repo, vec![], "a");
    let (_, mut seen) = git_children(&root, 0);
    port.compare_and_swap(&repo, &reference(), &ExpectedTip::Absent, &ExpectedTip::Oid(a.clone()), "ceremony-a").unwrap();
    let (first, next) = git_children(&root, seen);
    seen = next;
    // The pin is created and read back before the target is touched, and an absent target
    // is probed by existence instead of by listing plus symbolic probe.
    assert_eq!(
        first,
        names(&["show-ref", "rev-list", "update-ref:pin", "for-each-ref:pin", "show-ref", "update-ref", "for-each-ref"]),
        "first publication of a ref"
    );
    port.release_pin_and_compact(&repo, "ceremony-a").unwrap();
    let (released, next) = git_children(&root, seen);
    seen = next;
    assert_eq!(released, names(&["for-each-ref:pin", "update-ref:pin", "show-ref:pin"]), "pin release");
    let b = commit(&port, &repo, vec![a.clone()], "b");
    let (_, next) = git_children(&root, seen);
    seen = next;
    port.compare_and_swap(&repo, &reference(), &ExpectedTip::Oid(a), &ExpectedTip::Oid(b), "ceremony-b").unwrap();
    let (changing, _) = git_children(&root, seen);
    assert_eq!(
        changing,
        names(&["for-each-ref", "rev-list", "update-ref:pin", "for-each-ref:pin", "for-each-ref", "update-ref", "for-each-ref"]),
        "changing publication"
    );
    let calls = fs::read_to_string(logging_git_log()).unwrap();
    let tag = format!("--git-dir={}", fs::canonicalize(&root).unwrap().display());
    for call in calls.lines().filter(|l| l.contains(&tag) && l.contains(" update-ref ")) {
        assert!(
            call.contains("core.fsync=all") && call.contains("core.fsyncMethod=fsync"),
            "ref update without the durable method: {call}"
        );
        assert!(call.contains("--no-deref"), "ref update that follows symbolic refs: {call}");
    }
}
