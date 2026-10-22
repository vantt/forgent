//! The hook's configuration, read from the same `mailbox` config section as
//! the core's `Limits`. Every field is required and none has a default: the
//! values live only in `packages/mailbox/contracts/limits.v1.json`, under the
//! keys whose reader is `hook`.
use serde::{Deserialize, Serialize};

/// The hook's keys of the `mailbox` section. Unknown top-level keys are
/// accepted because the section also holds the core's keys.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HookLimits {
    pub stop_block: StopBlockLimits,
    pub hook: HookCallLimits,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StopBlockLimits {
    /// Consecutive Stop blocks that were written and finished for one head
    /// generation before a Stop passes without claiming.
    pub max: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct HookCallLimits {
    /// The longest wait, in milliseconds, for the mailbox lock before a hook
    /// skips its drain; the next hook call tries again.
    pub lock_wait_ms: u64,
    /// The whole-hook failure ceiling in milliseconds, not a target: an
    /// entry still running when it passes exits 0 without printing, unless
    /// its stdout write has started.
    pub budget_ms: u64,
    /// The largest foreign JSON document the hook reads, in bytes: its stdin
    /// payload and the CLI's own session file.
    pub max_read_bytes: u64,
    pub breaker: BreakerLimits,
}

/// The circuit breaker (spec §4.1): after `failures` consecutive counted
/// failures, hook calls skip the drain for `pause_sec`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BreakerLimits {
    pub failures: u32,
    pub pause_sec: u64,
}
