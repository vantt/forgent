//! The mailbox's use of Identity, in the host wiring only (the mailbox
//! crates never call Identity): a head's handle derived for a frame header,
//! a newly bound head made known to Identity's directory, and Identity names
//! as `send` addresses.
//!
//! Addresses (spec §5.1.1): an Identity handle
//! (`claude-5v7u@fg-server`), a full id (`<machine-id>/<local id>`), a role
//! alias (`lead:<LANE>`, `head:<persona>-<name>`) or any other identifier of a
//! session's Identity record (pane, tab or tab label, CLI session id, name or
//! socket, pid), resolved through Identity's one lookup and delivered only to
//! a head this project's record holds. The mailbox crates never see
//! Identity: this wiring hands the core either a head's key or a typed
//! refusal (`Recipient::Key` or `Recipient::Refused`).
//!
//! Identity's directory is machine-wide and unauthenticated: any process of
//! the same user can register a session or take a role (spec §8). So a
//! resolved session is used only when it is one of this record's heads, a
//! role delivery names the holder in the report, and candidates are cut to
//! this record's heads, never the machine's sessions.
use super::terminal_tabs::HerdrTabs;
use fgos_identity::cli_dirs::{claude_config_dir, read_claude_session};
use fgos_identity::directory::{
    by_handle, is_role_alias, refresh_ids, register_writer, resolve, terminal_from_env,
    CliSessionIds, Ids, Listed, MailboxIds, NoTerminal,
};
use fgos_identity::resolve::{HeadRef, WriterKey as IdentityKey, ENV_ORDER};
use fgos_identity::session::cli_of;
use fgos_identity::{session_for, Candidate, Liveness as IdentityLiveness, SessionInfo};
use fgos_mailbox::hook::resolve::HEAD_REQUEST_SOCKET_ENV;
use fgos_mailbox::hook::shell::BoundHead;
use fgos_mailbox::hook::Sender;
use fgos_mailbox::verbs::HeadView;
use fgos_mailbox_core::{AliasCandidate, AliasRefusal, Cli, Liveness, WriterKey};
use fgos_process::facts::{judge_here, Record};
use fgos_run_supervisor::head_client::{request_head, REPLY_TIMEOUT};
use std::path::{Path, PathBuf};

/// Identity's state root, as the `identity` verbs resolve it (an explicit
/// `FGOS_STATE_ROOT` wins); `None` without a `HOME`, so a caller with no
/// home reads and writes no machine state.
pub fn state_root() -> Option<PathBuf> {
    std::env::var_os("HOME")
        .filter(|home| !home.is_empty())
        .map(|_| fgos_holder_lock::state_root::state_root().0)
}

/// What a typed `--to` becomes.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Addressed {
    /// A head of this record: its key, which the core matches exactly, and
    /// for a role alias the role and its holder's handle.
    Head {
        key: WriterKey,
        role_holder: Option<(String, String)>,
    },
    /// An alias that names no head of this record, or several.
    Refused(AliasRefusal),
}

/// Whether `to` is an Identity name rather than a mailbox name: it holds `@`
/// or `/`, or starts with `lead:`. A mailbox short name never holds either
/// character, whatever its project folder is called. Text that addresses a
/// group is left to the core, which refuses it as a group (check 1).
pub fn is_alias(to: &str) -> bool {
    (to.contains('@') || to.contains('/') || is_role_alias(to)) && !fgos_mailbox_core::is_group(to)
}

/// The Identity session of a mailbox head: its full id and handle, derived
/// by Identity from the head's key, CLI and process, the binding's stored
/// head, exactly as the registration passed it, so a shared session
/// variable (pi, omp) gets the label Identity registered. `None` when
/// Identity has no session-id variable for that CLI or no machine id yet.
pub fn session_of(
    state_root: &Path,
    key: &WriterKey,
    cli: &Cli,
    head: Option<&Record>,
) -> Option<SessionInfo> {
    let key = identity_key(key, cli)?;
    let head = head.and_then(head_ref);
    session_for(state_root, &key, head.as_ref())
        .ok()
        .map(|session| session.info)
}

/// Who sent a message, for its frame header: the handle Identity derives for
/// the sender ([`session_of`]) and the role its Identity record holds (a
/// `head:` role first, else its first role), read from the one entry file of
/// that handle. `None` when no handle can be derived.
pub fn sender_of(
    state_root: Option<&Path>,
    key: &WriterKey,
    cli: &Cli,
    head: Option<&Record>,
) -> Option<Sender> {
    let root = state_root?;
    let info = session_of(root, key, cli, head)?;
    let roles = by_handle(root, &info.handle, &judge_here)
        .filter(|listed| listed.id == info.id)
        .map(|listed| listed.roles)
        .unwrap_or_default();
    let role = roles
        .iter()
        .find(|role| role.starts_with("head:"))
        .or(roles.first())
        .cloned();
    Some(Sender {
        handle: Some(info.handle),
        role,
    })
}

/// Identity's reference to a head process: its pid and start time, when the
/// record has both.
fn head_ref(record: &Record) -> Option<HeadRef> {
    Some(HeadRef {
        pid: record.pid?.0,
        start_time: record.start_time.clone()?,
    })
}

