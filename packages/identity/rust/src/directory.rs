//! The local directory: the sessions registered on this machine, one file per
//! session under `<state root>/identity/sessions/`, so every project on the
//! machine sees the same set.
//!
//! Registration is explicit (`identity session --register`): nothing here is
//! called from a hook or a bare read. Liveness is the process facts of the
//! agent head (the highest ancestor holding a terminal), never of the
//! transient `fgos` child that registered it. The file name is derived from
//! the handle, so two sessions whose handles are equal contend for one name
//! and the atomic create-once decides, with no lock.
//!
//! The process facts are reached through an injected judge, so every rule
//! here is tested without real processes.

use crate::current::{current_session, os_record};
use crate::proc_tree::{os_process_tree, ProcessTree};
use crate::project;
use crate::refusal::Refusal;
use crate::resolve::terminal_head;
use crate::text::{base32_prefix, iso_utc_now};
use fgos_durable_file::{install_once_with_mode, replace_durably_with_mode, Installed};
use fgos_process::facts::{judge_here, Record, Verdict};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};

/// Entries the directory holds at most; a write past it is refused.
pub const MAX_ENTRIES: usize = 512;
/// Files looked at in one scan, so a flooded directory cannot stall a read.
const MAX_SCAN: usize = 2 * MAX_ENTRIES;
/// A role alias is this prefix and a Convention `lane-id`.
pub const ROLE_PREFIX: &str = "lead:";
const FORMAT_VERSION: u32 = 1;
const FILE_SUFFIX: &str = ".json";
const FILE_HASH_LENGTH: usize = 12;

/// Judges the recorded head process of an entry.
pub type Judge<'a> = &'a dyn Fn(&Record) -> Verdict;

/// One registered session.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub v: u32,
    /// `<machine-id>/<local id>`.
    pub id: String,
    pub handle: String,
    pub cli: String,
    pub project_id: Option<String>,
    /// Working directory the session registered from.
    pub clone: Option<String>,
    pub registered_at: String,
    /// Role aliases (`lead:MAIL`), sorted.
    pub roles: Vec<String>,
    /// The agent head as `Record::to_json`; `None` when the session has no
    /// terminal ancestor, so its liveness is unknown.
    pub liveness: Option<serde_json::Value>,
}

impl Entry {
    /// A fresh entry registered now.
    pub fn new(
        id: String,
        handle: String,
        cli: String,
        project_id: Option<String>,
        clone: Option<String>,
        roles: Vec<String>,
        liveness: Option<Record>,
    ) -> Self {
        Self {
            v: FORMAT_VERSION,
            id,
            handle,
            cli,
            project_id,
            clone,
            registered_at: iso_utc_now(),
            roles,
            liveness: liveness.map(|record| record.to_json()),
        }
    }

    fn verdict(&self, judge: Judge) -> Verdict {
        self.liveness
            .as_ref()
            .map_or(Verdict::Unknown, |value| judge(&Record::from_json(value)))
    }
}

/// An entry with what the judge said about it, as `resolve` and `list` print it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Listed {
    pub id: String,
    pub handle: String,
    pub cli: String,
    pub project_id: Option<String>,
    pub clone: Option<String>,
    pub registered_at: String,
    pub roles: Vec<String>,
    /// `alive`, or `unknown` when nothing can prove it dead.
    pub liveness: &'static str,
}

impl Listed {
    fn of(entry: &Entry, verdict: Verdict) -> Self {
        Self {
            id: entry.id.clone(),
            handle: entry.handle.clone(),
            cli: entry.cli.clone(),
            project_id: entry.project_id.clone(),
            clone: entry.clone.clone(),
            registered_at: entry.registered_at.clone(),
            roles: entry.roles.clone(),
            liveness: if verdict == Verdict::Alive { "alive" } else { "unknown" },
        }
    }
}

/// What `list` prints: the live sessions, and how many entries this call removed.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Sessions {
    pub sessions: Vec<Listed>,
    pub pruned: usize,
}

pub fn directory(state_root: &Path) -> PathBuf {
    state_root.join("identity").join("sessions")
}

