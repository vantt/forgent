//! Provider facts shared by the launch path and the doctor: the registry of policy-shaped flags, the denylist
//! check, reasoning-effort rendering and the launched-model check. Pure: no spawn, no fs, no network.
//!
//! The provider family itself (`family_of`) is the executor model's answer in `fgos-execution`; this module
//! only asks it, so there is one spelling table.

/// The effort levels a command's CLI can be told to run at: the executor model's answer, not a second table.
pub use fgos_execution::executor_model::rendered_effort_levels;
use fgos_execution::executor_model::{family_of, FamilySource};
use serde_json::{json, Value};

/// The canonical effort levels fgOS speaks, in the order the config contract lists them.
pub const REASONING_EFFORT_VALUES: [&str; 4] = ["low", "medium", "high", "max"];

/// Known policy-shaped flags per provider family: flags that encode runtime policy (model, effort, tool gating,
/// permission mode or sandbox) rather than pure invocation mechanics.
pub fn known_policy_shaped_flags(family: &str) -> &'static [&'static str] {
    const CLAUDE: &[&str] = &[
        "--model",
        "--effort",
        "--allowedTools",
        "--permission-mode",
        "--dangerously-skip-permissions",
    ];
    match family {
        "claude" | "z-ai" | "glm" => CLAUDE,
        "openai" => &[
            "--model",
            "-s",
            "-s read-only",
            "-s danger-full-access",
            "--dangerously-bypass-approvals-and-sandbox",
            "--dangerously-skip-permissions",
            "--skip-git-repo-check",
        ],
        "gemini" => &["--model", "--mode", "--effort"],
        "pi" => &["--provider", "--model", "--tools", "--approve", "--mode"],
        _ => &[],
    }
}

fn family(source: Option<&str>, command: Option<&str>) -> String {
    family_of(
        source.map_or(FamilySource::None, FamilySource::Spelling),
        command,
    )
}

/// The policy-shaped flags known for a family spelling (or, with none, the command's family).
pub fn provider_policy_shaped_flags(
    provider_family: Option<&str>,
    command: Option<&str>,
) -> Vec<&'static str> {
    known_policy_shaped_flags(&family(provider_family, command)).to_vec()
}

