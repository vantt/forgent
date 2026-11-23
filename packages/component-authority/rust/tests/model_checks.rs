//! Checks over the real component authority model of this checkout: the shape rules of
//! `contracts/model.v1.json` that the typed loader does not already enforce (enums, ranges, non-empty text),
//! plus the cross-row rules (unique names, existing parents, owners, providers, consumers and paths).
//!
//! Required fields, unknown fields and value types are owned by the loader (`Model::load`, in `model.rs`):
//! a row missing a field, carrying an unnamed field or holding the wrong type cannot be loaded, so the
//! tests below start from a loaded model.

use fgos_component_authority::model::{DoorPathReason, Exception};
use fgos_component_authority::{
    Component, Contract, DecisionKind, Door, DoorPath, Layers, Model, TierException,
};
use serde::de::DeserializeOwned;
use serde::Serialize;
use serde_json::Value;
use std::collections::{BTreeSet, HashMap, HashSet};
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

    assert!(
        !model.decision_kinds.is_empty(),
        "decision kinds must not be empty"
    );
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
            let resolved = resolve_component(&exc.path, &model.components)
                .unwrap_or_else(|error| panic!("{error}"));
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

/// The component that owns `file_path`, by the rules of the Node resolver this replaced: a `paths[]` entry
/// ending in `/` covers every file below it, any other entry covers only that exact file, the longest entry
/// wins, and two components claiming the same longest entry is an error naming both.
fn resolve_component<'a>(
    file_path: &str,
    components: &'a [Component],
) -> Result<Option<&'a str>, String> {
    let mut best_len = 0usize;
    let mut candidates: Vec<&str> = Vec::new();
    for comp in components {
        for path in &comp.paths {
            let hit = if path.ends_with('/') {
                file_path.starts_with(path.as_str())
            } else {
                file_path == path.as_str()
            };
            if !hit {
                continue;
            }
            if candidates.is_empty() || path.len() > best_len {
                best_len = path.len();
                candidates = vec![comp.id.as_str()];
            } else if path.len() == best_len {
                candidates.push(comp.id.as_str());
            }
        }
    }
    match candidates.as_slice() {
        [] => Ok(None),
        [only] => Ok(Some(only)),
        several => Err(format!(
            "Multiple components claiming same longest prefix for \"{file_path}\": {}",
            several.join(", ")
        )),
    }
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
        let Some(owner) = resolve_component(path, &model.components)
            .unwrap_or_else(|error| panic!("{} {error}", row.id))
        else {
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

// ---- the schema and the typed rows ----

fn schema() -> Value {
    let path = repo_root().join("packages/component-authority/contracts/model.v1.json");
    serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap()
}

fn string_set(value: &Value) -> BTreeSet<String> {
    value
        .as_array()
        .expect("an array of strings")
        .iter()
        .map(|item| item.as_str().expect("a string").to_owned())
        .collect()
}

fn names(items: &[&str]) -> BTreeSet<String> {
    items.iter().map(|item| (*item).to_owned()).collect()
}

/// The typed row `T` carries exactly the fields of the schema `def`: the listed `properties` are the schema's
/// properties, the listed `required` are its required fields, a fully populated `sample` loads and serializes
/// back to the same field names (less `serialized_only`), a row without a required field is refused, a row
/// without an optional field loads, and a field the schema does not name is refused.
fn assert_row_matches_schema<T: DeserializeOwned + Serialize>(
    label: &str,
    def: &Value,
    properties: &[&str],
    required: &[&str],
    serialized_only: &[&str],
    sample: Value,
) {
    let properties = names(properties);
    let required = names(required);
    let schema_properties: BTreeSet<String> = def["properties"]
        .as_object()
        .unwrap()
        .keys()
        .cloned()
        .collect();
    assert_eq!(schema_properties, properties, "{label} schema properties");
    assert_eq!(string_set(&def["required"]), required, "{label} required");

    let sample_fields: BTreeSet<String> = sample.as_object().unwrap().keys().cloned().collect();
    assert_eq!(sample_fields, properties, "{label} sample fields");
    let row: T = serde_json::from_value(sample.clone())
        .unwrap_or_else(|error| panic!("{label} sample does not load: {error}"));
    let mut serialized: BTreeSet<String> = serde_json::to_value(&row)
        .unwrap()
        .as_object()
        .unwrap()
        .keys()
        .cloned()
        .collect();
    for name in serialized_only {
        serialized.remove(*name);
    }
    assert_eq!(serialized, properties, "{label} serialized fields");

    for name in &properties {
        let mut without = sample.clone();
        without.as_object_mut().unwrap().remove(name);
        let loads = serde_json::from_value::<T>(without).is_ok();
        let must_load = !required.contains(name);
        assert_eq!(loads, must_load, "{label}: loads without {name}");
    }

    let mut unknown = sample;
    unknown
        .as_object_mut()
        .unwrap()
        .insert("surprise".into(), Value::Bool(true));
    assert!(
        serde_json::from_value::<T>(unknown).is_err(),
        "{label}: an unnamed field must be refused"
    );
}

#[test]
fn the_enum_constants_and_the_typed_row_fields_equal_the_schema() {
    let schema = schema();
    let defs = &schema["$defs"];
    let component = &defs["component"]["properties"];
    let exception = &component["exceptions"]["items"];

    assert_eq!(string_set(&component["layer"]["enum"]), names(&LAYERS));
    assert_eq!(
        string_set(&exception["properties"]["layer"]["enum"]),
        names(&LAYERS)
    );
    assert_eq!(
        string_set(&component["status"]["enum"]),
        names(&COMPONENT_STATUSES)
    );
    assert_eq!(
        string_set(&defs["contract"]["properties"]["status"]["enum"]),
        names(&CONTRACT_STATUSES)
    );
    assert_eq!(component["tier"]["minimum"], 0);
    assert_eq!(component["tier"]["maximum"], 9);
    assert_eq!(component["id"]["pattern"], "^[a-z0-9][a-z0-9-]*$");

    assert_row_matches_schema::<Component>(
        "component",
        &defs["component"],
        &[
            "id",
            "canonical",
            "aliases",
            "meaning",
            "parent",
            "layer",
            "tier",
            "paths",
            "exceptions",
            "owns",
            "mustNotOwn",
            "spec",
            "source",
            "status",
            "reason",
        ],
        &[
            "id",
            "canonical",
            "aliases",
            "meaning",
            "layer",
            "tier",
            "paths",
            "owns",
            "mustNotOwn",
            "spec",
            "source",
            "status",
        ],
        &[],
        serde_json::json!({
            "id": "a", "canonical": "a", "aliases": [], "meaning": "m", "parent": "p",
            "layer": "kernel", "tier": 0, "paths": [], "exceptions": [], "owns": [],
            "mustNotOwn": [], "spec": "s", "source": [], "status": "live", "reason": "r"
        }),
    );
    assert_row_matches_schema::<Exception>(
        "component exception",
        exception,
        &["path", "layer", "tier", "reason"],
        &["path", "reason"],
        &[],
        serde_json::json!({ "path": "p", "layer": "kernel", "tier": 1, "reason": "r" }),
    );
    assert_row_matches_schema::<DecisionKind>(
        "decisionKind",
        &defs["decisionKind"],
        &[
            "id",
            "canonical",
            "aliases",
            "meaning",
            "owner",
            "narrative",
            "readFirst",
            "facts",
        ],
        &[
            "id",
            "canonical",
            "aliases",
            "meaning",
            "owner",
            "narrative",
        ],
        &[],
        serde_json::json!({
            "id": "k", "canonical": "k", "aliases": [], "meaning": "m", "owner": "o",
            "narrative": "n", "readFirst": "r", "facts": "f"
        }),
    );
    assert_row_matches_schema::<Door>(
        "door",
        &defs["door"],
        &[
            "job",
            "kind",
            "patterns",
            "allowed",
            "debt",
            "reason",
            "retiredBy",
            "owner",
        ],
        &["job", "kind", "patterns", "allowed"],
        &["slug"],
        serde_json::json!({
            "job": "j", "kind": "k", "patterns": [], "allowed": [], "debt": [], "reason": "r",
            "retiredBy": "b", "owner": "o"
        }),
    );
    assert_row_matches_schema::<DoorPathReason>(
        "door path with a reason",
        &defs["door"]["properties"]["allowed"]["items"]["anyOf"][1],
        &["path", "reason"],
        &["path"],
        &[],
        serde_json::json!({ "path": "p", "reason": "r" }),
    );
    assert_row_matches_schema::<Contract>(
        "contract",
        &defs["contract"],
        &[
            "id",
            "canonical",
            "aliases",
            "meaning",
            "reason",
            "provider",
            "consumers",
            "guards",
            "version",
            "path",
            "evidence",
            "status",
        ],
        &[
            "id",
            "canonical",
            "aliases",
            "meaning",
            "provider",
            "consumers",
            "evidence",
            "status",
        ],
        &[],
        serde_json::json!({
            "id": "c", "canonical": "c", "aliases": [], "meaning": "m", "reason": "r",
            "provider": "p", "consumers": [], "guards": "g", "version": 1, "path": "p",
            "evidence": [], "status": "live"
        }),
    );
    assert_row_matches_schema::<Layers>(
        "layers",
        &defs["layers"],
        &[
            "contract",
            "layers",
            "rules",
            "domains",
            "tierNames",
            "tierExceptions",
        ],
        &["layers", "rules", "domains", "tierNames"],
        &[],
        serde_json::json!({
            "contract": "c", "layers": [], "rules": [], "domains": [], "tierNames": {},
            "tierExceptions": []
        }),
    );
    assert_row_matches_schema::<TierException>(
        "layers tier exception",
        &defs["layers"]["properties"]["tierExceptions"]["items"],
        &["path", "tier", "reason"],
        &["path", "tier", "reason"],
        &[],
        serde_json::json!({ "path": "p", "tier": 1, "reason": "r" }),
    );
}

fn write_model_file(dir: &Path, name: &str, text: &str) {
    let path = dir.join(name);
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(path, text).unwrap();
}

#[test]
fn the_loader_refuses_a_component_row_missing_a_required_field() {
    let dir = std::env::temp_dir().join(format!("fgos-ca-checks-missing-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    write_model_file(
        &dir,
        "layers.yaml",
        "layers:\n  - kernel\nrules: []\ndomains: []\ntierNames:\n  \"0\": leaf\n",
    );
    write_model_file(&dir, "decision-kinds.yaml", "[]\n");
    write_model_file(&dir, "contracts.yaml", "[]\n");
    write_model_file(
        &dir,
        "doors/one.yaml",
        "job: j\nkind: door\npatterns: []\nallowed: []\n",
    );
    let component = |status: &str| {
        format!(
            "- id: a\n  canonical: a\n  aliases: []\n  meaning: m\n  layer: kernel\n  tier: 0\n  paths: []\n  owns: []\n  mustNotOwn: []\n  spec: s\n  source: []\n{status}"
        )
    };

    write_model_file(&dir, "components.yaml", &component("  status: live\n"));
    Model::load_dir(&dir).expect("the complete row loads");

    write_model_file(&dir, "components.yaml", &component(""));
    let error = Model::load_dir(&dir).expect_err("a row without status is refused");
    assert!(error.to_string().contains("status"), "{error}");
    assert!(error.to_string().contains("components.yaml"), "{error}");
    let _ = fs::remove_dir_all(&dir);
}

fn component_claiming(id: &str, paths: &[&str]) -> Component {
    serde_json::from_value(serde_json::json!({
        "id": id, "canonical": id, "aliases": [], "meaning": "m", "layer": "kernel", "tier": 0,
        "paths": paths, "owns": [], "mustNotOwn": [], "spec": "s", "source": [], "status": "live"
    }))
    .unwrap()
}

#[test]
fn a_path_without_a_trailing_slash_covers_only_that_file_and_the_longest_path_wins() {
    let components = [
        component_claiming("dir", &["src/"]),
        component_claiming("deeper", &["src/deep/"]),
        component_claiming("file", &["src/a.mjs"]),
    ];
    assert_eq!(
        resolve_component("src/a.mjs", &components),
        Ok(Some("file"))
    );
    assert_eq!(
        resolve_component("src/a.mjs.bak", &components),
        Ok(Some("dir"))
    );
    assert_eq!(
        resolve_component("src/deep/b.mjs", &components),
        Ok(Some("deeper"))
    );
    assert_eq!(resolve_component("bin/x.mjs", &components), Ok(None));
    // `src/a.mjs` has no trailing slash, so it does not cover what lies below it.
    assert_eq!(
        resolve_component("src/a.mjs/x", &components),
        Ok(Some("dir"))
    );
}

#[test]
fn two_components_claiming_the_same_longest_path_are_an_error_naming_both() {
    let components = [
        component_claiming("comp-a", &["src/dup/"]),
        component_claiming("comp-b", &["src/dup/"]),
    ];
    let error = resolve_component("src/dup/file.mjs", &components).unwrap_err();
    assert!(
        error.contains("Multiple components claiming same longest prefix"),
        "{error}"
    );
    assert!(
        error.contains("comp-a") && error.contains("comp-b"),
        "{error}"
    );
}
