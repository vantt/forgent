//! One provider account, every CLI configured for it, probed two ways: a direct leg (one cheap call per login
//! store with the account's own login, no sandbox and no pane) and a harness leg (the same door a real read-only
//! dispatch uses). The two together tell an ACCOUNT fault (dead login, quota: every CLI fails the same way) from a
//! HARNESS fault (the login answers when called directly, but a CLI stops at a trust prompt, a sandbox refusal).
//! Diagnostic only: it picks nothing and schedules nothing.

use std::path::{Path, PathBuf};

use fgos_execution::accounts::legacy_state_key;
use fgos_seat_binding::tier::Tier;
use serde_json::{json, Map, Value};

use super::credential::{
    account_credential_sources, command_cli, credential_source_for_cli, expand_credential_home,
};
use super::credential_probe::credential_probe_command;
use super::fault::describe_provider_signal;
use crate::assignment::tier_cell::parse_tier_cell;

pub const ACCOUNT_PROBE_PROMPT: &str =
    "Account probe: there is no task. Reply with the single word OK.";
pub const DEFAULT_ACCOUNT_PROBE_TIMEOUT_MS: u64 = 3 * 60 * 1000;
pub const ACCOUNT_PROBE_LEGS: [&str; 3] = ["direct", "harness", "both"];

/// The CLI a credential layout logs in, the same layouts the unlock probe names.
pub fn cli_for_credential(source: &Value) -> Option<&'static str> {
    if source.get("kind").and_then(Value::as_str) == Some("codex-home") {
        return Some("codex");
    }
    let files: Vec<&str> = source
        .get("files")
        .and_then(Value::as_array)
        .map(|l| l.iter().filter_map(Value::as_str).collect())
        .unwrap_or_default();
    if source.get("kind").and_then(Value::as_str) == Some("home-files") {
        if files.contains(&"agent.db") {
            return Some("omp");
        }
        if files.contains(&"auth.json") {
            return Some("pi");
        }
    }
    None
}

const CREDENTIAL_ENV: [&str; 3] = ["CODEX_HOME", "PI_CODING_AGENT_DIR", "HOME"];

/// The invocations of `provider`'s executors that run as `account_id`, each with how the account reaches it:
/// `lease` (a confined invocation that reads a login store the account has), `env` (its own credential env names
/// one of the account's store homes), or `name` (the invocation id ends with `-<accountId>`). Only `via: "cli"`
/// invocations; `executor_id` narrows to one executor. `inventory` is the lease's own account inventory.
pub fn account_invocations(
    cfg: &Value,
    inventory: &Map<String, Value>,
    provider: &str,
    account_id: &str,
    executor_id: Option<&str>,
    home_dir: Option<&str>,
) -> Value {
    let family = legacy_state_key(provider);
    let account = inventory
        .get(&family)
        .and_then(|p| p.get("accounts"))
        .and_then(|a| a.get(account_id))
        .filter(|a| a.is_object());
    let homes: Vec<String> = account
        .map(|a| account_credential_sources(a))
        .unwrap_or_default()
        .iter()
        .filter_map(|s| expand_credential_home(s.get("home").and_then(Value::as_str), home_dir))
        .collect();
    let leases = |cli: &str| match account {
        Some(a) if a.get("credentialSources").is_some_and(|s| !s.is_null()) => {
            credential_source_for_cli(a, Some(cli)).is_some()
        }
        Some(a) => a.get("credentialSource").and_then(cli_for_credential) == Some(cli),
        None => false,
    };
    let mut found = Vec::new();
    for (id, executor) in cfg
        .get("executors")
        .and_then(Value::as_object)
        .into_iter()
        .flatten()
    {
        if executor_id.is_some_and(|e| e != id) {
            continue;
        }
        let provider_of = executor
            .get("providerModel")
            .or_else(|| executor.get("provider"))
            .and_then(Value::as_str);
        if executor_id.is_none() && legacy_state_key(provider_of.unwrap_or("undefined")) != family {
            continue;
        }
        for inv in executor
            .get("invocations")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
        {
            let inv_id = inv.get("id").and_then(Value::as_str).unwrap_or_default();
            if inv.get("via").and_then(Value::as_str) != Some("cli") || inv_id.is_empty() {
                continue;
            }
            let confined = inv
                .get("confinement")
                .filter(|c| !c.is_null())
                .or_else(|| executor.get("confinement"))
                .and_then(|c| c.get("backend"))
                .is_some_and(|b| !b.is_null() && *b != json!(""));
            let store = fgos_execution::executor_model::credential_store_of(inv);
            let env_homes = CREDENTIAL_ENV.iter().any(|key| {
                expand_credential_home(
                    inv.get("env")
                        .and_then(|e| e.get(*key))
                        .and_then(Value::as_str),
                    home_dir,
                )
                .is_some_and(|home| homes.contains(&home))
            });
            let via = if confined
                && store.is_some()
                && account.is_some()
                && leases(
                    store
                        .and_then(|s| s.get("use"))
                        .and_then(Value::as_str)
                        .unwrap_or_default(),
                ) {
                Some("lease")
            } else if env_homes {
                Some("env")
            } else if inv_id.ends_with(&format!("-{account_id}")) {
                Some("name")
            } else {
                None
            };
            if let Some(via) = via {
                found.push(json!({
                    "executorId": id, "invocationId": inv_id,
                    "cli": inv.get("command").and_then(Value::as_str).and_then(command_cli).unwrap_or_default(),
                    "adapter": inv.get("adapter").and_then(Value::as_str).unwrap_or("cli-spawn"),
                    "confined": confined, "via": via,
                }));
            }
        }
    }
    json!({ "provider": family, "accountId": account_id, "account": account.cloned().unwrap_or(Value::Null), "invocations": found })
}

