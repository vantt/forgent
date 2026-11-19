//! The doctor rows of the project supervision. All three are read-only and none repairs: a stopped watcher cannot
//! report itself, so the rows only name what they find and the verb that shows or settles it. A row that finds
//! something passes with a `warning:` message (the level the engine gives it); none fails.

use super::{judged, project_root_refusal, Rows};
use crate::wiring::supervision;
use fgos_distribution::doctor::{timed, FixResult, RowOutcome};
use std::path::Path;

pub const ROWS: &[&str] = &[
    "supervisor-events-unhandled",
    "supervision-pace",
    "land-gates-configured",
];

fn no_fixes(_: &Path, ids: &[&str]) -> Vec<FixResult> {
    ids.iter()
        .map(|id| FixResult::done(id, false, format!("no fix {id} is run in process")))
        .collect()
}

pub const GROUP: Rows = Rows {
    rows: ROWS,
    fixes: &[],
    judge,
    fix: no_fixes,
};

fn judge(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    ids.iter()
        .map(|id| {
            timed(|| match project_root_refusal(root) {
                Some(refusal) => judged(true, format!("warning: {refusal}")),
                None => match *id {
                    "supervisor-events-unhandled" => events_unhandled(root),
                    "supervision-pace" => pace(root),
                    "land-gates-configured" => land_gates(root),
                    other => unreachable!("supervision group asked for row {other}"),
                },
            })
        })
        .collect()
}

/// Pointer: how many raised events the supervisor has not handled.
fn events_unhandled(root: &Path) -> RowOutcome {
    match supervision::unhandled_count(root) {
        Ok(None) => judged(true, "no repository holds an event queue here"),
        Ok(Some(0)) => judged(true, "no unhandled supervisor events"),
        Ok(Some(n)) => judged(
            true,
            format!("warning: {n} unhandled, run `fgos supervisor queue`"),
        ),
        Err(why) => judged(
            true,
            format!("warning: the event queue is unreadable ({why}); run `fgos supervisor queue`"),
        ),
    }
}

/// The pace definitions, run read-only: a row of `watcher-overdue` (a running plan and no tick for too long) or of
/// `supervisor-idle-burn` (a supervisor started with nothing to run) is the warning.
fn pace(root: &Path) -> RowOutcome {
    if !supervision::watcher_enabled(root) {
        return judged(true, "watcher.enabled is false: the pace is not judged");
    }
    match supervision::pace_findings(root) {
        Ok(found) if found.is_empty() => judged(true, "the watcher ticks on time and no supervisor start was idle"),
        Ok(found) => judged(
            true,
            format!(
                "warning: {} answered a row; run `fgos metrics query --def core/watcher/pace`",
                found.join(", ")
            ),
        ),
        Err(why) => judged(
            true,
            format!("warning: the pace definitions could not be run ({why}); run `fgos metrics query --def core/watcher/pace`"),
        ),
    }
}

/// When the watcher is on, every landing needs a gate: an empty `land.gates` refuses each `fgos land`.
fn land_gates(root: &Path) -> RowOutcome {
    if supervision::watcher_enabled(root) && supervision::land_gates_empty(root) {
        return judged(
            true,
            "warning: every `fgos land` refuses land-gate-missing; set land.gates",
        );
    }
    judged(true, "land.gates is set, or the watcher is not enabled")
}
