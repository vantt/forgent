#![cfg(target_os = "linux")]
//! The facts of a repository the doctor judges: read without writing anything, from real repositories.
use fgos_git::repository_facts::{inspect_repository, Inspection, RepositoryFacts};
use fgos_git::{wal::Wal, GitDriver, ResolveRepo};
use std::{
    fs,
    os::unix::fs::PermissionsExt,
    path::{Path, PathBuf},
    process::Command,
};

fn git(args: &[&str]) -> String {
    let output = Command::new("git").args(args).output().unwrap();
    assert!(output.status.success(), "{args:?}: {output:?}");
    String::from_utf8(output.stdout).unwrap().trim().into()
}

fn scratch(name: &str) -> PathBuf {
    let root = std::env::temp_dir().join(format!("fgos-facts-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    fs::create_dir(&root).unwrap();
    fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
    root
}

fn bare(root: &Path) -> PathBuf {
    let repo = root.join("repo");
    git(&["init", "--bare", "-q", repo.to_str().unwrap()]);
    repo
}

fn facts(root: &Path, repo: &Path, trusted_main: &Path) -> RepositoryFacts {
    let driver = GitDriver::new(root).unwrap();
    match inspect_repository(&driver, repo, trusted_main, "origin").unwrap() {
        Inspection::Repository(found) => *found,
        Inspection::NotARepository { .. } => panic!("a repository was expected"),
    }
}

#[test]
fn the_activation_fence_is_reported_standing_only_while_the_controller_tombstone_names_the_git_door(
) {
    let root = scratch("fence");
    let repo = bare(&root);
    assert!(!facts(&root, &repo, &repo).activation_fence);
    let fence = repo.join(".fgos/locks/activation.lock");
    fs::create_dir_all(&fence).unwrap();
    fs::write(
        fence.join("TOMBSTONE"),
        r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
    )
    .unwrap();
    assert!(facts(&root, &repo, &repo).activation_fence);
    fs::write(
        fence.join("TOMBSTONE"),
        r#"{"lock":"activation","by":"fgos 4.4","at":"fixture"}"#,
    )
    .unwrap();
    assert!(!facts(&root, &repo, &repo).activation_fence);
    fs::remove_dir_all(&root).unwrap();
}

#[test]
fn an_inspection_leaves_the_journal_absent_and_reports_transport_settings_mappings_and_native_locks(
) {
    let root = scratch("facts");
    let repo = bare(&root);
    let git_dir = repo.to_str().unwrap();
    git(&[
        "--git-dir",
        git_dir,
        "config",
        "remote.origin.url",
        "/fixture/remote",
    ]);
    git(&[
        "--git-dir",
        git_dir,
        "config",
        "--add",
        "remote.origin.fetch",
        "+refs/heads/*:refs/remotes/origin/*",
    ]);
    let fence = repo.join(".fgos/locks/activation.lock");
    fs::create_dir_all(&fence).unwrap();
    fs::write(
        fence.join("TOMBSTONE"),
        r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
    )
    .unwrap();

    let found = facts(&root, &repo, &repo);
    assert!(!found.journal.initialized);
    assert!(found.untrusted_transport_config.is_empty());
    assert_eq!(
        found.fetch_refspecs,
        vec!["+refs/heads/*:refs/remotes/origin/*".to_owned()]
    );
    assert!(
        !repo.join("fgos/git").exists(),
        "inspecting never creates the journal"
    );

    git(&[
        "--git-dir",
        git_dir,
        "config",
        "http.https://github.com/.extraheader",
        "AUTHORIZATION: secret",
    ]);
    assert_eq!(
        facts(&root, &repo, &repo).untrusted_transport_config,
        vec!["http.https://github.com/.extraheader".to_owned()]
    );
    git(&[
        "--git-dir",
        git_dir,
        "config",
        "--unset",
        "http.https://github.com/.extraheader",
    ]);

    let driver = GitDriver::new(&root).unwrap();
    let ResolveRepo::Repository(handle) = driver.resolve_repo(&repo, &repo).unwrap() else {
        panic!("a repository was expected");
    };
    Wal::open(&handle).unwrap();
    let opened = facts(&root, &repo, &repo);
    assert!(opened.journal.initialized);
    assert_eq!(opened.journal.pending_count, 0);

    fs::write(repo.join("config.lock"), "native owner").unwrap();
    assert_eq!(facts(&root, &repo, &repo).native_locks, ["config.lock"]);
    assert_eq!(
        fs::read_to_string(repo.join("config.lock")).unwrap(),
        "native owner"
    );
    let pins = repo.join("refs/fgos/git-operations/op-1");
    fs::create_dir_all(&pins).unwrap();
    fs::write(pins.join("candidate.lock"), "").unwrap();
    assert_eq!(
        facts(&root, &repo, &repo).native_locks,
        [
            "config.lock",
            "refs/fgos/git-operations/op-1/candidate.lock"
        ]
    );
    assert!(
        pins.join("candidate.lock").exists(),
        "inspecting never removes a lock"
    );
    fs::remove_dir_all(&root).unwrap();
}

#[test]
fn native_lock_residue_that_is_a_dangling_symlink_in_a_linked_worktree_git_directory_is_found() {
    let root = scratch("linked");
    let (main, linked) = (root.join("main"), root.join("linked"));
    git(&["init", "-q", main.to_str().unwrap()]);
    git(&[
        "-C",
        main.to_str().unwrap(),
        "-c",
        "user.name=fixture",
        "-c",
        "user.email=fixture@example.invalid",
        "commit",
        "--allow-empty",
        "-qm",
        "fixture",
    ]);
    git(&[
        "-C",
        main.to_str().unwrap(),
        "worktree",
        "add",
        "-q",
        "--detach",
        linked.to_str().unwrap(),
    ]);
    let git_dir = git(&[
        "-C",
        linked.to_str().unwrap(),
        "rev-parse",
        "--absolute-git-dir",
    ]);
    std::os::unix::fs::symlink(root.join("missing"), Path::new(&git_dir).join("index.lock"))
        .unwrap();
    assert!(facts(&root, &linked, &main)
        .native_locks
        .contains(&"index.lock".to_owned()));
    fs::remove_dir_all(&root).unwrap();
}
