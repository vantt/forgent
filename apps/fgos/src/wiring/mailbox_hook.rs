//! `fgos hook mailbox --cli <claude|codex|pi|omp> --event <stop|post-tool-use>`:
//! the mailbox's checkpoint, served natively before the composition root
//! (the route table's `native_subcommands` of `hook`). A thin, straight-line
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
use super::mailbox_config::{is_config_reason, project_mailbox, CrossMachine};
use super::mailbox_identity::{ensure_registered, refresh_registered, session_of, state_root};
use fgos_event_store::layout::Layout;
use fgos_mailbox::adapters::TestedClis;
use fgos_mailbox::ancestry::ancestry_of;
use fgos_mailbox::hook::outcome_log;
use fgos_mailbox::hook::resolve::{resolver_for, HookEnv, HEAD_REQUEST_SOCKET_ENV};
use fgos_mailbox::hook::shell::{self, GateState, ShellInput, WriteGate};
use fgos_mailbox::hook::{Adapter, HookEvent};
use fgos_mailbox::record::Paths;
use fgos_mailbox_core::{Cli, Timestamp, WriterKey};
use std::ffi::OsString;
use std::path::Path;
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
    let paths = Paths::new(&fgos_dir);
    // A config error is quiet on the CLI's channel and never counted by the
    // breaker, but its reason is left for `status`; once the config reads
    // again, that reason is cleared.
    let (loaded, cross) = match project_mailbox(&fgos_dir) {
        Ok(read) => read,
        Err(failure) => {
            outcome_log::record_reason(&paths, adapter, event, &failure.reason(), now());
            return;
        }
    };
    if outcome_log::latest_reason(&paths).is_some_and(|r| is_config_reason(&r)) {
        outcome_log::clear(&paths);
    }
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
    // HOME is set (checked first), so Identity's state root resolves here.
    let identity_root = state_root();
    // A confined head's gate, which its head must be the direct child of.
    let gate_of = |attempt: &str| {
        let key = fgos_identity::WriterKey {
            source: fgos_identity::resolve::ENV_ORDER[0],
            value: attempt,
        };
        fgos_identity::directory::attempt_gate(identity_root.as_deref()?, &key)
    };
    let env = HookEnv::from_process(&gate_of);
    let resolve = resolver_for(adapter, facts, &env, &loaded.hook.hook);
    let project = super::mailbox_root::project_name(&fgos_dir);
    let ancestry = || ancestry_of(std::process::id());
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
    outcome_log::record(&paths, adapter, event, &outcome, now());
    // The mailbox lock is released here; the child is started past it and
    // only while the watchdog has not fired.
    if gate_idle.state() == GateState::Idle {
        start_sync(&fgos_dir, &paths, &cross);
    }
    // Make sure Identity knows the head (see `ensure_identity`), then that its
    // entry holds the head's current identifiers (see `refresh_due`). The
    // write gate must be idle, so the watchdog still covers both steps.
    let Some((head, cli)) = outcome.bound.as_ref().zip(adapter.cli()) else {
        return;
    };
    let Some(root) = identity_root.as_deref() else {
        return;
    };
    let confined = std::env::var_os(HEAD_REQUEST_SOCKET_ENV).is_some_and(|path| !path.is_empty());
    let own = head.writer.as_str();
    let latest = || outcome_log::latest(&paths);
    if gate_idle.state() == GateState::Idle
        && ensure_identity(head.registered.is_some(), confined, own, latest(), now())
    {
        match ensure_registered(root, &fgos_dir, &cli, head) {
            // A retry that now holds clears the outcome it left, never another head's.
            None if latest().is_some_and(|l| {
                l.reason.starts_with(IDENT_PREFIX) && l.writer.as_deref().is_none_or(|w| w == own)
            }) =>
            {
                outcome_log::clear(&paths)
            }
            None => {}
            Some(reason) => {
                outcome_log::record_reason_for(&paths, adapter, event, &reason, own, now());
                return;
            }
        }
    }
    if gate_idle.state() == GateState::Idle && refresh_due(head.registered.is_some(), event) {
        if let Some(reason) = refresh_registered(root, &fgos_dir, &cli, head) {
            outcome_log::record_reason_for(&paths, adapter, event, &reason, own, now());
        }
    }
}

/// Whether this call compares the head's identifiers with its Identity entry
/// and refreshes what changed (a renamed CLI session, a new messaging socket,
/// a moved pane): on the call that bound a new generation and when a turn
/// ends. Steady tool calls never read Identity for it.
fn refresh_due(newly_bound: bool, event: HookEvent) -> bool {
    newly_bound || event == HookEvent::Stop
}

/// How long a confined head waits after its own failed Identity bind before
/// a hook call asks again.
const CONFINED_BIND_RETRY: Duration = Duration::from_secs(5 * 60);

