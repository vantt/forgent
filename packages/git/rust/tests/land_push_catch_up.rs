// Linux only: its Git children run through a borrowed lock, which on Windows needs a helper executable that a library test harness is not; the Windows proof of this port runs from apps/fgos/tests/windows_git_custody.rs.
#![cfg(target_os = "linux")]
//! Land push from inside a live session, and the main-checkout catch-up door.
include!("support/land.rs");

fn name(text: &str) -> RefName {
    RefName::parse(text).unwrap()
}
fn oid(f: &Fixture, text: &str) -> Oid {
    Oid::parse(text, f.repo.object_format()).unwrap()
}
/// A bare remote named `origin` that already holds trunk, plus the grant for it.
fn remote(f: &Fixture) -> (RemoteGrant, PathBuf) {
    let bare = f.temp.join("remote.git");
    git(&f.temp, &["init", "-q", "--bare", bare.to_str().unwrap()]);
    git(
        &f.main,
        &["remote", "add", "origin", bare.to_str().unwrap()],
    );
    git(&f.main, &["push", "-q", "origin", "trunk"]);
    (
        RemoteGrant {
            name: "origin".into(),
            pinned_url: bare.to_str().unwrap().into(),
        },
        bare,
    )
}
fn prepare(f: &Fixture, id: &str) -> LandSession {
    f.driver
        .prepare_land(
            &f.repo,
            vec![],
            &f.request,
            "fixture",
            id,
            &wal::OsFileSystem,
            0,
        )
        .unwrap()
}
fn push(f: &Fixture, s: &LandSession, grant: &RemoteGrant) -> Result<Receipt> {
    f.driver.push_land_candidate(
        &f.repo,
        s,
        grant,
        &name("refs/heads/trunk"),
        "fixture",
        &wal::OsFileSystem,
    )
}
/// A commit on top of trunk touching `file`, left on its own branch; trunk is unchanged.
fn commit_ahead(f: &Fixture, branch: &str, file: &str) -> String {
    git(&f.main, &["checkout", "-qb", branch]);
    fs::write(f.main.join(file), format!("{branch}\n")).unwrap();
    git(&f.main, &["commit", "-qam", branch]);
    let tip = git(&f.main, &["rev-parse", "HEAD"]);
    git(&f.main, &["checkout", "-q", "trunk"]);
    tip
}
fn catch_up(f: &Fixture, old: &str, id: &str) -> Result<Receipt> {
    catch_up_with(f, old, id, &wal::OsFileSystem)
}
fn catch_up_with<F: wal::FileSystem>(
    f: &Fixture,
    old: &str,
    id: &str,
    filesystem: &F,
) -> Result<Receipt> {
    f.driver.catch_up_main_checkout(
        &f.repo,
        vec![],
        &name("refs/heads/trunk"),
        &oid(f, old),
        &name("refs/remotes/origin/trunk"),
        "fixture",
        id,
        filesystem,
    )
}
/// Fails the door at one named production boundary, as a crash there would leave it.
struct StopAt(&'static str);
impl wal::FileSystem for StopAt {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        if step == self.0 {
            Err(std::io::Error::other("interrupted at production boundary"))
        } else {
            Ok(())
        }
    }
}
fn recover(f: &Fixture) -> serde_json::Value {
    serde_json::to_value(
        fgos_git::incidents::recover_git_operations(
            &f.temp.join("state"),
            &f.main,
            &|_| "fixture".to_owned(),
            &|_| false,
        )
        .unwrap(),
    )
    .unwrap()
}

#[test]
fn land_pushes_its_candidate_while_alive_then_publishes() {
    let f = Fixture::new();
    let (grant, bare) = remote(&f);
    let mut s = prepare(&f, "push-then-publish");
    let candidate = s.candidate().unwrap().candidate.clone();
    let receipt = push(&f, &s, &grant).unwrap();
    assert!(matches!(receipt.remote, Remote::Acknowledged));
    assert_eq!(git(&bare, &["rev-parse", "refs/heads/trunk"]), candidate);
    assert_eq!(
        git(&f.main, &["branch", "--list", "fgos-land-push-*"]),
        "",
        "the push branch does not outlive the push"
    );
    assert_eq!(
        git(&f.main, &["rev-parse", "HEAD"]),
        f.request.target,
        "the push alone publishes nothing locally"
    );
    let e = evidence(&s);
    f.driver
        .publish_land(&f.repo, &mut s, &e, &wal::OsFileSystem, 0)
        .unwrap();
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), candidate);
    assert_eq!(git(&bare, &["rev-parse", "refs/heads/trunk"]), candidate);
}

