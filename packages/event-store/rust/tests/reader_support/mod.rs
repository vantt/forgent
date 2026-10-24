#![allow(dead_code)]
use fgos_event_store::{
    append::Positions,
    envelope::{sha256, BatchCommit, Envelope, Scope, Seal},
    layout::Layout,
};
use fgos_git::*;
use fgos_holder_lock::{acquire, Acquire, Handle, Mode, Resource, Wait};
use std::{
    cell::Cell,
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
            // Sibling test threads fork children holding a copy of the descriptor until exec.
            Wait::Ms(30_000),
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
/// A detached HEAD commit holding `files` (slash-separated paths) below `.fgos/`.
pub fn tracked_head_files(f: &Fixture, p: &dyn Publication, files: &[(&str, &[u8])]) -> Oid {
    fn tree(f: &Fixture, p: &dyn Publication, files: &[(&str, &[u8])]) -> Oid {
        let mut entries = Vec::new();
        let mut dirs: std::collections::BTreeMap<&str, Vec<(&str, &[u8])>> = Default::default();
        for (path, bytes) in files {
            match path.split_once('/') {
                Some((dir, rest)) => dirs.entry(dir).or_default().push((rest, bytes)),
                None => entries.push(TreeEntry {
                    name: path.as_bytes().to_vec(),
                    mode: 0o100644,
                    oid: p.write_blob(&f.repo, bytes).unwrap(),
                }),
            }
        }
        for (dir, children) in dirs {
            entries.push(TreeEntry {
                name: dir.as_bytes().to_vec(),
                mode: 0o040000,
                oid: tree(f, p, &children),
            });
        }
        entries.sort_by(|a, b| a.name.cmp(&b.name));
        p.write_tree(&f.repo, &entries).unwrap()
    }
    let fgos = tree(f, p, files);
    let root = p
        .write_tree(
            &f.repo,
            &[TreeEntry {
                name: b".fgos".to_vec(),
                mode: 0o040000,
                oid: fgos,
            }],
        )
        .unwrap();
    let oid = commit_tree(p, &f.repo, root);
    let result = Command::new("git")
        .arg("-C")
        .arg(f.root.join("repo"))
        .args(["checkout", "-q", "--detach", oid.as_str()])
        .output()
        .unwrap();
    assert!(result.status.success(), "{result:?}");
    oid
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

/// Counts the reads a walk asks its Git port for.
pub struct CountingPort<'a> {
    inner: &'a dyn Inspect,
    pub single: Cell<usize>,
    pub many: Cell<usize>,
    /// Commits asked for through `read_paths_at_many`, other than the tracked fence.
    pub read_commits: Cell<usize>,
    /// Requests for the tracked `.fgos/events` fence, however they are batched.
    pub fence: Cell<usize>,
    /// `list_tree` calls.
    pub trees: Cell<usize>,
    /// `list_refs` calls: every read observes the real ref tips.
    pub refs: Cell<usize>,
}
impl<'a> CountingPort<'a> {
    pub fn new(inner: &'a dyn Inspect) -> Self {
        Self {
            inner,
            single: Cell::new(0),
            many: Cell::new(0),
            read_commits: Cell::new(0),
            fence: Cell::new(0),
            trees: Cell::new(0),
            refs: Cell::new(0),
        }
    }
}
impl Inspect for CountingPort<'_> {
    fn resolve_head(&self, repo: &RepoHandle) -> Result<HeadFact> {
        self.inner.resolve_head(repo)
    }
    fn list_tree(
        &self,
        repo: &RepoHandle,
        revision: &Oid,
        prefix: &[u8],
        cursor: Option<TreeCursor>,
        max_entries: usize,
    ) -> Result<TreePage> {
        self.trees.set(self.trees.get() + 1);
        self.inner
            .list_tree(repo, revision, prefix, cursor, max_entries)
    }
    fn list_refs(
        &self,
        repo: &RepoHandle,
        prefixes: &[RefPrefix],
        cursor: Option<RefCursor>,
        max_entries: usize,
    ) -> Result<RefPage> {
        self.refs.set(self.refs.get() + 1);
        self.inner.list_refs(repo, prefixes, cursor, max_entries)
    }
    fn read_paths_at(
        &self,
        repo: &RepoHandle,
        revision: &Oid,
        paths: &[Vec<u8>],
        max_blob_bytes: usize,
    ) -> Result<Vec<PathRead>> {
        self.single.set(self.single.get() + 1);
        self.inner
            .read_paths_at(repo, revision, paths, max_blob_bytes)
    }
    fn read_paths_at_many(
        &self,
        repo: &RepoHandle,
        reads: &[(Oid, Vec<Vec<u8>>)],
        max_blob_bytes: usize,
    ) -> Result<Vec<Vec<PathRead>>> {
        self.many.set(self.many.get() + 1);
        let fence = reads
            .iter()
            .filter(|(_, paths)| paths.as_slice() == [b".fgos/events".to_vec()])
            .count();
        self.fence.set(self.fence.get() + fence);
        self.read_commits
            .set(self.read_commits.get() + reads.len() - fence);
        self.inner.read_paths_at_many(repo, reads, max_blob_bytes)
    }
    fn walk_commits(
        &self,
        repo: &RepoHandle,
        tips: &[Oid],
        stop: &[Oid],
        cursor: Option<WalkCursor>,
        bounds: WalkBounds,
    ) -> Result<WalkPage> {
        self.inner.walk_commits(repo, tips, stop, cursor, bounds)
    }
    fn configured_fetch_refspecs(
        &self,
        repo: &RepoHandle,
        remote: &str,
    ) -> Result<Vec<ConfigFact>> {
        self.inner.configured_fetch_refspecs(repo, remote)
    }
    fn push_refspecs(&self, repo: &RepoHandle, remote: &str) -> Result<Vec<ConfigFact>> {
        self.inner.push_refspecs(repo, remote)
    }
    fn remote_url(&self, repo: &RepoHandle, remote: &str) -> Result<String> {
        self.inner.remote_url(repo, remote)
    }
    fn machine_id(&self, repo: &RepoHandle) -> Result<Option<ConfigFact>> {
        self.inner.machine_id(repo)
    }
    fn git_floor_verdict(&self) -> Result<GitFloorVerdict> {
        self.inner.git_floor_verdict()
    }
    fn fetch_mapping_provenance(
        &self,
        repo: &RepoHandle,
        remote: &str,
    ) -> Result<Option<FetchMappingProvenance>> {
        self.inner.fetch_mapping_provenance(repo, remote)
    }
    fn resolve_repo(&self, path: &std::path::Path) -> Result<ResolveRepo> {
        self.inner.resolve_repo(path)
    }
}
