//! The one door to the writer shards in `.fgos/observe/<store>/<writerId>.jsonl`.
//!
//! Every Observe store (friction, cases, evals, snapshots) appends and reads
//! through here, so one rule set holds for all of them: no component of the
//! store path and no shard is followed through a link, a bad line is named and
//! skipped instead of stopping the store, and a torn last line is dealt with
//! before the next record lands on it.
//!
//! Residual race: the directory checks and the open are separate calls, so a
//! directory swapped between them can still be followed. Closing it would need
//! `openat`-relative appends, a write API `fgos-durable-file` does not have.

use std::fs::{self, File, OpenOptions};
use std::io::{self, BufRead, BufReader, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};

use fgos_identity::{resolve_current, Source};
use serde::Serialize;
use serde_json::Value;

/// Longest accepted record line; a longer one is never written and is named
/// and skipped on read.
pub const MAX_LINE_BYTES: usize = 1024 * 1024;

const NOT_REGULAR: &str = "shard must be a regular file, not a symlink";

/// What an append does when the shard's last byte is not a newline (a writer
/// died mid-line).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TornTail {
    /// Start the new record on a fresh line; the torn line stays in the file
    /// and is named and skipped on read.
    Heal,
    /// Refuse and leave the shard untouched.
    Refuse,
}

/// What a read does with a symlinked or non-regular shard.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UnsafeShard {
    /// The whole read fails, naming the shard.
    Fail,
    /// The shard is listed as invalid at line 0 and never read.
    Report,
}

/// One line (or, at line 0, one whole shard) the door could not use.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvalidLine {
    /// Path relative to the project root.
    pub file: String,
    pub line: usize,
    pub reason: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StoredRecord {
    pub value: Value,
    /// Writer shard file stem.
    pub shard: String,
    /// 1-based line in the shard.
    pub line: usize,
}

#[derive(Debug, Default)]
pub struct StoreRead {
    /// Shard-name order, then line order.
    pub records: Vec<StoredRecord>,
    pub invalid: Vec<InvalidLine>,
}

/// Shard file stem for the current process's writer, from the session
/// identity authority: the session id itself for an `env`/`registry`
/// identity, `pid-<id>` for a `pid`/`unresolved` one.
pub fn writer_shard_name() -> String {
    let identity = resolve_current(None);
    match identity.source {
        Source::Env | Source::Registry => identity.id.to_string(),
        Source::Pid | Source::Unresolved => format!("pid-{}", identity.id),
    }
}

/// Whether `shard` is named for a session id, which is unique across machines
/// (a `pid-<N>` shard is not).
pub fn is_session_shard(shard: &str) -> bool {
    !shard.starts_with("pid-")
}

fn not_regular(path: &Path) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidInput, format!("{NOT_REGULAR}: {}", path.display()))
}

/// Preflights `<root>/.fgos/observe/<store>` component by component without
/// following links. `create` makes missing directories (writers only); a
/// missing directory otherwise answers `None`.
fn store_dir(root: &Path, store: &str, create: bool) -> io::Result<Option<PathBuf>> {
    let mut path = root.to_path_buf();
    for component in [".fgos", "observe", store] {
        path.push(component);
        if create {
            match fs::create_dir(&path) {
                Ok(()) => {}
                Err(e) if e.kind() == io::ErrorKind::AlreadyExists => {}
                Err(e) => return Err(e),
            }
        }
        match fs::symlink_metadata(&path) {
            Ok(metadata) if metadata.file_type().is_dir() => {}
            Ok(_) => {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidInput,
                    format!("observe store component must be a real directory: {}", path.display()),
                ))
            }
            Err(e) if !create && e.kind() == io::ErrorKind::NotFound => return Ok(None),
            Err(e) => return Err(e),
        }
    }
    Ok(Some(path))
}

/// The current writer's shard path, creating the store directories first.
pub fn shard_path(root: &Path, store: &str) -> io::Result<PathBuf> {
    let dir = store_dir(root, store, true)?.expect("created store directory exists");
    let writer = writer_shard_name();
    let mut components = Path::new(&writer).components();
    if writer.contains(['/', '\\'])
        || !matches!(components.next(), Some(std::path::Component::Normal(_)))
        || components.next().is_some()
    {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "writer identifier must be a single filename component",
        ));
    }
    Ok(dir.join(format!("{writer}.jsonl")))
}

