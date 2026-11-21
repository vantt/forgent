//! The Git ports on Windows, under a held custody lock, with the real `fgos`
//! binary as the borrow helper (a library test harness serves no helper role).
//! Each case runs a port against a real repository and asserts the Git result
//! and that the custody lock is still held by its owner afterwards.
#![cfg(windows)]

mod windows_support;

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use fgos_git::*;
use fgos_holder_lock::{probe, validate, BorrowedHandle, Handle, Probe, Resource};
use windows_support::{helper, serial, temp_dir};

fn git(root: &Path, args: &[&str]) -> String {
    let out = Command::new("git")
        .arg("-C")
        .arg(root)
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

fn oid(text: &str) -> Oid {
    Oid::parse(text, ObjectFormat::Sha1).unwrap()
}

struct Fixture {
    temp: PathBuf,
    main: PathBuf,
    tree: PathBuf,
    driver: GitDriver,
    repo: RepoHandle,
    lease: Option<Handle>,
}

impl Fixture {
    /// A main checkout on `trunk` and a linked checkout on `producer`, whose custody lease this fixture holds.
    fn new(tag: &str) -> Self {
        let temp = plain_path(&fs::canonicalize(temp_dir(tag)).unwrap());
        let main = temp.join("repo");
        fs::create_dir(&main).unwrap();
        git(&main, &["init", "-q", "--initial-branch=trunk"]);
        git(&main, &["config", "user.name", "Fixture"]);
        git(&main, &["config", "user.email", "fixture@example.invalid"]);
        git(&main, &["config", "core.autocrlf", "false"]);
        fs::write(main.join("a"), "base\n").unwrap();
        fs::write(main.join("b"), "base\n").unwrap();
        git(&main, &["add", "."]);
        git(&main, &["commit", "-qm", "base"]);
        let tree = temp.join("producer");
        git(
            &main,
            &["worktree", "add", "-qb", "producer", tree.to_str().unwrap()],
        );
        let fence = main.join(".fgos/locks/activation.lock");
        fs::create_dir_all(&fence).unwrap();
        fs::write(
            fence.join("TOMBSTONE"),
            r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
        )
        .unwrap();
        let state = temp.join("state");
        fs::create_dir(&state).unwrap();
        let driver = GitDriver::new(&state).unwrap().with_helper(helper());
        let repo = match driver.resolve_repo(&tree, &main).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!("the linked checkout is not a repository"),
        };
        let lease = acquire_checkout_custody(&repo, &tree).unwrap();
        Self {
            temp,
            main,
            tree,
            driver,
            repo,
            lease: Some(lease),
        }
    }
    /// Ignore `ignored-dir/` and `*.log` in every checkout of the fixture repository.
    fn ignore_fixture_patterns(&self) {
        fs::write(
            self.repo.common_dir().join("info/exclude"),
            "ignored-dir/\n*.log\n",
        )
        .unwrap();
    }
    fn tip(&self) -> Oid {
        oid(&git(&self.main, &["rev-parse", "HEAD"]))
    }
    fn create_worker(&self, path: &Path) {
        self.driver
            .create_worktree(
                &self.repo,
                self.held(),
                &WorktreeCreate {
                    path: path.into(),
                    branch: None,
                    base: self.tip(),
                    session_id: None,
                },
                "fixture",
                "create-worker",
            )
            .unwrap();
    }
    fn remove(&self, path: &Path, id: &str, ignored: IgnoredBytes) -> Result<DiscardedIgnored> {
        self.driver.remove_worktree(
            &self.repo,
            self.held(),
            path,
            &WorktreeDelivery {
                expected_tip: self.tip(),
                delivered_to: self.tip(),
                evidence_digest: "a".repeat(64),
            },
            "fixture",
            id,
            ignored,
        )
    }
    fn lease(&self) -> &Handle {
        self.lease.as_ref().unwrap()
    }
    fn held(&self) -> Vec<BorrowedHandle<'_>> {
        vec![BorrowedHandle::new(self.lease()).unwrap()]
    }
    /// The custody lock is still held by its owner: the handle validates and no other opener can take it.
    fn assert_custody_held(&self) {
        validate(self.lease()).expect("the custody handle is still valid");
        let resource = Resource::new("dispatch-cwd", self.lease().path().to_path_buf());
        assert_eq!(
            probe(&resource).unwrap(),
            Probe::Held,
            "the custody lock is held by its owner"
        );
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        drop(self.lease.take());
        let _ = fs::remove_dir_all(&self.temp);
    }
}

