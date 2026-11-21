//! What a Unit run's directory says and when it may go, read from the disk: the reads `fgos-execution::run_facts`
//! judges (the `unit.json` bytes, the unit control ledger, the worktree's custody, the derived unit state without a
//! live probe), and the one place a Unit run directory is deleted. A layer above (the Workflow, through the Node
//! addon) asks here and never opens `.fgos/assignments/<unitRunId>` itself.

use std::path::{Path, PathBuf};

use fgos_execution::handoff::unit_run_dir;
use fgos_execution::run_facts::{
    judge_unit_run, unit_run_facts, DirectoryReads, Standing, UnitRunFacts, UnitState, Verdict,
};
use fgos_execution::unit_record::{
    attempt_dir_name, derive_unit_state, unit_control_dir, AttemptState,
};
use fgos_run_supervisor::controller::lease::{inspect_run_control, list_generations};
use serde_json::Value;

use super::custody::custody_held;

/// `unitControllerHeld(unitDir)`: the unit control ledger says a controller holds the run; a ledger that cannot be
/// read is not held.
pub fn unit_controller_held(unit_dir: &Path) -> bool {
    inspect_run_control(&unit_control_dir(unit_dir)).is_ok_and(|state| state.held)
}

fn read_json(file: &Path) -> Option<Value> {
    std::fs::read(file)
        .ok()
        .and_then(|bytes| serde_json::from_str(&String::from_utf8_lossy(&bytes)).ok())
}

/// What `unit.json` of `unit_run_id` under `fgos_dir` says (`unitRunFacts`).
pub fn unit_run_facts_at(fgos_dir: &Path, unit_run_id: &str) -> UnitRunFacts {
    let dir = unit_run_dir(&fgos_dir.join("assignments"), unit_run_id);
    let bytes = dir
        .as_ref()
        .and_then(|d| std::fs::read(d.join("unit.json")).ok());
    let held = dir.as_deref().is_some_and(unit_controller_held);
    let worktree_exists = bytes
        .as_deref()
        .and_then(|b| serde_json::from_slice::<Value>(b).ok())
        .and_then(|r| r.get("worktree").and_then(Value::as_str).map(PathBuf::from))
        .is_some_and(|w| w.exists());
    unit_run_facts(bytes.as_deref(), held, worktree_exists)
}

/// Whether the attempt the admission ledger committed for `assignment_id` is open, as the unit state reads it
/// without a live probe: an attempt directory that exists and was not settled by the legacy sweep. A ledger that
/// cannot be read counts as open, so a run nobody can prove finished is never judged removable.
fn attempt_state(assignments_dir: &Path, assignment_id: &str) -> AttemptState {
    let assignment = assignments_dir.join(assignment_id);
    let Ok(generations) = list_generations(&assignment.join("admission").join("generations"))
    else {
        return AttemptState::Open;
    };
    let Some(name) = generations.last().and_then(|g| attempt_dir_name(&g.record)) else {
        return AttemptState::NotAdmitted;
    };
    let dir = assignment.join("runs").join(name);
    if !dir.exists() {
        return AttemptState::NotAdmitted;
    }
    if read_json(&dir.join("run.json"))
        .and_then(|r| {
            r.get("settlement")
                .and_then(Value::as_str)
                .map(str::to_string)
        })
        .as_deref()
        == Some("abandoned-legacy")
    {
        return AttemptState::AbandonedLegacy;
    }
    AttemptState::Open
}

/// `deriveUnitState(unitDir, { probe: unprobed })`: the state of a unit run directory with no live probe.
fn unit_state_of(unit_dir: &Path) -> UnitState {
    let unit_run_id = unit_dir
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();
    let summary = read_json(&unit_dir.join("unit-summary.json"));
    let record = read_json(&unit_dir.join("unit.json"));
    let assignments = unit_dir.parent().unwrap_or(unit_dir).to_path_buf();
    let state = derive_unit_state(
        &unit_run_id,
        summary.as_ref(),
        || unit_controller_held(unit_dir),
        record.as_ref(),
        |id| attempt_state(&assignments, id),
    );
    match state.get("unitState").and_then(Value::as_str) {
        Some("completed") => UnitState::Completed,
        Some("failed") => UnitState::Failed,
        Some("running") => UnitState::Running,
        _ => UnitState::AwaitingResume,
    }
}

