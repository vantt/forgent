//! `declare`: the one write path into the model. A row is checked against `contracts/model.v1.json`, against the
//! rows already in the model (names, references, contract providers), against the files it names and, for a new
//! component or decision kind, against an owner answer; only then is it written into the model's YAML.
//!
//! The crate resolves no path and asks no question store itself: the caller passes the model directory, the
//! project root that the row's paths are relative to, and an [`Approvals`] port that says whether an owner
//! question is answered. Every check runs before the first byte is written, so a refused declare changes
//! nothing and creates no model. The new text of an existing file comes from the YAML door (`fgos-yaml-doc`),
//! which keeps the notes people wrote on other rows; every file lands through the durable-file door.

use crate::locate::fold;
use crate::model::{Component, Contract, DecisionKind, Door, Layers, Model, ModelError};
use fgos_yaml_doc::model::{Profile, Segment, Value};
use fgos_yaml_doc::{emit, parse, CommentLoss};
use serde::de::DeserializeOwned;
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

const COMPONENTS: &str = "components.yaml";
const DECISION_KINDS: &str = "decision-kinds.yaml";
const CONTRACTS: &str = "contracts.yaml";
const LAYERS: &str = "layers.yaml";
const DOORS: &str = "doors";
/// Keeps `doors/` in a Git checkout while no door has been declared.
const DOORS_KEEP: &str = ".gitkeep";

const LAYER_NAMES: &[&str] = &["entry", "use-case", "infra", "domain", "kernel"];
const COMPONENT_STATUSES: &[&str] = &["live", "designed", "planned", "draft", "retired"];
const CONTRACT_STATUSES: &[&str] = &["live", "designed", "planned"];
const ID_PATTERN: &str = "^[a-z0-9][a-z0-9-]*$";
const TIER_RANGE: std::ops::RangeInclusive<i64> = 0..=9;

/// The text of the model files a new project starts from: no rows, valid against the schema.
const EMPTY_LAYERS: &str = "layers:\n  - entry\n  - use-case\n  - infra\n  - domain\n  - kernel\nrules: []\ndomains: []\ntierNames: {}\n";
const EMPTY_LIST: &str = "[]\n";

/// Field order of each kind's row in the YAML file, as the existing rows write them.
const COMPONENT_ORDER: &[&str] = &[
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
];
const DECISION_KIND_ORDER: &[&str] = &[
    "id",
    "canonical",
    "aliases",
    "meaning",
    "owner",
    "narrative",
    "readFirst",
    "facts",
];
const DOOR_ORDER: &[&str] = &[
    "job",
    "kind",
    "severity",
    "patterns",
    "allowed",
    "debt",
    "reason",
    "retiredBy",
    "owner",
];
const CONTRACT_ORDER: &[&str] = &[
    "id",
    "canonical",
    "aliases",
    "meaning",
    "provider",
    "consumers",
    "guards",
    "version",
    "path",
    "evidence",
    "status",
    "reason",
];

/// Which row `declare` adds (or, for a decision kind with `move_owner`, which row it moves).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Kind {
    Component,
    DecisionKind,
    Door,
    Contract,
}

impl Kind {
    pub fn parse(word: &str) -> Option<Self> {
        match word {
            "component" => Some(Self::Component),
            "decision-kind" => Some(Self::DecisionKind),
            "door" => Some(Self::Door),
            "contract" => Some(Self::Contract),
            _ => None,
        }
    }

    pub fn word(self) -> &'static str {
        match self {
            Self::Component => "component",
            Self::DecisionKind => "decision-kind",
            Self::Door => "door",
            Self::Contract => "contract",
        }
    }
}

/// What the question store says about one owner question.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum QuestionState {
    Unknown,
    Open,
    Answered,
    Cancelled,
}

/// The port to the owner question store.
pub trait Approvals {
    fn state(&self, question: &str) -> Result<QuestionState, String>;
}

/// A refusal by name, with what was wrong.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refusal {
    pub code: &'static str,
    pub detail: String,
}

impl Refusal {
    fn new(code: &'static str, detail: impl Into<String>) -> Self {
        Self {
            code,
            detail: detail.into(),
        }
    }
}

impl std::fmt::Display for Refusal {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.code, self.detail)
    }
}

impl std::error::Error for Refusal {}

fn model_refusal(error: ModelError) -> Refusal {
    Refusal::new("model-invalid", error.to_string())
}

/// One call to [`declare`].
#[derive(Debug, Clone, Copy)]
pub struct DeclareRequest<'a> {
    pub kind: Kind,
    /// The row as the schema names it. A door row also carries `slug`, its file name without `.yaml`.
    pub row: &'a serde_json::Value,
    /// The owner question whose answer approves a new component or decision kind.
    pub approved_by: Option<&'a str>,
    /// The plan directory whose Authority map names the survivor of a move.
    pub plan: Option<&'a Path>,
    /// Moves the owner of an existing decision kind: the row carries only `id` and the new `owner`.
    pub move_owner: bool,
    /// Updates an existing component row; the row carries `id` and the fields to change, and each given field replaces the row's field.
    pub update: bool,
}

/// What a successful declare wrote.
#[derive(Debug, Clone)]
pub struct Declared {
    pub kind: Kind,
    pub id: String,
    pub files: Vec<PathBuf>,
    pub created_model: bool,
    pub row: serde_json::Value,
}

struct FileWrite {
    dir: PathBuf,
    name: String,
    bytes: Vec<u8>,
}

/// Checks and writes one row. `dir` is the model directory (it need not exist yet), `root` the project that
/// the row's paths are relative to.
pub fn declare(
    dir: &Path,
    root: &Path,
    request: &DeclareRequest,
    approvals: &dyn Approvals,
) -> Result<Declared, Refusal> {
    let present = dir.is_dir();
    let model = if present {
        Model::load_dir(dir).map_err(model_refusal)?
    } else {
        empty_model()
    };
    if request.update && request.move_owner {
        return Err(Refusal::new(
            "update-unsupported",
            "--update and --move cannot be used together",
        ));
    }
    if request.update && request.kind != Kind::Component {
        return Err(Refusal::new(
            "update-unsupported",
            "--update applies to component rows only",
        ));
    }
    if request.move_owner && request.kind != Kind::DecisionKind {
        return Err(Refusal::new(
            "move-unsupported",
            "--move applies to the owner of a decision kind only",
        ));
    }
    let planned = if request.move_owner {
        plan_move(&model, dir, root, request, present)?
    } else if request.update {
        plan_component_update(&model, dir, root, request.row, present)?
    } else {
        match request.kind {
            Kind::Component => plan_component(&model, dir, root, request.row, present)?,
            Kind::DecisionKind => plan_decision_kind(&model, dir, root, request.row, present)?,
            Kind::Door => plan_door(&model, dir, root, request.row)?,
            Kind::Contract => plan_contract(&model, dir, root, request.row, present)?,
        }
    };
    if matches!(request.kind, Kind::Component | Kind::DecisionKind)
        && !request.move_owner
        && !request.update
    {
        require_answered(approvals, request.approved_by)?;
    }
    let mut writes = Vec::new();
    if !present {
        writes.extend(bootstrap_writes(dir, &planned.target));
    }
    let files: Vec<PathBuf> = writes
        .iter()
        .map(|write| write.dir.join(&write.name))
        .chain(std::iter::once(planned.write.dir.join(&planned.write.name)))
        .collect();
    writes.push(planned.write);
    for write in &writes {
        fs::create_dir_all(&write.dir).map_err(|error| {
            Refusal::new("write-failed", format!("{}: {error}", write.dir.display()))
        })?;
        fgos_durable_file::replace_durably(&write.dir, &write.name, &write.bytes).map_err(
            |error| {
                Refusal::new(
                    "write-failed",
                    format!("{}: {error}", write.dir.join(&write.name).display()),
                )
            },
        )?;
    }
    Ok(Declared {
        kind: request.kind,
        id: planned.id,
        files,
        created_model: !present,
        row: planned.row,
    })
}

