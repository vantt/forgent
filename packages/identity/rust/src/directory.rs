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

use crate::current::{
    current_session, machine_info, os_record, read_head, session_for, CurrentSession,
};
use crate::proc_tree::{os_process_tree, ProcessTree};
use crate::project;
use crate::refusal::{Candidate, Liveness, Refusal, Remote};
use crate::resolve::{terminal_head, HeadRef, WriterKey};
use crate::shared::SharedView;
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
/// The role kinds: a role alias is a prefix and a name of the Convention
/// identifier kind beside it. This list is the one place that knows them.
pub const ROLE_KINDS: [(&str, &str); 3] = [
    ("lead:", "lane-id"),
    ("work:", "work-item-id"),
    ("head:", "head-name"),
];
/// What a refused role is not, for the refusal detail.
const ROLE_SHAPE: &str =
    "`lead:<LANE>` with a Convention lane-id, `work:<name>` with a Convention work-item-id or `head:<persona>-<name>` with a Convention head-name";
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
    /// Role aliases (`lead:MAIL`, `work:tsk-4f2a9c1b3d`), sorted.
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
    /// `alive`, `unknown` when nothing can prove it dead, or `remote`.
    pub liveness: Liveness,
    /// Set only for a session of another machine (flattened into the object).
    #[serde(flatten, skip_serializing_if = "Option::is_none")]
    pub remote: Option<Remote>,
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
            liveness: liveness_of(verdict),
            remote: None,
        }
    }
}

fn liveness_of(verdict: Verdict) -> Liveness {
    if verdict == Verdict::Alive {
        Liveness::Alive
    } else {
        Liveness::Unknown
    }
}

