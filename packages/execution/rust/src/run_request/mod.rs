//! The run request a caller hands to the unit run: what `fgos run` asks of the Execution Core.
//!
//! [`build_run_request`] checks every flag of the three ways to run (a `"<prompt>"`, `--unit`, `--resume`), builds
//! the Unit a prompt stands for, folds `--effort`, `--timeout` and `--account` into the overrides, reads the request
//! parameters and the case the run is an activity of, and returns the options the unit run takes, or one refusal, so a
//! wrong flag leaves no unit run behind. The vectors of `packages/execution/contracts/core-unit/run-request.v1.json`
//! are its proof.
//!
//! Everything the request needs from outside comes through [`RunRequestHost`]: git roots, the case admission
//! answers, the dispatch depth, the runner config read, persona and plan lookup, a random suffix. The module is pure:
//! no file, clock, environment or process.

mod slug;
mod slug_table;

use crate::unit::{js_trim, normalize_plan_ref, PlanRef, Refusal};
use serde_json::{json, Map, Value};

pub use slug::slug_of;

/// The flags `fgos run` parsed: a bare flag is `true`, a repeated one an array.
pub type Flags = Map<String, Value>;

/// Where git says the main checkout is and whether a directory is a linked worktree.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GitRoots {
    pub main_checkout_root: String,
    pub is_linked_worktree: bool,
}

/// What the request reads from the machine and from the siblings that own the rest.
pub trait RunRequestHost {
    /// The caller's working directory (`roots.cwd`).
    fn cwd(&self) -> String;
    /// The directory a relative path of `--dir` or `--worktree` resolves against.
    fn process_cwd(&self) -> String;
    /// Git's answer for `dir`, or why it cannot say.
    fn git_roots(&self, dir: &str) -> Result<GitRoots, String>;
    /// Why a writing run from a confined worker is refused, `None` when the worker's view allows it.
    fn confined_write_refusal(&self, main_root: &str, case_id: Option<&str>) -> Option<String>;
    /// The unit a case's guide names for an activity, if the Workflow port answers one.
    fn activity_unit_of(
        &self,
        main_root: Option<&str>,
        case_id: &str,
        activity: &str,
    ) -> Option<Value>;
    /// The dispatch depth of this process (`0` outside a dispatched worker).
    fn dispatch_depth(&self) -> f64;
    /// Four random hex digits for an ad-hoc unit id.
    fn random_hex4(&self) -> String;
    /// `--timeout` text as milliseconds, refused like any run timeout (runner config owns the rule).
    fn parse_run_timeout(&self, text: &str) -> Result<u64, String>;
    /// The ids of the agent executors the project's runner config registers.
    fn provider_ids(&self, main_root: &str) -> Result<Vec<String>, Refusal>;
    /// Whether the persona resolves to an agent definition; the refusal sentence if not.
    fn check_agent_definition(&self, name: &str, project_root: &str) -> Result<(), String>;
    /// The Convention plan-name rule: why `name` is not a plan directory name, `None` when it is.
    fn plan_dir_problem(&self, name: &str, main_root: &str) -> Result<Option<String>, String>;
    /// Whether `<main_root>/<plan_dir>` is a real directory, not a link.
    fn is_plan_directory(&self, main_root: &str, plan_dir: &str) -> bool;
}

fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) | Some(Value::Bool(false)) => false,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f != 0.0),
        Some(_) => true,
    }
}

/// `String(value)` for a flag value.
fn text_of(value: &Value) -> String {
    match value {
        Value::String(s) => s.clone(),
        other => other.to_string(),
    }
}

/// A flag that is bare (`--flag` with no value) or empty means no value was given: refused, never passed on.
fn require_field<'a>(value: Option<&'a Value>, message: &str) -> Result<&'a Value, Refusal> {
    match value {
        None | Some(Value::Null) | Some(Value::Bool(true)) => Err(Refusal::config(message)),
        Some(Value::String(s)) if s.is_empty() => Err(Refusal::config(message)),
        Some(v) => Ok(v),
    }
}