struct Planned {
    id: String,
    row: serde_json::Value,
    /// The model file the row lands in (a path relative to the model directory).
    target: String,
    write: FileWrite,
}

fn empty_model() -> Model {
    Model {
        layers: Layers {
            contract: None,
            layers: LAYER_NAMES.iter().map(|name| (*name).to_owned()).collect(),
            rules: Vec::new(),
            domains: Vec::new(),
            tier_names: BTreeMap::new(),
            tier_exceptions: Vec::new(),
        },
        components: Vec::new(),
        decision_kinds: Vec::new(),
        contracts: Vec::new(),
        doors: Vec::new(),
    }
}

/// The files of an empty model, every one except the one the declared row lands in.
fn bootstrap_writes(dir: &Path, target: &str) -> Vec<FileWrite> {
    let mut writes = vec![
        (LAYERS, EMPTY_LAYERS),
        (COMPONENTS, EMPTY_LIST),
        (DECISION_KINDS, EMPTY_LIST),
        (CONTRACTS, EMPTY_LIST),
    ]
    .into_iter()
    .filter(|(name, _)| *name != target)
    .map(|(name, text)| FileWrite {
        dir: dir.to_path_buf(),
        name: name.to_owned(),
        bytes: text.as_bytes().to_vec(),
    })
    .collect::<Vec<_>>();
    if !target.starts_with("doors/") {
        writes.push(FileWrite {
            dir: dir.join(DOORS),
            name: DOORS_KEEP.to_owned(),
            bytes: Vec::new(),
        });
    }
    writes
}

fn require_answered(approvals: &dyn Approvals, question: Option<&str>) -> Result<(), Refusal> {
    let question = question.ok_or_else(|| {
        Refusal::new(
            "approval-required",
            "a new component or decision kind needs --approved-by <question id> naming an answered owner question",
        )
    })?;
    match approvals
        .state(question)
        .map_err(|reason| Refusal::new("approval-unreadable", reason))?
    {
        QuestionState::Answered => Ok(()),
        QuestionState::Unknown => Err(Refusal::new(
            "approval-not-answered",
            format!("owner question {question} does not exist"),
        )),
        QuestionState::Open => Err(Refusal::new(
            "approval-not-answered",
            format!("owner question {question} is still open"),
        )),
        QuestionState::Cancelled => Err(Refusal::new(
            "approval-not-answered",
            format!("owner question {question} was cancelled"),
        )),
    }
}

// ---------------------------------------------------------------------------------------------
// Row checks

fn decode<T: DeserializeOwned>(row: &serde_json::Value) -> Result<T, Refusal> {
    serde_json::from_value(row.clone())
        .map_err(|error| Refusal::new("row-invalid", error.to_string()))
}

fn invalid(detail: impl Into<String>) -> Refusal {
    Refusal::new("row-invalid", detail)
}

