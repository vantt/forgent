//! `fgos wire-agents`: the one opt-in verb that changes a person's own agent config (the Claude config
//! directory, `~/.gemini`, ...).
//!
//! The plan is `fgos_distribution::agent_config`'s: only agents present on the machine, every file a change
//! touches, and the permissions that widen what an agent may do shown and never written. Without `--yes` that
//! plan is the answer and nothing is written. With `--yes` each file that exists is first copied to
//! `<file>.pre-wire-agents-<time>` through the Durable File door (same directory, same mode, never over an
//! existing copy), then the change's `claude` steps run in order. A change whose backup fails runs nothing; a
//! failing step stops its change and is reported, and the verb exits 1 when anything failed.

use crate::cli_projector::ProjectError;
use crate::routing::Call;
use fgos_distribution::agent_config::{plan_agent_wiring, run_claude_step, Change, WiringPlan};
use fgos_distribution::agent_hooks::{BoundedRunner, ProcessRunner};
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome, VerbAnswer,
};
use serde::Serialize;
use std::borrow::Cow;
use std::ffi::OsString;
use std::future::Future;
use std::io;
use std::path::{Path, PathBuf};
use std::pin::Pin;
use std::time::SystemTime;

pub const OPERATION_ID: &str = "wire-agents.run";

/// Appended to a file's name to name its backup, followed by the time of the run.
const BACKUP_INFIX: &str = ".pre-wire-agents-";

pub const DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed(OPERATION_ID),
    operation_id: OperationId::from_static(OPERATION_ID),
    component_class: Cow::Borrowed("packaging"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("wire-agents.run.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("wire-agents.run.outcome", "1.0.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

/// One `fgos wire-agents` call.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WireAgentsRequest {
    /// The main checkout of the caller's directory: where the mailbox opt-in is read. `--dir` never moves it.
    pub project: PathBuf,
    /// `--yes`: apply the plan after backing up. Anything the Node CLI read as falsy (absent, empty) is not.
    pub apply: bool,
    /// `--json`: the envelope in place of the text.
    pub json: bool,
}

/// Reads a call of `wire-agents` through the shared parser. `root` is the main checkout of the caller's directory
/// that the invocation doors resolved (they take `--dir` as a flag to accept and never act on it).
pub fn project_wire_agents_request(
    args: &[OsString],
    root: Result<PathBuf, String>,
) -> Result<WireAgentsRequest, ProjectError> {
    let call = Call::new(args);
    let flags = call.flags();
    Ok(WireAgentsRequest {
        project: root?,
        apply: crate::wiring::doctor::truthy(flags.flag("yes")),
        json: crate::wiring::doctor::truthy(flags.flag("json")),
    })
}

/// A file copied before a change wrote anything.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Backup {
    pub file: PathBuf,
    pub backup: PathBuf,
}

/// A change that did not apply, and why.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Failure {
    pub id: String,
    pub error: String,
}

/// What an apply did.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize)]
pub struct Applied {
    pub backups: Vec<Backup>,
    pub done: Vec<String>,
    pub failed: Vec<Failure>,
}

/// The data `wire-agents` answers: the plan, and with `--yes` its result (without it `applied: false`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct WireAgentsData {
    #[serde(flatten)]
    pub plan: WiringPlan,
    pub applied: bool,
    #[serde(flatten, skip_serializing_if = "Option::is_none")]
    pub result: Option<Applied>,
}

/// The Node CLI's name and wording for the errors a backup can meet (`EACCES: permission denied`).
fn node_error_text(error: &io::Error) -> String {
    use io::ErrorKind::*;
    let (code, what) = match error.kind() {
        PermissionDenied => ("EACCES", "permission denied"),
        NotFound => ("ENOENT", "no such file or directory"),
        AlreadyExists => ("EEXIST", "file already exists"),
        IsADirectory => ("EISDIR", "illegal operation on a directory"),
        NotADirectory => ("ENOTDIR", "not a directory"),
        ReadOnlyFilesystem => ("EROFS", "read-only file system"),
        StorageFull => ("ENOSPC", "no space left on device"),
        _ => return error.to_string(),
    };
    format!("{code}: {what}")
}