/// `--writes a,b`: comma-separated entries, trimmed, blanks dropped; absent or bare means none.
fn parse_list_flag(value: Option<&Value>) -> Vec<String> {
    match value {
        None | Some(Value::Bool(true)) => vec![],
        Some(v) => text_of(v)
            .split(',')
            .map(|s| js_trim(s).to_string())
            .filter(|s| !s.is_empty())
            .collect(),
    }
}

/// The request parameters of a run: `--params` as one object and `--param key=value` scalars.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Request {
    pub params: Option<Value>,
    pub scalars: Vec<(String, String)>,
}

impl Request {
    pub fn to_json(&self) -> Value {
        let mut out = Map::new();
        out.insert(
            "scalars".into(),
            Value::Array(
                self.scalars
                    .iter()
                    .map(|(key, raw)| json!({ "key": key, "raw": raw }))
                    .collect(),
            ),
        );
        if let Some(params) = &self.params {
            out.insert("params".into(), params.clone());
        }
        Value::Object(out)
    }
}

/// Normalizes the request parameter flags into a canonical request shape.
pub fn request_from_flags(
    params: Option<&Value>,
    param: Option<&Value>,
) -> Result<Request, Refusal> {
    let mut parsed_params: Option<Map<String, Value>> = None;
    if let Some(params) = params {
        let Some(text) = params.as_str() else {
            return Err(Refusal::request(
                "param-invalid",
                "--params must be a JSON string",
            ));
        };
        let parsed: Value = serde_json::from_str(text).map_err(|e| {
            Refusal::request("param-invalid", format!("--params must be valid JSON: {e}"))
        })?;
        match parsed {
            Value::Object(map) => parsed_params = Some(map),
            _ => {
                return Err(Refusal::request(
                    "param-invalid",
                    "--params must parse to a plain JSON object",
                ))
            }
        }
    }

    let mut scalars: Vec<(String, String)> = Vec::new();
    if let Some(param) = param {
        if param == &Value::Bool(true) {
            return Err(Refusal::request(
                "param-invalid",
                "--param requires a key=value pair",
            ));
        }
        let list: Vec<&Value> = match param {
            Value::Array(items) => items.iter().collect(),
            single => vec![single],
        };
        for item in list {
            let Some(item) = item.as_str() else {
                return Err(Refusal::request(
                    "param-invalid",
                    "--param value must be a string key=value pair",
                ));
            };
            let Some((key, raw)) = item.split_once('=') else {
                return Err(Refusal::request(
                    "param-invalid",
                    format!("--param \"{item}\" missing \"=\" delimiter"),
                ));
            };
            if key.is_empty() {
                return Err(Refusal::request(
                    "param-invalid",
                    format!("--param \"{item}\" key cannot be empty"),
                ));
            }
            if raw.is_empty() {
                return Err(Refusal::request(
                    "param-invalid",
                    format!("--param \"{item}\" value cannot be empty"),
                ));
            }
            if scalars.iter().any(|(seen, _)| seen == key) {
                return Err(Refusal::request(
                    "param-request-conflict",
                    format!("parameter \"{key}\" specified more than once in --param"),
                ));
            }
            if parsed_params.as_ref().is_some_and(|p| p.contains_key(key)) {
                return Err(Refusal::request(
                    "param-request-conflict",
                    format!("parameter \"{key}\" specified in both --params and --param"),
                ));
            }
            scalars.push((key.to_string(), raw.to_string()));
        }
    }
    Ok(Request {
        params: parsed_params.map(Value::Object),
        scalars,
    })
}

fn is_object(value: &Value) -> bool {
    value.is_object()
}

