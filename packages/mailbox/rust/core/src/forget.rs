//! Removing what belongs to a process or a key. The core decides nothing
//! about when: a `Dead` takeover drops the old generation's records here,
//! and the store (V2) calls [`MailboxState::forget_key`] under the owner's
//! rule for retiring dead bindings (spec §17, Q2).
use crate::ids::{Generation, WriterKey};
use crate::state::MailboxState;

impl MailboxState {
    /// Drops the records of `key`'s generation `generation`, which can no
    /// longer send: its lifetime count, its wake lifetime counts, and the
    /// key's exchanges and budget window. Nothing it could still do changes.
    pub(crate) fn drop_generation_records(&mut self, key: &WriterKey, generation: Generation) {
        self.lifetime.retain(|k, _| !k.is_of(key, Some(generation)));
        self.wake_lifetime
            .retain(|k, _| !k.is_from(key, Some(generation)));
        self.exchanges.retain(|k, _| !k.involves(key.as_str()));
        self.budget
            .retain(|account, _| account.as_str() != key.as_str());
    }

    /// Removes every record of `key`: its binding, the headers and notices
    /// that name it, and its entries in every keyed map and in the per-party
    /// counters (the per-reason totals stay). Other heads' wake lifetime
    /// counts toward `key` stay, as at a takeover. A later registration of
    /// the key starts clean at generation 1. Returns whether a binding
    /// existed.
    pub fn forget_key(&mut self, key: &WriterKey) -> bool {
        let existed = self.bindings.remove(key).is_some();
        self.messages.retain(|h| &h.from != key && &h.to != key);
        self.notices.retain(|n| &n.to != key && &n.about_to != key);
        self.notice_last.retain(|mark, _| !mark.is_of(key));
        self.lifetime.retain(|k, _| !k.is_of(key, None));
        // Only the key's own counts as a sender: what other heads spent on
        // waking it is theirs and is never reset, as at a takeover.
        self.wake_lifetime.retain(|k, _| !k.is_from(key, None));
        self.exchanges.retain(|k, _| !k.involves(key.as_str()));
        self.budget
            .retain(|account, _| account.as_str() != key.as_str());
        self.counters.forget(key.as_str());
        existed
    }
}