/// Copies `file`, when it exists, to `<file>.pre-wire-agents-<stamp>` beside it, with its mode, never over a
/// copy that is there. `Ok(None)` when there is nothing to copy.
fn back_up(file: &Path, stamp: &str) -> Result<Option<Backup>, String> {
    if std::fs::metadata(file).is_err() {
        return Ok(None);
    }
    let name = file
        .file_name()
        .ok_or_else(|| format!("{} has no file name", file.display()))?
        .to_string_lossy()
        .into_owned();
    let backup_name = format!("{name}{BACKUP_INFIX}{stamp}");
    let dir = file.parent().unwrap_or_else(|| Path::new("."));
    let backup = dir.join(&backup_name);
    let failed = |error: &io::Error| {
        format!(
            "{}, copyfile '{}' -> '{}'",
            node_error_text(error),
            file.display(),
            backup.display()
        )
    };
    let bytes = std::fs::read(file).map_err(|error| failed(&error))?;
    let mode = std::fs::metadata(file)
        .map_err(|error| failed(&error))?
        .permissions();
    match fgos_durable_file::install_once(dir, &backup_name, &bytes) {
        Ok(fgos_durable_file::Installed::Created) => {}
        Ok(fgos_durable_file::Installed::AlreadyExists) => {
            return Err(failed(&io::Error::from(io::ErrorKind::AlreadyExists)));
        }
        Err(error) => return Err(failed(&error.source)),
    }
    std::fs::set_permissions(&backup, mode).map_err(|error| failed(&error))?;
    Ok(Some(Backup {
        file: file.to_path_buf(),
        backup,
    }))
}

/// Applies every change of `plan`: first the backup of each existing file a change names, then the change's
/// steps in order. A change whose backup fails runs nothing; a failing step stops its change.
pub fn apply(
    plan: &WiringPlan,
    env: &[(String, String)],
    runner: &dyn ProcessRunner,
    now: SystemTime,
) -> Applied {
    let stamp =
        fgos_host_runtime::civil_time::format_system_time_utc(now).replace(['-', ':', '.'], "");
    let mut applied = Applied::default();
    let changes: Vec<&Change> = plan.agents.iter().flat_map(|a| a.changes.iter()).collect();
    for change in changes {
        let mut backed_up = true;
        for file in &change.files {
            match back_up(file, &stamp) {
                Ok(Some(backup)) => applied.backups.push(backup),
                Ok(None) => {}
                Err(error) => {
                    applied.failed.push(Failure {
                        id: change.id.clone(),
                        error: format!("backup failed, nothing changed: {error}"),
                    });
                    backed_up = false;
                    break;
                }
            }
        }
        if !backed_up {
            continue;
        }
        let stopped = change.steps.iter().find_map(|args| {
            run_claude_step(args, env, runner)
                .err()
                .map(|detail| Failure {
                    id: change.id.clone(),
                    error: format!("\"claude {}\" failed: {detail}", args.join(" ")),
                })
        });
        match stopped {
            Some(failure) => applied.failed.push(failure),
            None => applied.done.push(change.id.clone()),
        }
    }
    applied
}

