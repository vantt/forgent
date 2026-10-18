mod common;
use common::Repo;
use fgos_event_store::{
    errors::ErrorCode,
    fsio::{FileSystem, Point},
    receipt::Receipt,
    refs::own_ref,
    seal::{seal, seal_with_fs, SealRequest},
    walk,
};
use fgos_git::{GitDriver, Inspect, ResolveRepo};
fn run(r: &Repo) -> fgos_event_store::seal::Sealed {
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    seal(
        &d,
        &repo,
        SealRequest {
            layout: &r.layout,
            machine: "test-aa2345",
            stream: &r.stream,
            held_ranks: &[],
            hot_lock_depth: 0,
            opportunistic: false,
        },
    )
    .unwrap()
}
#[test]
fn exact_changeset_bytes_determinism_receipt_deletion_and_private_git_context() {
    let r = Repo::new();
    let a = r.append(3);
    let bytes = std::fs::read(r.layout.stream(&r.stream).active()).unwrap();
    std::fs::write(r.layout.common_dir.join("index.lock"), "external").unwrap();
    std::fs::write(r.root.join("untracked"), "keep").unwrap();
    let hooks = r.layout.common_dir.join("hooks");
    let marker = r.root.join("hook-ran");
    std::fs::write(
        hooks.join("reference-transaction"),
        format!("#!/bin/sh\ntouch '{}'\n", marker.display()),
    )
    .unwrap();
    use std::os::unix::fs::PermissionsExt;
    std::fs::set_permissions(
        hooks.join("reference-transaction"),
        std::fs::Permissions::from_mode(0o755),
    )
    .unwrap();
    let head = std::fs::read(r.layout.common_dir.join("HEAD")).unwrap();
    assert_eq!(run(&r).last_seq, 3);
    let receipt = Receipt::read(&r.layout.stream(&r.stream).sealed()).unwrap();
    assert_eq!(receipt.cover[&format!("{}:project", a.ack.origin)], 3);
    assert!(receipt.certified.contains(&receipt.commit));
    assert!(std::fs::read_dir(r.layout.stream(&r.stream).closed())
        .unwrap()
        .next()
        .is_none());
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let oid = fgos_git::Oid::parse(&receipt.commit, repo.object_format()).unwrap();
    assert_eq!(
        walk::blob(&d, &repo, &oid, b"events.jsonl")
            .unwrap()
            .unwrap(),
        bytes
    );
    let tree = d.list_tree(&repo, &oid, b"", None, 10).unwrap();
    assert_eq!(
        tree.entries
            .iter()
            .map(|e| e.path.as_slice())
            .collect::<Vec<_>>(),
        vec![b"events.jsonl".as_slice(), b"seal.json".as_slice()]
    );
    let expected = fgos_event_store::envelope::Seal::Seal {
        v: 1,
        machine_id: "test-aa2345".into(),
        origin: a.ack.origin,
        stream: "project".into(),
        scope: fgos_event_store::envelope::Scope::Project,
        first_seq: 1,
        last_seq: 3,
        count: 3,
        sha256: fgos_event_store::envelope::sha256(&bytes),
    }
    .canonical_line()
    .unwrap();
    assert_eq!(
        walk::blob(&d, &repo, &oid, b"seal.json").unwrap().unwrap(),
        expected
    );
    assert_eq!(
        std::fs::read(r.layout.common_dir.join("HEAD")).unwrap(),
        head
    );
    assert_eq!(
        std::fs::read(r.layout.common_dir.join("index.lock")).unwrap(),
        b"external"
    );
    assert!(!r.layout.common_dir.join("index").exists());
    assert!(!marker.exists());
    assert_eq!(std::fs::read(r.root.join("untracked")).unwrap(), b"keep");
    assert_eq!(run(&r).segments, 0);
    r.append(2);
    assert_eq!(run(&r).last_seq, 5);
}
struct Stop(Point);
impl FileSystem for Stop {
    fn checkpoint(&self, p: Point) -> std::io::Result<()> {
        if p == self.0 {
            Err(std::io::Error::other("interrupt"))
        } else {
            Ok(())
        }
    }
}
#[test]
fn all_seal_boundaries_recover_and_keep_physical_high_separate_from_deferral() {
    for point in [
        Point::AfterSealObjects,
        Point::BeforeSealTargetCas,
        Point::AfterSealTargetCas,
        Point::AfterSealCas,
        Point::AfterSealReceipt,
        Point::AfterSealDelete,
        Point::AfterSealDeleteDirFsync,
    ] {
        let r = Repo::new();
        r.append(3);
        let d = GitDriver::new(&r.root).unwrap();
        let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        assert!(
            seal_with_fs(
                &d,
                &repo,
                SealRequest {
                    layout: &r.layout,
                    machine: "test-aa2345",
                    stream: &r.stream,
                    held_ranks: &[],
                    hot_lock_depth: 0,
                    opportunistic: false
                },
                &Stop(point)
            )
            .is_err(),
            "{point:?}"
        );
        run(&r);
        assert_eq!(
            Receipt::read(&r.layout.stream(&r.stream).sealed())
                .unwrap()
                .last_seq,
            3
        );
        assert_eq!(r.append(1).ack.first_seq, 4);
        assert!(
            fgos_git::wal::Wal::open(&repo)
                .unwrap()
                .active(100)
                .unwrap()
                .is_empty(),
            "{point:?}"
        );
    }
    let r = Repo::new();
    let mut seen = fgos_event_store::append::Positions::new();
    seen.insert(format!("{}:project", "a".repeat(32)), 1);
    let a = r.append_cursor(1, &seen).unwrap();
    run(&r);
    let receipt = Receipt::read(&r.layout.stream(&r.stream).sealed()).unwrap();
    assert_eq!(receipt.last_seq, 1);
    assert!(!receipt
        .cover
        .contains_key(&format!("{}:project", a.ack.origin)));
    assert!(receipt.certified.is_empty());
    assert_eq!(r.append(1).ack.first_seq, 2);
    run(&r);
    assert_eq!(
        Receipt::read(&r.layout.stream(&r.stream).sealed())
            .unwrap()
            .last_seq,
        2
    );
}
#[test]
fn seal_refuses_state_high_ranks_and_wrong_store_guard() {
    let r = Repo::new();
    r.append(1);
    for ranks in [&[58][..], &[70][..], &[80][..]] {
        assert_eq!(
            fgos_event_store::locks::acquire_seal(&r.layout, ranks, 0, false)
                .err()
                .unwrap()
                .code,
            ErrorCode::LockOrderViolation
        );
    }
    assert_eq!(
        fgos_event_store::locks::acquire_seal(&r.layout, &[60], 0, false)
            .err()
            .unwrap()
            .code,
        ErrorCode::EventStoreSealUnderState
    );
    assert_eq!(
        fgos_event_store::locks::acquire_seal(&r.layout, &[], 1, false)
            .err()
            .unwrap()
            .code,
        ErrorCode::EventStoreSealUnderState
    );
    let guard = fgos_event_store::locks::acquire_seal(&r.layout, &[], 0, false)
        .unwrap()
        .unwrap();
    assert!(
        fgos_event_store::locks::acquire_seal(&r.layout, &[], 0, true)
            .unwrap()
            .is_none()
    );
    let other = Repo::new();
    other.append(1);
    assert!(fgos_event_store::rotate::rotate_guarded(
        &other.layout,
        "test-aa2345",
        &other.stream,
        &guard,
        &fgos_event_store::fsio::OsFileSystem
    )
    .is_err());
    drop(guard);
    assert!(
        fgos_event_store::locks::acquire_seal(&r.layout, &[], 0, true)
            .unwrap()
            .is_some()
    );
}
#[test]
fn lost_receipt_and_hint_are_rebuilt_before_next_append() {
    let r = Repo::new();
    r.append(3);
    run(&r);
    let p = r.layout.stream(&r.stream);
    std::fs::remove_file(p.sealed()).unwrap();
    std::fs::remove_file(p.hwm()).unwrap();
    run(&r);
    assert_eq!(r.append(1).ack.first_seq, 4);
}
#[test]
fn ref_rewind_or_foreign_move_preserves_segment() {
    let r = Repo::new();
    r.append(1);
    run(&r);
    r.append(1);
    let reference = own_ref("test-aa2345", &r.stream).unwrap();
    assert!(std::process::Command::new("git")
        .arg("-C")
        .arg(&r.root)
        .args(["update-ref", "-d", reference.as_str()])
        .status()
        .unwrap()
        .success());
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let e = seal(
        &d,
        &repo,
        SealRequest {
            layout: &r.layout,
            machine: "test-aa2345",
            stream: &r.stream,
            held_ranks: &[],
            hot_lock_depth: 0,
            opportunistic: false,
        },
    )
    .unwrap_err();
    assert!(matches!(
        e.code,
        ErrorCode::EventStoreChainGap | ErrorCode::EventStoreRefMoved
    ));
    assert!(!std::fs::read_dir(r.layout.stream(&r.stream).closed())
        .unwrap()
        .next()
        .is_none());
}

