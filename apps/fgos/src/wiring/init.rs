//! `fgos init`: creates the `.fgos/` store of the project it runs in and settles what a fresh or upgraded machine
//! needs around it, as a composition of the components that own each step, in this order:
//!
//! 1. the machine id (`fgos-identity`);
//! 2. the legacy JSON config an older release left, moved to the files the Config component reads (`fgos-config`);
//! 3. on platforms with an Event Store: the lock directories, then the Work store (the one step Node still owns,
//!    asked of the payload through the Node rows bridge until the Work layer moves);
//! 4. the harness coexistence manifest;
//! 5. the header-only config files of the project and the machine;
//! 6. the headless-repository notice;
//! 7. the recovery of an interrupted Git operation (`fgos-git`).
//!
//! Only the first three steps refuse; every later one is fail-safe, so a quirk there still leaves `.fgos/`
//! initialised. The order lives in [`run`], over the [`Steps`] port; [`Live`] is the port's one adapter.

use super::doctor::bridge::{Fault, NodeBridge};
use crate::cli_projector::ProjectError;
use crate::legacy_exec;
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome,
    OperationId, OperationProvider, OperationRequest, ProviderDescriptor, ProviderError,
    ProviderLifecycle, ProviderOutcome, VerbAnswer,
};
use serde::Serialize;
use serde_json::{json, Value};
use std::borrow::Cow;
use std::ffi::OsString;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;

pub const OPERATION_ID: &str = "init.run";

pub const DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed(OPERATION_ID),
    operation_id: OperationId::from_static(OPERATION_ID),
    component_class: Cow::Borrowed("packaging"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("init.run.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("init.run.outcome", "1.0.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

const WORK_STORE_NOTE: &str = "Work is not available on this platform yet: the Event Store runs on Linux only, so fgOS installs and activates here but the Work verbs refuse.";

/// What a person needs to know after the global file moved: older releases on this machine read that file.
#[cfg(any(unix, test))]
pub const GLOBAL_MOVED_NOTE: &str =
    "~/.fgos/config.json moved; projects on an older release refuse until `fgctl upgrade`";

/// The refusal for a key whose private destination holds a different value: nothing is overwritten or dropped.
#[cfg(unix)]
const DESTINATION_DIFFERS: &str = "config-migrate-destination-differs: ~/.fgos/private already holds a different account pool or gateway token than ~/.fgos/config.json; keep the one you want and remove the other, then run fgos init again";

/// One `fgos init` call: the project root the invocation doors resolved (the directory it runs in, or `--dir`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InitRequest {
    pub root: PathBuf,
}

/// Reads a call of `init`: it takes no flag of its own, so the project is the root the doors resolved.
pub fn project_init_request(
    _args: &[OsString],
    root: Result<PathBuf, String>,
) -> Result<InitRequest, ProjectError> {
    Ok(InitRequest { root: root? })
}

/// What the legacy config settle did: the steps taken, the line to show when the global file moved, and a
/// warning when a write was refused.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Legacy {
    pub steps: Vec<&'static str>,
    pub note: Option<String>,
    pub warning: Option<String>,
}

/// A step that did not go through: the exit category the error carries (when it has one) and its text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StepFailure {
    pub category: Option<&'static str>,
    pub message: String,
}

impl StepFailure {
    fn plain(message: impl Into<String>) -> Self {
        Self {
            category: None,
            message: message.into(),
        }
    }

    fn refusal(self) -> CategorisedRefusal {
        match self.category {
            Some(category) => CategorisedRefusal::new(category, self.message),
            None => CategorisedRefusal::unexpected(self.message),
        }
    }
}

/// Every step of init, one question each; [`run`] decides the order and which ones may refuse.
pub trait Steps {
    fn mint_machine_id(&self) -> Result<(), StepFailure>;
    fn settle_legacy_config(&self, root: &Path) -> Result<Legacy, StepFailure>;
    /// Whether this platform has an Event Store, and with it a Work store to create.
    fn work_store_supported(&self) -> bool;
    fn fix_lock_dirs(&self, root: &Path) -> Result<(), StepFailure>;
    fn create_work_store(&self, root: &Path) -> Result<(), StepFailure>;
    /// The signal that ended the Work step early, once one did.
    fn interrupted(&self) -> Option<i32>;
    /// The harnesses the coexistence manifest names; a failure to write it is never an error.
    fn write_coexistence(&self, root: &Path, data_dir: &Path) -> Vec<Value>;
    /// `{ project, global }` of the created or found config files, or `{ warning }`.
    fn create_config_files(&self, root: &Path) -> Value;
    /// Whether HEAD names no commit (zero commits, an unreadable ref).
    fn headless(&self, root: &Path) -> bool;
    /// `Ok(None)` when nothing was recovered or kept.
    fn recover_git(&self, root: &Path) -> Result<Option<Value>, String>;
}

