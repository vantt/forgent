//! The Event Store rows of `fgos doctor` and the fix of its lock directories. Every fact comes from
//! `fgos-event-store` (`diagnostics`, `legacy_import`, `resolve`); this file only turns them into the sentences a
//! row says. One setup context is built per run, a failure included: when no repository is available every row
//! reports the one remembered error instead of recomputing the setup per row.

use super::{Rows, Run};
use crate::wiring::events::resolve_message;
use fgos_config::event_store::EventStoreConfig;
use fgos_distribution::doctor::{FixResult, RowOutcome, RowResult};
use fgos_event_store::{
    diagnostics, layout::Layout, legacy_import, lifecycle, resolve, resolve::Resolved,
};
use fgos_git::RepoHandle;
use serde_json::{json, Value};
use std::cell::OnceCell;
use std::path::{Path, PathBuf};

pub const ROW_IDS: &[&str] = &[
    "event-store-open-root",
    "event-store-machine-id",
    "event-store-legacy-layout",
    "event-store-incidents",
];
pub const FIX_IDS: &[&str] = &["event-store-lock-dirs"];

pub const GROUP: Rows = Rows {
    rows: ROW_IDS,
    fixes: FIX_IDS,
    judge: judge_rows,
    fix: run_fixes,
};

/// The group's rows over one run: the store's setup context is built once for all of them.
fn judge_rows(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    let run = Run::new(root);
    ids.iter()
        .map(|id| RowOutcome::Judged(judge(&run, id).expect("the group asked for its own row")))
        .collect()
}

fn run_fixes(root: &Path, ids: &[&str]) -> Vec<FixResult> {
    let run = Run::new(root);
    ids.iter()
        .map(|id| fix(&run, id).expect("the group asked for its own fix"))
        .collect()
}

const LOCK_DIRS_FIX: &str = "event-store-lock-dirs";

/// What one run knows about the store: the repository, the `eventStore` config and the facts for its remote.
pub struct Context {
    repo: RepoHandle,
    config: EventStoreConfig,
    facts: Value,
    state_root: PathBuf,
    root: PathBuf,
    resolved: OnceCell<Result<(Resolved, Layout), String>>,
    status: OnceCell<Result<Value, String>>,
}

/// A refused config file or a broken `eventStore` value, worded as the Node doctor worded it.
fn es_config_text(error: fgos_config::event_store::ReadError) -> String {
    use fgos_config::event_store::ReadError;
    match error {
        ReadError::Snapshot(_) => format!("event-store-config: {}", super::config_read_text(error)),
        other => super::config_read_text(other),
    }
}

/// The setup context in the order the Node doctor built it: the platform, the repository and its facts for
/// `origin`, the strict config, then the facts for the configured remote.
pub fn build_context(root: &Path, state_root: &Path) -> Result<Context, String> {
    if !lifecycle::platform_supported() {
        return Err(lifecycle::UNSUPPORTED_PLATFORM.to_owned());
    }
    let (driver, repo) = resolve::resolve_repo(root, state_root, root, false)
        .map_err(|error| resolve_message(&error))?;
    let initial =
        diagnostics::facts(&driver, &repo, state_root, "origin").map_err(|e| e.to_string())?;
    let trusted_main = repo.trusted_main_root().to_path_buf();
    let config = EventStoreConfig::read_project(&trusted_main, |key| std::env::var(key).ok(), true)
        .map_err(es_config_text)?;
    let facts = if config.remote == "origin" {
        initial
    } else {
        diagnostics::facts(&driver, &repo, state_root, &config.remote).map_err(|e| e.to_string())?
    };
    Ok(Context {
        repo,
        config,
        facts,
        state_root: state_root.to_path_buf(),
        root: root.to_path_buf(),
        resolved: OnceCell::new(),
        status: OnceCell::new(),
    })
}

impl Context {
    /// The facts of the store's remote, as `fgos events status` reports them.
    pub fn facts(&self) -> &Value {
        &self.facts
    }

    /// Whether the configured remote exists.
    pub fn remote_configured(&self) -> bool {
        self.facts["remoteFact"]["configured"] == json!(true)
    }