/// A run-level setting (`--effort`, `--timeout`, `--account`) as overrides: `key: value` on every override that does
/// not name that key, and as a trailing unscoped override when none is unscoped, so a role no scoped override names
/// still gets it. Returns a new list; the input is not changed.
pub fn fold_run_setting(overrides: &[Value], key: &str, value: &Value) -> Vec<Value> {
    let mut folded: Vec<Value> = overrides.to_vec();
    let unscoped = |ov: &Value| ov.as_object().is_some_and(|o| !truthy(o.get("scope")));
    if !folded.iter().any(unscoped) {
        folded.push(Value::Object(Map::new()));
    }
    for ov in folded.iter_mut().filter(|ov| is_object(ov)) {
        if let Some(object) = ov.as_object_mut() {
            if !object.contains_key(key) {
                object.insert(key.to_string(), value.clone());
            }
        }
    }
    folded
}

/// `--override <json>`: one override object or a list of them.
fn parse_override_flag(value: Option<&Value>) -> Result<Vec<Value>, Refusal> {
    let text = match value {
        None | Some(Value::Null) | Some(Value::Bool(false)) => return Ok(vec![]),
        Some(Value::String(s)) if s.is_empty() => return Ok(vec![]),
        Some(v) => text_of(v),
    };
    match serde_json::from_str::<Value>(&text) {
        Ok(Value::Array(list)) => Ok(list),
        Ok(other) => Ok(vec![other]),
        Err(e) => Err(Refusal::config(format!("invalid JSON for --override: {e}"))),
    }
}

/// The overrides a run's flags imply, and nothing else: each fold is the one rule, [`fold_run_setting`].
fn overrides_from_flags(
    flags: &Flags,
    resuming: bool,
    host: &dyn RunRequestHost,
) -> Result<Vec<Value>, Refusal> {
    let mut overrides = parse_override_flag(flags.get("override"))?;
    // `--effort <level>` is a reasoningEffort override; bind checks it against the chosen executor.
    if flags.contains_key("effort") {
        let level = require_field(
            flags.get("effort"),
            "--effort requires a level (low, medium, high, max)",
        )?;
        overrides = fold_run_setting(&overrides, "reasoningEffort", level);
    }
    // `--timeout <dur>` gives the run its own time instead of `runner.timeoutMs`. It is kept with the unit, so a
    // resumed run keeps it and `--timeout` cannot change it.
    if flags.contains_key("timeout") {
        if resuming {
            return Err(Refusal::config(
                "--timeout cannot change a resumed unit run: it keeps the timeout it was started with",
            ));
        }
        let text = require_field(
            flags.get("timeout"),
            "--timeout requires a duration, e.g. 90m or 5400s",
        )?;
        let ms = host
            .parse_run_timeout(&text_of(text))
            .map_err(Refusal::config)?;
        overrides = fold_run_setting(&overrides, "timeoutMs", &json!(ms));
    }
    // `--account <pool/account>` pins the account; a resumed run keeps the account its bindings already carry.
    if flags.contains_key("account") {
        if resuming {
            return Err(Refusal::config(
                "--account cannot change a resumed unit run: it keeps the account its seats were bound to",
            ));
        }
        let account = require_field(
            flags.get("account"),
            "--account requires pool/account (an account of a pool in ~/.fgos/private/accounts.yaml, for example openai/work)",
        )?;
        overrides = fold_run_setting(&overrides, "account", account);
    }
    Ok(overrides)
}

/// A plan as every door that takes one checks it: the shape ([`normalize_plan_ref`]), a name that passes the
/// Convention plan rule (asked of the host, never re-checked here), and `plans/<name>` a real directory under the
/// project's main checkout. Absent input reads as no plan.
pub fn existing_plan_ref(
    value: &Value,
    main_root: &str,
    host: &dyn RunRequestHost,
) -> Result<Option<PlanRef>, Refusal> {
    let Some(plan) = normalize_plan_ref(Some(value))? else {
        return Ok(None);
    };
    let shown = value.get("dir").map(text_of).unwrap_or_default();
    let name = &plan.dir["plans/".len()..];
    if let Some(problem) = host
        .plan_dir_problem(name, main_root)
        .map_err(Refusal::host)?
    {
        return Err(Refusal::config(format!(
            "plan \"{shown}\" is not a plan directory name: {problem}"
        )));
    }
    if !host.is_plan_directory(main_root, &plan.dir) {
        return Err(Refusal::config(format!(
            "plan \"{shown}\" is not an existing plan directory: {} is not under {main_root}",
            plan.dir
        )));
    }
    Ok(Some(plan))
}

