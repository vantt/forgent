//! Start a process with an explicit list of the handles it inherits.
//!
//! `std::process::Command` always passes `bInheritHandles = TRUE`, so a child
//! inherits every inheritable handle the parent owns, whoever opened it. A
//! lock holder starts git hooks and the job keeper; none of them may see a
//! handle that was not meant for them. [`spawn`] hands the child exactly the
//! handles of its three standard streams, through `STARTUPINFOEXW` and
//! `PROC_THREAD_ATTRIBUTE_HANDLE_LIST`, and nothing else.
//!
//! The child is created suspended when the caller asks for it
//! (`CREATE_SUSPENDED` in `creation_flags`); [`Spawned::assign_and_resume`]
//! then puts it into a job before its first instruction.
//!
//! A batch file (`.bat`, `.cmd`) is refused: running one needs `cmd.exe` and
//! its quoting rules, which std itself only meets by refusing unsafe
//! arguments, and no borrowed command is one.

use std::ffi::{c_void, OsStr, OsString};
use std::fs::File;
use std::io;
use std::os::windows::ffi::OsStrExt;
use std::os::windows::io::{AsRawHandle, FromRawHandle, OwnedHandle, RawHandle};
use std::path::{Path, PathBuf};

use windows_sys::Win32::Foundation::{DuplicateHandle, SetHandleInformation, DUPLICATE_SAME_ACCESS, HANDLE, HANDLE_FLAG_INHERIT, INVALID_HANDLE_VALUE, WAIT_OBJECT_0, WAIT_TIMEOUT};
use windows_sys::Win32::System::Threading::{
    CreateProcessW, DeleteProcThreadAttributeList, GetCurrentProcess, GetExitCodeProcess, InitializeProcThreadAttributeList, TerminateProcess, UpdateProcThreadAttribute, WaitForSingleObject, CREATE_UNICODE_ENVIRONMENT,
    EXTENDED_STARTUPINFO_PRESENT, INFINITE, PROCESS_INFORMATION, PROC_THREAD_ATTRIBUTE_HANDLE_LIST, STARTF_USESTDHANDLES, STARTUPINFOEXW,
};

use super::windows_job::{assign_and_resume_handles, Job};

/// Where one standard stream of the child goes.
pub enum ChildStdio {
    /// The parent's own stream (a copy made inheritable for this child only).
    Inherit,
    /// The `NUL` device.
    Null,
    /// A pipe; the parent's end comes back in [`Spawned`].
    Piped,
    /// This file (its handle is copied for the child; the file stays the caller's).
    File(File),
}

/// Everything [`spawn`] needs.
pub struct SpawnSpec {
    /// The program: a path, or a bare name searched for in `PATH` of the child's environment.
    pub program: OsString,
    /// The arguments after the program.
    pub args: Vec<OsString>,
    /// The working directory; `None` keeps the caller's.
    pub cwd: Option<PathBuf>,
    /// The child's whole environment; `None` is the caller's own.
    pub env: Option<Vec<(OsString, OsString)>>,
    /// `dwCreationFlags` on top of the Unicode-environment and extended-startup flags.
    pub creation_flags: u32,
    /// Standard input.
    pub stdin: ChildStdio,
    /// Standard output.
    pub stdout: ChildStdio,
    /// Standard error.
    pub stderr: ChildStdio,
}

/// A started process: its handles, and the parent's ends of any pipes.
pub struct Spawned {
    process: OwnedHandle,
    thread: OwnedHandle,
    pid: u32,
    /// The parent's write end of a piped stdin.
    pub stdin: Option<File>,
    /// The parent's read end of a piped stdout.
    pub stdout: Option<File>,
    /// The parent's read end of a piped stderr.
    pub stderr: Option<File>,
}

impl Spawned {
    /// The process id.
    pub fn id(&self) -> u32 {
        self.pid
    }

    /// The process handle.
    pub fn as_raw_handle(&self) -> RawHandle {
        self.process.as_raw_handle()
    }

