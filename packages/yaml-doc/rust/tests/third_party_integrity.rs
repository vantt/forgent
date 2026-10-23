//! Owning proof that the vendored parser sources are the bytes that were read: the digest of each
//! tree under `packages/yaml-doc/third-party/` equals the one in `upgrade-record.md` (spec section
//! 9). A changed, added or removed file, or a crate nobody recorded, fails here.
//!
//! The digest of a tree is the sha256 of its manifest: one line `<sha256 of the file>  <path>` for
//! every file under the crate directory, paths relative to it with `/` separators, sorted by byte
//! order.

use std::fs;
use std::path::{Path, PathBuf};

use sha2::{Digest, Sha256};

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn files_under(dir: &Path, out: &mut Vec<PathBuf>) {
    for entry in fs::read_dir(dir).unwrap_or_else(|e| panic!("{}: {e}", dir.display())) {
        let path = entry.expect("directory entry").path();
        let kind = fs::symlink_metadata(&path).expect("metadata").file_type();
        assert!(
            !kind.is_symlink(),
            "{}: a vendored tree holds no symlink",
            path.display()
        );
        if kind.is_dir() {
            files_under(&path, out);
        } else {
            out.push(path);
        }
    }
}

/// The tree digest and the file count of one vendored crate.
fn tree_digest(root: &Path) -> (String, usize) {
    let mut files = Vec::new();
    files_under(root, &mut files);
    let mut entries: Vec<(String, String)> = files
        .iter()
        .map(|path| {
            let rel = path
                .strip_prefix(root)
                .expect("under root")
                .components()
                .map(|c| c.as_os_str().to_string_lossy().into_owned())
                .collect::<Vec<_>>()
                .join("/");
            let bytes = fs::read(path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
            (rel, hex(&Sha256::digest(bytes)))
        })
        .collect();
    entries.sort_by(|a, b| a.0.as_bytes().cmp(b.0.as_bytes()));
    let manifest: String = entries
        .iter()
        .map(|(rel, digest)| format!("{digest}  {rel}\n"))
        .collect();
    (hex(&Sha256::digest(manifest.as_bytes())), entries.len())
}

/// `(directory name, digest, file count)` of every integrity line of the record: a line holding
/// `third-party/<dir>`, ``tree-sha256 `<64 hex>` `` and `(<n> files)`.
fn recorded(record: &str) -> Vec<(String, String, usize)> {
    record
        .lines()
        .filter_map(|line| {
            let dir = line
                .split("third-party/")
                .nth(1)?
                .split(['`', ' '])
                .next()?;
            let digest = line.split("tree-sha256 `").nth(1)?.get(..64)?;
            let count = line
                .split('(')
                .next_back()?
                .split(" files)")
                .next()?
                .parse()
                .ok()?;
            Some((dir.to_string(), digest.to_string(), count))
        })
        .collect()
}

#[test]
fn vendored_trees_are_the_bytes_the_upgrade_record_names() {
    let package = Path::new(env!("CARGO_MANIFEST_DIR")).join("..");
    let record = fs::read_to_string(package.join("upgrade-record.md")).expect("upgrade record");
    let mut recorded = recorded(&record);
    recorded.sort();
    let vendor = package.join("third-party");
    let mut on_disk: Vec<String> = fs::read_dir(&vendor)
        .expect("third-party directory")
        .map(|e| e.expect("entry").file_name().to_string_lossy().into_owned())
        .collect();
    on_disk.sort();
    let named: Vec<&str> = recorded.iter().map(|(dir, ..)| dir.as_str()).collect();
    assert_eq!(
        on_disk, named,
        "the record names exactly the vendored crates"
    );
    for (dir, digest, count) in &recorded {
        let (got, files) = tree_digest(&vendor.join(dir));
        assert_eq!(
            &got, digest,
            "{dir}: tree digest differs from the upgrade record"
        );
        assert_eq!(
            files, *count,
            "{dir}: file count differs from the upgrade record"
        );
    }
}