/// The data `init` answers, keys in the order the Node CLI wrote them.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitData {
    pub dir: PathBuf,
    pub detected_harnesses: Vec<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub legacy_config: Option<Vec<&'static str>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub legacy_config_note: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub legacy_config_warning: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub work_store: Option<&'static str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub work_store_note: Option<&'static str>,
    pub config: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub git_headless: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub git_recovery: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub git_recovery_warning: Option<String>,
}

/// How a call ended: with its data, or ended by a signal while the Work step ran.
#[derive(Debug, Clone, PartialEq)]
pub enum Done {
    Data(Box<InitData>),
    Interrupted(i32),
}

/// Creates the store of the project at `root` through `steps`, in the order of the module's header.
pub fn run(steps: &dyn Steps, root: &Path) -> Result<Done, CategorisedRefusal> {
    let data_dir = root.join(".fgos");
    steps.mint_machine_id().map_err(StepFailure::refusal)?;
    let legacy = steps
        .settle_legacy_config(root)
        .map_err(StepFailure::refusal)?;
    // The Work store is built on the Event Store, which exists on Linux only: elsewhere init settles the machine
    // and the project around it and leaves the store out.
    let work_store = steps.work_store_supported();
    if work_store {
        steps.fix_lock_dirs(root).map_err(StepFailure::refusal)?;
        if let Err(failure) = steps.create_work_store(root) {
            return match steps.interrupted() {
                Some(signal) => Ok(Done::Interrupted(signal)),
                None => Err(failure.refusal()),
            };
        }
    }
    let detected_harnesses = steps.write_coexistence(root, &data_dir);
    let config = steps.create_config_files(root);
    let git_headless = steps.headless(root).then_some(true);
    let (git_recovery, git_recovery_warning) = match steps.recover_git(root) {
        Ok(recovery) => (recovery, None),
        Err(cause) => (
            None,
            Some(format!(
                "Git recovery refused: {cause}; run `fgos git recover`"
            )),
        ),
    };
    Ok(Done::Data(Box::new(InitData {
        dir: data_dir,
        detected_harnesses,
        legacy_config: (!legacy.steps.is_empty()).then_some(legacy.steps),
        legacy_config_note: legacy.note,
        legacy_config_warning: legacy.warning,
        work_store: (!work_store).then_some("unsupported-platform"),
        work_store_note: (!work_store).then_some(WORK_STORE_NOTE),
        config,
        git_headless,
        git_recovery,
        git_recovery_warning,
    })))
}

/// The exit categories an error of the Node side can carry; a name outside this list is an unexpected failure.
const CATEGORIES: [&str; 8] = [
    "precondition",
    "conflict",
    "validation",
    "corrupt-log",
    "lock-timeout",
    "session-fail",
    "merge-fail",
    "not-found",
];

/// The failure of the Work store step as the person sees it: the text and category of a refusal the payload
/// gave, or what kept the payload from answering.
fn work_store_failure(fault: Fault) -> StepFailure {
    match fault {
        Fault::Refused { message, category } => StepFailure {
            category: category
                .as_deref()
                .and_then(|name| CATEGORIES.into_iter().find(|known| *known == name)),
            message,
        },
        Fault::NodeMissing(cause) => StepFailure {
            category: Some("precondition"),
            message: format!(
                "the Work store needs Node 18 or newer, which is not available ({cause}); install it and run fgos init again"
            ),
        },
        Fault::Failed(cause) => StepFailure::plain(format!("the Work store step failed: {cause}")),
    }
}

/// The adapter over the real machine: the components named in the module header.
pub struct Live {
    state_root: PathBuf,
    bridge: NodeBridge,
}

