//! `fgos doctor`: the engine of `fgos_distribution::doctor` over the registry, with the owners the registry
//! names. Rows a Rust component judges are adapters in this directory, one file per component group; the rows
//! whose layers Node still owns go through the one bridge in `bridge.rs`, which is the only file here that may
//! start Node.

pub mod bridge;

use crate::routing::Call;
use fgos_distribution::doctor::{
    self, FixResult, Options, OwnerKind, Owners, Palette, Registry, RowOutcome, RowOwner,
};
use fgos_host_runtime::cli_args::{FlagScalar, FlagValue};
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, OperationId, OperationProvider,
    OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle, ProviderOutcome,
    VerbAnswer,
};
use std::borrow::Cow;
use std::ffi::OsString;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;

pub const OPERATION_ID: &str = "doctor.run";

pub const DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed(OPERATION_ID),
    operation_id: OperationId::from_static(OPERATION_ID),
    component_class: Cow::Borrowed("packaging"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("doctor.run.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("doctor.run.outcome", "1.0.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

const REGISTRY_JSON: &str =
    include_str!("../../../../../packages/distribution/contracts/doctor-registry.v1.json");
const CONFIG_ROWS_JSON: &str =
    include_str!("../../../../../packages/config/contracts/doctor-rows.v1.json");

/// The registry the host runs: the contract file with the config crate's rows as its `config` group.
/// The registry must hand the in-process owner exactly the rows and fixes it has adapters for: a registry that
/// names an owner nothing implements would silently drop its rows from every report.
pub fn registry() -> Result<Registry, String> {
    let registry = Registry::parse(REGISTRY_JSON, &[("config", CONFIG_ROWS_JSON)])?;
    for (kind, named, adapters) in [
        (
            "row",
            registry.row_ids(OwnerKind::Native),
            NativeOwner::ROW_IDS,
        ),
        (
            "fix",
            registry.fix_ids(OwnerKind::Native),
            NativeOwner::FIX_IDS,
        ),
    ] {
        if named != adapters {
            return Err(format!(
                "doctor registry: the {kind}s it gives to Rust ({named:?}) are not the ones the host implements ({adapters:?})"
            ));
        }
    }
    Ok(registry)
}

/// One `fgos doctor` call: where it acts and what the person asked for.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DoctorRequest {
    /// The project: the main checkout the root door resolved (`--dir` when named).
    pub root: PathBuf,
    pub fix: bool,
    pub strict: bool,
    pub pretty: bool,
}

/// What the Node CLI made of a flag: any value but an empty string is true (`--fix`, `--fix yes`, `--pretty`).
fn truthy(flag: Option<&FlagValue>) -> bool {
    match flag {
        None => false,
        Some(FlagValue::One(FlagScalar::Bool)) | Some(FlagValue::Many(_)) => true,
        Some(FlagValue::One(FlagScalar::Str(text))) => !text.is_empty(),
    }
}

/// Reads a call of `doctor` (`args[0]` is the verb) through the shared parser. `--strict` only counts as a bare
/// flag, as the Node CLI read it (`--strict yes` is a value, not strictness).
pub fn project_doctor_request(
    args: &[OsString],
    root: Result<PathBuf, String>,
) -> Result<DoctorRequest, String> {
    let call = Call::new(args);
    let flags = call.flags();
    Ok(DoctorRequest {
        root: root?,
        fix: truthy(flags.flag("fix")),
        strict: matches!(flags.flag("strict"), Some(FlagValue::One(FlagScalar::Bool))),
        pretty: truthy(flags.flag("pretty")),
    })
}

/// The rows and fixes a Rust component judges in process, by id: none until the layers that own them have a
/// Rust owner. The registry's `rust:` entries must equal [`NativeOwner::ROW_IDS`] and
/// [`NativeOwner::FIX_IDS`]; a test pins it.
pub struct NativeOwner;

impl NativeOwner {
    pub const ROW_IDS: &'static [&'static str] = &[];
    pub const FIX_IDS: &'static [&'static str] = &[];
}

impl RowOwner for NativeOwner {
    fn run_fixes(&self, _root: &Path, ids: &[&str]) -> Vec<FixResult> {
        ids.iter()
            .map(|id| FixResult {
                id: (*id).to_owned(),
                changed: false,
                message: format!("no fix {id} is run in process"),
            })
            .collect()
    }

    fn judge_rows(&self, _root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
        ids.iter()
            .map(|id| RowOutcome::Unavailable {
                message: format!("no row {id} is judged in process"),
                next: "run fgos doctor again".to_owned(),
            })
            .collect()
    }
}

/// One run against `owners`: the report as JSON, the exit status `--strict` asks for, and the `--pretty` text
/// when asked.
pub fn answer(request: &DoctorRequest, registry: &Registry, owners: &Owners) -> VerbAnswer {
    let report = doctor::run(
        registry,
        owners,
        &request.root,
        Options { fix: request.fix },
    );
    VerbAnswer {
        exit: report.exit_code(request.strict),
        text: request
            .pretty
            .then(|| doctor::render_pretty(&report, Palette::for_stdout())),
        data: serde_json::to_value(&report).expect("a report is plain data"),
    }
}

