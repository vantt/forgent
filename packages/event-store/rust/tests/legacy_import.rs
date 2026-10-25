#![cfg(target_os = "linux")]
mod reader_support;
use fgos_event_store::{
    cursor::Cursor,
    layout::StreamId,
    legacy_import::*,
    read::{read, ReadRequest},
};
use fgos_git::*;
use reader_support::Fixture;
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
fn legacy(f: &Fixture, porting: bool) {
    git(f, &["config", "user.name", "Fixture"]);
    git(f, &["config", "user.email", "fixture@example.test"]);
    fs::write(f.repo.trusted_main_root().join(".fgos/events.jsonl"),"{\"ts\":\"2026-01-01T00:00:00.000Z\",\"type\":\"work.add\",\"payload\":{\"id\":\"one\"}}\n").unwrap();
    if porting {
        let dir = f.repo.trusted_main_root().join("arbitrary/path/porting");
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("events.jsonl"),"{\"ts\":\"2026-01-01T00:00:00.000Z\",\"type\":\"porting.add\",\"payload\":{\"id\":\"p\"}}\n").unwrap();
        fs::write(dir.join("state.json"), "stale").unwrap();
    }
    git(f, &["add", ".fgos/events.jsonl"]);
    if porting {
        git(f, &["add", "arbitrary"]);
    }
    git(f, &["commit", "-qm", "legacy"]);
}
#[test]
fn legacy_import_real_publication_reuses_exact_commit_and_reads_nested_porting() {
    let f = Fixture::new();
    legacy(&f, true);
    let before = inventory(&f.driver, &f.repo).unwrap();
    assert_eq!(
        before.porting_log.as_deref(),
        Some("arbitrary/path/porting/events.jsonl")
    );
    assert!(before
        .files
        .contains_key("arbitrary/path/porting/state.json"));
    let streams = [
        StreamId::parse("project").unwrap(),
        StreamId::parse("project:porting").unwrap(),
    ];
    let original = read_legacy_from_head(&f.driver, &f.repo, &streams).unwrap();
    assert_eq!(original.len(), 2);
    assert_eq!(
        write_readiness(&f.driver, &f.repo, "origin")
            .unwrap_err()
            .code
            .to_string(),
        "event-store-migration-required"
    );
    ensure_clean(&f.driver, &f.repo, &before).unwrap();
    assert!(matches!(
        f.driver
            .resolve_ref(&f.repo, &RefName::parse("refs/fgos/legacy").unwrap())
            .unwrap(),
        RefValue::Absent
    ));
    let pin = import_legacy(
        &f.driver,
        &f.repo,
        &f.layout,
        before.from_commit.as_str(),
        &[],
        0,
    )
    .unwrap();
    let twice = import_legacy(
        &f.driver,
        &f.repo,
        &f.layout,
        before.from_commit.as_str(),
        &[],
        0,
    )
    .unwrap();
    assert_eq!(pin, twice);
    let oid = Oid::parse(
        pin["legacyRefOid"].as_str().unwrap(),
        f.repo.object_format(),
    )
    .unwrap();
    verify_legacy_tree(&f.driver, &f.repo, &oid).unwrap();
    // Reading after CAS but before cutover is recoverable and still HEAD-only.
    let result = read(
        &f.driver,
        &f.repo,
        ReadRequest {
            layout: &f.layout,
            origin: "",
            machine: "test-aa",
            streams: &streams,
            cursor: &Cursor::default(),
            folded: &[],
            project: true,
        },
    )
    .unwrap();
    assert_eq!(result.legacy.len(), 2);
    assert_eq!(
        git(
            &f,
            &[
                "show",
                "refs/fgos/legacy:porting/arbitrary/path/porting/events.jsonl"
            ]
        ),
        String::from_utf8(before.files["arbitrary/path/porting/events.jsonl"].clone())
            .unwrap()
            .trim()
    );
    assert_eq!(git(&f, &["rev-list", "--count", "refs/fgos/legacy"]), "1");
    // Import releases seal 58 before the consumer may take main-checkout 50.
    drop(f.handle());
}
#[test]
fn a_clone_without_the_import_data_tree_object_still_verifies_the_published_legacy_commit() {
    let f = Fixture::new();
    legacy(&f, true);
    let before = inventory(&f.driver, &f.repo).unwrap();
    let pin = import_legacy(
        &f.driver,
        &f.repo,
        &f.layout,
        before.from_commit.as_str(),
        &[],
        0,
    )
    .unwrap();
    let oid = Oid::parse(
        pin["legacyRefOid"].as_str().unwrap(),
        f.repo.object_format(),
    )
    .unwrap();
    let seal: serde_json::Value = serde_json::from_slice(
        &fgos_event_store::walk::blob(&f.driver, &f.repo, &oid, b"seal.json")
            .unwrap()
            .unwrap(),
    )
    .unwrap();
    let data_tree = seal["treeOfFgosEvents"].as_str().unwrap().to_string();
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
#[test]
fn legacy_import_dirty_multiple_porting_and_moved_head_refuse() {
    let f = Fixture::new();
    legacy(&f, false);
    let before = inventory(&f.driver, &f.repo).unwrap();
    fs::write(
        f.repo.trusted_main_root().join(".fgos/events.jsonl"),
        "dirty",
    )
    .unwrap();
    assert!(ensure_clean(&f.driver, &f.repo, &before).is_err());
    assert!(import_legacy(
        &f.driver,
        &f.repo,
        &f.layout,
        before.from_commit.as_str(),
        &[],
        0
    )
    .is_err());
    git(&f, &["checkout", "--", ".fgos/events.jsonl"]);
    assert!(import_legacy(&f.driver, &f.repo, &f.layout, &"0".repeat(40), &[], 0).is_err());
    for p in ["a/porting", "b/porting"] {
        let dir = f.repo.trusted_main_root().join(p);
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("events.jsonl"), "").unwrap();
    }
    git(&f, &["add", "a", "b"]);
    git(&f, &["commit", "-qm", "ambiguous"]);
    assert!(inventory(&f.driver, &f.repo)
        .unwrap_err()
        .detail
        .contains("multiple porting"));
}