#[test]
fn project_consumer_streams_share_one_ref_without_false_move_or_sequence_reuse() {
    use fgos_event_store::{
        append::{append, AppendRequest, Positions},
        layout::StreamId,
    };
    let r = Repo::new();
    r.append(1);
    run(&r);
    let extra = StreamId::parse("project:porting").unwrap();
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let ack = append(
        &r.layout,
        &r.registry,
        AppendRequest {
            stream: &extra,
            events: &common::inputs(2),
            cursor: &Positions::new(),
            writer: "writer",
            machine: "test-aa2345",
            held_ranks: &[],
        },
    )
    .unwrap();
    assert_eq!(ack.ack.first_seq, 1);
    seal(
        &d,
        &repo,
        SealRequest {
            layout: &r.layout,
            machine: "test-aa2345",
            stream: &extra,
            held_ranks: &[],
            hot_lock_depth: 0,
            opportunistic: false,
        },
    )
    .unwrap();
    r.append(1);
    assert_eq!(run(&r).last_seq, 2);
    let tip = Receipt::read(&r.layout.stream(&r.stream).sealed()).unwrap();
    let oid = fgos_git::Oid::parse(&tip.commit, repo.object_format()).unwrap();
    assert_eq!(
        walk::walk(&d, &repo, &[oid], &Positions::new(), &Default::default())
            .unwrap()
            .events
            .len(),
        4
    );
}
#[test]
fn linked_worktree_seal_preserves_its_head_index_and_files_even_with_index_lock() {
    let r = Repo::new();
    r.append(1);
    run(&r);
    let receipt = Receipt::read(&r.layout.stream(&r.stream).sealed()).unwrap();
    let linked = r.root.join("linked");
    let out = std::process::Command::new("git")
        .arg("-C")
        .arg(&r.root)
        .args(["worktree", "add", "--detach"])
        .arg(&linked)
        .arg(&receipt.commit)
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "{}",
        String::from_utf8_lossy(&out.stderr)
    );
    let gitfile = std::fs::read_to_string(linked.join(".git")).unwrap();
    let gitdir = std::path::PathBuf::from(gitfile.trim().strip_prefix("gitdir: ").unwrap());
    let index = std::fs::read(gitdir.join("index")).unwrap();
    let head = std::fs::read(gitdir.join("HEAD")).unwrap();
    let events = std::fs::read(linked.join("events.jsonl")).unwrap();
    std::fs::write(gitdir.join("index.lock"), b"owned elsewhere").unwrap();
    r.append(1);
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&linked, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    seal(
        &d,
        &repo,
        SealRequest {
            layout: &r.layout,
            machine: "test-aa2345",
            stream: &r.stream,
            held_ranks: &[],
            hot_lock_depth: 0,
            opportunistic: false,
        },
    )
    .unwrap();
    assert_eq!(std::fs::read(gitdir.join("HEAD")).unwrap(), head);
    assert_eq!(std::fs::read(gitdir.join("index")).unwrap(), index);
    assert_eq!(
        std::fs::read(gitdir.join("index.lock")).unwrap(),
        b"owned elsewhere"
    );
    assert_eq!(std::fs::read(linked.join("events.jsonl")).unwrap(), events);
}
#[test]
fn interval_trigger_refuses_a_gate_even_before_it_is_due() {
    let r = Repo::new();
    r.append(1);
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    assert_eq!(
        fgos_event_store::seal::seal_if_due(
            &d,
            &repo,
            SealRequest {
                layout: &r.layout,
                machine: "test-aa2345",
                stream: &r.stream,
                held_ranks: &[60],
                hot_lock_depth: 1,
                opportunistic: true
            },
            u64::MAX
        )
        .unwrap_err()
        .code,
        ErrorCode::EventStoreSealUnderState
    );
}

