//! The limits loader: the embedded contract's defaults overlaid by the
//! effective `mailbox` section the host hands it.
#![cfg(unix)]
mod common;

use fgos_mailbox::limits::{load, LimitsError};
use serde_json::{json, Value};

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
    // A config written while pointer mode existed loads, its retired key reported.
    let retired = json!({ "mailbox": { "postToolUse": { "pointerClis": ["codex"] } } });
    assert_eq!(
        load(Some(&retired)).unwrap().ignored_keys,
        vec!["mailbox.postToolUse.pointerClis"]
    );
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
    wrong(
        json!({ "mailbox": { "maxOffers": [3] } }),
        "mailbox.maxOffers",
    );
    assert_eq!(
        load(Some(
            &json!({ "mailbox": { "maxOffers": 4_294_967_296_u64 } })
        )),
        Err(LimitsError::Rejected("mailbox.maxOffers".to_string()))
    );
    // The word a hook outcome and `status` name each error by.
    let codes = [
        LimitsError::WrongType(String::new()),
        LimitsError::Rejected(String::new()),
        LimitsError::Unreadable(String::new()),
    ]
    .map(|e| e.code());
    assert_eq!(codes, ["wrong-type", "rejected", "unreadable"]);
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
