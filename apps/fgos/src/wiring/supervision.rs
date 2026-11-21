//! The host provider behind `fgos watcher tick`, `fgos supervisor wake|plans|queue|handled|done`, `fgos land` and
//! `fgos slots`: it resolves the project, reads the config values the verbs take (`watcher.*`, `supervisor.maxLeads`,
//! `land.*`, `workerSlots.ceiling`) through the config door, builds the ports of the `fgos-supervision` crate and
//! calls it. It decides nothing: detection, the queue, the wake rule, the landing and the lane view are the crates'.
//!
//! Ports that name an adapter in the plan run the host's own verbs (`metrics query --def`, `questions`,
//! `session start`, `mailbox send`) as child processes of this binary, so each verb keeps one door; the rest are
//! in-process reads of the owner (Identity directory, Git door, Event Store, the question store).

use super::agents::PayloadRoot;
use crate::routing::Call;
use fgos_config::provider::effective_value;
use fgos_git::{
    GitDriver, Inspect, Oid, PathValue, RefName, RefValue, RemoteGrant, RepoHandle, TrunkFact,
};
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome, VerbAnswer,
};
use fgos_observe::record::store::RecordDoor;
use fgos_observe::record::types::{AttrValue, Basis, Origin, Record, SubjectRef, RECORD_VERSION};
use fgos_supervision::land::{land, LandCommand, LandPorts, ShellRunner};
use fgos_supervision::notify::MailboxNotifier;
use fgos_supervision::portfolio::{self, Plan};
use fgos_supervision::queue::{Queue, QueueError, Raised, RaisedEvent};
use fgos_supervision::{supervisor, wake, watcher};
use serde_json::{json, Value};
use std::borrow::Cow;
use std::collections::BTreeMap;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

pub const TICK_OPERATION_ID: &str = "watcher.tick";
pub const SUPERVISOR_READ_OPERATION_ID: &str = "supervisor.read";
pub const SUPERVISOR_WRITE_OPERATION_ID: &str = "supervisor.write";
pub const LAND_OPERATION_ID: &str = "land.run";
pub const SLOTS_OPERATION_ID: &str = "slots.read";

/// The sub-commands `fgos watcher` serves.
pub const WATCHER_SUBCOMMANDS: &[&str] = &["tick", "tune"];
/// The sub-commands `fgos supervisor` serves.
pub const SUPERVISOR_SUBCOMMANDS: &[&str] = &["wake", "plans", "queue", "handled", "raise", "done"];
/// The sub-commands of `fgos session` the host serves itself; `start`, `rotate`, `stop` and `write` stay in the payload.
pub const SESSION_SUBCOMMANDS: &[&str] = &["read", "type"];

/// The pace definition: any row means the project has live work (`core/watcher/pace`).
pub const PACE_DEFINITION: &str = "core/watcher/pace/watcher-active.query.json";

