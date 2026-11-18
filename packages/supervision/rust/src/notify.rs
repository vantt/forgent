//! The mailbox notifier: tells a human-facing mailbox that an event was raised. The only code in
//! the watcher path that spawns a process; the tick itself sees it through the `Notifier` port.
use crate::queue::RaisedEvent;
use std::{io::ErrorKind, process::Command};

/// What one notification did. A refusal or a missing host never aborts a tick.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum NotifyOutcome {
    Sent,
    Refused(String),
    Unavailable,
}

pub trait Notifier {
    fn notify(&self, event: &RaisedEvent) -> NotifyOutcome;
}

/// The one-line mailbox body for `event`.
pub fn message(event: &RaisedEvent) -> String {
    format!(
        "{} {}: {}; next: {}",
        event.kind, event.subject, event.reason, event.next_command
    )
}

/// Runs `<host> mailbox send --to <notify_to> -- "<message>"`. A `None` recipient is `Unavailable`.
pub struct MailboxNotifier {
    host: String,
    notify_to: Option<String>,
}

impl MailboxNotifier {
    pub fn new(host: impl Into<String>, notify_to: Option<String>) -> Self {
        Self {
            host: host.into(),
            notify_to,
        }
    }
}

impl Notifier for MailboxNotifier {
    fn notify(&self, event: &RaisedEvent) -> NotifyOutcome {
        let Some(to) = self.notify_to.as_deref().filter(|t| !t.is_empty()) else {
            return NotifyOutcome::Unavailable;
        };
        let output = Command::new(&self.host)
            .args(["mailbox", "send", "--to", to, "--"])
            .arg(message(event))
            .output();
        match output {
            Ok(out) if out.status.success() => NotifyOutcome::Sent,
            Ok(out) => {
                NotifyOutcome::Refused(String::from_utf8_lossy(&out.stderr).trim().to_owned())
            }
            Err(e) if e.kind() == ErrorKind::NotFound => NotifyOutcome::Unavailable,
            Err(e) => NotifyOutcome::Refused(e.to_string()),
        }
    }
}
