//! `config` namespace: the Node door to the `fgos-config` crate. Every entry takes one request object and
//! returns one JSON text, which the Node facade turns into prototype-free objects (a key of a user file, such
//! as `__proto__`, is data and must never reach a prototype); what a value means lives in the crate.
//!
//! A refusal is the JSON message of the error (`marshal::Failure`): the first failure id and every refusal
//! with its file, position, path and keyword, never a value. This door adds three ids of its own:
//! `config-request-invalid` (the request breaks the entry's contract; the keyword names the field),
//! `config-trusted-root-unresolved` (the main checkout could not be established; the keyword is the cause)
//! and `config-internal-error` (a panic, caught at the boundary, nothing printed).
use std::path::{Component, Path, PathBuf};
use std::sync::{Mutex, PoisonError};

use fgos_config::cache::{machine_cached, snapshot_cached, SnapshotCache};
use fgos_config::detect::{Detectors, NoDetectors, PathDetectors};
use fgos_config::event_store::{EventStoreConfig, Invalid};
use fgos_config::machine::{self, accounts};
use fgos_config::snapshot::{AccountsState, Context, SessionClass, Snapshot};
use fgos_config::snapshot::{SnapshotError, SnapshotRequest};
use fgos_config::ConfigRefusal;
use fgos_git::GitDriver;
use fgos_yaml_doc::path::{format_path, parse_path};
use napi::Result;
use napi_derive::napi;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::check;
use crate::marshal::{guarded_as, Failure, More};

type Res<T> = std::result::Result<T, Failure>;

/// Snapshots the door keeps; each is validated against its files on every read, so a hit is never stale.
const CACHE_SLOTS: usize = 8;

/// Every field an entry may take; an entry reads what it needs and an unknown field is refused.
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
struct Request {
    global_dir: String,
    class: String,
    project_root: Option<String>,
    sections: Option<Vec<String>>,
    origins: Vec<String>,
    rows: Vec<String>,
    ids: Vec<String>,
    acknowledge: bool,
    target: Option<String>,
    path: Option<String>,
    /// `eventStoreConfig`: the config object whose `eventStore` section is validated.
    config: Option<Value>,
    /// `eventStore`: a refused config file reaches the caller instead of degrading to a config that never publishes.
    strict: bool,
    /// `globalDir`: the home variables of the caller's environment.
    env: Option<std::collections::HashMap<String, String>>,
}

fn detailed(id: &str, more: More) -> Failure {
    Failure {
        id: id.into(),
        more: Some(Box::new(more)),
        ..Failure::default()
    }
}

fn failure(id: &str, keyword: impl Into<String>) -> Failure {
    let keyword = Some(keyword.into());
    detailed(
        id,
        More {
            keyword,
            ..More::default()
        },
    )
}

fn invalid(field: &str) -> Failure {
    failure("config-request-invalid", field)
}

fn refusal(r: &ConfigRefusal) -> Failure {
    let keyword = r.detail.as_ref().and_then(|d| d.keyword.clone());
    let keyword = keyword.or_else(|| r.yaml.as_ref().map(|y| y.rule.to_string()));
    let mut out = detailed(
        r.code,
        More {
            path: r.path.clone(),
            keyword,
            ..More::default()
        },
    );
    (out.file, out.line, out.column) = (r.file.clone().unwrap_or_default(), r.line, r.column);
    out
}

impl From<SnapshotError> for Failure {
    fn from(error: SnapshotError) -> Failure {
        match error {
            SnapshotError::Refused(all) => {
                let refusals = all.iter().map(refusal).collect();
                detailed(
                    all.first().map_or("config-refused", |r| r.code),
                    More {
                        refusals,
                        ..More::default()
                    },
                )
            }
            SnapshotError::Io(e) => failure("config-io", format!("{:?}", e.kind())),
        }
    }
}

fn absolute(text: &str, field: &str) -> Res<PathBuf> {
    let path = Path::new(text);
    let plain = !path.components().any(|c| c == Component::ParentDir);
    (path.is_absolute() && plain)
        .then(|| path.into())
        .ok_or_else(|| invalid(field))
}

impl Request {
    /// The roots of a call. `trusted` resolves the main checkout, where a linked worktree's `command` values
    /// come from; a request with no project root names the global directory for both.
    fn roots(&self, trusted: bool) -> Res<SnapshotRequest> {
        let class = match self.class.as_str() {
            "confined" => SessionClass::Confined,
            "unconfined" => SessionClass::Unconfined,
            _ => return Err(invalid("class")),
        };
        let global_dir = absolute(&self.global_dir, "globalDir")?;
        let project_root = match &self.project_root {
            Some(root) => std::fs::canonicalize(absolute(root, "projectRoot")?)
                .map_err(|_| invalid("projectRoot"))?,
            None => global_dir.clone(),
        };
        let resolve = trusted && self.project_root.is_some();
        let trusted_root = if resolve {
            trusted_root(&project_root)?
        } else {
            project_root.clone()
        };
        Ok(SnapshotRequest {
            project_root,
            trusted_root,
            global_dir,
            class,
        })
    }

