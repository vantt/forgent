//! `dispatch inspect`: the runtime inspection of a Run, an Assignment or a working directory's dispatch lock (with
//! the attempt view of the one run it resolved to), the provider-capacity inventory of this machine, the terminal
//! allocations that need a person, and the attention view of the whole project. Reads only: closing a slot stays
//! with adopt, and the provider capacity is changed through `reconcile`.

use super::observe::{probe_attempt, read_attempt_view, read_json};
use super::{fgos_dir, validation, Answer, Answered, Flags, SubRequest};
use crate::wiring::dispatch_decide::HostWorkspace;
use crate::wiring::observe_query::HostRecordEnvironment;
use fgos_execution::decide::CheckoutFacts;
use fgos_execution_engine::accounts::{Accounts, SystemHost};
use fgos_execution_engine::transport_round::attention::{
    attention_view, AttentionReaders, DefinitionsReader,
};
use fgos_execution_engine::transport_round::inspection::{
    inspect_dispatch_runtime, validate_inspection_selector, InspectionOptions, RunsCache,
};
use fgos_execution_engine::unit_run::history::outcome_of_run_result;
use fgos_host_runtime::{CategorisedRefusal, VerbAnswer};
use fgos_observe::ObserveRequest;
use fgos_terminal_control::port::{FindingKind, Refusal};
use serde_json::{json, Map, Value};
use std::path::{Path, PathBuf};

/// The host's `metrics query --def` call for `(since, now)`, owned.
type Definitions = Box<dyn Fn(&str, &str) -> Value>;

const ATTENTION_DEFINITIONS: &str = "core/attention/definitions";

fn now_iso() -> String {
    fgos_identity::text::iso_utc_now()
}

/// The answer line a finding of the allocation scan reads as.
fn finding_text(kind: &FindingKind) -> &'static str {
    match kind {
        FindingKind::AllocatedNotLaunchedBareShell => {
            "a slot was allocated but never launched and its pane is a bare shell"
        }
        FindingKind::RetainExpired => "a retained pane is past its retain time",
        FindingKind::StaleIncarnation => "a record belongs to a herdr server that is gone",
        FindingKind::Unknown => "a record could not be judged",
    }
}

fn kind_name(kind: &FindingKind) -> Value {
    serde_json::to_value(kind).unwrap_or(Value::Null)
}

fn not_scanned(level: &str, reason: String) -> Value {
    json!({ "state": "not-scanned", "level": level, "reason": reason })
}

/// What the terminal-control scan finds past `terminal.allocationGraceMs`: slots allocated but never launched,
/// retained panes past their time, records of a herdr server that is gone. Reads only.
pub(crate) fn scan_terminal_allocations(root: &Path) -> Value {
    let parts = match super::terminal::route_parts(Map::new()) {
        Ok(parts) => parts,
        Err(message) => {
            return not_scanned(
                "warning",
                format!(
                "the terminal-control route did not answer, allocations not scanned ({message})"
            ),
            )
        }
    };
    let grace = match fgos_config::provider::effective_value(root, "terminal.allocationGraceMs") {
        Ok(value) => value,
        Err(refusal) => {
            return not_scanned(
                "warning",
                format!(
                    "terminal.* unreadable, allocations not scanned: {}: {}",
                    refusal.reason, refusal.detail
                ),
            )
        }
    };
    let Some(grace_ms) = grace.as_ref().and_then(Value::as_u64) else {
        return not_scanned(
            "warning",
            "terminal.allocationGraceMs is invalid (see terminal-control), allocations not scanned"
                .to_owned(),
        );
    };
    let scanned = parts.core().reconcile_scan(grace_ms);
    match scanned {
        Err(Refusal::Unsupported { capability, detail }) => not_scanned(
            "info",
            format!(
                "allocations not scanned: terminal mode is unsupported here ({})",
                if detail.is_empty() {
                    capability
                } else {
                    detail
                }
            ),
        ),
        Err(Refusal::Unknown { reason }) => not_scanned(
            "warning",
            if reason.is_empty() {
                "allocation scan answered unknown".to_owned()
            } else {
                format!("allocation scan answered unknown ({reason})")
            },
        ),
        Ok(findings) => json!({
            "state": "scanned",
            "graceMs": grace_ms,
            "findings": findings.iter().map(|f| json!({
                "key": f.key,
                "paneId": f.pane_id,
                "kind": kind_name(&f.kind),
                "text": finding_text(&f.kind),
                "detail": if f.detail.is_empty() { Value::Null } else { json!(f.detail) },
            })).collect::<Vec<_>>(),
        }),
    }
}