const fn descriptor(
    id: &'static str,
    request: &'static str,
    outcome: &'static str,
) -> ProviderDescriptor {
    ProviderDescriptor {
        provider_id: Cow::Borrowed(id),
        operation_id: OperationId::from_static(id),
        component_class: Cow::Borrowed("supervision"),
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

pub const TICK_DESCRIPTOR: ProviderDescriptor = descriptor(
    TICK_OPERATION_ID,
    "watcher.tick.request",
    "watcher.tick.outcome",
);
pub const SUPERVISOR_READ_DESCRIPTOR: ProviderDescriptor = descriptor(
    SUPERVISOR_READ_OPERATION_ID,
    "supervisor.read.request",
    "supervisor.read.outcome",
);
pub const SUPERVISOR_WRITE_DESCRIPTOR: ProviderDescriptor = descriptor(
    SUPERVISOR_WRITE_OPERATION_ID,
    "supervisor.write.request",
    "supervisor.write.outcome",
);
pub const LAND_DESCRIPTOR: ProviderDescriptor =
    descriptor(LAND_OPERATION_ID, "land.run.request", "land.run.outcome");
pub const SLOTS_DESCRIPTOR: ProviderDescriptor = descriptor(
    SLOTS_OPERATION_ID,
    "slots.read.request",
    "slots.read.outcome",
);

/// What the caller asked for. `root` is the project the doors resolved.
#[derive(Debug, Clone)]
pub struct SupervisionRequest {
    pub root: PathBuf,
    pub verb: Verb,
    pub json: bool,
}

#[derive(Debug, Clone)]
pub enum Verb {
    Tick,
    Wake,
    Plans,
    Queue,
    Handled { ids: Vec<String> },
    Raise(RaiseCommand),
    Done,
    Land(LandCommand),
    Slots,
    Tune(TuneCommand),
    SessionRead { target: String, lines: u32 },
    SessionType { target: String, text: String },
}

/// `supervisor raise`: one coordination event for the queue.
#[derive(Debug, Clone)]
pub struct RaiseCommand {
    pub kind: String,
    pub subject: String,
    pub reason: String,
    pub next: String,
}

/// `watcher tune`: arm or disarm one definition and set numeric watcher settings.
#[derive(Debug, Clone)]
pub struct TuneCommand {
    /// The definition (row kind) and the action it is routed to (`wake-supervisor` armed, `none` disarmed).
    pub action: Option<(String, &'static str)>,
    /// `(key under watcher, integer value)`.
    pub settings: Vec<(String, i64)>,
}

impl SupervisionRequest {
    /// The operation (and so the authority policy) the request runs under.
    pub fn operation_id(&self) -> &'static str {
        match self.verb {
            Verb::Tick => TICK_OPERATION_ID,
            Verb::Wake
            | Verb::Handled { .. }
            | Verb::Raise(_)
            | Verb::Tune(_)
            | Verb::SessionType { .. } => SUPERVISOR_WRITE_OPERATION_ID,
            Verb::Plans | Verb::Queue | Verb::Done | Verb::SessionRead { .. } => {
                SUPERVISOR_READ_OPERATION_ID
            }
            Verb::Land(_) => LAND_OPERATION_ID,
            Verb::Slots => SLOTS_OPERATION_ID,
        }
    }
}

fn validation(message: impl Into<String>) -> CategorisedRefusal {
    CategorisedRefusal::new("validation", message)
}

/// A refusal the crates name by code: `<detail> [<code>]`, the exit category the code carries.
fn refused(code: &str, detail: impl std::fmt::Display) -> CategorisedRefusal {
    let message = format!("{detail} [{code}]");
    match code {
        "events-unhandled" | "land-gate-missing" | "target-not-stuck" => {
            CategorisedRefusal::new("precondition", message)
        }
        "event-unknown" | "session-not-found" => CategorisedRefusal::new("not-found", message),
        "bad-event" => CategorisedRefusal::new("validation", message),
        _ => CategorisedRefusal::unexpected(message),
    }
}

fn queue_refusal(error: QueueError) -> CategorisedRefusal {
    refused(error.code, error.detail)
}

// ---------------------------------------------------------------------------------------------
// Reading a call

/// `fgos watcher tick`, `supervisor <sub> [ids]`, `land [<branch>] [--paths a,b] ...` and `slots`, read with the
/// shared parser. A flag a verb does not take was refused before this runs.
pub fn project_request(
    operation: &str,
    args: &[std::ffi::OsString],
    root: PathBuf,
) -> Result<SupervisionRequest, CategorisedRefusal> {
    let call = Call::new(args);
    let json = call.switch("json").map_err(validation)?;
    let selector = args
        .first()
        .map(|a| a.to_string_lossy().into_owned())
        .unwrap_or_default();
    let verb = match selector.as_str() {
        "watcher" => match call.sub_word() {
            Some("tune") => Verb::Tune(tune_command(&call)?),
            _ => Verb::Tick,
        },
        "session" => session_verb(&call)?,
        "supervisor" => match call.sub_word() {
            Some("raise") => Verb::Raise(RaiseCommand {
                kind: named_value(&call, "kind")?,
                subject: named_value(&call, "ref")?,
                reason: named_value(&call, "reason")?,
                next: call.value("next").map_err(validation)?.unwrap_or_default(),
            }),
            Some("wake") => Verb::Wake,
            Some("plans") => Verb::Plans,
            Some("queue") => Verb::Queue,
            Some("done") => Verb::Done,
            Some("handled") => {
                let ids = call.arguments();
                if ids.is_empty() {
                    return Err(validation("supervisor handled needs one or more event ids"));
                }
                Verb::Handled { ids }
            }
            other => {
                return Err(validation(format!(
                    "unknown supervisor subcommand {}. Available: {}",
                    other.unwrap_or(""),
                    SUPERVISOR_SUBCOMMANDS.join(", ")
                )))
            }
        },
        "land" => Verb::Land(land_command(&call)?),
        _ if operation == SLOTS_OPERATION_ID => Verb::Slots,
        other => return Err(validation(format!("no supervision verb named {other}"))),
    };
    Ok(SupervisionRequest { root, verb, json })
}

fn named_value(call: &Call, name: &str) -> Result<String, CategorisedRefusal> {
    call.value(name)
        .map_err(validation)?
        .filter(|v| !v.is_empty())
        .ok_or_else(|| validation(format!("--{name} is required")))
}

/// The row kind a definition is named by.
fn valid_definition(name: &str) -> bool {
    let mut chars = name.chars();
    chars.next().is_some_and(|c| c.is_ascii_lowercase())
        && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

/// The watcher settings no `watcher tune` touches: the machine switch, the definition list, the actions (which only
/// `--arm|--disarm` write) and the notify target.
const UNTUNABLE: &[&str] = &[
    "enabled",
    "definitions",
    "defaultAction",
    "actions",
    "notifyTo",
];

fn tune_command(call: &Call) -> Result<TuneCommand, CategorisedRefusal> {
    let (arm, disarm) = (
        call.switch("arm").map_err(validation)?,
        call.switch("disarm").map_err(validation)?,
    );
    if arm && disarm {
        return Err(validation("--arm and --disarm exclude each other"));
    }
    let words = call.arguments();
    let action = match (words.as_slice(), arm || disarm) {
        ([], false) => None,
        ([definition], true) if valid_definition(definition) => Some((
            definition.clone(),
            if arm { "wake-supervisor" } else { "none" },
        )),
        ([definition], true) => {
            return Err(validation(format!(
                "{definition} is not a definition name (lowercase letters, digits and hyphens)"
            )))
        }
        ([_], false) => return Err(validation("a definition needs --arm or --disarm")),
        ([], true) => return Err(validation("--arm and --disarm need a definition")),
        _ => return Err(validation("watcher tune takes at most one definition")),
    };
    let mut settings = Vec::new();
    for item in list_of(call, "set")? {
        let (key, value) = item
            .split_once('=')
            .ok_or_else(|| validation(format!("--set needs key=value, got {item}")))?;
        if key.is_empty() || !key.chars().all(|c| c.is_ascii_alphanumeric()) {
            return Err(validation(format!("{key} is not a watcher setting name")));
        }
        if UNTUNABLE.contains(&key) {
            return Err(validation(format!("watcher.{key} is not tunable")));
        }
        let value = value
            .parse::<i64>()
            .map_err(|_| validation(format!("--set {key} needs a whole number, got {value}")))?;
        settings.push((key.to_owned(), value));
    }
    if action.is_none() && settings.is_empty() {
        return Err(validation(
            "watcher tune needs a definition with --arm or --disarm, or --set key=value",
        ));
    }
    Ok(TuneCommand { action, settings })
}

/// Lines `session read` shows when the call names none.
const DEFAULT_READ_LINES: u32 = 50;
/// The most text `session type` sends in one call.
const MAX_TYPED_BYTES: usize = 4096;

fn session_verb(call: &Call) -> Result<Verb, CategorisedRefusal> {
    let sub = call.sub_word();
    let words = call.arguments();
    let [target] = words.as_slice() else {
        return Err(validation(format!(
            "session {} takes one target (a role, handle or slot key)",
            sub.unwrap_or("")
        )));
    };
    match sub {
        Some("read") => {
            let lines = match call.value("lines").map_err(validation)? {
                None => DEFAULT_READ_LINES,
                Some(text) => text.parse::<u32>().ok().filter(|n| *n > 0).ok_or_else(|| {
                    validation(format!("--lines needs a positive number, got {text}"))
                })?,
            };
            Ok(Verb::SessionRead {
                target: target.clone(),
                lines,
            })
        }
        Some("type") => {
            let text = named_value(call, "text")?;
            if text.len() > MAX_TYPED_BYTES {
                return Err(validation(format!(
                    "--text is over {MAX_TYPED_BYTES} bytes"
                )));
            }
            Ok(Verb::SessionType {
                target: target.clone(),
                text,
            })
        }
        other => Err(validation(format!(
            "unknown session subcommand {}. The host serves: {}",
            other.unwrap_or(""),
            SESSION_SUBCOMMANDS.join(", ")
        ))),
    }
}

/// The list a flag carries: one value per use, each split on commas (the way the request route writes them).
fn list_of(call: &Call, name: &str) -> Result<Vec<String>, CategorisedRefusal> {
    use fgos_host_runtime::cli_args::{FlagScalar, FlagValue};
    let words = |text: &str| {
        text.split(',')
            .filter(|w| !w.is_empty())
            .map(str::to_owned)
            .collect::<Vec<_>>()
    };
    match call.flags().flag(name) {
        None => Ok(Vec::new()),
        Some(FlagValue::One(FlagScalar::Str(text))) => Ok(words(text)),
        Some(FlagValue::Many(items)) => Ok(items
            .iter()
            .filter_map(|item| match item {
                FlagScalar::Str(text) => Some(words(text)),
                FlagScalar::Bool => None,
            })
            .flatten()
            .collect()),
        Some(_) => Err(validation(format!("--{name} needs a value"))),
    }
}

fn land_command(call: &Call) -> Result<LandCommand, CategorisedRefusal> {
    let positional = call.flags().positional.clone();
    let branch = match (
        positional.as_slice(),
        call.value("branch").map_err(validation)?,
    ) {
        ([], flag) => flag,
        ([one], None) => Some(one.clone()),
        _ => return Err(validation("land takes one branch")),
    };
    let paths = list_of(call, "paths")?;
    let paths = (!paths.is_empty()).then_some(paths);
    if branch.is_some() == paths.is_some() {
        return Err(validation("land needs exactly one of a branch and --paths"));
    }
    let footprint = list_of(call, "footprint")?;
    let message = call.value("message").map_err(validation)?;
    if paths.is_some() && message.is_none() {
        return Err(validation("land --paths needs --message"));
    }
    Ok(LandCommand {
        message: message.unwrap_or_else(|| format!("land {}", branch.as_deref().unwrap_or(""))),
        branch,
        paths,
        tests: list_of(call, "test")?,
        footprint: (!footprint.is_empty()).then_some(footprint),
        target: call.value("target").map_err(validation)?,
        squash: call.switch("squash").map_err(validation)?,
    })
}

// ---------------------------------------------------------------------------------------------
// The project: config, identity, git, state files

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_secs() as i64)
}

fn iso_of(secs: i64) -> String {
    fgos_identity::text::iso_utc(secs.max(0) as u64, 0)
}

fn config_value(root: &Path, key: &str) -> Option<Value> {
    effective_value(root, key).ok().flatten()
}

fn config_int(root: &Path, key: &str, default: i64) -> i64 {
    config_value(root, key)
        .and_then(|v| v.as_i64())
        .unwrap_or(default)
}

fn config_strings(root: &Path, key: &str) -> Vec<String> {
    config_value(root, key)
        .and_then(|v| v.as_array().cloned())
        .map(|items| {
            items
                .iter()
                .filter_map(|i| i.as_str().map(str::to_owned))
                .collect()
        })
        .unwrap_or_default()
}

fn action_of(word: &str) -> Option<watcher::Action> {
    match word {
        "wake-supervisor" => Some(watcher::Action::WakeSupervisor),
        "notify" => Some(watcher::Action::Notify),
        "none" => Some(watcher::Action::None),
        _ => None,
    }
}

pub fn watcher_settings(root: &Path) -> watcher::Settings {
    let actions = config_value(root, "watcher.actions")
        .and_then(|v| v.as_object().cloned())
        .map(|map| {
            map.iter()
                .filter_map(|(kind, word)| Some((kind.clone(), action_of(word.as_str()?)?)))
                .collect()
        })
        .unwrap_or_default();
    watcher::Settings {
        active_interval_sec: config_int(root, "watcher.activeIntervalSec", 60),
        idle_interval_sec: config_int(root, "watcher.idleIntervalSec", 900),
        lookback_sec: config_int(root, "watcher.lookbackSec", 86_400),
        definitions: config_strings(root, "watcher.definitions"),
        pace_definition: PACE_DEFINITION.to_owned(),
        default_action: config_value(root, "watcher.defaultAction")
            .and_then(|v| action_of(v.as_str()?))
            .unwrap_or(watcher::Action::WakeSupervisor),
        actions,
    }
}

pub fn wake_settings(root: &Path) -> wake::Settings {
    wake::Settings {
        active_interval_sec: config_int(root, "watcher.activeIntervalSec", 60),
        idle_interval_sec: config_int(root, "watcher.idleIntervalSec", 900),
        overdue_factor: config_int(root, "watcher.overdueFactor", 3),
        wake_failure_limit: u32::try_from(config_int(root, "watcher.wakeFailureLimit", 3))
            .unwrap_or(3),
    }
}

fn state_dir(root: &Path, name: &str) -> PathBuf {
    root.join(".fgos").join("runtime").join(name)
}

fn read_json(path: &Path) -> Option<Value> {
    serde_json::from_slice(&std::fs::read(path).ok()?).ok()
}

fn write_json(dir: &Path, file: &str, value: &Value) -> Result<(), String> {
    std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    let bytes = serde_json::to_vec(value).map_err(|e| e.to_string())?;
    fgos_durable_file::replace_durably(dir, file, &bytes)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

/// The writer this process records as.
fn writer() -> String {
    fgos_identity::resolve::resolve_current().id.to_string()
}

fn host_binary() -> PathBuf {
    std::env::current_exe().unwrap_or_else(|_| PathBuf::from("fgos"))
}

struct Clock;
impl watcher::Clock for Clock {
    fn now(&self) -> i64 {
        now_secs()
    }
}
impl wake::Clock for Clock {
    fn now(&self) -> i64 {
        now_secs()
    }
}

/// The trunk tip's plans, read through the Git door: `plans/<dir>/plan.md` at the project trunk.
struct HostPortfolio {
    root: PathBuf,
}

impl HostPortfolio {
    fn read(&self) -> Result<Vec<Plan>, String> {
        self.read_with_refusals().map(|(plans, _)| plans)
    }

    /// The plans the supervisor can read, and the ones it cannot: a plan that breaks its contract is skipped and
    /// named, never a reason to hide the rest.
    fn read_with_refusals(&self) -> Result<(Vec<Plan>, Vec<Value>), String> {
        let Some((driver, repo)) = GitDriver::open_at(&self.root).map_err(|e| e.cause)? else {
            return Err("not a repository".to_owned());
        };
        let tip = trunk_tip(&driver, &repo)?;
        let mut files: Vec<(String, Vec<u8>)> = Vec::new();
        let mut cursor = None;
        loop {
            let page = driver
                .list_tree(&repo, &tip, b"plans/", cursor, 10_000)
                .map_err(|e| e.cause)?;
            for entry in &page.entries {
                let path = String::from_utf8_lossy(&entry.path).into_owned();
                let parts: Vec<&str> = path.split('/').collect();
                if parts.len() == 3 && parts[2] == "plan.md" {
                    files.push((parts[1].to_owned(), entry.path.clone()));
                }
            }
            match page.next_cursor {
                Some(next) if !page.complete => cursor = Some(next),
                _ => break,
            }
        }
        let paths: Vec<Vec<u8>> = files.iter().map(|(_, p)| p.clone()).collect();
        let reads = driver
            .read_paths_at(&repo, &tip, &paths, 256 * 1024)
            .map_err(|e| e.cause)?;
        let mut plans: Vec<Plan> = Vec::new();
        let mut refused: Vec<Value> = Vec::new();
        for ((dir, _), read) in files.iter().zip(reads) {
            let PathValue::Blob(bytes) = read.value else {
                continue;
            };
            let Ok(text) = String::from_utf8(bytes) else {
                refused.push(
                    json!({"dir": dir, "code": "plan-not-utf8", "detail": "plan.md is not UTF-8"}),
                );
                continue;
            };
            match portfolio::read_plan(dir, &text) {
                Ok(plan) => plans.push(plan),
                Err(why) => {
                    refused.push(json!({"dir": dir, "code": why.code(), "detail": why.to_string()}))
                }
            }
        }
        portfolio::order(&mut plans);
        Ok((plans, refused))
    }

    fn done(plans: &[Plan]) -> Vec<String> {
        plans
            .iter()
            .filter(|p| p.status == "done")
            .map(|p| p.dir.clone())
            .collect()
    }
}

fn trunk_tip(driver: &GitDriver, repo: &RepoHandle) -> Result<Oid, String> {
    let named = match driver.resolve_trunk(repo, None).map_err(|e| e.cause)? {
        TrunkFact::Known { trunk, .. } => Some(trunk),
        _ => None,
    };
    if let Some(name) = named {
        if let RefValue::Direct(oid) = driver.resolve_ref(repo, &name).map_err(|e| e.cause)? {
            return Ok(oid);
        }
    }
    match driver.resolve_head(repo).map_err(|e| e.cause)? {
        fgos_git::HeadFact::Attached { commit, .. } | fgos_git::HeadFact::Detached { commit } => {
            Ok(commit)
        }
        fgos_git::HeadFact::Unborn { .. } => Err("the repository has no commit".to_owned()),
    }
}

impl watcher::Portfolio for HostPortfolio {
    fn counts(&self) -> Result<(u64, u64), String> {
        let plans = self.read()?;
        let count = |status: &str| plans.iter().filter(|p| p.status == status).count() as u64;
        Ok((count("ready"), count("running")))
    }
}

impl wake::Portfolio for HostPortfolio {
    fn plans(&self) -> Result<Vec<Plan>, String> {
        self.read()
    }
    fn done_dirs(&self) -> Result<Vec<String>, String> {
        Ok(Self::done(&self.read()?))
    }
}

/// This project's id and handle, from Identity.
struct HostProject {
    root: PathBuf,
}

impl wake::Project for HostProject {
    fn project(&self) -> Option<wake::ProjectInfo> {
        let (state, _) = fgos_holder_lock::state_root();
        fgos_identity::project_info(&state, &self.root)
            .ok()
            .map(|info| wake::ProjectInfo {
                id: info.id,
                handle: info.handle,
            })
    }
}

/// The sessions holding roles on this machine, through Identity's directory.
fn role_holders() -> Result<Vec<fgos_identity::directory::Listed>, ()> {
    let (state, _) = fgos_holder_lock::state_root();
    fgos_identity::directory::list(&state, None, false, &fgos_process::facts::judge_here, None)
        .map(|listed| listed.sessions)
        .map_err(|_| ())
}

struct HostIdentity;
impl wake::Identity for HostIdentity {
    fn holder(&self, role: &str) -> wake::Holder {
        let Ok(sessions) = role_holders() else {
            return wake::Holder::Unknown;
        };
        match sessions.iter().find(|s| s.roles.iter().any(|r| r == role)) {
            None => wake::Holder::NotLive,
            Some(s) if matches!(s.liveness, fgos_identity::Liveness::Unknown) => {
                wake::Holder::Unknown
            }
            Some(s) => wake::Holder::Live {
                project_id: s.project_id.clone().unwrap_or_default(),
            },
        }
    }
}

/// Starts a head with the host's own verb: `<host> session start <persona> --name <name> --json`.
struct HostStart {
    root: PathBuf,
}

impl wake::StartSession for HostStart {
    fn start(&self, persona: &str, name: &str) -> Result<(), String> {
        let out = Command::new(host_binary())
            .args(["session", "start", persona, "--name", name, "--json"])
            .current_dir(&self.root)
            .stdin(Stdio::null())
            .output()
            .map_err(|e| format!("session-start-unavailable: {e}"))?;
        if out.status.success() {
            return Ok(());
        }
        let line = String::from_utf8_lossy(&out.stdout);
        let code = serde_json::from_str::<Value>(line.trim())
            .ok()
            .and_then(|v| v["code"].as_str().map(str::to_owned))
            .unwrap_or_else(|| format!("session-start-exit-{}", out.status.code().unwrap_or(-1)));
        Err(code)
    }
}

/// Stops a head with the host's own verb (`<host> session stop <persona> --name <name> --json`) and reads its
/// activity from the terminal host's agent status plus the head's running request tickets.
struct HostStop {
    root: PathBuf,
}

/// A head's request tickets: `Busy` when one is still `running`, `Unknown` when the directory or a ticket cannot be
/// read (never read as "no ticket"), `None` when there is no ticket directory or no running ticket.
fn tickets_activity(dir: &Path) -> Option<wake::Activity> {
    let entries = match std::fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return None,
        Err(_) => return Some(wake::Activity::Unknown),
    };
    let mut unreadable = false;
    for entry in entries {
        let Ok(entry) = entry else {
            unreadable = true;
            continue;
        };
        match std::fs::read(entry.path())
            .ok()
            .and_then(|b| serde_json::from_slice::<Value>(&b).ok())
        {
            Some(ticket) if ticket["state"] == "running" => return Some(wake::Activity::Busy),
            Some(_) => {}
            None => unreadable = true,
        }
    }
    unreadable.then_some(wake::Activity::Unknown)
}

/// The terminal host's answer for the head's pane: only a live pane whose agent status is `idle` is idle.
fn pane_activity(pane_live: bool, agent_status: Option<&str>) -> wake::Activity {
    match (pane_live, agent_status) {
        (true, Some("idle")) => wake::Activity::Idle,
        (true, Some("working" | "blocked")) => wake::Activity::Busy,
        _ => wake::Activity::Unknown,
    }
}

/// A head's activity from its lineage under `root`: tickets first, then its placement, then `pane` (the terminal
/// host's view of that placement).
fn head_activity(
    root: &Path,
    lineage: &str,
    pane: impl FnOnce(&fgos_session_host::Placement, &Path) -> wake::Activity,
) -> wake::Activity {
    match tickets_activity(&root.join(".fgos/runtime/head-tickets").join(lineage)) {
        Some(wake::Activity::Busy) => return wake::Activity::Busy,
        Some(other) => return other,
        None => {}
    }
    let file = root
        .join(".fgos/runtime/session-rotation")
        .join(lineage)
        .join("placement.json");
    let Some(value) = std::fs::read(file)
        .ok()
        .and_then(|b| serde_json::from_slice::<Value>(&b).ok())
    else {
        return wake::Activity::Unknown;
    };
    let Ok(placement) =
        serde_json::from_value::<fgos_session_host::Placement>(value["placement"].clone())
    else {
        return wake::Activity::Unknown;
    };
    pane(
        &placement,
        Path::new(value["runDir"].as_str().unwrap_or_default()),
    )
}

fn host_pane_activity(placement: &fgos_session_host::Placement, run_dir: &Path) -> wake::Activity {
    let backend = fgos_run_supervisor::terminal_slot::Backend::from_env(run_dir);
    let core = backend.core();
    let seen = fgos_session_host::Panes::inspect(
        &core,
        &placement.key,
        fgos_terminal_control::core::Want {
            foreground: false,
            activity: true,
            detail: false,
        },
    );
    let live = seen.pane == fgos_terminal_control::port::PaneState::Live;
    pane_activity(live, seen.activity.as_ref().map(|a| a.state.as_str()))
}

impl wake::StopSession for HostStop {
    fn activity(&self, persona: &str, name: &str) -> wake::Activity {
        head_activity(&self.root, &format!("{persona}-{name}"), host_pane_activity)
    }

    fn stop(&self, persona: &str, name: &str) -> Result<(), String> {
        let out = Command::new(host_binary())
            .args(["session", "stop", persona, "--name", name, "--json"])
            .current_dir(&self.root)
            .stdin(Stdio::null())
            .output()
            .map_err(|e| format!("session-stop-unavailable: {e}"))?;
        if out.status.success() {
            return Ok(());
        }
        let line = String::from_utf8_lossy(&out.stdout);
        Err(serde_json::from_str::<Value>(line.trim())
            .ok()
            .and_then(|v| v["code"].as_str().map(str::to_owned))
            .unwrap_or_else(|| format!("session-stop-exit-{}", out.status.code().unwrap_or(-1))))
    }
}

struct WakeLogFile {
    root: PathBuf,
}

impl wake::WakeLog for WakeLogFile {
    fn load(&self) -> wake::WakeState {
        let Some(v) = read_json(&state_dir(&self.root, "supervision").join("wake.json")) else {
            return wake::WakeState::default();
        };
        wake::WakeState {
            last_attempt: v["lastAttempt"].as_i64(),
            failures: v["failures"].as_u64().unwrap_or(0) as u32,
        }
    }

    fn save(&self, state: wake::WakeState) -> Result<(), String> {
        write_json(
            &state_dir(&self.root, "supervision"),
            "wake.json",
            &json!({"lastAttempt": state.last_attempt, "failures": state.failures}),
        )
    }
}

/// The asker of an answered question, read from the owner-question store.
struct StoreAskers {
    root: PathBuf,
}

impl supervisor::Askers for StoreAskers {
    fn asker(&self, question_id: &str) -> Option<supervisor::Asker> {
        use fgos_questions::store::{fold, LogOpener};
        let log = super::questions::HostLogOpener::reader()
            .open(&self.root)
            .ok()??;
        let folded = fold(&log.read().ok()?);
        let question = folded.get(question_id)?;
        let asker = &question.asked.asker;
        let role = asker.head_roles().next()?.clone();
        let persona = asker.persona.clone()?;
        Some(supervisor::Asker { role, persona })
    }
}

fn open_queue(root: &Path) -> Result<Queue, CategorisedRefusal> {
    let clone = super::event_store_clone::open(root)
        .map_err(|f| refused(f.reason, f.detail))?
        .ok_or_else(|| {
            refused(
                "event-store-no-repository",
                "there is no repository to hold the queue",
            )
        })?;
    Queue::open(&clone.layout, &clone.machine, &writer()).map_err(queue_refusal)
}

// ---------------------------------------------------------------------------------------------
// Telemetry: one record per tick and per wake, through the Observe write door

fn record_door(root: &Path, payload_root: PayloadRoot) -> RecordDoor {
    RecordDoor::new(
        root.to_path_buf(),
        super::observe_declarations::embedded_declarations(),
        payload_root().ok(),
    )
}

fn span_record(
    kind: &str,
    subject: SubjectRef,
    attrs: Vec<(&'static str, String)>,
    measures: Vec<(&'static str, u64)>,
) -> Record {
    Record {
        v: RECORD_VERSION,
        id: String::new(),
        kind: kind.to_owned(),
        ts: fgos_observe::time::now_iso(),
        end_ts: None,
        subject,
        refs: Vec::new(),
        attrs: attrs
            .into_iter()
            .map(|(k, v)| (k.to_owned(), AttrValue::Str(v)))
            .collect(),
        measures: measures
            .into_iter()
            .map(|(k, v)| (k.to_owned(), v.into()))
            .collect::<BTreeMap<_, _>>(),
        basis: Basis::Observed,
        origin: Origin {
            source: "supervision".to_owned(),
            component: Some("host".to_owned()),
            host: Some(fgos_process::facts::host()),
            ..Origin::default()
        },
        detail: None,
        redaction: None,
    }
}

struct HostTelemetry {
    root: PathBuf,
    payload_root: PayloadRoot,
}

impl watcher::Telemetry for HostTelemetry {
    fn emit(&self, span: &watcher::Span) {
        let record = span_record(
            span.name,
            SubjectRef {
                kind: "session".to_owned(),
                id: writer(),
            },
            span.attrs.iter().map(|(k, v)| (*k, v.clone())).collect(),
            span.measures.clone(),
        );
        // The write door counts its own failures; a lost span never changes the tick's outcome.
        let _ = record_door(&self.root, self.payload_root).write(record);
    }
}

impl wake::Telemetry for HostTelemetry {
    fn emit(&self, span: &wake::WakeSpan) {
        let subject = if span.subject.is_empty() {
            SubjectRef {
                kind: "session".to_owned(),
                id: writer(),
            }
        } else {
            SubjectRef {
                kind: "event".to_owned(),
                id: span.subject.clone(),
            }
        };
        let record = span_record(
            span.name,
            subject,
            vec![
                ("fgos.supervisor.trigger", span.trigger.clone()),
                ("fgos.supervisor.outcome", span.outcome.to_owned()),
            ],
            Vec::new(),
        );
        let _ = record_door(&self.root, self.payload_root).write(record);
    }
}

// ---------------------------------------------------------------------------------------------
// The watcher tick's own ports

struct TickFiles {
    root: PathBuf,
}

impl watcher::TickState for TickFiles {
    fn load(&self) -> Result<watcher::State, String> {
        let v = read_json(&state_dir(&self.root, "watcher").join("state.json"))
            .ok_or_else(|| "no readable tick state".to_owned())?;
        Ok(watcher::State {
            last_tick: v["lastTick"].as_i64(),
            last_full_tick: v["lastFullTick"].as_i64(),
        })
    }

    fn save(&self, state: watcher::State) -> Result<(), String> {
        write_json(
            &state_dir(&self.root, "watcher"),
            "state.json",
            &json!({"lastTick": state.last_tick, "lastFullTick": state.last_full_tick}),
        )
    }
}

/// The `watcher` repo lock; the guard releases it when dropped.
struct WatcherLock {
    root: PathBuf,
}

impl watcher::TickLock for WatcherLock {
    fn try_take(&self) -> Result<Option<Box<dyn std::any::Any>>, String> {
        use fgos_holder_lock::{acquire, Acquire, Mode, Resource, Wait};
        let dir = self.root.join(".fgos").join("locks");
        std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        match acquire(
            &Resource::new("watcher", dir.join("watcher.lock")),
            Mode::Ex,
            Wait::Try,
            0,
        ) {
            Acquire::Acquired(handle) => Ok(Some(Box::new(handle))),
            Acquire::Held { .. } | Acquire::Timeout { .. } => Ok(None),
            Acquire::Unavailable { reason, detail } => {
                Err(format!("{}: {detail}", reason.as_str()))
            }
        }
    }
}

/// Fetches the trunk's remote-tracking ref through the Git door.
struct FetchTrunk {
    root: PathBuf,
}

impl watcher::Fetch for FetchTrunk {
    fn fetch(&self) -> Result<(), String> {
        let (driver, repo) = GitDriver::open_at(&self.root)
            .map_err(|e| e.cause)?
            .ok_or_else(|| "not a repository".to_owned())?;
        let TrunkFact::Known { trunk, .. } =
            driver.resolve_trunk(&repo, None).map_err(|e| e.cause)?
        else {
            return Err("the trunk is not known".to_owned());
        };
        let branch = trunk
            .as_str()
            .strip_prefix("refs/heads/")
            .or_else(|| trunk.as_str().strip_prefix("refs/remotes/origin/"))
            .ok_or_else(|| format!("trunk {} is not a branch", trunk.as_str()))?
            .to_owned();
        let name = |text: String| RefName::parse(&text).map_err(|e| e.to_string());
        let mapping = fgos_git::RefMapping {
            source: name(format!("refs/heads/{branch}"))?,
            destination: name(format!("refs/remotes/origin/{branch}"))?,
        };
        let grant = RemoteGrant {
            name: "origin".to_owned(),
            pinned_url: Inspect::remote_url(&driver, &repo, "origin").map_err(|e| e.cause)?,
        };
        driver
            .fetch_refs(
                &repo,
                vec![],
                &grant,
                &[mapping],
                &writer(),
                &operation_id("fetch"),
            )
            .map(|_| ())
            .map_err(|e| e.cause)
    }
}

/// The detection definitions: `<host> metrics query --def <path>... --since <instant> --json`, mapped to rows.
struct QueryDefinitions {
    root: PathBuf,
    payload_root: PayloadRoot,
}

impl QueryDefinitions {
    /// Release- or repo-relative, as the attention view resolves its definitions: the release payload first, then
    /// the project, so a project may add its own.
    fn resolve(&self, path: &str) -> Option<PathBuf> {
        let given = Path::new(path);
        if given.is_absolute() {
            return given.exists().then(|| given.to_path_buf());
        }
        let payload = (self.payload_root)().ok().map(|root| root.join(path));
        [payload, Some(self.root.join(path))]
            .into_iter()
            .flatten()
            .find(|candidate| candidate.exists())
    }
}

impl QueryDefinitions {
    /// The answer of one `metrics query --def` call over `defs`, as the verb's JSON.
    fn answer(&self, defs: &[String], since: Option<i64>) -> Result<Value, String> {
        let mut command = Command::new(host_binary());
        command.args(["metrics", "query", "--json"]);
        for def in defs {
            let path = self
                .resolve(def)
                .ok_or_else(|| format!("{def} does not exist"))?;
            command.arg("--def").arg(path);
        }
        if let Some(since) = since {
            command.arg("--since").arg(iso_of(since));
        }
        let out = command
            .current_dir(&self.root)
            .stdin(Stdio::null())
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            return Err(String::from_utf8_lossy(&out.stderr).trim().to_owned());
        }
        let answer: Value = serde_json::from_slice(&out.stdout).map_err(|e| e.to_string())?;
        Ok(answer.get("data").cloned().unwrap_or(answer))
    }
}

impl watcher::Definitions for QueryDefinitions {
    fn exists(&self, path: &str) -> bool {
        self.resolve(path).is_some()
    }

    fn run(&self, defs: &[String], since: Option<i64>) -> Result<Vec<watcher::Row>, String> {
        if defs.is_empty() {
            return Ok(Vec::new());
        }
        let answer = self.answer(defs, since)?;
        // The pace definition has no `row` template: each group it answers is one row of liveness, not an event.
        if defs == [PACE_DEFINITION] {
            pace_rows_of(&answer)
        } else {
            rows_of(&answer)
        }
    }
}

/// The pace definitions the doctor reads: they carry no `row` template and are never raised, so each one that
/// answers a group says the watcher is late or a supervisor burned a start with nothing to do.
const PACE_ROW_DEFINITIONS: [&str; 2] = [
    "core/watcher/pace/watcher-overdue.query.json",
    "core/watcher/pace/supervisor-idle-burn.query.json",
];

/// The names of the pace definitions that answer a row now, or why they could not be run.
pub fn pace_findings(root: &Path, payload_root: PayloadRoot) -> Result<Vec<String>, String> {
    let defs: Vec<String> = PACE_ROW_DEFINITIONS
        .iter()
        .map(|d| (*d).to_owned())
        .collect();
    let answer = QueryDefinitions {
        root: root.to_path_buf(),
        payload_root,
    }
    .answer(&defs, None)?;
    Ok(answer["definitions"]
        .as_array()
        .into_iter()
        .flatten()
        .filter(|def| {
            def["rows"].as_array().is_some_and(|rows| {
                rows.iter()
                    .any(|r| r["insufficient"].as_bool() != Some(true))
            })
        })
        .filter_map(|def| def["name"].as_str().map(str::to_owned))
        .collect())
}

/// Whether the watcher is switched on for this project.
pub fn watcher_enabled(root: &Path) -> bool {
    config_value(root, "watcher.enabled") == Some(Value::Bool(true))
}

/// Whether `land.gates` names no gate (every `fgos land` then refuses `land-gate-missing`).
pub fn land_gates_empty(root: &Path) -> bool {
    config_value(root, "land.gates")
        .and_then(|v| v.as_array().map(Vec::is_empty))
        .unwrap_or(true)
}

/// How many events the watcher raised are still unhandled; `None` when the project has no repository to hold a queue.
pub fn unhandled_count(root: &Path) -> Result<Option<usize>, String> {
    let Some(clone) = super::event_store_clone::open(root).map_err(|f| f.detail)? else {
        return Ok(None);
    };
    let queue = Queue::open(&clone.layout, &clone.machine, &writer()).map_err(|e| e.to_string())?;
    queue.unhandled_count().map(Some).map_err(|e| e.to_string())
}

/// The rows of a `metrics query --def` answer, mapped as `core/watcher/README.md` ("Row to event") says: kind,
/// reason and next command from the definition's `row` template; subject from `origin.host` else `subject.id`;
/// instant from `min:ts`, else `max:end`, else `max:ts`.
pub fn rows_of(answer: &Value) -> Result<Vec<watcher::Row>, String> {
    rows_from(answer, false)
}

/// The groups a pace query answers, one row each, named by the definition: the watcher only counts them.
fn pace_rows_of(answer: &Value) -> Result<Vec<watcher::Row>, String> {
    rows_from(answer, true)
}

fn rows_from(answer: &Value, pace: bool) -> Result<Vec<watcher::Row>, String> {
    let definitions = answer["definitions"]
        .as_array()
        .ok_or_else(|| "the answer holds no definitions".to_owned())?;
    let text = |v: &Value| v.as_str().map(str::to_owned);
    let mut rows = Vec::new();
    for def in definitions {
        let template = &def["row"];
        let unmeasured = def.get("unmeasured").is_some_and(|v| !v.is_null())
            || def.get("error").is_some_and(|v| !v.is_null());
        if unmeasured {
            rows.push(watcher::Row {
                kind: text(&def["name"]).unwrap_or_default(),
                reason: String::new(),
                next_command: String::new(),
                subject: None,
                ts: None,
                unmeasured: true,
            });
            continue;
        }
        if !pace && !template.is_object() {
            continue;
        }
        for row in def["rows"].as_array().into_iter().flatten() {
            if row["insufficient"].as_bool() == Some(true) {
                continue;
            }
            let group = &row["group"];
            let aggs = &row["aggs"];
            rows.push(watcher::Row {
                kind: text(&template["kind"])
                    .or_else(|| pace.then(|| text(&def["name"])).flatten())
                    .unwrap_or_default(),
                reason: text(&template["reason"]).unwrap_or_default(),
                next_command: text(&template["nextCommand"]).unwrap_or_default(),
                subject: text(&group["origin.host"]).or_else(|| text(&group["subject.id"])),
                ts: ["min:ts", "max:end", "max:ts"]
                    .iter()
                    .find_map(|key| text(&aggs[*key])),
                unmeasured: false,
            });
        }
    }
    Ok(rows)
}

/// Refreshes the per-machine questions view by listing once: `<host> questions --json`.
struct QuestionsRefresh {
    root: PathBuf,
}

impl watcher::QuestionsView for QuestionsRefresh {
    fn refresh(&self) -> Result<(), String> {
        let status = Command::new(host_binary())
            .args(["questions", "--json"])
            .current_dir(&self.root)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map_err(|e| e.to_string())?;
        status
            .success()
            .then_some(())
            .ok_or_else(|| "questions failed".to_owned())
    }
}

/// The wake door, in process: the same ports `supervisor wake` runs on.
struct WakeInProcess {
    root: PathBuf,
    payload_root: PayloadRoot,
}

impl watcher::Wake for WakeInProcess {
    fn wake(&self, kind: &str, subject: &str) -> watcher::WakeOutcome {
        match run_wake(&self.root, self.payload_root, kind, subject) {
            Ok(outcome) => match outcome {
                wake::WakeOutcome::StartFailed(_)
                | wake::WakeOutcome::IdentityUnknown
                | wake::WakeOutcome::RoleHeldOtherProject
                | wake::WakeOutcome::ProjectIdMissing
                | wake::WakeOutcome::Backoff => watcher::WakeOutcome::Refused,
                _ => watcher::WakeOutcome::Woken,
            },
            Err(_) => watcher::WakeOutcome::Refused,
        }
    }

    fn stop_stuck(&self, subject: &str) -> watcher::StopOutcome {
        let outcome = with_wake_ports(&self.root, self.payload_root, |ports| {
            wake::stop_stuck(
                ports,
                wake::Trigger {
                    trigger: watcher::STUCK_KIND,
                    subject,
                },
            )
        });
        match outcome {
            Ok(wake::StuckOutcome::Stopped) => watcher::StopOutcome::Stopped,
            Ok(wake::StuckOutcome::Kept | wake::StuckOutcome::NotLive) => {
                watcher::StopOutcome::Kept
            }
            Ok(wake::StuckOutcome::Failed(_)) | Err(_) => watcher::StopOutcome::Refused,
        }
    }
}

fn run_wake(
    root: &Path,
    payload_root: PayloadRoot,
    trigger: &str,
    subject: &str,
) -> Result<wake::WakeOutcome, CategorisedRefusal> {
    with_wake_ports(root, payload_root, |ports| {
        wake::wake(
            ports,
            &wake_settings(root),
            wake::Trigger { trigger, subject },
        )
    })
}

/// Builds the wake door's real ports once and hands them to `run`.
fn with_wake_ports<T>(
    root: &Path,
    payload_root: PayloadRoot,
    run: impl FnOnce(&wake::Ports) -> T,
) -> Result<T, CategorisedRefusal> {
    let queue = open_queue(root)?;
    let project = HostProject {
        root: root.to_path_buf(),
    };
    let start = HostStart {
        root: root.to_path_buf(),
    };
    let stop = HostStop {
        root: root.to_path_buf(),
    };
    let portfolio = HostPortfolio {
        root: root.to_path_buf(),
    };
    let log = WakeLogFile {
        root: root.to_path_buf(),
    };
    let telemetry = HostTelemetry {
        root: root.to_path_buf(),
        payload_root,
    };
    let ports = wake::Ports {
        project: &project,
        identity: &HostIdentity,
        start: &start,
        stop: &stop,
        portfolio: &portfolio,
        queue: &queue,
        log: &log,
        clock: &Clock,
        telemetry: &telemetry,
    };
    Ok(run(&ports))
}

fn run_tick(
    root: &Path,
    payload_root: PayloadRoot,
) -> Result<watcher::TickReport, CategorisedRefusal> {
    let queue = open_queue(root)?;
    let fetch = FetchTrunk {
        root: root.to_path_buf(),
    };
    let definitions = QueryDefinitions {
        root: root.to_path_buf(),
        payload_root,
    };
    let wake_adapter = WakeInProcess {
        root: root.to_path_buf(),
        payload_root,
    };
    let notifier = MailboxNotifier::new(
        host_binary().to_string_lossy().into_owned(),
        config_value(root, "watcher.notifyTo").and_then(|v| v.as_str().map(str::to_owned)),
    );
    let portfolio = HostPortfolio {
        root: root.to_path_buf(),
    };
    let questions = QuestionsRefresh {
        root: root.to_path_buf(),
    };
    let state = TickFiles {
        root: root.to_path_buf(),
    };
    let telemetry = HostTelemetry {
        root: root.to_path_buf(),
        payload_root,
    };
    let lock = WatcherLock {
        root: root.to_path_buf(),
    };
    let ports = watcher::Ports {
        fetch: &fetch,
        definitions: &definitions,
        wake: &wake_adapter,
        notifier: &notifier,
        portfolio: &portfolio,
        questions: &questions,
        clock: &Clock,
        state: &state,
        telemetry: &telemetry,
        lock: &lock,
        queue: &queue,
    };
    Ok(watcher::tick(&ports, &watcher_settings(root)))
}

fn tick_json(r: &watcher::TickReport) -> Value {
    json!({
        "mode": r.mode.as_str(), "outcome": r.outcome.as_str(), "interval": r.interval,
        "raised": r.raised, "duplicate": r.duplicate, "wakes": r.wakes, "notifies": r.notifies,
        "errors": r.errors, "unmeasured": r.unmeasured, "problems": r.problems,
    })
}

// ---------------------------------------------------------------------------------------------
// Landing and lanes

static OPERATIONS: AtomicU64 = AtomicU64::new(0);

/// A fresh operation id on every call: process, clock and a counter, in the characters the Git journal accepts.
fn operation_id(what: &str) -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_nanos());
    format!(
        "{what}-{}-{nanos}-{}",
        std::process::id(),
        OPERATIONS.fetch_add(1, Ordering::Relaxed)
    )
}