impl Live {
    pub fn new(state_root: PathBuf, bridge: NodeBridge) -> Self {
        Self { state_root, bridge }
    }
}

fn env_lookup(key: &str) -> Option<String> {
    std::env::var(key).ok()
}

impl Steps for Live {
    fn mint_machine_id(&self) -> Result<(), StepFailure> {
        fgos_identity::machine::mint_here(&self.state_root)
            .map(|_| ())
            .map_err(|error| StepFailure::plain(error.to_string()))
    }

    fn settle_legacy_config(&self, root: &Path) -> Result<Legacy, StepFailure> {
        legacy::settle(root).map_err(StepFailure::plain)
    }

    fn work_store_supported(&self) -> bool {
        fgos_event_store::lifecycle::platform_supported()
    }

    fn fix_lock_dirs(&self, root: &Path) -> Result<(), StepFailure> {
        use super::doctor::event_store::{build_context, private_directories};
        // The store's setup context is the doctor's: the repository, then the strict `eventStore` config, so a
        // refused config file stops init here as it stops the lock-directory repair.
        let context = build_context(root, &self.state_root).map_err(StepFailure::plain)?;
        let open_root = context.facts()["openRoot"].as_str().unwrap_or_default();
        private_directories(Path::new(open_root))
            .map(|_| ())
            .map_err(StepFailure::plain)
    }

    fn create_work_store(&self, root: &Path) -> Result<(), StepFailure> {
        self.bridge
            .work_store_init(root)
            .map_err(work_store_failure)
    }

    fn interrupted(&self) -> Option<i32> {
        legacy_exec::interrupted()
    }

    fn write_coexistence(&self, root: &Path, data_dir: &Path) -> Vec<Value> {
        let tmpdir = fgos_distribution::coexistence::os_tmpdir(env_lookup);
        fgos_distribution::coexistence::write_coexistence_manifest(root, data_dir, &tmpdir)
            .ok()
            .and_then(|manifest| manifest["detected_harnesses"].as_array().cloned())
            .unwrap_or_default()
    }

    fn create_config_files(&self, root: &Path) -> Value {
        config_files::create(root)
    }

    fn headless(&self, root: &Path) -> bool {
        use fgos_git::{GitDriver, ResolveRepo};
        let Ok(driver) = GitDriver::new(&self.state_root) else {
            return true;
        };
        match driver.resolve_repo(root, root) {
            Ok(ResolveRepo::Repository(repo)) => {
                !matches!(driver.resolve_commit_ref(&repo, "HEAD"), Ok(Some(_)))
            }
            _ => true,
        }
    }

    fn recover_git(&self, root: &Path) -> Result<Option<Value>, String> {
        let own = |fgos_dir: &Path| {
            fgos_identity::resolve_current(Some(fgos_dir))
                .id
                .to_string()
        };
        let recovered = fgos_git::incidents::recover_git_operations(&self.state_root, root, &own)
            .map_err(|error| error.cause().to_owned())?;
        Ok(
            (!recovered.recovered.is_empty() || !recovered.kept.is_empty()).then(|| {
                json!({
                    "recovered": recovered.recovered,
                    "kept": recovered.kept,
                })
            }),
        )
    }
}

/// The header-only config files: the config door's create-only init for the project and the machine.
mod config_files {
    use super::*;

    /// A refusal (a confined session, an unwritable home) is returned as a warning, never an error.
    pub fn create(root: &Path) -> Value {
        match both(root) {
            Ok(files) => files,
            Err(why) => json!({ "warning": format!("config files not created: {why}") }),
        }
    }

