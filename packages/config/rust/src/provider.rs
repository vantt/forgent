//! The host provider behind `fgos config` (spec section 11): the read verbs (`config.read`) and
//! the write verbs (`config.write`). A verb only resolves roots, calls the crate and shapes the
//! answer: every write goes through `write::commit`, `migrate` or `relocate`; no code here opens a
//! config file for writing. The session class comes from the `FGOS_CONFINED` marker, which is
//! information for a polite refusal and never a boundary (`session.rs`). No answer carries a value.
#![cfg(unix)]

use std::borrow::Cow;
use std::future::Future;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::pin::Pin;
use std::time::SystemTime;

use fgos_git::{GitDriver, OperationError, ResolveRepo};
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome,
};
use fgos_identity::{resolve_current, Refusal};
use fgos_yaml_doc::path::{format_path, parse_path};
use fgos_yaml_doc::{parse, Profile, Segment};
use serde_json::{json, Value};

use crate::detect::NoDetectors;
use crate::doctor::{check, Consumer, Destination, MachineFacts, Severity};
use crate::files::{read_beneath, select_source, Source};
use crate::migrate::{self, MigrateOptions, MigrationReport};
use crate::relocate::{self, Held, MoveRequest};
use crate::schema::Schemas;
use crate::scope::SourceKind;
use crate::session::session_class;
use crate::snapshot::SnapshotRequest;
use crate::snapshot::{snapshot, split_global, Context, SessionClass, SnapshotError};
use crate::standard::Standard;
use crate::write::{commit, refresh, Edit, WriteRequest, WriteResult};
use crate::{inspect, machine, ConfigRefusal};

pub const CONFIG_READ_OPERATION_ID: &str = "config.read";
pub const CONFIG_WRITE_OPERATION_ID: &str = "config.write";
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &[
    "show",
    "explain",
    "standard",
    "check",
    "set",
    "unset",
    "patch",
    "migrate",
    "refresh-docs",
];
const LOCK_WAIT_MS: u64 = 5_000;
const MACHINE_CHECK: &str = "\nconfirm that no release on this machine reads accounts or the gateway token from ~/.fgos/config.json, then pass --machine-checked";

const fn descriptor(
    id: &'static str,
    request: &'static str,
    outcome: &'static str,
) -> ProviderDescriptor {
    ProviderDescriptor {
        provider_id: Cow::Borrowed(id),
        operation_id: OperationId::from_static(id),
        component_class: Cow::Borrowed("config"),
        mechanism: Cow::Borrowed("builtin"),
        lifecycle: ProviderLifecycle::Singleton,
        request_contract: ContractRef::from_static(request, "1.0.0"),
        outcome_contract: ContractRef::from_static(outcome, "1.0.0"),
        allowed_hosts: &["cli"],
        allowed_modes: &["sync"],
        capabilities: &[],
        replacement: None,
        concurrency: None,
        health: None,
    }
}

pub const CONFIG_READ_DESCRIPTOR: ProviderDescriptor =
    descriptor("config.read", "config.read.request", "config.read.outcome");
pub const CONFIG_WRITE_DESCRIPTOR: ProviderDescriptor = descriptor(
    "config.write",
    "config.write.request",
    "config.write.outcome",
);

/// What the caller asked `fgos config` for; paths are in the text form of YAML Document.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Verb {
    Show {
        path: Option<String>,
    },
    Explain {
        path: String,
    },
    Standard {
        path: Option<String>,
    },
    Check,
    Set {
        path: String,
        value: String,
        reason: String,
        global: bool,
    },
    Unset {
        path: String,
        reason: String,
        global: bool,
        acknowledge: bool,
    },
    Patch {
        file: PathBuf,
        reason: String,
        global: bool,
    },
    Migrate {
        global: bool,
        finish: bool,
        machine_checked: bool,
        accept_machine_overrides: bool,
        dry_run: bool,
    },
    RefreshDocs {
        global: bool,
    },
}

