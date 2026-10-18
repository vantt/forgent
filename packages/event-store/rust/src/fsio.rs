//! Filesystem port: production uses real files; fault drivers can interrupt named
//! protocol boundaries or return a genuine short write. No environment controls.
use crate::{
    envelope::line,
    errors::{io as io_error, Error},
};
use std::{
    fs::{self, File, OpenOptions},
    io::{self, Write},
    path::Path,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Point {
    AfterActiveOpen,
    AfterActiveRead,
    AfterClosedList,
    BeforeAppendWrite,
    AfterAppendWrite,
    AfterAppendFsync,
    AfterAppendDirFsync,
    AfterTruncate,
    AfterTruncateFsync,
    AfterRotationFsync,
    BeforeRotationRename,
    AfterRotationRename,
    AfterClosedDirFsync,
    AfterStreamDirFsync,
    BeforeHwm,
    AfterHwmWrite,
    AfterHwmFsync,
    AfterHwmRename,
    AfterHwmDirFsync,
}
pub trait FileSystem {
    fn checkpoint(&self, _point: Point) -> io::Result<()> {
        Ok(())
    }
    fn write_batch(&self, file: &mut File, bytes: &[u8]) -> io::Result<usize> {
        file.write(bytes)
    }
    fn guarantee(&self, path: &Path) -> fgos_holder_lock::Guarantee {
        fgos_holder_lock::guarantee(path)
    }
}
pub struct OsFileSystem;
impl FileSystem for OsFileSystem {}

pub(crate) fn point(fs: &dyn FileSystem, p: Point) -> Result<(), Error> {
    fs.checkpoint(p).map_err(io_error)
}
pub(crate) fn sync_dir(path: &Path) -> Result<(), Error> {
    fgos_durable_file::sync_directory(path).map_err(io_error)
}
/// The append lock serializes this replaceable hint. A fixed temporary is safe
/// only under that lock; a crash's temporary is replaced on the next recovery.
pub(crate) fn write_hwm(root: &Path, seq: u64, fs: &dyn FileSystem) -> Result<(), Error> {
    point(fs, Point::BeforeHwm)?;
    let tmp = root.join("hwm.json.tmp");
    let mut options = OpenOptions::new();
    options.write(true).create(true).truncate(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        // The root is a trusted store directory. Refuse symlinked temporaries.
        options.mode(0o600);
    }
    // Remove the previous crash's temporary without following its target.
    match fs::remove_file(&tmp) {
        Ok(()) => (),
        Err(e) if e.kind() == io::ErrorKind::NotFound => (),
        Err(e) => return Err(io_error(e)),
    }
    let mut file = options.create_new(true).open(&tmp).map_err(io_error)?;
    file.write_all(&line(&serde_json::json!({"lastSeq":seq}))?)
        .map_err(io_error)?;
    point(fs, Point::AfterHwmWrite)?;
    file.sync_all().map_err(io_error)?;
    point(fs, Point::AfterHwmFsync)?;
    fs::rename(tmp, root.join("hwm.json")).map_err(io_error)?;
    point(fs, Point::AfterHwmRename)?;
    sync_dir(root)?;
    point(fs, Point::AfterHwmDirFsync)
}