fn is_id(id: &str) -> bool {
    let mut chars = id.chars();
    chars
        .next()
        .is_some_and(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
        && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

fn non_empty(field: &str, text: &str) -> Result<(), Refusal> {
    if text.is_empty() {
        Err(invalid(format!("{field} is empty")))
    } else {
        Ok(())
    }
}

fn one_of(field: &str, value: &str, allowed: &[&str]) -> Result<(), Refusal> {
    if allowed.contains(&value) {
        Ok(())
    } else {
        Err(invalid(format!(
            "{field} \"{value}\" is not one of {}",
            allowed.join(", ")
        )))
    }
}

fn path_text(item: &crate::model::DoorPath) -> &str {
    match item {
        crate::model::DoorPath::Plain(path) => path,
        crate::model::DoorPath::Reasoned(reasoned) => &reasoned.path,
    }
}

/// Whether `text` (a repository-relative path, with an optional `#anchor`, or a glob) names something under
/// `root`. A glob is checked by the directory in front of its first wildcard.
fn path_exists(root: &Path, text: &str) -> bool {
    let base = text.split('#').next().unwrap_or("");
    if base.is_empty() || Path::new(base).is_absolute() || base.split('/').any(|part| part == "..")
    {
        return false;
    }
    let literal = match base.find(['*', '?', '[']) {
        None => base,
        Some(at) => match base[..at].rfind('/') {
            Some(slash) => &base[..slash],
            None => return true,
        },
    };
    literal.is_empty() || root.join(literal).exists()
}

fn require_paths<'a>(
    root: &Path,
    field: &str,
    paths: impl IntoIterator<Item = &'a str>,
) -> Result<(), Refusal> {
    for path in paths {
        if !path_exists(root, path) {
            return Err(Refusal::new(
                "path-missing",
                format!("{field} \"{path}\" does not exist in the project"),
            ));
        }
    }
    Ok(())
}

fn component_exists(model: &Model, id: &str) -> bool {
    model.components.iter().any(|component| component.id == id)
}

fn require_component(model: &Model, field: &str, id: &str) -> Result<(), Refusal> {
    if component_exists(model, id) {
        Ok(())
    } else {
        Err(Refusal::new(
            "reference-missing",
            format!("{field} \"{id}\" is not a component of the model"),
        ))
    }
}

/// Every canonical name and alias the model's components, decision kinds and contracts use, folded.
fn used_names(model: &Model) -> BTreeSet<String> {
    let mut names = BTreeSet::new();
    let mut add = |canonical: &str, aliases: &[String]| {
        names.insert(fold(canonical));
        names.extend(aliases.iter().map(|alias| fold(alias)));
    };
    for row in &model.components {
        add(&row.canonical, &row.aliases);
    }
    for row in &model.decision_kinds {
        add(&row.canonical, &row.aliases);
    }
    for row in &model.contracts {
        add(&row.canonical, &row.aliases);
    }
    names
}

fn require_new_names(model: &Model, canonical: &str, aliases: &[String]) -> Result<(), Refusal> {
    non_empty("canonical", canonical)?;
    let used = used_names(model);
    for name in std::iter::once(canonical).chain(aliases.iter().map(String::as_str)) {
        if used.contains(&fold(name)) {
            return Err(Refusal::new(
                "name-taken",
                format!("\"{name}\" is already the canonical name or an alias of another row"),
            ));
        }
    }
    Ok(())
}

fn ordered(row: &serde_json::Value, order: &[&str]) -> Value {
    let object = row.as_object();
    Value::Map(
        order
            .iter()
            .filter_map(|key| {
                object
                    .and_then(|map| map.get(*key))
                    .map(|value| ((*key).to_owned(), Value::from_json(value)))
            })
            .collect(),
    )
}

/// The text of the model file after one row is appended to its top-level list.
fn current_text(dir: &Path, name: &str, present: bool) -> Result<String, Refusal> {
    if !present {
        return Ok(match name {
            LAYERS => EMPTY_LAYERS,
            _ => EMPTY_LIST,
        }
        .to_owned());
    }
    let path = dir.join(name);
    fs::read_to_string(&path)
        .map_err(|error| Refusal::new("model-invalid", format!("{}: {error}", path.display())))
}

fn refused_yaml(name: &str, refusal: impl std::fmt::Display) -> Refusal {
    Refusal::new("yaml-refused", format!("{name}: {refusal}"))
}

/// The file's text with `item` appended to its list. An empty list is replaced through the YAML door's editor;
/// a list with rows keeps every byte of the old text and adds the item's own block, which the door emits and
/// which is read back to prove the document now holds exactly the old rows plus the new one.
fn append_item(text: &str, name: &str, item: Value) -> Result<Vec<u8>, Refusal> {
    let mut document =
        parse(text.as_bytes(), Profile::Tool, name).map_err(|r| refused_yaml(name, r))?;
    let old = match document.value() {
        Value::Seq(rows) => rows.clone(),
        _ => return Err(refused_yaml(name, "the model file is not a list")),
    };
    if old.is_empty() {
        document
            .set(&[], Value::Seq(vec![item]), CommentLoss::Refuse)
            .map_err(|r| refused_yaml(name, r))?;
        return Ok(document.to_bytes());
    }
    let block = emit(&Value::Seq(vec![item.clone()]), Profile::Tool, name)
        .map_err(|r| refused_yaml(name, r))?;
    let mut out = text.to_owned();
    if !out.ends_with('\n') {
        out.push('\n');
    }
    out.push_str(&String::from_utf8_lossy(&block));
    let mut expected = old;
    expected.push(item);
    let after = parse(out.as_bytes(), Profile::Tool, name).map_err(|r| refused_yaml(name, r))?;
    if after.value() != &Value::Seq(expected) {
        return Err(refused_yaml(
            name,
            "the file is not a block list the new row can be appended to",
        ));
    }
    Ok(out.into_bytes())
}

fn list_planned(
    dir: &Path,
    present: bool,
    file: &str,
    id: String,
    json: serde_json::Value,
    item: Value,
) -> Result<Planned, Refusal> {
    let text = current_text(dir, file, present)?;
    let bytes = append_item(&text, file, item)?;
    Ok(Planned {
        id,
        row: json,
        target: file.to_owned(),
        write: FileWrite {
            dir: dir.to_path_buf(),
            name: file.to_owned(),
            bytes,
        },
    })
}

fn check_component(model: &Model, root: &Path, component: &Component) -> Result<(), Refusal> {
    if !is_id(&component.id) {
        return Err(invalid(format!(
            "id \"{}\" does not match {ID_PATTERN}",
            component.id
        )));
    }
    non_empty("meaning", &component.meaning)?;
    one_of("layer", &component.layer, LAYER_NAMES)?;
    one_of("status", &component.status, COMPONENT_STATUSES)?;
    if !TIER_RANGE.contains(&component.tier) {
        return Err(invalid(format!(
            "tier {} is outside {}..{}",
            component.tier,
            TIER_RANGE.start(),
            TIER_RANGE.end()
        )));
    }
    for exception in &component.exceptions {
        non_empty("exception path", &exception.path)?;
        non_empty("exception reason", &exception.reason)?;
        if let Some(layer) = &exception.layer {
            one_of("exception layer", layer, LAYER_NAMES)?;
        }
    }
    require_new_names(model, &component.canonical, &component.aliases)?;
    if let Some(parent) = &component.parent {
        require_component(model, "parent", parent)?;
    }
    require_paths(root, "paths", component.paths.iter().map(String::as_str))?;
    require_paths(root, "spec", [component.spec.as_str()])?;
    require_paths(root, "source", component.source.iter().map(String::as_str))?;
    require_paths(
        root,
        "exception path",
        component
            .exceptions
            .iter()
            .map(|exception| exception.path.as_str()),
    )?;
    Ok(())
}

fn plan_component(
    model: &Model,
    dir: &Path,
    root: &Path,
    row: &serde_json::Value,
    present: bool,
) -> Result<Planned, Refusal> {
    let component: Component = decode(row)?;
    if component_exists(model, &component.id) {
        return Err(Refusal::new(
            "id-taken",
            format!("component \"{}\" already exists", component.id),
        ));
    }
    check_component(model, root, &component)?;
    list_planned(
        dir,
        present,
        COMPONENTS,
        component.id.clone(),
        row.clone(),
        ordered(row, COMPONENT_ORDER),
    )
}

fn plan_component_update(
    model: &Model,
    dir: &Path,
    root: &Path,
    row: &serde_json::Value,
    present: bool,
) -> Result<Planned, Refusal> {
    let object = row
        .as_object()
        .ok_or_else(|| invalid("an update row is an object"))?;
    let id = object
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| invalid("an update row names its component in a string field \"id\""))?;
    let index = present
        .then(|| model.components.iter().position(|component| component.id == id))
        .flatten()
        .ok_or_else(|| {
            Refusal::new(
                "reference-missing",
                format!("component \"{id}\" is not in the model"),
            )
        })?;
    let current = &model.components[index];

    if let Some(parent_val) = object.get("parent") {
        let requested_parent: Option<&str> = match parent_val {
            serde_json::Value::Null => None,
            serde_json::Value::String(s) => Some(s.as_str()),
            _ => return Err(invalid("parent is a string or null")),
        };
        if requested_parent != current.parent.as_deref() {
            return Err(Refusal::new(
                "update-changes-parent",
                "changing a component's parent is an owner question",
            ));
        }
    }

    let mut merged = serde_json::to_value(current).map_err(|error| invalid(error.to_string()))?;
    let merged_object = merged
        .as_object_mut()
        .ok_or_else(|| invalid("merged component is not an object"))?;
    for (key, value) in object {
        merged_object.insert(key.clone(), value.clone());
    }
    let merged_component: Component = decode(&merged)?;

    let mut model_without = model.clone();
    model_without.components.remove(index);
    check_component(&model_without, root, &merged_component)?;

    let clean_merged =
        serde_json::to_value(&merged_component).map_err(|e| invalid(e.to_string()))?;

    let text = current_text(dir, COMPONENTS, present)?;
    let mut document =
        parse(text.as_bytes(), Profile::Tool, COMPONENTS).map_err(|r| refused_yaml(COMPONENTS, r))?;
    let old = match document.value() {
        Value::Seq(rows) => rows.clone(),
        _ => return Err(refused_yaml(COMPONENTS, "the model file is not a list")),
    };

    let mut set_fields_ok = true;
    for (field, val) in object {
        if field == "id" {
            continue;
        }
        if field == "parent" && current.parent.is_none() && val.is_null() {
            continue;
        }
        let yaml_val = Value::from_json(val);
        if document
            .set(
                &[Segment::Index(index), Segment::Key(field.clone())],
                yaml_val,
                CommentLoss::Refuse,
            )
            .is_err()
        {
            set_fields_ok = false;
            break;
        }
    }

    let (bytes, expected) = if set_fields_ok {
        let expected = document.value().clone();
        (document.to_bytes(), expected)
    } else {
        let mut fallback_doc = parse(text.as_bytes(), Profile::Tool, COMPONENTS)
            .map_err(|r| refused_yaml(COMPONENTS, r))?;
        let replacement = ordered(&clean_merged, COMPONENT_ORDER);
        fallback_doc
            .set(&[Segment::Index(index)], replacement.clone(), CommentLoss::Refuse)
            .map_err(|r| refused_yaml(COMPONENTS, r))?;
        let mut expected = old;
        expected[index] = replacement;
        (fallback_doc.to_bytes(), Value::Seq(expected))
    };

    let after =
        parse(&bytes, Profile::Tool, COMPONENTS).map_err(|r| refused_yaml(COMPONENTS, r))?;
    if after.value() != &expected {
        return Err(refused_yaml(
            COMPONENTS,
            "the updated file does not match the expected rows",
        ));
    }

    Ok(Planned {
        id: id.to_owned(),
        row: clean_merged,
        target: COMPONENTS.to_owned(),
        write: FileWrite {
            dir: dir.to_path_buf(),
            name: COMPONENTS.to_owned(),
            bytes,
        },
    })
}

