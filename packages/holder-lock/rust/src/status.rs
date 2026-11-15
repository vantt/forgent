//! The read-only report behind `fgos lock-status`: every repo- and machine-scoped row of the lock registry as
//! `free` or `held`, with the holders the kernel shows and the guarantee of the directory the lock file lives in,
//! plus the findings that need a person (`problems`) and the commit-activity beacon.
//!
//! A lock file that does not exist cannot be held, so nothing is created to ask. The instances of every row come
//! from one rule, the registry's own path template: each `<placeholder>` the caller knows is filled, every other
//! one is a wildcard part of a path segment, and only the lock files that exist are listed. The run-scoped rows
//! (`advance`, `recovery`, `attempt`) live in directories this crate does not know the layout of: the caller lists
//! them and passes, per row, the parameter sets that fill the row's template ([`RunInstances`]).
//!
//! The answer is JSON in the key order the Node CLI printed (the envelope's data hash covers that order), so the
//! crate builds it with `serde_json` objects that keep insertion order.

use crate::hot_record::{self, Read};
use crate::origin::{self, Origin};
use crate::port::{self, HoldersList, Level, Probe, Resource};
use crate::predecessor;
use crate::scope;
use crate::state_root;
use fgos_process::facts::{judge_here, Record, Verdict};
use serde_json::{json, Map, Value};
use std::collections::BTreeMap;
use std::fmt;
use std::fs;
use std::io;
use std::path::{Component, Path, PathBuf};
use std::time::UNIX_EPOCH;

/// How long a hot record the judge cannot place may sit before it is worth a warning.
pub const UNKNOWN_JUDGE_GRACE_MS: f64 = 5.0 * 60.0 * 1000.0;

/// The beacon's path under the state directory.
pub const BEACON_RELATIVE_PATH: [&str; 2] = ["runtime", "main-checkout-activity.json"];

/// The registry row whose lock files are listed last among the problems.
const ATTEMPT_ROW: &str = "attempt";

/// The hot mutexes of the state store, by registry name.
const HOT_RESOURCES: [&str; 2] = hot_record::RESOURCES;

/// Values for the placeholders of one row's template, one set per run directory.
pub type Params = BTreeMap<String, String>;

/// The parameter sets of the run-scoped rows, by row name, as the caller found them on disk.
pub type RunInstances = BTreeMap<String, Vec<Params>>;

/// What the report needs from the caller.
pub struct StatusRequest<'a> {
    /// The project's `.fgos` directory.
    pub fgos_dir: &'a Path,
    /// The machine lock root (`<state root>/locks`).
    pub lock_root: &'a Path,
    /// The run-scoped rows' instances.
    pub run_instances: &'a RunInstances,
    /// Now, in milliseconds since the Unix epoch.
    pub now_ms: i64,
}

/// Why the report could not be made.
#[derive(Debug)]
pub enum StatusError {
    /// The beacon file exists but cannot be read.
    Beacon(io::Error),
}

impl fmt::Display for StatusError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Beacon(err) => write!(f, "{}", node_io_text(err, "read", None)),
        }
    }
}

impl std::error::Error for StatusError {}

/// `{ mainCheckout, locks, problems, beacon }`.
pub fn collect(request: &StatusRequest<'_>) -> Result<Value, StatusError> {
    collect_with(scope::registry(), request)
}

/// [`collect`] over any registry document (the tests' own rows).
pub fn collect_with(registry: &Value, request: &StatusRequest<'_>) -> Result<Value, StatusError> {
    let rows = registry["locks"].as_array().cloned().unwrap_or_default();
    let known_repo = known_params(request.fgos_dir, None);
    let known_machine = known_params(request.fgos_dir, Some(request.lock_root));
    let mut locks = Vec::new();
    for entry in &rows {
        let scope_name = entry["scope"].as_str().unwrap_or("");
        if scope_name != "repo" && scope_name != "machine" {
            continue;
        }
        let known = if scope_name == "machine" {
            &known_machine
        } else {
            &known_repo
        };
        locks.push(report_row(entry, known));
    }
    let main = locks.iter().find(|row| row["name"] == "main-checkout");
    let field = |key: &str| match main.map(|row| &row[key]) {
        Some(Value::Null) | None => Value::Null,
        Some(value) => value.clone(),
    };
    let main_checkout = json!({
        "outcome": match main.map(|row| &row["status"]) {
            Some(Value::String(status)) => json!(status),
            _ => json!("unknown"),
        },
        "holders": field("holders"),
        "path": field("path"),
        "guarantee": field("guarantee"),
    });
    Ok(json!({
        "mainCheckout": main_checkout,
        "locks": locks,
        "problems": problems(&rows, request),
        "beacon": beacon_status(request.fgos_dir, request.now_ms)?,
    }))
}

fn known_params(fgos_dir: &Path, lock_root: Option<&Path>) -> Params {
    let mut known = Params::new();
    known.insert("fgosDir".into(), fgos_dir.to_string_lossy().into_owned());
    if let Some(root) = lock_root {
        known.insert("lockRoot".into(), root.to_string_lossy().into_owned());
    }
    known
}

// ---------------------------------------------------------------------
// templates
// ---------------------------------------------------------------------

/// The placeholders of `text`: `(start, end, key)` for each `<key>` with a non-empty key free of angle brackets.
fn placeholders(text: &str) -> Vec<(usize, usize, &str)> {
    let mut found = Vec::new();
    let mut from = 0;
    while let Some(open) = text[from..].find('<').map(|n| from + n) {
        let rest = &text[open + 1..];
        match rest.find(['<', '>']) {
            Some(n) if n > 0 && rest.as_bytes()[n] == b'>' => {
                found.push((open, open + 1 + n + 1, &rest[..n]));
                from = open + 1 + n + 1;
            }
            _ => from = open + 1,
        }
    }
    found
}

/// `template` with every placeholder `params` has a value for filled in; the others stay.
fn fill_known(template: &str, params: &Params) -> String {
    let mut out = String::new();
    let mut at = 0;
    for (start, end, key) in placeholders(template) {
        out.push_str(&template[at..start]);
        match params.get(key) {
            Some(value) => out.push_str(value),
            None => out.push_str(&template[start..end]),
        }
        at = end;
    }
    out.push_str(&template[at..]);
    out
}

