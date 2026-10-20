#![allow(dead_code)]
use fgos_secrets::{CheckFailure, Declaration, Lookup, Registry, SecretSource, SecretValue};
use std::collections::HashMap;

pub const FAKE: &str = "fake-value-for-test";

pub fn declaration(name: &str, consumers: &[&str]) -> Declaration {
    Declaration {
        name: name.into(),
        source: "file".into(),
        consumers: consumers.iter().map(|c| (*c).into()).collect(),
        redact: true,
        login_store: None,
    }
}

pub fn registry(name: &str, consumers: &[&str]) -> Registry {
    Registry::new(vec![declaration(name, consumers)]).unwrap()
}

pub fn env(pairs: &[(&str, &str)]) -> HashMap<String, String> {
    pairs
        .iter()
        .map(|(k, v)| ((*k).into(), (*v).into()))
        .collect()
}

/// In-memory source: the core is exercised without a real file.
pub struct MemorySource {
    pub label: String,
    pub entries: HashMap<String, String>,
    pub unavailable: bool,
}

impl MemorySource {
    pub fn new(label: &str, pairs: &[(&str, &str)]) -> Self {
        Self {
            label: label.into(),
            entries: env(pairs),
            unavailable: false,
        }
    }
}

impl SecretSource for MemorySource {
    fn get(&self, name: &str) -> Lookup {
        if self.unavailable {
            return Lookup::Unavailable;
        }
        self.entries.get(name).map_or(Lookup::Absent, |v| {
            Lookup::Found(SecretValue::new(v.clone()))
        })
    }
    fn has(&self, name: &str) -> bool {
        matches!(self.get(name), Lookup::Found(_))
    }
    fn describe(&self) -> String {
        self.label.clone()
    }
    fn check(&self) -> Result<(), CheckFailure> {
        Ok(())
    }
}
