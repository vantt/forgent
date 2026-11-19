//! One real, cheap call made with a provider account's own credential, to learn whether that credential works now.
//! The call runs against the account's home itself, not a copy: a login that rotates its refresh token on renewal
//! would use the token up in a throwaway copy and leave the original stale. Only the credential layouts fgOS can
//! name are probed (a Codex home, an omp profile, a pi account directory, a Claude Code login); any other layout
//! answers "no probe", so the account stays locked for a person to clear.

use std::collections::BTreeMap;
use std::path::Path;
use std::time::{Duration, Instant};

use fgos_agent_protocol::direct::adapter_for;
use fgos_agent_protocol::outcome::{ExitInfo, Outcome};
use serde_json::{json, Map, Value};

use super::credential::{
    account_credential_sources, credential_source_for_cli, expand_credential_home,
};
use super::fault::describe_provider_signal;
use super::state::{AccountLock, ProbeRequest};

pub const PROMPT: &str = "Reply with the single word OK.";
pub const OUTPUT_LIMIT: usize = 16 * 1024;
pub const DEFAULT_TIMEOUT_MS: u64 = 90 * 1000;

/// What one probe call runs: the program, its arguments, the variables that point it at the login, and the home.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProbePlan {
    pub command: String,
    pub args: Vec<String>,
    pub env: BTreeMap<String, String>,
    pub home: String,
    /// The CLI to judge the output as; the command itself when the plan was not wrapped.
    pub cli: Option<String>,
}

impl ProbePlan {
    pub fn to_json(&self) -> Value {
        let mut out = Map::new();
        out.insert("command".into(), json!(self.command));
        out.insert("args".into(), json!(self.args));
        out.insert("env".into(), json!(self.env));
        out.insert("home".into(), json!(self.home));
        if let Some(cli) = &self.cli {
            out.insert("cli".into(), json!(cli));
        }
        Value::Object(out)
    }
}

fn plan(command: &str, args: Vec<String>, env: &[(&str, &str)], home: &str) -> ProbePlan {
    ProbePlan {
        command: command.into(),
        args,
        env: env
            .iter()
            .map(|(k, v)| (k.to_string(), v.to_string()))
            .collect(),
        home: home.into(),
        cli: None,
    }
}

fn files_of(source: &Value) -> Option<Vec<&str>> {
    source
        .get("files")?
        .as_array()
        .map(|list| list.iter().filter_map(Value::as_str).collect())
}

/// The command that makes one call with this credential, or `None` when the layout is not one fgOS can probe.
/// `no_tools`: the call gets no tools at all. `model`: ask for this model instead of the login's default.
pub fn credential_probe_command(
    source: &Value,
    no_tools: bool,
    model: Option<&str>,
    home_dir: Option<&str>,
) -> Option<ProbePlan> {
    let home = expand_credential_home(source.get("home").and_then(Value::as_str), home_dir)?;
    let kind = source.get("kind").and_then(Value::as_str);
    let model_args: Vec<String> = model
        .map(|m| vec!["--model".to_string(), m.to_string()])
        .unwrap_or_default();
    let s = |text: &str| text.to_string();
    if kind == Some("codex-home") {
        let mut args = vec![
            s("exec"),
            s("--skip-git-repo-check"),
            s("-s"),
            s("read-only"),
        ];
        if let Some(model) = model {
            args.extend([s("-m"), model.to_string()]);
        }
        args.push(s(PROMPT));
        return Some(plan("codex", args, &[("CODEX_HOME", &home)], &home));
    }
    let files = if kind == Some("home-files") {
        files_of(source)
    } else {
        None
    };
    // omp keeps its login in `agent.db`; its layout is tested before pi's `auth.json`, since a profile may list both.
    if files.as_ref().is_some_and(|f| f.contains(&"agent.db")) {
        let mut args = vec![s("-p"), s(PROMPT), s("--mode"), s("json")];
        args.extend(model_args);
        args.extend(if no_tools {
            vec![s("--no-tools")]
        } else {
            vec![s("--tools"), s("read")]
        });
        return Some(plan("omp", args, &[("PI_CODING_AGENT_DIR", &home)], &home));
    }
    if files.as_ref().is_some_and(|f| f.contains(&"auth.json")) {
        let mut args = vec![s("-p"), s(PROMPT), s("--mode"), s("json")];
        args.extend(model_args);
        args.extend(if no_tools {
            vec![s("--no-tools")]
        } else {
            vec![s("--tools"), s("read"), s("--approve")]
        });
        return Some(plan("pi", args, &[("PI_CODING_AGENT_DIR", &home)], &home));
    }
    let mut claude = vec![s("-p"), s(PROMPT), s("--no-session-persistence")];
    claude.extend(model_args);
    claude.extend([s("--tools"), s(if no_tools { "" } else { "Read" })]);
    let files = files?;
    if files.contains(&".credentials.json") {
        return Some(plan(
            "claude",
            claude,
            &[("CLAUDE_CONFIG_DIR", &home)],
            &home,
        ));
    }
    if files
        .iter()
        .any(|f| Path::new(f) == Path::new(".claude").join(".credentials.json"))
    {
        return Some(plan("claude", claude, &[], &home));
    }
    None
}

