//! The doors around a native invocation, in the order the Node CLI runs them: the call is checked (the
//! sub-command, then the flags), the invocation root is resolved through the Git door, store access is admitted
//! through the Git door, the Event Store start trigger runs for a dispatched worker, the invocation runs (the
//! caller's), and the end trigger runs after its answer is presented. A malformed call is recorded through the
//! invocation-fault writer before it is reported; the record goes to the store the call already resolved, and to
//! the main checkout of the caller's directory before the root is known (a `--dir` naming another project never
//! diverts the record of a call that failed before it was read).
//!
//! Each decision lives in its owner: the root in `fgos_git::invocation_root`, admission in
//! `fgos_git::store_admission`, the fault record in `fgos_observe::invocation_fault`, the trigger policy in
//! `fgos_event_store::lifecycle`, the Event Store section in `fgos_config::event_store`. This module only orders
//! them.

use crate::legacy_exec::RECURSION_GUARD_VAR;
use crate::routing::{check_call, declared, Call, CommandRouteDescriptor};
use fgos_event_store::lifecycle::{self, Policy, Request, Timers};
use fgos_git::invocation_root::{resolve_invocation_root, InvocationRoot, RootPolicy, RootRequest};
use fgos_git::store_admission::{admit_store_access, AdmitRequest, StoreMode};
use fgos_observe::invocation_fault::{record, FaultInput};
use std::ffi::OsString;
use std::path::{Path, PathBuf};

/// The fault class of a trigger that failed at the start of an invocation.
const START_TRIGGER: &str = "event-store-start-trigger";
/// The fault class of a trigger that failed at the end of an invocation.
const END_TRIGGER: &str = "event-store-end-trigger";
/// The fault class of a detached seal or publish child that failed: it has no caller to read its error, so a
/// failure leaves a record whatever the verb's own classification is.
const EVENT_STORE_CHILD: &str = "event-store-child";

/// The Event Store lifecycle trigger as the doors call it: whether the store runs here at all, and one trigger
/// for the store of a project root. A trigger never fails its caller: it answers the first error it met.
pub trait Lifecycle {
    fn platform_supported(&self) -> bool;
    fn trigger(&self, root: &Path, policy: Policy) -> Option<String>;
}

/// The lifecycle of the real Event Store: the crate's policy, the `eventStore` config section and, when a publish
/// is due, the one detached child that does it.
pub struct EventStoreLifecycle;

impl Lifecycle for EventStoreLifecycle {
    fn platform_supported(&self) -> bool {
        lifecycle::platform_supported()
    }

    fn trigger(&self, root: &Path, policy: Policy) -> Option<String> {
        let main = match fgos_git::main_checkout_root(root) {
            Ok(Some(main)) => main,
            Ok(None) => return Some("main-checkout-not-found".into()),
            Err(error) => return Some(error.cause),
        };
        let config = match fgos_config::event_store::EventStoreConfig::read_project(
            &main,
            |key| std::env::var(key).ok(),
            false,
        ) {
            Ok(config) => config,
            Err(error) => return Some(error.code().to_owned()),
        };
        let timers = Timers {
            remote: config.remote,
            seal_interval_sec: config.seal_interval_sec,
            sync_interval_sec: config.sync_interval_sec,
        };
        let (state_root, _) = fgos_holder_lock::state_root();
        let now_sec = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0.0, |elapsed| elapsed.as_secs_f64());
        let outcome = lifecycle::maintain(&Request {
            cwd: root,
            trusted_main: &main,
            state_root: &state_root,
            timers: &timers,
            policy,
            held_ranks: &[],
            hot_lock_depth: 0,
            now_sec,
        });
        let mut error = outcome.error;
        if outcome.sync_due {
            if let Err(cause) = spawn_sync_child(&main) {
                error.get_or_insert(format!("event-store-sync-child: {cause}"));
            }
        }
        error
    }
}

/// The arguments of the detached publish child after the host's own executable.
fn sync_child_args(main: &Path) -> Vec<OsString> {
    vec![
        "events".into(),
        "sync".into(),
        "--opportunistic".into(),
        "--dir".into(),
        main.as_os_str().to_owned(),
    ]
}

/// The variables the publish child must not inherit: the recursion guard (a host started under a legacy payload
/// inherits it, and the child, an `events` call served by that payload, would end at once).
const SYNC_CHILD_ENV_REMOVE: [&str; 1] = [RECURSION_GUARD_VAR];

/// Starts the one detached child that publishes for this clone. Only reached where the Event Store runs.
#[cfg(unix)]
fn spawn_sync_child(main: &Path) -> std::io::Result<()> {
    let exe = std::env::current_exe()?;
    let mut argv = vec![exe.into_os_string()];
    argv.extend(sync_child_args(main));
    fgos_process::mapped::spawn_detached(&argv, main, &[], &SYNC_CHILD_ENV_REMOVE, None).map(drop)
}

