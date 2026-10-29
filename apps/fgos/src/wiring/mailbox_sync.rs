//! `fgos hook mailbox-sync --dir <project>`: the detached child the mailbox
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

/// The one flag: `--dir <project>`.
fn parse(args: &[OsString]) -> Option<PathBuf> {
    match args {
        [flag, dir] if flag == "--dir" && !dir.is_empty() => Some(PathBuf::from(dir)),
        _ => None,
    }
}

fn run(args: &[OsString]) {
    let Some(dir) = parse(args) else {
        return;
    };
    if let Err(why) = publish(&dir) {
        eprintln!("mailbox-sync: {why}");
    }
}

/// One opportunistic sync of the clone `dir` is in; nothing for a directory
/// in no repository or a project that never migrated its events.
fn publish(dir: &Path) -> Result<(), String> {
    let Some(clone) = event_store_clone::open(dir).map_err(|f| format!("{}: {}", f.reason, f.detail))? else {
        return Ok(());
    };
    let remote = fgos_config::provider::effective_value(dir, "eventStore.remote")
        .map_err(|e| format!("event-store-config: {e:?}"))?;
    let remote = match &remote {
        Some(value) => value.as_str().ok_or("event-store-config: eventStore.remote is not text")?,
        None => "origin",
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
    fn only_a_single_dir_flag_with_a_value_names_the_project() {
        let args = |list: &[&str]| list.iter().map(OsString::from).collect::<Vec<_>>();
        assert_eq!(parse(&args(&["--dir", "/project"])), Some(PathBuf::from("/project")));
        for bad in [&[][..], &["--dir"], &["--dir", ""], &["--dir", "/a", "/b"], &["/project"], &["--cli", "x"]] {
            assert_eq!(parse(&args(bad)), None, "{bad:?}");
        }
    }
}
