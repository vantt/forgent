//! The short append-locked rotation stage; publication belongs to phase 04.
use crate::{
    append::{prepare_stream, read_last_seq, recover},
    errors::{io, Error},
    fsio::{point, sync_dir, write_hwm, FileSystem, OsFileSystem, Point},
    identity::StoreIdentity,
    layout::{Layout, StreamId},
    locks::acquire_append,
};
use std::{
    fs::{self, File},
    path::PathBuf,
};
#[derive(Debug)]
pub struct Rotation {
    pub segment: Option<PathBuf>,
    pub last_seq: u64,
    pub guarantee: fgos_holder_lock::Guarantee,
}
pub fn rotate(
    layout: &Layout,
    machine: &str,
    stream: &StreamId,
    held_ranks: &[u32],
) -> Result<Rotation, Error> {
    rotate_with_fs(layout, machine, stream, held_ranks, &OsFileSystem)
}
pub fn rotate_with_fs(
    layout: &Layout,
    machine: &str,
    stream: &StreamId,
    held_ranks: &[u32],
    fs: &dyn FileSystem,
) -> Result<Rotation, Error> {
    let guard = acquire_append(layout, held_ranks, fs)?;
    StoreIdentity::sweep_temps_under_append_lock(layout)?;
    let identity = StoreIdentity::open(layout, machine)?;
    let paths = prepare_stream(layout, stream)?;
    let active = recover(&paths, &identity.store_id, stream, &guard, fs)?;
    let high = read_last_seq(&paths.hwm())?.unwrap_or(0);
    let mut segment = None;
    if let Some(first) = active.events.first() {
        File::open(paths.active())
            .and_then(|f| f.sync_all())
            .map_err(io)?;
        point(fs, Point::AfterRotationFsync)?;
        let target = paths.segment(first.seq, high)?;
        // Recovery rejects overlapping closed ranges, so this name cannot
        // already exist. Never overwrite an immutable segment on a bad input.
        match fs::symlink_metadata(&target) {
            Ok(_) => return Err(crate::errors::invalid("rotation target already exists")),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
            Err(e) => return Err(io(e)),
        }
        point(fs, Point::BeforeRotationRename)?;
        fs::rename(paths.active(), &target).map_err(io)?;
        point(fs, Point::AfterRotationRename)?;
        sync_dir(&paths.closed())?;
        point(fs, Point::AfterClosedDirFsync)?;
        sync_dir(&paths.root)?;
        point(fs, Point::AfterStreamDirFsync)?;
        write_hwm(&paths.root, high, fs)?;
        segment = Some(target);
    }
    Ok(Rotation {
        segment,
        last_seq: high,
        guarantee: guard.guarantee.clone(),
    })
}
