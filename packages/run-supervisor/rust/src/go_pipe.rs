//! The GO channel on Windows: a named pipe the supervisor listens on and the
//! gate connects to (`--go-socket <path>`). Frames are the same length-prefixed
//! JSON as on Unix, so the byte-mode pipe needs no framing of its own.

use std::fs::{File, OpenOptions};
use std::io;
use std::os::windows::io::{FromRawHandle, OwnedHandle, RawHandle};
use std::path::Path;
use std::time::{Duration, Instant};

use windows_sys::Win32::Foundation::{ERROR_PIPE_BUSY, ERROR_PIPE_CONNECTED, INVALID_HANDLE_VALUE};
use windows_sys::Win32::Storage::FileSystem::PIPE_ACCESS_DUPLEX;
use windows_sys::Win32::System::Pipes::{ConnectNamedPipe, CreateNamedPipeW, PIPE_READMODE_BYTE, PIPE_REJECT_REMOTE_CLIENTS, PIPE_TYPE_BYTE, PIPE_WAIT};

const BUFFER: u32 = 65_536;
/// How long a client keeps retrying a pipe that is busy or not yet created.
const CONNECT_WAIT: Duration = Duration::from_secs(5);

/// The listening end: one instance, local clients only.
pub struct PipeServer(OwnedHandle);

/// Create the pipe `path` (`\\.\pipe\<name>`). The client may connect as soon
/// as this returns; [`PipeServer::accept`] completes the handshake.
pub fn listen(path: &str) -> io::Result<PipeServer> {
    let wide: Vec<u16> = path.encode_utf16().chain(std::iter::once(0)).collect();
    // SAFETY: a NUL-terminated name, default security attributes, one instance.
    let handle = unsafe { CreateNamedPipeW(wide.as_ptr(), PIPE_ACCESS_DUPLEX, PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_WAIT | PIPE_REJECT_REMOTE_CLIENTS, 1, BUFFER, BUFFER, 0, std::ptr::null()) };
    if handle == INVALID_HANDLE_VALUE {
        return Err(io::Error::last_os_error());
    }
    // SAFETY: CreateNamedPipeW returned a fresh handle this value now owns.
    Ok(PipeServer(unsafe { OwnedHandle::from_raw_handle(handle as RawHandle) }))
}

impl PipeServer {
    /// Wait for the client and return the channel. A client that connected
    /// before this call counts.
    pub fn accept(self) -> io::Result<File> {
        use std::os::windows::io::AsRawHandle;
        // SAFETY: the handle is a pipe server handle; no overlapped structure, so the call blocks.
        let connected = unsafe { ConnectNamedPipe(self.0.as_raw_handle() as _, std::ptr::null_mut()) };
        if connected == 0 {
            let err = io::Error::last_os_error();
            if err.raw_os_error() != Some(ERROR_PIPE_CONNECTED as i32) {
                return Err(err);
            }
        }
        Ok(File::from(self.0))
    }
}

/// Connect to the pipe `path` as the gate does. Retries while the pipe is
/// busy or not created yet, for a bounded time.
pub fn connect(path: &Path) -> io::Result<File> {
    let start = Instant::now();
    loop {
        match OpenOptions::new().read(true).write(true).open(path) {
            Ok(file) => return Ok(file),
            Err(err) => {
                let retry = err.kind() == io::ErrorKind::NotFound || err.raw_os_error() == Some(ERROR_PIPE_BUSY as i32);
                if !retry || start.elapsed() >= CONNECT_WAIT {
                    return Err(err);
                }
                std::thread::sleep(Duration::from_millis(20));
            }
        }
    }
}
