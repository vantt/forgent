#![cfg(unix)]
//! The lifecycle of Work's checkouts (`fgw/<id>`) on real temporary repositories: create, claim, verify, remove,
//! reclaim and the leftovers listing.
mod common;
use common::{git, Fixture};
use fgos_checkout::{
    create_claim_worktree, create_dispatch_worktree, create_verify_checkout, create_worktree,
    list_leftovers, reclaim_orphaned_checkout, record, refresh_unstarted_branch,
    remove_dispatch_worktree, remove_worktree, Context, ErrorKind, WorkCreate, WorkRemove,
};
use std::fs;
use std::path::{Path, PathBuf};

fn ctx(f: &Fixture) -> Context {
    Context {
        repo_root: f.repo.clone(),
        state_root: f.state.clone(),
        writer: "fixture".into(),
    }
}

fn work(f: &Fixture, id: &str) -> WorkCreate {
    WorkCreate {
        ctx: ctx(f),
        id: id.into(),
        worktree_dir: Some(f.root.join("wt")),
        base_ref: None,
        start_sha: None,
        wait_ms: Some(0),
    }
}

fn removal(f: &Fixture, path: &Path) -> WorkRemove {
    WorkRemove {
        ctx: ctx(f),
        path: path.into(),
        delivered_to: None,
        retain_to: None,
    }
}

fn advance_trunk(f: &Fixture, text: &str) -> String {
    fs::write(f.repo.join("README"), text).unwrap();
    git(&f.repo, &["commit", "-qam", text.trim()]);
    git(&f.repo, &["rev-parse", "HEAD"])
}

#[test]
fn creating_a_work_checkout_forks_fgw_id_from_the_base_and_provisions_it() {
    let f = Fixture::new();
    let first = git(&f.repo, &["rev-parse", "HEAD"]);
    advance_trunk(&f, "two\n");
    let mut request = work(&f, "a1");
    request.start_sha = Some(first.clone());
    let created = create_worktree(&request).unwrap();
    assert_eq!(created.branch, "fgw/a1");
    assert!(!created.reused);
    assert!(created.refresh.is_none());
    assert_eq!(created.path, fs::canonicalize(&created.path).unwrap());
    assert_eq!(git(&created.path, &["rev-parse", "HEAD"]), first);
    assert_eq!(git(&created.path, &["branch", "--show-current"]), "fgw/a1");
    assert!(record::read(&f.state, &created.path).is_some());

    let mut request = work(&f, "a2");
    request.base_ref = Some("trunk".into());
    let based = create_dispatch_worktree(&request).unwrap();
    assert_eq!(
        git(&based.path, &["rev-parse", "HEAD"]),
        git(&f.repo, &["rev-parse", "HEAD"])
    );
}

#[test]
fn an_existing_clean_checkout_of_the_branch_is_moved_to_the_new_directory_never_destroyed() {
    let f = Fixture::new();
    let first = create_worktree(&work(&f, "a1")).unwrap();
    fs::write(first.path.join("kept"), "x").unwrap();
    git(&first.path, &["add", "kept"]);
    git(&first.path, &["commit", "-qm", "own work"]);
    let tip = git(&first.path, &["rev-parse", "HEAD"]);
    let second = create_worktree(&work(&f, "a1")).unwrap();
    assert!(second.reused);
    assert_ne!(second.path, first.path);
    assert!(!first.path.exists());
    assert!(f.registered(&second.path));
    assert_eq!(git(&second.path, &["rev-parse", "HEAD"]), tip);
}

#[test]
fn a_dirty_checkout_of_the_branch_is_never_moved_and_the_refusal_names_branch_and_path() {
    let f = Fixture::new();
    let first = create_worktree(&work(&f, "a1")).unwrap();
    fs::write(first.path.join("wip"), "unsaved").unwrap();
    let error = create_worktree(&work(&f, "a1")).unwrap_err();
    assert_eq!(error.kind, ErrorKind::Worktree);
    assert!(error.message.contains("has uncommitted changes"), "{error}");
    assert_eq!(error.details["branch"], "fgw/a1");
    assert_eq!(
        error.details["orphanPath"],
        first.path.display().to_string()
    );
    assert_eq!(
        fs::read_to_string(first.path.join("wip")).unwrap(),
        "unsaved"
    );
    assert_eq!(
        fs::read_dir(f.root.join("wt")).unwrap().count(),
        1,
        "the placeholder directory is gone"
    );
}

