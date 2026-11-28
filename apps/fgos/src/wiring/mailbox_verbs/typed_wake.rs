//! Host adapter for the mailbox's terminal-free Nudge port. Identity owns pane lookup;
//! Session Host owns the conservative, focus-neutral gate and raw send.
use fgos_identity::directory::{resolve, NoTerminal};
use fgos_mailbox::{
    adapters::{
        version::{recipient_version, VersionSources},
        NudgeChannel, TestedClis,
    },
    nudge::{Nudge, SystemNudge, NUDGE_LINE},
};
use fgos_mailbox_core::{Cli, WriterKey};
use fgos_process::facts::{judge_here, Record, Verdict};
use fgos_session_host::pane_io::{PaneIo, TypedWake};

pub(crate) struct HostNudge {
    pub push: SystemNudge,
    pub versions: VersionSources,
}

impl Nudge for HostNudge {
    fn nudge(&self, channel: NudgeChannel, key: &WriterKey, head: &Record) -> Result<(), String> {
        if channel != NudgeChannel::Typed {
            return self.push.nudge(channel, key, head);
        }
        let root = super::state_root().ok_or("no-pane")?;
        let session =
            resolve(&root, key.as_str(), &judge_here, None, &NoTerminal).map_err(|_| "no-pane")?;
        let pane = session.terminal_key().ok_or("no-pane")?;
        // A pane identifier alone must not lend a newer CLI process an old head's mail.
        let cli_session = session
            .ids
            .as_ref()
            .and_then(|ids| ids.cli_session.as_ref())
            .ok_or("unknown")?;
        if cli_session.id != key.as_str()
            || judge_here(head) != Verdict::Alive
            || session.stale.iter().any(|group| group == "cliSession")
            || cli_session
                .pid
                .is_some_and(|pid| head.pid.map(|value| value.0) != Some(pid))
            || cli_session
                .start_time
                .as_ref()
                .is_some_and(|start| head.start_time.as_ref() != Some(start))
        {
            return Err("unknown".into());
        }
        let cli = Cli::new(&session.cli).map_err(|_| "unknown")?;
        let version = recipient_version(&cli, &head.to_json().to_string(), &self.versions);
        if !version.as_ref().is_some_and(|version| {
            TestedClis::embedded()
                .nudge_channels_for(cli.as_str(), version)
                .contains(&NudgeChannel::Typed)
        }) {
            return Err("unknown".into());
        }
        let cwd = std::env::current_dir().map_err(|_| "unknown")?;
        let fgos_dir =
            super::super::mailbox_root::mailbox_fgos_dir(None, &cwd).map_err(|_| "unknown")?;
        let backend = fgos_run_supervisor::terminal_slot::Backend::from_env(&fgos_dir);
        let core = backend.core();
        match PaneIo::new(&core, &pane).typed_wake(cli.as_str(), version.as_deref(), NUDGE_LINE) {
            TypedWake::Submitted => Ok(()),
            other => Err(other.cause().into()),
        }
    }
}
