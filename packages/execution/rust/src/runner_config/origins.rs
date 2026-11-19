//! Where a config value came from: an origin is `{ path, layer, role, file, line, column, described }` as the
//! config door reports it. Ported from `resolveOriginLocations` and `attributeRunnerConfigError`
//! (`dispatch/config.mjs`); the file shown for the project layer is the project root joined onto `.fgos`.

use serde_json::Value;

fn path_of(origin: &Value) -> Option<&str> {
    origin.get("path").and_then(Value::as_str)
}

fn file_of(origin: &Value) -> Option<&str> {
    origin.get("file").and_then(Value::as_str)
}

fn layer_of(origin: &Value) -> Option<&str> {
    origin.get("layer").and_then(Value::as_str)
}

/// `Number.isInteger(origin.line)`: the line, when it is a whole number.
pub(crate) fn line_of(origin: &Value) -> Option<i64> {
    let line = origin.get("line")?;
    line.as_i64()
        .or_else(|| line.as_f64().filter(|f| f.fract() == 0.0).map(|f| f as i64))
}

/// A position value as JavaScript prints it inside a template string: absent is `undefined`.
pub(crate) fn print_member(origin: &Value, key: &str) -> String {
    match origin.get(key) {
        None => "undefined".into(),
        Some(Value::String(text)) => text.clone(),
        Some(other) => other.to_string(),
    }
}

/// The one join of a project root onto its `.fgos`: the root as given (already absolute), without a trailing
/// separator, then `.fgos`.
pub fn fgos_dir_from_root(root: &str) -> String {
    join(root, ".fgos")
}

/// `path.posix.join`: the parts joined and normalized (`.` and `..` segments and repeated separators folded).
pub(crate) fn join(base: &str, rest: &str) -> String {
    let joined = format!("{base}/{rest}");
    let absolute = joined.starts_with('/');
    let trailing = joined.ends_with('/');
    let mut kept: Vec<&str> = Vec::new();
    for segment in joined.split('/') {
        match segment {
            "" | "." => {}
            ".." => {
                if kept.last().is_some_and(|last| *last != "..") {
                    kept.pop();
                } else if !absolute {
                    kept.push("..");
                }
            }
            other => kept.push(other),
        }
    }
    let mut out = kept.join("/");
    if out.is_empty() && !absolute {
        out.push('.');
    }
    if trailing && !out.is_empty() && out != "/" {
        out.push('/');
    }
    if absolute {
        format!("/{out}")
    } else {
        out
    }
}

/// The origins an error path points at, each as `file:line`, listed once.
pub fn resolve_origin_locations(
    origins: &[Value],
    paths: &[String],
    project_dir: &str,
) -> Vec<String> {
    let mut locations: Vec<String> = Vec::new();
    for target in paths {
        let matched = matched_origins(origins, target);
        for entry in matched {
            let shown = display_file(entry, project_dir);
            let position = line_of(entry)
                .map(|line| format!(":{line}"))
                .unwrap_or_default();
            let location = format!("{shown}{position}");
            if !locations.contains(&location) {
                locations.push(location);
            }
        }
    }
    locations
}

fn with_path<'a>(origins: &'a [Value], wanted: &str) -> Vec<&'a Value> {
    origins
        .iter()
        .filter(|o| path_of(o) == Some(wanted))
        .collect()
}

fn matched_origins<'a>(origins: &'a [Value], target: &str) -> Vec<&'a Value> {
    // 1. The exact leaf.
    let exact = with_path(origins, target);
    if !exact.is_empty() {
        return exact;
    }
    // 2. The nearest ancestor that has an origin.
    let mut current = target.to_string();
    while current.contains('.') || current.contains('[') {
        if current.ends_with(']') {
            current.truncate(current.rfind('[').unwrap_or(0));
        } else {
            match current.rfind('.') {
                Some(dot) => current.truncate(dot),
                None => break,
            }
        }
        let ancestors = with_path(origins, &current);
        if !ancestors.is_empty() {
            return ancestors;
        }
    }
    // 3. The origins under the failing container.
    let (dotted, bracketed) = (format!("{target}."), format!("{target}["));
    let descendants: Vec<&Value> = origins
        .iter()
        .filter(|o| path_of(o).is_some_and(|p| p.starts_with(&dotted) || p.starts_with(&bracketed)))
        .collect();
    if !descendants.is_empty() {
        return descendants;
    }
    // 4. A missing key has no line of its own: the first line of its nearest existing parent entry, per file.
    let mut parent = target.to_string();
    while parent.split('.').count() > 3 {
        parent.truncate(parent.rfind('.').unwrap_or(0));
        let (dotted, bracketed) = (format!("{parent}."), format!("{parent}["));
        let mut first_per_file: Vec<(Option<&str>, &Value)> = Vec::new();
        for origin in origins.iter().filter(|o| {
            path_of(o).is_some_and(|p| p.starts_with(&dotted) || p.starts_with(&bracketed))
        }) {
            let file = file_of(origin);
            match first_per_file.iter_mut().find(|(held, _)| *held == file) {
                Some((_, held)) => {
                    let line = line_of(origin).unwrap_or(i64::MAX);
                    if line < line_of(held).unwrap_or(i64::MAX) {
                        *held = origin;
                    }
                }
                None => first_per_file.push((file, origin)),
            }
        }
        if !first_per_file.is_empty() {
            return first_per_file.into_iter().map(|(_, o)| o).collect();
        }
    }
    Vec::new()
}

fn display_file(entry: &Value, project_dir: &str) -> String {
    let file = file_of(entry).filter(|f| !f.is_empty());
    let layer = layer_of(entry);
    let prefixed = |prefix: &str| file.is_some_and(|f| f.starts_with(prefix));
    let relative = |prefix: &str, fallback: &str| -> String {
        file.map(|f| f.strip_prefix(prefix).unwrap_or(f).to_string())
            .unwrap_or_else(|| fallback.to_string())
    };
    if layer == Some("global") || prefixed("global:") {
        format!("~/.fgos/{}", relative("global:", "config.yaml"))
    } else if layer == Some("project") || prefixed("project:") {
        let rel = relative("project:", "config.yaml");
        if project_dir.is_empty() {
            format!(".fgos/{rel}")
        } else {
            join(&fgos_dir_from_root(project_dir), &rel)
        }
    } else if matches!(layer, Some("shipped" | "standard")) {
        "<standard>".into()
    } else {
        file_of(entry).unwrap_or("<file>").to_string()
    }
}
