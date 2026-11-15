//! The doctor engine: one registry of rows and fixes, one runner, one report.
//!
//! Contract: `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` section 3. The registry
//! (`packages/distribution/contracts/doctor-registry.v1.json`) lists every row and every fix in run order with
//! its description, its owner (`rust:<component>` or `bridge:<step>`) and the rows a fix repairs; the rows of the
//! config crate stay in that crate's contract and enter as one group. This module owns what is the same for every
//! row: the status of a result, a failing row's `fix`, `ok` and `next`, the order fixes run in, `--strict`, the
//! JSON report and its `--pretty` form. It judges nothing: each row is judged by the owner the registry names,
//! through the [`RowOwner`] port.
//!
//! The report type is lenient on purpose (every field optional, unknown fields ignored): a global `fgctl` reads
//! the doctor of whatever release a project pins, an older one included, and a strict type would turn a pin from
//! before a field existed into "not a doctor result".

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::Path;

/// The command that runs every registered fix.
pub const FIX_COMMAND: &str = "fgos doctor --fix";

/// The level of one row.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Status {
    Ok,
    Warn,
    Fail,
    Skip,
}

impl Status {
    pub fn as_str(self) -> &'static str {
        match self {
            Status::Ok => "ok",
            Status::Warn => "warn",
            Status::Fail => "fail",
            Status::Skip => "skip",
        }
    }
}

/// What a row judged: the owner's own words, before the engine derives the level and the fix.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RowResult {
    pub passed: bool,
    /// A row that says its own level keeps it (`skip`); otherwise the level follows `passed` and the message.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<Status>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    /// The command that repairs this row when it is not `fgos doctor --fix`.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub fix_command: Option<String>,
    /// The facts behind the one-sentence message, kept as the row gave them.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail: Option<Value>,
}

impl RowResult {
    /// The level: the row's own, else `fail` when not passed, `warn` for a passing `warning:` message, else `ok`.
    pub fn level(&self) -> Status {
        if let Some(status) = self.status {
            return status;
        }
        if !self.passed {
            return Status::Fail;
        }
        match &self.message {
            Some(message) if message.starts_with("warning:") => Status::Warn,
            _ => Status::Ok,
        }
    }
}

/// What one fix did, as the fix said it: `changed` and `message` are as the fix gave them (a fix that says
/// nothing about one of them leaves it out of the report, as before).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FixResult {
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub changed: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

impl FixResult {
    /// A fix that ran and said whether it changed anything, and why.
    pub fn done(id: &str, changed: bool, message: impl Into<String>) -> Self {
        Self {
            id: id.to_owned(),
            changed: Some(changed),
            message: Some(message.into()),
        }
    }
}

/// How an owner answered for one row: it judged it, or it could not (the cause is shown as the row's failure
/// and as one entry of `next`).
#[derive(Debug, Clone, PartialEq)]
pub enum RowOutcome {
    Judged(RowResult),
    Unavailable { message: String, next: String },
}

/// Who judges a row or runs a fix: the registry names an owner per entry and the engine asks that owner.
pub trait RowOwner {
    /// Runs the fixes `ids` (registry order) against `root`; one result per id, in that order.
    fn run_fixes(&self, root: &Path, ids: &[&str]) -> Vec<FixResult>;
    /// Judges the rows `ids` (registry order) against `root`, after the fixes ran; one outcome per id, in order.
    /// An owner builds the facts its rows share once per call.
    fn judge_rows(&self, root: &Path, ids: &[&str]) -> Vec<RowOutcome>;
    /// Whether this owner has the judge of row `id` today. The bridge has every row it is asked for.
    fn handles_row(&self, id: &str) -> bool;
    /// Whether this owner has the body of fix `id` today.
    fn handles_fix(&self, id: &str) -> bool;
}

/// The two kinds of owner the registry names.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum OwnerKind {
    /// Judged in process by a Rust component (`rust:<component>`).
    Native,
    /// Judged by the Node rows bridge (`bridge:<step>`), until the step that owns the layer moves the row.
    Bridge,
}

/// An owner label of the registry, `rust:<component>` or `bridge:<step>`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Owner {
    pub kind: OwnerKind,
    /// The component (native) or the step that removes the row from the bridge (bridged).
    pub label: String,
}

impl Owner {
    pub fn parse(text: &str) -> Result<Self, String> {
        let (kind, label) = match text.split_once(':') {
            Some(("rust", label)) => (OwnerKind::Native, label),
            Some(("bridge", label)) => (OwnerKind::Bridge, label),
            _ => {
                return Err(format!(
                    "owner \"{text}\" is neither rust:<component> nor bridge:<step>"
                ))
            }
        };
        if label.is_empty() {
            return Err(format!("owner \"{text}\" names nothing after the colon"));
        }
        Ok(Self {
            kind,
            label: label.to_owned(),
        })
    }
}

/// One row of the registry, groups expanded.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegistryRow {
    pub id: String,
    pub description: String,
    pub owner: Owner,
    /// A read-only pointer to a component's own verb (contract section 3).
    pub pointer: bool,
}