/// No detached spawn off Unix: the Event Store does not run there, so no trigger reaches this.
#[cfg(not(unix))]
fn spawn_sync_child(_main: &Path) -> std::io::Result<()> {
    Err(std::io::Error::other("no detached spawn on this platform"))
}

/// Records one fault of a call through the invocation-fault writer; `None` when there is nowhere to record.
fn record_fault(
    cwd: &Path,
    cli_args: &[OsString],
    store: Option<&Path>,
    verb: Option<&str>,
    sub: Option<&str>,
    class: &str,
    message: &str,
) -> Option<PathBuf> {
    let argv: Vec<String> = cli_args
        .iter()
        .map(|token| token.to_string_lossy().into_owned())
        .collect();
    record(&FaultInput {
        fgos_dir: store,
        cwd,
        verb,
        sub,
        fault_class: class,
        message,
        argv: &argv,
    })
}

/// The fault class of a verb the route table does not list.
const UNKNOWN_VERB: &str = "unknown-verb";

/// Records a call whose verb has no route, in the store of the caller's directory.
pub fn record_unknown_verb(verb: &str, cli_args: &[OsString], message: &str) -> Option<PathBuf> {
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    record_fault(
        &cwd,
        cli_args,
        None,
        Some(verb),
        None,
        UNKNOWN_VERB,
        message,
    )
}

/// A call refused at a door: the text for stderr and the path of the fault record when one landed.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refused {
    pub message: String,
    pub recorded: Option<PathBuf>,
}

impl Refused {
    /// Prints the refusal the way the Node CLI does (`fgos: <text>`, then the record line when a record landed)
    /// and returns the validation exit code.
    pub fn report(&self) -> i32 {
        eprintln!("fgos: {}", self.message);
        if let Some(path) = &self.recorded {
            eprintln!("fgos: invocation fault recorded to {}", path.display());
        }
        fgos_host_runtime::exit_codes::validation()
    }
}

/// What a call that passed the doors carries to the invocation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Entered {
    pub root: InvocationRoot,
    /// The project a native operation that reads a project acts on, or why there is none (the refusal such an
    /// operation reports; one that reads no project never looks).
    pub project: Result<PathBuf, String>,
    sub: Option<String>,
    opens_store: bool,
    /// The call is itself a detached seal or publish child of the Event Store.
    child: bool,
}

/// How a native invocation ended, as the doors need it: the exit status, and the verb's failure text when it
/// refused or failed (a verb that only exits non-zero with its own answer carries none).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ended {
    pub code: i32,
    pub failure: Option<String>,
}

/// The doors of one native call.
pub struct Doors<'a> {
    route: &'a CommandRouteDescriptor,
    call: &'a Call,
    cli_args: &'a [OsString],
    cwd: PathBuf,
    home: Option<PathBuf>,
    dispatched: bool,
    lifecycle: &'a dyn Lifecycle,
}

impl<'a> Doors<'a> {
    pub fn new(
        route: &'a CommandRouteDescriptor,
        call: &'a Call,
        cli_args: &'a [OsString],
        lifecycle: &'a dyn Lifecycle,
    ) -> Self {
        Self::at(
            route,
            call,
            cli_args,
            std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
            fgos_config::machine::home_dir(|key| std::env::var(key).ok()),
            dispatch_depth(std::env::var("FGOS_DISPATCH_DEPTH").ok().as_deref()) > 0,
            lifecycle,
        )
    }

    pub fn at(
        route: &'a CommandRouteDescriptor,
        call: &'a Call,
        cli_args: &'a [OsString],
        cwd: PathBuf,
        home: Option<PathBuf>,
        dispatched: bool,
        lifecycle: &'a dyn Lifecycle,
    ) -> Self {
        Self {
            route,
            call,
            cli_args,
            cwd,
            home,
            dispatched,
            lifecycle,
        }
    }

    /// Records one fault of this call. `store` is the store the call already resolved, when it did.
    fn fault(
        &self,
        store: Option<&Path>,
        sub: Option<&str>,
        class: &str,
        message: &str,
    ) -> Option<PathBuf> {
        record_fault(
            &self.cwd,
            self.cli_args,
            store,
            Some(&self.route.selector),
            sub,
            class,
            message,
        )
    }

    fn refuse(
        &self,
        store: Option<&Path>,
        sub: Option<&str>,
        class: &str,
        message: String,
    ) -> Refused {
        let recorded = self.fault(store, sub, class, &message);
        Refused { message, recorded }
    }

