//! Checks over the real component authority model of this checkout: the shape rules of
//! `contracts/model.v1.json` that the typed loader does not already enforce (enums, ranges, non-empty text),
//! plus the cross-row rules (unique names, existing parents, owners, providers, consumers and paths).
//!
//! Required fields, unknown fields and value types are owned by the loader (`Model::load`, in `model.rs`):
//! a row missing a field, carrying an unnamed field or holding the wrong type cannot be loaded, so the
//! tests below start from a loaded model.

use fgos_component_authority::{Component, Contract, DoorPath, Model};
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};

const LAYERS: [&str; 5] = ["entry", "use-case", "infra", "domain", "kernel"];
const COMPONENT_STATUSES: [&str; 5] = ["live", "designed", "planned", "draft", "retired"];
const CONTRACT_STATUSES: [&str; 3] = ["live", "designed", "planned"];

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .canonicalize()
        .unwrap()
}

fn model() -> Model {
    Model::load(&repo_root()).expect("the real model loads")
}

fn component_ids(model: &Model) -> HashSet<&str> {
    model.components.iter().map(|c| c.id.as_str()).collect()
}

/// `^[a-z0-9][a-z0-9-]*$`
fn is_id(id: &str) -> bool {
    let mut chars = id.chars();
    let ok_first = chars
        .next()
        .is_some_and(|c| c.is_ascii_lowercase() || c.is_ascii_digit());
    ok_first && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

fn reasoned_path(item: &DoorPath) -> Option<&str> {
    match item {
        DoorPath::Plain(_) => None,
        DoorPath::Reasoned(row) => Some(row.path.as_str()),
    }
}

#[test]
fn every_model_row_obeys_the_enums_ranges_and_non_empty_rules_of_the_schema() {
    let model = model();

    for (idx, comp) in model.components.iter().enumerate() {
        let label = format!("component[{idx}] ({})", comp.id);
        assert!(is_id(&comp.id), "{label} id does not match pattern");
        assert!(!comp.canonical.is_empty(), "{label} empty canonical");
        assert!(!comp.meaning.is_empty(), "{label} empty meaning");
        assert!(
            LAYERS.contains(&comp.layer.as_str()),
            "{label} invalid layer \"{}\"",
            comp.layer
        );
        assert!((0..=9).contains(&comp.tier), "{label} tier out of range");
        assert!(
            COMPONENT_STATUSES.contains(&comp.status.as_str()),
            "{label} invalid status \"{}\"",
            comp.status
        );
        if let Some(parent) = &comp.parent {
            assert!(!parent.is_empty(), "{label} empty parent");
        }
        for exc in &comp.exceptions {
            assert!(!exc.path.is_empty(), "{label} exception with empty path");
            assert!(
                !exc.reason.is_empty(),
                "{label} exception with empty reason"
            );
            if let Some(layer) = &exc.layer {
                assert!(
                    LAYERS.contains(&layer.as_str()),
                    "{label} exception layer \"{layer}\""
                );
            }
            if let Some(tier) = exc.tier {
                assert!(
                    (0..=9).contains(&tier),
                    "{label} exception tier out of range"
                );
            }
        }
    }

    for (idx, dk) in model.decision_kinds.iter().enumerate() {
        let label = format!("decisionKind[{idx}] ({})", dk.id);
        assert!(!dk.id.is_empty(), "{label} empty id");
        assert!(!dk.canonical.is_empty(), "{label} empty canonical");
        assert!(!dk.meaning.is_empty(), "{label} empty meaning");
        assert!(!dk.owner.is_empty(), "{label} empty owner");
        assert!(!dk.narrative.is_empty(), "{label} empty narrative");
    }

    assert!(
        !model.doors.is_empty(),
        "doors directory must contain door definitions"
    );
    for door in &model.doors {
        let file = &door.slug;
        assert!(!door.job.is_empty(), "door \"{file}\" invalid job");
        assert!(!door.kind.is_empty(), "door \"{file}\" invalid kind");
        for item in door.allowed.iter().chain(door.debt.iter()) {
            if let Some(path) = reasoned_path(item) {
                assert!(!path.is_empty(), "door \"{file}\" item missing path");
            }
        }
    }
}

#[test]
fn first_row_of_components_is_component_authority() {
    let model = model();
    assert!(!model.components.is_empty());
    assert_eq!(model.components[0].id, "component-authority");
}

#[test]
fn component_ids_are_unique() {
    let model = model();
    let mut seen = HashSet::new();
    for comp in &model.components {
        assert!(
            seen.insert(comp.id.as_str()),
            "Duplicate component id \"{}\"",
            comp.id
        );
    }
}

#[test]
fn every_parent_component_reference_exists_in_components() {
    let model = model();
    let ids = component_ids(&model);
    for comp in &model.components {
        if let Some(parent) = comp.parent.as_deref().filter(|p| !p.is_empty()) {
            assert!(
                ids.contains(parent),
                "Component \"{}\" references non-existent parent \"{parent}\"",
                comp.id
            );
        }
    }
}

#[test]
fn every_decision_kind_owner_exists_in_components() {
    let model = model();
    let ids = component_ids(&model);
    for dk in &model.decision_kinds {
        assert!(
            !dk.owner.is_empty(),
            "Decision kind \"{}\" must have owner string",
            dk.id
        );
        assert!(
            ids.contains(dk.owner.as_str()),
            "Decision kind \"{}\" owner \"{}\" does not exist in components",
            dk.id,
            dk.owner
        );
    }
}

#[test]
fn every_spec_source_and_decision_kind_narrative_path_exists_on_disk() {
    let model = model();
    let root = repo_root();
    for comp in &model.components {
        assert!(
            root.join(&comp.spec).exists(),
            "Component \"{}\" spec file missing on disk: {}",
            comp.id,
            comp.spec
        );
        for src in &comp.source {
            assert!(
                root.join(src).exists(),
                "Component \"{}\" source path missing on disk: {src}",
                comp.id
            );
        }
    }
    for dk in &model.decision_kinds {
        assert!(
            root.join(&dk.narrative).exists(),
            "Decision kind \"{}\" narrative path missing on disk: {}",
            dk.id,
            dk.narrative
        );
    }
}

#[test]
fn every_component_exception_path_exists_on_disk_and_resolves_to_the_component_that_declares_it() {
    let model = model();
    let root = repo_root();
    for comp in &model.components {
        for exc in &comp.exceptions {
            assert!(
                root.join(&exc.path).exists(),
                "exception path \"{}\" declared by {} must exist on disk",
                exc.path,
                comp.id
            );
            let resolved = longest_path_owner(&exc.path, &model.components);
            assert_eq!(
                resolved,
                Some(comp.id.as_str()),
                "exception path \"{}\" declared by {} must resolve to {}",
                exc.path,
                comp.id,
                comp.id
            );
        }
    }
}

#[test]
fn layers_declare_the_layer_names_the_rules_and_the_ten_tier_names_the_model_uses() {
    let model = model();
    let layers = &model.layers;
    assert_eq!(
        layers.layers, LAYERS,
        "layers.yaml layers must list the layer order"
    );
    for rule in ["one-directional-layer", "domain-siloing", "tier-downward"] {
        assert!(
            layers.rules.iter().any(|declared| declared == rule),
            "layers.yaml rules must include {rule}"
        );
    }
    let names: Vec<&str> = layers.tier_names.keys().map(String::as_str).collect();
    assert_eq!(names, ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
    for comp in &model.components {
        assert!(
            layers.layers.contains(&comp.layer),
            "component \"{}\" layer \"{}\" is not declared in layers",
            comp.id,
            comp.layer
        );
        assert!(
            layers.tier_names.contains_key(&comp.tier.to_string()),
            "component \"{}\" tier {} has no tierNames entry",
            comp.id,
            comp.tier
        );
    }
}

#[test]
fn every_component_paths_entry_exists_on_disk() {
    let model = model();
    let root = repo_root();
    for comp in &model.components {
        for p in &comp.paths {
            let full = root.join(p);
            if p.ends_with('/') {
                assert!(
                    full.is_dir(),
                    "component \"{}\" paths[] directory missing on disk: {p}",
                    comp.id
                );
            } else {
                assert!(
                    full.exists(),
                    "component \"{}\" paths[] entry missing on disk: {p}",
                    comp.id
                );
            }
        }
    }
}

#[test]
fn canonical_and_aliases_are_unique_across_components_and_decision_kinds_case_insensitively() {
    let model = model();
    let mut names: HashMap<String, String> = HashMap::new();
    let mut claim = |name: &str, what: &str, owner: String| {
        let key = name.to_lowercase();
        if let Some(prior) = names.get(&key) {
            panic!("Collision on {what} \"{name}\" from {owner} (already claimed by {prior})");
        }
        names.insert(key, owner);
    };
    for comp in &model.components {
        let owner = format!("component:{}", comp.id);
        claim(&comp.canonical, "canonical", owner.clone());
        for alias in &comp.aliases {
            claim(alias, "alias", owner.clone());
        }
    }
    for dk in &model.decision_kinds {
        let owner = format!("decisionKind:{}", dk.id);
        claim(&dk.canonical, "canonical", owner.clone());
        for alias in &dk.aliases {
            claim(alias, "alias", owner.clone());
        }
    }
}

// ---- contracts ----

/// A contract's `guards` is one string, or an array of strings.
fn assert_guards(guards: &Value, label: &str) {
    match guards {
        Value::String(_) => {}
        Value::Array(items) => {
            for g in items {
                assert!(g.is_string(), "{label} guard must be a string");
            }
        }
        other => panic!("{label} guards must be a string or an array of strings, got {other}"),
    }
}

fn assert_contract_shape(row: &Contract, label: &str) {
    assert!(!row.id.is_empty(), "{label} empty id");
    assert!(!row.canonical.is_empty(), "{label} empty canonical");
    assert!(!row.meaning.is_empty(), "{label} empty meaning");
    assert!(!row.provider.is_empty(), "{label} empty provider");
    assert!(
        CONTRACT_STATUSES.contains(&row.status.as_str()),
        "{label} invalid status \"{}\"",
        row.status
    );
    if let Some(path) = &row.path {
        assert!(!path.is_empty(), "{label} empty path");
    }
    if let Some(reason) = &row.reason {
        assert!(!reason.is_empty(), "{label} empty reason");
    }
    if let Some(guards) = &row.guards {
        assert_guards(guards, label);
    }
    if let Some(version) = &row.version {
        assert!(
            version.is_string() || version.is_i64() || version.is_u64(),
            "{label} version must be a string or an integer"
        );
    }
}

/// Top-level files under packages/<pkg>/contracts/ (not nested fixtures or vectors).
fn list_package_contract_files(root: &Path) -> Vec<String> {
    let mut out = Vec::new();
    let Ok(packages) = fs::read_dir(root.join("packages")) else {
        return out;
    };
    for pkg in packages.flatten() {
        let Ok(entries) = fs::read_dir(pkg.path().join("contracts")) else {
            continue;
        };
        for entry in entries.flatten() {
            if entry.path().is_file() {
                out.push(format!(
                    "packages/{}/contracts/{}",
                    pkg.file_name().to_string_lossy(),
                    entry.file_name().to_string_lossy()
                ));
            }
        }
    }
    out.sort();
    out
}

/// Top-level docs/platform/<area>/contracts markdown or yaml files; `.yaml` is included because live prose
/// contracts such as the gateway OpenAPI document are YAML under docs/platform/.../contracts/.
fn list_prose_contract_files(root: &Path) -> Vec<String> {
    let mut out = Vec::new();
    let Ok(areas) = fs::read_dir(root.join("docs/platform")) else {
        return out;
    };
    for area in areas.flatten() {
        let Ok(entries) = fs::read_dir(area.path().join("contracts")) else {
            continue;
        };
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().into_owned();
            let lower = name.to_lowercase();
            let wanted =
                lower.ends_with(".md") || lower.ends_with(".yaml") || lower.ends_with(".yml");
            if entry.path().is_file() && wanted {
                out.push(format!(
                    "docs/platform/{}/contracts/{name}",
                    area.file_name().to_string_lossy()
                ));
            }
        }
    }
    out.sort();
    out
}

/// Every top-level package/prose contract file under `root` has exactly one row.
fn assert_contract_file_coverage(rows: &[Contract], root: &Path) {
    let mut counts: HashMap<&str, usize> = HashMap::new();
    for row in rows {
        if let Some(path) = row.path.as_deref().filter(|p| !p.is_empty()) {
            *counts.entry(path).or_default() += 1;
        }
    }
    let files = list_package_contract_files(root)
        .into_iter()
        .chain(list_prose_contract_files(root));
    for file in files {
        let n = counts.get(file.as_str()).copied().unwrap_or(0);
        assert_eq!(
            n, 1,
            "contract file {file} must have exactly one row, found {n}"
        );
    }
}

/// Every row has a non-empty provider string.
fn assert_providers_present(rows: &[Contract]) {
    for row in rows {
        assert!(!row.provider.is_empty(), "{} missing provider", row.id);
    }
}

/// live and designed rows must set a path, and that path must exist under `root`. No skip when path is unset.
fn assert_live_designed_paths_exist(rows: &[Contract], root: &Path) {
    for row in rows {
        if row.status != "live" && row.status != "designed" {
            continue;
        }
        let path = row.path.as_deref().unwrap_or("");
        assert!(
            !path.is_empty(),
            "{} status {} must have path set",
            row.id,
            row.status
        );
        assert!(
            root.join(path).exists(),
            "{} status {} path missing: {path}",
            row.id,
            row.status
        );
    }
}

/// The component whose longest `paths[]` prefix covers `file_path`, or none.
fn longest_path_owner<'a>(file_path: &str, components: &'a [Component]) -> Option<&'a str> {
    let mut best: Option<&str> = None;
    let mut best_len = 0usize;
    for comp in components {
        for raw in &comp.paths {
            if raw.is_empty() {
                continue;
            }
            let normalized = raw.replace('\\', "/");
            let pref = normalized.trim_end_matches('/');
            let covers = file_path == pref
                || file_path
                    .strip_prefix(pref)
                    .is_some_and(|rest| rest.starts_with('/'));
            if covers && (best.is_none() || pref.len() > best_len) {
                best = Some(comp.id.as_str());
                best_len = pref.len();
            }
        }
    }
    best
}

