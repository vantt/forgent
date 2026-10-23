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
