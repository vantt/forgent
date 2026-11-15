//! The host provider behind `fgos events sync|status|seal|export`: it resolves the clone's store authority
//! through the Event Store's own door (`fgos_event_store::resolve`), runs the one crate operation the verb names
//! and shapes the answer. It decides nothing about the store: sealing, publishing, status and export are the
//! crate's; the `eventStore` config section is the config crate's; the main checkout is Git's.
//!
//! A detached seal or publish child (`detached`, the registry's `eventStoreChild` shapes) reads its repository
//! through the same door but never creates a state root its owner tore down: a root that is gone answers
//! `{ skipped: "state root gone" }` and stays gone.
//!
//! Failures keep the Node CLI's text and exit: a verb's own validation is a categorised refusal (exit 4), every
//! other failure prints `fgos: <message>` and exits with the table's unexpected status. A failed child leaves one
//! `event-store-child` record through the invocation doors, whatever failed.

use std::borrow::Cow;
use std::future::Future;
use std::path::{Component, Path, PathBuf};
use std::pin::Pin;

use fgos_config::event_store::{EventStoreConfig, ReadError};
use fgos_config::snapshot::SnapshotError;
use fgos_event_store::{
    cursor::Cursor,
    diagnostics,
    errors::Error as StoreError,
    export::{export_jsonl, ExportRequest},
    fsio::OsFileSystem,
    identity::StoreIdentity,
    layout::{Layout, StreamId},
    lifecycle, refspec,
    resolve::{self, ResolveError},
    seal::{seal_checkpointed, SealRequest, Sealed},
    sync::{sync, SyncRequest, Synced},
};
use fgos_git::invocation_root::{resolve_invocation_root, RootPolicy, RootRequest};
use fgos_git::{OperationError, RepoHandle};
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome,
    OperationId, OperationProvider, OperationRequest, ProviderDescriptor, ProviderError,
    ProviderLifecycle, ProviderOutcome,
};
use serde_json::{json, Value};

pub const SYNC_OPERATION_ID: &str = "event-store.sync";
pub const STATUS_OPERATION_ID: &str = "event-store.status";
pub const SEAL_OPERATION_ID: &str = "event-store.seal";
pub const EXPORT_OPERATION_ID: &str = "event-store.export";

pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["sync", "status", "seal", "export"];

const fn descriptor(
    id: &'static str,
    request: &'static str,
    outcome: &'static str,
) -> ProviderDescriptor {
    ProviderDescriptor {
        provider_id: Cow::Borrowed(id),
        operation_id: OperationId::from_static(id),
        component_class: Cow::Borrowed("event-store"),
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

pub const SYNC_DESCRIPTOR: ProviderDescriptor = descriptor(
    SYNC_OPERATION_ID,
    "event-store.sync.request",
    "event-store.sync.outcome",
);
pub const STATUS_DESCRIPTOR: ProviderDescriptor = descriptor(
    STATUS_OPERATION_ID,
    "event-store.status.request",
    "event-store.status.outcome",
);
pub const SEAL_DESCRIPTOR: ProviderDescriptor = descriptor(
    SEAL_OPERATION_ID,
    "event-store.seal.request",
    "event-store.seal.outcome",
);
pub const EXPORT_DESCRIPTOR: ProviderDescriptor = descriptor(
    EXPORT_OPERATION_ID,
    "event-store.export.request",
    "event-store.export.outcome",
);

/// What the caller asked `fgos events` for. A flag the call did not name is `None`/`false`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Verb {
    Sync {
        remote: Option<String>,
        no_push: bool,
        opportunistic: bool,
    },
    Status {
        remote: Option<String>,
    },
    Seal {
        stream: Option<String>,
        history: Option<String>,
    },
    Export {
        out: Option<String>,
        stream: Option<String>,
        since: Option<String>,
    },
}

/// `root`: the project the verb runs for. `detached`: the call is a seal or publish child.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EventsRequest {
    pub root: PathBuf,
    pub verb: Verb,
    pub detached: bool,
}