fn base_row(path: Option<&str>) -> Contract {
    Contract {
        id: "synthetic-ok".into(),
        canonical: "synthetic-ok".into(),
        aliases: vec![],
        meaning: "synthetic baseline row".into(),
        reason: None,
        provider: "component-authority".into(),
        consumers: vec![],
        guards: None,
        version: None,
        path: path.map(str::to_string),
        evidence: vec![],
        status: "live".into(),
    }
}

#[test]
fn contracts_rows_obey_the_enums_and_non_empty_rules_of_the_schema() {
    let model = model();
    assert!(!model.contracts.is_empty(), "contracts must not be empty");
    for (idx, row) in model.contracts.iter().enumerate() {
        assert_contract_shape(row, &format!("contracts[{idx}] ({})", row.id));
    }
}

#[test]
fn every_top_level_package_contract_file_and_every_prose_contract_has_exactly_one_row() {
    let model = model();
    let root = repo_root();
    assert_contract_file_coverage(&model.contracts, &root);

    // No row path points at a missing top-level file that should be indexed as live/designed.
    for row in &model.contracts {
        let Some(path) = row.path.as_deref().filter(|p| !p.is_empty()) else {
            continue;
        };
        if row.status == "planned" {
            continue;
        }
        assert!(
            root.join(path).exists(),
            "row {} path {path} does not exist on disk",
            row.id
        );
    }
}