    fn resolved(&self) -> Result<&(Resolved, Layout), String> {
        self.resolved
            .get_or_init(|| {
                let trusted_main = self.repo.trusted_main_root();
                let resolved = resolve::resolve(&self.root, &self.state_root, trusted_main, false)
                    .map_err(|error| resolve_message(&error))?;
                let layout = Layout::from_common_dir(Some(resolved.repo.common_dir()))
                    .map_err(|e| e.to_string())?;
                Ok((resolved, layout))
            })
            .as_ref()
            .map_err(Clone::clone)
    }

    fn status(&self) -> Result<&Value, String> {
        self.status
            .get_or_init(|| {
                let (resolved, layout) = self.resolved()?;
                diagnostics::status(
                    &resolved.driver,
                    &resolved.repo,
                    layout,
                    &resolved.machine,
                    &self.config.remote,
                )
                .map_err(|e| e.to_string())
            })
            .as_ref()
            .map_err(Clone::clone)
    }
}

impl Run<'_> {
    /// The run's one Event Store context; a failure is remembered with its message.
    pub fn event_store(&self) -> Result<&Context, &str> {
        self.event_store
            .get_or_init(|| build_context(self.root, &self.state_root))
            .as_ref()
            .map_err(String::as_str)
    }
}

fn pass(message: impl Into<String>) -> RowResult {
    RowResult {
        passed: true,
        status: None,
        message: Some(message.into()),
        fix_command: None,
        detail: None,
    }
}

fn warn(message: impl Into<String>) -> RowResult {
    pass(format!("warning: {}", message.into()))
}

fn fail(message: impl Into<String>) -> RowResult {
    RowResult {
        passed: false,
        ..pass(message)
    }
}

/// What JavaScript reads as true: a non-empty string, a non-zero number, an object or array, `true`.
fn truthy(value: &Value) -> bool {
    match value {
        Value::Null => false,
        Value::Bool(flag) => *flag,
        Value::Number(number) => number.as_f64().is_some_and(|n| n != 0.0),
        Value::String(text) => !text.is_empty(),
        Value::Array(_) | Value::Object(_) => true,
    }
}

fn array_len(value: &Value) -> usize {
    value.as_array().map_or(0, Vec::len)
}

/// The text Node gave an unreadable open root.
fn lstat_message(path: &str, error: &std::io::Error) -> String {
    match error.kind() {
        std::io::ErrorKind::NotFound => {
            format!("ENOENT: no such file or directory, lstat '{path}'")
        }
        std::io::ErrorKind::PermissionDenied => {
            format!("EACCES: permission denied, lstat '{path}'")
        }
        _ => error.to_string(),
    }
}

fn open_root(ctx: &Context) -> Result<RowResult, String> {
    let facts = ctx.facts();
    let root = facts["openRoot"].as_str().unwrap_or_default();
    let meta = std::fs::symlink_metadata(root).map_err(|e| lstat_message(root, &e))?;
    let guarantee = &facts["guarantee"];
    if !meta.is_dir() || meta.file_type().is_symlink() || guarantee["exclusion"] == json!("none") {
        return Ok(fail(format!("open root unavailable: {guarantee}")));
    }
    Ok(pass(format!("{root}: {guarantee}")))
}

fn machine_id(ctx: &Context) -> Result<RowResult, String> {
    let facts = ctx.facts();
    if let Some(error) = facts["machineError"].as_str() {
        return Ok(fail(error));
    }
    let shared = truthy(&ctx.status()?["machineRefShared"]);
    Ok(machine_id_of(
        facts["machineId"].as_str().unwrap_or_default(),
        shared,
    ))
}

fn machine_id_of(id: &str, shared: bool) -> RowResult {
    if shared {
        return warn(format!(
            "event-store-machine-ref-shared: {id}; set git config fgos.machineId <other-id> in one clone"
        ));
    }
    pass(id)
}

