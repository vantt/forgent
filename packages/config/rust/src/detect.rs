//! Environment facts (spec section 8): values the machine decides, such as the executor found on
//! `PATH`. The crate reads no environment itself; the caller's detectors answer, and only for the
//! paths whose schema says `x-fgos-absent: detected`.
use fgos_yaml_doc::{Segment, Value};

use crate::schema::{At, Inherited, Schemas};

pub trait Detectors {
    fn detect(&self, path: &[Segment]) -> Option<Value>;
}

/// Detects nothing.
pub struct NoDetectors;

impl Detectors for NoDetectors {
    fn detect(&self, _path: &[Segment]) -> Option<Value> {
        None
    }
}

fn walk<'a>(
    s: &'a Schemas,
    at: &At<'a>,
    inh: &Inherited<'a>,
    path: &mut Vec<Segment>,
    out: &mut Vec<Vec<Segment>>,
) {
    if path.len() >= 12 {
        return;
    }
    let names = at.node["properties"]
        .as_object()
        .into_iter()
        .flat_map(|m| m.keys());
    for name in names {
        let mut inh = inh.clone();
        let kid = s
            .sub(at, "properties", Some(name))
            .and_then(|k| s.enter(k, &mut inh));
        let Some(kid) = kid else { continue };
        path.push(Segment::Key(name.clone()));
        if inh.get("x-fgos-absent") == Some("detected") {
            out.push(path.clone());
        }
        walk(s, &kid, &inh, path, out);
        path.pop();
    }
}

/// The paths that may be detected: named properties only, since a wildcard entry cannot be listed.
pub(crate) fn paths(s: &Schemas) -> Vec<Vec<Segment>> {
    let mut out = Vec::new();
    for (i, section) in s.sections.iter().enumerate() {
        let mut inh = Inherited::default();
        if let Some(root) = s.enter(s.root(i), &mut inh) {
            walk(
                s,
                &root,
                &inh,
                &mut vec![Segment::Key(section.name.clone())],
                &mut out,
            );
        }
    }
    out
}
