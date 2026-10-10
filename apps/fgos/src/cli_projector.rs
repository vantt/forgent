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
        fgos_convention::ConventionOperation::Check if all == !paths.is_empty() => {
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
