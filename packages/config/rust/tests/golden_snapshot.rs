//! Owning proof of the snapshot: ladder, merge rules, absent versus null, provenance, trusted root,
//! confined accounts, detected values and refusals. Cases write real files under a temp directory.
#![cfg(unix)]
mod common;

use std::fs;
use std::path::PathBuf;

use common::{cases, files, refs, text};
use fgos_config::detect::Detectors;
use fgos_config::schema::Schemas;
use fgos_config::snapshot::{
    snapshot, AccountsState, Context, SessionClass, SnapshotError, SnapshotRequest,
};
use fgos_config::standard::Standard;
use fgos_yaml_doc::path::{format_path, parse_path};
use fgos_yaml_doc::{Segment, Value as Doc};
use serde_json::{json, Value};

/// The caller's side of the port: answers by formatted path from the fixture.
struct Fixed(Value);

impl Detectors for Fixed {
    fn detect(&self, path: &[Segment]) -> Option<Doc> {
        self.0.get(format_path(path)).map(Doc::from_json)
    }
}

pub fn at<'a>(value: &'a Value, path: &str) -> Option<&'a Value> {
    parse_path(path)
        .unwrap()
        .iter()
        .try_fold(value, |node, segment| match segment {
            Segment::Key(key) => node.get(key.as_str()),
            Segment::Index(index) => node.get(*index),
        })
}

fn temp(id: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-config-snap-{id}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    dir
}

fn write(dir: &std::path::Path, input: &Value) -> SnapshotRequest {
    for (rel, lines) in input["files"].as_object().unwrap() {
        let path = dir.join(rel);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, text(lines)).unwrap();
    }
    let project = dir.join("project");
    SnapshotRequest {
        trusted_root: if dir.join("main").exists() {
            dir.join("main")
        } else {
            project.clone()
        },
        project_root: project,
        global_dir: dir.join("home/.fgos"),
        class: if input["class"] == "confined" {
            SessionClass::Confined
        } else {
            SessionClass::Unconfined
        },
    }
}

