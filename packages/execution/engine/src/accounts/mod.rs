//! Provider accounts: the lease of one account for one attempt, its quarantine and probes, rotation and pin.
//!
//! The pure facts stay in `fgos-execution`: the account inventory, the legacy state key, the credential store of
//! an invocation and the account view Seat Binding ranks from. This module adds only what touches the machine:
//! the lease state file under the `provider-state` lock, the account lock, the unlock and account probes, and the
//! rotation and pin rules around them. Account state is the port Seat Binding owns; this module is its adapter:
//! the account view is read outside the state lock, a lease takes exactly the account the crate named, and no
//! program starts under the state lock.

pub mod account_probe;
pub mod credential;
pub mod credential_probe;
pub mod fault;
pub mod host;
pub mod login_homes;
pub mod pin;
pub mod rotation;
pub mod session_probe;
pub mod state;
pub mod time;

pub use host::{Host, Liveness, SystemHost};
pub use state::{
    AccountLock, Accounts, AccountsError, FaultRecord, NamedLease, ProbeRecord, ProbeRequest,
    QuarantineProbe, QuarantineSet, Reclaim, LEASE_CONFLICT_REASON,
};

/// The handle of one leased provider account: which account of which provider a run holds, and where the state
/// that records it lives. Releasing it drops the lease record.
#[derive(Debug, Clone, PartialEq, Eq)]
#[non_exhaustive]
pub struct AccountLease {
    pub provider: String,
    pub account_id: String,
    pub run_id: String,
    pub assignment_id: Option<String>,
}

impl AccountLease {
    /// The lease a successful selection (`status: selected`) granted; `None` for a refusal or no selection.
    pub fn from_selection(selection: &serde_json::Value) -> Option<Self> {
        if selection.get("status")?.as_str()? != "selected" {
            return None;
        }
        let lease = selection.get("lease")?;
        Some(Self {
            provider: selection.get("provider")?.as_str()?.to_string(),
            account_id: selection.get("accountId")?.as_str()?.to_string(),
            run_id: lease.get("runId")?.as_str()?.to_string(),
            assignment_id: lease
                .get("assignmentId")
                .and_then(|a| a.as_str())
                .map(String::from),
        })
    }

    /// Drop the lease record; whether there was one.
    pub fn release(&self, accounts: &Accounts) -> Result<bool, AccountsError> {
        accounts.release_account_lease(&self.provider, &self.account_id, &self.run_id)
    }
}