/// `root`: the project the verb runs for (`--dir` or the nearest `.fgos`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConfigRequest {
    pub root: PathBuf,
    pub verb: Verb,
}

impl ConfigRequest {
    /// The operation (and so the authority policy) this request runs under: a dry run only reads.
    pub fn operation_id(&self) -> &'static str {
        match self.verb {
            Verb::Show { .. }
            | Verb::Explain { .. }
            | Verb::Standard { .. }
            | Verb::Check
            | Verb::Migrate { dry_run: true, .. } => CONFIG_READ_OPERATION_ID,
            _ => CONFIG_WRITE_OPERATION_ID,
        }
    }
}

/// An answer that carries its own exit code: `check` prints its findings and fails on a `fail` row.
#[derive(Debug, Clone, PartialEq)]
pub struct ConfigOutcome {
    pub data: Value,
    pub exit: i32,
}

fn refuse(reason: &'static str, detail: impl Into<String>) -> Refusal {
    Refusal {
        candidates: Vec::new(),
        reason,
        detail: detail.into(),
    }
}

/// Every refusal of the error, one line each (id, file, path, position; never a value).
fn refused(error: impl Into<SnapshotError>) -> Refusal {
    match error.into() {
        SnapshotError::Refused(list) => {
            let mut detail = list
                .iter()
                .map(ToString::to_string)
                .collect::<Vec<_>>()
                .join("\n");
            if list
                .iter()
                .any(|r| r.code == "config-machine-check-required")
            {
                detail.push_str(MACHINE_CHECK);
            }
            refuse(list.first().map_or("config-refused", |r| r.code), detail)
        }
        SnapshotError::Io(error) => refuse("config-io", error.to_string()),
    }
}

fn path_arg(text: &str) -> Result<Vec<Segment>, Refusal> {
    parse_path(text).map_err(|r| refuse("path-invalid", format!("{text}: {}", r.rule)))
}

/// The bundled schemas and standard, loaded once per verb.
struct Bundle {
    schemas: Schemas,
    standard: Standard,
    digest: String,
}

impl Bundle {
    fn load() -> Result<Bundle, Refusal> {
        let (schemas, digest) = Schemas::bundled().map_err(refused)?;
        let standard = Standard::bundled(&schemas).map_err(refused)?;
        Ok(Bundle {
            schemas,
            standard,
            digest,
        })
    }

    /// No detection yet: a detected key shows as absent until the PATH probe lands.
    fn ctx(&self) -> Context<'_> {
        Context {
            schemas: &self.schemas,
            standard: &self.standard,
            digest: &self.digest,
            detectors: &NoDetectors,
        }
    }
}

/// The roots of a verb: the project, its trusted main checkout, `~/.fgos` and the session class.
fn roots(root: &Path) -> Result<SnapshotRequest, Refusal> {
    let home = std::env::var("HOME").ok().filter(|h| !h.trim().is_empty());
    let home = home.ok_or_else(|| {
        refuse(
            "home-unset",
            "HOME is not set; the global directory is ~/.fgos",
        )
    })?;
    let canonical = |p: &Path| {
        std::fs::canonicalize(p)
            .map_err(|e| refuse("project-root-unreadable", format!("{}: {e}", p.display())))
    };
    let git = |e: OperationError| refuse("git-read-failed", e.cause);
    let project_root = canonical(root)?;
    let driver = GitDriver::new(&fgos_holder_lock::state_root::state_root().0).map_err(git)?;
    let trusted_root = match driver
        .resolve_repo(&project_root, &project_root)
        .map_err(git)?
    {
        ResolveRepo::Repository(repo) => canonical(repo.trusted_main_root())?,
        _ => project_root.clone(),
    };
    let class = session_class(|key| std::env::var(key).ok());
    Ok(SnapshotRequest {
        project_root,
        trusted_root,
        global_dir: PathBuf::from(home).join(".fgos"),
        class,
    })
}