// A project that ignores `.fgos/*` and re-includes only the old event log
// would let the import publish `refs/fgos/legacy` and then fail to stage the
// fence; the dry run must refuse it by name instead.
#[test]
fn an_ignored_fence_path_refuses_migration_before_the_legacy_ref_is_written() {
    let f = Fixture::new();
    legacy(&f, false);
    let root = f.repo.trusted_main_root();
    fs::write(root.join(".gitignore"), "/.fgos/*\n!/.fgos/events.jsonl\n").unwrap();
    git(&f, &["add", ".gitignore"]);
    git(&f, &["commit", "-qm", "ignore store"]);
    let before = inventory(&f.driver, &f.repo).unwrap();
    assert_eq!(
        ensure_clean(&f.driver, &f.repo, &before).unwrap_err().code.to_string(),
        "event-store-migration-fence-ignored"
    );
    assert_eq!(
        import_legacy(&f.driver, &f.repo, &f.layout, before.from_commit.as_str(), &[], 0)
            .unwrap_err()
            .code
            .to_string(),
        "event-store-migration-fence-ignored"
    );
    assert!(matches!(
        f.driver
            .resolve_ref(&f.repo, &RefName::parse("refs/fgos/legacy").unwrap())
            .unwrap(),
        RefValue::Absent
    ));
    fs::write(root.join(".gitignore"), "/.fgos/*\n!/.fgos/events.jsonl\n!/.fgos/events\n").unwrap();
    git(&f, &["commit", "-qam", "re-include fence"]);
    let after = inventory(&f.driver, &f.repo).unwrap();
    assert!(ensure_clean(&f.driver, &f.repo, &after).unwrap().is_empty());
}

// An empty untracked legacy file holds no history: it counts as absent and is
// named for removal, while one with content still refuses.
#[test]
fn an_empty_untracked_legacy_file_counts_as_absent() {
    let f = Fixture::new();
    git(&f, &["config", "user.name", "Fixture"]);
    git(&f, &["config", "user.email", "fixture@example.test"]);
    let root = f.repo.trusted_main_root();
    fs::write(root.join("README"), "project\n").unwrap();
    git(&f, &["add", "README"]);
    git(&f, &["commit", "-qm", "base"]);
    fs::write(root.join(".fgos/events.jsonl"), "").unwrap();
    let inv = inventory(&f.driver, &f.repo).unwrap();
    assert_eq!(
        ensure_clean(&f.driver, &f.repo, &inv).unwrap(),
        vec![".fgos/events.jsonl".to_string()]
    );
    fs::write(root.join(".fgos/events.jsonl"), "{}\n").unwrap();
    assert!(ensure_clean(&f.driver, &f.repo, &inv)
        .unwrap_err()
        .detail
        .contains("dirty or untracked migration path: .fgos/events.jsonl"));
}

