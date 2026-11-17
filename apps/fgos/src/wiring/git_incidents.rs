//! `fgos git status|recover`: the open Git incidents of the main checkout's repository as native operations
//! (`git.status`, `git.recover`). The model is `fgos_git::incidents`; this module only carries the call to it: which
//! checkout the caller means (the `main-checkout` root rule of the Git door), where the state root is, and which
//! writer recovers. A checkout the Git door refuses is the caller's usage error, as for every verb that acts on the
//! main checkout.
use crate::routing::Call;
use fgos_git::incidents::{read_git_status, recover_git_operations};
use fgos_git::invocation_root::{resolve_invocation_root, RootPolicy, RootRequest};
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome,
    OperationId, OperationProvider, OperationRequest, ProviderDescriptor, ProviderError,
    ProviderLifecycle, ProviderOutcome,
};
use std::borrow::Cow;
use std::ffi::OsString;
use std::future::Future;
use std::path::PathBuf;
use std::pin::Pin;

/// A Git driver failure as a person reads it: the cause, then what Git said.
pub fn describe_operation_error(error: &fgos_git::OperationError) -> String {
    let text = String::from_utf8_lossy(&error.stderr).trim().to_owned();
    if text.is_empty() {
        error.cause.clone()
    } else {
        format!("{}: {text}", error.cause)
    }
}

/// Why the Git WAL could not be opened.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum OpenWalError {
    /// The controller activation fence is missing: only an activation (`fgctl init`, `fgctl upgrade`) places it, so
    /// no fix of fgOS's own can open the WAL.
    FenceMissing,
    Other(String),
}

impl std::fmt::Display for OpenWalError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::FenceMissing => f.write_str("git-fence-missing"),
            Self::Other(text) => f.write_str(text),
        }
    }
}

/// Creates and trusts the Git WAL of the repository at `root` (opening it is what makes it trusted), through the
/// one call both `fgos init` and the `git-wal-dir` doctor fix make. `Ok(false)` when `root` is no repository.
pub fn open_wal(
    driver: &fgos_git::GitDriver,
    root: &std::path::Path,
) -> Result<bool, OpenWalError> {
    match driver
        .resolve_repo(root, root)
        .map_err(|error| OpenWalError::Other(describe_operation_error(&error)))?
    {
        fgos_git::ResolveRepo::Repository(repo) => match fgos_git::wal::Wal::open(&repo) {
            Ok(_) => Ok(true),
            Err(fgos_git::wal::WalError::FenceMissing) => Err(OpenWalError::FenceMissing),
            Err(error) => Err(OpenWalError::Other(error.to_string())),
        },
        _ => Ok(false),
    }
}

pub const STATUS_OPERATION_ID: &str = "git.status";
pub const RECOVER_OPERATION_ID: &str = "git.recover";

/// The sub-commands `fgos git` serves.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["status", "recover"];

const fn descriptor(
    operation: &'static str,
    request: &'static str,
    outcome: &'static str,
) -> ProviderDescriptor {
    ProviderDescriptor {
        provider_id: Cow::Borrowed(operation),
        operation_id: OperationId::from_static(operation),
        component_class: Cow::Borrowed("git"),
        mechanism: Cow::Borrowed("builtin"),
        lifecycle: ProviderLifecycle::Singleton,
        request_contract: ContractRef::from_static(request, "1.0.0"),
        outcome_contract: ContractRef::from_static(outcome, "1.0.0"),
        allowed_hosts: &["cli"],
        allowed_modes: &["sync"],
        capabilities: &[],
        replacement: None,
        concurrency: None,
        health: None,
    }
}

pub const STATUS_DESCRIPTOR: ProviderDescriptor = descriptor(
    STATUS_OPERATION_ID,
    "git.status.request",
    "git.status.outcome",
);
pub const RECOVER_DESCRIPTOR: ProviderDescriptor = descriptor(
    RECOVER_OPERATION_ID,
    "git.recover.request",
    "git.recover.outcome",
);

/// Which of the two operations a call asks for.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GitOperation {
    Status,
    Recover,
}

/// One `fgos git` invocation, as the projector read it: where it ran and the project `--dir` names, if any.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GitRequest {
    pub operation: GitOperation,
    pub cwd: PathBuf,
    pub dir: Option<String>,
    pub home: Option<PathBuf>,
}

impl GitRequest {
    pub fn operation_id(&self) -> &'static str {
        match self.operation {
            GitOperation::Status => STATUS_OPERATION_ID,
            GitOperation::Recover => RECOVER_OPERATION_ID,
        }
    }
}