#[test]
fn receipt_post_rename_error_exposes_effect_and_keeps_segment_until_durable_retry() {
    let r = Repo::new();
    r.append(1);
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let error = seal_with_fs(
        &d,
        &repo,
        SealRequest {
            layout: &r.layout,
            machine: "test-aa2345",
            stream: &r.stream,
            held_ranks: &[],
            hot_lock_depth: 0,
            opportunistic: false,
        },
        &Stop(Point::AfterSealReceiptRename),
    )
    .unwrap_err();
    assert_eq!(
        error.durable_install,
        Some(fgos_durable_file::Installed::Created)
    );
    assert!(std::fs::read_dir(r.layout.stream(&r.stream).closed())
        .unwrap()
        .next()
        .is_some());
    run(&r);
    assert!(std::fs::read_dir(r.layout.stream(&r.stream).closed())
        .unwrap()
        .next()
        .is_none());
}

#[test]
fn repeated_identical_objects_have_the_same_commit_and_explicit_last_event_date() {
    use fgos_git::{HolderAuthority, Publication, PublicationPort};
    let r = Repo::new();
    let a = r.append(3);
    let bytes = std::fs::read(r.layout.stream(&r.stream).active()).unwrap();
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let mut h = match fgos_holder_lock::acquire(
        &fgos_holder_lock::Resource::new("event-seal", r.layout.seal_lock()),
        fgos_holder_lock::Mode::Ex,
        fgos_holder_lock::Wait::Try,
        2000,
    ) {
        fgos_holder_lock::Acquire::Acquired(h) => h,
        _ => panic!(),
    };
    let reference = own_ref("test-aa2345", &r.stream).unwrap();
    let p = PublicationPort::new(
        &d,
        HolderAuthority::new(
            &repo,
            &mut h,
            &r.layout.seal_lock(),
            reference,
            &a.ack.origin,
        )
        .unwrap(),
    );
    let first = fgos_event_store::publish::objects(
        &p,
        &repo,
        "test-aa2345",
        &r.stream,
        &bytes,
        &a.events,
        vec![],
    )
    .unwrap();
    let second = fgos_event_store::publish::objects(
        &p,
        &repo,
        "test-aa2345",
        &r.stream,
        &bytes,
        &a.events,
        vec![],
    )
    .unwrap();
    assert_eq!(first, second);
    let raw = match p
        .read_object(&repo, &first, fgos_git::ObjectType::Commit)
        .unwrap()
    {
        fgos_git::ReadObject::Present { bytes, .. } => String::from_utf8(bytes).unwrap(),
        _ => panic!(),
    };
    assert!(
        raw.contains("author fgOS Event Store <event-store@fgos.invalid> 1792299600 +0000\n"),
        "{raw}"
    );
    assert!(
        raw.contains("committer fgOS Event Store <event-store@fgos.invalid> 1792299600 +0000\n"),
        "{raw}"
    );
    assert!(
        raw.ends_with(&format!("\nfgos-events seal {}:project 1..3", a.ack.origin)),
        "{raw}"
    );
}

