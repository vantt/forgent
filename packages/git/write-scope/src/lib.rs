//! Consumer-independent write scope grammar. No Git, IO, or grant policy.
use std::collections::HashSet;
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ScopeError(pub String);
impl std::fmt::Display for ScopeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}
impl std::error::Error for ScopeError {}
type Result<T> = std::result::Result<T, ScopeError>;
// ECMAScript trim includes BOM and excludes NEL, unlike Rust's is_whitespace.
fn space(c: char) -> bool {
    matches!(c, '\u{0009}'..='\u{000d}' | '\u{0020}' | '\u{00a0}' | '\u{1680}' | '\u{2000}'..='\u{200a}' | '\u{2028}' | '\u{2029}' | '\u{202f}' | '\u{205f}' | '\u{3000}' | '\u{feff}')
}
pub fn canonicalize(raw: &str) -> Result<String> {
    let mut value = raw.to_owned();
    loop {
        let trimmed = value.trim_matches(space);
        let fail = |why| Err(ScopeError(format!("write entry {why}: {raw:?}")));
        if trimmed.starts_with('/') {
            return fail("must be repo-relative, got absolute path");
        }
        if trimmed.contains(['\\', '\0']) {
            return fail("must not contain a backslash or NUL byte");
        }
        let mut parts = vec![];
        for part in trimmed.split('/').filter(|s| !s.is_empty() && *s != ".") {
            if part == "**" && parts.last() == Some(&"**") {
                continue;
            }
            parts.push(part);
        }
        if parts.is_empty() {
            return fail("must name a path inside the repo");
        }
        if parts.contains(&"..") {
            return fail("must not contain a \"..\" segment");
        }
        if parts[0].starts_with(':') {
            return fail("must not start with \":\" (git pathspec magic)");
        }
        if parts.iter().any(|s| s.contains("**") && *s != "**") {
            return fail("requires \"**\" to be a whole path segment");
        }
        let joined = parts.join("/");
        if joined == joined.trim_matches(space) {
            return Ok(joined);
        }
        value = joined;
    }
}
pub fn canonicalize_all(entries: &[String]) -> Result<Vec<String>> {
    let mut seen = HashSet::new();
    let mut result = vec![];
    for (i, entry) in entries.iter().enumerate() {
        let entry = canonicalize(entry).map_err(|e| ScopeError(format!("writes[{i}]: {e}")))?;
        if seen.insert(entry.clone()) {
            result.push(entry);
        }
    }
    Ok(result)
}
fn segment(pattern: &str, value: &str) -> bool {
    let (p, v) = (pattern.as_bytes(), value.as_bytes());
    let (mut i, mut j, mut star, mut retry) = (0, 0, None, 0);
    while j < v.len() {
        if i < p.len() && p[i] == b'*' {
            star = Some(i);
            i += 1;
            retry = j;
        } else if i < p.len() && p[i] == v[j] {
            i += 1;
            j += 1;
        } else if let Some(s) = star {
            retry += 1;
            j = retry;
            i = s + 1;
        } else {
            return false;
        }
    }
    while i < p.len() && p[i] == b'*' {
        i += 1;
    }
    i == p.len()
}
fn glob(pattern: &[&str], path: &[&str]) -> bool {
    let mut row = vec![false; path.len() + 1];
    row[0] = true;
    for part in pattern {
        let mut next = vec![false; row.len()];
        if *part == "**" {
            next[0] = row[0];
            for j in 1..row.len() {
                next[j] = row[j] || next[j - 1];
            }
        } else {
            for j in 1..row.len() {
                next[j] = row[j - 1] && segment(part, path[j - 1]);
            }
        }
        row = next;
    }
    row[path.len()]
}
/// Query bytes are never trimmed. Invalid UTF-8 has a lossless diagnostic.
pub fn path_text(bytes: &[u8]) -> Result<&str> {
    std::str::from_utf8(bytes).map_err(|_| {
        ScopeError(format!(
            "unscopable-byte-path: hex:{}",
            bytes.iter().map(|b| format!("{b:02x}")).collect::<String>()
        ))
    })
}
pub fn matches(path: &[u8], scope: &[String]) -> Result<bool> {
    let path = path_text(path)?;
    if path.starts_with('/') || path.contains(['\\', '\0']) {
        return Ok(false);
    }
    let parts: Vec<_> = path
        .split('/')
        .filter(|s| !s.is_empty() && *s != ".")
        .collect();
    if parts.is_empty() || parts.contains(&"..") || parts[0] == ".fgos" {
        return Ok(false);
    }
    let normalized = parts.join("/");
    for raw in scope {
        let entry = canonicalize(raw)?;
        if if entry.contains('*') {
            glob(&entry.split('/').collect::<Vec<_>>(), &parts)
        } else {
            normalized == entry || normalized.starts_with(&format!("{entry}/"))
        } {
            return Ok(true);
        }
    }
    Ok(false)
}
fn prefix(entry: &str) -> String {
    entry
        .split('/')
        .take_while(|s| !s.contains('*'))
        .collect::<Vec<_>>()
        .join("/")
}
/// Whether normalized literal path prefixes intersect (empty denotes the root).
pub fn overlaps(a: &str, b: &str) -> bool {
    a.is_empty()
        || b.is_empty()
        || a == b
        || a.starts_with(&format!("{b}/"))
        || b.starts_with(&format!("{a}/"))
}
pub fn expand(entries: &[String], mappings: &[(String, Vec<String>)]) -> Result<Vec<String>> {
    let scope = canonicalize_all(entries)?;
    let mut result = scope.clone();
    for (from, also) in mappings {
        let from = prefix(&canonicalize(from)?);
        if scope.iter().any(|s| overlaps(&prefix(s), &from)) {
            result.extend(also.clone());
        }
    }
    canonicalize_all(&result)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn grammar_and_byte_paths() {
        for bad in ["", ".", "../a", "/a", "a\\b", ":(glob)a", "ab**", "a\0b"] {
            assert!(canonicalize(bad).is_err(), "{bad:?}");
        }
        for (raw, want) in [
            (" ./docs//", "docs"),
            ("docs /", "docs"),
            ("a/**/**/b", "a/**/b"),
            ("\u{feff}a", "a"),
        ] {
            assert_eq!(canonicalize(raw).unwrap(), want);
        }
        assert!(path_text(&[255]).unwrap_err().0.contains("hex:ff"));
    }
    #[test]
    fn golden_matching() {
        for (p, s, want) in [
            ("a/b", "a/**/b", true),
            ("a/x/y/b", "a/**/b", true),
            ("a/x/y", "a/*", false),
            ("docs-old/a", "docs", false),
            (".fgos/a", "**", false),
            ("a/[x]?", "a/[x]?", true),
            (" a ", "a", false),
            ("tài liệu/x", "tài*/*", true),
        ] {
            assert_eq!(matches(p.as_bytes(), &[s.into()]).unwrap(), want);
        }
    }
}
