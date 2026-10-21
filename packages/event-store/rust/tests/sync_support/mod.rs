#![allow(dead_code)]
use fgos_event_store::{
    append::{append, AppendRequest, Positions},
    cursor::Cursor,
    errors::Error,
    identity::StoreIdentity,
    layout::{Layout, StreamId},
    read::{read, ReadRequest},
    refspec::ensure_refspecs,
    sync::{sync, SyncRequest, Synced},
};
use fgos_git::*;
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};
#[path = "../common/mod.rs"]
mod common;
static NEXT: AtomicU64 = AtomicU64::new(0);
pub fn git(root: &Path, args: &[&str]) -> String {
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
    String::from_utf8(out.stdout).unwrap().trim().into()
}
pub struct World {
    pub root: PathBuf,
    pub remote: PathBuf,
}
impl World {
    pub fn new() -> Self {
        let root = std::env::temp_dir().join(format!(
            "es-sync-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&root).unwrap();
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        let remote = root.join("remote.git");
        git(&root, &["init", "--bare", "-q", remote.to_str().unwrap()]);
        Self { root, remote }
    }
    pub fn clone(&self, name: &str, machine: &str) -> Clone {
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
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        let driver = GitDriver::new(&self.root).unwrap();
        let repo = match driver.resolve_repo(&root, &root).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
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
        Clone {
            root,
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
pub struct Clone {
    pub root: PathBuf,
    pub driver: GitDriver,
    pub repo: RepoHandle,
    pub layout: Layout,
    pub machine: String,
}
impl Clone {
    pub fn setup(&self) {
        ensure_refspecs(&self.driver, &self.repo, "origin").unwrap()
    }
    pub fn append(&self, n: usize) {
        self.append_stream("project", n)
    }
    pub fn append_stream(&self, stream: &str, n: usize) {
        let mut registry = common::registry();
        let scope = if stream == "local" {
            "local"
        } else if stream.starts_with("branch:") {
            "branch"
        } else {
            "project"
        };
        if stream != "project" {
            registry = Default::default();
            registry.register(serde_json::from_value(serde_json::json!({"v":1,"types":[{"type":"fixture.add","domain":"fixture","scope":scope,"schemaVersion":1,"sealOnWrite":false}]})).unwrap()).unwrap();
        }
        let mut inputs = common::inputs(n);
        if stream != "project" {
            for input in &mut inputs {
                input.event_type = "fixture.add".into();
            }
        }
        append(
            &self.layout,
            &registry,
            AppendRequest {
                stream: &StreamId::parse(stream).unwrap(),
                events: &inputs,
                cursor: &Positions::new(),
                writer: "sync-test",
                machine: &self.machine,
                held_ranks: &[],
            },
        )
        .unwrap();
    }
    pub fn sync(&self, no_push: bool) -> std::result::Result<Synced, Error> {
        sync(
            &self.driver,
            &self.repo,
            SyncRequest {
                layout: &self.layout,
                machine: &self.machine,
                remote: "origin",
                no_push,
                held_ranks: &[],
                hot_lock_depth: 0,
            },
        )
    }
    pub fn tip(&self) -> String {
        git(
            &self.root,
            &["rev-parse", &format!("refs/fgos/events/{}", self.machine)],
        )
    }
    pub fn hashes(&self) -> Vec<String> {
        let origin = if self.layout.store().exists() {
            StoreIdentity::open(&self.layout, &self.machine)
                .unwrap()
                .store_id
        } else {
            "0".repeat(32)
        };
        let result = read(
            &self.driver,
            &self.repo,
            ReadRequest {
                layout: &self.layout,
                origin: &origin,
                streams: &[StreamId::parse("project").unwrap()],
                cursor: &Cursor::default(),
                folded: &[],
                project: true,
            },
        )
        .unwrap();
        result.sequence.iter().map(|e| e.h.clone()).collect()
    }
    pub fn with_port<T>(&self, f: impl FnOnce(&PublicationPort<'_>) -> T) -> T {
        let mut handle = match fgos_holder_lock::acquire(
            &fgos_holder_lock::Resource::new("event-seal", self.layout.seal_lock()),
            fgos_holder_lock::Mode::Ex,
            // Sibling test threads fork Git children that briefly hold a copy of
            // every descriptor until they exec; the lock is truthfully held till then.
            fgos_holder_lock::Wait::Ms(30_000),
            2000,
        ) {
            fgos_holder_lock::Acquire::Acquired(h) => h,
            x => panic!("{x:?}"),
        };
        let writer = StoreIdentity::open(&self.layout, &self.machine)
            .unwrap()
            .store_id;
        let p = PublicationPort::new(
            &self.driver,
            HolderAuthority::new(
                &self.repo,
                &mut handle,
                &self.layout.seal_lock(),
                RefName::parse(&format!("refs/fgos/events/{}", self.machine)).unwrap(),
                &writer,
            )
            .unwrap(),
        )
        .with_remote(RemoteGrant {
            name: "origin".into(),
            pinned_url: self.driver.remote_url(&self.repo, "origin").unwrap(),
        });
        f(&p)
    }
}