/// Opens a regular file without following a link: a non-regular entry is
/// refused before opening, `O_NOFOLLOW` closes the final-component race on
/// Unix (`O_NONBLOCK` keeps a raced FIFO from hanging the open), and the
/// opened descriptor is checked again. Other hosts have only the metadata
/// check (a check-then-open race).
fn open_regular(path: &Path, options: &mut OpenOptions) -> io::Result<File> {
    match fs::symlink_metadata(path) {
        Ok(metadata) if !metadata.file_type().is_file() => return Err(not_regular(path)),
        Ok(_) => {}
        Err(e) if e.kind() == io::ErrorKind::NotFound => {}
        Err(e) => return Err(e),
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
    }
    let file = options.open(path)?;
    if !file.metadata()?.is_file() {
        return Err(not_regular(path));
    }
    Ok(file)
}

/// One record as a line: compact JSON, at most [`MAX_LINE_BYTES`], then `\n`.
pub fn encode_line<T: Serialize>(record: &T) -> Result<Vec<u8>, String> {
    let mut line = serde_json::to_vec(record).map_err(|e| e.to_string())?;
    if line.len() > MAX_LINE_BYTES {
        return Err("record exceeds the 1 MiB line limit".to_string());
    }
    line.push(b'\n');
    Ok(line)
}

/// Appends encoded `lines` to the current writer's shard of `store` in one
/// write and syncs it. The caller holds the store lock and only ever appends to
/// its own writer shard. Returns the shard path.
pub fn append_lines(root: &Path, store: &str, tail: TornTail, lines: &[Vec<u8>]) -> io::Result<PathBuf> {
    let path = shard_path(root, store)?;
    let mut file = open_regular(&path, OpenOptions::new().read(true).append(true).create(true))?;
    let mut buffer = Vec::new();
    if file.metadata()?.len() > 0 {
        let mut last = [0u8; 1];
        file.seek(SeekFrom::End(-1))?;
        file.read_exact(&mut last)?;
        if last[0] != b'\n' {
            match tail {
                TornTail::Heal => buffer.push(b'\n'),
                TornTail::Refuse => {
                    return Err(io::Error::new(
                        io::ErrorKind::InvalidData,
                        format!("shard ends in a torn line: {}", path.display()),
                    ))
                }
            }
        }
    }
    for line in lines {
        buffer.extend_from_slice(line);
    }
    file.write_all(&buffer)?;
    file.sync_all()?;
    Ok(path)
}

/// Retains at most cap+1 bytes of a logical line, draining an overflowing one
/// in place. Returns `None` at EOF, otherwise whether the line exceeded the cap.
fn read_bounded_line(reader: &mut impl BufRead, line: &mut Vec<u8>) -> io::Result<Option<bool>> {
    line.clear();
    let mut seen = false;
    let mut overflow = false;
    loop {
        let buffer = reader.fill_buf()?;
        if buffer.is_empty() {
            return Ok(seen.then_some(overflow));
        }
        seen = true;
        let newline = buffer.iter().position(|byte| *byte == b'\n');
        let content_len = newline.unwrap_or(buffer.len());
        let remaining = (MAX_LINE_BYTES + 1).saturating_sub(line.len());
        let retained = content_len.min(remaining);
        line.extend_from_slice(&buffer[..retained]);
        overflow |= retained < content_len || line.len() > MAX_LINE_BYTES;
        let consumed = content_len + usize::from(newline.is_some());
        reader.consume(consumed);
        if newline.is_some() {
            return Ok(Some(overflow));
        }
    }
}

fn relative(root: &Path, path: &Path) -> String {
    path.strip_prefix(root).unwrap_or(path).to_string_lossy().into_owned()
}

