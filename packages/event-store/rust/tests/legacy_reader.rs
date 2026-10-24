#![cfg(target_os = "linux")]
mod reader_support;
use fgos_event_store::{
    cursor::Cursor,
    envelope::Seal,
    layout::StreamId,
    read::{read, ReadRequest},
};
use fgos_git::*;
use reader_support::*;
fn request<'a>(f: &'a Fixture, streams: &'a [StreamId], c: &'a Cursor) -> ReadRequest<'a> {
    ReadRequest {
        layout: &f.layout,
        origin: "dddddddddddddddddddddddddddddddd",
        streams,
        cursor: c,
        folded: &[],
        project: true,
    }
}
#[test]
fn pre_migration_legacy_reads_tracked_head_and_preserves_file_line_provenance() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    tracked_head(
        &f,
        &p,
        b"events.jsonl",
        b"{\"ts\":\"2026-01-01T00:00:00.000Z\",\"seq\":1,\"type\":\"work.add\"}\n",
    );
    // Worktree edits are not truth; HEAD's immutable bytes are read.
    std::fs::write(
        f.root.join("repo/.fgos/events.jsonl"),
        b"corrupt untracked working bytes",
    )
    .unwrap();
    let got = read(
        &p,
        &f.repo,
        request(
            &f,
            &[StreamId::parse("project").unwrap()],
            &Cursor::default(),
        ),
    )
    .unwrap();
    assert_eq!(got.legacy.len(), 1);
    assert_eq!(got.legacy[0].provenance.file, ".fgos/events.jsonl");
    assert_eq!(got.legacy[0].provenance.line, 1);
}
#[test]
fn legacy_ref_is_authenticated_by_tracked_head_fence_and_seal_digest() {
    let f = Fixture::new();
    let mut h = f.handle();
    let (oid, fence) = {
        let p = f.port(&mut h, "refs/fgos/events/test-aa");
        let source = tracked_head(
            &f,
            &p,
            b"events.jsonl",
            b"{\"ts\":\"2026-01-01T00:00:00.000Z\",\"seq\":1}\n",
        );
        let seal = Seal::Legacy {
            from_commit: source.as_str().into(),
            tree_of_fgos_events: "a".repeat(40),
        };
        let oid = commit(
            &p,
            &f.repo,
            vec![],
            vec![
                (
                    b"events.jsonl",
                    b"{\"ts\":\"2026-01-01T00:00:00.000Z\",\"seq\":1}\n".to_vec(),
                ),
                (b"seal.json", seal.canonical_line().unwrap()),
            ],
        );
        let fence=serde_json::to_vec(&serde_json::json!({"legacyRefOid":oid.as_str(),"sealDigest":seal.digest().unwrap(),"fromCommit":source.as_str()})).unwrap();
        tracked_head(&f, &p, b"events", &fence);
        (oid, fence)
    };
    {
        let path = h.path().to_path_buf();
        let authority =
            HolderAuthority::legacy_import(&f.repo, &mut h, &path, "reader-test").unwrap();
        let p = PublicationPort::new(&f.driver, authority);
        p.compare_and_swap(
            &f.repo,
            &RefName::parse("refs/fgos/legacy").unwrap(),
            &ExpectedTip::Absent,
            &ExpectedTip::Oid(oid),
            "legacy",
        )
        .unwrap();
        let got = read(
            &p,
            &f.repo,
            request(
                &f,
                &[StreamId::parse("project").unwrap()],
                &Cursor::default(),
            ),
        )
        .unwrap();
        assert_eq!(got.legacy.len(), 1);
        assert_eq!(got.legacy[0].provenance.file, "events.jsonl");
    }
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let mut corrupt: serde_json::Value = serde_json::from_slice(&fence).unwrap();
    corrupt["sealDigest"] = serde_json::json!("b".repeat(64));
    tracked_head(&f, &p, b"events", &serde_json::to_vec(&corrupt).unwrap());
    assert_eq!(
        read(
            &p,
            &f.repo,
            request(
                &f,
                &[StreamId::parse("project").unwrap()],
                &Cursor::default()
            )
        )
        .unwrap_err()
        .code
        .as_str(),
        "event-store-legacy-mismatch"
    );
}
#[test]
fn the_tracked_fence_and_legacy_inventory_are_read_once_per_head_commit_however_often_the_store_reads(
) {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let line = |seq: u32| format!("{{\"ts\":\"2026-01-01T00:00:00.000Z\",\"seq\":{seq}}}\n");
    tracked_head(&f, &p, b"events.jsonl", line(1).as_bytes());
    let counting = CountingPort::new(&p);
    let streams = [StreamId::parse("project").unwrap()];
    for _ in 0..3 {
        read(
            &counting,
            &f.repo,
            request(&f, &streams, &Cursor::default()),
        )
        .unwrap();
    }
    assert_eq!(
        counting.fence.get(),
        1,
        "the same HEAD commit has one fence"
    );
    let roots = counting.trees.get();
    assert!(roots > 0, "an unfenced HEAD lists its legacy roots");
    tracked_head(&f, &p, b"events.jsonl", line(2).as_bytes());
    read(
        &counting,
        &f.repo,
        request(&f, &streams, &Cursor::default()),
    )
    .unwrap();
    assert_eq!(
        counting.fence.get(),
        2,
        "a moved HEAD names another commit and is read again"
    );
    assert_eq!(
        counting.trees.get(),
        2 * roots,
        "the moved HEAD lists its legacy roots once more"
    );
}
#[test]
fn every_legacy_file_of_a_commit_is_read_through_one_git_read_however_many_files_it_holds() {
    let f = Fixture::new();
    let mut h = f.handle();
    let p = f.port(&mut h, "refs/fgos/events/test-aa");
    let line = |seq: u32| format!("{{\"ts\":\"2026-01-01T00:00:{seq:02}.000Z\",\"seq\":{seq}}}\n");
    let files: Vec<(String, Vec<u8>)> =
        std::iter::once(("events.jsonl".to_owned(), line(1).into_bytes()))
            .chain((2..=9).map(|n| (format!("events/part-{n}.jsonl"), line(n).into_bytes())))
            .collect();
    let borrowed: Vec<(&str, &[u8])> = files
        .iter()
        .map(|(p, b)| (p.as_str(), b.as_slice()))
        .collect();
    tracked_head_files(&f, &p, &borrowed);
    let counting = CountingPort::new(&p);
    let streams = [StreamId::parse("project").unwrap()];
    let got = read(
        &counting,
        &f.repo,
        request(&f, &streams, &Cursor::default()),
    )
    .unwrap();
    assert_eq!(got.legacy.len(), 9, "every legacy file is read");
    assert_eq!(
        counting.single.get(),
        1,
        "no file is read singly: the one single read asks which legacy roots the commit tracks"
    );
    assert_eq!(
        counting.many.get() - counting.fence.get(),
        1,
        "nine files are one request, apart from the one fence lookup"
    );
}
