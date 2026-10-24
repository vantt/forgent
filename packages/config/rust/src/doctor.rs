//! The findings engine behind `fgos config check` and the doctor rows of spec section 11. Every
//! source (project, global, accounts) and the machine's loose files are judged on their own, so a
//! broken project file never hides a finding about the others. A finding names the row, file,
//! position and path, never a value. Severity per consumer, descriptions and fix ids live in
//! `contracts/doctor-rows.v1.json`; Node reads the same file and holds no row logic.
//! The machine files are observed here through `machine` and `relocate`: modes, the token file and
//! whether a moved key already sits in its destination. Repairs live in `repair`.
use std::fs;
use std::path::Path;
use std::time::{Duration, SystemTime};

use fgos_yaml_doc::path::format_path;
use fgos_yaml_doc::{parse, Document, Profile, Segment};
use serde_json::Value;

use crate::docs::{plan, DocKind};
use crate::files::{read_beneath, select_source, FileError, LoadedFile, Source};
use crate::files::{JSON_NAME, YAML_NAME};
use crate::grammar::{is_migrated_reason, parse_block};
use crate::machine::{modes, unready};
use crate::relocate::{classify, Held};
use crate::schema::{descend, json_at, key_span};
use crate::scope::{judge, SourceKind};
use crate::snapshot::{snapshot, Context, SessionClass, SnapshotError, SnapshotRequest};
use crate::write::{snapshot_with, without_project};
use crate::ConfigRefusal;

fn contract() -> &'static Value {
    contract!("doctor-rows.v1.json")
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Consumer {
    Doctor,
    Check,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Severity {
    Fail,
    Warn,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Finding {
    pub row: &'static str,
    pub file: Option<String>,
    pub line: Option<u32>,
    pub column: Option<u32>,
    pub path: Option<String>,
    pub fix: Option<&'static str>,
    /// A keyword (`missing`, `drift`, a refusal id, `destination-equal`), never a value.
    pub detail: String,
}

fn row_of(id: &str) -> &'static Value {
    let rows = contract()["rows"]
        .as_array()
        .map(Vec::as_slice)
        .unwrap_or_default();
    rows.iter()
        .find(|row| row["id"] == id)
        .unwrap_or(&Value::Null)
}

impl Finding {
    fn new(row: &str, detail: &str) -> Finding {
        Finding {
            row: row_of(row)["id"].as_str().unwrap_or_default(),
            file: None,
            line: None,
            column: None,
            path: None,
            fix: row_of(row)["fix"].as_str(),
            detail: detail.to_string(),
        }
    }

    fn at(mut self, file: &str, path: &[Segment], doc: Option<&Document>) -> Finding {
        let span = doc.and_then(|doc| key_span(doc, path));
        self.file = Some(file.to_string());
        self.path = (!path.is_empty()).then(|| format_path(path));
        (self.line, self.column) = (span.map(|s| s.line), span.map(|s| s.column));
        self
    }

    pub fn severity(&self, consumer: Consumer) -> Severity {
        let key = ["doctor", "check"][consumer as usize];
        let row = row_of(self.row);
        let level = &row["detailSeverity"][self.detail.as_str()][key];
        let level = if level.is_string() { level } else { &row[key] };
        if level == "fail" {
            Severity::Fail
        } else {
            Severity::Warn
        }
    }
}

/// A refusal as a finding of `row`: its own id (and keyword) stay as the detail.
fn refused(row: &str, refusal: &ConfigRefusal, file: &str) -> Finding {
    let keyword = refusal.detail.as_ref().and_then(|d| d.keyword.as_deref());
    let detail = [Some(refusal.code), keyword].into_iter().flatten();
    let mut found = Finding::new(row, &detail.collect::<Vec<_>>().join(" "));
    found.file = Some(refusal.file.clone().unwrap_or_else(|| file.to_string()));
    found.path = refusal.path.clone();
    (found.line, found.column) = (refusal.line, refusal.column);
    found
}

fn schema_rows(error: SnapshotError, file: &str, out: &mut Vec<Finding>) {
    match error {
        SnapshotError::Refused(all) => {
            out.extend(all.iter().map(|r| refused("config-schema", r, file)))
        }
        SnapshotError::Io(error) => out.push(Finding::new(
            "config-parse",
            &format!("io {:?}", error.kind()),
        )),
    }
}

/// The leaves of a value: scalars, lists and empty mappings, as key paths.
fn leaves(json: &Value) -> Vec<Vec<Segment>> {
    let mut out = Vec::new();
    descend(json, &mut Vec::new(), &mut |path, node| {
        let filled = node.as_object().is_some_and(|m| !m.is_empty());
        if !filled {
            out.push(path.to_vec());
        }
        filled
    });
    out
}

/// One parsed config file with what its rows need.
struct Judged<'a> {
    ctx: &'a Context<'a>,
    global: &'a Path,
    role: &'static str,
    kind: SourceKind,
    name: String,
    doc: &'a Document,
}

