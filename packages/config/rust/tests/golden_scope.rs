//! Owning proof of which file may hold which key (scope, ancestors, wildcards, file placement),
//! over small schemas that inline the shape the real sections ship.
mod common;

use common::{cases, files, refs, text};
use fgos_config::schema::Schemas;
use fgos_config::scope::{judge, SourceKind};
use fgos_yaml_doc::{parse, Profile};
use serde_json::{json, Value};

const SOURCES: [(&str, SourceKind); 3] = [
    ("project", SourceKind::Project),
    ("global", SourceKind::Global),
    ("accounts", SourceKind::Accounts),
];

fn judged(schemas: &Schemas, source: SourceKind, yaml: &str) -> Vec<fgos_config::ConfigRefusal> {
    let doc = parse(yaml.as_bytes(), Profile::StrictConfig, "f.yaml").unwrap();
    judge(schemas, source, &doc.to_json().unwrap(), Some(&doc))
}

#[test]
fn scope_cases() {
    for case in cases("scope.v1.json") {
        let (id, input) = (case["id"].as_str().unwrap(), &case["input"]);
        let schema_files = files(&input["schemas"], true);
        let schemas = Schemas::parse(&refs(&schema_files)).unwrap();
        let yaml = text(&input["value"]);
        for (name, source) in SOURCES {
            let Some(want) = case["expect"].get(name) else {
                continue;
            };
            let got: Vec<Value> = judged(&schemas, source, &yaml)
                .iter()
                .map(|r| {
                    assert_eq!(r.file.as_deref(), Some("f.yaml"), "{id}/{name}");
                    json!([
                        r.code,
                        r.path,
                        r.detail.as_ref().and_then(|d| d.belongs_in.clone()),
                        r.line,
                        r.column
                    ])
                })
                .collect();
            assert_eq!(&Value::from(got), want, "{id}/{name}");
        }
    }
}

#[test]
fn a_refusal_names_the_global_role_and_never_a_value() {
    let schema_files = files(
        &json!({"gateway": ["x-fgos-scope: global-only", "type: object", "properties:", "  port: {type: string}"]}),
        true,
    );
    let schemas = Schemas::parse(&refs(&schema_files)).unwrap();
    let refusals = judged(
        &schemas,
        SourceKind::Project,
        "gateway:\n  port: sentinel-5d2f\n",
    );
    assert_eq!(refusals.len(), 1);
    assert_eq!(
        refusals[0]
            .detail
            .as_ref()
            .and_then(|d| d.belongs_in.as_deref()),
        Some("global")
    );
    let shown = format!("{} {:?}", refusals[0], refusals[0]);
    assert!(
        !shown.contains("sentinel-5d2f") && !shown.contains('/'),
        "{shown}"
    );
}

// The provider is an optional edge: replay this proof with --features host-provider, as the
// CLI builds it. Existing scope_cases proves placement, not the provider's pre-write guard.
#[cfg(all(unix, feature = "host-provider"))]
#[test]
fn project_only_patch_checks_real_targets_before_writing() {
    use fgos_config::provider::{answer, ConfigRequest, Verb};
    use std::{fs, process::Command};

    const CHILD: &str = "FGOS_SCOPE_PATCH_CASE";
    if let Ok(row) = std::env::var(CHILD) {
        let row: Value = serde_json::from_str(&row).unwrap();
        let dir = std::env::current_dir().unwrap();
        let root = dir.join("project");
        let files = [
            root.join(".fgos/config.yaml"),
            dir.join("home/.fgos/config.yaml"),
            dir.join("home/.fgos/private/accounts.yaml"),
        ];
        let original = b"# @fgos:v1\n# Keep this note byte-identical on refusal.\n";
        for file in &files {
            fs::create_dir_all(file.parent().unwrap()).unwrap();
            fs::write(file, original).unwrap();
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(file, fs::Permissions::from_mode(0o600)).unwrap();
        }
        let edits = row
            .get("edits")
            .cloned()
            .unwrap_or_else(|| json!([{"set": row["path"], "value": row["value"]}]));
        let patch = dir.join("patch.json");
        fs::write(&patch, serde_json::to_vec(&edits).unwrap()).unwrap();
        for project_only in [true, false] {
            let got = answer(&ConfigRequest {
                root: root.clone(),
                verb: Verb::Patch {
                    file: patch.clone(),
                    reason: "exercise project-only patch scope".into(),
                    global: row["global"].as_bool().unwrap(),
                    project_only,
                },
            });
            let want = if project_only {
                row["expect"].as_str()
            } else {
                row["withoutFlag"].as_str()
            };
            assert_eq!(got.as_ref().err().map(|r| r.reason), want, "{row}: {got:?}");
            if want.is_some() {
                for file in &files {
                    assert_eq!(
                        fs::read(file).unwrap(),
                        original,
                        "{} changed",
                        file.display()
                    );
                }
            } else {
                let done = got.unwrap();
                assert_eq!(done.exit, 0);
                let target = done.data["target"].as_str().unwrap();
                let index = match target {
                    ".fgos/config.yaml" => 0,
                    "~/.fgos/config.yaml" => 1,
                    "~/.fgos/private/accounts.yaml" => 2,
                    _ => panic!("unexpected target {target}"),
                };
                assert!(!done.data["applied"].as_array().unwrap().is_empty());
                assert_ne!(fs::read(&files[index]).unwrap(), original);
                for (i, file) in files.iter().enumerate() {
                    if i != index {
                        assert_eq!(fs::read(file).unwrap(), original);
                    }
                }
            }
            for file in &files {
                fs::write(file, original).unwrap();
            }
        }
        return;
    }

    let fixture = common::fixture("scope.v1.json");
    for row in fixture["patch-project-only"].as_array().unwrap() {
        let dir = common::temp("patch-scope", row["id"].as_str().unwrap());
        fs::create_dir_all(dir.join("home")).unwrap();
        // Isolate HOME and confinement in a child instead of racing the test process's env.
        let output = Command::new(std::env::current_exe().unwrap())
            .args([
                "--exact",
                "project_only_patch_checks_real_targets_before_writing",
                "--nocapture",
            ])
            .current_dir(&dir)
            .env(CHILD, row.to_string())
            .env("HOME", dir.join("home"))
            .env("FGOS_STATE_ROOT", dir.join("state"))
            .env_remove("FGOS_CONFINED")
            .output()
            .unwrap();
        assert!(
            output.status.success(),
            "{}\n{}\n{}",
            row["id"],
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
    }
}