fn run_land(root: &Path, command: &LandCommand) -> Result<Value, CategorisedRefusal> {
    let main = fgos_git::main_checkout_root(root)
        .map_err(|e| refused("land-root-unreadable", e.cause))?
        .ok_or_else(|| refused("land-root-not-a-repository", root.display()))?;
    let (state, _) = fgos_holder_lock::state_root();
    let helper = fgos_holder_lock::HelperExe::current()
        .map_err(|e| refused("land-git-unavailable", e.to_string()))?;
    let driver = GitDriver::new(&state)
        .map_err(|e| refused("land-git-unavailable", e.cause))?
        .with_helper(helper);
    let repo = match driver
        .resolve_repo(&main, &main)
        .map_err(|e| refused("land-git-unavailable", e.cause))?
    {
        fgos_git::ResolveRepo::Repository(repo) => repo,
        fgos_git::ResolveRepo::NotARepository => {
            return Err(refused("land-root-not-a-repository", main.display()))
        }
    };
    let grant = RemoteGrant {
        name: "origin".to_owned(),
        pinned_url: Inspect::remote_url(&driver, &repo, "origin")
            .map_err(|e| refused("land-remote-unreadable", e.cause))?,
    };
    let config = effective_land_config(&main)?;
    let writer = writer();
    let next = || operation_id("land");
    let log_dir = state_dir(&main, "land");
    let ports = LandPorts {
        git: &driver,
        repo: &repo,
        remote: &grant,
        writer: &writer,
        operation_id: &next,
        runner: &ShellRunner,
        log_dir: &log_dir,
        wait_ms: 30_000,
    };
    let landed =
        land(command, &config, &ports).map_err(|why| refused(&why.code, why.detail_with_note()))?;
    Ok(json!({
        "mainSha": landed.main_sha, "landedPaths": landed.landed_paths,
        "retries": landed.retries, "gatesRun": landed.gates_run,
    }))
}

