//! Run admission: admit one Run attempt of an Assignment: the attempt number, the admission fences (retry
//! identity, predecessor, a prior attempt still in flight) and the atomic materialization of its run directory.
//!
//! The admission-generation ledger (`<assignment>/admission/generations/`, the run supervisor's append-only
//! primitive) is the sole source of truth for attempt numbers: concurrent callers race on one hard-linked path,
//! exactly one wins, every loser rereads and re-evaluates against the new current generation. Once an attempt and
//! run id are committed there, they are never reused, whether or not the run directory was materialized. The run
//! directory (`runs/<NN>/run.json` + `dispatch-plan.json`) is built in a same-filesystem staging directory, fsynced,
//! then published with one atomic rename: a reader never sees a partially written attempt, and a crash between the
//! generation commit and the rename leaves the generation record as the sole durable fact until a later call for
//! the same tuple resumes it.
//!
//! One door per decision: the ledger, the control probe and the holder identity are `fgos-run-supervisor`'s; the
//! liveness verdict of a recorded process is `fgos-process`'s; durable file writes are `fgos-durable-file`'s.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use fgos_durable_file::replace_durably_with_mode;
use fgos_process::facts::{judge_here, Record, Verdict};
use fgos_run_supervisor::adopt::{adopt_one, AdoptArgs, Target};
use fgos_run_supervisor::controller::lease::{
    build_run_control_holder, fsync_dir_best_effort, inspect_run_control, publish_next_generation,
    read_marker, Decision, Generation, Published,
};
use serde_json::{json, Map, Value};

/// The file name of the effective execution contract inside a run directory.
pub const EFFECTIVE_EXECUTION_CONTRACT_FILE: &str = "effective-execution-contract.json";

/// A refusal of admission: Node's `RunnerConfigError` with its stable `code`, `phase` and the facts of the prior
/// attempt a caller branches on.
#[derive(Debug, Clone, PartialEq)]
pub struct AdmissionError {
    pub message: String,
    pub code: Option<&'static str>,
    pub phase: Option<&'static str>,
    /// `priorRunId`, `priorAttempt` and `holder`, when the refusal names them.
    pub facts: Box<Map<String, Value>>,
}

impl AdmissionError {
    fn plain(message: String) -> Self {
        AdmissionError {
            message,
            code: None,
            phase: None,
            facts: Box::default(),
        }
    }

    fn pre_admission(message: String, code: &'static str) -> Self {
        AdmissionError {
            message,
            code: Some(code),
            phase: Some("pre-admission"),
            facts: Box::default(),
        }
    }

    fn io(error: io::Error) -> Self {
        AdmissionError::plain(error.to_string())
    }

    /// `{ name, code, phase, message, ...facts }`, as the vectors state a thrown refusal.
    pub fn to_json(&self) -> Value {
        let mut out = Map::new();
        out.insert("name".into(), json!("RunnerConfigError"));
        out.insert("code".into(), json!(self.code));
        out.insert("phase".into(), json!(self.phase));
        out.insert("message".into(), json!(self.message));
        for (key, value) in self.facts.iter() {
            out.insert(key.clone(), value.clone());
        }
        Value::Object(out)
    }
}

impl std::fmt::Display for AdmissionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for AdmissionError {}

/// Builds one file of an admitted attempt from its admission record; `None` writes no file.
pub type BuildFile<'a> = &'a dyn Fn(&Value) -> Option<Value>;

/// What admission reads from its caller besides the paths.
pub struct AdmitRequest<'a> {
    /// A caller that names a retry id opts into the full admission contract.
    pub retry_id: Option<&'a str>,
    pub predecessor_run_id: Option<&'a str>,
    pub destination: &'a str,
    pub payload_digest: &'a str,
    pub expected_run_id: Option<&'a str>,
    pub force_new_attempt: bool,
    pub refuse_if_settled: bool,
    /// The `run.json` of an admitted attempt, from its admission record.
    pub build_run_meta: &'a dyn Fn(&Value) -> Value,
    pub build_dispatch_plan: Option<BuildFile<'a>>,
    pub build_effective_contract: Option<BuildFile<'a>>,
}

