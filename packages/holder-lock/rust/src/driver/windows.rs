//! Windows: no driver yet. Every lock reports `unsupported` and nothing
//! falls back to the old file-existence locks; the driver is written once
//! the Windows probes are green on a real machine.

use std::fs::File;
use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;

use super::{Leftovers, LockDriver, TryLock};
use crate::port::{Guarantee, HoldersList, Level, Mode};

/// The placeholder Windows driver.
pub struct WindowsDriver;

const DETAIL: &str = "no Windows lock driver yet (written after the Windows probes are green on a real machine)";

fn unsupported() -> Guarantee {
    Guarantee {
        driver: "unsupported",
        exclusion: Level::Unsupported,
        borrow: Level::Unsupported,
        holders: Level::Unsupported,
        platform: "windows",
        notes: vec![DETAIL.to_string()],
    }
}

impl LockDriver for WindowsDriver {
    fn supported(&self) -> bool {
        false
    }

    fn unsupported_detail(&self) -> &'static str {
        DETAIL
    }

    fn try_lock(&self, _file: &File, _mode: Mode) -> io::Result<TryLock> {
        Err(io::Error::new(io::ErrorKind::Unsupported, DETAIL))
    }

    fn guarantee(&self, _dir: &Path) -> Guarantee {
        unsupported()
    }

    fn file_guarantee(&self, _file: &File) -> io::Result<Guarantee> {
        Ok(unsupported())
    }

    fn description_path(&self, _file: &File) -> io::Result<PathBuf> {
        Err(io::Error::new(io::ErrorKind::Unsupported, DETAIL))
    }

    fn holders(&self, _file: &File) -> HoldersList {
        HoldersList::Unlistable(DETAIL.to_string())
    }

    fn prepare_borrow(&self, _cmd: &mut Command) {}

    fn end_leftovers(&self, _file: &File, _child_pid: u32, _kill_wait: Duration) -> Result<u32, Leftovers> {
        Err(Leftovers { killed: 0, pids: Vec::new() })
    }
}
