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
//!
//! An entry also holds the session's other identifiers (`ids`: its CLI
//! session, terminal pane, mailbox name and head generation), each group
//! owned by one writer and replaced whole. Creating an entry stays lock-free;
//! every read-modify-write of an existing entry runs under the machine mutex
//! `identity-directory`, so a role move and an identifier refresh never lose
//! each other's change. [`resolve`] finds a session by any of its identifiers.

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
use fgos_holder_lock::{LockScope, ScopeError, Wait};
use fgos_process::facts::{judge_here, Record, Verdict};
use fgos_process::ProcId;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
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
/// Still 1: `ids` is additive, so an older build reads the entry and ignores it.
const FORMAT_VERSION: u32 = 1;
const FILE_SUFFIX: &str = ".json";
const FILE_HASH_LENGTH: usize = 12;
/// Version of the `ids` block of an entry.
const IDS_VERSION: u32 = 1;
/// Longest identifier value an entry keeps, so a caller cannot bloat the file every scan reads.
const MAX_ID_VALUE: usize = 1024;
/// Registry name of the machine mutex around every rewrite of an existing entry.
const LOCK_NAME: &str = "identity-directory";
/// How long a rewrite waits for that lock; a rewrite holds it for milliseconds, so a longer wait means something
/// is stuck, and the caller is better told (`directory-busy`) than held.
const LOCK_WAIT_MS: u64 = 2_000;

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
    /// The session's other identifiers; absent in an entry written before
    /// they existed or by a writer that knows none.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ids: Option<Ids>,
}

/// The identifiers a session carries besides its id, handle and roles. Each
/// group has one writer and a write replaces a group whole ([`merge_ids`]),
/// so a stale value is replaced, never accumulated.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Ids {
    /// [`IDS_VERSION`]; set by the merge, whatever the caller passed.
    #[serde(default)]
    pub v: u32,
    /// When a group last changed; set by the merge.
    #[serde(default)]
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cli_session: Option<CliSessionIds>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub terminal: Option<TerminalIds>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mailbox: Option<MailboxIds>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub head: Option<HeadIds>,
}

/// The agent CLI's own session: its id, name and messaging socket, and the
/// process that serves that socket (a new one on every CLI restart).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CliSessionIds {
    /// Where the id was read (the CLI's session variable, or its sessions file).
    pub source: String,
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    /// Where the name came from (the CLI's own name, or one given by `/rename`).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name_source: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub socket: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pid: Option<u32>,
    /// Start time text of `pid` (`fgos_process::facts::Record::start_time`), so a reused pid is told apart.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub start_time: Option<String>,
}

/// The terminal pane the session runs in. The tab label is not kept: it is
/// renamed freely, so [`resolve`] reads it live through a [`TerminalPort`].
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalIds {
    /// The terminal driver (`herdr`).
    pub driver: String,
    /// The supervisor's slot key, for a supervised head.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,
    pub pane_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tab_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub workspace_id: Option<String>,
}

/// The mailbox name the session receives under, in the project of `fgos_dir`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MailboxIds {
    pub fgos_dir: String,
    pub name: String,
}

/// The supervised head this session is: persona, name and generation (one
/// more on every rotation; each generation is its own entry).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HeadIds {
    pub persona: String,
    pub name: String,
    pub gen: u64,
}