impl EventsRequest {
    /// The operation (and so the authority policy) the request runs under.
    pub fn operation_id(&self) -> &'static str {
        match self.verb {
            Verb::Sync { .. } => SYNC_OPERATION_ID,
            Verb::Status { .. } => STATUS_OPERATION_ID,
            Verb::Seal { .. } => SEAL_OPERATION_ID,
            Verb::Export { .. } => EXPORT_OPERATION_ID,
        }
    }
}

/// The process facts a request reads: the state root, and the environment the config door reads.
pub struct Environment<'a> {
    pub state_root: PathBuf,
    pub lookup: &'a dyn Fn(&str) -> Option<String>,
}

type Refused = CategorisedRefusal;

fn validation(message: impl Into<String>) -> Refused {
    CategorisedRefusal::new("validation", message)
}

fn failed(message: impl Into<String>) -> Refused {
    CategorisedRefusal::unexpected(message)
}

fn store_failure(error: StoreError) -> Refused {
    failed(error.to_string())
}

/// A Git operation's refusal with every field the driver reports, as one JSON line: the text the Node addon
/// raises for it, so a caller reads the same message from either door.
fn operation_failure(e: &OperationError) -> String {
    json!({"code": e.code, "cause": e.cause, "retryable": e.retryable, "operationId": e.operation_id, "receipt": e.receipt, "exitCode": e.exit_code, "signal": e.signal, "stderr": e.stderr, "detail": e.detail}).to_string()
}

fn resolve_failure(error: ResolveError) -> Refused {
    failed(match &error {
        ResolveError::StateRootGone | ResolveError::NoRepository => error.code(),
        ResolveError::Git(e) => operation_failure(e),
        ResolveError::Machine(e) => e.to_string(),
    })
}

/// A config the `events` verbs refuse to act on: the section's own rule, or the refusal of a config file.
fn config_failure(error: ReadError) -> Refused {
    failed(match error {
        ReadError::HomeUnset => fgos_config::machine::HOME_UNSET_ID.to_owned(),
        ReadError::Invalid(invalid) => invalid.to_string(),
        ReadError::Snapshot(SnapshotError::Refused(list)) => format!(
            "event-store-config: {}",
            list.iter()
                .map(ToString::to_string)
                .collect::<Vec<_>>()
                .join("; ")
        ),
        ReadError::Snapshot(SnapshotError::Io(io)) => format!("event-store-config: {io}"),
    })
}

/// What a detached child answers when the state root it was started for is gone.
fn state_root_gone() -> Value {
    json!({"skipped": "state root gone"})
}

/// The authority of one resolved clone with its facts: everything an operation of the verb needs.
struct Open {
    driver: std::sync::Arc<fgos_git::GitDriver>,
    repo: std::sync::Arc<RepoHandle>,
    machine: String,
    layout: Layout,
    trusted_main: PathBuf,
    config: EventStoreConfig,
    /// The remote the verb acts on and the facts read for it.
    remote: String,
    facts: Value,
}

/// The store of the project at `root`, in the order the Node CLI reads it: the state root a detached child
/// must find, the main checkout, the repository and its facts, the `eventStore` section (strict: a refused file
/// is an error here), the publication remote's mappings, then the machine id. `None`: a detached child whose
/// state root is gone.
fn open(
    root: &Path,
    detached: bool,
    remote: Option<&str>,
    env: &Environment,
) -> Result<Option<Open>, Refused> {
    let state = env.state_root.as_path();
    match resolve::driver(state, detached) {
        Ok(_) => {}
        Err(ResolveError::StateRootGone) => return Ok(None),
        Err(other) => return Err(resolve_failure(other)),
    }
    let hint = resolve_invocation_root(&RootRequest {
        cwd: root,
        dir: None,
        policy: RootPolicy::MainCheckout,
        home: None,
    })
    .map_err(|refusal| failed(refusal.message))?
    .root;
    let (driver, repo) = match resolve::resolve_repo(root, state, &hint, detached) {
        Ok(pair) => pair,
        Err(ResolveError::StateRootGone) => return Ok(None),
        Err(other) => return Err(resolve_failure(other)),
    };
    let default_facts =
        diagnostics::facts(&driver, &repo, state, "origin").map_err(store_failure)?;
    let trusted_main = repo.trusted_main_root().to_path_buf();
    let config =
        EventStoreConfig::read_project(&trusted_main, env.lookup, true).map_err(config_failure)?;
    let remote = remote.map_or_else(|| config.remote.clone(), str::to_owned);
    let facts = if remote == "origin" {
        default_facts
    } else {
        diagnostics::facts(&driver, &repo, state, &remote).map_err(store_failure)?
    };
    refspec::mappings(&config.remote).map_err(store_failure)?;
    let resolved = match resolve::resolve(root, state, &trusted_main, detached) {
        Ok(resolved) => resolved,
        Err(ResolveError::StateRootGone) => return Ok(None),
        Err(other) => return Err(resolve_failure(other)),
    };
    let layout =
        Layout::from_common_dir(Some(resolved.repo.common_dir())).map_err(store_failure)?;
    Ok(Some(Open {
        driver: resolved.driver,
        repo: resolved.repo,
        machine: resolved.machine,
        layout,
        trusted_main,
        config,
        remote,
        facts,
    }))
}