/// `--plan <dir> [--phase <id>]`: the plan a run serves. The directory must exist under the project's `plans/`; no
/// flag means no plan, and a phase without a plan is refused. Shared by `fgos run` and `fgos workflow start`.
pub fn plan_from_flags(
    flags: &Flags,
    main_root: &str,
    host: &dyn RunRequestHost,
) -> Result<Option<PlanRef>, Refusal> {
    if !flags.contains_key("plan") && !flags.contains_key("phase") {
        return Ok(None);
    }
    let dir = require_field(
        flags.get("plan"),
        if flags.contains_key("plan") {
            "--plan requires a plans/<dir> directory, e.g. --plan plans/261118-0936-ops-metrics"
        } else {
            "--phase needs --plan <plans/dir>: a phase is a part of a plan"
        },
    )?;
    let phase = match flags.get("phase") {
        None => None,
        Some(_) => Some(require_field(
            flags.get("phase"),
            "--phase requires a phase id, e.g. --phase 3",
        )?),
    };
    let mut value = Map::new();
    value.insert("dir".into(), dir.clone());
    if let Some(phase) = phase {
        value.insert("phase".into(), Value::String(text_of(phase)));
    }
    existing_plan_ref(&Value::Object(value), main_root, host)
}

/// Node's `path.resolve(base, path)` on this platform: `path` joined onto `base` (an absolute `path`, or on Windows one
/// with its own drive, stands alone; a rooted one keeps only the drive of `base`), with `.` and `..` segments and
/// repeated or trailing separators resolved lexically, never past the root. The result uses the platform separator.
fn resolve_path(base: &str, path: &str) -> String {
    use std::path::{Component, Path, PathBuf};
    let mut out = PathBuf::new();
    for component in Path::new(base).join(path).components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                if matches!(out.components().next_back(), Some(Component::Normal(_))) {
                    out.pop();
                }
            }
            other => out.push(other.as_os_str()),
        }
    }
    out.to_string_lossy().into_owned()
}

/// Where a writing unit would run: `--worktree`, else here. Only a linked worktree may be written.
fn is_linked_worktree(flags: &Flags, host: &dyn RunRequestHost) -> Result<bool, Refusal> {
    let dir = match flags.get("worktree").filter(|w| truthy(Some(w))) {
        Some(w) => resolve_path(&host.process_cwd(), &text_of(w)),
        None => host.cwd(),
    };
    host.git_roots(&dir)
        .map(|roots| roots.is_linked_worktree)
        .map_err(Refusal::host)
}

