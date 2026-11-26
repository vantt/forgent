//! Owning proof of the stripped-project-file refusal (spec section 6): a write or project `init` never
//! creates `.fgos/config.yaml` while the checkout's Git index tracks it and the working copy lacks it (a
//! worktree made by `fgos worktree create`). It lives apart from `write_golden.rs` because the fact is
//! produced from a real Git repository through the host provider, which the fixture runner does not have.
//! One test body: the provider reads `HOME`, which is process-wide.
#![cfg(all(unix, feature = "host-provider"))]
mod common;

use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::process::Command;

use fgos_config::provider::{answer, project_file_tracked, ConfigRequest, Verb};
use fgos_config::scope::SourceKind;
use fgos_config::snapshot::{SessionClass, SnapshotError, SnapshotRequest};
use fgos_config::write::init;

fn git(dir: &Path, args: &[&str]) {
    let done = Command::new("git")
        .arg("-C")
        .arg(dir)
        .args(["-c", "user.name=t", "-c", "user.email=t@example.com"])
        .args(args)
        .output()
        .expect("git runs");
    assert!(
        done.status.success(),
        "git {args:?}: {}",
        String::from_utf8_lossy(&done.stderr)
    );
}

/// Every entry under `.fgos` as (relative name, bytes, mode), sorted.
fn listing(project: &Path) -> Vec<(String, Vec<u8>, u32)> {
    fn walk(base: &Path, dir: &Path, out: &mut Vec<(String, Vec<u8>, u32)>) {
        let Ok(entries) = fs::read_dir(dir) else {
            return;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            let mode = fs::symlink_metadata(&path).unwrap().permissions().mode();
            let name = path.strip_prefix(base).unwrap().display().to_string();
            if path.is_dir() {
                out.push((name, Vec::new(), mode));
                walk(base, &path, out);
            } else {
                out.push((name, fs::read(&path).unwrap(), mode));
            }
        }
    }
    let mut out = Vec::new();
    walk(project, &project.join(".fgos"), &mut out);
    out.sort();
    out
}

fn stripped_repo(dir: &Path) -> PathBuf {
    let project = dir.join("project");
    fs::create_dir_all(project.join(".fgos")).unwrap();
    git(&project, &["init", "-q"]);
    fs::write(project.join(".fgos/config.yaml"), "# tracked\n").unwrap();
    git(&project, &["add", "-f", ".fgos/config.yaml"]);
    git(&project, &["commit", "-q", "-m", "seed"]);
    git(
        &project,
        &["update-index", "--skip-worktree", ".fgos/config.yaml"],
    );
    fs::remove_file(project.join(".fgos/config.yaml")).unwrap();
    project
}

fn refusal_code(result: Result<impl std::fmt::Debug, SnapshotError>) -> &'static str {
    match result {
        Err(SnapshotError::Refused(all)) => all[0].code,
        other => panic!("not a refusal: {other:?}"),
    }
}

fn set(project: &Path) -> Result<fgos_config::provider::ConfigOutcome, fgos_identity::Refusal> {
    answer(&ConfigRequest {
        root: project.to_path_buf(),
        verb: Verb::Set {
            path: "dispatch.gateKillGraceMs".into(),
            value: "5000".into(),
            reason: "tune the grace for this repository".into(),
            global: false,
        },
    })
}

