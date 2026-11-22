//! The terminal doctor rows: what the terminal-control driver (herdr) says about this machine, and what the
//! executors dispatched through a herdr pane need from it. The route is asked in process, through the one door
//! the `terminal-control` route builds its core by (`crate::wiring::terminal_route`); the judgements are pure functions over what it
//! answered, so a fake route proves each of them.
//!
//! Every row reads. `terminal-allocations` is a pointer: it counts, names the verb, and closes nothing.

use super::{judged, project_root_refusal, Rows};
use crate::wiring::dispatch_decide::HostWorkspace;
use crate::wiring::process_env;
use crate::wiring::terminal_route::HostRoute;
use fgos_distribution::doctor::FixResult;
use fgos_distribution::doctor::{timed, RowOutcome};
use fgos_execution::decide::{check_loaded_runner, Workspace};
use fgos_terminal_control::port::{
    AnchorPane, CapabilitiesAsk, CapabilitiesReport, Finding, Refusal,
};
use serde_json::{json, Map, Value};
use std::path::Path;

pub const ROWS: &[&str] = &[
    "terminal-control",
    "terminal-allocations",
    "herdr-executor-kinds",
];

pub const FIXES: &[&str] = &[];

pub const GROUP: Rows = Rows {
    rows: ROWS,
    fixes: FIXES,
    judge,
    fix,
};

fn fix(_root: &Path, _ids: &[&str]) -> Vec<FixResult> {
    Vec::new()
}

/// `agent start`'s own documented default: how long a launched agent gets to become ready. `terminal.allocationGraceMs`
/// must stay larger than this by [`GRACE_MARGIN_MS`].
const READY_TIMEOUT_MS: u64 = 30_000;
const GRACE_MARGIN_MS: u64 = 30_000;

/// Every `terminal.*` setting, as its dotted path in the `terminal` section.
const SETTINGS: [&str; 6] = [
    "allocationGraceMs",
    "retainFailedPaneMs",
    "layout.policy",
    "layout.minCols",
    "layout.minRows",
    "layout.maxPanesPerTab",
];

/// herdr calls the Antigravity CLI `agy` when starting an agent but `antigravity-cli` when installing its
/// integration hook: the same tool under two spellings.
fn integration_name(kind: &str) -> &str {
    if kind == "agy" {
        "antigravity-cli"
    } else {
        kind
    }
}

// ---- the route ---------------------------------------------------------------------------------------------

/// What asking the route for its capabilities ended in.
pub enum Asked {
    Report(Box<CapabilitiesReport>),
    /// The core refused the layout it was handed: the route's code and words.
    ConfigRefused {
        code: String,
        message: String,
    },
}

/// The terminal-control route, as the rows ask it.
pub trait Route {
    /// `config` is the route's flat settings (the explicitly set ones); `agents` also reads the agent kinds and
    /// the integration hook states.
    fn capabilities(&self, config: &Value, anchor: Option<&str>, agents: bool) -> Asked;
    fn reconcile_scan(&self, older_than_ms: u64) -> Result<Vec<Finding>, ScanFault>;
}

/// Why an allocation scan gave no findings: the core could not be built, or it answered without a scan.
#[derive(Debug, Clone)]
pub enum ScanFault {
    NotAnswered(String),
    Refused(Refusal),
}

/// The route of this machine, with the anchor pane the doctor was run from (if any) in its endpoint.
fn host_route(env: &[(String, String)], anchor: Option<&str>) -> HostRoute {
    let lookup = |key: &str| {
        env.iter()
            .find(|(k, _)| k == key)
            .map(|(_, value)| value.clone())
    };
    let mut route_env = Map::new();
    if let Some(pane) = anchor.filter(|pane| !pane.is_empty()) {
        route_env.insert("FGOS_HERDR_ANCHOR_PANE".into(), json!(pane));
    }
    HostRoute::new(route_env, &lookup)
}

impl Route for HostRoute {
    fn capabilities(&self, config: &Value, anchor: Option<&str>, agents: bool) -> Asked {
        match self.parts(config) {
            Err(refusal) => Asked::ConfigRefused {
                code: refusal.code.to_owned(),
                message: refusal.message,
            },
            Ok(parts) => {
                let report = parts.core().capabilities(CapabilitiesAsk {
                    anchor_pane: anchor,
                    agents,
                });
                Asked::Report(Box::new(report))
            }
        }
    }

    fn reconcile_scan(&self, older_than_ms: u64) -> Result<Vec<Finding>, ScanFault> {
        let parts = self
            .parts(&json!({}))
            .map_err(|refusal| ScanFault::NotAnswered(refusal.message))?;
        let scan = parts.core().reconcile_scan(older_than_ms);
        scan.map_err(ScanFault::Refused)
    }
}

// ---- the terminal.* settings --------------------------------------------------------------------------------

/// Where a setting's value came from.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Source {
    Project,
    Global,
    Default,
}