fn file_name(handle: &str) -> String {
    let digest = Sha256::digest(handle.as_bytes());
    format!("{}{FILE_SUFFIX}", base32_prefix(&digest, FILE_HASH_LENGTH))
}

/// Why `role` is not a role alias, as a Convention code; `None` when it is.
pub fn role_problem(role: &str) -> Option<&'static str> {
    let Some(lane) = role.strip_prefix(ROLE_PREFIX) else {
        return Some("invalid-identifier");
    };
    fgos_convention::rules::packaged_rules()
        .identifier("lane-id")
        .expect("the Convention contract carries the lane-id kind")
        .check(lane)
        .err()
}

/// The agent head's process facts: the highest ancestor of the caller that
/// holds a terminal. `None` when no ancestor does (the liveness is unknown),
/// so the transient `fgos` child is never what is judged.
pub fn head_liveness(
    tree: &dyn ProcessTree,
    caller_pid: u32,
    record_of: &dyn Fn(u32) -> Option<Record>,
) -> Option<Record> {
    record_of(terminal_head(tree, caller_pid)?)
}

fn unreadable(path: &Path, error: impl std::fmt::Display) -> Refusal {
    Refusal {
        candidates: Vec::new(),
        reason: "directory-unreadable",
        detail: format!("{}: {error}", path.display()),
    }
}

fn write_failed(path: &Path, error: impl std::fmt::Display) -> Refusal {
    Refusal {
        candidates: Vec::new(),
        reason: "directory-write-failed",
        detail: format!("{}: {error}", path.display()),
    }
}

struct Row {
    file: String,
    entry: Entry,
    verdict: Verdict,
}

struct Scan {
    rows: Vec<Row>,
    /// Files of the directory that are not entries this build reads (another
    /// format version, or not ours): never touched, still counted.
    foreign: usize,
}

fn scan(root: &Path, judge: Judge) -> Result<Scan, Refusal> {
    let dir = directory(root);
    let reader = match fs::read_dir(&dir) {
        Ok(reader) => reader,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Scan { rows: Vec::new(), foreign: 0 }),
        Err(e) => return Err(unreadable(&dir, e)),
    };
    let mut rows = Vec::new();
    let mut foreign = 0;
    for item in reader.take(MAX_SCAN) {
        let item = item.map_err(|e| unreadable(&dir, e))?;
        let file = item.file_name().to_string_lossy().into_owned();
        if !file.ends_with(FILE_SUFFIX) {
            continue;
        }
        let entry = fs::read(item.path())
            .ok()
            .and_then(|bytes| serde_json::from_slice::<Entry>(&bytes).ok())
            .filter(|entry| entry.v == FORMAT_VERSION && file_name(&entry.handle) == file);
        match entry {
            Some(entry) => {
                let verdict = entry.verdict(judge);
                rows.push(Row { file, entry, verdict });
            }
            None => foreign += 1,
        }
    }
    Ok(Scan { rows, foreign })
}

fn remove(root: &Path, file: &str) -> Result<(), Refusal> {
    let path = directory(root).join(file);
    match fs::remove_file(&path) {
        Err(e) if e.kind() != std::io::ErrorKind::NotFound => Err(write_failed(&path, e)),
        _ => Ok(()),
    }
}

/// Removes the rows `doomed` selects and returns the rows left and how many went.
fn sweep(root: &Path, rows: Vec<Row>, doomed: impl Fn(&Row) -> bool) -> Result<(Vec<Row>, usize), Refusal> {
    let (gone, kept): (Vec<Row>, Vec<Row>) = rows.into_iter().partition(|row| doomed(row));
    for row in &gone {
        remove(root, &row.file)?;
    }
    Ok((kept, gone.len()))
}

fn store(root: &Path, entry: &Entry, replace: bool) -> Result<Installed, Refusal> {
    let dir = directory(root);
    let mut bytes = serde_json::to_vec(entry).expect("Entry always serializes");
    bytes.push(b'\n');
    let name = file_name(&entry.handle);
    let result = if replace {
        replace_durably_with_mode(&dir, &name, &bytes, 0o600)
    } else {
        install_once_with_mode(&dir, &name, &bytes, 0o600)
    };
    result.map_err(|e| write_failed(&dir.join(&name), e))
}