#[test]
fn a_scoped_commit_of_declared_paths_under_held_custody() {
    let _serial = serial();
    let f = Fixture::new("commit");
    let baseline = f.driver.preflight_commit(&f.repo, f.held(), None).unwrap();
    fs::write(f.tree.join("selected.txt"), "selected").unwrap();
    fs::write(f.tree.join("outside.txt"), "outside").unwrap();
    let request = CommitRequest {
        writes: vec!["selected.txt".into()],
        message: "declared paths\n".into(),
    };
    let result = f
        .driver
        .scoped_commit(
            &f.repo,
            f.held(),
            &baseline,
            &request,
            "fixture",
            "commit-one",
            &wal::OsFileSystem,
        )
        .unwrap();
    assert_eq!(result.status, ResultCode::Committed);
    assert_eq!(result.files, vec!["selected.txt"]);
    assert_eq!(
        git(&f.tree, &["show", "--name-only", "--format=", "HEAD"]),
        "selected.txt"
    );
    assert!(
        git(&f.tree, &["status", "--porcelain"]).contains("outside.txt"),
        "a path outside the declaration stays uncommitted"
    );
    f.assert_custody_held();
}

#[test]
fn a_sync_merges_the_target_into_the_linked_checkout_under_held_custody() {
    let _serial = serial();
    let f = Fixture::new("sync");
    fs::write(f.main.join("incoming"), "target\n").unwrap();
    git(&f.main, &["add", "incoming"]);
    git(&f.main, &["commit", "-qm", "target"]);
    let head = git(&f.tree, &["rev-parse", "HEAD"]);
    let target = git(&f.main, &["rev-parse", "HEAD"]);
    let result = f
        .driver
        .start_sync(
            &f.repo,
            f.held(),
            &oid(&target),
            "consumer sync",
            "fixture",
            "sync-one",
        )
        .unwrap();
    assert_eq!(result.state, "done");
    assert_eq!(
        git(&f.tree, &["show", "-s", "--format=%P", "HEAD"]),
        format!("{head} {target}"),
        "the merge has the checkout's head and the target as its two parents"
    );
    assert_eq!(
        fs::read_to_string(f.tree.join("incoming")).unwrap().trim(),
        "target"
    );
    f.assert_custody_held();
}

#[test]
fn a_land_publishes_a_candidate_onto_the_target_branch_while_custody_stays_held() {
    let _serial = serial();
    let f = Fixture::new("land");
    let target = git(&f.main, &["rev-parse", "HEAD"]);
    git(&f.main, &["checkout", "-qb", "source"]);
    fs::write(f.main.join("a"), "incoming\n").unwrap();
    git(&f.main, &["commit", "-qam", "source"]);
    let source = git(&f.main, &["rev-parse", "HEAD"]);
    git(&f.main, &["checkout", "-q", "trunk"]);
    let request = LandRequest {
        source: source.clone(),
        target: target.clone(),
        destination: "refs/heads/trunk".into(),
        message: "consumer land".into(),
        squash: false,
        footprint: Some(vec![]),
        subtree: None,
        files: vec![],
    };
    let main_repo = match f.driver.resolve_repo(&f.main, &f.main).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!("the main checkout is not a repository"),
    };
    let mut session = f
        .driver
        .prepare_land(
            &main_repo,
            vec![],
            &request,
            "fixture",
            "land-one",
            &wal::OsFileSystem,
            0,
        )
        .unwrap();
    let candidate = session.candidate().unwrap();
    let evidence = LandEvidence {
        source: candidate.source.clone(),
        target: candidate.target.clone(),
        candidate: candidate.candidate.clone(),
        tree_digest: candidate.tree_digest.clone(),
        evidence_digest: "consumer-test-run".into(),
    };
    let receipt = f
        .driver
        .publish_land(&main_repo, &mut session, &evidence, &wal::OsFileSystem, 0)
        .unwrap();
    assert_eq!(receipt.operation_id, "land-one");
    assert_eq!(
        git(&f.main, &["show", "-s", "--format=%P", "trunk"]),
        format!("{target} {source}")
    );
    assert_eq!(
        fs::read_to_string(f.main.join("a")).unwrap().trim(),
        "incoming"
    );
    f.assert_custody_held();
}

