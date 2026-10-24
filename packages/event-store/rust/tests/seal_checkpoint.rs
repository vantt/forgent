#![cfg(target_os = "linux")]
//! A seal that publishes and verifies new commits moves the history checkpoint file to them, so the
//! next process's read continues from the sealed commit instead of walking it again.
mod common;
mod reader_support;
use common::Repo;
use fgos_event_store::{
    checkpoint::Checkpoint,
    cursor::Cursor,
    layout::StreamId,
    read::{read, read_checkpointed, ReadRequest, ReadResult},
    seal::{seal_checkpointed, SealRequest, Sealed},
};
use fgos_git::{GitDriver, Inspect, RepoHandle, ResolveRepo};
use reader_support::CountingPort;
use std::{collections::BTreeSet, fs};

struct World {
    r: Repo,
    driver: GitDriver,
    repo: RepoHandle,
    origin: String,
    cp: Checkpoint,
}
fn world() -> World {
    let r = Repo::new();
    let driver = GitDriver::new(&r.root).unwrap();
    let repo = match driver.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(repo) => repo,
        _ => panic!(),
    };
    let origin = r.append(1).ack.origin;
    let cp = Checkpoint {
        path: r.root.join("cache/event-history.json"),
        reuse: true,
    };
    World { r, driver, repo, origin, cp }
}
impl World {
    fn seal(&self, checkpoint: bool) -> Sealed {
        seal_checkpointed(
            &self.driver,
            &self.repo,
            SealRequest {
                layout: &self.r.layout,
                machine: "test-aa2345",
                stream: &self.r.stream,
                held_ranks: &[],
                hot_lock_depth: 0,
                opportunistic: false,
            },
            &fgos_event_store::fsio::OsFileSystem,
            checkpoint.then_some(self.cp.path.as_path()),
        )
        .unwrap()
    }
    /// A fresh process: no retained cursor, only the checkpoint file.
    fn fresh(&self, port: &dyn Inspect, cp: &Checkpoint) -> ReadResult {
        let streams = [StreamId::parse("project").unwrap()];
        let empty = Cursor::default();
        read_checkpointed(
            port,
            &self.repo,
            ReadRequest { layout: &self.r.layout, origin: &self.origin, streams: &streams, cursor: &empty, folded: &[], project: true },
            None,
            cp,
            None,
        )
        .unwrap()
    }
    fn truth(&self) -> Vec<fgos_event_store::envelope::Envelope> {
        let streams = [StreamId::parse("project").unwrap()];
        let empty = Cursor::default();
        read(
            &self.driver,
            &self.repo,
            ReadRequest { layout: &self.r.layout, origin: &self.origin, streams: &streams, cursor: &empty, folded: &[], project: true },
        )
        .unwrap()
        .sequence
    }
}

#[test]
fn a_second_process_reads_zero_sealed_commits_after_a_seal_moved_the_checkpoint() {
    let w = world();
    assert_eq!(w.seal(false).last_seq, 1);
    assert!(w.fresh(&w.driver, &w.cp).checkpoint.written, "the first read writes the file");

    w.r.append(2);
    let sealed = w.seal(true);
    assert_eq!((sealed.last_seq, sealed.checkpoint_error), (3, None));

    let counting = CountingPort::new(&w.driver);
    let next = w.fresh(&counting, &w.cp);
    assert!(next.checkpoint.continued && !next.checkpoint.written, "{:?}", next.checkpoint);
    assert_eq!(counting.read_commits.get(), 0, "the sealed commit is not walked again");
    assert_eq!(next.sequence.len(), 3);
    assert_eq!(next.sequence, w.truth());
}

#[test]
fn a_seal_without_a_checkpoint_to_extend_leaves_the_file_to_the_next_read() {
    let w = world();
    w.seal(true);
    assert!(!w.cp.path.exists(), "no file: nothing to extend");
    w.fresh(&w.driver, &w.cp);
    w.r.append(1);
    // Not asked: the file keeps its older certified tip, still usable, and the read walks the new commit.
    w.seal(false);
    let counting = CountingPort::new(&w.driver);
    let next = w.fresh(&counting, &w.cp);
    assert!(next.checkpoint.continued && next.checkpoint.written);
    assert!(counting.read_commits.get() > 0);
    assert_eq!(next.sequence, w.truth());
}

#[test]
fn a_checkpoint_a_seal_wrote_is_still_checked_against_the_store_and_ignored_when_forged() {
    let w = world();
    w.seal(false);
    w.fresh(&w.driver, &w.cp);
    w.r.append(2);
    assert!(w.seal(true).checkpoint_error.is_none());
    let honest = fs::read_to_string(&w.cp.path).unwrap();
    assert!(honest.contains("🦀"));
    // The events the file holds no longer match their hashes.
    fs::write(&w.cp.path, honest.replacen("🦀", "x", 1)).unwrap();
    let counting = CountingPort::new(&w.driver);
    let next = w.fresh(&counting, &w.cp);
    assert!(!next.checkpoint.continued && next.checkpoint.ignored.is_some(), "{:?}", next.checkpoint);
    assert!(next.checkpoint.written, "the read rewrites the file");
    assert_eq!(next.sequence, w.truth());
    // The rewritten file is the honest one again.
    assert!(w.fresh(&w.driver, &w.cp).checkpoint.continued);
}

#[test]
fn sealing_and_reading_concurrently_never_leave_a_checkpoint_that_cannot_be_used() {
    let w = world();
    w.seal(false);
    w.fresh(&w.driver, &w.cp);
    std::thread::scope(|scope| {
        scope.spawn(|| {
            for _ in 0..4 {
                w.r.append(1);
                assert!(w.seal(true).checkpoint_error.is_none());
            }
        });
        for _ in 0..3 {
            scope.spawn(|| {
                for _ in 0..4 {
                    let got = w.fresh(&w.driver, &w.cp);
                    assert!(!got.sequence.is_empty());
                    let rebuilt = w.fresh(&w.driver, &Checkpoint { reuse: false, ..w.cp.clone() });
                    assert!(!rebuilt.sequence.is_empty());
                }
            });
        }
    });
    let after = w.fresh(&w.driver, &w.cp);
    assert!(after.checkpoint.ignored.is_none(), "{:?}", after.checkpoint);
    assert_eq!(after.sequence, w.truth());
    let leftovers: BTreeSet<_> = fs::read_dir(w.cp.path.parent().unwrap())
        .unwrap()
        .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
        .collect();
    assert_eq!(leftovers, BTreeSet::from(["event-history.json".to_owned()]));
}
