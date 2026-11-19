//! The one attempt a controller launches: what it owns until the handover (the attempt locks, the pane of a
//! terminal attempt, the provider lease, its run control) and how far it got, and giving it back.

use std::path::{Path, PathBuf};

use fgos_run_supervisor::controller::cwd_lock::record_custody_handoff;
use fgos_run_supervisor::controller::launch::{
    remove_attempt_intent, write_attempt_intent, AttemptHost, AttemptLocks, IntentInput,
};
use fgos_run_supervisor::controller::lease::{is_run_control_current, release_run_control};
use serde_json::{json, Map, Value};

use crate::accounts::{AccountLease, Accounts};
use crate::confinement::cleanup::CREDENTIAL_HOME_KEPT;
use crate::run_result::reader::read_settled_result;

/// This controller's run control `{ controlEpoch, controlToken }`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Control {
    pub epoch: u64,
    pub token: String,
}

/// What the launch of an attempt made before the handover and still owes a give-back (the pane a terminal
/// attempt opened).
pub trait TerminalPrep {
    /// Give back the pane and what was seeded for it.
    fn abandon(&self);
}

/// The attempt a controller launches.
pub struct Attempt {
    /// A session attempt (a head session) has no result and no run control; its steps carry no settle step.
    pub session: bool,
    pub run_dir: PathBuf,
    pub run_id: String,
    pub attempt_id: String,
    pub unit_run_id: String,
    pub terminal: bool,
    pub cwd: String,
    /// `None` for a resumed attempt: its envelope is judged by the adopt door and never launched again.
    pub host: Option<AttemptHost>,
    pub step_env: Map<String, Value>,
    /// The caller's custody of the cwd lease: it keeps the lease across attempts and commit.
    pub custody: bool,
    pub lease_runtime_dir: Option<PathBuf>,
    pub locks: Option<AttemptLocks>,
    /// The provider account lease, when one was selected.
    pub lease: Option<Value>,
    /// Set once a terminal attempt has its pane; until the handover it is this controller's to give back.
    pub terminal_prep: Option<Box<dyn TerminalPrep>>,
    pub control: Option<Control>,
    pub intent_written: bool,
    pub intent_names_pane: bool,
    /// Set once the supervisor owns the attempt: from then on the run control token belongs to its settle step and
    /// this controller no longer releases it unless it saw the result.
    pub handed_over: bool,
    pub settled: bool,
    pub result: Option<Value>,
}

/// What opening an attempt is given.
pub struct OpenAttempt {
    pub run_dir: PathBuf,
    pub run_id: String,
    pub attempt_id: String,
    pub unit_run_id: String,
    pub terminal: bool,
    pub cwd: String,
    pub host: Option<AttemptHost>,
    pub step_env: Map<String, Value>,
    pub custody: bool,
    pub lease_runtime_dir: Option<PathBuf>,
    pub session: bool,
}

/// A fresh attempt: nothing locked, leased or published yet.
pub fn open_attempt(open: OpenAttempt) -> Attempt {
    Attempt {
        session: open.session,
        run_dir: open.run_dir,
        run_id: open.run_id,
        attempt_id: open.attempt_id,
        unit_run_id: open.unit_run_id,
        terminal: open.terminal,
        cwd: open.cwd,
        host: open.host,
        step_env: open.step_env,
        custody: open.custody,
        lease_runtime_dir: open.lease_runtime_dir,
        locks: None,
        lease: None,
        terminal_prep: None,
        control: None,
        intent_written: false,
        intent_names_pane: false,
        handed_over: false,
        settled: false,
        result: None,
    }
}

fn absolute(path: &Path) -> PathBuf {
    std::path::absolute(path).unwrap_or_else(|_| path.to_path_buf())
}

/// The attempt intent, only ever under the attempt lock; a terminal attempt publishes it again with its pane
/// before allocating it.
pub fn publish_attempt_intent(attempt: &mut Attempt, pane: Option<&Value>) -> std::io::Result<()> {
    let host = attempt
        .host
        .as_ref()
        .ok_or_else(|| std::io::Error::other("an attempt with no host has no intent to publish"))?;
    write_attempt_intent(&IntentInput {
        run_dir: &absolute(&attempt.run_dir),
        attempt_id: &attempt.attempt_id,
        unit_run_id: &attempt.unit_run_id,
        terminal: attempt.terminal,
        cwd: &attempt.cwd,
        host,
        step_env: &attempt.step_env,
        pane,
        session: attempt.session,
    })?;
    attempt.intent_written = true;
    attempt.intent_names_pane = pane.is_some();
    Ok(())
}

/// Where the attempt's private homes are given back and where its leased account is released. The real ports sit
/// on the finalize-home step and the accounts; a test keeps both in memory.
pub trait GiveBack {
    /// Give back the private homes of an attempt that never reached its supervisor, through the door the
    /// finalize-home step uses. `false` when a home stays for a retry or cannot be judged: the intent then stays,
    /// so the adopt door's finalize-home step retries it.
    fn give_back_attempt_home(&self, run_dir: &Path, attempt_id: &str) -> bool;
    /// Release the provider account lease a Run selected. A failure is reported and never thrown: the caller is
    /// already settling or refusing, its own outcome must not be replaced.
    fn release_provider_lease(&self, selection: &Value, run_id: &str, runtime_dir: Option<&Path>);
}

