//! The one reader of a declared write scope is `fgos-write-scope`; this is the assignment's door onto it, in the
//! names the dispatch code used. Nothing here interprets a scope.

pub use fgos_write_scope::ScopeError as WriteScopeError;

/// The run-state store is never inside any declared scope, even a bare `**` (the check lives in `matches`).
pub fn canonicalize_write_entry(raw: &str) -> Result<String, WriteScopeError> {
    fgos_write_scope::canonicalize(raw)
}

/// Canonicalizes every entry, drops duplicates, keeps first-seen order.
pub fn canonicalize_writes(list: &[String]) -> Result<Vec<String>, WriteScopeError> {
    fgos_write_scope::canonicalize_all(list)
}

/// Whether a repo-relative path lies in a scope.
pub fn matches_write_scope(rel_path: &str, scope: &[String]) -> Result<bool, WriteScopeError> {
    fgos_write_scope::matches(rel_path.as_bytes(), scope)
}

/// Splits paths into those inside and those outside a scope, each in input order.
pub fn partition_paths(
    paths: &[String],
    scope: &[String],
) -> Result<(Vec<String>, Vec<String>), WriteScopeError> {
    let (mut inside, mut outside) = (Vec::new(), Vec::new());
    for path in paths {
        if matches_write_scope(path, scope)? {
            inside.push(path.clone());
        } else {
            outside.push(path.clone());
        }
    }
    Ok((inside, outside))
}

/// Whether two declared scopes can touch one path. Conservative on purpose: a glob entry is read by its literal
/// leading segments.
pub fn write_scopes_overlap(a: &[String], b: &[String]) -> Result<bool, WriteScopeError> {
    fgos_write_scope::scopes_overlap(a, b)
}

/// Widens a scope with the render targets of the generated sources it touches.
pub fn expand_generated(
    writes: &[String],
    generated: &[(String, Vec<String>)],
) -> Result<Vec<String>, WriteScopeError> {
    fgos_write_scope::expand(writes, generated)
}