/// What the disk says of `assignments/<unit_run_id>` before its record is judged.
fn standing(fgos_dir: &Path, unit_run_id: &str) -> Standing {
    let assignments = fgos_dir.join("assignments");
    if unit_run_dir(&assignments, unit_run_id).is_none() {
        let plain = !unit_run_id.is_empty()
            && unit_run_id != "."
            && unit_run_id != ".."
            && !unit_run_id.contains(['/', '\\']);
        let link = plain
            && std::fs::symlink_metadata(assignments.join(unit_run_id))
                .is_ok_and(|m| m.file_type().is_symlink());
        return if link {
            Standing::UnsafeLink
        } else {
            Standing::Unsafe
        };
    }
    let base = std::fs::canonicalize(&assignments).unwrap_or(assignments);
    let expected = base.join(unit_run_id);
    let Ok(stat) = std::fs::symlink_metadata(&expected) else {
        return Standing::Missing;
    };
    if stat.file_type().is_symlink()
        || !stat.is_dir()
        || std::fs::canonicalize(&expected).ok().as_deref() != Some(expected.as_path())
    {
        return Standing::Link;
    }
    let unit_json = expected.join("unit.json");
    let record_bytes = std::fs::read(&unit_json).ok();
    let worktree = record_bytes
        .as_deref()
        .and_then(|b| serde_json::from_str::<Value>(&String::from_utf8_lossy(b)).ok())
        .and_then(|r| r.get("worktree").and_then(Value::as_str).map(PathBuf::from));
    Standing::Directory(DirectoryReads {
        expected: expected.to_string_lossy().into_owned(),
        unit_json_is_file: std::fs::symlink_metadata(&unit_json).is_ok_and(|m| m.is_file()),
        record_bytes,
        controller_held: unit_controller_held(&expected),
        custody_held: worktree.is_some_and(|w| custody_held(fgos_dir, &w)),
        unit_state: unit_state_of(&expected),
    })
}

/// Where one Unit run of `case_id` stands (`judgeUnitRun`); `unless` names the runs another case names.
pub fn judge_unit_run_at(
    fgos_dir: &Path,
    unit_run_id: &str,
    case_id: &str,
    unless: &[String],
) -> Verdict {
    judge_unit_run(
        unit_run_id,
        case_id,
        unless,
        &standing(fgos_dir, unit_run_id),
    )
}

/// What `removeUnitRun` answers.
#[derive(Debug)]
pub enum Removal {
    Removed,
    Kept(Verdict),
}

/// Delete a Unit run that judges removable, judged again now; never follows a link. A deletion that fails is the
/// caller's error.
pub fn remove_unit_run_at(
    fgos_dir: &Path,
    unit_run_id: &str,
    case_id: &str,
    unless: &[String],
) -> std::io::Result<Removal> {
    match judge_unit_run_at(fgos_dir, unit_run_id, case_id, unless) {
        Verdict::Dir(dir) => {
            match std::fs::remove_dir_all(&dir) {
                Ok(()) => {}
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
                Err(e) => return Err(e),
            }
            Ok(Removal::Removed)
        }
        other => Ok(Removal::Kept(other)),
    }
}

/// The stored `unit-summary.json` text of a unit run directory, or `None` when there is none (`readStoredUnitSummary`).
pub fn read_stored_unit_summary(unit_dir: &Path) -> std::io::Result<Option<String>> {
    match std::fs::read(unit_dir.join("unit-summary.json")) {
        Ok(bytes) => Ok(Some(String::from_utf8_lossy(&bytes).into_owned())),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e),
    }
}
