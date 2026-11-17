//! The verdict of the PreToolUse hook that guards Agent/Task calls (`fgos hook dispatch-decide`): `decide` run
//! for the caller, blocking unless the answer is `in-process`.
//!
//! Two harness formats share one normalizer. The standard format (Claude Code, Codex: `{ tool_name, tool_input,
//! cwd, transcript_path }`) refuses with exit 2 and the reason on stderr; agy's (`{ toolCall: { name, args },
//! workspacePaths }`) answers JSON on stdout and always exits 0. The project a verdict is judged against is the
//! harness's own: agy's workspace root, else `CLAUDE_PROJECT_DIR`, else the directory the hook was started in; a
//! `cwd` inside a payload names where one tool call ran, not which project owns the rules, so it is never read.
//!
//! One rule for both formats: a payload that is empty or does not parse allows the call, and so does any failure
//! of the verdict itself, a panic included (the hook is an enforcement layer on top of a working dispatch surface,
//! never a second point of failure for it). Two failures block: a config refusal (a `config-*` code: the
//! semantic check's, or the config door's when it refuses the file or cannot read it), because allowing the call would
//! let it bypass rules the config declares or that cannot be judged, and a project directory that does not exist,
//! since no rule can be read from it.

use crate::decide::{DecideAnswer, DecideFailure};
use crate::runner_check::js_trim;
use serde_json::{json, Map, Value};
use std::panic::{catch_unwind, AssertUnwindSafe};

/// The payload format.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Format {
    Standard,
    Agy,
}

/// One tool call, whatever format it came in.
#[derive(Debug, Clone, PartialEq)]
pub struct HookCall {
    pub format: Format,
    /// The tool's name as the payload states it (any JSON value; only a string can name an agent tool).
    pub tool_name: Option<Value>,
    /// The tool's input; an empty object when the payload holds none or not an object.
    pub tool_input: Map<String, Value>,
    pub transcript_path: Option<String>,
    pub project_dir: String,
}

impl HookCall {
    /// The call as the vectors state it: a tool name the payload does not state is left out, one it states as
    /// `null` is kept.
    pub fn to_json(&self) -> Value {
        let mut out = Map::new();
        out.insert(
            "format".into(),
            json!(match self.format {
                Format::Standard => "standard",
                Format::Agy => "agy",
            }),
        );
        if let Some(name) = &self.tool_name {
            out.insert("toolName".into(), name.clone());
        }
        out.insert("toolInput".into(), Value::Object(self.tool_input.clone()));
        out.insert("transcriptPath".into(), json!(self.transcript_path));
        out.insert("projectDir".into(), json!(self.project_dir));
        Value::Object(out)
    }
}

/// A string that is not blank once trimmed the way JavaScript trims (U+FEFF included).
fn is_text(value: Option<&str>) -> bool {
    value.is_some_and(|text| !js_trim(text).is_empty())
}

/// The payload with every `\u` escape of an unpaired UTF-16 surrogate replaced by `\uFFFD`. JSON.parse reads such
/// an escape into a string the hook still judges (it prints as U+FFFD), where a Rust string cannot hold it; only a
/// real escape inside the text is touched, a paired surrogate is kept.
fn without_lone_surrogates(raw: &str) -> std::borrow::Cow<'_, str> {
    let unit = |at: usize| -> Option<u16> {
        let hex = raw.get(at + 2..at + 6)?;
        (raw.get(at..at + 2) == Some("\\u")).then_some(())?;
        u16::from_str_radix(hex, 16).ok()
    };
    let is_high = |u: u16| (0xD800..0xDC00).contains(&u);
    let is_low = |u: u16| (0xDC00..0xE000).contains(&u);
    let bytes = raw.as_bytes();
    let mut out: Option<String> = None;
    let (mut i, mut copied) = (0, 0);
    while i < bytes.len() {
        if bytes[i] != b'\\' {
            i += 1;
            continue;
        }
        match unit(i) {
            Some(high) if is_high(high) && unit(i + 6).is_some_and(is_low) => i += 12,
            Some(lone) if is_high(lone) || is_low(lone) => {
                let text = out.get_or_insert_with(String::new);
                text.push_str(&raw[copied..i]);
                text.push_str("\\uFFFD");
                i += 6;
                copied = i;
            }
            Some(_) => i += 6,
            None => i += 2,
        }
    }
    match out {
        None => std::borrow::Cow::Borrowed(raw),
        Some(mut text) => {
            text.push_str(&raw[copied..]);
            std::borrow::Cow::Owned(text)
        }
    }
}

