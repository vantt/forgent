//! The project id: the file, the explicit mint and its refusals, and the read
//! through the main checkout from a linked worktree. Real repositories: a bare
//! origin with two clones and a linked worktree, so the refusal when the
//! remote already tracks the file is proven where it happens.

use fgos_identity::project::{self, handle_from_name, valid_project_id};
use fgos_identity::{project_info, project_init, Error};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};

static NEXT: AtomicU64 = AtomicU64::new(0);

fn scratch(label: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "fgos-identity-project-{label}-{}-{}",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    ));
    fs::create_dir_all(&dir).unwrap();
    fs::canonicalize(dir).unwrap()
}

fn git(dir: &Path, args: &[&str]) {
    let out = Command::new("/usr/bin/git")
        .args(["-c", "user.name=t", "-c", "user.email=t@example.test", "-c", "commit.gpgsign=false"])
        .args(args)
        .current_dir(dir)
        .output()
        .unwrap();
    assert!(out.status.success(), "git {args:?}: {}", String::from_utf8_lossy(&out.stderr));
}

/// A bare origin holding one commit on `main`, and its two clones.
struct World {
    state: PathBuf,
    a: PathBuf,
    b: PathBuf,
}

fn world() -> World {
    let root = scratch("world");
    let (origin, seed) = (root.join("origin"), root.join("seed"));
    fs::create_dir_all(&origin).unwrap();
    git(&origin, &["init", "--bare", "--initial-branch=main"]);
    git(&root, &["clone", origin.to_str().unwrap(), "seed"]);
    fs::write(seed.join("README"), "seed\n").unwrap();
    git(&seed, &["add", "README"]);
    git(&seed, &["commit", "-m", "seed"]);
    git(&seed, &["push", "origin", "HEAD:main"]);
    for name in ["alpha", "beta"] {
        git(&root, &["clone", origin.to_str().unwrap(), name]);
    }
    World { state: root.join("state"), a: root.join("alpha"), b: root.join("beta") }
}

fn refusal(result: Result<impl std::fmt::Debug, fgos_identity::Refusal>) -> &'static str {
    result.expect_err("a refusal").reason
}

#[test]
fn handle_defaults_to_the_slug_of_a_name_and_never_starts_with_a_digit() {
    assert_eq!(handle_from_name("My Project_v2").as_deref(), Some("my-project-v2"));
    assert_eq!(handle_from_name("4f-server").as_deref(), Some("p-4f-server"));
    assert_eq!(handle_from_name("___"), None);
    let long = handle_from_name(&format!("{}-tail", "a".repeat(39))).unwrap();
    assert_eq!(long, "a".repeat(39), "cut at 40 characters, no trailing hyphen");
    assert!(valid_project_id(&"0f".repeat(16)));
    assert!(!valid_project_id(&"0F".repeat(16)) && !valid_project_id("abc"));
}

#[test]
fn init_mints_once_and_reads_the_same_file_from_a_worktree() {
    let w = world();
    let missing = refusal(project_info(&w.state, &w.a));
    assert_eq!(missing, "project-id-missing");

    let minted = project_init(&w.state, &w.a, None, false).unwrap();
    assert_eq!(minted.project.handle, "alpha", "the folder name seeds the handle");
    assert!(valid_project_id(&minted.project.id));
    assert!(minted.commit.contains("git add .fgos/project.json"));
    assert_eq!(fs::read_to_string(w.a.join(".fgos/project.json")).unwrap().lines().count(), 1);
    assert_eq!(project_info(&w.state, &w.a).unwrap(), minted.project);

    assert_eq!(refusal(project_init(&w.state, &w.a, None, false)), "project-id-exists");

    let tree = w.a.with_file_name("alpha-wt");
    git(&w.a, &["worktree", "add", tree.to_str().unwrap(), "-b", "side"]);
    assert_eq!(project_info(&w.state, &tree).unwrap(), minted.project, "a worktree reads the main checkout's file");
    assert_eq!(refusal(project_init(&w.state, &tree, None, false)), "linked-worktree");
    assert_eq!(refusal(project_init(&w.state, &tree, None, true)), "linked-worktree");
    assert!(!tree.join(".fgos").exists(), "nothing is written in the worktree");

    let again = project_init(&w.state, &w.a, Some("forked"), true).unwrap();
    assert_ne!(again.project.id, minted.project.id);
    assert_eq!(project_info(&w.state, &w.a).unwrap().handle, "forked");
}

#[test]
fn a_second_clone_refuses_to_mint_once_the_remote_tracks_the_file_and_then_reads_the_same_id() {
    let w = world();
    let minted = project_init(&w.state, &w.a, Some("shared"), false).unwrap();
    git(&w.a, &["add", ".fgos/project.json"]);
    git(&w.a, &["commit", "-m", "add the project id", "--", ".fgos/project.json"]);
    git(&w.a, &["push", "origin", "HEAD:main"]);

    git(&w.b, &["fetch", "origin"]);
    assert_eq!(refusal(project_init(&w.state, &w.b, None, false)), "project-id-on-remote");
    assert_eq!(refusal(project_info(&w.state, &w.b)), "project-id-missing", "not pulled yet");

    git(&w.b, &["pull", "--ff-only", "origin", "main"]);
    assert_eq!(project_info(&w.state, &w.b).unwrap(), minted.project);
}

#[test]
fn refuses_outside_a_repository_for_an_unreadable_file_and_for_a_bad_handle() {
    let w = world();
    let outside = scratch("outside");
    assert_eq!(refusal(project_info(&w.state, &outside)), "not-a-repository");

    fs::create_dir_all(w.a.join(".fgos")).unwrap();
    fs::write(w.a.join(".fgos/project.json"), "{\"v\":1,\"projectId\":\"nope\",\"handle\":\"x\",\"createdAt\":\"t\"}").unwrap();
    assert_eq!(refusal(project_info(&w.state, &w.a)), "project-id-unreadable");
    assert_eq!(refusal(project_init(&w.state, &w.a, None, false)), "project-id-exists", "an unreadable file is still a file");
    fs::remove_file(w.a.join(".fgos/project.json")).unwrap();

    assert_eq!(refusal(project_init(&w.state, &w.a, Some("Not A Handle"), false)), "invalid-handle");
    assert!(!w.a.join(".fgos/project.json").exists());
}

#[test]
fn a_file_is_only_read_when_version_id_and_handle_follow_the_rules() {
    let root = scratch("file");
    let write = |body: &str| {
        fs::create_dir_all(root.join(".fgos")).unwrap();
        fs::write(root.join(".fgos/project.json"), body).unwrap();
    };
    assert!(matches!(project::read(&root), Err(Error::Missing(_))));
    let id = "0123456789abcdef0123456789abcdef";
    write(&format!("{{\"v\":1,\"projectId\":\"{id}\",\"handle\":\"forgent\",\"createdAt\":\"2026-10-22T00:00:00.000Z\"}}"));
    assert_eq!(project::read(&root).unwrap().project_id, id);
    write(&format!("{{\"v\":2,\"projectId\":\"{id}\",\"handle\":\"forgent\",\"createdAt\":\"t\"}}"));
    assert!(matches!(project::read(&root), Err(Error::Invalid(_))));
    write(&format!("{{\"v\":1,\"projectId\":\"{id}\",\"handle\":\"Bad\",\"createdAt\":\"t\"}}"));
    assert!(matches!(project::read(&root), Err(Error::Invalid(_))));
    write("not json");
    assert!(matches!(project::read(&root), Err(Error::Invalid(_))));
}