/// The head's key as Identity takes it: the session-id variable Identity
/// names `cli` by, and the key's value. pi and omp share one variable,
/// `PI_SESSION_ID`, which Identity names by the neutral `pi`; Identity labels
/// an omp head `omp` from its process ancestry (`HeadRef`).
fn identity_key<'a>(key: &'a WriterKey, cli: &Cli) -> Option<IdentityKey<'a>> {
    let family = match cli.as_str() {
        "omp" => "pi",
        other => other,
    };
    let source = ENV_ORDER
        .iter()
        .find(|var| cli_of(var, key.as_str()) == family)?;
    Some(IdentityKey {
        source,
        value: key.as_str(),
    })
}

/// After a hook call bound a head to a new generation: makes sure Identity
/// knows that head, once per head process (steady calls never get here).
/// Its own handle is resolved read-only first: found with its own id, done;
/// found with another id, a handle collision, nothing registered; not
/// found, Identity's `register_writer` door with the key from the payload
/// and the head process the hook verified, named by its pid and start time
/// (Identity refuses `head-not-live` when the pid now runs another process),
/// carrying the identifier groups the hook owns ([`own_ids`]: CLI session,
/// herdr pane, mailbox name). The main checkout the head works in is the
/// parent of `fgos_dir`: the entry carries its project id (when the clone is
/// a registered project), which is what lets the shared directory carry the
/// head to other machines.
/// Returns the hook-outcome reason when it did not hold; nothing is retried
/// in this process.
///
/// Inside a confined head (its env names the head request socket) Identity's
/// directory is read-only, so the head's session is not registered here: the
/// head's own supervisor is asked to bind it to the attempt it runs in
/// (`session bind session`, with the head's mailbox name), which registers it
/// on the attempt's gate and moves the attempt's role to it, so a role alias
/// reaches this head's mailbox key.
/// A bind that was busy or refused is asked again by later hook calls until
/// it holds, backing off only after the head's own recent failure
/// (`mailbox_hook::ensure_identity`); the
/// variable is no trust boundary, the supervisor checks the caller's pid.
///
/// Known limit, inside the same-user boundary of spec §8 item 3: the
/// watchdog may end the process inside Identity's durable write and leave
/// its temporary file in Identity's directory. Identity's scan reads only
/// `*.json` entries, so the file is never counted or resolved; it only takes
/// disk space until removed.
pub fn ensure_registered(
    state_root: &Path,
    fgos_dir: &Path,
    cli: &Cli,
    head: &BoundHead,
) -> Option<String> {
    let socket = std::env::var_os(HEAD_REQUEST_SOCKET_ENV)
        .filter(|path| !path.is_empty())
        .map(PathBuf::from);
    ensure_registered_via(state_root, fgos_dir, cli, head, socket.as_deref())
}

/// The request-socket verb that binds a head's agent session to its attempt.
const BIND_SESSION_VERB: &str = "session bind session";

fn ensure_registered_via(
    state_root: &Path,
    fgos_dir: &Path,
    cli: &Cli,
    head: &BoundHead,
    head_socket: Option<&Path>,
) -> Option<String> {
    let refused = |reason: &str| Some(format!("ident:{reason}"));
    let Some(key) = identity_key(&head.writer, cli) else {
        return refused("no-session-variable");
    };
    let Some(head_ref) = head_ref(&head.head.record) else {
        return refused("head-unknown");
    };
    let own = match session_for(state_root, &key, Some(&head_ref)) {
        Ok(session) => session.info,
        Err(refusal) => return refused(refusal.reason),
    };
    match resolve(state_root, &own.handle, &judge_here, None, &NoTerminal) {
        Ok(listed) if listed.id == own.id => None,
        Ok(_) => Some("ident-handle-in-use".to_string()),
        Err(refusal) if refusal.reason == "not-found" => match head_socket {
            Some(socket) => bind_through(socket, &key, mailbox_of(fgos_dir, head).as_ref()),
            None => {
                let ids = own_ids(fgos_dir, &key, head);
                register_writer(
                    state_root,
                    fgos_dir.parent(),
                    &key,
                    &head_ref,
                    &[],
                    false,
                    Some(&ids),
                )
                .err()
                .and_then(|refusal| refused(refusal.reason))
            }
        },
        Err(refusal) => refused(refusal.reason),
    }
}

/// Asks the head's own supervisor to bind its agent session (`session bind
/// session`), with the mailbox name its hooks bound; the hook outcome reason
/// when it did not hold.
fn bind_through(socket: &Path, key: &IdentityKey, mailbox: Option<&MailboxIds>) -> Option<String> {
    let mut args = serde_json::json!({ "source": key.source, "value": key.value });
    if let Some(mailbox) = mailbox {
        args["mailbox"] = serde_json::json!({ "fgosDir": mailbox.fgos_dir, "name": mailbox.name });
    }
    let id = format!("mbx-{}", std::process::id());
    request_head(socket, BIND_SESSION_VERB, &args, &id, REPLY_TIMEOUT)
        .err()
        .map(|error| format!("ident:{}", error.code))
}

/// The mailbox name `head` is bound under in the record of `fgos_dir`.
fn mailbox_of(fgos_dir: &Path, head: &BoundHead) -> Option<MailboxIds> {
    Some(MailboxIds {
        fgos_dir: fgos_dir.to_str()?.to_string(),
        name: head.name.as_ref()?.as_str().to_string(),
    })
}

