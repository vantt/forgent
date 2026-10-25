//! Project migration (spec section 13): `.fgos/config.json` becomes `.fgos/config.yaml` with a
//! generated doc line and a `[migrate]` reason on every value kept, values equal to the standard
//! dropped, and the JSON file replaced by the tombstone. The effective value read through the new
//! file must equal the one read through the old, except where a machine's global file makes a dropped
//! value matter, which is listed and needs `accept_machine_overrides`. A mismatch aborts; nothing is
//! repaired. The YAML text is the write transaction's own `produce`; every report holds paths only.
//!
//! The global file migrates the same way (`global`), once the machine check says no release on the
//! machine reads `~/.fgos/config.json` and the account and token keys have moved out of it: there
//! is no lower machine layer under it, so its effective value must stay exactly the same.
use std::collections::BTreeSet;
use std::io;
use std::path::PathBuf;

use fgos_durable_file::Installed;
use fgos_durable_file::{install_once_with_mode, replace_durably_with_mode};
use fgos_identity::WriterIdentity;
use fgos_yaml_doc::path::{format_path, parse_path};
use fgos_yaml_doc::{parse, Profile, Segment, Value as Doc};
use serde_json::Value;

use crate::files::{is_tombstone, read_beneath, LoadedFile, PRIVATE_DIR_MODE, PRIVATE_FILE_MODE};
use crate::files::{JSON_NAME, TOMBSTONE, YAML_NAME};
use crate::grammar::{doc_lines, is_grammar_line, Actor, Reason};
use crate::locks::{hold, GLOBAL_CONFIG, PROJECT_CONFIG};
use crate::schema::{json_at, json_put, Schemas};
use crate::scope::{judge, SourceKind};
use crate::snapshot::{split_global, Context, SessionClass, SnapshotError, SnapshotRequest};
use crate::write::{conflict, dir_identity, io_error, produce};
use crate::write::{snapshot_with, without_project, Edit};
use crate::ConfigRefusal;

const BACKUPS: &str = ".fgos/runtime/config-migrate";

/// Where a scope's file lives and how it is written: everything else of a migration is the same.
struct Place {
    /// The directory every read and write stays beneath.
    base: PathBuf,
    /// The scope's directory under `base` (`.fgos`).
    dir: PathBuf,
    kind: SourceKind,
    /// The backup directory under `base`.
    backups: PathBuf,
    lock: &'static str,
    lock_dir: PathBuf,
    yaml_mode: u32,
}

impl Place {
    fn project(roots: &SnapshotRequest) -> Place {
        let base = roots.project_root.clone();
        Place {
            lock_dir: base.join(".fgos"),
            base,
            dir: PathBuf::from(".fgos"),
            kind: SourceKind::Project,
            backups: PathBuf::from(BACKUPS),
            lock: PROJECT_CONFIG,
            yaml_mode: 0o644,
        }
    }

    fn global(roots: &SnapshotRequest) -> Result<Place, SnapshotError> {
        let (parent, dir) = split_global(&roots.global_dir)?;
        Ok(Place {
            base: parent.to_path_buf(),
            backups: dir.join("private/config-migrate"),
            dir: dir.to_path_buf(),
            kind: SourceKind::Global,
            lock: GLOBAL_CONFIG,
            lock_dir: PathBuf::new(),
            yaml_mode: PRIVATE_FILE_MODE,
        })
    }
}

fn contract() -> &'static Value {
    contract!("migration.v1.json")
}

/// What a run did or, with `dry_run`, would do. Paths in the text form of YAML Document; never a value.
#[derive(Debug, Default, PartialEq, Eq)]
pub struct MigrationReport {
    pub kept: Vec<String>,
    pub unknown_kept: Vec<String>,
    pub dropped_redundant: Vec<String>,
    pub dropped_retired: Vec<String>,
    pub dropped_out_of_scope: Vec<String>,
    pub doc_converted: Vec<String>,
    /// Dropped paths where this machine's global file holds a different value.
    pub machine_overrides: Vec<String>,
    pub backup: Option<String>,
    /// The YAML file existed (an interrupted run); only the tombstone was written.
    pub resumed: bool,
    pub already_migrated: bool,
    pub dry_run: bool,
}

pub struct MigrateOptions {
    pub accept_machine_overrides: bool,
    pub dry_run: bool,
    pub lock_root: PathBuf,
    pub lock_wait_ms: u64,
}

