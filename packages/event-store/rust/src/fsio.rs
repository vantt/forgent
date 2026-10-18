//! Filesystem port: production uses real files; fault drivers can interrupt named
//! protocol boundaries or return a genuine short write. No environment controls.
use crate::{
    envelope::line,
    errors::{io as io_error, Error},
};
use std::{
    fs::File,
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
    fn sync_file(&self, file: &File) -> io::Result<()> {
        file.sync_all()
    }
    fn sync_directory(&self, path: &Path) -> io::Result<()> {
        fgos_durable_file::sync_directory(path)
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
/// The shared durable-file leaf owns temporary creation and atomic replacement.
pub(crate) fn write_hwm(root: &Path, seq: u64, fs: &dyn FileSystem) -> Result<(), Error> {
    use fgos_durable_file::ReplacePoint;
    point(fs, Point::BeforeHwm)?;
    fgos_durable_file::replace_durably_observed(
        root,
        "hwm.json",
        &line(&serde_json::json!({"lastSeq":seq}))?,
        |p| {
            fs.checkpoint(match p {
                ReplacePoint::Written => Point::AfterHwmWrite,
                ReplacePoint::Synced => Point::AfterHwmFsync,
                ReplacePoint::Renamed => Point::AfterHwmRename,
                ReplacePoint::DirectorySynced => Point::AfterHwmDirFsync,
            })
        },
    )
    .map_err(|e| io_error(io::Error::other(e)))?;
    Ok(())
}
