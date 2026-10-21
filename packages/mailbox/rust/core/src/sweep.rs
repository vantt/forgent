//! The lazy sweep (spec §5.2): there is no daemon, so whichever operation
//! runs next applies every time rule.
use crate::envelope::MessageState;
use crate::limits::Limits;
use crate::state::MailboxState;
use crate::time::Timestamp;

impl MailboxState {
    /// Applies every time rule as of `now`.
    pub fn sweep(&mut self, now: Timestamp, _limits: &Limits) {
        let now = self.advance(now);
        self.return_expired_claims(now);
    }

    /// An in-flight message past its deadline returns to `recorded`; its
    /// offer was already counted when it was claimed.
    fn return_expired_claims(&mut self, now: Timestamp) {
        for header in &mut self.messages {
            if let MessageState::InFlight { deadline, .. } = header.state {
                if now > deadline {
                    header.state = MessageState::Recorded;
                    header.changed_at = now;
                }
            }
        }
    }
}
