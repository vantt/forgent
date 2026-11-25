//! The unit source and the records under a unit run directory: who drives the run (its unit control ledger), the
//! attempt the admission ledger committed, the adopt door's judgement of an attempt, the legacy record reads and
//! the derived unit summary. The ledgers are the run supervisor's, the reads and judgements `fgos-execution`'s;
//! this module opens the files and hands the facts over.

use std::path::Path;

use fgos_execution::seat_resolver;
use fgos_execution::unit_record::{
    build_unit_summary, serialize_unit_summary, unit_control_dir, unit_has_active_run,
    unit_summary_skip_reason, SummaryInput,
};
use fgos_execution_engine::unit_run::history::{read_unit_run_seats, SeatRound, SettledAttempt};
use fgos_execution_engine::unit_run::host::{AttemptRef, ControlHeld, UnitControl};
use fgos_execution_engine::unit_run::run_unit_contract::RunUnitError;
use fgos_run_supervisor::adopt::{adopt_one, AdoptArgs, Target};
use fgos_run_supervisor::controller::lease::{
    acquire_run_control, build_run_control_holder, list_generations, release_run_control,
    AcquireOptions, AcquireOutcome,
};
use serde_json::{json, Value};

// ---- the unit source --------------------------------------------------------------------------------------

/// `readUnitSource` (`src/runner/execution/unit-run-start.mjs:273`): `unitData` as given, else the file
/// `unitPath` names (`-` is stdin), parsed as JSON first and as YAML (the YAML door, `tool` profile) otherwise.
pub fn read_unit_source(options: &Value) -> Result<Value, RunUnitError> {
    if let Some(data) = options.get("unitData").filter(|d| truthy(d)) {
        return Ok(data.clone());
    }
    let Some(unit_path) = options
        .get("unitPath")
        .and_then(Value::as_str)
        .filter(|p| !p.is_empty())
    else {
        return Err(RunUnitError::config(
            "runUnit requires --unit <file|-> or unitData",
            None,
            None,
        ));
    };
    let from_stdin = unit_path == "-";
    let read = if from_stdin {
        let mut text = String::new();
        std::io::Read::read_to_string(&mut std::io::stdin(), &mut text).map(|_| text)
    } else {
        std::fs::read_to_string(unit_path)
    };
    let content = read.map_err(|e| {
        if from_stdin {
            node_fs_error(&e, "read", None)
        } else {
            let file = std::path::absolute(unit_path).unwrap_or_else(|_| unit_path.into());
            node_fs_error(&e, "open", Some(&file))
        }
    })?;
    if let Ok(value) = serde_json::from_str::<Value>(&content) {
        return Ok(value);
    }
    let file = if from_stdin { "<stdin>" } else { unit_path };
    let refused = |refusal: fgos_yaml_doc::Refusal| {
        let mut error = RunUnitError::other("error", format!("{file}: {}", refusal.rule));
        error.code = Some(refusal.rule.to_string());
        error.with("name", json!("YamlParseError"))
    };
    fgos_yaml_doc::document::parse(
        content.as_bytes(),
        fgos_yaml_doc::model::Profile::Tool,
        file,
    )
    .and_then(|doc| doc.to_json())
    .map_err(refused)
}

/// The tier checks a unit file gets before it is validated (`src/runner/execution/unit-run-start.mjs:371-374`): a
/// seat's or a unit's tier is a recommendation only a registered workflow may make, never a unit file.
pub fn check_unit_file(raw: &Value) -> Result<(), RunUnitError> {
    let refused = |e: seat_resolver::SeatResolutionError| {
        let mut error = RunUnitError::other("error", e.message);
        error.code = Some(e.code);
        error.with("name", json!(e.class))
    };
    seat_resolver::assert_no_seat_tier(raw.get("seats").unwrap_or(&Value::Null), "a unit file")
        .map_err(refused)?;
    seat_resolver::assert_no_unit_tier(raw, "a unit file").map_err(refused)
}

/// `expandGenerated(writes, generatedPaths)` (`packages/write-scope/src/lib.rs`, `expand`): the write scope widened with
/// the render targets of the generated sources it touches. The writes were checked by the unit validation and the
/// mappings by the config door; an entry neither door would have passed leaves the scope as declared.
pub fn expand_generated(writes: &Value, generated: &Value) -> Value {
    let texts = |value: Option<&Value>| -> Vec<String> {
        value
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
            .map(str::to_string)
            .collect()
    };
    let declared = texts(Some(writes));
    let mappings: Vec<(String, Vec<String>)> = generated
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|m| Some((m.get("from")?.as_str()?.to_string(), texts(m.get("also")))))
        .collect();
    fgos_execution_engine::assignment::write_scope::expand_generated(&declared, &mappings)
        .map(|scope| json!(scope))
        .unwrap_or_else(|_| writes.clone())
}

