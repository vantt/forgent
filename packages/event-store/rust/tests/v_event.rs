#![cfg(target_os = "linux")]
mod reader_support;
mod sync_support;
use fgos_event_store::{
    envelope::Seal,
    receipt::Receipt,
    seal::{seal, SealRequest},
    sync::{sync_status, unpublished_summary},
};
use fgos_git::*;
use sync_support::*;
#[test]
fn v_event_mirrors_divergence_receipts_coverage_and_never_force() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    let b = w.clone("b", "machine-aa");
    for c in [&a, &b] {
        c.setup();
        c.append(2);
    }
    a.append_stream("local", 1);
    a.append_stream("branch:private", 1);
    a.sync(false).unwrap();
    let remote_before = a.tip();
    seal(
        &b.driver,
        &b.repo,
        SealRequest {
            layout: &b.layout,
            machine: &b.machine,
            stream: &fgos_event_store::layout::StreamId::parse("project").unwrap(),
            held_ranks: &[],
            hot_lock_depth: 0,
            opportunistic: false,
        },
    )
    .unwrap();
    let own_before = b.tip();
    b.with_port(|p| {
        let summary = unpublished_summary(p, &b.repo, &b.layout, &b.machine, "origin").unwrap();
        assert!(!summary[0].sealed_pushed);
        let r = RefName::parse("refs/fgos/events/machine-aa").unwrap();
        let rejected = p.push_refs(&b.repo, "origin", &[(r.clone(), r)]).unwrap();
        assert!(matches!(
            rejected.refs[0].1,
            PushOutcome::RejectedNonFastForward { .. }
        ));
        p.fetch_refs(
            &b.repo,
            "origin",
            &["+refs/fgos/events/*:refs/fgos/remotes/origin/events/*".into()],
        )
        .unwrap();
    });
    assert_eq!(b.tip(), own_before);
    assert_eq!(
        git(&w.remote, &["rev-parse", "refs/fgos/events/machine-aa"]),
        remote_before
    );
    let synced = b.sync(false).unwrap();
    assert!(synced.mirrors_changed);
    let merged = b.tip();
    assert_eq!(
        git(&b.root, &["show", "-s", "--format=%P", &merged]),
        format!("{own_before} {remote_before}")
    );
    assert_eq!(
        git(&b.root, &["ls-tree", "--name-only", &merged]),
        "seal.json"
    );
    assert_eq!(
        git(&b.root, &["show", "-s", "--format=%ct", &merged]),
        "1792299600"
    );
    a.sync(false).unwrap();
    assert_eq!(a.hashes(), b.hashes());
    assert_eq!(a.hashes().len(), 4);
    let receipt = Receipt::read(
        &b.layout
            .stream(&fgos_event_store::layout::StreamId::parse("project").unwrap())
            .sealed(),
    )
    .unwrap();
    assert_eq!(receipt.last_seq, 2);
    assert!(receipt.cover.values().all(|n| *n == 2));
    b.with_port(|p| {
        assert!(
            unpublished_summary(p, &b.repo, &b.layout, &b.machine, "origin").unwrap()[0]
                .sealed_pushed
        )
    });
    assert!(sync_status(&b.layout).unwrap().unpublished_since.is_none());
    // Ref namespace on the remote is exactly the own project ref.
    assert_eq!(
        git(&w.remote, &["for-each-ref", "--format=%(refname)"]),
        "refs/fgos/events/machine-aa"
    );
}
#[test]
fn rewound_mirror_keeps_authenticated_baseline_and_forged_own_origin_is_refused() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    let b = w.clone("b", "machine-bb");
    a.setup();
    b.setup();
    a.append(1);
    a.sync(false).unwrap();
    let old = a.tip();
    a.append(1);
    a.sync(false).unwrap();
    b.append(1);
    b.sync(false).unwrap();
    let before = sync_status(&b.layout).unwrap().tips;
    git(
        &w.remote,
        &["update-ref", "refs/fgos/events/machine-aa", &old],
    );
    b.append(1);
    assert!(b
        .sync(false)
        .unwrap()
        .warnings
        .iter()
        .any(|w| w.contains("event-store-mirror-rewound")));
    assert_eq!(
        sync_status(&b.layout).unwrap().tips["refs/fgos/remotes/origin/events/machine-aa"],
        before["refs/fgos/remotes/origin/events/machine-aa"]
    );
    assert_eq!(
        git(&w.remote, &["rev-parse", "refs/fgos/events/machine-bb"]),
        b.tip()
    );
    git(
        &w.remote,
        &["update-ref", "refs/fgos/events/machine-aa", &a.tip()],
    );
    b.sync(false).unwrap();
    // Attacker copies B's origin but invents its next sequence on A's machine ref.
    let identity = fgos_event_store::identity::StoreIdentity::open(&b.layout, &b.machine).unwrap();
    let forged = a.with_port(|p| {
        let mut event = reader_support::event('a', 4, 2);
        event.origin = identity.store_id;
        reader_support::rehash(&mut event);
        let old = Oid::parse(&a.tip(), a.repo.object_format()).unwrap();
        reader_support::seal(p, &a.repo, vec![old], &[event], "machine-aa")
    });
    git(
        &a.root,
        &[
            "push",
            "-q",
            "origin",
            &format!("{}:refs/fgos/events/machine-aa", forged.as_str()),
        ],
    );
    b.append(1);
    assert!(b
        .sync(false)
        .unwrap()
        .warnings
        .iter()
        .any(|w| w.contains("event-store-ref-tampered")));
    assert_eq!(
        git(&w.remote, &["rev-parse", "refs/fgos/events/machine-bb"]),
        b.tip()
    );
}
#[test]
fn legacy_is_distributed_only_at_the_tracked_fence_pin() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    a.setup();
    a.append(1);
    let (legacy,fence)=a.with_port(|p|{
  let from="a".repeat(40);
  let seal=Seal::Legacy{from_commit:from.clone(),tree_of_fgos_events:"b".repeat(40)};
  let legacy=reader_support::commit(p,&a.repo,vec![],vec![(b"seal.json",seal.canonical_line().unwrap()),(b"events.jsonl",b"{\"ts\":\"2026-01-01T00:00:00.000Z\",\"seq\":1}\n".to_vec())]);
  let fence=serde_json::to_vec(&serde_json::json!({"legacyRefOid":legacy.as_str(),"sealDigest":seal.digest().unwrap(),"fromCommit":from})).unwrap();
  let blob=p.write_blob(&a.repo,&fence).unwrap();
  let fgos=p.write_tree(&a.repo,&[TreeEntry{name:b"events".to_vec(),mode:0o100644,oid:blob}]).unwrap();
  let head=p.write_tree(&a.repo,&[TreeEntry{name:b".fgos".to_vec(),mode:0o040000,oid:fgos}]).unwrap();
  let commit=reader_support::commit_tree(p,&a.repo,head);
  (legacy,commit)
 });
    git(&a.root, &["update-ref", "refs/heads/main", fence.as_str()]);
    git(&a.root, &["symbolic-ref", "HEAD", "refs/heads/main"]);
    git(
        &a.root,
        &["update-ref", "refs/fgos/legacy", legacy.as_str()],
    );
    git(
        &a.root,
        &["push", "-q", "origin", "refs/heads/main:refs/heads/main"],
    );
    git(&w.remote, &["symbolic-ref", "HEAD", "refs/heads/main"]);
    a.sync(false).unwrap();
    assert_eq!(
        git(&w.remote, &["rev-parse", "refs/fgos/legacy"]),
        legacy.as_str()
    );
    // A worktree whose HEAD predates the fence sees the same shared store.
    let pre = a.with_port(|p| {
        reader_support::commit(
            p,
            &a.repo,
            vec![],
            vec![(b"old", b"before cutover".to_vec())],
        )
    });
    let linked = w.root.join("linked");
    git(
        &a.root,
        &[
            "worktree",
            "add",
            "--detach",
            linked.to_str().unwrap(),
            pre.as_str(),
        ],
    );
    let repo = match a.driver.resolve_repo(&linked, &a.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    fgos_event_store::sync::sync(
        &a.driver,
        &repo,
        fgos_event_store::sync::SyncRequest {
            layout: &a.layout,
            machine: &a.machine,
            remote: "origin",
            no_push: false,
            opportunistic: false,
            held_ranks: &[],
            hot_lock_depth: 0,
        },
    )
    .unwrap();
    let origin = fgos_event_store::identity::StoreIdentity::open(&a.layout, &a.machine)
        .unwrap()
        .store_id;
    let read = fgos_event_store::read::read(
        &a.driver,
        &repo,
        fgos_event_store::read::ReadRequest {
            layout: &a.layout,
            origin: &origin,
            streams: &[fgos_event_store::layout::StreamId::parse("project").unwrap()],
            cursor: &Default::default(),
            folded: &[],
            project: true,
        },
    )
    .unwrap();
    assert_eq!(read.sequence.len(), a.hashes().len());
    assert_eq!(read.legacy.len(), 1);
    let b = w.clone("b", "machine-bb");
    b.setup();
    b.sync(false).unwrap();
    assert_eq!(b.hashes(), a.hashes());
    assert_eq!(
        git(&b.root, &["rev-parse", "refs/fgos/remotes/origin/legacy"]),
        legacy.as_str()
    );
    // A remote replaces legacy even with a valid event commit: refuse, preserve pin.
    git(&w.remote, &["update-ref", "refs/fgos/legacy", &a.tip()]);
    a.append(1);
    assert!(a
        .sync(false)
        .unwrap()
        .warnings
        .iter()
        .any(|w| w.contains("event-store-legacy-mismatch")));
    assert_eq!(
        git(&w.remote, &["rev-parse", "refs/fgos/events/machine-aa"]),
        a.tip()
    );
}

