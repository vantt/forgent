//! The id source of the store: fresh numbers from the operating system's
//! random device, unique across processes, where a counter in the snapshot
//! would not be (a lost or reset snapshot must never reuse an id).
use fgos_mailbox_core::IdSource;
use std::fs::File;
use std::io::{self, Read};

const RANDOM_DEVICE: &str = "/dev/urandom";

/// Reads 8 random bytes per number. The core's port is infallible, so a
/// failed read marks the source failed and yields 0; the hold checks
/// [`OsIds::failed`] after the core ran and then installs nothing.
#[derive(Debug)]
pub struct OsIds {
    device: File,
    failed: bool,
}

impl OsIds {
    pub fn open() -> io::Result<Self> {
        Ok(Self {
            device: File::open(RANDOM_DEVICE)?,
            failed: false,
        })
    }

    /// Whether any number handed out was not random.
    pub fn failed(&self) -> bool {
        self.failed
    }
}

impl IdSource for OsIds {
    fn next_u64(&mut self) -> u64 {
        let mut bytes = [0u8; 8];
        match self.device.read_exact(&mut bytes) {
            Ok(()) => u64::from_le_bytes(bytes),
            Err(_) => {
                self.failed = true;
                0
            }
        }
    }
}