fn candidate_of(row: &Row) -> Candidate {
    Candidate {
        id: row.entry.id.clone(),
        handle: row.entry.handle.clone(),
        liveness: liveness_of(row.verdict),
        remote: None,
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
    let Some((prefix, kind)) = ROLE_KINDS
        .iter()
        .find(|(prefix, _)| role.starts_with(prefix))
    else {
        return Some("invalid-identifier");
    };
    fgos_convention::rules::packaged_rules()
        .identifier(kind)
        .expect("the Convention contract carries every role kind")
        .check(&role[prefix.len()..])
        .err()
}

/// Whether `query` is shaped as a role alias (a role kind's prefix) rather
/// than a handle; the name after the prefix is not checked here.
pub fn is_role_alias(query: &str) -> bool {
    ROLE_KINDS
        .iter()
        .any(|(prefix, _)| query.starts_with(prefix))
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
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            return Ok(Scan {
                rows: Vec::new(),
                foreign: 0,
            })
        }
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
                rows.push(Row {
                    file,
                    entry,
                    verdict,
                });
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
fn sweep(
    root: &Path,
    rows: Vec<Row>,
    doomed: impl Fn(&Row) -> bool,
) -> Result<(Vec<Row>, usize), Refusal> {
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

/// Whether the directory already holds [`MAX_ENTRIES`] entry files, counted by
/// name alone (no read, no parse, no liveness judgment).
fn holds_cap(root: &Path) -> Result<bool, Refusal> {
    let dir = directory(root);
    let reader = fs::read_dir(&dir).map_err(|e| unreadable(&dir, e))?;
    let mut count = 0;
    for item in reader.take(MAX_SCAN) {
        let item = item.map_err(|e| unreadable(&dir, e))?;
        if item.file_name().to_string_lossy().ends_with(FILE_SUFFIX) {
            count += 1;
            if count >= MAX_ENTRIES {
                return Ok(true);
            }
        }
    }
    Ok(false)
}

/// The one entry file named after `handle`, judged; `None` when it is missing
/// or this build cannot read it (another format version, or not ours).
fn read_named(root: &Path, handle: &str, judge: Judge) -> Option<Row> {
    let file = file_name(handle);
    let entry = fs::read(directory(root).join(&file))
        .ok()
        .and_then(|bytes| serde_json::from_slice::<Entry>(&bytes).ok())
        .filter(|entry| entry.v == FORMAT_VERSION && file_name(&entry.handle) == file)?;
    let verdict = entry.verdict(judge);
    Some(Row {
        file,
        entry,
        verdict,
    })
}

/// Registration of an entry that takes no role into a directory below its cap:
/// the atomic create of the handle-named file, and only when the name is
/// taken, a read of that one entry. A dead holder is replaced, the same
/// session refreshes, any other is refused `handle-in-use`. No scan, no prune.
fn register_by_handle(root: &Path, entry: Entry, judge: Judge) -> Result<Listed, Refusal> {
    let mut merged = entry;
    if store(root, &merged, false)? == Installed::Created {
        return Ok(Listed::of(&merged, merged.verdict(judge)));
    }
    let mut holder = read_named(root, &merged.handle, judge);
    if let Some(row) = holder.as_ref().filter(|row| row.verdict == Verdict::Dead) {
        remove(root, &row.file)?;
        if store(root, &merged, false)? == Installed::Created {
            return Ok(Listed::of(&merged, merged.verdict(judge)));
        }
        // Another registration took the name in between: it decides now.
        holder = read_named(root, &merged.handle, judge);
    }
    if let Some(row) = holder {
        if row.entry.id != merged.id {
            return Err(handle_in_use(&row.entry.id, &merged.id, &merged.handle));
        }
        refresh_from(&mut merged, &row.entry);
    }
    store(root, &merged, true)?;
    Ok(Listed::of(&merged, merged.verdict(judge)))
}

/// `merged` keeps the first registration time and the roles `held` already has.
fn refresh_from(merged: &mut Entry, held: &Entry) {
    merged.registered_at = held.registered_at.clone();
    merged.roles.extend(held.roles.iter().cloned());
    merged.roles.sort();
    merged.roles.dedup();
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
/// A live or unknown session that already holds the handle with another id
/// refuses the call; a dead one is replaced. A call that takes no role in a
/// directory below [`MAX_ENTRIES`] reads at most that one entry. A call that
/// takes a role, or finds the directory at its cap, first scans the whole
/// directory and removes the entries whose head process is dead; a role held
/// by another live session then refuses the call unless `take`, which removes
/// the role from the holder, and at [`MAX_ENTRIES`] the call is refused.
pub fn register(root: &Path, entry: Entry, take: bool, judge: Judge) -> Result<Listed, Refusal> {
    if let Some(role) = entry.roles.iter().find(|role| role_problem(role).is_some()) {
        return Err(Refusal {
            candidates: Vec::new(),
            reason: "invalid-role",
            detail: format!("role {role:?} is not {ROLE_SHAPE}"),
        });
    }
    let dir = directory(root);
    fs::create_dir_all(&dir).map_err(|e| write_failed(&dir, e))?;
    if entry.roles.is_empty() && !holds_cap(root)? {
        return register_by_handle(root, entry, judge);
    }
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
        refresh_from(&mut merged, &row.entry);
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
        row.entry.id != merged.id
            && row
                .entry
                .roles
                .iter()
                .any(|role| merged.roles.contains(role))
    }) {
        let mut holder = row.entry.clone();
        holder.roles.retain(|role| !merged.roles.contains(role));
        store(root, &holder, true)?;
    }
    Ok(Listed::of(&merged, merged.verdict(judge)))
}

/// Registers `session` on this machine with `head` as the liveness record:
/// the project of `clone_dir` (none when it is not a registered project) and
/// [`register`] with `roles` (and `take`). The one registration body behind
/// [`register_current`] and [`register_writer`].
fn register_session(
    state_root: &Path,
    session: CurrentSession,
    head: Option<Record>,
    clone_dir: Option<&Path>,
    roles: &[String],
    take: bool,
) -> Result<Listed, Refusal> {
    let project_id = clone_dir
        .and_then(|dir| project::project_info(state_root, dir).ok())
        .map(|project| project.id);
    let entry = Entry::new(
        session.info.id,
        session.info.handle,
        session.local.cli.to_owned(),
        project_id,
        clone_dir.map(|dir| dir.display().to_string()),
        roles.to_vec(),
        head,
    );
    register(state_root, entry, take, &judge_here)
}

/// Registers the session the process `caller_pid` is, from the real env and
/// OS process tree: resolves its full id and handle, the project of
/// `clone_dir` (none when it is not a registered project), the agent head's
/// liveness record, and calls [`register`] with `roles` (and `take`).
///
/// The cost is bounded for a hook on the first tool call of a head: no
/// network, no lock (the entry is a create-once file named by the handle),
/// one durable write, and no directory scan unless the call takes a role or
/// the directory is at its cap (see [`register`]).
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
    let tree = os_process_tree();
    let head = head_liveness(tree.as_ref(), caller_pid, &os_record);
    register_session(state_root, current, head, clone_dir, roles, take)
}

