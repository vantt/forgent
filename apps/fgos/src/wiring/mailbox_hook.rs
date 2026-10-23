//! `fgos hook mailbox --cli <claude|codex|pi|omp> --event <stop|post-tool-use>`:
//! the mailbox's checkpoint, served natively before the composition root
//! (the route table's `native_kinds` of `hook`). A thin, straight-line
//! wiring of the store's hook shell to the real process: no logic, and
//! exit 0 on every path, a usage error and a panic included (spec §6.1, §8
//! item 7: exit 2 from a `Stop` hook blocks the stop in Claude Code), with
//! nothing on stdout or stderr unless frames are delivered. A call that
//! skipped or failed its drain leaves its reason in the hook outcome file
//! (`hook::outcome_log`).
//!
//! Order: HOME present (else quiet: no reader of the CLI's own state, and
//! the Git component's state root would resolve relative to the cwd,
//! `tsk-43x4`); the flags; the record directory from the disk-only main
//! checkout read (from `CLAUDE_PROJECT_DIR` for Claude Code only); the project config and the limits; the budget watchdog;
//! then the shell, which reads the breaker before stdin, opens the record
//! only after the caller check, and takes the mailbox lock with nothing
//! else held: this process holds no other `LockScope` at any point.
use super::mailbox_identity::{ensure_registered, session_of, state_root};
use fgos_mailbox::adapters::TestedClis;
use fgos_mailbox::ancestry::ancestry_of;
use fgos_mailbox::hook::outcome_log;
use fgos_mailbox::hook::resolve::{resolver_for, HookEnv};
use fgos_mailbox::hook::shell::{self, GateState, ShellInput, WriteGate};
use fgos_mailbox::hook::{Adapter, HookEvent};
use fgos_mailbox::limits::{load, read_project_config};
use fgos_mailbox::record::Paths;
use fgos_mailbox_core::{Cli, Timestamp, WriterKey};
use std::ffi::OsString;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

/// Runs one hook call and ends the process with status 0.
pub fn main(args: &[OsString]) -> ! {
    shell::silence_panics();
    // A panic anywhere on this path still ends the call with status 0.
    let _ = std::panic::catch_unwind(|| run(args));
    std::process::exit(0)
}

/// The flags: `--cli <claude|codex|pi|omp>` and `--event <stop|post-tool-use>`,
/// each once, nothing else.
fn parse(args: &[OsString]) -> Option<(Adapter, HookEvent)> {
    let mut cli = None;
    let mut event = None;
    let mut rest = args.iter().map(|a| a.to_str());
    while let Some(flag) = rest.next() {
        let value = rest.next().flatten();
        match flag? {
            "--cli" if cli.is_none() => {
                cli = Some(match value? {
                    "claude" => Adapter::Claude,
                    "codex" => Adapter::Codex,
                    "pi" => Adapter::Pi,
                    "omp" => Adapter::Omp,
                    _ => return None,
                });
            }
            "--event" if event.is_none() => event = Some(HookEvent::from_flag(value?)?),
            _ => return None,
        }
    }
    Some((cli?, event?))
}

fn now() -> Timestamp {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| u64::try_from(d.as_millis()).unwrap_or(u64::MAX));
    Timestamp::from_millis(millis)
}

fn run(args: &[OsString]) {
    if std::env::var_os("HOME").is_none_or(|home| home.is_empty()) {
        return;
    }
    let Some((adapter, event)) = parse(args) else {
        return;
    };
    let Ok(cwd) = std::env::current_dir() else {
        return;
    };
    // Only Claude Code sets the variable; a Codex, pi or omp session that
    // inherited one from its shell must not reach another project's record.
    let project_dir = match adapter {
        Adapter::Claude => std::env::var_os("CLAUDE_PROJECT_DIR"),
        Adapter::Codex | Adapter::Agy | Adapter::Pi | Adapter::Omp => None,
    };
    let Ok(fgos_dir) = super::mailbox_root::mailbox_fgos_dir(project_dir.as_deref(), &cwd) else {
        return;
    };
    let Ok(defaults) = load(None) else {
        return;
    };
    // A config error is quiet and never counted by the breaker.
    let Ok(config) = read_project_config(&fgos_dir, defaults.hook.hook.max_read_bytes) else {
        return;
    };
    let Ok(loaded) = load(config.as_ref()) else {
        return;
    };
    let gate = WriteGate::new();
    // The watchdog writes nothing on its way out: a stalled disk must not
    // keep the process from exiting.
    shell::arm_budget(
        Duration::from_millis(loaded.hook.hook.budget_ms),
        gate.clone(),
        || {},
    );
    let tested = TestedClis::embedded();
    let Some(facts) = tested.facts(adapter) else {
        return;
    };
    let env = HookEnv::from_process(&fgos_dir);
    let resolve = resolver_for(adapter, facts, &env, &loaded.hook.hook);
    let project = super::mailbox_root::project_name(&fgos_dir);
    let ancestry = || ancestry_of(std::process::id());
    // HOME is set (checked first), so Identity's state root resolves here.
    let identity_root = state_root();
    let handle_of = |key: &WriterKey, cli: &Cli, head: Option<&fgos_process::facts::Record>| {
        session_of(identity_root.as_deref()?, key, cli, head).map(|info| info.handle)
    };
    let input = ShellInput {
        adapter,
        event,
        project: &project,
        fgos_dir: &fgos_dir,
        limits: &loaded.limits,
        hook: &loaded.hook,
        tested,
        clock: &now,
        ancestry: &ancestry,
        resolve: &resolve,
        handle_of: &handle_of,
        gate: gate.clone(),
    };
    let gate_idle = gate;
    let outcome = shell::run(
        input,
        &mut std::io::stdin().lock(),
        &mut std::io::stdout().lock(),
    );
    let paths = Paths::new(&fgos_dir);
    outcome_log::record(&paths, adapter, event, &outcome, now());
    // Make sure Identity knows the head: on the call that bound it to a new
    // generation (quiet by construction), and again on a later quiet call
    // while the latest outcome says Identity had no machine id yet, so a
    // machine id minted after the head started still registers it. The
    // write gate must be idle, so the watchdog still covers the step;
    // steady calls otherwise never touch Identity.
    let Some((head, cli)) = outcome.bound.as_ref().zip(adapter.cli()) else {
        return;
    };
    let retry = || outcome_log::latest_reason(&paths).as_deref() == Some(IDENT_NO_MACHINE_ID);
    if gate_idle.state() != GateState::Idle || (head.registered.is_none() && !retry()) {
        return;
    }
    let Some(root) = identity_root.as_deref() else {
        return;
    };
    match ensure_registered(root, &cli, head) {
        None if head.registered.is_none() => outcome_log::clear(&paths),
        None => {}
        Some(reason) => {
            outcome_log::record_reason(&paths, adapter, event, &reason, now());
        }
    }
}

/// The outcome a registering call leaves when Identity has no machine id
/// yet (`ensure_registered`'s reason for Identity's `machine-id-missing`).
const IDENT_NO_MACHINE_ID: &str = "ident:machine-id-missing";
