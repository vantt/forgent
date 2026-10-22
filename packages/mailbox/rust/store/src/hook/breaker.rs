//! The hook's circuit breaker (spec §4.1, plan decision 11): after
//! `hook.breaker.failures` consecutive counted failures, hook calls skip
//! the drain for `hook.breaker.pauseSec`, so a broken mailbox never stalls
//! tool calls up to the whole hook budget.
//!
//! Counted: a record error other than lock contention (a wait outcome, not
//! a fault), and a caught panic. Not counted: every benign quiet reason, a
//! config error (the entry never reaches the shell), and a budget exit (the
//! watchdog writes nothing on its way out, so a stalled disk cannot keep
//! the process from exiting).
//!
//! The state lives in `runtime/mailbox/breaker.json`, beside the record and
//! not inside it, because the failure it counts may be the record itself.
//! It is read and written only after the directory chain passed the
//! record's trust check; an untrusted chain reads as closed and writes
//! nothing. Any unreadable state also reads as closed. The file is written
//! without the mailbox lock: concurrent failures may lose an increment,
//! which only delays opening. A success writes only when the stored state
//! is not already closed and zero, so the no-mail path never writes it.
use super::shell::{Quiet, ShellOutcome};
use super::BreakerLimits;
use crate::record::{read_regular_capped, Paths, Record, LOCK_BUSY};
use fgos_mailbox_core::Timestamp;
use serde::{Deserialize, Serialize};

/// The largest breaker file read; the state is a few dozen bytes.
const MAX_FILE_BYTES: u64 = 4096;

/// How far in the future a stored opening time may lie and still count:
/// clocks of two processes on one machine may disagree a little. A time
/// further ahead reads as closed, so a planted value cannot extend the
/// pause.
const CLOCK_SKEW_MS: u64 = 5_000;

const SCHEMA: u32 = 1;

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct State {
    schema: u32,
    failures: u32,
    opened_at_ms: Option<u64>,
}

/// The breaker of one record, as read at the start of one hook call.
pub struct Breaker<'a> {
    record: &'a Record,
    limits: &'a BreakerLimits,
    stored: State,
}

impl<'a> Breaker<'a> {
    /// Reads the stored state once; the call's later decisions use it.
    pub fn load(record: &'a Record, limits: &'a BreakerLimits) -> Self {
        let stored = read(record);
        Self {
            record,
            limits,
            stored,
        }
    }

    /// Whether hook calls at `now` skip the drain.
    pub fn is_open(&self, now: Timestamp) -> bool {
        let now = now.as_millis();
        self.stored.opened_at_ms.is_some_and(|opened| {
            opened <= now.saturating_add(CLOCK_SKEW_MS)
                && now < opened.saturating_add(self.limits.pause_sec.saturating_mul(1000))
        })
    }

    /// Counts a finished call: a counted failure adds one and opens the
    /// breaker at the configured count; anything else closes it and
    /// resets the count, writing only when there was something to reset.
    pub fn after(&self, outcome: &ShellOutcome, now: Timestamp) {
        let next = if counts(outcome) {
            let failures = self.stored.failures.saturating_add(1);
            State {
                schema: SCHEMA,
                failures,
                opened_at_ms: (failures >= self.limits.failures).then_some(now.as_millis()),
            }
        } else if self.stored.failures > 0 || self.stored.opened_at_ms.is_some() {
            State {
                schema: SCHEMA,
                ..State::default()
            }
        } else {
            return;
        };
        write(self.record, &next);
    }
}

fn read(record: &Record) -> State {
    let Some(dir) = record.trusted_mailbox_dir() else {
        return State::default();
    };
    read_regular_capped(&dir.join(Paths::breaker_name()), MAX_FILE_BYTES)
        .ok()
        .and_then(|bytes| serde_json::from_slice::<State>(&bytes).ok())
        .filter(|state| state.schema == SCHEMA)
        .unwrap_or_default()
}

fn write(record: &Record, state: &State) {
    let Some(dir) = record.trusted_mailbox_dir() else {
        return;
    };
    if let Ok(bytes) = serde_json::to_vec(state) {
        // A failed write only leaves the old state: the breaker is a
        // bound on repeated failure, never a reason to fail a call.
        let _ = fgos_durable_file::replace_durably(&dir, Paths::breaker_name(), &bytes);
    }
}

/// Whether a finished call counts as a failure.
fn counts(outcome: &ShellOutcome) -> bool {
    outcome.panicked || matches!(outcome.quiet, Some(Quiet::Record(code)) if code != LOCK_BUSY)
}