/// Whether this call makes sure Identity knows its head `own`, given the
/// latest hook outcome and the time `now`:
/// - on the call that bound it to a new generation (quiet by construction);
/// - inside a confined head, always, unless the latest outcome is this
///   head's own failed Identity step (`ident:*`, a busy or refused `head
///   bind session`) less than [`CONFINED_BIND_RETRY`] old: a missing entry
///   or another head's means ask now, so retrying never stops while the
///   head is unbound. `ensure_registered` first reads Identity's directory,
///   so a bound head costs one read-only scan, no request and no write;
/// - otherwise again on a later quiet call while the latest outcome says
///   Identity had no machine id yet, so a machine id minted after the head
///   started still registers it.
///
/// Steady calls of an unconfined head never touch Identity.
fn ensure_identity(
    newly_bound: bool,
    confined_head: bool,
    own: &str,
    latest: Option<outcome_log::Latest>,
    now: Timestamp,
) -> bool {
    if newly_bound {
        return true;
    }
    if confined_head {
        let period = u64::try_from(CONFINED_BIND_RETRY.as_millis()).unwrap_or(u64::MAX);
        return !latest.is_some_and(|l| {
            l.reason.starts_with(IDENT_PREFIX)
                && l.writer.as_deref() == Some(own)
                && now.as_millis().saturating_sub(l.at_ms) < period
        });
    }
    latest.is_some_and(|l| l.reason == IDENT_NO_MACHINE_ID)
}

/// The prefix of every outcome `ensure_registered` leaves.
const IDENT_PREFIX: &str = "ident:";

/// Starts the one detached `hook mailbox-sync` child when mail may cross
/// machines and the last child that took mail started longer ago than the
/// interval (or for another remote, or never). The due test reads only the
/// child's own stamp, with no Git process, so a plain `fgos events sync`, which
/// fetches but takes no mail, cannot postpone the child; a rare second child
/// finds the seal lock busy and ends. A call that cannot start the child loses nothing: the next call
/// tries again. Nothing is printed.
fn start_sync(fgos_dir: &Path, paths: &Paths, cross: &CrossMachine) {
    if !cross.enabled || cross.sync_interval_sec == 0 {
        return;
    }
    let Some(main) = fgos_dir.parent() else {
        return;
    };
    // Only a main checkout whose Git directory is the `.git` directory has its
    // sync record there (a gitfile points elsewhere and would read as never
    // synced on every call), and only a project that migrated its events or
    // already has a store has anything to sync (the child would end before it
    // recorded an attempt, so every call would start one).
    let git_dir = main.join(".git");
    if !std::fs::symlink_metadata(&git_dir).is_ok_and(|meta| meta.is_dir()) {
        return;
    }
    let Ok(layout) = Layout::from_common_dir(Some(&git_dir)) else {
        return;
    };
    let fenced =
        std::fs::symlink_metadata(main.join(".fgos/events")).is_ok_and(|meta| meta.is_file());
    if !fenced && std::fs::symlink_metadata(layout.store()).is_err() {
        return;
    }
    let taken = paths.take_stamp();
    let recent = std::fs::read_to_string(&taken).is_ok_and(|remote| remote == cross.remote)
        && std::fs::metadata(&taken)
            .and_then(|meta| meta.modified())
            .ok()
            .and_then(|at| at.elapsed().ok())
            .is_some_and(|age| age.as_secs() < cross.sync_interval_sec);
    if recent {
        return;
    }
    super::mailbox_sync::spawn(main, paths, &cross.remote);
}

/// The outcome a registering call leaves when Identity has no machine id
/// yet (`ensure_registered`'s reason for Identity's `machine-id-missing`).
const IDENT_NO_MACHINE_ID: &str = "ident:machine-id-missing";

#[cfg(test)]
mod tests {
    use super::{ensure_identity, CONFINED_BIND_RETRY, IDENT_NO_MACHINE_ID};
    use fgos_mailbox::hook::outcome_log::Latest;
    use fgos_mailbox_core::Timestamp;

    fn entry(reason: &str, at_ms: u64, writer: Option<&str>) -> Option<Latest> {
        Some(Latest {
            reason: reason.to_string(),
            at_ms,
            writer: writer.map(String::from),
        })
    }

    #[test]
    fn a_confined_head_backs_off_only_after_its_own_recent_failed_bind_and_retries_when_another_heads_entry_overwrote_it(
    ) {
        let period = u64::try_from(CONFINED_BIND_RETRY.as_millis()).unwrap();
        let at = 1_000_000;
        let soon = Timestamp::from_millis(at + period - 1);
        let later = Timestamp::from_millis(at + period);
        let own_failed = || entry("ident:busy", at, Some("me"));
        // A new generation always makes sure.
        assert!(ensure_identity(true, false, "me", None, soon));
        // A stuck confined head: its own failed bind holds it back for one period, then it asks again.
        assert!(!ensure_identity(false, true, "me", own_failed(), soon));
        assert!(ensure_identity(false, true, "me", own_failed(), later));
        // Another head's entry overwrote it, or there is none: ask now, so retrying never stops.
        assert!(ensure_identity(
            false,
            true,
            "me",
            entry("ident:busy", at, Some("other")),
            soon
        ));
        assert!(ensure_identity(
            false,
            true,
            "me",
            entry("record:lock-busy", at, None),
            soon
        ));
        assert!(ensure_identity(false, true, "me", None, soon));
        // An unconfined steady call leaves Identity alone unless the machine id was missing.
        assert!(!ensure_identity(false, false, "me", None, soon));
        assert!(!ensure_identity(false, false, "me", own_failed(), later));
        assert!(ensure_identity(
            false,
            false,
            "me",
            entry(IDENT_NO_MACHINE_ID, at, None),
            soon
        ));
    }
}
