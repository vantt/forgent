//! Owning proof of the write transaction's edit semantics over `contracts/fixtures/write.v1.json`:
//! byte fidelity, comment blocks, redundancy, refusals and their order, and that a refusal leaves
//! every file byte-identical. Cases write real files under a temp directory.
#![cfg(unix)]
mod common;

use std::collections::BTreeMap;
use std::fs;
use std::os::unix::fs::{symlink, PermissionsExt};
use std::path::Path;

use common::text;
use fgos_config::detect::NoDetectors;
use fgos_config::snapshot::{Context, SnapshotError};
use fgos_config::write::commit;
use serde_json::Value;
use sha2::{Digest, Sha256};

/// Every regular file under `dir` (lock files aside) with its bytes.
fn tree(dir: &Path) -> BTreeMap<String, Vec<u8>> {
    let mut out = BTreeMap::new();
    let mut todo = vec![dir.to_path_buf()];
    while let Some(next) = todo.pop() {
        for entry in fs::read_dir(next).into_iter().flatten().flatten() {
            let path = entry.path();
            let kind = fs::symlink_metadata(&path).unwrap().file_type();
            if path.ends_with("locks") || kind.is_symlink() {
                continue;
            }
            match kind.is_dir() {
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

fn mode(path: &Path) -> u32 {
    fs::metadata(path).unwrap().permissions().mode() & 0o777
}

#[test]
fn write_cases() {
    let fixture = common::fixture("write.v1.json");
    let (schemas, standard) = common::schemas_and_standard(&fixture);
    let ctx = Context {
        schemas: &schemas,
        standard: &standard,
        digest: "d",
        detectors: &NoDetectors,
    };
    for case in common::cases("write.v1.json") {
        let (id, input, want) = (
            case["id"].as_str().unwrap(),
            &case["input"],
            &case["expect"],
        );
        let dir = common::temp("write", id);
        let roots = common::lay_out(&dir, input);
        // The project root and the home directory exist before any write; creating them is not a door's job.
        fs::create_dir_all(dir.join("project")).unwrap();
        fs::create_dir_all(dir.join("home")).unwrap();
        for (link, to) in input["links"].as_object().into_iter().flatten() {
            symlink(to.as_str().unwrap(), dir.join(link)).unwrap();
        }
        for (rel, bits) in input["modes"].as_object().into_iter().flatten() {
            fs::set_permissions(
                dir.join(rel),
                fs::Permissions::from_mode(bits.as_u64().unwrap() as u32),
            )
            .unwrap();
        }
        let (req, file) = common::write_request(&dir, input, roots);
        let before = tree(&dir);
        let got = commit(&ctx, &req, &common::writer(&input["writer"]));
        let refused = want.get("code").or(want.get("yaml")).is_some();
        match (&got, refused) {
            (Err(SnapshotError::Refused(found)), true) => {
                let first = &found[0];
                match want["code"].as_str() {
                    Some(code) => assert_eq!(first.code, code, "{id}: {first}"),
                    None => {
                        let rule = first.yaml.as_ref().map(|y| y.rule);
                        assert_eq!(
                            (first.code, rule),
                            ("config-parse", want["yaml"].as_str()),
                            "{id}"
                        );
                    }
                }
                if let Some(keyword) = want["keyword"].as_str() {
                    assert_eq!(
                        first.detail.as_ref().and_then(|d| d.keyword.as_deref()),
                        Some(keyword),
                        "{id}"
                    );
                }
                assert_eq!(tree(&dir), before, "{id}: a refusal changed a file");
            }
            (Ok(result), false) => {
                let applied: Vec<Value> = result
                    .applied
                    .iter()
                    .map(|(p, u)| serde_json::json!([p, u]))
                    .collect();
                if let Some(list) = want["applied"].as_array() {
                    assert_eq!(&applied, list, "{id}");
                }
                if let Some(list) = want["notices"].as_array() {
                    let notices: Vec<Value> = result
                        .notices
                        .iter()
                        .map(|(i, p)| serde_json::json!([i, p]))
                        .collect();
                    assert_eq!(&notices, list, "{id}");
                }
                if let Some(writer) = want["writer_id"].as_str() {
                    assert_eq!(result.writer_id, writer, "{id}");
                }
                let after = tree(&dir);
                match want["files"].as_object() {
                    Some(expect) => {
                        for (rel, lines) in expect {
                            let bytes = String::from_utf8(after[rel].clone()).unwrap();
                            assert_eq!(bytes, text(lines), "{id}: {rel}");
                        }
                    }
                    None => assert_eq!(after, before, "{id}"),
                }
                assert_eq!(
                    fs::read(dir.join(file))
                        .ok()
                        .map(|b| format!("{:x}", Sha256::digest(b)))
                        .unwrap_or("absent".into()),
                    result.new_revision,
                    "{id}: new revision"
                );
            }
            _ => panic!("{id}: expected refusal {refused}, got {got:?}"),
        }
        for (rel, bits) in want["modes"].as_object().into_iter().flatten() {
            assert_eq!(
                mode(&dir.join(rel)),
                bits.as_u64().unwrap() as u32,
                "{id}: {rel}"
            );
        }
        if want["no_lock"] == true {
            assert!(
                !dir.join("project/.fgos/locks").exists(),
                "{id}: a lock file exists"
            );
        }
        if want["no_dir"] == true {
            assert!(
                !dir.join("project/.fgos").exists(),
                "{id}: a directory was created"
            );
        }
        let _ = fs::remove_dir_all(&dir);
    }
}