/// One call shape for both formats; `None` when the payload is empty or not a JSON object (the caller allows).
/// `format` is the `--format=` flag value; without it the payload's own shape decides.
pub fn normalize_hook_payload(
    raw: &str,
    format: Option<&str>,
    claude_project_dir: Option<&str>,
    cwd: &str,
) -> Option<HookCall> {
    if !is_text(Some(raw)) {
        return None;
    }
    let Ok(Value::Object(data)) = serde_json::from_str::<Value>(&without_lone_surrogates(raw))
    else {
        return None;
    };
    let agy = format == Some("agy") || data.contains_key("toolCall");
    let object = |value: Option<&Value>| match value {
        Some(Value::Object(fields)) => fields.clone(),
        _ => Map::new(),
    };
    let tool_call = data.get("toolCall");
    let workspace_root = data
        .get("workspacePaths")
        .and_then(Value::as_array)
        .and_then(|paths| paths.first())
        .and_then(Value::as_str)
        .filter(|root| agy && is_text(Some(root)));
    let harness_dir = claude_project_dir.filter(|dir| is_text(Some(dir)));
    Some(HookCall {
        format: if agy { Format::Agy } else { Format::Standard },
        tool_name: if agy {
            tool_call.and_then(|call| call.get("name")).cloned()
        } else {
            data.get("tool_name").cloned()
        },
        tool_input: object(if agy {
            tool_call.and_then(|call| call.get("args"))
        } else {
            data.get("tool_input")
        }),
        transcript_path: data
            .get("transcript_path")
            .and_then(Value::as_str)
            .filter(|path| !agy && is_text(Some(path)))
            .map(str::to_string),
        project_dir: workspace_root.or(harness_dir).unwrap_or(cwd).to_string(),
    })
}

/// A verdict: allow, or block with the reason.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Verdict {
    Allow,
    Block(String),
}

/// The tool names an agent call goes by.
const AGENT_TOOL_NAMES: &[&str] = &["Agent", "Task", "task"];

/// The `config-*` code of a config refusal, or `None` for any other failure (which allows the call). A config the
/// door refuses or cannot read carries its door id, as `decide` raises it; a runner refusal carries its own code. A
/// runner refusal without a `config-*` code is not a config refusal today (p-lqjyc7umub), so it allows.
fn config_refusal_text(failure: &DecideFailure) -> Option<String> {
    match failure {
        DecideFailure::ConfigDoor { code, .. } if code.starts_with("config-") => Some(code.clone()),
        DecideFailure::Refused(error) if error.name == "RunnerConfigError" => error
            .code
            .filter(|code| code.starts_with("config-"))
            .map(str::to_string),
        DecideFailure::SeatRefused { code, .. } if code.starts_with("config-") => {
            Some(code.clone())
        }
        _ => None,
    }
}

