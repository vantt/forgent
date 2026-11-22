//! `dispatch reconcile`: plan one narrow guard or projection repair and apply a plan it returned, through the
//! engine's reconciliation planner, and set or clear an account's quarantine through the engine's provider-capacity
//! state. It never recovers, launches, signals or controls a Run.

use super::{validation, Answer, Answered, Flags, SubRequest};
use fgos_execution::run_request::resolve_path;
use fgos_execution_engine::accounts::{Accounts, AccountsError, QuarantineSet, SystemHost};
use fgos_execution_engine::planning::reconciliation::{
    apply_reconciliation, plan_reconciliation, ApplyGuard, ApplyLock, PlanRequest, RuntimeView,
    RECONCILE_RUN_REQUIRES_ACTION,
};
use fgos_execution_engine::transport_round::inspection::{
    inspect_dispatch_runtime, InspectionOptions,
};
use fgos_holder_lock::{LockScope, Wait};
use fgos_host_runtime::civil_time::{
    format_unix_millis_rfc3339, parse_date_midnight_millis, parse_rfc3339_millis,
};
use fgos_host_runtime::CategorisedRefusal;
use serde_json::{json, Map, Value};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

fn now_iso() -> String {
    fgos_identity::text::iso_utc_now()
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as i64)
}

/// The `--run` and `--assignment` inspections the planner reads, read fresh each time.
pub(crate) struct HostRuntimeView;

impl HostRuntimeView {
    fn inspect(root: &Path, options: InspectionOptions) -> Result<Value, String> {
        inspect_dispatch_runtime(root, &options, &now_iso, true, None)
    }
}

impl RuntimeView for HostRuntimeView {
    fn inspect_run(&self, root: &Path, run_id: &str) -> Result<Value, String> {
        Self::inspect(
            root,
            InspectionOptions {
                run: Some(run_id.to_owned()),
                ..InspectionOptions::default()
            },
        )
    }

    fn inspect_assignment(&self, root: &Path, assignment_id: &str) -> Result<Value, String> {
        Self::inspect(
            root,
            InspectionOptions {
                assignment: Some(assignment_id.to_owned()),
                ..InspectionOptions::default()
            },
        )
    }
}

/// The repo's reconcile mutex (`<fgosDir>/locks/reconcile.lock`), one try.
pub(crate) struct ReconcileLock;

