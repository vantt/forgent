//! Durability of loose objects, shared by every port that makes Git objects.
//!
//! Git never fsyncs a directory (spec section 10), and `git add` /
//! `write-tree` do not fsync the loose files they write; making an object's
//! name and bytes survive a power cut is this crate's job. One function does
//! it for all callers, so the order and the memo stay in one place.
use crate::Oid;
use std::{
    collections::BTreeSet,
    fs,
    io::{self, Read},
    path::{Path, PathBuf},
};

/// A loose object file Git could not have left whole: empty (a power cut kept
/// the name but lost the bytes) or not starting with a zlib header. Cheap by
/// design (two bytes); a truncated stream behind a good header is not seen here.
fn intact(file: &Path, len: u64) -> io::Result<bool> {
    if len < 2 {
        return Ok(false);
    }
    let mut head = [0u8; 2];
    fs::File::open(file)?.read_exact(&mut head)?;
    Ok(head[0] & 0x0f == 8 && (u16::from(head[0]) << 8 | u16::from(head[1])) % 31 == 0)
}

/// The oids among `oids` whose loose file is present but not intact. Git never
/// rewrites such a file (it finds the name taken), so a caller that is about to
/// name these objects must heal or refuse; `sync_loose_objects` refuses.
pub(crate) fn corrupt_loose_objects(common: &Path, oids: &[Oid]) -> io::Result<Vec<Oid>> {
    let mut corrupt = Vec::new();
    for oid in oids {
        let hex = oid.as_str();
        let file = common.join("objects").join(&hex[..2]).join(&hex[2..]);
        match fs::symlink_metadata(&file) {
            Ok(m) if m.is_file() => {
                if !intact(&file, m.len())? {
                    corrupt.push(oid.clone());
                }
            }
            Ok(_) => return Err(io::Error::other("untrusted-object-file")),
            Err(e) if e.kind() == io::ErrorKind::NotFound => {}
            Err(e) => return Err(e),
        }
    }
    Ok(corrupt)
}

/// Make every loose object in `oids` durable (refusing `object-file-corrupt`
/// for one that is empty or not zlib: syncing it would only make it permanent): its file, its fan-out
/// directory and `objects/`, all fsynced in one concurrent batch (one
/// journal commit instead of one per path). An object with no loose file
/// (packed) needs nothing, and a loose file this process already made durable
/// and that is still the same file is skipped. Returns the paths fsynced.
///
/// `sync_files` is false only for objects Git wrote under `core.fsync`, whose
/// file it already fsynced before linking it; objects written by `git add` or
/// `write-tree` need it.
pub(crate) fn sync_loose_objects(common: &Path, oids: &[Oid], sync_files: bool) -> io::Result<Vec<PathBuf>> {
    let objects = common.join("objects");
    #[cfg_attr(not(unix), allow(unused_mut))]
    let mut files = Vec::new();
    let mut dirs = BTreeSet::new();
    let mut pending = Vec::new();
    for oid in oids {
        if durable_objects::durable(common, oid) {
            continue;
        }
        let hex = oid.as_str();
        let fanout = objects.join(&hex[..2]);
        let file = fanout.join(&hex[2..]);
        match fs::symlink_metadata(&file) {
            Ok(m) if m.is_file() => {
                if !intact(&file, m.len())? {
                    return Err(io::Error::other("object-file-corrupt"));
                }
            }
            Ok(_) => return Err(io::Error::other("untrusted-object-file")),
            Err(e) if e.kind() == io::ErrorKind::NotFound => continue,
            Err(e) => return Err(e),
        }
        // Windows cannot open a read-only loose file for fsync; durability is
        // Unix-only today and the memo never records there.
        #[cfg(unix)]
        if sync_files {
            files.push(file);
        }
        #[cfg(not(unix))]
        let _ = (sync_files, file);
        dirs.insert(fanout);
        pending.push(oid);
    }
    if pending.is_empty() {
        return Ok(Vec::new());
    }
    dirs.insert(objects);
    for dir in &dirs {
        let meta = fs::symlink_metadata(dir)?;
        if !meta.is_dir() || meta.file_type().is_symlink() {
            return Err(io::Error::other("untrusted-object-directory"));
        }
    }
    let synced: Vec<PathBuf> = files.into_iter().chain(dirs).collect();
    let paths: Vec<&Path> = synced.iter().map(PathBuf::as_path).collect();
    fgos_durable_file::sync_directories(&paths)?;
    for oid in pending {
        durable_objects::remember(common, oid);
    }
    Ok(synced)
}

