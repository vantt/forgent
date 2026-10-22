//! The limits loader: the embedded contract's defaults overlaid by the
//! `mailbox` section of the project config (plan decision 4), and the
//! capped read of that config file.
#![cfg(unix)]
mod common;

use fgos_mailbox::limits::{load, read_project_config, LimitsError};
use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;

fn defaults() -> fgos_mailbox::limits::Loaded {
    load(None).expect("the embedded contract loads")
}

#[test]
fn without_project_config_the_loader_yields_the_contract_defaults() {
    let loaded = defaults();
    assert_eq!(loaded.limits, common::limits_from_contract());
    assert_eq!(loaded.hook, common::hook_limits_from_contract());
    assert!(loaded.ignored_keys.is_empty());
    // A config file without a mailbox section is the same as none.
    assert_eq!(load(Some(&json!({ "other": { "x": 1 } }))).unwrap(), loaded);
}

#[test]
fn a_project_config_value_overrides_its_default_and_leaves_the_rest() {
    let config =
        json!({ "mailbox": { "queue": { "cap": 7 }, "hook": { "breaker": { "pauseSec": 5 } } } });
    let loaded = load(Some(&config)).unwrap();

    let mut expected = defaults();
    expected.limits.queue.cap = 7;
    expected.hook.hook.breaker.pause_sec = 5;
    assert_eq!(loaded, expected);
}

#[test]
fn an_unknown_mailbox_key_is_ignored_and_reported_to_the_caller() {
    let config = json!({ "mailbox": { "queue": { "capp": 1 }, "nope": true, "maxOffers": 4 } });
    let loaded = load(Some(&config)).unwrap();

    assert_eq!(
        loaded.ignored_keys,
        vec!["mailbox.nope", "mailbox.queue.capp"]
    );
    assert_eq!(loaded.limits.max_offers, 4);
}

#[test]
fn a_wrong_type_or_a_value_the_core_rejects_makes_the_section_invalid_and_names_the_key() {
    let wrong = |config: Value, key: &str| {
        assert_eq!(
            load(Some(&config)),
            Err(LimitsError::WrongType(key.to_string())),
            "{config}"
        );
    };
    wrong(json!({ "mailbox": 3 }), "mailbox");
    wrong(json!({ "mailbox": { "queue": 5 } }), "mailbox.queue");
    wrong(
        json!({ "mailbox": { "queue": { "cap": "7" } } }),
        "mailbox.queue.cap",
    );
    wrong(
        json!({ "mailbox": { "queue": { "cap": -1 } } }),
        "mailbox.queue.cap",
    );
    wrong(
        json!({ "mailbox": { "queue": { "cap": 1.5 } } }),
        "mailbox.queue.cap",
    );
    wrong(
        json!({ "mailbox": { "maxOffers": { "x": 1 } } }),
        "mailbox.maxOffers",
    );
    assert_eq!(
        load(Some(
            &json!({ "mailbox": { "maxOffers": 4_294_967_296_u64 } })
        )),
        Err(LimitsError::Rejected("mailbox.maxOffers".to_string()))
    );
}

#[test]
fn the_empty_section_setup_writes_and_the_opt_in_flag_load_as_the_defaults() {
    for section in [
        json!({}),
        json!({ "enabled": true }),
        json!({ "enabled": false }),
    ] {
        let loaded = load(Some(&json!({ "mailbox": section })))
            .unwrap_or_else(|e| panic!("{section} must load: {e}"));
        assert_eq!(
            loaded,
            defaults(),
            "{section}: every value from the contract"
        );
        assert!(
            loaded.ignored_keys.is_empty(),
            "{section}: the setup flag is a contract key, never reported as unknown"
        );
    }
}

#[test]
fn the_harness_only_key_is_dropped_before_deserialising() {
    let config = json!({ "mailbox": { "hook": { "p95TargetMs": 10 } } });
    let loaded = load(Some(&config)).expect("the hook's strict section never sees the harness key");
    assert_eq!(loaded, defaults());
    assert!(
        loaded.ignored_keys.is_empty(),
        "a contract key is never reported as unknown"
    );
}

/// A fresh `.fgos` directory under the target's temporary space.
fn fgos_dir(tag: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("mbx-limits-{tag}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn the_project_config_is_read_only_as_a_capped_regular_json_object() {
    let dir = fgos_dir("read");
    assert_eq!(
        read_project_config(&dir, 1024),
        Ok(None),
        "a missing file is no config"
    );

    fs::write(
        dir.join("config.json"),
        r#"{"mailbox":{"queue":{"cap":7}}}"#,
    )
    .unwrap();
    assert_eq!(
        read_project_config(&dir, 1024),
        Ok(Some(json!({ "mailbox": { "queue": { "cap": 7 } } })))
    );
    assert!(matches!(
        read_project_config(&dir, 10),
        Err(LimitsError::Unreadable(_))
    ));

    fs::write(dir.join("config.json"), "[1]").unwrap();
    assert!(matches!(
        read_project_config(&dir, 1024),
        Err(LimitsError::Unreadable(_))
    ));

    fs::remove_file(dir.join("config.json")).unwrap();
    fs::write(dir.join("elsewhere.json"), "{}").unwrap();
    std::os::unix::fs::symlink(dir.join("elsewhere.json"), dir.join("config.json")).unwrap();
    assert!(matches!(
        read_project_config(&dir, 1024),
        Err(LimitsError::Unreadable(_))
    ));
    fs::remove_dir_all(&dir).unwrap();
}