/// The Unit `fgos run "<prompt>"` stands for: the prompt is its objective, `--writes` its write scope (none: a
/// read-only unit), `--provider` its soft executor preference, `--persona` its persona, `--input` the files it is
/// handed, `--verify` the command that checks its work and `--plan`/`--phase` the plan and phase it serves. Every flag
/// is checked against the config and the persona tiers here. A writing unit needs a linked worktree; this never
/// creates one.
fn adhoc_unit_from_prompt(
    prompt: Option<&str>,
    flags: &Flags,
    main_root: &str,
    host: &dyn RunRequestHost,
) -> Result<Value, Refusal> {
    // `--sync <ref>` without a prompt is a sync-only unit: the runner merges the ref and a worker runs only when the
    // merge stops on conflicts.
    let sync_only = prompt.is_none() && flags.contains_key("sync");
    if !sync_only && prompt.is_none_or(|p| js_trim(p).is_empty()) {
        return Err(Refusal::config(
            "fgos run \"<prompt>\" needs a non-empty prompt",
        ));
    }
    let sync_base = match flags.get("sync") {
        None => None,
        Some(_) => Some(text_of(require_field(
            flags.get("sync"),
            "--sync requires a ref to merge (a branch, tag or commit, e.g. main)",
        )?)),
    };
    let writes = parse_list_flag(flags.get("writes"));
    if sync_base.is_some() && !flags.contains_key("writes") {
        return Err(Refusal::config(
            "fgos run --sync needs --writes: merging a ref changes the branch, so the unit is a writing unit in a linked worktree (the conflicted paths join the scope by themselves)",
        ));
    }
    if flags.contains_key("writes") && writes.is_empty() {
        return Err(Refusal::config(
            "fgos run \"<prompt>\" --writes needs at least one path; omit it for a read-only unit",
        ));
    }
    if !writes.is_empty() && !is_linked_worktree(flags, host)? {
        return Err(Refusal::config(
            "fgos run \"<prompt>\" --writes needs a linked worktree: create one with `git worktree add <path>` and pass --worktree <path> (or run from inside it)",
        ));
    }
    let inputs = parse_list_flag(flags.get("input"));
    if flags.contains_key("input") && inputs.is_empty() {
        return Err(Refusal::config(
            "fgos run \"<prompt>\" --input needs at least one repo-relative path (comma-separated); omit it for a unit with no input files",
        ));
    }
    let prefer = parse_list_flag(flags.get("provider"));
    if flags.contains_key("provider") {
        let valid = host.provider_ids(main_root)?;
        let unknown = prefer.iter().find(|id| !valid.contains(id));
        if prefer.is_empty() || unknown.is_some() {
            return Err(Refusal::config(format!(
                "unknown --provider \"{}\"; valid providers: {}",
                unknown.map(String::as_str).unwrap_or(""),
                if valid.is_empty() {
                    "(none registered)".to_string()
                } else {
                    valid.join(", ")
                }
            )));
        }
    }
    if flags.contains_key("persona") {
        let persona = require_field(flags.get("persona"), "--persona requires a persona name")?;
        host.check_agent_definition(&text_of(persona), main_root)
            .map_err(Refusal::config)?;
    }
    let plan = plan_from_flags(flags, main_root, host)?;

    let slug_source = if sync_only {
        format!("sync-{}", sync_base.as_deref().unwrap_or_default())
    } else {
        prompt.unwrap_or_default().to_string()
    };
    let mut unit = Map::new();
    unit.insert(
        "id".into(),
        json!(format!(
            "adhoc-{}-{}",
            slug_of(&slug_source, "task"),
            host.random_hex4()
        )),
    );
    if !sync_only {
        unit.insert("objective".into(), json!(prompt.unwrap_or_default()));
    }
    if let Some(sync_base) = &sync_base {
        unit.insert("syncBase".into(), json!(sync_base));
    }
    unit.insert(
        "capability".into(),
        match flags.get("capability") {
            None => json!("execute"),
            Some(_) => require_field(
                flags.get("capability"),
                "--capability requires a capability name",
            )?
            .clone(),
        },
    );
    unit.insert("writes".into(), json!(writes));
    if flags.contains_key("rigor") {
        unit.insert(
            "rigor".into(),
            require_field(flags.get("rigor"), "--rigor requires a level")?.clone(),
        );
    }
    if !prefer.is_empty() {
        unit.insert("prefer".into(), json!(prefer));
    }
    if let Some(persona) = flags.get("persona") {
        unit.insert("persona".into(), persona.clone());
    }
    if !inputs.is_empty() {
        unit.insert("inputs".into(), json!(inputs));
    }
    if flags.contains_key("verify") {
        unit.insert(
            "verify".into(),
            require_field(
                flags.get("verify"),
                "--verify requires a command, e.g. --verify \"npm test\"",
            )?
            .clone(),
        );
    }
    if let Some(plan) = plan {
        unit.insert("plan".into(), plan.to_json());
    }
    Ok(Value::Object(unit))
}