fn synced_json(result: Synced) -> Value {
    json!({"mirrorsChanged": result.mirrors_changed, "warnings": result.warnings, "busy": result.busy})
}

fn sealed_json(result: Sealed) -> Value {
    json!({"segments": result.segments, "busy": result.busy, "lastSeq": result.last_seq, "checkpointError": result.checkpoint_error})
}

fn ensure_platform() -> Result<(), Refused> {
    if lifecycle::platform_supported() {
        Ok(())
    } else {
        Err(failed(lifecycle::UNSUPPORTED_PLATFORM))
    }
}

fn status_of(open: &Open, remote: &str) -> Result<Value, Refused> {
    diagnostics::status(
        &open.driver,
        &open.repo,
        &open.layout,
        &open.machine,
        remote,
    )
    .map_err(store_failure)
}

fn sync_verb(
    open: &Open,
    no_push: bool,
    opportunistic: bool,
    started_sec: u64,
) -> Result<Value, Refused> {
    let run = || {
        sync(
            &open.driver,
            &open.repo,
            SyncRequest {
                layout: &open.layout,
                machine: &open.machine,
                remote: &open.remote,
                no_push,
                opportunistic,
                held_ranks: &[],
                hot_lock_depth: 0,
            },
        )
    };
    if !opportunistic {
        let mut answer = synced_json(run().map_err(store_failure)?);
        answer["status"] = status_of(open, &open.remote)?;
        return Ok(answer);
    }
    // The background publish of a command's end trigger returns no status (it walks every ref and nobody reads
    // it) and answers a failed attempt as `{ error }` when the sync itself persisted that attempt, which
    // `event-store-incidents` and `events status` read. A failure before the sync could record its attempt (a
    // refused lock directory) is the child's error.
    match run() {
        Ok(result) => Ok(synced_json(result)),
        Err(error) => {
            let maintenance = diagnostics::maintenance(&open.layout).map_err(store_failure)?;
            let recorded = maintenance["lastAttempt"]["time"]
                .as_u64()
                .is_some_and(|time| time >= started_sec);
            if recorded {
                Ok(json!({"error": error.code.to_string()}))
            } else {
                Err(store_failure(error))
            }
        }
    }
}

fn status_verb(open: &Open) -> Result<Value, Refused> {
    let mut answer = status_of(open, &open.remote)?;
    let facts = &open.facts;
    let strings = |key: &str| -> Vec<&str> {
        facts[key]
            .as_array()
            .map(|all| all.iter().filter_map(Value::as_str).collect())
            .unwrap_or_default()
    };
    let fetched = strings("fetchRefspecs");
    let refspec_missing = facts["remoteFact"]["configured"] == json!(true)
        && strings("expectedFetchRefspecs")
            .iter()
            .any(|expected| !fetched.contains(expected));
    answer["remote"] = json!(open.remote);
    answer["remoteUrl"] = facts["remoteFact"]["url"].clone();
    answer["refspecMissing"] = json!(refspec_missing);
    answer["facts"] = facts.clone();
    Ok(answer)
}

