//! Owning proof of the two-stage move of the account pools and the gateway token out of the global
//! JSON: destination first, the observer seam for the crash windows, destination wins, the JSON
//! bytes kept, the lock. Real files in temp directories and a real child process for the lock.
#![cfg(unix)]
mod common;

use std::fs;
use std::io;
use std::path::Path;
use std::time::{Duration, Instant};

use fgos_config::detect::NoDetectors;
use fgos_config::relocate::{copy, finish, plan, Held, MoveRequest, Moved, Pending, Step};
use fgos_config::snapshot::{snapshot, Context, SessionClass, Snapshot, SnapshotError};
use fgos_yaml_doc::{parse, Profile};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};

#[path = "common/machine_fs.rs"]
mod machine_fs;
use machine_fs::{check_refusal, hold, lay, mode_of};

/// The child process of the held-lock case runs this test of the same binary.
#[test]
fn child_entry() {
    machine_fs::child_body();
}

enum Outcome {
    Moved(Moved),
    Plan(Vec<Pending>),
    Snap(Snapshot),
}

fn read(path: &Path) -> Option<Vec<u8>> {
    fs::read(path).ok()
}

/// The accounts file as data.
fn accounts_json(global: &Path) -> Option<Value> {
    let bytes = read(&global.join("private/accounts.yaml"))?;
    parse(&bytes, Profile::StrictConfig, "accounts.yaml")
        .ok()?
        .to_json()
        .ok()
}

fn state(held: Held) -> &'static str {
    match held {
        Held::Missing => "missing",
        Held::Equal => "equal",
        Held::Differs => "differs",
    }
}

/// Asserts everything `want` says about the last result.
fn check_result(id: &str, want: &Value, got: Result<Outcome, SnapshotError>) {
    if want["io"] == true {
        assert!(
            matches!(got, Err(SnapshotError::Io(_))),
            "{id}: expected an abort"
        );
        return;
    }
    let (outcome, result) = match got {
        Ok(outcome) => (Some(outcome), Ok(())),
        Err(error) => (None, Err(error)),
    };
    check_refusal(id, &want["sentinels"], want, result);
    match outcome {
        Some(Outcome::Moved(moved)) => {
            if want["paths"].is_array() {
                assert_eq!(json!(moved.paths), want["paths"], "{id}");
            }
            if let Some(reformatted) = want["reformatted"].as_bool() {
                assert_eq!(moved.reformatted, reformatted, "{id}");
            }
        }
        Some(Outcome::Plan(rows)) => {
            let rows: Vec<Value> = rows
                .iter()
                .map(|p| json!([p.path, p.entries, state(p.destination)]))
                .collect();
            assert_eq!(Value::Array(rows), want["plan"], "{id}");
        }
        Some(Outcome::Snap(snap)) => {
            assert!(want["snapshot"] == true, "{id}: unexpected snapshot");
            let notices: Vec<Value> = snap.notices.iter().map(|(n, p)| json!([n, p])).collect();
            assert_eq!(Value::Array(notices), want["notices"], "{id}");
            for (path, value) in want["at"].as_object().into_iter().flatten() {
                let pointer = format!("/{}", path.replace('.', "/"));
                assert_eq!(snap.value.pointer(&pointer), Some(value), "{id}: {path}");
            }
        }
        None => {}
    }
}

/// The files a case expects to be left as it says.
fn check_files(
    id: &str,
    want: &Value,
    global: &Path,
    original: &Option<Vec<u8>>,
    after_first: &Option<Vec<u8>>,
) {
    let config = read(&global.join("config.json"));
    if want["globalUnchanged"] == true {
        assert_eq!(&config, original, "{id}: the global file changed");
    }
    if let Some(extra) = want["globalAppended"].as_str() {
        let expected = [original.clone().unwrap(), extra.as_bytes().to_vec()].concat();
        assert_eq!(config, Some(expected), "{id}");
    }
    if want["global"].is_array() {
        let expected = common::text(&want["global"]);
        assert_eq!(
            String::from_utf8(config.unwrap()).unwrap(),
            expected,
            "{id}"
        );
    }
    let accounts = read(&global.join("private/accounts.yaml"));
    if let Some(absent) = want["accountsAbsent"].as_bool() {
        assert_eq!(accounts.is_none(), absent, "{id}: accounts file presence");
    }
    if want["accounts"].is_object() {
        assert_eq!(
            accounts_json(global).as_ref(),
            Some(&want["accounts"]),
            "{id}"
        );
    }
    if let Some(text) = want["accountsText"].as_str() {
        assert!(
            String::from_utf8(accounts.clone().unwrap())
                .unwrap()
                .contains(text),
            "{id}"
        );
    }
    if want["accountsStable"] == true {
        assert_eq!(
            &accounts, after_first,
            "{id}: the accounts file was written again"
        );
    }
    let token = read(&global.join("private/gateway-token"));
    if let Some(absent) = want["tokenAbsent"].as_bool() {
        assert_eq!(token.is_none(), absent, "{id}: token file presence");
    }
    if let Some(text) = want["token"].as_str() {
        assert_eq!(
            token.map(|t| String::from_utf8(t).unwrap()),
            Some(text.to_string()),
            "{id}"
        );
    }
    for (rel, mode) in want["modes"].as_object().into_iter().flatten() {
        assert_eq!(
            mode_of(&global.join(rel)),
            mode.as_str().unwrap(),
            "{id}: {rel}"
        );
    }
    check_backups(id, want, global, original);
}

