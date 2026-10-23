//! Owning proof of the machine files: the private directory, the gateway token file, the
//! accounts-only read and the mode findings. Real files in temp directories, a real child process
//! for the held lock; the sentinels of a case never appear in any shown form of a refusal.
#![cfg(unix)]
mod common;

use std::fs;
use std::time::{Duration, Instant};

use fgos_config::detect::NoDetectors;
use fgos_config::machine::{accounts, ensure_private_dir, fix_modes, modes, token};
use fgos_config::snapshot::{snapshot, AccountsState, Context, SnapshotError};
use fgos_durable_file::Installed;
use serde_json::{json, Value};

#[path = "common/machine_fs.rs"]
mod machine_fs;
use machine_fs::{check_refusal, hold, lay, mode_of};

/// The child process of the held-lock case runs this test of the same binary.
#[test]
fn child_entry() {
    machine_fs::child_body();
}

fn findings(list: Vec<fgos_config::files::ModeFinding>) -> Value {
    let rows = list.iter().map(|f| {
        json!([
            f.file,
            format!("{:o}", f.expected),
            format!("{:o}", f.actual)
        ])
    });
    Value::Array(rows.collect())
}

#[test]
fn machine_file_cases() {
    let fixture = common::fixture("machine-files.v1.json");
    let (schemas, standard) = common::schemas_and_standard(&fixture);
    let ctx = Context {
        schemas: &schemas,
        standard: &standard,
        digest: "d",
        detectors: &NoDetectors,
    };
    for case in common::cases("machine-files.v1.json") {
        let (id, input, want) = (
            case["id"].as_str().unwrap(),
            &case["input"],
            &case["expect"],
        );
        let dir = common::temp("machine", id);
        let req = lay(&dir, input);
        let (global, locks) = (req.global_dir.clone(), dir.join("locks"));
        let wait = input["waitMs"].as_u64().unwrap_or(2000);
        let started = Instant::now();
        let result: Result<(), SnapshotError> = match input["op"].as_str().unwrap() {
            "ensure_dir" => ensure_private_dir(&global).map(drop),
            "modes" => modes(&global).and_then(|found| {
                assert_eq!(findings(found), want["findings"], "{id}");
                if input["fix"] == true {
                    assert_eq!(findings(fix_modes(&global)?), want["findings"], "{id}");
                    assert_eq!(findings(modes(&global)?), want["after"], "{id}");
                }
                Ok(())
            }),
            "token_ensure" => {
                let _holder = (input["holdLock"] == true).then(|| hold(&dir));
                let text = input["text"].as_str().unwrap_or_default().to_string();
                let made = match input["generate"] == true {
                    true => token::ensure(&global, &locks, wait, token::generate),
                    false => token::ensure(&global, &locks, wait, || Ok(text)),
                };
                made.map(|made| {
                    let result = if made == Installed::Created {
                        "created"
                    } else {
                        "exists"
                    };
                    assert_eq!(result, want["result"], "{id}");
                })
            }
            "token_read" => token::read(&global).map(|secret| {
                let text = secret.as_ref().map(|s| s.expose().to_string());
                assert_eq!(text.is_none(), want["absent"] == true, "{id}");
                if let Some(value) = want["value"].as_str() {
                    assert_eq!(text.as_deref(), Some(value), "{id}");
                }
                if let Some(length) = want["length"].as_u64() {
                    assert_eq!(text.map(|t| t.len() as u64), Some(length), "{id}");
                }
                if let Some(secret) = &secret {
                    assert!(!format!("{secret:?}").contains(secret.expose()), "{id}");
                }
            }),
            "accounts_read" => accounts::read(&ctx, &req).map(|view| {
                let state = match view.state {
                    AccountsState::Present => "present",
                    AccountsState::UnavailableConfined => "unavailable-confined",
                };
                assert_eq!(view.present, want["present"] == true, "{id}");
                assert_eq!(state, want["state"], "{id}");
                assert_eq!(view.value, want["value"], "{id}");
            }),
            _ => {
                let view = accounts::read(&ctx, &req)
                    .and_then(|view| snapshot(&ctx, &req).map(|full| (view, full)));
                view.map(|(view, full)| {
                    let runner = &view.value["runner"];
                    assert_eq!(
                        runner["llmAccounts"], full.value["runner"]["llmAccounts"],
                        "{id}"
                    );
                    let pools = runner["providers"].as_object().unwrap();
                    assert!(!pools.is_empty(), "{id}: the fixture holds a provider pool");
                    for (name, pool) in pools {
                        assert_eq!(
                            pool["accounts"], full.value["runner"]["providers"][name]["accounts"],
                            "{id}"
                        );
                    }
                })
            }
        };
        check_refusal(id, &input["sentinels"], want, result);
        if let Some(min) = want["minMs"].as_u64() {
            assert!(
                started.elapsed() >= Duration::from_millis(min),
                "{id}: gave up early"
            );
        }
        let (private, config) = (global.join("private"), &global);
        if let Some(bytes) = want["bytes"].as_str() {
            assert_eq!(
                fs::read_to_string(private.join("gateway-token")).unwrap(),
                bytes,
                "{id}"
            );
        }
        if let Some(length) = want["hexLength"].as_u64() {
            let text = fs::read_to_string(private.join("gateway-token")).unwrap();
            let hex = text.strip_suffix('\n').unwrap();
            assert!(
                hex.len() as u64 == length
                    && hex
                        .bytes()
                        .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase()),
                "{id}"
            );
        }
        if let Some(mode) = want["mode"].as_str() {
            assert_eq!(mode_of(&private.join("gateway-token")), mode, "{id}");
        }
        if let Some(mode) = want["dirMode"].as_str() {
            assert_eq!(mode_of(&private), mode, "{id}");
        }
        if let Some(rel) = want["absent"].as_str().filter(|_| want["code"].is_string()) {
            assert!(!config.join(rel).exists(), "{id}: wrote {rel}");
        }
        for (rel, mode) in want["modesAfter"].as_object().into_iter().flatten() {
            assert_eq!(
                mode_of(&config.join(rel)),
                mode.as_str().unwrap(),
                "{id}: {rel}"
            );
        }
        let _ = fs::remove_dir_all(&dir);
    }
}
