//! What the read verbs print (spec section 11): `show`, `explain` and `standard` as plain data.
//! A value reaches this module only through `redact::render_for_display` or the bundled standard
//! (which holds no account, token or detected value); an unreadable source is the caller's refusal.
use fgos_yaml_doc::path::format_path;
use fgos_yaml_doc::{parse, CommentLoss, Profile, Segment};
use serde_json::{json, Value};

use crate::redact::render_for_display;
use crate::schema::json_at;
use crate::snapshot::{AccountsState, Context, Origin, Snapshot};
use crate::standard::StandardFile;
use crate::ConfigRefusal;

fn provenance(origin: &Origin) -> Value {
    let p = &origin.provenance;
    json!({
        "path": format_path(&origin.path), "layer": p.layer, "role": p.role,
        "file": p.file, "line": p.line, "column": p.column,
    })
}

/// The effective value (secrets as `<redacted>`) under `path`, where each leaf came from, the
/// revision of each source and the notices; `path` empty shows everything.
pub fn show(ctx: &Context, snapshot: &Snapshot, path: &[Segment]) -> Value {
    let shown = render_for_display(snapshot, ctx.schemas);
    let value = json_at(&shown, path);
    let origins = snapshot.origins.iter().filter(|o| o.path.starts_with(path));
    json!({
        "path": format_path(path),
        "present": value.is_some(),
        "value": value,
        "provenance": origins.map(provenance).collect::<Vec<_>>(),
        "revisions": snapshot.revisions,
        "accounts": match snapshot.accounts {
            AccountsState::Present => "present",
            AccountsState::UnavailableConfined => "unavailable-confined",
        },
        "notices": snapshot.notices.iter().map(|(id, p)| json!({"id": id, "path": p})).collect::<Vec<_>>(),
    })
}

/// The schema node of `path` (description, type, bounds, scope, file, sensitivity, owner), its
/// standard value (never for a secret) and, when a snapshot is given, where its value comes from.
/// A path with no node is `described: false` and still names the file that holds it.
pub fn explain(ctx: &Context, snapshot: Option<&Snapshot>, path: &[Segment]) -> Value {
    let resolved = ctx.schemas.resolve(path);
    let origin = snapshot.and_then(|s| s.origins.iter().find(|o| o.path == path));
    let mut out = json!({
        "path": format_path(path),
        "described": resolved.is_some(),
        "current": origin.map(provenance),
        "file": origin.and_then(|o| o.provenance.file.clone()),
    });
    let (Some(r), Some(map)) = (resolved, out.as_object_mut()) else {
        return out;
    };
    let section = match path.first() {
        Some(Segment::Key(name)) => ctx.schemas.section(name),
        _ => None,
    };
    let owner = section.and_then(|s| s.root["$comment"].as_str());
    let owner = owner
        .and_then(|c| c.lines().next())
        .map(|l| l.trim_start_matches("owner:").trim());
    let node = |key: &str| r.node.get(key).cloned().unwrap_or(Value::Null);
    let standard = ctx
        .standard
        .value_at(path)
        .filter(|_| r.sensitivity != "secret-value");
    for (key, value) in [
        ("description", node("description")),
        ("type", node("type")),
        ("enum", node("enum")),
        ("minimum", node("minimum")),
        ("maximum", node("maximum")),
        ("standard", standard.cloned().unwrap_or(Value::Null)),
        ("scope", json!(r.scope)),
        ("configFile", json!(r.file)),
        ("sensitivity", json!(r.sensitivity)),
        ("owner", json!(owner)),
    ] {
        // A keyword the node does not state (bounds of a string, the enum of a number) is left out.
        if !value.is_null() || key == "standard" {
            map.insert(key.into(), value);
        }
    }
    out
}

/// Every bundled standard file in section order, with its `@fgos:doc` lines.
pub fn standard_files(ctx: &Context) -> Value {
    let files = ctx.standard.files.iter();
    json!({ "files": files.map(|f| json!({
        "name": f.name, "text": String::from_utf8_lossy(f.doc.source()),
    })).collect::<Vec<_>>() })
}

/// The smallest copyable text for `path`: the ancestors' keys with their doc lines and the node's
/// own subtree, every sibling removed from an in-memory copy. `None` when the standard has no such
/// path (or it goes through a list, which has no copyable fragment).
pub fn standard_fragment(ctx: &Context, path: &[Segment]) -> Result<Option<Value>, ConfigRefusal> {
    let Some(Segment::Key(section)) = path.first() else {
        return Ok(None);
    };
    let file: Option<&StandardFile> = ctx.standard.files.iter().find(|f| f.name == *section);
    let Some(file) = file.filter(|f| json_at(&f.value, path).is_some()) else {
        return Ok(None);
    };
    if path.iter().any(|s| matches!(s, Segment::Index(_))) {
        return Ok(None);
    }
    let mut doc = parse(file.doc.source(), Profile::StrictConfig, file.doc.file())
        .map_err(ConfigRefusal::parse)?;
    for (depth, keep) in path.iter().enumerate() {
        let Some(Value::Object(siblings)) = json_at(&file.value, &path[..depth]) else {
            continue;
        };
        for name in siblings
            .keys()
            .filter(|k| Segment::Key((*k).clone()) != *keep)
        {
            let mut sibling = path[..depth].to_vec();
            sibling.push(Segment::Key(name.clone()));
            doc.remove(&sibling, CommentLoss::Acknowledge)
                .map_err(ConfigRefusal::parse)?;
        }
    }
    let text = String::from_utf8_lossy(&doc.to_bytes()).into_owned();
    Ok(Some(json!({ "path": format_path(path), "fragment": text })))
}
