//! The step runner of `fgos internal attempt-step`: the run supervisor's route verifies the attempt's envelope
//! (digest, this host binary, the step listed) and hands the step here, where it runs in-process from the Execution
//! engine's post-receipt steps (`settle-attempt`, `finalize-home`, `cleanup-trust`) over the host's ports. The
//! supervisor crate stays free of the engine: it receives this function as its `StepRunner` port.

use std::collections::BTreeMap;
use std::io::Write;
use std::path::Path;

use fgos_execution_engine::settlement::{AccountsFaultSink, GitDoor, ObserveFrictionSink};
use fgos_execution_engine::steps::{run_attempt_step, StepPorts, EXIT_ERROR};
use fgos_run_supervisor::route::report;

use crate::wiring::unit_run_host::settlement::{HostHomes, HostPaneScreen};

/// Run `step_id` of the verified attempt in `run_dir`: print its one result line (step-receipt stepProcess) and
/// return its exit code. The step runner starts the route with only `steps[].env`, which names the state root.
pub fn run_step(step_id: &str, run_dir: &Path) -> i32 {
    let env: BTreeMap<String, String> = std::env::vars().collect();
    let state_root = fgos_holder_lock::state_root::state_root().0;
    let git = match GitDoor::new(&state_root) {
        Ok(git) => git,
        Err(why) => {
            report(
                "attempt-step",
                "internal",
                &format!("the Git door does not open on the state root: {why}"),
            );
            return EXIT_ERROR;
        }
    };
    let ports = StepPorts {
        git: &git,
        faults: &AccountsFaultSink::machine(),
        friction: &ObserveFrictionSink,
        pane: &HostPaneScreen,
        finalizer: &HostHomes,
    };
    let run = run_attempt_step(step_id, run_dir, &env, &ports);
    // A closed stdout must not turn the step's exit code into a panic.
    let _ = writeln!(std::io::stdout(), "{}", run.line);
    run.exit
}
