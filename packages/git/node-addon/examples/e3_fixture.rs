//! E3 fixture and Rust-port probe for `scripts/git/e3-bench.mjs`.
//!
//! The Node harness measures every Node-reachable workload through the
//! combined addon. This binary only does what Node cannot reach: it builds
//! WAL states that need the public injection seam (`wal::FileSystem`) or the
//! WAL API directly, and times the Rust-only scan that the activation
//! controller (C5) runs. It links the same crates as the addon, so the event
//! seal path and authority binding match the Node route exactly.
//!
//! Usage (all paths absolute):
//!   e3_fixture backlog <common-dir> <count> <intent|attempt> <threads>
//!   e3_fixture scan <common-dir> <repeats>
//!   e3_fixture interrupted <state-root> <repo> <count> <writer>
//!   e3_fixture port <state-root> <repo> <samples> <writer>
//!   e3_fixture compacted <state-root> <repo> <count> <writer>
use fgos_git::wal::{self, Begin, FileSystem, Intent, OperationKind, Phase, Tip};
use fgos_git::*;
use fgos_holder_lock::{acquire, Acquire, Handle, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS};
use serde_json::json;
use std::path::{Path, PathBuf};
use std::time::Instant;

fn die(message: impl std::fmt::Display) -> ! {
    eprintln!("e3_fixture: {message}");
    std::process::exit(2)
}
fn arg(args: &[String], n: usize) -> &str {
    args.get(n)
        .map(String::as_str)
        .unwrap_or_else(|| die(format!("missing argument {n}")))
}
fn number(args: &[String], n: usize) -> usize {
    arg(args, n).parse().unwrap_or_else(|e| die(e))
}

/// Scan fixtures are never admitted for publication, so no live seal is
/// needed; the records are written by the WAL's own install path.
struct ScanOnly;
impl wal::PublicationAuthority for ScanOnly {
    fn validate_publication_borrow(&self, _: &Intent) -> wal::WalResult<()> {
        Ok(())
    }
}

fn backlog(common: &Path, count: usize, attempt: bool, threads: usize) {
    let started = Instant::now();
    let identity = wal::Wal::with_filesystem(common, wal::OsFileSystem)
        .unwrap_or_else(|e| die(e))
        .repository_identity()
        .to_owned();
    std::thread::scope(|scope| {
        for t in 0..threads {
            let identity = identity.clone();
            scope.spawn(move || {
                let journal =
                    wal::Wal::with_filesystem(common, wal::OsFileSystem).unwrap_or_else(|e| die(e));
                for n in (t..count).step_by(threads) {
                    let next = Tip::Oid(format!("{:040x}", n + 1));
                    let intent = Intent {
                        kind: OperationKind::PublicationCas,
                        request_digest: format!("{:064x}", n + 1),
                        repo_identity: identity.clone(),
                        resource_set: vec!["refs/fgos/events/e3-backlog".into()],
                        authority_binding: "e3-backlog".into(),
                        writer_identity: "e3-backlog".into(),
                        object_format: ObjectFormat::Sha1,
                        expected: Tip::Absent,
                        next: next.clone(),
                    };
                    let chain = match journal
                        .begin(&format!("backlog-{n:05}"), intent, &ScanOnly)
                        .unwrap_or_else(|e| die(e))
                    {
                        Begin::Created(c) => c,
                        other => die(format!("unexpected begin {other:?}")),
                    };
                    if attempt {
                        let prepared = journal
                            .append(&chain, Phase::Prepared)
                            .unwrap_or_else(|e| die(e));
                        journal
                            .append(
                                &prepared,
                                Phase::TargetAttempt {
                                    prior_target_attempt: None,
                                    expected: Tip::Absent,
                                    next,
                                },
                            )
                            .unwrap_or_else(|e| die(e));
                    }
                }
            });
        }
    });
    println!(
        "{}",
        json!({"created": count, "recordsPerOperation": if attempt { 3 } else { 1 }, "seconds": started.elapsed().as_secs_f64()})
    );
}

fn scan(common: &Path, repeats: usize) {
    let mut samples = Vec::new();
    let mut last = None;
    for _ in 0..repeats {
        let started = Instant::now();
        let journal = wal::Wal::open_existing(common, wal::OsFileSystem).unwrap_or_else(|e| die(e));
        let result = journal.scan(100_000).unwrap_or_else(|e| die(e));
        samples.push(started.elapsed().as_secs_f64() * 1000.0);
        last = Some(result);
    }
    let last = last.unwrap_or_else(|| die("no scan"));
    println!(
        "{}",
        json!({"ms": samples, "complete": last.complete, "unresolved": last.unresolved, "entries": last.entries.len(), "errors": last.entries.iter().filter(|e| e.error.is_some()).count(), "retainedBytes": last.retained_bytes})
    );
}