/// `land.gates` and `land.regenerate`, read once as the one config value `land`.
fn effective_land_config(
    main: &Path,
) -> Result<fgos_supervision::land::LandConfig, CategorisedRefusal> {
    let section = effective_value(main, "land")
        .map_err(|r| {
            refused(
                "land-config-unreadable",
                format!("{}: {}", r.reason, r.detail),
            )
        })?
        .unwrap_or(Value::Null);
    super::session_write_publish::land_config_of(&json!({ "land": section }))
        .map_err(|detail| refused("land-config-unreadable", detail))
}

fn run_slots(root: &Path) -> Value {
    let ceiling = config_value(root, "workerSlots.ceiling").and_then(|v| v.as_u64());
    let lock_root = fgos_holder_lock::state_root::lock_root();
    let view = fgos_run_supervisor::lanes::snapshot(&lock_root, ceiling.unwrap_or(0));
    let seats: Vec<Value> = view
        .seats
        .iter()
        .map(|s| json!({"k": s.k, "held": s.held}))
        .collect();
    json!({"lanes": {
        "ceiling": ceiling, "live": view.live,
        "free": ceiling.map(|_| view.free), "seats": seats,
    }})
}

// ---------------------------------------------------------------------------------------------
// Coordination: raising, tuning, and reaching a session on site