/// The model a real seat would ask `executor_id` for on an account of `family`'s pool: the strongest tier whose
/// cell names an entry that pool serves. With no such cell the invocation default is probed, and the row says so.
pub fn probe_model_for(cfg: &Value, executor_id: &str, family: &str) -> (Option<String>, String) {
    let executor = cfg.get("executors").and_then(|e| e.get(executor_id));
    let cell_family = executor
        .and_then(|e| e.get("providerModel").or_else(|| e.get("provider")))
        .and_then(Value::as_str)
        .unwrap_or(executor_id);
    let tiers = cfg.get("modelPolicies").and_then(|m| m.get(cell_family));
    for tier in Tier::ALL.iter().rev() {
        let Some(cell) = tiers.and_then(|t| t.get(tier.name())) else {
            continue;
        };
        // A cell the config reader would refuse names no model to probe.
        let Ok(entries) = parse_tier_cell(cell, cell_family) else {
            continue;
        };
        if let Some(entry) = entries
            .into_iter()
            .find(|entry| legacy_state_key(&entry.pool) == family)
        {
            return (Some(entry.model), format!("{cell_family}.{}", tier.name()));
        }
    }
    (None, "invocation-default".into())
}

fn read_json(path: &Path) -> Option<Value> {
    serde_json::from_str(&std::fs::read_to_string(path).ok()?).ok()
}

fn line_matching(text: &str, pattern: fn(&str) -> bool) -> Option<String> {
    text.lines()
        .map(str::trim)
        .find(|l| !l.is_empty() && pattern(l))
        .map(String::from)
}

fn has_any(text: &str, needles: &[&str]) -> bool {
    let lower = text.to_lowercase();
    needles.iter().any(|n| lower.contains(n))
}

/// `\bword\b`: `word` with no letter, digit or underscore on either side.
fn has_word(text: &str, word: &str) -> bool {
    let is_word = |c: char| c.is_alphanumeric() || c == '_';
    text.match_indices(word).any(|(at, found)| {
        !text[..at].chars().next_back().is_some_and(is_word)
            && !text[at + found.len()..].chars().next().is_some_and(is_word)
    })
}