fn optional_path(path: &Option<String>) -> Result<Vec<Segment>, Refusal> {
    path.as_deref().map_or(Ok(Vec::new()), path_arg)
}

fn read(bundle: &Bundle, roots: &SnapshotRequest, verb: &Verb) -> Result<ConfigOutcome, Refusal> {
    let ctx = bundle.ctx();
    let data = match verb {
        Verb::Show { path } => {
            let snap = snapshot(&ctx, roots).map_err(refused)?;
            inspect::show(&ctx, &snap, &optional_path(path)?)
        }
        Verb::Explain { path } => {
            let snap = snapshot(&ctx, roots);
            let mut out = inspect::explain(&ctx, snap.as_ref().ok(), &path_arg(path)?);
            if let Err(error) = snap {
                out["snapshotRefused"] = json!(refused(error).detail.lines().collect::<Vec<_>>());
            }
            out
        }
        Verb::Standard { path: None } => inspect::standard_files(&ctx),
        Verb::Standard { path: Some(text) } => inspect::standard_fragment(&ctx, &path_arg(text)?)
            .map_err(refused)?
            .ok_or_else(|| {
                refuse(
                    "path-not-in-standard",
                    format!("the standard has no fragment for {text}"),
                )
            })?,
        Verb::Check => return run_check(&ctx, roots),
        _ => unreachable!("write verbs are routed to config.write"),
    };
    Ok(ConfigOutcome { data, exit: 0 })
}

fn run_check(ctx: &Context, roots: &SnapshotRequest) -> Result<ConfigOutcome, Refusal> {
    let global = &roots.global_dir;
    // A file that does not read is the parse row's finding, so the move plan is empty then.
    let destinations = relocate::plan(ctx, global)
        .unwrap_or_default()
        .into_iter()
        .map(|p| {
            let state = match p.destination {
                Held::Missing => Destination::Absent,
                Held::Equal => Destination::Equal,
                Held::Differs => Destination::Different,
            };
            (p.path, state)
        });
    let facts = MachineFacts {
        modes: machine::modes(global).map_err(refused)?,
        machine_files: machine::token::read(global)
            .err()
            .map(|e| refused(e).detail),
        destinations: destinations.collect(),
    };
    let findings = check(ctx, roots, &facts, SystemTime::now());
    let failing = |f: &crate::doctor::Finding| f.severity(Consumer::Check) == Severity::Fail;
    let ok = !findings.iter().any(failing);
    let rows = findings.iter().map(|f| {
        json!({
            "row": f.row, "severity": if failing(f) { "fail" } else { "warn" }, "file": f.file,
            "line": f.line, "column": f.column, "path": f.path, "fix": f.fix, "detail": f.detail,
        })
    });
    Ok(ConfigOutcome {
        data: json!({ "ok": ok, "findings": rows.collect::<Vec<_>>() }),
        exit: if ok { 0 } else { Refusal::EXIT },
    })
}

/// The file a key lives in: an accounts key in the accounts file, a `global-only` key in the global
/// file, anything else in the project (or, for a `both` key, the global file with `--global`).
fn target_of(bundle: &Bundle, path: &[Segment], global: bool) -> Result<SourceKind, Refusal> {
    let chosen = if global {
        SourceKind::Global
    } else {
        SourceKind::Project
    };
    let Some(node) = bundle.schemas.resolve(path) else {
        return Ok(chosen);
    };
    match (node.file, node.scope) {
        ("token", _) => Err(refuse(
            "token-not-settable",
            "the gateway token is its own file, not a config key",
        )),
        ("accounts", _) => Ok(SourceKind::Accounts),
        (_, "global-only") => Ok(SourceKind::Global),
        (_, "project-only") if global => Err(refuse(
            "scope-project-only",
            format!(
                "{} is project-only; --global cannot target it",
                format_path(path)
            ),
        )),
        _ => Ok(chosen),
    }
}