/// `template` with every placeholder filled, or the first key `params` has no non-empty value for.
fn fill_all(template: &str, params: &Params) -> Result<String, String> {
    let mut out = String::new();
    let mut at = 0;
    for (start, end, key) in placeholders(template) {
        out.push_str(&template[at..start]);
        match params.get(key).filter(|value| !value.is_empty()) {
            Some(value) => out.push_str(value),
            None => return Err(key.to_owned()),
        }
        at = end;
    }
    out.push_str(&template[at..]);
    Ok(out)
}

/// An absolute path with `.`, `..` and repeated separators folded away, as `path.resolve` leaves it.
fn resolve(text: &str) -> PathBuf {
    let path = PathBuf::from(text);
    let absolute = if path.is_absolute() {
        path
    } else {
        std::env::current_dir().unwrap_or_default().join(path)
    };
    let mut out = PathBuf::new();
    for part in absolute.components() {
        match part {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    out
}

/// Whether `name` matches a path segment's pattern: the literal parts in order with `.+` between them (a
/// wildcard matches at least one character and never a line terminator).
fn segment_matches(literals: &[Vec<char>], name: &[char]) -> bool {
    fn wild(c: &char) -> bool {
        !matches!(c, '\n' | '\r' | '\u{2028}' | '\u{2029}')
    }
    fn after_wildcard(literals: &[Vec<char>], name: &[char]) -> bool {
        let Some((literal, rest)) = literals.split_first() else {
            return name.is_empty();
        };
        (1..=name.len())
            .take_while(|take| wild(&name[take - 1]))
            .any(|take| {
                name[take..].starts_with(literal)
                    && after_wildcard(rest, &name[take + literal.len()..])
            })
    }
    let Some((first, rest)) = literals.split_first() else {
        return false;
    };
    name.starts_with(first) && after_wildcard(rest, &name[first.len()..])
}

fn sorted_names(dir: &Path) -> Vec<String> {
    let mut names: Vec<String> = match fs::read_dir(dir) {
        Ok(entries) => entries
            .filter_map(|entry| entry.ok())
            .map(|entry| entry.file_name().to_string_lossy().into_owned())
            .collect(),
        Err(_) => Vec::new(),
    };
    names.sort_by(|a, b| a.as_bytes().cmp(b.as_bytes()));
    names
}

fn is_file(path: &Path) -> bool {
    fs::metadata(path).is_ok_and(|meta| meta.is_file())
}

/// The lock files of a template that exist: the known placeholders filled, every other one a wildcard part of a
/// path segment. The first segment is taken as written.
fn existing_instances(template: &str, known: &Params) -> Vec<PathBuf> {
    let filled = fill_known(template, known);
    let mut segments = filled.split('/');
    let first = segments.next().unwrap_or("");
    let mut candidates = vec![PathBuf::from(if first.is_empty() { "/" } else { first })];
    for segment in segments {
        let holes = placeholders(segment);
        let mut next = Vec::new();
        if holes.is_empty() {
            for base in &candidates {
                next.push(base.join(segment));
            }
        } else {
            let mut literals = Vec::new();
            let mut at = 0;
            for (start, end, _) in &holes {
                literals.push(segment[at..*start].chars().collect::<Vec<char>>());
                at = *end;
            }
            literals.push(segment[at..].chars().collect());
            for base in &candidates {
                for name in sorted_names(base) {
                    let chars: Vec<char> = name.chars().collect();
                    if segment_matches(&literals, &chars) {
                        next.push(base.join(&name));
                    }
                }
            }
        }
        candidates = next;
    }
    candidates.into_iter().filter(|c| is_file(c)).collect()
}

// ---------------------------------------------------------------------
// rows
// ---------------------------------------------------------------------

/// A Node error as `{ code, message }`.
fn note(code: &str, message: &str) -> Value {
    json!({ "code": code, "message": message })
}

/// The name Node gives an OS error (`EACCES`), where it has one.
fn errno_name(err: &io::Error) -> Option<&'static str> {
    #[cfg(unix)]
    {
        Some(match err.raw_os_error()? {
            libc::ENOENT => "ENOENT",
            libc::EACCES => "EACCES",
            libc::EPERM => "EPERM",
            libc::EISDIR => "EISDIR",
            libc::ENOTDIR => "ENOTDIR",
            libc::ELOOP => "ELOOP",
            libc::EBUSY => "EBUSY",
            libc::EROFS => "EROFS",
            libc::EMFILE => "EMFILE",
            libc::ENAMETOOLONG => "ENAMETOOLONG",
            _ => return None,
        })
    }
    #[cfg(not(unix))]
    {
        match err.kind() {
            io::ErrorKind::NotFound => Some("ENOENT"),
            io::ErrorKind::PermissionDenied => Some("EACCES"),
            _ => None,
        }
    }
}

/// libuv's wording of an OS error.
fn uv_text(err: &io::Error) -> String {
    match errno_name(err) {
        Some("ENOENT") => "no such file or directory".into(),
        Some("EACCES") => "permission denied".into(),
        Some("EPERM") => "operation not permitted".into(),
        Some("EISDIR") => "illegal operation on a directory".into(),
        Some("ENOTDIR") => "not a directory".into(),
        Some("ELOOP") => "too many symbolic links encountered".into(),
        Some("EBUSY") => "resource busy or locked".into(),
        Some("EROFS") => "read-only file system".into(),
        _ => {
            let text = err.to_string();
            let cut = text.find(" (os error").unwrap_or(text.len());
            text[..cut].to_lowercase()
        }
    }
}

/// An OS error as Node words it: `EACCES: permission denied, open '<path>'`.
fn node_io_text(err: &io::Error, call: &str, path: Option<&Path>) -> String {
    let code = errno_name(err).unwrap_or("UNKNOWN");
    match path {
        Some(path) => format!("{code}: {}, {call} '{}'", uv_text(err), path.display()),
        None => format!("{code}: {}, {call}", uv_text(err)),
    }
}

fn io_note(err: &io::Error, call: &str, path: &Path) -> Value {
    note(
        errno_name(err).unwrap_or("UNKNOWN"),
        &node_io_text(err, call, Some(path)),
    )
}

/// `{ holders: [pid] }` or `{ holders: null, holdersNote }`, as the row prints the kernel's list.
fn holders_fields(name: &str, lock_path: &Path) -> (Value, Option<Value>) {
    match port::holders(&Resource::new(name, lock_path)) {
        Ok(HoldersList::List(tuples)) => (
            Value::Array(tuples.iter().map(|t| json!(t.pid.0)).collect()),
            None,
        ),
        Ok(HoldersList::Unlistable(reason)) => (Value::Null, Some(json!(reason))),
        Err(err) => (
            Value::Null,
            Some(json!(format!("cannot open {}: {err}", lock_path.display()))),
        ),
    }
}

fn guarantee_of(lock_path: &Path) -> Value {
    let dir = lock_path.parent().unwrap_or(Path::new("."));
    if !dir.exists() {
        return Value::Null;
    }
    let guarantee = port::guarantee(dir);
    let mut out = json!({ "driver": guarantee.driver, "exclusion": guarantee.exclusion.as_str() });
    if !guarantee.notes.is_empty() {
        out["notes"] = json!(guarantee.notes);
    }
    out
}

/// What asking the kernel about an existing lock file answers: the status, or the error the Node CLI reported.
fn probe_status(name: &str, lock_path: &Path) -> Result<&'static str, Value> {
    if let Err(err) = fs::OpenOptions::new()
        .read(true)
        .write(true)
        .open(lock_path)
    {
        return Err(io_note(&err, "open", lock_path));
    }
    let dir = lock_path.parent().unwrap_or(Path::new("."));
    let guarantee = port::guarantee(dir);
    let detail = guarantee.notes.join("; ");
    match guarantee.exclusion {
        Level::None => {
            return Err(note(
                "lock-driver-unavailable",
                &format!(
                    "{}: the {} driver gives no exclusion on this filesystem ({detail})",
                    dir.display(),
                    guarantee.driver
                ),
            ))
        }
        Level::Unsupported => {
            return Err(note(
                "lock-driver-unavailable",
                &format!(
                    "{}: no holder-lock driver on {} ({detail})",
                    dir.display(),
                    guarantee.platform
                ),
            ))
        }
        _ => {}
    }
    match port::probe(&Resource::new(name, lock_path)) {
        Ok(Probe::Free) => Ok("free"),
        Ok(Probe::Held) => Ok("held"),
        Err(err) if err.kind() == io::ErrorKind::Unsupported => {
            Err(note("lock-driver-unavailable", &format!("{name}: {err}")))
        }
        Err(err) => Err(note(
            "lock-door-error",
            &format!("holder-lock-io: probe {}: {err}", lock_path.display()),
        )),
    }
}

