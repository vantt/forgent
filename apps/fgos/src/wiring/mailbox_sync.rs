//! `fgos hook mailbox-sync --dir <project> --remote <name>`: the detached child the mailbox
//! hook and the mailbox verbs start (through `fgos_process::mapped::spawn_detached`)
//! when mail may cross machines and the last sync is older than
//! `eventStore.sync.intervalSec`. It runs one opportunistic Event Store sync of
//! the clone. First it publishes the mailbox heads of this machine into the
//! shared directory (Identity's signed `session-published` events, which is
//! what makes a head addressable from another machine; signing runs
//! `ssh-keygen`, so it never happens in the hook), then it seals every open
//! stream, fetches the other machines' refs and pushes the own ones. The sync
//! tries the seal lock and gives up when another process holds it. The child
//! writes nothing to the mailbox record, prints nothing unless it failed, and
//! ends with status 0 on every path: nobody waits for it.
use super::event_store_clone;
use super::identity_log::StoreLogDoor;
use super::mailbox_config::project_mailbox;
use super::mailbox_identity::{session_of, state_root};
use fgos_event_store::sync::{sync, SyncRequest};
use fgos_identity::current::machine_info;
use fgos_identity::directory;
use fgos_identity::shared::{self, LogDoor};
use fgos_mailbox::verbs;
use fgos_mailbox_core::Limits;
use fgos_process::facts::judge_here;
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
    let fgos_dir = dir.join(".fgos");
    let loaded = match project_mailbox(&fgos_dir) {
        Ok((loaded, cross)) if cross.enabled => loaded,
        Ok(_) => return,
        Err(failure) => {
            eprintln!("mailbox-sync: {}", failure.reason());
            return;
        }
    };
    if let Err(why) = publish_heads(&dir, &fgos_dir, &loaded.limits) {
        eprintln!("mailbox-sync: {why}");
    }
    if let Err(why) = publish(&dir, &remote) {
        eprintln!("mailbox-sync: {why}");
    }
}

/// Publishes each live head of this project's mailbox record that Identity
/// registered with a project id, when it is new or changed since this
/// machine's last published event for it. Identity's own rule decides what
/// is appended; a head without a directory entry is skipped, and so is one
/// registered outside a project. The writer of each event is the head itself.
/// Two children running at once (a rare overlap) can both append the same
/// entry; the directory's fold keeps the last event per session, so the
/// duplicate changes nothing a reader sees.
fn publish_heads(main: &Path, fgos_dir: &Path, limits: &Limits) -> Result<(), String> {
    let Some(root) = state_root() else {
        return Ok(());
    };
    let heads = verbs::heads(fgos_dir, limits)?;
    if heads.is_empty() {
        return Ok(());
    }
    let refusal = |r: fgos_identity::Refusal| format!("{}: {}", r.reason, r.detail);
    let live = directory::list(&root, None, false, &judge_here, None).map_err(refusal)?.sessions;
    let machine = machine_info(&root).map_err(refusal)?;
    for head in heads {
        let Some(info) = session_of(&root, &head.key, &head.cli, Some(&head.head)) else {
            continue;
        };
        let Some(own) = live.iter().find(|listed| listed.id == info.id) else {
            continue;
        };
        let Some(log) = StoreLogDoor.open(main, &own.id).map_err(refusal)? else {
            return Ok(());
        };
        shared::publish_changes(&root, log.as_ref(), &machine, Some(own), &live).map_err(refusal)?;
    }
    Ok(())
}

/// One opportunistic sync of the clone `dir` is in; nothing for a directory
/// in no repository. The hook starts this child only for a clone with a store
/// or a migrated-events fence.
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
