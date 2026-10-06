//! CLI handler for `fgos metrics eval record|list`.

use crate::contract::ObserveRequest;
use crate::eval_journal::{self, EvalInput};
use serde_json::{json, Value};

/// Both `--flag value` and `--flag=value` use the existing Observe convention.
fn filters(args: &[String], record: bool) -> Result<(Option<String>, Option<String>), String> {
    let mut harness = None;
    let mut question = None;
    let mut i = 0;
    while i < args.len() {
        let (name, inline) = match args[i].split_once('=') {
            Some((name, value)) => (name, Some(value)),
            None => (args[i].as_str(), None),
        };
        if name == "--json" && inline.is_none() {
            i += 1;
            continue;
        }
        if name != "--dir" && (record || (name != "--harness" && name != "--question")) {
            return Err(format!("metrics eval: unknown option {}", args[i]));
        }
        let value = if let Some(value) = inline {
            value
        } else {
            i += 1;
            args.get(i).filter(|s| !s.starts_with("--"))
                .ok_or_else(|| format!("missing value for {}", name))?.as_str()
        };
        if value.trim().is_empty() {
            return Err(format!("missing value for {}", name));
        }
        match name {
            "--harness" => harness = Some(value.to_string()),
            "--question" => question = Some(value.to_string()),
            _ => {} // --dir is resolved by the native target-root projector.
        }
        i += 1;
    }
    Ok((harness, question))
}

pub fn dispatch_eval(req: &ObserveRequest) -> Result<Value, String> {
    let (action, args) = req.args.split_first()
        .ok_or_else(|| "metrics eval: missing action. Available: record, list".to_string())?;
    match action.as_str() {
        "record" => {
            filters(args, true)?;
            let stdin = req.stdin.as_deref().filter(|s| !s.is_empty())
                .ok_or_else(|| "metrics eval record: required JSON object on stdin".to_string())?;
            let input: EvalInput = serde_json::from_slice(stdin)
                .map_err(|e| format!("metrics eval record: invalid input JSON: {}", e))?;
            let record = eval_journal::record(&req.root, input)?;
            Ok(json!({"ok": true, "eval": record}))
        }
        "list" => {
            let (harness, question) = filters(args, false)?;
            let list = eval_journal::list(&req.root, harness.as_deref(), question.as_deref())?;
            Ok(json!({"ok": true, "evals": list.evals, "invalid": list.invalid}))
        }
        other => Err(format!("metrics eval: unknown action \"{}\". Available: record, list", other)),
    }
}
