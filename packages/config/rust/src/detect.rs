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

/// Collects the detectable paths at and below `at` (the section root itself is never one).
fn walk<'a>(
    s: &'a Schemas,
    at: At<'a>,
    mut inh: Inherited<'a>,
    path: &mut Vec<Segment>,
    out: &mut Vec<Vec<Segment>>,
) {
    let Some(at) = s.enter(at, &mut inh) else {
        return;
    };
    if path.len() > 1 && inh.get("x-fgos-absent") == Some("detected") {
        out.push(path.clone());
    }
    if path.len() >= 12 {
        return;
    }
    for (name, kid) in s.children(&at) {
        let Some(name) = name else { continue };
        path.push(Segment::Key(name.to_string()));
        walk(s, kid, inh.clone(), path, out);
        path.pop();
    }
}

/// The paths that may be detected: named properties only, since a wildcard entry cannot be listed.
pub(crate) fn paths(s: &Schemas) -> Vec<Vec<Segment>> {
    let mut out = Vec::new();
    for (i, section) in s.sections.iter().enumerate() {
        let path = &mut section.path();
        walk(s, s.root(i), Inherited::default(), path, &mut out);
    }
    out
}