    /// Wait for the process and return its exit code.
    pub fn wait(&self) -> io::Result<u32> {
        // SAFETY: the process handle is open for the life of `self`.
        match unsafe { WaitForSingleObject(self.process.as_raw_handle() as HANDLE, INFINITE) } {
            WAIT_OBJECT_0 => self.exit_code(),
            _ => Err(io::Error::last_os_error()),
        }
    }

    /// The exit code when the process has exited, `None` while it runs.
    pub fn try_wait(&self) -> io::Result<Option<u32>> {
        // SAFETY: as in `wait`; a zero wait only polls.
        match unsafe { WaitForSingleObject(self.process.as_raw_handle() as HANDLE, 0) } {
            WAIT_OBJECT_0 => self.exit_code().map(Some),
            WAIT_TIMEOUT => Ok(None),
            _ => Err(io::Error::last_os_error()),
        }
    }

    /// End the process at once.
    pub fn kill(&self) -> io::Result<()> {
        // SAFETY: terminating the process this handle names.
        if unsafe { TerminateProcess(self.process.as_raw_handle() as HANDLE, 1) } == 0 {
            return Err(io::Error::last_os_error());
        }
        Ok(())
    }

    /// Put a process created with `CREATE_SUSPENDED` into `job`, then resume
    /// its main thread, so it runs its first instruction inside the job. On
    /// failure the suspended process is ended.
    pub fn assign_and_resume(&self, job: &Job) -> io::Result<()> {
        assign_and_resume_handles(job, self.process.as_raw_handle() as HANDLE, self.thread.as_raw_handle() as HANDLE)
    }

    fn exit_code(&self) -> io::Result<u32> {
        let mut code = 0u32;
        // SAFETY: an open process handle and one valid out-pointer.
        if unsafe { GetExitCodeProcess(self.process.as_raw_handle() as HANDLE, &mut code) } == 0 {
            return Err(io::Error::last_os_error());
        }
        Ok(code)
    }
}

fn wide(text: &OsStr) -> Vec<u16> {
    text.encode_wide().collect()
}

/// Append `arg` to a command line with the quoting every Windows runtime
/// reads back as the same single argument: wrap in quotes when it is empty or
/// holds a space, tab, newline or quote; double the backslashes that precede a
/// quote or the closing quote; escape the quotes themselves.
fn append_arg(line: &mut Vec<u16>, arg: &OsStr) {
    let units = wide(arg);
    let special = |unit: &u16| matches!(*unit, 0x20 | 0x09 | 0x0a | 0x0b | 0x22);
    if !units.is_empty() && !units.iter().any(special) {
        line.extend(units);
        return;
    }
    let (quote, backslash) = (u16::from(b'"'), u16::from(b'\\'));
    line.push(quote);
    let mut backslashes = 0usize;
    for unit in units {
        if unit == backslash {
            backslashes += 1;
            continue;
        }
        let escaped = if unit == quote { backslashes * 2 + 1 } else { backslashes };
        line.extend(std::iter::repeat(backslash).take(escaped));
        backslashes = 0;
        line.push(unit);
    }
    line.extend(std::iter::repeat(backslash).take(backslashes * 2));
    line.push(quote);
}

/// The command line: the program, then every argument, each quoted.
fn command_line(program: &OsStr, args: &[OsString]) -> Vec<u16> {
    let mut line = Vec::new();
    append_arg(&mut line, program);
    for arg in args {
        line.push(u16::from(b' '));
        append_arg(&mut line, arg);
    }
    line.push(0);
    line
}

/// The environment block: `NAME=value` entries in case-insensitive name order,
/// each ended by a NUL, the block ended by one more.
fn environment_block(vars: &[(OsString, OsString)]) -> Vec<u16> {
    let mut sorted: Vec<&(OsString, OsString)> = vars.iter().collect();
    sorted.sort_by_key(|(name, _)| wide(name).iter().map(|u| char::from_u32(u32::from(*u)).map_or(*u, |c| c.to_ascii_uppercase() as u16)).collect::<Vec<u16>>());
    let mut block = Vec::new();
    for (name, value) in sorted {
        block.extend(wide(name));
        block.push(u16::from(b'='));
        block.extend(wide(value));
        block.push(0);
    }
    if block.is_empty() {
        block.push(0);
    }
    block.push(0);
    block
}

