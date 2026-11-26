//! Outbound question delivery. Adapters choose channels; Questions keeps the record.

use crate::record::Asked;
use crate::Refusal;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DeliveryRef {
    pub channel: String,
    pub reference: String,
}

/// Delivery is attempted only after the ask is durable. An adapter must not
/// interpret the question's content as commands.
pub trait Notifier {
    fn deliver(&self, question: &Asked) -> Result<DeliveryRef, Refusal>;
}

/// Today's owner mailbox is the question stream itself, read by `questions list`
/// and the owner's dashboard. No second message or store is needed.
pub struct OwnerMailbox;

impl Notifier for OwnerMailbox {
    fn deliver(&self, question: &Asked) -> Result<DeliveryRef, Refusal> {
        if question.to.is_some() {
            return Err(Refusal::new(
                "channel-unavailable",
                "no channel adapter is registered for this recipient",
            ));
        }
        Ok(DeliveryRef {
            channel: "owner-mailbox".into(),
            reference: question.id.clone(),
        })
    }
}
