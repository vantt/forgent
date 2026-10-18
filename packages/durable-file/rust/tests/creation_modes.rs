#[cfg(unix)]
#[test]
fn caller_mode_preserves_umask_for_install_and_replace() {
    use fgos_durable_file::{install_once, install_once_with_mode, replace_durably_with_mode};
    use std::os::unix::fs::PermissionsExt;
    let dir = std::env::temp_dir().join(format!("fgos-durable-modes-{}", std::process::id()));
    std::fs::create_dir_all(&dir).unwrap();
    std::fs::write(dir.join("ordinary"), b"reference").unwrap();
    let ordinary_mode = std::fs::metadata(dir.join("ordinary"))
        .unwrap()
        .permissions()
        .mode()
        & 0o777;
    install_once_with_mode(&dir, "record", b"first", 0o666).unwrap();
    assert_eq!(
        std::fs::metadata(dir.join("record"))
            .unwrap()
            .permissions()
            .mode()
            & 0o777,
        ordinary_mode
    );
    replace_durably_with_mode(&dir, "record", b"second", 0o666).unwrap();
    assert_eq!(
        std::fs::metadata(dir.join("record"))
            .unwrap()
            .permissions()
            .mode()
            & 0o777,
        ordinary_mode
    );
    assert_eq!(std::fs::read(dir.join("record")).unwrap(), b"second");
    install_once(&dir, "private", b"private").unwrap();
    assert_eq!(
        std::fs::metadata(dir.join("private"))
            .unwrap()
            .permissions()
            .mode()
            & 0o777,
        ordinary_mode & 0o600
    );
    std::fs::remove_dir_all(dir).unwrap();
}
