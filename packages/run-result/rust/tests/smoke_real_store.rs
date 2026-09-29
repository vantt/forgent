use fgos_observe::{ObservationSource, Window};
use fgos_run_result::RunResultSource;
use std::path::Path;

#[test]
fn test_smoke_real_forgentx_store() {
    let root = Path::new("../../..");
    if !root.join(".fgos").join("assignments").exists() {
        return;
    }
    let source = RunResultSource::new();
    let obs = source.observations(root, &Window::default()).unwrap();
    // Audit found 1028 runs (+/- new runs)
    assert!(obs.len() >= 1028, "Expected at least 1028 runs, got {}", obs.len());

    let with_classification = obs.iter().filter(|o| o.attrs.contains_key("classification")).count();
    // Audit found 103 runs with classification
    assert_eq!(with_classification, 103, "Expected 103 runs with classification, got {}", with_classification);
}
