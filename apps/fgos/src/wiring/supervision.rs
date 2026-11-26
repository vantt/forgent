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
use fgos_supervision::land::{land, BacklogPort, LandCommand, LandPorts, ShellRunner};
use fgos_supervision::notify::MailboxNotifier;
use fgos_supervision::portfolio::{self, Plan};
use fgos_supervision::queue::{Queue, QueueError, Raised, RaisedEvent};
use fgos_supervision::{keeper, sources, supervisor, wake, watcher};
use serde_json::{json, Value};
use std::borrow::Cow;
use std::cell::{Cell, RefCell};
use std::collections::{BTreeMap, BTreeSet};
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
    "schedulingSources",
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

/// Admission ceilings have defaults only in the config standard. Missing or malformed values
/// refuse instead of silently disabling a cap or registering another default here.
fn required_capacity(root: &Path, key: &str) -> Result<usize, String> {
    effective_value(root, key)
        .map_err(|_| format!("config-unreadable:{key}"))?
        .and_then(|v| v.as_u64())
        .and_then(|n| usize::try_from(n).ok())
        .filter(|n| *n > 0)
        .ok_or_else(|| format!("config-invalid:{key}"))
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
        "start-review" => Some(watcher::Action::StartReview),
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
                Err(why) => refused.push(json!({
                    "dir": dir, "code": why.code(), "detail": why.to_string(),
                    "needsJudgement": portfolio::refused_ready_plan(&text)
                })),
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
    fn read(&self) -> Result<(Vec<Plan>, Vec<String>), String> {
        self.read_with_refusals().map(|(plans, refused)| {
            let ready_refusals = refused
                .iter()
                .filter(|r| r["needsJudgement"] == true)
                .filter_map(|r| r["dir"].as_str().map(str::to_owned))
                .collect();
            (plans, ready_refusals)
        })
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

/// The session holding `role`, preferring the holder in the project at `root`: a role is not unique across the machine,
/// so the first holder found is not necessarily this project's.
fn role_holder(root: &Path, role: &str) -> Result<Option<fgos_identity::directory::Listed>, ()> {
    let sessions = role_holders()?;
    let (state, _) = fgos_holder_lock::state_root();
    let ours = fgos_identity::project_info(&state, root).ok().map(|i| i.id);
    let mut first = None;
    for s in sessions
        .into_iter()
        .filter(|s| s.roles.iter().any(|r| r == role))
    {
        if ours.is_some() && s.project_id == ours {
            return Ok(Some(s));
        }
        first.get_or_insert(s);
    }
    Ok(first)
}

struct HostIdentity {
    root: PathBuf,
}
impl wake::Identity for HostIdentity {
    fn holder(&self, role: &str) -> wake::Holder {
        let Ok(found) = role_holder(&self.root, role) else {
            return wake::Holder::Unknown;
        };
        match found.as_ref() {
            None => wake::Holder::NotLive,
            Some(s) if matches!(s.liveness, fgos_identity::Liveness::Unknown) => {
                wake::Holder::Unknown
            }
            Some(s) => wake::Holder::Live {
                project_id: s.project_id.clone().unwrap_or_default(),
            },
        }
    }
    fn lead_roles(&self, project_id: &str) -> Result<Vec<String>, String> {
        let sessions = role_holders().map_err(|_| "identity-unreadable".to_owned())?;
        Ok(sessions
            .into_iter()
            .filter(|s| s.project_id.as_deref() == Some(project_id))
            .flat_map(|s| s.roles.into_iter().filter(|r| r.starts_with("head:lead-")))
            .collect())
    }
}

struct HostAdmission {
    root: PathBuf,
}

impl wake::Admission for HostAdmission {
    fn capacity(&self) -> Result<wake::Capacity, String> {
        let max_leads = required_capacity(&self.root, "supervisor.maxLeads")?;
        let ceiling = required_capacity(&self.root, "workerSlots.ceiling")?;
        let lanes = fgos_run_supervisor::lanes::snapshot(
            &fgos_holder_lock::state_root::lock_root(),
            ceiling as u64,
        );
        Ok(wake::Capacity {
            max_leads,
            free_lanes: usize::try_from(lanes.free).map_err(|_| "lane-count-invalid".to_owned())?,
        })
    }

    fn admit(&self, plan: &Plan, role: &str) -> Result<(), String> {
        let main = fgos_git::main_checkout_root(&self.root)
            .map_err(|_| "land-root-unreadable".to_owned())?
            .ok_or("land-root-not-a-repository")?;
        let path = format!("plans/{}/plan.md", plan.dir);
        let publisher = super::session_write_publish::publisher();
        let actor = writer();
        (publisher.catch_up)(&main, &actor).map_err(|e| match e {
            fgos_run_supervisor::route::CatchUpRefusal::BranchAhead(_) => {
                "write-branch-ahead".to_owned()
            }
            fgos_run_supervisor::route::CatchUpRefusal::Busy { code, .. } => code,
            fgos_run_supervisor::route::CatchUpRefusal::Refused(why) => why.code,
        })?;
        if !(publisher.path_clean)(&main, &path).map_err(|e| e.code)? {
            return Err("admission-path-dirty".to_owned());
        }
        // A git tree may name symlinks; never follow one into a different directory at write time.
        for part in [
            main.join("plans"),
            main.join("plans").join(&plan.dir),
            main.join(&path),
        ] {
            if std::fs::symlink_metadata(part)
                .map_err(|_| "admission-path-unreadable")?
                .file_type()
                .is_symlink()
            {
                return Err("admission-path-symlink".to_owned());
            }
        }
        let file = main.join(&path);
        let original = std::fs::read_to_string(&file).map_err(|_| "admission-path-unreadable")?;
        if portfolio::read_plan(&plan.dir, &original).map_err(|e| e.code())? != *plan {
            return Err("admission-plan-stale".to_owned());
        }
        let (driver, repo) = GitDriver::open_at(&main)
            .map_err(|_| "land-git-unavailable")?
            .ok_or("land-root-not-a-repository")?;
        let base = trunk_tip(&driver, &repo)?;
        let edited = portfolio::admitted_text(&original, role, base.as_str())?;
        let dir = file.parent().ok_or("admission-path-unreadable")?;
        fgos_durable_file::replace_durably(dir, "plan.md", edited.as_bytes())
            .map_err(|_| "admission-write-failed")?;
        // This publisher composes Supervision's existing paths land (catch-up, gate, commit, push).
        // A refusal never starts a session; undo only our still-uncommitted bytes on the normal path.
        if let Err(why) = (publisher.publish)(&main, &path, "keeper", &actor) {
            if (publisher.path_clean)(&main, &path).is_ok_and(|clean| !clean)
                && std::fs::read_to_string(&file).is_ok_and(|text| text == edited)
            {
                fgos_durable_file::replace_durably(dir, "plan.md", original.as_bytes())
                    .map_err(|_| format!("{}:admission-restore-failed", why.code))?;
            }
            return Err(why.code);
        }
        Ok(())
    }
}

/// Starts a head with the host's own verb: `<host> session start <persona> --name <name> --json`.
struct HostStart<'a> {
    root: PathBuf,
    started: &'a RefCell<BTreeSet<String>>,
}

impl wake::StartSession for HostStart<'_> {
    fn start(&self, persona: &str, name: &str) -> Result<(), String> {
        // Reserve before the attempt: even a failed door may have launched before it lost its reply.
        // Admission and the keeper must not try the same head twice during this wake.
        self.started
            .borrow_mut()
            .insert(format!("head:{persona}-{name}"));
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

/// `Some` when the lineage's request tickets decide its activity (`Busy`, or `Unknown` when unreadable).
fn lineage_tickets(root: &Path, lineage: &str) -> Option<wake::Activity> {
    tickets_activity(&root.join(".fgos/runtime/head-tickets").join(lineage))
}

/// A head's activity from its lineage under `root`: tickets first, then its placement, then `pane` (the terminal
/// host's view of that placement).
fn head_activity(
    root: &Path,
    lineage: &str,
    pane: impl FnOnce(&fgos_session_host::Placement, &Path) -> wake::Activity,
) -> wake::Activity {
    if let Some(running) = lineage_tickets(root, lineage) {
        return running;
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

/// A lead started by hand holds a short role (`lead:<LANE>`) and has no head lineage; the wake door names it by that
/// role, in the place of a head name.
fn is_short_role(name: &str) -> bool {
    wake::is_short_lead_role(name)
}

/// The argv of `session stop` for a head, or for the lead that holds the short role `name`.
fn stop_argv<'a>(persona: &'a str, name: &'a str) -> Vec<&'a str> {
    if is_short_role(name) {
        vec!["session", "stop", "--role", name, "--json"]
    } else {
        vec!["session", "stop", persona, "--name", name, "--json"]
    }
}

/// The activity of the lead holding the short `role`: the pane of the terminal slot its Identity record names. When the
/// record names a head lineage, that lineage's running request tickets count as they do for a head, and its run directory
/// is where the terminal endpoint is read from. A role nobody holds, or a holder with no slot, is `Unknown`, never `Idle`.
fn short_role_activity(
    root: &Path,
    role: &str,
    pane: impl FnOnce(&fgos_session_host::Placement, &Path) -> wake::Activity,
) -> wake::Activity {
    let Ok(Some(holder)) = role_holder(root, role) else {
        return wake::Activity::Unknown;
    };
    let lineage = holder
        .ids
        .as_ref()
        .and_then(|ids| ids.head.as_ref())
        .map(|h| format!("{}-{}", h.persona, h.name));
    if let Some(running) = lineage.as_deref().and_then(|l| lineage_tickets(root, l)) {
        return running;
    }
    let key = holder
        .ids
        .as_ref()
        .and_then(|ids| ids.terminal.as_ref())
        .and_then(|t| t.key.clone());
    let Some(key) = key else {
        return wake::Activity::Unknown;
    };
    let run_dir = lineage
        .as_deref()
        .and_then(|l| {
            let file = root
                .join(".fgos/runtime/session-rotation")
                .join(l)
                .join("placement.json");
            let value = serde_json::from_slice::<Value>(&std::fs::read(file).ok()?).ok()?;
            value["runDir"].as_str().map(PathBuf::from)
        })
        .unwrap_or_else(|| root.to_path_buf());
    match serde_json::from_value::<fgos_session_host::Placement>(
        json!({"host": "terminal", "key": key}),
    ) {
        Ok(placement) => pane(&placement, &run_dir),
        Err(_) => wake::Activity::Unknown,
    }
}

impl wake::StopSession for HostStop {
    fn activity(&self, persona: &str, name: &str) -> wake::Activity {
        if is_short_role(name) {
            return short_role_activity(&self.root, name, host_pane_activity);
        }
        head_activity(&self.root, &format!("{persona}-{name}"), host_pane_activity)
    }

    fn stop(&self, persona: &str, name: &str) -> Result<(), String> {
        let out = Command::new(host_binary())
            .args(stop_argv(persona, name))
            .current_dir(&self.root)
            .stdin(Stdio::null())
            .output()
            .map_err(|e| format!("session-stop-unavailable: {e}"))?;
        let answer =
            serde_json::from_str::<Value>(String::from_utf8_lossy(&out.stdout).trim()).ok();
        if out.status.success() {
            // A stop the host declined (a lead with no run supervisor, a role nobody holds) still exits 0: only
            // `stopped: true` means the head ended.
            let data = answer.as_ref().map(|v| &v["data"]);
            return match data.and_then(|d| d["stopped"].as_bool()) {
                Some(true) => Ok(()),
                Some(false) => Err(data
                    .and_then(|d| d["reason"].as_str())
                    .unwrap_or("not-stopped")
                    .to_owned()),
                None => Err("session-stop-unreadable".to_owned()),
            };
        }
        Err(answer
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

/// Open owner questions, read from the owner-question store; an unreadable store has none.
struct StoreOpenQuestions {
    root: PathBuf,
}

impl supervisor::OpenQuestions for StoreOpenQuestions {
    fn has_open(&self, reference: &str) -> bool {
        use fgos_questions::store::{fold, LogOpener, State};
        let Ok(Some(log)) = super::questions::HostLogOpener::reader().open(&self.root) else {
            return false;
        };
        let Ok(events) = log.read() else {
            return false;
        };
        fold(&events)
            .questions()
            .any(|q| q.state == State::Open && q.asked.origin.value == reference)
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
                ("fgos.supervisor.error", span.error.clone()),
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
            review_started: v["reviewStarted"].as_i64(),
        })
    }

    fn save(&self, state: watcher::State) -> Result<(), String> {
        write_json(
            &state_dir(&self.root, "watcher"),
            "state.json",
            &json!({
                "lastTick": state.last_tick,
                "lastFullTick": state.last_full_tick,
                "reviewStarted": state.review_started,
            }),
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

/// Detection uses Observe's query door in process, with the review watermark projection added
/// to the ordinary host environment.
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
        let mut args = Vec::new();
        for def in defs {
            let path = self
                .resolve(def)
                .ok_or_else(|| format!("{def} does not exist"))?;
            args.extend(["--def".into(), path.to_string_lossy().into_owned()]);
        }
        if let Some(since) = since {
            args.extend(["--since".into(), iso_of(since)]);
        }
        fgos_observe::metrics_cli::query::dispatch_query(
            &fgos_observe::ObserveRequest {
                operation: "observe.metrics".into(),
                sub: "query".into(),
                args,
                root: self.root.clone(),
                stdin: None,
            },
            &ReviewEnvironment {
                payload_root: self.payload_root,
            },
        )
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
        let outcome = with_wake_ports(&self.root, self.payload_root, |ports, _| {
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
    let queue = open_queue(root)?;
    let history = KeeperHistory {
        root: root.to_path_buf(),
    };
    with_wake_ports(root, payload_root, |ports, started| {
        let players = KeeperPlayers {
            root: root.to_path_buf(),
            started,
            host: host_binary(),
            lead_claims: Cell::new(0),
            starts: BTreeMap::new(),
        };
        let snapshot = KeeperSnapshot {
            root: root.to_path_buf(),
            history: &history,
            started,
        };
        wake::wake(
            &wake::ScheduledPorts {
                admission: ports,
                keeper: keeper::Ports {
                    snapshot: &snapshot,
                    history: &history,
                    players: &players,
                    raise: &queue,
                },
            },
            &wake_settings(root),
            wake::Trigger { trigger, subject },
        )
    })
}

/// Builds the wake door's real ports once and hands them to `run`.
fn with_wake_ports<T>(
    root: &Path,
    payload_root: PayloadRoot,
    run: impl FnOnce(&wake::Ports, &RefCell<BTreeSet<String>>) -> T,
) -> Result<T, CategorisedRefusal> {
    let queue = open_queue(root)?;
    let project = HostProject {
        root: root.to_path_buf(),
    };
    let started = RefCell::new(BTreeSet::new());
    let start = HostStart {
        root: root.to_path_buf(),
        started: &started,
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
        identity: &HostIdentity {
            root: root.to_path_buf(),
        },
        start: &start,
        stop: &stop,
        portfolio: &portfolio,
        admission: &HostAdmission {
            root: root.to_path_buf(),
        },
        questions: &StoreOpenQuestions {
            root: root.to_path_buf(),
        },
        queue: &queue,
        log: &log,
        clock: &Clock,
        telemetry: &telemetry,
    };
    Ok(run(&ports, &started))
}

// Scheduling source and need adapters. Domain reads stay behind the source and component doors.
struct KeeperHistory {
    root: PathBuf,
}
struct KeeperHistorySnapshot {
    decisions: Vec<keeper::Decision>,
    cover: BTreeMap<String, u64>,
    starts: BTreeMap<keeper::Key, u64>,
    latest_event: Option<String>,
}
impl KeeperHistory {
    fn snapshot(&self) -> Result<KeeperHistorySnapshot, String> {
        use fgos_event_store::{
            cursor::Cursor,
            identity::StoreIdentity,
            layout::StreamId,
            read::{read, ReadRequest},
        };
        let clone = super::event_store_clone::open(&self.root)
            .map_err(|e| e.detail)?
            .ok_or("event-store-no-repository")?;
        let origin = if clone.layout.store().exists() {
            StoreIdentity::open(&clone.layout, &clone.machine)
                .map_err(|e| e.to_string())?
                .store_id
        } else {
            String::new()
        };
        let (driver, repo) = GitDriver::open_at(&self.root)
            .map_err(|e| e.cause)?
            .ok_or("not-a-repository")?;
        let stream = StreamId::parse("project").map_err(|e| e.to_string())?;
        let result = read(
            &driver,
            &repo,
            ReadRequest {
                machine: &clone.machine,
                layout: &clone.layout,
                origin: &origin,
                streams: &[stream],
                cursor: &Cursor::default(),
                folded: &[],
                project: true,
            },
        )
        .map_err(|e| e.to_string())?;
        if !result.skipped_mirrors.is_empty()
            || !result.deferred.is_empty()
            || !result.missing.is_empty()
        {
            return Err("keeper-history-incomplete".into());
        }
        let mut decisions = vec![];
        let mut starts = BTreeMap::new();
        for event in result
            .sequence
            .iter()
            .filter(|e| e.event_type.starts_with("supervision.keeper-"))
        {
            let decision: keeper::Decision =
                serde_json::from_value(event.payload.clone()).map_err(|e| e.to_string())?;
            if decision.action == keeper::Action::Start {
                let at = fgos_identity::text::iso_utc_secs(&event.ts)
                    .ok_or("keeper-start-time-invalid")?;
                starts
                    .entry((decision.item.clone(), decision.step.clone()))
                    .and_modify(|last: &mut u64| *last = (*last).max(at))
                    .or_insert(at);
            }
            decisions.push(decision);
        }
        Ok(KeeperHistorySnapshot {
            decisions,
            starts,
            latest_event: result
                .sequence
                .iter()
                .max_by_key(|e| fgos_host_runtime::civil_time::parse_rfc3339_millis(&e.ts))
                .map(|e| e.ts.clone()),
            cover: result.cursor.cover.into_iter().collect(),
        })
    }
}
impl keeper::History for KeeperHistory {
    fn read(&self) -> Result<Vec<keeper::Decision>, String> {
        self.snapshot().map(|s| s.decisions)
    }
    fn record(&self, decision: &keeper::Decision) -> Result<(), String> {
        use fgos_event_store::{
            append::{append, AppendRequest, EventInput},
            layout::StreamId,
            registry::Registry,
        };
        let clone = super::event_store_clone::open(&self.root)
            .map_err(|e| e.detail)?
            .ok_or("event-store-no-repository")?;
        let stream = StreamId::parse("project").map_err(|e| e.to_string())?;
        let registry = Registry::shipped().map_err(|e| e.to_string())?;
        for _ in 0..8 {
            let cover = self.snapshot()?.cover;
            let events = [EventInput {
                event_type: decision.event_type().into(),
                schema_version: 1,
                payload: serde_json::to_value(decision).map_err(|e| e.to_string())?,
                ts: iso_of(now_secs()),
            }];
            match append(
                &clone.layout,
                &registry,
                AppendRequest {
                    stream: &stream,
                    events: &events,
                    cursor: &cover,
                    writer: &writer(),
                    machine: &clone.machine,
                    held_ranks: &[],
                },
            ) {
                Ok(_) => return Ok(()),
                Err(e) if e.code == fgos_event_store::errors::ErrorCode::StaleCursor => continue,
                Err(e) => return Err(e.to_string()),
            }
        }
        Err("keeper-history-stale".into())
    }
}

struct KeeperPlayers<'a> {
    root: PathBuf,
    started: &'a RefCell<BTreeSet<String>>,
    host: PathBuf,
    // Snapshot-local claims keep two absent leads from both taking the last lead slot.
    lead_claims: Cell<usize>,
    starts: BTreeMap<keeper::Key, u64>,
}

fn head_target(role: &str) -> Option<(&str, &str)> {
    let lineage = role.strip_prefix("head:")?;
    if lineage.contains(['/', '\\']) {
        return None;
    }
    let (persona, name) = lineage.split_once('-')?;
    (!name.is_empty() && !name.contains('/') && !name.contains("..")).then_some((persona, name))
}

impl sources::Heads for KeeperPlayers<'_> {
    fn state(&self, role: &str) -> keeper::ActorState {
        if self.started.borrow().contains(role) {
            return keeper::ActorState::Unknown;
        }
        match wake::Identity::holder(
            &HostIdentity {
                root: self.root.clone(),
            },
            role,
        ) {
            wake::Holder::Live { project_id } => {
                let ours = wake::Project::project(&HostProject {
                    root: self.root.clone(),
                });
                if ours.is_some_and(|p| p.id == project_id) {
                    keeper::ActorState::Live
                } else {
                    keeper::ActorState::Unknown
                }
            }
            wake::Holder::Unknown => keeper::ActorState::Unknown,
            wake::Holder::NotLive => {
                let Some((persona, name)) = head_target(role) else {
                    return keeper::ActorState::Unknown;
                };
                let file = self
                    .root
                    .join(".fgos/runtime/session-rotation")
                    .join(format!("{persona}-{name}"))
                    .join("placement.json");
                match std::fs::read(&file) {
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                        keeper::ActorState::NotLive
                    }
                    Err(_) => keeper::ActorState::Unknown,
                    Ok(bytes) => {
                        let Ok(p) = serde_json::from_slice::<Value>(&bytes) else {
                            return keeper::ActorState::Unknown;
                        };
                        if p["retiredAt"].is_string()
                            || p["retiredReason"] == "sleep"
                            || p["runDir"]
                                .as_str()
                                .is_some_and(|dir| Path::new(dir).join("closed.json").exists())
                        {
                            keeper::ActorState::NotLive
                        } else {
                            keeper::ActorState::Unknown
                        } // launched, registration still pending
                    }
                }
            }
        }
    }
    fn sleep_until(&self, role: &str) -> Option<String> {
        let (persona, name) = head_target(role)?;
        let p = read_json(
            &self
                .root
                .join(".fgos/runtime/session-rotation")
                .join(format!("{persona}-{name}"))
                .join("placement.json"),
        )?;
        (p["retiredReason"] == "sleep")
            .then(|| p["wakeAt"].as_str().map(str::to_owned))
            .flatten()
    }
}

impl KeeperPlayers<'_> {
    fn claim_lead_slot(&self, occupied: usize, max: usize) -> Option<String> {
        if occupied.saturating_add(self.lead_claims.get()) >= max {
            Some("lead-cap".into())
        } else {
            self.lead_claims.set(self.lead_claims.get() + 1);
            None
        }
    }

    fn actor(&self, reference: &str) -> Result<Option<fgos_identity::directory::Listed>, String> {
        let (state, _) = fgos_holder_lock::state_root();
        match fgos_identity::directory::resolve(
            &state,
            reference,
            &fgos_process::facts::judge_here,
            None,
            &fgos_identity::directory::NoTerminal,
        ) {
            Ok(holder) => Ok(Some(holder)),
            Err(e) if e.reason == "not-found" => Ok(None),
            Err(e) => Err(e.reason.into()),
        }
    }
    fn successor(&self, reference: &str) -> Option<(String, String)> {
        if let Some((persona, name)) = head_target(reference) {
            return Some((persona.into(), name.into()));
        }
        // Ask Identity for retained identifiers, then require its actual liveness proof.
        // The conservative lookup alone never permits a successor.
        let (state, _) = fgos_holder_lock::state_root();
        let holder = fgos_identity::directory::resolve(
            &state,
            reference,
            &|_| fgos_process::facts::Verdict::Unknown,
            None,
            &fgos_identity::directory::NoTerminal,
        )
        .ok()?;
        if !fgos_identity::directory::session_proven_dead(
            &state,
            &holder.id,
            &fgos_process::facts::judge_here,
        ) {
            return None;
        }
        let project = wake::Project::project(&HostProject {
            root: self.root.clone(),
        })?;
        if holder.project_id.as_deref() != Some(project.id.as_str()) {
            return None;
        }
        let head = holder.ids?.head?;
        Some((head.persona, head.name))
    }
    fn command(&self, args: &[String]) -> Result<(), String> {
        let output = Command::new(&self.host)
            .args(args)
            .current_dir(&self.root)
            .stdin(Stdio::null())
            .output()
            .map_err(|e| e.to_string())?;
        if output.status.success() {
            Ok(())
        } else {
            Err(format!(
                "keeper-door-exit-{}: {}",
                output.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&output.stderr).trim()
            ))
        }
    }
    /// Reuse the process door: the one-shot wake must not wait for a whole Unit run.
    #[cfg(unix)]
    fn start_run(&self, args: &[String]) -> Result<(), String> {
        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let mut argv = vec![exe.into_os_string()];
        argv.extend(args.iter().map(std::ffi::OsString::from));
        let logs = self.root.join(".fgos/runtime/keeper");
        std::fs::create_dir_all(&logs).map_err(|e| e.to_string())?;
        fgos_process::mapped::spawn_detached(
            &argv,
            &self.root,
            &[],
            &[],
            Some(&logs.join("runs.log")),
        )
        .map(|_| ())
        .map_err(|e| e.to_string())
    }
    #[cfg(not(unix))]
    fn start_run(&self, _: &[String]) -> Result<(), String> {
        Err("keeper-detached-start-unsupported".into())
    }
    /// Candidate worker-lane claims and the current held slots, judged by the existing referee.
    /// The run door still acquires its lane atomically; this read is not a reservation.
    fn resource_hold(&self) -> Result<Option<String>, String> {
        let ceiling = required_capacity(&self.root, "workerSlots.ceiling")?;
        let lanes = fgos_run_supervisor::lanes::snapshot(
            &fgos_holder_lock::state_root::lock_root(),
            ceiling as u64,
        );
        let slot = lanes
            .seats
            .iter()
            .find(|s| !s.held)
            .or_else(|| lanes.seats.first())
            .ok_or("lane-snapshot-empty")?;
        let claim = json!({"space": "resource", "ref": format!("lane#{}", slot.k)});
        let mut nodes = vec![json!({"id": "candidate", "claims": [claim], "layer": 1})];
        let mut exclusions = vec![];
        for seat in lanes.seats.iter().filter(|s| s.held) {
            let id = format!("held-{}", seat.k);
            nodes.push(json!({"id": id, "claims": [{"space": "resource", "ref": format!("lane#{}", seat.k)}], "layer": 1}));
            if seat.k == slot.k {
                exclusions.push(json!({"a": "candidate", "b": id, "shared": [claim]}));
            }
        }
        let verdict = fgos_resource_referee::evaluate(&json!({"nodes": nodes, "graph": {"cycles": [], "dangling": []}, "exclusions": exclusions}), &json!({"rules": []}), None).map_err(|e| e.to_string())?;
        Ok(
            (verdict.verdict == fgos_resource_referee::VerdictKind::Reject)
                .then(|| "resource-held".into()),
        )
    }
}
impl sources::Resolver for KeeperPlayers<'_> {
    fn actor(&self, record: &keeper::Record) -> keeper::ActorState {
        use sources::Heads;
        let Some(need) = &record.needs else {
            return keeper::ActorState::NotLive;
        };
        match need.kind {
            keeper::NeedKind::Role => self.state(&need.reference),
            keeper::NeedKind::Capability => {
                let settings = wake_settings(&self.root);
                sources::capability_actor(
                    record,
                    self.starts.get(&record.key()).copied(),
                    now_secs().max(0) as u64,
                    settings
                        .active_interval_sec
                        .saturating_mul(settings.overdue_factor)
                        .max(0) as u64,
                )
            }
            keeper::NeedKind::Actor => match self.actor(&need.reference) {
                Ok(Some(holder)) => {
                    let ours = wake::Project::project(&HostProject {
                        root: self.root.clone(),
                    });
                    if holder.liveness == fgos_identity::Liveness::Alive
                        && ours.is_some_and(|p| Some(p.id) == holder.project_id)
                    {
                        keeper::ActorState::Live
                    } else {
                        keeper::ActorState::Unknown
                    }
                }
                Ok(None) => self
                    .successor(&need.reference)
                    .map(|(persona, name)| self.state(&format!("head:{persona}-{name}")))
                    .unwrap_or(keeper::ActorState::Unknown),
                _ => keeper::ActorState::Unknown,
            },
        }
    }
    fn answered(&self, question: &str) -> bool {
        use fgos_questions::store::{fold, LogOpener, State};
        let Ok(Some(log)) = super::questions::HostLogOpener::reader().open(&self.root) else {
            return false;
        };
        let Ok(events) = log.read() else {
            return false;
        };
        fold(&events)
            .get(question)
            .is_some_and(|q| matches!(q.state, State::Answered | State::Acked))
    }
    fn start_hold(&self, record: &keeper::Record) -> Result<Option<String>, String> {
        if let Some(reason) = self.resource_hold()? {
            return Ok(Some(reason));
        }
        let lead = record.needs.as_ref().is_some_and(|n| match n.kind {
            keeper::NeedKind::Role => {
                head_target(&n.reference).is_some_and(|(persona, _)| persona == "lead")
            }
            keeper::NeedKind::Actor => self
                .successor(&n.reference)
                .is_some_and(|(persona, _)| persona == "lead"),
            keeper::NeedKind::Capability => false,
        });
        if lead {
            let max = required_capacity(&self.root, "supervisor.maxLeads")?;
            let project = wake::Project::project(&HostProject {
                root: self.root.clone(),
            })
            .ok_or("project-id-missing")?;
            let plans = HostPortfolio {
                root: self.root.clone(),
            }
            .read()?;
            let identity = HostIdentity {
                root: self.root.clone(),
            };
            let roles = wake::Identity::lead_roles(&identity, &project.id)?;
            let counts = supervisor::lead_counts(
                &plans,
                &roles,
                &project.id,
                &|role| {
                    if self.started.borrow().contains(role) {
                        wake::Holder::Unknown
                    } else {
                        wake::Identity::holder(&identity, role)
                    }
                },
                &StoreOpenQuestions {
                    root: self.root.clone(),
                },
            );
            return Ok(self.claim_lead_slot(counts.0, max));
        }
        Ok(None)
    }
}
fn capability_run_args(decision: &keeper::Decision, capability: &str) -> Vec<String> {
    vec![
        "run".into(),
        format!(
            "Perform activity {} of case {} using its approved frame and activity binding.",
            decision.step, decision.item
        ),
        "--case".into(),
        decision.item.clone(),
        "--activity".into(),
        decision.step.clone(),
        "--capability".into(),
        capability.into(),
        "--json".into(),
    ]
}

impl keeper::Players for KeeperPlayers<'_> {
    fn start(&self, decision: &keeper::Decision, need: &keeper::Need) -> Result<(), String> {
        // Snapshot supplied referee facts before the keeper chose Start. Only the keeper
        // decides a hold; the run door still acquires the actual lane atomically.
        match need.kind {
            keeper::NeedKind::Role | keeper::NeedKind::Actor => {
                let (persona, name) = self
                    .successor(&need.reference)
                    .ok_or("keeper-successor-unknown")?;
                wake::StartSession::start(
                    &HostStart {
                        root: self.root.clone(),
                        started: self.started,
                    },
                    &persona,
                    &name,
                )
            }
            keeper::NeedKind::Capability => {
                self.start_run(&capability_run_args(decision, &need.reference))
            }
        }
    }
    fn wake(&self, decision: &keeper::Decision, need: &keeper::Need) -> Result<(), String> {
        let target =
            if need.kind == keeper::NeedKind::Actor && self.actor(&need.reference)?.is_none() {
                let (persona, name) = self
                    .successor(&need.reference)
                    .ok_or("keeper-successor-unknown")?;
                format!("head:{persona}-{name}")
            } else {
                need.reference.clone()
            };
        self.command(&[
            "mailbox".into(),
            "send".into(),
            format!(
                "keeper: {}:{} is actionable; read its source before acting.",
                decision.item, decision.step
            ),
            "--to".into(),
            target,
            "--wake".into(),
            "--json".into(),
        ])
    }
}

struct KeeperSnapshot<'a> {
    root: PathBuf,
    history: &'a KeeperHistory,
    started: &'a RefCell<BTreeSet<String>>,
}
impl keeper::Snapshot for KeeperSnapshot<'_> {
    fn read(&self) -> Result<(Vec<keeper::Input>, keeper::Caps), String> {
        use keeper::History;
        let past = self.history.snapshot()?;
        let players = KeeperPlayers {
            root: self.root.clone(),
            started: self.started,
            host: host_binary(),
            lead_claims: Cell::new(0),
            starts: past.starts,
        };
        let plans = HostPortfolio {
            root: self.root.clone(),
        }
        .read();
        let plan_source = plans.as_ref().ok().map(|plans| sources::Plans {
            plans,
            heads: &players,
        });
        let names = config_strings(&self.root, "watcher.schedulingSources");
        let cases = if names.iter().any(|n| n == "workflow-cases") {
            (|| {
                // No case root means no records. Reuse Execution's path door and avoid a
                // Node process on projects that have never opened a case; unreadable is not empty.
                let runs = fgos_execution::case_paths::runs_root(&self.root.join(".fgos"));
                match std::fs::symlink_metadata(runs) {
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                        return Ok(sources::WorkflowCases {
                            records: vec![],
                            closed_items: vec![],
                        })
                    }
                    Err(e) => return Err(sources::SourceError(e.to_string())),
                    Ok(_) => {}
                }
                let out = Command::new(host_binary())
                    .args(["workflow", "records", "--json"])
                    .current_dir(&self.root)
                    .stdin(Stdio::null())
                    .output()
                    .map_err(|e| sources::SourceError(e.to_string()))?;
                if !out.status.success() {
                    return Err(sources::SourceError("workflow-records-failed".into()));
                }
                let answer: Value = serde_json::from_slice(&out.stdout)
                    .map_err(|e| sources::SourceError(e.to_string()))?;
                serde_json::from_value::<sources::WorkflowCases>(
                    answer.get("data").cloned().unwrap_or(answer),
                )
                .map_err(|e| sources::SourceError(e.to_string()))
            })()
        } else {
            Err(sources::SourceError("not-configured".into()))
        };
        let registered = names
            .iter()
            .map(|name| {
                let source: Result<&dyn sources::Source, sources::SourceError> = match name.as_str()
                {
                    "plans" => plan_source
                        .as_ref()
                        .map(|s| s as &dyn sources::Source)
                        .ok_or_else(|| sources::SourceError("plans-unavailable".into())),
                    "workflow-cases" => cases
                        .as_ref()
                        .map(|s| s as &dyn sources::Source)
                        .map_err(Clone::clone),
                    _ => Err(sources::SourceError("source-unknown".into())),
                };
                (name.as_str(), source)
            })
            .collect::<Vec<_>>();
        let capacity = wake::Admission::capacity(&HostAdmission {
            root: self.root.clone(),
        })?;
        let remaining = capacity
            .free_lanes
            .saturating_sub(self.started.borrow().len());
        let result = sources::collect_records(&registered, &players, remaining)?;
        for decision in
            sources::source_status_decisions(&names, &result.unavailable, &past.decisions)
        {
            self.history.record(&decision)?;
        }
        Ok((result.inputs, result.caps))
    }
}