#[test]
fn a_worktree_admin_hold_another_holder_keeps_is_refused_as_lock_held_with_its_holders() {
    use fgos_holder_lock::{LockScope, Wait};
    let f = Fixture::new();
    let mut scope = LockScope::seeded(Vec::new()).unwrap();
    let params = std::collections::BTreeMap::from([(
        "fgosDir".to_owned(),
        f.repo.join(".fgos").to_string_lossy().into_owned(),
    )]);
    scope.acquire("worktree-admin", &params, Wait::Try).unwrap();
    let mut request = work(&f, "a1");
    request.wait_ms = Some(150);
    let error = create_worktree(&request).unwrap_err();
    assert_eq!(error.kind, ErrorKind::LockHeld, "{error}");
    assert_eq!(error.details["timedOut"], true);
    assert_eq!(error.details["lock"], "worktree-admin");
    assert!(
        error
            .message
            .contains("worktree admin is held by another process"),
        "{error}"
    );
    assert!(
        !f.root.join("wt").read_dir().unwrap().any(|_| true),
        "no placeholder directory is left"
    );
    drop(scope);
    assert!(create_worktree(&request).is_ok());
}

#[test]
fn a_failed_setup_removes_the_registered_checkout_and_reports_the_failing_command() {
    let f = Fixture::new();
    f.setup_commands(&["exit 3"]);
    let error = create_worktree(&work(&f, "a1")).unwrap_err();
    assert_eq!(error.kind, ErrorKind::Provision);
    assert_eq!(error.command.as_deref(), Some("exit 3"));
    assert!(
        git(&f.repo, &["worktree", "list", "--porcelain"])
            .lines()
            .filter(|l| l.starts_with("worktree "))
            .count()
            == 1
    );
    assert!(f.root.join("wt").read_dir().unwrap().next().is_none());
}

#[test]
fn a_claim_reattaches_to_its_standing_checkout_and_brings_it_to_the_branch_tip() {
    let f = Fixture::new();
    let first = create_claim_worktree(&work(&f, "a1")).unwrap();
    assert!(!first.reused);
    // The branch moves from outside the checkout, as a child merge does.
    let old = git(&f.repo, &["rev-parse", "fgw/a1"]);
    advance_trunk(&f, "two\n");
    let tree = git(&f.repo, &["rev-parse", "trunk^{tree}"]);
    let child = git(
        &f.repo,
        &["commit-tree", &tree, "-p", &old, "-m", "child merge"],
    );
    git(&f.repo, &["update-ref", "refs/heads/fgw/a1", &child, &old]);
    assert_eq!(
        fs::read_to_string(first.path.join("README")).unwrap(),
        "one\n"
    );
    let again = create_claim_worktree(&work(&f, "a1")).unwrap();
    assert!(again.reused);
    assert_eq!(again.path, first.path);
    assert_eq!(git(&first.path, &["rev-parse", "HEAD"]), child);
    assert_eq!(
        fs::read_to_string(first.path.join("README")).unwrap(),
        "two\n"
    );
    assert!(git(&first.path, &["status", "--porcelain"]).is_empty());
}

#[test]
fn a_claim_never_resets_a_behind_checkout_that_has_uncommitted_work() {
    let f = Fixture::new();
    let first = create_claim_worktree(&work(&f, "a1")).unwrap();
    let ahead = advance_trunk(&f, "two\n");
    git(
        &f.repo,
        &[
            "update-ref",
            "refs/heads/fgw/a1",
            &ahead,
            &git(&f.repo, &["rev-parse", "fgw/a1"]),
        ],
    );
    fs::write(first.path.join("wip"), "unsaved").unwrap();
    let error = create_claim_worktree(&work(&f, "a1")).unwrap_err();
    assert_eq!(error.kind, ErrorKind::Worktree);
    assert!(
        error
            .message
            .contains("never auto-reset over uncommitted work"),
        "{error}"
    );
    assert_eq!(error.details["branchTip"], ahead);
    assert_eq!(
        fs::read_to_string(first.path.join("wip")).unwrap(),
        "unsaved"
    );
}

