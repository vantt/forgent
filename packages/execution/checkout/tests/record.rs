//! The record key and identity arithmetic, and the record layout Node wrote.
use fgos_checkout::record::{
    canonical_text, js_number_text, normalize_posix, normalize_win32, record_key,
    strip_extended_prefix, Placed, Record,
};

#[test]
fn record_key_is_the_sha256_of_the_path_text_node_hashed() {
    // The name Node's provisionWorktree gave the record of the checkout at this path.
    assert_eq!(
        record_key("/tmp/fx-0mM5vV/wt"),
        "9afee69c4dd5d5db5820a00ba3ff3d34365a595adba979925bde249a4bbcd121"
    );
}

#[test]
fn a_verbatim_windows_prefix_is_stripped_before_the_key_is_taken() {
    assert_eq!(strip_extended_prefix("\\\\?\\C:\\work\\w"), "C:\\work\\w");
    assert_eq!(
        strip_extended_prefix("\\\\?\\UNC\\srv\\share\\w"),
        "\\\\srv\\share\\w"
    );
    assert_eq!(
        canonical_text("\\\\?\\C:\\work\\.\\a\\..\\w", true),
        "C:\\work\\w"
    );
    assert_eq!(
        canonical_text("\\\\?\\UNC\\srv\\share\\x\\..\\w", true),
        "\\\\srv\\share\\w"
    );
    assert_eq!(
        record_key(&canonical_text("\\\\?\\C:\\work\\w", true)),
        record_key("C:\\work\\w")
    );
}

#[test]
fn normalize_folds_dots_and_separators_the_way_node_path_does() {
    assert_eq!(normalize_posix("/a//b/./c/../d"), "/a/b/d");
    assert_eq!(normalize_posix("/a/b/"), "/a/b/");
    assert_eq!(normalize_posix("/.."), "/");
    assert_eq!(normalize_posix("a/../.."), "..");
    assert_eq!(normalize_posix(""), ".");
    assert_eq!(normalize_win32("C:/a//b/../c"), "C:\\a\\c");
    assert_eq!(normalize_win32("c:\\"), "c:\\");
    assert_eq!(normalize_win32("\\\\srv\\share"), "\\\\srv\\share\\");
}

#[test]
fn an_inode_above_two_to_the_53_is_written_as_the_digits_a_js_number_prints() {
    assert_eq!(js_number_text(496), "496");
    assert_eq!(js_number_text(9_007_199_254_740_993), "9007199254740992");
    assert_eq!(
        js_number_text(1_152_921_504_606_846_977),
        "1152921504606847000"
    );
    assert_eq!(js_number_text(u64::MAX), "18446744073709552000");
}

#[test]
fn a_record_written_here_has_the_bytes_node_wrote_for_the_same_layout() {
    let node = include_str!("fixtures/node-provisioned-record.json");
    let parsed = Record::from_text(node).expect("the node record parses");
    assert_eq!(parsed.worktree, "/tmp/fx-0mM5vV/wt");
    assert_eq!((parsed.dev, parsed.ino), (147, 496));
    assert!(parsed.regenerable.is_empty() && !parsed.disposable);
    assert_eq!(parsed.placed.len(), 5);
    assert!(matches!(&parsed.placed[4], Placed::Symlink { target, .. } if target == "a.txt"));
    assert_eq!(parsed.to_text().unwrap(), node);
}

#[test]
fn a_disposable_record_with_a_regenerable_directory_round_trips() {
    let record = Record {
        worktree: "/w".into(),
        dev: u64::MAX,
        ino: 9_007_199_254_740_993,
        regenerable: vec!["node_modules".into()],
        placed: vec![Placed::File {
            path: "f".into(),
            sha256: "ab".into(),
        }],
        disposable: true,
    };
    let text = record.to_text().unwrap();
    assert!(text.contains("\"dev\": 18446744073709552000,\n    \"ino\": 9007199254740992\n"));
    assert!(text.contains("\"disposable\": true"));
    let back = Record::from_text(&text).unwrap();
    // Identity survives as the f64 Node compares: the same rounded value, not the original integer.
    assert_eq!(back.ino as f64, 9_007_199_254_740_993_u64 as f64);
    assert_eq!(back.regenerable, record.regenerable);
    assert_eq!(back.placed, record.placed);
}
