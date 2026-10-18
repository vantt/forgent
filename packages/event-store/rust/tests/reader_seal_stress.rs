//! Long qualification uses real repos, locks, Publication and file boundaries.
mod common;
mod reader_support;
use common::Repo;
use fgos_event_store::{
    append::Positions,
    fsio::{FileSystem, Point},
    open_read::read_own,
    order::{order, stream_key},
    seal::{seal, seal_with_fs, SealRequest},
    walk,
};
use fgos_git::{GitDriver, Inspect, Oid, RefPrefix, RefValue, ResolveRepo};
use std::{collections::BTreeSet, sync::Mutex, time::Instant};
#[derive(Default)]
struct Reader {
    cover: Positions,
    certified: BTreeSet<String>,
    hashes: BTreeSet<String>,
}
fn observe(
    r: &Repo,
    origin: &str,
    reader: &mut Reader,
    seed: u64,
    d: &GitDriver,
    repo: &fgos_git::RepoHandle,
) {
    let local = read_own(&r.layout, origin, &r.stream).unwrap();
    let refs = d
        .list_refs(
            repo,
            &[RefPrefix::parse("refs/fgos/events/").unwrap()],
            None,
            100,
        )
        .unwrap();
    let tips: Vec<Oid> = refs
        .entries
        .into_iter()
        .filter_map(|e| match e.value {
            RefValue::Direct(o) => Some(o),
            _ => None,
        })
        .collect();
    let walked = walk::walk(d, repo, &tips, &reader.cover, &reader.certified)
        .unwrap_or_else(|e| panic!("seed={seed} walk: {e}"));
    let mut union = local.events;
    union.extend(walked.events);
    let ordered =
        order(&union, &reader.cover, false).unwrap_or_else(|e| panic!("seed={seed} order: {e}"));
    assert!(ordered.deferred.is_empty(), "seed={seed}");
    for e in ordered.events {
        assert!(reader.hashes.insert(e.h.clone()), "seed={seed} duplicate");
        let key = stream_key(&e);
        let old = reader.cover.get(&key).copied().unwrap_or(0);
        assert_eq!(e.seq, old + 1, "seed={seed} unread coverage");
        reader.cover.insert(key, e.seq);
    }
    reader.certified = tips.iter().map(|tip| tip.as_str().into()).collect();
}
struct Interleave<'a> {
    r: &'a Repo,
    driver: &'a GitDriver,
    repo: &'a fgos_git::RepoHandle,
    origin: &'a str,
    seed: u64,
    counts: [usize; 7],
    fail: bool,
    start_second: Mutex<Option<std::sync::mpsc::Sender<()>>>,
    readers: Mutex<[Reader; 2]>,
    fired: Mutex<[bool; 7]>,
}
impl FileSystem for Interleave<'_> {
    fn checkpoint(&self, p: Point) -> std::io::Result<()> {
        let points = [
            Point::AfterSealObjects,
            Point::BeforeSealTargetCas,
            Point::AfterSealTargetCas,
            Point::AfterSealCas,
            Point::AfterSealReceipt,
            Point::AfterSealDelete,
            Point::AfterSealDeleteDirFsync,
        ];
        let Some(index) = points.iter().position(|point| *point == p) else {
            return Ok(());
        };
        if self.counts[index] == 0 {
            return Ok(());
        }
        let mut fired = self.fired.lock().unwrap();
        if fired[index] {
            return Ok(());
        }
        fired[index] = true;
        if let Some(tx) = self.start_second.lock().unwrap().take() {
            tx.send(()).unwrap();
        }
        // A second sealer competes while the first holds event-seal. It must
        // return busy immediately. The appender must still make progress.
        assert!(
            seal(
                self.driver,
                self.repo,
                SealRequest {
                    layout: &self.r.layout,
                    machine: "test-aa2345",
                    stream: &self.r.stream,
                    held_ranks: &[],
                    hot_lock_depth: 0,
                    opportunistic: true
                }
            )
            .unwrap()
            .busy,
            "seed={}",
            self.seed
        );
        let mut readers = self.readers.lock().unwrap();
        // Readers straddle different boundaries; appenders run at every chosen
        // point. The seed swaps reader order without multiplying Git reads.
        let reader = ((self.seed & 1) as usize) ^ index.min(1);
        if index < 2 && self.seed & 2 == 0 {
            observe(
                self.r,
                self.origin,
                &mut readers[reader],
                self.seed,
                self.driver,
                self.repo,
            );
        }
        let count = self.counts[index];
        if count > 1 {
            std::thread::scope(|scope| {
                let appender = scope.spawn(|| self.r.append(count / 2));
                self.r.append(count - count / 2);
                appender.join().unwrap();
            });
        } else {
            self.r.append(count);
        }
        if index < 2 && self.seed & 2 != 0 {
            observe(
                self.r,
                self.origin,
                &mut readers[reader],
                self.seed,
                self.driver,
                self.repo,
            );
        }
        if self.fail && p == Point::AfterSealDeleteDirFsync {
            return Err(std::io::Error::other("seeded post-delete failure"));
        }
        Ok(())
    }
}
struct Fail(Point);
impl FileSystem for Fail {
    fn checkpoint(&self, point: Point) -> std::io::Result<()> {
        if point == self.0 {
            Err(std::io::Error::other("seeded interrupted publication"))
        } else {
            Ok(())
        }
    }
}
#[test]
#[ignore = "10,000-segment real-port qualification; run explicitly with --ignored --nocapture"]
fn ten_thousand_seeded_interleavings_and_wal_growth() {
    std::thread::scope(|scope| {
        let shards: Vec<_> = (0..8)
            .map(|shard| scope.spawn(move || qualify(1_250, shard * 1_250)))
            .collect();
        for shard in shards {
            shard.join().unwrap();
        }
    });
    println!("TOTAL_DISTINCT_SCHEDULES=10000 shards=8 schedules_per_shard=1250");
}
#[test]
fn seeded_interleavings_smoke() {
    qualify(8, 0);
}
fn qualify(schedule_count: u64, offset: u64) {
    let r = Repo::new();
    let a = r.append(1);
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    // Exercise a real promote and an imported merge in the same ancestry that
    // subsequent schedules traverse/prune; additional rounds occur in the loop.
    seed_promote_and_merge(&r, &a.ack.origin, &d, &repo, 0);
    r.append(1);
    let start = Instant::now();
    let mut seed = 0u64;
    let mut readers = [Reader::default(), Reader::default()];
    let mut schedules = BTreeSet::new();
    let mut expected_hashes = 5usize;
    let mut expected_project = 3u64;
    let mut merges = 1u64;
    for iteration in 0..schedule_count {
        // Odd multiplication permutes 14-bit seeds: every schedule is distinct.
        seed = ((iteration + offset) * 4051 + 7919) & 16383;
        let counts = std::array::from_fn(|i| ((seed >> (i * 2)) & 3) as usize + usize::from(i < 2));
        assert!(schedules.insert(counts));
        let (tx, rx) = std::sync::mpsc::channel();
        let fs = Interleave {
            r: &r,
            driver: &d,
            repo: &repo,
            origin: &a.ack.origin,
            seed,
            counts,
            fail: seed & 3 == 0 && counts[6] != 0,
            start_second: Mutex::new(Some(tx)),
            readers: Mutex::new(readers),
            fired: Mutex::new([false; 7]),
        };
        std::thread::scope(|scope| {
            let (d, repo, r) = (&d, &repo, &r);
            let second = scope.spawn(move || {
                rx.recv().unwrap();
                seal(
                    d,
                    repo,
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
            });
            let result = seal_with_fs(
                d,
                repo,
                SealRequest {
                    layout: &r.layout,
                    machine: "test-aa2345",
                    stream: &r.stream,
                    held_ranks: &[],
                    hot_lock_depth: 0,
                    opportunistic: false,
                },
                &fs,
            );
            if fs.fail {
                assert!(result.is_err(), "seed={seed}");
            } else {
                result.unwrap();
            }
            let second = second.join().unwrap();
            assert!(!second.busy);
            assert!(
                second.segments > 0,
                "seed={seed} second sealer did not publish"
            );
        });
        let fired = fs.fired.into_inner().unwrap();
        assert!(
            fired
                .iter()
                .zip(counts)
                .all(|(fired, count)| *fired == (count > 0)),
            "seed={seed} schedule not exercised"
        );
        let appended: usize = counts
            .iter()
            .zip(fired)
            .filter_map(|(count, fired)| fired.then_some(count))
            .sum();
        expected_hashes += appended;
        expected_project += appended as u64;
        readers = fs.readers.into_inner().unwrap();
        if seed.is_multiple_of(128) {
            r.append(1);
            expected_hashes += 1;
            expected_project += 1;
            let request = || SealRequest {
                layout: &r.layout,
                machine: "test-aa2345",
                stream: &r.stream,
                held_ranks: &[],
                hot_lock_depth: 0,
                opportunistic: false,
            };
            let points = [
                Point::AfterSealObjects,
                Point::AfterSealTargetCas,
                Point::AfterSealReceipt,
            ];
            assert!(seal_with_fs(
                &d,
                &repo,
                request(),
                &Fail(points[(seed as usize >> 7) % 3])
            )
            .is_err());
            seal(&d, &repo, request()).unwrap();
        }
        // Promote and merge are interleaved throughout the loop; no fabricated
        // receipt is used. The merge exercises receipt-loss reconstruction.
        if seed.is_multiple_of(1024) {
            seed_promote_and_merge(&r, &a.ack.origin, &d, &repo, merges);
            merges += 1;
            expected_hashes += 3;
            expected_project += 1;
        }
        for reader in &mut readers {
            observe(&r, &a.ack.origin, reader, seed, &d, &repo);
            assert_eq!(
                reader.cover[&format!("{}:project", a.ack.origin)],
                expected_project,
                "seed={seed} lost ack"
            );
            assert_eq!(reader.hashes.len(), expected_hashes, "seed={seed} lost ack");
        }
        r.append(1);
        expected_hashes += 1;
        expected_project += 1;
        if iteration % 100 == 99 {
            // Check the working set throughout the run, not just at the end.
            let operations = r.layout.common_dir.join("fgos/git/operations");
            assert_eq!(
                std::fs::read_dir(operations).unwrap().count(),
                0,
                "seed={seed}"
            );
            let pins = d
                .list_refs(
                    &repo,
                    &[RefPrefix::parse("refs/fgos/git-operations/").unwrap()],
                    None,
                    100,
                )
                .unwrap();
            assert!(pins.entries.is_empty(), "seed={seed}");
            println!(
                "qualification shard_offset={offset} schedules={} elapsed_sec={:.3} seed={seed}",
                iteration + 1,
                start.elapsed().as_secs_f64()
            );
        }
    }
    // Flush the final acknowledged suffix.
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
    for reader in &mut readers {
        observe(&r, &a.ack.origin, reader, seed, &d, &repo);
        assert_eq!(reader.hashes.len(), expected_hashes);
    }
    let root = r.layout.common_dir.join("fgos/git");
    fn census(path: &std::path::Path) -> (u64, u64, u64) {
        let mut bytes = 0;
        let mut inodes = 1;
        let mut dirs = 0;
        if path.is_dir() {
            dirs = 1;
            for e in std::fs::read_dir(path).unwrap() {
                let (b, i, d) = census(&e.unwrap().path());
                bytes += b;
                inodes += i;
                dirs += d;
            }
        } else {
            bytes = std::fs::metadata(path).unwrap().len();
        }
        (bytes, inodes, dirs)
    }
    let (bytes, inodes, dirs) = census(&root);
    let operations = std::fs::read_dir(root.join("operations")).unwrap().count();
    let pins = d
        .list_refs(
            &repo,
            &[RefPrefix::parse("refs/fgos/git-operations/").unwrap()],
            None,
            100,
        )
        .unwrap();
    assert_eq!(operations, 0);
    assert!(pins.entries.is_empty());
    let ledger = root.join("compacted");
    let receipts: Vec<_> = std::fs::read_dir(&ledger)
        .unwrap()
        .map(|e| e.unwrap().metadata().unwrap().len())
        .collect();
    // Every schedule has a publishing primary and a publishing second sealer.
    assert!(receipts.len() >= schedule_count as usize * 2);
    assert_eq!(schedules.len(), schedule_count as usize);
    println!(
        "DISTINCT_SCHEDULES={} shard_offset={offset} merge_promote_rounds={merges}",
        schedules.len()
    );
    assert!(receipts.iter().all(|bytes| *bytes <= 512));
    let ledger_bytes: u64 = receipts.iter().sum();
    let scan = fgos_git::wal::Wal::open(&repo)
        .unwrap()
        .scan(20_000)
        .unwrap();
    assert!(scan.complete);
    assert_eq!(scan.unresolved, 0);
    assert!(scan
        .entries
        .iter()
        .all(|entry| entry.terminal && entry.error.is_none()));
    assert_eq!(scan.ledger_bytes, ledger_bytes);
    let elapsed = start.elapsed().as_secs_f64();
    println!("WAL_LEDGER receipts={} ledger_bytes={ledger_bytes} max_receipt_bytes={} projection_30d_receipts={:.0} projection_30d_ledger_bytes={:.0}", receipts.len(), receipts.iter().max().unwrap(), 30000.0, ledger_bytes as f64 / receipts.len() as f64 * 30000.0);
    println!("WAL_QUALIFICATION elapsed_sec={elapsed:.3} operation_dirs={operations} bytes={bytes} inodes={inodes} directories={dirs} pins={}", pins.entries.len());
    // Every byte prefix and the rotation-crash C1 are independently qualified
    // by framing_prefixes/kill_append; C4 has its real DAG below covered seals
    // in walk_certified and reader_review_regressions.
}

fn seed_promote_and_merge(
    r: &Repo,
    origin: &str,
    d: &GitDriver,
    repo: &fgos_git::RepoHandle,
    round: u64,
) {
    use fgos_event_store::{
        append::{append, AppendRequest, EventInput},
        envelope::Scope,
        layout::StreamId,
        promote::{promote, PromoteRequest},
        receipt::Receipt,
        registry::{ConsumerContract, Registration},
    };
    use fgos_git::{ExpectedTip, HolderAuthority, Publication, PublicationPort};
    let mut registry = r.registry.clone();
    registry
        .register(ConsumerContract {
            v: 1,
            types: vec![Registration {
                event_type: "branch.note".into(),
                domain: "branch".into(),
                schema_version: 1,
                scope: Scope::Branch,
                seal_on_write: false,
            }],
        })
        .unwrap();
    let branch = StreamId::parse("branch:qualification").unwrap();
    append(
        &r.layout,
        &registry,
        AppendRequest {
            stream: &branch,
            events: &[EventInput {
                event_type: "branch.note".into(),
                schema_version: 1,
                ts: "2026-10-18T05:00:00.000Z".into(),
                payload: serde_json::json!({}),
            }],
            cursor: &Positions::new(),
            writer: "qualification",
            machine: "test-aa2345",
            held_ranks: &[],
        },
    )
    .unwrap();
    promote(
        d,
        repo,
        &registry,
        PromoteRequest {
            layout: &r.layout,
            machine: "test-aa2345",
            branch: &branch,
            through_seq: round + 1,
            writer: "qualification",
            ts: "2026-10-18T05:00:01.000Z",
            cursor: &Positions::new(),
            held_ranks: &[],
            hot_lock_depth: 0,
        },
    )
    .unwrap();
    let mut handle = match fgos_holder_lock::acquire(
        &fgos_holder_lock::Resource::new("event-seal", r.layout.seal_lock()),
        fgos_holder_lock::Mode::Ex,
        fgos_holder_lock::Wait::Ms(30_000),
        2000,
    ) {
        fgos_holder_lock::Acquire::Acquired(h) => h,
        result => panic!("merge authority: {result:?}"),
    };
    let reference = fgos_event_store::refs::own_ref("test-aa2345", &r.stream).unwrap();
    let port = PublicationPort::new(
        d,
        HolderAuthority::new(
            repo,
            &mut handle,
            &r.layout.seal_lock(),
            reference.clone(),
            origin,
        )
        .unwrap(),
    );
    let receipt = Receipt::read(&r.layout.stream(&r.stream).sealed()).unwrap();
    let own = Oid::parse(&receipt.commit, repo.object_format()).unwrap();
    let mut foreign_event = reader_support::event('b', 1, 1);
    foreign_event.origin = format!("{:032x}", round + 1000);
    reader_support::rehash(&mut foreign_event);
    let foreign = reader_support::seal(&port, repo, vec![], &[foreign_event], "foreign-aa");
    let merged = reader_support::merge(&port, repo, &own, &foreign, "test-aa2345");
    port.compare_and_swap(
        repo,
        &reference,
        &ExpectedTip::Oid(own),
        &ExpectedTip::Oid(merged.clone()),
        &format!("qualification-merge-{round}"),
    )
    .unwrap();
    port.release_pin_and_compact(repo, &format!("qualification-merge-{round}"))
        .unwrap();
    std::fs::remove_file(r.layout.stream(&r.stream).sealed()).unwrap();
    fgos_event_store::read::reconcile_durable_history(
        &port, repo, &r.layout, origin, &r.stream, &reference,
    )
    .unwrap();
}
