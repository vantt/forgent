//! The Node rows bridge: how `fgos doctor` reaches the rows and fixes whose layers Node still owns.
//!
//! One bounded path, not a verb, route or `fgos internal` entry. The bodies live in the legacy payload's
//! `src/setup/doctor-bridge.mjs`, which this module starts as a script with the payload's Node through
//! `legacy_exec` (the payload is found only through the release manifest's `components.legacyNode`). Each call
//! writes one request (`phase`, `ids`, `dir`) on its stdin and reads one prefixed JSON line per result from its
//! stdout; the contract is `packages/distribution/contracts/doctor-bridge.v1.json`. Stray output of a body is
//! never read as a result because only prefixed lines count, and a crash keeps the results already produced.
//!
//! The same door carries one more request, `work-store-init`, for the Work store `fgos init` creates until the
//! Work layer moves (`work_store_init`): no rows, an `end` line when the store was made, a refusal line with the
//! error's text and exit category when it was not.
//!
//! The child is a bounded helper of one doctor run (or of one init), not a legacy route: it gets a fresh recursion guard
//! (a guard the host inherited does not stop it), leads its own process group so a deadline or a signal reaches
//! its whole tree, and writes no fault or lifecycle record. When Node is missing, the call fails, or the
//! deadline passes, every row of the call is a failure naming the cause and `next` names it once.

use crate::legacy_exec;
use fgos_distribution::doctor::{FixResult, RowOutcome, RowOwner, RowResult};
use serde::Deserialize;
use std::collections::HashMap;
use std::path::Path;
use std::process::Command;
use std::time::Duration;

/// The prefix of a result line; `src/setup/doctor-bridge.mjs` writes the same bytes.
const RESULT_PREFIX: &str = "\u{1e}FGOS-DOCTOR-BRIDGE ";
/// The module of the payload this bridge runs.
const BRIDGE_MODULE: &str = "src/setup/doctor-bridge.mjs";
/// How long the one call that judges every bridged row may run before its process tree is ended. Measured: the
/// whole bridged set takes about 2.5 s on a project and its slowest row about 1.3 s, so 30 s is more than ten
/// times what a healthy run needs.
pub const CHECK_DEADLINE: Duration = Duration::from_secs(30);
/// How long one call that runs a run of bridged fixes may run (the same bound; each fix is a small repair).
pub const FIX_DEADLINE: Duration = Duration::from_secs(30);
/// How long the Work store step of `fgos init` may run: it rebuilds the view from the whole log, which grows with
/// the project, so the bound is generous; a stuck child still never outlives its caller.
pub const WORK_STORE_DEADLINE: Duration = Duration::from_secs(600);
/// How much of the child's stderr a failure shows.
const STDERR_EXCERPT: usize = 400;

/// One line of the bridge's answer.
#[derive(Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
enum Line {
    Row {
        id: String,
        #[serde(flatten)]
        result: RowResult,
    },
    Fix(FixResult),
    End {
        count: usize,
        #[serde(default, rename = "nodeVersion")]
        node_version: Option<String>,
    },
    Refusal {
        message: String,
        #[serde(default)]
        category: Option<String>,
    },
}

/// Why a call to the bridge did not produce every answer it was asked for.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Fault {
    /// Node could not be started: it is not installed or not on PATH.
    NodeMissing(String),
    /// The call failed after it started: no payload, a crash, a deadline.
    Failed(String),
    /// The Node side refused the call and said why; `category` is the error's exit category when it had one.
    Refused {
        message: String,
        category: Option<String>,
    },
}

impl Fault {
    /// The row's own message.
    pub fn message(&self) -> String {
        match self {
            Fault::NodeMissing(cause) => format!(
                "Node is not available ({cause}); the doctor rows of the layers still written in Node need Node 18 or newer"
            ),
            Fault::Failed(cause) => format!("the Node rows bridge failed: {cause}"),
            Fault::Refused { message, .. } => {
                format!("the Node rows bridge failed: it refused the call: {message}")
            }
        }
    }

