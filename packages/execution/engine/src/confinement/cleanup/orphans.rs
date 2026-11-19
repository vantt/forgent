//! What a dead dispatch left behind, judged here and nowhere else, and the homes kept for a login that could not
//! be staged.

use super::host::CleanupHost;
use super::marker::{
    read_attempt_ownership_marker, read_ownership_marker, resolve_confinement_temp_root,
};
use super::record::{read_attempt_home_record, remove_attempt_home, CREDENTIAL_KEEP_MAX_ATTEMPTS};
use super::remove::cleanup_confinement_resource;
use super::resolve::{current_uid, resolve};
use serde_json::Value;
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

pub use crate::credentials::WriteBackOutcome;

/// How old an empty per-dispatch directory must be before it counts as left behind.
const EMPTY_SHELL_GRACE_MS: i64 = 600_000;

/// Stages the login a private home renewed beside its account's store (never applies it). `target` is what the
/// host recorded for the home in its finalization descriptor, never anything read from inside the home. The
/// credentials module implements this over [`crate::credentials::write_back_renewed_credential`].
pub trait CredentialWriteBack {
    fn write_back(&self, home: &Path, target: Option<&Value>) -> WriteBackOutcome;
}

/// A home kept because its renewed login could not be staged; `record` is `None` for a home an older release
/// counted in its marker (recovered by hand). `held` homes used up their attempts and are no longer retried.
#[derive(Debug, Clone, PartialEq)]
pub struct KeptHome {
    pub dir: PathBuf,
    pub attempts: u64,
    pub held: bool,
    pub since: Option<String>,
    pub record: Option<Value>,
}

/// A root as the file system sees it: the real path when it exists, the resolved path otherwise.
pub fn canonical_root(root: &Path) -> PathBuf {
    fs::canonicalize(root).unwrap_or_else(|_| resolve(root))
}

fn subdirs(dir: &Path) -> Vec<PathBuf> {
    let Ok(read) = fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut found: Vec<PathBuf> = read
        .filter_map(Result::ok)
        .filter(|e| e.file_type().is_ok_and(|t| t.is_dir()))
        .map(|e| e.path())
        .collect();
    found.sort();
    found
}

/// Private homes under `temp_root` kept because their renewed login could not be staged. Read-only, never a value.
pub fn list_kept_credential_homes(temp_root: &Path) -> Vec<KeptHome> {
    let mut found = Vec::new();
    for dispatch_dir in subdirs(temp_root) {
        let mut candidates = vec![dispatch_dir.clone()];
        candidates.extend(subdirs(&dispatch_dir));
        for cand in candidates {
            let record = read_attempt_home_record(&cand, None, None);
            let kept = match &record {
                Some(rec) => rec.get("credentialKept").cloned(),
                None => read_ownership_marker(&cand)
                    .or_else(|| read_attempt_ownership_marker(&cand))
                    .and_then(|m| m.get("credentialKept").cloned()),
            };
            let Some(attempts) = kept
                .as_ref()
                .and_then(|k| k.get("attempts"))
                .and_then(Value::as_u64)
                .filter(|n| *n >= 1)
            else {
                continue;
            };
            found.push(KeptHome {
                dir: cand,
                attempts,
                held: attempts >= CREDENTIAL_KEEP_MAX_ATTEMPTS,
                since: kept
                    .as_ref()
                    .and_then(|k| k.get("since"))
                    .and_then(Value::as_str)
                    .map(str::to_string),
                record,
            });
        }
    }
    found
}

/// `{writeBack}` of a recorded home's entry in its finalization descriptor; the outer `None` when that cannot say.
fn recorded_write_back(record: &Value) -> Option<Option<Value>> {
    let text = |key: &str| record.get(key).and_then(Value::as_str);
    let file = Path::new(text("runDir")?)
        .join("protected")
        .join("confinement-finalization")
        .join(format!("{}.json", text("launchCommandId")?));
    let descriptor: Value = serde_json::from_str(&fs::read_to_string(file).ok()?).ok()?;
    let home = text("home")?;
    let entry = descriptor
        .get("resources")?
        .as_array()?
        .iter()
        .find(|res| {
            res.get("pathRef")
                .filter(|v| !v.is_null() && v != &&Value::Bool(false))
                .or_else(|| res.get("path"))
                .and_then(Value::as_str)
                == Some(home)
        })?;
    Some(
        entry
            .get("credentialWriteBack")
            .filter(|v| !v.is_null())
            .cloned(),
    )
}

/// The result of [`settle_held_credential_homes`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct Settled {
    pub settled: u64,
    pub held: u64,
}