/// An admitted attempt.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Admitted {
    pub attempt_num: u64,
    pub attempt_str: String,
    pub run_id: String,
    pub run_dir: PathBuf,
    /// The attempt was already admitted under the same tuple (or its directory already existed).
    pub resumed: bool,
}

impl Admitted {
    pub fn to_json(&self) -> Value {
        json!({
            "attemptNum": self.attempt_num,
            "attemptStr": self.attempt_str,
            "runId": self.run_id,
            "runDir": self.run_dir,
            "resumed": self.resumed,
        })
    }
}

fn normalize_digest(digest: Option<&Value>) -> Option<&str> {
    let text = digest?.as_str().filter(|d| !d.is_empty())?;
    Some(text.strip_prefix("sha256:").unwrap_or(text))
}

fn pad2(attempt: u64) -> String {
    format!("{attempt:02}")
}

fn attempt_str_of(record: &Value) -> String {
    match record
        .get("attemptStr")
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
    {
        Some(text) => text.to_string(),
        None => pad2(record.get("attempt").and_then(Value::as_u64).unwrap_or(0)),
    }
}

/// Whether a supervised attempt (`direct` or `terminal`) is still doing real work, independent of whether the
/// runner that started it is alive: the supervisor and the agent outlive their controller. The answer is the adopt
/// door's own read-only probe of the attempt lock and the domain it declared. A Run with no envelope (never
/// launched) reads `false`.
pub fn is_supervised_attempt_still_working(run_dir: &Path) -> bool {
    if !run_dir.join("envelope.json").exists() {
        return false;
    }
    let verdict = adopt_one(
        run_dir,
        &AdoptArgs {
            target: Target::RunDir(run_dir.to_path_buf()),
            probe_only: true,
            kill_wait_ms: 0,
        },
    );
    matches!(verdict.state, "running" | "being-adopted" | "held")
}

/// A recorded holder is held unless it is proven dead: liveness that cannot be disproven reads as held.
fn holder_is_held(holder: &Value) -> bool {
    judge_here(&Record::from_json(holder)) != Verdict::Dead
}

/// The run id of the most recent admitted generation that still counts: a generation whose retry id was later
/// aborted counts only when its run directory was materialized under that same retry id.
fn current_valid_run_id(
    generations: &[Generation],
    runs_dir: &Path,
    markers_dir: &Path,
) -> Option<String> {
    let valid = |g: &&Generation| -> bool {
        let Some(retry) = g
            .record
            .get("retryId")
            .and_then(Value::as_str)
            .filter(|r| !r.is_empty())
        else {
            return true;
        };
        let aborted = matches!(
            read_marker(&markers_dir.join(format!("{retry}.aborted.json"))),
            Ok(Some(_))
        );
        if !aborted {
            return true;
        }
        let run_json = runs_dir.join(attempt_str_of(&g.record)).join("run.json");
        fs::read_to_string(run_json)
            .ok()
            .and_then(|text| serde_json::from_str::<Value>(&text).ok())
            .is_some_and(|meta| meta.get("retryId").and_then(Value::as_str) == Some(retry))
    };
    generations.iter().rfind(valid).and_then(|g| {
        g.record
            .get("runId")
            .and_then(Value::as_str)
            .map(str::to_string)
    })
}

fn now_iso() -> String {
    fgos_identity::text::iso_utc_now()
}

/// What the ledger decided: a refusal, a prior identical admission, or a new record.
enum Decided {
    Duplicate {
        record: Value,
    },
    DuplicateRetry,
    InvalidPredecessor {
        current_run_id: Option<String>,
    },
    InFlight {
        prior_run_id: Value,
        prior_attempt: Value,
        holder: Value,
    },
    AlreadySettled {
        prior_run_id: Value,
        prior_attempt: Value,
    },
}