/// What `project` reports before each stage; an error from the observer aborts.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MigrateStep {
    BackupWritten,
    YamlCreated,
    SecondCheck,
    TombstoneWritten,
}

fn invalid(keyword: &str) -> SnapshotError {
    let mut refusal = ConfigRefusal::new("config-migrate-source-invalid");
    refusal.detail_mut().keyword = Some(keyword.into());
    refusal.into()
}

fn listing(code: &'static str, paths: impl IntoIterator<Item = String>) -> SnapshotError {
    SnapshotError::Refused(
        paths
            .into_iter()
            .map(|path| ConfigRefusal {
                path: Some(path),
                ..ConfigRefusal::new(code)
            })
            .collect(),
    )
}

enum Item {
    Leaf(Vec<Segment>, Value),
    Comment(Vec<Segment>, Vec<String>),
}

/// Leaves (scalars, lists and empty mappings) and `$comment` keys, in file order.
fn walk(node: &Doc, path: &mut Vec<Segment>, out: &mut Vec<Item>) {
    let Doc::Map(entries) = node else {
        return out.push(Item::Leaf(path.clone(), node.to_json()));
    };
    if entries.is_empty() && !path.is_empty() {
        return out.push(Item::Leaf(path.clone(), node.to_json()));
    }
    for (key, value) in entries {
        if key == "$comment" {
            let lines = match value.to_json() {
                Value::String(text) => vec![text],
                Value::Array(items) => items
                    .iter()
                    .filter_map(Value::as_str)
                    .map(String::from)
                    .collect(),
                _ => Vec::new(),
            };
            out.push(Item::Comment(path.clone(), lines));
            continue;
        }
        path.push(Segment::Key(key.clone()));
        walk(value, path, out);
        path.pop();
    }
}

/// Whether `lines` say what the schema renders as doc lines at `path`.
fn renders(ctx: &Context, path: &[Segment], lines: &[String]) -> bool {
    let squeeze = |l: &str| l.split_whitespace().collect::<Vec<_>>().join(" ");
    let held = lines.iter().flat_map(|text| text.lines()).map(squeeze);
    let Some(resolved) = ctx.schemas.resolve(path) else {
        return false;
    };
    let rendered = doc_lines(resolved.node, ctx.standard.value_at(path));
    let text = |l: &String| l.split_once(' ').map_or("", |s| s.1).to_string();
    rendered.iter().map(text).eq(held.filter(|l| !l.is_empty()))
}

/// What the classification decided; `old_side` is the JSON the old file means after the exclusions.
struct Plan {
    kept: Vec<(Vec<Segment>, Value)>,
    redundant: Vec<Vec<Segment>>,
    old_side: Value,
    notes: Vec<(Vec<Segment>, Vec<String>)>,
}

fn classify(
    ctx: &Context,
    doc: &Doc,
    kind: SourceKind,
    report: &mut MigrationReport,
) -> Result<Plan, SnapshotError> {
    let retired: Vec<Vec<Segment>> = contract()["retired"]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|row| parse_path(row["path"].as_str()?).ok())
        .collect();
    let mut items = Vec::new();
    walk(doc, &mut Vec::new(), &mut items);
    let mut plan = Plan {
        kept: Vec::new(),
        redundant: Vec::new(),
        old_side: Value::Null,
        notes: Vec::new(),
    };
    for item in items {
        let (path, value) = match item {
            Item::Comment(path, lines) => {
                let mut key = path.clone();
                key.push(Segment::Key("$comment".into()));
                report.doc_converted.push(format_path(&key));
                if lines.iter().any(|l| is_grammar_line(l.trim_start())) {
                    return Err(invalid("forged-grammar-line"));
                }
                if !renders(ctx, &path, &lines) {
                    plan.notes.push((path, lines));
                }
                continue;
            }
            Item::Leaf(path, value) => match retired.iter().find(|r| path.starts_with(r)) {
                Some(gone) => {
                    let gone = format_path(gone);
                    if !report.dropped_retired.contains(&gone) {
                        report.dropped_retired.push(gone);
                    }
                    continue;
                }
                None => (path, value),
            },
        };
        let mut alone = Value::Null;
        json_put(&mut alone, &path, Some(value.clone()));
        let standard = ctx.standard.value_at(&path);
        // A key outside the file's scope is dropped when it holds nothing the standard does not
        // (a null, or the standard's own value); anything else is the owner's to move.
        let refusal = judge(ctx.schemas, kind, &alone, None).into_iter().next();
        match refusal {
            Some(r)
                if value.is_null()
                    || (r.code == "config-key-out-of-scope" && standard == Some(&value)) =>
            {
                report.dropped_out_of_scope.push(format_path(&path));
                continue;
            }
            Some(r) => return Err(SnapshotError::Refused(vec![r])),
            None => {}
        }
        json_put(&mut plan.old_side, &path, Some(value.clone()));
        match standard == Some(&value) {
            true => plan.redundant.push(path),
            false => plan.kept.push((path, value)),
        }
    }
    Ok(plan)
}