#[test]
fn a_safe_restore_carries_the_checkout_to_a_descendant_under_held_custody() {
    let _serial = serial();
    let f = Fixture::new("restore");
    let head = git(&f.tree, &["rev-parse", "HEAD"]);
    git(&f.main, &["checkout", "-qb", "ahead"]);
    fs::write(f.main.join("b"), "ahead\n").unwrap();
    git(&f.main, &["commit", "-qam", "ahead"]);
    let ahead = git(&f.main, &["rev-parse", "HEAD"]);
    git(&f.main, &["checkout", "-q", "trunk"]);
    let request = RestoreRequest {
        expected_head: head,
        target: ahead.clone(),
        reason: "carry the checkout to its descendant".into(),
        reapply_local_delta: true,
        allowed_replacements: vec![],
        checkout_baseline: None,
        discard_local_delta: false,
        require_clean_baseline: false,
        require_staged_only: false,
        confirmed_by: None,
    };
    let preview = f
        .driver
        .preview_restore(&f.repo, f.held(), &request)
        .unwrap();
    assert_eq!(preview.head, request.expected_head);
    f.driver
        .apply_restore(
            &f.repo,
            f.held(),
            &request,
            "fixture",
            "restore-one",
            &wal::OsFileSystem,
        )
        .unwrap();
    assert_eq!(git(&f.tree, &["rev-parse", "HEAD"]), ahead);
    assert_eq!(
        fs::read_to_string(f.tree.join("b")).unwrap().trim(),
        "ahead"
    );
    f.assert_custody_held();
}

#[test]
fn a_ref_update_moves_a_branch_under_held_custody() {
    let _serial = serial();
    let f = Fixture::new("refs");
    let first = git(&f.main, &["rev-parse", "HEAD"]);
    git(&f.main, &["branch", "topic", &first]);
    fs::write(f.main.join("b"), "second\n").unwrap();
    git(&f.main, &["commit", "-qam", "second"]);
    let second = git(&f.main, &["rev-parse", "HEAD"]);
    let name = RefName::parse("refs/heads/topic").unwrap();
    f.driver
        .advance_ref(
            &f.repo,
            f.held(),
            &name,
            &oid(&first),
            &oid(&second),
            "fixture",
            "advance-one",
        )
        .unwrap();
    assert_eq!(git(&f.main, &["rev-parse", "topic"]), second);
    f.assert_custody_held();
}

#[test]
fn a_repository_config_write_installs_the_fetch_mapping_under_held_custody() {
    let _serial = serial();
    let f = Fixture::new("config");
    git(
        &f.main,
        &[
            "remote",
            "add",
            "origin",
            "https://example.invalid/repo.git",
        ],
    );
    let refspecs = publication_fetch_mappings("origin").unwrap();
    f.driver
        .ensure_fetch_mapping_with_filesystem(
            &f.repo,
            "origin",
            &refspecs,
            "mapping-one",
            &wal::OsFileSystem,
        )
        .unwrap();
    let configured = git(&f.main, &["config", "--get-all", "remote.origin.fetch"]);
    for refspec in &refspecs {
        assert!(configured.contains(refspec.as_str()), "{refspec} missing");
    }
    f.assert_custody_held();
}

