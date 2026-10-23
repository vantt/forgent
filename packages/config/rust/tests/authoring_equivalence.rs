//! Owning proof that the bundled standard files plus this repository's recorded differences read back
//! as this repository's tuned config (pinned in `authoring-source.config.json`), that no machine- or
//! owner-specific string is in the standard, and that the real `runner` keys sit in the files and
//! scopes the spec gives them. The generic scope and placement rules are owned by `golden_scope.rs`.
#![cfg(unix)]
mod common;

use std::fs;
use std::path::PathBuf;

use common::contracts;
use fgos_config::bundle;
use fgos_config::detect::NoDetectors;
use fgos_config::grammar::doc_lines;
use fgos_config::schema::Schemas;
use fgos_config::snapshot::{snapshot, Context, SessionClass, SnapshotError, SnapshotRequest};
use fgos_config::standard::Standard;
use fgos_yaml_doc::Segment;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};

type Path = Vec<String>;

fn read(path: PathBuf) -> String {
    fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()))
}

fn fixture() -> Value {
    serde_json::from_str(&read(contracts().join("fixtures/repo-differences.v1.json")))
        .expect("repo-differences.v1.json")
}

fn source_bytes() -> String {
    read(contracts().join("fixtures/authoring-source.config.json"))
}

fn paths(list: &Value, key: &str) -> Vec<Path> {
    let mut out: Vec<Path> = list[key]
        .as_array()
        .unwrap_or_else(|| panic!("{key}"))
        .iter()
        .map(|row| {
            let at = if row.is_array() { row } else { &row["path"] };
            at.as_array()
                .unwrap()
                .iter()
                .map(|s| s.as_str().unwrap().to_string())
                .collect()
        })
        .collect();
    out.sort();
    out
}

fn segments(path: &Path) -> Vec<Segment> {
    path.iter().map(|k| Segment::Key(k.clone())).collect()
}

fn at<'a>(value: &'a Value, path: &Path) -> Option<&'a Value> {
    path.iter()
        .try_fold(value, |node, key| node.get(key.as_str()))
}

fn put(root: &mut Value, path: &Path, value: Value) {
    let mut node = root;
    for key in &path[..path.len() - 1] {
        node = node
            .as_object_mut()
            .unwrap()
            .entry(key.clone())
            .or_insert_with(|| json!({}));
    }
    node.as_object_mut()
        .unwrap()
        .insert(path[path.len() - 1].clone(), value);
}

fn remove(root: &mut Value, path: &Path) {
    let mut node = root;
    for key in &path[..path.len() - 1] {
        match node.get_mut(key.as_str()) {
            Some(next) => node = next,
            None => return,
        }
    }
    if let Some(map) = node.as_object_mut() {
        map.remove(&path[path.len() - 1]);
    }
}

fn excluded(path: &Path, exclusions: &[Path]) -> bool {
    exclusions.iter().any(|e| path.starts_with(e))
}

/// Where `source` differs from `standard`: maps are compared per entry, a list or scalar is one leaf.
/// Returns (differences, standard-only).
fn compare(source: &Value, standard: &Value, exclusions: &[Path]) -> (Vec<Path>, Vec<Path>) {
    fn walk(s: &Value, t: &Value, p: &mut Path, ex: &[Path], d: &mut Vec<Path>, o: &mut Vec<Path>) {
        if excluded(p, ex) {
            return;
        }
        match (s.as_object(), t.as_object()) {
            (Some(sm), Some(tm)) => {
                for (key, value) in sm {
                    p.push(key.clone());
                    match tm.get(key) {
                        Some(other) => walk(value, other, p, ex, d, o),
                        None if !excluded(p, ex) => d.push(p.clone()),
                        None => {}
                    }
                    p.pop();
                }
                for key in tm.keys().filter(|k| !sm.contains_key(*k)) {
                    p.push(key.clone());
                    if !excluded(p, ex) {
                        o.push(p.clone());
                    }
                    p.pop();
                }
            }
            _ if s != t => d.push(p.clone()),
            _ => {}
        }
    }
    let (mut d, mut o) = (Vec::new(), Vec::new());
    walk(
        source,
        standard,
        &mut Vec::new(),
        exclusions,
        &mut d,
        &mut o,
    );
    d.sort();
    o.sort();
    (d, o)
}

