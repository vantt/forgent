//! Scope and file placement (spec section 3): which file may hold which key. One total function
//! judges a parsed file against the section schemas; `Schemas::locate` is the only way to a node.
//! A `command` value comes from the trusted root's project file, never a linked worktree's copy.
//! A refusal names the role of the file the key belongs in, never a path guessed from the home
//! directory, and never a value.
use fgos_yaml_doc::{Document, Segment};
use serde_json::Value;

use crate::schema::{descend, json_at, json_put, key_span, At, Inherited, Resolved, Schemas};
use crate::ConfigRefusal;

/// The file a value was read from. The gateway token file is not YAML and is never judged here.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SourceKind {
    Project,
    Global,
    Accounts,
}

impl SourceKind {
    /// The `x-fgos-file` a key must carry to live in this source.
    fn file(self) -> &'static str {
        match self {
            SourceKind::Accounts => "accounts",
            _ => "config",
        }
    }
}

/// Deepest schema path searched below a node, so a recursive `$ref` ends.
const DEPTH: usize = 12;

/// Whether a `global-only` node sits below `at`.
fn global_only_below<'a>(s: &'a Schemas, at: &At<'a>, inh: &Inherited<'a>, depth: usize) -> bool {
    depth > 0
        && s.children(at).into_iter().any(|(_, kid)| {
            let mut inh = inh.clone();
            s.enter(kid, &mut inh).is_some_and(|kid| {
                inh.get("x-fgos-scope") == Some("global-only")
                    || global_only_below(s, &kid, &inh, depth - 1)
            })
        })
}

/// Every key of `value` that `source` may not hold, sorted by path. `document` gives each refusal
/// its file, line and column. A refusal on a mapping with entries is raised on its entries, so it
/// lands on the line the person wrote; the mapping itself is refused only when it replaces or
/// misplaces everything below it.
pub fn judge(
    schemas: &Schemas,
    source: SourceKind,
    value: &Value,
    document: Option<&Document>,
) -> Vec<ConfigRefusal> {
    let mut out = Vec::new();
    descend(value, &mut Vec::new(), &mut |path, node| {
        let Some((at, inh)) = schemas.locate(path) else {
            return false; // undescribed: kept, reported by `undescribed`
        };
        let r = Resolved::of(at.node, &inh);
        let filled = node.as_object().is_some_and(|m| !m.is_empty());
        // In the accounts file a mapping is only a container of account keys.
        let wrong_file = r.file != source.file() && !(filled && source == SourceKind::Accounts);
        let (code, belongs) = if wrong_file {
            ("config-key-in-wrong-file", r.file)
        } else if !filled && (source, r.scope) == (SourceKind::Project, "global-only") {
            ("config-key-out-of-scope", "global")
        } else if !filled && (source, r.scope) == (SourceKind::Global, "project-only") {
            ("config-key-out-of-scope", "project")
        } else if source == SourceKind::Project
            && !(node.is_object() && matches!(r.merge, None | Some("deep")))
            && global_only_below(schemas, &at, &inh, DEPTH)
        {
            // A null, scalar, list or replaced map above a global-only key hides or overwrites it.
            ("config-key-out-of-scope", "global")
        } else {
            return true;
        };
        let mut refusal = ConfigRefusal::new(code).at_path(path);
        refusal.detail_mut().belongs_in = Some(belongs.to_string());
        if let Some(document) = document {
            refusal = refusal
                .in_file(document.file())
                .at_span(key_span(document, path));
        }
        out.push(refusal);
        false
    });
    out.sort_by(|a, b| a.path.cmp(&b.path));
    out
}

/// The topmost `command` paths of `value`, cut at the first list index (a list comes whole from one file).
fn command_tops(schemas: &Schemas, value: &Value) -> Vec<Vec<Segment>> {
    let mut tops: Vec<Vec<Segment>> = Vec::new();
    descend(value, &mut Vec::new(), &mut |path, _| {
        let command = schemas
            .resolve(path)
            .is_some_and(|r| r.sensitivity == "command");
        if command {
            let cut = path.iter().position(|s| matches!(s, Segment::Index(_)));
            let top = path[..cut.unwrap_or(path.len())].to_vec();
            if !tops.contains(&top) {
                tops.push(top);
            }
        }
        !command
    });
    tops
}

/// The project file with every `command` subtree taken from the trusted file, or removed when that
/// file lacks it; also the paths replaced.
pub(crate) fn trusted_project(
    schemas: &Schemas,
    project: &Value,
    trusted: &Value,
) -> (Value, Vec<Vec<Segment>>) {
    let tops: Vec<_> = command_tops(schemas, project)
        .into_iter()
        .chain(command_tops(schemas, trusted))
        .collect();
    let mut out = project.clone();
    for top in &tops {
        json_put(&mut out, top, json_at(trusted, top).cloned());
    }
    (out, tops)
}