#[test]
fn a_claim_moves_a_never_started_branch_onto_its_base_before_checking_it_out() {
    let f = Fixture::new();
    git(&f.repo, &["branch", "fgw/a1"]);
    let moved = advance_trunk(&f, "two\n");
    let mut request = work(&f, "a1");
    request.base_ref = Some("trunk".into());
    let created = create_claim_worktree(&request).unwrap();
    let refresh = created.refresh.expect("a refresh report");
    assert!(refresh.refreshed);
    assert_eq!(refresh.to.as_deref(), Some(moved.as_str()));
    assert_eq!(git(&created.path, &["rev-parse", "HEAD"]), moved);
}

#[test]
fn a_branch_with_commits_of_its_own_is_not_refreshed() {
    let f = Fixture::new();
    let own = create_worktree(&work(&f, "a1")).unwrap();
    git(&own.path, &["commit", "-q", "--allow-empty", "-m", "own"]);
    advance_trunk(&f, "two\n");
    let report = refresh_unstarted_branch(&ctx(&f), "fgw/a1", "trunk", None).unwrap();
    assert!(!report.refreshed);
    assert_eq!(report.reason, Some("own-commits"));
    assert_eq!((report.ahead, report.behind), (1, 1));
    let same = refresh_unstarted_branch(&ctx(&f), "trunk", "trunk", None).unwrap();
    assert_eq!(same.reason, Some("already-current"));
}

#[test]
fn a_verify_checkout_is_detached_at_the_commit_and_removal_takes_back_what_a_run_built_there() {
    let f = Fixture::new();
    let commit = git(&f.repo, &["rev-parse", "HEAD"]);
    let path = create_verify_checkout(&ctx(&f), &commit).unwrap();
    assert_eq!(git(&path, &["rev-parse", "HEAD"]), commit);
    assert_eq!(git(&path, &["branch", "--show-current"]), "");
    assert!(record::read(&f.state, &path).unwrap().disposable);
    fs::write(path.join("built.o"), "artifact").unwrap();
    remove_worktree(&removal(&f, &path)).unwrap();
    assert!(!path.exists());
    assert!(!f.registered(&path));
    assert!(record::read(&f.state, &path).is_none());
}

#[test]
fn removing_a_checkout_keeps_its_branch_and_returns_nothing_unless_a_head_was_retained() {
    let f = Fixture::new();
    let made = create_worktree(&work(&f, "a1")).unwrap();
    assert_eq!(remove_worktree(&removal(&f, &made.path)).unwrap(), None);
    assert!(!made.path.exists());
    assert!(!f.registered(&made.path));
    assert!(git(&f.repo, &["branch", "--list", "fgw/a1"]).contains("fgw/a1"));
}

#[test]
fn a_forced_session_head_is_pinned_before_cleanup_and_named_in_the_result() {
    let f = Fixture::new();
    let base = git(&f.repo, &["rev-parse", "HEAD"]);
    let made = create_worktree(&work(&f, "a1")).unwrap();
    git(
        &made.path,
        &["commit", "-q", "--allow-empty", "-m", "session work"],
    );
    let session_head = git(&made.path, &["rev-parse", "HEAD"]);
    let mut request = removal(&f, &made.path);
    request.retain_to = Some(base);
    request.delivered_to = Some("fgw/a1".into());
    let retained = remove_worktree(&request)
        .unwrap()
        .expect("retained evidence");
    assert!(retained
        .retained_ref
        .starts_with("refs/fgos/git-operations/"));
    assert!(retained.retained_ref.ends_with("/candidate"));
    assert_eq!(
        git(&f.repo, &["rev-parse", &retained.retained_ref]),
        session_head
    );
    assert!(!retained.snapshot.is_empty());
    assert!(!made.path.exists());
}

#[test]
fn a_checkout_whose_custody_a_live_writer_holds_is_refused_and_stays() {
    let f = Fixture::new();
    let made = create_worktree(&work(&f, "a1")).unwrap();
    let driver = fgos_git::GitDriver::new(&f.state).unwrap();
    let repo = match driver.resolve_repo(&made.path, &f.repo).unwrap() {
        fgos_git::ResolveRepo::Repository(repo) => repo,
        _ => panic!("not a repository"),
    };
    let lease = fgos_git::acquire_checkout_custody(&repo, &made.path).unwrap();
    let error = remove_worktree(&removal(&f, &made.path)).unwrap_err();
    assert_eq!(error.kind, ErrorKind::Worktree);
    assert!(
        error.message.contains("worktree custody is held"),
        "{error}"
    );
    assert!(
        error.message.starts_with("git worktree remove failed for"),
        "{error}"
    );
    assert_eq!(
        error.details["worktreePath"],
        made.path.display().to_string()
    );
    assert!(made.path.exists());
    drop(lease);
    remove_worktree(&removal(&f, &made.path)).unwrap();
}