/// One fix of the registry, groups expanded.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegistryFix {
    pub id: String,
    /// The rows this fix repairs: a failing one reports `fgos doctor --fix` as its `fix`.
    pub repairs: Vec<String>,
    pub owner: Owner,
}

/// The registry in run order.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Registry {
    pub rows: Vec<RegistryRow>,
    pub fixes: Vec<RegistryFix>,
}

#[derive(Deserialize)]
struct RawRegistry {
    version: u32,
    #[serde(default)]
    groups: HashMap<String, RawGroup>,
    rows: Vec<RawEntry>,
    fixes: Vec<RawEntry>,
}

/// A set of rows and fixes that another contract lists (the config crate's `doctor-rows.v1.json`): the ids the
/// two registries name differently, the description a row says differently, and who owns the whole group.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawGroup {
    owner: String,
    #[serde(default)]
    id_map: HashMap<String, String>,
    #[serde(default)]
    fix_id_map: HashMap<String, String>,
    #[serde(default)]
    fix_id_prefix: String,
    #[serde(default)]
    description_overrides: HashMap<String, String>,
}

#[derive(Deserialize)]
struct RawEntry {
    #[serde(default)]
    id: Option<String>,
    #[serde(default)]
    description: Option<String>,
    #[serde(default)]
    owner: Option<String>,
    #[serde(default)]
    pointer: bool,
    #[serde(default)]
    repairs: Option<Vec<String>>,
    #[serde(default)]
    group: Option<String>,
}

#[derive(Deserialize)]
struct RawGroupContract {
    fixes: Vec<String>,
    rows: Vec<RawGroupRow>,
}

#[derive(Deserialize)]
struct RawGroupRow {
    id: String,
    description: String,
    fix: Option<String>,
}

impl Registry {
    /// Reads the registry. `group_contracts` maps a group name to the text of the contract that lists its rows.
    /// A malformed registry, a duplicate id, an unknown group or an unparsable owner is refused by name.
    pub fn parse(registry_json: &str, group_contracts: &[(&str, &str)]) -> Result<Self, String> {
        let raw: RawRegistry =
            serde_json::from_str(registry_json).map_err(|e| format!("doctor registry: {e}"))?;
        if raw.version != 1 {
            return Err(format!("doctor registry: version {} is not 1", raw.version));
        }
        let mut rows: Vec<RegistryRow> = Vec::new();
        let mut fixes: Vec<RegistryFix> = Vec::new();
        for entry in &raw.rows {
            match &entry.group {
                Some(name) => {
                    let (group, contract) = group_of(&raw, group_contracts, name)?;
                    let owner = Owner::parse(&group.owner)?;
                    for row in &contract.rows {
                        rows.push(RegistryRow {
                            id: group.row_id(&row.id),
                            description: group
                                .description_overrides
                                .get(&row.id)
                                .cloned()
                                .unwrap_or_else(|| row.description.clone()),
                            owner: owner.clone(),
                            pointer: false,
                        });
                    }
                }
                None => {
                    let id = entry
                        .id
                        .clone()
                        .ok_or("doctor registry: a row names neither an id nor a group")?;
                    rows.push(RegistryRow {
                        description: entry.description.clone().ok_or_else(|| {
                            format!("doctor registry: row {id} has no description")
                        })?,
                        owner: Owner::parse(
                            entry
                                .owner
                                .as_deref()
                                .ok_or_else(|| format!("doctor registry: row {id} has no owner"))?,
                        )?,
                        pointer: entry.pointer,
                        id,
                    });
                }
            }
        }
        for entry in &raw.fixes {
            match &entry.group {
                Some(name) => {
                    let (group, contract) = group_of(&raw, group_contracts, name)?;
                    let owner = Owner::parse(&group.owner)?;
                    for fix in &contract.fixes {
                        fixes.push(RegistryFix {
                            id: group.fix_id(fix),
                            repairs: contract
                                .rows
                                .iter()
                                .filter(|row| row.fix.as_deref() == Some(fix.as_str()))
                                .map(|row| group.row_id(&row.id))
                                .collect(),
                            owner: owner.clone(),
                        });
                    }
                }
                None => {
                    let id = entry
                        .id
                        .clone()
                        .ok_or("doctor registry: a fix names neither an id nor a group")?;
                    fixes.push(RegistryFix {
                        repairs: entry.repairs.clone().unwrap_or_else(|| vec![id.clone()]),
                        owner: Owner::parse(
                            entry
                                .owner
                                .as_deref()
                                .ok_or_else(|| format!("doctor registry: fix {id} has no owner"))?,
                        )?,
                        id,
                    });
                }
            }
        }
        for (kind, ids) in [
            (
                "row",
                rows.iter().map(|r| r.id.as_str()).collect::<Vec<_>>(),
            ),
            (
                "fix",
                fixes.iter().map(|f| f.id.as_str()).collect::<Vec<_>>(),
            ),
        ] {
            let mut seen = std::collections::HashSet::new();
            if let Some(duplicate) = ids.into_iter().find(|id| !seen.insert(*id)) {
                return Err(format!(
                    "doctor registry: {kind} {duplicate} is listed twice"
                ));
            }
        }
        Ok(Self { rows, fixes })
    }