/// Make a call end on its own even when its runner dies: coreutils `timeout` ends it after the limit (and kills it
/// five seconds after that). Without `timeout` on PATH the plan runs as it is.
pub fn with_kill_timeout(plan: ProbePlan, timeout_ms: u64, path_var: &str) -> ProbePlan {
    // Only coreutils `timeout` takes these arguments; Windows has a `timeout.exe` that does something else.
    let bin = if cfg!(windows) {
        None
    } else {
        fgos_process::spawn::resolve_program("timeout", path_var, "", false)
    };
    let Some(bin) = bin else { return plan };
    let seconds = (timeout_ms.div_ceil(1000)).max(1);
    let mut args = vec![
        "--kill-after=5".to_string(),
        seconds.to_string(),
        plan.command.clone(),
    ];
    args.extend(plan.args.clone());
    ProbePlan {
        command: bin.to_string_lossy().into_owned(),
        args,
        cli: plan.cli.clone().or(Some(plan.command)),
        ..plan
    }
}

fn said(signal: &Value) -> String {
    describe_provider_signal(signal).map_or(String::new(), |phrase| format!(" ({phrase})"))
}

/// Judge what the call printed. A zero exit is not enough: a dead login can still end the process quietly, so the
/// CLI's last words are read through the agent protocol. `output` is stdout and stderr merged, `stdout` the
/// stdout alone, whose last JSON event can carry the provider's refusal.
pub fn judge_probe_output(
    exit_code: Option<i32>,
    timed_out: bool,
    cli: &str,
    output: &str,
    stdout: &str,
) -> Value {
    if timed_out {
        return json!({ "ok": false, "detail": "the call did not finish in time", "reason": null, "providerSignal": null });
    }
    let adapter = adapter_for(cli);
    let reason = match adapter.classify(ExitInfo { code: exit_code }, output, stdout, None) {
        Outcome::Blocked(reason) => Some(reason.as_str()),
        _ => None,
    };
    let signal = adapter
        .provider_signal(output, stdout)
        .map_or(Value::Null, |s| s.to_json());
    let fail = |detail: String| json!({ "ok": false, "detail": detail, "reason": reason, "providerSignal": signal });
    match reason {
        Some("login") => fail("the login is still rejected".into()),
        Some("usage-limit") if exit_code != Some(0) => fail(format!(
            "the account answers with a usage limit{}",
            said(&signal)
        )),
        Some("provider-error") if exit_code != Some(0) => {
            fail(format!("the provider refused the call{}", said(&signal)))
        }
        _ if exit_code != Some(0) => json!({
            "ok": false,
            "detail": format!("the call exited with code {}", exit_code.map_or("null".to_string(), |c| c.to_string())),
            "reason": null,
            "providerSignal": null,
        }),
        _ => json!({ "ok": true, "reason": null, "providerSignal": null }),
    }
}

/// What a call left behind.
#[derive(Debug, Clone, Default)]
pub struct RawRun {
    pub exit_code: Option<i32>,
    pub timed_out: bool,
    pub output: String,
    pub stdout: String,
}

/// Starts the planned call and waits for it. The account lock's own runner lends the lock to the call.
pub trait ProbeRunner {
    fn run(
        &self,
        plan: &ProbePlan,
        env: &BTreeMap<String, String>,
        timeout_ms: u64,
    ) -> Result<RawRun, String>;
}

fn tail_of(bytes: &[u8]) -> String {
    let text = String::from_utf8_lossy(bytes);
    let chars: Vec<char> = text.chars().collect();
    chars[chars.len().saturating_sub(OUTPUT_LIMIT)..]
        .iter()
        .collect()
}

fn merged(stdout: &[u8], stderr: &[u8]) -> (String, String) {
    let mut both = stdout.to_vec();
    both.extend_from_slice(stderr);
    (tail_of(&both), tail_of(stdout))
}

/// A plain child process (a test's fake, or a call that needs no lock lent to it).
pub struct ProcessRunner;

impl ProbeRunner for ProcessRunner {
    fn run(
        &self,
        plan: &ProbePlan,
        env: &BTreeMap<String, String>,
        timeout_ms: u64,
    ) -> Result<RawRun, String> {
        let env: Vec<(String, String)> = env.iter().map(|(k, v)| (k.clone(), v.clone())).collect();
        let outcome = fgos_process::spawn::run_bounded(
            &plan.command,
            &plan.args,
            &env,
            Some(Path::new(&plan.home)),
            None,
            Duration::from_millis(timeout_ms),
        )
        .map_err(|e| format!("could not start {}: {e}", plan.command))?;
        let (exit_code, timed_out, stdout, stderr) = match outcome {
            fgos_process::spawn::Outcome::Exited(out) => {
                (out.status.code(), false, out.stdout, out.stderr)
            }
            fgos_process::spawn::Outcome::TimedOut { stdout, stderr } => {
                (None, true, stdout, stderr)
            }
        };
        let (output, stdout) = merged(&stdout, &stderr);
        Ok(RawRun {
            exit_code,
            timed_out,
            output,
            stdout,
        })
    }
}

