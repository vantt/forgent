use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fmt;

/// A secret named without its value. Safe to commit: the shape has no field
/// that could hold a value, and unknown fields are refused on parse.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Declaration {
    pub name: String,
    pub source: String,
    pub consumers: Vec<String>,
    /// Always true in this version.
    #[serde(default = "always")]
    pub redact: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub login_store: Option<String>,
}

fn always() -> bool {
    true
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RegistryError {
    InvalidName(String),
    Duplicate(String),
    RedactDisabled(String),
}

impl fmt::Display for RegistryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidName(n) => write!(f, "invalid secret name {n:?}: use letters, digits and underscore, not starting with a digit"),
            Self::Duplicate(n) => write!(f, "secret {n} is declared more than once"),
            Self::RedactDisabled(n) => write!(f, "secret {n}: redact must be true in this version"),
        }
    }
}

impl std::error::Error for RegistryError {}

/// True for a name usable in `${NAME}`.
pub(crate) fn is_valid_name(name: &str) -> bool {
    let mut chars = name.chars();
    matches!(chars.next(), Some(c) if c == '_' || c.is_ascii_alphabetic())
        && chars.all(|c| c == '_' || c.is_ascii_alphanumeric())
}

/// The declared secrets. Holds no value.
#[derive(Debug, Clone, Default)]
pub struct Registry {
    declarations: BTreeMap<String, Declaration>,
}

impl Registry {
    pub fn new(declarations: Vec<Declaration>) -> Result<Self, RegistryError> {
        let mut map = BTreeMap::new();
        for d in declarations {
            if !is_valid_name(&d.name) {
                return Err(RegistryError::InvalidName(d.name));
            }
            if !d.redact {
                return Err(RegistryError::RedactDisabled(d.name));
            }
            let name = d.name.clone();
            if map.insert(name.clone(), d).is_some() {
                return Err(RegistryError::Duplicate(name));
            }
        }
        Ok(Self { declarations: map })
    }

    pub fn get(&self, name: &str) -> Option<&Declaration> {
        self.declarations.get(name)
    }

    pub fn iter(&self) -> impl Iterator<Item = &Declaration> {
        self.declarations.values()
    }
}