    /// The ids of the rows an owner kind judges, in registry order.
    pub fn row_ids(&self, kind: OwnerKind) -> Vec<&str> {
        self.rows
            .iter()
            .filter(|row| row.owner.kind == kind)
            .map(|row| row.id.as_str())
            .collect()
    }

    /// The ids of the fixes an owner kind runs, in registry order.
    pub fn fix_ids(&self, kind: OwnerKind) -> Vec<&str> {
        self.fixes
            .iter()
            .filter(|fix| fix.owner.kind == kind)
            .map(|fix| fix.id.as_str())
            .collect()
    }
}

impl RawGroup {
    fn row_id(&self, id: &str) -> String {
        self.id_map
            .get(id)
            .cloned()
            .unwrap_or_else(|| id.to_owned())
    }

    fn fix_id(&self, id: &str) -> String {
        self.fix_id_map
            .get(id)
            .cloned()
            .unwrap_or_else(|| format!("{}{id}", self.fix_id_prefix))
    }
}

fn group_of<'a>(
    raw: &'a RawRegistry,
    contracts: &[(&str, &str)],
    name: &str,
) -> Result<(&'a RawGroup, RawGroupContract), String> {
    let group = raw
        .groups
        .get(name)
        .ok_or_else(|| format!("doctor registry: group {name} is not declared"))?;
    let text = contracts
        .iter()
        .find(|(group_name, _)| *group_name == name)
        .map(|(_, text)| *text)
        .ok_or_else(|| format!("doctor registry: no contract was given for group {name}"))?;
    let contract: RawGroupContract =
        serde_json::from_str(text).map_err(|e| format!("doctor registry: group {name}: {e}"))?;
    Ok((group, contract))
}

/// What the person asked of one run.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Options {
    /// Run every registered fix first, so the rows are judged after the repair.
    pub fix: bool,
}

/// The report: `{ ok, next, fixed?, checks }`. Every field is optional on the reading side.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct Report {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ok: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub fixed: Option<Vec<FixResult>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub checks: Option<Vec<ReportRow>>,
}

/// One row of the report.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct ReportRow {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub passed: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    /// Present on a failing row: the command that repairs it, or null when only a person can.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub fix: Option<FixField>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail: Option<Value>,
}

/// The `fix` of a failing row: a command, or null.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum FixField {
    Command(String),
    Nobody(()),
}

impl FixField {
    pub fn command(&self) -> Option<&str> {
        match self {
            FixField::Command(command) => Some(command),
            FixField::Nobody(()) => None,
        }
    }
}

/// Why standard output is not a doctor result.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReportError {
    NotJson(String),
    NoOk,
    NoChecks,
}

impl std::fmt::Display for ReportError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ReportError::NotJson(why) => f.write_str(why),
            ReportError::NoOk => f.write_str("no boolean `ok`"),
            ReportError::NoChecks => f.write_str("no `checks` list"),
        }
    }
}

impl Report {
    /// Reads the output of `fgos doctor --json`: the envelope's `data`, or a bare report. Anything that is not
    /// a report with a boolean `ok` is refused, never guessed at.
    pub fn from_stdout(stdout: &str) -> Result<Self, ReportError> {
        let value: Value =
            serde_json::from_str(stdout).map_err(|e| ReportError::NotJson(e.to_string()))?;
        let data = value.get("data").cloned().unwrap_or(value);
        if data.get("ok").and_then(Value::as_bool).is_none() {
            return Err(ReportError::NoOk);
        }
        serde_json::from_value(data).map_err(|e| ReportError::NotJson(e.to_string()))
    }

    /// The rows whose level is `fail`.
    pub fn failing(&self) -> impl Iterator<Item = &ReportRow> {
        self.checks
            .iter()
            .flatten()
            .filter(|row| row.status.as_deref() == Some("fail"))
    }

    /// `--strict` exits 1 when a row still fails; without it the exit is 0 whatever the rows say.
    pub fn exit_code(&self, strict: bool) -> i32 {
        i32::from(strict && self.ok != Some(true))
    }
}

/// The owners the engine asks.
pub struct Owners<'a> {
    pub native: &'a dyn RowOwner,
    pub bridge: &'a dyn RowOwner,
}

impl Owners<'_> {
    fn of(&self, kind: OwnerKind) -> &dyn RowOwner {
        match kind {
            OwnerKind::Native => self.native,
            OwnerKind::Bridge => self.bridge,
        }
    }

    /// Who judges a row today: the Rust owner the registry names once it has the judge, else the bridge, whose
    /// Node body stays until the phase that moves the row deletes it.
    fn kind_of_row(&self, entry: &RegistryRow) -> OwnerKind {
        if entry.owner.kind == OwnerKind::Native && self.native.handles_row(&entry.id) {
            OwnerKind::Native
        } else {
            OwnerKind::Bridge
        }
    }

    /// Who runs a fix today, by the same rule.
    fn kind_of_fix(&self, entry: &RegistryFix) -> OwnerKind {
        if entry.owner.kind == OwnerKind::Native && self.native.handles_fix(&entry.id) {
            OwnerKind::Native
        } else {
            OwnerKind::Bridge
        }
    }
}