impl Ids {
    /// Why these identifiers cannot be recorded; `None` when they can.
    fn problem(&self) -> Option<String> {
        let mut values: Vec<(&str, Option<&str>, bool)> = Vec::new();
        if let Some(cli) = &self.cli_session {
            values.extend([
                ("cliSession.source", Some(cli.source.as_str()), true),
                ("cliSession.id", Some(cli.id.as_str()), true),
                ("cliSession.name", cli.name.as_deref(), false),
                ("cliSession.nameSource", cli.name_source.as_deref(), false),
                ("cliSession.socket", cli.socket.as_deref(), false),
                ("cliSession.startTime", cli.start_time.as_deref(), false),
            ]);
        }
        if let Some(terminal) = &self.terminal {
            values.extend([
                ("terminal.driver", Some(terminal.driver.as_str()), true),
                ("terminal.key", terminal.key.as_deref(), false),
                ("terminal.paneId", Some(terminal.pane_id.as_str()), true),
                ("terminal.tabId", terminal.tab_id.as_deref(), false),
                (
                    "terminal.workspaceId",
                    terminal.workspace_id.as_deref(),
                    false,
                ),
            ]);
        }
        if let Some(mailbox) = &self.mailbox {
            values.extend([
                ("mailbox.fgosDir", Some(mailbox.fgos_dir.as_str()), true),
                ("mailbox.name", Some(mailbox.name.as_str()), true),
            ]);
        }
        if let Some(head) = &self.head {
            values.extend([
                ("head.persona", Some(head.persona.as_str()), true),
                ("head.name", Some(head.name.as_str()), true),
            ]);
        }
        values
            .into_iter()
            .find_map(|(field, value, required)| match value {
                Some(text) if text.trim().is_empty() => Some(format!("{field} is empty")),
                Some(text) if text.len() > MAX_ID_VALUE => {
                    Some(format!("{field} is longer than {MAX_ID_VALUE} bytes"))
                }
                Some(text) if text.chars().any(char::is_control) => {
                    Some(format!("{field} holds a control character"))
                }
                None if required => Some(format!("{field} is missing")),
                _ => None,
            })
    }

    fn carries_any(&self) -> bool {
        self.cli_session.is_some()
            || self.terminal.is_some()
            || self.mailbox.is_some()
            || self.head.is_some()
    }
}

/// Refused `invalid-ids` when `ids` cannot be recorded.
fn checked_ids(ids: Option<&Ids>) -> Result<(), Refusal> {
    match ids.and_then(Ids::problem) {
        Some(problem) => Err(refused("invalid-ids", problem)),
        None => Ok(()),
    }
}

/// The identifiers an entry holds after a write that carries `carried`: each
/// group `carried` has replaces the held one whole, every other held group is
/// kept. `updatedAt` moves only when a group changed, so an unchanged refresh
/// is no change at all.
fn merge_ids(held: Option<&Ids>, carried: Option<&Ids>) -> Option<Ids> {
    let Some(carried) = carried.filter(|ids| ids.carries_any()) else {
        return held.cloned();
    };
    let mut merged = held.cloned().unwrap_or_default();
    let mut changed = held.is_none();
    macro_rules! take_group {
        ($group:ident) => {
            if carried.$group.is_some() && carried.$group != merged.$group {
                merged.$group = carried.$group.clone();
                changed = true;
            }
        };
    }
    take_group!(cli_session);
    take_group!(terminal);
    take_group!(mailbox);
    take_group!(head);
    if changed {
        merged.v = IDS_VERSION;
        merged.updated_at = iso_utc_now();
    }
    Some(merged)
}

/// The terminal pane the calling process runs in, from the variables herdr
/// sets in every pane (`HERDR_PANE_ID`, `HERDR_TAB_ID`, `HERDR_WORKSPACE_ID`);
/// `None` outside a herdr pane.
pub fn terminal_from_env() -> Option<TerminalIds> {
    let var = |name: &str| std::env::var(name).ok().filter(|v| !v.trim().is_empty());
    Some(TerminalIds {
        driver: "herdr".into(),
        key: None,
        pane_id: var("HERDR_PANE_ID")?,
        tab_id: var("HERDR_TAB_ID"),
        workspace_id: var("HERDR_WORKSPACE_ID"),
    })
}

/// Maps a terminal tab label to the ids of the tabs that carry it now, read
/// live from the terminal driver (labels are renamed freely, so they are
/// never stored). The driver lives above Identity and is injected.
pub trait TerminalPort {
    fn tab_ids(&self, label: &str) -> Vec<String>;
}

/// The [`TerminalPort`] of a caller that has no terminal driver: it knows no label.
pub struct NoTerminal;

impl TerminalPort for NoTerminal {
    fn tab_ids(&self, _label: &str) -> Vec<String> {
        Vec::new()
    }
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
            ids: None,
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
    /// The session's other identifiers ([`Ids`]); never on a remote session.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ids: Option<Ids>,
    /// The fields the [`resolve`] query matched (`handle`, `role`, `terminal.paneId`, ...); empty elsewhere.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub matched: Vec<String>,
    /// The `ids` groups known to be out of date: `cliSession` when its process is dead while the session lives.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub stale: Vec<String>,
}