/// Local query environment: no new global Observe source or config defaults. The review
/// snapshot is measured afresh only when a definition requests its kind.
struct ReviewEnvironment {
    payload_root: PayloadRoot,
}
impl fgos_observe::metrics_cli::RecordEnvironment for ReviewEnvironment {
    fn embedded_declarations(&self) -> Vec<fgos_observe::record::registry::EmbeddedDeclaration> {
        let mut declarations = super::observe_declarations::embedded_declarations();
        declarations.push(watcher::REVIEW_DECLARATION);
        declarations
    }
    fn payload_root(&self) -> Option<PathBuf> {
        (self.payload_root)().ok()
    }
    fn record_sources(&self) -> Vec<Box<dyn fgos_observe::RecordSource>> {
        let mut sources = super::observe_query::HostRecordEnvironment {
            payload_root: self.payload_root,
        }
        .record_sources();
        sources.push(Box::new(ReviewSource));
        sources
    }
    fn config_number(&self, root: &Path, key: &str) -> Result<Option<f64>, String> {
        super::observe_query::HostRecordEnvironment {
            payload_root: self.payload_root,
        }
        .config_number(root, key)
    }
}

#[cfg(unix)]
fn local_offset_seconds(unix_secs: i64) -> i32 {
    unsafe {
        let secs = unix_secs as libc::time_t;
        let mut tm: libc::tm = std::mem::zeroed();
        if libc::localtime_r(&secs, &mut tm).is_null() {
            0
        } else {
            tm.tm_gmtoff.try_into().unwrap_or(0)
        }
    }
}