/// One doctor run. With `fix`, every fix runs first in exact registry order (a run of consecutive fixes of one
/// owner is one call to it, never reordered), then every row is judged, one call per owner, and the answers are
/// put back in registry order. A row an owner could not judge fails with the cause and no fix; the cause is
/// added once to `next`.
pub fn run(registry: &Registry, owners: &Owners, root: &Path, options: Options) -> Report {
    let fixed = options.fix.then(|| run_fixes(registry, owners, root));
    let kinds: Vec<OwnerKind> = registry
        .rows
        .iter()
        .map(|entry| owners.kind_of_row(entry))
        .collect();
    let mut judged: HashMap<OwnerKind, std::vec::IntoIter<RowOutcome>> = HashMap::new();
    for kind in [OwnerKind::Native, OwnerKind::Bridge] {
        let ids: Vec<&str> = registry
            .rows
            .iter()
            .zip(&kinds)
            .filter(|(_, row_kind)| **row_kind == kind)
            .map(|(entry, _)| entry.id.as_str())
            .collect();
        if ids.is_empty() {
            continue;
        }
        let mut outcomes = owners.of(kind).judge_rows(root, &ids);
        outcomes.truncate(ids.len());
        while outcomes.len() < ids.len() {
            outcomes.push(RowOutcome::Unavailable {
                message: "the owner of this row gave no answer".to_owned(),
                next: "run fgos doctor again".to_owned(),
            });
        }
        judged.insert(kind, outcomes.into_iter());
    }
    let repaired: std::collections::HashSet<&str> = registry
        .fixes
        .iter()
        .flat_map(|fix| fix.repairs.iter().map(String::as_str))
        .collect();
    let mut rows = Vec::with_capacity(registry.rows.len());
    let mut next: Vec<String> = Vec::new();
    for (entry, kind) in registry.rows.iter().zip(&kinds) {
        let outcome = judged
            .get_mut(kind)
            .and_then(Iterator::next)
            .expect("every row of an owner kind was asked for and answered");
        match outcome {
            RowOutcome::Judged(result) => {
                let status = result.level();
                let repair = match (&result.fix_command, status) {
                    (Some(command), _) => Some(FixField::Command(command.clone())),
                    (None, Status::Fail) if repaired.contains(entry.id.as_str()) => {
                        Some(FixField::Command(FIX_COMMAND.to_owned()))
                    }
                    (None, Status::Fail) => Some(FixField::Nobody(())),
                    (None, _) => None,
                };
                if let (Status::Fail, Some(FixField::Command(command))) = (status, &repair) {
                    if !next.contains(command) {
                        next.push(command.clone());
                    }
                }
                rows.push(ReportRow {
                    id: Some(entry.id.clone()),
                    description: Some(entry.description.clone()),
                    passed: Some(result.passed),
                    status: Some(status.as_str().to_owned()),
                    message: result.message,
                    fix: repair,
                    detail: result.detail,
                });
            }
            RowOutcome::Unavailable {
                message,
                next: hint,
            } => {
                if !next.contains(&hint) {
                    next.push(hint);
                }
                rows.push(ReportRow {
                    id: Some(entry.id.clone()),
                    description: Some(entry.description.clone()),
                    passed: Some(false),
                    status: Some(Status::Fail.as_str().to_owned()),
                    message: Some(message),
                    fix: Some(FixField::Nobody(())),
                    detail: None,
                });
            }
        }
    }
    Report {
        ok: Some(rows.iter().all(|row| row.status.as_deref() != Some("fail"))),
        next: Some(next),
        fixed,
        checks: Some(rows),
    }
}

/// Every fix, in exact registry order; consecutive fixes of one owner are one call.
fn run_fixes(registry: &Registry, owners: &Owners, root: &Path) -> Vec<FixResult> {
    let mut results = Vec::with_capacity(registry.fixes.len());
    let mut at = 0;
    while at < registry.fixes.len() {
        let kind = owners.kind_of_fix(&registry.fixes[at]);
        let end = registry.fixes[at..]
            .iter()
            .position(|fix| owners.kind_of_fix(fix) != kind)
            .map_or(registry.fixes.len(), |len| at + len);
        let ids: Vec<&str> = registry.fixes[at..end]
            .iter()
            .map(|fix| fix.id.as_str())
            .collect();
        let mut done = owners.of(kind).run_fixes(root, &ids);
        done.truncate(ids.len());
        for id in &ids[done.len()..] {
            done.push(FixResult::done(
                id,
                false,
                "the owner of this fix gave no answer",
            ));
        }
        results.extend(done);
        at = end;
    }
    results
}

/// The colours of the `--pretty` form: on only for a terminal without `NO_COLOR` (any non-empty value).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Palette {
    pub enabled: bool,
}