/// One coordination act in Observe, under the registered `fgos.coordination.act` kind. The write door counts its own
/// failures; a lost record never changes what the act did.
fn record_coordination(
    root: &Path,
    payload_root: PayloadRoot,
    act: &str,
    subject: SubjectRef,
    outcome: &str,
) {
    let record = span_record(
        "fgos.coordination.act",
        subject,
        vec![
            ("fgos.coordination.act", act.to_owned()),
            ("fgos.coordination.outcome", outcome.to_owned()),
        ],
        Vec::new(),
    );
    let _ = record_door(root, payload_root).write(record);
}

/// The act a raised event kind records.
fn act_of_kind(kind: &str) -> &'static str {
    match kind {
        "coordination-chore" => "chore",
        "coordination-help" => "ask",
        _ => "handoff",
    }
}

fn raise_event(
    root: &Path,
    payload_root: PayloadRoot,
    command: &RaiseCommand,
) -> Result<(String, Raised), CategorisedRefusal> {
    let event = RaisedEvent::coordination(
        &command.kind,
        &command.subject,
        &command.reason,
        &command.next,
    )
    .map_err(queue_refusal)?;
    let id = event.id.clone();
    let raised = open_queue(root)?.raise(event).map_err(queue_refusal)?;
    let outcome = match raised {
        Raised::New => "raised",
        Raised::Duplicate => "duplicate",
    };
    record_coordination(
        root,
        payload_root,
        act_of_kind(&command.kind),
        SubjectRef {
            kind: "event".to_owned(),
            id: id.clone(),
        },
        outcome,
    );
    Ok((id, raised))
}

