//! CLI handler for `fgos metrics case <open|close|list>` (Lane A1 - Phase F3).

use crate::case_journal::{self, CaseError};
use crate::contract::ObserveRequest;
use crate::metrics_cli::parse_flags;
use serde_json::json;

pub fn dispatch_case(req: &ObserveRequest) -> Result<serde_json::Value, String> {
    if req.args.is_empty() {
        return Err("metrics case: missing sub-action. Available: open, close, list".to_string());
    }

    let action = &req.args[0];
    let args = &req.args[1..];

    match action.as_str() {
        "open" => handle_open(req, args),
        "close" => handle_close(req, args),
        "list" => handle_list(req, args),
        other => Err(format!(
            "metrics case: unknown action \"{}\". Available: open, close, list",
            other
        )),
    }
}

fn handle_open(req: &ObserveRequest, args: &[String]) -> Result<serde_json::Value, String> {
    if args.is_empty() {
        return Err("usage: fgos metrics case open <name> --harness fgos|cook-plan|plain [--task \"<desc>\"] [--dir <root>]".to_string());
    }

    let flags = parse_flags("case", args, &["--harness", "--task"], &[], true)?;
    let name = flags.positional().ok_or("missing case name")?;
    let harness = flags
        .value("--harness")
        .ok_or("missing required option --harness <fgos|cook-plan|plain>")?;
    let task = flags.value("--task").map(str::to_owned);

    match case_journal::open_case(&req.root, name, harness, task) {
        Ok(window) => Ok(json!({
            "ok": true,
            "action": "open",
            "case": window
        })),
        Err(CaseError::AlreadyOpen(open_name)) => {
            eprintln!("fgos: project already has open case: {}", open_name);
            std::process::exit(5);
        }
        Err(err) => Err(err.to_string()),
    }
}

fn handle_close(req: &ObserveRequest, args: &[String]) -> Result<serde_json::Value, String> {
    if args.is_empty() {
        return Err("usage: fgos metrics case close <name> --interventions <N> --verdict usable|fixed|discarded [--note \"…\"] [--items tsk-a,tsk-b] [--sessions id,…]".to_string());
    }

    let flags = parse_flags(
        "case",
        args,
        &["--interventions", "--verdict", "--note", "--items", "--sessions"],
        &[],
        true,
    )?;
    let name = flags.positional().ok_or("missing case name")?;
    let interventions = flags
        .number::<u64>("--interventions")?
        .ok_or("missing required option --interventions <N>")?;
    let verdict = flags
        .value("--verdict")
        .ok_or("missing required option --verdict <usable|fixed|discarded>")?;
    let note = flags.value("--note").map(str::to_owned);
    let list = |flag| {
        flags
            .value(flag)
            .map(|raw| raw.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect())
            .unwrap_or_default()
    };
    let (items, sessions) = (list("--items"), list("--sessions"));

    match case_journal::close_case(
        &req.root,
        name,
        interventions,
        verdict,
        note,
        items,
        sessions,
    ) {
        Ok(window) => Ok(json!({
            "ok": true,
            "action": "close",
            "case": window
        })),
        Err(CaseError::NotOpen(n))
        | Err(CaseError::AlreadyClosed(n))
        | Err(CaseError::NotFound(n)) => {
            eprintln!("fgos: case \"{}\" is not open or already closed", n);
            std::process::exit(5);
        }
        Err(err) => Err(err.to_string()),
    }
}

fn handle_list(req: &ObserveRequest, args: &[String]) -> Result<serde_json::Value, String> {
    let only_open = parse_flags("case", args, &[], &["--open"], false)?.switch("--open");

    let cases = case_journal::list_cases(&req.root, only_open).map_err(|e| e.to_string())?;

    Ok(json!({
        "ok": true,
        "cases": cases
    }))
}