fn handle_in_use(registered: &str, wanted: &str, handle: &str) -> Refusal {
    Refusal {
        candidates: Vec::new(),
        reason: "handle-in-use",
        detail: format!(
            "handle {handle} is already registered by the live session {registered}; {wanted} cannot take it (handles never change)"
        ),
    }
}

/// Registers `entry`, refreshing the entry the same session already has.
///
/// Every call first removes the entries whose head process is dead. A live
/// session that already holds the handle with another id refuses the call; a
/// role held by another live session refuses it too unless `take`, which
/// removes the role from the holder. At [`MAX_ENTRIES`] the call is refused.
pub fn register(root: &Path, entry: Entry, take: bool, judge: Judge) -> Result<Listed, Refusal> {
    if let Some(role) = entry.roles.iter().find(|role| role_problem(role).is_some()) {
        return Err(Refusal {
            candidates: Vec::new(),
            reason: "invalid-role",
            detail: format!("role {role:?} is not `{ROLE_PREFIX}<LANE>` with a Convention lane-id"),
        });
    }
    let dir = directory(root);
    fs::create_dir_all(&dir).map_err(|e| write_failed(&dir, e))?;
    let Scan { rows, foreign } = scan(root, judge)?;
    let (rows, _) = sweep(root, rows, |row| row.verdict == Verdict::Dead)?;

    let own = rows.iter().find(|row| row.entry.handle == entry.handle);
    if let Some(row) = own.filter(|row| row.entry.id != entry.id) {
        return Err(handle_in_use(&row.entry.id, &entry.id, &entry.handle));
    }
    for role in &entry.roles {
        let holder = rows
            .iter()
            .find(|row| row.entry.id != entry.id && row.entry.roles.contains(role));
        if let (Some(holder), false) = (holder, take) {
            return Err(Refusal {
                candidates: Vec::new(),
                reason: "role-held",
                detail: format!(
                    "{role} is held by the live session {}; pass --take to move it to {}",
                    holder.entry.handle, entry.handle
                ),
            });
        }
    }
    if own.is_none() && rows.len() + foreign >= MAX_ENTRIES {
        return Err(Refusal {
            candidates: Vec::new(),
            reason: "directory-full",
            detail: format!(
                "the session directory holds {MAX_ENTRIES} entries; run `fgos identity list --prune` to drop the dead ones (an entry whose liveness is unknown is never removed automatically)"
            ),
        });
    }

    let mut merged = entry;
    if let Some(row) = own {
        merged.registered_at = row.entry.registered_at.clone();
        merged.roles.extend(row.entry.roles.iter().cloned());
        merged.roles.sort();
        merged.roles.dedup();
    }
    match store(root, &merged, own.is_some())? {
        Installed::Created => {}
        // Another registration took this name between the scan and the
        // create: the same session refreshes it, any other is refused.
        Installed::AlreadyExists => {
            let current = scan(root, judge)?
                .rows
                .into_iter()
                .find(|row| row.entry.handle == merged.handle);
            match current {
                Some(row) if row.entry.id != merged.id => {
                    return Err(handle_in_use(&row.entry.id, &merged.id, &merged.handle))
                }
                _ => {
                    store(root, &merged, true)?;
                }
            }
        }
    }
    for row in rows.iter().filter(|row| {
        row.entry.id != merged.id && row.entry.roles.iter().any(|role| merged.roles.contains(role))
    }) {
        let mut holder = row.entry.clone();
        holder.roles.retain(|role| !merged.roles.contains(role));
        store(root, &holder, true)?;
    }
    Ok(Listed::of(&merged, merged.verdict(judge)))
}