/// The event-seal resource exactly as the addon's `GitPublication` resolves it.
fn seal(repo: &RepoHandle) -> (Handle, PathBuf) {
    let layout = fgos_event_store::layout::Layout::from_common_dir(Some(repo.common_dir()))
        .unwrap_or_else(|e| die(e));
    let resource = Resource::new("event-seal", layout.seal_lock());
    match acquire(&resource, Mode::Ex, Wait::Ms(5000), DEFAULT_KILL_WAIT_MS) {
        Acquire::Acquired(handle) => (handle, resource.path),
        other => die(format!("seal unavailable: {other:?}")),
    }
}
fn open(state: &Path, root: &Path) -> (GitDriver, RepoHandle) {
    let driver = GitDriver::new(state).unwrap_or_else(|e| die(e.cause));
    match driver
        .resolve_repo(root, root)
        .unwrap_or_else(|e| die(e.cause))
    {
        ResolveRepo::Repository(repo) => (driver, repo),
        ResolveRepo::NotARepository => die("not a repository"),
    }
}
fn commit<P: Publication>(port: &P, repo: &RepoHandle, label: &str) -> Oid {
    let blob = port
        .write_blob(repo, label.as_bytes())
        .unwrap_or_else(|e| die(e.cause));
    let tree = port
        .write_tree(
            repo,
            &[TreeEntry {
                name: b"seal.json".to_vec(),
                mode: 0o100644,
                oid: blob,
            }],
        )
        .unwrap_or_else(|e| die(e.cause));
    let who = || Identity {
        name: "E3".into(),
        email: "e3@fgos.invalid".into(),
    };
    port.write_commit(
        repo,
        &CommitInput {
            tree,
            parents: vec![],
            author: who(),
            committer: who(),
            author_date: "1792300000 +0700".into(),
            committer_date: "1792300000 +0700".into(),
            message: label.as_bytes().to_vec(),
        },
    )
    .unwrap_or_else(|e| die(e.cause))
}

/// Returning an error at a named boundary is the port's own process-loss
/// model: everything acknowledged before it stays on disk, nothing after it runs.
struct StopAt(&'static str);
impl FileSystem for StopAt {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        if step == self.0 {
            Err(std::io::Error::other("e3 interruption"))
        } else {
            Ok(())
        }
    }
}
const STEPS: [&str; 4] = [
    "after-pin-cas",
    "before-target-cas",
    "after-target-cas",
    "target-read-back",
];

fn interrupted(state: &Path, root: &Path, count: usize, writer: &str) {
    let (driver, repo) = open(state, root);
    let (mut handle, path) = seal(&repo);
    let mut made = Vec::new();
    let started = Instant::now();
    for n in 0..count {
        let reference =
            RefName::parse(&format!("refs/fgos/events/e3-{n:03}")).unwrap_or_else(|e| die(e));
        let step = STEPS[n % STEPS.len()];
        let id = format!("interrupted-{n:03}");
        let target = {
            let authority =
                HolderAuthority::new(&repo, &mut handle, &path, reference.clone(), writer)
                    .unwrap_or_else(|e| die(e.cause));
            commit(
                &PublicationPort::new(&driver, authority),
                &repo,
                &format!("interrupted {n}"),
            )
        };
        let authority = HolderAuthority::new(&repo, &mut handle, &path, reference.clone(), writer)
            .unwrap_or_else(|e| die(e.cause));
        let port = PublicationPort::with_filesystem(&driver, authority, StopAt(step));
        if port
            .compare_and_swap(
                &repo,
                &reference,
                &ExpectedTip::Absent,
                &ExpectedTip::Oid(target),
                &id,
            )
            .is_ok()
        {
            die(format!("{id} was not interrupted at {step}"));
        }
        made.push(json!({"id": id, "reference": reference.as_str(), "step": step}));
    }
    println!(
        "{}",
        json!({"operations": made, "seconds": started.elapsed().as_secs_f64()})
    );
}

