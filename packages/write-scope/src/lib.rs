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
/// Whether two whole scopes may touch the same path: any entry prefix of one overlaps any of the other.
pub fn scopes_overlap(a: &[String], b: &[String]) -> Result<bool> {
    let (a, b) = (canonicalize_all(a)?, canonicalize_all(b)?);
    Ok(a.iter()
        .any(|x| b.iter().any(|y| overlaps(&prefix(x), &prefix(y)))))
}
/// Longest entry accepted, in bytes.
pub const MAX_ENTRY_BYTES: usize = 1024;
/// Most entries compared per item; the surplus is reported, not compared.
pub const MAX_ENTRIES_PER_ITEM: usize = 512;
/// Most pairs emitted before the answer is cut with `pairs-cap`.
pub const MAX_PAIRS: usize = 100_000;
/// Most entry-against-entry comparisons before the answer is cut with `comparison-cap`.
pub const MAX_COMPARISONS: u64 = 50_000_000;
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub id: String,
    pub scopes: Vec<String>,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Pair {
    pub a: String,
    pub b: String,
    /// Entries of `a`, as declared, that may overlap at least one entry of `b`.
    pub shared: Vec<String>,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Problem {
    pub item: String,
    /// `entry-invalid`, `scope-empty`, `entry-too-long` or `scope-too-large`.
    pub code: &'static str,
    pub entry: Option<String>,
    pub why: Option<String>,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Truncated {
    /// `pairs-cap` or `comparison-cap`.
    pub reason: &'static str,
    pub limit: u64,
}
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Collisions {
    pub pairs: Vec<Pair>,
    pub problems: Vec<Problem>,
    pub truncated: Option<Truncated>,
}
#[derive(Debug, Clone, Copy)]
pub struct Limits {
    pub entry_bytes: usize,
    pub entries_per_item: usize,
    pub pairs: usize,
    pub comparisons: u64,
}
pub const LIMITS: Limits = Limits {
    entry_bytes: MAX_ENTRY_BYTES,
    entries_per_item: MAX_ENTRIES_PER_ITEM,
    pairs: MAX_PAIRS,
    comparisons: MAX_COMPARISONS,
};
/// Every pair of items whose scopes may touch the same path, in input order; unreadable entries are
/// reported by item and entry, never dropped. Pairwise over canonical prefixes, no index.
pub fn colliding_pairs(items: &[Item]) -> Collisions {
    colliding_pairs_with(items, LIMITS)
}
pub fn colliding_pairs_with(items: &[Item], limits: Limits) -> Collisions {
    let mut out = Collisions::default();
    // (declared spelling, literal prefix) per comparable entry, deduplicated by canonical entry.
    let mut prepared: Vec<Option<Vec<(&str, String)>>> = vec![];
    for item in items {
        let problem = |code, entry: Option<&str>, why: Option<String>| Problem {
            item: item.id.clone(),
            code,
            entry: entry.map(str::to_owned),
            why,
        };
        if item.scopes.is_empty() {
            out.problems.push(problem("scope-empty", None, None));
            prepared.push(None);
            continue;
        }
        if item.scopes.len() > limits.entries_per_item {
            out.problems.push(problem(
                "scope-too-large",
                None,
                Some(format!(
                    "{} entries, at most {} are compared",
                    item.scopes.len(),
                    limits.entries_per_item
                )),
            ));
        }
        let mut seen = HashSet::new();
        let mut entries = vec![];
        for raw in item.scopes.iter().take(limits.entries_per_item) {
            if raw.len() > limits.entry_bytes {
                out.problems.push(problem(
                    "entry-too-long",
                    Some(raw),
                    Some(format!("longer than {} bytes", limits.entry_bytes)),
                ));
                continue;
            }
            match canonicalize(raw) {
                Ok(canonical) => {
                    if seen.insert(canonical.clone()) {
                        entries.push((raw.as_str(), prefix(&canonical)));
                    }
                }
                Err(e) => out
                    .problems
                    .push(problem("entry-invalid", Some(raw), Some(e.0))),
            }
        }
        prepared.push(Some(entries));
    }
    let mut comparisons = 0u64;
    for i in 0..items.len() {
        let Some(a) = &prepared[i] else { continue };
        for j in i + 1..items.len() {
            let Some(b) = &prepared[j] else { continue };
            let mut shared = vec![];
            for (declared, pa) in a {
                for (_, pb) in b {
                    if comparisons == limits.comparisons {
                        out.truncated = Some(Truncated {
                            reason: "comparison-cap",
                            limit: limits.comparisons,
                        });
                        return out;
                    }
                    comparisons += 1;
                    if overlaps(pa, pb) {
                        shared.push((*declared).to_owned());
                        break;
                    }
                }
            }
            if !shared.is_empty() {
                if out.pairs.len() == limits.pairs {
                    out.truncated = Some(Truncated {
                        reason: "pairs-cap",
                        limit: limits.pairs as u64,
                    });
                    return out;
                }
                out.pairs.push(Pair {
                    a: items[i].id.clone(),
                    b: items[j].id.clone(),
                    shared,
                });
            }
        }
    }
    out
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
    fn item(id: &str, scopes: &[&str]) -> Item {
        Item {
            id: id.into(),
            scopes: scopes.iter().map(|s| s.to_string()).collect(),
        }
    }
    /// Naive oracle: canonicalize each entry, compare every pair of entries with `overlaps`.
    fn oracle(items: &[Item]) -> Vec<(String, String, Vec<String>)> {
        let ok = |i: &Item| -> Vec<(String, String)> {
            let mut seen = HashSet::new();
            i.scopes
                .iter()
                .filter_map(|r| canonicalize(r).ok().map(|c| (r.clone(), c)))
                .filter(|(_, c)| seen.insert(c.clone()))
                .collect()
        };
        let mut out = vec![];
        for x in 0..items.len() {
            for y in x + 1..items.len() {
                let (a, b) = (ok(&items[x]), ok(&items[y]));
                let shared: Vec<String> = a
                    .iter()
                    .filter(|(_, ca)| b.iter().any(|(_, cb)| overlaps(&prefix(ca), &prefix(cb))))
                    .map(|(r, _)| r.clone())
                    .collect();
                if !shared.is_empty() {
                    out.push((items[x].id.clone(), items[y].id.clone(), shared));
                }
            }
        }
        out
    }
    fn pairs(c: &Collisions) -> Vec<(String, String, Vec<String>)> {
        c.pairs
            .iter()
            .map(|p| (p.a.clone(), p.b.clone(), p.shared.clone()))
            .collect()
    }
    #[test]
    fn colliding_pairs_agree_with_the_naive_oracle() {
        let pool = [
            "lib",
            "lib/a.mjs",
            "lib/fo*",
            "lib/foo.mjs",
            "lib/a/**",
            "lib/b/**",
            "docs",
            "docs-old/x",
            "lib/a*",
            "lib/b*",
            "**",
            "./lib/",
            " lib ",
            "*.md",
            "src/**/x.rs",
            "src/y",
            ".fgos/z",
            "a b/c",
        ];
        let mut state = 0x2545f491u64;
        let mut next = |n: usize| {
            state = state
                .wrapping_mul(6364136223846793005)
                .wrapping_add(1442695040888963407);
            ((state >> 33) as usize) % n
        };
        for _ in 0..200 {
            let items: Vec<Item> = (0..2 + next(5))
                .map(|k| Item {
                    id: format!("i{k}"),
                    scopes: (0..1 + next(3))
                        .map(|_| pool[next(pool.len())].to_owned())
                        .collect(),
                })
                .collect();
            let got = colliding_pairs(&items);
            assert!(got.problems.is_empty() && got.truncated.is_none());
            assert_eq!(pairs(&got), oracle(&items), "{items:?}");
        }
    }
    #[test]
    fn colliding_pairs_report_shared_entries_in_declared_spelling() {
        let items = [
            item("a", &["./lib/", "lib", "docs", "docs-old"]),
            item("b", &["lib/x.mjs", "docs-old/q"]),
            item("c", &["other"]),
        ];
        let got = colliding_pairs(&items);
        assert_eq!(
            pairs(&got),
            vec![(
                "a".into(),
                "b".into(),
                vec!["./lib/".into(), "docs-old".into()]
            )]
        );
    }
    #[test]
    fn colliding_pairs_report_unreadable_entries_and_never_claim_disjoint() {
        let long = "x".repeat(MAX_ENTRY_BYTES + 1);
        let items = [
            item("a", &[".", "lib", "../up", &long]),
            item("b", &[]),
            item("c", &["lib/y"]),
        ];
        let got = colliding_pairs(&items);
        let codes: Vec<_> = got
            .problems
            .iter()
            .map(|p| (p.item.as_str(), p.code, p.entry.as_deref()))
            .collect();
        assert_eq!(
            codes,
            vec![
                ("a", "entry-invalid", Some(".")),
                ("a", "entry-invalid", Some("../up")),
                ("a", "entry-too-long", Some(long.as_str())),
                ("b", "scope-empty", None),
            ]
        );
        assert!(got.problems[0]
            .why
            .as_deref()
            .unwrap()
            .contains("must name a path"));
        // the readable entries still compare; the empty item is skipped
        assert_eq!(
            pairs(&got),
            vec![("a".into(), "c".into(), vec!["lib".into()])]
        );
        assert!(got.truncated.is_none());
    }
    #[test]
    fn colliding_pairs_cut_surplus_entries_per_item() {
        let mut scopes: Vec<String> = (0..MAX_ENTRIES_PER_ITEM).map(|i| format!("d{i}")).collect();
        scopes.push("hot".into());
        let items = [
            Item {
                id: "a".into(),
                scopes,
            },
            item("b", &["hot/x"]),
        ];
        let got = colliding_pairs(&items);
        assert_eq!(got.problems.len(), 1);
        assert_eq!(got.problems[0].code, "scope-too-large");
        assert!(got.pairs.is_empty(), "the surplus entry is not compared");
    }
    #[test]
    fn colliding_pairs_truncate_at_the_caps_in_deterministic_order() {
        let items: Vec<Item> = (0..4).map(|k| item(&format!("i{k}"), &["hot"])).collect();
        let full = colliding_pairs(&items);
        assert_eq!(full.pairs.len(), 6);
        let cut = colliding_pairs_with(&items, Limits { pairs: 2, ..LIMITS });
        assert_eq!(cut.pairs, full.pairs[..2]);
        assert_eq!(
            cut.truncated,
            Some(Truncated {
                reason: "pairs-cap",
                limit: 2
            })
        );
        let exact = colliding_pairs_with(&items, Limits { pairs: 6, ..LIMITS });
        assert!(exact.truncated.is_none() && exact.pairs.len() == 6);
        let cut = colliding_pairs_with(
            &items,
            Limits {
                comparisons: 3,
                ..LIMITS
            },
        );
        assert_eq!(cut.pairs, full.pairs[..3]);
        assert_eq!(
            cut.truncated,
            Some(Truncated {
                reason: "comparison-cap",
                limit: 3
            })
        );
        let exact = colliding_pairs_with(
            &items,
            Limits {
                comparisons: 6,
                ..LIMITS
            },
        );
        assert!(exact.truncated.is_none());
    }
    #[test]
    fn scopes_overlap_compares_whole_scopes() {
        let s = |v: &[&str]| v.iter().map(|x| x.to_string()).collect::<Vec<_>>();
        assert!(scopes_overlap(&s(&["lib/fo*"]), &s(&["lib/foo.mjs"])).unwrap());
        assert!(!scopes_overlap(&s(&["lib/a/**"]), &s(&["lib/b/**"])).unwrap());
        assert!(!scopes_overlap(&s(&["docs"]), &s(&["docs-old/x"])).unwrap());
        assert!(scopes_overlap(&s(&["**"]), &s(&["x"])).unwrap());
        assert!(scopes_overlap(&s(&["."]), &s(&["x"])).is_err());
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
