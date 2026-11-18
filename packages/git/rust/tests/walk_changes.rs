#![cfg(target_os = "linux")]
//! `walk_changes`, the history read door, on real repositories.
use fgos_git::*;
use std::{fs, path::Path, process::Command};

fn git(root: &Path, args: &[&str]) -> String {
    let o = Command::new("git")
        .arg("-C")
        .arg(root)
        .args(args)
        .env("GIT_COMMITTER_NAME", "Fixture")
        .env("GIT_AUTHOR_NAME", "Fixture")
        .env("GIT_COMMITTER_EMAIL", "fixture@example.invalid")
        .env("GIT_AUTHOR_EMAIL", "fixture@example.invalid")
        .output()
        .unwrap();
    assert!(o.status.success(), "{args:?}: {o:?}");
    String::from_utf8(o.stdout).unwrap().trim().into()
}

/// Commits `files` at committer time `at` (seconds); returns the commit id.
fn commit(root: &Path, files: &[(&str, &str)], at: i64) -> String {
    for (path, body) in files {
        let full = root.join(path);
        fs::create_dir_all(full.parent().unwrap()).unwrap();
        fs::write(full, body).unwrap();
    }
    git(root, &["add", "."]);
    let date = format!("{at} +0000");
    let o = Command::new("git")
        .arg("-C")
        .arg(root)
        .args(["commit", "-qm", "step"])
        .env("GIT_COMMITTER_NAME", "Fixture")
        .env("GIT_AUTHOR_NAME", "Fixture")
        .env("GIT_COMMITTER_EMAIL", "fixture@example.invalid")
        .env("GIT_AUTHOR_EMAIL", "fixture@example.invalid")
        .env("GIT_COMMITTER_DATE", &date)
        .env("GIT_AUTHOR_DATE", &date)
        .output()
        .unwrap();
    assert!(o.status.success(), "{o:?}");
    git(root, &["rev-parse", "HEAD"])
}

struct Fixture {
    root: std::path::PathBuf,
    driver: GitDriver,
    repo: RepoHandle,
}

fn fixture(name: &str) -> Fixture {
    use std::os::unix::fs::PermissionsExt;
    let root =
        std::env::temp_dir().join(format!("fgos-walk-changes-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    fs::create_dir(&root).unwrap();
    fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
    git(&root, &["init", "-q", "--initial-branch=main", "repo"]);
    let path = root.join("repo");
    let driver = GitDriver::new(&root).unwrap();
    let repo = match driver.resolve_repo(&path, &path).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!("not a repository"),
    };
    Fixture {
        root: path,
        driver,
        repo,
    }
}

impl Fixture {
    fn oid(&self, text: &str) -> Oid {
        Oid::parse(text, self.repo.object_format()).unwrap()
    }
    fn walk(&self, tips: &[Oid], paths: &[&str]) -> ChangedCommits {
        self.driver
            .walk_changes(&self.repo, &request(tips, paths))
            .unwrap()
    }
}

fn request<'a>(tips: &'a [Oid], paths: &'a [&'a str]) -> WalkChanges<'a> {
    WalkChanges {
        tips,
        first_parent: false,
        since: None,
        paths,
        renames: false,
        max_commits: 1000,
        max_bytes: 1024 * 1024,
    }
}

fn oids(found: &ChangedCommits) -> Vec<&str> {
    found.commits.iter().map(|c| c.oid.as_str()).collect()
}

const T0: i64 = 1_700_000_000;

#[test]
fn a_path_set_limits_the_commits_to_those_that_changed_it() {
    let f = fixture("paths");
    let a = commit(&f.root, &[("plans/a/plan.md", "1"), ("src/x", "1")], T0);
    let _b = commit(&f.root, &[("src/x", "2")], T0 + 10);
    let c = commit(
        &f.root,
        &[("plans/a/plan.md", "2"), ("src/x", "3")],
        T0 + 20,
    );
    let tip = f.oid(&c);
    let found = f.walk(&[tip], &["plans"]);
    assert_eq!(
        oids(&found),
        [c.as_str(), a.as_str()],
        "newest first, src-only commit absent"
    );
    assert!(!found.truncated);
    let newest = &found.commits[0];
    assert_eq!(
        newest.parent.as_ref().unwrap().as_str(),
        git(&f.root, &["rev-parse", "HEAD~1"])
    );
    assert_eq!(newest.commit_time, T0 + 20);
    assert_eq!(newest.author_time, T0 + 20);
    assert_eq!(
        newest.changes,
        [PathChange {
            path: b"plans/a/plan.md".to_vec(),
            status: b'M',
            from: None
        }],
        "only the changes inside the path set"
    );
}