/// The `code` Node's file read error carries (`ENOENT`, `EACCES`, ...), when the kind names one.
/// A file system failure as Node's `fs` raises it: `code`, and the message `<CODE>: <description>, <syscall>
/// '<path>'` (no path for a read of a descriptor). A failure Node names no code for keeps its own text.
fn node_fs_error(error: &std::io::Error, syscall: &str, path: Option<&Path>) -> RunUnitError {
    use std::io::ErrorKind;
    const EPERM: i32 = 1;
    let named = match error.kind() {
        ErrorKind::NotFound => Some(("ENOENT", "no such file or directory")),
        ErrorKind::PermissionDenied if error.raw_os_error() == Some(EPERM) => {
            Some(("EPERM", "operation not permitted"))
        }
        ErrorKind::PermissionDenied => Some(("EACCES", "permission denied")),
        ErrorKind::IsADirectory => Some(("EISDIR", "illegal operation on a directory")),
        ErrorKind::NotADirectory => Some(("ENOTDIR", "not a directory")),
        _ => None,
    };
    let Some((code, description)) = named else {
        return RunUnitError::other("error", error.to_string());
    };
    let target = path.map_or_else(String::new, |p| format!(" '{}'", p.display()));
    let mut out = RunUnitError::other("error", format!("{code}: {description}, {syscall}{target}"));
    out.code = Some(code.into());
    out
}

fn truthy(value: &Value) -> bool {
    match value {
        Value::Null | Value::Bool(false) => false,
        Value::String(s) => !s.is_empty(),
        _ => true,
    }
}

// ---- who drives the run -----------------------------------------------------------------------------------

/// The controller seat of a unit run, held until [`UnitControl::release`].
struct HeldControl {
    dir: std::path::PathBuf,
    epoch: u64,
    token: String,
}

impl UnitControl for HeldControl {
    fn release(&mut self) -> Result<(), String> {
        release_run_control(&self.dir, self.epoch, &self.token, None)
            .map(|_| ())
            .map_err(|e| {
                format!(
                    "cannot release the unit control of {}: {e}",
                    self.dir.display()
                )
            })
    }
}

/// `acquireUnitControl` (`src/runner/execution/unit-control.mjs:18`): take the controller seat of a unit run in its
/// `unit-control` run control ledger; a dead controller is taken over by the ledger's own proof, a live one keeps
/// it. A ledger that cannot be read refuses as held, with no holder named.
pub fn acquire_unit_control(
    unit_dir: &Path,
    unit_run_id: &str,
) -> Result<Box<dyn UnitControl>, ControlHeld> {
    let dir = unit_control_dir(unit_dir);
    let options = AcquireOptions {
        holder: build_run_control_holder(&format!(
            "{unit_run_id}:controller:{}",
            std::process::id()
        )),
        purpose: Some("unit-controller".into()),
        ..AcquireOptions::default()
    };
    match acquire_run_control(&dir, &options) {
        Ok(AcquireOutcome::Acquired {
            control_epoch,
            control_token,
        }) => Ok(Box::new(HeldControl {
            dir,
            epoch: control_epoch,
            token: control_token,
        })),
        Ok(AcquireOutcome::Held { holder, .. }) => Err(ControlHeld {
            holder_pid: holder
                .get("pid")
                .and_then(Value::as_u64)
                .and_then(|pid| u32::try_from(pid).ok()),
        }),
        Ok(_) | Err(_) => Err(ControlHeld { holder_pid: None }),
    }
}

// ---- the admission ledger and the adopt door ----------------------------------------------------------------

/// `listGenerations(dir).map(g => g.record)` (`src/run-supervisor/run-lock.mjs:118`): the records of an admission
/// ledger, oldest first; a missing ledger has none, and any other failure to read it is the caller's error.
pub fn admission_generations(dir: &Path) -> Result<Vec<Value>, RunUnitError> {
    list_generations(dir)
        .map(|list| list.into_iter().map(|g| g.record).collect())
        .map_err(|e| node_fs_error(&e, "scandir", Some(dir)))
}

/// `currentAttemptOf` (`src/runner/execution/unit-state.mjs:17`): the newest attempt directory the admission
/// ledger committed for `assignment_id`, with its run id; `None` while nothing was admitted or the directory was
/// never made. A ledger that cannot be read is the caller's error, as Node's `listGenerations` throws it.
pub fn current_attempt(
    assignments_dir: &Path,
    assignment_id: &str,
) -> Result<Option<AttemptRef>, RunUnitError> {
    let assignment = assignments_dir.join(assignment_id);
    let generations = admission_generations(&assignment.join("admission").join("generations"))?;
    let Some(current) = generations.last() else {
        return Ok(None);
    };
    let Some(name) = fgos_execution::unit_record::attempt_dir_name(current) else {
        return Ok(None);
    };
    let dir = assignment.join("runs").join(name);
    Ok(dir.exists().then(|| AttemptRef {
        dir,
        run_id: current
            .get("runId")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
    }))
}