#[cfg(not(unix))]
fn local_offset_seconds(_unix_secs: i64) -> i32 {
    0
}

fn review_state_from_portfolio_and_events(
    last_done: Option<&str>,
    plans: &[Plan],
    open_questions: bool,
    latest_event: Option<&str>,
) -> Record {
    let open_plan = plans
        .iter()
        .any(|p| !matches!(p.status.as_str(), "done" | "withdrawn"));
    let new_event = latest_event.is_some_and(|ts| {
        fgos_host_runtime::civil_time::parse_rfc3339_millis(ts)
            > last_done.and_then(fgos_host_runtime::civil_time::parse_rfc3339_millis)
    });
    watcher::review_state_record(last_done, open_plan || open_questions, new_event)
}

/// One warning line naming every plan the review could not read, or `None` when all were read.
fn refused_plans_warning(refusals: &[Value]) -> Option<String> {
    let named: Vec<String> = refusals
        .iter()
        .map(|r| {
            format!(
                "{} ({})",
                r["dir"].as_str().unwrap_or("?"),
                r["code"].as_str().unwrap_or("?")
            )
        })
        .collect();
    (!named.is_empty()).then(|| format!("review-source: plans refused: {}", named.join(", ")))
}

struct ReviewSource;
impl fgos_observe::RecordSource for ReviewSource {
    fn source_id(&self) -> &'static str {
        "supervision-review"
    }
    fn kinds(&self) -> &[&str] {
        &["fgos.review.state"]
    }
    fn records(
        &self,
        root: &Path,
        _: &fgos_observe::Window,
    ) -> Result<Vec<Record>, fgos_observe::SourceError> {
        let read = || -> Result<Vec<Record>, String> {
            use fgos_questions::store::{fold, LogOpener, State};
            let last = fgos_observe::record::store::RecordStoreSource
                .records(root, &fgos_observe::Window::default())
                .map_err(|e| e.to_string())?
                .into_iter()
                .filter(|r| r.kind == "fgos.review.done")
                .max_by_key(|r| fgos_host_runtime::civil_time::parse_rfc3339_millis(&r.ts));
            let (plans, refusals) = HostPortfolio {
                root: root.to_path_buf(),
            }
            .read_with_refusals()?;
            if let Some(warning) = refused_plans_warning(&refusals) {
                eprintln!("{warning}");
            }
            let open_question = match super::questions::HostLogOpener::reader()
                .open(root)
                .map_err(|e| e.to_string())?
            {
                Some(log) => fold(&log.read().map_err(|e| e.to_string())?)
                    .questions()
                    .any(|q| q.state == State::Open),
                None => false,
            };
            let history = KeeperHistory {
                root: root.to_path_buf(),
            }
            .snapshot()?;
            let last_ts = last.as_ref().map(|r| r.ts.as_str());
            Ok(vec![review_state_from_portfolio_and_events(
                last_ts,
                &plans,
                open_question,
                history.latest_event.as_deref(),
            )])
        };
        read().map_err(|message| fgos_observe::SourceError::ReadFailed {
            source_id: "supervision-review",
            message,
        })
    }
}

