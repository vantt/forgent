//! The verbs that need the write door and the findings engine (Unix only): `check`, `set`, `unset`,
//! `patch`, `migrate` and `refresh-docs`. Every write goes through `write::commit`, `migrate` or
//! `relocate`; no code here opens a config file for writing.

use std::io::Read;
use std::path::Path;
use std::time::SystemTime;

use fgos_identity::{resolve_current, Refusal};
use fgos_yaml_doc::path::format_path;
use fgos_yaml_doc::{parse, Profile, Segment};
use serde_json::{json, Value};

use super::{path_arg, refuse, refused, Bundle, ConfigOutcome, Verb};
use crate::doctor::{check, Consumer, Severity};
use crate::migrate::{self, MigrateOptions, MigrationReport};
use crate::relocate::{self, Held, MoveRequest};
use crate::scope::SourceKind;
use crate::snapshot::{Context, SessionClass, SnapshotError, SnapshotRequest};
use crate::write::{commit, refresh, target_revision, Edit, WriteRequest, WriteResult};
use crate::ConfigRefusal;

const LOCK_WAIT_MS: u64 = 5_000;

/// `check`: every finding of the files, failing (exit 65) when one is a `fail` row.
fn run_check(ctx: &Context, roots: &SnapshotRequest) -> Result<ConfigOutcome, Refusal> {
    let findings = check(ctx, roots, SystemTime::now());
    let failing = |f: &crate::doctor::Finding| f.severity(Consumer::Check) == Severity::Fail;
    let ok = !findings.iter().any(failing);
    let rows = findings.iter().map(|f| {
        json!({
            "row": f.row, "severity": if failing(f) { "fail" } else { "warn" }, "file": f.file,
            "line": f.line, "column": f.column, "path": f.path, "fix": f.fix, "detail": f.detail,
        })
    });
    Ok(ConfigOutcome {
        data: json!({ "ok": ok, "findings": rows.collect::<Vec<_>>() }),
        exit: if ok { 0 } else { Refusal::EXIT },
    })
}

/// The file a key lives in: an accounts key in the accounts file, a `global-only` key in the global
/// file, anything else in the project (or, for a `both` key, the global file with `--global`).
fn target_of(bundle: &Bundle, path: &[Segment], global: bool) -> Result<SourceKind, Refusal> {
    let chosen = if global {
        SourceKind::Global
    } else {
        SourceKind::Project
    };
    let Some(node) = bundle.schemas.resolve(path) else {
        return Ok(chosen);
    };
    match (node.file, node.scope) {
        ("token", _) => Err(refuse(
            "token-not-settable",
            "the gateway token is its own file, not a config key",
        )),
        ("accounts", _) => Ok(SourceKind::Accounts),
        (_, "global-only") => Ok(SourceKind::Global),
        (_, "project-only") if global => Err(refuse(
            "scope-project-only",
            format!(
                "{} is project-only; --global cannot target it",
                format_path(path)
            ),
        )),
        _ => Ok(chosen),
    }
}

fn file_of(kind: SourceKind) -> &'static str {
    match kind {
        SourceKind::Project => ".fgos/config.yaml",
        SourceKind::Global => "~/.fgos/config.yaml",
        SourceKind::Accounts => "~/.fgos/private/accounts.yaml",
    }
}

fn request(
    roots: &SnapshotRequest,
    kind: SourceKind,
    edits: Vec<Edit>,
    reason: &str,
    ack: bool,
) -> Result<WriteRequest, Refusal> {
    Ok(WriteRequest {
        roots: roots.clone(),
        lock_root: fgos_holder_lock::state_root::lock_root(),
        target: kind,
        expected: target_revision(roots, kind).map_err(refused)?,
        edits,
        reason: reason.to_string(),
        acknowledge_comment_loss: ack,
        lock_wait_ms: LOCK_WAIT_MS,
    })
}

fn written(kind: SourceKind, done: &WriteResult) -> Value {
    json!({
        "target": file_of(kind), "writer": done.writer_id, "revision": done.new_revision,
        "applied": done.applied.iter().map(|(p, unset)| json!({"path": p, "unset": unset})).collect::<Vec<_>>(),
        "notices": done.notices.iter().map(|(id, p)| json!({"id": id, "path": p})).collect::<Vec<_>>(),
        "nothingToDo": done.applied.is_empty(),
    })
}