/// Writes each requested watcher setting through the config door, which holds the schema bounds, and returns the
/// `key=value` lines it set. A setting the door refuses stops the call and names what was already set.
fn tune_watcher(
    root: &Path,
    payload_root: PayloadRoot,
    command: &TuneCommand,
) -> Result<Vec<String>, CategorisedRefusal> {
    let mut changes: Vec<(String, String)> = command
        .action
        .iter()
        .map(|(definition, action)| (format!("actions.{definition}"), (*action).to_owned()))
        .collect();
    changes.extend(
        command
            .settings
            .iter()
            .map(|(k, v)| (k.clone(), v.to_string())),
    );
    let mut applied: Vec<String> = Vec::new();
    for (key, value) in changes {
        let request = fgos_config::provider::ConfigRequest {
            root: root.to_path_buf(),
            verb: fgos_config::provider::Verb::Set {
                path: format!("watcher.{key}"),
                value: value.clone(),
                reason: format!("watcher tune: {key}={value}"),
                global: false,
            },
        };
        if let Err(refusal) = fgos_config::provider::answer(&request) {
            let done = if applied.is_empty() {
                String::new()
            } else {
                format!(" (already set: {})", applied.join(", "))
            };
            return Err(validation(format!(
                "watcher.{key} was refused: {} [{}]{done}",
                refusal.detail, refusal.reason
            )));
        }
        applied.push(format!("{key}={value}"));
    }
    record_coordination(
        root,
        payload_root,
        "tune",
        SubjectRef {
            kind: "session".to_owned(),
            id: writer(),
        },
        &applied.join(" "),
    );
    Ok(applied)
}