struct HostReview {
    root: PathBuf,
    payload_root: PayloadRoot,
}

impl HostReview {
    fn log_path(&self, started_at: i64) -> PathBuf {
        self.root
            .join(format!(".fgos/runtime/watcher/review-{started_at}.log"))
    }

    #[cfg(unix)]
    fn start_run(&self, args: &[String], log: &Path) -> Result<(), String> {
        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let mut argv = vec![exe.into_os_string()];
        argv.extend(args.iter().map(std::ffi::OsString::from));
        let parent = log.parent().ok_or("review-log-parent-missing")?;
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        fgos_process::mapped::spawn_detached(&argv, &self.root, &[], &[], Some(log))
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    #[cfg(not(unix))]
    fn start_run(&self, _: &[String], _: &Path) -> Result<(), String> {
        Err("review-detached-start-unsupported".into())
    }
}

/// The JSON object `fgos run --json` printed: the last log line that parses as an object
/// carrying an outcome. Stderr lines around it are ignored.
fn run_answer(log: &str) -> Option<Value> {
    log.lines().rev().find_map(|line| {
        let value = serde_json::from_str::<Value>(line.trim()).ok()?;
        let data = value.get("data").unwrap_or(&value);
        (data.is_object() && data.get("outcome").is_some()).then(|| data.clone())
    })
}

impl watcher::Review for HostReview {
    fn in_flight_bound_sec(&self) -> i64 {
        let idle = config_int(&self.root, "watcher.idleIntervalSec", 900);
        let run_timeout = config_int(&self.root, "runner.timeoutMs", 900_000) / 1000;
        let ticks = idle * config_int(&self.root, "watcher.overdueFactor", 3);
        run_timeout.max(ticks) + idle
    }

