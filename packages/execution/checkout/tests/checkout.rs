#![cfg(unix)]
//! Create, provision, remove and resync on real temporary repositories.
mod common;
use common::{git, Fixture};
use fgos_checkout::{create, record, remove, resync, ErrorKind, Provision, ResyncRequest};
use std::fs;
use std::path::{Path, PathBuf};

fn record_of(f: &Fixture, path: &Path) -> Option<record::Record> {
    record::read(&f.state, path)
}

#[test]
fn a_branch_a_detached_head_and_a_literal_base_each_make_a_checkout() {
    let f = Fixture::new();
    git(&f.repo, &["branch", "other"]);
    fs::write(f.repo.join("README"), "two\n").unwrap();
    git(&f.repo, &["commit", "-qam", "second"]);
    let first = git(&f.repo, &["rev-parse", "other"]);

    let mut request = f.request("on-branch", Provision::None);
    request.branch = Some("feature/x".into());
    let created = create(&request).unwrap();
    assert_eq!(
        created.handle.branch.as_deref(),
        Some("refs/heads/feature/x")
    );
    assert!(f.registered(&created.handle.path));

    let detached = create(&f.request("detached", Provision::None)).unwrap();
    assert_eq!(detached.handle.branch, None);
    assert_eq!(
        git(&detached.handle.path, &["rev-parse", "HEAD"]),
        git(&f.repo, &["rev-parse", "HEAD"])
    );

    let mut request = f.request("based", Provision::None);
    request.base = Some("other".into());
    let based = create(&request).unwrap();
    assert_eq!(git(&based.handle.path, &["rev-parse", "HEAD"]), first);
}

#[test]
fn bare_makes_the_checkout_and_places_nothing() {
    let f = Fixture::new();
    f.setup_commands(&["touch ran"]);
    fs::create_dir_all(f.repo.join(".omp/skills/mine")).unwrap();
    fs::write(f.repo.join(".omp/skills/mine/a.txt"), "alpha\n").unwrap();
    let created = create(&f.request("bare", Provision::None)).unwrap();
    assert!(!created.provisioned);
    assert!(!created.handle.path.join("ran").exists());
    assert!(!created.handle.path.join(".omp").exists());
    assert!(record_of(&f, &created.handle.path).is_none());
    assert!(!f.state.join("worktree-provisioning").exists());
}

#[test]
fn provisioning_installs_copies_skills_runs_setup_with_the_main_root_and_records_it() {
    let f = Fixture::new();
    fs::create_dir_all(f.repo.join("local-dep")).unwrap();
    fs::write(
        f.repo.join("local-dep/package.json"),
        r#"{"name":"local-dep","version":"1.0.0"}"#,
    )
    .unwrap();
    fs::write(
        f.repo.join("package.json"),
        r#"{"name":"w","version":"1.0.0","dependencies":{"local-dep":"file:./local-dep"}}"#,
    )
    .unwrap();
    fs::write(f.repo.join(".gitignore"), ".fgos/\n.omp/\nnode_modules/\n").unwrap();
    git(&f.repo, &["add", "."]);
    git(&f.repo, &["commit", "-qm", "deps"]);
    fs::create_dir_all(f.repo.join(".omp/skills/mine")).unwrap();
    fs::write(f.repo.join(".omp/skills/mine/a.txt"), "alpha\n").unwrap();
    f.setup_commands(&["printf '%s' \"$FGOS_REPO_ROOT\" > setup-env"]);

    let created = create(&f.request("full", Provision::Full)).unwrap();
    let path = &created.handle.path;
    assert!(created.provisioned);
    assert!(
        path.join("node_modules").exists(),
        "npm installed the declared dependency"
    );
    assert_eq!(
        fs::read_to_string(path.join(".omp/skills/mine/a.txt")).unwrap(),
        "alpha\n"
    );
    assert_eq!(
        fs::read_to_string(path.join("setup-env")).unwrap(),
        f.repo.to_string_lossy()
    );
    let rec = record_of(&f, path).expect("record written");
    assert_eq!(rec.regenerable, vec!["node_modules".to_owned()]);
    let placed: Vec<&str> = rec.placed.iter().map(|p| p.path()).collect();
    assert!(placed.contains(&"setup-env") && placed.contains(&".omp/skills/mine/a.txt"));
    assert!(!placed.contains(&"node_modules"));
    assert_eq!(rec.worktree, record::realpath_or_self(path));
}