/// `path.resolve` without the file system: `.` and `..` are folded away, a relative path starts at `base`.
fn resolve_lexically(base: &Path, path: &Path) -> PathBuf {
    let mut out = if path.is_absolute() {
        PathBuf::new()
    } else {
        base.to_path_buf()
    };
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                out.pop();
            }
            other => out.push(other.as_os_str()),
        }
    }
    out
}

fn seal_verb(open: &Open, stream: &StreamId, history: Option<&str>) -> Result<Value, Refused> {
    let cache_dir = format!(
        "{}{}",
        open.trusted_main.join(".fgos").join("cache").display(),
        std::path::MAIN_SEPARATOR
    );
    let checkpoint = match history {
        None => None,
        Some(history) => {
            let given = Path::new(history);
            let resolved = resolve_lexically(&open.trusted_main, given);
            if !given.is_absolute() || !resolved.to_string_lossy().starts_with(&cache_dir) {
                return Err(history_refusal(&cache_dir));
            }
            Some(resolved)
        }
    };
    match seal_checkpointed(
        &open.driver,
        &open.repo,
        SealRequest {
            layout: &open.layout,
            machine: &open.machine,
            stream,
            held_ranks: &[],
            hot_lock_depth: 0,
            opportunistic: false,
        },
        &OsFileSystem,
        checkpoint.as_deref(),
    ) {
        Ok(sealed) => Ok(sealed_json(sealed)),
        // Still busy after the bounded wait: the holder, or the next seal, certifies the backlog.
        Err(error) if error.code.to_string() == "event-store-lock-timeout" => {
            Ok(json!({"busy": true}))
        }
        Err(error) => Err(store_failure(error)),
    }
}

fn history_refusal(cache_dir: &str) -> Refused {
    validation(format!(
        "events seal --history must be a file under {cache_dir}"
    ))
}

fn export_verb(
    open: &Open,
    root: &Path,
    out: &str,
    stream: Option<&str>,
    since: Option<&str>,
) -> Result<Value, Refused> {
    let streams: Vec<String> = match stream {
        Some(stream) => vec![stream.to_owned()],
        None => status_of(open, &open.config.remote)?["streams"]
            .as_array()
            .map(|rows| {
                rows.iter()
                    .filter_map(|row| row["stream"].as_str().map(str::to_owned))
                    .collect()
            })
            .unwrap_or_default(),
    };
    let since = match since {
        None => Value::Null,
        Some(text) => serde_json::from_str::<Value>(text)
            .map_err(|_| validation("events export --since must be a cursor as JSON"))?,
    };
    let out = resolve_lexically(root, Path::new(out));
    let streams = streams
        .iter()
        .map(|name| StreamId::parse(name).map_err(store_failure))
        .collect::<Result<Vec<_>, _>>()?;
    let origin = if open.layout.store().exists() {
        StoreIdentity::open(&open.layout, &open.machine)
            .map_err(store_failure)?
            .store_id
    } else {
        String::new()
    };
    let since = if since.is_null() {
        Cursor::default()
    } else {
        let line = fgos_event_store::envelope::line(&since).map_err(store_failure)?;
        Cursor::parse(&line).map_err(store_failure)?
    };
    export_jsonl(
        open.driver.as_ref(),
        &open.repo,
        ExportRequest {
            layout: &open.layout,
            origin: &origin,
            machine: &open.machine,
            streams: &streams,
            since: &since,
            out: &out,
        },
    )
    .map_err(store_failure)
}

