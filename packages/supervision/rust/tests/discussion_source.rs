//! The discussion status source over real fixture repositories: one behaviour per test.
#![cfg(target_os = "linux")]
use fgos_observe::record::types::{AttrValue, Record};
use fgos_observe::Window;
use fgos_supervision::discussion_source::{DiscussionSource, GitDiscussionHistory};
use std::{
    fs,
    os::unix::fs::PermissionsExt,
    path::{Path, PathBuf},
    process::Command,
};

fn git(dir: &Path, args: &[&str], date: Option<&str>) -> String {
    let mut cmd = Command::new("git");
    cmd.arg("-C").arg(dir).args(args);
    if let Some(date) = date {
        cmd.env("GIT_COMMITTER_DATE", date)
            .env("GIT_AUTHOR_DATE", date);
    }
    let out = cmd.output().unwrap();
    assert!(out.status.success(), "{args:?}: {out:?}");
    String::from_utf8(out.stdout).unwrap().trim().to_owned()
}

struct Fixture {
    base: PathBuf,
}

impl Fixture {
    fn new(name: &str) -> Self {
        let base = std::env::temp_dir().join(format!("fgos-p14-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(base.join("state")).unwrap();
        for dir in [&base, &base.join("state")] {
            fs::set_permissions(dir, fs::Permissions::from_mode(0o700)).unwrap();
        }
        Self { base }
    }

    fn init(&self, name: &str) -> PathBuf {
        let path = self.base.join(name);
        git(
            &self.base,
            &["init", "-q", "--initial-branch=main", name],
            None,
        );
        self.identify(&path);
        git(
            &path,
            &["commit", "-q", "--allow-empty", "-m", "root"],
            Some("2026-11-01T00:00:00Z"),
        );
        remote_default(&path);
        path
    }

    fn identify(&self, path: &Path) {
        git(path, &["config", "user.name", "Fixture"], None);
        git(
            path,
            &["config", "user.email", "fixture@example.invalid"],
            None,
        );
    }

    fn source(&self, repo: &Path) -> DiscussionSource<GitDiscussionHistory> {
        let history = GitDiscussionHistory::open(repo, Some(self.base.join("state")))
            .unwrap()
            .expect("fixture is a repository");
        DiscussionSource::new(history)
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.base);
    }
}

/// A fetched `origin/main` named by `origin/HEAD`: the Git door's remote-default trunk.
fn remote_default(repo: &Path) {
    git(
        repo,
        &["update-ref", "refs/remotes/origin/main", "HEAD"],
        None,
    );
    git(
        repo,
        &[
            "symbolic-ref",
            "refs/remotes/origin/HEAD",
            "refs/remotes/origin/main",
        ],
        None,
    );
}

fn commit_file(repo: &Path, path: &str, text: &str, date: &str) {
    let full = repo.join(path);
    fs::create_dir_all(full.parent().unwrap()).unwrap();
    fs::write(full, text).unwrap();
    git(repo, &["add", "."], None);
    git(repo, &["commit", "-q", "-m", path], Some(date));
}

fn attr(record: &Record, key: &str) -> String {
    match &record.attrs[key] {
        AttrValue::Str(s) => s.clone(),
        other => panic!("{other:?}"),
    }
}

fn flips(records: &[Record]) -> Vec<(String, String, String)> {
    records
        .iter()
        .map(|r| {
            (
                attr(r, "fgos.discussion.path"),
                attr(r, "fgos.discussion.from"),
                attr(r, "fgos.discussion.to"),
            )
        })
        .collect()
}

const D1: &str = "docs/discussions/d1/DISCUSSION.md";

#[test]
fn draft_then_settled_gives_two_flips_from_none() {
    let f = Fixture::new("flip");
    let repo = f.init("repo");
    commit_file(
        &repo,
        D1,
        "# d1\n\ndiscussion: draft\n",
        "2026-11-02T00:00:00Z",
    );
    commit_file(
        &repo,
        D1,
        "# d1\n\ndiscussion: settled\n",
        "2026-11-03T00:00:00Z",
    );
    let records = f.source(&repo).records(&Window::default()).unwrap();
    assert_eq!(
        flips(&records),
        [
            (D1.into(), "none".into(), "draft".into()),
            (D1.into(), "draft".into(), "settled".into())
        ]
    );
    assert_eq!(records[0].subject.kind, "discussion");
    assert_eq!(records[0].subject.id, "d1");
    assert_eq!(records[1].ts, "2026-11-03T00:00:00.000Z");
}

#[test]
fn an_edit_that_leaves_the_marker_alone_gives_no_record() {
    let f = Fixture::new("edit");
    let repo = f.init("repo");
    commit_file(
        &repo,
        D1,
        "discussion: draft\nbody\n",
        "2026-11-02T00:00:00Z",
    );
    commit_file(
        &repo,
        D1,
        "discussion: draft\nbody changed\n",
        "2026-11-03T00:00:00Z",
    );
    commit_file(&repo, D1, "body without a marker\n", "2026-11-04T00:00:00Z");
    let records = f.source(&repo).records(&Window::default()).unwrap();
    assert_eq!(
        flips(&records),
        [(D1.into(), "none".into(), "draft".into())]
    );
}

#[test]
fn a_side_branch_not_merged_to_main_gives_no_record() {
    let f = Fixture::new("side");
    let repo = f.init("repo");
    commit_file(&repo, D1, "discussion: draft\n", "2026-11-02T00:00:00Z");
    git(&repo, &["checkout", "-q", "-b", "side"], None);
    commit_file(&repo, D1, "discussion: settled\n", "2026-11-03T00:00:00Z");
    git(&repo, &["checkout", "-q", "main"], None);
    let records = f.source(&repo).records(&Window::default()).unwrap();
    assert_eq!(
        flips(&records),
        [(D1.into(), "none".into(), "draft".into())]
    );
}

#[test]
fn a_checked_out_side_branch_is_never_read_as_the_trunk_when_no_remote_head_names_one() {
    let f = Fixture::new("side-checked-out");
    let repo = f.init("repo");
    git(
        &repo,
        &["symbolic-ref", "--delete", "refs/remotes/origin/HEAD"],
        None,
    );
    commit_file(&repo, D1, "discussion: draft\n", "2026-11-02T00:00:00Z");
    git(&repo, &["checkout", "-q", "-b", "side"], None);
    commit_file(&repo, D1, "discussion: settled\n", "2026-11-03T00:00:00Z");
    // The Git door can only name the attached side branch: that trunk is not trusted, so nothing is emitted.
    let records = f.source(&repo).records(&Window::default()).unwrap();
    assert_eq!(flips(&records), []);
}

#[test]
fn both_marker_sites_are_read() {
    let f = Fixture::new("sites");
    let repo = f.init("repo");
    commit_file(&repo, D1, "discussion: draft\n", "2026-11-02T00:00:00Z");
    let report = "plans/reports/shaping-261118-1045-topic.md";
    commit_file(
        &repo,
        report,
        "# r\n\ndiscussion: settled\n",
        "2026-11-03T00:00:00Z",
    );
    commit_file(
        &repo,
        "plans/reports/other.md",
        "discussion: settled\n",
        "2026-11-04T00:00:00Z",
    );
    let records = f.source(&repo).records(&Window::default()).unwrap();
    assert_eq!(
        flips(&records),
        [
            (D1.into(), "none".into(), "draft".into()),
            (report.into(), "none".into(), "settled".into())
        ]
    );
    assert_eq!(records[1].subject.id, "shaping-261118-1045-topic");
}

#[test]
fn a_replay_gives_the_same_ids_and_the_window_filters_by_time() {
    let f = Fixture::new("replay");
    let repo = f.init("repo");
    commit_file(&repo, D1, "discussion: draft\n", "2026-11-02T00:00:00Z");
    commit_file(&repo, D1, "discussion: settled\n", "2026-11-03T00:00:00Z");
    let source = f.source(&repo);
    let ids = |records: Vec<Record>| records.into_iter().map(|r| r.id).collect::<Vec<_>>();
    let first = ids(source.records(&Window::default()).unwrap());
    assert_eq!(first.len(), 2);
    assert_eq!(first, ids(source.records(&Window::default()).unwrap()));
    let late = Window {
        since: Some("2026-11-02T12:00:00Z".into()),
        until: None,
    };
    let windowed = source.records(&late).unwrap();
    assert_eq!(
        flips(&windowed),
        [(D1.into(), "draft".into(), "settled".into())]
    );
}

#[test]
fn a_flip_pushed_from_another_clone_is_read_through_the_remote_tracking_ref() {
    let f = Fixture::new("remote");
    let seed = f.init("seed");
    commit_file(&seed, D1, "discussion: draft\n", "2026-11-02T00:00:00Z");
    git(
        &f.base,
        &["clone", "-q", "--bare", "seed", "origin.git"],
        None,
    );
    git(&f.base, &["clone", "-q", "origin.git", "watched"], None);
    git(&f.base, &["clone", "-q", "origin.git", "other"], None);
    let (watched, other) = (f.base.join("watched"), f.base.join("other"));
    f.identify(&watched);
    f.identify(&other);
    commit_file(&other, D1, "discussion: settled\n", "2026-11-03T00:00:00Z");
    git(&other, &["push", "-q", "origin", "main"], None);
    git(&watched, &["fetch", "-q", "origin"], None);
    // Local main is still behind: only the remote-tracking ref carries the flip.
    assert_eq!(
        git(&watched, &["rev-parse", "main"], None),
        git(&watched, &["rev-parse", "origin/main~1"], None)
    );
    let records = f.source(&watched).records(&Window::default()).unwrap();
    assert_eq!(
        flips(&records),
        [
            (D1.into(), "none".into(), "draft".into()),
            (D1.into(), "draft".into(), "settled".into())
        ]
    );
}

const BODY: &str =
    "a body long enough for rename detection to match the two paths\nsecond line\nthird line\n";

#[test]
fn a_discussion_first_committed_in_the_root_commit_goes_from_none_to_its_state() {
    let f = Fixture::new("root");
    let repo = f.base.join("repo");
    git(
        &f.base,
        &["init", "-q", "--initial-branch=main", "repo"],
        None,
    );
    f.identify(&repo);
    let full = repo.join(D1);
    fs::create_dir_all(full.parent().unwrap()).unwrap();
    fs::write(full, "discussion: settled\n").unwrap();
    git(&repo, &["add", "."], None);
    git(
        &repo,
        &["commit", "-q", "-m", "root"],
        Some("2026-11-02T00:00:00Z"),
    );
    remote_default(&repo);
    let records = f.source(&repo).records(&Window::default()).unwrap();
    assert_eq!(
        flips(&records),
        [(D1.into(), "none".into(), "settled".into())]
    );
}

#[test]
fn a_rename_emits_nothing_and_carries_the_state_to_the_new_path() {
    let f = Fixture::new("rename");
    let repo = f.init("repo");
    commit_file(
        &repo,
        "docs/discussions/old/notes.md",
        &format!("discussion: settled\n{BODY}"),
        "2026-11-02T00:00:00Z",
    );
    git(
        &repo,
        &[
            "mv",
            "docs/discussions/old/notes.md",
            "docs/discussions/old/DISCUSSION.md",
        ],
        None,
    );
    git(
        &repo,
        &["commit", "-q", "-m", "rename"],
        Some("2026-11-03T00:00:00Z"),
    );
    let records = f.source(&repo).records(&Window::default()).unwrap();
    // The file was not a discussion path before: no record at all, and none for the move.
    assert_eq!(flips(&records), []);
    commit_file(
        &repo,
        "docs/discussions/old/DISCUSSION.md",
        &format!("discussion: settled\n{BODY}more\n"),
        "2026-11-04T00:00:00Z",
    );
    let records = f.source(&repo).records(&Window::default()).unwrap();
    assert_eq!(flips(&records), []);
}

#[test]
fn a_rename_that_edits_the_marker_emits_no_flip() {
    let f = Fixture::new("rename-edit");
    let repo = f.init("repo");
    let (old, new) = (D1, "docs/discussions/d2/DISCUSSION.md");
    commit_file(
        &repo,
        old,
        &format!("discussion: draft\n{BODY}"),
        "2026-11-02T00:00:00Z",
    );
    fs::create_dir_all(repo.join("docs/discussions/d2")).unwrap();
    git(&repo, &["mv", old, new], None);
    fs::write(repo.join(new), format!("discussion: settled\n{BODY}")).unwrap();
    git(&repo, &["add", "."], None);
    git(
        &repo,
        &["commit", "-q", "-m", "rename and settle"],
        Some("2026-11-03T00:00:00Z"),
    );
    commit_file(
        &repo,
        new,
        &format!("discussion: settled\n{BODY}edited\n"),
        "2026-11-04T00:00:00Z",
    );
    let records = f.source(&repo).records(&Window::default()).unwrap();
    assert_eq!(
        flips(&records),
        [(old.into(), "none".into(), "draft".into())]
    );
}