/// The identifier groups an unconfined head's hook owns in its Identity
/// entry: its CLI session (what the CLI's session file says, else the
/// session variable and id alone), its herdr pane (the hook runs in the
/// head's environment) and its mailbox name.
fn own_ids(fgos_dir: &Path, key: &IdentityKey, head: &BoundHead) -> Ids {
    Ids {
        cli_session: Some(fresh_cli_session(key, head)),
        terminal: terminal_from_env(),
        mailbox: mailbox_of(fgos_dir, head),
        ..Ids::default()
    }
}

/// The head's CLI session as the hook sees it now: what the head finder read
/// from the CLI's session file, else (a confined head, whose finder reads no
/// file) that file read here when its sandbox shows it, else the session
/// variable and id alone.
fn fresh_cli_session(key: &IdentityKey, head: &BoundHead) -> CliSessionIds {
    let read = head.head.cli_session.clone().or_else(|| {
        if cli_of(key.source, key.value) != "claude" {
            return None;
        }
        let pid = head.head.record.pid?.0;
        let sessions = claude_config_dir(
            std::env::var_os("HOME").as_deref(),
            std::env::var_os("CLAUDE_CONFIG_DIR").as_deref(),
        )?
        .join("sessions");
        read_claude_session(&sessions, pid)
            .filter(|session| session.session_id.as_deref() == Some(key.value))
    });
    read.and_then(|session| CliSessionIds::of_claude(key.source, &session))
        .unwrap_or_else(|| CliSessionIds {
            source: key.source.to_string(),
            id: key.value.to_string(),
            name: None,
            name_source: None,
            socket: None,
            pid: None,
            start_time: None,
        })
}

/// Whether the CLI session `held` records differs from what the hook sees now
/// (`fresh`): another id, or a name or messaging socket the hook read that the
/// record does not hold. A field the hook could not read is never a difference.
fn cli_session_changed(held: Option<&CliSessionIds>, fresh: &CliSessionIds) -> bool {
    let Some(held) = held else {
        return true;
    };
    held.id != fresh.id
        || (fresh.name.is_some() && fresh.name != held.name)
        || (fresh.socket.is_some() && fresh.socket != held.socket)
}

/// Whether `held` already holds every group `fresh` carries, as `fresh` has it.
fn holds_all(held: Option<&Ids>, fresh: &Ids) -> bool {
    let held = held.cloned().unwrap_or_default();
    (fresh.cli_session.is_none() || fresh.cli_session == held.cli_session)
        && (fresh.terminal.is_none() || fresh.terminal == held.terminal)
        && (fresh.mailbox.is_none() || fresh.mailbox == held.mailbox)
}

/// After a hook call that bound a new generation or ended a turn (`Stop`),
/// with the mailbox lock released: brings the head's identifiers in its
/// Identity entry up to date (a renamed CLI session, a new messaging socket,
/// a moved pane, a new mailbox name). Reads the one entry of the head's
/// handle and writes only on a difference: an unconfined head through
/// Identity's `refresh_ids`, a confined one by asking its supervisor to bind
/// it again (its sandbox reads the directory only). A head Identity does not
/// know yet is left to [`ensure_registered`]; a busy directory is skipped
/// (the next trigger retries). Returns the hook-outcome reason of a refusal.
pub fn refresh_registered(
    state_root: &Path,
    fgos_dir: &Path,
    cli: &Cli,
    head: &BoundHead,
) -> Option<String> {
    let socket = std::env::var_os(HEAD_REQUEST_SOCKET_ENV)
        .filter(|path| !path.is_empty())
        .map(PathBuf::from);
    refresh_registered_via(state_root, fgos_dir, cli, head, socket.as_deref())
}

fn refresh_registered_via(
    state_root: &Path,
    fgos_dir: &Path,
    cli: &Cli,
    head: &BoundHead,
    head_socket: Option<&Path>,
) -> Option<String> {
    let key = identity_key(&head.writer, cli)?;
    let head_ref = head_ref(&head.head.record)?;
    let own = session_for(state_root, &key, Some(&head_ref)).ok()?.info;
    let held: Listed =
        by_handle(state_root, &own.handle, &judge_here).filter(|l| l.id == own.id)?;
    if let Some(socket) = head_socket {
        // The supervisor records the CLI session (read outside the sandbox) and the mailbox name on a bind, so any
        // difference the hook sees (a renamed session, a new socket, a new mailbox name) asks for one.
        let mailbox = mailbox_of(fgos_dir, head);
        let held_ids = held.ids.clone().unwrap_or_default();
        let changed = cli_session_changed(
            held_ids.cli_session.as_ref(),
            &fresh_cli_session(&key, head),
        ) || (mailbox.is_some() && mailbox != held_ids.mailbox);
        return changed
            .then(|| bind_through(socket, &key, mailbox.as_ref()))
            .flatten();
    }
    let fresh = own_ids(fgos_dir, &key, head);
    if holds_all(held.ids.as_ref(), &fresh) {
        return None;
    }
    match refresh_ids(state_root, &own.id, &own.handle, &fresh) {
        Ok(_) => None,
        Err(refusal) if refusal.reason == "directory-busy" => None,
        Err(refusal) => Some(format!("ident:{}", refusal.reason)),
    }
}

