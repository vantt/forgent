//! Owning proof that no error, finding or display form echoes a value (spec section 9, acceptance
//! 7 and 15): every case puts sentinels beside a fault and checks every text a person could read.
#![cfg(unix)]
mod common;

use std::fs;

use fgos_config::detect::NoDetectors;
use fgos_config::redact::{render_for_display, REDACTED};
use fgos_config::snapshot::{snapshot, Context, SnapshotError};
use fgos_config::write::commit;
use serde_json::Value;

/// What a person could read of one refusal: its text and both debug forms, with the YAML part.
fn shown(error: &SnapshotError) -> String {
    match error {
        SnapshotError::Refused(all) => all
            .iter()
            .map(|r| format!("{r} {r:?} {r:#?} {:?}", r.yaml))
            .collect(),
        SnapshotError::Io(error) => format!("{error} {error:?}"),
    }
}

fn codes(error: &SnapshotError) -> Vec<&'static str> {
    match error {
        SnapshotError::Refused(all) => all.iter().map(|r| r.code).collect(),
        SnapshotError::Io(_) => Vec::new(),
    }
}

#[test]
fn no_refusal_or_display_form_echoes_a_value() {
    let fixture = common::fixture("no-echo.v1.json");
    let (schemas, standard) = common::schemas_and_standard(&fixture);
    let ctx = Context {
        schemas: &schemas,
        standard: &standard,
        digest: "d",
        detectors: &NoDetectors,
    };
    for case in common::cases("no-echo.v1.json") {
        let (id, want) = (case["id"].as_str().unwrap(), &case["expect"]);
        let pad = case["input"]["pad"].as_u64().unwrap_or(0) as usize;
        let input: Value =
            serde_json::from_str(&case["input"].to_string().replace("@PAD@", &"a".repeat(pad)))
                .unwrap();
        let dir = common::temp("echo", id);
        let roots = common::lay_out(&dir, &input);
        for root in ["project", "home"] {
            fs::create_dir_all(dir.join(root)).unwrap();
        }
        let (text, found) = match input["kind"].as_str().unwrap() {
            "render" => {
                let snap = snapshot(&ctx, &roots).unwrap_or_else(|e| panic!("{id}: {e:?}"));
                let view = render_for_display(&snap, &schemas);
                for path in want["redacted"].as_array().unwrap() {
                    let at = format!("/{}", path.as_str().unwrap().replace('.', "/"));
                    assert_eq!(
                        view.pointer(&at),
                        Some(&Value::from(REDACTED)),
                        "{id}: {path}"
                    );
                    assert_ne!(
                        snap.value.pointer(&at),
                        Some(&Value::from(REDACTED)),
                        "{id}: the in-process value is carried"
                    );
                }
                for (path, value) in want["kept"].as_object().unwrap() {
                    assert_eq!(
                        view.pointer(&format!("/{}", path.replace('.', "/"))),
                        Some(value),
                        "{id}"
                    );
                }
                (format!("{view} {snap:?}"), Vec::new())
            }
            kind => {
                let error = match kind {
                    "write" => {
                        let (req, _) = common::write_request(&dir, &input, roots);
                        commit(&ctx, &req, &common::writer(&input["writer"])).err()
                    }
                    _ => snapshot(&ctx, &roots).err(),
                };
                let error = error.unwrap_or_else(|| panic!("{id}: expected a refusal"));
                (shown(&error), codes(&error))
            }
        };
        if let Some(code) = want["code"].as_str() {
            assert_eq!(found.first().copied(), Some(code), "{id}: {text}");
        }
        for sentinel in input["sentinels"].as_array().unwrap() {
            let sentinel = sentinel.as_str().unwrap();
            assert!(!text.contains(sentinel), "{id}: a value leaked: {text}");
            assert!(
                !text.contains(&sentinel[9..]),
                "{id}: part of a value leaked: {text}"
            );
        }
        let _ = fs::remove_dir_all(&dir);
    }
}

#[test]
fn config_has_no_resolver_for_secret_references() {
    let manifest = fs::read_to_string(concat!(env!("CARGO_MANIFEST_DIR"), "/Cargo.toml")).unwrap();
    assert!(
        !manifest.contains("fgos-secrets"),
        "Config must not depend on the Secrets resolver"
    );
}