impl Palette {
    /// The gate `fgos doctor --pretty` has always had: stdout is a terminal and `NO_COLOR` is unset or empty.
    pub fn for_stdout() -> Self {
        use std::io::IsTerminal;
        let no_color = std::env::var_os("NO_COLOR").is_some_and(|value| !value.is_empty());
        Self {
            enabled: std::io::stdout().is_terminal() && !no_color,
        }
    }

    fn paint(self, code: &str, text: &str) -> String {
        if self.enabled {
            format!("{code}{text}\x1b[0m")
        } else {
            text.to_owned()
        }
    }

    fn bold(self, text: &str) -> String {
        self.paint("\x1b[1m", text)
    }

    fn check_line(self, passed: bool, label: &str, detail: Option<&str>) -> String {
        let mark = if passed {
            self.paint("\x1b[32m", "\u{2713}")
        } else {
            self.paint("\x1b[31m", "\u{2717}")
        };
        match detail.filter(|detail| !detail.is_empty()) {
            Some(detail) => format!("{mark} {label} ({detail})"),
            None => format!("{mark} {label}"),
        }
    }
}

/// The `--pretty` form of a report: the title, one line per fix, one per row, then the commands to run next.
pub fn render_pretty(report: &Report, palette: Palette) -> String {
    let mut lines = vec![palette.bold("fgos doctor")];
    for fix in report.fixed.iter().flatten() {
        lines.push(palette.check_line(true, &format!("fix: {}", fix.id), fix.message.as_deref()));
    }
    for row in report.checks.iter().flatten() {
        lines.push(palette.check_line(
            row.passed.unwrap_or(false),
            row.description.as_deref().unwrap_or(""),
            row.message.as_deref(),
        ));
    }
    if let Some(next) = report.next.as_ref().filter(|next| !next.is_empty()) {
        lines.push(String::new());
        lines.push("Next:".to_owned());
        lines.extend(next.iter().map(|command| format!("  {command}")));
    }
    format!("{}\n", lines.join("\n"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    const REGISTRY: &str = r#"{
      "version": 1,
      "groups": { "config": { "owner": "bridge:S5", "idMap": { "config-machine-files": "gateway-token-configured" },
        "fixIdMap": { "create-machine-files": "gateway-token-configured" }, "fixIdPrefix": "config-",
        "descriptionOverrides": { "config-machine-files": "the gateway token file exists" } } },
      "rows": [
        { "id": "alpha", "description": "alpha is fine", "owner": "rust:identity" },
        { "id": "beta", "description": "beta is fine", "owner": "bridge:S7" },
        { "id": "ptr", "description": "read-only pointer: a count", "owner": "bridge:S7", "pointer": true },
        { "group": "config" },
        { "id": "gamma", "description": "gamma is fine", "owner": "rust:git" }
      ],
      "fixes": [
        { "id": "fix-beta", "owner": "bridge:S7", "repairs": ["beta"] },
        { "id": "fix-alpha", "owner": "rust:identity" },
        { "id": "fix-beta-too", "owner": "bridge:S7", "repairs": ["beta"] },
        { "group": "config" }
      ]
    }"#;
    const CONFIG: &str = r#"{
      "fixes": ["refresh-docs", "create-machine-files"],
      "rows": [
        { "id": "config-doc-drift", "description": "doc drift", "doctor": "warn", "check": "fail", "fix": "refresh-docs" },
        { "id": "config-machine-files", "description": "machine files", "doctor": "fail", "check": "fail", "fix": "create-machine-files" }
      ]
    }"#;

    fn registry() -> Registry {
        Registry::parse(REGISTRY, &[("config", CONFIG)]).unwrap()
    }

    /// An owner that records the calls it got and answers from a table.
    struct Scripted {
        calls: RefCell<Vec<String>>,
        rows: HashMap<&'static str, RowOutcome>,
        owns: Vec<&'static str>,
        owns_all: bool,
    }

    impl Scripted {
        /// An in-process owner with an adapter for the rows the test registry gives to Rust.
        fn new(rows: Vec<(&'static str, RowOutcome)>) -> Self {
            Self {
                calls: RefCell::new(Vec::new()),
                rows: rows.into_iter().collect(),
                owns: vec!["alpha", "fix-alpha", "gamma"],
                owns_all: false,
            }
        }

        /// The bridge: it takes whatever it is asked for.
        fn bridge(rows: Vec<(&'static str, RowOutcome)>) -> Self {
            Self {
                owns_all: true,
                ..Self::new(rows)
            }
        }
    }

    impl RowOwner for Scripted {
        fn run_fixes(&self, _root: &Path, ids: &[&str]) -> Vec<FixResult> {
            self.calls
                .borrow_mut()
                .push(format!("fix {}", ids.join(",")));
            ids.iter()
                .map(|id| FixResult::done(id, true, "repaired"))
                .collect()
        }

        fn handles_row(&self, id: &str) -> bool {
            self.owns_all || self.owns.contains(&id)
        }

        fn handles_fix(&self, id: &str) -> bool {
            self.owns_all || self.owns.contains(&id)
        }

        fn judge_rows(&self, _root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
            self.calls
                .borrow_mut()
                .push(format!("judge {}", ids.join(",")));
            ids.iter()
                .map(|id| {
                    self.rows.get(id).cloned().unwrap_or_else(|| {
                        RowOutcome::Judged(RowResult {
                            passed: true,
                            status: None,
                            message: Some("fine".into()),
                            fix_command: None,
                            detail: None,
                        })
                    })
                })
                .collect()
        }
    }

    fn judged(passed: bool, message: &str) -> RowOutcome {
        RowOutcome::Judged(RowResult {
            passed,
            status: None,
            message: Some(message.to_owned()),
            fix_command: None,
            detail: None,
        })
    }

    #[test]
    fn the_registry_expands_the_config_group_with_its_own_ids_descriptions_and_repairs() {
        let registry = registry();
        let ids: Vec<&str> = registry.rows.iter().map(|r| r.id.as_str()).collect();
        assert_eq!(
            ids,
            [
                "alpha",
                "beta",
                "ptr",
                "config-doc-drift",
                "gateway-token-configured",
                "gamma"
            ]
        );
        assert_eq!(
            registry.rows[4].description,
            "the gateway token file exists"
        );
        assert_eq!(registry.rows[3].description, "doc drift");
        assert!(registry.rows[2].pointer);
        let fixes: Vec<(&str, Vec<&str>)> = registry
            .fixes
            .iter()
            .map(|f| {
                (
                    f.id.as_str(),
                    f.repairs.iter().map(String::as_str).collect(),
                )
            })
            .collect();
        assert_eq!(
            fixes,
            [
                ("fix-beta", vec!["beta"]),
                ("fix-alpha", vec!["fix-alpha"]),
                ("fix-beta-too", vec!["beta"]),
                ("config-refresh-docs", vec!["config-doc-drift"]),
                ("gateway-token-configured", vec!["gateway-token-configured"]),
            ]
        );
    }

    #[test]
    fn a_registry_that_lists_an_id_twice_or_names_no_owner_is_refused_by_name() {
        let twice = REGISTRY.replace("\"id\": \"gamma\"", "\"id\": \"alpha\"");
        assert!(Registry::parse(&twice, &[("config", CONFIG)])
            .unwrap_err()
            .contains("row alpha is listed twice"));
        let ownerless = REGISTRY.replace(", \"owner\": \"rust:git\"", "");
        assert!(Registry::parse(&ownerless, &[("config", CONFIG)])
            .unwrap_err()
            .contains("row gamma has no owner"));
        let odd = REGISTRY.replace("rust:git", "elsewhere:git");
        assert!(Registry::parse(&odd, &[("config", CONFIG)])
            .unwrap_err()
            .contains("neither rust:<component> nor bridge:<step>"));
        assert!(Registry::parse(REGISTRY, &[])
            .unwrap_err()
            .contains("no contract was given for group config"));
    }

    #[test]
    fn a_row_level_follows_its_own_status_then_passed_then_a_warning_prefix() {
        let level = |passed, status, message: &str| {
            RowResult {
                passed,
                status,
                message: Some(message.to_owned()),
                fix_command: None,
                detail: None,
            }
            .level()
        };
        assert_eq!(level(false, None, "broken"), Status::Fail);
        assert_eq!(
            level(true, None, "warning: close to the limit"),
            Status::Warn
        );
        assert_eq!(level(true, None, "fine"), Status::Ok);
        assert_eq!(
            level(true, Some(Status::Skip), "nothing to judge"),
            Status::Skip
        );
        assert_eq!(
            level(false, Some(Status::Skip), "nothing to judge"),
            Status::Skip
        );
    }

    #[test]
    fn a_run_reports_ok_next_and_the_fix_of_each_failing_row_in_registry_order() {
        let native = Scripted::new(vec![("gamma", judged(false, "gamma is broken"))]);
        let bridge = Scripted::bridge(vec![
            ("beta", judged(false, "beta is broken")),
            (
                "config-doc-drift",
                RowOutcome::Judged(RowResult {
                    passed: false,
                    status: None,
                    message: Some("drifted".into()),
                    fix_command: Some("fgos config check".into()),
                    detail: None,
                }),
            ),
            (
                "gateway-token-configured",
                judged(false, "only a person can fix this"),
            ),
        ]);
        let report = run(
            &registry(),
            &Owners {
                native: &native,
                bridge: &bridge,
            },
            Path::new("/p"),
            Options::default(),
        );
        assert_eq!(report.ok, Some(false));
        assert_eq!(
            report.next.unwrap(),
            vec![
                "fgos doctor --fix".to_owned(),
                "fgos config check".to_owned()
            ]
        );
        assert!(report.fixed.is_none());
        let rows = report.checks.unwrap();
        let ids: Vec<&str> = rows.iter().map(|r| r.id.as_deref().unwrap()).collect();
        assert_eq!(
            ids,
            [
                "alpha",
                "beta",
                "ptr",
                "config-doc-drift",
                "gateway-token-configured",
                "gamma"
            ]
        );
        assert_eq!(rows[0].fix, None, "a passing row carries no fix");
        assert_eq!(rows[1].fix.as_ref().unwrap().command(), Some(FIX_COMMAND));
        assert_eq!(
            rows[3].fix.as_ref().unwrap().command(),
            Some("fgos config check")
        );
        assert_eq!(rows[4].fix.as_ref().unwrap().command(), Some(FIX_COMMAND));
        assert_eq!(
            rows[5].fix,
            Some(FixField::Nobody(())),
            "no fix repairs gamma"
        );
        assert_eq!(
            bridge.calls.borrow().len(),
            1,
            "every bridged row is one call"
        );
    }

    #[test]
    fn fixes_run_in_exact_registry_order_one_call_per_run_of_one_owner() {
        let native = Scripted::new(vec![]);
        let bridge = Scripted::bridge(vec![]);
        let report = run(
            &registry(),
            &Owners {
                native: &native,
                bridge: &bridge,
            },
            Path::new("/p"),
            Options { fix: true },
        );
        let fixed: Vec<&str> = report
            .fixed
            .as_ref()
            .unwrap()
            .iter()
            .map(|f| f.id.as_str())
            .collect();
        assert_eq!(
            fixed,
            [
                "fix-beta",
                "fix-alpha",
                "fix-beta-too",
                "config-refresh-docs",
                "gateway-token-configured"
            ]
        );
        assert_eq!(
            bridge
                .calls
                .borrow()
                .iter()
                .filter(|c| c.starts_with("fix"))
                .cloned()
                .collect::<Vec<_>>(),
            [
                "fix fix-beta",
                "fix fix-beta-too,config-refresh-docs,gateway-token-configured"
            ]
        );
        assert_eq!(
            native
                .calls
                .borrow()
                .iter()
                .filter(|c| c.starts_with("fix"))
                .count(),
            1
        );
    }

    #[test]
    fn a_row_the_registry_gives_to_rust_goes_to_the_bridge_until_rust_has_its_judge() {
        // The native owner has no adapter for anything: every row and fix goes to the bridge, whatever the registry
        // names, so a row is never dropped from a report while its Rust judge is still to come.
        let mut native = Scripted::new(vec![]);
        native.owns = vec![];
        let bridge = Scripted::bridge(vec![]);
        let report = run(
            &registry(),
            &Owners {
                native: &native,
                bridge: &bridge,
            },
            Path::new("/p"),
            Options { fix: true },
        );
        assert_eq!(report.checks.unwrap().len(), 6);
        assert!(native.calls.borrow().is_empty());
        assert_eq!(
            bridge
                .calls
                .borrow()
                .iter()
                .filter(|c| c.starts_with("judge"))
                .count(),
            1
        );
        assert_eq!(
            bridge
                .calls
                .borrow()
                .iter()
                .filter(|c| c.starts_with("fix"))
                .count(),
            1,
            "consecutive fixes of one owner are one call"
        );
    }

    #[test]
    fn rows_are_judged_after_the_fixes_ran() {
        let native = Scripted::new(vec![]);
        let bridge = Scripted::bridge(vec![]);
        run(
            &registry(),
            &Owners {
                native: &native,
                bridge: &bridge,
            },
            Path::new("/p"),
            Options { fix: true },
        );
        let bridge_calls = bridge.calls.borrow();
        let last_fix = bridge_calls
            .iter()
            .rposition(|c| c.starts_with("fix"))
            .unwrap();
        let judge = bridge_calls
            .iter()
            .position(|c| c.starts_with("judge"))
            .unwrap();
        assert!(last_fix < judge);
    }

    #[test]
    fn an_owner_that_cannot_judge_fails_each_of_its_rows_with_the_cause_and_names_it_once_in_next()
    {
        let cause = RowOutcome::Unavailable {
            message: "Node is not available".into(),
            next: "install Node 18 or newer, then run fgos doctor again".into(),
        };
        let native = Scripted::new(vec![]);
        let bridge = Scripted::bridge(vec![
            ("beta", cause.clone()),
            ("ptr", cause.clone()),
            ("config-doc-drift", cause.clone()),
            ("gateway-token-configured", cause),
        ]);
        let report = run(
            &registry(),
            &Owners {
                native: &native,
                bridge: &bridge,
            },
            Path::new("/p"),
            Options::default(),
        );
        assert_eq!(report.ok, Some(false));
        assert_eq!(
            report.next.unwrap(),
            vec!["install Node 18 or newer, then run fgos doctor again".to_owned()]
        );
        let rows = report.checks.unwrap();
        assert_eq!(rows[1].status.as_deref(), Some("fail"));
        assert_eq!(rows[1].message.as_deref(), Some("Node is not available"));
        assert_eq!(rows[1].fix, Some(FixField::Nobody(())));
        assert_eq!(
            rows[0].status.as_deref(),
            Some("ok"),
            "native rows are judged regardless"
        );
    }

    #[test]
    fn the_report_serialises_in_the_documented_key_order_and_omits_what_a_row_does_not_say() {
        let native = Scripted::new(vec![("gamma", judged(false, "x"))]);
        let bridge = Scripted::bridge(vec![]);
        let report = run(
            &registry(),
            &Owners {
                native: &native,
                bridge: &bridge,
            },
            Path::new("/p"),
            Options { fix: true },
        );
        let json = serde_json::to_string(&report).unwrap();
        let keys: Vec<usize> = ["\"ok\"", "\"next\"", "\"fixed\"", "\"checks\""]
            .iter()
            .map(|key| json.find(key).unwrap())
            .collect();
        assert!(keys.windows(2).all(|pair| pair[0] < pair[1]), "{json}");
        let row: Value = serde_json::to_value(&report.checks.unwrap()[5]).unwrap();
        let names: Vec<&String> = row.as_object().unwrap().keys().collect();
        assert_eq!(
            names,
            ["id", "description", "passed", "status", "message", "fix"]
        );
        assert!(row["fix"].is_null());
    }

    #[test]
    fn a_fix_that_says_nothing_about_a_field_leaves_it_out_of_the_report() {
        let silent: FixResult =
            serde_json::from_str(r#"{"id":"x","message":"launcher already current"}"#).unwrap();
        assert_eq!(silent.changed, None);
        assert_eq!(
            serde_json::to_string(&silent).unwrap(),
            r#"{"id":"x","message":"launcher already current"}"#
        );
        assert_eq!(
            serde_json::to_string(&FixResult::done("y", false, "nothing")).unwrap(),
            r#"{"id":"y","changed":false,"message":"nothing"}"#
        );
    }

    #[test]
    fn a_failing_row_with_no_repair_serialises_fix_as_null() {
        let row = ReportRow {
            id: Some("x".into()),
            fix: Some(FixField::Nobody(())),
            ..ReportRow::default()
        };
        assert_eq!(
            serde_json::to_string(&row).unwrap(),
            r#"{"id":"x","fix":null}"#
        );
    }

    #[test]
    fn strict_exits_one_only_when_a_row_still_fails() {
        let failing = Report {
            ok: Some(false),
            ..Report::default()
        };
        let passing = Report {
            ok: Some(true),
            ..Report::default()
        };
        assert_eq!(failing.exit_code(false), 0);
        assert_eq!(failing.exit_code(true), 1);
        assert_eq!(passing.exit_code(true), 0);
    }

    #[test]
    fn the_lenient_reader_takes_an_envelope_or_a_bare_report_and_ignores_fields_it_does_not_know() {
        let enveloped = r#"{"contract":"fgos.v1","data":{"ok":true,"next":[],"checks":[{"id":"a","status":"ok","future":1}],"added":"later"}}"#;
        let bare = r#"{"ok":false,"checks":[{"id":"a","status":"fail","fix":null,"message":"m"}]}"#;
        assert_eq!(Report::from_stdout(enveloped).unwrap().ok, Some(true));
        let report = Report::from_stdout(bare).unwrap();
        assert_eq!(report.failing().count(), 1);
        assert_eq!(report.checks.unwrap()[0].fix, None);
    }

    #[test]
    fn output_that_is_not_a_doctor_result_is_refused_with_the_reason() {
        assert!(matches!(
            Report::from_stdout("not json"),
            Err(ReportError::NotJson(_))
        ));
        assert_eq!(
            Report::from_stdout(r#"{"data":{"checks":[]}}"#),
            Err(ReportError::NoOk)
        );
        assert_eq!(
            Report::from_stdout(r#"{"ok":"yes"}"#),
            Err(ReportError::NoOk)
        );
        assert_eq!(ReportError::NoChecks.to_string(), "no `checks` list");
    }

    #[test]
    fn the_pretty_form_is_plain_text_without_colour_and_lists_fixes_rows_and_next() {
        let report = Report {
            ok: Some(false),
            next: Some(vec!["fgos doctor --fix".into()]),
            fixed: Some(vec![FixResult::done("fix-a", true, "1 repaired")]),
            checks: Some(vec![
                ReportRow {
                    description: Some("a works".into()),
                    passed: Some(true),
                    message: Some("fine".into()),
                    ..ReportRow::default()
                },
                ReportRow {
                    description: Some("b works".into()),
                    passed: Some(false),
                    ..ReportRow::default()
                },
            ]),
        };
        let text = render_pretty(&report, Palette { enabled: false });
        assert_eq!(
            text,
            "fgos doctor\n\u{2713} fix: fix-a (1 repaired)\n\u{2713} a works (fine)\n\u{2717} b works\n\nNext:\n  fgos doctor --fix\n"
        );
        let coloured = render_pretty(&report, Palette { enabled: true });
        assert!(coloured.starts_with("\x1b[1mfgos doctor\x1b[0m\n\x1b[32m\u{2713}\x1b[0m"));
        assert!(coloured.contains("\x1b[31m\u{2717}\x1b[0m b works"));
    }
}