#[test]
fn a_worktree_is_created_and_removed_with_its_ignored_bytes_discarded_under_held_custody() {
    let _serial = serial();
    let f = Fixture::new("worktree");
    fs::write(
        f.repo.common_dir().join("info/exclude"),
        "ignored-dir/\n*.log\n",
    )
    .unwrap();
    let tip = oid(&git(&f.main, &["rev-parse", "HEAD"]));
    let path = f.temp.join("worker");
    let handle = f
        .driver
        .create_worktree(
            &f.repo,
            f.held(),
            &WorktreeCreate {
                path: path.clone(),
                branch: None,
                base: tip.clone(),
                session_id: None,
            },
            "fixture",
            "create-one",
        )
        .unwrap();
    assert_eq!(handle.tip, tip);
    assert_eq!(git(&path, &["rev-parse", "HEAD"]), tip.as_str());
    fs::create_dir_all(path.join("ignored-dir/sub")).unwrap();
    fs::write(path.join("ignored-dir/a"), "12345").unwrap();
    fs::write(path.join("ignored-dir/sub/b"), "123").unwrap();
    fs::write(path.join("x.log"), "1234").unwrap();
    let proof = WorktreeDelivery {
        expected_tip: tip.clone(),
        delivered_to: tip,
        evidence_digest: "a".repeat(64),
    };
    assert_eq!(
        f.driver
            .remove_worktree(
                &f.repo,
                f.held(),
                &path,
                &proof,
                "fixture",
                "keep-ignored",
                IgnoredBytes::Preserve,
            )
            .unwrap_err()
            .cause,
        "worktree-ignored-bytes-preserved"
    );
    let discarded = f
        .driver
        .remove_worktree(
            &f.repo,
            f.held(),
            &path,
            &proof,
            "fixture",
            "remove-one",
            IgnoredBytes::Discard,
        )
        .unwrap();
    assert_eq!(
        discarded,
        DiscardedIgnored {
            files: 3,
            bytes: 12
        }
    );
    assert!(!path.exists());
    assert!(!f.repo.common_dir().join("worktrees/worker").exists());
    f.assert_custody_held();
}

#[test]
fn the_custody_lock_of_a_checkout_is_keyed_by_the_directory_and_refused_to_a_second_taker() {
    let _serial = serial();
    let f = Fixture::new("custody");
    let second = acquire_checkout_custody(&f.repo, &f.tree).unwrap_err();
    assert_eq!(second.cause, "checkout-custody-busy");
    let keys: BTreeMap<_, _> = fs::read_dir(f.main.join(".fgos/locks"))
        .unwrap()
        .filter_map(|e| e.ok())
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .filter(|n| n.starts_with("dispatch-cwd--"))
        .map(|n| (n, ()))
        .collect();
    assert_eq!(keys.len(), 1, "one lease file per checkout directory");
    f.assert_custody_held();
}

#[test]
fn discarding_refuses_the_main_checkout_and_unregistered_paths_and_keeps_their_bytes() {
    let _serial = serial();
    let f = Fixture::new("discard-refuse");
    f.ignore_fixture_patterns();
    fs::write(f.main.join("x.log"), "main").unwrap();
    assert_eq!(
        f.remove(&f.main, "main", IgnoredBytes::Discard)
            .unwrap_err()
            .cause,
        "worktree-identity-refused"
    );
    assert_eq!(fs::read(f.main.join("x.log")).unwrap(), b"main");
    let inside = f.main.join("ignored-dir");
    let plain = f.temp.join("plain");
    let foreign = f.temp.join("foreign");
    git(&f.temp, &["init", "-q", "foreign"]);
    for (dir, cause) in [
        (&inside, "worktree-identity-refused"),
        (&plain, "untrusted-worktree"),
        (&foreign, "untrusted-worktree"),
    ] {
        fs::create_dir_all(dir).unwrap();
        fs::write(dir.join("x.log"), "keep").unwrap();
        assert_eq!(
            f.remove(dir, "unregistered", IgnoredBytes::Discard)
                .unwrap_err()
                .cause,
            cause,
            "{}",
            dir.display()
        );
        assert_eq!(fs::read(dir.join("x.log")).unwrap(), b"keep");
    }
    f.assert_custody_held();
}

