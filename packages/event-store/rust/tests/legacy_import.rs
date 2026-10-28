#![cfg(target_os = "linux")]
mod reader_support;
use fgos_event_store::legacy_import::*;
use reader_support::{fenced_legacy, Fixture};
use std::{fs, process::Command};
fn git(f: &Fixture, args: &[&str]) -> String {
    let out = Command::new("git")
        .arg("-C")
        .arg(f.repo.trusted_main_root())
        .args(args)
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "{}",
        String::from_utf8_lossy(&out.stderr)
    );
    String::from_utf8(out.stdout).unwrap().trim().into()
}
const EVENTS: &[u8] = b"{\"ts\":\"2026-01-01T00:00:00.000Z\",\"type\":\"work.add\",\"payload\":{\"id\":\"one\"}}\n";
#[test]
fn a_clone_without_the_import_data_tree_object_still_verifies_the_published_legacy_commit() {
    let f = Fixture::new();
    let mut h = f.handle();
    let (oid, data_tree, _) = fenced_legacy(&f, &mut h, &[("events.jsonl", EVENTS.to_vec())]);
    verify_legacy_tree(&f.driver, &f.repo, &oid).unwrap();
    // No ref reaches the data tree, so a clone that fetched the legacy ref never has its object.
    let objects = std::path::PathBuf::from(git(
        &f,
        &["rev-parse", "--path-format=absolute", "--git-common-dir"],
    ))
    .join("objects");
    fs::remove_file(objects.join(&data_tree[..2]).join(&data_tree[2..])).unwrap();
    assert!(
        Command::new("git")
            .arg("-C")
            .arg(f.repo.trusted_main_root())
            .args(["cat-file", "-e", &data_tree])
            .status()
            .unwrap()
            .code()
            != Some(0)
    );
    verify_legacy_tree(&f.driver, &f.repo, &oid).unwrap();
}

/// After the cutover a write is admitted only while every legacy mirror still
/// names the pinned import: a mirror that moved away from the pin refuses with
/// refspec-missing, the same answer as a pin that was never fetched.
#[test]
fn a_migrated_write_is_refused_when_a_legacy_mirror_differs_from_the_pin() {
    let f = Fixture::new();
    let mut h = f.handle();
    let (oid, _, _) = fenced_legacy(&f, &mut h, &[("events.jsonl", EVENTS.to_vec())]);
    // The tracked fence is at HEAD; the fence commit itself is a valid object that is not the pin.
    let other = git(&f, &["rev-parse", "HEAD"]);
    fgos_git::RepositoryConfig::ensure_fetch_mapping(
        &f.driver,
        &f.repo,
        "origin",
        &fgos_git::publication_fetch_mappings("origin").unwrap(),
        "test-mapping-setup",
    )
    .unwrap();
    write_readiness(&f.driver, &f.repo, "origin").unwrap();
    git(
        &f,
        &["update-ref", "refs/fgos/remotes/origin/legacy", oid.as_str()],
    );
    write_readiness(&f.driver, &f.repo, "origin").unwrap();
    git(
        &f,
        &["update-ref", "refs/fgos/remotes/origin/legacy", other.as_str()],
    );
    assert_eq!(
        write_readiness(&f.driver, &f.repo, "origin")
            .unwrap_err()
            .code
            .to_string(),
        "event-store-refspec-missing"
    );
}
