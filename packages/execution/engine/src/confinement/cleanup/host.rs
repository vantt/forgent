//! What the cleanup asks of the machine it runs on: whether a recorded owner still runs, and what still runs from a
//! directory about to be deleted. The default is this machine; a test passes its own.

use crate::transport::worker_home::{HomeSweeper, ProcSweeper};
use fgos_process::facts::identity_of;
use fgos_process::ProcId;
use std::path::Path;

pub trait CleanupHost {
    /// Stop every process (other than this one and its parent) running from inside `dir`; the pids still alive
    /// afterwards, or whose identity could not be read.
    fn stop_inside(&self, dir: &Path) -> Vec<u32>;
    /// The dispatcher recorded in a marker is gone. A pid that cannot be read is not proof of death.
    fn owner_is_dead(&self, pid: u32) -> bool;
}

/// This machine: the process door's sweep and its identity read.
#[derive(Debug, Clone, Copy, Default)]
pub struct SystemHost {
    pub sweeper: ProcSweeper,
}

impl CleanupHost for SystemHost {
    fn stop_inside(&self, dir: &Path) -> Vec<u32> {
        self.sweeper.stop_inside(dir)
    }

    fn owner_is_dead(&self, pid: u32) -> bool {
        identity_of(ProcId(pid)).is_none()
    }
}
