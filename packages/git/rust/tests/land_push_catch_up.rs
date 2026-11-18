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
    f.driver
        .push_land_candidate(&f.repo, s, grant, &name("refs/heads/trunk"), "fixture")
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
    f.driver.catch_up_main_checkout(
        &f.repo,
        vec![],
        &name("refs/heads/trunk"),
        &oid(f, old),
        &name("refs/remotes/origin/trunk"),
        "fixture",
        id,
    )
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
    assert_eq!(error.cause, "main-checkout-dirty-mid-merge");
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