fn check_facts(facts: &serde_json::Value) -> Result<(), Refusal> {
    let fine = |text: &serde_json::Value| text.as_str().is_some_and(|text| !text.is_empty());
    match facts {
        serde_json::Value::String(_) if fine(facts) => Ok(()),
        serde_json::Value::Array(items) if !items.is_empty() && items.iter().all(fine) => Ok(()),
        _ => Err(invalid(
            "facts is one non-empty path or a non-empty list of them",
        )),
    }
}

fn plan_decision_kind(
    model: &Model,
    dir: &Path,
    root: &Path,
    row: &serde_json::Value,
    present: bool,
) -> Result<Planned, Refusal> {
    let kind: DecisionKind = decode(row)?;
    non_empty("id", &kind.id)?;
    non_empty("meaning", &kind.meaning)?;
    non_empty("owner", &kind.owner)?;
    non_empty("narrative", &kind.narrative)?;
    if let Some(read_first) = &kind.read_first {
        non_empty("readFirst", read_first)?;
    }
    if let Some(facts) = &kind.facts {
        check_facts(facts)?;
    }
    if model
        .decision_kinds
        .iter()
        .any(|existing| existing.id == kind.id)
    {
        return Err(Refusal::new(
            "id-taken",
            format!("decision kind \"{}\" already exists", kind.id),
        ));
    }
    require_new_names(model, &kind.canonical, &kind.aliases)?;
    require_component(model, "owner", &kind.owner)?;
    let mut named: Vec<&str> = vec![kind.narrative.as_str()];
    named.extend(kind.read_first.as_deref());
    match &kind.facts {
        Some(serde_json::Value::String(text)) => named.push(text),
        Some(serde_json::Value::Array(items)) => {
            named.extend(items.iter().filter_map(|item| item.as_str()))
        }
        _ => {}
    }
    require_paths(root, "narrative, readFirst or facts", named)?;
    list_planned(
        dir,
        present,
        DECISION_KINDS,
        kind.id.clone(),
        row.clone(),
        ordered(row, DECISION_KIND_ORDER),
    )
}

fn plan_contract(
    model: &Model,
    dir: &Path,
    root: &Path,
    row: &serde_json::Value,
    present: bool,
) -> Result<Planned, Refusal> {
    let contract: Contract = decode(row)?;
    non_empty("id", &contract.id)?;
    non_empty("meaning", &contract.meaning)?;
    one_of("status", &contract.status, CONTRACT_STATUSES)?;
    if let Some(guards) = &contract.guards {
        let fine = guards.is_string()
            || guards
                .as_array()
                .is_some_and(|items| items.iter().all(serde_json::Value::is_string));
        if !fine {
            return Err(invalid("guards is a string or a list of strings"));
        }
    }
    if let Some(version) = &contract.version {
        if !(version.is_string() || version.is_i64() || version.is_u64()) {
            return Err(invalid("version is a string or an integer"));
        }
    }
    if model
        .contracts
        .iter()
        .any(|existing| existing.id == contract.id)
    {
        return Err(Refusal::new(
            "id-taken",
            format!("contract \"{}\" already exists", contract.id),
        ));
    }
    require_new_names(model, &contract.canonical, &contract.aliases)?;
    require_component(model, "provider", &contract.provider)?;
    if contract.consumers.is_empty() {
        return Err(Refusal::new(
            "reference-missing",
            "a contract names at least one consumer component",
        ));
    }
    for consumer in &contract.consumers {
        require_component(model, "consumer", consumer)?;
    }
    if let Some(path) = &contract.path {
        require_paths(root, "path", [path.as_str()])?;
        if let Some(other) = model
            .contracts
            .iter()
            .find(|existing| existing.path.as_deref() == Some(path.as_str()))
        {
            return Err(Refusal::new(
                "provider-taken",
                format!(
                    "\"{path}\" already has a provider: contract {} of component {}",
                    other.id, other.provider
                ),
            ));
        }
    }
    require_paths(
        root,
        "evidence",
        contract.evidence.iter().map(String::as_str),
    )?;
    list_planned(
        dir,
        present,
        CONTRACTS,
        contract.id.clone(),
        row.clone(),
        ordered(row, CONTRACT_ORDER),
    )
}