#[test]
fn a_failing_setup_command_fails_the_create_and_leaves_the_checkout_and_its_record() {
    let f = Fixture::new();
    f.setup_commands(&["echo boom >&2; exit 3"]);
    let error = create(&f.request("failing", Provision::Full)).unwrap_err();
    assert_eq!(error.kind, ErrorKind::Provision);
    assert!(
        error.message.contains("worktree setup command failed") && error.message.contains("boom"),
        "{error}"
    );
    assert_eq!(error.command.as_deref(), Some("echo boom >&2; exit 3"));
    let path = error.worktree_path.expect("the error names the checkout");
    assert!(path.exists() && f.registered(&path));
    assert!(
        record_of(&f, &path).is_some(),
        "a half provisioned checkout can still be removed"
    );
}

#[test]
fn no_git_lock_is_held_while_a_setup_command_runs() {
    let f = Fixture::new();
    let (started, gate) = (f.root.join("started"), f.root.join("gate"));
    f.setup_commands(&[&format!(
        "touch '{}'; while [ ! -e '{}' ]; do sleep 0.02; done; grep -q free '{}'",
        started.display(),
        gate.display(),
        gate.display()
    )]);
    let repo = f.repo.clone();
    let probe = std::thread::spawn({
        let (started, gate) = (started.clone(), gate.clone());
        move || {
            while !started.exists() {
                std::thread::sleep(std::time::Duration::from_millis(10));
            }
            let mut scope = fgos_holder_lock::LockScope::seeded(vec![]).unwrap();
            let params = std::collections::BTreeMap::from([(
                "fgosDir".to_owned(),
                repo.join(".fgos").to_string_lossy().into_owned(),
            )]);
            let free = scope
                .acquire("worktree-admin", &params, fgos_holder_lock::Wait::Try)
                .is_ok();
            drop(scope);
            fs::write(&gate, if free { "free" } else { "held" }).unwrap();
        }
    });
    create(&f.request("lockless", Provision::Full))
        .expect("the setup command saw the worktree-admin hold free");
    probe.join().unwrap();
}

#[test]
fn remove_sets_provisioned_bytes_aside_and_deletes_them_with_the_record() {
    let f = Fixture::new();
    f.setup_commands(&["echo made > marker"]);
    let created = create(&f.request("gone", Provision::Full)).unwrap();
    let path = created.handle.path.clone();
    assert!(path.join("marker").exists());
    let removed = remove(&f.remove_request(&path, false)).unwrap();
    assert_eq!(removed.path, path);
    assert_eq!(removed.delivered_to, git(&f.repo, &["rev-parse", "trunk"]));
    assert_eq!(
        removed.delivered_to_ref.as_deref(),
        Some("refs/heads/trunk")
    );
    assert_eq!(removed.evidence_digest.len(), 64);
    assert!(!path.exists() && !f.registered(&path));
    assert!(record_of(&f, &path).is_none());
    assert!(
        !f.state
            .join("worktree-provisioning")
            .read_dir()
            .unwrap()
            .any(|_| true),
        "record deleted"
    );
    let leftovers = fs::read_dir(&f.root)
        .unwrap()
        .filter_map(Result::ok)
        .filter(|e| e.file_name().to_string_lossy().contains("provisioned"));
    assert_eq!(leftovers.count(), 0, "the set-aside directory is gone");
}