/// Loose objects this process made durable (file, fan-out and `objects/`
/// directories fsynced), by common dir, oid and the loose file's inode. While
/// the same file is still at its name, that name is durable: no fsync of ours
/// is needed again. Bounded in size and age.
mod durable_objects {
    use crate::Oid;
    use std::collections::HashMap;
    use std::path::{Path, PathBuf};
    use std::sync::Mutex;
    use std::time::{Duration, Instant};
    const KEEP: Duration = Duration::from_secs(600);
    const BOUND: usize = 4096;
    type Key = (PathBuf, String);
    /// Device, inode and birth time of the loose file, and durability time.
    type Seen = HashMap<Key, ((u64, u64, u128), Instant)>;
    static SEEN: Mutex<Option<Seen>> = Mutex::new(None);
    #[cfg(unix)]
    fn loose(common: &Path, oid: &Oid) -> Option<(u64, u64, u128)> {
        let s = oid.as_str();
        let m = std::fs::symlink_metadata(common.join("objects").join(&s[..2]).join(&s[2..])).ok()?;
        m.is_file().then(|| crate::wal::durable_identity(&m)).flatten()
    }
    #[cfg(not(unix))]
    fn loose(_: &Path, _: &Oid) -> Option<(u64, u64, u128)> {
        None
    }
    pub(super) fn remember(common: &Path, oid: &Oid) {
        let Some(file) = loose(common, oid) else { return };
        if let Ok(mut seen) = SEEN.lock() {
            let seen = seen.get_or_insert_with(HashMap::new);
            if seen.len() >= BOUND {
                seen.retain(|_, (_, at)| at.elapsed() < KEEP);
                if seen.len() >= BOUND {
                    seen.clear();
                }
            }
            seen.insert((common.to_path_buf(), oid.as_str().to_owned()), (file, Instant::now()));
        }
    }
    /// The loose file this process made durable is still the one at its name.
    pub(super) fn durable(common: &Path, oid: &Oid) -> bool {
        let known = SEEN.lock().ok().and_then(|seen| {
            seen.as_ref()
                .and_then(|seen| seen.get(&(common.to_path_buf(), oid.as_str().to_owned())).copied())
        });
        matches!(known, Some((file, at)) if at.elapsed() < KEEP && loose(common, oid) == Some(file))
    }
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use crate::ObjectFormat;
    use std::io::Write;
    use std::process::{Command, Stdio};

