//! The snapshot (spec section 5): the effective value of every key, where each value came from and
//! the revision of each source. A read never writes; a source that is malformed, misplaced or
//! invalid fails the whole snapshot with every refusal listed (all or nothing).
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use fgos_yaml_doc::merge::{merge, MergeRule};
use fgos_yaml_doc::path::format_path;
use fgos_yaml_doc::{parse, Document, Profile, Segment, Value as Doc};
use serde_json::Value;

use crate::detect::{self, Detectors};
use crate::files::{
    read_beneath, select_source, FileError, LoadedFile, Source, JSON_NAME, YAML_NAME,
};
use crate::schema::{descend, json_at, Schemas};
use crate::scope::{judge, SourceKind};
use crate::standard::Standard;
use crate::ConfigRefusal;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SessionClass {
    Confined,
    Unconfined,
}

/// Every path the caller resolved; the crate guesses no home directory and reads no environment.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SnapshotRequest {
    pub project_root: PathBuf,
    /// The main checkout: `command` values come from its project file.
    pub trusted_root: PathBuf,
    /// The machine's `~/.fgos`, named by the caller.
    pub global_dir: PathBuf,
    pub class: SessionClass,
}

pub struct Context<'a> {
    pub schemas: &'a Schemas,
    pub standard: &'a Standard,
    /// The bundle digest (`Schemas::bundled`), a key of the cache.
    pub digest: &'a str,
    pub detectors: &'a dyn Detectors,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Provenance {
    /// `project`, `global`, `accounts`, `standard` or `detected`.
    pub layer: &'static str,
    /// The layer, or `project@trusted` for a command value taken from the main checkout.
    pub role: &'static str,
    pub file: Option<String>,
    pub line: Option<u32>,
    pub column: Option<u32>,
}

