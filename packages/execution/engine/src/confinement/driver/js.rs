//! The few JavaScript behaviours the vectors pin: how a missing or odd value prints inside a message, which
//! values are truthy, how `path.resolve` and `isInsideRoot` read a path. Paths are strings because they are
//! compared as text, as the Node driver compared them.

use serde_json::Value;
use std::path::{Component, Path, PathBuf};

/// `value.a.b` along `keys`: `None` where a step is missing or not an object; a JSON `null` leaf is `Some(Null)`.
pub fn at<'a>(value: &'a Value, keys: &[&str]) -> Option<&'a Value> {
    keys.iter()
        .try_fold(value, |current, key| current.as_object()?.get(*key))
}

/// The string at `keys`, when it is one.
pub fn str_at<'a>(value: &'a Value, keys: &[&str]) -> Option<&'a str> {
    at(value, keys)?.as_str()
}

/// JavaScript truthiness of an optional value (`undefined` and `null` are falsy).
pub fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64().is_some_and(|n| n != 0.0 && !n.is_nan()),
        Some(Value::String(s)) => !s.is_empty(),
        Some(_) => true,
    }
}

/// `${value}`: what a template literal prints.
pub fn display(value: Option<&Value>) -> String {
    match value {
        None => "undefined".into(),
        Some(Value::Null) => "null".into(),
        Some(Value::String(s)) => s.clone(),
        Some(Value::Array(items)) => items
            .iter()
            .map(|item| match item {
                Value::Null => String::new(),
                other => display(Some(other)),
            })
            .collect::<Vec<_>>()
            .join(","),
        Some(Value::Object(_)) => "[object Object]".into(),
        Some(other) => other.to_string(),
    }
}

/// `JSON.stringify(value)` where `undefined` prints as the word.
pub fn json(value: Option<&Value>) -> String {
    value.map_or_else(|| "undefined".into(), Value::to_string)
}

/// `path.resolve(base, p)`: `p` made absolute against `base` and normalised without touching the file system.
pub fn resolve(base: &Path, p: &str) -> String {
    let joined = if Path::new(p).is_absolute() {
        PathBuf::from(p)
    } else {
        base.join(p)
    };
    let mut parts: Vec<String> = Vec::new();
    for component in joined.components() {
        match component {
            Component::Normal(name) => parts.push(name.to_string_lossy().into_owned()),
            Component::ParentDir => {
                parts.pop();
            }
            _ => {}
        }
    }
    format!("/{}", parts.join("/"))
}

/// `path.resolve(p)` against the working directory.
pub fn resolve_cwd(p: &str) -> String {
    resolve(
        &std::env::current_dir().unwrap_or_else(|_| PathBuf::from("/")),
        p,
    )
}

/// The real path of `p`, or its resolved form when it does not exist.
pub fn real_path_or_resolved(p: &str) -> String {
    std::fs::canonicalize(p)
        .map(|real| real.to_string_lossy().into_owned())
        .unwrap_or_else(|_| resolve_cwd(p))
}

/// `target` is `root` or lies under it, compared as text.
pub fn is_inside_root(target: &str, root: &str) -> bool {
    target == root
        || target.starts_with(&if root.ends_with('/') {
            root.to_string()
        } else {
            format!("{root}/")
        })
}