#[test]
fn legacy_import_sealed_tree_refuses_missing_data_and_invalid_events_before_publication() {
    let f = Fixture::new();
    legacy(&f, false);
    let before = inventory(&f.driver, &f.repo).unwrap();
    let pin = import_legacy(
        &f.driver,
        &f.repo,
        &f.layout,
        before.from_commit.as_str(),
        &[],
        0,
    )
    .unwrap();
    let oid = Oid::parse(
        pin["legacyRefOid"].as_str().unwrap(),
        f.repo.object_format(),
    )
    .unwrap();
    let seal = fgos_event_store::walk::blob(&f.driver, &f.repo, &oid, b"seal.json")
        .unwrap()
        .unwrap();
    let mut handle = f.handle();
    let port = f.port(&mut handle, "refs/fgos/events/test-aa");
    let damaged = reader_support::commit(&port, &f.repo, vec![], vec![(b"seal.json", seal)]);
    assert!(verify_legacy_tree(&f.driver, &f.repo, &damaged)
        .unwrap_err()
        .detail
        .contains("differs"));
    drop(port);
    drop(handle);
    let g = Fixture::new();
    legacy(&g, false);
    fs::write(
        g.repo.trusted_main_root().join(".fgos/events.jsonl"),
        "invalid JSON\n",
    )
    .unwrap();
    git(&g, &["add", ".fgos/events.jsonl"]);
    git(&g, &["commit", "-qm", "invalid historical data"]);
    let head = inventory(&g.driver, &g.repo).unwrap().from_commit;
    assert!(import_legacy(&g.driver, &g.repo, &g.layout, head.as_str(), &[], 0).is_err());
    assert!(matches!(
        g.driver
            .resolve_ref(&g.repo, &RefName::parse("refs/fgos/legacy").unwrap())
            .unwrap(),
        RefValue::Absent
    ));
}

#[test]
fn a_root_porting_log_alone_still_needs_migration_before_a_write() {
    let f = Fixture::new();
    git(&f, &["config", "user.name", "Fixture"]);
    git(&f, &["config", "user.email", "fixture@example.test"]);
    let dir = f.repo.trusted_main_root().join("porting");
    fs::create_dir_all(&dir).unwrap();
    fs::write(dir.join("events.jsonl"),"{\"ts\":\"2026-01-01T00:00:00.000Z\",\"type\":\"porting.add\",\"payload\":{\"id\":\"p\"}}\n").unwrap();
    git(&f, &["add", "porting"]);
    git(&f, &["commit", "-qm", "porting only"]);
    assert_eq!(
        write_readiness(&f.driver, &f.repo, "origin")
            .unwrap_err()
            .code
            .to_string(),
        "event-store-migration-required"
    );
}
#[test]
fn a_cutover_operation_directory_without_an_intent_does_not_block_the_next_attempt() {
    let f = Fixture::new();
    legacy(&f, false);
    let head = inventory(&f.driver, &f.repo).unwrap().from_commit;
    let import = || import_legacy(&f.driver, &f.repo, &f.layout, head.as_str(), &[], 0);
    let first = import().unwrap();
    let id = format!("event-store-cutover-{}-1", &head.as_str()[..32]);
    assert_eq!(first["operationId"], id);
    {
        use std::os::unix::fs::DirBuilderExt;
        fs::DirBuilder::new()
            .mode(0o700)
            .create(f.repo.common_dir().join("fgos/git/operations").join(&id))
            .unwrap();
    }
    assert_eq!(import().unwrap()["operationId"], id);
}

/// After the cutover a write is admitted only while every legacy mirror still
/// names the pinned import: a mirror that moved away from the pin refuses with
/// refspec-missing, the same answer as a pin that was never fetched.
#[test]
fn a_migrated_write_is_refused_when_a_legacy_mirror_differs_from_the_pin() {
    let f = Fixture::new();
    legacy(&f, false);
    let head = inventory(&f.driver, &f.repo).unwrap().from_commit;
    let pin = import_legacy(&f.driver, &f.repo, &f.layout, head.as_str(), &[], 0).unwrap();
    let root = f.repo.trusted_main_root();
    git(&f, &["rm", "-q", ".fgos/events.jsonl"]);
    fs::create_dir_all(root.join(".fgos")).unwrap();
    let fence = serde_json::json!({"legacyRefOid": pin["legacyRefOid"], "sealDigest": pin["sealDigest"], "fromCommit": pin["fromCommit"]});
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
    let legacy_ref = pin["legacyRefOid"].as_str().unwrap();
    git(
        &f,
        &["update-ref", "refs/fgos/remotes/origin/legacy", legacy_ref],
    );
    write_readiness(&f.driver, &f.repo, "origin").unwrap();
    git(
        &f,
        &[
            "update-ref",
            "refs/fgos/remotes/origin/legacy",
            head.as_str(),
        ],
    );
    assert_eq!(
        write_readiness(&f.driver, &f.repo, "origin")
            .unwrap_err()
            .code
            .to_string(),
        "event-store-refspec-missing"
    );
}
