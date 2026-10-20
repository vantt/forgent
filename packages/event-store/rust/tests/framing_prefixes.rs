mod common;
use common::{batch, Repo};
use fgos_event_store::{
    envelope::BatchCommit,
    open_read::{decode, read_own},
};
use std::fs;
#[test]
fn every_byte_prefix_is_invisible_and_next_append_truncates_it() {
    let repo = Repo::new();
    let first = repo.append(1);
    let origin = &first.ack.origin;
    let paths = repo.layout.stream(&repo.stream);
    let committed = fs::read(paths.active()).unwrap();
    // Exercise both an empty log's prefix and a suffix after a committed batch.
    for base in [false, true] {
        let first_seq = if base { 2 } else { 1 };
        let bytes = batch(origin, first_seq, 3);
        for end in 0..bytes.len() {
            let mut prefix = if base { committed.clone() } else { Vec::new() };
            prefix.extend(&bytes[..end]);
            fs::write(paths.active(), &prefix).unwrap();
            fs::write(paths.hwm(), b"{\"lastSeq\":0}\n").unwrap();
            assert_eq!(
                decode(&prefix, origin, &repo.stream, false)
                    .unwrap()
                    .events
                    .len(),
                usize::from(base),
                "prefix {end}"
            );
            assert_eq!(
                read_own(&repo.layout, origin, &repo.stream)
                    .unwrap()
                    .events
                    .len(),
                usize::from(base)
            );
            let next = repo.append(1);
            assert_eq!(next.ack.first_seq, first_seq, "prefix {end}");
            let recovered = fs::read(paths.active()).unwrap();
            assert_eq!(
                decode(&recovered, origin, &repo.stream, true)
                    .unwrap()
                    .events
                    .len(),
                usize::from(base) + 1
            );
        }
        assert_eq!(
            decode(&bytes, origin, &repo.stream, true)
                .unwrap()
                .events
                .len(),
            3
        );
    }
}
#[test]
fn wrong_checksum_marker_and_complete_unmarked_lines_never_fold() {
    let repo = Repo::new();
    let origin = repo.append(1).ack.origin;
    let bytes = batch(&origin, 1, 3);
    let start = bytes[..bytes.len() - 1]
        .iter()
        .rposition(|b| *b == b'\n')
        .unwrap()
        + 1;
    let mut m: BatchCommit = serde_json::from_slice(&bytes[start..]).unwrap();
    m.sha256 = "0".repeat(64);
    let mut bad = bytes[..start].to_vec();
    bad.extend(m.canonical_line().unwrap());
    assert_eq!(
        decode(&bad, &origin, &repo.stream, true)
            .unwrap_err()
            .code
            .as_str(),
        "event-store-integrity"
    );
    assert!(decode(&bytes[..start], &origin, &repo.stream, false)
        .unwrap()
        .events
        .is_empty());
    let paths = repo.layout.stream(&repo.stream);
    fs::write(paths.active(), &bad).unwrap();
    assert!(repo.append_cursor(1, &Default::default()).is_err());
    assert_eq!(fs::read(paths.active()).unwrap(), bad);
}

#[test]
fn cached_prefix_verifies_growing_tail_and_cross_boundary_sequence() {
    let repo = Repo::new();
    let origin = repo.append(1).ack.origin;
    let bytes = fs::read(repo.layout.stream(&repo.stream).active()).unwrap();
    decode(&bytes, &origin, &repo.stream, false).unwrap();
    let second = batch(&origin, 2, 1);
    let torn = [bytes.as_slice(), &second[..second.len() - 1]].concat();
    assert_eq!(
        decode(&torn, &origin, &repo.stream, false)
            .unwrap()
            .events
            .len(),
        1
    );
    let complete = [bytes.as_slice(), second.as_slice()].concat();
    assert_eq!(
        decode(&complete, &origin, &repo.stream, false)
            .unwrap()
            .events
            .len(),
        2
    );
    // A valid marker cannot legitimize a sequence gap across the reused boundary.
    let gap = [complete.as_slice(), batch(&origin, 4, 1).as_slice()].concat();
    assert_eq!(
        decode(&gap, &origin, &repo.stream, false)
            .unwrap_err()
            .code
            .as_str(),
        "event-store-seq-recovery-conflict"
    );
    let mut damaged = complete;
    let offset = damaged.windows(8).position(|b| b == b"work.add").unwrap();
    damaged[offset] = b'X';
    assert_eq!(
        decode(&damaged, &origin, &repo.stream, false)
            .unwrap_err()
            .code
            .as_str(),
        "event-store-integrity"
    );
}
