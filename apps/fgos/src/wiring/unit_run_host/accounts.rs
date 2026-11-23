//! The provider accounts a unit run binds and leases from: the bind over the live lease state, the pinned accounts
//! a run may not start on, the rotation a failed seat may take, and the lease receipt audit. The rules are the
//! accounts module's and the bind facade's; the machine (PATH, herdr, the home directory) is the seat-binding
//! route's [`HostMachine`], so a run binds exactly as `fgos internal seat-binding` does.

use std::cell::RefCell;
use std::path::{Path, PathBuf};

use fgos_execution::accounts::provider_account_inventory;
use fgos_execution::bind::BindSession;
use fgos_execution_engine::accounts::pin::{assert_pinned_accounts_usable, AccountPin};
use fgos_execution_engine::accounts::rotation::{inspect_account_rotation, Rotation};
use fgos_execution_engine::accounts::{Accounts, SystemHost};
use fgos_execution_engine::unit_run::host::{AccountRead, BoundSeat};
use fgos_execution_engine::planning::bind_facade::{
    bind as facade_bind, preflight_of, AccountStateSource, BindContext, PreflightRequest,
};
use fgos_execution_engine::unit_run::run_unit_contract::{ErrorTag, RunUnitError};
use serde_json::{json, Value};

use crate::wiring::seat_binding::HostMachine;

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as u64)
}

/// The account store of this machine (`providerCapacityStatePaths(runtimeDir)`): `runtime_dir` when the caller
/// names one, else the global directory's.
fn accounts_at<'h>(
    runtime_dir: Option<&Path>,
    host: &'h SystemHost,
) -> Result<Accounts<'h>, String> {
    match runtime_dir {
        Some(dir) => Ok(Accounts::new(dir, fgos_holder_lock::lock_root(), host)),
        None => Accounts::from_environment(host).map_err(|e| e.to_string()),
    }
}

/// The lease state Seat Binding overlays on the declared accounts (`readAccountStateOverlay`,
/// `src/runner/dispatch/provider-capacity.mjs`), read outside the state lock for one bind.
pub struct LeaseOverlay<'a, 'h> {
    pub accounts: &'a Accounts<'h>,
    pub assignment_id: Option<String>,
}

impl AccountStateSource for LeaseOverlay<'_, '_> {
    fn overlay(&self, now_ms: u64) -> Value {
        Value::Object(self.accounts.read_account_state_overlay(
            self.assignment_id.as_deref(),
            now_ms as i64,
            None,
        ))
    }
}

/// The session a bind runs in and the machine it reads, from the `{ headless, hasNativeAgent, postureAtLaunch,
/// pathEnv, herdrPresent }` the run states (the seat-binding route reads the same fields).
fn session_and_machine(session: &Value) -> (BindSession, HostMachine) {
    let flag = |key: &str| session.get(key) == Some(&Value::Bool(true));
    let bind = BindSession {
        headless: flag("headless"),
        has_native_agent: flag("hasNativeAgent"),
        posture_at_launch: flag("postureAtLaunch"),
    };
    let machine = HostMachine::new(
        session.get("pathEnv").and_then(Value::as_str),
        session.get("herdrPresent").and_then(Value::as_bool),
    );
    (bind, machine)
}

/// A refusal of the bind facade under the class Node callers catch.
fn bind_refusal(name: &str, code: Option<&str>, message: &str) -> RunUnitError {
    let mut error = RunUnitError::config(message, code, None);
    error.tag = ErrorTag::parse(name).unwrap_or(ErrorTag::Error);
    if error.tag == ErrorTag::Error {
        error.error_class = "error".into();
        error = error.with("name", json!(name));
    }
    error
}

