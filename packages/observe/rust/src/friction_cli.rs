//! CLI dispatch for `fgos friction <sub>`.

use crate::contract::{ObserveRequest, Subject};
use crate::flags::Flags;
use crate::friction::{self, invalid_input, FrictionInput, ResolveTarget};
use crate::record::types::SubjectRef;
use serde_json::json;

pub const AVAILABLE_SUBCOMMANDS: &[&str] = &[
    "record", "resolve", "list", "show", "rank", "classes", "ping",
];

/// Whether the verb appends to the friction store.
pub fn writes(req: &ObserveRequest) -> bool {
    matches!(req.sub.as_str(), "record" | "resolve")
}

fn required<'a>(flags: &'a Flags, flag: &str) -> Result<&'a str, String> {
    flags
        .value(flag)
        .ok_or_else(|| invalid_input(format!("missing required flag {flag}")))
}

fn subject_of(flags: &Flags) -> Result<Subject, String> {
    let subject = required(flags, "--subject")?;
    Subject::parse(subject).ok_or_else(|| {
        invalid_input(format!(
            "invalid subject \"{subject}\". Expected format kind:id"
        ))
    })
}

/// `--ref <kind>:<id>`.
fn ref_of(text: &str) -> Result<SubjectRef, String> {
    match text.split_once(':') {
        Some((kind, id)) if !kind.is_empty() && !id.is_empty() => Ok(SubjectRef {
            kind: kind.to_string(),
            id: id.to_string(),
        }),
        _ => Err(invalid_input(format!(
            "invalid ref \"{text}\". Expected format kind:id"
        ))),
    }
}

pub fn dispatch(req: &ObserveRequest) -> Result<serde_json::Value, String> {
    let parse = |values: &[&str], switches: &[&str], positional: bool| {
        Flags::parse(&req.args, values, switches, positional).map_err(invalid_input)
    };
    match req.sub.as_str() {
        "ping" => Ok(json!({
            "ok": true,
            "root": req.root.to_string_lossy()
        })),
        "record" => {
            let flags = parse(
                &[
                    "--subject",
                    "--kind",
                    "--ref",
                    "--layer",
                    "--error-class",
                    "--disposition",
                    "--producer",
                    "--attempts",
                    "--doc-type",
                    "--detail",
                ],
                &["--detail-stdin"],
                false,
            )?;
            let subject = subject_of(&flags)?;
            let detail = if flags.switch("--detail-stdin") {
                match &req.stdin {
                    Some(bytes) => String::from_utf8_lossy(bytes).trim().to_string(),
                    None => String::new(),
                }
            } else {
                flags.value("--detail").unwrap_or_default().to_string()
            };
            let refs = flags
                .values("--ref")
                .into_iter()
                .map(ref_of)
                .collect::<Result<Vec<_>, _>>()?;
            let input = FrictionInput {
                subject,
                kind: flags.value("--kind").map(str::to_string),
                refs,
                layer: required(&flags, "--layer")?.to_string(),
                error_class: required(&flags, "--error-class")?.to_string(),
                disposition: required(&flags, "--disposition")?.to_string(),
                detail,
                producer: required(&flags, "--producer")?.to_string(),
                attempts: flags.number::<u32>("--attempts").map_err(invalid_input)?,
                doc_type: flags.value("--doc-type").map(str::to_string),
            };
            friction::record(&req.root, input)
        }
        "resolve" => {
            let flags = parse(&["--subject", "--class", "--reason", "--by"], &[], false)?;
            let target = match (flags.value("--subject"), flags.value("--class")) {
                (Some(_), None) => ResolveTarget::Subject(subject_of(&flags)?),
                (None, Some(class)) => ResolveTarget::Class(class.to_string()),
                _ => {
                    return Err(invalid_input(
                        "resolve takes exactly one of --subject and --class",
                    ))
                }
            };
            friction::resolve(
                &req.root,
                target,
                required(&flags, "--reason")?,
                required(&flags, "--by")?,
            )
        }
        "list" => {
            let flags = parse(&["--kind", "--layer", "--since"], &[], false)?;
            friction::list(
                &req.root,
                flags.value("--kind"),
                flags.value("--layer"),
                flags.value("--since"),
            )
        }
        "show" => {
            let flags = parse(&["--subject"], &[], true)?;
            let subject = flags
                .value("--subject")
                .or(flags.positional())
                .ok_or_else(|| invalid_input("missing subject argument for show"))?;
            friction::show(&req.root, subject)
        }
        "rank" => {
            let flags = parse(&["--limit", "--bucket"], &[], false)?;
            let limit = flags.number::<usize>("--limit").map_err(invalid_input)?;
            let bucket = flags
                .value("--bucket")
                .map(friction::parse_bucket)
                .transpose()?;
            friction::rank_by_bucket(&req.root, limit, bucket)
        }
        "classes" => {
            parse(&[], &[], false)?;
            friction::classes(&req.root)
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
