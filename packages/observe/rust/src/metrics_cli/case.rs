//! CLI handler for `fgos metrics case <open|close|list>` (Lane A1 - Phase F3).

use crate::case_journal::{self, CaseError};
use crate::contract::ObserveRequest;
use serde_json::json;

pub fn dispatch_case(req: &ObserveRequest) -> Result<serde_json::Value, String> {
    if req.args.is_empty() {
        return Err(
            "metrics case: missing sub-action. Available: open, close, list".to_string(),
        );
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

    let mut name = None;
    let mut harness = None;
    let mut task = None;

    let mut i = 0;
    while i < args.len() {
        let arg = &args[i];
        if arg == "--harness" {
            if i + 1 >= args.len() {
                return Err("missing value for --harness".to_string());
            }
            harness = Some(args[i + 1].clone());
            i += 2;
        } else if arg == "--task" {
            if i + 1 >= args.len() {
                return Err("missing value for --task".to_string());
            }
            task = Some(args[i + 1].clone());
            i += 2;
        } else if arg == "--dir" {
            // Already handled by target root resolver, skip next arg
            i += 2;
        } else if !arg.starts_with('-') && name.is_none() {
            name = Some(arg.clone());
            i += 1;
        } else {
            i += 1;
        }
    }

    let name = match name {
        Some(n) => n,
        None => return Err("missing case name".to_string()),
    };

    let harness = match harness {
        Some(h) => h,
        None => return Err("missing required option --harness <fgos|cook-plan|plain>".to_string()),
    };

    match case_journal::open_case(&req.root, &name, &harness, task) {
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

    let mut name = None;
    let mut interventions: Option<u64> = None;
    let mut verdict = None;
    let mut note = None;
    let mut items = Vec::new();
    let mut sessions = Vec::new();

    let mut i = 0;
    while i < args.len() {
        let arg = &args[i];
        if arg == "--interventions" {
            if i + 1 >= args.len() {
                return Err("missing value for --interventions".to_string());
            }
            let n: u64 = args[i + 1]
                .parse()
                .map_err(|_| format!("invalid integer for --interventions: {}", args[i + 1]))?;
            interventions = Some(n);
            i += 2;
        } else if arg == "--verdict" {
            if i + 1 >= args.len() {
                return Err("missing value for --verdict".to_string());
            }
            verdict = Some(args[i + 1].clone());
            i += 2;
        } else if arg == "--note" {
            if i + 1 >= args.len() {
                return Err("missing value for --note".to_string());
            }
            note = Some(args[i + 1].clone());
            i += 2;
        } else if arg == "--items" {
            if i + 1 >= args.len() {
                return Err("missing value for --items".to_string());
            }
            items = args[i + 1]
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();
            i += 2;
        } else if arg == "--sessions" {
            if i + 1 >= args.len() {
                return Err("missing value for --sessions".to_string());
            }
            sessions = args[i + 1]
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();
            i += 2;
        } else if arg == "--dir" {
            i += 2;
        } else if !arg.starts_with('-') && name.is_none() {
            name = Some(arg.clone());
            i += 1;
        } else {
            i += 1;
        }
    }

    let name = match name {
        Some(n) => n,
        None => return Err("missing case name".to_string()),
    };

    let interventions = match interventions {
        Some(n) => n,
        None => return Err("missing required option --interventions <N>".to_string()),
    };

    let verdict = match verdict {
        Some(v) => v,
        None => return Err("missing required option --verdict <usable|fixed|discarded>".to_string()),
    };

    match case_journal::close_case(
        &req.root,
        &name,
        interventions,
        &verdict,
        note,
        items,
        sessions,
    ) {
        Ok(window) => Ok(json!({
            "ok": true,
            "action": "close",
            "case": window
        })),
        Err(CaseError::NotOpen(n)) | Err(CaseError::AlreadyClosed(n)) | Err(CaseError::NotFound(n)) => {
            eprintln!("fgos: case \"{}\" is not open or already closed", n);
            std::process::exit(5);
        }
        Err(err) => Err(err.to_string()),
    }
}

fn handle_list(req: &ObserveRequest, args: &[String]) -> Result<serde_json::Value, String> {
    let mut only_open = false;
    for arg in args {
        if arg == "--open" {
            only_open = true;
        }
    }

    let cases = case_journal::list_cases(&req.root, only_open).map_err(|e| e.to_string())?;

    Ok(json!({
        "ok": true,
        "cases": cases
    }))
}
