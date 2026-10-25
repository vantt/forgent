#![cfg(target_os = "linux")]
mod reader_support;
use fgos_event_store::{
    cursor::Cursor,
    envelope::Scope,
    layout::StreamId,
    read::{read, reconcile_durable_history, ReadRequest},
    walk,
};
use fgos_git::*;
use reader_support::*;
use std::{collections::BTreeSet, fs};
fn try_read(
    f: &Fixture,
    cursor: &Cursor,
    folded: &[fgos_event_store::envelope::Envelope],
) -> std::result::Result<fgos_event_store::read::ReadResult, fgos_event_store::errors::Error> {
    read(
        &f.driver,
        &f.repo,
        ReadRequest {
            layout: &f.layout,
            origin: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            machine: "test-aa",
            streams: &[StreamId::parse("project").unwrap()],
            cursor,
            folded,
            project: true,
        },
    )
}
fn read_project(
    f: &Fixture,
    cursor: &Cursor,
    folded: &[fgos_event_store::envelope::Envelope],
) -> fgos_event_store::read::ReadResult {
    try_read(f, cursor, folded).unwrap()
}
#[test]
fn identical_overlap_recovers_receipt_without_requiring_segment_deletion() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let e = event('a', 1, 1);
    let oid = seal(&p, &f.repo, vec![], std::slice::from_ref(&e), "test-aa");
    publish(
        &p,
        &f.repo,
        "refs/fgos/events/test-aa",
        None,
        oid,
        "identical",
    );
    let stream = StreamId::parse("project").unwrap();
    let paths = f.layout.stream(&stream);
    fs::create_dir_all(paths.closed()).unwrap();
    fs::write(
        paths.closed().join("1-1.jsonl"),
        batch(std::slice::from_ref(&e)),
    )
    .unwrap();
    assert_eq!(
        reconcile_durable_history(
            &f.driver,
            &f.repo,
            &f.layout,
            &e.origin,
            &stream,
            &RefName::parse("refs/fgos/events/test-aa").unwrap()
        )
        .unwrap(),
        1
    );
    assert!(paths.sealed().exists());
    assert!(paths.closed().join("1-1.jsonl").exists());
}
#[test]
fn unrelated_stream_and_orphan_branch_do_not_disable_frontier_certification() {
    let f = Fixture::new();
    let mut h = f.handle();
    let (old, new) = {
        let p = f.port(&mut h, "refs/fgos/events/test-aa");
        let first = seal(&p, &f.repo, vec![], &[event('a', 1, 1)], "test-aa");
        let mut other = event('b', 1, 1);
        other.stream = "project:porting".into();
        rehash(&mut other);
        let second = seal(&p, &f.repo, vec![first.clone()], &[other], "test-aa");
        publish(
            &p,
            &f.repo,
            "refs/fgos/events/test-aa",
            None,
            second.clone(),
            "two-streams",
        );
        (first, second)
    };
    {
        let p = f.port(&mut h, "refs/fgos/branch-events/test-aa/feature");
        let mut orphan = event('c', 1, 1);
        orphan.scope = Scope::Branch;
        orphan.stream = "branch:feature".into();
        rehash(&mut orphan);
        let oid = seal(&p, &f.repo, vec![], &[orphan], "test-aa");
        publish(
            &p,
            &f.repo,
            "refs/fgos/branch-events/test-aa/feature",
            None,
            oid,
            "orphan",
        );
    }
    let first = read_project(&f, &Cursor::default(), &[]);
    assert_eq!(first.sequence.len(), 1);
    assert_eq!(
        first.cursor.certified,
        BTreeSet::from([new.as_str().to_owned()])
    );
    assert!(!first.cursor.certified.contains(old.as_str()));
    let newest = {
        let p = f.port(&mut h, "refs/fgos/events/test-aa");
        let oid = seal(
            &p,
            &f.repo,
            vec![new.clone()],
            &[event('a', 2, 2)],
            "test-aa",
        );
        publish(
            &p,
            &f.repo,
            "refs/fgos/events/test-aa",
            Some(new),
            oid.clone(),
            "next",
        );
        oid
    };
    let delta = walk::walk(
        &f.driver,
        &f.repo,
        &[newest],
        &first.cursor.cover,
        &first.cursor.certified,
    )
    .unwrap();
    assert_eq!(delta.visited.len(), 2); // New commit and the certified boundary only.
    assert_eq!(
        read_project(&f, &first.cursor, &first.sequence)
            .sequence
            .len(),
        2
    );
}
#[test]
fn spliced_ancestor_machine_and_scope_are_refused() {
    for wrong_scope in [false, true] {
        let f = Fixture::new();
        let mut h = f.handle();
        let p = f.port(&mut h, "refs/fgos/events/test-aa");
        let mut ancestor = event('a', 1, 1);
        if wrong_scope {
            ancestor.scope = Scope::Local;
            ancestor.stream = "local".into();
            rehash(&mut ancestor);
        }
        let old = seal(
            &p,
            &f.repo,
            vec![],
            &[ancestor],
            if wrong_scope { "test-aa" } else { "test-bb" },
        );
        let tip = seal(&p, &f.repo, vec![old], &[event('b', 1, 2)], "test-aa");
        publish(
            &p,
            &f.repo,
            "refs/fgos/events/test-aa",
            None,
            tip,
            "spliced",
        );
        let error = read(
            &f.driver,
            &f.repo,
            ReadRequest {
                layout: &f.layout,
                origin: &"d".repeat(32),
                machine: "test-aa",
                streams: &[StreamId::parse("project").unwrap()],
                cursor: &Cursor::default(),
                folded: &[],
                project: true,
            },
        )
        .unwrap_err();
        assert_eq!(error.code.as_str(), "event-store-ref-tampered");
    }
}
#[test]
fn lost_receipt_uses_verified_own_ref_for_own_origin_mirror() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/remotes/origin/events/test-aa");
    let oid = seal(&p, &f.repo, vec![], &[event('a', 1, 1)], "test-aa");
    publish(
        &p,
        &f.repo,
        "refs/fgos/remotes/origin/events/test-aa",
        None,
        oid,
        "mirror",
    );
    assert_eq!(read_project(&f, &Cursor::default(), &[]).sequence.len(), 1);
}
#[test]
fn reader_uses_inspect_while_publication_lock_is_held() {
    let f = Fixture::new();
    let _held = f.handle();
    assert!(read_project(&f, &Cursor::default(), &[])
        .sequence
        .is_empty());
}
#[test]
fn git_failure_is_io_and_keeps_cause_instead_of_claiming_gap() {
    let f = Fixture::new();
    let error = walk::walk(
        &f.driver,
        &f.repo,
        &[Oid::parse(&"a".repeat(40), f.repo.object_format()).unwrap()],
        &Default::default(),
        &Default::default(),
    )
    .unwrap_err();
    assert_eq!(error.code.as_str(), "event-store-io");
    assert!(error.detail.contains("Git:"));
    assert!(error.detail.len() > 5);
}
#[test]
fn tracked_fence_without_fetched_legacy_is_refspec_missing() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    tracked_head(&f,&p,b"events",&serde_json::to_vec(&serde_json::json!({"legacyRefOid":"a".repeat(40),"sealDigest":"b".repeat(64),"fromCommit":"c".repeat(40)})).unwrap());
    let error = read(
        &f.driver,
        &f.repo,
        ReadRequest {
            layout: &f.layout,
            origin: &"d".repeat(32),
            machine: "test-aa",
            streams: &[StreamId::parse("project").unwrap()],
            cursor: &Cursor::default(),
            folded: &[],
            project: true,
        },
    )
    .unwrap_err();
    assert_eq!(error.code.as_str(), "event-store-refspec-missing");
}
/// A clone whose only mapping records predate Git's config sequence cannot
/// tell which one is current. Diagnostics report that as no provenance, so
/// the setup fix records an ordered one and the pinned URL is known again.
#[test]
fn unordered_historical_mapping_records_read_as_no_provenance_until_setup_records_one() {
    use fgos_event_store::{diagnostics, refspec};
    use fgos_git::wal::{self, OperationKind, Outcome, Phase, Wal};
    let f = Fixture::new();
    let url = f.driver.remote_url(&f.repo, "origin").unwrap();
    let maps = refspec::mappings("origin").unwrap();
    f.driver
        .ensure_fetch_mapping(&f.repo, "origin", &maps, "shape")
        .unwrap();
    let journal = Wal::open(&f.repo).unwrap();
    let mut intent = journal.inspect("shape").unwrap().intent().clone();
    fs::remove_dir_all(f.repo.common_dir().join("fgos/git/operations/shape")).unwrap();
    let OperationKind::ConfigChange(change) = &mut intent.kind else {
        panic!()
    };
    change.config_sequence = None;
    struct Seed;
    impl wal::PublicationAuthority for Seed {
        fn validate_publication_borrow(&self, _: &wal::Intent) -> wal::WalResult<()> {
            Ok(())
        }
    }
    for id in ["historical-a", "historical-b"] {
        let wal::Begin::Created(chain) = journal.begin(id, intent.clone(), &Seed).unwrap() else {
            panic!()
        };
        journal
            .append(&chain, Phase::Outcome(Outcome::ConfigApproved))
            .unwrap();
    }
    let error = refspec::pinned_url(&f.driver, &f.repo, "origin").unwrap_err();
    assert!(error.detail.contains("fetch-provenance-order-unknown"));
    let facts = diagnostics::facts(&f.driver, &f.repo, &f.root, "origin").unwrap();
    assert!(facts["provenance"].is_null());
    refspec::ensure_refspecs(&f.driver, &f.repo, "origin").unwrap();
    assert_eq!(refspec::pinned_url(&f.driver, &f.repo, "origin").unwrap(), url);
    let facts = diagnostics::facts(&f.driver, &f.repo, &f.root, "origin").unwrap();
    assert_eq!(facts["provenance"]["url"], url);
}
#[test]
fn head_legacy_ignores_project_files_and_nested_shards() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let bad = p.write_blob(&f.repo, b"foreign project data\n").unwrap();
    let child = p
        .write_tree(
            &f.repo,
            &[TreeEntry {
                name: b"foreign.jsonl".to_vec(),
                mode: 0o100644,
                oid: bad.clone(),
            }],
        )
        .unwrap();
    let nested = p
        .write_tree(
            &f.repo,
            &[TreeEntry {
                name: b"nested".to_vec(),
                mode: 0o040000,
                oid: child.clone(),
            }],
        )
        .unwrap();
    let fgos = p
        .write_tree(
            &f.repo,
            &[TreeEntry {
                name: b"events".to_vec(),
                mode: 0o040000,
                oid: nested,
            }],
        )
        .unwrap();
    let root = p
        .write_tree(
            &f.repo,
            &[
                TreeEntry {
                    name: b"events.jsonl".to_vec(),
                    mode: 0o100644,
                    oid: bad,
                },
                TreeEntry {
                    name: b"events".to_vec(),
                    mode: 0o040000,
                    oid: child,
                },
                TreeEntry {
                    name: b".fgos".to_vec(),
                    mode: 0o040000,
                    oid: fgos,
                },
            ],
        )
        .unwrap();
    let oid = commit_tree(&p, &f.repo, root);
    assert!(std::process::Command::new("git")
        .arg("-C")
        .arg(f.root.join("repo"))
        .args(["checkout", "-q", "--detach", oid.as_str()])
        .status()
        .unwrap()
        .success());
    assert!(read_project(&f, &Cursor::default(), &[]).legacy.is_empty());
}
#[test]
fn ignored_stream_can_advance_after_certification_without_a_false_gap() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let mut other = event('b', 1, 1);
    other.stream = "project:porting".into();
    rehash(&mut other);
    let old = seal(&p, &f.repo, vec![], &[other.clone()], "test-aa");
    publish(
        &p,
        &f.repo,
        "refs/fgos/events/test-aa",
        None,
        old.clone(),
        "other-first",
    );
    let first = read_project(&f, &Cursor::default(), &[]);
    other.seq = 2;
    rehash(&mut other);
    let next = seal(&p, &f.repo, vec![old.clone()], &[other], "test-aa");
    publish(
        &p,
        &f.repo,
        "refs/fgos/events/test-aa",
        Some(old),
        next,
        "other-second",
    );
    assert!(read_project(&f, &first.cursor, &first.sequence)
        .sequence
        .is_empty());
}
#[test]
fn changed_legacy_head_forces_rebuild_even_when_v4_order_is_unchanged() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    tracked_head(
        &f,
        &p,
        b"events.jsonl",
        b"{\"ts\":\"2026-01-01T00:00:00.000Z\",\"seq\":1}\n",
    );
    let first = read_project(&f, &Cursor::default(), &[]);
    tracked_head(
        &f,
        &p,
        b"events.jsonl",
        b"{\"ts\":\"2026-01-01T00:00:00.000Z\",\"seq\":2}\n",
    );
    let next = read_project(&f, &first.cursor, &first.sequence);
    assert_eq!(
        next.fold,
        fgos_event_store::cursor::Fold::RebuildRequired {
            first_difference: 0
        }
    );
}
#[test]
fn certified_commit_cannot_be_reused_under_a_different_machine_ref() {
    let f = Fixture::new();
    let mut h = f.handle();
    let oid = {
        let p = f.port(&mut h, "refs/fgos/events/test-aa");
        let oid = seal(&p, &f.repo, vec![], &[event('a', 1, 1)], "test-aa");
        publish(
            &p,
            &f.repo,
            "refs/fgos/events/test-aa",
            None,
            oid.clone(),
            "valid",
        );
        oid
    };
    let first = read_project(&f, &Cursor::default(), &[]);
    let p = f.port(&mut h, "refs/fgos/events/test-bb");
    publish(
        &p,
        &f.repo,
        "refs/fgos/events/test-bb",
        None,
        oid,
        "wrong-ref",
    );
    let error = read(
        &f.driver,
        &f.repo,
        ReadRequest {
            layout: &f.layout,
            origin: &"a".repeat(32),
            machine: "test-aa",
            streams: &[StreamId::parse("project").unwrap()],
            cursor: &first.cursor,
            folded: &first.sequence,
            project: true,
        },
    )
    .unwrap_err();
    assert_eq!(error.code.as_str(), "event-store-ref-tampered");
}
#[test]
fn subtree_listing_does_not_capture_an_oversized_unrelated_project_tree() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let blob = p.write_blob(&f.repo, b"data").unwrap();
    let files: Vec<_> = (0..1000)
        .map(|n| TreeEntry {
            name: format!("{n:04}-{}", "x".repeat(100)).into_bytes(),
            mode: 0o100644,
            oid: blob.clone(),
        })
        .collect();
    let shared = p.write_tree(&f.repo, &files).unwrap();
    let small = p
        .write_tree(
            &f.repo,
            &[TreeEntry {
                name: b"events.jsonl".to_vec(),
                mode: 0o100644,
                oid: blob,
            }],
        )
        .unwrap();
    let mut roots: Vec<_> = (0..1000)
        .map(|n| TreeEntry {
            name: format!("project-{n:04}").into_bytes(),
            mode: 0o040000,
            oid: shared.clone(),
        })
        .collect();
    roots.push(TreeEntry {
        name: b".fgos".to_vec(),
        mode: 0o040000,
        oid: small,
    });
    let root = p.write_tree(&f.repo, &roots).unwrap();
    let commit = commit_tree(&p, &f.repo, root);
    // A recursive whole-tree listing would exceed the driver's 64 MiB ceiling.
    let page = f
        .driver
        .list_tree(&f.repo, &commit, b".fgos/", None, 1024)
        .unwrap();
    assert!(page.complete);
    assert_eq!(page.entries.len(), 1);
    assert_eq!(page.entries[0].path, b".fgos/events.jsonl");
}
#[test]
fn authenticated_promote_parent_releases_later_branch_tail_after_certification() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let mut branches = vec![event('a', 1, 1), event('a', 2, 2)];
    for e in &mut branches {
        e.scope = Scope::Branch;
        e.stream = "branch:feature".into();
        rehash(e);
    }
    let branch = seal(&p, &f.repo, vec![], &branches, "test-aa");
    let start = event('a', 1, 0);
    let base = seal(&p, &f.repo, vec![], std::slice::from_ref(&start), "test-aa");
    let mut promote = event('a', 2, 3);
    promote.event_type = "store.promote".into();
    promote.payload =
        serde_json::json!({"stream":"branch:feature","throughSeq":1,"tip":branch.as_str()});
    rehash(&mut promote);
    let first_tip = seal(
        &p,
        &f.repo,
        vec![base, branch.clone()],
        std::slice::from_ref(&promote),
        "test-aa",
    );
    publish(
        &p,
        &f.repo,
        "refs/fgos/events/test-aa",
        None,
        first_tip.clone(),
        "promote-one",
    );
    let first = read_project(&f, &Cursor::default(), &[]);
    assert_eq!(first.sequence, vec![start, promote, branches[0].clone()]);
    let mut promote = event('a', 3, 4);
    promote.event_type = "store.promote".into();
    promote.payload =
        serde_json::json!({"stream":"branch:feature","throughSeq":2,"tip":branch.as_str()});
    rehash(&mut promote);
    let tip = seal(
        &p,
        &f.repo,
        vec![first_tip.clone(), branch],
        std::slice::from_ref(&promote),
        "test-aa",
    );
    publish(
        &p,
        &f.repo,
        "refs/fgos/events/test-aa",
        Some(first_tip),
        tip,
        "promote-two",
    );
    let next = read_project(&f, &first.cursor, &first.sequence);
    assert_eq!(next.sequence.len(), 5);
    assert_eq!(&next.sequence[3..], &[promote, branches[1].clone()]);
    assert!(next.deferred.is_empty());
}