fn base_fields(entry: &Value) -> Map<String, Value> {
    let mut base = Map::new();
    for key in ["name", "kind", "scope", "rank"] {
        base.insert(key.into(), entry[key].clone());
    }
    base
}

fn report_row(entry: &Value, known: &Params) -> Value {
    let name = entry["name"].as_str().unwrap_or("");
    let Some(template) = entry["v3Path"].as_str() else {
        let mut row = base_fields(entry);
        row.insert("status".into(), json!("not-node-owned"));
        row.insert("owner".into(), entry["owner"].clone());
        return Value::Object(row);
    };
    match fill_all(template, known) {
        Ok(filled) => report_fixed_row(entry, name, &resolve(&filled)),
        Err(_) => report_parametric_row(entry, name, template, known),
    }
}

fn report_fixed_row(entry: &Value, name: &str, lock_path: &Path) -> Value {
    let mut row = base_fields(entry);
    row.insert("path".into(), json!(lock_path.to_string_lossy()));
    if !lock_path.exists() {
        row.insert("status".into(), json!("free"));
        row.insert("holders".into(), json!([]));
        row.insert("via".into(), json!("absent-file"));
        return Value::Object(row);
    }
    let (holders, holders_note) = holders_fields(name, lock_path);
    let listed = |row: &mut Map<String, Value>| {
        row.insert("holders".into(), holders.clone());
        if let Some(note) = &holders_note {
            row.insert("holdersNote".into(), note.clone());
        }
    };
    match probe_status(name, lock_path) {
        Ok(status) => {
            row.insert("status".into(), json!(status));
            listed(&mut row);
            row.insert("via".into(), json!("probe"));
            row.insert("guarantee".into(), guarantee_of(lock_path));
        }
        Err(error) => {
            row.insert("status".into(), json!("unknown"));
            listed(&mut row);
            row.insert("via".into(), json!("probe"));
            row.insert("error".into(), error);
        }
    }
    Value::Object(row)
}

fn report_parametric_row(entry: &Value, name: &str, template: &str, known: &Params) -> Value {
    let mut row = base_fields(entry);
    row.insert("parametric".into(), json!(true));
    row.insert("template".into(), json!(template));
    let instances: Vec<Value> = existing_instances(template, known)
        .into_iter()
        .map(|file| {
            let (holders, holders_note) = holders_fields(name, &file);
            let status = match &holders {
                Value::Null => "unknown",
                Value::Array(list) if !list.is_empty() => "held",
                _ => "free",
            };
            let mut instance = Map::new();
            instance.insert("path".into(), json!(file.to_string_lossy()));
            instance.insert("status".into(), json!(status));
            instance.insert("holders".into(), holders);
            if let Some(note) = holders_note {
                instance.insert("holdersNote".into(), note);
            }
            Value::Object(instance)
        })
        .collect();
    let any = |wanted: &str| instances.iter().any(|i| i["status"] == wanted);
    let status = if any("held") {
        "held"
    } else if any("unknown") {
        "unknown"
    } else {
        "free"
    };
    row.insert("status".into(), json!(status));
    row.insert("via".into(), json!("holders"));
    row.insert("instances".into(), Value::Array(instances));
    Value::Object(row)
}

// ---------------------------------------------------------------------
// problems
// ---------------------------------------------------------------------

/// `JSON.stringify(value)` for a value that may be absent (`undefined` prints as such in a template).
fn js_json(value: Option<&Value>) -> String {
    match value {
        None => "undefined".into(),
        Some(value) => serde_json::to_string(value).unwrap_or_default(),
    }
}

/// A value as a template literal prints it.
fn js_text(value: Option<&Value>) -> String {
    match value {
        None => "undefined".into(),
        Some(Value::String(text)) => text.clone(),
        Some(Value::Null) => "null".into(),
        Some(other) => other.to_string(),
    }
}

/// `text.slice(0, units)` over UTF-16 code units.
fn slice_units(text: &str, units: usize) -> String {
    let wide: Vec<u16> = text.encode_utf16().take(units).collect();
    String::from_utf16_lossy(&wide)
}