/// `<value>` as one YAML scalar or flow value under strict-config.
fn value_arg(text: &str) -> Result<Value, Refusal> {
    let bad = |why: &str| {
        refuse(
            "value-invalid",
            format!("the value is not a YAML scalar or flow value ({why})"),
        )
    };
    match text.trim() {
        "" => Err(bad("empty; quote an empty string")),
        text => parse(text.as_bytes(), Profile::StrictConfig, "value")
            .and_then(|doc| doc.to_json())
            .map_err(|r| bad(r.rule)),
    }
}

/// A YAML or JSON list of `{set, value}` / `{unset}` items, at most the strict-config input size.
fn patch_edits(file: &Path) -> Result<Vec<Edit>, Refusal> {
    let max = Profile::StrictConfig.limits().input_bytes;
    let bad = |why: String| refuse("patch-invalid", why);
    let mut bytes = Vec::new();
    let opened = std::fs::File::open(file).map_err(|e| bad(format!("{}: {e}", file.display())))?;
    opened
        .take(max as u64 + 1)
        .read_to_end(&mut bytes)
        .map_err(|e| bad(e.to_string()))?;
    if bytes.len() > max {
        return Err(bad(format!(
            "{} is larger than {max} bytes",
            file.display()
        )));
    }
    let list = parse(&bytes, Profile::StrictConfig, "patch").and_then(|doc| doc.to_json());
    let list = list.map_err(|r| bad(format!("does not parse ({})", r.rule)))?;
    let items = list.as_array().filter(|items| !items.is_empty());
    let items = items.ok_or_else(|| bad("expected a non-empty list".into()))?;
    items
        .iter()
        .enumerate()
        .map(|(i, item)| {
            let (set, unset) = (item.get("set"), item.get("unset"));
            let size = item.as_object().map_or(0, |m| m.len());
            match (
                set.and_then(Value::as_str),
                unset.and_then(Value::as_str),
                item.get("value"),
            ) {
                (Some(path), None, Some(value)) if size == 2 => Ok(Edit::Set {
                    path: path_arg(path)?,
                    value: value.clone(),
                }),
                (None, Some(path), None) if size == 1 => Ok(Edit::Unset {
                    path: path_arg(path)?,
                }),
                _ => Err(bad(format!(
                    "item {i}: expected {{set, value}} or {{unset}}"
                ))),
            }
        })
        .collect()
}

fn edited_path(edit: &Edit) -> &[Segment] {
    match edit {
        Edit::Set { path, .. } | Edit::Unset { path } => path,
        Edit::Docs => &[],
    }
}

fn migration(report: &MigrationReport) -> Value {
    json!({
        "kept": report.kept, "unknownKept": report.unknown_kept, "droppedRedundant": report.dropped_redundant,
        "droppedRetired": report.dropped_retired, "droppedOutOfScope": report.dropped_out_of_scope,
        "docConverted": report.doc_converted, "machineOverrides": report.machine_overrides,
        "backup": report.backup, "resumed": report.resumed, "alreadyMigrated": report.already_migrated,
        "dryRun": report.dry_run,
    })
}