#[test]
fn a_refused_remove_puts_the_set_aside_bytes_back_and_keeps_the_record() {
    let f = Fixture::new();
    f.setup_commands(&["echo made > marker"]);
    let created = create(&f.request("kept", Provision::Full)).unwrap();
    let path = created.handle.path.clone();
    fs::write(path.join("worker-scratch"), "mine\n").unwrap();
    let error = remove(&f.remove_request(&path, false)).unwrap_err();
    assert_eq!(error.kind, ErrorKind::Git);
    assert_eq!(
        fs::read_to_string(path.join("marker")).unwrap(),
        "made\n",
        "provisioned bytes are back"
    );
    assert!(path.join("worker-scratch").exists());
    assert!(record_of(&f, &path).is_some());
    fs::remove_file(path.join("worker-scratch")).unwrap();
    remove(&f.remove_request(&path, false))
        .expect("removes once the checkout's own bytes are clean");
}

#[test]
fn discard_ignored_deletes_ignored_bytes_after_the_other_checks_and_counts_them() {
    let f = Fixture::new();
    let created = create(&f.request("ignored", Provision::None)).unwrap();
    let path = created.handle.path.clone();
    fs::create_dir_all(path.join(".omp")).unwrap();
    fs::write(path.join(".omp/cache"), "12345").unwrap();
    assert_eq!(
        remove(&f.remove_request(&path, false)).unwrap_err().kind,
        ErrorKind::Git
    );
    let removed = remove(&f.remove_request(&path, true)).unwrap();
    assert_eq!((removed.discarded_files, removed.discarded_bytes), (1, 5));
    assert!(!path.exists());
}

#[test]
fn remove_refuses_an_unregistered_path_and_an_undeliverable_ref() {
    let f = Fixture::new();
    let stray = f.root.join("stray");
    fs::create_dir(&stray).unwrap();
    let error = remove(&f.remove_request(&stray, false)).unwrap_err();
    assert_eq!(error.kind, ErrorKind::Invalid);
    assert!(
        error.message.contains("is not a registered worktree"),
        "{error}"
    );
    let created = create(&f.request("tracked", Provision::None)).unwrap();
    let mut request = f.remove_request(&created.handle.path, false);
    request.delivered_to = "no-such-ref".into();
    let error = remove(&request).unwrap_err();
    assert!(
        error.message.contains("does not name an existing branch"),
        "{error}"
    );
}

#[test]
fn a_node_provisioned_checkouts_record_set_aside_exactly_what_it_names() {
    let f = Fixture::new();
    let created = create(&f.request("node-made", Provision::None)).unwrap();
    let path = created.handle.path.clone();
    fs::create_dir_all(path.join(".omp/skills/mine")).unwrap();
    fs::write(path.join(".omp/skills/mine/a.txt"), "alpha\n").unwrap();
    std::os::unix::fs::symlink("a.txt", path.join(".omp/skills/mine/link")).unwrap();
    // The committed record is what Node wrote; only the machine specific fields are made this checkout's.
    let node = include_str!("fixtures/node-provisioned-record.json");
    let (dev, ino) = record::stat_identity(&path).unwrap();
    let text = node
        .replace("/tmp/fx-0mM5vV/wt", &record::realpath_or_self(&path))
        .replace(
            "\"dev\": 147",
            &format!("\"dev\": {}", record::js_number_text(dev)),
        )
        .replace(
            "\"ino\": 496",
            &format!("\"ino\": {}", record::js_number_text(ino)),
        );
    assert!(
        record::read_text(&text, &path).is_some(),
        "a Node record for this directory is read"
    );
    let file = record::record_path(&f.state, &path);
    fs::create_dir_all(file.parent().unwrap()).unwrap();
    fs::write(&file, &text).unwrap();
    // Everything the record names is taken back, so the Git port sees a clean checkout and removes it.
    remove(&f.remove_request(&path, false)).expect("Node's record covers every placed byte");
    assert!(!path.exists() && !file.exists());
}

#[test]
fn a_record_left_by_another_directory_at_the_path_is_not_the_checkouts() {
    let f = Fixture::new();
    f.setup_commands(&["echo made > marker"]);
    let created = create(&f.request("reborn", Provision::Full)).unwrap();
    let path = created.handle.path.clone();
    let file = record::record_path(&f.state, &path);
    let mut text = fs::read_to_string(&file).unwrap();
    text = text.replacen("\"ino\": ", "\"ino\": 1", 1);
    fs::write(&file, text).unwrap();
    assert!(record_of(&f, &path).is_none());
}