/// A JS number as `String(n)` prints it, for whole numbers.
fn js_number(value: &Value) -> String {
    match value.as_f64() {
        Some(f) if f.fract() == 0.0 && f.abs() < 1e21 => format!("{}", f as i128),
        _ => value.to_string(),
    }
}

/// A `windows-job` record is judged by the host (one read-only contender-view pass, never a kill): `empty` and
/// `absent` are no problem, anything else warns with the domain and the reason the host names.
fn windows_job_problem(lock_file: &Path, record_path: &str, record: &Value) -> Option<String> {
    let view = predecessor::contender_view(lock_file);
    let state = view["state"].as_str().unwrap_or("");
    if state == "empty" || state == "absent" {
        return None;
    }
    let domain = match view.get("domain") {
        Some(Value::Null) | None => record.get("domainId"),
        other => other,
    };
    let reason = match view.get("reason") {
        Some(Value::Null) | None => "no reason named".to_owned(),
        Some(reason) => js_text(Some(reason)),
    };
    Some(format!(
        "{record_path}: windows-job domain {} is {state} ({reason}); the next holder ends it, or an acquire answers held (predecessor-domain-not-empty)",
        js_json(domain),
    ))
}

/// `None` when the predecessor record is absent or names an empty domain; otherwise why it does not.
fn predecessor_problem(lock_file: &Path) -> Option<String> {
    let record_path = predecessor::record_path(lock_file)
        .to_string_lossy()
        .into_owned();
    let raw = match fs::read(&record_path) {
        Ok(bytes) => String::from_utf8_lossy(&bytes).into_owned(),
        Err(err) if err.kind() == io::ErrorKind::NotFound => return None,
        Err(err) => {
            return Some(format!(
                "{record_path} unreadable ({})",
                errno_name(&err).unwrap_or("UNKNOWN")
            ))
        }
    };
    let Ok(record) = serde_json::from_str::<Value>(&raw) else {
        return Some(format!(
            "{record_path} is not JSON: {}",
            slice_units(&raw, 120)
        ));
    };
    if record.get("v").and_then(Value::as_f64) != Some(1.0) {
        return Some(format!(
            "{record_path} has unknown version {}: {}",
            js_json(record.get("v")),
            slice_units(&raw, 120)
        ));
    }
    if record.get("domainKind").and_then(Value::as_str) == Some("windows-job") {
        return windows_job_problem(lock_file, &record_path, &record);
    }
    let domain = record.get("domainId").cloned().unwrap_or(Value::Null);
    let verdict = judge_here(&Record::from_json(&domain));
    if verdict == Verdict::Dead {
        return None;
    }
    let verdict = match verdict {
        Verdict::Alive => "alive",
        Verdict::Unknown => "unknown",
        Verdict::Dead => "dead",
    };
    Some(format!(
        "{record_path}: {} domain {} is not empty ({verdict}); the next holder kills it, or an acquire answers held (predecessor-domain-not-empty)",
        js_text(record.get("domainKind")),
        js_json(record.get("domainId")),
    ))
}

fn record_age_ms(record_path: &Path, now_ms: i64) -> f64 {
    let modified = fs::metadata(record_path)
        .and_then(|meta| meta.modified())
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok());
    match modified {
        Some(since) => now_ms as f64 - since.as_secs_f64() * 1000.0,
        None => 0.0,
    }
}

/// Why a hot record needs a person, or `None` when it is absent or healthy. A record that does not parse is a
/// problem at once; a parsed record whose holder the judge answers `unknown` for longer than the grace is one too
/// (a live holder answers `unknown` only when the process table or its namespace cannot be read, so a young record
/// is just a busy holder).
fn hot_record_problem(resource: &str, fgos_dir: &Path, now_ms: i64) -> Option<String> {
    let paths = hot_record::paths(fgos_dir, resource).ok()?;
    let record_path = paths.record.to_string_lossy().into_owned();
    match hot_record::read_record(&paths.record) {
        Err(hot_record::HotRecordError::Io(err)) => Some(format!(
            "{resource}: {record_path} cannot be read ({})",
            errno_name(&err)
                .map(str::to_owned)
                .unwrap_or_else(|| node_io_text(&err, "read", None))
        )),
        Err(other) => Some(format!("{resource}: {record_path} cannot be read ({other})")),
        Ok(Read::Missing) => None,
        Ok(Read::Retry { code }) => Some(format!(
            "{resource}: {record_path} is open by another process (sharing violation, {code}); stop that process"
        )),
        Ok(Read::Unreadable { token }) => {
            let raw = String::from_utf8_lossy(&token);
            Some(format!(
                "{resource}: {record_path} does not parse ({})",
                serde_json::to_string(&slice_units(&raw, 80)).unwrap_or_default()
            ))
        }
        Ok(Read::Ok { record, .. }) => {
            if judge_here(&Record::from_json(&record)) != Verdict::Unknown {
                return None;
            }
            let age = record_age_ms(&paths.record, now_ms);
            if age <= UNKNOWN_JUDGE_GRACE_MS {
                return None;
            }
            Some(format!(
                "{resource}: {record_path} names pid {} that cannot be judged here, for {} min",
                record.get("pid").map(js_number).unwrap_or_default(),
                (age / 60_000.0 + 0.5).floor() as i64
            ))
        }
    }
}

/// The hot records of this workspace that need a person, each with the one way out. Never repaired here.
fn hot_record_problems(fgos_dir: &Path, now_ms: i64) -> Vec<String> {
    HOT_RESOURCES
        .iter()
        .filter_map(|resource| {
            hot_record_problem(resource, fgos_dir, now_ms).map(|problem| {
                format!(
                    "{problem}; once the holder is confirmed gone, run: fgos lock fence {resource}"
                )
            })
        })
        .collect()
}

