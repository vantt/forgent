//! The mailbox's use of Identity, in the host wiring only (the mailbox
//! crates never call Identity): a head's handle derived for a frame header,
//! a newly bound head made known to Identity's directory, and Identity names
//! as `send` addresses.
//!
//! Addresses (spec §5.1.1): an Identity handle
//! (`claude-5v7u@fg-server`), a full id (`<machine-id>/<local id>`) or a role
//! alias (`lead:<LANE>`), resolved through Identity's own doors and delivered
//! only to a head this project's record holds. The mailbox crates never see
//! Identity: this wiring hands the core either a head's key or a typed
//! refusal (`Recipient::Key` or `Recipient::Refused`).
//!
//! Identity's directory is machine-wide and unauthenticated: any process of
//! the same user can register a session or take a role (spec §8). So a
//! resolved session is used only when it is one of this record's heads, a
//! role delivery names the holder in the report, and candidates are cut to
//! this record's heads, never the machine's sessions.
use fgos_identity::directory::{register_writer, resolve, ROLE_PREFIX};
use fgos_identity::resolve::{HeadRef, WriterKey as IdentityKey, ENV_ORDER};
use fgos_identity::session::cli_of;
use fgos_identity::{session_for, Candidate, Liveness as IdentityLiveness, SessionInfo};
use fgos_mailbox::hook::shell::BoundHead;
use fgos_mailbox::verbs::HeadView;
use fgos_mailbox_core::{AliasCandidate, AliasRefusal, Cli, Liveness, WriterKey};
use fgos_process::facts::{judge_here, Record};
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
    (to.contains('@') || to.contains('/') || to.starts_with(ROLE_PREFIX))
        && !fgos_mailbox_core::is_group(to)
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
/// (Identity refuses `head-not-live` when the pid now runs another process).
/// Returns the hook-outcome reason when it did not hold; nothing is retried
/// in this process.
///
/// Known limit, inside the same-user boundary of spec §8 item 3: the
/// watchdog may end the process inside Identity's durable write and leave
/// its temporary file in Identity's directory. Identity's scan reads only
/// `*.json` entries, so the file is never counted or resolved; it only takes
/// disk space until removed.
pub fn ensure_registered(state_root: &Path, cli: &Cli, head: &BoundHead) -> Option<String> {
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
    match resolve(state_root, &own.handle, &judge_here) {
        Ok(listed) if listed.id == own.id => None,
        Ok(_) => Some("ident-handle-in-use".to_string()),
        Err(refusal) if refusal.reason == "not-found" => {
            register_writer(state_root, None, &key, &head_ref, &[], false)
                .err()
                .and_then(|refusal| refused(refusal.reason))
        }
        Err(refusal) => refused(refusal.reason),
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
pub fn address(state_root: Option<&Path>, to: &str, heads: &[HeadView]) -> Addressed {
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
    let is_role = to.starts_with(ROLE_PREFIX);
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
    match resolve(root, to, &judge_here) {
        Ok(listed) => ours
            .iter()
            .find(|(_, info)| info.id == listed.id && (!by_handle || info.handle == to))
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
        let held = || match resolve(state_root, &info.handle, &judge_here) {
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

/// Identity's candidates that are heads of this record.
fn ours_only(candidates: &[Candidate], ours: &[(&HeadView, SessionInfo)]) -> Vec<AliasCandidate> {
    candidates
        .iter()
        .filter(|c| ours.iter().any(|(_, info)| info.id == c.id))
        .map(|c| AliasCandidate {
            id: c.id.clone(),
            handle: c.handle.clone(),
            liveness: match c.liveness {
                IdentityLiveness::Alive => Liveness::Alive,
                IdentityLiveness::Unknown => Liveness::Unknown,
            },
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
            head: HeadFacts {
                record,
                own_suffix: None,
                handle: None,
            },
            registered: None,
        }
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

    /// A child process whose kernel command name is `omp`: a copy of `sleep`
    /// under that name, killed on drop.
    struct Omp(std::process::Child, PathBuf);

    impl Omp {
        fn start(tag: &str) -> Self {
            let dir = std::env::temp_dir().join(format!("mbx-omp-{tag}-{}", std::process::id()));
            std::fs::create_dir_all(&dir).unwrap();
            let bin = dir.join("omp");
            std::fs::copy("/bin/sleep", &bin).unwrap();
            let child = std::process::Command::new(&bin).arg("60").spawn().unwrap();
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
        assert_eq!(ensure_registered(&root, &pi, &head), None);
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
        match super::address(Some(&root), &handle, &heads) {
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
            ensure_registered(&stale, &claude, &bound("wiring-stale-head", Some("1"))).as_deref(),
            Some("ident:head-not-live")
        );
        assert_eq!(entries(&stale), 0);
        // The falsifier: the same head with its verified start time registers.
        let live = state_root("live");
        assert_eq!(
            ensure_registered(&live, &claude, &bound("wiring-live-head", None)),
            None
        );
        assert_eq!(entries(&live), 1);
        for root in [stale, live] {
            let _ = std::fs::remove_dir_all(root);
        }
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