#[test]
fn since_excludes_older_commits_by_instant_and_by_commit() {
    let f = fixture("since");
    let a = commit(&f.root, &[("plans/p", "1")], T0);
    let b = commit(&f.root, &[("plans/p", "2")], T0 + 100);
    let c = commit(&f.root, &[("plans/p", "3")], T0 + 200);
    let tip = f.oid(&c);
    let mut req = request(std::slice::from_ref(&tip), &["plans"]);
    req.since = Some(Since::Instant(T0 + 100));
    let found = f.driver.walk_changes(&f.repo, &req).unwrap();
    assert_eq!(
        oids(&found),
        [c.as_str(), b.as_str()],
        "the instant itself is inside"
    );
    req.since = Some(Since::Commit(f.oid(&b)));
    let found = f.driver.walk_changes(&f.repo, &req).unwrap();
    assert_eq!(
        oids(&found),
        [c.as_str()],
        "the commit itself and its history are out"
    );
    let _ = a;
}

#[test]
fn first_parent_skips_side_branch_commits_and_reports_the_merge_against_its_first_parent() {
    let f = fixture("first-parent");
    let base = commit(&f.root, &[("plans/x", "1")], T0);
    git(&f.root, &["checkout", "-q", "-b", "side"]);
    let side = commit(&f.root, &[("plans/s", "1")], T0 + 10);
    git(&f.root, &["checkout", "-q", "main"]);
    let main = commit(&f.root, &[("plans/m", "1")], T0 + 20);
    git(&f.root, &["merge", "-q", "--no-ff", "side", "-m", "merge"]);
    let merge = git(&f.root, &["rev-parse", "HEAD"]);
    let tip = f.oid(&merge);

    let mut req = request(std::slice::from_ref(&tip), &["plans"]);
    req.first_parent = true;
    let first = f.driver.walk_changes(&f.repo, &req).unwrap();
    assert_eq!(oids(&first), [merge.as_str(), main.as_str(), base.as_str()]);
    assert_eq!(
        first.commits[0].changes,
        [PathChange {
            path: b"plans/s".to_vec(),
            status: b'A',
            from: None
        }],
        "the merge shows what it brought in against its first parent"
    );

    let all = f.walk(&[tip], &["plans"]);
    assert!(
        oids(&all).contains(&side.as_str()),
        "all-reachable walks the side branch"
    );
    assert!(
        !oids(&all).contains(&merge.as_str()),
        "a merge reports no change of its own when every parent is walked"
    );
}

#[test]
fn a_rename_reports_its_source_and_both_paths_appear_without_the_option() {
    let f = fixture("rename");
    let body = "a body long enough to be recognised as the same file after the move\n".repeat(8);
    commit(&f.root, &[("plans/old/plan.md", body.as_str())], T0);
    git(&f.root, &["mv", "plans/old", "plans/new"]);
    git(&f.root, &["commit", "-qm", "move"]);
    let tip = f.oid(&git(&f.root, &["rev-parse", "HEAD"]));

    let mut req = request(std::slice::from_ref(&tip), &["plans"]);
    req.renames = true;
    let found = f.driver.walk_changes(&f.repo, &req).unwrap();
    assert_eq!(
        found.commits[0].changes,
        [PathChange {
            path: b"plans/new/plan.md".to_vec(),
            status: b'R',
            from: Some(b"plans/old/plan.md".to_vec())
        }]
    );

    req.renames = false;
    let found = f.driver.walk_changes(&f.repo, &req).unwrap();
    let mut changes: Vec<(&[u8], u8)> = found.commits[0]
        .changes
        .iter()
        .map(|c| (c.path.as_slice(), c.status))
        .collect();
    changes.sort();
    assert_eq!(
        changes,
        [
            (&b"plans/new/plan.md"[..], b'A'),
            (&b"plans/old/plan.md"[..], b'D')
        ]
    );
}