    /// The one entry of `next` for the whole run.
    pub fn next(&self) -> String {
        match self {
            Fault::NodeMissing(_) => {
                "install Node 18 or newer so the Node-owned doctor rows can run, then run fgos doctor again"
                    .to_owned()
            }
            Fault::Failed(cause) => {
                format!("the Node rows bridge failed ({cause}); run fgos doctor again")
            }
            Fault::Refused { message, .. } => format!(
                "the Node rows bridge failed (it refused the call: {message}); run fgos doctor again"
            ),
        }
    }
}

/// How the bridge's child is made: the production launcher runs the payload's module; a test gives its own.
pub type Launch = Box<dyn Fn() -> Result<Command, Fault> + Send + Sync>;

/// The bridge to the Node-owned rows.
pub struct NodeBridge {
    launch: Launch,
    check_deadline: Duration,
    fix_deadline: Duration,
    work_store_deadline: Duration,
    /// What the calls so far showed of the Node that runs the bridge.
    node: std::sync::Mutex<NodeFact>,
}

/// What a bridge call showed of Node: the version of the Node that answered, the cause when none could start, or
/// nothing yet. It is how the row `node-version-and-git` judges Node without starting one of its own.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub enum NodeFact {
    #[default]
    Unknown,
    Version(String),
    Missing(String),
}

/// The Node floor a release that declares no `requires.node` is judged against.
const DEFAULT_NODE_REQUIREMENT: &str = ">=18";

/// The release's `requires.node`, read from the manifest the host already verifies; a release that declares none
/// (or no resolvable release) is judged against the default floor. The one place a doctor row reads the payload.
pub fn node_requirement() -> String {
    legacy_exec::resolve_payload()
        .ok()
        .and_then(|payload| payload.requires_node)
        .unwrap_or_else(|| DEFAULT_NODE_REQUIREMENT.to_owned())
}

impl NodeFact {
    /// The Node half of `node-version-and-git`: `None` when no call showed anything (the row then judges Git
    /// alone), the version when it meets `requirement`, else the failure that names the Node to install.
    pub fn verdict(&self, requirement: &str) -> Option<Result<String, String>> {
        let wanted = requirement.trim().strip_prefix(">=").map_or_else(
            || requirement.trim().to_owned(),
            |v| format!("{} or newer", v.trim()),
        );
        match self {
            NodeFact::Unknown => None,
            NodeFact::Missing(cause) => Some(Err(format!(
                "node is not available ({cause}) \u{2014} install Node {wanted}"
            ))),
            NodeFact::Version(printed) => Some(
                fgos_distribution::init::node_version_satisfies(printed, requirement)
                    .map_err(|_| format!("node {printed} \u{2014} need {}", requirement.trim())),
            ),
        }
    }
}

/// The command that runs `doctor-bridge.mjs` from the active release's payload.
fn payload_launch() -> Result<Command, Fault> {
    let payload = legacy_exec::resolve_payload().map_err(|cause| {
        Fault::Failed(format!("the legacy payload cannot be resolved: {cause}"))
    })?;
    let module = payload.root.join(BRIDGE_MODULE);
    if !module.is_file() {
        return Err(Fault::Failed(format!(
            "the legacy payload carries no {BRIDGE_MODULE}"
        )));
    }
    let module = {
        let text = module.to_string_lossy();
        match text.strip_prefix(r"\\?\") {
            Some(stripped) => std::path::PathBuf::from(stripped),
            None => module,
        }
    };
    Ok(legacy_exec::payload_command(&module))
}

impl NodeBridge {
    /// The production bridge.
    pub fn new() -> Self {
        Self::with(Box::new(payload_launch), CHECK_DEADLINE, FIX_DEADLINE)
    }

    pub fn with(launch: Launch, check_deadline: Duration, fix_deadline: Duration) -> Self {
        Self {
            launch,
            check_deadline,
            fix_deadline,
            work_store_deadline: WORK_STORE_DEADLINE,
            node: std::sync::Mutex::new(NodeFact::Unknown),
        }
    }