    /// The doors before the invocation, in Node's order. A refusal is already recorded.
    pub fn enter(&self) -> Result<Entered, Refused> {
        let sub = check_call(self.route, self.call)
            .map_err(|fault| self.refuse(None, fault.sub.as_deref(), fault.class, fault.message))?;
        let dir = self.call.named_dir();
        let verb = self.route.selector.as_str();
        let verb_root = verb_root(verb);
        let policy = verb_root.policy;
        let store_mode = StoreMode::parse(self.route.store.as_deref().unwrap_or("none"));
        let child = declared(&self.route.event_store_child, self.call);
        // A verb that ignores `--dir` still has the flag checked (an empty value is refused), but acts on the root
        // of the caller's directory.
        let root_dir = dir
            .as_deref()
            .filter(|named| !verb_root.ignores_dir || named.trim().is_empty());
        let asked = resolve_invocation_root(&RootRequest {
            cwd: &self.cwd,
            dir: root_dir,
            policy,
            home: self.home.as_deref(),
        });
        // A root the Git door refuses (untrusted or submodule checkout, `--dir ""`) is `dir-invalid` for every
        // verb, as in the Node CLI. Debt: the eight native verbs of today keep answering from wherever they are
        // called (their documented answers, e.g. the mailbox's `unsupported-checkout`), so for exactly these the
        // refusal reaches only an operation that reads a project, as its not-a-project answer. Any other verb,
        // whatever its store value, is refused. The list is the `lenient_on_refused_root` column of `VERB_ROOTS`.
        let (root, project) = match asked {
            Ok(root) if verb_root.acts_on_resolved => {
                let project = Ok(root.root.clone());
                (root, project)
            }
            Ok(root) => {
                let project = project_root(dir.as_deref(), &root, &self.cwd, self.home.as_deref());
                (root, project)
            }
            Err(refusal) if store_mode == StoreMode::None && verb_root.lenient_on_refused_root => (
                InvocationRoot {
                    root: self.cwd.clone(),
                    fgos_dir: self.cwd.join(".fgos"),
                    found: false,
                },
                Err(format!("{} [not-in-project]", refusal.message)),
            ),
            Err(refusal) => {
                return Err(self.refuse(None, sub.as_deref(), refusal.fault_class, refusal.message))
            }
        };
        let admitted = admit_store_access(&AdmitRequest {
            verb,
            store_mode,
            mutates: declared(&self.route.mutates_store, self.call),
            creates: verb_root.creates_store,
            explicit_dir: dir.is_some(),
            dir: &root.fgos_dir,
            cwd: &self.cwd,
        })
        .map_err(|refusal| {
            self.refuse(
                Some(&root.fgos_dir),
                sub.as_deref(),
                refusal.fault_class,
                refusal.message,
            )
        })?;
        if let Some(warning) = admitted.warning {
            eprint!("{warning}");
        }
        // A read that found no store opens nothing, so no lifecycle trigger has a store to run against; its
        // refusal would otherwise land in whichever store the fault log resolves to.
        let opens_store = store_mode != StoreMode::None
            && !child
            && !(store_mode == StoreMode::Read && !root.found);
        let entered = Entered {
            project,
            root,
            sub,
            opens_store,
            child,
        };
        if entered.opens_store && self.dispatched && !verb_root.creates_store {
            self.trigger(&entered, START_TRIGGER, Policy::default());
        }
        Ok(entered)
    }

    /// The doors after the invocation, once its answer has been presented: the end trigger, and, for a detached
    /// seal or publish child that failed, the record of why (the failure text, as the Node CLI records it).
    pub fn leave(&self, entered: &Entered, ended: &Ended) {
        if let (true, Some(message)) = (entered.child, &ended.failure) {
            self.fault(
                Some(&entered.root.fgos_dir),
                entered.sub.as_deref(),
                EVENT_STORE_CHILD,
                message,
            );
        }
        if entered.opens_store {
            self.trigger(
                entered,
                END_TRIGGER,
                Policy {
                    end: true,
                    ..Policy::default()
                },
            );
        }
    }

    /// One Event Store trigger. It runs only where the store runs, never fails the invocation, and records the
    /// error it met under `class`.
    fn trigger(&self, entered: &Entered, class: &str, policy: Policy) {
        if !self.lifecycle.platform_supported() {
            return;
        }
        let policy = Policy {
            dispatched: self.dispatched,
            ..policy
        };
        if let Some(error) = self.lifecycle.trigger(&entered.root.root, policy) {
            self.fault(
                Some(&entered.root.fgos_dir),
                entered.sub.as_deref(),
                class,
                &error,
            );
        }
    }
}