/// The provider-capacity inventory, state, quarantines and open leases of this machine: the machine's own runner
/// (never a project's) against the global account state.
fn provider_capacity() -> Result<Value, CategorisedRefusal> {
    let runner = crate::wiring::doctor::confinement::machine_runner().map_err(validation)?;
    let inventory = fgos_execution::accounts::provider_account_inventory(
        &runner,
        &crate::wiring::seat_binding::HostMachine::new(None, None),
    );
    let host = SystemHost::new();
    let accounts = Accounts::from_environment(&host).map_err(|e| validation(e.to_string()))?;
    Ok(accounts.inspect_provider_capacity(&inventory, None, None))
}

/// Adds the attempt view to an inspection that resolved to exactly one run.
pub(crate) fn with_attempt_view(
    root: &Path,
    mut inspected: Value,
    probe: &dyn Fn(&Path) -> Value,
) -> Value {
    let Some(run_id) = inspected
        .pointer("/runObservation/subject/runId")
        .and_then(Value::as_str)
        .map(str::to_owned)
    else {
        return inspected;
    };
    let locations: Vec<PathBuf> = inspected
        .pointer("/subject/locations")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|location| location.get("path").and_then(Value::as_str))
        .map(PathBuf::from)
        .collect();
    for location in locations {
        let Some(run) = read_json(&location.join("run.json")) else {
            continue;
        };
        if run.get("runId").and_then(Value::as_str) == Some(run_id.as_str()) {
            let view = read_attempt_view(&location, &fgos_dir(root), probe);
            if let Value::Object(fields) = &mut inspected {
                fields.extend(view);
            }
            return inspected;
        }
    }
    inspected
}

/// The host's one `metrics query --def` call over the shipped attention definitions, read from the running
/// payload. A payload without them, or a query that fails, degrades to one `unmeasured` entry.
fn attention_definitions(store_root: &Path) -> Definitions {
    let unmeasured = |reason: String| json!({ "definitions": [{ "name": ATTENTION_DEFINITIONS, "unmeasured": reason }] });
    let payload = crate::active_payload_root().ok();
    let dir = payload
        .map(|root| root.join(ATTENTION_DEFINITIONS))
        .filter(|dir| dir.exists());
    let Some(dir) = dir else {
        let shown = crate::active_payload_root()
            .map(|root| root.join(ATTENTION_DEFINITIONS).display().to_string())
            .unwrap_or_else(|_| ATTENTION_DEFINITIONS.to_owned());
        return Box::new(move |_, _| unmeasured(format!("definitions-missing: {shown}")));
    };
    let store_root = store_root.to_path_buf();
    Box::new(move |since, now| {
        let request = ObserveRequest {
            operation: "observe.metrics".into(),
            sub: "query".into(),
            args: vec![
                "--def".into(),
                dir.to_string_lossy().into_owned(),
                "--since".into(),
                since.into(),
                "--now".into(),
                now.into(),
            ],
            root: store_root.clone(),
            stdin: None,
        };
        let environment = HostRecordEnvironment {
            payload_root: crate::active_payload_root,
        };
        fgos_observe::metrics_cli::query::dispatch_query(&request, &environment)
            .unwrap_or_else(|error| unmeasured(format!("host-query-failed: {error}")))
    })
}