    fn remember_node(&self, fact: NodeFact) {
        let mut node = self
            .node
            .lock()
            .expect("the node fact is never held across a panic");
        // The first thing a call showed stands: a version beats a later failure of another call.
        if *node == NodeFact::Unknown {
            *node = fact;
        }
    }

    /// What the calls so far showed of Node.
    pub fn node_fact(&self) -> NodeFact {
        self.node
            .lock()
            .expect("the node fact is never held across a panic")
            .clone()
    }

    /// Creates the Work store of the project at `root` (`fgos init`'s one step Node still owns): `Ok` once the
    /// payload said it was made, the fault otherwise (a refusal carries the error's text and category).
    pub fn work_store_init(&self, root: &Path) -> Result<(), Fault> {
        match self.call(root, "work-store-init", &[], self.work_store_deadline) {
            (_, None) => Ok(()),
            (_, Some(fault)) => Err(fault),
        }
    }

    /// One call: the lines the child produced, and why it did not finish when it did not. The child runs under the
    /// process door's bounded run (its own group, ended whole at the deadline and when it exits); a signal sent to
    /// the host is forwarded to that group for as long as it lives, and ends the doctor once the call returns.
    fn call(
        &self,
        root: &Path,
        phase: &str,
        ids: &[&str],
        deadline: Duration,
    ) -> (Vec<Line>, Option<Fault>) {
        let command = match (self.launch)() {
            Ok(command) => command,
            Err(fault) => return (Vec::new(), Some(fault)),
        };
        let request =
            serde_json::json!({ "phase": phase, "ids": ids, "dir": root.to_string_lossy() });
        let outcome = fgos_process::spawn::run_bounded_command(
            command,
            Some(request.to_string().as_bytes()),
            deadline,
            |pid| {
                // The child leads its own group: a negative target reaches the whole group.
                let target = if cfg!(unix) {
                    -(pid as i32)
                } else {
                    pid as i32
                };
                legacy_exec::Forwarding::to(target)
            },
        );
        let (stdout, stderr, status, timed_out) = match outcome {
            Ok(fgos_process::spawn::Outcome::Exited(output)) => {
                (output.stdout, output.stderr, Some(output.status), false)
            }
            Ok(fgos_process::spawn::Outcome::TimedOut { stdout, stderr }) => {
                (stdout, stderr, None, true)
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                self.remember_node(NodeFact::Missing(error.to_string()));
                return (Vec::new(), Some(Fault::NodeMissing(error.to_string())));
            }
            Err(error) => {
                return (
                    Vec::new(),
                    Some(Fault::Failed(format!("the child could not start: {error}"))),
                )
            }
        };
        let stderr = String::from_utf8_lossy(&stderr).into_owned();
        let mut lines = Vec::new();
        let mut ended = false;
        let mut refused: Option<(String, Option<String>)> = None;
        for raw in String::from_utf8_lossy(&stdout).lines() {
            let Some(json) = raw.strip_prefix(RESULT_PREFIX) else {
                continue;
            };
            match serde_json::from_str::<Line>(json) {
                Ok(Line::End {
                    count,
                    node_version,
                }) => {
                    ended = count == lines.len();
                    if let Some(version) = node_version {
                        self.remember_node(NodeFact::Version(version));
                    }
                }
                Ok(Line::Refusal { message, category }) => refused = Some((message, category)),
                Ok(line) => lines.push(line),
                Err(error) => {
                    refused = Some((format!("an unreadable result line ({error})"), None));
                }
            }
        }
        let fault = if timed_out {
            Some(Fault::Failed(format!(
                "no answer within {} s; its process tree was ended{}",
                deadline.as_secs(),
                excerpt(&stderr)
            )))
        } else if let Some((message, category)) = refused {
            Some(Fault::Refused { message, category })
        } else if !ended {
            Some(Fault::Failed(format!(
                "it stopped before it finished ({}){}",
                status.map_or("unknown exit".to_owned(), |s| s.to_string()),
                excerpt(&stderr)
            )))
        } else {
            None
        };
        (lines, fault)
    }
}