    fn project(&self) -> Res<()> {
        self.project_root
            .as_ref()
            .map(drop)
            .ok_or_else(|| invalid("projectRoot"))
    }
}

/// The main checkout of `project` (the project itself outside a repository): the one disk-only topology
/// check of the Git driver, the same route the CLI provider takes.
fn trusted_root(project: &Path) -> Res<PathBuf> {
    let unresolved = |cause: String| failure("config-trusted-root-unresolved", cause);
    match GitDriver::trusted_root_at(project).map_err(|e| unresolved(e.cause))? {
        Some(main) => {
            std::fs::canonicalize(main).map_err(|e| unresolved(format!("{:?}", e.kind())))
        }
        None => Ok(project.to_path_buf()),
    }
}

fn accounts_name(state: AccountsState) -> &'static str {
    if state == AccountsState::Present {
        "present"
    } else {
        "unavailable-confined"
    }
}

fn on_path() -> PathDetectors {
    PathDetectors {
        path: std::env::var_os("PATH"),
    }
}

fn context(detectors: &dyn Detectors) -> Res<Context<'_>> {
    machine::context(detectors).map_err(|r| SnapshotError::from(r).into())
}

/// Runs an entry: parses the request, catches a panic (nothing is printed), answers JSON text.
fn entry(args: Value, run: impl FnOnce(Request) -> Res<Value>) -> Result<String> {
    check()?;
    let request = serde_json::from_value(args).map_err(|_| invalid("request"));
    Ok(guarded_as("config-internal-error", || {
        run(request?).map(|v| v.to_string())
    })?)
}

/// The snapshot as the door reports it: the value (only `sections` when named), where each requested path
/// came from, the revision of each source, whether accounts were readable, and the notices.
fn render(snapshot: &Snapshot, a: &Request) -> Res<Value> {
    let value = match (&snapshot.value, &a.sections) {
        (Value::Object(map), Some(keep)) => map
            .iter()
            .filter(|(k, _)| keep.contains(k))
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect(),
        (value, _) => value.clone(),
    };
    let mut out = json!({
        "value": value, "revisions": snapshot.revisions, "accounts": accounts_name(snapshot.accounts),
        "notices": snapshot.notices.iter().map(|(id, path)| json!({"id": id, "path": path})).collect::<Vec<_>>(),
    });
    let wanted = a
        .origins
        .iter()
        .map(|t| parse_path(t).map_err(|_| invalid("origins")))
        .collect::<Res<Vec<_>>>()?;
    if !wanted.is_empty() {
        let found = snapshot
            .origins
            .iter()
            .filter(|o| wanted.iter().any(|p| o.path.starts_with(p)));
        out["origins"] = found
            .map(|o| {
                let p = &o.provenance;
                json!({ "path": format_path(&o.path), "layer": p.layer, "role": p.role, "file": p.file, "line": p.line, "column": p.column, "described": o.described })
            })
            .collect();
    }
    Ok(out)
}

type Slot = ((SnapshotRequest, bool), SnapshotCache);

/// The snapshot of `req` (or, with `machine`, of the machine view of its global directory) through the door's
/// cache, the least recently used slot out first. A slot is one request; the cache itself keys on what the
/// files and the detectors read, so a hit is never stale.
fn cached(req: &SnapshotRequest, machine: bool, ctx: &Context, a: &Request) -> Res<Value> {
    with_snapshot(req, machine, ctx, |held| render(held.map_err(Failure::from)?, a))
}

/// `read` over the snapshot the cache holds for `req`, or the error reading it gave.
fn with_snapshot<T>(
    req: &SnapshotRequest,
    machine: bool,
    ctx: &Context,
    read: impl FnOnce(std::result::Result<&Snapshot, SnapshotError>) -> Res<T>,
) -> Res<T> {
    static CACHE: Mutex<Vec<Slot>> = Mutex::new(Vec::new());
    let mut slots = CACHE.lock().unwrap_or_else(PoisonError::into_inner);
    let key = (req.clone(), machine);
    let slot = match slots.iter().position(|(held, _)| *held == key) {
        Some(at) => slots.remove(at),
        None => (key, SnapshotCache::default()),
    };
    slots.push(slot);
    if slots.len() > CACHE_SLOTS {
        slots.remove(0);
    }
    let (_, cache) = slots.last_mut().ok_or_else(|| invalid("cache"))?;
    let held = if machine {
        machine_cached(cache, ctx, &req.global_dir, req.class)
    } else {
        snapshot_cached(cache, ctx, req)
    };
    read(held)
}