impl Source {
    fn as_str(self) -> &'static str {
        match self {
            Source::Project => "project",
            Source::Global => "global",
            Source::Default => "default",
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Entry {
    pub name: &'static str,
    pub value: Value,
    pub source: Source,
}

fn setting<'a>(section: &'a Value, name: &str) -> &'a Value {
    name.split('.')
        .try_fold(section, |value, key| value.get(key))
        .unwrap_or(&Value::Null)
}

/// The merged `terminal` section with the layer each setting was set in; a setting nobody set is the
/// standard's value (`default`). An explicit `null` counts as set.
fn entries_of(section: &Value, set_in: impl Fn(&str) -> Source) -> Vec<Entry> {
    SETTINGS
        .iter()
        .map(|name| Entry {
            name,
            value: setting(section, name).clone(),
            source: set_in(name),
        })
        .collect()
}

/// The route's `config` field: the explicitly set settings, flat; defaults stay the core's. The retain time is
/// the round's concern, never the route's.
fn route_config(entries: &[Entry]) -> Value {
    let mut config = Map::new();
    for entry in entries {
        if entry.source == Source::Default
            || entry.value.is_null()
            || entry.name == "retainFailedPaneMs"
        {
            continue;
        }
        let key = entry.name.trim_start_matches("layout.");
        config.insert(key.to_owned(), entry.value.clone());
    }
    Value::Object(config)
}

/// `terminalRouteConfig(repoRoot)` (`src/terminal-control/config.mjs:80`): the route `config` of the project at
/// `root`, `{}` when its settings cannot be read.
pub(crate) fn project_route_config(root: &Path) -> Value {
    read_entries(root).map_or_else(|_| json!({}), |entries| route_config(&entries))
}

/// `retainFailedPaneMsOf(repoRoot)` (`src/terminal-control/config.mjs:98`): the project's `terminal.retainFailedPaneMs`
/// when it is a positive number of milliseconds, else `null` (a failed pane stays until a person closes it).
pub(crate) fn project_retain_failed_pane_ms(root: &Path) -> Value {
    read_entries(root)
        .ok()
        .and_then(|entries| {
            entries
                .into_iter()
                .find(|e| e.name == "retainFailedPaneMs")
                .and_then(|e| e.value.as_u64().filter(|ms| *ms > 0))
        })
        .map_or(Value::Null, Value::from)
}

/// One sentence per breach of the two rules whose inputs are not the core's: the dispatch ready timeout and the
/// round's retain time. The core refuses the rest.
fn config_problems(entries: &[Entry]) -> Vec<String> {
    let value = |name: &str| {
        entries
            .iter()
            .find(|e| e.name == name)
            .map_or(&Value::Null, |e| &e.value)
    };
    let mut problems = Vec::new();
    let min_grace = READY_TIMEOUT_MS + GRACE_MARGIN_MS;
    let grace = value("allocationGraceMs");
    if grace.as_u64().is_none_or(|ms| ms < min_grace) {
        problems.push(format!("terminal.allocationGraceMs = {grace} must be an integer of at least {min_grace} (the {READY_TIMEOUT_MS} ms ready timeout plus {GRACE_MARGIN_MS} ms), or a slot still waiting for its worker would be reported as stuck"));
    }
    let retain = value("retainFailedPaneMs");
    if !retain.is_null() && retain.as_u64().is_none_or(|ms| ms == 0) {
        problems.push(format!("terminal.retainFailedPaneMs = {retain} must be null (keep a failed pane until a person closes it) or a positive integer of milliseconds"));
    }
    problems
}

/// The project's `terminal.*` settings with their sources, read through the config door, or why they cannot be.
#[cfg(unix)]
fn read_entries(root: &Path) -> Result<Vec<Entry>, String> {
    use fgos_config::snapshot::snapshot;
    super::config::door::with_roots(root, |ctx, roots| {
        snapshot(ctx, roots).map_err(|error| match error {
            fgos_config::snapshot::SnapshotError::Refused(all) => all
                .iter()
                .map(super::config_refusal_text)
                .collect::<Vec<_>>()
                .join("; "),
            fgos_config::snapshot::SnapshotError::Io(io) => format!("config-io ({:?})", io.kind()),
        })
    })?
    .map(|snapshot| {
        let layers: Vec<(String, &'static str)> = snapshot
            .origins
            .iter()
            .map(|origin| {
                (
                    fgos_yaml_doc::path::format_path(&origin.path),
                    origin.provenance.layer,
                )
            })
            .collect();
        let section = snapshot.value.get("terminal").cloned().unwrap_or(json!({}));
        entries_of(&section, |name| {
            let wanted = format!("terminal.{name}");
            match layers.iter().find(|(path, _)| *path == wanted) {
                Some((_, "project")) => Source::Project,
                Some((_, "global")) => Source::Global,
                _ => Source::Default,
            }
        })
    })
}

#[cfg(not(unix))]
fn read_entries(_root: &Path) -> Result<Vec<Entry>, String> {
    Err("config-platform-unsupported (read)".to_owned())
}

// ---- the judgements ------------------------------------------------------------------------------------------

/// An empty `FGOS_HERDR_ANCHOR_PANE` is the variable's own shape, judged here; the route says whether a named
/// pane resolves. The failure sentence, or the note to append.
fn anchor_verdict(named: &str, answer: &AnchorPane) -> Result<String, String> {
    if named.is_empty() {
        return Err("FGOS_HERDR_ANCHOR_PANE is empty".to_owned());
    }
    match answer {
        AnchorPane::Unresolvable { reason } => Err(format!(
            "FGOS_HERDR_ANCHOR_PANE=\"{named}\" cannot be resolved: {reason}"
        )),
        AnchorPane::Resolved => Ok(format!("; anchor pane \"{named}\" verified")),
        AnchorPane::Absent => Ok(String::new()),
    }
}

fn incarnation_text(report: &CapabilitiesReport) -> String {
    report.server_incarnation.as_ref().map_or_else(
        || "no server incarnation readable".to_owned(),
        |i| format!("server pid {} at {}", i.pid, i.endpoint),
    )
}

/// What the machine is: the platform name the Node row used and the herdr binary it would run.
pub struct Machine<'a> {
    pub platform: &'a str,
    pub herdr_bin: &'a str,
}

