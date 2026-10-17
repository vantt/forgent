mod common;
use common::state_dir;
use fgos_terminal_control::port::*;
use fgos_terminal_control::record::*;
use fgos_terminal_control::store::{valid_key, Store};

fn incarnation() -> ServerIncarnation {
    ServerIncarnation {
        host: "h".into(),
        boot_id: "b".into(),
        pid_ns: "pid:[1]".into(),
        pid: 7,
        start_time: "9".into(),
        endpoint: "/s".into(),
    }
}

fn record(key: &str, pane: &str) -> AllocationRecord {
    AllocationRecord {
        v: VERSION,
        key: key.into(),
        group_key: "g".into(),
        driver: "mem".into(),
        server_incarnation: incarnation(),
        tab_id: "t1".into(),
        pane_id: pane.into(),
        allocated_at: 1,
        display: Display::default(),
        origin: Origin::Allocated,
    }
}

#[test]
fn a_record_is_published_once_and_never_overwritten() {
    let root = state_dir("publish-once");
    let store = Store::open(&root, "mem", &incarnation()).unwrap();
    assert!(store.publish_record(&record("a", "p1")).unwrap());
    assert!(!store.publish_record(&record("a", "p2")).unwrap());
    assert_eq!(store.read_record("a").unwrap().unwrap().pane_id, "p1");
    assert_eq!(store.record_keys().unwrap(), vec!["a".to_string()]);
}

#[test]
fn markers_are_one_shot_and_are_not_keys() {
    let root = state_dir("markers");
    let store = Store::open(&root, "mem", &incarnation()).unwrap();
    store.publish_record(&record("a", "p1")).unwrap();
    let marker = LaunchRequestedMarker { v: VERSION, key: "a".into(), at: 5 };
    assert!(store.publish_marker("a", MarkerKind::LaunchRequested, &marker).unwrap());
    assert!(!store.publish_marker("a", MarkerKind::LaunchRequested, &marker).unwrap());
    assert!(store.has_marker("a", MarkerKind::LaunchRequested));
    assert!(!store.has_marker("a", MarkerKind::Launched));
    assert_eq!(store.record_keys().unwrap(), vec!["a".to_string()]);
}

#[test]
fn the_group_hint_is_rewritten() {
    let root = state_dir("hint");
    let store = Store::open(&root, "mem", &incarnation()).unwrap();
    for (tab, at) in [("t1", 1), ("t2", 2)] {
        store.write_hint(&GroupHint { v: VERSION, group_key: "g".into(), tab_id: tab.into(), updated_at: at }).unwrap();
    }
    assert_eq!(store.read_hint("g").unwrap().unwrap().tab_id, "t2");
    assert!(store.read_hint("other").unwrap().is_none());
}

#[test]
fn a_different_incarnation_is_a_different_directory() {
    let root = state_dir("incarnations");
    let a = Store::open(&root, "mem", &incarnation()).unwrap();
    let mut other = incarnation();
    other.pid = 8;
    let b = Store::open(&root, "mem", &other).unwrap();
    a.publish_record(&record("a", "p1")).unwrap();
    assert!(b.read_record("a").unwrap().is_none());
}

#[cfg(unix)]
#[test]
fn directories_are_private() {
    use std::os::unix::fs::PermissionsExt;
    let root = state_dir("perms");
    let _ = Store::open(&root, "mem", &incarnation()).unwrap();
    let dir = root.join("terminal").join("mem").join(incarnation().id()).join("allocations");
    assert_eq!(std::fs::metadata(dir).unwrap().permissions().mode() & 0o777, 0o700);
}

#[test]
fn key_validation_matches_the_port_pattern() {
    for ok in ["a", "A1", "unit-run.12_x"] {
        assert!(valid_key(ok), "{ok}");
    }
    for bad in ["", ".a", "-a", "a b", "a/b", "a.released", "a.launched", "a.launch-requested"] {
        assert!(!valid_key(bad), "{bad}");
    }
    assert!(!valid_key(&"a".repeat(129)));
}
