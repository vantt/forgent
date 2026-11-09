use fgos_distribution::manifest::{
    native_addon_crate_checksums, ManifestFileEntry, NativeAddonComponent, ReleaseManifest,
};
use fgos_distribution::verify::{
    verify_release_files, verify_release_files_except_running, VerificationError,
};
use sha2::{Digest, Sha256};

fn fixture() -> (std::path::PathBuf, ReleaseManifest) {
    let root = std::env::temp_dir().join(format!(
        "fgos-addon-{}-{:?}",
        std::process::id(),
        std::thread::current().id()
    ));
    let _ = std::fs::remove_dir_all(&root);
    std::fs::create_dir_all(root.join("native")).unwrap();
    std::fs::write(root.join("native/fgos.node"), b"addon bytes").unwrap();
    let mut manifest: ReleaseManifest =
        serde_json::from_str(include_str!("goldens/release-manifest-minimal.json")).unwrap();
    let digest = format!("{:x}", Sha256::digest(b"addon bytes"));
    manifest.components.native_addon = Some(NativeAddonComponent {
        capabilities: vec!["git-wal-v1".into()],
        path: "native/fgos.node".into(),
        digest: digest.clone(),
        target: "linux-x64".into(),
        napi_version: 8,
        crate_checksums: native_addon_crate_checksums(),
    });
    manifest.files.push(ManifestFileEntry {
        path: "native/fgos.node".into(),
        digest: format!("sha256:{digest}"),
        kind: "file".into(),
        mode: "644".into(),
        class: "immutable-runtime".into(),
    });
    (root, manifest)
}

#[test]
fn native_addon_verifies_bytes_and_abi_and_locked_provenance() {
    let (root, manifest) = fixture();
    assert_eq!(native_addon_crate_checksums().len(), 3);
    manifest.validate_v1_invariants().unwrap();
    verify_release_files(&root, &manifest).unwrap();
    for field in ["target", "napi", "checksum", "path", "digest", "unlisted"] {
        let mut bad = manifest.clone();
        let addon = bad.components.native_addon.as_mut().unwrap();
        match field {
            "target" => addon.target = "win32-x64".into(),
            "napi" => addon.napi_version = 9,
            "checksum" => addon.crate_checksums.clear(),
            "path" => addon.path = "../fgos.node".into(),
            "digest" => addon.digest = "0".repeat(64),
            "unlisted" => bad.files.clear(),
            _ => unreachable!(),
        }
        assert!(bad.validate_v1_invariants().is_err(), "{field}");
        assert!(bad.validate_native_addon_invariant().is_err(), "{field}");
    }
    std::fs::write(root.join("native/fgos.node"), b"tampered").unwrap();
    // The addon's bytes are read once, by the full file verifier; the legacy node
    // check only accepts its proof.
    assert!(matches!(
        verify_release_files(&root, &manifest),
        Err(VerificationError::FileDigestMismatch { .. })
    ));
    std::fs::remove_file(root.join("native/fgos.node")).unwrap();
    assert!(matches!(
        verify_release_files(&root, &manifest),
        Err(VerificationError::MissingFile { .. })
    ));
    std::fs::remove_dir_all(root).unwrap();
}

#[cfg(unix)]
#[test]
fn native_addon_refuses_file_and_directory_symlinks() {
    let (root, manifest) = fixture();
    std::fs::rename(root.join("native/fgos.node"), root.join("real.node")).unwrap();
    std::os::unix::fs::symlink(root.join("real.node"), root.join("native/fgos.node")).unwrap();
    assert!(matches!(
        verify_release_files(&root, &manifest),
        Err(VerificationError::SymlinkRefused { .. })
    ));
    std::fs::remove_file(root.join("native/fgos.node")).unwrap();
    std::fs::rename(root.join("real.node"), root.join("native/fgos.node")).unwrap();
    std::fs::rename(root.join("native"), root.join("real")).unwrap();
    std::os::unix::fs::symlink(root.join("real"), root.join("native")).unwrap();
    assert!(matches!(
        verify_release_files(&root, &manifest),
        Err(VerificationError::SymlinkRefused { .. })
    ));
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn historical_release_without_addon_still_verifies() {
    let manifest: ReleaseManifest =
        serde_json::from_str(include_str!("goldens/release-manifest-minimal.json")).unwrap();
    manifest.validate_v1_invariants().unwrap();
    manifest.validate_native_addon_invariant().unwrap();
}

#[test]
fn native_addon_accepts_cross_release_toolchain_attestation_but_rejects_bad_shape() {
    let (root, mut manifest) = fixture();
    let checksums = &mut manifest
        .components
        .native_addon
        .as_mut()
        .unwrap()
        .crate_checksums;
    *checksums = ["napi@99.0.0", "napi-build@99.1.0", "napi-derive@98.0.0"]
        .into_iter()
        .map(|name| (name.into(), "a".repeat(64)))
        .collect();
    manifest.validate_v1_invariants().unwrap();
    manifest.validate_native_addon_invariant().unwrap();
    manifest
        .components
        .native_addon
        .as_mut()
        .unwrap()
        .crate_checksums
        .insert("napi@99.0.0".into(), "bad".into());
    assert!(manifest.validate_v1_invariants().is_err());
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn running_executable_is_not_rehashed_but_every_other_file_still_is() {
    let (root, mut manifest) = fixture();
    std::fs::create_dir_all(root.join("bin")).unwrap();
    std::fs::write(root.join("bin/fgos"), b"host bytes").unwrap();
    manifest.files.push(ManifestFileEntry {
        path: "bin/fgos".into(),
        digest: format!("sha256:{:x}", Sha256::digest(b"host bytes")),
        kind: "file".into(),
        mode: "755".into(),
        class: "immutable-entry".into(),
    });
    let host = root.join("bin/fgos");
    verify_release_files_except_running(&root, &manifest, &host).unwrap();

    // The running file is the only one skipped: its own tamper is left to the
    // boundaries that hash it, a tampered addon byte is still refused.
    std::fs::write(&host, b"tampered host").unwrap();
    verify_release_files_except_running(&root, &manifest, &host).unwrap();
    assert!(matches!(
        verify_release_files(&root, &manifest),
        Err(VerificationError::FileDigestMismatch { .. })
    ));
    std::fs::write(root.join("native/fgos.node"), b"tampered").unwrap();
    assert!(matches!(
        verify_release_files_except_running(&root, &manifest, &host),
        Err(VerificationError::FileDigestMismatch { .. })
    ));
    std::fs::remove_dir_all(root).unwrap();
}
