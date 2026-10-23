//! CLI projector for `apps/fgos`.
//!
//! Projects command-line arguments and route descriptors into kernel
//! `HostInvocation` and `OperationRequest` structs for native operations.

use fgos_host_runtime::{ContractRef, HostInvocation, OperationId, OperationRequest};
use std::ffi::OsString;

/// Projects a native CLI invocation into a `(HostInvocation, OperationRequest)` pair.
pub fn project_cli_invocation(
    operation_id_str: &str,
    args: &[OsString],
    root: std::path::PathBuf,
    stdin: Option<Vec<u8>>,
) -> Result<(HostInvocation, OperationRequest), String> {
    let operation = OperationId::parse(operation_id_str)
        .map_err(|e| format!("invalid operation id '{}': {}", operation_id_str, e))?;

    let (contract, input): (ContractRef, Box<dyn std::any::Any + Send>) = match operation.as_str() {
        "distribution.build.show" => {
            let include_runtime = args.iter().any(|a| a == "--runtime-json");
            (
                ContractRef::from_static("distribution.build.show.request", "1.0.0"),
                Box::new(fgos_distribution::BuildShowRequest { include_runtime }),
            )
        }
        "work.gate-bypass.show" => (
            ContractRef::from_static("work.gate-bypass.show.request", "1.0.0"),
            Box::new(fgos_work_state::GateBypassShowRequest::default()),
        ),
        "observe.metrics" => {
            let sub = if args.len() > 1 {
                args[1].to_string_lossy().to_string()
            } else {
                String::new()
            };
            let sub_args: Vec<String> = if args.len() > 2 {
                args[2..]
                    .iter()
                    .map(|a| a.to_string_lossy().to_string())
                    .collect()
            } else {
                Vec::new()
            };
            (
                ContractRef::from_static("observe.metrics.request", "1.0.0"),
                Box::new(fgos_observe::ObserveRequest {
                    operation: operation_id_str.to_string(),
                    sub,
                    args: sub_args,
                    root,
                    stdin,
                }),
            )
        }
        "observe.friction" => {
            let sub = if args.len() > 1 {
                args[1].to_string_lossy().to_string()
            } else {
                String::new()
            };
            let sub_args: Vec<String> = if args.len() > 2 {
                args[2..]
                    .iter()
                    .map(|a| a.to_string_lossy().to_string())
                    .collect()
            } else {
                Vec::new()
            };
            (
                ContractRef::from_static("observe.friction.request", "1.0.0"),
                Box::new(fgos_observe::ObserveRequest {
                    operation: operation_id_str.to_string(),
                    sub,
                    args: sub_args,
                    root,
                    stdin,
                }),
            )
        }
        "convention.query" => (
            ContractRef::from_static("convention.query.request", "1.0.0"),
            Box::new(project_convention_request(args, root)?),
        ),
        "identity.writer" => (
            ContractRef::from_static("identity.writer.request", "1.0.0"),
            Box::new(project_identity_request(args)?),
        ),
        "identity.read" => (
            ContractRef::from_static("identity.read.request", "1.0.0"),
            Box::new(project_identity_request(args)?),
        ),
        "identity.write" => (
            ContractRef::from_static("identity.write.request", "1.0.0"),
            Box::new(project_identity_request(args)?),
        ),
        crate::wiring::mailbox_verbs::SEND_OPERATION_ID => (
            ContractRef::from_static("mailbox.send.request", "1.0.0"),
            Box::new(crate::wiring::mailbox_verbs::project_mailbox_request(args)),
        ),
        crate::wiring::mailbox_verbs::INBOX_OPERATION_ID => (
            ContractRef::from_static("mailbox.inbox.request", "1.0.0"),
            Box::new(crate::wiring::mailbox_verbs::project_mailbox_request(args)),
        ),
        crate::wiring::mailbox_verbs::INBOX_CLAIM_OPERATION_ID => (
            ContractRef::from_static("mailbox.inbox.claim.request", "1.0.0"),
            Box::new(crate::wiring::mailbox_verbs::project_mailbox_request(args)),
        ),
        crate::wiring::mailbox_verbs::LIST_OPERATION_ID => (
            ContractRef::from_static("mailbox.list.request", "1.0.0"),
            Box::new(crate::wiring::mailbox_verbs::project_mailbox_request(args)),
        ),
        crate::wiring::mailbox_verbs::STATUS_OPERATION_ID => (
            ContractRef::from_static("mailbox.status.request", "1.0.0"),
            Box::new(crate::wiring::mailbox_verbs::project_mailbox_request(args)),
        ),
        other => {
            return Err(format!(
                "native CLI projector has no request mapping for '{}'",
                other
            ));
        }
    };

    let invocation = HostInvocation::new("cli");
    let request = OperationRequest::new(operation, contract, input);
    Ok((invocation, request))
}