/// The case a run is an activity of, from `--case <id> --activity <id>`; the other case flags mean nothing without them.
fn case_ref_from_flags(flags: &Flags, resuming: bool) -> Result<Option<Value>, Refusal> {
    let given: Vec<&str> = ["case", "activity", "route", "reason"]
        .into_iter()
        .filter(|f| flags.contains_key(*f))
        .collect();
    if given.is_empty() {
        return Ok(None);
    }
    if resuming {
        return Err(Refusal::config(
            "--case cannot change a resumed unit run: it keeps the case it was admitted into",
        ));
    }
    let first_other = given
        .iter()
        .find(|f| **f != "case")
        .copied()
        .unwrap_or("case");
    let case_id = require_field(
        flags.get("case"),
        &format!(
            "--{first_other} needs --case <caseId>: {} only apply to a run that names a case",
            given.join(", ")
        ),
    )?;
    let activity = require_field(
        flags.get("activity"),
        "--case needs --activity <id>: the activity of the case's guide this run is",
    )?;
    if let Some(route) = flags.get("route") {
        if !matches!(route.as_str(), Some("should" | "may-instead" | "unlisted")) {
            return Err(Refusal::config(
                "--route must be should, may-instead or unlisted",
            ));
        }
    }
    let mut case_ref = Map::new();
    case_ref.insert("caseId".into(), case_id.clone());
    case_ref.insert("activity".into(), activity.clone());
    if let Some(route) = flags.get("route") {
        case_ref.insert("route".into(), route.clone());
    }
    if flags.contains_key("reason") {
        case_ref.insert(
            "reason".into(),
            require_field(flags.get("reason"), "--reason requires text")?.clone(),
        );
    }
    Ok(Some(Value::Object(case_ref)))
}

/// The ways to say what to run are exclusive, and the flags of one way mean nothing to another: refused, never dropped.
fn refuse_conflicting_flags(flags: &Flags, positional: &[String]) -> Result<(), Refusal> {
    let unit = flags.get("unit");
    let resume = flags.get("resume");
    let prompt = positional.first();
    if !truthy(unit) && !truthy(resume) && prompt.is_none() && !flags.contains_key("sync") {
        return Err(Refusal::config(
            "fgos run requires --unit <file|-> or --resume <unitRunId>, a \"<prompt>\", or --sync <ref>",
        ));
    }
    let ways = [unit.is_some(), resume.is_some(), prompt.is_some()];
    if ways.iter().filter(|w| **w).count() > 1 {
        return Err(Refusal::config(
            "fgos run takes either a \"<prompt>\", --unit or --resume, not more than one",
        ));
    }
    if positional.len() > 1 {
        return Err(Refusal::config(format!(
            "fgos run takes one prompt; quote the prompt (\"{}\")",
            positional.join(" ")
        )));
    }
    // A bare `--sync <ref>` builds a sync-only unit from the same flags (a --unit file names `syncBase`).
    if flags.contains_key("sync") && (truthy(unit) || truthy(resume)) {
        return Err(Refusal::config(
            "--sync only applies to fgos run \"<prompt>\" or a bare --sync <ref>; a --unit file names syncBase, and a resume keeps the sync it started with",
        ));
    }
    let builds_unit = prompt.is_some() || flags.contains_key("sync");
    if !builds_unit {
        let prompt_only = [
            "provider",
            "persona",
            "writes",
            "capability",
            "rigor",
            "input",
            "verify",
            "plan",
            "phase",
        ];
        if let Some(flag) = prompt_only.iter().find(|f| flags.contains_key(**f)) {
            return Err(Refusal::config(format!(
                "--{flag} only applies to fgos run \"<prompt>\""
            )));
        }
    }
    Ok(())
}

