//! `fgos doctor`: the engine of `fgos_distribution::doctor` over the registry, with the owners the registry
//! names. Rows a Rust component judges are adapters in this directory, one file per component group; the rows
//! whose layers Node still owns go through the one bridge in `bridge.rs`, which is the only file here that may
//! start Node.

pub mod bridge;
pub mod config;
pub mod event_store;
pub mod git;
pub mod holder_lock;
pub mod identity;
pub mod mailbox;
pub mod observe;

use crate::routing::Call;
use fgos_distribution::doctor::{
    self, FixResult, Options, Owners, Palette, Registry, RowOutcome, RowOwner,
};
use fgos_host_runtime::cli_args::{FlagScalar, FlagValue};
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, OperationId, OperationProvider,
    OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle, ProviderOutcome,
    VerbAnswer,
};
use std::borrow::Cow;
use std::cell::OnceCell;
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
/// The registry names which rows and fixes Rust judges today (`inRust`); the host's adapters are exactly those.
/// An entry the registry gives to Rust but has not listed yet is judged by its Node body through the bridge until
/// the phase that ports it adds the adapter and lists it, in one change.
pub fn registry() -> Result<Registry, String> {
    let registry = Registry::parse(REGISTRY_JSON, &[("config", CONFIG_ROWS_JSON)])?;
    for (kind, listed, adapters) in [
        ("row", &registry.in_rust_rows, NativeOwner::row_ids()),
        ("fix", &registry.in_rust_fixes, NativeOwner::fix_ids()),
    ] {
        let mut a: Vec<&str> = adapters;
        let mut l: Vec<&str> = listed.iter().map(String::as_str).collect();
        a.sort_unstable();
        l.sort_unstable();
        if a != l {
            return Err(format!(
                "doctor registry: the {kind}s it lists as judged in Rust ({l:?}) are not the host's adapters ({a:?})"
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
pub(crate) fn truthy(flag: Option<&FlagValue>) -> bool {
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

/// The config door's answer to a project directory it cannot open (the rule of the door's own request check): the
/// rows that read the project's config say it as the row's failure. `None` when the directory resolves.
pub fn project_root_refusal(root: &Path) -> Option<&'static str> {
    std::fs::canonicalize(root)
        .is_err()
        .then_some("config-request-invalid (projectRoot)")
}

/// What one doctor call shares between the rows a group judges in process: the project, the state root and the
/// facts read once (a failure is remembered, not recomputed per row).
pub struct Run<'a> {
    pub root: &'a Path,
    pub state_root: PathBuf,
    pub(crate) git: git::Cache,
    pub(crate) event_store: OnceCell<Result<event_store::Context, String>>,
}

impl<'a> Run<'a> {
    pub fn new(root: &'a Path) -> Self {
        Self::with_state_root(root, fgos_holder_lock::state_root().0)
    }

    pub fn with_state_root(root: &'a Path, state_root: PathBuf) -> Self {
        Self {
            root,
            state_root,
            git: OnceCell::new(),
            event_store: OnceCell::new(),
        }
    }
}

/// What the config door says of one refusal, as the Node door client worded it: the id, where (`file:line:column`
/// and the path), the keyword in parentheses. A row that fails because a config file is refused says exactly this.
pub(crate) fn config_refusal_text(refusal: &fgos_config::error::ConfigRefusal) -> String {
    let mut place = refusal.file.clone().unwrap_or_default();
    if let (false, Some(line), Some(column)) = (place.is_empty(), refusal.line, refusal.column) {
        place.push_str(&format!(":{line}:{column}"));
    }
    if let Some(path) = &refusal.path {
        place = [place.as_str(), path.as_str()]
            .iter()
            .filter(|part| !part.is_empty())
            .copied()
            .collect::<Vec<_>>()
            .join(" ");
    }
    let keyword = refusal
        .detail
        .as_deref()
        .and_then(|detail| detail.keyword.clone())
        .or_else(|| refusal.yaml.as_ref().map(|yaml| yaml.rule.to_string()))
        .map(|keyword| format!("({keyword})"))
        .unwrap_or_default();
    [refusal.code, place.as_str(), keyword.as_str()]
        .iter()
        .filter(|part| !part.is_empty())
        .copied()
        .collect::<Vec<_>>()
        .join(" ")
}

/// The refusals of a config read as one sentence (`; ` between them), or the text of any other failure.
pub(crate) fn config_read_text(error: fgos_config::event_store::ReadError) -> String {
    use fgos_config::event_store::ReadError;
    use fgos_config::snapshot::SnapshotError;
    match error {
        ReadError::Snapshot(SnapshotError::Refused(list)) => list
            .iter()
            .map(config_refusal_text)
            .collect::<Vec<_>>()
            .join("; "),
        other => crate::wiring::events::config_message(other),
    }
}

/// One component group's adapter: the ids of the rows it judges and the fixes it runs, and the two calls that
/// answer for them. A group's file calls its component crate's public functions and words the answer; it never
/// re-derives a fact.
pub struct Rows {
    pub rows: &'static [&'static str],
    pub fixes: &'static [&'static str],
    /// Judges the group's rows `ids` (registry order) against the project root, one outcome per id, in order.
    pub judge: fn(&Path, &[&str]) -> Vec<RowOutcome>,
    /// Runs the group's fixes `ids` (registry order) against the project root, one result per id, in order.
    pub fix: fn(&Path, &[&str]) -> Vec<FixResult>,
}

/// Every group the host judges in process. A phase that ports a group of rows adds its line here.
const GROUPS: &[&Rows] = &[
    &config::GROUP,
    &git::GROUP,
    &event_store::GROUP,
    &holder_lock::GROUP,
    &identity::GROUP,
    &mailbox::GROUP,
    &observe::GROUP,
];

/// The rows and fixes a Rust component judges in process, by id. The registry's `inRust` lists must equal
/// [`NativeOwner::row_ids`] and [`NativeOwner::fix_ids`]; a test pins it.
pub struct NativeOwner;

impl NativeOwner {
    pub fn row_ids() -> Vec<&'static str> {
        GROUPS
            .iter()
            .flat_map(|group| group.rows)
            .copied()
            .collect()
    }

    pub fn fix_ids() -> Vec<&'static str> {
        GROUPS
            .iter()
            .flat_map(|group| group.fixes)
            .copied()
            .collect()
    }
}