fn is_trust_prompt(text: &str) -> bool {
    has_any(
        text,
        &["trust this folder", "do you trust", "trust the files"],
    )
}

fn is_sandbox_refusal(text: &str) -> bool {
    has_any(
        text,
        &[
            "read-only file system",
            "bwrap:",
            "operation not permitted",
            "confinement was declared",
            "confinement refused",
            "confinement-",
        ],
    ) || has_word(&text.to_uppercase(), "EROFS")
}

/// `time[sd]?[-_ ]?out`, case-insensitive.
fn is_timeout_word(text: &str) -> bool {
    let lower = text.to_lowercase();
    lower.match_indices("time").any(|(at, _)| {
        let rest = &lower[at + 4..];
        [
            rest,
            rest.get(1..)
                .filter(|_| rest.starts_with(['s', 'd']))
                .unwrap_or("\u{0}"),
        ]
        .iter()
        .any(|after| {
            after.starts_with("out")
                || after
                    .get(1..)
                    .is_some_and(|r| after.starts_with(['-', '_', ' ']) && r.starts_with("out"))
        })
    })
}

fn is_timed_out(text: &str) -> bool {
    has_any(text, &["timed out"])
}

fn is_timed_out_or_timeout(text: &str) -> bool {
    has_any(text, &["timed out", "timeout"])
}

fn is_trust_word(text: &str) -> bool {
    has_any(text, &["trust"])
}

fn is_trust_folder(text: &str) -> bool {
    has_any(text, &["trust this folder"])
}

fn has_ok_word(text: &str) -> bool {
    has_word(text, "OK")
}

fn is_text(text: &str) -> bool {
    !text.trim().is_empty()
}

/// What a settled probe round said, for [`classify_account_probe`].
#[derive(Debug, Clone, Default)]
pub struct ProbeRun<'a> {
    pub ok: bool,
    pub text: &'a str,
    pub failure_code: Option<&'a str>,
    /// `credential`, `quota` or `provider`: the agent protocol's verdict on the CLI's last words.
    pub cause: Option<&'a str>,
    pub provider_signal: Value,
    pub run_dir: Option<PathBuf>,
}

/// One outcome class and the line that shows it: ok, blocked-trust-prompt, auth, quota, sandbox, timeout, other.
/// Returns `{outcome, evidence, matchedRule?}`.
pub fn classify_account_probe(run: &ProbeRun) -> Value {
    let diagnosis = run
        .run_dir
        .as_ref()
        .and_then(|d| read_json(&d.join("herdr-diagnosis.json")));
    let visibility = run
        .run_dir
        .as_ref()
        .and_then(|d| read_json(&d.join("visibility.json")));
    let explain = diagnosis.as_ref().and_then(|d| d.get("explain"));
    let pick = |v: Option<&Value>, k: &str| {
        v.and_then(|v| v.get(k))
            .and_then(Value::as_str)
            .filter(|s| !s.is_empty())
            .map(String::from)
    };
    let screen = [
        pick(diagnosis.as_ref(), "detectionScreen"),
        pick(explain, "promptText"),
        pick(visibility.as_ref(), "screen"),
    ]
    .into_iter()
    .flatten()
    .collect::<Vec<_>>()
    .join("\n");
    let all = [run.text.to_string(), screen.clone()]
        .into_iter()
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("\n");
    if run.ok {
        let evidence = line_matching(run.text, has_ok_word)
            .or_else(|| line_matching(run.text, is_text))
            .unwrap_or_else(|| "settled".into());
        return json!({ "outcome": "ok", "evidence": evidence });
    }
    let matched_rule = pick(explain, "matchedRule");
    let finish = |outcome: &str, evidence: String| {
        let mut out = json!({ "outcome": outcome, "evidence": evidence });
        if let Some(rule) = &matched_rule {
            out["matchedRule"] = json!(rule);
        }
        out
    };
    if matched_rule.as_ref().is_some_and(|r| is_trust_word(r)) || is_trust_prompt(&screen) {
        let evidence = line_matching(&screen, is_trust_folder)
            .or_else(|| line_matching(&screen, is_trust_word))
            .unwrap_or_else(|| format!("herdr rule {}", matched_rule.clone().unwrap_or_default()));
        return finish("blocked-trust-prompt", evidence);
    }
    if run.failure_code == Some("provider-limit") {
        let signal = describe_provider_signal(&run.provider_signal);
        match run.cause {
            Some("credential") => {
                return finish(
                    "auth",
                    signal.unwrap_or_else(|| "the login is rejected".into()),
                )
            }
            Some("quota") => {
                return finish(
                    "quota",
                    signal.unwrap_or_else(|| "the account has used up its quota".into()),
                )
            }
            Some("provider") => {
                return finish(
                    "other",
                    signal.unwrap_or_else(|| "the provider refused the call".into()),
                )
            }
            _ => {}
        }
    }
    if let Some(line) = line_matching(&all, is_sandbox_refusal) {
        return finish("sandbox", line);
    }
    if is_timeout_word(run.failure_code.unwrap_or_default())
        || line_matching(&all, is_timed_out).is_some()
    {
        let evidence = line_matching(&all, is_timed_out_or_timeout)
            .unwrap_or_else(|| run.failure_code.unwrap_or_default().to_string());
        return finish("timeout", evidence);
    }
    finish(
        "other",
        line_matching(&all, is_text)
            .unwrap_or_else(|| run.failure_code.unwrap_or("no output").to_string()),
    )
}