/// How a verb meets its root: one row of `VERB_ROOTS` per verb that is not an ordinary reader of the nearest
/// project.
#[derive(Clone, Copy)]
struct VerbRoot {
    /// How the verb picks its root: `init` creates a store, so it acts where it is run; `doctor`, `wire-agents` and
    /// `uninstall` act on the main checkout whichever worktree they are run from; every other verb acts on the
    /// nearest project above the caller.
    policy: RootPolicy,
    /// Whether the verb acts on the root the door resolved even when no `.fgos` is there yet: `doctor` judges a
    /// project that has not been set up, and says so, and `uninstall` reverses what it finds there, instead of
    /// refusing.
    acts_on_resolved: bool,
    /// Whether the verb accepts `--dir` and never acts on it: `wire-agents` changes the person's own agent config
    /// and reads only the main checkout of where it is run.
    ignores_dir: bool,
    /// Whether the verb creates the store it acts on.
    creates_store: bool,
    /// Debt: the native verbs written before the invocation doors. When the Git door refuses the root of a call (an
    /// untrusted or submodule checkout, `--dir ""`) they keep answering from where they are called, because their
    /// documented answers (the mailbox's `unsupported-checkout`, `apps/fgos/tests/mailbox_routes.rs`) depend on it;
    /// every other verb is refused. A verb is never added.
    lenient_on_refused_root: bool,
}

/// An ordinary reader of the nearest project above the caller.
const READER: VerbRoot = VerbRoot {
    policy: RootPolicy::CallerTree,
    acts_on_resolved: false,
    ignores_dir: false,
    creates_store: false,
    lenient_on_refused_root: false,
};

const LENIENT_READER: VerbRoot = VerbRoot {
    lenient_on_refused_root: true,
    ..READER
};

const MAIN_CHECKOUT_VERB: VerbRoot = VerbRoot {
    policy: RootPolicy::MainCheckout,
    acts_on_resolved: true,
    ..READER
};

/// Every verb whose root is not that of an ordinary reader.
const VERB_ROOTS: [(&str, VerbRoot); 12] = [
    (
        "init",
        VerbRoot {
            policy: RootPolicy::StrictCwd,
            creates_store: true,
            ..READER
        },
    ),
    (
        "wire-agents",
        VerbRoot {
            ignores_dir: true,
            ..MAIN_CHECKOUT_VERB
        },
    ),
    ("doctor", MAIN_CHECKOUT_VERB),
    ("uninstall", MAIN_CHECKOUT_VERB),
    ("config", LENIENT_READER),
    ("convention", LENIENT_READER),
    ("friction", LENIENT_READER),
    ("gate-bypass", LENIENT_READER),
    ("identity", LENIENT_READER),
    ("mailbox", LENIENT_READER),
    ("metrics", LENIENT_READER),
    ("version", LENIENT_READER),
];

fn verb_root(verb: &str) -> VerbRoot {
    VERB_ROOTS
        .iter()
        .find(|(name, _)| *name == verb)
        .map_or(READER, |(_, row)| *row)
}

/// `FGOS_DISPATCH_DEPTH` as the Node CLI reads it: a non-negative finite number, else 0.
fn dispatch_depth(raw: Option<&str>) -> u64 {
    raw.filter(|raw| !raw.is_empty())
        .and_then(|raw| raw.trim().parse::<f64>().ok())
        .filter(|n| n.is_finite() && *n >= 0.0)
        .map_or(0, |n| n as u64)
}