/// Registers the session a hook-carried `key` names, for a caller whose own
/// env does not carry it (a Codex hook process has no `CODEX_THREAD_ID`).
/// `head` is the agent head the caller already checked, by pid and start
/// time; its process facts are read here and recorded as the entry's
/// liveness. Refused `invalid-writer-key` (see [`session_for`]) and
/// `head-not-live` when the head cannot be read, is not running, or has a
/// different start time (the detail says which); every other rule is
/// [`register`]'s.
pub fn register_writer(
    state_root: &Path,
    clone_dir: Option<&Path>,
    key: &WriterKey,
    head: &HeadRef,
    roles: &[String],
    take: bool,
) -> Result<Listed, Refusal> {
    let session = session_for(state_root, key, Some(head))?;
    let record = read_head(head).map_err(|detail| Refusal {
        reason: "head-not-live",
        detail,
        candidates: Vec::new(),
    })?;
    register_session(state_root, session, Some(record), clone_dir, roles, take)
}

/// Whether the head process recorded as `entry`'s liveness is the one `head` names (same pid, same start time).
fn on_head(entry: &Entry, head: &HeadRef) -> bool {
    entry
        .liveness
        .as_ref()
        .map(Record::from_json)
        .is_some_and(|record| {
            record.pid.map(|pid| pid.0) == Some(head.pid)
                && record.start_time.as_deref() == Some(head.start_time.as_str())
        })
}

/// Whether `entry` is a runner attempt's own entry (its local id is an attempt writer id): never an agent session.
fn is_attempt_entry(entry: &Entry) -> bool {
    entry
        .id
        .split_once('/')
        .is_some_and(|(_, local)| crate::attempt::is_attempt_writer_id(local))
}

/// Whether `pid` is `ancestor` or one of its descendants, walking parents up the process table.
fn descends(tree: &dyn ProcessTree, mut pid: u32, ancestor: u32) -> bool {
    for _ in 0..MAX_ANCESTRY_WALK {
        if pid == ancestor {
            return true;
        }
        match tree.stat(pid) {
            Some(stat) if stat.ppid != 0 && stat.ppid != pid => pid = stat.ppid,
            _ => return false,
        }
    }
    false
}

/// Whether the process `caller_pid` (as the kernel names it) runs under the live `head`: the head itself or one of its
/// descendants. Refused `head-not-live` when the head is not running with its start time, `caller-not-under-head`
/// otherwise. The check [`bind_agent_session`] makes; a supervisor makes it for any request that must come from the
/// agent it launched.
pub fn caller_under_head(head: &HeadRef, caller_pid: u32) -> Result<(), Refusal> {
    under_head_in(head, caller_pid, os_process_tree().as_ref()).map(|_| ())
}

fn under_head_in(
    head: &HeadRef,
    caller_pid: u32,
    tree: &dyn ProcessTree,
) -> Result<fgos_process::facts::Record, Refusal> {
    let record = read_head(head).map_err(|detail| refused("head-not-live", detail))?;
    if !descends(tree, caller_pid, head.pid) {
        return Err(refused(
            "caller-not-under-head",
            format!(
                "process {caller_pid} does not run under the head {}",
                head.pid
            ),
        ));
    }
    Ok(record)
}

/// Upper bound on parent hops when a caller is checked against a head, so a cyclic table stops.
const MAX_ANCESTRY_WALK: usize = 4096;

fn refused(reason: &'static str, detail: String) -> Refusal {
    Refusal {
        candidates: Vec::new(),
        reason,
        detail,
    }
}