/// The verdict for one call. `decide` answers `decide --for <subagent type> --needs-soul --has-live-task-access`
/// at the call's project; `project_dir_exists` says whether that directory is there; `run_door` names the run
/// door for an executor and capability (from the main checkout's config).
pub fn dispatch_verdict(
    call: &HookCall,
    project_dir_exists: bool,
    decide: impl FnOnce(&str) -> Result<DecideAnswer, DecideFailure>,
    run_door: impl FnOnce(Option<&str>, &str) -> String,
) -> Verdict {
    let tool = call.tool_name.as_ref().and_then(Value::as_str);
    let Some(tool) = tool.filter(|name| AGENT_TOOL_NAMES.contains(name)) else {
        return Verdict::Allow;
    };
    let subagent_type = ["subagent_type", "agent"]
        .iter()
        .filter_map(|key| call.tool_input.get(*key).and_then(Value::as_str))
        .find(|value| is_text(Some(value)))
        .unwrap_or("general-purpose");
    if !project_dir_exists {
        return Verdict::Block(format!(
            "this {tool} call cannot be routed because the project directory \"{}\" does not exist; set CLAUDE_PROJECT_DIR (or start the hook inside the project) and retry.",
            call.project_dir
        ));
    }
    let decided = match decide(subagent_type) {
        Ok(decided) => decided,
        Err(failure) => {
            return match config_refusal_text(&failure) {
                None => Verdict::Allow,
                Some(refusal) => Verdict::Block(format!(
                    "this {tool} call cannot be routed because the config is unusable: {refusal}. Run `fgos config check` to list every refusal with its fix, correct the file, then retry."
                )),
            }
        }
    };
    if decided.mechanism == "in-process" {
        return Verdict::Allow;
    }
    let decided_via = format!(
        "(decided via: decide --for \"{subagent_type}\" --needs-soul --has-live-task-access)"
    );
    if decided.mechanism != "out-of-process" {
        let cause = match &decided.blocked_reason {
            Some(Some(reason)) => reason.clone(),
            _ if !decided.reason_codes.is_empty() => decided.reason_codes.join(", "),
            _ => "no reason reported".into(),
        };
        return Verdict::Block(format!(
            "this {tool} call cannot be dispatched: \"{subagent_type}\" has executors of its own and decide answered unavailable for it ({cause}). Fix that cause (run `fgos dispatch decide --for \"{subagent_type}\" --needs-soul --has-live-task-access` to see it), or use a subagent type that has no executors of its own. {decided_via}"
        ));
    }
    let door = run_door(decided.executor_id.as_deref(), subagent_type);
    Verdict::Block(format!(
        "this {tool} call resolves to out-of-process dispatch (no native in-process handler for \"{subagent_type}\"). Run it through {door} instead of calling this tool directly -- it runs the task as one unit and hands back the real result. {decided_via}"
    ))
}

/// What the hook prints and exits with.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookAnswer {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
}

/// A verdict in the protocol of the call's format: agy answers JSON on stdout and exits 0; the standard format
/// blocks with exit 2 and the reason on stderr.
pub fn hook_answer(verdict: &Verdict, format: Format) -> HookAnswer {
    match (format, verdict) {
        (Format::Agy, Verdict::Allow) => HookAnswer {
            exit_code: 0,
            stdout: "{\"decision\":\"allow\"}\n".into(),
            stderr: String::new(),
        },
        (Format::Agy, Verdict::Block(reason)) => HookAnswer {
            exit_code: 0,
            stdout: format!(
                "{}\n",
                json!({ "decision": "deny", "reason": format!("BLOCKED: {reason}") })
            ),
            stderr: String::new(),
        },
        (Format::Standard, Verdict::Allow) => HookAnswer {
            exit_code: 0,
            stdout: String::new(),
            stderr: String::new(),
        },
        (Format::Standard, Verdict::Block(reason)) => HookAnswer {
            exit_code: 2,
            stdout: String::new(),
            stderr: format!("BLOCKED: {reason}\n"),
        },
    }
}

/// The whole hook over one payload: normalize, judge, answer. A payload that does not normalize allows in the
/// flag's format; a verdict that panics allows in the call's format.
pub fn serve_hook(
    raw: &str,
    format_flag: Option<&str>,
    claude_project_dir: Option<&str>,
    cwd: &str,
    judge: impl FnOnce(&HookCall) -> Verdict,
) -> HookAnswer {
    let Some(call) = normalize_hook_payload(raw, format_flag, claude_project_dir, cwd) else {
        let format = if format_flag == Some("agy") {
            Format::Agy
        } else {
            Format::Standard
        };
        return hook_answer(&Verdict::Allow, format);
    };
    let verdict = catch_unwind(AssertUnwindSafe(|| judge(&call))).unwrap_or(Verdict::Allow);
    hook_answer(&verdict, call.format)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_verdict_that_panics_allows_the_call_in_its_own_format() {
        let payload = r#"{"toolCall":{"name":"Task","args":{}},"workspacePaths":["/p"]}"#;
        let answer = serve_hook(payload, None, None, "/cwd", |_| {
            panic!("the verdict failed")
        });
        assert_eq!(answer, hook_answer(&Verdict::Allow, Format::Agy));
    }
}