/// The operation a native route runs for these arguments. A route names one
/// operation; `identity` fans out over three (`identity.writer` bare,
/// `identity.read`, `identity.write`) and `mailbox` over five
/// (`mailbox.send`, `mailbox.inbox`, `mailbox.inbox.claim` with `--claim`,
/// `mailbox.list`, `mailbox.status`),
/// and the arguments decide which.
pub fn native_operation_id(route_operation: &str, args: &[OsString]) -> Result<String, String> {
    if route_operation == fgos_identity::IDENTITY_OPERATION_ID {
        return Ok(project_identity_request(args)?.operation_id().to_string());
    }
    if route_operation == crate::wiring::mailbox_verbs::INBOX_OPERATION_ID {
        return Ok(crate::wiring::mailbox_verbs::project_mailbox_request(args)
            .operation_id()
            .to_string());
    }
    Ok(route_operation.to_string())
}

/// `fgos identity [--pid <n>] [--fgos-dir <dir>] [--json]`, `fgos identity
/// machine [--alias <name>] [--json]`, `fgos identity project [--init|--new]
/// [--handle <name>] [--json]`, `fgos identity session [--register] [--role
/// lead:<LANE>] [--take]`, `fgos identity resolve <query>`, `fgos identity list
/// [--project] [--prune]`, `fgos identity mint <kind> [--release <number>]
/// [--json]`. `--dir` is accepted and ignored on
/// every verb, because the shell integration appends it.
fn project_identity_request(args: &[OsString]) -> Result<fgos_identity::IdentityRequest, String> {
    let subcommand = args
        .get(1)
        .map(|value| value.to_string_lossy().into_owned())
        .filter(|value| !value.starts_with('-'));
    let mut index = if subcommand.is_some() { 2 } else { 1 };
    let (verb, allowed): (fgos_identity::Verb, &[&str]) = match subcommand.as_deref() {
        None | Some("writer") => (
            fgos_identity::Verb::Writer,
            &["--pid", "--fgos-dir", "--dir"],
        ),
        Some("machine") => (
            fgos_identity::Verb::Machine { alias: None },
            &["--alias", "--dir"],
        ),
        Some("session") => (
            fgos_identity::Verb::Session(fgos_identity::SessionAction::Read),
            &[
                "--pid",
                "--fgos-dir",
                "--register",
                "--role",
                "--drop-role",
                "--take",
                "--dir",
            ],
        ),
        Some("resolve") => (
            fgos_identity::Verb::Resolve {
                query: String::new(),
            },
            &["--dir"],
        ),
        Some("list") => (
            fgos_identity::Verb::List {
                project: false,
                prune: false,
            },
            &["--project", "--prune", "--dir"],
        ),
        Some("project") => (
            fgos_identity::Verb::Project(fgos_identity::ProjectAction::Read),
            &["--init", "--new", "--handle", "--dir"],
        ),
        Some("mint") => (
            fgos_identity::Verb::Mint {
                kind: String::new(),
                release: None,
            },
            &["--release", "--dir"],
        ),
        Some(other) => {
            return Err(format!(
                "unknown identity subcommand '{other}'. Available: {}",
                fgos_identity::AVAILABLE_SUBCOMMANDS.join(", ")
            ))
        }
    };
    let mut request = fgos_identity::IdentityRequest {
        verb,
        ..Default::default()
    };
    // `mint <kind>` and `resolve <query>`: one positional argument.
    match &mut request.verb {
        fgos_identity::Verb::Mint { kind, .. } => {
            let name = args
                .get(index)
                .map(|value| value.to_string_lossy().into_owned())
                .filter(|value| !value.starts_with('-'))
                .ok_or_else(|| {
                    format!(
                        "mint requires an id kind. Available: {}",
                        fgos_identity::KIND_NAMES.join(", ")
                    )
                })?;
            index += 1;
            *kind = name;
        }
        fgos_identity::Verb::Resolve { query } => {
            let name = args
                .get(index)
                .map(|value| value.to_string_lossy().into_owned())
                .filter(|value| !value.starts_with('-'))
                .ok_or_else(|| {
                    "resolve requires a handle or a role such as lead:MAIL".to_string()
                })?;
            index += 1;
            *query = name;
        }
        _ => {}
    }
    let mut register = false;
    let mut take = false;
    let mut role: Option<String> = None;
    let mut drop_role: Option<String> = None;
    let mut by_project = false;
    let mut prune = false;
    // `Some(fork)` once `--init` (false) or `--new` (true) was given.
    let mut mint: Option<bool> = None;
    let mut handle: Option<String> = None;
    while index < args.len() {
        let value = args[index].to_string_lossy().into_owned();
        index += 1;
        if value == "--json" {
            continue;
        }
        if [
            "--init",
            "--new",
            "--register",
            "--take",
            "--project",
            "--prune",
        ]
        .contains(&value.as_str())
        {
            if !allowed.contains(&value.as_str()) {
                return Err(format!("unknown identity option '{value}'"));
            }
            match value.as_str() {
                "--init" | "--new" => {
                    if mint.replace(value == "--new").is_some() {
                        return Err("--init and --new are exclusive and each given once".into());
                    }
                }
                "--register" => register = true,
                "--take" => take = true,
                "--project" => by_project = true,
                _ => prune = true,
            }
            continue;
        }
        let (flag, inline_value) = value
            .split_once('=')
            .map_or((value.as_str(), None), |(flag, value)| {
                (flag, Some(value.to_owned()))
            });
        if !allowed.contains(&flag) {
            return Err(format!("unknown identity option '{value}'"));
        }
        let flag_value = match inline_value {
            Some(value) => value,
            None => {
                let next = args
                    .get(index)
                    .map(|v| v.to_string_lossy().into_owned())
                    .ok_or_else(|| format!("{flag} requires a value"))?;
                index += 1;
                next
            }
        };
        match flag {
            "--dir" => {}
            "--pid" => {
                let pid = flag_value
                    .parse::<u32>()
                    .ok()
                    .filter(|pid| *pid > 0)
                    .ok_or_else(|| {
                        format!("--pid must be a positive integer, got '{flag_value}'")
                    })?;
                request.pid = Some(pid);
            }
            "--release" => {
                let number = flag_value
                    .parse::<u64>()
                    .ok()
                    .filter(|number| *number > 0)
                    .ok_or_else(|| {
                        format!("--release must be a positive number, got '{flag_value}'")
                    })?;
                if let fgos_identity::Verb::Mint { release, .. } = &mut request.verb {
                    *release = Some(number);
                }
            }
            "--role" => {
                if flag_value.is_empty() {
                    return Err("--role requires a value".into());
                }
                role = Some(flag_value);
            }
            "--drop-role" => {
                if flag_value.is_empty() {
                    return Err("--drop-role requires a value".into());
                }
                drop_role = Some(flag_value);
            }
            "--handle" => {
                if flag_value.is_empty() {
                    return Err("--handle requires a value".into());
                }
                handle = Some(flag_value);
            }
            "--alias" => {
                if flag_value.is_empty() {
                    return Err("--alias requires a value".into());
                }
                request.verb = fgos_identity::Verb::Machine {
                    alias: Some(flag_value),
                };
            }
            _ => {
                if flag_value.is_empty() {
                    return Err("--fgos-dir requires a value".into());
                }
                request.fgos_dir = Some(std::path::PathBuf::from(flag_value));
            }
        }
    }
    match &mut request.verb {
        fgos_identity::Verb::Session(action) => {
            if take && role.is_none() {
                return Err("--take needs --role".into());
            }
            if let Some(dropped) = drop_role {
                if register || role.is_some() {
                    return Err("--drop-role cannot be combined with --register or --role".into());
                }
                *action = fgos_identity::SessionAction::DropRole { role: dropped };
            } else if register || role.is_some() {
                *action = fgos_identity::SessionAction::Register { role, take };
            }
        }
        fgos_identity::Verb::List {
            project,
            prune: pruned,
        } => {
            *project = by_project;
            *pruned = prune;
        }
        _ => {}
    }
    if matches!(request.verb, fgos_identity::Verb::Project(_)) {
        request.verb = fgos_identity::Verb::Project(match (mint, handle) {
            (None, None) => fgos_identity::ProjectAction::Read,
            (None, Some(_)) => return Err("--handle needs --init or --new".into()),
            (Some(false), handle) => fgos_identity::ProjectAction::Init { handle },
            (Some(true), handle) => fgos_identity::ProjectAction::New { handle },
        });
    }
    Ok(request)
}

