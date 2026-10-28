#![cfg(target_os = "linux")]
mod reader_support;
use fgos_event_store::{envelope::Seal, legacy_import::*};
use fgos_git::*;
use reader_support::{commit, Fixture};
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
fn legacy(f: &Fixture) {
    git(f, &["config", "user.name", "Fixture"]);
    git(f, &["config", "user.email", "fixture@example.test"]);
    fs::write(f.repo.trusted_main_root().join(".fgos/events.jsonl"),"{\"ts\":\"2026-01-01T00:00:00.000Z\",\"type\":\"work.add\",\"payload\":{\"id\":\"one\"}}\n").unwrap();
    git(f, &["add", ".fgos/events.jsonl"]);
    git(f, &["commit", "-qm", "legacy"]);
}
/// What an earlier release's migration left behind: the tracked `.fgos/events.jsonl` published as a
/// sealed legacy commit at `refs/fgos/legacy`. Returns that commit, the id of the data tree the
/// seal names, and the fence a cutover commit tracks.
fn publish_legacy(f: &Fixture) -> (Oid, String, serde_json::Value) {
    let from = git(f, &["rev-parse", "HEAD"]);
    let bytes = fs::read(f.repo.trusted_main_root().join(".fgos/events.jsonl")).unwrap();
    let mut h = f.handle();
    let (oid, seal, data_tree) = {
        let p = f.port(&mut h, "refs/fgos/events/test-aa");
        let blob = p.write_blob(&f.repo, &bytes).unwrap();
        let data_tree = p
            .write_tree(
                &f.repo,
                &[TreeEntry {
                    name: b"events.jsonl".to_vec(),
                    mode: 0o100644,
                    oid: blob,
                }],
            )
            .unwrap();
        let seal = Seal::Legacy {
            from_commit: from.clone(),
            tree_of_fgos_events: data_tree.as_str().into(),
        };
        let oid = commit(
            &p,
            &f.repo,
            vec![],
            vec![
                (b"events.jsonl", bytes),
                (b"seal.json", seal.canonical_line().unwrap()),
            ],
        );
        (oid, seal, data_tree.as_str().to_string())
    };
    let path = h.path().to_path_buf();
    let authority = HolderAuthority::legacy_import(&f.repo, &mut h, &path, "reader-test").unwrap();
    PublicationPort::new(&f.driver, authority)
        .compare_and_swap(
            &f.repo,
            &RefName::parse("refs/fgos/legacy").unwrap(),
            &ExpectedTip::Absent,
            &ExpectedTip::Oid(oid.clone()),
            "legacy",
        )
        .unwrap();
    let fence = serde_json::json!({"legacyRefOid": oid.as_str(), "sealDigest": seal.digest().unwrap(), "fromCommit": from});
    (oid, data_tree, fence)
}
#[test]
fn a_clone_without_the_import_data_tree_object_still_verifies_the_published_legacy_commit() {
    let f = Fixture::new();
    legacy(&f);
    let (oid, data_tree, _) = publish_legacy(&f);
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
    legacy(&f);
    let head = git(&f, &["rev-parse", "HEAD"]);
    let (oid, _, fence) = publish_legacy(&f);
    let root = f.repo.trusted_main_root();
    git(&f, &["rm", "-q", ".fgos/events.jsonl"]);
    fs::create_dir_all(root.join(".fgos")).unwrap();
    fs::write(
        root.join(".fgos/events"),
        serde_json::to_vec(&fence).unwrap(),
    )
    .unwrap();
    git(&f, &["add", ".fgos/events"]);
    git(&f, &["commit", "-qm", "cutover fence"]);
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
        &["update-ref", "refs/fgos/remotes/origin/legacy", head.as_str()],
    );
    assert_eq!(
        write_readiness(&f.driver, &f.repo, "origin")
            .unwrap_err()
            .code
            .to_string(),
        "event-store-refspec-missing"
    );
}