#[test]
fn a_push_branch_moved_before_the_transfer_is_refused_and_nothing_is_sent() {
    let f = Fixture::new();
    let (grant, bare) = remote(&f);
    let s = prepare(&f, "moved-source");
    let before = git(&bare, &["rev-parse", "refs/heads/trunk"]);
    /// Another writer moves the push branch after it was created, before the transfer reads it.
    struct Swap(PathBuf, String);
    impl wal::FileSystem for Swap {
        fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
            if step == "land-push-source" {
                git(
                    &self.0,
                    &[
                        "update-ref",
                        "refs/heads/fgos-land-push-moved-source",
                        &self.1,
                    ],
                );
            }
            Ok(())
        }
    }
    let swap = Swap(f.main.clone(), f.request.source.clone());
    let error = f
        .driver
        .push_land_candidate(
            &f.repo,
            &s,
            &grant,
            &name("refs/heads/trunk"),
            "fixture",
            &swap,
        )
        .unwrap_err();
    assert_eq!(error.cause, "land-push-source-moved");
    assert_eq!(
        git(&bare, &["rev-parse", "refs/heads/trunk"]),
        before,
        "the replacement commit is never sent"
    );
    drop(s);
}

#[test]
fn another_push_to_the_land_destination_stays_refused() {
    let f = Fixture::new();
    let (grant, bare) = remote(&f);
    let s = prepare(&f, "other-push");
    let before = git(&bare, &["rev-parse", "refs/heads/trunk"]);
    let error = f
        .driver
        .push_refs(
            &f.repo,
            vec![],
            &grant,
            &[RefMapping {
                source: name("refs/heads/source"),
                destination: name("refs/heads/trunk"),
            }],
            "fixture",
            "plain-push",
        )
        .unwrap_err();
    assert_eq!(error.cause, "resource-recovery-required");
    assert_eq!(git(&bare, &["rev-parse", "refs/heads/trunk"]), before);
    drop(s);
}

#[test]
fn push_with_a_fgos_source_outside_a_land_stays_refused() {
    let f = Fixture::new();
    let (grant, bare) = remote(&f);
    let before = git(&bare, &["rev-parse", "refs/heads/trunk"]);
    git(
        &f.main,
        &[
            "update-ref",
            "refs/fgos/git-operations/loose/candidate",
            &f.request.source,
        ],
    );
    let error = f
        .driver
        .push_refs(
            &f.repo,
            vec![],
            &grant,
            &[RefMapping {
                source: name("refs/fgos/git-operations/loose/candidate"),
                destination: name("refs/heads/trunk"),
            }],
            "fixture",
            "fgos-source",
        )
        .unwrap_err();
    assert_eq!(error.cause, "invalid-remote-mappings");
    assert_eq!(git(&bare, &["rev-parse", "refs/heads/trunk"]), before);
}

#[test]
fn remote_moved_rejects_the_push_publishes_nothing_and_the_session_drops() {
    let f = Fixture::new();
    let (grant, bare) = remote(&f);
    let s = prepare(&f, "remote-moved");
    // Someone else advances the remote trunk after the candidate was built.
    let other = f.temp.join("other");
    git(
        &f.temp,
        &[
            "clone",
            "-q",
            "-b",
            "trunk",
            bare.to_str().unwrap(),
            other.to_str().unwrap(),
        ],
    );
    git(&other, &["config", "user.name", "Other"]);
    git(&other, &["config", "user.email", "other@example.invalid"]);
    fs::write(other.join("d"), "moved\n").unwrap();
    git(&other, &["commit", "-qam", "moved"]);
    git(&other, &["push", "-q", "origin", "HEAD:refs/heads/trunk"]);
    let moved = git(&bare, &["rev-parse", "refs/heads/trunk"]);
    let receipt = push(&f, &s, &grant).unwrap();
    assert!(matches!(receipt.remote, Remote::Rejected));
    assert_eq!(git(&bare, &["rev-parse", "refs/heads/trunk"]), moved);
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), f.request.target);
    drop(s);
    // Nothing is stuck: a later session on the same destination prepares normally.
    let again = prepare(&f, "after-moved");
    assert!(again.candidate().is_some());
}

#[test]
fn catch_up_fast_forwards_a_clean_behind_main_checkout() {
    let f = Fixture::new();
    let tip = commit_ahead(&f, "ahead", "c");
    git(&f.main, &["update-ref", "refs/remotes/origin/trunk", &tip]);
    let receipt = catch_up(&f, &f.request.target, "catch-up").unwrap();
    assert!(matches!(receipt.checkout, Checkout::Reconciled));
    assert_eq!(git(&f.main, &["rev-parse", "refs/heads/trunk"]), tip);
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), tip);
    assert_eq!(fs::read_to_string(f.main.join("c")).unwrap(), "ahead\n");
    assert_eq!(
        git(&f.main, &["status", "--porcelain", "--untracked-files=no"]),
        ""
    );
}

