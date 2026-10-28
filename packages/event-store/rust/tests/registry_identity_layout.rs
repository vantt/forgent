#![cfg(target_os = "linux")]
use fgos_event_store::{
    envelope::Scope,
    identity::{machine_id, StoreIdentity},
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
fn git() -> Command {
    let mut cmd = Command::new("git");
    for (key, _) in std::env::vars_os() {
        if key.to_string_lossy().starts_with("GIT_") {
            cmd.env_remove(key);
        }
    }
    cmd
}
static NEXT: AtomicU64 = AtomicU64::new(0);
struct Repo(PathBuf);
impl Repo {
    fn new() -> Self {
        let root = std::env::temp_dir().join(format!(
            "es-registry-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(&root).unwrap();
        assert!(git()
            .args(["init", "-q"])
            .arg(&root)
            .status()
            .unwrap()
            .success());
        Self(root)
    }
    fn layout(&self) -> Layout {
        Layout::from_common_dir(Some(&self.0.join(".git"))).unwrap()
    }
}
impl Drop for Repo {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}
fn contract(t: &str, domain: &str, scope: &str) -> ConsumerContract {
    serde_json::from_value(json!({"v":1,"types":[{"type":t,"domain":domain,"schemaVersion":1,"scope":scope,"sealOnWrite":false}]})).unwrap()
}
#[test]
fn consumer_registration_rules_and_metadata() {
    let mut registry = Registry::default();
    assert!(registry.get("store.promote").unwrap().seal_on_write);
    assert_eq!(
        registry.get("missing").unwrap_err().code.as_str(),
        "event-store-unregistered-type"
    );
    for (name, domain, scope) in [
        ("work.add", "work", "project"),
        ("decision", "decisions", "project"),
        ("observe.trace", "observe", "local"),
        ("draft.edit", "draft", "branch"),
    ] {
        registry.register(contract(name, domain, scope)).unwrap();
    }
    assert!(
        !registry
            .validate("observe.trace", Scope::Local, 1)
            .unwrap()
            .seal_on_write
    );
    assert!(registry
        .validate("observe.trace", Scope::Project, 1)
        .is_err());
    assert!(registry.validate("observe.trace", Scope::Local, 2).is_err());
    assert!(registry
        .register(contract("work.add", "work", "branch"))
        .is_err());
    assert!(registry
        .register(contract("work.other", "work", "local"))
        .is_err());
    assert!(registry
        .register(contract("decision", "decisions", "branch"))
        .is_err());
    assert!(registry
        .register(contract("observe.trace", "observe", "local"))
        .is_err());
    assert!(registry
        .register(contract("wrong.name", "other", "project"))
        .is_err());
    assert!(registry
        .register(contract("store.promote", "store", "project"))
        .is_err());
    let mut bad = contract("test.foo", "test", "project");
    bad.types[0].schema_version = 0;
    assert!(registry.register(bad).is_err());
}
#[test]
fn files_are_versioned_strict_and_loaded_atomically() {
    let repo = Repo::new();
    let a = repo.0.join("a.json");
    let b = repo.0.join("b.json");
    fs::write(&a, r#"{"v":1,"types":[{"type":"test.a","domain":"test","schemaVersion":2,"scope":"project","sealOnWrite":true}]}"#).unwrap();
    fs::write(&b, r#"{"v":2,"types":[]}"#).unwrap();
    let mut registry = Registry::default();
    assert!(registry.load_files(&[&a, &b]).is_err());
    assert!(registry.get("test.a").is_err());
    registry.load_files(&[&a]).unwrap();
    assert!(
        registry
            .validate("test.a", Scope::Project, 2)
            .unwrap()
            .seal_on_write
    );
    for text in [
        r#"{"v":1,"types":[{"type":"test.b","domain":"test","schemaVersion":1,"scope":"project"}]}"#,
        r#"{"v":1,"types":[],"extra":true}"#,
        r#"{"v":1,"types":[{"type":"test.b","domain":"test","schemaVersion":1,"scope":"bad","sealOnWrite":true}]}"#,
    ] {
        fs::write(&b, text).unwrap();
        assert!(registry.load_files(&[&b]).is_err());
    }
}
/// The registry native callers take holds every type of every contract the consumer manifest
/// lists, exactly as loading those files by path does for the payload; no test covered it, since
/// before it only the payload read the manifest.
#[test]
fn shipped_registry_registers_every_manifest_consumer_as_loading_its_files() {
    let repo = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let manifest: serde_json::Value = serde_json::from_slice(
        &fs::read(repo.join("packages/event-store/contracts/consumers.v1.json")).unwrap(),
    )
    .unwrap();
    let files: Vec<PathBuf> = manifest["consumers"]
        .as_array()
        .unwrap()
        .iter()
        .map(|entry| repo.join(entry["contractFile"].as_str().unwrap()))
        .collect();
    let mut loaded = Registry::default();
    loaded.load_files(&files).unwrap();
    let shipped = Registry::shipped().unwrap();
    let mut checked = 0;
    for file in &files {
        let contract: serde_json::Value = serde_json::from_slice(&fs::read(file).unwrap()).unwrap();
        for item in contract["types"].as_array().unwrap() {
            let t = item["type"].as_str().unwrap();
            assert_eq!(shipped.get(t).unwrap(), loaded.get(t).unwrap(), "{t}");
            checked += 1;
        }
    }
    assert!(shipped.get("identity.session-published").is_ok());
    assert!(checked > 0);
}
#[test]
fn machine_identity_precedence_and_validation() {
    let repo = Repo::new();
    assert!(machine_id(None, &repo.0).is_err());
    fs::write(repo.0.join("machine-id"), "home-abc123\n").unwrap();
    assert_eq!(machine_id(None, &repo.0).unwrap(), "home-abc123");
    assert_eq!(machine_id(Some("clone-123"), &repo.0).unwrap(), "clone-123");
    assert!(machine_id(Some("INVALID"), &repo.0).is_err());
}
#[test]
fn identity_is_stable_and_copies_moves_and_machine_changes_refuse() {
    let repo = Repo::new();
    let layout = repo.layout();
    let id = StoreIdentity::initialize_under_append_lock(
        &layout,
        "machine-1",
        "2026-10-18T00:00:00.000Z",
    )
    .unwrap();
    assert_eq!(id.store_id.len(), 32);
    let bytes = fs::read(layout.store()).unwrap();
    assert_eq!(
        StoreIdentity::initialize_under_append_lock(
            &layout,
            "machine-1",
            "2026-10-19T00:00:00.000Z"
        )
        .unwrap(),
        id
    );
    assert_eq!(fs::read(layout.store()).unwrap(), bytes);
    assert_eq!(
        StoreIdentity::open(&layout, "machine-2")
            .unwrap_err()
            .code
            .as_str(),
        "event-store-store-moved"
    );
    let copy = Repo::new();
    fs::create_dir_all(&copy.layout().root).unwrap();
    fs::write(copy.layout().store(), &bytes).unwrap();
    assert_eq!(
        StoreIdentity::open(&copy.layout(), "machine-1")
            .unwrap_err()
            .code
            .as_str(),
        "event-store-store-moved"
    );
    let mut altered = id.clone();
    altered.common_dir_dev_ino = "0:0".into();
    fs::write(layout.store(), serde_json::to_vec(&altered).unwrap()).unwrap();
    assert_eq!(
        StoreIdentity::open(&layout, "machine-1")
            .unwrap_err()
            .code
            .as_str(),
        "event-store-store-moved"
    );
    fs::write(layout.store(), b"broken").unwrap();
    assert!(StoreIdentity::initialize_under_append_lock(
        &layout,
        "machine-1",
        "2026-10-18T00:00:00.000Z"
    )
    .is_err());
    assert_eq!(fs::read(layout.store()).unwrap(), b"broken");
}
/// Moving the clone moves `store.json` with it, so the store keeps its id (the
/// copy case above is the one that must refuse: a copy has a new inode). The
/// refusal test above never renames a clone, so nothing else proves a moved
/// path opens.
#[test]
fn a_clone_moved_to_another_path_keeps_its_store_id() {
    let repo = Repo::new();
    let id = StoreIdentity::initialize_under_append_lock(
        &repo.layout(),
        "machine-1",
        "2026-10-18T00:00:00.000Z",
    )
    .unwrap();
    let moved = Repo(repo.0.with_file_name(format!(
        "{}-moved",
        repo.0.file_name().unwrap().to_str().unwrap()
    )));
    fs::rename(&repo.0, &moved.0).unwrap();
    let opened = StoreIdentity::open(&moved.layout(), "machine-1").unwrap_or_else(|error| {
        panic!("a moved clone (same directory, new path) must keep its store: {error}")
    });
    assert_eq!(opened.store_id, id.store_id);
}
#[test]
fn layouts_and_linked_worktrees_share_common_root() {
    let repo = Repo::new();
    assert_eq!(
        Layout::from_common_dir(None).unwrap_err().code.as_str(),
        "event-store-no-repository"
    );
    assert!(Layout::from_common_dir(Some(std::path::Path::new("relative"))).is_err());
    let layout = repo.layout();
    for value in ["project", "project:porting", "local", "branch:feature-one"] {
        let stream = layout.stream(&StreamId::parse(value).unwrap());
        assert_eq!(
            stream.active(),
            layout.root.join(value).join("active.jsonl")
        );
        assert!(stream.segment(1, 2).unwrap().ends_with("closed/1-2.jsonl"));
        assert!(stream.segment(2, 1).is_err());
        assert!(stream.hwm().ends_with("hwm.json"));
        assert!(stream.sealed().ends_with("sealed.json"));
    }
    for bad in [
        "branch:../x",
        "project:a/b",
        "branch:",
        "branch:A",
        "branch:-a",
        "project:foo:bar",
    ] {
        assert!(StreamId::parse(bad).is_err());
    }
    assert!(layout.append_lock().ends_with("locks/event-append.lock"));
    assert!(layout.seal_lock().ends_with("locks/event-seal.lock"));
    assert!(git()
        .current_dir(&repo.0)
        .args([
            "-c",
            "user.name=Test",
            "-c",
            "user.email=test@example.com",
            "commit",
            "--allow-empty",
            "-qm",
            "seed"
        ])
        .status()
        .unwrap()
        .success());
    let linked = repo.0.join("linked");
    assert!(git()
        .current_dir(&repo.0)
        .args(["worktree", "add", "-q", "-b", "linked"])
        .arg(&linked)
        .status()
        .unwrap()
        .success());
    let output = git()
        .current_dir(linked)
        .args(["rev-parse", "--path-format=absolute", "--git-common-dir"])
        .output()
        .unwrap();
    let common = PathBuf::from(String::from_utf8(output.stdout).unwrap().trim());
    assert_eq!(
        Layout::from_common_dir(Some(&common)).unwrap().root,
        layout.root
    );
}

#[test]
fn envelope_and_seen_keys_use_the_same_safe_stream_grammar() {
    let vector: serde_json::Value = serde_json::from_str(include_str!(
        "../../contracts/vectors/canonical-hash.v1.json"
    ))
    .unwrap();
    // Use a real shared envelope vector; hashing is recomputed by the existing API.
    let mut event: fgos_event_store::envelope::Envelope =
        serde_json::from_str(vector[0]["canonical"].as_str().unwrap()).unwrap();
    event.stream = "project:../escape".into();
    event.h = event.compute_hash().unwrap();
    assert!(event.validate().is_err());
    event.stream = "project".into();
    event.seen.insert("other:branch:../escape".into(), 1);
    event.h = event.compute_hash().unwrap();
    assert!(event.validate().is_err());
}

#[test]
fn concurrent_initializers_return_one_durable_identity() {
    let repo = Repo::new();
    let layout = repo.layout();
    let barrier = std::sync::Arc::new(std::sync::Barrier::new(16));
    let threads: Vec<_> = (0..16)
        .map(|_| {
            let layout = layout.clone();
            let barrier = barrier.clone();
            std::thread::spawn(move || {
                barrier.wait();
                StoreIdentity::initialize_under_append_lock(
                    &layout,
                    "machine-1",
                    "2026-10-18T00:00:00.000Z",
                )
                .unwrap()
            })
        })
        .collect();
    let ids: Vec<_> = threads.into_iter().map(|t| t.join().unwrap()).collect();
    let stored = StoreIdentity::open(&layout, "machine-1").unwrap();
    assert!(ids.iter().all(|id| id == &stored));
    assert_eq!(fs::read_dir(&layout.root).unwrap().count(), 1);
}

#[test]
fn locked_recovery_sweeps_only_identity_temps() {
    let repo = Repo::new();
    let layout = repo.layout();
    fs::create_dir_all(&layout.root).unwrap();
    let stale = layout.root.join(format!("store.{}.tmp", "a".repeat(32)));
    fs::write(&stale, "interrupted").unwrap();
    fs::write(layout.root.join("store.other.tmp"), "keep").unwrap();
    let id = StoreIdentity::initialize_under_append_lock(
        &layout,
        "machine-1",
        "2026-10-18T00:00:00.000Z",
    )
    .unwrap();
    StoreIdentity::sweep_temps_under_append_lock(&layout).unwrap();
    assert!(!stale.exists());
    assert!(layout.root.join("store.other.tmp").exists());
    assert_eq!(StoreIdentity::open(&layout, "machine-1").unwrap(), id);
}