/// Atomically admits one Run attempt for `assignment_id` under `runs_dir`.
pub fn admit_run_attempt(
    assignment_dir: &Path,
    runs_dir: &Path,
    assignment_id: &str,
    request: &AdmitRequest<'_>,
) -> Result<Admitted, AdmissionError> {
    let generations_dir = assignment_dir.join("admission").join("generations");
    let markers_dir = assignment_dir.join("admission").join("markers");
    let retry_id = request.retry_id;

    if let Some(retry) = retry_id {
        if matches!(
            read_marker(&markers_dir.join(format!("{retry}.aborted.json"))),
            Ok(Some(_))
        ) {
            return Err(AdmissionError::plain(format!(
                "executeAssignment: retryId \"{retry}\" for assignment \"{assignment_id}\" was aborted -- refuse identity reuse"
            )));
        }
    }

    let published = publish_next_generation(&generations_dir, |current, next_epoch| {
        let generations =
            fgos_run_supervisor::controller::lease::list_generations(&generations_dir)
                .unwrap_or_default();
        // Strict tuple and predecessor fencing is opt-in, gated on the caller supplying a retry id at all.
        if let Some(retry) = retry_id {
            let prior = generations
                .iter()
                .find(|g| g.record.get("retryId").and_then(Value::as_str) == Some(retry));
            if let Some(prior) = prior {
                let same = prior.record.get("destination").and_then(Value::as_str)
                    == Some(request.destination)
                    && prior
                        .record
                        .get("admissionPayloadDigest")
                        .and_then(Value::as_str)
                        == Some(request.payload_digest);
                return Decision::Stop(if same {
                    Decided::Duplicate {
                        record: prior.record.clone(),
                    }
                } else {
                    Decided::DuplicateRetry
                });
            }
            let current_run_id = current_valid_run_id(&generations, runs_dir, &markers_dir);
            if request.predecessor_run_id.map(str::to_string) != current_run_id {
                return Decision::Stop(Decided::InvalidPredecessor { current_run_id });
            }
        }

        let mut max_dir: u64 = 0;
        if let Ok(entries) = fs::read_dir(runs_dir) {
            for entry in entries.flatten() {
                let name = entry.file_name();
                if let Some(n) = name
                    .to_str()
                    .filter(|n| !n.is_empty() && n.bytes().all(|b| b.is_ascii_digit()))
                    .and_then(|n| n.parse::<u64>().ok())
                {
                    max_dir = max_dir.max(n);
                }
            }
        }
        for g in &generations {
            if let Some(attempt) = g.record.get("attempt").and_then(Value::as_u64) {
                max_dir = max_dir.max(attempt);
            }
        }
        let mut attempt = next_epoch.max(max_dir + 1);
        while runs_dir.join(pad2(attempt)).exists() {
            attempt += 1;
        }

        // `expected_run_id` is checked against the computed attempt, never used to bump it.
        let attempt_str = pad2(attempt);
        let run_id = format!("run_{assignment_id}_{attempt_str}");
        if request
            .expected_run_id
            .is_some_and(|expected| expected != run_id)
        {
            return Decision::Stop(Decided::InvalidPredecessor {
                current_run_id: current_valid_run_id(&generations, runs_dir, &markers_dir),
            });
        }
        // A new admission is refused while the current attempt has neither settled nor provably stopped.
        if let (Some(current), false) = (current, request.force_new_attempt) {
            let prior_dir = runs_dir.join(attempt_str_of(&current.record));
            let prior_run_id = current.record.get("runId").cloned().unwrap_or(Value::Null);
            let prior_attempt = current
                .record
                .get("attempt")
                .cloned()
                .unwrap_or(Value::Null);
            if !prior_dir.join("result.json").exists() {
                let control = inspect_run_control(&prior_dir).ok();
                let admitted_by = current.record.get("admittedBy").filter(|h| !h.is_null());
                // Between admission and run control a sibling holds no control record, so the only sign of it
                // is the admitting process stamped into the same record; consulted only while none exists.
                let control_epoch = control.as_ref().and_then(|c| c.control_epoch);
                let admitter_alive =
                    control_epoch.is_none() && admitted_by.is_some_and(holder_is_held);
                let detached_working = is_supervised_attempt_still_working(&prior_dir);
                let held = control.as_ref().is_some_and(|c| c.held);
                if held || detached_working || admitter_alive {
                    let holder = control
                        .and_then(|c| c.holder)
                        .filter(|h| !h.is_null())
                        .or_else(|| admitted_by.cloned())
                        .unwrap_or(Value::Null);
                    return Decision::Stop(Decided::InFlight {
                        prior_run_id,
                        prior_attempt,
                        holder,
                    });
                }
            } else if request.refuse_if_settled {
                return Decision::Stop(Decided::AlreadySettled {
                    prior_run_id,
                    prior_attempt,
                });
            }
        }
        let mut record = Map::new();
        record.insert("attempt".into(), json!(attempt));
        record.insert("attemptStr".into(), json!(attempt_str));
        record.insert("runId".into(), json!(run_id));
        record.insert("retryId".into(), json!(retry_id));
        record.insert("predecessorRunId".into(), json!(request.predecessor_run_id));
        record.insert("destination".into(), json!(request.destination));
        record.insert(
            "admissionPayloadDigest".into(),
            json!(request.payload_digest),
        );
        record.insert("admittedAt".into(), json!(now_iso()));
        // The admitting process, stamped into this same atomic commit.
        record.insert(
            "admittedBy".into(),
            build_run_control_holder(&format!("{run_id}:admission:{}", std::process::id())),
        );
        Decision::Record(Value::Object(record))
    })
    .map_err(AdmissionError::io)?;

    let (record, duplicate) = match published {
        Published::Published { record, .. } => (record, false),
        Published::NotPublished(Decided::Duplicate { record }) => (record, true),
        Published::NotPublished(Decided::DuplicateRetry) => {
            return Err(AdmissionError::pre_admission(
                format!(
                    "executeAssignment: retryId \"{}\" for assignment \"{assignment_id}\" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)",
                    retry_id.unwrap_or_default()
                ),
                "admission-duplicate-retry",
            ))
        }
        Published::NotPublished(Decided::InvalidPredecessor { current_run_id }) => {
            return Err(AdmissionError::pre_admission(
                format!(
                    "executeAssignment: predecessorRunId \"{}\" for assignment \"{assignment_id}\" does not match the current committed Run \"{}\" -- refusing (invalid-predecessor)",
                    request.predecessor_run_id.map_or("null".to_string(), str::to_string),
                    current_run_id.unwrap_or_else(|| "null".to_string())
                ),
                "admission-invalid-predecessor",
            ))
        }
        Published::NotPublished(Decided::InFlight { prior_run_id, prior_attempt, holder }) => {
            let mut error = AdmissionError::pre_admission(
                format!(
                    "executeAssignment: assignment \"{assignment_id}\"'s prior attempt \"{}\" (attempt {}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)",
                    crate::assignment::js_str(Some(&prior_run_id)),
                    crate::assignment::js_str(Some(&prior_attempt))
                ),
                "admission-run-in-flight",
            );
            error.facts.insert("priorRunId".into(), prior_run_id);
            error.facts.insert("priorAttempt".into(), prior_attempt);
            error.facts.insert("holder".into(), holder);
            return Err(error);
        }
        Published::NotPublished(Decided::AlreadySettled { prior_run_id, prior_attempt }) => {
            let mut error = AdmissionError::pre_admission(
                format!(
                    "executeAssignment: assignment \"{assignment_id}\"'s prior attempt \"{}\" (attempt {}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it",
                    crate::assignment::js_str(Some(&prior_run_id)),
                    crate::assignment::js_str(Some(&prior_attempt))
                ),
                "admission-run-already-settled",
            );
            error.facts.insert("priorRunId".into(), prior_run_id);
            error.facts.insert("priorAttempt".into(), prior_attempt);
            return Err(error);
        }
    };

    let attempt_str = attempt_str_of(&record);
    let admitted = |resumed: bool| Admitted {
        attempt_num: record.get("attempt").and_then(Value::as_u64).unwrap_or(0),
        attempt_str: attempt_str.clone(),
        run_id: record
            .get("runId")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        run_dir: runs_dir.join(&attempt_str),
        resumed,
    };
    let run_dir = runs_dir.join(&attempt_str);
    if run_dir.exists() && retry_id.is_some() && duplicate {
        return Ok(admitted(true));
    }

    remove_abandoned_staging(runs_dir, &attempt_str, &record);

    let uuid = {
        let mut bytes = fgos_identity::text::random_bytes::<16>().map_err(AdmissionError::io)?;
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        let hex: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
        format!(
            "{}-{}-{}-{}-{}",
            &hex[0..8],
            &hex[8..12],
            &hex[12..16],
            &hex[16..20],
            &hex[20..32]
        )
    };
    let staging_name = format!(".staging-{attempt_str}-{}-{uuid}", std::process::id());
    let staging_dir = runs_dir.join(&staging_name);
    fs::create_dir_all(&staging_dir).map_err(AdmissionError::io)?;

    let write = |name: &str, value: &Value, mode: u32| -> Result<(), AdmissionError> {
        let mut text = serde_json::to_string_pretty(value)
            .map_err(|e| AdmissionError::plain(e.to_string()))?;
        text.push('\n');
        replace_durably_with_mode(&staging_dir, name, text.as_bytes(), mode)
            .map(|_| ())
            .map_err(|e| AdmissionError::io(e.source))
    };
    write("run.json", &(request.build_run_meta)(&record), 0o644)?;
    if let Some(plan) = request.build_dispatch_plan.and_then(|build| build(&record)) {
        write("dispatch-plan.json", &plan, 0o644)?;
    }
    if let Some(contract) = request
        .build_effective_contract
        .and_then(|build| build(&record))
    {
        write(EFFECTIVE_EXECUTION_CONTRACT_FILE, &contract, 0o644)?;
    }
    fsync_dir_best_effort(&staging_dir);

    match fs::rename(&staging_dir, &run_dir) {
        Ok(()) => {}
        Err(error) => {
            let exists = matches!(
                error.kind(),
                io::ErrorKind::DirectoryNotEmpty | io::ErrorKind::AlreadyExists
            ) || (cfg!(windows) && run_dir.exists());
            if !exists {
                return Err(AdmissionError::io(error));
            }
            let _ = fs::remove_dir_all(&staging_dir);
            return Ok(admitted(true));
        }
    }
    fsync_dir_best_effort(runs_dir);
    Ok(admitted(false))
}