#[test]
fn merged_parent_keeps_its_source_machine_identity_and_is_discovered_below_covered_seal() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let a = event('a', 1, 1);
    let b = event('b', 1, 2);
    let own = seal(&p, &f.repo, vec![], std::slice::from_ref(&a), "test-aa");
    let foreign = seal(&p, &f.repo, vec![], std::slice::from_ref(&b), "other-aa");
    let merged = merge(&p, &f.repo, &own, &foreign, "test-aa");
    let mut next = event('a', 2, 3);
    next.seen.insert(format!("{}:project", b.origin), 1);
    rehash(&mut next);
    let top = seal(&p, &f.repo, vec![merged], &[next], "test-aa");
    let cover = std::collections::BTreeMap::from([(format!("{}:project", a.origin), 2)]);
    let walked = walk::walk_verified(
        &p,
        &f.repo,
        &top,
        &cover,
        &BTreeSet::new(),
        "test-aa",
        Scope::Project,
    )
    .unwrap();
    assert_eq!(walked.events, vec![b]);
}

#[test]
fn covered_seal_discovers_unknown_origin_with_open_or_rebuilt_receipt_coverage() {
    for rebuild_receipt in [false, true] {
        let f = Fixture::new();
        let stream = StreamId::parse("project").unwrap();
        let paths = f.layout.stream(&stream);
        fs::create_dir_all(paths.closed()).unwrap();
        let a1 = event('a', 1, 1);
        let a2 = event('a', 2, 3);
        let c1 = event('c', 1, 0);
        let mut b1 = event('b', 1, 2);
        b1.seen.insert(format!("{}:project", c1.origin), 1);
        rehash(&mut b1);
        fs::write(paths.active(), batch(&[a1.clone(), a2.clone()])).unwrap();
        let open = read_project(&f, &Cursor::default(), &[]);
        assert_eq!(open.cursor.cover[&format!("{}:project", a1.origin)], 2);
        assert!(!open
            .cursor
            .cover
            .contains_key(&format!("{}:project", b1.origin)));
        let mut cursor = open.cursor;
        let folded = open.sequence;
        let mut h = f.handle();
        {
            let p = f.port(&mut h, "refs/fgos/events/test-aa");
            let own = seal(&p, &f.repo, vec![], std::slice::from_ref(&a1), "test-aa");
            let foreign = seal(&p, &f.repo, vec![], std::slice::from_ref(&b1), "test-bb");
            let merged = merge(&p, &f.repo, &own, &foreign, "test-aa");
            let top = seal(
                &p,
                &f.repo,
                vec![merged],
                std::slice::from_ref(&a2),
                "test-aa",
            );
            publish(
                &p,
                &f.repo,
                "refs/fgos/events/test-aa",
                None,
                top,
                "covered-top",
            );
            if rebuild_receipt {
                fs::remove_file(paths.active()).unwrap();
                assert_eq!(
                    reconcile_durable_history(
                        &p,
                        &f.repo,
                        &f.layout,
                        &a1.origin,
                        &stream,
                        &RefName::parse("refs/fgos/events/test-aa").unwrap(),
                    )
                    .unwrap(),
                    2
                );
                let receipt = fgos_event_store::receipt::Receipt::read(&paths.sealed()).unwrap();
                assert_eq!(receipt.cover, cursor.cover);
                assert!(receipt.certified.is_empty());
                cursor.cover = receipt.cover;
                cursor.certified = receipt.certified;
            }
        }
        // B has never been emitted: its origin is absent from coverage, and
        // it lives below the already covered A2 seal. C now makes it readable.
        {
            let p = f.port(&mut h, "refs/fgos/events/test-cc");
            let tip = seal(&p, &f.repo, vec![], std::slice::from_ref(&c1), "test-cc");
            publish(
                &p,
                &f.repo,
                "refs/fgos/events/test-cc",
                None,
                tip,
                "release-cause",
            );
        }
        let result = read_project(&f, &cursor, &folded);
        assert!(result.deferred.is_empty());
        assert!(result.missing.is_empty());
        assert_eq!(result.sequence.len(), 4);
        let hashes: BTreeSet<_> = result.sequence.iter().map(|e| e.h.clone()).collect();
        assert_eq!(hashes, BTreeSet::from([a1.h, a2.h, b1.h, c1.h]));
        assert_eq!(result.cursor.cover[&format!("{}:project", b1.origin)], 1);
        assert_eq!(result.cursor.cover[&format!("{}:project", c1.origin)], 1);
    }
}

