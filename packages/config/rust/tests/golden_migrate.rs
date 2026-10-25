//! Owning proof of the project migration's decisions over `contracts/fixtures/migrate.v1.json`:
//! what is kept, dropped (and why), converted or refused, the YAML that results, the machine
//! overrides and the equivalence check; plus one rehearsal of this repository's own project file
//! (pinned in `authoring-source.config.json`) on the bundled schemas and standard. The file-system
//! behaviour (backup, tombstone, crash, concurrency) is owned by `migrate_files.rs`.
#![cfg(unix)]
mod common;

use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use fgos_config::detect::NoDetectors;
use fgos_config::files::TOMBSTONE;
use fgos_config::migrate::{project, MigrationReport};
use fgos_config::schema::Schemas;
use fgos_config::snapshot::{snapshot, Context, SnapshotError};
use fgos_config::standard::Standard;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};

use common::text;

fn tree(dir: &Path) -> BTreeMap<String, Vec<u8>> {
    let mut out = BTreeMap::new();
    let mut todo = vec![dir.to_path_buf()];
    while let Some(next) = todo.pop() {
        for entry in fs::read_dir(next).into_iter().flatten().flatten() {
            let path = entry.path();
            match entry.file_type().unwrap().is_dir() {
                true => todo.push(path),
                false => {
                    let rel = path
                        .strip_prefix(dir)
                        .unwrap()
                        .to_string_lossy()
                        .into_owned();
                    out.insert(rel, fs::read(&path).unwrap());
                }
            }
        }
    }
    out
}

fn lists(report: &MigrationReport) -> Value {
    json!({
        "kept": report.kept,
        "unknown_kept": report.unknown_kept,
        "dropped_redundant": report.dropped_redundant,
        "dropped_retired": report.dropped_retired,
        "dropped_out_of_scope": report.dropped_out_of_scope,
        "doc_converted": report.doc_converted,
        "machine_overrides": report.machine_overrides,
        "resumed": report.resumed,
        "already_migrated": report.already_migrated,
        "dry_run": report.dry_run,
    })
}

#[test]
fn migration_cases() {
    let fixture = common::fixture("migrate.v1.json");
    let (schemas, standard) = common::schemas_and_standard(&fixture);
    let ctx = Context {
        schemas: &schemas,
        standard: &standard,
        digest: "d",
        detectors: &NoDetectors,
    };
    for case in common::cases("migrate.v1.json") {
        let (id, input, want) = (
            case["id"].as_str().unwrap(),
            &case["input"],
            &case["expect"],
        );
        let dir = common::temp("migrate", id);
        let roots = common::lay_out(&dir, input);
        fs::create_dir_all(dir.join("project")).unwrap();
        fs::create_dir_all(dir.join("home/.fgos")).unwrap();
        let before = tree(&dir);
        let opts = common::migrate_options(&dir, input["accept"] == true, input["dry_run"] == true);
        let got = project(
            &ctx,
            &roots,
            &common::writer(&input["writer"]),
            &opts,
            |_| Ok(()),
        );
        for needle in want["absent"].as_array().into_iter().flatten() {
            let said = format!("{got:?}");
            assert!(
                !said.contains(needle.as_str().unwrap()),
                "{id}: the output holds a value"
            );
        }
        match (&got, want["code"].as_str()) {
            (Err(SnapshotError::Refused(found)), Some(code)) => {
                assert_eq!(found[0].code, code, "{id}: {}", found[0]);
                let paths: Vec<&str> = found.iter().filter_map(|r| r.path.as_deref()).collect();
                if let Some(expect) = want["paths"].as_array() {
                    let expect: Vec<&str> = expect.iter().map(|p| p.as_str().unwrap()).collect();
                    assert_eq!(paths, expect, "{id}: paths");
                }
                let keyword = found[0].detail.as_ref().and_then(|d| d.keyword.as_deref());
                assert_eq!(keyword, want["keyword"].as_str(), "{id}: keyword");
                let kept = tree(&dir);
                let unchanged = kept.iter().all(|(p, b)| before.get(p) == Some(b));
                assert!(
                    unchanged && kept.len() == before.len(),
                    "{id}: a refusal changed a file"
                );
            }
            (Ok(report), None) => {
                for (key, value) in want["report"].as_object().into_iter().flatten() {
                    assert_eq!(&lists(report)[key], value, "{id}: report {key}");
                }
                let after = tree(&dir);
                for (rel, lines) in want["files"].as_object().into_iter().flatten() {
                    let bytes = String::from_utf8(after[rel].clone()).unwrap();
                    assert_eq!(bytes, text(lines), "{id}: {rel}");
                }
                if input["dry_run"] == true {
                    assert_eq!(after, before, "{id}: a dry run wrote");
                }
                if let Some(backup) = &report.backup {
                    let original = before["project/.fgos/config.json"].clone();
                    assert_eq!(
                        after[&format!("project/{backup}")],
                        original,
                        "{id}: backup"
                    );
                }
            }
            _ => panic!("{id}: got {got:?}"),
        }
        let _ = fs::remove_dir_all(&dir);
    }
}