/// Abandoned staging is not admission: it is removed only after its retry id and digest match this record, and
/// never when its process is alive.
fn remove_abandoned_staging(runs_dir: &Path, attempt_str: &str, record: &Value) {
    let Ok(entries) = fs::read_dir(runs_dir) else {
        return;
    };
    let plain = format!(".staging-{attempt_str}");
    let prefix = format!(".staging-{attempt_str}-");
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        if name != plain && !name.starts_with(&prefix) {
            continue;
        }
        let abandoned = runs_dir.join(&name);
        // `.staging-<attempt>-<pid>-<uuid>`: never delete the staging directory of a live process.
        let staged_pid = name
            .strip_prefix(".staging-")
            .and_then(|rest| rest.split_once('-'))
            .and_then(|(_, rest)| rest.split_once('-'))
            .and_then(|(pid, _)| pid.parse::<u32>().ok().filter(|_| !pid_is_empty(&name)));
        if let Some(pid) = staged_pid {
            if judge_here(&Record::from_json(&json!({ "pid": pid }))) != Verdict::Dead {
                continue;
            }
        }
        if name == plain {
            let _ = fs::remove_dir_all(&abandoned);
            continue;
        }
        let Some(meta) = fs::read_to_string(abandoned.join("run.json"))
            .ok()
            .and_then(|text| serde_json::from_str::<Value>(&text).ok())
        else {
            continue;
        };
        // `stagedMeta.retryId === (record.retryId ?? null)`: a missing key is not a null one.
        let same_retry = meta.get("retryId") == record.get("retryId");
        if same_retry
            && normalize_digest(meta.get("payloadDigest"))
                == normalize_digest(record.get("admissionPayloadDigest"))
        {
            let _ = fs::remove_dir_all(&abandoned);
        }
    }
}

/// `.staging-<attempt>-<pid>-` needs a non-empty attempt segment and digits for the pid segment.
fn pid_is_empty(name: &str) -> bool {
    name.strip_prefix(".staging-")
        .and_then(|rest| rest.split_once('-'))
        .is_none_or(|(attempt, _)| attempt.is_empty())
}
