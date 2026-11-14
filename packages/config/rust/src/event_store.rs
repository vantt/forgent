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

/// An integer key: the value, else the standard's; at least `minimum`, at most the safe-integer bound.
fn number(section: &Value, standard: &Value, key: &str, name: &str, minimum: u64) -> Result<u64, Invalid> {
    let value = section.get(key).unwrap_or_else(|| &standard[key]);
    let number = value.as_f64().filter(|n| n.fract() == 0.0 && n.abs() <= MAX_SAFE_INTEGER);
    match number {
        Some(n) if n >= minimum as f64 => Ok(n as u64),
        _ => Err(invalid(name)),
    }
}

/// A sub-section object: absent is empty, anything else that is not an object breaks the rule.
fn object<'a>(parent: &'a Value, key: &str) -> Result<&'a Value, Invalid> {
    static EMPTY: Value = Value::Null;
    match parent.get(key) {
        None => Ok(&EMPTY),
        Some(value) if value.is_object() => Ok(value),
        Some(_) => Err(invalid(key)),
    }
}

impl EventStoreConfig {
    /// The section value `section` (`None` when the key is absent) over the bundled standard: a key left unset
    /// takes the standard's value. Keys are checked in the order seal, sync, rebuild, remote.
    pub fn from_section(section: Option<&Value>, ctx: &Context) -> Result<Self, Invalid> {
        let standard = ctx.standard.value().get("eventStore").unwrap_or(&Value::Null);
        let empty = Value::Object(Default::default());
        let input = match section {
            None => &empty,
            Some(value) if value.is_object() => value,
            Some(_) => return Err(invalid("eventStore")),
        };
        let (seal, sync, rebuild) = (object(input, "seal")?, object(input, "sync")?, object(input, "rebuild")?);
        let config = Self {
            seal_interval_sec: number(seal, &standard["seal"], "intervalSec", "seal.intervalSec", 1)?,
            seal_coalesce_sec: number(seal, &standard["seal"], "coalesceSec", "seal.coalesceSec", 1)?,
            sync_interval_sec: number(sync, &standard["sync"], "intervalSec", "sync.intervalSec", 0)?,
            rebuild_max_attempts: number(rebuild, &standard["rebuild"], "maxAttempts", "rebuild.maxAttempts", 0)?,
            remote: match input.get("remote").unwrap_or(&standard["remote"]) {
                Value::String(remote) if !remote.is_empty() => remote.clone(),
                _ => return Err(invalid("remote")),
            },
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