/// Reads a call of `git` (`args[0]` is the verb) through the shared parser. The sub-command and the flags were
/// checked before this runs; an unserved sub-command never reaches it.
pub fn project_git_request(args: &[OsString]) -> GitRequest {
    let call = Call::new(args);
    let operation = match call.parsed().positional.first().map(String::as_str) {
        Some("recover") => GitOperation::Recover,
        _ => GitOperation::Status,
    };
    GitRequest {
        operation,
        cwd: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
        dir: call.named_dir(),
        home: fgos_config::machine::home_dir(|key| std::env::var(key).ok()),
    }
}

/// The writer a recovery runs as: this process's identity for the main checkout's `.fgos`. An attempted chain is
/// recovered only by the writer that started it, so every caller of recovery names its writer through this one.
pub(crate) fn own_writer(fgos_dir: &std::path::Path) -> String {
    fgos_identity::resolve_current(Some(fgos_dir))
        .id
        .to_string()
}

/// What a request answers: the data of the envelope, the caller's refusal, or a failure of the verb itself.
enum Answer {
    Data(serde_json::Value),
    Refused(CategorisedRefusal),
}

fn answer(request: &GitRequest) -> Result<Answer, ProviderError> {
    let root = match resolve_invocation_root(&RootRequest {
        cwd: &request.cwd,
        dir: request.dir.as_deref(),
        policy: RootPolicy::MainCheckout,
        home: request.home.as_deref(),
    }) {
        Ok(root) => root.root,
        Err(refusal) => {
            return Ok(Answer::Refused(CategorisedRefusal::new(
                "validation",
                refusal.message,
            )))
        }
    };
    let (state_root, _) = fgos_holder_lock::state_root();
    let data = match request.operation {
        GitOperation::Status => serde_json::to_value(read_git_status(&state_root, &root)),
        GitOperation::Recover => {
            let recovered = recover_git_operations(&state_root, &root, &own_writer)
                .map_err(|error| ProviderError::ProviderFailed(error.cause().to_owned()))?;
            serde_json::to_value(recovered)
        }
    };
    data.map(Answer::Data)
        .map_err(|error| ProviderError::ProviderFailed(error.to_string()))
}

/// The provider of one of the two operations.
pub struct GitIncidentsProvider {
    descriptor: ProviderDescriptor,
}

impl GitIncidentsProvider {
    pub fn for_descriptor(descriptor: ProviderDescriptor) -> Self {
        Self { descriptor }
    }
}

impl OperationProvider for GitIncidentsProvider {
    fn descriptor(&self) -> &ProviderDescriptor {
        &self.descriptor
    }

    fn invoke<'a>(
        &'a self,
        _invocation: &'a HostInvocation,
        request: OperationRequest,
        _control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>> {
        Box::pin(async move {
            events.record_event(&format!("{}.invoked", self.descriptor.operation_id));
            let request = request.input.downcast_ref::<GitRequest>().ok_or_else(|| {
                ProviderError::SemanticValidation("input is not GitRequest".into())
            })?;
            let contract = self.descriptor.outcome_contract.clone();
            Ok(match answer(request)? {
                Answer::Data(value) => {
                    ProviderOutcome::completed(contract, Box::new(JsonOutcome(value)))
                }
                Answer::Refused(refusal) => ProviderOutcome::completed(contract, Box::new(refusal)),
            })
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn os(args: &[&str]) -> Vec<OsString> {
        args.iter().map(OsString::from).collect()
    }

    #[test]
    fn a_call_names_its_operation_and_the_project_dir_flag_names() {
        let status = project_git_request(&os(&["git", "status", "--json"]));
        assert_eq!(status.operation_id(), STATUS_OPERATION_ID);
        assert_eq!(status.dir, None);
        let recover = project_git_request(&os(&["git", "--dir", "/work/repo", "recover"]));
        assert_eq!(recover.operation_id(), RECOVER_OPERATION_ID);
        assert_eq!(recover.dir.as_deref(), Some("/work/repo"));
    }

    #[test]
    fn a_checkout_the_git_door_refuses_is_the_callers_usage_error_with_no_data() {
        let dir = std::env::temp_dir().join(format!("fgos-git-incidents-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join(".git"), "not a gitdir pointer\n").unwrap();
        let request = GitRequest {
            operation: GitOperation::Status,
            cwd: dir.clone(),
            dir: None,
            home: None,
        };
        let outcome = answer(&request);
        std::fs::remove_dir_all(&dir).unwrap();
        match outcome {
            Ok(Answer::Refused(refusal)) => {
                assert_eq!(refusal.category, "validation");
                assert_eq!(
                    refusal.exit_code(),
                    fgos_host_runtime::exit_codes::validation()
                );
            }
            _ => panic!("expected a refusal"),
        }
    }
}