/// The effective value now. With a project root: project over global over standard (accounts when
/// unconfined, `command` values from the main checkout). Without: the machine view, which never reads a
/// project. `{ projectRoot?, globalDir, class, sections?, origins? }`.
#[napi(namespace = "config", js_name = "snapshot")]
pub fn snapshot_entry(args: Value) -> Result<String> {
    entry(args, |a| {
        let detectors = on_path();
        let ctx = context(&detectors)?;
        let roots = a.roots(true)?;
        cached(&roots, a.project_root.is_none(), &ctx, &a)
    })
}

/// The bundled standard's value at one path, with no file read: `{ present, value }`; a path the standard does
/// not hold is `{ present: false, value: null }`. `{ path }`, a dotted path such as `runner.modelPolicies.claude.advanced`.
#[napi(namespace = "config", js_name = "standardValue")]
pub fn standard_value_entry(args: Value) -> Result<String> {
    entry(args, |a| {
        let path = parse_path(a.path.as_deref().ok_or_else(|| invalid("path"))?)
            .map_err(|_| invalid("path"))?;
        let ctx = context(&NoDetectors)?;
        let found = ctx.standard.value_at(&path);
        Ok(json!({ "present": found.is_some(), "value": found }))
    })
}

/// The account pools alone, readable with no valid project or global file: `{ present, state, revision,
/// runner }`. `{ globalDir, class }`.
#[napi(namespace = "config", js_name = "accounts")]
pub fn accounts_entry(args: Value) -> Result<String> {
    entry(args, |a| {
        let view = accounts::read(&context(&NoDetectors)?, &a.roots(false)?)?;
        Ok(
            json!({ "present": view.present, "state": accounts_name(view.state), "revision": view.revision, "runner": view.value.get("runner") }),
        )
    })
}

fn event_store_json(config: &EventStoreConfig) -> Value {
    json!({
        "remote": config.remote,
        "seal": { "intervalSec": config.seal_interval_sec, "coalesceSec": config.seal_coalesce_sec },
        "sync": { "intervalSec": config.sync_interval_sec },
        "rebuild": { "maxAttempts": config.rebuild_max_attempts },
    })
}

impl From<Invalid> for Failure {
    fn from(Invalid(name): Invalid) -> Failure {
        failure("event-store-config", name)
    }
}

/// The `eventStore` section of an in-memory config object, validated over the bundled standard: `{ config }`, the
/// object whose `eventStore` key is read (absent means every default). Answers every key of the section.
#[napi(namespace = "config", js_name = "eventStoreConfig")]
pub fn event_store_config_entry(args: Value) -> Result<String> {
    entry(args, |a| {
        let ctx = context(&NoDetectors)?;
        let config = a.config.as_ref().ok_or_else(|| invalid("config"))?;
        Ok(event_store_json(&EventStoreConfig::from_section(
            config.get("eventStore"),
            &ctx,
        )?))
    })
}

/// The `eventStore` section the config files of a project give: `{ projectRoot, globalDir, class, strict? }`. A refused
/// file never yields the defaults for a publish decision: a `strict` caller, or a refusal that names an `eventStore`
/// value, gets the refusal; any other caller gets a config that never publishes (`sync.intervalSec` 0).
#[napi(namespace = "config", js_name = "eventStore")]
pub fn event_store_entry(args: Value) -> Result<String> {
    entry(args, |a| {
        a.project()?;
        let detectors = on_path();
        let ctx = context(&detectors)?;
        let roots = a.roots(true)?;
        with_snapshot(&roots, false, &ctx, |held| match held {
            Ok(snapshot) => Ok(event_store_json(&EventStoreConfig::from_section(
                snapshot.value.get("eventStore"),
                &ctx,
            )?)),
            Err(error) => match EventStoreConfig::when_refused(&error, a.strict, &ctx) {
                Some(degraded) => Ok(event_store_json(&degraded)),
                None => Err(error.into()),
            },
        })
    })
}

