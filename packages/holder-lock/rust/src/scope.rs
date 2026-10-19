//! Explicit transaction-local lock order, from the same registry Node reads.
use crate::{
    acquire, validate, Acquire, BorrowedHandle, Handle, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS,
};
use std::{collections::BTreeMap, path::PathBuf, sync::OnceLock};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HeldLock {
    pub name: String,
    pub rank: u64,
}
#[derive(Debug)]
pub enum ScopeError {
    Registry(String),
    InvalidHandle(String),
    Order {
        held: Vec<HeldLock>,
        acquiring: HeldLock,
    },
    Acquire(Box<Acquire>),
}
impl std::fmt::Display for ScopeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Registry(s) => write!(f, "lock-registry-invalid: {s}"),
            Self::InvalidHandle(s) => write!(f, "lock-handle-invalid: {s}"),
            Self::Order { held, acquiring } => write!(
                f,
                "lock-order-violation: held={held:?}, acquiring={acquiring:?}"
            ),
            Self::Acquire(a) => write!(f, "lock-acquire-unavailable: {a:?}"),
        }
    }
}
impl std::error::Error for ScopeError {}

fn entry(name: &str) -> Result<&'static serde_json::Value, ScopeError> {
    static REGISTRY: OnceLock<serde_json::Value> = OnceLock::new();
    let registry = REGISTRY.get_or_init(|| {
        serde_json::from_str(include_str!("../../contracts/lock-registry.v1.json"))
            .expect("embedded lock registry")
    });
    registry["locks"]
        .as_array()
        .and_then(|rows| rows.iter().find(|row| row["name"] == name))
        .ok_or_else(|| ScopeError::Registry(format!("unknown-lock: {name}")))
}
pub fn rank(name: &str) -> Result<u64, ScopeError> {
    entry(name)?["rank"]
        .as_u64()
        .ok_or_else(|| ScopeError::Registry(name.into()))
}

/// Owns acquired locks and close-only copies of the caller's verified holds.
/// No global rank set; dropping the scope closes every description it owns.
#[derive(Debug)]
pub struct LockScope<'a> {
    seeded: Vec<BorrowedHandle<'a>>,
    acquired: Vec<Handle>,
}
impl<'a> LockScope<'a> {
    pub fn seeded(held: Vec<BorrowedHandle<'a>>) -> Result<Self, ScopeError> {
        let mut ranks = std::collections::BTreeSet::new();
        for handle in &held {
            validate(handle.as_ref()).map_err(|e| ScopeError::InvalidHandle(e.to_string()))?;
            let name = handle.as_ref().name();
            if !ranks.insert(rank(name)?) {
                return Err(ScopeError::InvalidHandle(format!(
                    "duplicate held rank: {name}"
                )));
            }
        }
        Ok(Self {
            seeded: held,
            acquired: Vec::new(),
        })
    }
    /// A verified hold remains opaque and borrowed for the scope lifetime.
    pub fn handle(&self, name: &str) -> Option<&Handle> {
        self.seeded.iter().map(AsRef::as_ref).chain(self.acquired.iter()).find(|h| h.name() == name)
    }
    pub fn holding(&self) -> Result<Vec<HeldLock>, ScopeError> {
        self.seeded
            .iter()
            .map(AsRef::as_ref)
            .chain(self.acquired.iter())
            .map(|h| {
                Ok(HeldLock {
                    name: h.name().into(),
                    rank: rank(h.name())?,
                })
            })
            .collect()
    }
    pub fn assert_can_acquire(&self, name: &str) -> Result<(), ScopeError> {
        let acquiring = HeldLock {
            name: name.into(),
            rank: rank(name)?,
        };
        let held = self.holding()?;
        if held.iter().any(|h| h.rank >= acquiring.rank) {
            return Err(ScopeError::Order { held, acquiring });
        }
        self.validate()
    }
    /// Recheck every authority, including immediately before an effect.
    pub fn validate(&self) -> Result<(), ScopeError> {
        for h in self
            .seeded
            .iter()
            .map(AsRef::as_ref)
            .chain(self.acquired.iter())
        {
            validate(h).map_err(|e| ScopeError::InvalidHandle(e.to_string()))?;
        }
        Ok(())
    }
    /// Resolve the registry's exact template; no guessed root or missing key.
    /// Order is checked before creating a directory or opening a description.
    pub fn acquire(
        &mut self,
        name: &str,
        params: &BTreeMap<String, String>,
        wait: Wait,
    ) -> Result<&Handle, ScopeError> {
        self.assert_can_acquire(name)?;
        let row = entry(name)?;
        if row["kind"] == "hot-mutex" {
            return Err(ScopeError::Registry(
                "hot-mutex requires the hot-state port".into(),
            ));
        }
        let mut path = row["v3Path"]
            .as_str()
            .ok_or_else(|| ScopeError::Registry(name.into()))?
            .to_owned();
        while let Some(start) = path.find('<') {
            let end = path[start..]
                .find('>')
                .map(|n| start + n)
                .ok_or_else(|| ScopeError::Registry("malformed template".into()))?;
            let key = &path[start + 1..end];
            let value = params
                .get(key)
                .filter(|v| !v.is_empty() && !v.contains(['<', '>']))
                .ok_or_else(|| ScopeError::Registry(format!("lock-path-param-missing: {key}")))?;
            path.replace_range(start..=end, value);
        }
        let path = PathBuf::from(path);
        if !path.is_absolute() {
            return Err(ScopeError::Registry("absolute lock path required".into()));
        }
        std::fs::create_dir_all(
            path.parent()
                .ok_or_else(|| ScopeError::Registry("lock parent missing".into()))?,
        )
        .map_err(|e| ScopeError::Registry(e.to_string()))?;
        let resource = Resource::new(name, path);
        match acquire(&resource, Mode::Ex, wait, DEFAULT_KILL_WAIT_MS) {
            Acquire::Acquired(handle) => {
                self.acquired.push(handle);
                Ok(self.acquired.last().expect("just acquired"))
            }
            other => Err(ScopeError::Acquire(Box::new(other))),
        }
    }
}
