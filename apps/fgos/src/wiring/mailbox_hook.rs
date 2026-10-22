//! `fgos hook mailbox --cli <claude|codex> --event <stop|post-tool-use>`:
//! the mailbox's checkpoint, served natively before the composition root
//! (the route table's `native_kinds` of `hook`). A thin, straight-line
//! wiring of the store's hook shell to the real process: no logic, no log
//! line, and exit 0 on every path, a usage error included (spec §6.1, §8
//! item 7: exit 2 from a `Stop` hook blocks the stop in Claude Code), with
//! nothing on stdout or stderr unless frames are delivered.
//!
//! Order: HOME present (else quiet: no reader of the CLI's own state, and
//! the Git component's state root would resolve relative to the cwd,
//! `tsk-43x4`); the flags; the record directory from the disk-only main
//! checkout read; the project config and the limits; the budget watchdog;
//! then the shell, which reads the breaker before stdin, opens the record
//! only after the caller check, and takes the mailbox lock with nothing
//! else held: this process holds no other `LockScope` at any point.
use fgos_mailbox::adapters::TestedClis;
use fgos_mailbox::ancestry::ancestry_of;
use fgos_mailbox::hook::resolve::{resolver_for, HookEnv};
use fgos_mailbox::hook::shell::{self, ShellInput, WriteGate};
use fgos_mailbox::hook::{Adapter, HookEvent};
use fgos_mailbox::limits::{load, read_project_config};
use fgos_mailbox_core::Timestamp;
use std::ffi::OsString;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

/// Runs one hook call and ends the process with status 0.
pub fn main(args: &[OsString]) -> ! {
    shell::silence_panics();
    run(args);
    std::process::exit(0)
}

/// The flags: `--cli <claude|codex>` and `--event <stop|post-tool-use>`,
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
    let Ok(fgos_dir) = super::mailbox_root::mailbox_fgos_dir(
        std::env::var_os("CLAUDE_PROJECT_DIR").as_deref(),
        &cwd,
    ) else {
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
        gate,
    };
    shell::run(
        input,
        &mut std::io::stdin().lock(),
        &mut std::io::stdout().lock(),
    );
}
