//! Owning proof of the cache rules on real files: what is reused and what misses.
#![cfg(unix)]
mod common;

use std::fs::{self, File};
use std::path::PathBuf;
use std::time::SystemTime;

use common::{files, refs};
use fgos_config::cache::{machine_cached, snapshot_cached, SnapshotCache};
use fgos_config::detect::{Detectors, NoDetectors};
use fgos_config::schema::Schemas;
use fgos_config::snapshot::{Context, SessionClass, SnapshotRequest};
use fgos_config::standard::Standard;
use fgos_yaml_doc::{Segment, Value as Doc};
use serde_json::json;

struct Bed {
    dir: PathBuf,
    schemas: Schemas,
    standard: Standard,
}

impl Bed {
    fn new(name: &str) -> Bed {
        let dir =
            std::env::temp_dir().join(format!("fgos-config-cache-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("project/.fgos")).unwrap();
        let schema = json!({"s": ["type: object", "properties:", "  a: {type: integer}", "  e: {type: string, x-fgos-absent: detected}"],
            "t": ["type: object", "properties:", "  k: {type: string, x-fgos-file: token, x-fgos-scope: global-only, x-fgos-sensitivity: secret-value}"]});
        let schema_files = files(&schema, true);
        let schemas = Schemas::parse(&refs(&schema_files)).unwrap();
        let standard_files = files(&json!({"s": ["s:", "  a: 1"]}), false);
        let standard = Standard::parse(&refs(&standard_files), &schemas).unwrap();
        Bed {
            dir,
            schemas,
            standard,
        }
    }

    fn request(&self, class: SessionClass) -> SnapshotRequest {
        SnapshotRequest {
            project_root: self.dir.join("project"),
            trusted_root: self.dir.join("project"),
            global_dir: self.dir.join("home/.fgos"),
            class,
        }
    }

    fn write(&self, text: &str) {
        fs::write(self.dir.join("project/.fgos/config.yaml"), text).unwrap();
    }
}

#[test]
fn an_unchanged_source_reuses_the_snapshot_and_a_changed_one_misses() {
    let bed = Bed::new("reuse");
    bed.write("s:\n  a: 2\n");
    let ctx = Context {
        schemas: &bed.schemas,
        standard: &bed.standard,
        digest: "d",
        detectors: &NoDetectors,
    };
    let (req, mut cache) = (
        bed.request(SessionClass::Unconfined),
        SnapshotCache::default(),
    );
    assert_eq!(
        snapshot_cached(&mut cache, &ctx, &req).unwrap().value["s"]["a"],
        2
    );
    assert_eq!(
        snapshot_cached(&mut cache, &ctx, &req).unwrap().value["s"]["a"],
        2
    );
    assert_eq!((cache.stats.hits, cache.stats.misses), (1, 1));
    // Same size, same modification time, different bytes: the hash decides, not the stat.
    let path = bed.dir.join("project/.fgos/config.yaml");
    let before: SystemTime = fs::metadata(&path).unwrap().modified().unwrap();
    bed.write("s:\n  a: 3\n");
    File::options()
        .write(true)
        .open(&path)
        .unwrap()
        .set_modified(before)
        .unwrap();
    assert_eq!(
        snapshot_cached(&mut cache, &ctx, &req).unwrap().value["s"]["a"],
        3
    );
    assert_eq!((cache.stats.hits, cache.stats.misses), (1, 2));
}

#[test]
fn a_new_bundle_digest_a_new_class_or_a_new_root_misses() {
    let bed = Bed::new("keys");
    bed.write("s:\n  a: 2\n");
    let mut cache = SnapshotCache::default();
    let ctx = |digest| Context {
        schemas: &bed.schemas,
        standard: &bed.standard,
        digest,
        detectors: &NoDetectors,
    };
    let req = bed.request(SessionClass::Unconfined);
    let other_root = SnapshotRequest {
        project_root: bed.dir.join("other"),
        ..req.clone()
    };
    for (digest, request) in [
        ("d", &req),
        ("d", &req),
        ("e", &req),
        ("e", &bed.request(SessionClass::Confined)),
        ("e", &other_root),
    ] {
        snapshot_cached(&mut cache, &ctx(digest), request).unwrap();
    }
    assert_eq!((cache.stats.hits, cache.stats.misses), (1, 4));
}

/// Finds a value, and says what it read: the text changes when the answer would.
struct Reads(std::cell::Cell<u32>, std::cell::RefCell<String>);

impl Detectors for Reads {
    fn detect(&self, _: &[Segment]) -> Option<Doc> {
        self.0.set(self.0.get() + 1);
        Some(Doc::Str(self.1.borrow().clone()))
    }

    fn fingerprint(&self) -> String {
        self.1.borrow().clone()
    }
}

#[test]
fn a_snapshot_holding_a_detected_value_is_reused_until_what_detection_reads_changes() {
    let bed = Bed::new("detected");
    let detectors = Reads(Default::default(), std::cell::RefCell::new("one".into()));
    let ctx = Context {
        schemas: &bed.schemas,
        standard: &bed.standard,
        digest: "d",
        detectors: &detectors,
    };
    let (req, mut cache) = (
        bed.request(SessionClass::Unconfined),
        SnapshotCache::default(),
    );
    for _ in 0..3 {
        let got = snapshot_cached(&mut cache, &ctx, &req).unwrap();
        assert_eq!(got.value["s"]["e"], "one");
    }
    assert_eq!((cache.stats.hits, cache.stats.misses), (2, 1));
    assert_eq!(detectors.0.get(), 1, "detection ran once, not on a hit");
    *detectors.1.borrow_mut() = "two".into();
    let got = snapshot_cached(&mut cache, &ctx, &req).unwrap();
    assert_eq!(got.value["s"]["e"], "two");
    assert_eq!((cache.stats.hits, cache.stats.misses), (2, 2));
}

#[test]
fn a_refused_read_is_not_cached() {
    let bed = Bed::new("refused");
    let ctx = Context {
        schemas: &bed.schemas,
        standard: &bed.standard,
        digest: "d",
        detectors: &NoDetectors,
    };
    let (req, mut cache) = (
        bed.request(SessionClass::Unconfined),
        SnapshotCache::default(),
    );
    bed.write("s:\n  a: [\n");
    assert!(snapshot_cached(&mut cache, &ctx, &req).is_err());
    bed.write("s:\n  a: 4\n");
    assert_eq!(
        snapshot_cached(&mut cache, &ctx, &req).unwrap().value["s"]["a"],
        4
    );
}

#[test]
fn a_change_to_the_token_file_alone_misses() {
    let bed = Bed::new("token");
    let ctx = Context {
        schemas: &bed.schemas,
        standard: &bed.standard,
        digest: "d",
        detectors: &NoDetectors,
    };
    let (req, mut cache) = (
        bed.request(SessionClass::Unconfined),
        SnapshotCache::default(),
    );
    let (global, token) = (
        bed.dir.join("home/.fgos"),
        bed.dir.join("home/.fgos/private"),
    );
    fs::create_dir_all(&token).unwrap();
    fs::write(global.join("config.yaml"), "t:\n  k: old\n").unwrap();
    // The token file holds the key, so the global file's copy is shadowed and the read is sound.
    fs::write(token.join("gateway-token"), "tok\n").unwrap();
    snapshot_cached(&mut cache, &ctx, &req).unwrap();
    // Without it the same global file is a key in the wrong file: the cache must not answer.
    fs::remove_file(token.join("gateway-token")).unwrap();
    assert!(snapshot_cached(&mut cache, &ctx, &req).is_err());
    assert_eq!((cache.stats.hits, cache.stats.misses), (0, 1));
}

#[test]
fn the_machine_view_is_reused_until_a_machine_file_changes_and_never_serves_a_project_read() {
    let bed = Bed::new("machine");
    let ctx = Context {
        schemas: &bed.schemas,
        standard: &bed.standard,
        digest: "d",
        detectors: &NoDetectors,
    };
    let req = bed.request(SessionClass::Unconfined);
    let mut cache = SnapshotCache::default();
    let machine = |cache: &mut SnapshotCache| {
        machine_cached(cache, &ctx, &req.global_dir, SessionClass::Unconfined)
            .map(|s| s.value["s"]["a"].clone())
            .unwrap()
    };
    assert_eq!(machine(&mut cache), 1);
    assert_eq!(machine(&mut cache), 1);
    assert_eq!((cache.stats.hits, cache.stats.misses), (1, 1));
    fs::create_dir_all(req.global_dir.clone()).unwrap();
    fs::write(req.global_dir.join("config.yaml"), "s:\n  a: 5\n").unwrap();
    assert_eq!(machine(&mut cache), 5, "a changed machine file misses");
    // A project read is another key: it misses even though the machine view is held.
    bed.write("s:\n  a: 9\n");
    let got = snapshot_cached(&mut cache, &ctx, &req).unwrap();
    assert_eq!(got.value["s"]["a"], 9);
    assert_eq!((cache.stats.hits, cache.stats.misses), (1, 3));
}