impl Judged<'_> {
    fn put(&self, out: &mut Vec<Finding>, row: &str, path: &[Segment], detail: &str) {
        out.push(Finding::new(row, detail).at(&self.name, path, Some(self.doc)));
    }

    /// Every row of the file's own content (scope, placement, comments, values).
    fn rows(&self, legacy: bool, out: &mut Vec<Finding>) {
        let (ctx, json) = (self.ctx, self.doc.to_json().unwrap_or(Value::Null));
        if legacy {
            self.put(out, "config-format-legacy-json", &[], "legacy");
        }
        let moved = match self.kind {
            SourceKind::Accounts => Vec::new(),
            _ => classify(ctx, self.global, &json).unwrap_or_default(),
        };
        let mut blocked: Vec<String> = Vec::new();
        for refusal in judge(ctx.schemas, self.kind, &json, Some(self.doc)) {
            blocked.extend(refusal.path.clone());
            if refusal.code != "config-key-in-wrong-file" {
                out.push(refused("config-schema", &refusal, &self.name));
                continue;
            }
            let at = refusal.path.as_deref();
            let state = moved.iter().find(|m| Some(m.path.as_str()) == at);
            let state = state.map_or(Held::Missing, |m| m.destination);
            let mut found = refused("config-key-in-wrong-file", &refusal, &self.name);
            let word = match state {
                Held::Missing => "absent",
                Held::Equal => "equal",
                Held::Differs => "different",
            };
            found.detail = format!("destination-{word}");
            let copy = self.role == "global" && legacy && state == Held::Missing;
            found.fix = copy.then_some("copy-to-destination");
            out.push(found);
        }
        if legacy || self.kind == SourceKind::Accounts {
            return;
        }
        for change in plan(ctx, self.doc).unwrap_or_default() {
            let (row, detail) = match change.finding.kind {
                DocKind::Missing => ("config-comment-missing-doc", "missing"),
                DocKind::Drift => ("config-doc-drift", "drift"),
            };
            self.put(out, row, &change.finding.path, detail);
        }
        for path in ctx.schemas.undescribed(&json) {
            self.put(out, "config-unknown-key", &path, "unknown");
        }
        for path in leaves(&json) {
            // A key in the wrong place is reported once, as that; its comments are not.
            if blocked
                .iter()
                .any(|b| format_path(&path).starts_with(b.as_str()))
            {
                continue;
            }
            let block = parse_block(&self.doc.comments_at(&path).unwrap_or_default());
            match &block.why {
                None => self.put(out, "config-comment-missing-why", &path, "missing"),
                Some((_, why)) if is_migrated_reason(why) => {
                    self.put(out, "config-comment-migrated-why", &path, "migrated")
                }
                Some(_) => {}
            }
            if json_at(&json, &path).is_some_and(|v| ctx.standard.value_at(&path) == Some(v)) {
                let note = block.why.is_some() || !block.free.is_empty();
                let detail = if note {
                    "needs-acknowledgement"
                } else {
                    "plain"
                };
                self.put(out, "config-redundant-value", &path, detail);
            }
        }
    }
}

/// Names of the files directly under `~/.fgos` (not the config files) that hold an account pool or a
/// token.
pub(crate) fn strays(ctx: &Context, global: &Path) -> Vec<String> {
    let mut out = Vec::new();
    let max = Profile::StrictConfig.limits().input_bytes as u64;
    for entry in fs::read_dir(global).into_iter().flatten().flatten() {
        let (path, name) = (
            entry.path(),
            entry.file_name().to_string_lossy().into_owned(),
        );
        let plain = fs::symlink_metadata(&path).is_ok_and(|m| m.is_file() && m.len() <= max);
        if !plain || name == YAML_NAME || name == JSON_NAME {
            continue;
        }
        let Ok(doc) = fs::read(&path).map(|b| parse(&b, Profile::Tool, &name)) else {
            continue;
        };
        let json = doc.and_then(|doc| doc.to_json()).unwrap_or(Value::Null);
        let mut held = false;
        descend(&json, &mut Vec::new(), &mut |p, _| {
            held |= ctx.schemas.resolve(p).is_some_and(|r| r.file != "config");
            !held
        });
        if held {
            out.push(name);
        }
    }
    out.sort();
    out
}

fn stale_backups(dirs: [&Path; 2], now: SystemTime, out: &mut Vec<Finding>) {
    let days = contract()["staleBackupDays"].as_u64().unwrap_or(30);
    for entry in dirs
        .iter()
        .flat_map(|d| fs::read_dir(d).into_iter().flatten().flatten())
    {
        let modified = entry.metadata().and_then(|m| m.modified()).ok();
        let age = modified.and_then(|at| now.duration_since(at).ok());
        if age.is_some_and(|age| age > Duration::from_secs(days * 86_400)) {
            let name = entry.file_name().to_string_lossy().into_owned();
            out.push(Finding::new("config-migrate-backup-stale", "stale").at(&name, &[], None));
        }
    }
}