#[test]
fn v_event_real_sigkill_after_seal_cas_then_sync_recovers_receipt_and_publishes() {
    use std::os::unix::process::ExitStatusExt;
    use std::{
        io::{BufRead, BufReader},
        process::{Command, Stdio},
        time::Duration,
    };
    let w = World::new();
    let a = w.clone("a", "test-aa2345");
    a.setup();
    a.append(3);
    let mut child = Command::new(env!("CARGO_BIN_EXE_fgos-event-store-file-driver"))
        .arg("seal")
        .arg(&a.layout.common_dir)
        .arg("AfterSealTargetCas")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .spawn()
        .unwrap();
    let stdout = child.stdout.take().unwrap();
    let (tx, rx) = std::sync::mpsc::channel();
    let reader = std::thread::spawn(move || {
        let mut line = String::new();
        let result = BufReader::new(stdout).read_line(&mut line);
        let _ = tx.send((result, line));
    });
    let reached = rx.recv_timeout(Duration::from_secs(30));
    let _ = child.kill();
    let status = child.wait().unwrap();
    reader.join().unwrap();
    let (result, line) = reached.expect("seal checkpoint not reached");
    result.unwrap();
    assert_eq!(line.trim(), "STOP");
    assert_eq!(status.signal(), Some(9));
    a.sync(false).unwrap();
    a.append(1);
    a.sync(false).unwrap();
    let b = w.clone("b", "machine-bb");
    b.setup();
    b.sync(false).unwrap();
    assert_eq!(a.hashes(), b.hashes());
    assert_eq!(b.hashes().len(), 4);
    assert_eq!(
        fgos_git::wal::Wal::open(&a.repo)
            .unwrap()
            .scan(1000)
            .unwrap()
            .unresolved,
        0
    );
}