fn file_of(kind: SourceKind) -> &'static str {
    match kind {
        SourceKind::Project => ".fgos/config.yaml",
        SourceKind::Global => "~/.fgos/config.yaml",
        SourceKind::Accounts => "~/.fgos/private/accounts.yaml",
    }
}

/// The revision of the open file the edits are computed against; none when it does not exist.
fn revision(roots: &SnapshotRequest, kind: SourceKind) -> Result<Option<String>, SnapshotError> {
    let max = Profile::StrictConfig.limits().input_bytes;
    let (parent, dir) = split_global(&roots.global_dir)?;
    let (base, dir) = match kind {
        SourceKind::Project => (roots.project_root.as_path(), Path::new(".fgos")),
        _ => (parent, dir),
    };
    if kind == SourceKind::Accounts {
        return Ok(read_beneath(base, &dir.join("private/accounts.yaml"), max)?.map(|f| f.revision));
    }
    match select_source(base, dir, max)? {
        Source::Absent => Ok(None),
        Source::Yaml(file) => Ok(Some(file.revision)),
        Source::LegacyJson(_) => Err(ConfigRefusal::new("config-format-legacy-json").into()),
    }
}

fn request(
    roots: &SnapshotRequest,
    kind: SourceKind,
    edits: Vec<Edit>,
    reason: &str,
    ack: bool,
) -> Result<WriteRequest, Refusal> {
    Ok(WriteRequest {
        roots: roots.clone(),
        lock_root: fgos_holder_lock::state_root::lock_root(),
        target: kind,
        expected: revision(roots, kind).map_err(refused)?,
        edits,
        reason: reason.to_string(),
        acknowledge_comment_loss: ack,
        lock_wait_ms: LOCK_WAIT_MS,
    })
}

fn written(kind: SourceKind, done: &WriteResult) -> Value {
    json!({
        "target": file_of(kind), "writer": done.writer_id, "revision": done.new_revision,
        "applied": done.applied.iter().map(|(p, unset)| json!({"path": p, "unset": unset})).collect::<Vec<_>>(),
        "notices": done.notices.iter().map(|(id, p)| json!({"id": id, "path": p})).collect::<Vec<_>>(),
        "nothingToDo": done.applied.is_empty(),
    })
}

/// `<value>` as one YAML scalar or flow value under strict-config.
fn value_arg(text: &str) -> Result<Value, Refusal> {
    let bad = |why: &str| {
        refuse(
            "value-invalid",
            format!("the value is not a YAML scalar or flow value ({why})"),
        )
    };
    match text.trim() {
        "" => Err(bad("empty; quote an empty string")),
        text => parse(text.as_bytes(), Profile::StrictConfig, "value")
            .and_then(|doc| doc.to_json())
            .map_err(|r| bad(r.rule)),
    }
}

/// A YAML or JSON list of `{set, value}` / `{unset}` items, at most the strict-config input size.
fn patch_edits(file: &Path) -> Result<Vec<Edit>, Refusal> {
    let max = Profile::StrictConfig.limits().input_bytes;
    let bad = |why: String| refuse("patch-invalid", why);
    let mut bytes = Vec::new();
    let opened = std::fs::File::open(file).map_err(|e| bad(format!("{}: {e}", file.display())))?;
    opened
        .take(max as u64 + 1)
        .read_to_end(&mut bytes)
        .map_err(|e| bad(e.to_string()))?;
    if bytes.len() > max {
        return Err(bad(format!(
            "{} is larger than {max} bytes",
            file.display()
        )));
    }
    let list = parse(&bytes, Profile::StrictConfig, "patch").and_then(|doc| doc.to_json());
    let list = list.map_err(|r| bad(format!("does not parse ({})", r.rule)))?;
    let items = list.as_array().filter(|items| !items.is_empty());
    let items = items.ok_or_else(|| bad("expected a non-empty list".into()))?;
    items
        .iter()
        .enumerate()
        .map(|(i, item)| {
            let (set, unset) = (item.get("set"), item.get("unset"));
            let size = item.as_object().map_or(0, |m| m.len());
            match (
                set.and_then(Value::as_str),
                unset.and_then(Value::as_str),
                item.get("value"),
            ) {
                (Some(path), None, Some(value)) if size == 2 => Ok(Edit::Set {
                    path: path_arg(path)?,
                    value: value.clone(),
                }),
                (None, Some(path), None) if size == 1 => Ok(Edit::Unset {
                    path: path_arg(path)?,
                }),
                _ => Err(bad(format!(
                    "item {i}: expected {{set, value}} or {{unset}}"
                ))),
            }
        })
        .collect()
}

