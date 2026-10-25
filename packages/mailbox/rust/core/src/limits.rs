//! The core's configuration, in the exact shape of the `mailbox` config
//! section. Every field is required and none has a default (spec §5.3, "not in
//! code constants"): a project reads the values from the Config standard
//! layer, `core/config-standard/mailbox.yaml`, and the crates' own tests from
//! `packages/mailbox/contracts/limits.v1.json`, which a host test keeps
//! equal. Byte and second values are `u64`, counts are `u32`.
use serde::{Deserialize, Serialize};

/// The `mailbox` section. Unknown top-level keys are accepted because later
/// rungs add `hook` and `status` keys that the core does not read.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Limits {
    pub max_body_bytes: u64,
    pub chain: ChainLimits,
    pub session: SessionLimits,
    pub human: HumanLimits,
    #[serde(rename = "loop")]
    pub loop_guard: LoopLimits,
    pub queue: QueueLimits,
    pub counters: CounterLimits,
    pub record: RecordLimits,
    pub in_flight_ttl_sec: u64,
    pub max_offers: u32,
    pub wake: WakeLimits,
    pub notices: NoticeLimits,
    pub frame: FrameLimits,
}

impl Limits {
    /// How long a settled header is kept: the longest window that may still
    /// read it, `max(loop.windowSec, record.ttlSec, record.bodyRetentionSec)`.
    pub fn header_horizon_sec(&self) -> u64 {
        self.loop_guard
            .window_sec
            .max(self.record.ttl_sec)
            .max(self.record.body_retention_sec)
    }

    /// The most headers the shared sender with no head (the one identity no
    /// lifetime cap brakes, owner decision Q3) can leave within the header
    /// horizon: `session.budget` per budget window, over the windows the
    /// horizon spans. A window opens only once the last one is more than
    /// `human.fallbackWindowSec` past, so no further window straddles it.
    pub fn sender_header_ceiling(&self) -> u64 {
        let windows = self
            .header_horizon_sec()
            .div_ceil(self.human.fallback_window_sec.max(1));
        u64::from(self.session.budget).saturating_mul(windows)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ChainLimits {
    pub max_depth: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SessionLimits {
    pub budget: u32,
    pub lifetime_cap: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct HumanLimits {
    pub fallback_window_sec: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LoopLimits {
    pub max_per_window: u32,
    pub window_sec: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct QueueLimits {
    pub cap: u32,
    pub per_sender: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CounterLimits {
    pub max_keys: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RecordLimits {
    pub ttl_sec: u64,
    pub body_retention_sec: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct WakeLimits {
    pub exchange_gap_sec: u64,
    pub max_per_exchange: u32,
    pub lifetime_cap: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NoticeLimits {
    pub cap: u32,
    pub window_sec: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FrameLimits {
    pub max_header_chars: u32,
}