struct Held(#[allow(dead_code)] LockScope<'static>);
impl ApplyGuard for Held {}

impl ApplyLock for ReconcileLock {
    fn try_acquire(&self, fgos_dir: &Path) -> Option<Box<dyn ApplyGuard>> {
        let params = BTreeMap::from([(
            "fgosDir".to_owned(),
            fgos_dir.to_string_lossy().into_owned(),
        )]);
        let mut scope = LockScope::seeded(Vec::new()).ok()?;
        scope.acquire("reconcile", &params, Wait::Ms(0)).ok()?;
        Some(Box::new(Held(scope)))
    }
}

fn machine_inventory() -> Result<Map<String, Value>, CategorisedRefusal> {
    let runner = crate::wiring::doctor::confinement::machine_runner().map_err(validation)?;
    Ok(fgos_execution::accounts::provider_account_inventory(
        &runner,
        &crate::wiring::seat_binding::HostMachine::new(None, None),
    ))
}

fn accounts_error(error: AccountsError) -> CategorisedRefusal {
    validation(error.to_string())
}

/// `new Date(text)` for the forms an operator writes: an RFC 3339 date-time or a bare date (midnight UTC).
fn parse_instant(text: &str) -> Option<i64> {
    parse_rfc3339_millis(text).or_else(|| parse_date_midnight_millis(text))
}

fn quarantine(flags: &Flags) -> Answered {
    let provider = flags.text("provider").filter(|v| !v.is_empty());
    let account = flags.text("account").filter(|v| !v.is_empty());
    let reason = flags.text("reason").filter(|v| !v.is_empty());
    let Some(provider) = provider else {
        return Err(validation(
            "provider-capacity quarantine requires --provider",
        ));
    };
    let Some(account) = account else {
        return Err(validation(
            "provider-capacity quarantine requires --account",
        ));
    };
    let Some(reason) = reason else {
        return Err(validation("provider-capacity quarantine requires --reason"));
    };
    let until_text = flags.text("until").unwrap_or_default();
    let Some(until_ms) = parse_instant(&until_text).filter(|_| !until_text.is_empty()) else {
        return Err(validation(
            "provider-capacity quarantine requires --until as an ISO date-time",
        ));
    };
    let refuse = |code: &str, detail: String| {
        Ok(Answer::Json(json!({
            "contract": "provider-capacity.quarantine.v1",
            "status": "refused",
            "provider": provider,
            "accountId": account,
            "reasonCode": code,
            "detail": detail,
        })))
    };
    if until_ms <= now_ms() {
        return refuse(
            "until-in-past",
            format!("--until {until_text} is not in the future"),
        );
    }
    let inventory = machine_inventory()?;
    if inventory
        .get(&provider)
        .and_then(|p| p.get("accounts"))
        .and_then(|a| a.get(&account))
        .is_none()
    {
        return refuse(
            "unknown-account",
            format!("unknown provider/account {provider}/{account}"),
        );
    }
    let until = format_unix_millis_rfc3339(until_ms, 0).unwrap_or(until_text);
    let host = SystemHost::new();
    let accounts = Accounts::from_environment(&host).map_err(accounts_error)?;
    let set = accounts
        .quarantine_account(&QuarantineSet {
            provider: &provider,
            account_id: &account,
            reason_code: "quota-limit",
            kind: "temporary",
            until: Some(&until),
            reset_known: None,
            detail: Some(json!({
                "kind": "owner",
                "reason": reason,
                "caller": "fgos dispatch reconcile provider-capacity quarantine",
            })),
        })
        .map_err(accounts_error)?;
    Ok(Answer::Json(json!({
        "contract": "provider-capacity.quarantine.v1",
        "status": "quarantined",
        "provider": provider,
        "accountId": account,
        "quarantine": set,
    })))
}

fn clear_quarantine(flags: &Flags) -> Answered {
    let provider = flags.text("provider").filter(|v| !v.is_empty());
    let account = flags.text("account").filter(|v| !v.is_empty());
    let reason = flags.text("reason").filter(|v| !v.is_empty());
    let Some(provider) = provider else {
        return Err(validation(
            "provider-capacity clear-quarantine requires --provider",
        ));
    };
    let Some(account) = account else {
        return Err(validation(
            "provider-capacity clear-quarantine requires --account",
        ));
    };
    let Some(reason) = reason else {
        return Err(validation(
            "provider-capacity clear-quarantine requires --reason",
        ));
    };
    let inventory = machine_inventory()?;
    let host = SystemHost::new();
    let accounts = Accounts::from_environment(&host).map_err(accounts_error)?;
    match accounts.clear_account_quarantine(
        &inventory,
        &provider,
        &account,
        Some(&reason),
        flags.switch("force"),
        Some("fgos dispatch reconcile provider-capacity clear-quarantine"),
    ) {
        Ok(record) => Ok(Answer::Json(record)),
        Err(AccountsError::Config { message, .. }) => {
            let code = if message.contains("unknown provider/account") {
                "unknown-account"
            } else if message.contains("not quarantined") {
                "not-quarantined"
            } else {
                "validation"
            };
            Ok(Answer::Json(json!({
                "contract": "provider-capacity.clear-quarantine.v1",
                "status": "refused",
                "provider": provider,
                "accountId": account,
                "reasonCode": code,
                "detail": message,
            })))
        }
        Err(other) => Err(accounts_error(other)),
    }
}

/// `reconcile plan`: one repair planned against the facts as they are now.
pub(crate) fn plan_at(
    root: &Path,
    action: Option<&str>,
    run_id: Option<&str>,
    cwd: &Path,
    now: &str,
) -> Answered {
    if run_id.is_some() && action.is_none_or(|a| a.is_empty() || a == "clear-cwd-lock") {
        return Err(validation(RECONCILE_RUN_REQUIRES_ACTION));
    }
    plan_reconciliation(
        &HostRuntimeView,
        root,
        &PlanRequest {
            action,
            run_id,
            cwd,
            now,
            ttl_ms: None,
        },
    )
    .map(Answer::Json)
    .map_err(|error| CategorisedRefusal::unexpected(error.message))
}

/// `reconcile apply --plan`: the plan re-derived and re-checked under the repo's reconcile mutex.
pub(crate) fn apply_at(root: &Path, plan: &Value, now: &str) -> Answered {
    apply_reconciliation(&HostRuntimeView, &ReconcileLock, root, plan, now)
        .map(Answer::Json)
        .map_err(|error| CategorisedRefusal::unexpected(error.message))
}

pub(crate) fn reconcile(request: &SubRequest, flags: &Flags) -> Answered {
    let mode = flags.positional(1);
    match (mode, flags.positional(2)) {
        (Some("provider-capacity"), Some("quarantine")) => return quarantine(flags),
        (Some("provider-capacity"), Some("clear-quarantine")) => return clear_quarantine(flags),
        _ => {}
    }
    match mode.unwrap_or("plan") {
        "plan" => {
            let run_id = flags.text("run").or_else(|| flags.text("run-id"));
            let cwd = flags.text("cwd").map_or_else(
                || request.process_cwd.clone(),
                |cwd| PathBuf::from(resolve_path(&request.process_cwd.to_string_lossy(), &cwd)),
            );
            plan_at(
                &request.root,
                flags.text("action").as_deref(),
                run_id.as_deref(),
                &cwd,
                &now_iso(),
            )
        }
        "apply" => {
            let Some(text) = flags.text("plan").filter(|text| !text.is_empty()) else {
                return Err(validation("dispatch reconcile apply --plan must be valid JSON: dispatch reconcile apply requires --plan"));
            };
            let plan: Value = serde_json::from_str(&text).map_err(|error| {
                validation(format!(
                    "dispatch reconcile apply --plan must be valid JSON: {error}"
                ))
            })?;
            apply_at(&request.root, &plan, &now_iso())
        }
        _ => Err(validation("dispatch reconcile expects plan or apply")),
    }
}
