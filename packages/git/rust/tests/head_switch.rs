#![cfg(target_os = "linux")]
//! HEAD is read in two bracketed steps; a switch between them must be refused, never paired.
use fgos_git::*;
use std::{fs, os::unix::fs::PermissionsExt, path::Path, process::Command};

fn git(p: &Path, args: &[&str]) -> String {
    let o = Command::new("git").arg("-C").arg(p).args(args).output().unwrap();
    assert!(o.status.success(), "{args:?}: {o:?}");
    String::from_utf8(o.stdout).unwrap().trim().into()
}

#[test]
fn a_head_switched_between_the_two_reads_is_refused_not_paired() {
    let root = std::env::temp_dir().join(format!("fgos-head-switch-{}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    fs::create_dir(&root).unwrap();
    fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
    let repo = root.join("repo");
    git(&root, &["init", "-q", "--initial-branch=a", "repo"]);
    let commit = |message: &str| {
        git(&repo, &["-c", "user.name=T", "-c", "user.email=t@example.invalid", "commit", "-q", "--allow-empty", "-m", message])
    };
    commit("one");
    git(&repo, &["branch", "b"]);
    commit("two");

    // A git on PATH that, once, points HEAD at branch `b` just before `rev-parse` reads it.
    let real = String::from_utf8(Command::new("sh").args(["-c", "command -v git"]).output().unwrap().stdout).unwrap();
    let real = real.trim();
    let bin = root.join("bin");
    fs::create_dir(&bin).unwrap();
    let marker = root.join("switched");
    let script = bin.join("git");
    fs::write(
        &script,
        format!(
            "#!/bin/sh\ncase \"$*\" in *--symbolic-full-name*) if [ ! -e '{m}' ]; then touch '{m}'; '{real}' -C '{r}' symbolic-ref HEAD refs/heads/b; fi;; esac\nexec '{real}' \"$@\"\n",
            m = marker.display(),
            r = repo.display()
        ),
    )
    .unwrap();
    fs::set_permissions(&script, fs::Permissions::from_mode(0o755)).unwrap();
    let mut paths = vec![bin];
    paths.extend(std::env::split_paths(&std::env::var_os("PATH").unwrap()));
    std::env::set_var("PATH", std::env::join_paths(paths).unwrap());

    let driver = GitDriver::new(&root).unwrap();
    let handle = match driver.resolve_repo(&repo, &repo).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let error = driver.resolve_head(&handle).unwrap_err();
    assert!(marker.exists(), "the switch was never injected");
    assert_eq!(error.cause, "head-changed-during-read");
    // Switched and settled: the next read is one consistent answer.
    assert!(matches!(driver.resolve_head(&handle).unwrap(), HeadFact::Attached { target, .. } if target.as_str() == "refs/heads/b"));
}
