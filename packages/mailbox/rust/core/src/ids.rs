//! Identifiers. Fresh values come only from the [`IdSource`] port, never
//! from a counter in the snapshot: a lost or reset snapshot must never reuse
//! an id, because the frame tells the model to ignore a repeated id.
use serde::{Deserialize, Serialize};
use std::fmt;

/// The only port of the core: a source of fresh numbers.
pub trait IdSource {
    fn next_u64(&mut self) -> u64;
}

/// A value given to a constructor that breaks its rule.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvalidValue {
    what: &'static str,
    rule: &'static str,
}

impl InvalidValue {
    const fn new(what: &'static str, rule: &'static str) -> Self {
        Self { what, rule }
    }
}

impl fmt::Display for InvalidValue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "invalid {}: {}", self.what, self.rule)
    }
}

impl std::error::Error for InvalidValue {}

/// Lowercase hex of fresh numbers, exactly `len` characters long.
pub(crate) fn drawn_hex(ids: &mut dyn IdSource, len: usize) -> String {
    let mut digits = String::new();
    while digits.len() < len {
        digits.push_str(&format!("{:016x}", ids.next_u64()));
    }
    digits.split_off(digits.len() - len)
}

/// Lowercase hex of one fresh number.
fn minted(ids: &mut dyn IdSource) -> String {
    format!("{:x}", ids.next_u64())
}

macro_rules! opaque_id {
    ($(#[$doc:meta])* $name:ident) => {
        $(#[$doc])*
        #[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
        #[serde(transparent)]
        pub struct $name(String);

        impl $name {
            /// A fresh value from the id source.
            pub fn mint(ids: &mut dyn IdSource) -> Self {
                Self(minted(ids))
            }

            /// A value read back from outside, for example from a caller's hint.
            pub fn from_text(text: impl Into<String>) -> Self {
                Self(text.into())
            }

            pub fn as_str(&self) -> &str {
                &self.0
            }
        }

        impl fmt::Display for $name {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                f.write_str(&self.0)
            }
        }
    };
}

opaque_id!(
    /// Opaque unique id of a message or notice (spec §5.1).
    MessageId
);
opaque_id!(
    /// Opaque token of one claim (spec §5.2).
    AttemptToken
);

/// The identity writer id of a head: the key of its binding. Never
/// typed by a person. Its alphabet is session identity's, `[A-Za-z0-9._-]`:
/// every composite key of the snapshot joins keys with `|` or `@`, and the
/// shared accounts start with `~`, all outside it, so no two different
/// parts can encode the same key. Its length is bounded by
/// `frame.maxHeaderChars` where the limits are at hand (registration and
/// `send`).
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct WriterKey(String);

impl WriterKey {
    pub fn new(text: impl Into<String>) -> Result<Self, InvalidValue> {
        let text = text.into();
        let valid = !text.is_empty()
            && text
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'));
        if !valid {
            return Err(InvalidValue::new(
                "writer key",
                "must be non-empty [A-Za-z0-9._-]",
            ));
        }
        Ok(Self(text))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for WriterKey {
    type Error = InvalidValue;
    fn try_from(text: String) -> Result<Self, Self::Error> {
        Self::new(text)
    }
}

impl From<WriterKey> for String {
    fn from(key: WriterKey) -> Self {
        key.0
    }
}

impl fmt::Display for WriterKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

/// The CLI a head runs, held as an opaque word (spec §4 rule 1).
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct Cli(String);

impl Cli {
    pub fn new(text: impl Into<String>) -> Result<Self, InvalidValue> {
        let text = text.into();
        let valid = !text.is_empty()
            && text
                .chars()
                .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit());
        if !valid {
            return Err(InvalidValue::new("cli", "must be non-empty [a-z0-9]"));
        }
        Ok(Self(text))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for Cli {
    type Error = InvalidValue;
    fn try_from(text: String) -> Result<Self, Self::Error> {
        Self::new(text)
    }
}

impl From<Cli> for String {
    fn from(cli: Cli) -> Self {
        cli.0
    }
}

/// A head's short name, `<project>-<cli>-<suffix>` (spec §5.1.1). Only the
/// core allocates one.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct ShortName(String);

impl ShortName {
    pub(crate) fn new(text: String) -> Self {
        Self(text)
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for ShortName {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

/// The per-process generation of an address (spec §5.1).
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct Generation(u32);

impl Generation {
    /// The generation of an address that was never held before.
    pub const FIRST: Generation = Generation(1);

    pub const fn get(self) -> u32 {
        self.0
    }

    /// The generation after this one; `None` once the last is used.
    pub const fn next(self) -> Option<Generation> {
        match self.0.checked_add(1) {
            Some(n) => Some(Generation(n)),
            None => None,
        }
    }
}