/// Settles the held homes under `temp_roots` from their host record and the descriptor it names: the login is
/// staged beside the account's store, or proven no newer or unreadable, and the home is removed. A home without a
/// record or descriptor entry, or whose staging still fails, stays held. In `unretried_roots` a kept home counts
/// as held. Never fails.
pub fn settle_held_credential_homes(
    temp_roots: &[PathBuf],
    unretried_roots: &[PathBuf],
    stage: &dyn CredentialWriteBack,
) -> Settled {
    let mut out = Settled::default();
    let mut seen = HashSet::new();
    let unretried: HashSet<PathBuf> = unretried_roots.iter().map(|r| canonical_root(r)).collect();
    for root in temp_roots {
        for home in list_kept_credential_homes(root) {
            // A root nested inside another is listed twice; a home is looked at once.
            let parent = home.dir.parent().unwrap_or(Path::new("."));
            let dir = canonical_root(parent).join(home.dir.file_name().unwrap_or_default());
            if !seen.insert(dir) {
                continue;
            }
            if !home.held && !unretried.contains(&canonical_root(root)) {
                continue;
            }
            let target = home.record.as_ref().and_then(recorded_write_back);
            let result = target.map(|t| stage.write_back(&home.dir, t.as_ref()));
            if let (Some(result), Some(record)) = (result, &home.record) {
                if result.status != "failed" || result.code == Some("home-unreadable") {
                    if result.status == "failed" {
                        eprintln!(
                            "fgos: credential write-back not done ({}); held private home removed",
                            result.code.unwrap_or_default()
                        );
                    }
                    let dispatch = record
                        .get("dispatchId")
                        .and_then(Value::as_str)
                        .unwrap_or_default();
                    if remove_attempt_home(&home.dir, dispatch).is_ok() {
                        out.settled += 1;
                        continue;
                    }
                }
            }
            out.held += 1;
        }
    }
    out
}

/// What the judgement named: resource dirs whose recorded dispatcher is dead, per-dispatch dirs empty past the
/// grace period, and roots of ours readable beyond the owner.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Orphans {
    pub dead_owned: Vec<(PathBuf, String)>,
    pub empty_shells: Vec<PathBuf>,
    pub loose: Vec<PathBuf>,
}

/// What confinement left behind under `roots`. A home held for its unstaged login is never one (it is reported as
/// a kept credential home); a version 2 (attempt) marker is adopt's, not judged; a live owner is never listed.
/// Read-only.
pub fn judge_confinement_orphans(
    roots: &[PathBuf],
    now_ms: i64,
    host: &dyn CleanupHost,
) -> Orphans {
    let uid = current_uid();
    let mut out = Orphans::default();
    for root in roots {
        if let Ok(meta) = fs::metadata(root) {
            if owned_by(&meta, uid) && mode_of(&meta) & 0o077 != 0 {
                out.loose.push(root.clone());
            }
        }
        for dispatch_dir in subdirs(root) {
            let subs = subdirs(&dispatch_dir);
            if subs.is_empty() && is_old_and_empty(&dispatch_dir, now_ms) {
                out.empty_shells.push(dispatch_dir.clone());
            }
            let mut candidates = vec![dispatch_dir];
            candidates.extend(subs);
            for dir in candidates {
                let Some(marker) = read_ownership_marker(&dir) else {
                    continue;
                };
                let kept = marker
                    .pointer("/credentialKept/attempts")
                    .and_then(Value::as_u64)
                    .unwrap_or(0);
                if kept >= CREDENTIAL_KEEP_MAX_ATTEMPTS {
                    continue;
                }
                let live = marker
                    .get("pid")
                    .and_then(Value::as_u64)
                    .filter(|pid| *pid > 0 && *pid <= u64::from(u32::MAX))
                    .is_some_and(|pid| !host.owner_is_dead(pid as u32));
                if !live {
                    let id = marker
                        .get("dispatchId")
                        .and_then(Value::as_str)
                        .unwrap_or_default();
                    out.dead_owned.push((dir, id.to_string()));
                }
            }
        }
    }
    out
}

fn is_old_and_empty(dir: &Path, now_ms: i64) -> bool {
    let age_ok = fs::metadata(dir)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .is_some_and(|t| now_ms - (t.as_millis() as i64) > EMPTY_SHELL_GRACE_MS);
    age_ok && fs::read_dir(dir).is_ok_and(|mut r| r.next().is_none())
}

fn owned_by(meta: &fs::Metadata, uid: Option<u32>) -> bool {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        uid.is_none_or(|u| meta.uid() == u)
    }
    #[cfg(not(unix))]
    {
        let _ = (meta, uid);
        true
    }
}

fn mode_of(meta: &fs::Metadata) -> u32 {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        meta.mode()
    }
    #[cfg(not(unix))]
    {
        let _ = meta;
        0
    }
}

/// The counts [`remove_confinement_orphans`] returns.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct Removed {
    pub tightened: u64,
    pub removed_homes: u64,
    pub removed_shells: u64,
}

/// Removes what [`judge_confinement_orphans`] named: tightens loose roots to 0700, removes dead-owned resources
/// through the ownership-checked cleanup (one that cannot go stays), then removes the empty shells.
pub fn remove_confinement_orphans(orphans: &Orphans, host: &dyn CleanupHost) -> Removed {
    let mut out = Removed::default();
    for root in &orphans.loose {
        if chmod_700(root) {
            out.tightened += 1;
        }
    }
    for (dir, dispatch_id) in &orphans.dead_owned {
        if cleanup_confinement_resource(dir, Some(dispatch_id), host).is_cleaned() {
            out.removed_homes += 1;
        }
    }
    for shell in &orphans.empty_shells {
        if fs::remove_dir(shell).is_ok() {
            out.removed_shells += 1;
        }
    }
    out
}

fn chmod_700(path: &Path) -> bool {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(path, fs::Permissions::from_mode(0o700)).is_ok()
    }
    #[cfg(not(unix))]
    {
        let _ = path;
        false
    }
}

/// The temp root of private homes under the system temp directory.
pub fn default_temp_roots() -> Vec<PathBuf> {
    vec![resolve_confinement_temp_root(&std::env::temp_dir())]
}