#[test]
fn the_root_commit_is_included_with_no_parent() {
    let f = fixture("root");
    let root = commit(&f.root, &[("plans/p", "1")], T0);
    let found = f.walk(&[f.oid(&root)], &["plans"]);
    assert_eq!(oids(&found), [root.as_str()]);
    assert!(found.commits[0].parent.is_none());
    assert_eq!(found.commits[0].changes[0].status, b'A');
}

#[test]
fn the_commit_bound_keeps_the_newest_and_says_it_cut_the_walk() {
    let f = fixture("commit-bound");
    commit(&f.root, &[("plans/p", "1")], T0);
    let b = commit(&f.root, &[("plans/p", "2")], T0 + 10);
    let tip = f.oid(&b);
    let mut req = request(std::slice::from_ref(&tip), &["plans"]);
    req.max_commits = 1;
    let found = f.driver.walk_changes(&f.repo, &req).unwrap();
    assert_eq!(oids(&found), [b.as_str()]);
    assert!(found.truncated);
}

#[test]
fn an_output_bound_is_a_named_error() {
    let f = fixture("output-bound");
    let files: Vec<(String, String)> = (0..40)
        .map(|i| (format!("plans/file-{i:03}"), "x".into()))
        .collect();
    let refs: Vec<(&str, &str)> = files
        .iter()
        .map(|(p, b)| (p.as_str(), b.as_str()))
        .collect();
    let c = commit(&f.root, &refs, T0);
    let tip = f.oid(&c);
    let mut req = request(std::slice::from_ref(&tip), &["plans"]);
    req.max_bytes = 256;
    let error = f.driver.walk_changes(&f.repo, &req).unwrap_err();
    assert_eq!(error.cause, "walk-changes-output-bound");
}

#[test]
fn a_path_that_is_not_a_canonical_literal_is_refused() {
    let f = fixture("bad-path");
    let c = commit(&f.root, &[("plans/p", "1")], T0);
    let tip = f.oid(&c);
    for bad in ["../x", "", "plans/../x"] {
        let paths = [bad];
        let error = f
            .driver
            .walk_changes(&f.repo, &request(std::slice::from_ref(&tip), &paths))
            .unwrap_err();
        assert_eq!(error.cause, "invalid-literal-path", "{bad:?}");
    }
}

#[test]
fn a_merge_header_counts_against_the_commit_bound_so_a_cut_walk_is_never_called_complete() {
    let f = fixture("bound-merge");
    commit(&f.root, &[("plans/p", "1")], T0);
    git(&f.root, &["checkout", "-q", "-b", "side"]);
    commit(&f.root, &[("plans/s", "1")], T0 + 10);
    git(&f.root, &["checkout", "-q", "main"]);
    commit(&f.root, &[("plans/m", "1")], T0 + 20);
    git(&f.root, &["merge", "-q", "--no-ff", "side", "-m", "merge"]);
    let b = commit(&f.root, &[("plans/p", "2")], T0 + 40);
    let tip = f.oid(&b);
    let mut req = request(std::slice::from_ref(&tip), &["plans"]);
    req.max_commits = 2;
    let found = f.driver.walk_changes(&f.repo, &req).unwrap();
    assert!(found.truncated, "older matching commits remain");
    assert!(found.commits.len() <= 2);
    req.max_commits = 1000;
    let all = f.driver.walk_changes(&f.repo, &req).unwrap();
    assert!(!all.truncated);
}

#[test]
fn an_older_commit_behind_a_newer_one_with_a_skewed_date_is_still_found_by_instant() {
    let f = fixture("skew");
    let old = commit(&f.root, &[("plans/p", "1")], T0 + 1000);
    commit(&f.root, &[("other/o", "1")], T0 - 10_000_000);
    let new = commit(&f.root, &[("plans/p", "2")], T0 + 2000);
    let tip = f.oid(&new);
    let mut req = request(std::slice::from_ref(&tip), &["plans"]);
    req.since = Some(Since::Instant(T0 + 500));
    let found = f.driver.walk_changes(&f.repo, &req).unwrap();
    assert_eq!(oids(&found), [new.as_str(), old.as_str()]);
}