/// What `fgos run` hands the unit run: the Unit a prompt stands for, the overrides, the request parameters and the
/// case, with the options a run always carries.
#[derive(Debug, Clone, PartialEq)]
#[non_exhaustive]
pub struct RunRequest {
    pub unit_path: Option<Value>,
    pub unit_data: Option<Value>,
    /// The project root the case admission port is created for, when one is known.
    pub case_admission_root: Option<String>,
    pub case_ref: Option<Value>,
    pub activity_unit: Option<Value>,
    pub request: Option<Request>,
    /// No door of this release can attest a person, so a tier raise or an accepted dependence is refused by name.
    pub raise_authorized: bool,
    /// A run's own account pin is strict: no seat taking it refuses the run, and a pin never moves a seat to another pool.
    pub account_pin: &'static str,
    pub pattern: Option<Value>,
    pub stance_options: Option<Vec<String>>,
    pub overrides: Vec<Value>,
    pub resume_unit_run_id: Option<Value>,
    pub repo_root: Option<Value>,
    pub cwd: String,
    pub worktree: Option<Value>,
}

impl RunRequest {
    /// The options object `runUnit` takes, keys in Node's order and absent when unset. `case_admission` builds the
    /// port object the shell hands for a project root.
    pub fn to_json(&self, case_admission: &dyn Fn(&str) -> Value) -> Value {
        let mut out = Map::new();
        let mut put = |key: &str, value: Option<Value>| {
            if let Some(value) = value {
                out.insert(key.to_string(), value);
            }
        };
        put("unitPath", self.unit_path.clone());
        put("unitData", self.unit_data.clone());
        put(
            "caseAdmission",
            self.case_admission_root.as_deref().map(case_admission),
        );
        put("caseRef", self.case_ref.clone());
        put("activityUnit", self.activity_unit.clone());
        put("request", self.request.as_ref().map(Request::to_json));
        put("raiseAuthorized", Some(json!(self.raise_authorized)));
        put("accountPin", Some(json!(self.account_pin)));
        put("pattern", self.pattern.clone());
        put(
            "stanceOptions",
            self.stance_options.as_ref().map(|s| json!(s)),
        );
        put("overrides", Some(Value::Array(self.overrides.clone())));
        put("resumeUnitRunId", self.resume_unit_run_id.clone());
        put("repoRoot", self.repo_root.clone());
        put("cwd", Some(json!(self.cwd)));
        put("worktree", self.worktree.clone());
        Value::Object(out)
    }
}

