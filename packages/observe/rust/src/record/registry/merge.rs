//! Merging declarations into one registry. A name declared twice with a different meaning is an error naming both
//! sources; the same meaning declared twice is one declaration.

use super::declaration::{
    AttrDef, Declaration, DeclarationSource, KindDef, MeasureDef, EMBEDDED_NAMES,
};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum RegistryError {
    #[error("declaration {origin}: {message}")]
    Parse { origin: String, message: String },
    #[error("declaration {origin}: {message}")]
    Io { origin: String, message: String },
    #[error("{what} '{name}' is declared with different meanings by {first} and {second}")]
    Collision {
        what: &'static str,
        name: String,
        first: String,
        second: String,
    },
    #[error("declaration {origin}: kind '{kind}' names undeclared {what} '{name}'")]
    UnknownName {
        origin: String,
        kind: String,
        what: &'static str,
        name: String,
    },
}

/// A declaration a crate embeds with `include_str!`, injected by the composition root.
#[derive(Debug, Clone, Copy)]
pub struct EmbeddedDeclaration {
    /// Stable label, usually the owning crate; shown as `embedded:<label>`.
    pub label: &'static str,
    pub json: &'static str,
}

impl EmbeddedDeclaration {
    pub(super) fn source(&self) -> DeclarationSource {
        DeclarationSource {
            origin: format!("embedded:{}", self.label),
            text: self.json.to_owned(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct Registry {
    pub(super) subject_kinds: BTreeSet<String>,
    pub(super) attrs: BTreeMap<String, (AttrDef, String)>,
    pub(super) measures: BTreeMap<String, (MeasureDef, String)>,
    pub(super) kinds: BTreeMap<String, (KindDef, String)>,
    /// Alias name to canonical name.
    pub(super) aliases: BTreeMap<String, (String, String)>,
}

impl Registry {
    /// The shared names alone.
    pub fn shared() -> Result<Self, RegistryError> {
        Self::merge(Vec::new())
    }

    /// Merge the shared names with every declaration. Order does not change the result.
    pub fn merge(declarations: Vec<Declaration>) -> Result<Self, RegistryError> {
        let names = Declaration::parse("observe-names", EMBEDDED_NAMES)?;
        let mut registry = Registry {
            subject_kinds: BTreeSet::new(),
            attrs: BTreeMap::new(),
            measures: BTreeMap::new(),
            kinds: BTreeMap::new(),
            aliases: BTreeMap::new(),
        };
        for declaration in std::iter::once(names).chain(declarations) {
            registry.add(declaration)?;
        }
        registry.check_kind_references()?;
        Ok(registry)
    }

    pub fn from_sources(sources: &[DeclarationSource]) -> Result<Self, RegistryError> {
        let declarations = sources
            .iter()
            .map(|s| Declaration::parse(&s.origin, &s.text))
            .collect::<Result<Vec<_>, _>>()?;
        Self::merge(declarations)
    }

    pub fn from_embedded(embedded: &[EmbeddedDeclaration]) -> Result<Self, RegistryError> {
        let sources: Vec<DeclarationSource> =
            embedded.iter().map(EmbeddedDeclaration::source).collect();
        Self::from_sources(&sources)
    }

    fn add(&mut self, d: Declaration) -> Result<(), RegistryError> {
        self.subject_kinds.extend(d.subject_kinds);
        for (name, def) in d.attrs {
            self.claim_aliases(&name, &def.aliases, &d.origin)?;
            self.check_name_free_of_alias("attr", &name, &d.origin)?;
            match self.attrs.get_mut(&name) {
                Some((existing, first)) => {
                    if !same_attr(existing, &def) {
                        return Err(collision("attr", &name, first, &d.origin));
                    }
                    existing.aliases.extend(def.aliases);
                }
                None => {
                    if let Some((_, first)) = self.measures.get(&name) {
                        return Err(collision("attr", &name, first, &d.origin));
                    }
                    self.attrs.insert(name, (def, d.origin.clone()));
                }
            }
        }
        for (name, def) in d.measures {
            self.claim_aliases(&name, &def.aliases, &d.origin)?;
            self.check_name_free_of_alias("measure", &name, &d.origin)?;
            match self.measures.get_mut(&name) {
                Some((existing, first)) => {
                    if existing.unit != def.unit || existing.aggs != def.aggs {
                        return Err(collision("measure", &name, first, &d.origin));
                    }
                    existing.aliases.extend(def.aliases);
                }
                None => {
                    if let Some((_, first)) = self.attrs.get(&name) {
                        return Err(collision("measure", &name, first, &d.origin));
                    }
                    self.measures.insert(name, (def, d.origin.clone()));
                }
            }
        }
        for (name, def) in d.kinds {
            match self.kinds.get(&name) {
                Some((existing, first)) if existing != &def => {
                    return Err(collision("kind", &name, first, &d.origin));
                }
                Some(_) => {}
                None => {
                    self.kinds.insert(name.clone(), (def, d.origin.clone()));
                }
            }
        }
        Ok(())
    }

    fn claim_aliases(
        &mut self,
        canonical: &str,
        aliases: &BTreeSet<String>,
        origin: &str,
    ) -> Result<(), RegistryError> {
        for alias in aliases.iter().filter(|a| a.as_str() != canonical) {
            if self.attrs.contains_key(alias) || self.measures.contains_key(alias) {
                let first = self.source_of(alias).unwrap_or_default();
                return Err(collision("alias", alias, &first, origin));
            }
            match self.aliases.get(alias) {
                Some((existing, first)) if existing != canonical => {
                    return Err(collision("alias", alias, first, origin));
                }
                Some(_) => {}
                None => {
                    self.aliases
                        .insert(alias.clone(), (canonical.to_owned(), origin.to_owned()));
                }
            }
        }
        Ok(())
    }

    fn check_name_free_of_alias(
        &self,
        what: &'static str,
        name: &str,
        origin: &str,
    ) -> Result<(), RegistryError> {
        match self.aliases.get(name) {
            Some((_, first)) => Err(collision(what, name, first, origin)),
            None => Ok(()),
        }
    }

    fn source_of(&self, name: &str) -> Option<String> {
        self.attrs
            .get(name)
            .map(|(_, s)| s.clone())
            .or_else(|| self.measures.get(name).map(|(_, s)| s.clone()))
    }

    fn check_kind_references(&self) -> Result<(), RegistryError> {
        for (kind, (def, origin)) in &self.kinds {
            let unknown = |what: &'static str, name: &String| RegistryError::UnknownName {
                origin: origin.clone(),
                kind: kind.clone(),
                what,
                name: name.clone(),
            };
            if let Some(n) = def
                .subjects
                .iter()
                .find(|n| !self.subject_kinds.contains(*n))
            {
                return Err(unknown("subject kind", n));
            }
            if let Some(n) = def.attrs.iter().find(|n| !self.attrs.contains_key(*n)) {
                return Err(unknown("attr", n));
            }
            if let Some(n) = def
                .measures
                .iter()
                .find(|n| !self.measures.contains_key(*n))
            {
                return Err(unknown("measure", n));
            }
        }
        Ok(())
    }

    /// The canonical name for a name or an alias; a name the registry does not know comes back unchanged.
    pub fn canonical_name<'a>(&'a self, name: &'a str) -> &'a str {
        self.aliases
            .get(name)
            .map_or(name, |(canonical, _)| canonical)
    }

    pub fn kind(&self, name: &str) -> Option<&KindDef> {
        self.kinds.get(name).map(|(def, _)| def)
    }

    pub fn attr(&self, name: &str) -> Option<&AttrDef> {
        self.attrs.get(name).map(|(def, _)| def)
    }

    pub fn measure(&self, name: &str) -> Option<&MeasureDef> {
        self.measures.get(name).map(|(def, _)| def)
    }

    pub fn has_subject_kind(&self, name: &str) -> bool {
        self.subject_kinds.contains(name)
    }

    pub fn kind_names(&self) -> impl Iterator<Item = &str> {
        self.kinds.keys().map(String::as_str)
    }
}

fn same_attr(a: &AttrDef, b: &AttrDef) -> bool {
    a.value_type == b.value_type && a.values == b.values
}

fn collision(what: &'static str, name: &str, first: &str, second: &str) -> RegistryError {
    RegistryError::Collision {
        what,
        name: name.to_owned(),
        first: first.to_owned(),
        second: second.to_owned(),
    }
}
