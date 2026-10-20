use crate::declaration::Registry;
use crate::source::{Lookup, SecretSource, SecretValue};
use std::collections::HashMap;
use std::fmt;

/// A layer a value can come from.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Origin {
    Environment,
    ProjectFile,
    GlobalFile,
}

impl Origin {
    /// The order of spec section 5.2.
    pub const DEFAULT_ORDER: [Origin; 3] =
        [Origin::Environment, Origin::ProjectFile, Origin::GlobalFile];
}

/// One layer the resolver looked in, with what it found there.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Searched {
    pub place: String,
    pub outcome: &'static str,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ResolveError {
    NotDeclared {
        name: String,
    },
    ConsumerRefused {
        name: String,
        consumer: String,
    },
    Unresolved {
        name: String,
        searched: Vec<Searched>,
    },
}

impl fmt::Display for ResolveError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NotDeclared { name } => write!(f, "secret {name} is not declared"),
            Self::ConsumerRefused { name, consumer } => {
                write!(
                    f,
                    "consumer {consumer} is not allowed to receive secret {name}"
                )
            }
            Self::Unresolved { name, searched } => {
                write!(f, "unresolved reference ${{{name}}}; searched: ")?;
                if searched.is_empty() {
                    return f.write_str("nothing (no source configured)");
                }
                for (i, s) in searched.iter().enumerate() {
                    if i > 0 {
                        f.write_str(", ")?;
                    }
                    write!(f, "{} ({})", s.place, s.outcome)?;
                }
                Ok(())
            }
        }
    }
}

impl std::error::Error for ResolveError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Resolved {
    pub value: SecretValue,
    pub origin: Origin,
}

/// Resolves a name for one named consumer. Does no I/O of its own: the
/// environment is a map, files are read through [`SecretSource`].
pub struct Resolver<'a> {
    pub(crate) registry: &'a Registry,
    order: Vec<Origin>,
    pub(crate) env: &'a HashMap<String, String>,
    project: Option<&'a dyn SecretSource>,
    global: Option<&'a dyn SecretSource>,
}

impl<'a> Resolver<'a> {
    /// `order` lists the layers to search, first hit wins; a layer left out
    /// is never searched.
    pub fn new(
        registry: &'a Registry,
        order: Vec<Origin>,
        env: &'a HashMap<String, String>,
        project: Option<&'a dyn SecretSource>,
        global: Option<&'a dyn SecretSource>,
    ) -> Self {
        Self {
            registry,
            order,
            env,
            project,
            global,
        }
    }

    /// Resolve a declared secret for `consumer`. An empty value counts as
    /// not set, so an empty string is never returned as a key.
    pub fn resolve(&self, name: &str, consumer: &str) -> Result<Resolved, ResolveError> {
        let declaration = self
            .registry
            .get(name)
            .ok_or_else(|| ResolveError::NotDeclared {
                name: name.to_owned(),
            })?;
        if !declaration.consumers.iter().any(|c| c == consumer) {
            return Err(ResolveError::ConsumerRefused {
                name: name.to_owned(),
                consumer: consumer.to_owned(),
            });
        }
        let mut searched = Vec::new();
        for origin in &self.order {
            match origin {
                Origin::Environment => match self.env.get(name).filter(|v| !v.is_empty()) {
                    Some(v) => {
                        return Ok(Resolved {
                            value: SecretValue::new(v.clone()),
                            origin: *origin,
                        })
                    }
                    None => searched.push(Searched {
                        place: "environment".into(),
                        outcome: "not set",
                    }),
                },
                Origin::ProjectFile | Origin::GlobalFile => {
                    let source = if *origin == Origin::ProjectFile {
                        self.project
                    } else {
                        self.global
                    };
                    let Some(source) = source else { continue };
                    match source.get(name) {
                        Lookup::Found(v) if !v.expose().is_empty() => {
                            return Ok(Resolved {
                                value: v,
                                origin: *origin,
                            });
                        }
                        Lookup::Found(_) | Lookup::Absent => {
                            searched.push(Searched {
                                place: source.describe(),
                                outcome: "absent",
                            });
                        }
                        Lookup::Unavailable => {
                            searched.push(Searched {
                                place: source.describe(),
                                outcome: "unavailable",
                            });
                        }
                    }
                }
            }
        }
        Err(ResolveError::Unresolved {
            name: name.to_owned(),
            searched,
        })
    }
}