impl Default for NodeBridge {
    fn default() -> Self {
        Self::new()
    }
}

/// The tail of the child's stderr for a failure message, or nothing.
fn excerpt(stderr: &str) -> String {
    let text = stderr.trim();
    if text.is_empty() {
        return String::new();
    }
    let tail: String = text
        .chars()
        .rev()
        .take(STDERR_EXCERPT)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect();
    format!(": {}", tail.replace('\n', " | "))
}

impl RowOwner for NodeBridge {
    fn interrupted(&self) -> Option<i32> {
        legacy_exec::interrupted()
    }

    fn run_fixes(&self, root: &Path, ids: &[&str]) -> Vec<FixResult> {
        let (lines, fault) = self.call(root, "fix", ids, self.fix_deadline);
        let mut done: HashMap<String, FixResult> = lines
            .into_iter()
            .filter_map(|line| match line {
                Line::Fix(result) => Some((result.id.clone(), result)),
                _ => None,
            })
            .collect();
        let cause = fault.map(|fault| fault.message());
        ids.iter()
            .map(|id| {
                done.remove(*id).unwrap_or_else(|| {
                    FixResult::done(
                        id,
                        false,
                        cause.clone().unwrap_or_else(|| {
                            "the Node rows bridge gave no answer for this fix".to_owned()
                        }),
                    )
                })
            })
            .collect()
    }

    fn judge_rows(&self, root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
        let (lines, fault) = self.call(root, "check", ids, self.check_deadline);
        let mut judged: HashMap<String, RowResult> = lines
            .into_iter()
            .filter_map(|line| match line {
                Line::Row { id, result } => Some((id, result)),
                _ => None,
            })
            .collect();
        let unavailable = || match &fault {
            Some(fault) => RowOutcome::Unavailable {
                message: fault.message(),
                next: fault.next(),
            },
            None => RowOutcome::Unavailable {
                message: "the Node rows bridge gave no answer for this row".to_owned(),
                next: "run fgos doctor again".to_owned(),
            },
        };
        ids.iter()
            .map(|id| match judged.remove(*id) {
                Some(result) => RowOutcome::Judged(result),
                None => unavailable(),
            })
            .collect()
    }
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use std::time::Instant;

    /// A bridge whose child is `sh -c <script>`; the script gets the request on stdin like the real module.
    fn scripted(script: &str, deadline: Duration) -> NodeBridge {
        let script = script.to_owned();
        NodeBridge::with(
            Box::new(move || {
                let mut command = Command::new("sh");
                command.arg("-c").arg(&script);
                Ok(command)
            }),
            deadline,
            deadline,
        )
    }

    fn line(body: &str) -> String {
        format!("printf '\\036FGOS-DOCTOR-BRIDGE %s\\n' '{body}'")
    }

    fn row(id: &str, passed: bool) -> String {
        line(&format!(
            r#"{{"kind":"row","id":"{id}","passed":{passed},"message":"said {id}"}}"#
        ))
    }