/// Resolves the alias `to` against Identity's directory under `state_root`
/// and this record's live `heads`. `state_root` is `None` when the caller
/// may not read Identity's state (no `HOME`): every alias is then unknown.
///
/// A handle carries only 4 characters of its session's hash, so two heads
/// of this record can derive the same handle (by chance, or because a
/// same-user process chose a colliding key): the handle then names no one
/// head, and the send is refused `ambiguous-name` with both full ids, by
/// which each is still reachable. A role delivery names the holder by the
/// handle of the head that got the mail.
pub fn address(
    state_root: Option<&Path>,
    fgos_dir: &Path,
    to: &str,
    heads: &[HeadView],
) -> Addressed {
    let unknown = |candidates| Addressed::Refused(AliasRefusal::Unknown { candidates });
    let Some(root) = state_root else {
        return unknown(Vec::new());
    };
    let ours: Vec<(&HeadView, SessionInfo)> = heads
        .iter()
        .filter_map(|head| {
            Some((
                head,
                session_of(root, &head.key, &head.cli, Some(&head.head))?,
            ))
        })
        .collect();
    let is_role = is_role_alias(to);
    let by_handle = to.contains('@');
    if by_handle {
        let same: Vec<&(&HeadView, SessionInfo)> =
            ours.iter().filter(|(_, info)| info.handle == to).collect();
        if same.len() > 1 {
            return Addressed::Refused(AliasRefusal::Ambiguous {
                candidates: same
                    .iter()
                    .map(|(view, info)| candidate(view, info))
                    .collect(),
            });
        }
    }
    let head = |(view, info): &(&HeadView, SessionInfo)| Addressed::Head {
        key: view.key.clone(),
        role_holder: is_role.then(|| (to.to_string(), info.handle.clone())),
    };
    match resolve(root, to, &judge_here, None, &HerdrTabs) {
        Ok(listed) => ours
            .iter()
            .find(|(view, info)| {
                is_head(&listed, view, info, fgos_dir) && (!by_handle || info.handle == to)
            })
            .map_or_else(|| unknown(Vec::new()), head),
        Err(refusal) if refusal.reason == "ambiguous" => {
            Addressed::Refused(AliasRefusal::Ambiguous {
                candidates: ours_only(&refusal.candidates, &ours),
            })
        }
        Err(refusal) => {
            // A head Identity does not know (it never registered there, or
            // another session holds its handle) is still reachable by the
            // handle or the full id Identity derives for it; at most one
            // head derives a handle here (checked above), and a full id is
            // one session's.
            let derived = ours.iter().find(|(_, info)| {
                if by_handle {
                    info.handle == to
                } else {
                    !is_role && info.id == to
                }
            });
            match derived {
                Some(found) => head(found),
                None => unknown(ours_only(&refusal.candidates, &ours)),
            }
        }
    }
}

/// Whether Identity's record `listed` is the session of this record's head
/// `view`, whose derived session is `info`: the same full id, the CLI session
/// the head's key names (a confined head is bound under its CLI session), or
/// the mailbox name the head is bound under in this very record (`fgos_dir`),
/// from a record whose CLI session, when it names one, is the head's key. A
/// short name is unique only within its project, so a record of another
/// project with the same short name never names a head here.
fn is_head(listed: &Listed, view: &HeadView, info: &SessionInfo, fgos_dir: &Path) -> bool {
    let ids = listed.ids.as_ref();
    let cli = ids.and_then(|ids| ids.cli_session.as_ref());
    info.id == listed.id
        || cli.is_some_and(|cli| cli.id == view.key.as_str())
        || ids
            .and_then(|ids| ids.mailbox.as_ref())
            .is_some_and(|mailbox| {
                mailbox.name == view.name.as_str()
                    && Path::new(&mailbox.fgos_dir) == fgos_dir
                    && cli.is_none_or(|cli| cli.id == view.key.as_str())
            })
}

/// A typed `--to` that is no alias and no exact short name or key of this
/// record's `heads`: the head of this record that the Identity record `to`
/// names by any identifier it holds (a pane, a tab or tab label, a CLI
/// session id or name, a pid), so exact answers always come before the
/// core's prefix rules. `None` when Identity names no head of this record
/// (nothing, a stale CLI session, or sessions elsewhere): the core then
/// resolves `to` as a name. An identifier Identity finds ambiguous is refused
/// `ambiguous-name` whenever a head of this record is among its sessions,
/// never delivered to one of them.
pub fn identified(
    state_root: Option<&Path>,
    fgos_dir: &Path,
    to: &str,
    heads: &[HeadView],
) -> Option<Addressed> {
    let root = state_root?;
    if to.is_empty() || fgos_mailbox_core::is_group(to) {
        return None;
    }
    let ours: Vec<(&HeadView, SessionInfo)> = heads
        .iter()
        .filter_map(|head| {
            Some((
                head,
                session_of(root, &head.key, &head.cli, Some(&head.head))?,
            ))
        })
        .collect();
    let to_head = |(view, _): &(&HeadView, SessionInfo)| Addressed::Head {
        key: view.key.clone(),
        role_holder: None,
    };
    match resolve(root, to, &judge_here, None, &HerdrTabs) {
        Ok(listed) => ours
            .iter()
            .find(|(view, info)| is_head(&listed, view, info, fgos_dir))
            .map(to_head),
        // An identifier that names several sessions names none: refused with this record's heads among them.
        Err(refusal) if refusal.reason == "ambiguous" => {
            let candidates = ours_only(&refusal.candidates, &ours);
            (!candidates.is_empty())
                .then_some(Addressed::Refused(AliasRefusal::Ambiguous { candidates }))
        }
        Err(_) => None,
    }
}