/// Who failed, from both legs. Direct rows (`leg: "direct"`; a `no-probe` layout is no evidence) say what the
/// account's own login does; harness rows count only when `inVerdict`. One of: healthy, account-fault,
/// harness-fault, mixed, nothing-to-probe.
pub fn account_probe_verdict(rows: &[Value]) -> &'static str {
    let outcome = |r: &Value| {
        r.get("outcome")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string()
    };
    let direct: Vec<&Value> = rows
        .iter()
        .filter(|r| r["leg"] == "direct" && outcome(r) != "no-probe")
        .collect();
    let harness: Vec<&Value> = rows
        .iter()
        .filter(|r| {
            r["leg"] != "direct"
                && r.get("inVerdict")
                    .is_some_and(|v| !v.is_null() && *v != json!(false))
        })
        .collect();
    if direct.is_empty() && harness.is_empty() {
        return "nothing-to-probe";
    }
    let fault = |r: &&Value| matches!(outcome(r).as_str(), "auth" | "quota");
    let ok = |r: &&Value| outcome(r) == "ok";
    if direct.iter().chain(harness.iter()).all(ok) {
        return "healthy";
    }
    let account_fault = if direct.is_empty() {
        harness.iter().all(fault)
    } else {
        direct.iter().all(fault) && !harness.iter().any(ok)
    };
    if account_fault {
        return "account-fault";
    }
    if !direct.is_empty() && direct.iter().all(ok) {
        return "harness-fault";
    }
    "mixed"
}

/// The inline execution contract of one probe: read-only, one run, the prompt as its objective.
pub fn probe_contract(prompt: &str, timeout_ms: u64) -> Value {
    json!({
        "objective": prompt, "contextRefs": [], "constraints": [], "expectedOutputs": ["the single word OK"],
        "mutation": "read-only", "evidence": { "required": "reported" }, "role": "reviewer",
        "budget": { "timeoutMs": timeout_ms, "maxRuns": 1 },
    })
}

/// An Assignment bound the way a Workflow unit binds one: the executor, the invocation and the read-only posture,
/// so the door confines it, leases the account and copies its login.
pub fn with_probe_binding(assignment: &Value, executor_id: &str, invocation_id: &str) -> Value {
    let mut out = assignment.clone();
    out["binding"] =
        json!({ "executor": executor_id, "invocation": invocation_id, "posture": "read-only" });
    let mut policy = assignment
        .get("policy")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    policy.insert("preferExecutor".into(), json!(executor_id));
    policy.insert("preferInvocation".into(), json!(invocation_id));
    out["policy"] = Value::Object(policy);
    out
}