/// Registers the session the process `caller_pid` is, from the real env and
/// OS process tree: resolves its full id and handle, the project of
/// `clone_dir` (none when it is not a registered project), the agent head's
/// liveness record, and calls [`register`] with `roles` (and `take`).
///
/// The cost is bounded for a hook on the first tool call of a head: no
/// network, no lock (the entry is a create-once file named by the handle),
/// one durable write, and a directory scan of at most [`MAX_ENTRIES`] files.
/// The CLI's `identity session --register` is this function.
pub fn register_current(
    state_root: &Path,
    caller_pid: u32,
    fgos_dir: Option<&Path>,
    clone_dir: Option<&Path>,
    roles: &[String],
    take: bool,
) -> Result<Listed, Refusal> {
    let current = current_session(state_root, caller_pid, fgos_dir)?;
    let project_id = clone_dir
        .and_then(|dir| project::project_info(state_root, dir).ok())
        .map(|project| project.id);
    let tree = os_process_tree();
    let entry = Entry::new(
        current.info.id,
        current.info.handle,
        current.local.cli.to_owned(),
        project_id,
        clone_dir.map(|dir| dir.display().to_string()),
        roles.to_vec(),
        head_liveness(tree.as_ref(), caller_pid, &os_record),
    );
    register(state_root, entry, take, &judge_here)
}

/// The live session `query` names: a handle, or a role alias `lead:<LANE>`.
/// Exactly one, else `ambiguous` or `not-found` with the candidates in the
/// detail (the codes the mailbox uses for its names).
pub fn resolve(root: &Path, query: &str, judge: Judge) -> Result<Listed, Refusal> {
    let query = query.trim();
    let live = scan(root, judge)?
        .rows
        .into_iter()
        .filter(|row| row.verdict != Verdict::Dead)
        .collect::<Vec<_>>();
    let is_role = query.starts_with(ROLE_PREFIX);
    let hits: Vec<&Row> = live
        .iter()
        .filter(|row| {
            if is_role {
                row.entry.roles.iter().any(|role| role == query)
            } else {
                row.entry.handle == query
            }
        })
        .collect();
    match hits.as_slice() {
        [row] => Ok(Listed::of(&row.entry, row.verdict)),
        [] => {
            let names: Vec<String> = live
                .iter()
                .flat_map(|row| {
                    if is_role {
                        row.entry.roles.clone()
                    } else {
                        vec![row.entry.handle.clone()]
                    }
                })
                .filter(|name| !query.is_empty() && name.contains(query))
                .collect();
            Err(Refusal {
                reason: "not-found",
                detail: format!("no live session is named {query:?}; candidates: {}", join(&names)),
                candidates: names,
            })
        }
        many => {
            let ids: Vec<String> = many.iter().map(|row| format!("{} ({})", row.entry.handle, row.entry.id)).collect();
            Err(Refusal {
                reason: "ambiguous",
                detail: format!("{query:?} names {} live sessions: {}", many.len(), join(&ids)),
                candidates: ids,
            })
        }
    }
}

fn join(names: &[String]) -> String {
    if names.is_empty() {
        "none".into()
    } else {
        names.join(", ")
    }
}

/// The sessions the machine knows that are not dead, oldest registration
/// first; only those of `project_id` when given. With `prune`, entries
/// proven dead are removed first, the rule of the prune on every write; an
/// entry of unknown liveness may be a live session and is never removed.
pub fn list(root: &Path, project_id: Option<&str>, prune: bool, judge: Judge) -> Result<Sessions, Refusal> {
    let Scan { rows, .. } = scan(root, judge)?;
    let (rows, pruned) = sweep(root, rows, |row| {
        if prune {
            row.verdict == Verdict::Dead
        } else {
            false
        }
    })?;
    let mut sessions: Vec<Listed> = rows
        .iter()
        .filter(|row| row.verdict != Verdict::Dead)
        .filter(|row| project_id.is_none_or(|id| row.entry.project_id.as_deref() == Some(id)))
        .map(|row| Listed::of(&row.entry, row.verdict))
        .collect();
    sessions.sort_by(|a, b| (&a.registered_at, &a.handle).cmp(&(&b.registered_at, &b.handle)));
    Ok(Sessions { sessions, pruned })
}