    fn start(&self, started_at: i64) -> Result<(), String> {
        let definitions = QueryDefinitions {
            root: self.root.clone(),
            payload_root: self.payload_root,
        };
        let path = definitions
            .resolve(watcher::REVIEW_BRIEF)
            .ok_or("review-brief-missing")?;
        let brief = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
        self.start_run(&watcher::review_run_args(&brief), &self.log_path(started_at))
    }

    fn settled(
        &self,
        started_at: i64,
        expired: bool,
    ) -> Result<watcher::ReviewSettlement, String> {
        use watcher::ReviewSettlement::{Failed, Running, Settled};
        let log_path = self.log_path(started_at);
        let failed = || {
            let _ = std::fs::remove_file(&log_path);
            Ok(Failed)
        };
        let text = std::fs::read(&log_path)
            .map(|bytes| String::from_utf8_lossy(&bytes).into_owned())
            .unwrap_or_default();
        let Some(data) = run_answer(&text) else {
            return if expired { failed() } else { Ok(Running) };
        };
        if data["outcome"] != "pass" {
            return failed();
        }
        let Some(id) = data["unitRunId"].as_str().filter(|id| !id.is_empty()) else {
            return failed();
        };
        let Some(report) = data["results"]
            .as_array()
            .and_then(|results| results.last())
            .and_then(|result| result["runResult"]["agentClaim"]["summary"].as_str())
            .filter(|text| !text.trim().is_empty())
        else {
            return failed();
        };
        let slug = format!("periodic-review-{id}");
        let now = now_secs();
        let destination = fgos_convention::convention_path(
            &fgos_convention::NameInput {
                kind: "report",
                artifact_type: Some("review"),
                slug: &slug,
                at: None,
                now_millis: now * 1000,
                local_offset_seconds: local_offset_seconds(now),
            },
            None,
        )
        .map_err(|e| e.to_string())?;
        let path = self.root.join(destination.path);
        let parent = path.parent().ok_or("review-report-parent-missing")?;
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        fgos_durable_file::replace_durably(
            parent,
            path.file_name()
                .and_then(|s| s.to_str())
                .ok_or("review-report-name-invalid")?,
            report.as_bytes(),
        )
        .map_err(|e| e.to_string())?;
        Ok(Settled(id.to_owned()))
    }