#[test]
fn catch_up_answers_busy_while_the_main_checkout_is_held() {
    use fgos_holder_lock::{LockScope, Wait};
    let f = Fixture::new();
    let tip = commit_ahead(&f, "ahead", "c");
    git(&f.main, &["update-ref", "refs/remotes/origin/trunk", &tip]);
    let mut holder = LockScope::seeded(vec![]).unwrap();
    let params = std::collections::BTreeMap::from([(
        "fgosDir".to_string(),
        f.main.join(".fgos").to_string_lossy().into_owned(),
    )]);
    holder
        .acquire("main-checkout", &params, Wait::Ms(0))
        .unwrap();
    let busy = catch_up(&f, &f.request.target, "held").unwrap_err();
    assert_eq!(busy.cause, "main-checkout-busy");
    assert!(busy.retryable, "a held main checkout is retryable");
    drop(holder);
    catch_up(&f, &f.request.target, "released").unwrap();
    assert_eq!(git(&f.main, &["rev-parse", "refs/heads/trunk"]), tip);
}

#[test]
fn catch_up_refuses_a_non_fast_forward_move() {
    let f = Fixture::new();
    // Trunk and the tracking tip diverge from the same base.
    fs::write(f.main.join("d"), "local\n").unwrap();
    git(&f.main, &["commit", "-qam", "local"]);
    let local = git(&f.main, &["rev-parse", "HEAD"]);
    git(
        &f.main,
        &["update-ref", "refs/remotes/origin/trunk", &f.request.source],
    );
    let error = catch_up(&f, &local, "non-ff").unwrap_err();
    assert_eq!(error.cause, "not-fast-forward");
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), local);
}

#[test]
fn catch_up_refuses_a_dirty_path_the_move_changes() {
    let f = Fixture::new();
    let tip = commit_ahead(&f, "ahead", "c");
    git(&f.main, &["update-ref", "refs/remotes/origin/trunk", &tip]);
    fs::write(f.main.join("c"), "local edit\n").unwrap();
    let error = catch_up(&f, &f.request.target, "dirty").unwrap_err();
    assert_eq!(error.cause, "main-checkout-dirty-overlap");
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), f.request.target);
    assert_eq!(
        fs::read_to_string(f.main.join("c")).unwrap(),
        "local edit\n"
    );
}

#[test]
fn catch_up_refuses_while_a_land_chain_is_active_on_the_ref() {
    let f = Fixture::new();
    let tip = commit_ahead(&f, "ahead", "c");
    git(&f.main, &["update-ref", "refs/remotes/origin/trunk", &tip]);
    let s = prepare(&f, "live-land");
    let error = catch_up(&f, &f.request.target, "during-land").unwrap_err();
    assert_eq!(error.cause, "resource-recovery-required");
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), f.request.target);
    drop(s);
}

#[test]
fn catch_up_refuses_a_stale_expected_old() {
    let f = Fixture::new();
    let tip = commit_ahead(&f, "ahead", "c");
    git(&f.main, &["update-ref", "refs/remotes/origin/trunk", &tip]);
    // The caller believes trunk is still at the source tip, but it is at the base.
    let error = catch_up(&f, &f.request.source, "stale").unwrap_err();
    assert_eq!(error.cause, "compare-and-swap-stale");
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), f.request.target);
}

#[test]
fn catch_up_interrupted_after_its_cas_is_finished_by_the_recovery_door() {
    let f = Fixture::new();
    let tip = commit_ahead(&f, "ahead", "c");
    git(&f.main, &["update-ref", "refs/remotes/origin/trunk", &tip]);
    catch_up_with(
        &f,
        &f.request.target,
        "cut",
        &StopAt("catch-up-before-read-tree"),
    )
    .unwrap_err();
    assert_eq!(git(&f.main, &["rev-parse", "refs/heads/trunk"]), tip);
    assert_eq!(fs::read_to_string(f.main.join("c")).unwrap(), "base\n");
    let recovered = recover(&f);
    assert_eq!(
        recovered["recovered"],
        serde_json::json!(["cut"]),
        "{recovered}"
    );
    assert_eq!(fs::read_to_string(f.main.join("c")).unwrap(), "ahead\n");
    assert_eq!(
        git(&f.main, &["status", "--porcelain", "--untracked-files=no"]),
        ""
    );
    // The settled chain no longer blocks the ref: the next catch-up moves it on.
    let later = commit_ahead(&f, "later", "d");
    git(
        &f.main,
        &["update-ref", "refs/remotes/origin/trunk", &later],
    );
    catch_up(&f, &tip, "after-cut").unwrap();
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), later);
}