/// `adoptRun(runDir, { probeOnly: true }).state` (`src/run-supervisor/client.mjs:67`): the adopt door's judgement
/// of one attempt directory, read-only.
pub fn adopt_state(run_dir: &Path) -> String {
    adopt_one(
        run_dir,
        &AdoptArgs {
            target: Target::RunDir(run_dir.to_path_buf()),
            probe_only: true,
            kill_wait_ms: fgos_holder_lock::DEFAULT_KILL_WAIT_MS,
        },
    )
    .state
    .to_string()
}

// ---- legacy records -----------------------------------------------------------------------------------------

/// `isSeatRecord` (`src/runner/execution/legacy-seat-read.mjs:119`).
pub fn is_seat_record(record: &Value) -> bool {
    seat_resolver::is_seat_record(record)
}

/// `collaborationOfRecord(record, { shipped })` (`src/runner/execution/legacy-seat-read.mjs:134`) as a resume reads
/// it: the collaboration pin a record written before the pin decodes to, and the runner view its loop runs under.
pub fn collaboration_of_record(record: &Value, shipped: &Value) -> (Value, Value) {
    let decoded = seat_resolver::collaboration_of_record(record, Some(shipped));
    let field = |key: &str| decoded.get(key).cloned().unwrap_or(Value::Null);
    (field("collaboration"), field("runner"))
}

// ---- the derived unit summary -------------------------------------------------------------------------------

fn attempt_json(attempt: &SettledAttempt) -> Value {
    json!({
        "assignmentId": attempt.assignment_id,
        "assignment": attempt.assignment,
        "fallbackNo": attempt.fallback_no,
        "runName": attempt.run_name,
        "runResult": attempt.run_result,
        "outcome": attempt.outcome,
    })
}

/// A seat round as `readUnitRunSeats` returns it: `{ seat, round, attempts, final }`.
fn seat_json(seat: &SeatRound) -> Value {
    json!({
        "seat": seat.seat,
        "round": seat.round,
        "attempts": seat.attempts.iter().map(attempt_json).collect::<Vec<_>>(),
        "final": seat.final_attempt.as_ref().map(attempt_json),
    })
}

/// A published attempt without its terminal result: any `<seat>/<round>/runs/<run>` with `run.json` and no
/// `result.json` (`unitHasActiveRun`'s scan, `src/runner/execution/unit-summary.mjs:54`).
fn attempt_left_open(unit_dir: &Path) -> bool {
    let dirs = |dir: &Path| -> Vec<(String, std::path::PathBuf)> {
        std::fs::read_dir(dir)
            .into_iter()
            .flatten()
            .filter_map(Result::ok)
            .filter(|e| e.file_type().is_ok_and(|t| t.is_dir()))
            .map(|e| (e.file_name().to_string_lossy().into_owned(), e.path()))
            .collect()
    };
    let round_name = |name: &str| {
        let (round, fallback) = name.split_once("-fb").unwrap_or((name, "0"));
        [round, fallback]
            .iter()
            .all(|part| !part.is_empty() && part.bytes().all(|b| b.is_ascii_digit()))
    };
    dirs(unit_dir).iter().any(|(_, seat)| {
        dirs(seat)
            .iter()
            .filter(|(name, _)| round_name(name))
            .any(|(_, round)| {
                dirs(&round.join("runs")).iter().any(|(_, run)| {
                    run.join("run.json").exists() && !run.join("result.json").exists()
                })
            })
    })
}

/// `writeUnitSummary(unitDir)` (`src/runner/execution/unit-summary.mjs:208`): build the derived summary from
/// `unit.json` and the settled seats, and publish `unit-summary.json` through the durable-file door when it can be
/// published (no attempt open, an outcome and a settlement time known) and its bytes changed.
pub fn publish_unit_summary(unit_dir: &Path, shipped: &Value) -> Result<(), String> {
    let record: Value = std::fs::read(unit_dir.join("unit.json"))
        .map_err(|e| e.to_string())
        .and_then(|bytes| serde_json::from_slice(&bytes).map_err(|e| e.to_string()))?;
    let unit_run_id = unit_dir
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();
    let raw_seats: Vec<Value> = read_unit_run_seats(unit_dir)
        .map_err(|e| e.to_string())?
        .iter()
        .map(seat_json)
        .collect();
    let active = || unit_has_active_run(&record, || attempt_left_open(unit_dir));
    let summary = build_unit_summary(&SummaryInput {
        record: &record,
        unit_run_id: &unit_run_id,
        raw_seats: &raw_seats,
        shipped: Some(shipped),
        legacy_completion: None,
        active: active(),
    })
    .map_err(|e| e.0)?;
    if unit_summary_skip_reason(&summary, active).is_some() {
        return Ok(());
    }
    let content = serialize_unit_summary(&summary);
    let stored = std::fs::read(unit_dir.join("unit-summary.json")).ok();
    if stored.as_deref() == Some(content.as_bytes()) {
        return Ok(());
    }
    fgos_durable_file::replace_durably_with_mode(
        unit_dir,
        "unit-summary.json",
        content.as_bytes(),
        0o644,
    )
    .map(|_| ())
    .map_err(|e| e.to_string())
}