#[test]
fn this_repositorys_project_file_migrates_with_the_same_effective_value() {
    let (schemas, digest) = Schemas::bundled().unwrap();
    let standard = Standard::bundled(&schemas).unwrap();
    let ctx = Context {
        schemas: &schemas,
        standard: &standard,
        digest: &digest,
        detectors: &NoDetectors,
    };
    let record = common::fixture("repo-differences.v1.json");
    let source =
        fs::read(common::contracts().join("fixtures/authoring-source.config.json")).unwrap();
    assert_eq!(
        format!("{:x}", Sha256::digest(&source)),
        record["source"]["sha256"],
        "pinned copy"
    );
    let dir = common::temp("migrate", "real");
    fs::create_dir_all(dir.join("project/.fgos")).unwrap();
    fs::create_dir_all(dir.join("home/.fgos")).unwrap();
    fs::write(dir.join("project/.fgos/config.json"), &source).unwrap();
    let roots = common::lay_out(&dir, &json!({}));
    let opts = common::migrate_options(&dir, false, false);
    let writer = common::writer(&json!({"session": "vantt"}));
    let report = project(&ctx, &roots, &writer, &opts, |_| Ok(())).unwrap();
    // The one-key sections `gateway` and `lock` go, the tier ladder `$comment` converts, 25 values stay (nine of them are this repository's own pools, which never fall back to Codex).
    assert_eq!(report.kept.len(), 25);
    assert_eq!(report.dropped_redundant.len(), 247);
    assert_eq!(report.dropped_retired, ["lock.predecessorKillWaitMs"]);
    assert_eq!(
        report.dropped_out_of_scope,
        ["gateway.port", "gateway.token"]
    );
    assert_eq!(report.doc_converted, ["runner.$comment"]);
    assert!(report.machine_overrides.is_empty() && report.unknown_kept.is_empty());
    let yaml = fs::read_to_string(dir.join("project/.fgos/config.yaml")).unwrap();
    assert!(
        yaml.lines().count() < 200,
        "the file shrinks to the project's own differences"
    );
    assert_eq!(
        fs::read_to_string(dir.join("project/.fgos/config.json")).unwrap(),
        format!("{TOMBSTONE}\n")
    );
    // The migrated project reads back through the snapshot with the value the old file means once
    // the dropped sections and the comment are set aside (read through its own legacy-JSON source).
    let mut old: Value = serde_json::from_slice(&source).unwrap();
    old.as_object_mut()
        .unwrap()
        .retain(|k, _| k != "gateway" && k != "lock");
    old["runner"].as_object_mut().unwrap().remove("$comment");
    let twin = common::temp("migrate", "real-twin");
    fs::create_dir_all(twin.join("project/.fgos")).unwrap();
    fs::create_dir_all(twin.join("home/.fgos")).unwrap();
    fs::write(twin.join("project/.fgos/config.json"), old.to_string()).unwrap();
    let before = snapshot(&ctx, &common::lay_out(&twin, &json!({})))
        .unwrap()
        .value;
    assert_eq!(snapshot(&ctx, &roots).unwrap().value, before);
    let _ = fs::remove_dir_all(&twin);
    let _ = fs::remove_dir_all(&dir);
}