fn project_convention_request(
    args: &[OsString],
    root: std::path::PathBuf,
) -> Result<fgos_convention::ConventionRequest, String> {
    let subcommand = args
        .get(1)
        .and_then(|value| value.to_str())
        .ok_or_else(|| "convention requires a subcommand".to_string())?;
    let operation = match subcommand {
        "name" => fgos_convention::ConventionOperation::Name,
        "path" => fgos_convention::ConventionOperation::Path,
        "check" => fgos_convention::ConventionOperation::Check,
        "classify" => fgos_convention::ConventionOperation::Classify,
        _ => return Err(format!("unknown convention subcommand '{subcommand}'")),
    };
    let mut kind = None;
    let mut artifact_type = None;
    let mut slug = None;
    let mut at = None;
    let mut plan = None;
    let mut paths = Vec::new();
    let mut all = false;
    let mut positional = false;
    let mut index = 2;
    while index < args.len() {
        let value = args[index].to_string_lossy();
        if positional {
            paths.push(value.into_owned());
            index += 1;
            continue;
        }
        if value == "--" {
            positional = true;
            index += 1;
            continue;
        }
        if value == "--all" {
            all = true;
            index += 1;
            continue;
        }
        if value == "--json" {
            index += 1;
            continue;
        }
        let (flag, inline_value) = value
            .split_once('=')
            .map_or((value.as_ref(), None), |(flag, value)| (flag, Some(value)));
        if matches!(
            flag,
            "--kind" | "--type" | "--slug" | "--at" | "--plan" | "--dir"
        ) {
            let flag_value = if let Some(value) = inline_value {
                value.to_owned()
            } else {
                index += 1;
                args.get(index)
                    .and_then(|value| value.to_str())
                    .ok_or_else(|| format!("{flag} requires a value"))?
                    .to_owned()
            };
            match flag {
                "--kind" => kind = Some(flag_value),
                "--type" => artifact_type = Some(flag_value),
                "--slug" => slug = Some(flag_value),
                "--at" => at = Some(flag_value),
                "--plan" => plan = Some(flag_value),
                "--dir" => {}
                _ => unreachable!(),
            }
            index += 1;
            continue;
        }
        return Err(format!("unknown convention option '{value}'"));
    }
    match &operation {
        fgos_convention::ConventionOperation::Name | fgos_convention::ConventionOperation::Path
            if all || !paths.is_empty() =>
        {
            return Err(format!(
                "convention {subcommand} does not accept --all or positional paths"
            ));
        }
        fgos_convention::ConventionOperation::Check if all != paths.is_empty() => {
            return Err("convention check requires exactly one of --all or explicit paths".into());
        }
        fgos_convention::ConventionOperation::Classify if all || paths.len() != 1 => {
            return Err("convention classify requires exactly one explicit path".into());
        }
        _ => {}
    }
    let inferred_kind = kind.or_else(|| {
        artifact_type.as_ref().map(|value| {
            if matches!(value.as_str(), "plan" | "journal") {
                value.clone()
            } else {
                "report".to_string()
            }
        })
    });
    Ok(fgos_convention::ConventionRequest {
        operation,
        kind: inferred_kind,
        artifact_type,
        slug,
        at,
        plan,
        paths,
        all,
        root,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn identity_request_ignores_the_shell_appended_dir_flag() {
        let args: Vec<OsString> = ["identity", "--json", "--dir", "/repo", "--pid=42"]
            .iter()
            .map(OsString::from)
            .collect();
        let request = project_identity_request(&args).unwrap();
        assert_eq!(request.pid, Some(42));
        assert_eq!(request.fgos_dir, None);
    }

    #[test]
    fn identity_arguments_pick_the_operation_that_matches_their_effect() {
        let operation = |args: &[&str]| {
            let args: Vec<OsString> = args.iter().map(OsString::from).collect();
            native_operation_id("identity.writer", &args).unwrap()
        };
        assert_eq!(operation(&["identity", "--json"]), "identity.writer");
        assert_eq!(
            operation(&["identity", "writer", "--pid", "7"]),
            "identity.writer"
        );
        assert_eq!(
            operation(&["identity", "machine", "--json"]),
            "identity.read"
        );
        assert_eq!(
            operation(&["identity", "session", "--pid", "7"]),
            "identity.read"
        );
        assert_eq!(
            operation(&["identity", "machine", "--alias", "lab"]),
            "identity.write"
        );
        let args: Vec<OsString> = ["identity", "machine", "--pid", "7"]
            .iter()
            .map(OsString::from)
            .collect();
        assert!(native_operation_id("identity.writer", &args).is_err());
        assert_eq!(
            operation(&["identity", "project", "--json"]),
            "identity.read"
        );
        assert_eq!(
            operation(&["identity", "project", "--init"]),
            "identity.write"
        );
        assert_eq!(
            operation(&["identity", "project", "--handle", "app", "--new"]),
            "identity.write"
        );
        assert_eq!(
            operation(&["identity", "mint", "work", "--json"]),
            "identity.write"
        );
        assert_eq!(
            operation(&["identity", "resolve", "lead:MAIL"]),
            "identity.read"
        );
        assert_eq!(
            operation(&["identity", "list", "--project"]),
            "identity.read"
        );
        assert_eq!(
            operation(&["identity", "list", "--prune"]),
            "identity.write"
        );
        assert_eq!(
            operation(&["identity", "session", "--register"]),
            "identity.write"
        );
        assert_eq!(
            operation(&["identity", "session", "--role", "lead:MAIL", "--take"]),
            "identity.write"
        );
    }

    #[test]
    fn identity_directory_flags_belong_to_their_verbs_only() {
        let request = |args: &[&str]| {
            let args: Vec<OsString> = args.iter().map(OsString::from).collect();
            project_identity_request(&args)
        };
        let registered = request(&[
            "identity",
            "session",
            "--role=lead:MAIL",
            "--take",
            "--json",
        ])
        .unwrap();
        assert_eq!(
            registered.verb,
            fgos_identity::Verb::Session(fgos_identity::SessionAction::Register {
                role: Some("lead:MAIL".into()),
                take: true
            })
        );
        assert_eq!(
            request(&["identity", "resolve", "claude-4f2a@fg", "--json"])
                .unwrap()
                .verb,
            fgos_identity::Verb::Resolve {
                query: "claude-4f2a@fg".into()
            }
        );
        assert_eq!(
            request(&["identity", "list", "--project", "--prune"])
                .unwrap()
                .verb,
            fgos_identity::Verb::List {
                project: true,
                prune: true
            }
        );
        assert!(
            request(&["identity", "session", "--take"]).is_err(),
            "--take needs --role"
        );
        assert!(request(&["identity", "resolve"]).is_err());
        assert!(request(&["identity", "machine", "--register"]).is_err());
        assert!(request(&["identity", "list", "--role", "lead:MAIL"]).is_err());
    }

    #[test]
    fn identity_mint_takes_a_kind_and_an_optional_release_number() {
        let request = |args: &[&str]| {
            let args: Vec<OsString> = args.iter().map(OsString::from).collect();
            project_identity_request(&args)
        };
        let minted = request(&["identity", "mint", "d-adr", "--release", "73", "--json"]).unwrap();
        assert_eq!(
            minted.verb,
            fgos_identity::Verb::Mint {
                kind: "d-adr".into(),
                release: Some(73)
            }
        );
        let message = request(&["identity", "mint", "--json"]).unwrap_err();
        assert!(
            message.contains("requires an id kind") && message.contains("d-adr"),
            "{message}"
        );
        assert!(request(&["identity", "mint", "d-adr", "--release", "0"]).is_err());
        assert!(request(&["identity", "machine", "--release", "3"]).is_err());
    }

    #[test]
    fn test_project_cli_invocation_for_version() {
        let (invocation, request) = project_cli_invocation(
            "distribution.build.show",
            &[],
            std::path::PathBuf::from("."),
            None,
        )
        .unwrap();
        assert_eq!(invocation.host_kind, "cli");
        assert_eq!(request.operation.as_str(), "distribution.build.show");
        assert_eq!(request.contract.id(), "distribution.build.show.request");
        assert_eq!(request.contract.version(), "1.0.0");
        assert!(request
            .input
            .downcast_ref::<fgos_distribution::BuildShowRequest>()
            .is_some());
    }

    #[test]
    fn test_project_cli_invocation_for_gate_bypass() {
        let (invocation, request) = project_cli_invocation(
            "work.gate-bypass.show",
            &[],
            std::path::PathBuf::from("."),
            None,
        )
        .unwrap();
        assert_eq!(invocation.host_kind, "cli");
        assert_eq!(request.operation.as_str(), "work.gate-bypass.show");
        assert_eq!(request.contract.id(), "work.gate-bypass.show.request");
        assert_eq!(request.contract.version(), "1.0.0");
        assert!(request
            .input
            .downcast_ref::<fgos_work_state::GateBypassShowRequest>()
            .is_some());
    }

    #[test]
    fn test_project_cli_invocation_for_metrics() {
        let args = vec![OsString::from("metrics"), OsString::from("ping")];
        let (invocation, request) = project_cli_invocation(
            "observe.metrics",
            &args,
            std::path::PathBuf::from("/test"),
            None,
        )
        .unwrap();
        assert_eq!(invocation.host_kind, "cli");
        assert_eq!(request.operation.as_str(), "observe.metrics");
        let req = request
            .input
            .downcast_ref::<fgos_observe::ObserveRequest>()
            .unwrap();
        assert_eq!(req.sub, "ping");
        assert_eq!(req.root, std::path::PathBuf::from("/test"));
    }

    #[test]
    fn projects_convention_name_into_a_typed_request() {
        let args = [
            "convention",
            "name",
            "--kind",
            "report",
            "--type",
            "audit",
            "--slug",
            "Harness Audit",
            "--at",
            "2026-10-06T14:15:00+07:00",
            "--json",
        ]
        .map(OsString::from);
        let (_, request) = project_cli_invocation(
            "convention.query",
            &args,
            std::path::PathBuf::from("/repo"),
            None,
        )
        .unwrap();
        let request = request
            .input
            .downcast_ref::<fgos_convention::ConventionRequest>()
            .unwrap();
        assert!(matches!(
            &request.operation,
            fgos_convention::ConventionOperation::Name
        ));
        assert_eq!(request.kind.as_deref(), Some("report"));
        assert_eq!(request.artifact_type.as_deref(), Some("audit"));
        assert_eq!(request.slug.as_deref(), Some("Harness Audit"));
        assert_eq!(request.root, std::path::PathBuf::from("/repo"));
    }

    #[test]
    fn convention_check_keeps_dash_prefixed_paths_after_separator() {
        let args = [
            "convention",
            "check",
            "--dir",
            "/repo",
            "--",
            "plans/reports/-draft.md",
        ]
        .map(OsString::from);
        let (_, request) = project_cli_invocation(
            "convention.query",
            &args,
            std::path::PathBuf::from("/repo"),
            None,
        )
        .unwrap();
        let request = request
            .input
            .downcast_ref::<fgos_convention::ConventionRequest>()
            .unwrap();
        assert_eq!(request.paths, ["plans/reports/-draft.md"]);
        assert!(!request.all);
    }

    #[test]
    fn convention_check_requires_exactly_one_input_mode() {
        let all_args = ["convention", "check", "--all"].map(OsString::from);
        let (_, request) = project_cli_invocation(
            "convention.query",
            &all_args,
            std::path::PathBuf::from("/repo"),
            None,
        )
        .unwrap();
        let request = request
            .input
            .downcast_ref::<fgos_convention::ConventionRequest>()
            .unwrap();
        assert!(request.all);
        assert!(request.paths.is_empty());

        let no_mode = ["convention", "check"].map(OsString::from);
        assert!(project_cli_invocation(
            "convention.query",
            &no_mode,
            std::path::PathBuf::from("/repo"),
            None,
        )
        .is_err());

        let both_modes =
            ["convention", "check", "--all", "--", "plans/reports/x.md"].map(OsString::from);
        assert!(project_cli_invocation(
            "convention.query",
            &both_modes,
            std::path::PathBuf::from("/repo"),
            None,
        )
        .is_err());
    }
}