/// The lock files that exist for every row the report scans, in registry order, the attempt locks last.
fn scanned_files(rows: &[Value], request: &StatusRequest<'_>) -> Vec<(String, Vec<PathBuf>)> {
    let known_repo = known_params(request.fgos_dir, None);
    let known_machine = known_params(request.fgos_dir, Some(request.lock_root));
    let run_files = |name: &str, template: &str| -> Vec<PathBuf> {
        request
            .run_instances
            .get(name)
            .into_iter()
            .flatten()
            .filter_map(|params| fill_all(template, params).ok())
            .map(PathBuf::from)
            .filter(|file| is_file(file))
            .collect()
    };
    let mut scanned = Vec::new();
    let mut attempt = None;
    for entry in rows {
        let name = entry["name"].as_str().unwrap_or("").to_owned();
        let Some(template) = entry["v3Path"].as_str() else {
            continue;
        };
        match entry["scope"].as_str().unwrap_or("") {
            "repo" => scanned.push((name, existing_instances(template, &known_repo))),
            "machine" => scanned.push((name, existing_instances(template, &known_machine))),
            "run" if name == ATTEMPT_ROW => {
                attempt = Some((name.clone(), run_files(&name, template)))
            }
            "run" => scanned.push((name.clone(), run_files(&name, template))),
            _ => {}
        }
    }
    scanned.extend(attempt);
    scanned
}

/// What needs a person among the lock files of the registry's rows: a holder the kernel lists that is neither a
/// fgOS process nor a child of a `run_borrowed` call of that lock, a `predecessor.json` naming a domain that is not
/// empty, and a hot record that does not parse or whose holder cannot be judged. A platform that cannot list holders
/// reports none. Nothing is repaired here.
fn problems(rows: &[Value], request: &StatusRequest<'_>) -> Vec<String> {
    let mut foreign = Vec::new();
    let mut predecessors = Vec::new();
    let state_root = state_root::state_root().0;
    for (lock, files) in scanned_files(rows, request) {
        for file in files {
            if let Some(problem) = predecessor_problem(&file) {
                predecessors.push(format!("{lock}: {problem}"));
            }
            let Ok(HoldersList::List(tuples)) = port::holders(&Resource::new(&lock, &file)) else {
                continue;
            };
            for holder in origin::describe(tuples, &lock, &state_root) {
                let member_elsewhere =
                    holder.origin == Origin::AttemptMember && lock != ATTEMPT_ROW;
                if holder.origin == Origin::Foreign || member_elsewhere {
                    foreign.push(format!(
                        "{lock} {} held by pid {} ({}), not a fgOS process nor a borrowed child",
                        file.display(),
                        holder.tuple.pid.0,
                        holder.cmdline
                    ));
                }
            }
        }
    }
    foreign.extend(predecessors);
    foreign.extend(hot_record_problems(request.fgos_dir, request.now_ms));
    foreign
}

// ---------------------------------------------------------------------
// beacon
// ---------------------------------------------------------------------

/// A JS safe integer: a whole number within 2^53 - 1.
fn safe_integer(value: &Value) -> Option<i64> {
    const LIMIT: f64 = 9_007_199_254_740_991.0;
    let float = value.as_f64()?;
    (float.fract() == 0.0 && float.abs() <= LIMIT).then_some(float as i64)
}

/// The beacon's record when `raw` is a beacon this release knows: version 1, kind `beacon`, a writer with a
/// non-empty text id or a positive integer id, and a positive safe-integer `writtenAt` and `windowMs`.
pub fn parse_beacon(raw: &str) -> Option<Value> {
    let parsed: Value = serde_json::from_str(raw).ok()?;
    let object = parsed.as_object()?;
    if object.get("v").and_then(Value::as_f64) != Some(1.0) || object.get("kind")? != "beacon" {
        return None;
    }
    let writer = object.get("writer")?;
    let writer_id = match writer.get("id")? {
        Value::String(text) => !text.is_empty(),
        number @ Value::Number(_) => safe_integer(number).is_some_and(|n| n > 0),
        _ => false,
    };
    if !writer.is_object() || !writer_id {
        return None;
    }
    for key in ["writtenAt", "windowMs"] {
        if !safe_integer(object.get(key)?).is_some_and(|n| n > 0) {
            return None;
        }
    }
    Some(parsed)
}