#[test]
fn resync_moves_a_branch_checkout_to_the_new_tip_and_carries_staged_work() {
    let f = Fixture::new();
    let mut request = f.request("follower", Provision::None);
    request.branch = Some("follow".into());
    let created = create(&request).unwrap();
    let path = created.handle.path.clone();
    let resync_request = ResyncRequest {
        repo_root: f.repo.clone(),
        state_root: f.state.clone(),
        writer: "fixture".into(),
        worktree: path.clone(),
        branch: None,
    };
    assert_eq!(
        resync(&resync_request).unwrap().reason,
        Some("already-in-sync")
    );

    fs::write(f.repo.join("later"), "later\n").unwrap();
    git(&f.repo, &["add", "later"]);
    git(&f.repo, &["commit", "-qm", "later"]);
    git(&f.repo, &["update-ref", "refs/heads/follow", "trunk"]);
    fs::write(path.join("staged"), "staged\n").unwrap();
    git(&path, &["add", "staged"]);

    let done = resync(&resync_request).unwrap();
    assert!(done.resynced && done.reapplied, "{done:?}");
    assert_eq!(
        done.to.as_deref(),
        Some(git(&f.repo, &["rev-parse", "trunk"]).as_str())
    );
    assert_eq!(fs::read_to_string(path.join("later")).unwrap(), "later\n");
    assert_eq!(fs::read_to_string(path.join("staged")).unwrap(), "staged\n");
    assert!(git(&path, &["diff", "--cached", "--name-only"]).contains("staged"));
}

#[test]
fn resync_refuses_stray_changes_beyond_what_is_staged() {
    let f = Fixture::new();
    let mut request = f.request("stray", Provision::None);
    request.branch = Some("strayb".into());
    let path = create(&request).unwrap().handle.path;
    fs::write(f.repo.join("later"), "later\n").unwrap();
    git(&f.repo, &["add", "later"]);
    git(&f.repo, &["commit", "-qm", "later"]);
    git(&f.repo, &["update-ref", "refs/heads/strayb", "trunk"]);
    fs::write(path.join("untracked"), "x\n").unwrap();
    let error = resync(&ResyncRequest {
        repo_root: f.repo.clone(),
        state_root: f.state.clone(),
        writer: "fixture".into(),
        worktree: path,
        branch: Some("strayb".into()),
    })
    .unwrap_err();
    assert!(
        error
            .message
            .contains("stray uncommitted changes beyond what's staged"),
        "{error}"
    );
}

/// A branch checkout of `branch` created through the door, with the request that resyncs it.
fn followed(f: &Fixture, name: &str, branch: &str) -> (PathBuf, ResyncRequest) {
    let mut request = f.request(name, Provision::None);
    request.branch = Some(branch.into());
    let path = create(&request).unwrap().handle.path;
    let resync_request = ResyncRequest {
        repo_root: f.repo.clone(),
        state_root: f.state.clone(),
        writer: "fixture".into(),
        worktree: path.clone(),
        branch: Some(branch.into()),
    };
    (path, resync_request)
}

fn advance_branch(f: &Fixture, branch: &str, file: &str, text: &str) -> String {
    fs::write(f.repo.join(file), text).unwrap();
    git(&f.repo, &["add", file]);
    git(&f.repo, &["commit", "-qm", text.trim()]);
    git(
        &f.repo,
        &["update-ref", &format!("refs/heads/{branch}"), "trunk"],
    );
    git(&f.repo, &["rev-parse", "trunk"])
}

fn patch_dir(f: &Fixture) -> PathBuf {
    f.repo.join(".git/fgos-resync-patches")
}

#[test]
fn resync_refuses_a_branch_rewritten_to_history_that_does_not_contain_the_checkout() {
    let f = Fixture::new();
    let (path, request) = followed(&f, "diverged", "div");
    git(&path, &["commit", "-q", "--allow-empty", "-m", "decisions"]);
    let synced = git(&path, &["rev-parse", "HEAD"]);
    let base = git(&f.repo, &["rev-parse", "trunk"]);
    let tree = git(&f.repo, &["rev-parse", "trunk^{tree}"]);
    let sibling = git(
        &f.repo,
        &["commit-tree", &tree, "-p", &base, "-m", "sibling"],
    );
    git(
        &f.repo,
        &["update-ref", "refs/heads/div", &sibling, &synced],
    );
    let error = resync(&request).unwrap_err();
    assert!(error.message.contains("is not an ancestor"), "{error}");
    assert!(git(&path, &["status", "--porcelain"]).is_empty());
}

