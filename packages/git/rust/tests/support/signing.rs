// Real signed objects ensure log.showSignature would prefix formatted reads.
fn enable_signing(root: &std::path::Path, temp: &std::path::Path) {
    let key = temp.join("signing-key");
    let output = std::process::Command::new("ssh-keygen")
        .args(["-q", "-t", "ed25519", "-N", "", "-f"])
        .arg(&key).output().unwrap();
    assert!(output.status.success(), "{}", String::from_utf8_lossy(&output.stderr));
    let allowed = temp.join("allowed-signers");
    std::fs::write(&allowed, format!("fixture@example.invalid {}", std::fs::read_to_string(key.with_extension("pub")).unwrap())).unwrap();
    for (name, value) in [
        ("gpg.format", "ssh"),
        ("user.signingkey", key.to_str().unwrap()),
        ("gpg.ssh.allowedSignersFile", allowed.to_str().unwrap()),
        ("commit.gpgSign", "true"),
        ("log.showSignature", "true"),
        ("log.decorate", "full"),
        ("color.ui", "always"),
    ] {
        git(root, &["config", name, value]);
    }
}