/// Binds the agent session an attempt runs to that attempt: a runner attempt (writer key `attempt`, registered with
/// its gate `head` as liveness) launches an agent CLI that names itself by its own session variable (`agent`). The
/// agent's session is registered with the same head and takes every role the attempt holds, so the role resolves to the
/// session the agent, its hooks and its mail are keyed by, under the CLI's own label. The two entries share one head and
/// end together.
///
/// Refused `invalid-writer-key` when `agent` is not a CLI session variable's key (an attempt id is never an agent
/// session), `head-not-live` when the head is not running with its start time, `caller-not-under-head` when
/// `caller_pid` (the process that asks, as the kernel names it) is neither the head nor one of its descendants,
/// `attempt-not-registered` when the attempt has no live entry on that head, and `session-in-use` when the agent's id
/// is already a live session on another head. Every other rule is [`register`]'s.
pub fn bind_agent_session(
    state_root: &Path,
    clone_dir: Option<&Path>,
    attempt: &WriterKey,
    agent: &WriterKey,
    head: &HeadRef,
    caller_pid: u32,
) -> Result<Listed, Refusal> {
    bind_agent_session_in(
        state_root,
        clone_dir,
        attempt,
        agent,
        head,
        caller_pid,
        os_process_tree().as_ref(),
    )
}

fn bind_agent_session_in(
    state_root: &Path,
    clone_dir: Option<&Path>,
    attempt: &WriterKey,
    agent: &WriterKey,
    head: &HeadRef,
    caller_pid: u32,
    tree: &dyn ProcessTree,
) -> Result<Listed, Refusal> {
    if agent.checked().is_none_or(|(source, value)| {
        source == crate::resolve::ENV_ORDER[0] || crate::attempt::is_attempt_writer_id(value)
    }) {
        return Err(refused(
            "invalid-writer-key",
            format!(
                "{:?} does not name an agent session: the source must be a CLI's own session variable ({}) and the value a usable id",
                agent.source,
                crate::resolve::ENV_ORDER[1..].join(", ")
            ),
        ));
    }
    let record = under_head_in(head, caller_pid, tree)?;
    let own = session_for(state_root, attempt, None)?;
    let rows = scan(state_root, &judge_here)?.rows;
    let live_on_head = |row: &&Row| row.verdict != Verdict::Dead && on_head(&row.entry, head);
    let Some(attempt_row) = rows
        .iter()
        .filter(live_on_head)
        .find(|row| row.entry.id == own.info.id)
    else {
        return Err(refused(
            "attempt-not-registered",
            format!(
                "{} has no live entry on the head {}; the supervisor registers it when the gate starts",
                own.info.id, head.pid
            ),
        ));
    };
    let session = session_for(state_root, agent, Some(head))?;
    if let Some(other) = rows.iter().find(|row| {
        row.entry.id == session.info.id
            && row.verdict != Verdict::Dead
            && !on_head(&row.entry, head)
    }) {
        return Err(refused(
            "session-in-use",
            format!(
                "{} is already the live session {} on another head; an attempt binds only its own agent session",
                session.info.id, other.entry.handle
            ),
        ));
    }
    // A second bind on the same live head (the CLI started a new session, e.g. after `/clear`) moves the roles from
    // the session bound before and retires that entry, so the head has one current binding.
    let previous: Vec<&Row> = rows
        .iter()
        .filter(live_on_head)
        .filter(|row| !is_attempt_entry(&row.entry) && row.entry.id != session.info.id)
        .collect();
    let mut roles = attempt_row.entry.roles.clone();
    roles.extend(
        previous
            .iter()
            .flat_map(|row| row.entry.roles.iter().cloned()),
    );
    roles.sort();
    roles.dedup();
    let listed = register_session(state_root, session, Some(record), clone_dir, &roles, true)?;
    for row in previous {
        remove(state_root, &row.file)?;
    }
    Ok(listed)
}

/// The one agent session currently bound on `head` among `rows`: the live entry on that head that is not an attempt
/// entry and was registered last ([`bind_agent_session`] retires the one before it, so a second one is only left by a
/// bind that stopped between its two writes). Ties break on the id, so the answer never depends on the scan order.
fn current_binding<'r>(rows: &'r [Row], head: &HeadRef) -> Option<&'r Row> {
    rows.iter()
        .filter(|row| {
            row.verdict != Verdict::Dead
                && !is_attempt_entry(&row.entry)
                && on_head(&row.entry, head)
        })
        .max_by(|a, b| {
            (a.entry.registered_at.as_str(), a.entry.id.as_str())
                .cmp(&(b.entry.registered_at.as_str(), b.entry.id.as_str()))
        })
}