#[test]
fn every_contract_row_has_exactly_one_provider_that_exists_in_components() {
    let model = model();
    assert_providers_present(&model.contracts);
    let ids = component_ids(&model);
    for row in &model.contracts {
        assert!(
            ids.contains(row.provider.as_str()),
            "{} provider \"{}\" is not a component id",
            row.id,
            row.provider
        );
    }
}

#[test]
fn every_contract_consumer_exists_in_components() {
    let model = model();
    let ids = component_ids(&model);
    for row in &model.contracts {
        for consumer in &row.consumers {
            assert!(
                ids.contains(consumer.as_str()),
                "{} consumer \"{consumer}\" is not a component id",
                row.id
            );
        }
    }
}

#[test]
fn live_and_designed_contract_rows_name_an_existing_path() {
    assert_live_designed_paths_exist(&model().contracts, &repo_root());
}

#[test]
fn contract_id_canonical_and_aliases_are_unique_case_insensitively() {
    let model = model();
    let mut ids: HashMap<String, String> = HashMap::new();
    let mut names: HashMap<String, String> = HashMap::new();

    for row in &model.contracts {
        let id_key = row.id.to_lowercase();
        assert!(!id_key.is_empty(), "empty id");
        assert!(!ids.contains_key(&id_key), "duplicate id \"{}\"", row.id);
        ids.insert(id_key.clone(), row.id.clone());

        let c_key = row.canonical.to_lowercase();
        assert!(!c_key.is_empty(), "{} empty canonical", row.id);
        // id may equal canonical on the same row; still unique across rows
        if c_key != id_key {
            assert!(
                !(names.contains_key(&c_key) || ids.contains_key(&c_key)),
                "Collision on canonical \"{}\" from \"{}\"",
                row.canonical,
                row.id
            );
        } else {
            assert!(
                !names.contains_key(&c_key),
                "Collision on canonical \"{}\" from \"{}\"",
                row.canonical,
                row.id
            );
        }
        names.insert(c_key, row.id.clone());

        for alias in &row.aliases {
            let a_key = alias.to_lowercase();
            assert!(!a_key.is_empty(), "{} empty alias", row.id);
            assert!(
                !(names.contains_key(&a_key) || ids.contains_key(&a_key)),
                "Collision on alias \"{alias}\" from \"{}\" (claimed by {})",
                row.id,
                names
                    .get(&a_key)
                    .or(ids.get(&a_key))
                    .map(String::as_str)
                    .unwrap_or("")
            );
            names.insert(a_key, row.id.clone());
        }
    }
}