/// The one live session Identity names by `target` (a role, handle, id or slot key); never a raw pane id.
fn session_of(target: &str) -> Result<fgos_identity::directory::Listed, CategorisedRefusal> {
    let (state, _) = fgos_holder_lock::state_root();
    fgos_identity::directory::resolve(
        &state,
        target,
        &fgos_process::facts::judge_here,
        None,
        &fgos_identity::directory::NoTerminal,
    )
    .map_err(|r| {
        let code = if r.reason == "not-found" {
            "session-not-found"
        } else {
            r.reason
        };
        refused(code, format!("{target}: {}", r.detail))
    })
}

/// What the terminal driver takes to find the session's pane: its slot key when it has one, else its pane id, both
/// as Identity recorded them.
fn pane_of(session: &fgos_identity::directory::Listed) -> Result<String, CategorisedRefusal> {
    session
        .ids
        .as_ref()
        .and_then(|ids| ids.terminal.as_ref())
        .map(|t| t.key.clone().unwrap_or_else(|| t.pane_id.clone()))
        .ok_or_else(|| {
            refused(
                "session-has-no-pane",
                format!("{} has no terminal pane in Identity", session.handle),
            )
        })
}

fn terminal_refusal(refusal: fgos_terminal_control::port::Refusal) -> CategorisedRefusal {
    refused("terminal-refused", refusal)
}

/// The most screen text one `session read` answers; a reply frame holds 64 KiB.
const MAX_READ_BYTES: usize = 48 * 1024;

/// `text` cut to its last `max` bytes at a character boundary.
fn tail_of(text: String, max: usize) -> (String, bool) {
    if text.len() <= max {
        return (text, false);
    }
    let mut start = text.len() - max;
    while !text.is_char_boundary(start) {
        start += 1;
    }
    (text[start..].to_owned(), true)
}

fn read_session(root: &Path, target: &str, lines: u32) -> Result<Value, CategorisedRefusal> {
    let session = session_of(target)?;
    let pane = pane_of(&session)?;
    let backend = fgos_run_supervisor::terminal_slot::Backend::from_env(root);
    let screen = backend
        .core()
        .read_recent(&pane, lines)
        .map_err(terminal_refusal)?;
    let (text, truncated) = tail_of(screen, MAX_READ_BYTES);
    Ok(json!({"session": session.handle, "lines": lines, "truncated": truncated, "text": text}))
}

/// Whether an open event names `session`: by its id (whole, or the agent CLI's own id after the machine part, which is
/// how a watcher event names it), handle, a role it holds or its slot key.
fn names_session(subject: &str, session: &fgos_identity::directory::Listed) -> bool {
    let subject = subject.strip_prefix("session:").unwrap_or(subject);
    let key = session
        .ids
        .as_ref()
        .and_then(|ids| ids.terminal.as_ref())
        .and_then(|t| t.key.as_deref());
    let cli_id = session
        .ids
        .as_ref()
        .and_then(|ids| ids.cli_session.as_ref())
        .map(|c| c.id.as_str());
    subject == session.id
        || session.id.rsplit('/').next() == Some(subject)
        || cli_id == Some(subject)
        || subject == session.handle
        || session.roles.iter().any(|r| r == subject)
        || key == Some(subject)
}

fn type_into_session(
    root: &Path,
    payload_root: PayloadRoot,
    target: &str,
    text: &str,
) -> Result<Value, CategorisedRefusal> {
    let session = session_of(target)?;
    let open = open_queue(root)?.unhandled().map_err(queue_refusal)?;
    if !open.iter().any(|e| names_session(&e.subject, &session)) {
        return Err(refused(
            "target-not-stuck",
            format!(
                "no open supervision event names {}; typing is for a stuck session only",
                session.handle
            ),
        ));
    }
    let pane = pane_of(&session)?;
    let backend = fgos_run_supervisor::terminal_slot::Backend::from_env(root);
    backend
        .core()
        .type_text(&pane, text)
        .map_err(terminal_refusal)?;
    record_coordination(
        root,
        payload_root,
        "type",
        SubjectRef {
            kind: "session".to_owned(),
            id: session.id.clone(),
        },
        "typed",
    );
    Ok(json!({"session": session.handle, "typed": true}))
}

// ---------------------------------------------------------------------------------------------
// A confined caller's door

/// The socket a confined head asks its own supervisor through.
pub const HEAD_SOCKET_ENV: &str = "FGOS_HEAD_REQUEST_SOCKET";

/// Whether this process is a confined worker, by the marker the launch driver sets.
pub fn is_confined() -> bool {
    fgos_config::session::session_class(|key| std::env::var(key).ok())
        == fgos_config::snapshot::SessionClass::Confined
}

/// The most stdin a confined `metrics record` reads; the request frame carries a few records only.
const MAX_RECORD_INPUT_BYTES: u64 = 256 * 1024;

/// The records a confined `metrics record` holds on stdin: one object or an array of them.
fn records_on_stdin() -> Result<Value, String> {
    use std::io::Read;
    let mut bytes = Vec::new();
    std::io::stdin()
        .take(MAX_RECORD_INPUT_BYTES + 1)
        .read_to_end(&mut bytes)
        .map_err(|e| format!("metrics record: cannot read stdin: {e}"))?;
    if bytes.is_empty() {
        return Err("metrics record: no records on stdin".to_owned());
    }
    if bytes.len() as u64 > MAX_RECORD_INPUT_BYTES {
        return Err(format!(
            "metrics record: input is over {MAX_RECORD_INPUT_BYTES} bytes"
        ));
    }
    match serde_json::from_slice::<Value>(&bytes)
        .map_err(|e| format!("metrics record: input is not JSON: {e}"))?
    {
        Value::Array(items) => Ok(Value::Array(items)),
        single => Ok(Value::Array(vec![single])),
    }
}

/// Sends a confined call through the request socket and prints the reply's data as the verb's JSON line, or the
/// socket's refusal code. Returns the process exit status. The reply is the supervisor's: this decides nothing.
#[cfg(unix)]
pub fn send_confined(call: Result<crate::routing::ConfinedCall, String>) -> i32 {
    use fgos_run_supervisor::head_client::{request_head, REPLY_TIMEOUT};
    let refuse = |code: &str, detail: &str| {
        eprintln!("fgos: {detail} [{code}]");
        println!("{}", json!({"ok": false, "code": code, "detail": detail}));
        if code == "bad-args" {
            fgos_host_runtime::exit_codes::validation()
        } else {
            fgos_host_runtime::exit_codes::unexpected()
        }
    };
    let call = match call {
        Ok(call) => call,
        Err(detail) => {
            let detail = detail
                .strip_prefix("bad-args: ")
                .unwrap_or(&detail)
                .to_owned();
            return refuse("bad-args", &detail);
        }
    };
    let mut call = call;
    if call.verb == "metrics record" {
        match records_on_stdin() {
            Ok(records) => call.args = json!({ "records": records }),
            Err(detail) => return refuse("bad-args", &detail),
        }
    }
    let Some(socket) = std::env::var_os(HEAD_SOCKET_ENV).filter(|s| !s.is_empty()) else {
        return refuse(
            "request-socket-unavailable",
            &format!("{HEAD_SOCKET_ENV} is not set: this session has no request socket"),
        );
    };
    let id = format!("c-{}-{}", std::process::id(), super::questions::now_ms());
    match request_head(
        Path::new(&socket),
        call.verb,
        &call.args,
        &id,
        REPLY_TIMEOUT,
    ) {
        Ok(data) => {
            println!("{data}");
            fgos_host_runtime::exit_codes::ok()
        }
        Err(error) => refuse(&error.code, &error.explanation()),
    }
}

// ---------------------------------------------------------------------------------------------
// The verbs

/// How many unreadable plans `supervisor plans` names; the answer also carries the full count. An old repository can
/// hold dozens, and a confined caller's reply is one frame of at most 64 KiB.
const UNREADABLE_SHOWN: usize = 10;

/// The first [`UNREADABLE_SHOWN`] unreadable plans.
fn shown_unreadable(mut unreadable: Vec<Value>) -> Vec<Value> {
    unreadable.truncate(UNREADABLE_SHOWN);
    unreadable
}