#[test]
fn altered_published_blob_stops_with_durable_integrity_evidence_and_deletes_nothing() {
    use fgos_git::{
        CommitInput, ExpectedTip, HolderAuthority, Identity, Publication, PublicationPort,
        TreeEntry,
    };
    let r = Repo::new();
    let a = r.append(3);
    let original = std::fs::read(r.layout.stream(&r.stream).active()).unwrap();
    run(&r);
    std::fs::write(
        r.layout.stream(&r.stream).closed().join("1-3.jsonl"),
        &original,
    )
    .unwrap();
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let prior = Receipt::read(&r.layout.stream(&r.stream).sealed()).unwrap();
    let old = fgos_git::Oid::parse(&prior.commit, repo.object_format()).unwrap();
    let header = walk::blob(&d, &repo, &old, b"seal.json").unwrap().unwrap();
    let mut h = match fgos_holder_lock::acquire(
        &fgos_holder_lock::Resource::new("event-seal", r.layout.seal_lock()),
        fgos_holder_lock::Mode::Ex,
        fgos_holder_lock::Wait::Try,
        2000,
    ) {
        fgos_holder_lock::Acquire::Acquired(h) => h,
        _ => panic!(),
    };
    let reference = own_ref("test-aa2345", &r.stream).unwrap();
    let p = PublicationPort::new(
        &d,
        HolderAuthority::new(
            &repo,
            &mut h,
            &r.layout.seal_lock(),
            reference.clone(),
            &a.ack.origin,
        )
        .unwrap(),
    );
    let tree = p
        .write_tree(
            &repo,
            &[
                TreeEntry {
                    name: b"seal.json".to_vec(),
                    mode: 0o100644,
                    oid: p.write_blob(&repo, &header).unwrap(),
                },
                TreeEntry {
                    name: b"events.jsonl".to_vec(),
                    mode: 0o100644,
                    oid: p.write_blob(&repo, b"altered").unwrap(),
                },
            ],
        )
        .unwrap();
    let identity = || Identity {
        name: "fixture".into(),
        email: "fixture@invalid".into(),
    };
    let corrupt = p
        .write_commit(
            &repo,
            &CommitInput {
                tree,
                parents: vec![old.clone()],
                author: identity(),
                committer: identity(),
                author_date: "1792299600 +0000".into(),
                committer_date: "1792299600 +0000".into(),
                message: b"invalid published blob".to_vec(),
            },
        )
        .unwrap();
    p.compare_and_swap(
        &repo,
        &reference,
        &ExpectedTip::Oid(old),
        &ExpectedTip::Oid(corrupt),
        "corrupt-fixture",
    )
    .unwrap();
    p.release_pin_and_compact(&repo, "corrupt-fixture").unwrap();
    drop(p);
    drop(h);
    let e = seal(
        &d,
        &repo,
        SealRequest {
            layout: &r.layout,
            machine: "test-aa2345",
            stream: &r.stream,
            held_ranks: &[],
            hot_lock_depth: 0,
            opportunistic: false,
        },
    )
    .unwrap_err();
    assert_eq!(e.code, ErrorCode::EventStoreSealMismatch);
    assert_eq!(
        std::fs::read(r.layout.stream(&r.stream).closed().join("1-3.jsonl")).unwrap(),
        original
    );
    let diagnostic: serde_json::Value = serde_json::from_slice(
        &std::fs::read(r.layout.stream(&r.stream).root.join("integrity.json")).unwrap(),
    )
    .unwrap();
    assert_eq!(diagnostic["code"], "event-store-seal-mismatch");
}