/// The text form of `--attention`: one line per run that needs a person, then one line for the terminal part
/// unless it scanned clean.
fn attention_text(data: &Value) -> String {
    let mut lines: Vec<String> = data
        .get("lines")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|line| {
            line.as_str()
                .map_or_else(|| line.to_string(), str::to_owned)
        })
        .collect();
    let terminal = data.get("terminal").filter(|t| !t.is_null());
    if let Some(terminal) = terminal {
        let state = terminal.get("state").and_then(Value::as_str);
        let findings = terminal
            .get("findings")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        if state == Some("scanned") {
            if !findings.is_empty() {
                let texts: Vec<String> = findings
                    .iter()
                    .map(|f| {
                        f.get("text")
                            .and_then(Value::as_str)
                            .unwrap_or_default()
                            .to_owned()
                    })
                    .collect();
                lines.push(format!("terminal scanned: {}", texts.join("; ")));
            }
        } else {
            let text = |key: &str| {
                terminal
                    .get(key)
                    .map(|v| v.as_str().map_or_else(|| v.to_string(), str::to_owned))
                    .unwrap_or_else(|| "undefined".to_owned())
            };
            lines.push(format!("terminal {}: {}", text("state"), text("reason")));
        }
    }
    if lines.is_empty() {
        String::new()
    } else {
        format!("{}\n", lines.join("\n"))
    }
}

/// The attention view of the project the root belongs to (every worktree shares the main checkout's store), with
/// the terminal allocations beside it.
pub(crate) fn attention_at(
    store_root: &Path,
    since: &str,
    now: &dyn Fn() -> String,
    probe: &dyn Fn(&Path) -> Value,
    definitions: Option<DefinitionsReader<'_>>,
    cache: &mut RunsCache,
) -> Result<Map<String, Value>, String> {
    let fgos = fgos_dir(store_root);
    let view = |run_dir: &Path| Value::Object(read_attempt_view(run_dir, &fgos, probe));
    let outcome_of = |result: &Value| outcome_of_run_result(result).to_owned();
    let readers = AttentionReaders {
        now,
        outcome_of: &outcome_of,
        view: &view,
        definitions,
    };
    match attention_view(store_root, since, &readers, Some(cache))? {
        Value::Object(fields) => Ok(fields),
        other => Ok(Map::from_iter([("view".to_owned(), other)])),
    }
}

pub(crate) fn inspect(request: &SubRequest, flags: &Flags) -> Answered {
    let attention = flags.switch("attention");
    let terminal = flags.switch("terminal");
    let capacity = flags.switch("provider-capacity");
    if attention && (terminal || capacity) {
        return Err(validation(format!(
            "dispatch inspect --attention cannot be combined with {}; run each view on its own",
            if terminal {
                "--terminal"
            } else {
                "--provider-capacity"
            }
        )));
    }
    if capacity {
        return provider_capacity().map(Answer::Json);
    }
    let root = request.root.as_path();
    if terminal {
        return Ok(Answer::Json(scan_terminal_allocations(root)));
    }
    let options = InspectionOptions {
        run: flags.text("run"),
        assignment: flags.text("assignment"),
        cwd: flags.text("cwd"),
        attention,
        since: flags.text("since"),
    };
    validate_inspection_selector(&options).map_err(validation)?;
    let mut cache = RunsCache::default();
    if attention {
        let workspace = HostWorkspace {
            process_cwd: request.process_cwd.clone(),
        };
        let store_root = workspace
            .main_checkout_root(&root.to_string_lossy())
            .map_or_else(|| root.to_path_buf(), PathBuf::from);
        let definitions = attention_definitions(&store_root);
        let mut data = attention_at(
            &store_root,
            options.since.as_deref().unwrap_or_default(),
            &now_iso,
            &probe_attempt,
            Some(&*definitions),
            &mut cache,
        )
        .map_err(validation)?;
        data.insert("terminal".into(), scan_terminal_allocations(&store_root));
        let data = Value::Object(data);
        if request.json {
            return Ok(Answer::Json(data));
        }
        let text = attention_text(&data);
        return Ok(Answer::Verb(VerbAnswer {
            data,
            exit: 0,
            text: Some(text),
        }));
    }
    let inspected = inspect_dispatch_runtime(root, &options, &now_iso, false, Some(&mut cache))
        .map_err(validation)?;
    Ok(Answer::Json(with_attempt_view(
        root,
        inspected,
        &probe_attempt,
    )))
}
