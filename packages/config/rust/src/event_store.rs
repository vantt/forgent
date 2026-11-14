//! The `eventStore` config section as a typed value: its minimums, its defaults from the bundled standard, and
//! what a refused config file means for the Event Store's triggers. Every reader of these keys asks here; none
//! re-reads a key or re-applies a minimum.
use serde_json::Value;

use crate::snapshot::{Context, SnapshotError};

/// The section, every key set.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EventStoreConfig {
    /// The git remote the store publishes to and fetches from.
    pub remote: String,
    pub seal_interval_sec: u64,
    pub seal_coalesce_sec: u64,
    /// Seconds between syncs with the remote; 0 turns the timer off.
    pub sync_interval_sec: u64,
    pub rebuild_max_attempts: u64,
}

/// A value of the section that breaks its rule; `name` is the dotted key (`seal.intervalSec`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Invalid(pub String);

impl std::fmt::Display for Invalid {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "event-store-config: invalid {}", self.0)
    }
}

impl std::error::Error for Invalid {}

/// Largest integer a JavaScript number holds exactly: the bound a numeric key shares with the Node readers.
const MAX_SAFE_INTEGER: f64 = 9_007_199_254_740_991.0;

fn invalid(name: &str) -> Invalid {
    Invalid(name.into())
}

/// The integer keys `keys` (`(key, minimum)`) of one sub-section: absent is empty, anything else that is no object breaks
/// the rule; each value is the section's, else the standard's, a whole number from its minimum to the safe-integer bound.
fn numbers<const N: usize>(
    input: &Value,
    standard: &Value,
    section: &str,
    keys: [(&str, u64); N],
) -> Result<[u64; N], Invalid> {
    static ABSENT: Value = Value::Null;
    let own = match input.get(section) {
        None => &ABSENT,
        Some(value) if value.is_object() => value,
        Some(_) => return Err(invalid(section)),
    };
    let mut out = [0; N];
    for (slot, (key, minimum)) in out.iter_mut().zip(keys) {
        let value = own.get(key).unwrap_or(&standard[section][key]);
        let whole = value
            .as_f64()
            .filter(|n| n.fract() == 0.0 && n.abs() <= MAX_SAFE_INTEGER);
        *slot = match whole {
            Some(n) if n >= minimum as f64 => n as u64,
            _ => return Err(Invalid(format!("{section}.{key}"))),
        };
    }
    Ok(out)
}

impl EventStoreConfig {
    /// The section value `section` (`None` when the key is absent) over the bundled standard: a key left unset
    /// takes the standard's value. Keys are checked in the order seal, sync, rebuild, remote.
    pub fn from_section(section: Option<&Value>, ctx: &Context) -> Result<Self, Invalid> {
        let standard = ctx
            .standard
            .value()
            .get("eventStore")
            .unwrap_or(&Value::Null);
        let empty = Value::Object(Default::default());
        let input = match section {
            None => &empty,
            Some(value) if value.is_object() => value,
            Some(_) => return Err(invalid("eventStore")),
        };
        let [seal_interval_sec, seal_coalesce_sec] = numbers(
            input,
            standard,
            "seal",
            [("intervalSec", 1), ("coalesceSec", 1)],
        )?;
        let [sync_interval_sec] = numbers(input, standard, "sync", [("intervalSec", 0)])?;
        let [rebuild_max_attempts] = numbers(input, standard, "rebuild", [("maxAttempts", 0)])?;
        let remote = match input.get("remote").unwrap_or(&standard["remote"]) {
            Value::String(remote) if !remote.is_empty() => remote.clone(),
            _ => return Err(invalid("remote")),
        };
        let config = Self {
            remote,
            seal_interval_sec,
            seal_coalesce_sec,
            sync_interval_sec,
            rebuild_max_attempts,
        };
        Ok(config)
    }

    /// What a refusal of the config files means for a trigger: a config that never publishes
    /// (`sync.intervalSec` 0), so a trigger still seals and never publishes against the user's real setting.
    /// `None` when the refusal must reach the caller instead: a `strict` caller (it reports on or acts for the
    /// user), a refusal that names an `eventStore` value, and a failure that is no refusal of a file.
    pub fn when_refused(error: &SnapshotError, strict: bool, ctx: &Context) -> Option<Self> {
        let SnapshotError::Refused(all) = error else {
            return None;
        };
        let about_event_store = all.iter().any(|refusal| {
            refusal
                .path
                .as_deref()
                .is_some_and(|at| at == "eventStore" || at.starts_with("eventStore."))
        });
        if strict || about_event_store {
            return None;
        }
        let standard = Self::from_section(None, ctx).ok()?;
        Some(Self {
            sync_interval_sec: 0,
            ..standard
        })
    }
}
