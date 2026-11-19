//! What a unit's `syncBase` record (`unit.json#sync`) says, as pure decisions over the record's JSON:
//! the scope a writing seat may write now, what it is told about an open merge, the part of the record a run
//! result carries, and the result of a sync-only unit that needed no worker. The merge itself is the Git
//! door's (`fgos-git`); nothing here touches a repository.

use fgos_execution::seat_resolver::SYNC_SEAT;
use serde_json::{json, Map, Value};

fn status_of(sync: Option<&Value>) -> Option<&str> {
    sync?.get("status")?.as_str()
}

/// The scope a writing seat of this unit may write now: the stored `writeScope`, plus the conflicted paths it
/// does not cover while, and only while, a merge of this run is open for the worker.
pub fn effective_write_scope(unit_record: &Value) -> Vec<Value> {
    let scope = unit_record
        .get("writeScope")
        .filter(|v| !v.is_null())
        .or_else(|| unit_record.pointer("/unit/writes").filter(|v| !v.is_null()))
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let sync = unit_record.get("sync");
    if status_of(sync) != Some("conflicted") {
        return scope;
    }
    let added = sync
        .and_then(|s| s.get("scopeAdded"))
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    scope.into_iter().chain(added).collect()
}

/// What a writing seat is told about a merge left open for it; empty when there is none.
pub fn sync_brief(sync: Option<&Value>) -> String {
    if status_of(sync) != Some("conflicted") {
        return String::new();
    }
    let sync = sync.unwrap_or(&Value::Null);
    let text = |key: &str| sync.get(key).and_then(Value::as_str).unwrap_or("");
    let sha: String = text("sha").chars().take(12).collect();
    let mut lines = vec![
        String::new(),
        "## Merge to finish".to_string(),
        format!(
            "The runner merged `{}` ({sha}) into this branch and git stopped on conflicts in:",
            text("ref")
        ),
    ];
    lines.extend(
        sync.get("conflicts")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .map(|p| format!("- {}", p.as_str().unwrap_or(""))),
    );
    lines.push("Edit each of these files so that no conflict marker (`<<<<<<<`, `=======`, `>>>>>>>`, `|||||||`) is left, keeping what both sides meant. They are in your write scope.".into());
    lines.push("Never run git yourself (no `git add`, `git merge --continue`, `git merge --abort`, `git commit`): the runner concludes the merge commit after your round passes, and refuses it while a marker is left.".into());
    lines.join("\n")
}

/// The sync part of a run's result: the record without the fields only the run's own resume reads.
pub fn sync_summary(sync: Option<&Value>) -> Option<Value> {
    let sync = sync.filter(|s| !s.is_null())?;
    let object = sync.as_object()?;
    let kept: Map<String, Value> = object
        .iter()
        .filter(|(k, _)| {
            !["started", "mergeStaged", "nativeHead", "nextOperationId"].contains(&k.as_str())
        })
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect();
    Some(Value::Object(kept))
}

/// A sync-only unit that needed no worker: its one result is the runner's merge commit (or none).
pub fn sync_only_pass(sync: &Value) -> Value {
    let warnings = sync
        .get("warnings")
        .filter(|w| w.as_array().is_some_and(|a| !a.is_empty()));
    let mut commit = match sync.pointer("/commit/sha").and_then(Value::as_str) {
        Some(sha) => json!({
            "status": "committed",
            "sha": sha,
            "subject": sync.pointer("/commit/subject").cloned().unwrap_or(Value::Null),
            "outOfScope": [],
            "preExistingInScope": [],
        }),
        None => json!({ "status": "no-changes", "outOfScope": [], "preExistingInScope": [] }),
    };
    if let (Some(w), Some(object)) = (warnings, commit.as_object_mut()) {
        object.insert("warnings".into(), w.clone());
    }
    json!({ "outcome": "pass", "results": [{ "outcome": "pass", "seat": SYNC_SEAT, "round": 0, "commit": commit }] })
}

/// Whether a record with no pending merge still owes a sync-only pass: its merge is done, the unit only syncs,
/// and no producer was ever bound.
pub fn owes_sync_only_pass(unit_record: &Value) -> bool {
    let done = matches!(
        status_of(unit_record.get("sync")),
        Some("merged" | "up-to-date")
    );
    done && unit_record.pointer("/unit/syncOnly") == Some(&Value::Bool(true))
        && unit_record.pointer("/bindings/producer~11").is_none()
}

/// The outcome that ends a run whose merge refused to start: git failing, or a commit that landed holding the
/// wrong set, is a failure; anything else refused and left no merge open.
pub fn refused_sync_outcome(reason: &str) -> &'static str {
    if matches!(reason, "git-error" | "committed-set-mismatch") {
        "execution-failure"
    } else {
        "policy-refusal"
    }
}