fn legacy_layout(ctx: &Context) -> Result<RowResult, String> {
    let (resolved, _) = ctx.resolved()?;
    let result = legacy_import::legacy_layout(&resolved.driver, &resolved.repo)
        .map_err(|e| e.to_string())?;
    if truthy(&result["passed"]) {
        return Ok(pass("legacy fence, ref and sealed tree match"));
    }
    let problems: Vec<&str> = result["problems"]
        .as_array()
        .map(|all| all.iter().filter_map(Value::as_str).collect())
        .unwrap_or_default();
    Ok(fail(problems.join("; ")))
}

/// What the pointer row reads: the store's status and the settings that decide which of its counts matter.
struct IncidentInput<'a> {
    status: &'a Value,
    remote_configured: bool,
    remote: &'a str,
    seal_interval_sec: u64,
    now_sec: u64,
}

/// A read-only pointer to `fgos events status`: it counts what that verb reports from the same snapshot and never
/// repairs. Integrity problems (errors, skipped peer mirrors, their sync warnings) fail, because a broken store
/// does not heal on the normal path and the status verb always exits 0; every other count only warns.
fn incidents(ctx: &Context, now_sec: u64) -> Result<RowResult, String> {
    Ok(incidents_of(&IncidentInput {
        status: ctx.status()?,
        remote_configured: ctx.remote_configured(),
        remote: &ctx.config.remote,
        seal_interval_sec: ctx.config.seal_interval_sec,
        now_sec,
    }))
}

fn incidents_of(input: &IncidentInput) -> RowResult {
    let status = input.status;
    let age = status["streams"]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|stream| stream["oldestUnsealedAgeSec"].as_f64())
        .fold(0.0_f64, f64::max);
    let sync_warnings = status["sync"]["warnings"]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
        .filter(|warning| !warning.starts_with("event-store-machine-ref-shared:"))
        .count();
    let integrity = array_len(&status["integrityErrors"])
        + array_len(&status["skippedMirrors"])
        + sync_warnings;
    let push = &status["lastPush"];
    let pending = status["streams"]
        .as_array()
        .into_iter()
        .flatten()
        .any(|stream| {
            let name = stream["stream"].as_str().unwrap_or_default();
            (name == "project" || name.starts_with("project:"))
                && (truthy(&stream["unsealedCount"]) || truthy(&stream["closedSegmentsPending"]))
        });
    let behind_remote = truthy(&push["error"])
        || pending
        || status["aheadBehind"]["ahead"].as_f64().unwrap_or(0.0) > 0.0
        || truthy(&status["sync"]["unpublishedSince"]);
    let stale_push = push.is_null()
        || push["remote"].as_str() != Some(input.remote)
        || truthy(&push["error"])
        || input.now_sec as f64 - push["time"].as_f64().unwrap_or(0.0) > 86400.0;
    let unpublished = input.remote_configured && behind_remote && stale_push;
    let orphans = array_len(&status["orphanBranches"]);
    let mut open = Vec::new();
    if age > 2.0 * input.seal_interval_sec as f64 {
        open.push(format!("unsealed events age {}s", age as u64));
    }
    if orphans > 0 {
        open.push(format!("{orphans} orphan branch stream(s)"));
    }
    if integrity > 0 {
        open.push(format!("{integrity} integrity problem(s)"));
    }
    if unpublished {
        open.push("unpublished events".to_owned());
    }
    let point = format!("{}; run `fgos events status`", open.join("; "));
    if integrity > 0 {
        fail(point)
    } else if !open.is_empty() {
        warn(point)
    } else {
        pass("no unsealed backlog, integrity problem or unpublished event")
    }
}

fn now_sec() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |elapsed| elapsed.as_secs())
}

/// Judges `id` when it is an Event Store row.
pub fn judge(run: &Run, id: &str) -> Option<RowResult> {
    if !ROW_IDS.contains(&id) {
        return None;
    }
    let context = match run.event_store() {
        Ok(context) => context,
        // The pointer only warns that it could not read; every other row fails on the one remembered error.
        Err(error) if id == "event-store-incidents" => {
            return Some(warn(format!("incidents not read: {error}")))
        }
        Err(error) => return Some(fail(error)),
    };
    let judged = match id {
        "event-store-open-root" => open_root(context),
        "event-store-machine-id" => machine_id(context),
        "event-store-legacy-layout" => legacy_layout(context),
        _ => incidents(context, now_sec()),
    };
    Some(judged.unwrap_or_else(|error| {
        if id == "event-store-incidents" {
            warn(format!("incidents not read: {error}"))
        } else {
            fail(error)
        }
    }))
}

