#![allow(dead_code)]
use fgos_event_store::{
    append::{self, AppendRequest, AppendResult, EventInput, Positions},
    layout::{Layout, StreamId},
    registry::{ConsumerContract, Registry},
};
use serde_json::json;
use std::{
    fs,
    path::PathBuf,
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};
static NEXT: AtomicU64 = AtomicU64::new(0);
pub struct Repo {
    pub root: PathBuf,
    pub layout: Layout,
    pub stream: StreamId,
    pub registry: Registry,
}
impl Repo {
    pub fn new() -> Self {
        let root = std::env::temp_dir().join(format!(
            "es-open-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&root).unwrap();
        let mut git = Command::new("git");
        for (k, _) in std::env::vars_os() {
            if k.to_string_lossy().starts_with("GIT_") {
                git.env_remove(k);
            }
        }
        assert!(git
            .args(["init", "-q"])
            .arg(&root)
            .status()
            .unwrap()
            .success());
        let layout = Layout::from_common_dir(Some(&root.join(".git"))).unwrap();
        fs::create_dir_all(layout.root.join("locks")).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(layout.root.join("locks"), fs::Permissions::from_mode(0o700))
                .unwrap();
        }
        Self {
            root,
            layout,
            stream: StreamId::parse("project").unwrap(),
            registry: registry(),
        }
    }
    pub fn append(&self, n: usize) -> AppendResult {
        self.append_cursor(n, &Positions::new()).unwrap()
    }
    pub fn append_cursor(
        &self,
        n: usize,
        cursor: &Positions,
    ) -> Result<AppendResult, fgos_event_store::errors::Error> {
        append::append(
            &self.layout,
            &self.registry,
            AppendRequest {
                stream: &self.stream,
                events: &inputs(n),
                cursor,
                writer: "writer-one",
                machine: "test-aa2345",
                held_ranks: &[60],
            },
        )
    }
}
impl Drop for Repo {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}
pub fn registry() -> Registry {
    let mut r = Registry::default();
    let c:ConsumerContract=serde_json::from_value(json!({"v":1,"types":[{"type":"work.add","domain":"work","scope":"project","schemaVersion":1,"sealOnWrite":false}]})).unwrap();
    r.register(c).unwrap();
    r
}
pub fn inputs(n: usize) -> Vec<EventInput> {
    (0..n)
        .map(|i| EventInput {
            event_type: "work.add".into(),
            schema_version: 1,
            payload: json!({"id":i,"text":"🦀"}),
            ts: "2026-10-18T05:00:00.000Z".into(),
        })
        .collect()
}
pub fn batch(origin: &str, first: u64, n: usize) -> Vec<u8> {
    use fgos_event_store::envelope::{sha256, BatchCommit, Envelope, Scope};
    let mut bytes = Vec::new();
    for (i, input) in inputs(n).into_iter().enumerate() {
        let mut e = Envelope {
            v: 4,
            event_type: input.event_type,
            scope: Scope::Project,
            origin: origin.into(),
            stream: "project".into(),
            seq: first + i as u64,
            seen: Default::default(),
            ts: input.ts,
            src: "writer-one".into(),
            schema_version: 1,
            payload: input.payload,
            h: String::new(),
        };
        e.h = e.compute_hash().unwrap();
        bytes.extend(e.canonical_line().unwrap());
    }
    let m = BatchCommit {
        v: 4,
        kind: "batch-commit".into(),
        origin: origin.into(),
        stream: "project".into(),
        first_seq: first,
        last_seq: first + n as u64 - 1,
        count: n as u64,
        sha256: sha256(&bytes),
    };
    bytes.extend(m.canonical_line().unwrap());
    bytes
}