#[test]
fn a_dispatch_cleanup_resets_what_a_failed_round_left_then_removes_and_never_fails() {
    let f = Fixture::new();
    let made = create_dispatch_worktree(&work(&f, "a1")).unwrap();
    fs::write(made.path.join("README"), "half done\n").unwrap();
    fs::write(made.path.join("debris"), "x").unwrap();
    let mut log: Vec<String> = Vec::new();
    remove_dispatch_worktree(&ctx(&f), &made.path, &mut |m| log.push(m.to_owned()));
    assert!(log.is_empty(), "{log:?}");
    assert!(!made.path.exists());

    let gone: PathBuf = f.root.join("never-was");
    remove_dispatch_worktree(&ctx(&f), &gone, &mut |m| log.push(m.to_owned()));
    assert_eq!(log.len(), 1);
    assert!(
        log[0].starts_with(&format!(
            "fgos-runner: worktree cleanup failed for \"{}\": ",
            gone.display()
        )),
        "{log:?}"
    );
}

#[test]
fn a_crash_orphan_checkout_is_reclaimed_but_never_a_dirty_one_or_the_callers_own() {
    let f = Fixture::new();
    let made = create_worktree(&work(&f, "a1")).unwrap();
    let elsewhere = f.root.clone();

    fs::write(made.path.join("wip"), "unsaved").unwrap();
    let dirty = reclaim_orphaned_checkout(&ctx(&f), "fgw/a1", &elsewhere).unwrap_err();
    assert!(dirty.message.contains("uncommitted changes"), "{dirty}");
    fs::remove_file(made.path.join("wip")).unwrap();

    let inside = reclaim_orphaned_checkout(&ctx(&f), "fgw/a1", &made.path).unwrap_err();
    assert!(
        inside
            .message
            .contains("calling session's own live checkout"),
        "{inside}"
    );
    assert!(made.path.exists());

    let done = reclaim_orphaned_checkout(&ctx(&f), "fgw/a1", &elsewhere).unwrap();
    assert!(done.reclaimed);
    assert_eq!(done.path.as_deref(), Some(made.path.as_path()));
    assert!(!made.path.exists());
    let none = reclaim_orphaned_checkout(&ctx(&f), "fgw/a1", &elsewhere).unwrap();
    assert!(!none.reclaimed && none.path.is_none());
}

#[test]
fn a_branch_checked_out_at_the_main_checkout_is_never_reclaimed() {
    let f = Fixture::new();
    let error = reclaim_orphaned_checkout(&ctx(&f), "trunk", &f.root).unwrap_err();
    assert!(
        error.message.contains("resolves to repoRoot itself"),
        "{error}"
    );
    assert!(f.repo.join("README").exists());
}

#[test]
fn leftovers_list_every_fgw_branch_with_its_commits_ahead_and_optionally_its_tip() {
    let f = Fixture::new();
    git(&f.repo, &["branch", "fgw/empty"]);
    let own = create_worktree(&work(&f, "busy")).unwrap();
    git(&own.path, &["commit", "-q", "--allow-empty", "-m", "own"]);
    git(&f.repo, &["branch", "other"]);
    let rows = list_leftovers(&ctx(&f), None, false).unwrap();
    let find = |name: &str| rows.iter().find(|r| r.branch == name).unwrap();
    assert_eq!(rows.len(), 2);
    assert_eq!(find("fgw/empty").ahead_count, 0);
    assert_eq!(find("fgw/busy").ahead_count, 1);
    assert!(find("fgw/busy").tip.is_none());
    let with_tip = list_leftovers(&ctx(&f), Some("trunk"), true).unwrap();
    assert_eq!(
        with_tip
            .iter()
            .find(|r| r.branch == "fgw/busy")
            .unwrap()
            .tip
            .as_deref(),
        Some(git(&f.repo, &["rev-parse", "fgw/busy"]).as_str())
    );
    let bad = list_leftovers(&ctx(&f), Some("no-such-base"), false).unwrap_err();
    assert_eq!(bad.kind, ErrorKind::Worktree);
    assert!(
        bad.message.starts_with("listing \"fgw/\" branches failed:"),
        "{bad}"
    );
}