fn plan_door(
    model: &Model,
    dir: &Path,
    root: &Path,
    row: &serde_json::Value,
) -> Result<Planned, Refusal> {
    let mut fields = row
        .as_object()
        .cloned()
        .ok_or_else(|| invalid("a door row is an object"))?;
    let slug = match fields.remove("slug") {
        Some(serde_json::Value::String(slug)) => slug,
        _ => {
            return Err(invalid(
                "a door row names its file in a string field \"slug\"",
            ))
        }
    };
    if !is_id(&slug) {
        return Err(invalid(format!(
            "slug \"{slug}\" does not match {ID_PATTERN}"
        )));
    }
    let body = serde_json::Value::Object(fields);
    let door: Door = decode(&body)?;
    non_empty("job", &door.job)?;
    non_empty("kind", &door.kind)?;
    let owner = door
        .owner
        .as_deref()
        .ok_or_else(|| Refusal::new("reference-missing", "a door row names its owner component"))?;
    require_component(model, "owner", owner)?;
    if model.doors.iter().any(|existing| existing.slug == slug) {
        return Err(Refusal::new(
            "id-taken",
            format!("door \"{slug}\" already exists"),
        ));
    }
    require_paths(
        root,
        "allowed or debt path",
        door.allowed.iter().chain(door.debt.iter()).map(path_text),
    )?;
    let name = format!("{slug}.yaml");
    let bytes = emit(&ordered(&body, DOOR_ORDER), Profile::Tool, &name)
        .map_err(|r| refused_yaml(&name, r))?;
    Ok(Planned {
        id: slug,
        row: body,
        target: format!("{DOORS}/{name}"),
        write: FileWrite {
            dir: dir.join(DOORS),
            name,
            bytes,
        },
    })
}

// ---------------------------------------------------------------------------------------------
// Moving a decision kind's owner

