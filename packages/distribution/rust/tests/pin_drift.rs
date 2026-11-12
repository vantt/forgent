//! `pin_drift` against the shared golden the doctor row's test also reads: one
//! comparison rule, two readers.

use fgos_distribution::{
    pin_drift, pin_note, PinFile, TrackedDistributionPin, WorkspaceActivationBinding,
};
use serde_json::{json, Value};

const CASES: &str = include_str!("goldens/pin-drift-cases.json");
const ACTIVATION_BASE: &str = include_str!("goldens/activation-binding-minimal.json");

fn activation_of(case: &Value) -> WorkspaceActivationBinding {
    let mut record: Value = serde_json::from_str(ACTIVATION_BASE).unwrap();
    record["artifactDigest"] = case["activation"]["artifactDigest"].clone();
    if let Some(reason) = case["activation"]["pinOverrideReason"].as_str() {
        record["pinOverrideReason"] = json!(reason);
    }
    serde_json::from_value(record).unwrap()
}

fn pin_of(case: &Value) -> Option<TrackedDistributionPin> {
    let pin = case["pin"].as_object()?;
    let mut runtime = json!({ "policy": "exact-digest", "artifactDigest": pin["artifactDigest"] });
    if let Some(tag) = pin.get("releaseVersion") {
        runtime["releaseVersion"] = tag.clone();
    }
    Some(serde_json::from_value(json!({ "schemaVersion": 1, "projectRuntime": runtime })).unwrap())
}

fn pin_file_of(case: &Value) -> PinFile {
    if case["pin"] == "unreadable" {
        return PinFile::Unreadable;
    }
    pin_of(case).map_or(PinFile::Absent, PinFile::Present)
}

#[test]
fn pin_drift_says_exactly_what_the_shared_cases_say() {
    let cases: Value = serde_json::from_str(CASES).unwrap();
    for case in cases["cases"].as_array().unwrap() {
        let line = pin_note(&activation_of(case), &pin_file_of(case));
        assert_eq!(line.as_deref(), case["line"].as_str(), "{}", case["name"]);
    }
}

#[test]
fn an_override_reason_is_carried_only_when_the_activation_has_one() {
    let cases: Value = serde_json::from_str(CASES).unwrap();
    let by_name = |name: &str| {
        cases["cases"]
            .as_array()
            .unwrap()
            .iter()
            .find(|c| c["name"].as_str().unwrap().starts_with(name))
            .unwrap()
            .clone()
    };
    let explained = by_name("activation differs and an override");
    let drift = pin_drift(&activation_of(&explained), pin_of(&explained).as_ref()).unwrap();
    assert_eq!(
        drift.override_reason.as_deref(),
        Some("testing the next build")
    );
    let bare = by_name("activation differs with no override");
    let drift = pin_drift(&activation_of(&bare), pin_of(&bare).as_ref()).unwrap();
    assert_eq!(drift.override_reason, None);
}