    #[cfg(unix)]
    fn both(root: &Path) -> Result<Value, String> {
        use fgos_config::scope::SourceKind;
        use fgos_config::snapshot::SnapshotError;
        use fgos_config::write::{init, InitResult};

        const LOCK_WAIT_MS: u64 = 5_000;
        let text = |error: SnapshotError| match error {
            SnapshotError::Refused(all) => all
                .iter()
                .map(crate::wiring::doctor::config_refusal_text)
                .collect::<Vec<_>>()
                .join("; "),
            SnapshotError::Io(io) => format!("config-io ({:?})", io.kind()),
        };
        if let Some(refusal) = crate::wiring::doctor::project_root_refusal(root) {
            return Err(refusal.to_owned());
        }
        let global_dir = fgos_config::machine::global_dir(env_lookup)
            .ok_or_else(|| "config-io (HomeUnset)".to_owned())?;
        let project_root = std::fs::canonicalize(root)
            .map_err(|_| "config-request-invalid (projectRoot)".to_owned())?;
        let roots = fgos_config::snapshot::SnapshotRequest {
            trusted_root: project_root.clone(),
            project_root,
            global_dir,
            class: fgos_config::session::session_class(env_lookup),
        };
        let lock_root = fgos_holder_lock::state_root::lock_root();
        let made = |target| -> Result<Value, String> {
            let InitResult {
                created,
                file,
                revision,
            } = init(&roots, target, &lock_root, LOCK_WAIT_MS).map_err(text)?;
            Ok(json!({ "created": created, "file": file, "revision": revision }))
        };
        let project = made(SourceKind::Project)?;
        let global = made(SourceKind::Global)?;
        Ok(json!({ "project": project, "global": global }))
    }

    #[cfg(not(unix))]
    fn both(_: &Path) -> Result<Value, String> {
        Err("config-platform-unsupported (write)".to_owned())
    }
}

/// The legacy JSON config of an older release: moved to the files the Config component reads, in the order its
/// spec gives (the key copy, the removal of the copied keys, the global conversion, the project conversion),
/// each step only while the config door's own check still reports what it settles, so a second run does nothing.
mod legacy {
    use super::*;

    /// Where the write verbs cannot run (no Unix file door) nothing is moved and the readers say so by name.
    #[cfg(not(unix))]
    pub fn settle(_: &Path) -> Result<Legacy, String> {
        Ok(Legacy::default())
    }

    #[cfg(unix)]
    pub fn settle(root: &Path) -> Result<Legacy, String> {
        use crate::wiring::doctor::config::door;
        door::with_roots(root, |ctx, roots| steps(root, ctx, roots))?
    }

    #[cfg(unix)]
    const LEGACY_ROW: &str = "config-format-legacy-json";
    #[cfg(unix)]
    const MISPLACED_ROW: &str = "config-key-in-wrong-file";

    /// A refusal to write (a confined session, a read-only home): init reports it and goes on, and its own config
    /// read then says what is still wrong.
    #[cfg(unix)]
    fn is_write_refusal(text: &str) -> bool {
        text.contains("config-write-confined") || text.contains("config-io")
    }

    /// One `fgos config migrate` call in process, with the text the host's own refusal prints.
    #[cfg(unix)]
    fn migrate(root: &Path, global: bool, finish: bool, convert: bool) -> Result<(), String> {
        use fgos_config::provider::{answer, ConfigRequest, Verb};
        let request = ConfigRequest {
            root: root.to_path_buf(),
            verb: Verb::Migrate {
                global,
                finish,
                convert,
                machine_checked: global,
                accept_machine_overrides: false,
                dry_run: false,
            },
        };
        answer(&request)
            .map(|_| ())
            .map_err(|refusal| format!("fgos: error: {} [{}]", refusal.detail, refusal.reason))
    }