/// Runs one request: its own validation first, then the store.
pub fn answer(request: &EventsRequest, env: &Environment) -> Result<Value, Refused> {
    let started_sec = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |elapsed| elapsed.as_secs());
    match &request.verb {
        Verb::Seal { stream, history } => {
            let stream = stream
                .as_deref()
                .filter(|name| is_stream_name(name))
                .ok_or_else(|| validation("events seal requires --stream <name>"))?;
            ensure_platform()?;
            let Some(open) = open(&request.root, request.detached, None, env)? else {
                return Ok(state_root_gone());
            };
            let stream = StreamId::parse(stream).map_err(store_failure)?;
            seal_verb(&open, &stream, history.as_deref())
        }
        Verb::Export { out, stream, since } => {
            let out = out
                .as_deref()
                .filter(|out| !out.is_empty())
                .ok_or_else(|| failed("events export requires --out <dir>"))?;
            ensure_platform()?;
            let Some(open) = open(&request.root, request.detached, None, env)? else {
                return Ok(state_root_gone());
            };
            export_verb(
                &open,
                &request.root,
                out,
                stream.as_deref(),
                since.as_deref(),
            )
        }
        Verb::Sync {
            remote,
            no_push,
            opportunistic,
        } => {
            ensure_platform()?;
            let Some(open) = open(&request.root, request.detached, remote.as_deref(), env)? else {
                return Ok(state_root_gone());
            };
            sync_verb(&open, *no_push, *opportunistic, started_sec)
        }
        Verb::Status { remote } => {
            ensure_platform()?;
            let Some(open) = open(&request.root, request.detached, remote.as_deref(), env)? else {
                return Ok(state_root_gone());
            };
            status_verb(&open)
        }
    }
}

