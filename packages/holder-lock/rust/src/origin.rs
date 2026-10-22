//! Why a process may hold a lock: the origin of one holder. A holder that is
//! neither a fgOS process nor a child of a borrowing call is the thing
//! `fgos doctor` warns about, so the rule lives here once, next to the
//! listing it classifies.

use std::collections::BTreeMap;
use std::path::Path;

use fgos_process::facts::{self, ProcTuple, ProcView, ScanFilter};

use crate::port::LOCK_FD_ENV;

/// Basenames of the fgOS executables. The quiesce scan's payload rule reads the same set.
pub(crate) const FGOS_BINARIES: [&str; 3] = ["fgos", "fgos-runner", "fgos-gateway"];

/// The variable the host pins on every process it starts.
const STATE_ROOT_ENV: &str = "FGOS_STATE_ROOT";

/// Why a process may hold a lock.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Origin {
    /// A child of a borrowing call of that lock (`FGOS_LOCK_FD` names it).
    Borrowed,
    /// A process the host started (it carries the state-root pin).
    FgosHost,
    /// Its argv names a fgOS payload.
    FgosPayload,
    /// The sandbox monitor of an attempt whose parent holds the same lock.
    AttemptMember,
    /// None of the above.
    Foreign,
}

impl Origin {
    /// The name the doctor and `lock-status` print.
    pub fn as_str(self) -> &'static str {
        match self {
            Origin::Borrowed => "borrowed",
            Origin::FgosHost => "fgos-host",
            Origin::FgosPayload => "fgos-payload",
            Origin::AttemptMember => "attempt-member",
            Origin::Foreign => "foreign",
        }
    }
}

/// What the holder itself shows: its environment and its argv. `None` when
/// nothing says it is a fgOS process.
pub fn own_origin(argv: Option<&[String]>, env: &BTreeMap<String, String>, lock_name: &str, state_root: &Path) -> Option<Origin> {
    if env.get(LOCK_FD_ENV).is_some_and(|value| value.starts_with(&format!("{lock_name}:"))) {
        return Some(Origin::Borrowed);
    }
    if env.contains_key(STATE_ROOT_ENV) {
        return Some(Origin::FgosHost);
    }
    let argv = argv?;
    let named_binary = argv.first().and_then(|arg| Path::new(arg).file_name()).and_then(|n| n.to_str()).is_some_and(|base| FGOS_BINARIES.contains(&base));
    let named_script = argv.iter().any(|arg| arg.ends_with("bin/fgos.mjs") || arg.ends_with("scripts/run-tests.mjs"));
    let in_release = argv.iter().any(|arg| Path::new(arg).starts_with(state_root.join("releases")));
    (named_binary || named_script || in_release).then_some(Origin::FgosPayload)
}

/// The origin of a holder given what it shows (`own`), its command name
/// (`comm`) and the own origin of its parent when the parent holds the same
/// lock. Only the bwrap monitor of an attempt counts as a member: a leaked
/// lock descriptor in the agent or its descendants must still be named.
pub fn holder_origin(own: Option<Origin>, comm: Option<&str>, parent_own: Option<Origin>) -> Origin {
    match own {
        Some(origin) => origin,
        None if comm.is_some_and(|c| c.trim() == "bwrap") && parent_own.is_some() => Origin::AttemptMember,
        None => Origin::Foreign,
    }
}

/// One process holding a lock, with the origin Rust decided.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Holder {
    /// Who it is.
    pub tuple: ProcTuple,
    /// Why it may hold the lock.
    pub origin: Origin,
    /// Its argv joined, cut to 200 characters; `<unreadable>` when it could not be read.
    pub cmdline: String,
}

fn comm_of(pid: u32) -> Option<String> {
    std::fs::read_to_string(format!("/proc/{pid}/comm")).ok()
}

fn parent_of(pid: u32) -> Option<u32> {
    facts::relation_of(fgos_process::ProcId(pid)).map(|r| r.parent).filter(|p| *p > 0)
}

/// Classify every process in `holders` (the holders of the lock named `lock_name`).
pub fn describe(holders: Vec<ProcTuple>, lock_name: &str, state_root: &Path) -> Vec<Holder> {
    let filter = ScanFilter { env_keys: vec![LOCK_FD_ENV.into(), STATE_ROOT_ENV.into()], include_self: true };
    let views: Vec<Option<ProcView>> = holders.iter().map(|t| facts::view_of(t.pid, &filter)).collect();
    let own: Vec<Option<Origin>> = views.iter().map(|view| view.as_ref().and_then(|v| own_origin(v.cmdline.as_deref(), &v.env_subset, lock_name, state_root))).collect();
    holders
        .iter()
        .enumerate()
        .map(|(i, tuple)| {
            let parent_own = parent_of(tuple.pid.0).and_then(|parent| holders.iter().position(|h| h.pid.0 == parent)).and_then(|j| own[j]);
            let comm = if own[i].is_none() { comm_of(tuple.pid.0) } else { None };
            let cmdline = match views[i].as_ref().and_then(|v| v.cmdline.as_ref()) {
                Some(argv) => argv.join(" ").chars().take(200).collect(),
                None => "<unreadable>".to_string(),
            };
            Holder { tuple: tuple.clone(), origin: holder_origin(own[i], comm.as_deref(), parent_own), cmdline }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn argv(parts: &[&str]) -> Vec<String> {
        parts.iter().map(|p| p.to_string()).collect()
    }
    fn env(pairs: &[(&str, &str)]) -> BTreeMap<String, String> {
        pairs.iter().map(|(k, v)| (k.to_string(), v.to_string())).collect()
    }

    #[test]
    fn foreign_borrowed_host_payload_and_attempt_member_are_told_apart() {
        let root = Path::new("/state/fgos");
        let own = |a: &[&str], e: &[(&str, &str)]| own_origin(Some(&argv(a)), &env(e), "main-checkout", root);
        assert_eq!(own(&["git", "status"], &[("FGOS_LOCK_FD", "main-checkout:3")]), Some(Origin::Borrowed));
        // A borrowed description of another lock says nothing about this one.
        assert_eq!(own(&["git"], &[("FGOS_LOCK_FD", "other:3")]), None);
        assert_eq!(own(&["node", "x"], &[("FGOS_STATE_ROOT", "/state/fgos")]), Some(Origin::FgosHost));
        assert_eq!(own(&["/usr/bin/fgos-runner", "--once"], &[]), Some(Origin::FgosPayload));
        assert_eq!(own(&["node", "/w/bin/fgos.mjs", "x"], &[]), Some(Origin::FgosPayload));
        assert_eq!(own(&["node", "/w/scripts/run-tests.mjs"], &[]), Some(Origin::FgosPayload));
        assert_eq!(own(&["/state/fgos/releases/abc/libexec/node"], &[]), Some(Origin::FgosPayload));
        assert_eq!(own(&["vim", "notes"], &[]), None);
        assert_eq!(own_origin(None, &env(&[]), "main-checkout", root), None);
        // Only a bwrap whose parent holds the lock with a fgOS origin is a member.
        assert_eq!(holder_origin(None, Some("bwrap\n"), Some(Origin::FgosPayload)), Origin::AttemptMember);
        assert_eq!(holder_origin(None, Some("bwrap"), None), Origin::Foreign);
        assert_eq!(holder_origin(None, Some("sleep"), Some(Origin::FgosPayload)), Origin::Foreign);
        assert_eq!(holder_origin(Some(Origin::Borrowed), Some("bwrap"), None), Origin::Borrowed);
        assert_eq!(Origin::AttemptMember.as_str(), "attempt-member");
    }
}