/// A head of this record as an alias candidate.
fn candidate(view: &HeadView, info: &SessionInfo) -> AliasCandidate {
    AliasCandidate {
        id: info.id.clone(),
        handle: info.handle.clone(),
        liveness: view.liveness,
    }
}

/// A head of this record whose handle does not name it alone: Identity
/// holds the handle for another session, or another head of this record
/// derives the same handle. Either way it is reachable by its full id.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HandleConflict {
    pub name: String,
    pub handle: String,
    /// The head's own full id, by which it is still reachable.
    pub id: String,
    /// The full id of the other session that holds or shares the handle.
    pub other: String,
}

/// Every [`HandleConflict`] among this record's `heads`, for `status`.
pub fn handle_conflicts(state_root: &Path, heads: &[HeadView]) -> Vec<HandleConflict> {
    let ours: Vec<(&HeadView, SessionInfo)> = heads
        .iter()
        .filter_map(|head| {
            Some((
                head,
                session_of(state_root, &head.key, &head.cli, Some(&head.head))?,
            ))
        })
        .collect();
    let mut conflicts = Vec::new();
    for (view, info) in &ours {
        let shared = ours
            .iter()
            .find(|(_, other)| other.id != info.id && other.handle == info.handle)
            .map(|(_, other)| other.id.clone());
        let held = || match resolve(state_root, &info.handle, &judge_here, None, &NoTerminal) {
            Ok(listed) if listed.id != info.id => Some(listed.id),
            _ => None,
        };
        if let Some(other) = shared.or_else(held) {
            conflicts.push(HandleConflict {
                name: view.name.as_str().to_string(),
                handle: info.handle.clone(),
                id: info.id.clone(),
                other,
            });
        }
    }
    conflicts
}

