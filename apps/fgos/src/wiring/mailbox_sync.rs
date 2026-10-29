//! `fgos hook mailbox-sync --dir <project> --remote <name>`: the detached child the mailbox
//! hook and the mailbox verbs start (through `fgos_process::mapped::spawn_detached`)
//! when mail may cross machines and the last sync is older than
//! `eventStore.sync.intervalSec`. It runs one opportunistic Event Store sync of
//! the clone: seal every open stream, fetch the other machines' refs, push the
//! own ones. It tries the seal lock and gives up when another process holds it,
//! writes nothing to the mailbox record, prints nothing unless it failed, and
//! ends with status 0 on every path: nobody waits for it.
use super::event_store_clone;
use fgos_event_store::sync::{sync, SyncRequest};
use std::ffi::OsString;
use std::path::{Path, PathBuf};

/// Runs one sync and ends the process with status 0.
pub fn main(args: &[OsString]) -> ! {
    // A panic anywhere on this path still ends the child with status 0.
    let _ = std::panic::catch_unwind(|| run(args));
    std::process::exit(0)
}

/// The two flags, in this order: `--dir <project> --remote <name>`; the hook
/// reads both from its config snapshot, so the child reads no config for them.
fn parse(args: &[OsString]) -> Option<(PathBuf, String)> {
    match args {
        [dir_flag, dir, remote_flag, remote]
            if dir_flag == "--dir" && remote_flag == "--remote" && !dir.is_empty() && !remote.is_empty() =>
        {
            Some((PathBuf::from(dir), remote.to_str()?.to_owned()))
        }
        _ => None,
    }
}

fn run(args: &[OsString]) {
    let Some((dir, remote)) = parse(args) else {
        return;
    };
    if let Err(why) = publish(&dir, &remote) {
        eprintln!("mailbox-sync: {why}");
    }
}

/// One opportunistic sync of the clone `dir` is in; nothing for a directory
/// in no repository or a project that never migrated its events.
fn publish(dir: &Path, remote: &str) -> Result<(), String> {
    let Some(clone) = event_store_clone::open(dir).map_err(|f| format!("{}: {}", f.reason, f.detail))? else {
        return Ok(());
    };
    let request = SyncRequest {
        layout: &clone.layout,
        machine: &clone.machine,
        remote,
        no_push: false,
        opportunistic: true,
        held_ranks: &[],
        hot_lock_depth: 0,
    };
    sync(&clone.driver, &clone.repo, request).map(|_| ()).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::parse;
    use std::ffi::OsString;
    use std::path::PathBuf;

    #[test]
    fn only_a_dir_and_a_remote_flag_with_values_name_the_project() {
        let args = |list: &[&str]| list.iter().map(OsString::from).collect::<Vec<_>>();
        assert_eq!(
            parse(&args(&["--dir", "/project", "--remote", "origin"])),
            Some((PathBuf::from("/project"), "origin".to_owned()))
        );
        for bad in [
            &[][..],
            &["--dir"],
            &["--dir", "/project"],
            &["--dir", "", "--remote", "origin"],
            &["--dir", "/project", "--remote", ""],
            &["--remote", "origin", "--dir", "/project"],
            &["/project"],
            &["--cli", "x"],
        ] {
            assert_eq!(parse(&args(bad)), None, "{bad:?}");
        }
    }
}