const BROKEN: [&str; 3] = ["config-parse", "config-schema", "config-key-in-wrong-file"];

/// Every finding for the files at `roots`, each source on its own. `now` dates the backups.
pub fn check(ctx: &Context, roots: &SnapshotRequest, now: SystemTime) -> Vec<Finding> {
    let max = Profile::StrictConfig.limits().input_bytes;
    let global = (
        roots.global_dir.parent(),
        roots.global_dir.file_name().map(Path::new),
    );
    let (Some(parent), Some(dir)) = global else {
        return vec![Finding::new("config-parse", "config-path-symlink")];
    };
    let mut out = Vec::new();
    // Each source is judged over the standard alone: no project, and the other machine files hidden.
    let alone = SnapshotRequest {
        class: SessionClass::Confined,
        ..without_project(roots)
    };
    let bare = roots.project_root.join(".fgos-absent/.fgos");
    let no_global = SnapshotRequest {
        global_dir: bare,
        ..alone.clone()
    };
    let sources = [
        (
            "project",
            SourceKind::Project,
            roots.project_root.as_path(),
            Path::new(".fgos"),
        ),
        ("global", SourceKind::Global, parent, dir),
    ];
    for (role, kind, root, at) in sources {
        let (name, file, legacy) = match select_source(root, at, max) {
            Ok(Source::Absent) => continue,
            Ok(Source::Yaml(file)) => (YAML_NAME, file, false),
            Ok(Source::LegacyJson(file)) => (JSON_NAME, file, true),
            Err(FileError::Refused(r)) => {
                let shadowed = r.code == "config-legacy-shadowed";
                let row = if shadowed {
                    "config-legacy-shadowed"
                } else {
                    "config-parse"
                };
                out.push(refused(row, &r, role));
                continue;
            }
            Err(FileError::Io(e)) => {
                out.push(Finding::new("config-parse", &format!("io {:?}", e.kind())));
                continue;
            }
        };
        let name = format!("{role}:{name}");
        let doc = match parse(&file.bytes, Profile::StrictConfig, &name) {
            Ok(doc) => doc,
            Err(r) => {
                out.push(refused("config-parse", &ConfigRefusal::parse(r), &name));
                continue;
            }
        };
        let judged = Judged {
            ctx,
            global: &roots.global_dir,
            role,
            kind,
            name,
            doc: &doc,
        };
        let before = out.len();
        judged.rows(legacy, &mut out);
        if !out[before..].iter().any(|f| BROKEN.contains(&f.row)) {
            let view = if role == "project" {
                &no_global
            } else {
                &alone
            };
            if let Err(error) = snapshot_with(ctx, view, role, &file.bytes) {
                schema_rows(error, &judged.name, &mut out);
            }
        }
    }
    if roots.class == SessionClass::Unconfined {
        let accounts = read_beneath(parent, &dir.join("private/accounts.yaml"), max);
        if let Ok(Some(LoadedFile { bytes, .. })) = accounts {
            let name = "accounts:accounts.yaml".to_string();
            match parse(&bytes, Profile::StrictConfig, &name) {
                Err(r) => out.push(refused("config-parse", &ConfigRefusal::parse(r), &name)),
                Ok(doc) => {
                    let kind = SourceKind::Accounts;
                    Judged {
                        ctx,
                        global: &roots.global_dir,
                        role: "accounts",
                        kind,
                        name,
                        doc: &doc,
                    }
                    .rows(false, &mut out)
                }
            }
        }
    }
    // The sources merged: layers that are each sound alone can still disagree about a path's shape.
    if !out
        .iter()
        .any(|f| BROKEN.contains(&f.row) || f.row == "config-legacy-shadowed")
    {
        if let Err(error) = snapshot(ctx, roots) {
            schema_rows(error, "merged", &mut out);
        }
    }
    let (modes, unready) = (modes(&roots.global_dir), unready(&roots.global_dir));
    let unready = unready.or_else(|| modes.is_err().then(|| "unreadable".into()));
    out.extend(modes.unwrap_or_default().iter().map(|mode| {
        let detail = format!("expected {:o} found {:o}", mode.expected, mode.actual);
        Finding::new("config-global-permissions", &detail).at(&mode.file, &[], None)
    }));
    out.extend(unready.map(|why| Finding::new("config-machine-files", &why)));
    for name in strays(ctx, &roots.global_dir) {
        let found = Finding::new("config-secret-outside-private", "holds-account-or-token");
        out.push(found.at(&name, &[], None));
    }
    let dirs = [
        roots.project_root.join(".fgos/runtime/config-migrate"),
        roots.global_dir.join("private/config-migrate"),
    ];
    stale_backups([&dirs[0], &dirs[1]], now, &mut out);
    out
}