/// Gives every foreign `$comment` text to the key it sat in, as plain notes after its doc lines.
fn attach_notes(
    bytes: Vec<u8>,
    notes: &[(Vec<Segment>, Vec<String>)],
) -> Result<Vec<u8>, SnapshotError> {
    let mut doc = parse(&bytes, Profile::StrictConfig, YAML_NAME)?;
    let held = doc.to_json()?;
    for (path, lines) in notes {
        let first = held.as_object().and_then(|m| m.keys().next());
        let target = match (path.is_empty(), first) {
            (true, Some(key)) => vec![Segment::Key(key.clone())],
            _ => path.clone(),
        };
        if json_at(&held, &target).is_none() {
            continue;
        }
        let mut block = doc.comments_at(&target)?.above;
        block.extend(lines.iter().flat_map(|l| l.lines().map(str::to_string)));
        doc.set_comment_block(&target, &block)
            .map_err(|_| invalid("unplaceable-comment"))?;
    }
    Ok(doc.to_bytes())
}

fn differing(
    schemas: &Schemas,
    a: &Value,
    b: &Value,
    path: &mut Vec<Segment>,
    out: &mut BTreeSet<String>,
) {
    // A value a higher layer replaces whole is one decision: it is listed at its own path, the
    // path a machine file holds it under, never at the keys it carries or drops.
    let whole = matches!(
        schemas.resolve(path).and_then(|r| r.merge),
        Some("replace" | "leaf")
    );
    if let (Value::Object(x), Value::Object(y), false) = (a, b, whole) {
        for key in x.keys().chain(y.keys()).collect::<BTreeSet<_>>() {
            path.push(Segment::Key(key.clone()));
            match (x.get(key), y.get(key)) {
                (Some(p), Some(q)) => differing(schemas, p, q, path, out),
                _ => drop(out.insert(format_path(path))),
            }
            path.pop();
        }
        return;
    }
    let canonical = |v| fgos_canonical_json::canonical_json(v).ok();
    if canonical(a).is_none() || canonical(a) != canonical(b) {
        out.insert(format_path(path));
    }
}

/// The paths where the two files read differently as the project file, over `roots`' machine files,
/// by Canonical JSON.
fn differences(
    ctx: &Context,
    roots: &SnapshotRequest,
    old: &[u8],
    new: &[u8],
) -> Result<Vec<String>, SnapshotError> {
    // The project layer is exactly the bytes, even while both files of the project exist, and its
    // command values too: in a linked worktree the snapshot would take them from the main checkout,
    // so both sides would read the same command values and hide every machine override among them.
    let absent = without_project(roots);
    let isolated = SnapshotRequest {
        trusted_root: absent.project_root.clone(),
        ..absent
    };
    let read =
        |bytes| snapshot_with(ctx, &isolated, "project", bytes).map(|snapshot| snapshot.value);
    let mut found = BTreeSet::new();
    differing(
        ctx.schemas,
        &read(old)?,
        &read(new)?,
        &mut Vec::new(),
        &mut found,
    );
    Ok(found.into_iter().collect())
}

/// Effective-value equivalence: over no machine file at all the two must read the same, so a
/// difference over this machine's files is a dropped value no longer hiding the global file's own
/// (returned as the machine overrides). The two files are never compared on faith.
fn compare(
    ctx: &Context,
    roots: &SnapshotRequest,
    old: &[u8],
    new: &[u8],
) -> Result<Vec<String>, SnapshotError> {
    let bare = SnapshotRequest {
        global_dir: roots.project_root.join(".fgos-migrate-absent/.fgos"),
        ..roots.clone()
    };
    match differences(ctx, &bare, old, new)? {
        none if none.is_empty() => differences(ctx, roots, old, new),
        found => Err(listing("config-migrate-equivalence-failed", found)),
    }
}