/// `terminal-control`: the driver the port runs on, what it can do, which herdr server it would talk to, and
/// `terminal.*` after the merge with each value's source. A missing herdr only warns; a bad anchor pane or
/// `terminal.*` value fails.
fn terminal_control(
    entries: Result<Vec<Entry>, String>,
    route: &dyn Route,
    anchor: Option<&str>,
    machine: &Machine,
) -> (bool, String) {
    let entries = match entries {
        Ok(entries) => entries,
        Err(why) => return (false, format!("terminal.* unreadable: {why}")),
    };
    let mut refused = None;
    let report = match route.capabilities(&route_config(&entries), anchor, false) {
        Asked::Report(report) => report,
        Asked::ConfigRefused { code, message } => {
            refused = Some(format!("{message} ({code})"));
            match route.capabilities(&json!({}), anchor, false) {
                Asked::Report(report) => report,
                Asked::ConfigRefused { message, .. } => {
                    return (true, did_not_answer(&message));
                }
            }
        }
    };
    let mut problems = config_problems(&entries);
    if let Some(refusal) = refused {
        problems.push(format!("the core refused the layout: {refusal}"));
    }
    let mut anchor_note = String::new();
    if !report.capabilities.is_empty() {
        if let Some(named) = anchor {
            match anchor_verdict(named, &report.anchor_pane) {
                Ok(note) => anchor_note = note,
                Err(failure) => problems.push(format!(
                    "terminal-control driver {} is available, but {failure}",
                    report.driver
                )),
            }
        }
    }
    if !problems.is_empty() {
        return (false, problems.join("; "));
    }
    if report.capabilities.is_empty() {
        let why = if machine.platform == "win32" {
            "Windows has no herdr build, and terminal-control runs on herdr only".to_owned()
        } else {
            format!("herdr is not usable ({})", machine.herdr_bin)
        };
        return (
            true,
            format!("warning: terminal mode unsupported: {why}; direct mode unaffected"),
        );
    }
    let shown = entries
        .iter()
        .map(|e| format!("{}={} ({})", e.name, e.value, e.source.as_str()))
        .collect::<Vec<_>>()
        .join(", ");
    let summary = format!(
        "driver {}, {} capabilities ({}); {}{anchor_note}; {shown}",
        report.driver,
        report.capabilities.len(),
        report.capabilities.join(", "),
        incarnation_text(&report),
    );
    if !report.capabilities.iter().any(|c| c == "layout.geometry") {
        return (true, format!("info: {summary}; this herdr cannot report pane geometry, so tabs fall back to the fixed split and only maxPanesPerTab applies"));
    }
    (true, summary)
}

fn did_not_answer(why: &str) -> String {
    format!("warning: the terminal-control route did not answer, so terminal mode and terminal.* cannot be judged here ({why}); direct mode is unaffected")
}