/// The text `fgos wire-agents` prints: the plan, or what it did.
pub fn render_text(data: &WireAgentsData) -> String {
    let mut lines: Vec<String> = Vec::new();
    let present: Vec<&str> = data.plan.agents.iter().map(|a| a.agent.as_str()).collect();
    let found = if present.is_empty() {
        "none".to_owned()
    } else {
        present.join(", ")
    };
    let missing = if data.plan.absent.is_empty() {
        String::new()
    } else {
        format!("; not found: {}", data.plan.absent.join(", "))
    };
    lines.push(format!(
        "fgOS global agent wiring (opt-in). Agents found: {found}{missing}."
    ));
    let changes: Vec<(&str, &Change)> = data
        .plan
        .agents
        .iter()
        .flat_map(|a| a.changes.iter().map(move |c| (a.agent.as_str(), c)))
        .collect();
    if changes.is_empty() {
        lines.push("Nothing to change.".into());
    } else {
        lines.push(if data.applied {
            "Changes:".into()
        } else {
            "Changes (run with --yes to apply; every file that exists is backed up first as <file>.pre-wire-agents-<time>):".into()
        });
        for (agent, change) in changes {
            lines.push(format!("  {agent}: {}", change.what));
            for command in &change.commands {
                lines.push(format!("    runs:    {command}"));
            }
            for file in &change.files {
                lines.push(format!("    changes: {}", file.display()));
            }
        }
    }
    let permissions: Vec<_> = data
        .plan
        .agents
        .iter()
        .flat_map(|a| a.permissions.iter().map(move |p| (a.agent.as_str(), p)))
        .collect();
    if !permissions.is_empty() {
        lines.push(
            "Permissions fgOS never sets for you (edit the file yourself if you want them):".into(),
        );
        for (agent, permission) in permissions {
            lines.push(format!("  {agent}: {}", permission.file.display()));
            lines.push(format!("    set: {}", permission.set));
            lines.push(format!("    why: {}", permission.why));
            if let Some(note) = &permission.note {
                lines.push(format!("    note: {note}"));
            }
        }
    }
    if let Some(result) = data.applied.then_some(()).and(data.result.as_ref()) {
        for Backup { file, backup } in &result.backups {
            lines.push(format!(
                "Backed up {} -> {}",
                file.display(),
                backup.display()
            ));
        }
        for id in &result.done {
            lines.push(format!("Done: {id}"));
        }
        for Failure { id, error } in &result.failed {
            lines.push(format!("Failed: {id}: {error}"));
        }
    }
    format!("{}\n", lines.join("\n"))
}

/// One run: the plan, and the apply when asked.
pub fn run(
    request: &WireAgentsRequest,
    env: &[(String, String)],
    home: &Path,
    runner: &dyn ProcessRunner,
) -> Result<WireAgentsData, String> {
    let plan = plan_agent_wiring(&request.project, env, home, runner)
        .map_err(|error| error.to_string())?;
    let result = request
        .apply
        .then(|| apply(&plan, env, runner, SystemTime::now()));
    Ok(WireAgentsData {
        plan,
        applied: request.apply,
        result,
    })
}

/// What the person sees: the text, or with `--json` the envelope of the data; the exit status is 1 when a change
/// failed.
pub fn present(data: &WireAgentsData, json: bool) -> VerbAnswer {
    VerbAnswer {
        text: (!json).then(|| render_text(data)),
        data: serde_json::to_value(data).expect("the answer is plain data"),
        exit: i32::from(data.result.as_ref().is_some_and(|r| !r.failed.is_empty())),
    }
}

/// The home the planner reads agent config under: the `HOME` of the environment. Without one there is nothing to
/// plan against, and the call is refused as a missing precondition.
fn home_of(env: &[(String, String)]) -> Result<PathBuf, CategorisedRefusal> {
    fgos_config::machine::home_dir(|key| env.iter().find(|(k, _)| k == key).map(|(_, v)| v.clone()))
        .ok_or_else(|| {
            CategorisedRefusal::new("precondition", fgos_config::machine::home_unset_message())
        })
}

/// One call end to end: the home, the plan and the apply when asked, the answer the person sees.
pub fn serve(
    request: &WireAgentsRequest,
    env: &[(String, String)],
    runner: &dyn ProcessRunner,
) -> Result<VerbAnswer, CategorisedRefusal> {
    let home = home_of(env)?;
    let data = run(request, env, &home, runner).map_err(CategorisedRefusal::unexpected)?;
    Ok(present(&data, request.json))
}

