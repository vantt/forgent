use fgos_distribution::manifest::{
    native_addon_crate_checksums, ManifestFileEntry, NativeAddonComponent, ReleaseManifest,
};
use fgos_distribution::verify::{verify_legacy_node, verify_native_addon, VerificationError};
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
    verify_native_addon(&root, &manifest).unwrap();
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
        assert!(verify_native_addon(&root, &bad).is_err(), "{field}");
    }
    std::fs::write(root.join("native/fgos.node"), b"tampered").unwrap();
    assert!(matches!(
        verify_native_addon(&root, &manifest),
        Err(VerificationError::FileDigestMismatch { .. })
    ));
    // Existing staging, preflight and host readers use this admission door.
    assert!(matches!(
        verify_legacy_node(&root, &manifest),
        Err(VerificationError::FileDigestMismatch { .. })
    ));
    std::fs::remove_file(root.join("native/fgos.node")).unwrap();
    assert!(matches!(
        verify_native_addon(&root, &manifest),
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
        verify_native_addon(&root, &manifest),
        Err(VerificationError::SymlinkRefused { .. })
    ));
    std::fs::remove_file(root.join("native/fgos.node")).unwrap();
    std::fs::rename(root.join("real.node"), root.join("native/fgos.node")).unwrap();
    std::fs::rename(root.join("native"), root.join("real")).unwrap();
    std::os::unix::fs::symlink(root.join("real"), root.join("native")).unwrap();
    assert!(matches!(
        verify_native_addon(&root, &manifest),
        Err(VerificationError::SymlinkRefused { .. })
    ));
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn historical_release_without_addon_still_verifies() {
    let manifest: ReleaseManifest =
        serde_json::from_str(include_str!("goldens/release-manifest-minimal.json")).unwrap();
    manifest.validate_v1_invariants().unwrap();
    verify_native_addon(std::path::Path::new("unused-old-release"), &manifest).unwrap();
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
    verify_native_addon(&root, &manifest).unwrap();
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
