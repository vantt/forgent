#![cfg(target_os = "linux")]
use fgos_git::*;
use std::{fs, path::Path, process::Command};
fn git(p: &Path, args: &[&str]) -> String {
    let o = Command::new("git")
        .arg("-C")
        .arg(p)
        .args(args)
        .output()
        .unwrap();
    assert!(o.status.success(), "{args:?}: {:?}", o);
    String::from_utf8(o.stdout).unwrap().trim().into()
}
#[test]
fn head_and_literal_tree_pages_all_formats_and_backends() {
    for format in ["sha1", "sha256"] {
        for backend in ["files", "reftable"] {
            let root = std::env::temp_dir().join(format!(
                "fgos-head-tree-{}-{format}-{backend}",
                std::process::id()
            ));
            let _ = fs::remove_dir_all(&root);
            fs::create_dir(&root).unwrap();
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
            let repo = root.join("repo");
            git(
                &root,
                &[
                    "init",
                    "-q",
                    &format!("--object-format={format}"),
                    &format!("--ref-format={backend}"),
                    "repo",
                ],
            );
            let driver = GitDriver::new(&root).unwrap();
            let resolve = |p: &Path| match driver.resolve_repo(p, &repo).unwrap() {
                ResolveRepo::Repository(r) => r,
                _ => panic!(),
            };
            assert!(matches!(
                driver.resolve_head(&resolve(&repo)).unwrap(),
                HeadFact::Unborn { .. }
            ));
            fs::write(repo.join("a\n\t[*]"), "one").unwrap();
            fs::write(repo.join("a-other"), "two").unwrap();
            use std::os::unix::ffi::OsStrExt;
            fs::write(
                repo.join(std::ffi::OsStr::from_bytes(b"byte-\xff")),
                b"binary name",
            )
            .unwrap();
            git(&repo, &["add", "."]);
            git(
                &repo,
                &[
                    "-c",
                    "user.name=A",
                    "-c",
                    "user.email=a@a",
                    "commit",
                    "-qm",
                    "first",
                ],
            );
            let first = git(&repo, &["rev-parse", "HEAD"]);
            let r = resolve(&repo);
            assert!(
                matches!(driver.resolve_head(&r).unwrap(), HeadFact::Attached {commit,..} if commit.as_str()==first)
            );
            let oid = Oid::parse(&first, r.object_format()).unwrap();
            let page = driver.list_tree(&r, &oid, b"a", None, 1).unwrap();
            assert!(!page.complete);
            assert_eq!(page.entries[0].path, b"a\n\t[*]");
            let next = driver
                .list_tree(&r, &oid, b"a", page.next_cursor, 1)
                .unwrap();
            assert!(next.complete);
            assert_eq!(next.entries[0].path, b"a-other");
            assert_eq!(
                driver
                    .list_tree(&r, &oid, b"a\n\t[*]", None, 2)
                    .unwrap()
                    .entries
                    .len(),
                1
            );
            assert_eq!(
                driver
                    .list_tree(&r, &oid, b"byte-", None, 1)
                    .unwrap()
                    .entries[0]
                    .path,
                b"byte-\xff"
            );
            assert!(driver.list_tree(&r, &oid, b"\0", None, 1).is_err());
            assert!(driver.list_tree(&r, &oid, b"", None, 0).is_err());
            let linked = root.join("linked");
            git(
                &repo,
                &[
                    "worktree",
                    "add",
                    "-q",
                    "--detach",
                    linked.to_str().unwrap(),
                    "HEAD",
                ],
            );
            fs::write(repo.join("new"), "new").unwrap();
            git(&repo, &["add", "."]);
            git(
                &repo,
                &[
                    "-c",
                    "user.name=A",
                    "-c",
                    "user.email=a@a",
                    "commit",
                    "-qm",
                    "second",
                ],
            );
            assert!(
                matches!(driver.resolve_head(&resolve(&linked)).unwrap(), HeadFact::Detached {commit} if commit.as_str()==first)
            );
            assert!(
                matches!(driver.resolve_head(&resolve(&repo)).unwrap(), HeadFact::Attached {commit,..} if commit.as_str()!=first)
            );
            fs::remove_dir_all(root).unwrap();
        }
    }
}