/// The commit-activity beacon on its own: a hint the pre-commit hook reads, never a lock to wait on.
fn beacon_status(fgos_dir: &Path, now_ms: i64) -> Result<Value, StatusError> {
    let path = BEACON_RELATIVE_PATH
        .iter()
        .fold(fgos_dir.to_path_buf(), |dir, part| dir.join(part));
    let raw = match fs::read(&path) {
        Ok(bytes) => String::from_utf8_lossy(&bytes).into_owned(),
        Err(err) if err.kind() == io::ErrorKind::NotFound => {
            return Ok(json!({ "status": "none" }))
        }
        Err(err) => return Err(StatusError::Beacon(err)),
    };
    let Some(record) = parse_beacon(&raw) else {
        return Ok(json!({ "status": "corrupt" }));
    };
    let written_at = safe_integer(&record["writtenAt"]).unwrap_or(0);
    let window_ms = safe_integer(&record["windowMs"]).unwrap_or(0);
    let age_ms = now_ms - written_at;
    let writer = match &record["writer"]["id"] {
        number @ Value::Number(_) => json!(safe_integer(number).unwrap_or(0)),
        other => other.clone(),
    };
    Ok(json!({
        "status": "present",
        "writer": writer,
        "ageMs": age_ms,
        "windowMs": window_ms,
        "active": age_ms <= window_ms,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::port::{acquire, Acquire, Mode, Wait};
    use fgos_process::facts::{self, Observed};
    use fgos_process::ProcId;
    use std::sync::atomic::{AtomicU32, Ordering};

    static NEXT: AtomicU32 = AtomicU32::new(0);

    /// A scratch project: `<dir>/.fgos` with `locks`, and a machine lock root beside it.
    struct Fixture {
        dir: PathBuf,
    }

    impl Fixture {
        fn new() -> Self {
            let dir = std::env::temp_dir().join(format!(
                "fgos-lock-status-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            fs::create_dir_all(dir.join(".fgos/locks")).unwrap();
            fs::create_dir_all(dir.join("machine")).unwrap();
            Fixture { dir }
        }
        fn fgos(&self) -> PathBuf {
            self.dir.join(".fgos")
        }
        fn locks(&self) -> PathBuf {
            self.fgos().join("locks")
        }
        fn machine(&self) -> PathBuf {
            self.dir.join("machine")
        }
        fn report(&self, registry: &Value, run: &RunInstances) -> Value {
            self.report_at(registry, run, 1_000_000)
        }
        fn report_at(&self, registry: &Value, run: &RunInstances, now_ms: i64) -> Value {
            collect_with(
                registry,
                &StatusRequest {
                    fgos_dir: &self.fgos(),
                    lock_root: &self.machine(),
                    run_instances: run,
                    now_ms,
                },
            )
            .unwrap()
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.dir);
        }
    }

    fn row(name: &str, scope: &str, template: Value) -> Value {
        json!({ "name": name, "kind": "mutex", "scope": scope, "rank": 10, "v3Path": template })
    }

    fn registry(rows: Vec<Value>) -> Value {
        json!({ "locks": rows })
    }

    fn none() -> RunInstances {
        RunInstances::new()
    }

    fn hold(path: &Path) -> crate::port::Handle {
        match acquire(
            &Resource::new("test", path),
            Mode::Ex,
            Wait::Ms(0),
            crate::port::DEFAULT_KILL_WAIT_MS,
        ) {
            Acquire::Acquired(handle) => handle,
            other => panic!("could not hold {}: {other:?}", path.display()),
        }
    }

    fn keys(value: &Value) -> Vec<&str> {
        value
            .as_object()
            .unwrap()
            .keys()
            .map(String::as_str)
            .collect()
    }

    #[test]
    fn a_row_whose_file_does_not_exist_is_free_and_nothing_is_created() {
        let fx = Fixture::new();
        let reg = registry(vec![row(
            "gateway",
            "repo",
            json!("<fgosDir>/locks/gateway.lock"),
        )]);
        let report = fx.report(&reg, &none());
        let row = &report["locks"][0];
        assert_eq!(row["status"], "free");
        assert_eq!(row["via"], "absent-file");
        assert_eq!(row["holders"], json!([]));
        assert!(!fx.locks().join("gateway.lock").exists());
        assert_eq!(report["mainCheckout"]["outcome"], "unknown");
    }

    #[test]
    fn the_answer_has_the_keys_and_order_the_node_report_printed() {
        let fx = Fixture::new();
        fs::write(fx.locks().join("main-checkout.lock"), "").unwrap();
        let reg = registry(vec![
            row(
                "main-checkout",
                "repo",
                json!("<fgosDir>/locks/main-checkout.lock"),
            ),
            row(
                "merge-slot",
                "repo",
                json!("<fgosDir>/locks/merge-slot--<ref>.lock"),
            ),
        ]);
        let report = fx.report(&reg, &none());
        assert_eq!(
            keys(&report),
            ["mainCheckout", "locks", "problems", "beacon"]
        );
        assert_eq!(
            keys(&report["mainCheckout"]),
            ["outcome", "holders", "path", "guarantee"]
        );
        assert_eq!(
            keys(&report["locks"][0]),
            [
                "name",
                "kind",
                "scope",
                "rank",
                "path",
                "status",
                "holders",
                "via",
                "guarantee"
            ]
        );
        assert_eq!(
            keys(&report["locks"][1]),
            [
                "name",
                "kind",
                "scope",
                "rank",
                "parametric",
                "template",
                "status",
                "via",
                "instances"
            ]
        );
        assert_eq!(report["mainCheckout"]["outcome"], "free");
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn a_held_fixed_row_names_its_holder_and_a_free_one_is_probed() {
        let fx = Fixture::new();
        let reg = registry(vec![
            row("gateway", "repo", json!("<fgosDir>/locks/gateway.lock")),
            row("runner", "repo", json!("<fgosDir>/locks/runner.lock")),
        ]);
        fs::write(fx.locks().join("runner.lock"), "").unwrap();
        let _held = hold(&fx.locks().join("gateway.lock"));
        let report = fx.report(&reg, &none());
        assert_eq!(report["locks"][0]["status"], "held");
        assert_eq!(report["locks"][0]["holders"], json!([std::process::id()]));
        assert_eq!(report["locks"][0]["via"], "probe");
        assert_eq!(report["locks"][1]["status"], "free");
        assert_eq!(report["locks"][1]["holders"], json!([]));
    }

    #[test]
    fn a_parametric_row_lists_the_files_its_template_matches_and_judges_each_by_its_holders() {
        let fx = Fixture::new();
        for name in [
            "merge-slot--main.lock",
            "merge-slot--.lock",
            "merge-slot--x.txt",
            "other.lock",
        ] {
            fs::write(fx.locks().join(name), "").unwrap();
        }
        let reg = registry(vec![row(
            "merge-slot",
            "repo",
            json!("<fgosDir>/locks/merge-slot--<ref>.lock"),
        )]);
        let report = fx.report(&reg, &none());
        let instances = report["locks"][0]["instances"].as_array().unwrap();
        let paths: Vec<&str> = instances
            .iter()
            .map(|i| i["path"].as_str().unwrap())
            .collect();
        assert_eq!(
            paths.len(),
            1,
            "an empty placeholder and other names match nothing: {paths:?}"
        );
        assert!(paths[0].ends_with("merge-slot--main.lock"));
        assert_eq!(report["locks"][0]["status"], "free");
        #[cfg(target_os = "linux")]
        {
            let _held = hold(&fx.locks().join("merge-slot--main.lock"));
            let report = fx.report(&reg, &none());
            assert_eq!(report["locks"][0]["status"], "held");
            assert_eq!(
                report["locks"][0]["instances"][0]["holders"],
                json!([std::process::id()])
            );
        }
    }

    #[test]
    fn a_template_with_a_placeholder_the_report_cannot_know_lists_nothing() {
        let fx = Fixture::new();
        let reg = registry(vec![row(
            "event-seal",
            "repo",
            json!("<eventOpenRoot>/locks/event-seal.lock"),
        )]);
        let report = fx.report(&reg, &none());
        assert_eq!(report["locks"][0]["parametric"], true);
        assert_eq!(report["locks"][0]["instances"], json!([]));
        assert_eq!(report["locks"][0]["status"], "free");
    }

    #[test]
    fn a_machine_row_resolves_under_the_lock_root_and_a_provider_account_nests_two_levels() {
        let fx = Fixture::new();
        fs::create_dir_all(fx.machine().join("provider-account/claude")).unwrap();
        fs::write(fx.machine().join("provider-account/claude/a.lock"), "").unwrap();
        fs::write(fx.machine().join("install.lock"), "").unwrap();
        let reg = registry(vec![
            row("install", "machine", json!("<lockRoot>/install.lock")),
            row(
                "provider-account",
                "machine",
                json!("<lockRoot>/provider-account/<provider>/<account>.lock"),
            ),
        ]);
        let report = fx.report(&reg, &none());
        assert!(report["locks"][0]["path"]
            .as_str()
            .unwrap()
            .ends_with("machine/install.lock"));
        assert_eq!(report["locks"][1]["instances"].as_array().unwrap().len(), 1);
    }

    #[test]
    fn a_row_without_a_path_is_reported_as_not_node_owned() {
        let fx = Fixture::new();
        let mut owned = row("rust-only", "repo", Value::Null);
        owned["owner"] = json!("rust");
        let report = fx.report(&registry(vec![owned]), &none());
        assert_eq!(
            report["locks"][0],
            json!({"name":"rust-only","kind":"mutex","scope":"repo","rank":10,"status":"not-node-owned","owner":"rust"})
        );
    }

    #[test]
    fn run_scoped_rows_are_never_listed_and_the_attempt_locks_come_last_among_the_problems() {
        let fx = Fixture::new();
        let reg = registry(vec![
            row("attempt", "run", json!("<runDir>/runs/<NN>/attempt.lock")),
            row(
                "advance",
                "run",
                json!("<workflowRunDir>/locks/advance.lock"),
            ),
        ]);
        let wf = fx.dir.join("wf1");
        fs::create_dir_all(wf.join("locks")).unwrap();
        fs::write(wf.join("locks/advance.lock"), "").unwrap();
        let attempt = fx.dir.join("run/runs/01");
        fs::create_dir_all(&attempt).unwrap();
        fs::write(attempt.join("attempt.lock"), "").unwrap();
        for file in [wf.join("locks/advance.lock"), attempt.join("attempt.lock")] {
            fs::write(predecessor::record_path(&file), "not json").unwrap();
        }
        let mut run = RunInstances::new();
        run.insert(
            "advance".into(),
            vec![Params::from([(
                "workflowRunDir".into(),
                wf.to_string_lossy().into_owned(),
            )])],
        );
        run.insert(
            "attempt".into(),
            vec![Params::from([
                (
                    "runDir".into(),
                    fx.dir.join("run").to_string_lossy().into_owned(),
                ),
                ("NN".into(), "01".into()),
            ])],
        );
        let report = fx.report(&reg, &run);
        assert_eq!(report["locks"], json!([]));
        let problems = report["problems"].as_array().unwrap();
        assert_eq!(problems.len(), 2);
        assert!(
            problems[0].as_str().unwrap().starts_with("advance: "),
            "{problems:?}"
        );
        assert!(
            problems[1].as_str().unwrap().starts_with("attempt: "),
            "{problems:?}"
        );
        assert!(problems[0]
            .as_str()
            .unwrap()
            .contains("is not JSON: not json"));
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn a_holder_that_is_not_a_fgos_process_is_a_problem_and_a_free_file_is_not() {
        let fx = Fixture::new();
        let reg = registry(vec![
            row("gateway", "repo", json!("<fgosDir>/locks/gateway.lock")),
            row("runner", "repo", json!("<fgosDir>/locks/runner.lock")),
        ]);
        fs::write(fx.locks().join("runner.lock"), "").unwrap();
        let _held = hold(&fx.locks().join("gateway.lock"));
        let report = fx.report(&reg, &none());
        let problems = report["problems"].as_array().unwrap();
        assert_eq!(problems.len(), 1, "{problems:?}");
        let text = problems[0].as_str().unwrap();
        assert!(text.starts_with("gateway "), "{text}");
        assert!(
            text.contains(&format!("held by pid {}", std::process::id())),
            "{text}"
        );
        assert!(
            text.ends_with("), not a fgOS process nor a borrowed child"),
            "{text}"
        );
    }

    fn gate_domain(pid: u32, start: &str) -> Value {
        json!({
            "host": facts::host(),
            "bootId": facts::boot_id(),
            "pid": pid,
            "startTime": start,
            "pidNs": facts::pid_ns().id,
        })
    }

    fn predecessor_record(kind: &str, domain: Value) -> String {
        json!({ "v": 1, "domainKind": kind, "domainId": domain }).to_string()
    }

    fn problem_of(raw: &str) -> Option<String> {
        let fx = Fixture::new();
        let file = fx.locks().join("gateway.lock");
        fs::write(&file, "").unwrap();
        fs::write(predecessor::record_path(&file), raw).unwrap();
        predecessor_problem(&file)
    }

    #[test]
    fn a_predecessor_record_that_is_absent_unreadable_unknown_or_names_a_dead_domain_needs_no_person_only_the_rest_do(
    ) {
        let fx = Fixture::new();
        let file = fx.locks().join("gateway.lock");
        assert_eq!(predecessor_problem(&file), None, "absent record");
        let record = predecessor::record_path(&file);
        fs::create_dir(&record).unwrap();
        assert!(predecessor_problem(&file)
            .unwrap()
            .ends_with("unreadable (EISDIR)"));
        fs::remove_dir(&record).unwrap();

        let long = "x".repeat(200);
        let text = problem_of(&long).unwrap();
        assert!(text.contains("is not JSON: "), "{text}");
        assert!(
            text.ends_with(&"x".repeat(120)),
            "the text is cut at 120 characters"
        );

        let text = problem_of("{\"v\":2}").unwrap();
        assert!(text.contains("has unknown version 2: {\"v\":2}"), "{text}");
        assert!(problem_of("{}")
            .unwrap()
            .contains("has unknown version undefined: {}"));
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn a_predecessor_domain_is_a_problem_unless_the_judge_proves_it_dead() {
        let mut child = std::process::Command::new("true").spawn().unwrap();
        let gone = child.id();
        child.wait().unwrap();
        let dead = predecessor_record("linux-pgroup", gate_domain(gone, "1"));
        assert_eq!(problem_of(&dead), None, "a dead domain is no problem");

        let me = std::process::id();
        let Observed::Live { start_time } = facts::observe(ProcId(me)) else {
            panic!("the test process is live");
        };
        let alive = predecessor_record("linux-pgroup", gate_domain(me, &start_time));
        let text = problem_of(&alive).unwrap();
        assert!(text.contains("linux-pgroup domain {"), "{text}");
        assert!(
            text.contains("is not empty (alive); the next holder kills it"),
            "{text}"
        );

        let elsewhere = predecessor_record(
            "linux-gate",
            json!({"host":"another-host","bootId":null,"pid":5,"startTime":"1","pidNs":"pid:[1]"}),
        );
        assert!(problem_of(&elsewhere)
            .unwrap()
            .contains("is not empty (unknown)"));
    }

    #[test]
    fn a_windows_job_record_is_judged_by_the_contender_view_and_never_edited() {
        let job = predecessor_record(
            "windows-job",
            json!({
                "job": "Global\\fgos-job-1", "sessionId": "1", "declaredAt": "1",
                "holder": {"host": "h", "pid": 4, "startTime": "1"}, "keeper": null,
            }),
        );
        let fx = Fixture::new();
        let file = fx.locks().join("gateway.lock");
        fs::write(&file, "").unwrap();
        fs::write(predecessor::record_path(&file), &job).unwrap();
        let text = predecessor_problem(&file);
        let view = predecessor::contender_view(&file);
        match view["state"].as_str().unwrap() {
            "empty" | "absent" => assert_eq!(text, None),
            state => {
                let text = text.unwrap();
                assert!(text.contains("windows-job domain"), "{text}");
                assert!(text.contains(&format!(" is {state} (")), "{text}");
                assert!(text.ends_with("(predecessor-domain-not-empty)"), "{text}");
            }
        }
        assert_eq!(
            fs::read_to_string(predecessor::record_path(&file)).unwrap(),
            job
        );
    }

    fn hot_problem(content: Option<&[u8]>, age_ms: u64, now_ms: Option<i64>) -> Vec<String> {
        let fx = Fixture::new();
        let record = hot_record::paths(&fx.fgos(), "state").unwrap().record;
        if let Some(bytes) = content {
            fs::write(&record, bytes).unwrap();
            let file = fs::File::options().write(true).open(&record).unwrap();
            let when = std::time::SystemTime::now() - std::time::Duration::from_millis(age_ms);
            file.set_modified(when).unwrap();
        }
        let now = now_ms.unwrap_or_else(|| {
            std::time::SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis() as i64
        });
        hot_record_problems(&fx.fgos(), now)
    }

    #[test]
    fn a_hot_record_that_does_not_parse_is_a_problem_with_the_way_out() {
        let problems = hot_problem(Some(b"{\"pid\":"), 0, None);
        assert_eq!(problems.len(), 1);
        assert!(problems[0].contains("state: "), "{problems:?}");
        assert!(
            problems[0].contains("does not parse (\"{\\\"pid\\\":\")"),
            "{problems:?}"
        );
        assert!(problems[0]
            .ends_with("; once the holder is confirmed gone, run: fgos lock fence state"));
        assert_eq!(hot_problem(None, 0, None), Vec::<String>::new());
    }

    #[test]
    fn a_hot_record_the_judge_cannot_place_is_a_problem_only_after_the_grace() {
        let other_host = br#"{"v":1,"pid":4242,"startTime":"1","bootId":"b","pidNs":"pid:[1]","host":"another-host"}"#;
        assert_eq!(
            hot_problem(Some(other_host), 60_000, None),
            Vec::<String>::new(),
            "young"
        );
        let old = hot_problem(Some(other_host), 11 * 60_000 + 20_000, None);
        assert_eq!(old.len(), 1, "{old:?}");
        assert!(
            old[0].contains("names pid 4242 that cannot be judged here, for 11 min;"),
            "{old:?}"
        );
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn a_hot_record_of_a_live_holder_or_a_dead_one_is_no_problem() {
        let mut child = std::process::Command::new("true").spawn().unwrap();
        let gone = child.id();
        child.wait().unwrap();
        let tuple = gate_domain(gone, "1");
        let dead = json!({"v":1,"pid":gone,"startTime":"1","bootId":tuple["bootId"],"pidNs":tuple["pidNs"],"host":tuple["host"]});
        assert_eq!(
            hot_problem(Some(dead.to_string().as_bytes()), 20 * 60_000, None),
            Vec::<String>::new()
        );
    }

    #[test]
    fn the_beacon_reads_as_none_corrupt_or_present_with_its_age() {
        let fx = Fixture::new();
        let path = fx.fgos().join("runtime/main-checkout-activity.json");
        let reg = registry(vec![]);
        assert_eq!(fx.report(&reg, &none())["beacon"], json!({"status":"none"}));
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(&path, "nope").unwrap();
        assert_eq!(
            fx.report(&reg, &none())["beacon"],
            json!({"status":"corrupt"})
        );
        fs::write(&path, r#"{"v":1,"kind":"beacon","writer":{"id":"s1","source":"hook"},"writtenAt":990000,"windowMs":20000,"auditPid":7}"#).unwrap();
        assert_eq!(
            fx.report_at(&reg, &none(), 1_000_000)["beacon"],
            json!({"status":"present","writer":"s1","ageMs":10000,"windowMs":20000,"active":true})
        );
        assert_eq!(
            fx.report_at(&reg, &none(), 1_100_000)["beacon"],
            json!({"status":"present","writer":"s1","ageMs":110000,"windowMs":20000,"active":false})
        );
        fs::write(
            &path,
            r#"{"v":1,"kind":"beacon","writer":{"id":42},"writtenAt":990000,"windowMs":20000}"#,
        )
        .unwrap();
        assert_eq!(fx.report(&reg, &none())["beacon"]["writer"], json!(42));
    }

    #[test]
    fn a_beacon_that_cannot_be_read_fails_the_report() {
        let fx = Fixture::new();
        fs::create_dir_all(fx.fgos().join("runtime/main-checkout-activity.json")).unwrap();
        let err = collect_with(
            &registry(vec![]),
            &StatusRequest {
                fgos_dir: &fx.fgos(),
                lock_root: &fx.machine(),
                run_instances: &none(),
                now_ms: 0,
            },
        )
        .unwrap_err();
        assert!(
            err.to_string()
                .starts_with("EISDIR: illegal operation on a directory"),
            "{err}"
        );
    }

    #[test]
    fn every_beacon_vector_of_the_contract_parses_or_is_refused_as_written() {
        let doc: Value = serde_json::from_str(include_str!(
            "../../contracts/main-checkout-activity.v1.json"
        ))
        .unwrap();
        let rows = doc["vectors"].as_array().unwrap();
        assert!(rows.len() >= 12);
        for row in rows {
            let parsed = parse_beacon(row["raw"].as_str().unwrap());
            assert_eq!(
                parsed.is_some(),
                row["valid"].as_bool().unwrap(),
                "{}",
                row["name"]
            );
        }
    }
}
