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
    assert!(verify_legacy_tree(&port, &f.repo, &damaged)
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
