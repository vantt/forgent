mod reader_support;
mod sync_support;
use fgos_event_store::{envelope::Seal, errors::ErrorCode, sync::sync_status};
use fgos_git::*;
use sync_support::*;

#[test]
fn outside_merge_on_own_ref_is_never_authenticated_or_pushed() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    a.setup();
    a.append(1);
    a.sync(false).unwrap();
    let original = a.tip();
    let forged = a.with_port(|p| {
        let other = reader_support::seal(
            p,
            &a.repo,
            vec![],
            &[reader_support::event('f', 1, 1)],
            &a.machine,
        );
        let own = Oid::parse(&original, a.repo.object_format()).unwrap();
        let seal = Seal::Merge {
            v: 1,
            machine_id: a.machine.clone(),
            parents: [original.clone(), other.as_str().into()],
        };
        reader_support::commit(
            p,
            &a.repo,
            vec![own, other],
            vec![(b"seal.json", seal.canonical_line().unwrap())],
        )
    });
    git(
        &a.root,
        &["update-ref", "refs/fgos/events/machine-aa", forged.as_str()],
    );
    assert_eq!(
        a.sync(false).unwrap_err().code,
        ErrorCode::EventStoreRefMoved
    );
    assert_eq!(
        git(&w.remote, &["rev-parse", "refs/fgos/events/machine-aa"]),
        original
    );
    assert!(sync_status(&a.layout)
        .unwrap()
        .error
        .unwrap()
        .contains("event-store-ref-moved"));
    a.append(1);
    assert_eq!(
        a.sync(false).unwrap_err().code,
        ErrorCode::EventStoreRefMoved
    );
    assert!(a
        .layout
        .stream(&fgos_event_store::layout::StreamId::parse("project").unwrap())
        .closed()
        .read_dir()
        .unwrap()
        .next()
        .is_some());
}

#[test]
fn own_mirror_rewind_still_refuses_publication() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    a.setup();
    a.append(1);
    a.sync(false).unwrap();
    let old = a.tip();
    a.append(1);
    a.sync(false).unwrap();
    let baseline = sync_status(&a.layout).unwrap().tips;
    git(
        &w.remote,
        &["update-ref", "refs/fgos/events/machine-aa", &old],
    );
    a.append(1);
    assert_eq!(
        a.sync(false).unwrap_err().code,
        ErrorCode::EventStoreMirrorRewound
    );
    assert_eq!(sync_status(&a.layout).unwrap().tips, baseline);
    assert_eq!(
        git(&w.remote, &["rev-parse", "refs/fgos/events/machine-aa"]),
        old
    );
}

#[test]
fn shared_own_origin_bound_has_one_error_code() {
    use fgos_event_store::{append::Positions, walk::own_origin_bounded};
    let published = Positions::from([("own:project".into(), 3), ("foreign:project".into(), 9)]);
    let bounds = Positions::from([("own:project".into(), 2)]);
    assert_eq!(
        own_origin_bounded(&published, "own", &bounds)
            .unwrap_err()
            .code,
        ErrorCode::EventStoreRefTampered
    );
    assert!(own_origin_bounded(
        &published,
        "own",
        &Positions::from([("own:project".into(), 3)])
    )
    .is_ok());
}

#[test]
fn steady_sync_prunes_previously_authenticated_event_blobs_and_delta_extends_positions() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    let b = w.clone("b", "machine-bb");
    a.setup();
    b.setup();
    a.append(2);
    a.sync(false).unwrap();
    b.append(1);
    b.sync(false).unwrap();
    let name = "refs/fgos/remotes/origin/events/machine-aa";
    let baseline = sync_status(&b.layout).unwrap();
    assert_eq!(baseline.positions[name].values().copied().max(), Some(2));
    // An authenticated commit is a stop: its event bytes are never opened again.
    // Temporarily remove just that loose blob to falsify an accidental full walk.
    let blob = git(
        &b.root,
        &["rev-parse", &format!("{}:events.jsonl", a.tip())],
    );
    let path = b
        .layout
        .common_dir
        .join("objects")
        .join(&blob[..2])
        .join(&blob[2..]);
    let bytes = std::fs::read(&path).unwrap();
    std::fs::remove_file(&path).unwrap();
    let result = b.sync(true);
    std::fs::write(&path, bytes).unwrap();
    result.unwrap();
    a.append(1);
    a.sync(false).unwrap();
    b.sync(false).unwrap();
    assert_eq!(
        sync_status(&b.layout).unwrap().positions[name]
            .values()
            .copied()
            .max(),
        Some(3)
    );
    assert_eq!(b.hashes().len(), 4);
}

#[test]
fn sync_record_rejects_unknown_fields_and_versions() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    a.setup();
    a.append(1);
    a.sync(false).unwrap();
    let path = a.layout.root.join("sync.json");
    let mut value: serde_json::Value =
        serde_json::from_slice(&std::fs::read(&path).unwrap()).unwrap();
    value["unexpected"] = true.into();
    std::fs::write(&path, serde_json::to_vec(&value).unwrap()).unwrap();
    assert!(sync_status(&a.layout).is_err());
    value.as_object_mut().unwrap().remove("unexpected");
    value["v"] = 2.into();
    std::fs::write(&path, serde_json::to_vec(&value).unwrap()).unwrap();
    assert!(sync_status(&a.layout).is_err());
}