/// `terminal-allocations`: a read-only pointer. Counts the slots past `allocationGraceMs` that never launched
/// and the retained panes past their time; closes nothing.
fn terminal_allocations(entries: Result<Vec<Entry>, String>, route: &dyn Route) -> (bool, String) {
    let entries = match entries {
        Ok(entries) => entries,
        Err(why) => {
            return (
                true,
                format!("warning: terminal.* unreadable, allocations not scanned: {why}"),
            )
        }
    };
    let grace = entries
        .iter()
        .find(|e| e.name == "allocationGraceMs")
        .and_then(|e| e.value.as_u64());
    let Some(grace) = grace else {
        return (true, "warning: terminal.allocationGraceMs is invalid (see terminal-control), allocations not scanned".to_owned());
    };
    match route.reconcile_scan(grace) {
        Err(ScanFault::NotAnswered(why)) => (
            true,
            format!("warning: the terminal-control route did not answer, allocations not scanned ({why})"),
        ),
        Err(ScanFault::Refused(Refusal::Unsupported { capability, detail })) => (
            true,
            format!(
                "info: allocations not scanned: terminal mode is unsupported here ({})",
                if detail.is_empty() { capability } else { detail }
            ),
        ),
        Err(ScanFault::Refused(Refusal::Unknown { reason })) => (
            true,
            if reason.is_empty() {
                "warning: allocation scan answered unknown".to_owned()
            } else {
                format!("warning: allocation scan answered unknown ({reason})")
            },
        ),
        Ok(findings) if findings.is_empty() => (
            true,
            format!("no slot older than {grace} ms is stuck and no retained pane is past its time"),
        ),
        Ok(findings) => (
            true,
            format!("warning: {} slot(s) need a person; nothing was closed; run `fgos dispatch inspect --terminal`", findings.len()),
        ),
    }
}

/// Hook text: kinds herdr can start and the state of each integration hook; `None` for either when herdr cannot
/// be asked or its text cannot be read (absence is `terminal-control`'s business).
pub struct HerdrFacts {
    pub kinds: Option<Vec<String>>,
    pub integrations: Option<std::collections::BTreeMap<String, String>>,
}

/// The first `via: "cli"` invocation of an executor entry.
fn cli_invocation(executor: &Value) -> Option<&Value> {
    executor
        .get("invocations")?
        .as_array()?
        .iter()
        .find(|i| i.get("via").and_then(Value::as_str) == Some("cli"))
}

/// Every executor dispatched through a herdr pane must name an agent kind herdr can start, and that kind's
/// integration hook must not be a stale version. `outdated` fails (herdr reads agent state through it);
/// `not installed` only notes.
fn herdr_executor_kinds(runner: &Value, ask: impl FnOnce() -> HerdrFacts) -> (bool, String) {
    let mut herdr: Vec<(String, Option<String>)> = Vec::new();
    if let Some(executors) = runner.get("executors").and_then(Value::as_object) {
        for (id, executor) in executors {
            let invocation = cli_invocation(executor).unwrap_or(&Value::Null);
            if invocation.get("adapter").and_then(Value::as_str) != Some("herdr-spawn") {
                continue;
            }
            let declared = invocation
                .pointer("/interactiveMode/kind")
                .and_then(Value::as_str);
            let command = invocation.get("command").and_then(Value::as_str);
            let kind = declared.map(str::to_owned).or_else(|| {
                command.and_then(|c| {
                    Path::new(c)
                        .file_name()
                        .map(|name| name.to_string_lossy().into_owned())
                })
            });
            herdr.push((id.clone(), kind));
        }
    }
    if herdr.is_empty() {
        return (
            true,
            "no executor dispatches through a herdr pane".to_owned(),
        );
    }
    let facts = ask();
    let Some(supported) = facts.kinds else {
        return (
            true,
            "herdr could not be asked which agent kinds it supports; kinds not evaluated"
                .to_owned(),
        );
    };
    let unknown: Vec<String> = herdr
        .iter()
        .filter(|(_, kind)| kind.as_ref().is_none_or(|k| !supported.contains(k)))
        .map(|(id, kind)| format!("{id} ({})", kind.as_deref().unwrap_or("none declared")))
        .collect();
    if !unknown.is_empty() {
        return (
            false,
            format!(
                "executors name an agent kind herdr cannot start: {}. herdr supports: {}",
                unknown.join("; "),
                supported.join(", ")
            ),
        );
    }
    let mut notes = Vec::new();
    let mut stale = Vec::new();
    for (id, kind) in &herdr {
        let kind = kind.as_deref().unwrap_or_default();
        let name = integration_name(kind);
        match facts
            .integrations
            .as_ref()
            .and_then(|states| states.get(name))
            .map(String::as_str)
        {
            Some("outdated") => stale.push(format!("{id} (kind {kind}, hook {name})")),
            Some("not installed") => {
                notes.push(format!("{id}: no {name} integration hook installed"))
            }
            _ => {}
        }
    }
    if !stale.is_empty() {
        return (false, format!("executors depend on an outdated herdr integration hook, so the agent state it reports may be wrong: {}. Run: herdr integration install <name>", stale.join("; ")));
    }
    let tail = if notes.is_empty() {
        String::new()
    } else {
        format!(" ({})", notes.join("; "))
    };
    (
        true,
        format!("every herdr executor names a supported kind{tail}"),
    )
}

// ---- the host rows ---------------------------------------------------------------------------------------------