/// The `ids` groups of `entry` known to be out of date: `cliSession` when the
/// process recorded for it is dead (the CLI restarted, its socket is gone).
fn stale_groups(entry: &Entry, judge: Judge) -> Vec<String> {
    let cli_dead = entry
        .ids
        .as_ref()
        .and_then(|ids| ids.cli_session.as_ref())
        .and_then(|cli| {
            Some(Record {
                pid: Some(ProcId(cli.pid?)),
                start_time: cli.start_time.clone(),
                ..Record::default()
            })
        })
        .is_some_and(|record| judge(&record) == Verdict::Dead);
    if cli_dead {
        vec!["cliSession".into()]
    } else {
        Vec::new()
    }
}

impl Listed {
    fn of(entry: &Entry, verdict: Verdict, judge: Judge) -> Self {
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
            ids: entry.ids.clone(),
            matched: Vec::new(),
            stale: stale_groups(entry, judge),
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
        matched: Vec::new(),
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

/// The `identity-directory` lock of one directory, taken on first need and
/// held until dropped, so a door that rewrites several entries takes it once
/// and the doors it calls never take it a second time.
struct DirLock<'r> {
    root: &'r Path,
    scope: Option<LockScope<'static>>,
}

impl<'r> DirLock<'r> {
    fn new(root: &'r Path) -> Self {
        Self { root, scope: None }
    }

