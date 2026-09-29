use fgos_observe::case_journal::{materialize_cases, read_all_case_records};
use fgos_observe::shard::read_all_json;
use std::path::Path;

#[test]
fn test_observe_golden_fixtures() {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let fixture_root = Path::new(manifest_dir)
        .join("../../../test/fixtures/observe");

    assert!(
        fixture_root.join(".fgos").exists(),
        "fixture .fgos directory must exist at {}",
        fixture_root.display()
    );

    // 1. Assert cases shard can be read and materialized
    let case_records = read_all_case_records(&fixture_root)
        .expect("should read case records from golden fixture");
    assert_eq!(case_records.len(), 2, "expected 2 case records (open + close)");

    let materialized = materialize_cases(&case_records);
    assert_eq!(materialized.len(), 1, "expected 1 materialized case");
    let case = &materialized[0];
    assert_eq!(case.name, "golden-case-1");
    assert_eq!(case.project, "observe-golden-fixture");
    assert_eq!(case.harness, "fgos");
    assert_eq!(case.verdict.as_deref(), Some("usable"));
    assert_eq!(case.interventions, Some(0));
    assert_eq!(case.items, vec!["tsk-golden-1"]);
    assert_eq!(case.sessions, vec!["coord-golden-01"]);

    // 2. Assert friction shard can be read
    let friction_records = read_all_json(&fixture_root, "friction")
        .expect("should read friction records from golden fixture");
    assert!(
        friction_records.len() >= 4,
        "expected at least 4 friction records (migrated recorded+resolved, migration marker, new recorded+resolved)"
    );

    let types: Vec<&str> = friction_records
        .iter()
        .filter_map(|r| r.get("type").and_then(|t| t.as_str()))
        .collect();
    assert!(types.contains(&"migration"), "fixture must contain migration record");
    assert!(types.contains(&"friction-recorded"), "fixture must contain friction-recorded record");
    assert!(types.contains(&"friction-resolved"), "fixture must contain friction-resolved record");

    // 3. Assert snapshots shard can be read
    let snapshot_records = read_all_json(&fixture_root, "snapshots")
        .expect("should read snapshot records from golden fixture");
    assert_eq!(snapshot_records.len(), 1, "expected 1 snapshot record");
    assert_eq!(snapshot_records[0]["type"], "snapshot");
    assert_eq!(snapshot_records[0]["case"], "golden-case-1");
}