/// The runner config as the runner loads it (after its semantic check), or why it cannot be.
fn load_runner(root: &Path) -> Result<Value, String> {
    if let Some(refusal) = project_root_refusal(root) {
        return Err(refusal.to_owned());
    }
    let loaded = HostWorkspace {
        process_cwd: root.to_path_buf(),
    }
    .load_runner(&root.to_string_lossy())
    .map_err(|failure| failure.message().to_owned())?;
    check_loaded_runner(loaded, &root.to_string_lossy())
        .map(|(runner, _)| runner)
        .map_err(|failure| failure.message().to_owned())
}

/// The pane the person named as the anchor: trimmed, and an empty value stays named (it is judged, not ignored).
fn anchor_of(env: &[(String, String)]) -> Option<String> {
    env.iter()
        .find(|(k, _)| k == "FGOS_HERDR_ANCHOR_PANE")
        .map(|(_, v)| v.trim().to_owned())
}

fn herdr_facts(route: &dyn Route) -> HerdrFacts {
    match route.capabilities(&json!({}), None, true) {
        Asked::Report(report) => match report.agents {
            Some(facts) => HerdrFacts {
                kinds: facts.kinds,
                integrations: facts.integrations,
            },
            None => HerdrFacts {
                kinds: None,
                integrations: None,
            },
        },
        _ => HerdrFacts {
            kinds: None,
            integrations: None,
        },
    }
}