/// A call that holds the account lock for as long as it and anything it left behind lives (unix).
#[cfg(unix)]
pub struct HoldingRunner<'a>(pub &'a AccountLock);

#[cfg(unix)]
impl ProbeRunner for HoldingRunner<'_> {
    fn run(
        &self,
        plan: &ProbePlan,
        env: &BTreeMap<String, String>,
        timeout_ms: u64,
    ) -> Result<RawRun, String> {
        let mut argv = vec![plan.command.clone()];
        argv.extend(plan.args.clone());
        let spec = fgos_holder_lock::BorrowSpec {
            argv,
            cwd: Some(std::path::PathBuf::from(&plan.home)),
            env: env.clone(),
            clear_env: true,
            stdio: fgos_holder_lock::BorrowStdio::Null,
        };
        let io = fgos_holder_lock::BorrowIo {
            stdin: Vec::new(),
            stdout_limit: OUTPUT_LIMIT * 4,
            stderr_limit: OUTPUT_LIMIT * 4,
            deadline: Instant::now() + Duration::from_millis(timeout_ms),
        };
        let done = self
            .0
            .run_holding(&spec, &io)
            .map_err(|e| format!("could not run {}: {e}", plan.command))?;
        let (output, stdout) = merged(&done.stdout, &done.stderr);
        let timed_out = done.outcome.exit.is_none() && done.outcome.signal.is_some();
        Ok(RawRun {
            exit_code: done.outcome.exit,
            timed_out,
            output,
            stdout,
        })
    }
}

/// What a probe call inherits from its runner: the shell basics only, never a token or a variable that points a
/// CLI at another login. HOME and the working directory are the login home the call is pointed at.
pub fn probe_env(
    inherited: &BTreeMap<String, String>,
    plan: &ProbePlan,
) -> BTreeMap<String, String> {
    let mut out: BTreeMap<String, String> = ["PATH", "LANG", "LC_ALL", "TZ", "TERM"]
        .iter()
        .filter_map(|name| inherited.get(*name).map(|v| (name.to_string(), v.clone())))
        .collect();
    out.insert("HOME".into(), plan.home.clone());
    out.extend(plan.env.clone());
    out
}

/// Run one planned call and judge what it printed.
pub fn run_credential_probe(
    plan: &ProbePlan,
    runner: &dyn ProbeRunner,
    timeout_ms: u64,
    inherited: &BTreeMap<String, String>,
) -> Value {
    let started = Instant::now();
    let raw = match runner.run(plan, &probe_env(inherited, plan), timeout_ms) {
        Ok(raw) => raw,
        Err(detail) => return json!({ "ok": false, "detail": detail }),
    };
    let cli = plan.cli.clone().unwrap_or_else(|| plan.command.clone());
    let mut judged =
        judge_probe_output(raw.exit_code, raw.timed_out, &cli, &raw.output, &raw.stdout);
    judged["exitCode"] = raw.exit_code.map_or(Value::Null, |c| json!(c));
    judged["timedOut"] = json!(raw.timed_out);
    judged["elapsedMs"] = json!(started.elapsed().as_millis() as u64);
    judged
}

/// The probe `probe_quarantined_accounts` calls for each account: the store of the CLI the dispatch runs (or the
/// first store the account declares), one real call holding the account lock.
pub fn probe_credential(
    request: &ProbeRequest,
    lock: &AccountLock,
    timeout_ms: u64,
    home_dir: Option<&str>,
    inherited: &BTreeMap<String, String>,
) -> Value {
    let account = request.account;
    let sources = account_credential_sources(account);
    let source = credential_source_for_cli(account, request.cli).or(sources.first().copied());
    let path_var = inherited.get("PATH").cloned().unwrap_or_default();
    let planned = source
        .and_then(|source| credential_probe_command(source, false, request.model, home_dir))
        .map(|p| with_kill_timeout(p, timeout_ms, &path_var));
    let Some(planned) = planned else {
        return json!({ "ok": false, "detail": "no probe exists for this credential layout" });
    };
    #[cfg(unix)]
    {
        run_credential_probe(&planned, &HoldingRunner(lock), timeout_ms, inherited)
    }
    #[cfg(not(unix))]
    {
        let _ = lock;
        run_credential_probe(&planned, &ProcessRunner, timeout_ms, inherited)
    }
}
