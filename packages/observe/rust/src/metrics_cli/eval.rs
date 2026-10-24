//! CLI handler for `fgos metrics eval record|list`.

use crate::contract::ObserveRequest;
use crate::eval_journal::{self, EvalInput};
use crate::metrics_cli::parse_flags;
use serde_json::{json, Value};

/// `list` filters by `--harness` / `--question`; `record` takes no flags.
fn filters(args: &[String], record: bool) -> Result<(Option<String>, Option<String>), String> {
    let values: &[&str] = if record { &[] } else { &["--harness", "--question"] };
    let flags = parse_flags("eval", args, values, &[], false)?;
    for flag in values {
        if flags.value(flag).is_some_and(|value| value.trim().is_empty()) {
            return Err(format!("metrics eval: missing value for {flag}"));
        }
    }
    Ok((
        flags.value("--harness").map(str::to_owned),
        flags.value("--question").map(str::to_owned),
    ))
}

pub fn dispatch_eval(req: &ObserveRequest) -> Result<Value, String> {
    let (action, args) = req
        .args
        .split_first()
        .ok_or_else(|| "metrics eval: missing action. Available: record, list".to_string())?;
    match action.as_str() {
        "record" => {
            filters(args, true)?;
            let stdin = req
                .stdin
                .as_deref()
                .filter(|s| !s.is_empty())
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
        other => Err(format!(
            "metrics eval: unknown action \"{}\". Available: record, list",
            other
        )),
    }
}
