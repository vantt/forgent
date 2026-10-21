//! Short names and name resolution (spec §5.1.1).
use crate::ids::{drawn_hex, Cli, IdSource, ShortName};
use crate::limits::Limits;
use crate::registry::Binding;
use crate::state::MailboxState;
use std::fmt;

/// The length of a short name's suffix before any collision (spec §5.1.1).
const SUFFIX_LEN: usize = 2;

/// Why a typed name did not resolve to exactly one head.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ResolveRefusal {
    /// The query names several heads at once; agents may not address a group.
    Group,
    /// Several heads match at the first step that matched more than one.
    Ambiguous { candidates: Vec<ShortName> },
    /// Nothing matches; every current name, sorted.
    Unknown { candidates: Vec<ShortName> },
}

impl ResolveRefusal {
    pub const fn code(&self) -> &'static str {
        match self {
            Self::Group => "group",
            Self::Ambiguous { .. } => "ambiguous-name",
            Self::Unknown { .. } => "unknown-name",
        }
    }
}

impl fmt::Display for ResolveRefusal {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.code())
    }
}

impl std::error::Error for ResolveRefusal {}

pub(crate) fn in_name_alphabet(c: char) -> bool {
    c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-')
}

fn is_own_suffix(text: &str) -> bool {
    text.len() == SUFFIX_LEN
        && text
            .chars()
            .all(|c| c.is_ascii_digit() || c.is_ascii_lowercase())
}

/// Builds `<project>-<cli>-<suffix>`, cutting the project part so the whole
/// name fits the header bound. `None` when no project character fits.
fn compose(project: &str, cli: &Cli, suffix: &str, limits: &Limits) -> Option<String> {
    let tail = format!("-{}-{}", cli.as_str(), suffix);
    let room = (limits.frame.max_header_chars as usize).checked_sub(tail.len())?;
    let part: String = project
        .chars()
        .map(|c| if in_name_alphabet(c) { c } else { '-' })
        .take(room)
        .collect();
    (!part.is_empty()).then(|| part + &tail)
}

/// Allocates a free short name. The head's own two characters are kept when
/// valid and free; otherwise drawn hex, one character longer per collision.
pub(crate) fn allocate(
    state: &MailboxState,
    project: &str,
    cli: &Cli,
    own_suffix: Option<&str>,
    limits: &Limits,
    ids: &mut dyn IdSource,
) -> Option<ShortName> {
    let taken = |name: &str| state.bindings().any(|b| b.name.as_str() == name);
    let mut len = SUFFIX_LEN;
    if let Some(own) = own_suffix.filter(|s| is_own_suffix(s)) {
        let name = compose(project, cli, own, limits)?;
        if !taken(&name) {
            return Some(ShortName::new(name));
        }
        len += 1;
    }
    loop {
        let name = compose(project, cli, &drawn_hex(ids, len), limits)?;
        if !taken(&name) {
            return Some(ShortName::new(name));
        }
        len += 1;
    }
}

fn names_of<'a>(bindings: impl Iterator<Item = &'a Binding>) -> Vec<ShortName> {
    let mut names: Vec<ShortName> = bindings.map(|b| b.name.clone()).collect();
    names.sort();
    names
}

impl MailboxState {
    /// Resolves a typed name to exactly one head: exact short name, then a
    /// unique short-name prefix, then the exact key, then a unique key
    /// prefix. A name is never
    /// taken from message text.
    pub fn resolve(&self, query: &str) -> Result<&Binding, ResolveRefusal> {
        if query
            .chars()
            .any(|c| c == ',' || c == '*' || c.is_whitespace())
        {
            return Err(ResolveRefusal::Group);
        }
        if !query.is_empty() {
            if let Some(exact) = self.bindings().find(|b| b.name.as_str() == query) {
                return Ok(exact);
            }
            let steps: [&dyn Fn(&Binding) -> bool; 3] = [
                &|b| b.name.as_str().starts_with(query),
                &|b| b.key.as_str() == query,
                &|b| b.key.as_str().starts_with(query),
            ];
            for matches in steps {
                let found: Vec<&Binding> = self.bindings().filter(|b| matches(b)).collect();
                match found.as_slice() {
                    [] => continue,
                    [one] => return Ok(one),
                    many => {
                        return Err(ResolveRefusal::Ambiguous {
                            candidates: names_of(many.iter().copied()),
                        })
                    }
                }
            }
        }
        Err(ResolveRefusal::Unknown {
            candidates: names_of(self.bindings()),
        })
    }
}