/// Everything `fgos run` decides before a unit run exists: the flags of the three ways to run, the Unit a prompt
/// stands for, the overrides, the request parameters and the case the run is an activity of. Returns the options the
/// unit run takes, or one refusal.
pub fn build_run_request(
    flags: &Flags,
    positional: &[String],
    host: &dyn RunRequestHost,
) -> Result<RunRequest, Refusal> {
    refuse_conflicting_flags(flags, positional)?;
    let unit_path = flags.get("unit");
    let resume = flags.get("resume");
    let resuming = truthy(resume);
    let prompt = positional.first().map(String::as_str);
    let builds_unit = prompt.is_some() || flags.contains_key("sync");
    let overrides = overrides_from_flags(flags, resuming, host)?;

    let repo_root = flags.get("dir");
    let worktree = flags.get("worktree");
    let resolved_dir = match repo_root.filter(|d| truthy(Some(d))) {
        Some(Value::String(dir)) => Some(resolve_path(&host.process_cwd(), dir)),
        Some(_) => {
            return Err(Refusal {
                name: "TypeError",
                message: "The \"path\" argument must be of type string.".to_string(),
                code: Some("ERR_INVALID_ARG_TYPE".to_string()),
                phase: None,
            })
        }
        None => None,
    };
    let port_root: Option<String> = match &resolved_dir {
        Some(dir) => Some(dir.clone()),
        None => host
            .git_roots(&host.cwd())
            .ok()
            .map(|roots| roots.main_checkout_root),
    };
    // A writing run from inside a dispatched (confined) worker is refused before anything needs the config, a lock or
    // an addon: Execution knows it is dispatched, the Workflow port knows what the worker's view of the case ledger is.
    if flags.contains_key("writes") && host.dispatch_depth() > 0.0 {
        let cwd = host.cwd();
        let case_id = flags.get("case").and_then(Value::as_str);
        let main_root = port_root.as_deref().unwrap_or(&cwd);
        if let Some(confined) = host
            .confined_write_refusal(main_root, case_id)
            .filter(|c| !c.is_empty())
        {
            return Err(Refusal::coded(
                format!("nested-write-from-confined-worker: a writing dispatch from inside a confined worker is refused: {confined}; a confined worker may dispatch read-only work only"),
                "nested-write-from-confined-worker",
                "pre-admission",
            ));
        }
    }
    // Everything about the one-liner is checked here, before the unit run is created.
    let unit_data = if builds_unit {
        let main_root = match &resolved_dir {
            Some(dir) => dir.clone(),
            None => {
                host.git_roots(&host.cwd())
                    .map_err(Refusal::host)?
                    .main_checkout_root
            }
        };
        Some(adhoc_unit_from_prompt(prompt, flags, &main_root, host)?)
    } else {
        None
    };
    if resuming {
        if flags.contains_key("params") {
            return Err(Refusal::config(
                "--params cannot change a resumed unit run: it keeps the request it was started with",
            ));
        }
        if flags.contains_key("param") {
            return Err(Refusal::config(
                "--param cannot change a resumed unit run: it keeps the request it was started with",
            ));
        }
    }
    let request = if flags.contains_key("params") || flags.contains_key("param") {
        Some(
            request_from_flags(flags.get("params"), flags.get("param")).map_err(|err| Refusal {
                name: "RunnerConfigError",
                message: format!("{}: {}", err.code.clone().unwrap_or_default(), err.message),
                code: err.code,
                phase: Some("pre-admission".to_string()),
            })?,
        )
    } else {
        None
    };
    // A run that names a case is admitted into it (entry, MUST rules, write overlap, frame) before anything exists;
    // without one it is standalone, and a writing one goes on only into a worktree no case owns.
    let case_ref = case_ref_from_flags(flags, resuming)?;
    let activity_unit = case_ref.as_ref().and_then(|case| {
        host.activity_unit_of(
            port_root.as_deref(),
            case["caseId"].as_str().unwrap_or_default(),
            case["activity"].as_str().unwrap_or_default(),
        )
    });
    let stance_options = match flags.get("stance-options") {
        None => None,
        Some(_) => Some(
            text_of(require_field(
                flags.get("stance-options"),
                "--stance-options requires pipe-separated option labels",
            )?)
            .split('|')
            .map(str::to_string)
            .collect(),
        ),
    };

    Ok(RunRequest {
        unit_path: unit_path.cloned(),
        unit_data,
        case_admission_root: port_root,
        case_ref,
        activity_unit,
        request,
        raise_authorized: false,
        account_pin: "strict",
        pattern: flags.get("pattern").cloned(),
        stance_options,
        overrides,
        resume_unit_run_id: resume.cloned(),
        repo_root: repo_root.cloned(),
        cwd: host.cwd(),
        worktree: worktree.cloned(),
    })
}

#[cfg(test)]
mod tests {
    use super::resolve_path;

    /// `--dir` and `--worktree` resolve as Node's `path.resolve` does on the platform the CLI runs on.
    #[cfg(unix)]
    #[test]
    fn resolve_path_resolves_as_node_path_resolve_on_posix() {
        assert_eq!(resolve_path("/work/repo", "../wt//x/./"), "/work/wt/x");
        assert_eq!(resolve_path("/work/repo", "/abs/../b"), "/b");
        assert_eq!(resolve_path("/work", "../../.."), "/");
        assert_eq!(resolve_path("/work", ""), "/work");
    }

    #[cfg(windows)]
    #[test]
    fn resolve_path_resolves_as_node_path_resolve_on_windows() {
        assert_eq!(
            resolve_path(r"C:\work\repo", "../wt//x/./"),
            r"C:\work\wt\x"
        );
        assert_eq!(resolve_path(r"C:\work", r"D:\other\.\y"), r"D:\other\y");
        assert_eq!(resolve_path(r"C:\work\repo", r"\top"), r"C:\top");
        assert_eq!(resolve_path(r"C:\work", r"..\..\.."), r"C:\");
    }
}