/// The same publication workloads as the Node rows, called on the Rust port
/// in-process with no Node-API boundary: separates the addon's cost from the port's.
fn port_timing(state: &Path, root: &Path, samples: usize, writer: &str) {
    let (driver, repo) = open(state, root);
    let (mut handle, path) = seal(&repo);
    let reference = RefName::parse("refs/fgos/events/e3-rust").unwrap_or_else(|e| die(e));
    let authority = HolderAuthority::new(&repo, &mut handle, &path, reference.clone(), writer)
        .unwrap_or_else(|e| die(e.cause));
    let port = PublicationPort::new(&driver, authority);
    let ms = |started: Instant| started.elapsed().as_secs_f64() * 1000.0;
    let blobs: Vec<Vec<u8>> = (0..samples + 50)
        .map(|n| {
            format!("rust blob {n} {:?}", Instant::now())
                .repeat(32)
                .into_bytes()
        })
        .collect();
    for b in &blobs[..50] {
        port.write_blob(&repo, b).unwrap_or_else(|e| die(e.cause));
    }
    let mut fresh = Vec::new();
    for b in &blobs[50..] {
        let t = Instant::now();
        port.write_blob(&repo, b).unwrap_or_else(|e| die(e.cause));
        fresh.push(ms(t));
    }
    let mut existing = Vec::new();
    for b in &blobs[50..] {
        let t = Instant::now();
        port.write_blob(&repo, b).unwrap_or_else(|e| die(e.cause));
        existing.push(ms(t));
    }
    let mut tip = ExpectedTip::Absent;
    let mut done = Vec::new();
    let mut changing = Vec::new();
    for n in 0..samples + 20 {
        let next = commit(&port, &repo, &format!("rust cas {n}"));
        let id = format!("rust-cas-{n}");
        let t = Instant::now();
        port.compare_and_swap(
            &repo,
            &reference,
            &tip,
            &ExpectedTip::Oid(next.clone()),
            &id,
        )
        .unwrap_or_else(|e| die(e.cause));
        if n >= 20 {
            changing.push(ms(t));
            done.push((id, tip.clone(), next.clone()));
        }
        tip = ExpectedTip::Oid(next);
    }
    let mut noop = Vec::new();
    for (id, old, next) in &done {
        let t = Instant::now();
        port.compare_and_swap(&repo, &reference, old, &ExpectedTip::Oid(next.clone()), id)
            .unwrap_or_else(|e| die(e.cause));
        noop.push(ms(t));
    }
    println!(
        "{}",
        json!({"writeBlobNew": fresh, "writeBlobExisting": existing, "casChanging": changing, "casNoop": noop})
    );
}

/// Footprint of completed operations after the Rust-only compaction door.
fn compacted(state: &Path, root: &Path, count: usize, writer: &str) {
    let (driver, repo) = open(state, root);
    let (mut handle, path) = seal(&repo);
    let reference = RefName::parse("refs/fgos/events/e3-compacted").unwrap_or_else(|e| die(e));
    let authority = HolderAuthority::new(&repo, &mut handle, &path, reference.clone(), writer)
        .unwrap_or_else(|e| die(e.cause));
    let port = PublicationPort::new(&driver, authority);
    let mut tip = ExpectedTip::Absent;
    let mut ids = Vec::new();
    for n in 0..count {
        let next = commit(&port, &repo, &format!("compacted {n}"));
        let id = format!("compacted-{n:04}");
        port.compare_and_swap(
            &repo,
            &reference,
            &tip,
            &ExpectedTip::Oid(next.clone()),
            &id,
        )
        .unwrap_or_else(|e| die(e.cause));
        tip = ExpectedTip::Oid(next);
        ids.push(id);
    }
    let started = Instant::now();
    for id in &ids {
        port.release_pin_and_compact(&repo, id)
            .unwrap_or_else(|e| die(e.cause));
    }
    println!(
        "{}",
        json!({"compacted": ids.len(), "compactMs": started.elapsed().as_secs_f64() * 1000.0})
    );
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    match arg(&args, 1) {
        "backlog" => backlog(
            Path::new(arg(&args, 2)),
            number(&args, 3),
            match arg(&args, 4) {
                "intent" => false,
                "attempt" => true,
                other => die(format!("unknown backlog shape {other}")),
            },
            number(&args, 5).max(1),
        ),
        "scan" => scan(Path::new(arg(&args, 2)), number(&args, 3)),
        "interrupted" => interrupted(
            Path::new(arg(&args, 2)),
            Path::new(arg(&args, 3)),
            number(&args, 4),
            arg(&args, 5),
        ),
        "port" => port_timing(
            Path::new(arg(&args, 2)),
            Path::new(arg(&args, 3)),
            number(&args, 4),
            arg(&args, 5),
        ),
        "compacted" => compacted(
            Path::new(arg(&args, 2)),
            Path::new(arg(&args, 3)),
            number(&args, 4),
            arg(&args, 5),
        ),
        other => die(format!("unknown command {other}")),
    }
}