fn check_backups(id: &str, want: &Value, global: &Path, original: &Option<Vec<u8>>) {
    let dir = global.join("private/config-migrate");
    let found: Vec<_> = fs::read_dir(&dir)
        .map(|d| d.flatten().collect())
        .unwrap_or_default();
    if let Some(count) = want["backups"].as_u64() {
        assert_eq!(found.len() as u64, count, "{id}: backups");
    }
    let Some(entry) = found
        .first()
        .filter(|_| want["backups"].as_u64() == Some(1))
    else {
        return;
    };
    let original = original.clone().unwrap();
    if let Some(name) = want["backupName"].as_str() {
        assert_eq!(entry.file_name().to_str(), Some(name), "{id}");
        let revision = format!("{:x}", Sha256::digest(&original));
        assert!(
            name.starts_with(&revision[..16]),
            "{id}: named by the revision"
        );
    }
    if want["backupEqualsOriginal"] == true {
        assert_eq!(read(&entry.path()), Some(original), "{id}");
    }
    for (key, path) in [("backupMode", entry.path()), ("backupDirMode", dir)] {
        if let Some(mode) = want[key].as_str() {
            assert_eq!(mode_of(&path), mode, "{id}: {key}");
        }
    }
}

#[test]
fn relocate_cases() {
    let fixture = common::fixture("relocate.v1.json");
    let (schemas, standard) = common::schemas_and_standard(&fixture);
    let ctx = Context {
        schemas: &schemas,
        standard: &standard,
        digest: "d",
        detectors: &NoDetectors,
    };
    let writer = common::writer(&json!({"session": "relocate-test"}));
    for case in common::cases("relocate.v1.json") {
        let (id, input, want) = (
            case["id"].as_str().unwrap(),
            &case["input"],
            &case["expect"],
        );
        let dir = common::temp("relocate", id);
        let req = lay(&dir, input);
        let global = req.global_dir.clone();
        let original = read(&global.join("config.json"));
        let (mut holders, mut after_first) = (Vec::new(), None);
        let steps = input["steps"].as_array().unwrap();
        for (at, step) in steps.iter().enumerate() {
            if let Some(extra) = input["before"][at.to_string()].as_object() {
                lay(&dir, &json!({"files": extra["files"]}));
            }
            if step["holdLock"] == true {
                holders.push(hold(&dir));
            }
            let mut roots = req.clone();
            if step["confined"] == true {
                roots.class = SessionClass::Confined;
            }
            let wait = step["waitMs"].as_u64().unwrap_or(2000);
            let mreq = MoveRequest {
                roots,
                lock_root: dir.join("locks"),
                lock_wait_ms: wait,
            };
            let mut observe = |s: Step| -> io::Result<()> {
                let name = format!("{s:?}");
                if step["editAt"] == name.as_str() {
                    let mut bytes = fs::read(global.join("config.json"))?;
                    bytes.extend(step["append"].as_str().unwrap().as_bytes());
                    fs::write(global.join("config.json"), bytes)?;
                }
                match step["abortAt"] == name.as_str() {
                    true => Err(io::Error::other("observer abort")),
                    false => Ok(()),
                }
            };
            let started = Instant::now();
            let got = match step["op"].as_str().unwrap() {
                "plan" => plan(&ctx, &global).map(Outcome::Plan),
                "copy" => copy(&ctx, &mreq, &writer, &mut observe).map(Outcome::Moved),
                "finish" => {
                    let checked = step["checked"] != false;
                    finish(&ctx, &mreq, checked, &mut observe).map(Outcome::Moved)
                }
                _ => snapshot(&ctx, &req).map(Outcome::Snap),
            };
            if at == 0 {
                after_first = read(&global.join("private/accounts.yaml"));
            }
            if at + 1 < steps.len() {
                match (&got, step["abortAt"].is_string()) {
                    (Ok(_), false) | (Err(SnapshotError::Io(_)), true) => continue,
                    _ => panic!("{id}: step {at} ended unexpectedly"),
                }
            }
            check_result(id, want, got);
            if let Some(min) = want["minMs"].as_u64() {
                assert!(
                    started.elapsed() >= Duration::from_millis(min),
                    "{id}: gave up early"
                );
            }
        }
        check_files(id, want, &global, &original, &after_first);
        drop(holders);
        let _ = fs::remove_dir_all(&dir);
    }
}