/// What the direct leg's call answered, as a row: `ok`, `auth`, `quota`, `other`, `no-probe`.
pub fn direct_row(
    cli: Option<&str>,
    store_home: Option<&str>,
    model: Option<&str>,
    model_source: &str,
    result: &Value,
    elapsed_ms: u64,
) -> Value {
    let reason = result.get("reason").and_then(Value::as_str);
    let outcome = if result.get("ok") == Some(&json!(true)) {
        "ok"
    } else {
        match reason {
            Some("login") => "auth",
            Some("usage-limit") => "quota",
            _ => "other",
        }
    };
    let evidence = result
        .get("detail")
        .cloned()
        .filter(|d| !d.is_null())
        .unwrap_or(if outcome == "ok" {
            json!("answered")
        } else {
            Value::Null
        });
    json!({
        "leg": "direct", "cli": cli, "store": store_home, "model": model, "modelSource": model_source,
        "outcome": outcome,
        "reason": result.get("reason").cloned().unwrap_or(Value::Null),
        "providerSignal": result.get("providerSignal").cloned().unwrap_or(Value::Null),
        "exitCode": result.get("exitCode").cloned().unwrap_or(Value::Null),
        "evidence": evidence,
        "elapsedMs": result.get("elapsedMs").cloned().unwrap_or(json!(elapsed_ms)),
    })
}

/// The row of a login store fgOS has no call for.
pub fn no_probe_row(
    cli: Option<&str>,
    store_home: Option<&str>,
    model: Option<&str>,
    model_source: &str,
) -> Value {
    json!({
        "leg": "direct", "cli": cli, "store": store_home, "model": model, "modelSource": model_source,
        "outcome": "no-probe", "reason": null, "providerSignal": null, "exitCode": null,
        "evidence": "no probe exists for this credential layout", "elapsedMs": 0,
    })
}

/// One direct-leg call: the CLI, its store and the model go in; the judged answer and the elapsed milliseconds come out.
pub type DirectCall<'a> = dyn FnMut(Option<&str>, &Value, Option<&str>) -> (Value, u64) + 'a;

/// Leg 1: one call per login store of the account with the account's own login, each on the model the harness leg
/// asks the same CLI for. `call(cli, source, model)` makes the call under the account lock and returns the judged
/// answer (see `probe_credential`).
pub fn run_direct_leg(
    cfg: &Value,
    plan: &Value,
    home_dir: Option<&str>,
    call: &mut DirectCall,
) -> Vec<Value> {
    let account = &plan["account"];
    let provider = plan["provider"].as_str().unwrap_or_default();
    let stores: Vec<(Option<String>, &Value)> =
        match account.get("credentialSources").and_then(Value::as_object) {
            Some(map) => map
                .iter()
                .map(|(cli, source)| (Some(cli.clone()), source))
                .collect(),
            None => account_credential_sources(account)
                .into_iter()
                .map(|s| (cli_for_credential(s).map(String::from), s))
                .collect(),
        };
    let mut rows = Vec::new();
    for (cli, source) in stores {
        let invocation = plan["invocations"]
            .as_array()
            .and_then(|l| l.iter().find(|i| i["cli"].as_str() == cli.as_deref()));
        let (model, model_source) = invocation
            .and_then(|i| i["executorId"].as_str())
            .map_or((None, "invocation-default".to_string()), |id| {
                probe_model_for(cfg, id, provider)
            });
        let home = source.get("home").and_then(Value::as_str);
        if credential_probe_command(source, false, None, home_dir).is_none() {
            rows.push(no_probe_row(
                cli.as_deref(),
                home,
                model.as_deref(),
                &model_source,
            ));
            continue;
        }
        let (result, elapsed) = call(cli.as_deref(), source, model.as_deref());
        rows.push(direct_row(
            cli.as_deref(),
            home,
            model.as_deref(),
            &model_source,
            &result,
            elapsed,
        ));
    }
    rows
}
