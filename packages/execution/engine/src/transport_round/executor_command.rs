//! The command a resolved executor runs: its argv with the prompt and model substituted per element, the
//! reasoning-effort flag, the pre-launch model check and the dispatch attestation.
//!
//! The executor itself (which config entry a tier or id selects, the cross-provider gate) is resolved by dispatch
//! planning and passed in as `executor`; this module never re-derives it. The command is always an argv, never a
//! shell string: the prompt and model go into `args` one element at a time, so shell metacharacters in a work
//! item's text stay inert.

use std::path::Path;

use fgos_execution::executor_model::{credential_store_of, ModelError};
use serde_json::{json, Map, Value};

use crate::transport::adapters::{adapter_metadata, DEFAULT_ADAPTER, EXECUTOR_ADAPTER_NAMES};
use crate::transport::provider_adapter::{check_launched_model, render_reasoning_effort_args};

/// Linux refuses one argv element above this; a longer one is warned about, never cut.
pub const MAX_ARG_STRLEN: usize = 131_072;

fn runner_error(message: String) -> ModelError {
    ModelError {
        name: "RunnerConfigError",
        code: None,
        message,
    }
}

/// `{ baseCommit, headRef }` of a checkout, captured by the launcher right before dispatch, never trusted from
/// what the executor reports later.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct DispatchAttestation {
    pub base_commit: Option<String>,
    pub head_ref: Option<String>,
}

impl DispatchAttestation {
    pub fn to_json(&self) -> Value {
        json!({ "baseCommit": self.base_commit, "headRef": self.head_ref })
    }
}

/// The checkout at `attest_root`, else the project root above `fgos_dir`, read through the Git port: its HEAD and
/// the branch it has checked out (none when detached). Advisory: a read that cannot resolve yields none and never
/// blocks dispatch.
pub fn capture_dispatch_attestation(
    fgos_dir: Option<&Path>,
    attest_root: Option<&Path>,
) -> DispatchAttestation {
    let root = attest_root
        .map(Path::to_path_buf)
        .or_else(|| fgos_dir.and_then(Path::parent).map(Path::to_path_buf));
    let Some(root) = root else {
        return DispatchAttestation::default();
    };
    read_attestation(&root).unwrap_or_default()
}

fn read_attestation(root: &Path) -> Option<DispatchAttestation> {
    // The checkout's trusted main root is read from the disk-only topology; the driver then lists the worktrees
    // of that repository, one of which is the checkout itself.
    let topology = fgos_git::GitDriver::topology_at(root).ok()??;
    let driver = fgos_git::GitDriver::new(&fgos_holder_lock::state_root::state_root().0).ok()?;
    let repo = match driver
        .resolve_repo(root, topology.trusted_main_root())
        .ok()?
    {
        fgos_git::ResolveRepo::Repository(repo) => repo,
        fgos_git::ResolveRepo::NotARepository => return None,
    };
    let own = std::fs::canonicalize(repo.work_tree()?).ok()?;
    let mut cursor = None;
    loop {
        let page = driver.list_worktrees(&repo, cursor, 1024).ok()?;
        for entry in &page.entries {
            let path = String::from_utf8_lossy(&entry.path).into_owned();
            if std::fs::canonicalize(&path).ok().as_deref() == Some(own.as_path()) {
                return Some(DispatchAttestation {
                    base_commit: entry.head.as_ref().map(|head| head.as_str().to_string()),
                    head_ref: entry
                        .branch
                        .as_ref()
                        .and_then(|b| b.as_str().strip_prefix("refs/heads/"))
                        .map(String::from),
                });
            }
        }
        cursor = page.next_cursor;
        cursor.as_ref()?;
    }
}

/// What the caller asks of [`resolve_executor_command`] besides the resolved executor.
#[derive(Debug, Clone, Default)]
pub struct CommandRequest<'a> {
    pub prompt: &'a str,
    pub model: &'a str,
    pub executor_id: Option<&'a str>,
    pub fgos_dir: Option<&'a Path>,
    pub attest_root: Option<&'a Path>,
    pub reasoning_effort: Option<&'a str>,
    pub requested_model: Option<&'a str>,
}

fn string_args(executor: &Value) -> Result<Vec<String>, ModelError> {
    executor
        .get("args")
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or_default()
        .iter()
        .map(|arg| {
            arg.as_str().map(String::from).ok_or_else(|| {
                runner_error("runner config \"executor.args\" entries must all be strings.".into())
            })
        })
        .collect()
}

// The reasoning-effort check is pure; it lives with the vocabulary in `fgos-execution`.
pub use fgos_execution::tier_cell::assert_reasoning_effort;