#[cfg(unix)]
fn mode_differs(meta: &std::fs::Metadata) -> bool {
    use std::os::unix::fs::PermissionsExt;
    meta.permissions().mode() & 0o777 != 0o700
}

#[cfg(not(unix))]
fn mode_differs(_: &std::fs::Metadata) -> bool {
    false
}

fn make_private_directory(path: &Path) -> std::io::Result<()> {
    let mut builder = std::fs::DirBuilder::new();
    #[cfg(unix)]
    {
        use std::os::unix::fs::DirBuilderExt;
        builder.mode(0o700);
    }
    match builder.create(path) {
        Err(error) if error.kind() != std::io::ErrorKind::AlreadyExists => Err(error),
        _ => Ok(()),
    }
}

/// `path` and every parent are real directories (created 0700 when absent), never a link.
fn real_directory(path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        if parent != path && !parent.as_os_str().is_empty() {
            real_directory(parent)?;
        }
    }
    make_private_directory(path).map_err(|e| e.to_string())?;
    let meta = std::fs::symlink_metadata(path).map_err(|e| e.to_string())?;
    if !meta.is_dir() || meta.file_type().is_symlink() {
        return Err(format!("unsafe directory: {}", path.display()));
    }
    Ok(())
}

/// Git's WAL refuses a group- or world-writable `fgos` directory in the Git common dir, so the open root
/// (`fgos/events` there), its parent and its locks directory are real 0700 directories. Returns whether any of them
/// was created or had another mode.
pub(crate) fn private_directories(open_root: &Path) -> Result<bool, String> {
    let dirs = [
        open_root.parent().unwrap_or(open_root).to_path_buf(),
        open_root.to_path_buf(),
        open_root.join("locks"),
    ];
    let mut changed = false;
    for dir in &dirs {
        match std::fs::symlink_metadata(dir) {
            Ok(meta) => {
                changed = changed
                    || !meta.is_dir()
                    || meta.file_type().is_symlink()
                    || mode_differs(&meta);
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => changed = true,
            Err(error) => return Err(error.to_string()),
        }
    }
    real_directory(&dirs[2])?;
    #[cfg(unix)]
    for dir in &dirs {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(dir, std::fs::Permissions::from_mode(0o700))
            .map_err(|e| e.to_string())?;
    }
    Ok(changed)
}

/// Runs `id` when it is an Event Store fix.
pub fn fix(run: &Run, id: &str) -> Option<FixResult> {
    if !FIX_IDS.contains(&id) {
        return None;
    }
    debug_assert_eq!(id, LOCK_DIRS_FIX);
    let outcome = build_context(run.root, &run.state_root).and_then(|context| {
        let open_root = context.facts()["openRoot"]
            .as_str()
            .unwrap_or_default()
            .to_owned();
        private_directories(Path::new(&open_root))
    });
    Some(match outcome {
        Ok(changed) => FixResult::done(
            id,
            changed,
            "Event Store locks directory and its parents up to the Git common dir are mode 0700",
        ),
        Err(message) => FixResult::done(id, false, message),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scratch(name: &str) -> PathBuf {
        let dir =
            std::env::temp_dir().join(format!("fgos-doctor-es-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn the_private_directories_are_made_then_left_alone_and_a_loose_mode_is_repaired() {
        let git = scratch("dirs");
        let open_root = git.join("fgos/events");
        assert_eq!(private_directories(&open_root), Ok(true));
        assert_eq!(private_directories(&open_root), Ok(false));
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let locks = open_root.join("locks");
            std::fs::set_permissions(&locks, std::fs::Permissions::from_mode(0o755)).unwrap();
            assert_eq!(private_directories(&open_root), Ok(true));
            let mode = std::fs::metadata(&locks).unwrap().permissions().mode() & 0o777;
            assert_eq!(mode, 0o700);
        }
    }

    #[cfg(unix)]
    #[test]
    fn a_symlinked_locks_directory_is_refused_not_followed() {
        let git = scratch("link");
        let open_root = git.join("fgos/events");
        std::fs::create_dir_all(&open_root).unwrap();
        let elsewhere = git.join("elsewhere");
        std::fs::create_dir_all(&elsewhere).unwrap();
        std::os::unix::fs::symlink(&elsewhere, open_root.join("locks")).unwrap();
        let error = private_directories(&open_root).unwrap_err();
        assert!(error.starts_with("unsafe directory:"), "{error}");
    }

    use crate::wiring::doctor::testkit::Fixture;

    fn status(streams: Value, extra: Value) -> Value {
        let mut base = json!({
            "streams": streams, "integrityErrors": [], "skippedMirrors": [], "orphanBranches": [],
            "sync": {"warnings": []}, "lastPush": null, "aheadBehind": {"ahead": 0, "behind": 0},
        });
        for (key, value) in extra.as_object().unwrap() {
            base[key] = value.clone();
        }
        base
    }

    fn pointer(status: &Value, remote_configured: bool, now_sec: u64) -> RowResult {
        incidents_of(&IncidentInput {
            status,
            remote_configured,
            remote: "origin",
            seal_interval_sec: 300,
            now_sec,
        })
    }

    fn text(row: &RowResult) -> String {
        row.message.clone().unwrap()
    }

    #[test]
    fn incidents_warns_past_twice_the_seal_interval_and_never_fails_on_unsealed_age() {
        for (age, warns) in [(599, false), (601, true), (3601, true)] {
            let status = status(
                json!([{"stream": "local", "oldestUnsealedAgeSec": age}]),
                json!({}),
            );
            let row = pointer(&status, false, 0);
            assert!(row.passed, "{age}");
            assert_eq!(
                text(&row).starts_with("warning:"),
                warns,
                "{age}: {}",
                text(&row)
            );
            if warns {
                assert_eq!(
                    text(&row),
                    format!("warning: unsealed events age {age}s; run `fgos events status`")
                );
            }
        }
    }

    #[test]
    fn incidents_counts_orphan_branch_streams_and_integrity_problems_and_fails_closed_only_on_integrity(
    ) {
        let clean = pointer(&status(json!([]), json!({})), true, 0);
        assert_eq!(
            text(&clean),
            "no unsealed backlog, integrity problem or unpublished event"
        );
        let orphan = pointer(
            &status(json!([]), json!({"orphanBranches": ["branch:gone"]})),
            false,
            0,
        );
        assert_eq!(
            text(&orphan),
            "warning: 1 orphan branch stream(s); run `fgos events status`"
        );
        let broken = pointer(
            &status(
                json!([]),
                json!({"orphanBranches": ["branch:gone"], "integrityErrors": [{"stream": "project"}]}),
            ),
            false,
            0,
        );
        assert!(
            !broken.passed,
            "an integrity error fails: the store does not heal and events status exits 0"
        );
        assert_eq!(
            text(&broken),
            "1 orphan branch stream(s); 1 integrity problem(s); run `fgos events status`"
        );
    }

    #[test]
    fn incidents_counts_a_skipped_peer_mirror_and_the_sync_warning_kept_for_it_but_not_the_shared_machine_ref_warning(
    ) {
        let status = status(
            json!([]),
            json!({"skippedMirrors": ["peer-bb"], "sync": {"warnings": ["peer-bb skipped", "event-store-machine-ref-shared: x"]}}),
        );
        let row = pointer(&status, false, 0);
        assert!(!row.passed);
        assert_eq!(
            text(&row),
            "2 integrity problem(s); run `fgos events status`"
        );
    }

    #[test]
    fn incidents_warns_for_real_unpublished_project_events_and_not_for_a_private_local_stream() {
        let local = status(
            json!([{"stream": "local", "unsealedCount": 1, "oldestUnsealedAgeSec": 0}]),
            json!({}),
        );
        assert!(!text(&pointer(&local, true, 0)).contains("unpublished events"));
        let project = status(
            json!([{"stream": "project", "unsealedCount": 1, "oldestUnsealedAgeSec": 0}]),
            json!({}),
        );
        assert!(text(&pointer(&project, true, 0))
            .ends_with("unpublished events; run `fgos events status`"));
        // No remote to publish to, or a push that succeeded within the day: nothing is overdue.
        assert!(!text(&pointer(&project, false, 0)).contains("unpublished events"));
        let pushed = status(
            json!([{"stream": "project", "unsealedCount": 1, "oldestUnsealedAgeSec": 0}]),
            json!({"lastPush": {"remote": "origin", "time": 1_000_000}}),
        );
        assert!(!text(&pointer(&pushed, true, 1_000_100)).contains("unpublished events"));
        assert!(text(&pointer(&pushed, true, 1_000_000 + 90_000)).contains("unpublished events"));
    }

    #[test]
    fn a_machine_ref_another_clone_wrote_warns_and_names_the_fix() {
        assert_eq!(machine_id_of("m1", false).message.as_deref(), Some("m1"));
        assert_eq!(
            machine_id_of("m1", true).message.as_deref(),
            Some("warning: event-store-machine-ref-shared: m1; set git config fgos.machineId <other-id> in one clone")
        );
    }

    #[cfg(target_os = "linux")]
    fn row_of(f: &Fixture, id: &str) -> RowResult {
        judge(&f.run(), id).unwrap()
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn a_fresh_repository_passes_the_open_root_machine_id_and_incidents_rows_and_the_legacy_layout_row(
    ) {
        let f = Fixture::new("fresh");
        for id in ROW_IDS {
            let row = row_of(&f, id);
            assert!(row.passed, "{id}: {}", text(&row));
        }
        assert_eq!(
            text(&row_of(&f, "event-store-machine-id")),
            "fixture-machine"
        );
        assert_eq!(
            text(&row_of(&f, "event-store-incidents")),
            "no unsealed backlog, integrity problem or unpublished event"
        );
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn a_missing_open_root_fails_with_the_path() {
        let f = Fixture::new("noroot");
        std::fs::remove_dir_all(f.repo.join(".git/fgos")).unwrap();
        let row = row_of(&f, "event-store-open-root");
        assert!(!row.passed);
        assert!(
            text(&row).starts_with("ENOENT: no such file or directory, lstat '"),
            "{}",
            text(&row)
        );
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn a_stream_for_a_branch_with_no_live_worktree_is_an_orphan_and_a_live_worktree_branch_key_is_not(
    ) {
        let f = Fixture::new("orphans");
        f.git(&["commit", "--allow-empty", "-qm", "root"]);
        let linked = f.temp.join("linked");
        f.git(&[
            "worktree",
            "add",
            "-qb",
            "Feature/Live_One",
            linked.to_str().unwrap(),
        ]);
        std::fs::create_dir_all(f.repo.join(".git/fgos/events/branch:feature-live-one")).unwrap();
        assert!(!text(&row_of(&f, "event-store-incidents")).contains("orphan"));
        f.git(&["worktree", "remove", linked.to_str().unwrap()]);
        assert!(text(&row_of(&f, "event-store-incidents"))
            .starts_with("warning: 1 orphan branch stream(s)"));
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn a_persisted_integrity_record_fails_the_incidents_row() {
        let f = Fixture::new("integrity");
        let project = f.repo.join(".git/fgos/events/project");
        std::fs::create_dir_all(&project).unwrap();
        std::fs::write(
            project.join("integrity.json"),
            r#"{"code":"event-store-ref-moved","ranges":[]}"#,
        )
        .unwrap();
        let row = row_of(&f, "event-store-incidents");
        assert!(!row.passed);
        assert_eq!(
            text(&row),
            "1 integrity problem(s); run `fgos events status`"
        );
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn a_run_remembers_a_failed_setup_context_for_every_row_and_a_new_run_observes_the_repaired_file(
    ) {
        let f = Fixture::new("config");
        let config = f.repo.join(".fgos/config.yaml");
        std::fs::write(&config, "eventStore: half-written: [\n").unwrap();
        let run = f.run();
        let first = judge(&run, "event-store-open-root").unwrap();
        assert!(!first.passed);
        assert!(
            text(&first).starts_with("event-store-config: "),
            "{}",
            text(&first)
        );
        assert_eq!(
            text(&judge(&run, "event-store-machine-id").unwrap()),
            text(&first),
            "one remembered failure"
        );
        let pointer = judge(&run, "event-store-incidents").unwrap();
        assert!(
            pointer.passed,
            "a pointer never fails; the open-root row carries the failure"
        );
        assert!(text(&pointer).starts_with("warning: incidents not read: event-store-config: "));
        std::fs::write(&config, "{}\n").unwrap();
        assert!(row_of(&f, "event-store-open-root").passed);
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn a_malformed_seal_coalescing_window_fails_every_row() {
        let f = Fixture::new("coalesce");
        let config = f.repo.join(".fgos/config.yaml");
        for bad in ["0", "-5", "2.5", "'30'", "null"] {
            std::fs::write(
                &config,
                format!("eventStore:\n  seal:\n    coalesceSec: {bad}\n"),
            )
            .unwrap();
            let row = row_of(&f, "event-store-open-root");
            assert!(!row.passed, "coalesceSec {bad}");
            assert!(text(&row).contains("coalesceSec"), "{}", text(&row));
        }
        std::fs::write(&config, "eventStore:\n  seal:\n    coalesceSec: 5\n").unwrap();
        assert!(row_of(&f, "event-store-open-root").passed);
    }

    #[cfg(all(target_os = "linux", unix))]
    #[test]
    fn the_lock_dirs_fix_repairs_modes_below_fgos_and_creates_a_missing_tree_private() {
        use std::os::unix::fs::PermissionsExt;
        let f = Fixture::new("lockfix");
        let locks = f.repo.join(".git/fgos/events/locks");
        let owned = [
            locks.clone(),
            locks.parent().unwrap().to_path_buf(),
            f.repo.join(".git/fgos"),
        ];
        for dir in &owned[..2] {
            std::fs::set_permissions(dir, std::fs::Permissions::from_mode(0o775)).unwrap();
            assert_eq!(
                fix(&f.run(), LOCK_DIRS_FIX).unwrap().changed,
                Some(true),
                "{dir:?}"
            );
            for each in &owned {
                assert_eq!(
                    std::fs::metadata(each).unwrap().permissions().mode() & 0o777,
                    0o700
                );
            }
            assert_eq!(fix(&f.run(), LOCK_DIRS_FIX).unwrap().changed, Some(false));
        }
        std::fs::remove_dir_all(&owned[2]).unwrap();
        assert_eq!(fix(&f.run(), LOCK_DIRS_FIX).unwrap().changed, Some(true));
        assert!(owned.iter().all(|dir| dir.is_dir()));
    }

    #[test]
    fn javascript_truthiness_is_kept_for_the_counts_a_status_carries() {
        for (value, expected) in [
            (json!(null), false),
            (json!(0), false),
            (json!(2), true),
            (json!(""), false),
            (json!("x"), true),
            (json!([]), true),
        ] {
            assert_eq!(truthy(&value), expected, "{value}");
        }
    }

    #[test]
    fn an_unreadable_open_root_reads_as_node_read_it() {
        let error = std::io::Error::from(std::io::ErrorKind::NotFound);
        assert_eq!(
            lstat_message("/r/.git/fgos/events", &error),
            "ENOENT: no such file or directory, lstat '/r/.git/fgos/events'"
        );
    }

    #[test]
    fn a_row_is_judged_only_when_it_is_an_event_store_row() {
        let root = scratch("ids");
        let run = Run::new(&root);
        assert!(judge(&run, "git-incidents").is_none());
        assert!(fix(&run, "git-wal-dir").is_none());
    }

    #[test]
    fn with_no_repository_every_row_fails_on_the_one_remembered_error_and_the_pointer_only_warns() {
        let root = scratch("norepo");
        let run = Run::new(&root);
        for id in ROW_IDS {
            let row = judge(&run, id).unwrap();
            if *id == "event-store-incidents" {
                assert!(row.passed);
                assert!(row
                    .message
                    .unwrap()
                    .starts_with("warning: incidents not read: "));
            } else {
                assert!(!row.passed, "{id}");
            }
        }
    }
}
