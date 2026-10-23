//! Owning proof of the cache rules on real files: what is reused and what misses.
#![cfg(unix)]
mod common;

use std::fs::{self, File};
use std::path::PathBuf;
use std::time::SystemTime;

use common::{files, refs};
use fgos_config::cache::{snapshot_cached, SnapshotCache};
use fgos_config::detect::{Detectors, NoDetectors};
use fgos_config::schema::Schemas;
use fgos_config::snapshot::{Context, SessionClass, SnapshotRequest};
use fgos_config::standard::Standard;
use fgos_yaml_doc::{Segment, Value as Doc};
use serde_json::json;

struct Always;

impl Detectors for Always {
    fn detect(&self, _: &[Segment]) -> Option<Doc> {
        Some(Doc::Str("found".into()))
    }
}

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
        let schema = json!({"s": ["type: object", "properties:", "  a: {type: integer}", "  e: {type: string, x-fgos-absent: detected}"]});
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

#[test]
fn a_snapshot_holding_a_detected_value_is_never_reused() {
    let bed = Bed::new("detected");
    let ctx = Context {
        schemas: &bed.schemas,
        standard: &bed.standard,
        digest: "d",
        detectors: &Always,
    };
    let (req, mut cache) = (
        bed.request(SessionClass::Unconfined),
        SnapshotCache::default(),
    );
    for _ in 0..2 {
        assert_eq!(
            snapshot_cached(&mut cache, &ctx, &req).unwrap().value["s"]["e"],
            "found"
        );
    }
    assert_eq!((cache.stats.hits, cache.stats.misses), (0, 2));
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