/// The process environment as the list the planner reads. A variable whose name or value is not UTF-8 is left out.
fn process_env() -> Vec<(String, String)> {
    std::env::vars_os()
        .filter_map(|(key, value)| Some((key.into_string().ok()?, value.into_string().ok()?)))
        .collect()
}

/// The provider of `wire-agents.run`.
pub struct WireAgentsProvider {
    descriptor: ProviderDescriptor,
}

impl WireAgentsProvider {
    pub fn new() -> Self {
        Self {
            descriptor: DESCRIPTOR,
        }
    }
}

impl Default for WireAgentsProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for WireAgentsProvider {
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
            events.record_event(&format!("{OPERATION_ID}.invoked"));
            let request = request
                .input
                .downcast_ref::<WireAgentsRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not WireAgentsRequest".into())
                })?
                .clone();
            // `claude` is started and waited for: never on the async worker.
            let served = tokio::task::spawn_blocking(move || {
                serve(&request, &process_env(), &BoundedRunner)
            })
            .await
            .map_err(|error| ProviderError::ProviderFailed(error.to_string()))?;
            let answered: Box<dyn std::any::Any + Send> = match served {
                Ok(answer) => Box::new(answer),
                Err(refusal) => Box::new(refusal),
            };
            Ok(ProviderOutcome::completed(
                DESCRIPTOR.outcome_contract.clone(),
                answered,
            ))
        })
    }
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use std::os::unix::fs::PermissionsExt;

    struct Sandbox {
        dir: PathBuf,
    }

    impl Sandbox {
        fn new(label: &str) -> Self {
            static COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
            let n = COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
            let dir = std::fs::canonicalize(std::env::temp_dir())
                .unwrap()
                .join(format!(
                    "fgos-wire-agents-{}-{n}-{label}",
                    std::process::id()
                ));
            let _ = std::fs::remove_dir_all(&dir);
            std::fs::create_dir_all(dir.join("home")).unwrap();
            std::fs::create_dir_all(dir.join("project/.git")).unwrap();
            std::fs::create_dir_all(dir.join("bin")).unwrap();
            Self { dir }
        }

        fn home(&self) -> PathBuf {
            self.dir.join("home")
        }

        fn env(&self, path_extra: &str) -> Vec<(String, String)> {
            vec![
                ("HOME".into(), self.home().display().to_string()),
                (
                    "PATH".into(),
                    format!("{}{path_extra}", self.dir.join("bin").display()),
                ),
                ("FGOS_CLAUDE_COMMAND".into(), "fgos-test-claude".into()),
            ]
        }

        fn request(&self, apply: bool) -> WireAgentsRequest {
            WireAgentsRequest {
                project: self.dir.join("project"),
                apply,
                json: true,
            }
        }

        /// A fake `claude` with no plugin state: it logs every call, refuses a change when a file it lists in
        /// `backups_of` has no `.pre-wire-agents-*` copy yet, and fails the call named in `fail`.
        fn claude(&self, backups_of: &[&Path], fail: &str) {
            let log = self.dir.join("calls.log");
            let checks: String = backups_of
                .iter()
                .map(|file| {
                    format!(
                        "set -- '{}'.pre-wire-agents-*; [ -e \"$1\" ] || {{ echo 'no backup' >&2; exit 3; }}\n",
                        file.display()
                    )
                })
                .collect();
            let body = format!(
                "echo \"$*\" >> '{log}'\ncase \"$*\" in\n  '--version') echo '1.0 (fake)';;\n  'plugin marketplace list --json') printf '[]';;\n  'plugin list --json') printf '[]';;\n  '{fail}') echo 'fake failure' >&2; exit 1;;\n  plugin*) {checks}exit 0;;\n  *) echo unrecognized >&2; exit 1;;\nesac",
                log = log.display()
            );
            let path = self.dir.join("bin/fgos-test-claude");
            std::fs::write(&path, format!("#!/bin/sh\n{body}\n")).unwrap();
            std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        fn agy(&self) {
            let path = self.dir.join("bin/agy");
            std::fs::write(&path, "#!/bin/sh\nexit 0\n").unwrap();
            std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        fn changing_calls(&self) -> Vec<String> {
            std::fs::read_to_string(self.dir.join("calls.log"))
                .unwrap_or_default()
                .lines()
                .filter(|l| {
                    l.starts_with("plugin marketplace add") || l.starts_with("plugin install")
                })
                .map(str::to_owned)
                .collect()
        }

        fn claude_files(&self) -> (PathBuf, PathBuf) {
            let claude = self.home().join(".claude");
            std::fs::create_dir_all(claude.join("plugins")).unwrap();
            (
                claude.join("settings.json"),
                claude.join("plugins/known_marketplaces.json"),
            )
        }
    }

    impl Drop for Sandbox {
        fn drop(&mut self) {
            let mut stack = vec![self.dir.clone()];
            while let Some(dir) = stack.pop() {
                let _ = std::fs::set_permissions(&dir, std::fs::Permissions::from_mode(0o755));
                if let Ok(entries) = std::fs::read_dir(&dir) {
                    stack.extend(entries.flatten().map(|e| e.path()).filter(|p| p.is_dir()));
                }
            }
            let _ = std::fs::remove_dir_all(&self.dir);
        }
    }

    fn go(sb: &Sandbox, apply: bool) -> (WireAgentsData, VerbAnswer) {
        let data = run(&sb.request(apply), &sb.env(""), &sb.home(), &BoundedRunner).unwrap();
        let answer = present(&data, true);
        (data, answer)
    }

    #[test]
    fn the_plan_holds_only_agents_present_and_writes_nothing_without_yes() {
        let sb = Sandbox::new("plan");
        let (none, answer) = go(&sb, false);
        assert_eq!(answer.exit, 0);
        assert_eq!(answer.data["agents"], serde_json::json!([]));
        assert_eq!(answer.data["absent"], serde_json::json!(["claude", "agy"]));
        assert_eq!(answer.data["applied"], false);
        assert_eq!(
            render_text(&none),
            "fgOS global agent wiring (opt-in). Agents found: none; not found: claude, agy.\nNothing to change.\n"
        );
        sb.claude(&[], "");
        sb.agy();
        let (settings, marketplaces) = sb.claude_files();
        std::fs::write(&settings, "{}\n").unwrap();
        let (planned, answer) = go(&sb, false);
        assert_eq!(answer.data["applied"], false);
        assert!(answer.data.get("backups").is_none(), "a plan has no result");
        let agents = answer.data["agents"].as_array().unwrap();
        assert_eq!(agents[0]["changes"][0]["id"], "claude-plugin");
        assert_eq!(
            agents[0]["changes"][0]["files"][2],
            sb.home()
                .join(".claude/plugins/installed_plugins.json")
                .display()
                .to_string()
        );
        assert_eq!(
            agents[1]["permissions"][0]["set"]["toolPermission"],
            "always-proceed"
        );
        let text = render_text(&planned);
        assert!(text.contains("Changes (run with --yes to apply;"));
        assert!(text.contains(&format!("    changes: {}", settings.display())));
        assert!(text.contains(
            "    set: {\"toolPermission\":\"always-proceed\",\"permissions\":{\"deny\":["
        ));
        assert_eq!(sb.changing_calls(), Vec::<String>::new());
        assert_eq!(std::fs::read_to_string(&settings).unwrap(), "{}\n");
        assert!(!marketplaces.exists());
    }

    #[test]
    fn yes_backs_up_each_existing_file_with_its_mode_before_claude_changes_anything_and_never_writes_a_permission(
    ) {
        let sb = Sandbox::new("apply");
        let (settings, marketplaces) = sb.claude_files();
        std::fs::write(&settings, "{\"theme\":\"dark\"}\n").unwrap();
        std::fs::set_permissions(&settings, std::fs::Permissions::from_mode(0o600)).unwrap();
        std::fs::write(&marketplaces, "{}\n").unwrap();
        sb.claude(&[&settings, &marketplaces], "");
        sb.agy();
        let (data, answer) = go(&sb, true);
        assert_eq!(answer.exit, 0, "{:?}", answer.data);
        assert_eq!(answer.data["applied"], true);
        assert_eq!(answer.data["failed"], serde_json::json!([]));
        assert_eq!(answer.data["done"], serde_json::json!(["claude-plugin"]));
        let result = data.result.as_ref().unwrap();
        assert_eq!(
            result
                .backups
                .iter()
                .map(|b| b.file.clone())
                .collect::<Vec<_>>(),
            vec![settings.clone(), marketplaces.clone()],
            "only files that exist are backed up"
        );
        let backup = &result.backups[0].backup;
        assert!(backup
            .file_name()
            .unwrap()
            .to_string_lossy()
            .starts_with("settings.json.pre-wire-agents-"));
        assert_eq!(backup.parent(), settings.parent());
        assert_eq!(
            std::fs::read_to_string(backup).unwrap(),
            "{\"theme\":\"dark\"}\n"
        );
        assert_eq!(
            std::fs::metadata(backup).unwrap().permissions().mode() & 0o777,
            0o600,
            "a backup keeps the private mode"
        );
        assert_eq!(
            sb.changing_calls(),
            vec![
                "plugin marketplace add vantt/forgent",
                "plugin install fgOS@fgos-plugins"
            ]
        );
        assert_eq!(
            std::fs::read_to_string(&settings).unwrap(),
            "{\"theme\":\"dark\"}\n"
        );
        assert!(
            !sb.home().join(".gemini").exists(),
            "always-proceed is never written"
        );
        let text = render_text(&data);
        assert!(text.contains("Changes:\n"));
        assert!(text.contains("Done: claude-plugin\n"));
        assert!(text.contains(&format!(
            "Backed up {} -> {}\n",
            settings.display(),
            backup.display()
        )));
    }

    #[test]
    fn a_failing_claude_step_stops_its_change_is_reported_and_ends_with_exit_1() {
        let sb = Sandbox::new("failing");
        sb.claude(&[], "plugin marketplace add vantt/forgent");
        let (data, answer) = go(&sb, true);
        assert_eq!(answer.exit, 1);
        assert_eq!(answer.data["done"], serde_json::json!([]));
        assert_eq!(
            answer.data["failed"],
            serde_json::json!([{
                "id": "claude-plugin",
                "error": "\"claude plugin marketplace add vantt/forgent\" failed: fake failure"
            }])
        );
        assert_eq!(
            sb.changing_calls(),
            vec!["plugin marketplace add vantt/forgent"],
            "the install after the failed step never runs"
        );
        assert!(render_text(&data).contains(
            "Failed: claude-plugin: \"claude plugin marketplace add vantt/forgent\" failed: fake failure\n"
        ));
    }

    #[test]
    fn a_backup_that_cannot_be_written_runs_nothing_and_leaves_the_files_as_they_were() {
        let sb = Sandbox::new("backup");
        let (settings, marketplaces) = sb.claude_files();
        std::fs::write(&settings, "{}\n").unwrap();
        std::fs::write(&marketplaces, "{}\n").unwrap();
        sb.claude(&[], "");
        // the first file's directory is writable, the second one's is not: one backup lands, the change stops
        let locked = marketplaces.parent().unwrap();
        std::fs::set_permissions(locked, std::fs::Permissions::from_mode(0o500)).unwrap();
        if std::fs::write(locked.join("probe"), "").is_ok() {
            return; // a user the mode does not bind (root)
        }
        let (_, answer) = go(&sb, true);
        assert_eq!(answer.exit, 1);
        let failed = answer.data["failed"][0]["error"].as_str().unwrap();
        assert!(
            failed.starts_with(&format!(
                "backup failed, nothing changed: EACCES: permission denied, copyfile '{}' -> '{}.pre-wire-agents-",
                marketplaces.display(),
                marketplaces.display()
            )),
            "{failed}"
        );
        assert_eq!(answer.data["backups"].as_array().unwrap().len(), 1);
        assert_eq!(sb.changing_calls(), Vec::<String>::new());
        assert_eq!(std::fs::read_to_string(&marketplaces).unwrap(), "{}\n");
    }

    #[test]
    fn a_backup_never_overwrites_a_copy_that_is_there() {
        let sb = Sandbox::new("exclusive");
        let (settings, _) = sb.claude_files();
        std::fs::write(&settings, "new\n").unwrap();
        let existing = settings.with_file_name(format!("settings.json{BACKUP_INFIX}stamp"));
        std::fs::write(&existing, "old\n").unwrap();
        let error = back_up(&settings, "stamp").unwrap_err();
        assert!(
            error.starts_with("EEXIST: file already exists, copyfile '"),
            "{error}"
        );
        assert_eq!(std::fs::read_to_string(&existing).unwrap(), "old\n");
        assert_eq!(
            back_up(&settings.with_file_name("missing.json"), "stamp"),
            Ok(None)
        );
    }

    #[test]
    fn the_answer_serialises_the_plan_first_then_applied_then_the_result() {
        let sb = Sandbox::new("keys");
        let (settings, _) = sb.claude_files();
        std::fs::write(&settings, "{}\n").unwrap();
        sb.claude(&[], "");
        let keys =
            |v: &serde_json::Value| v.as_object().unwrap().keys().cloned().collect::<Vec<_>>();
        assert_eq!(
            keys(&go(&sb, false).1.data),
            ["agents", "absent", "files", "applied"]
        );
        assert_eq!(
            keys(&go(&sb, true).1.data),
            ["agents", "absent", "files", "applied", "backups", "done", "failed"]
        );
    }

    #[test]
    fn the_text_is_the_default_and_json_replaces_it() {
        let sb = Sandbox::new("form");
        let data = run(&sb.request(false), &sb.env(""), &sb.home(), &BoundedRunner).unwrap();
        assert!(present(&data, false).text.is_some());
        assert!(present(&data, true).text.is_none());
    }

    #[test]
    fn the_request_reads_yes_and_json_as_the_node_cli_read_them() {
        let os = |args: &[&str]| args.iter().map(OsString::from).collect::<Vec<_>>();
        let root = PathBuf::from("/the/main/checkout");
        let read =
            |args: &[&str]| project_wire_agents_request(&os(args), Ok(root.clone())).unwrap();
        let plain = read(&["wire-agents"]);
        assert!(!plain.apply && !plain.json);
        assert!(read(&["wire-agents", "--yes", "--json"]).apply);
        assert!(read(&["wire-agents", "--yes", "x"]).apply);
        assert!(!read(&["wire-agents", "--yes", ""]).apply);
        assert!(!read(&["wire-agents", "--json", ""]).json);
        // `--dir` is a flag the call accepts; the project is the root the doors resolved
        assert_eq!(
            read(&["wire-agents", "--dir", "/nonexistent/elsewhere"]).project,
            root
        );
        assert!(matches!(
            project_wire_agents_request(&os(&["wire-agents"]), Err("no root".into())),
            Err(ProjectError::Failed(message)) if message == "no root"
        ));
    }

    #[test]
    fn a_missing_home_is_refused_as_a_missing_precondition_with_exit_2() {
        let sb = Sandbox::new("nohome");
        let without: Vec<(String, String)> = sb
            .env("")
            .into_iter()
            .filter(|(key, _)| key != "HOME")
            .collect();
        let refusal = serve(&sb.request(false), &without, &BoundedRunner).unwrap_err();
        assert_eq!(refusal.category, "precondition");
        assert_eq!(refusal.exit_code(), 2);
        assert!(
            refusal.message.starts_with("HOME is not set"),
            "{}",
            refusal.message
        );
        let mut blank = without;
        blank.push(("HOME".to_string(), "  ".to_string()));
        assert_eq!(
            serve(&sb.request(false), &blank, &BoundedRunner)
                .unwrap_err()
                .category,
            "precondition"
        );
    }
}