#[test]
fn snapshot_cases() {
    for case in cases("snapshot.v1.json") {
        let (id, input, want) = (
            case["id"].as_str().unwrap(),
            &case["input"],
            &case["expect"],
        );
        let (schema_files, standard_files) = (
            files(&input["schemas"], true),
            files(&input["standard"], false),
        );
        let schemas = Schemas::parse(&refs(&schema_files)).unwrap();
        let standard = Standard::parse(&refs(&standard_files), &schemas).unwrap();
        let dir = temp(id);
        let req = write(&dir, input);
        let ctx = Context {
            schemas: &schemas,
            standard: &standard,
            digest: "d",
            detectors: &Fixed(input["detect"].clone()),
        };
        let got = snapshot(&ctx, &req);
        if let Some(errors) = want["errors"].as_array() {
            let Err(SnapshotError::Refused(found)) = got else {
                panic!("{id}: expected refusals")
            };
            assert_eq!(found.len(), errors.len(), "{id}: {found:?}");
            for (r, e) in found.iter().zip(errors) {
                let detail = r.detail.clone().unwrap_or_default();
                let checks = [
                    (e[0].as_str(), Some(r.code)),
                    (e[1].as_str(), r.path.as_deref()),
                    (e[2].as_str(), r.file.as_deref()),
                    (
                        e[5].as_str().filter(|k| !k.is_empty()),
                        detail.keyword.as_deref(),
                    ),
                ];
                for (want, have) in checks.into_iter().filter(|(w, _)| w.is_some()) {
                    assert_eq!(have, want, "{id}: {r}");
                }
                if let Some(line) = e[3].as_u64() {
                    assert_eq!(
                        (r.line, r.column),
                        (Some(line as u32), e[4].as_u64().map(|c| c as u32)),
                        "{id}"
                    );
                }
                if let Some(layers) = e[6].as_str().filter(|l| !l.is_empty()) {
                    assert_eq!(detail.layers.join(","), layers, "{id}");
                }
                assert!(
                    !format!("{r} {r:?}").contains("sentinel"),
                    "{id}: a value leaked"
                );
            }
            continue;
        }
        let snap = got.unwrap_or_else(|e| panic!("{id}: {e:?}"));
        for (path, value) in want["at"].as_object().into_iter().flatten() {
            assert_eq!(at(&snap.value, path), Some(value), "{id}: {path}");
        }
        for path in want["absent"].as_array().into_iter().flatten() {
            assert_eq!(
                at(&snap.value, path.as_str().unwrap()),
                None,
                "{id}: {path}"
            );
        }
        let origin = |path: &str| {
            snap.origins
                .iter()
                .find(|o| format_path(&o.path) == path)
                .unwrap_or_else(|| panic!("{id}: no origin {path}"))
        };
        for p in want["prov"].as_array().into_iter().flatten() {
            let found = &origin(p[0].as_str().unwrap()).provenance;
            assert_eq!(
                (
                    found.layer,
                    found.role,
                    found.file.as_deref(),
                    found.line.map(u64::from),
                    found.column.map(u64::from)
                ),
                (
                    p[1].as_str().unwrap(),
                    p[2].as_str().unwrap(),
                    p[3].as_str(),
                    p[4].as_u64(),
                    p[5].as_u64()
                ),
                "{id}: {}",
                p[0]
            );
        }
        for path in want["undescribed"].as_array().into_iter().flatten() {
            assert!(!origin(path.as_str().unwrap()).described, "{id}: {path}");
        }
        for path in want["described"].as_array().into_iter().flatten() {
            assert!(origin(path.as_str().unwrap()).described, "{id}: {path}");
        }
        for role in want["absent_sources"].as_array().into_iter().flatten() {
            assert_eq!(
                snap.revisions[role.as_str().unwrap()],
                "absent",
                "{id}: {role}"
            );
        }
        for role in want["no_revision"].as_array().into_iter().flatten() {
            assert!(
                !snap.revisions.contains_key(role.as_str().unwrap()),
                "{id}: {role}"
            );
        }
        if let Some(state) = want["accounts"].as_str() {
            let confined = snap.accounts == AccountsState::UnavailableConfined;
            assert_eq!(confined, state == "unavailable-confined", "{id}");
            let required = snap.require_accounts();
            assert_eq!(
                required.err().map(|r| r.code),
                confined.then_some("config-accounts-unavailable-confined"),
                "{id}"
            );
        }
        let _ = fs::remove_dir_all(&dir);
    }
}

#[test]
fn a_comment_only_edit_changes_the_revision_and_not_the_value() {
    let schema_files = files(&json!({"s": ["type: object"]}), true);
    let schemas = Schemas::parse(&refs(&schema_files)).unwrap();
    let standard = Standard::parse(&[], &schemas).unwrap();
    let ctx = Context {
        schemas: &schemas,
        standard: &standard,
        digest: "d",
        detectors: &Fixed(json!({})),
    };
    let dir = temp("comment-only");
    let req = write(
        &dir,
        &json!({"files": {"project/.fgos/config.yaml": ["s:", "  a: 1"]}}),
    );
    let before = snapshot(&ctx, &req).unwrap();
    fs::write(
        dir.join("project/.fgos/config.yaml"),
        "s:\n  # why\n  a: 1\n",
    )
    .unwrap();
    let after = snapshot(&ctx, &req).unwrap();
    let first =
        fgos_yaml_doc::parse(b"s:\n  a: 1\n", fgos_yaml_doc::Profile::StrictConfig, "f").unwrap();
    assert_eq!(before.revisions["project"], first.revision());
    assert_eq!(before.value, after.value);
    assert_ne!(before.revisions["project"], after.revisions["project"]);
    let _ = fs::remove_dir_all(&dir);
}