fn temp(id: &str) -> PathBuf {
    let dir =
        std::env::temp_dir().join(format!("fgos-config-authoring-{id}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    dir
}

fn request(dir: &std::path::Path) -> SnapshotRequest {
    SnapshotRequest {
        project_root: dir.join("project"),
        trusted_root: dir.join("project"),
        global_dir: dir.join("home/.fgos"),
        class: SessionClass::Unconfined,
    }
}

/// A snapshot with `project` as the project file and `global` as the global file (JSON is a legal
/// legacy config file), on the bundled schemas and standard.
fn read_back(
    id: &str,
    project: Option<&Value>,
    global: Option<&Value>,
) -> Result<Value, Vec<&'static str>> {
    let (schemas, digest) = Schemas::bundled().unwrap();
    let standard = Standard::bundled(&schemas).unwrap();
    let dir = temp(id);
    for (rel, value) in [
        ("project/.fgos/config.json", project),
        ("home/.fgos/config.json", global),
    ] {
        if let Some(value) = value {
            let path = dir.join(rel);
            fs::create_dir_all(path.parent().unwrap()).unwrap();
            fs::write(path, value.to_string()).unwrap();
        }
    }
    let ctx = Context {
        schemas: &schemas,
        standard: &standard,
        digest: &digest,
        detectors: &NoDetectors,
    };
    let got = snapshot(&ctx, &request(&dir));
    let _ = fs::remove_dir_all(&dir);
    match got {
        Ok(snap) => Ok(snap.value),
        Err(SnapshotError::Refused(found)) => Err(found.iter().map(|r| r.code).collect()),
        Err(SnapshotError::Io(e)) => panic!("{id}: {e}"),
    }
}

#[test]
fn the_pinned_source_is_the_file_the_fixture_names() {
    let fixture = fixture();
    let digest: String = Sha256::digest(source_bytes().as_bytes())
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect();
    assert_eq!(
        digest, fixture["source"]["sha256"],
        "authoring-source.config.json changed"
    );
}

#[test]
fn standard_files_plus_the_recorded_differences_read_back_as_the_tuned_config() {
    let fixture = fixture();
    let source: Value = serde_json::from_str(&source_bytes()).unwrap();
    let exclusions = paths(&fixture, "exclusions");
    let (schemas, _) = Schemas::bundled().unwrap();
    let standard = Standard::bundled(&schemas).unwrap();

    let (differences, standard_only) = compare(&source, standard.value(), &exclusions);
    assert_eq!(
        differences,
        paths(&fixture, "differences"),
        "differences found vs recorded"
    );
    assert_eq!(
        standard_only,
        paths(&fixture, "standard-only"),
        "standard-only paths found vs recorded"
    );
    for row in fixture["differences"].as_array().unwrap() {
        assert!(
            row["reason"].as_str().is_some_and(|r| !r.is_empty()),
            "{row}: reason"
        );
    }

    let mut layer = json!({});
    for path in &differences {
        put(&mut layer, path, at(&source, path).unwrap().clone());
    }
    let mut effective =
        read_back("equivalence", Some(&layer), None).unwrap_or_else(|codes| panic!("{codes:?}"));
    let mut expected = source.clone();
    for path in exclusions.iter().chain(&standard_only) {
        remove(&mut effective, path);
        remove(&mut expected, path);
    }
    assert_eq!(effective, expected);
}

#[test]
fn each_exclusion_is_explained_by_a_named_behaviour() {
    let source: Value = serde_json::from_str(&source_bytes()).unwrap();
    let (schemas, _) = Schemas::bundled().unwrap();
    let standard = Standard::bundled(&schemas).unwrap();

    // gateway is global-only: the same value is refused in a project file and fine in the global file.
    let gateway = json!({ "gateway": source["gateway"].clone() });
    let refused = read_back("gateway-project", Some(&gateway), None).unwrap_err();
    assert!(refused.contains(&"config-key-out-of-scope"), "{refused:?}");
    read_back(
        "gateway-global",
        None,
        Some(&json!({ "gateway": { "port": 4170 } })),
    )
    .unwrap();

    // lock has no schema: it is kept and reported as a key with no schema node.
    let lock = json!({ "lock": source["lock"].clone() });
    let kept = read_back("lock", Some(&lock), None).unwrap();
    assert_eq!(kept["lock"], source["lock"]);
    assert_eq!(
        schemas.undescribed(&lock),
        vec![segments(&vec!["lock".into()])]
    );

    // runner.$comment is in the source and in no standard file.
    assert!(source["runner"]["$comment"].is_array());
    assert!(standard.value()["runner"].get("$comment").is_none());
    for (name, text) in bundle::STANDARD {
        assert!(
            !text.contains("$comment"),
            "{name}: a standard file carries a $comment key"
        );
    }
}

#[test]
fn no_machine_or_owner_specific_string_is_in_the_standard_files() {
    let fixture = fixture();
    for needle in fixture["scrub-search-strings"].as_array().unwrap() {
        let needle = needle.as_str().unwrap();
        for (name, text) in bundle::STANDARD {
            assert!(!text.contains(needle), "{name}.yaml holds {needle:?}");
        }
    }
}

#[test]
fn the_tier_ladder_renders_one_doc_line_per_tier_from_the_seat_binding_contract() {
    let ladder: Value = serde_json::from_str(&read(
        contracts().join("../../seat-binding/contracts/seat-binding.tier-ladder.v1.json"),
    ))
    .unwrap();
    let mut want = vec!["@fgos:doc Tier ladder, weakest first:".to_string()];
    want.extend(ladder["tiers"].as_array().unwrap().iter().map(|t| {
        format!(
            "@fgos:doc {}: {}; self-check: {}; e.g. {}",
            t["name"].as_str().unwrap(),
            t["work"].as_str().unwrap(),
            t["selfCheck"].as_str().unwrap(),
            t["examples"].as_str().unwrap()
        )
    }));
    let (schemas, _) = Schemas::bundled().unwrap();
    let standard = Standard::bundled(&schemas).unwrap();
    for path in [
        "runner.modelPolicies",
        "runner.tierFallback",
        "runner.maxTier",
    ] {
        let path = fgos_yaml_doc::path::parse_path(path).unwrap();
        let node = schemas.resolve(&path).unwrap().node;
        let lines = doc_lines(&node, standard.value_at(&path));
        assert!(
            lines.len() > want.len(),
            "{path:?}: the node's own line comes first"
        );
        assert_eq!(
            &lines[1..],
            &want[..],
            "{path:?}: ladder lines drifted from the contract"
        );
    }
}

#[test]
fn the_real_runner_keys_sit_in_the_files_scopes_and_sensitivities_the_spec_gives_them() {
    let (schemas, _) = Schemas::bundled().unwrap();
    let node = |path: &str| {
        schemas
            .resolve(&fgos_yaml_doc::path::parse_path(path).unwrap())
            .unwrap_or_else(|| panic!("{path}: no schema node"))
    };
    // Account pools live in the accounts file and nowhere else.
    for path in [
        "runner.llmAccounts.pool.acct",
        "runner.providers.openai.accounts.acct",
    ] {
        let found = node(path);
        assert_eq!(
            (found.file, found.scope),
            ("accounts", "global-only"),
            "{path}"
        );
        assert_eq!(found.sensitivity, "secret-reference", "{path}");
    }
    // The five seat-binding keys exist in the project file only.
    for key in ["tier", "maxTier", "roles", "personas", "seats"] {
        assert_eq!(
            node(&format!("runner.capabilities.any.{key}")).scope,
            "project-only",
            "{key}"
        );
    }
    // What runs on this machine is read from the trusted main checkout.
    for path in [
        "runner.executor",
        "runner.executors.any",
        "runner.executors.any.invocations[0].command",
        "runner.capabilities.any.confinement",
        "runner.capabilities.any.verify",
    ] {
        let found = node(path);
        assert_eq!(
            (found.sensitivity, found.scope),
            ("command", "both"),
            "{path}"
        );
    }
    assert_eq!(node("runner.executor").absent, Some("detected"));

    // The same placement rules, through the snapshot: accounts out of the project file, seat keys out of the global file.
    let accounts = json!({ "runner": { "llmAccounts": { "pool": { "acct": { "label": "a" } } } } });
    assert_eq!(
        read_back("accounts-project", Some(&accounts), None).unwrap_err(),
        vec!["config-key-in-wrong-file"]
    );
    let seats = json!({ "runner": { "capabilities": { "x": { "tier": "standard" } } } });
    assert_eq!(
        read_back("seats-global", None, Some(&seats)).unwrap_err(),
        vec!["config-key-out-of-scope"]
    );
    read_back("seats-project", Some(&seats), None).unwrap();
}