/// The global file's equivalence: read over no project file, the two must give the same value
/// everywhere, since no machine layer lies under the global file to explain a difference.
fn same_global(
    ctx: &Context,
    roots: &SnapshotRequest,
    old: &[u8],
    new: &[u8],
) -> Result<(), SnapshotError> {
    let absent = without_project(roots);
    let bare = SnapshotRequest {
        trusted_root: absent.project_root.clone(),
        ..absent
    };
    let read = |bytes| snapshot_with(ctx, &bare, "global", bytes).map(|snapshot| snapshot.value);
    let mut found = BTreeSet::new();
    differing(
        ctx.schemas,
        &read(old)?,
        &read(new)?,
        &mut Vec::new(),
        &mut found,
    );
    match found.is_empty() {
        true => Ok(()),
        false => Err(listing("config-migrate-equivalence-failed", found)),
    }
}

/// Backup, YAML, second check, tombstone, under the scope's lock; each stage is observed.
fn install(
    place: &Place,
    opts: &MigrateOptions,
    old: &LoadedFile,
    yaml: Option<&[u8]>,
    observe: &mut dyn FnMut(MigrateStep) -> io::Result<()>,
) -> Result<String, SnapshotError> {
    let (root, max) = (&place.base, Profile::StrictConfig.limits().input_bytes);
    let fgos = root.join(&place.dir);
    let _lock = hold(
        place.lock,
        &place.lock_dir,
        &opts.lock_root,
        opts.lock_wait_ms,
    )?;
    dir_identity(root, &place.backups, PRIVATE_DIR_MODE)?;
    let (backups, name) = (
        root.join(&place.backups),
        format!("{}-{JSON_NAME}", &old.revision[..16]),
    );
    if install_once_with_mode(&backups, &name, &old.bytes, PRIVATE_FILE_MODE).map_err(io_error)?
        == Installed::AlreadyExists
    {
        // The name carries the content revision; a different content under it is not ours to trust.
        let held = read_beneath(root, &place.backups.join(&name), max)?;
        if held.is_none_or(|file| file.bytes != old.bytes) {
            return Err(conflict("backup-differs"));
        }
    }
    observe(MigrateStep::BackupWritten)?;
    if let Some(bytes) = yaml {
        if install_once_with_mode(&fgos, YAML_NAME, bytes, place.yaml_mode).map_err(io_error)?
            == Installed::AlreadyExists
        {
            return Err(conflict("revision-changed"));
        }
    }
    observe(MigrateStep::YamlCreated)?;
    observe(MigrateStep::SecondCheck)?;
    let now = read_beneath(root, &place.dir.join(JSON_NAME), max)?;
    if now.is_none_or(|file| file.revision != old.revision) {
        return Err(conflict("revision-changed"));
    }
    let tombstone = [TOMBSTONE.as_bytes(), b"\n"].concat();
    replace_durably_with_mode(&fgos, JSON_NAME, &tombstone, old.mode).map_err(io_error)?;
    observe(MigrateStep::TombstoneWritten)?;
    Ok(place.backups.join(name).to_string_lossy().into_owned())
}

/// Migrates `.fgos/config.json` of the project at `roots.project_root`. Run again after an
/// interruption it finishes the job; on a migrated project it does nothing.
pub fn project(
    ctx: &Context,
    roots: &SnapshotRequest,
    writer: &WriterIdentity,
    opts: &MigrateOptions,
    observe: impl FnMut(MigrateStep) -> io::Result<()>,
) -> Result<MigrationReport, SnapshotError> {
    run(ctx, roots, &Place::project(roots), writer, opts, observe)
}