/// The provider of `doctor.run`.
pub struct DoctorProvider {
    descriptor: ProviderDescriptor,
}

impl DoctorProvider {
    pub fn new() -> Self {
        Self {
            descriptor: DESCRIPTOR,
        }
    }
}

impl Default for DoctorProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for DoctorProvider {
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
            events.record_event(&format!("{OPERATION_ID}.invoked"));
            let request = request
                .input
                .downcast_ref::<DoctorRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not DoctorRequest".into())
                })?
                .clone();
            let registry = registry().map_err(ProviderError::ProviderFailed)?;
            // Rows run Rust and Node code that blocks (spawns, waits): never on the async worker.
            let answered = tokio::task::spawn_blocking(move || {
                let bridge = bridge::NodeBridge::new();
                answer(
                    &request,
                    &registry,
                    &Owners {
                        native: &NativeOwner,
                        bridge: &bridge,
                    },
                )
            })
            .await
            .map_err(|error| ProviderError::ProviderFailed(error.to_string()))?;
            Ok(ProviderOutcome::completed(
                DESCRIPTOR.outcome_contract.clone(),
                Box::new(answered),
            ))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn os(args: &[&str]) -> Vec<OsString> {
        args.iter().map(OsString::from).collect()
    }

    fn request(args: &[&str]) -> DoctorRequest {
        project_doctor_request(&os(args), Ok(PathBuf::from("/p"))).unwrap()
    }

    #[test]
    fn the_flags_read_as_the_node_cli_read_them() {
        let plain = request(&["doctor"]);
        assert!(!plain.fix && !plain.strict && !plain.pretty);
        let all = request(&["doctor", "--fix", "--strict", "--pretty"]);
        assert!(all.fix && all.strict && all.pretty);
        // A value turns --strict into a string, which was never `=== true`; --fix and --pretty stay truthy.
        let valued = request(&["doctor", "--strict", "yes", "--fix", "yes", "--pretty", "x"]);
        assert!(!valued.strict && valued.fix && valued.pretty);
        let empty = request(&["doctor", "--fix", "", "--pretty", ""]);
        assert!(!empty.fix && !empty.pretty);
    }

    #[test]
    fn a_call_with_no_project_is_the_projection_error() {
        assert_eq!(
            project_doctor_request(&os(&["doctor"]), Err("no project".into())),
            Err("no project".into())
        );
    }

    #[test]
    fn the_registry_the_host_embeds_parses_and_its_in_process_entries_are_the_adapters_it_has() {
        let registry = registry().unwrap();
        assert!(!registry.rows.is_empty() && !registry.fixes.is_empty());
        assert_eq!(registry.row_ids(OwnerKind::Native), NativeOwner::ROW_IDS);
        assert_eq!(registry.fix_ids(OwnerKind::Native), NativeOwner::FIX_IDS);
    }

    #[test]
    fn every_bridged_entry_names_the_step_that_removes_it() {
        let registry = registry().unwrap();
        let steps = ["S5", "S6a", "S6b", "S7"];
        for owner in registry
            .rows
            .iter()
            .map(|row| &row.owner)
            .chain(registry.fixes.iter().map(|fix| &fix.owner))
            .filter(|owner| owner.kind == OwnerKind::Bridge)
        {
            assert!(steps.contains(&owner.label.as_str()), "{}", owner.label);
        }
    }

    #[test]
    fn the_answer_carries_the_strict_exit_the_report_and_the_pretty_text_only_when_asked() {
        struct Failing;
        impl RowOwner for Failing {
            fn run_fixes(&self, _: &Path, ids: &[&str]) -> Vec<FixResult> {
                ids.iter()
                    .map(|id| FixResult {
                        id: (*id).to_owned(),
                        changed: false,
                        message: String::new(),
                    })
                    .collect()
            }
            fn judge_rows(&self, _: &Path, ids: &[&str]) -> Vec<RowOutcome> {
                ids.iter()
                    .map(|_| RowOutcome::Unavailable {
                        message: "down".into(),
                        next: "retry".into(),
                    })
                    .collect()
            }
        }
        let registry = registry().unwrap();
        let owners = Owners {
            native: &Failing,
            bridge: &Failing,
        };
        let lax = answer(&request(&["doctor"]), &registry, &owners);
        assert_eq!(lax.exit, 0);
        assert!(lax.text.is_none());
        assert_eq!(lax.data["ok"], false);
        assert_eq!(lax.data["next"], serde_json::json!(["retry"]));
        let strict = answer(
            &request(&["doctor", "--strict", "--pretty"]),
            &registry,
            &owners,
        );
        assert_eq!(strict.exit, 1);
        assert!(strict.text.unwrap().starts_with("fgos doctor\n"));
    }
}