/// Reads every `.jsonl` shard of `store`. A missing store directory is empty;
/// a symlinked directory component, an I/O error, or (with
/// [`UnsafeShard::Fail`]) an unsafe shard is an error. A line that is too long,
/// not UTF-8 or not JSON never stops the read: it is returned in `invalid`.
pub fn read_store(root: &Path, store: &str, unsafe_shard: UnsafeShard) -> io::Result<StoreRead> {
    let mut result = StoreRead::default();
    let Some(dir) = store_dir(root, store, false)? else {
        return Ok(result);
    };
    let mut shards = Vec::new();
    for entry in fs::read_dir(&dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) != Some("jsonl") {
            continue;
        }
        // `DirEntry::file_type` does not follow a link.
        if entry.file_type()?.is_file() {
            shards.push(path);
        } else if unsafe_shard == UnsafeShard::Fail {
            return Err(not_regular(&path));
        } else {
            result.invalid.push(InvalidLine {
                file: relative(root, &path),
                line: 0,
                reason: NOT_REGULAR.to_string(),
            });
        }
    }
    shards.sort();
    for path in shards {
        let shard = path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
        let mut reader = BufReader::new(open_regular(&path, OpenOptions::new().read(true))?);
        let mut bytes = Vec::new();
        let mut line = 0;
        while let Some(overflow) = read_bounded_line(&mut reader, &mut bytes)? {
            line += 1;
            let parsed = if overflow {
                Err("line exceeds the 1 MiB limit".to_string())
            } else if bytes.iter().all(u8::is_ascii_whitespace) {
                continue;
            } else {
                serde_json::from_slice::<Value>(&bytes).map_err(|e| e.to_string())
            };
            match parsed {
                Ok(value) => result.records.push(StoredRecord { value, shard: shard.clone(), line }),
                Err(reason) => {
                    result.invalid.push(InvalidLine { file: relative(root, &path), line, reason })
                }
            }
        }
    }
    Ok(result)
}