/// The real give-back: the finalize-home step and the accounts of the machine.
pub struct MachineGiveBack<'a, W: crate::confinement::cleanup::CredentialWriteBack> {
    pub stage: &'a W,
    pub accounts_at: &'a dyn Fn(Option<&Path>) -> Option<Accounts<'a>>,
    pub now_ms: &'a dyn Fn() -> i64,
}

impl<W: crate::confinement::cleanup::CredentialWriteBack> GiveBack for MachineGiveBack<'_, W> {
    fn give_back_attempt_home(&self, run_dir: &Path, attempt_id: &str) -> bool {
        match crate::confinement::request::finalize_attempt_home(
            &absolute(run_dir),
            attempt_id,
            self.stage,
            (self.now_ms)(),
        ) {
            Ok(finalized) => finalized.state != CREDENTIAL_HOME_KEPT,
            Err(error) => {
                eprintln!("fgos: private home of attempt {attempt_id} not given back ({error})");
                false
            }
        }
    }

    fn release_provider_lease(&self, selection: &Value, run_id: &str, runtime_dir: Option<&Path>) {
        let provider = selection
            .get("provider")
            .and_then(Value::as_str)
            .unwrap_or_default();
        let account = selection
            .get("accountId")
            .and_then(Value::as_str)
            .unwrap_or_default();
        let released = (self.accounts_at)(runtime_dir)
            .map(|accounts| accounts.release_account_lease(provider, account, run_id));
        if let Some(Err(error)) = released {
            eprintln!("fgos: could not release the provider lease of {provider}/{account} for {run_id}: {error}");
        }
    }
}

/// Give back what the attempt still owns, whatever ended it. One order rule: what the launch made before the
/// handover (the pane, the private home) is given back first, still under the attempt lock, and only then may the
/// intent go; a controller killed in between leaves the intent, and the adopt door closes the attempt from it. A
/// supervised attempt that never produced its result is still the supervisor's (and, after it, the adopt door's):
/// its run control token and lease stay, the settle step and the lease reclaim use them.
pub fn close_attempt(attempt: &mut Attempt, give_back: &dyn GiveBack) {
    let run_dir = attempt.run_dir.clone();
    let run_id = attempt.run_id.clone();
    let mut home_given_back = true;
    if !attempt.handed_over {
        if let Some(prep) = attempt.terminal_prep.take() {
            prep.abandon();
        }
        if attempt.locks.is_some() {
            home_given_back = give_back.give_back_attempt_home(&run_dir, &attempt.attempt_id);
        }
    }
    if attempt.locks.is_some() {
        // The pane was given back above (or never opened): an intent that still named it would have adopt wait for
        // a slot terminal-control may never have recorded.
        if attempt.intent_names_pane && !attempt.handed_over {
            if let Err(error) = publish_attempt_intent(attempt, None) {
                eprintln!("fgos: attempt intent not replaced ({error})");
            }
        }
        // A run that settled without ever writing an envelope (refused, or already answered) has nothing for the
        // adopt door to close, unless a private home of it is still kept.
        if home_given_back
            && attempt.intent_written
            && !run_dir.join("envelope.json").exists()
            && read_settled_result(&run_dir, &run_id).is_some()
        {
            remove_attempt_intent(&absolute(&run_dir));
        }
        if !attempt.custody && attempt.settled {
            let warning =
                record_custody_handoff(attempt.locks.as_ref().and_then(|l| l.cwd_lease.as_ref()));
            if let (Some(warning), Some(result)) = (warning, attempt.result.as_mut()) {
                result["warnings"] = match result.get("warnings").and_then(Value::as_array) {
                    Some(existing) => {
                        let mut all = existing.clone();
                        all.push(warning);
                        json!(all)
                    }
                    None => json!([warning]),
                };
            }
        }
        if let Some(locks) = attempt.locks.as_mut() {
            locks.release();
        }
    }
    // Before the run control was taken the run was refused, settled or judged by the adopt door, which gave back
    // what they took.
    if let Some(control) = &attempt.control {
        let owns_release = !attempt.handed_over || attempt.settled;
        if owns_release {
            if let Some(selection) = attempt
                .lease
                .as_ref()
                .filter(|l| l.get("status").and_then(Value::as_str) == Some("selected"))
            {
                give_back.release_provider_lease(
                    selection,
                    &run_id,
                    attempt.lease_runtime_dir.as_deref(),
                );
            }
            let _ = release_run_control(&run_dir, control.epoch, &control.token, None);
        }
    }
}

/// Whether this controller's run control is still the current one of the run.
pub fn control_is_current(attempt: &Attempt) -> bool {
    attempt.control.as_ref().is_some_and(|c| {
        is_run_control_current(&attempt.run_dir, c.epoch, &c.token).unwrap_or(false)
    })
}

/// The `AccountLease` a selection granted, for a caller that releases it through the accounts.
pub fn account_lease_of(selection: &Value) -> Option<AccountLease> {
    AccountLease::from_selection(selection)
}