#[test]
fn discarding_refuses_a_worktree_with_tracked_or_untracked_changes_and_keeps_its_ignored_bytes() {
    let _serial = serial();
    for change in ["tracked", "untracked"] {
        let f = Fixture::new("discard-dirty");
        f.ignore_fixture_patterns();
        let path = f.temp.join("worker");
        f.create_worker(&path);
        fs::write(path.join("x.log"), "keep").unwrap();
        match change {
            "tracked" => fs::write(path.join("a"), "edited").unwrap(),
            _ => fs::write(path.join("notes"), "user bytes").unwrap(),
        }
        assert_eq!(
            f.remove(&path, "dirty", IgnoredBytes::Discard)
                .unwrap_err()
                .cause,
            "worktree-dirty-preserved",
            "{change}"
        );
        assert_eq!(fs::read(path.join("x.log")).unwrap(), b"keep");
        f.assert_custody_held();
    }
}

#[test]
fn discarding_refuses_an_ignored_directory_that_holds_a_nested_repository_and_deletes_nothing() {
    let _serial = serial();
    let f = Fixture::new("discard-nested");
    f.ignore_fixture_patterns();
    let path = f.temp.join("worker");
    f.create_worker(&path);
    fs::write(path.join("x.log"), "keep").unwrap();
    fs::create_dir(path.join("ignored-dir")).unwrap();
    git(&path.join("ignored-dir"), &["init", "-q", "nested"]);
    fs::write(path.join("ignored-dir/nested/work"), "own history").unwrap();
    assert_eq!(
        f.remove(&path, "nested", IgnoredBytes::Discard)
            .unwrap_err()
            .cause,
        "worktree-ignored-repository-preserved"
    );
    assert_eq!(fs::read(path.join("x.log")).unwrap(), b"keep");
    assert_eq!(
        fs::read(path.join("ignored-dir/nested/work")).unwrap(),
        b"own history"
    );
    f.assert_custody_held();
}

#[test]
fn a_missing_checkout_is_pruned_only_when_its_create_is_owned_and_no_unknown_residue_remains() {
    let _serial = serial();
    let f = Fixture::new("prune-missing");
    let owned = f.temp.join("owned");
    f.create_worker(&owned);
    let admin = f.repo.common_dir().join("worktrees/owned");
    fs::remove_dir_all(&owned).unwrap();
    fs::write(admin.join("unknown"), "keep").unwrap();
    let refused = f
        .driver
        .prune_missing_worktree(&f.repo, f.held(), &owned, "fixture", "prune")
        .unwrap_err();
    assert!(refused.cause.contains("residue-uncertain"), "{refused:?}");
    assert!(admin.join("HEAD").exists());
    fs::remove_file(admin.join("unknown")).unwrap();
    f.driver
        .prune_missing_worktree(&f.repo, f.held(), &owned, "fixture", "prune")
        .unwrap();
    assert!(!admin.exists());
    let unowned = f.temp.join("unowned");
    git(
        &f.main,
        &["worktree", "add", "--detach", unowned.to_str().unwrap()],
    );
    fs::remove_dir_all(&unowned).unwrap();
    let refused = f
        .driver
        .prune_missing_worktree(&f.repo, f.held(), &unowned, "fixture", "unowned-prune")
        .unwrap_err();
    assert!(refused.cause.contains("ownership-unproven"), "{refused:?}");
    assert!(f.repo.common_dir().join("worktrees/unowned/HEAD").exists());
}

#[test]
fn a_missing_owned_detached_checkout_with_unique_history_keeps_its_registration() {
    let _serial = serial();
    let f = Fixture::new("prune-history");
    let owned = f.temp.join("owned");
    f.create_worker(&owned);
    fs::write(owned.join("valuable"), "keep unique history").unwrap();
    git(&owned, &["add", "valuable"]);
    git(&owned, &["commit", "-qm", "unique detached history"]);
    let tip = git(&owned, &["rev-parse", "HEAD"]);
    fs::remove_dir_all(&owned).unwrap();
    let refused = f
        .driver
        .prune_missing_worktree(&f.repo, f.held(), &owned, "fixture", "unreachable-prune")
        .unwrap_err();
    assert!(refused.cause.contains("tip-unreachable"), "{refused:?}");
    assert_eq!(
        fs::read_to_string(f.repo.common_dir().join("worktrees/owned/HEAD"))
            .unwrap()
            .trim(),
        tip
    );
    assert_eq!(
        git(&f.main, &["show", &format!("{tip}:valuable")]),
        "keep unique history"
    );
}