/// The command, args and launch facts of `executor` (the resolved executor entry), with `{prompt}` and `{model}`
/// substituted in each `args` element. Returns the same object Dispatch reads: `command`, `args`, `argsTemplate`,
/// `env`, `adapter`, `provider`, the attestation, `governance`, the credential store, the rendered effort and the
/// pre-spawn model check.
pub fn resolve_executor_command(
    executor: &Value,
    request: &CommandRequest<'_>,
) -> Result<Value, ModelError> {
    let attestation = capture_dispatch_attestation(request.fgos_dir, request.attest_root);
    let adapter = executor
        .get("adapter")
        .and_then(Value::as_str)
        .unwrap_or(DEFAULT_ADAPTER);
    if adapter_metadata(adapter).is_none() {
        return Err(runner_error(format!(
            "runner config declares unknown executor adapter \"{adapter}\" (known: {}).",
            EXECUTOR_ADAPTER_NAMES.join(", ")
        )));
    }
    let command = executor.get("command").and_then(Value::as_str);
    let mut template = string_args(executor)?;
    let mut effort_applied = None;
    if let Some(effort) = request.reasoning_effort {
        let supported = executor
            .pointer("/supports/reasoningEffort")
            .and_then(Value::as_array)
            .map(Vec::as_slice);
        assert_reasoning_effort(effort, supported, request.executor_id)?;
        let Some(rendered) = render_reasoning_effort_args(command, &template, effort) else {
            let program = Path::new(command.unwrap_or(""))
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default();
            return Err(runner_error(format!(
                "executor \"{}\" runs \"{program}\", which has no reasoning-effort control fgOS can set -- drop --effort or pick an invocation whose CLI takes one (claude, codex, agy, pi, omp).",
                request.executor_id.unwrap_or("undefined")
            )));
        };
        template = rendered.args.clone();
        let mut applied = Map::new();
        applied.insert("requested".into(), json!(effort));
        if let Some(control) = rendered.to_json().get("control").and_then(Value::as_object) {
            applied.extend(control.clone());
        }
        effort_applied = Some(Value::Object(applied));
    }
    let args: Vec<String> = template
        .iter()
        .map(|arg| {
            arg.split("{prompt}")
                .collect::<Vec<_>>()
                .join(request.prompt)
                .split("{model}")
                .collect::<Vec<_>>()
                .join(request.model)
        })
        .collect();
    for (index, arg) in args.iter().enumerate() {
        if arg.len() > MAX_ARG_STRLEN {
            eprintln!(
                "fgos: warning: executor argument at index {index} exceeds Linux MAX_ARG_STRLEN 128 KiB ({} bytes); spawn may fail with E2BIG. Consider delivery via file-pointer.",
                arg.len()
            );
        }
    }
    let field = |name: &str| executor.get(name).cloned().unwrap_or(Value::Null);
    let provider = executor
        .get("provider")
        .filter(|v| !v.is_null())
        .cloned()
        .or_else(|| executor.pointer("/governance/providerFamily").cloned())
        .unwrap_or(Value::Null);
    let model_check = check_launched_model(request.requested_model, Some(request.model), &args);
    let mut out = Map::new();
    out.insert("command".into(), field("command"));
    out.insert("args".into(), json!(args));
    out.insert("argsTemplate".into(), json!(template));
    for name in ["env", "liveOutput", "interactiveMode"] {
        out.insert(name.into(), field(name));
    }
    out.insert("adapter".into(), json!(adapter));
    for name in ["promptDelivery", "permissionMode", "confinement"] {
        out.insert(name.into(), field(name));
    }
    out.insert("provider".into(), provider);
    out.insert("baseCommit".into(), json!(attestation.base_commit));
    out.insert("headRef".into(), json!(attestation.head_ref));
    for name in ["governance", "method", "url", "headers", "body"] {
        out.insert(name.into(), field(name));
    }
    out.insert(
        "credentialStore".into(),
        credential_store_of(executor)
            .cloned()
            .unwrap_or(Value::Null),
    );
    if let Some(applied) = effort_applied {
        out.insert("reasoningEffort".into(), applied);
    }
    out.insert("modelCheck".into(), model_check.to_json());
    Ok(Value::Object(out))
}

/// The agent's own argv with the prompt taken out. `args_template` (the args before substitution) names exactly
/// the entries that carried the prompt, by the `{prompt}` placeholder; a caller with no template falls back to
/// comparing against the prompt text.
pub fn agent_args_without_prompt(
    args_template: Option<&[String]>,
    args: &[String],
    prompt: &str,
    model: &str,
) -> Vec<String> {
    if let Some(template) = args_template {
        return template
            .iter()
            .filter(|arg| !arg.contains("{prompt}"))
            .map(|arg| arg.split("{model}").collect::<Vec<_>>().join(model))
            .collect();
    }
    if prompt.is_empty() {
        return args.to_vec();
    }
    args.iter()
        .filter(|arg| !arg.contains(prompt))
        .cloned()
        .collect()
}

/// The refusal of a caller that reaches an adapter directly: every agent runs as an attempt of the run
/// supervisor, so an adapter has nothing to execute. `adapter_name` is `cli-spawn` or `herdr-spawn`.
pub fn supervised_only_refusal(adapter_name: &str, work_id: Option<&str>) -> (String, String) {
    (
        format!("{adapter_name}-supervised-only"),
        format!(
            "executor for work \"{}\" refused: {adapter_name} runs as an attempt of the run supervisor, started by executeAssignment (fgos run); it cannot be executed directly.",
            work_id.unwrap_or("undefined")
        ),
    )
}
