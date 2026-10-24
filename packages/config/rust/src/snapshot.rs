//! The snapshot (spec section 5): the effective value of every key, where each value came from and
//! the revision of each source. A read never writes; a source that is malformed, misplaced or
//! invalid fails the whole snapshot with every refusal listed (all or nothing).
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use fgos_yaml_doc::merge::{merge, MergeRule};
use fgos_yaml_doc::path::format_path;
use fgos_yaml_doc::{Document, Profile, Segment, Value as Doc};
use serde_json::Value;

use crate::detect::{self, Detectors};
use crate::files::{
    read_beneath, select_source, FileError, LoadedFile, Source, JSON_NAME, YAML_NAME,
};
use crate::schema::{descend, json_at, json_put, key_span, load, Schemas};
use crate::scope::{judge, trusted_project, SourceKind};
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
    /// The in-process value: a `secret-value` is carried as stored for the consumer that needs it.
    /// Every display form goes through `redact::render_for_display`.
    pub value: Value,
    pub origins: Vec<Origin>,
    /// Revision of the bytes read per source role, `absent` for a missing source.
    pub revisions: BTreeMap<&'static str, String>,
    pub accounts: AccountsState,
    /// `(id, path)`: `shadowed-by-destination` for a key the global file still holds that the
    /// accounts file or the token file holds already (a move interrupted or in its copy stage).
    pub notices: Vec<(&'static str, String)>,
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

// The one error of a read and of a write: refusals by id, or an operating-system error without one.
// A YAML Document refusal is carried whole inside `config-parse`.
impl From<ConfigRefusal> for SnapshotError {
    fn from(refusal: ConfigRefusal) -> Self {
        SnapshotError::Refused(vec![refusal])
    }
}

impl From<fgos_yaml_doc::Refusal> for SnapshotError {
    fn from(refusal: fgos_yaml_doc::Refusal) -> Self {
        ConfigRefusal::parse(refusal).into()
    }
}

impl From<std::io::Error> for SnapshotError {
    fn from(error: std::io::Error) -> Self {
        SnapshotError::Io(error)
    }
}

impl From<FileError> for SnapshotError {
    fn from(error: FileError) -> Self {
        match error {
            FileError::Refused(refusal) => (*refusal).into(),
            FileError::Io(error) => error.into(),
        }
    }
}

pub(crate) struct Src {
    pub(crate) role: &'static str,
    name: String,
    pub(crate) file: Option<LoadedFile>,
}

fn fail_if_any(refusals: Vec<ConfigRefusal>) -> Result<(), SnapshotError> {
    if refusals.is_empty() {
        Ok(())
    } else {
        Err(SnapshotError::Refused(refusals))
    }
}

/// One source: the file of a scope chosen beneath its root, without following a symlink.
fn open_source(role: &'static str, root: &Path, dir: &Path, max: usize) -> Result<Src, FileError> {
    let (name, file) = match select_source(root, dir, max)? {
        Source::Yaml(file) => (YAML_NAME, Some(file)),
        Source::LegacyJson(file) => (JSON_NAME, Some(file)),
        Source::Absent => (YAML_NAME, None),
    };
    Ok(Src {
        role,
        name: format!("{role}:{name}"),
        file,
    })
}

/// The directory that holds the global directory and the global directory's own name; the global
/// directory must be named (never the root).
pub(crate) fn split_global(global_dir: &Path) -> Result<(&Path, &Path), ConfigRefusal> {
    match (global_dir.parent(), global_dir.file_name()) {
        (Some(parent), Some(dir)) => Ok((parent, Path::new(dir))),
        _ => Err(ConfigRefusal::new("config-path-symlink")),
    }
}

/// The accounts file beneath the global directory, read once and never followed through a symlink.
pub(crate) fn accounts_source(global_dir: &Path, max: usize) -> Result<Src, FileError> {
    let (parent, dir) = split_global(global_dir).map_err(|r| FileError::Refused(Box::new(r)))?;
    let file = read_beneath(parent, &dir.join("private/accounts.yaml"), max)?;
    Ok(Src {
        role: "accounts",
        name: "accounts:accounts.yaml".into(),
        file,
    })
}

/// Size and revision of the token file beneath the global directory; none when it is absent, a
/// symlink or unreadable. Its presence decides which global keys are shadowed, so the cache keys on it.
pub(crate) fn token_revision(global_dir: &Path) -> Option<(usize, String)> {
    let (parent, dir) = split_global(global_dir).ok()?;
    let path = dir.join("private/gateway-token");
    let file = read_beneath(parent, &path, 1024).ok()??;
    Some((file.bytes.len(), file.revision))
}

/// Opens the machine's own sources once: the global file and, when unconfined, the accounts file.
fn machine_reads(req: &SnapshotRequest) -> Result<Vec<Result<Src, FileError>>, SnapshotError> {
    let max = Profile::StrictConfig.limits().input_bytes;
    let (parent, dir) = split_global(&req.global_dir)?;
    let mut reads = vec![open_source("global", parent, dir, max)];
    if req.class == SessionClass::Unconfined {
        reads.push(accounts_source(&req.global_dir, max));
    }
    Ok(reads)
}

/// The sources of every read that succeeded, or every refusal found; an operating-system error ends it.
fn collect(reads: Vec<Result<Src, FileError>>) -> Result<Vec<Src>, SnapshotError> {
    let (mut out, mut refused) = (Vec::new(), Vec::new());
    for read in reads {
        match read {
            Ok(src) => out.push(src),
            Err(FileError::Refused(refusal)) => refused.push(*refusal),
            Err(FileError::Io(error)) => return Err(SnapshotError::Io(error)),
        }
    }
    fail_if_any(refused)?;
    Ok(out)
}

/// Opens each source once.
pub(crate) fn read_sources(req: &SnapshotRequest) -> Result<Vec<Src>, SnapshotError> {
    let max = Profile::StrictConfig.limits().input_bytes;
    let project = |role, root| open_source(role, root, Path::new(".fgos"), max);
    let mut reads = vec![project("project", &req.project_root)];
    if req.trusted_root != req.project_root {
        reads.push(project("project@trusted", &req.trusted_root));
    }
    reads.extend(machine_reads(req)?);
    collect(reads)
}

/// The machine's sources alone (no project): what the machine view reads.
pub(crate) fn machine_sources(req: &SnapshotRequest) -> Result<Vec<Src>, SnapshotError> {
    collect(machine_reads(req)?)
}

struct Layer {
    layer: &'static str,
    doc: Doc,
    json: Value,
}

/// A layer holding `json`; none for a null, which holds nothing.
fn layer(layer: &'static str, json: Value) -> Option<Layer> {
    (!json.is_null()).then(|| Layer {
        layer,
        doc: Doc::from_json(&json),
        json,
    })
}

/// Whether a value in the wrong file has anything to carry: null, `{}` and `[]` hold nothing.
pub(crate) fn carries(value: &Value) -> bool {
    match value {
        Value::Null => false,
        Value::Object(map) => !map.is_empty(),
        Value::Array(items) => !items.is_empty(),
        _ => true,
    }
}

/// The global file without the keys its destination holds already, or that hold nothing: the
/// destination wins (spec section 13), so such a key is no refusal and no layer.
fn without_held(
    ctx: &Context,
    global: Value,
    accounts: Option<&Value>,
    token: bool,
    notices: &mut Vec<(&'static str, String)>,
) -> Value {
    let (mut kept, mut held) = (global.clone(), Vec::new());
    descend(&global, &mut Vec::new(), &mut |path, value| {
        let file = ctx.schemas.resolve(path).map_or("config", |r| r.file);
        let shadowed = match file {
            "accounts" => accounts.is_some_and(|a| json_at(a, path).is_some()),
            "token" => token,
            _ => return true,
        } || !carries(value);
        if shadowed {
            held.push(path.to_vec());
        }
        false
    });
    for path in held {
        json_put(&mut kept, &path, None);
        notices.push(("shadowed-by-destination", format_path(&path)));
    }
    kept
}

/// The parsed sources by role, the refusals found and the notices.
type Loaded = (
    BTreeMap<&'static str, (Document, Value)>,
    Vec<ConfigRefusal>,
    Vec<(&'static str, String)>,
);

/// Parses every source and judges it against its scope; each refusal is listed.
fn load_sources(ctx: &Context, srcs: &[Src], token: bool) -> Loaded {
    let (mut docs, mut errors, mut notices) = (BTreeMap::new(), Vec::new(), Vec::new());
    let accounts = srcs.iter().find(|s| s.role == "accounts");
    let accounts = accounts.and_then(|s| load(&s.name, &s.file.as_ref()?.bytes).ok());
    for (src, file) in srcs.iter().filter_map(|s| Some((s, s.file.as_ref()?))) {
        let (doc, mut json) = match load(&src.name, &file.bytes) {
            Ok(parsed) => parsed,
            Err(refusal) => {
                errors.push(refusal);
                continue;
            }
        };
        if src.role == "global" {
            let held = accounts.as_ref().map(|(_, json)| json);
            json = without_held(ctx, json, held, token, &mut notices);
        }
        let kind = match src.role {
            "project" => Some(SourceKind::Project),
            "global" => Some(SourceKind::Global),
            "accounts" => Some(SourceKind::Accounts),
            _ => None,
        };
        if let Some(kind) = kind {
            errors.extend(judge(ctx.schemas, kind, &json, Some(&doc)));
        }
        docs.insert(src.role, (doc, json));
    }
    (docs, errors, notices)
}

/// A merge that cannot combine two layers: `config-schema` naming the layers that hold the path.
fn mismatch(layers: &[Layer], refusal: fgos_yaml_doc::Refusal) -> ConfigRefusal {
    let mut out = ConfigRefusal::new("config-schema").at_path(&refusal.path);
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
    let token = req.class == SessionClass::Unconfined && token_revision(&req.global_dir).is_some();
    let (docs, errors, notices) = load_sources(ctx, srcs, token);
    fail_if_any(errors)?;
    let json = |role: &str| docs.get(role).map(|(_, json)| json.clone());
    let project = json("project").unwrap_or(Value::Null);
    let (project, tops) = match json("project@trusted") {
        Some(trusted) => trusted_project(ctx.schemas, &project, &trusted),
        None => (project, Vec::new()),
    };
    let mut layers: Vec<Layer> = [
        ("project", project),
        ("global", json("global").unwrap_or_default()),
        ("accounts", json("accounts").unwrap_or_default()),
    ]
    .into_iter()
    .filter_map(|(name, json)| layer(name, json))
    .collect();
    let held = |path: &[Segment]| {
        layers.iter().any(|l| json_at(&l.json, path).is_some())
            || ctx.standard.value_at(path).is_some()
    };
    let mut detected = Value::Null;
    for path in detect::paths(ctx.schemas).iter().filter(|p| !held(p)) {
        if let Some(value) = ctx.detectors.detect(path) {
            json_put(&mut detected, path, Some(value.to_json()));
        }
    }
    layers.extend(layer("detected", detected));
    layers.extend(layer("standard", ctx.standard.value().clone()));
    let rules = |path: &[Segment]| match ctx.schemas.resolve(path)?.merge? {
        "deep" => Some(MergeRule::Deep),
        "replace" => Some(MergeRule::Replace),
        "leaf" => Some(MergeRule::Leaf),
        _ => None,
    };
    let merged = merge(&layers.iter().map(|l| &l.doc).collect::<Vec<_>>(), &rules)
        .map_err(|refusal| SnapshotError::Refused(vec![mismatch(&layers, refusal)]))?;
    // Where the value at `path` came from: the file of the layer that won it (a command value
    // taken from the main checkout reads `project@trusted`), none for a detected value.
    let provenance = |at: usize, path: &[Segment]| {
        let layer = &layers[at];
        let role = if layer.layer == "project" && tops.iter().any(|t| path.starts_with(t)) {
            "project@trusted"
        } else {
            layer.layer
        };
        let found = match layer.layer {
            "standard" => ctx.standard.span_of(path),
            "detected" => None,
            _ => docs
                .get(role)
                .and_then(|(doc, _)| Some((doc.file(), key_span(doc, path)?))),
        };
        Provenance {
            layer: layer.layer,
            role,
            file: found.map(|(file, _)| file.to_string()),
            line: found.map(|(_, span)| span.line),
            column: found.map(|(_, span)| span.column),
        }
    };
    let violations = ctx
        .schemas
        .validate(&merged.value)
        .map_err(|refusal| SnapshotError::Refused(vec![refusal]))?;
    let mut errors: Vec<ConfigRefusal> = violations
        .into_iter()
        .filter(|v| ctx.schemas.resolve(&v.path).is_some())
        .map(|v| {
            // The deepest path of the violation that some layer wrote, for its file and position.
            let from = (1..=v.path.len()).rev().find_map(|n| {
                let (_, at) = merged
                    .origins
                    .iter()
                    .find(|(p, _)| p.starts_with(&v.path[..n]))?;
                Some(provenance(*at, &v.path[..n]))
            });
            let mut refusal = v.into_refusal();
            if let Some(from) = from {
                (refusal.file, refusal.line, refusal.column) = (from.file, from.line, from.column);
            }
            refusal
        })
        .collect();
    errors.sort_by(|a, b| {
        (&a.file, a.line, a.column, &a.path).cmp(&(&b.file, b.line, b.column, &b.path))
    });
    fail_if_any(errors)?;
    Ok(Snapshot {
        value: merged.value.to_json(),
        origins: merged
            .origins
            .iter()
            .map(|(path, at)| Origin {
                described: ctx.schemas.resolve(path).is_some(),
                provenance: provenance(*at, path),
                path: path.clone(),
            })
            .collect(),
        revisions: srcs
            .iter()
            .map(|s| {
                let revision = s.file.as_ref().map(|f| f.revision.clone());
                (s.role, revision.unwrap_or_else(|| "absent".into()))
            })
            .collect(),
        accounts: match req.class {
            SessionClass::Confined => AccountsState::UnavailableConfined,
            SessionClass::Unconfined => AccountsState::Present,
        },
        notices,
    })
}

/// The effective value now, read from the files as they are.
pub fn snapshot(ctx: &Context, req: &SnapshotRequest) -> Result<Snapshot, SnapshotError> {
    build(ctx, req, &read_sources(req)?)
}
