#![cfg(target_os = "linux")]
mod sync_support;
use fgos_event_store::{errors::ErrorCode, sync::SyncRecord};
use sync_support::*;
#[test]
fn offline_errors_are_durable_append_and_read_continue_and_setup_repins_url() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    a.append(1);
    assert_eq!(
        a.sync(false).unwrap_err().code,
        ErrorCode::EventStoreRefspecMissing
    );
    a.setup();
    a.sync(false).unwrap();
    std::fs::rename(&w.remote, w.root.join("offline")).unwrap();
    a.append(1);
    assert!(a.sync(false).is_err());
    let record: SyncRecord =
        serde_json::from_slice(&std::fs::read(a.layout.root.join("sync.json")).unwrap()).unwrap();
    assert!(record.error.is_some());
    assert!(record.unpublished_since.is_some());
    a.append(1);
    assert_eq!(a.hashes().len(), 3);
    std::fs::rename(w.root.join("offline"), &w.remote).unwrap();
    a.sync(false).unwrap();
    let next = w.root.join("next.git");
    git(&w.root, &["init", "--bare", "-q", next.to_str().unwrap()]);
    git(
        &a.root,
        &["remote", "set-url", "origin", next.to_str().unwrap()],
    );
    assert_eq!(
        a.sync(false).unwrap_err().code,
        ErrorCode::EventStoreRemoteChanged
    );
    a.setup();
    a.sync(false).unwrap();
    assert_eq!(
        git(&next, &["rev-parse", "refs/fgos/events/machine-aa"]),
        a.tip()
    );
}

#[test]
fn fetch_succeeds_push_rejection_is_recorded_and_next_sync_retries() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    a.setup();
    a.append(1);
    a.sync(false).unwrap();
    git(
        &w.remote,
        &["config", "receive.hideRefs", "refs/fgos/events/"],
    );
    a.append(1);
    assert!(a.sync(false).is_err());
    let status = fgos_event_store::sync::sync_status(&a.layout).unwrap();
    assert!(status.error.unwrap().contains("push not acknowledged"));
    assert!(status.unpublished_since.is_some());
    assert_eq!(a.hashes().len(), 2);
    git(&w.remote, &["config", "--unset", "receive.hideRefs"]);
    a.sync(false).unwrap();
    assert_eq!(
        git(&w.remote, &["rev-parse", "refs/fgos/events/machine-aa"]),
        a.tip()
    );
}

#[test]
fn no_push_sync_leaves_the_remote_alone_and_records_the_tail_as_unpublished() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    a.setup();
    a.append(1);
    a.sync(false).unwrap();
    let published = git(&w.remote, &["rev-parse", "refs/fgos/events/machine-aa"]);
    a.append(1);
    a.sync(true).unwrap();
    assert_ne!(a.tip(), published);
    assert_eq!(
        git(&w.remote, &["rev-parse", "refs/fgos/events/machine-aa"]),
        published
    );
    let status = fgos_event_store::sync::sync_status(&a.layout).unwrap();
    assert!(status.error.is_none());
    assert!(status.unpublished_since.is_some());
    a.sync(false).unwrap();
    assert_eq!(
        git(&w.remote, &["rev-parse", "refs/fgos/events/machine-aa"]),
        a.tip()
    );
    assert!(fgos_event_store::sync::sync_status(&a.layout)
        .unwrap()
        .unpublished_since
        .is_none());
}

#[test]
fn an_opportunistic_sync_skips_a_held_seal_lock_instead_of_waiting_for_it() {
    use fgos_holder_lock::{acquire, Acquire, Mode, Resource, Wait};
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    a.setup();
    a.append(1);
    let held = match acquire(
        &Resource::new("event-seal", a.layout.seal_lock()),
        Mode::Ex,
        Wait::Ms(5_000),
        2000,
    ) {
        Acquire::Acquired(handle) => handle,
        other => panic!("{other:?}"),
    };
    let started = std::time::Instant::now();
    let skipped = a.sync_opportunistic().unwrap();
    assert!(skipped.busy, "the held lock is reported, not waited for");
    assert!(
        started.elapsed() < std::time::Duration::from_secs(2),
        "a try-lock never queues: {:?}",
        started.elapsed()
    );
    assert!(
        !a.layout.root.join("sync.json").exists(),
        "a skipped sync is not a push attempt: the interval does not restart"
    );
    drop(held);
    let ran = a.sync_opportunistic().unwrap();
    assert!(!ran.busy);
    assert!(a.layout.root.join("sync.json").exists());
}
