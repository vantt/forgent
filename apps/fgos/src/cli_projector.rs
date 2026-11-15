//! CLI projector for `apps/fgos`.
//!
//! Projects command-line arguments and route descriptors into kernel
//! `HostInvocation` and `OperationRequest` structs for native operations.

use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, HostInvocation, OperationId, OperationRequest,
};
use std::ffi::OsString;
use std::path::PathBuf;

/// Why a call could not be projected into a request. A verb that reads the shared parser answers a malformed
/// call with its category (`Refused`: the Node CLI's exit status and text); the readers that predate it keep
/// answering a plain message (`Failed`: exits as an unexpected failure).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ProjectError {
    Refused(CategorisedRefusal),
    Failed(String),
}

impl From<String> for ProjectError {
    fn from(message: String) -> Self {
        Self::Failed(message)
    }
}

impl From<CategorisedRefusal> for ProjectError {
    fn from(refusal: CategorisedRefusal) -> Self {
        Self::Refused(refusal)
    }
}

/// Projects a native CLI invocation into a `(HostInvocation, OperationRequest)` pair.
/// `root` is the project the invocation doors resolved; only the operations that read
/// a project (observe, convention, config) consume it, so a refusal there never
/// stops a verb that needs no project.
pub fn project_cli_invocation(
    operation_id_str: &str,
    args: &[OsString],
    root: Result<PathBuf, String>,
    stdin: Option<Vec<u8>>,
) -> Result<(HostInvocation, OperationRequest), ProjectError> {
    let operation = OperationId::parse(operation_id_str)
        .map_err(|e| format!("invalid operation id '{}': {}", operation_id_str, e))?;

    let (contract, input): (ContractRef, Box<dyn std::any::Any + Send>) = match operation.as_str() {
        "distribution.build.show" => {
            let include_runtime = crate::routing::Call::new(args)
                .flags()
                .flag("runtime-json")
                .is_some();
            (
                ContractRef::from_static("distribution.build.show.request", "1.0.0"),
                Box::new(fgos_distribution::BuildShowRequest { include_runtime }),
            )
        }
        "work.gate-bypass.show" => (
            ContractRef::from_static("work.gate-bypass.show.request", "1.0.0"),
            Box::new(fgos_work_state::GateBypassShowRequest::default()),
        ),
        "observe.metrics" | "observe.friction" => {
            let call = crate::routing::Call::new(args);
            let sub = call.sub_word().unwrap_or_default().to_owned();
            (
                ContractRef::new(format!("{operation_id_str}.request"), "1.0.0"),
                Box::new(fgos_observe::ObserveRequest {
                    operation: operation_id_str.to_string(),
                    sub,
                    args: call.without_sub(),
                    root: root?,
                    stdin,
                }),
            )
        }
        "convention.query" => (
            ContractRef::from_static("convention.query.request", "1.0.0"),
            Box::new(project_convention_request(args, root?)?),
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
        crate::wiring::session::START_OPERATION_ID
        | crate::wiring::session::END_OPERATION_ID
        | crate::wiring::session::LIST_OPERATION_ID
        | crate::wiring::session::GC_OPERATION_ID => (
            ContractRef::new(format!("{operation_id_str}.request"), "1.0.0"),
            Box::new(crate::wiring::session::project_session_args(args)?),
        ),
        crate::wiring::lock_fence::OPERATION_ID => (
            ContractRef::from_static("holder-lock.fence.request", "1.0.0"),
            Box::new(crate::wiring::lock_fence::project_fence_request(
                args, root,
            )?),
        ),
        "config.read" | "config.write" => (
            ContractRef::from_static(
                if operation.as_str() == "config.read" {
                    "config.read.request"
                } else {
                    "config.write.request"
                },
                "1.0.0",
            ),
            Box::new(project_config_request(args, root?)?),
        ),
        "gateway.start" | "gateway.stop" | "gateway.status" => (
            ContractRef::new(format!("{operation_id_str}.request"), "1.0.0"),
            Box::new(crate::wiring::gateway_control::project_gateway_request(
                args, root,
            )?),
        ),
        crate::wiring::events::SYNC_OPERATION_ID
        | crate::wiring::events::STATUS_OPERATION_ID
        | crate::wiring::events::SEAL_OPERATION_ID
        | crate::wiring::events::EXPORT_OPERATION_ID => (
            ContractRef::new(format!("{operation_id_str}.request"), "1.0.0"),
            Box::new(project_events_request(args, root?)?),
        ),
        crate::wiring::git_incidents::STATUS_OPERATION_ID => (
            ContractRef::from_static("git.status.request", "1.0.0"),
            Box::new(crate::wiring::git_incidents::project_git_request(args)),
        ),
        crate::wiring::git_incidents::RECOVER_OPERATION_ID => (
            ContractRef::from_static("git.recover.request", "1.0.0"),
            Box::new(crate::wiring::git_incidents::project_git_request(args)),
        ),
        crate::wiring::lock_status::OPERATION_ID => (
            ContractRef::from_static("holder-lock.status.request", "1.0.0"),
            Box::new(crate::wiring::lock_status::project_lock_status_request(
                args,
            )),
        ),
        crate::wiring::doctor::OPERATION_ID => (
            ContractRef::from_static("doctor.run.request", "1.0.0"),
            Box::new(crate::wiring::doctor::project_doctor_request(args, root)?),
        ),
        crate::wiring::wire_agents::OPERATION_ID => (
            ContractRef::from_static("wire-agents.run.request", "1.0.0"),
            Box::new(crate::wiring::wire_agents::project_wire_agents_request(
                args, root,
            )?),
        ),
        other => {
            return Err(format!(
                "native CLI projector has no request mapping for '{}'",
                other
            )
            .into());
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
/// `mailbox.list`, `mailbox.status`) and `git` over two (`git.status`, `git.recover`),
/// and the arguments decide which.
pub fn native_operation_id(
    route_operation: &str,
    args: &[OsString],
) -> Result<String, ProjectError> {
    if route_operation == fgos_identity::IDENTITY_OPERATION_ID {
        return Ok(project_identity_request(args)?.operation_id().to_string());
    }
    if route_operation == crate::wiring::mailbox_verbs::INBOX_OPERATION_ID {
        return Ok(crate::wiring::mailbox_verbs::project_mailbox_request(args)
            .operation_id()
            .to_string());
    }
    if route_operation == crate::wiring::session::LIST_OPERATION_ID {
        return Ok(crate::wiring::session::project_session_args(args)?
            .operation_id()
            .to_string());
    }
    if route_operation == crate::wiring::git_incidents::STATUS_OPERATION_ID {
        return Ok(crate::wiring::git_incidents::project_git_request(args)
            .operation_id()
            .to_string());
    }
    if route_operation == fgos_config::provider::CONFIG_READ_OPERATION_ID {
        let request = project_config_request(args, std::path::PathBuf::new())?;
        return Ok(request.operation_id().to_string());
    }
    if route_operation == crate::wiring::gateway_control::STATUS_OPERATION_ID {
        let request =
            crate::wiring::gateway_control::project_gateway_request(args, Err(String::new()))?;
        return Ok(request.sub.operation_id().to_string());
    }
    if route_operation == crate::wiring::events::STATUS_OPERATION_ID {
        let request = project_events_request(args, std::path::PathBuf::new())?;
        return Ok(request.operation_id().to_string());
    }
    Ok(route_operation.to_string())
}

/// `fgos events sync [--remote <name>] [--no-push] [--opportunistic]`, `status [--remote <name>]`, `seal --stream
/// <name> [--history <file>]`, `export --out <dir> [--stream <name>] [--since <cursor json>]`, read only through the
/// shared parser. A flag that takes a value and a flag that takes none are each refused when given the other
/// way: the Node CLI hands the wrong shape to the store and fails there. Whether the call is a seal or publish
/// child is the registry's declaration, the same one the invocation doors read.
fn project_events_request(
    args: &[OsString],
    root: std::path::PathBuf,
) -> Result<crate::wiring::events::EventsRequest, ProjectError> {
    use crate::wiring::events::{EventsRequest, Verb};
    use fgos_host_runtime::cli_args::{FlagScalar, FlagValue, ParsedArgs};
    let call = crate::routing::Call::new(args);
    let parsed: &ParsedArgs = call.parsed();
    let sub = parsed.positional.first().map(String::as_str).unwrap_or("");
    let refuse =
        |message: String| ProjectError::Refused(CategorisedRefusal::new("validation", message));
    let flag = |name: &str| parsed.flag(name.trim_start_matches("--"));
    let text = |name: &str| match flag(name) {
        Some(FlagValue::One(FlagScalar::Str(text))) => Some(text.clone()),
        _ => None,
    };
    let value = |name: &str| -> Result<Option<String>, ProjectError> {
        match flag(name) {
            None => Ok(None),
            Some(FlagValue::One(FlagScalar::Str(text))) => Ok(Some(text.clone())),
            Some(_) => Err(refuse(format!("events {sub} {name} needs a value"))),
        }
    };
    let switch = |name: &str| -> Result<bool, ProjectError> {
        match flag(name) {
            None => Ok(false),
            Some(FlagValue::One(FlagScalar::Bool)) => Ok(true),
            Some(_) => Err(refuse(format!("events {sub} {name} takes no value"))),
        }
    };
    let verb = match sub {
        "sync" => Verb::Sync {
            remote: value("--remote")?,
            no_push: switch("--no-push")?,
            opportunistic: switch("--opportunistic")?,
        },
        "status" => Verb::Status {
            remote: value("--remote")?,
        },
        "seal" => Verb::Seal {
            stream: text("--stream"),
            history: match flag("--history") {
                None => None,
                Some(FlagValue::One(FlagScalar::Str(text))) => Some(text.clone()),
                // A bare `--history` names no file: refused as any path outside the cache is.
                Some(_) => Some(String::new()),
            },
        },
        "export" => Verb::Export {
            out: text("--out"),
            stream: value("--stream")?,
            since: value("--since")?,
        },
        other => {
            return Err(refuse(format!(
                "unknown events subcommand \"{other}\". Available: {}",
                crate::wiring::events::AVAILABLE_SUBCOMMANDS.join(", ")
            )))
        }
    };
    let detached = crate::routing::command_routes()
        .get("events")
        .is_some_and(|route| crate::routing::declared(&route.event_store_child, &call));
    Ok(EventsRequest {
        root,
        verb,
        detached,
    })
}

/// `fgos config show|standard [--path <p>]`, `explain <path>`, `check`, `set <path> <value>
/// [--reason <text>] [--global]`, `unset <path> [--reason <text>] [--global]
/// [--acknowledge-comment-loss]`, `patch <file> [--reason <text>] [--global]`, `migrate [--dry-run]
/// [--accept-machine-overrides]` or `migrate --global [--finish [--machine-checked] | --convert [--machine-checked]] [--dry-run]`,
/// `refresh-docs [--global]`. A path is in the text form of YAML Document. `--dir` and `--json`
/// are accepted on every verb; the reason is optional here because a write that changes nothing
/// needs none (the crate refuses a missing one when it is needed).
fn project_config_request(
    args: &[OsString],
    root: std::path::PathBuf,
) -> Result<fgos_config::provider::ConfigRequest, String> {
    use fgos_config::provider::Verb;
    let call = crate::routing::Call::new(args);
    let sub = call
        .sub_word()
        .ok_or_else(|| "config requires a subcommand".to_string())?;
    let (valued, switches, arguments): (&[&str], &[&str], usize) = match sub {
        "show" | "standard" => (&["path"], &[], 0),
        "check" => (&[], &[], 0),
        "explain" => (&[], &[], 1),
        "set" => (&["reason"], &["global"], 2),
        "unset" => (&["reason"], &["global", "acknowledge-comment-loss"], 1),
        "patch" => (&["reason"], &["global"], 1),
        "migrate" => (
            &[],
            &[
                "dry-run",
                "global",
                "finish",
                "convert",
                "machine-checked",
                "accept-machine-overrides",
            ],
            0,
        ),
        "refresh-docs" => (&[], &["global"], 0),
        other => {
            return Err(format!(
                "unknown config subcommand '{other}'. Available: {}",
                fgos_config::provider::AVAILABLE_SUBCOMMANDS.join(", ")
            ))
        }
    };
    let own: Vec<&str> = valued.iter().chain(switches).copied().collect();
    if let Some(flag) = call.flag_outside(&own) {
        return Err(format!("unknown config option '--{flag}'"));
    }
    let has = |flag: &str| call.switch(flag);
    let global = has("global")?;
    let positional = call.arguments();
    if positional.len() != arguments {
        return Err(format!(
            "config {sub} takes {arguments} argument(s), got {}",
            positional.len()
        ));
    }
    let mut path = call.value("path")?;
    let reason = call.value("reason")?.unwrap_or_default();
    let mut arg = positional.into_iter();
    let mut next = || arg.next().unwrap_or_default();
    let verb = match sub {
        "show" => Verb::Show { path: path.take() },
        "standard" => Verb::Standard { path: path.take() },
        "check" => Verb::Check,
        "explain" => Verb::Explain { path: next() },
        "set" => Verb::Set {
            path: next(),
            value: next(),
            reason,
            global,
        },
        "unset" => Verb::Unset {
            path: next(),
            reason,
            global,
            acknowledge: has("acknowledge-comment-loss")?,
        },
        "patch" => Verb::Patch {
            file: next().into(),
            reason,
            global,
        },
        "refresh-docs" => Verb::RefreshDocs { global },
        _ => {
            let (finish, convert) = (has("finish")?, has("convert")?);
            let (machine_checked, accept) =
                (has("machine-checked")?, has("accept-machine-overrides")?);
            if finish && !global {
                return Err("--finish needs --global".into());
            }
            if convert && (!global || finish) {
                return Err("--convert needs --global and goes without --finish".into());
            }
            if machine_checked && !finish && !convert {
                return Err("--machine-checked needs --finish or --convert".into());
            }
            if accept && global {
                return Err(
                    "--accept-machine-overrides is for the project migration, not --global".into(),
                );
            }
            Verb::Migrate {
                global,
                finish,
                convert,
                machine_checked,
                accept_machine_overrides: accept,
                dry_run: has("dry-run")?,
            }
        }
    };
    Ok(fgos_config::provider::ConfigRequest { root, verb })
}

/// `fgos identity [--pid <n>] [--fgos-dir <dir>] [--json]`, `fgos identity
/// machine [--alias <name>] [--json]`, `fgos identity project [--init|--new]
/// [--handle <name>] [--json]`, `fgos identity session [--register] [--role
/// lead:<LANE>|work:<name>] [--take]`, `fgos identity resolve <query>`, `fgos identity list
/// [--project] [--prune] [--machine <handle|id>]`, `fgos identity pins [--forget <machine-id> | --confirm <machine-id> --fingerprint <fp>]`, `fgos identity mint <kind> [--release <number>]
/// [--json]`. `--dir` is accepted and ignored on
/// every verb, because the shell integration appends it.
fn project_identity_request(args: &[OsString]) -> Result<fgos_identity::IdentityRequest, String> {
    let call = crate::routing::Call::new(args);
    let subcommand = call.sub_word();
    let (verb, allowed): (fgos_identity::Verb, &[&str]) = match subcommand {
        None | Some("writer") => (fgos_identity::Verb::Writer, &["pid", "fgos-dir"]),
        Some("machine") => (fgos_identity::Verb::Machine { alias: None }, &["alias"]),
        Some("session") => (
            fgos_identity::Verb::Session(fgos_identity::SessionAction::Read),
            &["pid", "fgos-dir", "register", "role", "drop-role", "take"],
        ),
        Some("resolve") => (
            fgos_identity::Verb::Resolve {
                query: String::new(),
            },
            &[],
        ),
        Some("list") => (
            fgos_identity::Verb::List {
                project: false,
                prune: false,
                machine: None,
            },
            &["project", "prune", "machine"],
        ),
        Some("project") => (
            fgos_identity::Verb::Project(fgos_identity::ProjectAction::Read),
            &["init", "new", "handle"],
        ),
        Some("mint") => (
            fgos_identity::Verb::Mint {
                kind: String::new(),
                release: None,
            },
            &["release"],
        ),
        Some("pins") => (
            fgos_identity::Verb::Pins(fgos_identity::PinsAction::List),
            &["forget", "confirm", "fingerprint"],
        ),
        Some(other) => {
            return Err(format!(
                "unknown identity subcommand '{other}'. Available: {}",
                fgos_identity::AVAILABLE_SUBCOMMANDS.join(", ")
            ))
        }
    };
    if let Some(flag) = call.flag_outside(allowed) {
        return Err(format!("unknown identity option '--{flag}'"));
    }
    let mut request = fgos_identity::IdentityRequest {
        verb,
        ..Default::default()
    };
    // `mint <kind>` and `resolve <query>`: one positional argument; no other verb takes any.
    let mut positional = call.arguments().into_iter();
    match &mut request.verb {
        fgos_identity::Verb::Mint { kind, .. } => {
            *kind = positional.next().ok_or_else(|| {
                format!(
                    "mint requires an id kind. Available: {}",
                    fgos_identity::KIND_NAMES.join(", ")
                )
            })?;
        }
        fgos_identity::Verb::Resolve { query } => {
            *query = positional.next().ok_or_else(|| {
                "resolve requires a handle or a role such as lead:MAIL or work:<name>".to_string()
            })?;
        }
        _ => {}
    }
    if let Some(extra) = positional.next() {
        return Err(format!("unknown identity option '{extra}'"));
    }
    // A value that is given must be non-empty, and says what it was for when it is not.
    let named = |flag: &str, empty: &str| -> Result<Option<String>, String> {
        match call.value(flag)? {
            Some(value) if value.is_empty() => Err(format!("--{flag} requires {empty}")),
            other => Ok(other),
        }
    };
    let (init, new) = (call.switch("init")?, call.switch("new")?);
    if init && new {
        return Err("--init and --new are exclusive".into());
    }
    let register = call.switch("register")?;
    let take = call.switch("take")?;
    let by_project = call.switch("project")?;
    let prune = call.switch("prune")?;
    let role = named("role", "a value")?;
    let drop_role = named("drop-role", "a value")?;
    let machine_filter = named("machine", "a machine handle or id")?;
    let handle = named("handle", "a value")?;
    let forget = named("forget", "a machine id")?;
    let confirm = named("confirm", "a machine id")?;
    let fingerprint = named("fingerprint", "a value")?;
    if let Some(alias) = named("alias", "a value")? {
        request.verb = fgos_identity::Verb::Machine { alias: Some(alias) };
    }
    if let Some(dir) = named("fgos-dir", "a value")? {
        request.fgos_dir = Some(std::path::PathBuf::from(dir));
    }
    if let Some(flag_value) = call.value("pid")? {
        let pid = flag_value
            .parse::<u32>()
            .ok()
            .filter(|pid| *pid > 0)
            .ok_or_else(|| format!("--pid must be a positive integer, got '{flag_value}'"))?;
        request.pid = Some(pid);
    }
    if let Some(flag_value) = call.value("release")? {
        let number = flag_value
            .parse::<u64>()
            .ok()
            .filter(|number| *number > 0)
            .ok_or_else(|| format!("--release must be a positive number, got '{flag_value}'"))?;
        if let fgos_identity::Verb::Mint { release, .. } = &mut request.verb {
            *release = Some(number);
        }
    }
    let mint = match (init, new) {
        (false, false) => None,
        (init, _) => Some(!init),
    };
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
            machine,
        } => {
            *project = by_project;
            *pruned = prune;
            *machine = machine_filter;
        }
        _ => {}
    }
    if matches!(request.verb, fgos_identity::Verb::Pins(_)) {
        request.verb =
            fgos_identity::Verb::Pins(match (forget, confirm, fingerprint) {
                (None, None, None) => fgos_identity::PinsAction::List,
                (Some(machine_id), None, None) => fgos_identity::PinsAction::Forget { machine_id },
                (Some(_), Some(_), _) => return Err("--forget and --confirm are exclusive".into()),
                (Some(_), None, Some(_)) => return Err("--fingerprint goes with --confirm".into()),
                (None, None, Some(_)) => return Err("--fingerprint needs --confirm".into()),
                (None, Some(_), None) => return Err(
                    "--confirm requires --fingerprint <SHA256:...>, the fingerprint you compared"
                        .into(),
                ),
                (None, Some(machine_id), Some(fingerprint)) => fgos_identity::PinsAction::Confirm {
                    machine_id,
                    fingerprint,
                },
            });
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
    let call = crate::routing::Call::new(args);
    let subcommand = call
        .sub_word()
        .ok_or_else(|| "convention requires a subcommand".to_string())?;
    let operation = match subcommand {
        "name" => fgos_convention::ConventionOperation::Name,
        "path" => fgos_convention::ConventionOperation::Path,
        "check" => fgos_convention::ConventionOperation::Check,
        "classify" => fgos_convention::ConventionOperation::Classify,
        _ => return Err(format!("unknown convention subcommand '{subcommand}'")),
    };
    if let Some(flag) = call.flag_outside(&["kind", "type", "slug", "at", "plan", "all"]) {
        return Err(format!("unknown convention option '--{flag}'"));
    }
    // Explicit paths come after a bare `--`; a word before it is not a flag, so it is not understood.
    if let Some(word) = call.flags().positional.get(1) {
        return Err(format!("unknown convention option '{word}'"));
    }
    let kind = call.value("kind")?;
    let artifact_type = call.value("type")?;
    let slug = call.value("slug")?;
    let at = call.value("at")?;
    let plan = call.value("plan")?;
    let all = call.switch("all")?;
    let paths = call.arguments();
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
        let args: Vec<OsString> = ["identity", "--json", "--dir", "/repo", "--pid", "42"]
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
            "--role",
            "lead:MAIL",
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
                prune: true,
                machine: None
            }
        );
        assert_eq!(
            request(&["identity", "list", "--machine", "bravo"])
                .unwrap()
                .verb,
            fgos_identity::Verb::List {
                project: false,
                prune: false,
                machine: Some("bravo".into())
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
    fn test_project_cli_invocation_for_version_needs_no_project() {
        let (invocation, request) = project_cli_invocation(
            "distribution.build.show",
            &[],
            Err("not inside an fgOS project".to_string()),
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
            Ok(std::path::PathBuf::from(".")),
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
            Ok(std::path::PathBuf::from("/test")),
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
            Ok(std::path::PathBuf::from("/repo")),
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
            Ok(std::path::PathBuf::from("/repo")),
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
            Ok(std::path::PathBuf::from("/repo")),
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
            Ok(std::path::PathBuf::from("/repo")),
            None,
        )
        .is_err());

        let both_modes =
            ["convention", "check", "--all", "--", "plans/reports/x.md"].map(OsString::from);
        assert!(project_cli_invocation(
            "convention.query",
            &both_modes,
            Ok(std::path::PathBuf::from("/repo")),
            None,
        )
        .is_err());
    }

    fn config(args: &[&str]) -> Result<fgos_config::provider::ConfigRequest, String> {
        let args: Vec<OsString> = args.iter().map(OsString::from).collect();
        project_config_request(&args, std::path::PathBuf::from("/repo"))
    }

    #[test]
    fn config_read_verbs_map_their_arguments_and_run_as_a_read() {
        use fgos_config::provider::Verb;
        assert_eq!(
            config(&["config", "show", "--json", "--dir", "/x", "--path", "a.b[0]"])
                .unwrap()
                .verb,
            Verb::Show {
                path: Some("a.b[0]".into())
            }
        );
        assert_eq!(
            config(&["config", "standard", "--path", "a"]).unwrap().verb,
            Verb::Standard {
                path: Some("a".into())
            }
        );
        assert_eq!(
            config(&["config", "explain", "gateBypass.level"])
                .unwrap()
                .verb,
            Verb::Explain {
                path: "gateBypass.level".into()
            }
        );
        assert_eq!(config(&["config", "check"]).unwrap().verb, Verb::Check);
        for args in [
            &["config", "show"][..],
            &["config", "explain", "a"],
            &["config", "check"],
            &["config", "migrate", "--dry-run"],
        ] {
            let args: Vec<OsString> = args.iter().map(OsString::from).collect();
            assert_eq!(
                native_operation_id("config.read", &args).unwrap(),
                "config.read"
            );
        }
        let write: Vec<OsString> = ["config", "migrate"].iter().map(OsString::from).collect();
        assert_eq!(
            native_operation_id("config.read", &write).unwrap(),
            "config.write"
        );
        assert!(config(&["config", "show", "extra"]).is_err());
        assert!(config(&["config", "explain"]).is_err());
        assert!(config(&["config", "show", "--bogus"]).is_err());
        assert!(config(&["config", "frobnicate"]).is_err());
    }

    #[test]
    fn config_write_verbs_map_their_arguments_and_refuse_incompatible_flags() {
        use fgos_config::provider::Verb;
        assert_eq!(
            config(&["config", "set", "a.b", "[x, y]", "--reason", "why not", "--global"])
                .unwrap()
                .verb,
            Verb::Set {
                path: "a.b".into(),
                value: "[x, y]".into(),
                reason: "why not".into(),
                global: true
            }
        );
        assert_eq!(
            config(&["config", "unset", "a.b", "--acknowledge-comment-loss"])
                .unwrap()
                .verb,
            Verb::Unset {
                path: "a.b".into(),
                reason: String::new(),
                global: false,
                acknowledge: true
            }
        );
        assert_eq!(
            config(&["config", "patch", "p.yaml", "--reason", "r"])
                .unwrap()
                .verb,
            Verb::Patch {
                file: "p.yaml".into(),
                reason: "r".into(),
                global: false
            }
        );
        assert_eq!(
            config(&["config", "refresh-docs", "--global"])
                .unwrap()
                .verb,
            Verb::RefreshDocs { global: true }
        );
        assert_eq!(
            config(&[
                "config",
                "migrate",
                "--global",
                "--finish",
                "--machine-checked"
            ])
            .unwrap()
            .verb,
            Verb::Migrate {
                global: true,
                finish: true,
                convert: false,
                machine_checked: true,
                accept_machine_overrides: false,
                dry_run: false
            }
        );
        // A negative number is a value, not a flag.
        assert!(
            matches!(config(&["config", "set", "a", "-1"]).unwrap().verb, Verb::Set { value, .. } if value == "-1")
        );
        assert!(config(&["config", "migrate", "--finish"]).is_err());
        assert!(config(&["config", "migrate", "--global", "--machine-checked"]).is_err());
        assert!(config(&[
            "config",
            "migrate",
            "--global",
            "--accept-machine-overrides"
        ])
        .is_err());
        assert!(config(&["config", "set", "only-a-path"]).is_err());
        assert!(config(&["config", "set", "a", "b", "--reason"]).is_err());
        assert!(config(&["config", "unset", "a", "--global", "--finish"]).is_err());
    }

    fn events(args: &[&str]) -> Result<crate::wiring::events::EventsRequest, ProjectError> {
        let mut all = vec!["events"];
        all.extend_from_slice(args);
        let all: Vec<OsString> = all.iter().map(OsString::from).collect();
        project_events_request(&all, std::path::PathBuf::from("/repo"))
    }

    #[test]
    fn events_arguments_map_to_their_verb_and_pick_the_operation_that_matches_their_effect() {
        use crate::wiring::events::Verb;
        let sync = events(&["sync", "--no-push", "--remote", "backup"]).unwrap();
        assert_eq!(
            sync.verb,
            Verb::Sync {
                remote: Some("backup".into()),
                no_push: true,
                opportunistic: false
            }
        );
        assert!(!sync.detached, "a foreground publish is no child");
        let child = events(&["sync", "--opportunistic", "--dir", "/x"]).unwrap();
        assert!(
            child.detached,
            "the publish child shape is declared by the registry"
        );
        assert!(events(&["seal", "--stream", "project"]).unwrap().detached);
        assert!(!events(&["export", "--out", "o"]).unwrap().detached);
        assert_eq!(
            events(&["export", "--out", "o", "--stream", "s", "--since", "{}"])
                .unwrap()
                .verb,
            Verb::Export {
                out: Some("o".into()),
                stream: Some("s".into()),
                since: Some("{}".into())
            }
        );
        // A seal without a stream value reaches the provider, which owns that refusal.
        assert_eq!(
            events(&["seal", "--stream"]).unwrap().verb,
            Verb::Seal {
                stream: None,
                history: None
            }
        );
        for (args, operation) in [
            (&["events", "sync"][..], "event-store.sync"),
            (&["events", "status"], "event-store.status"),
            (&["events", "seal", "--stream", "p"], "event-store.seal"),
            (&["events", "export", "--out", "o"], "event-store.export"),
        ] {
            let args: Vec<OsString> = args.iter().map(OsString::from).collect();
            assert_eq!(
                native_operation_id("event-store.status", &args).unwrap(),
                operation
            );
        }
    }

    #[test]
    fn a_flag_given_the_wrong_shape_is_a_validation_refusal() {
        for args in [
            &["status", "--remote"][..],
            &["sync", "--no-push", "yes"],
            &["sync", "--remote"],
            &["export", "--out", "o", "--since"],
        ] {
            match events(args) {
                Err(ProjectError::Refused(refusal)) => assert_eq!(refusal.category, "validation"),
                other => panic!("{args:?}: {other:?}"),
            }
        }
    }

    #[test]
    fn a_flag_that_takes_no_value_refuses_the_word_the_parser_handed_it() {
        assert_eq!(
            config(&["config", "set", "--global", "a.b", "v"]).unwrap_err(),
            "--global takes no value"
        );
        assert_eq!(
            config(&["config", "show", "--path"]).unwrap_err(),
            "--path requires a value"
        );
        let identity = |args: &[&str]| {
            let args: Vec<OsString> = args.iter().map(OsString::from).collect();
            project_identity_request(&args)
        };
        assert_eq!(
            identity(&["identity", "list", "--project", "extra"]).unwrap_err(),
            "--project takes no value"
        );
        assert_eq!(
            identity(&["identity", "project", "--init", "--new"]).unwrap_err(),
            "--init and --new are exclusive"
        );
    }
}