/// Identity's candidates that are heads of this record. Every head is a
/// session of this machine, so a session of another machine is never one.
fn ours_only(candidates: &[Candidate], ours: &[(&HeadView, SessionInfo)]) -> Vec<AliasCandidate> {
    candidates
        .iter()
        .filter(|c| ours.iter().any(|(_, info)| info.id == c.id))
        .filter_map(|c| {
            let liveness = match c.liveness {
                IdentityLiveness::Alive => Liveness::Alive,
                IdentityLiveness::Unknown => Liveness::Unknown,
                IdentityLiveness::Remote => return None,
            };
            Some(AliasCandidate {
                id: c.id.clone(),
                handle: c.handle.clone(),
                liveness,
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::{ensure_registered, is_alias};
    use fgos_mailbox::hook::shell::BoundHead;
    use fgos_mailbox::hook::HeadFacts;
    use fgos_mailbox_core::{Cli, WriterKey};
    use std::path::PathBuf;

    /// A fresh Identity state root with a machine id, under the target's
    /// temporary space.
    fn state_root(tag: &str) -> PathBuf {
        let root = std::env::temp_dir().join(format!("mbx-ident-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&root).unwrap();
        fgos_identity::machine::mint(&root, "wiring-test").unwrap();
        root
    }

    /// This test process as a verified head, its start time replaced by `start_time` when given.
    fn bound(writer: &str, start_time: Option<&str>) -> BoundHead {
        let mut record = fgos_process::facts::identity_of(fgos_process::ProcId(std::process::id()))
            .unwrap()
            .to_record();
        if let Some(stale) = start_time {
            record.start_time = Some(stale.to_string());
        }
        BoundHead {
            writer: WriterKey::new(writer).unwrap(),
            name: None,
            head: HeadFacts {
                record,
                own_suffix: None,
                cli_session: None,
            },
            registered: None,
        }
    }

    /// The record directory of a project under `root` (not a repository, so no project id).
    fn fgos_dir(root: &std::path::Path) -> PathBuf {
        root.join("project").join(".fgos")
    }

    fn entries(root: &std::path::Path) -> usize {
        std::fs::read_dir(fgos_identity::directory::directory(root))
            .map(|dir| {
                dir.filter(|e| {
                    e.as_ref()
                        .is_ok_and(|e| e.path().extension().is_some_and(|x| x == "json"))
                })
                .count()
            })
            .unwrap_or(0)
    }

    /// A child process whose kernel command name is `omp`: the shell run
    /// through a symlink of that name (the kernel names a process after the
    /// path it was executed by), blocked reading its stdin, killed on drop.
    /// Never a copy of a system tool: a copy is written just before it is
    /// executed, and a process forked by a concurrent test inherits the open
    /// write descriptor, so the exec fails with "Text file busy"; and a
    /// multi-call `sleep` (uutils coreutils) refuses to run under another
    /// name and exits at once.
    struct Omp(std::process::Child, PathBuf);

    impl Omp {
        fn start(tag: &str) -> Self {
            let dir = std::env::temp_dir().join(format!("mbx-omp-{tag}-{}", std::process::id()));
            std::fs::create_dir_all(&dir).unwrap();
            let bin = dir.join("omp");
            std::os::unix::fs::symlink("/bin/sh", &bin).unwrap();
            let mut child = std::process::Command::new(&bin)
                .args(["-c", "echo up; read _"])
                .stdin(std::process::Stdio::piped())
                .stdout(std::process::Stdio::piped())
                .spawn()
                .unwrap();
            // `spawn` returns while the child may still be the image it was forked
            // from, named as its parent; the kernel names the new image only inside
            // exec. The first line proves the shell runs, so its name is `omp` from here.
            let mut up = String::new();
            std::io::BufRead::read_line(
                &mut std::io::BufReader::new(child.stdout.as_mut().unwrap()),
                &mut up,
            )
            .unwrap();
            assert_eq!(up, "up\n");
            Self(child, dir)
        }

        fn record(&self) -> fgos_process::facts::Record {
            fgos_process::facts::identity_of(fgos_process::ProcId(self.0.id()))
                .unwrap()
                .to_record()
        }
    }

    impl Drop for Omp {
        fn drop(&mut self) {
            let _ = self.0.kill();
            let _ = self.0.wait();
            let _ = std::fs::remove_dir_all(&self.1);
        }
    }

    fn view(
        key: &str,
        name: &str,
        cli: &str,
        head: fgos_process::facts::Record,
    ) -> super::HeadView {
        super::HeadView {
            key: WriterKey::new(key).unwrap(),
            name: serde_json::from_value(serde_json::json!(name)).unwrap(),
            cli: Cli::new(cli).unwrap(),
            liveness: fgos_mailbox_core::Liveness::Alive,
            head,
        }
    }

    #[test]
    fn an_omp_head_renders_and_is_addressed_by_the_handle_identity_registered_from_its_ancestry_among_two_heads(
    ) {
        let root = state_root("omp");
        let omp = Omp::start("omp");
        // The omp adapter binds its heads under the CLI `omp`.
        let pi = Cli::new("omp").unwrap();
        // The omp head sorts last among this record's two heads.
        let mut head = bound("zz-omp-session", None);
        head.head.record = omp.record();
        assert_eq!(ensure_registered(&root, &fgos_dir(&root), &pi, &head), None);
        let registered = std::fs::read_dir(fgos_identity::directory::directory(&root))
            .unwrap()
            .map(|e| std::fs::read_to_string(e.unwrap().path()).unwrap())
            .collect::<String>();
        let handle = super::session_of(&root, &head.writer, &pi, Some(&omp.record()))
            .unwrap()
            .handle;
        assert!(handle.starts_with("omp-"), "{handle}");
        assert!(
            registered.contains(&format!("\"{handle}\"")),
            "the frame's handle is the one registered: {registered}"
        );
        // The falsifier: derived without the head, the same key reads as pi.
        let neutral = super::session_of(&root, &head.writer, &pi, None)
            .unwrap()
            .handle;
        assert!(neutral.starts_with("pi-"), "{neutral}");

        let heads = [
            view("aa-pi-session", "forgent-pi-aa", "pi", self_record()),
            view("zz-omp-session", "forgent-omp-zz", "omp", omp.record()),
        ];
        match super::address(Some(&root), &fgos_dir(&root), &handle, &heads) {
            super::Addressed::Head { key, .. } => assert_eq!(key.as_str(), "zz-omp-session"),
            super::Addressed::Refused(refusal) => panic!("{refusal:?}"),
        }
        assert!(
            super::handle_conflicts(&root, &heads).is_empty(),
            "no false conflict"
        );
        let _ = std::fs::remove_dir_all(root);
    }

    fn self_record() -> fgos_process::facts::Record {
        fgos_process::facts::identity_of(fgos_process::ProcId(std::process::id()))
            .unwrap()
            .to_record()
    }

    #[test]
    fn a_head_whose_start_time_no_longer_matches_its_pid_is_refused_head_not_live_and_nothing_is_registered(
    ) {
        let claude = Cli::new("claude").unwrap();
        let stale = state_root("stale");
        assert_eq!(
            ensure_registered(
                &stale,
                &fgos_dir(&stale),
                &claude,
                &bound("wiring-stale-head", Some("1"))
            )
            .as_deref(),
            Some("ident:head-not-live")
        );
        assert_eq!(entries(&stale), 0);
        // The falsifier: the same head with its verified start time registers.
        let live = state_root("live");
        assert_eq!(
            ensure_registered(
                &live,
                &fgos_dir(&live),
                &claude,
                &bound("wiring-live-head", None)
            ),
            None
        );
        assert_eq!(entries(&live), 1);
        for root in [stale, live] {
            let _ = std::fs::remove_dir_all(root);
        }
    }

    /// Serves one request on a socket of its own and answers it with `reply`; returns the request it read.
    fn one_reply(
        tag: &str,
        reply: serde_json::Value,
    ) -> (PathBuf, std::thread::JoinHandle<serde_json::Value>) {
        use fgos_run_supervisor::go_channel::{read_frame, write_frame};
        let dir = std::env::temp_dir().join(format!("mbx-bind-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("req.sock");
        let listener = std::os::unix::net::UnixListener::bind(&path).unwrap();
        let server = std::thread::spawn(move || {
            let (mut conn, _) = listener.accept().unwrap();
            let request = read_frame(&mut conn).unwrap();
            let mut answer = reply;
            answer["id"] = request["id"].clone();
            write_frame(&mut conn, &answer).unwrap();
            request
        });
        (path, server)
    }

    #[test]
    fn inside_a_confined_head_the_head_is_bound_through_its_request_socket_and_identity_is_not_written(
    ) {
        let claude = Cli::new("claude").unwrap();
        let root = state_root("bind");
        let (socket, server) = one_reply(
            "done",
            serde_json::json!({ "type": "REPLY", "result": "done", "data": {} }),
        );
        let head = bound("wiring-bound-head", None);
        assert_eq!(
            super::ensure_registered_via(&root, &fgos_dir(&root), &claude, &head, Some(&socket)),
            None
        );
        let request = server.join().unwrap();
        assert_eq!(request["verb"], "session bind session");
        assert_eq!(
            request["args"],
            serde_json::json!({ "source": "CLAUDE_CODE_SESSION_ID", "value": "wiring-bound-head" })
        );
        assert_eq!(
            entries(&root),
            0,
            "the read-only directory is never written from the sandbox"
        );
        // A refused bind is the hook outcome, under Identity's prefix.
        let (socket, server) = one_reply(
            "refused",
            serde_json::json!({ "type": "REPLY", "result": "refused", "code": "session-bind-failed", "detail": "x" }),
        );
        assert_eq!(
            super::ensure_registered_via(&root, &fgos_dir(&root), &claude, &head, Some(&socket))
                .as_deref(),
            Some("ident:session-bind-failed")
        );
        server.join().unwrap();
        let _ = std::fs::remove_dir_all(root);
    }

    /// The Identity entry file of the session `writer` registered under `root`.
    fn entry_text(root: &std::path::Path, writer: &str) -> String {
        let info = super::session_for(
            root,
            &super::IdentityKey {
                source: "CLAUDE_CODE_SESSION_ID",
                value: writer,
            },
            None,
        )
        .unwrap()
        .info;
        let listed = fgos_identity::directory::by_handle(
            root,
            &info.handle,
            &fgos_process::facts::judge_here,
        )
        .unwrap();
        serde_json::to_string(&listed.ids).unwrap()
    }

    #[test]
    fn a_head_registers_its_cli_session_and_mailbox_name_and_a_refresh_writes_only_what_changed() {
        let claude = Cli::new("claude").unwrap();
        let root = state_root("refresh");
        let fgos = fgos_dir(&root);
        let mut head = bound("wiring-refresh-head", None);
        head.name = Some(serde_json::from_value(serde_json::json!("project-claude-ab")).unwrap());
        head.head.cli_session = Some(fgos_identity::cli_dirs::ClaudeSession {
            session_id: Some("wiring-refresh-head".into()),
            name: Some("first-name".into()),
            socket: Some("/tmp/one.sock".into()),
            ..Default::default()
        });
        assert_eq!(ensure_registered(&root, &fgos, &claude, &head), None);
        let registered = entry_text(&root, "wiring-refresh-head");
        assert!(registered.contains("\"first-name\""), "{registered}");
        assert!(registered.contains("\"project-claude-ab\""), "{registered}");
        // Nothing changed: no write, the entry (and its updatedAt) stays as it was.
        assert_eq!(
            super::refresh_registered_via(&root, &fgos, &claude, &head, None),
            None
        );
        assert_eq!(entry_text(&root, "wiring-refresh-head"), registered);
        // A renamed CLI session with a new socket replaces the group, never adds to it.
        head.head.cli_session = Some(fgos_identity::cli_dirs::ClaudeSession {
            session_id: Some("wiring-refresh-head".into()),
            name: Some("second-name".into()),
            socket: Some("/tmp/two.sock".into()),
            ..Default::default()
        });
        assert_eq!(
            super::refresh_registered_via(&root, &fgos, &claude, &head, None),
            None
        );
        let refreshed = entry_text(&root, "wiring-refresh-head");
        assert!(
            refreshed.contains("\"second-name\"") && !refreshed.contains("first-name"),
            "{refreshed}"
        );
        assert!(!refreshed.contains("/tmp/one.sock"), "{refreshed}");
        // Inside a confined head nothing changed asks for nothing: a socket nobody serves is never reached.
        let nowhere = root.join("no-supervisor.sock");
        assert_eq!(
            super::refresh_registered_via(&root, &fgos, &claude, &head, Some(&nowhere)),
            None
        );
        // A `/rename` with the same mailbox name is asked of the supervisor.
        head.head.cli_session = Some(fgos_identity::cli_dirs::ClaudeSession {
            session_id: Some("wiring-refresh-head".into()),
            name: Some("third-name".into()),
            socket: Some("/tmp/two.sock".into()),
            ..Default::default()
        });
        let (socket, server) = one_reply(
            "rename",
            serde_json::json!({ "type": "REPLY", "result": "done", "data": {} }),
        );
        assert_eq!(
            super::refresh_registered_via(&root, &fgos, &claude, &head, Some(&socket)),
            None
        );
        assert_eq!(server.join().unwrap()["verb"], "session bind session");
        // So is a change of mailbox name.
        head.name = Some(serde_json::from_value(serde_json::json!("project-claude-cd")).unwrap());
        let (socket, server) = one_reply(
            "refresh",
            serde_json::json!({ "type": "REPLY", "result": "done", "data": {} }),
        );
        assert_eq!(
            super::refresh_registered_via(&root, &fgos, &claude, &head, Some(&socket)),
            None
        );
        let request = server.join().unwrap();
        assert_eq!(
            request["args"]["mailbox"],
            serde_json::json!({ "fgosDir": fgos.to_str().unwrap(), "name": "project-claude-cd" })
        );
        assert_eq!(entry_text(&root, "wiring-refresh-head"), refreshed);
        let _ = std::fs::remove_dir_all(root);
    }

    /// Registers a live session (this process) of the Claude key `key` with `roles` and `ids`.
    fn register_session(
        root: &std::path::Path,
        key: &str,
        roles: &[&str],
        ids: fgos_identity::directory::Ids,
    ) {
        let info = super::session_for(
            root,
            &super::IdentityKey {
                source: "CLAUDE_CODE_SESSION_ID",
                value: key,
            },
            None,
        )
        .unwrap()
        .info;
        let mut entry = fgos_identity::directory::Entry::new(
            info.id,
            info.handle,
            "claude".into(),
            None,
            None,
            roles.iter().map(|r| r.to_string()).collect(),
            fgos_identity::current::os_record(std::process::id()),
        );
        entry.ids = Some(ids);
        fgos_identity::directory::register(root, entry, false, &fgos_process::facts::judge_here)
            .unwrap();
    }

    #[test]
    fn a_mailbox_name_in_an_identity_record_names_a_head_only_in_that_records_own_project() {
        let root = state_root("xproject");
        let here = fgos_dir(&root);
        let mailbox = |dir: &std::path::Path| fgos_identity::directory::Ids {
            mailbox: Some(fgos_identity::directory::MailboxIds {
                fgos_dir: dir.to_str().unwrap().into(),
                name: "project-claude-ab".into(),
            }),
            ..Default::default()
        };
        // A session of another project holds a role and the same short name there.
        register_session(
            &root,
            "elsewhere-session",
            &["lead:XPROJ"],
            mailbox(&root.join("other/.fgos")),
        );
        let heads = [view(
            "here-key",
            "project-claude-ab",
            "claude",
            self_record(),
        )];
        assert!(
            matches!(
                super::address(Some(&root), &here, "lead:XPROJ", &heads),
                super::Addressed::Refused(fgos_mailbox_core::AliasRefusal::Unknown { .. })
            ),
            "a role held in another project reached a head here"
        );
        // The falsifier: the same name in this project's record is this head.
        register_session(&root, "here-session", &["lead:HERE"], mailbox(&here));
        match super::address(Some(&root), &here, "lead:HERE", &heads) {
            super::Addressed::Head { key, .. } => assert_eq!(key.as_str(), "here-key"),
            other => panic!("{other:?}"),
        }
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn an_identifier_identity_finds_ambiguous_is_refused_even_when_one_of_its_sessions_is_a_head_here(
    ) {
        let root = state_root("ambiguous");
        let pane = |id: &str| fgos_identity::directory::Ids {
            terminal: Some(fgos_identity::directory::TerminalIds {
                driver: "herdr".into(),
                key: None,
                pane_id: id.into(),
                tab_id: None,
                workspace_id: None,
            }),
            ..Default::default()
        };
        register_session(&root, "here-key", &[], pane("w5:p5"));
        register_session(&root, "foreign-key", &[], pane("w5:p5"));
        let heads = [view(
            "here-key",
            "project-claude-ab",
            "claude",
            self_record(),
        )];
        match super::identified(Some(&root), &fgos_dir(&root), "w5:p5", &heads) {
            Some(super::Addressed::Refused(fgos_mailbox_core::AliasRefusal::Ambiguous {
                candidates,
            })) => {
                assert_eq!(candidates.len(), 1, "{candidates:?}");
                assert!(candidates[0].id.ends_with("/here-key"), "{candidates:?}");
            }
            other => panic!("ambiguous must stay a refusal: {other:?}"),
        }
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn text_with_an_at_sign_a_slash_or_a_lead_prefix_is_an_alias_and_every_other_text_a_mailbox_name(
    ) {
        for alias in [
            "claude-5v7u@fg-server",
            "0123abcd/2f9c-uuid",
            "lead:MAIL",
            "@",
            "x/y",
        ] {
            assert!(is_alias(alias), "{alias}");
        }
        for name in [
            "forgent-claude-2b",
            "forgent-codex",
            "team-lab-codex-9c",
            "lead",
            "leader:x",
            "",
            // A group stays a mailbox name: the core refuses it as a group.
            "a@b,c@d",
            "lead:MAIL lead:TEST",
            "x/*",
        ] {
            assert!(!is_alias(name), "{name}");
        }
    }
}
