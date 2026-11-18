#![cfg(target_os = "linux")]
//! The event queue over real clones: one Event Store per clone, peers joined through a bare remote.
use fgos_event_store::layout::Layout;
use fgos_git::{GitDriver, ResolveRepo};
use fgos_supervision::queue::{Queue, Raised, RaisedEvent};
use std::{
    fs,
    os::unix::fs::PermissionsExt,
    path::{Path, PathBuf},
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};

static NEXT: AtomicU64 = AtomicU64::new(0);

fn git(root: &Path, args: &[&str]) {
    let out = Command::new("git")
        .arg("-C")
        .arg(root)
        .args(args)
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "{args:?}: {}",
        String::from_utf8_lossy(&out.stderr)
    );
}

struct World {
    root: PathBuf,
    remote: PathBuf,
}
impl World {
    fn new() -> Self {
        let root = std::env::temp_dir().join(format!(
            "sup-queue-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&root).unwrap();
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        let remote = root.join("remote.git");
        git(&root, &["init", "--bare", "-q", remote.to_str().unwrap()]);
        World { root, remote }
    }
    fn clone(&self, name: &str, machine: &str) -> Clone {
        let root = self.root.join(name);
        git(
            &self.root,
            &[
                "clone",
                "-q",
                self.remote.to_str().unwrap(),
                root.to_str().unwrap(),
            ],
        );
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        let driver = GitDriver::new(&self.root).unwrap();
        let repo = match driver.resolve_repo(&root, &root).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!("repository required"),
        };
        let layout = Layout::from_common_dir(Some(repo.common_dir())).unwrap();
        let fence = root.join(".fgos/locks/activation.lock");
        fs::create_dir_all(&fence).unwrap();
        fs::write(
            fence.join("TOMBSTONE"),
            "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n",
        )
        .unwrap();
        fs::create_dir_all(layout.root.join("locks")).unwrap();
        for p in [layout.common_dir.join("fgos"), layout.root.join("locks")] {
            fs::set_permissions(p, fs::Permissions::from_mode(0o700)).unwrap();
        }
        fgos_git::RepositoryConfig::ensure_fetch_mapping(
            &driver,
            &repo,
            "origin",
            &fgos_git::publication_fetch_mappings("origin").unwrap(),
            &format!("queue-test-{}", NEXT.fetch_add(1, Ordering::Relaxed)),
        )
        .unwrap();
        Clone {
            driver,
            repo,
            layout,
            machine: machine.into(),
        }
    }
}
impl Drop for World {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

struct Clone {
    driver: GitDriver,
    repo: fgos_git::RepoHandle,
    layout: Layout,
    machine: String,
}
impl Clone {
    fn queue(&self) -> Queue {
        Queue::open(&self.layout, &self.machine, "queue-test").unwrap()
    }
    fn sync(&self) {
        fgos_event_store::sync::sync(
            &self.driver,
            &self.repo,
            fgos_event_store::sync::SyncRequest {
                layout: &self.layout,
                machine: &self.machine,
                remote: "origin",
                no_push: false,
                opportunistic: false,
                held_ranks: &[],
                hot_lock_depth: 0,
            },
        )
        .unwrap();
    }
}

fn event(id: &str, ts: &str) -> RaisedEvent {
    RaisedEvent {
        id: id.into(),
        kind: "lane-waiting".into(),
        subject: "item-1".into(),
        ts: ts.into(),
        reason: "waits for an answer".into(),
        next_command: "fgos supervisor next".into(),
    }
}
const A: &str = "00000000000000aa";
const B: &str = "00000000000000bb";

#[test]
fn the_same_id_raised_twice_is_one_unhandled_event_and_a_duplicate() {
    let w = World::new();
    let c = w.clone("a", "machine-aa");
    let q = c.queue();
    assert_eq!(
        q.raise(event(A, "2026-11-18T01:00:00.000Z")).unwrap(),
        Raised::New
    );
    assert_eq!(
        q.raise(event(A, "2026-11-18T01:00:00.000Z")).unwrap(),
        Raised::Duplicate
    );
    assert_eq!(q.unhandled().unwrap().len(), 1);
    assert_eq!(q.unhandled_count().unwrap(), 1);
}

#[test]
fn unhandled_orders_by_ts_then_id() {
    let w = World::new();
    let c = w.clone("a", "machine-aa");
    let q = c.queue();
    q.raise(event(B, "2026-11-18T01:00:00.000Z")).unwrap();
    q.raise(event(A, "2026-11-18T01:00:00.000Z")).unwrap();
    q.raise(event("00000000000000cc", "2026-11-18T00:00:00.000Z"))
        .unwrap();
    let ids: Vec<_> = q.unhandled().unwrap().into_iter().map(|e| e.id).collect();
    assert_eq!(ids, ["00000000000000cc", A, B]);
}

#[test]
fn mark_handled_closes_the_event_and_a_second_call_is_a_no_op() {
    let w = World::new();
    let c = w.clone("a", "machine-aa");
    let q = c.queue();
    q.raise(event(A, "2026-11-18T01:00:00.000Z")).unwrap();
    assert_eq!(q.mark_handled(&[A.into()], "supervisor").unwrap(), 1);
    assert!(q.unhandled().unwrap().is_empty());
    assert_eq!(q.mark_handled(&[A.into()], "supervisor").unwrap(), 0);
    assert_eq!(q.unhandled_count().unwrap(), 0);
}

#[test]
fn an_id_never_raised_refuses_event_unknown_and_writes_nothing() {
    let w = World::new();
    let c = w.clone("a", "machine-aa");
    let q = c.queue();
    q.raise(event(A, "2026-11-18T01:00:00.000Z")).unwrap();
    let error = q
        .mark_handled(&[A.into(), B.into()], "supervisor")
        .unwrap_err();
    assert_eq!(error.code, "event-unknown");
    assert_eq!(q.unhandled_count().unwrap(), 1);
}

#[test]
fn an_event_without_kind_ref_or_a_16_hex_id_is_refused_as_bad_event() {
    let w = World::new();
    let c = w.clone("a", "machine-aa");
    let q = c.queue();
    let mut no_kind = event(A, "t");
    no_kind.kind.clear();
    let mut no_ref = event(A, "t");
    no_ref.subject.clear();
    for bad in [
        no_kind,
        no_ref,
        event("xyz", "t"),
        event("00000000000000AA", "t"),
    ] {
        assert_eq!(q.raise(bad).unwrap_err().code, "bad-event");
    }
    assert_eq!(q.unhandled_count().unwrap(), 0);
}

#[test]
fn two_machine_mirrors_raising_one_id_show_one_event_and_a_peer_handle_closes_it() {
    let w = World::new();
    let a = w.clone("a", "machine-aa");
    let b = w.clone("b", "machine-bb");
    a.queue()
        .raise(event(A, "2026-11-18T01:00:00.000Z"))
        .unwrap();
    b.queue()
        .raise(event(A, "2026-11-18T01:00:00.000Z"))
        .unwrap();
    a.sync();
    b.sync();
    a.sync();
    assert_eq!(a.queue().unhandled().unwrap().len(), 1);
    assert_eq!(b.queue().unhandled().unwrap().len(), 1);
    b.queue().mark_handled(&[A.into()], "supervisor").unwrap();
    b.sync();
    a.sync();
    assert!(a.queue().unhandled().unwrap().is_empty());
}

#[test]
fn an_unreadable_store_is_store_unavailable_not_an_empty_list() {
    let w = World::new();
    let c = w.clone("a", "machine-aa");
    let q = c.queue();
    q.raise(event(A, "2026-11-18T01:00:00.000Z")).unwrap();
    fs::write(c.layout.store(), b"not json").unwrap();
    assert_eq!(q.unhandled().unwrap_err().code, "store-unavailable");
    assert_eq!(q.unhandled_count().unwrap_err().code, "store-unavailable");
}