#[test]
fn real_sigkill_after_merge_cas_before_push_authenticates_only_the_recorded_candidate() {
    use std::os::unix::process::ExitStatusExt;
    use std::{
        io::{BufRead, BufReader},
        process::{Command, Stdio},
    };
    let w = World::new();
    let a = w.clone("a", "test-aa2345");
    let b = w.clone("b", "test-aa2345");
    a.setup();
    b.setup();
    a.append(1);
    b.append(1);
    a.sync(false).unwrap();
    let remote = a.tip();
    let mut child = Command::new(env!("CARGO_BIN_EXE_fgos-event-store-file-driver"))
        .arg("sync")
        .arg(&b.layout.common_dir)
        .arg("AfterSyncReconcile")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .spawn()
        .unwrap();
    let mut line = String::new();
    BufReader::new(child.stdout.take().unwrap())
        .read_line(&mut line)
        .unwrap();
    assert_eq!(line.trim(), "STOP");
    let merged = b.tip();
    assert_eq!(
        git(&b.root, &["show", "-s", "--format=%P", &merged])
            .split_whitespace()
            .count(),
        2
    );
    assert_eq!(
        git(&w.remote, &["rev-parse", "refs/fgos/events/test-aa2345"]),
        remote
    );
    child.kill().unwrap();
    assert_eq!(child.wait().unwrap().signal(), Some(9));
    b.sync(false).unwrap();
    assert_eq!(b.tip(), merged);
    assert_eq!(
        git(&w.remote, &["rev-parse", "refs/fgos/events/test-aa2345"]),
        merged
    );
    b.append(1);
    b.sync(false).unwrap();
    assert_eq!(b.hashes().len(), 3);
}

#[test]
fn failed_reconcile_keeps_the_prior_merge_authenticated() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    let b = w.clone("b", "machine-aa");
    a.setup();
    b.setup();
    a.append(1);
    b.append(1);
    a.sync(false).unwrap();
    b.sync(true).unwrap();
    let prior = b.tip();
    a.append(1);
    a.sync(false).unwrap();
    let lock = b.layout.common_dir.join("refs/fgos/events/machine-aa.lock");
    std::fs::write(&lock, "fixture-owned lock").unwrap();
    assert!(b.sync(true).is_err());
    assert_eq!(b.tip(), prior);
    std::fs::remove_file(lock).unwrap();
    b.sync(false).unwrap();
    assert_eq!(b.hashes().len(), 3);
}

#[test]
fn credentialless_unreachable_http_remote_fails_fast_and_records_the_error() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
    let address = listener.local_addr().unwrap();
    drop(listener);
    let url = format!("http://{address}/events.git");
    git(&a.root, &["remote", "set-url", "origin", &url]);
    a.setup();
    a.append(1);
    let start = std::time::Instant::now();
    assert_eq!(a.sync(false).unwrap_err().code, ErrorCode::EventStoreIo);
    assert!(start.elapsed() < std::time::Duration::from_secs(10));
    let status = sync_status(&a.layout).unwrap();
    assert!(status.error.unwrap().contains("Git:"));
    assert!(status.unpublished_since.is_some());
    assert_eq!(a.hashes().len(), 1);
}

#[test]
fn outside_merge_before_first_append_cannot_be_laundered_by_reconciliation() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    let b = w.clone("b", "machine-aa");
    a.setup();
    b.setup();
    a.append(1);
    a.sync(false).unwrap();
    b.sync(true).unwrap();
    assert!(!b.layout.store().exists());
    let original = a.tip();
    let forged = a.with_port(|p| {
        let other = reader_support::seal(
            p,
            &a.repo,
            vec![],
            &[reader_support::event('f', 1, 1)],
            &a.machine,
        );
        let seal = Seal::Merge {
            v: 1,
            machine_id: a.machine.clone(),
            parents: [original.clone(), other.as_str().into()],
        };
        reader_support::commit(
            p,
            &a.repo,
            vec![
                Oid::parse(&original, a.repo.object_format()).unwrap(),
                other,
            ],
            vec![(b"seal.json", seal.canonical_line().unwrap())],
        )
    });
    git(
        &b.root,
        &[
            "fetch",
            "--no-tags",
            a.root.to_str().unwrap(),
            forged.as_str(),
        ],
    );
    git(
        &b.root,
        &["update-ref", "refs/fgos/events/machine-aa", forged.as_str()],
    );
    assert_eq!(
        b.sync(false).unwrap_err().code,
        ErrorCode::EventStoreRefMoved
    );
    b.append(1);
    assert_eq!(
        b.sync(false).unwrap_err().code,
        ErrorCode::EventStoreRefMoved
    );
    assert_eq!(
        git(&w.remote, &["rev-parse", "refs/fgos/events/machine-aa"]),
        original
    );
}

#[test]
fn unpublished_summary_rejects_mismatched_layout_before_opening_its_lock() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    let b = w.clone("b", "machine-bb");
    // If the lock path is touched first, this directory produces an I/O error.
    std::fs::create_dir(b.layout.seal_lock()).unwrap();
    let error = fgos_event_store::sync::guarded_unpublished_summary(
        &a.driver,
        &a.repo,
        fgos_event_store::sync::SyncRequest {
            layout: &b.layout,
            machine: &a.machine,
            remote: "origin",
            no_push: true,
            held_ranks: &[],
            hot_lock_depth: 0,
        },
    )
    .unwrap_err();
    assert!(error.to_string().contains("repository/layout mismatch"));
}
