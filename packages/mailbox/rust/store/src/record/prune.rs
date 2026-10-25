//! Retiring dead bindings under the owner's rule (spec §17, Q2): a binding
//! is forgotten only when its head is judged `Dead`, it has been idle past
//! `record.ttlSec` since it registered or last drained, and no header names
//! it. A notice never names a key that no header names (it is created when
//! its message is refused, and that header outlives it), so headers alone
//! decide. The liveness is the store's one judgement,
//! `head::stored_liveness`.
use crate::head::stored_liveness;
use fgos_mailbox_core::{Binding, Limits, Liveness, MailboxState, Timestamp, WriterKey};
use std::collections::BTreeSet;

/// Forgets every binding the rule allows and returns their keys. Runs only
/// in a hold that writes anyway, so it never turns a hook with no mail into
/// a write. `judged` is the set of dead keys when the hold already judged
/// every binding (a send); otherwise only the bindings that pass the cheap
/// conditions are judged here.
pub(super) fn prune(
    state: &mut MailboxState,
    now: Timestamp,
    limits: &Limits,
    judged: Option<&BTreeSet<WriterKey>>,
) -> Vec<WriterKey> {
    let named: BTreeSet<&WriterKey> = state.messages().flat_map(|h| [&h.from, &h.to]).collect();
    let dead = |b: &Binding| match judged {
        Some(dead) => dead.contains(&b.key),
        None => stored_liveness(b) == Liveness::Dead,
    };
    let forgotten: Vec<WriterKey> = state
        .bindings()
        .filter(|b| !named.contains(&b.key))
        .filter(|b| {
            let last = b.last_drain_at.map_or(b.last_seen, |d| d.max(b.last_seen));
            now.is_past(last, limits.record.ttl_sec)
        })
        .filter(|b| dead(b))
        .map(|b| b.key.clone())
        .collect();
    for key in &forgotten {
        state.forget_key(key);
    }
    forgotten
}

/// The keys whose head the store judges `Dead`: judged once per send,
/// before the core runs; name resolution skips them (owner decision Q2,
/// option B) and the send's prune reuses the judgement.
pub(super) fn dead_keys(state: &MailboxState) -> BTreeSet<WriterKey> {
    state
        .bindings()
        .filter(|b| stored_liveness(b) == Liveness::Dead)
        .map(|b| b.key.clone())
        .collect()
}
