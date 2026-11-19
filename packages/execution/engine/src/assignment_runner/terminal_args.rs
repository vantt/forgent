//! The argv an agent starts with: the access to the run directory a claude seat needs, and what an interactive
//! agent in a pane starts with.

use std::fs;
use std::path::{Path, PathBuf};

use serde_json::Value;

use crate::accounts::credential::command_cli;
use crate::transport::adapters::{CASE_ID_ENV, CASE_RESERVATION_ENV};
use crate::transport_round::executor_command::agent_args_without_prompt;

fn absolute(path: &Path) -> PathBuf {
    std::path::absolute(path).unwrap_or_else(|_| path.to_path_buf())
}

/// Operator-approved `--add-dir` entries stay after the granted ones.
fn with_add_dirs(args: &[String], directories: &[String]) -> Vec<String> {
    match args.iter().position(|a| a == "--add-dir") {
        None => {
            let mut out = args.to_vec();
            out.push("--add-dir".into());
            out.extend(directories.iter().cloned());
            out
        }
        Some(at) => {
            let mut out = args[..=at].to_vec();
            out.extend(directories.iter().cloned());
            out.extend(args[at + 1..].iter().cloned());
            out
        }
    }
}

/// How a launch reaches the run directory.
pub enum RunDirAccess<'a> {
    /// A direct attempt of the `claude` CLI is granted its outbox.
    CliSpawn {
        command: &'a str,
        outbox_dir: Option<&'a Path>,
    },
    /// A claude pane attempt is granted its run directory, the unit's `inputs` and the parents of the settled
    /// sibling reports the assignment points at.
    HerdrSpawn {
        interactive_kind: Option<&'a str>,
        run_dir: Option<&'a Path>,
    },
}

/// The argv with the directories the agent needs access to.
pub fn with_run_dir_access(args: &[String], access: &RunDirAccess<'_>) -> Vec<String> {
    match access {
        RunDirAccess::CliSpawn {
            command,
            outbox_dir,
        } => {
            let Some(outbox) =
                outbox_dir.filter(|_| command_cli(command).as_deref() == Some("claude"))
            else {
                return args.to_vec();
            };
            with_add_dirs(args, &[absolute(outbox).to_string_lossy().into_owned()])
        }
        RunDirAccess::HerdrSpawn {
            interactive_kind,
            run_dir,
        } => {
            let (Some("claude"), Some(run_dir)) = (*interactive_kind, run_dir) else {
                return args.to_vec();
            };
            let run = absolute(run_dir);
            let unit_dir = run
                .parent()
                .and_then(Path::parent)
                .map(Path::to_path_buf)
                .unwrap_or_default();
            let mut directories = vec![run.to_string_lossy().into_owned()];
            let inputs = unit_dir.join("inputs");
            if inputs.exists() {
                directories.push(inputs.to_string_lossy().into_owned());
            }
            // Non-blind handoffs point at settled sibling reports, not copied inputs.
            if let Ok(text) = fs::read_to_string(unit_dir.join("assignment.json")) {
                if let Ok(assignment) = serde_json::from_str::<Value>(&text) {
                    for reference in assignment
                        .get("contextRefs")
                        .and_then(Value::as_array)
                        .into_iter()
                        .flatten()
                    {
                        let Some(file) = reference
                            .as_str()
                            .map(Path::new)
                            .filter(|p| p.is_absolute())
                        else {
                            continue;
                        };
                        if !file.is_file() {
                            continue;
                        }
                        if let Some(parent) = fs::canonicalize(file)
                            .ok()
                            .and_then(|r| r.parent().map(Path::to_path_buf))
                        {
                            let parent = parent.to_string_lossy().into_owned();
                            if !directories.contains(&parent) {
                                directories.push(parent);
                            }
                        }
                    }
                }
            }
            with_add_dirs(args, &directories)
        }
    }
}

/// The directories an argv grants through `--add-dir` (variadic, or `--add-dir=<dir>`).
pub fn add_dirs_of(args: &[String]) -> Vec<String> {
    let mut dirs = Vec::new();
    let mut variadic = false;
    for value in args {
        if value == "--add-dir" {
            variadic = true;
        } else if let Some(dir) = value.strip_prefix("--add-dir=") {
            dirs.push(dir.to_string());
            variadic = false;
        } else if value.starts_with('-') {
            variadic = false;
        } else if variadic {
            dirs.push(value.clone());
        }
    }
    dirs
}

/// How the prompt reaches a pane worker: what the resolved command declares, else inline.
pub fn terminal_prompt_delivery(resolved_cmd: &Value) -> String {
    resolved_cmd
        .get("promptDelivery")
        .and_then(Value::as_str)
        .map(str::to_string)
        .unwrap_or_else(|| "inline".into())
}

/// The case an attempt was admitted into.
pub struct CaseContext<'a> {
    pub case_id: &'a str,
    pub reservation_id: &'a str,
}

/// What an interactive agent in a pane starts with.
pub struct TerminalArgs<'a> {
    pub resolved_cmd: &'a Value,
    pub prompt: &'a str,
    pub model: &'a str,
    pub run_dir: &'a Path,
    pub writer_id: &'a str,
    pub case_context: Option<CaseContext<'a>>,
}

fn strings(value: Option<&Value>) -> Option<Vec<String>> {
    value.and_then(Value::as_array).map(|items| {
        items
            .iter()
            .filter_map(|v| v.as_str().map(str::to_string))
            .collect()
    })
}

/// The argv an interactive agent starts with in a pane: the executor's own args without the prompt (the supervisor
/// types the brief at the prompt instead), the access to the run directory a claude seat needs to open the brief
/// and write its outbox, and -- for codex, whose shell commands run under a shared daemon that does not inherit the
/// pane's environment -- the attempt's writer id (and its case) as an explicit setting.
pub fn terminal_agent_args(input: &TerminalArgs<'_>) -> Vec<String> {
    let cmd = input.resolved_cmd;
    let template = strings(cmd.get("argsTemplate"));
    let args = agent_args_without_prompt(
        template.as_deref(),
        &strings(cmd.get("args")).unwrap_or_default(),
        input.prompt,
        input.model,
    );
    let args = with_run_dir_access(
        &args,
        &RunDirAccess::HerdrSpawn {
            interactive_kind: cmd.pointer("/interactiveMode/kind").and_then(Value::as_str),
            run_dir: Some(input.run_dir),
        },
    );
    let command = cmd
        .get("command")
        .and_then(Value::as_str)
        .unwrap_or_default();
    if command_cli(command).as_deref() != Some("codex") {
        return args;
    }
    let mut settings: Vec<String> = fgos_identity::launcher_env(input.writer_id, None)
        .map(|env| {
            env.set
                .iter()
                .map(|(name, value)| format!("{name}=\"{value}\""))
                .collect()
        })
        .unwrap_or_default();
    if let Some(case) = &input.case_context {
        settings.push(format!("{CASE_ID_ENV}=\"{}\"", case.case_id));
        settings.push(format!(
            "{CASE_RESERVATION_ENV}=\"{}\"",
            case.reservation_id
        ));
    }
    let mut out = args;
    out.push("-c".into());
    out.push(format!(
        "shell_environment_policy.set={{{}}}",
        settings.join(",")
    ));
    out
}