/// Where the global fgOS directory is: `{ env }`, the caller's home variables (`HOME`, `USERPROFILE`); the crate decides
/// which one counts. A home that is unset or blank is `config-io` with the keyword `HomeUnset`.
#[napi(namespace = "config", js_name = "globalDir")]
pub fn global_dir_entry(args: Value) -> Result<String> {
    entry(args, |a| {
        let env = a.env.unwrap_or_default();
        let dir = machine::global_dir(|name| env.get(name).cloned())
            .ok_or_else(|| failure("config-io", "HomeUnset"))?;
        Ok(Value::String(dir.to_string_lossy().into_owned()))
    })
}

#[cfg(unix)]
mod unix {
    use super::*;
    use fgos_config::doctor::{check, Consumer, Severity};
    use fgos_config::repair::fix;
    use fgos_config::scope::SourceKind;
    use fgos_config::write::{init, target_revision, WriteRequest};

    const LOCK_WAIT_MS: u64 = 5_000;

    pub fn check_entry(a: Request) -> Res<Value> {
        a.project()?;
        let detectors = on_path();
        let found = check(
            &context(&detectors)?,
            &a.roots(true)?,
            std::time::SystemTime::now(),
        );
        let rows = found.iter().filter(|f| a.rows.is_empty() || a.rows.iter().any(|r| r == f.row)).map(|f| {
            let severity = if f.severity(Consumer::Doctor) == Severity::Fail { "fail" } else { "warn" };
            json!({ "row": f.row, "severity": severity, "file": f.file, "line": f.line, "column": f.column, "path": f.path, "fix": f.fix, "detail": f.detail })
        });
        Ok(json!({ "findings": rows.collect::<Vec<_>>() }))
    }

    pub fn fix_entry(a: Request) -> Res<Value> {
        a.project()?;
        let (roots, detectors) = (a.roots(true)?, on_path());
        let lock_root = fgos_holder_lock::state_root::lock_root();
        // Each repair asks for the request of the file it edits; the transaction reads that file again.
        let request = |target: SourceKind| WriteRequest {
            roots: roots.clone(),
            lock_root: lock_root.clone(),
            target,
            expected: target_revision(&roots, target).ok().flatten(),
            edits: Vec::new(),
            reason: String::new(),
            acknowledge_comment_loss: a.acknowledge,
            lock_wait_ms: LOCK_WAIT_MS,
        };
        let ids: Vec<&str> = a.ids.iter().map(String::as_str).collect();
        let writer = fgos_identity::resolve_current(None);
        let done = fix(&context(&detectors)?, request, &writer, &ids, a.acknowledge)?;
        let changed = done
            .applied
            .iter()
            .map(|(fix, path)| json!({ "fix": fix, "path": path }));
        Ok(json!({ "changed": changed.collect::<Vec<_>>(), "skipped": done.skipped }))
    }

    pub fn init_entry(a: Request) -> Res<Value> {
        let target = match a.target.as_deref() {
            Some("project") => SourceKind::Project,
            Some("global") => SourceKind::Global,
            _ => return Err(invalid("target")),
        };
        if target == SourceKind::Project {
            a.project()?;
        }
        let made = init(
            &a.roots(false)?,
            target,
            &fgos_holder_lock::state_root::lock_root(),
            LOCK_WAIT_MS,
        )?;
        Ok(json!({ "created": made.created, "file": made.file, "revision": made.revision }))
    }
}

/// Writes and the findings engine need the no-follow primitives of Durable File, which are Unix only.
#[cfg(not(unix))]
mod unix {
    use super::*;

    pub fn check_entry(_: Request) -> Res<Value> {
        Err(failure("config-platform-unsupported", "write"))
    }
    pub use check_entry as fix_entry;
    pub use check_entry as init_entry;
}

/// The findings of the config files of a project and the machine, each source judged on its own, with the
/// doctor severities: `{ findings: [{ row, severity, file, line, column, path, fix, detail }] }`.
/// `{ projectRoot, globalDir, class, rows? }`; `rows` keeps only the named rows.
#[napi(namespace = "config", js_name = "check")]
pub fn check_config(args: Value) -> Result<String> {
    entry(args, unix::check_entry)
}

/// Applies the named repairs a check offered, as the writer this process resolves to: `{ changed: [{ fix,
/// path }], skipped }`. A confined class is `config-write-confined`. `{ projectRoot, globalDir, class, ids,
/// acknowledge? }`.
#[napi(namespace = "config", js_name = "fix")]
pub fn fix_config(args: Value) -> Result<String> {
    entry(args, unix::fix_entry)
}

/// Creates the header-only file of a scope that has none: `{ created, file, revision }`; an existing file, legacy
/// JSON included, is kept. `{ projectRoot?, globalDir, class, target: "project" | "global" }`.
#[napi(namespace = "config", js_name = "init")]
pub fn init_config(args: Value) -> Result<String> {
    entry(args, unix::init_entry)
}
