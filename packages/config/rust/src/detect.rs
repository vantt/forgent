//! Environment facts (spec section 8): values the machine decides, such as the executor found on
//! `PATH`. The crate reads no environment itself; the caller's detectors answer, and only for the
//! paths whose schema says `x-fgos-absent: detected`.
use std::ffi::OsString;
use std::path::Path;

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

/// Whether `dir/name` is a regular file with an execute bit. Windows has no such bit: gate G4.
fn executable(dir: &Path, name: &str) -> bool {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::metadata(dir.join(name))
            .is_ok_and(|m| m.is_file() && m.permissions().mode() & 0o111 != 0)
    }
    #[cfg(not(unix))]
    {
        let _ = (dir, name);
        false
    }
}

/// Finds the default executor on the `PATH` the caller passes (the crate reads no environment). The
/// candidates in order and the template of each come from `contracts/detected.v1.json`: the first
/// candidate found decides, and one with no template (no verified argv) yields no executor.
pub struct PathDetectors {
    pub path: Option<OsString>,
}

impl Detectors for PathDetectors {
    fn detect(&self, path: &[Segment]) -> Option<Value> {
        let is = |s: &Segment, name: &str| matches!(s, Segment::Key(k) if k == name);
        let [runner, executor] = path else {
            return None;
        };
        if !is(runner, "runner") || !is(executor, "executor") {
            return None;
        }
        let contract = contract!("detected.v1.json");
        // A relative entry would make the answer depend on the working directory.
        let dirs: Vec<_> = std::env::split_paths(self.path.as_deref()?)
            .filter(|d| d.is_absolute())
            .collect();
        let found = contract["candidates"].as_array()?.iter().find(|name| {
            let name = name.as_str().unwrap_or_default();
            dirs.iter().any(|dir| executable(dir, name))
        })?;
        Some(Value::from_json(
            contract["templates"].get(found.as_str()?)?,
        ))
    }
}
