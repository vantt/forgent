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
    at: Point,
    readers: Mutex<[Reader; 2]>,
    fired: Mutex<bool>,
}
impl FileSystem for Interleave<'_> {
    fn checkpoint(&self, p: Point) -> std::io::Result<()> {
        if p != self.at {
            return Ok(());
        }
        let mut fired = self.fired.lock().unwrap();
        if *fired {
            return Ok(());
        }
        *fired = true;
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
        if self.seed & 1 == 0 {
            observe(
                self.r,
                self.origin,
                &mut readers[0],
                self.seed,
                self.driver,
                self.repo,
            );
        }
        self.r.append(1);
        observe(
            self.r,
            self.origin,
            &mut readers[1],
            self.seed,
            self.driver,
            self.repo,
        );
        observe(
            self.r,
            self.origin,
            &mut readers[0],
            self.seed,
            self.driver,
            self.repo,
        );
        Ok(())
    }
}
#[test]
#[ignore = "10,000-segment real-port qualification; run explicitly with --ignored --nocapture"]
fn ten_thousand_seeded_interleavings_and_wal_growth() {
    let r = Repo::new();
    let a = r.append(1);
    let d = GitDriver::new(&r.root).unwrap();
    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(r) => r,
        _ => panic!(),
    };
    // Exercise a real promote and an imported merge in the same ancestry that
    // all 10,000 subsequent schedules traverse/prune.
    seed_promote_and_merge(&r, &a.ack.origin, &d, &repo);
    r.append(1);
    let start = Instant::now();
    let mut seed = 0x5ea1_c1c2_c400_0001u64;
    let mut readers = [Reader::default(), Reader::default()];
    for iteration in 0..10_000 {
        seed ^= seed << 13;
        seed ^= seed >> 7;
        seed ^= seed << 17;
        let points = [
            Point::AfterSealObjects,
            Point::BeforeSealTargetCas,
            Point::AfterSealTargetCas,
            Point::AfterSealCas,
            Point::AfterSealReceipt,
            Point::AfterSealDelete,
            Point::AfterSealDeleteDirFsync,
        ];
        let fs = Interleave {
            r: &r,
            driver: &d,
            repo: &repo,
            origin: &a.ack.origin,
            seed,
            at: points[seed as usize % points.len()],
            readers: Mutex::new(readers),
            fired: Mutex::new(false),
        };
        let result = seal_with_fs(
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
            &fs,
        )
        .unwrap_or_else(|e| panic!("iteration={iteration} seed={seed}: {e}"));
        assert_eq!(result.segments, 1, "iteration={iteration} seed={seed}");
        assert!(*fs.fired.lock().unwrap());
        readers = fs.readers.into_inner().unwrap();
        for reader in &readers {
            assert_eq!(
                reader.cover[&format!("{}:project", a.ack.origin)],
                iteration + 4,
                "seed={seed} lost ack"
            );
            assert_eq!(reader.hashes.len() as u64, iteration + 6, "seed={seed}");
        }
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
                "qualification segments={} elapsed_sec={:.3} seed={seed}",
                iteration + 1,
                start.elapsed().as_secs_f64()
            );
        }
    }
    // Final ack was created concurrently after the last rotation.
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
        assert_eq!(reader.hashes.len(), 10_005);
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
    // Three initial seals, one merge CAS, 10,000 schedules, final seal.
    assert_eq!(receipts.len(), 10_005);
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
    println!("WAL_LEDGER receipts={} ledger_bytes={ledger_bytes} max_receipt_bytes={} projection_30d_receipts={:.0} projection_30d_ledger_bytes={:.0}", receipts.len(), receipts.iter().max().unwrap(), receipts.len() as f64 / elapsed * 30.0 * 86400.0, ledger_bytes as f64 / elapsed * 30.0 * 86400.0);
    println!("WAL_QUALIFICATION segments=10004 elapsed_sec={elapsed:.3} operation_dirs={operations} bytes={bytes} inodes={inodes} directories={dirs} pins={} seals_per_sec={:.6} projection_30d_bytes={:.0} projection_30d_inodes={:.0}",pins.entries.len(),10001.0/elapsed,bytes as f64/elapsed*30.0*86400.0,inodes as f64/elapsed*30.0*86400.0);
    // Every byte prefix and the rotation-crash C1 are independently qualified
    // by framing_prefixes/kill_append; C4 has its real DAG below covered seals
    // in walk_certified and reader_review_regressions.
}

fn seed_promote_and_merge(r: &Repo, origin: &str, d: &GitDriver, repo: &fgos_git::RepoHandle) {
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
            through_seq: 1,
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
        fgos_holder_lock::Wait::Try,
        2000,
    ) {
        fgos_holder_lock::Acquire::Acquired(h) => h,
        _ => panic!(),
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
    let mut receipt = Receipt::read(&r.layout.stream(&r.stream).sealed()).unwrap();
    let own = Oid::parse(&receipt.commit, repo.object_format()).unwrap();
    let foreign = reader_support::seal(
        &port,
        repo,
        vec![],
        &[reader_support::event('b', 1, 1)],
        "foreign-aa",
    );
    let merged = reader_support::merge(&port, repo, &own, &foreign, "test-aa2345");
    port.compare_and_swap(
        repo,
        &reference,
        &ExpectedTip::Oid(own),
        &ExpectedTip::Oid(merged.clone()),
        "qualification-merge",
    )
    .unwrap();
    port.release_pin_and_compact(repo, "qualification-merge")
        .unwrap();
    receipt.commit = merged.as_str().into();
    receipt.cover.clear();
    receipt.certified.clear();
    receipt.write(&r.layout.stream(&r.stream).root).unwrap();
}
