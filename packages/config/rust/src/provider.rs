//! The host provider behind `fgos config` (spec section 11): the read verbs (`config.read`) and
//! the write verbs (`config.write`). A verb only resolves roots, calls the crate and shapes the
//! answer: every write goes through `write::commit`, `migrate` or `relocate`; no code here opens a
//! config file for writing. The session class comes from the `FGOS_CONFINED` marker, which is
//! information for a polite refusal and never a boundary (`session.rs`). No answer carries a value.
//!
//! The write verbs and `check` need the write door and the findings engine, which are Unix only
//! (`unix_verbs`); elsewhere they answer `config-platform-unsupported`, and the read verbs run as far
//! as the file read path does.

use std::borrow::Cow;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;

use fgos_git::{GitDriver, OperationError};
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome,
};
use fgos_identity::Refusal;
use fgos_yaml_doc::path::parse_path;
use fgos_yaml_doc::{rule, Segment};
use serde_json::{json, Value};

use crate::detect::NoDetectors;
use crate::inspect;
use crate::schema::Schemas;
use crate::session::session_class;
use crate::snapshot::{snapshot, Context, SnapshotError, SnapshotRequest};
use crate::standard::Standard;

#[cfg(unix)]
mod unix_verbs;
/// Where the write verbs and `check` cannot run: they refuse, naming the platform.
#[cfg(not(unix))]
mod unix_verbs {
    use super::{refused, Bundle, ConfigOutcome, Refusal, SnapshotRequest, Verb};
    use crate::ConfigRefusal;

    pub(super) fn run(_: &Bundle, _: &SnapshotRequest, _: &Verb) -> Result<ConfigOutcome, Refusal> {
        Err(refused(ConfigRefusal::new("config-platform-unsupported")))
    }
}

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
/// The variable the home directory comes from.
const HOME_VAR: &str = if cfg!(unix) { "HOME" } else { "USERPROFILE" };
/// Appended to a refusal that has a way out: the refusal id or YAML rule it answers, and the hint.
const HINTS: [(&str, &str); 2] = [
    (
        "config-machine-check-required",
        "\nconfirm that no release on this machine reads accounts or the gateway token from ~/.fgos/config.json, then pass --machine-checked",
    ),
    (
        rule::COMMENT_WOULD_BE_LOST,
        "\nthe edit would drop a comment of the file; to apply it anyway pass --acknowledge-comment-loss (`unset` takes it)",
    ),
];

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
        /// With `global`: convert the global JSON file to YAML instead of moving the keys.
        convert: bool,
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

/// Every refusal of the error, one line each (id, file, path, position; never a value), then the
/// hint of each way out it names.
fn refused(error: impl Into<SnapshotError>) -> Refusal {
    match error.into() {
        SnapshotError::Refused(list) => {
            let answers = |id: &str, r: &crate::ConfigRefusal| {
                r.code == id || r.yaml.as_ref().is_some_and(|y| y.rule == id)
            };
            let hints = HINTS
                .iter()
                .filter(|(id, _)| list.iter().any(|r| answers(id, r)));
            let lines = list.iter().map(ToString::to_string).collect::<Vec<_>>();
            let detail = lines.join("\n") + &hints.map(|(_, hint)| *hint).collect::<String>();
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
    let home = std::env::var(HOME_VAR)
        .ok()
        .filter(|h| !h.trim().is_empty());
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
    let trusted_root = match GitDriver::trusted_root_at(&project_root).map_err(git)? {
        Some(root) => canonical(&root)?,
        None => project_root.clone(),
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
        _ => unreachable!("write verbs are routed to config.write"),
    };
    Ok(ConfigOutcome { data, exit: 0 })
}

fn answer(req: &ConfigRequest) -> Result<ConfigOutcome, Refusal> {
    let (bundle, roots) = (Bundle::load()?, roots(&req.root)?);
    match req.verb {
        Verb::Show { .. } | Verb::Explain { .. } | Verb::Standard { .. } => {
            read(&bundle, &roots, &req.verb)
        }
        _ => unix_verbs::run(&bundle, &roots, &req.verb),
    }
}

/// The effective value at `path` (text form, e.g. `eventStore.remote`) for the
/// project at `root`: project over global over the standard, as `config show`
/// prints it. `None` when no layer sets it. For host code that needs one
/// setting in process, so none reads the config files itself.
pub fn effective_value(root: &Path, path: &str) -> Result<Option<Value>, Refusal> {
    let request = ConfigRequest { root: root.to_owned(), verb: Verb::Show { path: Some(path.to_owned()) } };
    let shown = answer(&request)?.data;
    Ok(shown["present"].as_bool().filter(|present| *present).and_then(|_| shown.get("value").cloned()).filter(|value| !value.is_null()))
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
