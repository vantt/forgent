//! Identity names as `send` addresses (spec §5.1.1): an Identity handle
//! (`claude-5v7u@fg-server`), a full id (`<machine-id>/<local id>`) or a role
//! alias (`lead:<LANE>`), resolved through Identity's own doors and delivered
//! only to a head this project's record holds. The mailbox crates never see
//! Identity: this wiring hands the core either a head's key or a typed
//! refusal (`SendRequest::alias_refusal`).
//!
//! Identity's directory is machine-wide and unauthenticated: any process of
//! the same user can register a session or take a role (spec §8). So a
//! resolved session is used only when it is one of this record's heads, a
//! role delivery names the holder in the report, and candidates are cut to
//! this record's heads, never the machine's sessions.
use fgos_identity::directory::{resolve, ROLE_PREFIX};
use fgos_identity::resolve::{WriterKey as IdentityKey, ENV_ORDER};
use fgos_identity::session::cli_of;
use fgos_identity::{session_for, Candidate, Liveness as IdentityLiveness, SessionInfo};
use fgos_mailbox::verbs::HeadView;
use fgos_mailbox_core::{AliasCandidate, AliasRefusal, Cli, Liveness, WriterKey};
use fgos_process::facts::judge_here;
use std::path::Path;

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
/// character, whatever its project folder is called.
pub fn is_alias(to: &str) -> bool {
    to.contains('@') || to.contains('/') || to.starts_with(ROLE_PREFIX)
}

/// The Identity session of a mailbox head: its full id and handle, derived
/// by Identity from the head's key and CLI. `None` when Identity has no
/// session-id variable for that CLI or no machine id yet.
pub fn session_of(state_root: &Path, key: &WriterKey, cli: &Cli) -> Option<SessionInfo> {
    let source = ENV_ORDER
        .iter()
        .find(|var| cli_of(var, key.as_str()) == cli.as_str())?;
    session_for(
        state_root,
        &IdentityKey {
            source,
            value: key.as_str(),
        },
    )
    .ok()
    .map(|session| session.info)
}

/// Resolves the alias `to` against Identity's directory under `state_root`
/// and this record's live `heads`. `state_root` is `None` when the caller
/// may not read Identity's state (no `HOME`): every alias is then unknown.
pub fn address(state_root: Option<&Path>, to: &str, heads: &[HeadView]) -> Addressed {
    let unknown = |candidates, no_address_here| {
        Addressed::Refused(AliasRefusal::Unknown {
            candidates,
            no_address_here,
        })
    };
    let Some(root) = state_root else {
        return unknown(Vec::new(), false);
    };
    let ours: Vec<(&HeadView, SessionInfo)> = heads
        .iter()
        .filter_map(|head| Some((head, session_of(root, &head.key, &head.cli)?)))
        .collect();
    let is_role = to.starts_with(ROLE_PREFIX);
    let by_handle = to.contains('@');
    let head = |key: &WriterKey, role_holder| Addressed::Head {
        key: key.clone(),
        role_holder,
    };
    match resolve(root, to, &judge_here) {
        Ok(listed) => ours
            .iter()
            .find(|(_, info)| info.id == listed.id && (!by_handle || info.handle == to))
            .map_or_else(
                || unknown(Vec::new(), true),
                |(view, _)| {
                    head(
                        &view.key,
                        is_role.then(|| (to.to_string(), listed.handle.clone())),
                    )
                },
            ),
        Err(refusal) if refusal.reason == "ambiguous" => {
            Addressed::Refused(AliasRefusal::Ambiguous {
                candidates: ours_only(&refusal.candidates, &ours),
            })
        }
        Err(refusal) => {
            // A head Identity does not know yet (it never registered there)
            // is still reachable by the handle Identity derives for it.
            let derived = by_handle
                .then(|| ours.iter().find(|(_, info)| info.handle == to))
                .flatten();
            match derived {
                Some((view, _)) => head(&view.key, None),
                None => unknown(ours_only(&refusal.candidates, &ours), false),
            }
        }
    }
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
    use super::is_alias;

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
        ] {
            assert!(!is_alias(name), "{name}");
        }
    }
}