#[test]
fn reserved_legacy_mirror_is_not_a_phantom_event_tip() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/remotes/origin/events/test-aa");
    let oid = seal(&p, &f.repo, vec![], &[event('a', 1, 1)], "test-aa");
    // A perfectly valid event commit under the wildcard legacy namespace must
    // never become an event stream, even when its suffix contains /events/.
    for name in ["refs/fgos/remotes/origin/legacy/events/test-aa", "refs/fgos/remotes/origin/legacy-old", "refs/fgos/remotes/origin/legacyx/y"] {
        assert!(std::process::Command::new("git").arg("-C").arg(f.root.join("repo")).args(["update-ref", name, oid.as_str()]).status().unwrap().success());
    }
    let result = read_project(&f, &Cursor::default(), &[]);
    assert!(result.events.is_empty());
    assert!(result.sequence.is_empty());
    assert!(result.legacy.is_empty());
}

/// A clone that has never stored an event has no `.git/fgos/events` yet. The
/// history is then empty; today `own_bounds` lists the missing root and the
/// read fails with an I/O error. No other test reads without the root: every
/// fixture creates it first.
#[test]
fn read_without_a_store_root_is_empty_history() {
    let f = Fixture::new();
    fs::remove_dir_all(&f.layout.root).unwrap();
    let result = try_read(&f, &Cursor::default(), &[]).unwrap_or_else(|error| {
        panic!("a clone with no store root has no history yet, but the read failed: {error}")
    });
    assert!(result.events.is_empty());
    assert!(result.sequence.is_empty());
}

