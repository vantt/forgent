use fgos_coordination_state::CoordinationSource;
use fgos_observe::{ObservationSource, Window};
use std::path::Path;

#[test]
fn test_smoke_real_coordination_store() {
    let root = Path::new("../../..");
    if !root.join(".fgos").join("coordination").exists() {
        return;
    }
    let source = CoordinationSource::new();
    let obs = source.observations(root, &Window::default()).unwrap();
    // Audit found 602 sessions (+/- new sessions)
    let opened = obs.iter().filter(|o| o.kind == "session.opened").count();
    assert!(opened >= 600, "Expected at least 600 session.opened, got {}", opened);
}