#[test]
fn shared_ref_rewind_to_another_streams_old_receipt_is_refused() {
    use fgos_event_store::{
        append::{append, AppendRequest, Positions},
        layout::StreamId,
    };
    let r = Repo::new();
    r.append(1);
    run(&r);
    let extra = StreamId::parse("project:porting").unwrap();
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let add = || {
        append(
            &r.layout,
            &r.registry,
            AppendRequest {
                stream: &extra,
                events: &common::inputs(1),
                cursor: &Positions::new(),
                writer: "writer",
                machine: "test-aa2345",
                held_ranks: &[],
            },
        )
        .unwrap()
    };
    add();
    seal(
        &d,
        &repo,
        SealRequest {
            layout: &r.layout,
            machine: "test-aa2345",
            stream: &extra,
            held_ranks: &[],
            hot_lock_depth: 0,
            opportunistic: false,
        },
    )
    .unwrap();
    let old = Receipt::read(&r.layout.stream(&extra).sealed()).unwrap();
    r.append(1);
    run(&r);
    add();
    assert!(std::process::Command::new("git")
        .arg("-C")
        .arg(&r.root)
        .args([
            "update-ref",
            own_ref("test-aa2345", &r.stream).unwrap().as_str(),
            &old.commit
        ])
        .status()
        .unwrap()
        .success());
    let e = seal(
        &d,
        &repo,
        SealRequest {
            layout: &r.layout,
            machine: "test-aa2345",
            stream: &extra,
            held_ranks: &[],
            hot_lock_depth: 0,
            opportunistic: false,
        },
    )
    .unwrap_err();
    assert_eq!(e.code, ErrorCode::EventStoreRefMoved);
    assert!(std::fs::read_dir(r.layout.stream(&extra).closed())
        .unwrap()
        .next()
        .is_some());
}

