use crate::declaration::is_valid_name;
use crate::resolver::{ResolveError, Resolver};
use std::fmt;

/// Result of expanding one string: the text and the declared secrets used,
/// so a caller can register them with redaction and report them in status.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Expansion {
    pub text: String,
    pub used: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ExpandError {
    Resolve(ResolveError),
    /// A `${` that is not a well-formed `${NAME}`; `offset` is a byte offset.
    Malformed {
        offset: usize,
    },
}

impl fmt::Display for ExpandError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Resolve(e) => e.fmt(f),
            Self::Malformed { offset } => {
                write!(f, "malformed reference at byte {offset}: expected ${{NAME}}; write $${{ for a literal ${{")
            }
        }
    }
}

impl std::error::Error for ExpandError {}

impl From<ResolveError> for ExpandError {
    fn from(e: ResolveError) -> Self {
        Self::Resolve(e)
    }
}

impl Resolver<'_> {
    /// The one expansion of `${NAME}`. `$${` writes a literal `${`.
    ///
    /// A declared name is resolved for `consumer` through the layers in
    /// order, and is listed in `used`. A name that is not declared is a
    /// plain environment reference: it is read from the environment only,
    /// never from a secrets file, and is not listed. Either way a reference
    /// that does not resolve is an error naming the variable and what was
    /// searched; it never becomes an empty string.
    pub fn expand(&self, input: &str, consumer: &str) -> Result<Expansion, ExpandError> {
        let mut text = String::with_capacity(input.len());
        let mut used: Vec<String> = Vec::new();
        let mut rest = input;
        let mut offset = 0;
        while let Some(at) = rest.find('$') {
            text.push_str(&rest[..at]);
            let tail = &rest[at..];
            let here = offset + at;
            if let Some(after) = tail.strip_prefix("$${") {
                text.push_str("${");
                offset = here + 3;
                rest = after;
            } else if let Some(body) = tail.strip_prefix("${") {
                let close = body
                    .find('}')
                    .ok_or(ExpandError::Malformed { offset: here })?;
                let name = &body[..close];
                if !is_valid_name(name) {
                    return Err(ExpandError::Malformed { offset: here });
                }
                if self.registry.get(name).is_some() {
                    let resolved = self.resolve(name, consumer)?;
                    text.push_str(resolved.value.expose());
                    if !used.iter().any(|u| u == name) {
                        used.push(name.to_owned());
                    }
                } else {
                    match self.env.get(name).filter(|v| !v.is_empty()) {
                        Some(v) => text.push_str(v),
                        None => {
                            return Err(ResolveError::Unresolved {
                                name: name.to_owned(),
                                searched: vec![crate::resolver::Searched {
                                    place: "environment".into(),
                                    outcome: "not set",
                                }],
                            }
                            .into());
                        }
                    }
                }
                offset = here + 2 + close + 1;
                rest = &body[close + 1..];
            } else {
                text.push('$');
                offset = here + 1;
                rest = &tail[1..];
            }
        }
        text.push_str(rest);
        Ok(Expansion { text, used })
    }
}