fn edited_path(edit: &Edit) -> &[Segment] {
    match edit {
        Edit::Set { path, .. } | Edit::Unset { path } => path,
        Edit::Docs => &[],
    }
}

fn migration(report: &MigrationReport) -> Value {
    json!({
        "kept": report.kept, "unknownKept": report.unknown_kept, "droppedRedundant": report.dropped_redundant,
        "droppedRetired": report.dropped_retired, "droppedOutOfScope": report.dropped_out_of_scope,
        "docConverted": report.doc_converted, "machineOverrides": report.machine_overrides,
        "backup": report.backup, "resumed": report.resumed, "alreadyMigrated": report.already_migrated,
        "dryRun": report.dry_run,
    })
}

fn write(bundle: &Bundle, roots: &SnapshotRequest, verb: &Verb) -> Result<Value, Refusal> {
    let ctx = bundle.ctx();
    let dry = matches!(verb, Verb::Migrate { dry_run: true, .. });
    // Refused before any file is opened (spec section 6); the transaction refuses it again itself.
    if roots.class == SessionClass::Confined && !dry {
        return Err(refused(ConfigRefusal::new("config-write-confined")));
    }
    let writer = resolve_current(None);
    let one = |kind: SourceKind, edits, reason: &str, ack| -> Result<Value, Refusal> {
        let done =
            commit(&ctx, &request(roots, kind, edits, reason, ack)?, &writer).map_err(refused)?;
        Ok(written(kind, &done))
    };
    match verb {
        Verb::Set {
            path,
            value,
            reason,
            global,
        } => {
            let path = path_arg(path)?;
            let kind = target_of(bundle, &path, *global)?;
            one(
                kind,
                vec![Edit::Set {
                    path,
                    value: value_arg(value)?,
                }],
                reason,
                false,
            )
        }
        Verb::Unset {
            path,
            reason,
            global,
            acknowledge,
        } => {
            let path = path_arg(path)?;
            let kind = target_of(bundle, &path, *global)?;
            one(kind, vec![Edit::Unset { path }], reason, *acknowledge)
        }
        Verb::Patch {
            file,
            reason,
            global,
        } => {
            let edits = patch_edits(file)?;
            let kinds: Result<Vec<_>, _> = edits
                .iter()
                .map(|e| target_of(bundle, edited_path(e), *global))
                .collect();
            let kinds = kinds?;
            if kinds.iter().any(|k| *k != kinds[0]) {
                return Err(refuse(
                    "patch-spans-files",
                    "the edits belong to different files; one patch writes one file",
                ));
            }
            one(kinds[0], edits, reason, false)
        }
        Verb::Migrate {
            global: false,
            accept_machine_overrides,
            dry_run,
            ..
        } => {
            let opts = MigrateOptions {
                accept_machine_overrides: *accept_machine_overrides,
                dry_run: *dry_run,
                lock_root: fgos_holder_lock::state_root::lock_root(),
                lock_wait_ms: LOCK_WAIT_MS,
            };
            let report =
                migrate::project(&ctx, roots, &writer, &opts, |_| Ok(())).map_err(refused)?;
            Ok(migration(&report))
        }
        Verb::Migrate {
            global: true,
            dry_run: true,
            ..
        } => {
            let pending = relocate::plan(&ctx, &roots.global_dir).map_err(refused)?;
            let held = |h: Held| match h {
                Held::Missing => "missing",
                Held::Equal => "equal",
                Held::Differs => "differs",
            };
            let rows = pending.iter().map(|p| json!({"path": p.path, "entries": p.entries, "destination": held(p.destination)}));
            Ok(json!({ "dryRun": true, "pending": rows.collect::<Vec<_>>() }))
        }
        Verb::Migrate {
            global: true,
            finish,
            machine_checked,
            ..
        } => {
            let req = MoveRequest {
                roots: roots.clone(),
                lock_root: fgos_holder_lock::state_root::lock_root(),
                lock_wait_ms: LOCK_WAIT_MS,
            };
            let moved = match finish {
                true => relocate::finish(&ctx, &req, *machine_checked, |_| Ok(())),
                false => relocate::copy(&ctx, &req, &writer, |_| Ok(())),
            };
            let moved = moved.map_err(refused)?;
            Ok(
                json!({ "stage": if *finish { "finish" } else { "copy" }, "paths": moved.paths, "reformatted": moved.reformatted }),
            )
        }
        Verb::RefreshDocs { global } => {
            let kinds = if *global {
                vec![SourceKind::Global, SourceKind::Accounts]
            } else {
                vec![SourceKind::Project]
            };
            let (mut files, mut skipped) = (Vec::new(), Vec::new());
            for kind in kinds {
                match revision(roots, kind) {
                    Err(SnapshotError::Refused(r))
                        if r.iter().any(|x| x.code == "config-format-legacy-json") =>
                    {
                        skipped.push(file_of(kind));
                        continue;
                    }
                    other => other.map_err(refused)?,
                };
                let done = refresh(
                    &ctx,
                    request(roots, kind, Vec::new(), "", false)?,
                    &writer,
                    |_| Ok(()),
                )
                .map_err(refused)?;
                files.push(json!({ "file": file_of(kind), "changed": done.applied.len() }));
            }
            let nothing = files.iter().all(|f| f["changed"] == 0);
            Ok(json!({ "files": files, "skippedLegacyJson": skipped, "nothingToDo": nothing }))
        }
        _ => unreachable!("read verbs are routed to config.read"),
    }
}