fn write(bundle: &Bundle, roots: &SnapshotRequest, verb: &Verb) -> Result<Value, Refusal> {
    let ctx = bundle.ctx();
    let dry = matches!(verb, Verb::Migrate { dry_run: true, .. });
    // Refused before any file is opened (spec section 6); the transaction refuses it again itself.
    if roots.class == SessionClass::Confined && !dry {
        return Err(refused(ConfigRefusal::new("config-write-confined")));
    }
    let writer = resolve_current(None);
    let one = |kind: SourceKind, edits, reason: &str, ack| -> Result<Value, Refusal> {
        let done =
            commit(&ctx, &request(roots, kind, edits, reason, ack)?, &writer).map_err(refused)?;
        Ok(written(kind, &done))
    };
    match verb {
        Verb::Set {
            path,
            value,
            reason,
            global,
        } => {
            let path = path_arg(path)?;
            let kind = target_of(bundle, &path, *global)?;
            one(
                kind,
                vec![Edit::Set {
                    path,
                    value: value_arg(value)?,
                }],
                reason,
                false,
            )
        }
        Verb::Unset {
            path,
            reason,
            global,
            acknowledge,
        } => {
            let path = path_arg(path)?;
            let kind = target_of(bundle, &path, *global)?;
            one(kind, vec![Edit::Unset { path }], reason, *acknowledge)
        }
        Verb::Patch {
            file,
            reason,
            global,
        } => {
            let edits = patch_edits(file)?;
            let kinds: Result<Vec<_>, _> = edits
                .iter()
                .map(|e| target_of(bundle, edited_path(e), *global))
                .collect();
            let kinds = kinds?;
            if kinds.iter().any(|k| *k != kinds[0]) {
                return Err(refuse(
                    "patch-spans-files",
                    "the edits belong to different files; one patch writes one file",
                ));
            }
            one(kinds[0], edits, reason, false)
        }
        Verb::Migrate {
            global: false,
            accept_machine_overrides,
            dry_run,
            ..
        } => {
            let opts = MigrateOptions {
                accept_machine_overrides: *accept_machine_overrides,
                dry_run: *dry_run,
                lock_root: fgos_holder_lock::state_root::lock_root(),
                lock_wait_ms: LOCK_WAIT_MS,
            };
            let report =
                migrate::project(&ctx, roots, &writer, &opts, |_| Ok(())).map_err(refused)?;
            Ok(migration(&report))
        }
        Verb::Migrate {
            global: true,
            dry_run: true,
            ..
        } => {
            let pending = relocate::plan(&ctx, &roots.global_dir).map_err(refused)?;
            let held = |h: Held| match h {
                Held::Missing => "missing",
                Held::Equal => "equal",
                Held::Differs => "differs",
            };
            let rows = pending.iter().map(|p| json!({"path": p.path, "entries": p.entries, "destination": held(p.destination)}));
            Ok(json!({ "dryRun": true, "pending": rows.collect::<Vec<_>>() }))
        }
        Verb::Migrate {
            global: true,
            finish,
            machine_checked,
            ..
        } => {
            let req = MoveRequest {
                roots: roots.clone(),
                lock_root: fgos_holder_lock::state_root::lock_root(),
                lock_wait_ms: LOCK_WAIT_MS,
            };
            let moved = match finish {
                true => relocate::finish(&ctx, &req, *machine_checked, |_| Ok(())),
                false => relocate::copy(&ctx, &req, &writer, |_| Ok(())),
            };
            let moved = moved.map_err(refused)?;
            Ok(
                json!({ "stage": if *finish { "finish" } else { "copy" }, "paths": moved.paths, "reformatted": moved.reformatted }),
            )
        }
        Verb::RefreshDocs { global } => {
            let kinds = if *global {
                vec![SourceKind::Global, SourceKind::Accounts]
            } else {
                vec![SourceKind::Project]
            };
            let (mut files, mut skipped) = (Vec::new(), Vec::new());
            for kind in kinds {
                match target_revision(roots, kind) {
                    Err(SnapshotError::Refused(r))
                        if r.iter().any(|x| x.code == "config-format-legacy-json") =>
                    {
                        skipped.push(file_of(kind));
                        continue;
                    }
                    other => other.map_err(refused)?,
                };
                let done = refresh(
                    &ctx,
                    request(roots, kind, Vec::new(), "", false)?,
                    &writer,
                    |_| Ok(()),
                )
                .map_err(refused)?;
                files.push(json!({ "file": file_of(kind), "changed": done.applied.len() }));
            }
            let nothing = files.iter().all(|f| f["changed"] == 0);
            Ok(json!({ "files": files, "skippedLegacyJson": skipped, "nothingToDo": nothing }))
        }
        _ => unreachable!("read verbs are routed to config.read"),
    }
}

/// The verbs that need the write door or the findings engine.
pub(super) fn run(
    bundle: &Bundle,
    roots: &SnapshotRequest,
    verb: &Verb,
) -> Result<ConfigOutcome, Refusal> {
    match verb {
        Verb::Check => run_check(&bundle.ctx(), roots),
        _ => Ok(ConfigOutcome {
            data: write(bundle, roots, verb)?,
            exit: 0,
        }),
    }
}