pub struct Origin {
    pub path: Vec<Segment>,
    pub provenance: Provenance,
    /// False for a key present in a file that no schema describes.
    pub described: bool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AccountsState {
    Present,
    UnavailableConfined,
}

pub struct Snapshot {
    pub value: Value,
    pub origins: Vec<Origin>,
    /// Revision of the bytes read per source role, `absent` for a missing source.
    pub revisions: BTreeMap<&'static str, String>,
    pub accounts: AccountsState,
}

impl Snapshot {
    /// A verb that leases an account calls this; a confined session is refused by name.
    pub fn require_accounts(&self) -> Result<(), ConfigRefusal> {
        match self.accounts {
            AccountsState::Present => Ok(()),
            AccountsState::UnavailableConfined => {
                Err(ConfigRefusal::new("config-accounts-unavailable-confined"))
            }
        }
    }
}

#[derive(Debug)]
pub enum SnapshotError {
    Refused(Vec<ConfigRefusal>),
    Io(std::io::Error),
}

pub(crate) struct Src {
    role: &'static str,
    name: String,
    pub(crate) file: Option<LoadedFile>,
}

fn keep<T>(
    read: Result<T, FileError>,
    refused: &mut Vec<ConfigRefusal>,
) -> Result<Option<T>, SnapshotError> {
    match read {
        Ok(found) => Ok(Some(found)),
        Err(FileError::Refused(refusal)) => {
            refused.push(*refusal);
            Ok(None)
        }
        Err(FileError::Io(error)) => Err(SnapshotError::Io(error)),
    }
}

/// Opens each source once, beneath its root without following a symlink.
pub(crate) fn read_sources(req: &SnapshotRequest) -> Result<Vec<Src>, SnapshotError> {
    let max = Profile::StrictConfig.limits().input_bytes;
    let (Some(parent), Some(dir)) = (
        req.global_dir.parent(),
        req.global_dir.file_name().map(Path::new),
    ) else {
        return Err(SnapshotError::Refused(vec![ConfigRefusal::new(
            "config-path-symlink",
        )]));
    };
    let mut scopes = vec![("project", req.project_root.as_path(), Path::new(".fgos"))];
    if req.trusted_root != req.project_root {
        scopes.push((
            "project@trusted",
            req.trusted_root.as_path(),
            Path::new(".fgos"),
        ));
    }
    scopes.push(("global", parent, dir));
    let (mut out, mut refused) = (Vec::new(), Vec::new());
    for (role, root, dir) in scopes {
        let (name, file) = match keep(select_source(root, dir, max), &mut refused)? {
            Some(Source::Yaml(f)) => (YAML_NAME, Some(f)),
            Some(Source::LegacyJson(f)) => (JSON_NAME, Some(f)),
            _ => (YAML_NAME, None),
        };
        out.push(Src {
            role,
            name: format!("{role}:{name}"),
            file,
        });
    }
    if req.class == SessionClass::Unconfined {
        let file = keep(
            read_beneath(parent, &dir.join("private/accounts.yaml"), max),
            &mut refused,
        )?
        .flatten();
        out.push(Src {
            role: "accounts",
            name: "accounts:accounts.yaml".into(),
            file,
        });
    }
    if refused.is_empty() {
        Ok(out)
    } else {
        Err(SnapshotError::Refused(refused))
    }
}

/// The topmost `command` paths of `value`, cut at the first list index (a list comes whole from one file).
fn command_tops(schemas: &Schemas, value: &Value) -> Vec<Vec<Segment>> {
    let mut tops: Vec<Vec<Segment>> = Vec::new();
    descend(value, &mut Vec::new(), &mut |path, _| {
        let command = schemas
            .resolve(path)
            .is_some_and(|r| r.sensitivity == "command");
        if command {
            let cut = path
                .iter()
                .position(|s| matches!(s, Segment::Index(_)))
                .unwrap_or(path.len());
            if !tops.iter().any(|t| t[..] == path[..cut]) {
                tops.push(path[..cut].to_vec());
            }
        }
        !command
    });
    tops
}

/// Sets (or removes) the value at a key path, creating the mappings above it.
fn put(node: &mut Value, path: &[Segment], new: Option<Value>) {
    let Some((Segment::Key(key), rest)) = path.split_first() else {
        return;
    };
    if new.is_some() && !node.is_object() {
        *node = Value::Object(Default::default());
    }
    let Some(map) = node.as_object_mut() else {
        return;
    };
    match (rest.is_empty(), new) {
        (true, Some(value)) => drop(map.insert(key.clone(), value)),
        (true, None) => drop(map.remove(key)),
        (false, new) => {
            let child = if new.is_some() {
                Some(map.entry(key.clone()).or_insert(Value::Null))
            } else {
                map.get_mut(key)
            };
            if let Some(child) = child {
                put(child, rest, new);
            }
        }
    }
}

struct Parsed {
    doc: Document,
    json: Value,
}

struct Layer {
    layer: &'static str,
    doc: Doc,
    json: Value,
}

fn layer(layer: &'static str, json: Value) -> Layer {
    Layer {
        layer,
        doc: Doc::from_json(&json),
        json,
    }
}

/// Where a merged value came from: the layer's file, or none for a detected value.
fn provenance(
    layer: &Layer,
    path: &[Segment],
    docs: &BTreeMap<&str, Parsed>,
    std: &Standard,
    trusted: bool,
) -> Provenance {
    let role = if trusted {
        "project@trusted"
    } else {
        layer.layer
    };
    let found = match layer.layer {
        "standard" => std
            .span_of(path)
            .map(|(file, span)| (file.to_string(), span)),
        "detected" => None,
        _ => docs.get(role).and_then(|p| {
            let spans = p.doc.span_of(path)?;
            Some((p.doc.file().to_string(), spans.key.unwrap_or(spans.value)))
        }),
    };
    Provenance {
        layer: layer.layer,
        role,
        line: found.as_ref().map(|f| f.1.line),
        column: found.as_ref().map(|f| f.1.column),
        file: found.map(|f| f.0),
    }
}

/// Parses every source and judges it against its scope; each refusal is listed.
fn load(ctx: &Context, srcs: &[Src]) -> (BTreeMap<&'static str, Parsed>, Vec<ConfigRefusal>) {
    let (mut docs, mut errors) = (BTreeMap::new(), Vec::new());
    for src in srcs.iter().filter_map(|s| Some((s, s.file.as_ref()?))) {
        let (src, file) = src;
        let parsed = parse(&file.bytes, Profile::StrictConfig, &src.name)
            .and_then(|doc| Ok((doc.to_json()?, doc)))
            .map_err(ConfigRefusal::parse);
        match (parsed, src.role) {
            (Ok((json, doc)), role) => {
                let kind = [
                    ("project", SourceKind::Project),
                    ("global", SourceKind::Global),
                    ("accounts", SourceKind::Accounts),
                ];
                if let Some((_, kind)) = kind.iter().find(|(name, _)| *name == role) {
                    errors.extend(judge(ctx.schemas, *kind, &json, Some(&doc)));
                }
                docs.insert(role, Parsed { doc, json });
            }
            (Err(refusal), _) => errors.push(refusal),
        }
    }
    (docs, errors)
}

/// The project file with every `command` subtree taken from the trusted file, or removed when that
/// file lacks it; also the paths replaced.
fn trusted_project(
    schemas: &Schemas,
    project: &Value,
    trusted: &Value,
) -> (Value, Vec<Vec<Segment>>) {
    let mut tops = command_tops(schemas, project);
    for top in command_tops(schemas, trusted) {
        if !tops.contains(&top) {
            tops.push(top);
        }
    }
    let mut out = project.clone();
    for top in &tops {
        put(&mut out, top, json_at(trusted, top).cloned());
    }
    (out, tops)
}

/// A merge that cannot combine two layers: `config-schema` naming the layers that hold the path.
fn mismatch(layers: &[Layer], refusal: fgos_yaml_doc::Refusal) -> ConfigRefusal {
    let mut out = ConfigRefusal::new("config-schema");
    out.path = Some(format_path(&refusal.path));
    let detail = out.detail_mut();
    detail.keyword = Some(refusal.rule.to_string());
    detail.layers = layers
        .iter()
        .filter(|l| json_at(&l.json, &refusal.path).is_some())
        .map(|l| l.layer)
        .collect();
    out
}

pub(crate) fn build(
    ctx: &Context,
    req: &SnapshotRequest,
    srcs: &[Src],
) -> Result<Snapshot, SnapshotError> {
    let (docs, errors) = load(ctx, srcs);
    if !errors.is_empty() {
        return Err(SnapshotError::Refused(errors));
    }
    let json = |role: &str| docs.get(role).map(|p| p.json.clone());
    let project = json("project").unwrap_or(Value::Null);
    let (project, tops) = match json("project@trusted") {
        Some(trusted) => trusted_project(ctx.schemas, &project, &trusted),
        None => (project, Vec::new()),
    };
    let mut layers: Vec<Layer> = [
        ("project", Some(project)),
        ("global", json("global")),
        ("accounts", json("accounts")),
    ]
    .into_iter()
    .filter_map(|(name, json)| json.filter(|j| !j.is_null()).map(|j| layer(name, j)))
    .collect();
    let held = |path: &[Segment]| {
        layers.iter().any(|l| json_at(&l.json, path).is_some())
            || ctx.standard.value_at(path).is_some()
    };
    let mut detected = Value::Null;
    for path in detect::paths(ctx.schemas).iter().filter(|p| !held(p)) {
        if let Some(value) = ctx.detectors.detect(path) {
            put(&mut detected, path, Some(value.to_json()));
        }
    }
    layers.extend(
        Some(detected)
            .filter(|d| !d.is_null())
            .map(|d| layer("detected", d)),
    );
    layers.extend(
        Some(ctx.standard.value().clone())
            .filter(|d| !d.is_null())
            .map(|d| layer("standard", d)),
    );
    let rules = |path: &[Segment]| match ctx.schemas.resolve(path)?.merge? {
        "deep" => Some(MergeRule::Deep),
        "replace" => Some(MergeRule::Replace),
        "leaf" => Some(MergeRule::Leaf),
        _ => None,
    };
    let merged = merge(&layers.iter().map(|l| &l.doc).collect::<Vec<_>>(), &rules)
        .map_err(|refusal| SnapshotError::Refused(vec![mismatch(&layers, refusal)]))?;
    let prov = |at: usize, path: &[Segment]| {
        let layer = &layers[at];
        let trusted = layer.layer == "project" && tops.iter().any(|t| path.starts_with(t));
        provenance(layer, path, &docs, ctx.standard, trusted)
    };
    let origins = merged.origins.iter().map(|(path, at)| Origin {
        described: ctx.schemas.resolve(path).is_some(),
        provenance: prov(*at, path),
        path: path.clone(),
    });
    let mut errors = Vec::new();
    match ctx.schemas.validate(&merged.value) {
        Ok(violations) => {
            for v in violations
                .into_iter()
                .filter(|v| ctx.schemas.resolve(&v.path).is_some())
            {
                // The deepest path of the violation that some layer wrote, for its file and position.
                let from = (1..=v.path.len()).rev().find_map(|n| {
                    let (_, at) = merged
                        .origins
                        .iter()
                        .find(|(p, _)| p.starts_with(&v.path[..n]))?;
                    Some(prov(*at, &v.path[..n]))
                });
                let mut refusal = ConfigRefusal::new("config-schema");
                refusal.path = Some(format_path(&v.path));
                if let Some(from) = from {
                    (refusal.file, refusal.line, refusal.column) =
                        (from.file, from.line, from.column);
                }
                let detail = refusal.detail_mut();
                (detail.keyword, detail.schema_path) = (Some(v.keyword), Some(v.schema_path));
                errors.push(refusal);
            }
        }
        Err(refusal) => errors.push(refusal),
    }
    if !errors.is_empty() {
        errors.sort_by(|a, b| {
            (&a.file, a.line, a.column, &a.path).cmp(&(&b.file, b.line, b.column, &b.path))
        });
        return Err(SnapshotError::Refused(errors));
    }
    let revisions = srcs.iter().map(|s| {
        (
            s.role,
            s.file
                .as_ref()
                .map_or("absent".into(), |f| f.revision.clone()),
        )
    });
    Ok(Snapshot {
        value: merged.value.to_json(),
        origins: origins.collect(),
        revisions: revisions.collect(),
        accounts: if req.class == SessionClass::Confined {
            AccountsState::UnavailableConfined
        } else {
            AccountsState::Present
        },
    })
}

/// The effective value now, read from the files as they are.
pub fn snapshot(ctx: &Context, req: &SnapshotRequest) -> Result<Snapshot, SnapshotError> {
    build(ctx, req, &read_sources(req)?)
}
