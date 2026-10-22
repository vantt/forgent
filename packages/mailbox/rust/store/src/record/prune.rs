//! Retiring dead bindings under the owner's rule (spec §17, Q2): a binding
//! is forgotten only when its head is judged `Dead`, it has been idle past
//! `record.ttlSec`, and no header or notice names it. The liveness is the
//! store's one judgement, `head::stored_liveness`.
use crate::head::stored_liveness;
use fgos_mailbox_core::{Limits, Liveness, MailboxState, Timestamp, WriterKey};
use std::collections::BTreeSet;

/// Forgets every binding the rule allows and returns their keys. Runs only
/// in a hold that writes anyway, so it never turns a hook with no mail into
/// a write.
pub(super) fn prune(state: &mut MailboxState, now: Timestamp, limits: &Limits) -> Vec<WriterKey> {
    let named: BTreeSet<&WriterKey> = state
        .messages()
        .flat_map(|h| [&h.from, &h.to])
        .chain(state.notices().flat_map(|n| [&n.to, &n.about_to]))
        .collect();
    let forgotten: Vec<WriterKey> = state
        .bindings()
        .filter(|b| !named.contains(&b.key))
        .filter(|b| {
            let last = b.last_drain_at.map_or(b.last_seen, |d| d.max(b.last_seen));
            now.is_past(last, limits.record.ttl_sec)
        })
        .filter(|b| stored_liveness(b) == Liveness::Dead)
        .map(|b| b.key.clone())
        .collect();
    for key in &forgotten {
        state.forget_key(key);
    }
    forgotten
}

/// The keys whose head the store judges `Dead`; a send's name resolution
/// skips them (owner decision Q2, option B).
pub(super) fn dead_keys(state: &MailboxState) -> BTreeSet<WriterKey> {
    state
        .bindings()
        .filter(|b| stored_liveness(b) == Liveness::Dead)
        .map(|b| b.key.clone())
        .collect()
}