    /// Takes the lock unless this guard already holds it. Refused
    /// `directory-busy` when it is not free within [`LOCK_WAIT_MS`] or cannot be
    /// taken at all; the caller may skip the write and retry on its next trigger.
    fn hold(&mut self) -> Result<(), Refusal> {
        if self.scope.is_some() {
            return Ok(());
        }
        let busy = |e: ScopeError| {
            refused(
                "directory-busy",
                format!("cannot take the {LOCK_NAME} lock: {e}"),
            )
        };
        let mut scope = LockScope::seeded(Vec::new()).map_err(busy)?;
        let params = BTreeMap::from([(
            "lockRoot".to_owned(),
            self.root.join("locks").to_string_lossy().into_owned(),
        )]);
        scope
            .acquire(LOCK_NAME, &params, Wait::Ms(LOCK_WAIT_MS))
            .map_err(busy)?;
        self.scope = Some(scope);
        Ok(())
    }
}

/// Registration of an entry that takes no role into a directory below its cap:
/// the atomic create of the handle-named file, and only when the name is
/// taken, a read of that one entry. A dead holder is replaced, the same
/// session refreshes under the lock, any other is refused `handle-in-use`. No
/// scan, no prune.
fn register_by_handle(lock: &mut DirLock, entry: Entry, judge: Judge) -> Result<Listed, Refusal> {
    let root = lock.root;
    let mut merged = entry;
    if store(root, &merged, false)? == Installed::Created {
        return Ok(Listed::of(&merged, merged.verdict(judge), judge));
    }
    let holder = read_named(root, &merged.handle, judge);
    if let Some(row) = holder.as_ref().filter(|row| row.verdict == Verdict::Dead) {
        remove(root, &row.file)?;
        if store(root, &merged, false)? == Installed::Created {
            return Ok(Listed::of(&merged, merged.verdict(judge), judge));
        }
        // Another registration took the name in between: it decides below.
    }
    lock.hold()?;
    if let Some(row) = read_named(root, &merged.handle, judge) {
        if row.entry.id != merged.id {
            return Err(handle_in_use(&row.entry.id, &merged.id, &merged.handle));
        }
        refresh_from(&mut merged, &row.entry);
    }
    store(root, &merged, true)?;
    Ok(Listed::of(&merged, merged.verdict(judge), judge))
}

/// `merged` keeps the first registration time, the roles `held` already has,
/// and every `ids` group it does not carry itself.
fn refresh_from(merged: &mut Entry, held: &Entry) {
    merged.registered_at = held.registered_at.clone();
    merged.roles.extend(held.roles.iter().cloned());
    merged.roles.sort();
    merged.roles.dedup();
    merged.ids = merge_ids(held.ids.as_ref(), merged.ids.as_ref());
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
/// `entry.ids` carries the identifier groups this writer owns; each replaces
/// the held group whole and the others are kept. Refused `invalid-ids` when
/// they cannot be recorded, `directory-busy` when an existing entry must be
/// rewritten and the `identity-directory` lock is not free.
pub fn register(root: &Path, entry: Entry, take: bool, judge: Judge) -> Result<Listed, Refusal> {
    register_in(&mut DirLock::new(root), entry, take, judge)
}

fn register_in(
    lock: &mut DirLock,
    entry: Entry,
    take: bool,
    judge: Judge,
) -> Result<Listed, Refusal> {
    let root = lock.root;
    if let Some(role) = entry.roles.iter().find(|role| role_problem(role).is_some()) {
        return Err(Refusal {
            candidates: Vec::new(),
            reason: "invalid-role",
            detail: format!("role {role:?} is not {ROLE_SHAPE}"),
        });
    }
    checked_ids(entry.ids.as_ref())?;
    let mut entry = entry;
    // Stamped as a fresh record; a refresh below merges it into the held one.
    entry.ids = merge_ids(None, entry.ids.as_ref());
    let dir = directory(root);
    fs::create_dir_all(&dir).map_err(|e| write_failed(&dir, e))?;
    if entry.roles.is_empty() && !holds_cap(root)? {
        return register_by_handle(lock, entry, judge);
    }
    // Every entry this call reads may be rewritten (its own, a role holder's),
    // so the scan already runs under the lock.
    lock.hold()?;
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
        // A lock-free registration created this name between the scan and
        // the create: the same session refreshes it, any other is refused.
        Installed::AlreadyExists => match read_named(root, &merged.handle, judge) {
            Some(row) if row.entry.id != merged.id => {
                return Err(handle_in_use(&row.entry.id, &merged.id, &merged.handle))
            }
            Some(row) => {
                refresh_from(&mut merged, &row.entry);
                store(root, &merged, true)?;
            }
            None => {
                store(root, &merged, true)?;
            }
        },
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
    Ok(Listed::of(&merged, merged.verdict(judge), judge))
}

/// Registers `session` on this machine with `head` as the liveness record:
/// the project of `clone_dir` (none when it is not a registered project) and
/// [`register`] with `roles` (and `take`) and the identifier groups `ids`. The
/// one registration body behind [`register_current`] and [`register_writer`].
fn register_session(
    lock: &mut DirLock,
    session: CurrentSession,
    head: Option<Record>,
    clone_dir: Option<&Path>,
    roles: &[String],
    take: bool,
    ids: Option<Ids>,
) -> Result<Listed, Refusal> {
    let state_root = lock.root;
    let project_id = clone_dir
        .and_then(|dir| project::project_info(state_root, dir).ok())
        .map(|project| project.id);
    let mut entry = Entry::new(
        session.info.id,
        session.info.handle,
        session.local.cli.to_owned(),
        project_id,
        clone_dir.map(|dir| dir.display().to_string()),
        roles.to_vec(),
        head,
    );
    entry.ids = ids;
    register_in(lock, entry, take, &judge_here)
}

/// Registers the session the process `caller_pid` is, from the real env and
/// OS process tree: resolves its full id and handle, the project of
/// `clone_dir` (none when it is not a registered project), the agent head's
/// liveness record, and calls [`register`] with `roles` (and `take`). `ids`
/// carries the identifier groups the caller knows; when it has no `terminal`
/// group, the herdr pane of the process's own env is recorded
/// ([`terminal_from_env`]).
///
/// The cost is bounded for a hook on the first tool call of a head: no
/// network, no lock unless an existing entry is rewritten (the entry is a
/// create-once file named by the handle), one durable write, and no directory
/// scan unless the call takes a role or the directory is at its cap (see
/// [`register`]). The CLI's `identity session --register` is this function.
pub fn register_current(
    state_root: &Path,
    caller_pid: u32,
    clone_dir: Option<&Path>,
    roles: &[String],
    take: bool,
    ids: Option<&Ids>,
) -> Result<Listed, Refusal> {
    let current = current_session(state_root, caller_pid)?;
    let tree = os_process_tree();
    let head = head_liveness(tree.as_ref(), caller_pid, &os_record);
    let mut ids = ids.cloned().unwrap_or_default();
    if ids.terminal.is_none() {
        ids.terminal = terminal_from_env();
    }
    let ids = ids.carries_any().then_some(ids);
    register_session(
        &mut DirLock::new(state_root),
        current,
        head,
        clone_dir,
        roles,
        take,
        ids,
    )
}

/// Registers the session a hook-carried `key` names, for a caller whose own
/// env does not carry it (a Codex hook process has no `CODEX_THREAD_ID`).
/// `head` is the agent head the caller already checked, by pid and start
/// time; its process facts are read here and recorded as the entry's
/// liveness. `ids` carries the identifier groups this writer owns. Refused
/// `invalid-writer-key` (see [`session_for`]) and `head-not-live` when the
/// head cannot be read, is not running, or has a different start time (the
/// detail says which); every other rule is [`register`]'s.
pub fn register_writer(
    state_root: &Path,
    clone_dir: Option<&Path>,
    key: &WriterKey,
    head: &HeadRef,
    roles: &[String],
    take: bool,
    ids: Option<&Ids>,
) -> Result<Listed, Refusal> {
    register_writer_in(
        &mut DirLock::new(state_root),
        clone_dir,
        key,
        head,
        roles,
        take,
        ids,
    )
}

fn register_writer_in(
    lock: &mut DirLock,
    clone_dir: Option<&Path>,
    key: &WriterKey,
    head: &HeadRef,
    roles: &[String],
    take: bool,
    ids: Option<&Ids>,
) -> Result<Listed, Refusal> {
    let session = session_for(lock.root, key, Some(head))?;
    let record = read_head(head).map_err(|detail| Refusal {
        reason: "head-not-live",
        detail,
        candidates: Vec::new(),
    })?;
    register_session(
        lock,
        session,
        Some(record),
        clone_dir,
        roles,
        take,
        ids.cloned(),
    )
}

/// Replaces the identifier groups `ids` carries in the entry of the session
/// `own_id` (whose handle is `handle`), keeping every other group, its roles
/// and its liveness: the door for a value that changed after registration (a
/// renamed CLI session, a new messaging socket, a moved pane). Reads the one
/// entry and writes only when a group differs, under the `identity-directory`
/// lock. Refused `invalid-ids`, `not-registered` when `handle` names no entry
/// of `own_id`, and `directory-busy` when the lock is not free (the caller may
/// skip; its next trigger retries).
pub fn refresh_ids(
    state_root: &Path,
    own_id: &str,
    handle: &str,
    ids: &Ids,
) -> Result<Listed, Refusal> {
    checked_ids(Some(ids))?;
    let mut lock = DirLock::new(state_root);
    lock.hold()?;
    let Some(row) =
        read_named(state_root, handle, &judge_here).filter(|row| row.entry.id == own_id)
    else {
        return Err(refused(
            "not-registered",
            format!("{own_id} has no entry under the handle {handle}; register it first"),
        ));
    };
    let mut entry = row.entry;
    let merged = merge_ids(entry.ids.as_ref(), Some(ids));
    if merged != entry.ids {
        entry.ids = merged;
        store(state_root, &entry, true)?;
    }
    Ok(Listed::of(&entry, row.verdict, &judge_here))
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

/// Refused `agent-not-gate-child` when the caller's agent process is not `gate`'s direct child. The gate starts
/// exactly one process, the agent; the caller's agent process is the nearest process on its way up that runs the
/// program the gate started (the kernel's command name). Any process between the caller and the gate's child that runs
/// that same program is an agent nested under the gate's agent, and the caller is its, not the attempt's. A caller
/// that is the gate or its child, or a platform that cannot read command names, passes.
fn agent_is_gate_child(tree: &dyn ProcessTree, caller_pid: u32, gate: u32) -> Result<(), Refusal> {
    let mut between = Vec::new();
    let mut pid = caller_pid;
    for _ in 0..MAX_ANCESTRY_WALK {
        if pid == gate {
            return Ok(());
        }
        let Some(stat) = tree.stat(pid) else {
            return Ok(());
        };
        if stat.ppid == gate {
            let Some(program) = tree.comm(pid) else {
                return Ok(());
            };
            return match between
                .iter()
                .find(|&&p| tree.comm(p).as_deref() == Some(program.as_str()))
            {
                Some(nested) => Err(refused(
                    "agent-not-gate-child",
                    format!(
                        "process {caller_pid} runs under the agent {nested} ({program}), which runs under the gate's own agent {pid}, not as the gate {gate}'s child"
                    ),
                )),
                None => Ok(()),
            };
        }
        between.push(pid);
        pid = stat.ppid;
    }
    Ok(())
}

/// The gate of the runner attempt `attempt` as Identity holds it: the head of the attempt's live entry. `None` when the
/// attempt has no live entry or the directory cannot be read.
pub fn attempt_gate(state_root: &Path, attempt: &WriterKey) -> Option<HeadRef> {
    let own = session_for(state_root, attempt, None).ok()?;
    let rows = scan(state_root, &judge_here).ok()?.rows;
    let row = rows
        .iter()
        .find(|row| row.verdict != Verdict::Dead && row.entry.id == own.info.id)?;
    let record = Record::from_json(row.entry.liveness.as_ref()?);
    Some(HeadRef {
        pid: record.pid?.0,
        start_time: record.start_time?,
    })
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
/// `agent-not-gate-child` when the caller's agent process is not the head's direct child (an agent nested under the
/// head's own agent, such as a `claude -p` its tool started, inherits the attempt's environment but is never the
/// attempt's agent: binding it would move the head's roles to a short-lived session), `attempt-not-registered` when
/// the attempt has no live entry on that head, and `session-in-use` when the agent's id is already a live session on
/// another head. Every other rule is [`register`]'s.
///
/// The `terminal` and `head` identifier groups move with the roles: the bound session takes them from the session
/// bound before (else from the attempt's own entry), and the attempt keeps neither, so a pane or a head generation
/// names one session. `ids` carries the groups the caller owns (`cliSession`, `mailbox`). The whole bind runs under
/// the `identity-directory` lock.
pub fn bind_agent_session(
    state_root: &Path,
    clone_dir: Option<&Path>,
    attempt: &WriterKey,
    agent: &WriterKey,
    head: &HeadRef,
    caller_pid: u32,
    ids: Option<&Ids>,
) -> Result<Listed, Refusal> {
    bind_agent_session_in(
        state_root,
        clone_dir,
        attempt,
        agent,
        head,
        caller_pid,
        ids,
        os_process_tree().as_ref(),
    )
}

#[allow(clippy::too_many_arguments)] // the public door's six inputs, plus the process tree port tests inject
fn bind_agent_session_in(
    state_root: &Path,
    clone_dir: Option<&Path>,
    attempt: &WriterKey,
    agent: &WriterKey,
    head: &HeadRef,
    caller_pid: u32,
    ids: Option<&Ids>,
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
    agent_is_gate_child(tree, caller_pid, head.pid)?;
    checked_ids(ids)?;
    let own = session_for(state_root, attempt, None)?;
    let mut lock = DirLock::new(state_root);
    lock.hold()?;
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
    let mut previous: Vec<&Row> = rows
        .iter()
        .filter(live_on_head)
        .filter(|row| !is_attempt_entry(&row.entry) && row.entry.id != session.info.id)
        .collect();
    // Latest binding first: what moved last is what moves on.
    previous.sort_by(|a, b| b.entry.registered_at.cmp(&a.entry.registered_at));
    let mut roles = attempt_row.entry.roles.clone();
    roles.extend(
        previous
            .iter()
            .flat_map(|row| row.entry.roles.iter().cloned()),
    );
    roles.sort();
    roles.dedup();
    let mut carried = ids.cloned().unwrap_or_default();
    let movers: Vec<&Ids> = previous
        .iter()
        .copied()
        .chain(std::iter::once(attempt_row))
        .filter_map(|row| row.entry.ids.as_ref())
        .collect();
    if carried.terminal.is_none() {
        carried.terminal = movers.iter().find_map(|ids| ids.terminal.clone());
    }
    if carried.head.is_none() {
        carried.head = movers.iter().find_map(|ids| ids.head.clone());
    }
    let carried = carried.carries_any().then_some(carried);
    let attempt_handle = attempt_row.entry.handle.clone();
    let listed = register_session(
        &mut lock,
        session,
        Some(record),
        clone_dir,
        &roles,
        true,
        carried,
    )?;
    for row in previous {
        remove(state_root, &row.file)?;
    }
    // The attempt's entry was rewritten when its roles moved: read it again and drop the groups that moved too.
    if let Some(mut row) = read_named(state_root, &attempt_handle, &judge_here) {
        if let Some(held) = row.entry.ids.as_mut() {
            if held.terminal.is_some() || held.head.is_some() {
                held.terminal = None;
                held.head = None;
                held.updated_at = iso_utc_now();
                if !held.carries_any() {
                    row.entry.ids = None;
                }
                store(state_root, &row.entry, true)?;
            }
        }
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
        .map(|row| Listed::of(&row.entry, row.verdict, judge)))
}

/// Registers `roles` (with `take`) and the identifier groups `ids` for the session the attempt is
/// ([`attempt_session`]): the agent session bound on `head` when there is one, else the attempt's own key through
/// [`register_writer`]. Runs under the `identity-directory` lock from the read of the binding to the last write.
pub fn register_attempt_roles(
    state_root: &Path,
    clone_dir: Option<&Path>,
    attempt: &WriterKey,
    head: &HeadRef,
    roles: &[String],
    take: bool,
    ids: Option<&Ids>,
) -> Result<Listed, Refusal> {
    let mut lock = DirLock::new(state_root);
    lock.hold()?;
    let rows = scan(state_root, &judge_here)?.rows;
    match current_binding(&rows, head) {
        Some(row) => {
            let mut entry = row.entry.clone();
            entry.roles = roles.to_vec();
            entry.ids = ids.cloned();
            register_in(&mut lock, entry, take, &judge_here)
        }
        None => register_writer_in(&mut lock, clone_dir, attempt, head, roles, take, ids),
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
    let mut lock = DirLock::new(root);
    lock.hold()?;
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
    Ok(Listed::of(&entry, row.verdict, judge))
}

/// [`drop_role`] for the session the process `caller_pid` is.
pub fn drop_current_role(
    state_root: &Path,
    caller_pid: u32,
    role: &str,
) -> Result<Listed, Refusal> {
    let current = current_session(state_root, caller_pid)?;
    drop_role(state_root, &current.info.id, role, &judge_here)
}

/// The fields of `entry` that `query` names, by the query's shape ([`resolve`]'s rules 1, 3, 4 and 5).
fn matched_fields(entry: &Entry, query: &str) -> Vec<String> {
    let ids = entry.ids.as_ref();
    let cli = ids.and_then(|ids| ids.cli_session.as_ref());
    let terminal = ids.and_then(|ids| ids.terminal.as_ref());
    let mailbox = ids.and_then(|ids| ids.mailbox.as_ref());
    let candidates: Vec<(&str, Option<String>)> = if query.starts_with('/') {
        vec![("cliSession.socket", cli.and_then(|c| c.socket.clone()))]
    } else if is_role_alias(query) {
        return if entry.roles.iter().any(|role| role == query) {
            vec!["role".into()]
        } else {
            Vec::new()
        };
    } else if !query.is_empty() && query.bytes().all(|b| b.is_ascii_digit()) {
        let head_pid = entry
            .liveness
            .as_ref()
            .and_then(|value| Record::from_json(value).pid)
            .map(|pid| pid.0.to_string());
        vec![
            ("liveness.pid", head_pid),
            (
                "cliSession.pid",
                cli.and_then(|c| c.pid).map(|p| p.to_string()),
            ),
        ]
    } else {
        vec![
            ("handle", Some(entry.handle.clone())),
            ("cliSession.id", cli.map(|c| c.id.clone())),
            ("cliSession.name", cli.and_then(|c| c.name.clone())),
            ("terminal.paneId", terminal.map(|t| t.pane_id.clone())),
            ("terminal.tabId", terminal.and_then(|t| t.tab_id.clone())),
            ("terminal.key", terminal.and_then(|t| t.key.clone())),
            ("mailbox.name", mailbox.map(|m| m.name.clone())),
        ]
    };
    candidates
        .into_iter()
        .filter(|(_, value)| value.as_deref() == Some(query))
        .map(|(field, _)| field.to_owned())
        .collect()
}

/// A local entry a query matched, with the fields it matched by.
struct Hit<'r> {
    row: &'r Row,
    matched: Vec<String>,
}

impl Hit<'_> {
    /// Whether the entry is reached only through its CLI session and that session's process is dead while the entry
    /// lives on: the identifier is out of date (the CLI restarted, its socket is gone).
    fn stale(&self, judge: Judge) -> bool {
        self.matched
            .iter()
            .all(|field| field.starts_with("cliSession."))
            && stale_groups(&self.row.entry, judge).contains(&"cliSession".to_owned())
    }

    fn listed(&self, judge: Judge) -> Listed {
        let mut listed = Listed::of(&self.row.entry, self.row.verdict, judge);
        listed.matched = self.matched.clone();
        listed
    }

    fn candidate(&self) -> Candidate {
        let mut candidate = candidate_of(self.row);
        candidate.matched = self.matched.clone();
        candidate
    }
}

/// The one live session `query` names, by any identifier it holds. Matching is
/// exact and the query's shape picks the fields, in this order:
///
/// 1. starting with `/`: the CLI session's messaging socket;
/// 2. `<machine-id>/<local id>`: the full id (of another machine through `shared`);
/// 3. a role alias (`lead:`, `work:`, `head:`): the roles;
/// 4. all digits: the head's pid or the CLI session's pid;
/// 5. else the handle, the CLI session id or name, the terminal pane id, tab id
///    or slot key, or the mailbox name;
/// 6. no hit for 5: `terminal` maps the query as a tab label to the tabs that
///    carry it now and the tab ids are tried;
/// 7. still none: for 3 and 5, `shared` (the sessions other machines
///    published) by handle or role only.
///
/// Exactly one, else `ambiguous` (each candidate names the fields it matched)
/// or `not-found` with the close candidates in the detail and in
/// `Refusal::candidates` (Identity's own codes; the mailbox maps them to its
/// names). An entry reached only through its CLI session whose process is dead
/// is not an answer; when only such entries match the call is refused `stale`.
/// The answer carries `ids`, `matched` and `stale`.
pub fn resolve(
    root: &Path,
    query: &str,
    judge: Judge,
    shared: Option<&SharedView>,
    terminal: &dyn TerminalPort,
) -> Result<Listed, Refusal> {
    let query = query.trim();
    if !query.starts_with('/') {
        if let Some((machine_id, _)) = query.split_once('/') {
            return resolve_full_id(root, machine_id, query, judge, shared);
        }
    }
    let live = scan(root, judge)?
        .rows
        .into_iter()
        .filter(|row| row.verdict != Verdict::Dead)
        .collect::<Vec<_>>();
    let hits_of = |query: &str| -> Vec<Hit> {
        live.iter()
            .map(|row| Hit {
                row,
                matched: matched_fields(&row.entry, query),
            })
            .filter(|hit| !hit.matched.is_empty())
            .collect()
    };
    let is_role = is_role_alias(query);
    let by_name = !is_role && !query.starts_with('/') && !query.bytes().all(|b| b.is_ascii_digit());
    let mut hits = hits_of(query);
    if hits.is_empty() && by_name && !query.is_empty() {
        for tab in terminal.tab_ids(query) {
            for mut hit in hits_of(&tab) {
                if hit.matched.iter().any(|field| field == "terminal.tabId")
                    && !hits
                        .iter()
                        .any(|seen: &Hit| seen.row.entry.id == hit.row.entry.id)
                {
                    hit.matched = vec!["terminal.tabLabel".into()];
                    hits.push(hit);
                }
            }
        }
    }
    let (stale, hits): (Vec<Hit>, Vec<Hit>) = hits.into_iter().partition(|hit| hit.stale(judge));
    match hits.as_slice() {
        [hit] => Ok(hit.listed(judge)),
        [] if !stale.is_empty() => Err(Refusal {
            reason: "stale",
            detail: format!(
                "{query:?} names only the CLI session of {}, whose process has ended (the CLI restarted); resolve the session by its handle or role",
                join(&stale.iter().map(|hit| hit.row.entry.handle.clone()).collect::<Vec<_>>())
            ),
            candidates: stale.iter().map(Hit::candidate).collect(),
        }),
        [] => {
            let close = |row: &Row| {
                !query.is_empty()
                    && if is_role {
                        row.entry.roles.iter().any(|role| role.contains(query))
                    } else {
                        row.entry.handle.contains(query)
                    }
            };
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
                candidates: live.iter().filter(|row| close(row)).map(candidate_of).collect(),
            };
            let remote = if is_role || by_name { shared } else { None };
            match remote.map(|view| view.resolve(query)) {
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
                .map(|hit| {
                    format!(
                        "{} ({}, by {})",
                        hit.row.entry.handle,
                        hit.row.entry.id,
                        hit.matched.join("+")
                    )
                })
                .collect();
            Err(Refusal {
                reason: "ambiguous",
                detail: format!(
                    "{query:?} names {} live sessions: {}",
                    many.len(),
                    join(&ids)
                ),
                candidates: many.iter().map(Hit::candidate).collect(),
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
        .map(|row| {
            let mut listed = Listed::of(&row.entry, row.verdict, judge);
            listed.matched = vec!["id".into()];
            listed
        })
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
        .map(|row| Listed::of(&row.entry, row.verdict, judge))
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