fn answer(req: &ConfigRequest) -> Result<ConfigOutcome, Refusal> {
    let (bundle, roots) = (Bundle::load()?, roots(&req.root)?);
    match req.verb {
        Verb::Show { .. } | Verb::Explain { .. } | Verb::Standard { .. } | Verb::Check => {
            read(&bundle, &roots, &req.verb)
        }
        _ => Ok(ConfigOutcome {
            data: write(&bundle, &roots, &req.verb)?,
            exit: 0,
        }),
    }
}

#[derive(Debug, Clone)]
pub struct ConfigProvider {
    descriptor: ProviderDescriptor,
}

impl ConfigProvider {
    /// The provider of one of this component's two descriptors.
    pub fn for_descriptor(descriptor: ProviderDescriptor) -> Self {
        Self { descriptor }
    }
}

impl OperationProvider for ConfigProvider {
    fn descriptor(&self) -> &ProviderDescriptor {
        &self.descriptor
    }

    fn invoke<'a>(
        &'a self,
        _invocation: &'a HostInvocation,
        request: OperationRequest,
        _control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>> {
        Box::pin(async move {
            events.record_event(&format!("{}.invoked", self.descriptor.operation_id));
            let request = request
                .input
                .downcast_ref::<ConfigRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not ConfigRequest".into())
                })?;
            let output: Box<dyn std::any::Any + Send> = match answer(request) {
                Ok(outcome) if outcome.exit == 0 => Box::new(JsonOutcome(outcome.data)),
                Ok(outcome) => Box::new(outcome),
                Err(refusal) => Box::new(refusal),
            };
            Ok(ProviderOutcome::completed(
                self.descriptor().outcome_contract.clone(),
                output,
            ))
        })
    }
}