    #[cfg(unix)]
    fn steps(
        root: &Path,
        ctx: &fgos_config::snapshot::Context,
        roots: &fgos_config::snapshot::SnapshotRequest,
    ) -> Result<Legacy, String> {
        use crate::wiring::doctor::config::door;
        use fgos_config::doctor::Finding;
        let mut taken: Vec<&'static str> = Vec::new();
        let mut found = door::findings(ctx, roots);
        let is_global = |finding: &Finding| {
            finding
                .file
                .as_deref()
                .is_some_and(|file| file.starts_with("global:"))
        };
        fn of<'a>(
            found: &'a [Finding],
            row: &str,
            global: bool,
            is_global: &dyn Fn(&Finding) -> bool,
        ) -> Vec<&'a Finding> {
            found
                .iter()
                .filter(|f| f.row == row && is_global(f) == global)
                .collect()
        }
        let moving = of(&found, MISPLACED_ROW, true, &is_global);
        if moving
            .iter()
            .any(|f| f.detail.contains("destination-different"))
        {
            return Err(DESTINATION_DIFFERS.to_owned());
        }
        let copy = moving.iter().any(|f| f.fix == Some("copy-to-destination"));
        // A step that wrote changes what the check reports; one that did not leaves the findings as they were.
        let mut ran = |step: &'static str,
                       act: &dyn Fn() -> Result<(), String>,
                       found: &mut Vec<Finding>|
         -> Result<(), String> {
            act()?;
            taken.push(step);
            *found = door::findings(ctx, roots);
            Ok(())
        };
        let outcome = (|| {
            if copy {
                ran(
                    "copy",
                    &|| door::repair(ctx, roots, "copy-to-destination").map(|_| ()),
                    &mut found,
                )?;
            }
            if !of(&found, MISPLACED_ROW, true, &is_global).is_empty() {
                ran("finish", &|| migrate(root, true, true, false), &mut found)?;
            }
            if !of(&found, LEGACY_ROW, true, &is_global).is_empty() {
                ran(
                    "convert-global",
                    &|| migrate(root, true, false, true),
                    &mut found,
                )?;
            }
            if !of(&found, LEGACY_ROW, false, &is_global).is_empty() {
                ran(
                    "convert-project",
                    &|| migrate(root, false, false, false),
                    &mut found,
                )?;
            }
            Ok::<(), String>(())
        })();
        if let Err(why) = outcome {
            if !is_write_refusal(&why) {
                return Err(why);
            }
            let first = why.lines().next().unwrap_or_default();
            return Ok(Legacy {
                steps: taken,
                note: None,
                warning: Some(format!(
                    "legacy config not moved: {first}; run `fgos init` where the home is writable"
                )),
            });
        }
        let global_moved = taken.iter().any(|step| *step != "convert-project");
        Ok(Legacy {
            note: global_moved.then(|| GLOBAL_MOVED_NOTE.to_owned()),
            steps: taken,
            warning: None,
        })
    }
}

/// One call end to end: a home to write the machine files under, then the steps.
pub fn serve(request: &InitRequest, steps: &dyn Steps) -> Result<Done, CategorisedRefusal> {
    if fgos_config::machine::home_dir(env_lookup).is_none() {
        return Err(CategorisedRefusal::new(
            "precondition",
            fgos_config::machine::home_unset_message(),
        ));
    }
    run(steps, &request.root)
}

/// The provider of `init.run`.
pub struct InitProvider {
    descriptor: ProviderDescriptor,
}

impl InitProvider {
    pub fn new() -> Self {
        Self {
            descriptor: DESCRIPTOR,
        }
    }
}