/// The ids that a plan's Authority map names after `survivor:`.
fn survivors_named(text: &str) -> Vec<String> {
    let mut in_map = false;
    let mut found = Vec::new();
    for line in text.lines() {
        if line.starts_with("## ") {
            in_map = line.trim_end().eq_ignore_ascii_case("## Authority map");
            continue;
        }
        if !in_map {
            continue;
        }
        let mut rest = line;
        while let Some(at) = rest.find("survivor:") {
            rest = &rest[at + "survivor:".len()..];
            let id: String = rest
                .trim_start_matches([' ', '`'])
                .chars()
                .take_while(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_')
                .collect();
            if !id.is_empty() {
                found.push(id);
            }
        }
    }
    found
}

fn plan_move(
    model: &Model,
    dir: &Path,
    root: &Path,
    request: &DeclareRequest,
    present: bool,
) -> Result<Planned, Refusal> {
    let object = request
        .row
        .as_object()
        .ok_or_else(|| invalid("a move row is an object with \"id\" and \"owner\""))?;
    if object.len() != 2 || !object.contains_key("id") || !object.contains_key("owner") {
        return Err(invalid(
            "a move row carries exactly \"id\" and the new \"owner\"",
        ));
    }
    let (id, owner) = match (object["id"].as_str(), object["owner"].as_str()) {
        (Some(id), Some(owner)) => (id, owner),
        _ => return Err(invalid("\"id\" and \"owner\" are strings")),
    };
    let index = present
        .then(|| model.decision_kinds.iter().position(|kind| kind.id == id))
        .flatten()
        .ok_or_else(|| {
            Refusal::new(
                "reference-missing",
                format!("decision kind \"{id}\" is not in the model"),
            )
        })?;
    require_component(model, "owner", owner)?;
    let plan = request.plan.ok_or_else(|| {
        Refusal::new(
            "move-needs-plan",
            "moving a decision kind's owner needs --plan <dir> naming a plan whose Authority map names the survivor",
        )
    })?;
    let plan_dir = if plan.is_absolute() {
        plan.to_path_buf()
    } else {
        root.join(plan)
    };
    let plan_file = plan_dir.join("plan.md");
    let text = fs::read_to_string(&plan_file).map_err(|error| {
        Refusal::new(
            "move-needs-plan",
            format!("{}: {error}", plan_file.display()),
        )
    })?;
    if !survivors_named(&text)
        .iter()
        .any(|survivor| survivor == owner || survivor == id)
    {
        return Err(Refusal::new(
            "move-needs-plan",
            format!(
                "the Authority map of {} names no `survivor: {owner}` or `survivor: {id}`",
                plan_file.display()
            ),
        ));
    }
    let text = current_text(dir, DECISION_KINDS, present)?;
    let mut document = parse(text.as_bytes(), Profile::Tool, DECISION_KINDS)
        .map_err(|r| refused_yaml(DECISION_KINDS, r))?;
    document
        .set(
            &[Segment::Index(index), Segment::Key("owner".to_owned())],
            Value::Str(owner.to_owned()),
            CommentLoss::Refuse,
        )
        .map_err(|r| refused_yaml(DECISION_KINDS, r))?;
    let mut row = serde_json::to_value(&model.decision_kinds[index])
        .map_err(|error| invalid(error.to_string()))?;
    row["owner"] = serde_json::Value::String(owner.to_owned());
    Ok(Planned {
        id: id.to_owned(),
        row,
        target: DECISION_KINDS.to_owned(),
        write: FileWrite {
            dir: dir.to_path_buf(),
            name: DECISION_KINDS.to_owned(),
            bytes: document.to_bytes(),
        },
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    struct Answer(QuestionState);

    impl Approvals for Answer {
        fn state(&self, _question: &str) -> Result<QuestionState, String> {
            Ok(self.0)
        }
    }

    const ANSWERED: Answer = Answer(QuestionState::Answered);

    fn scratch(name: &str) -> PathBuf {
        let dir =
            std::env::temp_dir().join(format!("fgos-ca-declare-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn write(root: &Path, name: &str, text: &str) {
        let path = root.join(name);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, text).unwrap();
    }

    /// A project with a one-component model (a note above its row), a decision kind, a contract and a door.
    fn project(name: &str) -> (PathBuf, PathBuf) {
        let root = scratch(name);
        write(&root, "src/a/lib.rs", "");
        write(&root, "docs/a.md", "# a\n");
        write(&root, "docs/b.md", "# b\n");
        let model = root.join("model");
        write(
            &model,
            "layers.yaml",
            "layers:\n  - kernel\nrules: []\ndomains: []\ntierNames: {}\n",
        );
        write(
            &model,
            "components.yaml",
            "# the first component\n- id: a\n  canonical: alpha\n  aliases:\n    - first\n  meaning: m\n  layer: kernel\n  tier: 0\n  paths:\n    - src/a/\n  owns: []\n  mustNotOwn: []\n  spec: docs/a.md\n  source: []\n  status: live\n",
        );
        write(
            &model,
            "decision-kinds.yaml",
            "- id: dk\n  canonical: decision-kind:dk\n  aliases: []\n  meaning: m\n  owner: a\n  narrative: docs/a.md\n",
        );
        write(
            &model,
            "contracts.yaml",
            "- id: C1\n  canonical: C1\n  aliases: []\n  meaning: m\n  provider: a\n  consumers:\n    - a\n  path: docs/a.md\n  evidence: []\n  status: live\n",
        );
        write(
            &model,
            "doors/one.yaml",
            "job: j\nkind: door\nseverity: low\npatterns: []\nallowed: []\n",
        );
        (root, model)
    }

    fn component_row(id: &str) -> serde_json::Value {
        json!({
            "id": id, "canonical": format!("{id}-canon"), "aliases": [], "meaning": "m",
            "layer": "kernel", "tier": 1, "paths": ["src/a/"], "owns": [], "mustNotOwn": [],
            "spec": "docs/b.md", "source": [], "status": "designed"
        })
    }

    fn run(
        model: &Path,
        root: &Path,
        kind: Kind,
        row: &serde_json::Value,
        approved: Option<&str>,
    ) -> Result<Declared, Refusal> {
        declare(
            model,
            root,
            &DeclareRequest {
                kind,
                row,
                approved_by: approved,
                plan: None,
                move_owner: false,
                update: false,
            },
            &ANSWERED,
        )
    }

    fn code(result: Result<Declared, Refusal>) -> &'static str {
        result.expect_err("the declare must be refused").code
    }

    /// The checks above restate the schema's enums, id pattern and tier range; this keeps them equal to
    /// `contracts/model.v1.json`, the one source, so a schema change that the checks miss turns this red.
    #[test]
    fn the_row_checks_use_the_enums_pattern_and_tier_range_of_the_model_schema() {
        let schema: serde_json::Value =
            serde_json::from_str(include_str!("../../contracts/model.v1.json")).unwrap();
        let defs = &schema["$defs"];
        let strings = |value: &serde_json::Value| -> Vec<String> {
            value
                .as_array()
                .unwrap()
                .iter()
                .map(|v| v.as_str().unwrap().to_owned())
                .collect()
        };
        let component = &defs["component"]["properties"];
        assert_eq!(strings(&component["layer"]["enum"]), LAYER_NAMES);
        assert_eq!(
            strings(&component["exceptions"]["items"]["properties"]["layer"]["enum"]),
            LAYER_NAMES
        );
        assert_eq!(strings(&component["status"]["enum"]), COMPONENT_STATUSES);
        assert_eq!(
            strings(&defs["contract"]["properties"]["status"]["enum"]),
            CONTRACT_STATUSES
        );
        assert_eq!(component["id"]["pattern"], ID_PATTERN);
        assert_eq!(component["tier"]["minimum"], *TIER_RANGE.start());
        assert_eq!(component["tier"]["maximum"], *TIER_RANGE.end());
        let empty =
            fgos_yaml_doc::document::parse(EMPTY_LAYERS.as_bytes(), Profile::Tool, "layers.yaml")
                .and_then(|document| document.to_json())
                .unwrap();
        assert_eq!(
            strings(&empty["layers"]),
            LAYER_NAMES,
            "a new model starts with the schema's layers"
        );
    }
    #[test]
    fn a_new_component_without_an_approving_question_is_refused() {
        let (root, model) = project("no-approval");
        let row = component_row("b");
        assert_eq!(
            code(run(&model, &root, Kind::Component, &row, None)),
            "approval-required"
        );
        let open = declare(
            &model,
            &root,
            &DeclareRequest {
                kind: Kind::Component,
                row: &row,
                approved_by: Some("q-1"),
                plan: None,
                move_owner: false,
                update: false,
            },
            &Answer(QuestionState::Open),
        );
        assert_eq!(code(open), "approval-not-answered");
        let unknown = declare(
            &model,
            &root,
            &DeclareRequest {
                kind: Kind::DecisionKind,
                row: &json!({"id":"d2","canonical":"decision-kind:d2","aliases":[],"meaning":"m","owner":"a","narrative":"docs/a.md"}),
                approved_by: Some("q-1"),
                plan: None,
                move_owner: false,
                update: false,
            },
            &Answer(QuestionState::Unknown),
        );
        assert_eq!(code(unknown), "approval-not-answered");
        assert!(!fs::read_to_string(model.join("components.yaml"))
            .unwrap()
            .contains("b-canon"));
    }

    #[test]
    fn a_canonical_name_or_alias_already_used_by_any_row_is_refused() {
        let (root, model) = project("names");
        let mut row = component_row("b");
        row["canonical"] = json!("ALPHA");
        assert_eq!(
            code(run(&model, &root, Kind::Component, &row, Some("q"))),
            "name-taken"
        );
        let mut row = component_row("b");
        row["aliases"] = json!(["decision-kind:dk"]);
        assert_eq!(
            code(run(&model, &root, Kind::Component, &row, Some("q"))),
            "name-taken"
        );
        let mut row = component_row("a");
        row["canonical"] = json!("fresh");
        assert_eq!(
            code(run(&model, &root, Kind::Component, &row, Some("q"))),
            "id-taken"
        );
    }

    #[test]
    fn a_missing_parent_owner_provider_or_consumer_is_refused() {
        let (root, model) = project("references");
        let mut row = component_row("b");
        row["parent"] = json!("ghost");
        assert_eq!(
            code(run(&model, &root, Kind::Component, &row, Some("q"))),
            "reference-missing"
        );
        let kind = json!({"id":"d2","canonical":"decision-kind:d2","aliases":[],"meaning":"m","owner":"ghost","narrative":"docs/a.md"});
        assert_eq!(
            code(run(&model, &root, Kind::DecisionKind, &kind, Some("q"))),
            "reference-missing"
        );
        let contract = json!({"id":"C2","canonical":"C2","aliases":[],"meaning":"m","provider":"ghost","consumers":["a"],"evidence":[],"status":"live"});
        assert_eq!(
            code(run(&model, &root, Kind::Contract, &contract, None)),
            "reference-missing"
        );
        let contract = json!({"id":"C2","canonical":"C2","aliases":[],"meaning":"m","provider":"a","consumers":["ghost"],"evidence":[],"status":"live"});
        assert_eq!(
            code(run(&model, &root, Kind::Contract, &contract, None)),
            "reference-missing"
        );
        let door = json!({"slug":"two","job":"j","kind":"door","severity":"low","patterns":[],"allowed":[]});
        assert_eq!(
            code(run(&model, &root, Kind::Door, &door, None)),
            "reference-missing"
        );
    }

    #[test]
    fn a_contract_path_that_already_has_a_provider_is_refused() {
        let (root, model) = project("provider");
        let contract = json!({"id":"C2","canonical":"C2","aliases":[],"meaning":"m","provider":"a","consumers":["a"],"path":"docs/a.md","evidence":[],"status":"live"});
        assert_eq!(
            code(run(&model, &root, Kind::Contract, &contract, None)),
            "provider-taken"
        );
    }

    #[test]
    fn a_path_that_does_not_exist_is_refused() {
        let (root, model) = project("paths");
        let mut row = component_row("b");
        row["spec"] = json!("docs/ghost.md#anchor");
        assert_eq!(
            code(run(&model, &root, Kind::Component, &row, Some("q"))),
            "path-missing"
        );
        let door = json!({"slug":"two","job":"j","kind":"door","severity":"low","patterns":[],"allowed":["src/ghost/**"],"owner":"a"});
        assert_eq!(
            code(run(&model, &root, Kind::Door, &door, None)),
            "path-missing"
        );
    }

    #[test]
    fn a_row_the_schema_does_not_describe_is_refused() {
        let (root, model) = project("schema");
        let mut row = component_row("b");
        row["surprise"] = json!(1);
        assert_eq!(
            code(run(&model, &root, Kind::Component, &row, Some("q"))),
            "row-invalid"
        );
        let mut row = component_row("b");
        row["layer"] = json!("basement");
        assert_eq!(
            code(run(&model, &root, Kind::Component, &row, Some("q"))),
            "row-invalid"
        );
        let mut row = component_row("B!");
        row["canonical"] = json!("x");
        assert_eq!(
            code(run(&model, &root, Kind::Component, &row, Some("q"))),
            "row-invalid"
        );
    }

    #[test]
    fn moving_a_decision_kind_owner_needs_a_plan_whose_authority_map_names_the_survivor() {
        let (root, model) = project("move");
        let mut other = component_row("b");
        other["canonical"] = json!("beta");
        run(&model, &root, Kind::Component, &other, Some("q")).unwrap();
        let row = json!({"id":"dk","owner":"b"});
        let plan = Path::new("plans/p");
        let request = |plan: Option<&'static Path>| DeclareRequest {
            kind: Kind::DecisionKind,
            row: &row,
            approved_by: None,
            plan,
            move_owner: true,
            update: false,
        };
        let refused = declare(&model, &root, &request(None), &ANSWERED).unwrap_err();
        assert_eq!(refused.code, "move-needs-plan");
        write(&root, "plans/p/plan.md", "## Authority map\n\n| x | y |\n| a | survivor: c; retired: z |\n\n## Phases\nsurvivor: b\n");
        let refused = declare(&model, &root, &request(Some(plan)), &ANSWERED).unwrap_err();
        assert_eq!(
            refused.code, "move-needs-plan",
            "a survivor outside the map does not count"
        );
        write(
            &root,
            "plans/p/plan.md",
            "## Authority map\n\n| x | y |\n| a | survivor: b; retired: z |\n",
        );
        let moved = declare(&model, &root, &request(Some(plan)), &ANSWERED).unwrap();
        assert_eq!(moved.id, "dk");
        let loaded = Model::load_dir(&model).unwrap();
        assert_eq!(loaded.decision_kinds[0].owner, "b");
        let refused = declare(
            &model,
            &root,
            &DeclareRequest {
                kind: Kind::Door,
                ..request(Some(plan))
            },
            &ANSWERED,
        )
        .unwrap_err();
        assert_eq!(refused.code, "move-unsupported");
    }

    #[test]
    fn a_declared_component_lands_in_the_yaml_and_keeps_the_notes_on_other_rows() {
        let (root, model) = project("write");
        let declared = run(
            &model,
            &root,
            Kind::Component,
            &component_row("b"),
            Some("q"),
        )
        .unwrap();
        assert_eq!(declared.id, "b");
        assert!(!declared.created_model);
        let text = fs::read_to_string(model.join("components.yaml")).unwrap();
        assert!(
            text.starts_with("# the first component\n- id: a\n"),
            "{text}"
        );
        let loaded = Model::load_dir(&model).unwrap();
        assert_eq!(
            loaded
                .components
                .iter()
                .map(|c| c.id.as_str())
                .collect::<Vec<_>>(),
            ["a", "b"]
        );
        assert_eq!(loaded.components[1].canonical, "b-canon");
        // the same row cannot be declared twice; its id is checked before its names
        assert_eq!(
            code(run(
                &model,
                &root,
                Kind::Component,
                &component_row("b"),
                Some("q")
            )),
            "id-taken"
        );
    }

    #[test]
    fn a_declared_contract_and_door_load_with_the_model() {
        let (root, model) = project("contract-door");
        let contract = json!({"id":"C2","canonical":"C2","aliases":["two"],"meaning":"m","provider":"a","consumers":["a"],"path":"docs/b.md","evidence":["docs/b.md"],"status":"designed"});
        run(&model, &root, Kind::Contract, &contract, None).unwrap();
        let door = json!({"slug":"two","job":"j2","kind":"door","severity":"low","patterns":["x"],"allowed":["src/a/**",{"path":"docs/a.md","reason":"r"}],"owner":"a"});
        let declared = run(&model, &root, Kind::Door, &door, None).unwrap();
        assert!(declared.files[0].ends_with("doors/two.yaml"));
        let loaded = Model::load_dir(&model).unwrap();
        assert_eq!(loaded.contracts.len(), 2);
        assert!(loaded
            .doors
            .iter()
            .any(|d| d.slug == "two" && d.job == "j2"));
        assert_eq!(
            code(run(&model, &root, Kind::Door, &door, None)),
            "id-taken"
        );
    }

    #[test]
    fn a_refused_declare_in_a_project_without_a_model_creates_no_model() {
        let root = scratch("refused-bootstrap");
        write(&root, "src/a/lib.rs", "");
        write(&root, "docs/b.md", "# b\n");
        let model = root.join(".fgos/authority/model");
        assert_eq!(
            code(run(
                &model,
                &root,
                Kind::Component,
                &component_row("b"),
                None
            )),
            "approval-required"
        );
        let mut row = component_row("b");
        row["spec"] = json!("docs/ghost.md");
        assert_eq!(
            code(run(&model, &root, Kind::Component, &row, Some("q"))),
            "path-missing"
        );
        assert!(
            !root.join(".fgos").exists(),
            "a refused declare left a model behind"
        );
    }

    #[test]
    fn the_first_declare_in_a_project_without_a_model_creates_the_five_files_and_the_row() {
        let root = scratch("bootstrap");
        write(&root, "src/a/lib.rs", "");
        write(&root, "docs/b.md", "# b\n");
        let model = root.join(".fgos/authority/model");
        let mut row = component_row("b");
        row["parent"] = json!(null);
        row.as_object_mut().unwrap().remove("parent");
        let declared = run(&model, &root, Kind::Component, &row, Some("q")).unwrap();
        assert!(declared.created_model);
        for name in [
            "layers.yaml",
            "components.yaml",
            "decision-kinds.yaml",
            "contracts.yaml",
            "doors/.gitkeep",
        ] {
            assert!(model.join(name).exists(), "{name}");
        }
        let loaded = Model::load_dir(&model).unwrap();
        assert_eq!(loaded.components.len(), 1);
        assert!(
            loaded.decision_kinds.is_empty()
                && loaded.contracts.is_empty()
                && loaded.doors.is_empty()
        );
    }

    #[test]
    fn the_first_declare_may_be_a_door_but_needs_an_owner_component_that_exists() {
        let root = scratch("bootstrap-door");
        write(&root, "src/a.rs", "");
        let model = root.join(".fgos/authority/model");
        let door = json!({"slug":"one","job":"j","kind":"door","severity":"low","patterns":[],"allowed":["src/a.rs"],"owner":"a"});
        assert_eq!(
            code(run(&model, &root, Kind::Door, &door, None)),
            "reference-missing"
        );
        assert!(!model.exists());
    }

    #[test]
    fn an_update_changes_paths_owns_and_status_of_an_existing_row() {
        let (root, model) = project("update-fields");
        write(&root, "docs/c.md", "# c\n");
        let update_row = json!({
            "id": "a",
            "paths": ["src/a/", "docs/c.md"],
            "owns": ["governance"],
            "status": "planned"
        });
        let declared = declare(
            &model,
            &root,
            &DeclareRequest {
                kind: Kind::Component,
                row: &update_row,
                approved_by: None,
                plan: None,
                move_owner: false,
                update: true,
            },
            &ANSWERED,
        )
        .unwrap();
        assert_eq!(declared.id, "a");
        assert!(!declared.created_model);
        let loaded = Model::load_dir(&model).unwrap();
        let component = &loaded.components[0];
        assert_eq!(component.paths, ["src/a/", "docs/c.md"]);
        assert_eq!(component.owns, ["governance"]);
        assert_eq!(component.status, "planned");
        let text = fs::read_to_string(model.join("components.yaml")).unwrap();
        assert!(
            text.starts_with("# the first component\n- id: a\n"),
            "{text}"
        );
    }

    #[test]
    fn an_update_that_sets_a_field_the_row_did_not_have_loads_with_the_model() {
        let (root, model) = project("update-new-field");
        let update_row = json!({
            "id": "a",
            "reason": "updated reason"
        });
        let declared = declare(
            &model,
            &root,
            &DeclareRequest {
                kind: Kind::Component,
                row: &update_row,
                approved_by: None,
                plan: None,
                move_owner: false,
                update: true,
            },
            &ANSWERED,
        )
        .unwrap();
        assert_eq!(declared.id, "a");
        let loaded = Model::load_dir(&model).unwrap();
        assert_eq!(loaded.components[0].reason.as_deref(), Some("updated reason"));
    }

    fn read_tree(dir: &Path) -> BTreeMap<PathBuf, Vec<u8>> {
        let mut map = BTreeMap::new();
        if !dir.exists() {
            return map;
        }
        let mut stack = vec![dir.to_path_buf()];
        while let Some(current) = stack.pop() {
            for entry in fs::read_dir(&current).unwrap() {
                let entry = entry.unwrap();
                let path = entry.path();
                if path.is_dir() {
                    stack.push(path);
                } else if path.is_file() {
                    let rel = path.strip_prefix(dir).unwrap().to_path_buf();
                    map.insert(rel, fs::read(&path).unwrap());
                }
            }
        }
        map
    }

    fn run_update(
        model: &Path,
        root: &Path,
        kind: Kind,
        row: &serde_json::Value,
    ) -> Result<Declared, Refusal> {
        declare(
            model,
            root,
            &DeclareRequest {
                kind,
                row,
                approved_by: None,
                plan: None,
                move_owner: false,
                update: true,
            },
            &ANSWERED,
        )
    }

    #[test]
    fn an_update_is_refused_by_code_for_invalid_cases_and_leaves_files_identical() {
        let (root, model) = project("update-refusals");
        let before = read_tree(&model);

        // Unknown id -> reference-missing
        let unknown = run_update(
            &model,
            &root,
            Kind::Component,
            &json!({"id": "ghost", "status": "planned"}),
        );
        assert_eq!(code(unknown), "reference-missing");
        assert_eq!(read_tree(&model), before);

        // Changed parent -> update-changes-parent
        let changed_parent = run_update(
            &model,
            &root,
            Kind::Component,
            &json!({"id": "a", "parent": "ghost"}),
        );
        let err = changed_parent.unwrap_err();
        assert_eq!(err.code, "update-changes-parent");
        assert_eq!(
            err.detail,
            "changing a component's parent is an owner question"
        );
        assert_eq!(read_tree(&model), before);

        // Kind other than component -> update-unsupported
        let bad_kind_dk = run_update(&model, &root, Kind::DecisionKind, &json!({"id": "dk"}));
        assert_eq!(code(bad_kind_dk), "update-unsupported");
        assert_eq!(read_tree(&model), before);

        let bad_kind_door = run_update(&model, &root, Kind::Door, &json!({"slug": "one"}));
        assert_eq!(code(bad_kind_door), "update-unsupported");
        assert_eq!(read_tree(&model), before);

        let bad_kind_contract = run_update(&model, &root, Kind::Contract, &json!({"id": "C1"}));
        assert_eq!(code(bad_kind_contract), "update-unsupported");
        assert_eq!(read_tree(&model), before);

        // Update with move_owner -> update-unsupported
        let update_and_move = declare(
            &model,
            &root,
            &DeclareRequest {
                kind: Kind::Component,
                row: &json!({"id": "a"}),
                approved_by: None,
                plan: None,
                move_owner: true,
                update: true,
            },
            &ANSWERED,
        );
        assert_eq!(code(update_and_move), "update-unsupported");
        assert_eq!(read_tree(&model), before);

        // Bad status -> row-invalid
        let bad_status = run_update(
            &model,
            &root,
            Kind::Component,
            &json!({"id": "a", "status": "bogus"}),
        );
        assert_eq!(code(bad_status), "row-invalid");
        assert_eq!(read_tree(&model), before);

        // Missing path -> path-missing
        let missing_path = run_update(
            &model,
            &root,
            Kind::Component,
            &json!({"id": "a", "paths": ["src/ghost/"]}),
        );
        assert_eq!(code(missing_path), "path-missing");
        assert_eq!(read_tree(&model), before);

        // Alias another row uses -> name-taken
        let mut b_row = component_row("b");
        b_row["canonical"] = json!("beta");
        run(&model, &root, Kind::Component, &b_row, Some("q")).unwrap();
        let after_b = read_tree(&model);

        // Row 'a' has alias "first". Try to update row 'b' with alias "first".
        let alias_taken = run_update(
            &model,
            &root,
            Kind::Component,
            &json!({"id": "b", "aliases": ["first"]}),
        );
        assert_eq!(code(alias_taken), "name-taken");
        assert_eq!(read_tree(&model), after_b);

        // An update that keeps the row's own canonical name and aliases is accepted
        let keep_own_names = run_update(
            &model,
            &root,
            Kind::Component,
            &json!({"id": "a", "canonical": "alpha", "aliases": ["first"], "status": "designed"}),
        );
        assert!(keep_own_names.is_ok());
    }

    #[test]
    fn an_update_needs_no_approving_question() {
        let (root, model) = project("update-no-approval");
        let update_row = json!({
            "id": "a",
            "status": "planned"
        });
        let declared = declare(
            &model,
            &root,
            &DeclareRequest {
                kind: Kind::Component,
                row: &update_row,
                approved_by: None,
                plan: None,
                move_owner: false,
                update: true,
            },
            &Answer(QuestionState::Unknown),
        )
        .unwrap();
        assert_eq!(declared.id, "a");
        let loaded = Model::load_dir(&model).unwrap();
        assert_eq!(loaded.components[0].status, "planned");
    }
}