    fn done(&self, started_at: i64, unit_run_id: &str) -> Result<(), String> {
        let mut declarations = super::observe_declarations::embedded_declarations();
        declarations.push(watcher::REVIEW_DECLARATION);
        let door = RecordDoor::new(self.root.clone(), declarations, (self.payload_root)().ok());
        let record = span_record(
            "fgos.review.done",
            SubjectRef {
                kind: "run".into(),
                id: unit_run_id.into(),
            },
            vec![("fgos.review.unitRunId", unit_run_id.into())],
            vec![],
        );
        use fgos_observe::record::store::WriteOutcome::{Duplicate, Written};
        match door.write(record) {
            Written | Duplicate => {
                let _ = std::fs::remove_file(self.log_path(started_at));
                Ok(())
            }
            other => Err(format!("review-done-write-failed: {other:?}")),
        }
    }
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
    let review = HostReview {
        root: root.to_path_buf(),
        payload_root,
    };
    let ports = watcher::Ports {
        fetch: &fetch,
        definitions: &definitions,
        wake: &wake_adapter,
        review: &review,
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

fn is_machine_code(text: &str) -> bool {
    !text.is_empty()
        && text
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-' || c == '_')
}

fn worktree_removal_refusal_code(refusal: &CategorisedRefusal) -> String {
    if refusal.category != "unexpected" {
        refusal.category.to_string()
    } else if is_machine_code(&refusal.message) {
        refusal.message.clone()
    } else {
        refusal.category.to_string()
    }
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
    let index =
        |root: &Path, committing: &[String]| backlog_index(&driver, &repo, root, committing);
    let remove_worktree = |path: &Path, target: &str| -> Result<(), String> {
        let request = super::worktree::WorktreeRequest::Remove {
            cwd: main.clone(),
            path: path.to_string_lossy().into_owned(),
            delivered_to: target.to_owned(),
            discard_ignored: true,
        };
        super::worktree::run(&request)
            .map(|_| ())
            .map_err(|refusal| worktree_removal_refusal_code(&refusal))
    };
    let ports = LandPorts {
        git: &driver,
        repo: &repo,
        remote: &grant,
        writer: &writer,
        operation_id: &next,
        runner: &ShellRunner,
        log_dir: &log_dir,
        wait_ms: 30_000,
        backlog_index: Some(BacklogPort {
            classify: &super::portfolio::classify_backlog_ref,
            index: &index,
        }),
        worktree_removal: Some(&remove_worktree),
    };
    let landed =
        land(command, &config, &ports).map_err(|why| refused(&why.code, why.detail_with_note()))?;
    let mut outcome_json = json!({
        "mainSha": landed.main_sha,
        "landedPaths": landed.landed_paths,
        "retries": landed.retries,
        "gatesRun": landed.gates_run,
        "worktreesRemoved": landed.worktrees_removed,
        "worktreesKept": landed.worktrees_kept.iter().map(|k| json!({
            "path": k.path,
            "code": k.code,
        })).collect::<Vec<_>>(),
    });
    if let Some(err) = &landed.worktree_list_error {
        outcome_json["worktreeListError"] = json!(err);
    }
    Ok(outcome_json)
}

/// The backlog index a land commits: the one generator every index write uses, over the items Git
/// tracks plus the paths being committed, refusing on errors.
fn backlog_index(
    driver: &GitDriver,
    repo: &RepoHandle,
    root: &Path,
    committing: &[String],
) -> Result<String, String> {
    use super::portfolio::{
        generate_backlog_index_for_commit, tracked_item_paths, CommitIndexError,
    };
    let tracked = tracked_item_paths(driver, repo)
        .map_err(|cause| format!("write-status-unreadable: {cause}"))?;
    generate_backlog_index_for_commit(root, &tracked, committing).map_err(|why| match why {
        CommitIndexError::Unreadable(why) | CommitIndexError::Invalid(why) => why,
    })
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
            let max_leads = required_capacity(root, "supervisor.maxLeads")
                .map_err(|e| refused("supervisor-config-invalid", e))?;
            let view = supervisor::plans(
                &plans,
                &HostPortfolio::done(&plans),
                &project.handle,
                &project.id,
                &|role| {
                    wake::Identity::holder(
                        &HostIdentity {
                            root: root.to_path_buf(),
                        },
                        role,
                    )
                },
                max_leads,
                &StoreOpenQuestions {
                    root: root.to_path_buf(),
                },
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

    // The watcher owns retry semantics; this boundary proof owns the real run-door argv,
    // settlement parsing and the done record's persisted unit id.
    #[cfg(unix)]
    #[test]
    fn the_review_action_calls_an_independent_read_only_run_and_records_its_settled_unit_id() {
        use fgos_observe::RecordSource;
        use watcher::Review;
        fn no_payload() -> Result<PathBuf, String> {
            Err("no payload".into())
        }
        let root = scratch_root("periodic-review");
        let brief = root.join(watcher::REVIEW_BRIEF);
        std::fs::create_dir_all(brief.parent().unwrap()).unwrap();
        std::fs::write(&brief, "fixed independent review brief").unwrap();
        let review = HostReview {
            root: root.clone(),
            payload_root: no_payload,
        };
        assert_eq!(
            watcher::review_run_args("fixed independent review brief"),
            [
                "run",
                "fixed independent review brief",
                "--capability",
                "review",
                "--json"
            ]
        );
        assert_eq!(
            action_of("start-review"),
            Some(watcher::Action::StartReview)
        );
        // Before settle, settled() is None
        use watcher::ReviewSettlement::{Failed, Running, Settled};
        assert_eq!(review.settled(1000, false).unwrap(), Running);
        assert_eq!(
            review.settled(1000, true).unwrap(),
            Failed,
            "a run with no log past the bound failed"
        );

        // Simulate settled review output in the run's own log, with stderr lines around it:
        let log_dir = root.join(".fgos/runtime/watcher");
        std::fs::create_dir_all(&log_dir).unwrap();
        let result = json!({"data": {"outcome": "pass", "unitRunId": "review-unit-1",
            "results": [{"runResult": {"agentClaim": {"summary": "# Review\nNo actionable findings."}}}]}});
        let own_log = log_dir.join("review-1000.log");
        std::fs::write(&own_log, format!("warning: slow\n{result}\ntrailing stderr\n")).unwrap();
        // Another start's log never settles this one.
        std::fs::write(log_dir.join("review-2000.log"), "stderr only\n").unwrap();

        let Settled(id) = review.settled(1000, false).unwrap() else {
            panic!("the log's JSON object settles the run");
        };
        assert_eq!(id, "review-unit-1");
        assert!(own_log.exists(), "the log stays until done is recorded");

        let reports: Vec<_> = std::fs::read_dir(root.join("plans/reports"))
            .unwrap()
            .map(|entry| entry.unwrap().path())
            .collect();
        assert_eq!(reports.len(), 1);
        let relative = reports[0]
            .strip_prefix(&root)
            .unwrap()
            .to_str()
            .unwrap()
            .to_owned();
        assert!(fgos_convention::check_paths(&[relative])
            .unwrap()
            .violations
            .is_empty());
        assert_eq!(
            std::fs::read_to_string(&reports[0]).unwrap(),
            "# Review\nNo actionable findings."
        );
        review.done(1000, &id).unwrap();
        assert!(!own_log.exists(), "done removes the run's log");
        review.done(1000, &id).unwrap();
        let records = fgos_observe::record::store::RecordStoreSource
            .records(&root, &fgos_observe::Window::default())
            .unwrap();
        let done: Vec<_> = records
            .iter()
            .filter(|r| r.kind == "fgos.review.done")
            .collect();
        assert!(!done.is_empty());
        assert_eq!(done[0].subject.id, "review-unit-1");
        assert_eq!(done[0].attrs["fgos.review.unitRunId"], AttrValue::Str(id));

        // A failed outcome or missing unitRunId settles without reporting pass.
        for answer in [
            r#"{"outcome":"fail","unitRunId":"bad"}"#,
            r#"{"outcome":"pass"}"#,
            r#"{"outcome":"pass","unitRunId":"without-report"}"#,
        ] {
            std::fs::write(&own_log, format!("noise\n{answer}\n")).unwrap();
            assert_eq!(review.settled(1000, false).unwrap(), Failed);
            assert!(!own_log.exists(), "a failed review removes its log");
        }

        // A crash with no JSON stays running inside the bound and fails past it.
        std::fs::write(&own_log, "thread panicked\n").unwrap();
        assert_eq!(review.settled(1000, false).unwrap(), Running);
        assert!(own_log.exists());
        assert_eq!(review.settled(1000, true).unwrap(), Failed);
        assert!(!own_log.exists());
    }

    #[test]
    fn review_source_inputs_cover_open_plan_open_question_new_event_and_refused_plan() {
        let last_done = Some("2026-11-16T12:00:00.000Z");

        // 1. Open plan makes review pending
        fn plan(dir: &str, status: &str) -> Plan {
            Plan {
                dir: dir.into(),
                title: dir.to_uppercase(),
                status: status.into(),
                priority: "P1".into(),
                created: "2026-11-01".into(),
                blocked_by: vec![],
                footprint: vec![],
                source: vec![],
                lead: None,
                phases: vec![],
            }
        }
        let open_plans = vec![plan("p1", "ready")];
        let r1 = review_state_from_portfolio_and_events(last_done, &open_plans, false, None);
        assert_eq!(r1.measures["fgos.review.pending"], 1.into());

        // 2. Only done/withdrawn plans, but open question makes review pending
        let done_plans = vec![plan("p1", "done"), plan("p2", "withdrawn")];

        // A refused plan is named in one warning line, never dropped silently.
        let refused = vec![
            json!({"dir": "broken-plan", "code": "plan-not-utf8", "detail": "plan.md is not UTF-8"}),
        ];
        let warning = refused_plans_warning(&refused).expect("a warning for the refused plan");
        assert!(warning.contains("broken-plan") && warning.contains("plan-not-utf8"));
        assert_eq!(refused_plans_warning(&[]), None);
        let r2 = review_state_from_portfolio_and_events(last_done, &done_plans, true, None);
        assert_eq!(r2.measures["fgos.review.pending"], 1.into());

        // 3. Only done plans, no open question, but newer event makes review pending
        let newer_event = Some("2026-11-17T12:00:00.000Z");
        let r3 = review_state_from_portfolio_and_events(last_done, &done_plans, false, newer_event);
        assert_eq!(r3.measures["fgos.review.pending"], 1.into());

        // 4. Older event (before last_done) on quiet project does not make review pending
        let older_event = Some("2026-11-15T12:00:00.000Z");
        let r4 = review_state_from_portfolio_and_events(last_done, &done_plans, false, older_event);
        assert_eq!(r4.measures["fgos.review.pending"], 0.into());

        // 5. Completely quiet project (no open plan, no open question, no new event): pending = 0
        let r5 = review_state_from_portfolio_and_events(last_done, &done_plans, false, None);
        assert_eq!(r5.measures["fgos.review.pending"], 0.into());

        // 6. First review ever (no last_done): always pending
        let r6 = review_state_from_portfolio_and_events(None, &[], false, None);
        assert_eq!(r6.measures["fgos.review.pending"], 1.into());
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

    // Invoked only as a detached child of the wiring proof below. Its release file
    // makes waiting for completion observable without running a real Unit.
    #[cfg(unix)]
    #[test]
    #[ignore = "detached subprocess fixture"]
    fn keeper_detached_run_fixture() {
        use std::io::Write;
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(5);
        while !Path::new("release").exists() {
            assert!(std::time::Instant::now() < deadline, "fixture not released");
            std::thread::sleep(std::time::Duration::from_millis(10));
        }
        writeln!(
            std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open("ended")
                .unwrap(),
            "done"
        )
        .unwrap();
    }

    #[cfg(unix)]
    #[test]
    fn keeper_source_facts_reach_the_host_doors_without_restarting_a_pending_head() {
        use keeper::{Players, Snapshot};
        use sources::{Heads, Source};
        use std::os::unix::fs::PermissionsExt;
        let root = scratch_root("keeper-doors");
        let host = root.join("host.mjs");
        std::fs::write(&host, "#!/usr/bin/env node\nimport fs from 'node:fs'; fs.appendFileSync('calls.jsonl', JSON.stringify(process.argv.slice(2))+'\\n');\n").unwrap();
        std::fs::set_permissions(&host, std::fs::Permissions::from_mode(0o755)).unwrap();
        let started = RefCell::new(BTreeSet::from(["head:lead-pending".into()]));
        let players = KeeperPlayers {
            root: root.clone(),
            started: &started,
            host,
            lead_claims: Cell::new(0),
            starts: BTreeMap::new(),
        };
        assert_eq!(
            players.state("head:lead-pending"),
            keeper::ActorState::Unknown
        );
        let pending_actor = keeper::Record {
            item: "case-pending".into(),
            step: "lead".into(),
            needs: Some(keeper::Need {
                kind: keeper::NeedKind::Actor,
                reference: "head:lead-pending".into(),
                max_rounds: None,
            }),
            waiting_on: None,
            outcome: None,
        };
        assert_eq!(
            sources::Resolver::actor(&players, &pending_actor),
            keeper::ActorState::Unknown
        );
        // Admission's occupied slots and this snapshot's candidate claims share the same cap.
        assert_eq!(players.claim_lead_slot(3, 4), None);
        assert_eq!(players.claim_lead_slot(3, 4).as_deref(), Some("lead-cap"));
        players.lead_claims.set(0);
        assert_eq!(players.claim_lead_slot(4, 4).as_deref(), Some("lead-cap"));
        assert_eq!(players.lead_claims.get(), 0);
        assert!(head_target("head:../lead-escape").is_none());
        let dir = root.join(".fgos/runtime/session-rotation/lead-sleeping");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(
            dir.join("placement.json"),
            r#"{"retiredReason":"sleep","wakeAt":"2026-12-01T09:00:00Z"}"#,
        )
        .unwrap();
        assert_eq!(
            players.sleep_until("head:lead-sleeping").as_deref(),
            Some("2026-12-01T09:00:00Z")
        );
        let source: sources::WorkflowCases = serde_json::from_value(json!({"records": [
            {"item": "case-one", "step": "left", "needs": {"kind": "capability", "ref": "review"}},
            {"item": "case-one", "step": "right", "needs": {"kind": "capability", "ref": "advise"}}
        ], "closedItems": []}))
        .unwrap();
        let records = source.records().unwrap();
        let inputs = records
            .iter()
            .map(|record| keeper::Input {
                record: record.clone(),
                actor: keeper::ActorState::NotLive,
                item_closed: false,
            })
            .collect::<Vec<_>>();
        let decisions = keeper::decide(
            &inputs,
            100,
            &[],
            &keeper::Caps {
                starts: 2,
                held: BTreeMap::new(),
            },
        );
        let before = std::time::Instant::now();
        let run_args = decisions
            .iter()
            .zip(&records)
            .map(|(decision, record)| {
                capability_run_args(decision, &record.needs.as_ref().unwrap().reference)
            })
            .collect::<Vec<_>>();
        // current_exe is the test harness here: run a waiting fixture through the
        // same detached door, not the synchronous command's injected executable.
        for _ in &decisions {
            players
                .start_run(&[
                    "--ignored".into(),
                    "--exact".into(),
                    "wiring::supervision::tests::keeper_detached_run_fixture".into(),
                ])
                .unwrap();
        }
        std::fs::write(root.join("release"), "").unwrap();
        assert!(
            before.elapsed() < std::time::Duration::from_secs(2),
            "starts waited for Unit completion"
        );
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(5);
        while std::fs::read_to_string(root.join("ended"))
            .unwrap_or_default()
            .lines()
            .count()
            < 2
        {
            assert!(
                std::time::Instant::now() < deadline,
                "detached runs did not finish"
            );
            std::thread::sleep(std::time::Duration::from_millis(10));
        }
        players
            .wake(
                &decisions[0],
                &keeper::Need {
                    kind: keeper::NeedKind::Actor,
                    reference: "head:lead-pending".into(),
                    max_rounds: None,
                },
            )
            .unwrap();
        let calls = std::fs::read_to_string(root.join("calls.jsonl"))
            .unwrap()
            .lines()
            .map(|line| serde_json::from_str::<Vec<String>>(line).unwrap())
            .collect::<Vec<_>>();
        assert_eq!(calls.len(), 1);
        for step in ["left", "right"] {
            let call = run_args
                .iter()
                .find(|call| call.windows(2).any(|args| args == ["--activity", step]))
                .unwrap();
            assert_eq!(call[0], "run");
            assert!(call.windows(2).any(|args| args == ["--case", "case-one"]));
            assert!(call.windows(2).any(|args| args == ["--activity", step]));
        }
        assert_eq!(calls[0][0..2], ["mailbox", "send"]);
        assert!(calls[0].iter().any(|a| a == "--wake"));
        // The production snapshot implements the existing keeper seam, not a second scheduler.
        let _: &dyn Snapshot = &KeeperSnapshot {
            root,
            history: &KeeperHistory {
                root: PathBuf::new(),
            },
            started: &started,
        };
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
    fn a_short_role_lead_is_stopped_by_role_and_a_head_lead_by_persona_and_name() {
        assert_eq!(
            stop_argv("lead", "lead:S1"),
            ["session", "stop", "--role", "lead:S1", "--json"]
        );
        assert_eq!(
            stop_argv("lead", "demo-x"),
            ["session", "stop", "lead", "--name", "demo-x", "--json"]
        );
    }

    #[test]
    fn a_short_role_nobody_holds_is_unknown_never_idle() {
        let activity = short_role_activity(
            Path::new("/nonexistent-root"),
            "lead:NOBODY-HOLDS-THIS",
            |_, _| wake::Activity::Idle,
        );
        assert_eq!(activity, wake::Activity::Unknown);
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

    #[test]
    fn worktree_removal_refusal_code_maps_refusals_to_short_machine_codes() {
        let git_dirty = CategorisedRefusal::unexpected("worktree-dirty-preserved");
        assert_eq!(
            worktree_removal_refusal_code(&git_dirty),
            "worktree-dirty-preserved"
        );

        let git_unproven = CategorisedRefusal::unexpected("worktree-delivery-unproven");
        assert_eq!(
            worktree_removal_refusal_code(&git_unproven),
            "worktree-delivery-unproven"
        );

        let lock = CategorisedRefusal::new("lock-timeout", "admin lock held by pid 123");
        assert_eq!(worktree_removal_refusal_code(&lock), "lock-timeout");

        let validation = CategorisedRefusal::new("validation", "something is invalid");
        assert_eq!(worktree_removal_refusal_code(&validation), "validation");

        let unexpected_sentence = CategorisedRefusal::unexpected(
            "worktree remove: --delivered-to target does not name an existing branch",
        );
        assert_eq!(
            worktree_removal_refusal_code(&unexpected_sentence),
            "unexpected"
        );

        let io_error = CategorisedRefusal::unexpected(
            "setting aside .env: No such file or directory (os error 2)",
        );
        assert_eq!(worktree_removal_refusal_code(&io_error), "unexpected");
    }
}