/// The session the attempt of writer key `attempt` is now: the agent session bound to it on `head`
/// ([`bind_agent_session`]) when one is live, else the attempt's own entry when it is live, else `None`. Without a head
/// only the attempt's own entry is looked at.
pub fn attempt_session(
    state_root: &Path,
    attempt: &WriterKey,
    head: Option<&HeadRef>,
    judge: Judge,
) -> Result<Option<Listed>, Refusal> {
    let own = session_for(state_root, attempt, None)?;
    let rows = scan(state_root, judge)?.rows;
    let bound = head.and_then(|head| current_binding(&rows, head));
    Ok(bound
        .or_else(|| {
            rows.iter()
                .find(|row| row.verdict != Verdict::Dead && row.entry.id == own.info.id)
        })
        .map(|row| Listed::of(&row.entry, row.verdict)))
}

/// Registers `roles` (with `take`) for the session the attempt is ([`attempt_session`]): the agent session bound on
/// `head` when there is one, else the attempt's own key through [`register_writer`].
pub fn register_attempt_roles(
    state_root: &Path,
    clone_dir: Option<&Path>,
    attempt: &WriterKey,
    head: &HeadRef,
    roles: &[String],
    take: bool,
) -> Result<Listed, Refusal> {
    let rows = scan(state_root, &judge_here)?.rows;
    match current_binding(&rows, head) {
        Some(row) => {
            let mut entry = row.entry.clone();
            entry.roles = roles.to_vec();
            register(state_root, entry, take, &judge_here)
        }
        None => register_writer(state_root, clone_dir, attempt, head, roles, take),
    }
}

/// The agent session bound to the attempt `attempt_local` ([`bind_agent_session`]), read from the two entries alone:
/// the agent entry named by `agent_handles` (the handles its key may carry) shares the attempt entry's head and both
/// are not dead. Returns the agent entry's id and CLI label.
pub(crate) fn bound_agent(
    state_root: &Path,
    attempt_handle: &str,
    agent_handles: &[String],
    judge: Judge,
) -> Option<(String, String)> {
    let attempt = read_named(state_root, attempt_handle, judge)?;
    let record = Record::from_json(attempt.entry.liveness.as_ref()?);
    let head = HeadRef {
        pid: record.pid?.0,
        start_time: record.start_time?,
    };
    if attempt.verdict == Verdict::Dead {
        return None;
    }
    agent_handles
        .iter()
        .filter_map(|handle| read_named(state_root, handle, judge))
        .find(|row| {
            row.verdict != Verdict::Dead
                && !is_attempt_entry(&row.entry)
                && on_head(&row.entry, &head)
        })
        .map(|row| (row.entry.id, row.entry.cli))
}

/// Removes `role` from the entry of the session `own_id`, and from no other:
/// a session drops only what it holds itself, so a role of another live
/// session can only move through `take` on a registration. Refused
/// `invalid-role`, `not-registered` when `own_id` has no entry, and
/// `role-not-held` when its entry lacks the role. Afterwards the role
/// resolves `not-found` unless another session holds it.
pub fn drop_role(root: &Path, own_id: &str, role: &str, judge: Judge) -> Result<Listed, Refusal> {
    if role_problem(role).is_some() {
        return Err(Refusal {
            candidates: Vec::new(),
            reason: "invalid-role",
            detail: format!("role {role:?} is not {ROLE_SHAPE}"),
        });
    }
    let Scan { rows, .. } = scan(root, judge)?;
    let Some(row) = rows.iter().find(|row| row.entry.id == own_id) else {
        return Err(Refusal {
            candidates: Vec::new(),
            reason: "not-registered",
            detail: format!(
                "{own_id} is not in the session directory, so it holds no role; register it first"
            ),
        });
    };
    if !row.entry.roles.iter().any(|held| held == role) {
        return Err(Refusal {
            candidates: rows
                .iter()
                .filter(|other| {
                    other.verdict != Verdict::Dead
                        && other.entry.roles.iter().any(|held| held == role)
                })
                .map(candidate_of)
                .collect(),
            reason: "role-not-held",
            detail: format!(
                "{} does not hold {role}; it holds: {}",
                row.entry.handle,
                join(&row.entry.roles)
            ),
        });
    }
    let mut entry = row.entry.clone();
    entry.roles.retain(|held| held != role);
    store(root, &entry, true)?;
    Ok(Listed::of(&entry, row.verdict))
}