/// The program as a path: a name with a directory part is used as given
/// (`.exe` added when it has no extension); a bare name is searched for in
/// `PATH` of the child's environment, never in the working directory.
fn resolve_program(program: &OsStr, path_var: Option<&OsStr>) -> io::Result<PathBuf> {
    let with_extension = |candidate: PathBuf| if candidate.extension().is_some() { candidate } else { candidate.with_extension("exe") };
    let direct = Path::new(program);
    let has_directory = program.to_string_lossy().contains(['\\', '/', ':']);
    let found = if has_directory {
        let candidate = with_extension(direct.to_path_buf());
        candidate.is_file().then_some(candidate)
    } else {
        path_var.and_then(|paths| std::env::split_paths(paths).map(|dir| with_extension(dir.join(program))).find(|candidate| candidate.is_file()))
    };
    let found = found.ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, format!("program not found: {}", program.to_string_lossy())))?;
    let ext = found.extension().and_then(OsStr::to_str).map(str::to_ascii_lowercase);
    if matches!(ext.as_deref(), Some("bat") | Some("cmd")) {
        return Err(io::Error::new(io::ErrorKind::InvalidInput, format!("a batch file cannot be started with an explicit handle list: {}", found.display())));
    }
    Ok(found)
}

fn path_of(env: &[(OsString, OsString)]) -> Option<OsString> {
    env.iter().find(|(name, _)| name.to_string_lossy().eq_ignore_ascii_case("PATH")).map(|(_, value)| value.clone())
}

/// An inheritable copy of `handle`, owned by this process until it is dropped
/// after the spawn. Nothing but the handle list lets the child see it.
fn inheritable_copy(handle: HANDLE) -> io::Result<OwnedHandle> {
    let mut copy: HANDLE = std::ptr::null_mut();
    // SAFETY: duplicating a handle of this process into this process.
    let ok = unsafe { DuplicateHandle(GetCurrentProcess(), handle, GetCurrentProcess(), &mut copy, 0, 1, DUPLICATE_SAME_ACCESS) };
    if ok == 0 {
        return Err(io::Error::last_os_error());
    }
    // SAFETY: `copy` is a fresh handle this function owns.
    Ok(unsafe { OwnedHandle::from_raw_handle(copy as RawHandle) })
}

/// The child's end of one stream (inheritable) and, for a pipe, the parent's end.
struct Stream {
    child: Option<OwnedHandle>,
    parent: Option<File>,
}

fn usable(handle: HANDLE) -> bool {
    !handle.is_null() && handle != INVALID_HANDLE_VALUE
}

fn open_stream(kind: ChildStdio, standard: HANDLE, reading: bool) -> io::Result<Stream> {
    match kind {
        ChildStdio::Inherit => Ok(Stream { child: usable(standard).then(|| inheritable_copy(standard)).transpose()?, parent: None }),
        ChildStdio::Null => {
            let nul = std::fs::OpenOptions::new().read(reading).write(!reading).open("NUL")?;
            Ok(Stream { child: Some(inheritable_copy(nul.as_raw_handle() as HANDLE)?), parent: None })
        }
        ChildStdio::File(file) => Ok(Stream { child: Some(inheritable_copy(file.as_raw_handle() as HANDLE)?), parent: None }),
        ChildStdio::Piped => {
            let (read_end, write_end) = std::io::pipe()?;
            let (child_end, parent_end): (OwnedHandle, OwnedHandle) = if reading { (read_end.into(), write_end.into()) } else { (write_end.into(), read_end.into()) };
            // The parent's end is never inheritable, whatever the pipe was
            // created with; the child gets a copy of its own end.
            // SAFETY: clearing one flag on a handle this function owns.
            if unsafe { SetHandleInformation(parent_end.as_raw_handle() as HANDLE, HANDLE_FLAG_INHERIT, 0) } == 0 {
                return Err(io::Error::last_os_error());
            }
            let child = inheritable_copy(child_end.as_raw_handle() as HANDLE)?;
            Ok(Stream { child: Some(child), parent: Some(File::from(parent_end)) })
        }
    }
}