#[test]
fn resync_with_nothing_staged_resets_cleanly_to_the_new_tip() {
    let f = Fixture::new();
    let (path, request) = followed(&f, "plain", "plainb");
    let tip = advance_branch(&f, "plainb", "later", "later\n");
    let done = resync(&request).unwrap();
    assert!(done.resynced && !done.reapplied, "{done:?}");
    assert_eq!(git(&path, &["rev-parse", "HEAD"]), tip);
    assert_eq!(fs::read_to_string(path.join("later")).unwrap(), "later\n");
}

#[test]
fn resync_refuses_a_staged_change_that_conflicts_with_the_new_tip_and_keeps_the_patch() {
    let f = Fixture::new();
    let (path, request) = followed(&f, "conflict", "conf");
    fs::write(path.join("README"), "staged-from-checkout\n").unwrap();
    git(&path, &["add", "README"]);
    fs::write(f.repo.join("README"), "external\n").unwrap();
    git(&f.repo, &["commit", "-qam", "external"]);
    git(&f.repo, &["update-ref", "refs/heads/conf", "trunk"]);
    let before = fs::read_dir(patch_dir(&f)).map_or(0, |d| d.count());
    let error = resync(&request).unwrap_err();
    assert!(error.message.contains("reapply refused"), "{error}");
    let kept: Vec<_> = fs::read_dir(patch_dir(&f)).unwrap().flatten().collect();
    assert_eq!(kept.len(), before + 1, "exactly one patch is preserved");
    let patch = fs::read_to_string(kept[0].path()).unwrap();
    assert!(patch.contains("README"), "{patch}");
    assert!(patch.contains("staged-from-checkout"), "{patch}");
}

#[test]
fn resync_refuses_while_a_patch_an_earlier_run_left_for_this_branch_is_unresolved() {
    let f = Fixture::new();
    let (path, request) = followed(&f, "orphan", "orph");
    advance_branch(&f, "orph", "later", "later\n");
    fs::create_dir_all(patch_dir(&f)).unwrap();
    let stranded = patch_dir(&f).join("orph-1700000000000.patch");
    fs::write(&stranded, "diff --git a/stranded b/stranded\n").unwrap();
    let other = patch_dir(&f).join("someone-else-1700000000000.patch");
    fs::write(&other, "diff --git a/x b/x\n").unwrap();
    let error = resync(&request).unwrap_err();
    assert!(
        error.message.contains(stranded.to_str().unwrap()),
        "{error}"
    );
    assert!(!path.join("later").exists(), "the checkout is not touched");
    assert!(stranded.exists(), "the stranded patch is kept for review");
    fs::remove_file(&stranded).unwrap();
    // A patch of another branch never blocks this one.
    assert!(resync(&request).unwrap().resynced);
    assert_eq!(fs::read_to_string(path.join("later")).unwrap(), "later\n");
}

#[test]
fn resync_leaves_no_fgos_directory_behind_when_the_new_tip_tracks_one() {
    let f = Fixture::new();
    let (path, request) = followed(&f, "restrip", "strip");
    fs::create_dir_all(f.repo.join(".fgos")).unwrap();
    fs::write(f.repo.join(".fgos/events.jsonl"), "{\"seq\":1}\n").unwrap();
    git(&f.repo, &["add", "-f", ".fgos/events.jsonl"]);
    git(&f.repo, &["commit", "-qm", "tracked .fgos"]);
    git(&f.repo, &["update-ref", "refs/heads/strip", "trunk"]);
    assert!(resync(&request).unwrap().resynced);
    assert!(
        !path.join(".fgos").exists(),
        "the reset must not resurrect .fgos/"
    );
}