/// Migrates `~/.fgos/config.json` the same way. Refused unless `machine_checked` (no release on
/// this machine reads or writes the JSON file) and the account and token keys have left it; a dry
/// run needs neither and writes nothing.
pub fn global(
    ctx: &Context,
    roots: &SnapshotRequest,
    writer: &WriterIdentity,
    opts: &MigrateOptions,
    machine_checked: bool,
    observe: impl FnMut(MigrateStep) -> io::Result<()>,
) -> Result<MigrationReport, SnapshotError> {
    if !machine_checked && !opts.dry_run {
        return Err(ConfigRefusal::new("config-machine-check-required").into());
    }
    let pending = crate::relocate::plan(ctx, &roots.global_dir)?;
    if !pending.is_empty() {
        return Err(listing(
            "config-migrate-moves-pending",
            pending.into_iter().map(|p| p.path),
        ));
    }
    run(ctx, roots, &Place::global(roots)?, writer, opts, observe)
}

fn run(
    ctx: &Context,
    roots: &SnapshotRequest,
    place: &Place,
    writer: &WriterIdentity,
    opts: &MigrateOptions,
    mut observe: impl FnMut(MigrateStep) -> io::Result<()>,
) -> Result<MigrationReport, SnapshotError> {
    if roots.class == SessionClass::Confined && !opts.dry_run {
        return Err(ConfigRefusal::new("config-write-confined").into());
    }
    let max = Profile::StrictConfig.limits().input_bytes;
    let (root, fgos) = (&place.base, place.dir.as_path());
    let json = read_beneath(root, &fgos.join(JSON_NAME), max)?;
    let yaml = read_beneath(root, &fgos.join(YAML_NAME), max)?;
    let mut report = MigrationReport {
        dry_run: opts.dry_run,
        ..Default::default()
    };
    let old = match json.filter(|file| !is_tombstone(&file.bytes)) {
        Some(file) => file,
        None if yaml.is_some() => {
            report.already_migrated = true;
            return Ok(report);
        }
        None => return Err(invalid("no-legacy-file")),
    };
    let doc = parse(&old.bytes, Profile::StrictConfig, JSON_NAME).map_err(|refusal| {
        let mut out = ConfigRefusal::parse(refusal);
        out.code = "config-migrate-source-invalid";
        SnapshotError::from(out)
    })?;
    if !matches!(doc.value(), Doc::Map(_)) {
        return Err(invalid("not-a-mapping"));
    }
    report.resumed = yaml.is_some();
    let plan = classify(ctx, doc.value(), place.kind, &mut report)?;
    let actor = Actor::from_writer(writer);
    let reason = Reason::migrated(contract()["reason"].as_str().unwrap_or_default())?;
    let set = |(path, value): &(Vec<Segment>, Value)| Edit::Set {
        path: path.clone(),
        value: value.clone(),
    };
    let edits: Vec<Edit> = plan.kept.iter().map(set).collect();
    let fresh = match &yaml {
        Some(_) => None,
        None => Some(attach_notes(
            produce(ctx, &edits, false, &actor, Some(&reason), None, YAML_NAME)?.0,
            &plan.notes,
        )?),
    };
    let new_bytes = fresh
        .as_deref()
        .or(yaml.as_ref().map(|f| f.bytes.as_slice()))
        .unwrap_or_default();
    let old_bytes = serde_json::to_vec(&plan.old_side).map_err(io::Error::other)?;
    let checked = match place.kind {
        SourceKind::Global => same_global(ctx, roots, &old_bytes, new_bytes).map(|()| Vec::new()),
        _ => compare(ctx, roots, &old_bytes, new_bytes),
    };
    // An existing YAML file that is not the migration of this JSON file is a shadow, not a resume.
    report.machine_overrides = match (checked, report.resumed) {
        (Err(_), true) => {
            let file = place.dir.join(JSON_NAME);
            return Err(ConfigRefusal::new("config-legacy-shadowed")
                .in_file(&file.to_string_lossy())
                .into());
        }
        (checked, _) => checked?,
    };
    if !report.machine_overrides.is_empty() && !opts.accept_machine_overrides && !opts.dry_run {
        return Err(listing(
            "config-migrate-machine-overrides-pending",
            report.machine_overrides,
        ));
    }
    let kept = plan.kept.iter().map(|(p, _)| p);
    report.kept = kept.clone().map(|p| format_path(p)).collect();
    let unknown = kept.filter(|p| ctx.schemas.resolve(p).is_none());
    report.unknown_kept = unknown.map(|p| format_path(p)).collect();
    report.dropped_redundant = plan.redundant.iter().map(|p| format_path(p)).collect();
    if !opts.dry_run {
        report.backup = Some(install(place, opts, &old, fresh.as_deref(), &mut observe)?);
    }
    Ok(report)
}