/// Runs one request and shapes the answer.
pub fn answer(
    request: &SupervisionRequest,
    payload_root: PayloadRoot,
) -> Result<VerbAnswer, CategorisedRefusal> {
    let root = request.root.as_path();
    let done = |data: Value, text: String| VerbAnswer {
        data,
        exit: 0,
        text: (!request.json).then(|| format!("{text}\n")),
    };
    match &request.verb {
        Verb::Tick => {
            let report = run_tick(root, payload_root)?;
            let text = format!(
                "watcher tick: {} ({})",
                report.outcome.as_str(),
                report.mode.as_str()
            );
            Ok(done(tick_json(&report), text))
        }
        Verb::Wake => {
            let outcome = run_wake(root, payload_root, "manual", "")?;
            let text = format!("supervisor wake: {}", outcome.as_str());
            let mut data = json!({"outcome": outcome.as_str()});
            if let wake::WakeOutcome::StartFailed(code) = &outcome {
                data["code"] = json!(code);
            }
            Ok(done(data, text))
        }
        Verb::Plans => {
            let portfolio = HostPortfolio {
                root: root.to_path_buf(),
            };
            let (plans, unreadable) = portfolio
                .read_with_refusals()
                .map_err(|e| refused("portfolio-unreadable", e))?;
            let project = wake::Project::project(&HostProject {
                root: root.to_path_buf(),
            })
            .ok_or_else(|| {
                refused(
                    "project-id-missing",
                    "no project id yet; run `fgos identity project --init`",
                )
            })?;
            let max_leads =
                usize::try_from(config_int(root, "supervisor.maxLeads", 4)).unwrap_or(4);
            let view = supervisor::plans(
                &plans,
                &HostPortfolio::done(&plans),
                &project.handle,
                &project.id,
                &|role| wake::Identity::holder(&HostIdentity, role),
                max_leads,
            );
            let unreadable_count = unreadable.len();
            let unreadable = shown_unreadable(unreadable);
            let mut lines: Vec<String> = view
                .rows
                .iter()
                .map(|r| {
                    format!(
                        "{} {} {}{}",
                        r.dir,
                        r.status,
                        r.priority,
                        if r.admissible { " admissible" } else { "" }
                    )
                })
                .collect();
            lines.extend(unreadable.iter().map(|u| {
                format!(
                    "{} unreadable: {}",
                    u["dir"].as_str().unwrap_or_default(),
                    u["detail"].as_str().unwrap_or_default()
                )
            }));
            let mut data = view.to_json();
            data["unreadable"] = Value::Array(unreadable);
            data["unreadableCount"] = json!(unreadable_count);
            Ok(done(data, lines.join("\n")))
        }
        Verb::Queue => {
            let queue = open_queue(root)?;
            let events = supervisor::queue(
                &queue,
                &StoreAskers {
                    root: root.to_path_buf(),
                },
            )
            .map_err(queue_refusal)?;
            let text = events
                .iter()
                .map(|e| {
                    format!(
                        "{} {} {}: {}",
                        e.event.id, e.event.kind, e.event.subject, e.event.reason
                    )
                })
                .collect::<Vec<_>>()
                .join("\n");
            let items: Vec<Value> = events.iter().map(|e| e.to_json()).collect();
            Ok(done(json!({"events": items}), text))
        }
        Verb::Handled { ids } => {
            let queue = open_queue(root)?;
            let closed = supervisor::handled(&queue, ids, "supervisor").map_err(queue_refusal)?;
            Ok(done(
                json!({"handled": closed}),
                format!("handled {closed}"),
            ))
        }
        Verb::Raise(command) => {
            let (id, raised) = raise_event(root, payload_root, command)?;
            let raised = matches!(raised, Raised::New);
            Ok(done(
                json!({"id": id, "raised": raised}),
                format!("{} {id}", if raised { "raised" } else { "already raised" }),
            ))
        }
        Verb::Tune(command) => {
            let applied = tune_watcher(root, payload_root, command)?;
            Ok(done(
                json!({"applied": applied}),
                format!("watcher tune: {}", applied.join(", ")),
            ))
        }
        Verb::SessionRead { target, lines } => {
            let data = read_session(root, target, *lines)?;
            let text = data["text"].as_str().unwrap_or_default().to_owned();
            Ok(done(data, text))
        }
        Verb::SessionType { target, text } => {
            let data = type_into_session(root, payload_root, target, text)?;
            Ok(done(data, format!("typed into {target}")))
        }
        Verb::Done => {
            let queue = open_queue(root)?;
            supervisor::done(&queue).map_err(queue_refusal)?;
            Ok(done(supervisor::done_json(), "done".to_owned()))
        }
        Verb::Land(command) => {
            let data = run_land(root, command)?;
            let text = format!("landed {}", data["mainSha"].as_str().unwrap_or(""));
            Ok(done(data, text))
        }
        Verb::Slots => {
            let data = run_slots(root);
            let lanes = &data["lanes"];
            let text = format!(
                "lanes: ceiling {} live {} free {}",
                lanes["ceiling"], lanes["live"], lanes["free"]
            );
            Ok(done(data, text))
        }
    }
}

/// The provider of the supervision operations.
pub struct SupervisionProvider {
    descriptor: ProviderDescriptor,
    payload_root: PayloadRoot,
}

impl SupervisionProvider {
    pub fn for_descriptor(descriptor: ProviderDescriptor, payload_root: PayloadRoot) -> Self {
        Self {
            descriptor,
            payload_root,
        }
    }
}

impl OperationProvider for SupervisionProvider {
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
                .downcast_ref::<SupervisionRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not SupervisionRequest".into())
                })?;
            let output: Box<dyn std::any::Any + Send> = match answer(request, self.payload_root) {
                Ok(done) => Box::new(done),
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

    fn scratch_root(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("fgos-stop-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn with_placement(root: &Path, lineage: &str) {
        let dir = root.join(".fgos/runtime/session-rotation").join(lineage);
        std::fs::create_dir_all(&dir).unwrap();
        let placement = json!({"host": "terminal", "key": "k1"});
        let file = json!({"placement": placement, "runDir": "/x"});
        std::fs::write(dir.join("placement.json"), file.to_string()).unwrap();
    }

    fn idle_pane(_: &fgos_session_host::Placement, _: &Path) -> wake::Activity {
        wake::Activity::Idle
    }

    #[test]
    fn a_running_request_ticket_makes_the_head_busy_whatever_its_pane_says() {
        let root = scratch_root("busy");
        with_placement(&root, "supervisor-x");
        let tickets = root.join(".fgos/runtime/head-tickets/supervisor-x");
        std::fs::create_dir_all(&tickets).unwrap();
        std::fs::write(tickets.join("a.json"), r#"{"state":"done"}"#).unwrap();
        std::fs::write(tickets.join("b.json"), r#"{"state":"running"}"#).unwrap();
        assert_eq!(
            head_activity(&root, "supervisor-x", idle_pane),
            wake::Activity::Busy
        );
    }

    #[test]
    fn an_unreadable_ticket_directory_is_unknown_never_idle() {
        let root = scratch_root("tickets");
        with_placement(&root, "supervisor-x");
        let tickets = root.join(".fgos/runtime/head-tickets");
        std::fs::create_dir_all(&tickets).unwrap();
        // A file where the directory should be: reading it fails with something other than not-found.
        std::fs::write(tickets.join("supervisor-x"), "").unwrap();
        assert_eq!(
            head_activity(&root, "supervisor-x", idle_pane),
            wake::Activity::Unknown
        );
    }

    #[test]
    fn a_missing_placement_is_unknown_never_idle() {
        let root = scratch_root("noplacement");
        assert_eq!(
            head_activity(&root, "supervisor-x", idle_pane),
            wake::Activity::Unknown
        );
    }

    #[test]
    fn a_gone_pane_or_an_unrecognised_agent_status_is_unknown() {
        assert_eq!(pane_activity(false, Some("idle")), wake::Activity::Unknown);
        assert_eq!(pane_activity(true, None), wake::Activity::Unknown);
        assert_eq!(pane_activity(true, Some("done")), wake::Activity::Unknown);
        assert_eq!(pane_activity(true, Some("working")), wake::Activity::Busy);
    }

    #[test]
    fn an_idle_pane_with_no_running_ticket_is_idle() {
        let root = scratch_root("idle");
        with_placement(&root, "supervisor-x");
        assert_eq!(
            head_activity(&root, "supervisor-x", |_, _| pane_activity(
                true,
                Some("idle")
            )),
            wake::Activity::Idle
        );
    }

    #[test]
    fn the_plans_answer_names_only_the_first_unreadable_plans() {
        let many: Vec<Value> = (0..25).map(|n| json!({"dir": format!("p{n}")})).collect();
        let shown = shown_unreadable(many);
        assert_eq!(shown.len(), UNREADABLE_SHOWN);
        assert_eq!(shown[0]["dir"], "p0");
    }

    #[test]
    fn a_definition_answer_maps_to_one_row_per_group_with_the_readme_precedence() {
        let answer = json!({"definitions": [
            {"name": "lane-freed", "row": {"kind": "lane-freed", "reason": "r", "nextCommand": "n"},
             "rows": [
                {"group": {"origin.host": "h1", "subject.id": "s"}, "aggs": {"max:end": "2026-01-01T00:00:00Z", "max:ts": "2025-01-01T00:00:00Z"}},
                {"group": {"subject.id": "plans/x"}, "aggs": {"min:ts": "2026-02-01T00:00:00Z", "max:ts": "2026-03-01T00:00:00Z"}},
                {"group": {"subject.id": "plans/y"}, "insufficient": true, "aggs": {}}
             ]},
            {"name": "broken", "unmeasured": "records-missing"},
            {"name": "no-template", "rows": [{"group": {"subject.id": "z"}, "aggs": {}}]}
        ]});
        let rows = rows_of(&answer).unwrap();
        assert_eq!(rows.len(), 3);
        assert_eq!(rows[0].subject.as_deref(), Some("h1"));
        assert_eq!(rows[0].ts.as_deref(), Some("2026-01-01T00:00:00Z"));
        assert_eq!(rows[1].subject.as_deref(), Some("plans/x"));
        assert_eq!(rows[1].ts.as_deref(), Some("2026-02-01T00:00:00Z"));
        assert!(rows[2].unmeasured && rows[2].kind == "broken");
    }
}