/// Canonical family names of a deny list; empty and non-string entries are skipped.
pub fn normalize_disallowed_providers(disallowed: &[Value]) -> std::collections::BTreeSet<String> {
    disallowed
        .iter()
        .filter_map(Value::as_str)
        .filter(|entry| !entry.trim().is_empty())
        .map(|entry| family(Some(entry), None))
        .filter(|canonical| !canonical.is_empty())
        .collect()
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProviderCheck {
    pub disallowed: bool,
    pub canonical_provider: String,
}

impl ProviderCheck {
    pub fn to_json(&self) -> Value {
        json!({ "disallowed": self.disallowed, "canonicalProvider": self.canonical_provider })
    }
}

/// Is the candidate's family on the deny list? Both sides go through the one family vocabulary.
pub fn check_provider_disallowed(
    disallowed: Option<&[Value]>,
    candidate_provider: Option<&str>,
    candidate_command: Option<&str>,
) -> ProviderCheck {
    let canonical_provider = family(candidate_provider, candidate_command);
    let denied = match disallowed {
        Some(list) if !canonical_provider.is_empty() => {
            normalize_disallowed_providers(list).contains(&canonical_provider)
        }
        _ => false,
    };
    ProviderCheck {
        disallowed: denied,
        canonical_provider,
    }
}

pub fn is_provider_disallowed(
    disallowed: Option<&[Value]>,
    candidate_provider: Option<&str>,
    candidate_command: Option<&str>,
) -> bool {
    check_provider_disallowed(disallowed, candidate_provider, candidate_command).disallowed
}

/// The policy-shaped flags actually present in a rendered argv, in first-seen order without repeats. `-s` also
/// reports `-s <value>` when a value follows.
pub fn extract_policy_shaped_flags(args: &[String]) -> Vec<String> {
    const PLAIN: [&str; 11] = [
        "--model",
        "--effort",
        "--allowedTools",
        "--permission-mode",
        "--dangerously-bypass-approvals-and-sandbox",
        "--dangerously-skip-permissions",
        "--skip-git-repo-check",
        "--mode",
        "--provider",
        "--tools",
        "--approve",
    ];
    let mut flags: Vec<String> = Vec::new();
    let mut push = |flag: String| {
        if !flags.contains(&flag) {
            flags.push(flag);
        }
    };
    for (i, arg) in args.iter().enumerate() {
        if PLAIN.contains(&arg.as_str()) {
            push(arg.clone());
        } else if arg == "-s" {
            push("-s".to_string());
            if let Some(next) = args.get(i + 1).filter(|next| !next.starts_with('-')) {
                push(format!("-s {next}"));
            }
        }
    }
    flags
}

enum EffortControl {
    Flag(&'static str),
    ConfigKey {
        key: &'static str,
        native_max: Option<&'static str>,
    },
}

/// How each provider CLI takes a reasoning-effort level, keyed by the spawned command's own name: the CLI
/// decides the flag, not the provider family. codex has no flag and reads `model_reasoning_effort` from its
/// config, which `-c key=value` overrides for one run.
fn effort_control(command_name: &str) -> Option<EffortControl> {
    match command_name {
        "claude" | "agy" => Some(EffortControl::Flag("--effort")),
        "pi" | "omp" => Some(EffortControl::Flag("--thinking")),
        "codex" => Some(EffortControl::ConfigKey {
            key: "model_reasoning_effort",
            native_max: Some("xhigh"),
        }),
        _ => None,
    }
}

/// `path.basename` of a command on a POSIX path.
fn basename(command: Option<&str>) -> &str {
    let text = command.unwrap_or("").trim_end_matches('/');
    text.rsplit('/').next().unwrap_or("")
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EffortRender {
    pub args: Vec<String>,
    pub command: String,
    pub flag: String,
    pub native: String,
    pub replaced: Option<String>,
}

impl EffortRender {
    pub fn to_json(&self) -> Value {
        let mut control =
            json!({ "command": self.command, "flag": self.flag, "native": self.native });
        if let Some(replaced) = &self.replaced {
            control["replaced"] = json!(replaced);
        }
        json!({ "args": self.args, "control": control })
    }
}

/// Renders a canonical effort level into an invocation's args template (before `{prompt}`/`{model}`
/// substitution). A level the template already hard-codes is replaced, never duplicated. `None` when the
/// command has no effort control fgOS knows how to set.
pub fn render_reasoning_effort_args(
    command: Option<&str>,
    args: &[String],
    effort: &str,
) -> Option<EffortRender> {
    let name = basename(command);
    let control = effort_control(name)?;
    let mut out: Vec<String> = args.to_vec();
    let (flag, native, replaced);
    match control {
        EffortControl::ConfigKey { key, native_max } => {
            native = if effort == "max" {
                native_max.unwrap_or(effort)
            } else {
                effort
            }
            .to_string();
            flag = format!("-c {key}");
            let prefix = format!("{key}=");
            let at = (1..out.len()).find(|&i| out[i - 1] == "-c" && out[i].starts_with(&prefix));
            if let Some(i) = at {
                replaced = Some(out[i][prefix.len()..].to_string());
                out[i] = format!("{prefix}{native}");
            } else {
                replaced = None;
                // Options follow the `exec` subcommand when there is one.
                let at = usize::from(out.first().is_some_and(|first| first == "exec"));
                out.splice(at..at, ["-c".to_string(), format!("{prefix}{native}")]);
            }
        }
        EffortControl::Flag(control_flag) => {
            native = effort.to_string();
            flag = control_flag.to_string();
            match out
                .iter()
                .position(|arg| arg == control_flag)
                .filter(|i| i + 1 < out.len())
            {
                Some(i) => {
                    replaced = Some(out[i + 1].clone());
                    out[i + 1] = native.clone();
                }
                None => {
                    replaced = None;
                    out.splice(0..0, [control_flag.to_string(), native.clone()]);
                }
            }
        }
    }
    Some(EffortRender {
        args: out,
        command: name.to_string(),
        flag,
        native,
        replaced,
    })
}

/// The pre-spawn half of the model check: what was asked for, what the invocation is actually given, and the
/// warnings the two already imply.
#[derive(Debug, Clone, PartialEq)]
pub struct ModelCheck {
    pub requested: Option<String>,
    pub launched: Option<String>,
    pub warnings: Vec<Value>,
}

impl ModelCheck {
    pub fn to_json(&self) -> Value {
        let mut out = serde_json::Map::new();
        if let Some(requested) = &self.requested {
            out.insert("requested".into(), json!(requested));
        }
        if let Some(launched) = &self.launched {
            out.insert("launched".into(), json!(launched));
        }
        out.insert("warnings".into(), Value::Array(self.warnings.clone()));
        Value::Object(out)
    }
}

pub fn check_launched_model(
    requested: Option<&str>,
    launched: Option<&str>,
    args: &[String],
) -> ModelCheck {
    let requested = requested.filter(|m| !m.is_empty());
    let launched = launched.filter(|m| !m.is_empty());
    let mut warnings = Vec::new();
    if let (Some(asked), Some(given)) = (requested, launched) {
        if asked != given {
            warnings.push(json!({
                "code": "model-overridden",
                "requested": asked,
                "launched": given,
                "message": format!("requested model \"{asked}\" was replaced by \"{given}\" before launch"),
            }));
        }
        // Only a model the caller asked for is worth a warning: an executor that never takes a model is not ignoring one.
        if !args.iter().any(|arg| arg.contains(given)) {
            warnings.push(json!({
                "code": "model-not-passed",
                "launched": given,
                "message": format!("the invocation's argv never carries model \"{given}\"; the CLI runs whatever model its own config names"),
            }));
        }
    }
    ModelCheck {
        requested: requested.map(String::from),
        launched: launched.map(String::from),
        warnings,
    }
}

/// The first `prefix <token> suffix` in `text`: the token is a non-blank run, or a non-empty run up to `close`.
/// Returns the token and the whole matched text.
fn find_quoted<'t>(
    text: &'t str,
    prefix: &str,
    close: Option<char>,
    suffix: &str,
) -> Option<(&'t str, &'t str)> {
    let mut from = 0;
    while let Some(found) = text[from..].find(prefix) {
        let start = from + found;
        let token_at = start + prefix.len();
        let rest = &text[token_at..];
        let token_len = match close {
            Some(c) => rest.find(c).unwrap_or(rest.len()),
            None => rest.find(char::is_whitespace).unwrap_or(rest.len()),
        };
        if token_len > 0 && rest[token_len..].starts_with(suffix) {
            let end = token_at + token_len + suffix.len();
            return Some((&text[token_at..token_at + token_len], &text[start..end]));
        }
        from = start + prefix.len().max(1);
    }
    None
}

/// The model the CLI says it runs: a `model: <id>` header line.
fn reported_model(stderr: &str) -> Option<&str> {
    stderr.split('\n').find_map(|line| {
        let line = line.strip_suffix('\r').unwrap_or(line);
        let id = line.strip_prefix("model: ")?;
        (!id.is_empty() && !id.contains(char::is_whitespace)).then_some(id)
    })
}

/// The post-run half: the pre-spawn warnings plus what the CLI's own output says (it refused or did not know
/// the model, or reported running another one). Empty when nothing disagrees.
pub fn collect_model_warnings(
    check: Option<&ModelCheck>,
    stdout: &str,
    stderr: &str,
) -> Vec<Value> {
    let Some(check) = check else {
        return Vec::new();
    };
    let mut warnings = check.warnings.clone();
    let text = format!("{stderr}\n{stdout}");
    let refusal = find_quoted(&text, "model ", None, " is not recognized as a known model")
        .or_else(|| find_quoted(&text, "Model \"", Some('"'), "\" not found"))
        .or_else(|| find_quoted(&text, "Model metadata for `", Some('`'), "` not found"));
    if let Some((model, evidence)) = refusal {
        warnings.push(json!({
            "code": "model-unsupported",
            "model": model,
            "message": format!("the provider CLI does not recognize model \"{model}\""),
            "evidence": evidence,
        }));
    }
    // The header goes to stderr; a worker's own stdout may print any text.
    if let (Some(reported), Some(launched)) = (reported_model(stderr), check.launched.as_deref()) {
        if reported != launched {
            warnings.push(json!({
                "code": "model-reported-different",
                "launched": launched,
                "reported": reported,
                "message": format!("launched with model \"{launched}\" but the CLI reports running \"{reported}\""),
            }));
        }
    }
    warnings
}