/// `bind(ask, ctx, { walk })` (`src/runner/execution/bind.mjs:91`): the binding of one seat, or `{ refused }`, over
/// the live lease state when `accounts` (`{ runtimeDir, assignmentId }`) is given, else from the config alone.
pub fn bind(
    ask: &Value,
    runner: &Value,
    session: &Value,
    accounts: &Value,
    walk: &Value,
) -> Result<BoundSeat, RunUnitError> {
    let (session, machine) = session_and_machine(session);
    let host = SystemHost::new();
    let store = if accounts.is_object() {
        let dir = accounts
            .get("runtimeDir")
            .and_then(Value::as_str)
            .map(PathBuf::from);
        Some(accounts_at(dir.as_deref(), &host).map_err(|e| RunUnitError::config(e, None, None))?)
    } else {
        None
    };
    let overlay = store.as_ref().map(|accounts_store| RecordingOverlay {
        lease: LeaseOverlay {
            accounts: accounts_store,
            assignment_id: accounts
                .get("assignmentId")
                .and_then(Value::as_str)
                .map(str::to_string),
        },
        read: RefCell::new(None),
    });
    let ctx = BindContext {
        runner_config: runner,
        session,
        machine: &machine,
        accounts: overlay.as_ref().map(|o| o as &dyn AccountStateSource),
    };
    let binding = facade_bind(ask, &ctx, walk, false, now_ms())
        .map_err(|e| bind_refusal(&e.name, e.code.as_deref(), &e.message))?;
    let account_read = overlay.and_then(|o| o.read.into_inner());
    Ok(BoundSeat {
        binding,
        account_read,
    })
}

/// The lease overlay of one bind, keeping what it read and when, so the run can record the bind's account input
/// without reading the lease state a second time.
struct RecordingOverlay<'a, 'h> {
    lease: LeaseOverlay<'a, 'h>,
    read: RefCell<Option<AccountRead>>,
}

impl AccountStateSource for RecordingOverlay<'_, '_> {
    fn overlay(&self, now_ms: u64) -> Value {
        let overlay = self.lease.overlay(now_ms);
        *self.read.borrow_mut() = Some(AccountRead {
            at: now_ms,
            overlay: overlay.clone(),
        });
        overlay
    }
}

/// `assertPinnedAccountsUsable` (`src/runner/execution/account-pin.mjs:44`): refuse a seat pinned to an account
/// Seat Binding's account view holds quarantined now, naming until when it waits. `runtime_dir` is the account store
/// the caller names (`providerCapacityRuntimeDir`), else the machine's.
pub fn pinned_accounts_usable(
    seats: &[Value],
    runner: &Value,
    what: &str,
    runtime_dir: Option<&Path>,
) -> Result<(), RunUnitError> {
    let pins: Vec<AccountPin> = seats
        .iter()
        .filter_map(|seat| seat.get("account").filter(|a| a.is_object()))
        .map(|account| {
            let text = |key: &str| {
                account
                    .get(key)
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_string()
            };
            AccountPin {
                pool: text("pool"),
                id: text("id"),
            }
        })
        .collect();
    if pins.is_empty() {
        return Ok(());
    }
    let host = SystemHost::new();
    let store = accounts_at(runtime_dir, &host).map_err(|e| RunUnitError::config(e, None, None))?;
    let overlay = LeaseOverlay {
        accounts: &store,
        assignment_id: None,
    };
    let machine = HostMachine::new(None, None);
    let now = now_ms();
    let quarantined_until = |pin: &AccountPin| {
        preflight_of(
            &PreflightRequest {
                runner_config: runner,
                session: BindSession::default(),
                pin: Some(fgos_execution::bind::AccountPin {
                    pool: pin.pool.clone(),
                    id: pin.id.clone(),
                }),
                accounts: Some(&overlay),
            },
            &machine,
            now,
        )
        .pin_quarantined_until
        .map(|until| until.min(i64::MAX as u64) as i64)
    };
    assert_pinned_accounts_usable(&pins, what, &quarantined_until)
        .map_err(|message| RunUnitError::config(message, None, None))
}

