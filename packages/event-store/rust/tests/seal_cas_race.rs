#![cfg(target_os = "linux")]
mod common;
use common::Repo;
use fgos_event_store::{
    append::{append, AppendRequest, Positions},
    errors::ErrorCode,
    fsio::{FileSystem, Point},
    layout::Layout,
    seal::{seal_with_fs, SealRequest},
};
use fgos_git::{GitDriver, ResolveRepo};
use std::sync::Barrier;
struct Race<'a>(&'a Barrier);
impl FileSystem for Race<'_> {
    fn checkpoint(&self, p: Point) -> std::io::Result<()> {
        if p == Point::AfterSealObjects || p == Point::BeforeSealIntent {
            self.0.wait();
        }
        Ok(())
    }
}
#[test]
fn two_independent_stores_with_one_machine_ref_have_one_cas_winner() {
    let r = Repo::new();
    r.append(1);
    // Two independent local store roots deliberately collide on one machine
    // ref. Each has its own real seal exclusion; Git must enforce the CAS.
    let other = Layout {
        common_dir: r.layout.common_dir.clone(),
        root: r.layout.common_dir.join("fgos/events-other"),
    };
    std::fs::create_dir_all(other.root.join("locks")).unwrap();
    use std::os::unix::fs::PermissionsExt;
    std::fs::set_permissions(
        other.root.join("locks"),
        std::fs::Permissions::from_mode(0o700),
    )
    .unwrap();
    append(
        &other,
        &r.registry,
        AppendRequest {
            stream: &r.stream,
            events: &common::inputs(1),
            cursor: &Positions::new(),
            writer: "other-writer",
            machine: "test-aa2345",
            held_ranks: &[],
        },
    )
    .unwrap();
    // Prepare shared WAL metadata before racing operation-specific creation.
    // A mkdir checkpoint on a shared directory fires only for its creator;
    // using it as a two-party rendezvous can strand the other participant.
    let driver = GitDriver::new(&r.root).unwrap();
    let repo = match driver.resolve_repo(&r.root, &r.root).unwrap() {
        ResolveRepo::Repository(repo) => repo,
        _ => panic!(),
    };
    fgos_git::wal::Wal::open(&repo).unwrap();
    let barrier = Barrier::new(2);
    let results = std::thread::scope(|scope| {
        let workers: Vec<_> = [&r.layout, &other]
            .into_iter()
            .map(|layout| {
                let r = &r;
                let barrier = &barrier;
                scope.spawn(move || {
                    let d = GitDriver::new(&r.root).unwrap();
                    let repo = match d.resolve_repo(&r.root, &r.root).unwrap() {
                        ResolveRepo::Repository(r) => r,
                        _ => panic!(),
                    };
                    seal_with_fs(
                        &d,
                        &repo,
                        SealRequest {
                            layout,
                            machine: "test-aa2345",
                            stream: &r.stream,
                            held_ranks: &[],
                            hot_lock_depth: 0,
                            opportunistic: false,
                        },
                        &Race(barrier),
                    )
                })
            })
            .collect();
        workers
            .into_iter()
            .map(|w| w.join().unwrap())
            .collect::<Vec<_>>()
    });
    assert_eq!(results.iter().filter(|r| r.is_ok()).count(), 1);
    assert_eq!(
        results
            .iter()
            .filter(|r| r
                .as_ref()
                .is_err_and(|e| e.code == ErrorCode::EventStoreRefMoved))
            .count(),
        1
    );
    let closed = [
        r.layout.stream(&r.stream).closed(),
        other.stream(&r.stream).closed(),
    ]
    .iter()
    .map(|p| std::fs::read_dir(p).unwrap().count())
    .sum::<usize>();
    assert_eq!(closed, 1);
}