#[test]
fn catch_up_interrupted_before_its_cas_settles_as_not_moved_and_a_retry_succeeds() {
    let f = Fixture::new();
    let tip = commit_ahead(&f, "ahead", "c");
    git(&f.main, &["update-ref", "refs/remotes/origin/trunk", &tip]);
    catch_up_with(&f, &f.request.target, "cut", &StopAt("catch-up-before-cas")).unwrap_err();
    assert_eq!(recover(&f)["recovered"], serde_json::json!(["cut"]));
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), f.request.target);
    catch_up(&f, &f.request.target, "retry").unwrap();
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), tip);
}

/// Moves the remote-tracking ref at one production boundary, as a fetch landing there would.
struct FetchAt {
    step: &'static str,
    main: PathBuf,
    moved_to: String,
}
impl wal::FileSystem for FetchAt {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        if step == self.step {
            git(
                &self.main,
                &["update-ref", "refs/remotes/origin/trunk", &self.moved_to],
            );
        }
        Ok(())
    }
}

#[test]
fn catch_up_ignores_a_remote_tracking_ref_moved_after_the_swap() {
    let f = Fixture::new();
    let tip = commit_ahead(&f, "ahead", "c");
    let newer = commit_ahead(&f, "newer", "d");
    git(&f.main, &["update-ref", "refs/remotes/origin/trunk", &tip]);
    let fetch = FetchAt {
        step: "catch-up-before-read-tree",
        main: f.main.clone(),
        moved_to: newer.clone(),
    };
    catch_up_with(&f, &f.request.target, "cut", &fetch).unwrap();
    assert_eq!(git(&f.main, &["rev-parse", "refs/heads/trunk"]), tip);
    assert_eq!(
        git(&f.main, &["rev-parse", "refs/remotes/origin/trunk"]),
        newer
    );
}

#[test]
fn recovery_deletes_the_temporary_push_branch_a_crash_after_the_push_left() {
    let f = Fixture::new();
    let (grant, bare) = remote(&f);
    let s = prepare(&f, "cut");
    let err = f
        .driver
        .push_land_candidate(
            &f.repo,
            &s,
            &grant,
            &name("refs/heads/trunk"),
            "fixture",
            &StopAt("land-push-after-transfer"),
        )
        .unwrap_err();
    let _ = (err, bare);
    let temp = "refs/heads/fgos-land-push-cut";
    assert!(!git(&f.main, &["for-each-ref", temp]).is_empty());
    drop(s);
    let recovered = recover(&f);
    assert_eq!(
        recovered["recovered"],
        serde_json::json!(["cut"]),
        "{recovered}"
    );
    assert_eq!(git(&f.main, &["for-each-ref", temp]), "");
}

#[test]
fn recovery_keeps_a_push_branch_that_points_at_another_commit_and_still_settles() {
    let f = Fixture::new();
    let (grant, _bare) = remote(&f);
    let s = prepare(&f, "cut");
    f.driver
        .push_land_candidate(
            &f.repo,
            &s,
            &grant,
            &name("refs/heads/trunk"),
            "fixture",
            &StopAt("land-push-after-transfer"),
        )
        .unwrap_err();
    let temp = "refs/heads/fgos-land-push-cut";
    git(&f.main, &["update-ref", temp, &f.request.target]);
    drop(s);
    let recovered = recover(&f);
    assert_eq!(
        recovered["recovered"],
        serde_json::json!(["cut"]),
        "{recovered}"
    );
    assert_eq!(git(&f.main, &["rev-parse", temp]), f.request.target);
}

#[test]
fn an_unpublished_commit_is_undone_with_its_bytes_kept_and_refused_once_the_branch_moved() {
    let f = Fixture::new();
    let parent = git(&f.main, &["rev-parse", "HEAD"]);
    fs::write(f.main.join("a"), "written\n").unwrap();
    git(&f.main, &["commit", "-qam", "unpublished"]);
    let commit = git(&f.main, &["rev-parse", "HEAD"]);
    let undo = |commit: &str, parent: &str| {
        f.driver.undo_unpublished_commit(
            &f.repo,
            vec![],
            &name("refs/heads/trunk"),
            &oid(&f, commit),
            &oid(&f, parent),
        )
    };
    // A tip that is not the named commit is refused and touches nothing.
    let refused = undo(&parent, &parent).unwrap_err();
    assert_eq!(refused.cause, "undo-commit-refused: branch-moved");
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), commit);
    undo(&commit, &parent).unwrap();
    assert_eq!(git(&f.main, &["rev-parse", "HEAD"]), parent);
    assert_eq!(fs::read_to_string(f.main.join("a")).unwrap(), "written\n");
    assert_eq!(git(&f.main, &["status", "--porcelain", "--", "a"]), "M a");
}