impl Default for InitProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for InitProvider {
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
                .downcast_ref::<InitRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not InitRequest".into())
                })?
                .clone();
            // The Work step starts and waits for a child process: never on the async worker.
            let served = tokio::task::spawn_blocking(move || {
                let live = Live::new(fgos_holder_lock::state_root().0, NodeBridge::new());
                serve(&request, &live)
            })
            .await
            .map_err(|error| ProviderError::ProviderFailed(error.to_string()))?;
            let answered: Box<dyn std::any::Any + Send> = match served {
                Ok(Done::Data(data)) => Box::new(JsonOutcome(
                    serde_json::to_value(*data)
                        .map_err(|error| ProviderError::ProviderFailed(error.to_string()))?,
                )),
                // Ended by a signal: nothing is printed, the process ends as a signalled one does.
                Ok(Done::Interrupted(signal)) => Box::new(VerbAnswer {
                    data: Value::Null,
                    exit: 128 + signal,
                    text: Some(String::new()),
                }),
                Err(refusal) => Box::new(refusal),
            };
            Ok(ProviderOutcome::completed(
                DESCRIPTOR.outcome_contract.clone(),
                answered,
            ))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    /// A port that records the order of the calls and answers what the test sets.
    #[derive(Default)]
    struct Fake {
        calls: RefCell<Vec<&'static str>>,
        work_store: bool,
        fail_at: Option<&'static str>,
        legacy: Legacy,
        harnesses: Vec<Value>,
        config: Option<Value>,
        headless: bool,
        recovery: Option<Result<Option<Value>, String>>,
        interrupted: Option<i32>,
        work_failure: Option<StepFailure>,
    }

    impl Fake {
        fn note(&self, call: &'static str) -> Result<(), StepFailure> {
            self.calls.borrow_mut().push(call);
            match self.fail_at {
                Some(at) if at == call => Err(StepFailure::plain(format!("{call} failed"))),
                _ => Ok(()),
            }
        }
        fn calls(&self) -> Vec<&'static str> {
            self.calls.borrow().clone()
        }
    }

    impl Steps for Fake {
        fn mint_machine_id(&self) -> Result<(), StepFailure> {
            self.note("machine-id")
        }
        fn settle_legacy_config(&self, _: &Path) -> Result<Legacy, StepFailure> {
            self.note("legacy-config")?;
            Ok(self.legacy.clone())
        }
        fn work_store_supported(&self) -> bool {
            self.work_store
        }
        fn fix_lock_dirs(&self, _: &Path) -> Result<(), StepFailure> {
            self.note("lock-dirs")
        }
        fn create_work_store(&self, _: &Path) -> Result<(), StepFailure> {
            self.note("work-store")?;
            self.work_failure.clone().map_or(Ok(()), Err)
        }
        fn interrupted(&self) -> Option<i32> {
            self.interrupted
        }
        fn write_coexistence(&self, _: &Path, _: &Path) -> Vec<Value> {
            self.calls.borrow_mut().push("coexistence");
            self.harnesses.clone()
        }
        fn create_config_files(&self, _: &Path) -> Value {
            self.calls.borrow_mut().push("config-files");
            self.config.clone().unwrap_or_else(|| json!({}))
        }
        fn headless(&self, _: &Path) -> bool {
            self.calls.borrow_mut().push("head");
            self.headless
        }
        fn recover_git(&self, _: &Path) -> Result<Option<Value>, String> {
            self.calls.borrow_mut().push("git-recovery");
            self.recovery.clone().unwrap_or(Ok(None))
        }
    }

    fn data(done: Result<Done, CategorisedRefusal>) -> InitData {
        match done.expect("init ran") {
            Done::Data(data) => *data,
            other => panic!("{other:?}"),
        }
    }

    #[test]
    fn the_steps_run_in_the_order_of_the_module_and_the_work_store_after_the_lock_directories() {
        let fake = Fake {
            work_store: true,
            ..Fake::default()
        };
        data(run(&fake, Path::new("/p")));
        assert_eq!(
            fake.calls(),
            [
                "machine-id",
                "legacy-config",
                "lock-dirs",
                "work-store",
                "coexistence",
                "config-files",
                "head",
                "git-recovery"
            ]
        );
    }

    #[test]
    fn without_an_event_store_the_work_steps_are_left_out_and_the_answer_says_so() {
        let fake = Fake::default();
        let answer = data(run(&fake, Path::new("/p")));
        assert_eq!(
            fake.calls(),
            [
                "machine-id",
                "legacy-config",
                "coexistence",
                "config-files",
                "head",
                "git-recovery"
            ]
        );
        assert_eq!(answer.work_store, Some("unsupported-platform"));
        assert!(answer
            .work_store_note
            .unwrap()
            .starts_with("Work is not available on this platform"));
    }

    #[test]
    fn only_the_machine_id_the_legacy_settle_and_the_work_steps_refuse_and_nothing_after_them_runs()
    {
        for (at, ran) in [
            ("machine-id", 1),
            ("legacy-config", 2),
            ("lock-dirs", 3),
            ("work-store", 4),
        ] {
            let fake = Fake {
                work_store: true,
                fail_at: Some(at),
                ..Fake::default()
            };
            let refusal = run(&fake, Path::new("/p")).unwrap_err();
            assert_eq!(refusal.message, format!("{at} failed"));
            assert_eq!(refusal.exit_code(), 1);
            assert_eq!(fake.calls().len(), ran, "{at}");
        }
    }

    #[test]
    fn a_work_store_refusal_keeps_the_category_the_payload_named() {
        let fake = Fake {
            work_store: true,
            work_failure: Some(work_store_failure(Fault::Refused {
                message: "lock held".into(),
                category: Some("lock-timeout".into()),
            })),
            ..Fake::default()
        };
        let refusal = run(&fake, Path::new("/p")).unwrap_err();
        assert_eq!(
            (refusal.category, refusal.message.as_str()),
            ("lock-timeout", "lock held")
        );
        assert_eq!(refusal.exit_code(), 7);
        let unnamed = work_store_failure(Fault::Refused {
            message: "boom".into(),
            category: Some("not-a-category".into()),
        });
        assert_eq!(unnamed.refusal().exit_code(), 1);
    }

    #[test]
    fn a_missing_node_is_a_missing_precondition_and_a_failed_payload_an_unexpected_failure() {
        let missing = work_store_failure(Fault::NodeMissing("no such file".into())).refusal();
        assert_eq!(missing.exit_code(), 2);
        assert!(
            missing.message.contains("Node 18 or newer"),
            "{}",
            missing.message
        );
        let failed = work_store_failure(Fault::Failed("no answer within 600 s".into())).refusal();
        assert_eq!(failed.exit_code(), 1);
        assert!(failed.message.starts_with("the Work store step failed:"));
    }

    #[test]
    fn a_signal_during_the_work_step_ends_the_call_as_a_signalled_process_does() {
        let fake = Fake {
            work_store: true,
            work_failure: Some(StepFailure::plain("killed")),
            interrupted: Some(15),
            ..Fake::default()
        };
        assert_eq!(run(&fake, Path::new("/p")), Ok(Done::Interrupted(15)));
        assert_eq!(
            fake.calls(),
            ["machine-id", "legacy-config", "lock-dirs", "work-store"]
        );
    }

    #[test]
    fn the_later_steps_never_refuse_their_trouble_is_in_the_answer() {
        let fake = Fake {
            legacy: Legacy {
                steps: vec!["copy", "finish"],
                note: Some(GLOBAL_MOVED_NOTE.into()),
                warning: None,
            },
            harnesses: vec![json!({"name": "claude", "markers": [".claude"]})],
            config: Some(
                json!({"warning": "config files not created: config-io (PermissionDenied)"}),
            ),
            headless: true,
            recovery: Some(Err("git-fence-missing".into())),
            ..Fake::default()
        };
        let answer = serde_json::to_value(data(run(&fake, Path::new("/p")))).unwrap();
        assert_eq!(answer["dir"], "/p/.fgos");
        assert_eq!(answer["legacyConfig"], json!(["copy", "finish"]));
        assert_eq!(answer["legacyConfigNote"], GLOBAL_MOVED_NOTE);
        assert_eq!(answer["gitHeadless"], true);
        assert_eq!(
            answer["gitRecoveryWarning"],
            "Git recovery refused: git-fence-missing; run `fgos git recover`"
        );
        assert_eq!(answer["detectedHarnesses"][0]["name"], "claude");
        assert!(answer["config"]["warning"]
            .as_str()
            .unwrap()
            .starts_with("config files not created"));
    }

    #[test]
    fn the_answer_keeps_the_key_order_and_leaves_out_what_did_not_happen() {
        let keys = |value: Value| {
            value
                .as_object()
                .unwrap()
                .keys()
                .cloned()
                .collect::<Vec<_>>()
        };
        let plain = serde_json::to_value(data(run(
            &Fake {
                work_store: true,
                ..Fake::default()
            },
            Path::new("/p"),
        )))
        .unwrap();
        assert_eq!(keys(plain), ["dir", "detectedHarnesses", "config"]);
        let full = serde_json::to_value(data(run(
            &Fake {
                legacy: Legacy {
                    steps: vec!["convert-project"],
                    note: Some("n".into()),
                    warning: Some("w".into()),
                },
                headless: true,
                recovery: Some(Ok(Some(json!({"recovered": ["op"], "kept": []})))),
                ..Fake::default()
            },
            Path::new("/p"),
        )))
        .unwrap();
        assert_eq!(
            keys(full),
            [
                "dir",
                "detectedHarnesses",
                "legacyConfig",
                "legacyConfigNote",
                "legacyConfigWarning",
                "workStore",
                "workStoreNote",
                "config",
                "gitHeadless",
                "gitRecovery"
            ]
        );
    }

    #[test]
    fn the_request_is_the_root_the_doors_resolved() {
        let root = PathBuf::from("/the/project");
        let read = |args: &[&str]| {
            let args: Vec<OsString> = args.iter().map(OsString::from).collect();
            project_init_request(&args, Ok(root.clone())).unwrap()
        };
        assert_eq!(read(&["init"]).root, root);
        assert_eq!(read(&["init", "--dir", "/elsewhere"]).root, root);
        assert!(matches!(
            project_init_request(&[OsString::from("init")], Err("no root".into())),
            Err(ProjectError::Failed(message)) if message == "no root"
        ));
    }
}