/// `inspectAccountRotation` (`src/runner/execution/account-rotation.mjs:21`): what rotation in `pool` has to work
/// with, from the inventory the runner config declares and the live account state; `None` when the pool has no
/// enabled account or the state cannot be read.
pub fn account_rotation(
    runner: &Value,
    pool: &str,
    runtime_dir: Option<&Path>,
) -> Option<Rotation> {
    let host = SystemHost::new();
    let store = match accounts_at(runtime_dir, &host) {
        Ok(store) => store,
        Err(why) => {
            eprintln!("fgos: could not read the account state of pool {pool}, so no account rotation: {why}");
            return None;
        }
    };
    let inventory = provider_account_inventory(runner, &HostMachine::new(None, None));
    inspect_account_rotation(&store, &inventory, pool)
}

/// `auditLeaseReceipt(receipt, { assignmentId })` (`src/runner/dispatch/provider-capacity.mjs:574`): why the
/// receipt an attempt left differs from the provider record's lease, or `None` when they agree.
pub fn audit_lease_receipt(
    receipt: Option<&Value>,
    assignment_id: &str,
    runtime_dir: Option<&Path>,
) -> Option<String> {
    let host = SystemHost::new();
    accounts_at(runtime_dir, &host)
        .ok()?
        .audit_lease_receipt(receipt, assignment_id)
}

/// `dropAssignmentRecord({ assignmentId })` (`src/runner/dispatch/provider-capacity.mjs:605`): forget which account
/// the assignment held, once its outcome is recorded. Best effort, as the run calls it.
pub fn drop_assignment_record(assignment_id: &str, runtime_dir: Option<&Path>) {
    let host = SystemHost::new();
    if let Ok(store) = accounts_at(runtime_dir, &host) {
        let _ = store.drop_assignment_record(assignment_id);
    }
}

/// `runnerConfigForBinding` (`src/runner/execution/account-pin.mjs:33`): a binding pinned to an account leases from
/// an inventory holding only that account.
pub fn runner_config_for_binding(runner: &Value, bound: &Value) -> Value {
    fgos_execution_engine::accounts::pin::runner_config_for_binding(runner, bound)
}

/// The modes a caller may pin an account in (`ACCOUNT_PIN_MODES`, `src/runner/execution/unit-run-start.mjs:207`).
const ACCOUNT_PIN_MODES: [&str; 2] = ["strict", "where-served"];

fn pre_admission(message: String, code: Option<&str>) -> RunUnitError {
    RunUnitError::config(message, code, Some("pre-admission"))
}