fn no_answer(id: &str, what: &str) -> String {
    format!("no {what} {id} is judged in process")
}

impl RowOwner for NativeOwner {
    /// One fix at a time, in the order asked: a fix may rely on one before it, whichever group owns each.
    fn run_fixes(&self, root: &Path, ids: &[&str]) -> Vec<FixResult> {
        ids.iter()
            .map(|id| {
                match GROUPS.iter().find(|group| group.fixes.contains(id)) {
                    Some(group) => (group.fix)(root, &[id]).into_iter().next(),
                    None => None,
                }
                .unwrap_or_else(|| {
                    FixResult::done(id, false, format!("no fix {id} is run in process"))
                })
            })
            .collect()
    }

    /// A group judges all of its rows in one call, so what its rows share is read once; the answers go back in
    /// the order asked.
    fn judge_rows(&self, root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
        let mut answers: Vec<Option<RowOutcome>> = ids.iter().map(|_| None).collect();
        for group in GROUPS {
            let at: Vec<usize> = (0..ids.len())
                .filter(|&i| group.rows.contains(&ids[i]))
                .collect();
            if at.is_empty() {
                continue;
            }
            let asked: Vec<&str> = at.iter().map(|&i| ids[i]).collect();
            for (&i, outcome) in at.iter().zip((group.judge)(root, &asked)) {
                answers[i] = Some(outcome);
            }
        }
        ids.iter()
            .zip(answers)
            .map(|(id, answer)| {
                answer.unwrap_or_else(|| RowOutcome::Unavailable {
                    message: no_answer(id, "row"),
                    next: "run fgos doctor again".to_owned(),
                })
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
    // An interrupted run prints nothing and ends as a signalled process does (128 + signal) once the host has
    // written its invocation record.
    if let Some(signal) = report.interrupted {
        return VerbAnswer {
            data: serde_json::Value::Null,
            exit: 128 + signal,
            text: Some(String::new()),
        };
    }
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
    use fgos_distribution::doctor::OwnerKind;

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
    fn a_row_or_fix_belongs_to_exactly_one_group() {
        let mut rows = std::collections::HashSet::new();
        let mut fixes = std::collections::HashSet::new();
        for group in GROUPS {
            assert!(
                group.rows.iter().all(|id| rows.insert(*id)),
                "a row is in two groups"
            );
            assert!(
                group.fixes.iter().all(|id| fixes.insert(*id)),
                "a fix is in two groups"
            );
        }
    }

    #[test]
    fn a_call_with_no_project_is_the_projection_error() {
        assert_eq!(
            project_doctor_request(&os(&["doctor"]), Err("no project".into())),
            Err("no project".into())
        );
    }

    #[test]
    fn the_registry_the_host_embeds_parses_and_lists_exactly_the_adapters_the_host_has() {
        let registry = registry().unwrap();
        assert!(!registry.rows.is_empty() && !registry.fixes.is_empty());
        let sorted = |mut ids: Vec<&str>| {
            ids.sort_unstable();
            ids.into_iter().map(str::to_owned).collect::<Vec<_>>()
        };
        let listed = |ids: &[String]| sorted(ids.iter().map(String::as_str).collect());
        assert_eq!(
            listed(&registry.in_rust_rows),
            sorted(NativeOwner::row_ids())
        );
        assert_eq!(
            listed(&registry.in_rust_fixes),
            sorted(NativeOwner::fix_ids())
        );
    }

    #[test]
    fn the_registry_splits_the_rows_and_fixes_between_rust_and_the_bridge_as_measured() {
        let registry = registry().unwrap();
        let count = |step: &str| {
            registry
                .rows
                .iter()
                .filter(|row| row.owner.kind == OwnerKind::Bridge && row.owner.label == step)
                .count()
        };
        assert_eq!(registry.rows.len(), 109);
        assert_eq!(
            (count("S5"), count("S6a"), count("S6b"), count("S7")),
            (8, 31, 6, 8)
        );
        assert_eq!(registry.row_ids(OwnerKind::Native).len(), 56);
        assert_eq!(registry.fixes.len(), 27);
        assert_eq!(registry.fix_ids(OwnerKind::Bridge).len(), 5);
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
                    .map(|id| FixResult::done(id, false, ""))
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

/// Real repositories for the row adapters' tests: a repository with its own machine id, a private state root, the
/// controller's activation fence and the Event Store's locks directory, the way a project `fgctl init` prepared it.
#[cfg(test)]
pub(crate) mod testkit {
    use super::Run;
    use std::path::{Path, PathBuf};
    use std::process::Command;

    pub struct Fixture {
        pub temp: PathBuf,
        pub repo: PathBuf,
        pub state: PathBuf,
    }

    fn private(path: &Path) {
        std::fs::create_dir_all(path).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o700)).unwrap();
        }
    }

    pub fn git(dir: &Path, args: &[&str]) -> String {
        let out = Command::new("git")
            .args(args)
            .current_dir(dir)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "git {args:?}: {}",
            String::from_utf8_lossy(&out.stderr)
        );
        String::from_utf8_lossy(&out.stdout).trim().to_owned()
    }

    impl Fixture {
        pub fn new(name: &str) -> Self {
            let temp = std::env::temp_dir().join(format!(
                "fgos-doctor-{name}-{}-{}",
                std::process::id(),
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            ));
            let repo = temp.join("repo");
            std::fs::create_dir_all(&repo).unwrap();
            git(&repo, &["init", "-q", "-b", "main"]);
            git(&repo, &["config", "user.name", "Fixture"]);
            git(&repo, &["config", "user.email", "fixture@example.test"]);
            git(&repo, &["config", "fgos.machineId", "fixture-machine"]);
            let state = temp.join("state");
            private(&state);
            private(&repo.join(".git/fgos"));
            private(&repo.join(".git/fgos/events"));
            private(&repo.join(".git/fgos/events/locks"));
            let fence = repo.join(".fgos/locks/activation.lock");
            std::fs::create_dir_all(&fence).unwrap();
            std::fs::write(
                fence.join("TOMBSTONE"),
                r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
            )
            .unwrap();
            Self { temp, repo, state }
        }

        /// A directory that is no repository.
        pub fn plain(name: &str) -> Self {
            let mut fixture = Self::new(name);
            let plain = fixture.temp.join("plain");
            private(&plain);
            fixture.repo = plain;
            fixture
        }

        pub fn git(&self, args: &[&str]) -> String {
            git(&self.repo, args)
        }

        pub fn with_remote(&self) -> PathBuf {
            let remote = self.temp.join("remote");
            git(
                &self.temp,
                &["init", "--bare", "-q", remote.to_str().unwrap()],
            );
            self.git(&["remote", "add", "origin", remote.to_str().unwrap()]);
            remote
        }

        /// A fresh run: each judgment of a test starts from what is on disk now.
        pub fn run(&self) -> Run<'_> {
            Run::with_state_root(&self.repo, self.state.clone())
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.temp);
        }
    }
}