#[test]
fn a_provider_differing_from_the_longest_prefix_path_owner_carries_a_reason() {
    let model = model();
    for row in &model.contracts {
        let Some(path) = row.path.as_deref().filter(|p| !p.is_empty()) else {
            continue;
        };
        let Some(owner) = longest_path_owner(path, &model.components) else {
            continue;
        };
        if owner == row.provider {
            continue;
        }
        let Some(reason) = row.reason.as_deref() else {
            panic!(
                "{} provider \"{}\" differs from path owner \"{owner}\" for {path} but reason is missing",
                row.id, row.provider
            );
        };
        assert!(
            !reason.is_empty(),
            "{} provider \"{}\" differs from path owner \"{owner}\" for {path} but reason is empty",
            row.id,
            row.provider
        );
    }
}

fn panic_message<F: FnOnce() + std::panic::UnwindSafe>(f: F) -> String {
    let payload = std::panic::catch_unwind(f).expect_err("the check must fail");
    payload
        .downcast_ref::<String>()
        .cloned()
        .or_else(|| payload.downcast_ref::<&str>().map(|s| s.to_string()))
        .unwrap_or_default()
}

#[test]
fn synthetic_coverage_provider_and_path_existence_checks_fail_with_the_named_file_or_row() {
    let tmp = std::env::temp_dir().join(format!("ca-contracts-{}", std::process::id()));
    let _ = fs::remove_dir_all(&tmp);
    let orphan_rel = "packages/orphan-pkg/contracts/unindexed.v1.json";
    fs::create_dir_all(tmp.join("packages/orphan-pkg/contracts")).unwrap();
    fs::write(tmp.join(orphan_rel), "{}\n").unwrap();

    // Coverage: the contracts dir holds a file with no row.
    let root = tmp.clone();
    let message = panic_message(move || assert_contract_file_coverage(&[], &root));
    assert!(message.contains("unindexed.v1.json"), "{message}");

    // Provider: a provider-less row.
    let mut provider_less = base_row(Some(orphan_rel));
    provider_less.id = "synthetic-no-provider".into();
    provider_less.provider = String::new();
    let message = panic_message(move || assert_providers_present(&[provider_less]));
    assert!(message.contains("synthetic-no-provider"), "{message}");

    // Path existence: a live row whose path is missing under the temp root.
    let mut missing = base_row(Some("packages/orphan-pkg/contracts/does-not-exist.v1.json"));
    missing.id = "synthetic-missing-path".into();
    let root = tmp.clone();
    let message = panic_message(move || assert_live_designed_paths_exist(&[missing], &root));
    assert!(message.contains("synthetic-missing-path"), "{message}");

    // A live or designed row without a path also fails: there is no skip when the path is unset.
    let mut unset = base_row(None);
    unset.id = "synthetic-unset-path".into();
    let root = tmp.clone();
    let message = panic_message(move || assert_live_designed_paths_exist(&[unset], &root));
    assert!(message.contains("synthetic-unset-path"), "{message}");

    let _ = fs::remove_dir_all(&tmp);
}

#[test]
fn contract_guards_outside_the_schema_shapes_are_refused() {
    let bad = serde_json::json!([1]);
    let message = panic_message(move || assert_guards(&bad, "row"));
    assert!(message.contains("guard must be a string"), "{message}");
    assert_guards(&serde_json::json!(["a", "b"]), "row");
    assert_guards(&serde_json::json!("a"), "row");
}
