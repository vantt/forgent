//! CLI handler for `fgos metrics harness` (Lane A - Phase F4).
//!
//! Subcommand: `fgos metrics harness [--case <name> | --since <iso> [--until <iso>]] [--dir <root>]`

use crate::case_journal;
use crate::contract::{Observation, ObservationSource, ObserveRequest, Window};
use crate::metrics_cli::parse_flags;
use crate::scorecard::{
    compute_case, compute_faults, compute_runs, compute_tokens, compute_work, CommitsSection,
    Scorecard,
};
use crate::sources::invocation_faults::InvocationFaultsSource;
use crate::sources::repo::count_commits_in_range;
use serde_json::json;

pub fn dispatch_harness(
    req: &ObserveRequest,
    sources: &[Box<dyn ObservationSource>],
) -> Result<serde_json::Value, String> {
    let flags = parse_flags("harness", &req.args, &["--case", "--since", "--until"], &[], false)?;

    let mut warnings = Vec::new();

    // 1. Resolve case window or timeframe window
    let (case_window, window) = if let Some(cn) = flags.value("--case") {
        let cw = case_journal::find(&req.root, cn)
            .ok_or_else(|| format!("case \"{}\" not found", cn))?;
        let w = Window {
            since: Some(cw.since.clone()),
            until: cw.until.clone(),
        };
        (Some(cw), w)
    } else {
        let w = Window {
            since: flags.value("--since").map(str::to_owned),
            until: flags.value("--until").map(str::to_owned),
        };
        (None, w)
    };

    // 2. Collect observations from sources + invocation_faults
    let mut observations: Vec<Observation> = Vec::new();
    for src in sources {
        match src.observations(&req.root, &window) {
            Ok(obs) => observations.extend(obs),
            Err(e) => warnings.push(format!("source '{}' error: {}", src.source_id(), e)),
        }
    }

    // Also include invocation faults
    let faults_src = InvocationFaultsSource::new();
    match faults_src.observations(&req.root, &window) {
        Ok(obs) => observations.extend(obs),
        Err(e) => warnings.push(format!("invocation-faults source error: {}", e)),
    }

    // 3. Compute sections
    let (case_sec, case_warns) = if let Some(cw) = &case_window {
        let (cs, cw_warns) = compute_case(cw);
        (Some(cs), cw_warns)
    } else {
        (None, Vec::new())
    };
    warnings.extend(case_warns);

    let is_plain_or_cook = case_sec
        .as_ref()
        .map(|c| c.harness == "plain" || c.harness == "cook-plan")
        .unwrap_or(false);

    let runs_sec = if is_plain_or_cook {
        Some(json!("n/a (harness plain/cook-plan)"))
    } else {
        Some(serde_json::to_value(compute_runs(&observations)).map_err(|e| e.to_string())?)
    };

    let tokens_sec = compute_tokens(&observations);

    // Commits section
    let commits_sec = if let Some(cw) = &case_window {
        let count = count_commits_in_range(
            &req.root,
            cw.head_at_open.as_deref(),
            cw.head_at_close.as_deref(),
        )
        .unwrap_or(0);
        Some(CommitsSection {
            count,
            head_at_open: cw.head_at_open.clone(),
            head_at_close: cw.head_at_close.clone(),
        })
    } else {
        None
    };

    // Faults section
    let faults_sec = compute_faults(&observations);

    // Work section (#1, #2)
    let case_items = case_window.as_ref().map(|cw| cw.items.as_slice());
    let work_sec = Some(
        serde_json::to_value(compute_work(&observations, case_items, &window))
            .map_err(|e| e.to_string())?,
    );

    let scorecard = Scorecard {
        case: case_sec,
        runs: runs_sec,
        tokens: tokens_sec,
        commits: commits_sec,
        work: work_sec,
        faults: faults_sec,
        warnings,
    };
    serde_json::to_value(scorecard).map_err(|e| e.to_string())
}