/// One foreign mirror that fails its own checks must not take every read down
/// with it (sync already skips such a mirror with a warning). Existing tests
/// only cover a bad ref of the reader's own machine
/// (`spliced_ancestor_machine_and_scope_are_refused` owns that it stays fatal).
fn bad_foreign_mirror_is_skipped(
    bad_name: &str,
    code: &str,
    bad_commit: impl Fn(&PublicationPort<'_>, &Fixture) -> Oid,
) {
    let f = Fixture::new();
    let mut h = f.handle();
    let (good, bad) = {
        let p = f.port(&mut h, "refs/fgos/events/test-aa");
        (
            seal(&p, &f.repo, vec![], &[event('b', 1, 1)], "test-bb"),
            bad_commit(&p, &f),
        )
    };
    drop(h);
    plant_foreign_mirror(&f, "test-bb", &good);
    plant_foreign_mirror(&f, bad_name, &bad);
    let result = try_read(&f, &Cursor::default(), &[]).unwrap_or_else(|error| {
        panic!("one bad foreign mirror ({bad_name}) failed the whole read: {error}")
    });
    assert_eq!(
        result.sequence.len(),
        1,
        "the other machine's events are still read"
    );
    let skipped: Vec<_> = result
        .skipped_mirrors
        .iter()
        .map(|m| (m.ref_name.as_str(), m.machine.as_str(), m.code.as_str()))
        .collect();
    assert_eq!(
        skipped,
        [(
            format!("refs/fgos/remotes/origin/events/{bad_name}").as_str(),
            bad_name,
            code
        )],
        "the skipped mirror is named with why"
    );
}
#[test]
fn foreign_mirror_with_an_invalid_machine_name_is_skipped_not_fatal() {
    bad_foreign_mirror_is_skipped("EVIL", "event-store-integrity", |p, f| {
        seal(p, &f.repo, vec![], &[event('c', 1, 1)], "test-cc")
    });
}
#[test]
fn foreign_mirror_whose_header_names_another_machine_is_skipped_not_fatal() {
    bad_foreign_mirror_is_skipped("test-cc", "event-store-ref-tampered", |p, f| {
        seal(p, &f.repo, vec![], &[event('c', 1, 1)], "test-dd")
    });
}
/// 32 MiB is the per-blob cap of the reader; one byte over trips it.
#[test]
fn foreign_mirror_with_an_oversized_segment_is_skipped_not_fatal() {
    bad_foreign_mirror_is_skipped("test-cc", "event-store-io", |p, f| {
        let big = vec![b'x'; 32 * 1024 * 1024 + 1];
        let header = fgos_event_store::envelope::Seal::Seal {
            v: 1,
            machine_id: "test-cc".into(),
            origin: "c".repeat(32),
            stream: "project".into(),
            scope: Scope::Project,
            first_seq: 1,
            last_seq: 1,
            count: 1,
            sha256: fgos_event_store::envelope::sha256(&big),
        };
        commit(
            p,
            &f.repo,
            vec![],
            vec![
                (b"events.jsonl", big),
                (b"seal.json", header.canonical_line().unwrap()),
            ],
        )
    });
}
/// A fresh clone on this machine has no own ref yet, but its first sync seals
/// onto the remote's history of this machine id, so the mirror of its own
/// machine is never skipped: a tampered one fails the read.
#[test]
fn a_tampered_mirror_of_the_own_machine_fails_a_clone_with_no_own_ref() {
    let f = Fixture::new();
    let mut h = f.handle();
    let bad = {
        let p = f.port(&mut h, "refs/fgos/events/test-aa");
        seal(&p, &f.repo, vec![], &[event('c', 1, 1)], "test-dd")
    };
    drop(h);
    plant_foreign_mirror(&f, "test-aa", &bad);
    let error = try_read(&f, &Cursor::default(), &[]).unwrap_err();
    assert_eq!(error.code.as_str(), "event-store-ref-tampered", "{error}");
}
