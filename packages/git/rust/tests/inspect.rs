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
        assert!(driver.ancestry(&repo, &first, &second).unwrap());
        assert!(!driver.ancestry(&repo, &second, &first).unwrap());
        assert!(!driver.compare_content(&repo, &first, &second).unwrap());
        assert!(driver.compare_content(&repo, &first, &first).unwrap());
        let diff = driver.diff(&repo, &first, &second, None, 10).unwrap();
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
        assert_eq!(
            driver.resolve_repo(&linked, &linked).unwrap_err().cause,
            "trusted-main-gitfile-unsupported"
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
