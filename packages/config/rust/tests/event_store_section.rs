//! Owning proof of the `eventStore` section reader: defaults from the standard, the minimums of every numeric key,
//! and what a refused config file means for the Event Store's triggers.
use fgos_config::detect::NoDetectors;
use fgos_config::event_store::{EventStoreConfig, Invalid};
use fgos_config::machine;
use fgos_config::snapshot::SnapshotError;
use fgos_config::ConfigRefusal;
use serde_json::{json, Value};

fn read(section: Option<Value>) -> Result<EventStoreConfig, Invalid> {
    let ctx = machine::context(&NoDetectors).unwrap();
    EventStoreConfig::from_section(section.as_ref(), &ctx)
}
fn refused(path: Option<&str>) -> SnapshotError {
    let mut refusal = ConfigRefusal::new("config-parse");
    refusal.path = path.map(str::to_owned);
    SnapshotError::Refused(vec![refusal])
}
fn when_refused(error: &SnapshotError, strict: bool) -> Option<EventStoreConfig> {
    let ctx = machine::context(&NoDetectors).unwrap();
    EventStoreConfig::when_refused(error, strict, &ctx)
}

#[test]
fn an_unset_section_takes_every_value_of_the_standard() {
    let config = read(None).unwrap();
    assert_eq!(
        config,
        EventStoreConfig {
            remote: "origin".into(),
            seal_interval_sec: 300,
            seal_coalesce_sec: 30,
            sync_interval_sec: 300,
            rebuild_max_attempts: 5,
        }
    );
    assert_eq!(read(Some(json!({}))).unwrap(), config);
}

#[test]
fn a_key_that_is_set_wins_and_the_others_keep_the_standard() {
    let config = read(Some(json!({"seal": {"intervalSec": 7}, "sync": {"intervalSec": 0}, "remote": "backup"}))).unwrap();
    assert_eq!((config.seal_interval_sec, config.seal_coalesce_sec, config.sync_interval_sec), (7, 30, 0));
    assert_eq!((config.remote.as_str(), config.rebuild_max_attempts), ("backup", 5));
}

#[test]
fn every_numeric_key_refuses_a_value_under_its_minimum_or_that_is_no_integer() {
    for (section, bad) in [
        (json!({"seal": {"intervalSec": 0}}), "seal.intervalSec"),
        (json!({"seal": {"coalesceSec": 0}}), "seal.coalesceSec"),
        (json!({"sync": {"intervalSec": -1}}), "sync.intervalSec"),
        (json!({"rebuild": {"maxAttempts": -1}}), "rebuild.maxAttempts"),
        (json!({"sync": {"intervalSec": 1.5}}), "sync.intervalSec"),
        (json!({"sync": {"intervalSec": "300"}}), "sync.intervalSec"),
        (json!({"seal": {"intervalSec": 9_007_199_254_740_992_u64}}), "seal.intervalSec"),
    ] {
        assert_eq!(read(Some(section.clone())), Err(Invalid(bad.into())), "{section}");
    }
    assert!(read(Some(json!({"sync": {"intervalSec": 0}, "rebuild": {"maxAttempts": 0}}))).is_ok(), "0 is the minimum of both");
    assert!(read(Some(json!({"seal": {"intervalSec": 300.0}}))).is_ok(), "a whole number written as a float is an integer");
}

#[test]
fn a_section_or_sub_section_that_is_no_object_and_an_empty_remote_are_refused() {
    for (section, bad) in [
        (Value::Null, "eventStore"),
        (json!([]), "eventStore"),
        (json!({"seal": null}), "seal"),
        (json!({"sync": []}), "sync"),
        (json!({"rebuild": 3}), "rebuild"),
        (json!({"remote": ""}), "remote"),
        (json!({"remote": 3}), "remote"),
    ] {
        assert_eq!(read(Some(section.clone())), Err(Invalid(bad.into())), "{section}");
    }
}

#[test]
fn a_refused_file_that_does_not_name_the_section_gives_a_config_that_never_publishes() {
    let unrelated = refused(Some("runner.executor"));
    let degraded = when_refused(&unrelated, false).unwrap();
    assert_eq!((degraded.sync_interval_sec, degraded.seal_interval_sec), (0, 300));
    assert_eq!(when_refused(&refused(None), false), Some(degraded));
}

#[test]
fn a_refusal_that_names_the_section_or_reaches_a_strict_caller_is_the_callers() {
    assert_eq!(when_refused(&refused(Some("eventStore")), false), None);
    assert_eq!(when_refused(&refused(Some("eventStore.sync.intervalSec")), false), None);
    assert_eq!(when_refused(&refused(Some("runner.executor")), true), None);
    let io = SnapshotError::Io(std::io::Error::other("disk"));
    assert_eq!(when_refused(&io, false), None, "an operating-system error is no refusal of a file");
}