/// A stream name a seal accepts: lowercase letters, digits and dashes, starting with a letter.
fn is_stream_name(name: &str) -> bool {
    let mut chars = name.chars();
    chars.next().is_some_and(|first| first.is_ascii_lowercase())
        && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

/// The provider of the four operations.
pub struct EventsProvider {
    descriptor: ProviderDescriptor,
}

impl EventsProvider {
    pub fn for_descriptor(descriptor: ProviderDescriptor) -> Self {
        Self { descriptor }
    }
}

impl OperationProvider for EventsProvider {
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
                .downcast_ref::<EventsRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not EventsRequest".into())
                })?;
            let lookup = |key: &str| std::env::var(key).ok();
            let env = Environment {
                state_root: fgos_holder_lock::state_root().0,
                lookup: &lookup,
            };
            let output: Box<dyn std::any::Any + Send> = match answer(request, &env) {
                Ok(data) => Box::new(JsonOutcome(data)),
                Err(refusal) => Box::new(refusal),
            };
            Ok(ProviderOutcome::completed(
                self.descriptor().outcome_contract.clone(),
                output,
            ))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;

    fn none(_: &str) -> Option<String> {
        None
    }

    fn request(verb: Verb, root: &Path, detached: bool) -> EventsRequest {
        EventsRequest {
            root: root.to_path_buf(),
            verb,
            detached,
        }
    }

    fn tempdir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "fgos-events-wiring-{name}-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn refusal_of(result: Result<Value, Refused>) -> Refused {
        result.expect_err("the request is refused")
    }

    #[test]
    fn the_stream_name_is_the_one_the_seal_verb_accepts() {
        for ok in ["project", "work-1", "a"] {
            assert!(is_stream_name(ok), "{ok}");
        }
        for bad in ["", "Bad_1", "1x", "-x", "a b", "a:b"] {
            assert!(!is_stream_name(bad), "{bad}");
        }
    }

    #[test]
    fn a_seal_without_a_valid_stream_is_a_validation_refusal_before_any_store_is_read() {
        let root = tempdir("seal-invalid");
        let env = Environment {
            state_root: root.join("state"),
            lookup: &none,
        };
        for stream in [None, Some("Bad_1".to_owned())] {
            let seal = request(
                Verb::Seal {
                    stream,
                    history: None,
                },
                &root,
                true,
            );
            let refusal = refusal_of(answer(&seal, &env));
            assert_eq!(refusal.category, "validation");
            assert_eq!(refusal.message, "events seal requires --stream <name>");
        }
        assert!(
            !root.join("state").exists(),
            "a refusal creates no state root"
        );
    }

    #[test]
    fn an_export_without_a_destination_fails_as_the_node_cli_does() {
        let root = tempdir("export-out");
        let env = Environment {
            state_root: root.join("state"),
            lookup: &none,
        };
        for out in [None, Some(String::new())] {
            let export = request(
                Verb::Export {
                    out,
                    stream: None,
                    since: None,
                },
                &root,
                false,
            );
            let refusal = refusal_of(answer(&export, &env));
            assert_eq!(refusal.category, "unexpected");
            assert_eq!(refusal.message, "events export requires --out <dir>");
            assert_eq!(
                refusal.exit_code(),
                fgos_host_runtime::exit_codes::unexpected()
            );
        }
    }

    #[test]
    fn a_relative_path_is_resolved_against_the_project_and_dots_are_folded() {
        let base = Path::new("/p/repo");
        assert_eq!(
            resolve_lexically(base, Path::new("out/./x/../y")),
            Path::new("/p/repo/out/y")
        );
        assert_eq!(
            resolve_lexically(base, Path::new("/a/b/../c")),
            Path::new("/a/c")
        );
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn a_detached_child_whose_state_root_is_gone_skips_and_leaves_the_root_gone() {
        let root = tempdir("gone");
        let state = root.join("state");
        let env = Environment {
            state_root: state.clone(),
            lookup: &none,
        };
        for verb in [
            Verb::Seal {
                stream: Some("project".into()),
                history: None,
            },
            Verb::Sync {
                remote: None,
                no_push: false,
                opportunistic: true,
            },
        ] {
            let call = request(verb, &root, true);
            assert_eq!(answer(&call, &env).unwrap(), state_root_gone());
            assert!(!state.exists(), "the child never rebuilds the root");
        }
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn a_foreground_call_in_no_repository_names_the_missing_repository() {
        let root = tempdir("norepo");
        let env = Environment {
            state_root: root.join("state"),
            lookup: &none,
        };
        let status = request(Verb::Status { remote: None }, &root, false);
        assert_eq!(
            refusal_of(answer(&status, &env)).message,
            "event-store-no-repository"
        );
    }

    #[cfg(target_os = "linux")]
    fn repository(name: &str) -> (PathBuf, PathBuf) {
        let root = tempdir(name);
        let repo = root.join("repo");
        std::fs::create_dir_all(&repo).unwrap();
        for args in [
            vec!["init", "-q", "-b", "main"],
            vec!["config", "user.name", "t"],
            vec!["config", "user.email", "t@example.com"],
        ] {
            assert!(Command::new("git")
                .args(&args)
                .current_dir(&repo)
                .status()
                .unwrap()
                .success());
        }
        // The machine id the Identity component mints for every project the setup prepared.
        let state = root.join("state");
        std::fs::create_dir_all(&state).unwrap();
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&state, std::fs::Permissions::from_mode(0o700)).unwrap();
        }
        fgos_identity::machine::mint(&state, "testbox").unwrap();
        (state, repo)
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn status_of_a_fresh_repository_adds_the_remote_and_the_facts_to_the_crate_status() {
        let (state, repo) = repository("status");
        let lookup = |key: &str| (key == "HOME").then(|| repo.to_string_lossy().into_owned());
        let env = Environment {
            state_root: state,
            lookup: &lookup,
        };
        let data = answer(&request(Verb::Status { remote: None }, &repo, false), &env).unwrap();
        for key in [
            "streams",
            "integrityErrors",
            "remote",
            "remoteUrl",
            "refspecMissing",
            "facts",
        ] {
            assert!(data.get(key).is_some(), "status carries {key}: {data}");
        }
        assert_eq!(data["remote"], json!("origin"));
        assert_eq!(data["remoteUrl"], Value::Null);
        assert_eq!(data["refspecMissing"], json!(false));
        assert_eq!(data["facts"]["remote"], json!("origin"));
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn a_seal_history_outside_the_cache_is_refused_naming_the_cache() {
        let (state, repo) = repository("history");
        let lookup = |key: &str| (key == "HOME").then(|| repo.to_string_lossy().into_owned());
        let env = Environment {
            state_root: state,
            lookup: &lookup,
        };
        for history in ["/tmp/elsewhere.json", "relative.json"] {
            let seal = request(
                Verb::Seal {
                    stream: Some("project".into()),
                    history: Some(history.into()),
                },
                &repo,
                true,
            );
            let refusal = refusal_of(answer(&seal, &env));
            assert_eq!(refusal.category, "validation");
            assert!(
                refusal
                    .message
                    .starts_with("events seal --history must be a file under ")
                    && refusal.message.ends_with("/.fgos/cache/"),
                "{}",
                refusal.message
            );
        }
    }
}
