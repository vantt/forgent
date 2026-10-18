#![allow(dead_code)]
use fgos_event_store::{
    append::Positions,
    envelope::{sha256, BatchCommit, Envelope, Scope, Seal},
    layout::Layout,
};
use fgos_git::*;
use fgos_holder_lock::{acquire, Acquire, Handle, Mode, Resource, Wait};
use std::{
    fs,
    path::PathBuf,
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};
static NEXT: AtomicU64 = AtomicU64::new(0);
pub struct Fixture {
    pub root: PathBuf,
    pub repo: RepoHandle,
    pub driver: GitDriver,
    pub layout: Layout,
}
impl Fixture {
    pub fn new() -> Self {
        let root = std::env::temp_dir().join(format!(
            "es-reader-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&root).unwrap();
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        assert!(Command::new("git")
            .args(["init", "-q"])
            .arg(root.join("repo"))
            .status()
            .unwrap()
            .success());
        let driver = GitDriver::new(&root).unwrap();
        let repo = match driver
            .resolve_repo(&root.join("repo"), &root.join("repo"))
            .unwrap()
        {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        // Git WAL writers refuse a workspace without the controller's activation fence.
        let fence = repo.trusted_main_root().join(".fgos/locks/activation.lock");
        fs::create_dir_all(&fence).unwrap();
        fs::write(
            fence.join("TOMBSTONE"),
            "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n",
        )
        .unwrap();
        let layout = Layout::from_common_dir(Some(repo.common_dir())).unwrap();
        fs::create_dir_all(layout.root.join("locks")).unwrap();
        fs::set_permissions(
            layout.common_dir.join("fgos"),
            fs::Permissions::from_mode(0o700),
        )
        .unwrap();
        assert!(Command::new("git")
            .arg("-C")
            .arg(root.join("repo"))
            .args(["config", "remote.origin.url"])
            .arg(root.join("repo"))
            .status()
            .unwrap()
            .success());
        fs::set_permissions(layout.root.join("locks"), fs::Permissions::from_mode(0o700)).unwrap();
        Self {
            root,
            repo,
            driver,
            layout,
        }
    }
    pub fn handle(&self) -> Handle {
        match acquire(
            &Resource::new("event-seal", self.layout.seal_lock()),
            Mode::Ex,
            Wait::Try,
            2000,
        ) {
            Acquire::Acquired(h) => h,
            e => panic!("{e:?}"),
        }
    }
    pub fn port<'a>(&'a self, h: &'a mut Handle, name: &str) -> PublicationPort<'a> {
        let path = h.path().to_path_buf();
        PublicationPort::new(
            &self.driver,
            HolderAuthority::new(
                &self.repo,
                h,
                &path,
                RefName::parse(&name.replace("refs/fgos/remotes/origin/", "refs/fgos/")).unwrap(),
                "reader-test",
            )
            .unwrap(),
        )
        .with_remote(RemoteGrant {
            name: "origin".into(),
            pinned_url: self.root.join("repo").to_str().unwrap().into(),
        })
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}
pub fn event(origin: char, seq: u64, ts: u32) -> Envelope {
    let mut e = Envelope {
        v: 4,
        event_type: "work.add".into(),
        scope: Scope::Project,
        origin: origin.to_string().repeat(32),
        stream: "project".into(),
        seq,
        seen: Positions::new(),
        ts: format!("2026-01-01T00:00:{ts:02}.000Z"),
        src: "writer".into(),
        schema_version: 1,
        payload: serde_json::json!({}),
        h: String::new(),
    };
    rehash(&mut e);
    e
}
pub fn rehash(e: &mut Envelope) {
    e.h = e.compute_hash().unwrap();
}
pub fn batch(events: &[Envelope]) -> Vec<u8> {
    let mut bytes = Vec::new();
    for e in events {
        bytes.extend(e.canonical_line().unwrap());
    }
    let m = BatchCommit {
        v: 4,
        kind: "batch-commit".into(),
        origin: events[0].origin.clone(),
        stream: events[0].stream.clone(),
        first_seq: events[0].seq,
        last_seq: events.last().unwrap().seq,
        count: events.len() as u64,
        sha256: sha256(&bytes),
    };
    bytes.extend(m.canonical_line().unwrap());
    bytes
}
pub fn commit(
    p: &dyn Publication,
    r: &RepoHandle,
    parents: Vec<Oid>,
    files: Vec<(&[u8], Vec<u8>)>,
) -> Oid {
    let entries: Vec<_> = files
        .into_iter()
        .map(|(name, bytes)| TreeEntry {
            name: name.to_vec(),
            mode: 0o100644,
            oid: p.write_blob(r, &bytes).unwrap(),
        })
        .collect();
    let tree = p.write_tree(r, &entries).unwrap();
    p.write_commit(
        r,
        &CommitInput {
            tree,
            parents,
            author: Identity {
                name: "Event Store".into(),
                email: "e@e".into(),
            },
            committer: Identity {
                name: "Event Store".into(),
                email: "e@e".into(),
            },
            author_date: "1792300000 +0700".into(),
            committer_date: "1792300000 +0700".into(),
            message: b"events".to_vec(),
        },
    )
    .unwrap()
}
pub fn seal(
    p: &dyn Publication,
    r: &RepoHandle,
    parents: Vec<Oid>,
    events: &[Envelope],
    machine: &str,
) -> Oid {
    let bytes = batch(events);
    let e = &events[0];
    let s = Seal::Seal {
        v: 1,
        machine_id: machine.into(),
        origin: e.origin.clone(),
        stream: e.stream.clone(),
        scope: e.scope,
        first_seq: e.seq,
        last_seq: events.last().unwrap().seq,
        count: events.len() as u64,
        sha256: sha256(&bytes),
    };
    commit(
        p,
        r,
        parents,
        vec![
            (b"events.jsonl", bytes),
            (b"seal.json", s.canonical_line().unwrap()),
        ],
    )
}
pub fn merge(p: &dyn Publication, r: &RepoHandle, a: &Oid, b: &Oid, machine: &str) -> Oid {
    let s = Seal::Merge {
        v: 1,
        machine_id: machine.into(),
        parents: [a.as_str().into(), b.as_str().into()],
    };
    commit(
        p,
        r,
        vec![a.clone(), b.clone()],
        vec![(b"seal.json", s.canonical_line().unwrap())],
    )
}
pub fn publish(
    p: &dyn Publication,
    r: &RepoHandle,
    name: &str,
    old: Option<Oid>,
    oid: Oid,
    id: &str,
) {
    let source = name.replace("refs/fgos/remotes/origin/", "refs/fgos/");
    p.compare_and_swap(
        r,
        &RefName::parse(&source).unwrap(),
        &old.map(ExpectedTip::Oid).unwrap_or(ExpectedTip::Absent),
        &ExpectedTip::Oid(oid),
        id,
    )
    .unwrap();
    if source != name {
        p.fetch_refs(
            r,
            "origin",
            &["+refs/fgos/events/*:refs/fgos/remotes/origin/events/*".into()],
        )
        .unwrap();
    }
}
pub fn commit_tree(p: &dyn Publication, r: &RepoHandle, tree: Oid) -> Oid {
    p.write_commit(
        r,
        &CommitInput {
            tree,
            parents: vec![],
            author: Identity {
                name: "Test".into(),
                email: "t@t".into(),
            },
            committer: Identity {
                name: "Test".into(),
                email: "t@t".into(),
            },
            author_date: "1792300000 +0700".into(),
            committer_date: "1792300000 +0700".into(),
            message: b"tracked fence".to_vec(),
        },
    )
    .unwrap()
}
pub fn tracked_head(f: &Fixture, p: &dyn Publication, path: &[u8], bytes: &[u8]) -> Oid {
    let blob = p.write_blob(&f.repo, bytes).unwrap();
    let fgos = p
        .write_tree(
            &f.repo,
            &[TreeEntry {
                name: path.to_vec(),
                mode: 0o100644,
                oid: blob,
            }],
        )
        .unwrap();
    let tree = p
        .write_tree(
            &f.repo,
            &[TreeEntry {
                name: b".fgos".to_vec(),
                mode: 0o040000,
                oid: fgos,
            }],
        )
        .unwrap();
    let oid = commit_tree(p, &f.repo, tree);
    let result = Command::new("git")
        .arg("-C")
        .arg(f.root.join("repo"))
        .args(["checkout", "-q", "--detach", oid.as_str()])
        .output()
        .unwrap();
    assert!(result.status.success(), "{result:?}");
    oid
}