/// [`drop_role`] for the session the process `caller_pid` is.
pub fn drop_current_role(
    state_root: &Path,
    caller_pid: u32,
    fgos_dir: Option<&Path>,
    role: &str,
) -> Result<Listed, Refusal> {
    let current = current_session(state_root, caller_pid, fgos_dir)?;
    drop_role(state_root, &current.info.id, role, &judge_here)
}

/// The live session `query` names: a handle, a role alias (`lead:<LANE>`, `work:<name>`), or a
/// full id `<machine-id>/<local id>`. Exactly one, else `ambiguous` or
/// `not-found` with the candidates in the detail and in `Refusal::candidates`
/// (Identity's own codes; the mailbox maps them to its names). Local first:
/// only when this machine's directory has no answer does `shared` (the
/// sessions other machines published) get asked; a full id of another machine
/// resolves through it, and is `not-found` without it.
pub fn resolve(
    root: &Path,
    query: &str,
    judge: Judge,
    shared: Option<&SharedView>,
) -> Result<Listed, Refusal> {
    let query = query.trim();
    if let Some((machine_id, _)) = query.split_once('/') {
        return resolve_full_id(root, machine_id, query, judge, shared);
    }
    let live = scan(root, judge)?
        .rows
        .into_iter()
        .filter(|row| row.verdict != Verdict::Dead)
        .collect::<Vec<_>>();
    let is_role = is_role_alias(query);
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
            let mut missing = Refusal {
                reason: "not-found",
                detail: format!(
                    "no live session is named {query:?}; candidates: {}",
                    join(&names)
                ),
                candidates: live
                    .iter()
                    .filter(|row| {
                        !query.is_empty()
                            && if is_role {
                                row.entry.roles.iter().any(|role| role.contains(query))
                            } else {
                                row.entry.handle.contains(query)
                            }
                    })
                    .map(candidate_of)
                    .collect(),
            };
            match shared.map(|view| view.resolve(query)) {
                Some(Ok(listed)) => Ok(listed),
                Some(Err(refusal)) if refusal.reason == "ambiguous" => Err(refusal),
                Some(Err(refusal)) => {
                    missing.candidates.extend(refusal.candidates);
                    Err(missing)
                }
                None => Err(missing),
            }
        }
        many => {
            let ids: Vec<String> = many
                .iter()
                .map(|row| format!("{} ({})", row.entry.handle, row.entry.id))
                .collect();
            let candidates = many.iter().map(|row| candidate_of(row)).collect();
            Err(Refusal {
                reason: "ambiguous",
                detail: format!(
                    "{query:?} names {} live sessions: {}",
                    many.len(),
                    join(&ids)
                ),
                candidates,
            })
        }
    }
}

fn resolve_full_id(
    root: &Path,
    machine_id: &str,
    id: &str,
    judge: Judge,
    shared: Option<&SharedView>,
) -> Result<Listed, Refusal> {
    let not_found = |detail: String| Refusal {
        reason: "not-found",
        detail,
        candidates: Vec::new(),
    };
    if machine_info(root)?.id != machine_id {
        return match shared {
            Some(view) => view.resolve(id),
            None => Err(not_found(format!(
                "{id:?} names a session of machine {machine_id:?}, not this one, and no shared directory is available here (a project id and `fgos events sync` bring other machines' sessions)"
            ))),
        };
    }
    scan(root, judge)?
        .rows
        .iter()
        .find(|row| row.entry.id == id && row.verdict != Verdict::Dead)
        .map(|row| Listed::of(&row.entry, row.verdict))
        .ok_or_else(|| not_found(format!("no live session has the id {id:?}")))
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
/// The sessions of `shared` follow the local ones, without a role a live
/// local session holds.
pub fn list(
    root: &Path,
    project_id: Option<&str>,
    prune: bool,
    judge: Judge,
    shared: Option<&SharedView>,
) -> Result<Sessions, Refusal> {
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
    if let Some(view) = shared {
        let taken: Vec<String> = sessions
            .iter()
            .flat_map(|session| session.roles.clone())
            .collect();
        sessions.extend(view.list(project_id, &taken));
    }
    Ok(Sessions { sessions, pruned })
}