#[test]
fn pre_epoch_event_seals_with_epoch_date_and_identical_retry() {
    use fgos_event_store::append::{append, AppendRequest, Positions};
    let r = Repo::new();
    let mut inputs = common::inputs(1);
    inputs[0].ts = "1969-12-31T23:59:59.999Z".into();
    let appended = append(
        &r.layout,
        &r.registry,
        AppendRequest {
            stream: &r.stream,
            events: &inputs,
            cursor: &Positions::new(),
            writer: "old-clock",
            machine: "test-aa2345",
            held_ranks: &[],
        },
    )
    .unwrap();
    assert!(
        fgos_event_store::seal::oldest_unsealed_age_sec(&r.layout, std::slice::from_ref(&r.stream))
            .unwrap()
            > 1_000_000_000
    );
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    let bytes = std::fs::read(r.layout.stream(&r.stream).active()).unwrap();
    // Interrupt after writing real Git objects, before publication. The retry
    // must produce the same object, without modifying the acknowledged event.
    assert!(seal_with_fs(
        &d,
        &repo,
        SealRequest {
            layout: &r.layout,
            machine: "test-aa2345",
            stream: &r.stream,
            held_ranks: &[],
            hot_lock_depth: 0,
            opportunistic: false,
        },
        &Stop(Point::AfterSealTargetCas),
    )
    .is_err());
    let reference = own_ref("test-aa2345", &r.stream).unwrap();
    use fgos_git::{HolderAuthority, Publication, PublicationPort};
    let mut guard = match fgos_holder_lock::acquire(
        &fgos_holder_lock::Resource::new("event-seal", r.layout.seal_lock()),
        fgos_holder_lock::Mode::Ex,
        fgos_holder_lock::Wait::Try,
        2000,
    ) {
        fgos_holder_lock::Acquire::Acquired(h) => h,
        _ => panic!(),
    };
    let p = PublicationPort::new(
        &d,
        HolderAuthority::new(
            &repo,
            &mut guard,
            &r.layout.seal_lock(),
            reference.clone(),
            &appended.ack.origin,
        )
        .unwrap(),
    );
    let first = match p.read_ref(&repo, &reference).unwrap() {
        fgos_git::RefValue::Direct(oid) => oid,
        other => panic!("unexpected ref: {other:?}"),
    };
    let raw = match p
        .read_object(&repo, &first, fgos_git::ObjectType::Commit)
        .unwrap()
    {
        fgos_git::ReadObject::Present { bytes, .. } => bytes,
        _ => panic!(),
    };
    let text = std::str::from_utf8(&raw).unwrap();
    let rebuilt = fgos_event_store::publish::objects(
        &p,
        &repo,
        "test-aa2345",
        &r.stream,
        &bytes,
        &appended.events,
        vec![],
    )
    .unwrap();
    assert_eq!(rebuilt, first);
    drop(p);
    drop(guard);
    assert!(text.contains("author fgOS Event Store <event-store@fgos.invalid> 0 +0000\n"));
    assert!(text.contains("committer fgOS Event Store <event-store@fgos.invalid> 0 +0000\n"));
    assert_eq!(
        walk::blob(&d, &repo, &first, b"events.jsonl")
            .unwrap()
            .unwrap(),
        bytes
    );
    assert_eq!(run(&r).last_seq, 1);
    let receipt = Receipt::read(&r.layout.stream(&r.stream).sealed()).unwrap();
    assert_eq!(receipt.commit, first.as_str());
    assert_eq!(run(&r).segments, 0);
    assert_eq!(r.append(1).ack.first_seq, 2);
}