#[test]
fn a_write_never_creates_a_project_file_the_index_tracks_and_the_working_copy_lacks() {
    let dir = common::temp("stripped", "all");
    fs::create_dir_all(dir.join("home")).unwrap();
    std::env::set_var("HOME", dir.join("home"));
    // A confined run (this test may run inside one) would be refused before the case under proof.
    std::env::remove_var("FGOS_CONFINED");
    // The Git driver and the locks keep their state under the state root: pin it inside the case.
    let state = dir.join("state");
    fgos_holder_lock::state_root::create_state_root(&state).unwrap();
    std::env::set_var(fgos_holder_lock::state_root::PINNED_ROOT_ENV, &state);
    let project = stripped_repo(&dir);
    assert!(project_file_tracked(&project).unwrap());

    // `set` through the provider, which computes the fact itself.
    let before = listing(&project);
    let refused = set(&project).unwrap_err();
    assert_eq!(refused.reason, "config-project-file-stripped");
    assert!(
        refused.detail.contains("main checkout") && refused.detail.contains("git checkout"),
        "the refusal names the remedy: {}",
        refused.detail
    );
    assert_eq!(listing(&project), before, "set changed .fgos");

    // `patch` through the provider.
    let patch = dir.join("patch.yaml");
    fs::write(&patch, "- set: dispatch.gateKillGraceMs\n  value: 5000\n").unwrap();
    let refused = answer(&ConfigRequest {
        root: project.clone(),
        verb: Verb::Patch {
            file: patch,
            reason: "tune the grace for this repository".into(),
            global: false,
            project_only: false,
        },
    })
    .unwrap_err();
    assert_eq!(refused.reason, "config-project-file-stripped");
    assert_eq!(listing(&project), before, "patch changed .fgos");

    // Project `init` with the same fact.
    let roots = SnapshotRequest {
        trusted_root: project.clone(),
        project_root: project.clone(),
        global_dir: dir.join("home/.fgos"),
        class: SessionClass::Unconfined,
    };
    let tracked = project_file_tracked(&project).unwrap();
    let refused = init(
        &roots,
        SourceKind::Project,
        &dir.join("locks"),
        2000,
        tracked,
    );
    assert_eq!(refusal_code(refused), "config-project-file-stripped");
    assert_eq!(listing(&project), before, "init changed .fgos");

    // A linked worktree of that repository: the refusal names the main checkout, not the worktree.
    let linked = dir.join("linked");
    git(
        &project,
        &[
            "worktree",
            "add",
            "-q",
            linked.to_str().unwrap(),
            "-b",
            "side",
        ],
    );
    git(
        &linked,
        &["update-index", "--skip-worktree", ".fgos/config.yaml"],
    );
    fs::remove_file(linked.join(".fgos/config.yaml")).unwrap();
    let refused = set(&linked).unwrap_err();
    assert_eq!(refused.reason, "config-project-file-stripped");
    let main = fs::canonicalize(&project).unwrap();
    assert!(
        refused.detail.contains(&format!("file={}", main.display())),
        "the refusal names the main checkout {}: {}",
        main.display(),
        refused.detail
    );
    assert!(!linked.join(".fgos/config.yaml").exists());

    // A project rooted in a subdirectory of the repository: its own tracked file counts.
    let sub_repo = dir.join("sub-repo");
    let sub_project = sub_repo.join("sub");
    fs::create_dir_all(sub_project.join(".fgos")).unwrap();
    git(&sub_repo, &["init", "-q"]);
    fs::write(sub_project.join(".fgos/config.yaml"), "# tracked\n").unwrap();
    git(&sub_repo, &["add", "-f", "sub/.fgos/config.yaml"]);
    git(&sub_repo, &["commit", "-q", "-m", "seed"]);
    git(
        &sub_repo,
        &["update-index", "--skip-worktree", "sub/.fgos/config.yaml"],
    );
    fs::remove_file(sub_project.join(".fgos/config.yaml")).unwrap();
    assert!(project_file_tracked(&sub_project).unwrap());
    let refused = set(&sub_project).unwrap_err();
    assert_eq!(refused.reason, "config-project-file-stripped");
    assert!(!sub_project.join(".fgos/config.yaml").exists());

    // The same repository once the path is untracked: the file is created as it always was.
    git(
        &project,
        &["update-index", "--no-skip-worktree", ".fgos/config.yaml"],
    );
    git(&project, &["rm", "-q", "--cached", ".fgos/config.yaml"]);
    assert!(!project_file_tracked(&project).unwrap());
    set(&project).unwrap();
    assert!(project.join(".fgos/config.yaml").is_file());
    fs::remove_file(project.join(".fgos/config.yaml")).unwrap();
    let done = init(&roots, SourceKind::Project, &dir.join("locks"), 2000, false).unwrap();
    assert!(done.created);

    // A plain directory is no repository: nothing is tracked.
    let plain = dir.join("plain");
    fs::create_dir_all(&plain).unwrap();
    assert!(!project_file_tracked(&plain).unwrap());
    let _ = fs::remove_dir_all(&dir);
}