/// An attribute list holding one handle list; deleted on drop.
struct AttributeList {
    // `usize` slots keep the buffer pointer-aligned.
    buffer: Vec<usize>,
}

impl AttributeList {
    /// `handles` must outlive the list and the `CreateProcessW` call that reads it.
    fn with_handle_list(handles: &mut [HANDLE]) -> io::Result<AttributeList> {
        let mut size = 0usize;
        // SAFETY: the documented size query: it fails with ERROR_INSUFFICIENT_BUFFER and sets `size`.
        unsafe { InitializeProcThreadAttributeList(std::ptr::null_mut(), 1, 0, &mut size) };
        let mut buffer = vec![0usize; size.div_ceil(std::mem::size_of::<usize>()).max(1)];
        // SAFETY: a zeroed buffer of the size just asked for.
        if unsafe { InitializeProcThreadAttributeList(buffer.as_mut_ptr() as *mut c_void, 1, 0, &mut size) } == 0 {
            return Err(io::Error::last_os_error());
        }
        let list = AttributeList { buffer };
        // SAFETY: the list is initialized for one attribute; `handles` is kept alive by the caller.
        let ok = unsafe { UpdateProcThreadAttribute(list.pointer(), 0, PROC_THREAD_ATTRIBUTE_HANDLE_LIST as usize, handles.as_mut_ptr() as *const c_void, std::mem::size_of_val(handles), std::ptr::null_mut(), std::ptr::null()) };
        if ok == 0 {
            return Err(io::Error::last_os_error());
        }
        Ok(list)
    }

    fn pointer(&self) -> *mut c_void {
        self.buffer.as_ptr() as *mut c_void
    }
}

impl Drop for AttributeList {
    fn drop(&mut self) {
        // SAFETY: the list was initialized by `with_handle_list`.
        unsafe { DeleteProcThreadAttributeList(self.pointer()) };
    }
}