    fn git(dir: &Path, args: &[&str], input: &[u8]) -> String {
        let mut child = Command::new("git")
            .arg("-C")
            .arg(dir)
            .args(args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .unwrap();
        child.stdin.take().unwrap().write_all(input).unwrap();
        let out = child.wait_with_output().unwrap();
        assert!(out.status.success(), "{args:?}");
        String::from_utf8(out.stdout).unwrap().trim().to_owned()
    }
    /// A fresh repository: the work tree and its common dir.
    fn scratch(name: &str) -> (PathBuf, PathBuf) {
        let dir = std::env::temp_dir().join(format!("fgos-objects-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        git(&dir, &["init", "-q"], b"");
        let common = dir.join(".git");
        (dir, common)
    }
    fn write(dir: &Path, bytes: &[u8]) -> Oid {
        let hex = git(dir, &["hash-object", "-w", "--stdin"], bytes);
        Oid::parse(&hex, ObjectFormat::Sha1).unwrap()
    }
    fn fanout(common: &Path, oid: &Oid) -> PathBuf {
        common.join("objects").join(&oid.as_str()[..2])
    }

    #[test]
    fn a_loose_object_gets_its_file_fanout_and_objects_dir_synced_once() {
        let (dir, common) = scratch("loose");
        let oid = write(&dir, b"one");
        let file = fanout(&common, &oid).join(&oid.as_str()[2..]);
        let synced = sync_loose_objects(&common, std::slice::from_ref(&oid), true).unwrap();
        assert_eq!(
            synced.into_iter().collect::<BTreeSet<_>>(),
            BTreeSet::from([file.clone(), fanout(&common, &oid), common.join("objects")])
        );
        assert!(sync_loose_objects(&common, std::slice::from_ref(&oid), true).unwrap().is_empty());
        // A recreated loose file is a different file at the same name.
        fs::remove_file(&file).unwrap();
        assert_eq!(write(&dir, b"one"), oid);
        assert_eq!(sync_loose_objects(&common, &[oid], true).unwrap().len(), 3);
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn an_object_git_already_fsynced_gets_only_its_directories_synced() {
        let (dir, common) = scratch("git-synced");
        let oid = write(&dir, b"two");
        let synced = sync_loose_objects(&common, std::slice::from_ref(&oid), false).unwrap();
        assert_eq!(
            synced.into_iter().collect::<BTreeSet<_>>(),
            BTreeSet::from([fanout(&common, &oid), common.join("objects")])
        );
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn several_objects_share_one_objects_dir_and_packed_objects_need_nothing() {
        let (dir, common) = scratch("many");
        let oids: Vec<_> = (0..4).map(|i| write(&dir, format!("blob {i}").as_bytes())).collect();
        let synced = sync_loose_objects(&common, &oids, true).unwrap();
        assert_eq!(synced.iter().filter(|p| **p == common.join("objects")).count(), 1);
        assert_eq!(synced.iter().filter(|p| p.is_file()).count(), 4);
        git(&dir, &["repack", "-adq"], b"");
        git(&dir, &["prune-packed"], b"");
        assert!(sync_loose_objects(&common, &oids, true).unwrap().is_empty());
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn an_empty_or_non_zlib_loose_file_is_reported_and_never_synced() {
        let (dir, common) = scratch("corrupt");
        let (empty, garbage, good) = (write(&dir, b"e"), write(&dir, b"g"), write(&dir, b"ok"));
        let file = |oid: &Oid| fanout(&common, oid).join(&oid.as_str()[2..]);
        for (oid, bytes) in [(&empty, &b""[..]), (&garbage, &b"not zlib at all"[..])] {
            fs::set_permissions(file(oid), std::os::unix::fs::PermissionsExt::from_mode(0o644)).unwrap();
            fs::write(file(oid), bytes).unwrap();
        }
        let oids = [empty.clone(), garbage.clone(), good.clone()];
        assert_eq!(corrupt_loose_objects(&common, &oids).unwrap(), vec![empty, garbage]);
        let error = sync_loose_objects(&common, &oids, true).unwrap_err();
        assert_eq!(error.to_string(), "object-file-corrupt");
        assert!(sync_loose_objects(&common, &[good], true).is_ok());
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn a_symlinked_fanout_directory_is_refused() {
        let (dir, common) = scratch("symlink");
        let oid = write(&dir, b"linked");
        let fanout = fanout(&common, &oid);
        let moved = dir.join("moved");
        fs::rename(&fanout, &moved).unwrap();
        std::os::unix::fs::symlink(&moved, &fanout).unwrap();
        let error = sync_loose_objects(&common, &[oid], true).unwrap_err();
        assert!(error.to_string().contains("untrusted-object"), "{error}");
        fs::remove_dir_all(&dir).unwrap();
    }
}
