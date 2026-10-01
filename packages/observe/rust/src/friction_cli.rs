//! CLI dispatch for `fgos friction <sub>` (Lane B).

use crate::contract::{LegacyFrictionSource, ObserveRequest, Subject};
use crate::friction::{self, FrictionInput};
use serde_json::json;

pub const AVAILABLE_SUBCOMMANDS: &[&str] = &[
    "record", "resolve", "list", "show", "rank", "ping", "migrate",
];

fn get_flag(args: &[String], flag: &str) -> Option<String> {
    let prefix = format!("{}=", flag);
    for (i, arg) in args.iter().enumerate() {
        if arg == flag && i + 1 < args.len() {
            return Some(args[i + 1].clone());
        }
        if let Some(val) = arg.strip_prefix(&prefix) {
            return Some(val.to_string());
        }
    }
    None
}

fn has_flag(args: &[String], flag: &str) -> bool {
    args.iter()
        .any(|a| a == flag || a.starts_with(&format!("{}=", flag)))
}

pub fn dispatch(
    req: &ObserveRequest,
    legacy_sources: &[Box<dyn LegacyFrictionSource>],
) -> Result<serde_json::Value, String> {
    match req.sub.as_str() {
        "ping" => Ok(json!({
            "ok": true,
            "root": req.root.to_string_lossy()
        })),
        "migrate" => {
            let count = friction::run_lazy_migration(&req.root, legacy_sources)?;
            Ok(json!({
                "ok": true,
                "migrated": count,
            }))
        }
        "record" => {
            let subject_str = get_flag(&req.args, "--subject")
                .ok_or_else(|| "missing required flag --subject".to_string())?;
            let subject = Subject::parse(&subject_str).ok_or_else(|| {
                format!(
                    "invalid subject \"{}\". Expected format kind:id",
                    subject_str
                )
            })?;

            let layer = get_flag(&req.args, "--layer")
                .ok_or_else(|| "missing required flag --layer".to_string())?;
            let error_class = get_flag(&req.args, "--error-class")
                .ok_or_else(|| "missing required flag --error-class".to_string())?;
            let disposition = get_flag(&req.args, "--disposition")
                .ok_or_else(|| "missing required flag --disposition".to_string())?;
            let producer = get_flag(&req.args, "--producer")
                .ok_or_else(|| "missing required flag --producer".to_string())?;

            let attempts = get_flag(&req.args, "--attempts")
                .and_then(|a| a.parse::<u32>().ok());
            let doc_type = get_flag(&req.args, "--doc-type");

            let detail = if has_flag(&req.args, "--detail-stdin") {
                match &req.stdin {
                    Some(bytes) => String::from_utf8_lossy(bytes).trim().to_string(),
                    None => String::new(),
                }
            } else {
                get_flag(&req.args, "--detail").unwrap_or_default()
            };

            let input = FrictionInput {
                subject,
                layer,
                error_class,
                disposition,
                detail,
                producer,
                attempts,
                doc_type,
            };

            friction::record(&req.root, input, legacy_sources)
        }
        "resolve" => {
            let subject_str = get_flag(&req.args, "--subject")
                .ok_or_else(|| "missing required flag --subject".to_string())?;
            let subject = Subject::parse(&subject_str).ok_or_else(|| {
                format!(
                    "invalid subject \"{}\". Expected format kind:id",
                    subject_str
                )
            })?;

            let reason = get_flag(&req.args, "--reason")
                .ok_or_else(|| "missing required flag --reason".to_string())?;
            let by = get_flag(&req.args, "--by")
                .ok_or_else(|| "missing required flag --by".to_string())?;

            friction::resolve(&req.root, subject, &reason, &by, legacy_sources)
        }
        "list" => {
            let kind = get_flag(&req.args, "--kind");
            let layer = get_flag(&req.args, "--layer");
            let since = get_flag(&req.args, "--since");

            friction::list(
                &req.root,
                kind.as_deref(),
                layer.as_deref(),
                since.as_deref(),
            )
        }
        "show" => {
            let subject_str = get_flag(&req.args, "--subject").or_else(|| {
                req.args
                    .iter()
                    .find(|a| !a.starts_with('-'))
                    .cloned()
            });

            let subject_str = subject_str
                .ok_or_else(|| "missing subject argument for show".to_string())?;

            friction::show(&req.root, &subject_str)
        }
        "rank" => {
            let limit = get_flag(&req.args, "--limit")
                .and_then(|l| l.parse::<usize>().ok());

            friction::rank(&req.root, limit)
        }
        "--help" | "-h" | "help" => Ok(json!({
            "ok": true,
            "command": "friction",
            "available_subcommands": AVAILABLE_SUBCOMMANDS,
        })),
        other => Err(format!(
            "unknown friction subcommand \"{}\". Available: {}",
            other,
            AVAILABLE_SUBCOMMANDS.join(", ")
        )),
    }
}
