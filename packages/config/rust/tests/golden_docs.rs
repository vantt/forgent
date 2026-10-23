//! Owning proof of the comment renderer for an existing file over `contracts/fixtures/docs.v1.json`:
//! which keys have missing or drifted doc lines, what the refresh writes, that `@fgos:why` lines and
//! free notes keep their text and order, and that a second refresh changes nothing.
#![cfg(unix)]
mod common;

use std::fs;

use common::text;
use fgos_config::detect::NoDetectors;
use fgos_config::docs::{scan, DocKind};
use fgos_config::snapshot::{Context, SnapshotError};
use fgos_config::write::{refresh, Edit, Step};
use fgos_yaml_doc::path::{format_path, parse_path};
use serde_json::{json, Value};

fn kind(kind: DocKind) -> &'static str {
    match kind {
        DocKind::Missing => "missing",
        DocKind::Drift => "drift",
    }
}

#[test]
fn doc_cases() {
    let fixture = common::fixture("docs.v1.json");
    let (schemas, standard) = common::schemas_and_standard(&fixture);
    let ctx = Context {
        schemas: &schemas,
        standard: &standard,
        digest: "d",
        detectors: &NoDetectors,
    };
    for case in common::cases("docs.v1.json") {
        let (id, input, want) = (
            case["id"].as_str().unwrap(),
            &case["input"],
            &case["expect"],
        );
        let dir = common::temp("docs", id);
        let roots = common::lay_out(&dir, input);
        fs::create_dir_all(dir.join("project")).unwrap();
        fs::create_dir_all(dir.join("home")).unwrap();
        let writer = common::writer(&input["writer"]);
        let target = want["scan"].as_str().unwrap_or("project/.fgos/config.yaml");
        if !want["findings"].is_null() || want["code"].is_string() {
            let name = target.rsplit('/').next().unwrap();
            let got = scan(&ctx, name, &fs::read(dir.join(target)).unwrap());
            match (&got, want["code"].as_str()) {
                (Err(refusal), Some(code)) => assert_eq!(refusal.code, code, "{id}"),
                (Ok(found), None) => {
                    let found: Vec<Value> = found
                        .iter()
                        .map(|f| json!([format_path(&f.path), kind(f.kind)]))
                        .collect();
                    assert_eq!(Value::Array(found), want["findings"], "{id}: findings");
                }
                _ => panic!("{id}: scan gave {got:?}"),
            }
        }
        let before = fs::read(dir.join("project/.fgos/config.yaml")).ok();
        let (mut req, _) = common::write_request(&dir, &json!({"edits": [], "reason": "r"}), roots);
        let outcome = match input["mixed"].is_object() {
            true => {
                let mixed = &input["mixed"];
                req.edits = vec![
                    Edit::Docs,
                    Edit::Set {
                        path: parse_path(mixed["set"].as_str().unwrap()).unwrap(),
                        value: mixed["value"].clone(),
                    },
                ];
                fgos_config::write::commit(&ctx, &req, &writer)
            }
            false => refresh(&ctx, req, &writer, |_: Step| Ok(())),
        };
        let after = || fs::read(dir.join("project/.fgos/config.yaml")).ok();
        let refusal = &want["refresh"];
        match (&outcome, refusal["code"].as_str()) {
            (Err(SnapshotError::Refused(found)), Some(code)) => {
                assert_eq!(found[0].code, code, "{id}: {}", found[0]);
                let keyword = found[0].detail.as_ref().and_then(|d| d.keyword.as_deref());
                assert_eq!(keyword, refusal["keyword"].as_str(), "{id}: keyword");
                assert_eq!(after(), before, "{id}: a refusal changed the file");
            }
            (Ok(result), None) => {
                if let Some(applied) = refusal["applied"].as_array() {
                    assert_eq!(result.applied.len(), applied.len(), "{id}: applied");
                }
                if refusal["no_dir"] == true {
                    assert!(!dir.join("project/.fgos").exists(), "{id}: a directory");
                }
                match want["files"].as_object() {
                    Some(files) => {
                        for (rel, lines) in files {
                            let bytes = fs::read_to_string(dir.join(rel)).unwrap();
                            assert_eq!(bytes, text(lines), "{id}: {rel}");
                        }
                    }
                    None => assert_eq!(after(), before, "{id}: nothing to refresh"),
                }
                // The second refresh finds no drift: same bytes, nothing applied.
                let (again, _) = common::write_request(
                    &dir,
                    &json!({"edits": [], "reason": "r"}),
                    common::lay_out(&dir, &json!({})),
                );
                let settled = after();
                let second = refresh(&ctx, again, &writer, |_: Step| Ok(())).unwrap();
                assert!(second.applied.is_empty(), "{id}: second refresh applied");
                assert_eq!(after(), settled, "{id}: second refresh changed bytes");
            }
            _ => panic!("{id}: refresh gave {outcome:?}"),
        }
        let _ = fs::remove_dir_all(&dir);
    }
}
