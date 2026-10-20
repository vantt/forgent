#![cfg(target_os = "linux")]
use fgos_git::*;
use std::{fs, path::Path, process::Command};
fn git(root: &Path, args: &[&str]) -> String {
    let o = Command::new("git")
        .arg("-C")
        .arg(root)
        .args(args)
        .output()
        .unwrap();
    assert!(o.status.success(), "{args:?}: {:?}", o);
    String::from_utf8(o.stdout).unwrap().trim().into()
}
#[test]
fn inspect_real_repositories_byte_paths_pages_and_optional_locks() {
    use std::os::unix::{ffi::OsStrExt, fs::PermissionsExt};
    for backend in ["files", "reftable"] {
        let root =
            std::env::temp_dir().join(format!("fgos-p02-inspect-{}-{backend}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir(&root).unwrap();
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        git(
            &root,
            &[
                "init",
                "-q",
                "--initial-branch=trunk",
                &format!("--ref-format={backend}"),
                "repo",
            ],
        );
        let repo_path = root.join("repo");
        git(&repo_path, &["config", "user.name", "Fixture"]);
        git(
            &repo_path,
            &["config", "user.email", "fixture@example.invalid"],
        );
        let weird = b"byte-\xff\n\t[*]";
        fs::write(
            repo_path.join(std::ffi::OsStr::from_bytes(weird)),
            b"first\0bytes",
        )
        .unwrap();
        git(&repo_path, &["add", "."]);
        git(&repo_path, &["commit", "-qm", "first"]);
        let first_text = git(&repo_path, &["rev-parse", "HEAD"]);
        fs::write(repo_path.join("new"), b"second").unwrap();
        git(&repo_path, &["add", "."]);
        git(&repo_path, &["commit", "-qm", "second"]);
        let second_text = git(&repo_path, &["rev-parse", "HEAD"]);
        let driver = GitDriver::new(&root).unwrap();
        let repo = match driver.resolve_repo(&repo_path, &repo_path).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        let first = Oid::parse(&first_text, repo.object_format()).unwrap();
        let second = Oid::parse(&second_text, repo.object_format()).unwrap();
        let comparison = driver.compare_commits(&repo, &first, &second).unwrap();
        assert_eq!(comparison["mergeBase"], first_text);
        assert_eq!(comparison["right"], 1);
        assert_eq!(comparison["commits"], serde_json::json!([second_text]));
        assert_eq!(
            driver.list_branches(&repo, "refs/heads/trunk").unwrap(),
            vec!["refs/heads/trunk"]
        );
        let checkout = driver.checkout_facts(&repo, &second).unwrap();
        assert_eq!(checkout["lastSynced"], second_text);
        assert_eq!(checkout["delta"], serde_json::json!([]));
        assert!(driver.ancestry(&repo, &first, &second).unwrap());
        assert!(!driver.ancestry(&repo, &second, &first).unwrap());
        assert!(!driver.compare_content(&repo, &first, &second).unwrap());
        assert!(driver.compare_content(&repo, &first, &first).unwrap());
        let diff = driver.diff(&repo, &first, &second, &DiffScope::default(), None, 10).unwrap();
        assert_eq!(diff.entries[0].path, b"new");
        let absent = RefName::parse("refs/heads/absent").unwrap();
        assert!(matches!(
            driver.resolve_ref(&repo, &absent).unwrap(),
            RefValue::Absent
        ));
        assert!(
            matches!(driver.resolve_trunk(&repo, None).unwrap(), TrunkFact::Known(r) if r.as_str()=="refs/heads/trunk")
        );
        assert!(matches!(
            driver.resolve_trunk(&repo, Some(&absent)).unwrap(),
            TrunkFact::Unknown(TrunkUnknown::TargetAbsent)
        ));
        // A pre-existing index.lock must neither prevent status nor be changed.
        fs::write(repo.git_dir().join("index.lock"), b"foreign-lock").unwrap();
        let index = fs::read(repo.git_dir().join("index")).unwrap();
        fs::write(
            repo_path.join(std::ffi::OsStr::from_bytes(weird)),
            b"modified",
        )
        .unwrap();
        fs::write(repo_path.join("untracked"), "new").unwrap();
        let status = driver.status(&repo, Untracked::All, None, 1).unwrap();
        assert!(!status.complete);
        let last = driver
            .status(&repo, Untracked::All, status.next_cursor, 1)
            .unwrap();
        assert!(last.complete);
        assert!(last.entries.iter().any(|e| e.untracked));
        let status = driver.status(&repo, Untracked::None, None, 10).unwrap();
        assert_eq!(status.entries[0].path, weird);
        assert_eq!(fs::read(repo.git_dir().join("index")).unwrap(), index);
        assert_eq!(
            fs::read(repo.git_dir().join("index.lock")).unwrap(),
            b"foreign-lock"
        );
        let snapshot = driver
            .snapshot_writes(&repo, &[b"missing".to_vec()], 4096)
            .unwrap();
        assert_eq!(snapshot.head.as_ref().unwrap(), &second);
        assert!(snapshot
            .files
            .iter()
            .any(|f| f.path == weird && matches!(f.fingerprint, PathFingerprint::File { .. })));
        assert!(snapshot
            .files
            .iter()
            .any(|f| f.path == b"missing" && matches!(f.fingerprint, PathFingerprint::Missing)));
        assert_eq!(
            driver.snapshot_writes(&repo, &[], 1).unwrap_err().cause,
            "snapshot-byte-limit"
        );
        std::os::unix::fs::symlink("new", repo_path.join("link")).unwrap();
        let snapshot = driver.snapshot_writes(&repo, &[], 4096).unwrap();
        assert!(snapshot.files.iter().any(|f| f.path == b"link"
            && matches!(&f.fingerprint,PathFingerprint::Link {target} if target == b"new")));
        let stale = driver
            .status(&repo, Untracked::All, None, 1)
            .unwrap()
            .next_cursor;
        fs::write(repo_path.join("another-untracked"), "third").unwrap();
        assert_eq!(
            driver
                .status(&repo, Untracked::All, stale, 1)
                .unwrap_err()
                .cause,
            "inspect-cursor-stale"
        );
        let trees = driver.list_worktrees(&repo, None, 10).unwrap();
        assert_eq!(trees.entries.len(), 1);
        assert_eq!(
            trees.entries[0].branch.as_ref().unwrap().as_str(),
            "refs/heads/trunk"
        );
        let linked = root.join("linked");
        git(
            &repo_path,
            &[
                "worktree",
                "add",
                "--detach",
                "-q",
                linked.to_str().unwrap(),
            ],
        );
        let linked_repo = match driver.resolve_repo(&linked, &repo_path).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!("registered linked worktree must resolve"),
        };
        assert_eq!(linked_repo.common_dir(), repo.common_dir());
        assert_ne!(linked_repo.git_dir(), repo.git_dir());
        assert!(
            matches!(driver.resolve_head(&linked_repo).unwrap(),HeadFact::Detached {commit} if commit==second)
        );
        assert!(
            matches!(driver.resolve_repo(&linked, &linked).unwrap(),ResolveRepo::Repository(r) if r.common_dir()==repo.common_dir())
        );
        // Trust is the main registration, never the worker's .git file bytes.
        fs::write(linked.join(".git"), b"gitdir: /untrusted/nonexistent\n").unwrap();
        assert!(matches!(
            driver.resolve_repo(&linked, &repo_path).unwrap(),
            ResolveRepo::Repository(_)
        ));
        let separate = root.join("separate");
        git(
            &root,
            &[
                "init",
                "-q",
                &format!(
                    "--separate-git-dir={}",
                    root.join("separate-admin").display()
                ),
                separate.to_str().unwrap(),
            ],
        );
        assert_eq!(
            driver.resolve_repo(&separate, &separate).unwrap_err().cause,
            "trusted-main-gitfile-unsupported"
        );
        let blob = git(&repo_path, &["rev-parse", "HEAD:new"]);
        let blob = Oid::parse(&blob, repo.object_format()).unwrap();
        let missing = Oid::parse(&"1".repeat(40), repo.object_format()).unwrap();
        let objects = driver
            .read_objects(&repo, &[blob.clone(), missing], 4096)
            .unwrap();
        assert!(matches!(&objects[0], ReadObject::Present { bytes,.. } if bytes == b"second"));
        assert!(matches!(objects[1], ReadObject::Missing));
        assert_eq!(
            driver.read_objects(&repo, &[blob], 1).unwrap_err().cause,
            "object-read-limit"
        );
        let paths = driver
            .paths_at_revision(&repo, &first, &[weird.to_vec(), b"absent".to_vec()], 4096)
            .unwrap();
        assert!(matches!(&paths[0].value,PathValue::Blob(bytes) if bytes==b"first\0bytes"));
        assert!(matches!(paths[1].value, PathValue::Absent));
        fs::remove_file(repo.git_dir().join("index.lock")).unwrap();
        git(&repo_path, &["checkout", "--detach", "-q"]);
        assert!(matches!(
            driver.resolve_trunk(&repo, None).unwrap(),
            TrunkFact::Unknown(TrunkUnknown::MissingTarget)
        ));
        fs::remove_dir_all(root).unwrap();
    }
}

#[test]
fn shallow_ancestry_never_turns_missing_history_into_no() {
    use std::os::unix::fs::PermissionsExt;
    let root = std::env::temp_dir().join(format!("fgos-p02-shallow-{}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    fs::create_dir(&root).unwrap();
    fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
    git(&root, &["init", "-q", "origin"]);
    let origin = root.join("origin");
    git(&origin, &["config", "user.name", "A"]);
    git(&origin, &["config", "user.email", "a@a"]);
    git(&origin, &["commit", "--allow-empty", "-qm", "one"]);
    let first = git(&origin, &["rev-parse", "HEAD"]);
    git(&origin, &["commit", "--allow-empty", "-qm", "two"]);
    let second = git(&origin, &["rev-parse", "HEAD"]);
    git(
        &root,
        &[
            "clone",
            "-q",
            "--depth=1",
            &format!("file://{}", origin.display()),
            "clone",
        ],
    );
    let clone = root.join("clone");
    git(&clone, &["fetch", "-q", "origin", &first]);
    let driver = GitDriver::new(&root).unwrap();
    let repo = match driver.resolve_repo(&clone, &clone).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let first = Oid::parse(&first, repo.object_format()).unwrap();
    let second = Oid::parse(&second, repo.object_format()).unwrap();
    assert_eq!(
        driver.ancestry(&repo, &first, &second).unwrap_err().cause,
        "shallow-history-incomplete"
    );
    assert!(driver.ancestry(&repo, &second, &second).unwrap());
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn every_non_separator_filename_byte_round_trips_and_snapshots_never_follow_parents() {
    use std::{
        collections::BTreeSet,
        ffi::{CString, OsStr},
        os::unix::{ffi::OsStrExt, fs::PermissionsExt},
    };
    let root = std::env::temp_dir().join(format!("fgos-p02-bytes-{}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    fs::create_dir(&root).unwrap();
    fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
    git(&root, &["init", "-q", "repo"]);
    let path = root.join("repo");
    let mut expected = BTreeSet::new();
    for b in 1u8..=255 {
        if b == b'/' {
            continue;
        }
        let name = vec![b'p', b'-', b];
        fs::write(path.join(OsStr::from_bytes(&name)), [b]).unwrap();
        expected.insert(name);
    }
    let driver = GitDriver::new(&root).unwrap();
    let repo = match driver.resolve_repo(&path, &path).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let status = driver.status(&repo, Untracked::All, None, 4096).unwrap();
    assert!(status.complete);
    assert_eq!(
        status
            .entries
            .into_iter()
            .map(|e| e.path)
            .collect::<BTreeSet<_>>(),
        expected
    );
    let fifo = path.join("fifo");
    let name = CString::new(fifo.as_os_str().as_bytes()).unwrap();
    assert_eq!(unsafe { libc::mkfifo(name.as_ptr(), 0o600) }, 0);
    let snapshot = driver
        .snapshot_writes(&repo, &[b"fifo".to_vec()], 4096)
        .unwrap();
    assert!(snapshot
        .files
        .iter()
        .any(|e| e.path == b"fifo" && matches!(e.fingerprint, PathFingerprint::Type { .. })));
    std::os::unix::fs::symlink(&root, path.join("escape")).unwrap();
    assert_eq!(
        driver
            .snapshot_writes(&repo, &[b"escape/outside".to_vec()], 4096)
            .unwrap_err()
            .cause,
        "snapshot-parent-unreadable"
    );
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn inspect_merge_facts_for_land_consumers() {
    use std::os::unix::fs::PermissionsExt;
    let root = std::env::temp_dir().join(format!("fgos-p07-merge-facts-{}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    fs::create_dir(&root).unwrap();
    fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
    git(&root, &["init", "-q", "--initial-branch=trunk", "repo"]);
    let repo_path = root.join("repo");
    git(&repo_path, &["config", "user.name", "Fixture"]);
    git(&repo_path, &["config", "user.email", "fixture@example.invalid"]);
    fs::create_dir_all(repo_path.join("docs/decisions")).unwrap();
    fs::create_dir_all(repo_path.join(".fgos")).unwrap();
    fs::write(repo_path.join(".gitattributes"), ".fgos/events.jsonl merge=union\n").unwrap();
    fs::write(repo_path.join("docs/decisions/0001-a [x].md"), "a").unwrap();
    fs::write(repo_path.join("docs/other.md"), "o").unwrap();
    fs::write(repo_path.join(".fgos/events.jsonl"), "base\n").unwrap();
    fs::write(repo_path.join("shared"), "base\n").unwrap();
    fs::write(repo_path.join("moved"), "a long enough body to be detected as one rename\n").unwrap();
    git(&repo_path, &["add", "."]);
    git(&repo_path, &["commit", "-qm", "base"]);
    let base_text = git(&repo_path, &["rev-parse", "HEAD"]);
    git(&repo_path, &["switch", "-qc", "topic"]);
    fs::write(repo_path.join("shared"), "topic\n").unwrap();
    git(&repo_path, &["mv", "moved", "renamed"]);
    git(&repo_path, &["commit", "-qam", "topic"]);
    let topic_text = git(&repo_path, &["rev-parse", "HEAD"]);
    git(&repo_path, &["switch", "-q", "trunk"]);
    fs::write(repo_path.join("shared"), "trunk\n").unwrap();
    fs::write(repo_path.join(".fgos/events.jsonl"), "base\ntrunk\n").unwrap();
    git(&repo_path, &["commit", "-qam", "trunk"]);
    let trunk_text = git(&repo_path, &["rev-parse", "HEAD"]);
    let driver = GitDriver::new(&root).unwrap();
    let repo = match driver.resolve_repo(&repo_path, &repo_path).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let parse = |t: &str| Oid::parse(t, repo.object_format()).unwrap();
    let (base, topic, trunk) = (parse(&base_text), parse(&topic_text), parse(&trunk_text));

    let conflicted = driver.merge_tree(&repo, &trunk, &topic).unwrap();
    assert_eq!(conflicted.conflicted_paths, vec![b"shared".to_vec()]);
    let clean = driver.merge_tree(&repo, &base, &topic).unwrap();
    assert!(clean.conflicted_paths.is_empty());
    assert_eq!(clean.tree.as_str(), git(&repo_path, &["rev-parse", &format!("{topic_text}^{{tree}}")]));

    // A transport resumes a tree listing from the last path it returned.
    let first_page = driver.list_tree(&repo, &trunk, b"docs/", None, 1).unwrap();
    assert!(!first_page.complete);
    let after = first_page.next_cursor.unwrap().after().to_vec();
    assert!(driver.list_tree(&repo, &base, b"docs/", Some(TreeCursor::resume(&trunk, b"docs/", after.clone())), 10).is_err());
    let resumed = driver
        .list_tree(&repo, &trunk, b"docs/", Some(TreeCursor::resume(&trunk, b"docs/", after)), 10)
        .unwrap();
    assert!(resumed.complete);
    assert_eq!(
        resumed.entries.iter().map(|e| e.path.clone()).collect::<Vec<_>>(),
        vec![b"docs/decisions/0001-a [x].md".to_vec(), b"docs/other.md".to_vec()]
    );

    let attrs = driver
        .attributes(&repo, &trunk, "merge", &[b".fgos/events.jsonl".to_vec(), b"shared".to_vec()])
        .unwrap();
    assert_eq!(attrs[0].value, "union");
    assert_eq!(attrs[1].value, "unspecified");
    assert!(driver.attributes(&repo, &trunk, "-merge", &[b"shared".to_vec()]).is_err());

    let store = driver
        .diff(&repo, &base, &clean.tree, &DiffScope { prefix: Some(".fgos"), renames: false }, None, 10)
        .unwrap();
    assert!(store.entries.is_empty());
    let store = driver
        .diff(&repo, &base, &trunk, &DiffScope { prefix: Some(".fgos"), renames: false }, None, 10)
        .unwrap();
    assert_eq!(store.entries.iter().map(|e| e.path.clone()).collect::<Vec<_>>(), vec![b".fgos/events.jsonl".to_vec()]);
    let split = driver.diff(&repo, &base, &topic, &DiffScope::default(), None, 10).unwrap();
    assert_eq!(split.entries.len(), 3);
    let folded = driver
        .diff(&repo, &base, &topic, &DiffScope { prefix: None, renames: true }, None, 10)
        .unwrap();
    let rename = folded.entries.iter().find(|e| e.change == b'R').unwrap();
    assert_eq!((rename.path.as_slice(), rename.from.as_deref()), (&b"renamed"[..], Some(&b"moved"[..])));
    assert_eq!(folded.entries.len(), 2);

    assert!(driver.first_ancestry_merge(&repo, &topic, &trunk).unwrap().is_none());
    git(&repo_path, &["merge", "-q", "--no-ff", "-s", "ours", "-m", "merge topic", "topic"]);
    let merge_text = git(&repo_path, &["rev-parse", "HEAD"]);
    fs::write(repo_path.join("later"), "x").unwrap();
    git(&repo_path, &["add", "later"]);
    git(&repo_path, &["commit", "-qm", "later"]);
    let tip = parse(&git(&repo_path, &["rev-parse", "HEAD"]));
    assert_eq!(driver.first_ancestry_merge(&repo, &topic, &tip).unwrap().unwrap().as_str(), merge_text);
    let _ = fs::remove_dir_all(&root);
}