/// Names each skipped line on stderr; the reading verb calls this, never the
/// door, so a store that reports its own invalid lines (evals) stays quiet.
pub fn warn_skipped(store: &str, invalid: &[InvalidLine]) {
    for item in invalid {
        eprintln!("fgos: warning: observe {store}: skipped {}:{}: {}", item.file, item.line, item.reason);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn temp_root(tag: &str) -> PathBuf {
        let tmp = std::env::temp_dir().join(format!("fgos-test-shard-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();
        tmp
    }

    fn lines(values: &[Value]) -> Vec<Vec<u8>> {
        values.iter().map(|v| encode_line(v).unwrap()).collect()
    }

    fn dir(root: &Path, store: &str) -> PathBuf {
        root.join(".fgos/observe").join(store)
    }

    #[test]
    fn appended_lines_read_back_in_shard_then_line_order() {
        let tmp = temp_root("roundtrip");
        let path = append_lines(&tmp, "s", TornTail::Heal, &lines(&[json!({"n": 1}), json!({"n": 2})])).unwrap();
        assert!(path.to_string_lossy().ends_with(".jsonl"));
        fs::write(dir(&tmp, "s").join("zzzz-last.jsonl"), "{\"n\":0}\n").unwrap();

        let read = read_store(&tmp, "s", UnsafeShard::Fail).unwrap();
        let order: Vec<_> = read.records.iter().map(|r| (r.shard.clone(), r.line, r.value["n"].clone())).collect();
        assert_eq!((order[0].1, order[1].1), (1, 2));
        assert_eq!(order[2], ("zzzz-last".to_string(), 1, json!(0)));
        assert!(read.invalid.is_empty());
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn a_missing_store_reads_as_empty_and_is_not_created() {
        let tmp = temp_root("missing");
        let read = read_store(&tmp, "s", UnsafeShard::Fail).unwrap();
        assert!(read.records.is_empty() && read.invalid.is_empty());
        assert!(!tmp.join(".fgos").exists());
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn a_bad_line_is_named_and_the_good_lines_around_it_still_read() {
        let tmp = temp_root("bad-lines");
        let mut bytes = b"{\"n\":1}\n".to_vec();
        bytes.extend_from_slice(b"{\"detail\":\"c\xe1\xbb\n"); // invalid UTF-8
        bytes.extend_from_slice(b"{not json}\n\n");
        bytes.extend_from_slice(&vec![b'x'; MAX_LINE_BYTES + 10]);
        bytes.extend_from_slice(b"\n{\"n\":2}\n");
        fs::create_dir_all(dir(&tmp, "s")).unwrap();
        fs::write(dir(&tmp, "s").join("w.jsonl"), bytes).unwrap();

        let read = read_store(&tmp, "s", UnsafeShard::Fail).unwrap();
        let good: Vec<_> = read.records.iter().map(|r| (r.line, r.value["n"].clone())).collect();
        assert_eq!(good, vec![(1, json!(1)), (6, json!(2))]);
        let bad: Vec<_> = read.invalid.iter().map(|i| i.line).collect();
        assert_eq!(bad, vec![2, 3, 5]);
        assert!(read.invalid[2].reason.contains("1 MiB"));
        assert!(read.invalid.iter().all(|i| i.file == ".fgos/observe/s/w.jsonl"));
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn a_torn_last_line_is_healed_before_the_next_append_or_refused_untouched() {
        let tmp = temp_root("torn");
        let path = shard_path(&tmp, "s").unwrap();
        fs::write(&path, "{\"n\":1}\n{\"n\":2").unwrap();

        let refused = append_lines(&tmp, "s", TornTail::Refuse, &lines(&[json!({"n": 3})])).unwrap_err();
        assert!(refused.to_string().contains("torn line"), "{refused}");
        assert_eq!(fs::read_to_string(&path).unwrap(), "{\"n\":1}\n{\"n\":2");

        append_lines(&tmp, "s", TornTail::Heal, &lines(&[json!({"n": 3})])).unwrap();
        let read = read_store(&tmp, "s", UnsafeShard::Fail).unwrap();
        let good: Vec<_> = read.records.iter().map(|r| r.value["n"].clone()).collect();
        assert_eq!(good, vec![json!(1), json!(3)]);
        assert_eq!(read.invalid.len(), 1);
        assert_eq!(read.invalid[0].line, 2);
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn a_record_over_the_line_limit_is_never_encoded() {
        let error = encode_line(&json!({ "detail": "x".repeat(MAX_LINE_BYTES) })).unwrap_err();
        assert!(error.contains("1 MiB"), "{error}");
    }

    #[cfg(unix)]
    #[test]
    fn a_symlinked_shard_is_refused_for_append_and_read_and_its_target_never_changes() {
        let tmp = temp_root("symlink-shard");
        let external = temp_root("symlink-shard-external");
        let target = external.join("outside.jsonl");
        fs::write(&target, "{\"n\":9}\n").unwrap();
        std::os::unix::fs::symlink(&target, shard_path(&tmp, "s").unwrap()).unwrap();

        assert!(append_lines(&tmp, "s", TornTail::Heal, &lines(&[json!({"n": 1})])).is_err());
        assert_eq!(fs::read_to_string(&target).unwrap(), "{\"n\":9}\n");
        assert!(read_store(&tmp, "s", UnsafeShard::Fail).is_err());
        let reported = read_store(&tmp, "s", UnsafeShard::Report).unwrap();
        assert!(reported.records.is_empty());
        assert_eq!(reported.invalid.len(), 1);
        assert_eq!(reported.invalid[0].line, 0);
        let _ = fs::remove_dir_all(&tmp);
        let _ = fs::remove_dir_all(&external);
    }

    #[cfg(unix)]
    #[test]
    fn a_symlinked_store_directory_is_refused_for_append_and_read() {
        let tmp = temp_root("symlink-dir");
        let external = temp_root("symlink-dir-external");
        fs::write(external.join("planted.jsonl"), "{\"n\":9}\n").unwrap();
        fs::create_dir_all(tmp.join(".fgos/observe")).unwrap();
        std::os::unix::fs::symlink(&external, dir(&tmp, "s")).unwrap();

        let appended = append_lines(&tmp, "s", TornTail::Heal, &lines(&[json!({"n": 1})])).unwrap_err();
        assert!(appended.to_string().contains("real directory"), "{appended}");
        assert!(read_store(&tmp, "s", UnsafeShard::Report).unwrap_err().to_string().contains("real directory"));
        assert_eq!(fs::read_dir(&external).unwrap().count(), 1);
        let _ = fs::remove_dir_all(&tmp);
        let _ = fs::remove_dir_all(&external);
    }
}