/// `assertDoorChoicesBeforeRun` (`src/runner/execution/unit-run-start.mjs:216`): refuse, before a unit run exists, a
/// machine on which no agent CLI can start, an unknown `accountPin` mode, a dependence or a raised tier the calling
/// door has no authority for, and a pinned account no seat takes (unless `accountPin` is `where-served`), that a
/// seat refuses, or that is quarantined now. The seats are bound dry, exactly as the run will bind them.
pub fn door_choices(
    unit: &Value,
    runner: &Value,
    options: &Value,
    collaboration: &Value,
) -> Result<(), RunUnitError> {
    let session = options.get("session").filter(|s| s.is_object());
    let (bind_session, machine) = session_and_machine(session.unwrap_or(&Value::Null));
    let now = now_ms();
    let preflight = preflight_of(
        &PreflightRequest {
            runner_config: runner,
            session: bind_session,
            pin: None,
            accounts: None,
        },
        &machine,
        now,
    );
    if let Some(missing) = preflight.agent_cli_missing {
        return Err(pre_admission(
            format!("{}: {}; {}", missing.reason, missing.detail, missing.fix),
            Some(missing.reason),
        ));
    }
    if let Some(mode) = options.get("accountPin").filter(|m| !m.is_null()) {
        if !mode
            .as_str()
            .is_some_and(|m| ACCOUNT_PIN_MODES.contains(&m))
        {
            return Err(pre_admission(
                format!(
                    "accountPin must be one of {}, got {mode}",
                    ACCOUNT_PIN_MODES.join(", ")
                ),
                None,
            ));
        }
    }
    let raise_authorized = options.get("raiseAuthorized") == Some(&Value::Bool(true));
    let overrides: Vec<Value> = options
        .get("overrides")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let objects: Vec<&Value> = overrides.iter().filter(|o| o.is_object()).collect();
    if !raise_authorized
        && objects
            .iter()
            .any(|o| o.get("acceptDependence") == Some(&Value::Bool(true)))
    {
        return Err(pre_admission(
            "dependence-acceptance-unauthorized: accepting a dependence between seats needs an authorized door; no door of this release is authorized, so every seat keeps the independence its pattern asks for".into(),
            Some("dependence-acceptance-unauthorized"),
        ));
    }
    let names = |key: &str| objects.iter().any(|o| o.get(key).is_some());
    let pins_account = names("account");
    if !pins_account && !names("tier") && !names("persona") {
        return Ok(());
    }
    // The dry bind runs headless in this machine's herdr unless the caller's session says otherwise.
    let mut dry_session = serde_json::Map::new();
    dry_session.insert("headless".into(), json!(true));
    dry_session.insert(
        "herdrPresent".into(),
        json!(super::machine::herdr_present()),
    );
    if let Some(stated) = session.and_then(Value::as_object) {
        dry_session.extend(stated.clone());
    }
    let (dry_bind_session, dry_machine) = session_and_machine(&Value::Object(dry_session));
    let effective = collaboration
        .pointer("/pin/effective")
        .or_else(|| collaboration.get("effective"))
        .filter(|e| !e.is_null())
        .unwrap_or(collaboration);
    let workflow_id = options.get("workflowId").and_then(Value::as_str);
    let simulated = fgos_execution_engine::planning::bind_facade::simulate_unit_bindings(
        unit,
        runner,
        effective,
        &fgos_execution_engine::planning::bind_facade::DryBindOptions {
            session: Some(dry_bind_session),
            overrides,
            raise_authorized,
            workflow_id,
        },
        &dry_machine,
        now,
    )
    .map_err(|e| bind_refusal(&e.name, e.code.as_deref(), &e.message))?;
    let seats: Vec<Value> = simulated
        .get("seats")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let refused_for = |prefix: &str| {
        seats.iter().find(|s| {
            s.pointer("/refused/reason")
                .and_then(Value::as_str)
                .is_some_and(|r| r.starts_with(prefix))
        })
    };
    let text = |v: &Value, pointer: &str| {
        v.pointer(pointer)
            .and_then(Value::as_str)
            .unwrap_or("undefined")
            .to_string()
    };
    if let Some(seat) = seats.iter().find(|s| {
        s.pointer("/refused/reason").and_then(Value::as_str) == Some("tier-escalation-unauthorized")
    }) {
        return Err(pre_admission(
            format!(
                "tier-escalation-unauthorized: {}",
                text(seat, "/refused/detail")
            ),
            Some("tier-escalation-unauthorized"),
        ));
    }
    if !pins_account {
        return Ok(());
    }
    if let Some(seat) = refused_for("account-pin") {
        return Err(RunUnitError::config(
            format!(
                "cannot pin the account for seat \"{}\": {}",
                text(seat, "/seat"),
                text(seat, "/refused/detail")
            ),
            None,
            None,
        ));
    }
    if !seats
        .iter()
        .any(|s| s.get("account").is_some_and(|a| !a.is_null()))
    {
        if options.get("accountPin").and_then(Value::as_str) == Some("where-served") {
            return Ok(());
        }
        let why: Vec<String> = seats
            .iter()
            .filter(|s| s.get("accountSkipped").is_some_and(|a| !a.is_null()))
            .map(|s| {
                format!(
                    "seat \"{}\": {}",
                    text(s, "/seat"),
                    text(s, "/accountSkipped/detail")
                )
            })
            .collect();
        let tail = if why.is_empty() {
            ": no seat its override names binds here".to_string()
        } else {
            format!(" ({})", why.join("; "))
        };
        return Err(RunUnitError::config(
            format!("the pinned account applies to no seat of this unit{tail}"),
            None,
            None,
        ));
    }
    let runtime_dir = options
        .get("providerCapacityRuntimeDir")
        .and_then(Value::as_str)
        .map(Path::new);
    pinned_accounts_usable(&seats, runner, "cannot start the unit run", runtime_dir)
}