    fn end(count: usize) -> String {
        line(&format!(r#"{{"kind":"end","count":{count}}}"#))
    }

    #[test]
    fn each_row_is_judged_from_its_own_prefixed_line_and_stray_output_is_never_a_result() {
        let bridge = scripted(
            &format!(
                "cat >/dev/null; echo 'a body printed this'; {}; echo '{{\"kind\":\"row\",\"id\":\"x\",\"passed\":true}}'; {}; {}",
                row("one", true),
                row("two", false),
                end(2)
            ),
            Duration::from_secs(20),
        );
        let out = bridge.judge_rows(Path::new("/p"), &["one", "two"]);
        match (&out[0], &out[1]) {
            (RowOutcome::Judged(one), RowOutcome::Judged(two)) => {
                assert!(one.passed && !two.passed);
                assert_eq!(one.message.as_deref(), Some("said one"));
            }
            other => panic!("{other:?}"),
        }
    }

    #[test]
    fn the_request_reaches_the_child_on_stdin_with_the_phase_ids_and_directory() {
        let dir = std::env::temp_dir().join(format!("fgos-bridge-request-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let seen = dir.join("request.json");
        let bridge = scripted(
            &format!("cat > '{}'; {}", seen.display(), end(0)),
            Duration::from_secs(20),
        );
        let _ = bridge.run_fixes(Path::new("/project"), &["fix-a", "fix-b"]);
        let request: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&seen).unwrap()).unwrap();
        std::fs::remove_dir_all(&dir).unwrap();
        assert_eq!(request["phase"], "fix");
        assert_eq!(request["ids"], serde_json::json!(["fix-a", "fix-b"]));
        assert_eq!(request["dir"], "/project");
    }

    #[test]
    fn a_crash_keeps_the_results_already_produced_and_fails_only_the_rest_with_the_cause() {
        let bridge = scripted(
            &format!(
                "cat >/dev/null; {}; echo boom >&2; exit 3",
                row("one", true)
            ),
            Duration::from_secs(20),
        );
        let out = bridge.judge_rows(Path::new("/p"), &["one", "two"]);
        assert!(matches!(&out[0], RowOutcome::Judged(r) if r.passed));
        match &out[1] {
            RowOutcome::Unavailable { message, next } => {
                assert!(message.contains("stopped before it finished"), "{message}");
                assert!(message.contains("boom"), "{message}");
                assert!(next.contains("run fgos doctor again"));
            }
            other => panic!("{other:?}"),
        }
    }

    #[test]
    fn a_fix_that_never_answered_reports_the_cause_and_changed_false() {
        let bridge = scripted("cat >/dev/null; exit 1", Duration::from_secs(20));
        let out = bridge.run_fixes(Path::new("/p"), &["fix-a"]);
        assert_eq!(out.len(), 1);
        assert_eq!(out[0].changed, Some(false));
        let message = out[0].message.clone().unwrap();
        assert!(message.contains("failed"), "{message}");
    }

    #[test]
    fn a_refusal_fails_every_row_with_its_message() {
        let bridge = scripted(
            &format!(
                "cat >/dev/null; {}",
                line(r#"{"kind":"refusal","message":"no row body for nope"}"#)
            ),
            Duration::from_secs(20),
        );
        let out = bridge.judge_rows(Path::new("/p"), &["nope"]);
        match &out[0] {
            RowOutcome::Unavailable { message, .. } => {
                assert!(message.contains("no row body for nope"), "{message}")
            }
            other => panic!("{other:?}"),
        }
    }

    #[test]
    fn the_work_store_step_sends_its_phase_with_no_ids_and_succeeds_on_an_end_line() {
        let dir = std::env::temp_dir().join(format!("fgos-bridge-work-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let seen = dir.join("request.json");
        let bridge = scripted(
            &format!("cat > '{}'; {}", seen.display(), end(0)),
            Duration::from_secs(20),
        );
        assert_eq!(bridge.work_store_init(Path::new("/project")), Ok(()));
        let request: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&seen).unwrap()).unwrap();
        std::fs::remove_dir_all(&dir).unwrap();
        assert_eq!(request["phase"], "work-store-init");
        assert_eq!(request["ids"], serde_json::json!([]));
        assert_eq!(request["dir"], "/project");
    }

    #[test]
    fn a_refused_work_store_step_carries_the_error_text_and_its_category() {
        let bridge = scripted(
            &format!(
                "cat >/dev/null; {}",
                line(r#"{"kind":"refusal","message":"lock held","category":"lock-timeout"}"#)
            ),
            Duration::from_secs(20),
        );
        assert_eq!(
            bridge.work_store_init(Path::new("/p")),
            Err(Fault::Refused {
                message: "lock held".into(),
                category: Some("lock-timeout".into())
            })
        );
    }

    #[test]
    fn a_work_store_step_that_stops_without_an_end_line_or_cannot_start_is_a_fault() {
        let crashed = scripted(
            "cat >/dev/null; echo boom >&2; exit 3",
            Duration::from_secs(20),
        );
        assert!(matches!(
            crashed.work_store_init(Path::new("/p")),
            Err(Fault::Failed(cause)) if cause.contains("stopped before it finished") && cause.contains("boom")
        ));
        let missing = NodeBridge::with(
            Box::new(|| Ok(Command::new("fgos-no-such-node-binary-for-the-bridge"))),
            Duration::from_secs(5),
            Duration::from_secs(5),
        );
        assert!(matches!(
            missing.work_store_init(Path::new("/p")),
            Err(Fault::NodeMissing(_))
        ));
    }

    #[test]
    fn a_work_store_step_that_hangs_is_ended_at_its_own_deadline() {
        let mut bridge = scripted("cat >/dev/null; sleep 30", Duration::from_secs(60));
        bridge.work_store_deadline = Duration::from_millis(300);
        let started = Instant::now();
        assert!(matches!(
            bridge.work_store_init(Path::new("/p")),
            Err(Fault::Failed(cause)) if cause.contains("no answer within")
        ));
        assert!(started.elapsed() < Duration::from_secs(20));
    }

    #[test]
    fn a_child_that_hangs_is_ended_with_its_whole_tree_at_the_deadline() {
        let dir = std::env::temp_dir().join(format!("fgos-bridge-hang-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let grandchild = dir.join("grandchild.pid");
        let bridge = scripted(
            &format!(
                "cat >/dev/null; (sleep 300 & echo $! > '{}'; wait) & wait",
                grandchild.display()
            ),
            Duration::from_millis(600),
        );
        let started = Instant::now();
        let out = bridge.judge_rows(Path::new("/p"), &["one"]);
        assert!(started.elapsed() < Duration::from_secs(15));
        match &out[0] {
            RowOutcome::Unavailable { message, .. } => {
                assert!(message.contains("process tree was ended"), "{message}")
            }
            other => panic!("{other:?}"),
        }
        let pid: i32 = std::fs::read_to_string(&grandchild)
            .unwrap()
            .trim()
            .parse()
            .unwrap();
        std::thread::sleep(Duration::from_millis(300));
        let alive = std::path::Path::new(&format!("/proc/{pid}/stat")).exists()
            && std::fs::read_to_string(format!("/proc/{pid}/stat"))
                .map(|stat| !stat.contains(") Z "))
                .unwrap_or(false);
        std::fs::remove_dir_all(&dir).unwrap();
        assert!(
            !alive,
            "the grandchild of the hung child outlived the deadline"
        );
    }

    #[test]
    fn a_missing_node_fails_every_row_with_the_install_hint_and_one_next_entry() {
        let bridge = NodeBridge::with(
            Box::new(|| Ok(Command::new("fgos-no-such-node-binary-for-the-bridge"))),
            Duration::from_secs(5),
            Duration::from_secs(5),
        );
        let out = bridge.judge_rows(Path::new("/p"), &["one", "two"]);
        let nexts: Vec<&str> = out
            .iter()
            .map(|outcome| match outcome {
                RowOutcome::Unavailable { next, message } => {
                    assert!(message.starts_with("Node is not available"), "{message}");
                    next.as_str()
                }
                other => panic!("{other:?}"),
            })
            .collect();
        assert_eq!(nexts[0], nexts[1]);
        assert!(nexts[0].contains("install Node 18 or newer"));
    }

    #[test]
    fn a_launcher_that_cannot_find_the_payload_fails_the_call_without_starting_anything() {
        let bridge = NodeBridge::with(
            Box::new(|| {
                Err(Fault::Failed(
                    "the legacy payload cannot be resolved: none".into(),
                ))
            }),
            Duration::from_secs(5),
            Duration::from_secs(5),
        );
        let out = bridge.run_fixes(Path::new("/p"), &["fix-a"]);
        assert!(out[0]
            .message
            .as_deref()
            .unwrap()
            .contains("cannot be resolved"));
    }

    #[test]
    fn the_child_runs_in_its_own_process_group_so_a_signal_to_the_host_group_cannot_leave_it_orphaned(
    ) {
        let bridge = scripted(
            &format!(
                "cat >/dev/null; own=$(ps -o pgid= -p $$ | tr -d ' '); par=$(ps -o pgid= -p $PPID | tr -d ' '); \
                 printf '\\036FGOS-DOCTOR-BRIDGE {{\"kind\":\"row\",\"id\":\"g\",\"passed\":true,\"message\":\"%s vs %s\"}}\\n' $own $par; {}",
                end(1)
            ),
            Duration::from_secs(20),
        );
        let out = bridge.judge_rows(Path::new("/p"), &["g"]);
        let RowOutcome::Judged(result) = &out[0] else {
            panic!("{out:?}")
        };
        let message = result.message.clone().unwrap();
        let (own, parent) = message.split_once(" vs ").unwrap();
        assert_ne!(own, parent, "the child shares the host's group: {message}");
    }
}

#[cfg(test)]
mod contract_tests {
    use super::*;

    const CONTRACT: &str =
        include_str!("../../../../../packages/distribution/contracts/doctor-bridge.v1.json");

    #[test]
    fn the_prefix_and_module_are_the_contracts() {
        let contract: serde_json::Value = serde_json::from_str(CONTRACT).unwrap();
        assert_eq!(contract["resultPrefix"], RESULT_PREFIX);
        assert_eq!(contract["module"], BRIDGE_MODULE);
    }

    #[test]
    fn every_vector_line_reads_back_as_the_body_it_was_written_from() {
        let contract: serde_json::Value = serde_json::from_str(CONTRACT).unwrap();
        for vector in contract["vectors"].as_array().unwrap() {
            let name = vector["name"].as_str().unwrap();
            let raw = vector["line"].as_str().unwrap();
            let json = raw
                .strip_prefix(RESULT_PREFIX)
                .and_then(|rest| rest.strip_suffix('\n'))
                .unwrap_or_else(|| panic!("{name}: not a result line"));
            let line: Line = serde_json::from_str(json).unwrap_or_else(|e| panic!("{name}: {e}"));
            let body = &vector["body"];
            match line {
                Line::Row { id, result } => {
                    assert_eq!(body["id"], id.as_str(), "{name}");
                    assert_eq!(body["passed"], result.passed, "{name}");
                    assert_eq!(
                        body.get("message").and_then(|m| m.as_str()),
                        result.message.as_deref(),
                        "{name}"
                    );
                    assert_eq!(
                        body.get("fixCommand").and_then(|m| m.as_str()),
                        result.fix_command.as_deref(),
                        "{name}"
                    );
                    assert_eq!(body.get("detail"), result.detail.as_ref(), "{name}");
                }
                Line::Fix(fix) => {
                    assert_eq!(body["id"], fix.id.as_str(), "{name}");
                    assert_eq!(
                        body.get("changed").and_then(|c| c.as_bool()),
                        fix.changed,
                        "{name}"
                    );
                    assert_eq!(
                        body.get("message").and_then(|m| m.as_str()),
                        fix.message.as_deref(),
                        "{name}"
                    );
                }
                Line::End {
                    count,
                    node_version,
                } => {
                    assert_eq!(body["count"], count, "{name}");
                    assert_eq!(
                        body.get("nodeVersion").and_then(|v| v.as_str()),
                        node_version.as_deref(),
                        "{name}"
                    );
                }
                Line::Refusal { message, category } => {
                    assert_eq!(body["message"], message.as_str(), "{name}");
                    assert_eq!(
                        body.get("category").and_then(|c| c.as_str()),
                        category.as_deref(),
                        "{name}"
                    );
                }
            }
        }
    }
}