/// The project a native operation that reads a project acts on. A named `--dir` is the project (the home
/// directory excepted: its `.fgos` is the machine's global directory, never a project store); without one it is
/// the root the door found, and finding none is refused naming the fix.
fn project_root(
    dir: Option<&str>,
    root: &InvocationRoot,
    cwd: &Path,
    home: Option<&Path>,
) -> Result<PathBuf, String> {
    if let Some(dir) = dir {
        let home_canonical = home.and_then(|h| std::fs::canonicalize(h).ok());
        let is_home = |path: &Path| {
            home.is_some_and(|h| path == h) || home_canonical.as_deref().is_some_and(|h| path == h)
        };
        let named = Path::new(dir);
        let canonical = std::fs::canonicalize(named).unwrap_or_else(|_| named.to_path_buf());
        if is_home(named) || is_home(&canonical) {
            return Err(format!(
                "--dir {dir} is the home directory: its .fgos is the machine's global directory, never a project store; pass the project root [not-in-project]"
            ));
        }
        return Ok(root.root.clone());
    }
    if root.found {
        return Ok(root.root.clone());
    }
    Err(format!(
        "not inside an fgOS project: no .fgos directory above {} (the home directory's .fgos is the machine's global directory, never a project store) -- run the command inside a project, pass --dir <project root>, or run 'fgctl init' in the project [not-in-project]",
        cwd.display()
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;
    use std::sync::atomic::{AtomicU32, Ordering};

    /// A lifecycle that records what the doors asked of it.
    struct Recorder {
        supported: bool,
        calls: RefCell<Vec<(PathBuf, Policy)>>,
        error: Option<String>,
    }

    impl Recorder {
        fn new(supported: bool) -> Self {
            Self {
                supported,
                calls: RefCell::new(Vec::new()),
                error: None,
            }
        }
    }

    impl Lifecycle for Recorder {
        fn platform_supported(&self) -> bool {
            self.supported
        }
        fn trigger(&self, root: &Path, policy: Policy) -> Option<String> {
            self.calls.borrow_mut().push((root.to_path_buf(), policy));
            self.error.clone()
        }
    }

    fn scratch() -> PathBuf {
        static NEXT: AtomicU32 = AtomicU32::new(0);
        let dir = std::env::temp_dir().join(format!(
            "fgos-doors-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::SeqCst)
        ));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        // Canonical, without the `\\?\` form Windows adds: the doors answer plain paths there and `/` or `..` in a
        // verbatim path is not read as a separator.
        let canonical = std::fs::canonicalize(dir).unwrap();
        match canonical.to_str().and_then(|p| p.strip_prefix(r"\\?\")) {
            Some(plain) => PathBuf::from(plain),
            None => canonical,
        }
    }

    /// A main checkout laid out on disk the way the host reads it (no Git process): `main/.git` and a store,
    /// plus a linked worktree `wt` carrying a real `.fgos` snapshot when `snapshot` is set.
    fn repository(base: &Path, snapshot: bool) {
        let git = base.join("main/.git");
        std::fs::create_dir_all(git.join("worktrees/wt")).unwrap();
        std::fs::create_dir_all(base.join("main/.fgos")).unwrap();
        let admin = git.join("worktrees/wt");
        std::fs::write(admin.join("commondir"), "../..\n").unwrap();
        std::fs::create_dir_all(base.join("wt")).unwrap();
        let gitfile = base.join("wt/.git");
        std::fs::write(admin.join("gitdir"), format!("{}\n", gitfile.display())).unwrap();
        std::fs::write(gitfile, format!("gitdir: {}\n", admin.display())).unwrap();
        if snapshot {
            std::fs::create_dir_all(base.join("wt/.fgos")).unwrap();
        }
    }

    fn route(json: serde_json::Value) -> CommandRouteDescriptor {
        let mut route = serde_json::json!({
            "selector": "probe", "route_kind": "native", "operation_id": "probe.run",
            "owner_path": "x", "compatibility_tests": ["x"],
            "accepted_flags": ["dir", "json", "help"],
        });
        route
            .as_object_mut()
            .unwrap()
            .extend(json.as_object().unwrap().clone());
        serde_json::from_value(route).unwrap()
    }

    fn args(rest: &[&str]) -> Vec<OsString> {
        std::iter::once("probe")
            .chain(rest.iter().copied())
            .map(OsString::from)
            .collect()
    }

    fn doors<'a>(
        route: &'a CommandRouteDescriptor,
        call: &'a Call,
        cli_args: &'a [OsString],
        cwd: &Path,
        dispatched: bool,
        lifecycle: &'a dyn Lifecycle,
    ) -> Doors<'a> {
        Doors::at(
            route,
            call,
            cli_args,
            cwd.to_path_buf(),
            None,
            dispatched,
            lifecycle,
        )
    }

    fn finished() -> Ended {
        Ended {
            code: 0,
            failure: None,
        }
    }

    fn records(store: &Path) -> Vec<serde_json::Value> {
        std::fs::read_to_string(store.join("logs/invocation-faults.jsonl"))
            .unwrap_or_default()
            .lines()
            .map(|line| serde_json::from_str(line).unwrap())
            .collect()
    }

    #[test]
    fn an_unknown_flag_is_recorded_in_the_store_of_the_callers_directory_never_the_one_dir_names() {
        let base = scratch();
        repository(&base, false);
        std::fs::create_dir_all(base.join("other/.fgos")).unwrap();
        let route = route(serde_json::json!({}));
        let argv = args(&["--bogus", "--dir", base.join("other").to_str().unwrap()]);
        let call = Call::new(&argv);
        let lifecycle = Recorder::new(true);
        let refused = doors(&route, &call, &argv, &base.join("main"), false, &lifecycle)
            .enter()
            .unwrap_err();
        let log = base.join("main/.fgos/logs/invocation-faults.jsonl");
        assert_eq!(refused.recorded.as_deref(), Some(log.as_path()));
        assert!(refused
            .message
            .starts_with("unknown flag \"--bogus\" for \"fgos probe\""));
        let landed = records(&base.join("main/.fgos"));
        assert_eq!(landed.len(), 1);
        assert_eq!(landed[0]["faultClass"], "unknown-flag");
        assert!(records(&base.join("other/.fgos")).is_empty());
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn an_unrecorded_refusal_names_no_record_and_prints_no_record_line() {
        let base = scratch();
        let plain = base.join("plain");
        std::fs::create_dir_all(&plain).unwrap();
        let route = route(serde_json::json!({}));
        let argv = args(&["--bogus"]);
        let call = Call::new(&argv);
        let lifecycle = Recorder::new(true);
        let refused = doors(&route, &call, &argv, &plain, false, &lifecycle)
            .enter()
            .unwrap_err();
        assert_eq!(
            refused.recorded, None,
            "no store anywhere: nothing to record in"
        );
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn a_verb_that_needs_a_store_is_refused_and_recorded_when_dir_names_a_project_without_one() {
        let base = scratch();
        repository(&base, false);
        std::fs::create_dir_all(base.join("bare")).unwrap();
        let route = route(serde_json::json!({"store": "require"}));
        let argv = args(&["--dir", base.join("bare").to_str().unwrap()]);
        let call = Call::new(&argv);
        let lifecycle = Recorder::new(true);
        let refused = doors(&route, &call, &argv, &base.join("main"), false, &lifecycle)
            .enter()
            .unwrap_err();
        assert!(
            refused.message.starts_with(".fgos/ not found at "),
            "{}",
            refused.message
        );
        let landed = records(&base.join("main/.fgos"));
        assert_eq!(
            landed.len(),
            1,
            "the record lands in the caller's store: {refused:?}"
        );
        assert_eq!(landed[0]["faultClass"], "store-missing");
        assert!(lifecycle.calls.borrow().is_empty());
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn a_read_of_a_missing_store_from_a_linked_worktree_passes_with_a_warning_and_no_record() {
        let base = scratch();
        repository(&base, false);
        let route = route(serde_json::json!({"store": "read"}));
        let argv = args(&[]);
        let call = Call::new(&argv);
        let lifecycle = Recorder::new(true);
        let entered = doors(&route, &call, &argv, &base.join("wt"), false, &lifecycle)
            .enter()
            .expect("a read warns and runs");
        assert!(!entered.root.found);
        assert!(records(&base.join("main/.fgos")).is_empty());
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn a_read_that_found_no_store_runs_no_trigger_and_records_no_refusal_in_the_main_store() {
        let base = scratch();
        repository(&base, false);
        let route = route(serde_json::json!({"store": "read"}));
        let argv = args(&[]);
        let call = Call::new(&argv);
        let lifecycle = Recorder {
            error: Some("event-store-refused".into()),
            ..Recorder::new(true)
        };
        let doors = doors(&route, &call, &argv, &base.join("wt"), true, &lifecycle);
        let entered = doors.enter().expect("a read warns and runs");
        doors.leave(&entered, &finished());
        assert!(lifecycle.calls.borrow().is_empty());
        assert!(records(&base.join("main/.fgos")).is_empty());
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn a_write_from_a_worktree_with_a_frozen_store_is_refused_by_its_class_and_recorded_there() {
        let base = scratch();
        repository(&base, true);
        let route = route(serde_json::json!({"store": "open", "mutates_store": true}));
        let argv = args(&[]);
        let call = Call::new(&argv);
        let lifecycle = Recorder::new(true);
        let refused = doors(&route, &call, &argv, &base.join("wt"), false, &lifecycle)
            .enter()
            .unwrap_err();
        assert!(
            refused.message.contains("disconnected snapshot"),
            "{}",
            refused.message
        );
        let landed = records(&base.join("wt/.fgos"));
        assert_eq!(landed[0]["faultClass"], "disconnected-worktree-store");
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn a_dispatched_invocation_that_opens_the_store_runs_both_triggers_where_the_store_runs() {
        let base = scratch();
        repository(&base, false);
        let route = route(serde_json::json!({"store": "open"}));
        let argv = args(&[]);
        let call = Call::new(&argv);
        for (supported, dispatched, expected) in [
            (true, true, vec![false, true]),
            (true, false, vec![true]),
            (false, true, vec![]),
        ] {
            let lifecycle = Recorder::new(supported);
            let doors = doors(
                &route,
                &call,
                &argv,
                &base.join("main"),
                dispatched,
                &lifecycle,
            );
            let entered = doors.enter().unwrap();
            doors.leave(&entered, &finished());
            let ends: Vec<bool> = lifecycle
                .calls
                .borrow()
                .iter()
                .map(|(_, p)| p.end)
                .collect();
            assert_eq!(
                ends, expected,
                "supported {supported}, dispatched {dispatched}"
            );
            assert!(lifecycle
                .calls
                .borrow()
                .iter()
                .all(|(_, p)| p.dispatched == dispatched));
        }
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn an_invocation_that_needs_no_store_and_a_publish_child_run_no_trigger() {
        let base = scratch();
        repository(&base, false);
        let argv = args(&[]);
        let call = Call::new(&argv);
        for route in [
            route(serde_json::json!({"store": "none"})),
            route(serde_json::json!({"store": "open", "event_store_child": true})),
        ] {
            let lifecycle = Recorder::new(true);
            let doors = doors(&route, &call, &argv, &base.join("main"), true, &lifecycle);
            let entered = doors.enter().unwrap();
            doors.leave(&entered, &finished());
            assert!(lifecycle.calls.borrow().is_empty());
        }
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn a_trigger_error_is_recorded_under_its_class_and_never_fails_the_invocation() {
        let base = scratch();
        repository(&base, false);
        let route = route(serde_json::json!({"store": "open"}));
        let argv = args(&[]);
        let call = Call::new(&argv);
        let lifecycle = Recorder {
            error: Some("event-store-integrity".into()),
            ..Recorder::new(true)
        };
        let doors = doors(&route, &call, &argv, &base.join("main"), true, &lifecycle);
        let entered = doors.enter().unwrap();
        doors.leave(&entered, &finished());
        let classes: Vec<String> = records(&base.join("main/.fgos"))
            .iter()
            .map(|r| r["faultClass"].as_str().unwrap().to_owned())
            .collect();
        assert_eq!(
            classes,
            ["event-store-start-trigger", "event-store-end-trigger"]
        );
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn a_root_the_door_refuses_stops_a_verb_with_a_store_and_only_reaches_a_project_reader_otherwise(
    ) {
        let base = scratch();
        repository(&base, false);
        let argv = args(&["--dir", ""]);
        let call = Call::new(&argv);
        let lifecycle = Recorder::new(true);
        let none = route(serde_json::json!({"selector": "config", "store": "none"}));
        let entered = doors(&none, &call, &argv, &base.join("main"), false, &lifecycle)
            .enter()
            .expect("a verb with no store still runs");
        assert!(entered.project.unwrap_err().contains("non-empty path"));
        let open = route(serde_json::json!({"store": "open"}));
        let refused = doors(&open, &call, &argv, &base.join("main"), false, &lifecycle)
            .enter()
            .unwrap_err();
        assert!(
            refused.message.contains("non-empty path"),
            "{}",
            refused.message
        );
        assert_eq!(
            records(&base.join("main/.fgos"))[0]["faultClass"],
            "dir-invalid"
        );
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn wire_agents_acts_on_the_main_checkout_of_the_callers_directory_whatever_dir_names() {
        let base = scratch();
        repository(&base, false);
        std::fs::create_dir_all(base.join("elsewhere")).unwrap();
        let wire = route(serde_json::json!({"selector": "wire-agents", "store": "none"}));
        let lifecycle = Recorder::new(true);
        let main = base.join("main");
        for rest in [
            vec![],
            vec!["--dir", base.join("elsewhere").to_str().unwrap()],
            vec!["--dir", "/nonexistent/fgos-project"],
        ] {
            let argv = args(&rest);
            let call = Call::new(&argv);
            let entered = doors(&wire, &call, &argv, &base.join("main"), false, &lifecycle)
                .enter()
                .unwrap();
            assert_eq!(entered.project, Ok(main.clone()), "{rest:?}");
        }
        // the flag is still checked: an empty value is refused with the door's own class
        let argv = args(&["--dir", ""]);
        let call = Call::new(&argv);
        let refused = doors(&wire, &call, &argv, &base.join("main"), false, &lifecycle)
            .enter()
            .unwrap_err();
        assert!(refused.message.contains("non-empty path"));
        assert_eq!(
            records(&base.join("main/.fgos"))[0]["faultClass"],
            "dir-invalid"
        );
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn only_the_listed_native_verbs_take_the_lenient_root_arm() {
        let base = scratch();
        repository(&base, false);
        let argv = args(&["--dir", ""]);
        let call = Call::new(&argv);
        let lifecycle = Recorder::new(true);
        // A store-less verb that is not on the list is refused by the door like any other.
        let other = route(serde_json::json!({"selector": "git", "store": "none"}));
        let refused = doors(&other, &call, &argv, &base.join("main"), false, &lifecycle)
            .enter()
            .unwrap_err();
        assert!(
            refused.message.contains("non-empty path"),
            "{}",
            refused.message
        );
        assert_eq!(
            records(&base.join("main/.fgos"))[0]["faultClass"],
            "dir-invalid"
        );
        // The list is exactly the eight verbs written before the doors: it never grows, and a stale name shows here.
        let lenient: Vec<&str> = VERB_ROOTS
            .iter()
            .filter(|(_, row)| row.lenient_on_refused_root)
            .map(|(name, _)| *name)
            .collect();
        assert_eq!(
            lenient,
            [
                "config",
                "convention",
                "friction",
                "gate-bypass",
                "identity",
                "mailbox",
                "metrics",
                "version"
            ]
        );
        for verb in lenient {
            let route = &crate::routing::command_routes()[verb];
            assert_eq!(route.route_kind, "native", "{verb}");
            assert_eq!(route.store.as_deref().unwrap_or("none"), "none", "{verb}");
        }
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn a_verb_off_the_pre_door_list_reads_its_dir_from_the_shared_parser_and_a_bare_dir_is_refused()
    {
        let base = scratch();
        repository(&base, false);
        std::fs::create_dir_all(base.join("other/.fgos")).unwrap();
        let route = route(serde_json::json!({"store": "open"}));
        let lifecycle = Recorder::new(true);
        let other = base.join("other");
        let argv = args(&["--dir", other.to_str().unwrap()]);
        let call = Call::new(&argv);
        let entered = doors(&route, &call, &argv, &base.join("main"), false, &lifecycle)
            .enter()
            .expect("the named project is entered");
        assert_eq!(entered.root.root, other);
        // `--dir=<path>` is an unknown flag for it, not a project name.
        let spelled = args(&[&format!("--dir={}", other.display())]);
        let call = Call::new(&spelled);
        let refused = doors(
            &route,
            &call,
            &spelled,
            &base.join("main"),
            false,
            &lifecycle,
        )
        .enter()
        .unwrap_err();
        assert!(
            refused.message.contains("unknown flag \"--dir="),
            "{}",
            refused.message
        );
        // A bare `--dir` is the empty path, which the root door refuses.
        let bare = args(&["--dir"]);
        let call = Call::new(&bare);
        let refused = doors(&route, &call, &bare, &base.join("main"), false, &lifecycle)
            .enter()
            .unwrap_err();
        assert!(
            refused.message.contains("non-empty path"),
            "{}",
            refused.message
        );
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn a_failed_event_store_child_is_recorded_with_the_failure_text_and_a_successful_or_silent_one_is_not(
    ) {
        let base = scratch();
        repository(&base, false);
        let route = route(serde_json::json!({
            "selector": "events", "store": "open", "event_store_child": true,
            "accepted_flags": ["dir", "json", "help", "opportunistic"],
        }));
        let argv = args(&["--opportunistic"]);
        let call = Call::new(&argv);
        let lifecycle = Recorder::new(true);
        let doors = doors(&route, &call, &argv, &base.join("main"), true, &lifecycle);
        let entered = doors.enter().unwrap();
        for ended in [
            finished(),
            Ended {
                code: 1,
                failure: None,
            },
        ] {
            doors.leave(&entered, &ended);
        }
        assert!(records(&base.join("main/.fgos")).is_empty());
        doors.leave(
            &entered,
            &Ended {
                code: 1,
                failure: Some("seal failed: disk full".into()),
            },
        );
        let landed = records(&base.join("main/.fgos"));
        assert_eq!(landed.len(), 1);
        assert_eq!(landed[0]["faultClass"], "event-store-child");
        assert_eq!(landed[0]["message"], "seal failed: disk full");
        assert!(
            lifecycle.calls.borrow().is_empty(),
            "a child runs no trigger"
        );
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn the_publish_child_is_started_without_the_recursion_guard_and_with_its_own_arguments() {
        // The spawn door removes the named variables from a cleared environment (proved in the process crate's
        // `a_detached_child_gets_the_callers_environment_without_the_named_variables`); this pins what the host
        // names and hands on.
        assert_eq!(SYNC_CHILD_ENV_REMOVE, [RECURSION_GUARD_VAR]);
        assert_eq!(
            sync_child_args(Path::new("/p")),
            ["events", "sync", "--opportunistic", "--dir", "/p"]
        );
    }

    #[test]
    fn the_real_trigger_outside_a_repository_answers_an_error_code_and_does_not_panic() {
        let base = scratch();
        let policy = Policy::default();
        assert!(EventStoreLifecycle.trigger(&base, policy).is_some());
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn the_dispatch_depth_is_a_non_negative_finite_number_else_zero() {
        for (raw, depth) in [
            (None, 0),
            (Some(""), 0),
            (Some("2"), 2),
            (Some("-1"), 0),
            (Some("x"), 0),
            (Some("inf"), 0),
        ] {
            assert_eq!(dispatch_depth(raw), depth, "{raw:?}");
        }
    }

    #[test]
    fn the_project_is_the_dir_as_named_else_the_found_root_and_never_the_global_directory() {
        let base = scratch();
        let home = base.join("home");
        std::fs::create_dir_all(home.join(".fgos")).unwrap();
        std::fs::create_dir_all(home.join("work/repo")).unwrap();
        let none = InvocationRoot {
            root: home.join("work/repo"),
            fgos_dir: home.join("work/repo/.fgos"),
            found: false,
        };
        let err = project_root(None, &none, &home.join("work/repo"), Some(&home)).unwrap_err();
        assert!(
            err.starts_with("not inside an fgOS project") && err.contains("fgctl init"),
            "{err}"
        );
        let err =
            project_root(Some(home.to_str().unwrap()), &none, &home, Some(&home)).unwrap_err();
        assert!(err.contains("is the home directory"), "{err}");
        let spelled = format!("{}/work/..", home.display());
        assert!(project_root(Some(&spelled), &none, &home, Some(&home)).is_err());
        let found = InvocationRoot {
            found: true,
            ..none.clone()
        };
        assert_eq!(
            project_root(None, &found, &home, Some(&home)),
            Ok(home.join("work/repo"))
        );
        assert_eq!(
            project_root(Some("/x"), &none, &home, Some(&home)),
            Ok(none.root.clone())
        );
        std::fs::remove_dir_all(&base).unwrap();
    }
}
