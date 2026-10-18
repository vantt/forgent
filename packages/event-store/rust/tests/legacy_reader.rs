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
        "event-store-ref-tampered"
    );
}