/// Start `spec` with the handles of its three streams as the only inherited handles.
pub fn spawn(spec: SpawnSpec) -> io::Result<Spawned> {
    let env: Vec<(OsString, OsString)> = match spec.env {
        Some(env) => env,
        None => std::env::vars_os().collect(),
    };
    // A child environment without PATH still finds a bare program name, as it did under std.
    let search = path_of(&env).or_else(|| std::env::var_os("PATH"));
    let program = resolve_program(&spec.program, search.as_deref())?;
    let mut line = command_line(&spec.program, &spec.args);
    let application = wide(program.as_os_str()).into_iter().chain(std::iter::once(0)).collect::<Vec<u16>>();
    let block = environment_block(&env);
    let cwd = spec.cwd.as_ref().map(|dir| wide(dir.as_os_str()).into_iter().chain(std::iter::once(0)).collect::<Vec<u16>>());

    let stdin = open_stream(spec.stdin, std::io::stdin().as_raw_handle() as HANDLE, true)?;
    let stdout = open_stream(spec.stdout, std::io::stdout().as_raw_handle() as HANDLE, false)?;
    let stderr = open_stream(spec.stderr, std::io::stderr().as_raw_handle() as HANDLE, false)?;
    let raw = |stream: &Stream| stream.child.as_ref().map_or(std::ptr::null_mut(), |handle| handle.as_raw_handle() as HANDLE);
    let (child_in, child_out, child_err) = (raw(&stdin), raw(&stdout), raw(&stderr));
    // One entry per distinct handle: a duplicate in the list is refused.
    let mut inherited: Vec<HANDLE> = Vec::new();
    for handle in [child_in, child_out, child_err] {
        if usable(handle) && !inherited.contains(&handle) {
            inherited.push(handle);
        }
    }

    // SAFETY: STARTUPINFOEXW is plain data; zero is its empty value.
    let mut startup: STARTUPINFOEXW = unsafe { std::mem::zeroed() };
    startup.StartupInfo.cb = std::mem::size_of::<STARTUPINFOEXW>() as u32;
    startup.StartupInfo.dwFlags = STARTF_USESTDHANDLES;
    startup.StartupInfo.hStdInput = child_in;
    startup.StartupInfo.hStdOutput = child_out;
    startup.StartupInfo.hStdError = child_err;
    let attributes = if inherited.is_empty() { None } else { Some(AttributeList::with_handle_list(&mut inherited)?) };
    let mut flags = spec.creation_flags | CREATE_UNICODE_ENVIRONMENT;
    if let Some(list) = &attributes {
        startup.lpAttributeList = list.pointer();
        flags |= EXTENDED_STARTUPINFO_PRESENT;
    }

    // SAFETY: PROCESS_INFORMATION is plain data filled in by the call.
    let mut info: PROCESS_INFORMATION = unsafe { std::mem::zeroed() };
    // SAFETY: every pointer names a live, NUL-ended buffer (or null); `line` is writable as the API requires.
    let ok = unsafe {
        CreateProcessW(
            application.as_ptr(),
            line.as_mut_ptr(),
            std::ptr::null(),
            std::ptr::null(),
            i32::from(!inherited.is_empty()),
            flags,
            block.as_ptr() as *const c_void,
            cwd.as_ref().map_or(std::ptr::null(), |dir| dir.as_ptr()),
            &startup.StartupInfo,
            &mut info,
        )
    };
    if ok == 0 {
        return Err(io::Error::last_os_error());
    }
    // SAFETY: CreateProcessW returned two fresh handles this function owns.
    let (process, thread) = unsafe { (OwnedHandle::from_raw_handle(info.hProcess as RawHandle), OwnedHandle::from_raw_handle(info.hThread as RawHandle)) };
    // The child holds its own copies now; this process closes the inheritable ones on drop.
    Ok(Spawned { process, thread, pid: info.dwProcessId, stdin: stdin.parent, stdout: stdout.parent, stderr: stderr.parent })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn text(units: Vec<u16>) -> String {
        String::from_utf16(&units).unwrap()
    }

    fn quoted(arg: &str) -> String {
        let mut line = Vec::new();
        append_arg(&mut line, OsStr::new(arg));
        text(line)
    }

    #[test]
    fn arguments_are_quoted_so_a_runtime_reads_them_back_unchanged() {
        assert_eq!(quoted("plain"), "plain");
        assert_eq!(quoted(""), "\"\"");
        assert_eq!(quoted("two words"), "\"two words\"");
        assert_eq!(quoted("say \"hi\""), "\"say \\\"hi\\\"\"");
        assert_eq!(quoted("dir\\"), "dir\\");
        assert_eq!(quoted("a dir\\"), "\"a dir\\\\\"");
        assert_eq!(quoted("a\\\"b"), "\"a\\\\\\\"b\"");
    }

    #[test]
    fn the_environment_block_is_sorted_by_name_without_case_and_double_terminated() {
        let vars = vec![(OsString::from("b"), OsString::from("2")), (OsString::from("A"), OsString::from("1"))];
        let block = text(environment_block(&vars));
        assert_eq!(block, "A=1\0b=2\0\0");
        assert_eq!(environment_block(&[]), vec![0, 0]);
    }

    #[test]
    fn a_batch_file_is_refused() {
        let dir = std::env::temp_dir().join(format!("fgos-spawn-bat-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("tool.cmd"), "@echo off\r\n").unwrap();
        let err = resolve_program(dir.join("tool.cmd").as_os_str(), None).unwrap_err();
        assert_eq!(err.kind(), io::ErrorKind::InvalidInput);
        let _ = std::fs::remove_dir_all(&dir);
    }
}