fn judge(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    let env = process_env();
    let anchor = anchor_of(&env);
    let route = host_route(&env, anchor.as_deref());
    ids.iter()
        .map(|id| {
            timed(|| {
                let (passed, message) = match *id {
                    "terminal-control" => terminal_control(
                        read_entries(root),
                        &route,
                        anchor.as_deref(),
                        &Machine {
                            platform: match std::env::consts::OS {
                                "windows" => "win32",
                                other => other,
                            },
                            herdr_bin: route.herdr_bin(),
                        },
                    ),
                    "terminal-allocations" => terminal_allocations(read_entries(root), &route),
                    "herdr-executor-kinds" => match load_runner(root) {
                        Ok(runner) => herdr_executor_kinds(&runner, || herdr_facts(&route)),
                        Err(why) => (
                            true,
                            format!("runner config not loadable here, herdr executor kinds not evaluated: {why}"),
                        ),
                    },
                    other => unreachable!("terminal group asked for row {other}"),
                };
                judged(passed, message)
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {

    use super::*;
    use fgos_terminal_control::port::FindingKind;
    use fgos_terminal_control::port::ServerIncarnation;
    use std::cell::RefCell;
    use std::collections::BTreeMap;

    fn finding_text(kind: FindingKind) -> &'static str {
        match kind {
            FindingKind::AllocatedNotLaunchedBareShell => {
                "a slot was allocated but never launched and its pane is a bare shell"
            }
            FindingKind::RetainExpired => "a retained pane is past its retain time",
            FindingKind::StaleIncarnation => "a record belongs to a herdr server that is gone",
            FindingKind::Unknown => "a record could not be judged",
        }
    }

    fn entries(grace: Value, retain: Value) -> Vec<Entry> {
        let section = json!({
            "allocationGraceMs": grace,
            "retainFailedPaneMs": retain,
            "layout": { "policy": "even-split", "minCols": 80, "minRows": 20, "maxPanesPerTab": 8 },
        });
        entries_of(&section, |_| Source::Default)
    }

    fn defaults() -> Vec<Entry> {
        entries(json!(60000), Value::Null)
    }

    fn report(capabilities: &[&str], anchor: AnchorPane) -> CapabilitiesReport {
        CapabilitiesReport {
            driver: "herdr".into(),
            capabilities: capabilities.iter().map(|c| (*c).to_owned()).collect(),
            server_incarnation: Some(ServerIncarnation {
                pid: 42,
                endpoint: "/tmp/herdr.sock".into(),
                host: "h".into(),
                boot_id: "b".into(),
                pid_ns: "n".into(),
                start_time: "t".into(),
            }),
            anchor_pane: anchor,
            socket_path: None,
            agents: None,
        }
    }

    struct Fake {
        answers: RefCell<Vec<Asked>>,
        configs: RefCell<Vec<Value>>,
        scan: Result<Vec<Finding>, ScanFault>,
    }

    impl Fake {
        fn answering(answers: Vec<Asked>) -> Self {
            Fake {
                answers: RefCell::new(answers),
                configs: RefCell::new(Vec::new()),
                scan: Ok(Vec::new()),
            }
        }
    }

    impl Route for Fake {
        fn capabilities(&self, config: &Value, _anchor: Option<&str>, _agents: bool) -> Asked {
            self.configs.borrow_mut().push(config.clone());
            self.answers.borrow_mut().remove(0)
        }
        fn reconcile_scan(&self, _older: u64) -> Result<Vec<Finding>, ScanFault> {
            self.scan.clone()
        }
    }

    const MACHINE: Machine = Machine {
        platform: "linux",
        herdr_bin: "herdr",
    };

    const FULL: [&str; 3] = ["layout.geometry", "pane.launch", "pane.read"];

    #[test]
    fn terminal_control_passes_on_defaults_and_prints_every_value_with_its_source() {
        let route = Fake::answering(vec![Asked::Report(Box::new(report(
            &FULL,
            AnchorPane::Absent,
        )))]);
        let (passed, message) = terminal_control(Ok(defaults()), &route, None, &MACHINE);
        assert!(passed, "{message}");
        assert!(
            message.contains("driver herdr, 3 capabilities"),
            "{message}"
        );
        assert!(
            message.contains("server pid 42 at /tmp/herdr.sock"),
            "{message}"
        );
        assert!(
            message.contains("allocationGraceMs=60000 (default)"),
            "{message}"
        );
        assert!(
            message.contains("layout.policy=\"even-split\" (default)"),
            "{message}"
        );
    }

    #[test]
    fn terminal_control_names_the_source_of_an_override_and_hands_the_route_only_set_values() {
        let section = json!({ "allocationGraceMs": 90000, "retainFailedPaneMs": 5000, "layout": { "minCols": 100 } });
        let set = entries_of(&section, |name| match name {
            "allocationGraceMs" | "retainFailedPaneMs" => Source::Project,
            "layout.minCols" => Source::Global,
            _ => Source::Default,
        });
        assert_eq!(
            route_config(&set),
            json!({ "allocationGraceMs": 90000, "minCols": 100 })
        );
        let route = Fake::answering(vec![Asked::Report(Box::new(report(
            &FULL,
            AnchorPane::Absent,
        )))]);
        let (_, message) = terminal_control(Ok(set), &route, None, &MACHINE);
        assert!(
            message.contains("allocationGraceMs=90000 (project)"),
            "{message}"
        );
        assert!(message.contains("layout.minCols=100 (global)"), "{message}");
    }

    #[test]
    fn terminal_control_fails_a_grace_below_the_ready_timeout_plus_30_s_and_passes_the_exact_bound()
    {
        let route = || {
            Fake::answering(vec![Asked::Report(Box::new(report(
                &FULL,
                AnchorPane::Absent,
            )))])
        };
        let (passed, message) = terminal_control(
            Ok(entries(json!(59999), Value::Null)),
            &route(),
            None,
            &MACHINE,
        );
        assert!(!passed);
        assert!(
            message.contains("must be an integer of at least 60000"),
            "{message}"
        );
        let (passed, message) = terminal_control(
            Ok(entries(json!(60000), Value::Null)),
            &route(),
            None,
            &MACHINE,
        );
        assert!(passed, "{message}");
    }

    #[test]
    fn terminal_control_fails_a_retain_time_that_is_neither_null_nor_a_positive_integer() {
        for bad in [json!(0), json!(-5), json!("soon"), json!(1.5)] {
            let route = Fake::answering(vec![Asked::Report(Box::new(report(
                &FULL,
                AnchorPane::Absent,
            )))]);
            let (passed, message) = terminal_control(
                Ok(entries(json!(60000), bad.clone())),
                &route,
                None,
                &MACHINE,
            );
            assert!(!passed, "{bad}");
            assert!(message.contains("terminal.retainFailedPaneMs"), "{message}");
        }
        let route = Fake::answering(vec![Asked::Report(Box::new(report(
            &FULL,
            AnchorPane::Absent,
        )))]);
        assert!(
            terminal_control(
                Ok(entries(json!(60000), json!(1000))),
                &route,
                None,
                &MACHINE
            )
            .0
        );
    }

    #[test]
    fn terminal_control_names_the_core_refusal_of_a_layout_and_retries_with_the_core_defaults() {
        let route = Fake::answering(vec![
            Asked::ConfigRefused {
                code: "terminal-config-below-floor".into(),
                message: "layout.minCols=10 < 40, the measured floor".into(),
            },
            Asked::Report(Box::new(report(&FULL, AnchorPane::Absent))),
        ]);
        let (passed, message) = terminal_control(Ok(defaults()), &route, None, &MACHINE);
        assert!(!passed);
        assert!(
            message.contains("the core refused the layout: layout.minCols=10 < 40, the measured floor (terminal-config-below-floor)"),
            "{message}"
        );
        assert_eq!(route.configs.borrow().last(), Some(&json!({})));
    }

    #[test]
    fn terminal_control_fails_by_name_on_a_config_that_cannot_be_read() {
        let route = Fake::answering(vec![]);
        let (passed, message) =
            terminal_control(Err("config-parse (x)".into()), &route, None, &MACHINE);
        assert!(!passed);
        assert_eq!(message, "terminal.* unreadable: config-parse (x)");
    }

    #[test]
    fn terminal_control_warns_without_failing_when_the_route_does_not_answer() {
        let route = Fake::answering(vec![
            Asked::ConfigRefused {
                code: "bad".into(),
                message: "x".into(),
            },
            Asked::ConfigRefused {
                code: "bad".into(),
                message: "x".into(),
            },
        ]);
        let (passed, message) = terminal_control(Ok(defaults()), &route, None, &MACHINE);
        assert!(passed);
        assert!(
            message.starts_with("warning: the terminal-control route did not answer"),
            "{message}"
        );
        assert!(message.contains("direct mode is unaffected"), "{message}");
    }

    #[test]
    fn terminal_control_warns_when_herdr_is_not_on_the_machine_and_says_why_on_windows() {
        let route = Fake::answering(vec![Asked::Report(Box::new(report(
            &[],
            AnchorPane::Absent,
        )))]);
        let (passed, message) = terminal_control(Ok(defaults()), &route, None, &MACHINE);
        assert!(passed);
        assert_eq!(message, "warning: terminal mode unsupported: herdr is not usable (herdr); direct mode unaffected");
        let route = Fake::answering(vec![Asked::Report(Box::new(report(
            &[],
            AnchorPane::Absent,
        )))]);
        let windows = Machine {
            platform: "win32",
            herdr_bin: "herdr",
        };
        let (passed, message) = terminal_control(Ok(defaults()), &route, None, &windows);
        assert!(passed);
        assert!(message.contains("Windows has no herdr build"), "{message}");
    }

    #[test]
    fn terminal_control_gives_an_info_line_when_herdr_cannot_report_pane_geometry() {
        let route = Fake::answering(vec![Asked::Report(Box::new(report(
            &["pane.launch"],
            AnchorPane::Absent,
        )))]);
        let (passed, message) = terminal_control(Ok(defaults()), &route, None, &MACHINE);
        assert!(passed);
        assert!(message.starts_with("info: driver herdr"), "{message}");
        assert!(message.contains("cannot report pane geometry"), "{message}");
    }

    #[test]
    fn terminal_control_judges_the_anchor_pane_empty_and_unresolvable_fail_a_resolved_pane_is_verified(
    ) {
        let ask = |anchor: Option<&str>, answer: AnchorPane| {
            let route = Fake::answering(vec![Asked::Report(Box::new(report(&FULL, answer)))]);
            terminal_control(Ok(defaults()), &route, anchor, &MACHINE)
        };
        let (passed, message) = ask(Some(""), AnchorPane::Absent);
        assert!(!passed);
        assert!(
            message.contains("is available, but FGOS_HERDR_ANCHOR_PANE is empty"),
            "{message}"
        );
        let (passed, message) = ask(
            Some("w1:p9"),
            AnchorPane::Unresolvable {
                reason: "pane w1:p9 does not exist".into(),
            },
        );
        assert!(!passed);
        assert!(
            message.contains(
                "FGOS_HERDR_ANCHOR_PANE=\"w1:p9\" cannot be resolved: pane w1:p9 does not exist"
            ),
            "{message}"
        );
        let (passed, message) = ask(Some("w1:p2"), AnchorPane::Resolved);
        assert!(passed);
        assert!(
            message.contains("anchor pane \"w1:p2\" verified"),
            "{message}"
        );
    }

    fn finding(kind: FindingKind) -> Finding {
        Finding {
            key: "k".into(),
            pane_id: None,
            kind,
            detail: String::new(),
        }
    }

    #[test]
    fn terminal_allocations_passes_when_nothing_is_stuck_and_counts_findings_without_listing_them()
    {
        let mut route = Fake::answering(vec![]);
        let (passed, message) = terminal_allocations(Ok(defaults()), &route);
        assert!(passed);
        assert_eq!(
            message,
            "no slot older than 60000 ms is stuck and no retained pane is past its time"
        );
        route.scan = Ok(vec![
            finding(FindingKind::RetainExpired),
            finding(FindingKind::Unknown),
        ]);
        let (passed, message) = terminal_allocations(Ok(defaults()), &route);
        assert!(passed, "a pointer never fails");
        assert_eq!(message, "warning: 2 slot(s) need a person; nothing was closed; run `fgos dispatch inspect --terminal`");
        assert_eq!(
            finding_text(FindingKind::RetainExpired),
            "a retained pane is past its retain time"
        );
    }

    #[test]
    fn terminal_allocations_says_it_did_not_scan_instead_of_failing() {
        let mut route = Fake::answering(vec![]);
        route.scan = Err(ScanFault::NotAnswered("spawn herdr: ENOENT".into()));
        let (passed, message) = terminal_allocations(Ok(defaults()), &route);
        assert!(passed);
        assert!(
            message.starts_with(
                "warning: the terminal-control route did not answer, allocations not scanned"
            ),
            "{message}"
        );
        route.scan = Err(ScanFault::Refused(Refusal::Unknown {
            reason: "herdr status server reports no running socket".into(),
        }));
        assert_eq!(
            terminal_allocations(Ok(defaults()), &route).1,
            "warning: allocation scan answered unknown (herdr status server reports no running socket)"
        );
        route.scan = Err(ScanFault::Refused(Refusal::Unsupported {
            capability: "pane.list".into(),
            detail: String::new(),
        }));
        assert_eq!(
            terminal_allocations(Ok(defaults()), &route).1,
            "info: allocations not scanned: terminal mode is unsupported here (pane.list)"
        );
        let (passed, message) = terminal_allocations(Err("config-parse".into()), &route);
        assert!(passed);
        assert!(
            message.contains("terminal.* unreadable, allocations not scanned"),
            "{message}"
        );
        let bad = entries(json!("soon"), Value::Null);
        let (passed, message) = terminal_allocations(Ok(bad), &route);
        assert!(passed);
        assert!(
            message.contains("terminal.allocationGraceMs is invalid"),
            "{message}"
        );
    }

    #[test]
    fn route_config_carries_only_explicitly_set_values_and_never_the_retain_time() {
        assert_eq!(route_config(&defaults()), json!({}));
        let section = json!({ "layout": { "policy": "measured-split", "minRows": null } });
        let set = entries_of(&section, |_| Source::Project);
        assert_eq!(route_config(&set), json!({ "policy": "measured-split" }));
    }

    fn herdr_runner(id: &str, kind: Option<&str>, command: Option<&str>) -> Value {
        let mut invocation = json!({ "via": "cli", "adapter": "herdr-spawn" });
        if let Some(kind) = kind {
            invocation["interactiveMode"] = json!({ "kind": kind });
        }
        if let Some(command) = command {
            invocation["command"] = json!(command);
        }
        json!({ "executors": { id: { "invocations": [invocation] } } })
    }

    fn facts(kinds: Option<&[&str]>, hooks: &[(&str, &str)]) -> HerdrFacts {
        HerdrFacts {
            kinds: kinds.map(|k| k.iter().map(|s| (*s).to_owned()).collect()),
            integrations: Some(
                hooks
                    .iter()
                    .map(|(k, v)| ((*k).to_owned(), (*v).to_owned()))
                    .collect::<BTreeMap<_, _>>(),
            ),
        }
    }

    #[test]
    fn herdr_executor_kinds_passes_without_a_herdr_executor_and_never_asks_herdr() {
        let asked = || -> HerdrFacts { panic!("herdr must not be asked") };
        assert!(
            herdr_executor_kinds(&json!({ "executors": { "a": { "kind": "agent" } } }), asked).0
        );
        assert_eq!(
            herdr_executor_kinds(&json!({}), asked).1,
            "no executor dispatches through a herdr pane"
        );
    }

    #[test]
    fn herdr_executor_kinds_fails_a_kind_herdr_cannot_start_and_derives_the_kind_from_the_command()
    {
        let (passed, message) =
            herdr_executor_kinds(&herdr_runner("weird", Some("notreal"), None), || {
                facts(Some(&["claude", "codex"]), &[])
            });
        assert!(!passed);
        assert!(message.contains("weird (notreal)"), "{message}");
        assert!(
            message.contains("herdr supports: claude, codex"),
            "{message}"
        );
        let (passed, message) = herdr_executor_kinds(
            &herdr_runner("claude-herdr", None, Some("/usr/bin/claude")),
            || facts(Some(&["claude"]), &[]),
        );
        assert!(passed, "{message}");
        let (passed, message) = herdr_executor_kinds(&herdr_runner("bare", None, None), || {
            facts(Some(&["claude"]), &[])
        });
        assert!(!passed);
        assert!(message.contains("bare (none declared)"), "{message}");
    }

    #[test]
    fn herdr_executor_kinds_fails_an_outdated_hook_and_only_notes_a_missing_one() {
        let kinds = Some(&["codex", "agy"][..]);
        let (passed, message) = herdr_executor_kinds(
            &herdr_runner("codex-herdr-bwrap", Some("codex"), None),
            || facts(kinds, &[("codex", "outdated")]),
        );
        assert!(!passed);
        assert!(
            message.contains("codex-herdr-bwrap (kind codex, hook codex)"),
            "{message}"
        );
        let (passed, message) = herdr_executor_kinds(
            &herdr_runner("codex-herdr-bwrap", Some("codex"), None),
            || facts(kinds, &[("codex", "not installed")]),
        );
        assert!(passed);
        assert!(
            message.contains("codex-herdr-bwrap: no codex integration hook installed"),
            "{message}"
        );
        let (passed, message) = herdr_executor_kinds(
            &herdr_runner("agy-herdr-bwrap", Some("agy"), Some("agy")),
            || facts(kinds, &[("antigravity-cli", "outdated")]),
        );
        assert!(!passed, "agy is read through its antigravity-cli hook");
        assert!(message.contains("hook antigravity-cli"), "{message}");
    }

    #[test]
    fn herdr_executor_kinds_does_not_judge_when_herdr_cannot_be_asked() {
        let (passed, message) =
            herdr_executor_kinds(&herdr_runner("claude-herdr", Some("claude"), None), || {
                HerdrFacts {
                    kinds: None,
                    integrations: None,
                }
            });
        assert!(passed);
        assert!(message.contains("kinds not evaluated"), "{message}");
    }
}
